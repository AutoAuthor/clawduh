import React from "react";
import { INK } from "../../../characters/parts";
import { blob } from "../../../engine/util";

/* EPISODE 006 hand props: the stolen package, the baby oil, party hats, the squeaky toy. */

export const FONT = "Arial Black, Arial, Helvetica, sans-serif";

/** Wraps text so it reads correctly inside a mirrored (flipped) character: mirrors around x = cx. */
export const Unmirror: React.FC<{ on: boolean; cx: number; children: React.ReactNode }> = ({ on, cx, children }) =>
  on ? <g transform={`translate(${2 * cx} 0) scale(-1 1)`}>{children}</g> : <>{children}</>;

/**
 * The package: a cardboard box addressed TO Mr. Dobbins, FROM Mr. Dobbins (it was bait all along).
 * Centred on (x, y). `open` 0..1 swings the top flaps up; `glow` lights it from inside.
 */
export const PackageBox: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  rot?: number;
  open?: number;
  glow?: number;
  mirror?: boolean;
  /** draw the full shipping label (close-ups) */
  detail?: boolean;
}> = ({ x, y, w = 124, h = 88, rot = 0, open = 0, glow = 0, mirror = false, detail = true }) => {
  const hw = w / 2;
  const hh = h / 2;
  const flapL = -open * 125;
  const flapR = open * 125;
  const flapW = hw * 0.96;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {glow > 0 ? (
        <g style={{ mixBlendMode: "screen" }} opacity={glow}>
          <path d={`M${-hw * 0.8},${-hh} L${hw * 0.8},${-hh} L${hw * 2.4},${-hh - h * 3.2} L${-hw * 2.4},${-hh - h * 3.2} Z`} fill="#ffd96a" opacity={0.35} />
          <path d={`M${-hw * 0.5},${-hh} L${hw * 0.5},${-hh} L${hw * 1.3},${-hh - h * 3.2} L${-hw * 1.3},${-hh - h * 3.2} Z`} fill="#fff4c0" opacity={0.45} />
        </g>
      ) : null}
      {/* back flaps (behind the box when open) */}
      {open > 0.02 ? (
        <>
          <g transform={`translate(${-hw} ${-hh}) rotate(${flapL * 0.9})`}>
            <rect x={0} y={-h * 0.42} width={flapW} height={h * 0.42} fill="#a87a45" stroke={INK} strokeWidth={4} />
          </g>
          <g transform={`translate(${hw} ${-hh}) rotate(${flapR * 0.9})`}>
            <rect x={-flapW} y={-h * 0.42} width={flapW} height={h * 0.42} fill="#a87a45" stroke={INK} strokeWidth={4} />
          </g>
        </>
      ) : null}
      <rect x={-hw} y={-hh} width={w} height={h} rx={3} fill="#bf8f55" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      {/* crushed corner + scuffs */}
      <path d={`M${hw - 18},${hh} L${hw},${hh - 16}`} stroke="#8a6234" strokeWidth={4} />
      <path d={blob(-hw * 0.5, hh * 0.55, 10, 5, 7, 0.3, "boxscuff")} fill="#8a6234" opacity={0.6} />
      {/* tape */}
      <rect x={-8} y={-hh} width={16} height={h * 0.38} fill="#dcc68e" stroke="#9c8650" strokeWidth={1.5} />
      {open <= 0.02 ? <rect x={-hw} y={-hh - 3} width={w} height={6} fill="#8f6538" /> : <rect x={-hw + 4} y={-hh - 2} width={w - 8} height={8} fill="#2a1a10" />}
      {detail ? (
        <>
          {/* shipping label: TO Mr. Dobbins / FROM Mr. Dobbins */}
          <rect x={-hw + 8} y={-hh * 0.38} width={w * 0.5} height={h * 0.62} fill="#f6f2e6" stroke={INK} strokeWidth={2.5} />
          <Unmirror on={mirror} cx={-hw + 8 + w * 0.25}>
            <text x={-hw + 8 + w * 0.25} y={-hh * 0.38 + h * 0.13} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={h * 0.085} fill={INK}>
              TO: MR. DOBBINS
            </text>
            <text x={-hw + 8 + w * 0.25} y={-hh * 0.38 + h * 0.27} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={h * 0.085} fill="#a3262a">
              FROM: MR. DOBBINS
            </text>
          </Unmirror>
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x={-hw + 14 + i * w * 0.033} y={-hh * 0.38 + h * 0.34} width={i % 3 ? 1.6 : 3} height={h * 0.18} fill={INK} />
          ))}
          {/* FRAGILE stamp */}
          <g transform={`translate(${hw * 0.5} ${hh * 0.25}) rotate(-12)`}>
            <rect x={-w * 0.2} y={-h * 0.1} width={w * 0.4} height={h * 0.2} fill="none" stroke="#c0312b" strokeWidth={2.5} />
            <Unmirror on={mirror} cx={0}>
              <text x={0} y={h * 0.055} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={h * 0.12} fill="#c0312b">
                FRAGILE
              </text>
            </Unmirror>
          </g>
          {/* this side up */}
          {[hw * 0.32, hw * 0.62].map((ax, i) => (
            <path key={i} d={`M${ax},${-hh * 0.32} l0,-${h * 0.16} m-5,6 l5,-6 l5,6`} stroke={INK} strokeWidth={2} fill="none" />
          ))}
        </>
      ) : null}
      {/* front flaps (in front when open) */}
      {open > 0.02 ? (
        <path d={`M${-hw},${-hh} L${hw},${-hh}`} stroke={INK} strokeWidth={5} />
      ) : null}
    </g>
  );
};

/** Pink bottle of baby oil with a rubber-duck label. Centred on (x, y), ~110 tall at s = 1. */
export const BabyOilBottle: React.FC<{ x: number; y: number; s?: number; rot?: number; mirror?: boolean; shine?: number }> = ({ x, y, s = 1, rot = 0, mirror = false, shine = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {shine > 0 ? <circle r={90} fill="#ffe7f2" opacity={0.25 * shine} style={{ mixBlendMode: "screen" }} /> : null}
    <rect x={-12} y={-60} width={24} height={16} rx={3} fill="#f4efe6" stroke={INK} strokeWidth={4} />
    <path d="M-15,-62 L15,-62 L13,-76 Q0,-82 -13,-76 Z" fill="#e24f8e" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M-24,-46 Q-26,-50 -18,-50 L18,-50 Q26,-50 24,-46 L26,40 Q26,52 14,52 L-14,52 Q-26,52 -26,40 Z" fill="#f5a9c8" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-16,-40 L-16,34" stroke="#fde3ee" strokeWidth={6} strokeLinecap="round" opacity={0.85} />
    <rect x={-19} y={-26} width={38} height={50} rx={5} fill="#fbf4dc" stroke={INK} strokeWidth={2.5} />
    <Unmirror on={mirror} cx={0}>
      <text x={0} y={-12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={11} fill="#d2417f">
        BABY
      </text>
      <text x={0} y={2} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={12.5} fill="#d2417f">
        OIL
      </text>
    </Unmirror>
    {/* rubber duck */}
    <g transform="translate(-1 13)">
      <ellipse cx={0} cy={2} rx={9} ry={5.5} fill="#f3cc3a" stroke={INK} strokeWidth={1.6} />
      <circle cx={5} cy={-4} r={4.5} fill="#f3cc3a" stroke={INK} strokeWidth={1.6} />
      <path d="M9,-4 l5,1 l-5,2 Z" fill="#e8812a" stroke={INK} strokeWidth={1} />
      <circle cx={6} cy={-5} r={1} fill={INK} />
    </g>
  </g>
);

/** Striped cone party hat with a pom-pom; (x, y) = middle of the brim. */
export const PartyHat: React.FC<{ x: number; y: number; s?: number; rot?: number; colors?: [string, string]; elastic?: number }> = ({
  x,
  y,
  s = 1,
  rot = 0,
  colors = ["#ff4fb4", "#ffd34a"],
  elastic = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {elastic > 0 ? <path d={`M-22,0 Q0,${elastic} 22,0`} stroke="#f4f0e8" strokeWidth={2} fill="none" /> : null}
    <path d="M-26,0 L0,-74 L26,0 Z" fill={colors[0]} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M-17,-25 L-8,-48 L8,-48 L17,-25 Z" fill={colors[1]} opacity={0.95} />
    <path d="M-22,-10 L22,-10 L24,-4 L-24,-4 Z" fill={colors[1]} opacity={0.95} />
    <path d="M-26,0 L26,0" stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={-76} r={9} fill={colors[1]} stroke={INK} strokeWidth={3} />
    {[-40, -20, 0, 20, 40].map((a, i) => (
      <path key={i} d="M0,-76 l0,-14" transform={`rotate(${a} 0 -76)`} stroke={colors[1]} strokeWidth={3} strokeLinecap="round" />
    ))}
  </g>
);

/** Squeaky rubber dog toy shaped like a grinning mule head (Dobbins merch). `squash` 0..1 when stepped on. */
export const SqueakyToy: React.FC<{ x: number; y: number; squash?: number; s?: number }> = ({ x, y, squash = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s * (1 + squash * 0.35)} ${s * (1 - squash * 0.5)})`}>
    <ellipse cx={0} cy={-2} rx={44} ry={8} fill="#000" opacity={0.3} />
    <path d="M-34,-6 C-40,-40 -6,-52 18,-40 C40,-30 46,-14 38,-4 Z" fill="#c9b7a8" stroke={INK} strokeWidth={4} />
    <path d="M-20,-38 L-34,-70 L-10,-44 Z M-4,-44 L-6,-78 L8,-44 Z" fill="#c9b7a8" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M6,-18 Q22,-8 38,-12" stroke={INK} strokeWidth={3} fill="#f2ead2" />
    {[10, 18, 26, 33].map((tx, i) => (
      <rect key={i} x={tx - 3} y={-16 + i * 0.6} width={6} height={7} fill="#f6efd6" stroke={INK} strokeWidth={1.2} />
    ))}
    <circle cx={-6} cy={-28} r={5} fill="#f8f4ea" stroke={INK} strokeWidth={2} />
    <circle cx={-5} cy={-28} r={1.8} fill={INK} />
  </g>
);

/** Little burst of "squeak" marks around a point. */
export const SqueakLines: React.FC<{ x: number; y: number; k: number; s?: number }> = ({ x, y, k, s = 1 }) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, k * 1.4)} stroke={INK} strokeWidth={5} strokeLinecap="round">
      {[-60, -25, 15, 50].map((a, i) => (
        <path key={i} d={`M0,${-40 - k * 30} l0,${-26 - k * 10}`} transform={`rotate(${a})`} />
      ))}
    </g>
  );
