#!/usr/bin/env bash
# Download a source clip and prepare the audio files every later step expects.
# Usage: pipeline/fetch_audio.sh <url-or-local-file> episodes/002-something [slug]
#   - URL: anything yt-dlp understands (YouTube/TikTok/Instagram/archive.org), or a direct media URL
#   - slug: name of the public folder used by the Remotion composition (default: episode dir name)
set -euo pipefail
SRC="$1"; EP="$2"; SLUG="${3:-$(basename "$EP")}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$EP/source"
if [[ -f "$SRC" ]]; then
  cp "$SRC" "$EP/source/original"
elif [[ "$SRC" =~ \.(mp4|mp3|m4a|wav|webm|ogg)$ ]]; then
  curl -sSL -o "$EP/source/original" "$SRC"
else
  yt-dlp -f bestaudio/best -o "$EP/source/original.%(ext)s" "$SRC"
  mv "$EP"/source/original.* "$EP/source/original"
fi
ffmpeg -v error -y -i "$EP/source/original" -vn -ac 1 -ar 16000 "$EP/source/audio_16k_mono.wav"
ffmpeg -v error -y -i "$EP/source/original" -vn -c:a pcm_s16le -ar 48000 "$EP/source/audio_full.wav"
mkdir -p "$ROOT/video/public/episodes/$SLUG"
cp "$EP/source/audio_full.wav" "$ROOT/video/public/episodes/$SLUG/audio.wav"
echo "audio ready: $EP/source/ and video/public/episodes/$SLUG/audio.wav"
