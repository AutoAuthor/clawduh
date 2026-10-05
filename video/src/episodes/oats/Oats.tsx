import React from "react";
import { staticFile } from "remotion";
import { EpisodePlayer } from "../../engine/EpisodePlayer";
import type { Timeline } from "../../engine/timeline";
import timelineJson from "./timeline.json";
import { D_HEAD, G_HEAD } from "./common";
import { shots } from "./shots";

export const timeline = timelineJson as Timeline;

export type OatsProps = {
  captions: boolean;
  debug: boolean;
  fx?: { boil: boolean; grain: boolean; grade: boolean };
};

export const Oats: React.FC<OatsProps> = ({ captions, debug, fx }) => (
  <EpisodePlayer
    timeline={timeline}
    shots={shots}
    audioSrc={staticFile("episodes/oats/audio.wav")}
    captions={captions}
    debug={debug}
    fx={fx}
    speakerFocus={{ gristle: { x: G_HEAD.x + 30, y: G_HEAD.y + 120 }, dumpling: { x: D_HEAD.x + 20, y: D_HEAD.y + 120 } }}
  />
);
