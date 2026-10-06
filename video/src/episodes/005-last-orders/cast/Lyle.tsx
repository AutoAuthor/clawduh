import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { DLine, Eye, INK, Mouth, Shadow, blinkAmount, saccade } from "../../../characters/parts";
import { mixHex } from "../../../characters/Possum";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, blob, limb, onN, rnd, smoothPath } from "../../../engine/util";
import { CARAFE_GRIP, Carafe, FONT, MUSTARD, MUSTARD_DK, PURPLE, PURPLE_DK, PaperCup, SkullBean, Unflip } from "../props";

/**
 * LYLE — the frazzled hedgehog barista who already cleaned the station.
 * Quills in a permanent state of alarm (they bristle on cue and shed when he's stressed), a purple DREGS paper cap,
 * mustard tee under the purple apron, bloodshot beady eyes with luggage-sized bags and a twitch.
 * Faces right by default. Origin = floor between the feet.
 */

export type LyleExpr = "frazzled" | "annoyed" | "confused" | "shocked" | "scheme" | "delighted" | "deadpan" | "concerned" | "creepy" | "realize" | "evil";

export interface LyleProps {
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
  expr?: LyleExpr;
  look?: Pt;
  headTilt?: number;
  /** 0..1 quills standing on end (added to the expression's own amount) */
  bristle?: number;
  /** [shoulder, elbow] degrees, 0 = hanging down, + = forward */
  armF?: [number, number];
  armB?: [number, number];
  /** carafe in the front hand */
  pot?: "decaf" | "regular" | null;
  potTilt?: number;
  potFill?: number;
  potCobweb?: boolean;
  /** paper cup in the back hand */
  cup?: boolean;
  cupName?: string;
  cupLid?: "decaf" | "regular" | "redeye";
  rag?: boolean;
  /** degrees, lean the upper body forward (+) or back (-) */
  lean?: number;
  /** 0..1 eye twitch */
  twitch?: number;
  /** 0..1 loose quills falling off */
  shed?: number;
}

const FACE = "#dcc29a";
const FACE_DK = "#b8996c";
const QUILL = "#4b3b30";
const QUILL_DK = "#2b211b";
const QUILL_TIP = "#d9c8a2";
const PAW = "#c9a27e";
const SHIRT = "#b48a30";
const PANTS = "#37323b";

type E = { lidTop: number; lidBottom: number; lidAngle: number; pupil: number; smile: number; brow: number; browTilt: number; bristle: number };
const EXPR: Record<LyleExpr, E> = {
  frazzled: { lidTop: 0.28, lidBottom: 0.2, lidAngle: -8, pupil: 0.42, smile: -0.4, brow: 0.8, browTilt: -14, bristle: 0.35 },
  annoyed: { lidTop: 0.46, lidBottom: 0.2, lidAngle: 14, pupil: 0.36, smile: -0.5, brow: -0.6, browTilt: 18, bristle: 0.25 },
  confused: { lidTop: 0.08, lidBottom: 0.05, lidAngle: 0, pupil: 0.34, smile: -0.2, brow: 1, browTilt: 0, bristle: 0.1 },
  shocked: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.22, smile: -0.5, brow: 1.6, browTilt: -10, bristle: 1 },
  scheme: { lidTop: 0.42, lidBottom: 0.26, lidAngle: 18, pupil: 0.3, smile: 0.8, brow: -0.8, browTilt: 22, bristle: 0.2 },
  delighted: { lidTop: 0.12, lidBottom: 0.3, lidAngle: -10, pupil: 0.46, smile: 0.75, brow: 1, browTilt: -12, bristle: 0.15 },
  deadpan: { lidTop: 0.52, lidBottom: 0.2, lidAngle: 0, pupil: 0.34, smile: 0, brow: 0, browTilt: 0, bristle: 0 },
  concerned: { lidTop: 0.08, lidBottom: 0.1, lidAngle: -14, pupil: 0.4, smile: -0.3, brow: 1.2, browTilt: -20, bristle: 0.2 },
  creepy: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.16, smile: 1, brow: 0.9, browTilt: 0, bristle: 0.1 },
  realize: { lidTop: 0, lidBottom: 0.05, lidAngle: 0, pupil: 0.24, smile: 0.25, brow: 1.4, browTilt: -8, bristle: 0.6 },
  evil: { lidTop: 0.36, lidBottom: 0.3, lidAngle: 22, pupil: 0.2, smile: 1, brow: -1, browTilt: 26, bristle: 0.55 },
};

export const LYLE_HEAD: Pt = [22, -300];

/** Body-local position of the carafe's spout for a given front-arm pose and tilt (lean = 0, unflipped). */
export function lyleSpout(armF: [number, number], potTilt: number): Pt {
  const hand = limb([44, -216], armF, [62, 58])[2];
  const r = (potTilt * Math.PI) / 180;
  const vx = 74.9;
  const vy = -28.8;
  return [hand[0] + vx * Math.cos(r) - vy * Math.sin(r), hand[1] + vx * Math.sin(r) + vy * Math.cos(r)];
}

interface Tooth {
  b0: Pt;
  tip: Pt;
  b1: Pt;
  t0: Pt;
  t1: Pt;
}

/** Zig-zag quill teeth along a list of base points; dir = outward normal rotated `sweep` deg toward the back. */
function teeth(base: Pt[], outward: (i: number) => number, len: (i: number) => number, sweep: number): Tooth[] {
  const out: Tooth[] = [];
  for (let i = 0; i < base.length - 1; i++) {
    const a = base[i];
    const b = base[i + 1];
    const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const d = ((outward(i) - sweep) * Math.PI) / 180;
    const L = len(i);
    const tip: Pt = [m[0] + Math.cos(d) * L, m[1] + Math.sin(d) * L];
    const k = 0.66;
    const t0: Pt = [a[0] + (tip[0] - a[0]) * k, a[1] + (tip[1] - a[1]) * k];
    const t1: Pt = [b[0] + (tip[0] - b[0]) * k, b[1] + (tip[1] - b[1]) * k];
    out.push({ b0: a, tip, b1: b, t0, t1 });
  }
  return out;
}

const toothPath = (ts: Tooth[], close: Pt[]) =>
  `M${ts[0].b0[0].toFixed(1)},${ts[0].b0[1].toFixed(1)} ` +
  ts.map((q) => `L${q.tip[0].toFixed(1)},${q.tip[1].toFixed(1)} L${q.b1[0].toFixed(1)},${q.b1[1].toFixed(1)}`).join(" ") +
  " " +
  close.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") +
  " Z";

const tipsPath = (ts: Tooth[]) => ts.map((q) => `M${q.t0[0].toFixed(1)},${q.t0[1].toFixed(1)} L${q.tip[0].toFixed(1)},${q.tip[1].toFixed(1)} L${q.t1[0].toFixed(1)},${q.t1[1].toFixed(1)} Z`).join(" ");

export const Lyle: React.FC<LyleProps> = ({
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
  expr = "frazzled",
  look,
  headTilt = 0,
  bristle = 0,
  armF = [16, 46],
  armB = [-8, 18],
  pot = null,
  potTilt = 0,
  potFill = 0.6,
  potCobweb = false,
  cup = false,
  cupName,
  cupLid = "regular",
  rag = true,
  lean = 0,
  twitch = 0.4,
  shed = 0,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 7 + energy * 3 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 1 : 0.35), 2) * (talking ? 6 : 2.5);
  const blink = expr === "creepy" || expr === "shocked" ? 0 : blinkAmount(t, id, 2.6);
  const dart = saccade(t, id, expr === "frazzled" || expr === "shocked" ? 0.32 : 0.14, 0.7);
  const gaze: Pt = [(look?.[0] ?? 0.5) + dart[0], (look?.[1] ?? 0) + dart[1]];
  const br = Math.min(1.2, e.bristle + bristle);
  // twitchy lower lid on the near eye
  const tw = twitch > 0 && rnd(`${id}tw${Math.floor(f2 / 2)}`) < 0.18 * twitch ? 0.32 : 0;
  // quills shiver a little when bristled
  const shiver = br > 0.5 ? (rnd(`${id}sh${f2}`) - 0.5) * br * 3 : 0;

  const geo = useMemo(() => {
    const sweep = 34;
    // head crown: ellipse arc from the forehead over the top, round the back, to the nape
    const hb: Pt[] = [];
    const N = 22;
    const SPAN = 176; // forehead (-58 deg) over the top and round the back to the nape (-234 deg)
    for (let i = 0; i <= N; i++) {
      const a = -58 - (i / N) * SPAN;
      const r = (a * Math.PI) / 180;
      hb.push([-6 + Math.cos(r) * 62, -4 + Math.sin(r) * 56]);
    }
    const hOut = (i: number) => -58 - ((i + 0.5) / N) * SPAN;
    const hLen = (i: number) => 40 + rnd(`${id}hq${i}`) * 26 - (i < 2 ? 14 : 0);
    // back: nape down to the hips (body coordinates)
    const bb: Pt[] = smoothSamples(
      [
        [-20, -268],
        [-52, -246],
        [-72, -200],
        [-80, -150],
        [-74, -96],
        [-56, -70],
      ],
      14,
    );
    const bOut = (i: number) => {
      const a = bb[i];
      const b = bb[i + 1];
      return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90;
    };
    const bLen = (i: number) => 36 + rnd(`${id}bq${i}`) * 24 - (i > 11 ? 16 : 0);
    // strays: a few quills sticking out at the wrong angle
    const strays = [0, 1, 2].map((i) => ({ i: Math.floor(rnd(`${id}st${i}`) * (N - 4)) + 2, da: (rnd(`${id}sa${i}`) - 0.5) * 70, l: 1.12 + rnd(`${id}sl${i}`) * 0.14 }));
    return { hb, hOut, hLen, bb, bOut, bLen, sweep, strays, face: blob(6, 8, 58, 54, 12, 0.05, id + "face") };
  }, [id]);

  const sweep = geo.sweep * (1 - Math.min(1, br) * 0.75);
  const lenK = 1 + br * 0.38;
  const headTeeth = teeth(geo.hb, geo.hOut, (i) => geo.hLen(i) * lenK, sweep);
  const backTeeth = teeth(geo.bb, geo.bOut, (i) => geo.bLen(i) * lenK, sweep * 0.8);
  const headQuills = toothPath(headTeeth, [
    [-10, 30],
    [20, 10],
  ]);
  const backQuills = toothPath(backTeeth, [
    [0, -90],
    [10, -250],
  ]);

  // body
  const leanRot = `rotate(${lean} 0 -80)`;
  const shF: Pt = [44, -216];
  const shB: Pt = [-42, -220];
  const aF = limb(shF, armF, [62, 58]);
  const aB = limb(shB, armB, [62, 58]);
  const head: Pt = [LYLE_HEAD[0], LYLE_HEAD[1] + bob * 0.5];
  const s = flip ? -scale : scale;

  const paw = (pts: Pt[], key: string) => {
    const end = pts[2];
    const prev = pts[1];
    const a = Math.atan2(end[0] - prev[0], end[1] - prev[1]);
    const fingers = [-0.55, -0.2, 0.15, 0.5].map((da) => {
      const r = a + da;
      return `M${end[0]},${end[1]} L${end[0] + Math.sin(r) * 17},${end[1] + Math.cos(r) * 17}`;
    });
    return (
      <g key={key}>
        <path d={fingers.join(" ")} stroke={INK} strokeWidth={11} strokeLinecap="round" />
        <path d={fingers.join(" ")} stroke={PAW} strokeWidth={5.5} strokeLinecap="round" />
        <circle cx={end[0]} cy={end[1]} r={12} fill={PAW} stroke={INK} strokeWidth={4} />
      </g>
    );
  };
  const sleeve = (pts: Pt[]) => {
    const p: Pt = [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.45, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.45];
    return <path d={`M${pts[0][0]},${pts[0][1]} L${p[0]},${p[1]}`} stroke={INK} strokeWidth={42} strokeLinecap="round" />;
  };
  const sleeveFill = (pts: Pt[]) => {
    const p: Pt = [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.45, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.45];
    return <path d={`M${pts[0][0]},${pts[0][1]} L${p[0]},${p[1]}`} stroke={SHIRT} strokeWidth={32} strokeLinecap="round" />;
  };

  const torso = smoothPath(
    [
      [-58, -72],
      [56, -72],
      [76, -130],
      [64, -196],
      [40, -234],
      [0, -248],
      [-40, -236],
      [-64, -190],
      [-70, -120],
    ],
    true,
    0.65,
  );
  const apron = `M8,-224 L54,-226 L60,-162 L78,-150 L84,-36 Q32,-24 -22,-38 L-20,-150 L2,-162 Z`;

  const falling = shed > 0 ? [0, 1, 2, 3].map((i) => {
    const ph = (t * 0.7 + i * 0.27) % 1;
    const fx = -80 - rnd(`${id}fq${i}`) * 60 + Math.sin(t * 3 + i) * 10;
    const fy = -260 + ph * 260;
    return <path key={i} d={`M0,0 L26,4`} transform={`translate(${fx} ${fy}) rotate(${ph * 360 + i * 70})`} stroke={QUILL} strokeWidth={4} strokeLinecap="round" opacity={shed * (1 - ph)} />;
  }) : null;

  const pupilShape = expr === "creepy" ? 0.14 : e.pupil;
  const mouthShape: MouthShape = !talking && (expr === "creepy" || expr === "evil") ? "B" : mouth;

  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={0} cy={4} rx={96} o={0.35} />
      {/* legs + feet */}
      {[
        [-26, -74, -28, -16],
        [24, -74, 28, -16],
      ].map(([x0, y0, x1, y1], i) => (
        <DLine key={i} d={`M${x0},${y0} L${x1},${y1}`} w={30} color={i ? PANTS : mixHex(PANTS, "#000000", 0.25)} ow={4.5} />
      ))}
      {[-26, 30].map((fx, i) => (
        <g key={i} transform={`translate(${fx} -8)`}>
          <path d="M-14,-6 C-4,-14 24,-12 34,0 C34,8 22,10 -10,10 C-18,6 -18,-2 -14,-6 Z" fill={PAW} stroke={INK} strokeWidth={4} />
          <path d="M26,2 l10,4 M20,6 l9,5" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
      <g transform={leanRot}>
        {/* back quills behind everything */}
        <g transform={`translate(${shiver} 0)`}>
          <path d={backQuills} fill={QUILL} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d={tipsPath(backTeeth)} fill={QUILL_TIP} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          {backTeeth.filter((_, i) => i % 3 === 1).map((q, i) => (
            <path key={i} d={`M${q.b0[0] * 0.5 + q.tip[0] * 0.5},${q.b0[1] * 0.5 + q.tip[1] * 0.5} L${q.b1[0] * 0.7 + q.tip[0] * 0.3},${q.b1[1] * 0.7 + q.tip[1] * 0.3}`} stroke={QUILL_DK} strokeWidth={3} />
          ))}
        </g>
        {falling}
        {/* back arm */}
        {sleeve(aB)}
        <DLine d={smoothPath(aB, false, 0.6)} w={20} color={mixHex(PAW, "#000000", 0.12)} ow={4.5} />
        {sleeveFill(aB)}
        {paw(aB, "pB")}
        {cup ? (
          <g transform={`translate(${aB[2][0] + 4} ${aB[2][1] + 40})`}>
            <PaperCup name={cupName} lid={cupLid} flip={flip} t={t} scale={0.55} />
          </g>
        ) : null}
        {/* torso: mustard tee */}
        <path d={torso} fill={SHIRT} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-50,-200 q-8,50 2,110" stroke={mixHex(SHIRT, "#000000", 0.25)} strokeWidth={4} fill="none" />
        {/* coffee stains on the tee */}
        <path d={blob(-36, -120, 12, 9, 7, 0.3, id + "st1")} fill="#6b4a22" opacity={0.6} />
        {/* apron */}
        <path d={apron} fill={PURPLE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M14,-216 L48,-218 L54,-164 L72,-154 L76,-46 Q32,-36 -14,-46 L-12,-152 L8,-164 Z" fill="none" stroke={MUSTARD} strokeWidth={3} opacity={0.9} />
        <path d="M8,-224 L-4,-262 M54,-226 L46,-262" stroke={MUSTARD} strokeWidth={7} strokeLinecap="round" />
        <path d="M-66,-150 L-18,-152" stroke={MUSTARD_DK} strokeWidth={8} strokeLinecap="round" />
        <SkullBean x={32} y={-192} s={36} />
        <rect x={6} y={-120} width={52} height={34} rx={4} fill={PURPLE_DK} stroke={INK} strokeWidth={3} />
        <path d="M18,-122 l4,-26" stroke="#d0d0d8" strokeWidth={5} strokeLinecap="round" />
        <path d={blob(52, -66, 14, 10, 7, 0.35, id + "ast")} fill="#2a1a28" opacity={0.6} />
        {/* name tag */}
        <g transform="translate(-50 -214) rotate(-6)">
          <rect x={0} y={0} width={50} height={22} rx={4} fill="#f2ead6" stroke={INK} strokeWidth={3} />
          <Unflip flip={flip} cx={25}>
            <text x={25} y={17} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill={PURPLE_DK}>
              LYLE
            </text>
          </Unflip>
        </g>
        {/* neck */}
        <path d={`M14,-236 L18,-266`} stroke={INK} strokeWidth={40} strokeLinecap="round" />
        <path d={`M14,-236 L18,-266`} stroke={FACE_DK} strokeWidth={30} strokeLinecap="round" />
        {/* head */}
        <g transform={`translate(${head[0]} ${head[1]}) rotate(${tilt})`}>
          <g transform={`translate(${shiver} 0)`}>
            <path d={headQuills} fill={QUILL} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <path d={tipsPath(headTeeth)} fill={QUILL_TIP} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
            {geo.strays.map((st, k) => {
              const q = headTeeth[st.i];
              const a = Math.atan2(q.tip[1] - q.b0[1], q.tip[0] - q.b0[0]) + (st.da * Math.PI) / 180;
              const L = Math.hypot(q.tip[0] - q.b0[0], q.tip[1] - q.b0[1]) * st.l;
              const e2: Pt = [q.b0[0] + Math.cos(a) * L, q.b0[1] + Math.sin(a) * L];
              const m2: Pt = [q.b0[0] + Math.cos(a) * L * 0.7, q.b0[1] + Math.sin(a) * L * 0.7];
              return (
                <g key={k}>
                  <path d={`M${q.b0[0]},${q.b0[1]} L${e2[0]},${e2[1]}`} stroke={INK} strokeWidth={7} strokeLinecap="round" />
                  <path d={`M${q.b0[0]},${q.b0[1]} L${m2[0]},${m2[1]}`} stroke={QUILL} strokeWidth={3} strokeLinecap="round" />
                  <path d={`M${m2[0]},${m2[1]} L${e2[0]},${e2[1]}`} stroke={QUILL_TIP} strokeWidth={3} strokeLinecap="round" />
                </g>
              );
            })}
          </g>
          {/* ear */}
          <circle cx={-30} cy={-30} r={15} fill={FACE_DK} stroke={INK} strokeWidth={4} />
          <circle cx={-29} cy={-28} r={7} fill="#c98a86" />
          {/* face */}
          <path d={geo.face} fill={FACE} stroke={INK} strokeWidth={5} />
          {/* snout: short, pointed, a little upturned */}
          <path d="M30,-28 C58,-24 86,-14 104,-2 C110,12 94,28 62,38 C42,30 32,6 30,-28 Z" fill={FACE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M52,-16 q22,4 40,12" stroke={FACE_DK} strokeWidth={4} fill="none" />
          <ellipse cx={104} cy={2} rx={14} ry={12} fill="#1d1515" stroke={INK} strokeWidth={4} />
          <ellipse cx={100} cy={-3} rx={4.5} ry={3} fill="#fff" opacity={0.7} />
          {/* bags */}
          <path d="M-4,2 q14,13 30,0 M30,6 q17,15 34,0" stroke="#7a6286" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.75} />
          <path d="M-2,10 q13,11 24,2 M32,14 q15,11 30,2" stroke="#7a6286" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.45} />
          <Eye id={`${id}-eF`} seed={`${id}F`} cx={10} cy={-14} rx={13} ry={14} look={gaze} pupil={pupilShape} lidTop={Math.max(e.lidTop * (expr === "confused" ? 0.3 : 1), blink)} lidBottom={e.lidBottom} lidAngle={-e.lidAngle} lidColor={FACE} sw={3.5} veins={2} />
          <Eye id={`${id}-eN`} seed={`${id}N`} cx={46} cy={-12} rx={15} ry={17} look={gaze} pupil={pupilShape} lidTop={Math.max(e.lidTop, blink)} lidBottom={Math.min(0.9, e.lidBottom + tw)} lidAngle={e.lidAngle} lidColor={FACE} sw={3.5} veins={3} />
          {/* brows */}
          {[
            [10, -14, 13, -1],
            [46, -12, 15, 1],
          ].map(([cx, cy, rx, side], i) => {
            const by = cy - 23 - e.brow * 6 - (expr === "confused" && i === 1 ? 8 : 0);
            const tk = e.browTilt * (expr === "confused" ? (i === 0 ? 0.8 : -0.8) : 1);
            const inner = side > 0 ? cx - rx : cx + rx;
            const outer = side > 0 ? cx + rx : cx - rx;
            const dy = Math.tan((tk * Math.PI) / 180) * rx;
            return <path key={i} d={`M${inner},${by + dy} L${outer},${by - dy}`} stroke={QUILL_DK} strokeWidth={5.5} strokeLinecap="round" />;
          })}
          {/* paper cap perched in the quills */}
          <g transform="rotate(-12 0 -70)">
            <path d="M-46,-58 L50,-66 L38,-94 Q0,-112 -38,-86 Z" fill={PURPLE} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
            <path d="M-44,-62 L48,-70" stroke={MUSTARD} strokeWidth={6} />
            <path d="M2,-108 L6,-66" stroke={PURPLE_DK} strokeWidth={3} />
            <SkullBean x={-14} y={-82} s={18} rot={-6} />
          </g>
          {/* whiskers */}
          <g stroke={INK} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.85}>
            <path d="M88,18 L130,6 M90,24 L134,26 M86,30 L124,44" />
          </g>
          <g transform="rotate(-8 74 32)">
            <Mouth id={`${id}-mouth`} seed={`${id}m`} x={74} y={32} w={expr === "creepy" ? 58 : 40} maxOpen={30} shape={mouthShape} smile={e.smile} teeth="crooked" toothColor="#f1e8c8" lip="#a07a62" sw={4} />
          </g>
          {expr === "creepy" || expr === "evil" ? <path d="M38,22 q-6,8 -2,16 M108,10 q8,6 6,14" stroke={FACE_DK} strokeWidth={3.5} fill="none" strokeLinecap="round" /> : null}
          {/* sweat when frazzled */}
          {expr === "frazzled" || expr === "shocked" || expr === "concerned"
            ? [0, 1].map((i) => {
                const ph = (t * 0.9 + i * 0.5) % 1;
                return <ellipse key={i} cx={i ? 76 : -18} cy={-40 + ph * 60} rx={5} ry={8} fill="#bfe3f2" stroke={INK} strokeWidth={2.5} opacity={1 - ph} />;
              })
            : null}
        </g>
        {/* front arm + props */}
        {sleeve(aF)}
        <DLine d={smoothPath(aF, false, 0.6)} w={20} color={PAW} ow={4.5} />
        {sleeveFill(aF)}
        {pot ? (
          <g transform={`translate(${aF[2][0]} ${aF[2][1]}) rotate(${potTilt}) scale(0.72) translate(${-CARAFE_GRIP[0]} ${-CARAFE_GRIP[1]})`}>
            <Carafe kind={pot} fill={potFill} cobweb={potCobweb} t={t} />
          </g>
        ) : null}
        {paw(aF, "pF")}
        {rag ? (
          <g transform="translate(30 -236) rotate(10)">
            <path d="M-18,-8 C0,-14 16,-14 24,-10 L30,64 C18,70 0,70 -10,66 Z" fill="#e9e5d8" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <path d="M-14,12 L26,8 M-12,34 L28,30 M-10,54 L29,50" stroke="#5f7fb5" strokeWidth={4} />
            <path d="M-2,-12 L6,68 M12,-13 L18,67" stroke="#5f7fb5" strokeWidth={3} />
            <path d={blob(10, 44, 9, 6, 6, 0.3, id + "rag")} fill="#7a5a32" opacity={0.6} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

/** Sample a smooth-ish polyline into n evenly spaced points (linear between control points). */
function smoothSamples(ctrl: Pt[], n: number): Pt[] {
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < ctrl.length - 1; i++) {
    const l = Math.hypot(ctrl[i + 1][0] - ctrl[i][0], ctrl[i + 1][1] - ctrl[i][1]);
    seg.push(l);
    total += l;
  }
  const out: Pt[] = [];
  for (let k = 0; k <= n; k++) {
    let d = (k / n) * total;
    let i = 0;
    while (i < seg.length - 1 && d > seg[i]) {
      d -= seg[i];
      i++;
    }
    const f = Math.min(1, d / seg[i]);
    out.push([ctrl[i][0] + (ctrl[i + 1][0] - ctrl[i][0]) * f, ctrl[i][1] + (ctrl[i + 1][1] - ctrl[i][1]) * f]);
  }
  return out;
}

export { smoothSamples };
