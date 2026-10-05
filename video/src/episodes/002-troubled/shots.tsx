import React from "react";
import { useEpisode } from "../../engine/context";
import type { Reframe, ShotDef } from "../../engine/EpisodePlayer";
import type { Grade, TransitionIn } from "../../engine/fx";
import { cue, Timeline } from "../../engine/timeline";
import { easeInOut, easeOut, lerp, prog } from "../../engine/util";
import {
  BarnDennis,
  CrowsOnFence,
  DennisToShed,
  Dynasty,
  HayToss,
  HoofStomp,
  HornGleam,
  MeatMilk,
  NewBull,
  PigsFeast,
  PigSty,
  ShedNoReturn,
} from "./cutaways";
import { ArmyOfFigures, FarmerAsleep, FenceCharge, Hayloft, NightRest, SunriseReckoning, TitleCard002, Wilderness } from "./finale";
import { B_HEAD, CAM2, PrairieScene } from "./prairie";
import timelineJson from "./timeline.json";

/**
 * EPISODE 002 — "Brother, I am troubled" (audio: burialgoods).
 * Every shot starts on a phrase of the script (cue), so the cut follows the words whether the timeline came
 * from captions (provisional) or from the real audio. A shot ends where the next one starts.
 */
const tl = timelineJson as Timeline;
const at = (phrase: string, offset = 0, after?: number) => cue(tl, phrase, { offset, after });
const atEnd = (phrase: string, offset = 0, after?: number) => cue(tl, phrase, { edge: "end", offset, after });

type S = { name: string; start: number; render: () => React.ReactNode; portrait?: Reframe; grade?: Grade; transition?: TransitionIn; grain?: number; vignette?: number };

const SPEAKER: Reframe = { x: "speaker", dy: 40 };
const WIDE_V: Reframe = { zoom: 0.9, x: 960, y: 600 };

/* small wrappers for shots with time-dependent behaviour */
const BrisketBuild = ({ from = 0.25, to = 0.8 }: { from?: number; to?: number }) => {
  const { shot } = useEpisode();
  const k = easeInOut(shot.p);
  return <PrairieScene from={CAM2.cuB} to={CAM2.ecuB} brisket={{ expr: k > 0.5 ? "rage" : "intense", redEyes: lerp(from, to, k), steam: k }} />;
};
const ChuckTurnsToShed = () => {
  const { shot } = useEpisode();
  return <PrairieScene from={CAM2.cuC} to={{ ...CAM2.cuC, x: CAM2.cuC.x - 80 }} chuck={{ expr: "dismissive", headTilt: lerp(0, -14, easeOut(shot.p)), look: [-0.6, -0.2] }} />;
};
const FarmPush = () => <PrairieScene from={CAM2.farm} to={CAM2.shed} brisket={false} chuck={false} shedGlow={1.6} />;
const NightFence = () => {
  const { shot } = useEpisode();
  return <PrairieScene from={{ x: 760, y: 640, zoom: 2.0 }} to={{ x: 820, y: 620, zoom: 2.4 }} chuck={false} brisket={{ expr: "rage", charge: easeOut(shot.p), steam: 1, redEyes: 1, look: [0.8, 0.3] }} />;
};

const list: S[] = [
  // --- "Brother, I am troubled." -------------------------------------------------------
  { name: "wide-open", start: 0, transition: "fade", render: () => <PrairieScene from={CAM2.wide} to={CAM2.wideIn} brisket={{ expr: "troubled" }} chuck={{ expr: "content" }} />, portrait: WIDE_V },
  { name: "cu-b-wrong", start: at("Something is wrong"), render: () => <PrairieScene from={CAM2.cuB} to={{ ...CAM2.cuB, zoom: 3.1 }} brisket={{ expr: "troubled" }} /> },
  { name: "cu-c-speak", start: at("Speak your feelings"), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "content" }} /> },
  { name: "ms-b-strong", start: at("We are strong"), render: () => <PrairieScene from={CAM2.msB} to={{ ...CAM2.msB, zoom: 1.9 }} brisket={{ expr: "troubled" }} /> },
  { name: "low-mightiest", start: at("mightiest bulls in the prairie", -1.0), render: () => <PrairieScene from={{ x: 960, y: 760, zoom: 1.3 }} to={{ x: 960, y: 720, zoom: 1.2 }} brisket={{ expr: "proud" }} chuck={{ expr: "proud" }} />, portrait: SPEAKER },
  { name: "cu-b-enormous", start: at("we are enormous", -0.5), render: () => <PrairieScene from={CAM2.cuB} brisket={{ expr: "troubled", headTilt: -4 }} /> },
  { name: "ms-c-girth", start: at("Our girth", -0.6), render: () => <PrairieScene from={CAM2.msC} to={{ ...CAM2.msC, zoom: 1.5, y: CAM2.msC.y + 60 }} chuck={{ expr: "proud" }} /> },
  { name: "wide-rule", start: at("we rule over this prairie", -0.6), render: () => <PrairieScene from={{ x: 760, y: 560, zoom: 1.05 }} to={{ x: 1160, y: 560, zoom: 1.05 }} brisket={{ expr: "troubled" }} />, portrait: { zoom: 0.95, x: (l) => lerp(B_HEAD.x, 1100, easeInOut(prog(l, 0, 5))) } },
  { name: "herd-pan", start: at("Our powers uncontested"), render: () => <PrairieScene from={{ ...CAM2.herd, x: 1650 }} to={{ ...CAM2.herd, x: 1950 }} brisket={false} chuck={false} /> },
  { name: "cu-c-troubles", start: at("What troubles you", -0.7), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "neutral" }} /> },

  // --- the calves ------------------------------------------------------------------------
  { name: "cu-b-calves", start: at("And we have many calves"), render: () => <PrairieScene from={CAM2.cuB} to={{ ...CAM2.cuB, zoom: 3.0 }} brisket={{ expr: "troubled" }} /> },
  { name: "cu-c-dozens", start: atEnd("do we not", 0.08, at("many calves")), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "content" }} /> },
  { name: "herd-empty", start: at("Then where are they"), render: () => <PrairieScene from={{ x: 1750, y: 680, zoom: 1.6 }} to={{ x: 1550, y: 680, zoom: 1.8 }} chuck={false} brisket={{ expr: "troubled", look: [0.9, -0.2] }} />, portrait: { x: (l) => lerp(1850, 1600, easeInOut(prog(l, 0, 6))) } },
  { name: "ms-c-inherd", start: at("They are in the herd", -1.3), render: () => <PrairieScene from={CAM2.msC} chuck={{ expr: "dismissive" }} /> },
  { name: "pov-herd", start: at("Where in the herd"), render: () => <PrairieScene from={{ ...CAM2.herd, zoom: 2.4 }} to={{ ...CAM2.herd, zoom: 2.0, x: 1900 }} brisket={false} chuck={false} /> },
  { name: "cu-c-hardly", start: at("I can hardly be expected"), render: () => <PrairieScene from={CAM2.cuC} to={{ ...CAM2.cuC, zoom: 2.9 }} chuck={{ expr: "dismissive" }} /> },
  { name: "cu-b-anyone", start: at("Do you see any of them"), render: () => <PrairieScene from={CAM2.cuB} to={CAM2.ecuB} brisket={{ expr: "intense" }} /> },
  { name: "cu-c-son", start: at("I see your son", -0.8), render: () => <ChuckTurnsToShed /> },
  { name: "barn-ext", start: at("over in the barn", -0.15), render: () => <PrairieScene from={{ x: 830, y: 540, zoom: 3.2 }} to={{ x: 830, y: 540, zoom: 4.2 }} brisket={false} chuck={false} /> },
  { name: "dennis-hello", start: at("Hello", -0.35), render: () => <BarnDennis />, portrait: { zoom: 1.2 } },
  { name: "cu-b-dennis", start: at("there is something wrong with", -0.6), render: () => <PrairieScene from={CAM2.cuB} brisket={{ expr: "intense" }} /> },
  { name: "cu-c-fathom", start: at("I cannot fathom"), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "dismissive" }} /> },
  { name: "dennis-weather", start: at("Lovely weather here in the barn", -0.25), render: () => <BarnDennis zoom={1.25} />, portrait: { zoom: 1.2 } },
  { name: "fb-dennis-shed", start: at("done something to him", -2.0), grade: "memory", transition: "static", grain: 0.45, render: () => <DennisToShed />, portrait: { x: (l) => lerp(500, 1150, easeInOut(prog(l, 0, 3.6))) } },

  // --- the pigs ----------------------------------------------------------------------------
  { name: "cu-c-pigs", start: at("now you sound like the pigs", -0.7), transition: "static", render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "dismissive" }} /> },
  { name: "pigs-speaking", start: at("you have heard them speaking", -0.5), render: () => <PigSty />, portrait: { zoom: 0.8 } },
  { name: "pigs-gobble", start: at("Always concerned with getting more food"), render: () => <PigSty gobble />, portrait: { zoom: 0.8 } },
  { name: "ms-c-starving", start: at("Do you see us starving"), render: () => <PrairieScene from={CAM2.msC} to={CAM2.cuC} chuck={{ expr: "proud" }} /> },
  { name: "hay-serve", start: at("they worship serve us", -1.4), render: () => <HayToss />, portrait: { x: 1100 } },
  { name: "cu-b-howsee", start: at("I do not think that is how they see it"), render: () => <PrairieScene from={CAM2.cuB} brisket={{ expr: "troubled" }} /> },
  { name: "cu-c-fear", start: at("Then they must surely fear us"), render: () => <PrairieScene from={CAM2.cuC} to={{ ...CAM2.cuC, zoom: 3.0 }} chuck={{ expr: "proud" }} /> },
  { name: "horn-gleam", start: at("And gore them with our horns", -0.9), grade: "hell", render: () => <HornGleam /> },
  { name: "hoof-stomp", start: at("And then stomp their bones"), grade: "hell", render: () => <HoofStomp /> },
  { name: "two-crush", start: at("And crush the very breath"), render: () => <PrairieScene from={CAM2.two} brisket={{ expr: "proud" }} chuck={{ expr: "proud" }} />, portrait: SPEAKER },
  { name: "pigs-feast", start: at("drag them out for the pigs", -0.2), grade: "hell", render: () => <PigsFeast />, portrait: { zoom: 0.85 } },

  // --- the shed ------------------------------------------------------------------------------
  { name: "two-whymight", start: at("That we could"), render: () => <PrairieScene from={CAM2.two} to={{ ...CAM2.two, zoom: 1.55 }} brisket={{ expr: "troubled" }} chuck={{ expr: "content" }} />, portrait: SPEAKER },
  { name: "farm-shed", start: at("Do you see the shed in the distance"), render: () => <FarmPush />, portrait: { zoom: 1.0 } },
  { name: "cu-c-whybother", start: at("bother looking past the great", -0.9), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "content" }} /> },
  { name: "grass-heifers", start: at("Our kingdom is here"), render: () => <PrairieScene from={{ x: 1300, y: 660, zoom: 1.6 }} to={{ x: 1350, y: 660, zoom: 1.8 }} brisket={false} chuck={{ expr: "content" }} /> },
  { name: "cu-b-butsee", start: at("But you do see it"), render: () => <PrairieScene from={CAM2.cuB} brisket={{ expr: "intense" }} /> },
  { name: "cu-c-lookupon", start: at("I can look upon it"), render: () => <ChuckTurnsToShed /> },
  { name: "cu-b-pigscall", start: at("So the pigs call it"), render: () => <PrairieScene from={CAM2.cuB} brisket={{ expr: "troubled" }} /> },
  { name: "ms-c-obsessed", start: at("You speak of the pigs again"), render: () => <PrairieScene from={CAM2.msC} to={CAM2.cuC} chuck={{ expr: "dismissive" }} /> },
  { name: "shed-noreturn", start: at("They call it the shed of no return"), render: () => <ShedNoReturn />, portrait: { zoom: 1.1 } },
  { name: "cu-c-ominous", start: at("how ominous", -0.5), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "proud", headTilt: 6 }} /> },
  { name: "dennis-see", start: at("I think I see a", -0.25), render: () => <BarnDennis zoom={1.4} />, portrait: { zoom: 1.15 } },
  { name: "cu-c-fools", start: at("are fools", -0.7, at("I think I see a")), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "dismissive" }} /> },
  { name: "cu-b-damaged", start: at("they took Dennis to that shed", -0.6), render: () => <PrairieScene from={CAM2.cuB} to={{ ...CAM2.cuB, zoom: 3.2 }} brisket={{ expr: "intense", redEyes: 0.2 }} /> },

  // --- denial ---------------------------------------------------------------------------------
  { name: "cu-c-insist", start: at("If you insist"), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "dismissive" }} /> },
  { name: "push-b-truth", start: at("You don't care, do you"), render: () => <PrairieScene from={CAM2.msB} to={CAM2.ecuB} brisket={{ expr: "intense", redEyes: 0.25 }} /> },
  { name: "cu-c-othercalves", start: at("We have other calves"), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "content" }} /> },
  { name: "cu-b-dontsee", start: at("I don't see any"), render: () => <PrairieScene from={CAM2.cuB} brisket={{ expr: "intense" }} /> },
  { name: "cu-c-makemore", start: at("as many more as we want", -1.0), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "proud", headTilt: 8 }} /> },
  { name: "two-listen", start: at("Listen to yourself"), render: () => <PrairieScene from={CAM2.two} to={{ ...CAM2.two, zoom: 1.5 }} brisket={{ expr: "intense" }} chuck={{ expr: "content" }} />, portrait: SPEAKER },
  { name: "cu-c-nothingelse", start: at("There is nothing else to see"), render: () => <PrairieScene from={CAM2.cuC} to={{ ...CAM2.cuC, zoom: 3.1 }} chuck={{ expr: "sad", look: [0.2, -0.3] }} /> },
  { name: "cu-b-knowmore", start: at("You know more than you are saying"), render: () => <PrairieScene from={CAM2.cuB} brisket={{ expr: "intense" }} /> },
  { name: "push-c-sadness", start: at("you do not wish to have more sadness", -0.7), render: () => <PrairieScene from={CAM2.msC} to={CAM2.ecuC} chuck={{ expr: "sad" }} /> },
  { name: "wide-beat", start: atEnd("say less than do", 0.15), render: () => <PrairieScene from={CAM2.wide} to={{ ...CAM2.wide, zoom: 1.05 }} brisket={{ expr: "sad" }} chuck={{ expr: "sad" }} />, portrait: WIDE_V },

  // --- the dynasty -----------------------------------------------------------------------------
  { name: "cu-b-sire", start: at("be able to sire", -1.0), render: () => <PrairieScene from={CAM2.cuB} to={{ ...CAM2.cuB, zoom: 3.2 }} brisket={{ expr: "troubled" }} /> },
  { name: "cu-c-challenge", start: at("He would challenge our rule", -1.3), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "neutral" }} /> },
  { name: "newbull", start: at("will bring in new bulls", -2.2), render: () => <NewBull />, portrait: { x: (l) => lerp(300, 900, easeOut(prog(l, 0, 3.5))) } },
  { name: "dynasty", start: at("So our dynasty is meaningless"), render: () => <Dynasty />, portrait: { zoom: 0.9 } },
  { name: "dynasty-x", start: at("It dies with us"), render: () => <Dynasty crossed />, portrait: { zoom: 1.1, y: 640 } },
  { name: "cu-b-othercalves", start: at("And our other calves"), render: () => <PrairieScene from={CAM2.cuB} brisket={{ expr: "sad" }} /> },
  { name: "meatmilk", start: at("some for meat and some for milk", -0.4), render: () => <MeatMilk />, portrait: { zoom: 0.85 } },
  { name: "crows", start: at("if what the crows say is true", -0.2), render: () => <CrowsOnFence />, portrait: { zoom: 0.8 } },
  { name: "cu-b-pigs2", start: atEnd("crows say is true", 0.2), render: () => <PrairieScene from={CAM2.cuB} brisket={{ expr: "troubled" }} /> },
  { name: "pigs-stare", start: at("fools all of them", -1.1), render: () => <PigSty stare />, portrait: { zoom: 0.8 } },
  { name: "cu-c-betternot", start: at("Better not to", -0.2), render: () => <PrairieScene from={CAM2.cuC} to={{ ...CAM2.cuC, zoom: 3.1 }} chuck={{ expr: "sad" }} /> },

  // --- the plan ----------------------------------------------------------------------------------
  { name: "low-b-fence", start: at("I could break the great fence"), render: () => <PrairieScene from={{ x: B_HEAD.x - 140, y: 760, zoom: 1.6 }} to={{ x: B_HEAD.x - 100, y: 720, zoom: 1.8 }} chuck={false} brisket={{ expr: "intense", steam: 0.6 }} /> },
  { name: "cu-c-thenwhat", start: at("And then what, brother", -0.2), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "neutral" }} /> },
  { name: "cu-b-house", start: at("I could charge through the door"), render: () => <PrairieScene from={CAM2.cuB} to={CAM2.ecuB} brisket={{ expr: "intense", steam: 0.7, redEyes: 0.3 }} /> },
  { name: "farmer", start: at("The older one sleeps in there", -0.3), render: () => <FarmerAsleep />, portrait: { x: (l) => lerp(760, 1450, easeInOut(prog(l, 1.5, 4.5))) } },
  { name: "hayloft", start: at("There are more of the tall", -0.2), render: () => <Hayloft />, portrait: { zoom: 0.85 } },
  { name: "dennis-cold", start: at("It's cold in here", -0.25), render: () => <BarnDennis zoom={1.15} />, portrait: { zoom: 1.2 } },
  { name: "cu-b-gore", start: at("I could gore them"), render: () => <PrairieScene from={CAM2.cuB} brisket={{ expr: "rage", steam: 0.6, redEyes: 0.35 }} /> },
  { name: "cu-c-both", start: at("Both of them, brother"), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "neutral" }} /> },
  { name: "two-ifhelped", start: at("If you helped me", -0.9), render: () => <PrairieScene from={CAM2.two} brisket={{ expr: "intense" }} chuck={{ expr: "sad" }} />, portrait: SPEAKER },
  { name: "cu-c-whatthen", start: at("If you did, more would come", -1.2), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "neutral" }} /> },
  { name: "sunrise", start: at("With the sun"), render: () => <SunriseReckoning />, portrait: { x: (l) => (l < 3 ? lerp(300, 800, l / 3) : lerp(800, 1200, prog(l, 3, 6))) } },
  { name: "cu-b-leave", start: at("then we will leave before the sun", -1.6), render: () => <PrairieScene from={CAM2.cuB} brisket={{ expr: "intense" }} /> },
  { name: "cu-c-whatthen2", start: at("And then what? We lead"), render: () => <PrairieScene from={CAM2.cuC} chuck={{ expr: "neutral" }} /> },
  { name: "wilderness", start: at("into the wilderness", -0.3), render: () => <Wilderness />, portrait: { x: (l) => (l < 4.6 ? 900 : lerp(900, 1500, easeInOut(prog(l, 4.6, 7.0)))) } },
  { name: "cu-b-killthem", start: at("Not if we kill them"), render: () => <PrairieScene from={CAM2.cuB} to={CAM2.ecuB} brisket={{ expr: "rage", redEyes: 0.55, steam: 0.8 }} /> },
  { name: "cu-c-killall", start: at("Can you kill all of them"), render: () => <PrairieScene from={CAM2.cuC} to={{ ...CAM2.cuC, zoom: 3.2 }} chuck={{ expr: "intense" }} /> },
  { name: "army", start: at("Can you murder the world"), grade: "hell", grain: 0.4, render: () => <ArmyOfFigures />, portrait: { zoom: 0.9 } },
  { name: "two-atmyside", start: at("No, but I can kill more"), transition: "flash", render: () => <PrairieScene from={CAM2.two} to={{ ...CAM2.two, zoom: 1.55 }} brisket={{ expr: "resolved", redEyes: 0.5 }} chuck={{ expr: "sad" }} />, portrait: SPEAKER },
  { name: "cu-c-herddies", start: at("Then the whole herd dies"), render: () => <PrairieScene from={CAM2.cuC} to={{ ...CAM2.cuC, zoom: 3.1 }} chuck={{ expr: "sad" }} /> },
  { name: "ecu-b-vengeance", start: at("For vengeance, brother"), render: () => <PrairieScene from={CAM2.ecuB} to={{ ...CAM2.ecuB, zoom: 5.6 }} brisket={{ expr: "rage", redEyes: 0.75, steam: 1 }} /> },

  // --- night ----------------------------------------------------------------------------------------
  { name: "night-rest", start: at("You have slept here before", -0.5), render: () => <NightRest chuckLying brisketExpr="sad" />, portrait: { x: (l) => lerp(1350, 700, easeInOut(prog(l, 8, 18))) } },
  { name: "cu-b-no", start: atEnd("clearer than", 0.6), render: () => <PrairieScene from={CAM2.cuB} chuck={false} brisket={{ expr: "rage", redEyes: 0.85, steam: 0.8 }} /> },
  { name: "push-b-blood", start: at("my eyes are swollen red", -1.6), render: () => <BrisketBuild from={0.85} to={1} /> },
  { name: "night-fence", start: at("I will break down the great fence", -0.4), render: () => <NightFence /> },
  { name: "farmhouse-night", start: at("I am going to the house"), render: () => <PrairieScene from={{ x: 300, y: 540, zoom: 3.2 }} to={{ x: 300, y: 530, zoom: 4.6 }} brisket={false} chuck={false} /> },
  { name: "ecu-b-flesh", start: at("I will feel the flesh", -0.2), render: () => <BrisketBuild from={1} to={1} /> },
  { name: "night-wide", start: at("I will feel their bodies cold", -0.2), render: () => <NightRest chuckLying brisketExpr="rage" />, portrait: { x: (l) => lerp(700, 1300, easeInOut(prog(l, 2, 7))) } },
  { name: "cu-c-ends", start: at("Then it ends tonight"), render: () => <PrairieScene from={CAM2.cuC} brisket={false} chuck={{ expr: "resolved" }} /> },
  { name: "cu-b-alone", start: at("Alone or together"), render: () => <PrairieScene from={CAM2.cuB} chuck={false} brisket={{ expr: "resolved", redEyes: 0.8, look: [0.9, 0] }} /> },
  { name: "sidebyside", start: at("It ends side by side"), render: () => <FenceCharge standOnly />, portrait: { zoom: 0.95 } },
  { name: "charge", start: atEnd("death of the world", 0.4), render: () => <FenceCharge />, portrait: { zoom: 0.95 } },
  { name: "title", start: atEnd("death of the world", 3.6), grade: "none", vignette: 0.6, render: () => <TitleCard002 /> },
];

export const shots: ShotDef[] = list.map((s, i) => ({ ...s, end: i + 1 < list.length ? list[i + 1].start : 999 }));

/* sanity: shots must be in order (helps when editing anchors) */
for (let i = 1; i < shots.length; i++) {
  if (!(shots[i].start > shots[i - 1].start)) console.warn(`shot order: "${shots[i].name}" (${shots[i].start.toFixed(2)}) <= "${shots[i - 1].name}" (${shots[i - 1].start.toFixed(2)})`);
}

