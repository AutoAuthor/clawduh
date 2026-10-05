import React, { useMemo } from "react";
import { noise2D } from "@remotion/noise";
import { Chicken, Feathers, Flames, FoxDemon, Truck } from "../characters/extras";
import { Gristle } from "../characters/Gristle";
import { INK, StinkLines } from "../characters/parts";
import { TallFigure } from "../characters/TallFigure";
import { useEpisode } from "../engine/context";
import { LightWash, ScreenFlash, Stage, camLerp } from "../engine/Stage";
import { blob, easeIn, easeInOut, easeOut, lerp, onN, prog, rnd, smoothPath } from "../engine/util";
import { Fence, Hills, Sky } from "./Pen";

/* Memory sequences narrated by Gristle. All use the "memory" grade (sepia/red) set on the shot. */

const Ground: React.FC<{ y: number; color?: string }> = ({ y, color = "#2a2016" }) => (
  <rect x={-600} y={y} width={3200} height={2600} fill={color} />
);

/* ------------------------------------------------------------------ */
/* "From the roaring beast that the tall skinny figures crawl in..."   */
/* ------------------------------------------------------------------ */

export const BeastScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const tt = onN(frame, 2) / 24;
  const vp = { x: 1520, y: 600 };
  const fold = easeInOut(prog(local, 0.4, 2.2));
  const sink = easeIn(prog(local, 1.7, 2.6));
  const drive = easeIn(prog(local, 2.9, 6.0));
  const truckX = lerp(720, vp.x, drive);
  const truckY = lerp(930, vp.y + 6, drive);
  const truckS = lerp(1.0, 0.06, drive);
  const cam = camLerp({ x: 960, y: 600, zoom: 1.04 }, { x: 1060, y: 590, zoom: 1.14 }, easeInOut(shot.p));
  const posts = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 12; i++) {
        const k = Math.pow(i / 12, 1.8);
        const px = lerp(side < 0 ? 120 : 1880, vp.x + side * 26, k);
        const py = lerp(1150, vp.y, k);
        const sz = lerp(1.4, 0.05, k);
        out.push(
          <path
            key={`${side}${i}`}
            d={`M${-12 * sz},0 L${-12 * sz},${-150 * sz} L0,${-178 * sz} L${12 * sz},${-150 * sz} L${12 * sz},0 Z`}
            transform={`translate(${px} ${py})`}
            fill="#4d3e33"
            stroke={INK}
            strokeWidth={Math.max(1, 4 * sz)}
          />,
        );
      }
    }
    return out;
  }, [vp.x, vp.y]);
  return (
    <Stage cam={cam} frame={frame} shakeAmp={drive > 0.02 && drive < 0.35 ? 4 : 1}>
      <Sky t={tt} moonX={420} moonY={230} id="bsky" />
      <Hills />
      <Ground y={598} />
      <path d={`M${vp.x - 8},${vp.y} L${vp.x + 8},${vp.y} L1640,1200 L380,1200 Z`} fill="#4a3829" stroke={INK} strokeWidth={5} />
      <path d={`M${vp.x},${vp.y + 4} L1010,1200`} stroke="#8a7a52" strokeWidth={10} strokeDasharray="60 70" opacity={0.6} />
      {posts}
      {sink < 1 ? (
        <TallFigure
          id="beastfig"
          x={truckX + 170}
          y={truckY + sink * 520}
          h={760}
          t={t}
          frame={frame}
          pose={{ lean: 72 * fold, head: 20 * fold, legF: [40 * fold, -70 * fold], legB: [30 * fold, -80 * fold], armF: [40 + 60 * fold, 20], armB: [-10 + 80 * fold, 10] }}
        />
      ) : null}
      <Truck x={truckX} y={truckY} s={truckS} t={t} rumble={local > 2.6 ? 1 : 0.25} />
      {drive > 0
        ? [0, 1, 2, 3].map((i) => {
            const ph = (local * 1.4 + i / 4) % 1;
            return (
              <circle key={i} cx={truckX - 300 * truckS - ph * 200 * truckS} cy={truckY - 40 * truckS - ph * 120 * truckS} r={(30 + ph * 90) * truckS} fill="#6a5a48" opacity={(1 - ph) * 0.5} />
            );
          })
        : null}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "...how the figure wept when the other had fallen into a deep sleep" */
/* ------------------------------------------------------------------ */

export const WeepingScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const sob = Math.round(Math.sin(t * 22) * 3);
  const puddle = easeOut(prog(local, 0.3, 4.5));
  const cam = camLerp({ x: 900, y: 470, zoom: 1.42 }, { x: 860, y: 480, zoom: 1.58 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame}>
      {/* striped wallpaper */}
      <rect x={-600} y={-1300} width={3200} height={2400} fill="#2c1f23" />
      {Array.from({ length: 32 }).map((_, i) => (
        <rect key={i} x={-592 + i * 96} y={-1300} width={40} height={2400} fill="#36262b" />
      ))}
      <rect x={-600} y={830} width={3200} height={1600} fill="#24170f" />
      <line x1={-400} y1={830} x2={2400} y2={830} stroke={INK} strokeWidth={6} />
      {/* window with moonlight */}
      <rect x={1380} y={120} width={300} height={360} fill="#cfc9a0" stroke={INK} strokeWidth={8} />
      <path d="M1530,120 L1530,480 M1380,300 L1680,300" stroke={INK} strokeWidth={8} />
      <path d="M1380,480 L1680,480 L1500,880 L980,880 Z" fill="#e8e2b0" opacity={0.08} />
      {/* candles */}
      {[700, 1420].map((cx, i) => (
        <g key={i} transform={`translate(${cx} 700)`}>
          <circle cx={0} cy={-90} r={70} fill="#ffcf6a" opacity={0.12} />
          <rect x={-14} y={-70} width={28} height={70} fill="#e8e0c8" stroke={INK} strokeWidth={4} />
          <path d={`M0,-74 C-12,-86 -8,-104 ${noise2D("cw" + i, t * 3, 0) * 5},-${120 + noise2D("ch" + i, t * 3, 0) * 6} C8,-104 12,-86 0,-74 Z`} fill="#ffcf4a" stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {/* coffin on a table: inside, sleeper, then the front panel */}
      <path d="M720,830 L740,720 M1400,830 L1380,720" stroke="#1a110b" strokeWidth={18} />
      <path d="M690,720 L1430,720 L1420,600 L700,600 Z" fill="#2e1c10" stroke={INK} strokeWidth={6} />
      <g transform="translate(1390 642) rotate(-90)">
        <TallFigure id="sleeper" x={0} y={0} h={640} t={0} frame={0} pose={{ armF: [20, 150], armB: [14, 156], head: 0, lean: 0, legF: [0, 0], legB: [0, 0] }} grin={0} eyes="closed" hat={false} sway={0} />
      </g>
      <path d="M684,720 L1436,720 L1428,654 L692,654 Z" fill="#5b3a24" stroke={INK} strokeWidth={6} />
      <path d="M760,683 L1360,683" stroke="#3e2716" strokeWidth={4} />
      <g transform="translate(1040 600) rotate(-8)">
        <ellipse cx={0} cy={0} rx={80} ry={14} fill="#a88f4e" stroke={INK} strokeWidth={4} />
        <path d="M-40,0 C-40,-50 40,-50 40,0 Z" fill="#b89e5a" stroke={INK} strokeWidth={4} />
      </g>
      {/* lily */}
      <path d="M1250,612 C1260,560 1290,540 1300,520" stroke="#3c5a2a" strokeWidth={6} fill="none" />
      <path d="M1300,520 l-26,-30 l30,10 l10,-34 l10,34 l30,-10 l-26,30 Z" fill="#efe9d6" stroke={INK} strokeWidth={3} />
      {/* the weeper */}
      <g transform={`translate(0 ${sob})`}>
        <TallFigure
          id="weeper"
          x={520}
          y={830}
          h={700}
          t={t}
          frame={frame}
          pose={{ lean: 26, head: 22, armF: [80, 150], armB: [70, 158], legF: [6, -8], legB: [-6, 4] }}
          grin={0}
          eyes="sad"
          tears
          sway={0.3}
        />
      </g>
      {/* comically huge tear streams + puddle */}
      <path d={`M648,${232 + sob} C700,300 720,500 735,${830}`} stroke="#8fc5e8" strokeWidth={10} fill="none" opacity={0.85} strokeLinecap="round" strokeDasharray="40 18" strokeDashoffset={-t * 300} />
      <path d={`M628,${236 + sob} C640,320 660,520 668,${830}`} stroke="#8fc5e8" strokeWidth={8} fill="none" opacity={0.8} strokeLinecap="round" strokeDasharray="36 20" strokeDashoffset={-t * 280} />
      <ellipse cx={650} cy={845} rx={40 + puddle * 260} ry={8 + puddle * 26} fill="#8fc5e8" opacity={0.7} stroke={INK} strokeWidth={3} />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "...outside the reaches of the pointy fences, into the roaring beasts" */
/* ------------------------------------------------------------------ */

export const RoadAwayScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const tt = onN(frame, 2) / 24;
  const scroll = t * 1100;
  const hillScroll = (t * 60) % 1920;
  const cam = camLerp({ x: 930, y: 720, zoom: 1.3 }, { x: 930, y: 730, zoom: 1.42 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} shakeAmp={3}>
      <Sky t={tt} moonX={1500} moonY={210} id="rsky" />
      <g transform={`translate(${hillScroll} 0)`}>
        <Hills />
        <g transform="translate(-1920 0)">
          <Hills />
        </g>
      </g>
      <Ground y={700} color="#2c2117" />
      <rect x={-600} y={860} width={3200} height={120} fill="#4a3829" />
      <path d="M-600,920 L2600,920" stroke="#8a7a52" strokeWidth={8} strokeDasharray="90 90" strokeDashoffset={-scroll} opacity={0.7} />
      {/* receding farm far behind */}
      <g transform={`translate(${2100 + (t - shot.start) * 50} 700) scale(0.4)`} opacity={0.8}>
        <path d="M-150,0 L-146,-170 L-60,-250 L64,-246 L152,-166 L150,0 Z" fill="#3a1714" stroke={INK} strokeWidth={8} />
      </g>
      <Truck
        x={960}
        y={900}
        s={1.0}
        t={t}
        flip
        cargo={
          <g transform="translate(-160 -180)">
            <Gristle id="cargo-gristle" x={-150} y={260} scale={0.75} t={t} frame={frame} mouth="X" expr="scared" headOnly flies={false} headTilt={Math.sin(t * 9) * 6} look={[0.8, 0]} />
          </g>
        }
      />
      {/* speed lines */}
      {Array.from({ length: 8 }).map((_, i) => {
        const y = 200 + rnd(`sl${i}`) * 700;
        const x = ((rnd(`slx${i}`) * 2400 + t * 2600) % 2600) - 400;
        return <line key={i} x1={x} y1={y} x2={x + 260} y2={y} stroke="#e8dfc4" strokeWidth={3} opacity={0.35} />;
      })}
      {/* foreground pickets whipping past */}
      <g transform={`translate(${scroll % 92} 0)`}>
        <Fence y={1110} x0={-400} x1={2400} seed="roadfence" h={220} />
      </g>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "I was taken to a gathering of these tall, skinny figures..."       */
/* ------------------------------------------------------------------ */

const StringLights: React.FC<{ t: number; y: number; sag?: number; x0?: number; x1?: number; seed: string }> = ({ t, y, sag = 90, x0 = -300, x1 = 2220, seed }) => {
  const n = 22;
  const pts = Array.from({ length: n }).map((_, i) => {
    const k = i / (n - 1);
    return [lerp(x0, x1, k), y + Math.sin(k * Math.PI * 3) * sag * 0.3 + sag * (1 - Math.pow(2 * ((k * 3) % 1) - 1, 2))] as [number, number];
  });
  const cols = ["#ffd35a", "#ff6a4a", "#7ad0ff", "#9cff7a"];
  return (
    <g>
      <path d={smoothPath(pts, false)} stroke="#120c0c" strokeWidth={4} fill="none" />
      {pts.map(([px, py], i) => {
        const on = rnd(`${seed}${i}${Math.floor(t * 3)}`) > 0.25;
        const c = cols[i % cols.length];
        return (
          <g key={i}>
            {on ? <circle cx={px} cy={py + 10} r={26} fill={c} opacity={0.18} /> : null}
            <circle cx={px} cy={py + 10} r={8} fill={on ? c : "#3a3030"} stroke={INK} strokeWidth={2.5} />
          </g>
        );
      })}
    </g>
  );
};

const FerrisWheel: React.FC<{ x: number; y: number; r: number; t: number }> = ({ x, y, r, t }) => {
  const rot = t * 8;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M${-r * 0.6},${r * 1.25} L0,0 L${r * 0.6},${r * 1.25}`} stroke="#1a1418" strokeWidth={18} fill="none" />
      <g transform={`rotate(${rot})`}>
        <circle r={r} fill="none" stroke="#1a1418" strokeWidth={14} />
        <circle r={r * 0.85} fill="none" stroke="#1a1418" strokeWidth={6} />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <g key={i}>
              <line x1={0} y1={0} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke="#1a1418" strokeWidth={5} />
              <circle cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={7} fill={i % 2 ? "#ffd35a" : "#ff6a4a"} />
            </g>
          );
        })}
      </g>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 + (rot * Math.PI) / 180;
        return <rect key={i} x={Math.cos(a) * r - 22} y={Math.sin(a) * r} width={44} height={34} rx={6} fill="#241a1e" stroke={INK} strokeWidth={4} />;
      })}
    </g>
  );
};

export const FairScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const tt = onN(frame, 2) / 24;
  const parade = easeInOut(prog(local, 0.4, 7.4));
  const gx = lerp(640, 1180, parade);
  const walk = Math.sin(t * 9) * 4;
  // camera flashes
  const bucket = Math.floor(local / 0.45);
  const flashAt = bucket * 0.45 + rnd(`fl${bucket}`) * 0.3;
  const flash = rnd(`flo${bucket}`) > 0.45 ? Math.max(0, 1 - Math.abs(local - flashAt) / 0.07) : 0;
  const cam = camLerp({ x: 880, y: 600, zoom: 1.22 }, { x: 1010, y: 620, zoom: 1.32 }, easeInOut(shot.p));
  const crowd = [
    { x: 120, h: 1050, flip: false, hold: "phone" as const, g: 1.1 },
    { x: 330, h: 900, flip: false, hold: null, g: 1.0 },
    { x: 1560, h: 980, flip: true, hold: "phone" as const, g: 1.2 },
    { x: 1790, h: 1100, flip: true, hold: null, g: 1.0 },
    { x: 1990, h: 940, flip: true, hold: "drumstick" as const, g: 1.3 },
  ];
  return (
    <Stage
      cam={cam}
      frame={frame}
      overlay={flash > 0 ? <ScreenFlash color="#fffbe8" opacity={flash * 0.75} /> : null}
    >
      <Sky t={tt} moonX={1450} moonY={160} id="fsky" />
      <FerrisWheel x={300} y={420} r={280} t={t} />
      {/* striped tent */}
      <g transform="translate(1620 700)">
        <path d="M-260,0 L0,-360 L260,0 Z" fill="#7a1f1f" stroke={INK} strokeWidth={6} />
        {[-150, -50, 50, 150].map((sx, i) => (
          <path key={i} d={`M0,-360 L${sx},0 L${sx + 50},0 Z`} fill="#e3d6b8" opacity={0.9} />
        ))}
        <path d="M-40,0 L0,-120 L40,0 Z" fill="#100b0b" />
      </g>
      <Ground y={700} color="#2b2018" />
      <StringLights t={t} y={60} seed="sl1" />
      <StringLights t={t} y={190} sag={60} seed="sl2" x0={-200} x1={2120} />
      {/* stage */}
      <rect x={480} y={760} width={960} height={110} fill="#5a4030" stroke={INK} strokeWidth={6} />
      {[540, 700, 860, 1020, 1180, 1340].map((sx) => (
        <line key={sx} x1={sx} y1={760} x2={sx} y2={870} stroke="#3e2b1f" strokeWidth={4} />
      ))}
      <path d="M480,760 L1440,760" stroke="#2a1c12" strokeWidth={10} />
      {/* paraded Gristle on a leash */}
      <Gristle id="fair-gristle" x={gx} y={762 + walk * 0.3} scale={0.62} t={t} frame={frame} mouth="X" expr="scared" flies={false} look={[0.4, 0.2]} />
      <TallFigure
        id="handler"
        x={gx + 250}
        y={762}
        h={600}
        t={t}
        frame={frame}
        pose={{ armB: [-60 + walk, -20], armF: [30, 20], legF: [Math.sin(t * 9) * 16, -6], legB: [-Math.sin(t * 9) * 16, 4] }}
        grin={1.2}
      />
      <path d={`M${gx + 150},${762 - 250} Q${gx + 190},${762 - 220} ${gx + 215},${762 - 330}`} stroke="#c9a24c" strokeWidth={5} fill="none" />
      {/* crowd */}
      {crowd.map((c, i) => (
        <TallFigure
          key={i}
          id={`crowd${i}`}
          x={c.x}
          y={1180}
          h={c.h}
          flip={c.flip}
          t={t}
          frame={frame}
          grin={c.g}
          holdF={c.hold}
          pose={c.hold === "phone" ? { armF: [160, 10] } : { armF: [10 + Math.sin(t * 2 + i) * 6, 4] }}
        />
      ))}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "I saw the tall, skinny ones consuming our flesh."                  */
/* ------------------------------------------------------------------ */

export const FeastScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame } = shot;
  const tt = onN(frame, 2) / 24;
  const cam = camLerp({ x: 760, y: 540, zoom: 1.18 }, { x: 1160, y: 540, zoom: 1.24 }, easeInOut(shot.p));
  const eaters = [
    { x: 520, h: 880, ph: 0, hold: "drumstick" as const },
    { x: 960, h: 950, ph: 1.7, hold: "chop" as const },
    { x: 1400, h: 860, ph: 3.1, hold: "drumstick" as const },
  ];
  return (
    <Stage cam={cam} frame={frame}>
      <Sky t={tt} moonX={1700} moonY={150} id="fesky" />
      <StringLights t={t} y={40} seed="fsl" />
      <Ground y={720} color="#2b2018" />
      {eaters.map((e, i) => {
        const chew = Math.max(0, Math.sin(t * 9 + e.ph));
        const bite = (Math.sin(t * 2.2 + e.ph) + 1) / 2;
        return (
          <TallFigure
            key={i}
            id={`eater${i}`}
            x={e.x}
            y={1150}
            h={e.h}
            t={t}
            frame={frame}
            flip={i === 2}
            grin={1.1}
            mouthOpen={chew * 0.7}
            eyes={i === 1 ? "closed" : "dots"}
            holdF={e.hold}
            pose={{ armF: [72, 152 + bite * 12], armB: [20, 30], lean: 6 }}
          />
        );
      })}
      {/* grease drips */}
      {Array.from({ length: 6 }).map((_, i) => {
        const ph = (t * 1.2 + i / 6) % 1;
        const x = 480 + i * 190;
        return <ellipse key={i} cx={x} cy={420 + ph * 380} rx={5} ry={8} fill="#e8d27a" opacity={1 - ph} />;
      })}
      {/* picnic table piled with bones */}
      <rect x={180} y={800} width={1560} height={60} fill="#5b4330" stroke={INK} strokeWidth={6} />
      <path d="M260,860 L220,1100 M1660,860 L1700,1100" stroke="#3a2a1d" strokeWidth={22} />
      {Array.from({ length: 14 }).map((_, i) => {
        const bx = 240 + rnd(`bone${i}`) * 1440;
        const r = rnd(`boner${i}`) * 180;
        return (
          <g key={i} transform={`translate(${bx} 790) rotate(${r})`}>
            <rect x={-30} y={-6} width={60} height={12} rx={6} fill="#efe6cf" stroke={INK} strokeWidth={3} />
            <circle cx={-32} cy={-6} r={8} fill="#efe6cf" stroke={INK} strokeWidth={3} />
            <circle cx={-32} cy={6} r={8} fill="#efe6cf" stroke={INK} strokeWidth={3} />
            <circle cx={32} cy={-6} r={8} fill="#efe6cf" stroke={INK} strokeWidth={3} />
            <circle cx={32} cy={6} r={8} fill="#efe6cf" stroke={INK} strokeWidth={3} />
          </g>
        );
      })}
      <path d={blob(980, 770, 150, 50, 12, 0.1, "roastpile")} fill="#8a4a24" stroke={INK} strokeWidth={5} />
      <path d="M880,760 q40,-30 90,-10 M1000,750 q30,-20 70,0" stroke="#5a2c14" strokeWidth={6} fill="none" />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "The smell of the flesh was surely one of us."                      */
/* ------------------------------------------------------------------ */

export const SniffScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const horror = easeInOut(prog(local, 1.2, 2.6));
  const cam = camLerp({ x: 790, y: 520, zoom: 2.7 }, { x: 795, y: 505, zoom: 3.3 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame}>
      <rect x={-600} y={-1300} width={3200} height={3600} fill="#2a1d1a" />
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={300 + rnd(`bk${i}`) * 1200} cy={200 + rnd(`bky${i}`) * 400} r={30 + rnd(`bkr${i}`) * 50} fill={["#ffd35a", "#ff6a4a", "#7ad0ff"][i % 3]} opacity={0.12} />
      ))}
      <g transform={`translate(${-40 + local * 30} 0)`}>
        <StinkLines x={560} y={640} t={t} n={3} h={200} />
      </g>
      <g transform="rotate(-70 600 560)">
        <StinkLines x={620} y={560} t={t + 1} n={2} h={260} />
      </g>
      <Gristle id="sniff-gristle" x={610} y={905} t={t} frame={frame} mouth={horror > 0.5 ? "D" : "X"} expr={horror > 0.4 ? "scared" : "neutral"} bulge={horror} look={[-0.6, 0]} flies={false} headTilt={-6 + horror * 10} />
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "They suspended the flesh above a fire and let it burn..."          */
/* ------------------------------------------------------------------ */

export const SpitRoastScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const tt = onN(frame, 2) / 24;
  const pleasure = easeInOut(prog(local, 6.4, 8.0));
  const crank = t * 2.2;
  const cam = camLerp({ x: 960, y: 600, zoom: 1.0 }, { x: 960, y: 640, zoom: 1.18 }, easeInOut(shot.p));
  const sparks = Array.from({ length: 16 }).map((_, i) => {
    const ph = (t * 0.7 + rnd(`spk${i}`)) % 1;
    return { x: 960 + (rnd(`spx${i}`) - 0.5) * 300 + Math.sin(t * 3 + i) * 30, y: 880 - ph * 600, o: 1 - ph };
  });
  return (
    <Stage cam={cam} frame={frame} overlay={<LightWash id="firewash" color="#ff7a2a" cx={960} cy={1000} r={900} opacity={0.5 + noise2D("fw", t * 3, 0) * 0.1} />}>
      <Sky t={tt} moonX={1650} moonY={170} id="spsky" />
      <Hills />
      <Ground y={720} color="#2b2018" />
      {/* spectators behind the fire */}
      <TallFigure id="spit1" x={1330} y={1000} h={800} flip t={t} frame={frame} grin={1 + pleasure * 0.6} holdF="fork" pose={{ armF: [120, 30], armB: [40, 100] }} />
      <TallFigure id="spit2" x={1640} y={1040} h={860} flip t={t} frame={frame} grin={1.1 + pleasure * 0.6} eyes={pleasure > 0.5 ? "closed" : "dots"} pose={{ armF: [60, 110], armB: [30, 90] }} />
      {/* spit posts */}
      <path d="M700,900 L720,640 M720,640 L690,600 M720,640 L750,600" stroke="#3a2a1d" strokeWidth={22} strokeLinecap="round" fill="none" />
      <path d="M1220,900 L1200,640 M1200,640 L1170,600 M1200,640 L1230,600" stroke="#3a2a1d" strokeWidth={22} strokeLinecap="round" fill="none" />
      <line x1={640} y1={630} x2={1290} y2={630} stroke="#6a6a66" strokeWidth={14} />
      {/* crank + cranker */}
      <g transform={`translate(640 630) rotate(${(crank * 180) / Math.PI})`}>
        <line x1={0} y1={0} x2={0} y2={60} stroke="#6a6a66" strokeWidth={10} />
        <circle cx={0} cy={60} r={9} fill="#3a2a1d" stroke={INK} strokeWidth={3} />
      </g>
      <TallFigure id="cranker" x={420} y={1000} h={820} t={t} frame={frame} grin={1 + pleasure * 0.5} pose={{ armF: [70 + Math.sin(crank) * 25, 30 + Math.cos(crank) * 25], armB: [20, 30], lean: 8 }} />
      {/* the roast (rotating: shading slides around) */}
      <g transform="translate(960 640)">
        <ellipse cx={0} cy={0} rx={230} ry={95} fill="#8a4a24" stroke={INK} strokeWidth={7} />
        <defs>
          <clipPath id="roastclip">
            <ellipse cx={0} cy={0} rx={230} ry={95} />
          </clipPath>
        </defs>
        <g clipPath="url(#roastclip)">
          {[0, 1, 2, 3].map((i) => {
            const ph = ((crank / (Math.PI * 2) + i / 4) % 1) * 2 - 1;
            return <ellipse key={i} cx={0} cy={ph * 120} rx={240} ry={18} fill="#5a2c14" opacity={0.7} />;
          })}
          <ellipse cx={-40} cy={-40 + Math.sin(crank) * 20} rx={120} ry={20} fill="#c97a3a" opacity={0.5} />
        </g>
        {[-150, -90, 90, 150].map((lx, i) => (
          <path key={i} d={`M${lx},${Math.sin(crank + i) * 30 - 60} l${(i < 2 ? -1 : 1) * 20},-60`} stroke="#8a4a24" strokeWidth={26} strokeLinecap="round" />
        ))}
        <path d="M-160,-20 l320,0" stroke="#c9b48a" strokeWidth={5} strokeDasharray="20 20" />
      </g>
      {/* drips */}
      {Array.from({ length: 5 }).map((_, i) => {
        const ph = (t * 1.5 + i / 5) % 1;
        return <ellipse key={i} cx={880 + i * 40} cy={720 + ph * 160} rx={5} ry={9} fill="#e8b84a" opacity={1 - ph} />;
      })}
      {/* fire pit */}
      <ellipse cx={960} cy={920} rx={260} ry={46} fill="#3a3330" stroke={INK} strokeWidth={6} />
      <Flames x={960} y={910} w={420} h={300} t={t} seed="spitfire" n={8} />
      {Array.from({ length: 7 }).map((_, i) => (
        <ellipse key={i} cx={720 + i * 80} cy={930 + (i % 2) * 8} rx={44} ry={26} fill="#5d5550" stroke={INK} strokeWidth={4} />
      ))}
      {sparks.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={4} fill="#ffcf4a" opacity={s.o} />
      ))}
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "Their mouths curved a wicked smile..." — the gross-up              */
/* ------------------------------------------------------------------ */

export const GrossUpScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const smile = easeOut(prog(local, 0.3, 1.9));
  const moan = easeInOut(prog(local, 3.0, 3.6)) * (1 - easeInOut(prog(local, 5.0, 5.8)));
  const W = lerp(320, 900, smile);
  const open = moan * 70 + smile * 14;
  const lift = smile * 70;
  const tremble = 1.5 + moan * 4;
  const cam = camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 960, y: 600, zoom: 1.14 }, easeInOut(shot.p));
  const stubble = useMemo(
    () =>
      Array.from({ length: 160 }).map((_, i) => {
        const a = rnd(`stb${i}`) * Math.PI;
        const r = 0.55 + rnd(`stbr${i}`) * 0.45;
        return [960 + Math.cos(a) * 330 * r, 640 + Math.sin(a) * 420 * r] as const;
      }),
    [],
  );
  const pores = useMemo(() => Array.from({ length: 22 }).map((_, i) => [960 + (rnd(`pr${i}`) - 0.5) * 120, 560 + rnd(`pry${i}`) * 60] as const), []);
  const mouthY = 790;
  const cL = 960 - W / 2;
  const cR = 960 + W / 2;
  const upper = `M${cL},${mouthY - lift} Q960,${mouthY - 30} ${cR},${mouthY - lift}`;
  const mouthPath = `${upper} Q960,${mouthY + 60 + open * 2} ${cL},${mouthY - lift} Z`;
  const teeth: React.ReactNode[] = [];
  const nT = 15;
  for (let i = 0; i < nT; i++) {
    const k = (i + 0.5) / nT;
    const tx = lerp(cL, cR, k);
    const curveY = mouthY - lift + (1 - Math.pow(2 * k - 1, 2)) * (lift - 30 + 15);
    if (rnd(`gt${i}`) < 0.12) continue;
    const th = 30 + rnd(`gth${i}`) * 20;
    const col = rnd(`gtc${i}`) > 0.6 ? "#c9ad62" : "#e3d29a";
    teeth.push(
      <rect key={i} x={tx - W / nT / 2 + 2} y={curveY - 6} width={W / nT - 4} height={th} rx={5} fill={col} stroke={INK} strokeWidth={3} transform={`rotate(${(rnd(`gtr${i}`) - 0.5) * 14} ${tx} ${curveY})`} />,
    );
  }
  const eyeRoll = moan;
  return (
    <Stage
      cam={cam}
      frame={frame}
      shakeAmp={tremble}
      overlay={<LightWash id="gwash" color="#ff6a1a" cx={960} cy={1150} r={900} opacity={0.55} />}
    >
      <rect x={-600} y={-1300} width={3200} height={3600} fill="#120a08" />
      <defs>
        <clipPath id="gmouth">
          <path d={mouthPath} />
        </clipPath>
      </defs>
      {/* ears */}
      <path d={blob(590, 520, 70, 120, 10, 0.1, "earL")} fill="#c49a6a" stroke={INK} strokeWidth={8} />
      <path d={blob(1330, 520, 70, 120, 10, 0.1, "earR")} fill="#c49a6a" stroke={INK} strokeWidth={8} />
      <path d="M580,480 q20,40 0,80 M1340,480 q-20,40 0,80" stroke="#8a6440" strokeWidth={6} fill="none" />
      {/* face */}
      <path d={blob(960, 600, 360, 520, 18, 0.03, "gface")} fill="#d1ab7a" stroke={INK} strokeWidth={9} />
      <path d={blob(720, 700, 70, 170, 9, 0.1, "hollowL")} fill="#a57f52" opacity={0.55} />
      <path d={blob(1200, 700, 70, 170, 9, 0.1, "hollowR")} fill="#a57f52" opacity={0.55} />
      {/* forehead wrinkles */}
      {[230, 270, 310].map((wy, i) => (
        <path key={i} d={`M${760 + i * 10},${wy} Q960,${wy - 24 - smile * 10} ${1160 - i * 10},${wy}`} fill="none" stroke="#8a6440" strokeWidth={5} strokeLinecap="round" />
      ))}
      {/* brows */}
      <path d={`M700,${360 - smile * 14} L880,${396 + moan * 10}`} stroke="#2a1a10" strokeWidth={26} strokeLinecap="round" />
      <path d={`M1040,${396 + moan * 10} L1220,${360 - smile * 14}`} stroke="#2a1a10" strokeWidth={26} strokeLinecap="round" />
      {/* eyes */}
      {[790, 1130].map((ex, i) => (
        <g key={i}>
          <ellipse cx={ex} cy={450} rx={64} ry={38 - smile * 10} fill="#e9dfc0" stroke={INK} strokeWidth={6} />
          {[0, 1, 2].map((v) => (
            <path key={v} d={`M${ex - 60 + v * 8},${446 + v * 8} q20,-6 34,4`} stroke="#b3262a" strokeWidth={2.5} fill="none" />
          ))}
          <circle cx={ex + (i === 0 ? 8 : -8)} cy={452 - eyeRoll * 34} r={13} fill="#1a0e08" />
          <path d={`M${ex - 66},${450 - 6} Q${ex},${414 - smile * 6 + eyeRoll * 24} ${ex + 66},${450 - 6}`} fill="none" stroke={INK} strokeWidth={8} />
          <path d={`M${ex - 56},${492} Q${ex},${520} ${ex + 56},${492}`} fill="none" stroke="#8a6440" strokeWidth={5} />
          <path d={`M${ex - 46},${508} Q${ex},${532} ${ex + 46},${508}`} fill="none" stroke="#8a6440" strokeWidth={3} />
        </g>
      ))}
      {/* nose */}
      <path d="M930,430 C920,520 880,560 890,620 C900,660 1020,660 1030,620 C1040,560 1000,520 990,430" fill="#c99a6c" stroke={INK} strokeWidth={7} />
      <ellipse cx={960} cy={612} rx={64} ry={46} fill="#c4875f" stroke={INK} strokeWidth={7} />
      <ellipse cx={928} cy={640} rx={14} ry={9} fill="#3a1a10" />
      <ellipse cx={992} cy={640} rx={14} ry={9} fill="#3a1a10" />
      <path d="M924,646 l-4,14 M932,648 l2,12 M990,648 l-2,12 M998,646 l4,14" stroke={INK} strokeWidth={2.5} />
      {pores.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={2.4} fill="#7a4a30" opacity={0.7} />
      ))}
      {/* nasolabial folds follow the grin */}
      <path d={`M900,660 Q${cL + 60},${mouthY - lift - 60} ${cL - 20},${mouthY - lift + 20}`} fill="none" stroke="#8a6440" strokeWidth={7} strokeLinecap="round" />
      <path d={`M1020,660 Q${cR - 60},${mouthY - lift - 60} ${cR + 20},${mouthY - lift + 20}`} fill="none" stroke="#8a6440" strokeWidth={7} strokeLinecap="round" />
      {/* stubble */}
      {stubble.map(([sx, sy], i) =>
        sy > 690 ? <circle key={i} cx={sx} cy={sy} r={2.2} fill="#4a3020" opacity={0.75} /> : null,
      )}
      {/* the grin */}
      <path d={mouthPath} fill="#3a0808" stroke="#9a4a3a" strokeWidth={16} strokeLinejoin="round" />
      <g clipPath="url(#gmouth)">
        <path d={`${upper} L${cR},${mouthY - lift - 60} L${cL},${mouthY - lift - 60} Z`} fill="#c95a5a" transform="translate(0 22)" />
        {teeth}
        <ellipse cx={960} cy={mouthY + 40 + open * 1.6} rx={W * 0.25} ry={30 + open * 0.4} fill="#b8464c" stroke={INK} strokeWidth={3} />
        <ellipse cx={900} cy={mouthY + 6} rx={14} ry={8} fill="#8a4a24" stroke={INK} strokeWidth={2} />
      </g>
      <path d={mouthPath} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {/* grease + drool */}
      <path d={`M${cL + 40},${mouthY - lift + 4} q30,-10 60,0`} stroke="#fff6d8" strokeWidth={5} opacity={0.7} fill="none" />
      <path d={`M1020,${mouthY + 40 + open} q6,${50 + Math.sin(t * 3) * 14} -4,${100 + Math.sin(t * 3) * 20}`} stroke="#dfe8ee" strokeWidth={7} opacity={0.8} fill="none" strokeLinecap="round" />
      {/* straw hat brim */}
      <path d="M380,170 C600,90 1320,90 1540,170 C1360,210 560,210 380,170 Z" fill="#b89e5a" stroke={INK} strokeWidth={9} />
      <path d="M640,150 C700,-60 1220,-60 1280,150 Z" fill="#c4aa62" stroke={INK} strokeWidth={9} />
      <path d="M650,138 C900,120 1020,120 1270,138" stroke="#6b2a22" strokeWidth={16} fill="none" />
      {/* hand with gnawed bone */}
      <g transform={`translate(${1400 + Math.sin(t * 2) * 6} 1000) rotate(-30)`}>
        <rect x={-14} y={-200} width={28} height={190} rx={12} fill="#efe6cf" stroke={INK} strokeWidth={6} />
        <circle cx={-14} cy={-206} r={20} fill="#efe6cf" stroke={INK} strokeWidth={6} />
        <circle cx={14} cy={-206} r={20} fill="#efe6cf" stroke={INK} strokeWidth={6} />
        <path d={blob(0, -100, 34, 50, 8, 0.25, "meatbit")} fill="#8a4a24" stroke={INK} strokeWidth={5} />
        <path d="M-60,0 C-70,-60 -40,-80 0,-70 C40,-80 70,-60 60,0 L60,120 L-60,120 Z" fill="#c49a6a" stroke={INK} strokeWidth={7} />
        <path d="M-40,-60 L-40,-20 M-14,-70 L-14,-24 M14,-70 L14,-24 M40,-60 L40,-20" stroke={INK} strokeWidth={4} />
      </g>
    </Stage>
  );
};

/* ------------------------------------------------------------------ */
/* "...the furry red demon that consumed and terrorized us and the feathered ones" */
/* ------------------------------------------------------------------ */

export const FoxScene: React.FC = () => {
  const { shot } = useEpisode();
  const { t, frame, local } = shot;
  const rise = easeOut(prog(local, 0, 1.2));
  const chickens = prog(local, 4.6, 6.6);
  const cam = camLerp({ x: 960, y: 560, zoom: 1.0 }, { x: 960, y: 540, zoom: 1.1 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={frame} shakeAmp={2 + rise * 2}>
      <defs>
        <linearGradient id="hellsky" gradientUnits="userSpaceOnUse" x1="0" y1="-300" x2="0" y2="1300">
          <stop offset="0" stopColor="#1a0605" />
          <stop offset="1" stopColor="#7a1a0a" />
        </linearGradient>
      </defs>
      <rect x={-600} y={-1300} width={3200} height={3600} fill="url(#hellsky)" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Flames key={i} x={-100 + i * 420} y={1090} w={520} h={420 + (i % 2) * 140} t={t + i} seed={`hf${i}`} n={6} />
      ))}
      <FoxDemon x={960} y={lerp(1200, 720, rise)} s={1.55} t={t} snarl={0.6 + rise * 0.4} />
      {chickens > 0
        ? [0, 1, 2, 3, 4].map((i) => (
            <Chicken key={i} x={lerp(2200 + i * 160, -400 + i * 160, chickens)} y={980 + (i % 2) * 40} s={0.9} t={t} seed={`ch${i}`} flip />
          ))
        : null}
      {chickens > 0 ? <Feathers t={t} n={18} seed="foxf" area={[0, 300, 1920, 800]} /> : null}
    </Stage>
  );
};


