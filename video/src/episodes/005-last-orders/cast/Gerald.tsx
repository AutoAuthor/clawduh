import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { DLine, Eye, INK, Mouth, Shadow, blinkAmount, saccade } from "../../../characters/parts";
import { mixHex } from "../../../characters/Possum";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, blob, limb, onN, rnd, smoothPath } from "../../../engine/util";
import { HAND, PaperCup } from "../props";

/**
 * GERALD — the customer who ordered a coffee two minutes before closing. A bloodhound in a slept-in grey suit:
 * ears to his shoulders, jowls to his collar, red-rimmed eyes that were sad before any of this started.
 * Head is a separate component (GeraldHead) so the bedroom scenes can lay it on a pillow.
 * Faces right by default. Origin = floor between the feet (stand) / floor under the seat (sit).
 */

export type GeraldExpr = "sad" | "groggy" | "pained" | "confused" | "sick" | "peaceful" | "wired" | "thankful" | "hopeful" | "dazed";

export interface GeraldHeadProps {
  id: string;
  t: number;
  frame: number;
  expr?: GeraldExpr;
  look?: Pt;
  mouth?: MouthShape;
  /** 0..1 headache: throbbing vein + pain lines */
  throb?: number;
  /** 0..1 green around the jowls */
  sick?: number;
  /** 0..1 wired: spiral eyes, jitter, steam */
  wired?: number;
  /** 0..1 fur standing up, bed head */
  messy?: number;
  thermometer?: boolean;
  icepack?: boolean;
  /** draw "?" marks */
  question?: number;
  /** ear swing amount (head shakes) */
  earSwing?: number;
}

const FUR = "#b5794a";
const FUR_DK = "#7d4f2c";
const MUZZLE = "#c99266";
const SUIT = "#676b77";
const SUIT_DK = "#4a4e59";
const SHIRT = "#e9e6dc";
const TIE = "#2a3550";

type E = { lidTop: number; lidBottom: number; lidAngle: number; pupil: number; smile: number; brow: number; browTilt: number };
const EXPR: Record<GeraldExpr, E> = {
  sad: { lidTop: 0.42, lidBottom: 0.0, lidAngle: -16, pupil: 0.42, smile: -0.4, brow: 0.9, browTilt: -20 },
  groggy: { lidTop: 0.7, lidBottom: 0.05, lidAngle: -10, pupil: 0.4, smile: -0.5, brow: 0.4, browTilt: -12 },
  pained: { lidTop: 0.6, lidBottom: 0.15, lidAngle: 14, pupil: 0.34, smile: -0.8, brow: -0.6, browTilt: 20 },
  confused: { lidTop: 0.2, lidBottom: 0.0, lidAngle: -6, pupil: 0.36, smile: -0.3, brow: 1.1, browTilt: 0 },
  sick: { lidTop: 0.62, lidBottom: 0.1, lidAngle: -14, pupil: 0.36, smile: -0.7, brow: 0.8, browTilt: -20 },
  peaceful: { lidTop: 1, lidBottom: 0, lidAngle: 0, pupil: 0.4, smile: 0.5, brow: 0.4, browTilt: -6 },
  wired: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.2, smile: 0.2, brow: 1.6, browTilt: -6 },
  thankful: { lidTop: 0.3, lidBottom: 0.1, lidAngle: -14, pupil: 0.46, smile: 0.45, brow: 1, browTilt: -16 },
  hopeful: { lidTop: 0.18, lidBottom: 0.0, lidAngle: -14, pupil: 0.48, smile: 0.15, brow: 1.2, browTilt: -18 },
  dazed: { lidTop: 0.5, lidBottom: 0.1, lidAngle: 0, pupil: 0.3, smile: -0.1, brow: 0.3, browTilt: 0 },
};

/** Draws Gerald's head with its origin at the head centre (faces right). */
export const GeraldHead: React.FC<GeraldHeadProps> = ({
  id,
  t,
  frame,
  expr = "sad",
  look,
  mouth = "X",
  throb = 0,
  sick = 0,
  wired = 0,
  messy = 0,
  thermometer = false,
  icepack = false,
  question = 0,
  earSwing = 0,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const blink = expr === "peaceful" || expr === "wired" ? 0 : blinkAmount(t, id, 3.6);
  const dart = saccade(t, id, wired > 0.3 ? 0.5 : 0.1, wired > 0.3 ? 0.18 : 1.2);
  const gaze: Pt = [(look?.[0] ?? 0.4) + dart[0], (look?.[1] ?? 0.2) + dart[1]];
  const fur = mixHex(FUR, "#9fae6a", sick * 0.5);
  const muzzle = mixHex(MUZZLE, "#b9c48a", sick * 0.6);
  const ear = Math.sin(t2 * 1.4) * 4 + earSwing * Math.sin(t * 22) * 14;
  const pulse = throb > 0 ? 0.5 + 0.5 * Math.sin(t * 9) : 0;

  const geo = useMemo(
    () => ({
      cranium: smoothPath(
        [
          [-56, 6],
          [-50, -34],
          [-12, -60],
          [38, -54],
          [74, -36],
          [112, -26],
          [134, -10],
          [130, 12],
          [96, 22],
          [40, 34],
          [-20, 36],
        ],
        true,
        0.7,
      ),
      jowl: smoothPath(
        [
          [34, 22],
          [100, 14],
          [122, 26],
          [116, 56],
          [86, 74],
          [46, 70],
          [24, 46],
        ],
        true,
        0.75,
      ),
      tufts: Array.from({ length: 6 }).map((_, i) => [-40 + i * 16, -54 - rnd(`${id}tf${i}`) * 6] as Pt),
    }),
    [id],
  );

  const spiral = (cx: number, cy: number, r: number, dir: number) => {
    const pts: string[] = [];
    for (let k = 0; k <= 36; k++) {
      const a = (k / 36) * Math.PI * 5 + t * 14 * dir;
      const rr = (k / 36) * r;
      pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
    }
    return <path d={`M${pts.join(" L")}`} fill="none" stroke={INK} strokeWidth={2.4} />;
  };

  return (
    <g>
      {/* far ear */}
      <path d={`M-4,-40 C10,-30 ${18 + ear * 0.5},20 ${10 + ear * 0.5},70 C4,92 -16,92 -20,70 C-24,30 -20,-20 -4,-40 Z`} fill={mixHex(FUR_DK, "#000000", 0.2)} stroke={INK} strokeWidth={4} />
      {/* jowls (behind the muzzle line) */}
      <path d={geo.jowl} fill={muzzle} stroke={INK} strokeWidth={4.5} />
      <path d="M50,60 q24,10 56,-4" stroke={mixHex(muzzle, "#000000", 0.18)} strokeWidth={3} fill="none" />
      {expr === "wired" || expr === "sick" ? (
        <path d={`M110,58 q4,${16 + Math.sin(t * 6) * 4} -2,${30 + Math.sin(t * 6) * 6}`} stroke="#d8eef6" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.85} />
      ) : null}
      {/* head */}
      <path d={geo.cranium} fill={fur} stroke={INK} strokeWidth={5} />
      <path d="M-50,-30 C-30,-58 10,-62 30,-52 C10,-40 -20,-30 -46,4 Z" fill={FUR_DK} opacity={0.75} />
      <path d="M70,-30 C96,-24 120,-16 132,-4 L130,10 C110,16 88,18 66,20 Z" fill={muzzle} opacity={0.9} />
      {/* forehead wrinkles */}
      <g stroke={mixHex(FUR, "#000000", 0.3)} strokeWidth={3} fill="none" strokeLinecap="round">
        <path d="M6,-42 q14,-8 30,-2" />
        <path d="M2,-32 q18,-8 38,0" />
        <path d="M44,-38 q10,-4 20,2" />
      </g>
      {messy > 0
        ? geo.tufts.map(([tx, ty], i) => <path key={i} d={`M${tx},${ty + 6} l${-4 + (i % 2) * 8},${-14 * messy - 4} l6,${12 * messy}`} stroke={INK} strokeWidth={3} fill={FUR_DK} />)
        : null}
      {/* nose */}
      <ellipse cx={128} cy={-12} rx={19} ry={14} fill="#1c1515" stroke={INK} strokeWidth={4} />
      <ellipse cx={122} cy={-17} rx={6} ry={3.5} fill="#fff" opacity={0.6} />
      {/* eyes: droopy, red lower lids showing */}
      {(expr === "peaceful" ? [] : [
        [26, -12, 13, 12, "N"],
        [66, -18, 10, 9, "F"],
      ]).map(([cx, cy, rx, ry, k]) => (
        <path key={`haw${k}`} d={`M${Number(cx) - Number(rx) - 2},${Number(cy) + 2} Q${cx},${Number(cy) + Number(ry) + 12} ${Number(cx) + Number(rx) + 2},${Number(cy) + 2}`} fill="#c8505a" stroke={INK} strokeWidth={3} />
      ))}
      {wired > 0.4 ? (
        <g>
          <circle cx={26} cy={-12} r={14} fill="#f2ecd8" stroke={INK} strokeWidth={3.5} />
          <circle cx={66} cy={-18} r={11} fill="#f2ecd8" stroke={INK} strokeWidth={3} />
          {spiral(26, -12, 12, 1)}
          {spiral(66, -18, 9, -1)}
        </g>
      ) : expr === "peaceful" ? (
        <>
          <Eye id={`${id}-eN`} seed={`${id}N`} cx={26} cy={-10} rx={13} ry={10} lidColor={fur} happyClosed sw={4} />
          <Eye id={`${id}-eF`} seed={`${id}F`} cx={66} cy={-16} rx={10} ry={8} lidColor={fur} happyClosed sw={3.5} />
        </>
      ) : (
        <>
          <Eye id={`${id}-eN`} seed={`${id}N`} cx={26} cy={-12} rx={13} ry={12} look={gaze} pupil={e.pupil} sclera="#efe2cc" veins={expr === "groggy" || expr === "pained" || expr === "sick" ? 3 : 1} lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={e.lidAngle} lidColor={fur} sw={3.5} />
          <Eye id={`${id}-eF`} seed={`${id}F`} cx={66} cy={-18} rx={10} ry={9} look={gaze} pupil={e.pupil} sclera="#efe2cc" lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={-e.lidAngle} lidColor={fur} sw={3} />
        </>
      )}
      {/* brows: sad tufts */}
      {[
        [26, -12, 13, 1],
        [66, -18, 10, -1],
      ].map(([cx, cy, rx, side], i) => {
        const by = cy - rx - 9 - e.brow * 5;
        const dy = Math.tan((e.browTilt * Math.PI) / 180) * rx * (side > 0 ? 1 : -1);
        return <path key={i} d={`M${cx - rx - 2},${by - dy} L${cx + rx + 2},${by + dy}`} stroke={FUR_DK} strokeWidth={6} strokeLinecap="round" />;
      })}
      {/* bags */}
      <path d="M10,10 q16,12 32,2" stroke="#6a4a5a" strokeWidth={5} fill="none" strokeLinecap="round" opacity={expr === "groggy" || expr === "sick" || expr === "pained" ? 0.8 : 0.4} />
      {/* mouth along the muzzle line */}
      <g transform="rotate(-6 86 24)">
        <Mouth id={`${id}-mouth`} seed={`${id}m`} x={86} y={24} w={44} maxOpen={28} shape={thermometer ? "B" : mouth} smile={e.smile} teeth="flat" toothColor="#efe8d0" lip={mixHex(muzzle, "#000000", 0.3)} sw={4} />
      </g>
      {thermometer ? (
        <g transform="translate(104 26) rotate(-18)">
          <rect x={0} y={-5} width={56} height={10} rx={5} fill="#f2f2f2" stroke={INK} strokeWidth={3} />
          <rect x={30} y={-2.5} width={22} height={5} rx={2.5} fill="#d8322a" />
        </g>
      ) : null}
      {/* near ear */}
      <path d={`M-30,-44 C-6,-38 ${-2 + ear},10 ${-16 + ear},96 C-22,124 -52,124 -58,96 C-66,40 -60,-24 -30,-44 Z`} fill={FUR_DK} stroke={INK} strokeWidth={4.5} />
      <path d={`M-34,-20 C-26,10 ${-26 + ear * 0.8},60 ${-34 + ear},96`} stroke={mixHex(FUR_DK, "#000000", 0.25)} strokeWidth={3} fill="none" />
      {/* headache */}
      {throb > 0 ? (
        <g opacity={throb}>
          <path d="M14,-50 l6,-8 l-5,-7 l7,-7" stroke="#6a2a5a" strokeWidth={3.5 + pulse * 3} fill="none" strokeLinecap="round" />
          {[0, 1, 2].map((i) => {
            const a = -Math.PI / 2 - 0.8 + i * 0.6;
            const r0 = 70 + pulse * 10;
            return <path key={i} d={`M${Math.cos(a) * r0 + 20},${Math.sin(a) * r0 - 10} l${Math.cos(a) * 22},${Math.sin(a) * 22}`} stroke="#d83a2a" strokeWidth={5} strokeLinecap="round" />;
          })}
        </g>
      ) : null}
      {icepack ? (
        <g transform="translate(-4 -64) rotate(-8)">
          <path d="M-52,6 C-50,-26 50,-30 56,4 C40,16 -36,18 -52,6 Z" fill="#7fb6d8" stroke={INK} strokeWidth={4} />
          <path d="M-30,-4 q30,-12 60,0" stroke="#d8eef8" strokeWidth={4} fill="none" />
          <path d="M44,-8 l14,-14" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        </g>
      ) : null}
      {question > 0
        ? [0, 1, 2].map((i) => {
            const ph = (t * 0.7 + i * 0.33) % 1;
            return (
              <text key={i} x={-20 + i * 60 + Math.sin(t * 2 + i) * 8} y={-80 - ph * 50} fontFamily={HAND} fontWeight={700} fontSize={44 + i * 6} fill="#f2ead6" stroke={INK} strokeWidth={3} paintOrder="stroke" opacity={question * Math.min(1, (1 - ph) * 2.5)}>
                ?
              </text>
            );
          })
        : null}
      {wired > 0.5
        ? [0, 1].map((i) => {
            const ph = (t * 2 + i * 0.5) % 1;
            return <path key={i} d={`M${-50 - i * 10},${-10 - ph * 40} q-16,-6 -22,-22`} stroke="#f0f0ea" strokeWidth={8} fill="none" strokeLinecap="round" opacity={1 - ph} />;
          })
        : null}
      {sick > 0.3
        ? [0, 1].map((i) => {
            const ph = (t * 0.8 + i * 0.5) % 1;
            return <ellipse key={i} cx={i ? 96 : -10} cy={-36 + ph * 60} rx={5} ry={8} fill="#bfe3f2" stroke={INK} strokeWidth={2.5} opacity={1 - ph} />;
          })
        : null}
    </g>
  );
};

export interface GeraldProps extends GeraldHeadProps {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  pose?: "stand" | "sit";
  headTilt?: number;
  /** [shoulder, elbow] */
  armF?: [number, number];
  armB?: [number, number];
  hold?: "cup" | "phone" | "watch" | null;
  holdB?: "briefcase" | "cup" | null;
  cupLid?: "decaf" | "regular" | "redeye";
  cupName?: string;
  /** 0..1 groggy sway */
  sway?: number;
  /** 0..1 heart pounding out of the chest */
  heart?: number;
  /** 0..1 slept-in: tie askew, shirt buttoned wrong */
  rumpled?: number;
  /** degrees, slump forward */
  slump?: number;
  outfit?: "suit" | "pajamas";
}

export const GERALD_HEAD: Record<"stand" | "sit", Pt> = { stand: [56, -418], sit: [60, -404] };

export const Gerald: React.FC<GeraldProps> = (props) => {
  const {
    id,
    x,
    y,
    scale = 1,
    flip = false,
    t,
    frame,
    pose = "stand",
    headTilt = 0,
    armF = pose === "sit" ? [70, 40] : [10, 30],
    armB = pose === "sit" ? [50, 50] : [-6, 10],
    hold = null,
    holdB = null,
    cupLid = "decaf",
    cupName,
    sway = 0,
    heart = 0,
    rumpled = 0,
    slump = 8,
    wired = 0,
    outfit = "suit",
  } = props;
  const pj = outfit === "pajamas";
  const SU = pj ? "#8aa8d0" : SUIT;
  const SU_DK = pj ? "#6a88b0" : SUIT_DK;
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const sw = sway > 0 ? Math.sin(t * 1.7) * 7 * sway + noise2D(id + "sway", t * 0.6, 1) * 4 * sway : 0;
  const jitter = wired > 0.3 ? (rnd(`${id}jx${f2}`) - 0.5) * 8 * wired : 0;
  const tilt = headTilt + sw * 1.4 + noise2D(id + "tilt", t2 * 0.3, 2) * 2.5 + jitter * 0.6;
  const sit = pose === "sit";
  const hip: Pt = sit ? [0, -160] : [0, -170];
  const shY = sit ? -332 : -350;
  const beat = heart > 0 ? Math.max(0, Math.sin(t * 16)) ** 3 : 0;
  const s = flip ? -scale : scale;
  const headBase = GERALD_HEAD[pose];
  const head: Pt = [headBase[0] + jitter, headBase[1] + sw * 0.4];

  const shF: Pt = [36, shY + 10];
  const shB: Pt = [-40, shY + 6];
  const aF = limb(shF, armF, [94, 90]);
  const aB = limb(shB, armB, [94, 90]);

  const paw = (end: Pt, key: string) => (
    <g key={key}>
      <ellipse cx={end[0] + 4} cy={end[1] + 4} rx={17} ry={14} fill={MUZZLE} stroke={INK} strokeWidth={4} />
      <path d={`M${end[0] + 10},${end[1] - 4} l10,4 M${end[0] + 10},${end[1] + 6} l10,2`} stroke={INK} strokeWidth={2.5} />
    </g>
  );
  const sleeve = (pts: Pt[], back: boolean, key: string) => (
    <g key={key}>
      <DLine d={smoothPath(pts, false, 0.6)} w={32} color={back ? SU_DK : SU} ow={4.5} />
      {pj ? null : <path d={`M${pts[2][0] - 12},${pts[2][1] - 10} l22,4`} stroke={SHIRT} strokeWidth={6} strokeLinecap="round" />}
    </g>
  );

  const jacket = smoothPath(
    [
      [hip[0] - 62, hip[1] + 24],
      [hip[0] + 64, hip[1] + 24],
      [76, shY + 120],
      [64, shY + 30],
      [36, shY - 4],
      [-36, shY - 6],
      [-64, shY + 30],
      [-72, shY + 120],
    ],
    true,
    0.6,
  );

  return (
    <g transform={`translate(${x + sw} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={sit ? 40 : 0} cy={4} rx={120} o={0.33} />
      {/* legs */}
      {sit ? (
        <g>
          {[0, 1].map((i) => (
            <DLine key={i} d={smoothPath([[-10 + i * 20, hip[1] + 10], [100 + i * 10, hip[1] + 14], [106 + i * 12, -14]], false, 0.4)} w={36} color={i ? SU : SU_DK} ow={4.5} />
          ))}
          {[0, 1].map((i) => (
            <path key={i} d={`M${92 + i * 12},-18 C${104 + i * 12},-28 ${150 + i * 12},-24 ${152 + i * 12},-6 L${150 + i * 12},2 L${92 + i * 12},2 Z`} fill="#1a1718" stroke={INK} strokeWidth={4} />
          ))}
        </g>
      ) : (
        <g>
          {[
            [-24, -10],
            [26, 10],
          ].map(([lx, dx], i) => (
            <DLine key={i} d={`M${lx},${hip[1] + 20} L${lx + dx * 0.3},-16`} w={36} color={i ? SU : SU_DK} ow={4.5} />
          ))}
          {[-30, 30].map((fx, i) => (
            <path key={i} d={`M${fx - 18},-18 C${fx - 8},-28 ${fx + 34},-26 ${fx + 38},-8 L${fx + 36},2 L${fx - 18},2 Z`} fill="#1a1718" stroke={INK} strokeWidth={4} />
          ))}
        </g>
      )}
      <g transform={`rotate(${slump + sw * 0.6} ${hip[0]} ${hip[1]})`}>
        {/* back arm */}
        {sleeve(aB, true, "sB")}
        {paw(aB[2], "pB")}
        {holdB === "briefcase" ? (
          <g transform={`translate(${aB[2][0]} ${aB[2][1] + 10})`}>
            <path d="M-14,0 q0,-14 14,-14 q14,0 14,14" stroke={INK} strokeWidth={6} fill="none" />
            <rect x={-56} y={0} width={112} height={78} rx={8} fill="#5a3a24" stroke={INK} strokeWidth={5} />
            <path d="M-56,22 L56,22" stroke="#3a2414" strokeWidth={4} />
          </g>
        ) : null}
        {holdB === "cup" ? (
          <g transform={`translate(${aB[2][0] + 6} ${aB[2][1] + 46})`}>
            <PaperCup lid={cupLid} name={cupName} flip={flip} t={t} scale={0.6} />
          </g>
        ) : null}
        {/* jacket + shirt + tie */}
        <path d={jacket} fill={SU} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {pj ? (
          <g stroke="#e8eef6" strokeWidth={5} opacity={0.7}>
            {[-48, -24, 0, 24, 48].map((sx) => (
              <path key={sx} d={`M${sx},${shY + 8} L${sx + 2},${hip[1] + 20}`} />
            ))}
          </g>
        ) : (
          <path d={`M8,${shY - 2} L60,${shY + 6} L44,${hip[1] + 10} L14,${hip[1] + 20} Z`} fill={SHIRT} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        )}
        {pj ? null : (
          <g>
        {/* buttons (one off when rumpled) */}
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={30 + i * 2 + (rumpled > 0.5 && i > 1 ? 8 : 0)} cy={shY + 50 + i * 36} r={3.5} fill="#cfc8b6" stroke={INK} strokeWidth={1.5} />
        ))}
        <g transform={`rotate(${rumpled * 18} 34 ${shY + 8})`}>
          <path d={`M26,${shY + 4 + rumpled * 20} L42,${shY + 4 + rumpled * 20} L46,${shY + 100} L34,${shY + 120} L22,${shY + 100} Z`} fill={TIE} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          {[0, 1, 2, 3].map((i) => (
            <circle key={i} cx={30 + (i % 2) * 8} cy={shY + 40 + i * 18 + rumpled * 10} r={2.5} fill="#e8d8b0" />
          ))}
        </g>
        {/* lapels */}
        <path d={`M8,${shY - 2} L-6,${shY + 40} L22,${shY + 120} Z`} fill={SUIT_DK} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M60,${shY + 6} L72,${shY + 50} L48,${shY + 120} Z`} fill={SUIT_DK} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          </g>
        )}
        {/* coffee stain on the shirt */}
        <path d={blob(40, shY + 90, 9, 7, 7, 0.3, id + "st")} fill="#7a5a32" opacity={0.6} />
        {/* neck + head */}
        <path d={`M16,${shY + 4} L${head[0] - 20},${head[1] + 40}`} stroke={INK} strokeWidth={56} strokeLinecap="round" />
        <path d={`M16,${shY + 4} L${head[0] - 20},${head[1] + 40}`} stroke={FUR} strokeWidth={46} strokeLinecap="round" />
        <g transform={`translate(${head[0]} ${head[1]}) rotate(${tilt})`}>
          <GeraldHead {...props} />
        </g>
        {/* front arm */}
        {sleeve(aF, false, "sF")}
        {hold === "cup" ? (
          <g transform={`translate(${aF[2][0] + 8} ${aF[2][1] + 48})`}>
            <PaperCup lid={cupLid} name={cupName} flip={flip} t={t} scale={0.62} steam />
          </g>
        ) : null}
        {hold === "phone" ? (
          <g transform={`translate(${aF[2][0] + 4} ${aF[2][1] - 30}) rotate(-12)`}>
            <rect x={-12} y={-34} width={26} height={56} rx={5} fill="#1e1e24" stroke={INK} strokeWidth={4} />
            <rect x={-8} y={-28} width={18} height={40} rx={2} fill="#7ab0d8" />
          </g>
        ) : null}
        {paw(aF[2], "pF")}
        {hold === "watch" ? <rect x={aF[2][0] - 26} y={aF[2][1] - 30} width={22} height={16} rx={4} fill="#d8c27a" stroke={INK} strokeWidth={3} transform={`rotate(30 ${aF[2][0]} ${aF[2][1]})`} /> : null}
        {/* the heart, pounding through the shirt */}
        {heart > 0 ? (
          <g transform={`translate(44 ${shY + 64}) scale(${0.9 + beat * 0.6 * heart})`}>
            <path d="M0,18 C-30,-4 -26,-30 -8,-28 C0,-27 0,-18 0,-14 C0,-18 0,-27 8,-28 C26,-30 30,-4 0,18 Z" fill="#d8323a" stroke={INK} strokeWidth={4} />
            <path d="M-12,-18 q-6,6 -4,12" stroke="#ff9a9a" strokeWidth={3} fill="none" />
            {beat > 0.4
              ? [0, 1, 2, 3].map((i) => {
                  const a = (i / 4) * Math.PI * 2 + 0.4;
                  return <path key={i} d={`M${Math.cos(a) * 34},${Math.sin(a) * 30} l${Math.cos(a) * 16},${Math.sin(a) * 16}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />;
                })
              : null}
          </g>
        ) : null}
      </g>
    </g>
  );
};
