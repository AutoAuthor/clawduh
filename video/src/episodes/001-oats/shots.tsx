import type { ShotDef } from "../../engine/EpisodePlayer";
import { Gristle } from "../../characters/Gristle";
import { LightWash, Stage, camLerp } from "../../engine/Stage";
import { easeIn, easeInOut, easeOut, lerp, prog } from "../../engine/util";
import { PenBackdrop, Trough } from "../../scenes/Pen";
import { useEpisode } from "../../engine/context";
import {
  BlackFrame,
  CaveScene,
  FarmhouseWindowScene,
  GirthScene,
  LambsScene,
  PortraitsScene,
  ShedDoorScene,
  TitleCard,
  VisionScene,
} from "../../scenes/cutaways";
import {
  BeastScene,
  FairScene,
  FeastScene,
  FoxScene,
  GrossUpScene,
  RoadAwayScene,
  SniffScene,
  SpitRoastScene,
  WeepingScene,
} from "../../scenes/flashbacks";
import { CAM, D_HEAD, G_HEAD, G_POS, PenScene } from "./common";

/**
 * EPISODE 001 — "Brother, may I have some oats?"
 * Shot list keyed to the burialgoods audio. Times are absolute seconds.
 * (This is the file an automated "director" step would generate from the transcript.)
 */

/** Shots whose behaviour depends on time-within-shot get tiny wrapper components. */
const DumplingLies = () => {
  const { shot } = useEpisode();
  const spray = easeOut(prog(shot.local, 0.05, 1.1));
  return <PenScene from={CAM.cuD} to={CAM.ecuD} ease={easeOut} shakeAmp={shot.local < 0.6 ? 14 : 3} dumpling={{ expr: "angry", spray, headTilt: -8 }} />;
};

const ShedPush = () => {
  const { shot } = useEpisode();
  const creak = easeIn(prog(shot.local, 3.0, 4.6)) * 0.08;
  return <PenScene from={CAM.shed} to={CAM.shedTight} shedGlow={1 + prog(shot.local, 2.5, 4.5) * 0.8} doorOpen={creak} shakeAmp={shot.local > 3 ? 1.5 : 0} />;
};

const GristleRed = () => {
  const { shot } = useEpisode();
  return (
    <PenScene
      from={CAM.cuG}
      to={{ ...CAM.cuG, zoom: 3.4 }}
      gristle={{ expr: "intense", look: [0.9, 0] }}
      overlay={<LightWash id="redwash" color="#ff2a10" cx={1900} cy={600} r={1200} opacity={0.35 + Math.sin(shot.t * 2.2) * 0.08} />}
    />
  );
};

const BlindingLight = () => {
  const { shot } = useEpisode();
  const glow = easeIn(prog(shot.local, 0.8, 3.4));
  return (
    <PenScene
      from={CAM.cuG}
      to={CAM.ecuG}
      gristle={{ expr: "sad", look: [0.3, -0.3] }}
      overlay={<LightWash id="blind" color="#fffbe6" cx={1200} cy={300} r={1400} opacity={glow * 0.95} />}
    />
  );
};

/** Final button: Dumpling is gone. Gristle finally gets the oats... and slowly looks at us. */
const GristleEats = () => {
  const { shot } = useEpisode();
  const turn = easeOut(prog(shot.local, 1.0, 1.7));
  const cam = camLerp({ x: G_HEAD.x + 20, y: G_HEAD.y + 70, zoom: 2.4 }, { x: G_HEAD.x + 10, y: G_HEAD.y + 30, zoom: 2.9 }, easeInOut(shot.p));
  return (
    <Stage cam={cam} frame={shot.frame}>
      <PenBackdrop t={shot.t} frame={shot.frame} />
      <Gristle
        id="gristle"
        x={G_POS.x}
        y={G_POS.y}
        t={shot.t}
        frame={shot.frame}
        mouth="X"
        chewing
        crumbs
        flies
        expr={turn > 0.5 ? "manic" : "neutral"}
        look={[0.6 - turn * 0.6, 0.7 - turn * 0.7]}
        headTilt={16 - turn * 16}
      />
      <Trough x={G_HEAD.x + 10} y={G_HEAD.y + 285} s={1.5} oats={0.4} id="endtrough" />
    </Stage>
  );
};

export const shots: ShotDef[] = [
  // --- "Brother, may I have some oats?" ------------------------------------
  { name: "wide-open", portrait: { zoom: 0.92, x: 985, y: 620 }, start: 0, end: 3.95, transition: "fade", render: () => <PenScene from={CAM.wide} to={CAM.wideTight} gristle={{ expr: "pleading" }} /> },
  { name: "cu-dumpling-no", start: 3.95, end: 5.55, render: () => <PenScene from={CAM.cuD} to={CAM.ecuD} dumpling={{ expr: "smug" }} /> },
  { name: "cu-gristle-starving", start: 5.55, end: 7.95, render: () => <PenScene from={CAM.cuG} to={{ ...CAM.cuG, zoom: 3.3 }} gristle={{ expr: "pleading" }} /> },
  { name: "ms-dumpling-asami", start: 7.95, end: 9.85, render: () => <PenScene from={CAM.msD} to={{ ...CAM.msD, zoom: 2.0 }} dumpling={{ expr: "smug" }} /> },
  { name: "farmhouse-window", portrait: { zoom: 1.3 }, start: 9.85, end: 13.95, grade: "night", render: () => <FarmhouseWindowScene /> },
  { name: "ecu-dumpling-me", start: 13.95, end: 15.55, render: () => <PenScene from={CAM.ecuD} to={{ ...CAM.ecuD, zoom: 5.0 }} dumpling={{ expr: "smug", headTilt: 10 }} /> },
  { name: "cu-dumpling-liking", start: 15.55, end: 19.25, render: () => <PenScene from={CAM.cuD} to={{ ...CAM.cuD, zoom: 3.3 }} dumpling={{ expr: "dreamy", headTilt: -6 }} /> },

  // --- "No, brother. I have seen this before..." ---------------------------
  { name: "cu-gristle-seen", start: 19.25, end: 24.85, render: () => <PenScene from={CAM.cuG} to={CAM.ecuG} gristle={{ expr: "intense", bulge: 0.6, look: [0.1, 0] }} /> },
  { name: "fb-beast", portrait: { zoom: 1.12, x: (l) => (l < 2.9 ? 820 : lerp(820, 1440, easeInOut(prog(l, 2.9, 6.0)))) }, start: 24.85, end: 31.0, grade: "memory", transition: "static", grain: 0.45, render: () => <BeastScene /> },
  { name: "fb-weeping", portrait: { x: 760 }, start: 31.0, end: 35.75, grade: "memory", grain: 0.45, render: () => <WeepingScene /> },
  { name: "ms-gristle-experiences", start: 35.75, end: 41.3, transition: "static", render: () => <PenScene from={CAM.msG} to={CAM.cuG} gristle={{ expr: "intense" }} /> },
  { name: "shed-push", start: 41.3, end: 47.8, render: () => <ShedPush /> },
  { name: "cu-gristle-terrible", start: 47.8, end: 51.4, render: () => <GristleRed /> },

  // --- "Lies!" ---------------------------------------------------------------
  { name: "dumpling-lies", start: 51.4, end: 52.8, transition: "redflash", render: () => <DumplingLies /> },
  { name: "vision-dine", portrait: { zoom: 1.1, x: 1250 }, start: 52.8, end: 58.3, grade: "heaven", transition: "flash", vignette: 0.5, render: () => <VisionScene /> },
  { name: "cu-dumpling-fool", start: 58.3, end: 61.3, transition: "flash", render: () => <PenScene from={CAM.cuD} to={{ ...CAM.cuD, zoom: 3.2, rot: -4 }} dumpling={{ expr: "angry" }} /> },
  { name: "two-mud", portrait: { x: G_HEAD.x + 40, y: 720 }, start: 61.3, end: 64.4, render: () => <PenScene from={CAM.two} to={{ ...CAM.two, zoom: 1.55 }} gristle={{ expr: "sad", look: [0.3, 0.8], headTilt: 14 }} dumpling={{ expr: "smug" }} /> },

  // --- "No, brother! You must believe me." -------------------------------
  { name: "cu-gristle-believe", start: 64.4, end: 67.7, render: () => <PenScene from={CAM.cuG} to={{ ...CAM.cuG, zoom: 3.6 }} shakeAmp={2} gristle={{ expr: "pleading", bulge: 0.3 }} /> },
  { name: "two-share", portrait: { x: (l) => lerp(G_HEAD.x + 40, D_HEAD.x, easeInOut(prog(l, 0.6, 2.0))) }, start: 67.7, end: 69.8, render: () => <PenScene from={CAM.two} to={CAM.msD} gristle={{ expr: "pleading", headTilt: 10 }} dumpling={{ expr: "suspicious" }} /> },
  { name: "girth", portrait: { zoom: 1.2 }, start: 69.8, end: 73.3, render: () => <GirthScene /> },
  { name: "cu-gristle-spare", start: 73.3, end: 75.45, render: () => <PenScene from={CAM.cuG} to={{ ...CAM.cuG, zoom: 3.4 }} gristle={{ expr: "pleading" }} /> },

  // --- "Aha! So this was all a plan to steal my oats." ---------------------
  { name: "cu-dumpling-aha", start: 75.45, end: 79.4, render: () => <PenScene from={{ ...CAM.cuD, zoom: 3.4 }} to={CAM.cuD} ease={easeOut} shakeAmp={4} dumpling={{ expr: "suspicious" }} /> },
  { name: "ms-dumpling-despicable", portrait: { x: D_HEAD.x + 20 }, start: 79.4, end: 86.0, render: () => <PenScene from={CAM.msD} to={CAM.two} dumpling={{ expr: "snooty", headTilt: 16 }} gristle={{ expr: "sad" }} /> },

  // --- "Brother, when they took me outside the reaches of the pointy fences" ---
  { name: "cu-gristle-when", start: 86.0, end: 90.3, render: () => <PenScene from={CAM.cuG} to={{ ...CAM.cuG, zoom: 3.6 }} gristle={{ expr: "sad", look: [0.1, -0.2] }} /> },
  { name: "fb-road", portrait: { x: 1080, zoom: 1.15 }, start: 90.3, end: 93.7, grade: "memory", transition: "static", grain: 0.45, render: () => <RoadAwayScene /> },
  { name: "ecu-gristle-sawit", start: 93.7, end: 95.7, transition: "static", render: () => <PenScene from={CAM.ecuG} to={{ ...CAM.ecuG, zoom: 6.0 }} gristle={{ expr: "manic", bulge: 1 }} /> },
  { name: "fb-fair", portrait: { x: (l) => lerp(640, 1180, easeInOut(prog(l, 0.4, 7.4))) + 110 }, start: 95.7, end: 103.45, grade: "memory", transition: "static", grain: 0.45, render: () => <FairScene /> },
  { name: "fb-feast", start: 103.45, end: 110.3, grade: "memory", grain: 0.45, render: () => <FeastScene /> },
  { name: "fb-sniff", start: 110.3, end: 113.95, grade: "memory", grain: 0.45, render: () => <SniffScene /> },
  { name: "fb-spit", start: 113.95, end: 122.5, grade: "memory", grain: 0.45, render: () => <SpitRoastScene /> },
  { name: "grossup", start: 122.5, end: 129.45, grade: "hell", grain: 0.4, render: () => <GrossUpScene /> },
  { name: "cu-gristle-consumers", start: 129.45, end: 132.55, transition: "static", render: () => <PenScene from={CAM.cuG} to={CAM.ecuG} gristle={{ expr: "intense", bulge: 0.4 }} /> },
  { name: "fox", portrait: { zoom: 1.12 }, start: 132.55, end: 139.2, grade: "hell", grain: 0.4, render: () => <FoxScene /> },

  // --- "Your story amuses me, brother, but does not convince me." ---------
  { name: "cu-dumpling-amuses", start: 139.2, end: 143.5, transition: "static", render: () => <PenScene from={CAM.cuD} to={{ ...CAM.cuD, zoom: 3.2 }} dumpling={{ expr: "laugh", headTilt: -10 }} /> },
  { name: "dumpling-dine", portrait: { x: D_HEAD.x + 40 }, start: 143.5, end: 148.6, render: () => <PenScene from={CAM.msD} to={CAM.wideTight} dumpling={{ expr: "dreamy" }} gristle={{ expr: "sad" }} shedGlow={1.6} /> },

  // --- "I am sorry for you, brother." --------------------------------------
  { name: "cu-gristle-sorry", start: 148.6, end: 151.4, render: () => <PenScene from={CAM.cuG} to={{ ...CAM.cuG, zoom: 3.3 }} gristle={{ expr: "sad" }} /> },
  { name: "gristle-blinding-light", start: 151.4, end: 155.3, render: () => <BlindingLight /> },
  { name: "cave", portrait: { zoom: 1.08 }, start: 155.3, end: 157.7, grade: "cave", transition: "flash", render: () => <CaveScene /> },
  { name: "cu-gristle-ishall", start: 157.7, end: 159.6, render: () => <PenScene from={CAM.cuG} to={CAM.ecuG} gristle={{ expr: "intense" }} /> },
  { name: "lambs", portrait: { zoom: 0.8, dy: 60 }, start: 159.6, end: 161.95, render: () => <LambsScene /> },
  { name: "ecu-gristle-consume", start: 161.95, end: 163.6, render: () => <PenScene from={CAM.ecuG} to={{ ...CAM.ecuG, zoom: 6.2 }} gristle={{ expr: "manic", bulge: 0.7 }} /> },
  { name: "portraits", start: 163.6, end: 168.6, grade: "night", render: () => <PortraitsScene /> },

  // --- Outro (music) -------------------------------------------------------
  { name: "shed-door-end", portrait: { zoom: 1.12, dy: 40 }, start: 168.6, end: 171.7, render: () => <ShedDoorScene /> },
  { name: "black", start: 171.7, end: 172.3, grain: 0.15, render: () => <BlackFrame /> },
  { name: "gristle-eats", portrait: { zoom: 1.25, y: 470 }, start: 172.3, end: 174.6, render: () => <GristleEats /> },
  { name: "title", start: 174.6, end: 999, grade: "none", vignette: 0.6, render: () => <TitleCard /> },
];
