import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { DLine, INK, Mouth, Shadow, blinkAmount, saccade } from "../../../characters/parts";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, clamp, lerp, limb, onN, rnd, smoothPath } from "../../../engine/util";

/**
 * EPISODE 008 cast — two moth brothers (original designs).
 *
 * BROTHER WICK: young, twitchy, wide-eyed. Sandy-cream fuzz, a fluffy pale collar, peach wings with dusty-rose
 *   smudges, enormous glossy black eyes that reflect the bulb, big feathery antennae that never stop twitching
 *   and a proboscis that uncoils when he looks at the light.
 * BROTHER TATTER: the scarred elder. Ashen grey fuzz worn bald on top, a cloudy stitched-up eye, a bent antenna,
 *   one forewing torn and holed (light shines through), scorched wing edges, a bandaged stump for a middle leg and a
 *   burnt matchstick for a hind leg. Sheds dust like dandruff.
 *
 * Faces right by default; origin = the floor between the feet. `pose: "fly"` dangles the legs and flaps the wings.
 */

export type MothKind = "wick" | "tatter";
export type MothExpr =
  | "neutral"
  | "yearn"
  | "awe"
  | "nervous"
  | "defiant"
  | "smug"
  | "scoff"
  | "hurt"
  | "ecstatic"
  | "shock"
  | "grave"
  | "stern"
  | "haunted"
  | "pleading"
  | "sad"
  | "bitter"
  | "wail"
  | "deadpan"
  | "tender"
  | "strain"
  | "dazed";

export interface Scars {
  torn: boolean;
  cloudy: boolean;
  /** near hind leg: a burnt match, a bare stump, or a normal leg */
  peg: "match" | "stump" | "none";
  stumpMid: boolean;
  bentAntenna: boolean;
  bald: boolean;
}

export interface MothProps {
  id: string;
  kind: MothKind;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  t: number;
  frame: number;
  mouth?: MouthShape;
  talking?: boolean;
  energy?: number;
  expr?: MothExpr;
  look?: Pt;
  headTilt?: number;
  /** 0 = wings folded like a cloak, 1 = spread wide */
  wings?: number;
  /** wing beat 0..1 (flying) */
  flap?: number;
  /** front legs [shoulder, elbow], degrees (0 = hanging down, + = forward) */
  armF?: [number, number];
  armB?: [number, number];
  /** antennae attitude override: -1 drooped .. +1 perked forward toward the light */
  perk?: number;
  /** body rotation in degrees around the thorax (+ = nose up) */
  bodyRot?: number;
  pose?: "stand" | "fly" | "lie";
  scars?: Partial<Scars>;
  /** flashback version of Tatter (no scars, fuller fuzz) */
  young?: boolean;
  /** 0..1 darken to a backlit silhouette */
  shade?: number;
  /** 0..1 the bulb reflected in the eyes */
  glint?: number;
  /** dust shedding multiplier */
  dust?: number;
  /** 0..1 proboscis uncoils */
  proboscis?: number;
  /** 0..1 whole-body shiver */
  tremble?: number;
  /** 0..1 tear streaks */
  tears?: number;
  /** 0..1 crouch before a jump */
  crouch?: number;
  /** lip-sync off (voice-over): mouth shows the expression only */
  mute?: boolean;
  /** 0..1 sweat / exhaustion (tongue out, drops) */
  spent?: number;
  /** skip the head (something else is drawn there) */
  headless?: boolean;
}

interface Style {
  fur: string;
  furDk: string;
  collar: string;
  face: string;
  wing: string;
  wingDk: string;
  wingAccent: string;
  hind: string;
  hindAccent: string;
  ant: string;
  antDk: string;
  leg: string;
  abd: string;
  abdRing: string;
  lip: string;
  wingL: number;
  antLen: number;
  thorax: { x: number; y: number; rx: number; ry: number };
  collarC: { x: number; y: number; rx: number; ry: number };
  head: { x: number; y: number; r: number };
  hipY: number;
  eye: { rxN: number; ryN: number; rxF: number; ryF: number };
}

const STYLES: Record<MothKind | "young", Style> = {
  wick: {
    fur: "#d9bd8c",
    furDk: "#a3845a",
    collar: "#f3e6c8",
    face: "#ead6aa",
    wing: "#c9a67c",
    wingDk: "#7a5a3e",
    wingAccent: "#d68f86",
    hind: "#dcb894",
    hindAccent: "#e09a8e",
    ant: "#b48d5c",
    antDk: "#77593a",
    leg: "#9c7b52",
    abd: "#cdab78",
    abdRing: "#efdcb2",
    lip: "#8a6a4c",
    wingL: 270,
    antLen: 225,
    thorax: { x: -4, y: -238, rx: 76, ry: 80 },
    collarC: { x: 8, y: -308, rx: 84, ry: 40 },
    head: { x: 30, y: -398, r: 78 },
    hipY: -176,
    eye: { rxN: 51, ryN: 57, rxF: 38, ryF: 46 },
  },
  tatter: {
    fur: "#8e8478",
    furDk: "#5a5148",
    collar: "#b3a895",
    face: "#a59b8b",
    wing: "#6e6457",
    wingDk: "#382f28",
    wingAccent: "#a9996f",
    hind: "#7c6f60",
    hindAccent: "#b3a27a",
    ant: "#6d5e4c",
    antDk: "#43372b",
    leg: "#5e5345",
    abd: "#7e7366",
    abdRing: "#a4998a",
    lip: "#5a4c40",
    wingL: 285,
    antLen: 212,
    thorax: { x: -10, y: -226, rx: 82, ry: 76 },
    collarC: { x: 4, y: -290, rx: 88, ry: 40 },
    head: { x: 42, y: -370, r: 77 },
    hipY: -168,
    eye: { rxN: 47, ryN: 52, rxF: 36, ryF: 43 },
  },
  young: {
    fur: "#a39176",
    furDk: "#6c5c47",
    collar: "#cdbf9f",
    face: "#b9a888",
    wing: "#857660",
    wingDk: "#45392d",
    wingAccent: "#c4ae7c",
    hind: "#94836b",
    hindAccent: "#ccb684",
    ant: "#7f6c54",
    antDk: "#4c3e2f",
    leg: "#6c5f4d",
    abd: "#958670",
    abdRing: "#c0b195",
    lip: "#65553f",
    wingL: 280,
    antLen: 222,
    thorax: { x: -4, y: -236, rx: 78, ry: 78 },
    collarC: { x: 6, y: -306, rx: 86, ry: 40 },
    head: { x: 30, y: -394, r: 78 },
    hipY: -176,
    eye: { rxN: 49, ryN: 55, rxF: 37, ryF: 45 },
  },
};

interface ExprSpec {
  lidTop: number;
  lidBottom: number;
  lidAngle: number;
  pupil: number;
  smile: number;
  brow: number;
  browTilt: number;
  perk: number;
  open?: number;
  squeeze?: boolean;
}

const EXPR: Record<MothExpr, ExprSpec> = {
  neutral: { lidTop: 0.15, lidBottom: 0.05, lidAngle: 0, pupil: 0.45, smile: 0, brow: 0.2, browTilt: 0, perk: 0 },
  yearn: { lidTop: 0.04, lidBottom: 0.0, lidAngle: -8, pupil: 0.72, smile: 0.25, brow: 0.9, browTilt: -12, perk: 0.8, open: 0.12 },
  awe: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.8, smile: 0.1, brow: 1.4, browTilt: -6, perk: 1, open: 0.32 },
  nervous: { lidTop: 0, lidBottom: 0.05, lidAngle: -6, pupil: 0.3, smile: -0.25, brow: 1.1, browTilt: -16, perk: 0.3 },
  defiant: { lidTop: 0.2, lidBottom: 0.0, lidAngle: 18, pupil: 0.42, smile: -0.05, brow: -0.7, browTilt: 20, perk: 0.6 },
  smug: { lidTop: 0.4, lidBottom: 0.04, lidAngle: 6, pupil: 0.38, smile: 0.5, brow: -0.1, browTilt: 8, perk: 0.3 },
  scoff: { lidTop: 0.3, lidBottom: 0.02, lidAngle: -2, pupil: 0.35, smile: 0.25, brow: 0.9, browTilt: 10, perk: 0.2 },
  hurt: { lidTop: 0.28, lidBottom: 0.06, lidAngle: -16, pupil: 0.6, smile: -0.5, brow: 1.1, browTilt: -22, perk: -0.5 },
  ecstatic: { lidTop: 0, lidBottom: 0.12, lidAngle: -10, pupil: 0.88, smile: 0.95, brow: 1.3, browTilt: -10, perk: 1, open: 0.3 },
  shock: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.24, smile: -0.4, brow: 1.6, browTilt: -6, perk: 1, open: 0.5 },
  grave: { lidTop: 0.4, lidBottom: 0.08, lidAngle: 4, pupil: 0.42, smile: -0.3, brow: -0.2, browTilt: 6, perk: -0.3 },
  stern: { lidTop: 0.3, lidBottom: 0.05, lidAngle: 16, pupil: 0.36, smile: -0.35, brow: -0.8, browTilt: 18, perk: 0 },
  haunted: { lidTop: 0.04, lidBottom: 0.1, lidAngle: 0, pupil: 0.2, smile: -0.4, brow: 0.7, browTilt: -8, perk: -0.6 },
  pleading: { lidTop: 0.04, lidBottom: 0.14, lidAngle: -16, pupil: 0.64, smile: -0.4, brow: 1.4, browTilt: -22, perk: -0.2 },
  sad: { lidTop: 0.44, lidBottom: 0.05, lidAngle: -18, pupil: 0.52, smile: -0.55, brow: 1.0, browTilt: -24, perk: -0.8 },
  bitter: { lidTop: 0.32, lidBottom: 0.08, lidAngle: 22, pupil: 0.32, smile: -0.5, brow: -1.0, browTilt: 26, perk: -0.2 },
  wail: { lidTop: 1, lidBottom: 0, lidAngle: 0, pupil: 0.3, smile: -0.8, brow: 1.4, browTilt: -20, perk: -1, open: 0.9, squeeze: true },
  deadpan: { lidTop: 0.55, lidBottom: 0.1, lidAngle: 0, pupil: 0.35, smile: 0, brow: 0, browTilt: 0, perk: -0.4 },
  tender: { lidTop: 0.26, lidBottom: 0.04, lidAngle: -10, pupil: 0.62, smile: 0.3, brow: 0.8, browTilt: -14, perk: 0 },
  strain: { lidTop: 0.78, lidBottom: 0.3, lidAngle: 14, pupil: 0.3, smile: -0.6, brow: -1, browTilt: 24, perk: 0.6, open: 0.25 },
  dazed: { lidTop: 0.38, lidBottom: 0.06, lidAngle: -6, pupil: 0.24, smile: -0.2, brow: 0.3, browTilt: 0, perk: -0.8 },
};

const OPEN: Record<MouthShape, number> = { X: 0, A: 0, B: 0.18, C: 0.5, D: 1, E: 0.45, F: 0.25, G: 0.15, H: 0.55 };

/** head centre offsets (body coordinates, standing) for cameras and 9:16 speaker focus */
export const MOTH_HEAD: Record<MothKind, Pt> = {
  wick: [STYLES.wick.head.x, STYLES.wick.head.y],
  tatter: [STYLES.tatter.head.x, STYLES.tatter.head.y],
};

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */

/** Fuzzy outline: tufts flicking one way around an ellipse. */
export function furPath(cx: number, cy: number, rx: number, ry: number, n: number, fluff: number, seed: string): string {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 1 + (rnd(`${seed}r${i}`) - 0.5) * 0.1;
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const mx = (p1[0] + p2[0]) / 2;
    const my = (p1[1] + p2[1]) / 2;
    const nx = mx - cx;
    const ny = my - cy;
    const l = Math.hypot(nx, ny) || 1;
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const k = fluff * (0.7 + rnd(`${seed}f${i}`) * 0.6);
    // tuft tip pushed outward and flicked along the tangent
    const tx = mx + (nx / l) * seg * k + ((p2[0] - p1[0]) / seg) * seg * 0.35;
    const ty = my + (ny / l) * seg * k + ((p2[1] - p1[1]) / seg) * seg * 0.35;
    d += ` Q${tx.toFixed(1)},${ty.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + " Z";
}

/** Fuzzy outline around arbitrary closed points (abdomen etc.). */
function furAround(pts: Pt[], fluff: number, seed: string): string {
  const n = pts.length;
  let cx = 0;
  let cy = 0;
  pts.forEach((p) => {
    cx += p[0] / n;
    cy += p[1] / n;
  });
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const mx = (p1[0] + p2[0]) / 2;
    const my = (p1[1] + p2[1]) / 2;
    const nx = mx - cx;
    const ny = my - cy;
    const l = Math.hypot(nx, ny) || 1;
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
    const k = fluff * (0.7 + rnd(`${seed}f${i}`) * 0.6);
    const tx = mx + (nx / l) * seg * k + ((p2[0] - p1[0]) / seg) * seg * 0.3;
    const ty = my + (ny / l) * seg * k + ((p2[1] - p1[1]) / seg) * seg * 0.3;
    d += ` Q${tx.toFixed(1)},${ty.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + " Z";
}

function resample(pts: Pt[], n: number): Pt[] {
  // points along a closed polygon, evenly spaced
  const segs: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push(l);
    total += l;
  }
  const out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    let d = (k / n) * total;
    let i = 0;
    while (d > segs[i] && i < segs.length - 1) {
      d -= segs[i];
      i++;
    }
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const f = segs[i] ? d / segs[i] : 0;
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return out;
}

const rot = (p: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180;
  return [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)];
};

/* ------------------------------------------------------------------ */
/* Feathery antenna                                                    */
/* ------------------------------------------------------------------ */

interface AntGeo {
  outline: string;
  barbs: string;
  shaft: string;
}

/** Comb-like feathered antenna. angle: 0 = straight up, + = toward the face. curl: total bend in degrees (backwards). */
function antenna(root: Pt, angle: number, len: number, curl: number, barb: number, kink: number, seed: string, missing = false): AntGeo {
  const N = 14;
  const shaft: Pt[] = [root];
  let dir = angle;
  let p = root;
  const step = len / N;
  for (let i = 1; i <= N; i++) {
    dir -= curl / N;
    if (kink && i === Math.round(N * 0.42)) dir += kink;
    const r = (dir * Math.PI) / 180;
    p = [p[0] + Math.sin(r) * step, p[1] - Math.cos(r) * step];
    shaft.push(p);
  }
  const left: Pt[] = [];
  const right: Pt[] = [];
  const barbs: string[] = [];
  for (let i = 1; i < N; i++) {
    const a = shaft[i - 1];
    const b = shaft[i + 1];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    const ux = tx / l;
    const uy = ty / l;
    const u = i / N;
    const prof = Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + u * 0.95)), 0.65) * (missing && u > 0.5 && u < 0.72 ? 0.18 : 1);
    const L = barb * prof * (0.85 + rnd(`${seed}b${i}`) * 0.3);
    // barbs sweep toward the tip at ~57 deg either side of the shaft tangent
    const ca = Math.cos(1.0);
    const sa = Math.sin(1.0);
    const lx = ux * ca + uy * sa;
    const ly = -ux * sa + uy * ca;
    const rx = ux * ca - uy * sa;
    const ry = ux * sa + uy * ca;
    const s = shaft[i];
    const tipL: Pt = [s[0] + lx * L, s[1] + ly * L];
    const tipR: Pt = [s[0] + rx * L, s[1] + ry * L];
    const notch = (q: Pt): Pt => [s[0] + (q[0] - s[0]) * 0.28 + ux * step * 0.5, s[1] + (q[1] - s[1]) * 0.28 + uy * step * 0.5];
    left.push(tipL, notch(tipL));
    right.push(tipR, notch(tipR));
    barbs.push(`M${s[0].toFixed(1)},${s[1].toFixed(1)} L${tipL[0].toFixed(1)},${tipL[1].toFixed(1)} M${s[0].toFixed(1)},${s[1].toFixed(1)} L${tipR[0].toFixed(1)},${tipR[1].toFixed(1)}`);
  }
  const tip = shaft[N];
  const outlinePts = [root, ...left, tip, ...right.reverse()];
  const outline = `M${outlinePts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" L")} Z`;
  return { outline, barbs: barbs.join(" "), shaft: smoothPath(shaft, false) };
}

/* ------------------------------------------------------------------ */
/* Compound eye                                                        */
/* ------------------------------------------------------------------ */

interface CEyeProps {
  id: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  look: Pt;
  pupil: number;
  lidTop: number;
  lidBottom: number;
  lidAngle: number;
  lidColor: string;
  cloudy?: boolean;
  glint?: number;
  sw?: number;
}

export const CEye: React.FC<CEyeProps> = ({ id, cx, cy, rx, ry, look, pupil, lidTop, lidBottom, lidAngle, lidColor, cloudy = false, glint = 0, sw = 4.5 }) => {
  const clip = `${id}-c`;
  const px = look[0] * rx * 0.42;
  const py = look[1] * ry * 0.38;
  // wide open (lidTop ~0) shows no lid at all; the droopy lid edge fades in as the lid lowers
  const lt = Math.min(1, lidTop);
  const topY = -ry * 1.12 + lt * 2.12 * ry;
  const tilt = Math.tan((lidAngle * Math.PI) / 180) * rx * Math.min(1, lt * 4);
  const sag = ry * 0.4 * Math.min(1, lt * 3) * (1 - lt);
  const lidPath = `M${-rx * 1.5},${-ry * 1.7} L${rx * 1.5},${-ry * 1.7} L${rx * 1.5},${topY - tilt} Q0,${topY + sag} ${-rx * 1.5},${topY + tilt} Z`;
  const lidEdge = `M${-rx * 1.5},${topY + tilt} Q0,${topY + sag} ${rx * 1.5},${topY - tilt}`;
  const botY = ry - Math.min(1, lidBottom) * 2 * ry;
  const bLid = `M${-rx * 1.5},${ry * 1.7} L${rx * 1.5},${ry * 1.7} L${rx * 1.5},${botY} Q0,${botY - ry * 0.3} ${-rx * 1.5},${botY} Z`;
  const base = cloudy ? "#b9c4c4" : "#1a100e";
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <defs>
        <clipPath id={clip}>
          <ellipse rx={rx} ry={ry} />
        </clipPath>
      </defs>
      <ellipse rx={rx} ry={ry} fill={base} />
      <g clipPath={`url(#${clip})`}>
        {/* glossy dome + facet hints */}
        <ellipse cx={-rx * 0.22} cy={-ry * 0.28} rx={rx * 0.85} ry={ry * 0.62} fill={cloudy ? "#e4ecea" : "#4d3a33"} opacity={cloudy ? 0.55 : 0.42} />
        <ellipse cx={rx * 0.3} cy={ry * 0.55} rx={rx * 0.9} ry={ry * 0.5} fill="#000" opacity={cloudy ? 0.12 : 0.35} />
        <path
          d={`M${-rx},${-ry * 0.2} Q0,${-ry * 0.45} ${rx},${-ry * 0.2} M${-rx},${ry * 0.25} Q0,${ry * 0.02} ${rx},${ry * 0.25} M${-rx * 0.35},${-ry} Q${-rx * 0.5},0 ${-rx * 0.35},${ry} M${rx * 0.35},${-ry} Q${rx * 0.5},0 ${rx * 0.35},${ry}`}
          stroke={cloudy ? "#8fa0a2" : "#6a5048"}
          strokeWidth={1.4}
          fill="none"
          opacity={0.35}
        />
        {cloudy ? (
          <>
            <circle cx={px * 0.6} cy={py * 0.6} r={rx * 0.32} fill="#8d9ea2" opacity={0.45} />
            <path d={`M${-rx * 0.7},${-ry * 0.1} q${rx * 0.5},${-ry * 0.5} ${rx * 1.1},${-ry * 0.15}`} stroke="#ffffff" strokeWidth={3} opacity={0.5} fill="none" />
          </>
        ) : (
          <>
            {/* night eyeshine: a warm amber "iris" glowing in the dark dome, so lids read as lids */}
            <circle cx={px} cy={py} r={rx * 0.66} fill="#6b4226" />
            <circle cx={px} cy={py} r={rx * 0.66} fill="none" stroke="#2a160e" strokeWidth={rx * 0.1} />
            <circle cx={px} cy={py} r={rx * 0.48} fill="#8a5a30" opacity={0.6} />
            <circle cx={px} cy={py} r={Math.max(rx * 0.16, rx * pupil * 0.56)} fill="#0a0504" />
          </>
        )}
        {/* the bulb reflected */}
        {glint > 0 && !cloudy ? (
          <g opacity={glint}>
            <ellipse cx={px + rx * 0.18} cy={py - ry * 0.42} rx={rx * 0.2} ry={ry * 0.16} fill="#ffd87a" />
            <ellipse cx={px + rx * 0.18} cy={py - ry * 0.42} rx={rx * 0.34} ry={ry * 0.28} fill="#ffcf6a" opacity={0.35} />
          </g>
        ) : null}
        <ellipse cx={px - rx * 0.34} cy={py - ry * 0.36} rx={rx * 0.26} ry={ry * 0.18} fill="#fff" opacity={cloudy ? 0.5 : 0.9} transform={`rotate(-24 ${px - rx * 0.34} ${py - ry * 0.36})`} />
        <circle cx={px + rx * 0.28} cy={py + ry * 0.24} r={rx * 0.08} fill="#fff" opacity={0.75} />
        <path d={lidPath} fill={lidColor} />
        {lidBottom > 0.02 ? <path d={bLid} fill={lidColor} /> : null}
        {lidTop > 0.03 ? <path d={lidEdge} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" /> : null}
      </g>
      <ellipse rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={sw} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Wings                                                               */
/* ------------------------------------------------------------------ */

const FORE: Pt[] = [
  [0, 0],
  [-0.1, -0.32],
  [-0.15, -0.72],
  [-0.1, -0.98],
  [0.02, -1.02],
  [0.18, -0.93],
  [0.31, -0.74],
  [0.34, -0.6],
  [0.25, -0.34],
  [0.1, -0.08],
];
const FORE_TORN = "M0,0 L-0.1,-0.32 L-0.15,-0.72 L-0.1,-0.98 L0.02,-1.02 L0.09,-0.95 L0.05,-0.87 L0.13,-0.84 L0.11,-0.76 L0.2,-0.78 L0.17,-0.69 L0.29,-0.66 L0.26,-0.58 L0.33,-0.55 L0.25,-0.34 L0.1,-0.08 Z";
const HIND: Pt[] = [
  [0, 0],
  [-0.06, -0.3],
  [0.04, -0.6],
  [0.24, -0.68],
  [0.4, -0.56],
  [0.43, -0.32],
  [0.27, -0.08],
];

interface WingGeo {
  fore: string;
  hind: string;
  bands: string;
  spots: string;
  fringe: string;
  speck: Pt[];
  holes: Array<[number, number, number]>;
  scorch: string;
  eyespot: { c: Pt; r: number };
}

function wingGeo(L: number, torn: boolean, seed: string): WingGeo {
  const S = (p: Pt): Pt => [p[0] * L, p[1] * L];
  const fmt = (pts: Pt[]) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`);
  const fore = torn
    ? FORE_TORN.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (_m, a, b) => `${(parseFloat(a) * L).toFixed(1)},${(parseFloat(b) * L).toFixed(1)}`)
    : smoothPath(FORE.map(S), true, 0.85);
  const hindPts = HIND.map((p) => S([p[0] * 0.95, p[1] * 0.95]));
  const zig = (v: number, amp: number) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const xl = lerp(-0.13, 0.3, u) * (v < 0.5 ? 0.85 : 1);
      pts.push(S([xl, -v + (i % 2 ? amp : -amp) + Math.sin(u * 3) * 0.03]));
    }
    return `M${fmt(pts).join(" L")}`;
  };
  const bands = `${zig(0.34, 0.025)} ${zig(0.66, 0.03)} ${zig(0.86, 0.02)}`;
  const spots = `M${(0.0 * L).toFixed(1)},${(-0.45 * L).toFixed(1)} m-${(0.045 * L).toFixed(1)},0 a${(0.045 * L).toFixed(1)},${(0.04 * L).toFixed(1)} 0 1 0 ${(0.09 * L).toFixed(1)},0 a${(0.045 * L).toFixed(1)},${(0.04 * L).toFixed(1)} 0 1 0 -${(0.09 * L).toFixed(1)},0`;
  const fr: string[] = [];
  for (let i = 0; i < 14; i++) {
    const u = i / 13;
    const p = S([lerp(0.02, 0.33, u), lerp(-1.02, -0.6, Math.pow(u, 0.9))]);
    const q: Pt = [p[0] + L * 0.025, p[1] - L * 0.012];
    fr.push(`M${p[0].toFixed(1)},${p[1].toFixed(1)} L${q[0].toFixed(1)},${q[1].toFixed(1)}`);
  }
  const speck: Pt[] = [];
  for (let i = 0; i < 18; i++) {
    const v = 0.15 + rnd(`${seed}sv${i}`) * 0.8;
    const u = rnd(`${seed}su${i}`);
    speck.push(S([lerp(-0.12, 0.28, u) * (1 - v * 0.2), -v]));
  }
  const holes: Array<[number, number, number]> = torn
    ? [
        [0.02 * L, -0.55 * L, 0.035 * L],
        [0.14 * L, -0.42 * L, 0.025 * L],
        [-0.05 * L, -0.78 * L, 0.022 * L],
        [0.18 * L, -0.6 * L, 0.018 * L],
      ]
    : [];
  const scorch = smoothPath([S([0.02, -1.02]), S([0.18, -0.93]), S([0.31, -0.74]), S([0.34, -0.6])], false);
  return { fore, hind: smoothPath(hindPts, true, 0.9), bands, spots, fringe: fr.join(" "), speck, holes, scorch, eyespot: { c: S([0.24, -0.4]), r: 0.12 * L } };
}

/* ------------------------------------------------------------------ */
/* The rig                                                             */
/* ------------------------------------------------------------------ */

export const Moth: React.FC<MothProps> = ({
  id,
  kind,
  x,
  y,
  scale = 1,
  flip = false,
  t,
  frame,
  mouth = "X",
  talking = false,
  energy = 0,
  expr,
  look,
  headTilt = 0,
  wings = 0,
  flap = 0,
  armF,
  armB,
  perk,
  bodyRot = 0,
  pose = "stand",
  scars: scarsIn,
  young = false,
  shade = 0,
  glint = 0,
  dust,
  proboscis = 0,
  tremble = 0,
  tears = 0,
  crouch = 0,
  mute = false,
  spent = 0,
  headless = false,
}) => {
  const isT = kind === "tatter";
  const st = STYLES[isT && young ? "young" : kind];
  const scars: Scars = {
    torn: isT && !young,
    cloudy: isT && !young,
    peg: isT && !young ? "match" : "none",
    stumpMid: isT && !young,
    bentAntenna: isT && !young,
    bald: isT && !young,
    ...scarsIn,
  };
  const ex = EXPR[expr ?? (isT ? "grave" : "yearn")];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const flying = pose === "fly";
  const lying = pose === "lie";

  // talking + twitch + tremble
  const open = mute ? (ex.open ?? 0) : Math.max(OPEN[mouth] * (talking ? 1 : 0.5), ex.open ?? 0);
  const bob = talking ? open * 7 + energy * 3 : 0;
  const quaver = isT && talking ? Math.sin(t2 * 38) * (1.2 + energy * 1.6) : 0;
  const twitchK = !isT ? (rnd(`${id}tw${Math.floor(t / 2.1)}`) < 0.55 ? clamp(1 - Math.abs((t % 2.1) - 1.3) / 0.12) : 0) : 0;
  const shiver = tremble > 0 ? (rnd(`${id}sh${f2}`) - 0.5) * 2 * tremble * 4 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.8 : 0.3), 2) * (talking ? 6 : 2.5) + quaver + twitchK * 7 + shiver * 0.6;
  const blink = ex.squeeze ? 0 : blinkAmount(t, id, isT ? 4.0 : 2.6);
  const dart = saccade(t, id, kind === "wick" ? 0.22 : 0.08, kind === "wick" ? 0.55 : 1.3);
  const gaze: Pt = [(look?.[0] ?? 0.5) + dart[0], (look?.[1] ?? -0.1) + dart[1]];
  const perkK = perk ?? ex.perk;
  const squat = crouch * 34;

  const th = { ...st.thorax, y: st.thorax.y + squat };
  const co = { ...st.collarC, y: st.collarC.y + squat };
  const hd = { ...st.head, y: st.head.y + squat + bob * 0.5 };

  const geo = useMemo(() => {
    const wingNear = wingGeo(st.wingL, scars.torn, id + "wn");
    const wingFar = wingGeo(st.wingL * 0.96, false, id + "wf");
    const abdPts: Pt[] = [
      [-30, -196],
      [-72, -182],
      [-98, -140],
      [-100, -88],
      [-84, -46],
      [-62, -28],
      [-42, -46],
      [-30, -96],
      [-16, -152],
    ];
    return {
      wingNear,
      wingFar,
      thorax: furPath(0, 0, st.thorax.rx, st.thorax.ry, 18, 0.32, id + "th"),
      collar: furPath(0, 0, st.collarC.rx, st.collarC.ry, 22, 0.5, id + "co"),
      head: furPath(0, 0, st.head.r, st.head.r * 0.94, 20, 0.28, id + "hd"),
      cheek: furPath(0, 0, st.head.r * 0.66, st.head.r * 0.44, 16, 0.3, id + "ck"),
      chin: furPath(0, 0, st.head.r * 0.4, st.head.r * 0.2, 12, 0.55, id + "cn"),
      abd: furAround(resample(abdPts, 22), 0.28, id + "ab"),
    };
  }, [id, st, scars.torn]);

  /* ---------------- wings ---------------- */
  const flapPh = flap > 0 ? Math.sin(t2 * Math.PI * 2 * 4.2) : 0;
  const nearA = lerp(-162, -40, wings) - flapPh * flap * 42;
  const farA = lerp(-148, 26, wings) + flapPh * flap * 36;
  const wNear: Pt = [-40, th.y - 52];
  const wFar: Pt = [-18, th.y - 62];

  const drawWing = (g: WingGeo, root: Pt, ang: number, far: boolean, torn: boolean, key: string) => {
    const base = far ? mixHex(st.wing, "#000000", 0.25) : st.wing;
    const hindBase = far ? mixHex(st.hind, "#000000", 0.25) : st.hind;
    const clipF = `${id}-${key}-cf`;
    const clipH = `${id}-${key}-ch`;
    const maskId = `${id}-${key}-m`;
    const hindAng = ang + (ang < -90 ? 4 : -22) * (far ? -1 : 1);
    const hindS = lerp(0.6, 1, wings);
    return (
      <g key={key}>
        {/* hindwing (under; tucked away when folded) */}
        <g transform={`translate(${root[0] - 8 * hindS} ${root[1] + 18 * hindS}) rotate(${hindAng}) scale(${hindS})`}>
          <defs>
            <clipPath id={clipH}>
              <path d={g.hind} />
            </clipPath>
          </defs>
          <path d={g.hind} fill={hindBase} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          <g clipPath={`url(#${clipH})`}>
            {isT ? (
              <g>
                <circle cx={g.eyespot.c[0]} cy={g.eyespot.c[1]} r={g.eyespot.r} fill={st.wingDk} />
                <circle cx={g.eyespot.c[0]} cy={g.eyespot.c[1]} r={g.eyespot.r * 0.7} fill={st.hindAccent} />
                <circle cx={g.eyespot.c[0] + 2} cy={g.eyespot.c[1] - 1} r={g.eyespot.r * 0.36} fill={INK} />
                <circle cx={g.eyespot.c[0] - 3} cy={g.eyespot.c[1] - 5} r={g.eyespot.r * 0.12} fill="#e8e0c8" />
              </g>
            ) : (
              <ellipse cx={g.eyespot.c[0]} cy={g.eyespot.c[1]} rx={g.eyespot.r * 2.1} ry={g.eyespot.r * 1.5} fill={st.hindAccent} opacity={0.75} />
            )}
            <path d={g.hind} fill="none" stroke={st.wingDk} strokeWidth={10} opacity={0.35} />
          </g>
        </g>
        {/* forewing */}
        <g transform={`translate(${root[0]} ${root[1]}) rotate(${ang})`}>
          <defs>
            <clipPath id={clipF}>
              <path d={g.fore} />
            </clipPath>
            {g.holes.length ? (
              <mask id={maskId} maskUnits="userSpaceOnUse" x={-st.wingL} y={-st.wingL * 1.3} width={st.wingL * 2} height={st.wingL * 1.6}>
                <rect x={-st.wingL} y={-st.wingL * 1.3} width={st.wingL * 2} height={st.wingL * 1.6} fill="#fff" />
                {g.holes.map(([hx, hy, hr], i) => (
                  <path key={i} d={blobHole(hx, hy, hr, `${id}h${i}`)} fill="#000" />
                ))}
              </mask>
            ) : null}
          </defs>
          <g mask={g.holes.length ? `url(#${maskId})` : undefined}>
            <path d={g.fore} fill={base} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <g clipPath={`url(#${clipF})`}>
              <path d={g.bands} stroke={st.wingDk} strokeWidth={5} fill="none" strokeLinejoin="round" opacity={0.85} />
              <path d={g.spots} fill="none" stroke={st.wingDk} strokeWidth={4} />
              <ellipse cx={0.11 * st.wingL} cy={-0.6 * st.wingL} rx={0.05 * st.wingL} ry={0.028 * st.wingL} fill={st.wingDk} opacity={0.8} transform={`rotate(-20 ${0.11 * st.wingL} ${-0.6 * st.wingL})`} />
              {!isT ? <ellipse cx={0.05 * st.wingL} cy={-0.75 * st.wingL} rx={0.14 * st.wingL} ry={0.07 * st.wingL} fill={st.wingAccent} opacity={0.5} /> : null}
              {g.speck.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r={1.6 + (i % 3)} fill={i % 2 ? st.wingDk : mixHex(base, "#ffffff", 0.3)} opacity={0.55} />
              ))}
              {torn || isT ? <path d={g.scorch} stroke="#1d1410" strokeWidth={isT ? 18 : 0} fill="none" opacity={0.55} /> : null}
            </g>
            <path d={g.fringe} stroke={mixHex(base, "#ffffff", 0.2)} strokeWidth={3} strokeLinecap="round" />
          </g>
          {g.holes.map(([hx, hy, hr], i) => (
            <path key={i} d={blobHole(hx, hy, hr, `${id}h${i}`)} fill="none" stroke={INK} strokeWidth={3} />
          ))}
        </g>
      </g>
    );
  };

  /* ---------------- legs ---------------- */
  const legCol = st.leg;
  const legDk = mixHex(st.leg, "#000000", 0.25);
  const insectLeg = (pts: Pt[], key: string, col: string, w = [19, 10, 6]) => {
    const [hip, knee, ankle, toe] = pts;
    const claw: Pt = [toe[0] + 9, toe[1] + 2];
    return (
      <g key={key}>
        <DLine d={`M${hip[0]},${hip[1]} L${knee[0]},${knee[1]}`} w={w[0]} color={col} ow={4} />
        <DLine d={`M${knee[0]},${knee[1]} L${ankle[0]},${ankle[1]}`} w={w[1]} color={col} ow={3.5} />
        <DLine d={`M${ankle[0]},${ankle[1]} L${toe[0]},${toe[1]}`} w={w[2]} color={col} ow={3} />
        <path d={`M${toe[0]},${toe[1]} q8,-6 ${claw[0] - toe[0]},${claw[1] - toe[1] + 4}`} stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        {/* spines on the shin */}
        {[0.3, 0.6].map((k) => {
          const sx = lerp(knee[0], ankle[0], k);
          const sy = lerp(knee[1], ankle[1], k);
          return <path key={k} d={`M${sx},${sy} l${-7},${-5}`} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />;
        })}
      </g>
    );
  };

  const hipN: Pt = [14, st.hipY + squat];
  const hipF: Pt = [-20, st.hipY + squat - 4];
  let hindN: Pt[];
  let hindF: Pt[];
  if (flying) {
    const sw = Math.sin(t2 * 5) * 6;
    hindN = [hipN, [hipN[0] - 30, hipN[1] + 64 + sw], [hipN[0] - 72, hipN[1] + 112], [hipN[0] - 96, hipN[1] + 124]];
    hindF = [hipF, [hipF[0] - 36, hipF[1] + 58 - sw], [hipF[0] - 80, hipF[1] + 100], [hipF[0] - 104, hipF[1] + 108]];
  } else if (lying) {
    hindN = [hipN, [hipN[0] + 30, hipN[1] - 50], [hipN[0] + 18, hipN[1] - 96], [hipN[0] + 36, hipN[1] - 110]];
    hindF = [hipF, [hipF[0] + 20, hipF[1] - 56], [hipF[0] + 4, hipF[1] - 100], [hipF[0] + 18, hipF[1] - 118]];
  } else {
    hindN = [hipN, [38 + squat * 0.7, -102 + squat * 0.6], [16, -22], [42, -4]];
    hindF = [hipF, [6 + squat * 0.6, -108 + squat * 0.6], [-24, -22], [0, -4]];
  }
  const midN: Pt = [34, th.y + 38];
  const midF: Pt = [-6, th.y + 34];
  const midSw = noise2D(id + "mid", t2 * 0.7, 1) * 10;
  const midLegN = limb(midN, [40 + midSw, 50], [48, 50]);
  const midLegF = limb(midF, [30 - midSw, 56], [44, 46]);
  const shN: Pt = [44, th.y - 44];
  const shF: Pt = [-22, th.y - 48];
  const defArmN: [number, number] = flying ? [70, 40] : [16, 46];
  const defArmF: [number, number] = flying ? [56, 50] : [6, 40];
  const aN = limb(shN, armF ?? defArmN, [82, 74]);
  const aF = limb(shF, armB ?? defArmF, [76, 68]);

  const arm = (pts: Pt[], col: string, key: string) => {
    const end = pts[2];
    const prev = pts[1];
    const a = Math.atan2(end[0] - prev[0], end[1] - prev[1]);
    const c1: Pt = [end[0] + Math.sin(a + 0.5) * 16, end[1] + Math.cos(a + 0.5) * 16];
    const c2: Pt = [end[0] + Math.sin(a - 0.4) * 18, end[1] + Math.cos(a - 0.4) * 18];
    return (
      <g key={key}>
        <DLine d={`M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`} w={18} color={col} ow={4} />
        <DLine d={`M${pts[1][0]},${pts[1][1]} L${end[0]},${end[1]}`} w={9} color={col} ow={3.5} />
        <path d={`M${end[0]},${end[1]} L${c1[0]},${c1[1]} M${end[0]},${end[1]} L${c2[0]},${c2[1]}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />
        {/* fuzzy cuff at the elbow */}
        <circle cx={pts[1][0]} cy={pts[1][1]} r={9} fill={col} stroke={INK} strokeWidth={3} />
      </g>
    );
  };

  /* ---------------- antennae ---------------- */
  const sway = noise2D(id + "ant", t2 * 0.6, 0) * 6;
  const twitchA = !isT ? (rnd(`${id}at${f2}`) - 0.5) * 5 + twitchK * 12 : 0;
  const talkBounce = talking ? Math.sin(t2 * 11) * open * 5 : 0;
  const pk = perkK * 22;
  const pk01 = clamp((perkK + 1) / 2);
  const antN = antenna([36, -64], 34 + pk + sway + twitchA + talkBounce, st.antLen, lerp(86, 40, pk01), 36, scars.bentAntenna ? 64 : 0, id + "aN", scars.bentAntenna);
  const antF = antenna([-18, -60], -22 + pk * 0.8 + sway * 0.8 - twitchA + talkBounce * 0.8, st.antLen * 0.94, lerp(78, 36, pk01), 32, 0, id + "aF");

  /* ---------------- face ---------------- */
  const furTone = st.fur;
  const lidCol = mixHex(st.fur, st.furDk, 0.35);
  const faceCol = st.face;
  const eyeN = { cx: 38, cy: -14 };
  const eyeF = { cx: -24, cy: -18 };
  const R = st.head.r;
  const browY = (cy: number, ry: number) => cy - ry - 8 - ex.brow * 7;
  const proLen = proboscis;
  const s = flip ? -scale : scale;
  const dustN = dust ?? (isT ? 5 : 2);
  const dustCount = Math.round(dustN + flap * 10);

  // body transform for flight/lying rotation around the thorax centre
  const pivot: Pt = [th.x, th.y];
  const bodyR = lying ? -96 : bodyRot;
  const liftY = lying ? -th.y - 60 : 0;

  return (
    <g transform={`translate(${x + shiver} ${y}) scale(${s} ${scale})`}>
      {pose === "stand" ? <Shadow cx={0} cy={4} rx={130} o={0.38} /> : null}
      <g style={shade > 0 ? { filter: `brightness(${1 - shade * 0.78}) saturate(${1 - shade * 0.5})` } : undefined}>
        <g transform={`translate(0 ${liftY}) rotate(${-bodyR} ${pivot[0]} ${pivot[1]})`}>
          {/* far wing + far legs behind everything */}
          {drawWing(geo.wingFar, wFar, farA, true, false, "wf")}
          {insectLeg(hindF, "hF", legDk)}
          <g>{arm(aF, legDk, "aF")}</g>
          {midLegF ? <DLine d={smoothPath(midLegF, false)} w={7} color={legDk} ow={3} /> : null}
          {/* abdomen (fat fuzzy sack) */}
          <g transform={`translate(0 ${squat * 0.6})`}>
            <path d={geo.abd} fill={st.abd} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            {[0.2, 0.38, 0.56, 0.74].map((k, i) => (
              <path key={i} d={`M${-82 + k * 18},${-190 + k * 150} Q${-50},${-178 + k * 150 + 14} ${-22 + k * 4},${-196 + k * 150}`} stroke={st.abdRing} strokeWidth={6} fill="none" opacity={0.85} />
            ))}
          </g>
          {/* near wing (drapes over the abdomen like a cloak when folded) */}
          {drawWing(geo.wingNear, wNear, nearA, false, scars.torn, "wn")}
          {/* near hind leg (or the match) */}
          {scars.peg === "match" && !flying ? (
            <g>
              <DLine d={`M${hipN[0]},${hipN[1]} L${hindN[1][0]},${hindN[1][1]}`} w={15} color={legCol} ow={4} />
              <path d={`M${hindN[1][0] - 6},${hindN[1][1] - 6} L${hindN[1][0] + 6},${hindN[1][1] + 4} L${hindN[1][0] - 4},${hindN[1][1] + 10}`} stroke="#d9cfa8" strokeWidth={7} fill="none" />
              <path d={`M${hindN[1][0]},${hindN[1][1]} L${hindN[1][0] - 8},-18`} stroke={INK} strokeWidth={20} strokeLinecap="butt" />
              <path d={`M${hindN[1][0]},${hindN[1][1]} L${hindN[1][0] - 8},-18`} stroke="#e6c98e" strokeWidth={12} strokeLinecap="butt" />
              <path d={`M${hindN[1][0] - 3},${hindN[1][1] + 10} L${hindN[1][0] - 9},-22`} stroke="#c4a46a" strokeWidth={3} />
              <path d={`M${hindN[1][0] - 8 - 15},-24 Q${hindN[1][0] - 8},-40 ${hindN[1][0] - 8 + 15},-24 Q${hindN[1][0] - 8 + 18},2 ${hindN[1][0] - 8},4 Q${hindN[1][0] - 8 - 18},2 ${hindN[1][0] - 8 - 15},-24 Z`} fill="#1c1412" stroke={INK} strokeWidth={3.5} />
              <path d={`M${hindN[1][0] - 20},-26 Q${hindN[1][0] - 8},-36 ${hindN[1][0] + 4},-26`} stroke="#8a2a20" strokeWidth={5} fill="none" />
              <ellipse cx={hindN[1][0] - 13} cy={-14} rx={4} ry={5} fill="#5a4a40" />
              {[0, 1].map((i) => {
                const ph = (t * 0.45 + i * 0.5) % 1;
                return <path key={i} d={`M${hindN[1][0] - 8 + i * 6},${-30 - ph * 70} q-8,-10 0,-20 q8,-10 0,-20`} stroke="#9a948a" strokeWidth={4} fill="none" opacity={0.5 * (1 - ph)} strokeLinecap="round" />;
              })}
            </g>
          ) : scars.peg === "stump" && !flying ? (
            <g>
              <DLine d={`M${hipN[0]},${hipN[1]} L${hipN[0] + 14},${hipN[1] + 44}`} w={15} color={legCol} ow={4} />
              <circle cx={hipN[0] + 15} cy={hipN[1] + 47} r={7} fill="#7a3a34" stroke={INK} strokeWidth={3} />
            </g>
          ) : (
            insectLeg(hindN, "hN", legCol)
          )}
          {/* thorax + collar */}
          <g transform={`translate(${th.x} ${th.y})`}>
            <path d={geo.thorax} fill={furTone} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
            <path d={`M${-th.rx * 0.5},${th.ry * 0.1} q${th.rx * 0.2},${th.ry * 0.3} ${th.rx * 0.6},${th.ry * 0.42}`} stroke={st.furDk} strokeWidth={4} fill="none" opacity={0.6} />
            <path d={`M${-th.rx * 0.2},${-th.ry * 0.2} q${th.rx * 0.2},${th.ry * 0.2} ${th.rx * 0.5},${th.ry * 0.2}`} stroke={st.furDk} strokeWidth={4} fill="none" opacity={0.5} />
          </g>
          {/* middle legs */}
          {scars.stumpMid ? (
            <g>
              <DLine d={`M${midN[0]},${midN[1]} L${midN[0] + 22},${midN[1] + 20}`} w={8} color={legCol} ow={3} />
              <path d={`M${midN[0] + 14},${midN[1] + 8} l10,8 M${midN[0] + 18},${midN[1] + 4} l10,8`} stroke="#e8e0cc" strokeWidth={5} />
              <circle cx={midN[0] + 26} cy={midN[1] + 24} r={5} fill="#7a3a34" stroke={INK} strokeWidth={2.5} />
            </g>
          ) : (
            <DLine d={smoothPath(midLegN, false)} w={7} color={legCol} ow={3} />
          )}
          <g transform={`translate(${co.x} ${co.y})`}>
            <path d={geo.collar} fill={st.collar} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          </g>
          {/* head */}
          {headless ? null : (
          <g transform={`translate(${hd.x} ${hd.y}) rotate(${tilt})`}>
            {/* antennae (behind the head) */}
            {[antF, antN].map((a, i) => (
              <g key={i}>
                <path d={a.outline} fill={i ? st.ant : mixHex(st.ant, "#000000", 0.2)} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
                <path d={a.barbs} stroke={st.antDk} strokeWidth={2} opacity={0.7} />
                <path d={a.shaft} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
                <path d={a.shaft} stroke={st.antDk} strokeWidth={2.5} fill="none" strokeLinecap="round" />
              </g>
            ))}
            <path d={geo.head} fill={furTone} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
            {scars.bald ? (
              <g>
                <path d={blobHole(-22, -48, 26, id + "bald")} fill="#b9a097" stroke={INK} strokeWidth={3} />
                <path d="M-28,-66 q-4,-16 4,-26 M-16,-68 q2,-16 12,-18 M-38,-56 q-12,-8 -10,-22" stroke={INK} strokeWidth={2.2} fill="none" />
              </g>
            ) : null}
            {/* pale face mask + cheeks */}
            <g transform={`translate(${R * 0.4} ${R * 0.52})`}>
              <path d={geo.cheek} fill={faceCol} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            </g>
            <g transform={`translate(${R * 0.44} ${R * 0.98})`}>
              <path d={geo.chin} fill={st.collar} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
            </g>
            {/* eyes */}
            {ex.squeeze ? (
              <g stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none">
                <path d={`M${eyeF.cx - 16},${eyeF.cy - 12} L${eyeF.cx + 8},${eyeF.cy} L${eyeF.cx - 16},${eyeF.cy + 12}`} />
                <path d={`M${eyeN.cx + 20},${eyeN.cy - 14} L${eyeN.cx - 8},${eyeN.cy} L${eyeN.cx + 20},${eyeN.cy + 14}`} />
              </g>
            ) : (
              <>
                <CEye id={`${id}-eF`} cx={eyeF.cx} cy={eyeF.cy} rx={st.eye.rxF} ry={st.eye.ryF} look={gaze} pupil={ex.pupil} lidTop={Math.max(ex.lidTop, blink)} lidBottom={ex.lidBottom} lidAngle={-ex.lidAngle} lidColor={lidCol} glint={glint} />
                <CEye
                  id={`${id}-eN`}
                  cx={eyeN.cx}
                  cy={eyeN.cy}
                  rx={st.eye.rxN}
                  ry={st.eye.ryN}
                  look={gaze}
                  pupil={ex.pupil}
                  lidTop={Math.max(ex.lidTop * (scars.cloudy ? 1.15 : 1), blink)}
                  lidBottom={ex.lidBottom}
                  lidAngle={ex.lidAngle}
                  lidColor={lidCol}
                  cloudy={scars.cloudy}
                  glint={glint}
                />
              </>
            )}
            {/* scar + stitches across the cloudy eye */}
            {scars.cloudy ? (
              <g>
                <path d={`M${eyeN.cx - st.eye.rxN * 0.5},${eyeN.cy - st.eye.ryN * 1.3} L${eyeN.cx + st.eye.rxN * 0.6},${eyeN.cy + st.eye.ryN * 1.05}`} stroke="#c97b80" strokeWidth={7} strokeLinecap="round" />
                {[-0.6, -0.2, 0.2, 0.6].map((k) => {
                  const sx = eyeN.cx + st.eye.rxN * 0.05 + k * st.eye.rxN * 0.55;
                  const sy = eyeN.cy - st.eye.ryN * 0.12 + k * st.eye.ryN * 1.18;
                  return <path key={k} d={`M${sx - 8},${sy + 3} L${sx + 8},${sy - 3}`} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />;
                })}
              </g>
            ) : null}
            {/* brows: fuzzy tufts */}
            {[
              [eyeF.cx, eyeF.cy, st.eye.rxF, st.eye.ryF, -1],
              [eyeN.cx, eyeN.cy, st.eye.rxN, st.eye.ryN, 1],
            ].map(([cx, cy, rx, ry, side], i) => {
              const by = browY(cy, ry);
              const inner = side > 0 ? cx - rx * 0.42 : cx + rx * 0.42;
              const outer = side > 0 ? cx + rx * 0.62 : cx - rx * 0.62;
              const mid = (inner + outer) / 2;
              const dyB = Math.tan((ex.browTilt * Math.PI) / 180) * rx * 0.5;
              return (
                <g key={i}>
                  <path d={`M${inner},${by + dyB} Q${mid},${by - 10} ${outer},${by - dyB}`} stroke={INK} strokeWidth={17} fill="none" strokeLinecap="round" />
                  <path d={`M${inner},${by + dyB} Q${mid},${by - 10} ${outer},${by - dyB}`} stroke={st.furDk} strokeWidth={10} fill="none" strokeLinecap="round" />
                </g>
              );
            })}
            {/* bags under the elder's eyes */}
            {isT ? <path d={`M${eyeF.cx - 20},${eyeF.cy + st.eye.ryF + 6} q18,10 34,0 M${eyeN.cx - 26},${eyeN.cy + st.eye.ryN + 6} q26,12 50,0`} stroke="#6e6070" strokeWidth={4} fill="none" opacity={0.75} strokeLinecap="round" /> : null}
            {/* tears */}
            {tears > 0
              ? [0, 1].map((i) => {
                  const ph = (t * 0.9 + i * 0.5) % 1;
                  return <ellipse key={i} cx={i ? eyeN.cx + 14 : eyeF.cx - 6} cy={eyeN.cy + st.eye.ryN * 0.8 + ph * 70} rx={6} ry={9} fill="#bfe3f2" stroke={INK} strokeWidth={2.5} opacity={tears * (1 - ph)} />;
                })
              : null}
            {spent > 0
              ? [0, 1, 2].map((i) => {
                  const ph = (t * 1.1 + i * 0.33) % 1;
                  return <ellipse key={i} cx={-40 + i * 36} cy={-40 + ph * 80} rx={4} ry={6} fill="#cfd8de" stroke={INK} strokeWidth={2} opacity={spent * (1 - ph)} />;
                })
              : null}
            {/* proboscis (coiled; uncoils toward the light) */}
            {proLen > 0.02 ? <path d={proboscisPath(proLen, t2, id, [R * 0.56, R * 0.84])} stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" /> : null}
            {proLen > 0.02 ? <path d={proboscisPath(proLen, t2, id, [R * 0.56, R * 0.84])} stroke="#c9906a" strokeWidth={5} fill="none" strokeLinecap="round" /> : null}
            {/* mouth + palps */}
            <g transform={`translate(${R * 0.5} ${R * 0.72}) rotate(-4)`}>
              <Mouth
                id={`${id}-m`}
                seed={`${id}m`}
                x={0}
                y={0}
                w={isT ? 48 : 44}
                maxOpen={isT ? 36 : 34}
                shape={spent > 0.4 ? (Math.floor(t * 5) % 2 ? "D" : "C") : ex.squeeze || mute ? (open > 0.6 ? "D" : open > 0.2 ? "C" : "X") : mouth}
                smile={ex.smile}
                teeth="crooked"
                toothColor={isT ? "#d9cc9c" : "#f1e8c8"}
                lip={st.lip}
                inside="#2a0e0c"
                tongue="#c46a6a"
                sw={4}
                scream={expr === "wail" ? 1.4 : 1}
              />
            </g>
          </g>
          )}
          {/* front legs (arms) */}
          {arm(aN, legCol, "aN")}
          {/* dust shed from the wings */}
          {dustCount > 0 ? <MothDust t={t} n={dustCount} seed={id} col={mixHex(st.wing, "#ffffff", 0.35)} cx={-60} cy={th.y - 40} w={150} h={140} /> : null}
        </g>
      </g>
    </g>
  );
};

function proboscisPath(k: number, t2: number, seed: string, base: Pt): string {
  // from the mouth: a watch-spring coil that unrolls forward and up as k -> 1
  const pts: Pt[] = [base];
  const turns = lerp(2.2, 0.15, k);
  const n = 26;
  const len = lerp(40, 170, k);
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const ang = -0.4 + u * turns * Math.PI * 2 * (1 - k * 0.9) - k * 0.9;
    const r = len * u * (1 - (1 - k) * 0.85 * u);
    const wob = Math.sin(t2 * 9 + u * 6 + rnd(seed) * 3) * 3 * k;
    pts.push([base[0] + Math.cos(ang) * r * (0.6 + k * 0.5) + u * k * 40, base[1] + Math.sin(ang) * r * 0.6 - u * k * 30 + wob]);
  }
  return smoothPath(pts, false, 0.9);
}

function blobHole(cx: number, cy: number, r: number, seed: string): string {
  const pts: Pt[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const rr = r * (0.75 + rnd(`${seed}${i}`) * 0.5);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L")} Z`;
}

/** Dust motes drifting down off the wings. */
export const MothDust: React.FC<{ t: number; n: number; seed: string; col: string; cx: number; cy: number; w: number; h: number; fall?: number }> = ({ t, n, seed, col, cx, cy, w, h, fall = 120 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const period = 1.6 + rnd(`${seed}dp${i}`) * 1.6;
      const ph = (t / period + rnd(`${seed}do${i}`)) % 1;
      const cyc = Math.floor(t / period + rnd(`${seed}do${i}`));
      const sx = cx + (rnd(`${seed}dx${i}${cyc}`) - 0.5) * w;
      const sy = cy + (rnd(`${seed}dy${i}${cyc}`) - 0.5) * h;
      const dx = Math.sin(ph * 5 + i) * 10 - ph * 20;
      return <circle key={i} cx={sx + dx} cy={sy + ph * fall} r={1.8 + (i % 3) * 0.9} fill={col} opacity={(1 - ph) * 0.85} />;
    })}
  </g>
);

/** Linear blend between two #rrggbb colours. */
export function mixHex(a: string, b: string, k: number): string {
  const kk = Math.min(1, Math.max(0, k));
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * kk).toString(16).padStart(2, "0")).join("")}`;
}

export { rot as rotPt };
