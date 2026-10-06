import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { INK } from "../../characters/parts";
import { useEpisode } from "../../engine/context";
import type { ShotDef } from "../../engine/EpisodePlayer";
import { camPath } from "../../engine/Stage";
import { cue, Timeline } from "../../engine/timeline";
import { clamp, easeIn, easeInOut, easeOut, lerp, prog } from "../../engine/util";
import { Starfield, sparkle } from "./bits";
import { GalaxyEye, FaceOfGod } from "./cast/FaceOfGod";
import { Glim } from "./cast/Glim";
import { CosmosScene, Handset, StarSnores } from "./cosmos";
import { EyePetal, HandPetal, Kaleido, Mandala, Pinprick, PulseRings, StarTunnel, TripScene, Vortex } from "./psyche";
import { HEADS9, RACHEL_POS, RCAM, RoomScene, RoomState, ShackScene, WIN_C } from "./room";
import timelineJson from "./timeline.json";

/**
 * EPISODE 009 — "I Once Saw the Face of God".
 * Glim (a humanoid astral being) drifts through the noisy heavens and sees the face of God: a face-shaped silence.
 * He no longer looks up. At night, in his shack on a rock among the stars, he whispers with Rachel, his inner
 * consciousness, a grinning double that unspools from the third eye on his forehead. Something is at the window.
 * Shot times are anchored to the words with cue(); the long musical gap is cut to the bed's swells (measured).
 */
const tl = timelineJson as Timeline;
const at = (phrase: string, opts?: Parameters<typeof cue>[2]) => cue(tl, phrase, opts);

const T = {
  once: at("I once saw"),
  face: at("the face of God"),
  god: at("God"),
  godEnd: at("God", { edge: "end" }),
  vast: at("a vast and sudden"),
  silence: at("silence"),
  among: at("among the noisy"),
  heavensEnd: at("heavens", { edge: "end" }),
  evening: at("That evening"),
  listened: at("I listened"),
  convo: at("conversation"),
  should: at("I should not have"),
  overheard: at("overheard"),
  overEnd: at("overheard", { edge: "end" }),
  watch: at("I do not watch"),
  skies: at("skies"),
  lookUp: at("I do not look up"),
  up: at("up", { after: 29.9 }),
  upEnd: at("up", { after: 29.9, edge: "end" }),
  nights1: at("Some nights"),
  nights2: at("Some nights are darker"),
  black: at("Some are almost black"),
  rachel: at("Rachel"),
  tonight: at("Like tonight"),
  seems: at("it seems so dark"),
  scared: at("Scared of being alone"),
  notAlone: at("You know you're not alone"),
  no1: at("No", { after: 69 }),
  what1: at("What", { after: 71 }),
  whatWas: at("What was that"),
  that: at("that", { after: 75 }),
  dogs: at("It's just the dogs"),
  no2: at("No", { after: 78.5 }),
  mean: at("I mean at the window"),
  atWin: at("At the window", { after: 81.7 }),
  winds: at("The wind's blowing"),
  lower: at("I'll lower it"),
  oh: at("Oh"),
  thought: at("I thought I heard"),
  something: at("something"),
  wind: at("It's just the wind"),
  windEnd: at("wind", { after: 97, edge: "end" }),
  end: tl.duration,
};

/** Music events in the bed, measured on the music-only side channel: spectral-flux peaks (swell1-3, hit), the high band
 *  fading into a near-silent dip (~43.3-44.2 s) and the strongest low boom (44.44 s). swell4 (42.0) is a chosen cut. */
const M = { swell1: 33.37, swell2: 36.43, hit: 38.15, swell3: 39.68, swell4: 42.0, dip: 43.3, boom: 44.44 };
/** Untranscribed whispers after the last lines (breath on the glass). */
const WHISPERS = [93.95, 97.7, 98.2, 98.62, 99.1, 99.45, 99.72, 100.62];
export const TAIL = 4.7;
const END = T.end + TAIL;

const P = prog;

type Arm = [number, number];
/** Glim's bed arm poses ([shoulder, elbow] degrees; solved for the hands to land on the blanket) */
const REST = { armF: [-10, 92] as Arm, armB: [-14, 88] as Arm };
const CLUTCH = { armF: [-5, 154] as Arm, armB: [-2, 162] as Arm, gripF: 70, gripB: 70 };
/** Rachel's arm poses (her default is a slow reach toward him) */
const R_CLASP = { armF: [30, 125] as Arm, armB: [25, 130] as Arm };
/** the "cuckoo" finger-twirl by her temple (his own inner voice, mocking him) */
const rTwirl = (t: number) => ({ armF: [97 + Math.cos(t * 9) * 6, 104 + Math.sin(t * 9) * 12] as Arm, armB: [-10, 20] as Arm });
const PEEK = { armF: [120, 98] as Arm, armB: [117, 87] as Arm, gripF: 80, gripB: 80 };
const lerpArm = (a: Arm, b: Arm, k: number): Arm => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

/* ------------------------------------------------------------------ */
/* Little pieces                                                       */
/* ------------------------------------------------------------------ */

/** A strip of nebula draped over him like a duvet. */
const NebulaDuvet: React.FC<{ t: number }> = ({ t }) => {
  const w = Math.sin(t * 1.3) * 10;
  return (
    <g>
      <defs>
        <linearGradient id="duvetG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c2367a" stopOpacity={0} />
          <stop offset="0.25" stopColor="#c2367a" stopOpacity={0.7} />
          <stop offset="0.7" stopColor="#2ab3b0" stopOpacity={0.7} />
          <stop offset="1" stopColor="#2ab3b0" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M560,${700 + w} C700,${640 - w} 860,${700 + w} 1000,${650 - w} C1140,${600 + w} 1280,${680 - w} 1400,${640 + w} L1400,${760 + w} C1260,${800 - w} 1120,${740 + w} 980,${790 - w} C840,${840 + w} 700,${780 - w} 560,${820 + w} Z`} fill="url(#duvetG)" />
    </g>
  );
};

/** Breath patches on the glass, pulsing with the untranscribed whispers. */
const breathsAt = (t: number): Array<[number, number, number]> =>
  WHISPERS.map((w, i) => {
    const k = t < w ? 0 : Math.exp(-(t - w) / 0.9) * clamp((t - w) / 0.12);
    return [1400 + ((i * 97) % 220), 360 + ((i * 61) % 220), k] as [number, number, number];
  });

/* ------------------------------------------------------------------ */
/* Intro + narration: the noisy heavens                                */
/* ------------------------------------------------------------------ */

const IntroVoid = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const k = easeIn(P(t, 0.0, 2.7));
  return (
    <TripScene hue={t * 16} sat={1.35} cam={{ x: 960, y: 540, zoom: 1, rot: t * 4 }}>
      <Mandala t={t} opacity={0.25 + k * 0.35} colors={["#2a1450", "#0f3a44", "#3a0f30"]} />
      <PulseRings t={t + 2} speed={0.2} n={6} opacity={0.55 + k * 0.4} colors={["#4a1a8a", "#0f6a6a", "#7a1a50"]} />
      <StarTunnel t={t} speed={0.1 + k * 0.22} opacity={0.3 + k * 0.7} n={150} />
      <Kaleido id="introSeeds" n={12} rot={-t * 12} scale={0.35 + k * 0.4}>
        <path d={sparkle(26, 0.18)} transform="translate(300 0)" fill="#d8f8ff" opacity={0.85} />
        <ellipse cx={200} cy={0} rx={18} ry={8} fill="#e9e0c8" stroke={INK} strokeWidth={3} />
        <circle cx={200} cy={0} r={5} fill="#000" />
      </Kaleido>
      <Pinprick k={0.25 + k * 0.75} t={t} />
    </TripScene>
  );
};

const IntroTunnel = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const l = shot.local;
  const dur = shot.end - shot.start;
  const grow = easeIn(P(l, 0.3, dur));
  return (
    <TripScene hue={t * 22} cam={{ x: 960, y: 540, zoom: 1 + l * 0.05, rot: -t * 6 }}>
      <Mandala t={t} opacity={0.55} />
      <StarTunnel t={t} speed={0.45} n={200} />
      <Kaleido id="introEyes" n={8} rot={t * 20} scale={0.45 + easeOut(P(l, 0, 2)) * 0.55}>
        <EyePetal id="introEye" t={t} r={60} dist={300} open={easeOut(P(l, 0.3, 1.4))} />
      </Kaleido>
      <PulseRings t={t} speed={0.4} n={5} opacity={0.45} />
      <Glim id="glimIntro" x={960} y={540 + 150 * (0.05 + grow * 0.8)} scale={0.05 + grow * 0.8} pose="float" spin={l * 150} t={t} frame={shot.frame} mouth="X" expr="awe" glow={1} />
    </TripScene>
  );
};

const Drift = () => <CosmosScene from={{ x: 900, y: 520, zoom: 0.86 }} to={{ x: 990, y: 560, zoom: 0.96 }} noise={1} glim={{ expr: "neutral", look: [0.4, -0.6], spin: -8, mouth: "X", talking: false }} />;

const CuGlimFace = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.t, T.face + 0.1, T.godEnd));
  return <CosmosScene from={{ x: 990, y: 600, zoom: 2.3 }} to={{ x: 992, y: 594, zoom: 2.6 }} noise={1 - k * 0.6} drain={k * 0.3} glim={{ x: 960, y: 900, scale: 1, expr: shot.t > T.face + 0.3 ? "awe" : "neutral", look: [0.35, -0.95], headTilt: -6, spin: -4, glow: 0.6 + k * 0.6 }} />;
};

const GodReveal = () => {
  const { shot } = useEpisode();
  const pres = easeInOut(P(shot.t, T.godEnd + 0.1, T.vast - 0.35));
  const open = easeOut(P(shot.t, T.vast - 0.9, T.vast - 0.05));
  return <CosmosScene from={{ x: 960, y: 470, zoom: 0.82 }} to={{ x: 960, y: 455, zoom: 0.9 }} noise={1 - pres * 0.3} face={{ presence: pres, open, s: 0.8, y: 250 }} glim={{ x: 960, y: 1010, scale: 0.3, expr: "awe", look: [0, -1], mouth: "X", talking: false }} />;
};

const Silence = () => (
  <CosmosScene from={{ x: 960, y: 455, zoom: 0.9 }} to={{ x: 960, y: 520, zoom: 1.02 }} noise={0} freeze={1} drain={0.85} face={{ s: 0.8, y: 250, look: [0, 0.45] }} glim={{ x: 960, y: 1010, scale: 0.3, expr: "terror", look: [0, -1], mouth: "X", talking: false, tremble: 0.4 }} />
);

const Noisy = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0, 1.2));
  return <CosmosScene from={{ x: 960, y: 500, zoom: 0.96 }} to={{ x: 960, y: 540, zoom: 0.62 }} noise={k} freeze={1 - k} drain={0.85 - k * 0.55} face={{ s: 0.8, y: 250, look: [0, 0.45] }} glim={{ x: 960, y: 1010, scale: 0.3, expr: "terror", look: [0, -1], mouth: "X", talking: false }} />;
};

const GlimStare = () => <CosmosScene from={{ x: 998, y: 574, zoom: 3.6 }} to={{ x: 998, y: 572, zoom: 4.3 }} noise={0.5} drain={0.3} glim={{ x: 960, y: 900, scale: 1, expr: "terror", look: [0.05, -1], tremble: 0.8, sweat: 1, mouth: "X", talking: false, ring: false }} />;

const Sleep = () => {
  const { shot } = useEpisode();
  return (
    <CosmosScene
      from={{ x: 960, y: 640, zoom: 1.45 }}
      to={{ x: 970, y: 650, zoom: 1.6 }}
      noise={0.3}
      glim={{ x: 990, y: 820, scale: 0.8, expr: "sleep", spin: -72, armF: [140, 90], armB: [120, 100], mouth: "X", talking: false }}
      front={
        <>
          <NebulaDuvet t={shot.t} />
          <StarSnores x={760} y={600} t={shot.t} />
        </>
      }
    />
  );
};

const HandsetShot = () => {
  const { shot } = useEpisode();
  const twitch = Math.sin(shot.t * 7) * 3;
  return (
    <CosmosScene
      from={{ x: 930, y: 560, zoom: 2.0 }}
      to={{ x: 940, y: 560, zoom: 2.3 }}
      noise={0.25}
      drain={0.2}
      glim={{ x: 960, y: 900, scale: 1, expr: "sleep", headTilt: -12 + twitch, mouth: "X", talking: false, armF: [14, 26], armB: [-139, -47], gripB: -150 }}
      back={<Handset x={858} y={556} rot={-14} s={1} t={shot.t} cordTo={[300, -250]} />}
    />
  );
};

const Overheard = () => {
  const { shot } = useEpisode();
  const wake = shot.t > T.overheard + 0.05;
  const mouth = 0.12 + Math.abs(Math.sin(shot.t * 11)) * 0.22;
  return (
    <CosmosScene
      from={{ x: 960, y: 430, zoom: 0.85 }}
      to={{ x: 960, y: 560, zoom: 1.0 }}
      noise={0.15}
      drain={0.25}
      face={{ s: 0.42, x: 960, y: 120, mouth, open: 0.3, look: [0, 0.6] }}
      glim={{ x: 960, y: 980, scale: 0.55, expr: wake ? "terror" : "sleep", mouth: "X", talking: false, tremble: wake ? 0.8 : 0, look: [0, -1], headTilt: -12 }}
      back={<Handset x={905} y={796} rot={-14} s={0.55} t={shot.t} cordTo={[960, 262]} drip={P(shot.t, T.should, T.overEnd)} />}
      shakeAmp={wake ? 6 : 0}
    />
  );
};

/* ------------------------------------------------------------------ */
/* The room (first look) and the refusal                               */
/* ------------------------------------------------------------------ */

const NIGHT1: Partial<RoomState> = { shut: 1, dark: 0.5, wind: 0, sash: 0 };

const TelescopeShot = () => <RoomScene from={{ x: 1790, y: 640, zoom: 2.2 }} to={{ x: 1640, y: 560, zoom: 1.85 }} room={NIGHT1} glim={{ expr: "dread", look: [1, 0.2], blanket: 0.6 }} />;

const BedSkies = () => <RoomScene from={{ x: 520, y: 470, zoom: 1.85 }} to={{ x: 500, y: 460, zoom: 2.05 }} room={NIGHT1} glim={{ expr: "dread", look: [0.9, 0.3], blanket: 0.85, ...CLUTCH, tremble: 0.2 }} />;

/** He won't look up, so the camera does: it holds on him through the line, then tilts to the boarded skylight. */
const NO_LOOK_END = 31.6;
const tiltFrom = () => T.upEnd - 0.1;
const NoLookUp = () => {
  const { shot } = useEpisode();
  const cam = camPath(
    [
      [0, RCAM.cuGlim],
      [tiltFrom() - shot.start, { ...RCAM.cuGlim, zoom: 2.8 }],
      [NO_LOOK_END - 0.1 - shot.start, RCAM.ceiling],
    ],
    shot.local,
  );
  return <RoomScene from={RCAM.cuGlim} cam={cam} room={{ ...NIGHT1, skylight: easeIn(P(shot.t, tiltFrom(), NO_LOOK_END)) }} glim={{ expr: "hush", look: [0.3, 0.95], tremble: 0.7, sweat: 1, blanket: 0.85, ...CLUTCH }} />;
};

/* ------------------------------------------------------------------ */
/* The gap: the trip                                                   */
/* ------------------------------------------------------------------ */

const TripFall = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const l = shot.local;
  return (
    <TripScene hue={t * 40} cam={{ x: 960, y: 540, zoom: 1, rot: t * 10 }} glim={{ x: 960, y: 690, scale: 0.55 + Math.sin(l * 2) * 0.05, spin: l * 120, expr: "terror", armF: [160, 20], armB: [-160, -20], glow: 1 }}>
      <PulseRings t={t} speed={0.5} n={8} squash={0.8} colors={["#4a1a8a", "#0f6a6a", "#8a1a5a", "#1a1a4a"]} />
      <StarTunnel t={t} speed={0.7} n={220} />
    </TripScene>
  );
};

const TripEyes = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const l = shot.local;
  return (
    <TripScene hue={60 + t * 30} cam={{ x: 960, y: 540, zoom: 1.05 + l * 0.04, rot: -t * 8 }}>
      <Mandala t={t} />
      <PulseRings t={t} speed={0.33} n={6} opacity={0.7} />
      <Kaleido id="eyesK" n={10} rot={t * 24} scale={0.9 + Math.sin(l * 3) * 0.06}>
        <EyePetal id="eyesKe" t={t} r={64} dist={360} open={0.6 + 0.4 * Math.abs(Math.sin(l * 2.2))} />
      </Kaleido>
      <Kaleido id="eyesK2" n={10} rot={-t * 30 + 18} scale={0.55}>
        <EyePetal id="eyesKe2" t={t + 2} r={52} dist={300} />
      </Kaleido>
      <GalaxyEye id="eyesCore" cx={960} cy={540} r={120} t={t} ball pupil={0.25 - 0.1 * Math.abs(Math.sin(l * 1.7))} lid="#2a0f2a" />
    </TripScene>
  );
};

const TripHeads = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const f = shot.frame;
  const mouth = Math.floor(f / 3) % 2 ? "D" : "H";
  return (
    <TripScene hue={140 + t * 34} cam={{ x: 960, y: 540, zoom: 1.0, rot: t * 6 }}>
      <PulseRings t={t} speed={0.45} n={7} opacity={0.8} colors={["#6a1a3a", "#1a3a6a", "#3a6a1a"]} />
      <Kaleido id="headsK" n={8} rot={t * 26} mirror>
        <g transform="rotate(90 360 0)">
          <Glim id="kh" only="head" x={360 - 12 * 0.6} y={318 * 0.6} scale={0.6} t={t} frame={f} mouth={mouth} talking expr="terror" ring={false} glow={1} />
        </g>
      </Kaleido>
      <Kaleido id="headsK2" n={12} rot={-t * 40} mirror={false}>
        <g transform="rotate(90 180 0)">
          <Glim id="kh2" only="head" x={180 - 12 * 0.28} y={318 * 0.28} scale={0.28} t={t + 1} frame={f + 3} mouth={mouth === "D" ? "H" : "D"} talking expr="awe" ring={false} />
        </g>
      </Kaleido>
    </TripScene>
  );
};

const TripEye = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const l = shot.local;
  const open = easeOut(P(l, 0.05, 0.5));
  const pupil = lerp(0.42, 0.1, easeInOut(P(l, 0.4, 1.3)));
  return (
    <TripScene hue={200 + t * 20} cam={{ x: 960, y: 540, zoom: 1.0 + l * 0.06 }} shakeAmp={l < 0.4 ? 10 * (1 - l / 0.4) : 0}>
      <PulseRings t={t} speed={0.6} n={8} opacity={0.6} />
      <Kaleido id="headsK3" n={8} rot={t * 26} scale={1.6}>
        <g transform="rotate(90 360 0)">
          <Glim id="kh3" only="head" x={360 - 12 * 0.6} y={318 * 0.6} scale={0.6} t={t} frame={shot.frame} mouth="D" talking expr="terror" ring={false} />
        </g>
      </Kaleido>
      <GalaxyEye id="bigEye" cx={960} cy={540} r={330} t={t} open={open} ball pupil={pupil} lid="#1a0a1a" look={[0, 0.05]} />
    </TripScene>
  );
};

const TripHands = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const l = shot.local;
  return (
    <TripScene hue={-20 + l * 28} cam={{ x: 960, y: 540, zoom: 1.0, rot: -l * 8 }} glim={{ x: 960, y: 680, scale: 0.55, spin: -l * 40, expr: "wince", armF: [150, 120], armB: [150, 120] }}>
      <Mandala t={t} opacity={0.5} colors={["#3a0f20", "#0f2a3a", "#2a2a0f"]} />
      <Vortex t={t} kind="tooth" n={36} speed={0.16} />
      <Kaleido id="handsK" n={6} rot={t * 14} scale={1.05 - easeInOut(P(l, 0, 2.2)) * 0.25}>
        <HandPetal reach={0.9 + easeInOut(P(l, 0, 2.0)) * 0.35} curl={0.35 + Math.sin(l * 3) * 0.35} />
      </Kaleido>
    </TripScene>
  );
};

const TripMouth = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const mouth = easeOut(P(t, M.swell4, M.swell4 + 0.8)) * (1 - easeInOut(P(t, M.dip - 0.2, M.dip + 0.5)));
  const dim = 1 - easeInOut(P(t, M.dip, M.boom - 0.1)) * 0.82;
  const s = 1.25;
  return (
    <TripScene hue={320 + t * 12} bright={dim} cam={{ x: 960, y: 560, zoom: 1.0 + shot.local * 0.05 }}>
      <Vortex t={t} kind="eye" n={30} speed={0.12} />
      <FaceOfGod id="tripFace" x={960} y={560 - 330 * s} s={s} t={t} open={1} mouth={mouth} />
    </TripScene>
  );
};

const ShackReveal = () => {
  const { shot } = useEpisode();
  return <ShackScene from={{ x: 960, y: 520, zoom: 0.62 }} to={{ x: 980, y: 560, zoom: 0.92 }} ease={easeOut} wind={0.6} howl={1} hue={-shot.local * 2} />;
};

const ShackPush = () => <ShackScene from={{ x: 1000, y: 560, zoom: 1.05 }} to={{ x: 1035, y: 560, zoom: 3.6 }} ease={easeIn} wind={0.5} howl={0.5} />;

/* ------------------------------------------------------------------ */
/* Night in the room                                                   */
/* ------------------------------------------------------------------ */

const NIGHT: Partial<RoomState> = { dark: 0.55, wind: 0.25, sash: 0.55 };
const darkAt = (t: number) => 0.55 + 0.32 * easeInOut(P(t, T.nights2, T.black + 1.2)) - 0.1 * easeInOut(P(t, T.rachel - 0.4, T.rachel + 0.8));
const thirdAt = (t: number) => easeOut(P(t, T.black + 1.1, T.rachel - 0.05));
const roomAt = (t: number): Partial<RoomState> => ({ ...NIGHT, dark: darkAt(t) });

/** Rachel unspools from the third eye on "Rachel" and stays out until "It's just the wind". */
const rachelEmerge = (t: number) => easeOut(P(t, T.rachel - 0.05, T.rachel + 1.0)) * (1 - easeInOut(P(t, T.windEnd + 0.5, T.windEnd + 1.2)));

const BedWide = () => {
  const { shot } = useEpisode();
  return <RoomScene from={RCAM.wide} to={RCAM.wideIn} room={roomAt(shot.t)} glim={{ expr: "whisper", look: [1, 0.1], blanket: 0.55, ...REST }} />;
};

const CuDarker = () => {
  const { shot } = useEpisode();
  return <RoomScene from={RCAM.cuGlim} to={{ ...RCAM.cuGlim, zoom: 2.9 }} room={roomAt(shot.t)} glim={{ expr: "dread", look: [0.9, 0.15], blanket: 0.75, ...CLUTCH }} />;
};

const EcuBlack = () => {
  const { shot } = useEpisode();
  return <RoomScene from={{ ...RCAM.ecuGlim, y: RCAM.ecuGlim.y + 30, zoom: 3.05 }} to={{ ...RCAM.ecuGlim, y: RCAM.ecuGlim.y + 10, zoom: 3.3 }} room={roomAt(shot.t)} glim={{ expr: "whisper", look: [0.8, 0.2], blanket: 0.6, thirdEye: thirdAt(shot.t) }} />;
};

const TwoRachel = () => {
  const { shot } = useEpisode();
  const e = rachelEmerge(shot.t);
  return <RoomScene from={{ ...RCAM.two, zoom: 1.75 }} to={RCAM.two} room={roomAt(shot.t)} glim={{ expr: "hush", look: [1, -0.2], blanket: 0.6, thirdEye: 1 }} rachel={{ emerge: e, alpha: clamp(e * 2), expr: "grin", look: [-1, 0.3], lean: -6 }} />;
};

const TwoTonight = () => {
  const { shot } = useEpisode();
  return <RoomScene from={RCAM.two} to={{ ...RCAM.two, zoom: 1.8, x: RCAM.two.x - 20 }} room={roomAt(shot.t)} glim={{ expr: "whisper", look: [1, -0.25], blanket: 0.6, thirdEye: 1 }} rachel={{ expr: "grin", look: [-1, 0.4], headTilt: -8 + Math.sin(shot.local * 2) * 6, lean: -8, ...R_CLASP }} />;
};

const CuRachelListen = () => {
  const { shot } = useEpisode();
  return <RoomScene from={RCAM.cuRachel} to={{ ...RCAM.cuRachel, zoom: 2.85 }} room={roomAt(shot.t)} glim={{ expr: "whisper", look: [1, -0.2], thirdEye: 1 }} rachel={{ expr: "sly", look: [-1, 0.5], headTilt: -14, lean: -10, ...R_CLASP }} />;
};

const CuGlimScared = () => {
  const { shot } = useEpisode();
  return <RoomScene from={RCAM.cuGlim} to={{ ...RCAM.cuGlim, zoom: 2.8 }} room={roomAt(shot.t)} glim={{ expr: "dread", look: [0.7, -0.35], blanket: 0.95, thirdEye: 1, ...CLUTCH, tremble: 0.25 }} rachel={{ expr: "grin", look: [-1, 0.4] }} />;
};

const CuRachelNotAlone = () => {
  const { shot } = useEpisode();
  const lean = -8 - easeInOut(P(shot.local, 0, 1.2)) * 12;
  return <RoomScene from={{ ...RCAM.cuRachel, zoom: 2.5 }} to={{ ...RCAM.cuRachel, zoom: 2.9, x: RCAM.cuRachel.x - 30 }} room={roomAt(shot.t)} glim={{ expr: "terror", look: [1, -0.3], thirdEye: 1 }} rachel={{ expr: shot.t < T.notAlone + 0.4 ? "coo" : "grin", look: [-1, 0.5], lean, headTilt: -10 }} />;
};

const CuGlimNo = () => {
  const { shot } = useEpisode();
  const shakeHead = Math.sin(shot.local * 16) * 7 * (1 - P(shot.local, 0.3, 1.4));
  return <RoomScene from={{ ...RCAM.cuGlim, zoom: 2.7 }} to={{ ...RCAM.cuGlim, zoom: 3.0 }} room={roomAt(shot.t)} glim={{ expr: "terror", look: [0.9, -0.2], blanket: 0.95, thirdEye: 1, headTilt: shakeHead, ...CLUTCH }} rachel={{ expr: "grin" }} />;
};

const TwoWhat = () => {
  const { shot } = useEpisode();
  const up = easeOut(P(shot.t, T.what1 - 0.25, T.what1 + 0.3));
  return (
    <RoomScene
      from={{ x: 760, y: 420, zoom: 1.3 }}
      to={{ x: 820, y: 430, zoom: 1.38 }}
      room={{ ...roomAt(shot.t), wind: lerp(0.25, 0.75, P(shot.local, 0, 1.2)) }}
      glim={{ expr: "terror", look: [1, -0.05], recline: lerp(8, -4, up), blanket: 0.55, thirdEye: 1, armF: lerpArm(CLUTCH.armF, [20, 30], up), armB: lerpArm(CLUTCH.armB, [8, 24], up) }}
      rachel={{ expr: "blank", look: [1, 0], flip: up < 0.5, lean: up < 0.5 ? -4 : 6 }}
    />
  );
};

const WindowPass = () => {
  const { shot } = useEpisode();
  const k = P(shot.local, 0.1, 1.2);
  return <RoomScene from={RCAM.window} to={{ ...RCAM.window, zoom: 2.2 }} room={{ ...roomAt(shot.t), wind: 0.8, shadow: Math.sin(Math.PI * k), shadowX: lerp(1780, 1220, k), fog: 0.15 }} glim={false} />;
};

const CuGlimWhatWas = () => {
  const { shot } = useEpisode();
  return <RoomScene from={{ ...RCAM.cuGlim, x: RCAM.cuGlim.x + 10, zoom: 2.6 }} to={{ ...RCAM.cuGlim, zoom: 2.9 }} room={{ ...roomAt(shot.t), wind: 0.6 }} glim={{ expr: "terror", look: [1, -0.1], recline: -4, blanket: 0.55, thirdEye: 1, sweat: 0.8, tremble: 0.4 }} rachel={{ expr: "blank", flip: false, lean: 6 }} />;
};

const CuRachelDogs = () => {
  const { shot } = useEpisode();
  return <RoomScene from={RCAM.cuRachel} to={{ ...RCAM.cuRachel, zoom: 2.8 }} room={{ ...roomAt(shot.t), wind: 0.5 }} glim={{ expr: "terror", look: [1, -0.1], recline: -4, thirdEye: 1 }} rachel={{ expr: "coo", look: [-1, 0.4], lean: -10 }} />;
};

const DogsCut = () => <ShackScene from={{ x: 330, y: 560, zoom: 2.7 }} to={{ x: 336, y: 548, zoom: 3.0 }} wind={0.7} howl={1} />;

const CuGlimWindow = () => {
  const { shot } = useEpisode();
  const point = easeOut(P(shot.t, T.mean - 0.3, T.mean + 0.2));
  return (
    <RoomScene
      from={{ x: 900, y: 450, zoom: 1.32 }}
      to={{ x: 930, y: 450, zoom: 1.4 }}
      room={{ ...roomAt(shot.t), wind: 0.6 }}
      glim={{ expr: "terror", look: [1, -0.1], recline: -4, blanket: 0.5, thirdEye: 1, armF: lerpArm([20, 30], [138, 4], point), armB: [8, 24], tremble: 0.3 }}
      rachel={{ expr: "grin", look: [-1, 0.3], lean: -6, armF: [12, 18], armB: [-8, 14] }}
    />
  );
};

const CuRachelAtWin = () => {
  const { shot } = useEpisode();
  const tw = easeInOut(P(shot.local, 0.15, 0.75));
  return <RoomScene from={RCAM.cuRachel} to={{ ...RCAM.cuRachel, zoom: 2.75 }} room={{ ...roomAt(shot.t), wind: 0.7 }} glim={{ expr: "terror", recline: -4, thirdEye: 1 }} rachel={{ expr: "blank", look: [-1, 0.2], twist: tw, lean: -4 }} />;
};

const WindowAlmost = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const dur = shot.end - shot.start;
  const hand = easeInOut(P(l, 0.5, 1.3)) * (1 - easeIn(P(l, dur - 0.55, dur - 0.15)));
  return <RoomScene from={{ ...RCAM.window, y: WIN_C[1] + 90, zoom: 1.85 }} to={{ ...RCAM.window, y: WIN_C[1] + 130, x: WIN_C[0] - 40, zoom: 2.15 }} room={{ ...roomAt(shot.t), wind: 0.55, fog: lerp(0.1, 0.55, P(l, 0, dur)), hand }} glim={false} />;
};

const RachelLower = () => {
  const { shot } = useEpisode();
  const go = easeInOut(P(shot.t, T.winds - 0.1, T.winds + 1.1));
  const lowerK = easeInOut(P(shot.t, T.lower - 0.1, T.lower + 0.9));
  const x = lerp(RACHEL_POS.x, 1490, go);
  const y = lerp(RACHEL_POS.y, 560, go);
  return (
    <RoomScene
      from={{ x: 1060, y: 470, zoom: 1.18 }}
      to={{ x: 1180, y: 470, zoom: 1.3 }}
      room={{ ...roomAt(shot.t), wind: lerp(0.85, 0.15, lowerK), sash: lerp(0.55, 0.22, lowerK), fog: lerp(0.5, 0.15, go) }}
      glim={{ expr: "dread", look: [1, -0.1], recline: lerp(-4, 8, go), blanket: 0.75, thirdEye: 1 }}
      rachel={{ x, y, flip: go < 0.5, expr: "coo", look: [go < 0.5 ? -1 : -0.4, 0.2], lean: go > 0.5 ? 8 : -6, armF: go > 0.6 ? [lerp(150, 170, lowerK), lerp(30, 10, lowerK)] : undefined, armB: go > 0.6 ? [lerp(140, 160, lowerK), lerp(40, 20, lowerK)] : undefined }}
    />
  );
};

/** Rachel back on his knees, after the window. */
const RACHEL_HOME = { x: RACHEL_POS.x, y: RACHEL_POS.y };

const CuGlimOh = () => {
  const { shot } = useEpisode();
  return <RoomScene from={RCAM.cuGlim} to={{ ...RCAM.cuGlim, zoom: 2.8 }} room={{ ...roomAt(shot.t), wind: 0.15, sash: 0.22 }} glim={{ expr: shot.t < T.oh + 0.7 ? "relieved" : "dread", look: [1, -0.15], blanket: 0.7, thirdEye: 1 }} rachel={{ ...RACHEL_HOME, expr: "grin", ...R_CLASP }} />;
};

const TwoThought = () => {
  const { shot } = useEpisode();
  return (
    <RoomScene
      from={{ x: 900, y: 450, zoom: 1.22 }}
      to={{ x: 940, y: 460, zoom: 1.3 }}
      room={{ ...roomAt(shot.t), wind: 0.15, sash: 0.22, breaths: breathsAt(shot.t), fog: 0.12 }}
      glim={{ expr: "whisper", look: [0.4, 0.6], recline: 14, blanket: 0.75, thirdEye: 1 }}
      rachel={{ ...RACHEL_HOME, expr: "sly", look: [-1, 0.4], lean: -12, ...(shot.t > T.thought + 0.5 ? rTwirl(shot.t) : R_CLASP) }}
    />
  );
};

/** Something draws a smiley in the fog, from the outside. */
const Smiley: React.FC<{ k: number }> = ({ k }) => {
  const cx = 1530;
  const cy = 420;
  const arc = clamp((k - 0.4) / 0.6);
  return (
    <g opacity={0.8} stroke="#0b0e1a" strokeWidth={9} fill="none" strokeLinecap="round">
      {k > 0.12 ? <path d={`M${cx - 26},${cy - 18} l0,1`} /> : null}
      {k > 0.28 ? <path d={`M${cx + 26},${cy - 18} l0,1`} /> : null}
      {arc > 0 ? <path d={`M${cx - 40},${cy + 10} Q${cx},${cy + 10 + 46 * arc} ${cx + 40 * arc * 2 - 40},${cy + 10 + (arc < 0.5 ? 40 * arc : 20)}`} /> : null}
    </g>
  );
};

const WindowBreath = () => {
  const { shot } = useEpisode();
  const k = P(shot.local, 0.25, 1.55);
  return <RoomScene from={{ ...RCAM.window, x: 1520, zoom: 2.1 }} to={{ ...RCAM.window, x: 1525, y: 450, zoom: 2.4 }} room={{ ...roomAt(shot.t), wind: 0.12, sash: 0.22, breaths: [[1530, 430, 0.85]], fog: 0.2 }} glim={false} front={<Smiley k={k} />} />;
};

const CuRachelWind = () => {
  const { shot } = useEpisode();
  return <RoomScene from={RCAM.cuRachel} to={{ ...RCAM.cuRachel, zoom: 2.95, x: RCAM.cuRachel.x - 20 }} room={{ ...roomAt(shot.t), wind: 0.1, sash: 0.22 }} glim={{ expr: "relieved", thirdEye: 1 }} rachel={{ ...RACHEL_HOME, expr: shot.t > T.windEnd ? "hungry" : "grin", look: [-1, 0.45], lean: -12 - P(shot.local, 0, 1.5) * 6, headTilt: -16, emerge: rachelEmerge(shot.t) }} />;
};

/* ------------------------------------------------------------------ */
/* Tail: the silent punchline                                          */
/* ------------------------------------------------------------------ */

const BedCalm = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const e = rachelEmerge(t);
  const reopen = t > 99.35 ? easeOut(P(t, 99.35, 99.6)) : 0;
  const third = Math.max(1 - easeInOut(P(t, T.windEnd + 0.9, T.windEnd + 1.5)), reopen);
  return (
    <RoomScene
      from={{ x: 880, y: 470, zoom: 1.12 }}
      to={{ x: 860, y: 480, zoom: 1.2 }}
      room={{ ...roomAt(t), wind: 0.05, sash: 0.22, breaths: breathsAt(t), fog: 0.12 }}
      glim={{ expr: t > T.windEnd + 1.2 ? "sleep" : "relieved", look: [0.6, 0.4], recline: 18, blanket: 0.8, thirdEye: third }}
      rachel={e > 0.01 ? { ...RACHEL_HOME, emerge: e, alpha: clamp(e * 1.5), expr: "hungry" } : false}
    />
  );
};

const WindowEye = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const k = easeOut(P(shot.local, 0.25, 1.5));
  const pupil = lerp(0.36, 0.09, easeInOut(P(shot.local, 1.5, 2.1)));
  return <RoomScene from={{ ...RCAM.window, zoom: 1.95 }} to={{ ...RCAM.window, zoom: 2.25 }} room={{ ...roomAt(t), wind: 0, sash: 0.22, breaths: breathsAt(t), fog: lerp(0.3, 0.05, k), eye: k, eyeX: lerp(1960, 1490, k), eyeY: 470, eyePupil: pupil }} glim={false} />;
};

/** beats inside eye-stare (seconds): 9:16 whip-pans to the eye for the blink and back for the duck */
const EYE_BEATS = { panOut: 1.1, atEye: 1.3, blink: 1.42, panBack: 1.68, atGlim: 1.86, duck: 1.95 };
const eyeStareX = (l: number) =>
  l < EYE_BEATS.atEye ? lerp(545, 1490, easeInOut(prog(l, EYE_BEATS.panOut, EYE_BEATS.atEye))) : lerp(1490, 545, easeInOut(prog(l, EYE_BEATS.panBack, EYE_BEATS.atGlim)));

/** He sees it. He peeks over the blanket. It blinks. He goes all the way under; his little moon keeps orbiting. */
const EyeStare = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  const l = shot.local;
  const peek = easeInOut(P(l, 0.3, 1.0));
  const duck = easeIn(P(l, EYE_BEATS.duck, EYE_BEATS.duck + 0.28));
  const blink = l > EYE_BEATS.blink && l < EYE_BEATS.blink + 0.2 ? 0.04 : 1;
  return (
    <RoomScene
      from={{ x: 980, y: 520, zoom: 1.08 }}
      to={{ x: 1000, y: 500, zoom: 1.2 }}
      room={{ ...roomAt(t), dark: 0.75, wind: 0, sash: 0.22, eye: 1, eyeX: 1490, eyeY: 470, eyePupil: 0.09, eyeOpen: blink }}
      glim={{ expr: "terror", look: [1, -0.1], recline: 8, blanket: 0.85 + peek * 1.05 + duck * 1.4, thirdEye: 0, tremble: 0.6, armF: lerpArm(CLUTCH.armF, PEEK.armF, peek), armB: lerpArm(CLUTCH.armB, PEEK.armB, peek), gripF: 75, gripB: 75 }}
    />
  );
};

const TitleCard = () => {
  const { shot } = useEpisode();
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const k = easeOut(P(shot.local, 0.15, 0.9));
  const lines = portrait ? ["I ONCE SAW", "THE FACE", "OF GOD"] : ["I ONCE SAW", "THE FACE OF GOD"];
  const fs = portrait ? 118 : 120;
  return (
    <AbsoluteFill style={{ background: "#030208" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
        <Starfield seed="title" n={120} x0={0} y0={0} w={width} h={height} t={shot.t} rMin={0.8} rMax={2.2} sparkles={8} opacity={0.7} />
        <g opacity={k}>
          {lines.map((ln, i) => (
            <text key={i} x={width / 2} y={height / 2 - ((lines.length - 1) * fs * 1.1) / 2 + i * fs * 1.1 + fs * 0.35} textAnchor="middle" fontFamily="Creepster, SpecialElite, serif" fontSize={fs} fill="#e8e2ff" stroke={INK} strokeWidth={6} paintOrder="stroke" letterSpacing={4}>
              {ln}
            </text>
          ))}
          <g transform={`translate(${width / 2} ${height / 2 + ((lines.length + 1) * fs * 1.1) / 2 + 30})`}>
            <GalaxyEye id="titleEye" cx={0} cy={0} r={34} t={shot.t} ball pupil={0.16} open={shot.local > 1.2 && shot.local < 1.4 ? 0.05 : 1} />
          </g>
        </g>
        <path d={sparkle(6)} transform={`translate(${width * 0.2} ${height * 0.2})`} fill="#fff" opacity={0.6} />
      </svg>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Shot list                                                           */
/* ------------------------------------------------------------------ */

const G = HEADS9.glim;
const R = HEADS9.rachel;
const pGlim = { x: G.x + 30, y: G.y + 40 };
const pRachel = { x: R.x - 30, y: R.y + 50 };
const pWin = { x: WIN_C[0], y: WIN_C[1] };
const COSMOS = "saturate(1.15) contrast(1.06)";
const ROOM = "saturate(0.82) contrast(1.1) brightness(0.95)";

const raw: ShotDef[] = [
  // intro: a pinprick, then the tunnel spits him out
  { name: "intro-void", start: 0, end: 2.6, transition: "fade", filter: "none", vignette: 1, render: () => <IntroVoid />, portrait: { zoom: 1.4 } },
  { name: "intro-tunnel", start: 2.6, end: T.once + 0.5, filter: "none", vignette: 0.9, render: () => <IntroTunnel />, portrait: { zoom: 1.4 } },
  // "I once saw the face of God,"
  { name: "drift", start: T.once + 0.5, end: T.face, filter: COSMOS, render: () => <Drift />, portrait: { x: 980, y: 640, zoom: 1.5 } },
  { name: "cu-glim-face", start: T.face, end: T.godEnd + 0.15, filter: COSMOS, render: () => <CuGlimFace />, portrait: { x: 985, y: 600 } },
  // (the pause) ... the silence takes a face
  { name: "god-reveal", start: T.godEnd + 0.15, end: T.vast, filter: COSMOS, render: () => <GodReveal />, portrait: { x: 960, y: 520, zoom: 1.6 } },
  // "a vast and sudden silence"
  { name: "silence", start: T.vast, end: T.among, filter: COSMOS, render: () => <Silence />, portrait: { x: 960, y: 560, zoom: 1.6 } },
  // "among the noisy heavens."
  { name: "noisy-heavens", start: T.among, end: T.heavensEnd + 0.25, filter: COSMOS, render: () => <Noisy />, portrait: { x: 960, y: 520, zoom: 1.7 } },
  { name: "glim-stare", start: T.heavensEnd + 0.25, end: T.evening, filter: COSMOS, render: () => <GlimStare />, portrait: { x: 998, y: 574 } },
  // "That evening I dreamed I listened to one side of a conversation I should not have overheard."
  { name: "sleep", start: T.evening, end: T.listened, filter: COSMOS, transition: "fade", render: () => <Sleep />, portrait: { x: 900, y: 640, zoom: 1.0 } },
  { name: "handset", start: T.listened, end: T.should, filter: COSMOS, render: () => <HandsetShot />, portrait: { x: 920, y: 520 } },
  { name: "overheard", start: T.should, end: T.overEnd + 0.3, filter: COSMOS, render: () => <Overheard />, portrait: { x: 960, y: 560, zoom: 1.5 } },
  // "I do not watch the skies anymore."
  { name: "telescope", start: T.overEnd + 0.3, end: T.skies, grade: "cave", transition: "slam", render: () => <TelescopeShot />, portrait: { x: 1760, zoom: 1.1 } },
  { name: "bed-skies", start: T.skies, end: T.lookUp, filter: ROOM, render: () => <BedSkies />, portrait: { x: 480, y: 470 } },
  // "I do not look up."  ...the camera does
  { name: "no-look-up", start: T.lookUp, end: NO_LOOK_END, filter: ROOM, render: () => <NoLookUp />, portrait: { x: (l) => lerp(pGlim.x, 640, easeInOut(prog(l, tiltFrom() - T.lookUp, NO_LOOK_END - 0.1 - T.lookUp))) } },
  // the gap: the trip, cut to the swells
  { name: "trip-fall", start: NO_LOOK_END, end: M.swell1, filter: "none", transition: "flash", vignette: 1, render: () => <TripFall />, portrait: { zoom: 1.5 } },
  { name: "trip-eyes", start: M.swell1, end: M.swell2, filter: "none", vignette: 1, render: () => <TripEyes />, portrait: { zoom: 1.35 } },
  { name: "trip-heads", start: M.swell2, end: M.hit, filter: "none", vignette: 1, render: () => <TripHeads />, portrait: { zoom: 1.3 } },
  { name: "trip-eye", start: M.hit, end: M.swell3, filter: "none", transition: "flash", vignette: 1, render: () => <TripEye />, portrait: { zoom: 1.25 } },
  { name: "trip-hands", start: M.swell3, end: M.swell4, filter: "none", vignette: 1, render: () => <TripHands />, portrait: { zoom: 1.35 } },
  { name: "trip-mouth", start: M.swell4, end: M.boom, filter: "none", vignette: 1, render: () => <TripMouth />, portrait: { zoom: 1.25 } },
  // the boom: a shack on a rock among the stars
  { name: "shack", start: M.boom, end: 47.18, filter: COSMOS, transition: "slam", render: () => <ShackReveal />, portrait: { x: 960, y: 560, zoom: 1.3 } },
  { name: "shack-push", start: 47.18, end: T.nights1 + 0.5, filter: COSMOS, render: () => <ShackPush />, portrait: { x: 1030, y: 560 } },
  // "Some nights... Some nights are darker. Some are almost black,"
  { name: "bed-wide", start: T.nights1 + 0.5, end: T.nights2, filter: ROOM, render: () => <BedWide />, portrait: { x: 640, y: 480, zoom: 1.25 } },
  { name: "cu-darker", start: T.nights2, end: T.black, filter: ROOM, render: () => <CuDarker />, portrait: pGlim },
  { name: "ecu-black", start: T.black, end: T.rachel - 0.1, filter: ROOM, render: () => <EcuBlack />, portrait: { x: G.x + 30, y: G.y } },
  // "...Rachel."  (his inner consciousness unspools from the third eye)
  { name: "two-rachel", start: T.rachel - 0.1, end: T.tonight, filter: ROOM, render: () => <TwoRachel />, portrait: { x: 600, y: 400, zoom: 1.05 } },
  // "Like tonight, it seems so dark."
  { name: "two-tonight", start: T.tonight, end: T.seems, filter: ROOM, render: () => <TwoTonight />, portrait: { x: 600, y: 400, zoom: 1.05 } },
  { name: "cu-rachel-listen", start: T.seems, end: T.scared - 1.15, filter: ROOM, render: () => <CuRachelListen />, portrait: pRachel },
  // "Scared of being alone."
  { name: "cu-glim-scared", start: T.scared - 1.15, end: T.notAlone - 0.15, filter: ROOM, render: () => <CuGlimScared />, portrait: pGlim },
  // "You know you're not alone."
  { name: "cu-rachel-notalone", start: T.notAlone - 0.15, end: T.no1 - 0.1, filter: ROOM, render: () => <CuRachelNotAlone />, portrait: pRachel },
  // "No."
  { name: "cu-glim-no", start: T.no1 - 0.1, end: T.what1 - 0.1, filter: ROOM, render: () => <CuGlimNo />, portrait: pGlim },
  // "What?"
  { name: "two-what", start: T.what1 - 0.1, end: T.whatWas - 0.4, filter: ROOM, render: () => <TwoWhat />, portrait: { x: (l) => lerp(560, 760, easeInOut(prog(l, 0.4, 1.6))), y: 420, zoom: 1.05 } },
  // "What was that?"
  { name: "window-pass", start: T.whatWas - 0.4, end: T.that - 0.55, filter: ROOM, render: () => <WindowPass />, portrait: pWin },
  { name: "cu-glim-whatwas", start: T.that - 0.55, end: T.dogs - 0.1, filter: ROOM, render: () => <CuGlimWhatWas />, portrait: pGlim },
  // "It's just the dogs."
  { name: "cu-rachel-dogs", start: T.dogs - 0.1, end: T.dogs + 0.75, filter: ROOM, render: () => <CuRachelDogs />, portrait: pRachel },
  { name: "dogs", start: T.dogs + 0.75, end: T.no2 - 0.1, filter: COSMOS, render: () => <DogsCut />, portrait: { x: 330, y: 560 } },
  // "No. I mean at the window."
  { name: "cu-glim-window", start: T.no2 - 0.1, end: T.atWin - 0.1, filter: ROOM, render: () => <CuGlimWindow />, portrait: { x: (l) => lerp(620, 1380, easeInOut(prog(l, 1.9, 2.8))), y: 450 } },
  // "At the window?"
  { name: "cu-rachel-atwindow", start: T.atWin - 0.1, end: T.atWin + 0.85, filter: ROOM, render: () => <CuRachelAtWin />, portrait: pRachel },
  // (silence) something almost seen
  { name: "window-almost", start: T.atWin + 0.85, end: T.winds - 0.1, filter: ROOM, render: () => <WindowAlmost />, portrait: { x: 1450, y: WIN_C[1] + 60 } },
  // "The wind's blowing, that's all. I'll lower it a little."
  { name: "rachel-lower", start: T.winds - 0.1, end: T.oh - 1.0, filter: ROOM, render: () => <RachelLower />, portrait: { x: (l) => lerp(820, 1420, easeInOut(prog(l, 0.1, 1.4))), y: 420, zoom: 1.0 } },
  // "Oh,"
  { name: "cu-glim-oh", start: T.oh - 1.0, end: T.thought - 0.1, filter: ROOM, render: () => <CuGlimOh />, portrait: pGlim },
  // "I thought I heard something."
  { name: "two-thought", start: T.thought - 0.1, end: 94.3, filter: ROOM, render: () => <TwoThought />, portrait: { x: (l) => lerp(560, 1350, easeInOut(prog(l, 1.6, 2.6))), y: 450, zoom: 1.0 } },
  { name: "window-breath", start: 94.3, end: T.wind - 0.1, filter: ROOM, render: () => <WindowBreath />, portrait: { x: 1525, y: 440 } },
  // "It's just the wind."
  { name: "cu-rachel-wind", start: T.wind - 0.1, end: T.windEnd + 0.4, filter: ROOM, render: () => <CuRachelWind />, portrait: pRachel },
  // the whispers ... the eye
  { name: "bed-calm", start: T.windEnd + 0.4, end: 99.9, filter: ROOM, render: () => <BedCalm />, portrait: { x: (l) => lerp(560, 1420, easeInOut(prog(l, 0.9, 1.8))), y: 470, zoom: 1.05 } },
  { name: "window-eye", start: 99.9, end: T.end, filter: ROOM, render: () => <WindowEye />, portrait: pWin },
  { name: "eye-stare", start: T.end, end: END - 1.9, filter: ROOM, render: () => <EyeStare />, portrait: { x: eyeStareX, y: 470, zoom: 1.6 } },
  { name: "title", start: END - 1.9, end: 999, filter: "none", transition: "slam", vignette: 0.5, render: () => <TitleCard /> },
];

export const shots: ShotDef[] = raw;
