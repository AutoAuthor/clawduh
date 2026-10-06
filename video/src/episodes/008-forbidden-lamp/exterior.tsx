import React, { useMemo } from "react";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage } from "../../engine/Stage";
import { Pt, blob, clamp, onN, rnd } from "../../engine/util";
import { FONT, useCam } from "./common";
import { BulbGlow, ZapperGlow } from "./lamp";

/* EPISODE 008: the house at human scale — a shabby place with a bare porch bulb and a bug zapper. */

export const EXT = {
  bulb: { x: 1205, y: 604 },
  zapper: { x: 1500, y: 600 },
  rail: 760,
};

export const CAMX = {
  wide: { x: 960, y: 560, zoom: 0.95 },
  wideIn: { x: 1060, y: 600, zoom: 1.2 },
  porch: { x: 1180, y: 660, zoom: 2.2 },
  light: { x: 1200, y: 640, zoom: 3.6 },
} satisfies Record<string, Cam>;

const Junk: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {/* chain-link fence + BEWARE OF DOG + an empty collar on a staked chain */}
    {Array.from({ length: 10 }).map((_, i) => (
      <path key={i} d={`M${-420 + i * 100},850 L${-420 + i * 100},700`} stroke="#3a4050" strokeWidth={6} />
    ))}
    <path d="M-440,712 L520,712" stroke="#3a4050" strokeWidth={6} />
    {Array.from({ length: 30 }).map((_, i) => (
      <path key={i} d={`M${-440 + i * 33},712 l33,138 M${-407 + i * 33},712 l-33,138`} stroke="#2a3040" strokeWidth={1.5} opacity={0.8} />
    ))}
    <g transform="translate(60 742) rotate(-6)">
      <rect x={-70} y={-30} width={140} height={60} fill="#e8dcc0" stroke={INK} strokeWidth={4} />
      <text x={0} y={-6} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={17} fill="#a8241c">
        BEWARE
      </text>
      <text x={0} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill={INK}>
        OF DOG
      </text>
    </g>
    <path d="M300,1006 q40,-30 90,-10 q40,16 70,-6" stroke="#7a7a72" strokeWidth={5} fill="none" strokeDasharray="10 6" />
    <circle cx={300} cy={1006} r={6} fill="#4a4a44" />
    <ellipse cx={478} cy={994} rx={26} ry={10} fill="none" stroke="#b02a2a" strokeWidth={7} />
    {/* a couch on the lawn */}
    <g transform="translate(300 930)">
      <rect x={-150} y={-70} width={300} height={70} rx={14} fill="#5a3a4a" stroke={INK} strokeWidth={5} />
      <rect x={-170} y={-100} width={40} height={100} rx={12} fill="#4e3240" stroke={INK} strokeWidth={5} />
      <rect x={130} y={-100} width={40} height={100} rx={12} fill="#4e3240" stroke={INK} strokeWidth={5} />
      <path d={blob(30, -50, 26, 12, 8, 0.4, "couchrip")} fill="#d8cfb8" />
      <path d="M-140,0 l0,16 M140,0 l0,16" stroke={INK} strokeWidth={6} />
    </g>
    {/* headless flamingo */}
    <g transform="translate(600 1010)">
      <path d="M0,0 L0,-70 M-6,0 L-6,-60" stroke="#c9707a" strokeWidth={4} />
      <path d={blob(4, -88, 30, 18, 9, 0.15, "flam")} fill="#e88896" stroke={INK} strokeWidth={4} />
      <path d="M26,-96 q16,-30 6,-52" stroke="#e88896" strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d="M26,-96 q16,-30 6,-52" stroke={INK} strokeWidth={2} fill="none" />
    </g>
    {/* kiddie pool of green water */}
    <ellipse cx={880} cy={1010} rx={130} ry={30} fill="#3a7aa8" stroke={INK} strokeWidth={5} />
    <ellipse cx={880} cy={1006} rx={112} ry={22} fill="#6a8a3a" />
    <circle cx={850} cy={1004} r={6} fill="#9ab04a" opacity={0.9 + Math.sin(t * 2) * 0.1} />
    {/* trash bags by the steps */}
    {[1290, 1350, 1410].map((x, i) => (
      <path key={i} d={blob(x, 950, 34, 30, 9, 0.2, `bag${i}`)} fill="#1c1c22" stroke={INK} strokeWidth={4} />
    ))}
    {/* car on blocks, hood up */}
    <g transform="translate(1860 900)">
      <path d="M-240,0 L-230,-70 L-150,-120 L120,-120 L190,-70 L250,-60 L250,0 Z" fill="#5a4436" stroke={INK} strokeWidth={6} />
      <path d="M190,-70 L300,-160" stroke="#4a382c" strokeWidth={18} />
      <rect x={-200} y={0} width={50} height={40} fill="#6a6a64" stroke={INK} strokeWidth={4} />
      <rect x={140} y={0} width={50} height={40} fill="#6a6a64" stroke={INK} strokeWidth={4} />
      <path d="M-130,-110 L-60,-110 L-60,-74 L-160,-74 Z" fill="#1a2030" />
    </g>
  </g>
);

const House: React.FC<{ t: number; frame: number; zapK: number; neighbour: number }> = ({ t, frame, zapK, neighbour }) => {
  const f3 = onN(frame, 3);
  const tv = 0.4 + rnd(`etv${Math.floor(f3 / 3)}`) * 0.5;
  const siding = useMemo(() => Array.from({ length: 14 }).map((_, i) => 360 + i * 34), []);
  const flick = zapK > 0 && rnd(`hf${f3}`) < 0.5 ? 0.3 : 1;
  return (
    <g>
      {/* neighbour's house, one window */}
      <path d="M-500,760 L-500,520 L-300,400 L-100,520 L-100,760 Z" fill="#0d0f18" />
      <rect x={-360} y={560} width={60} height={60} fill={neighbour > 0.5 ? "#f2c86a" : "#141824"} />
      {neighbour > 0.5 ? <path d="M-340,620 a14,16 0 1 1 20,0 Z" fill="#3a2a1a" /> : null}
      {/* main house */}
      <rect x={520} y={330} width={1240} height={520} fill="#3e4c42" stroke={INK} strokeWidth={8} />
      {siding.map((y) => (
        <path key={y} d={`M520,${y} L1760,${y}`} stroke={INK} strokeWidth={2.5} opacity={0.45} />
      ))}
      <path d="M470,340 L1140,100 L1810,340 Z" fill="#2a2228" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={blob(820 + i * 260, 280 - i * 30, 40, 16, 8, 0.4, `shing${i}`)} fill="#171217" />
      ))}
      <circle cx={1140} cy={235} r={40} fill="#141824" stroke={INK} strokeWidth={6} />
      <path d="M1112,212 L1160,250 M1140,195 L1132,232" stroke="#4a5060" strokeWidth={2} />
      {/* sagging gutter + satellite dish pointing at the ground */}
      <path d="M470,344 L1000,350 Q1300,362 1520,410" stroke="#5a5a52" strokeWidth={10} fill="none" />
      <g transform="translate(1660 300) rotate(140)">
        <path d="M-40,0 Q0,40 40,0 Z" fill="#9a9a92" stroke={INK} strokeWidth={4} />
        <path d="M0,10 L0,40" stroke={INK} strokeWidth={4} />
      </g>
      {/* window with the TV on */}
      <rect x={720} y={580} width={180} height={160} fill="#0e1622" stroke={INK} strokeWidth={8} />
      <rect x={726} y={586} width={168} height={148} fill="#5a8ad8" opacity={tv * 0.45 * flick} />
      <path d="M726,586 L894,586 L894,630 L800,650 L726,620 Z" fill="#c9b98a" stroke={INK} strokeWidth={3} />
      {/* door + screen door */}
      <rect x={1240} y={560} width={130} height={270} fill="#2a2420" stroke={INK} strokeWidth={8} />
      <rect x={1252} y={574} width={106} height={244} fill="#15171b" />
      <path d="M1260,700 L1350,760 M1350,700 L1260,760" stroke="#9a9a92" strokeWidth={12} opacity={0.8} />
      {/* porch roof, posts, floor, steps, rail */}
      <path d="M540,480 L1740,480 L1760,525 L520,525 Z" fill="#2c2620" stroke={INK} strokeWidth={7} />
      {[600, 960, 1430, 1690].map((x) => (
        <rect key={x} x={x - 14} y={525} width={28} height={305} fill="#8e877a" stroke={INK} strokeWidth={5} />
      ))}
      <rect x={540} y={828} width={1200} height={30} fill="#5a5048" stroke={INK} strokeWidth={6} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={1040 - i * 6} y={858 + i * 28} width={200 + i * 12} height={28} fill="#5e544a" stroke={INK} strokeWidth={5} />
      ))}
      {[
        [600, 1040],
        [1250, 1690],
      ].map(([a, b], k) => (
        <g key={k}>
          <rect x={a} y={EXT.rail - 6} width={b - a} height={14} fill="#c9c2b0" stroke={INK} strokeWidth={4} />
          {Array.from({ length: Math.floor((b - a) / 40) }).map((_, i) => (
            <rect key={i} x={a + 16 + i * 40} y={EXT.rail + 8} width={10} height={62} fill="#a9a290" stroke={INK} strokeWidth={2.5} />
          ))}
        </g>
      ))}
      {/* the bulb (the lamp) by the door */}
      <rect x={EXT.bulb.x - 10} y={EXT.bulb.y - 40} width={20} height={24} fill="#e8e0cc" stroke={INK} strokeWidth={3} />
      <circle cx={EXT.bulb.x} cy={EXT.bulb.y} r={12} fill={zapK > 0.2 && flick < 1 ? "#a9a594" : "#fff4c0"} stroke={INK} strokeWidth={3} />
      {/* the zapper hanging from the porch roof */}
      <path d={`M${EXT.zapper.x},525 L${EXT.zapper.x},${EXT.zapper.y - 28}`} stroke="#5a5a52" strokeWidth={3} />
      <rect x={EXT.zapper.x - 16} y={EXT.zapper.y - 26} width={32} height={46} rx={6} fill="#1a2a24" stroke={INK} strokeWidth={3} />
      <rect x={EXT.zapper.x - 10} y={EXT.zapper.y - 20} width={20} height={34} fill={zapK > 0.2 ? "#ffffff" : "#9fe0ff"} opacity={0.9} />
    </g>
  );
};

export interface ExteriorProps {
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  /** 0..1 a zap at the porch */
  zap?: number;
  /** neighbour's light switched on */
  neighbour?: number;
  /** moth specks: positions in world units (null = hidden) */
  wick?: Pt | null;
  tatter?: Pt | null;
  front?: React.ReactNode;
  shakeAmp?: number;
}

const Speck: React.FC<{ p: Pt; col: string; t: number; fly?: boolean }> = ({ p, col, t, fly = false }) => {
  const fl = fly ? Math.sin(t * 40) * 0.5 + 0.5 : 0.2;
  return (
    <g transform={`translate(${p[0]} ${p[1]})`}>
      <path d={`M0,0 C-4,${-4 - fl * 4} -8,${-2 - fl * 3} -7,2 Z M0,0 C4,${-4 - fl * 4} 8,${-2 - fl * 3} 7,2 Z`} fill={col} stroke={INK} strokeWidth={0.8} />
      <ellipse rx={1.6} ry={3} fill={col} />
    </g>
  );
};

export const ExteriorScene: React.FC<ExteriorProps> = ({ from, to, cam, ease, zap = 0, neighbour = 0, wick = null, tatter = null, front, shakeAmp = 0 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = useCam(from, to, ease, cam);
  const stars = useMemo(() => Array.from({ length: 60 }).map((_, i) => [rnd(`xs${i}`) * 3000 - 600, rnd(`xsy${i}`) * 520 - 100, 1 + rnd(`xsr${i}`) * 2] as const), []);
  return (
    <Stage cam={c} frame={frame} shakeAmp={shakeAmp}>
      <defs>
        <linearGradient id="extSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04060e" />
          <stop offset="0.7" stopColor="#161936" />
          <stop offset="1" stopColor="#2a2444" />
        </linearGradient>
      </defs>
      <rect x={-1200} y={-800} width={4400} height={1700} fill="url(#extSky)" />
      {stars.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#e8e4d0" opacity={0.5 + 0.3 * Math.sin(t * 1.3 + i)} />
      ))}
      <circle cx={230} cy={150} r={80} fill="#f4ecc8" opacity={0.1} />
      <circle cx={230} cy={150} r={52} fill="#efe6c2" stroke={INK} strokeWidth={4} />
      <circle cx={214} cy={138} r={10} fill="#d7cca2" />
      <circle cx={246} cy={168} r={7} fill="#d7cca2" />
      {/* power lines */}
      <path d="M-800,190 Q600,280 2000,120 M-800,230 Q600,320 2000,160" stroke="#07080c" strokeWidth={3} fill="none" />
      <rect x={1990} y={60} width={16} height={800} fill="#14110f" />
      <path d="M-1200,770 C-700,700 -200,740 300,700 S1400,690 3200,740 L3200,900 L-1200,900 Z" fill="#0a0d16" />
      <House t={t} frame={frame} zapK={zap} neighbour={neighbour} />
      {/* yard */}
      <rect x={-1200} y={858} width={4400} height={500} fill="#16241c" />
      {Array.from({ length: 90 }).map((_, i) => {
        const x = -1100 + rnd(`eg${i}`) * 4200;
        const h = 18 + rnd(`egh${i}`) * 40;
        return <path key={i} d={`M${x},${872 + rnd(`egy${i}`) * 200} l${(rnd(`egl${i}`) - 0.5) * 16},${-h}`} stroke="#22382a" strokeWidth={4} strokeLinecap="round" />;
      })}
      <path d="M1060,950 Q1120,1020 1080,1200 L1260,1200 Q1220,1020 1240,950 Z" fill="#2a241c" opacity={0.8} />
      <Junk t={t} />
      <ZapperGlow id="xzg" x={EXT.zapper.x} y={EXT.zapper.y} s={0.35} t={t} zap={zap} />
      <BulbGlow id="xbg" x={EXT.bulb.x} y={EXT.bulb.y} r={12} t={t} glowR={420} rays={0.3} />
      {wick ? <Speck p={wick} col="#e8d4a8" t={t} fly /> : null}
      {tatter ? <Speck p={tatter} col="#9a9086" t={t} /> : null}
      {zap > 0 ? (
        <g style={{ mixBlendMode: "screen" }}>
          <circle cx={EXT.zapper.x} cy={EXT.zapper.y} r={60 + zap * 400} fill="#dff6ff" opacity={clamp(zap) * 0.7} />
        </g>
      ) : null}
      {front}
    </Stage>
  );
};
