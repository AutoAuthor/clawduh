import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage } from "../../engine/Stage";
import { Pt, clamp, cloudPath, easeOut, lerp, onN, prog, rnd } from "../../engine/util";
import { MothHusk } from "./cast/Husk";
import { MOTH_HEAD, Moth } from "./cast/Moth";
import { useCam, useSpeech } from "./common";
import { Bulb, BulbGlow, Swarm } from "./lamp";

/* EPISODE 008 cutaways: Wick's imagined apotheosis ("as it is") and its correction; the title card. */

const PED = { x: 960, top: 760 };
const HEADC: Pt = [PED.x + MOTH_HEAD.wick[0], PED.top + MOTH_HEAD.wick[1] - 50];

/** "It would not make you as it is" -> Wick on a pedestal with a light bulb for a head, adored. crack/shatter 0..1. */
export const Apotheosis: React.FC<{ from: Cam; to?: Cam; crack?: number; shatter?: number; ruin?: boolean; shakeAmp?: number }> = ({ from, to, crack = 0, shatter = 0, ruin = false, shakeAmp = 0 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = useCam(from, to, easeOut);
  const sw = useSpeech("wick");
  const clouds = useMemo(() => Array.from({ length: 9 }).map((_, i) => ({ x: -300 + i * 330, y: 1000 + (i % 2) * 50, d: cloudPath(0, 0, 260, 90, 10, `apc${i}`, 0.9) })), []);
  const shards = useMemo(() => Array.from({ length: 14 }).map((_, i) => ({ a: (i / 14) * Math.PI * 2 + rnd(`sh${i}`) * 0.4, v: 600 + rnd(`shv${i}`) * 900, r: rnd(`shr${i}`) * 360 })), []);
  return (
    <Stage cam={c} frame={frame} shakeAmp={shakeAmp}>
      <defs>
        <radialGradient id="heavenBg" gradientUnits="userSpaceOnUse" cx={HEADC[0]} cy={HEADC[1]} r={1500}>
          <stop offset="0" stopColor={ruin ? "#3a1a10" : "#fff8dc"} />
          <stop offset="0.45" stopColor={ruin ? "#1a0c08" : "#f2c86a"} />
          <stop offset="1" stopColor={ruin ? "#070404" : "#a8682a"} />
        </radialGradient>
      </defs>
      <rect x={-1500} y={-1200} width={5000} height={3600} fill="url(#heavenBg)" />
      {!ruin
        ? Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2 + t * 0.15;
            const L = 2200;
            return <path key={i} d={`M${HEADC[0]},${HEADC[1]} L${HEADC[0] + Math.cos(a - 0.07) * L},${HEADC[1] + Math.sin(a - 0.07) * L} L${HEADC[0] + Math.cos(a + 0.07) * L},${HEADC[1] + Math.sin(a + 0.07) * L} Z`} fill="#fffbe6" opacity={0.18} />;
          })
        : null}
      {clouds.map((cl, i) => (
        <path key={i} d={cl.d} transform={`translate(${cl.x + Math.sin(t * 0.4 + i) * 20} ${cl.y})`} fill={ruin ? "#2a2220" : "#fffaf0"} stroke={INK} strokeWidth={5} />
      ))}
      {/* the pedestal */}
      <path d={`M${PED.x - 150},1200 L${PED.x - 120},${PED.top + 40} L${PED.x + 120},${PED.top + 40} L${PED.x + 150},1200 Z`} fill={ruin ? "#4a4440" : "#efe8da"} stroke={INK} strokeWidth={7} />
      {[-80, -40, 0, 40, 80].map((dx) => (
        <path key={dx} d={`M${PED.x + dx},${PED.top + 60} L${PED.x + dx * 1.15},1200`} stroke={ruin ? "#3a3430" : "#cfc6b4"} strokeWidth={6} />
      ))}
      <rect x={PED.x - 170} y={PED.top} width={340} height={44} rx={6} fill={ruin ? "#55504a" : "#f6f0e2"} stroke={INK} strokeWidth={7} />
      {/* worshippers, bowing on the clouds */}
      {!ruin
        ? [-620, -460, 460, 620, -300, 300].map((dx, i) => {
            const bow = Math.max(0, Math.sin(t * 3 + i)) * 18;
            return (
              <g key={i} transform={`translate(${PED.x + dx} ${960 + (i % 2) * 24}) rotate(${(dx < 0 ? 1 : -1) * (20 + bow)})`}>
                <path d="M0,-20 C-30,-60 -60,-40 -50,-6 Z M0,-20 C30,-60 60,-40 50,-6 Z" fill="#b9a68a" stroke={INK} strokeWidth={3} />
                <ellipse cx={0} cy={-14} rx={12} ry={22} fill="#8a7a62" stroke={INK} strokeWidth={3} />
                <circle cx={dx < 0 ? 10 : -10} cy={-38} r={11} fill="#8a7a62" stroke={INK} strokeWidth={3} />
              </g>
            );
          })
        : null}
      {!ruin ? <Swarm cx={HEADC[0]} cy={HEADC[1]} rx={260} ry={110} t={t} n={10} s={1.2} seed="apsw" ring={1} beetle={false} /> : null}
      {ruin ? (
        <MothHusk x={PED.x + 10} y={PED.top - 40} s={1.6} rot={8} t={t} smoke={1} ember={0.8} />
      ) : (
        <g>
          <Moth id="wickGod" kind="wick" x={PED.x} y={PED.top} t={t} frame={frame} {...sw} headless wings={1} expr="ecstatic" armF={[150, 30]} armB={[140, 30]} dust={6} />
          <BulbGlow id="headglow" x={HEADC[0]} y={HEADC[1]} r={95} t={t} glowR={1000} rays={0.8} on={1 - shatter} />
          {shatter < 0.15 ? (
            <g transform={`rotate(180 ${HEADC[0]} ${HEADC[1]})`}>
              <Bulb id="headbulb" x={HEADC[0]} y={HEADC[1]} r={95} t={t} socket={false} on={1 - crack * 0.4} />
            </g>
          ) : null}
          {crack > 0 && shatter < 0.15 ? (
            <g stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" opacity={clamp(crack * 2)}>
              <path d={`M${HEADC[0] - 10},${HEADC[1] - 70} l14,30 l-18,22 l20,26 l-8,30`} strokeDasharray={`${crack * 140} 400`} />
              <path d={`M${HEADC[0] + 30},${HEADC[1] - 50} l-16,24 l22,18`} strokeDasharray={`${clamp(crack * 2 - 0.6) * 90} 300`} />
              <path d={`M${HEADC[0] - 50},${HEADC[1] - 10} l26,8 l12,-16`} strokeDasharray={`${clamp(crack * 2 - 1) * 90} 300`} />
            </g>
          ) : null}
          {/* halo */}
          <ellipse cx={HEADC[0]} cy={HEADC[1] - 120} rx={90} ry={20} fill="none" stroke="#fff6b0" strokeWidth={10} opacity={0.9 * (1 - shatter)} />
          {shatter > 0
            ? shards.map((s, i) => {
                const k = easeOut(clamp(shatter));
                const p: Pt = [HEADC[0] + Math.cos(s.a) * s.v * k, HEADC[1] + Math.sin(s.a) * s.v * k + 300 * k * k];
                return <path key={i} d="M0,-22 L16,10 L-12,14 Z" transform={`translate(${p[0]} ${p[1]}) rotate(${s.r * k})`} fill="#fff6d0" stroke={INK} strokeWidth={3} opacity={1 - clamp(shatter - 0.6) * 2.5} />;
              })
            : null}
          {shatter > 0 && shatter < 0.5 ? <circle cx={HEADC[0]} cy={HEADC[1]} r={140 + shatter * 900} fill="#ffffff" opacity={(0.5 - shatter) * 1.6} /> : null}
        </g>
      )}
    </Stage>
  );
};

/** Title card (no credits). The little moth goes for the bulb. */
export const TitleCard: React.FC = () => {
  const { shot } = useEpisode();
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const { local, frame } = shot;
  const o = easeOut(prog(local, 0.05, 0.5));
  const jit = (s: string) => (rnd(`${s}${onN(frame, 3)}`) - 0.5) * 4;
  const k = prog(local, 0.35, 1.25);
  const ang = k * Math.PI * 3.2;
  const rr = lerp(90, 0, k);
  const zap = local > 1.25 && local < 1.45;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#070506", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: o, padding: portrait ? "0 70px" : 0, textAlign: "center" }}>
      <svg width={260} height={260} viewBox="-130 -130 260 260" style={{ marginBottom: 26 }}>
        <circle r={120} fill={zap ? "#dff6ff" : "#ffcf6a"} opacity={zap ? 0.6 : 0.14} />
        <path d="M-14,-58 L-16,-30 C-48,-20 -48,40 0,44 C48,40 48,-20 16,-30 L14,-58 Z" fill={zap ? "#ffffff" : "#fff1b0"} stroke={INK} strokeWidth={5} />
        <rect x={-18} y={-80} width={36} height={24} fill="#b9b39e" stroke={INK} strokeWidth={5} />
        <path d="M-12,4 l6,-8 l6,8 l6,-8 l6,8" stroke="#fffbe8" strokeWidth={4} fill="none" />
        {local < 1.25 ? (
          <g transform={`translate(${Math.cos(ang) * rr} ${Math.sin(ang) * rr * 0.6}) rotate(${Math.sin(local * 30) * 10})`}>
            <path d="M0,0 C-10,-14 -22,-8 -18,4 Z M0,0 C10,-14 22,-8 18,4 Z" fill="#e8d4a8" stroke={INK} strokeWidth={2} />
            <ellipse rx={4} ry={8} fill="#c9a67c" stroke={INK} strokeWidth={2} />
          </g>
        ) : (
          <path d="M-6,-6 q-6,-16 0,-30 q6,-14 0,-28" stroke="#9a948c" strokeWidth={5} fill="none" opacity={0.7} />
        )}
      </svg>
      <div style={{ fontFamily: "Creepster", fontSize: portrait ? 112 : 124, lineHeight: 1.04, color: "#e9d98a", letterSpacing: 4, transform: `translate(${jit("a")}px, ${jit("b")}px) rotate(-1.5deg)`, textShadow: "0 0 34px rgba(255,190,80,0.45)" }}>
        BROTHER, I CRAVE
        <br />
        THE FORBIDDEN LAMP
      </div>
    </div>
  );
};

export const Black: React.FC = () => <div style={{ position: "absolute", inset: 0, background: "#000" }} />;
