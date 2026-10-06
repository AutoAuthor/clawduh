import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { Pt, blob, limb, onN, smoothPath } from "../../../engine/util";
import { DLine, Eye, INK, Shadow, blinkAmount, saccade, taperPath } from "../../../characters/parts";

/**
 * MAMA — owner of the couch, the house and Duane.
 * A squat old hyena in a floral muumuu cut from the same fabric as the couch, ears poking through a lilac satin
 * bonnet, a sleep mask shoved up on her forehead, penciled brows, coral lipstick, a mole with a hair in it,
 * gold hoops, a long-ash menthol and the cordless phone. Never speaks. Always watching.
 * Faces right by default. Origin = floor between her slippers.
 */

export type MamaExpr = "glare" | "shock" | "smug";

export interface MamaProps {
  id: string;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  t: number;
  frame: number;
  expr?: MamaExpr;
  look?: Pt;
  /** 0..1 length of the cigarette ash (it falls when it gets long) */
  ash?: number;
  phone?: boolean;
  /** far arm: on the hip (default) or pointing ([shoulder, elbow]) */
  armB?: [number, number];
}

const FUR = "#b39672";
const FUR_DK = "#8a704e";
const SPOT = "#5e4430";
const MUZZLE = "#4a3427";
const BONNET = "#b79ad1";
const BONNET_DK = "#8f72ab";

/** The couch fabric: cream with pink cabbage roses and green leaves. id must be unique per <svg>. */
export const FloralPattern: React.FC<{ id: string; scale?: number; dark?: number }> = ({ id, scale = 1, dark = 0 }) => {
  const k = 1 - dark * 0.35;
  const c = (hex: string) => {
    const v = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k));
    return `rgb(${v.join(",")})`;
  };
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={120 * scale} height={110 * scale}>
      <g transform={`scale(${scale})`}>
        <rect width={120} height={110} fill={c("#eee0c4")} />
        {[
          [30, 28, 1],
          [90, 82, 0.85],
          [96, 18, 0.55],
          [22, 90, 0.6],
        ].map(([fx, fy, r], i) => (
          <g key={i} transform={`translate(${fx} ${fy}) scale(${r})`}>
            <path d="M-26,8 q-16,-14 -2,-26 M24,-6 q18,10 4,26" stroke={c("#6f8f4a")} strokeWidth={9} fill="none" strokeLinecap="round" />
            <ellipse cx={-24} cy={14} rx={12} ry={6} fill={c("#7d9c52")} transform="rotate(-30 -24 14)" />
            <ellipse cx={26} cy={-14} rx={12} ry={6} fill={c("#7d9c52")} transform="rotate(30 26 -14)" />
            <circle r={18} fill={c("#dd7f90")} />
            <path d="M-10,-4 q10,-12 20,0 q-10,14 -20,0 Z" fill={c("#f2aab4")} />
            <path d="M-12,6 q12,10 24,0" stroke={c("#b85468")} strokeWidth={3} fill="none" />
            <circle r={4} fill={c("#b85468")} />
          </g>
        ))}
      </g>
    </pattern>
  );
};

export const MAMA_HEAD: Pt = [26, -470];

export const Mama: React.FC<MamaProps> = ({ id, x, y, scale = 1, flip = false, t, frame, expr = "glare", look, ash = 0.6, phone = true, armB }) => {
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const blink = blinkAmount(t, id, 4.6);
  const dart = saccade(t, id, 0.05, 1.8);
  const gaze: Pt = [(look?.[0] ?? 0.6) + dart[0], (look?.[1] ?? 0.1) + dart[1]];
  const breathe = Math.sin(t * 2.1) * 3;
  const lid = expr === "shock" ? { top: 0, bot: 0, ang: -4 } : expr === "smug" ? { top: 0.5, bot: 0.3, ang: 10 } : { top: 0.58, bot: 0.3, ang: 18 };
  const tilt = noise2D(id + "tilt", t2 * 0.25, 1) * 2;
  const geo = useMemo(() => ({ skull: blob(0, 0, 58, 52, 12, 0.05, id + "skull"), bonnet: blob(-14, -30, 70, 52, 14, 0.12, id + "bonnet") }), [id]);
  const pat = `${id}-floral`;

  const SF: Pt = [44, -380];
  const SB: Pt = [-66, -372];
  const aF = limb(SF, [24, 118], [96, 88]);
  const aB = limb(SB, armB ?? [-35, 95], [96, 88]);
  const HC: Pt = [MAMA_HEAD[0], MAMA_HEAD[1] + breathe * 0.4];
  const s = flip ? -scale : scale;
  const ashLen = 8 + ash * 40;
  const smokeOn = 1;

  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <defs>
        <FloralPattern id={pat} scale={0.75} />
      </defs>
      <Shadow cx={0} cy={2} rx={150} o={0.35} />
      {/* far arm (on the hip) */}
      <DLine d={smoothPath(aB, false, 0.6)} w={34} color={FUR_DK} ow={4.5} />
      <path d={taperPath([aB[0], [aB[0][0] + (aB[1][0] - aB[0][0]) * 0.6, aB[0][1] + (aB[1][1] - aB[0][1]) * 0.6]], 62, 50)} fill={`url(#${pat})`} stroke={INK} strokeWidth={5} />
      <circle cx={aB[2][0]} cy={aB[2][1]} r={17} fill={FUR_DK} stroke={INK} strokeWidth={4} />
      {/* slippers */}
      {[
        [-50, 0],
        [54, 0],
      ].map(([sx], i) => (
        <g key={i} transform={`translate(${sx} -6)`}>
          <path d={blob(10, 0, 44, 18, 10, 0.25, `${id}sl${i}`)} fill="#f2b8c8" stroke={INK} strokeWidth={4} />
          {[0, 1, 2, 3, 4].map((k) => (
            <path key={k} d={`M${-24 + k * 12},-12 l${(k % 2) * 4 - 2},-10`} stroke="#f2b8c8" strokeWidth={5} strokeLinecap="round" />
          ))}
        </g>
      ))}
      {/* the muumuu (same fabric as the couch) */}
      <path
        d={smoothPath(
          [
            [-150, -18],
            [150, -18],
            [128, -170],
            [96 + breathe, -300],
            [60, -392],
            [-2, -406],
            [-70, -392],
            [-110, -300],
            [-138, -170],
          ],
          true,
          0.6,
        )}
        fill={`url(#${pat})`}
        stroke={INK}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <path d="M-148,-24 Q0,-4 150,-24" stroke="#c76a7a" strokeWidth={8} fill="none" strokeDasharray="14 10" />
      <path d="M-30,-398 Q8,-366 44,-396" stroke={INK} strokeWidth={4} fill={FUR} />
      {/* reading glasses on a beaded chain */}
      <path d="M-40,-388 Q6,-300 56,-384" stroke="#d9b44a" strokeWidth={3} fill="none" strokeDasharray="3 4" />
      <g transform="translate(8 -318)">
        <circle cx={-16} cy={0} r={14} fill="#cfe6ee" fillOpacity={0.4} stroke={INK} strokeWidth={3} />
        <circle cx={16} cy={2} r={14} fill="#cfe6ee" fillOpacity={0.4} stroke={INK} strokeWidth={3} />
        <path d="M-2,0 L2,1" stroke={INK} strokeWidth={3} />
      </g>
      {/* head */}
      <g transform={`translate(${HC[0]} ${HC[1]}) rotate(${tilt})`}>
        <path d={geo.bonnet} fill={BONNET} stroke={INK} strokeWidth={5} />
        <path d={geo.skull} fill={FUR} stroke={INK} strokeWidth={5} />
        {[
          [-30, -2, 8, 6],
          [-14, 24, 6, 5],
          [-42, 20, 7, 5],
        ].map(([sx, sy, rx, ry], i) => (
          <ellipse key={i} cx={sx} cy={sy} rx={rx} ry={ry} fill={SPOT} opacity={0.75} />
        ))}
        {/* bonnet front band + ruffle, ears through holes */}
        <path d="M-58,-16 C-50,-62 30,-74 58,-34" stroke={BONNET_DK} strokeWidth={16} fill="none" strokeLinecap="round" />
        <path d="M-58,-16 C-50,-62 30,-74 58,-34" stroke={BONNET} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray="6 7" />
        <circle cx={-30} cy={-64} r={20} fill="#3a2a1e" stroke={INK} strokeWidth={4} />
        <circle cx={24} cy={-70} r={22} fill="#3a2a1e" stroke={INK} strokeWidth={4} />
        <circle cx={25} cy={-67} r={11} fill="#8a6458" />
        {/* sleep mask pushed up */}
        <g transform="translate(12 -40) rotate(-6)">
          <path d="M-46,0 C-40,-18 -6,-20 0,-6 C6,-20 40,-18 46,0 C40,16 6,14 0,6 C-6,14 -40,16 -46,0 Z" fill="#e88aa6" stroke={INK} strokeWidth={4} />
          <path d="M-34,0 q12,8 24,0 M10,0 q12,8 24,0" stroke={INK} strokeWidth={2.5} fill="none" />
          <path d="M-30,3 l-2,5 M-22,5 l0,5 M-14,4 l2,5 M14,3 l-2,5 M22,5 l0,5 M30,4 l2,5" stroke={INK} strokeWidth={2} />
        </g>
        {/* muzzle with coral lipstick */}
        <path d="M22,-8 C56,-16 92,-2 100,18 C104,38 82,50 54,48 C38,46 24,28 22,-8 Z" fill={MUZZLE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M86,-2 C96,-6 106,0 104,10 C102,18 90,18 84,12 C80,6 80,0 86,-2 Z" fill="#141010" stroke={INK} strokeWidth={3} />
        <path d="M50,40 Q70,30 92,34" stroke="#e8604a" strokeWidth={8} fill="none" strokeLinecap="round" />
        <path d="M50,40 Q70,30 92,34" stroke={INK} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        {/* mole with a hair */}
        <circle cx={44} cy={24} r={4.5} fill="#2a1a12" />
        <path d="M45,21 q4,-8 10,-10" stroke="#2a1a12" strokeWidth={1.5} fill="none" />
        {/* the menthol */}
        <g transform="translate(88 36) rotate(12)">
          <rect x={0} y={-4} width={44} height={8} fill="#f6f1e6" stroke={INK} strokeWidth={2.5} />
          <rect x={0} y={-4} width={12} height={8} fill="#d9a34a" stroke={INK} strokeWidth={2} />
          <rect x={44} y={-4.5} width={ashLen} height={9} rx={2} fill="#9a9a96" stroke={INK} strokeWidth={2} />
          <circle cx={44 + ashLen} cy={0} r={4} fill="#ff7a3a" opacity={0.9} />
        </g>
        {smokeOn
          ? [0, 1, 2].map((i) => {
              const ph = (t * 0.35 + i / 3) % 1;
              const sx = 136 + Math.sin(ph * 6 + i) * 14 + ph * 20;
              return <path key={i} d={`M${sx},${30 - ph * 160} q-14,-18 0,-36 q14,-18 0,-36`} stroke="#d8d4cc" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.45 * (1 - ph)} />;
            })
          : null}
        {/* eyes + penciled brows */}
        <path d="M-12,4 q10,8 20,0 M20,6 q14,10 28,0" stroke="#6a5a7a" strokeWidth={4} fill="none" opacity={0.7} />
        <Eye id={`${id}-eB`} seed={`${id}B`} cx={-2} cy={-12} rx={11} ry={12} look={gaze} pupil={0.26} sclera="#efe6c8" lidTop={Math.max(lid.top, blink)} lidBottom={lid.bot} lidAngle={-lid.ang} lidColor="#7fa7c9" sw={4} veins={1} />
        <Eye id={`${id}-eF`} seed={`${id}F`} cx={28} cy={-10} rx={13} ry={14} look={gaze} pupil={0.26} sclera="#efe6c8" lidTop={Math.max(lid.top, blink)} lidBottom={lid.bot} lidAngle={lid.ang} lidColor="#7fa7c9" sw={4} veins={2} />
        <path d={`M-16,${-34 - (expr === "shock" ? 8 : 0)} Q-2,${-46 - (expr === "shock" ? 8 : 0)} 10,${-30 + (expr === "glare" ? 4 : 0)}`} stroke="#2a1a12" strokeWidth={2.5} fill="none" />
        <path d={`M16,${-28 + (expr === "glare" ? 4 : 0)} Q30,${-48 - (expr === "shock" ? 8 : 0)} 46,${-36 - (expr === "shock" ? 8 : 0)}`} stroke="#2a1a12" strokeWidth={2.5} fill="none" />
        {/* gold hoop */}
        <circle cx={-20} cy={44} r={14} fill="none" stroke="#e1b93f" strokeWidth={4} />
        <path d="M-6,46 C10,70 46,64 52,46" fill={FUR_DK} stroke={INK} strokeWidth={4} />
      </g>
      {/* near arm + cordless phone */}
      <DLine d={smoothPath(aF, false, 0.6)} w={34} color={FUR} ow={4.5} />
      <path d={taperPath([aF[0], [aF[0][0] + (aF[1][0] - aF[0][0]) * 0.6, aF[0][1] + (aF[1][1] - aF[0][1]) * 0.6]], 62, 50)} fill={`url(#${pat})`} stroke={INK} strokeWidth={5} />
      {phone ? (
        <g transform={`translate(${aF[2][0] + 6} ${aF[2][1] - 30}) rotate(14)`}>
          <rect x={-14} y={-40} width={28} height={84} rx={8} fill="#e8e2d0" stroke={INK} strokeWidth={4} />
          <rect x={-8} y={-30} width={16} height={14} rx={2} fill="#9fd08a" stroke={INK} strokeWidth={2} />
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={-9 + c * 7} y={-8 + r * 9} width={5} height={6} rx={1} fill="#8a8578" />))}
          <path d="M8,-40 L12,-74" stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <circle cx={12} cy={-76} r={4} fill={INK} />
        </g>
      ) : null}
      <circle cx={aF[2][0]} cy={aF[2][1]} r={17} fill={FUR} stroke={INK} strokeWidth={4} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Mama's chihuahuas                                                   */
/* ------------------------------------------------------------------ */

/** A trembling chihuahua in a knit sweater. Origin = floor under the dog; faces right. */
export const Chihuahua: React.FC<{ x: number; y: number; scale?: number; flip?: boolean; t: number; frame: number; seed: string; sweater?: string; snarl?: number; look?: Pt }> = ({
  x,
  y,
  scale = 1,
  flip = false,
  t,
  frame,
  seed,
  sweater = "#4a7fc0",
  snarl = 0.6,
  look = [0.6, 0],
}) => {
  const f2 = onN(frame, 2);
  const shiver = noise2D(seed + "sh", f2 * 1.7, 0) * 3;
  const s = flip ? -scale : scale;
  const blink = blinkAmount(t, seed, 2.7);
  return (
    <g transform={`translate(${x + shiver} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={0} cy={2} rx={46} o={0.3} />
      {/* legs */}
      {[-22, -10, 14, 26].map((lx, i) => (
        <path key={i} d={`M${lx},-30 L${lx + (i % 2 ? 2 : -2)},-2`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      ))}
      {[-22, -10, 14, 26].map((lx, i) => (
        <path key={`c${i}`} d={`M${lx},-30 L${lx + (i % 2 ? 2 : -2)},-2`} stroke="#d8b48a" strokeWidth={4} strokeLinecap="round" />
      ))}
      {/* rat tail */}
      <path d={`M-30,-44 q-24,-6 -26,${-26 + Math.sin(t * 20) * 6}`} stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d={`M-30,-44 q-24,-6 -26,${-26 + Math.sin(t * 20) * 6}`} stroke="#d8b48a" strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* sweater body */}
      <path d={blob(0, -46, 38, 22, 10, 0.08, seed + "b")} fill={sweater} stroke={INK} strokeWidth={4} />
      <path d="M-30,-46 l60,0 M-26,-36 l52,0" stroke="#f2ede0" strokeWidth={3} strokeDasharray="5 5" />
      {/* head: apple skull, satellite ears, bug eyes */}
      <g transform={`translate(30 -70) rotate(${shiver * 2})`}>
        <path d="M-16,-20 L-34,-62 L-2,-30 Z" fill="#d8b48a" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M10,-26 L22,-70 L28,-24 Z" fill="#d8b48a" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M-12,-26 L-26,-54 L-6,-32 Z M14,-30 L22,-60 L24,-30 Z" fill="#e8a0a0" />
        <circle cx={0} cy={0} r={28} fill="#d8b48a" stroke={INK} strokeWidth={4} />
        <path d="M14,6 C30,2 42,10 40,20 C36,28 22,26 14,20 Z" fill="#c9a07a" stroke={INK} strokeWidth={3} />
        <circle cx={40} cy={13} r={5} fill={INK} />
        <Eye id={`${seed}-e1`} seed={`${seed}1`} cx={-6} cy={-4} rx={12} ry={13} look={[look[0] - 0.6, look[1] + 0.3]} pupil={0.42} sclera="#f4f0e2" veins={2} lidTop={blink * 0.9} lidBottom={0} lidColor="#d8b48a" sw={3} />
        <Eye id={`${seed}-e2`} seed={`${seed}2`} cx={18} cy={-6} rx={13} ry={14} look={look} pupil={0.42} sclera="#f4f0e2" veins={2} lidTop={blink * 0.9} lidBottom={0} lidColor="#d8b48a" sw={3} />
        {snarl > 0 ? (
          <g>
            <path d={`M14,${22} Q28,${30 + snarl * 6} 40,22`} fill="#3a1010" stroke={INK} strokeWidth={3} />
            {[18, 26, 34].map((tx, i) => (
              <path key={i} d={`M${tx},22 l3,${5 + snarl * 4} l3,${-5 - snarl * 4} Z`} fill="#f4f0e2" stroke={INK} strokeWidth={1.5} />
            ))}
          </g>
        ) : (
          <path d="M16,22 Q28,28 38,22" stroke={INK} strokeWidth={3} fill="none" />
        )}
      </g>
    </g>
  );
};
