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

In the following example, we'll represent a users permissions using a bit mask. Bits in the bit mask correspond to a specific permission (e.g. `READ` or `WRITE`). If the corresponding bit is set to 1, the user has the permission, otherwise it doesn't.

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

...


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