---
title: "Type assertions are not a substitute for non-null assertions"
description: ""
publishedAt: ""
image: ""
tags: ["TypeScript"]
---

Take JavaScript's <Code.ts interface>Map</Code.ts> data structure <EmDash /> it's <Code.ts method>get</Code.ts> and <Code.ts method>has</Code.ts> methods are defined like so in TypeScript:

```ts
interface Map<K, V> {
  get(key: K): V | undefined;
  has(key: K): boolean;
}
```

<Code.ts method>get</Code.ts>'s return type of <Code.ts>V | undefined</Code.ts> can result in frustration when you know that the return value is not <Code.ts>undefined</Code.ts> <EmDash /> like when you've already checked for the key's presence via <Code.ts method>has</Code.ts>:

```ts
const map = new Map<string, number>();

map.set("foo", 12);

if (map.has("foo")) {
  const value: number = map.get("foo");
        // @error {w=5} Type 'number | undefined' is not assignable to type 'number'.
}
```

An easy fix for the error above is to assert that the return value is of type <Code.ts>number</Code.ts> via a type assertion:

```ts
if (map.has("foo")) {
  const value = map.get("foo") as number; // No type error
}
```

We got rid of the error, but notice what happens if <Code.ts>map</Code.ts> is updated to store strings as well as numbers.

```ts
const map = new Map<string, number | string>();

map.set("foo", "Hello");
map.set("bar", 42);

if (map.has("foo")) {
  const value = map.get("foo") as number; // No type error
}
```

No compile-time type error! That's dangerous.

<Code.ts method>get</Code.ts>'s return type became <Code.ts>number | string | undefined</Code.ts>, but the type assertion still narrows the type to <Code.ts>number</Code.ts>.

We may have gotten no compile-time type error, but we'll certainly encounter errors at run-time when we try to use <Code.ts>value</Code.ts> as a number.

```ts
if (map.has("foo")) {
  const value = map.get("foo") as number;

  value * 10; // No type error because the type of 'value' is 'number'
}
```

TypeScript does not give us a compile-time type error because narrowing a type through <Code.ts>as</Code.ts> is a common and useful operation. Take this example of getting the rendering context of a canvas element whose id is <Code.ts>"some-canvas"</Code.ts>:

```ts
const canvas = document.getElementById("some-canvas");

const ctx = canvas.getContext("2d");
                   // @error {w=10} Property 'getContext' does not exist on type 'HTMLElement'.
```

<Code.ts method>getElementById</Code.ts>'s type definition has no way of knowing whether the returned element will be a canvas, span, or video element, so it makes sense for the method's return type to be the general <Code.ts interface>HTMLElement</Code.ts> interface. As a consequence, we get a compile-time type error when we attempt to use the canvas-specific <Code.ts method>getContext</Code.ts> method.

However, if we know that the element whose id is <Code.ts>"some-canvas"</Code.ts> will always be a canvas element, we can communicate that to TypeScript by asserting that the returned element is an <Code.ts interface>HTMLCanvasElement</Code.ts>. This lets us use <Code.ts method>getContext</Code.ts> without error.

```ts
const canvas = document.getElementById("some-canvas") as HTMLCanvasElement;

const ctx = canvas.getContext("2d"); // No type error
```

We know the returned element will always be a canvas, and we communicated that extra information to TypeScript via the type assertion. TypeScript accepts this information at face value <EmDash /> it trusts that we, the developer, have some information it doesn't.

With this in mind, let's circle back to the <Code.ts interface>Map</Code.ts> example.

```ts
const map = new Map<string, number | string>();

if (map.has("foo")) {
  const value = map.get("foo") as number;
}
```

TypeScript assumes that, by using the type assertion, we know something it doesn't, so it lets us assert that the type is <Code.ts>number</Code.ts>.

But our intent when writing <Code.ts>as number</Code.ts> was not to assert that the returned value is a <Code.ts>number</Code.ts> <EmDash /> we wrote it to assert that the value is _not_ <Code.ts>undefined</Code.ts>.

As a consequence, when <Code.ts>map</Code.ts> was updated to store <Code.ts>string</Code.ts>s as well, the type assertion stopped acting as a non-null assertion and became a _"this is a number"_ type assertion.


## Prefer non-null assertions

The proper way of asserting that a value is non-null in TypeScript is to use a [non-null assertion][non_null_assertion], specified via the <Code.ts>!</Code.ts> operator. Take this example:

[non_null_assertion]: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-

```ts
const map = new Map<string, string>();

// Use '!' to assert that the return value of 'get' is non-null
map.get("foo")!.toUpperCase();
```

If we omit the non-null assertion, TypeScript gives us an error telling us that the return value of <Code.ts method>get</Code.ts> is potentially <Code.ts>undefined</Code.ts>.

```ts
const map = new Map<string, string>();

map.get("foo").toUpperCase();
// @error {w=14} Object is possibly 'undefined'.
```

A non-null assertion, despite its name, asserts that the type is not <Code.ts>null</Code.ts> _and_ that the type is not <Code.ts>undefined</Code.ts>.

<SmallNote label="">A more accurate name would be _"non-[nullish][nullish] assertion"_, but that sounds silly, so non-null assertion it is!</SmallNote>

[nullish]: https://developer.mozilla.org/en-US/docs/Glossary/Nullish

Non-null assertions are preferable to type assertions because they're a narrower form of assertion that retains the original type information.

Let's take a look at what I mean by that.


### Type retention

In a type assertion, the original type information is only used to determine whether the type assertion is legal <EmDash /> the resulting type [must][type_assertions] be a more specific or less specific version of the original type.

[type_assertions]: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions

```ts
let value: string;

// There's no overlap between 'string' and 'number' so the
// assertion is not legal.
value as number;
// @error {w=15} Conversion of type 'string' to type 'number' may be a mistake because neither type sufficiently overlaps with the other.
```

If the type assertion is legal, the original type information is discarded in favor of the target type.

```ts
let value: string | number | null = null;

value as string; //=> <~ts>string</~>
```

The type assertion, <Code.ts>as string</Code.ts>, did remove <Code.ts>null</Code.ts> from the type, but we lost type information along the way <EmDash /> <Code.ts>number</Code.ts> is not part of the resulting type.

Non-null assertions don't suffer from this problem. They retain type information.

```ts
let value: string | number | null;

value!; //=> <~ts>string | number</~>
```

Always use non-null assertions over type assertions when possible.


## Final words

The value of non-null assertions became incredibly obvious when I worked in a code base that did not support them. They were not supported because the code base used [TypeScript via JSDoc][jsdoc_post] (JSDoc does not have a non-null assertion tag).

I wrote about [JSDoc and TypeScript interop][jsdoc_post] earlier this year, [briefly discussing][jsdoc_non_null] the problem that the lack of non-null assertions creates. But the problem of incorrectly used type assertions is a more general problem that is worth writing about, hence this post.

[jsdoc_post]: https://alexharri.com/blog/jsdoc-as-an-alternative-typescript-syntax
[jsdoc_non_null]: https://alexharri.com/blog/jsdoc-as-an-alternative-typescript-syntax#non-null-assertions

I hope this was interesting. Thanks for reading!

<EmDash /> Alex Harri

