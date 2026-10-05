import React from "react";
import { Composition } from "remotion";
import "./engine/fonts";
import { Oats, timeline } from "./episodes/oats/Oats";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Oats"
      component={Oats}
      durationInFrames={Math.ceil(timeline.duration * timeline.fps)}
      fps={timeline.fps}
      width={1920}
      height={1080}
      defaultProps={{ captions: true, debug: false }}
    />
    {/* 9:16 for Shorts / TikTok / Reels: same episode, shots reframed via ShotDef.portrait */}
    <Composition
      id="OatsVertical"
      component={Oats}
      durationInFrames={Math.ceil(timeline.duration * timeline.fps)}
      fps={timeline.fps}
      width={1080}
      height={1920}
      defaultProps={{ captions: true, debug: false }}
    />
  </>
);
