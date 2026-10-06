import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { rnd } from "../../engine/util";

/**
 * Small shared pieces for episode 009.
 * Tint: a per-frame CSS colour grade (hue cycling etc.) wrapped around a shot. ShotDef.filter is a fixed string, so the
 * psychedelic hue-rotate that follows shot.t is applied here instead; those shots set `filter: "none"`.
 */
export const Tint: React.FC<{ hue?: number; sat?: number; contrast?: number; bright?: number; invert?: number; children: React.ReactNode }> = ({ hue = 0, sat = 1, contrast = 1, bright = 1, invert = 0, children }) => {
  const parts: string[] = [];
  if (hue) parts.push(`hue-rotate(${hue.toFixed(1)}deg)`);
  if (sat !== 1) parts.push(`saturate(${sat.toFixed(3)})`);
  if (contrast !== 1) parts.push(`contrast(${contrast.toFixed(3)})`);
  if (bright !== 1) parts.push(`brightness(${bright.toFixed(3)})`);
  if (invert) parts.push(`invert(${invert.toFixed(3)})`);
  return <AbsoluteFill style={{ filter: parts.length ? parts.join(" ") : undefined }}>{children}</AbsoluteFill>;
};

/** 4-point sparkle path centred on 0,0. */
export const sparkle = (r: number, w = 0.28) => `M0,${-r} L${r * w},${-r * w} L${r},0 L${r * w},${r * w} L0,${r} L${-r * w},${r * w} L${-r},0 L${-r * w},${-r * w} Z`;

const STAR_COLS = ["#f4f1ff", "#cfe6ff", "#ffe3f4", "#fff2cf", "#d8fff6"];

/** A deterministic starfield over a world-space box with on-twos twinkle. `freeze` stops the twinkle. */
export const Starfield: React.FC<{
  seed: string;
  n: number;
  x0: number;
  y0: number;
  w: number;
  h: number;
  rMin?: number;
  rMax?: number;
  t: number;
  freeze?: number;
  sparkles?: number;
  opacity?: number;
  dx?: number;
  dy?: number;
}> = ({ seed, n, x0, y0, w, h, rMin = 0.8, rMax = 2.4, t, freeze = 0, sparkles = 0, opacity = 1, dx = 0, dy = 0 }) => {
  const stars = useMemo(
    () =>
      Array.from({ length: n }).map((_, i) => ({
        x: x0 + rnd(`${seed}x${i}`) * w,
        y: y0 + rnd(`${seed}y${i}`) * h,
        r: rMin + Math.pow(rnd(`${seed}r${i}`), 2.2) * (rMax - rMin),
        c: STAR_COLS[Math.floor(rnd(`${seed}c${i}`) * STAR_COLS.length)],
        p: rnd(`${seed}p${i}`) * 6.28,
        s: 0.6 + rnd(`${seed}s${i}`) * 2.2,
        sp: i < sparkles,
      })),
    [seed, n, x0, y0, w, h, rMin, rMax, sparkles],
  );
  const tt = Math.floor(t * 12) / 12;
  return (
    <g transform={dx || dy ? `translate(${dx} ${dy})` : undefined} opacity={opacity}>
      {stars.map((s, i) => {
        const tw = freeze >= 1 ? 0.85 : 0.55 + 0.45 * Math.sin(tt * s.s + s.p) * (1 - freeze);
        return s.sp ? (
          <path key={i} d={sparkle(s.r * 4.2)} transform={`translate(${s.x} ${s.y})`} fill={s.c} opacity={Math.max(0.15, tw)} />
        ) : (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c} opacity={Math.max(0.12, tw)} />
        );
      })}
    </g>
  );
};

/** Linear blend between two #rrggbb colours. */
export function mixHex(a: string, b: string, k: number): string {
  const kk = Math.min(1, Math.max(0, k));
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * kk).toString(16).padStart(2, "0")).join("")}`;
}
