import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { DLine, Eye, INK, Mouth, blinkAmount, saccade, taperPath } from "../../../characters/parts";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, blob, clamp, limb, onN, rnd, smoothPath } from "../../../engine/util";

/**
 * GLIM — a humanoid astral being who once saw the face of God and no longer looks up.
 * Dusty-violet skin full of star freckles, a bulbous cracked dome of a head with light leaking out of the crack,
 * huge bloodshot pinprick eyes sunk in purple bags, a lipless mouth of crooked yellow teeth, a hooked nub of a nose,
 * no ears. A chipped ring orbits his head with a pebble moon on it. Potbelly with a ragged hole through the chest that
 * shows open space (a little galaxy turns in there). Long thin arms, three glowing-tipped fingers.
 * From the hips down he trails off into a comet tail of stardust ("float"); at night he sits up in bed under a
 * patchwork blanket ("bed"). A third eye on his forehead is where his inner consciousness (Rachel) lives.
 * Faces right by default. Origin = the hips (the seat in bed, the root of the tail in space).
 */

export type GlimExpr = "neutral" | "awe" | "terror" | "dread" | "whisper" | "sleep" | "relieved" | "suspicious" | "wince" | "hush";
export type GlimPose = "float" | "bed";

export interface GlimProps {
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
  expr?: GlimExpr;
  look?: Pt;
  headTilt?: number;
  pose?: GlimPose;
  /** [shoulder, elbow] degrees (0 = hanging down, + = forward/up toward +x) */
  armF?: [number, number];
  armB?: [number, number];
  /** 0 = shut .. 1 = wide open: the third eye on his forehead */
  thirdEye?: number;
  /** 0..1 shivering */
  tremble?: number;
  /** bed pose: lean back against the pillows (degrees) */
  recline?: number;
  /** bed pose: 0 = blanket in his lap .. 1 = pulled up to his chin */
  blanket?: number;
  /** 0..1 sweat beads */
  sweat?: number;
  /** 0..1 astral aura around the silhouette */
  glow?: number;
  ring?: boolean;
  /** whole-body rotation (tumbling in space), degrees */
  spin?: number;
  /** draw only the head (kaleidoscopes) */
  only?: "head";
  /** front hand grips something: absolute finger direction in limb degrees (0 = down, 90 = forward) */
  gripF?: number;
  gripB?: number;
}

const SKIN = "#5b4f8d";
const SKIN_DK = "#3b3167";
const HEAD_C = "#665a9b";
const BAG = "#2b2150";
const RIM = "#a9e6ff";
const SCLERA = "#efe6c6";
const TEETH = "#dccb72";
const LIP = "#2f2554";
const VOIDC = "#06051a";
const RINGC = "#c8b8ff";
const BLANKET = "#7a6a3c";

const EXPR: Record<
  GlimExpr,
  { lidTop: number; lidBottom: number; lidAngle: number; pupil: number; smile: number; brow: number; browTilt: number; jaw?: MouthShape; squeeze?: boolean }
> = {
  neutral: { lidTop: 0.24, lidBottom: 0.12, lidAngle: -4, pupil: 0.15, smile: -0.15, brow: 0.3, browTilt: -8 },
  awe: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.08, smile: -0.2, brow: 1.5, browTilt: -8, jaw: "E" },
  terror: { lidTop: 0, lidBottom: 0.05, lidAngle: -8, pupil: 0.065, smile: -0.7, brow: 1.8, browTilt: -22, jaw: "C" },
  dread: { lidTop: 0.34, lidBottom: 0.16, lidAngle: -14, pupil: 0.12, smile: -0.45, brow: 1.0, browTilt: -24 },
  whisper: { lidTop: 0.22, lidBottom: 0.12, lidAngle: -10, pupil: 0.13, smile: -0.3, brow: 0.9, browTilt: -18 },
  sleep: { lidTop: 1, lidBottom: 0.25, lidAngle: 0, pupil: 0.15, smile: -0.05, brow: 0.2, browTilt: -4 },
  relieved: { lidTop: 0.5, lidBottom: 0.2, lidAngle: -6, pupil: 0.15, smile: 0.25, brow: 0.4, browTilt: -10 },
  suspicious: { lidTop: 0.44, lidBottom: 0.22, lidAngle: 14, pupil: 0.11, smile: -0.25, brow: -0.3, browTilt: 16 },
  wince: { lidTop: 1, lidBottom: 0, lidAngle: 0, pupil: 0.15, smile: -0.8, brow: -0.8, browTilt: 22, squeeze: true },
  hush: { lidTop: 0.1, lidBottom: 0.06, lidAngle: -12, pupil: 0.09, smile: -0.55, brow: 1.4, browTilt: -20 },
};

/** head centre relative to the hips (upright) */
export const GLIM_HEAD: Pt = [12, -318];
/** third eye, head-local */
export const GLIM_THIRD_LOCAL: Pt = [22, -74];

/** a lightbulb of a skull: a huge lumpy cranium over a small, gaunt, jutting jaw */
const HEAD_PTS: Pt[] = [
  [-104, -40],
  [-98, -98],
  [-66, -138],
  [-14, -156],
  [44, -146],
  [90, -112],
  [110, -58],
  [106, -4],
  [94, 36],
  [90, 70],
  [74, 102],
  [42, 120],
  [6, 118],
  [-30, 100],
  [-58, 66],
  [-82, 24],
];
const EYE_B: [number, number, number, number] = [-6, 2, 27, 33];
const EYE_F: [number, number, number, number] = [54, 8, 31, 37];
const RING = { cx: 0, cy: -120, rx: 134, ry: 24, rot: -12 };

const TORSO_PTS: Pt[] = [
  [-62, -6],
  [60, -6],
  [84, -58],
  [76, -116],
  [58, -164],
  [30, -190],
  [-12, -192],
  [-46, -176],
  [-64, -128],
  [-72, -60],
];

const rot = (p: Pt, deg: number, c: Pt = [0, 0]): Pt => {
  const r = (deg * Math.PI) / 180;
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r)];
};

/** Head placement shared by the rig and glimThirdEye() (so Rachel's cord lands exactly on the third eye). */
function headPose(p: Pick<GlimProps, "id" | "t" | "frame" | "mouth" | "talking" | "energy" | "expr" | "headTilt" | "tremble">) {
  const e = EXPR[p.expr ?? "neutral"];
  const talking = p.talking ?? false;
  const t2 = onN(p.frame, 2) / 24;
  const shown: MouthShape = p.expr === "wince" ? "B" : p.mouth === "X" && e.jaw ? e.jaw : p.mouth;
  const open = shown === "D" ? 1 : shown === "C" || shown === "H" ? 0.6 : shown === "E" ? 0.45 : shown === "B" ? 0.2 : 0;
  const bob = talking ? open * 6 + (p.energy ?? 0) * 3 : 0;
  const tilt = (p.headTilt ?? 0) + noise2D(p.id + "tilt", t2 * (talking ? 0.9 : 0.3), 2) * (talking ? 5 : 2.5) + (p.tremble ?? 0) * Math.sin(p.t * 40) * 1.5;
  const breathe = Math.sin(p.t * 1.7) * 3;
  const head: Pt = [GLIM_HEAD[0], GLIM_HEAD[1] + bob * 0.4 + breathe * 0.3];
  return { e, shown, tilt, breathe, head };
}

/** World position of Glim's third eye for the given props (for Rachel's cord). */
export function glimThirdEye(p: GlimProps): Pt {
  const { tilt, head } = headPose(p);
  const scale = p.scale ?? 1;
  const s = p.flip ? -scale : scale;
  let q = rot(GLIM_THIRD_LOCAL, tilt);
  q = [q[0] + head[0], q[1] + head[1]];
  if ((p.pose ?? "float") === "bed" && p.recline) q = rot(q, -p.recline, [0, -10]);
  q = rot(q, p.spin ?? 0, [0, -150]);
  return [p.x + q[0] * s, p.y + q[1] * scale];
}

/** World position of Glim's head centre (cameras / 9:16 follow). */
export function glimHeadWorld(x: number, y: number, scale = 1, flip = false, recline = 0): Pt {
  const q = recline ? rot(GLIM_HEAD, -recline, [0, -10]) : GLIM_HEAD;
  return [x + q[0] * (flip ? -scale : scale), y + q[1] * scale];
}

export const Glim: React.FC<GlimProps> = ({
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
  expr = "neutral",
  look,
  headTilt = 0,
  pose = "float",
  armF,
  armB,
  thirdEye = 0,
  tremble = 0,
  recline = 0,
  blanket = 0.25,
  sweat = 0,
  glow = 0.6,
  ring = true,
  spin = 0,
  only,
  gripF,
  gripB,
}) => {
  const { e, shown, tilt, breathe, head } = headPose({ id, t, frame, mouth, talking, energy, expr, headTilt, tremble });
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const jx = tremble > 0 ? (rnd(`${id}jx${f2}`) - 0.5) * 2 * tremble * 4 : 0;
  const jy = tremble > 0 ? (rnd(`${id}jy${f2}`) - 0.5) * 2 * tremble * 3 : 0;
  // terror, awe and hush stare without blinking
  const blink = e.squeeze || expr === "sleep" || expr === "terror" || expr === "awe" || expr === "hush" ? 0 : blinkAmount(t, id, 3.1);
  const dart = saccade(t, id, expr === "terror" || expr === "hush" ? 0.32 : 0.12, expr === "terror" ? 0.45 : 1.0);
  const gaze: Pt = [(look?.[0] ?? 0.5) + dart[0], (look?.[1] ?? 0) + dart[1]];

  const geo = useMemo(() => {
    const stars = Array.from({ length: 34 }).map((_, i) => [rnd(`${id}bs${i}`) * 180 - 90, -rnd(`${id}bsy${i}`) * 200, 0.8 + rnd(`${id}bsr${i}`) * 2.2, rnd(`${id}bsp${i}`) * 6] as const);
    const hstars = Array.from({ length: 22 }).map((_, i) => [rnd(`${id}hs${i}`) * 200 - 100, rnd(`${id}hsy${i}`) * 220 - 118, 0.7 + rnd(`${id}hsr${i}`) * 1.8, rnd(`${id}hsp${i}`) * 6] as const);
    const hole = Array.from({ length: 10 }).map((_, i) => [14 + (rnd(`${id}ch${i}`) - 0.5) * 50, -112 + (rnd(`${id}chy${i}`) - 0.5) * 40, 0.8 + rnd(`${id}chr${i}`) * 1.6] as const);
    const spiral: Pt[] = [];
    for (let k = 0; k < 2; k++) for (let i = 0; i < 9; i++) {
      const a = i * 0.55 + k * Math.PI;
      const r = 2 + i * 1.9;
      spiral.push([Math.cos(a) * r, Math.sin(a) * r * 0.7]);
    }
    return {
      head: smoothPath(HEAD_PTS, true, 0.9),
      torso: smoothPath(TORSO_PTS, true, 0.75),
      holeD: blob(14, -112, 30, 25, 11, 0.22, id + "hole"),
      stars,
      hstars,
      hole,
      spiral,
    };
  }, [id]);

  const twinkle = (p: number) => 0.45 + 0.55 * Math.abs(Math.sin(t2 * 1.3 + p));

  /* ---------------- arms ---------------- */
  const sway = (k: string, amp: number) => noise2D(id + k, t2 * 0.35, 1) * amp;
  const defF: [number, number] = pose === "bed" ? [22, 74] : [40 + sway("af", 18), 34 + sway("ae", 22)];
  const defB: [number, number] = pose === "bed" ? [10, 56] : [-34 + sway("bf", 16), 26 + sway("be", 20)];
  const shF: Pt = [50, -170];
  const shB: Pt = [-44, -168];
  const aF = limb(shF, armF ?? defF, [104, 98]);
  const aB = limb(shB, armB ?? defB, [104, 98]);

  const hand = (pts: Pt[], back: boolean, key: string, grip?: number) => {
    const end = pts[2];
    const prev = pts[1];
    const a = grip !== undefined ? (grip * Math.PI) / 180 : Math.atan2(end[0] - prev[0], end[1] - prev[1]);
    const col = back ? SKIN_DK : SKIN;
    const g = grip !== undefined;
    return (
      <g key={key}>
        {[-0.5, 0, 0.5].map((da, i) => {
          const r = a + da * (g ? 0.55 : 1) - (g ? 0.35 : 0);
          const l = (i === 1 ? 46 : 38) * (g ? 0.7 : 1);
          const mid: Pt = [end[0] + Math.sin(r) * l * 0.55, end[1] + Math.cos(r) * l * 0.55];
          const tr = g ? r + 0.9 : r + da * 0.4;
          const tip: Pt = [mid[0] + Math.sin(tr) * l * 0.5, mid[1] + Math.cos(tr) * l * 0.5];
          return (
            <g key={i}>
              <DLine d={smoothPath([end, mid, tip], false)} w={8} color={col} ow={3.5} />
              <circle cx={tip[0]} cy={tip[1]} r={4} fill={RIM} opacity={0.85} />
            </g>
          );
        })}
        <circle cx={end[0]} cy={end[1]} r={11} fill={col} stroke={INK} strokeWidth={3.5} />
      </g>
    );
  };

  /* ---------------- tail (float) ---------------- */
  const ts = noise2D(id + "tail", t2 * 0.4, 0);
  const tailPts: Pt[] = [
    [-6, -16],
    [-22, 44],
    [-70 + ts * 18, 112],
    [-140 + ts * 32, 162],
    [-226 + ts * 46, 186],
    [-310 + ts * 56, 178],
  ];

  /* ---------------- blanket (bed) ----------------
   * 0 = in his lap, 1 = at his chin, ~1.9 = eyes peeking over the edge, >= 3 = a trembling lump (the ring still orbits it) */
  const bk = Math.max(0, blanket);
  const yTop = -26 - bk * 150;
  const domeW = 150 + clamp(bk - 1) * 40;
  const wob = bk > 1.2 ? Math.sin(t * 31) * 3 * clamp(bk - 1.2) : 0;
  const round = clamp(bk - 2);
  const blanketD = `M${-domeW},${yTop + 40 + round * 60} C${-domeW + 20 + round * 70},${yTop - 34 - round * 40 + wob} ${150 - round * 50},${yTop - 34 - round * 40 - wob} ${170},${yTop + 46 + round * 60} C${190},${Math.min(-60, yTop + 120)} 200,-80 250,-88 C300,-96 340,-66 400,-46 C470,-26 560,-30 640,-24 L650,90 L-170,90 Z`;
  const covered = bk >= 2.6;

  const s = flip ? -scale : scale;
  const third = clamp(thirdEye);
  const ringA = t * 0.8;
  const moon: Pt = [Math.cos(ringA) * RING.rx, Math.sin(ringA) * RING.ry];
  const moonBehind = Math.sin(ringA) < 0;
  const ringT = `translate(${RING.cx} ${RING.cy}) rotate(${RING.rot})`;
  const arcBack = `M${-RING.rx},0 A${RING.rx},${RING.ry} 0 0 1 ${RING.rx},0`;
  const arcFront = `M${RING.rx},0 A${RING.rx},${RING.ry} 0 0 1 ${-RING.rx},0`;

  const Moon = () => (
    <g transform={`${ringT} translate(${moon[0]} ${moon[1]})`}>
      <circle r={12} fill="#b9b2a2" stroke={INK} strokeWidth={3} />
      <circle cx={-3} cy={-2} r={3.4} fill="#8c8576" />
      <circle cx={5} cy={4} r={2.2} fill="#8c8576" />
    </g>
  );

  const headT = `translate(${head[0] + jx * 0.7} ${head[1] + jy}) rotate(${tilt})`;
  /** when he hides under the blanket, the ring and its moon keep orbiting the lump */
  const ringOverLump =
    ring && covered ? (
      <g transform={pose === "bed" && recline ? `rotate(${-recline} 0 -10)` : undefined}>
        <g transform={`${headT} translate(0 ${wob})`}>
          <g transform={ringT}>
            <ellipse rx={RING.rx} ry={RING.ry} fill="none" stroke={INK} strokeWidth={13} />
            <ellipse rx={RING.rx} ry={RING.ry} fill="none" stroke={RINGC} strokeWidth={7} strokeDasharray="190 14 80 9 400" />
          </g>
          <Moon />
        </g>
      </g>
    ) : null;

  const headGroup = (
    <g transform={headT}>
      {/* ring: back half */}
      {ring && !covered ? (
        <g transform={ringT}>
          <path d={arcBack} fill="none" stroke={INK} strokeWidth={13} />
          <path d={arcBack} fill="none" stroke={RINGC} strokeWidth={7} strokeDasharray="190 14 80 9 400" opacity={0.9} />
        </g>
      ) : null}
      {ring && !covered && moonBehind ? <Moon /> : null}
      {/* aura */}
      {glow > 0 ? <path d={geo.head} fill="none" stroke={RIM} strokeWidth={14} opacity={0.1 * glow} /> : null}
      <path d={geo.head} fill={HEAD_C} stroke={INK} strokeWidth={6} />
      <defs>
        <clipPath id={`${id}-headclip`}>
          <path d={geo.head} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-headclip)`}>
        <ellipse cx={-58} cy={-10} rx={70} ry={130} fill={SKIN_DK} opacity={0.35} />
        {/* gaunt cheek hollow + temple shadow */}
        <path d="M14,46 Q40,74 84,58 Q60,92 20,82 Z" fill={SKIN_DK} opacity={0.5} />
        <ellipse cx={92} cy={-40} rx={22} ry={40} fill={SKIN_DK} opacity={0.35} />
        {geo.hstars.map(([sx, sy, r, p], i) => (
          <circle key={i} cx={sx} cy={sy * 1.2 - 20} r={r} fill="#eaf6ff" opacity={0.55 * twinkle(p)} />
        ))}
      </g>
      {/* the crack in the dome, light leaking out */}
      <path d="M-52,-140 L-40,-118 L-58,-98 L-44,-80 L-54,-62" fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d="M-52,-140 L-40,-118 L-58,-98 L-44,-80 L-54,-62" fill="none" stroke={RIM} strokeWidth={2.5} strokeLinejoin="round" opacity={0.9} />
      {/* worry lines */}
      <path d="M-20,-46 q22,-8 44,0 M62,-50 q16,-6 30,2 M-10,-34 q16,-6 30,0" fill="none" stroke={BAG} strokeWidth={3.5} strokeLinecap="round" opacity={0.7 + e.brow * 0.15} />
      {/* bags */}
      {[EYE_B, EYE_F].map(([cx, cy, rx, ry], i) => (
        <g key={i}>
          <path d={`M${cx - rx * 0.95},${cy + ry * 0.62} Q${cx},${cy + ry * 1.5} ${cx + rx * 0.95},${cy + ry * 0.62}`} fill="none" stroke={BAG} strokeWidth={8} strokeLinecap="round" opacity={0.9} />
          <path d={`M${cx - rx * 0.7},${cy + ry * 1.05} Q${cx},${cy + ry * 1.75} ${cx + rx * 0.7},${cy + ry * 1.05}`} fill="none" stroke={BAG} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        </g>
      ))}
      {e.squeeze ? (
        <g stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none">
          <path d={`M${EYE_B[0] - 20},${EYE_B[1] - 12} L${EYE_B[0]},${EYE_B[1] + 2} L${EYE_B[0] - 20},${EYE_B[1] + 16}`} />
          <path d={`M${EYE_F[0] + 20},${EYE_F[1] - 12} L${EYE_F[0] - 6},${EYE_F[1] + 4} L${EYE_F[0] + 20},${EYE_F[1] + 20}`} />
        </g>
      ) : (
        <>
          <Eye id={`${id}-eB`} seed={`${id}B`} cx={EYE_B[0]} cy={EYE_B[1]} rx={EYE_B[2]} ry={EYE_B[3]} look={gaze} pupil={e.pupil} sclera={SCLERA} veins={3} lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={-e.lidAngle} lidColor={HEAD_C} sw={4.5} />
          <Eye id={`${id}-eF`} seed={`${id}F`} cx={EYE_F[0]} cy={EYE_F[1]} rx={EYE_F[2]} ry={EYE_F[3]} look={gaze} pupil={e.pupil} sclera={SCLERA} veins={4} lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={e.lidAngle} lidColor={HEAD_C} sw={4.5} />
        </>
      )}
      {/* brows */}
      {[
        [EYE_B[0], EYE_B[1], EYE_B[2], -1],
        [EYE_F[0], EYE_F[1], EYE_F[2], 1],
      ].map(([cx, cy, rx, side], i) => {
        const by = cy - 44 - e.brow * 7;
        const dy = Math.tan((e.browTilt * Math.PI) / 180) * rx;
        const inner = side > 0 ? cx - rx : cx + rx;
        const outer = side > 0 ? cx + rx : cx - rx;
        return <path key={i} d={`M${inner},${by + dy} L${outer},${by - dy}`} stroke={BAG} strokeWidth={6} strokeLinecap="round" />;
      })}
      {/* third eye: a vertical slit that opens on Rachel */}
      <g transform={`translate(${GLIM_THIRD_LOCAL[0]} ${GLIM_THIRD_LOCAL[1]})`}>
        {third > 0.05 ? (
          <>
            <ellipse rx={30 * third} ry={34 * third} fill={RIM} opacity={0.25 * third} />
            <path d={`M0,-21 Q${13 * third + 1},0 0,21 Q${-13 * third - 1},0 0,-21 Z`} fill="#050512" stroke={INK} strokeWidth={4} />
            <circle r={8 * third} fill="#7ff2ff" />
            <ellipse rx={1.6 * third + 0.5} ry={6 * third} fill="#050512" />
          </>
        ) : (
          <g stroke={INK} strokeLinecap="round" fill="none">
            <path d="M0,-18 Q4,0 0,18" strokeWidth={4} />
            <path d="M2,-10 l7,-3 M3,0 l8,0 M2,10 l7,3" strokeWidth={2} />
          </g>
        )}
      </g>
      {/* nub of a nose */}
      <path d="M94,28 q16,10 2,22" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <circle cx={92} cy={46} r={2.6} fill={INK} />
      {/* crease */}
      <path d="M98,60 q-8,12 -18,16" fill="none" stroke={BAG} strokeWidth={3.5} strokeLinecap="round" />
      <g transform="rotate(-5 50 82)">
        <Mouth id={`${id}-mouth`} seed={`${id}m`} x={50} y={82} w={84} maxOpen={50} shape={shown} smile={e.smile} teeth="crooked" toothColor={TEETH} lip={LIP} inside="#12081f" tongue="#8a3a6a" />
        {/* two crooked buck teeth that never quite go away */}
        {shown === "X" || shown === "A" ? (
          <g>
            <rect x={36} y={78 - e.smile * 10} width={10} height={13} rx={2} fill={TEETH} stroke={INK} strokeWidth={2} transform={`rotate(-8 41 ${84 - e.smile * 10})`} />
            <rect x={50} y={79 - e.smile * 10} width={9} height={11} rx={2} fill="#c9b56e" stroke={INK} strokeWidth={2} transform={`rotate(6 54 ${84 - e.smile * 10})`} />
          </g>
        ) : null}
      </g>
      {sweat > 0
        ? [0, 1, 2].map((i) => {
            const ph = (t * 0.7 + i * 0.37) % 1;
            return <ellipse key={i} cx={[100, -86, 78][i]} cy={-70 + ph * 100 + i * 10} rx={5} ry={8} fill="#bfe8ff" stroke={INK} strokeWidth={2} opacity={sweat * (1 - ph)} />;
          })
        : null}
      {/* ring: front half */}
      {ring && !covered ? (
        <g transform={ringT}>
          <path d={arcFront} fill="none" stroke={INK} strokeWidth={13} />
          <path d={arcFront} fill="none" stroke={RINGC} strokeWidth={7} strokeDasharray="150 12 300" opacity={0.95} />
        </g>
      ) : null}
      {ring && !covered && !moonBehind ? <Moon /> : null}
    </g>
  );

  const upper = (
    <g transform={pose === "bed" && recline ? `rotate(${-recline} 0 -10)` : undefined}>
      {/* back arm */}
      <DLine d={smoothPath(aB, false, 0.6)} w={18} color={SKIN_DK} ow={4} />
      {hand(aB, true, "hB", gripB)}
      {/* torso */}
      {glow > 0 ? <path d={geo.torso} fill="none" stroke={RIM} strokeWidth={14} opacity={0.08 * glow} transform={`translate(0 ${breathe * 0.2})`} /> : null}
      <path d={geo.torso} fill={SKIN} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <defs>
        <clipPath id={`${id}-torsoclip`}>
          <path d={geo.torso} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-torsoclip)`}>
        <ellipse cx={-40} cy={-90} rx={46} ry={110} fill={SKIN_DK} opacity={0.4} />
        {geo.stars.map(([sx, sy, r, p], i) => (
          <circle key={i} cx={sx} cy={sy} r={r} fill="#eaf6ff" opacity={0.6 * twinkle(p)} />
        ))}
        {/* belly crease + navel (a tiny black hole) */}
        <path d="M30,-34 q24,-6 44,-20" fill="none" stroke={SKIN_DK} strokeWidth={4} />
        <circle cx={46} cy={-50} r={4.5} fill={VOIDC} stroke={RIM} strokeWidth={1.5} />
      </g>
      {/* the hole through his chest */}
      <path d={geo.holeD} fill={VOIDC} stroke={INK} strokeWidth={5} />
      <defs>
        <clipPath id={`${id}-holeclip`}>
          <path d={geo.holeD} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-holeclip)`}>
        {geo.hole.map(([hx, hy, r], i) => (
          <circle key={i} cx={hx} cy={hy} r={r} fill="#fff" opacity={0.8} />
        ))}
        <g transform={`translate(14 -112) rotate(${t * 40})`}>
          {geo.spiral.map(([sx, sy], i) => (
            <circle key={i} cx={sx} cy={sy} r={1.6} fill={i % 2 ? "#ffd6f2" : "#bff4ff"} />
          ))}
          <circle r={3} fill="#fff6d0" />
        </g>
      </g>
      <path d={geo.holeD} fill="none" stroke={RIM} strokeWidth={2} opacity={0.7} />
      {/* neck */}
      <DLine d={`M8,-186 L12,-226`} w={30} color={SKIN} ow={5} />
      {headGroup}
    </g>
  );

  if (only === "head") return <g transform={`translate(${x + jx} ${y}) scale(${s} ${scale}) rotate(${spin} 0 -150)`}>{headGroup}</g>;

  return (
    <g transform={`translate(${x + jx} ${y}) scale(${s} ${scale}) rotate(${spin} 0 -150)`}>
      {pose === "float" ? (
        <g>
          <defs>
            <linearGradient id={`${id}-tailg`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={-300} y2={180}>
              <stop offset="0" stopColor={SKIN} stopOpacity={1} />
              <stop offset="0.55" stopColor="#7b6fc0" stopOpacity={0.75} />
              <stop offset="1" stopColor={RIM} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={taperPath(tailPts, 118, 6)} fill={`url(#${id}-tailg)`} stroke={INK} strokeWidth={4} strokeOpacity={0.55} />
          {tailPts.slice(1).map((p, i) => (
            <path key={i} d={`M${p[0]},${p[1] - 9} L${p[0] + 2.5},${p[1] - 2.5} L${p[0] + 9},${p[1]} L${p[0] + 2.5},${p[1] + 2.5} L${p[0]},${p[1] + 9} L${p[0] - 2.5},${p[1] + 2.5} L${p[0] - 9},${p[1]} L${p[0] - 2.5},${p[1] - 2.5} Z`} fill="#f4fbff" opacity={twinkle(i * 1.7)} transform={`translate(${(i % 2 ? 1 : -1) * 22} ${i * 4})`} />
          ))}
        </g>
      ) : null}
      {upper}
      {pose === "bed" ? (
        <g>
          <path d={blanketD} fill={BLANKET} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <defs>
            <clipPath id={`${id}-blanketclip`}>
              <path d={blanketD} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${id}-blanketclip)`}>
            <rect x={-40} y={yTop - 40} width={130} height={140 - yTop} fill="#4f2a33" stroke={INK} strokeWidth={4} transform="rotate(4 20 0)" />
            <rect x={230} y={-110} width={150} height={220} fill="#2f4a4f" stroke={INK} strokeWidth={4} transform="rotate(-3 300 0)" />
            <rect x={470} y={-60} width={170} height={160} fill="#5a3a24" stroke={INK} strokeWidth={4} transform="rotate(5 550 0)" />
            <path d={`M${-domeW + 12},${yTop + 54} C${-domeW + 32},${yTop - 16} 138,${yTop - 16} 158,${yTop + 58}`} fill="none" stroke="#3a2f18" strokeWidth={3} strokeDasharray="10 8" />
            <path d="M100,60 L640,40" stroke="#3a2f18" strokeWidth={3} strokeDasharray="10 8" fill="none" />
          </g>
        </g>
      ) : null}
      {pose === "bed" ? ringOverLump : null}
      {pose === "bed" && covered ? (
        <g stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.8}>
          {[-1, 1].map((sd) => (
            <g key={sd} transform={`translate(${sd < 0 ? -domeW - 30 : 200} ${yTop + 120})`}>
              <path d={`M0,${Math.sin(t * 30) * 4} l${sd * -18},-14 M0,${30 + Math.cos(t * 28) * 4} l${sd * -22},0 M0,${60 + Math.sin(t * 26) * 4} l${sd * -18},14`} />
            </g>
          ))}
        </g>
      ) : null}
      {/* front arm drawn last so the hands can clutch the blanket (gone under it once he hides) */}
      {pose === "bed" && covered ? null : (
        <g transform={pose === "bed" && recline ? `rotate(${-recline} 0 -10)` : undefined}>
          <DLine d={smoothPath(aF, false, 0.6)} w={18} color={SKIN} ow={4} />
          {hand(aF, false, "hF", gripF)}
        </g>
      )}
    </g>
  );
};
