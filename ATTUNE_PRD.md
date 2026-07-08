# Attune PRD

## Executive Summary

Attune is a real-time vision system that reads a room and turns that signal into the music's next move. A camera watches the floor; computer vision turns motion, density, attention, and cohesion into a continuous energy vector; that signal flows into the DJ's rig as a co-pilot, not an autopilot.

The crowd stops being downstream of the music. It becomes part of the instrument.

---

## Core Principles

### 1. The crowd is the score
A great DJ already reads the room with their eyes — when hands go up, when bodies still, when the breath drops. Attune gives them superhuman vision, perfect memory, and a system that learns.

### 2. The room becomes the instrument
Computer vision turns the audience into a continuous signal — density, motion, cohesion, attention. That signal flows back into the music. The crowd is no longer downstream of the DJ; they are inside the loop.

### 3. The DJ stays sovereign
Attune is a co-pilot, not an autopilot. It suggests, surfaces, surfaces the next track, signals the drop. The human remains the artist. The machine is the third ear.

### 4. Every night is a dataset
Each set becomes labeled data: what the room felt, what the DJ played, what worked. A model that gets better every night, across every venue, in every key.

---

## Vision System — Six Dimensions of Energy

| Dimension | Unit | Description |
|-----------|------|-------------|
| **Crowd density** | 0 — 1.0 | Bodies per square meter — surfaced as warmth or pressure on the floor map. |
| **Motion intensity** | optical flow | Aggregate movement vector — how hard the room is moving, where the locked-in pockets are. |
| **Cohesion** | phase sync | Are bodies moving together, or fragmented? A measure of the room's entrainment. |
| **Attention** | gaze + pose | Faces oriented to the booth vs. faces in conversation. The room's focus. |
| **Phones in air** | count | The classic drop signal — a clean, objective measure of peak moments. |
| **Energy trajectory** | derivative | Is the room building, holding, or fading? The most important read of all. |

---

## Music Sources — The Honest Answer

| Source | Verdict | Notes |
|--------|---------|-------|
| **Local files** | Yes | The gold standard. Rekordbox, Traktor, Serato, djay Pro all run on local libraries. Full beatgrid, key, cue points, FX, stems. |
| **Beatport LINK / Beatsource LINK / TIDAL DJ** | Yes | The legit streaming path. Integrates directly into pro DJ software with beatgridded, DJ-ready audio. |
| **Spotify Web API** | No | Playback control only. No raw audio, no mixing, no FX, no beatmatching. Their terms explicitly prohibit DJ use. |
| **YouTube Music** | No | No public streaming API for DJ-style use. Terms-of-service blocker. |
| **SoundCloud** | Limited | API mostly closed to new applications since 2021. Workable only for unsigned/Creative Commons content. |
| **AI stem separation** | Yes | djay Pro AI and Demucs allow real-time isolation of vocals, drums, bass, harmony. This is where vision-driven remixing actually lives. |

**Conclusion:** Local library + Beatport LINK + AI stems = the working set.

---

## Technical Stack

### Layer 1: Capture
- Sony FX3 or A7S III (4K low-light) — primary booth-facing camera
- iPhone Pro + Continuity Camera — wide secondary, MVP-grade
- Optional: Intel RealSense depth or thermal for crowd density in low light

### Layer 2: Vision pipeline
- Edge processor: Mac Studio (M-series, MPS) or NVIDIA Jetson Orin
- Pose estimation: YOLOv8-pose or MediaPipe (real-time, 30+ fps)
- Crowd density: CSRNet or OpenPose density maps
- Optical flow: Farnebäck (OpenCV) for collective motion vectors
- All running in Python — frame in, energy vector out, 100ms loop

### Layer 3: Energy synthesis
- Normalize raw signals into a 6-dimensional energy vector
- Rolling 30s, 2min, 10min windows — short signal, mid arc, long arc
- Phase 2: RL policy trained on DJ-labeled "what worked" data

### Layer 4: Bridge
- python-osc + mido — OSC and MIDI out from the CV machine
- MIDI Learn into rekordbox / Traktor / djay Pro
- Maps energy dimensions to filter cutoff, FX intensity, stem mute, cue triggers

### Layer 5: DJ surface
- djay Pro AI (deepest AI stems + Neural Mix) — recommended for MVP
- Traktor Pro 4 (pro-grade FX + most flexible MIDI mapping)
- A second screen for the DJ: "co-pilot view" — next-track suggestions, drop window, energy trajectory

### Layer 6: Crowd feedback
- Lightweight web app — QR code on screens at the venue
- Single-tap signals: "lock in", "lift it", "bring it down"
- Fuses with vision signal — the room votes with both motion and intent
- Next.js + Firebase for v1, can move to Convex for sub-100ms reactivity

---

## Build Phases

### P1: The Eye (4 weeks)
A single camera, a Mac, a Python pipeline that outputs a live energy vector to a dashboard. Validate the read. No DJ integration yet.

### P2: The Co-pilot (8 weeks)
MIDI bridge into djay Pro. Energy vector controls filter and FX in real time. A second-screen co-pilot view for the DJ — next track, drop window, "the room is asking for X."

### P3: The Loop (12 weeks)
Crowd feedback web app live at a real event. Vision + crowd intent fused. First end-to-end party as research lab.

### P4: The Conductor (6+ months)
Closed-loop autonomous remixing on AI stems. The system can run a 20-minute interlude untouched. The DJ becomes a curator and conductor, not an operator.

---

## Team & Needs

### A friend who plays with CV
Pose, density, optical flow — all runnable on a Mac today. You don't need to be a research scientist. You need to be curious.

### A friend who DJs
Bring a deck, a library, and an open mind. djay Pro AI handles the stems — you handle the room.

### A room to make our own
A loft, a warehouse, a backyard, the playa. Small enough to feel, big enough to matter, dark enough to disappear into.

### A weekend and a few hands
Camera, cables, the patience to fail twice and get it right on the third night. No team, no roadmap — just the work.

---

## Playa Plan (Burning Man Scenario)

### Timeline

**May → June: The eye**
Webcam in someone's apartment. Python pipeline outputs a live energy vector to a dashboard. Validate the read.

**June → July: The bridge**
MIDI from the CV machine into djay Pro on a friend's DJ rig. Filter, FX, stem mute responding to motion. Mistakes welcomed.

**July: The dress rehearsal**
One small night in a Brooklyn loft or a friend's living room. 30 people. Break things in private before we break them on the playa.

**August: The pack-out + the burn**
Crate the rig, generator, sound system. Drive it out. Run it for one night. Take notes. Come home changed.

### Budget

| Item | Range | Notes |
|------|-------|-------|
| Gear (camera, mounts, MIDI, cables) | free → $2,500 | iPhone + Continuity Camera is real. New Sony A7S III if we want it. |
| Software (djay Pro AI, Beatport LINK) | $60 → $120 | For 3–4 months of LINK + djay subscription. |
| Burning Man tickets (2) | $1,200 | Standard tickets + vehicle pass. |
| Camp logistics (RV share, food, water) | $1,500 → $2,500 | Costs scale with comfort level. Shared RV is the move. |
| Power (Honda EU2200i + fuel) | $800 | Generator handles the rig and a small PA. Quiet enough to live with. |
| Small PA / sound rental | $500 → $1,000 | A pair of QSC K12s and a sub. Doesn't need to be huge — needs to be true. |
| Dust protection + contingency | $300 → $500 | Cases, microfiber, redundancy. The playa eats electronics. |

**Scrappy Total:** ~$4,500  
Borrowed gear, friend's DJ rig, shared RV, modest PA. Most of the cost is just being on the playa.

**Comfortable Total:** ~$7,500 – $9,000  
New camera, dedicated MIDI rig, rented sound, dust-proof cases. Less duct tape, more sleep.

---

## Privacy & Protection

The system reads the body — pose, density, motion, the breath of the room. Never the face. Never a name. Never a record.

Faces are not stored. Faces are not matched. Faces are not learned. The eye blurs them on the wire, before the frame ever leaves the lens.

For those who want their privacy made tactile — who want it worn — we sculpt adornments. Sheets of brass that meet the machine as ornament: discs that obscure, plates that confound, thin gold wire that turns a watching room into a jewel box.

Anti-surveillance, designed by someone who loves beauty.

---

## Spirit & Ethos

Built for the love of it. No round to raise, no team to scale, no roadmap to defend. A few friends, a camera, a deck, a room — and the question of what happens when the floor and the music start to talk.

The crowd composes the night.
