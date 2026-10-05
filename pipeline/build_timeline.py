"""Merge transcript + speaker turns + Rhubarb mouth cues into a render timeline.

Usage: python pipeline/build_timeline.py episodes/001-oats video/src/episodes/oats/timeline.json [--fps 24]

Inputs (inside the episode dir):
  analysis/transcript.json   word timestamps (pipeline/transcribe.py)
  analysis/mouth_cues.json   Rhubarb output (pipeline/lipsync.sh)
  speakers.json              speaker turns
  source/audio_16k_mono.wav  for the loudness envelope
"""
import argparse
import bisect
import json
from pathlib import Path

import numpy as np
import soundfile as sf

GAP_MERGE = 0.28  # seconds of silence inside a speaker's words that still counts as "talking"
PAD = 0.04


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("episode", type=Path)
    ap.add_argument("out", type=Path)
    ap.add_argument("--fps", type=int, default=24)
    args = ap.parse_args()
    ep = args.episode

    transcript = json.loads((ep / "analysis/transcript.json").read_text())
    cues = json.loads((ep / "analysis/mouth_cues.json").read_text())["mouthCues"]
    turns = json.loads((ep / "speakers.json").read_text())["turns"]
    audio, sr = sf.read(ep / "source/audio_16k_mono.wav")
    duration = len(audio) / sr

    turn_starts = [t["from"] for t in turns]

    def speaker_at(t: float) -> str:
        return turns[max(0, bisect.bisect_right(turn_starts, t) - 1)]["speaker"]

    words = [w for s in transcript["segments"] for w in s["words"]]

    # Group consecutive words of the same speaker into lines.
    lines = []
    for w in words:
        spk = speaker_at(w["start"])
        word = {"start": w["start"], "end": w["end"], "word": w["word"]}
        if lines and lines[-1]["speaker"] == spk:
            lines[-1]["words"].append(word)
            lines[-1]["end"] = w["end"]
        else:
            lines.append({"speaker": spk, "start": w["start"], "end": w["end"], "words": [word]})
    for ln in lines:
        ln["text"] = " ".join(w["word"] for w in ln["words"])

    # Talking intervals per speaker (merge short gaps between words).
    talking: dict[str, list[list[float]]] = {}
    for ln in lines:
        iv = talking.setdefault(ln["speaker"], [])
        for w in ln["words"]:
            s, e = w["start"] - PAD, w["end"] + PAD
            if iv and s - iv[-1][1] <= GAP_MERGE:
                iv[-1][1] = max(iv[-1][1], e)
            else:
                iv.append([s, e])

    # Per-speaker mouth track: Rhubarb cues clipped to that speaker's talking intervals.
    tracks = {}
    for spk, ivs in talking.items():
        track = []
        for s, e in ivs:
            for c in cues:
                cs, ce = max(c["start"], s), min(c["end"], e)
                if ce - cs <= 0.001:
                    continue
                val = c["value"]
                if val == "X":
                    val = "B"  # mid-word rest: keep lips slightly apart
                track.append({"start": round(cs, 3), "end": round(ce, 3), "value": val})
        tracks[spk] = track

    # Loudness envelope per video frame (0..1).
    hop = sr / args.fps
    n_frames = int(np.ceil(duration * args.fps))
    env = []
    for i in range(n_frames):
        a, b = int(i * hop), int((i + 1) * hop)
        chunk = audio[a:b]
        env.append(float(np.sqrt(np.mean(chunk**2))) if len(chunk) else 0.0)
    env = np.array(env)
    env = env / (np.percentile(env, 99) + 1e-9)
    env = np.clip(env, 0, 1)

    out = {
        "fps": args.fps,
        "duration": round(duration, 3),
        "lines": lines,
        "mouth": tracks,
        "energy": [round(float(x), 3) for x in env],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out))
    for ln in lines:
        print(f"{ln['start']:7.2f}-{ln['end']:7.2f} {ln['speaker']:>9}: {ln['text'][:90]}")


if __name__ == "__main__":
    main()
