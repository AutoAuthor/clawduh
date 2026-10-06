import React from "react";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import type { ShotDef } from "../../engine/EpisodePlayer";
import type { Cam } from "../../engine/Stage";
import { cue, Timeline } from "../../engine/timeline";
import { clamp, easeIn, easeInOut, easeOut, easeOutBack, lerp, prog } from "../../engine/util";
import type { SkeeterProps } from "./cast/Ferret";
import type { MuleProps } from "./cast/Mule";
import { PackageBox, PartyHat } from "./cast/props";
import { BoxInsert, DoorbellTheft, MorningAfter } from "./cutaways";
import { CAM6, CousinSpec, DOB_BEHIND, DOB_NEAR, DOB_POS, HEADS, RoomScene, RoomState, SKEETER_POS } from "./livingroom";
import timelineJson from "./timeline.json";

/**
 * EPISODE 006 — "Don't Steal HIS Package".
 * Skeeter (ferret) sneaks back into the house he robbed; Mr. Dobbins (mule) has been waiting in the dark.
 * Shot times are anchored to the script with cue() so they follow the words.
 */
const tl = timelineJson as Timeline;
const at = (phrase: string, opts?: Parameters<typeof cue>[2]) => cue(tl, phrase, opts);

/** seconds held after the audio for the porch-cam punchline */
export const TAIL = 3.3;

const T = {
  whoAre: at("Who are you"),
  whoAm: at("Who am I"),
  imGuy: at("I'm the guy"),
  pkg: at("package from"),
  fromEnd: at("package from", { edge: "end" }),
  what: at("What are you talking"),
  caught: at("Caught you on my"),
  walked: at("walked right up"),
  tookEnd: at("took my package", { edge: "end" }),
  notNice: at("That's not very nice"),
  nice: at("very nice"),
  okay: at("Okay look I can"),
  ahah: at("Ah ah ah ah"),
  tooLate: at("Too late for all"),
  whyDont: at("Why don't you go"),
  openIt: at("and open it"),
  since: at("since you're so eager"),
  yours: at("not yours"),
  yoursEnd: at("not yours", { edge: "end" }),
  babyOil: at("Baby oil"),
  oilEnd: at("Baby oil", { edge: "end" }),
  ohDear: at("Oh dear"),
  learn: at("You're gonna learn today"),
  today: at("learn today"),
  heyLook: at("Hey look I'm sorry"),
  keepIt: at("Oh no keep it"),
  keepEnd: at("keep it", { edge: "end" }),
  needIt: at("You're gonna need it"),
  next: at("what happens next"),
  youTake: at("you take something from me"),
  well: at("well I'm gonna take"),
  aint: at("ain't no party"),
  noParty: at("no party like"),
  goofy: at("goofy party"),
  goofyEnd: at("goofy party", { edge: "end" }),
  end: tl.duration,
};

/** sound effects in the silent stretches (from the loudness envelope) */
const SFX = { door: 0.46, creak1: 2.21, creak2: 3.38, squeak: 4.42, lamp: 4.9, boxPop: 38.42, music: 41.79, clap1: 43.71, clap2: 43.92, laugh: 64.96 };

/* ------------------------------------------------------------------ */
/* Continuity driven by the clock                                      */
/* ------------------------------------------------------------------ */

const P = prog;

/** Skeeter tiptoes in from the door, freezing at each creak. */
const FREEZES: Array<[number, number]> = [
  [SFX.creak1, SFX.creak1 + 0.34],
  [SFX.creak2, SFX.creak2 + 0.4],
];
const SNEAK = { t0: 1.0, t1: SFX.squeak, x0: 1690, x1: 1180 };
const movingTime = (a: number, b: number) => {
  let m = Math.max(0, b - a);
  for (const [f0, f1] of FREEZES) m -= Math.max(0, Math.min(b, f1) - Math.max(a, f0));
  return m;
};
/** ...and after the squeak he hops backwards off the toy to his mark */
const sneakX = (t: number) =>
  t <= SNEAK.t0
    ? SNEAK.x0
    : t >= SNEAK.t1
      ? lerp(SNEAK.x1, SKEETER_POS.x, easeInOut(P(t, SNEAK.t1, SNEAK.t1 + 0.34)))
      : lerp(SNEAK.x0, SNEAK.x1, movingTime(SNEAK.t0, t) / movingTime(SNEAK.t0, SNEAK.t1));
const sneaking = (t: number) => t > SNEAK.t0 && t < SNEAK.t1 - 0.06;
const frozen = (t: number) => FREEZES.some(([a, b]) => t >= a && t < b);

const squeakAt = (t: number) => Math.max(0, ...[SFX.squeak, 4.56, 4.71].map((p) => 1 - Math.abs(t - p) / 0.08));

const roomAt = (t: number): Partial<RoomState> => {
  const clapDark = t >= SFX.clap1 && t < SFX.clap2;
  const lit = t >= SFX.lamp && t < SFX.clap1;
  return {
    door: t < SFX.door ? 0 : t < 3.2 ? 0.85 * easeOut(P(t, SFX.door, 0.7)) : 0.85 * (1 - easeInOut(P(t, 3.2, 4.3))),
    dark: t < SFX.lamp || clapDark ? 1 : 0,
    lamp: lit ? 1 : 0,
    pull: t > 4.7 && t < 5.15 ? Math.sin(P(t, 4.7, 5.15) * Math.PI) : 0,
    pink: t >= SFX.clap2 ? easeOut(P(t, SFX.clap2, SFX.clap2 + 0.12)) : 0,
    disco: P(t, SFX.clap2 + 0.04, SFX.clap2 + 0.6),
    banner: P(t, SFX.clap2 + 0.1, SFX.clap2 + 0.7),
    squeak: squeakAt(t),
    confetti: t >= T.noParty ? 1 : 0,
  };
};

const holdAt = (t: number): SkeeterProps["hold"] =>
  t < T.fromEnd + 0.12 ? "boxUnder" : t < T.openIt ? "boxBack" : t < 34.6 ? "boxBoth" : t < 39.45 ? "boxOpen" : t < T.heyLook ? "bottle" : t < T.keepIt + 0.35 ? "bottleOut" : "bottleHug";

const skeeterAt = (t: number): Partial<SkeeterProps> => {
  const x = sneakX(t);
  const sk = sneaking(t);
  const hopK = P(t, SFX.squeak + 0.02, SFX.squeak + 0.34);
  const startle = Math.max(1 - P(t, SFX.squeak + 0.3, SFX.squeak + 1.6), t >= SFX.lamp ? 1 - P(t, SFX.lamp + 0.6, SFX.lamp + 2.2) : 0);
  return {
    x,
    hold: holdAt(t),
    sneak: sk ? 1 : 0,
    step: (SNEAK.x0 - x) / 105.3 + 0.063,
    expr: sk ? (frozen(t) ? "gulp" : "sneak") : t < 20 ? "shifty" : "nervous",
    look: sk ? [0.6, 0.1] : [0.8, -0.3],
    hop: Math.sin(Math.PI * hopK) * 46,
    bristle: t >= SFX.squeak ? clamp(startle) : 0,
    sweat: t > T.tookEnd ? 1 : 0,
    tremble: t > T.ohDear ? (t > T.youTake ? 0.7 : 0.35) : 0,
    hat: t >= 60.32,
  };
};

/** where Mr. Dobbins stands at time t */
const dobX = (t: number) =>
  t < T.tooLate ? DOB_POS.x : t < T.youTake + 0.1 ? lerp(DOB_POS.x, DOB_NEAR, easeInOut(P(t, T.tooLate, T.tooLate + 0.5))) : lerp(DOB_NEAR, DOB_BEHIND.x, easeInOut(P(t, T.youTake + 0.1, T.youTake + 2.1)));
const dobWalking = (t: number) => (t > T.tooLate && t < T.tooLate + 0.5) || (t > T.youTake + 0.1 && t < T.youTake + 2.1);

const dobAt = (t: number): Partial<MuleProps> => {
  const behind = t > T.youTake + 1.6;
  const reaching = t > 4.55 && t < 5.5;
  return {
    x: dobX(t),
    y: t < T.youTake ? DOB_POS.y : lerp(DOB_POS.y, DOB_BEHIND.y, P(t, T.youTake + 0.1, T.youTake + 2.1)),
    flip: behind,
    shade: t < SFX.lamp ? 1 : 0,
    walk: t * 1.6,
    walkAmt: dobWalking(t) ? 1 : 0,
    armB: reaching ? [-35, -150] : undefined,
    handB: reaching ? "grab" : "open",
    groove: t >= T.noParty ? 1 : t >= SFX.clap2 ? 0.55 : t >= SFX.music ? 0.3 : 0,
    hat: t >= SFX.clap2,
    expr: "grin",
    look: [0.7, 0.2],
  };
};

const COUSIN_BASE: Record<string, Partial<MuleProps>> = {
  earl: { outfit: "tank", girth: 1.45, coat: "#6d5a48", mane: "#3a2418", scale: 0.96, hat: true, hatColors: ["#6fe0ff", "#ff5fc8"] },
  lyle: { outfit: "turtle", girth: 0.85, coat: "#a59f98", mane: "#18120f", scale: 1.06, shades: true, hat: true, hatColors: ["#ffd34a", "#b98aff"] },
  dot: { outfit: "ruffle", coat: "#c4b29a", mane: "#5a3020", scale: 0.92, hat: true, hatColors: ["#7aff9a", "#ff4fb4"] },
};

/** the cousins, where they are at time t (the shots add their own beats) */
const cousinsAt = (t: number): CousinSpec[] => {
  const out: CousinSpec[] = [];
  if (t >= T.youTake) {
    // heads rise from behind the sofa one at a time and stay there: a row of identical grins
    const rise = (a: number) => 905 + 600 * (1 - easeOutBack(P(t, a, a + 0.5)));
    const g = t >= T.noParty ? 1 : 0;
    const lean = t >= T.well ? 6 * easeInOut(P(t, T.well, T.well + 1.2)) : 0;
    out.push({ id: "earl", ...COUSIN_BASE.earl, scale: 0.84, x: 985, y: rise(T.youTake + 0.5) + 10, layer: "back", expr: "stare", lean, headTilt: -8, groove: g });
    out.push({ id: "dot", ...COUSIN_BASE.dot, scale: 0.8, x: 1170, y: rise(T.youTake + 1.1), layer: "back", expr: "grin", lean, headTilt: 14, groove: g });
    out.push({ id: "lyle", ...COUSIN_BASE.lyle, scale: 0.88, x: 800, y: rise(58.3) - 6, layer: "back", expr: "grin", lean, headTilt: 10, groove: g });
  }
  return out;
};

/** The living room with everyone where they should be at time t. */
const Room: React.FC<{
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  skeeter?: Partial<SkeeterProps> | false;
  dobbins?: Partial<MuleProps> | false;
  cousins?: CousinSpec[];
  extraCousins?: CousinSpec[];
  room?: Partial<RoomState>;
  shakeAmp?: number;
  front?: React.ReactNode;
  back?: React.ReactNode;
}> = ({ from, to, cam, ease, skeeter = {}, dobbins = {}, cousins, extraCousins = [], room = {}, shakeAmp, front, back }) => {
  const { shot } = useEpisode();
  const t = shot.t;
  const dob = dobbins === false ? false : { ...dobAt(t), ...dobbins };
  const behind = dob !== false && (t > T.youTake + 0.1 || (dob.x ?? DOB_POS.x) > SKEETER_POS.x - 60);
  return (
    <RoomScene
      from={from}
      to={to}
      cam={cam}
      ease={ease}
      skeeter={skeeter === false ? false : { ...skeeterAt(t), ...skeeter }}
      dobbins={dob}
      dobBehind={behind}
      cousins={[...(cousins ?? cousinsAt(t)), ...extraCousins]}
      room={{ ...roomAt(t), ...room }}
      shakeAmp={shakeAmp}
      front={front}
      back={
        <>
          {t >= 39.45 ? <PackageBox x={1130} y={958} w={124} h={88} rot={-8} open={1} detail={false} /> : null}
          {back}
        </>
      }
    />
  );
};

/** A bare mule hand (Dobbins' sleeve-less forearm) used for off-screen grabs. */
const MuleHand: React.FC<{ x: number; y: number; rot?: number; fingers?: number }> = ({ x, y, rot = 0, fingers = 0.4 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d="M0,0 L0,-420" stroke={INK} strokeWidth={34} strokeLinecap="round" />
    <path d="M0,0 L0,-420" stroke="#8d7d6e" strokeWidth={24} strokeLinecap="round" />
    {[-0.7, -0.25, 0.25, 0.7].map((a, i) => {
      const r = a * (1 - fingers * 0.4);
      const ex = Math.sin(r) * 40;
      const ey = Math.cos(r) * 40;
      return (
        <g key={i}>
          <path d={`M0,0 L${ex},${ey}`} stroke={INK} strokeWidth={14} strokeLinecap="round" />
          <path d={`M0,0 L${ex},${ey}`} stroke="#8d7d6e" strokeWidth={8} strokeLinecap="round" />
          <circle cx={ex} cy={ey} r={5.5} fill="#2a2220" stroke={INK} strokeWidth={2} />
        </g>
      );
    })}
    <circle r={17} fill="#8d7d6e" stroke={INK} strokeWidth={4} />
  </g>
);

/* ------------------------------------------------------------------ */
/* Shots                                                               */
/* ------------------------------------------------------------------ */

// the door swings open on Skeeter, framed in the doorway with his loot
const SneakDoor = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  return (
    <Room
      from={{ x: 1680, y: 610, zoom: 1.5 }}
      to={{ x: 1676, y: 620, zoom: 1.64 }}
      skeeter={t < 0.62 ? false : { x: 1704, y: 960, expr: t < 0.82 ? "startled" : "sneak", sneak: 1, step: t < 0.82 ? 0 : 0.25, look: [t < 0.82 ? 0.9 : -0.2, 0] }}
      dobbins={false}
    />
  );
};

// he tiptoes across the dark room; in the far corner, a grin hangs in the dark
const SneakWide = () => <Room from={{ x: 1040, y: 560, zoom: 0.98 }} to={{ x: 1080, y: 570, zoom: 1.03 }} dobbins={{ look: [0.9, 0.3], expr: "stare" }} />;

// creak, creak: freeze, wince
const SneakWince = () => {
  const { shot } = useEpisode();
  const x = sneakX(shot.t);
  const hx = x - 36;
  const fr = frozen(shot.t);
  return (
    <Room
      cam={{ x: hx - 40, y: 640, zoom: 2.3 }}
      from={CAM6.cuSkeet}
      skeeter={{ expr: fr ? (shot.t < SFX.creak2 + 0.16 ? "wince" : "gulp") : "sneak", look: fr ? [0.2, 0.9] : [0.7, 0.1] }}
      dobbins={false}
    />
  );
};

// the squeaky toy
const Squeak = () => {
  const { shot } = useEpisode();
  const sq = squeakAt(shot.t);
  return <Room from={{ x: 1196, y: 860, zoom: 2.4 }} to={{ x: 1200, y: 850, zoom: 2.5 }} dobbins={false} room={{ dark: 0.55 }} shakeAmp={sq * 10} skeeter={{ expr: shot.t > SFX.squeak ? "startled" : "sneak", look: [0.2, 0.9] }} />;
};

// click: the lamp comes on. He has been standing right there the whole time.
const RevealWide = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const point = t > T.whoAre + 0.1;
  return (
    <Room
      from={{ x: 960, y: 580, zoom: 1.0 }}
      to={{ x: 950, y: 590, zoom: 1.08 }}
      dobbins={{ expr: t < SFX.lamp + 0.3 ? "stare" : "grin", look: [0.9, 0.25] }}
      skeeter={{ expr: "startled", point, armF: point ? [86, 6] : undefined, look: [0.9, -0.5] }}
      shakeAmp={t > SFX.lamp && t < SFX.lamp + 0.2 ? 6 : 0}
    />
  );
};

const CuSkeetWho = () => {
  const { shot } = useEpisode();
  return <Room from={CAM6.cuSkeet} to={{ ...CAM6.cuSkeet, zoom: 2.75 }} skeeter={{ expr: shot.t < 6.9 ? "startled" : "shifty", point: true, armF: [84, 8], look: [0.9, -0.4] }} />;
};

const CuDobWhoAmI = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.t, T.whoAm - 0.1, T.whoAm + 0.6));
  return <Room from={CAM6.cuDob} to={{ ...CAM6.cuDob, zoom: 3.0, y: CAM6.cuDob.y - 10 }} dobbins={{ expr: k > 0.4 && shot.t < T.imGuy - 0.2 ? "deep" : "grin", headTilt: -6 * k, look: [0.9, 0.3] }} />;
};

const MsDobGuy = () => {
  const { shot } = useEpisode();
  const k = easeOut(P(shot.t, T.imGuy + 0.3, T.imGuy + 0.6));
  return <Room from={CAM6.msDob} to={{ ...CAM6.msDob, zoom: 1.7 }} dobbins={{ expr: "delight", armF: [lerp(10, 82, k), lerp(16, 10, k)], handF: k > 0.5 ? "point" : "open", look: [0.9, 0.45] }} skeeter={{ expr: "shifty" }} />;
};

// insert: the label on the box under his arm
const InsertPkg = () => {
  const { shot } = useEpisode();
  return <Room from={{ x: 1170, y: 784, zoom: 3.5 }} to={{ x: 1180, y: 786, zoom: 3.8 }} skeeter={{ expr: "shifty", look: [0.2, 0.8] }} dobbins={false} shakeAmp={shot.local > 0.9 ? 2 : 0} />;
};

// he hides it behind his back and whistles
const WhistleNotes: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => (
  <g>
    {[0, 1, 2].map((i) => {
      const ph = (t * 0.8 + i / 3) % 1;
      const nx = x - ph * 120 + Math.sin(ph * 9 + i) * 14;
      const ny = y - ph * 150;
      return (
        <g key={i} transform={`translate(${nx} ${ny}) rotate(${-12 + i * 10})`} opacity={1 - ph}>
          <path d="M9,-3 L9,-40 q12,4 16,16" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
          <path d="M9,-3 L9,-40 q12,4 16,16" stroke="#f6efd8" strokeWidth={4.5} fill="none" strokeLinecap="round" />
          <ellipse cx={0} cy={0} rx={13} ry={9.5} fill="#f6efd8" stroke={INK} strokeWidth={4} transform="rotate(-20)" />
        </g>
      );
    })}
  </g>
);

const TwoHide = () => {
  const { shot } = useEpisode();
  return (
    <Room
      from={CAM6.two}
      to={{ ...CAM6.two, zoom: 1.25 }}
      skeeter={{ expr: "innocent", look: [0.2, -1], headTilt: Math.sin(shot.t * 5) * 6 }}
      dobbins={{ expr: "stare", headTilt: lerp(0, 18, easeInOut(shot.p)), look: [0.9, 0.35] }}
      front={shot.t > T.fromEnd + 0.35 ? <WhistleNotes x={HEADS.skeeter.x - 90} y={HEADS.skeeter.y + 10} t={shot.t} /> : null}
    />
  );
};

const CuSkeetWhat = () => <Room from={{ x: 1230, y: 676, zoom: 2.2 }} to={{ x: 1236, y: 672, zoom: 2.4 }} skeeter={{ expr: "shifty", look: [0.9, -0.3] }} />;

// "Caught you on my doorbell camera" — he presents the TV; push into the screen
const MsDobCaught = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.t, T.caught + 0.2, T.caught + 0.8));
  return (
    <Room
      from={{ x: 560, y: 560, zoom: 1.4 }}
      to={CAM6.tv}
      ease={(x) => easeIn(clamp((x - 0.25) / 0.75))}
      dobbins={{ expr: "delight", armB: [lerp(-8, -55, k), lerp(10, -5, k)], handB: k > 0.5 ? "point" : "open", headTilt: -10 * k, look: [-0.6, 0.2] }}
    />
  );
};

const CuSkeetSweat = () => <Room from={{ ...CAM6.cuSkeet, zoom: 2.6 }} to={{ ...CAM6.cuSkeet, zoom: 2.8 }} skeeter={{ expr: "gulp", sweat: 1, look: [0.9, -0.3] }} />;

const EcuDobNice = () => {
  const { shot } = useEpisode();
  const snap = shot.t > T.nice + 0.25;
  return <Room from={{ ...CAM6.ecuDob, zoom: 3.4 }} to={CAM6.ecuDob} dobbins={{ expr: snap ? "stare" : "polite", headTilt: snap ? 0 : -8, look: [0.9, 0.3] }} />;
};

const MsSkeetExplain = () => {
  const { shot } = useEpisode();
  const talk = shot.t > T.okay;
  const wave = Math.sin(shot.t * 9) * 12;
  return <Room from={CAM6.msSkeet} to={{ ...CAM6.msSkeet, zoom: 1.85 }} skeeter={{ expr: talk ? "nervous" : "gulp", armF: talk ? [70 + wave, 40] : undefined, look: [0.9, -0.4] }} />;
};

// "Ah, ah, ah, ah!" — the finger wag
const CuDobAhAh = () => {
  const { shot } = useEpisode();
  const wag = Math.sin((shot.t - T.ahah) * Math.PI * 2 * 3.4) * 26;
  return <Room from={{ x: HEADS.dobbins.x + 90, y: HEADS.dobbins.y + 110, zoom: 2.0 }} to={{ x: HEADS.dobbins.x + 90, y: HEADS.dobbins.y + 100, zoom: 2.15 }} dobbins={{ expr: "tsk", armF: [60, 70], handF: "point", wag, headTilt: wag * 0.25, look: [0.9, 0.3] }} />;
};

// "Too late for all that now!" — he steps in and looms
const TwoTooLate = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.t, T.tooLate, T.tooLate + 0.6));
  return (
    <Room
      from={CAM6.two}
      to={CAM6.twoNear}
      dobbins={{ expr: shot.t > 28.6 ? "stare" : "menace", lean: 16 * k, crane: 50 * k, look: [0.9, 0.7] }}
      skeeter={{ expr: "scared", shrink: 0.8 * k, bristle: 0.8 * k, look: [0.9, -0.8] }}
    />
  );
};

const MsDobOpen = () => {
  const { shot } = useEpisode();
  const k = easeOut(P(shot.t, T.openIt - 0.3, T.openIt + 0.1));
  return (
    <Room
      from={{ x: HEADS.dobNear.x + 60, y: 560, zoom: 1.5 }}
      to={{ x: HEADS.dobNear.x + 70, y: 560, zoom: 1.62 }}
      dobbins={{ expr: "delight", armF: [lerp(10, 74, k), lerp(16, 30, k)], handF: "open", look: [0.9, 0.5] }}
      skeeter={{ expr: "nervous" }}
    />
  );
};

const EcuDobEager = () => {
  const { shot } = useEpisode();
  return <Room from={{ x: HEADS.dobNear.x + 50, y: HEADS.dobNear.y + 40, zoom: 2.6 }} to={{ x: HEADS.dobNear.x + 70, y: HEADS.dobNear.y + 40, zoom: 4.2 }} dobbins={{ expr: shot.t > T.yours ? "menace" : "stare", look: [0.9, 0.4] }} />;
};

const InsertTape = () => {
  const { shot } = useEpisode();
  return <BoxInsert peel={easeInOut(P(shot.local, 0.3, 1.7))} open={0} from={{ x: 960, y: 560, zoom: 1.0 }} to={{ x: 940, y: 580, zoom: 1.08 }} />;
};

const CuDobWatch = () => {
  const { shot } = useEpisode();
  return <Room from={CAM6.cuDobNear} to={{ ...CAM6.cuDobNear, zoom: 2.7 }} dobbins={{ expr: "stare", headTilt: lerp(0, 26, easeInOut(shot.p)), grin: lerp(0.9, 1.15, shot.p), look: [0.9, 0.6] }} />;
};

const InsertPop = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const open = easeOutBack(P(t, SFX.boxPop - 0.05, SFX.boxPop + 0.3));
  return (
    <BoxInsert
      peel={1}
      open={Math.max(0, open)}
      from={{ x: 960, y: 580, zoom: 1.08 }}
      to={{ x: 960, y: 520, zoom: 0.98 }}
    />
  );
};

// he lifts it out of the glowing box: "Baby oil."
const CuSkeetBottle = () => {
  const { shot } = useEpisode();
  const lift = easeOut(P(shot.t, 39.35, 39.9));
  const glow = 1 - P(shot.t, 39.6, 40.6);
  return (
    <Room
      from={CAM6.cuSkeet}
      to={{ ...CAM6.cuSkeet, zoom: 2.7 }}
      skeeter={{ expr: shot.t > T.babyOil - 0.1 ? "deadpan" : "startled", hold: "bottle", armF: [lerp(30, 76, lift), lerp(40, 20, lift)], look: [0.4, -0.5] }}
      front={
        glow > 0 ? (
          <g style={{ mixBlendMode: "screen" }} opacity={glow}>
            <defs>
              <radialGradient id="liftGlow" gradientUnits="userSpaceOnUse" cx={HEADS.skeeter.x - 20} cy={HEADS.skeeter.y + 260} r={420}>
                <stop offset="0" stopColor="#ffe28a" stopOpacity={0.8} />
                <stop offset="1" stopColor="#ffe28a" stopOpacity={0} />
              </radialGradient>
            </defs>
            <rect x={HEADS.skeeter.x - 600} y={HEADS.skeeter.y - 400} width={1200} height={1000} fill="url(#liftGlow)" />
          </g>
        ) : null
      }
    />
  );
};

const CuDobNod = () => {
  const { shot } = useEpisode();
  const wiggle = Math.floor(shot.t * 4) % 2 === 0;
  return <Room from={CAM6.cuDobNear} to={{ ...CAM6.cuDobNear, zoom: 2.6 }} dobbins={{ expr: shot.t < SFX.music ? (wiggle ? "delight" : "grin") : "wink", look: [0.9, 0.4] }} />;
};

const EcuSkeetOhDear = () => <Room from={{ ...CAM6.ecuSkeet, zoom: 3.6 }} to={CAM6.ecuSkeet} skeeter={{ expr: "realize", armF: [50, 30], look: [0.9, -0.5] }} />;

// two claps: the lamp dies, the room goes hot pink, the disco ball drops
const WideClap = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const clapK = Math.max(1 - Math.abs(t - SFX.clap1) / 0.09, 1 - Math.abs(t - SFX.clap2) / 0.09, 0);
  return (
    <Room
      from={{ x: 1020, y: 540, zoom: 0.97 }}
      to={{ x: 1030, y: 540, zoom: 1.02 }}
      dobbins={{ expr: t > SFX.clap2 ? "delight" : "grin", armF: [lerp(70, 92, clapK), lerp(40, 20, clapK)], armB: [lerp(30, 70, clapK), lerp(80, 50, clapK)], handF: "flat", handB: "flat", look: [0.9, 0.3] }}
      skeeter={{ expr: t > SFX.clap2 ? "startled" : "realize", look: [0.9, -0.6] }}
      shakeAmp={t > SFX.clap2 && t < SFX.clap2 + 0.25 ? 8 : 0}
    />
  );
};

const CuDobLearn = () => {
  const { shot } = useEpisode();
  return <Room from={CAM6.cuDobNear} to={{ ...CAM6.cuDobNear, zoom: 2.65 }} dobbins={{ expr: shot.t > T.today ? "delight" : "sing", look: [0.9, 0.4] }} />;
};

// "Hey look, I'm sorry..." while a cousin moonwalks across the back with the punch
const MsSkeetSorry = () => {
  const { shot } = useEpisode();
  const k = P(shot.t, T.heyLook - 0.1, T.heyLook + 2.6);
  return (
    <Room
      from={{ x: 1180, y: 610, zoom: 1.24 }}
      to={{ x: 1170, y: 615, zoom: 1.32 }}
      skeeter={{ expr: "pleading", look: [0.9, -0.4] }}
      cousins={[]}
      extraCousins={k > 0 && k < 1 ? [{ id: "lyle", ...COUSIN_BASE.lyle, x: lerp(1900, 640, k), y: 912, flip: false, walk: shot.t * 2.2, walkAmt: 1, prop: "punch", armF: [70, 40], groove: 0.6, expr: "grin" }] : []}
    />
  );
};

// "Oh no, keep it!"
const TwoKeep = () => {
  const { shot } = useEpisode();
  // his flat hand finds the offered bottle and pushes it back into Skeeter's paws (he hugs it from then on)
  const reach = easeOut(P(shot.t, T.keepIt + 0.05, T.keepIt + 0.32));
  const shove = easeInOut(P(shot.t, T.keepIt + 0.32, T.keepIt + 0.48));
  const away = easeInOut(P(shot.t, T.keepIt + 0.55, T.keepIt + 0.9));
  const push = reach * (1 - away);
  return (
    <Room
      from={CAM6.twoNear}
      to={{ ...CAM6.twoNear, zoom: 1.4, x: CAM6.twoNear.x + 30 }}
      dobbins={{ expr: "delight", lean: 12 * push, armF: [lerp(10, 48 + shove * 5, push), lerp(16, 4 - shove * 4, push)], handF: "flat", look: [0.9, 0.6] }}
      skeeter={{ expr: shot.t > T.keepEnd + 0.3 ? "gulp" : "scared", look: shot.t > T.keepEnd + 0.3 ? [0.4, 0.9] : [0.9, -0.6] }}
    />
  );
};

const CuDobNeed = () => {
  const { shot } = useEpisode();
  const lean = easeInOut(P(shot.t, T.needIt, T.next + 0.4));
  return <Room from={CAM6.cuDobNear} to={{ ...CAM6.cuDobNear, x: CAM6.cuDobNear.x + 40, zoom: 3.3 }} dobbins={{ expr: shot.t > T.next ? "menace" : "delight", crane: 40 * lean, lean: 8 * lean, look: [0.9, 0.4] }} />;
};

// "you take something from me" — he strolls around behind him; heads rise behind the sofa
const WideCircle = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  return <Room from={{ x: 1100, y: 560, zoom: 1.0 }} to={{ x: 1150, y: 560, zoom: 1.06 }} dobbins={{ expr: "grin", look: [0.9, 0.4] }} skeeter={{ expr: "scared", look: [lerp(0.9, -0.9, P(t, T.youTake + 0.6, T.youTake + 1.8)), -0.3], headTilt: lerp(0, 12, P(t, T.youTake + 0.6, T.youTake + 1.8)) }} />;
};

// "well, I'm gonna take something from you" — the cousins lean in behind him one by one
const MsSkeetCousins = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  return <Room from={{ x: 1250, y: 590, zoom: 1.3 }} to={{ x: 1260, y: 600, zoom: 1.4 }} dobbins={{ expr: "menace", lean: 10, crane: 20, look: [0.9, 0.6] }} skeeter={{ expr: "scared", look: [Math.sin(t * 3) * 0.9, -0.2] }} />;
};

// the party hat goes on, the horn toots
const CuSkeetHat = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const handK = easeInOut(P(t, 59.95, 60.32)) * (1 - easeInOut(P(t, 60.5, 60.85)));
  const hx = HEADS.skeeter.x - 6;
  const hy = HEADS.skeeter.y - 80;
  const horn = easeOut(P(t, 60.95, 61.2)) * (1 - easeIn(P(t, 61.5, 61.75)));
  return (
    <Room
      from={CAM6.cuSkeet}
      to={{ ...CAM6.cuSkeet, zoom: 2.65 }}
      skeeter={{ expr: horn > 0.3 ? "wince" : "scared", hat: t >= 60.32, look: [0.9, -0.2] }}
      front={
        <>
          {handK > 0 ? (
            <g>
              {t < 60.32 ? <PartyHat x={hx + 20} y={hy - 300 * (1 - handK) + 4} rot={-18} s={0.9} /> : null}
              <MuleHand x={hx + 60} y={hy - 300 * (1 - handK) - 50} rot={170} fingers={0.6} />
            </g>
          ) : null}
          {horn > 0 ? (
            <g transform={`translate(${HEADS.skeeter.x - 420} ${HEADS.skeeter.y + 20})`}>
              <path d={`M0,-14 L${140 + horn * 150},-24 L${140 + horn * 150},6 L0,10 Z`} fill="#7aff9a" stroke={INK} strokeWidth={4} />
              {[0, 1, 2].map((i) => (
                <path key={i} d={`M${30 + i * 60},-16 l0,24`} stroke="#ff4fb4" strokeWidth={6} />
              ))}
              {horn > 0.6 ? <path d={`M${300 + horn * 10},-40 l30,-16 M${306},-10 l36,0 M${300},18 l30,16`} stroke={INK} strokeWidth={5} strokeLinecap="round" /> : null}
            </g>
          ) : null}
        </>
      }
    />
  );
};

// "ain't no party like a goofy party" — the whole family sings; jazz hands on "goofy party"
const WideParty = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const jazz = t > T.goofy;
  const pump = Math.sin(t * Math.PI * 2) * 30;
  const arms = (i: number): Partial<MuleProps> =>
    jazz ? { armF: [150, 10], armB: [-150, -10], handF: "open", handB: "open" } : { armF: [120 + (i % 2 ? pump : -pump), 30], armB: [40, 60], handF: "point" };
  return (
    <Room
      from={{ x: 1270, y: 560, zoom: 1.02 }}
      to={{ x: 1270, y: 560, zoom: 1.1 }}
      dobbins={{ expr: jazz ? "delight" : "sing", ...arms(0), look: [0.6, 0.3] }}
      skeeter={{ expr: jazz ? "wince" : "scared", look: [Math.sin(t * 4) * 0.8, -0.3] }}
      cousins={cousinsAt(t).map((c, i) => ({ ...c, ...arms(i + 1), expr: jazz ? "delight" : c.expr }))}
    />
  );
};

// they all laugh; he just holds the baby oil
const FinalLaugh = () => {
  const { shot } = useEpisode();
  return (
    <Room
      from={{ x: 1260, y: 540, zoom: 1.55 }}
      to={{ x: 1250, y: 560, zoom: 1.75 }}
      dobbins={{ expr: "laugh", groove: 0, headTilt: -10, look: [0.6, 0.3] }}
      skeeter={{ expr: "wince", tremble: 0.9 }}
      cousins={cousinsAt(shot.t).map((c) => ({ ...c, expr: "laugh", groove: 0, lean: 6 }))}
    />
  );
};

/* ------------------------------------------------------------------ */

const NIGHT_VISION = "grayscale(1) sepia(1) hue-rotate(65deg) saturate(2.4) brightness(1.05) contrast(1.15)";
const PINK = "saturate(1.25) contrast(1.06)";

const pDob = { x: HEADS.dobbins.x + 40 };
const pDobNear = { x: HEADS.dobNear.x + 40 };
const pSkeet = { x: HEADS.skeeter.x - 30 };

const raw: ShotDef[] = [
  // (silence) the door swings open on Skeeter
  { name: "sneak-door", start: 0, end: 1.05, transition: "fade", render: () => <SneakDoor />, portrait: { x: 1690, zoom: 1.0 } },
  // he tiptoes in; a grin in the dark corner
  {
    name: "sneak-wide",
    start: 1.05,
    end: SFX.creak2 - 0.08,
    render: () => <SneakWide />,
    portrait: { x: (l) => lerp(sneakX(1.05 + Math.min(l, 1.2)) - 40, 720, easeInOut(prog(l, 1.25, 1.9))), zoom: 1.0, y: 620 },
  },
  { name: "sneak-wince", start: SFX.creak2 - 0.08, end: SFX.squeak - 0.12, render: () => <SneakWince />, portrait: { x: (l) => sneakX(SFX.creak2 - 0.08 + l) - 70 } },
  { name: "squeak", start: SFX.squeak - 0.12, end: SFX.lamp - 0.12, render: () => <Squeak />, portrait: { x: 1196 } },
  // click — the lamp. "Who are you?"
  { name: "reveal-wide", start: SFX.lamp - 0.12, end: T.whoAre + 0.8, render: () => <RevealWide />, portrait: { x: (l) => lerp(760, 1120, easeInOut(prog(l, 0.42, 0.75))), zoom: 1.0, y: 600 } },
  { name: "cu-skeet-who", start: T.whoAre + 0.8, end: T.whoAm - 0.22, render: () => <CuSkeetWho />, portrait: pSkeet },
  // "Who am I? I'm the guy you stole that package from."
  { name: "cu-dob-whoami", start: T.whoAm - 0.22, end: T.imGuy - 0.1, render: () => <CuDobWhoAmI />, portrait: pDob },
  { name: "ms-dob-guy", start: T.imGuy - 0.1, end: T.pkg - 0.06, render: () => <MsDobGuy />, portrait: { x: HEADS.dobbins.x + 70 } },
  { name: "insert-pkg", start: T.pkg - 0.06, end: T.fromEnd + 0.08, render: () => <InsertPkg />, portrait: { x: 1176 } },
  // (beat) he hides it behind his back
  { name: "two-hide", start: T.fromEnd + 0.08, end: T.what - 0.06, render: () => <TwoHide />, portrait: { x: 1190, zoom: 1.0, y: 640 } },
  // "What are you talking about?"
  { name: "cu-skeet-what", start: T.what - 0.06, end: T.caught - 0.1, render: () => <CuSkeetWhat />, portrait: { x: 1236 } },
  // "Caught you on my doorbell camera,"
  { name: "ms-dob-caught", start: T.caught - 0.1, end: T.walked - 0.08, render: () => <MsDobCaught />, portrait: { x: (l) => lerp(620, 300, easeInOut(prog(l, 0.5, 1.9))) } },
  // "walked right up to my porch and took my package."
  { name: "doorbell", start: T.walked - 0.08, end: T.tookEnd + 0.2, filter: NIGHT_VISION, transition: "static", render: () => <DoorbellTheft />, portrait: { x: (l) => lerp(1260, 980, easeInOut(prog(l, 0.2, 1.6))), zoom: 0.85 } },
  { name: "cu-skeet-sweat", start: T.tookEnd + 0.2, end: T.notNice - 0.04, transition: "static", render: () => <CuSkeetSweat />, portrait: pSkeet },
  // "That's not very nice."
  { name: "ecu-dob-nice", start: T.notNice - 0.04, end: T.okay - 1.0, render: () => <EcuDobNice />, portrait: { x: HEADS.dobbins.x + 50 } },
  // (gulp) "Okay, look, I can explain. I didn't mean—"
  { name: "ms-skeet-explain", start: T.okay - 1.0, end: T.ahah - 0.04, render: () => <MsSkeetExplain />, portrait: pSkeet },
  // "Ah, ah, ah, ah!"
  { name: "cu-dob-ahah", start: T.ahah - 0.04, end: T.tooLate - 0.04, render: () => <CuDobAhAh />, portrait: { x: HEADS.dobbins.x + 80 } },
  // "Too late for all that now!"
  { name: "two-toolate", start: T.tooLate - 0.04, end: T.whyDont - 0.1, render: () => <TwoTooLate />, portrait: { x: (l) => lerp(780, 1040, easeInOut(prog(l, 0, 0.7))), zoom: 1.0, y: 560 } },
  // "Why don't you go ahead and open it,"
  { name: "ms-dob-open", start: T.whyDont - 0.1, end: T.since - 0.08, render: () => <MsDobOpen />, portrait: { x: (l) => lerp(HEADS.dobNear.x + 40, 1060, easeInOut(prog(l, 1.1, 1.8))) } },
  // "since you're so eager to take what's not yours!"
  { name: "ecu-dob-eager", start: T.since - 0.08, end: T.yoursEnd + 0.12, render: () => <EcuDobEager />, portrait: { x: HEADS.dobNear.x + 60 } },
  // (silence) the unboxing
  { name: "insert-tape", start: T.yoursEnd + 0.12, end: 36.4, render: () => <InsertTape />, portrait: { x: 830, zoom: 0.92 } },
  { name: "cu-dob-watch", start: 36.4, end: 37.55, render: () => <CuDobWatch />, portrait: pDobNear },
  { name: "insert-pop", start: 37.55, end: 39.3, render: () => <InsertPop />, portrait: { x: 900, zoom: 0.92 } },
  // "Baby oil."
  { name: "cu-skeet-bottle", start: 39.3, end: T.oilEnd + 0.1, render: () => <CuSkeetBottle />, portrait: { x: HEADS.skeeter.x - 10 } },
  { name: "cu-dob-nod", start: T.oilEnd + 0.1, end: T.ohDear - 0.12, render: () => <CuDobNod />, portrait: pDobNear },
  // "Oh dear."
  { name: "ecu-skeet-ohdear", start: T.ohDear - 0.12, end: SFX.clap1 - 0.1, render: () => <EcuSkeetOhDear />, portrait: { x: HEADS.skeeter.x - 40 } },
  // clap, clap: pink
  { name: "wide-clap", start: SFX.clap1 - 0.1, end: T.learn - 0.02, render: () => <WideClap />, portrait: { x: 1000, zoom: 0.92, y: 520 } },
  // "You're gonna learn today."
  { name: "cu-dob-learn", start: T.learn - 0.02, end: T.heyLook - 0.36, grade: undefined, filter: PINK, render: () => <CuDobLearn />, portrait: pDobNear },
  // "Hey look, I'm sorry, you can actually take it back."
  { name: "ms-skeet-sorry", start: T.heyLook - 0.36, end: T.keepIt - 0.1, filter: PINK, render: () => <MsSkeetSorry />, portrait: { x: HEADS.skeeter.x - 20 } },
  // "Oh no, keep it!"
  { name: "two-keep", start: T.keepIt - 0.1, end: T.needIt - 0.1, filter: PINK, render: () => <TwoKeep />, portrait: { x: (l) => lerp(1000, 1180, easeInOut(prog(l, 1.15, 1.7))), zoom: 1.0, y: 560 } },
  // "You're gonna need it for what happens next!"
  { name: "cu-dob-need", start: T.needIt - 0.1, end: T.youTake, filter: PINK, render: () => <CuDobNeed />, portrait: { x: HEADS.dobNear.x + 60 } },
  // "you take something from me"
  { name: "wide-circle", start: T.youTake, end: T.well - 0.02, filter: PINK, render: () => <WideCircle />, portrait: { x: (l) => lerp(1000, 1300, easeInOut(prog(l, 0.2, 2.0))), zoom: 1.0, y: 560 } },
  // "well, I'm gonna take something from you"
  { name: "ms-skeet-cousins", start: T.well - 0.02, end: T.aint, filter: PINK, render: () => <MsSkeetCousins />, portrait: { x: (l) => lerp(1300, 1080, easeInOut(prog(l, 1.6, 2.4))), zoom: 1.0, y: 590 } },
  // "ain't..." — hat, horn
  { name: "cu-skeet-hat", start: T.aint, end: T.noParty - 0.04, filter: PINK, render: () => <CuSkeetHat />, portrait: pSkeet },
  // "...no party like a goofy party"
  { name: "wide-party", start: T.noParty - 0.04, end: T.goofyEnd + 0.06, filter: PINK, render: () => <WideParty />, portrait: { x: 1290, zoom: 0.86, y: 560 } },
  { name: "final-laugh", start: T.goofyEnd + 0.06, end: T.end, filter: PINK, render: () => <FinalLaugh />, portrait: { x: 1250, zoom: 0.95, y: 540 } },
  // the silent punchline: the next morning on the porch cam
  { name: "tail-morning", start: T.end, end: 999, filter: "saturate(0.62) contrast(1.06) brightness(1.06)", transition: "static", render: () => <MorningAfter />, portrait: { x: 830, y: 860, zoom: 1.15 } },
];

/** lamp-lit room by default (warm "night"); cutaways and the pink party set their own */
export const shots: ShotDef[] = raw.map((s) => ({ ...s, grade: s.grade ?? "night" }));

