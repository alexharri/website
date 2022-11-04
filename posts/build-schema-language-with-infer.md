---
title: "Build your own schema language with TypeScript's infer keyword"
alt_title_1: "TypeScript's infer let me create my own language compiled"
alt_title_2: "Pushing the infer keyword to its limits"
alt_title_3: "How I Abused Template Literal Types to create a Schema Language in TypeScript"
description: "TODO"
---

A few years ago when I was learning Go, I learned about "Struct Tags".

```go
type Payload struct {
    Email string `json:"email,omitempty"`
}
```

Struct Tags allow you to attach "meta information" to fields. This can then be read by other parts of your program to modify its behavior.

In other languages that do not have this feature, metadata can be attached to fields by wrapping the field in some type.

```tsx
interface FieldWithMetadata<T> {
  field: T;
  metadata: string;
}
```

It's not as elegant, and requires boilerplate code.

Schema builders need to solve this problem. To create useful schemas you will want to add constraints to fields, such as requiring that an input string is a valid email address. Using Yup, a JavaScript schema builder, you might write code like this:

```tsx
import { object, string } from "yup";

const schema = object({
  email: string().email(),
});
```

This syntax is nice. However, there are some aspects of the syntax that are more verbose than I would like. To describe whether a field is required, we add `.required()`.

```tsx
const schema = object({
  email: string().email().required(),
});
```

To specify a default value, we add `.default()`.

```tsx
const schema = object({
  email: string().email().default("example.com"),
});
```

To describe a list of values, we wrap the type in `array()`.

```tsx
const schema = object({
  emails: array(string().email()).required(),
});
```

This is all fine, but I would love to be able to use a more terse syntax to describe the schema. I want to describe the optionality of a field in the same way as TypeScript does for interfaces:

```tsx
const schema = object({
  email: string().email(),
});
```

Then, let's use the same syntax for default values as in JavaScript destructuring assignments:

```tsx
const schema = object({
  email: string().email() = "example.com",
});
```

Then to top it off, let's add some custom syntax around constraints. I think `<>` looks nice:

```tsx
const schema = object({
  email: string<email> = "example.com",
});
```

I like this, but it won't compile. This is just not valid JavaScript (or TypeScript) syntax.

But why should JavaScript limit what we can and cannot do? CSS-in-JS is a thing, and they use template literals to embed CSS in JavaScript.

```tsx
const Button = styled.button`
  display: inline-block;
  border-radius: 50%;
`;
```

Well, we can do the same thing.

```tsx
const schema = schema(`{
  email?: string <email> = "example.com";
}`);
```

## Don't we lose all type information?

Right now, our schema builder's interface can be described like so.

```tsx
function schema<T extends string>(template: T): Schema<???>;
```

We need to fill in the blanks. We somehow want to take the string template `T` and convert that to the type that it represents.

TypeScript has features that enable us to do that. Let's start off with the basics and build from there.


### Conditional types

Conditional types enable us to model conditional behavior using the extends keyword.

```tsx
type Test<T> = T extends "yes" ? 0 : 1;

type T1 = Test<"yes">; // 0
type T2 = Test<"no">; // 1
```

We can use that to find the primitive behind a given string:

```tsx
type ParsePrimitive<T> = T extends "string"
  ? string
  : T extends "number"
  ? number
  : T extends "boolean"
  ? boolean
  : never;

type T1 = ParsePrimitive<"boolean">; // boolean
```

The repetitive `? : ? :` is unwieldy and unreadble, but it allows us to create a chain of conditionals.


### The `infer` keyword

The `ParsePrimitive` type is useful, but it's insufficient to tackle a more complex string such as `{value:number}`. We can't create an infinite number of cases to match every possible key-value combination.

To convert an object string `T` into a real type we need to

 1. parse that the `T` represents an object,
 2. extract a key from the `T`,
 3. extract the value from the `T`,
 4. parse the value,
 5. create an object with with

TypeScript enables pattern matching for types. The pattern we want to match is:

```
{Key:Value}
```

We can test whether `T` matches this object pattern using [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html).

```tsx
T extends `{${string}:${string}}`
```

With this we can create a conditional type that takes a potential object string `T` as input and returns some type when matches the object pattern:

```tsx
type ParseObject<T> = T extends `{${string}:${string}}`
  ? // What do we do here?
  : never;
```

We can know whether `T` is an object string, but we need access to the key and the value to be able to do anything useful when we match the object pattern.

The `infer` keyword allows us to create variables during pattern matching.

```tsx
type ParseObject<T> = T extends `{${infer K}:${infer V}}`
  ? // We have access to 'K' and 'V' here
  : never;
```

We now have access to `K` and `V` when the pattern is matched. We can use them to create an object type.

```tsx
type ParseObject<T> = T extends `{${infer K}:${infer V}}`
  ? { [key in K]: ParsePrimitive<V> }
  : never;

type T1 = ParseObject<`{value:number}`>; // { value: number }
```

This, on at least a basic level, demonstrates that we can convert strings to real types.

## Objects with multiple properties

The first hurdle we encounter is objects with multiple properties.

```tsx
type T1 = ParseObject<`{a:string;b:number}`>; // never
```

A naive approach would be match create multiple conditionals for each number of properties:

```tsx
type ParseObject<T> = T extends `{${infer K0}:${infer V0}}`
  ? { [key in K0]: ParsePrimitive<V0> }
  : T extends `{${infer K0}:${infer V0};${infer K1}:${infer V1}}`
  ? { [key in K0]: ParsePrimitive<V0> } & { [key in K1]: ParsePrimitive<V1> }
  : T extends `{${infer K0}:${infer V0};${infer K1}:${infer V1}};${infer K2}:${infer V2}}`
  ? { [key in K0]: ParsePrimitive<V0> } & { [key in K1]: ParsePrimitive<V1> } & { [key in K2]: ParsePrimitive<V2> }
  : never;
```

But this is obviously terrible and does not scale. We can instead, divide and conquer.

Given that we have the content of an object string `T` that contains N properties, we can split the content of `T` into N many properties and then parse each one individually.

```tsx
type ParseObject<T> = T extends `{${infer Content}}`
  ? MergeArrayOfObjects<ParseProperties<SplitProperties<Content>>>
  : never;
```

Let's start off with `SplitProperties`.

### Split properties

Given a string `T`:

```tsx
`a:string;b:number;c:boolean`
```

We want the output of `SplitProperties<T>` to be:

```tsx
["a:string", "b:number", "c:boolean"];
```

We can somewhat trivially create a type that splits the string by `;`.

```tsx
type SplitProperties<T> = T extends `${infer A};${infer B}`
  ? [A, B]
  : [T];

type T1 = Equal<
  SplitProperties<`a:string;b:number;c:boolean`>,
  ["a:string", "b:number;c:boolean"],
>;
```

We can recursively split the latter part of the string until we reach the base case of a string that contains no `;`.

```tsx
type SplitProperties<T> = T extends `${infer A};${infer B}`
  ? [A, ...SplitProperties<B>]
  : [T];

type T1 = Equal<
  SplitProperties<`a:string;b:number;c:boolean`>,
  ["a:string", "b:number", "c:boolean"],
>;
```

This is our first example of a recursive type. We're going to be using recursive types __a lot__ so make sure that you have a strong grasp of what is happening here.


### Parsing and merging the list of properties

Once we have the array of strings, we need to parse each element in `SplitProperties<T>` as a property.

```tsx
type ParseProperties<T extends string[]> = {
  [K in keyof T]: ParseProperty<T[K]>;
};
```

We'll implement `ParseProperty` later. For now we'll assume that `ParseProperty<T>` returns an object type that looks like so:

```tsx
{ [key in K]: V };
```

So for our example string, we have an output of:

```tsx
type T1 = Equals<
  ParseProperties<SplitProperties<`a:string;b:number;c:boolean`>>,
  [{ a: string }, { b: number }, { c: boolean }],
>;
```

We can merge an array of objects like so:

```tsx
type MergeArrayOfObjects<T extends unknown[]> = T extends [infer R, ...infer Rest]
  ? R & MergeArrayOfObjects<Rest>
  : {};

type T1 = Equals<
  MergeArrayOfObjects<[{ a: string }, { b: number }, { c: boolean }]>,
  { a: string } & { b: number } & { c: boolean },
>;
```

It may seem overkill to create multiple types to do this. We could have split and parsed the input string in one pass.

```tsx

type ParsePropertyString<T extends string> = T extends `${infer R};${infer Rest}`
  ? ParseProperty<R> & ParsePropertyString<Rest>
  : ParseProperty<T>;

type T1 = Equals<
  ParsePropertyString<`a:string;b:number;c:boolean`>,
  { a: string } & { b: number } & { c: boolean }
>;
```

But shortening the code by merging responsibilities will lead to problem down the line when we start to deal with edge cases. I also believe that the code becomes much more readable and understandable with multiple types:

```tsx
type T1 = MergeArrayOfObjects<ParseProperties<SplitProperties<T>>>;
type T2 = ParsePropertyString<T>;
```

`T1` may be more verbose, but its behavior feels significantly more transparent than `T2`.


## Object properties

A schema language that only supports primitives would produce large flat objects:

```tsx
const schema = schema(`{
  bookName: string;
  bookDescription: string;
  authorName: string;
  authorAge: number;
}`);
```

I would much rather write this as two object properties:

```tsx
const schema = schema(`{
  book: {
    name: string;
    description: string;
  };
  author: {
    name: string;
    age: number;
  };
}`);
```

In supporting object properties, we run into our first edge case.

```tsx
type SplitProperties<T> = T extends `${infer A};${infer B}`
  ? [A, ...SplitProperties<B>]
  : [T];

type T1 = Equal<
  SplitProperties<`a:{b:string;c:number};d:boolean`>,
  ["a:{b:string", "c:number}", "d:boolean"],
>;
```

The pattern matching in `${infer A};${infer B}` is greedy, so it matches the first instance of `;` that it encounters. This splits object properties with multiple sub-properties.

We could try to split by objects before splitting by `;`.

```tsx
type SplitProperties<T> =
  T extends `${infer A}{${infer Content}};${infer B}`
  ? [`${A}{${Content}}`, ...SplitProperties<B>]
  : T extends `${infer A};${infer B}`
  ? [A, ...SplitProperties<B>]
  : [T];

type T1 = Equals<
  SplitProperties<`a:{b:string;c:number};d:boolean`>,
  ["a:{b:string;c:number}", "d:boolean"],
>;
```

And, well, this seems to produce the correct result. However, this is easily broken by introducing one more level of nesting.

```tsx
type T1 = Equals<
  SplitProperties<`a:{b:{c:string};d:number};e:boolean`>,
  ["a:{b:{c:string}", "d:number}", "e:boolean"],
>;
```

This just moves the problem one level down.

Additionally, specifically matching `;` after `{}` is a problem when the object is the last property.

```tsx                                
type SplitProperties<T> =
  T extends `${infer A}{${infer Content}};${infer B}`
  //                                     ^
  ? [`${A}{${Content}}`, ...SplitProperties<B>]
  : // ...;

type T1 = Equals<
  SplitProperties<`a:string;b:{c:number;d:boolean}`>,
  ["a:string", "b:{c:number", "d:boolean}"],
>
```

We need a more robust way to deal with object properties.
