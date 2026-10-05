import React from "react";
import { staticFile } from "remotion";
import { EpisodePlayer } from "../../engine/EpisodePlayer";
import type { Timeline } from "../../engine/timeline";
import timelineJson from "./timeline.json";
import { shots } from "./shots";

export const timeline = timelineJson as Timeline;

export type OatsProps = {
  captions: boolean;
  debug: boolean;
  fx?: { boil: boolean; grain: boolean; grade: boolean };
};

export const Oats: React.FC<OatsProps> = ({ captions, debug, fx }) => (
  <EpisodePlayer timeline={timeline} shots={shots} audioSrc={staticFile("episodes/oats/audio.wav")} captions={captions} debug={debug} fx={fx} />
);
