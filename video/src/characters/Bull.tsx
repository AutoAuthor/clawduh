import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import type { MouthShape } from "../engine/timeline";
import { Pt, blob, onN, rnd, smoothPath } from "../engine/util";
import { Eye, INK, Mouth, Shadow, blinkAmount, saccade } from "./parts";

/**
 * THE BROTHERS (bulls). One rig, two looks:
 *  - BRISKET: black, scarred, one chipped horn, gold nose ring, bloodshot eyes. Troubled -> vengeful.
 *  - CHUCK:   fat brown bull, cream blaze, stubby forward horns, ear tag, grass stalk in his mouth. Content.
 * Faces right by default (flip to face left). Origin = ground under the barrel.
 */

export type BullVariant = "brisket" | "chuck";
export type BullExpr = "neutral" | "troubled" | "intense" | "rage" | "content" | "dismissive" | "sad" | "proud" | "resolved";

export interface BullProps {
  id: string;
  variant: BullVariant;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  t: number;
  frame: number;
  mouth: MouthShape;
  talking?: boolean;
  energy?: number;
  expr?: BullExpr;
  look?: Pt;
  headTilt?: number;
  /** 0..1 head lowered for a charge */
  charge?: number;
  /** running cycle on (finale) */
  run?: boolean;
  /** 0..1 eyes swollen red ("my eyes are swollen red") */
  redEyes?: number;
  /** steam from the nostrils */
  steam?: number;
  /** lying down asleep / resting */
  lying?: boolean;
}

const LOOK: Record<BullVariant, { fur: string; furHi: string; muzzle: string; horn: string; belly: number }> = {
  brisket: { fur: "#221e20", furHi: "#3d383b", muzzle: "#4a4245", horn: "#e7dcc0", belly: 0 },
  chuck: { fur: "#7a5434", furHi: "#9a6d44", muzzle: "#c9a27a", horn: "#d9cba8", belly: 1 },
};

const EXPR: Record<BullExpr, { lidTop: number; lidBottom: number; lidAngle: number; smile: number; pupil: number }> = {
  neutral: { lidTop: 0.25, lidBottom: 0.1, lidAngle: 0, smile: 0, pupil: 0.2 },
  troubled: { lidTop: 0.12, lidBottom: 0.08, lidAngle: -12, smile: -0.35, pupil: 0.18 },
  intense: { lidTop: 0.32, lidBottom: 0.14, lidAngle: 16, smile: -0.25, pupil: 0.15 },
  rage: { lidTop: 0.22, lidBottom: 0.18, lidAngle: 26, smile: -0.5, pupil: 0.1 },
  content: { lidTop: 0.5, lidBottom: 0.1, lidAngle: -4, smile: 0.35, pupil: 0.22 },
  dismissive: { lidTop: 0.62, lidBottom: 0.12, lidAngle: -8, smile: 0.1, pupil: 0.2 },
  sad: { lidTop: 0.42, lidBottom: 0.05, lidAngle: -16, smile: -0.4, pupil: 0.24 },
  proud: { lidTop: 0.36, lidBottom: 0.1, lidAngle: 4, smile: 0.45, pupil: 0.2 },
  resolved: { lidTop: 0.3, lidBottom: 0.12, lidAngle: 10, smile: -0.1, pupil: 0.18 },
};

export const Bull: React.FC<BullProps> = ({
  id,
  variant,
  x,
  y,
  scale = 1,
  flip = false,
  t,
  frame,
  mouth,
  talking = false,
  energy = 0,
  expr = "neutral",
  look,
  headTilt = 0,
  charge = 0,
  run = false,
  redEyes = 0,
  steam = 0,
  lying = false,
}) => {
  const L = LOOK[variant];
  const e = EXPR[expr];
  const t2 = onN(frame, 2) / 24;
  const breath = Math.sin(t2 * 1.4 + (variant === "chuck" ? 1 : 0)) * 0.012;
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 7 + energy * 4 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.8 : 0.3), 7) * (talking ? 4 : 1.5) + charge * 22;
  const blink = lying ? 1 : expr === "rage" ? 0 : blinkAmount(t, id, 3.8);
  const dart = saccade(t, id, expr === "rage" || expr === "troubled" ? 0.2 : 0.1, 1.2);
  const gaze: Pt = [(look?.[0] ?? 0.4) + dart[0], (look?.[1] ?? 0) + dart[1]];
  const chewOn = variant === "chuck" && !talking && !run;
  const chew = chewOn ? Math.sin(t2 * 7) : 0;
  const mouthShape: MouthShape = chewOn ? (chew > 0.3 ? "B" : "X") : mouth;
  const tail = Math.sin(t2 * 1.7 + (variant === "chuck" ? 2 : 0)) * 14 + noise2D(id + "tail", t2 * 0.6, 0) * 10;
  const gallop = run ? Math.sin(t * 14) : 0;
  const lift = run ? Math.abs(Math.sin(t * 14)) * 22 : 0;
  const sclera = redEyes > 0 ? mixHex("#efe7d0", "#d9504a", redEyes) : "#efe7d0";

  const geo = useMemo(() => {
    const body: Pt[] = [
      [-310, -235],
      [-300, -320],
      [-170, -350],
      [-20, -372],
      [80, -420],
      [190, -380],
      [260, -300],
      [270, -210],
      [240, -150],
      [120, -130 + L.belly * 18],
      [-60, -118 + L.belly * 26],
      [-220, -140],
      [-300, -170],
    ];
    const scars: string[] =
      variant === "brisket"
        ? ["M110,-360 l40,-22 l-8,30", "M-40,-300 l60,10", "M150,-250 l30,36"]
        : [];
    return {
      body: smoothPath(body),
      head: blob(0, 0, 118, 108, 14, 0.04, id + "head"),
      dewlap: smoothPath(
        [
          [-60, 70],
          [0, 128],
          [60, 70],
        ],
        false,
      ),
      scars,
      tuft: blob(-330, -55 + 0, 22, 30, 7, 0.25, id + "tuft"),
      grassPts: Array.from({ length: 5 }).map((_, i) => rnd(`${id}g${i}`)),
    };
  }, [id, variant, L.belly]);

  const s = flip ? -scale : scale;

  const leg = (lx: number, phase: number, far: boolean) => {
    const sw = run ? Math.sin(t * 14 + phase) * 26 : 0;
    const col = far ? mixHex(L.fur, "#000000", 0.25) : L.fur;
    const top: Pt = [lx, -170];
    const knee: Pt = [lx + sw * 0.5, -86];
    const hoof: Pt = [lx + sw, -10 - (run ? Math.max(0, Math.sin(t * 14 + phase)) * 30 : 0)];
    const d = smoothPath([top, knee, hoof], false);
    return (
      <g key={`${lx}${far}`}>
        <path d={d} fill="none" stroke={INK} strokeWidth={58} strokeLinecap="round" />
        <path d={d} fill="none" stroke={col} strokeWidth={48} strokeLinecap="round" />
        <path d={`M${hoof[0] - 26},${hoof[1] - 8} L${hoof[0] + 26},${hoof[1] - 8} L${hoof[0] + 28},${hoof[1] + 12} L${hoof[0] - 28},${hoof[1] + 12} Z`} fill="#141012" stroke={INK} strokeWidth={4} />
        <line x1={hoof[0]} y1={hoof[1] - 6} x2={hoof[0]} y2={hoof[1] + 12} stroke="#3a3436" strokeWidth={3} />
      </g>
    );
  };

  const steamPuffs: React.ReactNode[] = [];
  if (steam > 0) {
    for (let i = 0; i < 6; i++) {
      const ph = (t * 1.2 + i / 6) % 1;
      const side = i % 2 ? 1 : -1;
      steamPuffs.push(
        <circle key={i} cx={side * (24 + ph * 70)} cy={78 + ph * 30} r={8 + ph * 26} fill="#e6e2da" opacity={(1 - ph) * 0.6 * steam} stroke={INK} strokeWidth={2} />,
      );
    }
  }

  const horn = (side: number) => {
    const chipped = variant === "brisket" && side > 0;
    const pts: Pt[] =
      variant === "brisket"
        ? [
            [side * 70, -62],
            [side * 140, -82],
            [side * 172, -140],
            [side * (chipped ? 168 : 160), chipped ? -168 : -210],
          ]
        : [
            [side * 72, -58],
            [side * 128, -66],
            [side * 150, -100],
            [side * 138, -128],
          ];
    const d = smoothPath(pts, false);
    return (
      <g key={side}>
        <path d={d} fill="none" stroke={INK} strokeWidth={variant === "chuck" ? 46 : 36} strokeLinecap={chipped ? "butt" : "round"} />
        <path d={d} fill="none" stroke={L.horn} strokeWidth={variant === "chuck" ? 36 : 26} strokeLinecap={chipped ? "butt" : "round"} />
        <path d={d} fill="none" stroke="#8a7a5a" strokeWidth={variant === "chuck" ? 36 : 26} strokeDasharray="4 18" strokeLinecap="butt" opacity={0.5} />
        {chipped ? <path d={`M${side * 156},${-170} l${side * 16},${8} l${side * -4},${-10} Z`} fill="#c9bfa4" stroke={INK} strokeWidth={4} /> : null}
      </g>
    );
  };

  if (lying) {
    return (
      <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
        <Shadow cx={0} cy={0} rx={330} o={0.45} />
        <path d="M-320,-10 C-330,-150 -200,-230 0,-232 C180,-234 300,-170 310,-20 Z" fill={L.fur} stroke={INK} strokeWidth={6} />
        <path d="M-200,-14 l-60,4 M160,-14 l70,4" stroke={INK} strokeWidth={22} strokeLinecap="round" />
        <g transform="translate(300 -150) rotate(14)">
          {horn(-1)}
          {horn(1)}
          <path d={geo.head} fill={L.fur} stroke={INK} strokeWidth={6} />
          <path d="M-18,-10 q14,10 28,0 M30,-10 q14,10 28,0" stroke={INK} strokeWidth={5} fill="none" />
          <ellipse cx={0} cy={60} rx={70} ry={44} fill={L.muzzle} stroke={INK} strokeWidth={5} />
        </g>
      </g>
    );
  }

  return (
    <g transform={`translate(${x} ${y - lift}) scale(${s} ${scale})`}>
      <Shadow cx={-20} cy={lift} rx={340} o={0.45} />
      {/* tail */}
      <g transform={`rotate(${tail} -305 -300)`}>
        <path d="M-305,-300 C-330,-230 -336,-150 -330,-80" fill="none" stroke={INK} strokeWidth={18} strokeLinecap="round" />
        <path d="M-305,-300 C-330,-230 -336,-150 -330,-80" fill="none" stroke={L.fur} strokeWidth={10} strokeLinecap="round" />
        <path d={geo.tuft} fill={L.furHi} stroke={INK} strokeWidth={4} />
      </g>
      {leg(-190, 1.5, true)}
      {leg(200, 0, true)}
      <g transform={`translate(0 -150) scale(${1 - breath * 0.5} ${1 + breath}) rotate(${gallop * 2}) translate(0 150)`}>
        <path d={geo.body} fill={L.fur} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        {/* hump highlight + belly shade */}
        <path d="M-40,-360 C40,-400 120,-410 180,-372 C110,-388 30,-380 -40,-360 Z" fill={L.furHi} opacity={0.8} />
        <path d={`M-260,-150 C-120,${-120 + L.belly * 24} 80,${-118 + L.belly * 22} 230,-160 C100,${-140 + L.belly * 12} -120,${-142 + L.belly * 14} -260,-150 Z`} fill="#000" opacity={0.18} />
        {geo.scars.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#c98a8a" strokeWidth={5} strokeLinecap="round" />
        ))}
        {variant === "chuck" ? (
          <>
            <path d={blob(-150, -260, 46, 34, 8, 0.2, id + "sp1")} fill="#e9dcc0" opacity={0.9} />
            <path d={blob(60, -200, 36, 26, 8, 0.2, id + "sp2")} fill="#e9dcc0" opacity={0.9} />
          </>
        ) : null}
      </g>
      {leg(-250, 4.6, false)}
      {leg(150, 3.1, false)}
      {/* neck + head */}
      <g transform={`translate(${300 + charge * 30} ${-330 + charge * 90 + bob * 0.4}) rotate(${tilt})`}>
        {horn(-1)}
        {horn(1)}
        {/* ears */}
        <path d="M-96,-40 C-150,-50 -186,-24 -190,-6 C-160,6 -120,-6 -96,-14 Z" fill={L.fur} stroke={INK} strokeWidth={5} />
        <path d="M96,-40 C150,-50 186,-24 190,-6 C160,6 120,-6 96,-14 Z" fill={L.fur} stroke={INK} strokeWidth={5} />
        {variant === "chuck" ? <rect x={150} y={-30} width={30} height={24} rx={4} fill="#e2c13a" stroke={INK} strokeWidth={4} transform="rotate(10 165 -18)" /> : null}
        <path d={geo.dewlap} fill={L.fur} stroke={INK} strokeWidth={5} />
        <path d={geo.head} fill={L.fur} stroke={INK} strokeWidth={7} />
        {variant === "chuck" ? <path d="M-18,-96 C-30,-40 -40,20 -50,60 L50,60 C40,20 30,-40 18,-96 Z" fill="#e9dcc0" /> : null}
        {/* forelock between the horns */}
        <path d={`M-40,-100 q20,-40 40,-10 q20,-34 40,6`} fill={L.furHi} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* heavy brow + eyes */}
        <Eye
          id={`${id}-eL`}
          seed={`${id}L`}
          cx={-46}
          cy={-28}
          rx={25}
          ry={21}
          look={gaze}
          pupil={e.pupil}
          veins={variant === "brisket" ? 6 + Math.round(redEyes * 6) : 0}
          sclera={sclera}
          lidTop={Math.max(e.lidTop, blink)}
          lidBottom={e.lidBottom}
          lidAngle={-e.lidAngle}
          lidColor={L.fur}
        />
        <Eye
          id={`${id}-eR`}
          seed={`${id}R`}
          cx={46}
          cy={-30}
          rx={25}
          ry={21}
          look={gaze}
          pupil={e.pupil}
          veins={variant === "brisket" ? 6 + Math.round(redEyes * 6) : 0}
          sclera={sclera}
          lidTop={Math.max(e.lidTop, blink)}
          lidBottom={e.lidBottom}
          lidAngle={e.lidAngle}
          lidColor={L.fur}
        />
        <path d={`M-80,${-52 + e.lidAngle * 0.3} L-16,${-50 - e.lidAngle * 0.6}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M16,${-50 - e.lidAngle * 0.6} L80,${-52 + e.lidAngle * 0.3}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        {redEyes > 0.3 ? (
          <>
            <ellipse cx={-46} cy={-6} rx={30} ry={8} fill="#b8322f" opacity={0.6 * redEyes} />
            <ellipse cx={46} cy={-8} rx={30} ry={8} fill="#b8322f" opacity={0.6 * redEyes} />
          </>
        ) : null}
        {/* muzzle */}
        <path d={blob(0, 56, 82, 52, 12, 0.05, id + "muz")} fill={L.muzzle} stroke={INK} strokeWidth={6} />
        <ellipse cx={-34} cy={44} rx={13} ry={9} fill="#120c0c" transform="rotate(-15 -34 44)" />
        <ellipse cx={34} cy={44} rx={13} ry={9} fill="#120c0c" transform="rotate(15 34 44)" />
        {variant === "brisket" ? <path d="M-18,52 C-22,92 22,92 18,52" fill="none" stroke="#d4a636" strokeWidth={7} /> : null}
        <Mouth
          id={`${id}-mouth`}
          seed={`${id}m`}
          x={0}
          y={86 + bob * 0.3}
          w={92}
          maxOpen={56}
          shape={mouthShape}
          smile={e.smile}
          teeth={variant === "chuck" ? "flat" : "crooked"}
          toothColor="#efe6cc"
          lip={variant === "chuck" ? "#8a6448" : "#3a3234"}
          skew={chew * 7}
        />
        {/* Chuck's grass stalk */}
        {variant === "chuck" && !talking ? (
          <path d={`M${30 + chew * 7},86 q40,-10 70,${-30 + chew * 6} q10,-6 20,-24`} fill="none" stroke="#7a9a3a" strokeWidth={5} strokeLinecap="round" />
        ) : null}
        {steamPuffs}
      </g>
    </g>
  );
};

/**
 * DENNIS — Brisket's son, back from the Shed of No Return. Wears a vet cone, smiles at nothing,
 * slightly crossed dilated eyes. Head-and-shoulders over a stall door (that's all we ever see).
 * Origin = centre of his chin line.
 */
export const Dennis: React.FC<{ x: number; y: number; scale?: number; t: number; frame: number; mouth: MouthShape; talking?: boolean; tilt?: number }> = ({
  x,
  y,
  scale = 1,
  t,
  frame,
  mouth,
  talking = false,
  tilt = 0,
}) => {
  const t2 = onN(frame, 2) / 24;
  const bob = talking ? 4 : 0;
  const sway = Math.sin(t2 * 0.9) * 4 + tilt;
  const blink = blinkAmount(t, "dennis", 5.2);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${sway})`}>
      {/* the cone (back half) */}
      <path d="M-230,-40 L-110,-170 L110,-170 L230,-40 Z" fill="#dfe8ee" opacity={0.55} stroke={INK} strokeWidth={6} />
      {/* head */}
      <path d={blob(0, -220, 120, 120, 14, 0.04, "dennishead")} fill="#c79a6a" stroke={INK} strokeWidth={6} />
      <path d={blob(-40, -270, 46, 36, 9, 0.2, "dpatch")} fill="#f1e6d2" />
      <path d="M-104,-252 C-150,-262 -176,-236 -180,-220 C-150,-208 -120,-220 -104,-226 Z" fill="#c79a6a" stroke={INK} strokeWidth={5} />
      <path d="M104,-252 C150,-262 176,-236 180,-220 C150,-208 120,-220 104,-226 Z" fill="#c79a6a" stroke={INK} strokeWidth={5} />
      <path d="M-30,-330 q14,-26 30,-6 q16,-22 30,4" fill="#e3c9a0" stroke={INK} strokeWidth={4} />
      {/* huge, slightly crossed eyes */}
      <Eye id="dennis-eL" seed="dL" cx={-44} cy={-240} rx={34} ry={36} look={[0.45, 0.1]} pupil={0.42} lidTop={Math.max(0.05, blink)} lidColor="#c79a6a" />
      <Eye id="dennis-eR" seed="dR" cx={44} cy={-242} rx={34} ry={36} look={[-0.45, 0.1]} pupil={0.42} lidTop={Math.max(0.05, blink)} lidColor="#c79a6a" />
      <path d={blob(0, -160, 70, 46, 10, 0.05, "dmuz")} fill="#e8c9a8" stroke={INK} strokeWidth={5} />
      <ellipse cx={-24} cy={-170} rx={8} ry={6} fill="#3a2420" />
      <ellipse cx={24} cy={-170} rx={8} ry={6} fill="#3a2420" />
      <Mouth id="dennis-mouth" seed="dm" x={0} y={-136 + bob} w={70} maxOpen={40} shape={talking ? mouth : "C"} smile={0.7} teeth="crooked" toothColor="#f2ecd8" lip="#9a6a5a" />
      {/* tongue lolling */}
      {!talking ? <path d="M10,-124 q8,26 -4,34 q-12,-4 -6,-30" fill="#d9707a" stroke={INK} strokeWidth={3} /> : null}
      {/* the cone (front rim) */}
      <path d="M-230,-40 Q0,30 230,-40" fill="none" stroke="#b8c8d2" strokeWidth={16} />
      <path d="M-230,-40 Q0,30 230,-40" fill="none" stroke={INK} strokeWidth={4} />
      <path d="M-110,-170 Q0,-140 110,-170" fill="none" stroke="#b8c8d2" strokeWidth={10} opacity={0.8} />
    </g>
  );
};

/** Gossiping pig (they know things). Origin = ground. Faces right. */
export const Pig: React.FC<{ id: string; x: number; y: number; scale?: number; flip?: boolean; t: number; frame: number; talk?: number; look?: Pt }> = ({
  id,
  x,
  y,
  scale = 1,
  flip = false,
  t,
  frame,
  talk = 0,
  look = [0.5, 0],
}) => {
  const t2 = onN(frame, 2) / 24;
  const jaw = talk > 0 ? Math.abs(Math.sin(t2 * 11 + rnd(id) * 6)) * talk : 0;
  const shape: MouthShape = jaw > 0.6 ? "D" : jaw > 0.3 ? "C" : jaw > 0.1 ? "B" : "X";
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <Shadow cx={0} cy={0} rx={200} o={0.4} />
      <path d="M-170,-20 L-160,0 M-80,-20 L-74,0 M60,-20 L66,0 M130,-20 L138,0" stroke={INK} strokeWidth={30} strokeLinecap="round" />
      <path d="M-170,-20 L-160,0 M-80,-20 L-74,0 M60,-20 L66,0 M130,-20 L138,0" stroke="#d9909a" strokeWidth={20} strokeLinecap="round" />
      <path d={blob(-20, -120, 200, 110, 14, 0.05, id + "body")} fill="#e3a0a8" stroke={INK} strokeWidth={6} />
      <path d={blob(-80, -60, 90, 30, 10, 0.3, id + "mud")} fill="#5a3e28" opacity={0.85} />
      <path d="M-214,-150 q-40,-10 -30,20 q20,-6 10,16" fill="none" stroke={INK} strokeWidth={5} />
      <g transform="translate(170 -150)">
        <path d="M-50,-70 L-30,-120 L0,-80 Z M30,-80 L60,-122 L74,-70 Z" fill="#d9909a" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={blob(0, 0, 92, 84, 12, 0.05, id + "head")} fill="#e3a0a8" stroke={INK} strokeWidth={6} />
        <Eye id={`${id}-eL`} seed={`${id}L`} cx={-30} cy={-24} rx={12} ry={12} look={look} pupil={0.4} lidTop={0.35} lidColor="#e3a0a8" sw={4} />
        <Eye id={`${id}-eR`} seed={`${id}R`} cx={30} cy={-26} rx={12} ry={12} look={look} pupil={0.4} lidTop={0.35} lidColor="#e3a0a8" sw={4} />
        <ellipse cx={8} cy={22} rx={42} ry={30} fill="#efb4ba" stroke={INK} strokeWidth={5} />
        <ellipse cx={-6} cy={22} rx={7} ry={11} fill="#7a3a42" />
        <ellipse cx={22} cy={22} rx={7} ry={11} fill="#7a3a42" />
        <Mouth id={`${id}-mouth`} seed={`${id}m`} x={6} y={64} w={60} maxOpen={36} shape={shape} smile={0.3} teeth="crooked" toothColor="#ece2c6" lip="#b8707a" />
      </g>
      <path d="M-218,-130 q-26,-20 -18,-46" fill="none" stroke="#e3a0a8" strokeWidth={8} strokeLinecap="round" />
      {/* flies */}
      {[0, 1].map((i) => (
        <circle key={i} cx={40 + Math.sin(t * 3 + i * 2) * 90} cy={-220 + Math.cos(t * 2.6 + i) * 40} r={4} fill="#0d0a0a" />
      ))}
    </g>
  );
};

/** A crow (they say things too). Origin = feet. Faces left. */
export const Crow: React.FC<{ x: number; y: number; scale?: number; t: number; flip?: boolean; caw?: number }> = ({ x, y, scale = 1, t, flip = false, caw = 0 }) => {
  const bob = Math.round(Math.sin(t * 3) * 2);
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${flip ? -scale : scale} ${scale})`}>
      <path d="M-6,0 l-4,-24 M8,0 l4,-24" stroke="#3a3530" strokeWidth={5} />
      <ellipse cx={4} cy={-46} rx={34} ry={24} fill="#0b090c" />
      <path d="M30,-50 l48,18 l-50,6 Z" fill="#0b090c" />
      <circle cx={-26} cy={-70} r={17} fill="#0b090c" />
      <path d={`M-40,-72 l-30,${2 - caw * 6} l30,${8 + caw * 10} Z`} fill="#3a3530" stroke={INK} strokeWidth={2} />
      <circle cx={-30} cy={-74} r={3.5} fill="#d9d36a" />
    </g>
  );
};

function mixHex(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}
