"""Merge transcript + speaker turns + Rhubarb mouth cues into a render timeline.

Usage: python pipeline/build_timeline.py episodes/001-oats [--out video/src/episodes/001-oats/timeline.json] [--fps 24]

Inputs (inside the episode dir):
  analysis/transcript.json   word timestamps (pipeline/transcribe.py)
  analysis/mouth_cues.json   Rhubarb output (pipeline/lipsync.sh)
  speakers.json              speaker turns: {"from": seconds} or {"at": "first words of the turn"}
  source/audio_16k_mono.wav  for the loudness envelope
"""
import argparse
import bisect
import difflib
import json
import re
from pathlib import Path

import numpy as np
import soundfile as sf

GAP_MERGE = 0.28  # seconds of silence inside a speaker's words that still counts as "talking"
PAD = 0.04


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", w.lower())


def find_phrase(words: list[dict], phrase: str, start_idx: int = 0, window: int = 160) -> tuple[int, float]:
    """Index of the first word where `phrase` is spoken (fuzzy), searching a window after start_idx.
    Returns the earliest position scoring >= 0.75, else the best-scoring one in the window."""
    target = [norm(x) for x in phrase.split() if norm(x)]
    n = len(target)
    tj = " ".join(target)
    best = (min(start_idx, len(words) - 1), 0.0)
    end = min(len(words) - n + 1, start_idx + window)
    # an exact (or near-exact) match soon after the previous turn wins over an earlier look-alike phrase
    for i in range(start_idx, min(end, start_idx + 60)):
        cand = " ".join(norm(w["word"]) for w in words[i : i + n])
        if difflib.SequenceMatcher(None, tj, cand).ratio() >= 0.95:
            return i, 1.0
    for i in range(start_idx, max(start_idx + 1, end)):
        cand = " ".join(norm(w["word"]) for w in words[i : i + n])
        r = difflib.SequenceMatcher(None, tj, cand).ratio()
        if r >= 0.75:
            # take the best of this and the next few positions (avoid locking on one word early)
            cands = [(i, r)]
            for j in range(i + 1, min(i + 7, len(words) - n + 1)):
                cands.append((j, difflib.SequenceMatcher(None, tj, " ".join(norm(w["word"]) for w in words[j : j + n])).ratio()))
            return max(cands, key=lambda c: c[1])
        if r > best[1]:
            best = (i, r)
    return best


VOWEL_SHAPES = {"a": "D", "o": "E", "u": "F", "w": "F", "e": "C", "i": "C", "y": "C"}
CONS_SHAPES = {"m": "A", "b": "A", "p": "A", "f": "G", "v": "G", "l": "H"}


def synth_mouth(words: list[dict]) -> list[dict]:
    """Rough mouth shapes from spelling (provisional mode, no audio for Rhubarb)."""
    cues = []
    for w in words:
        letters = [c for c in w["word"].lower() if c.isalpha()] or ["a"]
        dur = max(0.08, w["end"] - w["start"])
        n = max(1, min(len(letters), int(dur / 0.09)))
        for k in range(n):
            ch = letters[int(k * len(letters) / n)]
            val = VOWEL_SHAPES.get(ch) or CONS_SHAPES.get(ch) or "B"
            cues.append({"start": w["start"] + dur * k / n, "end": w["start"] + dur * (k + 1) / n, "value": val})
    return cues


def resolve_turns(turns: list[dict], words: list[dict]) -> list[dict]:
    """Turns may give a start time ("from") or the opening words ("at").
    Returns [{from, speaker, idx}] where idx is the first word of the turn (words are assigned by order,
    so two words Whisper stamped with the same start time still land on the right speaker)."""
    out, idx = [], 0
    for t in turns:
        if "at" in t:
            i, score = find_phrase(words, t["at"], idx)
            if score < 0.6:
                ctx = " ".join(w["word"] for w in words[i : i + 6])
                print(f"WARNING: weak match ({score:.2f}) for turn '{t['at']}' -> '{ctx}' @ {words[i]['start']:.2f}")
            out.append({"from": max(0.0, words[i]["start"] - 0.05), "speaker": t["speaker"], "idx": i})
            idx = min(i + 1, len(words) - 1)
        else:
            frm = float(t["from"])
            i = next((k for k, w in enumerate(words) if w["start"] >= frm), len(words))
            out.append({"from": frm, "speaker": t["speaker"], "idx": i})
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("episode", type=Path)
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--transcript", default="analysis/transcript.json", help="relative to the episode dir")
    ap.add_argument("--provisional", action="store_true", help="no audio yet: synthesize mouth shapes + loudness from words")
    ap.add_argument("--duration", type=float, default=None, help="clip length in seconds (provisional mode)")
    args = ap.parse_args()
    ep = args.episode
    out_path = args.out or Path(__file__).resolve().parent.parent / "video" / "src" / "episodes" / ep.resolve().name / "timeline.json"

    transcript = json.loads((ep / args.transcript).read_text())
    spk_cfg = json.loads((ep / "speakers.json").read_text())
    words = [w for s in transcript["segments"] for w in s["words"]]
    if args.provisional:
        cues = synth_mouth(words)
        duration = args.duration or (words[-1]["end"] + 1.0)
        audio, sr = None, 16000
    else:
        cues = json.loads((ep / "analysis/mouth_cues.json").read_text())["mouthCues"]
        audio, sr = sf.read(ep / "source/audio_16k_mono.wav")
        duration = len(audio) / sr

    turns = resolve_turns(spk_cfg["turns"], words)
    turn_idx = [t["idx"] for t in turns]

    def speaker_of(k: int) -> str:
        return turns[max(0, bisect.bisect_right(turn_idx, k) - 1)]["speaker"]

    # Group consecutive words of the same speaker into lines.
    lines = []
    for k, w in enumerate(words):
        spk = speaker_of(k)
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
    n_frames = int(np.ceil(duration * args.fps))
    if audio is None:
        env = np.zeros(n_frames)
        for w in words:
            env[int(w["start"] * args.fps) : int(w["end"] * args.fps) + 1] = 0.55
    else:
        hop = sr / args.fps
        env = []
        for i in range(n_frames):
            a, b = int(i * hop), int((i + 1) * hop)
            chunk = audio[a:b]
            env.append(float(np.sqrt(np.mean(chunk**2))) if len(chunk) else 0.0)
        env = np.array(env)
        env = env / (np.percentile(env, 99) + 1e-9)
        env = np.clip(env, 0, 1)

    out = {
        "provisional": bool(args.provisional),
        "fps": args.fps,
        "duration": round(duration, 3),
        "lines": lines,
        "mouth": tracks,
        "energy": [round(float(x), 3) for x in env],
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out))
    print("wrote", out_path)
    for ln in lines:
        print(f"{ln['start']:7.2f}-{ln['end']:7.2f} {ln['speaker']:>9}: {ln['text'][:90]}")


if __name__ == "__main__":
    main()
