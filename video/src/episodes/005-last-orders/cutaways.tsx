import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, LightWash, Stage, camLerp } from "../../engine/Stage";
import { Pt, blob, clamp, easeInOut, easeOut, onN, rnd } from "../../engine/util";
import { Gerald, GeraldHead, GeraldProps, GERALD_HEAD } from "./cast/Gerald";
import { Lyle, LyleProps, LYLE_HEAD, lyleSpout } from "./cast/Lyle";
import { useSpeech } from "./dregs";
import { DECAF_ORANGE, FONT, HAND, MUSTARD, MUSTARD_DK, PURPLE, PURPLE_DK, PaperCup, PourStream, SkullBean } from "./props";

/* EPISODE 005 cutaways: the scheme, stage by stage. The counter (any time of day), Gerald's bedroom,
   the inside of Gerald's head, the street outside DREGS. */

export type TOD = "night" | "morning" | "afternoon";

/* ------------------------------------------------------------------ */
/* Title card (screen space, top of frame)                             */
/* ------------------------------------------------------------------ */

export const TitleCard: React.FC<{ text: string; local: number; color?: string }> = ({ text, local, color = "#efe4c4" }) => {
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const k = easeOut(clamp(local / 0.22));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: portrait ? Math.round(height * 0.13) : Math.round(height * 0.06), pointerEvents: "none" }}>
      <div
        style={{
          transform: `rotate(-2.5deg) scale(${0.5 + 0.5 * k})`,
          opacity: k,
          background: color,
          border: "6px solid #140d0b",
          padding: portrait ? "16px 34px" : "12px 36px",
          fontFamily: "SpecialElite",
          fontSize: portrait ? 62 : 56,
          color: "#140d0b",
          letterSpacing: 3,
          boxShadow: "0 9px 0 rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const WALL = "#b9a774";
const WALL_DK = "#8e7c50";
const WOOD = "#4b3036";
const WOOD_DK = "#33202a";

const SKY: Record<TOD, [string, string, string]> = {
  night: ["#0a0d1c", "#141a33", "#24203c"],
  morning: ["#9cc4e4", "#e6e2c4", "#f6d89a"],
  afternoon: ["#d97a4a", "#f2a65a", "#f6d28a"],
};
const WASH: Record<TOD, [string, number]> = { night: ["#b090ff", 0.12], morning: ["#fff4d0", 0.28], afternoon: ["#ff9a50", 0.26] };

/** A window full of sky at a given time of day. */
const SkyWindow: React.FC<{ id: string; tod: TOD; x: number; y: number; w: number; h: number; t: number }> = ({ id, tod, x, y, w, h, t }) => {
  const [c0, c1, c2] = SKY[tod];
  const stars = useMemo(() => Array.from({ length: 24 }).map((_, i) => [rnd(`${id}s${i}`) * w, rnd(`${id}sy${i}`) * h * 0.6, 1 + rnd(`${id}sr${i}`) * 2] as const), [id, w, h]);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c0} />
          <stop offset="0.6" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-sky)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {tod === "night" ? (
          <g>
            {stars.map(([sx, sy, r], i) => (
              <circle key={i} cx={x + sx} cy={y + sy} r={r} fill="#e8e4d0" opacity={0.6} />
            ))}
            <circle cx={x + w * 0.78} cy={y + h * 0.24} r={34} fill="#ece6c8" />
            <circle cx={x + w * 0.78 + 14} cy={y + h * 0.24 - 8} r={30} fill={c1} />
          </g>
        ) : (
          <g>
            <circle cx={x + w * (tod === "morning" ? 0.7 : 0.25)} cy={y + h * (tod === "morning" ? 0.3 : 0.7)} r={tod === "morning" ? 54 : 70} fill={tod === "morning" ? "#fff6c8" : "#ffd27a"} />
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2 + t * 0.2;
              const cx = x + w * (tod === "morning" ? 0.7 : 0.25);
              const cy = y + h * (tod === "morning" ? 0.3 : 0.7);
              return <path key={i} d={`M${cx + Math.cos(a) * 70},${cy + Math.sin(a) * 70} L${cx + Math.cos(a) * 110},${cy + Math.sin(a) * 110}`} stroke={tod === "morning" ? "#fff6c8" : "#ffd27a"} strokeWidth={8} strokeLinecap="round" opacity={0.7} />;
            })}
            {/* a bird, minding its business */}
            <path d={`M${x + ((t * 60) % (w + 80)) - 40},${y + h * 0.4} q10,-10 20,0 q10,-10 20,0`} stroke={INK} strokeWidth={4} fill="none" />
          </g>
        )}
        {/* rooftops across the street */}
        <path d={`M${x},${y + h} L${x},${y + h * 0.78} L${x + w * 0.2},${y + h * 0.78} L${x + w * 0.2},${y + h * 0.66} L${x + w * 0.45},${y + h * 0.66} L${x + w * 0.45},${y + h * 0.82} L${x + w * 0.7},${y + h * 0.82} L${x + w * 0.7},${y + h * 0.6} L${x + w},${y + h * 0.6} L${x + w},${y + h} Z`} fill={tod === "night" ? "#0c0e18" : tod === "morning" ? "#8a8ea0" : "#7a4a3a"} />
      </g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={10} />
      <path d={`M${x + w / 2},${y} L${x + w / 2},${y + h}`} stroke={INK} strokeWidth={8} />
      <path d={`M${x},${y + h * 0.55} L${x + w},${y + h * 0.55}`} stroke={INK} strokeWidth={8} />
    </g>
  );
};

/** Wall clock showing hh:mm (12h). */
const WallClock: React.FC<{ x: number; y: number; h: number; m: number; r?: number }> = ({ x, y, h, m, r = 50 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#efe7d4" stroke={INK} strokeWidth={6} />
    {Array.from({ length: 12 }).map((_, i) => (
      <path key={i} d={`M0,${-r + 8} L0,${-r + 15}`} stroke={INK} strokeWidth={i % 3 === 0 ? 5 : 3} transform={`rotate(${i * 30})`} />
    ))}
    <path d={`M0,0 L0,${-r * 0.48}`} stroke={INK} strokeWidth={7} strokeLinecap="round" transform={`rotate(${((h % 12) + m / 60) * 30})`} />
    <path d={`M0,0 L0,${-r * 0.78}`} stroke={INK} strokeWidth={4.5} strokeLinecap="round" transform={`rotate(${m * 6})`} />
    <circle r={5} fill={DECAF_ORANGE} stroke={INK} strokeWidth={2} />
  </g>
);

/** Radial speed lines (screen-filling, world space around a centre). */
export const SpeedLines: React.FC<{ cx: number; cy: number; t: number; n?: number; color?: string; r0?: number }> = ({ cx, cy, t, n = 36, color = "#f6eee0", r0 = 240 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const a = (i / n) * Math.PI * 2 + rnd(`spd${i}`) * 0.1;
      const k = (t * 3 + rnd(`spk${i}`)) % 1;
      const ra = r0 + k * 200;
      const rb = ra + 300 + rnd(`spl${i}`) * 400;
      return <path key={i} d={`M${cx + Math.cos(a) * ra},${cy + Math.sin(a) * ra} L${cx + Math.cos(a) * rb},${cy + Math.sin(a) * rb}`} stroke={color} strokeWidth={6 + rnd(`spw${i}`) * 10} strokeLinecap="round" opacity={0.55} />;
    })}
  </g>
);

/** Spiky comic impact burst. */
export const Burst: React.FC<{ x: number; y: number; r: number; k: number; color?: string; text?: string }> = ({ x, y, r, k, color = "#f2d24a", text }) => {
  if (k <= 0) return null;
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = (i % 2 ? 0.55 : 1) * r * (0.6 + 0.4 * k) * (0.9 + rnd(`bu${i}`) * 0.2);
    pts.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
  }
  return (
    <g opacity={Math.min(1, k * 2)}>
      <path d={`M${pts.join(" L")} Z`} fill={color} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      {text ? (
        <text x={x} y={y + r * 0.14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={r * 0.36} fill={INK}>
          {text}
        </text>
      ) : null}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The counter, side on: Gerald (customer side) vs Lyle (behind it)    */
/* ------------------------------------------------------------------ */

export const GERALD_C = { x: 600, y: 1012 };
export const LYLE_C = { x: 1236, y: 846 };
export const CUP_C: Pt = [1012, 702];
export const C_HEADS = {
  gerald: { x: GERALD_C.x + GERALD_HEAD.stand[0], y: GERALD_C.y + GERALD_HEAD.stand[1] },
  lyle: { x: LYLE_C.x - LYLE_HEAD[0], y: LYLE_C.y + LYLE_HEAD[1] },
};
export const CAMC = {
  two: { x: 930, y: 560, zoom: 1.12 },
  wide: { x: 940, y: 560, zoom: 0.96 },
  cuGerald: { x: C_HEADS.gerald.x + 50, y: C_HEADS.gerald.y + 40, zoom: 2.3 },
  ecuGerald: { x: C_HEADS.gerald.x + 56, y: C_HEADS.gerald.y + 6, zoom: 3.6 },
  msGerald: { x: C_HEADS.gerald.x + 40, y: C_HEADS.gerald.y + 160, zoom: 1.5 },
  cuLyle: { x: C_HEADS.lyle.x - 40, y: C_HEADS.lyle.y + 30, zoom: 2.4 },
  ecuLyle: { x: C_HEADS.lyle.x - 50, y: C_HEADS.lyle.y + 6, zoom: 3.8 },
  cup: { x: CUP_C[0], y: CUP_C[1] - 70, zoom: 3.0 },
  pour: { x: CUP_C[0] + 60, y: CUP_C[1] - 120, zoom: 2.2 },
} satisfies Record<string, Cam>;

export interface CounterCup {
  lid?: "decaf" | "regular" | "redeye";
  open?: boolean;
  fill?: number;
  brew?: string;
  glow?: number;
  name?: string;
  steam?: boolean;
  /** x offset along the counter */
  dx?: number;
  /** lifted (y offset, negative = up) */
  dy?: number;
}

export interface CounterSceneProps {
  tod: TOD;
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  gerald?: Partial<GeraldProps> | false;
  lyle?: Partial<LyleProps> | false;
  cup?: CounterCup | false;
  /** draw the stream from Lyle's carafe spout into the cup */
  pouring?: boolean;
  clock?: [number, number];
  calendar?: number;
  /** chalk tally of days on decaf */
  tally?: number;
  shakeAmp?: number;
  back?: React.ReactNode;
  front?: React.ReactNode;
  /** extra screen wash */
  washBoost?: number;
}

export const CounterScene: React.FC<CounterSceneProps> = ({
  tod,
  from,
  to,
  cam,
  ease = easeInOut,
  gerald = {},
  lyle = {},
  cup = { lid: "decaf", name: "GERALD" },
  pouring = false,
  clock = [9, 58],
  calendar = 14,
  tally = 0,
  shakeAmp = 0,
  back,
  front,
  washBoost = 0,
}) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const camNow = cam ?? (to ? camLerp(from, to, ease(shot.p)) : from);
  const sl = useSpeech("lyle");
  const [wc, wo] = WASH[tod];
  const lyleProps: Partial<LyleProps> = lyle ? lyle : {};
  const armF = (lyleProps.armF ?? [16, 46]) as [number, number];
  const tilt = lyleProps.potTilt ?? 0;
  const sp = lyleSpout(armF, tilt);
  const spout: Pt = [LYLE_C.x - sp[0], LYLE_C.y + sp[1]];
  const cupX = CUP_C[0] + (cup ? cup.dx ?? 0 : 0);
  const cupY = CUP_C[1] + (cup ? cup.dy ?? 0 : 0);
  return (
    <Stage cam={camNow} frame={frame} shakeAmp={shakeAmp} overlay={<LightWash id={`cw-${tod}`} color={wc} cx={500} cy={260} r={1200} opacity={wo + washBoost} />}>
      {/* wall */}
      <rect x={-900} y={-600} width={3800} height={1400} fill={WALL} />
      {Array.from({ length: 40 }).map((_, i) => (
        <rect key={i} x={-900 + i * 100} y={60} width={34} height={700} fill={WALL_DK} opacity={0.22} />
      ))}
      <rect x={-900} y={-600} width={3800} height={660} fill="#2a2024" />
      <rect x={-900} y={52} width={3800} height={14} fill={MUSTARD_DK} stroke={INK} strokeWidth={3} />
      <rect x={-900} y={540} width={3800} height={260} fill={WOOD} />
      <rect x={-900} y={526} width={3800} height={20} fill={PURPLE} stroke={INK} strokeWidth={4} />
      <SkyWindow id={`cwin-${tod}`} tod={tod} x={120} y={120} w={760} h={420} t={t} />
      <WallClock x={1560} y={190} h={clock[0]} m={clock[1]} />
      {/* calendar */}
      <g transform="translate(1690 300) rotate(2)">
        <rect x={-90} y={-10} width={180} height={190} fill="#f2ecd8" stroke={INK} strokeWidth={5} />
        <rect x={-90} y={-10} width={180} height={40} fill="#a3262a" stroke={INK} strokeWidth={5} />
        <text x={0} y={20} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={22} fill="#f2ecd8">
          OCT
        </text>
        <text x={0} y={140} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={92} fill={INK}>
          {calendar}
        </text>
        <circle cx={0} cy={-18} r={6} fill="#5a5a5a" />
      </g>
      {/* chalk tally */}
      {tally > 0 ? (
        <g transform="translate(1500 420)">
          <rect x={-120} y={-60} width={240} height={110} rx={6} fill="#1f2a24" stroke={WOOD_DK} strokeWidth={8} />
          <text x={0} y={-26} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={22} fill="#efeadb">
            DAYS ON DECAF
          </text>
          {Array.from({ length: Math.min(20, tally) }).map((_, i) => {
            const g = Math.floor(i / 5);
            const k = i % 5;
            const gx = -96 + g * 48;
            return k < 4 ? <path key={i} d={`M${gx + k * 9},0 L${gx + k * 9 + 2},36`} stroke="#efeadb" strokeWidth={4} strokeLinecap="round" /> : <path key={i} d={`M${gx - 6},30 L${gx + 34},6`} stroke="#efeadb" strokeWidth={4} strokeLinecap="round" />;
          })}
        </g>
      ) : null}
      <SkullBean x={1080} y={250} s={120} rot={-8} color={MUSTARD} />
      {/* floor */}
      <rect x={-900} y={940} width={3800} height={800} fill="#a8986e" />
      {Array.from({ length: 30 }).map((_, i) => (
        <path key={i} d={`M${-900 + i * 140},940 L${-1300 + i * 190},1740`} stroke="#4a3848" strokeWidth={4} opacity={0.6} />
      ))}
      <path d="M-900,1010 L2900,1010 M-900,1110 L2900,1110" stroke="#4a3848" strokeWidth={4} opacity={0.6} />
      {back}
      {/* Lyle behind the counter (on a milk crate, hence the height) */}
      {lyle ? <Lyle id="lyleC" x={LYLE_C.x} y={LYLE_C.y} flip t={t} frame={frame} {...sl} {...lyle} /> : null}
      {/* the counter */}
      <rect x={840} y={712} width={2200} height={420} fill={PURPLE_DK} stroke={INK} strokeWidth={7} />
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={862 + i * 150} y={736} width={128} height={200} rx={6} fill={PURPLE} stroke={INK} strokeWidth={4} />
      ))}
      <rect x={840} y={820} width={2200} height={12} fill={MUSTARD} stroke={INK} strokeWidth={3} />
      <rect x={828} y={690} width={2220} height={26} rx={5} fill="#6e5a48" stroke={INK} strokeWidth={6} />
      {cup ? (
        <g transform={`translate(${cupX} ${cupY})`}>
          <PaperCup lid={cup.lid} open={cup.open} fill={cup.fill} brew={cup.brew} glow={cup.glow} name={cup.name} steam={cup.steam} t={t} scale={0.56} />
        </g>
      ) : null}
      {pouring ? <PourStream x0={spout[0]} y0={spout[1]} x1={cupX} y1={cupY - 64} t={t} w={9} /> : null}
      {gerald ? <Gerald id="geraldC" x={GERALD_C.x} y={GERALD_C.y} pose="stand" t={t} frame={frame} slump={6} {...gerald} /> : null}
      {front}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Gerald's bedroom                                                    */
/* ------------------------------------------------------------------ */

export const BED_HEAD: Pt = [486, 646];
export const CAMB = {
  wide: { x: 900, y: 600, zoom: 1.0 },
  bed: { x: 640, y: 650, zoom: 1.7 },
  head: { x: 560, y: 600, zoom: 2.5 },
  sit: { x: 560, y: 520, zoom: 1.9 },
  sitClose: { x: 510, y: 430, zoom: 3.0 },
  laptop: { x: 830, y: 690, zoom: 3.0 },
  clock: { x: 150, y: 640, zoom: 3.4 },
} satisfies Record<string, Cam>;

export interface BedroomProps {
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  tod: "night" | "morning";
  mode: "lying" | "sitting";
  /** what the alarm clock says */
  clockText: string;
  clockBlink?: boolean;
  gerald?: Partial<GeraldProps>;
  /** head state for the lying pose */
  headExpr?: GeraldProps["expr"];
  sick?: boolean;
  laptop?: boolean;
  nightcap?: boolean;
  zzz?: boolean;
  shakeAmp?: number;
  /** bed shakes with his heartbeat */
  bedShake?: number;
  front?: React.ReactNode;
  lamp?: boolean;
}

export const BedroomScene: React.FC<BedroomProps> = ({
  from,
  to,
  cam,
  ease = easeInOut,
  tod,
  mode,
  clockText,
  clockBlink = false,
  gerald = {},
  headExpr = "peaceful",
  sick = false,
  laptop = false,
  nightcap = false,
  zzz = false,
  shakeAmp = 0,
  bedShake = 0,
  front,
  lamp = true,
}) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const camNow = cam ?? (to ? camLerp(from, to, ease(shot.p)) : from);
  const f2 = onN(frame, 2);
  const jig = bedShake > 0 ? (rnd(`bed${f2}`) - 0.5) * 10 * bedShake : 0;
  const night = tod === "night";
  const blinkOn = !clockBlink || Math.floor(t * 2) % 2 === 0;
  const breathe = Math.sin(t * 1.6) * 4;
  return (
    <Stage cam={camNow} frame={frame} shakeAmp={shakeAmp} overlay={<LightWash id={`bw-${tod}`} color={night ? "#8a9aff" : "#fff2d0"} cx={1400} cy={300} r={1100} opacity={night ? 0.14 : 0.24} />}>
      {/* wall */}
      <rect x={-900} y={-600} width={3800} height={1640} fill={night ? "#4a5068" : "#7e8aa0"} />
      {Array.from({ length: 30 }).map((_, i) => (
        <g key={i}>
          {Array.from({ length: 9 }).map((__, j) => (
            <path key={j} d={`M${-860 + i * 130 + (j % 2) * 65},${j * 110 - 20} l10,14 l-10,14 l-10,-14 Z`} fill={night ? "#3e4258" : "#6e7a90"} />
          ))}
        </g>
      ))}
      <rect x={-900} y={960} width={3800} height={700} fill="#5a3e2a" />
      {Array.from({ length: 16 }).map((_, i) => (
        <path key={i} d={`M-900,${980 + i * 40} L2900,${980 + i * 40}`} stroke="#3e2a1c" strokeWidth={4} />
      ))}
      <rect x={-900} y={940} width={3800} height={24} fill="#3a2a22" />
      <SkyWindow id={`bwin-${tod}`} tod={night ? "night" : "morning"} x={1260} y={140} w={420} h={380} t={t} />
      {/* curtains */}
      <path d="M1230,120 C1260,300 1240,460 1270,560 L1210,560 C1190,400 1200,260 1210,120 Z" fill="#8a3a4a" stroke={INK} strokeWidth={5} />
      <path d="M1710,120 C1680,300 1700,460 1670,560 L1730,560 C1750,400 1740,260 1730,120 Z" fill="#8a3a4a" stroke={INK} strokeWidth={5} />
      {/* poster: a sloth hanging from a branch */}
      <g transform="translate(820 170) rotate(3)">
        <rect width={200} height={250} fill="#d8e4c8" stroke={INK} strokeWidth={5} />
        <path d="M14,50 L186,40" stroke="#5a3a24" strokeWidth={10} strokeLinecap="round" />
        <path d="M80,46 L84,90 M120,44 L116,90" stroke="#86795f" strokeWidth={12} strokeLinecap="round" />
        <ellipse cx={100} cy={120} rx={36} ry={34} fill="#86795f" stroke={INK} strokeWidth={4} />
        <ellipse cx={100} cy={124} rx={22} ry={16} fill="#d8ccae" />
        <path d="M88,120 q4,-3 8,0 M104,120 q4,-3 8,0 M94,132 q6,5 12,0" stroke={INK} strokeWidth={3} fill="none" />
        <text x={100} y={196} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={22} fill={PURPLE_DK}>
          HANG IN
        </text>
        <text x={100} y={226} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={22} fill={PURPLE_DK}>
          THERE
        </text>
      </g>
      {/* framed photo: Gerald and his one true love (a coffee) */}
      <g transform="translate(560 250) rotate(-3)">
        <rect width={130} height={110} fill={WOOD} stroke={INK} strokeWidth={5} />
        <rect x={10} y={10} width={110} height={90} fill="#c9d8e0" />
        <path d="M60,92 C40,60 50,30 70,30 C90,30 96,60 84,92 Z" fill="#b5794a" stroke={INK} strokeWidth={2.5} />
        <path d="M96,96 L92,70 L110,70 L106,96 Z" fill="#f1ece0" stroke={INK} strokeWidth={2.5} />
        <path d="M84,40 q4,-8 8,0 q4,-8 8,0" stroke="#d83a4a" strokeWidth={3} fill="none" />
      </g>
      {/* nightstand + lamp + alarm clock */}
      <g transform={`translate(${jig * 0.5} 0)`}>
        <rect x={40} y={720} width={200} height={240} fill={WOOD} stroke={INK} strokeWidth={6} />
        <rect x={60} y={760} width={160} height={70} rx={5} fill={WOOD_DK} stroke={INK} strokeWidth={4} />
        <circle cx={140} cy={795} r={7} fill={MUSTARD} stroke={INK} strokeWidth={2} />
        <rect x={30} y={708} width={220} height={18} fill="#6e5a48" stroke={INK} strokeWidth={5} />
        <path d="M84,708 L96,600 L104,600 L116,708" fill="#5a4a3a" stroke={INK} strokeWidth={4} />
        <path d="M50,610 L150,610 L130,540 L70,540 Z" fill={lamp ? "#f2e2a8" : "#a89a74"} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {lamp ? <ellipse cx={100} cy={620} rx={110} ry={30} fill="#fff2b0" opacity={0.25} /> : null}
        <rect x={140} y={652} width={96} height={56} rx={8} fill="#1a1416" stroke={INK} strokeWidth={5} />
        <text x={188} y={692} textAnchor="middle" fontFamily="SpecialElite, monospace" fontWeight={900} fontSize={30} fill="#ff3a2a" opacity={blinkOn ? 1 : 0.15}>
          {clockText}
        </text>
      </g>
      {/* headboard */}
      <g transform={`translate(${jig} 0)`}>
        <rect x={250} y={500} width={70} height={470} rx={10} fill={WOOD} stroke={INK} strokeWidth={6} />
        <circle cx={285} cy={494} r={22} fill={WOOD} stroke={INK} strokeWidth={5} />
      </g>
      {mode === "sitting" ? (
        <Gerald id="geraldB" x={400 + jig} y={930} pose="sit" outfit="pajamas" t={t} frame={frame} slump={-4} {...gerald} />
      ) : null}
      {/* mattress + frame */}
      <g transform={`translate(${jig} 0)`}>
        <rect x={300} y={770} width={1260} height={90} rx={14} fill="#e8e2d2" stroke={INK} strokeWidth={6} />
        <rect x={300} y={856} width={1260} height={90} fill={WOOD} stroke={INK} strokeWidth={6} />
        <rect x={1540} y={640} width={60} height={330} rx={8} fill={WOOD} stroke={INK} strokeWidth={6} />
        <rect x={320} y={940} width={30} height={40} fill={WOOD_DK} />
        <rect x={1510} y={940} width={30} height={40} fill={WOOD_DK} />
        {mode === "lying" ? (
          <g>
            {/* pillow + head */}
            <path d={blob(440, 724, 130, 46, 12, 0.08, "pillow")} fill="#f4f0e4" stroke={INK} strokeWidth={5} />
            <g transform={`translate(${BED_HEAD[0]} ${BED_HEAD[1] + breathe * 0.3}) rotate(-26) scale(1.08)`}>
              <GeraldHead id="geraldBH" t={t} frame={frame} expr={headExpr} sick={sick ? 1 : 0} {...gerald} />
              {nightcap ? (
                <g>
                  <path d="M-56,-30 C-40,-90 20,-110 60,-70 C40,-60 0,-50 -56,-30 Z" fill="#6a88b0" stroke={INK} strokeWidth={4} />
                  <path d="M60,-70 C90,-60 110,-30 120,0" stroke="#6a88b0" strokeWidth={16} fill="none" strokeLinecap="round" />
                  <circle cx={122} cy={6} r={14} fill="#f2ecd8" stroke={INK} strokeWidth={4} />
                  <path d="M-56,-30 C-30,-44 20,-56 60,-70" stroke="#f2ecd8" strokeWidth={10} fill="none" />
                </g>
              ) : null}
            </g>
          </g>
        ) : null}
        {/* the blanket */}
        <path
          d={
            mode === "lying"
              ? `M500,${700 - breathe} C600,${640 - breathe} 760,${650 - breathe} 860,${690 - breathe} C980,700 1080,690 1180,700 C1260,690 1320,640 1380,650 C1440,640 1470,680 1520,700 L1540,860 L500,860 Z`
              : "M400,742 C520,720 720,712 860,730 C1000,740 1120,736 1220,740 C1300,690 1360,680 1400,700 C1450,690 1480,720 1520,740 L1540,860 L380,860 Z"
          }
          fill="#9a5a6a"
          stroke={INK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        {Array.from({ length: 6 }).map((_, i) => (
          <path key={i} d={`M${560 + i * 160},${mode === "lying" ? 690 : 736} L${560 + i * 160},860`} stroke="#7a3a4a" strokeWidth={4} />
        ))}
        <path d="M400,800 L1530,800" stroke="#7a3a4a" strokeWidth={4} />
        {sick ? (
          <g>
            {[
              [700, 730],
              [760, 724],
              [1300, 700],
              [1000, 736],
            ].map(([tx, ty], i) => (
              <path key={i} d={blob(tx, ty, 22, 14, 7, 0.4, `tissue${i}`)} fill="#f4f2ee" stroke={INK} strokeWidth={3} />
            ))}
          </g>
        ) : null}
        {laptop ? (
          <g transform="translate(830 728)">
            <path d="M-90,0 L90,0 L100,12 L-100,12 Z" fill="#5a5e66" stroke={INK} strokeWidth={4} />
            <path d="M-80,0 L-70,-120 L80,-120 L90,0 Z" fill="#3a3e46" stroke={INK} strokeWidth={5} />
            <path d="M-66,-10 L-58,-110 L70,-110 L78,-10 Z" fill="#e8f0f8" />
            <text x={6} y={-88} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={12} fill="#2a5aa0">
              SYMPTOM CHECKER
            </text>
            <text x={6} y={-64} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={13} fill={INK}>
              tired, headache,
            </text>
            <text x={6} y={-48} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={13} fill={INK}>
              existential dread
            </text>
            <text x={6} y={-26} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={14} fill="#c0281e">
              RESULT: ???
            </text>
          </g>
        ) : null}
      </g>
      {zzz
        ? [0, 1, 2].map((i) => {
            const ph = (t * 0.45 + i * 0.33) % 1;
            return (
              <text key={i} x={BED_HEAD[0] + 70 + ph * 120 + Math.sin(t * 2 + i) * 14} y={BED_HEAD[1] - 90 - ph * 200} fontFamily={HAND} fontWeight={700} fontSize={40 + ph * 40} fill="#efeadb" stroke={INK} strokeWidth={3} paintOrder="stroke" opacity={Math.min(1, (1 - ph) * 2)}>
                Z
              </text>
            );
          })
        : null}
      {/* slippers */}
      <path d="M520,1010 C520,986 600,984 610,1004 L612,1016 L520,1016 Z M630,1016 C630,992 710,990 720,1010 L722,1022 L630,1022 Z" fill={night ? "#8a6a8a" : "#c8a0b8"} stroke={INK} strokeWidth={4} />
      {front}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Inside Gerald's head: ERROR 404                                     */
/* ------------------------------------------------------------------ */

export const ErrorScreen: React.FC<{ tCaffeine: number; tFound: number }> = ({ tCaffeine, tFound }) => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const cam = camLerp({ x: 960, y: 540, zoom: 1.0 }, { x: 1040, y: 520, zoom: 1.12 }, easeInOut(shot.p));
  const glitch = rnd(`gl${Math.floor(frame / 3)}`) < 0.18 ? (rnd(`glx${frame}`) - 0.5) * 30 : 0;
  const pop = easeOut(clamp(local / 0.25));
  const showCaf = t >= tCaffeine - 0.05;
  const showFound = t >= tFound - 0.05;
  // the cursor drifts to RETRY and keeps clicking it
  const cx = 1500 - easeInOut(clamp((local - 0.6) / 0.8)) * 160;
  const cy = 760 - easeInOut(clamp((local - 0.6) / 0.8)) * 120;
  const click = local > 1.4 && Math.floor(local * 4) % 2 === 0;
  const lines = useMemo(() => {
    let d = "";
    for (let y = -700; y < 1800; y += 8) d += `M-600,${y} L2520,${y} `;
    return d;
  }, []);
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="crt" color="#6aa0ff" cx={960} cy={540} r={900} opacity={0.18} />}>
      <rect x={-1300} y={-1300} width={4600} height={3700} fill="#13226e" />
      {/* the wireframe head */}
      <g transform="translate(560 560) scale(3.1)" fill="none" stroke="#7fb2ff" strokeWidth={2.2} opacity={0.75}>
        <path d="M-56,6 C-58,-30 -40,-56 -12,-60 C30,-60 70,-38 112,-26 C126,-20 136,-6 130,12 C110,22 80,24 40,34 C10,40 -30,38 -56,6 Z" />
        <path d="M34,22 C70,16 110,14 122,26 C120,50 100,70 70,74 C46,72 26,52 34,22 Z" />
        <path d="M-30,-44 C-6,-38 -2,10 -16,96 C-22,124 -52,124 -58,96 C-66,40 -60,-24 -30,-44 Z" />
        <circle cx={26} cy={-12} r={12} />
        <circle cx={66} cy={-18} r={9} />
        <ellipse cx={128} cy={-12} rx={18} ry={14} />
      </g>
      {/* the brain, loading */}
      <g transform="translate(600 470)">
        <path d={blob(0, 0, 110, 80, 12, 0.08, "brain")} fill="#e89aaa" stroke={INK} strokeWidth={6} />
        <path d="M-80,-20 q30,-30 60,0 q30,30 60,0 M-70,20 q30,-20 60,4 q30,20 70,-6 M-20,-60 q10,40 -10,80" stroke="#b8606e" strokeWidth={5} fill="none" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + Math.floor(t * 10) * (Math.PI / 4);
          return <path key={i} d={`M${Math.cos(a) * 22},${-110 + Math.sin(a) * 22} L${Math.cos(a) * 36},${-110 + Math.sin(a) * 36}`} stroke="#f2ecd8" strokeWidth={7} strokeLinecap="round" opacity={0.25 + (i / 8) * 0.75} />;
        })}
      </g>
      {/* the dialog */}
      <g transform={`translate(${1240 + glitch} 520) scale(${0.6 + 0.4 * pop})`}>
        <rect x={-420} y={-240} width={840} height={480} fill="#d6d2c6" stroke={INK} strokeWidth={8} />
        <rect x={-412} y={-232} width={824} height={62} fill="#2a4ab0" />
        <text x={-390} y={-190} fontFamily={FONT} fontWeight={900} fontSize={30} fill="#f2f2f2">
          GERALD.EXE
        </text>
        <rect x={350} y={-224} width={48} height={46} fill="#d6d2c6" stroke={INK} strokeWidth={4} />
        <path d="M360,-214 L388,-188 M388,-214 L360,-188" stroke={INK} strokeWidth={6} />
        <circle cx={-300} cy={-40} r={64} fill="#c8281e" stroke={INK} strokeWidth={6} />
        <path d="M-330,-70 L-270,-10 M-270,-70 L-330,-10" stroke="#f2f2f2" strokeWidth={14} strokeLinecap="round" />
        <text x={-190} y={-40} fontFamily={FONT} fontWeight={900} fontSize={84} fill={INK}>
          ERROR 404
        </text>
        {showCaf ? (
          <text x={-190} y={40} fontFamily={FONT} fontWeight={900} fontSize={40} fill="#a3262a">
            CAFFEINE {showFound ? "NOT FOUND" : ""}
          </text>
        ) : null}
        {[
          [-260, "RETRY"],
          [140, "GO BACK TO BED"],
        ].map(([bx, label], i) => (
          <g key={i} transform={`translate(${bx} 150)`}>
            <rect x={-110 + (i ? -60 : 0)} y={-36} width={220 + (i ? 120 : 0)} height={72} fill={i === 0 && click ? "#a8a49a" : "#e8e4da"} stroke={INK} strokeWidth={5} />
            <text x={i ? 0 : 0} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={INK}>
              {label}
            </text>
          </g>
        ))}
      </g>
      {/* the cursor: hourglass when busy */}
      <g transform={`translate(${cx} ${cy})`}>
        {local < 1.4 ? (
          <path d="M0,0 L0,54 L14,42 L26,66 L36,60 L24,38 L42,38 Z" fill="#f2f2f2" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        ) : (
          <g>
            <path d="M-16,-24 L16,-24 L0,0 L16,24 L-16,24 L0,0 Z" fill="#f2f2f2" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <path d="M-8,18 L8,18 L0,8 Z" fill="#c9a24a" />
          </g>
        )}
      </g>
      <path d={lines} stroke="#000" strokeWidth={2} opacity={0.18} />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Outside: the DREGS storefront at night                              */
/* ------------------------------------------------------------------ */

const NeonText: React.FC<{ x: number; y: number; size: number; color: string; text: string; on?: number }> = ({ x, y, size, color, text, on = 1 }) => (
  <g opacity={0.3 + on * 0.7}>
    <text x={x} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill="none" stroke={color} strokeWidth={size * 0.22} opacity={0.25 * on} letterSpacing={size * 0.08}>
      {text}
    </text>
    <text x={x} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill="none" stroke={color} strokeWidth={size * 0.08} letterSpacing={size * 0.08}>
      {text}
    </text>
    <text x={x} y={y} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill="none" stroke="#fff6f0" strokeWidth={size * 0.025} opacity={on} letterSpacing={size * 0.08}>
      {text}
    </text>
  </g>
);

export const ExteriorScene: React.FC<{ from: Cam; to?: Cam; closed?: boolean }> = ({ from, to, closed = false }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = to ? camLerp(from, to, easeInOut(shot.p)) : from;
  const f3 = onN(frame, 3);
  const flick = (k: string, p = 0.12) => (rnd(`${k}${Math.floor(f3 / 3)}`) < p ? 0 : 1);
  const bricks = useMemo(() => {
    let d = "";
    for (let r = 0; r < 22; r++) {
      const y = 250 + r * 30;
      d += `M380,${y} L1560,${y} `;
      for (let c = 0; c < 30; c++) {
        const x = 380 + c * 60 + (r % 2 ? 30 : 0);
        d += `M${x},${y} L${x},${y + 30} `;
      }
    }
    return d;
  }, []);
  const rain = useMemo(() => Array.from({ length: 60 }).map((_, i) => [rnd(`rx${i}`) * 2400 - 240, rnd(`ry${i}`) * 1200] as const), []);
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="extNeon" color="#c070ff" cx={960} cy={300} r={800} opacity={0.2} />}>
      <defs>
        <linearGradient id="extSky5" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#06070f" />
          <stop offset="1" stopColor="#24183a" />
        </linearGradient>
      </defs>
      <rect x={-800} y={-600} width={3600} height={1500} fill="url(#extSky5)" />
      {/* neighbours: a dark laundromat, a boarded-up something */}
      <rect x={-500} y={300} width={880} height={600} fill="#2a2430" stroke={INK} strokeWidth={6} />
      <rect x={-380} y={520} width={620} height={300} fill="#141018" stroke={INK} strokeWidth={6} />
      <path d="M-360,560 L220,780 M-360,780 L220,560" stroke="#5a4a3a" strokeWidth={22} />
      <rect x={1560} y={260} width={900} height={640} fill="#302a34" stroke={INK} strokeWidth={6} />
      {/* DREGS */}
      <rect x={380} y={250} width={1180} height={650} fill="#5a3a3a" stroke={INK} strokeWidth={8} />
      <path d={bricks} stroke="#3e2626" strokeWidth={3} />
      {/* awning */}
      <path d="M400,470 L1540,470 L1580,540 L360,540 Z" fill={PURPLE} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d={`M${380 + i * 100},540 l50,0 l-25,30 Z`} fill={i % 2 ? MUSTARD : PURPLE} stroke={INK} strokeWidth={3} />
      ))}
      {/* the window: warm inside, a tiny sad customer at a tiny table */}
      <rect x={460} y={590} width={760} height={300} fill="#f2c86a" stroke={INK} strokeWidth={8} />
      <rect x={460} y={590} width={760} height={300} fill="#ff9a50" opacity={0.25} />
      <rect x={600} y={610} width={300} height={70} fill="#2a3a30" opacity={0.6} />
      <rect x={760} y={760} width={440} height={130} fill="#4a2a4a" opacity={0.6} />
      <g transform="translate(560 890) scale(0.36)">
        <Gerald id="geraldExt" x={0} y={0} pose="sit" t={t} frame={frame} expr="sad" />
      </g>
      <path d="M840,590 L840,890" stroke={INK} strokeWidth={8} />
      {/* OPEN sign, readable from out here */}
      <g transform="translate(1040 650)">
        <rect x={-110} y={-40} width={220} height={80} rx={16} fill="#1b1520" stroke="#3a3040" strokeWidth={4} />
        <NeonText x={0} y={18} size={closed ? 40 : 50} color={closed ? "#ff4a3a" : "#ff5fa0"} text={closed ? "CLOSED" : "OPEN"} on={flick("extOpen", 0.2)} />
      </g>
      {/* door */}
      <rect x={1270} y={590} width={180} height={310} fill="#2a1e2a" stroke={INK} strokeWidth={8} />
      <rect x={1290} y={610} width={140} height={150} fill="#f2c86a" opacity={0.7} />
      <circle cx={1430} cy={760} r={9} fill={MUSTARD} stroke={INK} strokeWidth={3} />
      {/* the sign */}
      <rect x={560} y={290} width={820} height={150} rx={18} fill="#1b1520" stroke={INK} strokeWidth={8} />
      <NeonText x={1010} y={400} size={110} color="#b06aff" text="DREGS" on={flick("extD", 0.08)} />
      <g opacity={flick("extBean", 0.15) ? 1 : 0.4}>
        <SkullBean x={660} y={366} s={100} color="#e8b84a" />
      </g>
      {/* pavement, street, rain */}
      <rect x={-800} y={900} width={3600} height={80} fill="#3a3640" />
      <rect x={-800} y={980} width={3600} height={600} fill="#1e1c24" />
      <path d={blob(900, 1060, 260, 22, 10, 0.3, "puddle")} fill="#4a3a6a" opacity={0.7} />
      <path d={blob(900, 1060, 120, 10, 8, 0.3, "puddle2")} fill="#b06aff" opacity={0.25} />
      {/* streetlamp */}
      <path d="M1720,980 L1720,330 Q1720,300 1690,300 L1640,300" stroke="#1a1820" strokeWidth={14} fill="none" />
      <path d="M1600,300 L1680,300 L1666,330 L1614,330 Z" fill="#2a2830" stroke={INK} strokeWidth={4} />
      <path d="M1614,332 L1666,332 L1760,980 L1520,980 Z" fill="#ffe2a0" opacity={0.1} />
      {/* Gerald's car, parked badly */}
      <g transform="translate(150 960) rotate(-2)">
        <path d="M-200,0 L-190,-70 L-120,-80 L-80,-140 L80,-140 L130,-80 L200,-70 L210,0 Z" fill="#6a7a6a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M-66,-128 L66,-128 L104,-84 L-100,-84 Z" fill="#1a2030" stroke={INK} strokeWidth={4} />
        <circle cx={-120} cy={0} r={34} fill="#1a1a1e" stroke={INK} strokeWidth={5} />
        <circle cx={130} cy={0} r={34} fill="#1a1a1e" stroke={INK} strokeWidth={5} />
        <rect x={-30} y={-60} width={70} height={24} fill="#efe8d8" stroke={INK} strokeWidth={3} transform="rotate(4)" />
        <text x={6} y={-42} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={14} fill="#a3262a" transform="rotate(4)">
          TICKET
        </text>
      </g>
      {rain.map(([rx, ry], i) => {
        const yy = ((ry + t * 900) % 1300) - 200;
        return <path key={i} d={`M${rx},${yy} l-6,26`} stroke="#9ab0d8" strokeWidth={2.5} opacity={0.45} />;
      })}
      {/* a sign on the door: we close at 10 (we mean 9:58) */}
      <g transform={`translate(1360 820) rotate(${noise2D("doorsign", t * 0.5, 0) * 3})`}>
        <rect x={-50} y={-26} width={100} height={52} fill="#efe7d0" stroke={INK} strokeWidth={3} />
        <text x={0} y={-4} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={13} fill={INK}>
          CLOSE AT 10
        </text>
        <text x={0} y={16} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={12} fill="#a3262a">
          (we mean it)
        </text>
      </g>
    </Stage>
  );
};
