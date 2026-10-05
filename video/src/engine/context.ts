import { createContext, useContext } from "react";
import type { Timeline } from "./timeline";

export interface ShotInfo {
  /** absolute seconds */
  t: number;
  /** absolute frame */
  frame: number;
  fps: number;
  /** shot start/end in seconds */
  start: number;
  end: number;
  /** seconds since shot start */
  local: number;
  /** 0..1 progress through the shot */
  p: number;
}

export interface EpisodeCtx {
  timeline: Timeline;
  shot: ShotInfo;
}

export const EpisodeContext = createContext<EpisodeCtx | null>(null);

/** Global effect switches (profiling / fast drafts). */
export interface FxFlags {
  boil: boolean;
  grain: boolean;
  grade: boolean;
}
export const FxContext = createContext<FxFlags>({ boil: true, grain: true, grade: true });

export function useEpisode(): EpisodeCtx {
  const ctx = useContext(EpisodeContext);
  if (!ctx) throw new Error("useEpisode() outside <EpisodeContext>");
  return ctx;
}
