import React, { useMemo } from "react";
import { INK, taperPath } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage } from "../../engine/Stage";
import { Pt, blob, clamp, lerp, rnd } from "../../engine/util";
import { Ant, DeadMoth, LooseWing, MothHusk } from "./cast/Husk";
import { Moth, MothProps } from "./cast/Moth";
import { ScreenSpace, useCam } from "./common";
import { Bulb, BulbGlow, Zapper, ZapperGlow } from "./lamp";

/* EPISODE 008: the LAWN under the zapper — "their wings torn and scattered upon the blades of the green". */

export const GROUND_Y = 980;
export const LAWN_ZAP = { x: 1750, y: -1150, s: 1.3 };
export const LAWN_BULB = { x: 1180, y: -1500, r: 70 };

interface Blade {
  d: string;
  tip: Pt;
  col: string;
  x: number;
}

function blades(seed: string, n: number, x0: number, x1: number, hMin: number, hMax: number, w: number, cols: string[]): Blade[] {
  const out: Blade[] = [];
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, (i + rnd(`${seed}j${i}`) * 0.8) / n);
    const h = lerp(hMin, hMax, rnd(`${seed}h${i}`));
    const lean = (rnd(`${seed}l${i}`) - 0.5) * h * 0.5;
    const pts: Pt[] = [
      [x, GROUND_Y + 30],
      [x + lean * 0.15, GROUND_Y - h * 0.35],
      [x + lean * 0.55, GROUND_Y - h * 0.75],
      [x + lean, GROUND_Y - h],
    ];
    out.push({ d: taperPath(pts, w * (0.8 + rnd(`${seed}w${i}`) * 0.5), 2), tip: pts[3], col: cols[i % cols.length], x });
  }
  return out;
}

const DEAD = [
  { x: 60, y: 985, s: 1.3, r: -8 },
  { x: 520, y: 995, s: 1.6, r: 6, torn: true },
  { x: 1500, y: 990, s: 1.4, r: 4, torn: true },
  { x: 1900, y: 1000, s: 1.7, r: 12 },
  { x: 2250, y: 985, s: 1.3, r: -6 },
  { x: 2680, y: 995, s: 1.5, r: 10, torn: true },
  { x: 3100, y: 990, s: 1.4, r: -10 },
];

export interface LawnSceneProps {
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  tatter?: (Partial<MothProps> & { x: number; y: number }) | false;
  /** 0..1 the severed leg twitches */
  legTwitch?: number;
  /** seconds since a fresh crispy one was dropped from the zapper (-1 = none) */
  drop?: number;
  /** wind on the impaled wings */
  wind?: number;
  front?: React.ReactNode;
  dark?: number;
  shakeAmp?: number;
  /** keep foreground blades away from this x (faces in close-ups) */
  clearX?: number;
  /** screen-space overlay (POV lids, framing blades) */
  screen?: React.ReactNode;
}

export const LawnScene: React.FC<LawnSceneProps> = ({ from, to, cam, ease, tatter = false, legTwitch = 0, drop = -1, wind = 0.5, front, dark = 0, shakeAmp = 0, clearX, screen }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = useCam(from, to, ease, cam);
  const geo = useMemo(
    () => ({
      far: blades("lf", 70, -1000, 4000, 160, 420, 16, ["#10211b", "#0e1c17", "#132620"]),
      mid: blades("lm", 46, -900, 3900, 380, 760, 30, ["#22402f", "#1d3828", "#284a36", "#1a3326"]),
      near: blades("ln", 14, -900, 3900, 700, 1150, 70, ["#0b1712", "#0d1a14"]),
      pebbles: Array.from({ length: 30 }).map((_, i) => ({ x: -900 + rnd(`pb${i}`) * 4800, y: GROUND_Y + 20 + rnd(`pby${i}`) * 90, r: 8 + rnd(`pbr${i}`) * 22 })),
      dew: Array.from({ length: 16 }).map((_, i) => ({ b: Math.floor(rnd(`dw${i}`) * 46), k: 0.3 + rnd(`dwk${i}`) * 0.5, r: 7 + rnd(`dwr${i}`) * 9 })),
    }),
    [],
  );
  // wings impaled on blade tips (flags)
  const flags = [3, 9, 15, 22, 28, 35, 41];
  const dropY = drop >= 0 ? Math.min(GROUND_Y - 30, -900 + 0.5 * 2600 * drop * drop) : -9999;
  const landed = drop >= 0 && dropY >= GROUND_Y - 30;
  const landT = landed ? drop - Math.sqrt((2 * (GROUND_Y - 30 + 900)) / 2600) : 0;
  return (
    <Stage cam={c} frame={frame} shakeAmp={shakeAmp}>
      <defs>
        <linearGradient id="lawnBg" gradientUnits="userSpaceOnUse" x1={0} y1={-2200} x2={0} y2={GROUND_Y}>
          <stop offset="0" stopColor="#05070c" />
          <stop offset="0.6" stopColor="#0b141a" />
          <stop offset="1" stopColor="#13241e" />
        </linearGradient>
        <radialGradient id="lawnZap" gradientUnits="userSpaceOnUse" cx={LAWN_ZAP.x} cy={LAWN_ZAP.y} r={2600}>
          <stop offset="0" stopColor="#bfe8ff" stopOpacity={0.6} />
          <stop offset="0.35" stopColor="#5aa8ff" stopOpacity={0.18} />
          <stop offset="1" stopColor="#2a5aff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-3000} y={-4000} width={9000} height={6000} fill="url(#lawnBg)" />
      {/* the underside of the porch: lattice skirting, a crawlspace dark as sin */}
      <rect x={-3000} y={-1900} width={9000} height={1500} fill="#0a0908" />
      <rect x={-3000} y={-520} width={9000} height={120} fill="#2a2420" stroke={INK} strokeWidth={8} />
      {Array.from({ length: 60 }).map((_, i) => (
        <path key={i} d={`M${-3000 + i * 160},-400 L${-2840 + i * 160 + 400},0 M${-2600 + i * 160},-400 L${-3000 + i * 160},0`} stroke="#3a322a" strokeWidth={16} opacity={0.75} />
      ))}
      <rect x={-3000} y={0} width={9000} height={40} fill="#14110f" />
      <BulbGlow id="lwbg" x={LAWN_BULB.x} y={LAWN_BULB.y} r={LAWN_BULB.r} t={t} glowR={1200} rays={0.4} />
      <ZapperGlow id="lwzg" x={LAWN_ZAP.x} y={LAWN_ZAP.y} s={LAWN_ZAP.s} t={t} zap={drop >= 0 && drop < 0.25 ? 1 - drop * 4 : 0} />
      <Bulb id="lwb" x={LAWN_BULB.x} y={LAWN_BULB.y} r={LAWN_BULB.r} t={t} />
      <Zapper id="lwz" x={LAWN_ZAP.x} y={LAWN_ZAP.y} s={LAWN_ZAP.s} t={t} frame={frame} count={4801} chain zap={drop >= 0 && drop < 0.25 ? 1 - drop * 4 : 0} />
      {/* cold light from the zapper over the whole lawn */}
      <rect x={-3000} y={-1200} width={9000} height={3400} fill="url(#lawnZap)" style={{ mixBlendMode: "screen" }} />
      <path d={`M${LAWN_ZAP.x - 120},${LAWN_ZAP.y + 300} L${LAWN_ZAP.x - 1400},${GROUND_Y} L${LAWN_ZAP.x + 900},${GROUND_Y} L${LAWN_ZAP.x + 120},${LAWN_ZAP.y + 300} Z`} fill="#9fd8ff" opacity={0.06} />
      {geo.far.map((b, i) => (
        <path key={i} d={b.d} fill={b.col} />
      ))}
      {/* ground */}
      <rect x={-3000} y={GROUND_Y} width={9000} height={800} fill="#231b14" />
      <path d={`M-3000,${GROUND_Y} L6000,${GROUND_Y}`} stroke={INK} strokeWidth={5} />
      {geo.pebbles.map((p, i) => (
        <path key={i} d={blob(p.x, p.y, p.r, p.r * 0.7, 8, 0.25, `pbb${i}`)} fill="#3a3028" stroke={INK} strokeWidth={3} />
      ))}
      {/* a cigarette butt like a fallen log + a bottle cap */}
      <g transform={`translate(2420 ${GROUND_Y - 30}) rotate(-3)`}>
        <rect x={-260} y={-44} width={330} height={88} rx={20} fill="#e2dccb" stroke={INK} strokeWidth={6} />
        <rect x={70} y={-44} width={170} height={88} rx={20} fill="#d18f45" stroke={INK} strokeWidth={6} />
        <ellipse cx={-260} cy={0} rx={20} ry={44} fill="#3a2a22" stroke={INK} strokeWidth={5} />
      </g>
      {geo.mid.map((b, i) => (
        <path key={i} d={b.d} fill={b.col} stroke={INK} strokeWidth={4} />
      ))}
      {/* the dead */}
      {DEAD.map((dm, i) => (
        <DeadMoth key={i} x={dm.x} y={dm.y} s={dm.s} rot={dm.r} seed={`dm${i}`} t={t} torn={dm.torn} flies={i % 3 === 0} />
      ))}
      {geo.dew.map((d, i) => {
        const b = geo.mid[d.b];
        const p: Pt = [lerp(b.x, b.tip[0], d.k * d.k), lerp(GROUND_Y, b.tip[1], d.k)];
        return (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={d.r} fill="#bfe6f2" opacity={0.75} stroke={INK} strokeWidth={2.5} />
            <circle cx={p[0] - d.r * 0.3} cy={p[1] - d.r * 0.3} r={d.r * 0.3} fill="#fff" />
          </g>
        );
      })}
      {/* torn wings stuck on the blades like battle flags */}
      {flags.map((bi, i) => {
        const b = geo.mid[bi];
        return <LooseWing key={i} x={b.tip[0]} y={b.tip[1] + 40} s={1.25 + (i % 3) * 0.3} rot={-30 + (i % 4) * 25} seed={`fw${i}`} flutter={Math.sin(t * (3 + i) + i) * wind} />;
      })}
      {/* ant procession carrying a wing away like a sail */}
      {(() => {
        const ax = -400 + ((t * 70) % 4200);
        return (
          <g>
            <LooseWing x={ax + 40} y={GROUND_Y - 34} s={0.8} rot={-70} seed="antsail" flutter={Math.sin(t * 3) * 0.3} />
            {[0, 1, 2, 3].map((k) => (
              <Ant key={k} x={ax + k * 44 - 20} y={GROUND_Y + 2} s={0.9} t={t} seed={`ant${k}`} />
            ))}
          </g>
        );
      })()}
      {/* the severed leg (his), twitching, and an ant who wants it */}
      <g transform={`translate(1060 ${GROUND_Y - 6}) rotate(${-8 + Math.sin(t * 30) * 6 * legTwitch})`}>
        <path d="M0,0 L60,-40 L130,-10 L170,-14" stroke={INK} strokeWidth={22} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M0,0 L60,-40 L130,-10 L170,-14" stroke="#6c5f4d" strokeWidth={13} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={0} cy={0} r={9} fill="#7a3a34" stroke={INK} strokeWidth={3} />
      </g>
      <Ant x={1260} y={GROUND_Y + 2} s={1} t={t} seed="legant" flip />
      {tatter ? <Moth id="tatterL" kind="tatter" t={t} frame={frame} mute scars={{ peg: "stump" }} {...tatter} /> : null}
      {/* a fresh one dropped from the zapper */}
      {drop >= 0 ? (
        <g>
          <MothHusk x={1550} y={dropY} s={0.9} rot={landed ? 170 : drop * 400} t={t} smoke={1} ember={landed ? 0.3 : 1} />
          {landed ? <path d={blob(1550, GROUND_Y - 10, 60 + clamp(landT * 3) * 80, 16 + clamp(landT * 3) * 12, 9, 0.3, "puff")} fill="#8a8274" opacity={0.6 * (1 - clamp(landT * 1.5))} /> : null}
        </g>
      ) : null}
      {geo.near.map((b, i) =>
        clearX !== undefined && Math.abs(b.x - clearX) < 420 ? null : <path key={i} d={b.d} fill={b.col} stroke={INK} strokeWidth={5} />,
      )}
      {front}
      {dark > 0 ? <rect x={-3000} y={-4000} width={9000} height={7000} fill="#000" opacity={dark} /> : null}
      {screen ? <ScreenSpace cam={c}>{screen}</ScreenSpace> : null}
    </Stage>
  );
};
