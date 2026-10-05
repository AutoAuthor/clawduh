# Episode 003 — "You Wouldn't"

| | |
|---|---|
| **Audio** | burialgoods — "You wouldn't" · YouTube: https://youtu.be/OqEE_A93LmI · mirror: https://archive.org/details/you-wouldnt-dubbed-meme-by-burialgoods. |
| **Length** | 0:20 (19.0 s audio + 1.15 s silent hold on the drenched cat) |
| **Status** | ✅ final — timeline from the real audio (whisper + Rhubarb) |
| **Compositions** | `ep003-wouldnt` (1920×1080) · `ep003-wouldnt-vertical` (1080×1920) |
| **Code** | `video/src/episodes/003-wouldnt/` — `kitchen.tsx` (set + close-ups), `shots.tsx`, `timeline.json` |

**Cast:** Crumpet (defiant grey tabby, "your favorite son") · Mother (a tall skinny one in curlers, robe and a green
face mask, holding a spray bottle — never speaks). The spray lands on the cut-off "I don't beli—" (≈18.5 s).

## Render (both versions)
```bash
pipeline/fetch_audio.sh "https://archive.org/download/you-wouldnt-dubbed-meme-by-burialgoods./You%20wouldn_t.mp4" episodes/003-wouldnt
#    or: cd video && npx remotion ffmpeg -i <downloaded clip> -vn -ar 48000 public/episodes/003-wouldnt/audio.wav
cd video && npm run render -- 003-wouldnt
```

## Upload kit
**Title:** You Wouldn't. (Animated) · alt: *Your Favorite Son*
**Description:** 3:07 AM. The counter is forbidden. The cat has questions about Mother's resolve.
🎙️ Voice & audio: burialgoods — "You wouldn't"
**Tags:** burialgoods, you wouldn't, cat spray bottle, cursed animation, creepy cartoon, dark humor animation, cat meme
