"""
Backfill Daily Logs from Garmin Data
=====================================
Creates historical daily log entries by reading existing Garmin metrics
from Firestore and deriving what it can. Manual fields get conservative
defaults (scoring low, which is honest — we don't know what happened).

Usage:
    python scripts/backfill_daily_logs.py --range 30
    python scripts/backfill_daily_logs.py --start 2026-01-01 --end 2026-02-11
    python scripts/backfill_daily_logs.py --range 30 --dry-run

Prerequisites:
    1. Garmin data already synced: python scripts/garmin_sync.py --range 30
    2. Firebase service account key at ./firebase-service-account.json
    3. .env with FIREBASE_UID set
"""

import os
import sys
import math
import logging
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import firebase_admin
from firebase_admin import credentials, firestore

logger = logging.getLogger(__name__)

# ─── Reward Function (Python port of lib/reward.ts) ─────────────────────

REWARD_FLOOR = 0.05

NERVOUS_SYSTEM_GATE = {
    "regulated": 1.0,
    "slightly_spiked": 0.7,
    "spiked": 0.3,
}

TRAINING_SCORE = {
    "strength": 1.0,
    "yoga": 0.8,
    "vo2": 1.0,
    "zone2": 0.9,
    "rest": 0.5,
    "none": 0.2,
}

BODY_FELT_SCORE = {
    "open": 1.0,
    "neutral": 0.6,
    "tense": 0.2,
}

NS_STATE_ENERGY_SCORE = {
    "regulated": 1.0,
    "slightly_spiked": 0.5,
    "spiked": 0.1,
}

# Default project allocation (matches SEED_PROJECTS in constants.ts)
THESIS_ALLOCATION = {
    "armstrong": 0.6,
    "manifold": 0.15,
    "deep_tech": 0.05,
    "jobs": 0.01,
    "learning": 0.19,
}


def clamp(val, lo, hi):
    return max(lo, min(hi, val))


def floor_val(val):
    return max(val, REWARD_FLOOR)


def compute_ge(log):
    sleep_target = 7.5
    sleep_score = floor_val(clamp((log.get("sleepHours", 0) or 0) / sleep_target, 0, 1) if sleep_target > 0 else 0)

    types = log.get("trainingTypes", []) or []
    if not types:
        t = log.get("trainingType")
        types = [t] if t and t != "none" else []
    training = floor_val(max((TRAINING_SCORE.get(t, 0.2) for t in types), default=0.2))

    body = floor_val(BODY_FELT_SCORE.get(log.get("bodyFelt", "neutral"), 0.6))
    ns = floor_val(NS_STATE_ENERGY_SCORE.get(log.get("nervousSystemState", "regulated"), 1.0))

    return floor_val(
        math.pow(sleep_score, 0.35) *
        math.pow(training, 0.2) *
        math.pow(body, 0.2) *
        math.pow(ns, 0.25)
    )


def compute_gi(log):
    problems = log.get("problems", []) or []
    filled = sum(1 for p in problems if p.get("problem", "").strip())
    problem_score = 0.1 if filled == 0 else 0.5 if filled == 1 else 0.8 if filled == 2 else 1.0
    selected_bonus = 0.2 if (log.get("problemSelected", "") or "").strip() else 0
    return floor_val(clamp(problem_score + selected_bonus, 0, 1))


def compute_gvc(log):
    shipped_base = 0.4 if (log.get("whatShipped", "") or "").strip() else 0.05
    public_bonus = 0.2 if log.get("publicIteration") else 0
    focus_target = 6
    focus_ratio = clamp((log.get("focusHoursActual", 0) or 0) / focus_target, 0, 1) if focus_target > 0 else 0
    speed_bonus = 0.1 if log.get("speedOverPerfection") else 0

    days_out = log.get("daysSinceLastOutput", 0) or 0
    recency = 1.0 if days_out == 0 else 0.7 if days_out == 1 else 0.4 if days_out == 2 else 0.1

    raw = (shipped_base + public_bonus) * 0.35 + focus_ratio * 0.35 + recency * 0.2 + speed_bonus
    return floor_val(clamp(raw, 0, 1))


def compute_kappa(log):
    ask_quota = 2
    ask_ratio = clamp((log.get("revenueAsksCount", 0) or 0) / ask_quota, 0, 1) if ask_quota > 0 else 0
    revenue_signal = 1.0 if (log.get("revenueThisSession", 0) or 0) > 0 else 0.2
    feedback_bonus = 0.15 if log.get("feedbackLoopClosed") else 0

    stream = log.get("revenueStreamType", "one_time")
    multiplier = 1.15 if stream == "recurring" else 0.9 if stream == "organic" else 1.0

    raw = (ask_ratio * 0.5 + revenue_signal * 0.35 + feedback_bonus) * multiplier
    return floor_val(clamp(raw, 0, 1))


def compute_optionality():
    """Uses SEED_PROJECTS allocation — static for backfill."""
    shares = [0.6, 0.15, 0.05, 0.01]  # Armstrong, Manifold, Deep Tech, Jobs
    total = sum(shares)
    hhi = sum((s / total) ** 2 for s in shares)
    backup_bonus = 0.1  # Jobs + Deep Tech are backup/optionality
    return floor_val(clamp(1 - hhi + backup_bonus, 0, 1))


def compute_fragmentation(log):
    """Simplified: if spine is Armstrong, fragmentation is low."""
    focus = log.get("focusHoursActual", 0) or 0
    if focus == 0:
        return 0
    spine = (log.get("spineProject", "") or "").lower()
    # If focusing on the spine project, low fragmentation
    if spine in ("armstrong", ""):
        return 0.05  # small divergence (not perfect allocation)
    return 0.3  # higher divergence if not on spine


def compute_theta(log, recent_logs=None):
    """7-day rolling pillar engagement."""
    all_logs = list(recent_logs or []) + [log]
    touched = set()
    for l in all_logs:
        for p in (l.get("pillarsTouched", []) or []):
            touched.add(p)
    count = len(touched)
    return 0.0 if count == 0 else 0.33 if count == 1 else 0.67 if count == 2 else 1.0


def compute_reward(log, recent_logs=None):
    ge = compute_ge(log)
    gi = compute_gi(log)
    gvc = compute_gvc(log)
    kappa = compute_kappa(log)
    optionality = compute_optionality()
    fragmentation = compute_fragmentation(log)
    theta = compute_theta(log, recent_logs)

    ns_state = log.get("nervousSystemState", "regulated")
    gate = NERVOUS_SYSTEM_GATE.get(ns_state, 1.0)

    geo_mean = math.pow(ge * gi * gvc * kappa * optionality, 1 / 5)
    raw_score = gate * geo_mean - fragmentation * 0.3 + theta * 0.15
    score = clamp(round(raw_score * 10 * 10) / 10, 0, 10)

    return {
        "score": score,
        "delta": None,
        "components": {
            "ge": round(ge, 4),
            "gi": round(gi, 4),
            "gvc": round(gvc, 4),
            "kappa": round(kappa, 4),
            "optionality": round(optionality, 4),
            "fragmentation": round(fragmentation, 4),
            "theta": round(theta, 4),
            "gate": gate,
        },
        "computedAt": datetime.utcnow().isoformat() + "Z",
    }


# ─── Garmin → DailyLog Inference ────────────────────────────────────────

def infer_daily_log_from_garmin(garmin_data: dict, date_str: str) -> dict:
    """
    Create a daily log entry from Garmin metrics + conservative defaults.
    What we can derive from Garmin:
    - sleepHours: from sleep stage minutes
    - bodyFelt: approximated from body battery
    - nervousSystemState: approximated from stress level
    - trainingTypes: from active calories (rough heuristic)
    """

    # Sleep hours from sleep stage minutes
    deep = garmin_data.get("deepSleepMinutes") or 0
    light = garmin_data.get("lightSleepMinutes") or 0
    rem = garmin_data.get("remSleepMinutes") or 0
    total_sleep_minutes = deep + light + rem
    sleep_hours = round((total_sleep_minutes / 60) * 2) / 2 if total_sleep_minutes > 0 else 0

    # Body felt from body battery (morning peak)
    body_battery = garmin_data.get("bodyBattery")
    if body_battery is not None:
        if body_battery >= 70:
            body_felt = "open"
        elif body_battery >= 40:
            body_felt = "neutral"
        else:
            body_felt = "tense"
    else:
        body_felt = "neutral"

    # Nervous system state from stress level
    stress = garmin_data.get("stressLevel")
    if stress is not None:
        if stress < 30:
            ns_state = "regulated"
        elif stress < 50:
            ns_state = "slightly_spiked"
        else:
            ns_state = "spiked"
    else:
        ns_state = "regulated"

    # Training type from active calories (very rough)
    active_cal = garmin_data.get("activeCalories") or 0
    if active_cal > 300:
        training_types = ["strength"]  # assume some training happened
    elif active_cal > 150:
        training_types = ["zone2"]
    else:
        training_types = []

    return {
        "date": date_str,
        "spineProject": "Armstrong",
        "focusHoursTarget": 6,
        "focusHoursActual": 0,  # unknown — conservative default
        "whatShipped": "",
        "revenueAsksCount": 0,
        "revenueAsksList": [],
        "publicIteration": False,
        "problems": [{"problem": "", "painPoint": "", "solution": "", "brokenWhy": ""}],
        "problemSelected": "",
        "daysSinceLastOutput": 1,  # assume 1 day — conservative
        "feedbackLoopClosed": False,
        "revenueSignal": 0,
        "speedOverPerfection": False,
        "nervousSystemState": ns_state,
        "nervousSystemTrigger": "",
        "twentyFourHourRuleApplied": False,
        "cleanRequestRelease": "",
        "noEmotionalTexting": True,
        "revenueThisSession": 0,
        "revenueStreamType": "one_time",
        "automationOpportunity": "",
        "sleepHours": sleep_hours,
        "trainingType": training_types[0] if training_types else "none",
        "trainingTypes": training_types,
        "vo2Intervals": [0, 0, 0, 0],
        "zone2Distance": 0,
        "calendarFocusHours": None,
        "relationalBoundary": "",
        "bodyFelt": body_felt,
        "todayFocus": "",
        "todayOneAction": "",
        "pillarsTouched": [],
        "actionType": None,
        "yesterdayOutcome": "",
        "rewardScore": None,  # computed after
    }


# ─── Main ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Backfill daily logs from Garmin data")
    parser.add_argument("--start", help="Start date (YYYY-MM-DD). Defaults to --range days ago.")
    parser.add_argument("--end", help="End date (YYYY-MM-DD). Defaults to yesterday.")
    parser.add_argument("--range", type=int, default=30, help="Number of days to backfill (default: 30)")
    parser.add_argument("--uid", help="Firebase user ID. Falls back to FIREBASE_UID env var.")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be written without writing.")
    parser.add_argument("--skip-existing", action="store_true", default=True,
                        help="Skip dates that already have daily log entries (default: true)")
    parser.add_argument("--overwrite", action="store_true",
                        help="Overwrite existing daily log entries")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )

    uid = args.uid or os.environ.get("FIREBASE_UID")
    if not uid:
        logger.error("Firebase UID required. Pass --uid or set FIREBASE_UID in .env")
        sys.exit(1)

    # Date range
    if args.start and args.end:
        start_date = datetime.strptime(args.start, "%Y-%m-%d")
        end_date = datetime.strptime(args.end, "%Y-%m-%d")
    else:
        end_date = datetime.strptime(args.end, "%Y-%m-%d") if args.end else datetime.now() - timedelta(days=1)
        start_date = end_date - timedelta(days=args.range - 1)

    # Firebase
    key_path = str(Path(__file__).parent / "firebase-service-account.json")
    if not Path(key_path).exists():
        logger.error(f"Firebase service account key not found at {key_path}")
        sys.exit(1)

    if not firebase_admin._apps:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)

    db = firestore.client()

    # Process each day
    current = start_date
    created = 0
    skipped = 0
    no_garmin = 0
    recent_logs = []  # rolling window for theta computation

    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")

        # Check if daily log already exists
        if not args.overwrite:
            existing_ref = db.collection("users").document(uid).collection("daily_logs").document(date_str)
            existing = existing_ref.get()
            if existing.exists:
                existing_data = existing.to_dict()
                recent_logs.append(existing_data)
                if len(recent_logs) > 7:
                    recent_logs.pop(0)
                logger.info(f"SKIP {date_str} — daily log already exists")
                skipped += 1
                current += timedelta(days=1)
                continue

        # Read Garmin data
        garmin_ref = db.collection("users").document(uid).collection("garmin_metrics").document(date_str)
        garmin_doc = garmin_ref.get()

        if not garmin_doc.exists:
            logger.warning(f"SKIP {date_str} — no Garmin data")
            no_garmin += 1
            current += timedelta(days=1)
            continue

        garmin_data = garmin_doc.to_dict()

        # Build daily log
        log = infer_daily_log_from_garmin(garmin_data, date_str)

        # Compute reward with rolling 7-day context
        reward = compute_reward(log, recent_logs[-7:] if recent_logs else [])

        # Compute delta from previous day
        if recent_logs:
            prev_score = recent_logs[-1].get("rewardScore", {})
            if prev_score and prev_score.get("score") is not None:
                reward["delta"] = round(reward["score"] - prev_score["score"], 1)

        log["rewardScore"] = reward

        if args.dry_run:
            print(f"\n--- {date_str} ---")
            print(f"  Sleep: {log['sleepHours']}h  Body: {log['bodyFelt']}  NS: {log['nervousSystemState']}")
            print(f"  Training: {log['trainingTypes']}")
            print(f"  GE={reward['components']['ge']:.2f}  GI={reward['components']['gi']:.2f}  "
                  f"GVC={reward['components']['gvc']:.2f}  K={reward['components']['kappa']:.2f}  "
                  f"O={reward['components']['optionality']:.2f}")
            print(f"  Score: {reward['score']}  Delta: {reward['delta']}")
        else:
            # Write to Firestore
            ref = db.collection("users").document(uid).collection("daily_logs").document(date_str)
            log["createdAt"] = firestore.SERVER_TIMESTAMP
            log["updatedAt"] = firestore.SERVER_TIMESTAMP
            ref.set(log, merge=True)
            logger.info(f"WRITE {date_str} — g*={reward['score']} (GE={reward['components']['ge']:.2f})")

        recent_logs.append(log)
        if len(recent_logs) > 7:
            recent_logs.pop(0)

        created += 1
        current += timedelta(days=1)

    # Summary
    print(f"\n{'DRY RUN — ' if args.dry_run else ''}Backfill complete:")
    print(f"  Created: {created}")
    print(f"  Skipped (existing): {skipped}")
    print(f"  Skipped (no Garmin): {no_garmin}")
    print(f"  Date range: {start_date.strftime('%Y-%m-%d')} → {end_date.strftime('%Y-%m-%d')}")

    if not args.dry_run and created > 0:
        print(f"\nBackfilled {created} days with conservative defaults.")
        print("Manual fields (whatShipped, revenueAsks, etc.) default to empty/zero.")
        print("You can go back and fill in what you remember — the score recomputes on save.")


if __name__ == "__main__":
    main()
