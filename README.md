# clawduh — automated crude/creepy 2D animation from viral audio

Take a popular comedy audio clip, give it **our own original characters**, and render a fully
animated 2D short with lip-sync, camera work, captions and a hand-drawn horror look —
with as much of the process automated as possible.

**Episode 001 — "Brother, may I have some oats?"** (the burialgoods voice track Krumbl3D animated with
pigs). Ours is set in a nighttime sheep pen with an original cast:

| Character | What they are |
|---|---|
| **Brother Gristle** | Gaunt, half-shorn sheep with bulging bloodshot eyes, visible ribs, a torn ear tag (#07) and a faded "2nd place" fair rosette. He has *seen things*. |
| **Brother Dumpling** | Enormous, spotless, smug believer with a tiny black face, slit pupils, big flat human teeth — and the farmer's red spray-paint **X** on his side, which he thinks means "chosen". |
| **The Tall Skinny Figures** | The farmers / "gods": impossibly long black silhouettes, tiny heads, straw hats, a grin wider than their face. |
| Extras | the furry red demon (fox), the feathered ones, the roaring beast (truck with a face), the Shed of No Return, Dumpling's spawn, the portrait wall. |

## How it works

```
source clip ──► pipeline/fetch_audio.sh      audio_16k_mono.wav + audio_full.wav
            ──► pipeline/transcribe.py       faster-whisper word timestamps  → analysis/transcript.json
            ──► speakers.json (turns)        who says which line (hand-made today; LLM-able)
            ──► pipeline/lipsync.sh          Rhubarb mouth shapes A–H/X      → analysis/mouth_cues.json
            ──► pipeline/build_timeline.py   lines + per-speaker mouth tracks + loudness → video/src/episodes/<slug>/timeline.json
            ──► video/src/episodes/<slug>/shots.tsx   the shot list (camera, scene, expressions)
            ──► Remotion render              → MP4
```

Everything visual is code: SVG character rigs (eyes with blinks/darts/lids, 9 mouth shapes,
head bob driven by mouth openness and loudness), a camera with push-ins/shake, a screen-space
"line boil" filter so every outline wobbles like hand-drawn animation, film grain/dust, vignette,
projector flicker, per-scene colour grades (night / memory-sepia / hell / heaven), and burned-in
word-by-word captions. Motion is quantised "on twos" for the hand-drawn feel.

### Repo layout

```
pipeline/            audio → transcript → lip-sync → timeline (Python + Rhubarb)
episodes/001-oats/   speakers.json + analysis/ (source/ is git-ignored: third-party audio)
video/               Remotion project
  src/engine/        Stage/camera, timeline lookups, FX, captions, EpisodePlayer (shot system)
  src/characters/    Gristle, Dumpling, TallFigure, extras (fox, chickens, truck, portraits…)
  src/scenes/        Pen (main set), flashbacks, cutaways
  src/episodes/oats/ timeline.json (generated) + shots.tsx (direction)
  scripts/           batch review stills + contact sheets
```

## Setup

```bash
pip install -r requirements.txt
cd video && npm install && cd ..
# Rhubarb Lip Sync (MIT): https://github.com/DanielSWolf/rhubarb-lip-sync/releases
mkdir -p tools && curl -L -o /tmp/rhubarb.zip \
  https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.14.0/Rhubarb-Lip-Sync-1.14.0-Linux.zip \
  && unzip -q /tmp/rhubarb.zip -d tools && mv tools/Rhubarb-Lip-Sync-1.14.0-Linux tools/rhubarb
python3 pipeline/make_fx.py video/public/fx              # film-grain frames (already committed)
python3 pipeline/make_disp.py video/src/engine/dispMaps.ts # line-boil displacement maps (already committed)
```

Rendering speed: on a GPU-less Linux box keep `Config.setChromiumOpenGlRenderer("swiftshader")`
(in `video/remotion.config.ts`) — it benchmarked ~4x faster than `swangle` (`node scripts/perf_gl.mjs`).
`node scripts/perf.mjs <frame>` shows what each effect costs.

## Rebuild episode 001

```bash
pipeline/fetch_audio.sh "https://archive.org/download/brother-may-i-have-some-oats/brother%20may%20I%20have%20some%20oats.mp4" episodes/001-oats oats
pipeline/run_episode.sh episodes/001-oats oats
cd video
npx remotion studio                         # live preview / scrubbing
node scripts/stills.mjs                     # one review still per shot -> out/stills
npx remotion render src/index.ts Oats out/oats.mp4 --props='{"captions":true,"debug":false}'
```

## Making the next episode

1. `pipeline/fetch_audio.sh <url> episodes/002-name name`
2. `pipeline/transcribe.py episodes/002-name`, then write `episodes/002-name/speakers.json` (turn start times).
3. `pipeline/run_episode.sh episodes/002-name name` → `video/src/episodes/name/timeline.json`
4. Copy `video/src/episodes/oats/` as a template, write `shots.tsx`, register the composition in `src/Root.tsx`.

The characters are props-driven rigs (`expr`, `look`, `headTilt`, `bulge`, `chewing`, `girth`, …) and
`PenScene`/`Stage` take a camera move, so most shots are one line. The obvious next automation step
is an **LLM "director"** that reads `timeline.json` and emits `shots.tsx` (speaker turns, shot sizes,
cutaways from a scene library) — that's the piece that turns this into a volume pipeline.

## Things to keep in mind

- **Audio rights.** The voice track belongs to its creator (here: burialgoods, a tribute to Joe Capo),
  not to Krumbl3D or us. The end card credits it; do the same in descriptions. Expect Content ID / claims,
  and get permission or license audio before monetising at scale.
- **YouTube monetisation.** YouTube's "inauthentic content" policy (formerly "repetitious content")
  targets mass-produced, templated uploads. Keep each episode visibly distinct (new skits, new direction),
  not just new audio on the same shots.
- **Remotion licence.** Free for individuals and companies of up to 3 people; larger teams need a company licence.
