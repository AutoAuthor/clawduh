import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import type { Timeline, Word } from "./timeline";
import { rnd } from "./util";

const MAX_WORDS = 5;
const MAX_GAP = 0.6;

interface Phrase {
  words: Word[];
  start: number;
  end: number;
}

/** Split each line into short phrases (TikTok-style captions). */
export function buildPhrases(tl: Timeline): Phrase[] {
  const out: Phrase[] = [];
  for (const line of tl.lines) {
    let cur: Word[] = [];
    const flush = () => {
      if (cur.length) out.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
      cur = [];
    };
    for (const w of line.words) {
      const prev = cur[cur.length - 1];
      if (prev && (w.start - prev.end > MAX_GAP || cur.length >= MAX_WORDS)) flush();
      cur.push(w);
      if (/[.?!]$/.test(w.word) || (/,$/.test(w.word) && cur.length >= 3)) flush();
    }
    flush();
  }
  return out;
}

/** Burned-in captions: each word pops in when spoken, current word highlighted. */
export const Captions: React.FC<{ phrases: Phrase[]; t: number; bottom?: number }> = ({ phrases, t, bottom }) => {
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  const ph = phrases.find((p) => t >= p.start - 0.08 && t <= p.end + 0.35);
  if (!ph) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: bottom ?? (portrait ? Math.round(height * 0.27) : 96), pointerEvents: "none" }}>
      <div
        style={{
          fontFamily: "PatrickHand",
          fontSize: portrait ? 88 : 76,
          lineHeight: 1.05,
          maxWidth: portrait ? 940 : 1500,
          textAlign: "center",
          letterSpacing: 1,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 30px",
        }}
      >
        {ph.words.map((w, i) => {
          const shown = t >= w.start - 0.04;
          const active = t >= w.start - 0.04 && t <= w.end + 0.05;
          const rot = (rnd(`cap${w.start}`) - 0.5) * 6;
          const pop = active ? 1.07 : 1;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: shown ? 1 : 0,
                color: active ? "#e8e27a" : "#f4efe2",
                transform: `rotate(${rot}deg) scale(${pop})`,
                WebkitTextStroke: "10px #0b0706",
                paintOrder: "stroke fill",
                textShadow: "0 6px 0 rgba(0,0,0,0.55)",
              }}
            >
              {w.word.toUpperCase()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
