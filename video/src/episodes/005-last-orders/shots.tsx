import React from "react";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import type { ShotDef } from "../../engine/EpisodePlayer";
import type { Cam } from "../../engine/Stage";
import { cue } from "../../engine/timeline";
import { Pt, clamp, easeIn, easeInOut, easeOut, easeOutBack, lerp, prog, rnd } from "../../engine/util";
import type { GeraldProps } from "./cast/Gerald";
import type { LyleProps } from "./cast/Lyle";
import type { MoProps } from "./cast/Mo";
import type { VernProps } from "./cast/Vern";
import { TL } from "./fixes";
import { BedroomScene, Burst, CAMB, CAMC, CounterScene, CUP_C, C_HEADS, ErrorScreen, ExteriorScene, GERALD_C, SpeedLines, TitleCard, TOD } from "./cutaways";
import { CAM5, DECAF_POT, DregsScene, HEADS, MO_POS, SetState } from "./dregs";
import { FONT, MUSTARD, PURPLE, SkullBean } from "./props";

/**
 * EPISODE 005 — "Last Minute Orders".
 * Lyle (hedgehog barista) has to brew a fresh pot at closing; Vern (iguana) has a better idea, and then a worse one;
 * Mo (sloth, mop) is the voice of reason until the last line. Gerald (bloodhound) waits for his coffee, unaware.
 * Every shot is anchored to the script with cue().
 */
const at = (phrase: string, opts?: Parameters<typeof cue>[2]) => cue(TL, phrase, opts);

const T = {
  wrong: at("What's wrong man"),
  customer: at("This customer came in"),
  closing: at("before closing and ordered"),
  coffee: at("ordered a coffee"),
  brew: at("Now I have to brew"),
  evenThough: at("even though I already"),
  stationEnd: at("cleaned the station", { edge: "end" }),
  though: at("Do you though"),
  really: at("Do you really"),
  what: at("What", { after: 11.5 }),
  or: at("Or and hear me out"),
  hear: at("and hear me out"),
  giveDecaf: at("you give him decaf"),
  giveDecafEnd: at("you give him decaf", { edge: "end" }),
  omg1: at("Oh my god"),
  wholePot: at("You've got a whole pot"),
  rightThere: at("right there"),
  cantTell: at("And he can't tell the difference"),
  notYet: at("At least not yet"),
  like: at("I like that"),
  notDone: at("Oh we're not done"),
  nonono: at("Oh no no no"),
  longShot: at("not by a long shot"),
  because: at("because when he comes back tomorrow"),
  when1: at("when he comes back tomorrow"),
  headache: at("a headache exhausted"),
  exhausted: at("exhausted"),
  groggy: at("groggy"),
  confused: at("confused as to why"),
  youKnow: at("you know what you do"),
  youKnowEnd: at("you know what you do", { edge: "end" }),
  hitAgain: at("you hit him again"),
  hit: at("hit him again"),
  decafW: at("Decaf", { after: 47 }),
  diabolical: at("Decaf is diabolical"),
  error: at("Error 404"),
  caffeine: at("caffeine not found"),
  found: at("found", { after: 52 }),
  omg2: at("Oh my God", { after: 53 }),
  cantTell2: at("He can't tell the difference", { after: 55 }),
  notYet2: at("at least not yet", { after: 57 }),
  thank: at("He'll probably thank you"),
  serve: at("serve it with a smile"),
  messed: at("It's messed up I love it"),
  wrongYou: at("What's wrong with you"),
  stop: at("But it doesn't stop there"),
  because2: at("Because when he comes back the following"),
  following: at("the following afternoon"),
  headaches: at("headaches sleep deprived"),
  hobbies: at("Y'all need hobbies"),
  hit2: at("Hit him again", { after: 77 }),
  baby: at("Decaf baby"),
  messed2: at("Y'all are messed up"),
  calling: at("He'll probably start calling"),
  thinking: at("thinking he's suffering"),
  migraines: at("migraines"),
  something: at("something you can't quite explain"),
  illegal: at("That sounds illegal"),
  keepGiving: at("And you just keep giving him"),
  beautiful: at("It's beautiful"),
  until: at("Until eventually his body acclimates"),
  acclimatesEnd: at("acclimates", { edge: "end" }),
  sleeping: at("And he starts sleeping peacefully"),
  sleepingEnd: at("peacefully", { edge: "end" }),
  why: at("Why Why are you paused"),
  knowWhat: at("You know what to do don't you"),
  knowWhatEnd: at("don't you", { edge: "end" }),
  regular: at("Then I give him regular"),
  goddamn: at("You're goddamn right"),
  extraShot: at("and throw in an extra shot"),
  redEye: at("a little red eye"),
  red: at("red eye"),
  loyal: at("for being a loyal customer"),
  insomnia: at("you have insomnia"),
  jetFuel: at("talk about jet fuel"),
  heartRate: at("that heart rate will be popping"),
  popping: at("popping"),
  nah: at("nah but what did this guy"),
  thisGuy: at("this guy do to deserve"),
  ordered: at("he ordered a coffee right"),
  rightBefore: at("right before closing", { after: 128 }),
  gets: at("he gets what he"),
  deserves: at("deserves", { after: 130 }),
  end: TL.duration,
};

/* ------------------------------------------------------------------ */
/* Continuity driven by the clock                                      */
/* ------------------------------------------------------------------ */

const P = (v: number, a: number, b: number) => prog(v, a, b);
const PRESENT_POUR = T.hit2 + 1.35; // Lyle pours Gerald's (decaf) cup in the silence after "Hit him again"

const setAt = (t: number): Partial<SetState> => ({
  clockMin: 58 + 2 * clamp(t / (T.end - 0.4)),
  geraldCup: t > PRESENT_POUR + 2.2,
  decafFill: t < PRESENT_POUR ? 0.86 : 0.7,
  closed: t > T.end + 1.0,
});

/** Gerald at his table, waiting. Every 9 s he checks his watch. */
const geraldAt = (t: number): Partial<GeraldProps> => {
  const ph = ((t + 3) % 9) / 9;
  const checking = ph > 0.72 && ph < 0.95 && t < PRESENT_POUR + 2.2;
  return {
    expr: "sad",
    hold: checking ? "watch" : null,
    armF: checking ? [22, 112] : [64, 30],
    armB: [40, 60],
    look: checking ? [0.5, 0.9] : [0.9, 0.05],
    headTilt: checking ? 10 : 0,
    slump: 10,
  };
};

const moAt = (t: number): Partial<MoProps> => ({ expr: "deadpan", look: [0.5, 0.2], mopPhase: t * 0.55 });

/** The usual shop with everyone where they should be at time t. */
const Shop: React.FC<{
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  lyle?: Partial<LyleProps> | false;
  vern?: Partial<VernProps> | false;
  mo?: Partial<MoProps> | false;
  gerald?: Partial<GeraldProps> | false;
  set?: Partial<SetState>;
  shakeAmp?: number;
  back?: React.ReactNode;
  front?: React.ReactNode;
  wash?: number;
}> = ({ from, to, cam, ease, lyle = {}, vern = {}, mo = {}, gerald = {}, set = {}, shakeAmp, back, front, wash }) => {
  const { shot } = useEpisode();
  const t = shot.t;
  return (
    <DregsScene
      from={from}
      to={to}
      cam={cam}
      ease={ease}
      lyle={lyle === false ? false : { expr: "frazzled", ...lyle }}
      vern={vern === false ? false : { expr: "scheme", ...vern }}
      mo={mo === false ? false : { ...moAt(t), ...mo }}
      gerald={gerald === false ? false : { ...geraldAt(t), ...gerald }}
      set={{ ...setAt(t), ...set }}
      shakeAmp={shakeAmp}
      back={back}
      front={front}
      wash={wash}
    />
  );
};

/** Gerald on the scheme's timeline: how wrecked he is, stage by stage. */
const wreck = (stage: "fresh" | "morning" | "afternoon" | "regular"): Partial<GeraldProps> => {
  switch (stage) {
    case "morning":
      return { expr: "groggy", rumpled: 0.6, sway: 0.6, messy: 0.5 };
    case "afternoon":
      return { expr: "pained", rumpled: 1, sway: 0.8, messy: 1, throb: 0.8 };
    case "regular":
      return { expr: "hopeful", rumpled: 0, sway: 0, messy: 0 };
    default:
      return { expr: "sad" };
  }
};

/* ------------------------------------------------------------------ */
/* Little props                                                        */
/* ------------------------------------------------------------------ */

/** Progress bar floating over Gerald's head. */
const ProgressBar: React.FC<{ x: number; y: number; k: number; label: string }> = ({ x, y, k, label }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-150} y={-46} width={300} height={92} rx={10} fill="#e8e4da" stroke={INK} strokeWidth={6} />
    <text x={0} y={-14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={20} fill={INK}>
      {label}
    </text>
    <rect x={-126} y={2} width={252} height={28} rx={4} fill="#fff" stroke={INK} strokeWidth={4} />
    <rect x={-122} y={6} width={244 * clamp(k)} height={20} fill={k >= 1 ? "#3aa04a" : "#2a6ad0"} />
    <text x={0} y={23} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={16} fill={k > 0.5 ? "#fff" : INK}>
      {Math.floor(clamp(k) * 100)}%
    </text>
  </g>
);

/** DREGS loyalty card, punched with skulls. */
const LoyaltyCard: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-90} y={-54} width={180} height={108} rx={10} fill="#f2ead6" stroke={INK} strokeWidth={5} />
    <rect x={-90} y={-54} width={180} height={30} rx={10} fill={PURPLE} stroke={INK} strokeWidth={5} />
    <text x={0} y={-33} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={14} fill={MUSTARD}>
      DREGS LOYALTY
    </text>
    {Array.from({ length: 10 }).map((_, i) => {
      const cx = -68 + (i % 5) * 34;
      const cy = -2 + Math.floor(i / 5) * 30;
      return (
        <g key={i}>
          <circle cx={cx} cy={cy} r={12} fill="none" stroke={INK} strokeWidth={2.5} />
          {i < 9 ? <SkullBean x={cx} y={cy} s={18} rot={0} color="#e8e0c8" /> : <text x={cx} y={cy + 5} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={11} fill="#a3262a">?!</text>}
        </g>
      );
    })}
  </g>
);

/** Espresso shot glass, falling into the cup. */
const ShotGlass: React.FC<{ x: number; y: number; rot: number }> = ({ x, y, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d="M-18,-26 L18,-26 L14,22 L-14,22 Z" fill="#cfdde0" fillOpacity={0.5} stroke={INK} strokeWidth={4} />
    <path d="M-16,-10 L16,-10 L14,20 L-14,20 Z" fill="#1a0c06" />
    <path d="M-16,-10 L16,-10" stroke="#c99a5a" strokeWidth={4} />
  </g>
);

/** The trio's eyes, glowing in the dark (tail). */
const GlowEyes: React.FC<{ k: number; t: number }> = ({ k, t }) => {
  if (k <= 0) return null;
  const eyes: Array<[number, number, number]> = [
    [HEADS.lyle.x - 12, HEADS.lyle.y - 14, 13],
    [HEADS.lyle.x + 24, HEADS.lyle.y - 12, 15],
    [HEADS.vern.x - 58, HEADS.vern.y - 22, 11],
    [HEADS.vern.x - 18, HEADS.vern.y - 14, 17],
    [HEADS.mo.x - 30, HEADS.mo.y - 6, 10],
    [HEADS.mo.x - 70, HEADS.mo.y - 8, 7],
  ];
  return (
    <g style={{ mixBlendMode: "screen" }} opacity={k}>
      {eyes.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 3} fill="#fff27a" opacity={0.25} />
          <circle cx={x} cy={y} r={r * 0.9} fill="#fffbd0" opacity={0.95 - (rnd(`ge${i}${Math.floor(t * 8)}`) < 0.05 ? 0.8 : 0)} />
        </g>
      ))}
      {[
        [HEADS.lyle.x + 52, HEADS.lyle.y + 34, 36],
        [HEADS.vern.x - 60, HEADS.vern.y + 18, 70],
        [HEADS.mo.x - 50, HEADS.mo.y + 34, 26],
      ].map(([x, y, w], i) => (
        <path key={`g${i}`} d={`M${x - w / 2},${y - 4} Q${x},${y + 16} ${x + w / 2},${y - 4}`} stroke="#fffbd0" strokeWidth={6} fill="none" opacity={0.9} />
      ))}
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Shots                                                               */
/* ------------------------------------------------------------------ */

const ExtOpen = () => <ExteriorScene from={{ x: 980, y: 560, zoom: 0.92 }} to={{ x: 930, y: 640, zoom: 1.18 }} />;

const TwoCustomer = () => {
  const { shot } = useEpisode();
  const thumb = easeOutBack(P(shot.t, T.customer + 0.2, T.customer + 0.6));
  return (
    <Shop
      from={CAM5.two}
      to={{ ...CAM5.two, zoom: 1.6, x: 860 }}
      lyle={{ expr: "frazzled", armF: [lerp(16, -130, thumb), lerp(46, -30, thumb)], look: [0.9, 0], twitch: 1 }}
      vern={{ expr: "deadpan", look: [0.8, 0.1], armF: [30, 80], lean: 4 }}
    />
  );
};

const CuGeraldWaiting = () => {
  const { shot } = useEpisode();
  const wave = shot.t > T.coffee ? Math.sin((shot.t - T.coffee) * 12) * 14 : 0;
  return <Shop from={CAM5.cuGerald} to={{ ...CAM5.cuGerald, zoom: 2.6 }} gerald={{ expr: "hopeful", armF: shot.t > T.coffee - 0.2 ? [60 + wave * 0.2, 50 + wave * 0.5] : [64, 30], look: [1, -0.1], hold: null }} />;
};

const MsLyleBrew = () => {
  const { shot } = useEpisode();
  const up = easeOutBack(P(shot.local, 0.05, 0.35));
  return <Shop from={CAM5.msLyle} to={{ ...CAM5.msLyle, zoom: 2.0 }} lyle={{ expr: "annoyed", bristle: 0.5, armF: [lerp(16, 150, up), 20], armB: [lerp(-8, -150, up), -20], shed: 0.8, twitch: 1, look: [0.6, -0.3] }} />;
};

const Station = () => <Shop from={CAM5.station} to={{ ...CAM5.station, zoom: 2.5, x: 1420 }} set={{ sparkle: 1 }} vern={{ expr: "scheme", look: [0.9, 0.1] }} mo={false} />;

const CuVernThough = () => {
  const { shot } = useEpisode();
  const k = P(shot.local, 0, 1.6);
  return <Shop from={{ ...CAM5.cuVern, zoom: 2.2 }} to={{ ...CAM5.cuVern, zoom: 2.9 }} vern={{ expr: k < 0.5 ? "deadpan" : "scheme", look: [0.95, 0.1], lean: 4 }} set={{ dark: 0.25 * easeInOut(k) }} />;
};

const CuLyleHuh = () => <Shop from={CAM5.cuLyle} to={{ ...CAM5.cuLyle, zoom: 2.7 }} lyle={{ expr: "confused", look: [0.9, -0.1], headTilt: -10 }} set={{ dark: 0.25 }} />;

const EcuVernReally = () => <Shop from={{ ...CAM5.ecuVern, zoom: 3.4 }} to={CAM5.ecuVern} vern={{ expr: "smug", look: [0.95, 0.15], lean: 6 }} set={{ dark: 0.3 }} />;

const CuLyleWhat = () => <Shop from={CAM5.cuLyle} to={{ ...CAM5.cuLyle, zoom: 2.75 }} lyle={{ expr: "confused", look: [0.95, -0.2], headTilt: 8, bristle: 0.2 }} set={{ dark: 0.15 }} />;

const TwoHearMeOut = () => {
  const { shot } = useEpisode();
  // in the pause he checks nobody's listening
  const sneaky = shot.t > T.or + 0.5 && shot.t < T.hear - 0.1;
  const glance = sneaky ? (Math.floor((shot.t - T.or) * 1.6) % 2 === 0 ? -0.9 : 0.9) : 0.9;
  const lean = easeInOut(P(shot.local, 0.2, 1.2));
  return (
    <Shop
      from={{ ...CAM5.twoTight, zoom: 1.7 }}
      to={{ ...CAM5.twoTight, zoom: 2.0, x: 880, y: 490 }}
      lyle={{ expr: "concerned", lean: lean * 8, look: [0.95, 0], twitch: 0.6 }}
      vern={{ expr: "whisper", lean: lean * 12, look: [glance, 0.1], armF: [55, 70], handF: "up" }}
    />
  );
};

const EcuVernDecaf = () => {
  const { shot } = useEpisode();
  const k = P(shot.t, T.giveDecaf + 0.3, T.giveDecafEnd);
  return <Shop from={{ ...CAM5.ecuVern, zoom: 3.8 }} to={{ ...CAM5.ecuVern, zoom: 4.6, y: CAM5.ecuVern.y + 14 }} vern={{ expr: "whisper", look: [0.95, 0.2], dewlap: k * 0.6, underlight: 0.6, lean: 10 }} set={{ dark: 0.35 }} />;
};

const CuLyleGasp = () => <Shop from={{ ...CAM5.cuLyle, zoom: 2.8 }} to={{ ...CAM5.cuLyle, zoom: 3.1 }} lyle={{ expr: "shocked", look: [0.95, -0.1], bristle: 0.6 }} shakeAmp={4} />;

const CuVernOmg = () => <Shop from={CAM5.cuVern} to={{ ...CAM5.cuVern, zoom: 2.6 }} vern={{ expr: "excited", look: [0.8, -0.3], dewlap: 0.8, armF: [100, 10], handF: "open", headTilt: -6 }} />;

const DecafPot = () => {
  const { shot } = useEpisode();
  const reach = easeOut(P(shot.t, T.wholePot + 0.4, T.wholePot + 1.0));
  const tap = shot.t > T.rightThere - 0.1 ? Math.max(0, Math.sin((shot.t - T.rightThere + 0.1) * 20)) * 5 : 0;
  return (
    <Shop
      from={{ ...CAM5.decafPot, zoom: 3.0, y: 520 }}
      to={{ ...CAM5.decafPot, zoom: 4.4, y: 548 }}
      set={{ sparkle: 1 }}
      vern={{ expr: "scheme", armB: [lerp(-6, -80, reach), lerp(30, -10 - tap, reach)], handB: reach > 0.3 ? "point" : "open" }}
      mo={false}
      front={<ellipse cx={DECAF_POT[0]} cy={DECAF_POT[1] - 50} rx={90} ry={110} fill="#fff6c8" opacity={0.16 + 0.06 * Math.sin(shot.t * 5)} />}
    />
  );
};

const CuGeraldOblivious = () => {
  const { shot } = useEpisode();
  const sniff = Math.max(0, Math.sin(shot.local * 9)) * (shot.local > 0.3 && shot.local < 1.4 ? 1 : 0);
  return <Shop from={CAM5.cuGerald} to={{ ...CAM5.cuGerald, zoom: 2.55 }} gerald={{ expr: "hopeful", look: [0.9, -0.3], headTilt: -6 - sniff * 6, hold: null, armF: [64, 30] }} />;
};

const EcuVernNotYet = () => {
  const { shot } = useEpisode();
  const k = P(shot.local, 0.1, 0.9);
  const flash = shot.t > T.notYet + 0.5 && shot.t < T.notYet + 0.62 ? 1 : 0;
  return (
    <Shop
      from={{ ...CAM5.ecuVern, zoom: 3.4 }}
      to={{ ...CAM5.ecuVern, zoom: 4.3 }}
      vern={{ expr: "menace", look: [0.2, 0.1], underlight: 1, dewlap: 0.3 }}
      set={{ dark: 0.25 + 0.4 * k, flicker: 0.8 }}
      front={flash ? <rect x={-1000} y={-1000} width={4000} height={3000} fill="#e8f0ff" opacity={0.4} /> : null}
    />
  );
};

const CuLyleLike = () => {
  const { shot } = useEpisode();
  const nod = shot.t < T.like + 0.7 ? Math.max(0, Math.sin((shot.t - T.like) * 10)) * 8 : 0;
  const turn = easeInOut(P(shot.local, 1.4, 2.0));
  return <Shop from={CAM5.cuLyle} to={{ ...CAM5.cuLyle, zoom: 2.65 }} lyle={{ expr: "delighted", look: [lerp(0.9, -0.6, turn), 0], headTilt: nod - turn * 6, lean: -turn * 6, armF: [lerp(16, 60, turn), 40] }} />;
};

const TwoNotDone = () => {
  const { shot } = useEpisode();
  const stopK = easeOutBack(P(shot.t, T.notDone - 0.1, T.notDone + 0.3));
  return (
    <Shop
      from={CAM5.two}
      to={{ ...CAM5.two, zoom: 1.6 }}
      lyle={{ expr: "confused", look: [0.95, -0.1], lean: lerp(-8, 2, stopK) }}
      vern={{ expr: "excited", look: [0.95, 0], armF: [lerp(24, 92, stopK), lerp(70, 0, stopK)], handF: "flat", lean: 8, dewlap: 0.4 }}
    />
  );
};

const CuVernNoNoNo = () => {
  const { shot } = useEpisode();
  const wag = Math.sin(shot.t * 16) * 18;
  const dw = shot.t > T.longShot ? 0.9 : 0.4;
  return <Shop from={CAM5.cuVern} to={{ ...CAM5.cuVern, zoom: 2.75, y: CAM5.cuVern.y + 20 }} vern={{ expr: shot.t > T.longShot ? "menace" : "smug", look: [0.95, 0.1], armF: [50, 80 + wag], handF: "up", dewlap: dw, lean: 6 }} />;
};

const MsVernBecause = () => {
  const { shot } = useEpisode();
  const spread = easeOut(P(shot.local, 0.1, 0.8));
  return (
    <Shop
      from={CAM5.msVern}
      to={{ ...CAM5.msVern, zoom: 1.9, y: CAM5.msVern.y - 30 }}
      vern={{ expr: "dramatic", look: [0.3, -0.5], armF: [lerp(24, 100, spread), lerp(70, 0, spread)], armB: [lerp(-6, 82, spread), lerp(30, 8, spread)], handF: "open", handB: "open", dewlap: 0.5, headTilt: -8 }}
      lyle={{ expr: "concerned", look: [0.9, -0.3] }}
      set={{ dark: 0.45 * spread }}
    />
  );
};

/** A stage of the scheme, at the counter. */
const FutArrive: React.FC<{ tod: TOD; title: string; stage: "morning" | "afternoon" }> = ({ tod, title, stage }) => {
  const { shot } = useEpisode();
  const walk = easeOut(P(shot.local, 0, 1.8));
  const bob = walk < 1 ? Math.abs(Math.sin(shot.local * 6)) * 10 : 0;
  return (
    <>
      <CounterScene
        tod={tod}
        from={CAMC.wide}
        to={{ ...CAMC.two, zoom: 1.2 }}
        clock={stage === "morning" ? [8, 12] : [3, 40]}
        calendar={stage === "morning" ? 15 : 16}
        cup={false}
        lyle={{ expr: "creepy", look: [0.95, 0.1] }}
        gerald={{ ...wreck(stage), x: lerp(GERALD_C.x - 420, GERALD_C.x, walk), y: GERALD_C.y - bob, holdB: "briefcase", look: [0.8, 0.3] }}
      />
      <TitleCard text={title} local={shot.local} />
    </>
  );
};

const FutMorningHeadache = () => {
  const { shot } = useEpisode();
  const throb = shot.t > T.headache + 0.1 ? 1 : 0;
  const ex = easeInOut(P(shot.t, T.exhausted, T.exhausted + 0.4));
  return <CounterScene tod="morning" from={CAMC.cuGerald} to={{ ...CAMC.cuGerald, zoom: 2.6 }} clock={[8, 13]} calendar={15} cup={false} lyle={{ expr: "creepy" }} gerald={{ ...wreck("morning"), expr: ex > 0.5 ? "groggy" : "pained", throb, look: [0.6, 0.4], slump: 6 + ex * 10 }} />;
};

const FutMorningGroggy = () => {
  const { shot } = useEpisode();
  const conf = shot.t > T.confused ? 1 : 0;
  return (
    <CounterScene
      tod="morning"
      from={CAMC.msGerald}
      to={{ ...CAMC.msGerald, zoom: 1.7 }}
      clock={[8, 14]}
      calendar={15}
      cup={false}
      lyle={{ expr: "creepy" }}
      gerald={{ ...wreck("morning"), expr: conf ? "confused" : "groggy", sway: 1, question: conf, headTilt: conf ? 14 : 0, holdB: "briefcase" }}
    />
  );
};

const CuVernYouKnow = () => <Shop from={{ ...CAM5.cuVern, zoom: 2.6 }} to={{ ...CAM5.cuVern, zoom: 3.0 }} vern={{ expr: "smug", look: [0.95, 0.2], lean: 10, armF: [55, 70], handF: "point" }} set={{ dark: 0.2 }} />;

const TwoPause = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0, 0.8));
  return (
    <Shop
      from={{ x: 1180, y: 560, zoom: 1.05 }}
      to={{ x: 1200, y: 560, zoom: 1.12 }}
      lyle={{ expr: "concerned", lean: 10 * k, look: [0.95, -0.1], bristle: 0.3 }}
      vern={{ expr: "pause", look: [0.95, 0.1], lean: 10 }}
      mo={{ expr: "judging", mopPhase: null, lean: -6 * k, look: [0.9, -0.2] }}
      set={{ dark: 0.2 }}
    />
  );
};

const FutHitAgain = () => {
  const { shot } = useEpisode();
  const pour = easeInOut(P(shot.local, 0.05, 0.4));
  const bang = P(shot.t, T.hit, T.hit + 0.25);
  return (
    <CounterScene
      tod="morning"
      from={CAMC.pour}
      to={{ ...CAMC.pour, zoom: 2.6 }}
      clock={[8, 16]}
      calendar={15}
      cup={{ lid: "decaf", open: true, fill: 0.3 + pour * 0.6, name: "GERALD" }}
      pouring={pour > 0.6}
      lyle={{ expr: "evil", pot: "decaf", potCobweb: true, potTilt: lerp(0, 58, pour), armF: [lerp(16, 125, pour), lerp(46, 10, pour)], look: [0.6, 0.6], bristle: 0.4 }}
      gerald={{ ...wreck("morning") }}
      shakeAmp={bang > 0 && bang < 1 ? 14 * (1 - bang) : 0}
      back={<Burst x={CUP_C[0] + 80} y={CUP_C[1] - 170} r={190} k={bang > 0 ? 1 - Math.max(0, bang - 0.6) : 0} color="#f29a2a" />}
    />
  );
};

const EcuVernDecaf2 = () => {
  const { shot } = useEpisode();
  const savor = shot.t > T.decafW + 0.35;
  return <Shop from={{ ...CAM5.ecuVern, zoom: 3.6 }} to={{ ...CAM5.ecuVern, zoom: 4.4 }} vern={{ expr: savor ? "tearful" : "whisper", look: [0.95, 0.1], lean: 10, dewlap: 0.5, underlight: 0.5 }} set={{ dark: 0.5 }} />;
};

const MsMoDiabolical = () => {
  const { shot } = useEpisode();
  const stopped = shot.t > T.diabolical - 0.4;
  return <Shop from={CAM5.msMo} to={{ ...CAM5.msMo, zoom: 1.75, y: CAM5.msMo.y - 40 }} mo={{ expr: "appalled", mopPhase: stopped ? T.diabolical * 0.55 : shot.t * 0.55, look: [0.8, -0.1], headTilt: 6 }} />;
};

const Fut404 = () => <ErrorScreen tCaffeine={T.caffeine} tFound={T.found} />;

const CuVernGiggle = () => {
  const { shot } = useEpisode();
  const giggle = Math.sin(shot.t * 20) * 4;
  return <Shop from={CAM5.cuVern} to={{ ...CAM5.cuVern, zoom: 2.6 }} vern={{ expr: "excited", look: [0.9, -0.1], headTilt: giggle, armF: [42, 100], armB: [52, 96], handF: "up", handB: "up", dewlap: 0.6 }} />;
};

const FutSip = () => {
  const { shot } = useEpisode();
  const sip = easeInOut(P(shot.local, 0.15, 0.6)) * (1 - easeInOut(P(shot.local, 1.5, 1.9)));
  return (
    <CounterScene
      tod="morning"
      from={CAMC.cuGerald}
      to={{ ...CAMC.cuGerald, zoom: 2.5 }}
      clock={[8, 18]}
      calendar={15}
      cup={false}
      lyle={{ expr: "creepy" }}
      gerald={{ ...wreck("morning"), expr: sip > 0.5 ? "peaceful" : "groggy", hold: "cup", cupLid: "decaf", cupName: "GERALD", armF: [lerp(30, 40, sip), lerp(70, 115, sip)], sway: 0.3 }}
    />
  );
};

const EcuVernNotYet2 = () => <Shop from={{ ...CAM5.ecuVern, zoom: 4.0 }} to={{ ...CAM5.ecuVern, zoom: 4.6 }} vern={{ expr: "menace", look: [0.3, 0.2], underlight: 1 }} set={{ dark: 0.6, flicker: 0.8 }} />;

const FutThankYou = () => {
  const { shot } = useEpisode();
  const bow = Math.max(0, Math.sin(P(shot.local, 0.3, 1.6) * Math.PI));
  const mouthSeq = ["X", "B", "C", "E", "B", "D", "C", "X"] as const;
  const mi = Math.floor(P(shot.local, 0.5, 1.4) * (mouthSeq.length - 1));
  return (
    <CounterScene
      tod="morning"
      from={{ ...CAMC.two, zoom: 1.35, x: 940 }}
      to={{ ...CAMC.two, zoom: 1.5, x: 950 }}
      clock={[8, 20]}
      calendar={15}
      cup={{ lid: "decaf", name: "GERALD", steam: true }}
      lyle={{ expr: "creepy", look: [0.95, 0.2], armF: [40, 60] }}
      gerald={{ ...wreck("morning"), expr: "thankful", slump: 6 + bow * 22, armF: [70, 100], armB: [60, 110], mouth: mouthSeq[mi], sway: 0 }}
    />
  );
};

const FutSmile = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0, 1.2));
  return <CounterScene tod="morning" from={CAMC.cuLyle} to={{ ...CAMC.ecuLyle, zoom: lerp(2.6, 3.4, k) }} clock={[8, 21]} calendar={15} cup={false} lyle={{ expr: "creepy", look: [0.95, 0.2], twitch: 1, armF: [40, 60] }} gerald={{ ...wreck("morning") }} />;
};

const CuLyleLove = () => {
  const { shot } = useEpisode();
  const rub = Math.sin(shot.t * 14) * 8;
  return <Shop from={CAM5.cuLyle} to={{ ...CAM5.cuLyle, zoom: 2.7 }} lyle={{ expr: "scheme", look: [0.95, 0], armF: [44 + rub, 100], armB: [52 - rub, 96], bristle: 0.3 }} />;
};

const CuMoWrong = () => <Shop from={{ ...CAM5.cuMo, zoom: 2.6 }} to={{ ...CAM5.cuMo, zoom: 2.9 }} mo={{ expr: "appalled", look: [0.9, -0.1], headTilt: 4 }} />;

const CuVernStop = () => {
  const { shot } = useEpisode();
  const up = easeOutBack(P(shot.t, T.stop, T.stop + 0.4));
  return <Shop from={CAM5.cuVern} to={{ ...CAM5.cuVern, zoom: 2.65 }} vern={{ expr: "menace", look: [0.95, 0], armF: [lerp(24, 50, up), lerp(70, 80, up)], handF: "up", dewlap: 0.8, lean: 6 }} />;
};

const PanToGerald = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.t, T.because2 - 0.2, T.because2 + 1.6));
  return (
    <Shop
      from={CAM5.wide}
      cam={{ x: lerp(1000, 220, k), y: lerp(520, 640, k), zoom: lerp(0.95, 1.5, k) }}
      vern={{ expr: "smug", look: [0.95, 0.1], armF: [lerp(24, 96, k), lerp(70, 0, k)], handF: "point", lean: 6 }}
      lyle={{ expr: "scheme", look: [-0.9, 0.1], headTilt: -6 }}
      mo={{ expr: "judging", look: [0.9, 0] }}
      gerald={{ expr: "sad", look: [0.9, 0], hold: null, armF: [64, 30] }}
    />
  );
};

const FutAfternoonCu = () => {
  const { shot } = useEpisode();
  const twitch = rnd(`gtw${Math.floor(shot.frame / 3)}`) < 0.2 ? 4 : 0;
  return <CounterScene tod="afternoon" from={CAMC.cuGerald} to={{ ...CAMC.cuGerald, zoom: 2.7 }} clock={[3, 42]} calendar={16} cup={false} lyle={{ expr: "creepy" }} gerald={{ ...wreck("afternoon"), headTilt: twitch, look: [0.5, 0.5], slump: 14 }} />;
};

const MsMoHobbies = () => <Shop from={{ ...CAM5.msMo, zoom: 1.6 }} to={{ ...CAM5.msMo, zoom: 1.8, y: CAM5.msMo.y - 50 }} mo={{ expr: "judging", look: [0.9, -0.1] }} />;

const CuVernHit = () => {
  const { shot } = useEpisode();
  const punch = easeOutBack(P(shot.t, T.hit2, T.hit2 + 0.25));
  return <Shop from={{ ...CAM5.cuVern, zoom: 2.6 }} to={{ ...CAM5.cuVern, zoom: 3.0 }} vern={{ expr: "menace", look: [0.95, 0.1], armF: [lerp(24, 96, punch), lerp(70, 4, punch)], handF: "fist", dewlap: 1, lean: 8 }} shakeAmp={punch > 0.5 && punch < 1.05 ? 6 : 0} />;
};

/** The present: Lyle pours tonight's cup. From the decaf pot. */
const PresentPour = () => {
  const { shot } = useEpisode();
  const pour = easeInOut(P(shot.local, 0.15, 0.7));
  return (
    <CounterScene
      tod="night"
      from={{ ...CAMC.pour, zoom: 2.0 }}
      to={{ ...CAMC.pour, zoom: 2.4 }}
      clock={[9, 59]}
      calendar={14}
      cup={{ lid: "decaf", open: true, fill: 0.2 + pour * 0.6, name: "GERALD" }}
      pouring={pour > 0.6}
      lyle={{ expr: "creepy", pot: "decaf", potCobweb: true, potTilt: lerp(0, 58, pour), armF: [lerp(16, 125, pour), lerp(46, 10, pour)], look: [0.5, 0.7], twitch: 1 }}
      gerald={false}
    />
  );
};

const EcuVernBaby = () => {
  const { shot } = useEpisode();
  const pulse = Math.max(0, Math.sin(shot.local * 8));
  return <Shop from={{ ...CAM5.ecuVern, zoom: 3.6 }} to={{ ...CAM5.ecuVern, zoom: 4.2 }} vern={{ expr: "smug", look: [0.95, 0.1], dewlap: pulse, headTilt: -6 + pulse * 6, lean: 8 }} set={{ dark: 0.3 }} />;
};

const CuMoMessed = () => {
  const { shot } = useEpisode();
  const shake = Math.sin(shot.local * 5) * 10;
  return <Shop from={{ ...CAM5.cuMo, zoom: 2.5 }} to={{ ...CAM5.cuMo, zoom: 2.8 }} mo={{ expr: "appalled", look: [0.9, 0], headTilt: shake }} />;
};

const BedSickCall = () => (
  <BedroomScene
    tod="morning"
    mode="sitting"
    clockText="8:05"
    from={CAMB.wide}
    to={CAMB.sit}
    sick
    laptop
    lamp={false}
    gerald={{ expr: "sick", sick: 1, thermometer: true, icepack: true, hold: "phone", armF: [150, 150], armB: [30, 60], look: [0.6, 0.3], messy: 1 }}
  />
);

const BedMigraine = () => {
  const { shot } = useEpisode();
  const bolt = Math.floor(shot.t * 6) % 2 === 0;
  return (
    <BedroomScene
      tod="morning"
      mode="sitting"
      clockText="8:07"
      from={CAMB.sitClose}
      to={{ ...CAMB.sitClose, zoom: 3.3 }}
      sick
      laptop
      lamp={false}
      shakeAmp={3}
      gerald={{ expr: "pained", sick: 1, throb: 1, icepack: true, armF: [40, 118], hold: null, look: [0.4, 0.2], messy: 1 }}
      front={
        bolt ? (
          <g>
            {[
              [380, 330, -20],
              [640, 300, 20],
              [330, 450, -40],
            ].map(([bx, by, r], i) => (
              <path key={i} d="M0,0 L18,-30 L8,-30 L26,-62 L-6,-22 L6,-22 Z" transform={`translate(${bx} ${by}) rotate(${r}) scale(1.6)`} fill="#f2e24a" stroke={INK} strokeWidth={3} />
            ))}
          </g>
        ) : null
      }
    />
  );
};

const BedLaptop = () => <BedroomScene tod="morning" mode="sitting" clockText="8:08" from={CAMB.laptop} to={{ ...CAMB.laptop, zoom: 3.5 }} sick laptop lamp={false} gerald={{ expr: "pained", sick: 1, icepack: true, look: [0.7, 0.8], messy: 1 }} />;

const CuLyleIllegal = () => {
  const { shot } = useEpisode();
  const glance = Math.floor(shot.local * 1.5) % 2 === 0 ? 0.95 : -0.8;
  return <Shop from={CAM5.cuLyle} to={{ ...CAM5.cuLyle, zoom: 2.7 }} lyle={{ expr: "concerned", look: [glance, -0.1], bristle: 0.3, headTilt: 6 }} />;
};

/** Days blur past: decaf, decaf, decaf. */
const Montage = () => {
  const { shot } = useEpisode();
  const n = 6;
  const span = shot.end - shot.start;
  const i = Math.min(n - 1, Math.floor((shot.local / span) * n));
  const kk = ((shot.local / span) * n) % 1;
  const tods: TOD[] = ["morning", "afternoon", "night"];
  const pour = Math.sin(kk * Math.PI);
  return (
    <CounterScene
      tod={tods[i % 3]}
      from={{ ...CAMC.two, zoom: 1.15 }}
      to={{ ...CAMC.two, zoom: 1.25 }}
      clock={[[8, 3, 9][i % 3], 10 + i * 7]}
      calendar={17 + i}
      tally={3 + i * 2}
      cup={{ lid: "decaf", open: true, fill: 0.3 + pour * 0.5, name: "GERALD" }}
      pouring={pour > 0.4}
      lyle={{ expr: "creepy", pot: "decaf", potTilt: 58 * pour, armF: [lerp(16, 125, pour), lerp(46, 10, pour)], look: [0.5, 0.6] }}
      gerald={{ ...wreck(i < 2 ? "morning" : "afternoon"), sway: 0.6 + i * 0.1, slump: 8 + i * 3 }}
      front={<rect x={-1000} y={-1000} width={4000} height={3000} fill="#fff8e0" opacity={kk < 0.12 ? 0.35 * (1 - kk / 0.12) : 0} />}
    />
  );
};

const CuVernBeautiful = () => {
  const { shot } = useEpisode();
  const wipe = easeInOut(P(shot.t, T.beautiful + 0.5, T.beautiful + 1.0));
  return (
    <Shop
      from={CAM5.cuVern}
      to={{ ...CAM5.cuVern, zoom: 2.7 }}
      vern={{ expr: "tearful", look: [0.6, -0.4], headTilt: -10, armF: [lerp(24, 130, wipe), lerp(70, 70, wipe)], handF: "flat" }}
      front={
        <g>
          {[0, 1, 2, 3, 4].map((i) => {
            const tw = 0.5 + 0.5 * Math.sin(shot.t * 5 + i * 1.3);
            const sx = HEADS.vern.x - 160 + i * 70;
            const sy = HEADS.vern.y - 90 + (i % 2) * 50;
            const r = 12 * tw;
            return <path key={i} d={`M${sx},${sy - r} L${sx + r * 0.3},${sy - r * 0.3} L${sx + r},${sy} L${sx + r * 0.3},${sy + r * 0.3} L${sx},${sy + r} L${sx - r * 0.3},${sy + r * 0.3} L${sx - r},${sy} L${sx - r * 0.3},${sy - r * 0.3} Z`} fill="#fffbe0" stroke={INK} strokeWidth={1.5} />;
          })}
        </g>
      }
      wash={0.3}
    />
  );
};

const FutAcclimate = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.t, T.until + 0.3, T.acclimatesEnd));
  const ding = shot.t > T.acclimatesEnd;
  return (
    <CounterScene
      tod="morning"
      from={CAMC.msGerald}
      to={{ ...CAMC.msGerald, zoom: 1.6 }}
      clock={[8, 10]}
      calendar={30}
      tally={20}
      cup={false}
      lyle={{ expr: "deadpan" }}
      gerald={{ expr: k < 0.5 ? "groggy" : k < 0.95 ? "dazed" : "hopeful", rumpled: 1 - k, sway: 1 - k, messy: 1 - k, slump: lerp(20, 0, k), hold: "cup", cupLid: "decaf", armF: [30, 70] }}
      front={
        <g>
          <ProgressBar x={C_HEADS.gerald.x + 250} y={C_HEADS.gerald.y - 70} k={k} label={k >= 1 ? "ACCLIMATED" : "ACCLIMATING..."} />
          {ding ? <Burst x={C_HEADS.gerald.x + 420} y={C_HEADS.gerald.y - 120} r={56} k={1} color="#9fe08a" text="DING" /> : null}
        </g>
      }
    />
  );
};

const BedSleeping = () => (
  <BedroomScene tod="night" mode="lying" clockText="10:00" from={CAMB.wide} to={{ ...CAMB.bed, zoom: 1.6 }} headExpr="peaceful" nightcap zzz lamp={false} gerald={{ expr: "peaceful" }} />
);

const BedSleepingClose = () => (
  <BedroomScene tod="night" mode="lying" clockText="10:01" from={{ ...CAMB.head, zoom: 2.2 }} to={CAMB.head} headExpr="peaceful" nightcap zzz lamp={false} gerald={{ expr: "peaceful" }} />
);

/** Mo's mop, leaning on the wet-floor sign while he points. */
const LeaningMop: React.FC = () => (
  <g>
    <path d="M1560,1000 L1640,640" stroke={INK} strokeWidth={17} strokeLinecap="round" />
    <path d="M1560,1000 L1640,640" stroke="#b08a52" strokeWidth={9} strokeLinecap="round" />
    {Array.from({ length: 9 }).map((_, i) => (
      <path key={i} d={`M${1556 + (i - 4) * 5},990 q${(i - 4) * 4},16 ${(i - 4) * 9},30`} stroke={i % 3 === 0 ? "#6a6650" : "#8e8a72"} strokeWidth={7} fill="none" strokeLinecap="round" />
    ))}
  </g>
);

const CuVernPause = () => <Shop from={{ ...CAM5.cuVern, zoom: 2.5 }} vern={{ expr: "pause", look: [0.2, -0.2], armF: [120, 10], armB: [100, 20], handF: "open", handB: "open", dewlap: 0.6 }} set={{ dark: 0.85, flicker: 0 }} front={<ellipse cx={HEADS.vern.x - 20} cy={HEADS.vern.y + 60} rx={220} ry={260} fill="#fff4c8" opacity={0.12} />} />;

const MsMoWhy = () => {
  const { shot } = useEpisode();
  const tilt = Math.sin(shot.local * 2) * 6;
  return <Shop from={CAM5.msMo} to={{ ...CAM5.msMo, zoom: 1.65 }} mo={{ expr: "confused", look: [0.9, -0.1], headTilt: 8 + tilt, mopPhase: null }} vern={{ expr: "pause", armF: [120, 10], armB: [100, 20], handF: "open", handB: "open" }} />;
};

const EcuVernKnow = () => {
  const { shot } = useEpisode();
  const k = P(shot.local, 0, 2.6);
  return <Shop from={{ ...CAM5.cuVern, zoom: 2.6 }} to={{ ...CAM5.ecuVern, zoom: 4.2 }} vern={{ expr: k < 0.6 ? "smug" : "menace", look: [0.95, 0.2], lean: 10, dewlap: 0.3 + k * 0.5, underlight: k }} set={{ dark: 0.3 + k * 0.3 }} />;
};

const CuLyleRegular = () => {
  const { shot } = useEpisode();
  const realize = shot.t > T.regular - 0.9;
  const grin = shot.t > T.regular - 0.2;
  return <Shop from={{ ...CAM5.cuLyle, zoom: 2.6 }} to={{ ...CAM5.ecuLyle, zoom: 3.4 }} lyle={{ expr: grin ? "evil" : realize ? "realize" : "concerned", look: [0.95, 0], bristle: grin ? 0.6 : 0, armF: grin ? [44, 100] : [16, 46], armB: grin ? [52, 96] : [-8, 18] }} set={{ dark: 0.3 }} />;
};

const LowVernGoddamn = () => {
  const { shot } = useEpisode();
  const k = easeOut(P(shot.local, 0, 0.5));
  return (
    <Shop
      from={{ x: HEADS.vern.x - 40, y: HEADS.vern.y + 60, zoom: 2.0, rot: -8 }}
      to={{ x: HEADS.vern.x - 50, y: HEADS.vern.y + 40, zoom: 2.35, rot: -12 }}
      vern={{ expr: "menace", look: [0.6, 0.4], dewlap: k, underlight: 1, armF: [lerp(24, 150, k), 10], armB: [lerp(-6, 130, k), 20], handF: "fist", handB: "fist", lean: -6 }}
      set={{ dark: 0.55, flicker: 1 }}
      shakeAmp={6}
      front={<rect x={-1000} y={-1000} width={4000} height={3000} fill="#ff2010" opacity={0.12 + 0.08 * Math.sin(shot.t * 20)} style={{ mixBlendMode: "screen" }} />}
    />
  );
};

const FutRedEye = () => {
  const { shot } = useEpisode();
  const pour = easeInOut(P(shot.local, 0.05, 0.5)) * (1 - easeInOut(P(shot.t, T.redEye - 0.5, T.redEye - 0.2)));
  const drop = P(shot.t, T.redEye - 0.45, T.redEye - 0.05);
  const glow = easeOut(P(shot.t, T.red, T.red + 0.4));
  return (
    <CounterScene
      tod="morning"
      from={CAMC.pour}
      to={{ ...CAMC.cup, zoom: 3.2 }}
      clock={[7, 58]}
      calendar={31}
      cup={{ lid: "redeye", open: true, fill: 0.4 + pour * 0.5, name: "GERALD", glow: glow * 1.5, brew: glow > 0.3 ? "#2a0806" : undefined }}
      pouring={pour > 0.6}
      lyle={{ expr: "evil", pot: "regular", potTilt: lerp(0, 58, pour), armF: [lerp(16, 125, pour), lerp(46, 10, pour)], look: [0.5, 0.7], bristle: 0.5 }}
      gerald={{ ...wreck("regular") }}
      front={
        <g>
          {drop > 0 && drop < 1 ? <ShotGlass x={CUP_C[0] + 10} y={lerp(CUP_C[1] - 420, CUP_C[1] - 90, easeIn(drop))} rot={drop * 160} /> : null}
          {drop >= 1 ? <Burst x={CUP_C[0]} y={CUP_C[1] - 90} r={70} k={1 - P(shot.t, T.redEye, T.redEye + 0.4)} color="#3a1a10" /> : null}
          {glow > 0
            ? [0, 1, 2].map((i) => {
                const ph = (shot.t * 0.8 + i * 0.33) % 1;
                return <path key={i} d={`M${CUP_C[0] - 14 + i * 14},${CUP_C[1] - 90 - ph * 140} q-14,-16 0,-32 q14,-16 0,-32`} stroke="#ff4a3a" strokeWidth={8} fill="none" opacity={glow * (1 - ph)} strokeLinecap="round" />;
              })
            : null}
        </g>
      }
    />
  );
};

const FutLoyalty = () => {
  const { shot } = useEpisode();
  const hand = easeOutBack(P(shot.local, 0.05, 0.5));
  return (
    <CounterScene
      tod="morning"
      from={CAMC.two}
      to={{ ...CAMC.two, zoom: 1.35, x: 960 }}
      clock={[7, 59]}
      calendar={31}
      cup={{ lid: "redeye", name: "GERALD", glow: 1 }}
      lyle={{ expr: "creepy", armF: [lerp(16, 100, hand), lerp(46, 10, hand)], look: [0.95, 0.1] }}
      gerald={{ ...wreck("regular"), expr: "thankful", armF: [70, 60] }}
      front={<LoyaltyCard x={lerp(1150, 900, hand)} y={560} rot={-8 + hand * 4} s={1.1} />}
    />
  );
};

const CuMoInsomnia = () => <Shop from={{ ...CAM5.cuMo, zoom: 2.6 }} to={{ ...CAM5.cuMo, zoom: 3.0 }} mo={{ expr: "shocked", look: [0.9, -0.2], mopPhase: null }} shakeAmp={3} />;

const FutJetFuel = () => {
  const { shot } = useEpisode();
  const gulp = easeInOut(P(shot.local, 0, 0.35));
  const blast = easeIn(P(shot.local, 0.4, 1.4));
  const gx = GERALD_C.x;
  const gy = GERALD_C.y - blast * 120;
  return (
    <CounterScene
      tod="morning"
      from={CAMC.two}
      to={{ ...CAMC.msGerald, zoom: 1.35 }}
      clock={[8, 0]}
      calendar={31}
      cup={false}
      lyle={{ expr: "evil", look: [0.8, 0.2] }}
      gerald={{ ...wreck("regular"), expr: gulp < 0.9 ? "hopeful" : "wired", wired: gulp > 0.9 ? 1 : 0, heart: blast, hold: "cup", cupLid: "redeye", armF: blast > 0.3 ? [150, 40] : [lerp(30, 40, gulp), lerp(70, 115, gulp)], armB: blast > 0.3 ? [-150, -30] : undefined, earSwing: blast, y: gy, x: gx, slump: -6 }}
      shakeAmp={4 + blast * 12}
      back={blast > 0 ? <SpeedLines cx={gx + 40} cy={gy - 300} t={shot.t} color="#fff2c0" /> : null}
      front={
        blast > 0 ? (
          <g>
            {[0, 1, 2].map((i) => {
              const fl = 60 + rnd(`fl${i}${Math.floor(shot.frame / 2)}`) * 60;
              return <path key={i} d={`M${gx - 40 + i * 40},${gy + 4} q-20,${fl * 0.6} 0,${fl * blast * 2} q20,${-fl * 0.6} 20,${-fl * blast * 2}`} fill={i === 1 ? "#ffe24a" : "#ff7a2a"} stroke={INK} strokeWidth={4} />;
            })}
          </g>
        ) : null
      }
    />
  );
};

const BedHeart = () => {
  const { shot } = useEpisode();
  return (
    <BedroomScene
      tod="night"
      mode="sitting"
      clockText="3:00"
      clockBlink
      from={CAMB.sit}
      to={{ ...CAMB.sit, zoom: 2.3 }}
      lamp={false}
      bedShake={1}
      shakeAmp={5}
      gerald={{ expr: "wired", wired: 1, heart: 1, armF: [20, 30], armB: [10, 20], earSwing: 0.6, slump: -8 }}
      front={
        <g transform="translate(720 384)">
          <rect x={-100} y={-50} width={200} height={100} rx={14} fill="#1a1416" stroke={INK} strokeWidth={6} />
          <path d={`M-84,8 L-50,8 L-40,-30 L-28,36 L-16,8 L0,8 L10,-30 L22,36 L34,8 L84,8`} stroke="#ff3a2a" strokeWidth={5} fill="none" strokeDasharray="400" strokeDashoffset={400 - ((shot.t * 600) % 400)} />
          <text x={0} y={-20} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={22} fill="#ff3a2a">
            BPM 248
          </text>
        </g>
      }
    />
  );
};

const MsMoDeserve = () => {
  const { shot } = useEpisode();
  const point = easeOutBack(P(shot.t, T.thisGuy - 0.3, T.thisGuy + 0.1));
  return <Shop from={CAM5.msMo} to={{ ...CAM5.msMo, zoom: 1.7 }} mo={{ expr: "appalled", look: [0.9, -0.1], mop: point > 0.05 ? false : undefined, mopPhase: null, armFree: [lerp(20, 98, point), 0], headTilt: 6 }} back={point > 0.05 ? <LeaningMop /> : null} />;
};

const CuGeraldInnocent = () => <Shop from={CAM5.cuGerald} to={{ ...CAM5.cuGerald, zoom: 2.7 }} gerald={{ expr: "hopeful", look: [0.9, -0.2], hold: null, armF: [64, 30], headTilt: -8 }} />;

const CuLyleOrdered = () => <Shop from={CAM5.cuLyle} to={{ ...CAM5.cuLyle, zoom: 2.6 }} lyle={{ expr: "deadpan", look: [0.95, 0], twitch: 1 }} />;

const ClockInsert = () => {
  const { shot } = useEpisode();
  const m = 59 + Math.min(0.98, P(shot.local, 0, shot.end - shot.start) * 0.98);
  return <Shop from={{ ...CAM5.clock, zoom: 3.6 }} to={{ ...CAM5.clock, zoom: 4.6 }} set={{ clockMin: m }} />;
};

const CuMoDeserves = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const up = easeOut(P(l, 0.0, 0.3));
  const slam = easeIn(P(shot.t, T.deserves - 0.25, T.deserves));
  const head: Pt = [lerp(150, 60, up) + slam * 140, lerp(-8, -520, up) + slam * 512];
  const top: Pt = [lerp(100, 20, up), lerp(-292, -150, up) + slam * -150];
  const hitShake = shot.t > T.deserves && shot.t < T.deserves + 0.35 ? 12 : 3;
  return (
    <Shop
      from={{ ...CAM5.msMo, zoom: 1.5, y: CAM5.msMo.y - 60 }}
      to={{ ...CAM5.msMo, zoom: 1.75, y: CAM5.msMo.y - 70 }}
      mo={{ expr: "angry", look: [0.9, 0.1], mop: { head, top }, mopPhase: null, lean: 6 }}
      shakeAmp={hitShake}
      front={shot.t > T.deserves ? <Burst x={MO_POS.x - 150 - 140} y={MO_POS.y - 10} r={110} k={1 - P(shot.t, T.deserves + 0.2, T.deserves + 0.6)} color="#f2d24a" /> : null}
    />
  );
};

/** Silent punchline: Gerald raises his (decaf) cup in thanks; three grins wave back; lights out. */
const TailWide = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const raise = easeOutBack(P(l, 0.1, 0.5));
  const wave = Math.sin(l * 11) * 22;
  const lightsOut = l > 1.55;
  const mouthSeq = ["X", "B", "C", "E", "B", "D", "X"] as const;
  const mi = Math.floor(P(l, 0.5, 1.2) * (mouthSeq.length - 1));
  return (
    <Shop
      from={{ x: 780, y: 560, zoom: 0.9 }}
      to={{ x: 820, y: 560, zoom: 0.98 }}
      gerald={{ expr: "thankful", hold: "cup", cupLid: "decaf", cupName: "GERALD", armF: [lerp(64, 150, raise), lerp(30, 60, raise)], look: [0.9, -0.1], mouth: mouthSeq[mi] }}
      lyle={{ expr: "creepy", look: [-0.95, 0.1], armF: [150 + wave, -20] }}
      vern={{ expr: "creepy", look: [0.95, 0.1], armF: [150 + wave, -20], handF: "open" }}
      mo={{ expr: "smug", look: [0.95, 0.1], mop: false, armFree: [160 + wave, -20] }}
      set={{ geraldCup: false, closed: l > 1.2, dark: lightsOut ? 1 : 0, flicker: l > 1.2 && l < 1.55 ? 1 : 0.15 }}
      wash={lightsOut ? 0 : 0.16}
      front={
        lightsOut ? (
          <g>
            <rect x={-1500} y={-1000} width={5000} height={3000} fill="#030205" opacity={0.55} />
            <GlowEyes k={1} t={shot.t} />
          </g>
        ) : null
      }
    />
  );
};

/* ------------------------------------------------------------------ */

const cuL = (dy = 140) => ({ x: HEADS.lyle.x + 40, y: HEADS.lyle.y + dy });
const cuV = (dy = 140) => ({ x: HEADS.vern.x - 50, y: HEADS.vern.y + dy });
const cuM = (dy = 140) => ({ x: HEADS.mo.x - 30, y: HEADS.mo.y + dy });
const cuG = (dy = 140) => ({ x: HEADS.gerald.x + 50, y: HEADS.gerald.y + dy });
const cG = (dy = 140) => ({ x: C_HEADS.gerald.x + 50, y: C_HEADS.gerald.y + dy });
const cL = (dy = 140) => ({ x: C_HEADS.lyle.x - 40, y: C_HEADS.lyle.y + dy });

const raw: ShotDef[] = [
  // "What's wrong, man?"
  { name: "ext-open", start: 0, end: T.customer - 0.1, transition: "fade", grade: "night", render: () => <ExtOpen />, portrait: { x: 980, zoom: 0.92, y: 620 } },
  // "This customer came in two minutes before closing and ordered a coffee."
  { name: "two-customer", start: T.customer - 0.1, end: T.closing - 0.05, render: () => <TwoCustomer />, portrait: { x: "speaker", zoom: 1.35, y: 560 } },
  { name: "cu-gerald-waiting", start: T.closing - 0.05, end: T.brew - 0.06, render: () => <CuGeraldWaiting />, portrait: cuG() },
  // "Now I have to brew up a whole new pot even though I already cleaned the station."
  { name: "ms-lyle-brew", start: T.brew - 0.06, end: T.evenThough - 0.05, render: () => <MsLyleBrew />, portrait: { ...cuL(110), zoom: 1.1 } },
  { name: "station", start: T.evenThough - 0.05, end: T.stationEnd + 0.08, render: () => <Station />, portrait: { x: 1390, y: 520 } },
  // (sting) "Do you though?"
  { name: "cu-vern-though", start: T.stationEnd + 0.08, end: T.though + 0.85, render: () => <CuVernThough />, portrait: cuV() },
  { name: "cu-lyle-huh", start: T.though + 0.85, end: T.really - 0.08, render: () => <CuLyleHuh />, portrait: cuL() },
  // "Do you really?"
  { name: "ecu-vern-really", start: T.really - 0.08, end: T.what - 0.45, render: () => <EcuVernReally />, portrait: cuV(80) },
  // "What?"
  { name: "cu-lyle-what", start: T.what - 0.45, end: T.or - 0.08, render: () => <CuLyleWhat />, portrait: cuL() },
  // "Or... and hear me out..."
  { name: "two-hearmeout", start: T.or - 0.08, end: T.giveDecaf - 0.08, render: () => <TwoHearMeOut />, portrait: { x: (HEADS.lyle.x + HEADS.vern.x) / 2 + 10, zoom: 1.0, y: 600 } },
  // "...you give him decaf."
  { name: "ecu-vern-decaf", start: T.giveDecaf - 0.08, end: T.giveDecafEnd + 0.2, render: () => <EcuVernDecaf />, portrait: cuV(70) },
  { name: "cu-lyle-gasp", start: T.giveDecafEnd + 0.2, end: T.omg1 - 0.05, render: () => <CuLyleGasp />, portrait: cuL() },
  // "Oh my god."
  { name: "cu-vern-omg", start: T.omg1 - 0.05, end: T.wholePot - 0.06, render: () => <CuVernOmg />, portrait: cuV() },
  // "You've got a whole pot, right there."
  { name: "decaf-pot", start: T.wholePot - 0.06, end: T.cantTell - 0.15, render: () => <DecafPot />, portrait: { x: DECAF_POT[0] - 20, y: 560 } },
  // "And he can't tell the difference."
  { name: "cu-gerald-oblivious", start: T.cantTell - 0.15, end: T.notYet - 0.5, render: () => <CuGeraldOblivious />, portrait: cuG() },
  // "At least not yet."
  { name: "ecu-vern-notyet", start: T.notYet - 0.5, end: T.like - 0.18, render: () => <EcuVernNotYet />, portrait: cuV(70) },
  // "I like that. Thanks man."
  { name: "cu-lyle-like", start: T.like - 0.18, end: T.notDone - 0.25, render: () => <CuLyleLike />, portrait: cuL() },
  // "Oh we're not done."
  { name: "two-notdone", start: T.notDone - 0.25, end: T.nonono - 0.02, render: () => <TwoNotDone />, portrait: { x: "speaker", zoom: 1.35, y: 560 } },
  // "Oh, no, no, no, not by a long shot,"
  { name: "cu-vern-nonono", start: T.nonono - 0.02, end: T.because - 0.02, render: () => <CuVernNoNoNo />, portrait: cuV(160) },
  // "because..."
  { name: "ms-vern-because", start: T.because - 0.02, end: T.when1 - 0.05, render: () => <MsVernBecause />, portrait: { x: HEADS.vern.x - 40, y: HEADS.vern.y + 230, zoom: 0.95 } },
  // "...when he comes back tomorrow morning with"
  { name: "fut-morning-arrive", start: T.when1 - 0.05, end: T.headache - 0.03, render: () => <FutArrive tod="morning" title="TOMORROW MORNING" stage="morning" />, portrait: { x: (l) => lerp(GERALD_C.x - 300, C_HEADS.gerald.x + 20, easeOut(prog(l, 0, 1.8))), zoom: 1.05, y: 640 } },
  // "a headache, exhausted,"
  { name: "fut-morning-headache", start: T.headache - 0.03, end: T.groggy - 0.06, render: () => <FutMorningHeadache />, portrait: cG() },
  // "groggy, confused as to why,"
  { name: "fut-morning-groggy", start: T.groggy - 0.06, end: T.youKnow - 0.5, render: () => <FutMorningGroggy />, portrait: { ...cG(200), zoom: 0.95 } },
  // "you know what you do,"
  { name: "cu-vern-youknow", start: T.youKnow - 0.5, end: T.youKnowEnd + 0.42, render: () => <CuVernYouKnow />, portrait: cuV() },
  // (the pause)
  { name: "two-pause", start: T.youKnowEnd + 0.42, end: T.hitAgain - 0.02, render: () => <TwoPause />, portrait: { x: (l) => lerp(HEADS.lyle.x + 200, HEADS.mo.x - 40, easeInOut(prog(l, 0.2, 1.1))), zoom: 1.2, y: 640 } },
  // "you hit him again."
  { name: "fut-hit-again", start: T.hitAgain - 0.02, end: T.decafW - 1.0, render: () => <FutHitAgain />, transition: "slam", portrait: { x: CUP_C[0] + 60, y: CUP_C[1] - 100 } },
  // "Decaf." (whispered)
  { name: "ecu-vern-decaf2", start: T.decafW - 1.0, end: T.diabolical - 0.25, render: () => <EcuVernDecaf2 />, portrait: cuV(70) },
  // "Decaf is diabolical, man."
  { name: "ms-mo-diabolical", start: T.diabolical - 0.25, end: T.error - 0.06, render: () => <MsMoDiabolical />, portrait: { ...cuM(200), zoom: 0.95 } },
  // "Error 404, caffeine not found."
  { name: "fut-404", start: T.error - 0.06, end: T.omg2 - 1.0, transition: "static", grade: "none", render: () => <Fut404 />, portrait: { x: 1170, zoom: 0.92, y: 520 } },
  // "Oh, my God."
  { name: "cu-vern-giggle", start: T.omg2 - 1.0, end: T.cantTell2 - 0.08, render: () => <CuVernGiggle />, portrait: cuV() },
  // "He can't tell the difference,"
  { name: "fut-sip", start: T.cantTell2 - 0.08, end: T.notYet2 - 0.15, render: () => <FutSip />, portrait: cG() },
  // "at least not yet."
  { name: "ecu-vern-notyet2", start: T.notYet2 - 0.15, end: T.thank - 0.02, render: () => <EcuVernNotYet2 />, portrait: cuV(70) },
  // "He'll probably thank you as you"
  { name: "fut-thankyou", start: T.thank - 0.02, end: T.serve - 0.1, render: () => <FutThankYou />, portrait: { x: (l) => lerp(C_HEADS.gerald.x + 60, C_HEADS.gerald.x + 120, prog(l, 0, 3)), zoom: 1.1, y: 640 } },
  // "serve it with a smile."
  { name: "fut-smile", start: T.serve - 0.1, end: T.messed - 0.22, render: () => <FutSmile />, portrait: cL(80) },
  // "It's messed up, I love it."
  { name: "cu-lyle-love", start: T.messed - 0.22, end: T.wrongYou - 0.04, render: () => <CuLyleLove />, portrait: cuL() },
  // "What's wrong with you?"
  { name: "cu-mo-wrong", start: T.wrongYou - 0.04, end: T.stop - 0.01, render: () => <CuMoWrong />, portrait: cuM() },
  // "But it doesn't stop there."
  { name: "cu-vern-stop", start: T.stop - 0.01, end: T.because2 - 1.2, render: () => <CuVernStop />, portrait: cuV(150) },
  // "Because when he comes back..."
  { name: "pan-to-gerald", start: T.because2 - 1.2, end: T.following - 0.25, render: () => <PanToGerald />, portrait: { x: (l) => lerp(HEADS.vern.x - 60, HEADS.gerald.x + 60, easeInOut(prog(l, 1.0, 2.8))), zoom: 1.0, y: 640 } },
  // "...the following afternoon,"
  { name: "fut-afternoon-arrive", start: T.following - 0.25, end: T.headaches - 0.05, render: () => <FutArrive tod="afternoon" title="THE FOLLOWING AFTERNOON" stage="afternoon" />, portrait: { x: (l) => lerp(GERALD_C.x - 300, C_HEADS.gerald.x + 20, easeOut(prog(l, 0, 1.8))), zoom: 1.05, y: 640 } },
  // "headaches, sleep deprived."
  { name: "fut-afternoon-cu", start: T.headaches - 0.05, end: T.hobbies - 0.05, render: () => <FutAfternoonCu />, portrait: cG() },
  // "Y'all need hobbies, man."
  { name: "ms-mo-hobbies", start: T.hobbies - 0.05, end: T.hit2 - 0.1, render: () => <MsMoHobbies />, portrait: { ...cuM(220), zoom: 0.95 } },
  // "Hit him again."
  { name: "cu-vern-hit", start: T.hit2 - 0.1, end: T.hit2 + 1.3, render: () => <CuVernHit />, portrait: cuV(150) },
  // (silence: Lyle pours tonight's cup)
  { name: "present-pour", start: T.hit2 + 1.3, end: T.baby - 0.06, render: () => <PresentPour />, portrait: { x: CUP_C[0] + 70, y: CUP_C[1] - 100 } },
  // "Decaf, baby."
  { name: "ecu-vern-baby", start: T.baby - 0.06, end: T.messed2 - 0.08, render: () => <EcuVernBaby />, portrait: cuV(70) },
  // "Y'all are messed up."
  { name: "cu-mo-messed", start: T.messed2 - 0.08, end: T.calling - 0.03, render: () => <CuMoMessed />, portrait: cuM() },
  // "He'll probably start calling you out of work thinking he's suffering a terrible health crisis,"
  { name: "bed-sickcall", start: T.calling - 0.03, end: T.migraines - 0.05, render: () => <BedSickCall />, portrait: { x: 520, zoom: 1.0, y: 560 } },
  // "migraines,"
  { name: "bed-migraine", start: T.migraines - 0.05, end: T.something - 0.06, render: () => <BedMigraine />, portrait: { x: 500, y: 470 } },
  // "something you can't quite explain."
  { name: "bed-laptop", start: T.something - 0.06, end: T.illegal - 0.35, render: () => <BedLaptop />, portrait: { x: 836, y: 680 } },
  // "That sounds illegal."
  { name: "cu-lyle-illegal", start: T.illegal - 0.35, end: T.keepGiving - 0.25, render: () => <CuLyleIllegal />, portrait: cuL() },
  // "And you just keep giving him decaf."
  { name: "montage", start: T.keepGiving - 0.25, end: T.beautiful - 0.3, render: () => <Montage />, portrait: { x: (l) => lerp(C_HEADS.gerald.x + 80, CUP_C[0] + 40, 0.5 + 0.5 * Math.sin(l * 1.2)), zoom: 1.0, y: 620 } },
  // "It's beautiful."
  { name: "cu-vern-beautiful", start: T.beautiful - 0.3, end: T.until - 0.45, render: () => <CuVernBeautiful />, portrait: cuV() },
  // "Until eventually his body acclimates."
  { name: "fut-acclimate", start: T.until - 0.45, end: T.acclimatesEnd + 0.25, render: () => <FutAcclimate />, portrait: { ...cG(80), zoom: 0.85 } },
  // (peaceful lullaby) "And he starts sleeping peacefully."
  { name: "bed-sleeping", start: T.acclimatesEnd + 0.25, end: T.sleeping - 0.15, transition: "fade", render: () => <BedSleeping />, portrait: { x: (l) => lerp(760, 600, easeInOut(prog(l, 0, 2.2))), zoom: 1.0, y: 640 } },
  { name: "bed-sleeping-close", start: T.sleeping - 0.15, end: T.sleepingEnd + 0.42, render: () => <BedSleepingClose />, portrait: { x: 560, y: 640 } },
  // (dramatic pause)
  { name: "cu-vern-pause", start: T.sleepingEnd + 0.42, end: T.why + 0.2, render: () => <CuVernPause />, portrait: cuV(170) },
  // "Why? Why are you paused dramatically like that?"
  { name: "ms-mo-why", start: T.why + 0.2, end: T.knowWhat - 0.1, render: () => <MsMoWhy />, portrait: { ...cuM(220), zoom: 0.95 } },
  // "You know what to do, don't you?"
  { name: "ecu-vern-know", start: T.knowWhat - 0.1, end: T.knowWhatEnd - 0.35, render: () => <EcuVernKnow />, portrait: cuV(90) },
  // (realisation) "Then I give him regular."
  { name: "cu-lyle-regular", start: T.knowWhatEnd - 0.35, end: T.goddamn - 0.06, render: () => <CuLyleRegular />, portrait: cuL(90) },
  // "You're goddamn right you do."
  { name: "low-vern-goddamn", start: T.goddamn - 0.06, end: T.extraShot - 0.05, transition: "redflash", grade: "hell", render: () => <LowVernGoddamn />, portrait: { x: HEADS.vern.x - 50, y: HEADS.vern.y + 200 } },
  // "and throw in an extra shot on top, a little red eye,"
  { name: "fut-redeye", start: T.extraShot - 0.05, end: T.loyal - 0.05, render: () => <FutRedEye />, portrait: { x: CUP_C[0] + 40, y: CUP_C[1] - 90 } },
  // "for being a loyal customer"
  { name: "fut-loyalty", start: T.loyal - 0.05, end: T.insomnia - 0.02, render: () => <FutLoyalty />, portrait: { x: 930, zoom: 1.0, y: 620 } },
  // "you have insomnia"
  { name: "cu-mo-insomnia", start: T.insomnia - 0.02, end: T.jetFuel - 0.02, render: () => <CuMoInsomnia />, portrait: cuM() },
  // "talk about jet fuel,"
  { name: "fut-jetfuel", start: T.jetFuel - 0.02, end: T.heartRate - 0.05, render: () => <FutJetFuel />, portrait: { x: C_HEADS.gerald.x + 10, y: C_HEADS.gerald.y + 110, zoom: 1.15 } },
  // "that heart rate will be popping"
  { name: "bed-heart", start: T.heartRate - 0.05, end: T.nah - 0.04, render: () => <BedHeart />, portrait: { x: 600, y: 520 } },
  // "nah, but what did this guy do to deserve this, man?"
  { name: "ms-mo-deserve", start: T.nah - 0.04, end: T.thisGuy + 0.75, render: () => <MsMoDeserve />, portrait: { ...cuM(220), zoom: 0.95 } },
  { name: "cu-gerald-innocent", start: T.thisGuy + 0.75, end: T.ordered + 0.1, render: () => <CuGeraldInnocent />, portrait: cuG() },
  // "he ordered a coffee right before closing"
  { name: "cu-lyle-ordered", start: T.ordered + 0.1, end: T.rightBefore - 0.05, render: () => <CuLyleOrdered />, portrait: cuL() },
  { name: "clock-insert", start: T.rightBefore - 0.05, end: T.gets + 0.1, render: () => <ClockInsert />, portrait: { x: 1440, y: 186 } },
  // "he gets what he fucking deserves"
  { name: "cu-mo-deserves", start: T.gets + 0.1, end: T.end - 0.15, render: () => <CuMoDeserves />, portrait: { x: HEADS.mo.x - 90, y: HEADS.mo.y + 120, zoom: 1.0 } },
  // the silent punchline
  { name: "tail-wide", start: T.end - 0.15, end: 999, render: () => <TailWide />, portrait: { x: (l) => lerp(HEADS.gerald.x + 120, 900, easeInOut(prog(l, 0.6, 1.5))), zoom: 1.22, y: 620 } },
];

/** warm tungsten grade by default; cutaways set their own */
export const shots: ShotDef[] = raw.map((s) => ({ ...s, grade: s.grade ?? "night" }));

