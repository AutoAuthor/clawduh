import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { DISP_MAPS } from "./dispMaps";
import { Captions, buildPhrases } from "./Captions";
import { EpisodeContext, FxContext, FxFlags } from "./context";
import { Flicker, Grade, Grain, TransitionIn, TransitionOverlay, Vignette, gradeFilter } from "./fx";
import type { Timeline } from "./timeline";

export interface ShotDef {
  /** seconds (absolute) */
  start: number;
  end: number;
  name: string;
  grade?: Grade;
  transition?: TransitionIn;
  grain?: number;
  vignette?: number;
  /** Draws the shot. Components read timing via useEpisode(). */
  render: () => React.ReactNode;
}

export interface EpisodePlayerProps {
  timeline: Timeline;
  shots: ShotDef[];
  audioSrc: string;
  captions: boolean;
  debug: boolean;
  fx?: FxFlags;
}

export const EpisodePlayer: React.FC<EpisodePlayerProps> = ({ timeline, shots, audioSrc, captions, debug, fx = { boil: true, grain: true, grade: true } }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const phrases = useMemo(() => buildPhrases(timeline), [timeline]);

  const shot = shots.find((s) => t >= s.start && t < s.end) ?? shots[shots.length - 1];
  const local = t - shot.start;
  const ctx = {
    timeline,
    shot: { t, frame, fps, start: shot.start, end: shot.end, local, p: Math.min(1, Math.max(0, local / (shot.end - shot.start))) },
  };

  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <FxContext.Provider value={fx}>
        <EpisodeContext.Provider value={ctx}>
          <AbsoluteFill style={{ filter: fx.grade ? gradeFilter(shot.grade ?? "night") : undefined }}>{shot.render()}</AbsoluteFill>
        </EpisodeContext.Provider>
      </FxContext.Provider>
      <Vignette strength={shot.vignette ?? 0.85} />
      {fx.grain ? <Grain frame={frame} opacity={shot.grain ?? 0.3} /> : null}
      <Flicker frame={frame} />
      <TransitionOverlay kind={shot.transition ?? "cut"} local={local} frame={frame} />
      {captions ? <Captions phrases={phrases} t={t} /> : null}
      {debug ? (
        <div style={{ position: "absolute", left: 20, top: 16, color: "#0f0", font: "28px monospace", textShadow: "0 0 4px #000" }}>
          {shot.name} | t={t.toFixed(2)} | f={frame}
        </div>
      ) : null}
      <Audio src={audioSrc} />
      {/* preload the boil maps so <feImage> never samples an unloaded image */}
      <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
        {DISP_MAPS.map((m, i) => (
          <Img key={i} src={m} style={{ width: 1, height: 1 }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
