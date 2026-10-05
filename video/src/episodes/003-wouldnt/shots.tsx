import { useEpisode } from "../../engine/context";
import type { ShotDef } from "../../engine/EpisodePlayer";
import { cue, Timeline } from "../../engine/timeline";
import { easeInOut, easeOut, lerp, prog } from "../../engine/util";
import { CAM3, CAT_HEAD, KitchenScene, MotherEyesCloseup, MOM_POS, OverShoulderScene, SprayCloseup, SprayHitScene, useMugShove } from "./kitchen";
import timelineJson from "./timeline.json";

/**
 * EPISODE 003 — "You wouldn't" (audio: burialgoods).
 * Shot times are anchored to the script with cue() so they survive re-transcription.
 */
const tl = timelineJson as Timeline;
const at = (phrase: string, opts?: Parameters<typeof cue>[2]) => cue(tl, phrase, opts);

const T = {
  device: at("This device") - 0.25,
  momEyes: at("empty threat", { edge: "end" }) + 0.15,
  heart: at("You do not have") - 0.1,
  favorite: at("your favorite son"),
  over: at("favorite son", { edge: "end" }) + 0.12,
  challenge: at("In fact") - 0.12,
  trigger: at("challenge you", { edge: "end" }) + 0.08,
  beg: at("I beg of you") - 0.05,
  belie: at("I don't") - 0.3,
  spray: at("beli", { edge: "end" }),
};

const WideOpen = () => (
  <KitchenScene from={CAM3.wide} to={CAM3.wideIn} cat={{ expr: "smug", look: [-0.9, 0.05] }} />
);

const CatDevice = () => {
  const { paw, mug } = useMugShove(1.75);
  return <KitchenScene from={CAM3.cuCat} to={{ ...CAM3.cuCat, x: CAM3.cuCat.x - 60, zoom: 2.2, y: CAM3.cuCat.y + 70 }} cat={{ expr: "smug", look: [-0.9, 0.4], pawPoint: paw * 0.55 }} mug={mug} />;
};

const CatHeart = () => {
  const { shot } = useEpisode();
  const fav = easeOut(prog(shot.t, T.favorite - 0.2, T.favorite + 0.3));
  return <KitchenScene from={CAM3.msCat} to={{ ...CAM3.msCat, zoom: 2.1 }} cat={{ expr: fav > 0.5 ? "innocent" : "smug", pawChest: fav, headTilt: fav * -12 }} mug={false} />;
};

const CatChallenge = () => {
  const { shot } = useEpisode();
  const point = easeOut(prog(shot.t, at("challenge") - 0.15, at("challenge") + 0.2));
  return <KitchenScene from={CAM3.cuCat} to={{ ...CAM3.cuCat, zoom: 2.4, y: CAM3.cuCat.y + 30 }} cat={{ expr: "stern", rear: point, pawPoint: point }} mug={false} />;
};

const CatBeg = () => <KitchenScene from={CAM3.cuCat} to={CAM3.ecuCat} cat={{ expr: "taunt", look: [-0.7, 0], headTilt: 6 }} mug={false} />;

const CatBelie = () => <KitchenScene from={CAM3.ecuCat} to={{ ...CAM3.ecuCat, zoom: 5.0 }} cat={{ expr: "taunt", look: [-0.8, 0], headTilt: 8 }} mug={false} />;

export const shots: ShotDef[] = [
  // "I do not fear you, mother."  — vertical pans from the cat to Mother on "mother"
  { name: "wide-open", start: 0, end: T.device - 1.3, transition: "fade", render: () => <WideOpen />, portrait: { zoom: 1.05, x: (l) => lerp(CAT_HEAD.x, MOM_POS.x + 40, easeInOut(prog(l, 0.9, 1.7))), y: 560 } },
  { name: "spray-rise", start: T.device - 1.3, end: T.device, render: () => <SprayCloseup rise={1} />, portrait: { zoom: 1.15, x: 900 } },
  // "This device is nothing more than an empty threat."
  { name: "cu-cat-device", start: T.device, end: T.momEyes, render: () => <CatDevice /> },
  { name: "ecu-mother-eyes", start: T.momEyes, end: T.heart, render: () => <MotherEyesCloseup />, portrait: { zoom: 1.6 } },
  // "You do not have a heart to dampen me, your favorite son."
  { name: "ms-cat-heart", start: T.heart, end: T.over, render: () => <CatHeart /> },
  { name: "over-shoulder", start: T.over, end: T.challenge, render: () => <OverShoulderScene />, portrait: { x: 980, zoom: 1.05 } },
  // "In fact, I challenge you."
  { name: "cu-cat-challenge", start: T.challenge, end: T.trigger, render: () => <CatChallenge /> },
  { name: "ecu-trigger", start: T.trigger, end: T.beg, render: () => <SprayCloseup rise={1} squeeze={0.55} />, portrait: { zoom: 1.15, x: 880 } },
  // "I beg of you to prove your worth."
  { name: "cu-cat-beg", start: T.beg, end: T.belie, render: () => <CatBeg /> },
  // "I don't beli—"  *PSSHT*
  { name: "ecu-cat-belie", start: T.belie, end: T.spray, render: () => <CatBelie /> },
  { name: "spray-hit", start: T.spray, end: T.spray + 0.6, grade: "none", render: () => <SprayHitScene /> },
  { name: "drenched", start: T.spray + 0.6, end: 999, render: () => <SprayHitScene drenched /> },
];
