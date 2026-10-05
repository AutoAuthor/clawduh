import type { EpisodeDef } from "../../engine/episode";
import type { Timeline } from "../../engine/timeline";
import { B_HEAD, C_HEAD } from "./prairie";
import { shots } from "./shots";
import timeline from "./timeline.json";

/** EPISODE 002 — "Brother, I am troubled" (audio: burialgoods). */
export const episode: EpisodeDef = {
  id: "002-troubled",
  title: "Brother, I Am Troubled",
  timeline: timeline as Timeline,
  shots,
  tail: 2.0,
  speakerFocus: { brisket: { x: B_HEAD.x - 20, y: B_HEAD.y + 120 }, chuck: { x: C_HEAD.x + 20, y: C_HEAD.y + 120 }, dennis: { x: 960, y: 600 } },
};
