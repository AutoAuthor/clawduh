import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

// Cloud container: use the preinstalled headless Chromium and software GL ("swiftshader" benchmarked ~4x
// faster than "swangle" there — scripts/perf_gl.mjs). On a normal PC leave both at Remotion's defaults
// so your own GPU / Chrome is used.
const LOCAL_HEADLESS_SHELL = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (existsSync(LOCAL_HEADLESS_SHELL)) {
  Config.setBrowserExecutable(LOCAL_HEADLESS_SHELL);
  Config.setChromiumOpenGlRenderer("swiftshader");
}

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(20);
Config.setPixelFormat("yuv420p");
