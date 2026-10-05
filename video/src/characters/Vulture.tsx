import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import type { MouthShape } from "../engine/timeline";
import { Pt, blob, limb, onN, smoothPath } from "../engine/util";
import { DLine, Eye, INK, Shadow, blinkAmount, saccade, taperPath } from "./parts";
import { mixHex } from "./Possum";

/**
 * MR. GIZZARD — the vulture shift manager.
 * Bald wrinkled head with a three-hair comb-over, hooked beak, half-moon reading glasses he stares over,
 * feather ruff poking out of a short-sleeve shirt with pit stains, a too-short mustard tie,
 * khakis hiked up to the chest, bare scaly talons, a "#1 BOSS" mug — and, when he must bear witness, a headlamp.
 * Faces right by default. Origin = floor between the talons.
 */

export type GizzardExpr = "stern" | "smug" | "intense" | "gleeful" | "disgusted" | "lecture" | "sly" | "shocked";
export type GizzardPose = "stand" | "perch" | "sit";

export interface GizzardProps {
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
  expr?: GizzardExpr;
  pose?: GizzardPose;
  look?: Pt;
  headTilt?: number;
  /** wing poses: [shoulder, elbow] */
  armF?: [number, number];
  armB?: [number, number];
  mug?: boolean;
  /** 0..1 mug up to the beak */
  sip?: number;
  /** headlamp switched on; beam angle in degrees (0 = straight ahead, + = down) */
  lamp?: boolean;
  lampAim?: number;
  /** eyes glow in the dark (perched reveal) */
  glow?: number;
  /** 0..1 feathers puffed up (disgust / shock) */
  puff?: number;
  /** neck stretch forward (looming), px */
  crane?: number;
  /** 0..1 sunk into shadow (silhouette); the eye glow stays bright */
  shade?: number;
}

const SKIN = "#d88f80";
const SKIN_DK = "#b86a5e";
const FEATHER = "#3a2c27";
const FEATHER_DK = "#221916";
const BEAK = "#e9ddb4";
const CERE = "#b9a77a";
const SHIRT = "#efece3";
const KHAKI = "#c7ae7c";
const KHAKI_DK = "#a08858";
const TIE = "#d3a020";
const SCALE = "#8d8a84";

const EXPR: Record<GizzardExpr, { lidTop: number; lidBottom: number; lidAngle: number; pupil: number; brow: number; open: number }> = {
  stern: { lidTop: 0.3, lidBottom: 0.12, lidAngle: 16, pupil: 0.2, brow: -0.6, open: 0 },
  smug: { lidTop: 0.5, lidBottom: 0.2, lidAngle: 6, pupil: 0.18, brow: -0.2, open: 0 },
  intense: { lidTop: 0.0, lidBottom: 0.0, lidAngle: 8, pupil: 0.12, brow: -0.8, open: 0 },
  gleeful: { lidTop: 0.62, lidBottom: 0.4, lidAngle: -6, pupil: 0.2, brow: 0.6, open: 0.35 },
  disgusted: { lidTop: 0.84, lidBottom: 0.5, lidAngle: 22, pupil: 0.16, brow: -1.2, open: 0.75 },
  lecture: { lidTop: 0.36, lidBottom: 0.1, lidAngle: -4, pupil: 0.18, brow: 0.8, open: 0 },
  sly: { lidTop: 0.45, lidBottom: 0.3, lidAngle: 18, pupil: 0.12, brow: -0.7, open: 0 },
  shocked: { lidTop: 0, lidBottom: 0, lidAngle: -6, pupil: 0.1, brow: 1.5, open: 0.5 },
};

const OPEN: Record<MouthShape, number> = { X: 0, A: 0, B: 0.14, C: 0.45, D: 0.9, E: 0.4, F: 0.22, G: 0.12, H: 0.5 };

/** head centre per pose (body coordinates, before `crane`) */
export const GIZZARD_HEAD: Record<GizzardPose, Pt> = { stand: [92, -588], perch: [104, -470], sit: [92, -438] };

export const Vulture: React.FC<GizzardProps> = ({
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
  expr = "stern",
  pose = "stand",
  look,
  headTilt = 0,
  armF,
  armB,
  mug = true,
  sip = 0,
  lamp = false,
  lampAim = 18,
  glow = 0,
  puff = 0,
  crane = 0,
  shade = 0,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const open = Math.max(OPEN[sip > 0.5 ? "X" : mouth] * (talking ? 1 : 0.6), e.open);
  const bob = talking ? open * 8 + energy * 4 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.8 : 0.25), 5) * (talking ? 5 : 2);
  const blink = expr === "intense" ? 0 : blinkAmount(t, id, 4.2);
  const dart = saccade(t, id, 0.08, 1.4);
  const gaze: Pt = [(look?.[0] ?? 0.5) + dart[0], (look?.[1] ?? 0.1) + dart[1]];
  const dy = pose === "perch" ? 118 : pose === "sit" ? 150 : 0;
  const hunch = pose === "perch" ? 18 : 0;

  const geo = useMemo(
    () => ({
      head: blob(0, 0, 54, 46, 12, 0.05, id + "head"),
      ruff: (() => {
        const pts: Pt[] = [];
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2;
          const r = i % 2 === 0 ? 1 : 1.32;
          pts.push([Math.cos(a) * 50 * r, Math.sin(a) * 22 * r]);
        }
        return `M${pts.map((p) => p.join(",")).join(" L")} Z`;
      })(),
    }),
    [id],
  );

  const defF: [number, number] = pose === "perch" ? [8, 30] : pose === "sit" ? [34, 92] : [16, 64];
  const defB: [number, number] = pose === "perch" ? [-6, 10] : [-10, 12];
  const shF: Pt = [54 + hunch, -452 + dy];
  const shB: Pt = [-40 + hunch, -452 + dy];
  const aFang: [number, number] = sip > 0 ? [lerpN((armF ?? defF)[0], 118, sip), lerpN((armF ?? defF)[1], -6, sip)] : armF ?? defF;
  const aF = limb(shF, aFang, [100, 96]);
  const aB = limb(shB, armB ?? defB, [100, 96]);
  const headBase = GIZZARD_HEAD[pose];
  const head: Pt = [headBase[0] + crane + sip * 24, headBase[1] - crane * 0.25 + bob * 0.5 + sip * 34];
  const neckBase: Pt = [16 + hunch, -482 + dy];
  const neck = smoothPath(
    [neckBase, [neckBase[0] + 18 + crane * 0.2, neckBase[1] - 46], [head[0] - 30, head[1] + 18], [head[0] - 8, head[1] + 4]],
    false,
    0.8,
  );

  const wing = (pts: Pt[], back: boolean, key: string) => {
    const col = back ? FEATHER_DK : FEATHER;
    const end = pts[2];
    const prev = pts[1];
    const a = Math.atan2(end[0] - prev[0], end[1] - prev[1]);
    const primaries = [-0.55, -0.28, 0, 0.26, 0.5].map((da, i) => {
      const r = a + da;
      const l = 58 + (i === 2 ? 14 : i === 1 || i === 3 ? 8 : 0);
      return taperPath([end, [end[0] + Math.sin(r) * l * 0.5, end[1] + Math.cos(r) * l * 0.5], [end[0] + Math.sin(r) * l, end[1] + Math.cos(r) * l]], 14, 4);
    });
    return (
      <g key={key}>
        {/* broad wing blade along the arm (drapes like a cape when the arm hangs) */}
        <path d={taperPath([pts[0], [pts[1][0] - 10, pts[1][1] + 12], [end[0] - 6, end[1] + 10]], 70, 30)} fill={col} stroke={INK} strokeWidth={5} />
        <DLine d={smoothPath(pts, false, 0.6)} w={24} color={mixHex(col, "#5a463d", 0.4)} ow={4} />
        {primaries.map((d, i) => (
          <path key={i} d={d} fill={col} stroke={INK} strokeWidth={3.5} />
        ))}
        {/* short white sleeve */}
        <path d={taperPath([pts[0], [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.4, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.4]], 58, 50)} fill={SHIRT} stroke={INK} strokeWidth={5} />
      </g>
    );
  };

  // legs per pose
  const legs = () => {
    if (pose === "sit") {
      return (
        <g>
          {[-14, 22].map((lx, i) => (
            <g key={i}>
              <path d={`M${lx + 96},-84 L${lx + 104},-16`} stroke={INK} strokeWidth={20} strokeLinecap="round" />
              <path d={`M${lx + 96},-84 L${lx + 104},-16`} stroke={SCALE} strokeWidth={12} strokeLinecap="round" />
              <path d={taperPath([[lx - 10, -150], [lx + 50, -128], [lx + 100, -112]], 62, 52)} fill={i ? KHAKI : KHAKI_DK} stroke={INK} strokeWidth={5} />
            </g>
          ))}
          {talons(118, 0)}
          {talons(80, 0)}
        </g>
      );
    }
    if (pose === "perch") {
      return (
        <g>
          {[-20, 26].map((lx, i) => (
            <path key={i} d={taperPath([[lx, -150], [lx + 46, -96], [lx + 12, -46]], 66, 54)} fill={i ? KHAKI : KHAKI_DK} stroke={INK} strokeWidth={5} />
          ))}
          {[-10, 34].map((lx, i) => (
            <g key={i}>
              <path d={`M${lx},-48 L${lx + 2},-14`} stroke={INK} strokeWidth={20} strokeLinecap="round" />
              <path d={`M${lx},-48 L${lx + 2},-14`} stroke={SCALE} strokeWidth={12} strokeLinecap="round" />
            </g>
          ))}
          {talons(-10, 0)}
          {talons(34, 0)}
        </g>
      );
    }
    return (
      <g>
        {[-24, 28].map((lx, i) => (
          <g key={i}>
            <path d={`M${lx},-74 L${lx + 2},-14`} stroke={INK} strokeWidth={20} strokeLinecap="round" />
            <path d={`M${lx},-74 L${lx + 2},-14`} stroke={SCALE} strokeWidth={12} strokeLinecap="round" />
            {[-60, -44, -30].map((sy) => (
              <path key={sy} d={`M${lx - 5},${sy} l10,0`} stroke="#6c6964" strokeWidth={2.5} />
            ))}
            <path d={taperPath([[lx - 2, -226], [lx + 2, -150], [lx + 2, -70]], 58, 48)} fill={i ? KHAKI : KHAKI_DK} stroke={INK} strokeWidth={5} />
          </g>
        ))}
        {talons(-24, 0)}
        {talons(28, 0)}
      </g>
    );
  };

  function talons(fx: number, fy: number) {
    return (
      <g transform={`translate(${fx} ${fy - 10})`}>
        {[
          [-26, 4],
          [8, 10],
          [36, 2],
          [-34, -6],
        ].map(([tx, ty], i) => (
          <g key={i}>
            <path d={`M0,0 L${tx},${ty}`} stroke={INK} strokeWidth={13} strokeLinecap="round" />
            <path d={`M0,0 L${tx},${ty}`} stroke={SCALE} strokeWidth={7} strokeLinecap="round" />
            <path d={`M${tx},${ty} l${Math.sign(tx) * 9},${6}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
          </g>
        ))}
      </g>
    );
  }

  const torsoY = dy;
  const lampPt: Pt = [6, -48];
  const s = flip ? -scale : scale;

  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <g style={shade > 0 ? { filter: `brightness(${1 - shade * 0.82}) saturate(${1 - shade * 0.6})` } : undefined}>
      {pose !== "perch" ? <Shadow cx={10} cy={4} rx={120} o={0.35} /> : null}
      {/* back wing */}
      {wing(aB, true, "wB")}
      {legs()}
      {/* khakis hiked up to the chest */}
      <path
        d={smoothPath(
          [
            [-64 + hunch, -332 + torsoY],
            [80 + hunch, -332 + torsoY],
            [100 + hunch, -272 + torsoY],
            [82, -218 + torsoY * 0.55],
            [-62, -214 + torsoY * 0.55],
            [-76, -270 + torsoY],
          ],
          true,
          0.6,
        )}
        fill={KHAKI}
        stroke={INK}
        strokeWidth={5}
      />
      <path d={`M${10 + hunch},${-330 + torsoY} L${12},${-232 + torsoY * 0.55}`} stroke={KHAKI_DK} strokeWidth={3} />
      <path d={`M${-64 + hunch},${-336 + torsoY} Q${8 + hunch},${-326 + torsoY} ${80 + hunch},${-334 + torsoY}`} stroke="#3b2618" strokeWidth={12} fill="none" strokeLinecap="round" />
      <rect x={42 + hunch} y={-342 + torsoY} width={22} height={18} rx={3} fill="#cfd2d4" stroke={INK} strokeWidth={3} />
      {/* shirt */}
      <path
        d={smoothPath(
          [
            [-62 + hunch, -330 + torsoY],
            [82 + hunch, -330 + torsoY],
            [80 + hunch * 1.5, -402 + torsoY],
            [66 + hunch * 2, -458 + torsoY],
            [42 + hunch * 2, -480 + torsoY],
            [-10 + hunch, -478 + torsoY],
            [-48 + hunch, -452 + torsoY],
            [-66 + hunch, -392 + torsoY],
          ],
          true,
          0.6,
        )}
        fill={SHIRT}
        stroke={INK}
        strokeWidth={6}
      />
      <ellipse cx={-34 + hunch} cy={-432 + torsoY} rx={20} ry={26} fill="#d9c76a" opacity={0.55} />
      <ellipse cx={62 + hunch * 1.6} cy={-436 + torsoY} rx={16} ry={22} fill="#d9c76a" opacity={0.55} />
      {/* name tag */}
      <g transform={`translate(${-48 + hunch} ${-414 + torsoY}) rotate(3)`}>
        <rect width={64} height={30} rx={4} fill="#fff" stroke="#c0392b" strokeWidth={3} />
        <g transform={flip ? "translate(64 0) scale(-1 1)" : undefined}>
        <text x={32} y={13} textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontWeight={900} fontSize={10} fill={INK}>
          MR. GIZZARD
        </text>
        <text x={32} y={25} textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight={700} fontSize={8.5} fill="#c0392b">
          SHIFT MANAGER
        </text>
        </g>
      </g>
      {/* pocket protector + pens */}
      <g transform={`translate(${56 + hunch * 1.8} ${-446 + torsoY})`}>
        {["#c0392b", "#2c5aa0", "#1a1a1a"].map((c, i) => (
          <rect key={i} x={2 + i * 7} y={-10} width={6} height={18} rx={2} fill={c} stroke={INK} strokeWidth={1.5} />
        ))}
        <rect x={0} y={0} width={26} height={26} rx={3} fill="#f7f7f2" stroke={INK} strokeWidth={3} />
      </g>
      {/* too-short tie */}
      <path
        d={`M${30 + hunch * 2},${-470 + torsoY} L${44 + hunch * 2},${-470 + torsoY} L${40 + hunch * 1.8},${-458 + torsoY} L${54 + hunch * 1.6},${-392 + torsoY} L${38 + hunch * 1.6},${-374 + torsoY} L${22 + hunch * 1.6},${-394 + torsoY} L${34 + hunch * 1.8},${-458 + torsoY} Z`}
        fill={TIE}
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <circle cx={42 + hunch * 1.7} cy={-410 + torsoY} r={6} fill="#b8231c" opacity={0.85} />
      {/* feather ruff + bare neck */}
      <g transform={`translate(${neckBase[0]} ${neckBase[1] + 4}) scale(${1 + puff * 0.35})`}>
        <path d={geo.ruff} fill={FEATHER} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      </g>
      <path d={neck} stroke={INK} strokeWidth={40} fill="none" strokeLinecap="round" />
      <path d={neck} stroke={SKIN} strokeWidth={30} fill="none" strokeLinecap="round" />
      <path d={`M${neckBase[0] + 8},${neckBase[1] - 24} q8,-4 14,2 M${neckBase[0] + 20},${neckBase[1] - 44} q8,-4 14,2`} stroke={SKIN_DK} strokeWidth={3} fill="none" />
      {/* head */}
      <g transform={`translate(${head[0]} ${head[1]}) rotate(${tilt})`}>
        {lamp ? (
          <path
            d={`M${lampPt[0]},${lampPt[1]} L${lampPt[0] + 900},${lampPt[1] - 220} L${lampPt[0] + 900},${lampPt[1] + 220} Z`}
            transform={`rotate(${lampAim} ${lampPt[0]} ${lampPt[1]})`}
            fill="#fff3b0"
            opacity={0.3}
            style={{ mixBlendMode: "screen" }}
          />
        ) : null}
        {lamp ? (
          <path
            d={`M${lampPt[0]},${lampPt[1]} L${lampPt[0] + 900},${lampPt[1] - 110} L${lampPt[0] + 900},${lampPt[1] + 110} Z`}
            transform={`rotate(${lampAim} ${lampPt[0]} ${lampPt[1]})`}
            fill="#fffbe0"
            opacity={0.3}
            style={{ mixBlendMode: "screen" }}
          />
        ) : null}
        <path d={geo.head} fill={SKIN} stroke={INK} strokeWidth={5} />
        {/* wrinkles + comb-over */}
        <path d="M-30,-20 q10,-6 20,0 M-36,-4 q10,-6 20,0 M-26,16 q10,-6 20,0" stroke={SKIN_DK} strokeWidth={3} fill="none" />
        <path d="M-40,-24 C-30,-64 20,-70 40,-36 M-34,-20 C-20,-60 24,-62 44,-30 M-44,-14 C-40,-56 12,-74 34,-46" stroke={INK} strokeWidth={2.2} fill="none" />
        {/* brow ridge */}
        <path d={`M-2,${-26 - e.brow * 5} Q20,${-38 - e.brow * 6} 44,${-24 - e.brow * 3}`} stroke={SKIN_DK} strokeWidth={12} strokeLinecap="round" fill="none" />
        {/* eyes (look over the glasses); squeezed shut in revulsion */}
        {expr === "disgusted" ? (
          <g stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none">
            <path d="M-18,-18 L-4,-10 L-18,-2" />
            <path d="M34,-18 L16,-8 L34,0" />
            <path d="M-22,-26 l8,-4 M36,-28 l-8,-4" strokeWidth={3} />
          </g>
        ) : null}
        {expr === "disgusted" ? null : (
        <Eye
          id={`${id}-eF`}
          seed={`${id}F`}
          cx={-8}
          cy={-10}
          rx={11}
          ry={11}
          look={gaze}
          pupil={e.pupil}
          iris="#e0b52c"
          sclera={glow > 0 ? mixHex("#e8d27a", "#fff6a0", glow) : "#e8d27a"}
          lidTop={Math.max(e.lidTop, blink)}
          lidBottom={e.lidBottom}
          lidAngle={-e.lidAngle}
          lidColor={SKIN}
          sw={3.5}
        />
        )}
        {expr === "disgusted" ? null : (
        <Eye
          id={`${id}-eN`}
          seed={`${id}N`}
          cx={22}
          cy={-8}
          rx={14}
          ry={14}
          look={gaze}
          pupil={e.pupil}
          iris="#e0b52c"
          sclera={glow > 0 ? mixHex("#e8d27a", "#fff6a0", glow) : "#e8d27a"}
          veins={2}
          lidTop={Math.max(e.lidTop, blink)}
          lidBottom={e.lidBottom}
          lidAngle={e.lidAngle}
          lidColor={SKIN}
          sw={3.5}
        />
        )}
        {/* beak: lower mandible hinges open */}
        <g transform={`rotate(${open * 26} 46 12)`}>
          <path d="M46,8 C70,12 96,14 108,22 C96,30 66,30 46,22 Z" fill={mixHex(BEAK, "#000000", 0.08)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
        {open > 0.08 ? <path d="M50,12 C70,16 90,18 100,22 C88,28 66,28 50,20 Z" fill="#4a1414" /> : null}
        {open > 0.3 ? <ellipse cx={expr === "disgusted" ? 92 : 70} cy={18 + open * 14} rx={expr === "disgusted" ? 26 : 16} ry={5 + open * 5} fill="#d06a74" stroke={INK} strokeWidth={2.5} /> : null}
        <path d="M38,-14 C60,-24 96,-18 116,6 C124,18 120,32 110,34 C110,22 100,16 82,14 C66,12 52,12 40,12 Z" fill={BEAK} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        <path d="M36,-14 C46,-18 56,-18 62,-14 L60,10 L38,12 Z" fill={CERE} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <ellipse cx={52} cy={-4} rx={6} ry={3} fill={INK} />
        {/* wattle */}
        <path d="M-6,30 C10,58 40,56 44,26" fill={SKIN_DK} stroke={INK} strokeWidth={4} />
        {/* half-moon reading glasses */}
        <g fill="#cfe6ee" fillOpacity={0.35} stroke={INK} strokeWidth={3}>
          <path d="M8,2 A15,13 0 0 0 38,2 Z" />
          <path d="M-20,0 A11,10 0 0 0 2,0 Z" />
          <path d="M2,0 Q6,-4 8,2" fill="none" />
        </g>
        {/* headlamp */}
        {lamp ? (
          <g>
            <path d="M-50,-22 C-30,-50 30,-56 50,-26" stroke="#2a2a2a" strokeWidth={8} fill="none" />
            <rect x={lampPt[0] - 14} y={lampPt[1] - 10} width={28} height={20} rx={5} fill="#3a3a3a" stroke={INK} strokeWidth={3} />
            <circle cx={lampPt[0] + 10} cy={lampPt[1]} r={8} fill="#fff8c8" stroke={INK} strokeWidth={2} />
          </g>
        ) : null}
      </g>
      {/* front wing + mug */}
      {wing(aF, false, "wF")}
      {mug ? (
        <g transform={`translate(${aF[2][0] + 6} ${aF[2][1] - 6})`}>
          {[0, 1].map((i) => {
            const ph = (t * 0.6 + i * 0.5) % 1;
            return <path key={i} d={`M${-6 + i * 12},${-40 - ph * 40} q-8,-10 0,-20 q8,-10 0,-20`} stroke="#e8e4da" strokeWidth={4} fill="none" opacity={0.6 * (1 - ph)} />;
          })}
          <path d="M28,-20 C50,-20 50,16 28,14" stroke={INK} strokeWidth={12} fill="none" />
          <path d="M28,-20 C50,-20 50,16 28,14" stroke="#f4f1ea" strokeWidth={6} fill="none" />
          <rect x={-30} y={-38} width={60} height={64} rx={6} fill="#f4f1ea" stroke={INK} strokeWidth={4} />
          <g transform={flip ? "scale(-1 1)" : undefined}>
          <text x={0} y={-6} textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontWeight={900} fontSize={15} fill="#c0392b">
            #1
          </text>
          <text x={0} y={12} textAnchor="middle" fontFamily="Arial Black, Arial, Helvetica, sans-serif" fontWeight={900} fontSize={13} fill={INK}>
            BOSS
          </text>
          </g>
        </g>
      ) : null}
      </g>
      {glow > 0 ? (
        <g transform={`translate(${head[0]} ${head[1]}) rotate(${tilt})`} style={{ mixBlendMode: "screen" }}>
          <circle cx={-8} cy={-10} r={26} fill="#fff27a" opacity={0.4 * glow} />
          <circle cx={22} cy={-8} r={30} fill="#fff27a" opacity={0.4 * glow} />
          <circle cx={-8} cy={-10} r={7} fill="#fffbd0" opacity={glow} />
          <circle cx={22} cy={-8} r={8} fill="#fffbd0" opacity={glow} />
        </g>
      ) : null}
    </g>
  );
};

const lerpN = (a: number, b: number, k: number) => a + (b - a) * k;
