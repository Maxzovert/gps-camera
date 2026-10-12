import sharp from "sharp";

const source = "public/logo.jpeg";
const image = sharp(source);
const corner = await sharp(source).extract({ left: 2, top: 2, width: 1, height: 1 }).raw().toBuffer();
const background = { r: corner[0], g: corner[1], b: corner[2], alpha: 1 };

await image.clone().resize(192, 192, { fit: "cover" }).png().toFile("public/icons/icon-192.png");
await image.clone().resize(512, 512, { fit: "cover" }).png().toFile("public/icons/icon-512.png");
await image.clone().resize(180, 180, { fit: "cover" }).png().toFile("public/icons/apple-touch-icon.png");
await image
  .clone()
  .resize(410, 410, { fit: "cover" })
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background })
  .png()
  .toFile("public/icons/icon-maskable-512.png");
await image.clone().resize(32, 32, { fit: "cover" }).png().toFile("app/icon.png");
await image.clone().resize(180, 180, { fit: "cover" }).png().toFile("app/apple-icon.png");

console.log("Icons generated from public/logo.jpeg");
