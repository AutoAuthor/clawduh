import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import type { MouthShape } from "../engine/timeline";
import { Pt, blob, limb, onN, smoothPath } from "../engine/util";
import { DLine, Eye, INK, Mouth, Shadow, blinkAmount, saccade, taperPath } from "./parts";
import { mixHex } from "./Possum";

/**
 * CHET — the raccoon bro working the fryer.
 * Barrel body in a uniform polo with the sleeves ripped off, gold chain, backwards cap,
 * khaki cargo shorts, a bushy ringed tail and a bucket-sized MEGA SIP he never puts down.
 * Faces right by default. Origin = floor between the feet.
 */

export type ChetExpr = "smug" | "deadpan" | "serious" | "whisper" | "gag" | "shocked" | "laugh" | "defensive" | "disgust" | "horrified";

export interface ChetProps {
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
  expr?: ChetExpr;
  look?: Pt;
  headTilt?: number;
  /** 0..1 cup up to the mouth, sipping */
  drink?: number;
  /** [shoulder, elbow] — the cup hand / the free hand */
  armF?: [number, number];
  armB?: [number, number];
  cup?: boolean;
  /** 0..1 lean the whole body back (recoil) */
  recoil?: number;
}

const FUR = "#8e8a88";
const FUR_DK = "#5d5957";
const WHITE = "#e9e5dc";
const MASK = "#1d191a";
const KHAKI = "#c4ab78";
const KHAKI_DK = "#9c8455";
const POLO = "#b23a2f";

const EXPR: Record<ChetExpr, { lidTop: number; lidBottom: number; lidAngle: number; pupil: number; smile: number; brow: number; browTilt: number }> = {
  smug: { lidTop: 0.45, lidBottom: 0.12, lidAngle: -6, pupil: 0.2, smile: 0.55, brow: -0.2, browTilt: 10 },
  deadpan: { lidTop: 0.5, lidBottom: 0.15, lidAngle: 0, pupil: 0.18, smile: 0, brow: 0, browTilt: 0 },
  serious: { lidTop: 0.3, lidBottom: 0.12, lidAngle: 12, pupil: 0.18, smile: -0.15, brow: -0.5, browTilt: 16 },
  whisper: { lidTop: 0.2, lidBottom: 0.1, lidAngle: -4, pupil: 0.16, smile: 0.25, brow: 0.9, browTilt: -8 },
  gag: { lidTop: 1, lidBottom: 0, lidAngle: 0, pupil: 0.2, smile: -0.8, brow: -1, browTilt: 24 },
  shocked: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.12, smile: -0.4, brow: 1.6, browTilt: -6 },
  laugh: { lidTop: 1, lidBottom: 0, lidAngle: 0, pupil: 0.2, smile: 0.9, brow: 0.6, browTilt: -10 },
  defensive: { lidTop: 0.1, lidBottom: 0.06, lidAngle: -10, pupil: 0.18, smile: -0.2, brow: 1.3, browTilt: -16 },
  disgust: { lidTop: 0.55, lidBottom: 0.3, lidAngle: 14, pupil: 0.16, smile: -0.7, brow: -0.6, browTilt: 22 },
  horrified: { lidTop: 0, lidBottom: 0.1, lidAngle: -8, pupil: 0.1, smile: -0.7, brow: 1.8, browTilt: -18 },
};

export const CHET_HEAD: Pt = [18, -372];

export const Raccoon: React.FC<ChetProps> = ({
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
  expr = "smug",
  look,
  headTilt = 0,
  drink = 0,
  armF = [10, 40],
  armB = [-10, 20],
  cup = true,
  recoil = 0,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 6 + energy * 3 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 1 : 0.3), 3) * (talking ? 6 : 2) - recoil * 14;
  const squeezed = expr === "gag" || expr === "laugh";
  const blink = squeezed ? 0 : blinkAmount(t, id, 3.4);
  const dart = saccade(t, id, 0.1, 1.2);
  const gaze: Pt = [(look?.[0] ?? 0.4) + dart[0], (look?.[1] ?? 0) + dart[1]];
  const tailSwish = Math.sin(t2 * 2.6) * 10 + noise2D(id + "tail", t2 * 0.6, 1) * 8;
  const lean = -recoil * 12;

  const geo = useMemo(
    () => ({
      head: blob(0, 0, 94, 80, 14, 0.04, id + "head"),
      muzzle: blob(70, 30, 62, 40, 10, 0.05, id + "muzzle"),
    }),
    [id],
  );

  const shF: Pt = [60, -292];
  const shB: Pt = [-64, -292];
  // sipping lifts the cup arm to the face
  const aFang: [number, number] = [armF[0] + (26 - armF[0]) * drink, armF[1] + (154 - armF[1]) * drink];
  const aF = limb(shF, aFang, [80, 76]);
  const aB = limb(shB, armB, [80, 76]);
  const head: Pt = [CHET_HEAD[0], CHET_HEAD[1] + bob * 0.5];
  const mouthPt: Pt = [head[0] + 92, head[1] + 50];

  const tailPts: Pt[] = [
    [-70, -118],
    [-138, -112],
    [-196 + tailSwish * 0.3, -150],
    [-226 + tailSwish, -208],
    [-214 + tailSwish * 1.2, -252],
  ];

  const hand = (end: Pt, key: string) => (
    <g key={key}>
      <circle cx={end[0]} cy={end[1]} r={19} fill={MASK} stroke={INK} strokeWidth={4} />
      <path d={`M${end[0] - 12},${end[1] + 8} l-6,14 M${end[0] - 2},${end[1] + 14} l-2,16 M${end[0] + 9},${end[1] + 10} l4,14`} stroke={MASK} strokeWidth={8} strokeLinecap="round" />
    </g>
  );

  const cupAt = aF[2];
  const lid: Pt = [cupAt[0] + 4, cupAt[1] - 70];
  const strawTip: Pt = drink > 0.3 ? [mouthPt[0] - 6, mouthPt[1] - 4] : [lid[0] + 26, lid[1] - 64];
  const strawMid: Pt = [lid[0] + (strawTip[0] - lid[0]) * 0.4 + 10, Math.min(lid[1], strawTip[1]) - 30];

  const s = flip ? -scale : scale;
  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={0} cy={4} rx={130} o={0.35} />
      <g transform={`rotate(${lean} 0 -40)`}>
        {/* bushy ringed tail */}
        <path d={taperPath(tailPts, 64, 34)} fill={FUR} stroke={INK} strokeWidth={5} />
        {[0.25, 0.45, 0.65, 0.85].map((k, i) => {
          const idx = k * (tailPts.length - 1);
          const a = tailPts[Math.floor(idx)];
          const b = tailPts[Math.min(tailPts.length - 1, Math.floor(idx) + 1)];
          const f = idx - Math.floor(idx);
          const p: Pt = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
          return <ellipse key={i} cx={p[0]} cy={p[1]} rx={30 - i * 4} ry={11} fill={MASK} transform={`rotate(${-40 + i * 12} ${p[0]} ${p[1]})`} />;
        })}
        {/* back arm */}
        <DLine d={smoothPath(aB, false, 0.6)} w={30} color={FUR_DK} ow={4.5} />
        {hand(aB[2], "hB")}
        {/* legs + feet */}
        {[-30, 34].map((lx, i) => (
          <g key={i}>
            <path d={`M${lx},-90 L${lx + 2},-18`} stroke={INK} strokeWidth={38} strokeLinecap="round" />
            <path d={`M${lx},-90 L${lx + 2},-18`} stroke={i ? FUR : FUR_DK} strokeWidth={28} strokeLinecap="round" />
            <path d={`M${lx - 16},-10 C${lx - 8},-24 ${lx + 30},-22 ${lx + 40},-6 C${lx + 38},4 ${lx - 12},4 ${lx - 16},-10 Z`} fill={MASK} stroke={INK} strokeWidth={4} />
          </g>
        ))}
        {/* cargo shorts */}
        <path d="M-82,-156 L84,-156 L92,-96 L46,-84 L14,-112 L-14,-84 L-74,-92 Z" fill={KHAKI} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={52} y={-136} width={30} height={28} rx={4} fill={KHAKI_DK} stroke={INK} strokeWidth={3} />
        <path d="M-60,-150 l-6,52" stroke={KHAKI_DK} strokeWidth={3} />
        {/* furry belly peeking under a too-small shirt */}
        <path d="M-70,-150 Q8,-128 86,-152 L90,-176 L-72,-176 Z" fill={mixHex(FUR, WHITE, 0.4)} stroke={INK} strokeWidth={4} />
        <path d="M2,-160 q3,4 0,8" stroke={INK} strokeWidth={3} fill="none" />
        {/* polo with the sleeves ripped off */}
        <path
          d={smoothPath(
            [
              [-78, -170],
              [92, -172],
              [106, -232],
              [84, -292],
              [52, -316],
              [-58, -316],
              [-86, -282],
              [-90, -222],
            ],
            true,
            0.6,
          )}
          fill={POLO}
          stroke={INK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <path d="M-78,-170 l10,8 l8,-8 l10,8 l10,-8 l10,8 l12,-8 l12,8 l12,-8 l12,8 l12,-8 l14,8 l12,-8 l12,8 l10,-8" stroke={INK} strokeWidth={3} fill="none" opacity={0.6} />
        {/* gold chain */}
        <path d="M-40,-316 Q10,-262 66,-312" stroke="#e1b93f" strokeWidth={9} fill="none" strokeDasharray="10 5" />
        <path d="M-40,-316 Q10,-262 66,-312" stroke={INK} strokeWidth={1.5} fill="none" opacity={0.5} />
        {/* ragged armholes */}
        <path d="M78,-300 l8,8 l-2,10 l8,8 M-82,-296 l-8,8 l2,10 l-6,8" stroke={INK} strokeWidth={3} fill="none" />
        {/* head */}
        <g transform={`translate(${head[0]} ${head[1]}) rotate(${tilt})`}>
          {/* ears */}
          {[
            [-54, -66, -12],
            [40, -74, 12],
          ].map(([ex, ey, rot], i) => (
            <g key={i} transform={`rotate(${rot} ${ex} ${ey})`}>
              <ellipse cx={ex} cy={ey} rx={25} ry={28} fill={FUR} stroke={INK} strokeWidth={5} />
              <ellipse cx={ex} cy={ey + 4} rx={13} ry={16} fill={MASK} />
              <path d={`M${ex - 20},${ey - 10} Q${ex},${ey - 34} ${ex + 20},${ey - 10}`} stroke={WHITE} strokeWidth={6} fill="none" />
            </g>
          ))}
          <path d={geo.head} fill={FUR} stroke={INK} strokeWidth={6} />
          {/* backwards cap */}
          <path d="M-74,-50 C-70,-104 46,-112 62,-56 Z" fill={POLO} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M-70,-52 L-126,-36 L-118,-24 L-66,-38 Z" fill="#8a2a22" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M20,-62 q12,-12 24,0" stroke={INK} strokeWidth={4} fill="#e9e5dc" />
          {/* white brows */}
          {[
            [6, -30, -1],
            [62, -28, 1],
          ].map(([bx, by, side], i) => {
            const yy = by - 22 - e.brow * 7;
            const dy = Math.tan((e.browTilt * Math.PI) / 180) * 18 * side;
            return <path key={i} d={`M${bx - 20},${yy - dy} Q${bx},${yy - 10} ${bx + 20},${yy + dy}`} stroke={WHITE} strokeWidth={11} strokeLinecap="round" fill="none" />;
          })}
          {/* bandit mask */}
          <path d="M-82,-28 C-60,-58 20,-52 34,-34 C52,-58 106,-52 112,-24 C100,6 60,6 38,-6 C24,10 -20,14 -44,0 C-60,-6 -76,-12 -82,-28 Z" fill={MASK} stroke={INK} strokeWidth={4} />
          {squeezed ? (
            expr === "laugh" ? (
              <g stroke={WHITE} strokeWidth={7} strokeLinecap="round" fill="none">
                <path d="M-6,-24 Q8,-40 22,-24" />
                <path d="M50,-24 Q64,-40 78,-24" />
              </g>
            ) : (
              <g stroke={WHITE} strokeWidth={7} strokeLinecap="round" fill="none">
                <path d="M-6,-36 L14,-24 L-6,-12" />
                <path d="M80,-36 L58,-24 L80,-12" />
              </g>
            )
          ) : (
            <>
              <Eye id={`${id}-eF`} seed={`${id}F`} cx={8} cy={-24} rx={16} ry={14} look={gaze} pupil={e.pupil} lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={-e.lidAngle} lidColor={MASK} sw={4} />
              <Eye id={`${id}-eN`} seed={`${id}N`} cx={64} cy={-24} rx={18} ry={16} look={gaze} pupil={e.pupil} lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={e.lidAngle} lidColor={MASK} sw={4} />
            </>
          )}
          {/* white muzzle + snout */}
          <path d={geo.muzzle} fill={WHITE} stroke={INK} strokeWidth={4} />
          <path d="M90,4 C120,0 146,8 150,20 C146,34 120,36 96,34 Z" fill={WHITE} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <ellipse cx={148} cy={14} rx={15} ry={12} fill={MASK} stroke={INK} strokeWidth={3} />
          <circle cx={143} cy={9} r={3.5} fill="#fff" opacity={0.7} />
          {expr === "disgust" || expr === "gag" ? <path d="M104,-4 q8,-8 16,0 M116,-8 q8,-8 16,0" stroke={INK} strokeWidth={3} fill="none" /> : null}
          <g stroke={INK} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.8}>
            <path d="M118,30 L168,22 M118,36 L170,42" />
          </g>
          <Mouth
            id={`${id}-mouth`}
            seed={`${id}m`}
            x={92}
            y={50}
            w={58}
            maxOpen={44}
            shape={drink > 0.5 ? "F" : expr === "gag" ? "H" : mouth}
            smile={e.smile}
            teeth="flat"
            toothColor="#f1ead0"
            lip="#6f6260"
            scream={expr === "horrified" || expr === "shocked" ? 1.25 : 1}
          />
        </g>
        {/* front arm (+ the cup) */}
        <DLine d={smoothPath(aF, false, 0.6)} w={30} color={FUR} ow={4.5} />
        {cup ? (
          <g>
            <path d={`M${lid[0]},${lid[1]} Q${strawMid[0]},${strawMid[1]} ${strawTip[0]},${strawTip[1]}`} stroke={INK} strokeWidth={13} fill="none" strokeLinecap="round" />
            <path d={`M${lid[0]},${lid[1]} Q${strawMid[0]},${strawMid[1]} ${strawTip[0]},${strawTip[1]}`} stroke="#e14b8a" strokeWidth={7} fill="none" strokeLinecap="round" />
            <path
              d={`M${cupAt[0] - 46},${cupAt[1] - 70} L${cupAt[0] + 54},${cupAt[1] - 70} L${cupAt[0] + 40},${cupAt[1] + 110} L${cupAt[0] - 32},${cupAt[1] + 110} Z`}
              fill="#f2efe6"
              stroke={INK}
              strokeWidth={5}
              strokeLinejoin="round"
            />
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M${cupAt[0] - 40 + i * 30},${cupAt[1] - 70} L${cupAt[0] - 24 + i * 30},${cupAt[1] - 70} L${cupAt[0] - 18 + i * 25},${cupAt[1] + 110} L${cupAt[0] - 30 + i * 25},${cupAt[1] + 110} Z`}
                fill="#c8372e"
              />
            ))}
            <rect x={cupAt[0] - 52} y={cupAt[1] - 82} width={112} height={16} rx={6} fill="#e9e5dc" stroke={INK} strokeWidth={4} />
            <rect x={cupAt[0] - 34} y={cupAt[1] + 4} width={76} height={34} rx={6} fill="#f2c94c" stroke={INK} strokeWidth={3} transform={`rotate(-4 ${cupAt[0]} ${cupAt[1] + 20})`} />
            <g transform={flip ? `translate(${2 * (cupAt[0] + 4)} 0) scale(-1 1)` : undefined}>
            <text
              x={cupAt[0] + 4}
              y={cupAt[1] + 27}
              textAnchor="middle"
              fontFamily="Arial Black, Arial, Helvetica, sans-serif"
              fontWeight={900}
              fontSize={17}
              fill={INK}
              transform={`rotate(-4 ${cupAt[0]} ${cupAt[1] + 20})`}
            >
              MEGA SIP
            </text>
            </g>
          </g>
        ) : null}
        {hand(aF[2], "hF")}
      </g>
    </g>
  );
};
