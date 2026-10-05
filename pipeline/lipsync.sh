#!/usr/bin/env bash
# Mouth-shape cues with Rhubarb Lip Sync, using the transcript as a dialog hint.
# Usage: pipeline/lipsync.sh episodes/001-oats
set -euo pipefail
EP="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RHUBARB="${RHUBARB:-$ROOT/tools/rhubarb/rhubarb}"
python3 - "$EP" <<'PY'
import json, sys
ep = sys.argv[1]
t = json.load(open(f"{ep}/analysis/transcript.json"))
open(f"{ep}/analysis/dialog.txt", "w").write(" ".join(s["text"] for s in t["segments"]) + "\n")
PY
"$RHUBARB" -q -f json --extendedShapes GHX --threads "$(nproc)" \
  -d "$EP/analysis/dialog.txt" -o "$EP/analysis/mouth_cues.json" "$EP/source/audio_16k_mono.wav"
echo "wrote $EP/analysis/mouth_cues.json"
