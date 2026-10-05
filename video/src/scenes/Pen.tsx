import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { INK } from "../characters/parts";
import { blob, cloudPath, onN, rnd, smoothPath } from "../engine/util";

/* Night farm pen: sky, moon, dead tree, farmhouse, the Shed of No Return, pointy fence, mud. */

export const SKY_TOP = "#100c18";
export const SKY_BOT = "#2c2236";

export const Sky: React.FC<{ t: number; moonX?: number; moonY?: number; id?: string }> = ({ t, moonX = 1610, moonY = 250, id = "sky" }) => {
  const stars = useMemo(
    () => Array.from({ length: 60 }).map((_, i) => [rnd(`${id}sx${i}`) * 2600 - 340, rnd(`${id}sy${i}`) * 560, rnd(`${id}ss${i}`)] as const),
    [id],
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKY_TOP} />
          <stop offset="1" stopColor={SKY_BOT} />
        </linearGradient>
        <radialGradient id={`${id}-moonglow`}>
          <stop offset="0" stopColor="#e9e39a" stopOpacity="0.45" />
          <stop offset="0.4" stopColor="#c9c27a" stopOpacity="0.14" />
          <stop offset="1" stopColor="#c9c27a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-400} y={-400} width={2720} height={1300} fill={`url(#${id}-g)`} />
      {stars.map(([sx, sy, ss], i) => (
        <circle key={i} cx={sx} cy={sy} r={1 + ss * 1.6} fill="#e8e2c8" opacity={0.25 + 0.5 * Math.abs(Math.sin(t * (0.5 + ss) + i))} />
      ))}
      <circle cx={moonX} cy={moonY} r={300} fill={`url(#${id}-moonglow)`} />
      <circle cx={moonX} cy={moonY} r={80} fill="#ddd68f" stroke={INK} strokeWidth={5} />
      <path d={blob(moonX - 24, moonY - 18, 16, 13, 7, 0.2, "c1")} fill="#c7bf73" />
      <path d={blob(moonX + 26, moonY + 14, 22, 18, 7, 0.2, "c2")} fill="#c7bf73" />
      <path d={blob(moonX - 10, moonY + 40, 10, 8, 6, 0.2, "c3")} fill="#c7bf73" />
      {/* drifting cloud wisps */}
      {[0, 1, 2].map((i) => {
        const cx = ((t * (14 + i * 6) + i * 900) % 2900) - 500;
        return <path key={i} d={cloudPath(cx, 150 + i * 90, 260 - i * 40, 26, 10, `${id}cl${i}`, 0.5)} fill="#1d1726" opacity={0.85} />;
      })}
    </g>
  );
};

export const Hills: React.FC = () => (
  <g>
    <path d="M-400,640 C-100,560 200,600 500,585 C800,570 1000,610 1300,590 C1600,570 1900,600 2320,560 L2320,900 L-400,900 Z" fill="#1b1622" />
    <path d="M-400,690 C0,640 400,680 800,660 C1200,640 1600,690 2320,650 L2320,900 L-400,900 Z" fill="#221b28" />
  </g>
);

export const DeadTree: React.FC<{ x: number; y: number; s?: number; t: number }> = ({ x, y, s = 1, t }) => {
  const sway = Math.sin(t * 0.8) * 1.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#120d14" stroke="#120d14" strokeLinecap="round" strokeLinejoin="round">
      <path d="M-22,0 C-18,-80 -30,-160 -10,-250 L12,-250 C4,-160 22,-80 26,0 Z" />
      <g transform={`rotate(${sway} 0 -240)`} fill="none">
        <path d="M-4,-240 C-30,-280 -90,-300 -140,-350" strokeWidth={14} />
        <path d="M-90,-300 C-110,-330 -100,-360 -120,-390" strokeWidth={8} />
        <path d="M2,-245 C30,-300 60,-330 110,-360" strokeWidth={12} />
        <path d="M60,-330 C90,-330 120,-310 150,-320" strokeWidth={7} />
        <path d="M-4,-250 C-2,-300 10,-340 -6,-400" strokeWidth={10} />
        <path d="M-140,-350 l-30,-6 M110,-360 l10,-30" strokeWidth={5} />
      </g>
      {/* crow */}
      <g transform={`translate(96 ${-372}) rotate(${sway})`} fill="#07050a" stroke="none">
        <ellipse cx={0} cy={0} rx={20} ry={13} />
        <circle cx={-16} cy={-12} r={9} />
        <path d="M-24,-12 l-14,4 l14,2 Z" fill="#3a3530" />
        <path d="M14,0 l26,-6 l-8,10 Z" />
        <circle cx={-18} cy={-14} r={2.2} fill="#d9d36a" />
      </g>
    </g>
  );
};

export const Farmhouse: React.FC<{ x: number; y: number; s?: number; t: number; figure?: number }> = ({ x, y, s = 1, t, figure = 0 }) => {
  const flick = 0.85 + Math.sin(t * 13) * 0.05 + noise2D("fh", t * 2, 0) * 0.08;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-110,0 L-110,-120 L0,-200 L110,-120 L110,0 Z" fill="#1a1419" stroke={INK} strokeWidth={4} />
      <path d="M-130,-112 L0,-214 L130,-112" fill="none" stroke="#0c080b" strokeWidth={14} strokeLinecap="round" />
      <rect x={50} y={-200} width={22} height={50} fill="#140f13" />
      <rect x={-34} y={-104} width={52} height={60} fill="#e7c25e" opacity={flick} stroke={INK} strokeWidth={4} />
      <circle cx={-8} cy={-74} r={70} fill="#e7c25e" opacity={0.08 * flick} />
      {figure > 0 ? (
        <g opacity={figure}>
          <ellipse cx={-8} cy={-92} rx={7} ry={9} fill="#050305" />
          <rect x={-14} y={-84} width={12} height={40} fill="#050305" />
        </g>
      ) : null}
      <path d="M-34,-74 L18,-74 M-8,-104 L-8,-44" stroke={INK} strokeWidth={4} />
    </g>
  );
};

/** The Shed of No Return. Origin = bottom centre. */
export const Shed: React.FC<{ x: number; y: number; s?: number; t: number; glow?: number; doorOpen?: number; bulb?: boolean }> = ({
  x,
  y,
  s = 1,
  t,
  glow = 1,
  doorOpen = 0,
  bulb = true,
}) => {
  const flicker = noise2D("bulb", t * 6, 0) > 0.55 ? 0.25 : 1;
  const pulse = (0.75 + Math.sin(t * 2.2) * 0.15) * glow;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id="shedglow">
          <stop offset="0" stopColor="#ff3a17" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ff3a17" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bulbglow">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={-60} rx={260 + doorOpen * 200} ry={120 + doorOpen * 80} fill="url(#shedglow)" opacity={pulse * (0.4 + doorOpen)} />
      {/* barn body */}
      <path d="M-150,0 L-146,-170 L-60,-250 L64,-246 L152,-166 L150,0 Z" fill="#4a1b17" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {[-110, -70, -30, 10, 50, 90, 125].map((px, i) => (
        <line key={i} x1={px} y1={-6} x2={px + (i % 2 ? 2 : -2)} y2={-210 + Math.abs(px) * 0.5} stroke="#2e0f0c" strokeWidth={4} />
      ))}
      <path d="M-170,-160 L-62,-262 L66,-258 L172,-156" fill="none" stroke="#1f0c0a" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
      {/* hay loft window */}
      <path d="M-22,-210 L22,-210 L24,-170 L-22,-172 Z" fill="#1a0806" stroke={INK} strokeWidth={4} />
      <path d="M-20,-196 L22,-188" stroke="#ff3a17" strokeWidth={3} opacity={pulse} />
      {/* doorway */}
      <path d="M-62,0 L-60,-130 L60,-132 L62,0 Z" fill="#ff3a17" opacity={0.35 + pulse * 0.4 + doorOpen * 0.4} />
      <rect x={-60} y={-130} width={120} height={130} fill="#ff5a26" opacity={doorOpen * 0.9} />
      {/* doors swing outward */}
      <g transform={`translate(-62 0) scale(${1 - doorOpen * 0.85} 1)`}>
        <path d="M0,0 L2,-130 L60,-132 L60,0 Z" fill="#3a1411" stroke={INK} strokeWidth={5} />
        <path d="M4,-4 L56,-126 M4,-126 L56,-4" stroke="#250b09" strokeWidth={5} />
      </g>
      <g transform={`translate(62 0) scale(${1 - doorOpen * 0.85} 1)`}>
        <path d="M0,0 L-2,-130 L-60,-132 L-60,0 Z" fill="#3a1411" stroke={INK} strokeWidth={5} />
        <path d="M-4,-4 L-56,-126 M-4,-126 L-56,-4" stroke="#250b09" strokeWidth={5} />
      </g>
      {/* light leaking under / between doors */}
      <rect x={-62} y={-6} width={124} height={6} fill="#ff6a2a" opacity={pulse} />
      <rect x={-2} y={-130} width={4} height={130} fill="#ff6a2a" opacity={pulse * (1 - doorOpen)} />
      {/* crude smiley sign */}
      <g transform="translate(96 -120) rotate(8)">
        <rect x={-26} y={-22} width={52} height={40} fill="#cbbf98" stroke={INK} strokeWidth={4} />
        <circle cx={-9} cy={-6} r={3.5} fill={INK} />
        <circle cx={9} cy={-6} r={3.5} fill={INK} />
        <path d="M-14,4 Q0,16 14,4" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M-6,8 L-6,22 M6,9 L6,20" stroke="#8a1010" strokeWidth={2.5} strokeLinecap="round" />
      </g>
      {/* bare bulb */}
      {bulb ? (
        <g>
          <line x1={0} y1={-152} x2={0} y2={-140} stroke={INK} strokeWidth={3} />
          <circle cx={0} cy={-142} r={60} fill="url(#bulbglow)" opacity={flicker} />
          <circle cx={0} cy={-134} r={9} fill="#ffe9a8" opacity={0.4 + flicker * 0.6} stroke={INK} strokeWidth={3} />
        </g>
      ) : null}
    </g>
  );
};

export const Fence: React.FC<{ y: number; x0?: number; x1?: number; seed?: string; h?: number; gapAt?: number[] }> = ({
  y,
  x0 = -300,
  x1 = 2220,
  seed = "fence",
  h = 120,
  gapAt = [],
}) => {
  const pickets = useMemo(() => {
    const out: Array<{ x: number; lean: number; hh: number; broken: boolean }> = [];
    for (let x = x0, i = 0; x < x1; x += 46, i++) {
      if (gapAt.some((g) => Math.abs(g - x) < 30)) continue;
      out.push({ x: x + (rnd(`${seed}px${i}`) - 0.5) * 10, lean: (rnd(`${seed}pl${i}`) - 0.5) * 9, hh: h * (0.85 + rnd(`${seed}ph${i}`) * 0.3), broken: rnd(`${seed}pb${i}`) < 0.08 });
    }
    return out;
  }, [x0, x1, seed, h, gapAt]);
  return (
    <g>
      <path d={smoothPath([[x0, y - h * 0.62], [(x0 + x1) / 2, y - h * 0.66], [x1, y - h * 0.6]], false)} stroke="#3d3129" strokeWidth={16} fill="none" />
      <path d={smoothPath([[x0, y - h * 0.25], [(x0 + x1) / 2, y - h * 0.22], [x1, y - h * 0.27]], false)} stroke="#3d3129" strokeWidth={16} fill="none" />
      {pickets.map((p, i) => {
        const top = p.broken ? -p.hh * 0.55 : -p.hh;
        const d = p.broken
          ? `M-11,0 L-11,${top} L-3,${top - 10} L3,${top + 4} L11,${top - 6} L11,0 Z`
          : `M-11,0 L-11,${top} L0,${top - 26} L11,${top} L11,0 Z`;
        return (
          <path key={i} d={d} transform={`translate(${p.x} ${y}) rotate(${p.lean})`} fill="#4d3e33" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        );
      })}
    </g>
  );
};

export const Mud: React.FC<{ y: number; t: number; seed?: string }> = ({ y, t, seed = "mud" }) => {
  const bits = useMemo(() => {
    const blobs = Array.from({ length: 16 }).map((_, i) => ({
      x: rnd(`${seed}bx${i}`) * 2500 - 300,
      y: y + 30 + rnd(`${seed}by${i}`) * 300,
      rx: 40 + rnd(`${seed}br${i}`) * 120,
    }));
    const straw = Array.from({ length: 40 }).map((_, i) => ({
      x: rnd(`${seed}sx${i}`) * 2500 - 300,
      y: y + 20 + rnd(`${seed}sy${i}`) * 320,
      a: rnd(`${seed}sa${i}`) * 180,
      l: 14 + rnd(`${seed}sl${i}`) * 26,
    }));
    const prints = Array.from({ length: 14 }).map((_, i) => ({ x: rnd(`${seed}hx${i}`) * 2200 - 150, y: y + 60 + rnd(`${seed}hy${i}`) * 260 }));
    return { blobs, straw, prints };
  }, [y, seed]);
  return (
    <g>
      <path d={`M-400,${y} C200,${y - 18} 900,${y + 14} 1500,${y - 10} C1900,${y - 20} 2200,${y} 2400,${y} L2400,1500 L-400,1500 Z`} fill="#2a1e16" stroke={INK} strokeWidth={5} />
      {bits.blobs.map((b, i) => (
        <path key={i} d={blob(b.x, b.y, b.rx, b.rx * 0.22, 9, 0.25, `${seed}b${i}`)} fill={i % 3 === 0 ? "#3a3550" : "#21170f"} opacity={i % 3 === 0 ? 0.7 : 0.9} />
      ))}
      {bits.blobs
        .filter((_, i) => i % 3 === 0)
        .map((b, i) => (
          <path key={i} d={`M${b.x - b.rx * 0.5},${b.y - 2} q${b.rx * 0.3},-4 ${b.rx * 0.6},0`} stroke="#8d88a8" strokeWidth={3} fill="none" opacity={0.4 + 0.3 * Math.sin(t * 2 + i)} />
        ))}
      {bits.prints.map((p, i) => (
        <g key={i} fill="#1a120c">
          <ellipse cx={p.x} cy={p.y} rx={6} ry={4} />
          <ellipse cx={p.x + 13} cy={p.y} rx={6} ry={4} />
        </g>
      ))}
      {bits.straw.map((s, i) => (
        <line
          key={i}
          x1={s.x}
          y1={s.y}
          x2={s.x + Math.cos((s.a * Math.PI) / 180) * s.l}
          y2={s.y + Math.sin((s.a * Math.PI) / 180) * s.l * 0.3}
          stroke="#8f7a3e"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.75}
        />
      ))}
    </g>
  );
};

/** Low drifting fog banks (cheap radial gradients instead of blur). */
export const Fog: React.FC<{ t: number; y: number; opacity?: number; id?: string }> = ({ t, y, opacity = 1, id = "fog" }) => (
  <g opacity={opacity}>
    <defs>
      <radialGradient id={`${id}-g`}>
        <stop offset="0" stopColor="#a7a3bd" stopOpacity="0.22" />
        <stop offset="1" stopColor="#a7a3bd" stopOpacity="0" />
      </radialGradient>
    </defs>
    {Array.from({ length: 7 }).map((_, i) => {
      const speed = 10 + (i % 3) * 7;
      const x = ((t * speed + i * 420) % 2900) - 500;
      return <ellipse key={i} cx={x} cy={y + (i % 3) * 40} rx={420} ry={70} fill={`url(#${id}-g)`} />;
    })}
  </g>
);

export const Trough: React.FC<{ x: number; y: number; s?: number; oats?: number; id?: string }> = ({ x, y, s = 1, oats = 1, id = "trough" }) => {
  const grains = useMemo(
    () =>
      Array.from({ length: 34 }).map((_, i) => {
        const gx = (rnd(`${id}gx${i}`) - 0.5) * 210;
        const gy = -60 - rnd(`${id}gy${i}`) * 40 * (1 - Math.abs(gx) / 140);
        return [gx, gy, rnd(`${id}gr${i}`) * 180] as const;
      }),
    [id],
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={150} ry={20} fill="#000" opacity={0.4} />
      <path d="M-130,-8 L-120,0 L-112,-8 M110,-8 L120,0 L130,-8" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      {oats > 0 ? <path d={blob(0, -58, 112 * oats, 34 * oats, 12, 0.12, id + "pile")} fill="#c9ab6b" stroke={INK} strokeWidth={4} /> : null}
      {oats > 0
        ? grains.slice(0, Math.round(grains.length * oats)).map(([gx, gy, r], i) => (
            <ellipse key={i} cx={gx * oats} cy={gy * 0.8 + 6} rx={6} ry={3.2} fill="#e3cc95" stroke="#6b5530" strokeWidth={1.2} transform={`rotate(${r} ${gx * oats} ${gy * 0.8 + 6})`} />
          ))
        : null}
      <path d="M-140,-62 L140,-62 L124,-6 L-124,-6 Z" fill="#5b4330" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M-132,-40 L132,-40" stroke="#3e2d20" strokeWidth={4} />
      <path d="M-60,-62 L-58,-6 M50,-62 L52,-6" stroke="#3e2d20" strokeWidth={3} />
    </g>
  );
};

/** Full pen backdrop (everything behind the characters). */
export const PenBackdrop: React.FC<{ t: number; frame: number; shedGlow?: number; doorOpen?: number; windowFigure?: number }> = ({
  t,
  frame,
  shedGlow = 1,
  doorOpen = 0,
  windowFigure = 0,
}) => {
  const tt = onN(frame, 2) / 24;
  return (
    <g>
      <Sky t={tt} />
      <Hills />
      <DeadTree x={1760} y={700} s={1.1} t={tt} />
      <Farmhouse x={210} y={640} s={0.9} t={tt} figure={windowFigure} />
      <Shed x={960} y={694} s={1.05} t={tt} glow={shedGlow} doorOpen={doorOpen} />
      <Fog t={tt} y={660} id="fogback" />
      <Fence y={800} seed="penfence" />
      <Mud y={790} t={tt} />
    </g>
  );
};

