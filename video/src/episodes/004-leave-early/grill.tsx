import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { INK } from "../../characters/parts";
import { Possum, DaleProps, DALE_HEAD } from "../../characters/Possum";
import { Raccoon, ChetProps, CHET_HEAD } from "../../characters/Raccoon";
import { Vulture, GizzardProps, GIZZARD_HEAD } from "../../characters/Vulture";
import { useEpisode } from "../../engine/context";
import { Cam, LightWash, Stage, camLerp } from "../../engine/Stage";
import { energyAt, isTalking, mouthAt } from "../../engine/timeline";
import { blob, cloudPath, easeInOut, onN, rnd } from "../../engine/util";

/* EPISODE 004 set: the ROADKILL GRILL, a roadside joint at 3:47 AM. One kitchen world, many cameras. */

export const DALE_POS = { x: 560, y: 965 };
export const CHET_POS = { x: 1300, y: 972 };
export const PERCH_POS = { x: 1820, y: 524 };
export const GIZ_POS = { x: 1080, y: 978 };

/** world head positions (for cameras and 9:16 speaker follow) */
export const HEADS = {
  dale: { x: DALE_POS.x + DALE_HEAD[0], y: DALE_POS.y + DALE_HEAD[1] },
  chet: { x: CHET_POS.x - CHET_HEAD[0], y: CHET_POS.y + CHET_HEAD[1] },
  gizzard: { x: GIZ_POS.x - GIZZARD_HEAD.stand[0], y: GIZ_POS.y + GIZZARD_HEAD.stand[1] },
  perch: { x: PERCH_POS.x - GIZZARD_HEAD.perch[0], y: PERCH_POS.y + GIZZARD_HEAD.perch[1] },
};

export const CAM4 = {
  wide: { x: 1010, y: 560, zoom: 0.92 },
  wideIn: { x: 1000, y: 580, zoom: 1.04 },
  two: { x: 930, y: 620, zoom: 1.25 },
  cuDale: { x: HEADS.dale.x + 40, y: HEADS.dale.y + 30, zoom: 2.5 },
  ecuDale: { x: HEADS.dale.x + 50, y: HEADS.dale.y + 10, zoom: 4.2 },
  msDale: { x: HEADS.dale.x + 60, y: HEADS.dale.y + 170, zoom: 1.6 },
  cuChet: { x: HEADS.chet.x - 40, y: HEADS.chet.y + 40, zoom: 2.5 },
  msChet: { x: HEADS.chet.x - 40, y: HEADS.chet.y + 160, zoom: 1.6 },
  cuGiz: { x: HEADS.gizzard.x - 30, y: HEADS.gizzard.y + 50, zoom: 2.4 },
  ecuGiz: { x: HEADS.gizzard.x - 50, y: HEADS.gizzard.y + 10, zoom: 4.4 },
  msGiz: { x: HEADS.gizzard.x - 20, y: HEADS.gizzard.y + 220, zoom: 1.5 },
  perch: { x: HEADS.perch.x + 10, y: HEADS.perch.y + 190, zoom: 1.7 },
  perchLow: { x: HEADS.perch.x - 20, y: HEADS.perch.y + 120, zoom: 2.3 },
} satisfies Record<string, Cam>;

export function useSpeech(name: string) {
  const { timeline, shot } = useEpisode();
  const tq = onN(shot.frame, 2) / shot.fps;
  return { mouth: mouthAt(timeline, name, tq), talking: isTalking(timeline, name, shot.t), energy: energyAt(timeline, shot.t) };
}

/* ------------------------------------------------------------------ */
/* Set pieces                                                          */
/* ------------------------------------------------------------------ */

const Floor: React.FC = () => {
  const lines = useMemo(() => {
    const vx = 1000;
    const vy = 260;
    const out: React.ReactNode[] = [];
    let yy = 905;
    let h = 34;
    while (yy < 1700) {
      out.push(<path key={`h${yy}`} d={`M-600,${yy} L2700,${yy}`} stroke="#2a1410" strokeWidth={4} />);
      yy += h;
      h *= 1.22;
    }
    for (let k = -8; k <= 26; k++) {
      const x0 = -400 + k * 120;
      const x1 = vx + (x0 - vx) * ((1700 - vy) / (905 - vy));
      out.push(<path key={`v${k}`} d={`M${x0},905 L${x1},1700`} stroke="#2a1410" strokeWidth={4} />);
    }
    return out;
  }, []);
  return (
    <g>
      <rect x={-800} y={900} width={3800} height={1000} fill="#6a3127" />
      {lines}
      <path d={blob(700, 1060, 260, 40, 10, 0.2, "grease1")} fill="#3a1a12" opacity={0.45} />
      <path d={blob(1500, 1120, 200, 30, 10, 0.25, "grease2")} fill="#3a1a12" opacity={0.4} />
      <ellipse cx={1010} cy={1040} rx={46} ry={14} fill="#1e100c" stroke="#3a2a22" strokeWidth={4} />
      <rect x={-800} y={898} width={3800} height={14} fill="#3b2a24" />
    </g>
  );
};

const WallTiles: React.FC = () => {
  const tiles = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let r = 0; r < 26; r++) {
      const y = 110 + r * 31;
      out.push(<path key={`r${r}`} d={`M-800,${y} L3000,${y}`} stroke="#b4ad98" strokeWidth={3} />);
      for (let c = -14; c < 50; c++) {
        const x = c * 64 + (r % 2 ? 32 : 0);
        out.push(<path key={`c${r}-${c}`} d={`M${x},${y} L${x},${y + 31}`} stroke="#b4ad98" strokeWidth={3} />);
      }
    }
    return out;
  }, []);
  return (
    <g>
      <defs>
        <linearGradient id="grime4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" stopColor="#5a4a2a" stopOpacity={0} />
          <stop offset="1" stopColor="#5a4a2a" stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <rect x={-800} y={100} width={3800} height={810} fill="#d9d4c1" />
      {tiles}
      <rect x={-800} y={100} width={3800} height={810} fill="url(#grime4)" />
      {[
        [470, 470, 160, 70],
        [1340, 520, 150, 60],
        [60, 640, 90, 120],
        [1960, 300, 120, 80],
      ].map(([x, y, rx, ry], i) => (
        <path key={i} d={blob(x, y, rx, ry, 11, 0.3, `stain${i}`)} fill="#8a6a2a" opacity={0.22} />
      ))}
      <rect x={-800} y={-400} width={3800} height={512} fill="#2b2622" />
      {Array.from({ length: 24 }).map((_, i) => (
        <path key={i} d={`M${-800 + i * 160},-400 L${-800 + i * 160},110`} stroke="#1d1916" strokeWidth={4} />
      ))}
      <path d="M-800,40 L3000,40" stroke="#1d1916" strokeWidth={4} />
    </g>
  );
};

const Fluorescent: React.FC<{ x: number; on: number }> = ({ x, on }) => (
  <g>
    <rect x={x - 180} y={86} width={360} height={30} rx={4} fill="#4a4640" stroke={INK} strokeWidth={4} />
    <rect x={x - 168} y={112} width={336} height={14} rx={7} fill={on > 0.5 ? "#f4fbe8" : "#7d817a"} stroke={INK} strokeWidth={3} />
    {on > 0.5 ? <rect x={x - 200} y={100} width={400} height={44} rx={22} fill="#eaffd8" opacity={0.25} /> : null}
  </g>
);

const Hood: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <path d="M150,330 L850,330 L790,150 L210,150 Z" fill="#9ea3a6" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M210,150 L790,150 L790,110 L210,110 Z" fill="#7f8487" stroke={INK} strokeWidth={5} />
    {Array.from({ length: 9 }).map((_, i) => (
      <path key={i} d={`M${230 + i * 65},175 L${210 + i * 70},318`} stroke="#80868a" strokeWidth={4} />
    ))}
    {[200, 320, 470, 610, 760].map((dx, i) => {
      const len = 26 + rnd(`drip${i}`) * 40 + Math.sin(t * 0.7 + i) * 6;
      return <path key={i} d={`M${dx},328 q4,${len * 0.6} 0,${len} q-6,6 -2,-${len}`} fill="#7a5a1a" stroke={INK} strokeWidth={2} opacity={0.85} />;
    })}
  </g>
);

const Grill: React.FC<{ t: number; frame: number; green: number }> = ({ t, frame, green }) => {
  const f3 = onN(frame, 3);
  return (
    <g>
      <rect x={160} y={604} width={680} height={300} fill="#979da0" stroke={INK} strokeWidth={6} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={182 + i * 220} y={660} width={196} height={220} rx={6} fill="#8a9093" stroke={INK} strokeWidth={4} />
      ))}
      {[260, 480, 700].map((kx, i) => (
        <g key={i}>
          <circle cx={kx} cy={634} r={16} fill="#1f1f22" stroke={INK} strokeWidth={3} />
          <path d={`M${kx},${634} l0,-12`} stroke="#ddd" strokeWidth={3} />
        </g>
      ))}
      <rect x={150} y={576} width={700} height={32} rx={6} fill="#2c2b2b" stroke={INK} strokeWidth={6} />
      {/* patties with tyre-tread marks */}
      {[260, 380, 520, 660].map((px, i) => (
        <g key={i}>
          <ellipse cx={px} cy={578} rx={46} ry={14} fill={green > 0 ? mixC("#6b3a1e", "#5f7a2a", green) : "#6b3a1e"} stroke={INK} strokeWidth={4} />
          {[-24, -10, 4, 18].map((o) => (
            <path key={o} d={`M${px + o},572 l8,0 l-4,6 l8,0`} stroke="#2a160a" strokeWidth={3} fill="none" />
          ))}
          {[0, 1, 2].map((k) => {
            const ph = (t * 0.7 + k * 0.33 + i * 0.21) % 1;
            const sx = px - 20 + k * 20 + noise2D(`sm${i}${k}`, f3 / 24, 0) * 10;
            return <path key={k} d={`M${sx},${560 - ph * 120} q-10,-14 0,-28 q10,-14 0,-28`} stroke={green > 0.3 ? "#b6d27a" : "#d8d6cc"} strokeWidth={6} fill="none" opacity={0.5 * (1 - ph)} strokeLinecap="round" />;
          })}
        </g>
      ))}
      <rect x={770} y={520} width={26} height={60} rx={6} fill="#d9b42a" stroke={INK} strokeWidth={4} />
      <path d="M776,520 l8,-24 l6,24" fill="#d9b42a" stroke={INK} strokeWidth={3} />
    </g>
  );
};

const Pass: React.FC<{ t: number }> = ({ t }) => {
  const car = ((t * 0.35) % 1) * 600;
  return (
    <g>
      <rect x={866} y={296} width={268} height={268} fill="#121826" stroke={INK} strokeWidth={8} />
      <circle cx={940} cy={360} r={50} fill="#ff4a5a" opacity={0.25} />
      <text x={940} y={372} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={30} fill="#ff6a78" opacity={0.85} transform="scale(-1 1) translate(-1880 0)">
        OPEN
      </text>
      <rect x={1020} y={330} width={96} height={130} fill="#1c2436" stroke="#0a0e16" strokeWidth={4} />
      <circle cx={1030 + (car % 96)} cy={430} r={10} fill="#fff6c8" opacity={0.7} />
      {[930, 1070].map((lx, i) => (
        <g key={i}>
          <path d={`M${lx},296 L${lx},330`} stroke={INK} strokeWidth={4} />
          <path d={`M${lx - 34},360 L${lx + 34},360 L${lx + 22},330 L${lx - 22},330 Z`} fill="#3a3a3a" stroke={INK} strokeWidth={4} />
          <path d={`M${lx - 30},362 L${lx + 30},362 L${lx + 60},520 L${lx - 60},520 Z`} fill="#ff9a3a" opacity={0.16} />
        </g>
      ))}
      <rect x={866} y={520} width={268} height={14} fill="#a6abae" stroke={INK} strokeWidth={4} />
      {[900, 960, 1030, 1090].map((bx, i) => (
        <path key={i} d={`M${bx - 22},520 L${bx + 22},520 L${bx + 18},494 Q${bx},482 ${bx - 18},494 Z`} fill="#e8c35a" stroke={INK} strokeWidth={3} />
      ))}
      <rect x={866} y={282} width={268} height={10} fill="#8a8f92" stroke={INK} strokeWidth={3} />
      {[884, 930, 980, 1040, 1094].map((tx, i) => (
        <g key={i} transform={`rotate(${(rnd(`tk${i}`) - 0.5) * 10} ${tx + 16} 288)`}>
          <rect x={tx} y={288} width={34} height={54} fill="#f4f1e6" stroke={INK} strokeWidth={2.5} />
          <path d={`M${tx + 6},300 l20,0 M${tx + 6},310 l14,0 M${tx + 6},320 l18,0`} stroke="#8a8a8a" strokeWidth={2} />
        </g>
      ))}
      <rect x={856} y={604} width={288} height={300} fill="#a2a8ab" stroke={INK} strokeWidth={6} />
      <path d="M980,604 l0,-8 a24,22 0 0 1 48,0 l0,8 Z" fill="#cfa83a" stroke={INK} strokeWidth={4} />
      <circle cx={1004} cy={570} r={5} fill="#cfa83a" stroke={INK} strokeWidth={3} />
    </g>
  );
};

const Fryer: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const f2 = onN(frame, 2);
  return (
    <g>
      <rect x={1160} y={612} width={400} height={292} fill="#979da0" stroke={INK} strokeWidth={6} />
      <rect x={1150} y={590} width={420} height={28} rx={5} fill="#80868a" stroke={INK} strokeWidth={5} />
      {[1250, 1460].map((vx, i) => (
        <g key={i}>
          <ellipse cx={vx} cy={600} rx={80} ry={12} fill="#c99a2a" stroke={INK} strokeWidth={4} />
          {Array.from({ length: 5 }).map((_, k) => {
            const ph = (t * 1.6 + k * 0.2 + i * 0.1) % 1;
            const bx = vx - 56 + rnd(`fb${i}${k}${Math.floor(t * 1.6 + k * 0.2)}`) * 112;
            return <circle key={k} cx={bx} cy={600} r={3 + ph * 6} fill="none" stroke="#f3d27a" strokeWidth={2} opacity={1 - ph} />;
          })}
          {[0, 1].map((k) => {
            const ph = (t * 0.5 + k * 0.5 + i * 0.25) % 1;
            return <path key={k} d={`M${vx - 20 + k * 40 + noise2D(`fs${i}${k}`, f2 / 24, 0) * 8},${590 - ph * 140} q-12,-16 0,-32 q12,-16 0,-32`} stroke="#e6e2d6" strokeWidth={7} fill="none" opacity={0.35 * (1 - ph)} strokeLinecap="round" />;
          })}
        </g>
      ))}
      {[1250, 1460].map((bx, i) => (
        <g key={i}>
          <path d={`M${bx - 50},${560} L${bx + 50},${560} L${bx + 44},${508} L${bx - 44},${508} Z`} fill="none" stroke="#5a5e60" strokeWidth={4} />
          <path d={`M${bx - 40},${520} L${bx + 40},${520} M${bx - 42},${540} L${bx + 42},${540} M${bx},${508} L${bx},${560}`} stroke="#5a5e60" strokeWidth={3} />
          <path d={`M${bx + 44},${512} l40,-40`} stroke="#222" strokeWidth={9} strokeLinecap="round" />
        </g>
      ))}
      <circle cx={1360} cy={680} r={26} fill="#f2efe6" stroke={INK} strokeWidth={4} />
      <path d="M1360,680 l14,-10" stroke="#c0392b" strokeWidth={4} />
      <rect x={1300} y={740} width={120} height={30} rx={4} fill="#2a2a2a" />
      <text x={1360} y={762} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={18} fill="#e8e4d8">
        FRYER
      </text>
    </g>
  );
};

const IncidentSign: React.FC<{ days: number | string; flip?: number }> = ({ days, flip = 0 }) => (
  <g transform="translate(1250 160)">
    <rect width={250} height={130} rx={6} fill="#f6f3ea" stroke={INK} strokeWidth={5} />
    <rect x={8} y={8} width={234} height={30} fill="#c0392b" />
    <text x={125} y={30} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={17} fill="#fff">
      DAYS WITHOUT AN
    </text>
    <text x={84} y={92} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={22} fill={INK}>
      INCIDENT:
    </text>
    <g transform={`translate(196 88) scale(1 ${1 - flip * 2 > 0 ? 1 - flip * 2 : flip * 2 - 1})`}>
      <rect x={-34} y={-38} width={68} height={70} rx={6} fill="#fff" stroke={INK} strokeWidth={4} />
      <text x={0} y={22} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={58} fill="#c0392b">
        {String(days)}
      </text>
    </g>
  </g>
);

const Clock: React.FC = () => (
  <g transform="translate(1000 198)">
    <circle r={46} fill="#f2efe6" stroke={INK} strokeWidth={6} />
    {Array.from({ length: 12 }).map((_, i) => (
      <path key={i} d={`M0,-38 L0,-32`} stroke={INK} strokeWidth={3} transform={`rotate(${i * 30})`} />
    ))}
    <path d="M0,0 L18,6" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <path d="M0,0 L22,-26" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    <circle r={5} fill={INK} />
  </g>
);

const MascotPoster: React.FC = () => (
  <g transform="translate(-10 170) rotate(-3)">
    <rect width={150} height={200} fill="#f3e9c6" stroke={INK} strokeWidth={5} />
    <text x={75} y={26} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={17} fill="#c0392b">
      STINKY SAYS:
    </text>
    {/* the mascot: a grinning flattened skunk with X eyes, thumbs up */}
    <path d={blob(75, 100, 44, 40, 10, 0.08, "skunk")} fill="#1e1a1c" stroke={INK} strokeWidth={3} />
    <path d="M60,64 q16,-18 32,0 l-6,60 l-20,0 Z" fill="#f2efe6" />
    <path d="M58,92 l10,10 M68,92 l-10,10 M84,92 l10,10 M94,92 l-10,10" stroke="#f2efe6" strokeWidth={4} strokeLinecap="round" />
    <path d="M62,114 q14,12 28,0" stroke="#f2efe6" strokeWidth={4} fill="none" />
    <path d="M118,110 l10,-18 l6,4 l-4,14 l8,0 l0,12 l-20,0 Z" fill="#1e1a1c" stroke={INK} strokeWidth={2} />
    <text x={75} y={162} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={12} fill={INK}>
      EMPLOYEES MUST
    </text>
    <text x={75} y={180} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={12} fill={INK}>
      WASH HANDS
    </text>
  </g>
);

const IceMachine: React.FC = () => (
  <g>
    <rect x={1640} y={524} width={370} height={380} fill="#8f9598" stroke={INK} strokeWidth={6} />
    <rect x={1630} y={512} width={390} height={22} rx={4} fill="#7a8083" stroke={INK} strokeWidth={5} />
    <path d="M1680,600 L1970,600 L1960,700 L1690,700 Z" fill="#7c8285" stroke={INK} strokeWidth={4} />
    <rect x={1780} y={630} width={90} height={14} rx={6} fill="#2a2a2a" />
    <text x={1825} y={800} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={40} fill="#5f6568">
      ICE
    </text>
  </g>
);

const WalkIn: React.FC = () => (
  <g>
    <rect x={2030} y={210} width={300} height={694} fill="#a3a9ac" stroke={INK} strokeWidth={6} />
    <circle cx={2180} cy={400} r={48} fill="#c7dbe2" stroke={INK} strokeWidth={6} />
    <path d="M2150,390 q30,-24 60,4" stroke="#fff" strokeWidth={6} opacity={0.6} fill="none" />
    <rect x={2060} y={540} width={60} height={150} rx={10} fill="#5d6366" stroke={INK} strokeWidth={5} />
    <text x={2180} y={300} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={22} fill="#4a5053">
      WALK-IN
    </text>
  </g>
);

const TrashCan: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <path d="M1576,970 L1630,970 L1640,860 L1566,860 Z" fill="#3e5a46" stroke={INK} strokeWidth={5} />
    <path d={blob(1603, 852, 46, 18, 9, 0.3, "trash")} fill="#d8d0b8" stroke={INK} strokeWidth={3} />
    <path d="M1590,846 l14,-26 l10,24" fill="#e8c35a" stroke={INK} strokeWidth={3} />
    {[0, 1, 2].map((i) => {
      const fx = 1603 + noise2D(`tf${i}x`, t * 0.9, i) * 60;
      const fy = 800 + noise2D(`tf${i}y`, i, t * 0.9) * 36;
      return <ellipse key={i} cx={fx} cy={fy} rx={4.5} ry={3.5} fill="#0d0a0a" />;
    })}
  </g>
);

/** Yellow mop bucket (Mr. Gizzard's witness stand). */
export const Bucket: React.FC<{ x: number; y: number; upside?: boolean }> = ({ x, y, upside = true }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={4} rx={86} ry={14} fill="#000" opacity={0.35} />
    {upside ? (
      <>
        <path d="M-76,0 L76,0 L62,-120 L-62,-120 Z" fill="#e6c22a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <rect x={-66} y={-128} width={132} height={12} rx={4} fill="#c9a51c" stroke={INK} strokeWidth={4} />
        <path d="M-40,-60 L40,-60" stroke="#b08f14" strokeWidth={4} />
      </>
    ) : (
      <>
        <path d="M-62,0 L62,0 L76,-120 L-76,-120 Z" fill="#e6c22a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <ellipse cx={0} cy={-120} rx={76} ry={14} fill="#6a6040" stroke={INK} strokeWidth={4} />
      </>
    )}
  </g>
);

export interface SetState {
  /** number on the DAYS WITHOUT AN INCIDENT board */
  days: number | string;
  /** 0..1 flip animation of the number card */
  daysFlip: number;
  /** 0..1 green stink fog */
  stink: number;
  /** 0..1 darkness in the top-right corner (the perch) */
  dark: number;
  /** fluorescent flicker amount 0..1 */
  flicker: number;
}

export const KitchenBackdrop: React.FC<{ t: number; frame: number; set: SetState }> = ({ t, frame, set }) => {
  const f3 = onN(frame, 3);
  const lightOn = set.flicker > 0 && rnd(`fl${Math.floor(f3 / 3)}`) < set.flicker * 0.35 ? 0 : 1;
  return (
    <g>
      <WallTiles />
      <Fluorescent x={520} on={1} />
      <Fluorescent x={1360} on={lightOn} />
      <MascotPoster />
      <Hood t={t} />
      <Clock />
      <IncidentSign days={set.days} flip={set.daysFlip} />
      <Pass t={t} />
      <Grill t={t} frame={frame} green={set.stink} />
      <Fryer t={t} frame={frame} />
      <IceMachine />
      <WalkIn />
      <Floor />
      <TrashCan t={t} />
      {set.dark > 0 ? (
        <g>
          <defs>
            <radialGradient id="perchDark" cx="0.37" cy="0.34" r="0.42">
              <stop offset="0" stopColor="#05060a" stopOpacity={0.92} />
              <stop offset="0.7" stopColor="#05060a" stopOpacity={0.6} />
              <stop offset="1" stopColor="#05060a" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect x={1200} y={-300} width={1400} height={1100} fill="url(#perchDark)" opacity={set.dark} />
        </g>
      ) : null}
    </g>
  );
};

/** Green stink fog drifting over everything (drawn in front of the cast). */
export const StinkFog: React.FC<{ t: number; amount: number; cx?: number; cy?: number }> = ({ t, amount, cx = 700, cy = 760 }) => {
  if (amount <= 0) return null;
  return (
    <g opacity={amount} style={{ mixBlendMode: "multiply" }}>
      {Array.from({ length: 9 }).map((_, i) => {
        const x = cx - 900 + i * 260 + noise2D(`fog${i}x`, t * 0.15, i) * 120;
        const y = cy - 200 + noise2D(`fog${i}y`, i, t * 0.15) * 160 - (i % 3) * 120;
        return <path key={i} d={cloudPath(x, y, 260, 120, 9, `fog${i}`, 0.7)} fill="#a9c76a" opacity={0.42} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

export interface GrillSceneProps {
  from: Cam;
  to?: Cam;
  ease?: (x: number) => number;
  /** camera override computed by the shot (wins over from/to) */
  cam?: Cam;
  dale?: Partial<DaleProps> | false;
  chet?: Partial<ChetProps> | false;
  gizzard?: Partial<GizzardProps> | false;
  set?: Partial<SetState>;
  shakeAmp?: number;
  /** drawn behind the cast (props on the floor) */
  back?: React.ReactNode;
  /** drawn in front of the cast */
  front?: React.ReactNode;
  overlay?: React.ReactNode;
}

const DEFAULT_SET: SetState = { days: 3, daysFlip: 0, stink: 0, dark: 0, flicker: 0.2 };

export const GrillScene: React.FC<GrillSceneProps> = ({ from, to, ease = easeInOut, cam, dale = {}, chet = {}, gizzard = {}, set = {}, shakeAmp = 0, back, front, overlay }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const camNow = cam ?? (to ? camLerp(from, to, ease(shot.p)) : from);
  const st = { ...DEFAULT_SET, ...set };
  const sd = useSpeech("dale");
  const sc = useSpeech("chet");
  const sg = useSpeech("gizzard");
  return (
    <Stage
      cam={camNow}
      frame={frame}
      shakeAmp={shakeAmp}
      overlay={overlay ?? <LightWash id="fluoro" color="#e8ffd0" cx={900} cy={140} r={1100} opacity={0.16} />}
    >
      <KitchenBackdrop t={t} frame={frame} set={st} />
      {back}
      {gizzard ? <Vulture id="gizzard" x={PERCH_POS.x} y={PERCH_POS.y} pose="perch" flip t={t} frame={frame} {...sg} {...gizzard} /> : null}
      {chet ? <Raccoon id="chet" x={CHET_POS.x} y={CHET_POS.y} flip t={t} frame={frame} {...sc} {...chet} /> : null}
      {dale ? <Possum id="dale" x={DALE_POS.x} y={DALE_POS.y} t={t} frame={frame} {...sd} {...dale} /> : null}
      <StinkFog t={t} amount={st.stink} />
      {front}
    </Stage>
  );
};

function mixC(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.min(1, k)).toString(16).padStart(2, "0")).join("")}`;
}
