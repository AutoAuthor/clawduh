import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage, camLerp } from "../../engine/Stage";
import { Pt, cloudPath, easeInOut, onN, rnd, smoothPath } from "../../engine/util";
import { Tint, Starfield, sparkle } from "./bits";
import { FaceOfGod, FaceOfGodProps } from "./cast/FaceOfGod";
import { Glim, GlimProps } from "./cast/Glim";
import { useSpeech } from "./speech";

/* EPISODE 009 set 1: THE NOISY HEAVENS — the cosmos Glim drifts through, where the stars never shut up. */

export const GLIM_SPACE = { x: 960, y: 760, scale: 0.55 };

/* ------------------------------------------------------------------ */
/* Backdrop                                                            */
/* ------------------------------------------------------------------ */

const NEBULAE: Array<{ x: number; y: number; rx: number; ry: number; c: string; o: number }> = [
  { x: 300, y: 260, rx: 620, ry: 330, c: "#c2367a", o: 0.42 },
  { x: 1620, y: 340, rx: 560, ry: 300, c: "#2ab3b0", o: 0.36 },
  { x: 980, y: 880, rx: 820, ry: 300, c: "#6a3ad0", o: 0.45 },
  { x: -380, y: 900, rx: 500, ry: 360, c: "#8ab43a", o: 0.22 },
  { x: 2300, y: 820, rx: 520, ry: 380, c: "#d0613a", o: 0.22 },
  { x: 960, y: -260, rx: 900, ry: 260, c: "#3a4ad0", o: 0.32 },
];

export const CosmosBackdrop: React.FC<{ t: number; cam: Cam; freeze?: number; drain?: number }> = ({ t, cam, freeze = 0, drain = 0 }) => {
  const clouds = useMemo(() => NEBULAE.map((n, i) => cloudPath(n.x, n.y, n.rx, n.ry, 11, `neb${i}`, 0.9)), []);
  const px = cam.x - 960;
  const py = cam.y - 540;
  const mt = t * (1 - freeze);
  return (
    <g>
      <defs>
        <radialGradient id="cosmosBg" gradientUnits="userSpaceOnUse" cx={960} cy={420} r={2200}>
          <stop offset="0" stopColor="#1d1038" />
          <stop offset="0.45" stopColor="#0c0822" />
          <stop offset="1" stopColor="#020108" />
        </radialGradient>
        {NEBULAE.map((n, i) => (
          <radialGradient key={i} id={`nebg${i}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={n.c} stopOpacity={1} />
            <stop offset="0.6" stopColor={n.c} stopOpacity={0.45} />
            <stop offset="1" stopColor={n.c} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      <rect x={-2600} y={-2000} width={7200} height={5200} fill="url(#cosmosBg)" />
      <Starfield seed="far" n={240} x0={-1500} y0={-1100} w={4900} h={3300} rMin={0.7} rMax={1.8} t={t} freeze={freeze} dx={px * 0.75} dy={py * 0.75} opacity={0.85} />
      <g opacity={1 - drain * 0.75}>
        {clouds.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={`url(#nebg${i})`}
            opacity={NEBULAE[i].o}
            transform={`translate(${px * 0.45 + noise2D(`nb${i}x`, mt * 0.04, 0) * 60} ${py * 0.45 + noise2D(`nb${i}y`, 0, mt * 0.04) * 40})`}
          />
        ))}
      </g>
      {/* two distant spiral galaxies turning */}
      {[
        [1720, 120, 70, 1],
        [180, 760, 54, -1],
      ].map(([gx, gy, gr, dir], i) => (
        <g key={i} transform={`translate(${gx + px * 0.55} ${gy + py * 0.55}) rotate(${mt * 10 * dir}) scale(1 0.55)`} opacity={0.8 - drain * 0.5}>
          <circle r={gr * 1.3} fill="#7a6ad8" opacity={0.18} />
          {[0, 1].map((a) => (
            <path key={a} d={smoothPath(Array.from({ length: 9 }).map((_, k) => [Math.cos(k * 0.6 + a * Math.PI) * (6 + k * gr * 0.12), Math.sin(k * 0.6 + a * Math.PI) * (6 + k * gr * 0.12)] as Pt), false)} fill="none" stroke="#e8dcff" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
          ))}
          <circle r={7} fill="#fff6d8" />
        </g>
      ))}
      <Starfield seed="mid" n={110} x0={-1200} y0={-900} w={4300} h={2900} rMin={1.2} rMax={3.2} t={t} freeze={freeze} sparkles={14} dx={px * 0.35} dy={py * 0.35} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The noisy heavens: stars with mouths                                */
/* ------------------------------------------------------------------ */

const CHATTER: Array<[number, number, number]> = [
  [180, 150, 44],
  [520, 70, 30],
  [1460, 110, 38],
  [1800, 330, 50],
  [1700, 860, 34],
  [260, 560, 36],
  [80, 950, 42],
  [1250, 980, 30],
  [-260, 300, 46],
  [2180, 540, 40],
  [700, 1060, 26],
  [1080, -60, 34],
];

const starPath = (r: number) => {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.48 : r;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return smoothPath(pts, true, 0.35);
};

/** Stars with faces that won't shut up (noise), or fall silent and stare (freeze, looking at `stare`). */
export const ChatterStars: React.FC<{ t: number; frame: number; noise: number; freeze: number; stare?: Pt; px?: number; py?: number }> = ({ t, frame, noise, freeze, stare = [960, 300], px = 0, py = 0 }) => {
  const f2 = onN(frame, 2);
  return (
    <g>
      {CHATTER.map(([x0, y0, r0], i) => {
        const r = r0 * 0.8;
        const x = x0 + px * 0.15 + noise2D(`cs${i}`, t * 0.2 * (1 - freeze), 0) * 14;
        const y = y0 + py * 0.15 + noise2D(`cs${i}y`, 0, t * 0.2 * (1 - freeze)) * 10;
        const silent = freeze > 0.5;
        const open = silent ? 0 : noise * (rnd(`cm${i}-${Math.floor(f2 / 2)}`) > 0.35 ? 0.3 + rnd(`cmo${i}-${f2}`) * 0.7 : 0.05);
        const dx = stare[0] - x;
        const dy = stare[1] - y;
        const dl = Math.hypot(dx, dy) || 1;
        const lx = silent ? (dx / dl) * r * 0.12 : (rnd(`cl${i}-${Math.floor(t * 1.5)}`) - 0.5) * r * 0.2;
        const ly = silent ? (dy / dl) * r * 0.12 : (rnd(`cly${i}-${Math.floor(t * 1.5)}`) - 0.5) * r * 0.14;
        const wob = silent ? 0 : Math.sin(t * 9 + i) * 5 * noise;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${wob + (rnd(`crot${i}`) - 0.5) * 30})`}>
            {noise > 0.05 && !silent
              ? [0, 1].map((k) => {
                  const ph = (t * 1.6 + k * 0.5 + i * 0.13) % 1;
                  return <circle key={k} r={r * (1.3 + ph * 2.4)} fill="none" stroke={["#ff6ad8", "#7affc8", "#7ad8ff"][i % 3]} strokeWidth={2.5} opacity={(1 - ph) * 0.4 * noise} />;
                })
              : null}
            <path d={starPath(r)} fill="#fff1c2" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <circle cx={-r * 0.22} cy={-r * 0.12} r={r * 0.13} fill="#fff" stroke={INK} strokeWidth={2} />
            <circle cx={r * 0.22} cy={-r * 0.12} r={r * 0.13} fill="#fff" stroke={INK} strokeWidth={2} />
            <circle cx={-r * 0.22 + lx * 0.5} cy={-r * 0.12 + ly * 0.5} r={r * 0.06} fill={INK} />
            <circle cx={r * 0.22 + lx * 0.5} cy={-r * 0.12 + ly * 0.5} r={r * 0.06} fill={INK} />
            {open > 0.08 ? (
              <g>
                <ellipse cx={0} cy={r * 0.22} rx={r * 0.2} ry={r * 0.04 + open * r * 0.22} fill="#2a0a14" stroke={INK} strokeWidth={2.5} />
                <rect x={-r * 0.14} y={r * 0.22 - (r * 0.04 + open * r * 0.22)} width={r * 0.28} height={r * 0.07} fill="#f2e6a0" />
              </g>
            ) : (
              <path d={`M${-r * 0.18},${r * 0.24} L${r * 0.18},${r * 0.24}`} stroke={INK} strokeWidth={3} strokeLinecap="round" />
            )}
          </g>
        );
      })}
    </g>
  );
};

/** Radio-static colour: flickering horizontal bands in screen space. */
export const StaticBands: React.FC<{ frame: number; amount: number }> = ({ frame, amount }) => {
  const { width: SW, height: SH } = useVideoConfig();
  if (amount <= 0.01) return null;
  const f2 = onN(frame, 2);
  const cols = ["#ff3ad0", "#5aff9a", "#3ad8ff", "#fff6d0", "#ff8a3a"];
  return (
    <g>
      {Array.from({ length: 9 }).map((_, i) => {
        const y = rnd(`sb${f2}-${i}`) * SH;
        const h = 3 + Math.pow(rnd(`sbh${f2}-${i}`), 3) * 50;
        const o = (0.03 + rnd(`sbo${f2}-${i}`) * 0.14) * amount;
        return <rect key={i} x={0} y={y} width={SW} height={h} fill={cols[Math.floor(rnd(`sbc${f2}-${i}`) * cols.length)]} opacity={o} />;
      })}
      {Array.from({ length: 3 }).map((_, i) => (
        <rect key={`d${i}`} x={0} y={rnd(`sbd${f2}-${i}`) * SH} width={SW} height={2 + rnd(`sbdh${f2}-${i}`) * 10} fill="#000" opacity={0.35 * amount} />
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Props for the narration                                             */
/* ------------------------------------------------------------------ */

/** An old telephone handset pressed to where an ear would be, its coiled cord spiralling off into the dark. */
export const Handset: React.FC<{ x: number; y: number; rot?: number; s?: number; t: number; cordTo: Pt; drip?: number }> = ({ x, y, rot = 0, s = 1, t, cordTo, drip = 0 }) => {
  const coils = useMemo(() => {
    const pts: Pt[] = [];
    const n = 90;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      pts.push([k, Math.sin(k * Math.PI * 2 * 18)]);
    }
    return pts;
  }, []);
  const start: Pt = [x, y + 40 * s];
  const dx = cordTo[0] - start[0];
  const dy = cordTo[1] - start[1];
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const sway = Math.sin(t * 1.4) * 40;
  const cord = coils.map(([k, w]) => {
    const bend = Math.sin(k * Math.PI) * (90 + sway);
    return [start[0] + dx * k + nx * (w * 12 * s + bend), start[1] + dy * k + ny * (w * 12 * s + bend)] as Pt;
  });
  return (
    <g>
      <path d={smoothPath(cord, false, 0.8)} fill="none" stroke="#9a8aff" strokeWidth={15 * s} strokeLinecap="round" opacity={0.18} />
      <path d={smoothPath(cord, false, 0.8)} fill="none" stroke={INK} strokeWidth={9 * s} strokeLinecap="round" />
      <path d={smoothPath(cord, false, 0.8)} fill="none" stroke="#4a4858" strokeWidth={4.5 * s} strokeLinecap="round" />
      <path d={smoothPath(cord, false, 0.8)} fill="none" stroke="#b8b2d8" strokeWidth={1.5 * s} strokeLinecap="round" opacity={0.7} />
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
        <path d="M-30,-120 C-70,-110 -78,-60 -50,-40 L-34,-20 C-20,-40 -18,40 -34,20 L-50,40 C-78,60 -70,110 -30,120 C0,128 22,100 14,70 L0,40 C-6,20 -6,-20 0,-40 L14,-70 C22,-100 0,-128 -30,-120 Z" fill="#1c1b22" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <ellipse cx={-34} cy={-88} rx={30} ry={22} fill="#2c2b34" stroke={INK} strokeWidth={4} />
        {[-10, 0, 10].map((o) => (
          <circle key={o} cx={-34 + o} cy={-88 + (o === 0 ? -6 : 4)} r={3} fill="#000" />
        ))}
        <path d="M-60,-40 C-66,-10 -66,10 -60,40" fill="none" stroke="#4a4856" strokeWidth={4} />
        {drip > 0 ? (
          <path d={`M-40,-70 q-4,${40 * drip} 2,${80 * drip} q6,10 -2,14`} fill="#050008" stroke={INK} strokeWidth={2} />
        ) : null}
      </g>
    </g>
  );
};

/** Little star-shaped "z"s floating off a sleeper. */
export const StarSnores: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g>
    {[0, 1, 2].map((i) => {
      const k = (t * 0.45 + i / 3) % 1;
      return <path key={i} d={sparkle(8 + k * 16)} transform={`translate(${x + k * 120 + Math.sin(k * 6 + i) * 20} ${y - k * 160}) rotate(${k * 90})`} fill="#fff4c8" stroke={INK} strokeWidth={2} opacity={1 - k} />;
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

export interface CosmosSceneProps {
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  glim?: Partial<GlimProps> | false;
  face?: Partial<FaceOfGodProps> | false;
  noise?: number;
  freeze?: number;
  /** 0..1 drains the colour out (the silence) */
  drain?: number;
  hue?: number;
  back?: React.ReactNode;
  front?: React.ReactNode;
  shakeAmp?: number;
  stars?: boolean;
}

export const CosmosScene: React.FC<CosmosSceneProps> = ({ from, to, cam, ease = easeInOut, glim = {}, face = false, noise = 0.8, freeze = 0, drain = 0, hue = 0, back, front, shakeAmp = 0, stars = true }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = cam ?? (to ? camLerp(from, to, ease(shot.p)) : from);
  const sg = useSpeech("glim");
  const faceProps: FaceOfGodProps | null = face ? { id: "god", x: 960, y: 260, s: 0.78, t: t * (1 - freeze * 0.85), ...face } : null;
  return (
    <Tint hue={hue} sat={1 - drain * 0.85} contrast={1 + drain * 0.15}>
      <Stage cam={c} frame={frame} shakeAmp={shakeAmp} overlay={<StaticBands frame={frame} amount={noise * (1 - freeze)} />}>
        <CosmosBackdrop t={t} cam={c} freeze={freeze} drain={drain} />
        {faceProps ? <FaceOfGod {...faceProps} /> : null}
        {stars ? <ChatterStars t={t} frame={frame} noise={noise} freeze={freeze} stare={faceProps ? [faceProps.x, faceProps.y] : undefined} px={c.x - 960} py={c.y - 540} /> : null}
        {back}
        {glim ? <Glim id="glim" x={GLIM_SPACE.x} y={GLIM_SPACE.y} scale={GLIM_SPACE.scale} pose="float" t={t} frame={frame} {...sg} {...glim} /> : null}
        {front}
      </Stage>
    </Tint>
  );
};
