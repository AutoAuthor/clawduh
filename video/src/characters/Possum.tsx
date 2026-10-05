import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import type { MouthShape } from "../engine/timeline";
import { Pt, blob, limb, onN, rnd, smoothPath } from "../engine/util";
import { DLine, Eye, Flies, INK, Mouth, Shadow, StinkLines, blinkAmount, saccade, taperPath } from "./parts";

/**
 * DALE — the sickly possum line cook who just wants to go home early.
 * Grey fur, white face gone green around the gills, bare pink tail poking out of uniform khakis,
 * a paper hat between round black ears, bags under beady eyes and a mouth full of needle teeth.
 * Faces right by default. Origin = floor between the feet.
 */

export type DaleExpr = "neutral" | "sick" | "confused" | "pleading" | "scared" | "strain" | "relieved" | "hopeful" | "sad" | "angry" | "scheme";

export interface DaleProps {
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
  expr?: DaleExpr;
  look?: Pt;
  headTilt?: number;
  /** 0..1 green around the gills */
  sick?: number;
  /** 0..1 pushing: red face, veins, trembling, bent knees */
  strain?: number;
  /** 0..1 the stain spreading across the seat of his khakis */
  soiled?: number;
  /** [shoulder, elbow] degrees, 0 = hanging down, + = forward */
  armF?: [number, number];
  armB?: [number, number];
  spatula?: boolean;
  flies?: number;
  /** 0..1 belly rumble */
  rumble?: number;
}

const FUR = "#a19c97";
const FUR_DK = "#5f5a58";
const FACE = "#ede7da";
const PINK = "#e7a3a8";
const PINK_DK = "#c77880";
const EAR = "#211c1e";
const KHAKI = "#c9b07e";
const KHAKI_DK = "#a28a5b";
const POLO = "#b23a2f";
const POLO_DK = "#862820";
const STAIN = "#6b4a1e";

const EXPR: Record<DaleExpr, { lidTop: number; lidBottom: number; lidAngle: number; pupil: number; smile: number; brow: number; browTilt: number }> = {
  neutral: { lidTop: 0.24, lidBottom: 0.1, lidAngle: 0, pupil: 0.34, smile: 0, brow: 0, browTilt: 0 },
  sick: { lidTop: 0.5, lidBottom: 0.2, lidAngle: -10, pupil: 0.3, smile: -0.45, brow: 0.7, browTilt: -16 },
  confused: { lidTop: 0.08, lidBottom: 0.04, lidAngle: 0, pupil: 0.24, smile: -0.25, brow: 1, browTilt: 0 },
  pleading: { lidTop: 0.02, lidBottom: 0.14, lidAngle: -16, pupil: 0.44, smile: -0.35, brow: 1.4, browTilt: -22 },
  scared: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.18, smile: -0.5, brow: 1.5, browTilt: -12 },
  strain: { lidTop: 1, lidBottom: 0, lidAngle: 0, pupil: 0.3, smile: -0.7, brow: -1, browTilt: 26 },
  relieved: { lidTop: 0.56, lidBottom: 0.16, lidAngle: -6, pupil: 0.3, smile: 0.3, brow: 0.3, browTilt: -8 },
  hopeful: { lidTop: 0, lidBottom: 0.1, lidAngle: -12, pupil: 0.5, smile: 0.45, brow: 1.2, browTilt: -14 },
  sad: { lidTop: 0.44, lidBottom: 0.1, lidAngle: -18, pupil: 0.34, smile: -0.6, brow: 1, browTilt: -24 },
  angry: { lidTop: 0.3, lidBottom: 0.14, lidAngle: 20, pupil: 0.22, smile: -0.45, brow: -1, browTilt: 24 },
  scheme: { lidTop: 0.34, lidBottom: 0.22, lidAngle: 16, pupil: 0.18, smile: 0.85, brow: -0.7, browTilt: 20 },
};

export const DALE_HEAD: Pt = [14, -402];

export const Possum: React.FC<DaleProps> = ({
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
  expr = "sick",
  look,
  headTilt = 0,
  sick = 0.6,
  strain = 0,
  soiled = 0,
  armF = [10, 30],
  armB = [-8, 14],
  spatula = true,
  flies = 2,
  rumble = 0,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const shakeAmt = strain * 5;
  const jx = strain > 0 ? (rnd(`${id}jx${f2}`) - 0.5) * 2 * shakeAmt : 0;
  const jy = strain > 0 ? (rnd(`${id}jy${f2}`) - 0.5) * 2 * shakeAmt : 0;
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 7 + energy * 3 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.9 : 0.3), 2) * (talking ? 6 : 2.5);
  const blink = expr === "strain" ? 0 : blinkAmount(t, id, 2.9);
  const dart = saccade(t, id, expr === "scared" ? 0.3 : 0.12, 0.9);
  const gaze: Pt = [(look?.[0] ?? 0.4) + dart[0], (look?.[1] ?? 0) + dart[1]];
  const squat = strain * 26;
  const belly = rumble > 0 ? Math.max(0, Math.sin(t * 9)) * rumble * 10 : 0;

  const faceCol = mixHex(mixHex(FACE, "#bcd28c", sick), "#d95b69", strain * 0.85);
  const furCol = mixHex(FUR, "#93a07a", sick * 0.4);

  const geo = useMemo(
    () => ({
      back: blob(-26, -12, 72, 60, 12, 0.06, id + "back"),
      face: blob(16, 6, 66, 58, 12, 0.05, id + "face"),
      seat: smoothPath(
        [
          [-60, -150],
          [56, -150],
          [58, -96],
          [10, -78],
          [-50, -84],
          [-74, -112],
        ],
        true,
        0.7,
      ),
    }),
    [id],
  );

  // legs (knees bend when straining)
  const kneeF: Pt = [26 + squat * 0.6, -86 + squat * 0.4];
  const kneeB: Pt = [-30 + squat * 0.5, -86 + squat * 0.4];
  const legF = taperPath([[22, -140 + squat], kneeF, [30, -22]], 58, 46);
  const legB = taperPath([[-26, -140 + squat], kneeB, [-34, -22]], 58, 46);

  const sway = noise2D(id + "tail", t2 * 0.5, 0) * 12;
  const tailPts: Pt[] = [
    [-62, -116 + squat],
    [-112, -92 + squat * 0.6],
    [-146 + sway * 0.4, -36],
    [-130 + sway, -6],
    [-90 + sway, -8],
    [-78 + sway * 0.6, -30],
  ];

  const bodyY = squat;
  const shF: Pt = [34, -300 + bodyY];
  const shB: Pt = [-38, -300 + bodyY];
  const aF = limb(shF, armF, [92, 88]);
  const aB = limb(shB, armB, [92, 88]);

  const hand = (pts: Pt[], hold: boolean, key: string) => {
    const end = pts[2];
    const prev = pts[1];
    const a = Math.atan2(end[0] - prev[0], end[1] - prev[1]);
    const fingers = [-0.5, -0.17, 0.17, 0.5].map((da, i) => {
      const r = a + da;
      const l = i === 1 || i === 2 ? 30 : 24;
      return `M${end[0]},${end[1]} L${end[0] + Math.sin(r) * l},${end[1] + Math.cos(r) * l}`;
    });
    return (
      <g key={key}>
        {hold ? (
          <g transform={`translate(${end[0]} ${end[1]}) rotate(${(-a * 180) / Math.PI})`}>
            <rect x={-7} y={-6} width={14} height={60} rx={5} fill="#7a4b2a" stroke={INK} strokeWidth={4} />
            <rect x={-4} y={52} width={8} height={30} fill="#9a9a98" stroke={INK} strokeWidth={3} />
            <path d="M-34,80 L34,80 L30,150 L-30,150 Z" fill="#bfc2c4" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <path d="M-20,96 L20,96 M-20,112 L20,112 M-20,128 L20,128" stroke="#8b8f92" strokeWidth={3} />
            <path d="M-26,146 Q0,156 26,146" stroke="#3a2a1a" strokeWidth={5} fill="none" opacity={0.7} />
          </g>
        ) : null}
        <path d={fingers.join(" ")} stroke={INK} strokeWidth={12} strokeLinecap="round" />
        <path d={fingers.join(" ")} stroke={PINK} strokeWidth={6} strokeLinecap="round" />
        <circle cx={end[0]} cy={end[1]} r={13} fill={PINK} stroke={INK} strokeWidth={4} />
      </g>
    );
  };

  const sleeve = (pts: Pt[]) => {
    const p = [pts[0], [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.42, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.42] as Pt];
    return <path d={taperPath(p, 46, 38)} fill={POLO} stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
  };

  const torso = smoothPath(
    [
      [-56, -146 + bodyY],
      [58, -146 + bodyY],
      [80 + belly, -204 + bodyY],
      [62, -282 + bodyY],
      [44, -318 + bodyY],
      [16, -336 + bodyY],
      [-16, -336 + bodyY],
      [-48, -314 + bodyY],
      [-62, -248 + bodyY],
    ],
    true,
    0.62,
  );

  // stain on the seat of the khakis + a drip down the back leg
  const stainR = 10 + soiled * 52;
  const head: Pt = [DALE_HEAD[0], DALE_HEAD[1] + bodyY + bob * 0.5];
  const s = flip ? -scale : scale;

  return (
    <g transform={`translate(${x + jx} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={0} cy={4} rx={110} o={0.35} />
      {/* tail (behind everything) */}
      <path d={taperPath(tailPts, 22, 6)} fill={PINK} stroke={INK} strokeWidth={4} />
      {[1, 2, 3].map((i) => {
        const p = tailPts[i];
        return <path key={i} d={`M${p[0] - 8},${p[1] - 4} q8,4 16,0`} stroke={PINK_DK} strokeWidth={3} fill="none" />;
      })}
      {/* back arm */}
      <DLine d={smoothPath(aB, false, 0.6)} w={20} color={mixHex(furCol, "#000000", 0.15)} ow={4.5} />
      {hand(aB, false, "hB")}
      {sleeve(aB)}
      {/* legs + feet */}
      {[legB, legF].map((d, i) => (
        <path key={i} d={d} fill={i === 0 ? KHAKI_DK : KHAKI} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      ))}
      <path d={`M${kneeF[0] - 6},${kneeF[1] - 26} q10,22 2,46`} stroke={KHAKI_DK} strokeWidth={3} fill="none" />
      {[-34, 30].map((fx, i) => (
        <g key={i} transform={`translate(${fx} -14)`}>
          <path d="M-14,-6 C-6,-14 30,-12 46,2 C48,10 36,16 -10,14 C-18,10 -18,0 -14,-6 Z" fill={PINK} stroke={INK} strokeWidth={4} />
          <path d="M22,6 l14,8 M14,9 l10,8 M30,2 l16,4" stroke={PINK_DK} strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
      {/* seat of the pants (+ the stain) */}
      <g transform={`translate(0 ${squat})`}>
        <defs>
          <clipPath id={`${id}-seat`}>
            <path d={geo.seat} />
          </clipPath>
        </defs>
        <path d={geo.seat} fill={KHAKI} stroke={INK} strokeWidth={5} />
        {soiled > 0 ? (
          <g clipPath={`url(#${id}-seat)`}>
            <path d={blob(-58, -104, stainR, stainR * 0.8, 9, 0.22, id + "stain")} fill={STAIN} opacity={0.88} />
            <path d={blob(-48, -98, stainR * 0.55, stainR * 0.45, 7, 0.25, id + "stain2")} fill="#4f3412" opacity={0.7} />
          </g>
        ) : null}
        {soiled > 0.45 ? <path d={`M-40,-82 q-6,${30 * soiled} 2,${58 * soiled}`} stroke={STAIN} strokeWidth={10 * soiled} strokeLinecap="round" fill="none" opacity={0.85} /> : null}
      </g>
      {/* belt */}
      <path d={`M-58,${-152 + bodyY} Q0,${-142 + bodyY} 60,${-150 + bodyY}`} stroke="#4a2f1c" strokeWidth={13} fill="none" strokeLinecap="round" />
      <rect x={30} y={-160 + bodyY} width={20} height={17} rx={3} fill="#d9b44a" stroke={INK} strokeWidth={3} />
      {/* torso: red uniform polo, half untucked */}
      <path d={torso} fill={POLO} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M24,${-150 + bodyY} L66,${-156 + bodyY} L62,${-132 + bodyY} L30,${-128 + bodyY} Z`} fill={POLO} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M-40,${-300 + bodyY} q-10,60 4,130`} stroke={POLO_DK} strokeWidth={5} fill="none" />
      {/* collar, placket, name tag */}
      <path d={`M-14,${-334 + bodyY} L4,${-306 + bodyY} L14,${-334 + bodyY} M14,${-334 + bodyY} L24,${-306 + bodyY} L40,${-326 + bodyY}`} fill="#d84a3c" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M14,${-306 + bodyY} L14,${-266 + bodyY}`} stroke={POLO_DK} strokeWidth={4} />
      <circle cx={14} cy={-292 + bodyY} r={3.5} fill="#efe6d0" />
      <circle cx={14} cy={-276 + bodyY} r={3.5} fill="#efe6d0" />
      <g transform={`translate(${-50} ${-262 + bodyY}) rotate(-4)`}>
        <rect x={0} y={0} width={56} height={24} rx={5} fill="#e9cb45" stroke={INK} strokeWidth={3} />
        <g transform={flip ? "translate(56 0) scale(-1 1)" : undefined}>
          <text x={28} y={18} textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontWeight={900} fontSize={16} fill={INK}>
            DALE
          </text>
        </g>
      </g>
      {belly > 2 ? (
        <g stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round">
          <path d={`M${92 + belly},${-220 + bodyY} q8,6 0,12`} />
          <path d={`M${100 + belly},${-198 + bodyY} q8,6 0,12`} />
        </g>
      ) : null}
      {/* neck */}
      <path d={`M4,${-330 + bodyY} L10,${-372 + bodyY}`} stroke={INK} strokeWidth={36} strokeLinecap="round" />
      <path d={`M4,${-330 + bodyY} L10,${-372 + bodyY}`} stroke={furCol} strokeWidth={26} strokeLinecap="round" />
      {/* head */}
      <g transform={`translate(${head[0] + jx * 0.6} ${head[1] + jy}) rotate(${tilt})`}>
        {/* ears */}
        <circle cx={-64} cy={-44} r={27} fill={EAR} stroke={INK} strokeWidth={4} />
        <circle cx={-62} cy={-40} r={13} fill={PINK_DK} opacity={0.6} />
        <circle cx={42} cy={-58} r={29} fill={EAR} stroke={INK} strokeWidth={4} />
        <circle cx={44} cy={-54} r={14} fill={PINK_DK} opacity={0.6} />
        <path d={geo.back} fill={FUR_DK} stroke={INK} strokeWidth={5} />
        <path d={geo.face} fill={faceCol} stroke={INK} strokeWidth={5} />
        {/* paper hat */}
        <g transform="rotate(-8 -4 -74)">
          <path d="M-42,-58 L30,-70 L24,-92 Q-8,-106 -36,-80 Z" fill="#f4f1e8" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M-40,-62 L29,-74" stroke="#c0392b" strokeWidth={7} />
          <path d="M-10,-100 L-4,-64" stroke="#c9c4b4" strokeWidth={3} />
        </g>
        {/* snout */}
        <path d="M44,-20 C94,-24 134,-8 158,10 C160,28 128,42 64,46 C52,30 46,8 44,-20 Z" fill={faceCol} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M70,-12 q30,4 52,18" stroke={mixHex(faceCol, "#000000", 0.12)} strokeWidth={4} fill="none" />
        <circle cx={157} cy={12} r={15} fill="#e58a95" stroke={INK} strokeWidth={4} />
        <circle cx={152} cy={6} r={4.5} fill="#fff" opacity={0.75} />
        {/* bags under the eyes */}
        <path d="M-2,-6 q16,12 32,0 M40,0 q18,14 36,0" stroke="#8a7a98" strokeWidth={5 + sick * 3} fill="none" strokeLinecap="round" opacity={0.6 + sick * 0.3} />
        {expr === "strain" ? (
          <g stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none">
            <path d="M2,-36 L22,-24 L2,-12" />
            <path d="M74,-38 L52,-26 L74,-14" />
            <path d="M-2,-46 l10,-6 M80,-48 l-10,-6" strokeWidth={4} />
          </g>
        ) : (
          <>
            <Eye
              id={`${id}-eF`}
              seed={`${id}F`}
              cx={14}
              cy={-24}
              rx={14}
              ry={17}
              look={gaze}
              pupil={e.pupil}
              lidTop={Math.max(e.lidTop, blink)}
              lidBottom={e.lidBottom}
              lidAngle={-e.lidAngle}
              lidColor={faceCol}
              sw={4}
              veins={sick > 0.7 ? 2 : 0}
            />
            <Eye
              id={`${id}-eN`}
              seed={`${id}N`}
              cx={58}
              cy={-22}
              rx={17}
              ry={20}
              look={gaze}
              pupil={e.pupil}
              lidTop={Math.max(e.lidTop * (expr === "confused" ? 0.2 : 1), blink)}
              lidBottom={e.lidBottom}
              lidAngle={e.lidAngle}
              lidColor={faceCol}
              sw={4}
              veins={sick > 0.7 ? 3 : 0}
            />
          </>
        )}
        {/* brows */}
        {[
          [14, -24, 14, -1],
          [58, -22, 17, 1],
        ].map(([cx, cy, rx, side], i) => {
          const by = cy - 26 - e.brow * 7 - (expr === "confused" && i === 1 ? 10 : 0);
          const tiltK = e.browTilt * (expr === "confused" ? (i === 0 ? 0.8 : -0.8) : 1);
          const inner = side > 0 ? cx - rx : cx + rx;
          const outer = side > 0 ? cx + rx : cx - rx;
          const dy = Math.tan((tiltK * Math.PI) / 180) * rx;
          return <path key={i} d={`M${inner},${by + dy} L${outer},${by - dy}`} stroke={FUR_DK} strokeWidth={6} strokeLinecap="round" />;
        })}
        {/* veins + sweat when straining or sick */}
        {strain > 0.2 ? (
          <g stroke="#7a2d6a" strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={strain}>
            <path d="M26,-50 l6,-8 l-4,-6 l6,-6" />
            <path d="M-20,-30 l-6,-8 l4,-8" />
          </g>
        ) : null}
        {sick > 0.3 || strain > 0.3
          ? [0, 1].map((i) => {
              const ph = (t * 0.8 + i * 0.5) % 1;
              return <ellipse key={i} cx={i ? 88 : -38} cy={-40 + ph * 70} rx={6} ry={9} fill="#bfe3f2" stroke={INK} strokeWidth={2.5} opacity={1 - ph} />;
            })
          : null}
        {/* whiskers */}
        <g stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.85}>
          <path d="M120,22 L176,4 M122,28 L182,28 M118,34 L170,52" />
        </g>
        <g transform="rotate(-6 114 36)">
          <Mouth id={`${id}-mouth`} seed={`${id}m`} x={114} y={36} w={52} maxOpen={40} shape={expr === "strain" ? "B" : mouth} smile={e.smile} teeth="crooked" toothColor="#f2ecd2" lip="#9b7b7b" fangs />
        </g>
      </g>
      {/* front arm */}
      <DLine d={smoothPath(aF, false, 0.6)} w={20} color={furCol} ow={4.5} />
      {hand(aF, spatula, "hF")}
      {sleeve(aF)}
      {flies > 0 ? <Flies cx={head[0] + 40} cy={head[1] - 140} count={flies} t={t} r={150} seed={id + "fly"} /> : null}
      {soiled > 0.5 ? <StinkLines x={-60} y={-130} t={t} n={3} h={170} color="#8fae4a" /> : null}
      {soiled > 0.5 ? <Flies cx={-60} cy={-110} count={3} t={t + 3} r={70} seed={id + "sfly"} /> : null}
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
