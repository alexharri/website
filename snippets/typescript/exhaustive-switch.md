---
title: "Exhaustive Switch in TypeScript"
description: "Enforce exhaustive matching at compile- and run-time in TypeScript"
publishedAt: "27-11-2022"
---


## Enforce exhaustive

Use `enforceExhaustive` to enforce exhaustive matching at compile-time and run-time.

```tsx
/**
 * Use to enforce exhaustive matching at compile-time and run-time.
 *
 * ```tsx
 * switch (value) {
 *    case A:
 *      return "a";
 *    case B:
 *      return "b";
 *    default:
 *      enforceExhaustive(value);
 * }
 * ```
 *
 * If there are cases to be matched, the type of `value` will not
 * be assignable to `never` and a type error will be emitted.
 */
export function enforceExhaustive(value: never, message = "Unexpected value"): never {
  throw new Error(`${message} '${value}'`);
}
```


## Check exhaustive

Use `checkExhaustive` to enforce exhaustive matching at compile-time, but not at run-time. This can be useful if matching an enum from a network request.

```tsx
/**
 * Use to enforce exhaustive matching at compile-time, but allow
 * unexpected values at run-time.
 *
 * ```tsx
 * switch (value) {
 *    case A:
 *      return "a";
 *    case B:
 *      return "b";
 *    default: {
 *      enforceExhaustive(value);
 *      return "default";
 *    }
 * }
 * ```
 *
 * If there are cases to be matched, the type of `value` will not
 * be assignable to `never` and a type error will be emitted.
 */
 export function checkExhaustive(value: never): void {}
```
