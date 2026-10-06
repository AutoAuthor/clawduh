import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, blob, limb, onN, smoothPath } from "../../../engine/util";
import { DLine, Eye, INK, Mouth, Shadow, blinkAmount, saccade, taperPath } from "../../../characters/parts";
import { mixHex } from "../../../characters/Possum";

/**
 * DUANE — 45 today, still on his mama's couch.
 * A balding, paunchy spotted hyena: three-strand comb-over across a shiny scalp, bloodshot droopy eyes with
 * bags, a stubbly dark muzzle and crooked yellow teeth. Faded maroon PARTY ANIMAL hoodie stretched over the gut,
 * grey sweatpants, socks with slides, a can of FLAT LITE and a sad birthday hat on an elastic.
 * Faces right by default. Origin = the seat (pose "sit") or the floor between the feet (pose "stand").
 */

export type DuaneExpr = "bored" | "hopeful" | "whiny" | "hurt" | "annoyed" | "deadpan" | "shocked" | "strain" | "excited" | "sad" | "drunk";
export type DuanePose = "sit" | "stand";

export interface DuaneProps {
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
  expr?: DuaneExpr;
  pose?: DuanePose;
  look?: Pt;
  headTilt?: number;
  /** [shoulder, elbow] degrees, 0 = hanging, + = forward. Front arm holds the beer. */
  armF?: [number, number];
  armB?: [number, number];
  beer?: boolean;
  /** 0..1 can up to the mouth */
  sip?: number;
  hat?: boolean;
  /** extra hat tilt in degrees (+ = droops backward) */
  hatTilt?: number;
  /** 0..1 party blower out; blowDroop 0..1 = limp */
  blow?: number;
  blowDroop?: number;
  /** 0..1 sink into the couch */
  slump?: number;
  /** torso lean (deg, + = forward) on top of the pose default */
  lean?: number;
  /** 0..1 lifting strain: red face, veins, trembling */
  strain?: number;
  /** stand pose: feet positions (body coords) for a waddle */
  footF?: Pt;
  footB?: Pt;
  /** sweatband (gym) */
  sweatband?: boolean;
  /** a tiny pink 2 LB dumbbell in the front paw instead of the beer */
  dumbbell?: boolean;
  /** small belly jiggle amount */
  jiggle?: number;
}

const FUR = "#c4a277";
const FUR_DK = "#9c7c52";
const SPOT = "#6b4a2e";
const MUZZLE = "#4a3427";
const EAR_IN = "#8a6458";
const HOODIE = "#7b3b46";
const HOODIE_DK = "#5c2a33";
const PANTS = "#8f8c86";
const PANTS_DK = "#6e6b66";
const SOCK = "#e4ddcc";
const SLIDE = "#2f4f8f";
const PAW = "#3a2a20";
const HAT = "#e9cf63";
const HAT_DOT = "#e07a9a";
export const SEAT_H = 165;

type ExprSpec = { lidTop: number; lidBottom: number; lidAngle: number; pupil: number; smile: number; brow: number; browTilt: number; squeeze?: boolean };
const EXPR: Record<DuaneExpr, ExprSpec> = {
  bored: { lidTop: 0.5, lidBottom: 0.2, lidAngle: -6, pupil: 0.3, smile: -0.15, brow: 0.1, browTilt: -6 },
  hopeful: { lidTop: 0.08, lidBottom: 0.12, lidAngle: -12, pupil: 0.4, smile: 0.6, brow: 1.1, browTilt: -12 },
  whiny: { lidTop: 0.24, lidBottom: 0.12, lidAngle: -16, pupil: 0.34, smile: -0.55, brow: 1.3, browTilt: -24 },
  hurt: { lidTop: 0.34, lidBottom: 0.16, lidAngle: -20, pupil: 0.3, smile: -0.6, brow: 1.2, browTilt: -26 },
  annoyed: { lidTop: 0.5, lidBottom: 0.22, lidAngle: 16, pupil: 0.24, smile: -0.4, brow: -0.8, browTilt: 18 },
  deadpan: { lidTop: 0.56, lidBottom: 0.2, lidAngle: 0, pupil: 0.24, smile: 0, brow: 0, browTilt: 0 },
  shocked: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.16, smile: -0.5, brow: 1.6, browTilt: -8 },
  strain: { lidTop: 1, lidBottom: 0, lidAngle: 0, pupil: 0.3, smile: -0.7, brow: -1, browTilt: 24, squeeze: true },
  excited: { lidTop: 0, lidBottom: 0.1, lidAngle: -8, pupil: 0.44, smile: 0.85, brow: 1.2, browTilt: -8 },
  sad: { lidTop: 0.56, lidBottom: 0.12, lidAngle: -20, pupil: 0.3, smile: -0.6, brow: 1, browTilt: -26 },
  drunk: { lidTop: 0.62, lidBottom: 0.26, lidAngle: -4, pupil: 0.3, smile: 0.35, brow: 0.3, browTilt: -4 },
};

/** head centre per pose, body coords, facing right */
export const DUANE_HEAD: Record<DuanePose, Pt> = { sit: [42, -306], stand: [36, -500] };

export const Hyena: React.FC<DuaneProps> = ({
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
  expr = "bored",
  pose = "sit",
  look,
  headTilt = 0,
  armF,
  armB,
  beer = true,
  sip = 0,
  hat = true,
  hatTilt = 0,
  blow = 0,
  blowDroop = 0,
  slump = 0,
  lean = 0,
  strain = 0,
  footF = [34, -12],
  footB = [-30, -12],
  sweatband = false,
  dumbbell = false,
  jiggle = 0,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const jx = strain > 0 ? (noise2D(id + "jx", f2 * 0.9, 0) * 2) * strain * 4 : 0;
  const jy = strain > 0 ? (noise2D(id + "jy", 0, f2 * 0.9) * 2) * strain * 3 : 0;
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 6 + energy * 3 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.9 : 0.3), 3) * (talking ? 6 : 2.2);
  const blink = e.squeeze ? 0 : blinkAmount(t, id, 3.1);
  const dart = saccade(t, id, 0.11, 1.0);
  const gaze: Pt = [(look?.[0] ?? 0.5) + dart[0], (look?.[1] ?? 0.1) + dart[1]];
  const sit = pose === "sit";
  const P: Pt = sit ? [0, -24 + slump * 14] : [0, -222];
  const leanDeg = (sit ? -7 - slump * 9 : 0) + lean;
  const wob = jiggle > 0 ? Math.sin(t * 18) * jiggle * 6 : 0;
  const belly = 6 + wob;

  const geo = useMemo(
    () => ({
      skull: blob(0, 0, 64, 56, 12, 0.05, id + "skull"),
      hood: blob(-34, -196, 46, 24, 9, 0.1, id + "hood"),
    }),
    [id],
  );

  const faceCol = mixHex(FUR, "#d9534f", strain * 0.7);
  const defF: [number, number] = sit ? [26, 84] : [10, 30];
  const defB: [number, number] = sit ? [-10, 40] : [-8, 16];
  const fA = armF ?? defF;
  const aFang: [number, number] = sip > 0 ? [fA[0] + (62 - fA[0]) * sip, fA[1] + (128 - fA[1]) * sip] : fA;
  const SF: Pt = [40, -168];
  const SB: Pt = [-44, -164];
  const aF = limb(SF, aFang, [94, 88]);
  const aB = limb(SB, armB ?? defB, [94, 88]);
  const HC: Pt = [36 + sip * 6, -280 + bob * 0.5 + sip * 4];

  // ---- legs ----
  const legs = () => {
    if (sit) {
      const hipF: Pt = [14, -26];
      const kneeF: Pt = [126, -16];
      const ankF: Pt = [138, SEAT_H - 22];
      const hipB: Pt = [-14, -30];
      const kneeB: Pt = [104, -26];
      const ankB: Pt = [114, SEAT_H - 24];
      return (
        <g>
          {[
            [hipB, kneeB, ankB, true],
            [hipF, kneeF, ankF, false],
          ].map(([h, k, a, back], i) => (
            <g key={i}>
              <path d={taperPath([h as Pt, k as Pt], 70, 58)} fill={back ? PANTS_DK : PANTS} stroke={INK} strokeWidth={5} />
              <path d={taperPath([k as Pt, a as Pt], 54, 46)} fill={back ? PANTS_DK : PANTS} stroke={INK} strokeWidth={5} />
              {foot(a as Pt, back as boolean, `f${i}`)}
            </g>
          ))}
          {/* the cheese-dust stain on the knee */}
          <path d={blob(120, -10, 16, 10, 7, 0.3, id + "kn")} fill="#d98a2a" opacity={0.55} />
        </g>
      );
    }
    const hipF: Pt = [P[0] + 22, P[1] + 10];
    const hipB: Pt = [P[0] - 22, P[1] + 8];
    return (
      <g>
        {[
          [hipB, footB, true],
          [hipF, footF, false],
        ].map(([h, a, back], i) => {
          const hp = h as Pt;
          const an = a as Pt;
          const mid: Pt = [(hp[0] + an[0]) / 2 + 4, (hp[1] + an[1]) / 2];
          return (
            <g key={i}>
              <path d={taperPath([hp, mid, an], 70, 50)} fill={back ? PANTS_DK : PANTS} stroke={INK} strokeWidth={5} />
              {foot(an, back as boolean, `f${i}`)}
            </g>
          );
        })}
      </g>
    );
  };

  function foot(a: Pt, back: boolean, key: string) {
    return (
      <g key={key} transform={`translate(${a[0]} ${a[1]})`}>
        <path d="M-20,-6 C-18,-24 18,-26 30,-10 C40,-2 40,12 24,14 L-18,14 Z" fill={back ? mixHex(SOCK, "#000000", 0.12) : SOCK} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M-24,10 L44,10 L42,22 L-24,22 Z" fill={back ? "#233c6e" : SLIDE} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M-10,-8 Q8,-16 26,-4 L24,6 L-12,6 Z" fill={back ? "#233c6e" : SLIDE} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <circle cx={34} cy={-2} r={4} fill="#c7a99a" stroke={INK} strokeWidth={2} />
      </g>
    );
  }

  const paw = (pts: Pt[], back: boolean, key: string, holdBeer: boolean) => {
    const end = pts[2];
    const prev = pts[1];
    const a = Math.atan2(end[0] - prev[0], end[1] - prev[1]);
    const deg = (-a * 180) / Math.PI;
    return (
      <g key={key}>
        {holdBeer ? (
          <g transform={`translate(${end[0] + Math.sin(a) * 8} ${end[1] + Math.cos(a) * 8}) rotate(${sip > 0.5 ? -60 * (sip - 0.5) * 2 : 0})`}>
            <rect x={-17} y={-34} width={34} height={64} rx={6} fill="#a9bccb" stroke={INK} strokeWidth={4} />
            <rect x={-17} y={-14} width={34} height={22} fill="#d64545" />
            <rect x={-17} y={-34} width={34} height={64} rx={6} fill="none" stroke={INK} strokeWidth={4} />
            <ellipse cx={0} cy={-34} rx={15} ry={4} fill="#d4dde4" stroke={INK} strokeWidth={2.5} />
            <path d="M-6,22 l4,-8 l3,6" stroke="#6f8597" strokeWidth={2.5} fill="none" />
            <g transform={flip ? "scale(-1 1)" : undefined}>
              <text x={0} y={3} textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontWeight={900} fontSize={12} fill="#fff4e0">
                FLAT
              </text>
            </g>
          </g>
        ) : null}
        {!back && dumbbell ? (
          <g transform={`translate(${end[0] + Math.sin(a) * 10} ${end[1] + Math.cos(a) * 10}) rotate(${deg + 90})`}>
            <rect x={-30} y={-6} width={60} height={12} rx={4} fill="#9a9aa0" stroke={INK} strokeWidth={3} />
            {[-34, 34].map((dx) => (
              <rect key={dx} x={dx - 10} y={-18} width={20} height={36} rx={7} fill="#f08ab0" stroke={INK} strokeWidth={3.5} />
            ))}
            <g transform={flip ? "scale(-1 1)" : undefined}>
              <text x={0} y={34} textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontWeight={900} fontSize={13} fill="#f08ab0" stroke={INK} strokeWidth={0.8}>
                2 LB
              </text>
            </g>
          </g>
        ) : null}
        <g transform={`translate(${end[0]} ${end[1]}) rotate(${deg})`}>
          <circle cx={0} cy={4} r={17} fill={back ? "#2a1e17" : PAW} stroke={INK} strokeWidth={4} />
          {[-10, -3, 4, 11].map((fx, i) => (
            <g key={i}>
              <path d={`M${fx},14 L${fx * 1.2},28`} stroke={INK} strokeWidth={10} strokeLinecap="round" />
              <path d={`M${fx},14 L${fx * 1.2},28`} stroke={back ? "#2a1e17" : PAW} strokeWidth={5} strokeLinecap="round" />
              <path d={`M${fx * 1.2},28 l${fx > 0 ? 2 : -2},6`} stroke="#d8cfb8" strokeWidth={2.5} strokeLinecap="round" />
            </g>
          ))}
        </g>
      </g>
    );
  };

  const sleeve = (pts: Pt[], back: boolean) => (
    <>
      <DLine d={smoothPath(pts, false, 0.6)} w={40} color={back ? HOODIE_DK : HOODIE} ow={4.5} />
      {/* ribbed cuff */}
      {(() => {
        const a = pts[1];
        const b = pts[2];
        const c: Pt = [a[0] + (b[0] - a[0]) * 0.82, a[1] + (b[1] - a[1]) * 0.82];
        const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
        return <rect x={-10} y={-21} width={20} height={42} rx={6} transform={`translate(${c[0]} ${c[1]}) rotate(${ang})`} fill={back ? "#4a2028" : HOODIE_DK} stroke={INK} strokeWidth={3.5} />;
      })()}
    </>
  );

  const torso = smoothPath(
    [
      [-66, 6],
      [46, 16],
      [98 + belly, -38],
      [106 + belly, -92],
      [82, -146],
      [52, -184],
      [12, -200],
      [-36, -194],
      [-66, -164],
      [-80, -94],
    ],
    true,
    0.62,
  );

  // party blower: paper tube from the mouth (head coords)
  const blower = () => {
    if (blow <= 0) return null;
    const len = 24 + blow * 150;
    const droop = blowDroop;
    const pts: Pt[] = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const dx = u * len;
      const sag = droop * (u * u) * 120 + Math.sin(u * 3 + t * 6) * (1 - droop) * 3;
      pts.push([92 + dx * (1 - droop * 0.35), 40 + sag]);
    }
    const tip = pts[n];
    return (
      <g>
        <path d={smoothPath(pts, false)} stroke={INK} strokeWidth={24} fill="none" strokeLinecap="round" />
        <path d={smoothPath(pts, false)} stroke="#58b6e0" strokeWidth={16} fill="none" strokeLinecap="round" />
        <path d={smoothPath(pts, false)} stroke="#f4d24a" strokeWidth={4} fill="none" strokeDasharray="10 12" />
        {blow < 0.95 ? <circle cx={tip[0]} cy={tip[1]} r={11 + (1 - blow) * 8} fill="#58b6e0" stroke={INK} strokeWidth={4} /> : null}
        <path d="M76,34 L96,32 L96,48 L76,50 Z" fill="#f2f0ea" stroke={INK} strokeWidth={3.5} />
      </g>
    );
  };

  const s = flip ? -scale : scale;
  return (
    <g transform={`translate(${x + jx} ${y}) scale(${s} ${scale})`}>
      {!sit ? <Shadow cx={0} cy={2} rx={120} o={0.35} /> : null}
      {/* far arm */}
      <g transform={`translate(${P[0]} ${P[1]}) rotate(${leanDeg})`}>
        {sleeve(aB, true)}
        {paw(aB, true, "pB", false)}
      </g>
      {legs()}
      <g transform={`translate(${P[0]} ${P[1]}) rotate(${leanDeg})`}>
        {/* hood bunched behind the neck */}
        <path d={geo.hood} fill={HOODIE_DK} stroke={INK} strokeWidth={5} />
        {/* gut in a hoodie */}
        <path d={torso} fill={HOODIE} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-54,-150 q-10,50 0,120" stroke={HOODIE_DK} strokeWidth={5} fill="none" />
        {/* the kangaroo pocket (+ a cheese-dust smear) */}
        <path d={`M28,-28 L${92 + belly},-22 L${100 + belly},-84 L40,-92 Z`} fill={HOODIE} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={blob(64 + belly * 0.5, -54, 14, 9, 7, 0.3, id + "smear")} fill="#d98a2a" opacity={0.5} />
        {/* ribbed hem */}
        <path d={`M-64,2 Q${0},${18} ${50 + belly},10`} stroke={HOODIE_DK} strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* cracked PARTY ANIMAL print */}
        <g transform="translate(42 -128) rotate(-6)">
          <g transform={flip ? "scale(-1 1)" : undefined}>
            <text x={0} y={0} textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontWeight={900} fontSize={15} fill="#e8d9c0" opacity={0.85}>
              PARTY
            </text>
            <text x={0} y={17} textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontWeight={900} fontSize={15} fill="#e8d9c0" opacity={0.85}>
              ANIMAL
            </text>
          </g>
          <path d="M-24,-10 l8,10 l-4,8 M10,-12 l-4,12 l8,6 M18,4 l10,8" stroke={HOODIE} strokeWidth={2.5} fill="none" />
        </g>
        {/* drawstrings (one chewed) */}
        <path d="M12,-194 Q8,-170 12,-136" stroke="#e8e0cc" strokeWidth={4} fill="none" />
        <path d="M28,-192 Q32,-176 30,-158" stroke="#e8e0cc" strokeWidth={4} fill="none" />
        <rect x={9} y={-138} width={6} height={10} fill="#bdb6a2" stroke={INK} strokeWidth={1.5} />
        <path d="M27,-160 l3,6 l3,-5" stroke="#bdb6a2" strokeWidth={3} fill="none" />
        {/* fat neck + jowl roll (no visible neck, really) */}
        <path d={`M${HC[0] - 58},${HC[1] + 86} C${HC[0] - 62},${HC[1] + 30} ${HC[0] + 66},${HC[1] + 26} ${HC[0] + 64},${HC[1] + 84} Q${HC[0] + 4},${HC[1] + 104} ${HC[0] - 58},${HC[1] + 86} Z`} fill={FUR_DK} stroke={INK} strokeWidth={5} />
        <path d={`M${HC[0] - 30},${HC[1] + 84} Q${HC[0] + 8},${HC[1] + 96} ${HC[0] + 44},${HC[1] + 82}`} stroke={INK} strokeWidth={3} fill="none" opacity={0.6} />
        {/* ---- head ---- */}
        <g transform={`translate(${HC[0] + jx * 0.4} ${HC[1] + jy}) rotate(${tilt}) scale(1.14)`}>
          {/* far ear */}
          <circle cx={-48} cy={-42} r={27} fill="#3a2a1e" stroke={INK} strokeWidth={4} />
          <circle cx={-46} cy={-38} r={14} fill={EAR_IN} opacity={0.8} />
          <path d={geo.skull} fill={faceCol} stroke={INK} strokeWidth={5} />
          {/* spots */}
          {[
            [-34, -8, 9, 7],
            [-16, 22, 7, 6],
            [-46, 18, 8, 6],
            [2, -36, 6, 5],
            [-24, -34, 7, 5],
          ].map(([sx, sy, rx, ry], i) => (
            <ellipse key={i} cx={sx} cy={sy} rx={rx} ry={ry} fill={SPOT} opacity={0.8} />
          ))}
          {/* shiny scalp + the three-strand comb-over */}
          <path d="M-30,-40 q20,-12 40,-8" stroke="#e8d4ac" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.8} />
          <g stroke="#3a2618" strokeWidth={2.6} fill="none" strokeLinecap="round">
            <path d="M-52,-18 C-40,-56 -4,-66 26,-46" />
            <path d="M-54,-10 C-36,-50 0,-62 30,-40" />
            <path d="M-50,-2 C-34,-44 4,-56 34,-34" />
          </g>
          <path d="M-62,-6 l-6,-10 M-58,4 l-8,-6 M-60,-16 l-4,-10" stroke="#3a2618" strokeWidth={3.5} strokeLinecap="round" />
          {/* muzzle */}
          <path d="M24,-14 C60,-24 98,-8 108,16 C112,40 88,54 58,52 C40,50 26,30 24,-14 Z" fill={MUZZLE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          {/* stubble */}
          {[
            [56, 22],
            [64, 30],
            [72, 24],
            [50, 34],
            [80, 34],
            [60, 40],
          ].map(([sx, sy], i) => (
            <circle key={i} cx={sx} cy={sy} r={1.8} fill="#1d140e" />
          ))}
          <path d="M92,-6 C104,-10 116,-2 114,10 C112,20 98,22 90,14 C86,8 86,0 92,-6 Z" fill="#141010" stroke={INK} strokeWidth={3} />
          <ellipse cx={100} cy={-1} rx={5} ry={3} fill="#fff" opacity={0.6} />
          {/* bags + eyes */}
          <path d="M-14,2 q12,10 24,0 M18,4 q16,12 32,0" stroke="#7d6a8c" strokeWidth={5} fill="none" opacity={0.75} strokeLinecap="round" />
          {e.squeeze ? (
            <g stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none">
              <path d="M-12,-24 L4,-14 L-12,-4" />
              <path d="M42,-24 L24,-14 L42,-4" />
            </g>
          ) : (
            <>
              <Eye id={`${id}-eB`} seed={`${id}B`} cx={-2} cy={-16} rx={11} ry={12} look={gaze} pupil={e.pupil} sclera="#ece3c4" veins={2} lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={-e.lidAngle} lidColor={faceCol} sw={4} />
              <Eye id={`${id}-eF`} seed={`${id}F`} cx={30} cy={-14} rx={14} ry={15} look={gaze} pupil={e.pupil} sclera="#ece3c4" veins={3} lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={e.lidAngle} lidColor={faceCol} sw={4} />
            </>
          )}
          {/* sparse brows */}
          {[
            [-2, -16, 11, -1],
            [30, -14, 14, 1],
          ].map(([cx, cy, rx, side], i) => {
            const by = cy - 22 - e.brow * 7;
            const dy = Math.tan((e.browTilt * Math.PI) / 180) * rx * side;
            return (
              <g key={i} stroke="#3a2618" strokeWidth={4} strokeLinecap="round">
                <path d={`M${cx - rx},${by + dy} L${cx - rx * 0.3},${by + dy * 0.3 - 2}`} />
                <path d={`M${cx},${by} L${cx + rx * 0.7},${by - dy * 0.7 - 1}`} />
              </g>
            );
          })}
          {strain > 0.2 ? (
            <g stroke="#7a2d4a" strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={strain}>
              <path d="M-20,-40 l6,-8 l-4,-6 l6,-6" />
              <path d="M40,-38 l-4,-8 l6,-8" />
            </g>
          ) : null}
          {/* mouth */}
          <g transform="rotate(-6 76 42)">
            <Mouth id={`${id}-m`} seed={`${id}m`} x={74} y={42} w={50} maxOpen={40} shape={blow > 0 || sip > 0.5 ? "F" : expr === "strain" ? "B" : mouth} smile={e.smile} teeth="crooked" toothColor="#e2d18a" lip="#2e211a" inside="#2a0d0c" scream={expr === "shocked" ? 1.25 : 1} />
          </g>
          {blower()}
          {/* sweatband */}
          {sweatband ? <path d="M-60,-30 Q0,-56 58,-34" stroke="#e8e4da" strokeWidth={16} fill="none" strokeLinecap="round" /> : null}
          {sweatband ? <path d="M-60,-30 Q0,-56 58,-34" stroke="#c0392b" strokeWidth={4} fill="none" strokeDasharray="8 10" /> : null}
          {/* near ear (behind the hat) */}
          <circle cx={-12} cy={-60} r={29} fill="#3a2a1e" stroke={INK} strokeWidth={4} />
          <circle cx={-10} cy={-56} r={15} fill={EAR_IN} opacity={0.8} />
          <path d="M-24,-82 l-4,-8 M-14,-88 l0,-9 M-2,-86 l4,-8" stroke="#3a2a1e" strokeWidth={3} strokeLinecap="round" />
          {/* the birthday hat (on its elastic) */}
          {hat ? (
            <g transform={`translate(22 0) rotate(${4 + hatTilt} -4 -58)`}>
              <path d="M-36,-56 Q2,-36 30,-60" stroke="#f0ede4" strokeWidth={2} fill="none" />
              <path d="M-34,-58 L-6,-152 L26,-60 Z" fill={HAT} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
              {[
                [-14, -80],
                [8, -76],
                [-4, -104],
                [10, -122],
                [-18, -64],
                [16, -100],
              ].map(([hx, hy], i) => (
                <circle key={i} cx={hx} cy={hy} r={5} fill={HAT_DOT} />
              ))}
              <path d="M-34,-58 Q-4,-50 26,-60" stroke={INK} strokeWidth={4} fill="none" />
              <path d={blob(-6, -156, 13, 11, 8, 0.4, id + "pom")} fill="#f08ab0" stroke={INK} strokeWidth={3} />
            </g>
          ) : null}
          {hat ? <path d="M-14,-56 C-42,-36 -58,2 -50,34 C-44,52 -30,62 -12,66" stroke="#f0ede4" strokeWidth={1.6} fill="none" opacity={0.55} /> : null}
          {strain > 0.3
            ? [0, 1].map((i) => {
                const ph = (t * 0.9 + i * 0.5) % 1;
                return <ellipse key={i} cx={i ? 60 : -50} cy={-30 + ph * 60} rx={5} ry={8} fill="#bfe3f2" stroke={INK} strokeWidth={2.2} opacity={1 - ph} />;
              })
            : null}
        </g>
        {/* front arm (+ the beer) */}
        {sleeve(aF, false)}
        {paw(aF, false, "pF", beer)}
      </g>
    </g>
  );
};


