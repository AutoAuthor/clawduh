// Render review stills (one per shot, or explicit frames) from a single bundle.
// Usage: [COMP=OatsVertical] [OUT=out/stills_v] node scripts/stills.mjs [frame ...]   (no args = middle of every shot)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const HEADLESS = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const compId = process.env.COMP ?? "Oats";
const out = path.resolve(process.env.OUT ?? "out/stills");
mkdirSync(out, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const inputProps = { captions: true, debug: true };
const browserExecutable = existsSync(HEADLESS) ? HEADLESS : null;
const composition = await selectComposition({ serveUrl, id: compId, inputProps, browserExecutable, chromiumOptions: { gl: "swiftshader" } });

let frames = process.argv.slice(2).map(Number);
if (frames.length === 0) {
  // parse shot starts/ends from the shot list source
  const src = readFileSync("src/episodes/oats/shots.tsx", "utf8");
  const re = /start: ([\d.]+), end: ([\d.]+)/g;
  let m;
  while ((m = re.exec(src))) {
    const s = Number(m[1]);
    const e = Math.min(Number(m[2]), composition.durationInFrames / composition.fps);
    frames.push(Math.round(((s + e) / 2) * composition.fps));
  }
}
for (const f of frames) {
  const file = path.join(out, `f${String(f).padStart(5, "0")}.jpg`);
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, output: file, frame: f, inputProps, imageFormat: "jpeg", jpegQuality: 80, browserExecutable, chromiumOptions: { gl: "swiftshader" } });
  console.log(file, `${Date.now() - t0}ms`);
}
