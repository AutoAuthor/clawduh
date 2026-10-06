import React, { useMemo } from "react";
import { INK } from "../../../characters/parts";
import { Pt, clamp, cloudPath, rnd, smoothPath } from "../../../engine/util";

/**
 * THE FACE OF GOD — not drawn, subtracted. A face-shaped hole in the heavens where there are no stars at all
 * (a vast and sudden silence), ringed by a faint eclipse corona. Its eyes are two slowly turning spiral galaxies with
 * black-hole pupils; its mouth is a long dark rift edged with nebula, lined with tiny stars for teeth.
 * GalaxyEye is reused for the kaleidoscopes and for the eyeball at the window at the end.
 */

/** Points of a log-spiral galaxy in unit radius, computed once. */
function galaxyPoints(seed: string, arms = 3, per = 28): Array<[number, number, number, number]> {
  const out: Array<[number, number, number, number]> = [];
  for (let a = 0; a < arms; a++) {
    for (let i = 0; i < per; i++) {
      const k = i / per;
      const th = (a / arms) * Math.PI * 2 + k * 4.4;
      const r = 0.12 + k * 0.86;
      const j = (rnd(`${seed}${a}-${i}`) - 0.5) * 0.08;
      out.push([Math.cos(th) * (r + j), Math.sin(th) * (r + j), (1 - k) * 0.05 + 0.012, k]);
    }
  }
  for (let i = 0; i < 26; i++) {
    const th = rnd(`${seed}d${i}`) * Math.PI * 2;
    const r = rnd(`${seed}dr${i}`) * 0.95;
    out.push([Math.cos(th) * r, Math.sin(th) * r, 0.012, 1]);
  }
  return out;
}

export interface GalaxyEyeProps {
  id: string;
  cx: number;
  cy: number;
  /** iris radius */
  r: number;
  t: number;
  /** 0 shut .. 1 open (lid height) */
  open?: number;
  spin?: number;
  /** pupil radius as a fraction of r */
  pupil?: number;
  /** draw a veiny eyeball + lids around the iris (the window eye) */
  ball?: boolean;
  /** iris offset (looking) in units of r */
  look?: Pt;
  lid?: string;
}

export const GalaxyEye: React.FC<GalaxyEyeProps> = ({ id, cx, cy, r, t, open = 1, spin = 1, pupil = 0.2, ball = false, look = [0, 0], lid = "#120d22" }) => {
  const pts = useMemo(() => galaxyPoints(id), [id]);
  const veins = useMemo(
    () =>
      Array.from({ length: 9 }).map((_, i) => {
        const a = (i / 9) * Math.PI * 2 + rnd(`${id}va${i}`) * 0.5;
        const p: Pt[] = [];
        for (let k = 0; k <= 4; k++) {
          const rr = 2.15 - k * 0.22;
          p.push([Math.cos(a + (rnd(`${id}v${i}${k}`) - 0.5) * 0.3) * rr, Math.sin(a + (rnd(`${id}w${i}${k}`) - 0.5) * 0.3) * rr * 0.62]);
        }
        return smoothPath(p, false);
      }),
    [id],
  );
  const o = clamp(open);
  const ix = cx + look[0] * r;
  const iy = cy + look[1] * r;
  const W = ball ? r * 2.3 : r * 1.25;
  const Hh = (ball ? r * 1.35 : r * 1.05) * o;
  const almond = `M${cx - W},${cy} Q${cx},${cy - Hh * 2} ${cx + W},${cy} Q${cx},${cy + Hh * 2} ${cx - W},${cy} Z`;
  const rotDeg = t * 14 * spin;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-iris`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff4d0" />
          <stop offset="0.18" stopColor="#ffd38a" />
          <stop offset="0.42" stopColor="#3fc7c9" />
          <stop offset="0.75" stopColor="#5a2aa0" />
          <stop offset="1" stopColor="#140a2a" />
        </radialGradient>
        <clipPath id={`${id}-lid`}>
          <path d={almond} />
        </clipPath>
      </defs>
      {o > 0.02 ? (
        <>
          {ball ? <path d={almond} fill="#e9e0c8" /> : null}
          <g clipPath={`url(#${id}-lid)`}>
            {ball ? (
              <g transform={`translate(${cx} ${cy}) scale(${r})`}>
                <ellipse cx={0} cy={0.9} rx={2.6} ry={1.1} fill="#000" opacity={0.18} />
                {veins.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="#b3262a" strokeWidth={0.03} opacity={0.85} />
                ))}
              </g>
            ) : null}
            <circle cx={ix} cy={iy} r={r} fill={`url(#${id}-iris)`} />
            <g transform={`translate(${ix} ${iy}) rotate(${rotDeg}) scale(${r})`}>
              {pts.map(([px, py, pr, k], i) => (
                <circle key={i} cx={px} cy={py * 0.92} r={pr} fill={k > 0.6 ? "#cfe8ff" : i % 3 ? "#fff3d6" : "#ffc2ee"} opacity={0.95 - k * 0.4} />
              ))}
            </g>
            {/* black hole pupil + accretion ring */}
            <circle cx={ix} cy={iy} r={r * pupil * 1.5} fill="#ffe9b0" opacity={0.35} />
            <circle cx={ix} cy={iy} r={r * pupil} fill="#000" />
            <ellipse cx={ix} cy={iy} rx={r * pupil * 1.25} ry={r * pupil * 0.32} fill="none" stroke="#ffe3a0" strokeWidth={Math.max(1.5, r * 0.025)} opacity={0.9} />
            <circle cx={ix - r * 0.35} cy={iy - r * 0.38} r={r * 0.09} fill="#fff" opacity={0.8} />
          </g>
          <path d={almond} fill="none" stroke={ball ? INK : "#bcb2ff"} strokeWidth={ball ? Math.max(4, r * 0.05) : Math.max(2, r * 0.025)} opacity={ball ? 1 : 0.55} />
          {ball ? <path d={`M${cx - W},${cy} Q${cx},${cy - Hh * 2} ${cx + W},${cy}`} fill="none" stroke={lid} strokeWidth={r * 0.18} opacity={0.6} /> : null}
        </>
      ) : (
        <path d={`M${cx - W},${cy} Q${cx},${cy + r * 0.12} ${cx + W},${cy}`} fill="none" stroke={ball ? INK : "#bcb2ff"} strokeWidth={Math.max(3, r * 0.04)} opacity={0.7} />
      )}
    </g>
  );
};

const FACE_PTS: Pt[] = [
  [0, -660],
  [250, -610],
  [420, -440],
  [480, -170],
  [470, 60],
  [400, 300],
  [260, 520],
  [0, 650],
  [-260, 520],
  [-400, 300],
  [-470, 60],
  [-480, -170],
  [-420, -440],
  [-250, -610],
];

export interface FaceOfGodProps {
  id: string;
  x: number;
  y: number;
  /** 1 = about 960 x 1310 world px */
  s: number;
  t: number;
  /** eyes 0..1 */
  open?: number;
  /** mouth 0..1 */
  mouth?: number;
  /** 0..1 fade/scale in */
  presence?: number;
  look?: Pt;
}

export const FaceOfGod: React.FC<FaceOfGodProps> = ({ id, x, y, s, t, open = 1, mouth = 0, presence = 1, look = [0, 0.1] }) => {
  const geo = useMemo(() => {
    // a ragged silhouette: the face outline wobbles, the way crowding stars would draw it
    const ragged: Pt[] = [];
    const base = FACE_PTS;
    for (let i = 0; i < base.length; i++) {
      const a = base[i];
      const b = base[(i + 1) % base.length];
      for (let k = 0; k < 4; k++) {
        const f = k / 4;
        const j = (rnd(`${id}rg${i}-${k}`) - 0.5) * 34;
        const px = a[0] + (b[0] - a[0]) * f;
        const py = a[1] + (b[1] - a[1]) * f;
        const l = Math.hypot(px, py) || 1;
        ragged.push([px + (px / l) * j, py + (py / l) * j]);
      }
    }
    // the corona: stars crowding the edge of the silence
    const corona = Array.from({ length: 170 }).map((_, i) => {
      const p = ragged[Math.floor(rnd(`${id}cs${i}`) * ragged.length)];
      const l = Math.hypot(p[0], p[1]) || 1;
      const out = 14 + Math.pow(rnd(`${id}co${i}`), 2) * 120;
      return [p[0] + (p[0] / l) * out + (rnd(`${id}cx${i}`) - 0.5) * 30, p[1] + (p[1] / l) * out + (rnd(`${id}cy${i}`) - 0.5) * 30, 1.5 + Math.pow(rnd(`${id}cr${i}`), 3) * 6, rnd(`${id}cc${i}`)] as const;
    });
    // the rift's lips: uneven
    const lipU: Pt[] = [];
    const lipL: Pt[] = [];
    for (let i = 0; i <= 12; i++) {
      const f = i / 12;
      const x0 = -300 + f * 600;
      const env = Math.sin(f * Math.PI);
      lipU.push([x0, (rnd(`${id}lu${i}`) - 0.5) * 10 * env]);
      lipL.push([x0, (rnd(`${id}ll${i}`) - 0.5) * 10 * env]);
    }
    return {
      face: smoothPath(ragged, true, 0.8),
      corona,
      lipU,
      lipL,
      brows: [cloudPath(-230, -300, 190, 50, 9, `${id}b1`, 0.6), cloudPath(230, -300, 190, 50, 9, `${id}b2`, 0.6)],
      teeth: Array.from({ length: 22 }).map((_, i) => [-250 + (i / 21) * 500, rnd(`${id}tt${i}`)] as const),
    };
  }, [id]);
  const p = clamp(presence);
  if (p <= 0) return null;
  const mo = clamp(mouth);
  const mh = 16 + mo * 160;
  const env = (x0: number) => 1 - Math.pow(x0 / 300, 2);
  const upper = geo.lipU.map(([lx, ly]): Pt => [lx, 330 + ly - mh * 0.55 * env(lx)]);
  const lower = geo.lipL.map(([lx, ly]): Pt => [lx, 330 + ly + mh * env(lx)]).reverse();
  const mouthD = smoothPath([...upper, ...lower], true, 0.7);
  return (
    <g transform={`translate(${x} ${y}) scale(${s * (0.85 + p * 0.15)})`} opacity={p}>
      {/* the corona of crowding stars */}
      {geo.corona.map(([cx, cy, r, c], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={c > 0.7 ? "#ffd6f2" : c > 0.4 ? "#cfe8ff" : "#fff6dc"} opacity={0.5 + c * 0.5} />
      ))}
      <path d={geo.face} fill="none" stroke="#6f4ad8" strokeWidth={60} opacity={0.14} />
      <path d={geo.face} fill="none" stroke="#000" strokeWidth={26} opacity={0.6} />
      <path d={geo.face} fill="#000" />
      <path d={geo.face} fill="none" stroke="#cfc6ff" strokeWidth={3} opacity={0.35} />
      {/* only the faintest brow ridges in the dark */}
      <g fill="none" stroke="#1c1733" strokeLinecap="round">
        <path d="M-380,-235 Q-230,-320 -80,-245" strokeWidth={20} />
        <path d="M380,-235 Q230,-320 80,-245" strokeWidth={20} />
      </g>
      {geo.brows.map((d, i) => (
        <path key={i} d={d} fill={i ? "#3a7aa8" : "#7a3a9a"} opacity={0.2} />
      ))}
      <GalaxyEye id={`${id}-eL`} cx={-230} cy={-110} r={118} t={t} open={open} spin={1} look={look} pupil={0.17} />
      <GalaxyEye id={`${id}-eR`} cx={230} cy={-110} r={118} t={t + 3} open={open} spin={-1} look={look} pupil={0.17} />
      {/* the rift */}
      <path d={mouthD} fill="none" stroke="#9a2a6a" strokeWidth={26} opacity={0.3} />
      <path d={mouthD} fill="#030004" stroke="#c45aa0" strokeWidth={3} opacity={0.75} />
      {mo > 0.12
        ? geo.teeth.map(([tx, r], i) => {
            const k = env(tx);
            return (
              <g key={i}>
                <circle cx={tx} cy={330 - mh * 0.5 * k + 7} r={2 + r * 3} fill="#fffbe8" opacity={0.9} />
                <circle cx={tx + 8} cy={330 + mh * 0.92 * k - 7} r={2 + r * 2.5} fill="#fffbe8" opacity={0.85} />
              </g>
            );
          })
        : null}
    </g>
  );
};
