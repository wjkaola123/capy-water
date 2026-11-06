import { readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";
const svg = await readFile(
  new URL("../assets/icon.svg", import.meta.url),
  "utf8",
);
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1024 } })
  .render()
  .asPng();
await writeFile(new URL("../assets/icon.png", import.meta.url), png);
console.log("Generated assets/icon.png from the editable SVG source.");
