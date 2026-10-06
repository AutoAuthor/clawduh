import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { Flies, INK, Shadow, blinkAmount } from "../../../characters/parts";
import { Pt, blob, onN, rnd, smoothPath } from "../../../engine/util";

/**
 * The FOUL BINARY SYSTEM: two grotesque party mascots, equally gross on purpose.
 *  - the TUSKER (red): a bloated, wrinkled, elephant-ish blob with a snotty trunk, broken tusks and beady eyes.
 *  - the BRAYER (blue): a saggy, donkey-ish blob with floppy ears, bulging mismatched eyes and enormous buck teeth.
 * Origin = floor under the middle. Both face right by default (flip to face left).
 */

export interface MascotProps {
  id: string;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  t: number;
  frame: number;
  /** 0..1 jaw open (snarl / roar) */
  open?: number;
  /** 0..1 stubby arms raised, grabbing */
  reach?: number;
  /** 0..1 caked in mud */
  mud?: number;
  /** where the eyes look */
  look?: Pt;
  /** 0..1 eyes glow in the dark (the tail) */
  glow?: number;
  /** grin instead of snarl */
  grin?: boolean;
  /** 0..1 rosette pinned on (campaign) */
  rosette?: number;
}

const MUD = "#5a4128";

function Rosette({ x, y, col }: { x: number; y: number; col: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-10,8 L-18,40 L-6,32 L0,44 L4,10 Z M10,8 L18,40 L6,32 L0,44 L-4,10 Z" fill={col} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d="M0,0 L6,-20 L-6,-20 Z" transform={`rotate(${i * 30})`} fill={col} stroke={INK} strokeWidth={2} />
      ))}
      <circle r={13} fill="#f6efd8" stroke={INK} strokeWidth={3} />
      <path d="M0,-7 l2,5 l5,0 l-4,3 l2,6 l-5,-4 l-5,4 l2,-6 l-4,-3 l5,0 Z" fill={col} />
    </g>
  );
}

const stubArm = (sh: Pt, reach: number, side: number, col: string, dk: string, t: number, id: string) => {
  const wob = Math.sin(t * 9 + side) * 8 * reach;
  const hand: Pt = [sh[0] + side * (40 - reach * 10), sh[1] + 60 - reach * 170 + wob];
  const mid: Pt = [(sh[0] + hand[0]) / 2 + side * 26, (sh[1] + hand[1]) / 2 + 10];
  const d = smoothPath([sh, mid, hand], false);
  return (
    <g key={`${id}${side}`}>
      <path d={d} stroke={INK} strokeWidth={42} fill="none" strokeLinecap="round" />
      <path d={d} stroke={col} strokeWidth={30} fill="none" strokeLinecap="round" />
      {[-0.6, 0, 0.6].map((a, i) => (
        <path key={i} d={`M${hand[0]},${hand[1]} l${Math.sin(a) * 20 + side * 4},${-Math.cos(a) * 22 * (reach > 0.3 ? 1 : -1)}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      ))}
      <circle cx={hand[0]} cy={hand[1]} r={17} fill={dk} stroke={INK} strokeWidth={4} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* RED: the tusker                                                      */
/* ------------------------------------------------------------------ */

export const Tusker: React.FC<MascotProps> = ({ id, x, y, scale = 1, flip = false, t, frame, open = 0.3, reach = 0, mud = 0, look = [0.6, 0], glow = 0, grin = false, rosette = 0 }) => {
  const f2 = onN(frame, 2);
  const breathe = Math.sin((f2 / 24) * 3) * 4;
  const RED = "#c6382c";
  const RED_DK = "#8c2018";
  const geo = useMemo(
    () => ({
      body: blob(0, -190, 170, 160, 14, 0.07, id + "tb"),
      wrinkles: Array.from({ length: 9 }).map((_, i) => `M${-110 + rnd(`${id}w${i}`) * 200},${-260 + rnd(`${id}wy${i}`) * 180} q14,-10 28,0 q14,-10 28,0`),
      spots: Array.from({ length: 6 }).map((_, i) => blob(-100 + rnd(`${id}s${i}`) * 200, -280 + rnd(`${id}sy${i}`) * 200, 10 + rnd(`${id}sr${i}`) * 14, 8 + rnd(`${id}sr2${i}`) * 10, 7, 0.3, `${id}spot${i}`)),
    }),
    [id],
  );
  const blink = blinkAmount(t, id, 2.6);
  const trunkSw = noise2D(id + "trunk", f2 / 24, 0) * 16;
  const jaw = open * 60;
  const s = flip ? -scale : scale;
  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={0} cy={4} rx={180} o={0.4} />
      {/* stubby legs */}
      {[-90, 70].map((lx, i) => (
        <g key={i}>
          <rect x={lx - 30} y={-80} width={60} height={80} rx={20} fill={i ? RED : RED_DK} stroke={INK} strokeWidth={5} />
          <path d={`M${lx - 26},-6 l10,-10 M${lx - 4},-4 l0,-12 M${lx + 18},-6 l-8,-10`} stroke="#f0e2b0" strokeWidth={6} strokeLinecap="round" />
        </g>
      ))}
      {stubArm([-120, -230], reach, -1, RED_DK, RED_DK, t, id + "aB")}
      {/* the bloated body */}
      <g transform={`translate(0 ${breathe}) scale(${1 + breathe * 0.004} ${1 - breathe * 0.003})`}>
        <path d={geo.body} fill={RED} stroke={INK} strokeWidth={6} />
        <path d={blob(30, -130, 100, 70, 10, 0.1, id + "belly")} fill="#e2786a" opacity={0.7} />
        {geo.wrinkles.map((d, i) => (
          <path key={i} d={d} stroke={RED_DK} strokeWidth={4} fill="none" />
        ))}
        {geo.spots.map((d, i) => (
          <path key={i} d={d} fill={RED_DK} opacity={0.5} />
        ))}
        {/* floppy ear */}
        <path d={blob(-90, -260, 66, 80, 10, 0.12, id + "ear")} fill={RED_DK} stroke={INK} strokeWidth={5} />
        <path d={blob(-86, -256, 40, 52, 9, 0.15, id + "ear2")} fill="#e2786a" opacity={0.6} />
        {/* hair tuft */}
        <path d="M-10,-344 q-10,-40 6,-60 M6,-346 q4,-44 30,-56 M20,-342 q20,-30 50,-30" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        {/* eyes: small, beady, bloodshot (or glowing in the dark) */}
        {[
          [30, -270, 18],
          [92, -262, 16],
        ].map(([ex, ey, r], i) => (
          <g key={i}>
            <circle cx={ex} cy={ey} r={r} fill={glow > 0 ? "#fff27a" : "#f2e6a8"} stroke={INK} strokeWidth={4} />
            <circle cx={ex + look[0] * r * 0.4} cy={ey + look[1] * r * 0.4} r={r * 0.36} fill={glow > 0 ? "#c22a12" : INK} />
            <path d={`M${ex - r},${ey - r * 0.2 - 4} L${ex + r},${ey - r * 0.6 - 6}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
            {blink > 0.5 ? <path d={`M${ex - r},${ey} L${ex + r},${ey}`} stroke={INK} strokeWidth={6} /> : null}
            {glow > 0 ? <circle cx={ex} cy={ey} r={r * 2.2} fill="#ffe24a" opacity={0.3 * glow} style={{ mixBlendMode: "screen" }} /> : null}
          </g>
        ))}
        {/* mouth + jaw */}
        <path d={`M40,-200 Q100,${-196 + (grin ? 30 : 0)} 150,-212 L150,${-200 + jaw} Q96,${-170 + jaw * 1.3} 40,${-190 + jaw * 0.6} Z`} fill="#3a0e0e" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {[56, 80, 104, 128].map((tx, i) => (
          <path key={i} d={`M${tx},-204 l10,0 l-4,${14 + (i % 2) * 8} Z`} fill="#f0e2a8" stroke={INK} strokeWidth={2.5} />
        ))}
        {open > 0.2 ? <path d={`M70,${-188 + jaw} q30,${14 + jaw * 0.3} 60,0`} stroke="#c0606a" strokeWidth={12} fill="none" strokeLinecap="round" /> : null}
        {/* drool */}
        <path d={`M120,${-196 + jaw} q-4,${30 + Math.sin(t * 3) * 8} 2,${50 + Math.sin(t * 3) * 10}`} stroke="#d8eef2" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.85} />
        {/* broken tusks */}
        <path d="M150,-214 q40,10 52,-30 l-12,-4 q-10,24 -40,14 Z" fill="#efe2b0" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M44,-206 q10,24 34,22 l2,-10 q-18,0 -24,-16 Z" fill="#d8c88a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {/* the trunk, snotty */}
        <path d={`M120,-250 C170,-250 ${200 + trunkSw},-220 ${206 + trunkSw},-170 C${210 + trunkSw},-140 ${190 + trunkSw},-124 ${178 + trunkSw},-140`} stroke={INK} strokeWidth={46} fill="none" strokeLinecap="round" />
        <path d={`M120,-250 C170,-250 ${200 + trunkSw},-220 ${206 + trunkSw},-170 C${210 + trunkSw},-140 ${190 + trunkSw},-124 ${178 + trunkSw},-140`} stroke={RED} strokeWidth={34} fill="none" strokeLinecap="round" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${150 + i * 16 + trunkSw * (i / 4)},${-244 + i * 22} l12,6`} stroke={RED_DK} strokeWidth={4} />
        ))}
        <path d={`M${180 + trunkSw},-132 q-2,20 4,34`} stroke="#b8d870" strokeWidth={7} fill="none" strokeLinecap="round" />
        {mud > 0 ? (
          <g opacity={mud}>
            <path d={blob(-20, -70, 160, 50, 12, 0.3, id + "mud1")} fill={MUD} />
            <path d={blob(60, -300, 40, 20, 8, 0.4, id + "mud2")} fill={MUD} />
            <path d="M-80,-120 q4,30 0,50 M40,-110 q-4,24 2,44" stroke={MUD} strokeWidth={10} strokeLinecap="round" />
          </g>
        ) : null}
        {rosette > 0 ? <Rosette x={-30} y={-180} col="#c6382c" /> : null}
      </g>
      {stubArm([110, -200], reach, 1, RED, RED_DK, t + 1, id + "aF")}
      <Flies cx={60} cy={-360} count={3} t={t} r={120} seed={id + "fl"} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* BLUE: the brayer                                                     */
/* ------------------------------------------------------------------ */

export const Brayer: React.FC<MascotProps> = ({ id, x, y, scale = 1, flip = false, t, frame, open = 0.3, reach = 0, mud = 0, look = [0.6, 0], glow = 0, grin = false, rosette = 0 }) => {
  const f2 = onN(frame, 2);
  const sag = Math.sin((f2 / 24) * 2.6 + 1) * 5;
  const BLUE = "#2f5ca8";
  const BLUE_DK = "#1c3a74";
  const geo = useMemo(
    () => ({
      body: smoothPath(
        [
          [-150, -10],
          [150, -10],
          [170, -110],
          [120, -230],
          [60, -300],
          [-50, -300],
          [-120, -230],
          [-170, -110],
        ],
        true,
        0.9,
      ),
      spots: Array.from({ length: 6 }).map((_, i) => blob(-110 + rnd(`${id}s${i}`) * 220, -240 + rnd(`${id}sy${i}`) * 200, 8 + rnd(`${id}sr${i}`) * 12, 6 + rnd(`${id}sr2${i}`) * 9, 7, 0.3, `${id}spot${i}`)),
    }),
    [id],
  );
  const blink = blinkAmount(t, id, 3.3);
  const ear = Math.sin((f2 / 24) * 2) * 6;
  const jaw = open * 70;
  const s = flip ? -scale : scale;
  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={0} cy={4} rx={170} o={0.4} />
      {[-80, 80].map((lx, i) => (
        <g key={i}>
          <rect x={lx - 26} y={-70} width={52} height={70} rx={14} fill={i ? BLUE : BLUE_DK} stroke={INK} strokeWidth={5} />
          <rect x={lx - 30} y={-18} width={60} height={20} rx={6} fill="#2a2420" stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {stubArm([-120, -190], reach, -1, BLUE_DK, BLUE_DK, t, id + "aB")}
      <g transform={`translate(0 ${sag * 0.5})`}>
        <path d={geo.body} fill={BLUE} stroke={INK} strokeWidth={6} />
        <path d={blob(20, -100, 110, 70, 10, 0.12, id + "belly")} fill="#6a8ad0" opacity={0.6} />
        {geo.spots.map((d, i) => (
          <path key={i} d={d} fill={BLUE_DK} opacity={0.45} />
        ))}
        {/* long floppy ears */}
        <path d={`M-30,-290 C-60,-380 ${-40 + ear},-470 ${-10 + ear},-440 C10,-400 0,-330 -4,-292 Z`} fill={BLUE_DK} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M30,-296 C40,-380 ${90 - ear},-440 ${110 - ear},-410 C120,-380 70,-330 50,-292 Z`} fill={BLUE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M44,-310 C60,-360 ${86 - ear},-396 ${98 - ear},-400`} stroke="#8aa6dc" strokeWidth={8} fill="none" strokeLinecap="round" />
        {/* mane tuft */}
        <path d="M-20,-300 l-10,-30 l18,14 l4,-34 l14,30 l14,-26 l2,34" fill="#1a2440" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {/* bulging, mismatched eyes */}
        {[
          [-10, -236, 30],
          [64, -244, 22],
        ].map(([ex, ey, r], i) => (
          <g key={i}>
            <circle cx={ex} cy={ey} r={r} fill={glow > 0 ? "#fff27a" : "#f4eecc"} stroke={INK} strokeWidth={4.5} />
            <path d={`M${ex - r * 0.8},${ey + r * 0.2} q${r * 0.6},${-r * 0.3} ${r * 1.4},${r * 0.1}`} stroke="#c23a3a" strokeWidth={2} fill="none" />
            <circle cx={ex + look[0] * r * 0.45} cy={ey + look[1] * r * 0.45} r={r * (i ? 0.5 : 0.22)} fill={glow > 0 ? "#c22a12" : INK} />
            {blink > 0.5 ? <path d={`M${ex - r},${ey} L${ex + r},${ey}`} stroke={INK} strokeWidth={6} /> : null}
            {glow > 0 ? <circle cx={ex} cy={ey} r={r * 2} fill="#ffe24a" opacity={0.3 * glow} style={{ mixBlendMode: "screen" }} /> : null}
          </g>
        ))}
        {/* long muzzle with nostrils */}
        <path d={`M40,-200 C120,-220 200,-196 206,-150 C210,${-110 + jaw * 0.3} 150,${-96 + jaw * 0.5} 60,-110 Z`} fill="#9fb6dc" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <ellipse cx={176} cy={-176} rx={12} ry={8} fill={INK} />
        <ellipse cx={150} cy={-184} rx={10} ry={7} fill={INK} />
        {/* mouth + the enormous buck teeth */}
        <path d={`M90,-140 Q150,${-136 + (grin ? 22 : 0)} 200,-140 L198,${-132 + jaw} Q140,${-104 + jaw * 1.2} 90,${-130 + jaw * 0.5} Z`} fill="#3a0e0e" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={150} y={-142} width={22} height={34} rx={4} fill="#f6edc4" stroke={INK} strokeWidth={4} />
        <rect x={172} y={-142} width={22} height={30} rx={4} fill="#e6d8a0" stroke={INK} strokeWidth={4} />
        <path d={`M120,${-128 + jaw} q-6,${28 + Math.sin(t * 2.6) * 8} 0,${46 + Math.sin(t * 2.6) * 10}`} stroke="#d8eef2" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.85} />
        {mud > 0 ? (
          <g opacity={mud}>
            <path d={blob(0, -60, 160, 46, 12, 0.3, id + "mud1")} fill={MUD} />
            <path d={blob(-60, -200, 34, 22, 8, 0.4, id + "mud2")} fill={MUD} />
            <path d="M-60,-100 q4,30 0,50 M60,-100 q-4,24 2,44" stroke={MUD} strokeWidth={10} strokeLinecap="round" />
          </g>
        ) : null}
        {rosette > 0 ? <Rosette x={-40} y={-150} col="#2f5ca8" /> : null}
      </g>
      {stubArm([110, -170], reach, 1, BLUE, BLUE_DK, t + 2, id + "aF")}
      <Flies cx={40} cy={-340} count={3} t={t + 5} r={120} seed={id + "fl"} />
    </g>
  );
};
