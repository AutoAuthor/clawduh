import React from "react";
import { Composition } from "remotion";
import "./engine/fonts";
import { compositionIds, durationInFrames, episodeComponent, shotTimes } from "./engine/episode";
import { EPISODES } from "./episodes";

const COMPONENTS = new Map(EPISODES.map((ep) => [ep.id, episodeComponent(ep)]));

export const RemotionRoot: React.FC = () => (
  <>
    {EPISODES.map((ep) => {
      const ids = compositionIds(ep);
      const component = COMPONENTS.get(ep.id)!;
      const common = { component, durationInFrames: durationInFrames(ep), fps: ep.timeline.fps, defaultProps: { captions: true, debug: false, shotTimes: shotTimes(ep) } };
      return (
        <React.Fragment key={ep.id}>
          <Composition id={ids.landscape} width={1920} height={1080} {...common} />
          {/* 9:16 for Shorts / TikTok / Reels: same episode, shots reframed via ShotDef.portrait */}
          <Composition id={ids.vertical} width={1080} height={1920} {...common} />
        </React.Fragment>
      );
    })}
  </>
);
