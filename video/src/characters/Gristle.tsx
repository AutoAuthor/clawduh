import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import type { MouthShape } from "../engine/timeline";
import { Pt, blob, cloudPath, onN, smoothPath } from "../engine/util";
import { Eye, Flies, INK, Mouth, Shadow, blinkAmount, polyline, saccade } from "./parts";

/**
 * BROTHER GRISTLE — the gaunt one who has "seen things".
 * Patchy half-shorn wool, visible ribs, knobbly legs, bulging bloodshot eyes,
 * crooked yellow teeth, torn ear with a farm tag, a faded "2nd place" fair rosette.
 * Faces right by default. Origin = ground between the hooves.
 */

export type GristleExpr = "neutral" | "worried" | "intense" | "sad" | "scared" | "manic" | "pleading";

export interface GristleProps {
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
  expr?: GristleExpr;
  look?: Pt;
  headTilt?: number;
  /** 0..1 extra eye bulge */
  bulge?: number;
  flies?: boolean;
  /** chewing oats with mouth closed (ending) */
  chewing?: boolean;
  /** hide the body (head-only close ups still need it — but saves work in inserts) */
  headOnly?: boolean;
  /** oat crumbs stuck to his lips (ending) */
  crumbs?: boolean;
}

const SKIN = "#bba79c";
const SKIN_DK = "#9a857b";
const MUZZLE = "#c8a99f";
const WOOL = "#cdc4ae";
const WOOL_DK = "#a69c86";

const EXPR: Record<GristleExpr, { lidTop: number; lidBottom: number; lidAngle: number; brow: number; pupil: number; smile: number }> = {
  neutral: { lidTop: 0.16, lidBottom: 0.08, lidAngle: 0, brow: 0, pupil: 0.22, smile: -0.1 },
  worried: { lidTop: 0.1, lidBottom: 0.06, lidAngle: -8, brow: 1, pupil: 0.2, smile: -0.35 },
  intense: { lidTop: 0.3, lidBottom: 0.14, lidAngle: 14, brow: -1, pupil: 0.18, smile: -0.2 },
  sad: { lidTop: 0.38, lidBottom: 0.05, lidAngle: -14, brow: 1.2, pupil: 0.24, smile: -0.5 },
  scared: { lidTop: 0.0, lidBottom: 0.0, lidAngle: 0, brow: 1.5, pupil: 0.13, smile: -0.4 },
  manic: { lidTop: 0.0, lidBottom: 0.0, lidAngle: 6, brow: -0.6, pupil: 0.11, smile: 0.35 },
  pleading: { lidTop: 0.05, lidBottom: 0.1, lidAngle: -16, brow: 1.6, pupil: 0.3, smile: -0.45 },
};

export const Gristle: React.FC<GristleProps> = ({
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
  bulge = 0,
  flies = true,
  chewing = false,
  headOnly = false,
  crumbs = false,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;

  // breathing + nervous tremble
  const breath = Math.sin(t2 * 2.1) * 0.012;
  const tremble = expr === "scared" || expr === "manic" ? 1.6 : 0.5;
  const jx = noise2D(id + "jx", t2 * 2.5, 0) * tremble;
  const jy = noise2D(id + "jy", 0, t2 * 2.5) * tremble;
  // talking head-bob follows mouth openness
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 5 + energy * 3 : 0;
  const tilt = headTilt + (talking ? noise2D(id + "tilt", t2 * 0.8, 1) * 5 : noise2D(id + "tilt", t2 * 0.3, 1) * 2);

  const blink = expr === "manic" || expr === "scared" ? 0 : blinkAmount(t, id, 2.6);
  const dart = saccade(t, id, expr === "scared" || expr === "manic" ? 0.5 : 0.22, expr === "manic" ? 0.35 : 0.8);
  const gaze: Pt = [(look?.[0] ?? 0.2) + dart[0], (look?.[1] ?? 0) + dart[1]];
  const twitch = expr === "intense" || expr === "manic" ? (Math.floor(t * 24) % 37 < 3 ? 0.35 : 0) : 0;

  const chew = chewing ? Math.sin(t2 * 10) : 0;
  const mouthShape: MouthShape = chewing ? (chew > 0.3 ? "B" : "X") : mouth;

  const geo = useMemo(() => {
    const torso: Pt[] = [
      [-175, -232],
      [-152, -262],
      [-112, -268],
      [-72, -260],
      [-32, -271],
      [8, -261],
      [50, -273],
      [90, -262],
      [118, -236],
      [124, -200],
      [100, -168],
      [62, -158],
      [20, -149],
      [-30, -146],
      [-82, -155],
      [-130, -160],
      [-168, -180],
      [-184, -206],
    ];
    const head: Pt[] = [
      [0, -96],
      [44, -90],
      [70, -62],
      [74, -22],
      [62, 18],
      [54, 56],
      [48, 92],
      [24, 110],
      [0, 114],
      [-24, 110],
      [-46, 92],
      [-50, 56],
      [-58, 18],
      [-70, -22],
      [-66, -62],
      [-40, -90],
    ];
    return {
      torso: smoothPath(torso),
      head: smoothPath(head),
      woolBack: cloudPath(-112, -254, 58, 26, 11, id + "wb"),
      woolShoulder: cloudPath(-6, -264, 40, 18, 9, id + "ws"),
      woolRump: cloudPath(-166, -214, 26, 30, 8, id + "wr"),
      woolNeck: cloudPath(78, -252, 34, 22, 8, id + "wn"),
      tuft: cloudPath(0, -96, 46, 20, 10, id + "tuft", 1.2),
      cheekL: blob(-44, 30, 14, 26, 7, 0.15, id + "ckl"),
      cheekR: blob(46, 26, 13, 26, 7, 0.15, id + "ckr"),
    };
  }, [id]);

  const s = flip ? -scale : scale;

  const legs = (far: boolean) => {
    const col = far ? SKIN_DK : SKIN;
    const rear: Pt[] = far
      ? [
          [-112, -172],
          [-128, -88],
          [-118, -8],
        ]
      : [
          [-142, -170],
          [-160, -86],
          [-148, -8],
        ];
    const front: Pt[] = far
      ? [
          [68, -170],
          [72, -88],
          [66, -8],
        ]
      : [
          [96, -172],
          [104, -90],
          [98, -8],
        ];
    return (
      <g>
        {[rear, front].map((pts, i) => (
          <g key={i}>
            <path d={polyline(pts)} fill="none" stroke={INK} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M${pts[1][0] - 1},${pts[1][1] - 5} L${pts[1][0] + 1},${pts[1][1] + 5}`} stroke={INK} strokeWidth={31} strokeLinecap="round" />
            <path d={polyline(pts)} fill="none" stroke={col} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />
            <path d={`M${pts[1][0] - 1},${pts[1][1] - 5} L${pts[1][0] + 1},${pts[1][1] + 5}`} stroke={col} strokeWidth={22} strokeLinecap="round" />
            <path
              d={`M${pts[2][0] - 14},${pts[2][1] - 6} L${pts[2][0] + 14},${pts[2][1] - 6} L${pts[2][0] + 16},${pts[2][1] + 8} L${pts[2][0] - 16},${pts[2][1] + 8} Z`}
              fill="#2a1d18"
              stroke={INK}
              strokeWidth={4}
            />
          </g>
        ))}
      </g>
    );
  };

  const head = (
    <g transform={`translate(${178 + jx} ${-392 + jy + bob * 0.4}) rotate(${tilt})`}>
      {/* ears */}
      <path d="M-60,-58 C-95,-62 -132,-44 -134,-26 C-120,-18 -88,-30 -62,-36 Z" fill={SKIN} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M-66,-50 C-92,-50 -116,-38 -122,-30 C-104,-28 -88,-34 -68,-40 Z" fill="#cf9993" />
      <path
        d="M58,-62 C92,-70 124,-58 130,-44 L118,-42 L124,-34 C108,-26 84,-34 60,-40 Z"
        fill={SKIN}
        stroke={INK}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <rect x={92} y={-44} width={26} height={21} rx={3} fill="#d9b938" stroke={INK} strokeWidth={4} transform="rotate(12 105 -34)" />
      <text x={97} y={-28} fontSize={13} fontFamily="monospace" fontWeight="bold" fill={INK} transform="rotate(12 105 -34)">
        07
      </text>
      {/* skull */}
      <path d={geo.head} fill={SKIN} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={geo.cheekL} fill={SKIN_DK} opacity={0.55} />
      <path d={geo.cheekR} fill={SKIN_DK} opacity={0.55} />
      {/* muzzle */}
      <path d="M-48,46 C-44,86 -26,110 0,112 C26,110 46,86 50,46 C30,58 -28,58 -48,46 Z" fill={MUZZLE} opacity={0.9} />
      {/* forehead creases */}
      <path d={`M-30,${-68 - e.brow * 3} Q0,${-74 - e.brow * 5} 30,${-68 - e.brow * 3}`} fill="none" stroke="#7a645b" strokeWidth={3} strokeLinecap="round" />
      <path d={`M-22,${-80 - e.brow * 3} Q0,${-85 - e.brow * 4} 24,${-80 - e.brow * 3}`} fill="none" stroke="#7a645b" strokeWidth={2.5} strokeLinecap="round" />
      {/* wool tuft */}
      <path d={geo.tuft} fill={WOOL} stroke={INK} strokeWidth={5} />
      <path d="M-10,-110 q-8,-22 4,-34 M8,-112 q10,-18 2,-30 M24,-104 q14,-10 10,-26" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      {/* eye bags */}
      <path d="M-52,-2 Q-28,16 -4,-2" fill="none" stroke="#6d5650" strokeWidth={4} strokeLinecap="round" />
      <path d="M-48,8 Q-28,22 -10,8" fill="none" stroke="#6d5650" strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
      <path d="M6,-2 Q32,18 60,-4" fill="none" stroke="#6d5650" strokeWidth={4} strokeLinecap="round" />
      <path d="M12,9 Q32,24 54,8" fill="none" stroke="#6d5650" strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
      {/* eyes */}
      <Eye
        id={`${id}-eyeL`}
        seed={`${id}L`}
        cx={-28}
        cy={-30}
        rx={27 * (1 + bulge * 0.25)}
        ry={31 * (1 + bulge * 0.25)}
        look={gaze}
        pupil={e.pupil * (1 - bulge * 0.35)}
        veins={7}
        lidTop={Math.max(e.lidTop, blink)}
        lidBottom={e.lidBottom}
        lidAngle={-e.lidAngle}
        lidColor={SKIN}
        sclera="#efe7cf"
      />
      <Eye
        id={`${id}-eyeR`}
        seed={`${id}R`}
        cx={32}
        cy={-32}
        rx={31 * (1 + bulge * 0.25)}
        ry={35 * (1 + bulge * 0.25)}
        look={gaze}
        pupil={e.pupil * (1 - bulge * 0.35)}
        veins={8}
        lidTop={Math.max(e.lidTop + twitch, blink)}
        lidBottom={e.lidBottom}
        lidAngle={e.lidAngle}
        lidColor={SKIN}
        sclera="#efe7cf"
      />
      {/* brow ridges */}
      <path
        d={`M-56,${-66 + e.brow * 2} L-10,${-70 - e.brow * 9}`}
        fill="none"
        stroke="#4a3934"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path d={`M10,${-72 - e.brow * 9} L62,${-68 + e.brow * 2}`} fill="none" stroke="#4a3934" strokeWidth={7} strokeLinecap="round" />
      {/* nostrils */}
      <ellipse cx={-14} cy={52} rx={5.5} ry={9} fill="#3a2420" transform="rotate(-22 -14 52)" />
      <ellipse cx={16} cy={51} rx={5.5} ry={9} fill="#3a2420" transform="rotate(22 16 51)" />
      {/* stubble */}
      {[
        [-34, 70],
        [-28, 84],
        [30, 72],
        [36, 86],
        [-20, 96],
        [22, 98],
        [-38, 92],
        [40, 60],
      ].map(([sx, sy], i) => (
        <circle key={i} cx={sx} cy={sy} r={1.8} fill="#5a4640" />
      ))}
      <Mouth
        id={`${id}-mouth`}
        seed={`${id}m`}
        x={2}
        y={80 + bob * 0.3}
        w={64}
        maxOpen={48}
        shape={mouthShape}
        smile={e.smile}
        teeth="crooked"
        lip="#a5837a"
        skew={chewing ? chew * 5 : 0}
      />
      {crumbs
        ? [
            [-30, 78, 20],
            [-18, 92, 70],
            [24, 86, 140],
            [36, 74, 30],
            [6, 98, 100],
            [-40, 96, 160],
          ].map(([cx, cy, r], i) => (
            <ellipse key={i} cx={cx + (chewing ? chew * 3 : 0)} cy={cy} rx={6} ry={3.4} fill="#d9c28c" stroke={INK} strokeWidth={1.5} transform={`rotate(${r} ${cx} ${cy})`} />
          ))
        : null}
      {/* scraggly chin hairs */}
      <path d="M-6,112 q-4,14 2,24 M4,113 q6,12 0,22" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );

  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      {!headOnly ? (
        <>
          <Shadow cx={-20} cy={0} rx={200} o={0.45} />
          {legs(true)}
          <g transform={`translate(0 -150) scale(1 ${1 + breath}) translate(0 150)`}>
            {/* tail */}
            <path d="M-182,-214 q-24,-6 -30,10 M-183,-210 q-20,6 -18,24 M-180,-220 q-22,-18 -34,-8" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
            <path d={geo.torso} fill={SKIN} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            {/* belly shadow */}
            <path d="M-150,-168 C-90,-150 30,-146 96,-170 C40,-160 -80,-158 -150,-168 Z" fill={SKIN_DK} opacity={0.7} />
            {/* ribs */}
            {[-46, -18, 10, 38].map((rx, i) => (
              <path key={i} d={`M${rx},-246 Q${rx - 22},-210 ${rx - 10},-172`} fill="none" stroke="#86716a" strokeWidth={4} strokeLinecap="round" />
            ))}
            {/* patchy wool */}
            <path d={geo.woolBack} fill={WOOL} stroke={INK} strokeWidth={5} />
            <path d={geo.woolShoulder} fill={WOOL} stroke={INK} strokeWidth={5} />
            <path d={geo.woolRump} fill={WOOL} stroke={INK} strokeWidth={5} />
            <circle cx={-128} cy={-252} r={7} fill="#6b5236" opacity={0.7} />
            <circle cx={-96} cy={-244} r={4} fill="#6b5236" opacity={0.7} />
            <circle cx={-170} cy={-206} r={5} fill="#6b5236" opacity={0.7} />
            {/* neck */}
            <path d="M80,-258 C110,-300 140,-340 160,-352 L206,-332 C182,-300 150,-250 122,-220 Z" fill={SKIN} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d="M118,-290 q14,4 22,14 M128,-270 q12,4 18,12" fill="none" stroke="#86716a" strokeWidth={3} strokeLinecap="round" />
            <path d={geo.woolNeck} fill={WOOL_DK} stroke={INK} strokeWidth={5} />
            {/* fair rosette, faded */}
            <g transform="translate(118 -214) rotate(-8)">
              <path d="M-9,10 L-16,48 L-8,42 L-2,50 L2,12 Z" fill="#5d7896" stroke={INK} strokeWidth={3} />
              <path d="M6,10 L4,50 L10,42 L18,48 L14,8 Z" fill="#4f6884" stroke={INK} strokeWidth={3} />
              <path d={cloudPath(0, 0, 17, 17, 12, id + "ros", 0.7)} fill="#6d8aab" stroke={INK} strokeWidth={3} />
              <circle r={9} fill="#e8dfc0" stroke={INK} strokeWidth={2.5} />
              <text x={-7} y={4} fontSize={9} fontWeight="bold" fontFamily="sans-serif" fill={INK}>
                2nd
              </text>
            </g>
          </g>
          {legs(false)}
        </>
      ) : null}
      {head}
      {flies ? <Flies cx={150} cy={-420} t={t} r={110} seed={id + "fl"} count={3} /> : null}
    </g>
  );
};
