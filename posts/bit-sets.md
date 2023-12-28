---
title: "Implementing a fast Bit Set: An introduction to bit manipulation"
description: ""
publishedAt: ""
image: ""
---

{/**
I first learned about [bit sets](https://en.wikipedia.org/wiki/Bit_array) about two months ago when starting my new job at Arkio.
*/}

[Bit sets][bitset] are a very compact data structure for representing large sets of booleans (bits). They allow for highly performant set operations like [unions][union] and [intersections][intersection], and fast constant-time lookups.

[bitset]: https://en.wikipedia.org/wiki/Bit_array
[union]: https://en.wikipedia.org/wiki/Union_(set_theory)
[intersection]: https://en.wikipedia.org/wiki/Intersection_(set_theory)

In this post, we'll walk through implementing a BitSet from scratch as a vehicle for learning about bitwise operators and bit manipulation.

Along the way, we'll learn how we can iterate over bit sets extremely fast by exploiting [Two's Complement][twos_complement].

[twos_complement]: https://en.wikipedia.org/wiki/Two%27s_complement


## Bit masks

You may have used a number as a set of booleans before under the name _bit mask_, _bit flags_, or _bit field_.

```ts
// This binary number...
00001001

// ...is equivalent to this array of booleans
[ false, false, false, false, true, false, false, true ]
```

Each bit in the bit mask corresponds to a single boolean — 1 is true, and 0 is false. Using bit masks allows us compactly represent multiple booleans in a single number.

In the following example, we'll represent a users permissions using a bit mask. Bits in the bit mask correspond to a specific permission (e.g. `READ` or `WRITE`). If the corresponding bit is set to 1, the user has the permission, otherwise they don't.

```tsx
// The '0b' prefix allows you to write binary numbers
const READ   = 0b0001;
const UPDATE = 0b0010;
const CREATE = 0b0100;
const DELETE = 0b1000;

function canRead(permissions: number) {
  return (permissions & READ) !== 0;
}
function canUpdate(permissions: number) {
  return (permissions & UPDATE) !== 0;
}
// ...
```

`&` is the bitwise AND operator. It returns a new number where the bits are set to 1 if both of the input bits are 1.

```tsx
Input         0101     0101     0101
Bit mask    & 0001   & 0010   & 0100
------------------------------------
Output        0001     0000     0100
```

If the input integer has no bits in common with the bit mask, the `&` operation will return 0.

```tsx
const BIT_MASK = 0b0010;

function secondBitIsSetToOne(input: number) {
  return (input & BIT_MASK) !== 0;
}
```

`|` is another bitwise operator, representing OR. It returns a new number where the bits are set to one if either of the input bits is 0.

```tsx
         0101     0101     0101
       | 0001   | 0010   | 0100
-------------------------------
Output   0101     0111     0101
```

We can use it to, for example, set specific bits to one.

```tsx
const READ   = 0b0001;
const UPDATE = 0b0010;
const CREATE = 0b0100;
const DELETE = 0b1000;

function addReadPermission(permissions: number) {
  return permissions | READ;
}
function addUpdatePermission(permissions: number) {
  return permissions | UPDATE;
}
// ...
```

We also need to set bits to 0, which we can accomplish through the use of the bitwise NOT operator `~`, a [unary operator][unary_operator] that flips all of the bits in the number:

<SmallNote label="">Unary means that it takes a single argument, as opposed to two.</SmallNote>

[unary_operator]: https://www.digitalocean.com/community/tutorials/javascript-unary-operators-simple-and-useful

```tsx
          ~0101   ~1000   ~0001
-------------------------------
Output     1010    0111    1110
```

We can use NOT to create a _reverse bit mask_ that passes through all but one bit:

```tsx
const READ   = 0b0001;
const UPDATE = 0b0010;
const CREATE = 0b0100;
const DELETE = 0b1000;

console.log(~READ)
//=> 0b1110

console.log(~UPDATE)
//=> 0b1101
```

We can use this in conjunction with AND to set specific bits to zero:

```tsx
function removeReadPermission(permissions: number) {
  return permissions & ~READ;
}
function removeUpdatePermission(permissions: number) {
  return permissions & ~UPDATE;
}
```

We can also create groups of permissions like so:

```tsx
const OWNER = READ | UPDATE | CREATE | DELETE; // 0b1111
const EDITOR = READ | UPDATE | CREATE; // 0b1011
const VIEWER = READ; // 0b0001
```

And use them to see if a user has a set of permissions, or provide a user with a set of permissions:

```tsx
function isEditor(permissions: number) {
  return (permissions & EDITOR) === EDITOR;
}
function addEditorPermissions(permissions: number) {
  return permissions | EDITOR;
}
```

We can also see which permissions users have in common:

```tsx
function commonPermissions(a: number, b: number) {
  return a & b;
}
```

There are infinite ways to slice and dice bit masks.


### Limits of bit masks

Bit masks are great, but their capacity is limited. JavaScript only [supports 32 bit integers][js_32_bit_integers], so a bit mask can only store 32 bits.

[js_32_bit_integers]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#fixed-width_number_conversion

This is where bit sets come in. Once you need to be able to store more than 32 booleans (or 64, depending on the language), you can use an array of integers to make the possible number of bits _arbitrarily_ large.

```ts
[ 0b00010011, 0b01100000, ... ]
```


## Bit sets

Before getting into the implementation, I want to briefly discuss the main benefits of bit sets, of which there are two:

 1. They're really compact, in terms of memory.
 2. Set operations are _fast_.

The compactness argument is relatively simple. A boolean takes up [one byte of space](https://stackoverflow.com/a/2064565) (8 bits), which means that you can store 8 times as many booleans if you use integers to represent them instead.

But more importantly, set operations (like union, intersection, subtraction) are stupid fast. We'll prove this with benchmarks later in the article, but for now let's implement our own bit set.

### Bit set interface

A bit set stores booleans addressable via an index. Each index corresponds to bit that is either set to `true` or `false`.

Having said that, any set class needs to support some basic operations:

 * `add` - to add an element
 * `remove` - to remove an element
 * `has` - to check for the presence of an element
 * `forEach` - to iterate over the elements in the set

So the interface for our `BitSet` class will start off like so:

```tsx
interface BitSet {
  add(index: number): void;
  remove(index: number): void;
  has(index: number): boolean;
  forEach(callback: (index: number) => void): void;
}
```

<SmallNote>We'll also implement more complex operations (like `union`, `intersection`, `subtract`) later on.</SmallNote>


## Implementing a BitSet

The integers that comprise a bit set are called [words][words], so we'll store a `words` array in our `BitSet` implementation.

[words]: https://en.wikipedia.org/wiki/Word_(computer_architecture)

```tsx
class BitSet {
  private words: number[];
}
```

Most of the methods on our `BitSet` will be setting or reading the value of a specific bit in the `words` array.

```tsx
class BitSet {
  add(index: number) {
    // Set some bit to '1'
  }
  remove(index: number) {
    // Set some bit to '0'
  }
  has(index: number) {
    // Return true if some bit is set to '1'
  }
}
```

Bit will be stored in some individual `word` in `words`. Consider how the `words` array is structured:

```ts
[ 00000000, 00000000, 00000000, 00000000 ]

// The `0b` prefix is omitted for clarity, and we're using
// 8 bits instead of 32 for readability
```

We can map each bit to an absolute index:

```ts
[  00000000, 00000000, 00000000, 00000000  ]
// 76543210     ...98
```

<SmallNote label="" moveCloserUpBy={24}>Each word is indexed right-to-left, following [bit ordering][bit_ordering] from least-significant to most-significant</SmallNote>

[bit_ordering]: https://en.wikipedia.org/wiki/Bit_numbering

But to find a single bit in a specific `word`, we need to convert the input index into two indices:

 1. The index of the `word` in `words`.
 2. The index of the bit in `word` to set to 1.

```ts
//   word 0    word 1    word 2    word 3
[  00000000, 00000000, 00000000, 00000000  ]
// 76543210  76543210  76543210  76543210
```

### Parsing an input index

JavaScript only supports [32 bit integers][js_32_bit_integers], so we'll define a `WORD_LEN` constant with the value 32.

[js_32_bit_integers]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#fixed-width_number_conversion

```tsx
const WORD_LEN = 32;
```

Because `WORD_LEN` is a power of two, the bit index within the `word` will be the `log2(WORD_LEN)` least significant bits of `index`, which yields a value of 5.

```tsx
Math.log2(WORD_LEN);
//=> 5

0b00000
//=> 0 (1st bit)

0b11111
//=> 31 (32nd bit)
```

The rest of the bits in `index` (leftmost) specify the word index.

```ts
00000000000 // word index
~~~~~~~~~~~
00000000000 00000 // input index
            ~~~~~
            00000 // bit index
```

Let's see some examples. When all of the bits in the bit index region are set to 1, we get a word index of 0 and bit index of 31, corresponding to the 32nd bit.

```ts
00000000000 = 0 // word index
~~~~~~~~~~~
00000000000 11111 = 31 // input index
            ~~~~~
            11111 = 31 // bit index

// 32nd bit
```

If we increment the input index by 1, we get a word index of 1 and a bit index of 0, corresponding to the 33rd bit.

```ts
00000000001 = 1 // word index
~~~~~~~~~~~
00000000001 00000 = 32 // input index
            ~~~~~
            00000 = 0 // bit index

// 33rd bit
```

This works for any input index. The input index `100` corresponds to `0b1100100` in binary. Broken down, we get a word index of 3 and bit index of 4, corresponding to the 101st bit.

```tsx
00000000011 = 3 // word index
~~~~~~~~~~~
00000000011 00100 = 100 // input index
            ~~~~~
            00100 = 4 // bit index

// 101st bit
```

We can verify this by computing `(3 * 32) + 4`:

```tsx
const wordIndex = 3;
const bitIndex = 4;

console.log((wordIndex * 32) + bitIndex);
//=> 100
```

So to compute the word index, we need to shift the bits in the input index right by 5 (i.e. `log2(WORD_LEN)`) so that the word index bits become the rightmost (least-significant) bits.

We can do this with the `>>` operator.

```tsx
const wordIndex = index >> 5;
```

`>>` is the bitwise right shift operator. It returns the input number with its bits shifted right by N places:

```tsx
const input = 0b01100100

input >> 5;
//=> 0b00000011
```

This can be illustrated like so:

```tsx
// The following expression
0b01100100 >> 5

// Corresponds to the following
01100100
011>>>>>
>>>>>011
00000011
```

As we learned earlier, the number 5 corresponds to the base 2 logarithm of 32.

```tsx
Math.log2(32)
//=> 5
```

Let's put it in a `WORD_LOG` constant for readability.

```tsx
const WORD_LEN = 32;
const WORD_LOG = Math.log2(WORD_LEN);
```

Computing the bit index is quite simple: we take the 5 least-significant bits from `index` using bitwise AND:

```tsx
const bitIndex = index & 0b11111;
```

This sets any bits left of the 5 least-significant bits to zero.

And with that, we know how to parse an input index into its a word and bit indices:

```tsx
const wordIndex = index >> WORD_LOG;
const bitIndex = index & 0b11111;
```

Let's get to implementing some of the methods of `BitSet`!

### BitSet.add

The `add` method should set the bit at the input `index` to 1, "adding" that index to the set.

To set the bit at index `N` to 1, we can create a bit mask with the `N`th bit set to 1 and apply bitwise `OR`:

```tsx
input |= bitMask;
```

We can create such a bitmask by left-shifting the number 1 by `N` places:

```tsx
1 << 2;
//=> 0b00000100

1 << 0;
//=> 0b00000001

1 << 6;
//=> 0b01000000
```

Allowing us to set the bit at a specific index to 1 like so:

```tsx
function setBitToOne(input: number, bitIndex: number) {
  return input | (1 << bitIndex);
}
```

With that, we have all the pieces that we need to implement `BitSet.add`:

```tsx
class BitSet {
  add(index: number) {
    const wordIndex = index >> WORD_LOG;
    const bitIndex = index & 0b11111;

    this.words[wordIndex] |= (1 << bitIndex);
  }
}
```

However, there is one simplification we can make. Because the bitwise shift operators `<<` and `>>` operate on 32 bit integers, the maximum shift possible is 31 (from 32nd to 1st bit, or 1st to 32nd bit).

The [ECMAScript standard states](https://262.ecma-international.org/14.0/#sec-numeric-types-number-leftShift):

> Let shiftCount be ℝ(rnum) modulo 32.

In other words, only read the 5 least-significant bits which represent 0 to 31; all other bits are dismissed. This means that we don't need to compute `bitIndex` and can left shift on `index` directly.

```tsx
class BitSet {
  add(index: number) {
    const wordIndex = index >> WORD_LOG;
    this.words[wordIndex] |= (1 << index);
  }
}
```


### BitSet.remove

In implementing `BitSet.remove`, we want to set a specific bit to zero. We've already seen how this was done in a previous example:

```tsx
const READ = 0b0001;

function removeReadPermission(permissions: number) {
  return permissions & ~READ;
}
```

As we did in `BitSet.add`, we'll use `1 << index` to create a bit mask for a specific bit that looks like so:

```tsx
1 << 4
//=> 0b00010000
```

We then reverse the bit mask using bitwise NOT:

```tsx
~(1 << 4)
//=> 0b11101111
```

And then apply this reverse bit mask via bitwise AND:

```tsx
const word = 0b01111100;

word & ~(1 << 4)
//=> 0b01101100
```

With that, our implementation of `BitSet.remove` looks like so:

```tsx
class BitSet {
  remove(index: number) {
    const wordIndex = index >> WORD_LOG;
    this.words[wordIndex] &= ~(1 << index);
  }
}
```


### BitSet.has

The `BitSet.has` method should return true if a specific bit is set to 1, and false otherwise.

We saw how this is done earlier in this post:

```tsx
const READ = 0b0001;

function canRead(permissions: number) {
  return (permissions & READ) !== 0;
}
```

We create a bit mask using left shift and apply it using bitwise AND. 

```tsx
0b11000100 & (1 << 4)
//=> 0b00000000

0b11011100 & (1 << 4)
//=> 0b00010000
```

If the result is non-zero, the bit is set to 1.

With that, we can implement `BitSet.has`.

```tsx
class BitSet {
  has(index: number) {
    const wordIndex = index >> WORD_LOG;
    return (this.words[wordIndex] & (1 << index)) !== 0;
  }
}
```


### BitSet.forEach

Our `BitSet.forEach` implementation should invoke a callback for every bit that is set to 1 with the index of that bit.

```tsx
class BitSet {
  forEach(callback: (index: number) => void) {
    // ...
  }
}
```

To start off, we'll iterate through every word in `words`:

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

If the bit is non-zero, we invoke the callback:

```tsx
for (let i = 0; i < WORD_LEN; i++) {
  const bitIsSetToOne = (word & (1 << i)) !== 0;
  if (bitIsSetToOne) {
    // Invoke callback
  }
}
```

We'll need to invoke the callback with the index of the bit, which we can compute like so:

```tsx
const index = (wordIndex << WORD_LOG) + i;
```

The `wordIndex << WORD_LOG` expression is equivalent to `wordIndex * WORD_LEN` because left shifting by one is equivalent to multiplying by 2 (and `2 ** WORD_LOG` equals `WORD_LEN`).

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

The first thing that pops out to me is that we always iterate over every bit in every word. If we can know whether a word has no set bits, then we can skip iterating over that word.

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

But to figure out how this optimization affects performance, we'll need to run some benchmarks.

To see the performance characteristics for bit sets with different densities, we'll benchmark different densities:

```tsx
// From 100% dense (all 1s) to 0.1% dense (mostly 0s)
const densities = [1, 0.75, 0.5, 0.25, 0.1, 0.01, 0.001];
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

Now that we've created the bit sets, we'll run the `forEach` method for them all and log out how long it takes.

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

Putting this in a table, we can compare the performance:

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

We get no significant performance gains for densities under 10%, but once we reach densities of &lt;5% we start to see significant performance improvements. __>2x faster__ at 1% density and __>10x faster__ at 0.1% density.

We can try to improve this further by skipping _each half_ of a word if it's all 0s. First off, we'll create bitmasks for each half of a word:

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

Using this, we want to

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


### Two's complement

Iterating over individual bits is expensive and requires an `if` statment at each iteration to check whether to invoke the callback or not. This `if` statement creates a [branch][branching] which further degrades performance.

[branching]: https://johnnysswlab.com/how-branches-influence-the-performance-of-your-code-and-what-can-you-do-about-it/

If we were able to somehow "jump" to the next set bit, we would eliminate the need to iterate over 0 bits and perform a bunch of `if` statements.

As it turns out, there's a really cheap method to find the least significant bit set to 1, which looks like so:

```tsx
word & -word
```

When I first saw this, it made no sense to me.

> _“Doesn't making a number negative just set the sign bit to 1?”_

But I was wrong. As we see below, `x & -x` yields the least-significant set bit in `x`.

```tsx
function lsb(x: number) {
  return x & -x;
}

 lsb(0b10011010);
//=> 0b00000010

 lsb(0b10011000);
//=> 0b00001000

 lsb(0b10010000);
//=> 0b00010000

 lsb(0b10000000);
//=> 0b10000000
```

This is because of [two's complement][twos_complement], which is the most common way that signed numbers are represented.

[twos_complement]: https://en.wikipedia.org/wiki/Two%27s_complement

{<table data-pad-heading data-align="center">
  <tbody>
    <tr>
      <th colSpan="4">Negative numbers, represented in two's complement</th>
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
  </tbody>
</table>}

Using two's complement, the negative counterpart of a positive integer is computed by:

 1. Inverting the bits (bitwise NOT), including the sign bit
 2. Adding 1 to the number, ignoring overflow

```tsx
00110000 // 19

// Invert bits
11101100

// Add 1
11101101 // -19
```

The binary representation of `19` has a 1 as the least-significant bit. Once inverted, adding one will always make the first bit 1, which makes `19 & -19` yield the 1st bit.

Let's take a look at a number with some leading 0s:

```tsx
00110000 // 48

// Invert bits
11001111

// Add 1
11010000 // -48
```

In this case, we observe that all the bits before the least-significant set bit become 1 when inverted. When 1 is added to the number, the 1s are carried until they reach the least-significant bit, which makes `48 & -48` yield the 5th bit.

So when iterating over the bits of a word, we can always find the next (least-significant) set bit via `x & -x`. What's really neat is that we can then use bitwise XOR to unset the bit:

```tsx
while (word !== 0) {
  const lsb = word & -word;

  // Unset the least-significant bit
  word ^= lsb;

  // With the least-significant bit unset, the next iteration
  // will yield the next least-significant set bit.
}
```

This is great, we can iterate directly over the set bits without any `if` statements!

But we've got a problem. We want to invoke the callback with the _index of_ the set bits, not the set bits themselves. We'll accomplish this through the use of [Hamming weights][hamming_weight].

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

This transforms the problem from finding the index of the set bit in `x` into computing the number of set bits in `x - 1`. The number of non-zero bits is known as the [Hamming weight][hamming_weight], and turns out that we can [compute the Hamming weight][compute_hamming_weight] of an integer very cheaply:

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

For densities of 5-50%, we receive a __~5x increase in performance__. Higher densities above 50% receive a notable speedup of >2x, while lower densities (&lt;5%) see a __5-17x increase in performance__.


### Set operation performance

Implementing implement AND and OR for boolean arrays. Our input data will look like so:

We can trivially implement AND and OR for a list of booleans by applying `&&` and `||` at each index:

```tsx
function AND(a: boolean[], b: boolean[]) {
  return a.map((_, i) => a[i] && b[i]);
}

function OR(a: boolean[], b: boolean[]) {
  return a.map((_, i) => a[i] || b[i]);
}
```

Implementing AND and OR for bit sets is identical, except we use `&` and `|` instead:

```tsx
function AND(a: number[], b: number[]) {
  return a.map((_, i) => a[i] & b[i]);
}

function OR(a: number[], b: number[]) {
  return a.map((_, i) => a[i] | b[i]);
}
```

Instead of a single logical (`&&` or `||`) operation at each index, we perform a single bitwise (`&` or `|`) at each index. When working with 32 bit integers, this means that each bitwise operation processes _32 booleans_.

Let's see how fast bit sets are compared to boolean lists by writing some benchmarks:

```tsx
const a = makeRandomBooleanArrayOfLength(10_000_000);
const b = makeRandomBooleanArrayOfLength(10_000_000);

profile(() => {
  for (let i = 0; i < a.length; i++) {
    a[i] &&= b[i];
  }
}, (ms) => console.log(`Ran in ${ms} ms`));
```

Running this emits:

```
Ran in 49.8 ms
```

<SmallNote moveCloserUpBy={24}>I'm running these benchmarks on my M2 Macbook Air using Node 20</SmallNote>

So running AND on 10 million booleans takes 50ms. Let's see how long that takes for 10 million integers.

```tsx
const a = makeRandomIntegerArrayOfLength(10_000_000);
const b = makeRandomIntegerArrayOfLength(10_000_000);

profile(() => {
  for (let i = 0; i < a.length; i++) {
    a[i] &= b[i];
  }
}, (ms) => console.log(`Ran in ${ms} ms`));
```

This emits:

```
Ran in 10.4 ms
```

That's roughly 5 times faster!

But consider that an array of 10 million integers corresponds to 320 million booleans. This means that the AND operation for a bit set is over __150 times faster__ than for booleans.

This is largely because bitwise operations correspond to a single CPU instruction, which makes them extremely cheap to execute.

Lastly, let's compare this to a native JavaScript `Set`.


#### Comparing performance with `Set`

Comparing `Set` with bit sets is not a perfect apples-to-apples comparison. Bit sets need to store both 0s and 1s, while a `Set` only stores values present in the set (i.e. the 1s).

This means that set density matters. Bit sets are more efficient when the set is densely packed, and become less efficient as they become more sparse.

For example, consider these two sets:

 * 10,000 random numbers between 0 and 100,000
 * 1,000 random numbers between 0 and 10,000,000

In the first example, the bit set needs to iterate over 3,125 integers (100,000 / 32). In the latter example, the bit set needs to iterate over 312,500 integers. This means that the latter set takes 100 times more time to process, despite having 10 times fewer elements.

`Set` has the opposite performance characteristics. `Set` iterates directly over the elements, which makes performance scale with the number of elements in the set, not the element range.

TODO: link to set benchmark

I benchmarked performing OR on two `Set`s and two bit sets. In both cases, we create a set containing N random numbers between 0 and 100,000,000. Here are the performance characteristics for different values of N:

{<table data-align="right">
  <tbody>
    <tr>
      <th>Number of elements</th>
      <th colSpan="2">Time to process</th>
    </tr>
    <tr>
      <th></th>
      <th>Set</th>
      <th>Bit set</th>
    </tr>
    <tr>
      <td>1,000</td>
      <td>0.1 ms</td>
      <td>3.6 ms</td>
    </tr>
    <tr>
      <td>10,000</td>
      <td>0.5 ms</td>
      <td>3.7 ms</td>
    </tr>
    <tr>
      <td>100,000</td>
      <td>3.6 ms</td>
      <td>3.8 ms</td>
    </tr>
    <tr>
      <td>1,000,000</td>
      <td>65.8 ms</td>
      <td>3.6 ms</td>
    </tr>
    <tr>
      <td>10,000,000</td>
      <td>1,032.5 ms</td>
      <td>3.7 ms</td>
    </tr>
  </tbody>
</table>}

<SmallNote label="" moveCloserUpBy={24}>Every element is a random number between 0 and 100,000,000</SmallNote>

For `Set`, the time it takes to perform the OR operation increases with N. In contrast, the set operation performance for bit set stays constant since the range size determines performance.

We see similar results for AND:

{<table data-align="right">
  <tbody>
    <tr>
      <th>Number of elements</th>
      <th colSpan="2">Time to process</th>
    </tr>
    <tr>
      <th></th>
      <th>Set</th>
      <th>Bit set</th>
    </tr>
    <tr>
      <td>1,000</td>
      <td>0.1 ms</td>
      <td>3.7 ms</td>
    </tr>
    <tr>
      <td>10,000</td>
      <td>0.6 ms</td>
      <td>3.7 ms</td>
    </tr>
    <tr>
      <td>100,000</td>
      <td>4.5 ms</td>
      <td>3.8 ms</td>
    </tr>
    <tr>
      <td>1,000,000</td>
      <td>87.6 ms</td>
      <td>3.7 ms</td>
    </tr>
    <tr>
      <td>8,000,000</td>
      <td>1108.2 ms</td>
      <td>3.7 ms</td>
    </tr>
  </tbody>
</table>}

<SmallNote moveCloserUpBy={24}>I couldn't go above 8M elements because I started running into the [maximum size limit for `Set`][max_set_size]</SmallNote>

[max_set_size]: https://blog.xdumaine.com/maximum-set-size-in-node-js/




## Set benchmark

Here's a benchmark to test out AND performance for `Set`:

```tsx
const a = makeSet(N);
const b = makeSet(N);

profile(() => {
  b.forEach((element) => {
    if (!a.has(element)) {
      a.delete(element);
    }
  });
}, (time) => console.log(`Ran in ${time} ms`));
```