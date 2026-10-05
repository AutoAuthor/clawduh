import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { Flies, INK, StinkLines, taperPath } from "../../characters/parts";
import { Raccoon } from "../../characters/Raccoon";
import { useEpisode } from "../../engine/context";
import { Cam, LightWash, Stage, camLerp } from "../../engine/Stage";
import { Pt, blob, cloudPath, easeInOut, easeOut, lerp, onN, rnd } from "../../engine/util";
import { useSpeech } from "./grill";

/* EPISODE 004 cutaways: the exterior, Chet's office flashback, the printer room, the wall of shame, Dale from behind. */

const FONT = "Arial Black, Arial, Helvetica, sans-serif";

/* ------------------------------------------------------------------ */
/* Exterior: the ROADKILL GRILL at night                               */
/* ------------------------------------------------------------------ */

const Neon: React.FC<{ x: number; y: number; size: number; color: string; text: string; on?: number; anchor?: "start" | "middle" | "end" }> = ({
  x,
  y,
  size,
  color,
  text,
  on = 1,
  anchor = "middle",
}) => (
  <g opacity={0.25 + on * 0.75}>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT} fontWeight={900} fontSize={size} fill="none" stroke={color} strokeWidth={size * 0.22} opacity={0.25 * on}>
      {text}
    </text>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT} fontWeight={900} fontSize={size} fill="none" stroke={color} strokeWidth={size * 0.08}>
      {text}
    </text>
    <text x={x} y={y} textAnchor={anchor} fontFamily={FONT} fontWeight={900} fontSize={size} fill="none" stroke="#fff6f0" strokeWidth={size * 0.025} opacity={on}>
      {text}
    </text>
  </g>
);

export const ExteriorScene: React.FC<{ from: Cam; to?: Cam; blast?: number }> = ({ from, to, blast = 0 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = to ? camLerp(from, to, easeInOut(shot.p)) : from;
  const f3 = onN(frame, 3);
  const flick = (k: string) => (rnd(`${k}${Math.floor(f3 / 3)}`) < 0.12 + blast * 0.5 ? 0 : 1);
  const stars = useMemo(() => Array.from({ length: 50 }).map((_, i) => [rnd(`st${i}`) * 2400 - 240, rnd(`sty${i}`) * 420, 1 + rnd(`sts${i}`) * 2] as const), []);
  const truckX = lerp(-700, 2600, (shot.local * 0.45) % 1);
  const green = blast;
  return (
    <Stage cam={cam} frame={frame} shakeAmp={blast > 0.1 ? 9 * blast : 0} overlay={<LightWash id="neonwash" color="#ff5a6a" cx={1560} cy={240} r={700} opacity={0.18 + green * 0.1} />}>
      <defs>
        <linearGradient id="nightSky4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070912" />
          <stop offset="0.7" stopColor="#1d1630" />
          <stop offset="1" stopColor="#3a2238" />
        </linearGradient>
      </defs>
      <rect x={-800} y={-600} width={3600} height={1300} fill="url(#nightSky4)" />
      {stars.map(([sx, sy, r], i) => (
        <circle key={i} cx={sx} cy={sy} r={r} fill="#e8e4d0" opacity={0.6} />
      ))}
      <path d="M-800,640 L400,560 L900,610 L1500,540 L2800,630 L2800,700 L-800,700 Z" fill="#120e18" />
      {/* parking lot + road */}
      <rect x={-800} y={690} width={3600} height={100} fill="#2a2730" />
      <rect x={-800} y={780} width={3600} height={500} fill="#222128" />
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} x={-700 + i * 260} y={920} width={130} height={14} fill="#d9b42a" opacity={0.85} />
      ))}
      {/* fresh off the highway: something flat with a tyre track across it */}
      <g transform="translate(560 1010)">
        <path d={blob(0, 0, 110, 26, 12, 0.25, "roadkill")} fill="#4a3a30" stroke={INK} strokeWidth={4} />
        <path d="M-90,-6 L90,6" stroke="#1a1414" strokeWidth={22} strokeDasharray="12 8" />
        <path d="M70,-14 l10,-10 M80,-10 l12,-6" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <path d="M-60,-10 l-8,-8 l8,-6 l8,8 M-68,-18 l-8,6" stroke="#d8d0c0" strokeWidth={3} fill="none" />
      </g>
      {/* the building */}
      <rect x={480} y={380} width={940} height={320} fill="#5a4a46" stroke={INK} strokeWidth={8} />
      <rect x={460} y={350} width={980} height={44} fill="#a8352c" stroke={INK} strokeWidth={7} />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d={`M${470 + i * 82},352 l40,0 l-20,40 Z`} fill="#e8e0d0" opacity={0.85} />
      ))}
      <rect x={1200} y={300} width={70} height={56} fill="#6a6a70" stroke={INK} strokeWidth={5} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={540 + i * 170} y={460} width={140} height={150} fill={green > 0 ? mixC("#f2c86a", "#9fe25a", green) : "#f2c86a"} stroke={INK} strokeWidth={6} />
          <path d={`M${540 + i * 170},535 l140,0 M${610 + i * 170},460 l0,150`} stroke={INK} strokeWidth={4} />
        </g>
      ))}
      <rect x={1240} y={500} width={110} height={200} fill="#2a2426" stroke={INK} strokeWidth={6} />
      <rect x={1252} y={512} width={86} height={90} fill={green > 0 ? mixC("#f2c86a", "#9fe25a", green) : "#f2c86a"} opacity={0.8} />
      {/* pole sign */}
      <rect x={1630} y={300} width={30} height={420} fill="#3a3a40" stroke={INK} strokeWidth={5} />
      <g transform={`rotate(${blast * 6 * Math.sin(t * 30)} 1645 300)`}>
        <rect x={1390} y={80} width={520} height={240} rx={18} fill="#1b1520" stroke={INK} strokeWidth={8} />
        <Neon x={1650} y={180} size={84} color="#ff4a5a" text="ROADKILL" on={flick("n1")} />
        <Neon x={1650} y={278} size={78} color="#7af06a" text={blast > 0.5 ? "GRI L" : "GRILL"} on={flick("n2")} />
        {/* mascot on top: the grinning flat skunk */}
        <g transform="translate(1650 70)">
          <path d={blob(0, -40, 70, 50, 10, 0.08, "skunkTop")} fill="#1e1a1c" stroke={INK} strokeWidth={5} />
          <path d="M-20,-86 q20,-24 40,0 l-8,70 l-24,0 Z" fill="#f2efe6" />
          <path d="M-36,-48 l14,14 M-22,-48 l-14,14 M22,-48 l14,14 M36,-48 l-14,14" stroke="#f2efe6" strokeWidth={6} strokeLinecap="round" />
          <path d="M-24,-20 q24,18 48,0" stroke="#f2efe6" strokeWidth={6} fill="none" />
        </g>
      </g>
      <g transform="translate(1660 400)">
        <rect x={-120} y={-34} width={240} height={68} rx={10} fill="#1b1520" stroke={INK} strokeWidth={6} />
        <Neon x={0} y={14} size={36} color="#ffd24a" text="OPEN 24 HRS" on={flick("n3")} />
      </g>
      {/* truck passing with headlights */}
      <g transform={`translate(${truckX} 860)`}>
        <rect x={-260} y={-150} width={340} height={150} rx={10} fill="#3d4a5a" stroke={INK} strokeWidth={6} />
        <rect x={80} y={-120} width={130} height={120} rx={12} fill="#5a6a7a" stroke={INK} strokeWidth={6} />
        <rect x={130} y={-104} width={60} height={46} fill="#9fb6c9" stroke={INK} strokeWidth={4} />
        {[-180, 0, 150].map((wx, i) => (
          <circle key={i} cx={wx} cy={4} r={32} fill="#1a1a1e" stroke={INK} strokeWidth={5} />
        ))}
        <path d="M210,-40 L900,-120 L900,60 Z" fill="#fff6c8" opacity={0.18} />
        <circle cx={206} cy={-36} r={12} fill="#fff6c8" stroke={INK} strokeWidth={3} />
      </g>
      {/* the blast: windows flash green, stink pours out of every gap */}
      {blast > 0 ? (
        <g opacity={Math.min(1, blast * 1.4)}>
          {Array.from({ length: 10 }).map((_, i) => {
            const k = (i % 5) / 4;
            const ox = 560 + i * 90 + noise2D(`bx${i}`, t * 0.6, 0) * 40;
            const oy = 380 - easeOut(blast) * (120 + k * 260) - (i > 4 ? 60 : 0);
            return <path key={i} d={cloudPath(ox, oy, 120 + k * 60, 70 + k * 30, 8, `bl${i}`, 0.8)} fill="#9fcf5a" opacity={0.75} stroke={INK} strokeWidth={4} />;
          })}
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${600 + i * 170},${440 - blast * 30} q-20,-60 0,-120 q20,-60 0,-120`} stroke="#bfe27a" strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.7} />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const bx = 400 + i * 260 + blast * (i % 2 ? 300 : -260);
            const by = 200 - blast * 300 - i * 20;
            return <path key={i} d={`M${bx},${by} q14,-12 28,0 q14,-12 28,0`} stroke={INK} strokeWidth={5} fill="none" />;
          })}
        </g>
      ) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Chet's office flashback: someone microwaved fish                    */
/* ------------------------------------------------------------------ */

export const OfficeFish: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const sc = useSpeech("chet");
  const cam = camLerp({ x: 960, y: 540, zoom: 1.0 }, { x: 1010, y: 540, zoom: 1.12 }, easeInOut(shot.p));
  const spin = t * 240;
  return (
    <Stage cam={cam} frame={frame}>
      <rect x={-600} y={-600} width={3200} height={2400} fill="#b9b49e" />
      {/* cubicle walls + ceiling tiles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={-200 + i * 330} y={300} width={300} height={360} fill="#8b8f9a" stroke={INK} strokeWidth={5} />
      ))}
      <rect x={-600} y={-600} width={3200} height={700} fill="#d8d4c4" />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d={`M${-400 + i * 280},-600 L${-400 + i * 280},100`} stroke="#b0ac9c" strokeWidth={4} />
      ))}
      <rect x={-600} y={660} width={3200} height={900} fill="#7a7466" />
      {/* counter + microwave */}
      <rect x={760} y={560} width={760} height={360} fill="#a4927a" stroke={INK} strokeWidth={6} />
      <rect x={740} y={540} width={800} height={30} fill="#c9b89c" stroke={INK} strokeWidth={6} />
      <rect x={900} y={300} width={460} height={250} rx={14} fill="#e4e0d4" stroke={INK} strokeWidth={7} />
      <rect x={930} y={330} width={300} height={190} rx={8} fill="#2e2a1a" stroke={INK} strokeWidth={5} />
      <rect x={930} y={330} width={300} height={190} rx={8} fill="#e8d870" opacity={0.35} />
      {/* the fish, spinning on the turntable */}
      <g transform={`translate(1080 450) scale(${Math.cos((spin * Math.PI) / 180)} 1)`}>
        <path d="M-80,0 C-50,-40 40,-40 70,0 C40,40 -50,40 -80,0 Z" fill="#9aa6a8" stroke={INK} strokeWidth={5} />
        <path d="M70,0 L110,-30 L110,30 Z" fill="#8a9698" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={-50} cy={-8} r={9} fill="#fff" stroke={INK} strokeWidth={3} />
        <path d="M-56,-14 l12,12 M-44,-14 l-12,12" stroke={INK} strokeWidth={3} />
      </g>
      <ellipse cx={1080} cy={490} rx={120} ry={14} fill="#bfbab0" opacity={0.6} />
      <rect x={1250} y={340} width={90} height={170} rx={6} fill="#cfcabc" stroke={INK} strokeWidth={4} />
      <text x={1295} y={380} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={24} fill="#3a8a3a">
        {Math.max(0, 12 - Math.floor(shot.local * 9))
          .toString()
          .padStart(2, "0")}
      </text>
      {/* fumes */}
      {Array.from({ length: 6 }).map((_, i) => {
        const ph = (t * 0.5 + i / 6) % 1;
        const x = 980 + i * 50 + noise2D(`ff${i}`, t * 0.5, 0) * 30;
        return <path key={i} d={`M${x},${300 - ph * 260} q-24,-30 0,-60 q24,-30 0,-60`} stroke="#9fd05a" strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.75 * (1 - ph)} />;
      })}
      {/* the fridge sign everyone ignored */}
      <rect x={1580} y={180} width={300} height={600} rx={12} fill="#e8e4da" stroke={INK} strokeWidth={6} />
      <g transform="translate(1730 330) rotate(4)">
        <rect x={-110} y={-70} width={220} height={140} fill="#fff7a0" stroke={INK} strokeWidth={4} />
        <text x={0} y={-32} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={22} fill="#c0392b">
          NO FISH
        </text>
        <text x={0} y={-6} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={16} fill={INK}>
          IN THE MICROWAVE
        </text>
        <text x={0} y={30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill="#c0392b">
          !!!!!
        </text>
      </g>
      {/* young Chet, office job, tie and all, dying */}
      <Raccoon id="chetFb" x={500} y={980} scale={1.15} t={t} frame={frame} {...sc} expr="gag" cup={false} armF={[150, 10]} armB={[-20, 30]} />
      <path d="M494,626 L514,748 L536,626 Z" fill="#2c5aa0" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {/* coworker face-down on the floor */}
      <g transform="translate(1250 900)">
        <ellipse cx={0} cy={0} rx={160} ry={40} fill="#5a6a8a" stroke={INK} strokeWidth={5} />
        <circle cx={-170} cy={-10} r={44} fill="#e2c9a6" stroke={INK} strokeWidth={5} />
        <path d="M-186,-22 l14,14 M-172,-22 l-14,14 M-160,-22 l14,14 M-146,-22 l-14,14" stroke={INK} strokeWidth={3} />
        <path d="M100,-10 l60,-30" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      </g>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* The printer room: emergency khakis                                  */
/* ------------------------------------------------------------------ */

export const PrinterKhakis: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = camLerp({ x: 960, y: 600, zoom: 1.05 }, { x: 960, y: 420, zoom: 1.2 }, easeInOut(shot.p));
  const motes = useMemo(() => Array.from({ length: 26 }).map((_, i) => [800 + rnd(`m${i}`) * 320, rnd(`my${i}`) * 900, 2 + rnd(`mr${i}`) * 3] as const), []);
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="holy" color="#fff2c0" cx={960} cy={0} r={700} opacity={0.35} />}>
      <rect x={-600} y={-800} width={3200} height={2600} fill="#3a3a44" />
      <rect x={-600} y={760} width={3200} height={900} fill="#2a2a30" />
      {/* the divine beam */}
      <path d="M840,-800 L1080,-800 L1240,900 L680,900 Z" fill="#fff4c8" opacity={0.2} />
      {motes.map(([mx, my, r], i) => (
        <circle key={i} cx={mx + Math.sin(t + i) * 10} cy={(my + t * 20) % 900} r={r} fill="#fff6d0" opacity={0.6} />
      ))}
      {/* copier */}
      <rect x={720} y={560} width={480} height={300} rx={10} fill="#d6d0bc" stroke={INK} strokeWidth={7} />
      <rect x={760} y={520} width={400} height={50} rx={6} fill="#c6c0aa" stroke={INK} strokeWidth={6} />
      <rect x={1080} y={600} width={90} height={60} rx={6} fill="#3a4a3a" stroke={INK} strokeWidth={4} />
      <text x={1125} y={640} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={18} fill="#9fe08a">
        JAM
      </text>
      {/* the tower of folded khakis */}
      {Array.from({ length: 16 }).map((_, i) => {
        const wob = Math.sin(t * 2 + i * 0.6) * i * 0.4;
        const y = 506 - i * 34;
        return (
          <g key={i} transform={`translate(${960 + wob + (rnd(`k${i}`) - 0.5) * 30} ${y})`}>
            <rect x={-150} y={-30} width={300} height={34} rx={8} fill={i % 2 ? "#c9b07e" : "#c2a874"} stroke={INK} strokeWidth={4} />
            <path d="M-130,-14 L130,-14" stroke="#a28a5b" strokeWidth={3} />
            <rect x={-30} y={-28} width={14} height={10} fill="#8a7046" />
          </g>
        );
      })}
      <g transform="translate(960 640) rotate(-3)">
        <rect x={-130} y={-34} width={260} height={64} fill="#fff" stroke={INK} strokeWidth={4} />
        <text x={0} y={-6} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={24} fill="#c0392b">
          EMERGENCY
        </text>
        <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={24} fill={INK}>
          KHAKIS
        </text>
      </g>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* The wall of shame                                                   */
/* ------------------------------------------------------------------ */

const SHAME = [
  { name: "TODD", date: "3/14", col: "#c9a0a0", kind: "pig" },
  { name: "BRENDA", date: "4/02", col: "#a0b8c9", kind: "goat" },
  { name: "GARY", date: "5/19", col: "#b9c9a0", kind: "duck" },
  { name: "TODD AGAIN", date: "5/20", col: "#c9a0a0", kind: "pig" },
  { name: "THE INTERN", date: "6/11", col: "#c9bfa0", kind: "rat" },
  { name: "KEVIN", date: "7/04", col: "#b0a0c9", kind: "goat" },
  { name: "TODD (3)", date: "7/05", col: "#c9a0a0", kind: "pig" },
];

const Polaroid: React.FC<{ x: number; y: number; rot: number; p: (typeof SHAME)[number]; i: number }> = ({ x, y, rot, p, i }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-90} y={-100} width={180} height={210} fill="#f6f3ea" stroke={INK} strokeWidth={4} />
    <rect x={-76} y={-86} width={152} height={140} fill={p.col} />
    {/* tiny employee from behind, stained */}
    <g transform="translate(0 -10)">
      <path d="M-34,40 L-30,-10 L30,-10 L34,40 Z" fill="#c9b07e" stroke={INK} strokeWidth={3} />
      <path d={blob(0, 18, 22, 16, 8, 0.25, `ps${i}`)} fill="#6b4a1e" opacity={0.9} />
      <path d="M-30,-10 L-26,-50 L26,-50 L30,-10 Z" fill="#b23a2f" stroke={INK} strokeWidth={3} />
      {p.kind === "pig" ? <circle cx={0} cy={-66} r={22} fill="#e6a8a8" stroke={INK} strokeWidth={3} /> : null}
      {p.kind === "goat" ? <path d="M-18,-60 a18,18 0 1 0 36,0 a18,18 0 1 0 -36,0 M-14,-78 l-10,-16 M14,-78 l10,-16" fill="#e8e4d8" stroke={INK} strokeWidth={3} /> : null}
      {p.kind === "duck" ? <circle cx={0} cy={-66} r={20} fill="#f2d24a" stroke={INK} strokeWidth={3} /> : null}
      {p.kind === "rat" ? <path d="M-16,-60 a16,16 0 1 0 32,0 a16,16 0 1 0 -32,0 M-18,-76 a8,8 0 1 0 0.1,0 M18,-76 a8,8 0 1 0 0.1,0" fill="#9a9690" stroke={INK} strokeWidth={3} /> : null}
      <path d="M-10,30 q-4,8 0,14 M8,30 q4,8 0,14" stroke="#7aa040" strokeWidth={3} fill="none" />
    </g>
    <text x={0} y={78} textAnchor="middle" fontFamily="Comic Sans MS, Comic Neue, cursive" fontWeight={700} fontSize={18} fill={INK}>
      {p.name}
    </text>
    <text x={0} y={100} textAnchor="middle" fontFamily="Comic Sans MS, Comic Neue, cursive" fontWeight={700} fontSize={15} fill="#5a5a5a">
      {p.date}
    </text>
    <circle cx={0} cy={-92} r={8} fill={["#d23a3a", "#2c6ad2", "#2aa04a"][i % 3]} stroke={INK} strokeWidth={2} />
  </g>
);

export const WallOfShame: React.FC = () => {
  const { shot } = useEpisode();
  const { frame } = shot;
  const cam = camLerp({ x: 640, y: 560, zoom: 1.35 }, { x: 1300, y: 540, zoom: 1.35 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="shamewash" color="#fff2c8" cx={960} cy={200} r={900} opacity={0.18} />}>
      <rect x={-600} y={-600} width={3200} height={2400} fill="#d9d4c1" />
      <rect x={160} y={180} width={1600} height={760} rx={10} fill="#b98a52" stroke={INK} strokeWidth={8} />
      <rect x={180} y={200} width={1560} height={720} fill="#c99a62" />
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={200 + rnd(`cork${i}`) * 1520} cy={220 + rnd(`corky${i}`) * 680} r={4} fill="#a87a44" />
      ))}
      <text x={960} y={300} textAnchor="middle" fontFamily="Comic Sans MS, Comic Neue, cursive" fontWeight={900} fontSize={70} fill="#8a1a14" transform="rotate(-2 960 300)">
        WALL OF SHAME
      </text>
      {SHAME.map((p, i) => (
        <Polaroid key={i} x={330 + i * 215} y={590 + (i % 2 ? 40 : -20)} rot={(rnd(`pr${i}`) - 0.5) * 14} p={p} i={i} />
      ))}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Dale from behind (the stain reveal; the headlamp sweep)             */
/* ------------------------------------------------------------------ */

export const DaleRear: React.FC<{ soiled?: number; spot?: { x: number; y: number } | null; cam?: Cam; droop?: number }> = ({ soiled = 0, spot = null, cam, droop = 0 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const c = cam ?? camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 960, y: 600, zoom: 1.08 }, easeInOut(shot.p));
  const f2 = onN(frame, 2);
  const sway = noise2D("rearTail", f2 / 24 * 0.6, 0) * 14;
  const tail: Pt[] = [
    [960, 520],
    [1010 + sway * 0.3, 600 + droop * 120],
    [1120 + sway, 640 + droop * 260],
    [1210 + sway, 560 + droop * 380],
    [1250 + sway * 1.2, 470 + droop * 470],
  ];
  const r = 30 + soiled * 160;
  return (
    <Stage cam={c} frame={frame}>
      {/* soft kitchen behind */}
      <rect x={-600} y={-600} width={3200} height={2400} fill="#d0cbb8" />
      <rect x={-600} y={420} width={3200} height={500} fill="#8e9497" />
      <rect x={-600} y={400} width={3200} height={40} fill="#2c2b2b" />
      <rect x={-600} y={900} width={3200} height={900} fill="#6a3127" />
      {/* legs */}
      {[860, 1060].map((lx, i) => (
        <path key={i} d={`M${lx - 95},700 L${lx + 95},700 L${lx + 80},1300 L${lx - 80},1300 Z`} fill={i ? "#c9b07e" : "#bea575"} stroke={INK} strokeWidth={8} />
      ))}
      {/* the seat */}
      <defs>
        <clipPath id="rearSeat">
          <path d="M760,520 L1160,520 C1200,640 1180,760 1080,770 C1010,776 980,740 960,720 C940,740 910,776 840,770 C740,760 720,640 760,520 Z" />
        </clipPath>
      </defs>
      <path d="M760,520 L1160,520 C1200,640 1180,760 1080,770 C1010,776 980,740 960,720 C940,740 910,776 840,770 C740,760 720,640 760,520 Z" fill="#c9b07e" stroke={INK} strokeWidth={8} />
      <path d="M960,560 L960,720" stroke="#a28a5b" strokeWidth={6} />
      {soiled > 0 ? (
        <g clipPath="url(#rearSeat)">
          <path d={blob(960, 690, r, r * 0.75, 11, 0.22, "rearStain")} fill="#6b4a1e" opacity={0.92} />
          <path d={blob(960, 700, r * 0.55, r * 0.4, 9, 0.25, "rearStain2")} fill="#4f3412" opacity={0.75} />
        </g>
      ) : null}
      {soiled > 0.5
        ? [900, 1020].map((dx, i) => (
            <path key={i} d={`M${dx},760 q${i ? 8 : -8},${80 * soiled} 0,${170 * soiled}`} stroke="#6b4a1e" strokeWidth={22 * soiled} strokeLinecap="round" fill="none" opacity={0.85} />
          ))
        : null}
      {/* belt + shirt */}
      <path d="M740,520 Q960,540 1180,520" stroke="#4a2f1c" strokeWidth={30} fill="none" strokeLinecap="round" />
      <path d="M760,510 L1160,510 L1190,140 L730,140 Z" fill="#b23a2f" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <text x={960} y={330} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={54} fill="#f2ede0" opacity={0.92}>
        ROADKILL
      </text>
      <text x={960} y={392} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={54} fill="#f2ede0" opacity={0.92}>
        GRILL
      </text>
      {/* arms */}
      {[700, 1220].map((ax, i) => (
        <g key={i}>
          <path d={`M${ax + (i ? -20 : 20)},180 L${ax},560`} stroke={INK} strokeWidth={56} strokeLinecap="round" />
          <path d={`M${ax + (i ? -20 : 20)},180 L${ax},560`} stroke="#a19c97" strokeWidth={44} strokeLinecap="round" />
          <circle cx={ax} cy={580} r={30} fill="#e7a3a8" stroke={INK} strokeWidth={6} />
        </g>
      ))}
      {/* back of the head, ears, paper hat */}
      <circle cx={830} cy={40} r={60} fill="#211c1e" stroke={INK} strokeWidth={6} />
      <circle cx={1090} cy={40} r={60} fill="#211c1e" stroke={INK} strokeWidth={6} />
      <path d={blob(960, 60, 150, 110, 12, 0.04, "rearHead")} fill="#5f5a58" stroke={INK} strokeWidth={7} />
      <path d="M860,-30 L1060,-30 L1040,-80 Q960,-110 880,-80 Z" fill="#f4f1e8" stroke={INK} strokeWidth={6} />
      {/* the tail */}
      <path d={taperPath(tail, 46, 12)} fill="#e7a3a8" stroke={INK} strokeWidth={6} />
      {soiled > 0.45 ? <StinkLines x={960} y={560} t={t} n={4} h={360} color="#8fae4a" /> : null}
      {soiled > 0.3 ? <Flies cx={960} cy={600} count={Math.round(2 + soiled * 4)} t={t} r={240} seed="rearfly" size={2.2} /> : null}
      {/* headlamp sweep */}
      {spot ? (
        <g>
          <defs>
            <radialGradient id="lampSpot" cx={spot.x} cy={spot.y} r={1100} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#000" stopOpacity={0} />
              <stop offset="0.16" stopColor="#000" stopOpacity={0} />
              <stop offset="0.22" stopColor="#000" stopOpacity={0.86} />
              <stop offset="1" stopColor="#000" stopOpacity={0.92} />
            </radialGradient>
          </defs>
          <rect x={-600} y={-600} width={3200} height={2400} fill="url(#lampSpot)" />
          <circle cx={spot.x} cy={spot.y} r={190} fill="#fff3b0" opacity={0.22} style={{ mixBlendMode: "screen" }} />
        </g>
      ) : null}
    </Stage>
  );
};

function mixC(a: string, b: string, k: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.min(1, k)).toString(16).padStart(2, "0")).join("")}`;
}
