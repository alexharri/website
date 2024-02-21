---
title: "JSDoc as an alternative TypeScript syntax"
description: "How to type your JavaScript code base using JSDoc comments."
publishedAt: ""
---

As web development has embraced static typing during the past decade, TypeScript has become the default language of choice. I think this is great—I love working with TypeScript!

But what if you can't use TypeScript? You may encounter circumstances where you need to work in plain JavaScript, be it tooling constraints or a team member who does not like static typing.

Under these circumstances, look to JSDoc for salvation:

```js
/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function add(a, b) {
  return a + b;
}
```

I was surprised when I learned that the TypeScript compiler actually understands JSDoc comments. This fact allows you to type your entire codebase without creating a single `.ts` file.

Think of this post as your crash course in using JSDoc as an alternative syntax for TypeScript. We'll cover all the important TypeScript-related features JSDoc has to offer—and their limitations.

## JSDoc

JSDoc is expressed through block comments in the form `/** */`, which may contain _block tags_ such as `@param` and `@type`. Normal `//` and `/* */` comments don't work:

```tsx
// @type {number}
let a; // Doesn't work

/* @type {number} */
let b; // Doesn't work

/*** @type {number} */
let c; // Doesn't work

/** @type {number} */
let c; // Works!
```

The majority of your JSDoc block tags will be used for typing variables, arguments, and return types. The block tags for those are `@type`, `@param`, and `@returns`.

```js
/**
 * @param {string} message
 * @returns {number}
 */
function len(message) {
  return message.length;
}

/** @type {{ name: string, age: number }} */
const user = {
  name: "Alex",
  age: 26,
};
```

### Type casting

Type casting in TypeScript can be done using `expression as T` or `<T>expression`:

```ts
function example(arg: unknown) {
  const num = arg as number;
  const str = <string>arg;
}
```

Type casting in JSDoc is done by wrapping the expression in parentheses and adding a preceding `@type` comment:

```ts
/** @param {number} num */
const square = (num) => num * num;

/** @param {unknown} arg */
function example(arg) {
  const num = /** @type {number} */ (arg);
  return square(num); // OK!
}
```

The parentheses are required. If they are missing the cast will not work:

```js
/** @param {number} num */
const square = (num) => num * num;

/** @param {unknown} arg */
function example(arg) {
  const num = /** @type {number} */ arg;
  return square(num);
         // @error {w=6} Argument of type 'unknown' is not assignable to parameter of type 'number'.
}
```

Missing parentheses are a really easy mistake to make, which can easily lead to bugs when casting from `any`. Be careful with casts in JSDoc!

#### Const assertions

TypeScript supports [const assertions][const_assertions], which can be quite useful.

```ts
function resize(options: { size: 1 | 2 }) {
  // ...
}

const a = { size: 1 as const };
const b = { size: 2 };

resize(a); // OK
resize(b);
       // @error {w=1} Types of property 'size' are incompatible.\n  Type 'number' is not assignable to type '1 | 2'.
```

[const_assertions]: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions

You can also use const assertions in JSDoc, they're just a type cast:

```js
/**
 * @param {{ size: 1 | 2 }} options
 */
function resize(options) {
  // ...
}

const a = { size: /** @type {const} */ (1) };
const b = { size: 2 };

resize(a); // OK
resize(b);
       // @error {w=1} Types of property 'size' are incompatible.\n  Type 'number' is not assignable to type '1 | 2'.
```

### Declaring types

In TypeScript, you can declare types using the `type` or `interface` keywords:

```tsx
type Value = string | number;

interface Store {
  value: Value;
  set(value: Value): void;
}
```

In JSDoc, types are declared using the `@typedef` keyword:

```js
/**
 * @typedef {string | number} Value
 */

/**
 * @typedef {{ value: Value, set(value: Value): void }} Store
 */
```

Having declared a type with `@typedef`, you can reference it like any other TypeScript type:

```js
/** @type {Value} */
const value = 5;

/** @type {Store} */
const store = {
  value,
  set(value) {
    this.value = value;
  },
};
```

An alternative way to declare the properties of an object type is using `@property`:

```js
/**
 * @typedef {object} Store
 * @property {Value} value
 * @property {(value: Value) => void} set
 */
```

Nested properties can be specified using `.` as a separator:

```js
/**
 * @typedef {object} User
 * @property {object} name
 * @property {string} name.first
 * @property {string} name.last
 */

/** @type {User} */
const user = {
  name: {
    first: "Jane",
    last: "Doe"
  },
};
```

<SectionAnchor id="exporting-types">
  <h3>Exporting types</h3>
</SectionAnchor>

There's no syntax for exporting types in JSDoc. Instead, types defined using `@typedef` are __exported by default__. This auto-exporting applies to all types declared at the top level of a module.

As someone who cares a lot about the interfaces of modules, I strongly dislike this feature.

You can avoid the auto-exporting by declaring types in the scope that they're needed in:

```ts
// 'Foo' is declared at the top level and can thus be imported by
// other modules.
/** @typedef {string} Foo */

{
  // 'Bar' is declared in a block scope: it cannot be imported by
  // other modules.
  /** @typedef {string} Bar */
}

function example() {
  // 'Baz' is declared in a function: it cannot be imported by
  // other modules.
  /** @typedef {string} Baz */
}
```

One thing worth mentioning is that types declared in JavaScript modules using JSDoc can be imported from TypeScript modules.

### Importing types

In TypeScript, you can reference types from other modules via `import` statements or `import("./path").Type`:

```tsx
import { Foo } from "./module";

let foo: Foo;
let bar: import("./module").Bar;
```

<SmallNote>In TypeScript modules you can declare that the import is for a type via `import type { Foo }` or `import { type Foo }`</SmallNote>

JSDoc only allows you to use `import("./path")`:

```ts
/** @type {import("./module").Foo} */
let foo;
```

This can get quite verbose for long module paths and type names, so you can "fake" normal imports using `@typedef`:

```ts
/** @typedef {import("./module").Foo} Foo */

/** @type {Foo} */
let foo;
```

But keep the auto-exporting footgun in mind! As mentioned in [Exporting types](#exporting-types), types defined via `@typedef` are auto-exported, which means that the type is re-exported.

```ts
// This...
/** @typedef {import("./module").Foo} Foo */

// ...is equivalent to this
import { Foo } from "./module";
export { Foo } from "./module";
```

### Non-null assertions

We've arrived at my largest gripe with JSDoc: __it doesn't support non-null assertions__.

Take the `Map<K, V>` data structure as an example. The return type of `Map<K, V>.get` is `V | undefined`, which can be frustrating when you know for certain that a value is non-null.

```tsx
const map = new Map<string, number>([
  ["a", 1],
  ["b", 2],
]);

const a: number = map.get("a");
      // @error {w=1} Type 'number | undefined' is not assignable to type 'number'.
```

In TypeScript, you can use `!` after an expression to assert that it is non-nullable.

```tsx
const a: number = map.get("a")!; // OK!
```

There is no equivalent `@nonnull` tag or syntax in JSDoc.

One possible workaround is to use a type cast like so:

```tsx
/** @type {number} */
const a = /** @type {number} */ (map.get("a"));
```

The problem with type casts is that they can become incorrect as the code evolves. Imagine that `map` is updated to store `string | number` instead of just `number`:

```tsx
/** @type {Map<string, number | string>} */
const map = new Map([ ... ]);

/** @type {number} */
const a = /** @type {number} */ (map.get("a"));
```

Type casting `string | number | undefined` to `number` is valid, so we get no type error. __The type cast masks the type error__, which would have not happened using non-null assertions.

```tsx
const map = new Map<string, number | string>([ ... ]);

const a: number = map.get("a")!;
      // @error {w=1} Type 'string | number' is not assignable to type 'number'.
```

There is one safe way to express non-nullability in JSDoc, which is using the `NonNullable` type in conjunction with `typeof`. Any expression `expr` can be declared non-nullable by casting it to `NonNullable<typeof expr>`, though this can be quite verbose.

```tsx
/** @type {Map<string, number>} */
const map = new Map([ ... ]);

/** @type {number} */
const a = /** @type {NonNullable<ReturnType<typeof map.get>>} */ (map.get("a"));
```

We can make this more readable like so:

```tsx
const aNullable = map.get("a");
/** @type {number} */
const a = /** @type {NonNullable<typeof aNullable>} */ (aNullable);
```

But this is still terribly noisy! This would be much cleaner if `@nonnull` were supported:

```tsx
/** @type {number} */
const a = /** @nonnull */ (map.get("a"));
```

This issue is being tracked in [#23405 in microsoft/TypeScript][nonnullable_issue]. Let us pray that `@nonnull` will be added at some point.

[nonnullable_issue]: https://github.com/microsoft/TypeScript/issues/23405

### Optional parameters

Parameters can be marked as optional in TypeScript using `?`:

```ts
function foo(a: number, b?: boolean) {
  // ...
}

foo(1); // OK
```

In JSDoc, you can mark parameters as optional by wrapping their name in `[]`:

```js
/**
 * @param {number} a
 * @param {boolean} [b]
 */
function foo(a, b) {
  // ...
}

foo(1); // OK
```

A parameter can also be implicitly marked as optional by providing a default argument, just like in TypeScript:

```js
/**
 * @param {number} a
 * @param {boolean} b
 */
function foo(a, b = false) {
  // ...
}

foo(1); // OK
```

There is an alternative syntax for marking parameters as optional where `=` is placed after the type:

```js
/**
 * @param {number} a
 * @param {boolean=} b
 */
function foo(a, b) {
  // ...
}

foo(1); // OK
```

<SmallNote label="">I find this syntax a bit weird, but hey, it's supported.</SmallNote>

### Generic type parameters

Declaring a generic type parameter is done using `@template`:

```ts
/**
 * @template T
 * @param {T} value
 * @returns {{ value: T }}
 */
function box(value) {
  return { value };
}

// Equivalent TypeScript
function box<T>(value: T): { value: T } {
  return { value };
}
```

Expressing an `extends` constraint is done like so:

```ts
/**
 * @template {string | number} T
 * @param {T} value
 * @returns {{ value: T }}
 */
function box(value) {
  return { value };
}

// Equivalent TypeScript
function box<T extends string | number>(value: T): { value: T } {
  return { value };
}
```

The `@template` block tag can also be used for type definitions, classes, methods, and more.

```js
// Declaring a generic type
/**
 * @template T
 * @typedef {{ value: T }} Box
 */

// Referencing a generic type
/** @type {Box<number>} */
const box = { value: 5 };

// Creating a generic class
/**
 * @template T
 */
class Box {
  /**
   * @param {T} value
   */
  constructor(value) {
    this.value = value;
  }
}
```

### Class properties

In TypeScript, you can declare class properties using the `public`/`private` keywords for constructor arguments or by explicitly declaring the properties.

```tsx
class Vector2 {
  // Use 'public' keyword to declare 'x', 'y' and
  // automatically assign them.
  constructor(public x: number, public y: number) {}
}

class Vector2 {
  // Explicitly declare properties
  public x: number;
  public y: number;
  
  constructor(x: number, y: number) {
    // Manually assign to properties
    this.x = x;
    this.y = y;
  }
}
```

Since JavaScript does not support the `public`/`private` keywords, we need to take the latter approach and assign manually:

```js
class Vector2 {
  /**
   * @param {number} x 
   * @param {number} y 
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
```

Unlike TypeScript, we don't need to explicitly declare `x` and `y` as properties in JavaScript modules. They are implicitly declared by assigning to them in the constructor.

However, I would argue that it's good practice to explicitly declare the types of class properties to avoid possible implicit `any`s.

```js
class Vector2 {
  /** @type {number} */
  x;
  /** @type {number} */
  y;
  
  /**
   * @param {number} x 
   * @param {number} y 
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
```


### Class `implements`

In TypeScript you can declare that a class `implements` a certain interface:

```ts
interface IEventEmitter {
  emit(type: string): void;
  subscribe(type: string, callback: () => void): void;
}

class EventEmitter implements IEventEmitter {
  // ...
}
```

It won't come as a surprise to hear that JSDoc has `@implements` for this purpose:

```js
/**
 * @typedef {object} IEventEmitter
 * @property {(type: string) => void} emit
 * @property {(type: string, callback: () => void) => void} subscribe
 */

/**
 * @implements {IEventEmitter}
 */
class EventEmitter {
  // ...
}
```


### Public and private properties and methods

Properties and methods can be declared as `public` and `private` via `@public` and `@private`:

```ts
class Example {
  /**
   * @public
   * @type {number}
   */
  foo;
  /**
   * @private
   * @type {string}
   */
  bar;
}

// Equivalent TypeScript
class Example {
  public foo: number;
  private bar: string;
}
```

### Typing `this`

TypeScript enables you to type the `this` argument for a function or method:

```tsx
interface Context {
  scale: number;
}

function foo(this: Context, value: number) {
  // ...
}
```

JSDoc contains an `@this` keyword for this purpose:

```tsx
/**
 * @typedef {{ scale: number }} Context
 */

/**
 * @this {Context}
 * @param {number} value
 */
function foo(value) {
  // ...
}
```

### `@ts-*` comments

All of your normal `@ts-*` comments, such as `@ts-ignore`, work as expected:

```js
/** @type {string} */
// @ts-ignore
let x = 5;
```

## Practical matters

We've now gone through all the major (in my opinion) TypeScript-related features in JSDoc. They should cover the vast majority of TypeScript features you'll ever need in JSDoc.

We'll now cover some practical things to know if you intend to use JSDoc with TypeScript.

### Enable `checkJs`

As we've seen, type annotations in JSDoc comments are used as type information in `.js` files.

```js
/**
 * @param {string} message
 */
function log(message) {
  // ...
}

log(12);
    // @error {w=2} Argument of type 'number' is not assignable to parameter of type 'string'.
```

However, `checkJs` needs to be enabled in your `tsconfig.json` for type errors to be emitted. If you don't enable `checkJs`, your JSDoc comments will only be used for IDE annotations—not type checking. Be sure to enable it!

### TypeScript interop

If you type a function using JSDoc in a `.js` module, you can import that function in a `.ts` module without any issues. This also works the other way: you can import things from `.ts` modules and use them in `.js` modules.

Generally, interop between `.js` modules using JSDoc and `.ts` modules "just works".

### JSDoc does not work in TypeScript modules

You can't use JSDoc for type annotations in `.ts` modules. This can make migrating from JSDoc to TypeScript a bit frustrating, especially for larger modules.

## Conclusion

I worked in a JSDoc codebase for a significant amount of time, and have gone through the process of migrating a lot of that codebase to TypeScript. JSDoc definitely has flaws, such as its clunky and verbose syntax, but it's still a perfectly viable way to go about typing your codebase.

If you're not able to use TypeScript for some reason, then consider giving JSDoc a shot. It's better than no types.