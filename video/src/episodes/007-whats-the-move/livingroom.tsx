import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, LightWash, Stage, camLerp } from "../../engine/Stage";
import { energyAt, isTalking, mouthAt } from "../../engine/timeline";
import { Pt, blob, easeInOut, onN, rnd } from "../../engine/util";
import { DUANE_HEAD, DuaneProps, Hyena } from "./cast/Hyena";
import { Goat, LYLE_HEAD, LyleProps } from "./cast/Goat";
import { FloralPattern, MAMA_HEAD, Mama, MamaProps } from "./cast/Mama";

/* EPISODE 007 set: MAMA'S LIVING ROOM, 3 AM. Wood panelling, mustard wallpaper, a plastic-covered floral couch,
   her portraits watching, a skeleton cuckoo clock, the saddest 45th birthday party in town. One world, many cameras. */

export const FONT = "Arial Black, Arial, Helvetica, sans-serif";
export const WALL_BASE = 880;
export const DUANE_POS = { x: 850, y: 740 };
export const LYLE_POS = { x: 1390, y: 955 };
export const MAMA_POS = { x: 150, y: 905 };
export const DOOR = { x0: 1560, x1: 1790, top: 250 };
export const CLOCK = { x: 1132, y: 262 };
export const PORTRAIT = { x: 640, y: 330 };
export const JAR = { x: 962, y: 850 };
export const CAKE = { x: 655, y: 850 };

/** world head positions (cameras, 9:16 speaker follow) */
export const HEADS = {
  duane: { x: DUANE_POS.x + DUANE_HEAD.sit[0], y: DUANE_POS.y + DUANE_HEAD.sit[1] },
  lyle: { x: LYLE_POS.x - LYLE_HEAD[0], y: LYLE_POS.y + LYLE_HEAD[1] },
  mama: { x: MAMA_POS.x + MAMA_HEAD[0], y: MAMA_POS.y + MAMA_HEAD[1] },
};

export const CAM7 = {
  wide: { x: 980, y: 560, zoom: 0.94 },
  wideIn: { x: 1040, y: 560, zoom: 1.06 },
  two: { x: 1120, y: 540, zoom: 1.32 },
  cuDuane: { x: HEADS.duane.x + 30, y: HEADS.duane.y + 40, zoom: 2.5 },
  ecuDuane: { x: HEADS.duane.x + 40, y: HEADS.duane.y + 10, zoom: 3.9 },
  msDuane: { x: HEADS.duane.x + 30, y: HEADS.duane.y + 170, zoom: 1.65 },
  cuLyle: { x: HEADS.lyle.x - 30, y: HEADS.lyle.y + 50, zoom: 2.4 },
  ecuLyle: { x: HEADS.lyle.x - 40, y: HEADS.lyle.y + 20, zoom: 3.8 },
  msLyle: { x: HEADS.lyle.x - 10, y: HEADS.lyle.y + 190, zoom: 1.6 },
  fullLyle: { x: LYLE_POS.x - 40, y: 600, zoom: 1.24 },
  clock: { x: CLOCK.x, y: CLOCK.y + 50, zoom: 3.4 },
  door: { x: 1640, y: 580, zoom: 1.45 },
  hall: { x: 175, y: 560, zoom: 1.55 },
  portrait: { x: PORTRAIT.x, y: PORTRAIT.y + 10, zoom: 3.6 },
  jar: { x: JAR.x, y: JAR.y - 40, zoom: 4.2 },
  cake: { x: CAKE.x, y: CAKE.y - 50, zoom: 3.6 },
} satisfies Record<string, Cam>;

export function useSpeech(name: string) {
  const { timeline, shot } = useEpisode();
  const tq = onN(shot.frame, 2) / shot.fps;
  return { mouth: mouthAt(timeline, name, tq), talking: isTalking(timeline, name, shot.t), energy: energyAt(timeline, shot.t) };
}

/* ------------------------------------------------------------------ */
/* Patterns                                                            */
/* ------------------------------------------------------------------ */

const Patterns: React.FC = () => (
  <defs>
    <FloralPattern id="couchFloral" scale={0.9} />
    <FloralPattern id="couchFloralDk" scale={0.9} dark={0.6} />
    <pattern id="wallpaper7" patternUnits="userSpaceOnUse" width={96} height={120}>
      <rect width={96} height={120} fill="#c9a650" />
      <rect x={0} width={10} height={120} fill="#b8933f" />
      <rect x={48} width={4} height={120} fill="#b8933f" />
      <path d="M72,22 c-14,8 -14,26 0,34 c14,-8 14,-26 0,-34 Z M72,64 c-10,6 -10,20 0,26 c10,-6 10,-20 0,-26 Z" fill="#a8843a" />
      <path d="M24,82 c-14,8 -14,26 0,34 c14,-8 14,-26 0,-34 Z M24,4 c-10,6 -10,20 0,26 c10,-6 10,-20 0,-26 Z" fill="#a8843a" />
      <circle cx={72} cy={60} r={3} fill="#8f6f2e" />
      <circle cx={24} cy={0} r={3} fill="#8f6f2e" />
    </pattern>
    <pattern id="panel7" patternUnits="userSpaceOnUse" width={64} height={400}>
      <rect width={64} height={400} fill="#6e4a2c" />
      <rect x={0} width={6} height={400} fill="#4f331e" />
      <path d="M22,0 q6,120 -2,240 q-4,90 4,160" stroke="#5c3d23" strokeWidth={3} fill="none" />
      <path d="M44,0 q-4,90 4,200" stroke="#7d5636" strokeWidth={2} fill="none" />
    </pattern>
    <pattern id="carpet7" patternUnits="userSpaceOnUse" width={40} height={26}>
      <rect width={40} height={26} fill="#9c5530" />
      <path d="M4,20 l3,-9 M12,24 l-2,-8 M20,18 l4,-8 M30,22 l-3,-9 M36,14 l2,-7 M8,8 l3,-6 M26,8 l-2,-6" stroke="#7e4024" strokeWidth={3} strokeLinecap="round" />
      <path d="M16,12 l2,-6 M34,4 l-2,-4" stroke="#b56a3c" strokeWidth={3} strokeLinecap="round" />
    </pattern>
  </defs>
);

/* ------------------------------------------------------------------ */
/* Set pieces                                                          */
/* ------------------------------------------------------------------ */

const Walls: React.FC = () => (
  <g>
    {/* popcorn ceiling */}
    <rect x={-900} y={-600} width={3900} height={668} fill="#cfc4a8" />
    <rect x={-900} y={-600} width={3900} height={668} fill="#2a2018" opacity={0.25} />
    <rect x={-900} y={60} width={3900} height={22} fill="#a88a5a" stroke={INK} strokeWidth={4} />
    {/* wallpaper + panelling */}
    <rect x={-900} y={80} width={3900} height={530} fill="url(#wallpaper7)" />
    <rect x={-900} y={80} width={3900} height={530} fill="#3a2a14" opacity={0.18} />
    <rect x={-900} y={606} width={3900} height={WALL_BASE - 606} fill="url(#panel7)" />
    <rect x={-900} y={596} width={3900} height={18} fill="#8a5e36" stroke={INK} strokeWidth={4} />
    {/* water stain + the one wallpaper seam that peeled */}
    <path d={blob(1260, 150, 120, 50, 11, 0.3, "wstain")} fill="#6a4a1a" opacity={0.25} />
    <path d="M1010,82 L1010,300 L1030,330 L1030,82 Z" fill="#e8dcb8" opacity={0.7} stroke={INK} strokeWidth={2} />
  </g>
);

const Floor: React.FC<{ t: number }> = () => (
  <g>
    <rect x={-900} y={WALL_BASE} width={3900} height={900} fill="url(#carpet7)" />
    <rect x={-900} y={WALL_BASE} width={3900} height={900} fill="#2a1408" opacity={0.15} />
    <rect x={-900} y={WALL_BASE - 8} width={3900} height={20} fill="#4f331e" stroke={INK} strokeWidth={4} />
    {/* clear plastic runner from the door to the hallway (mama's rule) */}
    <path d={`M${DOOR.x0 - 10},${WALL_BASE + 12} L${DOOR.x1 + 20},${WALL_BASE + 12} L1500,1160 L-200,1160 L-120,${WALL_BASE + 96} L280,${WALL_BASE + 12} L1280,${WALL_BASE + 40} Z`} fill="#e8f2f6" opacity={0.16} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={3} />
    {/* stains */}
    <path d={blob(1180, 1040, 90, 22, 10, 0.25, "cs1")} fill="#5a2a12" opacity={0.4} />
    <path d={blob(420, 990, 60, 16, 9, 0.3, "cs2")} fill="#3a1a08" opacity={0.35} />
  </g>
);

const Hallway: React.FC<{ light: number }> = ({ light }) => (
  <g>
    <rect x={30} y={250} width={240} height={WALL_BASE - 250} fill="#7a5a36" stroke={INK} strokeWidth={6} />
    <rect x={48} y={268} width={204} height={WALL_BASE - 268} fill={light > 0.5 ? "#e8d2a0" : "#120d0a"} />
    {light > 0.5 ? (
      <g>
        {/* far end of the hall: a bedroom door, a crucifix-shaped clean spot, the bare bulb */}
        <rect x={110} y={330} width={90} height={WALL_BASE - 330} fill="#c4a874" stroke={INK} strokeWidth={4} />
        <circle cx={186} cy={600} r={6} fill="#d9b44a" stroke={INK} strokeWidth={2} />
        <path d="M150,268 L150,300" stroke={INK} strokeWidth={3} />
        <circle cx={150} cy={308} r={10} fill="#fff6c8" stroke={INK} strokeWidth={3} />
        <path d={`M48,${WALL_BASE} L252,${WALL_BASE} L230,${WALL_BASE - 40} L70,${WALL_BASE - 40} Z`} fill="#b08a56" opacity={0.6} />
      </g>
    ) : (
      <path d="M60,280 L240,280 L240,860 L60,860 Z" fill="#000" opacity={0.3} />
    )}
  </g>
);

const FloorLamp: React.FC<{ on: number }> = ({ on }) => (
  <g>
    {on > 0 ? <ellipse cx={300} cy={330} rx={260} ry={300} fill="#ffd98a" opacity={0.16 * on} /> : null}
    <ellipse cx={300} cy={WALL_BASE + 20} rx={56} ry={12} fill="#2a2018" stroke={INK} strokeWidth={4} />
    <path d={`M300,${WALL_BASE + 14} L300,360`} stroke={INK} strokeWidth={12} />
    <path d={`M300,${WALL_BASE + 14} L300,360`} stroke="#b89a4a" strokeWidth={6} />
    <path d="M222,360 L378,360 L350,250 L250,250 Z" fill={on > 0 ? "#f4d79a" : "#c9b48a"} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    {Array.from({ length: 14 }).map((_, i) => (
      <path key={i} d={`M${226 + i * 11},360 l${(i % 2) * 2 - 1},16`} stroke="#c47a3a" strokeWidth={4} strokeLinecap="round" />
    ))}
    <path d="M250,250 L350,250" stroke="#c47a3a" strokeWidth={6} />
  </g>
);

const Banner: React.FC = () => (
  <g>
    <path id="bannerArc" d="M372,126 Q660,198 948,128" fill="none" />
    <path d="M360,118 Q660,192 960,118" stroke={INK} strokeWidth={3} fill="none" />
    <path d="M372,126 Q660,198 948,128 L948,170 Q660,240 372,168 Z" fill="#f2efe4" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <text fontFamily={FONT} fontWeight={900} fontSize={26} fill="#d0453a" letterSpacing={1.5}>
      <textPath href="#bannerArc" startOffset="3%">
        <tspan dy={31}>HAPPY 45th BIRTHDA</tspan>
        <tspan fill="#4a7fc0"> DUANE</tspan>
      </textPath>
    </text>
    {/* the Y fell off */}
    <g transform="translate(1110 922) rotate(28)">
      <rect x={-16} y={-20} width={32} height={40} fill="#f2efe4" stroke={INK} strokeWidth={3} />
      <text x={0} y={12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={28} fill="#d0453a">
        Y
      </text>
    </g>
  </g>
);

/** Mama's glamour portrait (her eyes follow you). */
const MamaPortrait: React.FC<{ look: Pt; squint?: number }> = ({ look, squint = 0 }) => {
  const { x, y } = PORTRAIT;
  const ex = look[0] * 4;
  const ey = look[1] * 3;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx={92} ry={116} fill="#c9a33a" stroke={INK} strokeWidth={6} />
      <ellipse rx={80} ry={104} fill="#e2bf52" stroke="#8f6f1e" strokeWidth={3} />
      <ellipse rx={68} ry={92} fill="#6a86a6" stroke={INK} strokeWidth={4} />
      {/* soft-focus 80s glamour shot */}
      <ellipse cx={0} cy={0} rx={60} ry={84} fill="#8aa4bf" opacity={0.6} />
      <path d={blob(0, -24, 54, 46, 12, 0.3, "mamaHair")} fill="#4a3426" />
      <path d="M-40,92 C-40,30 40,30 40,92 Z" fill="#c95f86" stroke={INK} strokeWidth={3} />
      <path d={blob(0, 2, 34, 36, 10, 0.05, "mamaFace")} fill="#b39672" stroke={INK} strokeWidth={3} />
      <path d="M2,10 C22,6 38,14 40,24 C38,34 20,36 6,30 Z" fill="#4a3427" stroke={INK} strokeWidth={2.5} />
      <path d="M14,30 Q24,26 34,28" stroke="#e8604a" strokeWidth={4} fill="none" strokeLinecap="round" />
      {[-14, 10].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={-6} rx={8} ry={7 - squint * 4} fill="#efe6c8" stroke={INK} strokeWidth={2} />
          <circle cx={cx + ex} cy={-6 + ey} r={3.2} fill={INK} />
          <path d={`M${cx - 9},${-10 + squint * 3} L${cx + 9},${-10 + squint * 3 + (i ? -2 : 2) * squint}`} stroke="#4a3426" strokeWidth={squint > 0 ? 4 : 2} />
        </g>
      ))}
      <path d="M-26,-22 q12,-8 22,-2 M2,-24 q12,-6 22,2" stroke="#2a1a12" strokeWidth={2} fill="none" />
      <circle cx={-20} cy={22} r={7} fill="none" stroke="#e1b93f" strokeWidth={3} />
      {/* brass plate */}
      <rect x={-34} y={98} width={68} height={16} rx={3} fill="#d9b44a" stroke={INK} strokeWidth={2.5} />
      <text x={0} y={111} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={11} fill={INK}>
        MAMA
      </text>
    </g>
  );
};

/** Small framed snapshot: Duane on this same couch, party hat, Mama behind. year = label. */
export const CouchPhoto: React.FC<{ x: number; y: number; w: number; h: number; year: string; age: number; rot?: number; tint?: string }> = ({ x, y, w, h, year, age, rot = 0, tint = "#d8c49a" }) => {
  const k = w / 120;
  const kid = Math.min(1, 0.45 + age / 50);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-w / 2 - 8 * k} y={-h / 2 - 8 * k} width={w + 16 * k} height={h + 26 * k} fill="#3a2414" stroke={INK} strokeWidth={4} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={tint} />
      <g transform={`scale(${k})`}>
        {/* the couch, then and now */}
        <path d="M-50,30 L50,30 L50,4 L-50,4 Z" fill="#dd8f9c" stroke={INK} strokeWidth={2.5} />
        <path d="M-56,30 L-56,-6 L-44,-6 L-44,30 Z M56,30 L56,-6 L44,-6 L44,30 Z" fill="#dd8f9c" stroke={INK} strokeWidth={2.5} />
        {/* mama standing behind it, same glare every year */}
        <path d="M-10,4 C-26,-20 -22,-40 -4,-44 C14,-40 18,-20 6,4 Z" fill="#c95f86" stroke={INK} strokeWidth={2} />
        <circle cx={-4} cy={-50} r={10} fill="#b39672" stroke={INK} strokeWidth={2} />
        <path d="M-8,-52 l3,1 M0,-52 l3,-1" stroke={INK} strokeWidth={2} />
        <path d={blob(-4, -58, 11, 7, 7, 0.3, `ph${year}`)} fill="#b79ad1" stroke={INK} strokeWidth={1.5} />
        {/* duane, getting bigger and balder, party hat every time */}
        <g transform={`translate(22 22) scale(${kid})`}>
          <ellipse cx={0} cy={-10} rx={18} ry={18} fill="#7b3b46" stroke={INK} strokeWidth={2} />
          <circle cx={2} cy={-36} r={13} fill="#c4a277" stroke={INK} strokeWidth={2} />
          <path d="M-6,-46 L0,-70 L8,-46 Z" fill="#e9cf63" stroke={INK} strokeWidth={2} />
          <path d="M-3,-38 l3,0 M4,-38 l3,0" stroke={INK} strokeWidth={2} />
          <path d="M-2,-30 q4,-3 8,0" stroke={INK} strokeWidth={1.5} fill="none" />
        </g>
      </g>
      <text x={0} y={h / 2 + 14 * k} textAnchor="middle" fontFamily="Comic Sans MS, Comic Neue, cursive" fontWeight={700} fontSize={13 * k} fill="#e8dcc0">
        {year}
      </text>
    </g>
  );
};

const NumberBalloons: React.FC<{ t: number }> = ({ t }) => {
  const bob = Math.sin(t * 1.3) * 6;
  return (
    <g>
      {/* the 4 still floats, tied to the couch arm */}
      <path d={`M412,640 Q${398 + bob},560 ${400 + bob},${508 + bob}`} stroke="#f0ede4" strokeWidth={2.5} fill="none" />
      <g transform={`translate(${392 + bob} ${456 + bob}) rotate(${bob * 0.8})`}>
        <path d="M6,-56 L-34,10 L-34,24 L14,24 L14,52 L32,52 L32,24 L42,24 L42,10 L32,10 L32,-56 Z M14,10 L14,-20 L-8,10 Z" fill="#c8c8d0" stroke={INK} strokeWidth={4} strokeLinejoin="round" fillRule="evenodd" />
        <path d="M24,-46 L24,-10" stroke="#ffffff" strokeWidth={5} opacity={0.7} strokeLinecap="round" />
      </g>
      {/* the 5 gave up: sagging on its string by the couch */}
      <path d="M368,700 Q350,760 336,806" stroke="#f0ede4" strokeWidth={2.5} fill="none" />
      <g transform="translate(322 846) rotate(-26) scale(0.78 0.66)">
        <path d="M-20,-40 L24,-40 L24,-28 L-6,-28 L-8,-10 C20,-14 34,0 30,20 C26,40 -6,44 -24,30 L-18,20 C-6,30 16,28 16,16 C16,2 -6,0 -20,8 Z" fill="#c8c8d0" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M-10,-30 q20,10 34,-4 M-14,12 q14,12 26,4" stroke="#9a9aa4" strokeWidth={3} fill="none" />
      </g>
      {/* deflated regular balloons + a streamer */}
      <path d={blob(1240, 946, 30, 12, 8, 0.4, "db1")} fill="#3fa0d8" stroke={INK} strokeWidth={3} />
      <path d={blob(560, 1000, 26, 10, 8, 0.4, "db2")} fill="#e86a8a" stroke={INK} strokeWidth={3} />
      <path d="M1265,950 q20,10 34,4" stroke="#f0ede4" strokeWidth={2.5} fill="none" />
    </g>
  );
};

/** The couch, in its plastic. */
const Couch: React.FC<{ squeak?: number; t: number }> = ({ squeak = 0, t }) => {
  const glint = (t * 0.2) % 1;
  return (
    <g>
      <defs>
        <linearGradient id="plastic7" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0.28} />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity={0.05} />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity={0.22} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0.06} />
        </linearGradient>
      </defs>
      {/* back cushions */}
      <path d="M418,720 L418,540 Q418,500 470,500 L1010,500 Q1062,500 1062,540 L1062,720 Z" fill="url(#couchFloralDk)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M440,700 L440,560 Q440,522 492,522 L730,522 Q752,522 752,560 L752,700 Z M752,700 L752,560 Q752,522 790,522 L990,522 Q1040,522 1040,560 L1040,700 Z" fill="url(#couchFloral)" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {/* doily on the back */}
      <path d={blob(600, 516, 44, 14, 12, 0.2, "doily")} fill="#f6f2e8" stroke={INK} strokeWidth={2.5} />
      {/* seat cushions + skirt */}
      <path d="M400,736 Q400,712 430,712 L1050,712 Q1080,712 1080,736 L1080,800 L400,800 Z" fill="url(#couchFloral)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M740,714 L740,800" stroke={INK} strokeWidth={4} />
      <path d="M396,800 L1084,800 L1078,890 L402,890 Z" fill="url(#couchFloralDk)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <path key={i} d={`M${420 + i * 80},806 L${420 + i * 80},884`} stroke="#00000033" strokeWidth={4} />
      ))}
      {[420, 1060].map((lx) => (
        <rect key={lx} x={lx - 10} y={888} width={20} height={20} fill="#4f331e" stroke={INK} strokeWidth={3} />
      ))}
      {/* rolled arms */}
      {[
        [352, 448],
        [1032, 1128],
      ].map(([a, b], i) => (
        <g key={i}>
          <path d={`M${a},890 L${a},676 Q${a},630 ${(a + b) / 2},630 Q${b},630 ${b},676 L${b},890 Z`} fill="url(#couchFloral)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <ellipse cx={(a + b) / 2} cy={668} rx={(b - a) / 2 - 6} ry={30} fill="url(#couchFloralDk)" stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {/* the plastic cover: shine, creases, a split seam */}
      <path d="M352,890 L352,630 Q400,612 448,630 L448,700 L418,700 L418,540 Q418,500 470,500 L1010,500 Q1062,500 1062,540 L1062,700 L1032,700 L1032,630 Q1080,612 1128,630 L1128,890 Z" fill="url(#plastic7)" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={3} />
      <path d={`M${460 + glint * 500},510 l60,0 l-120,380 l-40,0 Z`} fill="#ffffff" opacity={0.12} />
      <g stroke="#ffffff" strokeOpacity={0.55} strokeWidth={2.5} fill="none" strokeLinecap="round">
        <path d="M470,560 q20,30 6,70 M980,548 q-16,40 4,84 M560,730 q40,8 80,-2 M900,734 q30,10 70,0" />
        <path d="M376,700 q10,40 -4,90 M1100,700 q-10,50 4,100" />
      </g>
      <path d="M690,800 l14,-8 l10,10 l14,-10" stroke="#ffffff" strokeOpacity={0.7} strokeWidth={2.5} fill="none" />
      {/* squeak lines when someone shifts on it */}
      {squeak > 0
        ? [0, 1, 2].map((i) => (
            <path key={i} d={`M${700 + i * 26},${704 - i * 6} l${8 + i * 4},-${18 + i * 6}`} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={squeak} />
          ))
        : null}
    </g>
  );
};

const CuckooClock: React.FC<{ minutes: number; cuckoo: number; t: number }> = ({ minutes, cuckoo, t }) => {
  const { x, y } = CLOCK;
  const pend = Math.sin(t * 3.4) * 14;
  const mAng = minutes * 6;
  const hAng = 90 + minutes * 0.5;
  const out = cuckoo;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* chains + pine-cone weights */}
      <path d="M-18,70 L-18,206 M18,70 L18,176" stroke="#8a7a50" strokeWidth={3} strokeDasharray="4 3" />
      <path d={blob(-18, 222, 10, 22, 8, 0.1, "cone1")} fill="#5a3a1e" stroke={INK} strokeWidth={3} />
      <path d={blob(18, 192, 10, 22, 8, 0.1, "cone2")} fill="#5a3a1e" stroke={INK} strokeWidth={3} />
      <g transform={`rotate(${pend} 0 70)`}>
        <path d="M0,70 L0,160" stroke="#8a7a50" strokeWidth={4} />
        <path d="M-12,160 L12,160 L0,186 Z" fill="#d9b44a" stroke={INK} strokeWidth={3} />
      </g>
      {/* carved house */}
      <path d="M-74,-30 L0,-96 L74,-30 Z" fill="#4a2c16" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={-60} y={-32} width={120} height={104} fill="#7a4a24" stroke={INK} strokeWidth={5} />
      {[-48, 48].map((lx) => (
        <path key={lx} d={`M${lx},72 q-10,10 0,22 q10,-12 0,-22`} fill="#4a2c16" stroke={INK} strokeWidth={2.5} />
      ))}
      {/* little door + the bird (a bird skeleton on a spring) */}
      <rect x={-15} y={-62} width={30} height={32} fill="#120a06" stroke={INK} strokeWidth={3} />
      {out > 0.05 ? (
        <g>
          {/* little doors flung open */}
          <path d="M-15,-62 L-26,-66 L-26,-26 L-15,-30 Z M15,-62 L26,-66 L26,-26 L15,-30 Z" fill="#5a3a1e" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
          <g transform={`translate(0 ${-46 + (1 - out) * 4}) scale(${0.4 + out * 0.6})`}>
            {/* the spring */}
            <path d="M0,0 l8,-6 l8,6 l8,-6 l8,6" stroke="#c9c2b0" strokeWidth={3} fill="none" transform={`scale(${out} 1)`} />
            <g transform={`translate(${out * 36} 0) rotate(${Math.sin(t * 20) * 6 * out})`}>
              {/* ribcage */}
              <path d="M-14,-6 C-2,-16 18,-12 22,0 C16,10 -2,12 -14,6 Z" fill="none" stroke="#efe9d8" strokeWidth={4} />
              {[0, 1, 2, 3].map((r) => (
                <path key={r} d={`M${-8 + r * 7},-10 q4,10 0,18`} stroke="#efe9d8" strokeWidth={3} fill="none" />
              ))}
              <path d="M-14,0 L22,0" stroke="#efe9d8" strokeWidth={3} />
              {/* wing bones */}
              <path d="M-2,-10 l-14,-16 l-10,8 M2,-10 l-6,-20" stroke="#efe9d8" strokeWidth={3} fill="none" strokeLinecap="round" />
              {/* the skull */}
              <path d="M18,-24 C26,-34 44,-30 44,-16 C44,-8 36,-4 28,-6 C20,-8 14,-16 18,-24 Z" fill="#efe9d8" stroke={INK} strokeWidth={3} />
              <circle cx={32} cy={-18} r={5} fill={INK} />
              <path d={`M42,-20 L60,${-18 + out * 2} L42,-12 Z`} fill="#e8dcae" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
              <path d={`M42,-12 L56,${-6 + out * 6} L40,-8 Z`} fill="#e8dcae" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
            </g>
          </g>
        </g>
      ) : (
        <path d="M0,-62 L0,-30" stroke={INK} strokeWidth={2.5} />
      )}
      {/* dial */}
      <circle cx={0} cy={14} r={34} fill="#f0e8d0" stroke={INK} strokeWidth={4} />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d="M0,-26 L0,-20" stroke={INK} strokeWidth={3} transform={`translate(0 14) rotate(${i * 30})`} />
      ))}
      <path d={`M0,14 L${Math.sin((hAng * Math.PI) / 180) * 16},${14 - Math.cos((hAng * Math.PI) / 180) * 16}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <path d={`M0,14 L${Math.sin((mAng * Math.PI) / 180) * 26},${14 - Math.cos((mAng * Math.PI) / 180) * 26}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx={0} cy={14} r={4} fill={INK} />
      {/* carved leaves + the deer skull on top */}
      <path d="M-64,-26 q-20,-10 -16,-30 q16,4 18,26 M64,-26 q20,-10 16,-30 q-16,4 -18,26" fill="#5a3a1e" stroke={INK} strokeWidth={3} />
      <path d="M-10,-104 C-12,-118 12,-118 10,-104 C8,-96 -8,-96 -10,-104 Z" fill="#efe9d8" stroke={INK} strokeWidth={3} />
      <path d="M-8,-114 q-14,-14 -20,-6 M8,-114 q14,-14 20,-6" stroke="#efe9d8" strokeWidth={4} fill="none" />
    </g>
  );
};

const Window: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={1210} y={292} width={240} height={318} fill="#5a3a20" stroke={INK} strokeWidth={6} />
    <rect x={1226} y={308} width={208} height={286} fill="#141a32" />
    {/* streetlight glow + the moon behind a power line */}
    <circle cx={1400} cy={360} r={70} fill="#ffb45a" opacity={0.2} />
    <circle cx={1270} cy={350} r={20} fill="#efe8c8" opacity={0.85} />
    <path d="M1226,400 Q1330,430 1434,396" stroke="#06080f" strokeWidth={3} fill="none" />
    <path d="M1226,560 L1300,520 L1360,540 L1434,500 L1434,594 L1226,594 Z" fill="#0a0d1a" />
    <circle cx={1360 + Math.sin(t * 0.7) * 2} cy={548} r={3} fill="#ffe28a" />
    <path d="M1330,308 L1330,594 M1226,450 L1434,450" stroke="#5a3a20" strokeWidth={8} />
    {/* lace curtains */}
    <path d="M1216,300 Q1250,300 1262,612 L1216,612 Z" fill="#f2ecdc" opacity={0.85} stroke={INK} strokeWidth={3} />
    <path d="M1444,300 Q1410,300 1398,612 L1444,612 Z" fill="#f2ecdc" opacity={0.85} stroke={INK} strokeWidth={3} />
    <path d="M1226,340 q10,8 20,0 M1226,400 q12,8 24,0 M1424,360 q10,8 20,0 M1420,460 q10,8 20,0" stroke="#d8d0bc" strokeWidth={2} fill="none" />
    <rect x={1200} y={286} width={260} height={14} rx={4} fill="#c9a33a" stroke={INK} strokeWidth={3} />
  </g>
);

const FrontDoor: React.FC<{ open: number; t: number; switchOn: boolean }> = ({ open, t, switchOn }) => {
  const { x0, x1, top } = DOOR;
  const w = x1 - x0;
  const k = easeInOut(open);
  const dw = w * (1 - k * 0.82);
  return (
    <g>
      {/* frame */}
      <rect x={x0 - 22} y={top - 22} width={w + 44} height={WALL_BASE - top + 22} fill="#5a3a20" stroke={INK} strokeWidth={6} />
      {/* outside: porch light + night */}
      <rect x={x0} y={top} width={w} height={WALL_BASE - top} fill="#0e1428" />
      <circle cx={x0 + w * 0.7} cy={top + 120} r={60} fill="#ffcf7a" opacity={0.25} />
      <path d={`M${x0},${WALL_BASE} L${x1},${WALL_BASE} L${x1},${WALL_BASE - 90} L${x0},${WALL_BASE - 60} Z`} fill="#2a2a32" />
      {[0, 1, 2].map((i) => {
        const mx = x0 + w * 0.7 + noise2D(`moth${i}`, t * 1.6, i) * 50;
        const my = top + 120 + noise2D(`mothy${i}`, i, t * 1.6) * 40;
        return <path key={i} d={`M${mx - 6},${my} l6,-4 l6,4 l-6,3 Z`} fill="#d8ccb0" />;
      })}
      {/* the door itself (swings in toward camera = narrows) */}
      <g>
        <rect x={x1 - dw} y={top} width={dw} height={WALL_BASE - top} fill="#8a5a30" stroke={INK} strokeWidth={6} />
        {open < 0.5 ? (
          <g>
            {[0, 1].map((r) =>
              [0, 1].map((c) => <rect key={`${r}${c}`} x={x1 - dw + 22 + c * (dw / 2 - 12)} y={top + 30 + r * 300} width={dw / 2 - 34} height={260} fill="none" stroke="#5a3a1e" strokeWidth={5} />),
            )}
            <circle cx={x1 - dw + 28} cy={600} r={12} fill="#d9b44a" stroke={INK} strokeWidth={3} />
            <circle cx={x1 - dw / 2} cy={top + 140} r={6} fill="#1a1a1a" stroke="#d9b44a" strokeWidth={3} />
            <path d={`M${x1 - dw + 10},${520} q30,26 60,4`} stroke="#c9c9c4" strokeWidth={4} fill="none" strokeDasharray="6 4" />
            {/* the welcome sign that isn't */}
            <g transform={`translate(${x1 - dw / 2} ${top + 230}) rotate(-3)`}>
              <rect x={-70} y={-26} width={140} height={52} rx={4} fill="#f2e6c8" stroke={INK} strokeWidth={3} />
              <text x={0} y={-4} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill="#8a2a1a">
                NO SHOES
              </text>
              <text x={0} y={16} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={12} fill={INK}>
                CURFEW 11PM
              </text>
            </g>
          </g>
        ) : null}
      </g>
      {/* light switch (the disco circuit) */}
      <rect x={1494} y={540} width={30} height={46} rx={4} fill="#efe8d4" stroke={INK} strokeWidth={3} />
      <rect x={1503} y={switchOn ? 548 : 562} width={12} height={16} rx={2} fill="#d8d0b8" stroke={INK} strokeWidth={2} />
      <path d="M1509,586 L1509,610 L1440,612" stroke="#efe8d4" strokeWidth={4} fill="none" opacity={0.6} />
      {/* coat hook: mama's raincoat */}
      <path d="M1852,404 l0,18" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M1852,420 C1830,424 1816,436 1810,452 L1798,704 L1912,704 L1900,452 C1892,436 1876,424 1852,420 Z" fill="#c9b24a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M1812,456 L1790,640 L1810,642 L1826,470 M1896,456 L1918,640 L1898,642 L1884,470" fill="#b39c3c" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M1852,424 L1852,700 M1836,520 l10,0 M1836,580 l10,0 M1836,640 l10,0" stroke="#8a7a2a" strokeWidth={3} />
      <path d="M1834,424 Q1852,396 1870,424" fill="#b39c3c" stroke={INK} strokeWidth={3.5} />
      <rect x={1510} y={WALL_BASE + 6} width={300} height={30} rx={6} fill="#5a6a3a" stroke={INK} strokeWidth={4} />
    </g>
  );
};

const CoffeeTable: React.FC<{ t: number; candles: number }> = ({ t, candles }) => {
  return (
    <g>
      {/* legs + top */}
      {[580, 1000].map((lx) => (
        <path key={lx} d={`M${lx},876 L${lx - 6},984`} stroke={INK} strokeWidth={16} strokeLinecap="round" />
      ))}
      {[580, 1000].map((lx) => (
        <path key={`c${lx}`} d={`M${lx},876 L${lx - 6},984`} stroke="#5a3a1e" strokeWidth={8} strokeLinecap="round" />
      ))}
      <path d="M548,850 L1032,850 L1052,880 L528,880 Z" fill="#6a4426" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M528,880 L1052,880 L1052,896 L528,896 Z" fill="#4f331e" stroke={INK} strokeWidth={4} />
      {/* doily ring stains */}
      <ellipse cx={860} cy={868} rx={20} ry={5} fill="none" stroke="#3a2210" strokeWidth={3} opacity={0.6} />
      {/* the sheet cake: one slice gone, number candles 4 and 5 */}
      <g transform={`translate(${CAKE.x} ${CAKE.y})`}>
        <path d="M-80,0 L80,0 L84,-12 L76,-40 L-76,-40 L-84,-12 Z" fill="#e8e0f0" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M20,-40 L56,-40 L56,0 L20,0 Z" fill="#6a3a24" stroke={INK} strokeWidth={3} />
        <path d="M20,-40 L56,-40 L56,-30 L20,-30 Z" fill="#f2ecf6" />
        <path d="M-76,-40 q10,8 20,0 q10,8 20,0 q10,8 20,0 q10,8 20,0 M56,-40 q10,8 20,0" stroke="#c97aa8" strokeWidth={4} fill="none" />
        <text x={-30} y={-14} textAnchor="middle" fontFamily="Comic Sans MS, Comic Neue, cursive" fontWeight={700} fontSize={13} fill="#4a7fc0">
          HBD DUANE
        </text>
        {[
          [-48, "4"],
          [-18, "5"],
        ].map(([cx, n], i) => (
          <g key={i} transform={`translate(${cx} -40) rotate(${i ? 8 : -4})`}>
            <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#f2d24a" stroke={INK} strokeWidth={2.5}>
              {n}
            </text>
            <path d={`M2,-30 l0,-10`} stroke={INK} strokeWidth={2} />
            {candles > 0 ? (
              <path d={`M2,-42 q-6,-8 0,-${16 + Math.sin(t * 14 + i) * 3} q6,8 0,${16 + Math.sin(t * 14 + i) * 3}`} fill="#ffb43a" stroke={INK} strokeWidth={1.5} />
            ) : (
              <path d={`M2,-44 q-6,-12 2,-24 q8,-12 0,-24`} stroke="#bbb" strokeWidth={3} fill="none" opacity={0.5} />
            )}
            {/* wax drips down the numbers */}
            <path d="M-8,-8 l0,10 M10,-14 l0,8" stroke="#f2d24a" strokeWidth={4} strokeLinecap="round" />
          </g>
        ))}
      </g>
      {/* chips bowl, empty cans, the remote */}
      <path d="M740,850 Q770,876 800,850 Z" fill="#b8d0e0" stroke={INK} strokeWidth={4} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${748 + i * 12},${846 - (i % 2) * 6} l10,-8 l6,10 Z`} fill="#e8a83a" stroke={INK} strokeWidth={1.5} />
      ))}
      {[
        [846, 0],
        [884, 1],
        [818, 2],
      ].map(([cx, i]) => (
        <g key={i} transform={`translate(${cx} ${850 - (i === 2 ? -4 : 0)}) rotate(${i === 2 ? 84 : i * 6})`}>
          <rect x={-11} y={-40} width={22} height={40} rx={4} fill="#a9bccb" stroke={INK} strokeWidth={3} />
          <rect x={-11} y={-28} width={22} height={13} fill="#d64545" />
        </g>
      ))}
      <rect x={890} y={862} width={46} height={12} rx={4} fill="#2a2a2a" stroke={INK} strokeWidth={2} transform="rotate(-6 912 868)" />
      {/* the MOVE OUT FUND */}
      <MoveOutJar t={t} />
    </g>
  );
};

export const MoveOutJar: React.FC<{ t: number; moth?: number }> = ({ t, moth = 0 }) => (
  <g transform={`translate(${JAR.x} ${JAR.y})`}>
    <path d="M-24,0 L24,0 L26,-44 Q26,-52 18,-54 L-18,-54 Q-26,-52 -26,-44 Z" fill="#dbeaf0" fillOpacity={0.45} stroke={INK} strokeWidth={3.5} />
    <rect x={-20} y={-62} width={40} height={10} rx={3} fill="#c9a33a" stroke={INK} strokeWidth={3} />
    <rect x={-22} y={-40} width={44} height={20} fill="#f6f0dc" stroke={INK} strokeWidth={2} transform="rotate(-3)" />
    <text x={0} y={-33} textAnchor="middle" fontFamily="Comic Sans MS, Comic Neue, cursive" fontWeight={700} fontSize={7} fill="#c0392b" transform="rotate(-3)">
      MOVE OUT
    </text>
    <text x={0} y={-24} textAnchor="middle" fontFamily="Comic Sans MS, Comic Neue, cursive" fontWeight={700} fontSize={7} fill="#c0392b" transform="rotate(-3)">
      FUND
    </text>
    {/* three coins, a button, lint */}
    <ellipse cx={-8} cy={-5} rx={7} ry={2.5} fill="#c98a4a" stroke={INK} strokeWidth={1.5} />
    <ellipse cx={6} cy={-4} rx={6} ry={2.2} fill="#c9c9c4" stroke={INK} strokeWidth={1.5} />
    <ellipse cx={0} cy={-8} rx={5} ry={2} fill="#c98a4a" stroke={INK} strokeWidth={1.5} />
    <circle cx={14} cy={-8} r={4} fill="#4a7fc0" stroke={INK} strokeWidth={1.2} />
    <path d={blob(-14, -10, 5, 3, 6, 0.4, "lint")} fill="#9a9a9a" />
    {moth > 0 ? (
      <g transform={`translate(${moth * 70 + Math.sin(t * 20) * 5} ${-58 - moth * 70}) scale(1.7)`}>
        <path d={`M0,0 l-14,${-6 + (Math.floor(t * 24) % 2) * 8} l4,12 Z M0,0 l14,${-6 + (Math.floor(t * 24) % 2) * 8} l-4,12 Z`} fill="#e8dcc0" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <ellipse cx={0} cy={2} rx={2.8} ry={6} fill="#5a4a30" stroke={INK} strokeWidth={1} />
        <path d="M-1,-4 l-4,-6 M1,-4 l4,-6" stroke={INK} strokeWidth={1.2} />
      </g>
    ) : null}
  </g>
);

const CeilingFan: React.FC<{ t: number; speed: number; disco: number }> = ({ t, speed, disco }) => {
  const ang = t * speed * 360;
  const cx = 1000;
  return (
    <g>
      <path d={`M${cx},-40 L${cx},64`} stroke={INK} strokeWidth={10} />
      <path d={`M${cx},-40 L${cx},64`} stroke="#b89a4a" strokeWidth={5} />
      {Array.from({ length: 4 }).map((_, i) => {
        const a = ((ang + i * 90) * Math.PI) / 180;
        const bx = Math.cos(a) * 220;
        const by = Math.sin(a) * 26;
        const front = Math.sin(a) > 0;
        return (
          <path
            key={i}
            d={`M${cx},70 L${cx + bx - 18},${70 + by - 6} Q${cx + bx * 1.08},${70 + by} ${cx + bx - 18},${70 + by + 10} Z`}
            fill={front ? "#7a5030" : "#5a3a20"}
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
            opacity={speed > 1 ? 0.75 : 1}
          />
        );
      })}
      <ellipse cx={cx} cy={74} rx={34} ry={16} fill="#b89a4a" stroke={INK} strokeWidth={4} />
      {/* the streamer somebody taped to it */}
      <path d={`M${cx + 20},80 q${10 + Math.sin(t * 3) * 10},40 -4,84 q-10,30 6,60`} stroke="#e86a8a" strokeWidth={6} fill="none" />
      {/* disco ball on a chain */}
      <path d={`M${cx},86 L${cx},126`} stroke="#9a9a9a" strokeWidth={3} strokeDasharray="4 3" />
      <DiscoBall cx={cx} cy={162} r={36} t={t} on={disco} />
    </g>
  );
};

const DiscoBall: React.FC<{ cx: number; cy: number; r: number; t: number; on: number }> = ({ cx, cy, r, t, on }) => {
  const rot = (t * (on > 0 ? 0.5 : 0.02)) % 1;
  return (
    <g>
      <defs>
        <clipPath id="discoClip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="#8a8f98" />
      <g clipPath="url(#discoClip)">
        {Array.from({ length: 7 }).map((_, row) =>
          Array.from({ length: 9 }).map((_, col) => {
            const u = (col / 9 + rot) % 1;
            const xx = cx + Math.sin((u - 0.5) * Math.PI) * r * Math.cos(((row - 3) / 7) * Math.PI);
            const yy = cy + ((row - 3) / 3.5) * r;
            const lit = rnd(`df${row}${col}${Math.floor(t * (on > 0 ? 8 : 0.2))}`) > 0.6;
            return <rect key={`${row}-${col}`} x={xx - 5} y={yy - 4} width={9} height={8} fill={lit && on > 0 ? "#ffffff" : "#b8bec8"} stroke="#5a5f68" strokeWidth={1} />;
          }),
        )}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={4} />
      {on > 0 ? <circle cx={cx - 12} cy={cy - 14} r={8} fill="#ffffff" opacity={0.9} /> : null}
    </g>
  );
};

/** Disco light spots sweeping the room (drawn over everything, screen blend). */
export const PartyLights: React.FC<{ t: number; amount: number; beat: number }> = ({ t, amount, beat }) => {
  const dots = useMemo(() => Array.from({ length: 22 }).map((_, i) => ({ y: 120 + rnd(`py${i}`) * 900, ph: rnd(`pp${i}`), sp: 0.12 + rnd(`ps${i}`) * 0.1, c: ["#ff5ab4", "#5ae0ff", "#fff07a", "#8aff6a", "#b07aff"][i % 5] })), []);
  if (amount <= 0) return null;
  const pulse = 0.75 + 0.25 * Math.cos(beat * Math.PI * 2);
  return (
    <g style={{ mixBlendMode: "screen" }} opacity={amount}>
      <rect x={-900} y={-600} width={3900} height={2400} fill={["#7a1a6a", "#1a4a7a", "#6a5a1a", "#1a6a3a"][Math.floor(beat) % 4]} opacity={0.22 * pulse} />
      {dots.map((d, i) => {
        const x = -200 + (((d.ph + t * d.sp) % 1) * 2600);
        return <ellipse key={i} cx={x} cy={d.y + Math.sin(t * 0.8 + i) * 30} rx={16} ry={11} fill={d.c} opacity={0.85 * pulse} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

export interface RoomState {
  /** 0..1 disco lights on */
  party: number;
  /** music beat phase (beats since the drop) */
  beat: number;
  /** ceiling fan revolutions per second */
  fan: number;
  /** 0..1 front door open */
  door: number;
  switchOn: boolean;
  /** hallway light (Mama) */
  hall: number;
  /** cuckoo bird out 0..1 */
  cuckoo: number;
  /** clock minutes past 3 */
  minutes: number;
  /** where Mama's portrait is looking + squint */
  portraitLook: Pt;
  portraitSquint: number;
  candles: number;
  lamp: number;
  squeak: number;
}

export const DEFAULT_ROOM: RoomState = {
  party: 0,
  beat: 0,
  fan: 0.18,
  door: 0,
  switchOn: false,
  hall: 0,
  cuckoo: 0,
  minutes: 0,
  portraitLook: [0.8, 0.4],
  portraitSquint: 0,
  candles: 1,
  lamp: 1,
  squeak: 0,
};

export const RoomBackdrop: React.FC<{ t: number; frame: number; set: RoomState }> = ({ t, set }) => (
  <g>
    <Patterns />
    <Walls />
    <Hallway light={set.hall} />
    <Window t={t} />
    <FrontDoor open={set.door} t={t} switchOn={set.switchOn} />
    <FloorLamp on={set.lamp} />
    <Banner />
    <MamaPortrait look={set.portraitLook} squint={set.portraitSquint} />
    <CouchPhoto x={462} y={292} w={96} h={74} year="1990" age={8} rot={-4} />
    <CouchPhoto x={828} y={290} w={96} h={74} year="2006" age={24} rot={3} />
    <CouchPhoto x={480} y={440} w={70} h={54} year="1983" age={1} rot={2} />
    <CouchPhoto x={806} y={436} w={70} h={54} year="2019" age={38} rot={-3} />
    <CuckooClock minutes={set.minutes} cuckoo={set.cuckoo} t={t} />
    <Floor t={t} />
    <NumberBalloons t={t} />
  </g>
);

export interface RoomSceneProps {
  from: Cam;
  to?: Cam;
  ease?: (x: number) => number;
  cam?: Cam;
  duane?: Partial<DuaneProps> | false;
  lyle?: Partial<LyleProps> | false;
  mama?: Partial<MamaProps> | false;
  set?: Partial<RoomState>;
  shakeAmp?: number;
  /** drawn after the couch, before the coffee table (e.g. Duane standing elsewhere) */
  mid?: React.ReactNode;
  back?: React.ReactNode;
  front?: React.ReactNode;
  overlay?: React.ReactNode;
  /** draw Lyle behind the coffee table (when he's near the couch) */
  lyleBehind?: boolean;
}

export const RoomScene: React.FC<RoomSceneProps> = ({ from, to, ease = easeInOut, cam, duane = {}, lyle = {}, mama = false, set = {}, shakeAmp = 0, mid, back, front, overlay, lyleBehind = false }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const camNow = cam ?? (to ? camLerp(from, to, ease(shot.p)) : from);
  const st = { ...DEFAULT_ROOM, ...set };
  const sd = useSpeech("duane");
  const sl = useSpeech("lyle");
  const lyleNode = lyle ? <Goat id="lyle" x={LYLE_POS.x} y={LYLE_POS.y} flip t={t} frame={frame} {...sl} {...lyle} /> : null;
  const sitting = duane && (duane.pose ?? "sit") === "sit";
  return (
    <Stage
      cam={camNow}
      frame={frame}
      shakeAmp={shakeAmp}
      overlay={overlay ?? <LightWash id="lampwash" color="#ffd28a" cx={300} cy={300} r={900} opacity={0.12 * st.lamp} />}
    >
      <RoomBackdrop t={t} frame={frame} set={st} />
      {mama ? <Mama id="mama" x={MAMA_POS.x} y={MAMA_POS.y} scale={0.84} t={t} frame={frame} {...mama} /> : null}
      {back}
      <Couch t={t} squeak={st.squeak} />
      {duane && sitting ? <Hyena id="duane" x={DUANE_POS.x} y={DUANE_POS.y} t={t} frame={frame} {...sd} {...duane} /> : null}
      {lyleBehind ? lyleNode : null}
      {mid}
      <CoffeeTable t={t} candles={st.candles} />
      {duane && !sitting ? <Hyena id="duane" x={DUANE_POS.x} y={LYLE_POS.y} t={t} frame={frame} {...sd} {...duane} /> : null}
      {lyleBehind ? null : lyleNode}
      <CeilingFan t={t} speed={st.fan} disco={st.party} />
      {front}
      <PartyLights t={t} amount={st.party} beat={st.beat} />
    </Stage>
  );
};


