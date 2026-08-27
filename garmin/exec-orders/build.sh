#!/usr/bin/env bash
#
# Build (and optionally run or sideload) Exec Orders.
#
#   ./build.sh                 build for fr970
#   ./build.sh --device fr965  build for another product in the manifest
#   ./build.sh --sim           build, then launch in the Connect IQ simulator
#   ./build.sh --install       build, then copy onto a watch mounted over USB
#
# The SDK path is read from the SDK Manager's own config rather than hardcoded,
# so upgrading the SDK does not mean editing this file.
#
set -euo pipefail

CIQ_HOME="$HOME/Library/Application Support/Garmin/ConnectIQ"
SDK_CFG="$CIQ_HOME/current-sdk.cfg"
KEY="$CIQ_HOME/developer_key.der"
DEVICE="fr970"
RUN_SIM=0
INSTALL=0

while [ $# -gt 0 ]; do
  case "$1" in
    --device) DEVICE="$2"; shift 2 ;;
    --sim)    RUN_SIM=1; shift ;;
    --install) INSTALL=1; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

# ── Preflight ───────────────────────────────────────────────────────────────
if ! command -v java >/dev/null 2>&1; then
  echo "error: no Java runtime. monkeyc is a Java tool." >&2
  echo "       brew install --cask temurin" >&2
  exit 1
fi

if [ ! -f "$SDK_CFG" ]; then
  echo "error: no SDK selected. Open the Connect IQ SDK Manager and pick one." >&2
  exit 1
fi

# Strip only line endings and a trailing slash — the SDK path contains a
# space ("Application Support"), so [:space:] would mangle it.
SDK="$(tr -d '\r\n' < "$SDK_CFG")"
SDK="${SDK%/}"
MONKEYC="$SDK/bin/monkeyc"

if [ ! -x "$MONKEYC" ]; then
  echo "error: monkeyc not found at $MONKEYC" >&2
  exit 1
fi

if [ ! -f "$KEY" ]; then
  echo "error: no developer key at $KEY" >&2
  echo "       openssl genrsa -out developer_key.pem 4096" >&2
  echo "       openssl pkcs8 -topk8 -inform PEM -outform DER \\" >&2
  echo "               -in developer_key.pem -out '$KEY' -nocrypt" >&2
  exit 1
fi

if [ ! -d "$CIQ_HOME/Devices/$DEVICE" ]; then
  echo "error: device '$DEVICE' is not installed." >&2
  echo "       Download it in the SDK Manager under Devices." >&2
  echo "       Installed: $(ls "$CIQ_HOME/Devices" | tr '\n' ' ')" >&2
  exit 1
fi

# ── Build ───────────────────────────────────────────────────────────────────
mkdir -p bin
OUT="bin/exec-orders-$DEVICE.prg"
PROPS="resources/properties/properties.xml"

# A simulator build points at the local dev server and carries the token, so it
# is written to a separate filename. Never sideload a -sim.prg: it will look
# installed and silently fail to reach anything off this Mac.
if [ "$RUN_SIM" -eq 1 ]; then
  OUT="bin/exec-orders-$DEVICE-sim.prg"
  TOKEN="$(grep '^EXEC_WATCH_TOKEN=' ../../.env.local | cut -d= -f2)"
  if [ -z "$TOKEN" ]; then
    echo "error: EXEC_WATCH_TOKEN not found in ../../.env.local" >&2
    exit 1
  fi
  cp "$PROPS" "$PROPS.orig"
  # Restore the tracked file no matter how this exits.
  trap 'mv -f "$PROPS.orig" "$PROPS" 2>/dev/null' EXIT
  sed -i '' "s|<property id=\"serverUrl\" type=\"string\">.*</property>|<property id=\"serverUrl\" type=\"string\">http://localhost:3000/api/exec/orders</property>|" "$PROPS"
  sed -i '' "s|<property id=\"watchToken\" type=\"string\"></property>|<property id=\"watchToken\" type=\"string\">$TOKEN</property>|" "$PROPS"
  echo "seeded simulator settings -> localhost:3000"
fi

echo "building $DEVICE with $(basename "$SDK")"
"$MONKEYC" \
  --jungles monkey.jungle \
  --device "$DEVICE" \
  --output "$OUT" \
  --private-key "$KEY" \
  --warn

echo "built $OUT"

# ── Run ─────────────────────────────────────────────────────────────────────
if [ "$RUN_SIM" -eq 1 ]; then
  open -a "$SDK/bin/ConnectIQ.app" 2>/dev/null || "$SDK/bin/connectiq" &
  sleep 4
  "$SDK/bin/monkeydo" "$OUT" "$DEVICE"
fi

# ── Sideload ────────────────────────────────────────────────────────────────
if [ "$INSTALL" -eq 1 ]; then
  TARGET=""
  for vol in /Volumes/*/GARMIN/APPS; do
    if [ -d "$vol" ]; then TARGET="$vol"; break; fi
  done

  if [ -n "$TARGET" ]; then
    cp "$OUT" "$TARGET/EXECORD.PRG"
    echo "copied to $TARGET/EXECORD.PRG — eject the watch, then find it in the glance carousel"
    exit 0
  fi

  # The fr970 speaks MTP, not USB mass storage, and macOS does not mount MTP
  # devices in Finder. There is no volume to copy to and there never will be,
  # so this is guidance rather than an error to retry.
  cat >&2 <<TXT
No watch volume found — expected on macOS.

The fr970 uses MTP, which macOS will not mount as a drive. Copy it by hand:

  1. open -a OpenMTP           (brew install --cask openmtp)
  2. Left pane  = this Mac, right pane = the watch. Pick the fr970 if asked.
  3. On the watch, open  GARMIN/APPS
  4. Drag this file across, and rename it EXECORD.PRG if it does not keep it:

       $(pwd)/$OUT

  5. Quit OpenMTP, unplug the watch. The app appears in the glance carousel.

Garmin Express also talks MTP but conflicts with other MTP clients — run only
one at a time.
TXT
  exit 1
fi
