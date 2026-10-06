import React from "react";
import { useVideoConfig } from "remotion";
import { useEpisode } from "../../engine/context";
import type { ShotDef } from "../../engine/EpisodePlayer";
import { camLerp, camPath } from "../../engine/Stage";
import { cue, Timeline } from "../../engine/timeline";
import { Pt, clamp, easeIn, easeInOut, easeOut, lerp, prog } from "../../engine/util";
import { MothGhost, MothHusk, MothXray } from "./cast/Husk";
import type { MothProps } from "./cast/Moth";
import { Apotheosis, TitleCard } from "./cutaways";
import { CAMX, EXT, ExteriorScene } from "./exterior";
import { CAML, LAMP, LampScene } from "./lamp";
import { GROUND_Y, LawnScene } from "./lawn";
import { CAM8, HEADS, PorchScene, PorchSceneProps, TAT_POS, WICK_POS } from "./porch";
import { Bag, Bars, Bat, EPIC, SkyScene, SpeedLines } from "./sky";
import timelineJson from "./timeline.json";

/**
 * EPISODE 008 — "Brother, I Crave the Forbidden Lamp".
 * Wick (young moth) craves the porch bulb; Tatter (the elder) survived his own flight toward the light — the moon —
 * and begs him not to go. Shot times are anchored to the script with cue().
 */
const tl = timelineJson as Timeline;
const at = (phrase: string, opts?: Parameters<typeof cue>[2]) => cue(tl, phrase, opts);

const T = {
  crave: at("Brother I crave the forbidden lamp"),
  seek: at("Seek not the lamp"),
  calls: at("Brother the light calls to me"),
  usAll: at("it calls to us all"),
  resist: at("You must resist it"),
  callDeath: at("the light is the call of death"),
  iKnow: at("I know brother and yet"),
  desire: at("I desire its forbidden touch"),
  cannot: at("You cannot touch it brother"),
  knowThis: at("I know this"),
  followed: at("I too once followed"),
  thought: at("I too once thought"),
  eternal: at("the eternal and unknowable light"),
  folly: at("It is folly"),
  indeed: at("Indeed"),
  youTouch: at("You touch the forbidden lamp and yet"),
  mortals: at("among mere mortals"),
  implausible: at("I find your words implausible"),
  hear: at("Hear me brother"),
  noOne: at("No one can"),
  farther: at("farther than infinity"),
  flew: at("I flew up and up"),
  beyond: at("beyond what I imagined possible"),
  until: at("until my wings failed me"),
  strength: at("strength was utterly spent"),
  burned: at("The light burned so brightly"),
  strained: at("I strained to touch it"),
  never: at("but it never got any closer"),
  thenFell: at("And then I fell brother"),
  fell: at("fell brother", { after: 80 }),
  ages: at("I fell for ages"),
  wind: at("the wind carrying me"),
  spiraling: at("spiraling downward"),
  retreated: at("And the lamp retreated from me"),
  mockery: at("as if in mockery"),
  darkness: at("and left me in darkness"),
  awoke: at("When I awoke"),
  survived: at("and I do not know how I survived"),
  sawThem: at("saw them brother"),
  others: at("Others of our kind"),
  wingsTorn: at("Their wings torn and scattered"),
  noneHad: at("None had touched the forbidden lamp"),
  noneEver: at("None ever will"),
  story: at("Your story reveals your weakness"),
  trep: at("Your trepidation prevailed"),
  fear: at("I do not fear the light"),
  faltered: at("Where others have faltered"),
  first: at("I will be the first to touch"),
  bathe: at("and bathe in the eternal glory"),
  perhaps: at("Perhaps when I become one"),
  trapped: at("trapped as you are"),
  noBrother: at("No brother Please reconsider"),
  fire: at("The lamp is a fire"),
  evenIf: at("Even if it could be touched"),
  destroy: at("It would simply destroy you"),
  destroyWord: at("destroy you", { after: 163 }),
  evenSo: at("even so I can no longer"),
  ifIgo: at("If I go to death"),
  parting: at("final parting"),
  forgiveMe: at("Forgive me brother for leaving"),
  forgiveFears: at("Forgive your fears"),
  ifLove: at("if you love me brother"),
  forsake: at("then forsake this mad quest"),
  iCannot: at("cannot", { after: 184 }),
  rememberMe: at("Remember me brother"),
  noWail: at("no", { after: 187.5 }),
  no2: at("No", { after: 189.5 }),
  fly: at("Fly then"),
  brotherhood: at("out of brotherhood"),
  forgiveness: at("out of forgiveness"),
  memory: at("out of memory"),
  shadow1: at("What is a brotherhood to a shadow"),
  shadow2: at("What is a shadow but what is left"),
  willNot: at("I will not remember"),
  asThough: at("it will be as though"),
  end: tl.duration,
};

/* ------------------------------------------------------------------ */
/* Continuity driven by the clock                                      */
/* ------------------------------------------------------------------ */

const Z_GNAT = 9.62;
const Z_TRAY = T.callDeath + 0.9;
const Z_FIRE = T.fire + 0.75;
const Z_FINAL = T.end + 0.12;
/** the zapper's kill counter */
const countAt = (t: number) => 4996 + (t >= Z_GNAT ? 1 : 0) + (t >= Z_TRAY ? 1 : 0) + (t >= Z_FIRE ? 1 : 0) + (t >= Z_FINAL ? 1 : 0);

const T_TAKE = T.rememberMe - 0.5;
/** Wick's wings open as he resolves to go */
const wingsAt = (t: number) => (t < T.evenSo ? 0 : t < T_TAKE ? lerp(0.1, 0.62, easeInOut(prog(t, T.evenSo, T.ifLove))) : 1);

/** Wick in the porch world: on the rail until take-off, then flying up toward the far-off bulb. */
function wickAt(t: number): Partial<MothProps> {
  if (t < T_TAKE) {
    const crouch = easeInOut(prog(t, T.iCannot + 0.2, T_TAKE - 0.05));
    return { x: WICK_POS.x, y: WICK_POS.y, wings: wingsAt(t), crouch, glint: 0.9 };
  }
  const tau = t - T_TAKE;
  const H1: Pt = [760, 580];
  const H2: Pt = [800, 360];
  const H3: Pt = [880, 240];
  let p: Pt;
  if (t < T.noWail) {
    const k = easeOut(clamp(tau / 0.7));
    p = [lerp(WICK_POS.x, H1[0], k), lerp(WICK_POS.y - 120, H1[1], k) + Math.sin(t * 5) * 10];
  } else if (t < T.memory) {
    const k = easeInOut(prog(t, T.noWail, T.memory));
    p = [lerp(H1[0], H2[0], k), lerp(H1[1], H2[1], k) + Math.sin(t * 5) * 8];
  } else {
    const k = easeInOut(prog(t, T.memory, T.memory + 3));
    const orb = Math.max(0, t - (T.memory + 2.5));
    p = [lerp(H2[0], H3[0], k) + Math.sin(orb * 2.2) * 90 * clamp(orb), lerp(H2[1], H3[1], k) + Math.cos(orb * 2.2) * 40 * clamp(orb)];
  }
  const far = clamp((WICK_POS.y - 120 - p[1]) / (WICK_POS.y - 120 - H3[1]));
  return { x: p[0], y: p[1] + 300, pose: "fly", flap: 1, wings: 1, scale: lerp(1, 0.4, far), bodyRot: 18, expr: "ecstatic", glint: 1, look: [0.5, -0.8] };
}

/** Tatter watches Wick go. */
function tatAt(t: number): Partial<MothProps> {
  if (t < T_TAKE) return {};
  return { look: [0.5, -0.95], headTilt: 10 };
}

const Porch: React.FC<PorchSceneProps> = (props) => {
  const { shot } = useEpisode();
  const t = shot.t;
  return (
    <PorchScene
      {...props}
      wick={props.wick === false ? false : { ...wickAt(t), ...props.wick }}
      tatter={props.tatter === false ? false : { ...tatAt(t), ...props.tatter }}
      set={{ count: countAt(t), ...props.set }}
    />
  );
};

const Lamp: React.FC<Parameters<typeof LampScene>[0]> = (props) => {
  const { shot } = useEpisode();
  return <LampScene count={countAt(shot.t)} {...props} />;
};

const P = (t: number, a: number, b: number) => prog(t, a, b);

/* ------------------------------------------------------------------ */
/* Opening                                                             */
/* ------------------------------------------------------------------ */

const ExtOpen = () => <ExteriorScene from={CAMX.wide} to={{ ...CAMX.wideIn, zoom: 1.45, x: 1150, y: 640 }} ease={easeIn} wick={[1120, 754]} tatter={[1160, 754]} />;

const CuWickCrave = () => <Porch from={CAM8.cuW} to={{ ...CAM8.cuW, zoom: 2.9, y: CAM8.cuW.y - 10 }} wick={{ expr: "yearn", look: [0.55, -0.85], perk: 1, glint: 1 }} tatter={{ expr: "grave" }} />;

const LampHero = () => {
  const { shot } = useEpisode();
  return <Lamp from={{ ...CAML.bulb, zoom: 1.5, y: 380 }} to={CAML.bulbTight} rays={0.6 + shot.p * 0.8} ring={0} />;
};

const EcuWickEyes = () => {
  const { shot } = useEpisode();
  const k = easeInOut(shot.p);
  return <Porch from={{ ...CAM8.ecuW, zoom: 3.8 }} to={{ ...CAM8.ecuW, zoom: 4.6, y: CAM8.ecuW.y + 20 }} wick={{ expr: "awe", look: [0.6, -0.9], proboscis: 0.15 + k * 0.6, perk: 1, glint: 1 }} />;
};

/** A gnat goes in. ZAP. The counter ticks. */
const LampGnatZap = () => {
  const { shot } = useEpisode();
  const l = shot.t;
  const zap = l >= Z_GNAT && l < Z_GNAT + 0.3 ? 1 - (l - Z_GNAT) / 0.3 : 0;
  const k = easeIn(clamp((l - (Z_GNAT - 0.6)) / 0.6));
  const g: Pt = [lerp(LAMP.zapper.x - 420, LAMP.zapper.x - 60, k), lerp(LAMP.zapper.y - 220, LAMP.zapper.y - 40, k) + Math.sin(l * 30) * 8];
  return (
    <Lamp
      from={{ ...CAML.zapper, zoom: 1.35, y: 520 }}
      to={{ ...CAML.zapper, zoom: 1.6, y: 540 }}
      zap={zap}
      shakeAmp={zap * 10}
      front={
        l < Z_GNAT ? (
          <g transform={`translate(${g[0]} ${g[1]})`}>
            <ellipse cx={-5} cy={-6} rx={9} ry={Math.floor(l * 24) % 2 ? 10 : 4} fill="#d8e0e8" opacity={0.75} />
            <ellipse cx={5} cy={-6} rx={9} ry={Math.floor(l * 24) % 2 ? 10 : 4} fill="#d8e0e8" opacity={0.75} />
            <ellipse rx={7} ry={5} fill="#0d0a0a" />
          </g>
        ) : (
          <g>
            {[0, 1].map((i) => {
              const ph = clamp((l - Z_GNAT) * 0.8 + i * 0.3);
              return <path key={i} d={`M${LAMP.zapper.x - 60 + i * 20},${LAMP.zapper.y - 60 - ph * 120} q-14,-20 0,-40 q14,-20 0,-40`} stroke="#b8b4ac" strokeWidth={8} fill="none" opacity={0.6 * (1 - ph)} strokeLinecap="round" />;
            })}
          </g>
        )
      }
    />
  );
};

const WickFlinch = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const flinch = clamp(1 - l / 0.35);
  return <Porch from={{ ...CAM8.msW, zoom: 1.9 }} to={{ ...CAM8.msW, zoom: 2.0, x: CAM8.msW.x + 30 }} wick={{ expr: l < 0.4 ? "shock" : "nervous", look: [0.9, -0.2], tremble: 0.6, headTilt: -10 * flinch, wings: 0.25 * flinch }} shakeAmp={flinch * 6} />;
};

/** Tatter steps out of the glare: a silhouette first, then the scars. */
const TatterReveal = () => {
  const { shot } = useEpisode();
  const lit = easeInOut(P(shot.local, 0.15, 1.1));
  return <Porch from={{ ...CAM8.msT, zoom: 1.45, y: CAM8.msT.y - 30 }} to={{ ...CAM8.cuT, zoom: 2.3 }} tatter={{ expr: "stern", shade: 0.85 * (1 - lit) + 0.08, look: [0.9, 0.1] }} wick={{ expr: "nervous" }} />;
};

const CuWickCalls = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.4, 1.6));
  return <Porch from={CAM8.cuW} to={{ ...CAM8.cuW, zoom: 2.7, x: CAM8.cuW.x + 20 }} wick={{ expr: "yearn", look: [lerp(0.9, 0.5, k), lerp(0, -0.85, k)], perk: k, headTilt: -8 * k, glint: 1 }} />;
};

const LampCult = () => <Lamp from={{ ...CAML.wide, zoom: 1.0, x: 840, y: 360 }} to={{ ...CAML.wide, zoom: 1.12, x: 800, y: 340 }} ring={1} swarmN={20} rays={1.1} />;

const CuTatterResist = () => <Porch from={CAM8.cuT} to={{ ...CAM8.cuT, zoom: 2.75 }} tatter={{ expr: "stern", look: [0.9, 0.1], armF: [70, 40] }} />;

/** "the call of death": the tray of the fried; a mosquito joins them. */
const ZapperTray = () => {
  const { shot } = useEpisode();
  const l = shot.t;
  const zap = l >= Z_TRAY && l < Z_TRAY + 0.3 ? 1 - (l - Z_TRAY) / 0.3 : 0;
  const k = easeIn(clamp((l - (Z_TRAY - 0.5)) / 0.5));
  const q: Pt = [lerp(LAMP.zapper.x + 380, LAMP.zapper.x + 120, k), lerp(LAMP.zapper.y + 60, LAMP.zapper.y + 120, k)];
  return (
    <Lamp
      from={{ ...CAML.tray, zoom: 2.0, y: 820 }}
      to={{ ...CAML.tray, zoom: 2.5, y: 840 }}
      zap={zap}
      shakeAmp={zap * 8}
      swarm={0}
      front={
        l < Z_TRAY ? (
          <g transform={`translate(${q[0]} ${q[1]})`}>
            <path d="M0,0 l-30,-30 M0,0 l-36,8 M-6,4 l-20,30" stroke="#1a1414" strokeWidth={3} />
            <ellipse cx={-8} cy={-14} rx={16} ry={Math.floor(l * 24) % 2 ? 6 : 2} fill="#d8e0e8" opacity={0.7} />
            <ellipse rx={10} ry={4} fill="#3a2a1a" />
            <path d="M8,0 l24,-2" stroke="#1a1414" strokeWidth={3} />
          </g>
        ) : (
          <MothHusk x={LAMP.zapper.x + 120} y={lerp(LAMP.zapper.y + 120, LAMP.zapper.y + 300, clamp((l - Z_TRAY) * 2.5))} s={0.18} t={l} smoke={1} />
        )
      }
    />
  );
};

const TwoWickLong = () => {
  const { shot } = useEpisode();
  const sigh = easeInOut(P(shot.t, T.iKnow + 1.4, T.iKnow + 2.6)) * (1 - easeInOut(P(shot.t, T.iKnow + 3.0, T.iKnow + 3.6)));
  return <Porch from={CAM8.two} to={{ ...CAM8.two, zoom: 1.42, x: 880 }} wick={{ expr: sigh > 0.5 ? "yearn" : "hurt", look: [0.6, -0.6 - sigh * 0.3], headTilt: -12 * sigh, perk: 0.6 }} tatter={{ expr: "sad", look: [0.9, 0.2] }} />;
};

/** "I desire its forbidden touch": a leg raised toward the bulb, proboscis out. */
const WickTouch = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.2, 1.6));
  return <Porch from={{ ...CAM8.lookUp, zoom: 1.35, y: 380 }} to={{ ...CAM8.lookUp, zoom: 1.6, x: 760, y: 330 }} wick={{ expr: "yearn", look: [0.5, -0.95], armF: [lerp(16, 150, k), lerp(46, 10, k)], proboscis: k * 0.9, perk: 1, headTilt: -14 * k, glint: 1 }} tatter={{ expr: "grave" }} />;
};

const CuTatterCannot = () => {
  const { shot } = useEpisode();
  return <Porch from={{ ...CAM8.cuT, zoom: 2.6 }} to={{ ...CAM8.cuT, zoom: 2.95 }} tatter={{ expr: "bitter", look: [0.9, 0.1], armF: [96, 10] }} shakeAmp={shot.local < 0.5 ? 7 : 2} />;
};

const EcuTatterKnow = () => <Porch from={{ ...CAM8.ecuT, zoom: 3.8 }} to={{ ...CAM8.ecuT, zoom: 4.6 }} tatter={{ expr: "grave", look: [0.9, 0.2] }} />;

const TatterFollowed = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.5, 2.5));
  return <Porch from={CAM8.msT} to={{ ...CAM8.msT, zoom: 1.85, y: CAM8.msT.y - 40 }} tatter={{ expr: "haunted", look: [0.5, -0.9], wings: k * 0.42, headTilt: 12 * k }} wick={{ expr: "neutral", look: [0.9, 0] }} />;
};

const CuTatterThought = () => {
  const { shot } = useEpisode();
  const k = easeInOut(shot.p);
  return <Porch from={{ ...CAM8.cuT, zoom: 2.5, y: CAM8.cuT.y - 20 }} to={{ ...CAM8.cuT, zoom: 2.9, y: CAM8.cuT.y - 36 }} tatter={{ expr: "yearn", look: [0.5, -0.95], perk: lerp(-0.4, 0.5, k), headTilt: 16, glint: 0.8 }} />;
};

const BulbEternal = () => {
  const { shot } = useEpisode();
  return <Lamp from={{ ...CAML.bulbTight, zoom: 2.3 }} to={{ ...CAML.bulbTight, zoom: 3.6, y: 330 }} rays={1.5} swarm={0.6} shakeAmp={0} front={null} back={null} overlay={null} ring={shot.p > 2 ? 1 : 0} />;
};

const CuTatterFolly = () => <Porch from={CAM8.cuT} to={{ ...CAM8.cuT, zoom: 2.7 }} tatter={{ expr: "sad", look: [0.6, 0.8], perk: -1, headTilt: -8 }} />;

const CuWickIndeed = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.t, T.indeed + 1.2, T.indeed + 1.7));
  return <Porch from={CAM8.cuW} to={{ ...CAM8.cuW, zoom: 2.75, x: CAM8.cuW.x + 25 }} wick={{ expr: "scoff", look: [0.9, 0.1], headTilt: 10, armF: [lerp(16, 92, k), lerp(46, 8, k)] }} />;
};

const MsWickTouch = () => {
  const { shot } = useEpisode();
  const sweep = Math.sin(shot.local * 2.2) * 30;
  return <Porch from={{ ...CAM8.two, zoom: 1.5, x: 780 }} to={{ ...CAM8.two, zoom: 1.6, x: 820 }} wick={{ expr: "smug", look: [0.9, 0], armF: [100 + sweep, 20], headTilt: 6 }} tatter={{ expr: "grave", look: [0.9, 0.1] }} />;
};

const CuTatterMortals = () => <Porch from={{ ...CAM8.msT, zoom: 1.9, y: CAM8.msT.y + 40 }} to={{ ...CAM8.msT, zoom: 2.1, y: CAM8.msT.y + 50 }} tatter={{ expr: "deadpan", look: [0.9, 0.2], dust: 14 }} />;

const CuWickImplausible = () => <Porch from={CAM8.cuW} to={{ ...CAM8.cuW, zoom: 2.75 }} wick={{ expr: "smug", look: [0.9, 0.1], headTilt: 14, armF: [60, 110], armB: [60, 110] }} />;

const CuTatterHear = () => {
  const { shot } = useEpisode();
  const k = P(shot.t, T.hear + 1.2, T.hear + 1.6);
  return <Porch from={{ ...CAM8.cuT, zoom: 2.9 }} to={{ ...CAM8.cuT, zoom: 2.55 }} ease={easeOut} tatter={{ expr: k < 0.5 ? "bitter" : "pleading", look: [0.9, 0.1], armF: [110, 20] }} shakeAmp={shot.local < 0.6 ? 8 : 1} />;
};

const TwoNoOne = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.2, 1.2));
  return <Porch from={{ ...CAM8.wide, zoom: 1.05, y: 480 }} to={{ ...CAM8.wideHigh, zoom: 1.12, y: 400 }} wick={{ expr: "awe", look: [0.5, lerp(0, -0.95, k)], glint: 1 }} tatter={{ expr: "grave", look: [0.5, lerp(0.1, -0.95, k)] }} />;
};

/** "farther than infinity": up past the bulb, out of the porch, to the moon. */
const MoonInfinity = () => {
  const { shot } = useEpisode();
  const cam = camPath(
    [
      [0, { x: 1080, y: 520, zoom: 1.3 }],
      [1.6, { x: 640, y: 260, zoom: 1.3 }],
      [5.0, { x: 130, y: 160, zoom: 3.6 }],
    ],
    shot.local,
  );
  return <Porch from={cam} cam={cam} wick={{ expr: "awe", look: [-0.2, -0.95] }} tatter={{ expr: "haunted", look: [0.5, -0.95] }} set={{ rays: 0.9 }} />;
};

/* ------------------------------------------------------------------ */
/* Flashback: up and up, and down                                      */
/* ------------------------------------------------------------------ */

const YOUNG: Partial<MothProps> = { young: true, mute: true };

/** Young Tatter on the rail, under the moon. Crouch... launch. */
const FbLaunch = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const crouch = easeInOut(P(l, 0, 0.6)) * (1 - easeOut(P(l, 0.62, 0.75)));
  const go = easeInOut(P(l, 0.7, 2.1));
  const flying = l > 0.7;
  const cam = camLerp({ x: 430, y: 640, zoom: 1.4 }, { x: 250, y: 300, zoom: 1.15 }, easeInOut(P(l, 0.55, 2.15)));
  return (
    <>
      <Porch
        from={cam}
        cam={cam}
        wick={false}
        tatter={{
          ...YOUNG,
          x: lerp(470, 210, go),
          y: lerp(905, 330, go),
          flip: true,
          pose: flying ? "fly" : "stand",
          flap: flying ? 1 : 0,
          wings: flying ? 1 : 0.4,
          crouch,
          bodyRot: flying ? 35 : 0,
          expr: flying ? "ecstatic" : "yearn",
          look: [0.5, -0.9],
          scale: lerp(1, 0.7, go),
        }}
        set={{ swarm: 0 }}
      />
      <Bars />
    </>
  );
};

const FbRise = () => {
  const { shot } = useEpisode();
  const cam = camLerp({ x: 960, y: 640, zoom: 0.9 }, { x: 1000, y: -900, zoom: 0.95 }, easeInOut(shot.p));
  const m = { x: cam.x - 40 + Math.sin(shot.local * 2) * 30, y: cam.y + 170 };
  return (
    <>
      <SkyScene from={cam} cam={cam} moth={{ ...m, bodyRot: 70, expr: "ecstatic", look: [0.4, -0.9] }} moon={{ fy: 0.24, fr: 0.1 }} screen={<SpeedLines t={shot.t} amount={0.5} dir={-1} />} />
      <Bars />
    </>
  );
};

const FbClouds = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const sputter = 1 - easeIn(P(l, 0.6, 2.0)) * 0.75;
  const cam = camLerp({ x: 1000, y: -1500, zoom: 1.05 }, { x: 1000, y: -2550, zoom: 1.25 }, easeOut(shot.p));
  const m = { x: cam.x + Math.sin(l * 3) * 30, y: cam.y + 150 + easeIn(P(l, 1.2, 2.1)) * 60 };
  return (
    <>
      <SkyScene from={cam} cam={cam} moth={{ ...m, flap: sputter, bodyRot: 60, expr: "strain", look: [0.4, -0.9], dust: 18 }} moon={{ fy: 0.24, fr: 0.11 }} />
      <Bars />
    </>
  );
};

const FbSpent = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const m = { x: 1000 + Math.sin(l * 1.5) * 10, y: -3000 + l * 30 };
  return (
    <>
      <SkyScene from={{ x: 1010, y: -3130, zoom: 2.6 }} to={{ x: 1010, y: -3110, zoom: 3.0 }} moth={{ ...m, flap: 0.25, bodyRot: 20, expr: "dazed", spent: 1, look: [0.2, -0.6], dust: 10 }} moon={{ fy: 0.24, fr: 0.12 }} />
      <Bars />
    </>
  );
};

const FbBright = () => {
  const { shot } = useEpisode();
  const k = shot.p;
  return (
    <>
      <SkyScene clouds={false} from={{ x: 960, y: -6300, zoom: 0.85 }} to={{ x: 960, y: -6450, zoom: 0.95 }} moth={{ x: 960, y: -6000 - k * 260, flap: 0.6, bodyRot: 60, shade: 0.92, expr: "awe", scale: 0.32 }} moon={{ fy: 0.38, fr: 0.3, glow: 1.4 }} />
      <Bars />
    </>
  );
};

/** Push in on him; the moon stays exactly the same size. */
const FbReach = () => {
  const { shot } = useEpisode();
  const k = easeInOut(shot.p);
  return (
    <>
      <SkyScene
        clouds={false}
        from={{ x: 960, y: -6620, zoom: 1.0 }}
        to={{ x: 1000, y: -6650, zoom: 2.4 }}
        moth={{ x: 960, y: -6520, flap: 0.7, bodyRot: 40, shade: 0.35, expr: "strain", armF: [150, 0], armB: [140, 10], scale: 0.42, look: [0.3, -0.9] }}
        moon={{ fy: 0.27, fr: 0.2, glow: 1.2 }}
      />
      <Bars k={1 - k * 0.2} />
    </>
  );
};

/** "And then I fell": the wings stop. He hangs there. Then he doesn't. */
const FbHang = () => {
  const { shot } = useEpisode();
  const l = shot.t;
  const stop = P(l, T.thenFell + 0.6, T.fell - 0.2);
  const drop = Math.max(0, l - T.fell);
  return (
    <>
      <SkyScene
        clouds={false}
        from={{ x: 980, y: -6640, zoom: 2.0 }}
        moth={{ x: 980, y: -6560 + 0.5 * 4200 * drop * drop, flap: 1 - stop, wings: lerp(1, 0.5, stop), bodyRot: lerp(40, 0, stop), expr: stop > 0.5 ? "deadpan" : "strain", look: stop > 0.5 ? [0, 0.4] : [0.3, -0.9], scale: 0.42, shade: 0.3 }}
        moon={{ fy: 0.27, fr: 0.2, glow: 1.1 }}
      />
      <Bars />
    </>
  );
};

const FbFall = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const y = -6200 + l * 1500;
  return (
    <>
      <SkyScene cam={{ x: 980, y: y - 60, zoom: 1.4, rot: Math.sin(l * 2) * 6 }} from={{ x: 980, y, zoom: 1.4 }} moth={{ x: 980 + Math.sin(l * 4) * 40, y, flap: 0, wings: 0.6, bodyRot: l * 520, expr: "shock", look: [0, 0.2], scale: 0.42, dust: 16 }} moon={{ fy: 0.24, fr: 0.12 }} screen={<SpeedLines t={shot.t} amount={0.8} dir={1} />} />
      <Bars />
    </>
  );
};

const FbWind = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const x = 300 + l * 560;
  const y = -2300 + Math.sin(l * 2.4) * 140 + l * 120;
  return (
    <>
      <SkyScene
        from={{ x: 300, y: -2300, zoom: 1.1 }}
        cam={{ x: x - 40, y: y - 40, zoom: 1.15 }}
        moth={{ x, y, flap: 0.15, wings: 0.8, bodyRot: -30 + Math.sin(l * 3) * 40, expr: "dazed", scale: 0.42, dust: 10 }}
        moon={{ fy: 0.22, fr: 0.1 }}
        front={<Bag x={x + 260} y={y - 90 + Math.sin(l * 3) * 40} s={1.1} t={shot.t} />}
      />
      <Bars />
    </>
  );
};

const FbSpiral = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const ang = l * 4.2;
  const cy = -1500 + l * 520;
  const x = 980 + Math.cos(ang) * 220;
  const y = cy + Math.sin(ang) * 90;
  const batK = P(shot.t, T.spiraling + 1.4, T.spiraling + 2.6);
  return (
    <>
      <SkyScene
        from={{ x: 980, y: cy, zoom: 1.0 }}
        cam={{ x: 980, y: cy, zoom: 1.05, rot: l * 46 }}
        moth={{ x, y, flap: 0, wings: 0.7, bodyRot: -ang * 57 + 90, expr: "dazed", scale: 0.42, dust: 8 }}
        moon={{ fy: 0.22, fr: 0.1 }}
        front={batK > 0 && batK < 1 ? <Bat x={lerp(-200, 2200, batK)} y={cy - 260 + Math.sin(batK * Math.PI) * 300} s={1.3} t={shot.t} /> : null}
      />
      <Bars />
    </>
  );
};

/** POV looking up: the light shrinks away. His leg reaches into frame. */
const FbRetreat = () => {
  const { shot } = useEpisode();
  const k = easeInOut(shot.p);
  return (
    <>
      <SkyScene
        from={{ x: 960, y: -900, zoom: 1.0 }}
        to={{ x: 960, y: -860, zoom: 1.0 }}
        moon={{ fy: 0.3, fr: lerp(0.2, 0.06, k), glow: lerp(1.2, 0.5, k) }}
        screen={<ScreenLeg k={k} t={shot.t} />}
      />
      <Bars />
    </>
  );
};

const ScreenLeg: React.FC<{ k: number; t: number }> = ({ k, t }) => {
  const { width: W, height: H } = useVideoConfig();
  const sway = Math.sin(t * 3) * 0.01;
  const knee: Pt = [W * (0.56 + sway), H * lerp(0.62, 0.7, k)];
  const tip: Pt = [W * (0.6 + sway * 1.5), H * lerp(0.4, 0.5, k)];
  const base: Pt = [W * 0.48, H * 1.15];
  const S = Math.min(W, H);
  const d = `M${base[0]},${base[1]} L${knee[0]},${knee[1]} L${tip[0]},${tip[1]}`;
  return (
    <g>
      <path d={d} stroke="#f6efd2" strokeWidth={S * 0.1} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />
      <path d={d} stroke="#140d0b" strokeWidth={S * 0.085} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke="#2a2420" strokeWidth={S * 0.06} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {[0.3, 0.55, 0.8].map((q) => (
        <path key={q} d={`M${lerp(knee[0], tip[0], q)},${lerp(knee[1], tip[1], q)} l${-S * 0.03},${-S * 0.012}`} stroke="#140d0b" strokeWidth={S * 0.01} strokeLinecap="round" />
      ))}
      <path d={`M${tip[0]},${tip[1]} l${S * 0.03},${-S * 0.04} M${tip[0]},${tip[1]} l${-S * 0.012},${-S * 0.048}`} stroke="#140d0b" strokeWidth={S * 0.016} strokeLinecap="round" />
    </g>
  );
};

const FbMock = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.3, 2.2));
  return (
    <>
      <SkyScene from={{ x: 960, y: -500, zoom: 0.9 }} to={{ x: 960, y: -420, zoom: 0.92 }} moth={{ x: 960 + Math.sin(shot.t * 2) * 40, y: 30 + shot.local * 40, flap: 0.3, wings: 0.7, bodyRot: Math.sin(shot.t * 5) * 30, shade: 0.55, scale: 0.24, expr: "shock" }} moon={{ fy: 0.28, fr: 0.08, smirk: k, glow: 0.7 }} />
      <Bars />
    </>
  );
};

const FbDark = () => {
  const { shot } = useEpisode();
  const k = easeIn(P(shot.local, 0.1, 1.6));
  return (
    <>
      <SkyScene from={{ x: 960, y: 520, zoom: 0.95 }} to={{ x: 960, y: 640, zoom: 1.0 }} moth={{ x: 1000, y: 560 + shot.local * 260, flap: 0, wings: 0.5, bodyRot: shot.local * 300, shade: 0.25, scale: 0.34, expr: "dazed" }} moon={{ fy: 0.2, fr: 0.05, smirk: 1, glow: 0.4 }} dark={k} />
      <Bars />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* The lawn                                                            */
/* ------------------------------------------------------------------ */

const SCARRED: Partial<MothProps> = { scars: { peg: "stump", torn: true, cloudy: true, stumpMid: true, bentAntenna: true, bald: false } };

/** POV from the grass: the zapper glowing above, the eyelids peeling open. */
const LawnWakePov = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const open1 = easeInOut(P(l, 0.1, 0.5)) * (1 - easeInOut(P(l, 0.55, 0.7))) + easeInOut(P(l, 0.8, 1.3));
  return (
    <>
      <LawnScene from={{ x: 1600, y: -760, zoom: 0.9 }} to={{ x: 1640, y: -800, zoom: 0.95 }} tatter={false} screen={<PovFrame open={clamp(open1)} t={shot.t} />} />
      <Bars />
    </>
  );
};

/** Blades leaning in from the frame edges + black eyelids, in screen pixels. */
const PovFrame: React.FC<{ open: number; t: number }> = ({ open, t }) => {
  const { width: W, height: H } = useVideoConfig();
  const lid = (1 - open) * H * 0.55;
  const blades = [
    [0.02, 0.38, 0.1],
    [0.12, 0.22, 0.08],
    [0.22, 0.42, 0.07],
    [0.82, 0.3, 0.09],
    [0.93, 0.18, 0.1],
    [0.7, 0.46, 0.06],
  ];
  return (
    <g>
      {blades.map(([bx, tipY, w], i) => {
        const sway = Math.sin(t * 1.3 + i) * W * 0.01;
        const x0 = bx * W;
        const tx = W * 0.5 + (x0 - W * 0.5) * 0.45 + sway;
        return <path key={i} d={`M${x0 - w * W},${H * 1.1} Q${(x0 + tx) / 2},${H * 0.6} ${tx},${tipY * H} Q${(x0 + tx) / 2 + w * W * 0.6},${H * 0.62} ${x0 + w * W},${H * 1.1} Z`} fill="#0a140f" stroke="#140d0b" strokeWidth={6} />;
      })}
      <path d={`M0,0 L${W},0 L${W},${lid} Q${W / 2},${lid + H * 0.08 * open} 0,${lid} Z`} fill="#050403" />
      <path d={`M0,${H} L${W},${H} L${W},${H - lid} Q${W / 2},${H - lid - H * 0.08 * open} 0,${H - lid} Z`} fill="#050403" />
    </g>
  );
};

/** Lying on his back in the grass, the fresh scar, the cloudy eye open. */
const LawnWakeCu = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.1, 0.8));
  return (
    <>
      <LawnScene
        from={{ x: 830, y: 860, zoom: 2.3 }}
        to={{ x: 830, y: 850, zoom: 2.6 }}
        clearX={830}
        tatter={{ ...SCARRED, x: 963, y: 1190, bodyRot: 80, expr: k > 0.5 ? "dazed" : "wail", look: [0.1, -0.9], wings: 0, mute: true, dust: 0 }}
      />
      <Bars />
    </>
  );
};

const LawnLeg = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const lookDown = P(l, 0.9, 1.3);
  return (
    <>
      <LawnScene
        from={{ x: 960, y: 800, zoom: 1.45 }}
        to={{ x: 990, y: 800, zoom: 1.55 }}
        clearX={900}
        tatter={{ ...SCARRED, x: 760, y: GROUND_Y, crouch: 1, expr: lookDown > 0.5 ? "haunted" : "dazed", look: lookDown > 0.5 ? [0.8, 0.9] : [0.4, -0.2], wings: 0.3, mute: true, headTilt: lookDown * 12 }}
        legTwitch={1}
      />
      <Bars />
    </>
  );
};

const LawnSaw = () => (
  <>
    <LawnScene from={{ x: 790, y: 630, zoom: 2.4 }} to={{ x: 800, y: 620, zoom: 2.9 }} clearX={790} tatter={{ ...SCARRED, x: 760, y: GROUND_Y, expr: "haunted", look: [0.9, 0.3], wings: 0.3, mute: true, tremble: 0.5 }} />
    <Bars />
  </>
);

const LawnGraveyard = () => (
  <>
    <LawnScene from={{ x: 300, y: 780, zoom: 1.35 }} to={{ x: 2300, y: 800, zoom: 1.45 }} ease={(x) => x} tatter={false} />
    <Bars />
  </>
);

const LawnWings = () => (
  <>
    <LawnScene from={{ x: 1200, y: 420, zoom: 1.0 }} to={{ x: 1500, y: 470, zoom: 1.12 }} wind={1.2} tatter={false} />
    <Bars />
  </>
);

const LawnTilt = () => {
  const { shot } = useEpisode();
  const cam = camLerp({ x: 1400, y: 700, zoom: 1.2 }, { x: 1550, y: -700, zoom: 0.78 }, easeInOut(P(shot.local, 0.2, 2.6)));
  return (
    <>
      <LawnScene from={cam} cam={cam} tatter={false} drop={shot.local - 0.9} />
      <Bars />
    </>
  );
};

const CuTatterNever = () => <Porch from={{ ...CAM8.cuT, zoom: 2.4 }} to={{ ...CAM8.cuT, zoom: 2.8 }} tatter={{ expr: "sad", look: [0.6, 0.6], tears: 0.8, perk: -1 }} />;

/* ------------------------------------------------------------------ */
/* Defiance                                                            */
/* ------------------------------------------------------------------ */

const CuWickWeakness = () => {
  const { shot } = useEpisode();
  const clap = Math.max(0, Math.sin(shot.local * 9)) * 20;
  return <Porch from={CAM8.cuW} to={{ ...CAM8.cuW, zoom: 2.7 }} wick={{ expr: "scoff", look: [0.9, 0.1], headTilt: 8, armF: [80 + clap, 60], armB: [80 - clap * 0.5, 70] }} />;
};

const TwoTrepidation = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.3, 1.5));
  const deflate = P(shot.t, T.trep + 1.8, T.trep + 2.6);
  return <Porch from={{ ...CAM8.two, zoom: 1.35, x: 960 }} to={{ ...CAM8.two, zoom: 1.6, x: 980 }} wick={{ expr: "smug", look: [0.9, 0], bodyRot: -8 * k, armF: [94, 10] }} tatter={{ expr: deflate > 0.5 ? "sad" : "grave", look: [0.9, 0.2], perk: lerp(0, -1, deflate) }} />;
};

const CuWickFear = () => <Porch from={{ ...CAM8.cuW, zoom: 2.3, y: CAM8.cuW.y + 40 }} to={{ ...CAM8.cuW, zoom: 2.6 }} wick={{ expr: "defiant", look: [0.9, 0], wings: 0.3, headTilt: -10, perk: 1 }} />;

const WickFaltered = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.4, 2.4));
  return <Porch from={{ x: 700, y: 640, zoom: 1.4 }} to={{ x: 700, y: 560, zoom: 1.55, rot: -3 }} wick={{ expr: "defiant", look: [0.6, -0.6], wings: lerp(0.3, 0.85, k), armF: [lerp(46, 120, k), 30], perk: 1, dust: 10 }} tatter={{ expr: "grave" }} set={{ rays: 0.9 }} />;
};

/** Hero pose against the light. */
const WickGlory = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0, 2.4));
  return <Porch from={{ x: 760, y: 520, zoom: 1.25 }} to={{ x: 820, y: 330, zoom: 1.35 }} wick={{ expr: "ecstatic", look: [0.5, -0.9], wings: 1, armF: [140, 20], armB: [130, 20], perk: 1, glint: 1, dust: 14 }} tatter={{ expr: "grave", look: [0.9, 0.1] }} set={{ rays: 1 + k * 0.8 }} />;
};

/** "...and bathe in the eternal glory of its light": hugging the hot bulb, sizzling, blissful. */
const BatheFantasy = () => {
  const { shot } = useEpisode();
  const t = shot.t;
  return (
    <Lamp
      from={{ ...CAML.bulb, zoom: 1.7, y: 360 }}
      to={{ ...CAML.bulb, zoom: 2.0, y: 340 }}
      rays={1.4}
      swarm={0.4}
      wick={{ x: 640, y: 560, scale: 0.62, pose: "fly", flap: 0.2, wings: 0.8, bodyRot: -20, expr: "ecstatic", armF: [120, 60], armB: [110, 60], look: [0.5, -0.4], glint: 1 }}
      front={
        <g>
          {[0, 1, 2, 3].map((i) => {
            const ph = (t * 0.7 + i / 4) % 1;
            return <path key={i} d={`M${600 + i * 30},${400 - ph * 200} q-14,-20 0,-40 q14,-20 0,-40`} stroke="#d8d4cc" strokeWidth={8} fill="none" opacity={0.55 * (1 - ph)} strokeLinecap="round" />;
          })}
        </g>
      }
    />
  );
};

const CuWickDivine = () => <Porch from={CAM8.cuW} to={{ ...CAM8.cuW, zoom: 2.7, x: CAM8.cuW.x + 30 }} wick={{ expr: "smug", look: [0.9, 0.3], headTilt: 16, armF: [100, 40] }} />;

/** "...trapped as you are in your mortal frailties": tilt from his face down to the match and the stump. */
const TatterFrail = () => {
  return <Porch from={{ ...CAM8.cuT, zoom: 2.4 }} to={{ x: TAT_POS.x - 10, y: TAT_POS.y - 110, zoom: 2.3 }} tatter={{ expr: "hurt", look: [0.4, 0.8], perk: -0.8 }} />;
};

const CuTatterPlease = () => <Porch from={{ ...CAM8.cuT, zoom: 2.45 }} to={{ ...CAM8.cuT, zoom: 2.8 }} tatter={{ expr: "pleading", look: [0.9, 0], armF: [100, 30], tears: 0.3 }} />;

/** "The lamp is a fire that burns body and soul": one of the faithful, X-rayed. */
const ZapperFire = () => {
  const { shot } = useEpisode();
  const l = shot.t;
  const zap = l >= Z_FIRE && l < Z_FIRE + 0.45 ? 1 - (l - Z_FIRE) / 0.45 : 0;
  const k = easeIn(clamp((l - (Z_FIRE - 0.9)) / 0.9));
  const xr = l >= Z_FIRE && l < Z_FIRE + 0.4 && Math.floor((l - Z_FIRE) * 12) % 2 === 0;
  const mx = lerp(LAMP.zapper.x - 520, LAMP.zapper.x - 80, k);
  const my = lerp(LAMP.zapper.y - 240, LAMP.zapper.y - 40, k);
  return (
    <Lamp
      from={{ ...CAML.zapper, zoom: 1.25, x: 1300, y: 640 }}
      to={{ ...CAML.zapper, zoom: 1.4, x: 1350, y: 660 }}
      zap={zap}
      shakeAmp={zap * 12}
      swarm={0.5}
      front={
        l < Z_FIRE ? (
          <g transform={`translate(${mx} ${my}) scale(0.5)`}>
            <path d={`M0,0 C-30,${Math.floor(l * 24) % 2 ? -60 : -20} -70,-30 -60,10 Z M0,0 C30,${Math.floor(l * 24) % 2 ? -60 : -20} 70,-30 60,10 Z`} fill="#a89a80" stroke="#140d0b" strokeWidth={4} />
            <ellipse rx={12} ry={24} fill="#7a6a54" stroke="#140d0b" strokeWidth={4} />
          </g>
        ) : xr ? (
          <MothXray x={LAMP.zapper.x - 80} y={LAMP.zapper.y + 80} s={0.28} />
        ) : (
          <MothHusk x={LAMP.zapper.x - 70} y={lerp(LAMP.zapper.y - 40, LAMP.zapper.y + 300, clamp((l - Z_FIRE - 0.4) * 1.5))} s={0.4} t={l} rot={(l - Z_FIRE) * 200} />
        )
      }
    />
  );
};

const FantasyAsItIs = () => <Apotheosis from={{ x: 980, y: 560, zoom: 1.0 }} to={{ x: 990, y: 470, zoom: 1.25 }} />;

const FantasyCrack = () => {
  const { shot } = useEpisode();
  return <Apotheosis from={{ x: 990, y: 470, zoom: 1.25 }} to={{ x: 990, y: 420, zoom: 1.6 }} crack={easeIn(shot.p)} shakeAmp={shot.p * 4} />;
};

const FantasyRuin = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  if (l < 0.35) return <Apotheosis from={{ x: 990, y: 420, zoom: 1.6 }} crack={1} shatter={l / 0.35} shakeAmp={14} />;
  return <Apotheosis from={{ x: 980, y: 700, zoom: 1.4 }} to={{ x: 980, y: 720, zoom: 1.6 }} ruin shakeAmp={l < 0.6 ? 6 : 0} />;
};

/* ------------------------------------------------------------------ */
/* The parting                                                         */
/* ------------------------------------------------------------------ */

const CuWickEvenSo = () => <Porch from={{ ...CAM8.cuW, zoom: 2.4 }} to={{ ...CAM8.cuW, zoom: 2.9, y: CAM8.cuW.y - 20 }} wick={{ expr: "yearn", look: [0.5, -0.9], perk: 1, glint: 1, proboscis: 0.3, headTilt: -10 }} />;

const WideParting = () => <Porch from={{ ...CAM8.wide, zoom: 0.98, y: 500 }} to={{ ...CAM8.wide, zoom: 1.12, x: 860, y: 470 }} wick={{ expr: "tender", look: [0.5, -0.85], glint: 1, perk: 1, dust: 10 }} tatter={{ expr: "sad", look: [0.9, 0.1] }} set={{ rays: 0.9 }} />;

/** "...this is our final parting": his brother's face. */
const CuTatterParting = () => <Porch from={{ ...CAM8.cuT, zoom: 2.4 }} to={{ ...CAM8.cuT, zoom: 2.7, y: CAM8.cuT.y - 10 }} tatter={{ expr: "hurt", look: [0.9, 0], tears: 0.5, tremble: 0.3 }} />;

/** "...then forsake this mad quest": Wick turns his face back to the light. */
const TwoQuest = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.5, 1.3));
  return <Porch from={{ ...CAM8.two, zoom: 1.45, x: 940 }} to={{ ...CAM8.two, zoom: 1.55, x: 930 }} wick={{ expr: k > 0.5 ? "yearn" : "hurt", look: [lerp(0.9, 0.5, k), lerp(0, -0.85, k)], glint: 1 }} tatter={{ expr: "pleading", look: [0.9, 0], tears: 1, armF: [90, 30] }} />;
};

const CuWickForgive = () => <Porch from={CAM8.cuW} to={{ ...CAM8.cuW, zoom: 2.7 }} wick={{ expr: "tender", look: [0.9, 0.2], tears: 0.6, headTilt: 8 }} />;

const TwoForgive = () => {
  const { shot } = useEpisode();
  const k = easeInOut(P(shot.local, 0.2, 1.2));
  return <Porch from={{ ...CAM8.two, zoom: 1.5, x: 920 }} to={{ ...CAM8.two, zoom: 1.7, x: 930 }} wick={{ expr: "tender", look: [0.9, 0], armF: [lerp(46, 100, k), lerp(46, 0, k)], tears: 0.5 }} tatter={{ expr: "sad", look: [0.9, 0.1], tears: 0.8 }} />;
};

const CuTatterLove = () => <Porch from={{ ...CAM8.cuT, zoom: 2.5 }} to={{ ...CAM8.cuT, zoom: 2.95 }} tatter={{ expr: "pleading", look: [0.9, -0.1], tears: 1, armF: [90, 30] }} />;

const CuWickCannot = () => <Porch from={{ ...CAM8.cuW, zoom: 2.5 }} to={{ ...CAM8.cuW, zoom: 2.3, y: CAM8.cuW.y + 30 }} wick={{ expr: "hurt", look: [0.9, 0.1], tears: 0.8 }} />;

const WickLiftoff = () => <Porch from={{ x: 760, y: 640, zoom: 1.35 }} to={{ x: 760, y: 560, zoom: 1.45 }} wick={{ expr: "tender", look: [0.7, 0.6], dust: 22 }} tatter={{ expr: "pleading", look: [0.6, -0.8] }} />;

const TatterWail = () => {
  const { shot } = useEpisode();
  const cam = camLerp({ x: 1060, y: 440, zoom: 1.45 }, { x: 1090, y: 520, zoom: 1.7 }, easeOut(shot.p));
  return <Porch from={cam} cam={cam} tatter={{ expr: "wail", armB: [165, 20], armF: [40, 30], wings: 0.7, look: [0.5, -0.9], dust: 18 }} shakeAmp={8} />;
};

/** Wick's quiet "No." from mid-air, looking back down at his brother. */
const CuWickNo = () => <Porch from={{ x: 800, y: 600, zoom: 2.3 }} to={{ x: 800, y: 590, zoom: 2.55 }} tatter={false} wick={{ expr: "hurt", look: [0.7, 0.8], tears: 0.7, flap: 0.6, bodyRot: 6, headTilt: 12, glint: 0.6 }} />;

/** Tatter hears it. */
const TatterHearsNo = () => <Porch from={{ ...CAM8.cuT, zoom: 2.5, y: CAM8.cuT.y + 10 }} to={{ ...CAM8.cuT, zoom: 2.7 }} wick={false} tatter={{ expr: "bitter", look: [0.5, -0.8], tears: 0.6, perk: -0.6 }} />;

const CuTatterFly = () => <Porch from={{ ...CAM8.cuT, zoom: 2.3, y: CAM8.cuT.y - 30 }} to={{ ...CAM8.cuT, zoom: 2.5, y: CAM8.cuT.y - 50 }} wick={false} tatter={{ expr: "bitter", look: [0.5, -0.9], headTilt: 14, armB: [150, 30] }} shakeAmp={3} />;

/** Wick rising into the lamp world. */
const LampAscend: React.FC<{ a: Pt; b: Pt; s0: number; s1: number }> = ({ a, b, s0, s1 }) => {
  const { shot } = useEpisode();
  const k = easeInOut(shot.p);
  return (
    <Lamp
      from={{ x: lerp(a[0], b[0], 0.3), y: lerp(a[1], b[1], 0.3) - 100, zoom: 1.05 }}
      to={{ x: lerp(a[0], b[0], 0.7), y: lerp(a[1], b[1], 0.7) - 120, zoom: 1.15 }}
      rays={1.3}
      wick={{ x: lerp(a[0], b[0], k), y: lerp(a[1], b[1], k), pose: "fly", flap: 1, wings: 1, scale: lerp(s0, s1, k), bodyRot: 30, expr: "ecstatic", look: [0.6, -0.7], glint: 1, dust: 10 }}
    />
  );
};

const MsTatterForgiveness = () => <Porch from={{ ...CAM8.msT, zoom: 1.6, y: CAM8.msT.y - 60 }} to={{ ...CAM8.msT, zoom: 1.75, y: CAM8.msT.y - 80 }} tatter={{ expr: "bitter", look: [0.5, -0.95], wings: 0.6, armB: [160, 20] }} shakeAmp={4} />;

/** Silhouette against the bulb. */
const TatterShadow = () => <Porch from={{ x: 1060, y: 400, zoom: 1.55 }} to={{ x: 1040, y: 370, zoom: 1.7 }} tatter={{ expr: "bitter", shade: 0.88, look: [0.5, -0.9], wings: 0.5 }} set={{ rays: 1.4 }} />;

/** His shadow, huge and distorted on the siding: torn wing, bent antenna, the match for a leg. */
const LongShadow: React.FC<{ x: number; y: number; t: number }> = ({ x, y, t }) => {
  const sway = Math.sin(t * 1.4) * 8;
  return (
    <g transform={`translate(${x} ${y}) matrix(2.3 0 0.5 2.6 0 0)`} opacity={0.58}>
      {/* torn wing */}
      <path d="M-30,-190 L-40,-120 L-120,-80 L-150,-150 L-130,-160 L-150,-200 L-120,-205 L-128,-250 L-95,-245 L-90,-290 Z" fill="#030406" />
      <path d="M-20,-200 C40,-300 90,-240 70,-140 C50,-90 10,-100 -10,-120 Z" fill="#030406" />
      {/* body + head */}
      <ellipse cx={-6} cy={-130} rx={52} ry={62} fill="#030406" />
      <circle cx={18} cy={-215} r={46} fill="#030406" />
      {/* antennae, one bent */}
      <path d={`M10,-250 Q${0 + sway},-310 ${-40 + sway},-350 M28,-252 Q46,-290 40,-300 L${70 + sway},-330`} stroke="#030406" strokeWidth={9} fill="none" strokeLinecap="round" />
      {/* legs: one real, one match */}
      <path d="M-20,-72 L-30,0 M14,-72 L24,0" stroke="#030406" strokeWidth={10} strokeLinecap="round" />
      <circle cx={24} cy={-2} r={10} fill="#030406" />
    </g>
  );
};

/** "What is a shadow but what is left behind in the light?" — his shadow stretched across the rail. */
const ShadowLong = () => {
  const { shot } = useEpisode();
  const cam = camLerp({ x: 1820, y: 180, zoom: 1.25 }, { x: TAT_POS.x - 40, y: 600, zoom: 1.95 }, easeInOut(P(shot.local, 0.5, 3.7)));
  return <Porch from={cam} cam={cam} tatter={{ expr: "grave", look: [0.5, -0.8] }} wall={<LongShadow x={1650} y={890} t={shot.t} />} />;
};

const EcuTatterRemember = () => <Porch from={{ ...CAM8.ecuT, zoom: 3.6 }} to={{ ...CAM8.ecuT, zoom: 4.8 }} wick={false} tatter={{ expr: "sad", look: [0.5, -0.4], tears: 1 }} />;

/** "...as though you and I never were": the whole house, two specks. */
const ExtNever = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const ang = l * 4;
  const w: Pt = [EXT.bulb.x + Math.cos(ang) * lerp(70, 26, shot.p), EXT.bulb.y + 6 + Math.sin(ang) * lerp(30, 12, shot.p)];
  return <ExteriorScene from={{ ...CAMX.porch, zoom: 2.6, x: 1190, y: 640 }} to={{ ...CAMX.wide, zoom: 0.9 }} wick={w} tatter={[1150, 754]} />;
};

/* ------------------------------------------------------------------ */
/* Outro + the silent punchline                                        */
/* ------------------------------------------------------------------ */

const AscentGlory = () => {
  const { shot } = useEpisode();
  const k = easeInOut(shot.p);
  return (
    <Lamp
      from={{ x: 700, y: 520, zoom: 1.2 }}
      to={{ x: 760, y: 420, zoom: 1.5 }}
      rays={1.8}
      swarm={1 - k}
      wick={{ x: lerp(480, 640, k), y: lerp(1000, 760, k), pose: "fly", flap: 0.5, wings: 1, scale: 0.75, bodyRot: 25, expr: "ecstatic", look: [0.5, -0.8], armF: [150, 10], armB: [140, 10], glint: 1, dust: 14 }}
    />
  );
};

/** So close to the bulb... then the zapper's blue catches his eye. */
const Swerve = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const turn = easeInOut(P(l, 0.7, 1.3));
  const go = easeIn(P(l, 1.4, 2.2));
  return (
    <Lamp
      from={{ x: 980, y: 480, zoom: 1.15 }}
      to={{ x: 1080, y: 520, zoom: 1.25 }}
      rays={1.2}
      swarm={0.3}
      wick={{ x: lerp(760, 1100, go), y: lerp(720, 760, go), pose: "fly", flap: 1, wings: 1, scale: 0.7, bodyRot: lerp(30, -10, turn), expr: turn > 0.5 ? "awe" : "ecstatic", look: [lerp(0.2, 1, turn), lerp(-0.9, 0.2, turn)], glint: 1, flip: false }}
    />
  );
};

/** ECU: one leg, reaching for the grid. */
const Touch: React.FC<{ near: number }> = ({ near }) => {
  const { shot } = useEpisode();
  const k = easeInOut(shot.p);
  const reach = lerp(near, near + 0.1, k);
  return (
    <Lamp
      from={{ x: LAMP.zapper.x - 180, y: LAMP.zapper.y - 120, zoom: 3.2 }}
      to={{ x: LAMP.zapper.x - 175, y: LAMP.zapper.y - 120, zoom: 3.5 }}
      swarm={0}
      rays={0.6}
      wick={{ x: lerp(LAMP.zapper.x - 520, LAMP.zapper.x - 420, reach), y: LAMP.zapper.y + 170, pose: "fly", flap: 0.6, wings: 1, scale: 0.75, bodyRot: -6, expr: "awe", armF: [100, 0], look: [1, 0.1], glint: 1 }}
    />
  );
};

const TatterRealize = () => <Porch from={{ ...CAM8.ecuT, zoom: 4.2, y: CAM8.ecuT.y - 10 }} to={{ ...CAM8.ecuT, zoom: 4.6 }} wick={false} tatter={{ expr: "shock", look: [0.5, -0.9] }} />;

/** ZAP. */
const Zap = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const zap = l < 0.5 ? 1 - l / 0.5 : 0;
  const xr = l < 0.45 && Math.floor(l * 14) % 2 === 0;
  const party = easeOut(P(l, 0.35, 1.0));
  const wx = LAMP.zapper.x - 300;
  const wy = LAMP.zapper.y + 170;
  return (
    <Lamp
      from={{ x: LAMP.zapper.x - 120, y: LAMP.zapper.y + 40, zoom: 1.6 }}
      to={{ x: LAMP.zapper.x - 100, y: LAMP.zapper.y + 80, zoom: 1.45 }}
      ease={easeOut}
      zap={zap}
      party={party}
      newMark={easeOut(P(l, 0.6, 1.2))}
      swarm={0}
      shakeAmp={zap * 18}
      wick={l < 0.45 && !xr ? { x: wx, y: wy, pose: "fly", flap: 0, wings: 1, scale: 0.75, bodyRot: -6, expr: "shock", tremble: 1, armF: [100, 0] } : false}
      front={
        <g>
          {xr ? <MothXray x={wx} y={wy} s={0.75} rot={-6} /> : null}
          {l >= 0.45 ? <MothHusk x={wx + 60} y={wy - 230 + (l - 0.45) * 40} s={0.9} t={shot.t} smoke={1} ember={1} rot={10} /> : null}
          {l >= 0.45
            ? [0, 1, 2].map((i) => {
                const ph = clamp((l - 0.45) * 0.9 + i * 0.12);
                return <circle key={i} cx={wx + 40 + i * 30} cy={wy - 300 - ph * 260} r={40 + ph * 70} fill="#7a7468" opacity={0.5 * (1 - ph)} />;
              })
            : null}
        </g>
      }
    />
  );
};

/** The husk tumbles down out of the light toward Tatter. */
const HuskFall = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  return (
    <Porch
      from={{ x: 1120, y: 420, zoom: 1.35 }}
      to={{ x: 1120, y: 470, zoom: 1.4 }}
      wick={false}
      tatter={{ expr: "shock", look: [0.3, -0.95], headTilt: 14 }}
      set={{ count: 5000 }}
      front={
        <g>
          {[0, 1, 2, 3].map((i) => {
            const ty = -260 + (l - i * 0.07) * 1000;
            return <circle key={i} cx={1080 + Math.sin((l - i * 0.07) * 6) * 40} cy={ty - 60} r={22 + i * 10} fill="#8a8478" opacity={0.35 - i * 0.07} />;
          })}
          <MothHusk x={1080 + Math.sin(l * 6) * 40} y={-260 + l * 1000} s={0.75} rot={l * 420} t={shot.t} smoke={1} ember={1} />
        </g>
      }
    />
  );
};

/** Plop. A ghost. Back to the light. ZAP again (offscreen). Blink. */
const TatterHusk = () => {
  const { shot } = useEpisode();
  const l = shot.local;
  const LAND = 0.32;
  const hy = l < LAND ? lerp(300, 880, easeIn(l / LAND)) : 880;
  const ghostUp = P(l, 1.05, 1.4);
  const ghostRise = easeOut(P(l, 0.75, 1.05));
  const ghostPos: Pt = [1080 + Math.sin(l * 4) * 10, lerp(860, 700, ghostRise) - easeIn(ghostUp) * 1000];
  const flash = l > 1.65 && l < 1.95 ? 1 - (l - 1.65) / 0.3 : 0;
  const look = l > 0.5 ? [0.6, 0.9] : [0.5, -0.6];
  const blink = l > 2.2 ? "deadpan" : flash > 0 ? "shock" : l > 1.2 ? "deadpan" : "haunted";
  return (
    <Porch
      from={{ x: 1150, y: 660, zoom: 1.75 }}
      to={{ x: 1140, y: 650, zoom: 1.9 }}
      wick={false}
      tatter={{ expr: blink as MothProps["expr"], look: (l > 1.0 && l < 1.6 ? [0.5, -0.95] : look) as Pt }}
      set={{ zap: flash, count: l < 1.65 ? 5000 : 5001 }}
      front={
        <g>
          <MothHusk x={1060} y={hy} s={0.62} rot={l < LAND ? l * 600 : 160} t={shot.t} smoke={1} ember={0.4} />
          {l >= LAND ? <path d={`M${980 + 0 * l},906 q40,${-30 - (l - LAND) * 40} 80,0 q40,${-26 - (l - LAND) * 30} 80,0`} fill="#9a948a" opacity={0.6 * (1 - clamp((l - LAND) * 2))} /> : null}
          {l > 0.75 && ghostPos[1] > -400 ? <MothGhost x={ghostPos[0]} y={ghostPos[1]} s={0.7} t={shot.t} alpha={0.85 * ghostRise} look={l < 1.05 ? 1 : 0} /> : null}
          {flash > 0 ? <rect x={-2000} y={-2000} width={6000} height={5000} fill="#cfefff" opacity={flash * 0.45} style={{ mixBlendMode: "screen" }} /> : null}
        </g>
      }
    />
  );
};

/* ------------------------------------------------------------------ */
/* Shot list                                                           */
/* ------------------------------------------------------------------ */

const pW = { x: HEADS.wick.x + 30 };
const pT = { x: HEADS.tatter.x - 30 };
const SPK = { x: "speaker" as const, zoom: 1.15, y: 600 };

const raw: ShotDef[] = [
  // (music) the house; "Brother, I crave the forbidden lamp."
  { name: "ext-open", start: 0, end: T.crave - 0.15, transition: "fade", render: () => <ExtOpen />, portrait: { x: 1170, zoom: 1.15, y: 620 } },
  { name: "cu-wick-crave", start: T.crave - 0.15, end: T.crave + 3.25, render: () => <CuWickCrave />, portrait: pW },
  // (music swell) the lamp in its glory; his eyes; a gnat goes in. ZAP.
  { name: "lamp-hero", start: T.crave + 3.25, end: T.crave + 5.0, render: () => <LampHero />, portrait: { x: LAMP.bulb.x } },
  { name: "ecu-wick-eyes", start: T.crave + 5.0, end: 9.0, render: () => <EcuWickEyes />, portrait: { x: HEADS.wick.x + 42 } },
  { name: "lamp-gnat-zap", start: 9.0, end: 10.15, render: () => <LampGnatZap />, portrait: { x: LAMP.zapper.x - 100 } },
  { name: "wick-flinch", start: 10.15, end: T.seek - 0.04, render: () => <WickFlinch />, portrait: { x: HEADS.wick.x + 40 } },
  // "Seek not the lamp, brother, heed not its light."
  { name: "tatter-reveal", start: T.seek - 0.04, end: T.calls - 0.3, render: () => <TatterReveal />, portrait: { x: HEADS.tatter.x - 40 } },
  // "Brother, the light calls to me, it calls to us all."
  { name: "cu-wick-calls", start: T.calls - 0.3, end: T.usAll - 0.1, render: () => <CuWickCalls />, portrait: pW },
  { name: "lamp-cult", start: T.usAll - 0.1, end: T.resist - 0.06, render: () => <LampCult />, portrait: { x: 800, zoom: 0.9 } },
  // "You must resist it, brother, the light is the call of death."
  { name: "cu-tatter-resist", start: T.resist - 0.06, end: T.callDeath - 0.1, render: () => <CuTatterResist />, portrait: pT },
  { name: "zapper-tray", start: T.callDeath - 0.1, end: T.iKnow - 0.08, render: () => <ZapperTray />, portrait: { x: LAMP.zapper.x + 60 } },
  // "I know, brother, and yet I long for it."  "I desire its forbidden touch."
  { name: "two-wick-long", start: T.iKnow - 0.08, end: T.desire - 0.3, render: () => <TwoWickLong />, portrait: SPK },
  { name: "wick-touch", start: T.desire - 0.3, end: T.cannot - 0.05, render: () => <WickTouch />, portrait: { x: 720, zoom: 1.15, y: 420 } },
  // "You cannot touch it, brother!"  "I know this."  "I too once followed..."
  { name: "cu-tatter-cannot", start: T.cannot - 0.05, end: T.knowThis - 0.15, render: () => <CuTatterCannot />, portrait: pT },
  { name: "ecu-tatter-know", start: T.knowThis - 0.15, end: T.followed - 0.1, render: () => <EcuTatterKnow />, portrait: { x: HEADS.tatter.x - 42 } },
  { name: "tatter-followed", start: T.followed - 0.1, end: T.thought - 0.1, render: () => <TatterFollowed />, portrait: { x: HEADS.tatter.x - 30, y: 600 } },
  { name: "cu-tatter-thought", start: T.thought - 0.1, end: T.eternal - 0.05, render: () => <CuTatterThought />, portrait: pT },
  { name: "bulb-eternal", start: T.eternal - 0.05, end: T.folly - 0.4, grade: "heaven", transition: "flash", render: () => <BulbEternal />, portrait: { x: LAMP.bulb.x } },
  { name: "cu-tatter-folly", start: T.folly - 0.4, end: T.indeed - 0.1, render: () => <CuTatterFolly />, portrait: pT },
  // "Indeed. And yet you live. You touch the forbidden lamp and yet return to life among mere mortals."
  { name: "cu-wick-indeed", start: T.indeed - 0.1, end: T.youTouch - 0.12, render: () => <CuWickIndeed />, portrait: pW },
  { name: "ms-wick-touch", start: T.youTouch - 0.12, end: T.mortals - 0.1, render: () => <MsWickTouch />, portrait: { x: HEADS.wick.x + 60, y: 600 } },
  { name: "tatter-mortals", start: T.mortals - 0.1, end: T.implausible - 0.2, render: () => <CuTatterMortals />, portrait: { x: HEADS.tatter.x - 50 } },
  // "I find your words implausible, brother."
  { name: "cu-wick-implausible", start: T.implausible - 0.2, end: T.hear - 0.06, render: () => <CuWickImplausible />, portrait: pW },
  // "Hear me, brother! I did not touch the lamp."  "No one can."
  { name: "cu-tatter-hear", start: T.hear - 0.06, end: T.noOne - 0.4, render: () => <CuTatterHear />, portrait: pT },
  { name: "two-noone", start: T.noOne - 0.4, end: T.farther - 0.6, render: () => <TwoNoOne />, portrait: { x: "speaker", zoom: 1.1, y: 520 } },
  // "It is farther than infinity, more distant than life from death."
  { name: "moon-infinity", start: T.farther - 0.6, end: T.flew - 0.2, render: () => <MoonInfinity />, portrait: { zoom: 1 } },

  // ---- FLASHBACK (epic grade, letterbox) ----
  // "I flew up and up, beyond what I imagined possible,"
  { name: "fb-launch", start: T.flew - 0.2, end: T.beyond - 0.05, filter: EPIC, transition: "flash", grain: 0.45, render: () => <FbLaunch />, portrait: { zoom: 1.0, x: (l) => lerp(430, 260, easeInOut(prog(l, 0.6, 2.2))) } },
  { name: "fb-rise", start: T.beyond - 0.05, end: T.until - 0.05, filter: EPIC, grain: 0.45, render: () => <FbRise />, portrait: { zoom: 1.0 } },
  // "until my wings failed me and my strength was utterly spent."
  { name: "fb-clouds", start: T.until - 0.05, end: T.strength - 0.05, filter: EPIC, grain: 0.45, render: () => <FbClouds />, portrait: { zoom: 1.0 } },
  { name: "fb-spent", start: T.strength - 0.05, end: T.burned - 0.6, filter: EPIC, grain: 0.45, render: () => <FbSpent />, portrait: { zoom: 1.0 } },
  // "The light burned so brightly, I strained to touch it, but it never got any closer."
  { name: "fb-bright", start: T.burned - 0.6, end: T.strained - 0.05, filter: EPIC, grain: 0.45, render: () => <FbBright />, portrait: { zoom: 1.0 } },
  { name: "fb-reach", start: T.strained - 0.05, end: T.thenFell - 0.2, filter: EPIC, grain: 0.45, render: () => <FbReach />, portrait: { zoom: 1.0 } },
  // "And then I fell, brother."  "I fell for ages, the wind carrying me where it willed,"
  { name: "fb-hang", start: T.thenFell - 0.2, end: T.ages, filter: EPIC, grain: 0.45, render: () => <FbHang />, portrait: { zoom: 1.0 } },
  { name: "fb-fall", start: T.ages, end: T.wind - 0.25, filter: EPIC, grain: 0.45, render: () => <FbFall />, portrait: { zoom: 1.0 } },
  { name: "fb-wind", start: T.wind - 0.25, end: T.spiraling - 0.05, filter: EPIC, grain: 0.45, render: () => <FbWind />, portrait: { zoom: 1.0 } },
  // "spiraling downward with no control nor any care for my destination."
  { name: "fb-spiral", start: T.spiraling - 0.05, end: T.retreated - 0.15, filter: EPIC, grain: 0.45, render: () => <FbSpiral />, portrait: { zoom: 1.0 } },
  // "And the lamp retreated from me, as if in mockery of my futile struggle, and left me in darkness."
  { name: "fb-retreat", start: T.retreated - 0.15, end: T.mockery - 0.1, filter: EPIC, grain: 0.45, render: () => <FbRetreat />, portrait: { zoom: 1.0 } },
  { name: "fb-mock", start: T.mockery - 0.1, end: T.darkness - 0.1, filter: EPIC, grain: 0.45, render: () => <FbMock />, portrait: { zoom: 1.0 } },
  { name: "fb-dark", start: T.darkness - 0.1, end: T.awoke - 0.15, filter: EPIC, grain: 0.45, render: () => <FbDark />, portrait: { zoom: 1.0 } },
  // "When I awoke, I was on the ground, and I do not know how I survived."
  { name: "lawn-wake-pov", start: T.awoke - 0.15, end: T.awoke + 1.35, filter: EPIC, grain: 0.45, render: () => <LawnWakePov />, portrait: { zoom: 1.0 } },
  { name: "lawn-wake-cu", start: T.awoke + 1.35, end: T.survived - 0.1, filter: EPIC, grain: 0.45, render: () => <LawnWakeCu />, portrait: { x: 830 } },
  { name: "lawn-leg", start: T.survived - 0.1, end: T.sawThem - 0.3, filter: EPIC, grain: 0.45, render: () => <LawnLeg />, portrait: { zoom: 0.9, x: (l) => lerp(800, 960, easeInOut(prog(l, 0.8, 1.8))) } },
  // "But I saw them, brother."  "Others of our kind, their bodies broken under the weight of their hubris."
  { name: "lawn-saw", start: T.sawThem - 0.3, end: T.others - 0.15, filter: EPIC, grain: 0.45, render: () => <LawnSaw />, portrait: { x: 800 } },
  { name: "lawn-graveyard", start: T.others - 0.15, end: T.wingsTorn - 0.15, filter: EPIC, grain: 0.45, render: () => <LawnGraveyard />, portrait: { zoom: 1.0 } },
  // "Their wings torn and scattered upon the blades of the green."
  { name: "lawn-wings", start: T.wingsTorn - 0.15, end: T.noneHad - 0.3, filter: EPIC, grain: 0.45, render: () => <LawnWings />, portrait: { zoom: 1.1, x: (l) => lerp(1100, 1600, easeInOut(prog(l, 0, 4))) } },
  // "None had touched the forbidden lamp."
  { name: "lawn-tilt", start: T.noneHad - 0.3, end: T.noneEver - 0.15, filter: EPIC, grain: 0.45, render: () => <LawnTilt />, portrait: { zoom: 1.0 } },
  // ---- back on the porch ----  "None ever will."
  { name: "cu-tatter-never", start: T.noneEver - 0.15, end: T.story - 0.12, transition: "static", render: () => <CuTatterNever />, portrait: pT },

  // "Your story reveals your weakness, brother. Your trepidation prevailed and the lamp rejected you."
  { name: "cu-wick-weakness", start: T.story - 0.12, end: T.trep - 0.1, render: () => <CuWickWeakness />, portrait: pW },
  { name: "two-trepidation", start: T.trep - 0.1, end: T.fear - 0.1, render: () => <TwoTrepidation />, portrait: SPK },
  // "I do not fear the light as you do."  "Where others have faltered, I will succeed."
  { name: "cu-wick-fear", start: T.fear - 0.1, end: T.faltered - 0.02, render: () => <CuWickFear />, portrait: pW },
  { name: "wick-faltered", start: T.faltered - 0.02, end: T.first - 0.2, render: () => <WickFaltered />, portrait: { x: 700, zoom: 1.0, y: 580 } },
  // "I will be the first to touch the forbidden lamp and bathe in the eternal glory of its light."
  { name: "wick-glory", start: T.first - 0.2, end: T.bathe - 0.05, render: () => <WickGlory />, portrait: { x: (l) => lerp(680, 820, easeInOut(prog(l, 0, 2.4))), zoom: 1.0, y: 440 } },
  { name: "bathe-fantasy", start: T.bathe - 0.05, end: T.perhaps - 0.25, grade: "heaven", transition: "flash", render: () => <BatheFantasy />, portrait: { x: 700 } },
  // "Perhaps when I become one with the divine, I will remember you, trapped as you are in your mortal frailties."
  { name: "cu-wick-divine", start: T.perhaps - 0.25, end: T.trapped - 0.1, render: () => <CuWickDivine />, portrait: pW },
  { name: "tatter-frail", start: T.trapped - 0.1, end: T.noBrother - 0.1, render: () => <TatterFrail />, portrait: { x: (l) => lerp(HEADS.tatter.x - 30, TAT_POS.x - 10, easeInOut(prog(l, 0.6, 2.4))) } },
  // "No, brother! Please, reconsider what you're doing."  "The lamp is a fire that burns body and soul."
  { name: "cu-tatter-please", start: T.noBrother - 0.1, end: T.fire - 0.15, render: () => <CuTatterPlease />, portrait: pT },
  { name: "zapper-fire", start: T.fire - 0.15, end: T.evenIf - 0.12, render: () => <ZapperFire />, portrait: { x: LAMP.zapper.x - 140 } },
  // "Even if it could be touched, it would not make you as it is. It would simply destroy you"
  { name: "fantasy-asitis", start: T.evenIf - 0.12, end: T.destroy + 0.2, grade: "heaven", transition: "flash", vignette: 0.55, render: () => <FantasyAsItIs />, portrait: { x: 990, zoom: 1.0, y: 520 } },
  { name: "fantasy-crack", start: T.destroy + 0.2, end: T.destroyWord, grade: "heaven", vignette: 0.6, render: () => <FantasyCrack />, portrait: { x: 990, y: 440 } },
  { name: "fantasy-ruin", start: T.destroyWord, end: T.evenSo + 0.5, grade: "hell", transition: "flash", render: () => <FantasyRuin />, portrait: { x: 990, y: 640 } },

  // ---- the parting ----
  // "Even so, I can no longer resist its call, brother."
  { name: "cu-wick-evenso", start: T.evenSo + 0.5, end: T.ifIgo + 0.6, render: () => <CuWickEvenSo />, portrait: pW },
  // "If I go to death or immortality, either way, this is our final parting."
  { name: "wide-parting", start: T.ifIgo + 0.6, end: T.parting - 0.1, render: () => <WideParting />, portrait: { x: "speaker", zoom: 1.1, y: 560 } },
  { name: "cu-tatter-parting", start: T.parting - 0.1, end: T.forgiveMe - 0.2, render: () => <CuTatterParting />, portrait: pT },
  // "Forgive me, brother, for leaving you thus. I forgive your fears, as they are born of love."
  { name: "cu-wick-forgive", start: T.forgiveMe - 0.2, end: T.forgiveFears - 0.3, render: () => <CuWickForgive />, portrait: pW },
  { name: "two-forgive", start: T.forgiveFears - 0.3, end: T.ifLove - 0.05, render: () => <TwoForgive />, portrait: { x: 900, zoom: 1.0, y: 600 } },
  // "If you love me, brother, then forsake this mad quest."
  { name: "cu-tatter-love", start: T.ifLove - 0.05, end: T.forsake + 0.9, render: () => <CuTatterLove />, portrait: pT },
  { name: "two-quest", start: T.forsake + 0.9, end: T.iCannot - 0.25, render: () => <TwoQuest />, portrait: SPK },
  // "I cannot."  "Remember me, brother."
  { name: "cu-wick-cannot", start: T.iCannot - 0.25, end: T.rememberMe - 0.1, render: () => <CuWickCannot />, portrait: pW },
  { name: "wick-liftoff", start: T.rememberMe - 0.1, end: T.noWail - 0.02, render: () => <WickLiftoff />, portrait: { x: 720, y: 600 } },
  // "Nooo!"  "No."
  { name: "tatter-wail", start: T.noWail - 0.02, end: T.no2 - 0.2, render: () => <TatterWail />, portrait: { x: (l) => lerp(820, TAT_POS.x - 60, easeInOut(prog(l, 0.2, 1.2))), zoom: 1.0, y: 520 } },
  { name: "cu-wick-no", start: T.no2 - 0.2, end: T.no2 + 0.75, render: () => <CuWickNo />, portrait: { x: 790 } },
  { name: "tatter-hears-no", start: T.no2 + 0.75, end: T.fly - 0.08, render: () => <TatterHearsNo />, portrait: pT },
  // "Fly, then, out of brotherhood, out of forgiveness, out of memory!"
  { name: "cu-tatter-fly", start: T.fly - 0.08, end: T.brotherhood - 0.12, render: () => <CuTatterFly />, portrait: pT },
  { name: "lamp-ascend-1", start: T.brotherhood - 0.12, end: T.forgiveness - 0.1, render: () => <LampAscend a={[380, 1200]} b={[560, 860]} s0={0.7} s1={0.62} />, portrait: { x: 520 } },
  { name: "ms-tatter-forgiveness", start: T.forgiveness - 0.1, end: T.memory - 0.12, render: () => <MsTatterForgiveness />, portrait: { x: HEADS.tatter.x - 40, y: 560 } },
  { name: "lamp-ascend-2", start: T.memory - 0.12, end: T.shadow1 - 0.15, render: () => <LampAscend a={[520, 880]} b={[600, 640]} s0={0.6} s1={0.52} />, portrait: { x: 600 } },
  // "What is a brotherhood to a shadow? What is a shadow but what is left behind in the light?"
  { name: "tatter-shadow", start: T.shadow1 - 0.15, end: T.shadow2 - 0.1, render: () => <TatterShadow />, portrait: { x: 1100, y: 420 } },
  { name: "shadow-long", start: T.shadow2 - 0.1, end: T.willNot - 0.3, render: () => <ShadowLong />, portrait: { x: (l) => lerp(1800, TAT_POS.x - 40, easeInOut(prog(l, 0.5, 3.7))) } },
  // "I will not remember, and when I too become nothing,"
  { name: "ecu-tatter-remember", start: T.willNot - 0.3, end: T.asThough - 0.05, render: () => <EcuTatterRemember />, portrait: { x: HEADS.tatter.x - 42 } },
  // "it will be as though you and I never were."
  { name: "ext-never", start: T.asThough - 0.05, end: T.asThough + 3.0, render: () => <ExtNever />, portrait: { x: 1180, zoom: 1.0, y: 640 } },

  // ---- (music) the ascent ----
  { name: "ascent-glory", start: T.asThough + 3.0, end: T.asThough + 5.9, grade: "heaven", vignette: 0.6, render: () => <AscentGlory />, portrait: { x: (l) => lerp(560, 700, l / 2.9) } },
  { name: "swerve", start: T.asThough + 5.9, end: T.asThough + 8.05, render: () => <Swerve />, portrait: { x: (l) => lerp(820, 1120, easeInOut(prog(l, 0.8, 2.1))) } },
  { name: "touch-1", start: T.asThough + 8.05, end: T.end - 1.2, render: () => <Touch near={0} />, portrait: { x: LAMP.zapper.x - 290, zoom: 0.85 } },
  { name: "tatter-realize", start: T.end - 1.2, end: T.end - 0.55, render: () => <TatterRealize />, portrait: { x: HEADS.tatter.x - 42 } },
  { name: "touch-2", start: T.end - 0.55, end: T.end, render: () => <Touch near={0.4} />, portrait: { x: LAMP.zapper.x - 260, zoom: 0.85 } },

  // ---- the silent punchline ----
  { name: "zap", start: T.end, end: T.end + 1.65, transition: "flash", render: () => <Zap />, portrait: { x: LAMP.zapper.x - 150, zoom: 0.9 } },
  { name: "husk-fall", start: T.end + 1.65, end: T.end + 2.7, render: () => <HuskFall />, portrait: { x: 1110, y: 500 } },
  { name: "tatter-husk", start: T.end + 2.7, end: T.end + 5.4, render: () => <TatterHusk />, portrait: { x: 1110, zoom: 1.0, y: 640 } },
  { name: "title", start: T.end + 5.4, end: 9999, grade: "none", vignette: 0.6, render: () => <TitleCard />, portrait: {} },
];

/** porch scenes get a warm night grade by default; flashbacks and cutaways set their own */
export const shots: ShotDef[] = raw.map((s) => ({ ...s, grade: s.grade ?? "night" }));

