import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { INK } from "../../characters/parts";
import { mixHex } from "../../characters/Possum";
import { useEpisode } from "../../engine/context";
import { Cam, Stage, camLerp } from "../../engine/Stage";
import { energyAt, isTalking, mouthAt } from "../../engine/timeline";
import { blob, clamp, easeInOut, easeOutBack, onN, rnd } from "../../engine/util";
import { Ferret, SkeeterProps, skeeterHead } from "./cast/Ferret";
import { Mule, MuleProps, muleHead } from "./cast/Mule";
import { FONT, SqueakLines, SqueakyToy } from "./cast/props";

/* EPISODE 006 set: MR. DOBBINS' LIVING ROOM, 2:14 AM. Wood panelling, plastic-covered sofa, a wall of family portraits
   that are all him, the porch cam on the TV, a LIVE LAUGH LURE sign. One world, many cameras. */

export const FLOOR = 905;
export const SKEETER_POS = { x: 1240, y: 968 };
export const DOB_POS = { x: 620, y: 960 };
export const DOB_NEAR = 840;
export const DOB_BEHIND = { x: 1620, y: 940 };
export const LAMP_X = 498;
export const TOY_POS = { x: 1150, y: 984 };

export const HEADS = {
  skeeter: skeeterHead(SKEETER_POS.x, SKEETER_POS.y, true),
  dobbins: muleHead(DOB_POS.x, DOB_POS.y, false),
  dobNear: muleHead(DOB_NEAR, DOB_POS.y, false),
  dobBehind: muleHead(DOB_BEHIND.x, DOB_BEHIND.y, true),
};

export const CAM6 = {
  wide: { x: 1000, y: 560, zoom: 0.95 },
  two: { x: 945, y: 575, zoom: 1.18 },
  twoNear: { x: 1040, y: 590, zoom: 1.3 },
  cuDob: { x: HEADS.dobbins.x + 36, y: HEADS.dobbins.y + 46, zoom: 2.4 },
  ecuDob: { x: HEADS.dobbins.x + 50, y: HEADS.dobbins.y + 24, zoom: 4.0 },
  msDob: { x: HEADS.dobbins.x + 20, y: HEADS.dobbins.y + 190, zoom: 1.55 },
  cuDobNear: { x: HEADS.dobNear.x + 36, y: HEADS.dobNear.y + 46, zoom: 2.4 },
  cuSkeet: { x: HEADS.skeeter.x - 36, y: HEADS.skeeter.y + 40, zoom: 2.5 },
  ecuSkeet: { x: HEADS.skeeter.x - 46, y: HEADS.skeeter.y + 14, zoom: 4.0 },
  msSkeet: { x: HEADS.skeeter.x - 20, y: HEADS.skeeter.y + 150, zoom: 1.7 },
  door: { x: 1640, y: 600, zoom: 1.35 },
  tv: { x: 296, y: 690, zoom: 2.7 },
} satisfies Record<string, Cam>;

export function useSpeech(name: string) {
  const { timeline, shot } = useEpisode();
  const tq = onN(shot.frame, 2) / shot.fps;
  return { mouth: mouthAt(timeline, name, tq), talking: isTalking(timeline, name, shot.t), energy: energyAt(timeline, shot.t) };
}

/* ------------------------------------------------------------------ */
/* Walls, ceiling, carpet                                              */
/* ------------------------------------------------------------------ */

const Walls: React.FC = () => {
  const planks = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let i = -10; i < 34; i++) {
      const x0 = -700 + i * 96;
      const tone = rnd(`plank${i}`);
      out.push(<rect key={`p${i}`} x={x0} y={70} width={96} height={FLOOR - 70} fill={mixHex("#6e4b31", "#5a3b25", tone)} />);
      out.push(<path key={`g${i}`} d={`M${x0},70 L${x0},${FLOOR}`} stroke="#3a2416" strokeWidth={5} />);
      // wood grain squiggles
      for (let k = 0; k < 3; k++) {
        const gx = x0 + 20 + rnd(`gr${i}${k}`) * 56;
        const gy = 140 + rnd(`gry${i}${k}`) * 640;
        out.push(<path key={`w${i}-${k}`} d={`M${gx},${gy} q8,40 0,80 q-8,40 2,90`} stroke="#4d321f" strokeWidth={3} fill="none" opacity={0.55} />);
      }
    }
    return out;
  }, []);
  return (
    <g>
      {/* ceiling */}
      <rect x={-900} y={-1000} width={3800} height={1080} fill="#2c2420" />
      {Array.from({ length: 14 }).map((_, i) => (
        <path key={i} d={blob(-500 + i * 300, -200 + rnd(`cs${i}`) * 200, 70, 40, 8, 0.4, `ceilstain${i}`)} fill="#3a2c22" opacity={0.6} />
      ))}
      {planks}
      {/* grime toward the floor + water stain */}
      <defs>
        <linearGradient id="grime6" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.5" stopColor="#1a0e06" stopOpacity={0} />
          <stop offset="1" stopColor="#1a0e06" stopOpacity={0.45} />
        </linearGradient>
      </defs>
      <rect x={-900} y={70} width={3800} height={FLOOR - 70} fill="url(#grime6)" />
      <path d={blob(1420, 150, 120, 50, 10, 0.3, "waterstain")} fill="#2a1a0e" opacity={0.25} />
      {/* crown molding + chair rail + baseboard */}
      <rect x={-900} y={56} width={3800} height={26} fill="#4a3020" stroke={INK} strokeWidth={4} />
      <rect x={-900} y={FLOOR - 20} width={3800} height={26} fill="#3e2818" stroke={INK} strokeWidth={4} />
    </g>
  );
};

const Carpet: React.FC = () => {
  const specks = useMemo(
    () =>
      Array.from({ length: 160 }).map((_, i) => {
        const x = -800 + rnd(`cpx${i}`) * 3600;
        const y = FLOOR + 10 + rnd(`cpy${i}`) * 980;
        return <path key={i} d={`M${x},${y} l4,-12 M${x + 8},${y} l-2,-10`} stroke={i % 3 ? "#4b5528" : "#78843f"} strokeWidth={3} strokeLinecap="round" />;
      }),
    [],
  );
  return (
    <g>
      <rect x={-900} y={FLOOR} width={3800} height={1100} fill="#5d6a33" />
      {specks}
      {/* braided oval rug */}
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse key={i} cx={1000} cy={1010} rx={560 - i * 70} ry={74 - i * 10} fill={["#7a3b2a", "#b08a42", "#4f5f6e", "#9a4a32", "#c9a35a"][i]} stroke={INK} strokeWidth={i === 0 ? 5 : 2.5} />
      ))}
      {/* a suspicious stain on the rug */}
      <path d={blob(860, 1020, 60, 12, 9, 0.3, "rugstain")} fill="#3a1a12" opacity={0.35} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Furniture + dressing                                                */
/* ------------------------------------------------------------------ */

const GrandfatherClock: React.FC<{ t: number }> = ({ t }) => {
  const swing = Math.sin(t * Math.PI) * 14;
  return (
    <g transform="translate(60 0)">
      <rect x={-62} y={300} width={124} height={FLOOR - 300} fill="#4a2a18" stroke={INK} strokeWidth={6} />
      <path d={`M-70,300 L70,300 L56,250 Q0,220 -56,250 Z`} fill="#3a2010" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={0} cy={360} r={44} fill="#efe4c4" stroke={INK} strokeWidth={5} />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d="M0,-36 L0,-30" transform={`translate(0 360) rotate(${i * 30})`} stroke={INK} strokeWidth={3} />
      ))}
      {/* stopped at 3:33 */}
      <path d="M0,360 L16,368" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M0,360 L10,394" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <rect x={-38} y={430} width={76} height={300} rx={6} fill="#24140a" stroke={INK} strokeWidth={4} />
      <g transform={`rotate(${swing} 0 440)`}>
        <path d="M0,440 L0,640" stroke="#c9a24c" strokeWidth={4} />
        <circle cx={0} cy={660} r={22} fill="#d6b04a" stroke={INK} strokeWidth={4} />
      </g>
    </g>
  );
};

/** Little looping porch-cam feed drawn inside the TV screen (world box x, y, w, h). */
const PorchFeed: React.FC<{ x: number; y: number; w: number; h: number; t: number }> = ({ x, y, w, h, t }) => {
  const k = (t % 3.2) / 3.2;
  const fx = x + w * (0.15 + Math.min(k * 2.2, 0.55));
  const grabbed = k > 0.45;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#16301c" />
      <path d={`M${x},${y + h * 0.62} L${x + w},${y + h * 0.55} L${x + w},${y + h} L${x},${y + h} Z`} fill="#24482a" />
      {Array.from({ length: 5 }).map((_, i) => (
        <path key={i} d={`M${x},${y + h * (0.66 + i * 0.07)} L${x + w},${y + h * (0.6 + i * 0.08)}`} stroke="#1b3a20" strokeWidth={2} />
      ))}
      {/* tiny thief */}
      <g transform={`translate(${fx} ${y + h * 0.8})`}>
        <ellipse cx={0} cy={-26} rx={10} ry={20} fill="#a8e0a0" />
        <circle cx={6} cy={-50} r={9} fill="#a8e0a0" />
        {grabbed ? <rect x={6} y={-34} width={18} height={14} fill="#c8f0b8" /> : null}
      </g>
      {!grabbed ? <rect x={x + w * 0.62} y={y + h * 0.7} width={18} height={14} fill="#c8f0b8" /> : null}
      <circle cx={x + w * 0.88} cy={y + 12} r={5} fill="#ff4040" opacity={Math.floor(t * 2) % 2 ? 1 : 0.2} />
      <text x={x + 6} y={y + 14} fontFamily={FONT} fontWeight={900} fontSize={10} fill="#c8f0b8">
        PORCH CAM 1
      </text>
      <text x={x + 6} y={y + h - 6} fontFamily="monospace" fontWeight={700} fontSize={9} fill="#c8f0b8">
        02:13 AM
      </text>
      {/* scanlines */}
      {Array.from({ length: Math.floor(h / 6) }).map((_, i) => (
        <rect key={i} x={x} y={y + i * 6} width={w} height={2} fill="#000" opacity={0.18} />
      ))}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#000" strokeWidth={10} opacity={0.35} rx={14} />
    </g>
  );
};

const TvCabinet: React.FC = () => (
  <g>
    {/* rabbit ears */}
    <path d="M300,628 L250,520 M300,628 L360,512" stroke="#2a2a2a" strokeWidth={5} strokeLinecap="round" />
    <circle cx={250} cy={518} r={6} fill="#888" stroke={INK} strokeWidth={2} />
    <circle cx={360} cy={510} r={6} fill="#888" stroke={INK} strokeWidth={2} />
    <rect x={170} y={626} width={256} height={262} rx={14} fill="#6a4426" stroke={INK} strokeWidth={6} />
    <rect x={186} y={642} width={168} height={128} rx={18} fill="#1b1b1b" stroke={INK} strokeWidth={5} />
    <rect x={364} y={646} width={48} height={120} rx={6} fill="#4e321c" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 8 }).map((_, i) => (
      <path key={i} d={`M368,${656 + i * 14} L408,${656 + i * 14}`} stroke="#2e1d10" strokeWidth={3} />
    ))}
    {[0, 1].map((i) => (
      <circle key={i} cx={388} cy={790 + i * 40} r={12} fill="#c9a24c" stroke={INK} strokeWidth={3} />
    ))}
    <rect x={186} y={790} width={160} height={80} rx={6} fill="#5a3a20" stroke={INK} strokeWidth={4} />
    <rect x={160} y={884} width={276} height={12} fill="#3a2414" stroke={INK} strokeWidth={4} />
    {/* VHS tapes labelled with dates */}
    {[0, 1, 2].map((i) => (
      <rect key={i} x={196 + i * 48} y={808} width={42} height={48} fill="#1a1a1a" stroke="#f0ead8" strokeWidth={2} />
    ))}
  </g>
);

const FloorLamp: React.FC<{ on: number; pull: number }> = ({ on, pull }) => (
  <g>
    <ellipse cx={LAMP_X} cy={FLOOR + 2} rx={52} ry={12} fill="#2a2016" stroke={INK} strokeWidth={4} />
    <path d={`M${LAMP_X},${FLOOR} L${LAMP_X},440`} stroke="#b8963c" strokeWidth={10} />
    <path d={`M${LAMP_X},${FLOOR} L${LAMP_X},440`} stroke={INK} strokeWidth={2} opacity={0.5} />
    {/* shade with fringe */}
    <path d={`M${LAMP_X - 58},366 L${LAMP_X + 58},366 L${LAMP_X + 86},452 L${LAMP_X - 86},452 Z`} fill={on > 0.5 ? "#f6d58a" : "#a8875a"} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    {Array.from({ length: 18 }).map((_, i) => (
      <path key={i} d={`M${LAMP_X - 84 + i * 10},452 l0,14`} stroke={on > 0.5 ? "#e8b04a" : "#7a5a30"} strokeWidth={3} />
    ))}
    {/* pull chain */}
    <path d={`M${LAMP_X + 30},452 L${LAMP_X + 30},${510 + pull * 26}`} stroke="#cfcfcf" strokeWidth={3} strokeDasharray="3 3" />
    <circle cx={LAMP_X + 30} cy={514 + pull * 26} r={5} fill="#d6b04a" stroke={INK} strokeWidth={2} />
  </g>
);

const Sofa: React.FC = () => (
  <g>
    <path d="M760,700 Q760,640 820,640 L1130,640 Q1190,640 1190,700 L1190,900 L760,900 Z" fill="#c9a548" stroke={INK} strokeWidth={6} />
    {/* floral print */}
    {Array.from({ length: 16 }).map((_, i) => (
      <g key={i} transform={`translate(${800 + (i % 8) * 50} ${680 + Math.floor(i / 8) * 90})`}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx={0} cy={-8} rx={5} ry={9} transform={`rotate(${a})`} fill="#b0552c" opacity={0.8} />
        ))}
        <circle r={4} fill="#5a6a2a" />
      </g>
    ))}
    {/* seat cushions + arms */}
    <rect x={782} y={770} width={386} height={56} rx={14} fill="#d4b25a" stroke={INK} strokeWidth={5} />
    <path d="M806,798 L1150,798" stroke="#a98a3a" strokeWidth={4} />
    <rect x={730} y={720} width={70} height={180} rx={26} fill="#bf9a40" stroke={INK} strokeWidth={6} />
    <rect x={1150} y={720} width={70} height={180} rx={26} fill="#bf9a40" stroke={INK} strokeWidth={6} />
    {/* crocheted doilies */}
    {[765, 1185].map((dx, i) => (
      <g key={i}>
        <path d={blob(dx, 728, 34, 12, 12, 0.18, `doily${i}`)} fill="#f4efe2" stroke={INK} strokeWidth={2} />
        <ellipse cx={dx} cy={728} rx={14} ry={5} fill="none" stroke="#cfc7b4" strokeWidth={2} />
      </g>
    ))}
    {/* clear plastic slipcover: hard shine streaks */}
    <path d="M790,654 L860,654 L812,760 L760,760 Z" fill="#ffffff" opacity={0.22} />
    <path d="M1010,650 L1040,650 L1000,890 L972,890 Z" fill="#ffffff" opacity={0.16} />
    <path d="M762,698 Q760,642 820,642 L1130,642 Q1188,642 1188,698" stroke="#ffffff" strokeWidth={4} fill="none" opacity={0.45} />
    <rect x={760} y={888} width={430} height={14} fill="#2a1a10" />
  </g>
);

/** Simplified Dobbins bust for the portraits. */
const DobbinsBust: React.FC<{ kind: "mother" | "father" | "baby" | "me" | "groom" | "bride"; s?: number; x?: number; y?: number }> = ({ kind, s = 1, x = 0, y = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {kind === "mother" ? <path d={blob(-6, -40, 60, 46, 12, 0.3, "momhair")} fill="#d8c27a" stroke={INK} strokeWidth={3} /> : null}
    {kind === "baby" ? (
      <>
        <path d="M-40,90 Q-36,40 0,36 Q36,40 40,90 Z" fill="#f4e6ee" stroke={INK} strokeWidth={3} />
        <path d={blob(-4, -26, 52, 44, 10, 0.1, "bonnet")} fill="#f6d6e6" stroke={INK} strokeWidth={3} />
      </>
    ) : (
      <path d={`M-56,90 Q-50,30 0,26 Q50,30 56,90 Z`} fill={kind === "father" || kind === "groom" ? "#2e2e3a" : kind === "me" ? "#cfe3c6" : "#e8e0f0"} stroke={INK} strokeWidth={3} />
    )}
    <path d="M-30,-40 L-40,-100 L-16,-46 Z M-12,-46 L-12,-108 L4,-44 Z" fill="#8d7d6e" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <path d={blob(-6, -20, 34, 32, 10, 0.05, "bustcran")} fill="#8d7d6e" stroke={INK} strokeWidth={3} />
    <path d="M6,-30 C30,-26 50,-8 52,10 C52,26 38,32 20,30 C4,28 -14,18 -22,8 Z" fill="#dacfb9" stroke={INK} strokeWidth={3} />
    <path d="M-16,4 Q16,30 46,18" stroke={INK} strokeWidth={3} fill="#f3e8c4" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={2 + i * 10} y={12 + i * 2} width={9} height={11} fill="#f3e8c4" stroke={INK} strokeWidth={1.4} />
    ))}
    <circle cx={-4} cy={-30} r={7} fill="#f6f1e1" stroke={INK} strokeWidth={2} />
    <circle cx={-3} cy={-30} r={2} fill={INK} />
    <path d="M-14,-46 Q-4,-56 6,-46" stroke="#231815" strokeWidth={4} fill="none" strokeLinecap="round" />
    {kind === "father" ? <path d="M20,4 q16,10 30,-2 q-14,2 -30,2 Z" fill="#231815" stroke={INK} strokeWidth={2} /> : null}
    {kind === "mother" ? (
      <>
        <path d="M-30,40 Q0,56 30,40" stroke="#f4f0e4" strokeWidth={6} strokeDasharray="1 9" strokeLinecap="round" fill="none" />
        <path d="M-6,8 Q20,22 44,14" stroke="#c8243a" strokeWidth={5} fill="none" />
      </>
    ) : null}
    {kind === "bride" ? <path d="M-50,-60 Q-6,-90 30,-50 L60,90 L-70,90 Z" fill="#ffffff" opacity={0.55} stroke={INK} strokeWidth={2} /> : null}
    {kind === "groom" ? <path d="M-8,40 L8,40 L4,60 L-4,60 Z" fill="#c0312b" /> : null}
    <path d="M-36,-36 C-20,-60 20,-56 30,-40" stroke="#231815" strokeWidth={8} fill="none" strokeLinecap="round" />
  </g>
);

const Frame: React.FC<{ x: number; y: number; w: number; h: number; tilt?: number; label?: string; bg?: string; children: React.ReactNode; id: string }> = ({ x, y, w, h, tilt = 0, label, bg = "#6b6a7a", children, id }) => (
  <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
    <rect x={-w / 2 - 14} y={-h / 2 - 14} width={w + 28} height={h + 28} rx={4} fill="#b8913c" stroke={INK} strokeWidth={5} />
    <rect x={-w / 2 - 6} y={-h / 2 - 6} width={w + 12} height={h + 12} fill="#7a5a20" />
    <defs>
      <clipPath id={`fr-${id}`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h} />
      </clipPath>
    </defs>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={bg} />
    <g clipPath={`url(#fr-${id})`}>{children}</g>
    {label ? (
      <g transform={`translate(0 ${h / 2 + 30})`}>
        <rect x={-46} y={-12} width={92} height={22} rx={3} fill="#d6b04a" stroke={INK} strokeWidth={2.5} />
        <text x={0} y={5} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={12} fill={INK}>
          {label}
        </text>
      </g>
    ) : null}
  </g>
);

const FamilyPortraits: React.FC = () => (
  <g>
    <Frame id="mom" x={800} y={300} w={110} h={140} tilt={-3} label="MOTHER" bg="#7a6a8a">
      <DobbinsBust kind="mother" s={0.9} x={0} y={14} />
    </Frame>
    <Frame id="dad" x={944} y={270} w={110} h={140} tilt={2} label="FATHER" bg="#5a6a7a">
      <DobbinsBust kind="father" s={0.9} x={0} y={14} />
    </Frame>
    <Frame id="wed" x={1100} y={300} w={160} h={120} tilt={-1} label="US" bg="#8a7a6a">
      <DobbinsBust kind="bride" s={0.7} x={-38} y={22} />
      <DobbinsBust kind="groom" s={0.7} x={40} y={22} />
    </Frame>
    <Frame id="baby" x={870} y={470} w={90} h={90} tilt={4} label="BABY" bg="#9a8aa0">
      <DobbinsBust kind="baby" s={0.6} x={0} y={8} />
    </Frame>
    <Frame id="me" x={1030} y={472} w={90} h={90} tilt={-5} label="ME" bg="#6a8a7a">
      <DobbinsBust kind="me" s={0.6} x={0} y={10} />
    </Frame>
  </g>
);

/** Doorbell-cam stills of previous porch pirates, all wearing party hats. */
const GuestWall: React.FC = () => {
  const guest = (kind: "pigeon" | "rat" | "goose", x: number, y: number, tilt: number, i: number) => (
    <Frame id={`guest${i}`} x={x} y={y} w={92} h={74} tilt={tilt} bg="#1d3a22">
      <g transform="translate(0 10)" fill="#9fd890" stroke="#0e2412" strokeWidth={2}>
        {kind === "pigeon" ? (
          <>
            <ellipse cx={0} cy={10} rx={22} ry={16} />
            <circle cx={14} cy={-10} r={10} />
            <path d="M22,-10 l8,3 l-8,2 Z" />
          </>
        ) : kind === "rat" ? (
          <>
            <ellipse cx={0} cy={12} rx={24} ry={14} />
            <circle cx={18} cy={0} r={10} />
            <circle cx={12} cy={-10} r={5} />
            <path d="M-24,14 q-16,4 -20,-10" fill="none" />
          </>
        ) : (
          <>
            <ellipse cx={-4} cy={16} rx={24} ry={14} />
            <path d="M10,10 Q14,-14 6,-22" fill="none" strokeWidth={9} stroke="#9fd890" />
            <circle cx={8} cy={-24} r={8} />
            <path d="M15,-24 l10,2 l-10,3 Z" />
          </>
        )}
        <path d={`M${kind === "goose" ? 2 : 10},${kind === "pigeon" ? -18 : kind === "rat" ? -12 : -30} l8,-20 l8,20 Z`} fill="#e8ff9a" />
      </g>
      <circle cx={34} cy={-26} r={3} fill="#ff4040" />
    </Frame>
  );
  return (
    <g>
      <g transform="translate(1420 236)">
        <rect x={-110} y={-20} width={220} height={36} rx={4} fill="#3a2414" stroke="#d6b04a" strokeWidth={3} />
        <text x={0} y={6} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={17} fill="#d6b04a">
          OUR SPECIAL GUESTS
        </text>
      </g>
      {guest("pigeon", 1340, 330, -4, 0)}
      {guest("rat", 1490, 340, 3, 1)}
      {guest("goose", 1420, 470, -2, 2)}
    </g>
  );
};

const SideTable: React.FC = () => (
  <g>
    <rect x={1306} y={760} width={150} height={16} rx={4} fill="#5a3820" stroke={INK} strokeWidth={4} />
    <path d="M1318,776 L1312,900 M1444,776 L1450,900" stroke="#4a2c18" strokeWidth={10} strokeLinecap="round" />
    <path d={blob(1381, 758, 60, 10, 12, 0.15, "tabledoily")} fill="#f4efe2" stroke={INK} strokeWidth={2} />
    {/* the guest book, open, pen on a chain */}
    <path d="M1336,752 L1380,744 L1426,752 L1426,740 L1380,732 L1336,740 Z" fill="#f6f2e6" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
    <path d="M1380,732 L1380,744" stroke={INK} strokeWidth={2} />
    <rect x={1340} y={716} width={84} height={14} rx={3} fill="#7a1f2e" stroke={INK} strokeWidth={2} />
    <text x={1382} y={727} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={9} fill="#e8c35a">
      GUEST BOOK
    </text>
    <path d="M1424,744 q20,14 10,28" stroke="#cfcfcf" strokeWidth={2} fill="none" strokeDasharray="2 2" />
  </g>
);

const FrontDoor: React.FC<{ open: number; t: number }> = ({ open, t }) => {
  const x0 = 1560;
  const w = 220;
  const pw = w * (1 - open * 0.82);
  return (
    <g>
      {/* outside: the porch at night */}
      <rect x={x0} y={330} width={w} height={FLOOR - 330} fill="#1a2a4a" />
      <defs>
        <radialGradient id="porchGlow" gradientUnits="userSpaceOnUse" cx={x0 + 150} cy={430} r={420}>
          <stop offset="0" stopColor="#ffe7a8" stopOpacity={0.75} />
          <stop offset="1" stopColor="#ffe7a8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={x0} y={330} width={w} height={FLOOR - 330} fill="url(#porchGlow)" />
      <circle cx={x0 + 170} cy={420} r={14} fill="#fff4cc" />
      <path d={`M${x0},780 L${x0 + w},760`} stroke="#22304a" strokeWidth={8} />
      {Array.from({ length: 5 }).map((_, i) => (
        <path key={i} d={`M${x0 + 20 + i * 46},760 L${x0 + 20 + i * 46},${FLOOR}`} stroke="#1a2438" strokeWidth={5} />
      ))}
      {/* the door panel (hinged on the left, swings into the room) */}
      <g>
        <path d={`M${x0},330 L${x0 + pw},${330 - open * 30} L${x0 + pw},${FLOOR + open * 20} L${x0},${FLOOR} Z`} fill="#7a3a26" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {open < 0.4 ? (
          <>
            <rect x={x0 + pw * 0.2} y={380} width={pw * 0.6} height={150} fill="#62301e" stroke={INK} strokeWidth={4} />
            <rect x={x0 + pw * 0.2} y={580} width={pw * 0.6} height={250} fill="#62301e" stroke={INK} strokeWidth={4} />
            <circle cx={x0 + pw * 0.5} cy={350} r={6} fill="#c9a24c" stroke={INK} strokeWidth={2} />
            {/* three chain locks, all hanging open */}
            {[560, 590, 620].map((cy, i) => (
              <g key={i}>
                <rect x={x0 + pw - 26} y={cy - 6} width={16} height={12} fill="#b9b9b9" stroke={INK} strokeWidth={2} />
                <path d={`M${x0 + pw - 18},${cy + 6} q-6,${24 + Math.sin(t * 2 + i) * 3} 4,${46}`} stroke="#cfcfcf" strokeWidth={3} strokeDasharray="4 3" fill="none" />
              </g>
            ))}
          </>
        ) : null}
        <circle cx={x0 + pw - 24} cy={640} r={11} fill="#d6b04a" stroke={INK} strokeWidth={3} />
      </g>
      {/* frame trim */}
      <path d={`M${x0 - 16},${FLOOR} L${x0 - 16},314 L${x0 + w + 16},314 L${x0 + w + 16},${FLOOR}`} fill="none" stroke="#3a2214" strokeWidth={18} />
      <path d={`M${x0 - 16},${FLOOR} L${x0 - 16},314 L${x0 + w + 16},314 L${x0 + w + 16},${FLOOR}`} fill="none" stroke={INK} strokeWidth={3} />
      {/* LIVE LAUGH LURE */}
      <g transform={`translate(${x0 + w / 2} 250) rotate(-2)`}>
        <rect x={-150} y={-32} width={300} height={60} rx={6} fill="#efe6d2" stroke={INK} strokeWidth={4} />
        <path d="M-150,-10 L150,-12 M-150,10 L150,12" stroke="#d8cdb4" strokeWidth={2} />
        <text x={0} y={12} textAnchor="middle" fontFamily="PatrickHand" fontSize={38} fill="#3a2a1e">
          Live · Laugh · Lure
        </text>
        <path d="M-80,-32 L-40,-70 L40,-70 L80,-32" stroke="#6a5a4a" strokeWidth={2} fill="none" />
      </g>
    </g>
  );
};

/** the lit porch seen through the open front door (drawn over the night darkness) */
const DoorwayLight: React.FC<{ open: number; k: number }> = ({ open, k }) => {
  const x0 = 1560;
  const w = 220;
  const pw = w * (1 - open * 0.82);
  return (
    <g opacity={k}>
      <defs>
        <radialGradient id="doorwayGlow" gradientUnits="userSpaceOnUse" cx={x0 + 160} cy={440} r={520}>
          <stop offset="0" stopColor="#ffe9b0" stopOpacity={0.95} />
          <stop offset="0.5" stopColor="#c89a5a" stopOpacity={0.55} />
          <stop offset="1" stopColor="#1a2a4a" stopOpacity={0.4} />
        </radialGradient>
      </defs>
      <rect x={x0 + pw} y={330 - open * 30} width={w - pw} height={FLOOR - 330 + open * 30} fill="url(#doorwayGlow)" />
      <path d={`M${x0 + pw},${FLOOR} L${x0 + w},${FLOOR} L${x0 + w - 120},1240 L${x0 + pw - 420},1240 Z`} fill="#ffe2a0" opacity={0.22 * open} />
    </g>
  );
};

const Window: React.FC<{ glow: number }> = ({ glow }) => (
  <g>
    <rect x={1850} y={300} width={220} height={330} fill="#0d1630" stroke={INK} strokeWidth={6} />
    <circle cx={1990} cy={380} r={36} fill="#f2ecd2" />
    <circle cx={1978} cy={372} r={7} fill="#d8d2b8" />
    <circle cx={2002} cy={392} r={5} fill="#d8d2b8" />
    <path d="M1850,465 L2070,465 M1960,300 L1960,630" stroke="#3a2214" strokeWidth={10} />
    {/* lace curtains */}
    {[1838, 2082].map((cx, i) => (
      <path key={i} d={`M${cx},290 Q${cx + (i ? -40 : 40)},460 ${cx + (i ? -10 : 10)},650 L${cx + (i ? 24 : -24)},650 L${cx + (i ? 24 : -24)},290 Z`} fill="#efe8dc" opacity={0.85} stroke={INK} strokeWidth={3} />
    ))}
    <rect x={1820} y={280} width={280} height={16} rx={6} fill="#b8913c" stroke={INK} strokeWidth={3} />
    {glow > 0 ? <rect x={1850} y={300} width={220} height={330} fill="#ff4fc8" opacity={0.25 * glow} /> : null}
  </g>
);

/** Disco ball on a chain (drop 0..1 from the ceiling hatch), spinning facets. */
export const DiscoBall: React.FC<{ x: number; drop: number; t: number }> = ({ x, drop, t }) => {
  if (drop <= 0) return null;
  const y = 60 + easeOutBack(clamp(drop)) * 100;
  const spin = (t * 1.4) % 1;
  return (
    <g>
      <path d={`M${x},50 L${x},${y - 46}`} stroke="#bdbdbd" strokeWidth={4} strokeDasharray="6 4" />
      <defs>
        <clipPath id="discoClip">
          <circle cx={x} cy={y} r={46} />
        </clipPath>
      </defs>
      <circle cx={x} cy={y} r={46} fill="#9aa0b4" stroke={INK} strokeWidth={5} />
      <g clipPath="url(#discoClip)">
        {Array.from({ length: 7 }).map((_, r) =>
          Array.from({ length: 9 }).map((__, c) => {
            const u = c / 8 - 0.5 + spin / 8;
            const px = x + Math.sin(u * Math.PI) * 46;
            const py = y - 42 + r * 13;
            const wdt = Math.max(1, Math.cos(u * Math.PI) * 12);
            const col = ["#e8ecf8", "#ff8ad8", "#a8b4d8", "#ffffff", "#7a84a8"][(r * 3 + c + Math.floor(t * 8)) % 5];
            return <rect key={`${r}-${c}`} x={px - wdt / 2} y={py} width={wdt} height={11} fill={col} stroke="#4a4e60" strokeWidth={1} />;
          }),
        )}
      </g>
      <circle cx={x} cy={y} r={46} fill="none" stroke={INK} strokeWidth={5} />
      {[0, 1, 2].map((i) => {
        const a = t * 3 + i * 2.1;
        const sx = x + Math.cos(a) * 60;
        const sy = y + Math.sin(a) * 40;
        const k = 0.5 + 0.5 * Math.sin(t * 11 + i);
        return <path key={i} d={`M${sx - 10 * k},${sy} L${sx + 10 * k},${sy} M${sx},${sy - 10 * k} L${sx},${sy + 10 * k}`} stroke="#ffffff" strokeWidth={3} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** "WELCOME TO THE FAMILY" banner + bunting, unrolled 0..1 */
const Banner: React.FC<{ k: number }> = ({ k }) => {
  if (k <= 0) return null;
  const h = 64 * clamp(k);
  return (
    <g>
      <path d="M200,96 Q520,150 840,96" stroke="#e8e0d0" strokeWidth={3} fill="none" />
      {Array.from({ length: 13 }).map((_, i) => {
        const u = i / 12;
        const bx = 200 + u * 640;
        const byy = 96 + Math.sin(u * Math.PI) * 27;
        return <path key={i} d={`M${bx - 16},${byy} L${bx + 16},${byy} L${bx},${byy + 34 * clamp(k * 1.4)} Z`} fill={["#ff4fb4", "#ffd34a", "#6fe0ff", "#b98aff"][i % 4]} stroke={INK} strokeWidth={2.5} />;
      })}
      <g transform="translate(520 150)">
        <rect x={-300} y={0} width={600} height={h} fill="#fff4f8" stroke={INK} strokeWidth={4} />
        {k > 0.6 ? (
          <text x={0} y={46} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#e2308f" letterSpacing={1}>
            WELCOME TO THE FAMILY
          </text>
        ) : null}
        <rect x={-310} y={h - 6} width={620} height={12} rx={6} fill="#e2a8c8" stroke={INK} strokeWidth={3} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Lighting                                                            */
/* ------------------------------------------------------------------ */

export interface RoomState {
  /** 0..1 front door open */
  door: number;
  /** night darkness on the set (before the lamp) */
  dark: number;
  /** lamp on 0..1 */
  lamp: number;
  /** lamp chain pulled 0..1 */
  pull: number;
  /** pink party light 0..1 */
  pink: number;
  /** disco ball drop 0..1 */
  disco: number;
  /** banner unroll 0..1 */
  banner: number;
  /** squeaky toy squash 0..1 (and squeak lines) */
  squeak: number;
  toy: boolean;
  /** confetti falling 0..1 (amount) */
  confetti: number;
}

export const DEFAULT_ROOM: RoomState = { door: 0, dark: 0, lamp: 1, pull: 0, pink: 0, disco: 0, banner: 0, squeak: 0, toy: true, confetti: 0 };

const DiscoSpots: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  if (k <= 0) return null;
  return (
    <g style={{ mixBlendMode: "screen" }} opacity={k}>
      {Array.from({ length: 22 }).map((_, i) => {
        const a = t * 0.9 + i * 0.83;
        const r = 300 + (i % 5) * 170;
        const sx = 960 + Math.cos(a) * r * 1.5;
        const sy = 520 + Math.sin(a * 1.3 + i) * r * 0.55;
        const sz = 0.7 + 0.5 * Math.abs(Math.sin(t * 5 + i));
        return (
          <g key={i}>
            <ellipse cx={sx} cy={sy} rx={(16 + (i % 3) * 6) * sz} ry={(10 + (i % 2) * 5) * sz} fill={i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#ffd0f4" : "#d0f0ff"} opacity={0.9} />
            {i % 4 === 0 ? <path d={`M${sx - 26 * sz},${sy} L${sx + 26 * sz},${sy} M${sx},${sy - 26 * sz} L${sx},${sy + 26 * sz}`} stroke="#ffffff" strokeWidth={3} opacity={0.9} /> : null}
          </g>
        );
      })}
    </g>
  );
};

/** a few bright twinkles in front of everything (the disco ball's reflections hitting the lens) */
const Sparkles: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  if (k <= 0) return null;
  return (
    <g opacity={k}>
      {Array.from({ length: 7 }).map((_, i) => {
        const a = t * 0.7 + i * 1.9;
        const sx = 960 + Math.cos(a) * (500 + i * 90);
        const sy = 140 + ((i * 137 + t * 40) % 260);
        const s = 10 + 12 * Math.abs(Math.sin(t * 6 + i * 1.3));
        return <path key={i} d={`M${sx - s},${sy} L${sx + s},${sy} M${sx},${sy - s} L${sx},${sy + s}`} stroke="#ffffff" strokeWidth={3} strokeLinecap="round" />;
      })}
    </g>
  );
};

const Confetti: React.FC<{ t: number; k: number }> = ({ t, k }) => {
  if (k <= 0) return null;
  return (
    <g opacity={Math.min(1, k * 1.5)}>
      {Array.from({ length: 60 }).map((_, i) => {
        const x0 = 300 + rnd(`cf${i}`) * 1600;
        const sp = 140 + rnd(`cfs${i}`) * 160;
        const y0 = -100 + ((t * sp + rnd(`cfy${i}`) * 1100) % 1100);
        const x = x0 + Math.sin(t * 3 + i) * 30;
        const rot = t * 300 + i * 40;
        return <rect key={i} x={x - 6} y={y0 - 3} width={12} height={6} fill={["#ff4fb4", "#ffd34a", "#6fe0ff", "#b98aff", "#7aff9a"][i % 5]} transform={`rotate(${rot} ${x} ${y0})`} />;
      })}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

export type CousinSpec = Partial<MuleProps> & { id: string; x: number; y: number; layer?: "back" | "front" };

export interface RoomSceneProps {
  from: Cam;
  to?: Cam;
  ease?: (x: number) => number;
  cam?: Cam;
  skeeter?: Partial<SkeeterProps> | false;
  dobbins?: Partial<MuleProps> | false;
  /** draw Dobbins behind Skeeter (he walked around him) */
  dobBehind?: boolean;
  cousins?: CousinSpec[];
  room?: Partial<RoomState>;
  shakeAmp?: number;
  back?: React.ReactNode;
  front?: React.ReactNode;
}

export const RoomScene: React.FC<RoomSceneProps> = ({ from, to, ease = easeInOut, cam, skeeter = {}, dobbins = {}, dobBehind = false, cousins = [], room = {}, shakeAmp = 0, back, front }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const camNow = cam ?? (to ? camLerp(from, to, ease(shot.p)) : from);
  const st = { ...DEFAULT_ROOM, ...room };
  const ss = useSpeech("skeeter");
  const sd = useSpeech("dobbins");
  const flick = st.lamp > 0.5 && rnd(`lampfl${Math.floor(frame / 3)}`) < 0.04 ? 0.85 : 1;
  const dob = dobbins ? <Mule id="dobbins" x={DOB_POS.x} y={DOB_POS.y} t={t} frame={frame} {...sd} {...dobbins} /> : null;
  const skeet = skeeter ? <Ferret id="skeeter" x={SKEETER_POS.x} y={SKEETER_POS.y} flip t={t} frame={frame} {...ss} {...skeeter} /> : null;
  const cousin = ({ layer: _layer, ...c }: CousinSpec) => <Mule key={c.id} t={t} frame={frame} mouth="X" {...c} />;
  const backCous = cousins.filter((c) => c.layer === "back").map(cousin);
  const cous = cousins.filter((c) => c.layer !== "back").map(cousin);
  return (
    <Stage cam={camNow} frame={frame} shakeAmp={shakeAmp}>
      <Walls />
      <GrandfatherClock t={t} />
      <TvCabinet />
      <FamilyPortraits />
      <GuestWall />
      <Window glow={st.pink} />
      <FrontDoor open={st.door} t={t} />
      <Banner k={st.banner} />
      <Carpet />
      {backCous.length ? (
        <g>
          <defs>
            <clipPath id="behindSofa">
              <rect x={-900} y={-1000} width={3800} height={1000 + FLOOR - 4} />
            </clipPath>
          </defs>
          <g clipPath="url(#behindSofa)">{backCous}</g>
        </g>
      ) : null}
      <Sofa />
      <SideTable />
      <FloorLamp on={st.lamp} pull={st.pull} />
      {/* night: the set sinks into blue dark (characters drawn on top, Dobbins hides with `shade`) */}
      {st.dark > 0 ? (
        <g opacity={st.dark}>
          <rect x={-900} y={-1000} width={3800} height={3000} fill="#060a1c" opacity={0.78} />
          {/* moonlight through the door + window */}
          <path d={`M1560,${FLOOR} L1780,${FLOOR} L1700,1300 L1220,1300 Z`} fill="#6a86c8" opacity={0.18 * st.door} />
          <path d="M1850,640 L2070,640 L1980,1100 L1700,1100 Z" fill="#6a86c8" opacity={0.12} />
        </g>
      ) : null}
      {/* things that glow through the dark: the open doorway, the porch cam */}
      {st.dark > 0 && st.door > 0.02 ? <DoorwayLight open={st.door} k={st.dark} /> : null}
      <PorchFeed x={192} y={648} w={156} h={116} t={t} />
      {st.dark > 0 ? <rect x={150} y={600} width={300} height={220} fill="#3aff6a" opacity={0.06 * st.dark} style={{ mixBlendMode: "screen" }} /> : null}
      <DiscoSpots t={t} k={st.pink} />
      {back}
      {st.toy ? <SqueakyToy x={TOY_POS.x} y={TOY_POS.y} squash={st.squeak} s={1.45} /> : null}
      {cous}
      {dobBehind ? dob : null}
      {skeet}
      {dobBehind ? null : dob}
      {st.toy ? <SqueakLines x={TOY_POS.x} y={TOY_POS.y - 50} k={st.squeak} s={1.3} /> : null}
      {front}
      {/* global light: warm lamp pool / hot-pink party */}
      {st.lamp > 0 && st.pink < 1 ? (
        <g>
          <defs>
            <radialGradient id="lampPool" gradientUnits="userSpaceOnUse" cx={LAMP_X} cy={430} r={1500}>
              <stop offset="0" stopColor="#000" stopOpacity={0} />
              <stop offset="0.35" stopColor="#000" stopOpacity={0.06} />
              <stop offset="1" stopColor="#000" stopOpacity={0.5} />
            </radialGradient>
            <radialGradient id="lampGlow" gradientUnits="userSpaceOnUse" cx={LAMP_X} cy={420} r={560}>
              <stop offset="0" stopColor="#ffd88a" stopOpacity={0.5} />
              <stop offset="0.45" stopColor="#ffc870" stopOpacity={0.16} />
              <stop offset="1" stopColor="#ffc870" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect x={-900} y={-1000} width={3800} height={3000} fill="url(#lampPool)" opacity={st.lamp * (1 - st.pink)} />
          <circle cx={LAMP_X} cy={420} r={560} fill="url(#lampGlow)" opacity={st.lamp * flick} style={{ mixBlendMode: "screen" }} />
        </g>
      ) : null}
      {st.pink > 0 ? (
        <g>
          <rect x={-900} y={-1000} width={3800} height={3000} fill="#ff3cc6" opacity={0.72 * st.pink} style={{ mixBlendMode: "multiply" }} />
          <rect x={-900} y={-1000} width={3800} height={3000} fill="#ff2fae" opacity={0.26 * st.pink} style={{ mixBlendMode: "screen" }} />
          <Sparkles t={t} k={st.pink} />
        </g>
      ) : null}
      {st.dark > 0 && st.lamp <= 0 ? <rect x={-900} y={-1000} width={3800} height={3000} fill="#1a2650" opacity={0.28 * st.dark} style={{ mixBlendMode: "multiply" }} /> : null}
      <DiscoBall x={1330} drop={st.disco} t={t} />
      <Confetti t={t} k={st.confetti} />
    </Stage>
  );
};

/** small helper for wiggles in shots */
export const wobble = (seed: string, t: number, amp: number) => noise2D(seed, t, 0) * amp;
