import { useEpisode } from "../../engine/context";
import { isTalking, MouthCue, MouthShape, Timeline, Word } from "../../engine/timeline";
import { onN } from "../../engine/util";
import timelineJson from "./timeline.json";
import voiceJson from "./voice_env.json";

/**
 * Mouths for episode 009.
 * The whole clip sits on a loud ambient drone, so Rhubarb's cues here are mostly long static "B" stretches.
 * Each speaker's mouth is therefore built from three sources, all clipped to that speaker's own lines:
 *   - voice_env.json: a voice-only activity envelope (music bed removed; episodes/009-face-of-god/analysis/voice_analysis.py)
 *     -> the mouth is shut whenever the voice is silent (also fixes loose Whisper word edges);
 *   - Rhubarb's cue when it is short and informative (anything but a long B/X stretch);
 *   - otherwise a viseme read from the spelling of the word being spoken.
 */

export type Who = "glim" | "rachel";

const tl = timelineJson as Timeline;
const VOICE = voiceJson as { fps: number; env: number[] };

const WORDS: Record<Who, Word[]> = { glim: [], rachel: [] };
for (const line of tl.lines) {
  const list = WORDS[line.speaker as Who];
  if (list) list.push(...line.words);
}

/** 0..1 voice-only loudness at time t (music bed removed). */
export const voiceAt = (t: number): number => {
  const i = Math.floor(t * VOICE.fps);
  return VOICE.env[Math.max(0, Math.min(VOICE.env.length - 1, i))] ?? 0;
};

function cueAt(cues: MouthCue[] | undefined, t: number): MouthCue | undefined {
  if (!cues) return undefined;
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

const VOWEL: Record<string, MouthShape> = { a: "D", o: "E", u: "F", w: "F", e: "C", i: "C", y: "C" };
const CONS: Record<string, MouthShape> = { m: "A", b: "A", p: "A", f: "G", v: "G", l: "H", r: "E", h: "C", th: "H" };

function letterShape(w: Word, t: number): MouthShape {
  const letters = w.word.toLowerCase().replace(/[^a-z]/g, "") || "a";
  const dur = Math.max(0.1, w.end - w.start);
  const n = Math.max(1, Math.min(letters.length, Math.floor(dur / 0.085)));
  const k = Math.max(0, Math.min(n - 1, Math.floor(((t - w.start) / dur) * n)));
  const ch = letters[Math.floor((k * letters.length) / n)];
  return VOWEL[ch] ?? CONS[ch] ?? "B";
}

export function mouthFor(who: Who, t: number): MouthShape {
  if (!isTalking(tl, who, t)) return "X";
  const v = voiceAt(t);
  if (v < 0.16) return "X";
  const c = cueAt(tl.mouth[who], t);
  const informative = c && c.value !== "B" && c.value !== "X" && c.end - c.start < 0.36;
  let s: MouthShape;
  if (informative) s = c.value;
  else {
    const w = WORDS[who].find((wd) => t >= wd.start - 0.03 && t < wd.end + 0.04);
    s = w ? letterShape(w, t) : "B";
  }
  if (v < 0.32 && (s === "D" || s === "H")) s = "C";
  if (v > 0.72 && s === "B") s = "C";
  return s;
}

/** Speech state for one character in the current shot (mouth on twos). */
export function useSpeech(who: Who) {
  const { shot } = useEpisode();
  const tq = onN(shot.frame, 2) / shot.fps;
  return { mouth: mouthFor(who, tq), talking: isTalking(tl, who, shot.t), energy: voiceAt(shot.t) };
}

/** Mouth openness 0..1 per shape (for custom mouths). */
export const OPEN: Record<MouthShape, number> = { X: 0, A: 0, B: 0.14, C: 0.48, D: 0.85, E: 0.42, F: 0.26, G: 0.16, H: 0.56 };
