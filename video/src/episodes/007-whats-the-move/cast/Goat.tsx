import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, blob, clamp, limb, onN, smoothPath } from "../../../engine/util";
import { DLine, Eye, Flies, INK, Mouth, Shadow, StinkLines, blinkAmount, saccade, taperPath } from "../../../characters/parts";
import { mixHex } from "../../../characters/Possum";

/**
 * LYLE — the lanky goat who is going home.
 * Dirty-white fur with a mangy brown eye patch, gold eyes with sideways slit pupils, backswept ridged horns,
 * floppy ears, a scraggly goatee and a permanent buck-toothed grin. Sweat-soaked short-sleeve dress shirt,
 * a loosened tomato tie, slacks two inches too short, cloven hooves for hands and a jangling key ring
 * with a pine-tree air freshener. Laughs "ah-hyuk".
 * Faces right by default. Origin = floor between the hooves.
 */

export type LyleExpr = "grin" | "deadpan" | "smug" | "pity" | "mock" | "laugh" | "wide" | "tired" | "sly" | "annoyed";

export interface LyleProps {
  id: string;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  t: number;
  frame: number;
  mouth: MouthShape;
  talking?: boolean;
  energy?: number;
  expr?: LyleExpr;
  look?: Pt;
  headTilt?: number;
  /** [shoulder, elbow] degrees, 0 = hanging down, + = forward */
  armF?: [number, number];
  armB?: [number, number];
  /** ankle targets (body coords). Defaults: a relaxed stance */
  footF?: Pt;
  footB?: Pt;
  /** 0..1 heel raised (tiptoe / moonwalk) */
  heelF?: number;
  heelB?: number;
  /** hip shift sideways (px) */
  sway?: number;
  /** knees bend: hips drop by this many px */
  crouch?: number;
  /** torso lean in degrees (+ = forward) */
  lean?: number;
  /** 0..1 head thrown back (laughing) */
  headBack?: number;
  /** 0..1 slump into the Duane impression: belly out, shoulders rounded, head jutting */
  slump?: number;
  /** which hoof holds the key ring */
  keys?: "F" | "B" | false;
  /** degrees: key ring twirling round the hoof (undefined = hanging) */
  keysSpin?: number;
  /** 0..1 extra sweat */
  sweat?: number;
  flies?: number;
  /** goatee swing (px), e.g. from dancing */
  beardSwing?: number;
  /** 0..1 the soaked armpit on display: stink lines, drips, flies */
  pitReveal?: number;
  /** a spare party hat (for the Duane impression) */
  hat?: boolean;
  /** a beer can in the near hoof (for the Duane impression) */
  can?: boolean;
}

const FUR = "#e7dfcc";
const FUR_DK = "#bcb09a";
const PATCH = "#8b6b4b";
const SNOUT = "#dccfb8";
const NOSE = "#5a3f3a";
const HORN = "#b8a78a";
const HORN_DK = "#8a7a60";
const HOOF = "#2f2724";
const SHIRT = "#ece8da";
const SHIRT_DK = "#cfc9b4";
const STAIN = "#d6c164";
const TIE = "#c8432d";
const TIE_DK = "#8e2a1c";
const SLACKS = "#3c3a46";
const SLACKS_DK = "#2a2932";
const TOOTH = "#ece0a2";
const GUM = "#c76a74";

type ExprSpec = { lidTop: number; lidBottom: number; lidAngle: number; brow: number; browTilt: number; grin: number; smile: number; closed?: boolean };
const EXPR: Record<LyleExpr, ExprSpec> = {
  grin: { lidTop: 0.36, lidBottom: 0.22, lidAngle: 8, brow: -0.1, browTilt: 8, grin: 1, smile: 0.7 },
  deadpan: { lidTop: 0.52, lidBottom: 0.16, lidAngle: 0, brow: 0, browTilt: 0, grin: 0, smile: 0 },
  smug: { lidTop: 0.46, lidBottom: 0.26, lidAngle: 12, brow: -0.3, browTilt: 12, grin: 0.75, smile: 0.5 },
  pity: { lidTop: 0.3, lidBottom: 0.12, lidAngle: -16, brow: 1.1, browTilt: -20, grin: 0.35, smile: -0.25 },
  mock: { lidTop: 0.64, lidBottom: 0.08, lidAngle: -8, brow: 0.5, browTilt: -10, grin: 0, smile: -0.35 },
  laugh: { lidTop: 1, lidBottom: 0, lidAngle: 0, brow: 0.8, browTilt: -8, grin: 1, smile: 1, closed: true },
  wide: { lidTop: 0, lidBottom: 0, lidAngle: 0, brow: 1.4, browTilt: -6, grin: 1, smile: 0.9 },
  tired: { lidTop: 0.74, lidBottom: 0.22, lidAngle: -4, brow: -0.2, browTilt: 0, grin: 0, smile: -0.2 },
  sly: { lidTop: 0.52, lidBottom: 0.3, lidAngle: 18, brow: -0.6, browTilt: 18, grin: 0.85, smile: 0.6 },
  annoyed: { lidTop: 0.42, lidBottom: 0.18, lidAngle: 16, brow: -0.9, browTilt: 20, grin: 0, smile: -0.45 },
};

/** head centre with the body standing straight (body coords, facing right) */
export const LYLE_HEAD: Pt = [44, -600];
const HIP_Y = -316;
const THIGH = 158;
const SHIN = 150;

/** two-bone IK: knee position for a leg from `a` (hip) to `b` (ankle); bend = +1 knee forward (+x) */
export function ik2(a: Pt, b: Pt, l1: number, l2: number, bend = 1): Pt {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5);
  const ang = Math.atan2(dy, dx);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const k = ang - bend * A;
  return [a[0] + Math.cos(k) * l1, a[1] + Math.sin(k) * l1];
}

export const Goat: React.FC<LyleProps> = ({
  id,
  x,
  y,
  scale = 1,
  flip = false,
  t,
  frame,
  mouth,
  talking = false,
  energy = 0,
  expr = "grin",
  look,
  headTilt = 0,
  armF = [8, 18],
  armB = [-6, 12],
  footF = [30, -30],
  footB = [-26, -30],
  heelF = 0,
  heelB = 0,
  sway = 0,
  crouch = 0,
  lean = 4,
  headBack = 0,
  slump = 0,
  keys = "B",
  keysSpin,
  sweat = 0.4,
  flies = 0,
  beardSwing = 0,
  pitReveal = 0,
  hat = false,
  can = false,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 6 + energy * 3 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 1.0 : 0.3), 7) * (talking ? 6 : 2.5) - headBack * 38 + slump * 10;
  const blink = e.closed ? 0 : blinkAmount(t, id, 3.6);
  const dart = saccade(t, id, 0.1, 1.1);
  const gaze: Pt = [(look?.[0] ?? 0.5) + dart[0], (look?.[1] ?? 0.1) + dart[1]];
  const sw = clamp(sweat);

  const geo = useMemo(
    () => ({
      skull: blob(-6, -10, 56, 50, 12, 0.05, id + "skull"),
      patch: blob(42, -16, 30, 25, 9, 0.22, id + "patch"),
      tuft: blob(-4, -54, 17, 12, 7, 0.4, id + "tuft"),
    }),
    [id],
  );

  // ---- legs (IK to the ankles) ----
  const hip: Pt = [sway, HIP_Y + crouch];
  const hipF: Pt = [hip[0] + 16, hip[1] + 6];
  const hipB: Pt = [hip[0] - 18, hip[1] + 4];
  const ankF: Pt = [footF[0], footF[1] - heelF * 26];
  const ankB: Pt = [footB[0], footB[1] - heelB * 26];
  const kneeF = ik2(hipF, ankF, THIGH, SHIN, 1);
  const kneeB = ik2(hipB, ankB, THIGH, SHIN, 1);

  const leg = (hp: Pt, kn: Pt, an: Pt, heel: number, back: boolean, key: string) => {
    // slacks end a bit above the ankle: hairy shin + white sock-less fetlock showing
    const hem: Pt = [kn[0] + (an[0] - kn[0]) * 0.78, kn[1] + (an[1] - kn[1]) * 0.78];
    const hoofRot = heel * 52;
    return (
      <g key={key}>
        <DLine d={`M${hem[0]},${hem[1]} L${an[0]},${an[1]}`} w={22} color={back ? FUR_DK : FUR} ow={4.5} />
        <path d={`M${an[0] - 9},${an[1] - 12} l-6,-8 M${an[0] + 7},${an[1] - 14} l5,-9`} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
        <g transform={`translate(${an[0]} ${an[1]}) rotate(${hoofRot})`}>
          <path d="M-16,-4 C-18,14 -12,30 2,30 L4,30 L4,8 Z" fill={back ? "#241e1c" : HOOF} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M6,-4 C24,-2 32,16 30,30 L8,30 L6,8 Z" fill={back ? "#241e1c" : HOOF} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M-14,-6 Q8,-14 26,-6" stroke={INK} strokeWidth={4} fill={back ? FUR_DK : FUR} />
        </g>
        <path d={taperPath([hp, kn, hem], 50, 38)} fill={back ? SLACKS_DK : SLACKS} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M${kn[0] - 4},${kn[1] - 30} q8,26 0,52`} stroke={back ? "#1c1b22" : SLACKS_DK} strokeWidth={3} fill="none" />
        <path d={`M${hem[0] - 19},${hem[1]} L${hem[0] + 19},${hem[1] + 2}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      </g>
    );
  };

  // ---- torso (rotates about the hip) ----
  const leanDeg = lean + slump * 6;
  const belly = slump * 44;
  const torso = smoothPath(
    [
      [-52, 10],
      [54, 10],
      [62 + belly, -44 - belly * 0.3],
      [58 + belly * 0.4, -128],
      [46, -194 + slump * 8],
      [14, -218 + slump * 10],
      [-26, -214 + slump * 10],
      [-56, -186 + slump * 12],
      [-62, -108],
    ],
    true,
    0.62,
  );
  const SF: Pt = [36, -194 + slump * 10];
  const SB: Pt = [-42, -188 + slump * 10];
  const aF = limb(SF, armF, [118, 112]);
  const aB = limb(SB, armB, [118, 112]);
  const HC: Pt = [44 + slump * 26, -284 + slump * 30 + bob * 0.5];
  const neck = smoothPath([[12, -204 + slump * 10], [24, -232 + slump * 18], [HC[0] - 10, HC[1] + 26]], false, 0.8);

  const hoofHand = (pts: Pt[], back: boolean, key: string, withKeys: boolean) => {
    const end = pts[2];
    const prev = pts[1];
    const a = Math.atan2(end[0] - prev[0], end[1] - prev[1]);
    const deg = (-a * 180) / Math.PI;
    const spin = keysSpin;
    const ring: Pt = spin === undefined ? [end[0] + Math.sin(a) * 26, end[1] + Math.cos(a) * 26] : [end[0] + Math.cos((spin * Math.PI) / 180) * 34, end[1] + Math.sin((spin * Math.PI) / 180) * 34];
    const swing = spin === undefined ? noise2D(id + "keys", t2 * 1.4, 2) * 16 : spin + 90;
    return (
      <g key={key}>
        {withKeys ? (
          <g>
            <path d={`M${end[0]},${end[1]} L${ring[0]},${ring[1]}`} stroke="#6b3fa0" strokeWidth={5} strokeLinecap="round" />
            <g transform={`translate(${ring[0]} ${ring[1]}) rotate(${swing})`}>
              <circle r={11} fill="none" stroke="#c9c9c4" strokeWidth={4} />
              <circle r={11} fill="none" stroke={INK} strokeWidth={1.5} />
              {[-30, -8, 16].map((r, i) => (
                <g key={i} transform={`rotate(${r}) translate(0 10)`}>
                  <path d="M-5,0 L5,0 L5,26 L2,30 L2,36 L-2,36 L-2,32 L-5,32 Z" fill={i === 1 ? "#d9b44a" : "#c9c9c4"} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
                </g>
              ))}
              {/* the pine-tree air freshener (it lost) */}
              <g transform="rotate(36) translate(0 12)">
                <path d="M0,0 L-14,16 L-7,16 L-17,30 L-8,30 L-19,46 L19,46 L8,30 L17,30 L7,16 L14,16 Z" fill="#3f8f4a" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
                <rect x={-3} y={46} width={6} height={8} fill="#7a5a3a" stroke={INK} strokeWidth={2} />
              </g>
            </g>
          </g>
        ) : null}
        {!back && can ? (
          <g transform={`translate(${end[0] + Math.sin(a) * 12} ${end[1] + Math.cos(a) * 12})`}>
            <rect x={-15} y={-30} width={30} height={56} rx={6} fill="#a9bccb" stroke={INK} strokeWidth={4} />
            <rect x={-15} y={-12} width={30} height={19} fill="#d64545" />
            <rect x={-15} y={-30} width={30} height={56} rx={6} fill="none" stroke={INK} strokeWidth={4} />
            <ellipse cx={0} cy={-30} rx={13} ry={3.5} fill="#d4dde4" stroke={INK} strokeWidth={2.5} />
          </g>
        ) : null}
        <g transform={`translate(${end[0]} ${end[1]}) rotate(${deg})`}>
          <path d="M-16,-6 C-20,10 -14,26 -2,26 L0,26 L0,6 Z" fill={back ? "#241e1c" : HOOF} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M2,-6 C18,-4 22,12 16,26 L4,26 L2,6 Z" fill={back ? "#241e1c" : HOOF} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
      </g>
    );
  };

  const arm = (pts: Pt[], back: boolean) => {
    const sleeveEnd: Pt = [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.46, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.46];
    return (
      <>
        <DLine d={smoothPath(pts, false, 0.6)} w={22} color={back ? FUR_DK : FUR} ow={4.5} />
        <path d={taperPath([pts[0], sleeveEnd], 46, 40)} fill={back ? SHIRT_DK : SHIRT} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </>
    );
  };

  // ---- the face ----
  const closedMouth = mouth === "X" || mouth === "A";
  const showGrin = e.grin > 0.3 && closedMouth && !talking;
  const mouthShape: MouthShape = headBack > 0.4 ? "D" : expr === "mock" && closedMouth ? "B" : mouth;
  const swingB = beardSwing + noise2D(id + "beard", t2 * 1.1, 4) * 5 + (talking ? open * 5 : 0);
  const sweatDrops = 1 + Math.round(sw * 2);

  const s = flip ? -scale : scale;
  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={0} cy={2} rx={112} o={0.35} />
      {/* far arm behind everything */}
      <g transform={`translate(${hip[0]} ${hip[1]}) rotate(${leanDeg})`}>
        {arm(aB, true)}
        {hoofHand(aB, true, "hB", keys === "B")}
      </g>
      {leg(hipB, kneeB, ankB, heelB, true, "lB")}
      {leg(hipF, kneeF, ankF, heelF, false, "lF")}
      <g transform={`translate(${hip[0]} ${hip[1]}) rotate(${leanDeg})`}>
        {/* hips + belt */}
        <path d="M-50,-6 L52,-6 L56,34 L-54,34 Z" fill={SLACKS} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {/* shirt */}
        <path d={torso} fill={SHIRT} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* half-untucked tail */}
        <path d="M18,6 L52,10 L50,30 L22,24 Z" fill={SHIRT} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M-50,2 Q2,${10 + belly * 0.2} 52,2`} stroke="#151418" strokeWidth={11} fill="none" strokeLinecap="round" />
        <rect x={-6} y={-4} width={22} height={16} rx={3} fill="#c9a33a" stroke={INK} strokeWidth={3} />
        {/* sweat: pits, chest bib, and the back */}
        <ellipse cx={40} cy={-150 + slump * 8} rx={18 + sw * 10} ry={26 + sw * 14} fill={STAIN} opacity={0.75} />
        <ellipse cx={-46} cy={-146 + slump * 8} rx={16 + sw * 8} ry={24 + sw * 12} fill={STAIN} opacity={0.6} />
        <path d={`M-4,-200 Q22,${-120 - sw * 30} 44,-196 Z`} fill={STAIN} opacity={0.5} />
        <path d="M-54,-150 q-6,40 4,90" stroke={SHIRT_DK} strokeWidth={4} fill="none" />
        <path d={`M30,-210 L34,${-10 + belly * 0.2}`} stroke={SHIRT_DK} strokeWidth={3} />
        {[-150, -110, -70, -30].map((by) => (
          <circle key={by} cx={33 + (by + 150) * 0.02 + (by > -60 ? belly * 0.6 : 0)} cy={by} r={3.2} fill="#f7f4ea" stroke={INK} strokeWidth={1.2} />
        ))}
        {/* neck */}
        <path d={neck} stroke={INK} strokeWidth={44} fill="none" strokeLinecap="round" />
        <path d={neck} stroke={FUR} strokeWidth={34} fill="none" strokeLinecap="round" />
        <path d={`M${HC[0] - 30},${HC[1] + 40} q10,14 4,30 M${HC[0] - 14},${HC[1] + 50} q6,10 2,22`} stroke={FUR_DK} strokeWidth={3} fill="none" />
        {/* open collar + the loosened tie */}
        <path d={`M-6,${-212 + slump * 10} L10,${-190 + slump * 10} L18,${-214 + slump * 10} Z M18,${-214 + slump * 10} L32,${-188 + slump * 10} L44,${-208 + slump * 10} Z`} fill={SHIRT} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {(() => {
          const sy = slump * 10;
          const tsw = noise2D(id + "tie", t2 * 1.3, 1) * 6 + beardSwing * 0.6;
          const k: Pt = [22, -186 + sy];
          const tip: Pt = [36 + tsw + belly * 0.7, -64 + sy * 0.5];
          return (
            <g>
              <path d={`M${k[0] - 9},${k[1] - 8} L${k[0] + 11},${k[1] - 8} L${k[0] + 7},${k[1] + 8} L${k[0] - 5},${k[1] + 8} Z`} fill={TIE_DK} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
              <path d={`M${k[0] - 5},${k[1] + 8} L${k[0] + 7},${k[1] + 8} L${tip[0] + 12},${tip[1] - 14} L${tip[0]},${tip[1]} L${tip[0] - 12},${tip[1] - 16} Z`} fill={TIE} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
              {[0.3, 0.55, 0.8].map((u) => (
                <path key={u} d={`M${k[0] - 4 + (tip[0] - k[0]) * u - 6},${k[1] + 8 + (tip[1] - k[1]) * u + 4} l14,-10`} stroke="#f0d070" strokeWidth={3} strokeLinecap="round" />
              ))}
              {/* the strap hangs loose */}
              <path d={`M${k[0] - 9},${k[1] - 6} Q-24,${-206 + sy} -14,${-220 + sy}`} stroke={TIE_DK} strokeWidth={6} fill="none" />
            </g>
          );
        })()}
        {/* ---- head ---- */}
        <g transform={`translate(${HC[0]} ${HC[1]}) rotate(${tilt})`}>
          {/* far horn + far ear (behind the skull) */}
          <path d={taperPath([[8, -48], [-8, -88], [-48, -110], [-86, -98], [-100, -68]], 30, 8)} fill={HORN_DK} stroke={INK} strokeWidth={4} />
          <path d={taperPath([[0, -30], [-34, -36], [-66, -30], [-84, -18]], 30, 10)} fill={FUR_DK} stroke={INK} strokeWidth={4} />
          <path d={geo.skull} fill={FUR} stroke={INK} strokeWidth={5} />
          {/* long snout */}
          <path d="M12,-34 C58,-40 104,-22 124,4 C132,22 118,44 92,46 C64,48 30,40 12,22 Z" fill={SNOUT} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M38,-30 C70,-28 98,-14 112,2" stroke={mixHex(SNOUT, "#000000", 0.14)} strokeWidth={4} fill="none" />
          {/* nostrils */}
          <path d="M114,0 q8,-2 10,6 M108,14 q8,0 10,8" stroke={NOSE} strokeWidth={5} strokeLinecap="round" fill="none" />
          <path d={geo.patch} fill={PATCH} opacity={0.85} />
          {/* bags under the eyes */}
          <path d="M-10,2 q12,9 24,0 M28,6 q16,11 32,0" stroke="#9a8aa0" strokeWidth={4} fill="none" opacity={0.7} strokeLinecap="round" />
          {/* eyes */}
          {e.closed ? (
            <g stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none">
              <path d="M-6,-18 Q8,-32 22,-18" />
              <path d="M30,-18 Q44,-34 60,-18" />
              <path d="M62,-8 q6,6 2,14" stroke="#bfe3f2" strokeWidth={5} />
            </g>
          ) : (
            <>
              <Eye id={`${id}-eB`} seed={`${id}B`} cx={8} cy={-20} rx={14} ry={15} look={gaze} kind="slit" iris="#d8b03a" sclera="#f0ead2" lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={-e.lidAngle} lidColor={FUR} sw={4} />
              <Eye id={`${id}-eF`} seed={`${id}F`} cx={44} cy={-18} rx={18} ry={19} look={gaze} kind="slit" iris="#d8b03a" sclera="#f0ead2" veins={2} lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={e.lidAngle} lidColor={mixHex(FUR, PATCH, 0.55)} sw={4} />
            </>
          )}
          {/* bony brows */}
          {[
            [8, -20, 14, -1],
            [44, -18, 18, 1],
          ].map(([cx, cy, rx, side], i) => {
            const by = cy - 24 - e.brow * 7;
            const dy = Math.tan((e.browTilt * Math.PI) / 180) * rx * side;
            return <path key={i} d={`M${cx - rx},${by + dy} Q${cx},${by - 8} ${cx + rx},${by - dy}`} stroke={FUR_DK} strokeWidth={8} strokeLinecap="round" fill="none" />;
          })}
          {/* near ear, floppy */}
          <path d={taperPath([[-28, -16], [-52, -8], [-74, 6], [-84, 20]], 28, 8)} fill={FUR} stroke={INK} strokeWidth={4} />
          <path d="M-42,-8 q-16,6 -34,18" stroke="#d9a7a0" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
          {/* near horn (ridged) */}
          <path d={taperPath([[-10, -52], [-26, -94], [-66, -116], [-104, -104], [-118, -72]], 34, 8)} fill={HORN} stroke={INK} strokeWidth={4.5} />
          {[0.18, 0.32, 0.46, 0.6, 0.74].map((u, i) => {
            const pts: Pt[] = [[-10, -52], [-26, -94], [-66, -116], [-104, -104], [-118, -72]];
            const idx = u * (pts.length - 1);
            const a0 = pts[Math.floor(idx)];
            const a1 = pts[Math.min(pts.length - 1, Math.floor(idx) + 1)];
            const f = idx - Math.floor(idx);
            const p: Pt = [a0[0] + (a1[0] - a0[0]) * f, a0[1] + (a1[1] - a0[1]) * f];
            const ang = (Math.atan2(a1[1] - a0[1], a1[0] - a0[0]) * 180) / Math.PI + 90;
            const w = 15 - i * 2;
            return <path key={i} d={`M${-w},0 L${w},0`} transform={`translate(${p[0]} ${p[1]}) rotate(${ang})`} stroke={HORN_DK} strokeWidth={3} strokeLinecap="round" />;
          })}
          <path d={geo.tuft} fill={FUR_DK} stroke={INK} strokeWidth={3.5} />
          {hat ? (
            <g transform="rotate(-14 10 -56)">
              <path d="M-18,-54 L8,-150 L40,-58 Z" fill="#5aa0d8" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
              {[
                [4, -80],
                [20, -100],
                [10, -122],
                [-6, -66],
                [26, -70],
              ].map(([hx, hy], i) => (
                <path key={i} d={`M${hx},${hy - 6} l2,4 l5,1 l-4,3 l1,5 l-4,-3 l-4,3 l1,-5 l-4,-3 l5,-1 Z`} fill="#f4d24a" />
              ))}
              <path d="M-18,-54 Q10,-46 40,-58" stroke={INK} strokeWidth={4} fill="none" />
              <path d={blob(8, -154, 12, 10, 8, 0.4, id + "pom")} fill="#f4d24a" stroke={INK} strokeWidth={3} />
            </g>
          ) : null}
          {/* mouth: a clenched buck-toothed grin when quiet, real shapes when talking */}
          {showGrin ? (
            <g transform="translate(-2 -18) rotate(-6 90 56)">
              <path d="M58,46 Q90,52 120,38 Q112,70 86,70 Q64,68 58,46 Z" fill="#3a1414" stroke={GUM} strokeWidth={6} strokeLinejoin="round" />
              {[0, 1, 2, 3, 4].map((i) => {
                const tx = 64 + i * 10.5;
                const ty = 48 + Math.sin((i / 4) * Math.PI) * 3 - i * 1.2;
                return <rect key={`u${i}`} x={tx} y={ty} width={10} height={11 - Math.abs(i - 2) * 0.5} rx={2} fill={i === 3 ? "#d4c27a" : TOOTH} stroke={INK} strokeWidth={1.8} />;
              })}
              {[0, 1, 2, 3].map((i) => (
                <rect key={`l${i}`} x={70 + i * 10} y={58 - i * 0.8} width={9.5} height={9} rx={2} fill={TOOTH} stroke={INK} strokeWidth={1.8} />
              ))}
              <path d="M58,46 Q90,52 120,38 Q112,70 86,70 Q64,68 58,46 Z" fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
              <path d="M52,40 q-4,8 2,14 M124,30 q6,6 2,14" stroke={INK} strokeWidth={3} fill="none" strokeLinecap="round" />
            </g>
          ) : (
            <g transform="rotate(-6 88 40)">
              <Mouth id={`${id}-m`} seed={`${id}m`} x={88} y={40} w={46} maxOpen={36} shape={mouthShape} smile={e.smile} teeth="flat" toothColor={TOOTH} lip="#9c8a78" inside="#3a1414" scream={headBack > 0.4 ? 1.35 : 1} />
            </g>
          )}
          {/* goatee */}
          <path d={taperPath([[84, 46], [82 + swingB * 0.3, 74], [78 + swingB * 0.7, 102], [72 + swingB, 126]], 30, 4)} fill={FUR_DK} stroke={INK} strokeWidth={4} />
          <path d={`M78,72 l${-4 + swingB * 0.4},20 M88,78 l${2 + swingB * 0.5},16`} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          {/* sweat beads */}
          {Array.from({ length: sweatDrops }).map((_, i) => {
            const ph = (t * 0.7 + i * 0.37) % 1;
            return <ellipse key={i} cx={[-30, 60, 0][i]} cy={-46 + ph * 70} rx={5} ry={8} fill="#bfe3f2" stroke={INK} strokeWidth={2.2} opacity={1 - ph} />;
          })}
        </g>
        {/* near arm in front */}
        {arm(aF, false)}
        {hoofHand(aF, false, "hF", keys === "F")}
        {pitReveal > 0 ? (
          <g opacity={pitReveal}>
            <ellipse cx={44} cy={-150 + slump * 8} rx={34} ry={44} fill={STAIN} opacity={0.8} />
            <path d={blob(44, -150, 18, 26, 8, 0.3, id + "pitDk")} fill="#b8a040" opacity={0.7} />
            {[0, 1, 2].map((i) => {
              const ph = (t * 1.3 + i * 0.33) % 1;
              return <ellipse key={i} cx={32 + i * 12} cy={-112 + ph * 120} rx={5} ry={8} fill="#d9cf8a" stroke={INK} strokeWidth={2} opacity={1 - ph} />;
            })}
            <g transform="rotate(-38 44 -150)">
              <StinkLines x={44} y={-150} t={t} n={3} h={150} color="#a8b84a" />
            </g>
            <Flies cx={-10} cy={-210} count={4} t={t} r={60} seed={id + "pitfly"} size={1.3} />
          </g>
        ) : null}
      </g>
      {flies > 0 ? <Flies cx={60} cy={-460} count={flies} t={t} r={120} seed={id + "fly"} /> : null}
    </g>
  );
};
