import React from "react";
import { INK } from "../../../characters/parts";
import { blob } from "../../../engine/util";

/**
 * The dogs. Mangy, rib-cage-thin strays that live on the drifting rocks around Glim's shack and howl at nothing.
 * Lit from behind by the ringed planet. Origin = between the paws. Faces right.
 */
export const SpaceDog: React.FC<{ id: string; x: number; y: number; s?: number; flip?: boolean; t: number; howl?: number; seed?: number }> = ({ id, x, y, s = 1, flip = false, t, howl = 1, seed = 0 }) => {
  const ph = t * 1.6 + seed * 2.1;
  const h = howl * (0.6 + 0.4 * Math.max(0, Math.sin(ph)));
  const headRot = -12 - h * 38;
  const jaw = 4 + h * 22;
  const body = "#1d1828";
  const rim = "#8ff3ff";
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {/* legs */}
      {[-60, -42, 38, 56].map((lx, i) => (
        <path key={i} d={`M${lx},-70 L${lx + (i % 2 ? 6 : -4)},-4`} stroke={INK} strokeWidth={13} strokeLinecap="round" />
      ))}
      {[-60, -42, 38, 56].map((lx, i) => (
        <path key={i} d={`M${lx},-70 L${lx + (i % 2 ? 6 : -4)},-4`} stroke={body} strokeWidth={7} strokeLinecap="round" />
      ))}
      {/* tail, tucked */}
      <path d="M-76,-92 q-40,6 -46,40" fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
      <path d="M-76,-92 q-40,6 -46,40" fill="none" stroke={body} strokeWidth={6} strokeLinecap="round" />
      {/* body + ribs */}
      <path d={blob(-4, -96, 84, 30, 10, 0.12, id + "body")} fill={body} stroke={INK} strokeWidth={5} />
      <path d="M-20,-118 q-6,20 0,40 M-4,-120 q-6,22 0,42 M12,-118 q-6,20 0,40" fill="none" stroke="#3a3350" strokeWidth={3} />
      <path d="M-80,-110 Q0,-136 80,-108" fill="none" stroke={rim} strokeWidth={3} opacity={0.7} />
      {/* head */}
      <g transform={`translate(70 -112) rotate(${headRot})`}>
        <path d="M-10,-26 L0,-58 L14,-26 Z M10,-28 L26,-56 L32,-24 Z" fill={body} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={blob(14, -8, 30, 24, 9, 0.1, id + "head")} fill={body} stroke={INK} strokeWidth={4} />
        {/* snout: upper and the hinged jaw */}
        <path d="M30,-18 L84,-14 L84,-2 L34,2 Z" fill={body} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <g transform={`rotate(${jaw} 34 4)`}>
          <path d="M34,2 L80,4 L76,14 L34,14 Z" fill={body} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
        <path d={`M38,2 L78,2 L76,${4 + jaw * 0.7} L40,${8 + jaw * 0.3} Z`} fill="#5a1022" />
        <circle cx={20} cy={-12} r={5} fill="#d6ff7a" />
        <circle cx={20} cy={-12} r={11} fill="#d6ff7a" opacity={0.22} />
        <path d="M-12,-30 Q14,-40 40,-22" fill="none" stroke={rim} strokeWidth={3} opacity={0.7} />
      </g>
      {/* the howl */}
      {h > 0.3
        ? [0, 1, 2].map((i) => {
            const k = (t * 1.4 + i / 3) % 1;
            return <path key={i} d={`M${130 + k * 90},${-190 - k * 110} q20,-18 44,-10`} fill="none" stroke="#cfe9ff" strokeWidth={4} opacity={(1 - k) * 0.6} strokeLinecap="round" />;
          })
        : null}
    </g>
  );
};
