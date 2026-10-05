import React from "react";
import { noise2D } from "@remotion/noise";
import { Pt, limb, onN, smoothPath } from "../engine/util";
import { INK } from "./parts";

/**
 * THE TALL SKINNY FIGURES (the farmers / "gods").
 * Impossibly long black silhouettes with tiny heads, straw hats,
 * pin-prick eyes and a grin wider than their face. Fully posable.
 * Origin = ground between the feet.
 */

export type Hold = "fork" | "knife" | "drumstick" | "tape" | "chop" | "phone" | "torch" | null;

export interface Pose {
  lean: number;
  head: number;
  /** [shoulder, elbow] degrees; 0 = hanging straight down, + rotates toward +x (forward) */
  armF: [number, number];
  armB: [number, number];
  /** [hip, knee] */
  legF: [number, number];
  legB: [number, number];
}

export const POSE_STAND: Pose = { lean: 0, head: 0, armF: [8, 4], armB: [-6, -4], legF: [4, -2], legB: [-4, 2] };

export interface TallFigureProps {
  id: string;
  x: number;
  y: number;
  h?: number;
  flip?: boolean;
  t: number;
  frame: number;
  pose?: Partial<Pose>;
  grin?: number;
  /** 0..1 open grin (chewing / moaning) */
  mouthOpen?: number;
  eyes?: "dots" | "rolled" | "closed" | "glow" | "sad";
  hat?: boolean;
  fill?: string;
  rim?: string;
  holdF?: Hold;
  holdB?: Hold;
  tears?: boolean;
  halo?: boolean;
  sway?: number;
}

const HoldProp: React.FC<{ kind: Hold; at: Pt; angle: number; s: number }> = ({ kind, at, angle, s }) => {
  if (!kind) return null;
  const tr = `translate(${at[0]} ${at[1]}) rotate(${angle}) scale(${s})`;
  switch (kind) {
    case "fork":
      return (
        <g transform={tr}>
          <rect x={-4} y={-10} width={8} height={70} fill="#8b8a86" stroke={INK} strokeWidth={3} />
          <path d="M-14,60 L14,60 L14,74 L-14,74 Z" fill="#a9a8a2" stroke={INK} strokeWidth={3} />
          {[-12, 0, 12].map((fx) => (
            <rect key={fx} x={fx - 2.5} y={72} width={5} height={36} fill="#a9a8a2" stroke={INK} strokeWidth={2} />
          ))}
        </g>
      );
    case "knife":
      return (
        <g transform={tr}>
          <rect x={-6} y={-10} width={12} height={40} rx={3} fill="#3b2a20" stroke={INK} strokeWidth={3} />
          <path d="M-7,30 L9,30 L7,120 Q-2,110 -7,30 Z" fill="#c9c8c2" stroke={INK} strokeWidth={3} />
        </g>
      );
    case "drumstick":
    case "chop":
      return (
        <g transform={tr}>
          <rect x={-4} y={-6} width={8} height={36} rx={4} fill="#efe6cf" stroke={INK} strokeWidth={3} />
          <circle cx={-6} cy={-8} r={7} fill="#efe6cf" stroke={INK} strokeWidth={3} />
          <circle cx={6} cy={-8} r={7} fill="#efe6cf" stroke={INK} strokeWidth={3} />
          <path d="M-26,30 C-30,70 -10,96 4,96 C22,96 30,64 24,30 Z" fill="#8a4a24" stroke={INK} strokeWidth={4} />
          <path d="M-14,44 q8,10 4,30 M8,46 q6,14 0,30" stroke="#5a2c14" strokeWidth={4} fill="none" />
        </g>
      );
    case "tape":
      return (
        <g transform={tr}>
          <rect x={-20} y={-6} width={40} height={36} rx={6} fill="#d9b43a" stroke={INK} strokeWidth={4} />
          <circle cx={0} cy={12} r={8} fill="#7a6420" stroke={INK} strokeWidth={3} />
        </g>
      );
    case "phone":
      return (
        <g transform={tr}>
          <rect x={-14} y={-4} width={28} height={50} rx={5} fill="#1d1d24" stroke={INK} strokeWidth={3} />
          <rect x={-10} y={2} width={20} height={36} fill="#9fc7e8" opacity={0.85} />
        </g>
      );
    case "torch":
      return (
        <g transform={tr}>
          <rect x={-5} y={-10} width={10} height={90} fill="#4a3020" stroke={INK} strokeWidth={3} />
          <path d="M-16,84 C-20,110 -4,130 0,150 C6,130 22,110 16,84 Z" fill="#ff9a2a" stroke={INK} strokeWidth={3} />
        </g>
      );
  }
};

export const TallFigure: React.FC<TallFigureProps> = ({
  id,
  x,
  y,
  h = 900,
  flip = false,
  t,
  frame,
  pose = {},
  grin = 1,
  mouthOpen = 0,
  eyes = "dots",
  hat = true,
  fill = "#0b090d",
  rim = "#3a3046",
  holdF = null,
  holdB = null,
  tears = false,
  halo = false,
  sway = 1,
}) => {
  const P: Pose = { ...POSE_STAND, ...pose };
  const t2 = onN(frame, 2) / 24;
  const sw = noise2D(id + "sway", t2 * 0.4, 0) * 3 * sway;
  const u = h / 900;
  const hipY = -432 * u;
  const lean = P.lean + sw;
  const rad = (lean * Math.PI) / 180;
  const sh: Pt = [Math.sin(rad) * 300 * u, hipY - Math.cos(rad) * 300 * u];
  const neckTop: Pt = [sh[0] + Math.sin(rad) * 40 * u, sh[1] - Math.cos(rad) * 40 * u];
  const headC: Pt = [neckTop[0] + Math.sin(rad) * 38 * u, neckTop[1] - Math.cos(rad) * 38 * u];

  const legLen = [218 * u, 214 * u];
  const legF = limb([12 * u, hipY], [P.legF[0], P.legF[1]], legLen);
  const legB = limb([-12 * u, hipY], [P.legB[0], P.legB[1]], legLen);
  const armLen = [190 * u, 180 * u];
  const armF = limb([sh[0] + 14 * u, sh[1] + 10 * u], [P.armF[0], P.armF[1]], armLen);
  const armB = limb([sh[0] - 14 * u, sh[1] + 10 * u], [P.armB[0], P.armB[1]], armLen);
  const limbW = 22 * u;

  const torso = smoothPath(
    [
      [-34 * u, hipY + 6 * u],
      [34 * u, hipY + 6 * u],
      [sh[0] + 52 * u, sh[1] + 16 * u],
      [sh[0] + 30 * u, sh[1] - 8 * u],
      [sh[0] - 30 * u, sh[1] - 8 * u],
      [sh[0] - 52 * u, sh[1] + 16 * u],
    ],
    true,
    0.6,
  );

  const hand = (pts: Pt[], hold: Hold, side: number) => {
    const end = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const a = (Math.atan2(end[0] - prev[0], end[1] - prev[1]) * 180) / Math.PI;
    const fingers = [-14, -4, 6, 16].map((fa, i) => {
      const r = ((a + fa) * Math.PI) / 180;
      const l = (44 + (i === 1 || i === 2 ? 10 : 0)) * u;
      return `M${end[0]},${end[1]} L${end[0] + Math.sin(r) * l},${end[1] + Math.cos(r) * l}`;
    });
    return (
      <g>
        <path d={fingers.join(" ")} stroke={fill} strokeWidth={7 * u} strokeLinecap="round" />
        <HoldProp kind={hold} at={[end[0] + Math.sin((a * Math.PI) / 180) * 30 * u, end[1] + Math.cos((a * Math.PI) / 180) * 30 * u]} angle={-a + 0} s={u * 1.3 * side} />
      </g>
    );
  };

  const limbPath = (pts: Pt[]) => smoothPath(pts, false, 0.5);
  const headRx = 30 * u;
  const headRy = 42 * u;
  const grinW = headRx * 1.9 * grin;
  const grinH = (8 + mouthOpen * 26) * u;

  const tearDrops: React.ReactNode[] = [];
  if (tears) {
    for (let i = 0; i < 4; i++) {
      const ph = (t * 1.3 + i * 0.25) % 1;
      const side = i % 2 === 0 ? -1 : 1;
      tearDrops.push(
        <ellipse key={i} cx={side * headRx * 0.45} cy={-headRy * 0.05 + ph * 160 * u} rx={5 * u} ry={8 * u} fill="#8fc5e8" stroke={INK} strokeWidth={2 * u} opacity={1 - ph} />,
      );
    }
  }

  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <ellipse cx={0} cy={0} rx={90 * u} ry={14 * u} fill="#000" opacity={0.35} />
      {/* back limbs */}
      <path d={limbPath(armB)} stroke={fill} strokeWidth={limbW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {hand(armB, holdB, -1)}
      <path d={limbPath(legB)} stroke={fill} strokeWidth={limbW * 1.15} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${legB[2][0] - 10 * u},${legB[2][1]} l${46 * u},0`} stroke={fill} strokeWidth={16 * u} strokeLinecap="round" />
      {/* torso: overalls hint */}
      <path d={torso} fill={fill} stroke={rim} strokeWidth={3 * u} />
      <path
        d={`M${-26 * u},${hipY - 8 * u} L${sh[0] - 22 * u},${sh[1] + 30 * u} M${26 * u},${hipY - 8 * u} L${sh[0] + 22 * u},${sh[1] + 30 * u}`}
        stroke="#211b29"
        strokeWidth={6 * u}
      />
      <rect x={-30 * u} y={hipY - 120 * u} width={60 * u} height={70 * u} rx={6 * u} fill="#17121d" transform={`rotate(${lean * 0.6} 0 ${hipY})`} />
      {/* neck */}
      <path d={`M${sh[0]},${sh[1]} L${neckTop[0]},${neckTop[1]}`} stroke={fill} strokeWidth={14 * u} strokeLinecap="round" />
      {/* front limbs */}
      <path d={limbPath(legF)} stroke={fill} strokeWidth={limbW * 1.15} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${legF[2][0] - 10 * u},${legF[2][1]} l${46 * u},0`} stroke={fill} strokeWidth={16 * u} strokeLinecap="round" />
      {/* head */}
      <g transform={`translate(${headC[0]} ${headC[1]}) rotate(${P.head + lean * 0.3})`}>
        {halo ? <ellipse cx={0} cy={-headRy - 46 * u} rx={46 * u} ry={12 * u} fill="none" stroke="#f3d65a" strokeWidth={8 * u} /> : null}
        <ellipse rx={headRx} ry={headRy} fill={fill} stroke={rim} strokeWidth={3 * u} />
        {eyes === "dots" ? (
          <>
            <circle cx={-11 * u} cy={-8 * u} r={3.6 * u} fill="#f2ead8" />
            <circle cx={12 * u} cy={-9 * u} r={3.6 * u} fill="#f2ead8" />
          </>
        ) : eyes === "glow" ? (
          <>
            <circle cx={-11 * u} cy={-8 * u} r={9 * u} fill="#f6e27a" opacity={0.25} />
            <circle cx={12 * u} cy={-9 * u} r={9 * u} fill="#f6e27a" opacity={0.25} />
            <circle cx={-11 * u} cy={-8 * u} r={4.5 * u} fill="#fff6c0" />
            <circle cx={12 * u} cy={-9 * u} r={4.5 * u} fill="#fff6c0" />
          </>
        ) : eyes === "rolled" ? (
          <>
            <ellipse cx={-11 * u} cy={-8 * u} rx={7 * u} ry={5 * u} fill="#f2ead8" />
            <ellipse cx={12 * u} cy={-9 * u} rx={7 * u} ry={5 * u} fill="#f2ead8" />
            <circle cx={-11 * u} cy={-12 * u} r={2.2 * u} fill={INK} />
            <circle cx={12 * u} cy={-13 * u} r={2.2 * u} fill={INK} />
          </>
        ) : eyes === "sad" ? (
          <path d={`M${-17 * u},${-12 * u} q6,6 12,0 M${6 * u},${-12 * u} q6,6 12,0`} stroke="#f2ead8" strokeWidth={3 * u} fill="none" />
        ) : (
          <path d={`M${-17 * u},${-8 * u} q6,-5 12,0 M${6 * u},${-9 * u} q6,-5 12,0`} stroke="#f2ead8" strokeWidth={3 * u} fill="none" />
        )}
        {grin > 0 ? (
          <g>
            <path
              d={`M${-grinW / 2},${8 * u} Q0,${(24 + mouthOpen * 34) * u + grinH} ${grinW / 2},${8 * u} Q0,${(18 + mouthOpen * 10) * u} ${-grinW / 2},${8 * u} Z`}
              fill={mouthOpen > 0.1 ? "#2a0a0a" : "#f2ead8"}
              stroke="#f2ead8"
              strokeWidth={2.5 * u}
            />
            {mouthOpen > 0.1 ? (
              <path d={`M${-grinW / 2.3},${13 * u} Q0,${24 * u} ${grinW / 2.3},${13 * u}`} stroke="#f2ead8" strokeWidth={5 * u} fill="none" />
            ) : (
              Array.from({ length: 7 }).map((_, i) => {
                const gx = -grinW / 2 + ((i + 1) * grinW) / 8;
                return <line key={i} x1={gx} y1={10 * u} x2={gx} y2={20 * u + (1 - Math.abs(gx) / (grinW / 2)) * 8 * u} stroke={INK} strokeWidth={1.6 * u} />;
              })
            )}
          </g>
        ) : null}
        {tearDrops}
        {hat ? (
          <g>
            <ellipse cx={0} cy={-headRy * 0.62} rx={headRx * 2.3} ry={9 * u} fill="#a88f4e" stroke={INK} strokeWidth={3 * u} />
            <path d={`M${-headRx * 0.95},${-headRy * 0.62} C${-headRx},${-headRy * 1.5} ${headRx},${-headRy * 1.5} ${headRx * 0.95},${-headRy * 0.62} Z`} fill="#b89e5a" stroke={INK} strokeWidth={3 * u} />
            <path d={`M${-headRx * 0.95},${-headRy * 0.72} L${headRx * 0.95},${-headRy * 0.72}`} stroke="#6b2a22" strokeWidth={5 * u} />
          </g>
        ) : null}
      </g>
      <path d={limbPath(armF)} stroke={fill} strokeWidth={limbW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {hand(armF, holdF, 1)}
    </g>
  );
};
