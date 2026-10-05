# Episode 001 — "Brother, May I Have Some Oats?"

| | |
|---|---|
| **Audio** | burialgoods — "brother may I have some oats" (a tribute to Joe Capo) · mirror: https://archive.org/details/brother-may-i-have-some-oats |
| **Length** | 2:56 (176.4 s) |
| **Status** | ✅ final — timeline from the real audio (whisper + Rhubarb) |
| **Compositions** | `ep001-oats` (1920×1080) · `ep001-oats-vertical` (1080×1920) |
| **Code** | `video/src/episodes/001-oats/` — `shots.tsx` (direction), `common.tsx` (positions/cameras), `timeline.json` |
| **Masters** | `renders/ep001-oats/` (Git LFS) |

**Cast:** Brother Gristle (gaunt sheep who has seen the truth) · Brother Dumpling (fat believer with the red X) ·
the Tall Skinny Figures · cameo props: the Shed of No Return, the roaring beast, the furry red demon.

## Render (both versions)
```bash
# 1. audio (once)
pipeline/fetch_audio.sh "https://archive.org/download/brother-may-i-have-some-oats/brother%20may%20I%20have%20some%20oats.mp4" episodes/001-oats
#    Windows / no bash: download the file, then
#    cd video && npx remotion ffmpeg -i <downloaded.mp4> -vn -ar 48000 public/episodes/001-oats/audio.wav
# 2. render
cd video && npm run render -- 001-oats
```

## Upload kit
**Title:** Brother, May I Have Some Oats? (Animated) · alt: *The Shed of No Return*
**Description:** Brother Gristle has seen what the Tall Skinny Ones do in the Shed of No Return. Brother Dumpling has a big red X on his side and a trough full of oats. Guess who's listening.
🎙️ Voice & audio: burialgoods — "brother may I have some oats" (a tribute to Joe Capo) · Original meme: Joe Capo (2017)
**Tags:** brother may i have some oats, burialgoods, joe capo, cursed animation, creepy cartoon, dark humor animation, shed of no return
