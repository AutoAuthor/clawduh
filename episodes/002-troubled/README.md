# Episode 002 — "Brother, I Am Troubled"

| | |
|---|---|
| **Audio** | burialgoods — "Brother, I am troubled" · YouTube: https://youtu.be/yA5lujNlkn8 |
| **Length** | 7:21 (441 s) |
| **Status** | ⚠️ **provisional timing** — built from YouTube's word-timed captions because the audio can't be downloaded from the cloud machine. Renders silent with approximate lip-sync until the real audio is analysed (below). Shots and speaker turns are anchored to the *words*, so they re-align automatically. |
| **Compositions** | `ep002-troubled` (1920×1080) · `ep002-troubled-vertical` (1080×1920) |
| **Code** | `video/src/episodes/002-troubled/` — sets, cutaways, `shots.tsx`, `timeline.json` |

**Cast (same farm as episode 001):** Brother Brisket (black scarred bull — troubled, then vengeful) · Brother Chuck
(fat brown bull — content, knows more than he says, joins at the end) · Dennis (Brisket's son, back from the Shed
in a vet cone, says odd things from the barn) · the pigs and crows who "know things" · the Tall Skinny Ones.

## Finalise timing with the real audio (one time)
```bash
pipeline/fetch_audio.sh "https://youtu.be/yA5lujNlkn8" episodes/002-troubled   # needs yt-dlp; works from a home connection
pipeline/run_episode.sh episodes/002-troubled                                   # whisper + Rhubarb + speakers.json -> timeline.json
```
Then check the speaker split in the printed line list (all three voices are burialgoods — `speakers.json` assigns
turns by their opening words; fix any line that landed on the wrong bull and re-run the last step).
*(Or drop the audio file in the chat and it gets done for you.)*

## Render (both versions)
```bash
cd video && npm run render -- 002-troubled
```

## Upload kit
**Title:** Brother, I Am Troubled (Animated) · alt: *The Mightiest Bulls in the Prairie*
**Description:** Two bulls rule the prairie. One of them has started counting the calves.
🎙️ Voice & audio: burialgoods — "Brother, I am troubled"
**Tags:** burialgoods, brother i am troubled, mightiest bulls in the prairie, shed of no return, cursed animation, dark humor animation
