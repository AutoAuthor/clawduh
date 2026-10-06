"""Voice-only loudness + mouth shapes from it (used by build_timeline.py --mouth auto|envelope).

Rhubarb reads mouth shapes off the whole mix, which fails in two common cases:
  * music under the dialogue (a drone, a score): Rhubarb then finds ~2-3 mouth changes a second instead of the
    5-8 it finds on clean speech, and opens the mouth on the music rather than the voice;
  * whispered words: unvoiced speech gets closed/flat shapes, so the jaw barely moves.

This module measures how loud the *voice* is every 10 ms:
  1. mid - 1.3*side magnitude spectrum when the source is stereo (dialogue sits in the centre, music is usually wide);
  2. minus a running per-bin estimate of the music bed, subtracted in the power domain (the bed is the quietest each
     frequency gets within 3 s: a drone or score sets that floor, speech and stray sounds don't);
  3. summed over 300-4000 Hz (the formants; above most drum and drone energy).
Mouth shapes then come from that loudness (how open) and the word's spelling (which shape: lips for m/b/p, teeth for
f/v, rounded for o/u/w, tongue for l), letter rules like the provisional mode's.
"""
from dataclasses import dataclass
from math import gcd
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import resample_poly

SR = 16000
FRAME = 0.01  # seconds per voice-level frame
NFFT = 1024
BAND = (300.0, 4000.0)  # mouth openness: the formants
WIDE = (300.0, 7600.0)  # word boundaries
HISS = (4000.0, 7600.0)  # s/sh/f/th: quiet next to vowels, so word starts are walked back through it
SIDE_K = 1.3
BED_K = 1.2
BED_WIN = 3.0  # seconds
BED_BIAS = 1.5

OPEN = frozenset("CDEFH")
LIPS, TEETH, ROUND = frozenset("mbp"), frozenset("fv"), frozenset("ouw")
# rough openness of each Rhubarb shape, for comparing tracks with the measured voice
OPENNESS = {"X": 0.0, "A": 0.0, "B": 0.2, "G": 0.25, "F": 0.35, "C": 0.5, "E": 0.55, "H": 0.6, "D": 1.0}


def _to16k(x: np.ndarray, sr: int) -> np.ndarray:
    if sr == SR:
        return x
    g = gcd(int(sr), SR)
    return resample_poly(x, SR // g, int(sr) // g)


def load_channels(ep: Path) -> tuple[np.ndarray, np.ndarray | None]:
    """(mid, side) at 16 kHz; side is None for mono or dual-mono sources."""
    full = ep / "source" / "audio_full.wav"
    x, sr = sf.read(full if full.exists() else ep / "source" / "audio_16k_mono.wav", always_2d=True)
    x = x.astype(np.float64)
    if x.shape[1] < 2:
        return _to16k(x[:, 0], sr), None
    mid = x[:, :2].mean(axis=1)
    side = (x[:, 0] - x[:, 1]) / 2
    if np.sqrt(np.mean(side**2)) < 0.03 * (np.sqrt(np.mean(mid**2)) + 1e-12):
        return _to16k(mid, sr), None  # dual mono: nothing to separate
    return _to16k(mid, sr), _to16k(side, sr)


def _mag(x: np.ndarray) -> np.ndarray:
    import librosa

    return np.abs(librosa.stft(x, n_fft=NFFT, hop_length=int(SR * FRAME)))


def _bed(P: np.ndarray) -> np.ndarray:
    """Music bed = per-bin minimum of the (50 ms smoothed) power over 3 s, times a bias factor ("minimum statistics"):
    a steady bed sets that floor, while speech dips between syllables and stray sounds (laughs, breaths) don't
    raise it."""
    return BED_BIAS * minimum_filter1d(uniform_filter1d(P, size=5, axis=1), size=int(BED_WIN / FRAME), axis=1)


@dataclass
class Level:
    """Every 10 ms (FRAME):
    v       voice loudness (linear, arbitrary units) - side removed, bed subtracted, 300-4000 Hz;
    bed_mix power of the bed in the mono mix (what Rhubarb hears), 300-4000 Hz;
    mix     power of the mono mix, 300-4000 Hz;
    wide    as v but 300-7600 Hz (word boundaries);
    hiss    as v but 4000-7600 Hz (sibilants).
    mix / bed_mix over a line = how far the voice stands above the music Rhubarb heard (line_snr)."""

    v: np.ndarray
    bed_mix: np.ndarray
    mix: np.ndarray
    wide: np.ndarray
    hiss: np.ndarray


def voice_level(ep: Path) -> Level:
    """Measure an episode's voice level from its source audio (see Level)."""
    mid, side = load_channels(ep)
    freqs = np.fft.rfftfreq(NFFT, 1 / SR)
    band = (freqs >= BAND[0]) & (freqs <= BAND[1])
    M = _mag(mid)
    Pm = M**2
    bed_mix = _bed(Pm)[band].sum(axis=0)
    mix = Pm[band].sum(axis=0)
    X = np.maximum(M - SIDE_K * _mag(side), 0) if side is not None else M
    P = X**2
    V = np.sqrt(np.maximum(P - BED_K**2 * _bed(P), 0))
    k = np.ones(3) / 3

    def level(lo_hi: tuple[float, float]) -> np.ndarray:
        sel = (freqs >= lo_hi[0]) & (freqs <= lo_hi[1])
        return np.convolve(V[sel].sum(axis=0), k, mode="same")

    return Level(v=level(BAND), bed_mix=bed_mix, mix=mix, wide=level(WIDE), hiss=level(HISS))


def at(v: np.ndarray, t: float, reach: int = 0) -> float:
    i = min(len(v) - 1, max(0, int(round(t / FRAME))))
    return float(v[max(0, i - reach) : i + reach + 1].max())


def span(v: np.ndarray, s: float, e: float) -> np.ndarray:
    a, b = max(0, int(s / FRAME)), min(len(v), int(np.ceil(e / FRAME)) + 1)
    return v[a:b] if b > a else v[a : a + 1]


def _hint(w: dict, t: float) -> str:
    letters = [c for c in w["word"].lower() if c.isalpha()] or ["a"]
    k = (t - w["start"]) / max(0.05, w["end"] - w["start"])
    return letters[min(len(letters) - 1, max(0, int(k * len(letters))))]


def shape_for(o: float, h: str) -> str:
    """Rhubarb shape for openness o (1 = this speaker's loud peaks) and the letter being spoken."""
    if o < 0.14:
        return "A" if h in LIPS else "B"
    if h in LIPS and o < 0.75:
        return "A"
    if h in TEETH:
        return "G"
    if h == "l" and o > 0.25:
        return "H"
    if h in ROUND:
        return "F" if o < 0.45 else "E"
    if o > 0.62:
        return "D"
    if o > 0.36:
        return "C"
    return "B"


def merge(cues: list[dict]) -> list[dict]:
    out: list[dict] = []
    for c in cues:
        if out and out[-1]["value"] == c["value"] and abs(out[-1]["end"] - c["start"]) < 1e-3:
            out[-1]["end"] = c["end"]
        else:
            out.append(dict(c))
    return out


def envelope_cues(v: np.ndarray, words: list[dict], s: float, e: float, lref: float, fps: int) -> list[dict]:
    """Mouth cues for [s, e): openness from the voice level (normalised by lref), shape from the spelling."""
    step = 1.0 / fps
    cues = []
    t = s
    while t < e - 1e-6:
        tm = t + step / 2
        w = next((w for w in words if w["start"] - 0.04 <= tm <= w["end"] + 0.04), None)
        if w is None:
            val = "A"  # between words: lips together
        else:
            o = at(v, tm, reach=1) / lref if lref > 0 else 0.0
            val = shape_for(o, _hint(w, tm))
        cues.append({"start": round(t, 3), "end": round(min(e, t + step), 3), "value": val})
        t += step
    return merge(_no_blips(merge(cues), 1.5 * step))


def _no_blips(cues: list[dict], min_dur: float) -> list[dict]:
    """Fold cues shorter than min_dur into the longer neighbour, so the mouth doesn't flap frame by frame."""
    cues = [dict(c) for c in cues]
    i = 0
    while i < len(cues):
        c = cues[i]
        if c["end"] - c["start"] < min_dur and len(cues) > 1:
            prev = cues[i - 1] if i > 0 else None
            nxt = cues[i + 1] if i + 1 < len(cues) else None
            prev_longer = prev is not None and (nxt is None or prev["end"] - prev["start"] >= nxt["end"] - nxt["start"])
            if prev_longer:
                prev["end"] = c["end"]
            else:
                nxt["start"] = c["start"]
            cues.pop(i)
            i = max(0, i - 1)
            continue
        i += 1
    return cues


def openness_series(cues: list[dict], s: float, e: float, step: float = 0.02) -> np.ndarray:
    """Openness every `step` seconds over [s, e) for a cue track (0 where no cue)."""
    ts = np.arange(s, e, step)
    out = np.zeros(len(ts))
    j = 0
    cs = sorted(cues, key=lambda c: c["start"])
    for i, t in enumerate(ts):
        while j < len(cs) and cs[j]["end"] <= t:
            j += 1
        if j < len(cs) and cs[j]["start"] <= t:
            out[i] = OPENNESS.get(cs[j]["value"], 0.2)
    return out


def retime_words(words: list[dict], lv: Level) -> tuple[list[dict], list[str]]:
    """Fix word spans whisper stretched over silence (the voice says where the word really is).

    * start pulled back over the pause before the word: if the voiced run that reaches the word's end starts more
      than 0.25 s after the word's start, the word starts there instead (minus 40 ms);
    * end dragged over the pause after the word: if the voice stops more than 0.45 s before the word's end and the
      rest is silent, the word ends 60 ms after it.
    Only words of 0.6 s or more are touched, and only on clear evidence (runs of >= 0.1 s near this voice's level).
    A new start is walked back through any hiss right before it (s/sh/f/th are quiet next to the vowel).
    """
    v, hiss = lv.wide, lv.hiss
    out, notes = [], []
    for w in words:
        w = dict(w)
        a, b = w["start"], w["end"]
        if b - a >= 0.6:
            local = span(v, a - 3.0, b + 3.0)
            ref = float(np.percentile(local, 97)) if len(local) else 0.0
            runs: list[list[float]] = []
            if ref > 0:
                thr, cur, quiet = 0.22 * ref, None, 0.0
                for t in np.arange(a, b + 0.001, FRAME):
                    if at(v, t) > thr:
                        cur = [t, t] if cur is None else [cur[0], t]
                        quiet = 0.0
                    elif cur is not None:
                        quiet += FRAME
                        if quiet > 0.08:
                            runs.append(cur)
                            cur, quiet = None, 0.0
                if cur is not None:
                    runs.append(cur)
                runs = [r for r in runs if r[1] - r[0] >= 0.1 and float(span(v, r[0], r[1]).max()) >= 0.45 * ref]
            if runs:
                last, first = runs[-1], runs[0]
                if last[1] >= b - 0.25 and last[0] - a > 0.25:
                    new = max(a, last[0] - 0.04)
                    href = float(np.percentile(span(hiss, a, b), 90))
                    back = 0.0
                    while new - FRAME >= a and back < 0.3 and at(hiss, new - FRAME) > 0.35 * href:
                        new -= FRAME
                        back += FRAME
                    new = round(new, 2)
                    notes.append(f"{w['word'].strip()}@{a:.2f}: start -> {new:.2f}")
                    w["start"] = new
                elif first[0] <= a + 0.25 and b - last[1] > 0.45 and span(v, last[1] + 0.1, b).max() < 0.1 * ref:
                    new = round(min(b, last[1] + 0.06), 2)
                    notes.append(f"{w['word'].strip()}@{a:.2f}: end {b:.2f} -> {new:.2f}")
                    w["end"] = new
        if out and w["start"] < out[-1]["start"]:
            w["start"] = out[-1]["start"]
        out.append(w)
    return out, notes


# ---------------------------------------------------------------------------------------------------------------
# --mouth auto|envelope: decide where Rhubarb can be trusted and rebuild the rest from the voice level
# ---------------------------------------------------------------------------------------------------------------

SNR_MIN = 14.5  # dB above the floor: lower and the line sits on music (or is whispered) - Rhubarb can't follow it
RATE_MIN = 2.5  # mouth changes per second: fewer and Rhubarb has given up on the line (clean speech gives 5-8)
WHISPER_DUR = (0.2, 1.5)  # seconds
WHISPER_REL = (0.03, 0.35)  # word loudness relative to the speaker's peaks: quiet but audible


def line_snr(bed_mix: np.ndarray, mix: np.ndarray, s: float, e: float) -> float:
    """Median level of the mono mix above its floor over [s, e), in dB (dry dialogue 20-40, over music 8-14)."""
    return float(np.median(10 * np.log10((span(mix, s, e) + 1e-12) / (span(bed_mix, s, e) + 1e-12))))


def change_rate(cues: list[dict], s: float, e: float) -> float:
    vals = [c["value"] for c in cues if c["end"] > s and c["start"] < e]
    changes = sum(1 for i, x in enumerate(vals) if i == 0 or x != vals[i - 1])
    return changes / max(1e-6, e - s)


def splice(track: list[dict], a: float, b: float, ins: list[dict]) -> list[dict]:
    """Replace the cues inside [a, b) with `ins` (cues straddling the edges are clipped, not dropped)."""
    out = []
    for c in track:
        if c["end"] <= a or c["start"] >= b:
            out.append(c)
            continue
        if c["start"] < a:
            out.append({**c, "end": round(a, 3)})
        if c["end"] > b:
            out.append({**c, "start": round(b, 3)})
    return sorted(out + ins, key=lambda c: c["start"])


def fix_tracks(
    tracks: dict[str, list[dict]],
    talking: dict[str, list[list[float]]],
    lines: list[dict],
    lv: Level,
    mode: str,
    fps: int,
) -> tuple[dict[str, list[dict]], dict]:
    """Per speaker, per talking stretch: keep Rhubarb where it can hear the voice; elsewhere build the cues from the
    voice level. mode "envelope" rebuilds every stretch."""
    st = {"lines": 0, "lines_voice": 0, "talk": 0.0, "talk_voice": 0.0, "words": 0, "why": {"music": 0, "rate": 0}}
    v, bed_mix, mix = lv.v, lv.bed_mix, lv.mix
    out = {}
    for spk, ivs in talking.items():
        spk_words = [w for ln in lines if ln["speaker"] == spk for w in ln["words"]]
        frames = [span(v, w["start"], w["end"]) for w in spk_words]
        allf = np.concatenate(frames) if frames else np.zeros(1)
        gref = float(np.percentile(allf, 97)) if allf.size else 0.0  # this speaker's loud peaks
        track = tracks.get(spk, [])
        new: list[dict] = []
        for s, e in ivs:
            ws = [w for w in spk_words if w["end"] > s and w["start"] < e]
            cur = [c for c in track if c["start"] >= s - 1e-6 and c["end"] <= e + 1e-6]
            st["lines"] += 1
            st["talk"] += e - s
            snr = line_snr(bed_mix, mix, s, e)
            rate = change_rate(cur, s, e)
            if mode == "envelope" or (e - s >= 0.4 and (snr < SNR_MIN or rate < RATE_MIN)):
                if mode != "envelope":
                    st["why"]["music" if snr < SNR_MIN else "rate"] += 1
                wf = [span(v, w["start"], w["end"]) for w in ws]
                line_v = np.concatenate(wf) if wf else span(v, s, e)
                lref = max(float(np.percentile(line_v, 95)), 0.35 * gref)  # soft lines still open the mouth
                cur = envelope_cues(v, ws, s, e, lref, fps)
                st["lines_voice"] += 1
                st["talk_voice"] += e - s
            else:
                # whispered words: audible but quiet (3-35% of this speaker's peaks), long enough to see, and Rhubarb
                # left them shut -> open them from the voice level, to a moderate opening (whispers aren't shouted).
                # Short or normally voiced words with closed-ish shapes ("be", "him") are Rhubarb being right.
                for w in ws:
                    d = w["end"] - w["start"]
                    if not WHISPER_DUR[0] <= d <= WHISPER_DUR[1]:
                        continue
                    if any(c["value"] in OPEN for c in cur if c["end"] > w["start"] and c["start"] < w["end"]):
                        continue
                    peak = float(np.percentile(span(v, w["start"], w["end"]), 90))
                    if not WHISPER_REL[0] * gref <= peak <= WHISPER_REL[1] * gref:
                        continue
                    ins = envelope_cues(v, [w], w["start"], w["end"], peak / 0.55, fps)
                    cur = splice(cur, w["start"], w["end"], ins)
                    st["words"] += 1
            new.extend(cur)
        out[spk] = merge(sorted(new, key=lambda c: c["start"]))
    return out, st
