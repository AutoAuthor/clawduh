import React from "react";
import { Dumpling, DumplingProps } from "../../characters/Dumpling";
import { Gristle, GristleProps } from "../../characters/Gristle";
import { useEpisode } from "../../engine/context";
import { Cam, Stage, camLerp } from "../../engine/Stage";
import { energyAt, isTalking, mouthAt } from "../../engine/timeline";
import { easeInOut, onN } from "../../engine/util";
import { PenBackdrop, Trough } from "../../scenes/Pen";

export const G_POS = { x: 480, y: 905 };
export const D_POS = { x: 1460, y: 910 };
export const TROUGH_POS = { x: 975, y: 940 };
/** head centres (from the rigs' neck offsets) */
export const G_HEAD = { x: G_POS.x + 178, y: G_POS.y - 392 };
export const D_HEAD = { x: D_POS.x - 212, y: D_POS.y - 292 };

export const CAM = {
  wide: { x: 960, y: 600, zoom: 1 },
  wideTight: { x: 960, y: 640, zoom: 1.15 },
  two: { x: 955, y: 650, zoom: 1.4 },
  msG: { x: G_HEAD.x - 50, y: 600, zoom: 1.9 },
  msD: { x: D_HEAD.x + 60, y: 660, zoom: 1.85 },
  cuG: { x: G_HEAD.x + 7, y: G_HEAD.y + 7, zoom: 3.0 },
  ecuG: { x: G_HEAD.x + 12, y: G_HEAD.y - 28, zoom: 5.2 },
  cuD: { x: D_HEAD.x - 6, y: D_HEAD.y + 12, zoom: 2.9 },
  ecuD: { x: D_HEAD.x - 3, y: D_HEAD.y - 8, zoom: 4.6 },
  shed: { x: 960, y: 600, zoom: 2.3 },
  shedTight: { x: 960, y: 610, zoom: 3.6 },
  farmhouse: { x: 512, y: 560, zoom: 4.2 },
} satisfies Record<string, Cam>;

/** Speech state for a speaker at the current frame (lip-sync on twos). */
export function useSpeech(speaker: string) {
  const { timeline, shot } = useEpisode();
  const tq = onN(shot.frame, 2) / shot.fps;
  return {
    mouth: mouthAt(timeline, speaker, tq),
    talking: isTalking(timeline, speaker, shot.t),
    energy: energyAt(timeline, shot.t),
  };
}

/** Camera move across the current shot. */
export function useCam(from: Cam, to?: Cam, ease: (x: number) => number = easeInOut): Cam {
  const { shot } = useEpisode();
  return to ? camLerp(from, to, ease(shot.p)) : from;
}

export interface PenSceneProps {
  from: Cam;
  to?: Cam;
  ease?: (x: number) => number;
  gristle?: Partial<GristleProps> | false;
  dumpling?: Partial<DumplingProps> | false;
  shakeAmp?: number;
  shedGlow?: number;
  doorOpen?: number;
  windowFigure?: number;
  oats?: number;
  /** extra world-space elements drawn in front */
  front?: React.ReactNode;
  overlay?: React.ReactNode;
}

/** The main pen two-hander with both brothers lip-synced from the timeline. */
export const PenScene: React.FC<PenSceneProps> = ({
  from,
  to,
  ease,
  gristle = {},
  dumpling = {},
  shakeAmp = 0,
  shedGlow = 1,
  doorOpen = 0,
  windowFigure = 0,
  oats = 1,
  front,
  overlay,
}) => {
  const { shot } = useEpisode();
  const cam = useCam(from, to, ease);
  const g = useSpeech("gristle");
  const d = useSpeech("dumpling");
  return (
    <Stage cam={cam} frame={shot.frame} shakeAmp={shakeAmp} overlay={overlay}>
      <PenBackdrop t={shot.t} frame={shot.frame} shedGlow={shedGlow} doorOpen={doorOpen} windowFigure={windowFigure} />
      <Trough x={TROUGH_POS.x} y={TROUGH_POS.y} oats={oats} />
      {gristle !== false ? (
        <Gristle id="gristle" x={G_POS.x} y={G_POS.y} t={shot.t} frame={shot.frame} {...g} look={[0.6, 0.1]} {...gristle} />
      ) : null}
      {dumpling !== false ? (
        <Dumpling id="dumpling" x={D_POS.x} y={D_POS.y} t={shot.t} frame={shot.frame} {...d} {...dumpling} />
      ) : null}
      {front}
    </Stage>
  );
};
