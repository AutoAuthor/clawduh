import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { DLine, blinkAmount, saccade, taperPath } from "../../../characters/parts";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, clamp, limb, onN, rnd, smoothPath } from "../../../engine/util";
import { OPEN } from "../speech";

/**
 * RACHEL — Glim's inner consciousness (he named it). An inside-out double of him that unspools from the third eye on
 * his forehead on a glowing cord: pale, translucent and lit from inside where he is dark and starry, freckled with
 * little black anti-stars, a bright star plugged where his chest-hole is. No nose, no ring, no brows. Two void eye
 * sockets that drip black, each with one tiny white pupil, and a grin that is much too wide and always clenched —
 * it unclenches like a slot when it talks.
 * Faces right by default. Origin = the hips; the wispy tail curls down to RACHEL_TAIL, where the cord attaches.
 */

export type RachelExpr = "grin" | "sly" | "coo" | "blank" | "hungry";

export interface RachelProps {
  id: string;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  t: number;
  frame: number;
  mouth: MouthShape;
  talking?: boolean;
  energy?: number;
  expr?: RachelExpr;
  look?: Pt;
  headTilt?: number;
  /** 0..1 -> head turns 0..180 degrees (owl-twist) */
  twist?: number;
  armF?: [number, number];
  armB?: [number, number];
  /** overall opacity */
  alpha?: number;
  /** 0..1 grows out of the cord point */
  emerge?: number;
  /** lean the body forward (degrees) */
  lean?: number;
}

const GHOST = "#e3fbf6";
const GHOST_DK = "#a9dcd8";
const EDGE = "#0c2c35";
const GLOW = "#7ff6ff";
const VOID = "#03040a";
const TOOTH = "#fbfff7";

export const RACHEL_HEAD: Pt = [8, -268];
export const RACHEL_TAIL: Pt = [-40, 168];

const EXPR: Record<RachelExpr, { smile: number; squint: number; pupil: number; baseOpen: number; drip: number }> = {
  grin: { smile: 0.95, squint: 0, pupil: 3.6, baseOpen: 0, drip: 0.6 },
  sly: { smile: 0.8, squint: 0.42, pupil: 3.2, baseOpen: 0, drip: 0.4 },
  coo: { smile: 0.55, squint: 0.2, pupil: 4.2, baseOpen: 0, drip: 0.3 },
  blank: { smile: 0.15, squint: 0, pupil: 2.4, baseOpen: 0, drip: 1 },
  hungry: { smile: 1.05, squint: 0.1, pupil: 2.2, baseOpen: 0.18, drip: 1 },
};

const HEAD_PTS: Pt[] = [
  [-92, 0],
  [-86, -60],
  [-54, -108],
  [0, -124],
  [56, -110],
  [92, -64],
  [104, -6],
  [98, 48],
  [74, 90],
  [30, 112],
  [-18, 104],
  [-60, 78],
  [-86, 40],
];

const TORSO_PTS: Pt[] = [
  [-30, -4],
  [34, -4],
  [56, -60],
  [62, -118],
  [46, -164],
  [18, -180],
  [-20, -178],
  [-46, -158],
  [-52, -110],
  [-44, -54],
];

/** Point on a quadratic Bezier. */
const qb = (p0: Pt, p1: Pt, p2: Pt, s: number): Pt => [
  (1 - s) * (1 - s) * p0[0] + 2 * (1 - s) * s * p1[0] + s * s * p2[0],
  (1 - s) * (1 - s) * p0[1] + 2 * (1 - s) * s * p1[1] + s * s * p2[1],
];

/** The clenched too-wide grin; `open` drops the lower jaw like a slot. */
export const Grin: React.FC<{ id: string; x: number; y: number; w: number; open: number; smile: number; round?: number }> = ({ id, x, y, w, open, smile, round = 0 }) => {
  const hw = (w / 2) * (1 - round * 0.4);
  const c = smile * 22;
  const oh = open * 54;
  const u0: Pt = [-hw, -c];
  const u1: Pt = [0, c * 1.25];
  const u2: Pt = [hw, -c];
  const l1: Pt = [0, c * 1.25 + 24 + oh * 2];
  const shape = `M${u0[0]},${u0[1]} Q${u1[0]},${u1[1]} ${u2[0]},${u2[1]} Q${l1[0]},${l1[1]} ${u0[0]},${u0[1]} Z`;
  const n = 15;
  const tw = ((2 * hw) / n) * 0.82;
  const top: React.ReactNode[] = [];
  const bot: React.ReactNode[] = [];
  for (let i = 1; i < n; i++) {
    const s = i / n;
    const a = qb(u0, u1, u2, s);
    const b = qb(u0, l1, u2, s);
    const h = 9 + Math.sin(s * Math.PI) * 6 + (rnd(`${id}t${i}`) - 0.5) * 3;
    top.push(<rect key={i} x={a[0] - tw / 2} y={a[1] - 3} width={tw} height={h + 3} rx={2} fill={TOOTH} stroke={EDGE} strokeWidth={1.6} />);
    bot.push(<rect key={i} x={b[0] - tw / 2} y={b[1] - h} width={tw} height={h + 3} rx={2} fill={TOOTH} stroke={EDGE} strokeWidth={1.6} />);
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={`${id}-grin`}>
          <path d={shape} />
        </clipPath>
      </defs>
      <path d={shape} fill={VOID} stroke={GHOST_DK} strokeWidth={9} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-grin)`}>
        {open > 0.25 ? <ellipse cx={0} cy={c * 1.25 + 16 + oh} rx={hw * 0.45} ry={6 + oh * 0.35} fill="#2a5a66" /> : null}
        {top}
        {bot}
      </g>
      <path d={shape} fill="none" stroke={EDGE} strokeWidth={4} strokeLinejoin="round" />
      {/* corner creases that run up the cheeks */}
      <path d={`M${-hw - 2},${-c} q-8,-10 -6,-22 M${hw + 2},${-c} q8,-10 6,-22`} fill="none" stroke={EDGE} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

export const Rachel: React.FC<RachelProps> = ({
  id,
  x,
  y,
  scale = 1,
  flip = false,
  t,
  frame,
  mouth,
  talking = false,
  energy = 0,
  expr = "grin",
  look,
  headTilt = 0,
  twist = 0,
  armF,
  armB,
  alpha = 1,
  emerge = 1,
  lean = 0,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const open = Math.max(OPEN[mouth] * (talking ? 0.7 + energy * 0.6 : 0.4), e.baseOpen);
  const bob = talking ? open * 6 + energy * 3 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.8 : 0.25), 4) * (talking ? 5 : 3);
  const blink = blinkAmount(t, id, 4.6);
  const dart = saccade(t, id, 0.1, 1.3);
  const gaze: Pt = [(look?.[0] ?? 0.4) + dart[0], (look?.[1] ?? 0) + dart[1]];
  const hover = Math.sin(t * 1.3) * 6;
  const geo = useMemo(
    () => ({
      head: smoothPath(HEAD_PTS, true, 0.9),
      torso: smoothPath(TORSO_PTS, true, 0.75),
      specks: Array.from({ length: 26 }).map((_, i) => [rnd(`${id}sp${i}`) * 180 - 90, rnd(`${id}spy${i}`) * 220 - 120, 1 + rnd(`${id}spr${i}`) * 2.4] as const),
      bspecks: Array.from({ length: 14 }).map((_, i) => [rnd(`${id}bp${i}`) * 90 - 45, -rnd(`${id}bpy${i}`) * 170, 1 + rnd(`${id}bpr${i}`) * 2] as const),
    }),
    [id],
  );

  const sw = (k: string, a: number) => noise2D(id + k, t2 * 0.3, 2) * a;
  const shF: Pt = [40, -160];
  const shB: Pt = [-34, -158];
  const aF = limb(shF, armF ?? [50 + sw("f", 14), 50 + sw("fe", 16)], [100, 96]);
  const aB = limb(shB, armB ?? [-20 + sw("b", 12), 30 + sw("be", 14)], [100, 96]);

  const hand = (pts: Pt[], key: string) => {
    const end = pts[2];
    const prev = pts[1];
    const a = Math.atan2(end[0] - prev[0], end[1] - prev[1]);
    return (
      <g key={key}>
        {[-0.45, 0, 0.45].map((da, i) => {
          const r = a + da;
          const l = i === 1 ? 50 : 42;
          const tip: Pt = [end[0] + Math.sin(r) * l, end[1] + Math.cos(r) * l];
          return <DLine key={i} d={`M${end[0]},${end[1]} L${tip[0]},${tip[1]}`} w={7} color={GHOST} outline={EDGE} ow={3} />;
        })}
        <circle cx={end[0]} cy={end[1]} r={10} fill={GHOST} stroke={EDGE} strokeWidth={3} />
      </g>
    );
  };

  const tw = noise2D(id + "tail", t2 * 0.5, 0) * 16;
  const tailPts: Pt[] = [
    [0, -8],
    [-6, 50 + tw * 0.2],
    [-28 + tw, 104],
    [RACHEL_TAIL[0] + tw * 0.5, RACHEL_TAIL[1] - 10],
    RACHEL_TAIL,
  ];

  const head: Pt = [RACHEL_HEAD[0], RACHEL_HEAD[1] + bob * 0.4];
  const sq = clamp(e.squint + blink * 0.9);
  const sockets: Array<[number, number, number, number]> = [
    [-6, -14, 22, 30],
    [50, -10, 27, 35],
  ];
  const s = flip ? -scale : scale;
  const em = clamp(emerge);

  return (
    <g opacity={alpha} transform={`translate(${x} ${y + hover}) scale(${s} ${scale})`}>
      <g transform={`translate(${RACHEL_TAIL[0]} ${RACHEL_TAIL[1]}) scale(${0.08 + em * 0.92}) translate(${-RACHEL_TAIL[0]} ${-RACHEL_TAIL[1]})`}>
        {/* glow halo */}
        <defs>
          <radialGradient id={`${id}-halo`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={GLOW} stopOpacity={0.22} />
            <stop offset="0.6" stopColor={GLOW} stopOpacity={0.08} />
            <stop offset="1" stopColor={GLOW} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={head[0]} cy={head[1] + 80} rx={260} ry={340} fill={`url(#${id}-halo)`} />
        <path d={taperPath(tailPts, 60, 6)} fill={GHOST} fillOpacity={0.72} stroke={EDGE} strokeWidth={3.5} />
        <g transform={`rotate(${lean} 0 -10)`}>
          <DLine d={smoothPath(aB, false, 0.6)} w={14} color={GHOST_DK} outline={EDGE} ow={3.5} />
          {hand(aB, "hB")}
          <path d={geo.torso} fill="none" stroke={GLOW} strokeWidth={18} opacity={0.25} />
          <path d={geo.torso} fill={GHOST} fillOpacity={0.82} stroke={EDGE} strokeWidth={4.5} />
          {geo.bspecks.map(([bx, by, r], i) => (
            <circle key={i} cx={bx} cy={by} r={r} fill={VOID} opacity={0.55} />
          ))}
          {/* the plug: a bright star where Glim has a hole */}
          <g transform="translate(6 -108)">
            <circle r={26} fill={GLOW} opacity={0.3} />
            <path d="M0,-17 L4,-4 L17,0 L4,4 L0,17 L-4,4 L-17,0 L-4,-4 Z" fill="#fffef0" stroke={EDGE} strokeWidth={2.5} />
          </g>
          <DLine d="M4,-174 L8,-206" w={22} color={GHOST} outline={EDGE} ow={4} />
          <g transform={`translate(${head[0]} ${head[1]}) rotate(${tilt + clamp(twist) * 180})`}>
            <path d={geo.head} fill="none" stroke={GLOW} strokeWidth={16} opacity={0.2} />
            <path d={geo.head} fill={GHOST} fillOpacity={0.86} stroke={EDGE} strokeWidth={5} />
            <ellipse cx={-40} cy={30} rx={50} ry={70} fill={GHOST_DK} opacity={0.35} />
            {geo.specks.map(([sx, sy, r], i) => (
              <circle key={i} cx={sx} cy={sy} r={r} fill={VOID} opacity={0.45} />
            ))}
            {/* void sockets, tilted mean, dripping black; one tiny white pupil each */}
            {sockets.map(([cx, cy, rx, ry], i) => {
              const h = ry * (1 - sq * 0.75);
              const dripL = (22 + rnd(`${id}dr${i}`) * 26) * e.drip * (0.85 + 0.15 * Math.sin(t * 0.9 + i));
              const dx1 = cx - rx * 0.3;
              const dx2 = cx + rx * 0.35;
              const by = cy + (ry - h) * 0.4 + h * 0.85;
              return (
                <g key={i} transform={`rotate(${i ? 12 : -12} ${cx} ${cy})`}>
                  <ellipse cx={cx} cy={cy + (ry - h) * 0.4} rx={rx} ry={Math.max(2.5, h)} fill={VOID} stroke={EDGE} strokeWidth={3} />
                  <path d={`M${dx1 - 5},${by - 4} L${dx1 - 3},${by + dripL} a4,5 0 1 0 8,0 L${dx1 + 5},${by - 4} Z`} fill={VOID} />
                  <path d={`M${dx2 - 3},${by - 6} L${dx2 - 2},${by + dripL * 0.55} a3,4 0 1 0 6,0 L${dx2 + 3},${by - 6} Z`} fill={VOID} />
                  {h > 6 ? <circle cx={cx + gaze[0] * rx * 0.45} cy={cy + gaze[1] * h * 0.4} r={e.pupil * (i ? 1.1 : 0.95)} fill="#ffffff" /> : null}
                </g>
              );
            })}
            <Grin id={`${id}-g`} x={38} y={56} w={124} open={open} smile={e.smile} round={mouth === "F" || mouth === "E" ? 0.35 : 0} />
          </g>
          <DLine d={smoothPath(aF, false, 0.6)} w={14} color={GHOST} outline={EDGE} ow={3.5} />
          {hand(aF, "hF")}
        </g>
      </g>
    </g>
  );
};

/** Glowing cord from Glim's third eye to Rachel's tail (world coordinates). It rises off his forehead in an arc
 *  (lift > 0), so it never drapes across his face. */
export const Cord: React.FC<{ from: Pt; to: Pt; t: number; lift?: number; opacity?: number }> = ({ from, to, t, lift = 0.45, opacity = 1 }) => {
  const dist = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const c1: Pt = [from[0] + (to[0] - from[0]) * 0.15 + Math.sin(t * 1.7) * 10, Math.min(from[1], to[1]) - dist * lift + Math.cos(t * 1.3) * 10];
  const c2: Pt = [from[0] + (to[0] - from[0]) * 0.8, Math.min(from[1], to[1]) - dist * lift * 0.6];
  const d = `M${from[0]},${from[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${to[0]},${to[1]}`;
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={GLOW} strokeWidth={20} opacity={0.18} strokeLinecap="round" />
      <path d={d} fill="none" stroke={EDGE} strokeWidth={9} strokeLinecap="round" />
      <path d={d} fill="none" stroke={GLOW} strokeWidth={5} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#ffffff" strokeWidth={1.6} strokeLinecap="round" strokeDasharray="14 22" strokeDashoffset={-t * 60} />
    </g>
  );
};

/** World position of Rachel's tail tip (cord end) for a placement. */
export const rachelTail = (x: number, y: number, scale = 1, flip = false, t = 0): Pt => [x + RACHEL_TAIL[0] * (flip ? -scale : scale), y + Math.sin(t * 1.3) * 6 + RACHEL_TAIL[1] * scale];
/** World position of Rachel's head centre. */
export const rachelHead = (x: number, y: number, scale = 1, flip = false): Pt => [x + RACHEL_HEAD[0] * (flip ? -scale : scale), y + RACHEL_HEAD[1] * scale];
