import type { EpisodeDef } from "../../engine/episode";
import { TL } from "./fixes";
import { HEADS } from "./dregs";
import { shots } from "./shots";

/** EPISODE 005 — "Last Minute Orders". Holds after the audio for the silent punchline (lights out at DREGS). */
export const episode: EpisodeDef = {
  id: "005-last-orders",
  title: "Last Minute Orders",
  timeline: TL,
  shots,
  tail: 2.6,
  speakerFocus: { lyle: HEADS.lyle, vern: HEADS.vern, mo: HEADS.mo },
};
