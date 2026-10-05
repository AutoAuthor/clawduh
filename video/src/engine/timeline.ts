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
