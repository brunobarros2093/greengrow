const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.join(__dirname, '..', 'icone', 'image.png');
const OUT_DIR = __dirname;

async function main() {
  const squareSize = 1024;
  const squareBuffer = await sharp(SRC)
    .resize(squareSize, squareSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(OUT_DIR, 'icon-1024.png'), squareBuffer);

  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];
  for (const size of sizes) {
    const buf = await sharp(squareBuffer).resize(size, size).png().toBuffer();
    pngBuffers.push(buf);
    if (size === 256) fs.writeFileSync(path.join(OUT_DIR, 'icon-256.png'), buf);
  }

  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), icoBuffer);

  // Favicon for the Angular app (browser tab)
  const faviconBuf = await sharp(squareBuffer).resize(32, 32).png().toBuffer();
  const faviconIco = await pngToIco([faviconBuf]);
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), faviconIco);

  console.log('Icons generated successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
