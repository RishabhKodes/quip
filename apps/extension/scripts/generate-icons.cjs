#!/usr/bin/env node

/**
 * Generates solid-color PNG icon files for the Quip browser extension.
 * Pure JS, no dependencies. Produces valid PNG files using raw buffer manipulation.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ICON_COLOR = { r: 0x7c, g: 0x3a, b: 0xed }; // #7c3aed (purple)
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

  // IHDR chunk: width, height, bit depth (8), color type (2 = RGB), compression, filter, interlace
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0; // compression method
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace method
  const ihdr = createPNGChunk("IHDR", ihdrData);

  // IDAT chunk: raw image data (filter byte + RGB pixels per row)
  const rowBytes = 1 + size * 3; // 1 filter byte + 3 bytes per pixel
  const rawData = Buffer.alloc(rowBytes * size);
  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      rawData[pixelOffset] = ICON_COLOR.r;
      rawData[pixelOffset + 1] = ICON_COLOR.g;
      rawData[pixelOffset + 2] = ICON_COLOR.b;
    }
  }
  const compressedData = zlib.deflateSync(rawData);
  const idat = createPNGChunk("IDAT", compressedData);

  // IEND chunk
  const iend = createPNGChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
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
