import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import { Cam, Stage, camLerp } from "../../engine/Stage";
import { Pt, blob, clamp, easeIn, easeInOut, easeOut, lerp, onN, prog, rnd } from "../../engine/util";
import { Ferret, SkeeterProps } from "./cast/Ferret";
import { FONT, PackageBox } from "./cast/props";
import { useSpeech } from "./livingroom";

/* EPISODE 006 cutaways: the doorbell-cam footage of the theft, the unboxing close-up, and the next-morning punchline. */

/* ------------------------------------------------------------------ */
/* The porch, as the doorbell camera sees it                           */
/* ------------------------------------------------------------------ */

/** porch depth: y on screen -> scale of a character standing there */
const depthScale = (y: number) => lerp(0.42, 1.25, clamp((y - 420) / 640));

const Porch: React.FC<{ t: number; day: boolean; box: boolean; scratches?: number }> = ({ t, day, box, scratches = 0 }) => {
  const boards = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let i = -14; i <= 14; i++) {
      const xTop = 960 + i * 70;
      const xBot = 960 + i * 210;
      out.push(<path key={i} d={`M${xTop},430 L${xTop + (xBot - xTop) * 1.75},2300`} stroke={day ? "#6e6a62" : "#2c3a2a"} strokeWidth={5} />);
    }
    return out;
  }, [day]);
  return (
    <g>
      {/* yard + street beyond the steps */}
      <rect x={-1200} y={-1400} width={4400} height={1840} fill={day ? "#9aa6a8" : "#0f1a12"} />
      <rect x={-600} y={260} width={3200} height={180} fill={day ? "#5d7a46" : "#162a18"} />
      {/* picket fence + streetlight */}
      {Array.from({ length: 30 }).map((_, i) => (
        <path key={i} d={`M${-300 + i * 90},300 l0,-60 l14,-16 l14,16 l0,60 Z`} fill={day ? "#e8e4da" : "#2e4a30"} stroke={INK} strokeWidth={3} />
      ))}
      <path d="M1500,280 L1500,-200 L1580,-220" stroke={day ? "#4a4a4a" : "#203020"} strokeWidth={10} fill="none" />
      <circle cx={1580} cy={-210} r={16} fill={day ? "#ddd" : "#d8ffc8"} opacity={day ? 0.6 : 0.9} />
      {/* steps down to the walk */}
      {[0, 1, 2].map((i) => (
        <rect key={i} x={760 - i * 30} y={350 + i * 30} width={400 + i * 60} height={30} fill={day ? "#8a857a" : "#24321f"} stroke={INK} strokeWidth={4} />
      ))}
      {/* porch floor in perspective */}
      <path d="M-600,430 L2520,430 L4400,2300 L-2500,2300 Z" fill={day ? "#8f8a7e" : "#1c2a1c"} />
      {boards}
      <path d="M-600,430 L2520,430" stroke={INK} strokeWidth={6} />
      {/* porch posts */}
      {[180, 1740].map((px, i) => (
        <g key={i}>
          <rect x={px - 26} y={-1200} width={52} height={1640} fill={day ? "#e8e2d4" : "#2c3e2c"} stroke={INK} strokeWidth={5} />
          <rect x={px - 34} y={400} width={68} height={40} fill={day ? "#d8d2c4" : "#263826"} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {/* potted fern */}
      <g transform="translate(330 760)">
        <path d="M-60,0 L60,0 L46,110 L-46,110 Z" fill={day ? "#b0603a" : "#2a3a24"} stroke={INK} strokeWidth={5} />
        {Array.from({ length: 9 }).map((_, i) => (
          <path key={i} d={`M0,0 q${-80 + i * 20},-80 ${-120 + i * 30},${-40 + (i % 2) * 20}`} stroke={day ? "#4a7a3a" : "#3a5a32"} strokeWidth={10} fill="none" strokeLinecap="round" />
        ))}
      </g>
      {/* garden gnome — it's a mule */}
      <g transform="translate(1560 700)">
        <path d="M-40,0 L40,0 L30,-90 L-30,-90 Z" fill={day ? "#3a6aa8" : "#2e4a3a"} stroke={INK} strokeWidth={4} />
        <path d={blob(0, -120, 34, 30, 9, 0.05, "gnomehead")} fill={day ? "#8d7d6e" : "#3a4a3a"} stroke={INK} strokeWidth={4} />
        <path d="M-34,-140 L0,-230 L34,-140 Z" fill={day ? "#c0312b" : "#3a4a32"} stroke={INK} strokeWidth={4} />
        <path d="M-18,-112 Q6,-92 30,-108" stroke={INK} strokeWidth={4} fill="#f3e8c4" />
        <circle cx={-8} cy={-128} r={5} fill="#f6f1e1" stroke={INK} strokeWidth={2} />
      </g>
      {/* welcome mat */}
      <g transform="translate(960 930)">
        <path d="M-300,-70 L300,-70 L360,110 L-360,110 Z" fill={day ? "#9a7a4a" : "#2a3a22"} stroke={INK} strokeWidth={5} />
        <text x={0} y={46} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={66} fill={day ? "#5a3a1a" : "#5a7a4a"} transform="scale(1 0.8)">
          COME ON IN!
        </text>
      </g>
      {box ? <PackageBox x={960} y={860} w={210} h={150} rot={-3} detail={false} /> : null}
      {scratches > 0
        ? [0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${720 + i * 22},${980 - i * 6} L${lerp(720 + i * 22, 300 + i * 30, scratches)},${lerp(980, 1300, scratches)}`} stroke={day ? "#4a4038" : "#0a140a"} strokeWidth={6} strokeLinecap="round" />
          ))
        : null}
      {/* moths around the porch light */}
      {!day
        ? [0, 1, 2].map((i) => (
            <circle key={i} cx={1580 + Math.sin(t * 7 + i * 2) * 50} cy={-200 + Math.cos(t * 5 + i) * 30} r={5} fill="#c8f0b8" />
          ))
        : null}
    </g>
  );
};

/** Fisheye mask + camera UI, drawn in screen space. */
const CamUI: React.FC<{ stamp: string; label: string; t: number; motion?: boolean; notify?: number }> = ({ stamp, label, t, motion = true, notify = 0 }) => {
  const { width: SW, height: SH } = useVideoConfig();
  const portrait = SH > SW;
  const r = Math.hypot(SW, SH) * 0.52;
  const fs = portrait ? 46 : 40;
  const pad = portrait ? 60 : 44;
  const blinkOn = Math.floor(t * 2) % 2 === 0;
  const ny = lerp(-260, portrait ? 220 : 120, easeOut(clamp(notify)));
  return (
    <g>
      <defs>
        <radialGradient id="fisheye6" gradientUnits="userSpaceOnUse" cx={SW / 2} cy={SH / 2} r={r}>
          <stop offset="0.62" stopColor="#000" stopOpacity={0} />
          <stop offset="0.9" stopColor="#000" stopOpacity={0.75} />
          <stop offset="1" stopColor="#000" stopOpacity={1} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={SW} height={SH} fill="url(#fisheye6)" />
      {Array.from({ length: Math.ceil(SH / 8) }).map((_, i) => (
        <rect key={i} x={0} y={i * 8} width={SW} height={2} fill="#000" opacity={0.12} />
      ))}
      <text x={pad} y={pad + fs} fontFamily={FONT} fontWeight={900} fontSize={fs} fill="#f2f2f2" stroke="#000" strokeWidth={6} paintOrder="stroke">
        {label}
      </text>
      <text x={pad} y={pad + fs * 2.2} fontFamily="monospace" fontWeight={700} fontSize={fs * 0.9} fill="#f2f2f2" stroke="#000" strokeWidth={6} paintOrder="stroke">
        {stamp}
      </text>
      <circle cx={SW - pad - fs * 2.6} cy={pad + fs * 0.65} r={fs * 0.35} fill="#ff3030" opacity={blinkOn ? 1 : 0.25} />
      <text x={SW - pad} y={pad + fs} textAnchor="end" fontFamily={FONT} fontWeight={900} fontSize={fs} fill="#f2f2f2" stroke="#000" strokeWidth={6} paintOrder="stroke">
        REC
      </text>
      {motion && blinkOn ? (
        <text x={SW / 2} y={portrait ? pad + fs * 3.6 : pad + fs} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={fs * 0.85} fill="#ffe14a" stroke="#000" strokeWidth={6} paintOrder="stroke">
          MOTION DETECTED
        </text>
      ) : null}
      {notify > 0 ? (
        <g transform={`translate(${SW / 2} ${ny})`}>
          <rect x={portrait ? -470 : -440} y={-70} width={portrait ? 940 : 880} height={140} rx={34} fill="#f7f5f0" stroke="#000" strokeWidth={5} />
          {/* box icon + check */}
          <g transform={`translate(${portrait ? -380 : -350} 0)`}>
            <rect x={-38} y={-30} width={76} height={60} rx={6} fill="#c8935a" stroke="#000" strokeWidth={4} />
            <path d="M-38,-8 L38,-8 M0,-30 L0,-8" stroke="#000" strokeWidth={4} />
            <circle cx={34} cy={24} r={20} fill="#2fbf5a" stroke="#000" strokeWidth={4} />
            <path d="M24,24 l7,8 l13,-16" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <text x={portrait ? -300 : -270} y={-8} fontFamily={FONT} fontWeight={900} fontSize={portrait ? 50 : 46} fill="#111">
            Package delivered
          </text>
          <text x={portrait ? -300 : -270} y={42} fontFamily="Arial, Helvetica, sans-serif" fontWeight={700} fontSize={portrait ? 32 : 30} fill="#666">
            Front Porch · just now
          </text>
        </g>
      ) : null}
    </g>
  );
};

const clock = (base: number, t: number) => {
  const s = Math.floor(base + t);
  const hh = Math.floor(s / 3600) % 12 || 12;
  const mm = Math.floor(s / 60) % 60;
  const ss = s % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")} AM`;
};

/** "Caught you on my doorbell camera, walked right up to my porch and took my package." */
export const DoorbellTheft: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const ss = useSpeech("skeeter");
  const dur = shot.end - shot.start;
  // path: up the steps (far), across to the mat, grab, then up into the lens
  const kWalk = easeInOut(prog(local, 0.0, dur * 0.36));
  const grabbed = local > dur * 0.46;
  const kLens = easeIn(prog(local, dur * 0.62, dur * 0.8));
  const leave = prog(local, dur * 0.9, dur);
  // the lens moment: he leans right into the camera until his face fills the fisheye (head centred near 960, 470)
  const baseX = lerp(1360, 1110, kWalk);
  const baseY = lerp(470, 900, kWalk);
  const baseS = depthScale(baseY);
  const lensS = 3.1;
  const px = lerp(baseX, 960 + 36 * lensS, kLens) + leave * 1400;
  const py = lerp(baseY, 470 + 352 * lensS, kLens);
  const sc = lerp(baseS, lensS, kLens);
  const cam: Cam = camLerp({ x: 960, y: 560, zoom: 0.96 }, { x: 960, y: 600, zoom: 1.04 }, shot.p);
  const ferret: Partial<SkeeterProps> = {
    expr: kLens > 0.2 ? "sneak" : grabbed ? "sneak" : "shifty",
    hold: grabbed ? "boxUnder" : "none",
    sneak: grabbed || kLens > 0 ? 0 : 1,
    step: local * 1.6,
    look: kLens > 0.1 ? [0.05, 0.05] : [lerp(-0.6, 0.8, (Math.sin(local * 4) + 1) / 2), 0.4],
    armF: !grabbed && local > dur * 0.38 ? [70, 40] : undefined,
    lean: !grabbed && local > dur * 0.38 ? 18 : kLens * -10,
    headTilt: kLens * -8,
  };
  return (
    <>
      <Stage cam={cam} frame={frame} boil={2.4} overlay={<CamUI stamp={clock(2 * 3600 + 13 * 60 + 41, local)} label="FRONT PORCH" t={t} />}>
        <Porch t={t} day={false} box={!grabbed} />
        <Ferret id="skeeterCam" x={px} y={py} scale={sc} flip={!grabbed || kLens > 0} t={t} frame={frame} mouth={ss.mouth} {...ferret} />
        {/* lens smudge when his nose hits the glass */}
        {kLens > 0.85 ? <ellipse cx={600} cy={468} rx={120} ry={80} fill="#d8ffd0" opacity={0.22 * (1 - leave)} /> : null}
      </Stage>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* The unboxing close-up                                               */
/* ------------------------------------------------------------------ */

const BigPaw: React.FC<{ x: number; y: number; side: 1 | -1; grip: number; tremble: number; seed: string; frame: number; pick?: number }> = ({ x, y, side, grip, tremble, seed, frame, pick = 0 }) => {
  const f2 = onN(frame, 2);
  const jx = (rnd(`${seed}x${f2}`) - 0.5) * tremble * 10;
  const jy = (rnd(`${seed}y${f2}`) - 0.5) * tremble * 10;
  return (
    <g transform={`translate(${x + jx} ${y + jy}) scale(${side} 1)`}>
      {/* sleeve cuff from below */}
      <path d="M-120,420 L40,420 L70,120 L-70,90 Z" fill="#3f7c77" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M-74,140 L64,160 L72,100 L-66,74 Z" fill="#2b5a56" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={blob(0, 40, 92, 70, 10, 0.08, `${seed}palm`)} fill="#5b3d2b" stroke={INK} strokeWidth={8} />
      {[0, 1, 2, 3].map((i) => {
        const a = -0.9 + i * 0.42 + (i === 3 ? pick * 0.6 : 0);
        const len = 70 + grip * 20 - (i === 3 ? pick * 10 : 0);
        const p1: Pt = [Math.sin(a) * 60 + 20, -Math.cos(a) * 60 + 10];
        const p2: Pt = [p1[0] + Math.sin(a + 0.4) * len, p1[1] - Math.cos(a + 0.4) * len];
        return (
          <g key={i}>
            <path d={`M${p1[0]},${p1[1]} L${p2[0]},${p2[1]}`} stroke={INK} strokeWidth={44} strokeLinecap="round" />
            <path d={`M${p1[0]},${p1[1]} L${p2[0]},${p2[1]}`} stroke="#5b3d2b" strokeWidth={30} strokeLinecap="round" />
            <path d={`M${p2[0]},${p2[1]} l${Math.sin(a + 0.6) * 26},${-Math.cos(a + 0.6) * 26}`} stroke="#efe7d2" strokeWidth={10} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

/** The box in Skeeter's trembling paws: tape peel (0..1), flaps open (0..1) with a golden glow and packing peanuts. */
export const BoxInsert: React.FC<{ peel: number; open: number; from: Cam; to?: Cam }> = ({ peel, open, from, to }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = to ? camLerp(from, to, easeInOut(shot.p)) : from;
  const peanuts = useMemo(() => Array.from({ length: 26 }).map((_, i) => [rnd(`pn${i}`) - 0.5, rnd(`pnv${i}`), rnd(`pnr${i}`)] as const), []);
  const tapeLift = easeOut(clamp(peel));
  return (
    <Stage cam={cam} frame={frame}>
      {/* soft living room behind */}
      <rect x={-800} y={-800} width={3600} height={2800} fill="#3e2a1c" />
      {Array.from({ length: 30 }).map((_, i) => (
        <rect key={i} x={-800 + i * 130} y={-800} width={66} height={2800} fill="#4a3322" opacity={0.6} />
      ))}
      <circle cx={260} cy={160} r={240} fill="#f6c870" opacity={0.18} />
      {/* the box, huge */}
      {open > 0.1 ? (
        <g style={{ mixBlendMode: "screen" }} opacity={Math.min(1, open * 1.4)}>
          <defs>
            <radialGradient id="boxGlow6" gradientUnits="userSpaceOnUse" cx={960} cy={260} r={900}>
              <stop offset="0" stopColor="#fff2b0" stopOpacity={0.9} />
              <stop offset="0.4" stopColor="#ffcf5a" stopOpacity={0.35} />
              <stop offset="1" stopColor="#ffcf5a" stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect x={-800} y={-800} width={3600} height={2800} fill="url(#boxGlow6)" />
        </g>
      ) : null}
      <PackageBox x={960} y={600} w={980} h={640} rot={-1.5} open={open} glow={open > 0.1 ? Math.min(1, open * 1.3) : 0} />
      {open > 0.1 ? (
        <g style={{ mixBlendMode: "screen" }} opacity={Math.min(1, open * 1.2)}>
          <defs>
            <radialGradient id="boxGlowFront6" gradientUnits="userSpaceOnUse" cx={960} cy={290} r={560}>
              <stop offset="0" stopColor="#fff6c8" stopOpacity={0.85} />
              <stop offset="0.5" stopColor="#ffd75a" stopOpacity={0.3} />
              <stop offset="1" stopColor="#ffd75a" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={960} cy={290} rx={720} ry={420} fill="url(#boxGlowFront6)" />
          {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${960 + i * 60},290 L${960 + i * 260 - 70},-500 L${960 + i * 260 + 70},-500 Z`} fill="#fff2b0" opacity={0.16} />
          ))}
        </g>
      ) : null}
      {/* the tape peeling up */}
      {open < 0.05 ? (
        <path
          d={`M952,${280 + 236 - tapeLift * 236} L${952 + 66},${280 + 236 - tapeLift * 236} L${1030 + tapeLift * 80},${280 - tapeLift * 120} L${952 + tapeLift * 70},${280 - tapeLift * 140} Z`}
          fill="#e8d49a"
          stroke="#9c8650"
          strokeWidth={3}
          opacity={peel > 0 ? 1 : 0}
        />
      ) : null}
      {/* packing peanuts flying out */}
      {open > 0.05
        ? peanuts.map(([vx, vy, r], i) => {
            const k = clamp((open - 0.05) * 1.2);
            const px = 960 + vx * 1400 * k;
            const py = 280 - (400 + vy * 500) * k + 900 * k * k * 0.9;
            return <path key={i} d="M-22,-8 C-10,-20 10,4 22,-8 C26,6 10,16 0,10 C-10,16 -26,6 -22,-8 Z" transform={`translate(${px} ${py}) rotate(${r * 360 + t * 200})`} fill="#f4efe0" stroke={INK} strokeWidth={4} />;
          })
        : null}
      <BigPaw x={300} y={660} side={1} grip={1} tremble={1} seed="pawL" frame={frame} />
      <BigPaw x={1620} y={660} side={-1} grip={1} tremble={1} seed="pawR" frame={frame} pick={peel > 0 && peel < 1 ? Math.abs(Math.sin(t * 16)) : 0} />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Tail: the next morning on the porch cam                             */
/* ------------------------------------------------------------------ */

export const MorningAfter: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  // 0.25-1.25 run for it; 1.25 grabbed; 1.45-1.75 yanked back; 1.8 slam; 2.0+ notification
  const run = easeOut(prog(local, 0.25, 1.25));
  const grabbedAt = 1.25;
  const yank = easeIn(prog(local, 1.45, 1.75));
  const slam = local > 1.8 && local < 2.1 ? 1 - (local - 1.8) / 0.3 : 0;
  const px = lerp(560, 1080, run) - yank * 900;
  const py = lerp(1240, 760, run) + yank * 700;
  const sc = depthScale(py);
  const armK = easeOut(prog(local, 1.05, grabbedAt));
  const handX = lerp(-200, px - 150 * sc, armK);
  const handY = lerp(1500, py - 20, armK);
  return (
    <Stage cam={{ x: 960, y: 560, zoom: 0.96 }} frame={frame} boil={2.4} shakeAmp={slam * 26} overlay={<CamUI stamp={clock(6 * 3600 + 2 * 60 + 9, local)} label="FRONT PORCH" t={t} motion={local < 1.9} notify={prog(local, 2.05, 2.5)} />}>
      <Porch t={t} day box scratches={easeOut(prog(local, 1.5, 1.9))} />
      {/* a fresh package on the mat: the bait is reset */}
      <PackageBox x={960} y={860} w={210} h={150} rot={4} detail={false} />
      {local < 1.85 ? (
        <Ferret
          id="skeeterMorning"
          x={px}
          y={py}
          scale={sc}
          flip={false}
          t={t}
          frame={frame}
          mouth={yank > 0 ? "D" : "C"}
          talking
          expr={yank > 0 ? "startled" : "scared"}
          look={[0.9, -0.4]}
          sneak={yank > 0 ? 0 : 1}
          step={local * 3.2}
          lean={yank > 0 ? -20 : 26}
          armF={yank > 0 ? [160, 10] : [120, 30]}
          armB={yank > 0 ? [150, -10] : [-60, -20]}
          hat
          glitter={1}
          tremble={0.6}
          bristle={1}
        />
      ) : null}
      {/* the long mule arm in a mint sleeve, from below the camera */}
      {local > 1.0 && local < 1.85 ? (
        <g>
          <path d={`M-200,1500 Q${(handX - 200) / 2 - 60},${handY + 260} ${handX},${handY}`} stroke={INK} strokeWidth={86} fill="none" strokeLinecap="round" />
          <path d={`M-200,1500 Q${(handX - 200) / 2 - 60},${handY + 260} ${handX},${handY}`} stroke="#8d7d6e" strokeWidth={70} fill="none" strokeLinecap="round" />
          <path d={`M-200,1500 Q${(handX - 200) / 2 - 60},${handY + 260} ${handX},${handY}`} stroke="#6f6052" strokeWidth={8} strokeDasharray="14 22" fill="none" />
          <path d={`M-260,1660 L-60,1380`} stroke={INK} strokeWidth={150} strokeLinecap="round" />
          <path d={`M-260,1660 L-60,1380`} stroke="#cfe3c6" strokeWidth={134} strokeLinecap="round" />
          <circle cx={handX} cy={handY} r={36} fill="#8d7d6e" stroke={INK} strokeWidth={6} />
          {[-0.6, -0.2, 0.2, 0.6].map((a, i) => (
            <path key={i} d={`M${handX},${handY} l${Math.cos(a) * 50},${Math.sin(a) * 50 - 10}`} stroke={INK} strokeWidth={20} strokeLinecap="round" />
          ))}
          {[-0.6, -0.2, 0.2, 0.6].map((a, i) => (
            <path key={i} d={`M${handX},${handY} l${Math.cos(a) * 50},${Math.sin(a) * 50 - 10}`} stroke="#8d7d6e" strokeWidth={10} strokeLinecap="round" />
          ))}
        </g>
      ) : null}
    </Stage>
  );
};
