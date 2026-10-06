"""Episode 009 voice analysis (run from the repo root):  python3 episodes/009-face-of-god/analysis/voice_analysis.py

The whole clip sits on a sustained, wide-stereo ambient drone (about -15 dBFS), so the usual loudness envelope and
Rhubarb's cues are dominated by the music. This script removes the bed (per-bin running percentile of the spectrum
over the non-speech frames within +-2.5 s, subtracted in the power domain) and then:

  1. writes video/src/episodes/009-face-of-god/voice_env.json - a 0..1 voice-only activity envelope per video frame
     (24 fps), used by the episode's mouth rig to open/close the mouths on the real voice;
  2. prints the speaker evidence per transcript segment: median f0 (harmonic comb with an inter-harmonic penalty),
     spectral tilt (2-5 kHz vs 0.3-1 kHz: whisper vs voiced), speaking rate, and a leave-one-out nearest-centroid
     test of the meaning-based split on mean MFCCs (c1..c19 from the bed-subtracted mel spectrum).
"""
import json
from pathlib import Path

import librosa
import numpy as np
import scipy.fftpack
import soundfile as sf

EP = Path("episodes/009-face-of-god")
OUT = Path("video/src/episodes/009-face-of-god/voice_env.json")
y, sr = sf.read(EP / "source/audio_16k_mono.wav")
if y.ndim == 2:
    y = y.mean(axis=1)
assert sr == 16000, sr
NFFT, HOP = 1024, 160
fps = sr / HOP
X = np.abs(librosa.stft(y, n_fft=NFFT, hop_length=HOP))
nF = X.shape[1]
freqs = librosa.fft_frequencies(sr=sr, n_fft=NFFT)
segs = json.loads((EP / "analysis/transcript.json").read_text())["segments"]
words = [w for s in segs for w in s["words"]]

speech = np.zeros(nF, bool)
for w in words:
    a, b = int((w["start"] - 0.25) * fps), int((w["end"] + 0.3) * fps)
    speech[max(0, a) : min(nF, b)] = True


def bed_of(A: np.ndarray, pct: float) -> np.ndarray:
    bed = np.zeros_like(A)
    half = int(2.5 * fps)
    for c in range(0, A.shape[1], 25):
        a, b = max(0, c - half), min(A.shape[1], c + half)
        sel = ~speech[a:b]
        seg = A[:, a:b][:, sel] if sel.sum() > 20 else A[:, a:b]
        bed[:, c : c + 25] = np.percentile(seg, pct, axis=1, keepdims=True)
    return bed


# ---- 1. voice-only envelope ------------------------------------------------------------------
bed90 = bed_of(X, 90)
V = np.maximum(X**2 - (1.25 * bed90) ** 2, 0)
band = (freqs > 300) & (freqs < 5000)
e = np.convolve(V[band].sum(axis=0), np.ones(3) / 3, mode="same")
db = 10 * np.log10(e + 1e-12)
ref = np.percentile(db[speech], 97)
env = np.clip((db - (ref - 28)) / 28, 0, 1)
n24 = int(np.ceil(len(y) / sr * 24))
env24 = [round(float(env[int(i / 24 * fps) : max(int((i + 1) / 24 * fps), int(i / 24 * fps) + 1)].max()), 2) for i in range(n24)]
OUT.write_text(json.dumps({"fps": 24, "env": env24}))
print("wrote", OUT, len(env24), "frames")

# ---- 2. speaker evidence -----------------------------------------------------------------------
bed75 = bed_of(X, 75)
VM = np.maximum(X**2 - (1.3 * bed75) ** 2, 0)
mel = librosa.filters.mel(sr=sr, n_fft=NFFT, n_mels=40, fmin=60, fmax=7600)

# pitch: harmonic comb on a long-window spectrum (fine frequency resolution)
NF2 = 8192
X2 = np.abs(librosa.stft(y, n_fft=NF2, hop_length=HOP, win_length=1200))
b2 = bed_of(X2, 90)
V2 = np.sqrt(np.maximum(X2 - 1.1 * b2, 0))
binf = sr / NF2
cands = np.arange(70, 420, 1.0)


def at(f: np.ndarray) -> np.ndarray:
    idx = f / binf
    lo = np.clip(np.floor(idx).astype(int), 0, V2.shape[0] - 2)
    fr = idx - lo
    return V2[lo] * (1 - fr)[:, None] + V2[lo + 1] * fr[:, None]


sal = np.zeros((len(cands), V2.shape[1]))
for h in range(1, 14):
    w = 1.0 / (1 + 0.12 * (h - 1))
    ok = cands * h < 3500
    sal[ok] += w * at(cands[ok] * h)
    if h > 1:
        ok2 = cands * (h - 0.5) < 3500
        sal[ok2] -= w * at(cands[ok2] * (h - 0.5))
f0 = cands[np.argmax(sal, axis=0)]
score = sal.max(axis=0) / (V2[(np.arange(V2.shape[0]) * binf > 80) & (np.arange(V2.shape[0]) * binf < 4000)].mean(axis=0) + 1e-9)
voiced = speech[: len(score)] & (score > np.percentile(score[speech[: len(score)]], 50))

rows = []
for s in segs:
    a, b = int(s["start"] * fps), int(s["end"] * fps) + 3
    sub = VM[:, a:b]
    fe = sub[(freqs > 300) & (freqs < 5000)].sum(axis=0)
    fr = fe > np.percentile(fe, 50)
    mf = scipy.fftpack.dct(np.log(mel @ sub[:, fr] + 1e-9), axis=0, norm="ortho")[1:20].mean(axis=1)
    p = sub[:, fr].sum(axis=1)
    tilt = 10 * np.log10(p[(freqs > 2000) & (freqs < 5000)].sum() / (p[(freqs > 300) & (freqs < 1000)].sum() + 1e-9) + 1e-9)
    ff = f0[a:b][voiced[a:b]]
    rows.append({"t": s["start"], "text": s["text"].strip(), "f0": float(np.median(ff)) if len(ff) > 3 else float("nan"), "tilt": float(tilt), "rate": len(s["text"].split()) / (s["end"] - s["start"]), "mfcc": mf})

MF = np.array([r["mfcc"] for r in rows])
MF = (MF - MF.mean(0)) / (MF.std(0) + 1e-9)
MF -= MF.mean(1, keepdims=True)
MF /= np.linalg.norm(MF, axis=1, keepdims=True) + 1e-9
D = 1 - MF @ MF.T
# meaning-based labels for the unambiguous dialogue lines: A = the scared one who addresses "Rachel", B = the reassurer
SURE = {50: "A", 53: "A", 56: "A", 60: "A", 74: "A", 80: "A", 89: "A", 67: "B", 76: "B", 85: "B", 96: "B"}
lab = {i: SURE[int(r["t"])] for i, r in enumerate(rows) if int(r["t"]) in SURE}


def nearest(i: int, exclude_self: bool) -> tuple[str, float, float]:
    dA = np.mean([D[i, j] for j in lab if lab[j] == "A" and (j != i or not exclude_self)])
    dB = np.mean([D[i, j] for j in lab if lab[j] == "B" and (j != i or not exclude_self)])
    return ("A" if dA < dB else "B"), dA, dB


print(f"\n{'start':>6} {'f0':>5} {'tilt':>6} {'rate':>5}  {'label':>5} {'mfcc->':>6} {'dA':>5} {'dB':>5}  text")
hits = 0
for i, r in enumerate(rows):
    pred, dA, dB = nearest(i, exclude_self=True) if r["t"] > 40 else ("-", np.nan, np.nan)
    if i in lab:
        hits += pred == lab[i]
    print(f"{r['t']:6.2f} {r['f0']:5.0f} {r['tilt']:6.1f} {r['rate']:5.2f}  {lab.get(i, '?' if r['t'] > 40 else 'narr'):>5} {pred:>6} {dA:5.2f} {dB:5.2f}  {r['text'][:58]}")
print(f"leave-one-out accuracy on the unambiguous dialogue lines: {hits}/{len(lab)}")
# In the narration the comb above latches onto the drone's partials (~200-300 Hz). Searching only 60-180 Hz on the
# narration's voiced frames gives the narrator's real register (his harmonics are ~90 Hz apart on the spectrogram).
low = cands <= 180
f0_low = cands[low][np.argmax(sal[low], axis=0)]
nar_frames = np.zeros(len(f0_low), bool)
for s in segs:
    if s["start"] < 40:
        nar_frames[int(s["start"] * fps) : int(s["end"] * fps)] = True
print(f"narrator f0 (60-180 Hz search, voiced frames): median {np.median(f0_low[nar_frames & voiced]):.0f} Hz")
nar = [i for i, r in enumerate(rows) if r["t"] < 40]
dia = [i for i, r in enumerate(rows) if r["t"] > 40]
print(f"mean MFCC distance: within narration {np.mean([D[i, j] for i in nar for j in nar if i < j]):.2f}, "
      f"within dialogue {np.mean([D[i, j] for i in dia for j in dia if i < j]):.2f}, narration-vs-dialogue {np.mean([D[i, j] for i in nar for j in dia]):.2f}")
