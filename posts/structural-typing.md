---
title: "Why doesn't TypeScript properly type Object.keys?"
description: ""
publishedAt: ""
image: ""
---

If you've written TypeScript for a while, you've probably run into this:

```tsx
interface Options {
  hostName: string;
  port: number;
}

function validateOptions (options: Options) {
  Object.keys(options).forEach(key => {
    if (options[key] == null) {
        // @error {w=12} Expression of type 'string' can't be used to index type 'Options'.
      throw new Error(`Missing option ${key}`);
    }
  });
}
```

This error seems nonsensical. We're using the keys of `options` to access `options`. Why doesn't TypeScript just figure this out?

We can somewhat trivially circumvent this by casting `Object.keys(options)` to `(keyof typeof options)[]`.

```tsx
const keys = Object.keys(options) as (keyof typeof options)[];
keys.forEach(key => {
  // This is fine now.
  if (options[key] == null) {
    throw new Error(`Missing option ${key}`);
  }
});
```

But why is this a problem?

Let's take a look at the type definition of `Object.keys`.

```tsx
// typescript/lib/lib.es5.d.ts

interface Object {
  keys(o: object): string[];
}
```

It's very simple. Just accepts some object and returns `string[]`.

Making this a generic method that accepts a generic parameter of `T` and returns `(keyof T)[]` is very easy.

```tsx
class Object {
  keys<T extends object>(o: T): (keyof T)[];
}
```

It seems like a no brainer to define `Object.keys` like this, but TypeScript has a good reason for not doing so. The reason has to do with TypeScript's _structural type system_.


## Structural typing, and TypeScript

TypeScript complains when properties are missing or of the wrong type.

```tsx
function saveUser(user: { name: string, age: number }) {}

const user1 = { name: "Alex", age: 25 };
saveUser(user1); // OK!

const user2 = { name: "Sarah" };
saveUser(user2);
         // @error {w=5} Property 'age' is missing in type { name: string }.

const user3 = { name: "John", age: '34' };
saveUser(user3);
         // @error {w=5} Type 'string' is not assignable to type 'number'.
```

However, TypeScript does _not_ complain if we provide unecessary properties.

```tsx
function saveUser(user: { name: string, age: number }) {}

const user = { name: "Alex", age: 25, city: "Reykjavík" };
saveUser(user); // OK!
```

This is the intended behavior in structural type systems.

Type `A` is compatible with type `B` if `A` contains every property in `B` (and the types of those properties match).

This also means that if `B` is a superset of `A` then `B` is assignable to `A`, but `A` is not assignable to `B`.

```tsx
type A = { foo: number };
type B = A & { bar: number };

const a1: A = { foo: 1 };
const b1: B = { foo: 2, bar: 3 };

const a2: A = b1; // OK!
const b2: B = a1;
      // @error {w=2} Type 'A' is not assignable to type 'B'.\n  Property 'bar' is missing in type 'A'.
```

This means is that if we have an object of type `T`, all we know about that object is that it contains _at least_ the properties in `T`.

However, we _do not_ know whether we have _exactly_ `T`, which is why `Object.keys` is typed the way it is. Let's take an example.

### Unsafe usage of `Object.keys`

Let's say that we're creating an endpoint for a web service that creates a new user. We have an existing `User` interface that looks like so:

```tsx
interface User {
  name: string;
  password: string;
}
```

Before we save the user to the database, we want to ensure that the user object is valid.

 * `name` must be non-empty
 * `password` must be at leaast 6 characters

So we create a `validators` object that contains a validation function for each property:

```tsx
const validators = {
  name: (name: string) => name.length < 1
    ? "Name must not be empty"
    : "",
  password: (password: string) => password.length < 6
    ? "Password must be at least 6 characters"
    : "",
};
```

We then create a `validateUser` function to run a `User` object through these validators:

```tsx
function validateUser(user: User) {
  // Pass user object through the validators
}
```

Since we want to validate each property in `user`, we can iterate through the properties in `user` using `Object.keys`:

```tsx
function validateUser(user: User) {
  let error = "";
  for (const key of Object.keys(user)) {
    const validate = validators[key];
    error ||= validate(user[key]);
  }
  return error;
}
```

<SmallNote moveCloserUpBy={32}>There are type errors in this code block, which I'm hiding for now. We'll get to them later, I promise!</SmallNote>

The problem with this approach is that the `user` object might contain properties not present in `validators`.

```tsx
interface User {
  name: string;
  password: string;
}

function validateUser(user: User) {}

const user = { name: 'Alex', password: '1234', email: "alex@example.com" };
validateUser(user); // OK!
```

At runtime, this example will cause `validator` to be `undefined` and throw an error when called.

```tsx
for (const key of Object.keys(user)) {
  const validate = validators[key];
                   // @info {w=15} Evaluates to 'undefined' if the user value contains keys not present in 'validators'.
  error ||= validate(user[key]);
            // @error {w=8} TypeError: 'validate' is not a function
}
```


Luckily for us, TypeScript emitted type errors before this code had a chance to run.

```tsx
for (const key of Object.keys(user)) {
  const validate = validators[key];
                   // @error {w=15} Expression of type 'string' can't be used to index type '{ name: string, password: string }'.
  error ||= validate(user[key]);
                     // @error {w=9} Expression of type 'string' can't be used to index type 'User'.
}
```

The type errors force us to consider whether we can safely typecast using `keyof`, or whether we should update our code to be more safe.


### Making use of structural typing

Structural typing provides a lot of flexibility, allowing modules to declare only those properties which it needs. I want to demonstrate this by walking through an example.

Imagine that you've written a function that parses a `KeyboardEvent` and returns the shortcut to trigger.

```tsx
function getKeyboardShortcut(e: KeyboardEvent) {
  if (e.key === "s" && e.metaKey) {
    return "save";
  }
  if (e.key === "o" && e.metaKey) {
    return "open";
  }
  return null;
}
```

To make sure that the code works as expected, you write some unit tests:

```tsx
expect(getKeyboardShortcut({ key: "s", metaKey: true }))
  .toEqual("save");

expect(getKeyboardShortcut({ key: "o", metaKey: true }))
  .toEqual("open");

expect(getKeyboardShortcut({ key: "s", metaKey: false }))
  .toEqual(null);
```

Looks good, but TypeScript complains:

```tsx 
getKeyboardShortcut({ key: "s", metaKey: true });
                    // @error {w=27,shiftLeft=48} Type '{ key: string; metaKey: true; }' is missing the following properties from type 'KeyboardEvent': altKey, charCode, code, ctrlKey, and 37 more.
```

Ugh. Specifying all 37 additional properties would be super noisy, so that's out of the question.

We could resolve this by casting the argument to `KeyboardEvent`:

```tsx
getKeyboardShortcut({ key: "s", metaKey: true } as KeyboardEvent);
```

But that could mask other type errors that may be occuring.

Instead, we can update `getKeyboardShortcut` to declare exactly which properties it requires.

```tsx
interface KeyboardShortcutEvent {
  key: string;
  metaKey: boolean;
}

function getKeyboardShortcut(e: KeyboardShortcutEvent) {}
```

The test code now only needs to satisfy this more minimal interface, which makes it less noisy. Our function is also less coupled to the global `KeyboardEvent` type and can be used in more contexts. It's much more flexible now.

This is possible because of structural typing. A `KeyboardEvent` is assignable to `KeyboardShortcutEvent` because it satisfies its interface, even though `KeyboardEvent` has 37 unrelated properties.

```tsx
window.addEventListener("keydown", (e: KeyboardEvent) => {
  const shortcut = getKeyboardShortcut(e); // This is OK!
  if (shortcut) {
    execShortcut(shortcut);
  }
});
```

This idea is explored in this fantastic post by Evan Martin: [Interfaces generally belong with users](https://neugierig.org/software/blog/2019/11/interface-pattern.html). I highly recommend giving it a read!
