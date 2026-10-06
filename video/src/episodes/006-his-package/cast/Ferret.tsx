import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { DLine, Eye, INK, Mouth, Shadow, blinkAmount, saccade, taperPath } from "../../../characters/parts";
import { mixHex } from "../../../characters/Possum";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, blob, limb, onN, rnd, smoothPath } from "../../../engine/util";
import { BabyOilBottle, PackageBox, PartyHat } from "./props";

/**
 * SKEETER — the twitchy ferret porch pirate.
 * A long cream-and-sable noodle in a stained teal hoodie (hood up, round ears poking through DIY holes),
 * saggy grey sweatpants and trashed sneakers. Dark bandit band across red-rimmed beady eyes, a nose that
 * never stops twitching, and a ferret tail that bottle-brushes when he's scared.
 * Faces right by default. Origin = floor between the feet.
 */

export type SkeeterExpr = "shifty" | "sneak" | "startled" | "scared" | "nervous" | "deadpan" | "realize" | "pleading" | "wince" | "innocent" | "gulp";
export type SkeeterHold = "none" | "boxUnder" | "boxBack" | "boxBoth" | "boxOpen" | "bottle" | "bottleOut" | "bottleHug";

export interface SkeeterProps {
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
  expr?: SkeeterExpr;
  look?: Pt;
  headTilt?: number;
  hold?: SkeeterHold;
  /** [shoulder, elbow] degrees (0 = hanging, + = forward); override the hold presets */
  armF?: [number, number];
  armB?: [number, number];
  /** front paw points a claw */
  point?: boolean;
  /** 0..1 tiptoe sneaking pose; `step` = walk phase in cycles */
  sneak?: number;
  step?: number;
  /** body lifted off the floor (px) */
  hop?: number;
  /** 0..1 bottle-brush tail */
  bristle?: number;
  /** 0..1 shaking */
  tremble?: number;
  /** 0..1 sweat drops */
  sweat?: number;
  /** cower: hunch down, ears flat */
  shrink?: number;
  /** upper-body lean, degrees (+ = forward) */
  lean?: number;
  /** box flaps 0..1 and glow (for boxOpen) */
  boxOpen?: number;
  boxGlow?: number;
  hat?: boolean;
  /** glitter specks all over (the morning after) */
  glitter?: number;
}

const FUR = "#eadfc4";
const FUR_SH = "#cdbd9b";
const SABLE = "#5b3d2b";
const SABLE_DK = "#3b271b";
const NOSE = "#e48795";
const MASK = "#7c5a40";
const HOOD = "#3f7c77";
const HOOD_DK = "#2b5a56";
const HOOD_LT = "#5e9b94";
const PANTS = "#8e9095";
const PANTS_DK = "#6b6d72";
const SHOE = "#dcd6c6";
const SHOE_DK = "#a8a192";
const STAIN = "#9c8a2e";

type ExprSpec = { lidTop: number; lidBottom: number; lidAngle: number; pupil: number; smile: number; brow: number; browTilt: number };
const EXPR: Record<SkeeterExpr, ExprSpec> = {
  shifty: { lidTop: 0.36, lidBottom: 0.14, lidAngle: 8, pupil: 0.34, smile: 0.12, brow: -0.2, browTilt: 8 },
  sneak: { lidTop: 0.3, lidBottom: 0.12, lidAngle: 14, pupil: 0.3, smile: 0.35, brow: -0.4, browTilt: 14 },
  startled: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.15, smile: -0.5, brow: 1.7, browTilt: -8 },
  scared: { lidTop: 0.02, lidBottom: 0.1, lidAngle: -12, pupil: 0.2, smile: -0.6, brow: 1.3, browTilt: -20 },
  nervous: { lidTop: 0.1, lidBottom: 0.14, lidAngle: -10, pupil: 0.26, smile: 0.4, brow: 1.0, browTilt: -16 },
  deadpan: { lidTop: 0.56, lidBottom: 0.2, lidAngle: 0, pupil: 0.3, smile: 0, brow: 0, browTilt: 0 },
  realize: { lidTop: 0, lidBottom: 0.04, lidAngle: -6, pupil: 0.1, smile: -0.45, brow: 1.8, browTilt: -14 },
  pleading: { lidTop: 0, lidBottom: 0.16, lidAngle: -18, pupil: 0.46, smile: -0.3, brow: 1.5, browTilt: -24 },
  wince: { lidTop: 1, lidBottom: 0, lidAngle: 0, pupil: 0.2, smile: -0.75, brow: -0.8, browTilt: 22 },
  innocent: { lidTop: 0.42, lidBottom: 0.08, lidAngle: -6, pupil: 0.3, smile: 0.2, brow: 0.9, browTilt: -6 },
  gulp: { lidTop: 0.06, lidBottom: 0.1, lidAngle: -10, pupil: 0.2, smile: -0.3, brow: 1.2, browTilt: -18 },
};

/** head centre in body coordinates (before bob / cower) */
export const SKEETER_HEAD: Pt = [36, -352];

const HOLD_ARMS: Record<SkeeterHold, { f?: [number, number]; b?: [number, number] }> = {
  none: {},
  boxUnder: { f: [6, 50] },
  boxBack: { b: [-40, -30], f: [8, 30] },
  boxBoth: { f: [30, 50], b: [40, 60] },
  boxOpen: { f: [30, 50], b: [40, 60] },
  bottle: { f: [76, 20] },
  bottleOut: { f: [86, 14] },
  bottleHug: { f: [40, 118], b: [30, 100] },
};

/** quick nose twitch (0..1) on a jittery schedule */
function twitch(t: number, seed: string): number {
  const per = 0.62;
  const k = Math.floor(t / per);
  for (const kk of [k, k - 1]) {
    const st = kk * per + rnd(`${seed}tw${kk}`) * 0.4;
    const dt = t - st;
    if (dt >= 0 && dt < 0.13) return dt < 0.065 ? 1 : 0.4;
  }
  return 0;
}

export const Ferret: React.FC<SkeeterProps> = ({
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
  expr = "shifty",
  look,
  headTilt = 0,
  hold = "none",
  armF,
  armB,
  point = false,
  sneak = 0,
  step = 0,
  hop = 0,
  bristle = 0,
  tremble = 0,
  sweat = 0,
  shrink = 0,
  lean = 0,
  boxOpen = 0,
  boxGlow = 0,
  hat = false,
  glitter = 0,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const jit = tremble * 4.5;
  const jx = tremble > 0 ? (rnd(`${id}jx${f2}`) - 0.5) * 2 * jit : 0;
  const jy = tremble > 0 ? (rnd(`${id}jy${f2}`) - 0.5) * 2 * jit : 0;
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 6 + energy * 3 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 1.1 : 0.45), 2) * (talking ? 7 : 3.5);
  const blink = expr === "wince" ? 0 : blinkAmount(t, id, 2.6);
  const twitchy = expr === "shifty" || expr === "sneak" || expr === "nervous";
  const dart = saccade(t, id, twitchy ? 0.42 : 0.18, twitchy ? 0.5 : 0.8);
  const gaze: Pt = [(look?.[0] ?? 0.5) + dart[0], (look?.[1] ?? 0) + dart[1]];
  const tw = twitch(t, id);
  const earTw = Math.sin(t * 9) * (rnd(`${id}ear${Math.floor(t / 1.3)}`) < 0.35 ? 6 : 0);
  const flat = Math.max(shrink, expr === "realize" || expr === "scared" || expr === "wince" ? 0.6 : 0);

  // sneaking walk (tiptoe, high knees)
  const ph = ((step % 1) + 1) % 1;
  const sw = Math.sin(ph * Math.PI * 2);
  const liftF = sneak * Math.max(0, sw);
  const liftB = sneak * Math.max(0, -sw);
  const bodyY = -hop - sneak * (6 + Math.abs(sw) * 8) + shrink * 18;

  const geo = useMemo(
    () => ({
      cranium: blob(-8, 0, 60, 46, 12, 0.05, id + "cran"),
      hoodBack: blob(-26, -2, 70, 62, 12, 0.04, id + "hood"),
      stain: blob(52, -150, 14, 10, 8, 0.35, id + "stain"),
    }),
    [id],
  );

  const s = flip ? -scale : scale;
  const mirror = flip;

  /* ---------------- legs ---------------- */
  const leg = (hx: number, fx: number, lift: number, back: boolean) => {
    const foot: Pt = [fx + lift * 28, -14 - lift * 50];
    const knee: Pt = [hx + (foot[0] - hx) * 0.5 + 16 + lift * 34, -64 - lift * 34];
    const hip: Pt = [hx, -112 + bodyY];
    const d = taperPath([hip, knee, foot], 44, 34);
    const toeDown = sneak > 0 ? (lift > 0.05 ? 26 : 16 * sneak) : 0;
    return (
      <g key={back ? "lb" : "lf"}>
        <path d={d} fill={back ? PANTS_DK : PANTS} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d={`M${knee[0] - 10},${knee[1] - 16} q8,10 2,24`} stroke={PANTS_DK} strokeWidth={3} fill="none" />
        <g transform={`translate(${foot[0]} ${foot[1] + 6}) rotate(${toeDown})`}>
          <path d="M-16,-10 C-12,-24 22,-24 42,-8 C46,2 32,8 -14,8 C-20,6 -20,-4 -16,-10 Z" fill={back ? SHOE_DK : SHOE} stroke={INK} strokeWidth={4} />
          <path d="M-18,2 L44,0" stroke="#7d776a" strokeWidth={4} />
          <path d="M4,-18 l8,6 M12,-20 l8,6 M20,-19 l7,6" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
          {!back ? <path d="M10,-14 q-14,10 -24,26 M14,-14 q4,14 -2,26" stroke="#f2eee2" strokeWidth={2.5} fill="none" strokeLinecap="round" /> : null}
        </g>
      </g>
    );
  };

  /* ---------------- tail ---------------- */
  const sway = noise2D(id + "tail", t2 * (tremble > 0 ? 2.5 : 0.7), 0) * 14;
  const tailPts: Pt[] = [
    [-50, -124 + bodyY],
    [-106, -112 + bodyY * 0.6],
    [-148, -86 + sway * 0.5],
    [-170, -44 + sway],
    [-182 + sway * 0.6, -96 + sway * 1.2 - bristle * 30],
  ];
  const tw0 = 30 + bristle * 38;
  const tailD = taperPath(tailPts, tw0, 12 + bristle * 20);
  const tipD = taperPath(tailPts.slice(2), tw0 * 0.75, 12 + bristle * 20);

  /* ---------------- arms ---------------- */
  const shF: Pt = [40, -276 + bodyY];
  const shB: Pt = [-26, -282 + bodyY];
  const defF: [number, number] = sneak > 0.3 && hold === "none" ? [96, 118] : [14, 30];
  const defB: [number, number] = sneak > 0.3 ? [70, 112] : [-12, 18];
  const aFang = armF ?? HOLD_ARMS[hold].f ?? defF;
  const aBang = armB ?? HOLD_ARMS[hold].b ?? defB;
  const aF = limb(shF, aFang, [78, 72]);
  const aB = limb(shB, aBang, [78, 72]);

  const paw = (pts: Pt[], key: string, pointing: boolean, col: string) => {
    const end = pts[2];
    const prev = pts[1];
    const a = Math.atan2(end[0] - prev[0], end[1] - prev[1]);
    const digits = pointing ? [0] : [-0.55, -0.18, 0.18, 0.55];
    const d = digits
      .map((da) => {
        const r = a + da;
        const l = pointing ? 30 : 14;
        return `M${end[0]},${end[1]} L${end[0] + Math.sin(r) * (12 + l)},${end[1] + Math.cos(r) * (12 + l)}`;
      })
      .join(" ");
    return (
      <g key={key}>
        <path d={d} stroke={INK} strokeWidth={11} strokeLinecap="round" />
        <path d={d} stroke={col} strokeWidth={6} strokeLinecap="round" />
        <circle cx={end[0]} cy={end[1]} r={14} fill={col} stroke={INK} strokeWidth={4} />
        {digits.map((da, i) => {
          const r = a + da;
          const l = (pointing ? 30 : 14) + 12;
          const tx = end[0] + Math.sin(r) * l;
          const ty = end[1] + Math.cos(r) * l;
          return <path key={i} d={`M${tx},${ty} l${Math.sin(r) * 6},${Math.cos(r) * 6}`} stroke="#efe7d2" strokeWidth={2.5} strokeLinecap="round" />;
        })}
      </g>
    );
  };

  const sleeve = (pts: Pt[], back: boolean) => {
    const col = back ? HOOD_DK : HOOD;
    const wrist = pts[2];
    const elbow = pts[1];
    const cuffA: Pt = [elbow[0] + (wrist[0] - elbow[0]) * 0.72, elbow[1] + (wrist[1] - elbow[1]) * 0.72];
    return (
      <g>
        <DLine d={smoothPath(pts, false, 0.6)} w={28} color={col} ow={4.5} />
        <DLine d={`M${cuffA[0]},${cuffA[1]} L${wrist[0]},${wrist[1]}`} w={24} color={back ? "#22484a" : HOOD_DK} ow={4} />
        <path d={`M${pts[0][0]},${pts[0][1] + 6} Q${elbow[0] - 6},${elbow[1]} ${cuffA[0]},${cuffA[1]}`} stroke={back ? "#24504c" : HOOD_LT} strokeWidth={3} fill="none" opacity={0.7} />
      </g>
    );
  };

  /* ---------------- torso ---------------- */
  const by = bodyY;
  const torso = smoothPath(
    [
      [-56, -98 + by],
      [66, -98 + by],
      [74, -152 + by],
      [64, -234 + by],
      [48, -290 + by],
      [22, -310 + by],
      [-14, -310 + by],
      [-42, -292 + by],
      [-58, -222 + by],
      [-64, -140 + by],
    ],
    true,
    0.6,
  );

  const head: Pt = [SKEETER_HEAD[0] + shrink * 10, SKEETER_HEAD[1] + by + bob * 0.5 + shrink * 22];
  const upperRot = lean + shrink * 9;

  /* ---------------- props ---------------- */
  const boxNode =
    hold === "boxUnder" ? (
      <PackageBox x={26} y={-178 + by} rot={-5} mirror={mirror} />
    ) : hold === "boxBoth" || hold === "boxOpen" ? (
      <PackageBox x={92} y={-196 + by} rot={2} open={hold === "boxOpen" ? Math.max(0.6, boxOpen) : boxOpen} glow={boxGlow} mirror={mirror} />
    ) : null;
  const backBox = hold === "boxBack" ? <PackageBox x={-104} y={-196 + by} rot={8} mirror={mirror} /> : null;
  const bottleAt = aF[2];
  const bottleNode =
    hold === "bottle" || hold === "bottleOut" ? (
      <BabyOilBottle x={bottleAt[0] + 4} y={bottleAt[1] - 50} rot={hold === "bottleOut" ? 8 : -6} mirror={mirror} />
    ) : hold === "bottleHug" ? (
      <BabyOilBottle x={70} y={-214 + by} rot={-10} mirror={mirror} />
    ) : null;

  /* ---------------- head ---------------- */
  const headNode = (
    <g transform={`translate(${head[0] + jx * 0.6} ${head[1] + jy}) rotate(${tilt})`}>
      <path d={geo.hoodBack} fill={HOOD} stroke={INK} strokeWidth={5} />
      <path d={geo.cranium} fill={FUR} stroke={INK} strokeWidth={5} />
      {/* snout */}
      <path d="M12,-32 C56,-38 102,-20 122,-4 C130,8 118,22 90,28 C62,34 34,36 8,32 Z" fill={FUR} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M62,-22 q28,4 46,18" stroke={FUR_SH} strokeWidth={4} fill="none" />
      {/* bandit band */}
      <path d="M-22,-30 C2,-40 46,-38 70,-22 C78,-14 70,-4 56,-4 C44,-4 34,0 22,4 C4,6 -16,0 -22,-30 Z" fill={MASK} />
      <path d="M17,-46 C21,-34 23,-22 21,-10 C27,-18 31,-32 30,-46 Z" fill={FUR} />
      {expr === "wince" ? (
        <g stroke={FUR} strokeWidth={6} strokeLinecap="round" fill="none">
          <path d="M-2,-28 L14,-18 L-2,-8" />
          <path d="M54,-30 L36,-18 L54,-6" />
        </g>
      ) : (
        <>
          <Eye
            id={`${id}-eB`}
            seed={`${id}B`}
            cx={5}
            cy={-18}
            rx={8.5}
            ry={10.5}
            look={gaze}
            pupil={e.pupil}
            sclera="#f3ead6"
            veins={2}
            lidTop={Math.max(e.lidTop, blink)}
            lidBottom={e.lidBottom}
            lidAngle={-e.lidAngle}
            lidColor={MASK}
            sw={3.5}
          />
          <Eye
            id={`${id}-eF`}
            seed={`${id}F`}
            cx={40}
            cy={-16}
            rx={11}
            ry={12.5}
            look={gaze}
            pupil={e.pupil}
            sclera="#f3ead6"
            veins={3}
            lidTop={Math.max(e.lidTop, blink)}
            lidBottom={e.lidBottom}
            lidAngle={e.lidAngle}
            lidColor={MASK}
            sw={3.5}
          />
          {/* red rims */}
          <path d="M-2,-6 q7,5 14,0 M30,-2 q10,6 20,0" stroke="#c4546a" strokeWidth={2.5} fill="none" opacity={0.8} />
        </>
      )}
      {/* brows on the cream forehead */}
      {[
        [5, -18, 9, -1],
        [40, -16, 12, 1],
      ].map(([cx, cy, rx, side], i) => {
        const yy = cy - 22 - e.brow * 6;
        const dy = Math.tan((e.browTilt * Math.PI) / 180) * rx;
        const inner = side > 0 ? cx - rx : cx + rx;
        const outer = side > 0 ? cx + rx : cx - rx;
        return <path key={i} d={`M${inner},${yy + dy} L${outer},${yy - dy}`} stroke={SABLE_DK} strokeWidth={5} strokeLinecap="round" />;
      })}
      {/* nose (twitching) + whiskers */}
      <g transform={`translate(0 ${-tw * 3.5})`}>
        <path d="M114,-10 C123,-14 132,-7 130,2 C128,9 119,11 114,7 C109,2 109,-5 114,-10 Z" fill={NOSE} stroke={INK} strokeWidth={3.5} />
        <circle cx={120} cy={-6} r={2.8} fill="#fff" opacity={0.7} />
      </g>
      <g transform={`rotate(${-tw * 8} 100 12)`} stroke={INK} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.85}>
        <path d="M100,8 L150,-6 M102,14 L154,14 M100,20 L146,34" />
      </g>
      <g transform="rotate(-8 76 26)">
        <Mouth
          id={`${id}-mouth`}
          seed={`${id}m`}
          x={76}
          y={26}
          w={36}
          maxOpen={30}
          shape={expr === "innocent" && !talking ? "F" : expr === "wince" ? "B" : mouth}
          smile={e.smile}
          teeth="crooked"
          toothColor="#f1e9cf"
          lip="#8a6658"
          fangs
          sw={4}
        />
      </g>
      {/* chin tuft */}
      <path d="M22,34 l-6,10 l10,-4 l-2,10 l8,-8" stroke={FUR_SH} strokeWidth={3} fill="none" strokeLinejoin="round" />
      {/* hood rim over the back of the head */}
      <path
        d="M16,-58 C-18,-78 -76,-70 -94,-28 C-104,12 -80,56 -34,62 C-14,64 2,58 8,50 C-16,34 -28,-6 -18,-34 C-10,-48 4,-54 16,-58 Z"
        fill={HOOD}
        stroke={INK}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <path d="M8,50 C-16,34 -28,-6 -18,-34 C-10,-48 4,-54 16,-58" stroke={HOOD_DK} strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d="M-60,-46 q-18,30 -10,70" stroke={HOOD_LT} strokeWidth={3} fill="none" opacity={0.6} />
      {/* ears through DIY holes */}
      {[
        [-50, -56, 12, -20],
        [-20, -62, 14, 10],
      ].map(([ex, ey, r, rot], i) => (
        <g key={i} transform={`rotate(${rot + earTw * (i ? 1 : -1) - flat * (i ? 50 : -40)} ${ex} ${ey + r})`}>
          <path d={blob(ex, ey + r * 0.6, r * 1.15, r * 0.55, 9, 0.35, `${id}hole${i}`)} fill="#1c3533" />
          <circle cx={ex} cy={ey} r={r} fill={SABLE} stroke={INK} strokeWidth={4} />
          <circle cx={ex + 1} cy={ey + 1} r={r * 0.55} fill="#d99aa2" opacity={0.75} />
        </g>
      ))}
      {/* drawstrings */}
      <path d="M6,50 q-4,22 2,44 M18,48 q4,20 0,40" stroke="#e9e3d2" strokeWidth={4} fill="none" strokeLinecap="round" />
      <rect x={4} y={92} width={6} height={9} rx={2} fill="#9aa0a0" stroke={INK} strokeWidth={1.5} />
      <rect x={15} y={86} width={6} height={9} rx={2} fill="#9aa0a0" stroke={INK} strokeWidth={1.5} />
      {sweat > 0
        ? [0, 1, 2].map((i) => {
            const p = (t * 0.9 + i * 0.33) % 1;
            return <ellipse key={i} cx={[-6, 62, 24][i]} cy={-46 + p * 60} rx={5} ry={8} fill="#bfe3f2" stroke={INK} strokeWidth={2} opacity={sweat * (1 - p)} />;
          })
        : null}
      {hat ? <PartyHat x={-20} y={-70} rot={-18} s={0.9} elastic={70} /> : null}
    </g>
  );

  return (
    <g transform={`translate(${x + jx} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={0} cy={4} rx={100 + sneak * 10} o={0.32} />
      {/* back arm (+ a box hidden behind the back) */}
      <g transform={`rotate(${upperRot} 0 ${-112 + by})`}>
        {backBox}
        {sleeve(aB, true)}
        {paw(aB, "pB", false, SABLE_DK)}
      </g>
      {/* tail */}
      <path d={tailD} fill={FUR} stroke={INK} strokeWidth={5} />
      <path d={tipD} fill={SABLE} opacity={0.92} />
      <path d={tailD} fill="none" stroke={INK} strokeWidth={5} />
      {bristle > 0.05
        ? tailPts.slice(1).map((p, i) => (
            <g key={i} stroke={INK} strokeWidth={3} strokeLinecap="round">
              {[-1, 1].map((sd) => (
                <path key={sd} d={`M${p[0]},${p[1] + sd * (tw0 * 0.42)} l${sd * 6},${sd * 16 * bristle}`} />
              ))}
            </g>
          ))
        : null}
      {/* legs */}
      {leg(-20, -30, liftB, true)}
      {leg(16, 26, liftF, false)}
      {/* torso + head lean as one */}
      <g transform={`rotate(${upperRot} 0 ${-112 + by})`}>
        <path d={torso} fill={HOOD} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M-54,${-116 + by} Q6,${-106 + by} 68,${-116 + by}`} stroke={HOOD_DK} strokeWidth={12} fill="none" />
        {/* kangaroo pocket */}
        <path d={`M6,${-188 + by} L58,${-192 + by} L66,${-126 + by} L0,${-122 + by} Z`} fill={HOOD_LT} stroke={INK} strokeWidth={4} strokeLinejoin="round" opacity={0.95} />
        <path d={geo.stain} transform={`translate(0 ${by})`} fill={STAIN} opacity={0.7} />
        <path d={`M-40,${-270 + by} q-12,60 -4,120`} stroke={HOOD_DK} strokeWidth={4} fill="none" />
        {boxNode}
        {headNode}
        {glitter > 0
          ? Array.from({ length: 28 }).map((_, i) => (
              <circle
                key={i}
                cx={-70 + rnd(`${id}gl${i}`) * 220}
                cy={-430 + rnd(`${id}gly${i}`) * 380 + by}
                r={2.5 + rnd(`${id}glr${i}`) * 3}
                fill={["#ff5fc8", "#ffe14a", "#6fe0ff", "#b98aff"][i % 4]}
                opacity={glitter * (0.5 + 0.5 * Math.sin(t * 9 + i))}
              />
            ))
          : null}
        {/* front arm (over the box), the bottle, then the paw */}
        {sleeve(aF, false)}
        {bottleNode}
        {paw(aF, "pF", point, SABLE)}
      </g>
    </g>
  );
};

/** world position of Skeeter's head centre for a given placement */
export const skeeterHead = (x: number, y: number, flip: boolean, scale = 1) => ({
  x: x + (flip ? -1 : 1) * SKEETER_HEAD[0] * scale,
  y: y + SKEETER_HEAD[1] * scale,
});

// keep the fur shadow tone available for set pieces that draw Skeeter-coloured things (photos, footage)
export const SKEETER_COLORS = { FUR, SABLE, HOOD, PANTS, NOSE, fur: (k: number) => mixHex(FUR, SABLE, k) };
