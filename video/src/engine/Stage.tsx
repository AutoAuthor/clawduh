import React, { useContext } from "react";
import { noise2D } from "@remotion/noise";
import { FxContext } from "./context";
import { DISP_MAPS } from "./dispMaps";
import { onN, rnd } from "./util";

export const W = 1920;
export const H = 1080;

export interface Cam {
  /** world point at the centre of the screen */
  x: number;
  y: number;
  /** 1 = the full 1920x1080 world is visible */
  zoom: number;
  rot?: number;
}

export const camLerp = (a: Cam, b: Cam, t: number): Cam => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  // interpolate zoom geometrically so push-ins feel linear
  zoom: Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * t),
  rot: (a.rot ?? 0) + ((b.rot ?? 0) - (a.rot ?? 0)) * t,
});

/** Hand-held / impact shake in screen pixels. */
export function shake(frame: number, amp: number, seed = "shake", speed = 0.35): Cam {
  return {
    x: noise2D(seed + "x", frame * speed, 0) * amp,
    y: noise2D(seed + "y", 0, frame * speed) * amp,
    zoom: 1,
    rot: noise2D(seed + "r", frame * speed, 3) * amp * 0.04,
  };
}

interface StageProps {
  cam: Cam;
  frame: number;
  /** extra screen-space shake */
  shakeAmp?: number;
  /** line boil displacement in px (0 = off) */
  boil?: number;
  /** background fill behind everything */
  bg?: string;
  children: React.ReactNode;
  /** screen-space overlay drawn after the world (not affected by camera) */
  overlay?: React.ReactNode;
}

/**
 * One SVG "stage": the world is drawn in 1920x1080 units, viewed through a camera,
 * then run through a screen-space line-boil filter so every outline wobbles like hand-drawn animation.
 */
export const Stage: React.FC<StageProps> = ({ cam, frame, shakeAmp = 0, boil: boilAmt = 3.2, bg, children, overlay }) => {
  const boil = useContext(FxContext).boil ? boilAmt : 0;
  const s = shakeAmp > 0 ? shake(frame, shakeAmp) : { x: 0, y: 0, rot: 0, zoom: 1 };
  const z = cam.zoom;
  const transform = `translate(${W / 2 + s.x} ${H / 2 + s.y}) rotate(${(cam.rot ?? 0) + (s.rot ?? 0)}) scale(${z}) translate(${-cam.x} ${-cam.y})`;
  // Line boil: a baked smooth-noise displacement map, swapped every 3 frames ("on threes").
  const k = onN(frame, 3) / 3;
  const map = DISP_MAPS[Math.floor(rnd(`boil${k}`) * DISP_MAPS.length)];
  const ox = Math.floor(rnd(`boilx${k}`) * 200);
  const oy = Math.floor(rnd(`boily${k}`) * 120);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0, display: "block" }}>
      <defs>
        <filter id="boil" filterUnits="userSpaceOnUse" x={-60} y={-60} width={W + 120} height={H + 120} colorInterpolationFilters="sRGB">
          <feImage href={map} x={-260 + ox} y={-180 + oy} width={W + 400} height={H + 300} preserveAspectRatio="none" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={boil * 2.2} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      {bg ? <rect x={0} y={0} width={W} height={H} fill={bg} /> : null}
      <g filter={boil > 0 ? "url(#boil)" : undefined}>
        <g transform={transform}>{children}</g>
        {overlay}
      </g>
    </svg>
  );
};

/** Piecewise camera path: keys are [secondsIntoShot, cam]. */
export function camPath(keys: Array<[number, Cam]>, local: number, ease: (x: number) => number = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)): Cam {
  if (local <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, c0] = keys[i];
    const [t1, c1] = keys[i + 1];
    if (local <= t1) return camLerp(c0, c1, ease((local - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
}

/** Screen-space coloured light wash (e.g. red glow from the shed). */
export const LightWash: React.FC<{ id: string; color: string; cx?: number; cy?: number; r?: number; opacity: number }> = ({
  id,
  color,
  cx = 1700,
  cy = 540,
  r = 1100,
  opacity,
}) => (
  <g style={{ mixBlendMode: "screen" }} opacity={opacity}>
    <defs>
      <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
        <stop offset="0" stopColor={color} stopOpacity="0.85" />
        <stop offset="1" stopColor={color} stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill={`url(#${id})`} />
  </g>
);
