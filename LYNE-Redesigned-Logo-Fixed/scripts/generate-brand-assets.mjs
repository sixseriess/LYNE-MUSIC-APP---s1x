import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { inflateSync } from "node:zlib";

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

function pngToBmp24(png) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!png.subarray(0, 8).equals(signature)) throw new Error("Invalid PNG data");
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  for (let offset = 8; offset + 12 <= png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
      if (data[12] !== 0) throw new Error("Interlaced installer artwork is unsupported");
    }
    if (type === "IDAT") idat.push(data);
    offset += length + 12;
    if (type === "IEND") break;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!width || !height || bitDepth !== 8 || !channels) throw new Error("Unsupported installer PNG format");
  const rowBytes = width * channels;
  const filtered = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(rowBytes * height);
  let inputOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = filtered[inputOffset++];
    const rowOffset = y * rowBytes;
    for (let x = 0; x < rowBytes; x += 1) {
      const raw = filtered[inputOffset++];
      const left = x >= channels ? pixels[rowOffset + x - channels] : 0;
      const up = y > 0 ? pixels[rowOffset - rowBytes + x] : 0;
      const upperLeft = y > 0 && x >= channels ? pixels[rowOffset - rowBytes + x - channels] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = Math.floor((left + up) / 2);
      else if (filter === 4) {
        const estimate = left + up - upperLeft;
        const pa = Math.abs(estimate - left), pb = Math.abs(estimate - up), pc = Math.abs(estimate - upperLeft);
        predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upperLeft;
      } else if (filter !== 0) throw new Error("Unknown PNG filter");
      pixels[rowOffset + x] = (raw + predictor) & 0xff;
    }
  }
  const stride = Math.ceil((width * 3) / 4) * 4;
  const imageBytes = stride * height;
  const bmp = Buffer.alloc(54 + imageBytes);
  bmp.write("BM", 0, "ascii"); bmp.writeUInt32LE(bmp.length, 2); bmp.writeUInt32LE(54, 10);
  bmp.writeUInt32LE(40, 14); bmp.writeInt32LE(width, 18); bmp.writeInt32LE(height, 22);
  bmp.writeUInt16LE(1, 26); bmp.writeUInt16LE(24, 28); bmp.writeUInt32LE(imageBytes, 34);
  const background = [16, 17, 20];
  for (let y = 0; y < height; y += 1) {
    const sourceY = height - 1 - y;
    for (let x = 0; x < width; x += 1) {
      const source = sourceY * rowBytes + x * channels;
      const alpha = channels === 4 ? pixels[source + 3] / 255 : 1;
      const target = 54 + y * stride + x * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const sourceChannel = channel === 0 ? 2 : channel === 2 ? 0 : 1;
        bmp[target + channel] = Math.round(pixels[source + sourceChannel] * alpha + background[channel] * (1 - alpha));
      }
    }
  }
  return bmp;
}

const installerSidebarSvg = [
  '<svg width="164" height="314" viewBox="0 0 164 314" xmlns="http://www.w3.org/2000/svg">',
  '<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18191d"/><stop offset="1" stop-color="#0c0d10"/></linearGradient><radialGradient id="glow"><stop offset="0" stop-color="#c8f56a" stop-opacity=".12"/><stop offset="1" stop-color="#c8f56a" stop-opacity="0"/></radialGradient></defs>',
  '<rect width="164" height="314" fill="url(#bg)"/><ellipse cx="82" cy="112" rx="92" ry="92" fill="url(#glow)"/>',
  '<path transform="translate(44 82) scale(1.7)" d="M4 0C1.79086 0 0 1.79086 0 4V27.2081C0 30.2751 3.30951 32.201 5.97608 30.6859L13.9629 26.1478C16.6295 24.6327 19.939 26.5586 19.939 29.6256V31C19.939 33.2091 21.7298 35 23.939 35H41C43.2091 35 45 33.2091 45 31V27.5586C45 25.3494 43.2091 23.5586 41 23.5586H35.2783C33.0691 23.5586 31.2783 21.7677 31.2783 19.5586V10.0519C31.2783 6.98497 27.9688 5.05899 25.3022 6.57411L17.3153 11.1121C14.6488 12.6273 11.3393 10.7013 11.3393 7.63433V4C11.3393 1.79086 9.54843 0 7.33929 0H4Z" fill="#fff"/>',
  '<text x="82" y="205" text-anchor="middle" fill="#f4f4f5" font-family="Inter,Arial,sans-serif" font-size="25" font-weight="700" letter-spacing="4">LYNE</text>',
  '<text x="82" y="226" text-anchor="middle" fill="#9b9ca3" font-family="Arial,sans-serif" font-size="8" letter-spacing="2.4">MUSIC PLAYER</text>',
  '<rect x="56" y="260" width="52" height="2" rx="1" fill="#c8f56a"/><text x="82" y="282" text-anchor="middle" fill="#777981" font-family="Arial,sans-serif" font-size="8" letter-spacing="1.2">LISTEN YOUR WAY</text>',
  '</svg>'
].join("\n");

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

await writeFile(
  path.join(root, "build/installer-sidebar.bmp"),
  pngToBmp24(renderPng(installerSidebarSvg, 164)),
);

console.log("Generated LYNE symbol icons and branded Windows installer artwork.");
