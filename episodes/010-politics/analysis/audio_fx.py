"""Episode 010 audio extras -> video/src/episodes/010-politics/audio_fx.json  (generated, never hand-edit)

Why: in the "Now" half (from 23.1 s) the voice sits under a loud score (drone + drum booms), so Rhubarb only found
~2 mouth cues per second there (vs 6-7 in the dry-ish "Then" half) and whisper stretched five words over pauses.
This script measures the voice directly and writes:
  now_mouth  mouth cues (Rhubarb shapes) for t >= NOW_FROM, from a voice-only loudness estimate
             (|mid| - 1.3|side|, 300-3400 Hz: the voice is centred, the score is wide) + spelling hints per word
  retime     corrected start times for words whisper stretched over a pause (captions, cue(), talking state)
  rumble     per-frame (24 fps) 0..1 low-band (35-200 Hz) level of the score, for shake / dust / torch flicker
  booms      [time, strength] of the drum hits in the score (centred low-band peaks), for impacts

The committed analysis (transcript.json, mouth_cues.json) and the generated timeline.json are left untouched;
video/src/episodes/010-politics/tl.ts merges these extras into the timeline at load time.

Usage (from the repo root, needs episodes/010-politics/source/audio_full.wav):
  python3 episodes/010-politics/analysis/audio_fx.py
"""
import json
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf
from scipy.signal import butter, find_peaks, sosfiltfilt

EP = Path(__file__).resolve().parent.parent
ROOT = EP.parent.parent
OUT = ROOT / "video" / "src" / "episodes" / EP.name / "audio_fx.json"
FPS = 24
NOW_FROM = 23.3  # the "Now" half starts after the dry "My politics now." read-out
HOP = 160  # 10 ms at 16 kHz

x, sr = sf.read(EP / "source" / "audio_full.wav")
dur = len(x) / sr
mid = x.mean(1)
side = (x[:, 0] - x[:, 1]) / 2
tr = json.loads((EP / "analysis" / "transcript.json").read_text())
words = [w for s in tr["segments"] for w in s["words"]]

# ---------------------------------------------------------------- voice estimate
m16 = librosa.resample(mid, orig_sr=sr, target_sr=16000)
s16 = librosa.resample(side, orig_sr=sr, target_sr=16000)
M = np.abs(librosa.stft(m16, n_fft=1024, hop_length=HOP))
S = np.abs(librosa.stft(s16, n_fft=1024, hop_length=HOP))
f = librosa.fft_frequencies(sr=16000, n_fft=1024)
band = (f >= 500) & (f <= 3400)  # above most drum / drone energy, still the voice's formants
V = np.maximum(M - 1.3 * S, 0)[band].sum(0)
V = np.convolve(V, np.ones(3) / 3, mode="same")
vt = np.arange(len(V)) * HOP / 16000


def v_at(t: float) -> float:
    return float(V[min(len(V) - 1, max(0, int(round(t * 100))))])


now_words = [dict(w) for w in words if w["start"] >= NOW_FROM - 0.2]
ref = np.percentile(V[(vt >= NOW_FROM) & (vt <= dur)], 97)

# ---------------------------------------------------------------- re-time stretched words
retime = {}
for w in now_words:
    if w["end"] - w["start"] < 0.6:
        continue
    a, b = w["start"], w["end"]
    # voiced runs inside the span (dips < 80 ms bridged); blips (< 0.1 s or weak) are drum leaks
    thr = 0.22 * ref
    runs, cur, quiet = [], None, 0.0
    for t in np.arange(a, b + 0.001, 0.01):
        if v_at(t) > thr:
            cur = [t, t] if cur is None else [cur[0], t]
            quiet = 0.0
        elif cur is not None:
            quiet += 0.01
            if quiet > 0.08:
                runs.append(cur)
                cur, quiet = None, 0.0
    if cur is not None:
        runs.append(cur)
    runs = [r for r in runs if r[1] - r[0] >= 0.1 and max(v_at(t) for t in np.arange(r[0], r[1] + 0.001, 0.01)) >= 0.45 * ref]
    if not runs:
        continue
    # whisper stretches a word back over the pause before it; the real word is the run that reaches the end
    last = runs[-1]
    if last[1] >= b - 0.25 and last[0] - a > 0.25:
        new = round(max(a, last[0] - 0.04), 2)
        retime[f"{w['word'].strip()}@{a:.2f}"] = new
        w["start"] = new
print("retimed words:", {k: float(v) for k, v in retime.items()})

# ---------------------------------------------------------------- mouth cues for the Now half
VOWEL_RND = set("ouw")
LIPS = set("mbp")
TEETH = set("fv")


def hint(w: dict, t: float) -> str:
    letters = [c for c in w["word"].lower() if c.isalpha()] or ["a"]
    k = (t - w["start"]) / max(0.05, w["end"] - w["start"])
    return letters[min(len(letters) - 1, max(0, int(k * len(letters))))]


# talking intervals (as build_timeline.py: word spans +- 0.04, gaps <= 0.28 merged)
ivs = []
for w in now_words:
    s0, e0 = w["start"] - 0.04, w["end"] + 0.04
    if ivs and s0 - ivs[-1][1] <= 0.28:
        ivs[-1][1] = max(ivs[-1][1], e0)
    else:
        ivs.append([s0, e0])

cues = []
step = 1 / FPS
for s0, e0 in ivs:
    # loudness reference per interval (soft lines still open the mouth)
    seg = V[(vt >= s0) & (vt <= e0)]
    lref = max(np.percentile(seg, 90) if len(seg) else ref, 0.35 * ref)
    t = s0
    while t < e0 - 1e-6:
        w = next((w for w in now_words if w["start"] - 0.04 <= t + step / 2 <= w["end"] + 0.04), None)
        o = v_at(t + step / 2) / lref
        h = hint(w, t + step / 2) if w else " "
        if w is None or o < 0.14:
            val = "A" if (w is None or h in LIPS) else "B"
        elif h in LIPS and o < 0.75:
            val = "A"
        elif h in TEETH:
            val = "G"
        elif h == "l" and o > 0.25:
            val = "H"
        elif h in VOWEL_RND:
            val = "F" if o < 0.45 else "E"
        elif o > 0.62:
            val = "D"
        elif o > 0.36:
            val = "C"
        else:
            val = "B"
        cues.append({"start": round(t, 3), "end": round(min(e0, t + step), 3), "value": val})
        t += step
# merge equal neighbours
merged = []
for c in cues:
    if merged and merged[-1]["value"] == c["value"] and abs(merged[-1]["end"] - c["start"]) < 1e-3:
        merged[-1]["end"] = c["end"]
    else:
        merged.append(dict(c))
nsec = sum(e - s for s, e in ivs)
print(f"now_mouth: {len(merged)} cues over {nsec:.1f} s of speech ({len(merged) / nsec:.1f}/s)")

# ---------------------------------------------------------------- score: rumble envelope + drum booms
sos = butter(4, [35, 200], btype="bandpass", fs=sr, output="sos")
low = librosa.resample(sosfiltfilt(sos, mid), orig_sr=sr, target_sr=4000)
lenv = librosa.feature.rms(y=low, frame_length=240, hop_length=40)[0]  # 10 ms
ldb = np.convolve(20 * np.log10(lenv + 1e-9), np.ones(5) / 5, mode="same")
lt = np.arange(len(ldb)) * 0.01
nf = int(np.ceil(dur * FPS))
lo_ref = np.percentile(ldb[lt >= NOW_FROM], 97)
rumble = []
for i in range(nf):
    a, b = int(i / FPS * 100), int((i + 1) / FPS * 100)
    v = ldb[a:b].max() if b > a else ldb[min(a, len(ldb) - 1)]
    rumble.append(round(float(np.clip((v - (lo_ref - 36)) / 36, 0, 1)), 3))

peaks, props = find_peaks(ldb, prominence=6.0, distance=55)
cand_p, cand_props = find_peaks(ldb, prominence=2.5, distance=30)
boom_t = []
for p, pr in zip(peaks, props["prominences"]):
    t = lt[p]
    if t < 30.0:
        continue
    # skip peaks that are just the voice (inside a word) unless they are big
    in_word = any(w["start"] - 0.02 <= t <= w["end"] + 0.02 for w in now_words)
    if in_word and pr < 9.5:
        continue
    boom_t.append(p)
# rhythm fill-in: the drums settle into a steady beat (~1.5 s, then ~1 s); a gap of about two beats
# gets the weaker peak nearest the expected beat (those hits are masked by the voice)
filled = list(boom_t)
for i in range(1, len(boom_t) - 1):
    a, b = lt[boom_t[i]], lt[boom_t[i + 1]]
    period = a - lt[boom_t[i - 1]]
    if 0.7 < period < 1.7 and 1.6 * period < b - a < 2.6 * period:
        k = 1
        while a + k * period < b - 0.6 * period:
            exp = a + k * period
            near = [q for q in cand_p if abs(lt[q] - exp) < 0.18]
            if near:
                filled.append(max(near, key=lambda q: ldb[q]))
            k += 1
booms = []
for p in sorted(set(filled)):
    level = float(np.clip((ldb[p] - (lo_ref - 20)) / 20, 0.25, 1))
    booms.append([round(float(lt[p]) - 0.03, 2), round(level, 2)])
print("booms:", " ".join(f"{t:.2f}({s:.2f})" for t, s in booms))

OUT.write_text(json.dumps({"fps": FPS, "nowFrom": NOW_FROM, "retime": retime, "now_mouth": merged, "rumble": rumble, "booms": booms}))
print("wrote", OUT)
