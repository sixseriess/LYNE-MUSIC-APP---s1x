import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const root = process.cwd();
const readSvg = async (relativePath) =>
  readFile(path.join(root, relativePath), "utf8");
const renderPng = (svg, size) =>
  Buffer.from(
    new Resvg(svg, { fitTo: { mode: "width", value: size } })
      .render()
      .asPng(),
  );

const symbolSvg = await readSvg("build/icon.svg");
const macSvg = await readSvg("build/icon-mac.svg");

const iconSizes = [16, 32, 48, 64, 128, 256, 512];
await mkdir(path.join(root, "build/icons"), { recursive: true });

for (const size of iconSizes) {
  const png = renderPng(symbolSvg, size);
  const iconPath =
    size === 512
      ? "build/icon.png"
      : `build/icons/${size}x${size}.png`;
  await writeFile(path.join(root, iconPath), png);
}
await writeFile(
  path.join(root, "build/icons/512x512.png"),
  renderPng(symbolSvg, 512),
);
await writeFile(
  path.join(root, "public/icon.png"),
  renderPng(symbolSvg, 512),
);
await writeFile(
  path.join(root, "build/icon-mac.png"),
  renderPng(macSvg, 1024),
);

// Windows Vista and newer support PNG-encoded image entries inside ICO files.
const icoSizes = [16, 32, 48, 64, 128, 256];
const icoImages = icoSizes.map((size) => renderPng(symbolSvg, size));
const header = Buffer.alloc(6 + icoSizes.length * 16);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);

let imageOffset = header.length;
for (let index = 0; index < icoSizes.length; index += 1) {
  const size = icoSizes[index];
  const image = icoImages[index];
  const offset = 6 + index * 16;
  header[offset] = size === 256 ? 0 : size;
  header[offset + 1] = size === 256 ? 0 : size;
  header[offset + 2] = 0;
  header[offset + 3] = 0;
  header.writeUInt16LE(1, offset + 4);
  header.writeUInt16LE(32, offset + 6);
  header.writeUInt32LE(image.length, offset + 8);
  header.writeUInt32LE(imageOffset, offset + 12);
  imageOffset += image.length;
}
await writeFile(
  path.join(root, "build/icon.ico"),
  Buffer.concat([header, ...icoImages]),
);

console.log("Generated LYNE symbol icons for Windows, macOS and Linux.");
