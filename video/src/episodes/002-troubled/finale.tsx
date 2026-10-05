import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { Bull, Pig } from "../../characters/Bull";
import { Flames, Truck } from "../../characters/extras";
import { INK } from "../../characters/parts";
import { TallFigure } from "../../characters/TallFigure";
import { useEpisode } from "../../engine/context";
import { LightWash, Stage, camLerp } from "../../engine/Stage";
import { blob, easeIn, easeInOut, easeOut, lerp, onN, prog, rnd } from "../../engine/util";
import { Farmhouse } from "../../scenes/Pen";
import { PrairieBackdrop, PrairieSky } from "./prairie";

/* Episode 002, second half: the plans, the futility, and the charge. */

/* ------------------------------------------------------------------ */
/* "The older one sleeps in there at night ... the loud stick"         */
/* ------------------------------------------------------------------ */

export const FarmerAsleep: React.FC<{ shadow?: boolean }> = ({ shadow = true }) => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const snore = (Math.sin(t * 1.6) + 1) / 2;
  const silhouette = shadow ? easeInOut(prog(local, 2.0, 4.0)) : 0;
  const cam = camLerp({ x: 960, y: 540, zoom: 1.0 }, { x: 900, y: 560, zoom: 1.15 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="moonroom" color="#7da0d8" cx={1550} cy={260} r={900} opacity={0.35} />}>
      <rect x={-600} y={-1300} width={3200} height={2200} fill="#1c1a26" />
      {Array.from({ length: 30 }).map((_, i) => (
        <rect key={i} x={-600 + i * 100} y={-1300} width={44} height={2200} fill="#222030" />
      ))}
      <rect x={-600} y={900} width={3200} height={1500} fill="#2a1d14" />
      {/* window with moon + a big horned shadow looming in it */}
      <rect x={1380} y={140} width={340} height={380} fill="#1d2a44" stroke="#120f18" strokeWidth={18} />
      <circle cx={1560} cy={250} r={60} fill="#ddd68f" />
      <path d="M1550,140 L1550,520 M1380,330 L1720,330" stroke="#120f18" strokeWidth={12} />
      {silhouette > 0 ? (
        <g opacity={silhouette} fill="#06050a">
          <path d="M1400,520 C1400,420 1460,380 1550,380 C1640,380 1700,420 1700,520 Z" />
          <path d="M1470,400 C1420,360 1410,300 1440,270 M1630,400 C1680,360 1690,300 1660,270" stroke="#06050a" strokeWidth={22} fill="none" strokeLinecap="round" />
          <circle cx={1510} cy={440} r={7} fill="#ff3a2a" />
          <circle cx={1590} cy={440} r={7} fill="#ff3a2a" />
        </g>
      ) : null}
      {/* the loud stick, leaning */}
      <g transform="translate(1260 900) rotate(-12)">
        <path d="M-16,0 L16,0 L22,-120 L-22,-120 Z" fill="#5a3a22" stroke={INK} strokeWidth={5} />
        <rect x={-8} y={-460} width={16} height={350} fill="#2a2a2e" stroke={INK} strokeWidth={5} />
      </g>
      {/* bed + sleeping old one in a nightcap */}
      <rect x={300} y={700} width={860} height={60} fill="#5b4330" stroke={INK} strokeWidth={6} />
      <rect x={300} y={560} width={60} height={340} fill="#5b4330" stroke={INK} strokeWidth={6} />
      <rect x={1100} y={640} width={60} height={260} fill="#5b4330" stroke={INK} strokeWidth={6} />
      <g transform="translate(1100 700) rotate(-90)">
        <TallFigure id="oldone" x={0} y={0} h={760} t={0} frame={0} grin={0} eyes="closed" hat={false} sway={0} pose={{ armF: [10, 150], armB: [6, 156], legF: [0, 0], legB: [0, 0] }} />
      </g>
      <path d="M360,700 C500,600 900,600 1100,680 L1100,720 L360,720 Z" fill="#7a6a8a" stroke={INK} strokeWidth={6} />
      <path d="M330,560 L400,520 L430,600" fill="#d9d2c0" stroke={INK} strokeWidth={5} />
      {/* nightcap */}
      <path d="M380,610 C340,560 300,560 270,600" fill="none" stroke="#c23b3b" strokeWidth={26} strokeLinecap="round" />
      <circle cx={262} cy={606} r={18} fill="#f2ecdc" stroke={INK} strokeWidth={4} />
      <text x={470} y={500 - snore * 30} fontFamily="PatrickHand" fontSize={60 + snore * 20} fill="#cfc8e0" opacity={0.85}>
        z
      </text>
      <text x={530} y={430 - snore * 40} fontFamily="PatrickHand" fontSize={80 + snore * 20} fill="#cfc8e0" opacity={0.7}>
        Z
      </text>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "...more of the tall, skinny ones ... sharp sticks ... in the barn" */
/* ------------------------------------------------------------------ */

export const Hayloft: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 1000, y: 560, zoom: 1.12 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="loftlamp" color="#ffb04a" cx={960} cy={200} r={900} opacity={0.35} />}>
      <rect x={-600} y={-1300} width={3200} height={3600} fill="#2a1d14" />
      {Array.from({ length: 30 }).map((_, i) => (
        <rect key={i} x={-600 + i * 120} y={-1300} width={116} height={3600} fill="#33241a" stroke="#140d0b" strokeWidth={5} />
      ))}
      <path d="M-600,180 L2600,180" stroke="#1a110b" strokeWidth={40} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={200 + i * 520} y={720} width={460} height={200} rx={16} fill="#b89a4a" stroke={INK} strokeWidth={7} />
          <path d={`M${200 + i * 520},790 L${660 + i * 520},790 M${200 + i * 520},860 L${660 + i * 520},860`} stroke="#8a7030" strokeWidth={6} />
        </g>
      ))}
      {[{ x: 520, y: 720 }, { x: 1300, y: 720 }].map((p, i) => (
        <g key={i}>
          <g transform={`translate(${p.x + 260} ${p.y}) rotate(-90)`}>
            <TallFigure id={`hand${i}`} x={0} y={0} h={560} t={0} frame={0} grin={0} eyes="closed" sway={0} pose={{ armF: [30, 140], armB: [20, 150], legF: [0, 0], legB: [0, 0] }} />
          </g>
          <g transform={`translate(${p.x - 120 + i * 40} ${p.y + 10}) rotate(${-14 + i * 28})`}>
            <rect x={-6} y={-460} width={12} height={460} fill="#6b4a2c" stroke={INK} strokeWidth={4} />
            {[-30, 0, 30].map((fx) => (
              <path key={fx} d={`M${fx - 4},-460 L${fx + 4},-460 L${fx},-540 Z`} fill="#a9a8a2" stroke={INK} strokeWidth={3} />
            ))}
            <path d="M-34,-460 L34,-460" stroke="#8b8a86" strokeWidth={10} />
          </g>
        </g>
      ))}
      <text x={980} y={560 + Math.sin(t * 1.5) * 10} fontFamily="PatrickHand" fontSize={70} fill="#e9dcc0" opacity={0.6}>
        zZ
      </text>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "With the sun, the others would arrive on the great metal beast"    */
/* ------------------------------------------------------------------ */

export const SunriseReckoning: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const drive = easeOut(prog(local, 0, 3.0));
  const reveal = prog(local, 6.0, 7.0);
  const cam = camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 960, y: 580, zoom: 1.15 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="dawn" color="#ff9a4a" cx={960} cy={600} r={1100} opacity={0.4} />}>
      <PrairieSky t={t} night={0.08} id="dawnsky" />
      <rect x={-600} y={640} width={3200} height={1800} fill="#3a3220" />
      <Truck x={lerp(-500, 700, drive)} y={880} s={0.95} t={t} rumble={drive < 1 ? 1 : 0.3} lights={0.4} />
      {drive >= 1
        ? [0, 1, 2, 3].map((i) => (
            <TallFigure
              key={i}
              id={`dawnfig${i}`}
              x={1000 + i * 190}
              y={900}
              h={760 + (i % 2) * 80}
              t={t}
              frame={frame}
              grin={1.2}
              holdF={i % 2 ? "shotgun" : "pitchfork"}
              pose={{ armF: [120, 20], armB: [20, 20] }}
            />
          ))
        : null}
      {/* "you and I painted in their gore" — the brothers, splattered, on the ground */}
      {reveal > 0 ? (
        <g opacity={reveal}>
          <path d={blob(560, 980, 260, 40, 10, 0.2, "gore1")} fill="#8a1010" opacity={0.85} />
          <path d={blob(560, 940, 160, 60, 10, 0.3, "bullheap")} fill="#221e20" stroke={INK} strokeWidth={6} />
          <path d="M470,900 l-30,-50 M650,900 l40,-50" stroke="#e7dcc0" strokeWidth={14} strokeLinecap="round" />
        </g>
      ) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "...into the wilderness to be hunted by predators"                  */
/* ------------------------------------------------------------------ */

export const Wilderness: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const riders = easeOut(prog(local, 4.8, 7.2));
  const cam = camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 960, y: 560, zoom: 1.12 }, easeInOut(shot.p));
  const trees = useMemo(() => Array.from({ length: 18 }).map((_, i) => ({ x: rnd(`tr${i}`) * 2400 - 240, h: 500 + rnd(`trh${i}`) * 500, w: 30 + rnd(`trw${i}`) * 30 })), []);
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="woodsmoon" color="#7da0d8" cx={960} cy={100} r={1100} opacity={0.35} />}>
      <rect x={-600} y={-1300} width={3200} height={3600} fill="#15121e" />
      <circle cx={1500} cy={150} r={60} fill="#ddd68f" />
      <rect x={-600} y={760} width={3200} height={1600} fill="#1e1a16" />
      {trees.map((tr, i) => (
        <g key={i} fill="#07060a">
          <rect x={tr.x - tr.w / 2} y={800 - tr.h} width={tr.w} height={tr.h} />
          <path d={`M${tr.x},${800 - tr.h} l-80,120 M${tr.x},${800 - tr.h + 120} l90,100 M${tr.x},${800 - tr.h + 240} l-70,90`} stroke="#07060a" strokeWidth={14} />
        </g>
      ))}
      {/* the herd, lost */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(${520 + i * 200 + Math.sin(t + i) * 10} ${880}) scale(0.5)`} fill="#4a3e44" stroke={INK} strokeWidth={6}>
          <ellipse cx={0} cy={-60} rx={90} ry={44} />
          <ellipse cx={100} cy={-80} rx={30} ry={22} />
          <rect x={-70} y={-40} width={16} height={44} />
          <rect x={50} y={-40} width={16} height={44} />
        </g>
      ))}
      {/* predators: eyes in the dark */}
      {[{ x: 300, y: 700 }, { x: 380, y: 720 }, { x: 1560, y: 690 }, { x: 1660, y: 730 }, { x: 980, y: 640 }].map((p, i) => {
        const bl = Math.floor(t * 24 + i * 7) % 60 < 3;
        return bl ? null : (
          <g key={i}>
            <ellipse cx={p.x} cy={p.y} rx={14} ry={9} fill="#ffe94a" />
            <ellipse cx={p.x + 46} cy={p.y + 2} rx={14} ry={9} fill="#ffe94a" />
          </g>
        );
      })}
      {/* the tall skinny ones come to fetch them back (lanterns on horseback) */}
      {riders > 0 ? (
        <g opacity={riders}>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${lerp(2300, 1300, riders) + i * 180} 860)`}>
              <path d="M-120,0 L-110,-150 L80,-170 L130,-240 L170,-220 L130,-150 L120,0 M-90,0 l0,-60 M90,0 l0,-60" fill="#06050a" stroke="#06050a" strokeWidth={22} strokeLinejoin="round" />
              <TallFigure id={`rider${i}`} x={0} y={-160} h={420} t={t} frame={frame} grin={1.2} holdF="torch" pose={{ legF: [60, -60], legB: [-40, 60], armF: [130, 10] }} />
            </g>
          ))}
        </g>
      ) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "Can you murder the world?" — a dozen dozen                         */
/* ------------------------------------------------------------------ */

export const ArmyOfFigures: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const father = easeOut(prog(local, 10.5, 13.0));
  const pig = easeOut(prog(local, 15.0, 15.6));
  const cam = camLerp({ x: 960, y: 560, zoom: 1.25 }, { x: 960, y: 520, zoom: 0.92 }, easeInOut(prog(local, 0, 10)));
  const crowd = useMemo(
    () =>
      Array.from({ length: 34 }).map((_, i) => ({
        x: -300 + (i % 17) * 150 + rnd(`ax${i}`) * 60,
        y: 700 + Math.floor(i / 17) * 70 + rnd(`ay${i}`) * 20,
        h: 360 + rnd(`ah${i}`) * 160,
        hold: (["torch", "pitchfork", "shotgun", "torch"] as const)[i % 4],
        g: 1 + rnd(`ag${i}`) * 0.4,
      })),
    [],
  );
  if (pig > 0) {
    // "...the rapacity of a ravenous pig": gross-up of a pig chomping
    return (
      <Stage cam={{ x: 960, y: 560, zoom: 1.0 + pig * 0.1 }} frame={frame} shakeAmp={6}>
        <rect x={-600} y={-1300} width={3200} height={3600} fill="#3a0a0a" />
        <g transform="translate(660 1020) scale(2.6)">
          <Pig id="ravenous" x={0} y={0} t={t} frame={frame} talk={1} look={[0.2, 0.3]} />
        </g>
      </Stage>
    );
  }
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="armyfire" color="#ff6a1a" cx={960} cy={900} r={1100} opacity={0.45} />}>
      <rect x={-1200} y={-1500} width={4400} height={3800} fill="#2a0806" />
      <Flames x={960} y={760} w={3600} h={260} t={t} seed="ridgefire" n={18} />
      <path d="M-1200,700 C-200,640 800,690 1800,650 C2400,630 3000,660 3200,660 L3200,2300 L-1200,2300 Z" fill="#120606" />
      {/* metal beasts on the ridge */}
      <g opacity={0.95}>
        <Truck x={-60} y={690} s={0.55} t={t} rumble={0.3} lights={1} />
        <Truck x={1980} y={690} s={0.55} t={t} rumble={0.3} lights={1} flip />
      </g>
      {crowd.map((c, i) => (
        <TallFigure key={i} id={`army${i}`} x={c.x} y={c.y} h={c.h} t={t + i} frame={frame} grin={c.g} holdF={c.hold} pose={{ armF: [150, 10] }} />
      ))}
      {/* the wronged father looms over all of them */}
      {father > 0 ? (
        <g opacity={father}>
          <TallFigure id="father" x={960} y={1000} h={lerp(900, 1500, father)} t={t} frame={frame} grin={0} eyes="glow" holdF="shotgun" pose={{ armF: [100, 10], armB: [-10, 0] }} />
        </g>
      ) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Ending: the fence breaks; side by side until the death of the world  */
/* ------------------------------------------------------------------ */

export const FenceCharge: React.FC<{ standOnly?: boolean }> = ({ standOnly = false }) => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const local = standOnly ? 0 : shot.local;
  const run = !standOnly && local > 0.3;
  const adv = easeIn(prog(local, 0.3, 3.2));
  const burst = prog(local, 1.6, 2.2);
  const planks = useMemo(() => Array.from({ length: 14 }).map((_, i) => ({ vx: (rnd(`pk${i}`) - 0.5) * 1400, vy: -500 - rnd(`pky${i}`) * 700, r: rnd(`pkr${i}`) * 720 })), []);
  const cam = camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 960, y: 520, zoom: 1.12 }, easeInOut(shot.p));
  const bt = Math.max(0, local - 1.6);
  return (
    <Stage cam={cam} frame={frame} shakeAmp={run ? 6 + burst * 10 : 0} overlay={<LightWash id="chargemoon" color="#7da0d8" cx={960} cy={160} r={900} opacity={0.35} />}>
      <PrairieSky t={t} night={1} id="chargesky" />
      <path d="M-800,640 C-200,610 400,650 1000,628 C1500,610 2000,650 2800,622 L2800,900 L-800,900 Z" fill="#1a1622" />
      <Farmhouse x={960} y={640} s={1.1} t={t} />
      <rect x={-800} y={712} width={3600} height={2000} fill="#1d2216" />
      {/* the great fence, about to break */}
      {burst < 1
        ? Array.from({ length: 26 }).map((_, i) => (
            <path key={i} d="M-11,0 L-11,-110 L0,-136 L11,-110 L11,0 Z" transform={`translate(${-300 + i * 100} 760)`} fill="#4d3e33" stroke={INK} strokeWidth={4} />
          ))
        : Array.from({ length: 26 }).map((_, i) =>
            Math.abs(-300 + i * 100 - 960) < 380 ? null : <path key={i} d="M-11,0 L-11,-110 L0,-136 L11,-110 L11,0 Z" transform={`translate(${-300 + i * 100} 760)`} fill="#4d3e33" stroke={INK} strokeWidth={4} />,
          )}
      {burst > 0
        ? planks.map((p, i) => (
            <path key={i} d="M-11,0 L-11,-110 L0,-136 L11,-110 L11,0 Z" transform={`translate(${880 + (i % 7) * 30 + p.vx * bt} ${760 + p.vy * bt + 1400 * bt * bt}) rotate(${p.r * bt})`} fill="#4d3e33" stroke={INK} strokeWidth={4} />
          ))
        : null}
      {/* the brothers, from behind, charging toward the house, side by side */}
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${960 + side * lerp(260, 150, adv)} ${lerp(1180, 780, adv)}) scale(${lerp(1.0, 0.42, adv)})`}>
          <BullRear variant={side < 0 ? "brisket" : "chuck"} t={t} run={run} />
        </g>
      ))}
      {burst > 0 && burst < 1 ? <circle cx={960} cy={700} r={300 * burst} fill="#d9cfb8" opacity={(1 - burst) * 0.5} /> : null}
    </Stage>
  );
};

/** A bull seen from behind (for the charge). Origin = ground. */
const BullRear: React.FC<{ variant: "brisket" | "chuck"; t: number; run: boolean }> = ({ variant, t, run }) => {
  const fur = variant === "brisket" ? "#221e20" : "#7a5434";
  const horn = variant === "brisket" ? "#e7dcc0" : "#d9cba8";
  const g = run ? Math.sin(t * 14 + (variant === "chuck" ? 1.3 : 0)) : 0;
  return (
    <g transform={`translate(0 ${-Math.abs(g) * 26})`}>
      <ellipse cx={0} cy={10} rx={230} ry={30} fill="#000" opacity={0.5} />
      <rect x={-150} y={-160 - g * 20} width={70} height={170} rx={24} fill={fur} stroke={INK} strokeWidth={6} />
      <rect x={80} y={-160 + g * 20} width={70} height={170} rx={24} fill={fur} stroke={INK} strokeWidth={6} />
      <path d="M-210,-150 C-230,-330 -120,-420 0,-424 C120,-420 230,-330 210,-150 C150,-120 -150,-120 -210,-150 Z" fill={fur} stroke={INK} strokeWidth={7} />
      <path d="M0,-400 C10,-330 -6,-260 0,-200" stroke={INK} strokeWidth={6} fill="none" />
      <path d={`M0,-410 q${30 + g * 20},40 ${10 + g * 30},120`} stroke={INK} strokeWidth={10} fill="none" />
      <path d="M-120,-430 C-200,-460 -250,-520 -240,-580 M120,-430 C200,-460 250,-520 240,-580" stroke={INK} strokeWidth={46} fill="none" strokeLinecap="round" />
      <path d="M-120,-430 C-200,-460 -250,-520 -240,-580 M120,-430 C200,-460 250,-520 240,-580" stroke={horn} strokeWidth={34} fill="none" strokeLinecap="round" />
      <path d={blob(0, -460, 110, 70, 10, 0.06, `rear${variant}`)} fill={fur} stroke={INK} strokeWidth={6} />
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Night: Chuck lies down in the cool grass                            */
/* ------------------------------------------------------------------ */

export const NightRest: React.FC<{ chuckLying: boolean; brisketExpr?: "rage" | "intense" | "sad" }> = ({ chuckLying, brisketExpr = "sad" }) => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const shooting = (local * 0.25) % 1;
  const cam = camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 960, y: 600, zoom: 1.15 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="nightwash" color="#7da0d8" cx={1500} cy={160} r={1000} opacity={0.3} />}>
      <PrairieBackdrop t={t} frame={frame} night={1} />
      <path d={`M${lerp(200, 900, shooting)},${lerp(80, 260, shooting)} l-120,-40`} stroke="#fffbe6" strokeWidth={4} opacity={shooting < 0.3 ? 1 - shooting / 0.3 : 0} />
      <Bull id="brisket" variant="brisket" x={470} y={940} scale={0.9} t={t} frame={frame} mouth="X" expr={brisketExpr} look={[0.7, 0.2]} redEyes={0.4} />
      <Bull id="chuck" variant="chuck" x={1450} y={960} scale={0.9} flip t={t} frame={frame} mouth="X" lying={chuckLying} expr="sad" />
    </Stage>
  );
};

/** Black title card with credit, sized for either format. */
export const TitleCard002: React.FC = () => {
  const { shot } = useEpisode();
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const o = easeOut(prog(shot.local, 0.2, 1.2));
  const jit = (s: string) => (rnd(`${s}${onN(shot.frame, 3)}`) - 0.5) * 4;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#070506", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: o, padding: portrait ? "0 70px" : 0, textAlign: "center" }}>
      <div style={{ fontFamily: "Creepster", fontSize: portrait ? 112 : 124, lineHeight: 1.05, color: "#d9d27a", letterSpacing: 4, transform: `translate(${jit("a")}px, ${jit("b")}px) rotate(-1.5deg)`, textShadow: "0 0 30px rgba(200,40,20,0.45)" }}>
        BROTHER, I AM TROUBLED
      </div>
      <div style={{ fontFamily: "SpecialElite", fontSize: portrait ? 34 : 38, color: "#b9b0a0", marginTop: 36 }}>voice &amp; audio: burialgoods — "Brother, I am troubled"</div>
    </div>
  );
};

