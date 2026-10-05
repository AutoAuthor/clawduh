// Render review stills (one per shot, or explicit frames) from a single bundle.
// Usage: [COMP=OatsVertical] [OUT=out/stills_v] node scripts/stills.mjs [frame ...]   (no args = middle of every shot)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const HEADLESS = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const compId = process.env.COMP ?? "ep001-oats";
const out = path.resolve(process.env.OUT ?? "out/stills");
mkdirSync(out, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const inputProps = { captions: true, debug: true };
const browserExecutable = existsSync(HEADLESS) ? HEADLESS : null;
const composition = await selectComposition({ serveUrl, id: compId, inputProps, browserExecutable, chromiumOptions: { gl: "swiftshader" } });

let frames = process.argv.slice(2).map(Number);
if (frames.length === 0) {
  // middle of every shot (shot list is exposed on the composition's props)
  for (const [s, e] of composition.props.shotTimes ?? []) frames.push(Math.round(((s + e) / 2) * composition.fps));
}
for (const f of frames) {
  const file = path.join(out, `f${String(f).padStart(5, "0")}.jpg`);
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, output: file, frame: f, inputProps, imageFormat: "jpeg", jpegQuality: 80, browserExecutable, chromiumOptions: { gl: "swiftshader" } });
  console.log(file, `${Date.now() - t0}ms`);
}
