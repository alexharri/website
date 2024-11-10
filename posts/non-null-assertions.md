---
title: "Type assertions are not a substitute for non-null assertions"
description: ""
publishedAt: ""
image: ""
tags: ["TypeScript"]
---

Take JavaScript's <Code.ts interface>Map</Code.ts> data structure <EmDash /> it's <Code.ts method>get</Code.ts> and <Code.ts method>has</Code.ts> methods are typed like so in TypeScript:

```ts
interface Map<K, V> {
  get(key: K): V | undefined;
  has(key: K): boolean;
}
```

<Code.ts method>get</Code.ts>'s return type of <Code.ts>V | undefined</Code.ts> can result in frustration when you know that a certain value is not undefined, for example if you've checked for the key's presence via <Code.ts method>has</Code.ts>:

```ts
const map = new Map<string, number>();

map.set("foo", 12);

if (map.has("foo")) {
  const value: number = map.get("foo");
        // @error {w=5} Type 'number | undefined' is not assignable to type 'number'.
}
```

An easy fix is to assert that the return type of <Code.ts method>get</Code.ts> is of type <Code.ts>number</Code.ts> via a type cast:

```ts
if (map.has("foo")) {
  const value = map.get("foo") as number; // No error
}
```

The problem with using type casts is that they can become incorrect as the code base evolves. Notice what happens if <Code.ts>map</Code.ts> is updated to store strings as well as numbers.

```ts
const map = new Map<string, number | string>();

map.set("foo", "Hello");
map.set("bar", 42);

if (map.has("foo")) {
  const value = map.get("foo") as number; // No error

  value * 10; // No error, type of 'value' is <~ts>number</~>
}
```

The <Code.ts method>get</Code.ts> method's return type becomes <Code.ts>number | string | undefined</Code.ts>, which the type cast incorrectly narrows to <Code.ts>string</Code.ts>. This leads to runtime errors when we use <Code.ts>value</Code.ts> as a number.

The TypeScript compiler does not give us an error because narrowing a type through the `as` keyword is a valid and common operation. Take this example where we're trying to get the rendering context of a canvas element:

```ts
const canvas = document.getElementById("canvas");

// The return type of 'getElementById' is 'HTMLElement', so
// we don't have access to canvas-specific methods.
const ctx = canvas.getContext("2d");
                   // @error {w=10} Property 'getContext' does not exist on type 'HTMLElement'.
```

The return type of <Code.ts method>getElementById</Code.ts> is the general <Code.ts interface>HTMLElement</Code.ts> interface <EmDash /> the TypeScript compiler has no way of knowing whether the returned element is a canvas, span or video element. As a consequence, we get a a type error when we attempt to use the canvas-specific <Code.ts method>getContext</Code.ts> method.

As the developers writing the application, we know that the element is a canvas. We can provide TypeScript with that extra information by asserting that the returned element is a <Code.ts interface>HTMLCanvasElement</Code.ts>. This lets us use <Code.ts method>getContext</Code.ts> without error.

```ts
const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const ctx = canvas.getContext("2d"); // No error
```




