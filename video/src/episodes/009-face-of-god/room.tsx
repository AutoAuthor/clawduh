import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage, camLerp } from "../../engine/Stage";
import { Pt, blob, clamp, cloudPath, easeInOut, rnd, smoothPath } from "../../engine/util";
import { Starfield, Tint, sparkle } from "./bits";
import { GalaxyEye } from "./cast/FaceOfGod";
import { Glim, GlimProps, glimHeadWorld, glimThirdEye } from "./cast/Glim";
import { Cord, Rachel, RachelProps, rachelHead, rachelTail } from "./cast/Rachel";
import { SpaceDog } from "./cast/SpaceDog";
import { useSpeech } from "./speech";

/* EPISODE 009 set 3: THE ROOM — Glim's one-room shack on a rock among the stars. Night. A narrow iron bed, an open
 * sash window onto open space, curtains that won't stay still, a telescope in chains, a skylight boarded shut with
 * NO on it, wallpaper with little eyes in it, a clock with no hands. One world, many cameras. */

export const GLIM_BED = { x: 430, y: 724 };
/** Rachel crouches on the blanket over his knees, facing him (flipped), tethered to his forehead. */
export const RACHEL_POS = { x: 760, y: 548, scale: 0.82 };
export const WIN = { x0: 1312, y0: 252, x1: 1668, y1: 668 };
export const WIN_C: Pt = [(WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2];

const GH = glimHeadWorld(GLIM_BED.x, GLIM_BED.y, 1, false, 8);
const RH = rachelHead(RACHEL_POS.x, RACHEL_POS.y, RACHEL_POS.scale, true);
export const HEADS9 = { glim: { x: GH[0], y: GH[1] }, rachel: { x: RH[0], y: RH[1] } };

export const RCAM = {
  wide: { x: 960, y: 540, zoom: 1 },
  wideIn: { x: 900, y: 520, zoom: 1.12 },
  two: { x: 560, y: 380, zoom: 1.65 },
  cuGlim: { x: GH[0] + 30, y: GH[1] + 30, zoom: 2.6 },
  ecuGlim: { x: GH[0] + 30, y: GH[1] + 10, zoom: 4.0 },
  cuRachel: { x: RH[0] - 30, y: RH[1] + 40, zoom: 2.6 },
  window: { x: WIN_C[0], y: WIN_C[1], zoom: 2.0 },
  windowWide: { x: 1330, y: 470, zoom: 1.35 },
  ceiling: { x: 640, y: 60, zoom: 2.2 },
} satisfies Record<string, Cam>;

export interface RoomState {
  /** 0..1 how dark the room is */
  dark: number;
  /** 0..1 wind through the gap: curtains + dust */
  wind: number;
  /** 0..1 lower sash raised (open gap at the bottom) */
  sash: number;
  /** 0..1 fog on the glass */
  fog: number;
  /** breath patches on the glass: [x, y, opacity] */
  breaths: Array<[number, number, number]>;
  /** 0..1 long fingers curling around the outside of the frame */
  hand: number;
  /** 0..1 a pale shape sliding past outside */
  shadow: number;
  shadowX: number;
  /** 0..1 the eye in the window */
  eye: number;
  eyeX: number;
  eyeY: number;
  eyePupil: number;
  eyeOpen: number;
  /** 0..1 bedside lamp */
  lamp: number;
  /** 0..1 dogs on the passing rock outside */
  dogs: number;
  /** 0..1 light leaking through the boarded skylight */
  skylight: number;
  /** 0..1 curtains drawn shut */
  shut: number;
}

export const DEFAULT_ROOM: RoomState = {
  dark: 0.55,
  wind: 0.25,
  sash: 0.55,
  fog: 0.1,
  breaths: [],
  hand: 0,
  shadow: 0,
  shadowX: 1500,
  eye: 0,
  eyeX: 1490,
  eyeY: 470,
  eyePupil: 0.2,
  eyeOpen: 1,
  lamp: 0,
  dogs: 0,
  skylight: 0,
  shut: 0,
};

/* ------------------------------------------------------------------ */
/* Room shell                                                          */
/* ------------------------------------------------------------------ */

const Shell: React.FC<{ st: RoomState; t: number }> = ({ st, t }) => {
  const paper = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 22; c++) {
        const x = 150 + c * 78 + (r % 2 ? 39 : 0);
        const y = 130 + r * 62;
        if (x > 1790 || y > 620) continue;
        const eye = (r + c) % 5 === 0;
        out.push(
          eye ? (
            <g key={`${r}-${c}`} transform={`translate(${x} ${y})`}>
              <path d="M-12,0 Q0,-9 12,0 Q0,9 -12,0 Z" fill="none" stroke="#3a4a58" strokeWidth={2.5} />
              <circle r={3} fill="#3a4a58" />
            </g>
          ) : (
            <path key={`${r}-${c}`} d={`M${x - 6},${y - 7} a8,8 0 1 0 6,13 a6,6 0 1 1 -6,-13 Z`} fill="#2f3c4a" />
          ),
        );
      }
    }
    return out;
  }, []);
  const planks = useMemo(() => {
    const out: React.ReactNode[] = [];
    let yy = 870;
    let h = 26;
    while (yy < 1500) {
      out.push(<path key={`h${yy}`} d={`M-600,${yy} L2600,${yy}`} stroke="#140d0a" strokeWidth={4} />);
      yy += h;
      h *= 1.25;
    }
    for (let k = -10; k <= 30; k++) {
      const x0 = 120 + k * 84;
      const x1 = 960 + (x0 - 960) * 2.4;
      out.push(<path key={`v${k}`} d={`M${x0},860 L${x1},1500`} stroke="#140d0a" strokeWidth={4} />);
    }
    return out;
  }, []);
  return (
    <g>
      {/* ceiling */}
      <path d="M-500,-500 L2420,-500 L1800,90 L120,90 Z" fill="#191412" />
      {[-300, 0, 300, 600, 900, 1200, 1500, 1800, 2100].map((x, i) => (
        <path key={i} d={`M${x},-500 L${120 + (x + 500) * (1680 / 2920)},90`} stroke="#0d0a09" strokeWidth={14} />
      ))}
      {/* the boarded skylight */}
      <g>
        <path d="M470,8 L820,8 L852,74 L438,74 Z" fill="#05050c" stroke={INK} strokeWidth={6} />
        {st.skylight > 0 ? <path d="M470,8 L820,8 L852,74 L438,74 Z" fill="#7ff2ff" opacity={0.25 * st.skylight} /> : null}
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${430 + i * 6},${18 + i * 22} L${862 - i * 4},${12 + i * 24} L${864 - i * 4},${30 + i * 24} L${432 + i * 6},${36 + i * 22} Z`} fill="#4a3628" stroke={INK} strokeWidth={4} />
        ))}
        {[452, 840].map((nx) => [24, 46, 68].map((ny) => <circle key={`${nx}${ny}`} cx={nx} cy={ny - 4} r={3} fill="#1a1a1a" />))}
        <g transform="translate(646 46) rotate(-3)">
          <rect x={-34} y={-15} width={68} height={30} fill="#d8cfb0" stroke={INK} strokeWidth={3} />
          <text x={0} y={9} textAnchor="middle" fontFamily="SpecialElite, Courier, monospace" fontWeight={900} fontSize={22} fill="#8a1a14">
            NO
          </text>
        </g>
      </g>
      {/* side walls + floor */}
      <path d="M-500,-500 L120,90 L120,860 L-500,1500 Z" fill="#141a22" />
      <path d="M2420,-500 L1800,90 L1800,860 L2420,1500 Z" fill="#141a22" />
      <path d="M120,860 L1800,860 L2420,1500 L-500,1500 Z" fill="#241915" />
      {planks}
      {/* back wall: wallpaper with little moons and little eyes */}
      <rect x={120} y={90} width={1680} height={770} fill="#1f2833" />
      {paper}
      {[
        [300, 420, 120, 70],
        [1200, 200, 90, 120],
        [1760, 520, 70, 140],
      ].map(([x, y, rx, ry], i) => (
        <path key={i} d={blob(x, y, rx, ry, 10, 0.3, `wst${i}`)} fill="#5a4a2a" opacity={0.18} />
      ))}
      {/* crack */}
      <path d="M140,300 L190,340 L170,390 L230,430 L210,470" fill="none" stroke={INK} strokeWidth={4} />
      {/* wainscot */}
      <rect x={120} y={640} width={1680} height={220} fill="#2a1f1a" />
      {Array.from({ length: 24 }).map((_, i) => (
        <path key={i} d={`M${120 + i * 70},640 L${120 + i * 70},860`} stroke="#1a1310" strokeWidth={4} />
      ))}
      <rect x={120} y={630} width={1680} height={14} fill="#3a2b22" stroke={INK} strokeWidth={3} />
      {/* edges of the box */}
      <path d="M120,90 L120,860 M1800,90 L1800,860 M120,90 L1800,90 M120,860 L1800,860" stroke={INK} strokeWidth={6} fill="none" />
      {/* sampler */}
      <g transform="translate(500 150) rotate(-1.5)">
        <rect x={0} y={0} width={290} height={170} fill="#5a3a24" stroke={INK} strokeWidth={6} />
        <rect x={14} y={14} width={262} height={142} fill="#d9cfb2" />
        <text x={145} y={66} textAnchor="middle" fontFamily="SpecialElite, Courier, monospace" fontSize={30} fill="#8a1a24">
          HOME SWEET
        </text>
        <text x={145} y={112} textAnchor="middle" fontFamily="SpecialElite, Courier, monospace" fontSize={40} fill="#1a1430">
          VOID
        </text>
        <circle cx={44} cy={128} r={12} fill="none" stroke="#2a5a6a" strokeWidth={3} strokeDasharray="3 3" />
        <circle cx={246} cy={128} r={5} fill="#8a1a24" />
      </g>
      {/* a clock with no hands */}
      <g transform="translate(1040 250)">
        <circle r={50} fill="#d6cdb0" stroke={INK} strokeWidth={6} />
        {Array.from({ length: 12 }).map((_, i) => (
          <path key={i} d="M0,-41 L0,-34" stroke={INK} strokeWidth={3} transform={`rotate(${i * 30})`} />
        ))}
        <circle r={5} fill={INK} />
      </g>
      {/* framed moon, crossed out */}
      <g transform="translate(860 300) rotate(3)">
        <rect x={0} y={0} width={110} height={130} fill="#3a2a20" stroke={INK} strokeWidth={5} />
        <rect x={12} y={12} width={86} height={106} fill="#141a2e" />
        <circle cx={55} cy={62} r={26} fill="#d8d2b8" />
        <circle cx={48} cy={56} r={5} fill="#b0a890" />
        <path d="M22,26 L88,104 M88,26 L22,104" stroke="#a01a1a" strokeWidth={7} strokeLinecap="round" />
      </g>
      {/* a little night dust in the air */}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = 200 + rnd(`dust${i}`) * 1500 + noise2D(`dx${i}`, t * 0.1, 0) * 60 - st.wind * ((t * 60 + i * 50) % 300);
        const y = 200 + rnd(`dusty${i}`) * 600 + noise2D(`dy${i}`, 0, t * 0.1) * 40;
        return <circle key={i} cx={x} cy={y} r={1.5 + rnd(`dr${i}`) * 2} fill="#cfe9ff" opacity={0.25} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The window                                                          */
/* ------------------------------------------------------------------ */

const OutsideView: React.FC<{ st: RoomState; t: number }> = ({ st, t }) => (
  <g>
    <defs>
      <linearGradient id="winSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0a0c22" />
        <stop offset="1" stopColor="#161034" />
      </linearGradient>
      <radialGradient id="planetG" cx="0.35" cy="0.35" r="0.7">
        <stop offset="0" stopColor="#bff6ec" />
        <stop offset="0.55" stopColor="#4aa0a8" />
        <stop offset="1" stopColor="#10283a" />
      </radialGradient>
    </defs>
    <rect x={WIN.x0 - 40} y={WIN.y0 - 40} width={WIN.x1 - WIN.x0 + 80} height={WIN.y1 - WIN.y0 + 80} fill="url(#winSky)" />
    <Starfield seed="winst" n={70} x0={WIN.x0 - 40} y0={WIN.y0 - 40} w={440} h={500} t={t} rMin={0.8} rMax={2.4} sparkles={5} />
    {/* the ringed planet */}
    <g transform="translate(1610 330)">
      <ellipse rx={230} ry={46} fill="none" stroke="#7fc8c0" strokeWidth={10} opacity={0.6} transform="rotate(-14)" />
      <circle r={120} fill="url(#planetG)" stroke={INK} strokeWidth={5} />
      <path d="M-230,0 A230,46 0 0 0 230,0" fill="none" stroke="#9fe2da" strokeWidth={10} transform="rotate(-14)" />
    </g>
    {/* passing rock with dogs */}
    {st.dogs > 0 ? (
      <g transform={`translate(${1700 - st.dogs * 300 + Math.sin(t * 0.5) * 10} 560) scale(0.55)`}>
        <path d={blob(0, 30, 200, 50, 11, 0.2, "dogrock")} fill="#3a3346" stroke={INK} strokeWidth={6} />
        <SpaceDog id="wd1" x={-60} y={4} s={0.8} t={t} seed={1} />
        <SpaceDog id="wd2" x={90} y={0} s={0.7} t={t} seed={2} flip />
      </g>
    ) : null}
    {/* something pale sliding past: a long face, mostly glow, two holes for eyes */}
    {st.shadow > 0 ? (
      <g opacity={st.shadow}>
        <defs>
          <radialGradient id="paleShape" cx="0.5" cy="0.45" r="0.5">
            <stop offset="0" stopColor="#e6eeff" stopOpacity={0.9} />
            <stop offset="0.55" stopColor="#c8d8ff" stopOpacity={0.55} />
            <stop offset="1" stopColor="#c8d8ff" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={st.shadowX} cy={440} rx={190} ry={320} fill="url(#paleShape)" />
        <ellipse cx={st.shadowX - 52} cy={380} rx={26} ry={34} fill="#05060c" opacity={0.85} transform={`rotate(-12 ${st.shadowX - 52} 380)`} />
        <ellipse cx={st.shadowX + 52} cy={384} rx={26} ry={34} fill="#05060c" opacity={0.85} transform={`rotate(12 ${st.shadowX + 52} 384)`} />
        <ellipse cx={st.shadowX} cy={520} rx={50} ry={10} fill="#05060c" opacity={0.6} />
      </g>
    ) : null}
    {/* the eye */}
    {st.eye > 0 ? (
      <g opacity={clamp(st.eye * 1.5)}>
        <rect x={WIN.x0 - 40} y={WIN.y0 - 40} width={440} height={500} fill="#000" opacity={st.eye * 0.9} />
        <GalaxyEye id="winEye" cx={st.eyeX} cy={st.eyeY} r={150} t={t} open={st.eyeOpen} ball pupil={st.eyePupil} lid="#05030a" look={[-0.15, 0.08]} />
      </g>
    ) : null}
  </g>
);

const Window: React.FC<{ st: RoomState; t: number }> = ({ st, t }) => {
  const lift = st.sash * 150;
  const lowerTop = 460 - lift;
  const lowerBot = WIN.y1 - lift;
  return (
    <g>
      <defs>
        <clipPath id="winClip">
          <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} />
        </clipPath>
      </defs>
      <g clipPath="url(#winClip)">
        <OutsideView st={st} t={t} />
        {/* glass: faint reflection, fog, breath */}
        <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={lowerBot - WIN.y0} fill="#9fc8ff" opacity={0.06} />
        <path d={`M${WIN.x0 + 40},${WIN.y0} L${WIN.x0 + 120},${WIN.y0} L${WIN.x0 + 20},${WIN.y0 + 200} L${WIN.x0 - 60},${WIN.y0 + 200} Z`} fill="#ffffff" opacity={0.06} />
        <path d={`M${WIN.x0 + 200},${WIN.y0} L${WIN.x0 + 240},${WIN.y0} L${WIN.x0 + 90},${WIN.y0 + 300} L${WIN.x0 + 50},${WIN.y0 + 300} Z`} fill="#ffffff" opacity={0.05} />
        {st.fog > 0 ? <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={lowerBot - WIN.y0} fill="#dfe8f0" opacity={st.fog * 0.45} /> : null}
        {st.breaths.map(([bx, by, o], i) =>
          o > 0 ? (
            <g key={i} opacity={o}>
              <path d={cloudPath(bx, by, 70, 52, 9, `br${i}`, 0.5)} fill="#e8f0f6" opacity={0.55} />
              <path d={cloudPath(bx, by, 40, 30, 7, `bri${i}`, 0.5)} fill="#ffffff" opacity={0.35} />
            </g>
          ) : null,
        )}
      </g>
      {/* outer frame */}
      <path d={`M${WIN.x0 - 22},${WIN.y0 - 22} L${WIN.x1 + 22},${WIN.y0 - 22} L${WIN.x1 + 22},${WIN.y1 + 22} L${WIN.x0 - 22},${WIN.y1 + 22} Z M${WIN.x0},${WIN.y0} L${WIN.x0},${WIN.y1} L${WIN.x1},${WIN.y1} L${WIN.x1},${WIN.y0} Z`} fill="#4a3b2e" stroke={INK} strokeWidth={6} fillRule="evenodd" />
      {/* upper sash (fixed) */}
      <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={460 - WIN.y0} fill="none" stroke="#5a4636" strokeWidth={14} />
      <path d={`M${WIN_C[0]},${WIN.y0} L${WIN_C[0]},460`} stroke="#5a4636" strokeWidth={10} />
      {/* lower sash (slides up) */}
      <rect x={WIN.x0 + 4} y={lowerTop} width={WIN.x1 - WIN.x0 - 8} height={lowerBot - lowerTop} fill="none" stroke={INK} strokeWidth={22} />
      <rect x={WIN.x0 + 4} y={lowerTop} width={WIN.x1 - WIN.x0 - 8} height={lowerBot - lowerTop} fill="none" stroke="#6a5240" strokeWidth={14} />
      <path d={`M${WIN_C[0]},${lowerTop} L${WIN_C[0]},${lowerBot}`} stroke="#6a5240" strokeWidth={10} />
      {/* the open gap at the bottom */}
      {lift > 2 ? <rect x={WIN.x0} y={lowerBot + 8} width={WIN.x1 - WIN.x0} height={WIN.y1 - lowerBot - 8} fill="#000" opacity={0.15} /> : null}
      {/* ...and the back of a long pale hand rising into it from outside */}
      {st.hand > 0 && lift > 30 ? (
        <g opacity={clamp(st.hand * 2.5)}>
          <defs>
            <clipPath id="gapClip">
              <rect x={WIN.x0} y={lowerBot + 10} width={WIN.x1 - WIN.x0} height={WIN.y1 - lowerBot - 6} />
            </clipPath>
          </defs>
          <g clipPath="url(#gapClip)">
            <path d={`M1350,${WIN.y1 + 30} C1360,${WIN.y1 - 40 * clamp(st.hand * 1.4)} 1510,${WIN.y1 - 46 * clamp(st.hand * 1.4)} 1530,${WIN.y1 + 30} Z`} fill="#b8c4da" stroke={INK} strokeWidth={6} />
            <path d={`M1390,${WIN.y1 - 6} q40,-14 90,-6 M1410,${WIN.y1 + 6} q30,-10 70,-4`} fill="none" stroke="#7a8496" strokeWidth={3} />
          </g>
        </g>
      ) : null}
      {/* sill */}
      <rect x={WIN.x0 - 44} y={WIN.y1 + 16} width={WIN.x1 - WIN.x0 + 88} height={22} rx={4} fill="#5a4636" stroke={INK} strokeWidth={5} />
      {/* long pale fingers hooking over the sill from outside, one knuckle at a time */}
      {st.hand > 0 ? (
        <g opacity={clamp(st.hand * 2.5)}>
          {[0, 1, 2, 3].map((i) => {
            const k = clamp(st.hand * 1.35 - i * 0.12);
            if (k <= 0.02) return null;
            const x0 = 1380 + i * 42 + (i === 3 ? 6 : 0);
            const top = WIN.y1 + 6;
            const len = (i === 1 || i === 2 ? 110 : 88) * k;
            const d = `M${x0 - 10},${top + 2} Q${x0 - 2},${top - 22} ${x0 + 10},${top + 6} L${x0 + 14},${top + 12 + len}`;
            return (
              <g key={i}>
                <path d={d} fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke="#c8d4e8" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
                <path d={`M${x0 + 4},${top + 20 + len * 0.4} l18,1 M${x0 + 5},${top + 26 + len * 0.4} l16,1 M${x0 + 5},${top + 16 + len * 0.78} l16,1`} stroke="#7a8496" strokeWidth={3} />
                <path d={`M${x0 + 5},${top + 8 + len} l9,${16 + 8 * k} l9,${-16 - 8 * k} Z`} fill="#1a1622" stroke={INK} strokeWidth={2.5} />
              </g>
            );
          })}
        </g>
      ) : null}
      {/* a dead plant on the sill */}
      <g transform={`translate(${WIN.x0 + 40} ${WIN.y1 + 16})`}>
        <path d="M-22,0 L22,0 L16,-40 L-16,-40 Z" fill="#8a4a2a" stroke={INK} strokeWidth={4} />
        <path d="M0,-40 q-6,-40 -30,-60 M0,-40 q10,-30 34,-40 M0,-40 q2,-30 -4,-70" fill="none" stroke="#4a3a20" strokeWidth={4} strokeLinecap="round" />
      </g>
    </g>
  );
};

const Curtains: React.FC<{ st: RoomState; t: number }> = ({ st, t }) => {
  const w = st.wind;
  const shut = st.shut;
  const panel = (side: -1 | 1) => {
    const rodX = side < 0 ? 1240 : 1740;
    const inner = side < 0 ? 1372 + shut * 110 : 1608 - shut * 110;
    const pts: Pt[] = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const billow = side > 0 ? w * (60 + 120 * k) * (0.6 + 0.4 * Math.sin(t * 2.3 + k * 2.4)) + noise2D(`cur${side}`, t * 0.9, k * 2) * 40 * w : w * 30 * k * Math.sin(t * 1.7 + k);
      pts.push([inner - side * billow * 0.9 + Math.sin(k * 9 + t * 0.6) * 4, 222 + k * 520 - (side > 0 ? w * k * k * 40 : 0)]);
    }
    const outer: Pt[] = pts.map(([px, py], i): Pt => [rodX + (px - inner) * 0.1 - side * (i % 2) * 4, py]).reverse();
    const d = smoothPath([...pts, ...outer], true, 0.6);
    return (
      <g key={side}>
        <path d={d} fill="#5a2f3a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {[0.3, 0.55, 0.8].map((f, i) => (
          <path key={i} d={smoothPath(pts.map(([px, py]) => [rodX + (px - rodX) * f, py] as Pt), false)} fill="none" stroke="#3d1f28" strokeWidth={5} opacity={0.9} />
        ))}
      </g>
    );
  };
  return (
    <g>
      {panel(-1)}
      {panel(1)}
      <path d="M1226,216 L1754,216" stroke={INK} strokeWidth={14} strokeLinecap="round" />
      <path d="M1226,216 L1754,216" stroke="#8a7a5a" strokeWidth={7} strokeLinecap="round" />
      <circle cx={1222} cy={216} r={12} fill="#8a7a5a" stroke={INK} strokeWidth={4} />
      <circle cx={1758} cy={216} r={12} fill="#8a7a5a" stroke={INK} strokeWidth={4} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Furniture                                                           */
/* ------------------------------------------------------------------ */

const BedBack: React.FC = () => (
  <g>
    <ellipse cx={640} cy={900} rx={520} ry={50} fill="#3a2a2f" opacity={0.9} />
    {/* headboard */}
    {[160, 246].map((x) => (
      <g key={x}>
        <rect x={x - 9} y={420} width={18} height={470} rx={6} fill="#3a3d44" stroke={INK} strokeWidth={5} />
        <circle cx={x} cy={414} r={16} fill="#4a4d55" stroke={INK} strokeWidth={5} />
      </g>
    ))}
    {[480, 560].map((y) => (
      <rect key={y} x={160} y={y - 7} width={86} height={14} fill="#3a3d44" stroke={INK} strokeWidth={4} />
    ))}
    {[188, 218].map((x) => (
      <rect key={x} x={x - 4} y={480} width={8} height={240} fill="#3a3d44" stroke={INK} strokeWidth={3} />
    ))}
    {/* mattress */}
    <path d="M190,700 L1046,700 Q1060,712 1052,800 L196,806 Q182,760 190,700 Z" fill="#b8ae94" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    {Array.from({ length: 13 }).map((_, i) => (
      <path key={i} d={`M${220 + i * 64},708 L${216 + i * 64},800`} stroke="#8a8270" strokeWidth={4} />
    ))}
    <path d={blob(760, 770, 70, 22, 9, 0.3, "mstain")} fill="#7a6a3a" opacity={0.5} />
    {/* bed legs + the slippers he can't wear */}
    <rect x={240} y={800} width={16} height={90} fill="#3a3d44" stroke={INK} strokeWidth={4} />
    {[560, 650].map((x, i) => (
      <g key={x} transform={`translate(${x} 880) rotate(${i ? 8 : -4})`}>
        <path d="M-40,0 C-40,-26 30,-30 46,-10 C52,2 30,10 -30,8 Z" fill="#c25a7a" stroke={INK} strokeWidth={4} />
        <path d="M-30,-12 C-20,-26 10,-28 26,-16" fill="none" stroke="#f0d0dc" strokeWidth={8} strokeLinecap="round" />
      </g>
    ))}
    {/* pillow */}
    <path d={blob(300, 652, 120, 62, 11, 0.12, "pillow")} fill="#c9c0aa" stroke={INK} strokeWidth={6} />
    <path d="M230,640 q60,30 140,0" fill="none" stroke="#a49b84" strokeWidth={4} />
    <path d={blob(340, 680, 30, 14, 8, 0.3, "pstain")} fill="#8a7a50" opacity={0.45} />
  </g>
);

const BedFront: React.FC = () => (
  <g>
    {[1000, 1052].map((x) => (
      <g key={x}>
        <rect x={x - 9} y={600} width={18} height={290} rx={6} fill="#3a3d44" stroke={INK} strokeWidth={5} />
        <circle cx={x} cy={594} r={14} fill="#4a4d55" stroke={INK} strokeWidth={5} />
      </g>
    ))}
    <rect x={1000} y={640} width={52} height={12} fill="#3a3d44" stroke={INK} strokeWidth={3} />
  </g>
);

const Nightstand: React.FC<{ st: RoomState; t: number }> = ({ st, t }) => (
  <g>
    <rect x={1080} y={706} width={150} height={180} fill="#3a2a20" stroke={INK} strokeWidth={6} />
    <rect x={1070} y={694} width={170} height={20} rx={4} fill="#4a3628" stroke={INK} strokeWidth={5} />
    <rect x={1096} y={740} width={118} height={56} fill="#33251c" stroke={INK} strokeWidth={4} />
    <circle cx={1155} cy={768} r={7} fill="#8a7a5a" stroke={INK} strokeWidth={3} />
    {/* lamp */}
    <path d="M1112,694 L1140,694 L1132,640 L1120,640 Z" fill="#6a6050" stroke={INK} strokeWidth={4} />
    {st.lamp > 0 ? <circle cx={1126} cy={600} r={160} fill="#ffd68a" opacity={0.16 * st.lamp} /> : null}
    <path d="M1086,640 L1166,640 L1146,572 L1106,572 Z" fill={st.lamp > 0.5 ? "#f2d79a" : "#8a7a5a"} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    {/* glass of water, trembling when the dogs howl */}
    <g transform={`translate(1200 694) rotate(${st.dogs > 0 ? Math.sin(t * 30) * 2 : 0})`}>
      <path d="M-14,0 L-18,-46 L18,-46 L14,0 Z" fill="#bfe8ff" fillOpacity={0.35} stroke={INK} strokeWidth={3.5} />
      <path d={`M-16,-26 Q0,${-26 + (st.dogs > 0 ? Math.sin(t * 24) * 3 : 0)} 16,-26`} fill="none" stroke="#7fc8f0" strokeWidth={3} />
    </g>
  </g>
);

const Telescope: React.FC = () => (
  <g>
    {[
      [1810, 640, 1752, 892],
      [1810, 640, 1826, 900],
      [1810, 640, 1878, 880],
    ].map(([x0, y0, x1, y1], i) => (
      <g key={i}>
        <path d={`M${x0},${y0} L${x1},${y1}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
        <path d={`M${x0},${y0} L${x1},${y1}`} stroke="#5a4636" strokeWidth={7} strokeLinecap="round" />
      </g>
    ))}
    {/* tube under a sheet, chained */}
    <path d="M1700,560 C1720,500 1880,480 1910,520 C1930,560 1900,640 1860,660 C1820,670 1790,640 1760,650 C1730,660 1690,620 1700,560 Z" fill="#b8b0a0" stroke={INK} strokeWidth={6} />
    <path d="M1740,560 q40,30 120,-10 M1730,610 q50,24 140,-6" fill="none" stroke="#8f887a" strokeWidth={4} />
    {[1760, 1840].map((x, i) => (
      <path key={i} d={`M${x},${505 + i * 4} q-14,70 4,150`} fill="none" stroke="#7a7e86" strokeWidth={9} strokeDasharray="10 5" />
    ))}
    <g transform="translate(1800 640)">
      <rect x={-12} y={-6} width={24} height={20} rx={3} fill="#c9a83a" stroke={INK} strokeWidth={3} />
      <path d="M-7,-6 a7,7 0 0 1 14,0" fill="none" stroke="#7a7e86" strokeWidth={4} />
    </g>
    <g transform="translate(1846 690) rotate(8)">
      <path d="M0,-30 L0,-6" stroke={INK} strokeWidth={2} />
      <rect x={-34} y={-6} width={68} height={40} fill="#c9a87a" stroke={INK} strokeWidth={3} />
      <text x={0} y={24} textAnchor="middle" fontFamily="PatrickHand, Comic Sans MS, cursive" fontSize={28} fill={INK}>
        NO.
      </text>
    </g>
  </g>
);

/** Darkness pooled in the corners, thinner by the window. */
const Darkness: React.FC<{ dark: number }> = ({ dark }) => (
  <g>
    <defs>
      <radialGradient id="roomDark" gradientUnits="userSpaceOnUse" cx={1480} cy={470} r={1500}>
        <stop offset="0" stopColor="#020208" stopOpacity={0.15} />
        <stop offset="0.45" stopColor="#020208" stopOpacity={0.7} />
        <stop offset="1" stopColor="#020208" stopOpacity={0.95} />
      </radialGradient>
    </defs>
    <rect x={-600} y={-600} width={3200} height={2200} fill="url(#roomDark)" opacity={dark} />
  </g>
);

const Moonbeam: React.FC<{ st: RoomState }> = ({ st }) => (
  <path
    d={`M${WIN.x0},${WIN.y0} L${WIN.x0},${WIN.y1} L${WIN.x1 - 120},${1080} L${700},${1080} L${420},${720} Z`}
    fill="#7fdcff"
    opacity={(0.05 + (1 - st.dark) * 0.06) * (1 - st.shut) * (st.eye > 0 ? 1 - st.eye : 1)}
  />
);

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

export interface RoomSceneProps {
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  glim?: Partial<GlimProps> | false;
  rachel?: Partial<RachelProps> | false;
  room?: Partial<RoomState>;
  shakeAmp?: number;
  back?: React.ReactNode;
  front?: React.ReactNode;
  /** colour grade multipliers for the shot */
  bright?: number;
  sat?: number;
}

export const RoomScene: React.FC<RoomSceneProps> = ({ from, to, cam, ease = easeInOut, glim = {}, rachel = false, room = {}, shakeAmp = 0, back, front, bright = 1, sat = 1 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = cam ?? (to ? camLerp(from, to, ease(shot.p)) : from);
  const st: RoomState = { ...DEFAULT_ROOM, ...room };
  const sg = useSpeech("glim");
  const sr = useSpeech("rachel");
  const gp: GlimProps | null = glim ? { id: "glim", x: GLIM_BED.x, y: GLIM_BED.y, pose: "bed", recline: 8, t, frame, ...sg, ...glim } : null;
  const rp: RachelProps | null = rachel ? { id: "rachel", x: RACHEL_POS.x, y: RACHEL_POS.y, scale: RACHEL_POS.scale, flip: true, t, frame, ...sr, ...rachel } : null;
  const cordFrom = gp ? glimThirdEye(gp) : null;
  const cordTo = rp ? rachelTail(rp.x, rp.y, rp.scale ?? 1, rp.flip ?? false, t) : null;
  return (
    <Tint bright={bright} sat={sat}>
      <Stage cam={c} frame={frame} shakeAmp={shakeAmp}>
        <Shell st={st} t={t} />
        <Window st={st} t={t} />
        <Curtains st={st} t={t} />
        <Telescope />
        <BedBack />
        <Nightstand st={st} t={t} />
        <Darkness dark={st.dark} />
        <Moonbeam st={st} />
        {back}
        {gp ? <Glim {...gp} /> : null}
        <BedFront />
        {rp && cordFrom && cordTo ? <Cord from={cordFrom} to={cordTo} t={t} opacity={rp.alpha ?? 1} /> : null}
        {rp ? <Rachel {...rp} /> : null}
        {front}
      </Stage>
    </Tint>
  );
};

/* ------------------------------------------------------------------ */
/* Exterior: the shack on its rock                                     */
/* ------------------------------------------------------------------ */

export const ShackScene: React.FC<{ from: Cam; to?: Cam; ease?: (x: number) => number; wind?: number; glow?: number; dogs?: boolean; howl?: number; hue?: number; front?: React.ReactNode }> = ({ from, to, ease = easeInOut, wind = 0.5, glow = 1, dogs = true, howl = 1, hue = 0, front }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = to ? camLerp(from, to, ease(shot.p)) : from;
  const shingles = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let r = 0; r < 5; r++) {
      for (let k = 0; k < 9; k++) {
        const x = 760 + k * 50 + (r % 2 ? 25 : 0);
        const y = 330 + r * 24;
        out.push(<path key={`${r}-${k}`} d={`M${x},${y} l40,0 l-4,20 l-34,0 Z`} fill={r % 2 ? "#3a2a24" : "#33241f"} stroke={INK} strokeWidth={2.5} />);
      }
    }
    return out;
  }, []);
  return (
    <Tint hue={hue}>
      <Stage cam={c} frame={frame}>
        <defs>
          <radialGradient id="shackSky" gradientUnits="userSpaceOnUse" cx={1300} cy={300} r={1800}>
            <stop offset="0" stopColor="#14163a" />
            <stop offset="1" stopColor="#020208" />
          </radialGradient>
          <radialGradient id="planetG2" cx="0.35" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#bff6ec" />
            <stop offset="0.55" stopColor="#4aa0a8" />
            <stop offset="1" stopColor="#10283a" />
          </radialGradient>
          <clipPath id="shackFront">
            <path d="M770,420 L1150,420 L1160,690 L760,690 Z" />
          </clipPath>
        </defs>
        <rect x={-2000} y={-1500} width={6000} height={4200} fill="url(#shackSky)" />
        <Starfield seed="shk" n={260} x0={-900} y0={-700} w={3800} h={2500} t={t} rMin={0.8} rMax={2.2} sparkles={12} />
        {/* the ringed planet */}
        <g transform="translate(1560 250)">
          <circle r={360} fill="#7ff2ff" opacity={0.06} />
          <ellipse rx={560} ry={92} fill="none" stroke="#7fc8c0" strokeWidth={22} opacity={0.5} transform="rotate(-14)" />
          <circle r={250} fill="url(#planetG2)" stroke={INK} strokeWidth={7} />
          <path d="M-560,0 A560,92 0 0 0 560,0" fill="none" stroke="#9fe2da" strokeWidth={22} transform="rotate(-14)" opacity={0.9} />
        </g>
        {/* wind: stardust blowing past */}
        {Array.from({ length: 24 }).map((_, i) => {
          const y = -200 + rnd(`ws${i}`) * 1400;
          const x = 2400 - ((t * (300 + rnd(`wsv${i}`) * 500) * (0.4 + wind) + rnd(`wsx${i}`) * 3000) % 3400);
          const l = 60 + wind * 200;
          return <path key={i} d={`M${x},${y} q${-l * 0.5},${-10} ${-l},0`} fill="none" stroke="#cfe9ff" strokeWidth={2.5} opacity={0.35 * wind} strokeLinecap="round" />;
        })}
        {/* dog rocks */}
        {dogs
          ? [
              [300, 620, 0.9, false, 0],
              [1700, 760, 0.7, true, 1],
              [520, 980, 0.6, false, 2],
            ].map(([x, y, s, f, k], i) => (
              <g key={i} transform={`translate(${(x as number) + Math.sin(t * 0.4 + i) * 16} ${(y as number) + Math.cos(t * 0.5 + i) * 10})`}>
                <path d={blob(0, 40, 170 * (s as number), 48 * (s as number), 11, 0.22, `dr${i}`)} fill="#2e2838" stroke={INK} strokeWidth={6} />
                <SpaceDog id={`sd${i}`} x={0} y={14} s={(s as number) * 0.9} flip={f as boolean} t={t} howl={howl} seed={k as number} />
              </g>
            ))
          : null}
        {/* the rock */}
        <path d={blob(960, 760, 360, 120, 13, 0.16, "homeRock")} fill="#3a3346" stroke={INK} strokeWidth={7} />
        {[
          [820, 760, 40],
          [1080, 800, 30],
          [960, 840, 22],
        ].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.4} fill="#26212f" stroke={INK} strokeWidth={3} />
        ))}
        {/* dead tree + mailbox */}
        <path d="M680,700 q-10,-80 -40,-120 M660,640 q-30,-10 -50,-40 M650,600 q20,-30 50,-40" fill="none" stroke="#1a1414" strokeWidth={9} strokeLinecap="round" />
        <g transform="translate(1230 700)">
          <path d="M0,0 L0,-70" stroke={INK} strokeWidth={8} />
          <rect x={-30} y={-104} width={60} height={36} rx={14} fill="#5a6a7a" stroke={INK} strokeWidth={4} />
          <text x={0} y={-79} textAnchor="middle" fontFamily="PatrickHand, Comic Sans MS, cursive" fontSize={20} fill="#e8e0c8">
            GLIM
          </text>
        </g>
        {/* the shack */}
        <path d="M770,420 L1150,420 L1160,690 L760,690 Z" fill="#4a3628" stroke={INK} strokeWidth={7} />
        <g clipPath="url(#shackFront)">
          {Array.from({ length: 10 }).map((_, i) => (
            <path key={i} d={`M${770 + i * 40},420 L${766 + i * 41},690`} stroke="#2e2219" strokeWidth={5} />
          ))}
        </g>
        {/* roof (with the boarded skylight on it) */}
        <path d="M730,436 L960,300 L1190,436 Z" fill="#2c201b" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {shingles}
        <path d="M730,436 L960,300 L1190,436" fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <g transform="translate(880 372) rotate(-30)">
          <rect x={-40} y={-14} width={80} height={28} fill="#05050c" stroke={INK} strokeWidth={4} />
          <rect x={-48} y={-10} width={96} height={8} fill="#5a4636" stroke={INK} strokeWidth={2.5} />
          <rect x={-48} y={4} width={96} height={8} fill="#5a4636" stroke={INK} strokeWidth={2.5} />
        </g>
        {/* stovepipe + bent antenna */}
        <path d="M1060,340 L1060,270 L1090,250" fill="none" stroke={INK} strokeWidth={22} strokeLinejoin="round" />
        <path d="M1060,340 L1060,270 L1090,250" fill="none" stroke="#3a3d44" strokeWidth={14} strokeLinejoin="round" />
        <path d="M960,300 L960,220 M930,240 L990,224 M940,226 L980,212" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        {/* door */}
        <rect x={810} y={560} width={84} height={130} fill="#33251c" stroke={INK} strokeWidth={5} />
        <path d="M852,580 a10,10 0 1 0 8,16 a8,8 0 1 1 -8,-16 Z" fill="#05050c" />
        {/* the window, faintly lit */}
        <rect x={980} y={500} width={110} height={120} fill="#0c1430" stroke={INK} strokeWidth={6} />
        <rect x={980} y={500} width={110} height={120} fill="#7fdcff" opacity={0.18 * glow + Math.sin(t * 7) * 0.02} />
        <path d="M1035,500 L1035,620 M980,560 L1090,560" stroke="#4a3628" strokeWidth={8} />
        <path d="M986,506 q30,30 20,108" fill="none" stroke="#5a2f3a" strokeWidth={10} opacity={0.9} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={sparkle(6)} transform={`translate(${1000 + i * 30} ${520 + i * 20})`} fill="#e8f8ff" opacity={0.4} />
        ))}
        {front}
      </Stage>
    </Tint>
  );
};
