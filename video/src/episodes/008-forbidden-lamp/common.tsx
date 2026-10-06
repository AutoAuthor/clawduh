import React, { useContext } from "react";
import { useVideoConfig } from "remotion";
import { EpisodeContext, useEpisode } from "../../engine/context";
import { Cam, camLerp } from "../../engine/Stage";
import { energyAt, isTalking, mouthAt } from "../../engine/timeline";
import { easeInOut, onN } from "../../engine/util";

/** Speech state for a speaker at the current frame (lip-sync on twos). */
export function useSpeech(name: string) {
  const { timeline, shot } = useEpisode();
  const tq = onN(shot.frame, 2) / shot.fps;
  return { mouth: mouthAt(timeline, name, tq), talking: isTalking(timeline, name, shot.t), energy: energyAt(timeline, shot.t) };
}

/** Camera move across the current shot. */
export function useCam(from: Cam, to?: Cam, ease: (x: number) => number = easeInOut, cam?: Cam): Cam {
  const { shot } = useEpisode();
  if (cam) return cam;
  return to ? camLerp(from, to, ease(shot.p)) : from;
}

/**
 * Children drawn in SCREEN pixels (origin top-left of the output frame) from inside a <Stage> world — the camera is
 * cancelled (including the 9:16 reframe), but they still sit in the world's draw order (things can pass in front).
 */
export const ScreenSpace: React.FC<{ cam: Cam; children: React.ReactNode }> = ({ cam, children }) => {
  const ep = useContext(EpisodeContext);
  const eff = ep?.reframe ? ep.reframe(cam) : cam;
  const { width, height } = useVideoConfig();
  return <g transform={`translate(${eff.x} ${eff.y}) scale(${1 / eff.zoom}) rotate(${-(eff.rot ?? 0)}) translate(${-width / 2} ${-height / 2})`}>{children}</g>;
};

/** Parallax layer: p = 1 moves with the world, p = 0 is glued to the screen. */
export const Parallax: React.FC<{ cam: Cam; p: number; children: React.ReactNode }> = ({ cam, p, children }) => (
  <g transform={`translate(${cam.x * (1 - p)} ${cam.y * (1 - p)})`}>{children}</g>
);

export const FONT = "Arial Black, Arial, Helvetica, sans-serif";
