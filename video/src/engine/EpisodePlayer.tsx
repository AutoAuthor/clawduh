import React, { useMemo } from "react";
import { AbsoluteFill, Audio, Img, useCurrentFrame, useVideoConfig } from "remotion";
import { DISP_MAPS } from "./dispMaps";
import { Captions, buildPhrases } from "./Captions";
import { EpisodeContext, FxContext, FxFlags } from "./context";
import { Flicker, Grade, Grain, TransitionIn, TransitionOverlay, Vignette, gradeFilter } from "./fx";
import type { Cam } from "./Stage";
import type { Timeline } from "./timeline";
import { clamp, easeInOut, lerp } from "./util";

/** How a shot is reframed for a 9:16 (portrait) render. Cameras are authored for 16:9. */
export interface Reframe {
  /** zoom multiplier (default 1 = same world scale, i.e. a 1080x1920 window of the world) */
  zoom?: number;
  /** frame centre x: a world x, a function of seconds-into-shot, or follow whoever is speaking */
  x?: number | "speaker" | ((local: number) => number);
  y?: number;
  dx?: number;
  dy?: number;
}

type Focus = Record<string, { x: number; y: number }>;

/** Camera target that follows the active speaker, easing across turn changes. */
function speakerFocus(tl: Timeline, t: number, pos: Focus): { x: number; y: number } {
  const lead = 0.15;
  const dur = 0.45;
  const lines = tl.lines;
  let i = -1;
  for (let k = 0; k < lines.length; k++) {
    if (lines[k].start <= t + lead) i = k;
    else break;
  }
  if (i < 0) return pos[lines[0].speaker];
  const cur = pos[lines[i].speaker];
  let j = i - 1;
  while (j >= 0 && lines[j].speaker === lines[i].speaker) j--;
  if (j < 0) return cur;
  const prev = pos[lines[j].speaker];
  const b = easeInOut(clamp((t + lead - lines[i].start) / dur));
  return { x: lerp(prev.x, cur.x, b), y: lerp(prev.y, cur.y, b) };
}

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
  /** 9:16 reframing (only used when the composition is taller than wide) */
  portrait?: Reframe;
}

export interface EpisodePlayerProps {
  timeline: Timeline;
  shots: ShotDef[];
  audioSrc: string;
  captions: boolean;
  debug: boolean;
  fx?: FxFlags;
  /** world positions of each speaker's head, for Reframe.x = "speaker" */
  speakerFocus?: Focus;
}

export const EpisodePlayer: React.FC<EpisodePlayerProps> = ({
  timeline,
  shots,
  audioSrc,
  captions,
  debug,
  fx = { boil: true, grain: true, grade: true },
  speakerFocus: focusPos,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  const t = frame / fps;
  const phrases = useMemo(() => buildPhrases(timeline), [timeline]);

  const shot = shots.find((s) => t >= s.start && t < s.end) ?? shots[shots.length - 1];
  const local = t - shot.start;
  const reframe = portrait
    ? (cam: Cam): Cam => {
        const r = shot.portrait ?? {};
        let x = cam.x;
        let y = cam.y;
        if (r.x === "speaker" && focusPos) {
          const f = speakerFocus(timeline, t, focusPos);
          x = f.x;
          y = f.y;
        } else if (typeof r.x === "function") x = r.x(local);
        else if (typeof r.x === "number") x = r.x;
        if (typeof r.y === "number") y = r.y;
        return { ...cam, x: x + (r.dx ?? 0), y: y + (r.dy ?? 0), zoom: cam.zoom * (r.zoom ?? 1) };
      }
    : undefined;
  const ctx = {
    timeline,
    shot: { t, frame, fps, start: shot.start, end: shot.end, local, p: Math.min(1, Math.max(0, local / (shot.end - shot.start))) },
    reframe,
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
      {timeline.provisional ? null : <Audio src={audioSrc} />}
      {timeline.provisional && debug ? (
        <div style={{ position: "absolute", right: 20, top: 16, color: "#ff5", font: "26px monospace", textShadow: "0 0 4px #000" }}>PROVISIONAL TIMING (no audio)</div>
      ) : null}
      {/* preload the boil maps so <feImage> never samples an unloaded image */}
      <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}>
        {DISP_MAPS.map((m, i) => (
          <Img key={i} src={m} style={{ width: 1, height: 1 }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
