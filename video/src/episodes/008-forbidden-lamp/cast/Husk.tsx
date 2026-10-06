import React from "react";
import { INK } from "../../../characters/parts";
import { Pt, lerp, rnd, smoothPath } from "../../../engine/util";
import { furPath, mixHex } from "./Moth";

/* EPISODE 008 props: what's left of a moth (husks, ghosts, X-rays, the lawn's dead, loose wings, ants). */

/** A crispy, curled, smoking moth husk (Wick after the zapper). Origin = centre. */
export const MothHusk: React.FC<{ x: number; y: number; s?: number; rot?: number; t: number; smoke?: number; ember?: number; twitch?: number }> = ({
  x,
  y,
  s = 1,
  rot = 0,
  t,
  smoke = 1,
  ember = 0.6,
  twitch = 0,
}) => {
  const tw = twitch > 0 ? Math.sin(t * 40) * 10 * twitch : 0;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {/* wing stubs, charred and curled */}
      <path d="M-20,-30 C-90,-80 -120,-40 -96,-8 C-80,6 -50,-4 -20,-6 Z" fill="#3a2a20" stroke={INK} strokeWidth={4} />
      <path d="M-70,-44 l-10,-10 M-92,-30 l-12,-4" stroke="#1a100a" strokeWidth={3} />
      <path d="M18,-30 C70,-70 98,-46 80,-14 C64,0 40,-6 18,-8 Z" fill="#2e2018" stroke={INK} strokeWidth={4} />
      {/* curled legs */}
      {[-24, -8, 8, 24].map((lx, i) => (
        <path key={i} d={`M${lx},16 q${i % 2 ? 10 : -10},28 ${i % 2 ? -4 : 4},36 q-6,6 -12,-2`} stroke="#1a100a" strokeWidth={6} fill="none" strokeLinecap="round" transform={i === 3 ? `rotate(${tw} ${lx} 16)` : undefined} />
      ))}
      {/* body */}
      <path d={furPath(0, 0, 40, 34, 14, 0.35, "husk")} fill="#2a1a12" stroke={INK} strokeWidth={5} />
      <path d={furPath(4, -40, 30, 26, 12, 0.3, "huskh")} fill="#2e1e16" stroke={INK} strokeWidth={5} />
      {/* X eyes */}
      <g stroke="#d8c8a0" strokeWidth={5} strokeLinecap="round">
        <path d="M-12,-50 l14,14 M2,-50 l-14,14" />
        <path d="M10,-48 l14,14 M24,-48 l-14,14" />
      </g>
      {/* antenna stubs with embers */}
      <path d="M-6,-62 q-10,-24 -26,-30 M14,-62 q8,-22 22,-26" stroke="#1a100a" strokeWidth={5} fill="none" strokeLinecap="round" />
      <circle cx={-32} cy={-92} r={4} fill="#ff7a2a" opacity={ember * (0.6 + Math.sin(t * 9) * 0.4)} />
      <circle cx={36} cy={-88} r={3.5} fill="#ff9a3a" opacity={ember * (0.6 + Math.cos(t * 7) * 0.4)} />
      {/* smoke */}
      {smoke > 0
        ? [0, 1, 2].map((i) => {
            const ph = (t * 0.6 + i / 3) % 1;
            return <path key={i} d={`M${-10 + i * 12},${-70 - ph * 140} q-14,-20 0,-40 q14,-20 0,-40`} stroke="#9a948c" strokeWidth={9} fill="none" opacity={0.55 * smoke * (1 - ph)} strokeLinecap="round" />;
          })
        : null}
    </g>
  );
};

/** Wick's little ghost: translucent, wavy-tailed, still wide-eyed. Origin = centre. */
export const MothGhost: React.FC<{ x: number; y: number; s?: number; t: number; alpha?: number; look?: number }> = ({ x, y, s = 1, t, alpha = 0.8, look = 0 }) => {
  const flap = Math.sin(t * 22) * 0.5 + 0.5;
  const tail: Pt[] = [];
  for (let i = 0; i <= 8; i++) tail.push([Math.sin(t * 6 + i * 0.9) * 8, 30 + i * 12]);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={alpha}>
      <g style={{ mixBlendMode: "screen" }}>
        <circle r={110} fill="#bfe6ff" opacity={0.18} />
      </g>
      <path d={`M-6,-10 C${-60},${-70 - flap * 30} ${-110},${-20 - flap * 20} -90,20 C-70,40 -30,20 -6,10 Z`} fill="#eaf6ff" stroke="#9ec8e6" strokeWidth={4} opacity={0.85} />
      <path d={`M6,-10 C${60},${-70 - flap * 30} ${110},${-20 - flap * 20} 90,20 C70,40 30,20 6,10 Z`} fill="#eaf6ff" stroke="#9ec8e6" strokeWidth={4} opacity={0.85} />
      <path d={`M-22,-20 Q0,-36 22,-20 L20,30 ${smoothPath(tail, false).replace(/^M[^C]*/, "")} L-20,30 Z`} fill="#f4fbff" stroke="#9ec8e6" strokeWidth={4} opacity={0.9} />
      <circle cx={0} cy={-40} r={28} fill="#f4fbff" stroke="#9ec8e6" strokeWidth={4} />
      <ellipse cx={-10 + look * 4} cy={-42} rx={10} ry={12} fill="#2a3a4a" />
      <ellipse cx={12 + look * 4} cy={-42} rx={10} ry={12} fill="#2a3a4a" />
      <circle cx={-13 + look * 4} cy={-46} r={3} fill="#fff" />
      <circle cx={9 + look * 4} cy={-46} r={3} fill="#fff" />
      <path d="M-8,-60 q-14,-26 -30,-30 M8,-60 q14,-26 30,-30" stroke="#9ec8e6" strokeWidth={4} fill="none" strokeLinecap="round" />
      <ellipse cx={0} cy={-84} rx={26} ry={6} fill="none" stroke="#ffe9a0" strokeWidth={4} opacity={0.9} />
    </g>
  );
};

/** Cartoon electrocution: the moth's skeleton, white on blue. Origin = feet like the rig (facing right). */
export const MothXray: React.FC<{ x: number; y: number; s?: number; flip?: boolean; rot?: number }> = ({ x, y, s = 1, flip = false, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s}) rotate(${rot} 0 -240)`}>
    <path d="M-180,-560 C-220,-300 -40,-180 0,-240 C60,-300 120,-520 -180,-560 Z" fill="#1d3cff" opacity={0.85} />
    <ellipse cx={-4} cy={-238} rx={92} ry={96} fill="#1d3cff" opacity={0.9} />
    <circle cx={30} cy={-398} r={86} fill="#1d3cff" opacity={0.9} />
    <g stroke="#f4fbff" strokeWidth={10} strokeLinecap="round" fill="none">
      {/* skull */}
      <circle cx={30} cy={-404} r={56} />
      <ellipse cx={12} cy={-410} rx={16} ry={20} fill="#0a1450" />
      <ellipse cx={56} cy={-404} rx={18} ry={22} fill="#0a1450" />
      <path d="M30,-350 l0,14 M14,-350 l0,12 M46,-350 l0,12" />
      {/* spine + ribs */}
      <path d="M8,-336 L0,-120" />
      {[-300, -270, -240, -210, -180].map((ry, i) => (
        <path key={i} d={`M-50,${ry + 10} Q4,${ry - 22} 54,${ry + 10}`} />
      ))}
      {/* wing bones */}
      <path d="M-30,-300 L-170,-520 M-30,-300 L-120,-540 M-30,-300 L-200,-430" />
      {/* legs + antennae */}
      <path d="M10,-130 L34,-70 L18,-10 M-14,-130 L0,-70 L-20,-10 M40,-280 L110,-250 M30,-460 Q60,-560 0,-620 M10,-460 Q-30,-560 -80,-600" />
    </g>
  </g>
);

const DEAD_COLS = [
  ["#8a7a62", "#5a4a38"],
  ["#a9a08e", "#6a6252"],
  ["#c9b089", "#8a6a48"],
  ["#9a8070", "#6a4a40"],
  ["#7d8a6a", "#4e5a40"],
  ["#b9a6a0", "#7a6660"],
];

/** A dead moth on its back in the grass: wings splayed flat, legs curled up, X eyes. Origin = centre. */
export const DeadMoth: React.FC<{ x: number; y: number; s?: number; rot?: number; seed: string; t: number; torn?: boolean; flies?: boolean }> = ({ x, y, s = 1, rot = 0, seed, t, torn = false, flies = false }) => {
  const [c, d] = DEAD_COLS[Math.floor(rnd(seed + "c") * DEAD_COLS.length)];
  const wl = 150 + rnd(seed + "w") * 50;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx={0} cy={22} rx={wl * 1.05} ry={18} fill="#000" opacity={0.3} />
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`scale(${sd} 1)`}>
          {/* hindwing peeking under the forewing */}
          <path d={`M8,6 C${wl * 0.35},${-wl * 0.05} ${wl * 0.7},${wl * 0.02} ${wl * 0.62},${wl * 0.2} C${wl * 0.45},${wl * 0.3} 20,24 8,14 Z`} fill={mixHex(c, "#ffffff", 0.18)} stroke={INK} strokeWidth={4} />
          <path
            d={
              torn && sd > 0
                ? `M10,-2 C${wl * 0.4},${-wl * 0.42} ${wl * 0.95},${-wl * 0.3} ${wl},${-wl * 0.02} L${wl * 0.8},${-wl * 0.02} L${wl * 0.74},${wl * 0.1} L${wl * 0.56},${wl * 0.04} C${wl * 0.4},${wl * 0.14} 24,14 10,8 Z`
                : `M10,-2 C${wl * 0.4},${-wl * 0.42} ${wl * 0.95},${-wl * 0.3} ${wl},${-wl * 0.02} C${wl * 0.8},${wl * 0.16} 30,16 10,8 Z`
            }
            fill={sd > 0 ? c : mixHex(c, "#000000", 0.12)}
            stroke={INK}
            strokeWidth={4}
          />
          <path d={`M${wl * 0.3},${-wl * 0.12} q${wl * 0.15},${wl * 0.08} ${wl * 0.32},${wl * 0.02} M${wl * 0.42},${-wl * 0.24} q${wl * 0.15},${wl * 0.06} ${wl * 0.3},${wl * 0.0}`} stroke={d} strokeWidth={4} fill="none" />
          <circle cx={wl * 0.62} cy={-wl * 0.1} r={wl * 0.06} fill={d} />
          {/* legs curled up off the side of the body */}
          {[-10, 4, 18].map((ly, i) => (
            <path key={i} d={`M18,${ly} q16,-10 14,-28 q-2,-10 -12,-8`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
          ))}
        </g>
      ))}
      <path d={furPath(0, 6, 24, 34, 12, 0.35, seed + "b")} fill={c} stroke={INK} strokeWidth={4} />
      <path d={furPath(0, -34, 26, 18, 12, 0.5, seed + "co")} fill={mixHex(c, "#ffffff", 0.35)} stroke={INK} strokeWidth={3.5} />
      <circle cx={0} cy={-50} r={22} fill={mixHex(c, "#ffffff", 0.15)} stroke={INK} strokeWidth={4} />
      <g stroke={INK} strokeWidth={4} strokeLinecap="round">
        <path d="M-15,-58 l10,10 M-5,-58 l-10,10 M5,-58 l10,10 M15,-58 l-10,10" />
      </g>
      <path d="M-8,-70 q-24,-26 -52,-22 M8,-70 q26,-22 48,-16" stroke={d} strokeWidth={5} fill="none" strokeLinecap="round" />
      {flies
        ? [0, 1].map((i) => {
            const fx = Math.sin(t * 3 + i * 2) * 60;
            const fy = -80 + Math.cos(t * 4 + i) * 24;
            return (
              <g key={i} transform={`translate(${fx} ${fy})`}>
                <ellipse cx={-3} cy={-4} rx={5} ry={Math.floor(t * 24) % 2 ? 6 : 2.5} fill="#d8e0e8" opacity={0.7} />
                <ellipse cx={3} cy={-4} rx={5} ry={Math.floor(t * 24) % 2 ? 6 : 2.5} fill="#d8e0e8" opacity={0.7} />
                <ellipse rx={5} ry={4} fill="#0d0a0a" />
              </g>
            );
          })
        : null}
    </g>
  );
};

/** A single torn forewing (impaled on a grass blade). Origin = the pierced point. */
export const LooseWing: React.FC<{ x: number; y: number; s?: number; rot?: number; seed: string; flutter?: number }> = ({ x, y, s = 1, rot = 0, seed, flutter = 0 }) => {
  const [c, d] = DEAD_COLS[Math.floor(rnd(seed + "c") * DEAD_COLS.length)];
  const L = 150;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + flutter * 8}) scale(${s} ${s * (1 - Math.abs(flutter) * 0.15)})`}>
      <path d={`M-20,10 C${-L * 0.3},${-L * 0.5} ${L * 0.2},${-L * 1.0} ${L * 0.5},${-L * 0.9} L${L * 0.42},${-L * 0.7} L${L * 0.58},${-L * 0.6} L${L * 0.4},${-L * 0.42} L${L * 0.5},${-L * 0.3} C${L * 0.3},${-L * 0.05} 10,20 -20,10 Z`} fill={c} stroke={INK} strokeWidth={4} />
      <path d={`M${-L * 0.05},${-L * 0.3} q${L * 0.2},${-L * 0.1} ${L * 0.3},${-L * 0.4} M${L * 0.05},${-L * 0.12} q${L * 0.2},${-L * 0.06} ${L * 0.36},${-L * 0.3}`} stroke={d} strokeWidth={4} fill="none" />
      {/* a faded eyespot still staring */}
      <circle cx={L * 0.14} cy={-L * 0.52} r={L * 0.11} fill={d} stroke={INK} strokeWidth={2.5} />
      <circle cx={L * 0.14} cy={-L * 0.52} r={L * 0.07} fill="#d8cba0" />
      <circle cx={L * 0.15} cy={-L * 0.52} r={L * 0.035} fill={INK} />
      <path d={`M${L * 0.42},${-L * 0.86} l${L * 0.05},${L * 0.02} M${L * 0.5},${-L * 0.62} l${L * 0.05},${L * 0.01}`} stroke={INK} strokeWidth={2} />
      <circle cx={0} cy={0} r={5} fill={INK} />
    </g>
  );
};

/** An ant (side view). Origin = between the feet. */
export const Ant: React.FC<{ x: number; y: number; s?: number; t: number; seed: string; flip?: boolean }> = ({ x, y, s = 1, t, seed, flip = false }) => {
  const ph = t * 14 + rnd(seed) * 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {[-1, 0, 1].map((k) => {
        const sw = Math.sin(ph + k * 2) * 7;
        return <path key={k} d={`M${k * 10},-16 L${k * 12 + sw},-6 L${k * 14 + sw * 1.4},0`} stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />;
      })}
      <ellipse cx={-22} cy={-18} rx={14} ry={10} fill="#1d1414" />
      <ellipse cx={0} cy={-18} rx={8} ry={6} fill="#1d1414" />
      <ellipse cx={17} cy={-20} rx={9} ry={8} fill="#1d1414" />
      <path d="M22,-26 q10,-14 18,-10 M18,-27 q6,-16 14,-16" stroke="#1d1414" strokeWidth={2.5} fill="none" />
      <path d="M17,-14 l10,4" stroke="#1d1414" strokeWidth={3} />
    </g>
  );
};

export const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
