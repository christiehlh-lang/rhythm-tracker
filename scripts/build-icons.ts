import sharp from "sharp";
import { readFileSync } from "node:fs";

const svg = readFileSync("public/icon.svg");

async function main() {
  await sharp(svg).resize(512, 512).png().toFile("public/icon-512.png");
  await sharp(svg).resize(192, 192).png().toFile("public/icon-192.png");
  // Maskable variant with ~20% safe-area padding (icon at 60% of canvas).
  const inner = await sharp(svg).resize(307, 307).png().toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 250, g: 249, b: 247, alpha: 1 },
    },
  })
    .composite([{ input: inner, gravity: "center" }])
    .png()
    .toFile("public/icon-maskable-512.png");
  console.log("Wrote icon-192.png, icon-512.png, icon-maskable-512.png");
}

main();
