#!/usr/bin/env bash
# Full analysis pass for one episode: transcribe -> lip-sync -> timeline JSON for Remotion.
# Needs episodes/<id>/source/ (pipeline/fetch_audio.sh) and episodes/<id>/speakers.json.
# Usage: pipeline/run_episode.sh episodes/002-troubled
set -euo pipefail
EP="${1%/}"; ID="$(basename "$EP")"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$ROOT/pipeline/transcribe.py" "$EP"
"$ROOT/pipeline/lipsync.sh" "$EP"
python3 "$ROOT/pipeline/build_timeline.py" "$EP" --out "$ROOT/video/src/episodes/$ID/timeline.json"
