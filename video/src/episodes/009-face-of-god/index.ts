import type { EpisodeDef } from "../../engine/episode";
import type { Timeline } from "../../engine/timeline";
import { HEADS9 } from "./room";
import { shots, TAIL } from "./shots";
import timeline from "./timeline.json";

/** EPISODE 009 — "I Once Saw the Face of God". Holds after the audio for the eye at the window and a title card. */
export const episode: EpisodeDef = {
  id: "009-face-of-god",
  title: "I Once Saw the Face of God",
  timeline: timeline as Timeline,
  shots,
  tail: TAIL,
  speakerFocus: { glim: HEADS9.glim, rachel: HEADS9.rachel },
};
