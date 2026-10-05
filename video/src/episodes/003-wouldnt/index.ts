import type { EpisodeDef } from "../../engine/episode";
import type { Timeline } from "../../engine/timeline";
import { CAT_HEAD } from "./kitchen";
import { shots } from "./shots";
import timeline from "./timeline.json";

/** EPISODE 003 — "You wouldn't" (audio: burialgoods). Holds ~1.2s after the audio on the drenched cat. */
export const episode: EpisodeDef = {
  id: "003-wouldnt",
  title: "You Wouldn't",
  timeline: timeline as Timeline,
  shots,
  tail: 1.15,
  speakerFocus: { crumpet: { x: CAT_HEAD.x, y: CAT_HEAD.y + 80 } },
};
