import { useEpisode } from "../../engine/context";
import type { ShotDef } from "../../engine/EpisodePlayer";
import type { Cam } from "../../engine/Stage";
import { cue, MouthShape, Timeline } from "../../engine/timeline";
import { clamp, easeIn, easeInOut, easeOut, easeOutBack, lerp, prog } from "../../engine/util";
import type { LyleProps } from "./cast/Goat";
import { Hyena } from "./cast/Hyena";
import type { DuaneProps } from "./cast/Hyena";
import { DogsScene, EXT, ExteriorScene, FamilyPhotos, GymScene } from "./cutaways";
import { CAM7, CLOCK, DUANE_POS, HEADS, JAR, LYLE_POS, MoveOutJar, RoomScene, RoomState, useSpeech } from "./livingroom";
import timelineJson from "./timeline.json";

/**
 * EPISODE 007 — "What's the Move?"
 * 3 AM in Mama's living room. Duane (hyena, 45 today) keeps asking what's the move; Lyle (goat) is going home,
 * and on the way out he roasts him to a beat and moonwalks into the night.
 * Shot times are anchored to the words with cue(); the dance is locked to the music bed (~100 BPM from 22.9 s).
 */
const tl = timelineJson as Timeline;
const at = (phrase: string, opts?: Parameters<typeof cue>[2]) => cue(tl, phrase, opts);

export const TAIL = 3.6;

const T = {
  move2: at("what's the move", { after: 2 }),
  its3: at("it's 3"),
  am: at("3 a.m."),
  home1: at("i'm going home"),
  home1End: at("i'm going home", { edge: "end" }),
  come: at("come on bro"),
  likeWhat: at("like what"),
  likeWhatEnd: at("like what", { edge: "end" }),
  tired: at("tired"),
  exhausted: at("exhausted"),
  sweaty: at("sweaty"),
  home2: at("i'm going home buddy"),
  late: at("it's late"),
  lateEnd: at("it's late", { edge: "end" }),
  brother: at("brother"),
  brotherEnd: at("brother", { edge: "end" }),
  young: at("the night's still young"),
  bitch: at("don't be a bitch"),
  bitchEnd: at("don't be a bitch", { edge: "end" }),
  ohDear: at("Oh dear"),
  notYoung: at("you know what's not young"),
  notYoungEnd: at("what's not young", { edge: "end" }),
  you: at("You", { after: 27 }),
  youEnd: at("You", { after: 27, edge: "end" }),
  family: at("Ain't it time to start"),
  familyEnd: at("start a family", { edge: "end" }),
  fun: at("Bro I'm just trying"),
  funEnd: at("to have fun", { edge: "end" }),
  capital: at("You'll need to try"),
  capitalWord: at("capital"),
  capitalEnd: at("capital", { edge: "end" }),
  old: at("You old at 3am"),
  asking: at("asking what's the move"),
  askingEnd: at("asking what's the move", { edge: "end" }),
  mama: at("Move out your mama's"),
  mamas: at("mama's house"),
  mamaEnd: at("mama's house", { edge: "end" }),
  weight: at("Move some weight"),
  weightWord: at("weight"),
  bitches: at("Move some bitches"),
  hyuk: at("Ah-hyuk"),
  hyuk3: at("Ah-hyuk", { after: 48 }),
  ooh: at("Ooh"),
  whatsMove: at("what's the move", { after: 50 }),
  whatsMoveEnd: at("what's the move", { after: 50, edge: "end" }),
  outOfWay: at("Move out of my way"),
  goHome: at("so I can go home"),
  sleep: at("sleep"),
  hyukEnd: at("Ah-hyuk", { after: 54 }),
  last: at("Ah-hyuk", { after: 54, edge: "end" }),
  end: tl.duration,
};

/* ------------------------------------------------------------------ */
/* The music bed and the clock-driven world                            */
/* ------------------------------------------------------------------ */

/** the beat drops when Lyle flips the disco switch */
const DROP = 22.5;
const BEAT0 = 22.89;
const SPB = 0.6;
const MUSIC_OUT = 58.4;
const beatOf = (t: number) => Math.max(0, (t - BEAT0) / SPB);
const partyAt = (t: number) => (t < DROP ? 0 : t < MUSIC_OUT ? 1 : clamp(1 - (t - MUSIC_OUT) / 2.2));

const ROOM = "saturate(0.88) contrast(1.08) brightness(0.96) sepia(0.06)";
const PARTY = "saturate(1.1) contrast(1.12) brightness(0.96)";
const FANTASY = "sepia(0.3) saturate(1.5) hue-rotate(-12deg) contrast(1.12) brightness(1.02)";
const TAILG = "saturate(0.8) contrast(1.1) brightness(0.9) sepia(0.08)";

const DOOR_OPEN = T.sleep - 0.1;
const DOOR_SLAM = 56.95;

const setAt = (t: number): Partial<RoomState> => ({
  party: partyAt(t),
  beat: beatOf(t),
  fan: t < DROP ? 0.18 : t < MUSIC_OUT ? 1.4 : lerp(1.4, 0.12, prog(t, MUSIC_OUT, 61)),
  switchOn: t >= DROP - 0.12,
  door: t < DOOR_OPEN ? 0 : t < DOOR_SLAM ? easeOut(prog(t, DOOR_OPEN, DOOR_OPEN + 0.5)) : 1 - easeIn(prog(t, DOOR_SLAM, DOOR_SLAM + 0.12)),
  hall: (t >= T.mamas && t < T.weight - 0.2) || t >= T.end + 2.1 ? 1 : 0,
  minutes: (t / 61) * 3,
  candles: t < T.you + 0.12 ? 1 : 0,
  portraitLook: t < DROP ? [0.8, 0.4] : t < T.end ? [1, 0.2] : [0.7, 0.8],
  portraitSquint: t > T.end ? 1 : 0,
});

/** Duane's slow deflation: the hat droops, he sinks into the plastic */
const duaneAt = (t: number): Partial<DuaneProps> => ({
  hatTilt: t < T.you ? 0 : t < T.end ? 18 : 30,
  slump: t < T.you ? 0 : t < T.end ? 0.35 : 0.7,
});

/** dance on the beat (body coords, Lyle faces left = forward) */
function groove(t: number, k = 1): Partial<LyleProps> {
  const b = beatOf(t);
  const bounce = 0.5 + 0.5 * Math.cos(b * Math.PI * 2);
  const side = Math.sin(b * Math.PI);
  return {
    crouch: 6 + bounce * 24 * k,
    sway: side * 18 * k,
    lean: 6 + bounce * 4 * k,
    headTilt: side * 8 * k,
    beardSwing: -side * 10 * k,
    footF: [34 + side * 10 * k, -30],
    footB: [-30 + side * 10 * k, -30],
    heelF: side > 0.5 ? (side - 0.5) * 2 * k : 0,
    heelB: side < -0.5 ? (-side - 0.5) * 2 * k : 0,
    armF: [40 + side * 34 * k, 70 + bounce * 24 * k],
    armB: [-30 + side * 30 * k, 64 + bounce * 22 * k],
    sweat: 0.8,
  };
}

/** moonwalk feet: one hoof slides back flat while the other sits on its toe, then swap */
function moonwalk(l: number, stepT = 0.42): Partial<LyleProps> {
  const ph = (l / stepT) % 1;
  const odd = Math.floor(l / stepT) % 2 === 1;
  const a = lerp(34, -36, ph);
  const b = lerp(-30, 22, ph) * 0.6;
  return odd ? { footF: [b, -30], heelF: 1, footB: [a, -30], heelB: 0 } : { footF: [a, -30], heelF: 0, footB: [b, -30], heelB: 1 };
}

const walkFeet = (l: number, speed = 8): Partial<DuaneProps> => ({
  footF: [34 + Math.sin(l * speed) * 22, -12 - Math.max(0, Math.sin(l * speed)) * 12],
  footB: [-30 - Math.sin(l * speed) * 22, -12 - Math.max(0, -Math.sin(l * speed)) * 12],
});

/** Duane's silent "...what's the move?" */
const SILENT: Array<[number, MouthShape]> = [
  [0, "F"],
  [0.1, "D"],
  [0.22, "C"],
  [0.3, "B"],
  [0.38, "H"],
  [0.46, "C"],
  [0.56, "A"],
  [0.64, "F"],
  [0.78, "G"],
  [0.9, "X"],
];
const silentMouth = (l: number): MouthShape => {
  let m: MouthShape = "X";
  for (const [dt, s] of SILENT) if (l >= dt) m = s;
  return m;
};

/* ------------------------------------------------------------------ */
/* Scene wrapper: the room with everyone where they belong at time t    */
/* ------------------------------------------------------------------ */

const Room: React.FC<{
  from: Cam;
  to?: Cam;
  cam?: Cam;
  ease?: (x: number) => number;
  duane?: Partial<DuaneProps> | false;
  lyle?: Partial<LyleProps> | false;
  mama?: Parameters<typeof RoomScene>[0]["mama"];
  set?: Partial<RoomState>;
  shakeAmp?: number;
  mid?: React.ReactNode;
  front?: React.ReactNode;
  lyleBehind?: boolean;
}> = ({ from, to, cam, ease, duane = {}, lyle = {}, mama = false, set = {}, shakeAmp, mid, front, lyleBehind }) => {
  const { shot } = useEpisode();
  const t = shot.t;
  return (
    <RoomScene
      from={from}
      to={to}
      cam={cam}
      ease={ease}
      duane={duane === false ? false : { ...duaneAt(t), ...duane }}
      lyle={lyle === false ? false : { sweat: 0.5, ...(t >= DROP && t < T.outOfWay ? groove(t, 0.6) : {}), ...lyle }}
      mama={mama}
      set={{ ...setAt(t), ...set }}
      shakeAmp={shakeAmp}
      mid={mid}
      front={front}
      lyleBehind={lyleBehind}
    />
  );
};

const P = (t: number, a: number, b: number) => prog(t, a, b);

/* ------------------------------------------------------------------ */
/* Shots                                                               */
/* ------------------------------------------------------------------ */

// "Yo, so what's the move?" (from inside the house)
const ExtOpen = () => <ExteriorScene from={{ x: 980, y: 560, zoom: 0.9 }} to={{ x: 650, y: 600, zoom: 1.42 }} inside="both" />;

const WideRoom = () => {
  const { shot } = useEpisode();
  const pat = Math.sin(shot.local * 16) * 10;
  return (
    <Room
      from={{ x: 1000, y: 560, zoom: 0.96 }}
      to={{ x: 1020, y: 560, zoom: 1.0 }}
      duane={{ expr: "hopeful", look: [0.9, -0.3], armF: [60, 110] }}
      lyle={{ expr: "deadpan", look: [0.2, 0.9], armB: [30 + pat, 80], armF: [12, 24], keys: "B" }}
    />
  );
};

// "What's the move?"
const CuDuaneMove2 = () => <Room from={CAM7.cuDuane} to={{ ...CAM7.cuDuane, zoom: 2.7 }} duane={{ expr: "hopeful", look: [0.9, -0.3], headTilt: 6, armF: [34, 92] }} />;

// "It's 3 a.m."
const CuLyle3am = () => {
  const { shot } = useEpisode();
  const k = easeOut(P(shot.t, T.its3 + 0.1, T.its3 + 0.4));
  return <Room from={CAM7.cuLyle} to={{ ...CAM7.cuLyle, zoom: 2.55 }} lyle={{ expr: "deadpan", look: [0.6, -0.8], headTilt: -6, armF: [lerp(10, 124, k), lerp(20, 14, k)] }} />;
};

const Clock3am = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const pop = l < 0.08 ? 0 : 0.55 + 0.45 * Math.abs(Math.sin((l - 0.08) * 9.5));
  return <Room from={CAM7.clock} to={{ ...CAM7.clock, zoom: 3.7 }} set={{ cuckoo: l > 0.9 ? Math.max(0, 1 - (l - 0.9) * 6) * pop : pop }} />;
};

const MsLyleKeys = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  return <Room from={CAM7.msLyle} to={{ ...CAM7.msLyle, x: CAM7.msLyle.x + 40, zoom: 1.7 }} lyle={{ expr: l > 0.6 ? "smug" : "deadpan", look: [-0.9, -0.1], headTilt: -8, armB: [100, 70], keys: "B", keysSpin: shot.t * 900 }} />;
};

// "Come on bro, don't be like that."
const CuDuaneComeOn = () => {
  const { shot } = useEpisode();
  const k = easeOut(P(shot.t, T.come - 0.05, T.come + 0.35));
  return <Room from={CAM7.cuDuane} to={{ ...CAM7.cuDuane, zoom: 2.75, x: CAM7.cuDuane.x + 20 }} duane={{ expr: "whiny", look: [0.9, -0.2], lean: k * 10, armB: [lerp(-10, 80, k), lerp(40, 30, k)], headTilt: 8 }} set={{ squeak: P(shot.t, T.come - 0.05, T.come + 0.1) * (1 - P(shot.t, T.come + 0.3, T.come + 0.5)) }} />;
};

// "Like what?" — and the grin creeps back in the pause
const CuLyleLikeWhat = () => {
  const { shot } = useEpisode();
  const turn = easeInOut(P(shot.local, 0, 0.5));
  return <Room from={CAM7.cuLyle} to={{ ...CAM7.cuLyle, zoom: 2.6 }} lyle={{ expr: shot.t > T.likeWhatEnd + 0.15 ? "grin" : "smug", look: [lerp(-0.6, 0.9, turn), 0.2], headTilt: lerp(-12, 6, turn) }} />;
};

// "Tired? Exhausted?"
const MsLyleTired = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const tired = easeInOut(P(t, T.tired, T.tired + 0.35));
  const ex = easeOutBack(P(t, T.exhausted, T.exhausted + 0.35));
  return (
    <Room
      from={CAM7.fullLyle}
      to={{ ...CAM7.fullLyle, zoom: 1.32 }}
      lyle={{
        expr: t > T.tired - 0.05 ? "tired" : "grin",
        look: [0.6, 0.3],
        slump: tired * 0.4,
        crouch: ex * 46,
        lean: 4 + ex * 18,
        headTilt: tired * 8 + ex * 12,
        armF: [lerp(8, -4, ex), lerp(18, 4, ex)],
        armB: [lerp(-6, 8, ex), lerp(12, 4, ex)],
        footF: [30 + ex * 20, -30],
        footB: [-26 - ex * 20, -30],
        sweat: 0.8,
      }}
    />
  );
};

// "Sweaty?" — the arm goes up
const PitSweaty = () => {
  const { shot } = useEpisode();
  const up = easeOutBack(P(shot.local, 0, 0.25));
  return (
    <Room
      from={{ x: 1318, y: 470, zoom: 1.95 }}
      to={{ x: 1322, y: 462, zoom: 2.25 }}
      lyle={{ expr: "smug", look: [0.9, 0], armF: [lerp(10, 150, up), lerp(20, 34, up)], pitReveal: up, sweat: 1, headTilt: -10 }}
    />
  );
};

// "I'm going home, buddy. It's late."
const TwoHome = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const pat = t > T.home2 + 0.3 && t < T.late ? Math.sin((t - T.home2) * 12) * 12 : 0;
  const tap = t > T.late ? Math.abs(Math.sin((t - T.late) * 14)) * 14 : 0;
  return (
    <Room
      from={CAM7.two}
      to={{ ...CAM7.two, zoom: 1.4 }}
      duane={{ expr: "whiny", look: [0.9, -0.3], lean: 8, armB: [86, 20] }}
      lyle={{ expr: "deadpan", look: [0.9, 0.2], armF: t < T.late ? [70 + pat, 40] : [50, 96 + tap], armB: t >= T.late ? [56, 92] : [-6, 12], keys: "B" }}
    />
  );
};

// "Brother," ... (a long desperate swig)
const CuDuaneBrother = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const sip = easeInOut(P(t, T.brotherEnd + 0.08, T.brotherEnd + 0.3)) * (1 - easeInOut(P(t, T.young - 0.18, T.young - 0.02)));
  return <Room from={{ ...CAM7.cuDuane, zoom: 2.4 }} to={{ ...CAM7.cuDuane, zoom: 2.6 }} duane={{ expr: sip > 0.3 ? "sad" : "whiny", look: [0.9, -0.3], sip, headTilt: 4 }} />;
};

// "the night's still young. Don't be a bitch."
const EcuDuaneYoung = () => {
  const { shot } = useEpisode();
  return <Room from={CAM7.cuDuane} to={CAM7.ecuDuane} ease={easeIn} duane={{ expr: shot.t > T.bitch ? "annoyed" : "whiny", look: [0.9, -0.2], headTilt: shot.t > T.bitch ? -6 : 8 }} />;
};

// (silence) the grin spreads; a hoof finds the switch
const CuLyleGrin = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const g = P(l, 0.25, 0.6);
  return (
    <Room
      from={{ ...CAM7.cuLyle, zoom: 2.4 }}
      to={{ ...CAM7.cuLyle, zoom: 3.1, y: CAM7.cuLyle.y - 10 }}
      ease={easeIn}
      lyle={{ expr: g < 0.3 ? "deadpan" : g < 0.8 ? "sly" : "wide", look: [l < 0.7 ? 0.9 : -0.9, l < 0.7 ? 0.2 : 0], headTilt: lerp(0, -10, g), armB: [lerp(-6, -70, g), lerp(12, -40, g)] }}
    />
  );
};

// THE DROP: disco ball, lights, Lyle strikes a pose
const WideDrop = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const pose = l < 0.5;
  return (
    <Room
      from={{ x: 1060, y: 560, zoom: 1.0 }}
      to={{ x: 1080, y: 560, zoom: 1.08 }}
      shakeAmp={l < 0.3 ? 10 * (1 - l / 0.3) : 0}
      duane={{ expr: "shocked", look: [0.9, -0.4], armF: [60, 100] }}
      lyle={pose ? { expr: "wide", armF: [165, -20], armB: [-150, 30], crouch: 30, footF: [70, -30], footB: [-64, -30], heelB: 1, lean: -6, headTilt: -10 } : { expr: "grin" }}
    />
  );
};

// "Oh dear," (mock pity, hoof to cheek)
const MsLyleOhDear = () => (
  <Room from={CAM7.fullLyle} to={{ ...CAM7.fullLyle, zoom: 1.34 }} lyle={{ expr: "pity", look: [0.9, 0.3], armF: [40, 157], headTilt: 14 }} />
);

// "you know what's not young?"
const TwoNotYoung = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const b = beatOf(t);
  const wag = Math.sin(b * Math.PI * 4) * 22;
  const lean = easeInOut(P(t, T.notYoung - 0.2, T.notYoung + 0.3));
  return (
    <Room
      from={{ x: 1110, y: 560, zoom: 1.34 }}
      to={{ x: 1090, y: 560, zoom: 1.42 }}
      duane={{ expr: "bored", look: [0.9, -0.3] }}
      lyle={{ x: lerp(LYLE_POS.x, LYLE_POS.x - 90, lean), expr: t > T.notYoungEnd ? "grin" : "smug", look: [0.9, 0.5], lean: 8 + lean * 12, armF: [118, 40 + wag], headTilt: 6 }}
    />
  );
};

// "YOU!"
const CuLyleYou = () => {
  const { shot } = useEpisode();
  const k = easeOutBack(P(shot.local, 0, 0.14));
  return (
    <Room
      from={{ x: HEADS.lyle.x - 150, y: HEADS.lyle.y + 70, zoom: 2.2 }}
      to={{ x: HEADS.lyle.x - 150, y: HEADS.lyle.y + 70, zoom: 2.45 }}
      shakeAmp={shot.local < 0.35 ? 8 : 0}
      lyle={{ x: LYLE_POS.x - 90, expr: "wide", look: [1, 0.4], lean: 20, armF: [lerp(40, 98, k), lerp(70, 0, k)], headTilt: -4 }}
    />
  );
};

// the candles go out; so does Duane
const MsDuaneHurt = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0, 0.5));
  return <Room from={{ x: 790, y: 590, zoom: 1.55 }} to={{ x: 800, y: 584, zoom: 1.68 }} duane={{ expr: "hurt", look: [0.6, 0.6], headTilt: lerp(0, 10, k), hatTilt: lerp(0, 22, k) }} lyle={false} />;
};

// "Bro, I'm just trying to have fun." + the saddest party blower
const CuDuaneFun = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const blow = easeOut(P(t, T.funEnd + 0.06, T.funEnd + 0.28));
  const droop = easeInOut(P(t, T.funEnd + 0.3, T.funEnd + 0.55));
  return <Room from={CAM7.cuDuane} to={{ ...CAM7.cuDuane, zoom: 2.7 }} duane={{ expr: blow > 0 ? "sad" : "whiny", look: [0.9, -0.2], headTilt: 6, blow: blow > 0 ? blow * 0.85 : 0, blowDroop: droop }} lyle={false} />;
};

// "You'll need to try to acquire some..." (money hooves)
const MsLyleCapital = () => {
  const { shot } = useEpisode();
  const rub = Math.sin(shot.t * 22) * 8;
  return <Room from={CAM7.fullLyle} to={{ ...CAM7.fullLyle, zoom: 1.32 }} lyle={{ expr: "smug", look: [0.9, 0.3], armF: [56, 78 + rub], armB: [48, 86 - rub] }} />;
};

// "...capital." The MOVE OUT FUND. A moth.
const JarCapital = () => {
  const { shot } = useEpisode();
  const moth = P(shot.t, T.capitalEnd + 0.05, T.capitalEnd + 0.9);
  return <Room from={{ x: JAR.x - 10, y: JAR.y - 40, zoom: 5.0 }} to={{ x: JAR.x - 10, y: JAR.y - 46, zoom: 5.5 }} front={moth > 0 ? <MoveOutJar t={shot.t} moth={moth} /> : null} />;
};

// "You old at 3 a.m. asking what's the move." — the impression
const TwoImpression = () => {
  const { shot } = useEpisode();
  const s = easeInOut(P(shot.t, T.old - 0.05, T.old + 0.4));
  return (
    <Room
      from={{ x: 1110, y: 560, zoom: 1.3 }}
      to={{ x: 1130, y: 560, zoom: 1.38 }}
      duane={{ expr: "annoyed", look: [0.9, -0.2] }}
      lyle={{ expr: s > 0.5 ? "mock" : "grin", slump: s, hat: s > 0.3, can: s > 0.3, armF: [lerp(40, 26, s), lerp(70, 84, s)], armB: [lerp(-30, -8, s), lerp(64, 14, s)], crouch: 6, sway: 0, headTilt: s * 12, look: [0.4, 0.6] }}
    />
  );
};

const CuLyleImpression = () => {
  const { shot } = useEpisode();
  const out = easeInOut(P(shot.t, T.askingEnd + 0.4, T.askingEnd + 0.8));
  const s = 1 - out;
  const hx = HEADS.lyle.x - 26 * s;
  const hy = HEADS.lyle.y + 34 * s;
  return (
    <Room
      from={{ x: hx - 20, y: hy + 40, zoom: 2.5 }}
      to={{ x: hx - 20, y: hy + 30, zoom: 2.7 }}
      lyle={{ expr: s > 0.5 ? "mock" : "grin", slump: s, hat: s > 0.4, can: s > 0.4, armF: [26, 84], armB: [-8, 14], crouch: 6, sway: 0, headTilt: s * 12 + Math.sin(shot.t * 3) * 3, look: [0.4, 0.6] }}
    />
  );
};

// "Move out your..." (points down the hall)
const MsLyleMama = () => {
  const { shot } = useEpisode();
  const k = easeOutBack(P(shot.local, 0, 0.18));
  return <Room from={CAM7.msLyle} to={{ ...CAM7.msLyle, x: CAM7.msLyle.x - 60, zoom: 1.66 }} lyle={{ expr: "wide", look: [1, 0], lean: 14, armF: [lerp(40, 100, k), lerp(70, 0, k)], footF: [80, -30], footB: [-40, -30], heelB: 1, crouch: 20 }} />;
};

// "...mama's house!" — she's been there the whole time
/** two eyes in the dark hallway before the light clicks on */
const DarkEyes: React.FC<{ on: boolean }> = ({ on }) =>
  on ? (
    <g style={{ mixBlendMode: "screen" }}>
      <circle cx={170} cy={498} r={11} fill="#fff27a" opacity={0.35} />
      <circle cx={194} cy={500} r={12} fill="#fff27a" opacity={0.35} />
      <circle cx={170} cy={498} r={4} fill="#fffbd0" />
      <circle cx={194} cy={500} r={4.5} fill="#fffbd0" />
      <circle cx={292} cy={540} r={5} fill="#ff7a3a" />
    </g>
  ) : null;

const HallMama = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const lit = l > 0.24;
  const ashFall = P(l, 1.05, 1.3);
  return (
    <Room
      from={CAM7.hall}
      to={{ ...CAM7.hall, zoom: 1.75, y: CAM7.hall.y - 40 }}
      set={{ hall: lit ? 1 : 0 }}
      mama={lit ? { expr: "glare", look: [l < 0.9 ? 0.2 : 0.95, l < 0.9 ? 0.1 : 0.4], ash: ashFall > 0 ? 0.05 : 0.95 } : false}
      front={
        <>
          <DarkEyes on={!lit} />
          {ashFall > 0 && ashFall < 1 ? <path d={`M${240},${470 + ashFall * 420} l26,4`} stroke="#9a9a96" strokeWidth={9} strokeLinecap="round" /> : null}
        </>
      }
    />
  );
};

// "Move some..." (curls)
const MsLyleWeight = () => {
  const { shot } = useEpisode();
  const pump = 0.5 + 0.5 * Math.sin(shot.t * 14);
  return <Room from={CAM7.fullLyle} to={{ ...CAM7.fullLyle, zoom: 1.3 }} lyle={{ expr: "wide", look: [0.9, 0.3], armF: [24, 20 + pump * 120], armB: [20, 20 + (1 - pump) * 120], crouch: 30 }} />;
};

// "...weight!" — the garage gym
const GymWeight = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const give = P(l, 1.25, 1.45);
  const curl = give > 0 ? lerp(56, 6, easeIn(give)) : 10 + easeOut(P(l, 0.1, 1.2)) * 46 + Math.sin(l * 40) * 3;
  return (
    <GymScene
      duane={{
        expr: give > 0.5 ? "sad" : "strain",
        strain: give > 0.5 ? 0.3 : clamp(l / 0.6),
        armF: [10 + curl * 0.15, curl],
        armB: [-6, 12],
        lean: give * 10,
        look: [0.5, 0.6],
      }}
    />
  );
};

// "Ah-hyuk! Ah-hyuk!"
const CuLyleHyuk = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const hb = 0.45 + 0.4 * Math.abs(Math.sin((t - T.hyuk) * Math.PI * 1.8));
  return <Room from={CAM7.cuLyle} to={{ ...CAM7.cuLyle, zoom: 2.6, y: CAM7.cuLyle.y - 20 }} duane={false} lyle={{ expr: "laugh", headBack: hb, beardSwing: Math.sin(t * 20) * 12, armF: [30, 40], crouch: 10 }} />;
};

/** Duane's walk to the front door (he got off the couch during the laughing fit) */
const DUANE_WALK = { t0: 48.0, t1: 50.2, x0: 1540, x1: 1650 };
const duaneWalkX = (t: number) => lerp(DUANE_WALK.x0, DUANE_WALK.x1, easeInOut(P(t, DUANE_WALK.t0, DUANE_WALK.t1)));

const WideHyuk = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const slap = Math.abs(Math.sin(t * 9));
  const walking = t > DUANE_WALK.t0 && t < DUANE_WALK.t1;
  return (
    <Room
      from={{ x: 1180, y: 560, zoom: 1.0 }}
      to={{ x: 1260, y: 560, zoom: 1.08 }}
      duane={{ pose: "stand", x: duaneWalkX(t), flip: false, expr: "annoyed", look: [0.9, 0.1], beer: true, armF: [30, 70], ...(walking ? walkFeet(t - DUANE_WALK.t0) : {}) }}
      lyle={{ expr: "laugh", headBack: 0.2 + slap * 0.5, crouch: 40, lean: 26, armF: [lerp(20, 60, slap), lerp(10, 30, slap)], armB: [-20, 30], footF: [60, -30], footB: [-50, -30], beardSwing: Math.sin(t * 18) * 14 }}
    />
  );
};

// "Ooh..." (wipes a tear)
const CuLyleOoh = () => {
  const { shot } = useEpisode();
  return <Room from={CAM7.cuLyle} to={{ ...CAM7.cuLyle, zoom: 2.55 }} duane={false} lyle={{ expr: shot.local < 0.4 ? "laugh" : "grin", headBack: 0.15, armF: [40, 157], headTilt: 10 }} />;
};

// "What's the move?" — blocking the door, arms out
const DUANE_DOOR_X = 1650;
const MsDuaneDoor = () => (
  <Room
    from={{ x: DUANE_DOOR_X - 30, y: 580, zoom: 1.62 }}
    to={{ x: DUANE_DOOR_X - 30, y: 570, zoom: 1.76 }}
    lyle={false}
    duane={{ pose: "stand", x: DUANE_DOOR_X, flip: true, expr: "hopeful", look: [0.9, -0.1], armF: [118, -6], armB: [-118, 6], beer: false, headTilt: 6 }}
  />
);

// "Move out of my way..." (dead-eyed, nose to nose)
const CuLyleOutOfWay = () => (
  <Room
    from={{ x: 1500, y: HEADS.lyle.y + 70, zoom: 2.2 }}
    to={{ x: 1505, y: HEADS.lyle.y + 60, zoom: 2.45 }}
    duane={{ pose: "stand", x: DUANE_DOOR_X, flip: true, expr: "hopeful", look: [0.9, -0.1], armF: [118, -6], armB: [-118, 6], beer: false }}
    lyle={{ flip: false, x: LYLE_POS.x - 34, expr: "annoyed", look: [1, 0.1], lean: 14, headTilt: 4, armF: [8, 18] }}
  />
);

// "...so I can go home and sleep!" — the spin, the plop, the door
const TwoSpin = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const t0 = shot.start + 0.25;
  const t1 = t0 + 1.15;
  const k = P(t, t0, t1);
  const landed = t >= t1;
  const ang = easeOut(k) * Math.PI * 4;
  const c = Math.cos(ang);
  const scx = Math.sign(c || 1) * Math.max(0.24, Math.abs(c));
  const sx = lerp(DUANE_DOOR_X, DUANE_POS.x + 40, easeInOut(k));
  const sy = LYLE_POS.y - Math.sin(Math.PI * k) * 60;
  const lyleX = lerp(LYLE_POS.x + 20, 1560, easeInOut(P(t, t0 - 0.2, t0 + 0.5)));
  const spinning = (
    <g>
      {/* whoosh rings around the spinning hyena */}
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={sx} cy={sy - 140 - i * 120} rx={150 - i * 20} ry={26} fill="none" stroke="#f2ede0" strokeWidth={6} strokeDasharray="60 40" strokeDashoffset={-t * 900 - i * 50} opacity={0.75} />
      ))}
      {/* fake 3D spin: squash x; mirror via the rig's flip so the hoodie text never reads backwards */}
      <g transform={`translate(${sx} 0) scale(${Math.abs(scx)} 1) translate(${-sx} 0)`}>
        <Hyena id="duaneSpin" x={sx} y={sy} flip={scx < 0} pose="stand" t={t} frame={shot.frame} mouth="X" expr="shocked" beer={false} armF={[150, 10]} armB={[-150, -10]} hatTilt={30} />
      </g>
      <path d={`M${sx + 160},${sy - 260} q40,-10 70,10 M${sx + 170},${sy - 200} q40,0 76,20 M${sx + 150},${sy - 140} q30,6 60,24`} stroke="#f2ede0" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.8} />
    </g>
  );
  return (
    <Room
      from={{ x: 1260, y: 560, zoom: 1.12 }}
      to={{ x: 1300, y: 560, zoom: 1.16 }}
      duane={landed ? { expr: "shocked", look: [0.9, -0.2], hatTilt: 34, slump: 0.4 } : false}
      mid={!landed ? spinning : null}
      set={{ squeak: landed ? clamp(1 - (t - t1) * 3) : 0 }}
      shakeAmp={landed && t - t1 < 0.2 ? 8 : 0}
      lyle={{ flip: false, x: lyleX, expr: "grin", look: [1, 0], armF: k < 0.3 ? [90, 20] : t > DOOR_OPEN ? [96, 30] : [20, 30], lean: 8 }}
    />
  );
};

// "Ah-hyuk!" in the doorway
const DoorHyuk = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const hb = t > T.hyukEnd && t < T.last + 0.1 ? 0.6 : 0.1;
  const wig = Math.sin(t * 24) * 10;
  return (
    <Room
      from={{ x: 1640, y: 530, zoom: 1.46 }}
      to={{ x: 1640, y: 520, zoom: 1.56 }}
      duane={{ expr: "shocked", hatTilt: 34, slump: 0.4 }}
      lyle={{ x: 1660, y: LYLE_POS.y - 40, scale: 0.94, expr: hb > 0.3 ? "laugh" : "wide", headBack: hb, armF: [150 + wig, 20], armB: [-140 - wig, 20], look: [1, 0.2] }}
    />
  );
};

// the moonwalk out; the door slams
const WideMoonwalk = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const x = 1660 + l * 175;
  const behind = x > 1800;
  return (
    <Room
      from={{ x: 1180, y: 560, zoom: 1.0 }}
      to={{ x: 1300, y: 560, zoom: 1.08 }}
      shakeAmp={shot.t > DOOR_SLAM && shot.t < DOOR_SLAM + 0.3 ? 9 : 0}
      duane={{ expr: "deadpan", look: [0.9, -0.1], hatTilt: 34, slump: 0.45 }}
      lyle={shot.t < DOOR_SLAM + 0.05 ? { x, y: LYLE_POS.y - 40, scale: 0.94, expr: "grin", look: [1, 0.2], ...moonwalk(l), crouch: 10, lean: -4, armF: [60, 60], armB: [-30, 60], keys: "B", keysSpin: shot.t * 800 } : false}
      lyleBehind={behind}
      front={
        // the wall right of the doorway hides him as he slides out
        behind ? (
          <g>
            <rect x={1790} y={240} width={400} height={650} fill="url(#wallpaper7)" />
            <rect x={1790} y={600} width={400} height={280} fill="url(#panel7)" />
            <rect x={1768} y={228} width={22} height={652} fill="#5a3a20" stroke="#140d0b" strokeWidth={6} />
          </g>
        ) : null
      }
    />
  );
};

// outside: he moonwalks to his car
const ExtMoonwalk = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const x = EXT.walk.x + 60 + l * 230;
  return (
    <ExteriorScene
      from={{ x: 1060, y: 640, zoom: 1.1 }}
      to={{ x: 1180, y: 640, zoom: 1.16 }}
      party={partyAt(shot.t)}
      inside="duane"
      lyle={{ expr: "grin", look: [0.9, 0.2], ...moonwalk(l, 0.36), crouch: 10, lean: -4, armF: [60, 60], armB: [-30, 60], keys: "B", keysSpin: shot.t * 800 }}
      lylePos={[x, EXT.walk.y]}
    />
  );
};

// alone. the disco ball winds down.
const WideAlone = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  return (
    <Room
      from={{ x: 980, y: 570, zoom: 0.98 }}
      to={{ x: 900, y: 560, zoom: 1.22 }}
      lyle={false}
      duane={{ expr: "sad", look: [l < 0.8 ? 0.9 : l < 1.6 ? -0.6 : 0.4, -0.1], hatTilt: 34, slump: 0.6 }}
    />
  );
};

// (tail) "...what's the move?" — to nobody
const CuDuaneVoid = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const m = l > 0.75 ? silentMouth(l - 0.75) : "X";
  const turn = easeInOut(P(l, 0.1, 0.6));
  const sp = useSpeech("duane");
  return (
    <Room
      from={{ ...CAM7.cuDuane, zoom: 2.6 }}
      to={{ ...CAM7.cuDuane, zoom: 2.9 }}
      lyle={false}
      duane={{ ...sp, mouth: m, talking: l > 0.75 && l < 1.7, expr: l < 0.7 ? "sad" : "hopeful", look: [lerp(0.9, 0.05, turn), lerp(-0.1, 0.25, turn)], headTilt: lerp(0, -8, turn), hatTilt: 34, slump: 0.6, armF: [lerp(26, 40, turn), lerp(84, 70, turn)] }}
    />
  );
};

// (tail) the hall light clicks on. Mama. Bed.
const TailMama = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const lit = l > 0.3;
  const thumb = easeOutBack(P(l, 0.55, 0.8));
  const jerk = l > 0.8 ? Math.sin((l - 0.8) * 16) * 10 * Math.max(0, 1 - (l - 0.8) * 2) : 0;
  return (
    <Room
      from={{ x: 540, y: 570, zoom: 1.2 }}
      to={{ x: 530, y: 566, zoom: 1.26 }}
      lyle={false}
      set={{ hall: lit ? 1 : 0 }}
      mama={lit ? { expr: "glare", look: [0.9, 0.3], armB: thumb > 0 ? [lerp(-35, -160, thumb) + jerk, lerp(95, 14, thumb)] : undefined, ash: 0.3 } : false}
      front={<DarkEyes on={!lit} />}
      duane={{ expr: lit ? "hurt" : "hopeful", look: lit ? [-0.9, -0.2] : [0.05, 0.25], hatTilt: lerp(34, 64, P(l, 0.9, 1.3)), slump: 0.7 }}
    />
  );
};

/* ------------------------------------------------------------------ */

const pD = { x: HEADS.duane.x + 20 };
const pL = { x: HEADS.lyle.x - 20 };

const raw: ShotDef[] = [
  // "Yo, so what's the move?"
  { name: "ext-open", start: 0, end: 1.85, transition: "fade", grade: "night", render: () => <ExtOpen />, portrait: { x: (l) => lerp(860, 620, easeInOut(prog(l, 0, 1.85))), zoom: 1.05, y: 570 } },
  { name: "wide-room", start: 1.85, end: T.move2 - 0.05, render: () => <WideRoom />, portrait: { x: 1100, zoom: 1.15, y: 600 } },
  // "What's the move?"
  { name: "cu-duane-move2", start: T.move2 - 0.05, end: T.its3 - 0.03, render: () => <CuDuaneMove2 />, portrait: pD },
  // "It's 3 a.m...."
  { name: "cu-lyle-3am", start: T.its3 - 0.03, end: T.am + 0.28, render: () => <CuLyle3am />, portrait: pL },
  { name: "clock-3am", start: T.am + 0.28, end: T.home1End - 0.35, render: () => <Clock3am />, portrait: { x: CLOCK.x } },
  // "...I'm going home."
  { name: "ms-lyle-keys", start: T.home1End - 0.35, end: T.come - 0.06, render: () => <MsLyleKeys />, portrait: { x: HEADS.lyle.x } },
  // "Come on bro, don't be like that."
  { name: "cu-duane-comeon", start: T.come - 0.06, end: T.likeWhat - 0.12, render: () => <CuDuaneComeOn />, portrait: pD },
  // "Like what?"
  { name: "cu-lyle-likewhat", start: T.likeWhat - 0.12, end: T.tired - 0.06, render: () => <CuLyleLikeWhat />, portrait: pL },
  // "Tired? Exhausted?"
  { name: "ms-lyle-tired", start: T.tired - 0.06, end: T.sweaty - 0.03, render: () => <MsLyleTired />, portrait: { x: HEADS.lyle.x + 10, zoom: 1.22, y: 600 } },
  // "Sweaty?"
  { name: "pit-sweaty", start: T.sweaty - 0.03, end: T.home2 - 0.05, render: () => <PitSweaty />, portrait: { x: 1318 } },
  // "I'm going home, buddy. It's late."
  { name: "two-home", start: T.home2 - 0.05, end: T.brother - 1.0, render: () => <TwoHome />, portrait: { x: 1230, zoom: 1.1, y: 560 } },
  // "Brother," (swig)
  { name: "cu-duane-brother", start: T.brother - 1.0, end: T.young - 0.06, render: () => <CuDuaneBrother />, portrait: pD },
  // "the night's still young. Don't be a bitch."
  { name: "ecu-duane-young", start: T.young - 0.06, end: T.bitchEnd + 0.16, render: () => <EcuDuaneYoung />, portrait: { x: HEADS.duane.x + 30 } },
  // (silence) the grin; the switch
  { name: "cu-lyle-grin", start: T.bitchEnd + 0.16, end: DROP - 0.05, render: () => <CuLyleGrin />, portrait: pL },
  // THE DROP
  { name: "wide-drop", start: DROP - 0.05, end: T.ohDear - 0.06, transition: "flash", filter: PARTY, render: () => <WideDrop />, portrait: { x: (l) => lerp(1300, 1180, easeInOut(prog(l, 0, 1.2))), zoom: 1.25, y: 600 } },
  // "Oh dear,"
  { name: "ms-lyle-ohdear", start: T.ohDear - 0.06, end: T.notYoung - 0.08, filter: PARTY, render: () => <MsLyleOhDear />, portrait: { x: HEADS.lyle.x, zoom: 1.22, y: 590 } },
  // "you know what's not young?"
  { name: "two-notyoung", start: T.notYoung - 0.08, end: T.you - 0.1, filter: PARTY, render: () => <TwoNotYoung />, portrait: { x: 1180, zoom: 1.1, y: 580 } },
  // "YOU!"
  { name: "cu-lyle-you", start: T.you - 0.1, end: T.youEnd + 0.45, transition: "slam", filter: PARTY, render: () => <CuLyleYou />, portrait: { x: HEADS.lyle.x - 130 } },
  // (the candles go out)
  { name: "ms-duane-hurt", start: T.youEnd + 0.45, end: T.family + 0.6, filter: PARTY, render: () => <MsDuaneHurt />, portrait: { x: HEADS.duane.x - 80, zoom: 0.95, y: 620 } },
  // "Ain't it time to start a family?"
  { name: "photos-family", start: T.family + 0.6, end: T.fun - 0.06, grade: "memory", render: () => <FamilyPhotos />, portrait: { x: (l) => lerp(380, 1560, easeInOut(prog(l, 0, 1.9))), zoom: 1.1, y: 530 } },
  // "Bro, I'm just trying to have fun." (+ blower)
  { name: "cu-duane-fun", start: T.fun - 0.06, end: T.capital - 0.04, filter: PARTY, render: () => <CuDuaneFun />, portrait: { x: HEADS.duane.x + 60 } },
  // "You'll need to try to acquire some..."
  { name: "ms-lyle-capital", start: T.capital - 0.04, end: T.capitalWord - 0.08, filter: PARTY, render: () => <MsLyleCapital />, portrait: { x: HEADS.lyle.x, zoom: 1.22, y: 590 } },
  // "...capital."
  { name: "jar-capital", start: T.capitalWord - 0.08, end: T.old - 0.08, filter: PARTY, render: () => <JarCapital />, portrait: { x: JAR.x } },
  // "You old at 3 a.m...."
  { name: "two-impression", start: T.old - 0.08, end: T.asking - 0.04, filter: PARTY, render: () => <TwoImpression />, portrait: { x: 1220, zoom: 1.12, y: 580 } },
  // "...asking what's the move."
  { name: "cu-lyle-impression", start: T.asking - 0.04, end: T.mama - 0.07, filter: PARTY, render: () => <CuLyleImpression />, portrait: { x: HEADS.lyle.x - 40 } },
  // "Move out your..."
  { name: "ms-lyle-mama", start: T.mama - 0.07, end: T.mamas - 0.04, filter: PARTY, render: () => <MsLyleMama />, portrait: { x: HEADS.lyle.x - 40 } },
  // "...mama's house!"
  { name: "hall-mama", start: T.mamas - 0.04, end: T.weight - 0.12, filter: PARTY, render: () => <HallMama />, portrait: { x: 175 } },
  // "Move some..."
  { name: "ms-lyle-weight", start: T.weight - 0.12, end: T.weightWord + 0.04, filter: PARTY, render: () => <MsLyleWeight />, portrait: { x: HEADS.lyle.x, zoom: 1.22, y: 590 } },
  // "...weight!"
  { name: "gym-weight", start: T.weightWord + 0.04, end: T.bitches - 0.12, filter: FANTASY, transition: "flash", render: () => <GymWeight />, portrait: { x: 1060, zoom: 0.9 } },
  // "Move some bitches!"
  { name: "dogs-bitches", start: T.bitches - 0.12, end: T.hyuk + 0.02, filter: FANTASY, render: () => <DogsScene />, portrait: { x: (l) => lerp(960, 1120, easeInOut(prog(l, 0, 1.3))), zoom: 0.92 } },
  // "Ah-hyuk! Ah-hyuk!"
  { name: "cu-lyle-hyuk", start: T.hyuk + 0.02, end: T.hyuk3 - 0.14, filter: PARTY, render: () => <CuLyleHyuk />, portrait: pL },
  // "Ah-hyuk! Ah-hyuk!" (Duane gets up)
  { name: "wide-hyuk", start: T.hyuk3 - 0.14, end: T.ooh - 0.17, filter: PARTY, render: () => <WideHyuk />, portrait: { x: (l) => lerp(1300, 1440, easeInOut(prog(l, 0, 1.6))), zoom: 1.2, y: 600 } },
  // "Ooh..."
  { name: "cu-lyle-ooh", start: T.ooh - 0.17, end: T.whatsMove - 0.07, filter: PARTY, render: () => <CuLyleOoh />, portrait: pL },
  // "What's the move?"
  { name: "ms-duane-door", start: T.whatsMove - 0.07, end: T.outOfWay - 0.06, filter: PARTY, render: () => <MsDuaneDoor />, portrait: { x: DUANE_DOOR_X - 40 } },
  // "Move out of my way..."
  { name: "cu-lyle-outofway", start: T.outOfWay - 0.06, end: T.goHome - 0.02, filter: PARTY, render: () => <CuLyleOutOfWay />, portrait: { x: 1505, zoom: 0.86 } },
  // "...so I can go home and sleep!"
  { name: "two-spin", start: T.goHome - 0.02, end: T.hyukEnd - 0.06, filter: PARTY, render: () => <TwoSpin />, portrait: { x: (l) => lerp(1560, 1040, easeInOut(prog(l, 0.25, 1.4))), zoom: 1.15, y: 600 } },
  // "Ah-hyuk!"
  { name: "door-hyuk", start: T.hyukEnd - 0.06, end: T.last + 0.5, filter: PARTY, render: () => <DoorHyuk />, portrait: { x: 1650, zoom: 1.12, y: 540 } },
  // the moonwalk out; slam
  { name: "wide-moonwalk", start: T.last + 0.5, end: DOOR_SLAM + 0.4, filter: PARTY, render: () => <WideMoonwalk />, portrait: { x: (l) => lerp(1580, 1720, easeInOut(prog(l, 0, 1.4))), zoom: 1.3, y: 560 } },
  // outside: moonwalk to the car
  { name: "ext-moonwalk", start: DOOR_SLAM + 0.4, end: 59.1, grade: "night", render: () => <ExtMoonwalk />, portrait: { x: (l) => lerp(1080, 1320, easeInOut(prog(l, 0, 1.7))), zoom: 1.25, y: 720 } },
  // alone
  { name: "wide-alone", start: 59.1, end: T.end + 0.2, filter: ROOM, render: () => <WideAlone />, portrait: { x: (l) => lerp(1000, HEADS.duane.x, easeInOut(prog(l, 0, 2.2))), zoom: 1.4, y: 540 } },
  // (tail) to the void: "...what's the move?"
  { name: "cu-duane-void", start: T.end + 0.2, end: T.end + 2.1, filter: TAILG, render: () => <CuDuaneVoid />, portrait: { x: HEADS.duane.x + 20 } },
  // (tail) Mama. Bed.
  { name: "tail-mama", start: T.end + 2.1, end: 999, filter: TAILG, render: () => <TailMama />, portrait: { x: 510, zoom: 0.84, y: 600 } },
];

/** room grade by default; the party and the cutaways set their own */
export const shots: ShotDef[] = raw.map((s) => ({ ...s, filter: s.filter ?? (s.grade ? undefined : ROOM) }));
