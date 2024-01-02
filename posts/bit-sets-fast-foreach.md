---
title: "Iterating over Bit Sets really quickly"
description: ""
publishedAt: ""
image: ""
---

<Note>
  Welcome to part 2 of my 2-part series on bit sets! If you're not very familiar with bit manipulation — or don't know what bit sets are — I recommend reading part 1 first: <a href="/blog/draft/bit-sets" target="_blank">Bit Sets: An introduction to bit manipulation</a>.
</Note>

We're implementing a `BitSet` class, which stores an array of bits. A bit set can be used as a set of integers, or a list of booleans. The bits are stored in a `number[]` called `words`:

```tsx
class BitSet {
  words: number[];
}
```

Since JavaScript only [supports 32-bit integers][js_32_bit_integers], each `word` stores 32 bits. The first words stores bits 1-32, the second word stores bits 33-64, and so on.

[js_32_bit_integers]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#fixed-width_number_conversion

In <a href="/blog/draft/bit-sets" target="_blank">part 1</a> we implemented a few basic methods for our `BitSet` class:

```tsx
class BitSet {
  private words: number[];

  add(index: number): void;
  remove(index: number): void;
  has(index: number): boolean
}
```

In this post we'll tackle `BitSet.forEach`. We'll start off implementing the naive approach where we iterate over the bits (and see how far we can optimize that approach).

We'll then learn about [two's complement][twos_complement] and [Hamming weights][hamming_weight], and how exploiting those lets us iterate over bit sets _really_ quickly.

[twos_complement]: https://en.wikipedia.org/wiki/Two%27s_complement

## Implementing BitSet.forEach

The `BitSet.forEach` method should invoke a callback for every bit that is set to 1, with the index of that bit.

```tsx
class BitSet {
  forEach(callback: (index: number) => void) {
    // ...
  }
}
```

To start off, we'll iterate over every word in `words`:

```tsx
const words = this.words;

for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
  const word = words[wordIndex];
  // ...
}
```

For each word, we'll run through the bits in ascending order:

```tsx
for (let i = 0; i < WORD_LEN; i++) {
  // ...
}
```

<SmallNote label="" moveCloserUpBy={24}>`WORD_LEN` is set to 32: the number of bits in each `word`</SmallNote>

We can check whether the bit is set via `(word & (1 << i)) !== 0`:

```tsx
const bitIsSetToOne = (word & (1 << i)) !== 0;
```

If the bit is non-zero, we'll want to invoke `callback` with the index of the bit:

```tsx
for (let i = 0; i < WORD_LEN; i++) {
  const bitIsSetToOne = (word & (1 << i)) !== 0;
  if (bitIsSetToOne) {
    callback(index)
             // @error {w=5,noHeight=1} Cannot find name 'index'.
  }
}
```

We can compute the bit's `index` in the bit set like so:

```tsx
const index = (wordIndex << WORD_LOG) + i;
```

<SmallNote label="" moveCloserUpBy={24}>`WORD_LOG` is set to 5: the base 2 logarithm of 32</SmallNote>

The expression `wordIndex << WORD_LOG` is equivalent to `wordIndex * WORD_LEN` because left shifting by one is equivalent to multiplying by 2 (and `2 ** WORD_LOG` equals `WORD_LEN`).

```tsx
1 << WORD_LOG
//=> 32

3 << WORD_LOG
//=> 96
```

And so, we have a basic implementation.

```tsx
class BitSet {
  forEach(callback: (index: number) => void) {
    const words = this.words;

    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const word = words[wordIndex];

      for (let i = 0; i < WORD_LEN; i++) {
        const bitIsSetToOne = (word & (1 << i)) !== 0;
        if (bitIsSetToOne) {
          const index = (wordIndex << WORD_LOG) + i;
          callback(index);
        }
      }
    }
  }
}
```

## Optimizing `BitSet.forEach`

We've now got a working implementation for `BitSet.forEach`. Can we optimize it further?

The first thing that pops out to me is that we always iterate over every bit in every word. We can skip words with no set bits with a cheap `word === 0` check.

```tsx
for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
  const word = words[wordIndex];

  if (word === 0) continue; // Skip if all bits are 0

  // ...
}
```

This won't do much for dense sets where most words have some bits set, but this skips a lot of work for sparse sets.

```tsx
// Sparse set
[ 00000000, 01000000, 00000000, 00000000, 0000001 ]

// Dense set
[ 11101101, 01110001, 10110101, 11010001, 0101101 ]
```

But how much performance gains does this optimization really yield? Let's figure it out by running some benchmarks.

We'll run our benchmarks for bit sets with various densities:

```tsx
// From 100% dense (all 1s) to 0.1% dense (mostly 0s)
const densities = [1, 0.75, 0.5, 0.25, 0.1, 0.05, 0.01, 0.001];
```

For each density, we'll create a bit set with 100 million bits.

```tsx
const bitsetsAndDensities = densities.map((density) => ({
  density,
  bitset: makeBitSet(100_000_000, density),
}));
```

The `makeBitSet` method is implemented like so:

```tsx
function makeBitSet(size: number, density: number) {
  const bitset = new BitSet();
  for (let i = 0; i < size; i++) {
    if (Math.random() < density) {
      bitset.add(i);
    }
  }
  return bitset;
}
```

Now that we've created our bit sets, we'll run the `forEach` method for each of them and log out how long it takes.

```tsx
for (const { bitset, density } of bitsetsAndDensities) {
  profile(
    () => bitset.forEach(() => {}),
    (time) => console.log(`${percentage(density)} density: ${time}`),
  );
}
```

For the unoptimized version, we get:

```
100.0% density:     95.2 ms
 75.0% density:    250.7 ms
 50.0% density:    343.3 ms
 25.0% density:    221.8 ms
 10.0% density:    141.6 ms
  1.0% density:     78.5 ms
  0.1% density:     66.7 ms
```

With the `ìf (word === 0) continue;` optimization, we get:

```
100.0% density:     95.4 ms
 75.0% density:    245.5 ms
 50.0% density:    336.3 ms
 25.0% density:    213.9 ms
 10.0% density:    132.4 ms
  1.0% density:     34.6 ms
  0.1% density:      5.6 ms
```

Let's put this into a table and compare the performance:

{<table data-align="right">
  <tbody>
    <tr>
      <th></th>
      <th colSpan="2">Unoptimize (baseline)</th>
      <th colSpan="2">Skip 0s</th>
    </tr>
    <tr data-reduce-padding>
      <th>Density</th>
      <th>Runtime</th>
      <th>Speed <sup>*</sup></th>
      <th>Runtime</th>
      <th>Speed <sup>*</sup></th>
    </tr>
    <tr>
      <td>100.0%</td>
      <td>95.2 ms</td>
      <td>1.0x</td>
      <td>95.4 ms</td>
      <td>1.0x</td>
    </tr>
    <tr>
      <td>75.0%</td>
      <td>250.7 ms</td>
      <td>1.0x</td>
      <td>245.5 ms</td>
      <td>1.0x</td>
    </tr>
    <tr>
      <td>50.0%</td>
      <td>343.3 ms</td>
      <td>1.0x</td>
      <td>336.3 ms</td>
      <td>1.0x</td>
    </tr>
    <tr>
      <td>25.0%</td>
      <td>221.8 ms</td>
      <td>1.0x</td>
      <td>213.9 ms</td>
      <td>1.0x</td>
    </tr>
    <tr>
      <td>10.0%</td>
      <td>141.6 ms</td>
      <td>1.0x</td>
      <td>132.4 ms</td>
      <td>1.0x</td>
    </tr>
    <tr>
      <td>5.0%</td>
      <td>114.5 ms</td>
      <td>1.0x</td>
      <td>95.9 ms</td>
      <td>1.2x</td>
    </tr>
    <tr>
      <td>1.0%</td>
      <td>78.5 ms</td>
      <td>1.0x</td>
      <td>34.6 ms</td>
      <td>2.3x</td>
    </tr>
    <tr>
      <td>0.1%</td>
      <td>66.7 ms</td>
      <td>1.0x</td>
      <td>5.6 ms</td>
      <td>11.9x</td>
    </tr>
  </tbody>
</table>}

<SmallNote label="" moveCloserUpBy={24}>* Speed compared to baseline</SmallNote>

We observe no significant difference in performance for densities above 10%, but once we reach densities of ≤5% we start to see significant performance improvements: __>2x faster__ at 1% density and __>10x faster__ at 0.1% density.


### Skipping halves

We can take this method of optimization further by skipping _each half_ of a word if it's all 0s. We'll create bitmasks for each half of a word:

```tsx
// '0x' is the hexidecimal prefix (base 16).
//
// Each '0' and 'f' denotes four 1s or 0s
export const WORD_FIRST_HALF_MASK = 0x0000ffff;
export const WORD_LATTER_HALF_MASK = 0xffff0000;

console.log(WORD_FIRST_HALF_MASK);
//=> 0b00000000000000001111111111111111

console.log(WORD_LATTER_HALF_MASK);
//=> 0b11111111111111110000000000000000
```

Using them, we want to

 * only iterate over bits 1-16 if there are any set bits in the first half, and
 * only iterate over bits 17-32 if there are any set bits in the latter half.

We can determine whether to iterate over the halves like so:

```tsx
const iterFirstHalf  = (word & WORD_FIRST_HALF_MASK)  !== 0;
const iterLatterHalf = (word & WORD_LATTER_HALF_MASK) !== 0;
```

Which we use to determine the range of bits we iterate over:

```tsx
const start = iterFirstHalf ? 0 : WORD_LEN_HALF;
const end = iterLatterHalf ? WORD_LEN : WORD_LEN_HALF;

for (let i = start; i < end; i++) {
  // Check bit...
}
```

{null && <table data-pad-heading>
  <tbody>
    <tr>
      <th><code>iterFirstHalf</code></th>
      <th><code>iterLatterHalf</code></th>
      <th>Start and end</th>
    </tr>
    <tr>
      <td>True</td>
      <td>True</td>
      <td>0 - 32</td>
    </tr>
    <tr>
      <td>False</td>
      <td>True</td>
      <td>16 - 32</td>
    </tr>
    <tr>
      <td>True</td>
      <td>False</td>
      <td>0 - 16</td>
    </tr>
  </tbody>
</table>}


Let's see the difference this makes:

{<table data-align="right">
  <tbody>
    <tr>
      <th></th>
      <th colSpan="2">Unoptimize (baseline)</th>
      <th colSpan="2">Skip 0s</th>
      <th colSpan="2">Skip 0s and halves</th>
    </tr>
    <tr data-reduce-padding>
      <th>Density</th>
      <th>Runtime</th>
      <th>Speed <sup>*</sup></th>
      <th>Runtime</th>
      <th>Speed <sup>*</sup></th>
      <th>Runtime</th>
      <th>Speed <sup>*</sup></th>
    </tr>
    <tr>
      <td>100.0%</td>
      <td>95.2 ms</td>
      <td>1.0x</td>
      <td>95.4 ms</td>
      <td>1.0x</td>
      <td>99.2 ms</td>
      <td>1.0x</td>
    </tr>
    <tr>
      <td>75.0%</td>
      <td>250.7 ms</td>
      <td>1.0x</td>
      <td>245.5 ms</td>
      <td>1.0x</td>
      <td>246.3 ms</td>
      <td>1.0x</td>
    </tr>
    <tr>
      <td>50.0%</td>
      <td>343.3 ms</td>
      <td>1.0x</td>
      <td>336.3 ms</td>
      <td>1.0x</td>
      <td>346.3 ms</td>
      <td>1.0x</td>
    </tr>
    <tr>
      <td>25.0%</td>
      <td>221.8 ms</td>
      <td>1.0x</td>
      <td>213.9 ms</td>
      <td>1.0x</td>
      <td>215.5 ms</td>
      <td>1.0x</td>
    </tr>
    <tr>
      <td>10.0%</td>
      <td>141.6 ms</td>
      <td>1.0x</td>
      <td>132.4 ms</td>
      <td>1.0x</td>
      <td>133.6 ms</td>
      <td>1.1x</td>
    </tr>
    <tr>
      <td>5.0%</td>
      <td>114.5 ms</td>
      <td>1.0x</td>
      <td>95.9 ms</td>
      <td>1.2x</td>
      <td>93.7 ms</td>
      <td>1.2x</td>
    </tr>
    <tr>
      <td>1.0%</td>
      <td>78.5 ms</td>
      <td>1.0x</td>
      <td>34.6 ms</td>
      <td>2.3x</td>
      <td>28.5 ms</td>
      <td>2.8x</td>
    </tr>
    <tr>
      <td>0.1%</td>
      <td>66.7 ms</td>
      <td>1.0x</td>
      <td>5.6 ms</td>
      <td>11.9x</td>
      <td>5.7 ms</td>
      <td>11.7x</td>
    </tr>
  </tbody>
</table>}

<SmallNote label="" moveCloserUpBy={24}>* Speed compared to baseline</SmallNote>

We receive a tiny performance penalty for high-density sets, but we see a slight performance boost for sets at a sweet spot of roughly 1% density.

This optimization may or may not be worth it depending on your average set density, but it doesn't move the needle all that much.

---

It was at this point in my bit set journey that I discovered a different approach for iterating over bits that yields significantly better results across all set densities.


## Two's complement

Iterating over individual bits is expensive and requires an `if` statment at each iteration to check whether to invoke the callback or not. This `if` statement creates a [branch][branching] which further degrades performance.

[branching]: https://johnnysswlab.com/how-branches-influence-the-performance-of-your-code-and-what-can-you-do-about-it/

If we were able to somehow "jump" to the next set bit, we would eliminate the need to iterate over 0 bits and perform a bunch of `if` statements.

As it turns out, there's a really cheap method to find the least-significant bit set to 1, which looks like so:

```tsx
word & -word
```

When I first saw this, it made no sense to me. I thought:

> _“Doesn't making a number negative just set the sign bit to 1?_
>
> _If so, then `x & -x` just yields `x`.”_

That would be true if signed integers were represented using [sign-magnitude][sign_magnitude], where the leftmost bit is the sign bit and the rest of the bits denote the value (magnitude).

[sign_magnitude]: https://en.wikipedia.org/wiki/Signed_number_representations#Sign%E2%80%93magnitude

{<table data-pad-heading data-align="center">
  <tbody>
    <tr>
      <th colSpan="4">Numbers, represented using sign-magnitude</th>
    </tr>
    <tr>
      <th colSpan="2">Positive</th>
      <th colSpan="2">Negative</th>
    </tr>
    <tr>
      <th>Bits</th>
      <th>Value</th>
      <th>Bits</th>
      <th>Value</th>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>00000000</td>
      <td>0</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>10000000</td>
      <td>-0</td>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>00000001</td>
      <td>1</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>10000001</td>
      <td>-1</td>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>00000010</td>
      <td>2</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>10000010</td>
      <td>-2</td>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>00000011</td>
      <td>3</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>10000011</td>
      <td>-3</td>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>00001001</td>
      <td>9</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>10001001</td>
      <td>-9</td>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>01111111</td>
      <td>127</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>11111111</td>
      <td>−127</td>
    </tr>
  </tbody>
</table>}

But as I learned, signed integers are most commonly represented using [two's complement][twos_complement].

Two's complement is different from sign-magnitude (and [one's complement][ones_complement]) in that it only has one representation for 0 (there's no -0).

{<table data-pad-heading data-align="center">
  <tbody>
    <tr>
      <th colSpan="4">Numbers, represented using two's complement</th>
    </tr>
    <tr>
      <th colSpan="2">Positive</th>
      <th colSpan="2">Negative</th>
    </tr>
    <tr>
      <th>Bits</th>
      <th>Value</th>
      <th>Bits</th>
      <th>Value</th>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>00000000</td>
      <td>0</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}></td>
      <td></td>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>00000001</td>
      <td>1</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>11111111</td>
      <td>-1</td>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>00000010</td>
      <td>2</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>11111110</td>
      <td>-2</td>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>00000011</td>
      <td>3</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>11111101</td>
      <td>-3</td>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>00001001</td>
      <td>9</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>11110111</td>
      <td>-9</td>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}>01111111</td>
      <td>127</td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>10000001</td>
      <td>−127</td>
    </tr>
    <tr>
      <td style={{ fontFamily: "var(--font-monospace)" }}></td>
      <td></td>
      <td style={{ fontFamily: "var(--font-monospace)" }}>10000000</td>
      <td>−128</td>
    </tr>
  </tbody>
</table>}

[ones_complement]: https://en.wikipedia.org/wiki/Signed_number_representations#Ones'_complement

The two's complement of an integer is computed by:

 1. inverting the bits (including the sign bit), and
 2. adding 1 to the number.


```tsx
00010011 // 19

// Invert bits
11101100

// Add 1
11101101 // -19
```

<SmallNote moveCloserUpBy={24}>This also works in the opposite direction (from negative to positive)</SmallNote>

The binary representation of `19` has a 1 as the least-significant bit. Inverting makes the least-significant bit become 0, so adding one will always make the first bit 1. This makes `x & -x` yield the 1st set bit for any number where the least-significant bit is 1.

Let's take a look at a number with some leading 0s:

```tsx
00110000 // 48

// Invert bits
11001111

// Add 1
11010000 // -48
```

Here we observe that all the bits before the least-significant set bit become 1 when inverted. When 1 is added to the number, the 1s are carried until they reach the least-significant 0 (which was the least-significant 1 pre-inversion). This makes `x & -x` yield the 1st set bit for any number with leading 0s.

So when iterating over the bits of a word, we can always find the least-significant set bit via `word & -word`. What's really neat is that we can then use bitwise XOR to unset the bit:

```tsx
while (word !== 0) {
  const lsb = word & -word;

  word ^= lsb; // Unset the least-significant bit

  // With the least-significant bit unset, the next iteration
  // will yield the next least-significant set bit.
}
```

We can now iterate over the set bits of a word, but we've got a small problem. We want to invoke the callback with the _index of_ the set bits, not the set bits themselves.

We'll find the index of the set bit through the use of [Hamming weights][hamming_weight].

[hamming_weight]: https://en.wikipedia.org/wiki/Hamming_weight


### Hamming weight

Given an integer with one set bit, we want to be able to quickly find the index of said bit:

```tsx
indexOfFirstSetBit(0b00000100)
//=> 2

indexOfFirstSetBit(0b00000001)
//=> 0

indexOfFirstSetBit(0b00100000)
//=> 5
```

The brute-force approach would be to walk over the bits one-by-one, but then we're back to iterating over bits. That's a no-go.

One observation to make is that the index of the set bit is equal to the number of leading 0s.

```tsx
// The index of the set bit is 5, and there are 5 leading 0s
0b00100000
```

Consider what happens when we subtract 1. The leading 0s turn into 1s, and the set bit becomes unset.

```tsx
0b00100000 - 1
//=> 0b00011111
```

This transforms the problem from finding the index of the set bit in `x` into computing the number of set bits in `x - 1`. The number of non-zero bits is known as the [Hamming weight][hamming_weight], and it turns out that we can [compute the Hamming weight][compute_hamming_weight] of an integer very cheaply:

[compute_hamming_weight]: https://en.wikipedia.org/wiki/Hamming_weight#Efficient_implementation

```tsx
// Returns the number of non-zero bits in `n`
function hammingWeight(n: number): number {
  n -= (n >> 1) & 0x55555555;
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  return (((n + (n >>> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}
```

<SmallNote label="" moveCloserUpBy={24}>How this works, precisely, is something that we won't get into. We'll just trust that this works.</SmallNote>

We now have all the pieces we need.

### Making BitSet.forEach go fast

As before, we iterate over each word:

```tsx
class BitSet {
  forEach(callback: (index: number) => void) {
    const words = this.words;
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      let word = words[wordIndex];
      // ...
    }
  }
}
```

While `word` is non-zero, we find the least-significant bit `lsb`:

```tsx
while (word !== 0) {
  const lsb = word & -word;
  // ...
}
```

Using `lsb` we can compute the index using the hamming weight of `lsb - 1`:

```tsx
const index = (wordIndex << WORD_LOG) + hammingWeight(lsb - 1);
callback(index);
```

Before the next iteration, we unset the least-significant bit via `word XOR lsb`, making `word` ready for the next iteration:

```tsx
word ^= lsb;
```

The full implementation looks like so:

```tsx
forEach(callback: (index: number) => void) {
  const words = this.words;
  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    let word = words[wordIndex];
    while (word !== 0) {
      const lsb = word & -word;
      const index = (wordIndex << WORD_LOG) + hammingWeight(lsb - 1);
      callback(index);
      word ^= lsb;
    }
  }
}
```

But how fast is this optimized version? Let's run our benchmark and compare.

{<table data-align="right">
  <tbody>
    <tr>
      <th></th>
      <th colSpan="2">Unoptimize (baseline)</th>
      <th colSpan="2">Skip 0s</th>
      <th colSpan="2">Optimized</th>
    </tr>
    <tr data-reduce-padding>
      <th>Density</th>
      <th>Runtime</th>
      <th>Speed <sup>*</sup></th>
      <th>Runtime</th>
      <th>Speed <sup>*</sup></th>
      <th>Runtime</th>
      <th>Speed <sup>*</sup></th>
    </tr>
    <tr>
      <td>100.0%</td>
      <td>95.2 ms</td>
      <td>1.0x</td>
      <td>95.4 ms</td>
      <td>1.0x</td>
      <td>53.4 ms</td>
      <td>1.8x</td>
    </tr>
    <tr>
      <td>75.0%</td>
      <td>250.7 ms</td>
      <td>1.0x</td>
      <td>245.5 ms</td>
      <td>1.0x</td>
      <td>91.9 ms</td>
      <td>2.7x</td>
    </tr>
    <tr>
      <td>50.0%</td>
      <td>343.3 ms</td>
      <td>1.0x</td>
      <td>336.3 ms</td>
      <td>1.0x</td>
      <td>68.4 ms</td>
      <td>5.0x</td>
    </tr>
    <tr>
      <td>25.0%</td>
      <td>221.8 ms</td>
      <td>1.0x</td>
      <td>213.9 ms</td>
      <td>1.0x</td>
      <td>44.4 ms</td>
      <td>5.0x</td>
    </tr>
    <tr>
      <td>10.0%</td>
      <td>141.6 ms</td>
      <td>1.0x</td>
      <td>132.4 ms</td>
      <td>1.0x</td>
      <td>30.1 ms</td>
      <td>4.7x</td>
    </tr>
    <tr>
      <td>5.0%</td>
      <td>114.5 ms</td>
      <td>1.0x</td>
      <td>95.9 ms</td>
      <td>1.2x</td>
      <td>24.8 ms</td>
      <td>4.6x</td>
    </tr>
    <tr>
      <td>1.0%</td>
      <td>78.5 ms</td>
      <td>1.0x</td>
      <td>34.6 ms</td>
      <td>2.3x</td>
      <td>10.0 ms</td>
      <td>7.8x</td>
    </tr>
    <tr>
      <td>0.1%</td>
      <td>66.7 ms</td>
      <td>1.0x</td>
      <td>5.6 ms</td>
      <td>11.9x</td>
      <td>4.0 ms</td>
      <td>16.7x</td>
    </tr>
  </tbody>
</table>}

<SmallNote label="" moveCloserUpBy={24}>* Speed compared to baseline</SmallNote>

For densities of 5-50%, we receive a __~5x increase in performance__. Higher densities of 75% and above receive a notable speedup of >2x, while the densities below 5% see a __5-17x increase in performance__.

## Parting thoughts

Any given piece of code can be heavily optimized, but taking a different approach can often completely outweigh all of those optimizations.

Different algorithms will often favor some inputs over others, like we saw with low vs high-density sets in this post. It's useful to keep these sorts of trade-offs in mind when considering which way to go. Benchmark when possible!

---

Anyway, thanks for reading this short series on bit set! If you haven't read part 1 yet, you can find it here: <a href="/blog/draft/bit-sets" target="_blank">Bit Sets: An introduction to bit manipulation</a>.

I may write a part 3, taking an in-depth look at bit set performance for boolean operations (and, or, xor, andNot, etc), but I've thought about bit sets quite enough for now.

— Alex Harri
