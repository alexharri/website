---
title: "Read the dimensions of a PNG image"
description: "Code snippet for reading the width and height of a PNG image in TypeScript."
showPreview: false
publishedAt: "28-01-2024"
---

The following code can be used to read the width and height of a PNG image (in `Buffer` form) in TypeScript.

```tsx
// The first eight bytes of a PNG file always contain the following (decimal) values:
//
//    137, 80, 78, 71, 13, 10, 26, 10
//
// Source: http://www.libpng.org/pub/png/spec/1.2/PNG-Structure.html
const pngSignature = new Buffer([137, 80, 78, 71, 13, 10, 26, 10]).toString(
  "ascii"
);
const ihdrChunkHeader = "IHDR";

// See https://web.archive.org/web/20190208215723/http://www.jongware.com/pngdefry.html
const cgbiChunkHeader = "CgBI";
const cgbiChunkLen = 16;

const Result = {
  NOT_PNG: 0,
  CONTAINS_CGBI_CHUNK: 1,
  PNG: null,
};

function parsePng(buffer: Buffer) {
  // Bytes 1-8 must contain the PNG signature
  if (buffer.toString("ascii", 0, 8) !== pngSignature) return Result.NOT_PNG;

  // After the signature, PNG files contain N chunks. The first 4 bytes of
  // each chunk contain the chunk length.

  const firstChunkHeader = buffer.toString("ascii", 12, 16);
  if (firstChunkHeader === cgbiChunkHeader) {
    // If Apple's CgBI chunk is present, then the IHDR chunk must be the second
    // chunk.
    const secondChunkHeader = buffer.toString(
      "ascii",
      12 + cgbiChunkLen,
      16 + cgbiChunkLen
    );
    if (secondChunkHeader !== ihdrChunkHeader) return Result.NOT_PNG;

    return Result.CONTAINS_CGBI_CHUNK;
  }

  if (firstChunkHeader !== ihdrChunkHeader) return Result.NOT_PNG;

  return Result.PNG;
}

export function pngDimensions(buffer: Buffer) {
  const result = parsePng(buffer);
  if (result === Result.NOT_PNG) throw new Error("Buffer is not a PNG file");

  // If the CgBI chunk is present, then the IHDR chunk comes 16 bytes later
  const offset = result === Result.CONTAINS_CGBI_CHUNK ? cgbiChunkLen : 0;

  return {
    // The first 8 bytes of the IHDR chunk are the width and height of
    // the image (4 bytes for each).
    width: buffer.readUInt32BE(16 + offset),
    height: buffer.readUInt32BE(20 + offset),
  };
}

```