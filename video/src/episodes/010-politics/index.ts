import type { EpisodeDef } from "../../engine/episode";
import { shots } from "./shots";
import { TL } from "./tl";

/** EPISODE 010 — "My Politics: Then vs Now". Holds after the audio for the silent punchline. */
export const episode: EpisodeDef = {
  id: "010-politics",
  title: "My Politics: Then vs Now",
  timeline: TL,
  shots,
  tail: 2.6,
};
