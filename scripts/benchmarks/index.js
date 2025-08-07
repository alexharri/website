function buildLUT() {
  const lut = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    if (i === 0) {
      lut[i] = 0;
    } else {
      lut[i] = Math.floor(Math.log2(i & -i));
    }
  }
  return lut;
}

const LUT = buildLUT();

function hammingWeight(n) {
  n -= (n >> 1) & 0x55555555;
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  return (((n + (n >>> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}

function iterHammingWeight(word) {
  let sum = 0;
  while (word !== 0) {
    const lsb = word & -word;
    const index = hammingWeight(lsb - 1);

    sum += index;
    word ^= lsb;
  }
  return sum;
}

function iterLUT(word) {
  let sum = 0;
  while (word !== 0) {
    const lsb = word & -word;

    const chunk0 = lsb & 0xff;
    const chunk1 = (lsb >>> 8) & 0xff;
    const chunk2 = (lsb >>> 16) & 0xff;
    const chunk3 = (lsb >>> 24) & 0xff;

    const index =
      (0 + LUT[chunk0]) * (chunk0 !== 0) +
      (8 + LUT[chunk1]) * (chunk1 !== 0) +
      (16 + LUT[chunk2]) * (chunk2 !== 0) +
      (24 + LUT[chunk3]) * (chunk3 !== 0);

    sum += index;
    word ^= lsb;
  }
  return sum;
}

function generateBitsets(count, density) {
  const bitsets = new Uint32Array(count);
  for (let i = 0; i < count; i++) {
    let bits = 0;
    for (let j = 0; j < 32; j++) {
      if (Math.random() < density) {
        bits |= 1 << j;
      }
    }
    bitsets[i] = bits >>> 0;
  }
  return bitsets;
}

function benchmark(name, fn, bitsets, iterations) {
  // Warmup
  for (let i = 0; i < 1000; i++) {
    fn(bitsets[i % bitsets.length]);
  }

  const start = process.hrtime.bigint();
  let checksum = 0;
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < bitsets.length; i++) {
      checksum += fn(bitsets[i]);
    }
  }
  const end = process.hrtime.bigint();

  const totalOps = iterations * bitsets.length;
  const timeMs = Number(end - start) / 1_000_000;
  const opsPerSec = (totalOps / timeMs) * 1000;

  return {
    name,
    timeMs,
    opsPerSec,
    checksum,
  };
}

const warmups = [0.5, 0.1, 0.9]; // Perform a few warmups at different densities

const densities = [...warmups, 0.001, 0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99];
const bitsetCount = 50000;
const iterations = 300;

for (const [i, density] of densities.entries()) {
  const bitsets = generateBitsets(bitsetCount, density);

  const results = [
    benchmark("Hamming weight", iterHammingWeight, bitsets, iterations),
    benchmark("LUT", iterLUT, bitsets, iterations),
  ];

  // Verify that both produced the same result
  const checksums = results.map((r) => r.checksum);
  const allEqual = checksums.every((c) => c === checksums[0]);
  if (!allEqual) {
    throw new Error("Checksums did not match");
  }

  if (i < warmups.length) continue;

  console.log(`Density: ${(density * 100).toFixed(1)}%`);

  const fastest = Math.max(...results.map((r) => r.opsPerSec));
  for (const result of results) {
    const relative = ((result.opsPerSec / fastest) * 100).toFixed(1);
    const name = result.name.padEnd(16);
    const time = result.timeMs.toFixed(2).padStart(8) + " ms";
    const ops = (result.opsPerSec / 1_000_000).toFixed(2).padStart(7) + "M ops/s";
    const percentage = relative.padStart(5) + "%";
    console.log("  " + [name, time, ops, percentage].join(" | "));
  }
  console.log("");
}
