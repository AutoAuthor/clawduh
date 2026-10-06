import type { Line, MouthCue, MouthShape, Timeline, Word } from "../../engine/timeline";
import raw from "./timeline.json";

/**
 * Episode-local fixes on top of the generated timeline. timeline.json stays generated (never hand-edited);
 * the episode uses this corrected copy. Timings are untouched.
 *
 * 1. Caption words whisper misheard:
 *    - "decal."        -> "decaf."   (12.8 s, "you give him decaf")
 *    - "Take" "care,"  -> "Decaf,"   (81.2 s, the whispered "Decaf, baby.")
 *    - "Y" "'all"      -> "Y'all"    (whisper split the word in two)
 * 2. Whispered words: Vern whispers a lot, and Rhubarb gives unvoiced speech flat A/B shapes, so his jaw
 *    would barely move. Any spoken word whose Rhubarb cues contain no open shape gets cues synthesised from
 *    its spelling instead (the same letter -> shape rule as build_timeline.py's provisional mode).
 */

function fixWords(words: Word[]): Word[] {
  const out: Word[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const next = words[i + 1];
    if (w.word === "decal.") {
      out.push({ ...w, word: "decaf." });
    } else if (w.word === "Take" && next && next.word === "care," && w.start > 80 && w.start < 83) {
      out.push({ start: w.start, end: next.end, word: "Decaf," });
      i++;
    } else if (w.word === "Y" && next && next.word === "'all") {
      out.push({ start: w.start, end: next.end, word: "Y'all" });
      i++;
    } else {
      out.push(w);
    }
  }
  return out;
}

const VOWEL: Record<string, MouthShape> = { a: "D", o: "E", u: "F", w: "F", e: "C", i: "C", y: "C" };
const CONS: Record<string, MouthShape> = { m: "A", b: "A", p: "A", f: "G", v: "G", l: "H" };
const OPEN = new Set<MouthShape>(["C", "D", "E", "F", "H"]);

function synthWord(w: Word): MouthCue[] {
  const letters = w.word.toLowerCase().replace(/[^a-z]/g, "").split("");
  const ls = letters.length ? letters : ["a"];
  const dur = Math.max(0.08, w.end - w.start);
  const n = Math.max(1, Math.min(ls.length, Math.floor(dur / 0.09)));
  const out: MouthCue[] = [];
  for (let k = 0; k < n; k++) {
    const ch = ls[Math.floor((k * ls.length) / n)];
    out.push({ start: w.start + (dur * k) / n, end: w.start + (dur * (k + 1)) / n, value: VOWEL[ch] ?? CONS[ch] ?? "B" });
  }
  return out;
}

/** Replace the cues inside [a, b) with `ins` (cues straddling the edges are clipped, not dropped). */
function splice(track: MouthCue[], a: number, b: number, ins: MouthCue[]): MouthCue[] {
  const out: MouthCue[] = [];
  for (const c of track) {
    if (c.end <= a || c.start >= b) {
      out.push(c);
      continue;
    }
    if (c.start < a) out.push({ ...c, end: a });
    if (c.end > b) out.push({ ...c, start: b });
  }
  return [...out, ...ins].sort((x, y) => x.start - y.start);
}

function fixMouths(tl: Timeline, lines: Line[]): Record<string, MouthCue[]> {
  const mouth: Record<string, MouthCue[]> = {};
  for (const [spk, track] of Object.entries(tl.mouth)) mouth[spk] = track.slice();
  for (const line of lines) {
    let track = mouth[line.speaker];
    if (!track) continue;
    for (const w of line.words) {
      const dur = w.end - w.start;
      if (dur < 0.1 || dur > 1.2) continue;
      const over = track.filter((c) => c.end > w.start && c.start < w.end);
      if (over.some((c) => OPEN.has(c.value))) continue;
      track = splice(track, w.start, w.end, synthWord(w));
    }
    mouth[line.speaker] = track;
  }
  return mouth;
}

function fixTimeline(tl: Timeline): Timeline {
  const lines: Line[] = tl.lines.map((l) => {
    const words = fixWords(l.words);
    return { ...l, words, text: words.map((w) => w.word).join(" ") };
  });
  return { ...tl, lines, mouth: fixMouths(tl, lines) };
}

/** The episode's timeline with the fixes applied — use this everywhere instead of timeline.json. */
export const TL: Timeline = fixTimeline(raw as Timeline);
