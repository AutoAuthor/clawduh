import type { EpisodeDef } from "../../engine/episode";
import type { Timeline } from "../../engine/timeline";
import { HEADS } from "./livingroom";
import { shots, TAIL } from "./shots";
import timeline from "./timeline.json";

/** EPISODE 006 — "Don't Steal HIS Package". Holds after the audio on the porch cam for the silent punchline. */
export const episode: EpisodeDef = {
  id: "006-his-package",
  title: "Don't Steal HIS Package",
  timeline: timeline as Timeline,
  shots,
  tail: TAIL,
  speakerFocus: { skeeter: HEADS.skeeter, dobbins: HEADS.dobNear },
};
