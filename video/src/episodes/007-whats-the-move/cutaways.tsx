import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, LightWash, Stage, camLerp } from "../../engine/Stage";
import { Pt, blob, easeInOut, onN, rnd } from "../../engine/util";
import { Goat, LyleProps } from "./cast/Goat";
import { DuaneProps, Hyena } from "./cast/Hyena";
import { Chihuahua } from "./cast/Mama";
import { FONT, useSpeech } from "./livingroom";

/* EPISODE 007 cutaways: the house at 3 AM, the garage "gym", moving day for Mama's babies, the family photos. */

/* ------------------------------------------------------------------ */
/* Exterior: Mama's house, 3 AM                                        */
/* ------------------------------------------------------------------ */

export const EXT = {
  door: { x: 958, y: 784 },
  walk: { x: 958, y: 930 },
  car: { x: 1690, y: 952 },
  window: { x0: 420, x1: 770, y0: 470, y1: 690 },
};

const Stars: React.FC = () => {
  const stars = useMemo(() => Array.from({ length: 46 }).map((_, i) => [rnd(`xs${i}`) * 2600 - 340, rnd(`xsy${i}`) * 380 - 120, 1 + rnd(`xss${i}`) * 2.2] as const), []);
  return (
    <g>
      {stars.map(([sx, sy, r], i) => (
        <circle key={i} cx={sx} cy={sy} r={r} fill="#e8e4d0" opacity={0.55} />
      ))}
    </g>
  );
};

/** Mama's one-storey ranch house. party > 0 = disco lights flickering in the window. */
const House: React.FC<{ t: number; frame: number; party: number; door: number; inside: "both" | "duane" | "none" }> = ({ t, frame, party, door, inside }) => {
  const f3 = onN(frame, 3);
  const w = EXT.window;
  const flick = party > 0 ? ["#ff7ac8", "#7ae0ff", "#fff07a", "#b07aff"][Math.floor(f3 / 6) % 4] : "#f2c86a";
  return (
    <g>
      {/* roof */}
      <path d="M250,372 L780,214 L1340,372 Z" fill="#2f2a30" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {Array.from({ length: 6 }).map((_, i) => (
        <path key={i} d={`M${330 + i * 30},${350 - i * 22} L${1260 - i * 30},${350 - i * 22}`} stroke="#3f3a42" strokeWidth={4} />
      ))}
      <rect x={1040} y={240} width={56} height={90} fill="#5a4a46" stroke={INK} strokeWidth={6} />
      {/* siding */}
      <rect x={290} y={368} width={1010} height={420} fill="#8fa08a" stroke={INK} strokeWidth={8} />
      {Array.from({ length: 13 }).map((_, i) => (
        <path key={i} d={`M294,${398 + i * 30} L1296,${398 + i * 30}`} stroke="#7a8c76" strokeWidth={4} />
      ))}
      {/* the picture window (the party inside) */}
      <rect x={w.x0 - 16} y={w.y0 - 16} width={w.x1 - w.x0 + 32} height={w.y1 - w.y0 + 32} fill="#e8e2d0" stroke={INK} strokeWidth={6} />
      <rect x={w.x0} y={w.y0} width={w.x1 - w.x0} height={w.y1 - w.y0} fill={flick} />
      <rect x={w.x0} y={w.y0} width={w.x1 - w.x0} height={w.y1 - w.y0} fill="#2a1a10" opacity={0.25} />
      {/* silhouettes: the couch, Duane in his hat, the goat */}
      <path d={`M${w.x0},${w.y1} L${w.x0},${w.y1 - 70} Q${w.x0 + 20},${w.y1 - 96} ${w.x0 + 60},${w.y1 - 90} L${w.x0 + 240},${w.y1 - 90} Q${w.x0 + 280},${w.y1 - 96} ${w.x0 + 296},${w.y1 - 70} L${w.x0 + 296},${w.y1} Z`} fill="#1a120e" />
      {inside !== "none" ? (
        <g fill="#1a120e">
          <ellipse cx={w.x0 + 190} cy={w.y1 - 104} rx={44} ry={48} />
          <circle cx={w.x0 + 200} cy={w.y1 - 162} r={30} />
          <circle cx={w.x0 + 182} cy={w.y1 - 192} r={12} />
          <circle cx={w.x0 + 214} cy={w.y1 - 194} r={12} />
          <path d={`M${w.x0 + 188},${w.y1 - 186} L${w.x0 + 204},${w.y1 - 236} L${w.x0 + 218},${w.y1 - 186} Z`} />
          <path d={`M${w.x0 + 224},${w.y1 - 160} l26,8 l-24,12 Z`} />
        </g>
      ) : null}
      {inside === "both" ? (
        <g fill="#1a120e">
          <rect x={w.x1 - 70} y={w.y0 + 70} width={34} height={160} rx={10} />
          <ellipse cx={w.x1 - 60} cy={w.y0 + 46} rx={24} ry={30} />
          <path d={`M${w.x1 - 82},${w.y0 + 46} l-34,-10 l30,22 Z`} />
          <path d={`M${w.x1 - 50},${w.y0 + 20} q30,-30 50,0 q-24,-14 -40,8 Z`} />
        </g>
      ) : null}
      <path d={`M${(w.x0 + w.x1) / 2},${w.y0} L${(w.x0 + w.x1) / 2},${w.y1} M${w.x0},${(w.y0 + w.y1) / 2} L${w.x1},${(w.y0 + w.y1) / 2}`} stroke="#e8e2d0" strokeWidth={8} />
      {/* shutters */}
      {[w.x0 - 70, w.x1 + 18].map((sx) => (
        <g key={sx}>
          <rect x={sx} y={w.y0 - 16} width={52} height={w.y1 - w.y0 + 32} fill="#4a5f6a" stroke={INK} strokeWidth={5} />
          {Array.from({ length: 7 }).map((_, i) => (
            <path key={i} d={`M${sx + 6},${w.y0 + 4 + i * 32} l40,0`} stroke="#33444c" strokeWidth={4} />
          ))}
        </g>
      ))}
      {/* front door + porch light + moths */}
      <rect x={EXT.door.x - 66} y={500} width={132} height={EXT.door.y - 500} fill="#2a1a10" stroke={INK} strokeWidth={6} />
      <rect x={EXT.door.x - 58} y={508} width={(116 * (1 - easeInOut(door) * 0.8))} height={EXT.door.y - 508} fill="#8a3a2a" stroke={INK} strokeWidth={5} />
      {door < 0.5 ? <circle cx={EXT.door.x + 40} cy={650} r={7} fill="#d9b44a" stroke={INK} strokeWidth={2.5} /> : null}
      {door > 0.05 ? <rect x={EXT.door.x - 58 + 116 * (1 - easeInOut(door) * 0.8)} y={508} width={116 * easeInOut(door) * 0.8} height={EXT.door.y - 508} fill={flick} opacity={0.85} /> : null}
      <circle cx={EXT.door.x + 100} cy={540} r={70} fill="#ffcf7a" opacity={0.22} />
      <rect x={EXT.door.x + 88} y={520} width={24} height={34} rx={6} fill="#ffe8a8" stroke={INK} strokeWidth={4} />
      {[0, 1, 2, 3].map((i) => {
        const mx = EXT.door.x + 100 + noise2D(`xm${i}`, t * 1.8, i) * 60;
        const my = 536 + noise2D(`xmy${i}`, i, t * 1.8) * 46;
        return <path key={i} d={`M${mx - 7},${my} l7,-5 l7,5 l-7,4 Z`} fill="#e0d4b8" stroke={INK} strokeWidth={1} />;
      })}
      {/* steps */}
      <path d={`M${EXT.door.x - 90},${EXT.door.y} L${EXT.door.x + 90},${EXT.door.y} L${EXT.door.x + 100},${EXT.door.y + 22} L${EXT.door.x - 100},${EXT.door.y + 22} Z`} fill="#9a958c" stroke={INK} strokeWidth={5} />
      {/* garage */}
      <rect x={1060} y={540} width={220} height={248} fill="#c9c4b0" stroke={INK} strokeWidth={6} />
      {Array.from({ length: 5 }).map((_, i) => (
        <path key={i} d={`M1064,${590 + i * 46} L1276,${590 + i * 46}`} stroke="#a8a390" strokeWidth={4} />
      ))}
      <rect x={1090} y={556} width={160} height={22} fill="#5a7a8a" stroke={INK} strokeWidth={3} />
      <rect x={1112} y={560} width={40} height={14} fill="#ffe8a0" opacity={0.7} />
      {/* bushes */}
      {[330, 790, 1200].map((bx, i) => (
        <path key={bx} d={blob(bx, 780, i === 2 ? 0 : 70, 40, 10, 0.25, `bush${i}`)} fill="#2e4a2e" stroke={INK} strokeWidth={4} />
      ))}
    </g>
  );
};

const LawnAndStreet: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={-800} y={700} width={3600} height={200} fill="#2f4030" />
    {/* the walkway */}
    <path d={`M${EXT.door.x - 70},${EXT.door.y + 20} L${EXT.door.x + 70},${EXT.door.y + 20} L${EXT.door.x + 90},900 L${EXT.door.x - 90},900 Z`} fill="#8a857c" stroke={INK} strokeWidth={4} />
    {/* sidewalk, curb, street */}
    <rect x={-800} y={896} width={3600} height={64} fill="#9a958c" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 20 }).map((_, i) => (
      <path key={i} d={`M${-700 + i * 190},898 l-10,60`} stroke="#7a756c" strokeWidth={3} />
    ))}
    <rect x={-800} y={958} width={3600} height={22} fill="#b8b2a6" stroke={INK} strokeWidth={4} />
    <rect x={-800} y={978} width={3600} height={500} fill="#24232a" />
    {Array.from({ length: 12 }).map((_, i) => (
      <rect key={i} x={-700 + i * 300} y={1080} width={150} height={14} fill="#d9c24a" opacity={0.8} />
    ))}
    {/* pink flamingo (one leg, as is tradition) + a gnome with a beer */}
    <g transform="translate(560 830)">
      <path d="M0,0 L0,-60" stroke={INK} strokeWidth={4} />
      <path d={blob(0, -78, 30, 18, 9, 0.15, "flam")} fill="#f07aa8" stroke={INK} strokeWidth={4} />
      <path d="M20,-84 q20,-40 4,-60 q-10,-8 -16,2" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d="M20,-84 q20,-40 4,-60 q-10,-8 -16,2" stroke="#f07aa8" strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M8,-142 l-14,6 l12,4 Z" fill="#2a2a2a" />
    </g>
    <g transform="translate(1150 856)">
      <path d="M-18,0 L18,0 L14,-34 L-14,-34 Z" fill="#3f6fae" stroke={INK} strokeWidth={3} />
      <circle cx={0} cy={-44} r={12} fill="#e8c3a0" stroke={INK} strokeWidth={3} />
      <path d="M-14,-50 L0,-90 L14,-50 Z" fill="#c0392b" stroke={INK} strokeWidth={3} />
      <path d="M-10,-38 q10,22 20,0 Z" fill="#f2f0ea" stroke={INK} strokeWidth={2} />
      <rect x={12} y={-30} width={8} height={14} fill="#a9bccb" stroke={INK} strokeWidth={2} />
    </g>
    {/* streetlight */}
    <path d="M1420,958 L1420,330 Q1420,300 1390,300 L1340,300" stroke={INK} strokeWidth={14} fill="none" />
    <path d="M1420,958 L1420,330 Q1420,300 1390,300 L1340,300" stroke="#4a4a52" strokeWidth={8} fill="none" />
    <path d="M1310,296 L1370,296 L1360,314 L1320,314 Z" fill="#ffd08a" stroke={INK} strokeWidth={4} />
    <path d="M1320,314 L1360,314 L1520,980 L1160,980 Z" fill="#ffb45a" opacity={0.13} />
    {/* mailbox */}
    <g transform="translate(1520 900)">
      <path d="M0,0 L0,-90" stroke={INK} strokeWidth={10} />
      <path d="M-40,-90 L40,-90 L40,-130 Q0,-160 -40,-130 Z" fill="#c9c4b8" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <text x={0} y={-104} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={16} fill="#8a2a1a">
        MAMA
      </text>
      <path d="M40,-124 L40,-150 L56,-150 L56,-140 L44,-140" fill="#c0392b" stroke={INK} strokeWidth={3} />
    </g>
    {[0, 1].map((i) => {
      const ph = (t * 0.3 + i * 0.5) % 1;
      return <circle key={i} cx={1340 + noise2D(`sm${i}`, t * 0.5, i) * 30} cy={330 + ph * 40} r={3} fill="#e0d4b8" opacity={1 - ph} />;
    })}
  </g>
);

/** Lyle's car: a tiny, dented, mustard hatchback. */
const Hatchback: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={4} rx={190} ry={16} fill="#000" opacity={0.4} />
    <path d="M-180,-20 L-176,-80 Q-170,-96 -150,-98 L-110,-100 L-70,-160 Q-60,-172 -40,-172 L80,-172 Q104,-172 116,-150 L150,-96 Q182,-92 186,-70 L186,-20 Z" fill="#c9a43a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M-96,-102 L-62,-152 L20,-152 L20,-102 Z M34,-102 L34,-152 L92,-152 L124,-102 Z" fill="#6a8aa0" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M-30,-140 l20,30 M60,-140 l-12,24" stroke="#c9dce8" strokeWidth={4} opacity={0.7} />
    {/* dents, rust, a bungee on the hatch */}
    <path d={blob(-120, -50, 26, 14, 8, 0.4, "dent")} fill="#a8862a" stroke={INK} strokeWidth={2.5} />
    <path d={blob(130, -40, 22, 12, 8, 0.4, "rust")} fill="#8a4a1a" opacity={0.8} />
    <path d="M-176,-70 q-12,20 0,40" stroke="#2a7ac0" strokeWidth={5} fill="none" />
    <rect x={160} y={-66} width={22} height={14} rx={3} fill="#ffe8a0" stroke={INK} strokeWidth={3} />
    {[-110, 110].map((wx) => (
      <g key={wx}>
        <circle cx={wx} cy={-16} r={36} fill="#1a1a1e" stroke={INK} strokeWidth={5} />
        <circle cx={wx} cy={-16} r={14} fill="#8a8a90" stroke={INK} strokeWidth={3} />
      </g>
    ))}
    {/* the bumper sticker */}
    <rect x={-170} y={-60} width={60} height={18} fill="#f2ede0" stroke={INK} strokeWidth={2} />
    <text x={-140} y={-47} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={9} fill={INK}>
      AH-HYUK
    </text>
  </g>
);

export interface ExteriorProps {
  from: Cam;
  to?: Cam;
  cam?: Cam;
  party?: number;
  door?: number;
  inside?: "both" | "duane" | "none";
  lyle?: Partial<LyleProps> | false;
  /** world position of Lyle (x,y) */
  lylePos?: Pt;
}

export const ExteriorScene: React.FC<ExteriorProps> = ({ from, to, cam, party = 0, door = 0, inside = "both", lyle = false, lylePos = [EXT.walk.x, EXT.walk.y] }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const camNow = cam ?? (to ? camLerp(from, to, easeInOut(shot.p)) : from);
  const sl = useSpeech("lyle");
  return (
    <Stage cam={camNow} frame={frame} overlay={<LightWash id="streetwash" color="#ffb45a" cx={1340} cy={320} r={760} opacity={0.14} />}>
      <defs>
        <linearGradient id="sky7" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05070f" />
          <stop offset="0.6" stopColor="#161a33" />
          <stop offset="1" stopColor="#2a2340" />
        </linearGradient>
      </defs>
      <rect x={-800} y={-700} width={3600} height={1500} fill="url(#sky7)" />
      <Stars />
      <circle cx={1660} cy={150} r={56} fill="#efe8c8" opacity={0.92} />
      <circle cx={1640} cy={140} r={10} fill="#d8d0b0" />
      <circle cx={1676} cy={170} r={7} fill="#d8d0b0" />
      <path d="M-800,190 Q600,260 2800,170 M-800,214 Q600,284 2800,196" stroke="#06080f" strokeWidth={3} fill="none" />
      {/* neighbours: dark houses, one TV glow */}
      <path d="M-500,700 L-500,520 L-300,430 L-100,520 L-100,700 Z" fill="#141622" stroke={INK} strokeWidth={5} />
      <rect x={-380} y={580} width={60} height={50} fill="#5a7aa8" opacity={0.6 + 0.3 * Math.sin(t * 7)} />
      <path d="M1700,700 L1700,540 L1900,450 L2100,540 L2100,700 Z" fill="#141622" stroke={INK} strokeWidth={5} />
      <LawnAndStreet t={t} />
      <House t={t} frame={frame} party={party} door={door} inside={inside} />
      <Hatchback x={EXT.car.x} y={EXT.car.y} />
      {lyle ? <Goat id="lyleExt" x={lylePos[0]} y={lylePos[1]} scale={0.62} flip t={t} frame={frame} {...sl} {...lyle} /> : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* The garage "gym" (Move some weight!)                                */
/* ------------------------------------------------------------------ */

export const GymScene: React.FC<{ duane?: Partial<DuaneProps> }> = ({ duane = {} }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = camLerp({ x: 1110, y: 520, zoom: 1.5 }, { x: 1100, y: 490, zoom: 1.72 }, easeInOut(shot.p));
  const swing = Math.sin(t * 2.2) * 8;
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="bulb" color="#fff0b0" cx={960} cy={120} r={700} opacity={0.3} />}>
      {/* cinderblock walls, concrete floor */}
      <rect x={-600} y={-600} width={3100} height={1420} fill="#9a968a" />
      {Array.from({ length: 16 }).map((_, r) =>
        Array.from({ length: 22 }).map((_, c) => (
          <rect key={`${r}-${c}`} x={-560 + c * 140 + (r % 2) * 70} y={-560 + r * 70} width={140} height={70} fill="none" stroke="#86827a" strokeWidth={4} />
        )),
      )}
      <rect x={-600} y={820} width={3100} height={600} fill="#7d7a72" />
      <path d={blob(1260, 930, 170, 34, 10, 0.3, "oil")} fill="#2a2620" opacity={0.6} />
      {/* bare bulb on a cord */}
      <g transform={`rotate(${swing} 960 -100)`}>
        <path d="M960,-100 L960,90" stroke={INK} strokeWidth={4} />
        <circle cx={960} cy={108} r={20} fill="#fff6c8" stroke={INK} strokeWidth={4} />
      </g>
      {/* pegboard with tool outlines (the tools are long gone) */}
      <rect x={200} y={180} width={420} height={300} fill="#c49a62" stroke={INK} strokeWidth={6} />
      {Array.from({ length: 9 }).map((_, r) =>
        Array.from({ length: 13 }).map((_, c) => <circle key={`${r}${c}`} cx={220 + c * 32} cy={200 + r * 32} r={3} fill="#8a6a3a" />),
      )}
      <path d="M260,230 l0,140 M240,230 l40,0 M360,240 q40,60 0,120 M480,230 l60,120 l-20,8 Z" stroke="#4a3418" strokeWidth={6} fill="none" strokeDasharray="10 8" />
      {/* motivational poster, peeling */}
      <g transform="translate(1380 300) rotate(3)">
        <rect x={-150} y={-120} width={300} height={220} fill="#e8e0c8" stroke={INK} strokeWidth={5} />
        <path d="M150,-120 L110,-120 L150,-80 Z" fill="#c9c0a8" stroke={INK} strokeWidth={3} />
        <text x={0} y={-62} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#c0392b">
          NO PAIN
        </text>
        <text x={0} y={-20} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#c0392b">
          NO GAIN
        </text>
        <path d="M-60,30 C-60,0 -20,-6 -10,20 C0,-6 40,0 40,30 Z" fill="#c4a277" stroke={INK} strokeWidth={3} />
        <text x={0} y={80} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={16} fill={INK}>
          - SINCE 1997 -
        </text>
      </g>
      {/* weight bench buried in laundry, treadmill used as a coat rack */}
      <g>
        <rect x={180} y={720} width={420} height={40} rx={10} fill="#2a2a30" stroke={INK} strokeWidth={5} />
        <path d="M220,760 L210,830 M560,760 L570,830" stroke={INK} strokeWidth={14} />
        <path d={blob(390, 690, 210, 70, 14, 0.3, "laundry")} fill="#8a9ab0" stroke={INK} strokeWidth={5} />
        <path d={blob(330, 660, 80, 40, 9, 0.3, "laundry2")} fill="#c9a0a0" stroke={INK} strokeWidth={4} />
        <path d={blob(470, 650, 70, 34, 9, 0.3, "laundry3")} fill="#e8e4d8" stroke={INK} strokeWidth={4} />
        <path d="M430,640 l20,-40 l14,36" stroke="#6a8a4a" strokeWidth={10} fill="none" strokeLinecap="round" />
      </g>
      <g>
        <path d="M1500,830 L1820,830 L1800,790 L1520,790 Z" fill="#3a3a40" stroke={INK} strokeWidth={5} />
        <path d="M1780,790 L1760,540 L1820,540" stroke={INK} strokeWidth={14} fill="none" />
        <path d="M1760,560 C1700,580 1690,700 1700,760 L1800,760 C1810,690 1810,600 1770,560 Z" fill="#6a4a8a" stroke={INK} strokeWidth={4} />
        <path d="M1740,540 q20,30 50,0" stroke="#c9b24a" strokeWidth={10} fill="none" />
      </g>
      {/* mini fridge */}
      <rect x={720} y={640} width={150} height={190} rx={8} fill="#e8e4da" stroke={INK} strokeWidth={5} />
      <path d="M730,700 L860,700" stroke={INK} strokeWidth={4} />
      <rect x={844} y={650} width={10} height={36} rx={4} fill="#9a9a9a" stroke={INK} strokeWidth={2} />
      <Hyena id="duaneGym" x={1060} y={860} pose="stand" t={t} frame={frame} mouth="X" expr="strain" sweatband beer={false} dumbbell {...duane} />
    </Stage>
  );
};

/** A tiny pink 2 LB dumbbell, drawn at a hand position. */
export const Dumbbell: React.FC<{ x: number; y: number; rot?: number }> = ({ x, y, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-26} y={-5} width={52} height={10} rx={4} fill="#9a9aa0" stroke={INK} strokeWidth={3} />
    {[-30, 30].map((dx) => (
      <rect key={dx} x={dx - 9} y={-16} width={18} height={32} rx={6} fill="#f08ab0" stroke={INK} strokeWidth={3.5} />
    ))}
    <text x={0} y={30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={12} fill="#f08ab0" stroke={INK} strokeWidth={0.8}>
      2 LB
    </text>
  </g>
);

/* ------------------------------------------------------------------ */
/* Moving day for Mama's babies (Move some bitches!)                    */
/* ------------------------------------------------------------------ */

export const DogsScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const l = shot.local;
  const x = 760 + l * 150;
  const cam = camLerp({ x: 930, y: 640, zoom: 1.42 }, { x: 1060, y: 640, zoom: 1.5 }, easeInOut(shot.p));
  const bump = Math.abs(Math.sin(l * 9)) * 6;
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="porchwash" color="#ffcf7a" cx={1100} cy={300} r={800} opacity={0.2} />}>
      <rect x={-600} y={-600} width={3100} height={1400} fill="#8fa08a" />
      {Array.from({ length: 24 }).map((_, i) => (
        <path key={i} d={`M-600,${-560 + i * 56} L2500,${-560 + i * 56}`} stroke="#7a8c76" strokeWidth={4} />
      ))}
      {/* the front door, wide open, the hall light behind */}
      <rect x={1380} y={240} width={300} height={600} fill="#2a1a10" stroke={INK} strokeWidth={6} />
      <rect x={1396} y={256} width={268} height={584} fill="#e8d2a0" />
      <path d="M1664,256 L1760,220 L1760,876 L1664,840 Z" fill="#8a3a2a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={1300} cy={300} r={80} fill="#ffcf7a" opacity={0.25} />
      <rect x={1288} y={280} width={24} height={34} rx={6} fill="#ffe8a8" stroke={INK} strokeWidth={4} />
      {/* porch boards */}
      <rect x={-600} y={830} width={3100} height={500} fill="#7a5a3a" />
      {Array.from({ length: 10 }).map((_, i) => (
        <path key={i} d={`M-600,${846 + i * 40} L2500,${846 + i * 40}`} stroke="#5a3e24" strokeWidth={4} />
      ))}
      {/* the hand truck: a box of three chihuahuas in sweaters */}
      <g transform={`translate(${x + 190} ${900 - bump * 0.3})`}>
        <path d="M-10,0 L-10,-330 L-40,-360" stroke={INK} strokeWidth={14} fill="none" strokeLinecap="round" />
        <path d="M-10,0 L-10,-330 L-40,-360" stroke="#c0392b" strokeWidth={7} fill="none" strokeLinecap="round" />
        <path d="M-10,0 L120,0" stroke={INK} strokeWidth={12} strokeLinecap="round" />
        <circle cx={-6} cy={6} r={22} fill="#1a1a1e" stroke={INK} strokeWidth={4} />
        <rect x={0} y={-190} width={170} height={186} fill="#c9a26a" stroke={INK} strokeWidth={5} />
        <path d="M0,-190 L-14,-222 L60,-210 Z M170,-190 L186,-224 L110,-210 Z" fill="#b08a54" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <g transform="translate(85 -96) rotate(-4)">
          <rect x={-70} y={-24} width={140} height={48} fill="#f2ede0" stroke={INK} strokeWidth={3} />
          <text x={0} y={-3} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill="#c0392b">
            MAMA'S BABIES
          </text>
          <text x={0} y={16} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={12} fill={INK}>
            FRAGILE · BITES
          </text>
        </g>
        <Chihuahua x={30} y={-176} scale={1.15} flip t={t} frame={frame} seed="ch1" sweater="#4a7fc0" snarl={0.8} look={[-0.6, 0.2]} />
        <Chihuahua x={90} y={-196} scale={1.2} t={t + 0.3} frame={frame} seed="ch2" sweater="#d9534f" snarl={1} look={[-0.9, 0.4]} />
        <Chihuahua x={150} y={-170} scale={1.05} t={t + 0.6} frame={frame} seed="ch3" sweater="#6aa04a" snarl={0.6} look={[-0.7, 0]} />
      </g>
      <Hyena id="duaneDogs" x={x} y={900} pose="stand" t={t} frame={frame} mouth="X" expr="whiny" beer={false} armF={[78, 22]} armB={[70, 30]} lean={8} footF={[40 + Math.sin(l * 9) * 16, -12]} footB={[-30 - Math.sin(l * 9) * 16, -12]} />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* The family photos (Ain't it time to start a family?)                */
/* ------------------------------------------------------------------ */

const BigPhoto: React.FC<{ x: number; y: number; year: string; age: number; rot: number; i: number }> = ({ x, y, year, age, rot, i }) => {
  const k = Math.min(1, 0.5 + age / 60);
  const bald = Math.min(1, Math.max(0, (age - 20) / 25));
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-170} y={-150} width={340} height={300} fill="#5a3a20" stroke={INK} strokeWidth={6} />
      <rect x={-150} y={-130} width={300} height={226} fill="#d6c49c" />
      <rect x={-150} y={-130} width={300} height={226} fill="#8a6a3a" opacity={0.12 + i * 0.03} />
      {/* wallpaper + the couch, never changes */}
      <path d="M-150,-10 L150,-10" stroke="#a8843a" strokeWidth={3} />
      <path d="M-120,96 L-120,30 Q-120,10 -100,10 L100,10 Q120,10 120,30 L120,96 Z" fill="#dd8f9c" stroke={INK} strokeWidth={3} />
      <path d="M-140,96 L-140,40 L-116,40 L-116,96 Z M140,96 L140,40 L116,40 L116,96 Z" fill="#dd8f9c" stroke={INK} strokeWidth={3} />
      {[-80, -20, 40, 90].map((fx, j) => (
        <circle key={j} cx={fx} cy={50 + (j % 2) * 20} r={9} fill="#c95f86" opacity={0.7} />
      ))}
      {/* Mama behind the couch, same pose, same glare, every year */}
      <g transform="translate(-40 0)">
        <path d="M-40,20 C-50,-40 -30,-70 0,-72 C30,-70 50,-40 40,20 Z" fill="#c95f86" stroke={INK} strokeWidth={3} />
        <circle cx={0} cy={-92} r={26} fill="#b39672" stroke={INK} strokeWidth={3} />
        <path d={blob(-4, -110, 30, 16, 8, 0.3, `bp${i}`)} fill="#b79ad1" stroke={INK} strokeWidth={2.5} />
        <path d="M-12,-96 l8,2 M4,-96 l8,-2" stroke={INK} strokeWidth={3} />
        <path d="M8,-82 q10,-2 18,2" stroke="#e8604a" strokeWidth={3} fill="none" />
        <path d="M16,-92 l18,4 l-16,8" fill="#4a3427" />
      </g>
      {/* Duane, bigger and balder each time, birthday hat every time */}
      <g transform={`translate(50 74) scale(${k})`}>
        <ellipse cx={0} cy={-40} rx={46} ry={44} fill={age < 10 ? "#7aa0c8" : "#7b3b46"} stroke={INK} strokeWidth={3} />
        <circle cx={6} cy={-104} r={32} fill="#c4a277" stroke={INK} strokeWidth={3} />
        {bald < 0.6 ? <path d={`M-22,-122 Q6,${-148 + bald * 20} 34,-120`} stroke="#3a2618" strokeWidth={10 - bald * 8} fill="none" strokeLinecap="round" /> : <path d="M-20,-120 Q6,-140 32,-118" stroke="#3a2618" strokeWidth={1.5} fill="none" />}
        <path d="M18,-108 C34,-112 48,-104 48,-92 C44,-84 30,-84 20,-88 Z" fill="#4a3427" stroke={INK} strokeWidth={2.5} />
        <circle cx={-4} cy={-108} r={5} fill="#efe6c8" stroke={INK} strokeWidth={1.5} />
        <circle cx={-4} cy={-108} r={2} fill={INK} />
        <circle cx={14} cy={-110} r={5} fill="#efe6c8" stroke={INK} strokeWidth={1.5} />
        <circle cx={14} cy={-110} r={2} fill={INK} />
        <path d="M-6,-132 L8,-186 L24,-130 Z" fill="#e9cf63" stroke={INK} strokeWidth={3} />
        <circle cx={8} cy={-188} r={7} fill="#f08ab0" stroke={INK} strokeWidth={2} />
        {age > 30 ? <rect x={30} y={-60} width={16} height={28} rx={4} fill="#a9bccb" stroke={INK} strokeWidth={2} /> : null}
        {age < 10 ? <path d="M-30,-20 q30,20 60,0" stroke="#f2f0ea" strokeWidth={8} fill="none" /> : null}
      </g>
      <text x={0} y={132} textAnchor="middle" fontFamily="Comic Sans MS, Comic Neue, cursive" fontWeight={700} fontSize={22} fill="#f2ead2">
        {year}
      </text>
    </g>
  );
};

export const FamilyPhotos: React.FC = () => {
  const { shot } = useEpisode();
  const { frame } = shot;
  const cam = camLerp({ x: 420, y: 530, zoom: 1.5 }, { x: 1600, y: 530, zoom: 1.5 }, easeInOut(shot.p));
  const photos = [
    { year: "1981", age: 0 },
    { year: "1994", age: 13 },
    { year: "2008", age: 27 },
    { year: "2026", age: 45 },
  ];
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="photowash" color="#ffd28a" cx={300} cy={200} r={1000} opacity={0.14} />}>
      <defs>
        <pattern id="wallpaperP" patternUnits="userSpaceOnUse" width={96} height={120}>
          <rect width={96} height={120} fill="#c9a650" />
          <rect x={0} width={10} height={120} fill="#b8933f" />
          <path d="M72,22 c-14,8 -14,26 0,34 c14,-8 14,-26 0,-34 Z M24,82 c-14,8 -14,26 0,34 c14,-8 14,-26 0,-34 Z" fill="#a8843a" />
        </pattern>
      </defs>
      <rect x={-600} y={-600} width={3200} height={2400} fill="url(#wallpaperP)" />
      <rect x={-600} y={-600} width={3200} height={2400} fill="#3a2a14" opacity={0.2} />
      {photos.map((p, i) => (
        <BigPhoto key={p.year} x={300 + i * 440} y={520 + (i % 2 ? 20 : -20)} year={p.year} age={p.age} rot={(rnd(`bpr${i}`) - 0.5) * 6} i={i} />
      ))}
      {/* the empty nail where the "girlfriend" photo was */}
      <circle cx={2080} cy={330} r={6} fill="#5a5a5a" stroke={INK} strokeWidth={2} />
      <rect x={1990} y={330} width={180} height={150} fill="none" stroke="#a8843a" strokeWidth={4} strokeDasharray="10 8" />
    </Stage>
  );
};
