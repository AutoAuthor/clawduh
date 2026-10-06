import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { DLine, Eye, INK, Mouth, Shadow, blinkAmount, saccade } from "../../../characters/parts";
import { mixHex } from "../../../characters/Possum";
import type { MouthShape } from "../../../engine/timeline";
import { Pt, blob, onN, rnd } from "../../../engine/util";
import { FONT, MUSTARD, MUSTARD_DK, PURPLE, PURPLE_DK, SkullBean, Unflip } from "../props";

/**
 * MO — the sloth on mop duty. Shaggy algae-tinted fur, a hairnet nobody asked for, sloth-mask eye stripes,
 * three long claws on each hand wrapped round a mop he pushes in permanent slow motion.
 * A moth lives in his fur. Everything he does is half speed — except the last line.
 * Faces right by default. Origin = floor between the feet.
 */

export type MoExpr = "deadpan" | "appalled" | "judging" | "angry" | "confused" | "shocked" | "smug" | "nod";

export interface MoProps {
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
  expr?: MoExpr;
  look?: Pt;
  headTilt?: number;
  /** radians: the slow side-to-side mopping cycle (pass a function of t), or null to hold still */
  mopPhase?: number | null;
  /** override the mop: head on the floor + top of the handle (body coordinates); false = no mop */
  mop?: { head: Pt; top: Pt } | false;
  /** degrees, upper-body lean */
  lean?: number;
  /** free hand pose when the mop is gone: [shoulder, elbow] angles */
  armFree?: [number, number];
}

const FUR = "#86795f";
const FUR_DK = "#5b5040";
const ALGAE = "#7c8a5c";
const FACE = "#d8ccae";
const STRIPE = "#3b2f25";
const CLAW = "#e6dbbf";
const NET = "#b9b6ae";

type E = { lidTop: number; lidBottom: number; lidAngle: number; pupil: number; smile: number; brow: number; browTilt: number };
const EXPR: Record<MoExpr, E> = {
  deadpan: { lidTop: 0.5, lidBottom: 0.16, lidAngle: 0, pupil: 0.46, smile: 0.05, brow: 0, browTilt: 0 },
  appalled: { lidTop: 0.04, lidBottom: 0.06, lidAngle: -6, pupil: 0.3, smile: -0.6, brow: 1.4, browTilt: -14 },
  judging: { lidTop: 0.56, lidBottom: 0.3, lidAngle: 16, pupil: 0.38, smile: -0.35, brow: -0.4, browTilt: 18 },
  angry: { lidTop: 0.32, lidBottom: 0.22, lidAngle: 28, pupil: 0.3, smile: -0.75, brow: -1.2, browTilt: 28 },
  confused: { lidTop: 0.14, lidBottom: 0.1, lidAngle: 0, pupil: 0.4, smile: -0.2, brow: 1, browTilt: 0 },
  shocked: { lidTop: 0, lidBottom: 0, lidAngle: 0, pupil: 0.22, smile: -0.4, brow: 1.6, browTilt: -10 },
  smug: { lidTop: 0.6, lidBottom: 0.3, lidAngle: 4, pupil: 0.4, smile: 0.6, brow: 0.2, browTilt: 6 },
  nod: { lidTop: 0.66, lidBottom: 0.3, lidAngle: -4, pupil: 0.4, smile: 0.3, brow: 0.3, browTilt: -6 },
};

export const MO_HEAD: Pt = [34, -382];

/** Two-bone IK: elbow position for shoulder s, hand target h. bend = +1/-1 picks the side. */
export function ik(s: Pt, h: Pt, l1: number, l2: number, bend: number): Pt[] {
  const dx = h[0] - s[0];
  const dy = h[1] - s[1];
  const d = Math.min(l1 + l2 - 0.5, Math.max(Math.abs(l1 - l2) + 0.5, Math.hypot(dx, dy)));
  const th = Math.atan2(dy, dx);
  const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const el: Pt = [s[0] + Math.cos(th + bend * a) * l1, s[1] + Math.sin(th + bend * a) * l1];
  const hand: Pt = [s[0] + Math.cos(th) * d, s[1] + Math.sin(th) * d];
  return [s, el, hand];
}

/** Tufty outline: an ellipse whose rim alternates in and out. */
function furBlob(cx: number, cy: number, rx: number, ry: number, n: number, amp: number, seed: string): string {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = i % 2 === 0 ? 1 : 1 + amp * (0.5 + rnd(`${seed}${i}`) * 0.7);
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  return `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L")} Z`;
}

export const Mo: React.FC<MoProps> = ({
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
  expr = "deadpan",
  look,
  headTilt = 0,
  mopPhase = null,
  mop,
  lean = 0,
  armFree = [20, 40],
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 6 + energy * 3 : 0;
  // everything at half speed
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.5 : 0.12), 4) * (talking ? 5 : 3);
  const blink = expr === "shocked" || expr === "appalled" ? 0 : blinkAmount(t * 0.42, id, 2.4);
  const dart = saccade(t, id, 0.05, 2.6);
  const gaze: Pt = [(look?.[0] ?? 0.4) + dart[0], (look?.[1] ?? 0.1) + dart[1]];

  const geo = useMemo(
    () => ({
      belly: furBlob(0, -160, 98, 104, 46, 0.07, id + "belly"),
      chest: furBlob(8, -276, 78, 76, 40, 0.08, id + "chest"),
      head: furBlob(0, -4, 70, 64, 40, 0.09, id + "head"),
      face: blob(22, 10, 50, 44, 12, 0.05, id + "face"),
      algae: Array.from({ length: 7 }).map((_, i) => [rnd(`${id}ax${i}`) * 150 - 80, -80 - rnd(`${id}ay${i}`) * 250, 8 + rnd(`${id}ar${i}`) * 14] as const),
      strands: Array.from({ length: 13 }).map((_, i) => ({ dx: (i - 6) * 9, len: 34 + rnd(`${id}ms${i}`) * 22, k: rnd(`${id}mk${i}`) })),
    }),
    [id],
  );

  // mop
  const phase = mopPhase ?? 0;
  const swing = mopPhase === null ? 0 : Math.sin(phase);
  const mopHead: Pt = mop ? mop.head : [178 + swing * 46, -8];
  const mopTop: Pt = mop ? mop.top : [104 + swing * 12, -292];
  const along = (k: number): Pt => [mopHead[0] + (mopTop[0] - mopHead[0]) * k, mopHead[1] + (mopTop[1] - mopHead[1]) * k];
  const hasMop = mop !== false;
  const shF: Pt = [48, -318];
  const shB: Pt = [-30, -322];
  const armB = hasMop ? ik(shB, along(0.94), 104, 100, 1) : ik(shB, [shB[0] + 60, shB[1] + 150], 104, 100, 1);
  const freeTarget: Pt = [shF[0] + Math.sin((armFree[0] * Math.PI) / 180) * 150, shF[1] + Math.cos((armFree[0] * Math.PI) / 180) * 150];
  const armF = hasMop ? ik(shF, along(0.64), 104, 100, 1) : ik(shF, freeTarget, 104, 100, 1);
  const head: Pt = [MO_HEAD[0], MO_HEAD[1] + bob * 0.5];
  const s = flip ? -scale : scale;

  const claws = (h: Pt, key: string, around: boolean) => {
    const a = Math.atan2(mopTop[1] - mopHead[1], mopTop[0] - mopHead[0]);
    return (
      <g key={key}>
        <circle cx={h[0]} cy={h[1]} r={17} fill={FUR_DK} stroke={INK} strokeWidth={4} />
        {[-10, 0, 10].map((o, i) => {
          const px = h[0] + Math.cos(a) * o;
          const py = h[1] + Math.sin(a) * o;
          const d = around ? `M${px},${py - 4} q22,4 20,24` : `M${px},${py} q16,14 8,34`;
          return (
            <g key={i}>
              <path d={d} stroke={INK} strokeWidth={9} fill="none" strokeLinecap="round" />
              <path d={d} stroke={CLAW} strokeWidth={4.5} fill="none" strokeLinecap="round" />
            </g>
          );
        })}
      </g>
    );
  };

  const moth = (() => {
    const mx = head[0] - 60 + noise2D(id + "mothx", t * 0.6, 0) * 70;
    const my = head[1] - 70 + noise2D(id + "mothy", 0, t * 0.6) * 40;
    const flap = Math.floor(t * 18) % 2 === 0;
    return (
      <g transform={`translate(${mx} ${my})`}>
        <path d={flap ? "M0,0 L-14,-12 L-16,4 Z M0,0 L14,-12 L16,4 Z" : "M0,0 L-16,-3 L-12,8 Z M0,0 L16,-3 L12,8 Z"} fill="#9a8a6a" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        <ellipse cx={0} cy={0} rx={3} ry={6} fill="#5a4a34" />
      </g>
    );
  })();

  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={20} cy={4} rx={130} o={0.33} />
      {/* dirty mop water */}
      {hasMop && mopHead[1] > -40 ? <path d={blob(mopHead[0] - 10, 2, 120, 16, 10, 0.25, id + "puddle")} fill="#5c5a3a" opacity={0.45} /> : null}
      {/* legs */}
      {[
        [-34, -80, -40, -16],
        [30, -80, 38, -16],
      ].map(([x0, y0, x1, y1], i) => (
        <DLine key={i} d={`M${x0},${y0} Q${x0 - 14},${(y0 + y1) / 2} ${x1},${y1}`} w={34} color={i ? FUR : FUR_DK} ow={4.5} />
      ))}
      {[-40, 38].map((fx, i) => (
        <g key={i} transform={`translate(${fx} -10)`}>
          <ellipse cx={8} cy={0} rx={22} ry={10} fill={FUR_DK} stroke={INK} strokeWidth={4} />
          <path d="M22,-2 q14,2 16,14 M16,2 q12,4 12,14" stroke={CLAW} strokeWidth={4} fill="none" strokeLinecap="round" />
        </g>
      ))}
      <g transform={`rotate(${lean} 0 -90)`}>
        {/* back arm */}
        <DLine d={`M${armB[0][0]},${armB[0][1]} Q${armB[1][0]},${armB[1][1]} ${armB[2][0]},${armB[2][1]}`} w={30} color={mixHex(FUR, "#000000", 0.18)} ow={4.5} />
        {/* body: stroke layer then fill layer so the two tufty blobs read as one */}
        <path d={geo.belly} fill="none" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <path d={geo.chest} fill="none" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <path d={geo.belly} fill={FUR} />
        <path d={geo.chest} fill={FUR} />
        {geo.algae.map(([ax, ay, ar], i) => (
          <path key={i} d={blob(ax, ay, ar, ar * 0.7, 7, 0.4, `${id}alg${i}`)} fill={ALGAE} opacity={0.55} />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${-70 + i * 12},${-120 - i * 30} q-10,14 -4,28`} stroke={FUR_DK} strokeWidth={3} fill="none" />
        ))}
        {/* apron */}
        <path d="M6,-330 L62,-328 L70,-246 L94,-236 L100,-74 Q40,-60 -32,-74 L-26,-240 L0,-248 Z" fill={PURPLE} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M12,-322 L56,-320 L62,-252 L86,-242 L90,-84 Q40,-72 -24,-84 L-18,-244 L6,-252 Z" fill="none" stroke={MUSTARD} strokeWidth={3} opacity={0.9} />
        <path d="M6,-330 L-6,-364 M62,-328 L56,-364" stroke={MUSTARD} strokeWidth={7} strokeLinecap="round" />
        <path d="M-90,-240 L-26,-242" stroke={MUSTARD_DK} strokeWidth={8} strokeLinecap="round" />
        <SkullBean x={36} y={-292} s={36} />
        <path d={blob(50, -120, 20, 12, 7, 0.4, id + "ast")} fill="#4a4a2a" opacity={0.5} />
        <g transform="translate(-62 -300) rotate(-8)">
          <rect x={0} y={0} width={44} height={22} rx={4} fill="#f2ead6" stroke={INK} strokeWidth={3} />
          <Unflip flip={flip} cx={22}>
            <text x={22} y={17} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={15} fill={PURPLE_DK}>
              MO
            </text>
          </Unflip>
        </g>
        {/* head */}
        <g transform={`translate(${head[0]} ${head[1]}) rotate(${tilt})`}>
          <path d={geo.head} fill={FUR} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={geo.face} fill={FACE} stroke={INK} strokeWidth={4} />
          {/* sloth mask stripes */}
          <path d="M44,-8 C40,-18 20,-18 12,-10 C2,-2 -12,8 -28,16 C-14,22 2,18 16,10 C30,6 42,2 44,-8 Z" fill={STRIPE} />
          <path d="M62,-14 C68,-20 80,-16 82,-8 C80,-2 72,2 64,0 Z" fill={STRIPE} />
          <Eye id={`${id}-eN`} seed={`${id}N`} cx={30} cy={-6} rx={10} ry={10} look={gaze} pupil={e.pupil} sclera="#ece4cf" lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={e.lidAngle} lidColor={STRIPE} sw={3.5} veins={1} />
          <Eye id={`${id}-eF`} seed={`${id}F`} cx={70} cy={-8} rx={7} ry={7} look={gaze} pupil={e.pupil} sclera="#ece4cf" lidTop={Math.max(e.lidTop, blink)} lidBottom={e.lidBottom} lidAngle={-e.lidAngle} lidColor={STRIPE} sw={3} />
          {/* fur brows */}
          {[
            [30, -6, 12, 1],
            [70, -8, 8, -1],
          ].map(([cx, cy, rx, side], i) => {
            const by = cy - rx - 8 - e.brow * 5 - (expr === "judging" && i === 0 ? 7 : 0);
            const dy = Math.tan((e.browTilt * Math.PI) / 180) * rx * (side > 0 ? 1 : -1);
            return <path key={i} d={`M${cx - rx - 2},${by - dy} L${cx + rx + 2},${by + dy}`} stroke={FUR_DK} strokeWidth={7} strokeLinecap="round" />;
          })}
          <ellipse cx={60} cy={14} rx={13} ry={9} fill="#231a16" stroke={INK} strokeWidth={3} />
          <ellipse cx={56} cy={11} rx={4} ry={2.5} fill="#fff" opacity={0.6} />
          <g transform="rotate(-4 50 34)">
            <Mouth id={`${id}-mouth`} seed={`${id}m`} x={50} y={34} w={36} maxOpen={30} shape={mouth} smile={e.smile} teeth="flat" toothColor="#e2d9bb" lip="#8a7258" sw={4} />
          </g>
          {/* hairnet */}
          <path d="M-62,-14 C-60,-62 52,-76 66,-24" fill={NET} fillOpacity={0.18} stroke={NET} strokeWidth={3} />
          <g stroke={NET} strokeWidth={1.8} opacity={0.85} fill="none">
            {[-40, -20, 0, 20, 40].map((o) => (
              <path key={`a${o}`} d={`M${o - 20},-62 L${o + 18},-16`} />
            ))}
            {[-40, -20, 0, 20, 40].map((o) => (
              <path key={`b${o}`} d={`M${o + 20},-64 L${o - 16},-14`} />
            ))}
          </g>
          <path d="M-64,-12 C-30,-24 30,-30 68,-22" stroke="#dcd8ce" strokeWidth={6} fill="none" strokeLinecap="round" />
          {expr === "angry" ? (
            <g stroke="#a3262a" strokeWidth={3.5} fill="none" strokeLinecap="round">
              <path d="M-30,-40 l8,-6 l-2,-8 l8,-4" />
              <path d="M44,-44 l-6,-6 l4,-8" />
            </g>
          ) : null}
        </g>
        {moth}
        {/* mop */}
        {hasMop ? (
          <g>
            <path d={`M${mopHead[0]},${mopHead[1] - 20} L${mopTop[0]},${mopTop[1]}`} stroke={INK} strokeWidth={17} strokeLinecap="round" />
            <path d={`M${mopHead[0]},${mopHead[1] - 20} L${mopTop[0]},${mopTop[1]}`} stroke="#b08a52" strokeWidth={9} strokeLinecap="round" />
            <rect x={mopHead[0] - 26} y={mopHead[1] - 34} width={52} height={20} rx={6} fill="#7a7c80" stroke={INK} strokeWidth={4} transform={`rotate(${(Math.atan2(mopTop[0] - mopHead[0], -(mopTop[1] - mopHead[1])) * 180) / Math.PI} ${mopHead[0]} ${mopHead[1] - 24})`} />
            {geo.strands.map(({ dx, len, k }, i) => {
              const sway = swing * 14 * (0.5 + k);
              return (
                <path
                  key={i}
                  d={`M${mopHead[0] + dx * 0.6},${mopHead[1] - 18} q${dx * 0.6 - sway},${len * 0.5} ${dx * 1.3 - sway * 1.6},${len}`}
                  stroke={i % 3 === 0 ? "#6a6650" : "#8e8a72"}
                  strokeWidth={7}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
            {claws(armB[2], "cB", true)}
          </g>
        ) : (
          claws(armB[2], "cB", false)
        )}
        {/* front arm */}
        <DLine d={`M${armF[0][0]},${armF[0][1]} Q${armF[1][0]},${armF[1][1]} ${armF[2][0]},${armF[2][1]}`} w={30} color={FUR} ow={4.5} />
        <path d={`M${armF[1][0] - 10},${armF[1][1]} l-10,10 M${armF[1][0]},${armF[1][1] + 6} l-6,12`} stroke={FUR_DK} strokeWidth={3} />
        {claws(armF[2], "cF", hasMop)}
      </g>
    </g>
  );
};
