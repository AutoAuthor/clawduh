import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { Pt, blob, cloudPath, onN, rnd, smoothPath } from "../engine/util";
import { INK } from "./parts";

/* ------------------------------------------------------------------ */
/* Fire                                                                */
/* ------------------------------------------------------------------ */

/** Layered flickering flames. Origin = base centre. */
export const Flames: React.FC<{ x: number; y: number; w: number; h: number; t: number; seed?: string; n?: number }> = ({
  x,
  y,
  w,
  h,
  t,
  seed = "fl",
  n = 7,
}) => {
  const t2 = Math.floor(t * 12) / 12;
  const layers = [
    { c: "#a8200f", k: 1.0 },
    { c: "#e4571a", k: 0.78 },
    { c: "#f6b23a", k: 0.55 },
    { c: "#fff0a8", k: 0.3 },
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      {layers.map((L, li) => (
        <g key={li}>
          {Array.from({ length: n }).map((_, i) => {
            const fx = (i / (n - 1) - 0.5) * w * 0.8 * L.k;
            const fh = h * L.k * (0.6 + 0.4 * Math.abs(noise2D(`${seed}${i}${li}`, t2 * 2.4, i)));
            const fw = (w / n) * 1.6 * L.k + 10;
            const lean = noise2D(`${seed}l${i}`, t2 * 1.5, li) * fw * 0.8;
            const d = `M${fx - fw / 2},0 C${fx - fw / 2},${-fh * 0.4} ${fx + lean - fw * 0.2},${-fh * 0.7} ${fx + lean},${-fh} C${fx + lean + fw * 0.2},${-fh * 0.7} ${fx + fw / 2},${-fh * 0.4} ${fx + fw / 2},0 Z`;
            return <path key={i} d={d} fill={L.c} stroke={li === 0 ? INK : "none"} strokeWidth={4} />;
          })}
        </g>
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The furry red demon                                                 */
/* ------------------------------------------------------------------ */

export const FoxDemon: React.FC<{ x: number; y: number; s?: number; t: number; snarl?: number }> = ({ x, y, s = 1, t, snarl = 1 }) => {
  const breathe = Math.sin(t * 5) * 4;
  const jaw = 18 + snarl * 30 + Math.abs(Math.sin(t * 7)) * 10;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* ears */}
      <path d="M-150,-170 L-110,-330 L-40,-200 Z" fill="#b8361a" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M150,-170 L110,-330 L40,-200 Z" fill="#b8361a" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M-118,-200 L-106,-290 L-66,-210 Z" fill="#3a0d08" />
      <path d="M118,-200 L106,-290 L66,-210 Z" fill="#3a0d08" />
      {/* head */}
      <path
        d={`M-190,-120 C-200,-220 -80,-240 0,-236 C80,-240 200,-220 190,-120 C180,-40 90,${40 + breathe} 0,${120 + breathe} C-90,${40 + breathe} -180,-40 -190,-120 Z`}
        fill="#c4401c"
        stroke={INK}
        strokeWidth={9}
        strokeLinejoin="round"
      />
      {/* white cheek fur, jagged */}
      <path d="M-186,-100 L-150,-60 L-160,-30 L-110,-20 L-120,10 L-60,20 L-40,70 L-10,40 L0,110 L-90,40 C-150,-10 -180,-50 -186,-100 Z" fill="#efe4d0" stroke={INK} strokeWidth={5} />
      <path d="M186,-100 L150,-60 L160,-30 L110,-20 L120,10 L60,20 L40,70 L10,40 L0,110 L90,40 C150,-10 180,-50 186,-100 Z" fill="#efe4d0" stroke={INK} strokeWidth={5} />
      {/* eyes */}
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`translate(${sd * 72} -140) rotate(${sd * 18})`}>
          <ellipse rx={46} ry={22} fill="#fff27a" opacity={0.25} />
          <path d="M-36,0 Q0,-26 36,0 Q0,18 -36,0 Z" fill="#ffe94a" stroke={INK} strokeWidth={6} />
          <ellipse cx={0} cy={-1} rx={5} ry={14} fill={INK} />
        </g>
      ))}
      <path d="M-120,-188 L-36,-160 M120,-188 L36,-160" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      {/* snout + jaws */}
      <path d={`M-70,-30 C-40,-60 40,-60 70,-30 L60,${-10 + jaw * 0.2} L-60,${-10 + jaw * 0.2} Z`} fill="#c4401c" stroke={INK} strokeWidth={6} />
      <ellipse cx={0} cy={-52} rx={22} ry={14} fill={INK} />
      <path d={`M-62,-14 Q0,${-10 + jaw} 62,-14 Q0,${10 + jaw * 1.8} -62,-14 Z`} fill="#3a0606" stroke={INK} strokeWidth={6} />
      {Array.from({ length: 6 }).map((_, i) => {
        const fx = -50 + i * 20;
        return <path key={i} d={`M${fx},-12 l8,${20 + (i % 2) * 8} l8,-20 Z`} fill="#f4eedc" stroke={INK} strokeWidth={2.5} />;
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const fx = -40 + i * 20;
        const by = -6 + jaw * 1.3;
        return <path key={i} d={`M${fx},${by} l8,${-18 - (i % 2) * 6} l8,18 Z`} fill="#f4eedc" stroke={INK} strokeWidth={2.5} />;
      })}
      {/* drool */}
      <path d={`M30,${jaw * 1.2} q4,${30 + Math.sin(t * 3) * 10} -2,${60 + Math.sin(t * 3) * 14}`} stroke="#d6e4ec" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The feathered ones                                                  */
/* ------------------------------------------------------------------ */

export const Chicken: React.FC<{ x: number; y: number; s?: number; t: number; seed: string; flip?: boolean }> = ({ x, y, s = 1, t, seed, flip }) => {
  const run = Math.floor(t * 16) % 2;
  const hop = Math.abs(Math.sin(t * 16 + rnd(seed) * 6)) * 14;
  return (
    <g transform={`translate(${x} ${y - hop}) scale(${flip ? -s : s} ${s})`}>
      <path d={run ? "M-8,0 L-16,40 M8,0 L18,38" : "M-8,0 L2,40 M8,0 L-4,38"} stroke="#d9a22a" strokeWidth={6} strokeLinecap="round" />
      <path d={blob(0, -20, 46, 34, 9, 0.12, seed + "b")} fill="#f2ede0" stroke={INK} strokeWidth={5} />
      <path d="M30,-40 C40,-80 70,-80 70,-50 C70,-30 50,-24 36,-26 Z" fill="#f2ede0" stroke={INK} strokeWidth={5} />
      <path d="M48,-74 l6,-16 l6,12 l6,-12 l4,18 Z" fill="#c81e1e" stroke={INK} strokeWidth={3} />
      <path d="M68,-54 l18,6 l-18,6 Z" fill="#e8a52c" stroke={INK} strokeWidth={3} />
      <circle cx={56} cy={-56} r={6} fill="#fff" stroke={INK} strokeWidth={2} />
      <circle cx={57} cy={-56} r={2.4} fill={INK} />
      <path d="M-30,-30 C-60,-50 -66,-20 -50,-6" fill="#e6dfcf" stroke={INK} strokeWidth={4} />
      <path d={run ? "M-10,-20 C-30,-60 10,-60 10,-24" : "M-10,-20 C-30,-40 10,-40 10,-14"} fill="#e6dfcf" stroke={INK} strokeWidth={4} />
    </g>
  );
};

export const Feathers: React.FC<{ t: number; n?: number; seed?: string; area?: [number, number, number, number] }> = ({
  t,
  n = 14,
  seed = "fth",
  area = [0, 0, 1920, 1080],
}) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const [x0, y0, w, h] = area;
      const fx = x0 + rnd(`${seed}x${i}`) * w + Math.sin(t * 2 + i) * 30;
      const fy = y0 + ((rnd(`${seed}y${i}`) * h + t * (40 + rnd(`${seed}v${i}`) * 50)) % h);
      const r = Math.sin(t * 3 + i) * 40;
      return (
        <g key={i} transform={`translate(${fx} ${fy}) rotate(${r})`}>
          <path d="M0,-18 C10,-10 10,10 0,18 C-10,10 -10,-10 0,-18 Z" fill="#f2ede0" stroke={INK} strokeWidth={2.5} />
          <line x1={0} y1={-18} x2={0} y2={24} stroke={INK} strokeWidth={2} />
        </g>
      );
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* The roaring beast (pickup truck with a face)                        */
/* ------------------------------------------------------------------ */

export const Truck: React.FC<{ x: number; y: number; s?: number; t: number; rumble?: number; lights?: number; cargo?: React.ReactNode; flip?: boolean }> = ({
  x,
  y,
  s = 1,
  t,
  rumble = 1,
  lights = 1,
  cargo,
  flip = false,
}) => {
  const bump = Math.round(Math.sin(t * 28) * 3 * rumble);
  const wheelRot = t * 600 * rumble;
  return (
    <g transform={`translate(${x} ${y + bump}) scale(${flip ? -s : s} ${s})`}>
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff2b0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff2b0" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* headlight beams */}
      <path d="M-300,-150 L-900,-260 L-900,40 L-300,-110 Z" fill="url(#beam)" opacity={lights} transform="scale(-1 1) translate(-600 0)" />
      {/* bed + cab */}
      {cargo}
      <path d="M-330,-60 L-330,-170 L40,-170 L40,-60 Z" fill="#5a3226" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M-330,-150 L40,-150" stroke="#3d1f17" strokeWidth={6} />
      <path d="M40,-60 L40,-290 Q50,-320 90,-320 L230,-320 Q270,-320 290,-250 L330,-180 L340,-60 Z" fill="#6b3a2a" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M80,-290 L220,-290 Q250,-290 262,-240 L280,-196 L80,-196 Z" fill="#1d1a22" stroke={INK} strokeWidth={6} />
      <path d="M150,-290 L150,-196" stroke={INK} strokeWidth={6} />
      {/* rust patches */}
      <path d={blob(-180, -110, 50, 22, 8, 0.3, "rust1")} fill="#7a3f22" opacity={0.8} />
      <path d={blob(200, -110, 40, 18, 8, 0.3, "rust2")} fill="#7a3f22" opacity={0.8} />
      {/* monster face: headlight eye + grille teeth */}
      <circle cx={318} cy={-150} r={30} fill={lights > 0.1 ? "#fff1a8" : "#4a4030"} stroke={INK} strokeWidth={6} />
      <circle cx={318} cy={-150} r={50} fill="#fff1a8" opacity={0.25 * lights} />
      <path d="M296,-178 L346,-166" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M300,-118 L352,-110 L352,-66 L300,-62 Z" fill="#1a1414" stroke={INK} strokeWidth={5} />
      {Array.from({ length: 5 }).map((_, i) => (
        <path key={i} d={`M${302 + i * 10},-116 l5,16 l5,-16 M${302 + i * 10},-64 l5,-14 l5,14`} fill="#d6d2c0" stroke={INK} strokeWidth={2} />
      ))}
      <rect x={330} y={-70} width={30} height={16} fill="#9b9688" stroke={INK} strokeWidth={4} />
      {/* wheels */}
      {[-210, 210].map((wx) => (
        <g key={wx} transform={`translate(${wx} -50)`}>
          <circle r={62} fill="#151214" stroke={INK} strokeWidth={6} />
          <circle r={28} fill="#5c5650" stroke={INK} strokeWidth={4} />
          <g transform={`rotate(${wheelRot})`}>
            <line x1={-26} y1={0} x2={26} y2={0} stroke={INK} strokeWidth={5} />
            <line x1={0} y1={-26} x2={0} y2={26} stroke={INK} strokeWidth={5} />
          </g>
        </g>
      ))}
      {/* exhaust */}
      {rumble > 0
        ? [0, 1, 2].map((i) => {
            const ph = (t * 1.6 + i / 3) % 1;
            return <circle key={i} cx={-350 - ph * 160} cy={-70 - ph * 70} r={14 + ph * 40} fill="#5d5864" opacity={(1 - ph) * 0.6} stroke={INK} strokeWidth={3} />;
          })
        : null}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Dumpling seen from behind (walking into the light)                  */
/* ------------------------------------------------------------------ */

export const DumplingBack: React.FC<{ x: number; y: number; s?: number; t: number; walk?: number }> = ({ x, y, s = 1, t, walk = 1 }) => {
  const body = useMemo(() => cloudPath(0, -170, 170, 150, 22, "dback"), []);
  const step = Math.sin(t * 10) * walk;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={170} ry={26} fill="#000" opacity={0.5} />
      <rect x={-90} y={-70 + Math.max(0, step) * -14} width={36} height={70} rx={12} fill="#231b1c" stroke={INK} strokeWidth={5} />
      <rect x={54} y={-70 + Math.max(0, -step) * -14} width={36} height={70} rx={12} fill="#231b1c" stroke={INK} strokeWidth={5} />
      <g transform={`rotate(${step * 3} 0 -100)`}>
        <path d="M-120,-280 C-170,-300 -210,-290 -220,-268 C-200,-254 -160,-262 -120,-262 Z" fill="#2b2325" stroke={INK} strokeWidth={5} />
        <path d="M120,-280 C170,-300 210,-290 220,-268 C200,-254 160,-262 120,-262 Z" fill="#2b2325" stroke={INK} strokeWidth={5} />
        <path d={body} fill="#efe7d3" stroke={INK} strokeWidth={6} />
        <path d={cloudPath(0, -310, 60, 26, 10, "dbackhead")} fill="#efe7d3" stroke={INK} strokeWidth={5} />
        <path d={cloudPath(0, -110, 24, 20, 7, "dbacktail")} fill="#efe7d3" stroke={INK} strokeWidth={5} transform={`rotate(${Math.sin(t * 14) * 15} 0 -110)`} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Ornate portrait frame with a mourning ribbon                        */
/* ------------------------------------------------------------------ */

export const Portrait: React.FC<{ x: number; y: number; w: number; h: number; children: React.ReactNode; seed: string; tilt?: number; ribbon?: boolean; label?: string }> = ({
  x,
  y,
  w,
  h,
  children,
  seed,
  tilt = 0,
  ribbon = true,
  label,
}) => {
  const clip = `pclip-${seed}`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <line x1={0} y1={-h / 2 - 10} x2={-w * 0.3} y2={-h / 2 - 60} stroke="#2a1d14" strokeWidth={3} />
      <line x1={0} y1={-h / 2 - 10} x2={w * 0.3} y2={-h / 2 - 60} stroke="#2a1d14" strokeWidth={3} />
      <circle cx={0} cy={-h / 2 - 62} r={5} fill="#5a5048" />
      <rect x={-w / 2 - 26} y={-h / 2 - 26} width={w + 52} height={h + 52} rx={10} fill="#6e5124" stroke={INK} strokeWidth={6} />
      <rect x={-w / 2 - 14} y={-h / 2 - 14} width={w + 28} height={h + 28} rx={6} fill="#a6823c" stroke={INK} strokeWidth={4} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sy], i) => (
        <circle key={i} cx={(sx * (w + 26)) / 2} cy={(sy * (h + 26)) / 2} r={12} fill="#c9a24c" stroke={INK} strokeWidth={4} />
      ))}
      <defs>
        <clipPath id={clip}>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} />
        </clipPath>
      </defs>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#3b2f3a" stroke={INK} strokeWidth={4} />
      <g clipPath={`url(#${clip})`}>{children}</g>
      {ribbon ? (
        <path d={`M${w / 2 - 44},${-h / 2 - 26} L${w / 2 + 26},${-h / 2 + 44} L${w / 2 + 26},${-h / 2 + 10} L${w / 2 - 10},${-h / 2 - 26} Z`} fill="#0b0809" />
      ) : null}
      {label ? (
        <g transform={`translate(0 ${h / 2 + 50})`}>
          <rect x={-70} y={-18} width={140} height={34} rx={4} fill="#b89a52" stroke={INK} strokeWidth={3} />
          <text x={0} y={7} textAnchor="middle" fontFamily="SpecialElite" fontSize={20} fill={INK}>
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};

/** Generic sheep bust used inside portraits (lover / father / mother / ancestors). */
export const SheepBust: React.FC<{
  seed: string;
  face?: string;
  wool?: string;
  lashes?: boolean;
  lipstick?: boolean;
  mustache?: boolean;
  monocle?: boolean;
  pearls?: boolean;
  bonnet?: boolean;
  bow?: boolean;
  horns?: boolean;
  glasses?: boolean;
  tophat?: boolean;
}> = ({ seed, face = "#2b2325", wool = "#e9e0cb", lashes, lipstick, mustache, monocle, pearls, bonnet, bow, horns, glasses, tophat }) => (
  <g>
    <rect x={-400} y={-400} width={800} height={800} fill={`hsl(${Math.round(rnd(seed) * 360)},18%,24%)`} />
    <path d={cloudPath(0, 150, 150, 90, 14, seed + "sh")} fill={wool} stroke={INK} strokeWidth={5} />
    {pearls ? <path d="M-70,70 Q0,120 70,70" fill="none" stroke="#f5f0e6" strokeWidth={12} strokeDasharray="1 14" strokeLinecap="round" /> : null}
    {horns ? (
      <>
        <path d="M-50,-60 C-130,-90 -150,10 -90,20 C-60,24 -60,-10 -80,-14" fill="none" stroke="#c9b48a" strokeWidth={22} strokeLinecap="round" />
        <path d="M50,-60 C130,-90 150,10 90,20 C60,24 60,-10 80,-14" fill="none" stroke="#c9b48a" strokeWidth={22} strokeLinecap="round" />
      </>
    ) : null}
    <path d="M-50,-30 C-90,-40 -110,-24 -114,-10 C-96,0 -70,-6 -50,-10 Z" fill={face} stroke={INK} strokeWidth={4} />
    <path d="M50,-30 C90,-40 110,-24 114,-10 C96,0 70,-6 50,-10 Z" fill={face} stroke={INK} strokeWidth={4} />
    <path d={blob(0, 0, 56, 66, 12, 0.05, seed + "f")} fill={face} stroke={INK} strokeWidth={5} />
    <path d={cloudPath(0, -60, 50, 24, 10, seed + "tp")} fill={wool} stroke={INK} strokeWidth={4} />
    {[-1, 1].map((sd) => (
      <g key={sd}>
        <ellipse cx={sd * 22} cy={-12} rx={13} ry={10} fill="#e6d7a8" stroke={INK} strokeWidth={3} />
        <rect x={sd * 22 - 8} y={-14} width={16} height={5} rx={2} fill={INK} />
        {lashes ? <path d={`M${sd * 22 - 12},-20 l-4,-8 M${sd * 22},-22 l0,-9 M${sd * 22 + 12},-20 l4,-8`} stroke={INK} strokeWidth={3} /> : null}
      </g>
    ))}
    <path d="M-20,32 Q0,42 20,32" fill="none" stroke={lipstick ? "#d0263a" : "#4b3a3c"} strokeWidth={lipstick ? 10 : 5} strokeLinecap="round" />
    {mustache ? <path d="M-34,24 C-20,10 -6,18 0,24 C6,18 20,10 34,24 C24,30 10,30 0,26 C-10,30 -24,30 -34,24 Z" fill="#cfc6b0" stroke={INK} strokeWidth={3} /> : null}
    {monocle ? (
      <>
        <circle cx={22} cy={-12} r={18} fill="none" stroke="#c9a24c" strokeWidth={4} />
        <path d="M38,-4 Q50,40 30,80" fill="none" stroke="#c9a24c" strokeWidth={2} />
      </>
    ) : null}
    {glasses ? (
      <g fill="none" stroke="#111" strokeWidth={4}>
        <circle cx={-22} cy={-12} r={17} />
        <circle cx={22} cy={-12} r={17} />
        <line x1={-5} y1={-12} x2={5} y2={-12} />
      </g>
    ) : null}
    {bonnet ? <path d="M-80,-40 C-80,-120 80,-120 80,-40 C60,-70 -60,-70 -80,-40 Z" fill="#d9c9e8" stroke={INK} strokeWidth={4} /> : null}
    {bow ? (
      <g transform="translate(36 -72) rotate(14)">
        <path d="M0,0 L-30,-16 L-30,16 Z M0,0 L30,-16 L30,16 Z" fill="#d23a5a" stroke={INK} strokeWidth={3} />
        <circle r={7} fill="#e85a7a" stroke={INK} strokeWidth={3} />
      </g>
    ) : null}
    {tophat ? (
      <g transform="translate(0 -84)">
        <rect x={-36} y={-70} width={72} height={70} fill="#151215" stroke={INK} strokeWidth={4} />
        <rect x={-58} y={-6} width={116} height={12} rx={5} fill="#151215" stroke={INK} strokeWidth={4} />
      </g>
    ) : null}
  </g>
);

/** Candle with flickering flame. */
export const Candle: React.FC<{ x: number; y: number; s?: number; t: number; seed: string }> = ({ x, y, s = 1, t, seed }) => {
  const f = noise2D(seed, onN(Math.floor(t * 24), 2) * 0.2, 0);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={-96} r={60} fill="#ffcf6a" opacity={0.12 + f * 0.04} />
      <rect x={-12} y={-70} width={24} height={70} fill="#e8e0c8" stroke={INK} strokeWidth={4} />
      <path d="M-12,-70 q6,10 4,22 q4,-14 8,-4" fill="#e8e0c8" stroke={INK} strokeWidth={3} />
      <path d={`M0,-74 C-10,-84 -8,-100 ${f * 4},-${118 + f * 6} C8,-100 10,-84 0,-74 Z`} fill="#ffcf4a" stroke={INK} strokeWidth={3} />
      <path d={`M0,-78 C-4,-84 -3,-94 ${f * 2},-${102 + f * 3} C3,-94 4,-84 0,-78 Z`} fill="#fff6c8" />
    </g>
  );
};

export const pathFrom = (pts: Pt[]) => smoothPath(pts, false);
