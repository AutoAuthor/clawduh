import type { EpisodeDef } from "../../engine/episode";
import type { Timeline } from "../../engine/timeline";
import { HEADS } from "./grill";
import { shots } from "./shots";
import timeline from "./timeline.json";

/** EPISODE 004 — "How To Leave Early". Holds after the audio on the exterior for the silent punchline. */
export const episode: EpisodeDef = {
  id: "004-leave-early",
  title: "How To Leave Early",
  timeline: timeline as Timeline,
  shots,
  tail: 1.6,
  speakerFocus: { dale: HEADS.dale, chet: HEADS.chet, gizzard: HEADS.gizzard },
};
