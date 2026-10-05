// Measure per-frame render cost with effects toggled. Usage: node scripts/perf.mjs [frame]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const HEADLESS = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const browserExecutable = existsSync(HEADLESS) ? HEADLESS : null;
const frame = Number(process.argv[2] ?? 160);
mkdirSync("out/perf", { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const variants = {
  all: { boil: true, grain: true, grade: true },
  noBoil: { boil: false, grain: true, grade: true },
  noGrain: { boil: true, grain: false, grade: true },
  noGrade: { boil: true, grain: true, grade: false },
  none: { boil: false, grain: false, grade: false },
};
for (const [name, fx] of Object.entries(variants)) {
  const inputProps = { captions: true, debug: false, fx };
  const composition = await selectComposition({ serveUrl, id: "Oats", inputProps, browserExecutable });
  const times = [];
  for (let i = 0; i < 3; i++) {
    const t0 = Date.now();
    await renderStill({ composition, serveUrl, output: `out/perf/${name}.jpg`, frame: frame + i, inputProps, imageFormat: "jpeg", browserExecutable });
    times.push(Date.now() - t0);
  }
  console.log(name.padEnd(8), times.join("ms "), "ms");
}
