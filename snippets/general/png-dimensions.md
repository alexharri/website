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
const chunkHeader = "IHDR";

function isPng(buffer: Buffer) {
  // Bytes 1-8 must contain the PNG signature
  if (buffer.toString("ascii", 0, 8) !== pngSignature) return false;

  // After the signature, PNG files contain N chunks. The first chunk must
  // be the IHDR chunk.
  //
  // Bytes 9 to 12 are the chunk length, which we can safely disregard.
  //
  // Bytes 13-16 contain the first chunk's identifier, which must be IHDR.
  //
  // Source: http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
  if (buffer.toString("ascii", 12, 16) !== chunkHeader) return false;

  return true;
}

export function pngDimensions(buffer: Buffer) {
  if (!isPng(buffer)) throw new Error(`Buffer is not a PNG file`);
  return {
    // The first 8 bytes of the IHDR chunk are the width and height of
    // the image (4 bytes for each).
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}
```