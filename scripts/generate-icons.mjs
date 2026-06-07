import { mkdirSync, writeFileSync } from 'fs';
import { deflateSync } from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');
mkdirSync(iconsDir, { recursive: true });

// Marka rengi: #40aead (Yargıtay karararama ana rengi)
const [R, G, B] = [0x40, 0xae, 0xad];
// Kenar (koyu teal): #28706f
const [ER, EG, EB] = [0x28, 0x70, 0x6f];

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function makePNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // RGB

  // Teal zemin üzerine beyaz "Y" (marka harfi). Segmentlere uzaklıkla çizilir.
  const seg = [
    [0.28, 0.24, 0.5, 0.54], // sol kol
    [0.72, 0.24, 0.5, 0.54], // sağ kol
    [0.5, 0.54, 0.5, 0.8],   // gövde
  ];
  const halfW = 0.09;

  const distToSeg = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };

  // Scanlines: filter byte (0) + RGB per pixel
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 3);
    raw[row] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const px = row + 1 + x * 3;
      const u = x / (size - 1);
      const v = y / (size - 1);
      const onY = seg.some(([ax, ay, bx, by]) => distToSeg(u, v, ax, ay, bx, by) < halfW);
      const edge = x === 0 || x === size - 1 || y === 0 || y === size - 1;
      if (onY) {
        raw[px] = 255; raw[px + 1] = 255; raw[px + 2] = 255; // beyaz Y
      } else {
        raw[px]     = edge ? ER : R;
        raw[px + 1] = edge ? EG : G;
        raw[px + 2] = edge ? EB : B;
      }
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 48, 128]) {
  writeFileSync(join(iconsDir, `icon${size}.png`), makePNG(size));
  console.log(`✓ icon${size}.png`);
}
