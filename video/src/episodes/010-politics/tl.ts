import { useEpisode } from "../../engine/context";
import { energyAt, isTalking, mouthAt, MouthCue, Timeline } from "../../engine/timeline";
import { onN } from "../../engine/util";
import fx from "./audio_fx.json";
import raw from "./timeline.json";

/**
 * EPISODE 010 timeline = the generated timeline.json + the measured extras in audio_fx.json
 * (episodes/010-politics/analysis/audio_fx.py):
 *  - the "Now" half's voice sits under a loud score, where Rhubarb found only ~2 cues/s: from `nowFrom` on, the mouth
 *    track comes from a voice-only loudness estimate + spelling hints instead;
 *  - five words whisper stretched back over the pause before them get their real start time (captions, cue()).
 * Nothing generated is hand-edited; re-run the script / build_timeline.py and this stays in sync.
 */

export const SPEAKER = "wendell";

/** whisper misheard "...this foul binary system and know peace" as "...in no peace" (captions only) */
const TEXT_FIXES: Record<string, string> = { "in@18.70": "and", "no@18.98": "know" };

function patch(base: Timeline): Timeline {
  const retime = fx.retime as Record<string, number>;
  const lines = base.lines.map((l) => {
    const words = l.words.map((w) => {
      const k = `${w.word.trim()}@${w.start.toFixed(2)}`;
      const fixed = TEXT_FIXES[k] !== undefined ? { ...w, word: w.word.replace(w.word.trim(), TEXT_FIXES[k]) } : w;
      return retime[k] !== undefined ? { ...fixed, start: retime[k] } : fixed;
    });
    return { ...l, words, start: words[0].start, text: words.map((w) => w.word).join(" ") };
  });
  const mouth: Record<string, MouthCue[]> = {};
  for (const [spk, cues] of Object.entries(base.mouth)) {
    mouth[spk] = [...cues.filter((c) => c.end <= fx.nowFrom), ...(fx.now_mouth as MouthCue[])];
  }
  return { ...base, lines, mouth };
}

export const TL: Timeline = patch(raw as Timeline);

/** 0..1 low-band level of the score at time t (drone + drums). */
export function rumbleAt(t: number): number {
  const i = Math.floor(t * fx.fps);
  return fx.rumble[Math.max(0, Math.min(fx.rumble.length - 1, i))] ?? 0;
}

const BOOMS = fx.booms as Array<[number, number]>;

/** Drum-hit impact 0..1: snaps up on each boom of the score and decays (k = decay seconds). */
export function boomAt(t: number, k = 0.22): number {
  let v = 0;
  for (const [bt, s] of BOOMS) {
    if (bt > t + 0.02) break;
    const d = t - bt;
    if (d >= -0.02 && d < 1.5) v = Math.max(v, s * Math.exp(-Math.max(0, d) / k));
  }
  return v;
}

/** Number of booms at or before t — for counting hits (eyes opening, cracks...). */
export function boomCount(t: number): number {
  let n = 0;
  for (const [bt] of BOOMS) if (bt <= t) n++;
  return n;
}

export const BOOM_TIMES = BOOMS.map(([t]) => t);

/** Mouth/talking/energy for the speaker, mouth on twos. */
export function useSpeech() {
  const { timeline, shot } = useEpisode();
  const tq = onN(shot.frame, 2) / shot.fps;
  return { mouth: mouthAt(timeline, SPEAKER, tq), talking: isTalking(timeline, SPEAKER, shot.t), energy: energyAt(timeline, shot.t) };
}
