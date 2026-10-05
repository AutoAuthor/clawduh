#!/usr/bin/env bash
# Full analysis pass for one episode (after speakers.json exists or will be edited):
#   transcribe -> lip-sync -> timeline JSON for Remotion.
# Usage: pipeline/run_episode.sh episodes/001-oats oats
set -euo pipefail
EP="$1"; SLUG="$2"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$ROOT/pipeline/transcribe.py" "$EP"
"$ROOT/pipeline/lipsync.sh" "$EP"
if [[ ! -f "$EP/speakers.json" ]]; then
  echo "Create $EP/speakers.json (speaker turns) — see episodes/001-oats/speakers.json — then re-run." >&2
  exit 1
fi
python3 "$ROOT/pipeline/build_timeline.py" "$EP" "$ROOT/video/src/episodes/$SLUG/timeline.json"
