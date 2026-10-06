import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { DLine, Flies, INK, Mouth, Shadow, blinkAmount, saccade, taperPath } from "../../../characters/parts";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, blob, onN, rnd, smoothPath } from "../../../engine/util";

/**
 * WENDELL — an earnest bespectacled frog.
 * THEN (2016): bright green, round tortoiseshell glasses over bulging eyes, braces, an oxford shirt, a mustard-and-teal
 * argyle sweater vest, a red bow tie, khakis, webbed bare feet; a vocal sac that swells when he gets going.
 * NOW: the same frog after months underground — grey-olive dried-out skin, grime, hollow bloodshot eyes with pinprick
 * pupils, one lens cracked, a matted moss beard, mushrooms sprouting from his scalp, a bandage, the vest in rags.
 * Faces right by default. Origin = floor between the feet (stand/float), the seat (sit), the floor under him (crouch:
 * sitting cross-legged).
 */

export type FrogPose = "stand" | "sit" | "crouch" | "float";
export type FrogExpr =
  | "earnest"
  | "smug"
  | "proud"
  | "lecture"
  | "disgust"
  | "serene"
  | "wink"
  | "shock"
  | "haunted"
  | "terror"
  | "whisper"
  | "frantic"
  | "numb"
  | "weep";

export interface FrogProps {
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
  expr?: FrogExpr;
  look?: Pt;
  headTilt?: number;
  /** the wrecked "now" version */
  now?: boolean;
  pose?: FrogPose;
  /** upper-body lean in degrees around the hips (+ = toward facing direction) */
  lean?: number;
  /** IK hand targets in BODY coords (relative to origin, before scale); default per pose/prop */
  handF?: Pt;
  handB?: Pt;
  hold?: "none" | "sign" | "mug" | "constitution" | "journal";
  /** 0..1 mug up to the mouth */
  sip?: number;
  /** 0..1 frantic scribbling in the journal */
  writing?: number;
  /** body-coords point the leash in the front hand runs to */
  leashTo?: Pt;
  /** 0..1 shaking with fear */
  tremble?: number;
  /** 0..1 torchlight glint in the eyes */
  glow?: number;
  /** 0..1 sweat drops */
  sweat?: number;
  /** 0..1 a halo of light (ascending) */
  halo?: number;
  /** text on the held sign */
  signLines?: [string, string];
}

/* ------------------------------------------------------------------ */
/* Palettes                                                            */
/* ------------------------------------------------------------------ */

const THEN = {
  skin: "#7ab648",
  skinDk: "#4e8a30",
  belly: "#e1e8a6",
  spot: "#5a9a36",
  sclera: "#f7f2da",
  iris: "#e3aa28",
  shirt: "#cfe1f2",
  shirtDk: "#a5bcd4",
  vest: "#e0b13c",
  vestB: "#2e8c86",
  vestLine: "#7a3a28",
  tie: "#cc3329",
  pants: "#c8b07c",
  pantsDk: "#a28a58",
  frame: "#5a3418",
  lip: "#3d6e26",
};
const NOW = {
  skin: "#6f7a50",
  skinDk: "#475034",
  belly: "#a6a682",
  spot: "#535c38",
  sclera: "#f2e6b2",
  iris: "#8a6a2a",
  shirt: "#9c9d92",
  shirtDk: "#77786c",
  vest: "#8c7838",
  vestB: "#3c5a56",
  vestLine: "#4a2a1e",
  tie: "#6c2a22",
  pants: "#857452",
  pantsDk: "#65573c",
  frame: "#3a2412",
  lip: "#353c26",
};

interface ExprSpec {
  lidTop: number;
  lidBottom: number;
  lidAngle: number;
  pupil: number;
  smile: number;
  brow: number;
  browTilt: number;
  closed?: "both" | "near";
  scream?: number;
}

const EXPR: Record<FrogExpr, ExprSpec> = {
  earnest: { lidTop: 0.06, lidBottom: 0.04, lidAngle: 0, pupil: 1, smile: 0.4, brow: 0.8, browTilt: -6 },
  smug: { lidTop: 0.46, lidBottom: 0.16, lidAngle: 8, pupil: 0.9, smile: 0.85, brow: 0.1, browTilt: 14 },
  proud: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 1, smile: 1.0, brow: 1.1, browTilt: -8, closed: "both" },
  lecture: { lidTop: 0.24, lidBottom: 0.1, lidAngle: -6, pupil: 0.9, smile: 0.25, brow: 1.2, browTilt: -12 },
  disgust: { lidTop: 0.42, lidBottom: 0.3, lidAngle: 16, pupil: 0.8, smile: -0.65, brow: -0.6, browTilt: 18 },
  serene: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 1, smile: 0.6, brow: 1.0, browTilt: -6, closed: "both" },
  wink: { lidTop: 0.06, lidBottom: 0.04, lidAngle: 0, pupil: 1, smile: 0.95, brow: 0.9, browTilt: -4, closed: "near" },
  shock: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.45, smile: -0.4, brow: 1.7, browTilt: -6, scream: 1.15 },
  haunted: { lidTop: 0.04, lidBottom: 0.12, lidAngle: -4, pupil: 0.35, smile: -0.5, brow: 1.2, browTilt: -18 },
  terror: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.22, smile: -0.85, brow: 1.9, browTilt: -24, scream: 1.25 },
  whisper: { lidTop: 0.3, lidBottom: 0.2, lidAngle: 8, pupil: 0.35, smile: -0.35, brow: 0.4, browTilt: -10 },
  frantic: { lidTop: 0.06, lidBottom: 0.06, lidAngle: 0, pupil: 0.3, smile: -0.45, brow: 1.4, browTilt: -20 },
  numb: { lidTop: 0.56, lidBottom: 0.26, lidAngle: 0, pupil: 0.35, smile: -0.2, brow: 0.2, browTilt: 0 },
  weep: { lidTop: 0.34, lidBottom: 0.22, lidAngle: -16, pupil: 0.4, smile: -0.75, brow: 1.4, browTilt: -26 },
};

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/** hip position per pose (body coords); the upper body is drawn relative to the hips and rotated by `lean` */
const HIP: Record<FrogPose, Pt> = { stand: [0, -132], sit: [0, 0], crouch: [0, -48], float: [0, -132] };
/** head centre relative to the hips (the head is drawn at HEAD_SCALE) */
const HEAD_REL: Pt = [18, -236];
const HEAD_SCALE = 1.22;
const SH_F: Pt = [46, -140];
const SH_B: Pt = [-48, -140];
const UPPER = 80;
const FORE = 76;

const rot = (p: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180;
  return [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)];
};

/** Head centre in body coords for a pose/lean (for cameras and 9:16 framing). */
export function frogHead(pose: FrogPose = "stand", lean = 0): Pt {
  const h = rot(HEAD_REL, lean);
  return [HIP[pose][0] + h[0], HIP[pose][1] + h[1]];
}
const DEFAULT_LEAN: Record<FrogPose, number> = { stand: 0, sit: 0, crouch: 8, float: 0 };
export const FROG_HEAD: Record<FrogPose, Pt> = {
  stand: frogHead("stand"),
  sit: frogHead("sit"),
  crouch: frogHead("crouch", DEFAULT_LEAN.crouch),
  float: frogHead("float"),
};

/** 2-bone IK: elbow + (clamped) hand for a shoulder, target and bend side. */
function ik(sh: Pt, target: Pt, bend: number): [Pt, Pt] {
  const dx = target[0] - sh[0];
  const dy = target[1] - sh[1];
  const d = Math.max(Math.abs(UPPER - FORE) + 1, Math.min(UPPER + FORE - 1, Math.hypot(dx, dy)));
  const a = Math.atan2(dy, dx);
  const cosA = (UPPER * UPPER + d * d - FORE * FORE) / (2 * UPPER * d);
  const b = a + bend * Math.acos(Math.max(-1, Math.min(1, cosA)));
  const elbow: Pt = [sh[0] + Math.cos(b) * UPPER, sh[1] + Math.sin(b) * UPPER];
  const hand: Pt = [sh[0] + Math.cos(a) * d, sh[1] + Math.sin(a) * d];
  return [elbow, hand];
}

const SIGN_C: Pt = [36, -90];
const SIGN_W = 270;
const SIGN_H = 150;

/** default hand targets in UPPER-BODY coords (relative to the hips, before lean) */
function defaultHands(pose: FrogPose, hold: FrogProps["hold"], sip: number): [Pt, Pt] {
  if (hold === "sign") return [[SIGN_C[0] + SIGN_W / 2 - 4, SIGN_C[1] - 6], [SIGN_C[0] - SIGN_W / 2 + 4, SIGN_C[1] - 6]];
  if (hold === "journal") return [[84, -36], [-30, -34]];
  if (pose === "float") return [[150, -150], [-150, -150]];
  if (hold === "mug") return sip > 0 ? [[lerpN(80, 66, sip), lerpN(-40, -190, sip)], [-40, 10]] : [[80, -40], [-40, 10]];
  if (hold === "constitution") return [[112, -96], [-40, 10]];
  if (pose === "sit") return [[96, -14], [-30, 20]];
  return [[84, 16], [-82, 18]];
}

/* ------------------------------------------------------------------ */
/* Frog eye: big round eyeball, gold iris; hollow + bloodshot "now"    */
/* ------------------------------------------------------------------ */

const FrogEye: React.FC<{
  id: string;
  cx: number;
  cy: number;
  r: number;
  look: Pt;
  pupil: number;
  lidTop: number;
  lidBottom: number;
  lidAngle: number;
  lidColor: string;
  now: boolean;
  happyClosed?: boolean;
  sclera: string;
  iris: string;
}> = ({ id, cx, cy, r, look, pupil, lidTop, lidBottom, lidAngle, lidColor, now, happyClosed, sclera, iris }) => {
  if (happyClosed) {
    return (
      <g transform={`translate(${cx} ${cy})`}>
        <circle r={r} fill={lidColor} />
        <path d={`M${-r * 0.78},${r * 0.12} Q0,${-r * 0.72} ${r * 0.78},${r * 0.12}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <circle r={r} fill="none" stroke={INK} strokeWidth={4.5} />
      </g>
    );
  }
  const clip = `${id}-clip`;
  const px = look[0] * r * 0.42;
  const py = look[1] * r * 0.36;
  const ir = now ? r * 0.36 : r * 0.62;
  const pr = now ? r * 0.12 * pupil * 2 : r * 0.36 * pupil;
  const topY = -r + Math.min(1, lidTop) * 2 * r;
  const tilt = Math.tan((lidAngle * Math.PI) / 180) * r;
  const sag = r * 0.42 * (1 - Math.min(1, lidTop));
  const lidPath = `M${-r * 1.4},${-r * 1.6} L${r * 1.4},${-r * 1.6} L${r * 1.4},${topY - tilt} Q0,${topY + sag} ${-r * 1.4},${topY + tilt} Z`;
  const lidEdge = `M${-r * 1.4},${topY + tilt} Q0,${topY + sag} ${r * 1.4},${topY - tilt}`;
  const botY = r - Math.min(1, lidBottom) * 2 * r;
  const bLid = `M${-r * 1.4},${r * 1.6} L${r * 1.4},${r * 1.6} L${r * 1.4},${botY} Q0,${botY - r * 0.35} ${-r * 1.4},${botY} Z`;
  const veins = now
    ? Array.from({ length: 6 }).map((_, i) => {
        const a = rnd(`${id}v${i}`) * Math.PI * 2;
        const pts: Pt[] = [];
        for (let s = 0; s <= 4; s++) {
          const rr = 1 - (s / 4) * 0.5;
          const wob = (rnd(`${id}vw${i}${s}`) - 0.5) * 0.4;
          pts.push([Math.cos(a + wob) * r * rr, Math.sin(a + wob) * r * rr]);
        }
        return smoothPath(pts, false);
      })
    : [];
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <defs>
        <clipPath id={clip}>
          <circle r={r} />
        </clipPath>
      </defs>
      <circle r={r} fill={sclera} />
      <g clipPath={`url(#${clip})`}>
        <ellipse cx={0} cy={r * 0.5} rx={r * 1.1} ry={r * 0.55} fill="#000" opacity={0.07} />
        {veins.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#b3262a" strokeWidth={2} opacity={0.9} />
        ))}
        <circle cx={px} cy={py} r={ir} fill={iris} stroke={now ? "#5a4418" : "#b07818"} strokeWidth={now ? 2 : 3} />
        {!now ? <circle cx={px} cy={py} r={ir * 0.82} fill="none" stroke="#f2c85a" strokeWidth={2} opacity={0.6} /> : null}
        <ellipse cx={px} cy={py} rx={pr * (now ? 1 : 1.15)} ry={pr * (now ? 1 : 0.9)} fill="#120a08" />
        <circle cx={px - r * 0.2} cy={py - r * 0.22} r={r * (now ? 0.07 : 0.13)} fill="#fff" opacity={now ? 0.5 : 0.9} />
        {!now ? <circle cx={px + r * 0.18} cy={py + r * 0.16} r={r * 0.05} fill="#fff" opacity={0.7} /> : null}
        <path d={lidPath} fill={lidColor} />
        {lidBottom > 0.02 ? <path d={bLid} fill={lidColor} /> : null}
        {lidTop > 0.03 ? <path d={lidEdge} fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" /> : null}
      </g>
      <circle r={r} fill="none" stroke={INK} strokeWidth={4.5} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* The frog                                                            */
/* ------------------------------------------------------------------ */

export const Frog: React.FC<FrogProps> = ({
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
  expr,
  look,
  headTilt = 0,
  now = false,
  pose = "stand",
  lean,
  handF,
  handB,
  hold = "none",
  sip = 0,
  writing = 0,
  leashTo,
  tremble,
  glow = 0,
  sweat = 0,
  halo = 0,
  signLines = ["MY POLITICS", "IN 2016"],
}) => {
  const C = now ? NOW : THEN;
  const ex = expr ?? (now ? "haunted" : "earnest");
  const e = EXPR[ex];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const trem = tremble ?? (now ? 0.35 : 0);
  const jx = trem > 0 ? (rnd(`${id}jx${f2}`) - 0.5) * 2 * trem * 2.6 : 0;
  const jy = trem > 0 ? (rnd(`${id}jy${f2}`) - 0.5) * 2 * trem * 1.8 : 0;
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 6 + energy * 3 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.9 : 0.3), 2) * (talking ? 5 : 2) + jx * 0.4;
  const blink = e.closed ? 0 : blinkAmount(t, id, now ? 5.2 : 3.1);
  const dart = saccade(t, id, now ? 0.34 : 0.1, now ? 0.45 : 1.2);
  const gaze: Pt = [(look?.[0] ?? 0.45) + dart[0], (look?.[1] ?? 0.05) + dart[1]];
  const ln = lean ?? DEFAULT_LEAN[pose];
  const hip = HIP[pose];
  const sacIn = (talking ? 0.35 + energy * 0.9 + open * 0.3 : 0.1) * (now ? 0.45 : 1);
  const sign = hold === "sign";

  const geo = useMemo(() => {
    const head = smoothPath(
      [
        [-114, 8],
        [-106, -36],
        [-72, -60],
        [-10, -68],
        [58, -64],
        [106, -44],
        [132, -8],
        [128, 26],
        [98, 54],
        [40, 70],
        [-32, 68],
        [-90, 46],
      ],
      true,
      0.85,
    );
    const torso = smoothPath(
      [
        [-60, 0],
        [72, 0],
        [96, -56],
        [78, -122],
        [46, -152],
        [-20, -156],
        [-56, -136],
        [-70, -68],
      ],
      true,
      0.7,
    );
    const vest = smoothPath(
      [
        [-62, -6],
        [74, -6],
        [94, -56],
        [78, -118],
        [52, -146],
        [18, -92],
        [-16, -150],
        [-54, -132],
        [-68, -68],
      ],
      true,
      0.55,
    );
    const dia: Array<{ d: string; b: boolean }> = [];
    for (let r = -1; r < 5; r++) {
      for (let c = -2; c < 5; c++) {
        const cx = -40 + c * 44 + (r % 2 ? 22 : 0);
        const cy = -10 - r * 34;
        dia.push({ d: `M${cx},${cy - 17} L${cx + 22},${cy} L${cx},${cy + 17} L${cx - 22},${cy} Z`, b: (r + c) % 2 === 0 });
      }
    }
    const lines: string[] = [];
    for (let k = -6; k < 8; k++) {
      lines.push(`M${-120 + k * 44},20 L${60 + k * 44},-200`);
      lines.push(`M${-120 + k * 44},-200 L${60 + k * 44},20`);
    }
    const spots = Array.from({ length: 6 }).map((_, i) => blob(-74 + rnd(`${id}sp${i}`) * 110, -34 + rnd(`${id}spy${i}`) * 30, 6 + rnd(`${id}spr${i}`) * 7, 5 + rnd(`${id}spr2${i}`) * 5, 7, 0.25, `${id}spot${i}`));
    const grime = Array.from({ length: 7 }).map((_, i) => blob(-90 + rnd(`${id}g${i}`) * 200, -40 + rnd(`${id}gy${i}`) * 90, 10 + rnd(`${id}gr${i}`) * 14, 7 + rnd(`${id}gr2${i}`) * 9, 8, 0.35, `${id}grime${i}`));
    const beard = (() => {
      const pts: Pt[] = [];
      const n = 15;
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        const bx = -56 + k * 150;
        const len = 24 + Math.sin(k * Math.PI) * 38 + (rnd(`${id}bd${i}`) - 0.5) * 22;
        pts.push([bx, 50 + Math.sin(k * Math.PI) * 14]);
        pts.push([bx + 4, 50 + len]);
      }
      return smoothPath([[-60, 34], ...pts, [100, 34], [20, 40]], true, 0.4);
    })();
    // argyle as single paths (cheaper to rasterise than dozens of small ones)
    const diaD = dia
      .filter((dd) => dd.b)
      .map((dd) => dd.d)
      .join(" ");
    const linesD = lines.join(" ");
    const ribD = Array.from({ length: 18 }).map((_, i) => `M${-70 + i * 10},-22 l0,20`).join(" ");
    return { head, torso, vest, diaD, linesD, ribD, spots, grime, beard };
  }, [id]);

  /* ---------------- hands / arms (upper-body coords) ---------------- */
  const toUpper = (p: Pt): Pt => rot([p[0] - hip[0], p[1] - hip[1]], -ln);
  const [dF, dB] = defaultHands(pose, hold, sip);
  let tF: Pt = handF ? toUpper(handF) : dF;
  const tB: Pt = handB ? toUpper(handB) : dB;
  if (hold === "journal" && writing > 0) {
    const k = Math.floor(t * 12);
    tF = [tF[0] + (rnd(`${id}wx${k}`) - 0.5) * 26 * writing + Math.sin(t * 40) * 5 * writing, tF[1] + (rnd(`${id}wy${k}`) - 0.5) * 12 * writing];
  }
  // front elbow: out to the side when the hand is low, tucked under when the hand is raised (mug, booklet, sign)
  const [eF, hF] = ik(SH_F, tF, tF[1] > SH_F[1] + 60 ? -1 : 1);
  const [eB, hB] = ik(SH_B, tB, sign ? -1 : 1);

  const hand = (h: Pt, el: Pt, key: string, grip: boolean, far: boolean) => {
    const a = Math.atan2(h[1] - el[1], h[0] - el[0]);
    const col = far ? C.skinDk : C.skin;
    const fingers = [-0.62, -0.2, 0.2, 0.62].map((da, i) => {
      const r = a + da;
      const l = grip ? 18 : i === 1 || i === 2 ? 36 : 30;
      return [h[0] + Math.cos(r) * l, h[1] + Math.sin(r) * l] as Pt;
    });
    return (
      <g key={key}>
        {fingers.map((p, i) => (
          <g key={i}>
            <path d={`M${h[0]},${h[1]} L${p[0]},${p[1]}`} stroke={INK} strokeWidth={11} strokeLinecap="round" />
            <path d={`M${h[0]},${h[1]} L${p[0]},${p[1]}`} stroke={col} strokeWidth={5} strokeLinecap="round" />
            <circle cx={p[0]} cy={p[1]} r={4.6} fill={col} stroke={INK} strokeWidth={2.6} />
          </g>
        ))}
        <circle cx={h[0]} cy={h[1]} r={13} fill={col} stroke={INK} strokeWidth={4} />
      </g>
    );
  };

  const arm = (sh: Pt, el: Pt, h: Pt, far: boolean, key: string) => {
    const sleeve = far ? C.shirtDk : C.shirt;
    const cuff: Pt = [el[0] + (h[0] - el[0]) * 0.7, el[1] + (h[1] - el[1]) * 0.7];
    const cuff0: Pt = [el[0] + (h[0] - el[0]) * 0.56, el[1] + (h[1] - el[1]) * 0.56];
    return (
      <g key={key}>
        <DLine d={`M${cuff0[0]},${cuff0[1]} L${h[0]},${h[1]}`} w={15} color={far ? C.skinDk : C.skin} ow={4} />
        <path d={taperPath([sh, el, cuff0], 40, 32)} fill={sleeve} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={taperPath([cuff0, cuff], 36, 34)} fill={far ? "#8ea5bd" : C.shirtDk} stroke={INK} strokeWidth={4} />
        {now ? <path d={`M${el[0] - 10},${el[1] - 4} l10,8 l-4,8 l12,4`} stroke={INK} strokeWidth={3} fill="none" /> : null}
      </g>
    );
  };

  /* ---------------- legs (body coords) ---------------- */
  function foot(fx: number, fy: number, rotDeg: number, key: string, far: boolean, mirror = 1) {
    const col = far ? C.skinDk : C.skin;
    return (
      <g key={key} transform={`translate(${fx} ${fy}) rotate(${rotDeg}) scale(${mirror} 1)`}>
        <path d="M-16,-10 C-6,-22 26,-20 34,-4 L52,-6 L44,4 L56,10 L40,12 L46,20 L20,12 C4,14 -18,8 -16,-10 Z" fill={col} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {[
          [52, -6],
          [56, 10],
          [46, 20],
        ].map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r={5} fill={col} stroke={INK} strokeWidth={2.6} />
        ))}
        {now ? <path d="M0,-6 q8,6 18,2" stroke="#2c2618" strokeWidth={4} fill="none" opacity={0.6} /> : null}
      </g>
    );
  }

  const legsBack = () => {
    if (pose === "sit") {
      return (
        <g>
          {[-1, 1].map((sd) => (
            <path key={sd} d={taperPath([[sd * 26, -10], [110 + sd * 8, -8], [118 + sd * 6, 120]], 60, 48)} fill={sd < 0 ? C.pantsDk : C.pants} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          ))}
        </g>
      );
    }
    if (pose === "crouch") {
      // cross-legged: thighs out to both knees (behind the torso), shins crossed in front (legsFront)
      return (
        <g>
          <path d={taperPath([[-10, -52], [-70, -40], [-118, -28]], 66, 54)} fill={C.pantsDk} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={taperPath([[20, -52], [90, -40], [136, -28]], 66, 54)} fill={C.pants} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
      );
    }
    const dangle = pose === "float";
    const sw = dangle ? Math.sin(t * 1.6) * 6 : 0;
    return (
      <g>
        {[-1, 1].map((sd) => {
          const top: Pt = [sd * 30, -132];
          const knee: Pt = dangle ? [sd * 24 + sw * 0.5, -74] : [sd * 36, -72];
          const ank: Pt = dangle ? [sd * 20 + sw, -20] : [sd * 36, -24];
          return <path key={sd} d={taperPath([top, knee, ank], 64, 48)} fill={sd < 0 ? C.pantsDk : C.pants} stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
        })}
        {dangle ? (
          <>
            {foot(-20 + sw, -12, 72, "ff1", true)}
            {foot(20 + sw, -12, 72, "ff2", false)}
          </>
        ) : (
          <>
            {foot(-40, -8, 0, "fs1", true)}
            {foot(36, -8, 0, "fs2", false)}
          </>
        )}
      </g>
    );
  };

  const legsFront = () => {
    if (pose !== "crouch") return null;
    return (
      <g>
        <path d={taperPath([[-118, -30], [-20, -18], [60, -14]], 52, 44)} fill={C.pantsDk} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {foot(62, -14, -8, "fc1", true)}
        <path d={taperPath([[136, -30], [40, -12], [-40, -8]], 54, 44)} fill={C.pants} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        {foot(-44, -8, 8, "fc2", false, -1)}
        {now ? <path d="M86,-36 l12,-10 l6,12 l10,-8 M-90,-34 l10,-8 l6,10" stroke={INK} strokeWidth={3.5} fill="none" /> : null}
      </g>
    );
  };

  /* ---------------- head ---------------- */
  const headPos: Pt = [HEAD_REL[0] + jx * 0.5, HEAD_REL[1] + bob * 0.5 + jy];
  const mouthShape: MouthShape = sip > 0.5 ? "F" : mouth;
  const closedNear = e.closed === "near" || e.closed === "both";
  const closedFar = e.closed === "both";

  const eye = (cx: number, cy: number, r: number, near: boolean) => (
    <g>
      {now ? <circle cx={cx} cy={cy + 3} r={r + 6} fill="#3a2a3c" opacity={0.7} /> : null}
      <FrogEye
        id={`${id}-e${near ? "N" : "F"}`}
        cx={cx}
        cy={cy + 2}
        r={r * 0.82}
        look={gaze}
        pupil={e.pupil}
        lidTop={Math.max(e.lidTop, blink)}
        lidBottom={e.lidBottom}
        lidAngle={near ? e.lidAngle : -e.lidAngle}
        lidColor={C.skin}
        now={now}
        happyClosed={near ? closedNear : closedFar}
        sclera={C.sclera}
        iris={C.iris}
      />
    </g>
  );

  const s = flip ? -scale : scale;
  const ct = (cx: number) => (flip ? `translate(${2 * cx} 0) scale(-1 1)` : undefined);
  const headTr = `translate(${headPos[0]} ${headPos[1]}) rotate(${tilt}) scale(${HEAD_SCALE})`;

  const headG = (
    <g transform={headTr}>
      {/* vocal sac (behind the chin) */}
      <ellipse cx={14} cy={48 + sacIn * 16} rx={50 + sacIn * 22} ry={12 + sacIn * 24} fill={C.belly} stroke={INK} strokeWidth={4} />
      {sacIn > 0.4 && !now ? <path d={`M-18,${62 + sacIn * 12} q32,${10 + sacIn * 6} 64,0`} stroke="#c7cf8a" strokeWidth={3} fill="none" /> : null}
      {/* eye mounds */}
      <circle cx={-46} cy={-58} r={40} fill={C.skin} stroke={INK} strokeWidth={5} />
      <circle cx={48} cy={-62} r={46} fill={C.skin} stroke={INK} strokeWidth={5} />
      <path d={geo.head} fill={C.skin} stroke={INK} strokeWidth={5.5} />
      <ellipse cx={-46} cy={-40} rx={34} ry={20} fill={C.skin} />
      <ellipse cx={48} cy={-42} rx={40} ry={22} fill={C.skin} />
      <path d="M-4,-58 Q2,-48 8,-58" stroke={INK} strokeWidth={4} fill="none" />
      {/* pale lower jaw + spots */}
      <path d="M-96,36 C-40,60 60,64 112,40 C100,58 60,72 10,72 C-40,72 -80,58 -96,36 Z" fill={C.belly} opacity={0.75} />
      {geo.spots.map((d, i) => (
        <path key={i} d={d} fill={C.spot} opacity={0.75} />
      ))}
      {now ? (
        <g>
          {geo.grime.map((d, i) => (
            <path key={i} d={d} fill="#2c2618" opacity={0.3} />
          ))}
          <path d="M-80,-6 l12,6 l-4,10 l12,4 M70,-24 l10,8 l-6,8 M-30,22 l8,-8 l10,4 M104,12 l-10,6 l4,10" stroke="#353c24" strokeWidth={2.5} fill="none" />
          {/* bandage band across the scalp, under the eyes */}
          <path d="M-116,-6 C-96,-46 -40,-66 0,-64 C40,-64 80,-54 112,-30 L108,-12 C80,-38 40,-48 0,-48 C-40,-48 -90,-28 -112,12 Z" fill="#d6ccb2" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <path d={blob(-88, -14, 9, 7, 7, 0.3, `${id}blood`)} fill="#7a2a1e" opacity={0.85} />
          <path d="M-100,-20 l8,-10 M-60,-44 l6,-10 M60,-46 l6,-10" stroke="#a89c80" strokeWidth={2} />
        </g>
      ) : null}
      {/* eyes */}
      {eye(-46, -58, 40, false)}
      {eye(48, -62, 46, true)}
      {glow > 0 ? (
        <g style={{ mixBlendMode: "screen" }}>
          <circle cx={-46 + gaze[0] * 13} cy={-56 + gaze[1] * 11} r={4} fill="#ffe0a0" opacity={glow} />
          <circle cx={48 + gaze[0] * 15} cy={-60 + gaze[1] * 12} r={4.5} fill="#ffe0a0" opacity={glow} />
        </g>
      ) : null}
      {/* brows above the frames */}
      {[
        [-46, -58, 40, -1],
        [48, -62, 46, 1],
      ].map(([cx, cy, r, side], i) => {
        const by = cy - r - 16 - e.brow * 8;
        // negative browTilt = worried (inner ends up), positive = cross (inner ends down)
        const dy = -Math.tan((e.browTilt * Math.PI) / 180) * 20 * side;
        return <path key={i} d={`M${cx - 22},${by - dy} Q${cx},${by - 8} ${cx + 22},${by + dy}`} stroke={C.skinDk} strokeWidth={9} strokeLinecap="round" fill="none" />;
      })}
      {/* round tortoiseshell glasses (cracked + askew now) */}
      <g transform={now ? "rotate(-5 0 -60)" : undefined}>
        <path d="M-88,-62 L-118,-40" stroke={INK} strokeWidth={10} strokeLinecap="round" />
        <path d="M-88,-62 L-118,-40" stroke={C.frame} strokeWidth={5} strokeLinecap="round" />
        <circle cx={-46} cy={-58} r={42} fill="#d8eef8" fillOpacity={now ? 0.05 : 0.14} stroke={INK} strokeWidth={10} />
        <circle cx={-46} cy={-58} r={42} fill="none" stroke={C.frame} strokeWidth={5} />
        <circle cx={48} cy={-62} r={48} fill="#d8eef8" fillOpacity={now ? 0.05 : 0.14} stroke={INK} strokeWidth={10} />
        <circle cx={48} cy={-62} r={48} fill="none" stroke={C.frame} strokeWidth={5} />
        <path d="M-5,-62 Q-2,-74 0,-64" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d="M-5,-62 Q-2,-74 0,-64" stroke={C.frame} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        {!now ? (
          <g stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.75} fill="none">
            <path d="M-74,-82 q8,-9 18,-11" />
            <path d="M22,-90 q10,-11 22,-13" />
          </g>
        ) : (
          <g stroke="#f4f0e0" strokeWidth={2.4} fill="none" opacity={0.85}>
            <path d="M62,-50 L30,-96 M62,-50 L92,-84 M62,-50 L98,-40 M62,-50 L76,-14 M62,-50 L18,-40 M62,-50 L28,-20" />
            <path d="M48,-70 L74,-72 L84,-52 L70,-32 L44,-36 L40,-56 Z" />
            <path d="M38,-82 L86,-86 L94,-50 L80,-24 L34,-28 L28,-60" opacity={0.6} />
          </g>
        )}
      </g>
      {/* nostrils */}
      <ellipse cx={100} cy={-24} rx={4} ry={3} fill={INK} />
      <ellipse cx={117} cy={-17} rx={4} ry={3} fill={INK} />
      {/* moss beard hangs behind the jaw (now) */}
      {now ? (
        <g>
          <path d={geo.beard} fill="#3a5626" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          {Array.from({ length: 10 }).map((_, i) => (
            <path key={i} d={`M${-44 + i * 14},${58 + (i % 3) * 5} q${(rnd(`${id}bs${i}`) - 0.5) * 10},14 ${(rnd(`${id}bs2${i}`) - 0.5) * 8},${20 + (i % 4) * 7}`} stroke="#22341a" strokeWidth={3} fill="none" />
          ))}
        </g>
      ) : null}
      {/* mouth: very wide frog mouth; braces then, broken teeth now */}
      <g transform="rotate(-3 22 26)">
        <Mouth
          id={`${id}-mouth`}
          seed={`${id}m${now ? "n" : "t"}`}
          x={22}
          y={28}
          w={170}
          maxOpen={70}
          shape={mouthShape}
          smile={e.smile}
          teeth={now ? "crooked" : "flat"}
          toothColor={now ? "#d8c88a" : "#f6f2e2"}
          lip={C.lip}
          inside="#3a1014"
          tongue="#e07a88"
          scream={e.scream ?? 1}
        />
        {!now && open > 0.15 ? (
          <g>
            <path d={`M${22 - 58},${28 - open * 70 * 0.2 + 2} L${22 + 58},${28 - open * 70 * 0.2 + 2}`} stroke="#8d979f" strokeWidth={3.2} />
            {[-40, -14, 12, 38].map((bx) => (
              <rect key={bx} x={22 + bx - 3} y={28 - open * 70 * 0.2 - 1} width={6} height={6} fill="#c3ccd2" stroke={INK} strokeWidth={1.2} />
            ))}
          </g>
        ) : null}
      </g>
      {now ? (
        <g>
          {[
            [-100, -26, 1.0],
            [-86, -8, 0.7],
          ].map(([mx, my, ms], i) => (
            <g key={i} transform={`translate(${mx} ${my}) scale(${ms}) rotate(-28)`}>
              <path d="M-3,0 L-4,-20 L4,-20 L3,0 Z" fill="#e8dcc0" stroke={INK} strokeWidth={3} />
              <path d="M-22,-18 C-20,-38 20,-38 22,-18 Z" fill="#b8784a" stroke={INK} strokeWidth={3.5} />
              <circle cx={-8} cy={-26} r={3} fill="#f0e6c8" />
              <circle cx={6} cy={-29} r={2.4} fill="#f0e6c8" />
            </g>
          ))}
        </g>
      ) : null}
      {sweat > 0
        ? [0, 1].map((i) => {
            const ph = (t * 0.9 + i * 0.5) % 1;
            return <path key={i} d={`M${i ? 110 : -108},${-24 + ph * 60} q-5,8 0,13 q5,-5 0,-13`} fill="#bfe3f2" stroke={INK} strokeWidth={2} opacity={sweat * (1 - ph)} />;
          })
        : null}
      {ex === "weep"
        ? [0, 1].map((i) => {
            const ph = (t * 0.7 + i * 0.5) % 1;
            return <ellipse key={i} cx={i ? 60 : -40} cy={-24 + ph * 70} rx={4} ry={7} fill="#9fd0e6" stroke={INK} strokeWidth={2} opacity={1 - ph} />;
          })
        : null}
    </g>
  );

  const upper = (
    <g transform={`translate(${hip[0]} ${hip[1]}) rotate(${ln})`}>
      {/* back arm (behind the torso; in front when gripping the sign) */}
      {arm(SH_B, eB, hB, true, "aB")}
      {!sign && hold !== "journal" ? hand(hB, eB, "hB", false, true) : null}
      {/* torso: shirt, argyle vest, collar, bow tie */}
      <path d={geo.torso} fill={C.shirt} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <defs>
        <clipPath id={`${id}-vest`}>
          <path d={geo.vest} />
        </clipPath>
      </defs>
      <path d={geo.vest} fill={C.vest} />
      <g clipPath={`url(#${id}-vest)`}>
        <path d={geo.diaD} fill={C.vestB} />
        <path d={geo.linesD} stroke={C.vestLine} strokeWidth={2} opacity={0.7} strokeDasharray="6 5" fill="none" />
        <rect x={-80} y={-22} width={190} height={22} fill={C.vestB} opacity={0.85} />
        <path d={geo.ribD} stroke={INK} strokeWidth={1.5} opacity={0.4} fill="none" />
        {now ? (
          <g>
            <path d={blob(52, -64, 18, 12, 8, 0.4, `${id}hole1`)} fill={C.shirtDk} stroke={INK} strokeWidth={3} />
            <path d={blob(-34, -100, 14, 10, 8, 0.4, `${id}hole2`)} fill={C.shirtDk} stroke={INK} strokeWidth={3} />
            <path d="M-64,-6 l10,-16 l8,14 l12,-20 l6,18 l14,-14 l4,18 l12,-10 l6,14 l14,-18 l8,20 l10,-12 l6,10" fill={C.shirt} stroke={INK} strokeWidth={3} />
            <path d={blob(10, -40, 40, 22, 9, 0.3, `${id}vgrime`)} fill="#2e2a1c" opacity={0.35} />
          </g>
        ) : null}
      </g>
      <path d={geo.vest} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M18,-92 L18,-146" stroke={C.shirtDk} strokeWidth={3} />
      {!now && hold !== "constitution" ? (
        <g transform="translate(48 -106) rotate(8)">
          <rect x={-10} y={-26} width={22} height={30} rx={2} fill="#1f3a6e" stroke={INK} strokeWidth={2.5} />
          <path d="M-6,-20 l14,0 M-6,-15 l10,0" stroke="#e2c45a" strokeWidth={2} />
        </g>
      ) : null}
      <path d="M-8,-160 L10,-136 L20,-156 Z M20,-156 L32,-134 L50,-156 Z" fill={C.shirt} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {now ? (
        <g>
          <path d="M16,-146 C6,-124 -4,-106 0,-86" stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />
          <path d="M16,-146 C6,-124 -4,-106 0,-86" stroke={C.tie} strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d="M24,-146 C34,-126 32,-108 40,-92" stroke={INK} strokeWidth={12} fill="none" strokeLinecap="round" />
          <path d="M24,-146 C34,-126 32,-108 40,-92" stroke={C.tie} strokeWidth={7} fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <g transform="translate(20 -140)">
          <path d="M0,0 L-30,-16 L-34,14 Z M0,0 L30,-16 L34,14 Z" fill={C.tie} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M-22,-6 l-6,10 M22,-6 l6,10" stroke="#9a2018" strokeWidth={2.5} />
          <rect x={-8} y={-9} width={16} height={18} rx={4} fill={C.tie} stroke={INK} strokeWidth={4} />
        </g>
      )}
      {headG}
      {/* the sign (title card): arms behind it, hands wrap its edges */}
      {sign ? arm(SH_F, eF, hF, false, "aFs") : null}
      {sign ? (
        <g transform={`translate(${SIGN_C[0]} ${SIGN_C[1]}) rotate(-3)`}>
          <rect x={-SIGN_W / 2} y={-SIGN_H / 2} width={SIGN_W} height={SIGN_H} rx={6} fill="#f6efd8" stroke={INK} strokeWidth={6} />
          <path d={`M${-SIGN_W / 2},${SIGN_H / 2 - 14} L${SIGN_W / 2},${SIGN_H / 2 - 14} L${SIGN_W / 2},${SIGN_H / 2} L${-SIGN_W / 2},${SIGN_H / 2} Z`} fill="#e4d8b4" />
          <circle cx={104} cy={-46} r={15} fill="#f2c230" stroke={INK} strokeWidth={3} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <path key={i} d={`M${104 + Math.cos(a) * 20},${-46 + Math.sin(a) * 20} L${104 + Math.cos(a) * 27},${-46 + Math.sin(a) * 27}`} stroke="#e0a020" strokeWidth={3.5} strokeLinecap="round" />;
          })}
          <path d="M-112,-52 l6,-12 l6,12 l-14,-8 l16,0 Z M-110,42 l5,-10 l5,10 l-12,-7 l14,0 Z" fill="#cc3329" />
          <g transform={ct(0)}>
            <text x={-6} y={-12} textAnchor="middle" fontFamily="PatrickHand" fontSize={44} fill="#1f3a6e" transform="rotate(-2)">
              {signLines[0]}
            </text>
            <text x={0} y={42} textAnchor="middle" fontFamily="PatrickHand" fontSize={54} fill="#cc3329" transform="rotate(1)">
              {signLines[1]}
            </text>
          </g>
        </g>
      ) : null}
      {hold === "mug" ? (
        <g transform={`translate(${hF[0] + 8} ${hF[1] - 8}) rotate(${sip * -24})`}>
          {[0, 1].map((i) => {
            const ph = (t * 0.6 + i * 0.5) % 1;
            return <path key={i} d={`M${-6 + i * 12},${-44 - ph * 34} q-7,-9 0,-18 q7,-9 0,-18`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.55 * (1 - ph)} />;
          })}
          <path d="M26,-22 C46,-22 46,12 26,10" stroke={INK} strokeWidth={12} fill="none" />
          <path d="M26,-22 C46,-22 46,12 26,10" stroke="#fbfaf4" strokeWidth={6} fill="none" />
          <rect x={-28} y={-38} width={56} height={60} rx={6} fill="#fbfaf4" stroke={INK} strokeWidth={4} />
          <g transform={ct(0)}>
            <text x={0} y={-8} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={11.5} fill="#1f3a6e">
              LIBERTY
            </text>
          </g>
          <path d="M0,4 l4,8 l9,1 l-7,6 l2,9 l-8,-5 l-8,5 l2,-9 l-7,-6 l9,-1 Z" fill="#cc3329" transform="translate(0 -2) scale(0.8)" />
        </g>
      ) : null}
      {hold === "constitution" ? (
        <g transform={`translate(${hF[0] + 4} ${hF[1] - 40}) rotate(-6)`}>
          <rect x={-30} y={-42} width={60} height={84} rx={4} fill="#1f3a6e" stroke={INK} strokeWidth={4.5} />
          <rect x={-24} y={-36} width={48} height={72} rx={2} fill="none" stroke="#e2c45a" strokeWidth={2} />
          <g transform={ct(0)}>
            <text x={0} y={-12} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={8.5} fill="#e2c45a">
              POCKET
            </text>
            <text x={0} y={2} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={6.6} fill="#e2c45a">
              CONSTITUTION
            </text>
          </g>
          <path d="M0,14 l3,6 l7,1 l-5,4 l1,7 l-6,-4 l-6,4 l1,-7 l-5,-4 l7,-1 Z" fill="#e2c45a" />
        </g>
      ) : null}
      {/* the journal on his lap (in front of the torso, under the writing hand) */}
      {hold === "journal" ? (
        <g transform="translate(28 -38) rotate(-6) scale(0.9)">
          <path d="M-84,-52 L84,-58 L90,46 L-80,52 Z" fill="#5a3a24" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d="M-76,-46 L0,-50 L4,44 L-72,48 Z" fill="#e2d6b2" stroke={INK} strokeWidth={3} />
          <path d="M0,-50 L78,-52 L82,42 L4,44 Z" fill="#d8cba4" stroke={INK} strokeWidth={3} />
          {Array.from({ length: 6 }).map((_, i) => (
            <path key={i} d={`M-66,${-34 + i * 13} q20,${(rnd(`${id}jl${i}`) - 0.5) * 6} 56,${(rnd(`${id}jl2${i}`) - 0.5) * 4}`} stroke="#3a2a20" strokeWidth={2.2} fill="none" />
          ))}
          {Array.from({ length: 1 + (Math.floor(t * 1.5) % 6) }).map((_, i) => (
            <path key={i} d={`M10,${-36 + i * 13} q22,${(rnd(`${id}jr${i}`) - 0.5) * 8} 58,${(rnd(`${id}jr2${i}`) - 0.5) * 6}`} stroke="#2a1a14" strokeWidth={2.4} fill="none" />
          ))}
          <path d={blob(48, 30, 8, 6, 7, 0.3, `${id}inkblot`)} fill="#1a1010" />
        </g>
      ) : null}
      {sign || hold === "journal" ? hand(hB, eB, "hB2", true, true) : null}
      {/* front arm */}
      {!sign ? arm(SH_F, eF, hF, false, "aF") : null}
      {hand(hF, eF, "hF", hold !== "none" || !!leashTo, false)}
      {hold === "journal" ? (
        <g transform={`translate(${hF[0] + 6} ${hF[1] + 4}) rotate(${-34 + Math.sin(t * 40) * 6 * writing})`}>
          <path d="M-4,-44 L4,-44 L4,6 L0,16 L-4,6 Z" fill="#d9a83a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M-4,6 L0,16 L4,6 Z" fill="#e8d6b0" />
        </g>
      ) : null}
    </g>
  );

  const leash = leashTo
    ? (() => {
        const hw = rot(hF, ln);
        const h: Pt = [hw[0] + hip[0], hw[1] + hip[1]];
        const mid: Pt = [(h[0] + leashTo[0]) / 2, Math.max(h[1], leashTo[1]) + 30];
        return (
          <g>
            <path d={`M${h[0]},${h[1]} Q${mid[0]},${mid[1]} ${leashTo[0]},${leashTo[1]}`} stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
            <path d={`M${h[0]},${h[1]} Q${mid[0]},${mid[1]} ${leashTo[0]},${leashTo[1]}`} stroke="#cc3329" strokeWidth={5} fill="none" strokeLinecap="round" />
          </g>
        );
      })()
    : null;

  const hd = frogHead(pose, ln);
  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      {halo > 0 ? (
        <g opacity={halo}>
          <circle cx={hd[0]} cy={hd[1] + 60} r={330} fill="#fff6c0" opacity={0.22} />
          <ellipse cx={hd[0]} cy={hd[1] - 150} rx={90} ry={21} fill="none" stroke="#ffe46a" strokeWidth={11} />
          <ellipse cx={hd[0]} cy={hd[1] - 150} rx={90} ry={21} fill="none" stroke="#fffbe0" strokeWidth={3} />
        </g>
      ) : null}
      {pose !== "float" ? <Shadow cx={pose === "crouch" ? 10 : 0} cy={4} rx={pose === "crouch" ? 170 : 110} o={0.35} /> : null}
      {legsBack()}
      {upper}
      {legsFront()}
      {leash}
      {now ? <Flies cx={hd[0] - 40} cy={hd[1] - 60} count={2} t={t} r={150} seed={id + "fly"} size={0.9} /> : null}
    </g>
  );
};

const lerpN = (a: number, b: number, k: number) => a + (b - a) * k;
