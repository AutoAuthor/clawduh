import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { Dumpling } from "../characters/Dumpling";
import { Candle, DumplingBack, Portrait, SheepBust } from "../characters/extras";
import { INK } from "../characters/parts";
import { TallFigure } from "../characters/TallFigure";
import { useEpisode } from "../engine/context";
import { Cam, LightWash, Stage, camLerp, camPath } from "../engine/Stage";
import { energyAt, isTalking, mouthAt } from "../engine/timeline";
import { cloudPath, easeIn, easeInOut, easeOut, easeOutBack, lerp, onN, prog, rnd } from "../engine/util";
import { Shed } from "./Pen";

function useDumplingSpeech() {
  const { timeline, shot } = useEpisode();
  const tq = onN(shot.frame, 2) / shot.fps;
  return { mouth: mouthAt(timeline, "dumpling", tq), talking: isTalking(timeline, "dumpling", shot.t), energy: energyAt(timeline, shot.t) };
}

/* ------------------------------------------------------------------ */
/* "The tall skinny figure has thrown the oats at me."                 */
/* ------------------------------------------------------------------ */

export const FarmhouseWindowScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const throwT = 2.15;
  const thr = easeOut(prog(local, throwT, throwT + 0.3));
  const wave = Math.sin(local * 5) * 22;
  const armF: [number, number] = local < throwT ? [118, 48 + wave] : [lerp(118, 70, thr), lerp(48, -10, thr)];
  const cam = camLerp({ x: 960, y: 500, zoom: 1.0 }, { x: 960, y: 480, zoom: 1.12 }, easeInOut(shot.p));
  const oats = useMemo(
    () =>
      Array.from({ length: 34 }).map((_, i) => ({
        vx: (rnd(`ov${i}`) - 0.3) * 900,
        vy: -300 - rnd(`ovy${i}`) * 500,
        r: rnd(`or${i}`) * 360,
        s: 0.8 + rnd(`os${i}`) * 1.2,
      })),
    [],
  );
  const dt = local - (throwT + 0.15);
  return (
    <Stage cam={cam} frame={frame}>
      <rect x={-300} y={-300} width={2600} height={1500} fill="#1d1418" />
      {Array.from({ length: 16 }).map((_, i) => (
        <line key={i} x1={-300} y1={-200 + i * 90} x2={2300} y2={-200 + i * 90 + (i % 3) * 4} stroke="#120c0f" strokeWidth={5} />
      ))}
      <defs>
        <linearGradient id="winlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2cf6a" />
          <stop offset="1" stopColor="#b8862e" />
        </linearGradient>
        <clipPath id="winclip">
          <rect x={620} y={150} width={680} height={600} />
        </clipPath>
      </defs>
      <circle cx={960} cy={450} r={700} fill="#e7c25e" opacity={0.07} />
      <rect x={620} y={150} width={680} height={600} fill="url(#winlight)" />
      <g clipPath="url(#winclip)">
        {/* lamp + wallpaper inside */}
        <circle cx={760} cy={260} r={50} fill="#fff4c2" opacity={0.6} />
        <TallFigure id="window-fig" x={960} y={1760} h={1560} t={t} frame={frame} grin={1.25} pose={{ armF, armB: [-20, 140], lean: 2 }} holdB="fork" />
      </g>
      {/* tattered curtains */}
      <path d="M620,150 L760,150 C740,300 700,420 730,560 C690,600 640,640 620,700 Z" fill="#6b2a22" stroke={INK} strokeWidth={6} />
      <path d="M1300,150 L1170,150 C1190,280 1240,420 1210,540 C1250,600 1280,660 1300,720 Z" fill="#6b2a22" stroke={INK} strokeWidth={6} />
      {/* frame + mullions */}
      <rect x={620} y={150} width={680} height={600} fill="none" stroke="#2a1d18" strokeWidth={26} />
      <path d="M960,150 L960,750 M620,450 L1300,450" stroke="#2a1d18" strokeWidth={18} />
      <rect x={590} y={740} width={740} height={40} fill="#3a2a22" stroke={INK} strokeWidth={6} />
      {/* dead flowers in a pot */}
      <path d="M1180,740 L1170,680 L1250,680 L1240,740 Z" fill="#7a3f22" stroke={INK} strokeWidth={5} />
      <path d="M1200,680 C1190,630 1170,620 1150,630 M1215,680 C1220,620 1240,600 1260,606" stroke="#4a3a20" strokeWidth={5} fill="none" />
      {/* thrown oats */}
      {dt > 0
        ? oats.map((o, i) => {
            const x = 1080 + o.vx * dt;
            const y = 470 + o.vy * dt + 900 * dt * dt;
            const sc = o.s * (1 + dt * 1.4);
            return <ellipse key={i} cx={x} cy={y} rx={9 * sc} ry={5 * sc} fill="#e3cc95" stroke={INK} strokeWidth={2} transform={`rotate(${o.r + dt * 400} ${x} ${y})`} />;
          })
        : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "That shed is where the chosen ones go to dine with our tall skinny gods." */
/* ------------------------------------------------------------------ */

export const VisionScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const sp = useDumplingSpeech();
  const cam = camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 1060, y: 580, zoom: 1.12 }, easeInOut(shot.p));
  const rays = Array.from({ length: 18 }).map((_, i) => {
    const a = (i / 18) * Math.PI * 2 + t * 0.12;
    return `M960,420 L${960 + Math.cos(a) * 2200},${420 + Math.sin(a) * 2200} L${960 + Math.cos(a + 0.14) * 2200},${420 + Math.sin(a + 0.14) * 2200} Z`;
  });
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="heav" color="#fff2b0" cx={960} cy={380} r={900} opacity={0.35} />}>
      <rect x={-400} y={-300} width={2800} height={1600} fill="#e9c95a" />
      {rays.map((d, i) => (
        <path key={i} d={d} fill="#f6e7a8" opacity={0.75} />
      ))}
      {/* clouds */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={cloudPath(-100 + i * 520, 1000 + (i % 2) * 40, 360, 120, 12, `hc${i}`)} fill="#fbf6e4" stroke={INK} strokeWidth={6} />
      ))}
      {/* gods with halos holding cutlery */}
      {[
        { x: 560, h: 1000, flip: false },
        { x: 960, h: 1120, flip: false },
        { x: 1360, h: 1000, flip: true },
      ].map((g, i) => (
        <TallFigure
          key={i}
          id={`god${i}`}
          x={g.x}
          y={1060}
          h={g.h}
          flip={g.flip}
          t={t}
          frame={frame}
          halo
          grin={1.25}
          eyes="glow"
          holdF="fork"
          holdB="knife"
          pose={{ armF: [42, 108 + Math.sin(t * 2 + i) * 8], armB: [30, 122] }}
          fill="#1a1420"
        />
      ))}
      {/* banquet table */}
      <rect x={300} y={740} width={1320} height={40} fill="#f7f3e6" stroke={INK} strokeWidth={6} />
      <path d="M300,780 L300,900 Q960,940 1620,900 L1620,780 Z" fill="#f2ecdc" stroke={INK} strokeWidth={6} />
      {[420, 640, 860, 1080, 1300, 1520].map((sx) => (
        <path key={sx} d={`M${sx},780 q-10,60 0,124`} stroke="#d8d0bc" strokeWidth={5} fill="none" />
      ))}
      {/* the empty platter waiting in the middle */}
      <ellipse cx={960} cy={736} rx={170} ry={30} fill="#c9c8c2" stroke={INK} strokeWidth={6} />
      <ellipse cx={960} cy={730} rx={130} ry={20} fill="#e2e1dc" />
      <circle cx={960} cy={712} r={22} fill="#c8231e" stroke={INK} strokeWidth={4} />
      <path d="M960,690 l4,-14" stroke="#4a3020" strokeWidth={4} />
      {/* candelabras */}
      {[600, 1320].map((cx) => (
        <g key={cx}>
          <path d={`M${cx},740 L${cx},660 M${cx - 50},680 Q${cx},720 ${cx + 50},680 M${cx - 50},680 L${cx - 50},650 M${cx + 50},680 L${cx + 50},650`} stroke="#b8963a" strokeWidth={8} fill="none" />
          {[-50, 0, 50].map((dx) => (
            <path key={dx} d={`M${cx + dx},${dx === 0 ? 656 : 646} c-8,-10 -6,-22 0,-32 c6,10 8,22 0,32 Z`} fill="#ffcf4a" stroke={INK} strokeWidth={2} />
          ))}
        </g>
      ))}
      {/* the chosen one, wearing a bib */}
      <Dumpling id="vision-dumpling" x={1700} y={1010} scale={0.72} t={t} frame={frame} {...sp} expr="dreamy" bib chewing={false} />
      {/* sparkles */}
      {Array.from({ length: 12 }).map((_, i) => {
        const ph = (t * 0.8 + rnd(`spk${i}`)) % 1;
        const x = 200 + rnd(`spkx${i}`) * 1500;
        const y = 150 + rnd(`spky${i}`) * 600;
        const s = Math.sin(ph * Math.PI) * 18;
        return <path key={i} d={`M${x},${y - s} L${x + s * 0.25},${y} L${x},${y + s} L${x - s * 0.25},${y} Z M${x - s},${y} L${x},${y + s * 0.25} L${x + s},${y} L${x},${y - s * 0.25} Z`} fill="#fffbe0" />;
      })}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "...you shall not reach the desired girth for the tall skinny ones" */
/* ------------------------------------------------------------------ */

export const GirthScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const girth = easeInOut(prog(local, 0.3, 2.2)) * 0.32;
  const stamp = prog(local, 2.3, 2.5);
  const S = 1.45;
  const DX = 1060;
  const DY = 1180;
  const bs = 1 + girth * 0.35;
  const cx = DX + 20 * S;
  const cy = DY + (-60 - 155 * bs) * S;
  const ry = 168 * bs * S;
  const rx = 222 * bs * S;
  const bandX = cx - 40 * S;
  const val = Math.round(lerp(38, 61, girth / 0.32));
  const cam: Cam = camLerp({ x: 1000, y: 620, zoom: 1.0 }, { x: 1000, y: 600, zoom: 1.08 }, easeInOut(shot.p));
  const bandD = `M${bandX},${cy - ry * 0.97} Q${bandX - rx * 0.32},${cy} ${bandX},${cy + ry * 0.97}`;
  return (
    <Stage cam={cam} frame={frame} shakeAmp={stamp > 0 && stamp < 1 ? 8 : 0}>
      <rect x={-400} y={-300} width={2800} height={1600} fill="#2a2030" />
      <rect x={-400} y={880} width={2800} height={600} fill="#2a1e16" />
      <Dumpling id="girth-dumpling" x={DX} y={DY} scale={S} t={t} frame={frame} mouth="X" expr={stamp > 0.5 ? "dreamy" : "smug"} girth={girth} chewing />
      {/* measuring tape */}
      <path d={bandD} stroke={INK} strokeWidth={46} fill="none" />
      <path d={bandD} stroke="#e2bd3c" strokeWidth={36} fill="none" />
      <path d={bandD} stroke={INK} strokeWidth={14} fill="none" strokeDasharray="3 22" />
      {/* skinny hand pinching the tape */}
      <path d={`M${bandX + 260},-200 C${bandX + 200},${cy - ry - 200} ${bandX + 80},${cy - ry - 80} ${bandX + 10},${cy - ry * 0.97 - 10}`} stroke="#0b090d" strokeWidth={26} fill="none" strokeLinecap="round" />
      {[-30, -10, 10, 30].map((fa, i) => (
        <path key={i} d={`M${bandX + 10},${cy - ry * 0.97 - 10} l${Math.sin(((200 + fa) * Math.PI) / 180) * 60},${Math.cos(((200 + fa) * Math.PI) / 180) * -60}`} stroke="#0b090d" strokeWidth={9} strokeLinecap="round" />
      ))}
      <g transform={`translate(${bandX - 170} ${cy - ry * 0.6})`}>
        <rect x={-70} y={-40} width={140} height={70} rx={8} fill="#f2ead2" stroke={INK} strokeWidth={5} />
        <text x={0} y={16} textAnchor="middle" fontFamily="SpecialElite" fontSize={44} fill={INK}>
          {val}"
        </text>
      </g>
      {stamp > 0 ? (
        <g transform={`translate(${cx + 90} ${cy + 20}) rotate(-14) scale(${lerp(2.2, 1, easeOutBack(stamp))})`} opacity={0.85}>
          <rect x={-170} y={-62} width={340} height={124} rx={18} fill="none" stroke="#6a2a8a" strokeWidth={12} />
          <text x={0} y={30} textAnchor="middle" fontFamily="SpecialElite" fontSize={92} fill="#6a2a8a" fontWeight="bold">
            PRIME
          </text>
        </g>
      ) : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "...and you scurry back to your cave."  (Plato would be proud)      */
/* ------------------------------------------------------------------ */

export const CaveScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = camLerp({ x: 960, y: 540, zoom: 1.0 }, { x: 960, y: 560, zoom: 1.08 }, easeInOut(shot.p));
  const flick = 0.85 + noise2D("cavefire", t * 4, 0) * 0.15;
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="cavewash" color="#ff9a3a" cx={960} cy={1300} r={1100} opacity={0.45 * flick} />}>
      <rect x={-400} y={-300} width={2800} height={1600} fill="#140e0c" />
      {/* lit wall */}
      <path d="M140,120 C500,40 1400,40 1780,140 L1820,820 C1400,880 500,880 100,820 Z" fill="#5a4636" stroke={INK} strokeWidth={8} />
      <path d="M140,120 C500,40 1400,40 1780,140 L1820,820 C1400,880 500,880 100,820 Z" fill="#ffb05a" opacity={0.14 * flick} />
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M${200 + i * 180},${160 + (i % 3) * 30} q40,${120 + (i % 2) * 60} -10,${260 + (i % 3) * 40}`} stroke="#3e2f24" strokeWidth={6} fill="none" />
      ))}
      {/* shadow puppets of the gods, holding oats and a heart */}
      <g opacity={0.82}>
        <TallFigure id="shadow1" x={620 + Math.sin(t * 1.4) * 60} y={900} h={760} t={t} frame={frame} fill="#1a110c" rim="#1a110c" grin={0} eyes="closed" pose={{ armF: [150, 10], armB: [-20, 0] }} />
        <TallFigure id="shadow2" x={1300 - Math.sin(t * 1.4) * 60} y={900} h={720} flip t={t} frame={frame} fill="#1a110c" rim="#1a110c" grin={0} eyes="closed" pose={{ armF: [150, 10], armB: [10, 0] }} />
        <path d="M960,330 C900,250 800,320 960,440 C1120,320 1020,250 960,330 Z" fill="#1a110c" transform={`translate(0 ${Math.sin(t * 3) * 14})`} />
        <ellipse cx={820 + Math.sin(t * 1.4) * 60} cy={250} rx={60} ry={30} fill="#1a110c" transform={`rotate(-20 ${820 + Math.sin(t * 1.4) * 60} 250)`} />
      </g>
      {/* cave mouth rocks framing */}
      <path d="M-400,-300 L2400,-300 L2400,120 C1800,40 1300,-20 960,-10 C600,-20 100,40 -400,120 Z" fill="#0d0907" />
      <path d="M-400,1500 L-400,700 C-200,820 0,980 120,1200 Z" fill="#0d0907" />
      <path d="M2400,1500 L2400,700 C2200,820 2000,980 1820,1200 Z" fill="#0d0907" />
      <rect x={-400} y={940} width={2800} height={500} fill="#1c1410" />
      {/* Dumpling, seen from behind, utterly content */}
      <DumplingBack x={960} y={1140} s={1.15} t={t} walk={0} />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "I shall take care of your spawn..."                                */
/* ------------------------------------------------------------------ */

export const LambsScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const cam = camLerp({ x: 960, y: 800, zoom: 1.55 }, { x: 960, y: 815, zoom: 1.78 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame}>
      <rect x={-400} y={-300} width={2800} height={1600} fill="#2e2018" />
      {Array.from({ length: 22 }).map((_, i) => (
        <line key={i} x1={-400 + i * 130} y1={-300} x2={-400 + i * 130 + (i % 2) * 6} y2={900} stroke="#1f150f" strokeWidth={8} />
      ))}
      <rect x={-400} y={860} width={2800} height={600} fill="#7d6a34" />
      {Array.from({ length: 70 }).map((_, i) => {
        const x = rnd(`hay${i}`) * 2400 - 200;
        const y = 870 + rnd(`hayy${i}`) * 240;
        const a = (rnd(`haya${i}`) - 0.5) * 60;
        return <line key={i} x1={x} y1={y} x2={x + Math.cos((a * Math.PI) / 180) * 40} y2={y + Math.sin((a * Math.PI) / 180) * 12} stroke="#b89a4a" strokeWidth={4} strokeLinecap="round" />;
      })}
      <rect x={1460} y={600} width={420} height={260} rx={14} fill="#b89a4a" stroke={INK} strokeWidth={7} />
      <path d="M1460,690 L1880,690 M1460,780 L1880,780" stroke="#8a7030" strokeWidth={6} />
      {[640, 960, 1280].map((x, i) => (
        <Dumpling key={i} id={`lamb${i}`} x={x} y={960} scale={0.42} t={t} frame={frame} mouth="X" expr="shocked" look={[0, 0.1]} chewing headTilt={(i - 1) * 6} />
      ))}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "...your lover, our father, our mother, and many more."             */
/* ------------------------------------------------------------------ */

export const PortraitsScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const cam = camPath(
    [
      [0, { x: 500, y: 540, zoom: 2.3 }],
      [0.6, { x: 500, y: 540, zoom: 2.4 }],
      [1.35, { x: 960, y: 540, zoom: 2.4 }],
      [2.35, { x: 960, y: 540, zoom: 2.45 }],
      [2.85, { x: 1420, y: 540, zoom: 2.4 }],
      [3.7, { x: 1420, y: 540, zoom: 2.45 }],
      [4.7, { x: 960, y: 480, zoom: 0.56 }],
    ],
    local,
  );
  const extras = useMemo(() => {
    const out: Array<{ x: number; y: number; w: number; h: number; seed: string; props: Record<string, boolean>; tilt: number }> = [];
    const rows = [-640, -220, 520, 1240];
    const cols = [-760, -260, 500, 960, 1420, 2180, 2680];
    let k = 0;
    for (const ry of rows) {
      for (const cx of cols) {
        if (ry === 520 && cx >= 500 && cx <= 1420) continue;
        const flags = ["mustache", "monocle", "pearls", "bonnet", "bow", "horns", "glasses", "tophat", "lashes", "lipstick"];
        const props: Record<string, boolean> = {};
        flags.forEach((f, j) => (props[f] = rnd(`pp${k}${j}`) < 0.22));
        out.push({ x: cx + (rnd(`px${k}`) - 0.5) * 80, y: ry + (rnd(`py${k}`) - 0.5) * 60, w: 240 + rnd(`pw${k}`) * 90, h: 300 + rnd(`ph${k}`) * 90, seed: `anc${k}`, props, tilt: (rnd(`pt${k}`) - 0.5) * 10 });
        k++;
      }
    }
    return out;
  }, []);
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="candlewash" color="#ffb04a" cx={960} cy={1000} r={1000} opacity={0.3} />}>
      <rect x={-1800} y={-1400} width={5600} height={3800} fill="#231712" />
      {Array.from({ length: 50 }).map((_, i) => (
        <line key={i} x1={-1800 + i * 120} y1={-1400} x2={-1800 + i * 120 + (i % 3) * 5} y2={2400} stroke="#170e0a" strokeWidth={9} />
      ))}
      {extras.map((p) => (
        <Portrait key={p.seed} x={p.x} y={p.y} w={p.w} h={p.h} seed={p.seed} tilt={p.tilt}>
          <g transform={`scale(${p.w / 300})`}>
            <SheepBust seed={p.seed} {...p.props} />
          </g>
        </Portrait>
      ))}
      <Portrait x={500} y={520} w={300} h={380} seed="lover" tilt={-3} label="LOVER">
        <SheepBust seed="lover" lashes lipstick bow wool="#f1e2e6" />
      </Portrait>
      <Portrait x={960} y={500} w={300} h={380} seed="father" tilt={2} label="FATHER">
        <SheepBust seed="father" horns mustache monocle wool="#d9d2c2" face="#3a3032" />
      </Portrait>
      <Portrait x={1420} y={520} w={300} h={380} seed="mother" tilt={-2} label="MOTHER">
        <SheepBust seed="mother" pearls bonnet lashes wool="#ece4d4" />
      </Portrait>
      {/* candle shelf */}
      <rect x={300} y={830} width={1320} height={30} fill="#3a2a1d" stroke={INK} strokeWidth={5} />
      {[380, 520, 730, 900, 1040, 1210, 1380, 1540].map((cx, i) => (
        <Candle key={i} x={cx} y={830} s={0.8 + (i % 3) * 0.15} t={t} seed={`cdl${i}`} />
      ))}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Ending: Dumpling walks into the shed. The door slams.               */
/* ------------------------------------------------------------------ */

export const ShedDoorScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const walk = easeIn(prog(local, 0.2, 2.5));
  const slamAt = 2.75;
  const door = local < slamAt ? 1 : 1 - easeIn(prog(local, slamAt, slamAt + 0.12));
  const dx = 960;
  const dy = lerp(1230, 960, walk);
  const ds = lerp(0.95, 0.42, walk);
  const gone = local > 2.55;
  const beckon = Math.sin(local * 6) * 30;
  const cam = camLerp({ x: 960, y: 640, zoom: 1.0 }, { x: 960, y: 640, zoom: 1.1 }, easeInOut(shot.p));
  return (
    <Stage
      cam={cam}
      frame={frame}
      shakeAmp={local > slamAt && local < slamAt + 0.5 ? 14 : 0}
      overlay={<LightWash id="doorwash" color="#ff3a17" cx={960} cy={760} r={1000} opacity={0.6 * door} />}
    >
      <rect x={-400} y={-300} width={2800} height={1600} fill="#120c18" />
      <circle cx={1500} cy={170} r={70} fill="#ddd68f" stroke={INK} strokeWidth={5} />
      <rect x={-400} y={960} width={2800} height={600} fill="#2a1e16" />
      <Shed x={960} y={962} s={2.3} t={t} glow={1.2} doorOpen={door} bulb={door > 0.5} />
      <defs>
        <clipPath id="doorway">
          <rect x={960 - 138} y={962 - 299} width={276} height={299} />
        </clipPath>
      </defs>
      <g opacity={door > 0.6 ? 1 : 0} clipPath="url(#doorway)">
        <TallFigure id="doorfig" x={990} y={1110} h={430} t={t} frame={frame} grin={1.35} eyes="glow" pose={{ lean: -6, armF: [128 + beckon, 62 + beckon], armB: [10, 10], head: -10 }} flip />
      </g>
      {!gone ? <DumplingBack x={dx} y={dy} s={ds} t={t} walk={1} /> : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* Title / credit card                                                 */
/* ------------------------------------------------------------------ */

export const TitleCard: React.FC = () => {
  const { shot } = useEpisode();
  const { local, frame } = shot;
  const o = easeOut(prog(local, 0.1, 0.8));
  const jit = (s: string) => (rnd(`${s}${onN(frame, 3)}`) - 0.5) * 4;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#070506", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: o }}>
      <div style={{ fontFamily: "Creepster", fontSize: 128, color: "#d9d27a", letterSpacing: 4, transform: `translate(${jit("a")}px, ${jit("b")}px) rotate(-1.5deg)`, textShadow: "0 0 30px rgba(200,40,20,0.45)" }}>
        BROTHER, MAY I HAVE SOME OATS?
      </div>
      <div style={{ fontFamily: "SpecialElite", fontSize: 38, color: "#b9b0a0", marginTop: 36, transform: `translate(${jit("c")}px, 0)` }}>
        voice &amp; audio: burialgoods — "brother may I have some oats" (a tribute to Joe Capo)
      </div>
    </div>
  );
};

export const BlackFrame: React.FC = () => <div style={{ position: "absolute", inset: 0, background: "#000" }} />;
