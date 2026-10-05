import { continueRender, delayRender, staticFile } from "remotion";

const FONTS: Array<[family: string, file: string]> = [
  ["PatrickHand", "fonts/PatrickHand.woff2"],
  ["Creepster", "fonts/Creepster.woff2"],
  ["SpecialElite", "fonts/SpecialElite.woff2"],
];

if (typeof document !== "undefined") {
  const handle = delayRender("Loading fonts");
  Promise.all(
    FONTS.map(async ([family, file]) => {
      const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`);
      await face.load();
      document.fonts.add(face);
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}
