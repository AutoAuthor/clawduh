import React from "react";
import { staticFile } from "remotion";
import type { FxFlags } from "./context";
import { EpisodePlayer, ShotDef } from "./EpisodePlayer";
import type { Timeline } from "./timeline";

/** Everything Remotion needs to render one episode in both formats. */
export interface EpisodeDef {
  /** folder name, e.g. "001-oats" — also used for episodes/<id>/ and public/episodes/<id>/audio.wav */
  id: string;
  title: string;
  timeline: Timeline;
  shots: ShotDef[];
  /** world positions of speakers' heads (9:16 speaker-follow reframing) */
  speakerFocus?: Record<string, { x: number; y: number }>;
  /** seconds to hold after the audio ends (e.g. a silent punchline) */
  tail?: number;
}

export type EpisodeProps = {
  captions: boolean;
  debug: boolean;
  fx?: FxFlags;
  /** [start, end, name] of every shot — informational (review tooling reads it from the composition) */
  shotTimes?: Array<[number, number, string]>;
};

export const shotTimes = (ep: EpisodeDef): Array<[number, number, string]> =>
  ep.shots.map((s) => [s.start, Math.min(s.end, ep.timeline.duration + (ep.tail ?? 0)), s.name]);

export const compositionIds = (ep: EpisodeDef) => ({ landscape: `ep${ep.id}`, vertical: `ep${ep.id}-vertical` });

export const durationInFrames = (ep: EpisodeDef) => Math.ceil((ep.timeline.duration + (ep.tail ?? 0)) * ep.timeline.fps);

/** One stable React component per episode (used by both the 16:9 and the 9:16 composition). */
export function episodeComponent(ep: EpisodeDef): React.FC<EpisodeProps> {
  const C: React.FC<EpisodeProps> = ({ captions, debug, fx }) => (
    <EpisodePlayer
      timeline={ep.timeline}
      shots={ep.shots}
      audioSrc={staticFile(`episodes/${ep.id}/audio.wav`)}
      captions={captions}
      debug={debug}
      fx={fx}
      speakerFocus={ep.speakerFocus}
    />
  );
  C.displayName = `Episode_${ep.id}`;
  return C;
}
