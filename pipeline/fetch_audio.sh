#!/usr/bin/env bash
# Download (or copy) a source clip and prepare the audio every later step expects.
# Usage: pipeline/fetch_audio.sh <url-or-local-file> episodes/002-troubled
#   URL: anything yt-dlp understands (YouTube/TikTok/Instagram/archive.org) or a direct media URL.
# Writes episodes/<id>/source/{original,audio_16k_mono.wav,audio_full.wav}
#    and video/public/episodes/<id>/audio.wav (what Remotion plays).
set -euo pipefail
SRC="$1"; EP="${2%/}"; ID="$(basename "$EP")"
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
mkdir -p "$ROOT/video/public/episodes/$ID"
cp "$EP/source/audio_full.wav" "$ROOT/video/public/episodes/$ID/audio.wav"
echo "audio ready: $EP/source/ and video/public/episodes/$ID/audio.wav"
