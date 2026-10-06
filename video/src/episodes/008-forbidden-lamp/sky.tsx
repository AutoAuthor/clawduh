import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage } from "../../engine/Stage";
import { blob, clamp, cloudPath, lerp, rnd } from "../../engine/util";
import { Moth, MothProps } from "./cast/Moth";
import { Parallax, ScreenSpace, useCam } from "./common";

/* EPISODE 008 flashback: young Tatter's flight "up and up" toward the light he thought was the lamp (the moon). */

/** Epic flashback grade: crushed teal shadows, golden highlights. */
export const EPIC = "contrast(1.22) saturate(1.3) sepia(0.28) hue-rotate(-10deg) brightness(0.96)";

/** Black bars for the flashback (screen space, both formats). */
export const Bars: React.FC<{ k?: number }> = ({ k = 1 }) => {
  const { width, height } = useVideoConfig();
  const h = Math.round((height > width ? 150 : 96) * k);
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h, background: "#000" }} />
    </>
  );
};

export interface MoonProps {
  /** centre as fractions of the frame */
  fx: number;
  fy: number;
  /** radius as a fraction of the frame's short side */
  fr: number;
  /** 0..1 creeping smirk */
  smirk?: number;
  glow?: number;
  t: number;
}

/** The moon, drawn in screen pixels (it never gets any closer). */
export const ScreenMoon: React.FC<MoonProps> = ({ fx, fy, fr, smirk = 0, glow = 1, t }) => {
  const { width, height } = useVideoConfig();
  const cx = fx * width;
  const cy = fy * height;
  const r = fr * Math.min(width, height);
  const eyeY = cy - r * 0.18;
  return (
    <g>
      <g style={{ mixBlendMode: "screen" }} opacity={glow}>
        <defs>
          <radialGradient id="moonGlow" gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r * 4.2}>
            <stop offset="0" stopColor="#fff6d8" stopOpacity={0.9} />
            <stop offset="0.25" stopColor="#ffe6a8" stopOpacity={0.35} />
            <stop offset="1" stopColor="#ffd88a" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r * 4.2} fill="url(#moonGlow)" />
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2 + t * 0.04;
          const w = 0.06;
          const L = r * 5;
          return <path key={i} d={`M${cx},${cy} L${cx + Math.cos(a - w) * L},${cy + Math.sin(a - w) * L} L${cx + Math.cos(a + w) * L},${cy + Math.sin(a + w) * L} Z`} fill="#fff3c4" opacity={0.06 * glow} />;
        })}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="#f6efd2" stroke={INK} strokeWidth={Math.max(4, r * 0.03)} />
      <circle cx={cx + r * 0.25} cy={cy + r * 0.32} r={r * 0.14} fill="#e2d7ae" />
      <circle cx={cx - r * 0.45} cy={cy + r * 0.38} r={r * 0.09} fill="#e2d7ae" />
      <circle cx={cx + r * 0.5} cy={cy - r * 0.45} r={r * 0.07} fill="#e2d7ae" />
      {/* the craters slide into a face as it mocks him */}
      <ellipse cx={cx - r * 0.3} cy={eyeY} rx={r * 0.13} ry={r * lerp(0.12, 0.05, smirk)} fill="#d6c99c" />
      <ellipse cx={cx + r * 0.3} cy={eyeY} rx={r * 0.13} ry={r * lerp(0.12, 0.05, smirk)} fill="#d6c99c" />
      {smirk > 0.05 ? (
        <path
          d={`M${cx - r * 0.38},${cy + r * 0.28} Q${cx},${cy + r * (0.28 + 0.22 * smirk)} ${cx + r * 0.42},${cy + r * (0.2 - 0.12 * smirk)}`}
          stroke="#c9bb88"
          strokeWidth={r * 0.07}
          fill="none"
          strokeLinecap="round"
          opacity={smirk}
        />
      ) : null}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* World layers                                                        */
/* ------------------------------------------------------------------ */

const GROUND = 1000;

const Stars: React.FC<{ t: number }> = ({ t }) => {
  const stars = useMemo(
    () =>
      Array.from({ length: 220 }).map((_, i) => {
        const y = 400 - Math.pow(rnd(`sy${i}`), 0.7) * 9000;
        return [-2400 + rnd(`sx${i}`) * 6800, y, 1.2 + rnd(`sr${i}`) * 2.6] as const;
      }),
    [],
  );
  return (
    <g>
      {stars.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#f2ecd6" opacity={0.45 + 0.35 * Math.sin(t * 1.7 + i)} />
      ))}
    </g>
  );
};

const Clouds: React.FC<{ y0: number; y1: number; seed: string; t: number; tint: string; n?: number }> = ({ y0, y1, seed, t, tint, n = 9 }) => {
  const cl = useMemo(
    () =>
      Array.from({ length: n }).map((_, i) => {
        const x = -1800 + rnd(`${seed}x${i}`) * 5600;
        const y = lerp(y0, y1, rnd(`${seed}y${i}`));
        const rx = 260 + rnd(`${seed}rx${i}`) * 380;
        const ry = rx * (0.32 + rnd(`${seed}ry${i}`) * 0.18);
        return { x, y, rx, ry, d: cloudPath(0, 0, rx, ry, 11, `${seed}c${i}`, 0.9), top: cloudPath(-rx * 0.08, -ry * 0.22, rx * 0.86, ry * 0.7, 9, `${seed}t${i}`, 0.8) };
      }),
    [seed, y0, y1, n],
  );
  return (
    <g>
      {cl.map((c, i) => (
        <g key={i} transform={`translate(${c.x + Math.sin(t * 0.05 + i) * 40} ${c.y})`}>
          <path d={c.d} fill={tint} stroke={INK} strokeWidth={5} opacity={0.96} />
          <path d={c.top} fill="#c9c6d8" opacity={0.45} />
        </g>
      ))}
    </g>
  );
};

const Rooftop: React.FC<{ t: number }> = ({ t }) => {
  return (
    <g>
      {/* trees */}
      <path d="M-1400,560 C-1460,260 -1300,80 -1150,140 C-1080,0 -880,20 -860,170 C-760,180 -760,420 -900,500 L-920,1100 L-1300,1100 Z" fill="#090c16" />
      <path d="M2700,600 C2640,300 2800,140 2950,200 C3030,60 3220,90 3230,240 C3330,260 3320,480 3180,540 L3160,1100 L2780,1100 Z" fill="#090c16" />
      {/* the shabby house's roof */}
      <path d="M-300,1100 L-300,620 L940,240 L2200,620 L2200,1100 Z" fill="#17141c" stroke={INK} strokeWidth={8} />
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={i} d={`M${-240 + i * 30},${640 - i * 50} L${940},${260 + i * 6}`} stroke="#211d27" strokeWidth={5} opacity={0.6} />
      ))}
      <rect x={1460} y={330} width={120} height={260} fill="#211c22" stroke={INK} strokeWidth={6} />
      {/* TV antenna, bent */}
      <path d="M760,300 L760,40 M660,90 L860,70 M680,140 L840,124 M700,190 L820,178" stroke="#3a3640" strokeWidth={8} fill="none" />
      <path d="M760,40 l40,-30" stroke="#3a3640" strokeWidth={6} />
      {/* power line + sleeping birds */}
      <path d="M-2400,120 Q900,260 4200,120" stroke="#0a0b10" strokeWidth={6} fill="none" />
      <path d="M-2400,40 Q900,180 4200,40" stroke="#0a0b10" strokeWidth={6} fill="none" />
      {[200, 330, 470, 1500].map((bx, i) => (
        <g key={i} transform={`translate(${bx} ${170 + Math.abs(bx - 900) * -0.03})`}>
          <path d={blob(0, -26, 24, 26, 9, 0.1, `bird${i}`)} fill="#0a0b10" />
          <circle cx={14} cy={-50} r={12} fill="#0a0b10" />
          <path d="M24,-50 l12,4 l-12,4" fill="#0a0b10" />
          {i === 3 ? <path d="M8,-56 l6,4 l-6,4" stroke="#f2ecd6" strokeWidth={2} fill="none" opacity={0.8} /> : null}
        </g>
      ))}
      {/* porch light glow far below */}
      <circle cx={1700} cy={GROUND + 60} r={260} fill="#ffcf7a" opacity={0.16 + 0.04 * Math.sin(t * 3)} />
      <circle cx={1700} cy={GROUND + 60} r={40} fill="#fff1c0" opacity={0.6} />
    </g>
  );
};

const Plane: React.FC<{ t: number }> = ({ t }) => {
  const x = ((t * 140) % 6000) - 2400;
  const blink = Math.floor(t * 2) % 2 === 0;
  return (
    <g transform={`translate(${x} -6400)`}>
      <path d="M-120,0 L120,-6 L150,0 L120,8 L-120,6 Z" fill="#1a1c26" />
      <path d="M-10,0 L-60,-60 L-30,-60 L30,0 Z M-100,0 L-130,-30 L-115,-30 L-90,0 Z" fill="#1a1c26" />
      <circle cx={150} cy={0} r={6} fill={blink ? "#ff4a4a" : "#3a1a1a"} />
      <circle cx={-120} cy={0} r={5} fill={!blink ? "#eaffea" : "#2a3a2a"} />
      {/* a passenger window, someone looking out */}
      <rect x={20} y={-4} width={12} height={8} fill="#ffe9a0" />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Extras                                                              */
/* ------------------------------------------------------------------ */

/** A bat swooping past with its mouth open. Origin = centre. */
export const Bat: React.FC<{ x: number; y: number; s?: number; t: number; flip?: boolean }> = ({ x, y, s = 1, t, flip = false }) => {
  const fl = Math.sin(t * 26);
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d={`M0,0 C-40,${-60 * fl - 10} -110,${-50 * fl - 10} -150,${-30 * fl + 10} C-120,0 -110,20 -90,10 C-80,30 -60,20 -50,30 C-40,10 -20,20 0,10 Z`} fill="#141018" stroke={INK} strokeWidth={4} />
      <path d={`M0,0 C40,${-60 * fl - 10} 110,${-50 * fl - 10} 150,${-30 * fl + 10} C120,0 110,20 90,10 C80,30 60,20 50,30 C40,10 20,20 0,10 Z`} fill="#141018" stroke={INK} strokeWidth={4} />
      <ellipse cx={0} cy={10} rx={26} ry={30} fill="#1d1820" stroke={INK} strokeWidth={4} />
      <path d="M-18,-12 L-26,-40 L-6,-18 Z M18,-12 L26,-40 L6,-18 Z" fill="#1d1820" stroke={INK} strokeWidth={3} />
      <circle cx={-9} cy={0} r={5} fill="#ff4a3a" />
      <circle cx={9} cy={0} r={5} fill="#ff4a3a" />
      <path d="M-14,18 Q0,40 14,18 Z" fill="#5a1414" stroke={INK} strokeWidth={3} />
      <path d="M-10,19 l3,8 l3,-7 M4,19 l3,8 l3,-8" fill="#f2ecd6" />
    </g>
  );
};

/** A plastic grocery bag tumbling in the wind (it is going where he is going). */
export const Bag: React.FC<{ x: number; y: number; s?: number; t: number }> = ({ x, y, s = 1, t }) => {
  const puff = 0.85 + Math.sin(t * 5) * 0.15;
  return (
    <g transform={`translate(${x} ${y}) rotate(${Math.sin(t * 2) * 30}) scale(${s} ${s * puff})`}>
      <path d="M-70,-30 C-90,40 -50,90 0,92 C50,90 90,40 70,-30 L52,-36 C50,-80 30,-96 20,-60 L-20,-60 C-30,-96 -50,-80 -52,-36 Z" fill="#eef0ec" opacity={0.82} stroke="#8a948f" strokeWidth={4} strokeLinejoin="round" />
      <path d="M-34,-40 q-6,-34 10,-44 q10,10 6,40 M34,-40 q6,-34 -10,-44 q-10,10 -6,40" stroke="#8a948f" strokeWidth={3} fill="none" />
      <path d="M-40,0 q20,40 40,50 M10,-10 q16,30 40,36 M-50,40 q30,10 60,0" stroke="#b9c2be" strokeWidth={3} fill="none" />
      <text x={0} y={30} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={22} fill="#c0392b" opacity={0.75}>
        THANK YOU
      </text>
    </g>
  );
};

/** Speed lines in screen space (dir = +1 streaks rise = falling camera; -1 = rising). */
export const SpeedLines: React.FC<{ t: number; amount: number; dir?: number; seed?: string }> = ({ t, amount, dir = 1, seed = "spd" }) => {
  const { width, height } = useVideoConfig();
  if (amount <= 0) return null;
  return (
    <g opacity={amount}>
      {Array.from({ length: 22 }).map((_, i) => {
        const x = rnd(`${seed}x${i}`) * width;
        const len = 120 + rnd(`${seed}l${i}`) * 320;
        const sp = 1400 + rnd(`${seed}s${i}`) * 1400;
        const y = ((((-dir * t * sp + rnd(`${seed}o${i}`) * (height + len)) % (height + len)) + height + len) % (height + len)) - len;
        return <path key={i} d={`M${x},${y} L${x},${y + len}`} stroke="#e8e4f0" strokeWidth={2 + (i % 3)} opacity={0.35} strokeLinecap="round" />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

export interface SkySceneProps {
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  moth?: Partial<MothProps> & { x: number; y: number };
  moon?: Partial<MoonProps> | false;
  /** drawn behind the moth, in front of the sky (world space) */
  back?: React.ReactNode;
  front?: React.ReactNode;
  /** screen-space extras drawn over everything */
  screen?: React.ReactNode;
  shakeAmp?: number;
  dark?: number;
  /** cloud banks (off above the clouds) */
  clouds?: boolean;
}

export const SkyScene: React.FC<SkySceneProps> = ({ from, to, cam, ease, moth, moon = {}, back, front, screen, shakeAmp = 0, dark = 0, clouds = true }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = useCam(from, to, ease, cam);
  return (
    <Stage cam={c} frame={frame} shakeAmp={shakeAmp}>
      <defs>
        <linearGradient id="skyGrad" gradientUnits="userSpaceOnUse" x1={0} y1={-9500} x2={0} y2={GROUND + 200}>
          <stop offset="0" stopColor="#010208" />
          <stop offset="0.55" stopColor="#070b26" />
          <stop offset="0.85" stopColor="#141a44" />
          <stop offset="1" stopColor="#2c2450" />
        </linearGradient>
      </defs>
      <rect x={-6000} y={-12000} width={14000} height={14000} fill="url(#skyGrad)" />
      <Parallax cam={c} p={0.25}>
        <Stars t={t} />
      </Parallax>
      {moon ? (
        <ScreenSpace cam={c}>
          <ScreenMoon fx={0.5} fy={0.26} fr={0.16} t={t} {...moon} />
        </ScreenSpace>
      ) : null}
      {clouds ? (
        <Parallax cam={c} p={0.6}>
          <Clouds y0={-5200} y1={-4300} seed="cb" t={t} tint="#3a3a5c" n={8} />
        </Parallax>
      ) : null}
      <Plane t={t} />
      {clouds ? <Clouds y0={-2500} y1={-1600} seed="ca" t={t} tint="#4a4868" n={10} /> : null}
      <Rooftop t={t} />
      {back}
      {moth ? <Moth id="young" kind="tatter" young pose="fly" t={t} frame={frame} mute scale={0.42} wings={1} flap={1} {...moth} /> : null}
      {front}
      {dark > 0 ? (
        <ScreenSpace cam={c}>
          <rect x={-200} y={-200} width={4000} height={4000} fill="#000" opacity={clamp(dark)} />
        </ScreenSpace>
      ) : null}
      {screen ? <ScreenSpace cam={c}>{screen}</ScreenSpace> : null}
    </Stage>
  );
};
