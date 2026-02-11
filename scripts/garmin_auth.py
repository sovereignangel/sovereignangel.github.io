"""
One-time interactive Garmin MFA login.
Run this in a terminal: python garmin_auth.py
It will prompt for your MFA code and save tokens for future use.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import garth

load_dotenv(Path(__file__).parent / ".env")

email = os.environ.get("GARMIN_EMAIL")
password = os.environ.get("GARMIN_PASSWORD")
token_dir = str(Path(__file__).parent / "garmin_tokens")

print(f"Logging in as {email}...")
print("Check your phone/email for the MFA code.\n")

garth.login(email, password)
Path(token_dir).mkdir(parents=True, exist_ok=True)
garth.client.dump(token_dir)

print(f"\nTokens saved to {token_dir}")
print("You can now run: python garmin_sync.py")
