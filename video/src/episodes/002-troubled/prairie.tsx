import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { Bull, BullProps } from "../../characters/Bull";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage, camLerp } from "../../engine/Stage";
import { energyAt, isTalking, mouthAt } from "../../engine/timeline";
import { blob, clamp, cloudPath, easeInOut, lerp, onN, rnd } from "../../engine/util";
import { Farmhouse, Fence, Shed } from "../../scenes/Pen";

/*
 * EPISODE 002 set: the prairie pasture on the same farm as episode 001.
 * The sky goes from sunset to deep night across the 7-minute conversation.
 */

export const B_POS = { x: 470, y: 940 }; // Brisket (faces right)
export const C_POS = { x: 1450, y: 940 }; // Chuck (faces left)
export const BULL_SCALE = 0.9;
export const B_HEAD = { x: B_POS.x + 300 * BULL_SCALE, y: B_POS.y - 330 * BULL_SCALE };
export const C_HEAD = { x: C_POS.x - 300 * BULL_SCALE, y: C_POS.y - 330 * BULL_SCALE };

export const CAM2 = {
  wide: { x: 960, y: 560, zoom: 1 },
  wideIn: { x: 960, y: 600, zoom: 1.12 },
  two: { x: 960, y: 650, zoom: 1.4 },
  low: { x: 960, y: 700, zoom: 1.25, rot: 0 },
  cuB: { x: B_HEAD.x - 10, y: B_HEAD.y - 10, zoom: 2.7 },
  ecuB: { x: B_HEAD.x - 12, y: B_HEAD.y - 30, zoom: 4.6 },
  msB: { x: B_HEAD.x - 120, y: B_HEAD.y + 60, zoom: 1.7 },
  cuC: { x: C_HEAD.x + 10, y: C_HEAD.y - 10, zoom: 2.7 },
  ecuC: { x: C_HEAD.x + 12, y: C_HEAD.y - 30, zoom: 4.6 },
  msC: { x: C_HEAD.x + 120, y: C_HEAD.y + 60, zoom: 1.7 },
  farm: { x: 560, y: 520, zoom: 2.4 },
  shed: { x: 560, y: 520, zoom: 4.4 },
  herd: { x: 1800, y: 690, zoom: 1.9 },
  fence: { x: 960, y: 640, zoom: 2.2 },
} satisfies Record<string, Cam>;

/** 0 = sunset ... 1 = deep night, from absolute time. */
export const nightAt = (t: number) => clamp((t - 20) / 330);

const mix = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
};

export function useBullSpeech(speaker: string) {
  const { timeline, shot } = useEpisode();
  const tq = onN(shot.frame, 2) / shot.fps;
  return { mouth: mouthAt(timeline, speaker, tq), talking: isTalking(timeline, speaker, shot.t), energy: energyAt(timeline, shot.t) };
}

export const PrairieSky: React.FC<{ t: number; night: number; id?: string }> = ({ t, night, id = "psky" }) => {
  const top = mix("#3a2346", "#0b0916", night);
  const mid = mix("#b5523e", "#1d1730", night);
  const bot = mix("#f0a24c", "#2c2236", Math.min(1, night * 1.25));
  const sunY = lerp(470, 720, clamp(night * 2.2));
  const moonY = lerp(760, 170, clamp((night - 0.35) / 0.6));
  const stars = useMemo(() => Array.from({ length: 80 }).map((_, i) => [rnd(`${id}s${i}`) * 2600 - 340, rnd(`${id}sy${i}`) * 520 - 200, rnd(`${id}ss${i}`)] as const), [id]);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1="0" y1="-200" x2="0" y2="620">
          <stop offset="0" stopColor={top} />
          <stop offset="0.6" stopColor={mid} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ff7a3a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-moon`}>
          <stop offset="0" stopColor="#e9e39a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#c9c27a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-800} y={-1600} width={3600} height={1000} fill={top} />
      <rect x={-800} y={-620} width={3600} height={1300} fill={`url(#${id}-g)`} />
      {stars.map(([sx, sy, ss], i) => (
        <circle key={i} cx={sx} cy={sy} r={1 + ss * 1.8} fill="#efe9cf" opacity={clamp((night - 0.25) * 2) * (0.3 + 0.6 * Math.abs(Math.sin(t * (0.4 + ss) + i)))} />
      ))}
      {night < 0.55 ? (
        <g opacity={1 - clamp((night - 0.3) / 0.25)}>
          <circle cx={1580} cy={sunY} r={340} fill={`url(#${id}-sun)`} />
          <circle cx={1580} cy={sunY} r={95} fill="#ffb24a" stroke={INK} strokeWidth={5} />
        </g>
      ) : null}
      {night > 0.35 ? (
        <g>
          <circle cx={1500} cy={moonY} r={280} fill={`url(#${id}-moon)`} />
          <circle cx={1500} cy={moonY} r={74} fill="#ddd68f" stroke={INK} strokeWidth={5} />
          <path d={blob(1478, moonY - 16, 14, 11, 7, 0.2, "pm1")} fill="#c7bf73" />
          <path d={blob(1522, moonY + 14, 19, 15, 7, 0.2, "pm2")} fill="#c7bf73" />
        </g>
      ) : null}
      {[0, 1, 2].map((i) => {
        const cx = ((t * (10 + i * 5) + i * 800) % 2900) - 500;
        return <path key={i} d={cloudPath(cx, 120 + i * 80, 280 - i * 40, 24, 10, `${id}c${i}`, 0.5)} fill={mix("#7a3a4a", "#1a1424", night)} opacity={0.8} />;
      })}
    </g>
  );
};

/** A heifer in the pasture (some graze, some stare). */
const Heifer: React.FC<{ x: number; y: number; s: number; t: number; seed: string; color: string }> = ({ x, y, s, t, seed, color }) => {
  const graze = Math.sin(t * 0.5 + rnd(seed) * 6) > 0.2;
  const flip = rnd(seed + "f") > 0.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx={0} cy={0} rx={110} ry={14} fill="#000" opacity={0.3} />
      {[-70, -40, 50, 78].map((lx, i) => (
        <rect key={i} x={lx} y={-56} width={18} height={56} rx={6} fill={color} stroke={INK} strokeWidth={5} />
      ))}
      <ellipse cx={0} cy={-80} rx={104} ry={52} fill={color} stroke={INK} strokeWidth={6} />
      <path d={blob(-30, -92, 30, 20, 7, 0.3, seed + "spot")} fill="#e9dcc0" opacity={0.85} />
      <g transform={`rotate(${graze ? 40 : -6} 90 -96)`}>
        <path d="M84,-118 l-14,-16 l22,4 Z M128,-120 l16,-14 l-4,20 Z" fill={color} stroke={INK} strokeWidth={4} />
        <ellipse cx={112} cy={-98} rx={34} ry={28} fill={color} stroke={INK} strokeWidth={5} />
        <ellipse cx={120} cy={-80} rx={20} ry={13} fill="#d9b8a0" stroke={INK} strokeWidth={3} />
        {!graze ? (
          <>
            <circle cx={104} cy={-104} r={5} fill="#efe7d0" />
            <circle cx={124} cy={-104} r={5} fill="#efe7d0" />
            <circle cx={104} cy={-104} r={2} fill={INK} />
            <circle cx={124} cy={-104} r={2} fill={INK} />
          </>
        ) : null}
      </g>
      <path d="M-104,-90 q-24,20 -16,56" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

export const PrairieBackdrop: React.FC<{ t: number; frame: number; night?: number; shedGlow?: number; fenceBroken?: number; showHerd?: boolean; calves?: boolean }> = ({
  t,
  frame,
  night: nightOverride,
  shedGlow = 1,
  fenceBroken = 0,
  showHerd = true,
}) => {
  const tt = onN(frame, 2) / 24;
  const night = nightOverride ?? nightAt(t);
  const hillFar = mix("#5a3048", "#16121e", night);
  const hillNear = mix("#3d2a2e", "#1a1622", night);
  const grass = mix("#4a4a24", "#1d2216", night);
  const grassHi = mix("#6e6a30", "#2a3120", night);
  const herdColor = mix("#6a4a36", "#2a2226", night);
  const tufts = useMemo(() => Array.from({ length: 90 }).map((_, i) => [rnd(`gt${i}`) * 2600 - 340, 720 + rnd(`gty${i}`) * 520, rnd(`gts${i}`)] as const), []);
  return (
    <g>
      <PrairieSky t={tt} night={night} />
      <path d="M-800,600 C-300,540 200,590 700,560 C1200,530 1500,580 2000,545 C2300,525 2600,560 2800,560 L2800,900 L-800,900 Z" fill={hillFar} />
      <path d="M-800,640 C-200,610 400,650 1000,628 C1500,610 2000,650 2800,622 L2800,900 L-800,900 Z" fill={hillNear} />
      {/* the farm beyond the great fence: house — shed — barn */}
      <g opacity={1}>
        <Farmhouse x={300} y={600} s={0.62} t={tt} />
        <Shed x={560} y={606} s={0.42} t={tt} glow={shedGlow * (0.6 + night * 0.6)} />
        <g transform="translate(830 606) scale(0.62)">
          <path d="M-200,0 L-200,-220 L-120,-320 L120,-320 L200,-220 L200,0 Z" fill={mix("#6a2a22", "#2a1210", night)} stroke={INK} strokeWidth={8} />
          <path d="M-224,-210 L-120,-334 L120,-334 L224,-210" fill="none" stroke="#1a0c0a" strokeWidth={22} strokeLinejoin="round" />
          <rect x={-60} y={-130} width={120} height={130} fill={mix("#3a1a14", "#e9c25e", night * 0.7)} stroke={INK} strokeWidth={6} />
          <path d="M-60,-130 L60,0 M60,-130 L-60,0" stroke="#2a1210" strokeWidth={8} />
          <rect x={-34} y={-280} width={68} height={60} fill={mix("#2a1210", "#e9c25e", night * 0.6)} stroke={INK} strokeWidth={5} />
        </g>
        {/* a little sheep pen by the barn (episode 001 cameo: a gaunt shape at the rail) */}
        <g transform="translate(1000 606) scale(0.32)">
          <path d="M-120,0 L-120,-60 M-40,0 L-40,-60 M40,0 L40,-60 M120,0 L120,-60 M-130,-40 L130,-40" stroke={INK} strokeWidth={10} />
          <ellipse cx={-30} cy={-50} rx={34} ry={22} fill={mix("#cdc4ae", "#5a5650", night)} />
          <circle cx={6} cy={-78} r={16} fill={mix("#bba79c", "#4a4440", night)} />
          <circle cx={1} cy={-80} r={5} fill="#efe7cf" />
          <circle cx={13} cy={-80} r={5} fill="#efe7cf" />
        </g>
      </g>
      {/* lone oak */}
      <g transform="translate(1700 680)" fill={mix("#1f1416", "#0b0810", night)}>
        <path d="M-26,0 C-20,-90 -30,-170 -10,-240 L14,-240 C6,-170 22,-90 30,0 Z" />
        <path d={cloudPath(0, -300, 190, 110, 14, "oak", 0.9)} />
      </g>

      {/* the great fence */}
      <g opacity={1}>
        <Fence y={720} seed="greatfence" h={90} gapAt={fenceBroken > 0 ? [940, 980, 1020] : []} />
      </g>
      {/* pasture */}
      <path d="M-800,712 C0,700 900,722 1800,706 C2300,698 2600,712 2800,712 L2800,2700 L-800,2700 Z" fill={grass} stroke={INK} strokeWidth={5} />
      {showHerd
        ? [
            [1660, 790, 0.5],
            [1790, 770, 0.46],
            [1930, 800, 0.56],
            [2060, 775, 0.48],
            [1560, 760, 0.42],
            [-140, 785, 0.5],
            [10, 765, 0.44],
          ].map(([hx, hy, hs], i) => <Heifer key={i} x={hx} y={hy} s={hs} t={tt} seed={`hf${i}`} color={herdColor} />)
        : null}
      {tufts.map(([gx, gy, gs], i) => (
        <path
          key={i}
          d={`M${gx},${gy} l${-8 - gs * 6},${-22 - gs * 18} M${gx},${gy} l2,${-28 - gs * 20} M${gx},${gy} l${10 + gs * 6},${-20 - gs * 16}`}
          stroke={grassHi}
          strokeWidth={4}
          strokeLinecap="round"
          transform={`rotate(${noise2D("wind" + i, tt * 0.5, 0) * 6} ${gx} ${gy})`}
        />
      ))}
    </g>
  );
};

export interface PrairieSceneProps {
  from: Cam;
  to?: Cam;
  ease?: (x: number) => number;
  brisket?: Partial<BullProps> | false;
  chuck?: Partial<BullProps> | false;
  night?: number;
  shakeAmp?: number;
  shedGlow?: number;
  overlay?: React.ReactNode;
  front?: React.ReactNode;
  showHerd?: boolean;
  fenceBroken?: number;
}

/** The two brothers in the pasture, lip-synced from the timeline. */
export const PrairieScene: React.FC<PrairieSceneProps> = ({ from, to, ease = easeInOut, brisket = {}, chuck = {}, night, shakeAmp = 0, shedGlow, overlay, front, showHerd, fenceBroken }) => {
  const { shot } = useEpisode();
  const cam = to ? camLerp(from, to, ease(shot.p)) : from;
  const b = useBullSpeech("brisket");
  const c = useBullSpeech("chuck");
  return (
    <Stage cam={cam} frame={shot.frame} shakeAmp={shakeAmp} overlay={overlay}>
      <PrairieBackdrop t={shot.t} frame={shot.frame} night={night} shedGlow={shedGlow} showHerd={showHerd} fenceBroken={fenceBroken} />
      {brisket !== false ? (
        <Bull id="brisket" variant="brisket" x={B_POS.x} y={B_POS.y} scale={BULL_SCALE} t={shot.t} frame={shot.frame} {...b} look={[0.6, 0]} {...brisket} />
      ) : null}
      {chuck !== false ? (
        <Bull id="chuck" variant="chuck" x={C_POS.x} y={C_POS.y} scale={BULL_SCALE} flip t={shot.t} frame={shot.frame} {...c} look={[0.6, 0]} expr="content" {...chuck} />
      ) : null}
      {front}
    </Stage>
  );
};
