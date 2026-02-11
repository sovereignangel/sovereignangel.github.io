"""
Garmin → Firestore Sync
=======================
Fetches health metrics from Garmin Connect and writes them to Firestore
for the Thesis Engine dashboard.

Setup:
    1. pip install -r requirements.txt
    2. Place Firebase service account key at ./firebase-service-account.json
    3. Copy .env.example to .env and fill in credentials
    4. Run: python garmin_sync.py [--date YYYY-MM-DD] [--range DAYS]

First run with MFA:
    import garth
    garth.login("your@email.com", "password")  # Will prompt for MFA code
    garth.client.dump("./garmin_tokens")
"""

import os
import sys
import logging
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional, List

# Load .env file if present
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger(__name__)


# ─── Garmin Client ────────────────────────────────────────────────────────

@dataclass
class HealthSnapshot:
    """A point-in-time health measurement from Garmin."""
    date: str
    source: str = "garmin"

    # Heart metrics
    restingHeartRate: Optional[int] = None
    hrvRmssd: Optional[float] = None
    hrvWeeklyAvg: Optional[float] = None

    # Sleep metrics
    sleepScore: Optional[int] = None
    deepSleepMinutes: Optional[int] = None
    lightSleepMinutes: Optional[int] = None
    remSleepMinutes: Optional[int] = None
    awakeMinutes: Optional[int] = None

    # Activity metrics
    steps: Optional[int] = None
    activeCalories: Optional[int] = None
    stressLevel: Optional[int] = None
    bodyBattery: Optional[int] = None

    # Respiratory
    respirationRate: Optional[float] = None
    spo2: Optional[float] = None

    def to_dict(self):
        """Return dict with None values stripped."""
        return {k: v for k, v in asdict(self).items() if v is not None}


class GarminClient:
    """Fetches health data from Garmin Connect."""

    def __init__(self, token_dir: str = None):
        self.client = None
        self.token_path = Path(token_dir or (Path(__file__).parent / "garmin_tokens"))

    def authenticate(self, email: str = None, password: str = None) -> bool:
        from garminconnect import Garmin
        import garth

        # Try saved tokens first
        if self.token_path.exists():
            try:
                garth.client.load(str(self.token_path))
                self.client = Garmin()
                self.client.garth = garth.client
                self.client.display_name = garth.client.profile.get("displayName", "User")
                logger.info("Authenticated with saved tokens")
                return True
            except Exception as e:
                logger.warning(f"Token auth failed: {e}")

        # Fall back to email/password
        email = email or os.environ.get("GARMIN_EMAIL")
        password = password or os.environ.get("GARMIN_PASSWORD")

        if not email or not password:
            raise ValueError(
                "Garmin credentials required. Set GARMIN_EMAIL and GARMIN_PASSWORD "
                "in scripts/.env or pass directly."
            )

        garth.login(email, password)
        self.token_path.mkdir(parents=True, exist_ok=True)
        garth.client.dump(str(self.token_path))

        self.client = Garmin()
        self.client.garth = garth.client
        self.client.display_name = garth.client.profile.get("displayName", "User")
        logger.info("Authenticated and saved tokens")
        return True

    def fetch_day(self, date_str: str) -> HealthSnapshot:
        if not self.client:
            raise RuntimeError("Not authenticated. Call authenticate() first.")

        snapshot = HealthSnapshot(date=date_str)

        # Heart rate
        try:
            hr_data = self.client.get_heart_rates(date_str)
            if hr_data:
                snapshot.restingHeartRate = hr_data.get("restingHeartRate")
        except Exception:
            pass

        # HRV
        try:
            hrv_data = self.client.get_hrv_data(date_str)
            if hrv_data and hrv_data.get("hrvSummary"):
                summary = hrv_data["hrvSummary"]
                snapshot.hrvRmssd = summary.get("lastNightAvg")
                snapshot.hrvWeeklyAvg = summary.get("weeklyAvg")
        except Exception:
            pass

        # Sleep
        try:
            sleep_data = self.client.get_sleep_data(date_str)
            if sleep_data:
                daily = sleep_data.get("dailySleepDTO", {})
                scores = daily.get("sleepScores", {})
                overall = scores.get("overall", {})
                snapshot.sleepScore = overall.get("value") if isinstance(overall, dict) else overall
                snapshot.deepSleepMinutes = daily.get("deepSleepSeconds", 0) // 60 if daily.get("deepSleepSeconds") else None
                snapshot.lightSleepMinutes = daily.get("lightSleepSeconds", 0) // 60 if daily.get("lightSleepSeconds") else None
                snapshot.remSleepMinutes = daily.get("remSleepSeconds", 0) // 60 if daily.get("remSleepSeconds") else None
                snapshot.awakeMinutes = daily.get("awakeSleepSeconds", 0) // 60 if daily.get("awakeSleepSeconds") else None
        except Exception:
            pass

        # Daily stats
        try:
            stats = self.client.get_stats(date_str)
            if stats:
                snapshot.steps = stats.get("totalSteps")
                snapshot.activeCalories = stats.get("activeKilocalories")
                snapshot.stressLevel = stats.get("averageStressLevel")
        except Exception:
            pass

        # Body battery
        try:
            bb_data = self.client.get_body_battery(date_str)
            if bb_data and len(bb_data) > 0:
                snapshot.bodyBattery = bb_data[0].get("chargedValue")
        except Exception:
            pass

        # Respiration
        try:
            resp_data = self.client.get_respiration_data(date_str)
            if resp_data:
                snapshot.respirationRate = resp_data.get("avgBreathingRate")
        except Exception:
            pass

        # SpO2
        try:
            spo2_data = self.client.get_spo2_data(date_str)
            if spo2_data:
                snapshot.spo2 = spo2_data.get("averageSpO2")
        except Exception:
            pass

        return snapshot


# ─── Firebase Writer ──────────────────────────────────────────────────────

class FirestoreWriter:
    """Writes health snapshots to Firestore."""

    def __init__(self, service_account_path: str = None):
        key_path = service_account_path or str(
            Path(__file__).parent / "firebase-service-account.json"
        )
        if not Path(key_path).exists():
            raise FileNotFoundError(
                f"Firebase service account key not found at {key_path}. "
                "Download it from Firebase Console > Project Settings > Service Accounts."
            )

        if not firebase_admin._apps:
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)

        self.db = firestore.client()

    def write_snapshot(self, uid: str, snapshot: HealthSnapshot) -> None:
        """Write a single day's metrics to Firestore."""
        ref = (
            self.db.collection("users")
            .document(uid)
            .collection("garmin_metrics")
            .document(snapshot.date)
        )

        data = snapshot.to_dict()
        data["syncedAt"] = firestore.SERVER_TIMESTAMP

        ref.set(data, merge=True)
        logger.info(f"Wrote {snapshot.date} to Firestore")

    def write_batch(self, uid: str, snapshots: List[HealthSnapshot]) -> None:
        """Write multiple days in a batch."""
        batch = self.db.batch()

        for snapshot in snapshots:
            ref = (
                self.db.collection("users")
                .document(uid)
                .collection("garmin_metrics")
                .document(snapshot.date)
            )
            data = snapshot.to_dict()
            data["syncedAt"] = firestore.SERVER_TIMESTAMP
            batch.set(ref, data, merge=True)

        batch.commit()
        logger.info(f"Batch wrote {len(snapshots)} days to Firestore")


# ─── CLI ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Sync Garmin metrics to Firestore")
    parser.add_argument("--date", help="Specific date to sync (YYYY-MM-DD). Defaults to today.")
    parser.add_argument("--range", type=int, default=1, help="Number of days to sync (counting back from --date). Default: 1")
    parser.add_argument("--uid", help="Firebase user ID. Falls back to FIREBASE_UID env var.")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )

    # Resolve UID
    uid = args.uid or os.environ.get("FIREBASE_UID")
    if not uid:
        logger.error("Firebase UID required. Pass --uid or set FIREBASE_UID in .env")
        sys.exit(1)

    # Resolve date range
    end_date = args.date or datetime.now().strftime("%Y-%m-%d")
    start_date = (
        datetime.strptime(end_date, "%Y-%m-%d") - timedelta(days=args.range - 1)
    ).strftime("%Y-%m-%d")

    # Authenticate Garmin
    garmin = GarminClient()
    garmin.authenticate()

    # Connect to Firestore
    writer = FirestoreWriter()

    # Fetch and write
    if args.range == 1:
        snapshot = garmin.fetch_day(end_date)
        writer.write_snapshot(uid, snapshot)
        print(f"\n--- {end_date} ---")
        for key, value in snapshot.to_dict().items():
            if key not in ("date", "source"):
                print(f"  {key}: {value}")
    else:
        current = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        snapshots = []

        while current <= end:
            date_str = current.strftime("%Y-%m-%d")
            try:
                snapshot = garmin.fetch_day(date_str)
                snapshots.append(snapshot)
                logger.info(f"Fetched {date_str}")
            except Exception as e:
                logger.warning(f"Failed {date_str}: {e}")
            current += timedelta(days=1)

        if snapshots:
            writer.write_batch(uid, snapshots)
            print(f"\nSynced {len(snapshots)} days ({start_date} → {end_date})")
        else:
            print("No data fetched.")


if __name__ == "__main__":
    main()
