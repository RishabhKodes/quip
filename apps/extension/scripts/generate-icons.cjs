#!/usr/bin/env node

/**
 * Generates minimal PNG icons for the Quip browser extension.
 * Pure JS, no dependencies. Produces valid PNG files using raw buffer manipulation.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const MARK = { r: 0x24, g: 0x83, b: 0x7b }; // Flexoki cyan 600
const SIZES = [16, 48, 128];
const OUTPUT_DIR = path.join(__dirname, "..", "public", "icons");

function crc32(buf) {
  // CRC32 lookup table
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPNGChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuffer, data]);
  const crcValue = crc32(crcInput);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crcValue, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function generatePNG(size) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: width, height, bit depth (8), color type (6 = RGBA), compression, filter, interlace
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method
  const ihdr = createPNGChunk("IHDR", ihdrData);

  // IDAT chunk: raw image data (filter byte + RGBA pixels per row)
  const rowBytes = 1 + size * 4; // 1 filter byte + 4 bytes per pixel
  const rawData = Buffer.alloc(rowBytes * size);
  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const color = getPixelColor(size, x, y);
      rawData[pixelOffset] = color.r;
      rawData[pixelOffset + 1] = color.g;
      rawData[pixelOffset + 2] = color.b;
      rawData[pixelOffset + 3] = color.a;
    }
  }
  const compressedData = zlib.deflateSync(rawData);
  const idat = createPNGChunk("IDAT", compressedData);

  // IEND chunk
  const iend = createPNGChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function getPixelColor(size, x, y) {
  let markSamples = 0;
  const sampleOffsets = [0.2, 0.4, 0.6, 0.8];
  for (const offsetY of sampleOffsets) {
    for (const offsetX of sampleOffsets) {
      const nx = (x + offsetX) / size;
      const ny = (y + offsetY) / size;
      if (isMarkPoint(nx, ny, size)) markSamples += 1;
    }
  }

  const coverage = markSamples / (sampleOffsets.length * sampleOffsets.length);
  return {
    ...MARK,
    a: Math.round(255 * coverage),
  };
}

function isMarkPoint(x, y, size) {
  const lineWidth = Math.max(0.048, 0.8 / size);
  const bowlDistance = Math.abs(Math.hypot(x - 0.44, y - 0.4) - 0.235);
  const stemDistance = distanceToSegment(x, y, 0.675, 0.4, 0.675, 0.76);
  const tailDistance = distanceToSegment(x, y, 0.675, 0.76, 0.765, 0.845);
  return (
    bowlDistance <= lineWidth ||
    stemDistance <= lineWidth ||
    tailDistance <= lineWidth
  );
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const projection = Math.max(
    0,
    Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared),
  );
  return Math.hypot(px - (x1 + projection * dx), py - (y1 + projection * dy));
}

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const size of SIZES) {
  const png = generatePNG(size);
  const filePath = path.join(OUTPUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Created ${filePath} (${png.length} bytes)`);
}

console.log("Done.");
