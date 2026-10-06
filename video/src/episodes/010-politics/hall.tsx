import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage, camLerp } from "../../engine/Stage";
import { Pt, blob, clamp, easeInOut, easeOut, lerp, onN, rnd, smoothPath } from "../../engine/util";
import { Frog, FrogProps, FROG_HEAD } from "./cast/Frog";
import { Brayer, Tusker } from "./cast/Mascots";
import { TadpoleFlag } from "./studio";
import { boomAt, boomCount, rumbleAt, useSpeech } from "./tl";

/* EPISODE 010 "NOW" set: a vast torch-lit underground hall. A chasm with a broken bridge on the left, the barred gates
   on the right (barricaded with what's left of the 2016 studio), one torch, one frog, and the dark. */

const FONT = "Arial Black, Arial, Helvetica, sans-serif";
export const FLOOR_Y = 905;
export const FROG_N = { x: 960, y: FLOOR_Y };
export const TORCH = { x: 1236, y: 520 };
export const HEAD_N = { x: FROG_N.x + FROG_HEAD.crouch[0], y: FROG_N.y + FROG_HEAD.crouch[1] };

export const CAM_N = {
  wide: { x: 960, y: 560, zoom: 0.94 },
  ms: { x: HEAD_N.x + 10, y: HEAD_N.y + 96, zoom: 1.6 },
  cu: { x: HEAD_N.x + 20, y: HEAD_N.y - 28, zoom: 2.45 },
  ecu: { x: HEAD_N.x + 30, y: HEAD_N.y - 36, zoom: 3.6 },
  carve: { x: 900, y: 330, zoom: 2.0 },
  gates: { x: 1640, y: 600, zoom: 1.5 },
  bar: { x: 1660, y: 560, zoom: 2.6 },
  bridge: { x: 140, y: 760, zoom: 1.35 },
  ceiling: { x: 960, y: 150, zoom: 1.4 },
} satisfies Record<string, Cam>;

export interface HallState {
  /** 0..1 torch strength (0 = out) */
  torch: number;
  /** 0..1 glowing eyes revealed in the dark */
  eyes: number;
  /** 0..1 shadow claws creeping in */
  claws: number;
  /** 0..1 the carved NOW */
  carveNow: number;
  /** the score's drum impact 0..1 (shake, dust, flare) */
  boom: number;
  /** 0..1 red light through the gate cracks */
  gateGlow: number;
  /** 0..1 dim fill so the hall's shapes read in wides (0 = only the torch) */
  ambient: number;
  /** centre of the light pool (default: beside the torch) */
  light?: { x: number; y: number };
  /** light pool size multiplier */
  radius: number;
}

/* ------------------------------------------------------------------ */
/* Stone                                                               */
/* ------------------------------------------------------------------ */

const BackWall: React.FC = () => {
  const blocks = useMemo(() => {
    // all mortar lines as ONE path (hundreds of separate <path>s are slow to rasterise)
    let d = "";
    for (let r = 0; r < 22; r++) {
      const y = -900 + r * 84;
      d += `M-1400,${y} L3400,${y} `;
      for (let c = -10; c < 30; c++) {
        const x = c * 170 + (r % 2 ? 85 : 0) + (rnd(`bk${r}${c}`) - 0.5) * 30;
        d += `M${x.toFixed(1)},${y} L${(x + (rnd(`bkx${r}${c}`) - 0.5) * 8).toFixed(1)},${y + 84} `;
      }
    }
    return d;
  }, []);
  const frieze = useMemo(() => Array.from({ length: 60 }).map((_, i) => `M${-1400 + i * 80},150 l20,-24 l20,24 l20,-24 l20,24`).join(" "), []);
  const cracks = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => {
        const x0 = -200 + rnd(`ck${i}`) * 2400;
        const y0 = -300 + rnd(`cky${i}`) * 900;
        const pts: Pt[] = [[x0, y0]];
        for (let s = 1; s < 6; s++) pts.push([x0 + (rnd(`ckx${i}${s}`) - 0.5) * 80, y0 + s * 40]);
        return smoothPath(pts, false, 0.5);
      }),
    [],
  );
  return (
    <g>
      <rect x={-1400} y={-1000} width={4800} height={1910} fill="#2c2620" />
      <path d={blocks} stroke="#14100e" strokeWidth={5} fill="none" />
      {cracks.map((d, i) => (
        <path key={i} d={d} stroke="#100c0a" strokeWidth={4} fill="none" />
      ))}
      {/* arches into the dark beyond */}
      {[640, 1000].map((ax, i) => (
        <g key={i}>
          <path d={`M${ax - 120},905 L${ax - 120},380 C${ax - 120},230 ${ax + 120},230 ${ax + 120},380 L${ax + 120},905 Z`} fill="#0a0807" stroke="#14100e" strokeWidth={8} />
          <path d={`M${ax - 150},905 L${ax - 150},370 C${ax - 150},190 ${ax + 150},190 ${ax + 150},370 L${ax + 150},905`} fill="none" stroke="#3a322a" strokeWidth={16} />
        </g>
      ))}
      {/* angular carved frieze */}
      <rect x={-1400} y={120} width={4800} height={40} fill="#3a3229" stroke="#14100e" strokeWidth={4} />
      <path d={frieze} stroke="#1e1915" strokeWidth={4} fill="none" />
    </g>
  );
};

const Pillar: React.FC<{ x: number; w?: number; top?: number }> = ({ x, w = 150, top = -900 }) => (
  <g>
    <rect x={x - w / 2} y={top} width={w} height={FLOOR_Y - top} fill="#3a3229" stroke={INK} strokeWidth={7} />
    {Array.from({ length: 4 }).map((_, i) => (
      <path key={i} d={`M${x - w / 2 + 18 + i * ((w - 36) / 3)},${top} L${x - w / 2 + 18 + i * ((w - 36) / 3)},${FLOOR_Y - 40}`} stroke="#2a241e" strokeWidth={5} />
    ))}
    <rect x={x - w / 2 - 20} y={FLOOR_Y - 60} width={w + 40} height={60} fill="#443a30" stroke={INK} strokeWidth={6} />
    <rect x={x - w / 2 - 14} y={180} width={w + 28} height={50} fill="#443a30" stroke={INK} strokeWidth={6} />
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M${x - w / 2 + 10},${260 + i * 140} l${w - 20},0`} stroke="#2a241e" strokeWidth={4} />
    ))}
    <path d={`M${x - w / 2},${top} L${x - w / 2},${FLOOR_Y}`} stroke="#4c4236" strokeWidth={10} opacity={0.7} />
  </g>
);

const Floor: React.FC = () => {
  const stones = useMemo(() => {
    let d = "";
    for (let r = 0; r < 6; r++) {
      const y = FLOOR_Y + r * 60 + r * r * 10;
      d += `M380,${y} L3400,${y} `;
      for (let c = 0; c < 26; c++) {
        const x = 400 + c * (140 + r * 30) + (r % 2 ? 70 : 0);
        d += `M${x},${y} L${x + 10 + r * 6},${y + 60 + r * 20} `;
      }
    }
    return <path d={d} stroke="#15110e" strokeWidth={4} fill="none" />;
  }, []);
  return (
    <g>
      {/* the floor ends in a jagged lip at the chasm (x ~ 420) */}
      <path d={`M3400,${FLOOR_Y} L470,${FLOOR_Y} L440,${FLOOR_Y + 30} L420,${FLOOR_Y + 14} L396,${FLOOR_Y + 70} L410,${FLOOR_Y + 130} L380,${FLOOR_Y + 200} L400,${FLOOR_Y + 900} L3400,${FLOOR_Y + 900} Z`} fill="#3a332c" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {stones}
      {/* rubble + a skull (previous tenant) */}
      {[
        [700, 0, 40],
        [1420, 10, 54],
        [1180, 30, 26],
        [560, 20, 30],
      ].map(([rx, ry, rs], i) => (
        <path key={i} d={blob(rx, FLOOR_Y + ry - rs * 0.3, rs, rs * 0.6, 7, 0.3, `rub${i}`)} fill="#4a4036" stroke={INK} strokeWidth={4} />
      ))}
      <g transform={`translate(640 ${FLOOR_Y + 6})`}>
        <path d="M-30,0 C-36,-50 36,-50 30,0 L18,0 L18,12 L-18,12 L-18,0 Z" fill="#d8ceb4" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <ellipse cx={-12} cy={-16} rx={8} ry={9} fill={INK} />
        <ellipse cx={12} cy={-16} rx={8} ry={9} fill={INK} />
        <path d="M-12,4 l0,8 M0,4 l0,8 M12,4 l0,8" stroke={INK} strokeWidth={3} />
      </g>
    </g>
  );
};

/** the broken bridge over the chasm, the tattered flag planted on it */
const Bridge: React.FC<{ t: number; boom: number }> = ({ t, boom }) => {
  const sway = Math.sin(t * 1.4) * 3 + boom * 6;
  return (
    <g>
      {/* near span */}
      <path d={`M440,${FLOOR_Y} L80,${FLOOR_Y} L60,${FLOOR_Y + 22} L96,${FLOOR_Y + 46} L70,${FLOOR_Y + 70} L440,${FLOOR_Y + 60} Z`} fill="#62564a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M440,${FLOOR_Y + 60} L70,${FLOOR_Y + 70}`} stroke="#ff5a22" strokeWidth={6} opacity={0.45 + boom * 0.3} />
      {[120, 220, 320].map((px) => (
        <path key={px} d={`M${px},${FLOOR_Y} l0,58`} stroke="#2a221c" strokeWidth={4} />
      ))}
      {/* broken stones dangling at the gap */}
      <path d={`M70,${FLOOR_Y + 70} l-10,40 l18,10 l6,-46 Z M-96,${FLOOR_Y + 66} l14,36 l14,-10 l-8,-30 Z`} fill="#4e4438" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {/* far span, across the gap */}
      <path d={`M-90,${FLOOR_Y + 10} L-800,${FLOOR_Y + 10} L-800,${FLOOR_Y + 70} L-70,${FLOOR_Y + 66} L-96,${FLOOR_Y + 40} Z`} fill="#56493e" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M-800,${FLOOR_Y + 70} L-70,${FLOOR_Y + 66}`} stroke="#ff5a22" strokeWidth={6} opacity={0.4 + boom * 0.3} />
      {/* a frayed rope still spanning the gap */}
      <path d={`M90,${FLOOR_Y - 60} Q0,${FLOOR_Y + 20 + sway * 4} -90,${FLOOR_Y - 50}`} stroke="#8a6a3a" strokeWidth={6} fill="none" />
      <path d={`M90,${FLOOR_Y} L90,${FLOOR_Y - 70} M-90,${FLOOR_Y + 10} L-90,${FLOOR_Y - 60}`} stroke={INK} strokeWidth={10} />
      {/* falling pebbles from the broken edge */}
      {[0, 1, 2].map((i) => {
        const ph = (t * 0.7 + i / 3) % 1;
        return <circle key={i} cx={70 + i * 8} cy={FLOOR_Y + 70 + ph * 600} r={5 - ph * 3} fill="#4a4036" opacity={1 - ph} />;
      })}
      <g transform={`rotate(${sway * 0.6} 300 ${FLOOR_Y})`}>
        <TadpoleFlag x={300} y={FLOOR_Y - 250} w={170} t={t * 0.4} torn={1} dirt={1} />
      </g>
    </g>
  );
};

/** the great gates, barred, and the barricade made of the 2016 studio */
const Gates: React.FC<{ t: number; boom: number; hits: number; glow: number }> = ({ t, boom, hits, glow }) => {
  const jolt = boom * 10;
  const bend = boom * 26;
  const cracks = Math.min(6, hits);
  return (
    <g>
      {/* frame */}
      <path d={`M1430,${FLOOR_Y} L1430,330 C1430,200 1890,200 1890,330 L1890,${FLOOR_Y} Z`} fill="#141010" stroke={INK} strokeWidth={8} />
      <g transform={`translate(${-jolt} ${jolt * 0.2})`}>
        {[0, 1].map((d) => {
          const x0 = d === 0 ? 1450 : 1662;
          return (
            <g key={d} transform={`rotate(${(d ? 1 : -1) * boom * 0.8} ${d ? 1870 : 1450} ${FLOOR_Y})`}>
              <path d={d === 0 ? `M1450,${FLOOR_Y} L1450,340 C1450,250 1560,224 1658,222 L1658,${FLOOR_Y} Z` : `M1662,${FLOOR_Y} L1662,222 C1760,224 1870,250 1870,340 L1870,${FLOOR_Y} Z`} fill="#4a3424" stroke={INK} strokeWidth={6} />
              {Array.from({ length: 5 }).map((_, i) => (
                <path key={i} d={`M${x0 + 20 + i * 40},250 L${x0 + 20 + i * 40},${FLOOR_Y}`} stroke="#2e2016" strokeWidth={5} />
              ))}
              {[400, 600, 800].map((by) => (
                <g key={by}>
                  <rect x={x0} y={by} width={208} height={30} fill="#2a2a2c" stroke={INK} strokeWidth={4} />
                  {Array.from({ length: 6 }).map((_, i) => (
                    <circle key={i} cx={x0 + 16 + i * 36} cy={by + 15} r={6} fill="#5a5a5e" stroke={INK} strokeWidth={2} />
                  ))}
                </g>
              ))}
            </g>
          );
        })}
        {/* splitting cracks, one more per hit */}
        {Array.from({ length: cracks }).map((_, i) => {
          const cx = 1500 + rnd(`gc${i}`) * 320;
          const cy = 330 + rnd(`gcy${i}`) * 400;
          return <path key={i} d={`M${cx},${cy} l14,30 l-10,24 l16,36 l-8,30`} stroke={glow > 0 ? "#ff5a2a" : "#0a0606"} strokeWidth={glow > 0 ? 6 : 5} fill="none" />;
        })}
        {glow > 0 ? <path d={`M1659,240 L1661,${FLOOR_Y}`} stroke="#ff4a1a" strokeWidth={6 + glow * 6} opacity={0.6 + glow * 0.4} style={{ mixBlendMode: "screen" }} /> : null}
        {/* the bar, bending */}
        <path d={`M1400,530 Q1660,${530 + bend} 1920,530 L1920,590 Q1660,${590 + bend} 1400,590 Z`} fill="#6a4a2a" stroke={INK} strokeWidth={7} />
        {[1470, 1850].map((bx) => (
          <rect key={bx} x={bx - 30} y={510} width={60} height={100} fill="#2a2a2c" stroke={INK} strokeWidth={5} />
        ))}
      </g>
      {/* barricade: the old studio, piled up */}
      <g>
        {/* the desk, on its side, banner upside down */}
        <g transform={`translate(1640 ${FLOOR_Y - 120}) rotate(-8)`}>
          <rect x={-230} y={-110} width={460} height={220} fill="#7a5230" stroke={INK} strokeWidth={6} />
          <g transform="rotate(180)">
            <rect x={-170} y={-40} width={340} height={80} rx={8} fill="#1c2e52" stroke={INK} strokeWidth={5} />
            <text x={0} y={10} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={24} fill="#a8a088">
              THE LIBERTY LILY PAD
            </text>
          </g>
        </g>
        {/* ring light */}
        <g transform={`translate(1490 ${FLOOR_Y - 330}) rotate(16)`}>
          <circle r={70} fill="none" stroke={INK} strokeWidth={26} />
          <circle r={70} fill="none" stroke="#8a8a84" strokeWidth={16} />
          <path d="M0,70 L0,300" stroke={INK} strokeWidth={10} />
        </g>
        {/* boom mic, snapped */}
        <path d={`M1760,${FLOOR_Y - 240} L1840,${FLOOR_Y - 420} L1900,${FLOOR_Y - 380}`} stroke={INK} strokeWidth={14} fill="none" />
        <rect x={1880} y={FLOOR_Y - 400} width={40} height={70} rx={20} fill="#2a2e34" stroke={INK} strokeWidth={5} transform={`rotate(30 1900 ${FLOOR_Y - 365})`} />
        {/* bookshelf on its side, books spilled, the bust face-down */}
        <rect x={1440} y={FLOOR_Y - 70} width={300} height={70} fill="#4a3018" stroke={INK} strokeWidth={5} />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={1460 + i * 46} y={FLOOR_Y - 60 - (i % 2) * 6} width={36} height={22} fill={["#1f3a6e", "#6c2a22", "#2a5450", "#7a6a2a"][i % 4]} stroke={INK} strokeWidth={3} transform={`rotate(${(rnd(`sb${i}`) - 0.5) * 40} ${1478 + i * 46} ${FLOOR_Y - 50})`} />
        ))}
        <g transform={`translate(1800 ${FLOOR_Y - 20}) rotate(100)`}>
          <path d="M-30,-20 C-34,-60 34,-60 30,-20 Z" fill="#a8a294" stroke={INK} strokeWidth={4} />
        </g>
        {/* the LIBERTY mug, chipped */}
        <g transform={`translate(1900 ${FLOOR_Y - 26}) rotate(12)`}>
          <rect x={-24} y={-26} width={48} height={52} rx={5} fill="#b8b4a4" stroke={INK} strokeWidth={4} />
          <path d="M-24,-26 l10,0 l-4,10 Z" fill="#141010" />
          <text x={0} y={2} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={9.5} fill="#2a3a56">
            LIBERTY
          </text>
        </g>
        {/* dust shaken loose off the top of the gate */}
        {boom > 0.15
          ? Array.from({ length: 8 }).map((_, i) => (
              <circle key={i} cx={1460 + i * 54 + (rnd(`gd${i}`) - 0.5) * 30} cy={240 + (1 - boom) * 200 + rnd(`gdy${i}`) * 60} r={6 + rnd(`gdr${i}`) * 6} fill="#8a7a62" opacity={boom * 0.8} />
            ))
          : null}
      </g>
    </g>
  );
};

/** the torch in its bracket */
const Torch: React.FC<{ t: number; frame: number; strength: number }> = ({ t, frame, strength }) => {
  const f2 = onN(frame, 2);
  const fl = noise2D("torchfl", f2 / 6, 0);
  const h = (90 + fl * 18) * strength;
  const w = 34 * (0.6 + strength * 0.4);
  return (
    <g>
      <path d={`M${TORCH.x + 60},${TORCH.y + 140} L${TORCH.x + 10},${TORCH.y + 110}`} stroke={INK} strokeWidth={14} />
      <path d={`M${TORCH.x + 60},${TORCH.y + 140} L${TORCH.x + 10},${TORCH.y + 110}`} stroke="#2a2a2c" strokeWidth={7} />
      <path d={`M${TORCH.x - 14},${TORCH.y + 150} L${TORCH.x + 14},${TORCH.y + 150} L${TORCH.x + 20},${TORCH.y + 30} L${TORCH.x - 20},${TORCH.y + 30} Z`} fill="#4a3018" stroke={INK} strokeWidth={5} />
      <path d={`M${TORCH.x - 26},${TORCH.y + 30} L${TORCH.x + 26},${TORCH.y + 30} L${TORCH.x + 20},${TORCH.y + 60} L${TORCH.x - 20},${TORCH.y + 60} Z`} fill="#2a2a2c" stroke={INK} strokeWidth={5} />
      {strength > 0.02 ? (
        <g>
          <path d={`M${TORCH.x - w},${TORCH.y + 34} C${TORCH.x - w * 1.2},${TORCH.y - h * 0.4} ${TORCH.x + fl * 14},${TORCH.y - h * 0.8} ${TORCH.x + fl * 20},${TORCH.y - h} C${TORCH.x + w * 0.6},${TORCH.y - h * 0.5} ${TORCH.x + w * 1.2},${TORCH.y - h * 0.2} ${TORCH.x + w},${TORCH.y + 34} Z`} fill="#e8641a" stroke={INK} strokeWidth={4} />
          <path d={`M${TORCH.x - w * 0.6},${TORCH.y + 30} C${TORCH.x - w * 0.6},${TORCH.y - h * 0.3} ${TORCH.x + fl * 8},${TORCH.y - h * 0.6} ${TORCH.x + fl * 12},${TORCH.y - h * 0.72} C${TORCH.x + w * 0.4},${TORCH.y - h * 0.3} ${TORCH.x + w * 0.6},${TORCH.y - h * 0.1} ${TORCH.x + w * 0.6},${TORCH.y + 30} Z`} fill="#ffb02a" />
          <ellipse cx={TORCH.x} cy={TORCH.y + 10} rx={w * 0.4} ry={h * 0.22} fill="#fff2a0" />
          {[0, 1, 2, 3].map((i) => {
            const ph = (t * 1.3 + i / 4) % 1;
            return <circle key={i} cx={TORCH.x + noise2D(`sp${i}`, t, i) * 40} cy={TORCH.y - h - ph * 160} r={3 - ph * 2} fill="#ffcc4a" opacity={(1 - ph) * strength} />;
          })}
        </g>
      ) : (
        <path d={`M${TORCH.x},${TORCH.y + 20} q-10,-40 6,-80 q10,-30 -4,-60`} stroke="#6a625a" strokeWidth={8} fill="none" opacity={0.6} strokeLinecap="round" />
      )}
    </g>
  );
};

/** MY POLITICS NOW, gouged into the stone */
const Carving: React.FC<{ now: number }> = ({ now }) => (
  <g>
    <g transform="translate(900 250) rotate(-2)">
      <text x={4} y={5} textAnchor="middle" fontFamily="Creepster" fontSize={92} fill="#a8946e" letterSpacing={6}>
        MY POLITICS
      </text>
      <text x={0} y={0} textAnchor="middle" fontFamily="Creepster" fontSize={92} fill="#0e0a08" letterSpacing={6}>
        MY POLITICS
      </text>
      {Array.from({ length: 14 }).map((_, i) => (
        <path key={i} d={`M${-300 + i * 44},${-60 + (i % 3) * 8} l${8 - (i % 2) * 16},${70 + (i % 4) * 6}`} stroke="#0e0a08" strokeWidth={3} opacity={0.6} />
      ))}
    </g>
    {now > 0 ? (
      <g transform={`translate(900 ${430 - (1 - now) * 20}) scale(${1 + (1 - now) * 0.3}) rotate(3)`} opacity={Math.min(1, now * 1.5)}>
        <text x={6} y={8} textAnchor="middle" fontFamily="Creepster" fontSize={200} fill="#b0906a" letterSpacing={10}>
          NOW
        </text>
        <text x={0} y={0} textAnchor="middle" fontFamily="Creepster" fontSize={200} fill="#140806" letterSpacing={10}>
          NOW
        </text>
        <text x={0} y={0} textAnchor="middle" fontFamily="Creepster" fontSize={200} fill="none" stroke="#7a1a10" strokeWidth={3} letterSpacing={10} opacity={0.8}>
          NOW
        </text>
        {/* gouge scratches + chips */}
        {Array.from({ length: 10 }).map((_, i) => (
          <path key={i} d={`M${-220 + i * 48},${-160 + (i % 3) * 12} l${12 - (i % 2) * 24},${150 + (i % 3) * 10}`} stroke="#140806" strokeWidth={4} opacity={0.7} />
        ))}
      </g>
    ) : null}
  </g>
);

/** the 2016 fern, still with him, very dead */
const DeadFern: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: 7 }).map((_, i) => {
      const a = -60 + i * 20;
      const r = (a * Math.PI) / 180;
      const len = 70 + (i % 3) * 14;
      const tip: Pt = [Math.sin(r) * len + Math.sin(r) * 40, -Math.cos(r) * len * 0.4 - 10 + len * 0.3];
      return <path key={i} d={`M0,-30 Q${tip[0] * 0.4},${-70} ${tip[0]},${tip[1]}`} stroke="#6a5a34" strokeWidth={7} fill="none" strokeLinecap="round" strokeDasharray="6 5" />;
    })}
    <path d="M-40,-36 L40,-36 L32,24 L-32,24 Z" fill="#7a4a2e" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-46} y={-46} width={92} height={16} rx={4} fill="#8a5a3a" stroke={INK} strokeWidth={4} />
    <path d="M-20,-20 l14,30 l10,-14" stroke="#2a1a10" strokeWidth={3} fill="none" />
    <circle cx={8} cy={-4} r={10} fill="#bcb39a" stroke={INK} strokeWidth={2.5} />
    <path d="M3,-6 l4,4 M7,-6 l-4,4 M9,-6 l4,4 M13,-6 l-4,4" stroke={INK} strokeWidth={1.6} />
  </g>
);

/* ------------------------------------------------------------------ */
/* The dark: light pool, dust, eyes, claws                             */
/* ------------------------------------------------------------------ */

// eyes live in the dark: the arches, the chasm side, the gap by the gates — never inside the frog's silhouette
const EYE_SPOTS: Array<[number, number, number]> = [
  [640, 520, 1.0],
  [470, 560, 0.9],
  [210, 640, 1.1],
  [1560, 420, 0.9],
  [760, 300, 0.8],
  [-60, 560, 1.2],
  [1120, 300, 0.7],
  [420, 380, 1.0],
  [1820, 640, 1.0],
  [560, 700, 1.1],
  [1300, 200, 0.8],
  [60, 300, 0.9],
  [1390, 770, 0.8],
  [1700, 260, 0.9],
  [300, 820, 1.2],
  [1960, 420, 1.0],
];

type Box = { x0: number; y0: number; x1: number; y1: number };
/** the frog's silhouette in the hall (front view) — no eyes drawn over him */
const FROG_BOX: Box = { x0: 770, y0: 350, x1: 1200, y1: 920 };

export const DarkEyes: React.FC<{ t: number; amount: number; near?: number; exclude?: Box | null }> = ({ t, amount, near = 0, exclude = FROG_BOX }) => {
  const n = Math.round(amount * EYE_SPOTS.length);
  return (
    <g>
      {EYE_SPOTS.slice(0, n).map(([ex, ey, s], i) => {
        const dx = noise2D(`edx${i}`, t * 0.3, 0) * 14 + (FROG_N.x - ex) * near * 0.25;
        const dy = noise2D(`edy${i}`, 0, t * 0.3) * 8 + (HEAD_N.y - ey) * near * 0.15;
        const px = ex + dx;
        const py = ey + dy;
        if (exclude && px > exclude.x0 - 40 && px < exclude.x1 + 40 && py > exclude.y0 - 20 && py < exclude.y1) return null;
        const blinkK = Math.floor(t * 0.7 + i * 0.37);
        const blink = rnd(`eb${i}${blinkK}`) < 0.18 && (t * 0.7 + i * 0.37) % 1 < 0.12;
        const sz = s * (1 + near * 0.4);
        return (
          <g key={i} transform={`translate(${ex + dx} ${ey + dy}) scale(${sz})`} style={{ mixBlendMode: "screen" }}>
            <ellipse cx={0} cy={0} rx={46} ry={22} fill="#ff6a1a" opacity={0.22} />
            {blink ? (
              <path d="M-22,0 L-8,0 M8,0 L22,0" stroke="#ffd04a" strokeWidth={3} />
            ) : (
              <>
                <path d="M-26,0 Q-15,-9 -4,0 Q-15,7 -26,0 Z" fill="#ffd84a" />
                <path d="M4,0 Q15,-9 26,0 Q15,7 4,0 Z" fill="#ffd84a" />
                <ellipse cx={-15} cy={0} rx={2} ry={4.5} fill="#2a0a04" />
                <ellipse cx={15} cy={0} rx={2} ry={4.5} fill="#2a0a04" />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** long shadow fingers creeping over the floor and walls toward the light */
const Claws: React.FC<{ t: number; amount: number }> = ({ t, amount }) => {
  if (amount <= 0) return null;
  // four hands of shadow: two crawl along the floor, two down the walls, reaching into the torchlight
  const hands: Array<[Pt, number, number, number]> = [
    [[-260, FLOOR_Y + 30], 4, 1, 1.0],
    [[2240, FLOOR_Y + 40], 176, -1, 1.0],
    [[180, -60], 38, 1, 0.62],
    [[1820, -80], 142, -1, 0.62],
  ];
  return (
    <g>
      {hands.map(([o, ang, side, sc], h) => {
        const reach = (300 + amount * 860) * sc;
        return (
          <g key={h}>
            {Array.from({ length: 4 }).map((_, i) => {
              const a = ((ang + (i - 1.5) * 8 + Math.sin(t * 2 + i + h) * 3) * Math.PI) / 180;
              const len = reach * (0.82 + (i === 1 || i === 2 ? 0.18 : 0));
              const pts: Pt[] = [];
              for (let s = 0; s <= 7; s++) {
                const k = s / 7;
                const wob = Math.sin(k * 7 + t * 3 + i) * 16 * k;
                pts.push([o[0] + Math.cos(a) * len * k - Math.sin(a) * wob * side, o[1] + Math.sin(a) * len * k * (h < 2 ? 0.22 : 1) + Math.cos(a) * wob]);
              }
              const d = smoothPath(pts, false);
              const tip = pts[pts.length - 1];
              return (
                <g key={i}>
                  <path d={d} stroke="#8a1a0a" strokeWidth={46 - i * 2} strokeLinecap="round" fill="none" opacity={0.7} />
                  <path d={d} stroke="#030202" strokeWidth={36 - i * 2} strokeLinecap="round" fill="none" />
                  {/* a hooked nail at each fingertip */}
                  <path d={`M${tip[0]},${tip[1]} q${side * 26},-6 ${side * 30},${18}`} stroke="#030202" strokeWidth={10} fill="none" strokeLinecap="round" />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

const Dust: React.FC<{ t: number; boom: number; rumble: number }> = ({ t, boom, rumble }) => {
  const motes = useMemo(() => Array.from({ length: 46 }).map((_, i) => [rnd(`dm${i}`) * 2600 - 340, rnd(`dmy${i}`), 1.5 + rnd(`dms${i}`) * 3, 60 + rnd(`dmv${i}`) * 90] as const), []);
  return (
    <g>
      {motes.map(([x, y0, s, v], i) => {
        const y = ((y0 * 1300 + t * v * (1 + boom * 2)) % 1300) - 300;
        return <circle key={i} cx={x + Math.sin(t + i) * 10} cy={y} r={s} fill="#c8b89a" opacity={0.25 + rumble * 0.2 + boom * 0.4} />;
      })}
      {boom > 0.2
        ? Array.from({ length: 10 }).map((_, i) => (
            <path key={i} d={`M${200 + i * 170 + (rnd(`ds${i}`) - 0.5) * 80},-200 l${(rnd(`dsx${i}`) - 0.5) * 20},${300 + boom * 500}`} stroke="#b8a888" strokeWidth={6 + rnd(`dsw${i}`) * 8} opacity={boom * 0.35} strokeLinecap="round" />
          ))
        : null}
    </g>
  );
};

/** darkness with a hole of torchlight (+ warm wash); things drawn after it glow */
const DarkPool: React.FC<{ id: string; strength: number; flick: number; ambient?: number; light?: { x: number; y: number }; radius?: number }> = ({ id, strength, flick, ambient = 0.25, light, radius = 1 }) => {
  const r = (520 + flick * 60) * (0.25 + strength * 0.75) * radius;
  const L = light ?? { x: TORCH.x - 80, y: TORCH.y + 160 };
  return (
    <g>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={L.x} cy={L.y} r={r * 2.2}>
          <stop offset="0" stopColor="#000" stopOpacity={0.05} />
          <stop offset="0.32" stopColor="#000" stopOpacity={0.26} />
          <stop offset="0.62" stopColor="#020101" stopOpacity={0.84 - ambient * 0.3} />
          <stop offset="1" stopColor="#020101" stopOpacity={0.97 - ambient * 0.36} />
        </radialGradient>
        <radialGradient id={`${id}w`} gradientUnits="userSpaceOnUse" cx={TORCH.x} cy={TORCH.y} r={r * 1.3}>
          <stop offset="0" stopColor="#ffb050" stopOpacity={0.55 * strength} />
          <stop offset="1" stopColor="#ff8a2a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-1600} y={-1400} width={5200} height={3400} fill={`url(#${id})`} />
      <rect x={-1600} y={-1400} width={5200} height={3400} fill={`url(#${id}w)`} style={{ mixBlendMode: "screen" }} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

export interface HallSceneProps {
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  frog?: Partial<FrogProps> | false;
  st?: Partial<HallState>;
  shake?: number;
  front?: React.ReactNode;
  /** drawn after the darkness (glows) */
  glow?: React.ReactNode;
}

export const HallScene: React.FC<HallSceneProps> = ({ from, to, cam, ease = easeInOut, frog = {}, st = {}, shake = 1, front, glow }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = cam ?? (to ? camLerp(from, to, ease(shot.p)) : from);
  const sp = useSpeech();
  const boom = st.boom ?? boomAt(t);
  const rum = rumbleAt(t);
  const S: HallState = { torch: 1, eyes: 0, claws: 0, carveNow: 1, gateGlow: 0, ambient: 0.25, radius: 1, ...st, boom };
  const f2 = onN(frame, 2);
  const flick = noise2D("hallfl", f2 / 5, 1) + boom * 1.2;
  const strength = clamp(S.torch * (0.9 + boom * 0.25));
  return (
    <Stage cam={c} frame={frame} shakeAmp={(rum * 2.2 + boom * 15) * shake} bg="#020101">
      <BackWall />
      <Carving now={S.carveNow} />
      <Pillar x={1300} w={130} top={-900} />
      <Pillar x={300} w={170} top={-900} />
      <Floor />
      <Bridge t={t} boom={boom} />
      <Gates t={t} boom={boom} hits={boomCount(t)} glow={S.gateGlow} />
      <DeadFern x={800} y={FLOOR_Y} />
      {frog ? <Frog id="wendellNow" x={FROG_N.x} y={FROG_N.y} t={t} frame={frame} {...sp} now pose="crouch" hold="journal" writing={0.6} glow={0.8 * strength} {...frog} /> : null}
      <Torch t={t} frame={frame} strength={strength} />
      {front}
      <Dust t={t} boom={boom} rumble={rum} />
      <DarkPool id="hallDark" strength={strength} flick={flick} ambient={S.ambient} light={S.light} radius={S.radius} />
      <AbyssGlow boom={boom} />
      <Claws t={t} amount={S.claws} />
      <DarkEyes t={t} amount={S.eyes} />
      {glow}
    </Stage>
  );
};

/** the chasm breathes red light from far below (pulses with the drums) */
const AbyssGlow: React.FC<{ boom: number }> = ({ boom }) => (
  <g style={{ mixBlendMode: "screen" }}>
    <defs>
      <radialGradient id="abyssGlow" gradientUnits="userSpaceOnUse" cx={120} cy={1120} r={900}>
        <stop offset="0" stopColor="#ff4a1a" stopOpacity={0.62 + boom * 0.3} />
        <stop offset="0.5" stopColor="#c0200a" stopOpacity={0.26 + boom * 0.2} />
        <stop offset="1" stopColor="#c0200a" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-1000} y={300} width={2200} height={1700} fill="url(#abyssGlow)" />
  </g>
);

/* ------------------------------------------------------------------ */
/* Cutaways in the dark                                                */
/* ------------------------------------------------------------------ */

/** the turn: MY POLITICS / NOW carved on the wall, his huge shadow flickering over it */
export const CarvedTitle: React.FC = () => {
  const { shot, timeline } = useEpisode();
  const { t, frame } = shot;
  const nowAt = timeline.lines[0].words.find((w) => w.word.trim().toLowerCase().startsWith("now"))?.start ?? 22.3;
  const k = clamp((t - nowAt + 0.05) / 0.18);
  const e = timeline.energy[Math.floor(t * timeline.fps)] ?? 0;
  const f2 = onN(frame, 2);
  const fl = 0.55 + e * 0.6 + noise2D("ctfl", f2 / 4, 0) * 0.15;
  const cam = camLerp({ x: 900, y: 360, zoom: 2.3 }, { x: 900, y: 370, zoom: 1.9 }, easeOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} shakeAmp={k > 0 && k < 1 ? 10 : e * 3} bg="#020101">
      <BackWall />
      <Carving now={easeOut(k)} />
      {/* his shadow, enormous, cast up the wall by the torch below */}
      <g opacity={0.7} transform={`translate(${1150 + noise2D("shx", f2 / 6, 0) * 10} 900) scale(${2.6 + fl * 0.15})`}>
        <path d="M-120,0 C-130,-120 -90,-200 -40,-220 C-80,-260 -70,-330 -20,-330 C10,-330 20,-300 30,-290 C50,-320 100,-320 110,-280 C150,-260 140,-200 90,-200 C130,-160 140,-80 130,0 Z" fill="#000" />
      </g>
      <rect x={-600} y={-600} width={3000} height={2200} fill="#000" opacity={clamp(0.62 - fl * 0.55)} />
      <defs>
        <radialGradient id="ctGlow" gradientUnits="userSpaceOnUse" cx={900} cy={700} r={900}>
          <stop offset="0" stopColor="#ff9a3a" stopOpacity={0.6 * fl} />
          <stop offset="1" stopColor="#ff6a1a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-600} y={-600} width={3000} height={2200} fill="url(#ctGlow)" style={{ mixBlendMode: "screen" }} />
    </Stage>
  );
};

/** the journal, close: his 2016 podcast notebook — neat talking points on the left, the scrawl on the right */
export const JournalInsert: React.FC<{ lines: number; from?: Cam; to?: Cam; shakeK?: number; last?: boolean; dark?: number }> = ({ lines, from, to, shakeK = 1, last = false, dark = 0 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = camLerp(from ?? { x: 960, y: 560, zoom: 1.05 }, to ?? { x: 1010, y: 560, zoom: 1.15 }, easeInOut(shot.p));
  const boom = boomAt(t);
  const SCRAWL = [
    "we have taken the bridge",
    "and the second hall",
    "we have barred the gates",
    "cannot hold them for long",
    "the ground shakes",
    "drums. drums in the deep",
    "we cannot get out",
    "shadows in the dark",
    "we cannot get out",
    "they are coming",
  ];
  const shown = Math.min(SCRAWL.length, Math.floor(lines));
  const partial = lines - Math.floor(lines);
  const f2 = onN(frame, 2);
  const penLine = Math.min(SCRAWL.length - 1, shown);
  const penX = 1060 + Math.min(1, partial) * 560 + (rnd(`pen${f2}`) - 0.5) * 16;
  const penY = 250 + penLine * 66 + (rnd(`peny${f2}`) - 0.5) * 8;
  return (
    <Stage cam={cam} frame={frame} shakeAmp={(boom * 12 + 1.5) * shakeK} bg="#0a0605">
      <rect x={-600} y={-600} width={3200} height={2400} fill="#1a120c" />
      {/* the book */}
      <path d="M150,130 L1790,110 L1820,1000 L120,1010 Z" fill="#4a2e1a" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <path d="M190,160 L950,150 L960,970 L170,980 Z" fill="#e8dcb8" stroke={INK} strokeWidth={6} />
      <path d="M970,150 L1760,140 L1780,960 L980,970 Z" fill="#dccfa6" stroke={INK} strokeWidth={6} />
      <path d="M950,150 L960,970 M970,150 L980,970" stroke="#8a7a58" strokeWidth={6} />
      {/* left page: the 2016 talking points, neat, with a smiley sun */}
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d={`M220,${240 + i * 62} L920,${236 + i * 62}`} stroke="#9ab8d8" strokeWidth={2.5} />
      ))}
      <path d="M300,160 L300,960" stroke="#e08a8a" strokeWidth={3} />
      <g fontFamily="PatrickHand" fill="#1f3a6e">
        <text x={330} y={228} fontSize={46}>
          EP. 4 — talking points
        </text>
        <text x={340} y={294} fontSize={38}>
          1. restrain the gov't ✓
        </text>
        <text x={340} y={356} fontSize={38}>
          2. end the war on drugs ✓
        </text>
        <text x={340} y={418} fontSize={38}>
          3. rise above the binary ✓
        </text>
        <text x={340} y={480} fontSize={38}>
          4. know peace :)
        </text>
      </g>
      <g transform="translate(760 640)">
        <circle r={60} fill="#ffe25a" stroke="#1f3a6e" strokeWidth={4} />
        {Array.from({ length: 10 }).map((_, i) => (
          <path key={i} d="M0,-74 L0,-98" stroke="#1f3a6e" strokeWidth={4} transform={`rotate(${i * 36})`} />
        ))}
        <path d="M-24,10 q24,24 48,0" stroke="#1f3a6e" strokeWidth={4} fill="none" />
        <circle cx={-20} cy={-12} r={5} fill="#1f3a6e" />
        <circle cx={20} cy={-12} r={5} fill="#1f3a6e" />
        {/* scratched out, recently */}
        <path d="M-90,-90 L90,90 M90,-90 L-90,90 M-80,-60 L80,70" stroke="#1a0c08" strokeWidth={10} strokeLinecap="round" />
      </g>
      <text x={330} y={880} fontFamily="PatrickHand" fontSize={30} fill="#1f3a6e" opacity={0.8}>
        listeners: 3 (2?)
      </text>
      {/* right page: the scrawl, shakier every line */}
      <g fontFamily="PatrickHand" fill="#1a0c08">
        {SCRAWL.slice(0, shown).map((s, i) => (
          <text key={i} x={1010 + (rnd(`sx${i}`) - 0.5) * 20} y={250 + i * 66} fontSize={44 + i * 1.5} transform={`rotate(${(rnd(`sr${i}`) - 0.5) * (2 + i * 0.8)} 1300 ${250 + i * 66})`} opacity={0.92}>
            {s}
          </text>
        ))}
        {shown < SCRAWL.length && partial > 0 ? (
          <g>
            <defs>
              <clipPath id="jwrite">
                <rect x={980} y={190 + shown * 66} width={20 + partial * 760} height={80} />
              </clipPath>
            </defs>
            <text x={1010} y={250 + shown * 66} fontSize={44 + shown * 1.5} clipPath="url(#jwrite)" transform={`rotate(${(rnd(`sr${shown}`) - 0.5) * (2 + shown * 0.8)} 1300 ${250 + shown * 66})`}>
              {SCRAWL[shown]}
            </text>
          </g>
        ) : null}
      </g>
      {last ? <path d={`M1560,${250 + 9 * 66 + 10} q80,10 120,80 q30,60 140,120`} stroke="#1a0c08" strokeWidth={6} fill="none" strokeLinecap="round" /> : null}
      {/* blots + a frantic doodle of eyes in the margin */}
      <path d={blob(1680, 860, 26, 18, 8, 0.4, "jb1")} fill="#1a0c08" opacity={0.85} />
      <path d={blob(1100, 900, 14, 10, 7, 0.4, "jb2")} fill="#1a0c08" opacity={0.7} />
      {lines > 6
        ? [0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${1640 + (i % 2) * 50} ${300 + i * 90})`}>
              <path d="M-26,0 Q-14,-12 -4,0 Q-14,8 -26,0 Z M4,0 Q14,-12 26,0 Q14,8 4,0 Z" fill="none" stroke="#1a0c08" strokeWidth={4} />
              <circle cx={-14} cy={-1} r={3} fill="#1a0c08" />
              <circle cx={14} cy={-1} r={3} fill="#1a0c08" />
            </g>
          ))
        : null}
      {/* his hand + pencil, scribbling */}
      {!last ? (
        <g transform={`translate(${penX} ${penY}) scale(1.7)`}>
          {/* torn grey sleeve from the bottom right */}
          <path d="M120,110 C220,190 330,260 560,420" stroke={INK} strokeWidth={118} strokeLinecap="round" fill="none" />
          <path d="M120,110 C220,190 330,260 560,420" stroke="#8c8d82" strokeWidth={104} strokeLinecap="round" fill="none" />
          <path d="M150,170 l30,-20 l10,30 l26,-16 M230,250 l20,-30 l16,26" stroke={INK} strokeWidth={4} fill="none" />
          {/* the pencil stub, chewed */}
          <path d="M0,0 L14,-6 L132,84 L118,104 Z" fill="#d9a83a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M0,0 L14,-6 L22,10 Z" fill="#e8d6b0" stroke={INK} strokeWidth={3} />
          <path d="M0,0 L5,-2 L4,4 Z" fill={INK} />
          <path d="M122,80 L138,92 L126,110 L110,98 Z" fill="#e08aa0" stroke={INK} strokeWidth={4} />
          {/* grey-green frog hand: palm, three fingers wrapped over the pencil, thumb under */}
          <ellipse cx={92} cy={86} rx={52} ry={42} fill="#6f7a50" stroke={INK} strokeWidth={6} transform="rotate(32 92 86)" />
          {[
            [26, 2],
            [44, -8],
            [64, -2],
          ].map(([fx, fy], i) => (
            <g key={i}>
              <path d={`M84,${60 + i * 6} Q${fx + 20},${fy - 10} ${fx},${fy}`} stroke={INK} strokeWidth={24} strokeLinecap="round" fill="none" />
              <path d={`M84,${60 + i * 6} Q${fx + 20},${fy - 10} ${fx},${fy}`} stroke="#6f7a50" strokeWidth={13} strokeLinecap="round" fill="none" />
              <circle cx={fx} cy={fy} r={11} fill="#7c8858" stroke={INK} strokeWidth={4} />
            </g>
          ))}
          <path d="M70,110 Q40,90 28,40" stroke={INK} strokeWidth={24} strokeLinecap="round" fill="none" />
          <path d="M70,110 Q40,90 28,40" stroke="#5a6440" strokeWidth={13} strokeLinecap="round" fill="none" />
          <circle cx={28} cy={40} r={11} fill="#6a7450" stroke={INK} strokeWidth={4} />
          <path d={blob(100, 96, 18, 10, 7, 0.4, "handgrime")} fill="#2c2618" opacity={0.4} />
        </g>
      ) : null}
      {/* torchlight falloff */}
      <defs>
        <radialGradient id="jDark" gradientUnits="userSpaceOnUse" cx={1100} cy={420} r={1250}>
          <stop offset="0" stopColor="#000" stopOpacity={0.05 + dark * 0.6} />
          <stop offset="0.55" stopColor="#000" stopOpacity={0.45 + dark * 0.4} />
          <stop offset="1" stopColor="#000" stopOpacity={0.92} />
        </radialGradient>
      </defs>
      <rect x={-600} y={-600} width={3200} height={2400} fill="url(#jDark)" />
      <rect x={-600} y={-600} width={3200} height={2400} fill="#ff9a3a" opacity={0.08 + boom * 0.1} style={{ mixBlendMode: "screen" }} />
    </Stage>
  );
};

/** looking down into the chasm: something far below beats the drums */
export const TheDeep: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const boom = boomAt(t, 0.3);
  const cam = camLerp({ x: 960, y: 520, zoom: 1.0 }, { x: 960, y: 600, zoom: 1.25 }, easeInOut(shot.p));
  const strike = boomAt(t, 0.12);
  return (
    <Stage cam={cam} frame={frame} shakeAmp={boom * 18 + 2} bg="#020101">
      {/* rock walls converging into the dark, their rims lit red from below */}
      {Array.from({ length: 7 }).map((_, i) => {
        const k = i / 6;
        const w = lerp(2600, 520, k);
        const y = lerp(-320, 880, k);
        const d = blob(960, y, w / 2, 100 + k * 40, 14, 0.22, `deep${i}`);
        return (
          <g key={i}>
            <path d={d} fill={`rgb(${Math.round(lerp(74, 34, k))},${Math.round(lerp(58, 20, k))},${Math.round(lerp(48, 16, k))})`} stroke={INK} strokeWidth={7} />
            <path d={d} fill="none" stroke="#ff5a22" strokeWidth={8} opacity={(0.18 + boom * 0.45) * (0.4 + k * 0.6)} />
          </g>
        );
      })}
      {/* the red glow at the bottom */}
      <ellipse cx={960} cy={900} rx={420} ry={120} fill="#ff3a10" opacity={0.3 + boom * 0.55} />
      <ellipse cx={960} cy={900} rx={240} ry={66} fill="#ffb03a" opacity={0.35 + boom * 0.5} />
      {/* the great drum */}
      <g transform="translate(960 900)">
        <path d="M-120,-10 L-104,70 L104,70 L120,-10 Z" fill="#1a0806" stroke="#000" strokeWidth={6} />
        <ellipse cx={0} cy={-10} rx={120} ry={30} fill={boom > 0.5 ? "#5a1a0a" : "#2a0c06"} stroke="#000" strokeWidth={6} />
        {Array.from({ length: 6 }).map((_, i) => (
          <path key={i} d={`M${-110 + i * 44},-2 L${-96 + i * 38},66`} stroke="#000" strokeWidth={4} />
        ))}
      </g>
      {/* silhouettes round it: hunched horned drummers, mallets up / down on the beat */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        const dx = 960 + Math.cos(a) * 250;
        const dy = 900 + Math.sin(a) * 66;
        const up = 1 - strike;
        const s = 1.1 + (Math.sin(a) + 1) * 0.35;
        const toward = Math.cos(a) > 0 ? -1 : 1;
        return (
          <g key={i} transform={`translate(${dx} ${dy}) scale(${s * toward} ${s})`}>
            <path d="M-30,0 C-36,-50 -20,-86 6,-90 C30,-86 40,-50 30,0 Z" fill="#000" />
            <circle cx={14} cy={-96} r={18} fill="#000" />
            <path d="M6,-108 q-18,-26 -6,-40 M22,-108 q14,-24 4,-40" stroke="#000" strokeWidth={6} fill="none" strokeLinecap="round" />
            <circle cx={20} cy={-98} r={3.5} fill="#ff6a2a" />
            <path d={`M24,-70 L${58 + up * 6},${-70 - up * 58}`} stroke="#000" strokeWidth={9} strokeLinecap="round" />
            <circle cx={58 + up * 6} cy={-70 - up * 58} r={10} fill="#000" />
          </g>
        );
      })}
      {/* embers rising */}
      {Array.from({ length: 16 }).map((_, i) => {
        const ph = (t * 0.35 + i / 16) % 1;
        return <circle key={i} cx={960 + noise2D(`emb${i}`, t * 0.4, i) * 400 * (1 - ph * 0.3)} cy={900 - ph * 1100} r={3 + (1 - ph) * 3} fill="#ff8a2a" opacity={(1 - ph) * 0.8} style={{ mixBlendMode: "screen" }} />;
      })}
      {/* shockwave rings on each beat */}
      {boom > 0.2 ? <ellipse cx={960} cy={900} rx={200 + (1 - boom) * 700} ry={50 + (1 - boom) * 170} fill="none" stroke="#ff6a2a" strokeWidth={6} opacity={boom * 0.6} /> : null}
    </Stage>
  );
};

/** reverse: from behind the frog into the dark hall; eyes open in the black */
export const HallReverse: React.FC<{ eyes: number; near?: number; claws?: number; torch?: number }> = ({ eyes, near = 0, claws = 0, torch = 1 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const boom = boomAt(t);
  const cam = camLerp({ x: 900, y: 560, zoom: 1.0 }, { x: 920, y: 540, zoom: 1.12 }, easeInOut(shot.p));
  const f2 = onN(frame, 2);
  const fl = noise2D("revfl", f2 / 5, 0) * 0.1 + boom * 0.2;
  return (
    <Stage cam={cam} frame={frame} shakeAmp={boom * 12 + 1.5} bg="#020101">
      <rect x={-800} y={-800} width={3600} height={2800} fill="#0c0908" />
      {/* receding pillars into the dark */}
      {Array.from({ length: 6 }).map((_, i) => {
        const k = i / 5;
        const sc = lerp(1, 0.25, k);
        const off = lerp(620, 120, k);
        return (
          <g key={i} opacity={lerp(0.9, 0.2, k)}>
            {[-1, 1].map((sd) => (
              <rect key={sd} x={960 + sd * off - 70 * sc} y={lerp(-300, 300, k)} width={140 * sc} height={lerp(1300, 400, k)} fill="#4a4034" stroke={INK} strokeWidth={5} />
            ))}
          </g>
        );
      })}
      <path d="M-800,820 L2800,820 L2800,2000 L-800,2000 Z" fill="#1e1915" />
      <Claws t={t} amount={claws} />
      {/* the frog from behind: hunched back, eye bumps, mushrooms; lit by the torch on his right */}
      <g transform="translate(560 1080) scale(1.5)">
        <path d="M-170,0 C-180,-120 -120,-200 -40,-210 L40,-210 C120,-200 180,-120 170,0 Z" fill="#3c4a3a" stroke={INK} strokeWidth={6} />
        <path d="M-150,-40 l20,-30 l20,24 l18,-30 l16,26 l20,-32 l18,28 l20,-26 l16,30 l20,-24" stroke={INK} strokeWidth={3} fill="none" opacity={0.6} />
        <path d="M-120,-320 C-140,-240 -80,-200 0,-200 C80,-200 140,-240 120,-320 C100,-370 -100,-370 -120,-320 Z" fill="#4a5634" stroke={INK} strokeWidth={6} />
        <circle cx={-64} cy={-356} r={44} fill="#4a5634" stroke={INK} strokeWidth={6} />
        <circle cx={64} cy={-360} r={48} fill="#4a5634" stroke={INK} strokeWidth={6} />
        <path d="M-130,-300 C-90,-330 90,-334 132,-296" stroke="#c8bea4" strokeWidth={14} fill="none" />
        <g transform="translate(-100 -330) rotate(-30)">
          <path d="M-3,0 L-4,-20 L4,-20 L3,0 Z" fill="#c8bca0" stroke={INK} strokeWidth={3} />
          <path d="M-22,-18 C-20,-38 20,-38 22,-18 Z" fill="#8a5a3a" stroke={INK} strokeWidth={3.5} />
        </g>
        <path d="M-60,-404 L-112,-370 M60,-410 L118,-374" stroke={INK} strokeWidth={8} />
        {/* rim light from the torch (right) */}
        <path d="M150,-60 C170,-130 140,-190 60,-206 M110,-320 C130,-290 120,-250 90,-230" stroke="#ff9a4a" strokeWidth={8} fill="none" opacity={0.7 * torch} />
      </g>
      <defs>
        <radialGradient id="revDark" gradientUnits="userSpaceOnUse" cx={760} cy={760} r={1100 * (0.6 + torch * 0.4)}>
          <stop offset="0" stopColor="#000" stopOpacity={0.05} />
          <stop offset="0.5" stopColor="#000" stopOpacity={0.42 - fl} />
          <stop offset="1" stopColor="#000" stopOpacity={0.86} />
        </radialGradient>
      </defs>
      <rect x={-800} y={-800} width={3600} height={2800} fill="url(#revDark)" />
      <rect x={-800} y={-800} width={3600} height={2800} fill="#ff8a3a" opacity={0.06 * torch} style={{ mixBlendMode: "screen" }} />
      {/* the eyes gather toward the middle of the hall (and stay inside a 9:16 crop) */}
      <g transform="translate(960 520) scale(0.7) translate(-960 -520)">
        {/* exclude = the frog's back (screen x 300-830, y 460-1080) mapped back through this transform */}
        <DarkEyes t={t} amount={eyes} near={near + 1.6} exclude={{ x0: 17, y0: 434, x1: 774, y1: 1320 }} />
      </g>
    </Stage>
  );
};

/** the silent punchline: the torch flares and the shadows step into the light */
export const TailReveal: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const flare = easeOut(clamp((local - 0.35) / 0.25));
  const lean = easeInOut(clamp((local - 0.5) / 0.9));
  const out = local > 2.25;
  const cam = camLerp({ x: HEAD_N.x, y: HEAD_N.y + 120, zoom: 1.5 }, { x: HEAD_N.x, y: HEAD_N.y + 90, zoom: 1.62 }, easeOut(clamp(local / 2.2)));
  return (
    <HallScene
      from={cam}
      frog={{ expr: "terror", hold: "journal", writing: 0, look: [0.1 * Math.sin(local * 6), -0.2], tremble: 1, mouth: "X", talking: false, glow: 1 }}
      st={{ torch: out ? 0 : 0.25 + flare * 0.75, eyes: flare > 0.5 ? 0 : 1, claws: 0, boom: 0, carveNow: 1, light: { x: HEAD_N.x - 10, y: HEAD_N.y + 160 }, radius: 1 + flare * 0.5, ambient: 0.2 }}
      shake={0.4}
      front={
        <g>
          <Tusker id="tuskTail" x={lerp(470, 600, lean)} y={FLOOR_Y + 40} t={t} frame={frame} grin open={0.2 + lean * 0.2} reach={lean * 0.6} look={[0.8, 0.3]} rosette={1} />
          <Brayer id="brayTail" x={lerp(1500, 1360, lean)} y={FLOOR_Y + 40} flip t={t} frame={frame} grin open={0.2 + lean * 0.2} reach={lean * 0.6} look={[0.8, 0.3]} rosette={1} />
        </g>
      }
      glow={out ? <rect x={-1000} y={-1000} width={4000} height={3000} fill="#000" /> : null}
    />
  );
};
