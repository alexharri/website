---
title: "Looking at Bit Set performance for boolean operations"
description: ""
publishedAt: ""
image: ""
---

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