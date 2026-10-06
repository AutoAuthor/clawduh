import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage } from "../../engine/Stage";
import { blob, onN, rnd } from "../../engine/util";
import { MOTH_HEAD, Moth, MothProps } from "./cast/Moth";
import { FONT, useCam, useSpeech } from "./common";
import { Bulb, BulbGlow, Siding, Swarm, Zapper, ZapperGlow } from "./lamp";

/* EPISODE 008 main set: the PORCH RAIL of a shabby house at night, at moth scale. The bulb hangs above the brothers. */

export const WICK_POS = { x: 600, y: 905 };
export const TAT_POS = { x: 1230, y: 905 };
export const BULB = { x: 930, y: 150, r: 34 };
export const ZAP = { x: 1650, y: 340, s: 0.62 };

/** world head positions (cameras + 9:16 speaker follow) */
export const HEADS = {
  wick: { x: WICK_POS.x + MOTH_HEAD.wick[0], y: WICK_POS.y + MOTH_HEAD.wick[1] },
  tatter: { x: TAT_POS.x - MOTH_HEAD.tatter[0], y: TAT_POS.y + MOTH_HEAD.tatter[1] },
};

export const CAM8 = {
  wide: { x: 940, y: 520, zoom: 0.92 },
  wideHigh: { x: 930, y: 430, zoom: 0.95 },
  two: { x: 910, y: 610, zoom: 1.3 },
  cuW: { x: HEADS.wick.x + 30, y: HEADS.wick.y + 34, zoom: 2.5 },
  ecuW: { x: HEADS.wick.x + 42, y: HEADS.wick.y + 2, zoom: 4.3 },
  msW: { x: HEADS.wick.x + 50, y: HEADS.wick.y + 150, zoom: 1.65 },
  cuT: { x: HEADS.tatter.x - 30, y: HEADS.tatter.y + 34, zoom: 2.5 },
  ecuT: { x: HEADS.tatter.x - 42, y: HEADS.tatter.y + 2, zoom: 4.3 },
  msT: { x: HEADS.tatter.x - 50, y: HEADS.tatter.y + 150, zoom: 1.65 },
  bulb: { x: BULB.x, y: BULB.y + 40, zoom: 2.8 },
  lookUp: { x: 800, y: 330, zoom: 1.45 },
  zap: { x: ZAP.x, y: ZAP.y + 20, zoom: 2.6 },
} satisfies Record<string, Cam>;

/* ------------------------------------------------------------------ */
/* Backdrop                                                            */
/* ------------------------------------------------------------------ */

const YARD_X = 330;

const Yard: React.FC<{ t: number }> = ({ t }) => {
  const stars = useMemo(() => Array.from({ length: 26 }).map((_, i) => [-900 + rnd(`ys${i}`) * 1220, -700 + rnd(`ysy${i}`) * 900, 1 + rnd(`ysr${i}`) * 2] as const), []);
  return (
    <g>
      <defs>
        <linearGradient id="yardSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060914" />
          <stop offset="0.6" stopColor="#14193a" />
          <stop offset="1" stopColor="#2a2240" />
        </linearGradient>
      </defs>
      <rect x={-1200} y={-900} width={YARD_X + 1200} height={1900} fill="url(#yardSky)" />
      {stars.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#e8e4d0" opacity={0.5 + 0.3 * Math.sin(t * 1.3 + i)} />
      ))}
      {/* the moon (the light Tatter once chased) */}
      <circle cx={110} cy={150} r={86} fill="#f4ecc8" opacity={0.12} />
      <circle cx={110} cy={150} r={56} fill="#efe6c2" stroke={INK} strokeWidth={4} />
      <circle cx={92} cy={136} r={11} fill="#d7cca2" />
      <circle cx={128} cy={170} r={8} fill="#d7cca2" />
      <circle cx={124} cy={128} r={5} fill="#d7cca2" />
      {/* far yard: tree, fence, a car on blocks */}
      <path d={`M-1200,640 Q-700,560 -300,610 T${YARD_X},600 L${YARD_X},1000 L-1200,1000 Z`} fill="#0d1120" />
      <path d="M-420,620 C-460,420 -380,300 -300,330 C-260,250 -150,260 -140,360 C-80,380 -90,520 -170,560 L-200,640 L-240,640 L-250,560 C-330,580 -400,600 -420,620 Z" fill="#0a0d18" />
      {Array.from({ length: 14 }).map((_, i) => (
        <path key={i} d={`M${-1100 + i * 100},700 L${-1100 + i * 100},790`} stroke="#2a3048" strokeWidth={4} />
      ))}
      <path d="M-1150,710 L340,710 M-1150,760 L340,760" stroke="#2a3048" strokeWidth={3} strokeDasharray="10 8" />
      <g transform="translate(-40 790)" opacity={0.9}>
        <path d="M-120,0 L-110,-50 L-60,-80 L60,-80 L110,-50 L130,0 Z" fill="#1b1c26" stroke="#0a0b10" strokeWidth={4} />
        <rect x={-100} y={0} width={30} height={30} fill="#262630" />
        <rect x={60} y={0} width={30} height={30} fill="#262630" />
      </g>
    </g>
  );
};

const WasteWeb: React.FC<{ t: number }> = ({ t }) => {
  const sway = Math.sin(t * 0.8) * 4;
  return (
    <g opacity={0.8}>
      <path d={`M${YARD_X + 40},-80 L${YARD_X + 360},-60 M${YARD_X + 40},-80 L${YARD_X + 250},140 M${YARD_X + 40},-80 L${YARD_X + 60},260`} stroke="#c9c4b8" strokeWidth={2} opacity={0.5} />
      {[0.25, 0.45, 0.65, 0.85].map((k, i) => (
        <path key={i} d={`M${YARD_X + 40 + 320 * k},${-80 + 20 * k} Q${YARD_X + 40 + 210 * k},${-80 + 150 * k} ${YARD_X + 40 + 20 * k},${-80 + 340 * k}`} stroke="#c9c4b8" strokeWidth={1.6} fill="none" opacity={0.45} />
      ))}
      {/* a silk-wrapped moth mummy, slowly turning */}
      <path d={`M${YARD_X + 190},20 L${YARD_X + 190 + sway},90`} stroke="#d8d4c8" strokeWidth={1.5} />
      <g transform={`translate(${YARD_X + 190 + sway} 130) rotate(${sway * 2})`}>
        <ellipse rx={18} ry={42} fill="#ddd8cc" stroke={INK} strokeWidth={3} />
        <path d="M-16,-24 L16,-14 M-17,-6 L17,4 M-16,12 L16,22 M-12,28 L12,36" stroke="#b9b4a6" strokeWidth={2} />
        <path d="M-6,-40 q-10,-18 -20,-22 M6,-40 q10,-18 20,-22" stroke="#6a5a48" strokeWidth={3} fill="none" />
      </g>
    </g>
  );
};

const LiveLaughLove: React.FC = () => (
  <g transform="translate(1290 255) rotate(-7)">
    <path d="M-120,-60 L0,-118 L120,-60" stroke="#2a2420" strokeWidth={3} fill="none" />
    <circle cx={0} cy={-120} r={5} fill="#8a8a80" stroke={INK} strokeWidth={2} />
    <rect x={-130} y={-60} width={260} height={92} rx={8} fill="#d8cdb6" stroke={INK} strokeWidth={5} />
    <text x={0} y={-24} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={27} fill="#4a3a32">
      Live Laugh
    </text>
    <text x={0} y={14} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={30} fill="#7a2a2a">
      Love
    </text>
    {/* a squashed bug smear across it */}
    <path d={blob(70, 0, 16, 9, 8, 0.4, "lllsmear")} fill="#5a4a30" opacity={0.8} />
    <path d="M70,0 l26,8" stroke="#5a4a30" strokeWidth={4} opacity={0.6} />
  </g>
);

const WindowTV: React.FC<{ frame: number }> = ({ frame }) => {
  const f3 = onN(frame, 3);
  const tv = 0.45 + rnd(`tv${Math.floor(f3 / 3)}`) * 0.4;
  return (
    <g>
      <rect x={1940} y={250} width={360} height={420} fill="#0e1622" stroke={INK} strokeWidth={10} />
      <rect x={1950} y={260} width={340} height={400} fill="#5a8ad8" opacity={tv * 0.35} />
      {/* yellowed blind, half torn down */}
      <path d="M1950,260 L2290,260 L2290,360 L2180,400 L2120,350 L1950,380 Z" fill="#c9b98a" stroke={INK} strokeWidth={4} />
      {[290, 320, 350].map((y) => (
        <path key={y} d={`M1950,${y} L2290,${y}`} stroke="#a8986a" strokeWidth={3} />
      ))}
      {/* a dead houseplant silhouette */}
      <path d="M2200,660 L2210,600 L2250,600 L2260,660 Z M2230,600 C2210,560 2190,540 2170,560 M2230,600 C2240,550 2270,540 2290,520" fill="#141012" stroke="#141012" strokeWidth={5} />
      <path d="M1940,670 L2300,670" stroke={INK} strokeWidth={14} />
    </g>
  );
};

const ScreenDoor: React.FC = () => (
  <g>
    <rect x={2400} y={160} width={400} height={760} fill="#2e2a24" stroke={INK} strokeWidth={10} />
    <rect x={2430} y={190} width={340} height={700} fill="#1a1c20" />
    {Array.from({ length: 18 }).map((_, i) => (
      <path key={i} d={`M2430,${190 + i * 39} L2770,${190 + i * 39}`} stroke="#3a3e44" strokeWidth={1.5} />
    ))}
    {/* torn screen + duct-tape X */}
    <path d="M2560,380 L2640,330 L2690,420 L2610,470 Z" fill="#0c0d10" stroke="#5a5e66" strokeWidth={2} />
    <path d="M2520,560 L2700,680 M2700,560 L2520,680" stroke="#a9a9a2" strokeWidth={26} opacity={0.9} />
    <text x={2690} y={300} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#c9b47a">
      1
    </text>
    <text x={2740} y={286} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#c9b47a" transform="rotate(180 2740 272)">
      3
    </text>
  </g>
);

const Ceiling: React.FC = () => (
  <g>
    <rect x={YARD_X - 60} y={-900} width={3000} height={780} fill="#1f1c1a" />
    {Array.from({ length: 22 }).map((_, i) => (
      <path key={i} d={`M${YARD_X - 60 + i * 140},-900 L${YARD_X - 60 + i * 140},-120`} stroke="#141110" strokeWidth={5} />
    ))}
    <rect x={YARD_X - 60} y={-150} width={3000} height={40} fill="#2c2722" stroke={INK} strokeWidth={5} />
    {/* wasp nest under the eave */}
    <g transform="translate(560 -100)">
      <path d={blob(0, 40, 46, 56, 11, 0.12, "wasp")} fill="#8a8072" stroke={INK} strokeWidth={4} />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M-40,${14 + i * 16} Q0,${22 + i * 16} 40,${14 + i * 16}`} stroke="#6a6052" strokeWidth={3} fill="none" />
      ))}
      <ellipse cx={0} cy={92} rx={9} ry={6} fill="#141010" />
    </g>
  </g>
);

const Post: React.FC = () => (
  <g>
    <rect x={YARD_X - 70} y={-900} width={110} height={1900} fill="#8e877a" stroke={INK} strokeWidth={7} />
    <rect x={YARD_X - 70} y={-900} width={30} height={1900} fill="#6c6559" />
    {[120, 420, 700].map((y, i) => (
      <path key={i} d={blob(YARD_X - 10, y, 30, 60, 9, 0.4, `postchip${i}`)} fill="#5a544a" opacity={0.7} />
    ))}
  </g>
);

const Rail: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const chips = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        x: -900 + rnd(`rc${i}`) * 3800,
        w: 40 + rnd(`rcw${i}`) * 140,
        y: 912 + rnd(`rcy${i}`) * 50,
      })),
    [],
  );
  const f2 = onN(frame, 2);
  return (
    <g>
      {/* balusters below (in shadow) */}
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} x={-900 + i * 300} y={975} width={120} height={900} fill="#2a2621" stroke={INK} strokeWidth={6} />
      ))}
      {/* the plank: top face + front face, peeling white paint over grey wood */}
      <rect x={-1000} y={884} width={4200} height={24} fill="#cfc8b4" stroke={INK} strokeWidth={5} />
      <rect x={-1000} y={906} width={4200} height={74} fill="#b3ab98" stroke={INK} strokeWidth={6} />
      {chips.map((c, i) => (
        <path key={i} d={blob(c.x, c.y, c.w / 2, 9, 9, 0.35, `rch${i}`)} fill="#7b7366" stroke={INK} strokeWidth={2} />
      ))}
      <path d="M-1000,958 L3200,958" stroke="#9c9482" strokeWidth={3} />
      {/* nail heads */}
      {[-200, 960, 2100].map((nx, i) => (
        <g key={i}>
          <circle cx={nx} cy={940} r={12} fill="#6a5a4a" stroke={INK} strokeWidth={3} />
          <path d={`M${nx - 4},${952} q2,20 -4,30`} stroke="#7a3a1a" strokeWidth={5} opacity={0.6} fill="none" />
        </g>
      ))}
      {/* bottle cap (left), dead fly on its back */}
      <g transform="translate(230 896)">
        <ellipse cx={0} cy={0} rx={70} ry={16} fill="#6a1a1a" stroke={INK} strokeWidth={4} />
        <path d="M-70,0 L-66,-22 L66,-22 L70,0" fill="#a8302a" stroke={INK} strokeWidth={4} />
        <ellipse cx={0} cy={-22} rx={66} ry={14} fill="#c43a30" stroke={INK} strokeWidth={4} />
        {Array.from({ length: 10 }).map((_, i) => (
          <path key={i} d={`M${-62 + i * 14},-20 l2,18`} stroke={INK} strokeWidth={2} />
        ))}
      </g>
      <g transform="translate(400 892)">
        <ellipse rx={16} ry={10} fill="#1a1414" stroke={INK} strokeWidth={2.5} />
        {[-1, 0, 1].map((k) => (
          <path key={k} d={`M${k * 6},-6 l${k * 4 - 2},-14 l6,-4`} stroke="#1a1414" strokeWidth={2.5} fill="none" />
        ))}
        <ellipse cx={-14} cy={4} rx={12} ry={6} fill="#cfd6dc" opacity={0.6} stroke={INK} strokeWidth={1} />
      </g>
      {/* a smouldering cigarette butt (lipstick on the filter) */}
      <g transform="translate(1600 890) rotate(-4)">
        <rect x={-120} y={-16} width={170} height={30} rx={8} fill="#e9e3d4" stroke={INK} strokeWidth={4} />
        <rect x={50} y={-16} width={80} height={30} rx={8} fill="#d89a4a" stroke={INK} strokeWidth={4} />
        <path d="M70,-14 l8,28 M94,-14 l-6,28" stroke="#b4783a" strokeWidth={3} />
        <path d="M118,-12 q8,10 0,22" stroke="#c43a4a" strokeWidth={6} fill="none" />
        <ellipse cx={-120} cy={-1} rx={8} ry={15} fill="#3a2a22" stroke={INK} strokeWidth={3} />
        <circle cx={-124} cy={-1} r={6} fill="#ff7a2a" opacity={0.6 + noise2D("cig", t * 2, 0) * 0.4} />
      </g>
      {[0, 1, 2].map((i) => {
        const ph = (t * 0.25 + i / 3) % 1;
        const sx = 1478 + noise2D(`cs${i}`, f2 / 40, 0) * 20;
        return <path key={i} d={`M${sx},${880 - ph * 260} q-22,-30 0,-60 q22,-30 0,-60`} stroke="#b8b4ac" strokeWidth={8} fill="none" opacity={0.35 * (1 - ph)} strokeLinecap="round" />;
      })}
    </g>
  );
};

export interface PorchSet {
  /** bulb brightness */
  bulb: number;
  /** god rays */
  rays: number;
  zap: number;
  count: number;
  /** extra darkness (0..1) e.g. for the flashback transition */
  dark: number;
  swarm: number;
}

const DEFAULT_SET: PorchSet = { bulb: 1, rays: 0.5, zap: 0, count: 4998, dark: 0, swarm: 1 };

export const PorchBackdrop: React.FC<{ t: number; frame: number; set: PorchSet }> = ({ t, frame, set }) => (
  <g>
    <Yard t={t} />
    <Siding x0={YARD_X} x1={3200} y0={-150} y1={900} col="#3c4a40" seed="porchwall" step={44} />
    <Ceiling />
    <WasteWeb t={t} />
    <LiveLaughLove />
    <WindowTV frame={frame} />
    <ScreenDoor />
    {/* moth-dust prints on the wall around the bulb */}
    {Array.from({ length: 7 }).map((_, i) => {
      const px = BULB.x + (rnd(`pp${i}`) - 0.5) * 520;
      const py = BULB.y + 40 + rnd(`ppy${i}`) * 280;
      return (
        <g key={i} transform={`translate(${px} ${py}) rotate(${(rnd(`ppa${i}`) - 0.5) * 50}) scale(${0.35 + rnd(`pps${i}`) * 0.3})`} opacity={0.3}>
          <path d="M0,-6 C-30,-40 -70,-26 -64,6 C-50,26 -20,22 0,10 C20,22 50,26 64,6 C70,-26 30,-40 0,-6 Z" fill="#e9dcc0" />
        </g>
      );
    })}
    <Post />
  </g>
);

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

export interface PorchSceneProps {
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  wick?: Partial<MothProps> | false;
  tatter?: Partial<MothProps> | false;
  set?: Partial<PorchSet>;
  shakeAmp?: number;
  back?: React.ReactNode;
  /** drawn on the wall, behind the rail (shadows) */
  wall?: React.ReactNode;
  front?: React.ReactNode;
  overlay?: React.ReactNode;
  /** draw Tatter in front of Wick (he steps forward) */
  tatterFront?: boolean;
}

export const PorchScene: React.FC<PorchSceneProps> = ({ from, to, cam, ease, wick = {}, tatter = {}, set = {}, shakeAmp = 0, back, wall, front, overlay, tatterFront = false }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = useCam(from, to, ease, cam);
  const st = { ...DEFAULT_SET, ...set };
  const sw = useSpeech("wick");
  const sT = useSpeech("tatter");
  const W = wick ? <Moth key="w" id="wick" kind="wick" x={WICK_POS.x} y={WICK_POS.y} t={t} frame={frame} glint={0.9} {...sw} {...wick} /> : null;
  const Tt = tatter ? <Moth key="t" id="tatter" kind="tatter" x={TAT_POS.x} y={TAT_POS.y} flip t={t} frame={frame} {...sT} {...tatter} /> : null;
  return (
    <Stage cam={c} frame={frame} shakeAmp={shakeAmp} overlay={overlay}>
      <PorchBackdrop t={t} frame={frame} set={st} />
      <ZapperGlow id="pzg" x={ZAP.x} y={ZAP.y} s={ZAP.s} t={t} zap={st.zap} />
      <BulbGlow id="pbg" x={BULB.x} y={BULB.y} r={BULB.r} t={t} on={st.bulb} rays={st.rays} glowR={900} />
      <Zapper id="pz" x={ZAP.x} y={ZAP.y} s={ZAP.s} t={t} frame={frame} zap={st.zap} count={st.count} />
      <Bulb id="pb" x={BULB.x} y={BULB.y} r={BULB.r} t={t} on={st.bulb} />
      {st.swarm > 0 ? (
        <g opacity={st.swarm}>
          <Swarm cx={BULB.x} cy={BULB.y + 10} rx={130} ry={80} t={t} n={7} s={0.55} seed="psw" />
        </g>
      ) : null}
      {wall}
      {/* depth haze: pushes the wall back behind the cast */}
      <rect x={-2000} y={-2000} width={6000} height={2890} fill="#070912" opacity={0.2} />
      <Rail t={t} frame={frame} />
      {back}
      {tatterFront ? [W, Tt] : [Tt, W]}
      {front}
      {/* warm light falling over everyone from the bulb */}
      <BulbGlow id="pfront" x={BULB.x} y={BULB.y} r={BULB.r} t={t} on={st.bulb * 0.32} rays={0} glowR={1500} />
      {st.dark > 0 ? <rect x={-2000} y={-2000} width={6000} height={5000} fill="#05060c" opacity={st.dark} /> : null}
    </Stage>
  );
};

