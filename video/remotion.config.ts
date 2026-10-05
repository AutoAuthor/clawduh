import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

// Use the preinstalled headless Chromium when present (cloud containers), otherwise let Remotion manage its own.
const LOCAL_HEADLESS_SHELL = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (existsSync(LOCAL_HEADLESS_SHELL)) {
  Config.setBrowserExecutable(LOCAL_HEADLESS_SHELL);
}

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(22);
Config.setPixelFormat("yuv420p");
// "swiftshader" benchmarked ~4x faster than "swangle" on GPU-less machines (scripts/perf_gl.mjs).
Config.setChromiumOpenGlRenderer("swiftshader");
