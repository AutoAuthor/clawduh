import type { EpisodeDef } from "../../engine/episode";
import type { Timeline } from "../../engine/timeline";
import { HEADS } from "./livingroom";
import { shots, TAIL } from "./shots";
import timeline from "./timeline.json";

/** EPISODE 007 — "What's the Move?". Holds after the audio for Duane asking the void. */
export const episode: EpisodeDef = {
  id: "007-whats-the-move",
  title: "What's the Move?",
  timeline: timeline as Timeline,
  shots,
  tail: TAIL,
  speakerFocus: { duane: HEADS.duane, lyle: HEADS.lyle },
};
