# clawduh — crude/creepy 2D animation from viral audio

Popular comedy audio + **our own original characters** → fully animated 2D shorts with lip-sync, camera work,
captions and a hand-drawn horror look. **Every episode is rendered twice: 16:9 (YouTube) and 9:16 (Shorts/TikTok/Reels).**

## Episodes

| # | Title | Audio | Status | Project |
|---|---|---|---|---|
| 001 | Brother, May I Have Some Oats? | burialgoods | ✅ final | [episodes/001-oats](episodes/001-oats/README.md) |
| 002 | Brother, I Am Troubled | burialgoods | ⚠️ built (101 shots, both formats); timing provisional until the audio is analysed | [episodes/002-troubled](episodes/002-troubled/README.md) |
| 003 | You Wouldn't | burialgoods | ✅ final | [episodes/003-wouldnt](episodes/003-wouldnt/README.md) |

All three share one farm universe: the Tall Skinny Ones (farmers, drawn as impossibly long silhouettes), the
Shed of No Return, the roaring/great metal beast.

## Render an episode (Windows / macOS / Linux)

```bash
cd video
npm install                       # once
npm run render -- 003-wouldnt     # -> renders/003-wouldnt/003-wouldnt_landscape_1920x1080.mp4
                                  #    renders/003-wouldnt/003-wouldnt_vertical_1080x1920.mp4
npm run render -- 003-wouldnt --only=vertical      # one format
npm run studio                    # live preview / scrubbing of every composition
```
Each episode needs its audio at `video/public/episodes/<id>/audio.wav` (git-ignored — third-party audio).
The episode README has the source link and the one-line command to create it.

## Layout — one folder per episode

```
episodes/<id>/                 README (source, credits, status, render steps, upload kit)
  speakers.json                who speaks when — turns anchored to their opening words
  analysis/                    transcript + Rhubarb mouth cues (source/ audio is git-ignored)
video/src/episodes/<id>/       the Remotion side of the same episode
  index.ts                     EpisodeDef (id, title, timeline, shots, framing hints)
  shots.tsx                    the direction: shot list with cameras, expressions, 9:16 reframing
  timeline.json                generated: lines, per-speaker mouth tracks, loudness
  <sets>.tsx                   episode-specific sets / cutaways
video/src/episodes/index.ts    episode registry -> compositions ep<id> and ep<id>-vertical
video/src/engine/              shared: Stage/camera, FX, captions, shot player, cue() phrase timing
video/src/characters/          shared cast: Gristle, Dumpling, TallFigure, Cat, Bull/Dennis/Pig/Crow, extras
pipeline/                      audio -> transcript -> lip-sync -> timeline (Python + Rhubarb)
renders/                       local renders (git-ignored; episode 001/003 review masters are in Git LFS)
```

## Make a new episode

```bash
pipeline/fetch_audio.sh <url-or-file> episodes/004-name        # audio for analysis + Remotion
python3 pipeline/transcribe.py episodes/004-name               # read the transcript, then write speakers.json
pipeline/run_episode.sh episodes/004-name                      # -> video/src/episodes/004-name/timeline.json
```
Copy an existing `video/src/episodes/<id>/` as a template, write `shots.tsx` (use `cue(tl, "phrase")` for shot
times so they follow the words), add it to `video/src/episodes/index.ts`, then `npm run render -- 004-name`.
No audio yet? `pipeline/captions_to_transcript.py` + `build_timeline.py --provisional` builds a silent preview
timeline from YouTube's word-timed captions (see episode 002).

## Setup for the analysis pipeline (only needed to analyse new audio)

```bash
pip install -r requirements.txt                       # faster-whisper, librosa, soundfile, numpy, pillow, yt-dlp
# Rhubarb Lip Sync (MIT): https://github.com/DanielSWolf/rhubarb-lip-sync/releases -> tools/rhubarb/
```

Review tooling: `npm run stills` (one still per shot, `COMP=ep003-wouldnt-vertical` to pick a composition),
`node scripts/perf.mjs` (effect cost). On GPU-less Linux the config switches Chromium to `swiftshader`
(~4× faster than `swangle`); on a normal PC Remotion's defaults use your GPU.

## Things to keep in mind

- **Audio rights.** Voice tracks belong to their creators (burialgoods; episode 001 is a tribute to Joe Capo).
  Credit them in every description; expect claims; get permission before monetising at scale.
- **YouTube monetisation.** The "inauthentic content" policy targets mass-produced, templated uploads — keep
  each episode visibly distinct (new cast, sets and direction), not new audio on the same shots.
- **Remotion licence.** Free for individuals and companies of up to 3 people; larger teams need a company licence.
