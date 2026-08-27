# Exec Orders — /exec on the wrist

A Connect IQ watch app that answers one question on a wrist-raise: **what should I
do now.** It is the [/exec](../../app/exec/page.tsx) page reduced to a glance and
five pages, targeted at a **Forerunner 970**.

Nothing is computed on the watch. The whole day is assembled server-side by
[lib/exec/orders.ts](../../lib/exec/orders.ts) from exactly the primitives the
web page uses — `buildExecWindDay`, `ironmanSlot`, `spotStatuses`, `adaptDay`,
`nextMilestones` — so the wind rules, the readiness adaptation and the drill
ladder can only ever be changed in one place. The watch draws a JSON payload
and nothing else.

---

## How it hangs off the review rhythm

There is no server push in Connect IQ. The watch has to pull, so "tell me when
I wake up" means *pull ahead of time and have the answer already sitting there.*

```
04:30 UTC  /api/cron/kite-wind        Telegram: wind
04:45 UTC  /api/cron/ironman-brief    Telegram: adapted session
04:50 UTC  /api/cron/exec-orders  ←   warms daily_orders/{date}   (07:50 Palanga)
17:00 UTC  /api/cron/exec-orders  ←   warms it again for evening  (20:00 Palanga)

           watch background service    every 30 min inside the two windows
                                       → GET /api/exec/orders?k=…
                                       → Application.Storage
           wrist-raise + swipe         glance draws from Storage. No radio, no wait.
```

Three things make this hard to break:

- **The cron is a warm, not a gate.** `/api/exec/orders` rebuilds on its own
  whenever the cached doc is older than `ORDERS_TTL_MS` (20 min). A failed cron
  costs latency, not correctness.
- **The background registration is a `Duration`, not a `Moment`.** A Duration
  re-arms itself. A Moment has to be re-registered after every fire and fails
  silently and permanently if one is ever missed. The clock check in
  `Orders.inReviewWindow()` does the gating instead, so a wake outside the
  windows reads `System.getClockTime()` and exits without opening the radio.
- **Two phases, one endpoint.** Before 20:00 Palanga the payload is the morning
  orders; after, it is the evening review. The cache keys on phase as well as
  age, so the evening review can never be served the morning's orders.

---

## Setup

Done on this machine already — recorded here for a rebuild elsewhere. The
toolchain is Temurin 26 plus Connect IQ **SDK 9.2.0**, with the fr970 device
package installed.

One trap worth knowing: the SDK Manager's bulk device sweep downloads by
product family, **not** alphabetically, and it will not pull a device you have
never installed. The fr970 has to be ticked explicitly on the Devices tab — the
sweep runs right past the Forerunners without adding it.

### 1. Java

`monkeyc` is a Java program, so a JDK has to exist first:

```bash
brew install --cask temurin
java -version        # Temurin 26 here; 17+ works
```

### 2. A newer SDK, plus the fr970 device

The SDK Manager is installed at `/Applications/SdkManager.app` (it ships as a
DMG from developer.garmin.com). Sign in with a Garmin account, then:

- **SDKs** tab: install the newest SDK and mark it current
- **Devices** tab: search `970` and tick **Forerunner 970** explicitly

Do not rely on the bulk sweep for the device — see the note above.

`build.sh` reads the selected SDK from `current-sdk.cfg`, so there is nothing to
edit here afterwards.

### 3. Developer key — already generated

`~/Library/Application Support/Garmin/ConnectIQ/developer_key.der` exists
(mode 600, alongside the PEM it came from). It is deliberately **outside this
repo**. To regenerate:

```bash
cd ~/Library/Application\ Support/Garmin/ConnectIQ
openssl genrsa -out developer_key.pem 4096
openssl pkcs8 -topk8 -inform PEM -outform DER \
        -in developer_key.pem -out developer_key.der -nocrypt
```

### 4. Server token

`EXEC_WATCH_TOKEN` is already in `.env.local`. Set the **same value** in Vercel:

```bash
vercel env add EXEC_WATCH_TOKEN production
```

The watch sends it as `?k=…`. This is a static token rather than OAuth because
Connect IQ has no usable interactive auth on a watch, and the payload is a
training plan, not a credential. `Authorization: Bearer $CRON_SECRET` is
accepted too, so the crons need no second secret.

### 5. Build and sideload

```bash
cd garmin/exec-orders
./build.sh                 # build for fr970
./build.sh --sim           # build and run in the simulator
./build.sh --install       # build and copy to a watch mounted over USB
```

`--install` writes `EXECORD.PRG` into `GARMIN/APPS` on the mounted volume.
Eject the watch afterwards; the app appears in the glance carousel.

### 6. Configure on the watch

Garmin Connect → **Device** → **Connect IQ Apps** → **Exec Orders** → Settings:

| Setting | Value |
|---|---|
| Orders endpoint | `https://www.loricorpuz.com/api/exec/orders` |
| Watch token | the `EXEC_WATCH_TOKEN` value |
| Athlete | **Lori** or **Aidas** — set once per watch |
| Refresh every | `30` minutes |
| Morning window | `5` → `11` |
| Evening window | `19` → `23` |

Use `www.`, never the apex — the apex 301s and Connect IQ does not follow
redirects.

---

## On the watch

**Glance** (swipe from the watch face) — `ORDERS` or `REVIEW`, the time the
payload was built, and the headline over at most two lines. Drawn from cache;
it never touches the radio.

**App** (tap into it) — UP/DOWN page, START refreshes, BACK exits. A page taller
than the screen scrolls before it turns, so nothing is silently cut off. Font
sizes are measured per page and step down until the content fits.

| Morning | Shows |
|---|---|
| TODAY | Headline, race countdown, athlete, staleness |
| BODY | Sleep score, recovery rating + factors, loading (acute + ratio + trend), endurance + weekly delta |
| KITE | Spot, the 2h windows, wind detail, and **what changed since last night** |
| TRAIN | Today's session with pace target and shared minutes, and **what changed, and why** |
| DRILLS | Top 3 from the kite mastery ladder |
| SPOTS | All four spots, same words as the /wind grid |

| Evening | Shows |
|---|---|
| TONIGHT | Tomorrow's headline, race countdown |
| DONE | What was actually recorded today — "Swim 2.0k", "Kiting 1.4h" — with HR and load |
| BODY | Recovery, loading, endurance. No sleep score; the morning already said it. |
| TOMORROW · KITE | Spot and 2h windows |
| TOMORROW · TRAIN | Tomorrow's session |
| DRILLS | The ladder for tomorrow |
| SPOTS | The four-spot ledger |

The morning leads with the body because sleep and recovery are what override a
printed plan. The evening leads with what actually happened, then hands the next
morning a complete plan so nothing has to be decided at 07:00.

**The promise ledger.** Each evening writes what it committed to for tomorrow
into `daily_orders/{person}_{date}.promised`. The next morning diffs against it
and prints the delta on the page it belongs to — "Moved: was Svencele 11-13h,
now Nida 17-19h", or "was Bike 90min - readiness 51, load ramping". Without it a
forecast that moved overnight looks identical to one that never moved, and the
watch quietly stops being worth trusting. The promise is stored beside the cache
but is not part of it: cache writes use `merge: true` so a rebuild cannot erase
a commitment made a day earlier.

---

## Code scoping — read this before editing

Monkey C compiles three scopes, and **a scope can only see symbols carrying its
annotation.** The app scope sees everything; the glance and background scopes see
only what is annotated for them. Get this wrong and the failure is a compile-time
"unresolved symbol", not a runtime bug.

| File | Annotation | Why |
|---|---|---|
| `Orders.mc` | `(:glance :background)` | All three scopes read the cache |
| `Palette.mc` | `(:glance)` | Glance draws with it |
| `TextUtil.mc` | `(:glance)` | Glance and view share one wrap implementation |
| `Fetch.mc` | `(:background)` | Background pulls; app reuses it for manual refresh |
| `ExecBackground.mc` | `(:background)` | The service delegate |
| `ExecGlanceView.mc` | `(:glance)` | The glance itself |
| `Pages.mc`, `ExecOrdersView.mc`, `ExecOrdersDelegate.mc` | none | App scope only — keeps the glance small |

Note the annotation separator is a **space**, not a comma: `(:glance :background)`.

The glance deliberately cannot reach `Fetch.mc`. Glances get a small memory
budget and a short lifetime, and a radio call inside one is a good way to have
the glance killed mid-draw.

---

## Wire format

Short-keyed and truncated at the source, because a glance parses this into a
Dictionary inside a memory budget measured in tens of kilobytes. A live payload
measures ~1.3 KB. `compactOrders()` in `lib/exec/orders.ts` is the only place
these keys are produced; `Orders.mc` is the only place they are read.

```jsonc
{
  "v": 2, "d": "2026-08-27", "pr": "lori", "ph": "m",  // ph: m=morning, e=evening
  "hl": "KITE 11-13h Svencele · SWIM 07:00",           // the glance line
  "gen": "14:48",

  "b": { "sl": 88,                    // sleep score, morning only
         "rd": 77, "bd": "green",     // recovery rating + band
         "fx": ["Sleep 88", "HRV vs weekly 57 / 58ms", …],
         "la": 599, "lr": "1.74",     // acute load, acute:chronic (a STRING — see below)
         "lt": "ramping",
         "en": 5365, "ed": -1 },      // endurance score, change vs a week ago

  "td": { … },                        // today's plan  — morning
  "tm": { … },                        // tomorrow's plan — evening
  //   both:  k = kite, t = train, dl = drills
  //   k: { s spot, a area, w [windows], fw full, kn, g gust, dr dir, sz size, p possible, n note }
  //   t: { sl slot, ti title, du min, z zone, sp sport, dt detail,
  //        pc pace target, tg minutes together, ah adapt headline, aj adjusted }

  "dn": [ { "l": "Swim 2.0k", "d": "54min · 142 bpm · load 233" } ],  // evening
  "ck": "Moved: was Svencele 11-13h, now Nida 17-19h",                // morning
  "ct": "was Bike 90min — readiness 51, load ramping",                // morning

  "ws": 1,                            // wind service was unreachable
  "sp": [ { "n": name, "s": "r|p|h|f", "l": label } ],
  "rc": { "n": race, "d": days }
}
```

Absent keys mean absent data — `sl` is dropped in the evening, `ck`/`ct` appear
only when something actually moved. Every accessor in `Orders.mc` takes a
fallback, so an older payload degrades rather than crashes.

Two things that look odd and are deliberate:

- **`lr` is a string, not a number.** Monkey C's `Float.toString()` renders an
  implementation-defined number of decimals, so `1.74` can arrive on screen as
  `1.740000`. The ratio is formatted server-side and the watch only prints it.
- **Storage keys carry the version** (`orders_v2`). A payload written by an
  older build is not migrated, it is simply not found, so the app refetches
  instead of rendering new pages from a body it half-understands. Bump
  `KEY_DATA`/`KEY_AT`/`KEY_ERR` in `Orders.mc` whenever this shape changes.

## Verifying

```bash
# Compact payload, exactly what the watch sees
curl -s "https://www.loricorpuz.com/api/exec/orders?k=$EXEC_WATCH_TOKEN&p=lori" | jq

# Full object plus cache provenance
curl -s "https://www.loricorpuz.com/api/exec/orders?k=$EXEC_WATCH_TOKEN&full=1" \
  | jq '{source, ageMs, phase: .orders.phase, headline: .orders.headline}'

# Force a rebuild
curl -s "https://www.loricorpuz.com/api/exec/orders?k=$EXEC_WATCH_TOKEN&p=lori&refresh=1" | jq .hl

# Exercise the evening half and the promise ledger without waiting for 20:00.
# `at` is gated behind the bearer secret, never the watch token.
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/exec/orders?p=lori&refresh=1&at=2026-08-27T18:00:00Z" | jq
```

On the watch, START forces a fetch and the footer shows `refreshing`. If it
fails, the page keeps the last good orders and shows the reason —
`Phone not connected`, `Token rejected`, `Endpoint not found`.

---

## Status

Both halves are **built and verified**.

The server half was exercised against live Firestore and Open-Meteo: the
endpoint, the 20-minute cache, the phase flip and the cron warm all work, and a
live payload measures ~1.5 KB.

The watch half **compiles clean for fr970** against Connect IQ SDK 9.2.0 —
`bin/exec-orders-fr970.prg`, 120 KB. Four things had to be fixed to get there,
recorded so they don't get reintroduced:

| Fix | Detail |
|---|---|
| `me` is a reserved word | `Orders.inReviewWindow()` used `me` as a local. Renamed to `amFrom`/`amTo`/`pmFrom`/`pmTo`. |
| Callback types are invariant | `makeWebRequest`'s callback signature must be restated **exactly**, `PersistedContent.Iterator` included — widening `data` to `Object` is rejected. See `Fetch.mc`. |
| Dead null-check | `Properties.getValue` is non-nullable for a declared key, so the `v == null` branch was provably unreachable. Undeclared keys throw and are caught. |
| Launcher icon size | 454×454 devices want **65×65**, not 60×60. |

Plus one in `build.sh`: `tr -d '[:space:]'` was eating the space in
"Application Support" and mangling the SDK path.

15 `Cannot determine if container access is using container type` warnings
remain. They are type-inference noise from reading untyped JSON dictionaries and
are expected — the accessors in `Orders.mc` all guard with `instanceof` before
use. Left visible rather than suppressed.

Still untested **on the watch itself**: the glance memory budget under real
scope limits, and whether a background process's `Storage` writes reach the app
on this device. `Orders.saveStub()` is the fallback for the latter.

## Adding another watch

One line in `manifest.xml`:

```xml
<iq:product id="fr965"/>
```

The device must be downloaded in the SDK Manager first, then
`./build.sh --device fr965`. Nothing in `source/` is device-specific — the
layout measures the `dc` it is handed rather than assuming a screen size.
