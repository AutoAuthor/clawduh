import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { DLine, Eye, INK, Shadow, blinkAmount, saccade, taperPath } from "../../../characters/parts";
import { mixHex } from "../../../characters/Possum";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, blob, limb, onN, rnd, smoothPath } from "../../../engine/util";
import { PartyHat } from "./props";

/**
 * MR. DOBBINS — the gangly mule homeowner, and (via `outfit`) his matching party cousins.
 * Long dusty-grey mule head, very long ears, a slicked-back gelled mane with a kiss curl, wide unblinking eyes
 * with pin-prick pupils and a grin that runs almost to his ears, full of huge flat buck teeth.
 * Mint short-sleeve shirt, a maroon horseshoe-print tie tucked into hiked-up brown slacks, argyle socks over hooves.
 * Creepy-polite. Faces right by default. Origin = floor between the hooves.
 */

export type MuleExpr = "grin" | "stare" | "polite" | "tsk" | "menace" | "delight" | "sing" | "laugh" | "deep" | "wink";
export type MuleOutfit = "dobbins" | "tank" | "turtle" | "ruffle";
export type MuleHand = "open" | "point" | "fist" | "flat" | "grab" | "wave";

export interface MuleProps {
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
  expr?: MuleExpr;
  look?: Pt;
  headTilt?: number;
  /** upper-body lean (degrees, + = forward) and neck stretch toward the victim (px) */
  lean?: number;
  crane?: number;
  armF?: [number, number];
  armB?: [number, number];
  handF?: MuleHand;
  handB?: MuleHand;
  /** finger-wag angle applied at the wrist (degrees) */
  wag?: number;
  /** 0..1 grin width on top of the expression (1 = ear to ear) */
  grin?: number;
  /** walk phase (cycles) and amount */
  walk?: number;
  walkAmt?: number;
  /** 0..1 dance groove (head bob + shoulder shimmy on the beat) */
  groove?: number;
  /** 0..1 sunk into the dark: body near-black, eyes + teeth glint */
  shade?: number;
  outfit?: MuleOutfit;
  /** body width multiplier (cousins) */
  girth?: number;
  coat?: string;
  mane?: string;
  hat?: boolean;
  hatColors?: [string, string];
  shades?: boolean;
  /** cousin prop in the front hand */
  prop?: "none" | "horn" | "punch" | "confetti";
  /** 0..1 party horn blown out */
  horn?: number;
}

const COAT = "#8d7d6e";
const MUZZLE = "#dacfb9";
const MANE = "#231815";
const EAR_IN = "#c99e98";
const SHIRT = "#cfe3c6";
const SHIRT_SH = "#a9c69f";
const TIE = "#7a1f2e";
const PANTS = "#5b4733";
const HOOF = "#2a2220";
const TEETH = "#f3e8c4";
const GUM = "#d9808c";
const MOUTH_IN = "#3a0f12";
const TONGUE = "#c85a66";

type ExprSpec = { lidTop: number; lidBottom: number; lidAngle: number; pupil: number; smile: number; brow: number; browTilt: number; closed?: "happy" | "squeeze" | "wink" };
const EXPR: Record<MuleExpr, ExprSpec> = {
  grin: { lidTop: 0, lidBottom: 0.08, lidAngle: 0, pupil: 0.13, smile: 1, brow: 1.2, browTilt: -6 },
  stare: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.09, smile: 1, brow: 1.5, browTilt: -10 },
  polite: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.13, smile: 0.85, brow: 0.9, browTilt: -4, closed: "happy" },
  tsk: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.13, smile: 0.7, brow: 1.1, browTilt: -10, closed: "happy" },
  menace: { lidTop: 0.36, lidBottom: 0.22, lidAngle: 18, pupil: 0.11, smile: 1.1, brow: -0.6, browTilt: 18 },
  delight: { lidTop: 0, lidBottom: 0.04, lidAngle: -4, pupil: 0.17, smile: 1.15, brow: 1.9, browTilt: -14 },
  sing: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.13, smile: 0.9, brow: 1.5, browTilt: -12, closed: "happy" },
  laugh: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.13, smile: 1.2, brow: 1.2, browTilt: -10, closed: "squeeze" },
  deep: { lidTop: 0.32, lidBottom: 0.12, lidAngle: 12, pupil: 0.11, smile: 0.75, brow: -0.4, browTilt: 14 },
  wink: { lidTop: 0, lidBottom: 0.06, lidAngle: 0, pupil: 0.13, smile: 1.1, brow: 1.3, browTilt: -8, closed: "wink" },
};

const OPEN: Record<MouthShape, { open: number; narrow: number; tongue: number }> = {
  X: { open: 0, narrow: 0, tongue: 0 },
  A: { open: 0, narrow: 0.1, tongue: 0 },
  B: { open: 0.3, narrow: 0, tongue: 0 },
  C: { open: 0.56, narrow: 0, tongue: 0.3 },
  D: { open: 1.0, narrow: 0, tongue: 0.5 },
  E: { open: 0.6, narrow: 0.35, tongue: 0.3 },
  F: { open: 0.4, narrow: 0.7, tongue: 0 },
  G: { open: 0.14, narrow: 0.1, tongue: 0 },
  H: { open: 0.6, narrow: 0.1, tongue: 0.9 },
};

/** head centre in body coordinates (before crane / bob) */
export const MULE_HEAD: Pt = [66, -606];

export const Mule: React.FC<MuleProps> = ({
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
  lean = 0,
  crane = 0,
  armF,
  armB,
  handF = "open",
  handB = "open",
  wag = 0,
  grin = 1,
  walk = 0,
  walkAmt = 0,
  groove = 0,
  shade = 0,
  outfit = "dobbins",
  girth = 1,
  coat = COAT,
  mane = MANE,
  hat = false,
  hatColors,
  shades = false,
  prop = "none",
  horn = 0,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const coatDk = mixHex(coat, "#000000", 0.25);
  const sp = OPEN[mouth];
  const forced = expr === "laugh" ? 0.55 + energy * 0.4 : 0;
  const open = Math.max(sp.open * (talking ? 1 : 0.5), forced);
  const narrow = expr === "laugh" ? 0 : sp.narrow;
  const bob = talking ? open * 8 + energy * 4 : 0;
  const beat = groove > 0 ? Math.abs(Math.sin(t * Math.PI * 2)) : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.9 : 0.3), 4) * (talking ? 6 : 2.2) + groove * Math.sin(t * Math.PI * 2) * 8;
  const noBlink = expr === "stare" || shade > 0.3;
  const blink = noBlink || e.closed ? 0 : blinkAmount(t, id, 5.2);
  const dart = saccade(t, id, 0.05, 1.6);
  const gaze: Pt = [(look?.[0] ?? 0.6) + dart[0], (look?.[1] ?? 0.1) + dart[1]];
  const smile = e.smile * grin;

  // walk
  const wph = walk * Math.PI * 2;
  const legSwing = Math.sin(wph) * 20 * walkAmt;
  const walkBob = -Math.abs(Math.cos(wph)) * 8 * walkAmt;
  const by = walkBob - beat * groove * 10;

  const gx = (v: number) => v * girth;

  const geo = useMemo(
    () => ({
      cranium: blob(-4, -6, 54, 50, 12, 0.04, id + "cran"),
    }),
    [id],
  );

  const s = flip ? -scale : scale;

  /* ---------------- outfit colours ---------------- */
  const top = outfit === "tank" ? "#d9b46a" : outfit === "turtle" ? "#9d86c9" : outfit === "ruffle" ? "#a9cbe6" : SHIRT;
  const topSh = mixHex(top, "#000000", 0.18);
  const pantsCol = outfit === "tank" ? "#3b3f58" : outfit === "turtle" ? "#2e2a2a" : outfit === "ruffle" ? "#26304a" : PANTS;
  const pantsDk = mixHex(pantsCol, "#000000", 0.25);

  /* ---------------- legs ---------------- */
  const leg = (hx: number, fx: number, swing: number, back: boolean) => {
    const hip: Pt = [gx(hx), -300 + by];
    const a = (swing * Math.PI) / 180;
    const len = 254 + by * -0.2;
    const knee: Pt = [hip[0] + Math.sin(a) * len * 0.5 + 6, hip[1] + Math.cos(a) * len * 0.5];
    const foot: Pt = [fx + Math.sin(a) * 40, -46 - Math.max(0, -Math.sin(a)) * 18 * walkAmt];
    return (
      <g key={back ? "lb" : "lf"}>
        <path d={taperPath([hip, knee, foot], 46 * Math.max(1, girth * 0.8), 38)} fill={back ? pantsDk : pantsCol} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M${hip[0] + 6},${hip[1] + 20} L${foot[0] + 4},${foot[1] - 6}`} stroke={back ? mixHex(pantsDk, "#000", 0.2) : pantsDk} strokeWidth={3} />
        {/* argyle sock */}
        <g transform={`translate(${foot[0]} ${foot[1]})`}>
          <rect x={-15} y={0} width={30} height={30} fill={back ? "#8a3a40" : "#a8434a"} stroke={INK} strokeWidth={3.5} />
          <path d="M-15,15 L0,0 L15,15 L0,30 Z" fill="#e3d6b8" opacity={0.85} />
          <path d="M-15,0 L15,30 M15,0 L-15,30" stroke="#2a1a1a" strokeWidth={1.4} opacity={0.6} />
          {/* hoof */}
          <path d="M-18,28 L20,28 L24,48 L-20,48 Z" fill={HOOF} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M2,30 L2,46" stroke="#4a3c38" strokeWidth={3} />
          <path d="M-14,32 L-6,32" stroke="#5a4c48" strokeWidth={3} strokeLinecap="round" />
        </g>
      </g>
    );
  };

  /* ---------------- arms ---------------- */
  const shF: Pt = [gx(40), -466 + by];
  const shB: Pt = [gx(-36), -470 + by];
  const defF: [number, number] = [10, 16];
  const defB: [number, number] = [-8, 10];
  const aF = limb(shF, armF ?? defF, [118, 112]);
  const aB = limb(shB, armB ?? defB, [118, 112]);

  const hand = (pts: Pt[], kind: MuleHand, back: boolean, extraRot: number, key: string) => {
    const end = pts[2];
    const prev = pts[1];
    const a = Math.atan2(end[0] - prev[0], end[1] - prev[1]) + (extraRot * Math.PI) / 180;
    const col = back ? coatDk : coat;
    const fingerSet =
      kind === "point"
        ? [
            { da: 0, l: 42, curl: 0 },
            { da: 0.5, l: 14, curl: 1 },
            { da: 0.85, l: 12, curl: 1 },
          ]
        : kind === "fist"
          ? [
              { da: -0.3, l: 12, curl: 1 },
              { da: 0.1, l: 12, curl: 1 },
              { da: 0.5, l: 12, curl: 1 },
            ]
          : kind === "flat"
            ? [
                { da: -0.12, l: 36, curl: 0 },
                { da: 0, l: 40, curl: 0 },
                { da: 0.12, l: 36, curl: 0 },
              ]
            : kind === "grab"
              ? [
                  { da: -0.5, l: 30, curl: 0.6 },
                  { da: 0, l: 34, curl: 0.6 },
                  { da: 0.5, l: 30, curl: 0.6 },
                ]
              : [
                  { da: -0.62, l: 32, curl: 0 },
                  { da: -0.2, l: 38, curl: 0 },
                  { da: 0.22, l: 36, curl: 0 },
                  { da: 0.62, l: 30, curl: 0 },
                ];
    return (
      <g key={key}>
        {fingerSet.map((f, i) => {
          const r = a + f.da;
          const p1: Pt = [end[0] + Math.sin(r) * (14 + f.l * (1 - f.curl * 0.4)), end[1] + Math.cos(r) * (14 + f.l * (1 - f.curl * 0.4))];
          const bend = r + f.curl * 1.6;
          const p2: Pt = [p1[0] + Math.sin(bend) * 10 * (0.3 + f.curl), p1[1] + Math.cos(bend) * 10 * (0.3 + f.curl)];
          const d = `M${end[0]},${end[1]} L${p1[0]},${p1[1]} L${p2[0]},${p2[1]}`;
          return (
            <g key={i}>
              <path d={d} stroke={INK} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d={d} stroke={col} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx={p2[0]} cy={p2[1]} r={5.5} fill={HOOF} stroke={INK} strokeWidth={2} />
            </g>
          );
        })}
        <circle cx={end[0]} cy={end[1]} r={17} fill={col} stroke={INK} strokeWidth={4} />
        <path d={`M${end[0] - 6},${end[1] - 4} q6,-6 12,0`} stroke={coatDk} strokeWidth={2.5} fill="none" />
      </g>
    );
  };

  const arm = (pts: Pt[], back: boolean) => {
    const col = back ? coatDk : coat;
    const sleeveEnd: Pt = [pts[0][0] + (pts[1][0] - pts[0][0]) * (outfit === "tank" ? 0.05 : outfit === "dobbins" ? 0.42 : 1.6), pts[0][1] + (pts[1][1] - pts[0][1]) * (outfit === "tank" ? 0.05 : outfit === "dobbins" ? 0.42 : 1.6)];
    const longSleeve = outfit === "turtle" || outfit === "ruffle";
    return (
      <g>
        <DLine d={smoothPath(pts, false, 0.6)} w={longSleeve ? 30 : 22} color={longSleeve ? (back ? topSh : top) : col} ow={4.5} />
        {!longSleeve && outfit !== "tank" ? (
          <g>
            <path d={taperPath([[pts[0][0], pts[0][1] - 6], [(pts[0][0] + sleeveEnd[0]) / 2, (pts[0][1] + sleeveEnd[1]) / 2], sleeveEnd], 46, 40)} fill={back ? topSh : top} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
            <path d={`M${sleeveEnd[0] - 18},${sleeveEnd[1] + 4} L${sleeveEnd[0] + 18},${sleeveEnd[1] - 4}`} stroke={back ? mixHex(topSh, "#000", 0.2) : topSh} strokeWidth={4} strokeLinecap="round" />
          </g>
        ) : null}
        {longSleeve ? <DLine d={`M${pts[1][0] + (pts[2][0] - pts[1][0]) * 0.8},${pts[1][1] + (pts[2][1] - pts[1][1]) * 0.8} L${pts[2][0]},${pts[2][1]}`} w={outfit === "ruffle" ? 36 : 28} color={outfit === "ruffle" ? "#f4f2ec" : topSh} ow={3.5} /> : null}
      </g>
    );
  };

  /* ---------------- torso ---------------- */
  const torso = smoothPath(
    [
      [gx(-50), -312 + by],
      [gx(58), -312 + by],
      [gx(66) + (girth > 1.2 ? 30 : 0), -384 + by],
      [gx(58), -450 + by],
      [gx(40), -480 + by],
      [gx(-30), -484 + by],
      [gx(-50), -450 + by],
      [gx(-56), -384 + by],
    ],
    true,
    0.6,
  );

  const head: Pt = [MULE_HEAD[0] + crane, MULE_HEAD[1] - crane * 0.22 + by + bob * 0.5];
  const neckBase: Pt = [8, -480 + by];
  const neck = smoothPath([neckBase, [neckBase[0] + 14 + crane * 0.3, neckBase[1] - 40], [head[0] - 34, head[1] + 40], [head[0] - 16, head[1] + 18]], false, 0.8);

  /* ---------------- mouth geometry (head-local): a hinged lower jaw ---------------- */
  const backCorner: Pt = [2 + narrow * 46 + (1 - grin) * 22, 24 - smile * 20 + narrow * 6];
  const front: Pt = [124, 56];
  const upperMid: Pt = [56, 50 - smile * 4];
  const jawRot = open * 27;
  const rotJ = (p: Pt): Pt => {
    const a = (jawRot * Math.PI) / 180;
    const dx = p[0] - backCorner[0];
    const dy = p[1] - backCorner[1];
    return [backCorner[0] + dx * Math.cos(a) - dy * Math.sin(a), backCorner[1] + dx * Math.sin(a) + dy * Math.cos(a)];
  };
  const lowMid: Pt = [60 + narrow * 6, 60];
  const lowFront: Pt = [front[0] - 4, front[1] + 3];
  const rLowMid = rotJ(lowMid);
  const rLowFront = rotJ(lowFront);
  const upperLip = `M${backCorner[0]},${backCorner[1]} Q${upperMid[0]},${upperMid[1] + 4} ${front[0]},${front[1]}`;
  const mouthGap = `M${backCorner[0]},${backCorner[1]} Q${upperMid[0]},${upperMid[1] + 4} ${front[0]},${front[1]} L${rLowFront[0]},${rLowFront[1]} Q${rLowMid[0]},${rLowMid[1]} ${backCorner[0]},${backCorner[1]} Z`;
  const jawPath = `M${backCorner[0]},${backCorner[1]} Q${lowMid[0]},${lowMid[1]} ${lowFront[0]},${lowFront[1]} C${front[0] + 10},${front[1] + 14} ${front[0] - 2},${front[1] + 28} ${front[0] - 30},${front[1] + 28} C70,86 28,72 ${backCorner[0] - 16},${backCorner[1] + 24} Z`;
  const upperMuzzle = `M20,-30 C60,-26 96,-4 120,14 C140,28 148,46 138,58 L${front[0]},${front[1]} Q${upperMid[0]},${upperMid[1] + 4} ${backCorner[0]},${backCorner[1]} L-12,34 Z`;
  const teethN = 7;
  const toothNodes: React.ReactNode[] = [];
  for (let i = 0; i < teethN; i++) {
    const k0 = 0.18 + (i / teethN) * 0.8;
    const k1 = 0.18 + ((i + 1) / teethN) * 0.8;
    const q = (k: number): Pt => {
      const u = 1 - k;
      return [u * u * backCorner[0] + 2 * u * k * upperMid[0] + k * k * front[0], u * u * backCorner[1] + 2 * u * k * (upperMid[1] + 4) + k * k * front[1]];
    };
    const p0 = q(k0);
    const p1 = q(k1);
    const big = i >= teethN - 3;
    const th = (big ? 28 : 18) * (0.75 + 0.25 * grin) * (1 - narrow * 0.4);
    const lean2 = (rnd(`${id}tl${i}`) - 0.5) * 4;
    toothNodes.push(
      <path
        key={i}
        d={`M${p0[0] + 1},${p0[1] - 2} L${p1[0] - 1},${p1[1] - 2} L${p1[0] - 1 + lean2},${p1[1] + th} Q${(p0[0] + p1[0]) / 2},${(p0[1] + p1[1]) / 2 + th + 4} ${p0[0] + 1 + lean2},${p0[1] + th} Z`}
        fill={i === 5 ? "#e6d79c" : TEETH}
        stroke={INK}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />,
    );
  }
  /** lower teeth stand on the jaw's lip (drawn inside the rotated jaw group) */
  const lowerTeeth: React.ReactNode[] =
    open > 0.3
      ? [0, 1, 2, 3].map((i) => {
          const k = 0.42 + i * 0.14;
          const u = 1 - k;
          const px = u * u * backCorner[0] + 2 * u * k * lowMid[0] + k * k * lowFront[0];
          const py = u * u * backCorner[1] + 2 * u * k * lowMid[1] + k * k * lowFront[1];
          return <rect key={i} x={px - 7} y={py - 13} width={14} height={14} rx={2} fill={TEETH} stroke={INK} strokeWidth={2} />;
        })
      : [];

  /* ---------------- head ---------------- */
  const eyeClosed = e.closed;
  const headNode = (
    <g transform={`translate(${head[0]} ${head[1]}) rotate(${tilt})`}>
      {/* ears */}
      {[
        { base: [-38, -34] as Pt, tip: [-80, -196] as Pt, w: 40, col: coatDk },
        { base: [-8, -42] as Pt, tip: [-26, -212] as Pt, w: 46, col: coat },
      ].map((ear, i) => {
        const wob = noise2D(`${id}ear${i}`, t2 * 0.5, i) * 6 + groove * beat * 8;
        const tip: Pt = [ear.tip[0] + wob, ear.tip[1]];
        const mid: Pt = [(ear.base[0] + tip[0]) / 2 + 10, (ear.base[1] + tip[1]) / 2];
        return (
          <g key={i}>
            <path d={taperPath([ear.base, mid, tip], ear.w, 6)} fill={ear.col} stroke={INK} strokeWidth={4.5} />
            <path d={taperPath([[ear.base[0] + 3, ear.base[1] - 14], [mid[0] + 2, mid[1]], [tip[0] + 2, tip[1] + 20]], ear.w * 0.5, 3)} fill={EAR_IN} opacity={0.8} />
          </g>
        );
      })}
      <path d={geo.cranium} fill={coat} stroke={INK} strokeWidth={5} />
      {/* long muzzle (upper half) */}
      <path d={upperMuzzle} fill={MUZZLE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M40,-22 C70,-14 98,2 112,12" stroke={mixHex(MUZZLE, "#000", 0.1)} strokeWidth={4} fill="none" />
      {/* nostrils */}
      <ellipse cx={128} cy={30} rx={7} ry={11} transform="rotate(-30 128 30)" fill="#3a2522" stroke={INK} strokeWidth={2.5} />
      <ellipse cx={108} cy={22} rx={4.5} ry={7} transform="rotate(-30 108 22)" fill="#3a2522" opacity={0.85} />
      {/* the gap between the lips when the jaw swings down */}
      {open > 0.03 ? <path d={mouthGap} fill={MOUTH_IN} stroke={INK} strokeWidth={4} strokeLinejoin="round" /> : null}
      {open > 0.12 && sp.tongue > 0 ? (
        <ellipse cx={rLowMid[0] + 12} cy={rLowMid[1] - 8 - sp.tongue * open * 10} rx={30} ry={7 + open * 6} fill={TONGUE} stroke={INK} strokeWidth={2.5} transform={`rotate(${jawRot * 0.8} ${rLowMid[0]} ${rLowMid[1]})`} />
      ) : null}
      {/* lower jaw */}
      <g transform={`rotate(${jawRot} ${backCorner[0]} ${backCorner[1]})`}>
        {lowerTeeth}
        <path d={jawPath} fill={MUZZLE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M${lowMid[0] - 20},${lowMid[1] + 14} Q${lowMid[0] + 20},${lowMid[1] + 24} ${lowFront[0] - 20},${lowFront[1] + 16}`} stroke={mixHex(MUZZLE, "#000", 0.12)} strokeWidth={3.5} fill="none" />
      </g>
      {smile > 0.45 ? <path d={upperLip} stroke={GUM} strokeWidth={12 * (smile - 0.4)} fill="none" strokeLinecap="round" transform="translate(0 -3)" /> : null}
      {toothNodes}
      <path d={upperLip} stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      {/* cheek crease at the corner of the too-wide grin */}
      <path d={`M${backCorner[0] - 4},${backCorner[1] - 12} q-8,10 2,22`} stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
      <ellipse cx={backCorner[0] + 14} cy={backCorner[1] - 14} rx={13} ry={7} fill="#d87b84" opacity={0.35 * grin} />
      {/* eyes */}
      {eyeClosed === "happy" || eyeClosed === "squeeze" || eyeClosed === "wink" ? (
        <g stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round">
          {eyeClosed === "squeeze" ? (
            <>
              <path d="M-30,-30 L-16,-22 L-30,-14" />
              <path d="M24,-30 L6,-20 L24,-10" />
            </>
          ) : eyeClosed === "wink" ? (
            <path d="M-32,-22 Q-22,-34 -12,-22" />
          ) : (
            <>
              <path d="M-32,-20 Q-22,-34 -12,-20" />
              <path d="M-2,-16 Q12,-32 26,-16" />
            </>
          )}
        </g>
      ) : null}
      {!eyeClosed || eyeClosed === "wink" ? (
        <>
          {eyeClosed === "wink" ? null : (
            <Eye id={`${id}-eB`} seed={`${id}B`} cx={-22} cy={-24} rx={12} ry={15} look={gaze} pupil={e.pupil} sclera="#f6f1e1" veins={2} lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={-e.lidAngle} lidColor={coat} sw={3.5} />
          )}
          <Eye id={`${id}-eF`} seed={`${id}F`} cx={12} cy={-20} rx={16} ry={18} look={gaze} pupil={e.pupil} sclera="#f6f1e1" veins={3} lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={e.lidAngle} lidColor={coat} sw={3.5} />
        </>
      ) : null}
      {/* bags under the eyes */}
      <path d="M-32,-4 q10,7 20,0 M-2,2 q14,8 28,0" stroke="#6f5f66" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.6} />
      {/* brows */}
      {[
        [-22, -24, 12, -1],
        [12, -20, 16, 1],
      ].map(([cx, cy, rx, side], i) => {
        const yy = cy - 26 - e.brow * 8;
        const dy = Math.tan((e.browTilt * Math.PI) / 180) * rx;
        const inner = side > 0 ? cx - rx : cx + rx;
        const outer = side > 0 ? cx + rx : cx - rx;
        return <path key={i} d={`M${inner},${yy + dy} Q${cx},${yy - 9} ${outer},${yy - dy}`} stroke={mane} strokeWidth={7} strokeLinecap="round" fill="none" />;
      })}
      {/* slicked mane + kiss curl */}
      <path d="M26,-44 C10,-66 -40,-70 -62,-44 C-74,-28 -74,-8 -66,6 C-58,-14 -40,-34 -12,-44 C2,-48 16,-48 26,-44 Z" fill={mane} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M14,-50 C-8,-62 -40,-58 -58,-36" stroke={mixHex(mane, "#ffffff", 0.55)} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.9} />
      <path d="M-4,-58 C-20,-60 -34,-56 -44,-48" stroke="#ffffff" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
      <path d="M4,-46 C-14,-54 -36,-50 -52,-30 M-6,-42 C-22,-48 -40,-42 -54,-22" stroke={mixHex(mane, "#ffffff", 0.22)} strokeWidth={2} fill="none" />
      <path d="M26,-44 c10,-2 14,8 6,12 c-6,3 -10,-4 -4,-6" stroke={mane} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      {shades ? (
        <g>
          <path d="M-40,-34 L32,-30 L30,-10 Q14,-2 -2,-12 L-8,-24 L-16,-12 Q-32,-4 -40,-18 Z" fill="#141018" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M-30,-28 l10,0 M8,-26 l12,0" stroke="#ff7fd0" strokeWidth={3} strokeLinecap="round" opacity={0.85} />
        </g>
      ) : null}
      {hat ? <PartyHat x={-34} y={-58} rot={-24} s={1.05} colors={hatColors} /> : null}
    </g>
  );

  /* ---------------- outfit details ---------------- */
  const shirtDetails = () => {
    if (outfit === "dobbins") {
      return (
        <g>
          {/* collar */}
          <path d={`M${gx(-6)},${-484 + by} L${gx(12)},${-456 + by} L${gx(28)},${-484 + by} L${gx(46)},${-462 + by} L${gx(38)},${-486 + by}`} fill={SHIRT_SH} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          {/* pocket protector */}
          <g transform={`translate(${gx(-34)} ${-438 + by})`}>
            {["#c0312b", "#2c5aa0", "#1a1a1a"].map((c, i) => (
              <rect key={i} x={3 + i * 7} y={-12} width={6} height={18} rx={2} fill={c} stroke={INK} strokeWidth={1.5} />
            ))}
            <rect x={0} y={0} width={26} height={24} rx={3} fill="#f6f6f1" stroke={INK} strokeWidth={2.5} />
          </g>
          {/* long tie tucked into the slacks */}
          <path
            d={`M${gx(20)},${-478 + by} L${gx(34)},${-478 + by} L${gx(31)},${-466 + by} L${gx(42)},${-330 + by} L${gx(27)},${-316 + by} L${gx(14)},${-330 + by} L${gx(23)},${-466 + by} Z`}
            fill={TIE}
            stroke={INK}
            strokeWidth={3.5}
            strokeLinejoin="round"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${gx(24 + i * 2.6)},${-446 + i * 26 + by} a5,5 0 1 1 8,0`} stroke="#e8c35a" strokeWidth={2.2} fill="none" />
          ))}
          <path d={`M${gx(-48)},${-400 + by} q-6,40 4,80`} stroke={SHIRT_SH} strokeWidth={4} fill="none" />
        </g>
      );
    }
    if (outfit === "tank") {
      return (
        <g>
          {Array.from({ length: 14 }).map((_, i) => (
            <path key={i} d={blob(gx(-40 + (i % 4) * 30 + (i % 2) * 10), -330 - Math.floor(i / 4) * 34 + by, 8, 6, 6, 0.4, `${id}leo${i}`)} fill="none" stroke="#5a3a1a" strokeWidth={3} />
          ))}
          <path d={`M${gx(-30)},${-470 + by} Q${gx(10)},${-420 + by} ${gx(46)},${-468 + by}`} stroke="#e1b93f" strokeWidth={8} fill="none" strokeDasharray="9 5" />
          <circle cx={gx(10)} cy={-428 + by} r={11} fill="#e1b93f" stroke={INK} strokeWidth={3} />
        </g>
      );
    }
    if (outfit === "turtle") {
      return (
        <g>
          <rect x={gx(-22)} y={-504 + by} width={gx(62)} height={34} rx={10} fill={topSh} stroke={INK} strokeWidth={4} />
          <path d={`M${gx(-20)},${-466 + by} Q${gx(10)},${-404 + by} ${gx(44)},${-466 + by}`} stroke="#e1b93f" strokeWidth={4} fill="none" />
          <circle cx={gx(12)} cy={-414 + by} r={14} fill="#e1b93f" stroke={INK} strokeWidth={3} />
          <path d={`M${gx(6)},${-414 + by} l12,0 M${gx(12)},${-420 + by} l0,12`} stroke={INK} strokeWidth={2.5} />
        </g>
      );
    }
    return (
      <g>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${gx(-8)},${-468 + i * 24 + by} q${gx(18)},10 ${gx(36)},0`} stroke="#f4f2ec" strokeWidth={9} fill="none" strokeLinecap="round" />
        ))}
        <path d={`M${gx(-6)},${-492 + by} L${gx(14)},${-480 + by} L${gx(34)},${-492 + by} L${gx(34)},${-466 + by} L${gx(14)},${-478 + by} L${gx(-6)},${-466 + by} Z`} fill="#2a2a44" stroke={INK} strokeWidth={3} />
      </g>
    );
  };

  /* ---------------- props in the front hand ---------------- */
  const handPt = aF[2];
  const propNode =
    prop === "horn" ? (
      <g transform={`translate(${handPt[0]} ${handPt[1]})`}>
        <path d={`M0,-10 L${40 + horn * 120},-20 L${40 + horn * 120},0 L0,6 Z`} fill="#ff5fc8" stroke={INK} strokeWidth={3} />
        {horn > 0.5 ? <path d={`M${40 + horn * 120},-26 l26,-14 M${44 + horn * 120},-10 l30,0 M${40 + horn * 120},4 l26,14`} stroke={INK} strokeWidth={3} strokeLinecap="round" /> : null}
      </g>
    ) : prop === "punch" ? (
      <g transform={`translate(${handPt[0] + 30} ${handPt[1] - 20})`}>
        <path d="M-60,-20 L60,-20 Q56,40 0,46 Q-56,40 -60,-20 Z" fill="#f1e6ff" fillOpacity={0.6} stroke={INK} strokeWidth={4} />
        <path d="M-54,-6 L54,-6 Q50,36 0,40 Q-50,36 -54,-6 Z" fill="#e2459c" opacity={0.8} />
        <ellipse cx={0} cy={-20} rx={60} ry={10} fill="#f6a2d2" stroke={INK} strokeWidth={3} />
        <path d="M30,-24 L50,-70" stroke="#c9c9cf" strokeWidth={6} strokeLinecap="round" />
      </g>
    ) : null;

  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={0} cy={4} rx={110 * girth} o={0.32} />
      <g style={shade > 0 ? { filter: `brightness(${1 - shade * 0.86}) saturate(${1 - shade * 0.7})` } : undefined}>
        {/* back arm */}
        <g transform={`rotate(${lean} 0 ${-300 + by})`}>
          {arm(aB, true)}
          {hand(aB, handB, true, 0, "hB")}
        </g>
        {/* legs */}
        {leg(-20, -34, -legSwing, true)}
        {leg(18, 30, legSwing, false)}
        {/* high-waisted slacks top + belt */}
        <path d={`M${gx(-52)},${-300 + by} L${gx(60)},${-300 + by} L${gx(60)},${-330 + by} L${gx(-52)},${-330 + by} Z`} fill={pantsCol} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <g transform={`rotate(${lean} 0 ${-300 + by})`}>
          {/* neck + mane down the back */}
          <path d={neck} stroke={INK} strokeWidth={58} fill="none" strokeLinecap="round" />
          <path d={neck} stroke={coat} strokeWidth={48} fill="none" strokeLinecap="round" />
          <path
            d={smoothPath([[neckBase[0] - 26, neckBase[1] + 6], [neckBase[0] - 18, neckBase[1] - 44], [head[0] - 66, head[1] + 18], [head[0] - 60, head[1] - 10]], false, 0.8)}
            stroke={mane}
            strokeWidth={16}
            fill="none"
            strokeLinecap="round"
          />
          {/* torso */}
          <path d={torso} fill={top} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          {shirtDetails()}
          {/* belt + horseshoe buckle */}
          <path d={`M${gx(-52)},${-322 + by} L${gx(60)},${-322 + by}`} stroke="#22160e" strokeWidth={12} />
          <path d={`M${gx(28)},${-314 + by} a10,10 0 1 1 16,0`} stroke="#d6b04a" strokeWidth={6} fill="none" strokeLinecap="round" />
          {headNode}
          {/* front arm */}
          {arm(aF, false)}
          {propNode}
          {hand(aF, handF, false, wag, "hF")}
        </g>
      </g>
      {shade > 0.05 ? (
        <g transform={`rotate(${lean} 0 ${-300 + by})`} opacity={Math.min(1, shade * 1.3)}>
          {/* in the dark: only the eyes and the teeth catch the light */}
          <g transform={`translate(${head[0]} ${head[1]}) rotate(${tilt})`}>
            <circle cx={12} cy={-20} r={5} fill="#fff8d0" />
            <circle cx={-22} cy={-24} r={4} fill="#fff8d0" />
            <path d={upperLip} transform="translate(0 10)" stroke="#f6edc8" strokeWidth={12} fill="none" strokeLinecap="round" strokeDasharray="12 4" opacity={0.75} />
          </g>
        </g>
      ) : null}
    </g>
  );
};

/** world position of a mule's head centre for a given placement */
export const muleHead = (x: number, y: number, flip: boolean, scale = 1) => ({
  x: x + (flip ? -1 : 1) * MULE_HEAD[0] * scale,
  y: y + MULE_HEAD[1] * scale,
});
