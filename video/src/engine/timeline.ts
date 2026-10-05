export type MouthShape = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "X";

export interface Word {
  start: number;
  end: number;
  word: string;
}

export interface Line {
  speaker: string;
  start: number;
  end: number;
  text: string;
  words: Word[];
}

export interface MouthCue {
  start: number;
  end: number;
  value: MouthShape;
}

/** Output of pipeline/build_timeline.py */
export interface Timeline {
  /** true when built from captions without the audio (no sound, approximate lip-sync) */
  provisional?: boolean;
  fps: number;
  duration: number;
  lines: Line[];
  mouth: Record<string, MouthCue[]>;
  energy: number[];
}

function findCue(cues: MouthCue[], t: number): MouthCue | undefined {
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const c = cues[mid];
    if (t < c.start) hi = mid - 1;
    else if (t >= c.end) lo = mid + 1;
    else return c;
  }
  return undefined;
}

/** Mouth shape a speaker should show at time t ("X" = closed/rest when not talking). */
export function mouthAt(tl: Timeline, speaker: string, t: number): MouthShape {
  const cues = tl.mouth[speaker];
  if (!cues) return "X";
  return findCue(cues, t)?.value ?? "X";
}

export function isTalking(tl: Timeline, speaker: string, t: number): boolean {
  const cues = tl.mouth[speaker];
  return !!cues && !!findCue(cues, t);
}

/** 0..1 loudness at time t. */
export function energyAt(tl: Timeline, t: number): number {
  const i = Math.floor(t * tl.fps);
  return tl.energy[Math.max(0, Math.min(tl.energy.length - 1, i))] ?? 0;
}

export function lineAt(tl: Timeline, t: number): Line | undefined {
  return tl.lines.find((l) => t >= l.start - 0.05 && t <= l.end + 0.25);
}

const normWord = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Time (seconds) at which `phrase` is spoken, found by fuzzy word matching — so shot lists can be
 * written against the script ("start when he says 'Lies!'") and survive re-transcription.
 *   edge: "start" (first word starts, default) | "end" (last word ends)
 *   after: only search words starting after this time;  offset: added to the result.
 */
export function cue(tl: Timeline, phrase: string, opts: { edge?: "start" | "end"; after?: number; offset?: number } = {}): number {
  const words = tl.lines.flatMap((l) => l.words);
  const target = phrase.split(/\s+/).map(normWord).filter(Boolean);
  const n = target.length;
  let best = { i: -1, score: -1 };
  for (let i = 0; i + n <= words.length; i++) {
    if (opts.after !== undefined && words[i].start < opts.after) continue;
    let hits = 0;
    for (let k = 0; k < n; k++) if (normWord(words[i + k].word) === target[k]) hits++;
    const score = hits / n;
    if (score > best.score) best = { i, score };
    if (score === 1) break;
  }
  if (best.i < 0 || best.score < 0.5) {
    console.warn(`cue(): no good match for "${phrase}" (best ${best.score.toFixed(2)})`);
    if (best.i < 0) return opts.after ?? 0;
  }
  const t = opts.edge === "end" ? words[best.i + n - 1].end : words[best.i].start;
  return t + (opts.offset ?? 0);
}
