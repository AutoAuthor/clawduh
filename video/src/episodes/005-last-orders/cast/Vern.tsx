import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { DLine, Eye, INK, Shadow, blinkAmount, saccade, taperPath } from "../../../characters/parts";
import { mixHex } from "../../../characters/Possum";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, blob, limb, onN, rnd, smoothPath } from "../../../engine/util";
import { FONT, MUSTARD, MUSTARD_DK, PURPLE, PURPLE_DK, SkullBean, Unflip } from "../props";

/**
 * VERN — the iguana coworker with a plan. Lanky, olive-scaled, a crest of spines down the neck,
 * permanently heavy-lidded eyes, a hinged jaw with a grin that goes too far back, and a dewlap that
 * flares when he gets to the good part. Dingy tee under the purple DREGS apron, long banded tail.
 * Faces right by default. Origin = floor between the feet.
 */

export type VernExpr = "scheme" | "whisper" | "excited" | "dramatic" | "pause" | "tearful" | "smug" | "menace" | "deadpan" | "creepy";
export type HandStyle = "open" | "point" | "up" | "fist" | "flat";

export interface VernProps {
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
  expr?: VernExpr;
  look?: Pt;
  headTilt?: number;
  /** [shoulder, elbow] degrees, 0 = hanging down, + = forward */
  armF?: [number, number];
  armB?: [number, number];
  handF?: HandStyle;
  handB?: HandStyle;
  /** 0..1 dewlap flared */
  dewlap?: number;
  /** degrees, lean the upper body forward (+) */
  lean?: number;
  /** stretch the neck forward/up (px) */
  crane?: number;
  /** 0..1 lit from below (dramatic red light) */
  underlight?: number;
}

const SKIN = "#7c9a58";
const SKIN_DK = "#556f3b";
const SKIN_LT = "#a8bf7a";
const BELLY = "#c8cc8a";
const DEWLAP = "#d4c068";
const DEWLAP_DK = "#a3712f";
const SPINE = "#cbbf6a";
const TEE = "#d8d2c0";
const JEANS = "#2b2930";

type E = { lidTop: number; lidBottom: number; lidAngle: number; pupil: number; smile: number; brow: number; browTilt: number };
const EXPR: Record<VernExpr, E> = {
  scheme: { lidTop: 0.5, lidBottom: 0.24, lidAngle: 10, pupil: 0.3, smile: 0.9, brow: -0.4, browTilt: 14 },
  whisper: { lidTop: 0.6, lidBottom: 0.26, lidAngle: 12, pupil: 0.26, smile: 0.55, brow: 0.3, browTilt: 4 },
  excited: { lidTop: 0.3, lidBottom: 0.2, lidAngle: -6, pupil: 0.34, smile: 1, brow: 0.8, browTilt: -8 },
  dramatic: { lidTop: 0.16, lidBottom: 0.14, lidAngle: 6, pupil: 0.22, smile: 0.35, brow: 1, browTilt: 10 },
  pause: { lidTop: 0.06, lidBottom: 0.08, lidAngle: 0, pupil: 0.14, smile: 0.2, brow: 0.7, browTilt: 0 },
  tearful: { lidTop: 0.72, lidBottom: 0.3, lidAngle: -16, pupil: 0.3, smile: 0.75, brow: 1.2, browTilt: -18 },
  smug: { lidTop: 0.64, lidBottom: 0.3, lidAngle: 4, pupil: 0.26, smile: 0.85, brow: -0.2, browTilt: 6 },
  menace: { lidTop: 0.46, lidBottom: 0.36, lidAngle: 24, pupil: 0.16, smile: 1, brow: -1, browTilt: 26 },
  deadpan: { lidTop: 0.62, lidBottom: 0.25, lidAngle: 0, pupil: 0.26, smile: 0.2, brow: 0, browTilt: 0 },
  creepy: { lidTop: 0.04, lidBottom: 0.04, lidAngle: 0, pupil: 0.14, smile: 1, brow: 0.9, browTilt: 0 },
};

const OPEN: Record<MouthShape, number> = { X: 0, A: 0, B: 0.14, C: 0.45, D: 0.9, E: 0.42, F: 0.24, G: 0.12, H: 0.5 };

export const VERN_HEAD: Pt = [74, -478];

const rot = (p: Pt, c: Pt, deg: number): Pt => {
  const r = (deg * Math.PI) / 180;
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r)];
};
const P = (p: Pt) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

export const Vern: React.FC<VernProps> = ({
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
  expr = "scheme",
  look,
  headTilt = 0,
  armF = [24, 70],
  armB = [-6, 30],
  handF = "open",
  handB = "open",
  dewlap = 0,
  lean = 0,
  crane = 0,
  underlight = 0,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const open = OPEN[mouth] * (talking ? 1 : 0.5);
  const bob = talking ? open * 6 + energy * 3 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.8 : 0.25), 4) * (talking ? 5 : 2);
  const blink = expr === "pause" || expr === "creepy" ? 0 : blinkAmount(t, id, 3.8);
  const dart = saccade(t, id, expr === "pause" ? 0 : 0.08, 1.3);
  const gaze: Pt = [(look?.[0] ?? 0.5) + dart[0], (look?.[1] ?? 0.1) + dart[1]];
  const swish = Math.sin(t2 * 1.6) * 14 + noise2D(id + "tail", t2 * 0.5, 2) * 10;
  const dw = Math.min(1, dewlap + (talking ? open * 0.15 : 0));
  const smile = e.smile;

  const geo = useMemo(
    () => ({
      spinesBody: (() => {
        const pts: Pt[] = [
          [34, -452],
          [18, -430],
          [0, -410],
        ];
        return pts.map((p, i) => ({ p, h: 28 - i * 5 + rnd(`${id}sp${i}`) * 6 }));
      })(),
      scales: Array.from({ length: 18 }).map((_, i) => [rnd(`${id}sx${i}`) * 110 - 40, rnd(`${id}sy${i}`) * 60 - 40] as Pt),
    }),
    [id],
  );

  // jaw geometry (head coordinates)
  const H: Pt = [-8, 25 - smile * 14];
  const jawRot = open * 20;
  const upper: Pt[] = [H, [36, 20 - smile * 4], [84, 16], [120, 12]];
  const lower0: Pt[] = [H, [36, 21 - smile * 4], [84, 17], [118, 13]];
  const lower = lower0.map((p) => rot(p, H, jawRot));
  const jawShape0: Pt[] = [[118, 13], [112, 30], [80, 44], [30, 50], [-10, 46], [-32, 36]];
  const jawShape = jawShape0.map((p) => rot(p, H, jawRot));
  const curve = (pts: Pt[]) => `M${P(pts[0])} C${P(pts[1])} ${P(pts[2])} ${P(pts[3])}`;
  const interior = `M${P(upper[0])} C${P(upper[1])} ${P(upper[2])} ${P(upper[3])} L${P(lower[3])} C${P(lower[2])} ${P(lower[1])} ${P(lower[0])} Z`;
  const jaw = `M${P(lower[0])} C${P(lower[1])} ${P(lower[2])} ${P(lower[3])} ` + jawShape.map((p) => `L${P(p)}`).join(" ") + " Z";
  const cranium = `M${P(H)} L-36,40 C-56,30 -64,8 -60,-8 C-58,-34 -34,-50 8,-50 C48,-48 84,-40 104,-26 C120,-16 128,-2 124,10 L120,12 C${P(upper[2])} ${P(upper[1])} ${P(upper[0])} Z`;
  // little teeth along the lips
  const toothAlong = (pts: Pt[], dir: 1 | -1, n: number, size: number) => {
    const out: string[] = [];
    for (let i = 1; i < n; i++) {
      const k = i / n;
      const a = bez(pts, k);
      const b = bez(pts, Math.min(1, k + 0.5 / n));
      const nx = -(b[1] - a[1]);
      const ny = b[0] - a[0];
      const l = Math.hypot(nx, ny) || 1;
      const s2 = size * (0.6 + 0.4 * k);
      out.push(`M${P(a)} L${P([a[0] + (nx / l) * s2 * dir + (b[0] - a[0]) * 0.5, a[1] + (ny / l) * s2 * dir + (b[1] - a[1]) * 0.5])} L${P(b)} Z`);
    }
    return out.join(" ");
  };

  const leanRot = `rotate(${lean} 0 -200)`;
  const shF: Pt = [40, -380];
  const shB: Pt = [-36, -386];
  const aF = limb(shF, armF, [92, 88]);
  const aB = limb(shB, armB, [92, 88]);
  const head: Pt = [VERN_HEAD[0] + crane, VERN_HEAD[1] - crane * 0.3 + bob * 0.5];
  const s = flip ? -scale : scale;

  const hand = (pts: Pt[], style: HandStyle, key: string, col: string) => {
    const end = pts[2];
    const prev = pts[1];
    const a = Math.atan2(end[0] - prev[0], end[1] - prev[1]);
    let fingers: Array<[number, number]> = [];
    if (style === "open") fingers = [[-0.55, 26], [-0.18, 30], [0.18, 30], [0.52, 24]];
    else if (style === "point") fingers = [[0, 38], [0.9, 12], [1.2, 11], [-0.9, 12]];
    else if (style === "up") fingers = [[Math.PI - 0.12, 34], [Math.PI + 0.1, 30], [0.9, 12], [1.3, 11]];
    else if (style === "flat") fingers = [[-0.1, 30], [0, 32], [0.1, 30], [0.2, 26]];
    else fingers = [[0.6, 12], [1.0, 12], [1.4, 11], [1.8, 10]];
    const segs = fingers.map(([da, l], i) => {
      const r = style === "up" && i < 2 ? da : a + da;
      return `M${end[0]},${end[1]} L${end[0] + Math.sin(r) * l},${end[1] + Math.cos(r) * l}`;
    });
    const claws = fingers.map(([da, l], i) => {
      const r = style === "up" && i < 2 ? da : a + da;
      return <circle key={i} cx={end[0] + Math.sin(r) * (l + 3)} cy={end[1] + Math.cos(r) * (l + 3)} r={2.6} fill="#2a2420" />;
    });
    return (
      <g key={key}>
        <path d={segs.join(" ")} stroke={INK} strokeWidth={11} strokeLinecap="round" />
        <path d={segs.join(" ")} stroke={col} strokeWidth={5.5} strokeLinecap="round" />
        {claws}
        <circle cx={end[0]} cy={end[1]} r={12} fill={col} stroke={INK} strokeWidth={4} />
      </g>
    );
  };
  const arm = (pts: Pt[], back: boolean, style: HandStyle, key: string) => {
    const col = back ? mixHex(SKIN, "#000000", 0.15) : SKIN;
    const sl: Pt = [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.42, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.42];
    return (
      <g key={key}>
        <DLine d={smoothPath(pts, false, 0.6)} w={20} color={col} ow={4.5} />
        {[0.55, 0.7, 1.25, 1.45].map((k, i) => {
          const seg = k < 1 ? [pts[0], pts[1]] : [pts[1], pts[2]];
          const f = k < 1 ? k : k - 1;
          const px = seg[0][0] + (seg[1][0] - seg[0][0]) * f;
          const py = seg[0][1] + (seg[1][1] - seg[0][1]) * f;
          return <circle key={i} cx={px} cy={py} r={4} fill={SKIN_DK} opacity={0.7} />;
        })}
        <path d={taperPath([pts[0], sl], 40, 46)} fill={back ? mixHex(TEE, "#000000", 0.12) : TEE} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        {hand(pts, style, key + "h", col)}
      </g>
    );
  };

  const torso = smoothPath(
    [
      [-50, -196],
      [52, -196],
      [64, -260],
      [62, -336],
      [46, -392],
      [-30, -400],
      [-54, -352],
      [-58, -270],
    ],
    true,
    0.65,
  );
  const apron = `M14,-382 L56,-376 L62,-300 L74,-290 L80,-140 Q30,-128 -22,-140 L-14,-292 L4,-300 Z`;
  const tailPts: Pt[] = [
    [-40, -192],
    [-104, -150],
    [-160, -84],
    [-232, -24],
    [-330 + swish * 0.4, -10],
    [-430 + swish, -18 - Math.abs(swish) * 0.6],
  ];

  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={-40} cy={4} rx={150} o={0.32} />
      {/* tail */}
      <path d={taperPath(tailPts, 44, 8)} fill={SKIN} stroke={INK} strokeWidth={5} />
      {[1, 2, 3, 4].map((i) => {
        const p = tailPts[i];
        const q = tailPts[i + 1] ?? p;
        const ang = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
        return <rect key={i} x={p[0] - 6} y={p[1] - 18 + i * 2.5} width={14} height={36 - i * 5} rx={4} fill={SKIN_DK} transform={`rotate(${ang} ${p[0]} ${p[1]})`} />;
      })}
      {/* legs + feet */}
      {[
        [-22, -196, -14, -110, -30, -16],
        [24, -196, 38, -108, 30, -16],
      ].map(([x0, y0, kx, ky, x1, y1], i) => (
        <DLine key={i} d={smoothPath([[x0, y0], [kx, ky], [x1, y1]], false, 0.6)} w={30} color={i ? JEANS : mixHex(JEANS, "#000000", 0.3)} ow={4.5} />
      ))}
      {[-30, 30].map((fx, i) => (
        <g key={i} transform={`translate(${fx} -10)`}>
          <path d="M-16,-6 C-4,-14 30,-12 40,-2 L56,2 L40,6 L50,10 L30,10 C0,12 -18,8 -16,-6 Z" fill={SKIN} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        </g>
      ))}
      <g transform={leanRot}>
        {/* back arm */}
        {arm(aB, true, handB, "aB")}
        {/* torso: dingy tee */}
        <path d={torso} fill={TEE} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={blob(-30, -250, 14, 18, 8, 0.3, id + "pit")} fill="#c9c08a" opacity={0.7} />
        <path d={blob(-24, -310, 10, 8, 7, 0.3, id + "st")} fill="#6b4a22" opacity={0.5} />
        {/* apron */}
        <path d={apron} fill={PURPLE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M20,-374 L50,-370 L56,-302 L68,-294 L72,-150 Q30,-140 -14,-150 L-8,-294 L8,-302 Z" fill="none" stroke={MUSTARD} strokeWidth={3} opacity={0.9} />
        <path d="M14,-382 L4,-418 M56,-376 L52,-414" stroke={MUSTARD} strokeWidth={7} strokeLinecap="round" />
        <path d="M-56,-292 L-14,-294" stroke={MUSTARD_DK} strokeWidth={8} strokeLinecap="round" />
        <SkullBean x={36} y={-340} s={38} />
        <circle cx={6} cy={-366} r={9} fill={MUSTARD} stroke={INK} strokeWidth={3} />
        <path d="M2,-366 l8,0 M6,-370 l0,8" stroke={PURPLE_DK} strokeWidth={2.5} />
        <path d={blob(40, -190, 16, 10, 7, 0.35, id + "ast")} fill="#2a1a28" opacity={0.55} />
        <g transform="translate(-50 -352) rotate(-4)">
          <rect x={0} y={0} width={54} height={22} rx={4} fill="#f2ead6" stroke={INK} strokeWidth={3} />
          <Unflip flip={flip} cx={27}>
            <text x={27} y={17} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill={PURPLE_DK}>
              VERN
            </text>
          </Unflip>
        </g>
        {/* neck */}
        <path d={`M14,-390 Q30,-430 ${head[0] - 30},${head[1] + 20}`} stroke={INK} strokeWidth={50} fill="none" strokeLinecap="round" />
        <path d={`M14,-390 Q30,-430 ${head[0] - 30},${head[1] + 20}`} stroke={SKIN} strokeWidth={40} fill="none" strokeLinecap="round" />
        <path d={`M28,-394 Q44,-428 ${head[0] - 14},${head[1] + 30}`} stroke={BELLY} strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.8} />
        {/* spine crest down the neck and back */}
        {geo.spinesBody.map(({ p, h }, i) => {
          const tip: Pt = [p[0] - h * 0.55, p[1] - h * 0.85];
          return <path key={i} d={`M${p[0] - 12},${p[1] + 8} L${tip[0]},${tip[1]} L${p[0] + 12},${p[1] - 4} Z`} fill={SPINE} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />;
        })}
        {/* head */}
        <g transform={`translate(${head[0]} ${head[1]}) rotate(${tilt})`}>
          {/* dewlap (behind the jaw) */}
          <g transform={`translate(0 ${jawRot * 0.6})`}>
            <path
              d={`M44,40 C${40 + dw * 30},${86 + dw * 40} ${-6 + dw * 10},${128 + dw * 70} ${-34},${110 + dw * 50} C-52,${80 + dw * 20} -46,52 -30,38 Z`}
              fill={DEWLAP}
              stroke={INK}
              strokeWidth={4.5}
              strokeLinejoin="round"
            />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${30 - i * 18},${46 + i * 4} q${dw * 8},${30 + dw * 20} ${-8 - i * 4},${44 + dw * 40}`} stroke={DEWLAP_DK} strokeWidth={4} fill="none" opacity={0.7} />
            ))}
          </g>
          {/* head spines */}
          {[
            [-46, -36, 22],
            [-28, -46, 18],
            [-8, -50, 12],
          ].map(([sx, sy, h], i) => (
            <path key={i} d={`M${sx - 10},${sy + 6} L${sx - h * 0.4},${sy - h} L${sx + 10},${sy + 2} Z`} fill={SPINE} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          ))}
          {/* mouth interior + teeth (only shows when the jaw drops or grins) */}
          <path d={interior} fill="#3a0f12" stroke={INK} strokeWidth={3} />
          {open > 0.2 ? <ellipse cx={lower[2][0] - 10} cy={lower[2][1] - 6} rx={30} ry={8 + open * 4} fill="#c45a6a" stroke={INK} strokeWidth={2} transform={`rotate(${jawRot} ${H[0]} ${H[1]})`} /> : null}
          <path d={toothAlong(upper, 1, 9, 8)} fill="#ece4c6" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
          {open > 0.06 ? <path d={toothAlong(lower, -1, 9, 7)} fill="#e2d8b6" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" /> : null}
          {/* lower jaw */}
          <path d={jaw} fill={mixHex(SKIN, BELLY, 0.35)} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
          {/* cranium + upper jaw */}
          <path d={cranium} fill={SKIN} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          {geo.scales.map(([sx, sy], i) => (
            <circle key={i} cx={sx} cy={sy} r={2.6} fill={SKIN_DK} opacity={0.55} />
          ))}
          <path d="M-20,-30 q24,-10 48,-4 M50,-38 q24,0 44,10" stroke={SKIN_DK} strokeWidth={3} fill="none" opacity={0.7} />
          {/* nostril, cheek shield, ear */}
          <ellipse cx={112} cy={-8} rx={5} ry={3.5} fill={INK} transform="rotate(-20 112 -8)" />
          <ellipse cx={-26} cy={14} rx={15} ry={14} fill={SKIN_LT} stroke={INK} strokeWidth={3.5} />
          <ellipse cx={-30} cy={10} rx={5} ry={4} fill="#fff" opacity={0.5} />
          <ellipse cx={-46} cy={-10} rx={7} ry={9} fill="#2e3a22" stroke={INK} strokeWidth={2.5} />
          {/* eyes: heavy, heavy lids */}
          <Eye id={`${id}-eF`} seed={`${id}F`} cx={58} cy={-22} rx={11} ry={11} look={gaze} pupil={e.pupil} iris="#d9a82a" sclera="#e6d78c" lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={-e.lidAngle} lidColor={SKIN_DK} sw={3.5} />
          <Eye id={`${id}-eN`} seed={`${id}N`} cx={18} cy={-14} rx={18} ry={17} look={gaze} pupil={e.pupil} iris="#d9a82a" sclera="#e6d78c" veins={1} lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={e.lidAngle} lidColor={SKIN_DK} sw={4} />
          {/* brow ridges */}
          {[
            [18, -14, 18, 1],
            [58, -22, 11, -1],
          ].map(([cx, cy, rx, side], i) => {
            const by = cy - rx - 6 - e.brow * 5;
            const dy = Math.tan((e.browTilt * Math.PI) / 180) * rx * (side > 0 ? 1 : -1);
            return <path key={i} d={`M${cx - rx - 4},${by - dy} Q${cx},${by - 8} ${cx + rx + 4},${by + dy}`} stroke={SKIN_DK} strokeWidth={9} fill="none" strokeLinecap="round" />;
          })}
          {/* the too-wide grin line + creases */}
          <path d={curve(upper)} stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <path d={`M${P(H)} q-10,${-4 - smile * 6} -16,${-12 - smile * 10}`} stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
          {expr === "tearful" ? (
            <g>
              <path d={`M8,4 q-6,${10 + ((t * 0.8) % 1) * 30} 0,${18 + ((t * 0.8) % 1) * 40}`} stroke="#bfe3f2" strokeWidth={6} fill="none" strokeLinecap="round" />
              <ellipse cx={8} cy={26 + ((t * 0.8) % 1) * 40} rx={5} ry={7} fill="#bfe3f2" stroke={INK} strokeWidth={2} />
            </g>
          ) : null}
          {underlight > 0 ? <path d={`M-60,40 L124,40 L124,-10 Q30,10 -60,-10 Z`} fill="#ff3020" opacity={0.18 * underlight} style={{ mixBlendMode: "screen" }} /> : null}
        </g>
        {/* front arm */}
        {arm(aF, false, handF, "aF")}
      </g>
    </g>
  );
};

/** Point on a cubic Bezier given as 4 control points. */
function bez(p: Pt[], k: number): Pt {
  const u = 1 - k;
  return [
    u * u * u * p[0][0] + 3 * u * u * k * p[1][0] + 3 * u * k * k * p[2][0] + k * k * k * p[3][0],
    u * u * u * p[0][1] + 3 * u * u * k * p[1][1] + 3 * u * k * k * p[2][1] + k * k * k * p[3][1],
  ];
}
