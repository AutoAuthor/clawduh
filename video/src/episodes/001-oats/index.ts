import type { EpisodeDef } from "../../engine/episode";
import type { Timeline } from "../../engine/timeline";
import { D_HEAD, G_HEAD } from "./common";
import { shots } from "./shots";
import timeline from "./timeline.json";

/** EPISODE 001 — "Brother, may I have some oats?" (audio: burialgoods) */
export const episode: EpisodeDef = {
  id: "001-oats",
  title: "Brother, May I Have Some Oats?",
  timeline: timeline as Timeline,
  shots,
  speakerFocus: { gristle: { x: G_HEAD.x + 30, y: G_HEAD.y + 120 }, dumpling: { x: D_HEAD.x + 20, y: D_HEAD.y + 120 } },
};
