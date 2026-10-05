"""Transcribe an episode's audio with word-level timestamps (faster-whisper).

Usage: python pipeline/transcribe.py episodes/001-oats [--model medium.en]
Writes <episode>/analysis/transcript.json
"""
import argparse
import json
from pathlib import Path

from faster_whisper import WhisperModel


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("episode", type=Path)
    ap.add_argument("--model", default="medium.en")
    ap.add_argument("--audio", default="source/audio_16k_mono.wav")
    args = ap.parse_args()

    audio = args.episode / args.audio
    out_dir = args.episode / "analysis"
    out_dir.mkdir(parents=True, exist_ok=True)

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        str(audio),
        language="en",
        word_timestamps=True,
        vad_filter=False,
        beam_size=5,
        condition_on_previous_text=False,
    )
    result = {"language": info.language, "duration": info.duration, "segments": []}
    for seg in segments:
        result["segments"].append(
            {
                "start": round(seg.start, 3),
                "end": round(seg.end, 3),
                "text": seg.text.strip(),
                "words": [
                    {"start": round(w.start, 3), "end": round(w.end, 3), "word": w.word.strip(), "p": round(w.probability, 3)}
                    for w in (seg.words or [])
                ],
            }
        )
        print(f"[{seg.start:7.2f} -> {seg.end:7.2f}] {seg.text.strip()}", flush=True)

    (out_dir / "transcript.json").write_text(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
