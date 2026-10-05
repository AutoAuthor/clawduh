import React from "react";
import { INK, taperPath } from "../../characters/parts";
import type { DaleProps } from "../../characters/Possum";
import type { GizzardProps } from "../../characters/Vulture";
import { useEpisode } from "../../engine/context";
import type { ShotDef } from "../../engine/EpisodePlayer";
import type { Cam } from "../../engine/Stage";
import { cue, Timeline } from "../../engine/timeline";
import { clamp, easeIn, easeInOut, easeOut, lerp, prog, rnd } from "../../engine/util";
import { DaleRear, ExteriorScene, OfficeFish, PrinterKhakis, WallOfShame } from "./cutaways";
import { Bucket, CAM4, CHET_POS, GIZ_POS, GrillScene, HEADS, PERCH_POS, SetState } from "./grill";
import timelineJson from "./timeline.json";

/**
 * EPISODE 004 — "How To Leave Early".
 * Dale (possum) wants to go home; Chet (raccoon) has an idea; Mr. Gizzard (vulture) must bear witness.
 * Shot times are anchored to the script with cue() so they follow the words.
 */
const tl = timelineJson as Timeline;
const at = (phrase: string, opts?: Parameters<typeof cue>[2]) => cue(tl, phrase, opts);

const T = {
  look: at("You look like dog shit"),
  feel: at("I'm not feeling"),
  shit1: at("Shit your pants"),
  huh: at("Huh"),
  want: at("You want to go home early"),
  yes: at("Um yes sir"),
  letgo: at("Shit your pants I'll have"),
  letgoEnd: at("let you go", { edge: "end" }),
  ifI: at("If I shit my pants"),
  rightNow: at("You shit your pants right now"),
  tied: at("My hands will be tied"),
  soiledLine: at("Your pants will be soiled"),
  skedaddle: at("skedaddle"),
  doIt: at("You should do it"),
  well: at("Well sir"),
  gone: at("Shit your pants and you're gone"),
  tomorrow: at("I'll see you tomorrow"),
  sayI: at("Sir I don't know"),
  notNow: at("No sir not now"),
  gottaSee: at("I gotta see that"),
  gotta1: at("He's gotta see it"),
  once: at("Once I see the shit"),
  gotta2: at("He's gotta see the shit"),
  butSir: at("but sir"),
  record: at("And for the record"),
  lied: at("You could've just said it"),
  arguing: at("No arguing with a man"),
  witness: at("But now because you asked me"),
  gotta3: at("He's gotta see it", { after: 45 }),
  gotta3End: at("He's gotta see it", { after: 45, edge: "end" }),
  done: at("Okay I've done it"),
  shatIt: at("I shit my pants", { after: 52 }),
  shatEnd: at("I shit my pants", { after: 52, edge: "end" }),
  ugh: at("Ugh"),
  bro: at("Bro what the fuck"),
  bro2: at("Bro what the fuck did you eat", { after: 57 }),
  excused: at("May I be excused"),
  nah: at("Nah"),
  backToWork: at("Nah you get back to work"),
  fish: at("See that's worse"),
  office: at("when they cooked fish"),
  whatIs4: at("What is that", { after: 65.5 }),
  getBack: at("Get back to work", { after: 66 }),
  khakis: at("I got extra khakis"),
  why: at("Why do you have"),
  because: at("Because of worthless"),
  didnt: at("I didn't want to"),
  butYouDid: at("But you did"),
  shut: at("You shut those pants"),
  made: at("You made me"),
  didntMake: at("I didn't make you actually"),
  twice: at("Now if you shit"),
  twiceEnd: at("let you go home", { after: 80, edge: "end" }),
  really: at("Really"),
  no: at("No what the fuck is wrong"),
  psycho: at("I cannot believe this psychopath"),
  end: tl.duration,
};

/* ------------------------------------------------------------------ */
/* Continuity driven by the clock                                      */
/* ------------------------------------------------------------------ */

const soiledAt = (t: number) => (t < T.shatIt - 0.3 ? 0 : clamp((t - (T.shatIt - 0.3)) / 1.6));
const stinkAt = (t: number) => (t < T.ugh - 0.2 ? 0 : 0.5 * easeOut(clamp((t - (T.ugh - 0.2)) / 2.2)));
const setAt = (t: number): Partial<SetState> => ({ days: t < T.ugh - 0.35 ? 3 : 0, stink: stinkAt(t) });

/** Dale's defaults at time t (sick before, soiled after). */
const daleAt = (t: number): Partial<DaleProps> => {
  const soiled = soiledAt(t);
  return { sick: t < T.done ? 0.7 : 0.35, soiled, flies: soiled > 0.5 ? 4 : 2, spatula: t < T.sayI };
};

/** Mr. Gizzard after the hop-down: standing next to the cast, mug in wing; on the bucket while he bears witness. */
const gizAt = (t: number): Partial<GizzardProps> => {
  const sitting = t >= T.witness + 0.6 && t < T.ugh;
  return {
    pose: sitting ? "sit" : "stand",
    x: sitting ? GIZ_POS.x + 10 : GIZ_POS.x,
    y: GIZ_POS.y,
    lamp: t >= T.gottaSee && t < T.ugh,
    lampAim: 24,
  };
};

const bucket = (t: number) => (t >= T.witness + 0.3 && t < T.ugh + 0.4 ? <Bucket x={GIZ_POS.x + 4} y={GIZ_POS.y + 6} /> : null);

/** The usual kitchen with everyone where they should be at time t. */
const Kitchen: React.FC<{
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  dale?: Partial<DaleProps> | false;
  chet?: Parameters<typeof GrillScene>[0]["chet"];
  giz?: Partial<GizzardProps> | false;
  set?: Partial<SetState>;
  shakeAmp?: number;
  front?: React.ReactNode;
  back?: React.ReactNode;
}> = ({ from, to, cam, ease, dale = {}, chet = {}, giz = {}, set = {}, shakeAmp, front, back }) => {
  const { shot } = useEpisode();
  const t = shot.t;
  return (
    <GrillScene
      from={from}
      to={to}
      cam={cam}
      ease={ease}
      dale={dale === false ? false : { ...daleAt(t), ...dale }}
      chet={chet}
      gizzard={giz === false ? false : { ...gizAt(t), ...giz }}
      set={{ ...setAt(t), ...set }}
      shakeAmp={shakeAmp}
      back={
        <>
          {bucket(t)}
          {back}
        </>
      }
      front={front}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Little props                                                        */
/* ------------------------------------------------------------------ */

const FallingFeathers: React.FC<{ x: number; y: number; l: number; n?: number }> = ({ x, y, l, n = 6 }) => (
  <g>
    {Array.from({ length: n }).map((_, i) => {
      const fx = x + (rnd(`ff${i}`) - 0.5) * 300 + Math.sin(l * 3 + i) * 30;
      const fy = y - 260 + rnd(`ffy${i}`) * 120 + l * 140;
      const rot = Math.sin(l * 4 + i) * 40;
      return (
        <path key={i} d={taperPath([[0, 0], [10, 22], [6, 46]], 14, 2)} transform={`translate(${fx} ${fy}) rotate(${rot})`} fill="#3a2c27" stroke={INK} strokeWidth={2.5} opacity={clamp(1.6 - l * 0.6)} />
      );
    })}
  </g>
);

const FallingCup: React.FC<{ x: number; y: number; l: number; floor: number }> = ({ x, y, l, floor }) => {
  const g = 2400;
  const fy = Math.min(floor, y + 0.5 * g * l * l);
  const landed = fy >= floor;
  const tl2 = landed ? l - Math.sqrt((2 * (floor - y)) / g) : 0;
  return (
    <g>
      {landed ? <ellipse cx={x - 40} cy={floor + 10} rx={80 + Math.min(1, tl2 * 4) * 120} ry={18 + Math.min(1, tl2 * 4) * 16} fill="#6a2a2a" opacity={0.75} /> : null}
      <g transform={`translate(${x - (landed ? 40 : l * 80)} ${fy}) rotate(${landed ? 90 : l * 400})`}>
        <path d="M-40,-70 L40,-70 L30,80 L-26,80 Z" fill="#f2efe6" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M-30,-70 L-16,-70 L-10,80 L-20,80 Z M4,-70 L18,-70 L16,80 L6,80 Z" fill="#c8372e" />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Shots                                                               */
/* ------------------------------------------------------------------ */

const P = (f: number, a: number, b: number) => prog(f, a, b);

const ExtOpen = () => <ExteriorScene from={{ x: 1180, y: 520, zoom: 0.9 }} to={{ x: 1180, y: 560, zoom: 1.02 }} />;

const TwoOpen = () => (
  <Kitchen
    from={CAM4.two}
    to={{ ...CAM4.two, zoom: 1.32, y: 640 }}
    dale={{ expr: "sick", look: [0.1, 0.9], headTilt: 8, rumble: 0.6 }}
    chet={{ expr: "smug", look: [-0.7, 0.1] }}
    giz={{ pose: "perch", x: PERCH_POS.x, y: PERCH_POS.y, shade: 1, glow: 0 }}
    set={{ dark: 1 }}
  />
);

const CuDaleFeel = () => (
  <Kitchen from={CAM4.cuDale} to={{ ...CAM4.cuDale, zoom: 2.75 }} dale={{ expr: "sick", look: [0.6, 0.3], rumble: 1 }} giz={{ pose: "perch", x: PERCH_POS.x, y: PERCH_POS.y, shade: 1 }} set={{ dark: 1 }} />
);

const CuChetShit = () => {
  const { shot } = useEpisode();
  const sip = easeInOut(P(shot.t, T.shit1 + 0.7, T.shit1 + 1.0)) * (1 - easeInOut(P(shot.t, T.shit1 + 1.25, T.shit1 + 1.45)));
  return <Kitchen from={CAM4.cuChet} to={{ ...CAM4.cuChet, zoom: 2.65 }} chet={{ expr: shot.t < T.shit1 + 0.6 ? "deadpan" : "smug", drink: sip, look: [-0.8, 0] }} giz={false} />;
};

const WidePause = () => {
  const { shot } = useEpisode();
  const glow = easeOut(P(shot.t, T.huh - 1.7, T.huh - 1.2));
  const turn = easeInOut(P(shot.t, T.shit1 + 1.5, T.shit1 + 2.6));
  const sip = easeInOut(P(shot.t, T.huh - 2.6, T.huh - 2.2)) * (1 - easeInOut(P(shot.t, T.huh - 1.0, T.huh - 0.7)));
  return (
    <Kitchen
      from={{ x: 1010, y: 540, zoom: 0.92 }}
      to={{ x: 1040, y: 520, zoom: 1.0 }}
      dale={{ expr: turn > 0.5 ? "confused" : "sick", look: [lerp(-0.1, 0.8, turn), lerp(0.6, 0, turn)] }}
      chet={{ expr: "smug", drink: sip, look: [-0.8, 0] }}
      giz={{ pose: "perch", x: PERCH_POS.x, y: PERCH_POS.y, shade: 1, glow, expr: "intense", look: [0.9, 0.6] }}
      set={{ dark: 1, flicker: 0.5 }}
    />
  );
};

const CuDaleHuh = () => <Kitchen from={CAM4.cuDale} to={{ ...CAM4.cuDale, zoom: 2.7, x: CAM4.cuDale.x + 10 }} dale={{ expr: "confused", look: [0.9, -0.1], headTilt: -10 }} giz={{ pose: "perch", x: PERCH_POS.x, y: PERCH_POS.y, shade: 1 }} set={{ dark: 1 }} />;

const PerchReveal = () => {
  const { shot } = useEpisode();
  const lit = P(shot.local, 0.15, 0.3) * (rnd(`pl${Math.floor(shot.frame / 3)}`) < 0.2 && shot.local < 0.7 ? 0.4 : 1);
  return (
    <Kitchen
      from={{ ...CAM4.perchLow, zoom: 2.0 }}
      to={CAM4.perchLow}
      giz={{ pose: "perch", x: PERCH_POS.x, y: PERCH_POS.y, shade: 1 - lit * 0.85, glow: 1 - lit * 0.8, expr: "intense", look: [0.9, 0.7], crane: 20 }}
      set={{ dark: 1 - lit * 0.6, flicker: 0.6 }}
    />
  );
};

const CuDaleYes = () => <Kitchen from={{ ...CAM4.cuDale, y: CAM4.cuDale.y - 20 }} to={{ ...CAM4.cuDale, zoom: 2.7 }} dale={{ expr: "scared", look: [0.7, -0.9], headTilt: -14 }} giz={{ pose: "perch", x: PERCH_POS.x, y: PERCH_POS.y, shade: 0.3 }} set={{ dark: 0.4 }} />;

const PerchLetGo = () => (
  <Kitchen from={CAM4.perch} to={{ ...CAM4.perch, zoom: 1.85 }} giz={{ pose: "perch", x: PERCH_POS.x, y: PERCH_POS.y, shade: 0.12, expr: "smug", look: [0.9, 0.8], crane: 26 }} set={{ dark: 0.35 }} />
);

/** Gizzard drops off the ice machine, wings out, mug and all. */
const WideHop = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const take = 0.55;
  const land = 1.2;
  const k = clamp((l - take) / (land - take));
  const flying = l >= take && l < land;
  const x = lerp(PERCH_POS.x, GIZ_POS.x, easeInOut(k));
  const y = lerp(PERCH_POS.y, GIZ_POS.y, easeIn(k)) - Math.sin(Math.PI * k) * 50;
  const sip = easeInOut(P(l, 1.9, 2.3)) * (1 - easeInOut(P(l, 2.6, 2.9)));
  const shakeAmp = l > land && l < land + 0.3 ? 14 * (1 - (l - land) / 0.3) : 0;
  return (
    <Kitchen
      from={{ x: 1060, y: 500, zoom: 0.82 }}
      to={{ x: 1000, y: 540, zoom: 0.94 }}
      dale={{ expr: "scared", look: [0.9, l < land ? -0.6 : -0.3] }}
      chet={{ expr: "shocked", look: [0.9, l < land ? -0.6 : -0.2] }}
      giz={{
        pose: l < take || k < 0.45 ? "perch" : "stand",
        x: l < take ? PERCH_POS.x : x,
        y: l < take ? PERCH_POS.y : y,
        armF: flying ? [150, 10] : undefined,
        armB: flying ? [-150, -10] : undefined,
        expr: flying ? "intense" : "smug",
        sip,
        look: [0.9, 0.3],
      }}
      shakeAmp={shakeAmp}
      front={l > land ? <FallingFeathers x={GIZ_POS.x - 40} y={GIZ_POS.y - 300} l={l - land} /> : null}
    />
  );
};

const CuDaleIfI = () => <Kitchen from={CAM4.cuDale} to={{ ...CAM4.cuDale, zoom: 2.7 }} dale={{ expr: "hopeful", look: [0.8, -0.5], headTilt: 6 }} />;

const MsGizTied = () => {
  const { shot } = useEpisode();
  const tie = easeInOut(P(shot.t, T.tied - 0.2, T.tied + 0.25));
  return (
    <Kitchen
      from={CAM4.msGiz}
      to={{ ...CAM4.msGiz, zoom: 1.75, y: CAM4.msGiz.y - 60 }}
      giz={{ expr: shot.t < T.tied ? "stern" : "lecture", look: [0.9, 0.5], armF: tie > 0 ? [lerp(30, 70, tie), lerp(100, 50, tie)] : undefined, armB: tie > 0 ? [lerp(-10, 64, tie), lerp(12, 56, tie)] : undefined }}
      dale={{ expr: "confused", look: [0.9, -0.5] }}
    />
  );
};

const TwoSkedaddle = () => {
  const { shot } = useEpisode();
  const shoo = P(shot.t, T.skedaddle - 0.15, T.skedaddle + 0.7);
  const wave = Math.sin(shoo * Math.PI * 4) * (1 - shoo) * 40;
  return (
    <Kitchen
      from={{ x: 840, y: 600, zoom: 1.45 }}
      to={{ x: 860, y: 590, zoom: 1.55 }}
      giz={{ expr: "smug", look: [0.9, 0.6], armB: shoo > 0 && shoo < 1 ? [80 + wave, 40] : undefined }}
      dale={{ expr: "confused", look: [0.9, -0.5] }}
    />
  );
};

const CuChetDoIt = () => <Kitchen from={{ ...CAM4.cuChet, x: CAM4.cuChet.x + 50 }} to={{ ...CAM4.cuChet, x: CAM4.cuChet.x + 40, zoom: 2.8 }} chet={{ expr: "whisper", recoil: -0.5, look: [-1, 0.1], armB: [70, 120] }} />;

const CuDaleWell = () => <Kitchen from={{ ...CAM4.cuDale, zoom: 2.7 }} dale={{ expr: "pleading", look: [0.9, -0.5] }} />;

const CuGizGone = () => {
  const { shot } = useEpisode();
  const wave = shot.t > T.tomorrow - 0.1 ? Math.sin((shot.t - T.tomorrow) * 14) * 18 : 0;
  return <Kitchen from={CAM4.cuGiz} to={{ ...CAM4.cuGiz, zoom: 2.55 }} giz={{ expr: "gleeful", look: [0.9, 0.5], armB: shot.t > T.tomorrow - 0.2 ? [130 + wave, 20] : undefined }} />;
};

const CuDaleSay = () => <Kitchen from={CAM4.cuDale} to={{ ...CAM4.cuDale, zoom: 2.75 }} dale={{ expr: "pleading", look: [0.9, -0.6], armF: [60, 70], armB: [50, 80], headTilt: 8 }} />;

const EcuGizLamp = () => {
  const { shot } = useEpisode();
  const shake = shot.t < T.gottaSee ? Math.sin(shot.local * 18) * 7 : 0;
  return (
    <Kitchen
      from={{ ...CAM4.cuGiz, zoom: 2.6 }}
      to={{ ...CAM4.ecuGiz, zoom: 3.6 }}
      giz={{ expr: shot.t < T.gottaSee ? "stern" : "intense", headTilt: shake, look: [0.9, 0.7], crane: shot.t > T.gottaSee ? 30 : 0, lampAim: 30 }}
    />
  );
};

const CuChetNod: React.FC<{ when: number }> = ({ when }) => {
  const { shot } = useEpisode();
  const nod = Math.max(0, Math.sin((shot.t - when) * 9)) * 10 * (shot.t > when ? 1 : 0);
  return <Kitchen from={CAM4.cuChet} to={{ ...CAM4.cuChet, zoom: 2.65 }} chet={{ expr: "serious", headTilt: nod, look: [-0.9, 0.4] }} />;
};

const LampPov = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.1, shot.end - shot.start - 0.2));
  return <DaleRear spot={{ x: lerp(640, 1240, k), y: 640 + Math.sin(k * Math.PI * 3) * 60 }} droop={0.1} />;
};

const CuChetPoint = () => <Kitchen from={CAM4.cuChet} to={{ ...CAM4.cuChet, zoom: 2.6, x: CAM4.cuChet.x - 30 }} chet={{ expr: "serious", look: [-0.9, 0.6], armB: [100, 10] }} />;

const CuDaleButSir = () => <Kitchen from={{ ...CAM4.cuDale, zoom: 2.6 }} dale={{ expr: "pleading", look: [0.9, -0.5], armF: [130, 20] }} />;

const MsGizRecord = () => <Kitchen from={CAM4.msGiz} to={{ ...CAM4.msGiz, zoom: 1.7 }} giz={{ expr: "lecture", look: [0.9, 0.5], armB: [120, 40] }} />;

const TwoWhisper = () => (
  <Kitchen
    from={{ x: 930, y: 640, zoom: 1.3 }}
    to={{ x: 930, y: 630, zoom: 1.38 }}
    dale={{ expr: "scared", look: [0.9, 0] }}
    chet={{ expr: "whisper", recoil: -0.6, look: [-1, 0.2], armB: [70, 120], x: CHET_POS.x - 140 }}
    giz={false}
  />
);

const CuGizArguing = () => <Kitchen from={CAM4.cuGiz} to={{ ...CAM4.cuGiz, zoom: 2.6 }} giz={{ expr: "lecture", look: [0.9, 0.4], armB: [150, 30] }} />;

const WideWitness = () => {
  const { shot } = useEpisode();
  const sitK = easeInOut(P(shot.t, T.witness + 0.2, T.witness + 0.6));
  return (
    <Kitchen
      from={CAM4.wide}
      to={{ x: 820, y: 640, zoom: 1.3 }}
      dale={{ expr: "scared", look: [0.9, 0.2] }}
      chet={{ expr: "serious", look: [-0.9, 0.3], drink: easeInOut(P(shot.t, T.gotta3 - 1.2, T.gotta3 - 0.8)) }}
      giz={{ expr: "intense", look: [0.9, 0.9], lampAim: 34, crane: 10 + sitK * 10 }}
    />
  );
};

const StrainDale = () => {
  const { shot } = useEpisode();
  const s = easeIn(P(shot.local, 0, 1.0));
  return <Kitchen from={{ ...CAM4.cuDale, zoom: 3.0 }} to={CAM4.ecuDale} dale={{ expr: "strain", strain: s, sick: 0.3 }} shakeAmp={s * 6} />;
};

const StrainGiz = () => <Kitchen from={{ ...CAM4.ecuGiz, y: CAM4.ecuGiz.y + 180, zoom: 3.4 }} to={{ ...CAM4.ecuGiz, y: CAM4.ecuGiz.y + 170, zoom: 4.2 }} giz={{ expr: "intense", look: [0.9, 1], lampAim: 34 }} dale={{ strain: 1, expr: "strain" }} />;

const CuDaleDone = () => <Kitchen from={CAM4.cuDale} to={{ ...CAM4.cuDale, zoom: 2.6 }} dale={{ expr: "relieved", look: [0.8, -0.3], headTilt: -6, strain: 0 }} />;

const RearReveal = () => {
  const { shot } = useEpisode();
  const s = soiledAt(shot.t);
  return <DaleRear soiled={s} droop={0.15 + s * 0.85} />;
};

const DaysFlip = () => {
  const { shot } = useEpisode();
  const f = easeInOut(P(shot.local, 0.08, 0.4));
  return <Kitchen from={{ x: 1375, y: 228, zoom: 3.1 }} to={{ x: 1375, y: 228, zoom: 3.4 }} set={{ days: f < 0.5 ? 3 : 0, daysFlip: f }} />;
};

const CuGizUgh = () => <Kitchen from={{ ...CAM4.cuGiz, y: CAM4.cuGiz.y + 150 }} to={{ ...CAM4.cuGiz, y: CAM4.cuGiz.y + 120, zoom: 2.1 }} giz={{ expr: "disgusted", puff: 1, look: [0.9, 0.6], crane: -20 }} shakeAmp={5} />;

const CuChetWtf = () => <Kitchen from={CAM4.cuChet} to={{ ...CAM4.cuChet, zoom: 2.7 }} chet={{ expr: "gag", recoil: 0.5, look: [-0.9, 0.3] }} />;

const WideStink = () => {
  const { shot } = useEpisode();
  const wave = Math.sin(shot.local * 10) * 30;
  return (
    <Kitchen
      from={CAM4.wide}
      to={{ ...CAM4.wide, zoom: 1.0 }}
      dale={{ expr: "relieved", look: [0.6, -0.2] }}
      chet={{ expr: "disgust", drink: 1, recoil: 0.4 }}
      giz={{ expr: "disgusted", puff: 0.6, armB: [110 + wave, 30], look: [0.9, 0.4] }}
      set={{ stink: 0.8 }}
    />
  );
};

const CuDaleExcused = () => <Kitchen from={CAM4.cuDale} to={{ ...CAM4.cuDale, zoom: 2.75 }} dale={{ expr: "hopeful", look: [0.8, -0.6], headTilt: 10 }} />;

const TwoNah = () => <Kitchen from={{ x: 1160, y: 560, zoom: 1.35 }} to={{ x: 1150, y: 560, zoom: 1.45 }} giz={{ expr: "smug", look: [0.9, 0.5] }} chet={{ expr: "gag", recoil: 0.3 }} dale={false} />;

const CuChetFish = () => <Kitchen from={CAM4.cuChet} to={{ ...CAM4.cuChet, zoom: 2.6 }} chet={{ expr: "disgust", look: [-0.4, -0.6], headTilt: -8 }} />;

const CuChetWhatIs = () => <Kitchen from={{ ...CAM4.cuChet, zoom: 2.6 }} to={{ ...CAM4.cuChet, zoom: 2.85 }} chet={{ expr: "gag", recoil: 0.5 }} />;

const CuGizGetBack = () => <Kitchen from={CAM4.cuGiz} to={{ ...CAM4.cuGiz, zoom: 2.5 }} giz={{ expr: "stern", look: [0.9, 0.4], armB: [100, 0] }} />;

const CuChetWhy = () => <Kitchen from={CAM4.cuChet} to={{ ...CAM4.cuChet, zoom: 2.6 }} chet={{ expr: "defensive", look: [-0.9, -0.2], headTilt: 10 }} />;

const CuDaleDidnt = () => <Kitchen from={CAM4.cuDale} to={{ ...CAM4.cuDale, zoom: 2.7 }} dale={{ expr: "sad", look: [0.6, 0.5], headTilt: 6 }} />;

const CuGizButYouDid = () => <Kitchen from={CAM4.cuGiz} to={{ ...CAM4.cuGiz, zoom: 2.6 }} giz={{ expr: "gleeful", look: [0.9, 0.5], crane: 16 }} />;

const MsChetShat = () => <Kitchen from={CAM4.msChet} to={{ ...CAM4.msChet, zoom: 1.75 }} chet={{ expr: "shocked", armB: [130, -10], look: [-0.9, 0.2] }} />;

const CuDaleMade = () => <Kitchen from={{ ...CAM4.cuDale, x: CAM4.cuDale.x + 40, zoom: 2.4 }} to={{ ...CAM4.cuDale, x: CAM4.cuDale.x + 60, zoom: 2.6 }} dale={{ expr: "angry", look: [1, -0.1], armF: [96, 0] }} />;

const MsChetDidnt = () => {
  const { shot } = useEpisode();
  const jab = Math.sin(shot.local * 5) * 14;
  return <Kitchen from={CAM4.msChet} to={{ ...CAM4.msChet, zoom: 1.8 }} chet={{ expr: "defensive", armB: [120 + jab, 40], look: [-0.9, 0.1], recoil: 0.2 }} />;
};

const CuGizTwice = () => {
  const { shot } = useEpisode();
  const sip = easeInOut(P(shot.t, T.twiceEnd + 0.05, T.twiceEnd + 0.35));
  return <Kitchen from={{ ...CAM4.cuGiz, zoom: 2.3 }} to={{ ...CAM4.ecuGiz, zoom: 3.3 }} giz={{ expr: "sly", look: [0.9, 0.5], crane: 34, sip }} />;
};

const EcuDaleScheme = () => {
  const { shot } = useEpisode();
  const k = P(shot.local, 0.4, 1.3);
  return <Kitchen from={{ ...CAM4.ecuDale, zoom: 3.6 }} to={CAM4.ecuDale} dale={{ expr: k > 0.5 ? "scheme" : "sad", look: [0.3, k > 0.5 ? 0.9 : 0.4], headTilt: k * -6 }} />;
};

const CuChetTurn = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.1, 1.2));
  return <Kitchen from={CAM4.cuChet} to={{ ...CAM4.cuChet, zoom: 2.8 }} chet={{ expr: k > 0.6 ? "horrified" : "deadpan", look: [lerp(-0.2, -1, k), 0.2], headTilt: lerp(0, -10, k), drink: 1 - k }} />;
};

const CuDaleReally = () => {
  const { shot } = useEpisode();
  const s = easeIn(P(shot.t, T.really + 0.25, T.really + 0.7));
  return <Kitchen from={{ ...CAM4.cuDale, zoom: 2.7 }} to={{ ...CAM4.cuDale, zoom: 3.0 }} dale={{ expr: s > 0.3 ? "strain" : "scheme", strain: s, look: [0.9, -0.2] }} shakeAmp={s * 5} />;
};

const MsChetNo = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  return (
    <Kitchen
      from={CAM4.msChet}
      to={{ ...CAM4.msChet, zoom: 1.5 }}
      chet={{ expr: "horrified", recoil: easeOut(P(l, 0, 0.3)), cup: l < 0.12, armB: [140, 20], look: [-0.9, 0.3] }}
      dale={{ expr: "strain", strain: 1 }}
      front={l >= 0.12 ? <FallingCup x={CHET_POS.x - 150} y={CHET_POS.y - 220} l={l - 0.12} floor={CHET_POS.y - 30} /> : null}
    />
  );
};

const WidePsycho = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const back = easeInOut(P(l, 0, 1.6));
  return (
    <Kitchen
      from={CAM4.wide}
      to={{ ...CAM4.wide, zoom: 1.02, y: 600 }}
      dale={{ expr: "strain", strain: 1 }}
      chet={{ expr: "horrified", recoil: 1, cup: false, x: lerp(CHET_POS.x, CHET_POS.x + 300, back), armB: [150, 20] }}
      giz={{ expr: "shocked", puff: 1, crane: -30, look: [0.9, 0.3] }}
      shakeAmp={8 + l * 4}
      back={<ellipse cx={CHET_POS.x - 190} cy={CHET_POS.y - 20} rx={200} ry={30} fill="#6a2a2a" opacity={0.7} />}
    />
  );
};

const ExtBlast = () => {
  const { shot } = useEpisode();
  return <ExteriorScene from={{ x: 1000, y: 520, zoom: 0.92 }} blast={easeOut(P(shot.local, 0.1, 0.7))} />;
};

/* ------------------------------------------------------------------ */

const pDale = { x: HEADS.dale.x + 40 };
const pChet = { x: HEADS.chet.x - 40 };
const pGiz = { x: HEADS.gizzard.x - 30 };

const raw: ShotDef[] = [
  // "You good, man? You look like dog shit."
  { name: "ext-open", start: 0, end: T.look - 0.05, transition: "fade", render: () => <ExtOpen />, portrait: { x: 1320, zoom: 0.72 } },
  { name: "two-open", start: T.look - 0.05, end: T.feel - 0.1, render: () => <TwoOpen />, portrait: { x: 660, zoom: 1.3, y: 690 } },
  // "I'm not feeling a thing, man. I just wish I could leave work early."
  { name: "cu-dale-feel", start: T.feel - 0.1, end: T.shit1 - 0.08, render: () => <CuDaleFeel />, portrait: pDale },
  // "Shit your pants."
  { name: "cu-chet-shit", start: T.shit1 - 0.08, end: T.shit1 + 1.45, render: () => <CuChetShit />, portrait: pChet },
  { name: "wide-pause", start: T.shit1 + 1.45, end: T.huh - 0.08, render: () => <WidePause />, portrait: { x: (l) => lerp(900, 1640, easeInOut(prog(l, 0.9, 2.2))), zoom: 1.1, y: 470 } },
  // "Huh?"
  { name: "cu-dale-huh", start: T.huh - 0.08, end: T.want - 0.1, render: () => <CuDaleHuh />, portrait: pDale },
  // "You want to go home early?"
  { name: "perch-reveal", start: T.want - 0.1, end: T.yes - 0.1, render: () => <PerchReveal />, portrait: { x: HEADS.perch.x - 10 } },
  { name: "cu-dale-yes", start: T.yes - 0.1, end: T.letgo - 0.05, render: () => <CuDaleYes />, portrait: pDale },
  // "Shit your pants, I'll have to let you go."
  { name: "perch-letgo", start: T.letgo - 0.05, end: T.letgoEnd + 0.08, render: () => <PerchLetGo />, portrait: { x: HEADS.perch.x } },
  { name: "wide-hop", start: T.letgoEnd + 0.08, end: T.ifI - 0.1, render: () => <WideHop />, portrait: { x: (l) => lerp(1660, 1000, easeInOut(prog(l, 0.5, 1.3))), zoom: 1.05, y: 560 } },
  // "If I shit my pants, you'll let me go home?"
  { name: "cu-dale-ifi", start: T.ifI - 0.1, end: T.rightNow - 0.05, render: () => <CuDaleIfI />, portrait: pDale },
  // "You shit your pants right now? My hands will be tied."
  { name: "ms-giz-tied", start: T.rightNow - 0.05, end: T.soiledLine - 0.08, render: () => <MsGizTied />, portrait: { x: HEADS.gizzard.x - 20 } },
  // "Your pants will be soiled and you'll have to skedaddle out of here."
  { name: "two-skedaddle", start: T.soiledLine - 0.08, end: T.doIt - 0.05, render: () => <TwoSkedaddle />, portrait: { x: "speaker", zoom: 1.2, y: 620 } },
  // "You should do it." / "Well, sir."
  { name: "cu-chet-doit", start: T.doIt - 0.05, end: T.well - 0.04, render: () => <CuChetDoIt />, portrait: pChet },
  { name: "cu-dale-well", start: T.well - 0.04, end: T.gone - 0.04, render: () => <CuDaleWell />, portrait: pDale },
  // "Shit your pants and you're gone. I'll see you tomorrow."
  { name: "cu-giz-gone", start: T.gone - 0.04, end: T.sayI - 0.04, render: () => <CuGizGone />, portrait: pGiz },
  // "Sir, I don't know. Can't I just say I shat my pants?"
  { name: "cu-dale-say", start: T.sayI - 0.04, end: T.notNow - 0.08, render: () => <CuDaleSay />, portrait: pDale },
  // "No sir, not now. I gotta see that shit in your pants."
  { name: "ecu-giz-lamp", start: T.notNow - 0.08, end: T.gotta1 - 0.02, render: () => <EcuGizLamp />, portrait: { x: HEADS.gizzard.x - 60 } },
  // "He's gotta see it."
  { name: "cu-chet-gotta1", start: T.gotta1 - 0.02, end: T.once - 0.02, render: () => <CuChetNod when={T.gotta1} />, portrait: pChet },
  // "Once I see the shit in your pants, you'll be excused."
  { name: "lamp-pov", start: T.once - 0.02, end: T.gotta2 - 0.04, render: () => <LampPov />, portrait: { x: 960, zoom: 0.95 } },
  // "He's gotta see the shit," / "but sir-"
  { name: "cu-chet-gotta2", start: T.gotta2 - 0.04, end: T.butSir - 0.08, render: () => <CuChetPoint />, portrait: pChet },
  { name: "cu-dale-butsir", start: T.butSir - 0.08, end: T.record - 0.02, render: () => <CuDaleButSir />, portrait: pDale },
  // "And for the record, if you would've just said you shat your pants, I would've believed-"
  { name: "ms-giz-record", start: T.record - 0.02, end: T.lied - 0.02, render: () => <MsGizRecord />, portrait: { x: HEADS.gizzard.x - 20 } },
  // "You could've just said it. You could've just lied."
  { name: "two-whisper", start: T.lied - 0.02, end: T.arguing - 0.02, render: () => <TwoWhisper />, portrait: { x: 900, zoom: 1.15, y: 660 } },
  // "No arguing with a man that claims shit in the pants."
  { name: "cu-giz-arguing", start: T.arguing - 0.02, end: T.witness - 0.04, render: () => <CuGizArguing />, portrait: pGiz },
  // "But now, because you asked me, I'll be forced to bear witness."
  { name: "wide-witness", start: T.witness - 0.04, end: T.gotta3 - 0.03, render: () => <WideWitness />, portrait: { x: (l) => lerp(1020, 700, easeInOut(prog(l, 0.5, 3.2))), zoom: 1.05, y: 680 } },
  // "He's gotta see it."
  { name: "cu-chet-gotta3", start: T.gotta3 - 0.03, end: T.gotta3End + 0.04, render: () => <CuChetNod when={T.gotta3} />, portrait: pChet },
  // ...the strain
  { name: "strain-dale", start: T.gotta3End + 0.04, end: T.gotta3End + 1.2, render: () => <StrainDale />, portrait: pDale },
  { name: "strain-giz", start: T.gotta3End + 1.2, end: T.done - 0.06, render: () => <StrainGiz />, portrait: { x: HEADS.gizzard.x - 60 } },
  // "Okay. I've done it, sir. I shit my pants."
  { name: "cu-dale-done", start: T.done - 0.06, end: T.shatIt - 0.25, render: () => <CuDaleDone />, portrait: pDale },
  { name: "rear-reveal", start: T.shatIt - 0.25, end: T.shatEnd + 0.05, render: () => <RearReveal />, portrait: { x: 960, zoom: 0.9 } },
  { name: "days-flip", start: T.shatEnd + 0.05, end: T.ugh - 0.04, render: () => <DaysFlip />, portrait: { x: 1375, zoom: 1.2 } },
  // "Ugh!"
  { name: "cu-giz-ugh", start: T.ugh - 0.04, end: T.bro + 0.45, render: () => <CuGizUgh />, portrait: pGiz },
  // "Bro, what the fuck? What the fuck did you eat?"
  { name: "cu-chet-wtf", start: T.bro + 0.45, end: T.bro2 - 0.05, render: () => <CuChetWtf />, portrait: pChet },
  // "Bro, what the fuck did you eat? God, what is that? What is that?"
  { name: "wide-stink", start: T.bro2 - 0.05, end: T.excused - 0.05, render: () => <WideStink />, portrait: { x: "speaker", zoom: 1.1, y: 640 } },
  // "May I be excused?"
  { name: "cu-dale-excused", start: T.excused - 0.05, end: T.nah - 0.1, render: () => <CuDaleExcused />, portrait: pDale },
  // "Nah." / "What is that?" / "Nah. Nah, you get back to work."
  { name: "two-nah", start: T.nah - 0.1, end: T.fish - 0.03, render: () => <TwoNah />, portrait: { x: "speaker", zoom: 1.1, y: 620 } },
  // "See, that's worse than when they cooked fish in the office."
  { name: "cu-chet-fish", start: T.fish - 0.03, end: T.office - 0.05, render: () => <CuChetFish />, portrait: pChet },
  { name: "fb-office", start: T.office - 0.05, end: T.whatIs4 - 0.05, grade: "memory", transition: "flash", render: () => <OfficeFish />, portrait: { x: 900, zoom: 0.75 } },
  // "What is that?"
  { name: "cu-chet-whatis", start: T.whatIs4 - 0.05, end: T.getBack - 0.05, render: () => <CuChetWhatIs />, portrait: pChet },
  // "Get back to work. I got extra khakis in the printer room."
  { name: "cu-giz-getback", start: T.getBack - 0.05, end: T.khakis + 0.3, render: () => <CuGizGetBack />, portrait: pGiz },
  { name: "printer", start: T.khakis + 0.3, end: T.why - 0.03, grade: "night", render: () => <PrinterKhakis />, portrait: { x: 960, zoom: 0.85 } },
  // "Why do you have an extra pair of khakis?"
  { name: "cu-chet-why", start: T.why - 0.03, end: T.because - 0.05, render: () => <CuChetWhy />, portrait: pChet },
  // "Because of worthless employees that think they can shit their pants and leave early."
  { name: "wall-of-shame", start: T.because - 0.05, end: T.didnt - 0.05, render: () => <WallOfShame />, portrait: { x: (l) => lerp(640, 1300, easeInOut(prog(l, 0, 2.6))), zoom: 0.95 } },
  // "I didn't want to shit my pants."
  { name: "cu-dale-didnt", start: T.didnt - 0.05, end: T.butYouDid - 0.05, render: () => <CuDaleDidnt />, portrait: pDale },
  // "But you did. You did shit your pants."
  { name: "cu-giz-butyoudid", start: T.butYouDid - 0.05, end: T.shut - 0.03, render: () => <CuGizButYouDid />, portrait: pGiz },
  // "You shat those pants."
  { name: "ms-chet-shat", start: T.shut - 0.03, end: T.made - 0.05, render: () => <MsChetShat />, portrait: { x: HEADS.chet.x - 40 } },
  // "You made me."
  { name: "cu-dale-made", start: T.made - 0.05, end: T.didntMake - 0.03, render: () => <CuDaleMade />, portrait: { x: HEADS.dale.x + 70 } },
  // "I didn't make you actually shit yourself. I didn't make you do shit to do that shit. I can't believe you."
  { name: "ms-chet-didnt", start: T.didntMake - 0.03, end: T.twice - 0.05, render: () => <MsChetDidnt />, portrait: { x: HEADS.chet.x - 40 } },
  // "Now, if you shit your pants twice, I'll be forced to let you go home."
  { name: "cu-giz-twice", start: T.twice - 0.05, end: T.twiceEnd + 0.4, render: () => <CuGizTwice />, portrait: { x: HEADS.gizzard.x - 50 } },
  // (silence) ...he's thinking about it.
  { name: "ecu-dale-scheme", start: T.twiceEnd + 0.4, end: T.twiceEnd + 1.9, render: () => <EcuDaleScheme />, portrait: { x: HEADS.dale.x + 50 } },
  { name: "cu-chet-turn", start: T.twiceEnd + 1.9, end: T.really - 0.06, render: () => <CuChetTurn />, portrait: pChet },
  // "Really?"
  { name: "cu-dale-really", start: T.really - 0.06, end: T.no + 0.3, render: () => <CuDaleReally />, portrait: pDale },
  // "No! What the fuck is wrong with you?"
  { name: "ms-chet-no", start: T.no + 0.3, end: T.psycho - 0.15, render: () => <MsChetNo />, portrait: { x: HEADS.chet.x - 80, zoom: 0.9 } },
  // "I cannot believe this psychopath!"
  { name: "wide-psycho", start: T.psycho - 0.15, end: T.end - 0.4, render: () => <WidePsycho />, portrait: { x: (l) => lerp(820, 1300, easeInOut(prog(l, 0.2, 1.6))), zoom: 1.0, y: 660 } },
  // the silent punchline
  { name: "ext-blast", start: T.end - 0.4, end: 999, render: () => <ExtBlast />, portrait: { x: 1150, zoom: 0.72 } },
];

/** fluorescent grade by default; cutaways set their own */
export const shots: ShotDef[] = raw.map((s) => ({ ...s, grade: s.grade ?? "fluoro" }));
