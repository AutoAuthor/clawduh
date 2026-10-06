import React from "react";
import { INK } from "../../characters/parts";
import { Pt, blob, rnd } from "../../engine/util";

/* EPISODE 005 shared props: the DREGS brand, carafes, paper cups. Used by the set and by the cast rigs. */

export const FONT = "Arial Black, Arial, Helvetica, sans-serif";
export const HAND = "PatrickHand, Comic Sans MS, cursive";

/** DREGS brand palette: bruised purple + old mustard. */
export const PURPLE = "#5a3a6e";
export const PURPLE_DK = "#3d2650";
export const PURPLE_LT = "#7a5690";
export const MUSTARD = "#c99a2e";
export const MUSTARD_DK = "#97701c";
export const COFFEE = "#3b2116";
export const DECAF_ORANGE = "#e0731f";

/** Counter-flip helper: text inside a mirrored group renders readable. */
export const Unflip: React.FC<{ flip?: boolean; cx: number; children: React.ReactNode }> = ({ flip, cx, children }) => (
  <g transform={flip ? `translate(${2 * cx} 0) scale(-1 1)` : undefined}>{children}</g>
);

/** The DREGS mascot: a coffee bean with a skull face. Centred at (x, y), `s` = bean height. */
export const SkullBean: React.FC<{ x: number; y: number; s: number; color?: string; ink?: string; rot?: number; grin?: number }> = ({
  x,
  y,
  s,
  color = MUSTARD,
  ink = INK,
  rot = -14,
  grin = 1,
}) => {
  const k = s / 100;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      <ellipse cx={0} cy={0} rx={38} ry={50} fill={color} stroke={ink} strokeWidth={6} />
      {/* the bean crease doubles as the skull's crack */}
      <path d="M2,-46 C-14,-24 14,-10 -2,8 C-12,20 4,34 0,46" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
      <ellipse cx={-16} cy={-10} rx={10} ry={12} fill={ink} />
      <ellipse cx={17} cy={-10} rx={10} ry={12} fill={ink} />
      <path d="M-3,6 L3,6 L0,14 Z" fill={ink} />
      <path d={`M-20,${22 - grin * 4} Q0,${32 + grin * 6} 20,${22 - grin * 4}`} fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
      {[-12, -4, 4, 12].map((tx) => (
        <path key={tx} d={`M${tx},${24 + Math.abs(tx) * -0.1} l0,7`} stroke={ink} strokeWidth={3} />
      ))}
    </g>
  );
};

/** Grip point of a carafe relative to its base centre (where a hand holds the handle). */
export const CARAFE_GRIP: Pt = [-58, -96];

/**
 * Glass coffee carafe. Origin = base centre. Orange handle + collar = decaf (the diner convention),
 * black = regular. `cobweb` for the decaf pot nobody has touched in years.
 */
export const Carafe: React.FC<{
  kind: "decaf" | "regular";
  fill?: number;
  cobweb?: boolean;
  burnt?: boolean;
  t?: number;
  steam?: boolean;
  glow?: number;
}> = ({ kind, fill = 0.6, cobweb = false, burnt = false, t = 0, steam = false, glow = 0 }) => {
  const trim = kind === "decaf" ? DECAF_ORANGE : "#1e1b1d";
  const level = -18 - fill * 92;
  return (
    <g>
      {glow > 0 ? <ellipse cx={0} cy={-60} rx={120} ry={130} fill="#fff6c8" opacity={0.22 * glow} /> : null}
      {/* glass bulb */}
      <defs>
        <clipPath id={`carafe-${kind}-${cobweb ? 1 : 0}`}>
          <path d="M-52,-8 C-66,-40 -60,-86 -30,-112 L30,-112 C60,-86 66,-40 52,-8 Q0,8 -52,-8 Z" />
        </clipPath>
      </defs>
      <path d="M-52,-8 C-66,-40 -60,-86 -30,-112 L30,-112 C60,-86 66,-40 52,-8 Q0,8 -52,-8 Z" fill="#cfdde0" fillOpacity={0.55} stroke={INK} strokeWidth={5} />
      <g clipPath={`url(#carafe-${kind}-${cobweb ? 1 : 0})`}>
        <rect x={-80} y={level} width={160} height={140} fill={burnt ? "#1a0d08" : COFFEE} />
        <path d={`M-70,${level} Q0,${level + 8} 70,${level}`} stroke={burnt ? "#2a1a10" : "#6a3e26"} strokeWidth={5} fill="none" />
        {burnt ? <path d={blob(0, level + 40, 40, 14, 9, 0.4, "crust")} fill="#0a0503" /> : null}
      </g>
      <path d="M-36,-90 C-46,-70 -46,-44 -38,-26" stroke="#ffffff" strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.55} />
      {/* collar + lid */}
      <rect x={-34} y={-130} width={68} height={22} rx={5} fill={trim} stroke={INK} strokeWidth={5} />
      <path d="M-30,-130 L-24,-146 L24,-146 L30,-130 Z" fill="#2a2628" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M30,-136 L48,-142 L44,-128 Z" fill="#2a2628" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      {/* handle */}
      <path d="M-32,-120 C-70,-118 -76,-74 -46,-60" stroke={INK} strokeWidth={22} fill="none" strokeLinecap="round" />
      <path d="M-32,-120 C-70,-118 -76,-74 -46,-60" stroke={trim} strokeWidth={12} fill="none" strokeLinecap="round" />
      {kind === "decaf" ? (
        <g>
          <rect x={-26} y={-78} width={52} height={22} rx={4} fill="#f2ead6" stroke={INK} strokeWidth={3} />
          <text x={0} y={-61} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={14} fill={DECAF_ORANGE}>
            DECAF
          </text>
        </g>
      ) : null}
      {cobweb ? (
        <g stroke="#e8e6e0" strokeWidth={1.6} fill="none" opacity={0.85}>
          <path d="M-24,-146 L-70,-196 M0,-146 L-10,-206 M24,-146 L40,-200 M-24,-146 Q-12,-170 0,-146 Q12,-172 24,-146" />
          <path d="M-52,-176 Q-28,-164 -8,-186 Q14,-170 34,-184 M-40,-160 Q-22,-152 -6,-166 Q12,-156 28,-166" />
          <path d="M-58,-60 L-96,-30 M-58,-60 Q-80,-58 -88,-40" />
          {/* the spider who lives here */}
          <path d="M18,-200 L18,-176" />
          <circle cx={18} cy={-172} r={6} fill="#1a1416" stroke="none" />
          <path d="M12,-174 l-8,-6 M12,-170 l-9,2 M24,-174 l8,-6 M24,-170 l9,2" stroke="#1a1416" strokeWidth={2} />
        </g>
      ) : null}
      {steam
        ? [0, 1].map((i) => {
            const ph = (t * 0.55 + i * 0.5) % 1;
            return <path key={i} d={`M${-10 + i * 20},${-150 - ph * 70} q-10,-14 0,-28 q10,-14 0,-28`} stroke="#ece6da" strokeWidth={6} fill="none" opacity={0.55 * (1 - ph)} strokeLinecap="round" />;
          })
        : null}
    </g>
  );
};

/**
 * Paper cup with a DREGS sleeve. Origin = base centre. `name` is scribbled in marker.
 * `lid`: orange stripe = decaf, red = red eye.
 */
export const PaperCup: React.FC<{
  name?: string;
  lid?: "decaf" | "regular" | "redeye";
  steam?: boolean;
  t?: number;
  flip?: boolean;
  glow?: number;
  scale?: number;
  /** no lid: coffee visible (being poured into); `fill` 0..1 */
  open?: boolean;
  fill?: number;
  /** coffee colour when open (a red eye is darker, redder) */
  brew?: string;
}> = ({ name, lid = "regular", steam = false, t = 0, flip = false, glow = 0, scale = 1, open = false, fill = 0.8, brew = COFFEE }) => (
  <g transform={`scale(${scale})`}>
    {glow > 0 ? <ellipse cx={0} cy={-60} rx={90} ry={100} fill={lid === "redeye" ? "#ff3a2a" : "#fff2c0"} opacity={0.3 * glow} /> : null}
    <path d="M-34,0 L-44,-118 L44,-118 L34,0 Z" fill="#f1ece0" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-38,-34 L-41,-84 L41,-84 L38,-34 Z" fill={PURPLE} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <SkullBean x={0} y={-59} s={30} rot={-10} />
    {open ? (
      <g>
        <ellipse cx={0} cy={-118} rx={44} ry={9} fill="#d8d0bc" stroke={INK} strokeWidth={4} />
        {fill > 0.05 ? <ellipse cx={0} cy={-118 + (1 - fill) * 6} rx={38 * (0.85 + fill * 0.15)} ry={6} fill={brew} /> : null}
      </g>
    ) : (
      <g>
        <rect x={-50} y={-132} width={100} height={16} rx={6} fill={lid === "decaf" ? DECAF_ORANGE : lid === "redeye" ? "#c0281e" : "#2a2628"} stroke={INK} strokeWidth={4} />
        <path d="M-40,-132 L-34,-142 L34,-142 L40,-132 Z" fill={lid === "decaf" ? DECAF_ORANGE : lid === "redeye" ? "#c0281e" : "#2a2628"} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </g>
    )}
    {name ? (
      <Unflip flip={flip} cx={0}>
        <text x={0} y={-12} textAnchor="middle" fontFamily={HAND} fontWeight={700} fontSize={19} fill="#1a1a2a" transform="rotate(-6 0 -12)">
          {name}
        </text>
      </Unflip>
    ) : null}
    {steam
      ? [0, 1].map((i) => {
          const ph = (t * 0.6 + i * 0.5) % 1;
          return <path key={i} d={`M${-10 + i * 20},${-146 - ph * 60} q-9,-12 0,-24 q9,-12 0,-24`} stroke="#ece6da" strokeWidth={5} fill="none" opacity={0.6 * (1 - ph)} strokeLinecap="round" />;
        })
      : null}
  </g>
);

/** A pour stream from (x0,y0) down to (x1,y1), wobbling. */
export const PourStream: React.FC<{ x0: number; y0: number; x1: number; y1: number; t: number; w?: number; color?: string }> = ({ x0, y0, x1, y1, t, w = 12, color = COFFEE }) => {
  const wob = Math.sin(t * 40) * 3;
  const mx = (x0 + x1) / 2 + wob;
  const my = (y0 + y1) / 2;
  return (
    <g>
      <path d={`M${x0},${y0} Q${mx + 18},${my} ${x1},${y1}`} stroke={INK} strokeWidth={w + 6} fill="none" strokeLinecap="round" />
      <path d={`M${x0},${y0} Q${mx + 18},${my} ${x1},${y1}`} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x1 + (rnd(`spl${i}${Math.floor(t * 12)}`) - 0.5) * 40} cy={y1 - rnd(`sply${i}${Math.floor(t * 12)}`) * 20} r={3} fill={color} stroke={INK} strokeWidth={1.5} />
      ))}
    </g>
  );
};
