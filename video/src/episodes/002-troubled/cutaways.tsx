import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { Crow, Dennis, Pig } from "../../characters/Bull";
import { Candle, Portrait, Truck } from "../../characters/extras";
import { INK } from "../../characters/parts";
import { TallFigure } from "../../characters/TallFigure";
import { useEpisode } from "../../engine/context";
import { LightWash, Stage, camLerp } from "../../engine/Stage";
import { blob, easeIn, easeInOut, easeOut, lerp, prog, rnd } from "../../engine/util";
import { Shed } from "../../scenes/Pen";
import { PrairieBackdrop, nightAt, useBullSpeech } from "./prairie";

/* Cutaways for episode 002 (Dennis, the pigs, the shed, the dynasty, meat & milk...). */

const planks = (n: number, x0: number, y0: number, h: number, color: string) =>
  Array.from({ length: n }).map((_, i) => <rect key={i} x={x0 + i * 120} y={y0} width={116} height={h} fill={color} stroke="#140d0b" strokeWidth={5} />);

/* ------------------------------------------------------------------ */
/* Dennis over his stall door                                          */
/* ------------------------------------------------------------------ */

export const BarnDennis: React.FC<{ zoom?: number }> = ({ zoom = 1 }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const d = useBullSpeech("dennis");
  const flick = 0.9 + noise2D("lantern", t * 3, 0) * 0.1;
  const cam = camLerp({ x: 960, y: 560, zoom }, { x: 960, y: 560, zoom: zoom * 1.1 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="lanternwash" color="#ffb04a" cx={1300} cy={250} r={900} opacity={0.45 * flick} />}>
      <rect x={-600} y={-1300} width={3200} height={3600} fill="#2e1f17" />
      {planks(30, -600, -1300, 2300, "#3a281c")}
      {/* lantern */}
      <line x1={1300} y1={-400} x2={1300} y2={150} stroke={INK} strokeWidth={4} />
      <circle cx={1300} cy={200} r={110} fill="#ffcf6a" opacity={0.18 * flick} />
      <rect x={1270} y={150} width={60} height={90} rx={10} fill="#ffd27a" opacity={flick} stroke={INK} strokeWidth={5} />
      {/* hay */}
      <path d={blob(260, 900, 360, 120, 12, 0.2, "hay1")} fill="#b89a4a" stroke={INK} strokeWidth={5} />
      {Array.from({ length: 30 }).map((_, i) => (
        <line key={i} x1={rnd(`bh${i}`) * 700 - 80} y1={820 + rnd(`bhy${i}`) * 140} x2={rnd(`bh${i}`) * 700 - 40} y2={800 + rnd(`bhy${i}`) * 140} stroke="#8a7030" strokeWidth={4} />
      ))}
      <Dennis x={960} y={720} scale={1.05} t={t} frame={frame} mouth={d.mouth} talking={d.talking} />
      {/* stall door in front of him */}
      <rect x={560} y={700} width={800} height={500} fill="#5a3e28" stroke={INK} strokeWidth={8} />
      <path d="M560,700 L1360,1200 M1360,700 L560,1200" stroke="#3a281c" strokeWidth={22} />
      <rect x={540} y={688} width={840} height={34} fill="#6b4a30" stroke={INK} strokeWidth={6} />
      <g transform="translate(1180 790) rotate(4)">
        <rect x={-90} y={-30} width={180} height={60} fill="#d9cba0" stroke={INK} strokeWidth={4} />
        <text x={0} y={14} textAnchor="middle" fontFamily="PatrickHand" fontSize={40} fill="#3a2010">
          DENNIS
        </text>
      </g>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "They've done something to him" — memory of Dennis led to the shed  */
/* ------------------------------------------------------------------ */

const CalfSilhouette: React.FC<{ x: number; y: number; s: number; t: number; color: string; walk?: boolean }> = ({ x, y, s, t, color, walk = true }) => {
  const st = walk ? Math.sin(t * 9) * 10 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={color}>
      <ellipse cx={0} cy={-90} rx={95} ry={50} />
      <rect x={-70 + st} y={-60} width={18} height={60} rx={6} />
      <rect x={52 - st} y={-60} width={18} height={60} rx={6} />
      <ellipse cx={110} cy={-120} rx={40} ry={32} />
      <path d="M90,-150 l-24,-14 M130,-150 l24,-14" stroke={color} strokeWidth={10} strokeLinecap="round" />
    </g>
  );
};

export const DennisToShed: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const walk = easeIn(prog(local, 0, 3.4));
  const door = 1 - easeIn(prog(local, 3.3, 3.8));
  const cam = camLerp({ x: 960, y: 560, zoom: 1.05 }, { x: 1020, y: 560, zoom: 1.2 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="shedred" color="#ff3a17" cx={1250} cy={700} r={800} opacity={0.4 * door} />}>
      <rect x={-600} y={-1300} width={3200} height={2000} fill="#1a1222" />
      <rect x={-600} y={700} width={3200} height={1600} fill="#24180f" />
      <Shed x={1250} y={760} s={2.0} t={t} glow={1.4} doorOpen={door} />
      <TallFigure id="leader" x={lerp(200, 1190, walk)} y={780} h={760} t={t} frame={frame} grin={1.3} pose={{ armB: [-40, -10], legF: [Math.sin(t * 8) * 14, -4], legB: [-Math.sin(t * 8) * 14, 4] }} />
      <path d={`M${lerp(200, 1190, walk) - 70},${780 - 330} Q${lerp(200, 1190, walk) - 160},${780 - 160} ${lerp(80, 1090, walk) + 90},${780 - 110}`} stroke="#c9a24c" strokeWidth={5} fill="none" />
      <CalfSilhouette x={lerp(80, 1090, walk)} y={784} s={0.9} t={t} color="#0e0a0c" />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* The pigs (they talk; they know things)                              */
/* ------------------------------------------------------------------ */

export const PigSty: React.FC<{ gobble?: boolean; stare?: boolean }> = ({ gobble = false, stare = false }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const night = nightAt(t);
  const cam = camLerp({ x: 960, y: 600, zoom: 1.1 }, { x: 960, y: 620, zoom: 1.25 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame}>
      <rect x={-600} y={-1300} width={3200} height={2000} fill={night > 0.5 ? "#151020" : "#3a2438"} />
      <rect x={-600} y={640} width={3200} height={1800} fill="#3b2a1c" />
      {Array.from({ length: 14 }).map((_, i) => (
        <path key={i} d={blob(rnd(`mud${i}`) * 2200 - 140, 740 + rnd(`mudy${i}`) * 400, 120 + rnd(`mudr${i}`) * 100, 26, 9, 0.2, `mud${i}`)} fill="#2a1d12" />
      ))}
      <path d="M-600,600 L2600,600" stroke="#4a3a2c" strokeWidth={18} />
      {Array.from({ length: 22 }).map((_, i) => (
        <rect key={i} x={-560 + i * 150} y={480} width={22} height={170} fill="#4d3e33" stroke={INK} strokeWidth={4} />
      ))}
      {gobble ? (
        <g>
          <rect x={600} y={820} width={720} height={70} fill="#5b4330" stroke={INK} strokeWidth={6} />
          <path d={blob(960, 820, 330, 26, 12, 0.2, "slop")} fill="#9a8a5a" stroke={INK} strokeWidth={4} />
          <Pig id="pigA" x={560} y={900} scale={1.05} t={t} frame={frame} talk={0.9} look={[0.6, 0.5]} />
          <Pig id="pigB" x={1360} y={910} scale={1.0} flip t={t} frame={frame} talk={0.9} look={[0.6, 0.5]} />
        </g>
      ) : (
        <g>
          <Pig id="pigA" x={640} y={920} scale={1.15} t={t} frame={frame} talk={stare ? 0 : 0.8} look={stare ? [-0.2, 0] : [0.7, 0]} />
          <Pig id="pigB" x={1300} y={930} scale={1.1} flip t={t} frame={frame} talk={stare ? 0 : Math.max(0, Math.sin(t * 1.3)) * 0.8} look={stare ? [-0.2, 0] : [0.7, 0]} />
        </g>
      )}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "the tall, skinny ones ... serve us" — hay delivered by a farmer    */
/* ------------------------------------------------------------------ */

export const HayToss: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const toss = (local * 1.2) % 1;
  const cam = camLerp({ x: 960, y: 560, zoom: 1.12 }, { x: 960, y: 580, zoom: 1.22 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame}>
      <PrairieBackdrop t={t} frame={frame} />
      <rect x={760} y={800} width={400} height={90} fill="#5b4330" stroke={INK} strokeWidth={6} />
      <path d={blob(960, 800, 180, 50, 12, 0.2, "hayheap")} fill="#c9ab5a" stroke={INK} strokeWidth={5} />
      <TallFigure id="haytosser" x={1260} y={900} h={720} flip t={t} frame={frame} grin={1.2} holdF="pitchfork" pose={{ armF: [lerp(60, 140, Math.sin(toss * Math.PI)), 40], armB: [40, 60], lean: -6 }} />
      {toss > 0.4 ? <path d={blob(lerp(1080, 960, toss), lerp(480, 760, toss), 60, 26, 9, 0.3, "flyhay")} fill="#c9ab5a" stroke={INK} strokeWidth={4} /> : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Bravado montage: horns, hooves, pigs at the table                   */
/* ------------------------------------------------------------------ */

export const HornGleam: React.FC = () => {
  const { shot } = useEpisode();
  const { frame, local } = shot;
  const gl = Math.max(0, 1 - Math.abs(local - 0.6) / 0.25);
  const cam = camLerp({ x: 960, y: 540, zoom: 1 }, { x: 960, y: 540, zoom: 1.15 }, easeOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} shakeAmp={2}>
      <rect x={-600} y={-1300} width={3200} height={3600} fill="#2a0f0a" />
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <path key={i} d={`M960,540 L${960 + Math.cos(a) * 2000},${540 + Math.sin(a) * 2000} L${960 + Math.cos(a + 0.12) * 2000},${540 + Math.sin(a + 0.12) * 2000} Z`} fill="#4a180e" />;
      })}
      <path d="M300,1000 C520,760 700,420 1100,260 C1300,190 1460,210 1560,260" fill="none" stroke={INK} strokeWidth={150} strokeLinecap="round" />
      <path d="M300,1000 C520,760 700,420 1100,260 C1300,190 1460,210 1560,260" fill="none" stroke="#e7dcc0" strokeWidth={124} strokeLinecap="round" />
      <path d="M300,1000 C520,760 700,420 1100,260 C1300,190 1460,210 1560,260" fill="none" stroke="#9a8a6a" strokeWidth={124} strokeDasharray="10 60" />
      <g transform="translate(1520 250)" opacity={gl}>
        <path d="M0,-120 L22,-22 L120,0 L22,22 L0,120 L-22,22 L-120,0 L-22,-22 Z" fill="#fffbe6" />
      </g>
    </Stage>
  );
};

export const HoofStomp: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const stomp = easeIn(prog(local, 0.3, 0.55));
  const after = local > 0.55;
  const cam = camLerp({ x: 960, y: 560, zoom: 1.05 }, { x: 960, y: 580, zoom: 1.1 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} shakeAmp={after && local < 1 ? 22 : 0}>
      <rect x={-600} y={-1300} width={3200} height={3600} fill="#2a0f0a" />
      <rect x={-600} y={780} width={3200} height={1600} fill="#3b2418" />
      {/* a flattened tall skinny one, cartoon-style */}
      {after ? (
        <g>
          <g transform="translate(960 820) scale(1 0.08)">
            <TallFigure id="flat" x={0} y={0} h={700} t={t} frame={frame} grin={1.4} pose={{ armF: [80, 0], armB: [-80, 0] }} />
          </g>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${700 + i * 100},${770} l${(i - 2.5) * 12},-40`} stroke="#ffe08a" strokeWidth={8} strokeLinecap="round" />
          ))}
        </g>
      ) : (
        <TallFigure id="victim" x={960} y={800} h={700} t={t} frame={frame} grin={0.6} eyes="dots" />
      )}
      {/* giant hoof */}
      <g transform={`translate(960 ${lerp(-500, 640, stomp)})`}>
        <rect x={-150} y={-700} width={300} height={700} fill="#221e20" stroke={INK} strokeWidth={10} />
        <path d="M-190,-40 L190,-40 L210,150 L-210,150 Z" fill="#141012" stroke={INK} strokeWidth={10} />
        <line x1={0} y1={-40} x2={0} y2={150} stroke="#3a3436" strokeWidth={10} />
      </g>
      {after ? (
        <text x={960} y={420} textAnchor="middle" fontFamily="Creepster" fontSize={150} fill="#ffe08a" stroke={INK} strokeWidth={8} paintOrder="stroke" transform="rotate(-6 960 420)">
          CRACK
        </text>
      ) : null}
    </Stage>
  );
};

export const PigsFeast: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = camLerp({ x: 960, y: 580, zoom: 1.1 }, { x: 960, y: 600, zoom: 1.2 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame}>
      <rect x={-600} y={-1300} width={3200} height={3600} fill="#2a0f0a" />
      <rect x={-600} y={720} width={3200} height={1600} fill="#2a1a12" />
      <rect x={360} y={760} width={1200} height={50} fill="#f2ecdc" stroke={INK} strokeWidth={6} />
      <path d="M380,810 L380,1100 M1540,810 L1540,1100" stroke="#3a2a1d" strokeWidth={24} />
      <Pig id="feastA" x={560} y={930} scale={1.0} t={t} frame={frame} talk={1} look={[0.4, 0.6]} />
      <Pig id="feastB" x={1360} y={930} scale={1.0} flip t={t} frame={frame} talk={1} look={[0.4, 0.6]} />
      {/* napkins (they have manners) */}
      <path d="M700,700 l60,0 l-30,70 Z" fill="#f7f4ea" stroke={INK} strokeWidth={4} />
      <path d="M1220,700 l60,0 l-30,70 Z" fill="#f7f4ea" stroke={INK} strokeWidth={4} />
      <ellipse cx={960} cy={752} rx={200} ry={30} fill="#c9c8c2" stroke={INK} strokeWidth={6} />
      <path d="M840,740 q40,-40 120,-30 q80,-6 120,30" fill="#7a3a24" stroke={INK} strokeWidth={5} />
      <path d="M900,720 l-10,-40 M1020,720 l10,-40" stroke="#efe6cf" strokeWidth={10} strokeLinecap="round" />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "They call it the Shed of No Return."                               */
/* ------------------------------------------------------------------ */

export const ShedNoReturn: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 960, y: 600, zoom: 1.35 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} shakeAmp={1.2} overlay={<LightWash id="nored" color="#ff3a17" cx={960} cy={700} r={900} opacity={0.5} />}>
      <rect x={-600} y={-1300} width={3200} height={2100} fill="#120c18" />
      <rect x={-600} y={790} width={3200} height={1600} fill="#24180f" />
      <circle cx={1500} cy={180} r={64} fill="#ddd68f" stroke={INK} strokeWidth={5} />
      <Shed x={960} y={800} s={2.6} t={t} glow={1.6} doorOpen={0.06 + Math.max(0, Math.sin(t * 0.8)) * 0.04} />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "...will bring in new bulls" — the metal beast with a young bull    */
/* ------------------------------------------------------------------ */

export const NewBull: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const drive = easeOut(prog(shot.local, 0, 3.5));
  const cam = camLerp({ x: 960, y: 600, zoom: 1.1 }, { x: 980, y: 600, zoom: 1.2 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame}>
      <PrairieBackdrop t={t} frame={frame} showHerd={false} />
      <Truck
        x={lerp(-400, 900, drive)}
        y={900}
        s={0.9}
        t={t}
        rumble={drive < 1 ? 1 : 0.2}
        cargo={
          <g transform="translate(-170 -170)">
            <ellipse cx={0} cy={-40} rx={120} ry={60} fill="#3a2a22" stroke={INK} strokeWidth={6} />
            <ellipse cx={130} cy={-80} rx={46} ry={40} fill="#3a2a22" stroke={INK} strokeWidth={6} />
            <path d="M110,-114 q-20,-40 -50,-40 M150,-114 q20,-40 50,-40" stroke="#e7dcc0" strokeWidth={12} fill="none" strokeLinecap="round" />
            <circle cx={140} cy={-86} r={6} fill="#fff" />
          </g>
        }
      />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "So our dynasty is meaningless." — the ancestors                    */
/* ------------------------------------------------------------------ */

const BullBust: React.FC<{ seed: string; fur?: string; horn?: string; crown?: boolean }> = ({ seed, fur = "#3a2a22", horn = "#e7dcc0", crown }) => (
  <g>
    <rect x={-400} y={-400} width={800} height={800} fill={`hsl(${Math.round(rnd(seed) * 40) + 10},25%,22%)`} />
    <path d="M-150,180 C-150,80 -80,40 0,40 C80,40 150,80 150,180 Z" fill={fur} stroke={INK} strokeWidth={5} />
    <path d="M-50,-50 C-110,-70 -140,-110 -130,-150 M50,-50 C110,-70 140,-110 130,-150" stroke={horn} strokeWidth={22} fill="none" strokeLinecap="round" />
    <path d={blob(0, 0, 70, 66, 12, 0.05, seed + "h")} fill={fur} stroke={INK} strokeWidth={5} />
    <ellipse cx={0} cy={36} rx={44} ry={28} fill="#5a4a44" stroke={INK} strokeWidth={4} />
    <circle cx={-26} cy={-10} r={8} fill="#efe7d0" stroke={INK} strokeWidth={2} />
    <circle cx={26} cy={-10} r={8} fill="#efe7d0" stroke={INK} strokeWidth={2} />
    <circle cx={-26} cy={-10} r={3} fill={INK} />
    <circle cx={26} cy={-10} r={3} fill={INK} />
    {crown ? <path d="M-40,-60 L-30,-96 L-10,-70 L0,-104 L10,-70 L30,-96 L40,-60 Z" fill="#d4a636" stroke={INK} strokeWidth={4} /> : null}
  </g>
);

export const Dynasty: React.FC<{ crossed?: boolean }> = ({ crossed = false }) => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const cross = crossed ? easeOut(prog(local, 0.2, 0.7)) : 0;
  const out = crossed ? prog(local, 0.9, 1.4) : 0;
  const cam = camLerp({ x: 960, y: 500, zoom: 1.0 }, { x: 960, y: 500, zoom: 1.12 }, easeInOut(shot.p));
  const items = [
    { x: 380, y: 340, seed: "anc1", fur: "#4a3a2a", crown: true },
    { x: 760, y: 300, seed: "anc2", fur: "#2a2224" },
    { x: 1160, y: 300, seed: "anc3", fur: "#6a4a30" },
    { x: 1540, y: 340, seed: "anc4", fur: "#3a3030" },
    { x: 960, y: 700, seed: "brothers", fur: "#221e20" },
  ];
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="dyncandle" color="#ffb04a" cx={960} cy={1000} r={900} opacity={0.35 * (1 - out)} />}>
      <rect x={-600} y={-1300} width={3200} height={3600} fill="#21160f" />
      {planks(30, -600, -1300, 3600, "#2a1c12")}
      {items.map((p) => (
        <Portrait key={p.seed} x={p.x} y={p.y} w={220} h={260} seed={p.seed} ribbon={p.seed !== "brothers"}>
          <g transform="scale(0.75)">
            <BullBust seed={p.seed} fur={p.fur} crown={p.crown} />
          </g>
        </Portrait>
      ))}
      {cross > 0 ? (
        <g opacity={0.92}>
          <path d={`M${960 - 130},${700 - 150} L${960 - 130 + 260 * cross},${700 - 150 + 300 * cross}`} stroke="#a5121a" strokeWidth={30} strokeLinecap="round" />
          <path d={`M${960 + 130},${700 - 150} L${960 + 130 - 260 * cross},${700 - 150 + 300 * cross}`} stroke="#a5121a" strokeWidth={28} strokeLinecap="round" />
        </g>
      ) : null}
      {[560, 760, 1160, 1360].map((cx, i) => (out < 1 ? <Candle key={i} x={cx} y={1000} s={1} t={t} seed={`dync${i}`} /> : null))}
      {out >= 1 ? [560, 760, 1160, 1360].map((cx, i) => <path key={i} d={`M${cx},920 q-10,-30 6,-60 q-12,-30 4,-60`} stroke="#9a9590" strokeWidth={4} fill="none" opacity={0.7} />) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "Some for meat and some for milk, if what the crows say is true."   */
/* ------------------------------------------------------------------ */

export const MeatMilk: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const night = nightAt(t);
  const cam = camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 960, y: 560, zoom: 1.1 }, easeInOut(shot.p));
  const calves = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({ lane: i % 2, off: i * 0.18 })), []);
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="mmred" color="#ff3a17" cx={300} cy={500} r={700} opacity={0.35} />}>
      <rect x={-600} y={-1300} width={3200} height={2000} fill={night > 0.5 ? "#141020" : "#2a1e34"} />
      <rect x={-600} y={640} width={3200} height={1800} fill="#2a2a18" />
      {/* two paths fork from the bottom */}
      <path d="M800,1200 L960,760 L300,560 L360,540 L1000,740 L1600,540 L1660,560 L1120,760 L1120,1200 Z" fill="#4a3a26" />
      <Shed x={300} y={560} s={0.9} t={t} glow={1.5} />
      <g transform="translate(1640 560) scale(0.8)">
        <path d="M-160,0 L-160,-180 L0,-260 L160,-180 L160,0 Z" fill="#c9c2b0" stroke={INK} strokeWidth={8} />
        <rect x={-50} y={-120} width={100} height={120} fill="#5a4a3a" stroke={INK} strokeWidth={6} />
        <text x={0} y={-150} textAnchor="middle" fontFamily="PatrickHand" fontSize={44} fill="#3a3a3a">
          DAIRY
        </text>
      </g>
      {/* signpost */}
      <g transform="translate(960 840)">
        <rect x={-12} y={-300} width={24} height={300} fill="#5a3e28" stroke={INK} strokeWidth={5} />
        <g transform="translate(0 -250) rotate(-6)">
          <path d="M-20,-40 L-260,-40 L-300,0 L-260,40 L-20,40 Z" fill="#d9cba0" stroke={INK} strokeWidth={5} />
          <text x={-150} y={16} textAnchor="middle" fontFamily="Creepster" fontSize={52} fill="#8a1010">
            MEAT
          </text>
        </g>
        <g transform="translate(0 -160) rotate(5)">
          <path d="M20,-40 L260,-40 L300,0 L260,40 L20,40 Z" fill="#d9cba0" stroke={INK} strokeWidth={5} />
          <text x={150} y={16} textAnchor="middle" fontFamily="PatrickHand" fontSize={52} fill="#2a4a7a">
            MILK
          </text>
        </g>
        <Crow x={-10} y={-300} scale={1.2} t={t} caw={Math.max(0, Math.sin(t * 6)) > 0.7 ? 1 : 0} />
      </g>
      {calves.map((c, i) => {
        const p = ((local * 0.12 + c.off) % 1);
        const x = c.lane === 0 ? lerp(900, 360, p) : lerp(1020, 1600, p);
        const y = lerp(1000, 590, p);
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${lerp(0.7, 0.18, p) * (c.lane === 0 ? -1 : 1)} ${lerp(0.7, 0.18, p)})`} fill="#1a1214">
            <ellipse cx={0} cy={-90} rx={95} ry={50} />
            <rect x={-70} y={-60} width={18} height={60} rx={6} />
            <rect x={52} y={-60} width={18} height={60} rx={6} />
            <ellipse cx={110} cy={-120} rx={40} ry={32} />
          </g>
        );
      })}
    </Stage>
  );
};

/** Crows on the great fence, gossiping. */
export const CrowsOnFence: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 960, y: 560, zoom: 1.12 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame}>
      <PrairieBackdrop t={t} frame={frame} />
      <rect x={-600} y={560} width={3200} height={30} fill="#3d3129" stroke={INK} strokeWidth={4} />
      {[460, 760, 1060, 1360].map((x, i) => (
        <Crow key={i} x={x} y={562} scale={2.2} t={t + i} flip={i % 2 === 1} caw={Math.max(0, Math.sin(t * 5 + i * 1.7)) > 0.8 ? 1 : 0} />
      ))}
    </Stage>
  );
};

