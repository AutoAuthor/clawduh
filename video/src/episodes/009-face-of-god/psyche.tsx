import React, { useMemo } from "react";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage } from "../../engine/Stage";
import { Pt, clamp, rnd, smoothPath } from "../../engine/util";
import { Tint, sparkle } from "./bits";
import { GalaxyEye } from "./cast/FaceOfGod";
import { Glim, GlimProps } from "./cast/Glim";

/* EPISODE 009 set 2: THE TRIP — the psychedelic set pieces (intro + the long musical gap).
 * Built from cheap shapes: projected star streaks, expanding rings, <use> kaleidoscope copies, rotating polygons,
 * and a per-frame hue cycle (Tint). Dark palettes so the colour cycling stays unsettling, not cheerful. */

const CX = 960;
const CY = 540;

/** Stars streaming out of a vanishing point (projected z). */
export const StarTunnel: React.FC<{ cx?: number; cy?: number; t: number; speed?: number; n?: number; R?: number; seed?: string; colors?: string[]; opacity?: number }> = ({
  cx = CX,
  cy = CY,
  t,
  speed = 0.35,
  n = 190,
  R = 1300,
  seed = "tun",
  colors = ["#bfe8ff", "#ff9ad8", "#c8ff9a", "#fff2c8"],
  opacity = 1,
}) => {
  const stars = useMemo(() => Array.from({ length: n }).map((_, i) => ({ a: rnd(`${seed}a${i}`) * Math.PI * 2, b: 0.25 + rnd(`${seed}b${i}`) * 0.75, p: rnd(`${seed}p${i}`), c: colors[i % colors.length] })), [n, seed, colors]);
  return (
    <g opacity={opacity}>
      {stars.map((s, i) => {
        const z = (((s.p - t * speed) % 1) + 1) % 1;
        const zz = 0.04 + z;
        const r1 = (s.b * R * 0.13) / zz;
        const r0 = (s.b * R * 0.13) / (zz + 0.05 + speed * 0.06);
        if (r0 > R * 1.6) return null;
        const ca = Math.cos(s.a);
        const sa = Math.sin(s.a);
        return (
          <path
            key={i}
            d={`M${cx + ca * r0},${cy + sa * r0} L${cx + ca * Math.min(r1, R * 1.8)},${cy + sa * Math.min(r1, R * 1.8)}`}
            stroke={s.c}
            strokeWidth={1 + (1 - z) * 6}
            strokeLinecap="round"
            opacity={clamp((1 - z) * 1.6) * 0.9}
          />
        );
      })}
    </g>
  );
};

/** Concentric rings breathing outward. */
export const PulseRings: React.FC<{ cx?: number; cy?: number; t: number; n?: number; speed?: number; rMax?: number; colors?: string[]; squash?: number; width?: number; opacity?: number }> = ({
  cx = CX,
  cy = CY,
  t,
  n = 7,
  speed = 0.22,
  rMax = 1400,
  colors = ["#5a2aa0", "#1f8a8a", "#a02a6a"],
  squash = 1,
  width = 1,
  opacity = 1,
}) => (
  <g opacity={opacity}>
    {Array.from({ length: n }).map((_, i) => {
      const k = (t * speed + i / n) % 1;
      const r = rMax * k * k;
      return <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * squash} fill="none" stroke={colors[i % colors.length]} strokeWidth={(6 + k * 90) * width} opacity={(1 - k) * 0.85} />;
    })}
  </g>
);

/** n rotated (optionally mirrored) copies of one petal drawn around (cx,cy). Petal coords: centre at 0,0. */
export const Kaleido: React.FC<{ id: string; cx?: number; cy?: number; n: number; rot: number; mirror?: boolean; scale?: number; children: React.ReactNode }> = ({ id, cx = CX, cy = CY, n, rot, mirror = true, scale = 1, children }) => (
  <g>
    <defs>
      <g id={id}>{children}</g>
    </defs>
    {Array.from({ length: n }).map((_, i) => (
      <use key={i} href={`#${id}`} transform={`translate(${cx} ${cy}) rotate(${rot + (i * 360) / n}) scale(${scale} ${mirror && i % 2 ? -scale : scale})`} />
    ))}
  </g>
);

/** Rotating polygon rings (background mandala). */
export const Mandala: React.FC<{ cx?: number; cy?: number; t: number; rings?: number; colors?: string[]; opacity?: number }> = ({ cx = CX, cy = CY, t, rings = 9, colors = ["#2a1450", "#0f3a44", "#3a0f30"], opacity = 1 }) => (
  <g opacity={opacity}>
    {Array.from({ length: rings }).map((_, i) => {
      const k = 6 + (i % 3) * 2;
      const r = 120 + i * 130;
      const pts: Pt[] = Array.from({ length: k }).map((_, j) => {
        const a = (j / k) * Math.PI * 2;
        const rr = j % 2 ? r * 0.82 : r;
        return [Math.cos(a) * rr, Math.sin(a) * rr];
      });
      return (
        <g key={i} transform={`translate(${cx} ${cy}) rotate(${(i % 2 ? -1 : 1) * t * (8 + i * 3)})`}>
          <path d={`M${pts.map((p) => p.join(",")).join(" L")} Z`} fill="none" stroke={colors[i % colors.length]} strokeWidth={36 + i * 6} opacity={0.85} strokeLinejoin="round" />
          <path d={`M${pts.map((p) => p.join(",")).join(" L")} Z`} fill="none" stroke="#000" strokeWidth={4} opacity={0.5} strokeLinejoin="round" />
        </g>
      );
    })}
  </g>
);

/** A petal: a galaxy eye on a stalk of tendrils, with a row of teeth along the stalk. */
export const EyePetal: React.FC<{ id: string; t: number; r?: number; dist?: number; open?: number }> = ({ id, t, r = 70, dist = 330, open = 1 }) => (
  <g>
    {[-1, 1].map((sd) => (
      <path key={sd} d={`M40,0 C${dist * 0.4},${sd * 70} ${dist * 0.6},${-sd * 50} ${dist - r},${sd * 8}`} fill="none" stroke="#6a1f5a" strokeWidth={14} strokeLinecap="round" />
    ))}
    {Array.from({ length: 6 }).map((_, i) => (
      <path key={i} d={`M${90 + i * 32},-8 l10,-22 l10,22 Z`} fill="#dccb72" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    ))}
    <GalaxyEye id={id} cx={dist} cy={0} r={r} t={t} open={open} ball pupil={0.22} lid="#2a0f2a" />
  </g>
);

/** A long three-fingered hand reaching inward from the edge (petal): forearm, knuckly palm, jointed fingers, claws. */
export const HandPetal: React.FC<{ reach?: number; curl?: number }> = ({ reach = 1, curl = 0 }) => {
  const r0 = 820; // forearm comes in from off-frame
  const wrist: Pt = [r0 - 420 * reach, 0];
  const SK = "#5b4f8d";
  return (
    <g>
      <path d={`M${r0 + 200},-34 L${wrist[0] + 30},-26 L${wrist[0] + 30},26 L${r0 + 200},34 Z`} fill={SK} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d={`M${r0},-20 q-80,10 -160,0`} fill="none" stroke="#3b3167" strokeWidth={5} />
      <ellipse cx={wrist[0]} cy={0} rx={46} ry={40} fill={SK} stroke={INK} strokeWidth={7} />
      {[-0.55, 0, 0.55].map((a, i) => {
        const l = (i === 1 ? 190 : 160) * reach;
        const base: Pt = [wrist[0] - Math.cos(a) * 34, Math.sin(a) * 34];
        const k1: Pt = [base[0] - Math.cos(a) * l * 0.5, base[1] + Math.sin(a) * l * 0.5];
        const ca = a + (i - 1) * 0.15 + curl * (i === 1 ? 0.9 : 0.7) * (i === 2 ? -1 : 1);
        const tip: Pt = [k1[0] - Math.cos(ca) * l * 0.5, k1[1] + Math.sin(ca) * l * 0.5];
        const d = smoothPath([base, k1, tip], false, 0.5);
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={INK} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke={SK} strokeWidth={21} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M${k1[0] - 8},${k1[1] - 9} q8,6 16,0`} fill="none" stroke="#3b3167" strokeWidth={4} />
            <path d={`M${tip[0]},${tip[1]} l${-Math.cos(ca) * 26},${Math.sin(ca) * 26}`} stroke="#e8e0c8" strokeWidth={9} strokeLinecap="round" />
            <circle cx={tip[0]} cy={tip[1]} r={8} fill="#a9e6ff" />
          </g>
        );
      })}
    </g>
  );
};

/** Things sucked down a spiral drain toward the centre. */
export const Vortex: React.FC<{ cx?: number; cy?: number; t: number; n?: number; R?: number; speed?: number; kind: "eye" | "tooth"; arms?: number }> = ({ cx = CX, cy = CY, t, n = 30, R = 1100, speed = 0.12, kind, arms = 3 }) => (
  <g>
    {Array.from({ length: n }).map((_, j) => {
      const arm = j % arms;
      const u = (j / n + t * speed) % 1;
      const r = R * Math.exp(-u * 3.2);
      const th = (arm / arms) * Math.PI * 2 + u * 7 + t * 0.4;
      const x = cx + Math.cos(th) * r;
      const y = cy + Math.sin(th) * r * 0.8;
      const sz = Math.max(4, r * 0.14);
      if (kind === "tooth") {
        return <path key={j} d={`M${-sz * 0.5},${-sz} L${sz * 0.5},${-sz} L${sz * 0.35},${sz} Q0,${sz * 1.3} ${-sz * 0.35},${sz} Z`} transform={`translate(${x} ${y}) rotate(${(th * 180) / Math.PI + 90})`} fill={j % 4 ? "#dccb72" : "#c9b56e"} stroke={INK} strokeWidth={Math.max(1.5, sz * 0.08)} />;
      }
      return (
        <g key={j} transform={`translate(${x} ${y})`}>
          <ellipse rx={sz} ry={sz * 0.55} fill="#e9e0c8" stroke={INK} strokeWidth={Math.max(1.5, sz * 0.08)} />
          <circle r={sz * 0.4} fill={["#3fc7c9", "#a02a6a", "#5a2aa0"][j % 3]} />
          <circle r={sz * 0.16} fill="#000" />
        </g>
      );
    })}
  </g>
);

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

export interface TripSceneProps {
  cam?: Cam;
  /** degrees of hue rotation (Tint) */
  hue?: number;
  sat?: number;
  bright?: number;
  /** background colour */
  bg?: string;
  glim?: Partial<GlimProps> | false;
  children?: React.ReactNode;
  front?: React.ReactNode;
  shakeAmp?: number;
}

/** Dark void + whatever psychedelic layers the shot passes in. */
export const TripScene: React.FC<TripSceneProps> = ({ cam = { x: CX, y: CY, zoom: 1 }, hue = 0, sat = 1.25, bright = 1, bg = "#05030c", glim = false, children, front, shakeAmp = 0 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  return (
    <Tint hue={hue} sat={sat} bright={bright} contrast={1.08}>
      <Stage cam={cam} frame={frame} shakeAmp={shakeAmp} boil={2.4}>
        <defs>
          <radialGradient id="tripBg" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={1500}>
            <stop offset="0" stopColor="#1a0b2e" />
            <stop offset="0.55" stopColor={bg} />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
        </defs>
        <rect x={-3000} y={-3000} width={7920} height={7080} fill="url(#tripBg)" />
        {children}
        {glim ? <Glim id="glimTrip" x={CX} y={CY + 150} scale={0.6} pose="float" t={t} frame={frame} mouth="X" expr="terror" {...glim} /> : null}
        {front}
      </Stage>
    </Tint>
  );
};

/** Glowing pinprick that grows into a flare. */
export const Pinprick: React.FC<{ cx?: number; cy?: number; k: number; t: number }> = ({ cx = CX, cy = CY, k, t }) => (
  <g>
    <circle cx={cx} cy={cy} r={20 + k * 260} fill="#7ff2ff" opacity={0.08 + k * 0.12} />
    <circle cx={cx} cy={cy} r={6 + k * 70} fill="#d8f8ff" opacity={0.25 + k * 0.3} />
    <path d={sparkle(30 + k * 300, 0.06)} transform={`translate(${cx} ${cy}) rotate(${t * 20})`} fill="#ffffff" opacity={0.5 + k * 0.4} />
    <circle cx={cx} cy={cy} r={3 + k * 12} fill="#ffffff" />
  </g>
);
