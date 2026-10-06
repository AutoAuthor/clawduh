import React from "react";
import { useEpisode } from "../../engine/context";
import type { ShotDef } from "../../engine/EpisodePlayer";
import type { Cam } from "../../engine/Stage";
import { cue } from "../../engine/timeline";
import { clamp, easeIn, easeInOut, easeOut, lerp, prog } from "../../engine/util";
import { BinaryPit, ForeignBoot, Heaven, LeashPark, WarOnDrugs } from "./cutaways";
import { CAM_N, CarvedTitle, FLOOR_Y, HallReverse, HallScene, HEAD_N, JournalInsert, TailReveal, TheDeep } from "./hall";
import { CAM_T, HEAD_T, StudioScene } from "./studio";
import { boomAt, boomCount, rumbleAt, TL } from "./tl";

/**
 * EPISODE 010 — "My Politics: Then vs Now".
 * Wendell (frog) explains his politics in 2016 from his sunny podcast desk, with cutaway gags; then a hard cut to
 * NOW: the same frog, wrecked, scribbling in a journal by one torch in a deep hall while drums boom below and the
 * dark fills with eyes. Shot times are anchored to the words with cue(); drum hits come from the score (tl.ts).
 */
const at = (phrase: string, opts?: Parameters<typeof cue>[2]) => cue(TL, phrase, opts);

const T = {
  title: at("My politics in 2016"),
  y2016: at("2016"),
  iAm: at("I am a classical liberal"),
  classical: at("classical"),
  libEnd: at("liberal", { edge: "end" }),
  gov: at("The government should restrain"),
  restrain: at("restrain itself"),
  violating: at("violating"),
  liberties: at("liberties"),
  libertiesEnd: at("liberties", { edge: "end" }),
  war: at("The war on drugs"),
  foreign: at("foreign military"),
  unjust: at("are unjust"),
  unjustEnd: at("unjust", { edge: "end" }),
  ascend: at("We shall soon ascend"),
  from: at("from this foul binary"),
  foul: at("foul binary system"),
  peace: at("and know peace"),
  peaceEnd: at("peace", { edge: "end" }),
  now: at("My politics now"),
  nowWord: at("now", { after: 22 }),
  nowEnd: at("now", { after: 22, edge: "end" }),
  bridge: at("We may have taken the bridge"),
  bridgeWord: at("bridge", { after: 26 }),
  bridgeEnd: at("bridge", { after: 26, edge: "end" }),
  hall: at("and the second hall"),
  hallEnd: at("hall", { after: 29, edge: "end" }),
  gates: at("We have barred the gates"),
  hold: at("but cannot hold them"),
  longEnd: at("long", { edge: "end" }),
  shakes: at("The ground shakes"),
  drums1: at("drums", { after: 40 }),
  drums2: at("drums in the deep"),
  deepEnd: at("deep", { edge: "end" }),
  out1: at("We cannot get out"),
  out1End: at("out", { after: 47, edge: "end" }),
  shadows: at("The shadows in the dark"),
  darkEnd: at("dark", { edge: "end" }),
  out2: at("we cannot get out", { after: 53 }),
  out2End: at("out", { after: 55, edge: "end" }),
  coming: at("they are coming"),
  comingEnd: at("coming", { edge: "end" }),
  end: TL.duration,
};

const P = prog;

/* ------------------------------------------------------------------ */
/* Clock-driven continuity                                             */
/* ------------------------------------------------------------------ */

/** live listener count on the podcast monitor */
const listenersAt = (t: number) => (t < T.iAm + 2.9 ? 3 : t < T.unjust + 0.3 ? 2 : 1);
/** eyes in the dark: none until the drums settle in, then more pairs with every boom */
const eyesAt = (t: number) => clamp((boomCount(t) - 8) / 7);
/** shadow claws creep in from the shadows line on */
const clawsAt = (t: number) => clamp((t - T.shadows + 2.2) / 5.5);

/* ------------------------------------------------------------------ */
/* THEN                                                                */
/* ------------------------------------------------------------------ */

const TSign = () => {
  const { shot } = useEpisode();
  const proud = shot.t > T.y2016 + 0.3;
  return (
    <StudioScene
      from={{ ...CAM_T.sign, zoom: 1.75 }}
      to={{ ...CAM_T.sign, zoom: 1.95, y: CAM_T.sign.y - 10 }}
      frog={{ hold: "sign", expr: proud ? "proud" : "earnest", look: [0.2, 0.2], headTilt: proud ? -6 : 0 }}
      st={{ listeners: listenersAt(shot.t) }}
    />
  );
};

const TCuClassical = () => {
  const { shot } = useEpisode();
  const tilt = shot.t > T.classical - 0.1 ? Math.sin(P(shot.t, T.classical - 0.1, T.libEnd) * Math.PI) * -10 : 0;
  return <StudioScene from={CAM_T.cu} to={{ ...CAM_T.cu, zoom: 2.7 }} frog={{ expr: shot.t < T.classical ? "earnest" : "lecture", look: [0.3, 0.1], headTilt: tilt }} st={{ listeners: listenersAt(shot.t) }} />;
};

const TMonitor = () => {
  const { shot } = useEpisode();
  return <StudioScene from={CAM_T.monitor} to={{ ...CAM_T.monitor, zoom: 3.4 }} frog={{ expr: "earnest" }} st={{ listeners: listenersAt(shot.t) }} />;
};

const PLeashWide = () => {
  const { shot } = useEpisode();
  const lunge = easeInOut(P(shot.t, T.restrain - 0.2, T.restrain + 0.35));
  return <LeashPark from={{ x: 980, y: 640, zoom: 0.98 }} to={{ x: 1000, y: 650, zoom: 1.05 }} lunge={lunge} lick={0} yank={0} />;
};

const PLeashClose = () => {
  const { shot } = useEpisode();
  const lick = easeOut(P(shot.t, T.violating - 0.1, T.violating + 0.5)) * (1 - easeInOut(P(shot.t, T.liberties, T.liberties + 0.3)));
  const yank = easeOut(P(shot.t, T.liberties - 0.05, T.liberties + 0.2));
  return <LeashPark from={{ x: 1320, y: 700, zoom: 1.45 }} to={{ x: 1340, y: 700, zoom: 1.55 }} lunge={1 - yank * 0.7} lick={lick} yank={yank} frog={{ expr: yank > 0.3 ? "stern" : "shock" }} />;
};

const TMsSip = () => {
  const { shot } = useEpisode();
  const sip = easeInOut(P(shot.local, 0.05, 0.3)) * (1 - easeInOut(P(shot.local, 0.45, 0.58)));
  return <StudioScene from={CAM_T.ms} to={{ ...CAM_T.ms, zoom: 1.65 }} frog={{ hold: "mug", sip, expr: "earnest", look: [0.55, 0.15] }} st={{ listeners: listenersAt(shot.t), mugOnDesk: false }} />;
};

const TCuUnjust = () => {
  const { shot } = useEpisode();
  const shakeHead = Math.sin(P(shot.t, T.unjust, T.unjustEnd + 0.2) * Math.PI * 4) * 9;
  return <StudioScene from={CAM_T.cu} to={{ ...CAM_T.cu, zoom: 2.6 }} frog={{ hold: "constitution", expr: "stern", headTilt: shakeHead, look: [0.4, 0.1] }} st={{ listeners: listenersAt(shot.t) }} />;
};

const TCuAscend = () => {
  const { shot } = useEpisode();
  const rise = easeIn(P(shot.t, T.ascend + 0.3, T.from + 0.1));
  const look = shot.t < T.ascend ? [0.3, -0.6] : [0.2, -1];
  return (
    <StudioScene
      from={CAM_T.cu}
      to={{ ...CAM_T.cu, y: CAM_T.cu.y - 120, zoom: 2.3 }}
      frog={{ expr: shot.t > T.ascend + 0.6 ? "serene" : "earnest", look: look as [number, number], y: HEAD_T.y + 236 - rise * 160, halo: rise, headTilt: -4 }}
      st={{ listeners: listenersAt(shot.t), sun: 1 + rise }}
    />
  );
};

const BPit = () => {
  const { shot } = useEpisode();
  const grab = easeInOut(P(shot.t, T.foul - 0.2, T.foul + 0.6));
  const rise = easeInOut(shot.p);
  return <BinaryPit from={{ x: 960, y: 640, zoom: 1.12 }} to={{ x: 960, y: 560, zoom: 1.0 }} rise={rise} grab={grab} />;
};

const HHeaven = () => {
  const { shot } = useEpisode();
  const dove = easeOut(P(shot.t, T.peaceEnd + 0.15, T.peaceEnd + 0.9));
  const wink = shot.t > T.peaceEnd + 0.95 && shot.t < T.now - 0.15;
  return (
    <Heaven
      from={{ x: 960, y: 520, zoom: 1.05 }}
      to={{ x: 960, y: 470, zoom: 1.3 }}
      dove={dove}
      frog={{ expr: wink ? "wink" : "serene", look: wink ? [0.6, 0.1] : [0, -1] }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* NOW                                                                 */
/* ------------------------------------------------------------------ */

const NEcuStare = () => {
  const { shot } = useEpisode();
  return <HallScene from={{ ...CAM_N.ecu, zoom: 3.9 }} to={{ ...CAM_N.ecu, zoom: 3.5 }} frog={{ expr: "haunted", writing: 0, look: [0.05, 0.1], tremble: 0.6 }} st={{ torch: 0.75 + P(shot.local, 0, 1) * 0.25 }} />;
};

const NWideReveal = () => (
  <HallScene from={{ x: 960, y: 440, zoom: 0.86 }} to={{ x: 980, y: 560, zoom: 1.0 }} frog={{ expr: "haunted", writing: 0.8, look: [0.3, 0.5] }} st={{ ambient: 0.55 }} />
);

const NMsBridge = () => <HallScene from={CAM_N.ms} to={{ ...CAM_N.ms, zoom: 1.75 }} frog={{ expr: "whisper", writing: 0.7, look: [0.3, 0.6] }} />;

const NBridge = () => <HallScene from={{ x: 60, y: 790, zoom: 1.22 }} to={{ x: 100, y: 800, zoom: 1.32 }} frog={{ expr: "whisper" }} st={{ torch: 0.9, ambient: 0.55, light: { x: 60, y: 820 }, radius: 1.0 }} />;

const NJournal: React.FC<{ a: number; b: number; from?: Cam; to?: Cam; last?: boolean; dark?: number }> = ({ a, b, from, to, last, dark }) => {
  const { shot } = useEpisode();
  return <JournalInsert lines={lerp(a, b, easeInOut(shot.p))} from={from} to={to} last={last} dark={dark} />;
};

const NLookUp = () => {
  const { shot } = useEpisode();
  const up = easeInOut(P(shot.local, 0.2, 0.8));
  return <HallScene from={CAM_N.cu} to={{ ...CAM_N.cu, y: CAM_N.cu.y - 40, zoom: 2.3 }} frog={{ expr: "haunted", writing: 0, look: [0.2, lerp(0.4, -1, up)], headTilt: -up * 10 }} />;
};

const GATE_LIGHT = { x: 1690, y: 620 };
const NGates = () => <HallScene from={CAM_N.gates} to={{ ...CAM_N.gates, zoom: 1.6 }} frog={false} st={{ ambient: 0.5, light: GATE_LIGHT, radius: 1.1 }} />;

const NCuHold = () => {
  const { shot } = useEpisode();
  const flinch = boomAt(shot.t, 0.3);
  return <HallScene from={CAM_N.cu} to={{ ...CAM_N.cu, zoom: 2.7 }} frog={{ expr: flinch > 0.4 ? "terror" : "frantic", writing: 0.4, look: [0.9, -0.2], headTilt: flinch * 8, sweat: 0.8 }} />;
};

/** a glowing eye in the crack between the doors, looking for him */
const NEyeCrack = () => {
  const { shot } = useEpisode();
  const open = easeOut(P(shot.local, 0.35, 0.75));
  const look = Math.sin(shot.local * 3) * 0.6;
  return (
    <HallScene
      from={{ ...CAM_N.bar, x: 1660, y: 420, zoom: 3.0 }}
      to={{ ...CAM_N.bar, x: 1660, y: 420, zoom: 3.4 }}
      frog={false}
      st={{ torch: 0.85, ambient: 0.45, light: GATE_LIGHT, radius: 0.9 }}
      glow={
        <g transform="translate(1660 420)" style={{ mixBlendMode: "screen" }}>
          <ellipse rx={60} ry={30} fill="#ff6a1a" opacity={0.25 * open} />
          <path d={`M-30,0 Q0,${-18 * open} 30,0 Q0,${14 * open} -30,0 Z`} fill="#ffd84a" opacity={open} />
          <ellipse cx={look * 14} cy={0} rx={3} ry={9 * open} fill="#2a0a04" />
        </g>
      }
    />
  );
};

/** the ground shakes before the drums start: drive the quake from the score's rumble */
const NWideShakes = () => {
  const { shot } = useEpisode();
  const quake = 0.25 + rumbleAt(shot.t) * 0.35 + Math.abs(Math.sin(shot.local * 9)) * 0.15;
  return <HallScene from={{ x: 980, y: 540, zoom: 0.96 }} to={{ x: 980, y: 560, zoom: 1.04 }} frog={{ expr: "terror", writing: 0, look: [0, -0.9] }} shake={1.4} st={{ boom: Math.max(boomAt(shot.t), quake), ambient: 0.45 }} />;
};

const NEcuDrums = () => {
  const { shot } = useEpisode();
  const hit = boomAt(shot.t, 0.25);
  return <HallScene from={{ ...CAM_N.ecu, zoom: 3.5 }} to={{ ...CAM_N.ecu, zoom: 3.9 }} frog={{ expr: hit > 0.35 ? "terror" : "haunted", writing: 0, look: [0.1, 0.6], tremble: 0.8 + hit }} />;
};

const NCuOut = () => <HallScene from={CAM_N.cu} to={{ ...CAM_N.cu, zoom: 2.75 }} frog={{ expr: "weep", writing: 1, look: [0.3, 0.7], tremble: 0.7 }} />;

const NRevEyes = () => {
  const { shot } = useEpisode();
  // this shot IS the gathering: more pairs open on each beat than in the wides
  return <HallReverse eyes={clamp((boomCount(shot.t) - 8) / 4)} near={0} claws={0} />;
};

const NWideShadows = () => {
  const { shot } = useEpisode();
  return (
    <HallScene
      from={{ x: 980, y: 600, zoom: 1.12 }}
      to={{ x: 990, y: 640, zoom: 1.32 }}
      frog={{ expr: "terror", writing: 0.2, look: [-0.8, 0.1] }}
      st={{ eyes: eyesAt(shot.t), claws: clawsAt(shot.t), torch: 1 - P(shot.t, T.shadows, T.darkEnd) * 0.25, ambient: 0.35 }}
    />
  );
};

const NGateGlow = () => {
  const { shot } = useEpisode();
  const glow = easeOut(P(shot.t, 53.25, 53.5));
  return <HallScene from={CAM_N.gates} to={{ ...CAM_N.gates, zoom: 1.68 }} frog={false} st={{ gateGlow: glow, eyes: eyesAt(shot.t), claws: clawsAt(shot.t), ambient: 0.4, light: GATE_LIGHT, radius: 1.05 }} />;
};

const NTurnSlow = () => {
  const { shot } = useEpisode();
  const turn = easeInOut(P(shot.local, 0.3, 2.2));
  return (
    <HallScene
      from={CAM_N.ms}
      to={{ ...CAM_N.ms, zoom: 2.0, y: CAM_N.ms.y - 50 }}
      frog={{ expr: "terror", writing: 0, look: [lerp(0.4, -1, turn), 0], headTilt: -turn * 6, tremble: 0.6 + turn * 0.4 }}
      st={{ torch: 1 - turn * 0.55, eyes: eyesAt(shot.t), claws: clawsAt(shot.t) }}
    />
  );
};

const NEcuComing = () => {
  const { shot } = useEpisode();
  return <HallScene from={{ ...CAM_N.ecu, zoom: 3.6 }} to={{ ...CAM_N.ecu, zoom: 4.3 }} frog={{ expr: "terror", writing: 0, look: [-0.9, 0.1], tremble: 1 }} st={{ torch: 0.45 - shot.p * 0.15, eyes: 1, claws: clawsAt(shot.t) }} />;
};

/** the torch dies: only the eyes, closing in */
const NDark = () => {
  const { shot } = useEpisode();
  const out = easeIn(P(shot.local, 0, 0.45));
  return <HallScene from={{ ...CAM_N.ms, zoom: 1.7 }} to={{ ...CAM_N.ms, zoom: 1.85 }} frog={{ expr: "terror", writing: 0, look: [-0.6, 0], tremble: 1 }} st={{ torch: 0.3 * (1 - out), eyes: 1, claws: 1 }} shake={0.4} />;
};

/* ------------------------------------------------------------------ */

const THEN = "saturate(1.22) brightness(1.05) contrast(1.04)";
const NOW = "saturate(0.6) contrast(1.22) brightness(0.92) sepia(0.12)";
const TURN = "grayscale(0.75) contrast(1.45) brightness(0.95)";

const pT = { x: HEAD_T.x + 20, y: HEAD_T.y + 70 };
const pN = { x: HEAD_N.x + 10, y: HEAD_N.y + 70 };

const raw: ShotDef[] = [
  // "My politics in 2016." — the title card is the sign he holds up
  { name: "t-sign", start: 0, end: T.iAm - 0.62, filter: THEN, render: () => <TSign />, portrait: { x: HEAD_T.x + 20, y: HEAD_T.y + 22 } },
  // "I am a classical liberal."
  { name: "t-cu-classical", start: T.iAm - 0.62, end: T.libEnd + 0.06, filter: THEN, render: () => <TCuClassical />, portrait: pT },
  // (beat) the live counter drops a listener
  { name: "t-monitor", start: T.libEnd + 0.06, end: T.gov - 0.04, filter: THEN, render: () => <TMonitor />, portrait: { x: 480, y: 650, zoom: 1.0 } },
  // "The government should restrain itself..." — the government, on a leash
  { name: "p-leash-wide", start: T.gov - 0.04, end: T.violating - 0.44, filter: THEN, transition: "flash", render: () => <PLeashWide />, portrait: { x: (l) => lerp(760, 1180, easeInOut(prog(l, 0.4, 1.8))), y: 700, zoom: 1.0 } },
  // "...from violating our liberties."
  { name: "p-leash-close", start: T.violating - 0.44, end: T.libertiesEnd + 0.02, filter: THEN, render: () => <PLeashClose />, portrait: { x: (l) => lerp(1560, 1380, easeInOut(prog(l, 1.1, 1.6))), y: 720 } },
  // (beat) smug sip
  { name: "t-ms-sip", start: T.libertiesEnd + 0.02, end: T.war - 0.02, filter: THEN, render: () => <TMsSip />, portrait: { x: HEAD_T.x + 40, y: HEAD_T.y - 20 } },
  // "The war on drugs"
  { name: "w-drugs", start: T.war - 0.02, end: T.foreign - 0.02, filter: THEN, transition: "flash", render: () => <WarOnDrugs />, portrait: { x: 1110, y: 780, zoom: 0.62 } },
  // "and foreign military involvement"
  { name: "w-boot", start: T.foreign - 0.02, end: T.unjust - 0.02, filter: THEN, render: () => <ForeignBoot />, portrait: { x: 960, y: 520, zoom: 0.95 } },
  // "are unjust."
  { name: "t-cu-unjust", start: T.unjust - 0.02, end: T.unjustEnd + 0.04, filter: THEN, render: () => <TCuUnjust />, portrait: pT },
  // "We shall soon ascend"
  { name: "t-cu-ascend", start: T.unjustEnd + 0.04, end: T.from - 0.02, filter: THEN, render: () => <TCuAscend />, portrait: { x: HEAD_T.x + 20, y: (HEAD_T.y + 40) } },
  // "from this foul binary system"
  { name: "b-pit", start: T.from - 0.02, end: T.peace - 0.04, filter: THEN, render: () => <BPit />, portrait: { x: 960, zoom: 1.0 } },
  // "and know peace." + the blissful beat; a dove lands on his head
  { name: "h-heaven", start: T.peace - 0.04, end: T.now - 0.02, filter: THEN, transition: "flash", render: () => <HHeaven />, portrait: { x: 960, y: 520 } },
  // "My politics now." — hard cut: the carving, his shadow, the flicker
  { name: "n-title", start: T.now - 0.02, end: T.nowEnd + 0.02, filter: TURN, transition: "slam", vignette: 1.1, grain: 0.45, render: () => <CarvedTitle />, portrait: { x: 900, y: 380, zoom: 0.62 } },
  // (the drone fades in) the stare
  { name: "n-ecu-stare", start: T.nowEnd + 0.02, end: T.nowEnd + 1.4, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NEcuStare />, portrait: pN },
  // the hall
  { name: "n-wide-reveal", start: T.nowEnd + 1.4, end: T.bridge - 0.06, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NWideReveal />, portrait: { x: 1000, y: 640, zoom: 1.6 } },
  // "We may have taken the bridge"
  { name: "n-ms-bridge", start: T.bridge - 0.06, end: T.bridgeEnd + 0.08, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NMsBridge />, portrait: pN },
  // (beat) the bridge, broken, flag planted
  { name: "n-bridge", start: T.bridgeEnd + 0.08, end: T.hall - 0.04, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NBridge />, portrait: { x: (l) => lerp(250, 10, easeInOut(prog(l, 0.1, 0.9))), y: 800 } },
  // "and the second hall."
  { name: "n-journal-1", start: T.hall - 0.04, end: T.hallEnd + 0.04, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NJournal a={1.2} b={2.0} />, portrait: { x: 1330, y: 400 } },
  // (beat) dust trickles; he looks up
  { name: "n-look-up", start: T.hallEnd + 0.04, end: T.gates - 0.04, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NLookUp />, portrait: pN },
  // "We have barred the gates,"
  { name: "n-gates", start: T.gates - 0.04, end: T.hold - 0.06, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NGates />, portrait: { x: 1650, y: 600 } },
  // "but cannot hold them for long."
  { name: "n-cu-hold", start: T.hold - 0.06, end: T.longEnd + 0.06, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NCuHold />, portrait: pN },
  // (beat) an eye in the crack of the gate
  { name: "n-eye-crack", start: T.longEnd + 0.06, end: T.shakes - 0.04, filter: NOW, vignette: 1.1, grain: 0.42, render: () => <NEyeCrack />, portrait: { x: 1660, y: 430 } },
  // "The ground shakes,"
  { name: "n-wide-shakes", start: T.shakes - 0.04, end: T.shakes + 1.66, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NWideShakes />, portrait: { x: 1000, y: 620, zoom: 1.55 } },
  // (the first drum) the deep
  { name: "n-deep-1", start: T.shakes + 1.66, end: T.drums1 - 0.04, filter: NOW, vignette: 1.1, grain: 0.42, render: () => <TheDeep />, portrait: { x: 960, y: 700 } },
  // "drums,"
  { name: "n-ecu-drums", start: T.drums1 - 0.04, end: T.drums2 - 0.04, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NEcuDrums />, portrait: pN },
  // "drums in the deep."
  { name: "n-deep-2", start: T.drums2 - 0.04, end: T.deepEnd + 0.1, filter: NOW, vignette: 1.1, grain: 0.42, render: () => <TheDeep />, portrait: { x: 960, y: 760 } },
  // (beat) frantic scribbling
  { name: "n-journal-2", start: T.deepEnd + 0.1, end: T.out1 - 0.04, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NJournal a={4.2} b={6.2} />, portrait: { x: 1330, y: 560 } },
  // "We cannot get out."
  { name: "n-cu-out", start: T.out1 - 0.04, end: T.out1End + 0.1, filter: NOW, vignette: 1.05, grain: 0.42, render: () => <NCuOut />, portrait: pN },
  // (drums) eyes open in the dark, one pair per beat
  { name: "n-rev-eyes", start: T.out1End + 0.1, end: T.shadows - 0.04, filter: NOW, vignette: 1.1, grain: 0.42, render: () => <NRevEyes />, portrait: { x: 760, y: 600, zoom: 1.0 } },
  // "The shadows in the dark,"
  { name: "n-wide-shadows", start: T.shadows - 0.04, end: T.darkEnd + 0.06, filter: NOW, vignette: 1.1, grain: 0.42, render: () => <NWideShadows />, portrait: { x: 1000, y: 660, zoom: 1.3 } },
  // (drum) the gate splits, red light
  { name: "n-gate-glow", start: T.darkEnd + 0.06, end: T.out2 - 0.04, filter: NOW, vignette: 1.1, grain: 0.42, render: () => <NGateGlow />, portrait: { x: 1650, y: 600 } },
  // "we cannot get out,"
  { name: "n-journal-3", start: T.out2 - 0.04, end: T.out2End + 0.08, filter: NOW, vignette: 1.1, grain: 0.42, render: () => <NJournal a={8.0} b={9.0} dark={0.3} />, portrait: { x: 1330, y: 640 } },
  // (beat) the torch gutters; he turns to the dark
  { name: "n-turn", start: T.out2End + 0.08, end: T.coming - 0.06, filter: NOW, vignette: 1.15, grain: 0.42, render: () => <NTurnSlow />, portrait: pN },
  // "they are coming."
  { name: "n-ecu-coming", start: T.coming - 0.06, end: T.comingEnd + 0.06, filter: NOW, vignette: 1.15, grain: 0.42, render: () => <NEcuComing />, portrait: pN },
  // the torch dies
  { name: "n-dark", start: T.comingEnd + 0.06, end: T.end, filter: NOW, vignette: 1.2, grain: 0.42, render: () => <NDark />, portrait: { x: HEAD_N.x, y: HEAD_N.y + 120, zoom: 0.9 } },
  // the silent punchline: the shadows step into the light
  { name: "n-tail", start: T.end, end: 999, filter: NOW, vignette: 1.1, grain: 0.42, render: () => <TailReveal />, portrait: { x: 985, y: FLOOR_Y - 230, zoom: 0.78 } },
];

export const shots: ShotDef[] = raw;
