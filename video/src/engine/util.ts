import { random } from "remotion";

export type Pt = [number, number];

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0..1 progress of t between a and b (clamped). */
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** Deterministic 0..1 random. */
export const rnd = (seed: string | number) => random(String(seed));
export const rndRange = (seed: string | number, a: number, b: number) => a + (b - a) * random(String(seed));

/** Quantise a frame number so motion reads as hand-drawn ("on twos/threes"). */
export const onN = (frame: number, n = 2) => Math.floor(frame / n) * n;

/** Smooth closed/open path through points (Catmull-Rom -> cubic Bezier). */
export function smoothPath(pts: Pt[], closed = true, tension = 1): string {
  const n = pts.length;
  if (n < 2) return "";
  const get = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return closed ? d + " Z" : d;
}

/** Points on a slightly irregular ellipse (hand-drawn feel). */
export function blobPoints(cx: number, cy: number, rx: number, ry: number, n: number, jitter: number, seed: string): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const j = 1 + (rnd(`${seed}-${i}`) - 0.5) * 2 * jitter;
    pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]);
  }
  return pts;
}

export const blob = (cx: number, cy: number, rx: number, ry: number, n: number, jitter: number, seed: string) =>
  smoothPath(blobPoints(cx, cy, rx, ry, n, jitter, seed), true);

/** Scalloped "wool cloud" outline around an ellipse. */
export function cloudPath(cx: number, cy: number, rx: number, ry: number, bumps: number, seed: string, bumpScale = 1): string {
  const pts: Pt[] = [];
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2 + (rnd(`${seed}a${i}`) - 0.5) * (Math.PI / bumps);
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < bumps; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % bumps];
    const mx = (p1[0] + p2[0]) / 2;
    const my = (p1[1] + p2[1]) / 2;
    const nx = mx - cx;
    const ny = my - cy;
    const len = Math.hypot(nx, ny) || 1;
    const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const bulge = segLen * (0.42 + rnd(`${seed}b${i}`) * 0.4) * bumpScale;
    const qx = mx + (nx / len) * bulge;
    const qy = my + (ny / len) * bulge;
    d += ` Q${qx.toFixed(1)},${qy.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + " Z";
}

/** A wobbly hand-drawn line between two points. */
export function scribble(a: Pt, b: Pt, seed: string, wobble = 4, steps = 5): string {
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const edge = i === 0 || i === steps ? 0 : 1;
    pts.push([
      lerp(a[0], b[0], t) + (rnd(`${seed}x${i}`) - 0.5) * wobble * 2 * edge,
      lerp(a[1], b[1], t) + (rnd(`${seed}y${i}`) - 0.5) * wobble * 2 * edge,
    ]);
  }
  return smoothPath(pts, false);
}

/** Polar helper for limbs. Angle in degrees, 0 = pointing down, positive = counter-clockwise toward +x. */
export function limb(origin: Pt, angles: number[], lengths: number[]): Pt[] {
  const pts: Pt[] = [origin];
  let a = 0;
  let [x, y] = origin;
  angles.forEach((ang, i) => {
    a += ang;
    const r = (a * Math.PI) / 180;
    x += Math.sin(r) * lengths[i];
    y += Math.cos(r) * lengths[i];
    pts.push([x, y]);
  });
  return pts;
}
