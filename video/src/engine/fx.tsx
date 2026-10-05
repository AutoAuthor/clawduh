import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { clamp, onN, rnd } from "./util";

export type Grade = "night" | "memory" | "hell" | "heaven" | "cave" | "none";

/** CSS colour grade per scene mood. */
export const gradeFilter = (g: Grade): string => {
  switch (g) {
    case "night":
      return "saturate(0.85) contrast(1.08) brightness(0.97)";
    case "memory":
      return "sepia(0.75) saturate(1.5) hue-rotate(-18deg) contrast(1.25) brightness(0.92)";
    case "hell":
      return "saturate(1.35) contrast(1.2) hue-rotate(-8deg)";
    case "heaven":
      return "saturate(1.2) brightness(1.08) contrast(1.05)";
    case "cave":
      return "saturate(0.7) contrast(1.15) brightness(0.9)";
    default:
      return "none";
  }
};

/** Animated film grain + dust from pre-rendered frames (pipeline/make_fx.py). */
export const Grain: React.FC<{ frame: number; opacity?: number }> = ({ frame, opacity = 0.32 }) => {
  const i = Math.floor(rnd(`grain${onN(frame, 2)}`) * 12);
  const dx = Math.floor(rnd(`gx${onN(frame, 2)}`) * 20) * 2 - 20;
  const dy = Math.floor(rnd(`gy${onN(frame, 2)}`) * 20) * 2 - 20;
  // RGBA grain (light/dark specks with alpha) composited with plain alpha blending — far cheaper than overlay.
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, opacity * 0.9), pointerEvents: "none" }}>
      <Img
        src={staticFile(`fx/grain_${String(i).padStart(2, "0")}.png`)}
        style={{ width: 1960, height: 1120, position: "absolute", left: -20 + dx, top: -20 + dy, imageRendering: "pixelated" }}
      />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number; color?: string }> = ({ strength = 0.85, color = "0,0,0" }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 75% 70% at 50% 48%, rgba(${color},0) 45%, rgba(${color},${strength * 0.55}) 78%, rgba(${color},${strength}) 100%)`,
    }}
  />
);

/** Projector flicker: tiny brightness wobble. */
export const Flicker: React.FC<{ frame: number; amount?: number }> = ({ frame, amount = 0.06 }) => {
  const v = (rnd(`flk${onN(frame, 2)}`) - 0.5) * 2 * amount;
  return (
    <AbsoluteFill
      style={{ pointerEvents: "none", background: v > 0 ? `rgba(255,240,210,${v * 0.5})` : `rgba(0,0,0,${-v})` }}
    />
  );
};

export type TransitionIn = "cut" | "flash" | "static" | "fade" | "slam" | "redflash";

/** Overlay played at the start of a shot. */
export const TransitionOverlay: React.FC<{ kind: TransitionIn; local: number; frame: number }> = ({ kind, local, frame }) => {
  if (kind === "cut") return null;
  if (kind === "fade") {
    const o = clamp(1 - local / 0.8);
    return o > 0 ? <AbsoluteFill style={{ background: `rgba(0,0,0,${o})` }} /> : null;
  }
  if (kind === "flash" || kind === "redflash") {
    const o = clamp(1 - local / 0.35);
    const c = kind === "flash" ? "255,250,235" : "200,20,10";
    return o > 0 ? <AbsoluteFill style={{ background: `rgba(${c},${o})` }} /> : null;
  }
  if (kind === "slam") {
    const o = local < 0.08 ? 1 : clamp(1 - (local - 0.08) / 0.15);
    return o > 0 ? <AbsoluteFill style={{ background: `rgba(0,0,0,${o})` }} /> : null;
  }
  // static burst: TV-noise frames for ~0.3s
  if (local > 0.32) return null;
  const i = Math.floor(rnd(`st${frame}`) * 12);
  return (
    <AbsoluteFill style={{ background: "#777", opacity: 1 - local / 0.32 }}>
      <Img
        src={staticFile(`fx/grain_${String(i).padStart(2, "0")}.png`)}
        style={{ width: 1920, height: 1080, filter: "contrast(6) brightness(1.1)", transform: "scale(1.6)" }}
      />
    </AbsoluteFill>
  );
};

export const Letterbox: React.FC<{ size?: number }> = ({ size = 70 }) => (
  <>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: size, background: "#000" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: size, background: "#000" }} />
  </>
);
