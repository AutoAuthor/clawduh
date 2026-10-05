// Render BOTH versions of an episode (16:9 + 9:16) into ../renders/<id>/.
// Cross-platform (Windows/macOS/Linux):   npm run render -- 002-troubled
// Extra flags are passed to Remotion, e.g.: npm run render -- 002-troubled --concurrency=8
// Only one format:                         npm run render -- 002-troubled --only=vertical
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const [id, ...rest] = process.argv.slice(2);
if (!id) {
  console.error("usage: npm run render -- <episode-id>   (e.g. 001-oats)");
  process.exit(1);
}
const only = rest.find((a) => a.startsWith("--only="))?.split("=")[1];
const flags = rest.filter((a) => !a.startsWith("--only="));
const audio = path.join("public", "episodes", id, "audio.wav");
if (!existsSync(audio)) {
  console.error(`Missing ${audio}. Get the source clip and convert it (see ../episodes/${id}/README.md):`);
  console.error(`  npx remotion ffmpeg -i <downloaded-clip> -vn -ar 48000 ${audio}`);
  process.exit(1);
}
const outDir = path.join("..", "renders", id);
mkdirSync(outDir, { recursive: true });
const jobs = [
  ["landscape", `ep${id}`, `${id}_landscape_1920x1080.mp4`],
  ["vertical", `ep${id}-vertical`, `${id}_vertical_1080x1920.mp4`],
].filter(([kind]) => !only || only === kind);
for (const [kind, comp, file] of jobs) {
  const out = path.join(outDir, file);
  console.log(`\n=== ${kind}: ${comp} -> ${out}`);
  const r = spawnSync("npx", ["remotion", "render", "src/index.ts", comp, out, ...flags], { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
