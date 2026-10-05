import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import type { MouthShape } from "../engine/timeline";
import { Pt, blob, onN, rnd, smoothPath } from "../engine/util";
import { Eye, INK, Mouth, Shadow, blinkAmount, saccade } from "./parts";

/**
 * CRUMPET — the defiant house cat ("your favorite son").
 * Plump grey tabby, notched right ear, slit-pupil yellow eyes, human teeth with fangs,
 * a bent whisker and a red collar with a heart tag. Sits facing left by default.
 * Origin = where his bum meets the counter.
 */

export type CatExpr = "smug" | "innocent" | "stern" | "taunt" | "sprayed" | "drenched" | "neutral";

export interface CatProps {
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
  expr?: CatExpr;
  look?: Pt;
  headTilt?: number;
  /** 0..1 raise the front paw to the chest ("your favorite son") */
  pawChest?: number;
  /** 0..1 point the front paw forward ("I challenge you") */
  pawPoint?: number;
  /** 0..1 rear up / puff the chest */
  rear?: number;
  /** 0..1 fur explodes outward (sprayed) */
  poof?: number;
  /** 0..1 soaked */
  wet?: number;
}

const FUR = "#8d929a";
const FUR_DK = "#5d626a";
const WHITE = "#ece7dc";
const IRIS = "#c6d147";

const EXPR: Record<CatExpr, { lidTop: number; lidBottom: number; lidAngle: number; smile: number; pupil: number }> = {
  neutral: { lidTop: 0.2, lidBottom: 0.05, lidAngle: 0, smile: 0.1, pupil: 0.16 },
  smug: { lidTop: 0.44, lidBottom: 0.08, lidAngle: -8, smile: 0.5, pupil: 0.1 },
  innocent: { lidTop: 0.0, lidBottom: 0.0, lidAngle: -10, smile: 0.25, pupil: 0.56 },
  stern: { lidTop: 0.3, lidBottom: 0.1, lidAngle: 20, smile: -0.15, pupil: 0.08 },
  taunt: { lidTop: 0.12, lidBottom: 0.04, lidAngle: 10, smile: 0.65, pupil: 0.07 },
  sprayed: { lidTop: 1, lidBottom: 0, lidAngle: 0, smile: -0.6, pupil: 0.1 },
  drenched: { lidTop: 0.55, lidBottom: 0.22, lidAngle: -14, smile: -0.55, pupil: 0.3 },
};

export const Cat: React.FC<CatProps> = ({
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
  expr = "smug",
  look,
  headTilt = 0,
  pawChest = 0,
  pawPoint = 0,
  rear = 0,
  poof = 0,
  wet = 0,
}) => {
  const e = EXPR[expr];
  const t2 = onN(frame, 2) / 24;
  const breath = Math.sin(t2 * 2.4) * 0.015;
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 6 + energy * 3 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.9 : 0.35), 4) * (talking ? 5 : 2);
  const blink = expr === "sprayed" || expr === "innocent" ? 0 : blinkAmount(t, id, 3.1);
  const dart = saccade(t, id, expr === "drenched" ? 0.25 : 0.1, 1.1);
  const gaze: Pt = [(look?.[0] ?? -0.4) + dart[0], (look?.[1] ?? 0) + dart[1]];
  const fur = wet > 0 ? mixHex(FUR, "#5f6770", wet) : FUR;
  const furDk = wet > 0 ? mixHex(FUR_DK, "#3c434c", wet) : FUR_DK;
  const flat = 1 - wet * 0.06;
  const earTwitch = Math.floor(t * 24) % 71 < 3 ? -12 : 0;
  const tailFlick = Math.sin(t2 * 3.2) * 18 + noise2D(id + "tail", t2, 0) * 10;

  const geo = useMemo(() => {
    const body: Pt[] = [
      [-112, -8],
      [-128, -92],
      [-112, -182],
      [-72, -242],
      [0, -262],
      [72, -246],
      [118, -186],
      [138, -100],
      [132, -18],
      [60, 2],
      [-60, 2],
    ];
    const spikes: Pt[] = [];
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2;
      const r = i % 2 === 0 ? 1.0 : 1.22 + rnd(`${id}sp${i}`) * 0.18;
      spikes.push([Math.cos(a) * 150 * r, -130 + Math.sin(a) * 140 * r]);
    }
    const headSpikes: Pt[] = [];
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2;
      const r = i % 2 === 0 ? 1.0 : 1.25 + rnd(`${id}hs${i}`) * 0.2;
      headSpikes.push([Math.cos(a) * 128 * r, Math.sin(a) * 108 * r]);
    }
    return {
      body: smoothPath(body),
      head: blob(0, 0, 124, 100, 16, 0.05, id + "head"),
      spikes: `M${spikes.map((p) => p.join(",")).join(" L")} Z`,
      headSpikes: `M${headSpikes.map((p) => p.join(",")).join(" L")} Z`,
    };
  }, [id]);

  const s = flip ? -scale : scale;
  const tailPts: Pt[] = [
    [118, -34],
    [150, -10],
    [90, 8],
    [-40, 10],
    [-130 + tailFlick * 0.3, -6],
    [-168 + tailFlick, -44 - Math.abs(tailFlick) * 0.4],
  ];
  const tail = smoothPath(tailPts, false);

  // front legs (paw raise / point animate the near leg)
  const nearLeg: Pt[] =
    pawPoint > 0
      ? [
          [-60, -150],
          [-60 - 70 * pawPoint, -150 - 40 * pawPoint],
          [-60 - 150 * pawPoint, -160 - 70 * pawPoint],
        ]
      : [
          [-60, -150],
          [-62 + 30 * pawChest, -80 - 90 * pawChest],
          [-64 + 70 * pawChest, -10 - 190 * pawChest],
        ];

  const drips: React.ReactNode[] = [];
  if (wet > 0) {
    for (let i = 0; i < 10; i++) {
      const ph = (t * (0.9 + rnd(`${id}dr${i}`) * 0.7) + rnd(`${id}do${i}`)) % 1;
      const dx = -140 + rnd(`${id}dx${i}`) * 260;
      const dy = -420 + rnd(`${id}dy${i}`) * 300 + ph * 160;
      drips.push(<ellipse key={i} cx={dx} cy={dy} rx={5} ry={9} fill="#9fd0f0" stroke={INK} strokeWidth={2} opacity={wet * (1 - ph)} />);
    }
  }

  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={0} cy={4} rx={170} o={0.35} />
      {poof > 0 ? <path d={geo.spikes} fill={fur} stroke={INK} strokeWidth={5} transform={`scale(${1 + poof * 0.12})`} opacity={poof} /> : null}
      {/* tail */}
      <path d={tail} fill="none" stroke={INK} strokeWidth={40} strokeLinecap="round" />
      <path d={tail} fill="none" stroke={fur} strokeWidth={30} strokeLinecap="round" />
      <path d={tail} fill="none" stroke={furDk} strokeWidth={30} strokeLinecap="round" strokeDasharray="14 26" />
      <g transform={`translate(0 -10) scale(${1 + rear * 0.04 - breath * 0.4} ${(1 + rear * 0.12 + breath) * flat}) translate(0 10)`}>
        {/* far front leg */}
        <path d="M-10,-140 L-8,-12" stroke={INK} strokeWidth={42} strokeLinecap="round" />
        <path d="M-10,-140 L-8,-12" stroke={furDk} strokeWidth={32} strokeLinecap="round" />
        <path d={geo.body} fill={fur} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* tabby stripes */}
        {[
          "M78,-226 q20,30 8,64",
          "M108,-170 q16,30 4,60",
          "M118,-110 q12,26 0,52",
          "M30,-252 q14,24 4,50",
        ].map((d, i) => (
          <path key={i} d={d} fill="none" stroke={furDk} strokeWidth={10} strokeLinecap="round" />
        ))}
        <ellipse cx={92} cy={-62} rx={62} ry={56} fill={fur} stroke={INK} strokeWidth={5} />
        <path d="M70,-96 q22,10 34,40" fill="none" stroke={furDk} strokeWidth={9} strokeLinecap="round" />
        <path d={blob(-30, -150, 56, 78, 10, 0.08, id + "bib")} fill={WHITE} />
        {/* near front leg */}
        <path d={smoothPath(nearLeg, false)} fill="none" stroke={INK} strokeWidth={44} strokeLinecap="round" strokeLinejoin="round" />
        <path d={smoothPath(nearLeg, false)} fill="none" stroke={fur} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx={nearLeg[2][0]} cy={nearLeg[2][1]} rx={24} ry={15} fill={WHITE} stroke={INK} strokeWidth={4} />
        <ellipse cx={-8} cy={-8} rx={24} ry={14} fill={WHITE} stroke={INK} strokeWidth={4} />
        {/* collar + heart tag */}
        <path d="M-108,-228 Q-20,-196 72,-230" fill="none" stroke="#b5262b" strokeWidth={16} strokeLinecap="round" />
        <g transform="translate(-26 -196)">
          <path d="M0,10 C-22,-6 -14,-22 0,-12 C14,-22 22,-6 0,10 Z" fill="#e3b33c" stroke={INK} strokeWidth={3} />
        </g>
      </g>
      {/* head */}
      <g transform={`translate(${-18} ${-332 - rear * 26 + bob * 0.4}) rotate(${tilt}) scale(1 ${flat})`}>
        {poof > 0 ? <path d={geo.headSpikes} fill={fur} stroke={INK} strokeWidth={5} transform={`scale(${1 + poof * 0.1})`} opacity={poof} /> : null}
        {/* ears */}
        <g transform={`rotate(${earTwitch * 0.5 - wet * 40} -80 -60)`}>
          <path d="M-112,-48 L-92,-128 L-40,-78 Z" fill={fur} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d="M-100,-62 L-90,-108 L-58,-78 Z" fill="#d79a9a" />
        </g>
        <g transform={`rotate(${earTwitch - wet * 40} 60 -60)`}>
          <path d="M36,-80 L80,-132 L104,-50 Z" fill={fur} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d="M56,-110 L68,-96 L62,-112 Z" fill="#000" opacity={0.85} />
          <path d="M52,-80 L78,-112 L92,-60 Z" fill="#d79a9a" />
        </g>
        <path d={geo.head} fill={fur} stroke={INK} strokeWidth={6} />
        {/* cheek fluff */}
        <path d="M-122,10 l-22,10 l20,6 l-16,14 l24,0" fill={fur} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path d="M122,10 l22,10 l-20,6 l16,14 l-24,0" fill={fur} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        {/* tabby M */}
        <path d="M-36,-92 L-24,-64 L-8,-88 L6,-62 L22,-90" fill="none" stroke={furDk} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
        {expr === "sprayed" ? (
          <g stroke={INK} strokeWidth={9} strokeLinecap="round" fill="none">
            <path d="M-78,-30 L-44,-14 L-78,2" />
            <path d="M62,-30 L28,-14 L62,2" />
          </g>
        ) : (
          <>
            <Eye
              id={`${id}-eL`}
              seed={`${id}L`}
              cx={-48}
              cy={-14}
              rx={31}
              ry={28}
              kind="vslit"
              iris={IRIS}
              sclera="#dfe69a"
              look={gaze}
              pupil={e.pupil}
              lidTop={Math.max(e.lidTop, blink)}
              lidBottom={e.lidBottom}
              lidAngle={-e.lidAngle}
              lidColor={fur}
            />
            <Eye
              id={`${id}-eR`}
              seed={`${id}R`}
              cx={42}
              cy={-16}
              rx={31}
              ry={28}
              kind="vslit"
              iris={IRIS}
              sclera="#dfe69a"
              look={gaze}
              pupil={e.pupil}
              lidTop={Math.max(e.lidTop, blink)}
              lidBottom={e.lidBottom}
              lidAngle={e.lidAngle}
              lidColor={fur}
            />
            {expr === "innocent" ? (
              <>
                <circle cx={-56} cy={-22} r={6} fill="#fff" />
                <circle cx={34} cy={-24} r={6} fill="#fff" />
              </>
            ) : null}
          </>
        )}
        {/* muzzle */}
        <ellipse cx={-22} cy={34} rx={32} ry={24} fill={WHITE} stroke={INK} strokeWidth={3} />
        <ellipse cx={18} cy={34} rx={32} ry={24} fill={WHITE} stroke={INK} strokeWidth={3} />
        <path d="M-12,14 L12,14 L0,28 Z" fill="#d77d8a" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        {[-34, -26, -16, 10, 22, 32].map((dx, i) => (
          <circle key={i} cx={dx} cy={40 + (i % 2) * 6} r={2.2} fill="#7a7068" />
        ))}
        <Mouth
          id={`${id}-mouth`}
          seed={`${id}m`}
          x={-2}
          y={64 + bob * 0.3}
          w={66}
          maxOpen={52}
          shape={expr === "sprayed" ? "D" : mouth}
          smile={e.smile}
          teeth="crooked"
          toothColor="#efe8cf"
          lip="#6b5a5a"
          fangs
          scream={expr === "sprayed" ? 1.25 : 1}
        />
        {/* whiskers (one bent) */}
        <g stroke={INK} strokeWidth={2.6} strokeLinecap="round" fill="none" opacity={0.9}>
          <path d="M-48,32 L-160,14" />
          <path d="M-48,40 L-166,40" />
          <path d="M-48,48 L-118,62 L-150,92" />
          <path d="M44,32 L154,14" />
          <path d="M44,40 L162,40" />
          <path d="M44,48 L158,66" />
        </g>
        {wet > 0 ? (
          <g opacity={wet}>
            <path d="M-96,-60 l-6,30 M-70,-80 l-2,26 M40,-84 l4,28 M80,-60 l8,26" stroke={INK} strokeWidth={4} strokeLinecap="round" />
            <ellipse cx={-90} cy={-10} rx={8} ry={12} fill="#9fd0f0" stroke={INK} strokeWidth={2} />
            <ellipse cx={70} cy={10} rx={7} ry={11} fill="#9fd0f0" stroke={INK} strokeWidth={2} />
          </g>
        ) : null}
      </g>
      {drips}
    </g>
  );
};

/** Linear blend between two #rrggbb colours. */
function mixHex(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, "0")).join("")}`;
}
