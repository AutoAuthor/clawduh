// Compare Chromium GL backends for this (GPU-less) machine. Usage: node scripts/perf_gl.mjs
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const HEADLESS = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = existsSync(HEADLESS) ? HEADLESS : null;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
// bundle() copies the project (public/ audio included) to a temp folder and never deletes it; do it on exit
process.on("exit", () => rmSync(serveUrl, { recursive: true, force: true }));
process.on("SIGINT", () => process.exit(130)); // Ctrl-C: exit normally so the cleanup above runs
const inputProps = { captions: true, debug: false };
for (const gl of ["swangle", "swiftshader", "angle", "egl", null]) {
  try {
    const chromiumOptions = gl ? { gl } : {};
    const composition = await selectComposition({ serveUrl, id: "ep001-oats", inputProps, browserExecutable, chromiumOptions });
    const times = [];
    for (const f of [160, 161, 162, 2837, 3023]) {
      const t0 = Date.now();
      await renderStill({ composition, serveUrl, output: `out/perf/gl_${gl}.jpg`, frame: f, inputProps, imageFormat: "jpeg", browserExecutable, chromiumOptions });
      times.push(Date.now() - t0);
    }
    console.log(String(gl).padEnd(12), times.join("ms "), "ms");
  } catch (e) {
    console.log(String(gl).padEnd(12), "FAILED", String(e).slice(0, 120));
  }
}
