"""Turn YouTube auto-captions (VTT with per-word timing tags) into a transcript.json.

Use when the audio can't be downloaded yet: it gives word timings good enough (~0.1-0.3s) to write
and preview the shot list. Replace with pipeline/transcribe.py once the real audio is available.

Usage: python pipeline/captions_to_transcript.py episodes/002-troubled/analysis/yt_captions.en.vtt \
         episodes/002-troubled/analysis/transcript_captions.json
"""
import html
import json
import re
import sys

TS = r"(\d\d):(\d\d):(\d\d)\.(\d\d\d)"


def secs(m) -> float:
    h, mi, s, ms = (int(x) for x in m)
    return h * 3600 + mi * 60 + s + ms / 1000


def main() -> None:
    src, dst = sys.argv[1], sys.argv[2]
    blocks = open(src, encoding="utf8").read().split("\n\n")
    words = []
    prev_new = None
    for b in blocks:
        head = re.search(TS + r" --> " + TS, b)
        if not head:
            continue
        g = head.groups()
        c_start, c_end = secs(g[:4]), secs(g[4:])
        body = [l for l in b.split("\n") if "-->" not in l and l.strip()]
        if not body:
            continue
        line = html.unescape(body[-1])  # the newly-added caption line is always last
        if "<c>" in line:
            toks = []
            first = re.match(r"\s*([^<]+)", line)
            if first and first.group(1).strip():
                toks.append((c_start, first.group(1).strip()))
            for m in re.finditer("<" + TS + r"><c>([^<]*)</c>", line):
                toks.append((secs(m.groups()[:4]), m.group(5).strip()))
            prev_new = re.sub(r"<[^>]+>", "", line).strip()
        else:
            plain = line.strip()
            # untimed one-liners (e.g. ">> Hello.") are new only if they differ from the last new line
            if plain == prev_new or (len(body) > 1 and plain == html.unescape(body[0]).strip() and len(body) == 1):
                continue
            if len(body) == 1:  # a lone repeated line in the 10ms "roll-up" cues
                continue
            prev_new = plain
            parts = plain.split()
            dur = max(0.2, c_end - c_start)
            toks = [(c_start + dur * k / len(parts), w) for k, w in enumerate(parts)]
        for i, (st, w) in enumerate(toks):
            w = w.replace(">>", "").strip()
            if not w:
                continue
            nxt = toks[i + 1][0] if i + 1 < len(toks) else c_end
            words.append({"start": round(st, 3), "end": round(min(nxt, st + 0.8), 3), "word": w})
    words = [w for w in words if w["word"]]
    # one segment per sentence-ish chunk
    segs, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r"[.?!]$", w["word"]) or len(cur) >= 18:
            segs.append(cur)
            cur = []
    if cur:
        segs.append(cur)
    out = {
        "source": "youtube-auto-captions",
        "segments": [{"start": s[0]["start"], "end": s[-1]["end"], "text": " ".join(w["word"] for w in s), "words": s} for s in segs],
    }
    json.dump(out, open(dst, "w"), indent=1)
    print(f"{len(words)} words, {len(segs)} segments -> {dst}")


if __name__ == "__main__":
    main()
