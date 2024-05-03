---
title: "Bit Sets: An introduction to bit manipulation"
description: "Learn about bitwise operators and bit manipulation by implementing a BitSet class in JavaScript."
publishedAt: "2024-01-06"
image: ""
---

[Bit sets][bitset] — also known as bit arrays or bit vectors — are a highly compact data structure that stores a list of bits. They are often used to represent a set of integers or an array of booleans.

In addition to their memory-compactness, bit sets support extremely performant boolean operations like [unions][union] and [intersections][intersection], achieved through the use of [bitwise operations][bitwise_ops].

[bitwise_ops]: https://en.wikipedia.org/wiki/Bitwise_operation

In this 2-part series on bit sets, we'll walk through implementing a `BitSet` from scratch in JavaScript.

 * This post covers the basics of bitwise operators and bit manipulation. We'll use that knowledge to implement a basic `BitSet` class.
 * <a href="/blog/bit-sets-fast-foreach" target="_blank">In part 2</a> we'll add the ability to iterate over bit sets extremely quickly by exploiting [two's complement][twos_complement] and [Hamming weights][hamming_weight].

[bitset]: https://en.wikipedia.org/wiki/Bit_array
[union]: https://en.wikipedia.org/wiki/Union_(set_theory)
[intersection]: https://en.wikipedia.org/wiki/Intersection_(set_theory)
[hamming_weight]: https://en.wikipedia.org/wiki/Hamming_weight

The post assumes that you're somewhat familiar with [binary numbers][binary_numbers], so refresh your memory if you haven't used them for a while.

[binary_numbers]: https://www.mathsisfun.com/binary-number-system.html

With that out of the way, let's get started!

## Bit masks

[Bit masks][mask] allow us to compactly store multiple booleans in a single number. You may know bit masks as _bit flags_ or _bit fields_.

[mask]: https://en.wikipedia.org/wiki/Mask_(computing)

```ts
// This binary number...
00001001

// ...is equivalent to this array of booleans
[ true, false, false, true, false, false, false, false ]
```

<SmallNote label="">Binary numbers are read right-to-left, following [bit ordering][bit_ordering] from least-significant to most-significant</SmallNote>

Each bit in the bit mask corresponds to a single boolean — 1 representing true, and 0 representing false.

In the following example, we'll represent a user's permissions using a bit mask. Certain positions in the bit mask correspond to specific permissions (e.g. `READ` or `WRITE`). If the corresponding bit is set to 1, the user has the permission, otherwise, they don't.

```tsx
// The '0b' prefix denotes a binary numbers
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

canRead(0b1100);
//=> false

canRead(0b0101);
//=> true
```

`&` is the [bitwise AND operator][bitwise_and]. It returns a new number where the bits are set to 1 if both of the input bits are 1.

[bitwise_and]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_AND

```tsx
Input         0101     0101     0101
Bit mask    & 0001   & 0010   & 0100
------------------------------------
Output        0001     0000     0100
```

If the input numbers have no bits in common with the bit mask, the `&` operation will yield 0.

```tsx
const BIT_MASK = 0b0010;

function secondBitIsSetToOne(input: number) {
  return (input & BIT_MASK) !== 0;
}
```

`|` is another operator, representing [bitwise OR][bitwise_or]. It returns a new number where the bits are set to one if either of the input bits is 0.

[bitwise_or]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_OR

```tsx
Input         0101     0101     0101
Bit mask    | 0001   | 0010   | 0100
------------------------------------
Output        0101     0111     0101
```

We can use it to, for example, set specific bits to one.

```tsx
const READ = 0b0001;

function addReadPermission(permissions: number) {
  return permissions | READ;
}

addReadPermission(0b0010);
//=> 0b0011
```

We can now add permissions, but what about removing them?

We can set bits to 0 through the use of the [bitwise NOT][bitwise_not] operator `~`, a [unary][unary_operator] operator that flips all of the bits in the number:

[bitwise_not]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_NOT

<SmallNote label="">Unary means that it takes a single operand, as opposed to two.</SmallNote>

[unary_operator]: https://www.digitalocean.com/community/tutorials/javascript-unary-operators-simple-and-useful

```tsx
Input     ~0101   ~1000   ~0001
-------------------------------
Output     1010    0111    1110
```

We can use NOT to create an _inverse bit mask_ that passes through all but one bit:

```tsx
const READ   = 0b0001;
const UPDATE = 0b0010;

console.log(~READ)
//=> 0b1110

console.log(~UPDATE)
//=> 0b1101
```

Using this in conjunction with AND, we can set specific bits to zero:

```tsx
const READ = 0b0001;

function removeReadPermission(permissions: number) {
  return permissions & ~READ;
}

removeReadPermission(0b0011);
//=> 0b0010
```

We can also create groups of permissions using OR:

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


### Limits of bit masks

Bit masks are great, but their capacity is limited. JavaScript only [supports 32-bit integers][js_32_bit_integers], so a bit mask can only store 32 bits.

[js_32_bit_integers]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#fixed-width_number_conversion

This is where bit sets come in. Once you need to store more than 32 booleans (or 64, depending on the language) you can use an array of integers to make the number of bits _arbitrarily_ large.

```ts
[ 0b00010011, 0b01100000, ... ]
```

## Implementing a bit set

The integers that store the bits of our bit set are called [words][words], so we'll store a `words` array in our `BitSet` class.

[words]: https://en.wikipedia.org/wiki/Word_(computer_architecture)

```tsx
class BitSet {
  private words: number[];
}
```

Any set data structure will need a few basic operations:

 * Add an element
 * Remove an element
 * Check for the presence of an element

The elements of a bit set are non-negative integers that correspond to a bit index. If the bit at index `N` is set to 1, then `N` is considered to be _in_ the set.

Considering that, we can create a skeleton for our `BitSet` class:

```tsx
class BitSet {
  private words: number[];
  
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

Each bit will be stored in some individual `word` in `words`. Consider how the `words` array is structured:

```ts
[ 00000000, 00000000, 00000000, 00000000 ]

// The `0b` prefix is omitted for clarity, and we're using
// 8 bits instead of 32 for readability
```

We can map each bit to an absolute index:

```ts
[ 00000000,   00000000,   00000000,   00000000 ]
  │││││││└  0 │││││││└  8 │││││││└ 16 │││││││└ 24
  ││││││└─  1 ││││││└─  9 ││││││└─ 17 ││││││└─ 25
  │││││└──  2 │││││└── 10 │││││└── 18 │││││└── 26
  ││││└───  3 ││││└─── 11 ││││└─── 19 ││││└─── 27
  │││└────  4 │││└──── 12 │││└──── 20 │││└──── 28
  ││└─────  5 ││└───── 13 ││└───── 21 ││└───── 29
  │└──────  6 │└────── 14 │└────── 22 │└────── 30
  └───────  7 └─────── 15 └─────── 23 └─────── 31
```

<SmallNote label="">Each word is indexed right-to-left, following [bit ordering][bit_ordering] from least-significant to most-significant</SmallNote>

[bit_ordering]: https://en.wikipedia.org/wiki/Bit_numbering

But to find a single bit in a specific `word`, we need to convert the input index into two indices:

 1. The index of the `word` in `words`.
 2. The index of the bit in `word`.

```ts
//   word 0    word 1    word 2    word 3
[  00000000, 00000000, 00000000, 00000000  ]
// 76543210  76543210  76543210  76543210
```

### Parsing an input index

Since JavaScript only supports [32-bit integers][js_32_bit_integers], we'll define a `WORD_LEN` constant with the value 32.

[js_32_bit_integers]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#fixed-width_number_conversion

```tsx
const WORD_LEN = 32;
```

Because `WORD_LEN` is a power of two, the bit index within the `word` will be the `log2(WORD_LEN)` least significant bits of `index`, which yields a value of 5.

```tsx
Math.log2(WORD_LEN)
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
0000000000000000 // input index
           ~~~~~
           00000 // bit index
```

When all of the bits in the bit index region are set to 1, we get a word index of 0 and a bit index of 31, corresponding to the 32nd bit.

```ts
00000000000 = 0 // word index
~~~~~~~~~~~
0000000000011111 = 31 // input index
           ~~~~~
           11111 = 31 // bit index

// 32nd bit
```

If we increment the input index by 1, we get a word index of 1 and a bit index of 0, corresponding to the 33rd bit.

```ts
00000000001 = 1 // word index
~~~~~~~~~~~
0000000000100000 = 32 // input index
           ~~~~~
           00000 = 0 // bit index

// 33rd bit
```

This works for any input index. An input `index` of 100 corresponds to `0b1100100` in binary. Broken down, we get a word index of 3 and a bit index of 4, corresponding to the 101st bit.

```tsx
00000000011 = 3 // word index
~~~~~~~~~~~
0000000001100100 = 100 // input index
           ~~~~~
           00100 = 4 // bit index

// 101st bit
```

We can verify this by computing `(3 * 32) + 4`:

```tsx
const wordIndex = 3;
const bitIndex = 4;

(wordIndex * 32) + bitIndex
//=> 100
```

So to compute the word index, we need to shift the bits in the input index right by 5 (i.e. `log2(WORD_LEN)`) so that the word index bits become the rightmost (least-significant) bits.

We can do this with the `>>` operator.

```tsx
const wordIndex = index >> 5;
```

`>>` is the [bitwise right shift][bitwise_right_shift] operator. It returns the input number with its bits shifted right by N places:

[bitwise_right_shift]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Right_shift

```tsx
const input = 0b01100100;

input >> 5
//=> 0b00000011
```

This can be illustrated like so:

```tsx
// This expression...
0b01100100 >> 5

// ...corresponds to the following
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

This sets any bits left of the 5 least significant bits to zero.

And with that, we know how to parse an input `index` into word and bit indices:

```tsx
const wordIndex = index >> WORD_LOG;
const bitIndex = index & 0b11111;
```

We can now get to implementing some of the methods of `BitSet`!


### BitSet.add

The `add` method should set the bit at `index` to 1. This bit will live in some individual `word`, which we can access via `wordIndex`:

```tsx
class BitSet {
  add(index: number) {
    const wordIndex = index >> WORD_LOG;
    const bitIndex = index & 0b11111;
    // ...
  }
}
```

Given an integer, we can set the bit at a specific index to 1 like so:

```tsx
function setBitAtIndexToOne(input: number, index: number) {
  return input | (1 << index);
}

setBitAtIndexToOne(0b00000000, 2);
//=> 0b00000100

setBitAtIndexToOne(0b00000000, 5);
//=> 0b00100000
```

`<<` is the [bitwise left shift][bitwise_left_shift] operator, which returns the input number with its bits shifted left by N places.

[bitwise_left_shift]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Left_shift

The expression `1 << index` creates a bit mask with the bit at `index` set to one.

```tsx
1 << 2;
//=> 0b00000100

1 << 0;
//=> 0b00000001

1 << 6;
//=> 0b01000000
```

Applying this bit mask to our word using bitwise OR will set the bit at `bitIndex` to 1.

```tsx
this.words[wordIndex] |= (1 << bitIndex);
```

With that, we have our implementation:

```tsx
class BitSet {
  add(index: number) {
    const wordIndex = index >> WORD_LOG;
    const bitIndex = index & 0b11111;

    this.words[wordIndex] |= (1 << bitIndex);
  }
}
```

However, there is one simplification we can make. Because the bitwise shift operators `<<` and `>>` operate on 32-bit integers, the maximum shift possible is 31 (from 32nd to 1st bit, or 1st to 32nd bit).

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

removeReadPermission(0b0011);
//=> 0b0010
```

As we did in `BitSet.add`, we'll use `1 << index` to create a bit mask for a specific bit.

```tsx
1 << 4
//=> 0b00010000
```

We then invert that bit mask using bitwise NOT:

```tsx
~(1 << 4)
//=> 0b11101111
```

And then apply this inverse bit mask via bitwise AND:

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

As before, we create a bit mask using left shift and apply it using bitwise AND. 

```tsx
const word = 0b11011100;

word & (1 << 4)
//=> 0b00010000
```

If the result is non-zero, the bit is set to 1.

```tsx
class BitSet {
  has(index: number) {
    const wordIndex = index >> WORD_LOG;
    return (this.words[wordIndex] & (1 << index)) !== 0;
  }
}
```


### Handling edge cases

One easy edge case to run into is `wordIndex` being out-of-bounds. That problem can be resolved by adding a `resize` method that ensures that the `words` array encompasses `wordIndex`:

```tsx
class BitSet {
  set(index: number) {
    const wordIndex = index >> WORD_LOG;
    this.resize(wordIndex);
    // ...
  }
  
  private resize(wordIndex: number) {
    // Make 'this.words' encompass 'wordIndex'
  }
}
```

I won't cover other edge cases in this post. If you're interested, feel free to explore [my full implementation of `BitSet` on GitHub][alexharri_bitset].


## Next up: Iteration

We covered a lot of ground in this post!

Next up in our bit set journey is iterating over bits. We'll learn how exploiting [two's complement][twos_complement] and [Hamming weights][hamming_weight] enables us to make our iteration extremely fast!

See you in part 2: <a href="/blog/bit-sets-fast-foreach" target="_blank">Iterating over Bit Sets quickly</a>

— Alex Harri

[alexharri_bitset]: https://github.com/alexharri/bitset-mut
[twos_complement]: https://en.wikipedia.org/wiki/Two%27s_complement