import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { noise2D } from "@remotion/noise";
import { Cat, CatProps } from "../../characters/Cat";
import { INK } from "../../characters/parts";
import { TallFigure } from "../../characters/TallFigure";
import { useEpisode } from "../../engine/context";
import { Cam, LightWash, ScreenFlash, Stage, camLerp } from "../../engine/Stage";
import { energyAt, isTalking, mouthAt } from "../../engine/timeline";
import { blob, easeInOut, easeOut, lerp, onN, prog, rnd } from "../../engine/util";

/* EPISODE 003 set: a kitchen at 3 AM. The cat sits on the forbidden counter; Mother waits in the doorway. */

export const CAT_POS = { x: 1360, y: 640 };
export const CAT_HEAD = { x: CAT_POS.x - 18, y: CAT_POS.y - 332 };
export const MOM_POS = { x: 360, y: 905 };

export const CAM3 = {
  wide: { x: 960, y: 540, zoom: 1.0 },
  wideIn: { x: 1000, y: 520, zoom: 1.1 },
  cuCat: { x: CAT_HEAD.x - 10, y: CAT_HEAD.y + 40, zoom: 2.7 },
  ecuCat: { x: CAT_HEAD.x - 15, y: CAT_HEAD.y + 20, zoom: 4.4 },
  msCat: { x: CAT_HEAD.x - 20, y: CAT_POS.y - 200, zoom: 1.75 },
} satisfies Record<string, Cam>;

export function useCatSpeech() {
  const { timeline, shot } = useEpisode();
  const tq = onN(shot.frame, 2) / shot.fps;
  return { mouth: mouthAt(timeline, "crumpet", tq), talking: isTalking(timeline, "crumpet", shot.t), energy: energyAt(timeline, shot.t) };
}

/* ------------------------------------------------------------------ */

const Floor: React.FC = () => {
  const tiles = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let r = 0; r < 14; r++)
      for (let c = 0; c < 26; c++) {
        const x = -600 + c * 130;
        const y = 900 + r * 90;
        out.push(<rect key={`${r}-${c}`} x={x} y={y} width={130} height={90} fill={(r + c) % 2 ? "#2e2c30" : "#3d3a3f"} />);
      }
    return out;
  }, []);
  return (
    <g>
      <rect x={-600} y={900} width={3400} height={1400} fill="#2e2c30" />
      {tiles}
      <line x1={-600} y1={900} x2={2800} y2={900} stroke={INK} strokeWidth={6} />
    </g>
  );
};

/** The "#1 MOM" mug. */
export const Mug: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M28,-60 C62,-60 62,-18 28,-18" fill="none" stroke={INK} strokeWidth={16} />
    <path d="M28,-60 C62,-60 62,-18 28,-18" fill="none" stroke="#efeae0" strokeWidth={9} />
    <path d="M-34,-80 L34,-80 L30,0 L-30,0 Z" fill="#efeae0" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <text x={0} y={-30} textAnchor="middle" fontFamily="PatrickHand" fontSize={26} fill="#c2324a">
      #1 MOM
    </text>
  </g>
);

export const KitchenBackdrop: React.FC<{ t: number; frame: number; hallLight?: number }> = ({ t, frame, hallLight = 1 }) => {
  const tt = onN(frame, 2) / 24;
  const buzz = noise2D("hall", tt * 4, 0) > 0.7 ? 0.82 : 1;
  return (
    <g>
      {/* wall + faded diamond wallpaper */}
      <rect x={-600} y={-1300} width={3400} height={2300} fill="#23302e" />
      {Array.from({ length: 22 }).map((_, i) => (
        <path key={i} d={`M${-560 + i * 160},-1300 L${-560 + i * 160 + 80},900`} stroke="#2a3836" strokeWidth={18} />
      ))}
      {/* doorway with warm hallway light */}
      <defs>
        <linearGradient id="hall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3dca0" />
          <stop offset="1" stopColor="#c99a52" />
        </linearGradient>
      </defs>
      <rect x={196} y={150} width={330} height={750} fill="url(#hall)" opacity={0.92 * hallLight * buzz} />
      <rect x={196} y={150} width={330} height={750} fill="none" stroke="#141b1a" strokeWidth={22} />
      <path d={`M196,900 L526,900 L760,1300 L60,1300 Z`} fill="#f3dca0" opacity={0.16 * hallLight * buzz} />
      {/* window with moon */}
      <rect x={1520} y={120} width={300} height={260} fill="#1d2a44" stroke="#141b1a" strokeWidth={18} />
      <circle cx={1700} cy={200} r={44} fill="#ddd68f" />
      <path d="M1670,190 a10,10 0 1,0 1,0" fill="#c7bf73" />
      <path d="M1670,120 L1670,380 M1520,250 L1820,250" stroke="#141b1a" strokeWidth={12} />
      <path d="M1500,110 C1540,220 1520,330 1550,400 L1500,400 Z" fill="#6e2a3a" stroke={INK} strokeWidth={5} />
      <path d="M1840,110 C1800,220 1820,330 1790,400 L1840,400 Z" fill="#6e2a3a" stroke={INK} strokeWidth={5} />
      {/* clock: 3:07 AM */}
      <g transform="translate(1090 170)">
        <circle r={56} fill="#e9e3d2" stroke={INK} strokeWidth={6} />
        <line x1={0} y1={0} x2={30} y2={0} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <line x1={0} y1={0} x2={6} y2={-42} stroke={INK} strokeWidth={4} strokeLinecap="round" transform={`rotate(${42 + Math.floor(t) * 6} 0 0)`} />
        <circle r={5} fill={INK} />
      </g>
      {/* fridge with Mother's crayon drawing of her "son" */}
      <g transform="translate(600 900)">
        <rect x={0} y={-640} width={270} height={640} rx={20} fill="#c9cbc3" stroke={INK} strokeWidth={7} />
        <line x1={0} y1={-420} x2={270} y2={-420} stroke={INK} strokeWidth={5} />
        <rect x={232} y={-600} width={14} height={120} rx={6} fill="#8e918a" stroke={INK} strokeWidth={3} />
        <rect x={232} y={-380} width={14} height={160} rx={6} fill="#8e918a" stroke={INK} strokeWidth={3} />
        <g transform="translate(40 -390) rotate(-4)">
          <rect x={0} y={0} width={150} height={120} fill="#f6f2e6" stroke={INK} strokeWidth={3} />
          <circle cx={75} cy={58} r={28} fill="none" stroke="#7a7f88" strokeWidth={5} />
          <path d="M55,36 l6,-16 l8,12 M88,32 l8,-14 l4,16" stroke="#7a7f88" strokeWidth={5} fill="none" />
          <path d="M66,60 q9,8 18,0" stroke="#c2324a" strokeWidth={4} fill="none" />
          <text x={75} y={112} textAnchor="middle" fontFamily="PatrickHand" fontSize={20} fill="#c2324a">
            MY SON ♥
          </text>
        </g>
        <circle cx={60} cy={-560} r={12} fill="#e3b33c" stroke={INK} strokeWidth={3} />
      </g>
      <Floor />
      {/* counter (right) */}
      <rect x={930} y={640} width={1300} height={34} fill="#cfc8b6" stroke={INK} strokeWidth={6} />
      <rect x={950} y={674} width={1280} height={226} fill="#4a3326" stroke={INK} strokeWidth={6} />
      {[1090, 1350, 1610, 1870].map((cx) => (
        <g key={cx}>
          <rect x={cx - 110} y={694} width={220} height={186} fill="#553b2c" stroke={INK} strokeWidth={4} />
          <rect x={cx - 26} y={710} width={52} height={10} rx={5} fill="#b8a77a" stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {/* stuff he already knocked over */}
      <path d={blob(1080, 960, 150, 22, 10, 0.25, "milk")} fill="#efece4" opacity={0.85} stroke={INK} strokeWidth={3} />
      <path d="M1000,950 l40,-14 l18,20 Z M1130,966 l30,-10 l6,22 Z M1060,975 l22,-6 l-4,18 Z" fill="#efeae0" stroke={INK} strokeWidth={3} />
      <path d={blob(1720, 610, 46, 30, 8, 0.15, "pot")} fill="#3f6a3a" stroke={INK} strokeWidth={4} />
      <path d="M1690,640 L1700,600 L1740,600 L1750,640 Z" fill="#a25a38" stroke={INK} strokeWidth={4} />
    </g>
  );
};

/** Mother (silhouette style, like every tall skinny one) — robe, curlers, green face mask, spray bottle. */
export const Mother: React.FC<{ x: number; y: number; h?: number; t: number; frame: number; raise?: number; flip?: boolean }> = ({
  x,
  y,
  h = 700,
  t,
  frame,
  raise = 0,
  flip = false,
}) => (
  <TallFigure
    id="mother"
    x={x}
    y={y}
    h={h}
    t={t}
    frame={frame}
    flip={flip}
    grin={0}
    eyes="dots"
    hat={false}
    curlers
    face="#86b56f"
    robe="#c9799b"
    holdF="spray"
    sway={0.4}
    pose={{ armF: [lerp(18, 96, raise), lerp(8, -4, raise)], armB: [-8, -6], legF: [3, -2], legB: [-3, 2] }}
  />
);

/* ------------------------------------------------------------------ */
/* Scenes                                                              */
/* ------------------------------------------------------------------ */

export interface KitchenSceneProps {
  from: Cam;
  to?: Cam;
  ease?: (x: number) => number;
  cat?: Partial<CatProps>;
  momRaise?: number;
  mug?: { x: number; y: number; rot: number } | false;
  shakeAmp?: number;
  overlay?: React.ReactNode;
  front?: React.ReactNode;
}

export const KitchenScene: React.FC<KitchenSceneProps> = ({ from, to, ease = easeInOut, cat = {}, momRaise = 0, mug, shakeAmp = 0, overlay, front }) => {
  const { shot } = useEpisode();
  const sp = useCatSpeech();
  const cam = to ? camLerp(from, to, ease(shot.p)) : from;
  const m = mug === undefined ? { x: CAT_POS.x - 190, y: CAT_POS.y, rot: 0 } : mug;
  return (
    <Stage cam={cam} frame={shot.frame} shakeAmp={shakeAmp} overlay={overlay ?? <LightWash id="moonwash" color="#7da0d8" cx={1700} cy={200} r={900} opacity={0.25} />}>
      <KitchenBackdrop t={shot.t} frame={shot.frame} />
      <Mother x={MOM_POS.x} y={MOM_POS.y} t={shot.t} frame={shot.frame} raise={momRaise} />
      {m ? <Mug x={m.x} y={m.y} rot={m.rot} /> : null}
      <Cat id="crumpet" x={CAT_POS.x} y={CAT_POS.y} t={shot.t} frame={shot.frame} {...sp} {...cat} />
      {front}
    </Stage>
  );
};

/** Cat's paw shoves the mug off the counter (starts at `at` seconds into the shot). */
export function useMugShove(at: number) {
  const { shot } = useEpisode();
  const l = shot.local;
  const push = easeInOut(prog(l, at - 0.4, at));
  const fall = Math.max(0, l - at);
  const x = CAT_POS.x - 190 - push * 60 - fall * 120;
  const y = CAT_POS.y + fall * fall * 1600;
  const rot = -fall * 420;
  return { paw: push * (1 - prog(l, at + 0.4, at + 0.8)), mug: { x, y, rot } };
}

/** Extreme close-up of Mother's hand and the spray bottle. */
export const SprayCloseup: React.FC<{ rise?: number; squeeze?: number }> = ({ rise = 1, squeeze = 0 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const yOff = lerp(700, 0, easeOut(rise));
  const glint = Math.max(0, 1 - Math.abs(shot.local - 0.9) / 0.15);
  const finger = squeeze * 26;
  const cam = camLerp({ x: 960, y: 540, zoom: 1 }, { x: 960, y: 520, zoom: 1.08 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} shakeAmp={squeeze > 0 ? 1.5 : 0.6}>
      <defs>
        <radialGradient id="sprbg">
          <stop offset="0" stopColor="#c99a52" stopOpacity="0.6" />
          <stop offset="1" stopColor="#0d0b0e" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect x={-600} y={-1300} width={3400} height={3600} fill="#0d0b0e" />
      <circle cx={760} cy={420} r={900} fill="url(#sprbg)" />
      <g transform={`translate(${980} ${560 + yOff}) rotate(-12)`}>
        {/* bottle */}
        <path d="M-120,40 L120,40 L140,520 Q0,580 -140,520 Z" fill="#8cc3e0" opacity={0.85} stroke={INK} strokeWidth={9} />
        <path d="M-126,230 L128,230 L140,520 Q0,580 -140,520 Z" fill="#4f97c4" opacity={0.9} />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={-60 + i * 40} cy={300 + ((t * 60 + i * 40) % 200)} r={6 + i} fill="#cfe8f6" opacity={0.6} />
        ))}
        <rect x={-70} y={-40} width={140} height={90} rx={14} fill="#f2f0ea" stroke={INK} strokeWidth={8} />
        <path d="M-50,-40 L-50,-170 L190,-170 L190,-110 L40,-110 L40,-40 Z" fill="#f2f0ea" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <circle cx={196} cy={-140} r={12} fill={INK} />
        <circle cx={204} cy={-146} r={30} fill="#fff" opacity={glint * 0.8} />
        {/* trigger */}
        <path d={`M-30,-20 C${-110 - finger},${10} ${-120 - finger},${110} ${-60 - finger * 0.6},${150}`} fill="none" stroke="#f2f0ea" strokeWidth={40} strokeLinecap="round" />
        <path d={`M-30,-20 C${-110 - finger},${10} ${-120 - finger},${110} ${-60 - finger * 0.6},${150}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        {/* palm, long skinny fingers (dark) + pink robe sleeve */}
        <path d="M-300,40 C-250,20 -200,60 -190,160 C-180,280 -200,380 -250,440 C-290,470 -320,420 -330,300 Z" fill="#0b090d" />
        <path d={`M-260,${30 + finger} C-200,${10 + finger} -140,${20 + finger * 0.6} ${-96 - finger},${70}`} fill="none" stroke="#0b090d" strokeWidth={26} strokeLinecap="round" />
        <path d="M-280,150 C-200,150 -120,170 -90,240" fill="none" stroke="#0b090d" strokeWidth={26} strokeLinecap="round" />
        <path d="M-290,250 C-210,260 -140,290 -110,340" fill="none" stroke="#0b090d" strokeWidth={26} strokeLinecap="round" />
        <path d="M-300,350 C-230,360 -160,380 -130,430" fill="none" stroke="#0b090d" strokeWidth={24} strokeLinecap="round" />
        <path d="M-520,120 C-420,80 -330,110 -280,180 L-300,460 C-380,500 -470,480 -560,440 Z" fill="#c9799b" stroke={INK} strokeWidth={8} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={-520 + i * 50} cy={130 + (i % 2) * 20} r={22} fill="#d98aab" stroke={INK} strokeWidth={4} />
        ))}
      </g>
    </Stage>
  );
};

/** Mother's deadpan eyes behind the green face mask. */
export const MotherEyesCloseup: React.FC = () => {
  const { shot } = useEpisode();
  const { frame } = shot;
  const cam = camLerp({ x: 960, y: 520, zoom: 1.0 }, { x: 960, y: 510, zoom: 1.12 }, easeInOut(shot.p));
  const blots = useMemo(() => Array.from({ length: 30 }).map((_, i) => [520 + rnd(`mk${i}`) * 880, 160 + rnd(`mky${i}`) * 820, 10 + rnd(`mkr${i}`) * 26] as const), []);
  return (
    <Stage cam={cam} frame={frame}>
      <rect x={-600} y={-1300} width={3400} height={3600} fill="#e2c37f" />
      <rect x={-600} y={-1300} width={3400} height={3600} fill="#0d0b0e" opacity={0.55} />
      {/* curlers */}
      {[-300, -150, 0, 150, 300].map((dx, i) => (
        <rect key={i} x={960 + dx - 60} y={-40 + (i % 2) * 30} width={120} height={150} rx={40} fill="#e889b0" stroke={INK} strokeWidth={9} transform={`rotate(${(i - 2) * 9} ${960 + dx} 40)`} />
      ))}
      {/* face with clay mask */}
      <path d={blob(960, 640, 520, 560, 18, 0.03, "momface")} fill="#86b56f" stroke={INK} strokeWidth={12} />
      {blots.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#6f9a5a" opacity={0.6} />
      ))}
      {/* two cucumber slices pushed up on the forehead */}
      {[780, 1140].map((cx, i) => (
        <g key={i} transform={`translate(${cx} 230)`}>
          <circle r={70} fill="#4f8a3a" stroke={INK} strokeWidth={7} />
          <circle r={56} fill="#cfe6a0" />
          {Array.from({ length: 8 }).map((_, k) => (
            <ellipse key={k} cx={Math.cos((k / 8) * Math.PI * 2) * 30} cy={Math.sin((k / 8) * Math.PI * 2) * 30} rx={6} ry={10} fill="#9cc070" transform={`rotate(${(k / 8) * 360} ${Math.cos((k / 8) * Math.PI * 2) * 30} ${Math.sin((k / 8) * Math.PI * 2) * 30})`} />
          ))}
        </g>
      ))}
      {/* eye holes + dead stare */}
      {[760, 1160].map((cx, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={520} rx={150} ry={100} fill="#d9b49a" stroke="#5a7a4a" strokeWidth={6} />
          <ellipse cx={cx} cy={520} rx={104} ry={56} fill="#efe6d0" stroke={INK} strokeWidth={8} />
          <path d={`M${cx - 96},${506} q30,8 50,-2 M${cx + 40},${530} q24,-6 50,6`} stroke="#b3262a" strokeWidth={3} fill="none" />
          <circle cx={cx + (i === 0 ? 18 : -18)} cy={524} r={20} fill="#1a0e08" />
          <path d={`M${cx - 110},${508} Q${cx},${462} ${cx + 110},${508} L${cx + 110},${430} L${cx - 110},${430} Z`} fill="#d9b49a" stroke={INK} strokeWidth={8} />
          <path d={`M${cx - 96},${590} Q${cx},${620} ${cx + 96},${590}`} fill="none" stroke="#9a7a62" strokeWidth={7} />
        </g>
      ))}
      {/* flat mouth line under the mask */}
      <path d="M840,930 L1080,930" stroke={INK} strokeWidth={12} strokeLinecap="round" />
    </Stage>
  );
};

/** Reverse angle: over the cat's shoulder at Mother stepping closer, bottle up. */
export const OverShoulderScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const step = easeInOut(prog(local, 0.0, 0.95));
  const cam = camLerp({ x: 960, y: 520, zoom: 1.0 }, { x: 960, y: 480, zoom: 1.06 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="hallwash" color="#f3dca0" cx={500} cy={300} r={900} opacity={0.25} />}>
      <rect x={-600} y={-1300} width={3400} height={3600} fill="#1b2422" />
      <rect x={560} y={80} width={420} height={900} fill="#f3dca0" opacity={0.85} />
      <rect x={560} y={80} width={420} height={900} fill="none" stroke="#141b1a" strokeWidth={24} />
      <rect x={-600} y={980} width={3400} height={1400} fill="#2e2c30" />
      <Mother x={lerp(770, 820, step)} y={1080} h={lerp(1050, 1120, step)} t={t} frame={frame} raise={1} />
      {/* the cat from behind (foreground silhouette) */}
      <g transform="translate(1380 1200)">
        <path d="M-260,0 C-280,-200 -180,-330 0,-340 C180,-330 280,-200 260,0 Z" fill="#4d5259" stroke={INK} strokeWidth={8} />
        <path d="M-170,-560 L-150,-700 L-60,-610 Z" fill="#4d5259" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d="M60,-610 L150,-700 L170,-560 Z" fill="#4d5259" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <path d={blob(0, -470, 200, 160, 14, 0.04, "catback")} fill="#5a5f67" stroke={INK} strokeWidth={8} />
        <path d="M-100,-560 q30,30 0,60 M100,-560 q-30,30 0,60 M0,-600 q20,40 0,80" stroke="#3e4248" strokeWidth={14} fill="none" strokeLinecap="round" />
      </g>
    </Stage>
  );
};

/** Small screen-space credit in the top-left corner (any output size). */
const Credit: React.FC<{ text: string }> = ({ text }) => {
  const { width } = useVideoConfig();
  return (
    <text x={width > 1200 ? 48 : 40} y={64} fontFamily="SpecialElite" fontSize={width > 1200 ? 30 : 34} fill="#d8d0bf" opacity={0.85}>
      {text}
    </text>
  );
};

/** The punchline: water hits the cat square in the face. */
export const SprayHitScene: React.FC<{ drenched?: boolean }> = ({ drenched = false }) => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const hit = drenched ? 1 : easeOut(prog(local, 0, 0.12));
  const mist = drenched ? 0 : 1 - prog(local, 0.25, 0.6);
  const cam = drenched ? camLerp(CAM3.cuCat, { ...CAM3.cuCat, zoom: 2.5 }, easeInOut(shot.p)) : CAM3.ecuCat;
  const particles = useMemo(
    () => Array.from({ length: 70 }).map((_, i) => ({ y: (rnd(`mp${i}`) - 0.5) * 160, sp: 900 + rnd(`ms${i}`) * 1400, r: 3 + rnd(`mr${i}`) * 8, d: rnd(`md${i}`) * 0.25 })),
    [],
  );
  const burst = useMemo(() => Array.from({ length: 26 }).map((_, i) => ({ a: rnd(`ba${i}`) * Math.PI * 2, sp: 200 + rnd(`bs${i}`) * 500 })), []);
  const tx = CAT_HEAD.x - 40;
  const ty = CAT_HEAD.y + 20;
  return (
    <Stage
      cam={cam}
      frame={frame}
      shakeAmp={drenched ? 0 : 18 * (1 - prog(local, 0.1, 0.5))}
      overlay={
        !drenched && local < 0.12 ? (
          <ScreenFlash color="#ffffff" opacity={0.8 * (1 - local / 0.12)} />
        ) : (
          <>
            <LightWash id="moonwash2" color="#7da0d8" cx={1700} cy={200} r={900} opacity={0.25} />
            {drenched ? <Credit text="voice: burialgoods" /> : null}
          </>
        )
      }
    >
      <KitchenBackdrop t={t} frame={frame} />
      <Cat
        id="crumpet"
        x={CAT_POS.x}
        y={CAT_POS.y}
        t={t}
        frame={frame}
        mouth={drenched ? "X" : "D"}
        expr={drenched ? "drenched" : "sprayed"}
        poof={drenched ? 0 : hit}
        wet={drenched ? 1 : hit * 0.6}
        headTilt={drenched ? -4 : 10}
      />
      {mist > 0 ? (
        <g opacity={mist}>
          <path d={`M${tx - 700},${ty - 30} L${tx},${ty - 110} L${tx},${ty + 110} L${tx - 700},${ty + 30} Z`} fill="#dff1fb" opacity={0.35} />
          {particles.map((p, i) => {
            const lt = Math.max(0, local - p.d);
            const x = tx - 700 + Math.min(700, lt * p.sp);
            return <circle key={i} cx={x} cy={ty + p.y * (0.2 + (x - tx + 700) / 700)} r={p.r} fill="#cfe8f6" stroke={INK} strokeWidth={1.2} />;
          })}
          {burst.map((b, i) => {
            const d = Math.min(1, local / 0.5) * b.sp;
            return <ellipse key={i} cx={tx + Math.cos(b.a) * d} cy={ty + Math.sin(b.a) * d * 0.7 + local * local * 600} rx={7} ry={11} fill="#9fd0f0" stroke={INK} strokeWidth={2} />;
          })}
        </g>
      ) : null}
      {drenched ? (
        <g>
          <path d={blob(CAT_POS.x - 10, CAT_POS.y + 8, 170, 16, 10, 0.2, "puddle")} fill="#9fd0f0" opacity={0.6} stroke={INK} strokeWidth={3} />

        </g>
      ) : null}
    </Stage>
  );
};

