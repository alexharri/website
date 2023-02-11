# Post ideas

## When does crossing the WASM boundary become worth it?

What types of workloads benefit from using WASM?

How high do the performance gains in WASM need to be so that passing memory is worth it?

Are there ways to get around passing memory?


## When to use 'as' in TypeScript

When should you use `as X`? How can `as X` be used safely? When should `as const` be preferred?

Is there a better way than `as X`?


## Long term side projects

I spent years on a side project that I eventually abandoned. It paid off. How and why?


## Type errors are good (TypeScript)

```tsx
// What happens if `| "includes"` is added to this type?
type PresenceType = "ends-with" | "starts-with";

function stringPresence(text: string, substr: string, presenceType: PresenceType) {
  if (presenceType === "starts-with") {
    return text.startsWith(substr);
  }
  if (presenceType === "ends-with") {
    return text.endsWith(substr);
  }
}

function countPresences(text: string, substrArr: Array<[string, PresenceType]>) {
  let count = 0;
  
  for (const [substr, precenseType] of substrArr) {
    if (stringPresence(text, substr, precenseType)) {
      count++;
    }
  }

  return count;
}
```

## Transitioning between animations

Given an ongoing animation, how could we seemlessly transition to a different animation?