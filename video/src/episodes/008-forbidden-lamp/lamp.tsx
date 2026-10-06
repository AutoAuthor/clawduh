import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage } from "../../engine/Stage";
import { Pt, blob, clamp, easeOut, lerp, onN, rnd, smoothPath } from "../../engine/util";
import { Moth, MothProps } from "./cast/Moth";
import { FONT, useCam, useSpeech } from "./common";

/* EPISODE 008 — the FORBIDDEN LAMP (a bare porch bulb) and its temple guard (a bug zapper), plus the macro "lamp world". */

/* ------------------------------------------------------------------ */
/* The bulb                                                            */
/* ------------------------------------------------------------------ */

export interface BulbProps {
  id: string;
  x: number;
  y: number;
  /** glass radius */
  r: number;
  t: number;
  /** 0..1.5 brightness */
  on?: number;
  /** god-ray strength 0..1 */
  rays?: number;
  /** glow radius (default 9r) */
  glowR?: number;
  /** draw the wall-mounted socket + bracket */
  socket?: boolean;
}

/** Glow halo only (drawn behind the cast). */
export const BulbGlow: React.FC<BulbProps> = ({ id, x, y, r, t, on = 1, rays = 0.6, glowR }) => {
  const R = glowR ?? r * 9;
  const flick = 0.94 + noise2D(id + "fl", t * 3, 0) * 0.06;
  return (
    <g style={{ mixBlendMode: "screen" }} opacity={clamp(on * flick, 0, 1.4)}>
      <defs>
        <radialGradient id={`${id}-glow`} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={R}>
          <stop offset="0" stopColor="#fff7d6" stopOpacity={1} />
          <stop offset="0.07" stopColor="#ffe28e" stopOpacity={0.7} />
          <stop offset="0.3" stopColor="#ffb44c" stopOpacity={0.28} />
          <stop offset="1" stopColor="#ff9a3a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={R} fill={`url(#${id}-glow)`} />
      {rays > 0
        ? Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2 + t * 0.05 + rnd(`${id}ra${i}`) * 0.3;
            const w = 0.05 + rnd(`${id}rw${i}`) * 0.07;
            const L = R * (0.7 + rnd(`${id}rl${i}`) * 0.35);
            const p1: Pt = [x + Math.cos(a - w) * L, y + Math.sin(a - w) * L];
            const p2: Pt = [x + Math.cos(a + w) * L, y + Math.sin(a + w) * L];
            return <path key={i} d={`M${x},${y} L${p1[0]},${p1[1]} L${p2[0]},${p2[1]} Z`} fill="#fff1b8" opacity={rays * (0.05 + 0.04 * Math.sin(t * 0.7 + i))} />;
          })
        : null}
    </g>
  );
};

/** The bare bulb hanging from a cracked ceramic wall socket. */
export const Bulb: React.FC<BulbProps> = ({ id, x, y, r, t, on = 1, socket = true }) => {
  const hot = clamp(on);
  const flick = 0.92 + noise2D(id + "fl", t * 3, 0) * 0.08;
  const glass = `M${x - 0.38 * r},${y - 1.3 * r} L${x - 0.42 * r},${y - 0.86 * r} C${x - 1.06 * r},${y - 0.6 * r} ${x - 1.06 * r},${y + 0.95 * r} ${x},${y + 1.02 * r} C${x + 1.06 * r},${y + 0.95 * r} ${x + 1.06 * r},${y - 0.6 * r} ${x + 0.42 * r},${y - 0.86 * r} L${x + 0.38 * r},${y - 1.3 * r} Z`;
  const fil = `M${x - 0.34 * r},${y - 0.05 * r} l${0.11 * r},${-0.16 * r} l${0.11 * r},${0.16 * r} l${0.11 * r},${-0.16 * r} l${0.11 * r},${0.16 * r} l${0.11 * r},${-0.16 * r} l${0.11 * r},${0.16 * r}`;
  return (
    <g>
      {socket ? (
        <g>
          {/* bracket plate on the wall + pull chain */}
          <ellipse cx={x} cy={y - 3.1 * r} rx={0.95 * r} ry={0.32 * r} fill="#d9d0b8" stroke={INK} strokeWidth={Math.max(3, r * 0.06)} />
          <rect x={x - 0.62 * r} y={y - 3.0 * r} width={1.24 * r} height={1.25 * r} rx={0.12 * r} fill="#e9e1cb" stroke={INK} strokeWidth={Math.max(3, r * 0.06)} />
          <path d={`M${x - 0.3 * r},${y - 2.9 * r} l${0.18 * r},${0.35 * r} l${-0.1 * r},${0.3 * r} l${0.16 * r},${0.3 * r}`} stroke={INK} strokeWidth={Math.max(1.5, r * 0.025)} fill="none" />
          <rect x={x - 0.5 * r} y={y - 1.78 * r} width={1.0 * r} height={0.5 * r} fill="#b9b39e" stroke={INK} strokeWidth={Math.max(3, r * 0.05)} />
          {[0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${x - 0.38 * r},${y - 1.66 * r + i * 0.1 * r} l${0.76 * r},${0.05 * r}`} stroke="#8a846f" strokeWidth={Math.max(1.5, r * 0.03)} />
          ))}
          <path d={`M${x + 0.5 * r},${y - 2.2 * r} q${0.25 * r},${0.6 * r} ${0.1 * r},${1.6 * r}`} stroke="#9a9a8c" strokeWidth={Math.max(2, r * 0.04)} strokeDasharray={`${Math.max(3, r * 0.06)} ${Math.max(2, r * 0.04)}`} fill="none" />
          <circle cx={x + 0.6 * r} cy={y - 0.55 * r} r={Math.max(3, r * 0.07)} fill="#c9a83a" stroke={INK} strokeWidth={Math.max(1.5, r * 0.03)} />
        </g>
      ) : null}
      <defs>
        <radialGradient id={`${id}-glass`} cx="0.5" cy="0.62" r="0.62">
          <stop offset="0" stopColor="#fffdf0" />
          <stop offset="0.45" stopColor={hot > 0.2 ? "#fff1b0" : "#d8d4c4"} />
          <stop offset="1" stopColor={hot > 0.2 ? "#ffc864" : "#a9a594"} />
        </radialGradient>
      </defs>
      <path d={glass} fill={`url(#${id}-glass)`} stroke={INK} strokeWidth={Math.max(3, r * 0.06)} strokeLinejoin="round" opacity={0.97} />
      {/* filament + supports */}
      <path d={`M${x - 0.3 * r},${y - 1.1 * r} L${x - 0.34 * r},${y - 0.05 * r} M${x + 0.3 * r},${y - 1.1 * r} L${x + 0.32 * r},${y - 0.05 * r}`} stroke="#8a7a5a" strokeWidth={Math.max(1.5, r * 0.025)} />
      <path d={fil} stroke="#fff8e0" strokeWidth={Math.max(2.5, r * 0.05)} fill="none" opacity={0.6 + hot * 0.4 * flick} strokeLinejoin="round" />
      <path d={fil} stroke="#ffffff" strokeWidth={Math.max(1.2, r * 0.02)} fill="none" opacity={hot} />
      {/* fly specks on the glass + highlight */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={x + (rnd(`${id}sp${i}`) - 0.5) * 1.3 * r} cy={y + (rnd(`${id}spy${i}`) - 0.3) * 1.1 * r} r={Math.max(1, r * 0.025)} fill="#3a2a1a" opacity={0.6} />
      ))}
      <path d={`M${x - 0.62 * r},${y - 0.2 * r} q${-0.05 * r},${0.5 * r} ${0.25 * r},${0.8 * r}`} stroke="#ffffff" strokeWidth={Math.max(2, r * 0.07)} fill="none" opacity={0.65} strokeLinecap="round" />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The bug zapper                                                      */
/* ------------------------------------------------------------------ */

export interface ZapperProps {
  id: string;
  x: number;
  y: number;
  s: number;
  t: number;
  frame: number;
  /** 0..1 flash of a zap in progress */
  zap?: number;
  /** kill counter value */
  count?: number;
  /** 0..1 milestone party (the 5000th) */
  party?: number;
  /** extra kill mark painted on (0..1 fade in) */
  newMark?: number;
  chain?: boolean;
}

const ZW = 220;
const ZH = 320;

export const ZapperGlow: React.FC<{ id: string; x: number; y: number; s: number; t: number; zap?: number }> = ({ id, x, y, s, t, zap = 0 }) => {
  const R = 360 * s * (1 + zap * 1.6);
  const hum = 0.9 + Math.sin(t * 7) * 0.05 + noise2D(id + "zh", t * 2, 0) * 0.05;
  return (
    <g style={{ mixBlendMode: "screen" }} opacity={clamp(hum + zap)}>
      <defs>
        <radialGradient id={`${id}-zg`} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={R}>
          <stop offset="0" stopColor={zap > 0.3 ? "#ffffff" : "#bfeaff"} stopOpacity={0.85} />
          <stop offset="0.25" stopColor="#6fc8ff" stopOpacity={0.35} />
          <stop offset="1" stopColor="#3a7aff" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={R} fill={`url(#${id}-zg)`} />
    </g>
  );
};

export const Zapper: React.FC<ZapperProps> = ({ id, x, y, s, t, frame, zap = 0, count = 4998, party = 0, newMark = 0, chain = true }) => {
  const f2 = onN(frame, 2);
  const W = ZW;
  const H = ZH;
  const bars = 9;
  const tube = 0.82 + Math.sin(t * 9) * 0.06 + (rnd(`${id}tb${Math.floor(f2 / 4)}`) < 0.06 ? -0.25 : 0);
  const crisp = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        x: -0.52 * W + rnd(`${id}cx${i}`) * 1.04 * W,
        y: 0.4 * H - rnd(`${id}cy${i}`) * 18 - (i % 3) * 6,
        r: 7 + rnd(`${id}cr${i}`) * 7,
        a: rnd(`${id}ca${i}`) * 360,
        wing: rnd(`${id}cw${i}`) < 0.4,
      })),
    [id],
  );
  const digits = String(Math.max(0, Math.floor(count))).padStart(5, "0");
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {chain ? <path d={`M0,${-0.62 * H} L0,${-0.62 * H - 1600}`} stroke="#5a5a52" strokeWidth={7} strokeDasharray="14 7" /> : null}
      <circle cx={0} cy={-0.64 * H} r={13} fill="none" stroke="#6a6a60" strokeWidth={6} />
      {/* top cap */}
      <path d={`M${-0.62 * W},${-0.4 * H} Q${-0.6 * W},${-0.62 * H} 0,${-0.63 * H} Q${0.6 * W},${-0.62 * H} ${0.62 * W},${-0.4 * H} Z`} fill="#2f4c3d" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-0.64 * W} y={-0.42 * H} width={1.28 * W} height={0.07 * H} rx={6} fill="#1d2a24" stroke={INK} strokeWidth={5} />
      <text x={0} y={-0.365 * H} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={17} fill="#f2d23a" letterSpacing={1}>
        ZAP-O-MATIC
      </text>
      {/* kill marks: little moth silhouettes, like a fighter plane's */}
      {Array.from({ length: 11 }).map((_, i) => {
        const col = i % 6;
        const row = Math.floor(i / 6);
        const mx = -0.42 * W + col * 0.17 * W;
        const my = -0.535 * H + row * 0.06 * H;
        const isNew = i === 10;
        return (
          <g key={i} transform={`translate(${mx} ${my})`} opacity={isNew ? newMark : 1}>
            <path d="M0,-2 C-6,-9 -13,-6 -12,1 C-9,5 -4,4 0,2 C4,4 9,5 12,1 C13,-6 6,-9 0,-2 Z" fill="#e8e2cc" />
            <path d="M0,-3 L0,5" stroke="#e8e2cc" strokeWidth={2.5} />
          </g>
        );
      })}
      {/* cage + UV tubes */}
      <rect x={-0.5 * W} y={-0.35 * H} width={W} height={0.71 * H} rx={10} fill="#0d141b" stroke={INK} strokeWidth={6} />
      {[-0.19, 0.19].map((tx, i) => (
        <g key={i}>
          <rect x={tx * W - 0.11 * W} y={-0.31 * H} width={0.22 * W} height={0.63 * H} rx={0.11 * W} fill="#6fc6ff" opacity={0.35 * tube} />
          <rect x={tx * W - 0.065 * W} y={-0.3 * H} width={0.13 * W} height={0.61 * H} rx={0.065 * W} fill={zap > 0.3 ? "#ffffff" : "#c4ecff"} opacity={tube} />
          <rect x={tx * W - 0.025 * W} y={-0.28 * H} width={0.05 * W} height={0.57 * H} rx={0.025 * W} fill="#ffffff" opacity={0.75} />
        </g>
      ))}
      {Array.from({ length: bars + 1 }).map((_, i) => {
        const bx = -0.5 * W + (i / bars) * W;
        return <path key={i} d={`M${bx},${-0.35 * H} L${bx},${0.36 * H}`} stroke="#a7b1b6" strokeWidth={4} />;
      })}
      {[-0.26, -0.09, 0.09, 0.26].map((ry, i) => (
        <path key={i} d={`M${-0.5 * W},${ry * H} L${0.5 * W},${ry * H}`} stroke="#8d979c" strokeWidth={3.5} />
      ))}
      {/* a fried casualty stuck to the grid */}
      <g transform={`translate(${0.3 * W} ${0.05 * H}) rotate(28)`}>
        <ellipse rx={9} ry={5} fill="#1a120e" />
        <path d="M-4,0 l-9,-9 M0,0 l-2,-12 M4,0 l7,-9" stroke="#1a120e" strokeWidth={2} />
      </g>
      {/* tray of crispy bugs */}
      <path d={`M${-0.6 * W},${0.36 * H} L${0.6 * W},${0.36 * H} L${0.52 * W},${0.47 * H} L${-0.52 * W},${0.47 * H} Z`} fill="#2f4c3d" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {crisp.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.a})`}>
          {c.wing ? <path d={`M0,0 C${-c.r},${-c.r * 1.6} ${c.r * 0.8},${-c.r * 1.8} ${c.r * 0.6},${-c.r * 0.2} Z`} fill="#6a5a48" stroke={INK} strokeWidth={2} /> : null}
          <ellipse rx={c.r} ry={c.r * 0.55} fill="#24180f" stroke={INK} strokeWidth={2} />
          <path d={`M${-c.r * 0.5},0 l${-c.r * 0.5},${c.r * 0.8} M0,0 l0,${c.r} M${c.r * 0.5},0 l${c.r * 0.5},${c.r * 0.8}`} stroke="#24180f" strokeWidth={2} />
        </g>
      ))}
      {/* LCD kill counter */}
      <rect x={-0.34 * W} y={0.385 * H} width={0.68 * W} height={0.07 * H} rx={4} fill="#0e1a10" stroke={INK} strokeWidth={4} />
      <text x={-0.31 * W} y={0.44 * H} fontFamily="Courier New, monospace" fontWeight={700} fontSize={19} fill="#7dff7a">
        {`BUGS:${digits}`}
      </text>
      {party > 0 ? (
        <g opacity={party}>
          {Array.from({ length: 14 }).map((_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const r = 60 + party * 120 + (i % 3) * 18;
            return <rect key={i} x={Math.cos(a) * r - 4} y={0.42 * H + Math.sin(a) * r * 0.6 - 4} width={8} height={12} fill={["#ff5a7a", "#ffd23a", "#5ad2ff", "#7dff7a"][i % 4]} transform={`rotate(${i * 40 + t * 200} ${Math.cos(a) * r} ${0.42 * H + Math.sin(a) * r * 0.6})`} />;
          })}
        </g>
      ) : null}
      {/* the zap */}
      {zap > 0 ? (
        <g>
          <rect x={-0.5 * W} y={-0.35 * H} width={W} height={0.71 * H} rx={10} fill="#eaffff" opacity={zap * 0.85} />
          {Array.from({ length: 5 }).map((_, i) => {
            const pts: Pt[] = [];
            const x0 = -0.45 * W + rnd(`${id}zx${i}${f2}`) * 0.9 * W;
            for (let k = 0; k <= 6; k++) pts.push([x0 + (rnd(`${id}z${i}${k}${f2}`) - 0.5) * 60, -0.4 * H + (k / 6) * 0.8 * H]);
            return <path key={i} d={`M${pts.map((p) => p.join(",")).join(" L")}`} stroke="#ffffff" strokeWidth={5} fill="none" opacity={zap} />;
          })}
        </g>
      ) : null}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The faithful: bugs worshipping the bulb                             */
/* ------------------------------------------------------------------ */

export const Swarm: React.FC<{ cx: number; cy: number; rx: number; ry: number; t: number; n?: number; s?: number; seed?: string; beetle?: boolean; ring?: number }> = ({
  cx,
  cy,
  rx,
  ry,
  t,
  n = 9,
  s = 1,
  seed = "sw",
  beetle = true,
  ring = 0,
}) => {
  const flap = Math.floor(t * 24) % 2 === 0;
  return (
    <g>
      {ring > 0.5 ? <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#fff3c0" strokeWidth={3} strokeDasharray="10 14" opacity={0.35 * ring} /> : null}
      {Array.from({ length: n }).map((_, i) => {
        const sp = (0.6 + rnd(`${seed}sp${i}`) * 0.9) * (i % 2 ? 1 : -1);
        // "ring" pulls everyone into one tidy orbit (the cult)
        const a = t * sp * (1 - ring * 0.4) + (i / n) * Math.PI * 2 * (ring > 0.5 ? 1 : rnd(`${seed}a${i}`) * 6);
        const rr = lerp(0.55 + rnd(`${seed}r${i}`) * 0.6, 1, ring);
        const bx = cx + Math.cos(ring > 0.5 ? t * 0.9 + (i / n) * Math.PI * 2 : a) * rx * rr + noise2D(`${seed}nx${i}`, t, 0) * 14 * (1 - ring);
        const by = cy + Math.sin(ring > 0.5 ? t * 0.9 + (i / n) * Math.PI * 2 : a) * ry * rr + noise2D(`${seed}ny${i}`, 0, t) * 10 * (1 - ring);
        const kind = i % 4;
        return (
          <g key={i} transform={`translate(${bx} ${by}) scale(${s})`}>
            {kind === 0 ? (
              // little moth
              <g>
                <path d={`M0,0 C-10,${flap ? -16 : -6} -20,${flap ? -10 : 2} -16,4 Z M0,0 C10,${flap ? -16 : -6} 20,${flap ? -10 : 2} 16,4 Z`} fill="#b9a68a" stroke={INK} strokeWidth={2} />
                <ellipse rx={4} ry={8} fill="#8a7a62" stroke={INK} strokeWidth={2} />
              </g>
            ) : kind === 1 ? (
              // gnat
              <g>
                <ellipse cx={-3} cy={-4} rx={5} ry={flap ? 6 : 2.5} fill="#d8e0e8" opacity={0.7} stroke={INK} strokeWidth={1} />
                <ellipse cx={3} cy={-4} rx={5} ry={flap ? 6 : 2.5} fill="#d8e0e8" opacity={0.7} stroke={INK} strokeWidth={1} />
                <ellipse rx={4} ry={3} fill="#0d0a0a" />
              </g>
            ) : kind === 2 ? (
              // crane fly: all legs
              <g>
                <ellipse rx={3} ry={10} fill="#7a6a50" stroke={INK} strokeWidth={1.5} />
                {[-1, 1].map((sd) => [0, 1, 2].map((k) => <path key={`${sd}${k}`} d={`M0,${-3 + k * 4} q${sd * 14},${6 + k * 4} ${sd * 22},${20 + k * 6}`} stroke={INK} strokeWidth={1.4} fill="none" />))}
                <ellipse cx={-6} cy={-4} rx={9} ry={flap ? 3 : 1.5} fill="#e8eef0" opacity={0.6} />
                <ellipse cx={6} cy={-4} rx={9} ry={flap ? 3 : 1.5} fill="#e8eef0" opacity={0.6} />
              </g>
            ) : (
              <g>
                <ellipse cx={-3} cy={-4} rx={5} ry={flap ? 6 : 2.5} fill="#d8e0e8" opacity={0.7} stroke={INK} strokeWidth={1} />
                <ellipse cx={3} cy={-4} rx={5} ry={flap ? 6 : 2.5} fill="#d8e0e8" opacity={0.7} stroke={INK} strokeWidth={1} />
                <ellipse rx={3} ry={4} fill="#1a1410" />
              </g>
            )}
          </g>
        );
      })}
      {beetle ? <Beetle cx={cx} cy={cy} t={t} s={s * 1.4} seed={seed} /> : null}
    </g>
  );
};

/** A June bug head-butting the bulb over and over. */
export const Beetle: React.FC<{ cx: number; cy: number; t: number; s: number; seed: string }> = ({ cx, cy, t, s, seed }) => {
  const period = 0.9;
  const ph = (t % period) / period;
  const k = ph < 0.7 ? easeOut(ph / 0.7) : 1 - (ph - 0.7) / 0.3;
  const ang = -2.4 + Math.floor(t / period) * 0.4;
  const dist = lerp(130, 36, k) * s;
  const bx = cx + Math.cos(ang) * dist;
  const by = cy + Math.sin(ang) * dist * 0.8;
  const bonk = ph > 0.66 && ph < 0.76;
  return (
    <g transform={`translate(${bx} ${by}) rotate(${(ang * 180) / Math.PI + 180}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={16} ry={11} fill="#4a3a1e" stroke={INK} strokeWidth={2.5} />
      <path d="M-14,0 L14,0" stroke={INK} strokeWidth={1.5} />
      <ellipse cx={-6} cy={-4} rx={5} ry={2.5} fill="#a99a5a" opacity={0.7} />
      <ellipse cx={17} cy={0} rx={6} ry={6} fill="#2a2010" stroke={INK} strokeWidth={2} />
      {bonk ? <path d="M30,-14 l6,-6 M32,0 l9,0 M30,14 l6,6" stroke="#fff3b0" strokeWidth={3} strokeLinecap="round" /> : null}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The lamp world (macro): bulb, zapper, the faithful                  */
/* ------------------------------------------------------------------ */

export const LAMP = { bulb: { x: 760, y: 300, r: 120 }, zapper: { x: 1400, y: 600, s: 1.9 } };
export const CAML = {
  wide: { x: 1000, y: 480, zoom: 0.92 },
  bulb: { x: 760, y: 330, zoom: 1.9 },
  bulbTight: { x: 760, y: 300, zoom: 2.8 },
  zapper: { x: 1400, y: 560, zoom: 1.5 },
  tray: { x: 1400, y: 900, zoom: 2.4 },
  counter: { x: 1400, y: 960, zoom: 3.4 },
} satisfies Record<string, Cam>;

/** Kill count on the zapper, driven by the episode clock. */
export interface LampSceneProps {
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  wick?: Partial<MothProps> | false;
  zap?: number;
  count?: number;
  party?: number;
  newMark?: number;
  ring?: number;
  swarm?: number;
  swarmN?: number;
  rays?: number;
  shakeAmp?: number;
  /** drawn over everything in world space */
  front?: React.ReactNode;
  back?: React.ReactNode;
  overlay?: React.ReactNode;
}

const Siding: React.FC<{ x0: number; x1: number; y0: number; y1: number; col: string; seed: string; step?: number }> = ({ x0, x1, y0, y1, col, seed, step = 46 }) => {
  const lines = useMemo(() => {
    const out: React.ReactNode[] = [];
    let k = 0;
    for (let y = y0; y < y1; y += step) {
      out.push(<path key={`l${y}`} d={`M${x0},${y} L${x1},${y}`} stroke={INK} strokeWidth={3} opacity={0.55} />);
      out.push(<path key={`s${y}`} d={`M${x0},${y + 3} L${x1},${y + 3}`} stroke="#000" strokeWidth={6} opacity={0.12} />);
      // peeling paint chips
      for (let i = 0; i < 3; i++) {
        if (rnd(`${seed}p${k}${i}`) < 0.5) continue;
        const px = x0 + rnd(`${seed}px${k}${i}`) * (x1 - x0);
        out.push(<path key={`p${y}${i}`} d={blob(px, y + step * 0.5, 24 + rnd(`${seed}pr${k}${i}`) * 40, step * 0.22, 7, 0.4, `${seed}pb${k}${i}`)} fill="#8e8a7c" opacity={0.55} />);
      }
      k++;
    }
    return out;
  }, [x0, x1, y0, y1, seed, step]);
  return (
    <g>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={col} />
      {lines}
    </g>
  );
};
export { Siding };

export const LampScene: React.FC<LampSceneProps> = ({ from, to, cam, ease, wick = false, zap = 0, count = 4998, party = 0, newMark = 0, ring = 0, swarm = 1, swarmN = 12, rays = 0.7, shakeAmp = 0, front, back, overlay }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = useCam(from, to, ease, cam);
  const sw = useSpeech("wick");
  const B = LAMP.bulb;
  const Z = LAMP.zapper;
  const prints = useMemo(
    () =>
      Array.from({ length: 9 }).map((_, i) => ({
        x: B.x + (rnd(`pr${i}`) - 0.5) * 900,
        y: B.y + (rnd(`pry${i}`) - 0.4) * 600,
        s: 0.7 + rnd(`prs${i}`) * 0.7,
        a: (rnd(`pra${i}`) - 0.5) * 60,
      })),
    [B.x, B.y],
  );
  return (
    <Stage cam={c} frame={frame} shakeAmp={shakeAmp} overlay={overlay}>
      <Siding x0={-900} x1={3000} y0={-700} y1={1800} col="#3f4d43" seed="lampwall" step={58} />
      {/* warm wash on the wall around the bulb */}
      <defs>
        <radialGradient id="lampWall" gradientUnits="userSpaceOnUse" cx={B.x} cy={B.y} r={1300}>
          <stop offset="0" stopColor="#f6d28a" stopOpacity={0.75} />
          <stop offset="0.5" stopColor="#c99a52" stopOpacity={0.25} />
          <stop offset="1" stopColor="#000" stopOpacity={0.35} />
        </radialGradient>
      </defs>
      <rect x={-900} y={-700} width={3900} height={2500} fill="url(#lampWall)" />
      {/* moth-shaped dust prints where the faithful hit the wall */}
      {prints.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.a}) scale(${p.s})`} opacity={0.32}>
          <path d="M0,-6 C-30,-40 -70,-26 -64,6 C-50,26 -20,22 0,10 C20,22 50,26 64,6 C70,-26 30,-40 0,-6 Z" fill="#e9dcc0" />
          <ellipse cx={0} cy={4} rx={7} ry={22} fill="#e9dcc0" />
        </g>
      ))}
      {back}
      <ZapperGlow id="lzg" x={Z.x} y={Z.y} s={Z.s} t={t} zap={zap} />
      <BulbGlow id="lbg" x={B.x} y={B.y} r={B.r} t={t} rays={rays} glowR={B.r * 8} />
      <Zapper id="lz" x={Z.x} y={Z.y} s={Z.s} t={t} frame={frame} zap={zap} count={count} party={party} newMark={newMark} />
      <Bulb id="lb" x={B.x} y={B.y} r={B.r} t={t} />
      {swarm > 0 ? (
        <g opacity={swarm}>
          <Swarm cx={B.x} cy={B.y + 30} rx={320} ry={200} t={t} n={swarmN} s={1.5} seed="lsw" ring={ring} />
        </g>
      ) : null}
      {wick ? <Moth id="wick" kind="wick" x={600} y={900} t={t} frame={frame} {...sw} {...wick} /> : null}
      {front}
    </Stage>
  );
};

export const sparkPath = (x: number, y: number, r: number, seed: string): string => {
  const pts: Pt[] = [];
  for (let i = 0; i < 7; i++) pts.push([x + (rnd(`${seed}${i}`) - 0.5) * r * 2, y + (rnd(`${seed}y${i}`) - 0.5) * r * 2]);
  return smoothPath(pts, false);
};
