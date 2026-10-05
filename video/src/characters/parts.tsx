import React from "react";
import { noise2D } from "@remotion/noise";
import type { MouthShape } from "../engine/timeline";
import { Pt, rnd, smoothPath } from "../engine/util";

export const INK = "#140d0b";

/* ------------------------------------------------------------------ */
/* Outlined stroke (legs, arms, tails)                                 */
/* ------------------------------------------------------------------ */

export const DLine: React.FC<{ d: string; w: number; color: string; outline?: string; ow?: number }> = ({
  d,
  w,
  color,
  outline = INK,
  ow = 5,
}) => (
  <>
    <path d={d} fill="none" stroke={outline} strokeWidth={w + ow * 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </>
);

export const polyline = (pts: Pt[]) => smoothPath(pts, false);

/* ------------------------------------------------------------------ */
/* Blinks and eye darts                                                */
/* ------------------------------------------------------------------ */

/** 0..1 lid closure from a deterministic blink schedule. */
export function blinkAmount(t: number, seed: string, bucket = 3.3): number {
  const b = Math.floor(t / bucket);
  for (const k of [b, b - 1]) {
    const bt = k * bucket + rnd(`${seed}blink${k}`) * (bucket - 0.4);
    const dt = t - bt;
    if (dt >= 0 && dt < 0.22) {
      if (dt < 0.07) return dt / 0.07;
      if (dt < 0.13) return 1;
      return 1 - (dt - 0.13) / 0.09;
    }
  }
  return 0;
}

/** Twitchy pupil darts: a new random gaze target every `every` seconds. */
export function saccade(t: number, seed: string, amp = 0.3, every = 0.75): Pt {
  const k = Math.floor(t / every);
  return [(rnd(`${seed}sx${k}`) - 0.5) * 2 * amp, (rnd(`${seed}sy${k}`) - 0.5) * 2 * amp * 0.6];
}

/* ------------------------------------------------------------------ */
/* Eye                                                                 */
/* ------------------------------------------------------------------ */

export interface EyeProps {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot?: number;
  look?: Pt;
  kind?: "dot" | "slit" | "vslit";
  pupil?: number;
  sclera?: string;
  iris?: string;
  veins?: number;
  lidTop?: number;
  lidBottom?: number;
  /** tilt of the upper lid edge in degrees (+ = inner corner lower when mirrored = angry) */
  lidAngle?: number;
  lidColor: string;
  sw?: number;
  seed: string;
  /** draw happy closed "^" arc instead of an eye */
  happyClosed?: boolean;
}

export const Eye: React.FC<EyeProps> = ({
  id,
  cx,
  cy,
  rx,
  ry,
  rot = 0,
  look = [0, 0],
  kind = "dot",
  pupil = 0.22,
  sclera = "#efe8d6",
  iris = "#d3a63a",
  veins = 0,
  lidTop = 0.1,
  lidBottom = 0.05,
  lidAngle = 0,
  lidColor,
  sw = 5,
  seed,
  happyClosed = false,
}) => {
  if (happyClosed) {
    return (
      <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
        <path
          d={`M${-rx},${ry * 0.2} Q0,${-ry * 1.1} ${rx},${ry * 0.2}`}
          fill="none"
          stroke={INK}
          strokeWidth={sw + 2}
          strokeLinecap="round"
        />
      </g>
    );
  }
  const clip = `${id}-clip`;
  const px = look[0] * rx * 0.55;
  const py = look[1] * ry * 0.5;
  const topY = -ry + Math.min(1, lidTop) * 2 * ry;
  const tilt = Math.tan((lidAngle * Math.PI) / 180) * rx;
  const sag = ry * 0.45 * (1 - Math.min(1, lidTop));
  const lidPath = `M${-rx * 1.4},${-ry * 1.6} L${rx * 1.4},${-ry * 1.6} L${rx * 1.4},${topY - tilt} Q0,${topY + sag} ${-rx * 1.4},${topY + tilt} Z`;
  const lidEdge = `M${-rx * 1.4},${topY + tilt} Q0,${topY + sag} ${rx * 1.4},${topY - tilt}`;
  const botY = ry - Math.min(1, lidBottom) * 2 * ry;
  const bLid = `M${-rx * 1.4},${ry * 1.6} L${rx * 1.4},${ry * 1.6} L${rx * 1.4},${botY} Q0,${botY - ry * 0.35} ${-rx * 1.4},${botY} Z`;
  const veinPaths: string[] = [];
  for (let i = 0; i < veins; i++) {
    const a = rnd(`${seed}v${i}`) * Math.PI * 2;
    const len = 0.45 + rnd(`${seed}vl${i}`) * 0.35;
    const pts: Pt[] = [];
    for (let s = 0; s <= 4; s++) {
      const r = 1 - (s / 4) * len;
      const wob = (rnd(`${seed}vw${i}${s}`) - 0.5) * 0.35;
      pts.push([Math.cos(a + wob) * rx * r, Math.sin(a + wob) * ry * r]);
    }
    veinPaths.push(smoothPath(pts, false));
  }
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      <defs>
        <clipPath id={clip}>
          <ellipse rx={rx} ry={ry} />
        </clipPath>
      </defs>
      <ellipse rx={rx} ry={ry} fill={sclera} />
      <g clipPath={`url(#${clip})`}>
        <ellipse cx={0} cy={ry * 0.55} rx={rx * 1.1} ry={ry * 0.55} fill="#000" opacity={0.08} />
        {veinPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#b3262a" strokeWidth={1.6} opacity={0.85} />
        ))}
        {kind === "dot" ? (
          <>
            <circle cx={px} cy={py} r={rx * pupil} fill="#120a08" />
            <circle cx={px - rx * pupil * 0.35} cy={py - rx * pupil * 0.35} r={rx * pupil * 0.28} fill="#fff" opacity={0.85} />
          </>
        ) : kind === "vslit" ? (
          <>
            {/* cat eye: big iris, vertical slit that widens with `pupil` (0.1 = needle, 0.6 = round) */}
            <ellipse cx={px} cy={py} rx={rx * 0.9} ry={ry * 0.92} fill={iris} />
            <ellipse cx={px} cy={py} rx={Math.max(rx * 0.06, rx * pupil)} ry={ry * 0.78} fill="#120a08" />
            <circle cx={px - rx * 0.3} cy={py - ry * 0.38} r={rx * 0.14} fill="#fff" opacity={0.8} />
          </>
        ) : (
          <>
            <ellipse cx={px} cy={py} rx={rx * 0.86} ry={ry * 0.9} fill={iris} />
            <rect x={px - rx * 0.62} y={py - ry * 0.16} width={rx * 1.24} height={ry * 0.32} rx={ry * 0.16} fill="#120a08" />
            <circle cx={px + rx * 0.35} cy={py - ry * 0.4} r={rx * 0.12} fill="#fff" opacity={0.7} />
          </>
        )}
        <path d={lidPath} fill={lidColor} />
        {lidBottom > 0.02 ? <path d={bLid} fill={lidColor} /> : null}
        {lidTop > 0.03 ? <path d={lidEdge} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" /> : null}
      </g>
      <ellipse rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={sw} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Mouth                                                               */
/* ------------------------------------------------------------------ */

interface ShapeSpec {
  open: number;
  wide: number;
  round: number;
  top: boolean;
  bottom: boolean;
  tongue: number;
  bite?: boolean;
}

const SHAPES: Record<MouthShape, ShapeSpec> = {
  X: { open: 0.0, wide: 0.95, round: 0, top: false, bottom: false, tongue: 0 },
  A: { open: 0.0, wide: 0.88, round: 0, top: false, bottom: false, tongue: 0 },
  B: { open: 0.2, wide: 1.0, round: 0, top: true, bottom: true, tongue: 0 },
  C: { open: 0.45, wide: 1.0, round: 0.15, top: true, bottom: false, tongue: 0.35 },
  D: { open: 0.85, wide: 1.06, round: 0.2, top: true, bottom: true, tongue: 0.55 },
  E: { open: 0.4, wide: 0.8, round: 0.55, top: true, bottom: false, tongue: 0.3 },
  F: { open: 0.26, wide: 0.52, round: 1, top: false, bottom: false, tongue: 0 },
  G: { open: 0.16, wide: 0.92, round: 0, top: true, bottom: false, tongue: 0, bite: true },
  H: { open: 0.52, wide: 0.92, round: 0.2, top: true, bottom: false, tongue: 0.95 },
};

export interface MouthProps {
  id: string;
  x: number;
  y: number;
  w: number;
  shape: MouthShape;
  maxOpen?: number;
  smile?: number;
  teeth?: "crooked" | "flat";
  toothColor?: string;
  lip?: string;
  inside?: string;
  tongue?: string;
  sw?: number;
  seed: string;
  skew?: number;
  /** extra-wide open scream multiplier */
  scream?: number;
  /** two pointed canines (cats, foxes...) */
  fangs?: boolean;
}

export const Mouth: React.FC<MouthProps> = ({
  id,
  x,
  y,
  w,
  shape,
  maxOpen = w * 0.6,
  smile = 0,
  teeth = "crooked",
  toothColor = "#e6dcae",
  lip = "#9a7469",
  inside = "#2a0d0c",
  tongue = "#c45a5e",
  sw = 5,
  seed,
  skew = 0,
  scream = 1,
  fangs = false,
}) => {
  const s = SHAPES[shape];
  const hw = (w / 2) * s.wide;
  const oh = s.open * maxOpen * scream;
  const cornerY = -smile * w * 0.14;
  const k = 0.55 + 0.45 * s.round;
  const top = -oh * 0.32;
  const bot = oh * 0.68;
  const cx = skew;
  if (oh < 1.5) {
    // closed: a single thick lip line with creased corners
    const d = `M${cx - hw},${cornerY} Q${cx},${cornerY + smile * w * 0.22 + 4} ${cx + hw},${cornerY}`;
    return (
      <g transform={`translate(${x} ${y})`}>
        <path d={d} fill="none" stroke={lip} strokeWidth={sw + 7} strokeLinecap="round" />
        <path d={d} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />
        <path
          d={`M${cx - hw - 6},${cornerY - 7} Q${cx - hw - 2},${cornerY} ${cx - hw - 7},${cornerY + 7}`}
          fill="none"
          stroke={INK}
          strokeWidth={sw * 0.6}
          strokeLinecap="round"
        />
        <path
          d={`M${cx + hw + 6},${cornerY - 7} Q${cx + hw + 2},${cornerY} ${cx + hw + 7},${cornerY + 7}`}
          fill="none"
          stroke={INK}
          strokeWidth={sw * 0.6}
          strokeLinecap="round"
        />
      </g>
    );
  }
  const d = `M${cx - hw},${cornerY} C${cx - hw * k},${top / 0.75} ${cx + hw * k},${top / 0.75} ${cx + hw},${cornerY} C${cx + hw * k},${bot / 0.75} ${cx - hw * k},${bot / 0.75} ${cx - hw},${cornerY} Z`;
  const clip = `${id}-mclip`;
  const nT = teeth === "flat" ? 6 : 7;
  const tW = (hw * 2) / nT;
  const teethTop: React.ReactNode[] = [];
  const teethBot: React.ReactNode[] = [];
  for (let i = 0; i < nT; i++) {
    const tx = cx - hw + i * tW;
    const r = rnd(`${seed}t${i}`);
    if (teeth === "crooked") {
      if (r < 0.14) continue; // missing tooth
      const th = maxOpen * (0.16 + r * 0.12);
      const rot = (rnd(`${seed}tr${i}`) - 0.5) * 18;
      const col = r > 0.75 ? "#c9b56e" : toothColor;
      teethTop.push(
        <rect
          key={i}
          x={tx + 1}
          y={top - 8}
          width={tW - 2}
          height={th + 8}
          rx={3}
          fill={col}
          stroke={INK}
          strokeWidth={2}
          transform={`rotate(${rot} ${tx + tW / 2} ${top})`}
        />,
      );
      if (s.bottom && r > 0.3)
        teethBot.push(
          <rect key={i} x={tx + 2} y={bot - th * 0.8} width={tW - 3} height={th + 8} rx={3} fill={col} stroke={INK} strokeWidth={2} />,
        );
    } else {
      const th = maxOpen * 0.26;
      teethTop.push(<rect key={i} x={tx} y={top - 10} width={tW} height={th + 10} fill={toothColor} stroke={INK} strokeWidth={2.2} />);
      if (s.bottom)
        teethBot.push(<rect key={i} x={tx} y={bot - th * 0.75} width={tW} height={th + 10} fill={toothColor} stroke={INK} strokeWidth={2.2} />);
    }
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={inside} stroke={lip} strokeWidth={sw + 7} strokeLinejoin="round" />
      <g clipPath={`url(#${clip})`}>
        {s.tongue > 0 ? (
          <ellipse cx={cx} cy={bot * (1.05 - s.tongue * 0.25)} rx={hw * 0.62} ry={Math.max(4, oh * 0.38)} fill={tongue} stroke={INK} strokeWidth={2} />
        ) : null}
        {s.top ? teethTop : null}
        {s.bottom ? teethBot : null}
        {fangs && oh > 4
          ? [-1, 1].map((sd) => (
              <path
                key={sd}
                d={`M${cx + sd * hw * 0.62 - 7},${top - 6} L${cx + sd * hw * 0.62 + 7},${top - 6} L${cx + sd * hw * 0.62},${top + Math.min(oh * 0.6, maxOpen * 0.45)} Z`}
                fill={toothColor}
                stroke={INK}
                strokeWidth={2}
              />
            ))
          : null}
      </g>
      <path d={d} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {s.bite ? <path d={`M${cx - hw * 0.8},${bot * 0.3} Q${cx},${bot + 6} ${cx + hw * 0.8},${bot * 0.3}`} fill="none" stroke={lip} strokeWidth={sw + 4} /> : null}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Flies buzzing around something filthy                               */
/* ------------------------------------------------------------------ */

export const Flies: React.FC<{ cx: number; cy: number; count?: number; t: number; r?: number; seed?: string; size?: number }> = ({
  cx,
  cy,
  count = 3,
  t,
  r = 90,
  seed = "fly",
  size = 1,
}) => (
  <g>
    {Array.from({ length: count }).map((_, i) => {
      const fx = cx + noise2D(`${seed}${i}x`, t * 0.9, i) * r;
      const fy = cy + noise2D(`${seed}${i}y`, i, t * 0.9) * r * 0.6;
      const flap = Math.floor(t * 24) % 2 === 0;
      return (
        <g key={i} transform={`translate(${fx} ${fy}) scale(${size})`}>
          <ellipse cx={-3} cy={-4} rx={5} ry={flap ? 6 : 2.5} fill="#d8e0e8" opacity={0.7} stroke={INK} strokeWidth={1} />
          <ellipse cx={3} cy={-4} rx={5} ry={flap ? 6 : 2.5} fill="#d8e0e8" opacity={0.7} stroke={INK} strokeWidth={1} />
          <ellipse cx={0} cy={0} rx={4.5} ry={3.6} fill="#0d0a0a" />
        </g>
      );
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* Simple helpers                                                      */
/* ------------------------------------------------------------------ */

export const Shadow: React.FC<{ cx: number; cy: number; rx: number; ry?: number; o?: number }> = ({ cx, cy, rx, ry = rx * 0.18, o = 0.4 }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#000" opacity={o} />
);

/** "Smell" / stink lines drifting upward. */
export const StinkLines: React.FC<{ x: number; y: number; t: number; color?: string; n?: number; h?: number }> = ({
  x,
  y,
  t,
  color = "#9fbf5a",
  n = 3,
  h = 140,
}) => (
  <g opacity={0.85}>
    {Array.from({ length: n }).map((_, i) => {
      const ox = x + (i - (n - 1) / 2) * 34;
      const ph = t * 3 + i * 1.7;
      const pts: Pt[] = [];
      for (let s = 0; s <= 6; s++) {
        pts.push([ox + Math.sin(ph + s * 1.2) * 12, y - (s / 6) * h]);
      }
      return <path key={i} d={smoothPath(pts, false)} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />;
    })}
  </g>
);
