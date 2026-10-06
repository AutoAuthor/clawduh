import type { EpisodeDef } from "../../engine/episode";
import type { Timeline } from "../../engine/timeline";
import { HEADS } from "./porch";
import { shots } from "./shots";
import timeline from "./timeline.json";

/** EPISODE 008 — "Brother, I Crave the Forbidden Lamp". Two moth brothers, one bare porch bulb, one bug zapper. */
export const episode: EpisodeDef = {
  id: "008-forbidden-lamp",
  title: "Brother, I Crave the Forbidden Lamp",
  timeline: timeline as Timeline,
  shots,
  tail: 7,
  speakerFocus: {
    wick: { x: HEADS.wick.x + 40, y: HEADS.wick.y + 130 },
    tatter: { x: HEADS.tatter.x - 40, y: HEADS.tatter.y + 130 },
  },
};
