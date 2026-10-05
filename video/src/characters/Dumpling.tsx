import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import type { MouthShape } from "../engine/timeline";
import { Pt, blob, cloudPath, onN, rnd } from "../engine/util";
import { Eye, INK, Mouth, Shadow, blinkAmount } from "./parts";

/**
 * BROTHER DUMPLING — the enormous, smug believer.
 * A huge clean wool cloud with a tiny black face, slit-pupil goat-ish eyes,
 * big flat human teeth, oats stuck to his lips, and a red spray-painted X
 * on his side that he thinks marks him as "chosen". Faces left by default.
 * Origin = ground under the body.
 */

export type DumplingExpr = "smug" | "angry" | "suspicious" | "dreamy" | "laugh" | "neutral" | "snooty" | "shocked";

export interface DumplingProps {
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
  expr?: DumplingExpr;
  look?: Pt;
  headTilt?: number;
  /** chew sideways when not talking */
  chewing?: boolean;
  /** 0..1 belly inflation gag */
  girth?: number;
  /** spray oats out of mouth (shouting) */
  spray?: number;
  /** a bib (vision scene) */
  bib?: boolean;
  /** hide the X (e.g. lambs reuse) */
  noX?: boolean;
}

const WOOL = "#efe7d3";
const WOOL_SH = "#d3c9b1";
const FACE = "#2b2325";
const FACE_HI = "#3f3537";

const EXPR: Record<DumplingExpr, { lidTop: number; lidBottom: number; lidAngle: number; smile: number; look: Pt; happy?: boolean }> = {
  smug: { lidTop: 0.46, lidBottom: 0.1, lidAngle: -4, smile: 0.5, look: [-0.3, 0] },
  neutral: { lidTop: 0.3, lidBottom: 0.08, lidAngle: 0, smile: 0.15, look: [-0.3, 0] },
  angry: { lidTop: 0.4, lidBottom: 0.12, lidAngle: 22, smile: -0.4, look: [-0.5, 0] },
  suspicious: { lidTop: 0.5, lidBottom: 0.28, lidAngle: 12, smile: -0.1, look: [-0.75, 0] },
  dreamy: { lidTop: 0.5, lidBottom: 0.05, lidAngle: -12, smile: 0.7, look: [0, -0.7] },
  laugh: { lidTop: 1, lidBottom: 0, lidAngle: 0, smile: 0.8, look: [0, 0], happy: true },
  snooty: { lidTop: 0.85, lidBottom: 0.05, lidAngle: -6, smile: -0.05, look: [0.4, -0.3] },
  shocked: { lidTop: 0.0, lidBottom: 0.0, lidAngle: 0, smile: -0.3, look: [-0.2, 0] },
};

export const Dumpling: React.FC<DumplingProps> = ({
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
  chewing = true,
  girth = 0,
  spray = 0,
  bib = false,
  noX = false,
}) => {
  const e = EXPR[expr];
  const f2 = onN(frame, 2);
  const t2 = f2 / 24;
  const breath = Math.sin(t2 * 1.6) * 0.018;
  const open = mouth === "D" ? 1 : mouth === "C" || mouth === "H" ? 0.6 : mouth === "E" ? 0.45 : mouth === "B" ? 0.2 : 0;
  const bob = talking ? open * 6 + energy * 4 : 0;
  const tilt = headTilt + noise2D(id + "tilt", t2 * (talking ? 0.9 : 0.35), 2) * (talking ? 6 : 2.5);

  const chewOn = chewing && !talking;
  const chewPhase = Math.sin(t2 * 8.5);
  const mouthShape: MouthShape = chewOn ? (chewPhase > 0.2 ? "B" : chewPhase > -0.4 ? "X" : "A") : mouth;
  const chewSkew = chewOn ? chewPhase * 9 : 0;
  const blink = e.happy ? 0 : blinkAmount(t, id, 3.6);
  const gaze: Pt = look ?? e.look;
  const bodyScale = 1 + girth * 0.35;

  const geo = useMemo(() => {
    const curls: Array<{ x: number; y: number; r: number; a: number }> = [];
    for (let i = 0; i < 26; i++) {
      const a = rnd(`${id}ca${i}`) * Math.PI * 2;
      const rr = Math.sqrt(rnd(`${id}cr${i}`));
      curls.push({ x: 20 + Math.cos(a) * 190 * rr, y: -215 + Math.sin(a) * 140 * rr, r: 9 + rnd(`${id}cs${i}`) * 9, a: rnd(`${id}crot${i}`) * 360 });
    }
    const crumbs: Array<[number, number, number]> = [];
    for (let i = 0; i < 9; i++) {
      crumbs.push([(rnd(`${id}ox${i}`) - 0.5) * 120, 40 + rnd(`${id}oy${i}`) * 55, rnd(`${id}orot${i}`) * 180]);
    }
    return {
      body: cloudPath(20, -215, 222, 168, 26, id + "body"),
      bodyIn: cloudPath(24, -205, 200, 145, 22, id + "bodyin", 0.6),
      toupee: cloudPath(0, -78, 62, 30, 12, id + "toupee", 1.1),
      face: blob(0, 4, 74, 84, 14, 0.04, id + "face"),
      curls,
      crumbs,
    };
  }, [id]);

  const sprayParticles: React.ReactNode[] = [];
  if (spray > 0) {
    for (let i = 0; i < 26; i++) {
      const a = (-0.9 + rnd(`${id}sa${i}`) * 1.4) * Math.PI;
      const sp = 120 + rnd(`${id}ss${i}`) * 420;
      const d = spray * sp;
      const px = -Math.abs(Math.cos(a)) * d - 20;
      const py = 45 + Math.sin(a) * d * 0.5 + spray * spray * 160;
      sprayParticles.push(
        <ellipse key={i} cx={px} cy={py} rx={6} ry={3.5} fill="#d9c28c" stroke={INK} strokeWidth={1.5} transform={`rotate(${i * 37} ${px} ${py})`} opacity={1 - spray * 0.6} />,
      );
    }
  }

  const s = flip ? -scale : scale;

  const legsFar = (
    <g fill="#1a1415" stroke={INK} strokeWidth={4}>
      <rect x={-90} y={-80} width={30} height={80} rx={10} />
      <rect x={110} y={-80} width={30} height={80} rx={10} />
    </g>
  );
  const legsNear = (
    <g fill="#231b1c" stroke={INK} strokeWidth={5}>
      <rect x={-145} y={-78} width={34} height={78} rx={11} />
      <rect x={60} y={-78} width={34} height={78} rx={11} />
      <rect x={-149} y={-10} width={42} height={14} rx={4} fill="#0e0a0a" />
      <rect x={56} y={-10} width={42} height={14} rx={4} fill="#0e0a0a" />
    </g>
  );

  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${scale})`}>
      <Shadow cx={10} cy={0} rx={250 * bodyScale} o={0.45} />
      {legsFar}
      <g transform={`translate(20 -60) scale(${bodyScale * (1 - breath * 0.5)} ${bodyScale * (1 + breath)}) translate(-20 60)`}>
        {/* tail nub */}
        <path d={cloudPath(238, -250, 22, 18, 7, id + "tail")} fill={WOOL} stroke={INK} strokeWidth={5} />
        <path d={geo.body} fill={WOOL} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={geo.bodyIn} fill={WOOL_SH} opacity={0.35} transform="translate(12 30)" />
        {geo.curls.map((c, i) => (
          <path
            key={i}
            d={`M${-c.r},0 a${c.r},${c.r * 0.8} 0 1 1 ${c.r * 1.2},${c.r * 0.4}`}
            transform={`translate(${c.x} ${c.y}) rotate(${c.a})`}
            fill="none"
            stroke="#b9ae95"
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}
        {/* the farmer's spray-paint X */}
        {!noX ? (
          <g opacity={0.92}>
            <path d="M40,-300 C70,-260 110,-210 150,-150" fill="none" stroke="#a5121a" strokeWidth={30} strokeLinecap="round" />
            <path d="M150,-302 C120,-262 80,-210 40,-152" fill="none" stroke="#a5121a" strokeWidth={28} strokeLinecap="round" />
            {[
              [62, -262, 38],
              [128, -270, 26],
              [96, -214, 52],
              [58, -170, 34],
              [140, -168, 44],
            ].map(([dx, dy, len], i) => (
              <g key={i}>
                <line x1={dx} y1={dy} x2={dx} y2={dy + len} stroke="#a5121a" strokeWidth={6} strokeLinecap="round" />
                <circle cx={dx} cy={dy + len} r={5} fill="#a5121a" />
              </g>
            ))}
          </g>
        ) : null}
        {bib ? (
          <g>
            <path d="M-230,-240 C-180,-230 -150,-180 -160,-110 C-200,-80 -260,-100 -280,-150 C-280,-200 -260,-235 -230,-240 Z" fill="#f7f4ea" stroke={INK} strokeWidth={5} />
            <path d="M-250,-170 l16,10 l-6,16 l14,4" fill="none" stroke="#c23b3b" strokeWidth={4} />
          </g>
        ) : null}
      </g>
      {legsNear}
      {/* head */}
      <g transform={`translate(${-212} ${-292 + bob * 0.5}) rotate(${tilt})`}>
        {/* floppy ears */}
        <path d="M-60,-40 C-100,-52 -140,-38 -146,-18 C-128,-4 -92,-12 -62,-18 Z" fill={FACE} stroke={INK} strokeWidth={5} />
        <path d="M-66,-32 C-96,-38 -122,-30 -130,-20 C-112,-14 -90,-18 -68,-24 Z" fill="#5a3b3d" />
        <path d="M60,-40 C100,-52 140,-38 146,-18 C128,-4 92,-12 62,-18 Z" fill={FACE} stroke={INK} strokeWidth={5} />
        <path d={geo.face} fill={FACE} stroke={INK} strokeWidth={6} />
        {/* chubby cheeks */}
        <ellipse cx={-44} cy={40} rx={26} ry={20} fill={FACE_HI} />
        <ellipse cx={44} cy={40} rx={26} ry={20} fill={FACE_HI} />
        <path d={geo.toupee} fill={WOOL} stroke={INK} strokeWidth={5} />
        {e.happy ? (
          <>
            <Eye id={`${id}-eL`} seed={`${id}L`} cx={-30} cy={-16} rx={22} ry={18} lidColor={FACE} happyClosed />
            <Eye id={`${id}-eR`} seed={`${id}R`} cx={30} cy={-16} rx={22} ry={18} lidColor={FACE} happyClosed />
          </>
        ) : (
          <>
            <Eye
              id={`${id}-eL`}
              seed={`${id}L`}
              cx={-30}
              cy={-18}
              rx={23}
              ry={19}
              kind="slit"
              look={gaze}
              iris="#d6a93c"
              sclera="#e6d7a8"
              lidTop={Math.max(e.lidTop, blink)}
              lidBottom={e.lidBottom}
              lidAngle={-e.lidAngle}
              lidColor={FACE}
              rot={-6}
            />
            <Eye
              id={`${id}-eR`}
              seed={`${id}R`}
              cx={30}
              cy={-18}
              rx={23}
              ry={19}
              kind="slit"
              look={gaze}
              iris="#d6a93c"
              sclera="#e6d7a8"
              lidTop={Math.max(e.lidTop, blink)}
              lidBottom={e.lidBottom}
              lidAngle={e.lidAngle}
              lidColor={FACE}
              rot={6}
            />
          </>
        )}
        {/* nostrils */}
        <ellipse cx={-12} cy={20} rx={5} ry={4} fill="#120c0c" />
        <ellipse cx={12} cy={20} rx={5} ry={4} fill="#120c0c" />
        <Mouth
          id={`${id}-mouth`}
          seed={`${id}m`}
          x={0}
          y={48 + bob * 0.3}
          w={88}
          maxOpen={56}
          shape={mouthShape}
          smile={e.smile}
          teeth="flat"
          toothColor="#f3efe2"
          lip="#4b3a3c"
          inside="#1d0909"
          skew={chewSkew}
        />
        {/* oats stuck around the mouth */}
        {geo.crumbs.slice(0, 6).map(([cx, cy, r], i) => (
          <ellipse key={i} cx={cx * 0.7} cy={cy + 6} rx={5.5} ry={3.2} fill="#d9c28c" stroke={INK} strokeWidth={1.5} transform={`rotate(${r} ${cx * 0.7} ${cy + 6})`} />
        ))}
        {sprayParticles}
      </g>
    </g>
  );
};
