import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, LightWash, Stage, camLerp } from "../../engine/Stage";
import { Pt, blob, cloudPath, easeInOut, rnd } from "../../engine/util";
import { Frog, FrogProps, FROG_HEAD } from "./cast/Frog";
import { useSpeech } from "./tl";

/* EPISODE 010 "THEN" set: THE LIBERTY LILY PAD, a sunny bedroom podcast studio, summer 2016. One room, many cameras. */

const FONT = "Arial Black, Arial, Helvetica, sans-serif";

export const FROG_POS = { x: 930, y: 762 };
export const FROG_SCALE = 1;
export const HEAD_T = { x: FROG_POS.x + FROG_HEAD.sit[0] * FROG_SCALE, y: FROG_POS.y + FROG_HEAD.sit[1] * FROG_SCALE };
export const DESK_TOP = 768;

export const CAM_T = {
  wide: { x: 960, y: 540, zoom: 0.94 },
  ms: { x: HEAD_T.x + 30, y: HEAD_T.y + 70, zoom: 1.6 },
  cu: { x: HEAD_T.x + 30, y: HEAD_T.y + 4, zoom: 2.45 },
  ecu: { x: HEAD_T.x + 40, y: HEAD_T.y + 10, zoom: 3.5 },
  sign: { x: HEAD_T.x + 20, y: HEAD_T.y + 46, zoom: 1.85 },
  monitor: { x: 480, y: 650, zoom: 3.0 },
} satisfies Record<string, Cam>;

export interface StudioState {
  /** listeners on the live counter */
  listeners: number;
  /** 0..1 sunbeam strength */
  sun: number;
  /** mug on the desk (false when he's holding it) */
  mugOnDesk: boolean;
}

const DEFAULT_STATE: StudioState = { listeners: 3, sun: 1, mugOnDesk: true };

/* ------------------------------------------------------------------ */
/* Set pieces                                                          */
/* ------------------------------------------------------------------ */

const Wall: React.FC = () => {
  const stripes = useMemo(() => Array.from({ length: 70 }).map((_, i) => `M${-700 + i * 60},-700 h22 v1500 h-22 Z`).join(" "), []);
  return (
    <g>
      <rect x={-800} y={-700} width={3600} height={1500} fill="#f4d98c" />
      <path d={stripes} fill="#ecce78" opacity={0.7} />
      {/* crown moulding + skirting */}
      <rect x={-800} y={-30} width={3600} height={26} fill="#fbf3dc" stroke={INK} strokeWidth={5} />
      <rect x={-800} y={770} width={3600} height={40} fill="#fbf3dc" stroke={INK} strokeWidth={5} />
      <rect x={-800} y={-700} width={3600} height={672} fill="#f8ecc4" />
      {/* faint scuffs and a water stain, it's a rental */}
      <path d={blob(1700, 60, 90, 40, 10, 0.3, "wstain")} fill="#d9b860" opacity={0.25} />
    </g>
  );
};

const Floor: React.FC = () => (
  <g>
    <rect x={-800} y={808} width={3600} height={900} fill="#b07a46" />
    {Array.from({ length: 30 }).map((_, i) => (
      <path key={i} d={`M${-800 + i * 130},808 L${-1400 + i * 180},1700`} stroke="#8a5a30" strokeWidth={4} />
    ))}
    {[880, 960, 1060, 1190].map((yy) => (
      <path key={yy} d={`M-800,${yy} L2800,${yy}`} stroke="#8a5a30" strokeWidth={3} opacity={0.6} />
    ))}
    {/* rug */}
    <ellipse cx={960} cy={1000} rx={760} ry={130} fill="#2e6e8a" stroke={INK} strokeWidth={6} />
    <ellipse cx={960} cy={1000} rx={680} ry={104} fill="none" stroke="#e8d070" strokeWidth={8} strokeDasharray="30 18" />
  </g>
);

const Bunting: React.FC<{ t: number }> = ({ t }) => {
  const cols = ["#cc3329", "#f6f1e2", "#2a5aa8"];
  return (
    <g>
      <path d="M-200,30 Q500,110 960,40 Q1420,110 2100,30" stroke={INK} strokeWidth={4} fill="none" />
      {Array.from({ length: 30 }).map((_, i) => {
        const k = i / 29;
        const x = -200 + k * 2300;
        const seg = x < 960 ? (x + 200) / 1160 : (x - 960) / 1140;
        const y = (x < 960 ? 30 + 80 * 4 * seg * (1 - seg) * 1 : 40 + 70 * 4 * seg * (1 - seg)) + 4;
        const sw = Math.sin(t * 2 + i) * 4;
        return <path key={i} d={`M${x - 30},${y} L${x + 30},${y} L${x + sw},${y + 62} Z`} fill={cols[i % 3]} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />;
      })}
    </g>
  );
};

const Window: React.FC<{ t: number }> = ({ t }) => {
  const cloud1 = ((t * 14) % 700) - 120;
  const cloud2 = ((t * 9 + 300) % 700) - 120;
  const bird = ((t * 60) % 900) - 200;
  return (
    <g>
      <defs>
        <linearGradient id="sky10" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5cb6ee" />
          <stop offset="1" stopColor="#c6ecff" />
        </linearGradient>
        <clipPath id="win10">
          <rect x={210} y={150} width={480} height={400} />
        </clipPath>
      </defs>
      <rect x={210} y={150} width={480} height={400} fill="url(#sky10)" />
      <g clipPath="url(#win10)">
        {/* the sun, beaming */}
        <g transform={`translate(590 250) rotate(${t * 12})`}>
          {Array.from({ length: 12 }).map((_, i) => (
            <path key={i} d="M0,-70 L10,-108 L-10,-108 Z" fill="#ffd84a" transform={`rotate(${i * 30})`} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          ))}
        </g>
        <circle cx={590} cy={250} r={58} fill="#ffe25a" stroke={INK} strokeWidth={5} />
        <path d="M570,262 q20,18 40,0" stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        <circle cx={572} cy={240} r={5} fill={INK} />
        <circle cx={606} cy={240} r={5} fill={INK} />
        <path d={cloudPath(210 + cloud1, 340, 90, 34, 8, "wc1", 0.8)} fill="#fff" stroke={INK} strokeWidth={4} />
        <path d={cloudPath(210 + cloud2, 450, 70, 26, 7, "wc2", 0.8)} fill="#fff" stroke={INK} strokeWidth={4} />
        {/* rolling hills + a flagpole across the street */}
        <path d="M210,520 Q350,470 480,505 Q600,480 700,500 L700,560 L210,560 Z" fill="#7cc35a" stroke={INK} strokeWidth={4} />
        <path d={`M${210 + bird},300 q10,-10 20,0 q10,-10 20,0`} stroke={INK} strokeWidth={3.5} fill="none" />
      </g>
      {/* frame + mullions */}
      <rect x={210} y={150} width={480} height={400} fill="none" stroke="#fbf6ea" strokeWidth={22} />
      <rect x={210} y={150} width={480} height={400} fill="none" stroke={INK} strokeWidth={5} />
      <rect x={188} y={128} width={524} height={444} fill="none" stroke={INK} strokeWidth={5} />
      <path d="M450,150 L450,550 M210,350 L690,350" stroke="#fbf6ea" strokeWidth={14} />
      <path d="M450,150 L450,550 M210,350 L690,350" stroke={INK} strokeWidth={3} opacity={0.6} />
      <rect x={180} y={560} width={540} height={26} rx={4} fill="#fbf6ea" stroke={INK} strokeWidth={5} />
      {/* curtains */}
      {[-1, 1].map((sd) => {
        const cx = sd < 0 ? 160 : 740;
        return (
          <g key={sd}>
            <path d={`M${cx - 60},110 L${cx + 60},110 Q${cx + 30 * -sd},360 ${cx + 40},620 L${cx - 40},620 Q${cx - 30 * sd},360 ${cx - 60},110 Z`} fill="#d8443a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            {[-30, 0, 30].map((o) => (
              <path key={o} d={`M${cx + o},120 Q${cx + o - 10 * sd},360 ${cx + o * 0.8},610`} stroke="#a82c24" strokeWidth={4} fill="none" />
            ))}
            <path d={`M${cx - 44},400 Q${cx},420 ${cx + 44},400`} stroke="#f2c84a" strokeWidth={10} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
      <rect x={70} y={98} width={760} height={18} rx={8} fill="#8a5a30" stroke={INK} strokeWidth={4} />
    </g>
  );
};

/** yellow flag with a coiled tadpole, DON'T TREAD ON ME — the frog's creed */
export const TadpoleFlag: React.FC<{ x: number; y: number; w?: number; t: number; torn?: number; dirt?: number }> = ({ x, y, w = 330, t, torn = 0, dirt = 0 }) => {
  const h = w * 0.62;
  const wave = (k: number) => Math.sin(t * 2.4 + k * 5) * 6 * (1 - torn * 0.5);
  const edge = torn > 0 ? `L${w},${h * 0.2} L${w - 30},${h * 0.32} L${w - 6},${h * 0.5} L${w - 40},${h * 0.66} L${w - 10},${h * 0.84} L${w - 34},${h}` : `L${w},${h}`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M0,0 Q${w / 2},${wave(0)} ${w},0 ${edge} Q${w / 2},${h + wave(1)} 0,${h} Z`} fill={dirt > 0 ? "#a8984a" : "#f2cf3a"} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {/* coiled tadpole */}
      <g transform={`translate(${w * 0.5} ${h * 0.46}) scale(${w / 330})`}>
        <path d="M-60,30 C-90,0 -50,-50 0,-40 C50,-30 40,30 0,24 C-30,20 -24,-10 0,-8 C14,-6 14,8 4,8" stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
        <path d="M-60,30 C-90,0 -50,-50 0,-40 C50,-30 40,30 0,24 C-30,20 -24,-10 0,-8 C14,-6 14,8 4,8" stroke="#3e6a2a" strokeWidth={8} fill="none" strokeLinecap="round" />
        <ellipse cx={-62} cy={34} rx={26} ry={20} fill="#3e6a2a" stroke={INK} strokeWidth={5} />
        <circle cx={-52} cy={28} r={5} fill="#f2cf3a" />
        <circle cx={-51} cy={28} r={2.5} fill={INK} />
      </g>
      <text x={w / 2} y={h - 18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={w * 0.075} fill="#1e2a12">
        DON'T TREAD ON ME
      </text>
      {dirt > 0 ? <path d={blob(w * 0.4, h * 0.5, w * 0.3, h * 0.3, 9, 0.4, "flagdirt")} fill="#3a2e1a" opacity={0.35 * dirt} /> : null}
      <rect x={-12} y={-20} width={12} height={h + 60} fill="#8a5a30" stroke={INK} strokeWidth={4} />
      <circle cx={-6} cy={-24} r={10} fill="#e0b13c" stroke={INK} strokeWidth={4} />
    </g>
  );
};

const Bookshelf: React.FC = () => {
  const books = useMemo(() => {
    const out: Array<{ x: number; y: number; w: number; h: number; c: string; title?: string; lean: number }> = [];
    const titles = ["LIBERTY", "ECON 101", "FREEDOM", "THE MARKET", "ON LIBERTY", "SELF-RELIANCE", "TAXES?", "LIBERTY II"];
    const cols = ["#2a5aa8", "#cc3329", "#2e8c86", "#e0b13c", "#6a3a8a", "#3a6a2a", "#d8743a", "#1f3a6e"];
    for (let shelf = 0; shelf < 4; shelf++) {
      let bx = 1500;
      let k = 0;
      while (bx < 1790) {
        const w = 22 + rnd(`bw${shelf}${k}`) * 18;
        const h = 90 + rnd(`bh${shelf}${k}`) * 40;
        out.push({ x: bx, y: 330 + shelf * 140 - h, w, h, c: cols[(shelf * 3 + k) % cols.length], title: rnd(`bt${shelf}${k}`) < 0.5 ? titles[(shelf + k) % titles.length] : undefined, lean: k === 6 ? 12 : 0 });
        bx += w + 3;
        k++;
      }
    }
    return out;
  }, []);
  return (
    <g>
      <rect x={1480} y={170} width={330} height={610} fill="#7a4a26" stroke={INK} strokeWidth={6} />
      <rect x={1494} y={184} width={302} height={582} fill="#5a3418" />
      {books.map((b, i) => (
        <g key={i} transform={b.lean ? `rotate(${b.lean} ${b.x} ${b.y + b.h})` : undefined}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={b.c} stroke={INK} strokeWidth={3} />
          <path d={`M${b.x + 3},${b.y + 12} L${b.x + b.w - 3},${b.y + 12} M${b.x + 3},${b.y + b.h - 12} L${b.x + b.w - 3},${b.y + b.h - 12}`} stroke="#f2e2a0" strokeWidth={2.5} />
          {b.title ? (
            <text x={0} y={0} transform={`translate(${b.x + b.w / 2 + 4} ${b.y + b.h / 2}) rotate(-90)`} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={Math.min(13, b.w * 0.5)} fill="#f6efd8">
              {b.title}
            </text>
          ) : null}
        </g>
      ))}
      {[330, 470, 610, 750].map((sy) => (
        <rect key={sy} x={1490} y={sy} width={310} height={14} fill="#8a5a30" stroke={INK} strokeWidth={4} />
      ))}
      {/* powdered-wig bust on top (a generic old guy, nobody in particular) */}
      <g transform="translate(1590 170)">
        <rect x={-44} y={-30} width={88} height={30} fill="#d8d2c0" stroke={INK} strokeWidth={4} />
        <path d="M-40,-30 C-44,-80 -20,-110 0,-110 C20,-110 44,-80 40,-30 Z" fill="#ece6d4" stroke={INK} strokeWidth={4} />
        <path d={cloudPath(0, -108, 46, 22, 9, "wig", 0.8)} fill="#f6f2e8" stroke={INK} strokeWidth={4} />
        <circle cx={-34} cy={-70} r={14} fill="#f6f2e8" stroke={INK} strokeWidth={3} />
        <circle cx={34} cy={-70} r={14} fill="#f6f2e8" stroke={INK} strokeWidth={3} />
        <path d="M-14,-74 l8,0 M8,-74 l8,0 M-8,-50 q8,-4 16,0" stroke={INK} strokeWidth={3} />
      </g>
      {/* lava lamp */}
      <g transform="translate(1730 330)">
        <path d="M-16,0 L16,0 L10,-24 L22,-90 L-22,-90 L-10,-24 Z" fill="#ff8a4a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <ellipse cx={0} cy={-60} rx={9} ry={12} fill="#ffd84a" />
        <path d="M-12,-90 L12,-90 L6,-108 L-6,-108 Z" fill="#9aa0a6" stroke={INK} strokeWidth={4} />
      </g>
    </g>
  );
};

const Posters: React.FC<{ t: number }> = ({ t }) => (
  <g>
    {/* motivational poster */}
    <g transform="translate(1150 170) rotate(2)">
      <rect width={250} height={300} fill="#1f3a6e" stroke={INK} strokeWidth={6} />
      <rect x={14} y={14} width={222} height={170} fill="#5cb6ee" />
      <path d="M14,184 L80,120 L130,160 L180,100 L236,170 L236,184 Z" fill="#3e6a2a" stroke={INK} strokeWidth={3} />
      {/* a frog on a mountain top, arms raised */}
      <circle cx={180} cy={84} r={14} fill="#7ab648" stroke={INK} strokeWidth={3} />
      <path d="M170,96 l-12,-20 M190,96 l12,-20" stroke={INK} strokeWidth={4} />
      <text x={125} y={226} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill="#f6efd8">
        FREEDOM
      </text>
      <text x={125} y={256} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={700} fontSize={13} fill="#c6d6ee">
        IT'S FREE (TERMS APPLY)
      </text>
    </g>
    {/* JUNE 2016 calendar */}
    <g transform="translate(1210 500) rotate(-2)">
      <path d="M60,-8 L60,8" stroke={INK} strokeWidth={4} />
      <circle cx={60} cy={-10} r={5} fill="#cc3329" stroke={INK} strokeWidth={2.5} />
      <rect x={0} y={6} width={120} height={160} fill="#fbfaf2" stroke={INK} strokeWidth={4} />
      <rect x={0} y={6} width={120} height={70} fill="#7cc35a" />
      <path d="M0,60 Q40,40 70,56 Q100,44 120,56 L120,76 L0,76 Z" fill="#4e8a30" />
      <circle cx={88} cy={34} r={14} fill="#ffe25a" stroke={INK} strokeWidth={2.5} />
      <text x={60} y={98} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={17} fill="#cc3329">
        JUNE 2016
      </text>
      {Array.from({ length: 20 }).map((_, i) => (
        <rect key={i} x={10 + (i % 5) * 21} y={108 + Math.floor(i / 5) * 13} width={17} height={10} fill={i === 13 ? "#cc3329" : "#e4e0d0"} />
      ))}
    </g>
    {/* ON AIR light */}
    <g transform="translate(1000 60)">
      <rect x={-90} y={0} width={180} height={64} rx={10} fill="#3a1414" stroke={INK} strokeWidth={6} />
      <rect x={-78} y={10} width={156} height={44} rx={6} fill="#ff4a3a" opacity={0.85 + Math.sin(t * 9) * 0.1} />
      <text x={0} y={44} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={32} fill="#fff4e8">
        ON AIR
      </text>
      <ellipse cx={0} cy={32} rx={130} ry={60} fill="#ff4a3a" opacity={0.12} />
    </g>
  </g>
);

const Fern: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: 9 }).map((_, i) => {
      const a = -70 + i * 17 + Math.sin(t * 1.4 + i) * 3;
      const r = (a * Math.PI) / 180;
      const len = 110 + (i % 3) * 20;
      const tip: Pt = [Math.sin(r) * len, -Math.cos(r) * len * 0.9 - 30];
      return <path key={i} d={`M0,-30 Q${tip[0] * 0.5},${tip[1] - 20} ${tip[0]},${tip[1]}`} stroke="#3e8a2a" strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray="10 4" />;
    })}
    <path d="M-50,-40 L50,-40 L40,30 L-40,30 Z" fill="#c8643a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-56} y={-50} width={112} height={18} rx={4} fill="#d8744a" stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={-6} r={12} fill="#f6efd8" stroke={INK} strokeWidth={2.5} />
    <path d="M-6,-6 a6,6 0 1,0 12,0" stroke={INK} strokeWidth={2} fill="none" />
  </g>
);

const Monitor: React.FC<{ listeners: number; t: number }> = ({ listeners, t }) => (
  <g transform="translate(480 650)">
    <rect x={-120} y={-90} width={240} height={160} rx={8} fill="#2a2e34" stroke={INK} strokeWidth={6} />
    <rect x={-106} y={-78} width={212} height={130} fill="#0e1a2c" />
    <circle cx={-84} cy={-60} r={8} fill={Math.floor(t * 2) % 2 ? "#ff3a3a" : "#7a1a1a"} />
    <text x={-70} y={-54} fontFamily={FONT} fontWeight={900} fontSize={16} fill="#ff6a5a">
      LIVE
    </text>
    <text x={0} y={-24} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={12} fill="#9fd0e6">
      THE LIBERTY LILY PAD
    </text>
    <text x={0} y={8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill="#f6efd8">
      LISTENERS:
    </text>
    <text x={0} y={44} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={listeners < 3 ? "#ff6a5a" : "#7cdc5a"}>
      {listeners}
    </text>
    {/* audio meter bouncing */}
    {Array.from({ length: 8 }).map((_, i) => {
      const h = 6 + Math.abs(noise2D(`mtr${i}`, t * 3, 0)) * 26;
      return <rect key={i} x={60 + i * 5} y={44 - h} width={3.5} height={h} fill="#7cdc5a" />;
    })}
    <rect x={-20} y={70} width={40} height={30} fill="#2a2e34" stroke={INK} strokeWidth={4} />
    <rect x={-60} y={96} width={120} height={12} rx={4} fill="#2a2e34" stroke={INK} strokeWidth={4} />
  </g>
);

const Pamphlets: React.FC = () => (
  <g transform="translate(1330 760)">
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(${(rnd(`pm${i}`) - 0.5) * 10} ${-i * 9}) rotate(${(rnd(`pmr${i}`) - 0.5) * 8})`}>
        <rect x={-64} y={-12} width={128} height={12} fill={i % 2 ? "#f6efd8" : "#e8f0fa"} stroke={INK} strokeWidth={3} />
      </g>
    ))}
    <g transform="translate(0 -46) rotate(-4)">
      <rect x={-66} y={-30} width={132} height={40} fill="#fbfaf2" stroke={INK} strokeWidth={3} />
      <text x={0} y={-12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={11} fill="#cc3329">
        FREE PAMPHLETS
      </text>
      <text x={0} y={4} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={700} fontSize={10} fill={INK}>
        (please take one)
      </text>
    </g>
  </g>
);

const Desk: React.FC<{ st: StudioState; t: number }> = ({ st, t }) => (
  <g>
    {/* desk top */}
    <rect x={280} y={DESK_TOP - 12} width={1300} height={34} rx={6} fill="#c8925a" stroke={INK} strokeWidth={6} />
    {/* front panel with the podcast banner */}
    <rect x={300} y={DESK_TOP + 20} width={1260} height={420} fill="#a8723e" stroke={INK} strokeWidth={6} />
    <g transform={`translate(960 ${DESK_TOP + 200})`}>
      <rect x={-330} y={-70} width={660} height={140} rx={12} fill="#1f3a6e" stroke={INK} strokeWidth={6} />
      <rect x={-318} y={-58} width={636} height={116} rx={8} fill="none" stroke="#e2c45a" strokeWidth={3} />
      {/* logo: a lily pad wearing a tricorn hat */}
      <g transform="translate(-250 0)">
        <ellipse cx={0} cy={10} rx={50} ry={30} fill="#5aa83a" stroke={INK} strokeWidth={4} />
        <path d="M0,10 L40,-6 L46,14 Z" fill="#1f3a6e" />
        <path d="M-36,-22 Q0,-52 36,-22 L26,-10 Q0,-26 -26,-10 Z" fill="#2a2018" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
      <text x={40} y={-10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#f6efd8">
        THE LIBERTY LILY PAD
      </text>
      <text x={40} y={30} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight={700} fontSize={22} fill="#e2c45a">
        a podcast for free-thinking amphibians
      </text>
    </g>
    {/* laptop (back facing us, stickered) */}
    <g transform={`translate(712 ${DESK_TOP - 12})`}>
      <path d="M-110,0 L110,0 L96,-150 L-96,-150 Z" fill="#c4c8cc" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={0} cy={-80} r={18} fill="#e8eaec" stroke={INK} strokeWidth={3} />
      <g transform="translate(-50 -120) rotate(-10)">
        <rect x={-30} y={-12} width={60} height={24} rx={4} fill="#f2cf3a" stroke={INK} strokeWidth={2.5} />
        <text x={0} y={5} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={10} fill={INK}>
          I ♥ FREE
        </text>
      </g>
      <g transform="translate(56 -40) rotate(12)">
        <rect x={-34} y={-12} width={68} height={24} rx={4} fill="#cc3329" stroke={INK} strokeWidth={2.5} />
        <text x={0} y={5} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={9} fill="#fff">
          ASK ME WHY
        </text>
      </g>
    </g>
    <Monitor listeners={st.listeners} t={t} />
    <Fern x={318} y={DESK_TOP - 30} t={t} />
    <Pamphlets />
    {/* pocket constitution + mug on the desk */}
    <g transform={`translate(1200 ${DESK_TOP - 14}) rotate(-8)`}>
      <rect x={-34} y={-8} width={68} height={14} fill="#1f3a6e" stroke={INK} strokeWidth={3} />
    </g>
    {st.mugOnDesk ? (
      <g transform={`translate(1430 ${DESK_TOP - 50})`}>
        <path d="M26,-14 C44,-14 44,16 26,14" stroke={INK} strokeWidth={11} fill="none" />
        <path d="M26,-14 C44,-14 44,16 26,14" stroke="#fbfaf4" strokeWidth={5} fill="none" />
        <rect x={-28} y={-30} width={56} height={62} rx={6} fill="#fbfaf4" stroke={INK} strokeWidth={4} />
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={11.5} fill="#1f3a6e">
          LIBERTY
        </text>
      </g>
    ) : null}
  </g>
);

/** the boom mic: arm from the desk's right corner, capsule beside (not over) his mouth */
const BoomMic: React.FC<{ mouth: Pt }> = ({ mouth }) => {
  const cap: Pt = [mouth[0] + 272, mouth[1] + 40];
  return (
    <g>
      <path d={`M1470,${DESK_TOP - 10} L1380,500 L${cap[0] + 70},${cap[1] - 70}`} stroke={INK} strokeWidth={16} fill="none" strokeLinejoin="round" />
      <path d={`M1470,${DESK_TOP - 10} L1380,500 L${cap[0] + 70},${cap[1] - 70}`} stroke="#3a3e44" strokeWidth={8} fill="none" strokeLinejoin="round" />
      <circle cx={1380} cy={500} r={11} fill="#5a5e64" stroke={INK} strokeWidth={4} />
      <g transform={`translate(${cap[0]} ${cap[1]}) rotate(-38)`}>
        <rect x={-30} y={-58} width={60} height={116} rx={30} fill="#2a2e34" stroke={INK} strokeWidth={5} />
        {Array.from({ length: 6 }).map((_, i) => (
          <path key={i} d={`M-24,${-40 + i * 14} L24,${-40 + i * 14}`} stroke="#6a6e74" strokeWidth={3} />
        ))}
        <rect x={-34} y={20} width={68} height={16} rx={6} fill="#c43a2a" stroke={INK} strokeWidth={4} />
      </g>
      {/* pop filter between mic and mouth */}
      <g transform={`translate(${cap[0] - 66} ${cap[1] - 6})`}>
        <ellipse rx={20} ry={48} fill="#1a1a1a" fillOpacity={0.25} stroke={INK} strokeWidth={5} />
        <path d="M0,48 Q30,80 70,70" stroke={INK} strokeWidth={4} fill="none" />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

export interface StudioSceneProps {
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  frog?: Partial<FrogProps> | false;
  st?: Partial<StudioState>;
  shakeAmp?: number;
  front?: React.ReactNode;
}

export const StudioScene: React.FC<StudioSceneProps> = ({ from, to, cam, ease = easeInOut, frog = {}, st = {}, shakeAmp = 0, front }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = cam ?? (to ? camLerp(from, to, ease(shot.p)) : from);
  const sp = useSpeech();
  const state = { ...DEFAULT_STATE, ...st };
  const mouth: Pt = [HEAD_T.x + 22 * 1.22, HEAD_T.y + 28 * 1.22];
  return (
    <Stage cam={c} frame={frame} shakeAmp={shakeAmp} overlay={<LightWash id="sun10" color="#fff2b8" cx={420} cy={300} r={1300} opacity={0.22 * state.sun} />}>
      <Wall />
      <Bunting t={t} />
      <Window t={t} />
      <TadpoleFlag x={790} y={150} w={300} t={t} />
      <Posters t={t} />
      <Bookshelf />
      <Floor />
      {/* sunbeam across the room */}
      <path d="M220,160 L700,160 L1500,1100 L700,1100 Z" fill="#fff6c8" opacity={0.16 * state.sun} />
      {/* office chair back */}
      <path d={`M${FROG_POS.x - 120},${FROG_POS.y - 10} L${FROG_POS.x - 130},${FROG_POS.y - 250} Q${FROG_POS.x - 20},${FROG_POS.y - 300} ${FROG_POS.x + 80},${FROG_POS.y - 250} L${FROG_POS.x + 80},${FROG_POS.y - 10} Z`} fill="#3a3e48" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {frog ? <Frog id="wendell" x={FROG_POS.x} y={FROG_POS.y} scale={FROG_SCALE} pose="sit" t={t} frame={frame} {...sp} {...frog} /> : null}
      <BoomMic mouth={mouth} />
      <Desk st={state} t={t} />
      {front}
    </Stage>
  );
};
