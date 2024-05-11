---
title: "Smoothing motion"
description: ""
publishedAt: ""
---

When building user interfaces, I've often needed to implement dynamically moving elements based on some input values.

These values are not always smooth. They may be jittery, their rate of change can vary, and they can make large instanteneous jumps from one value to another. If your UI instantly changes to reflect the new value, this may cause the UI to feel unstable and rough.

I have four broad cases I want to cover in this post:

 * Following a value.
 * Smoothing out noisy inputs.
 * Making a choice based on a value.
 * Transitioning between states.

All of these will use some form of interpolation. Let's do a refresher.

## Interpolating

When moving an element from one state to another based on a value changing, the most basic implementation is just to set the element to the new position.

Let's define a function called `updatePosition`. It will take two arguments:

 * The current position
 * The target position, which is the position that we eventually want to 

```ts
function updatePosition(last: Vec2, target: Vec2): Vec2 {
  return target;
}
```

This looks like so:

<NoLerp />

No smoothing, no nothing. As soon as you click or drag, the element jumps to the target position.

The most basic way of smoothing is by linearly interpolating between the last and target destination by a certain percentage, e.g. by moving 10% of the way each frame.

Doing that results in the element moving smoothly—though it feels a bit sluggish:

<Lerp10Percent />

Let's take a look at linear interpolation to understand what's happening here.

## Linear interpolation

Linear interpolation, commonly shortened to _"lerp"_, is the simplest way to interpolate between two values.

<Lerp />

The value $t$ is a number between 0 and 1 representing the progress of the interpolation.

 * $t = 0$ represents the start value
 * $t = 1$ represents the end value
 * $t$ values between 0 and 1 represent the in-between values.

Given two numbers $a$ and $b$, we can linearly interpolate between them using a $t$ value between 0 and 1 like so:

<p className="mathblock">$$ a \times (1 - t) + b \times t $$</p>

Put into code, we get:

```tsx
function lerp(a: number, b: number, t: number) {
  return a * (1 - t) + b * t;
}
```


## Lerping on each frame

Consider what effect invoking `lerp` with a $t$ value of 0.1 on each frame has:

```ts
function updatePosition(last: Vec2, target: Vec2): Vec2 {
  // Move 'x' and 'y' 10% of the way to the target position
  const x = lerp(last.x, target.x, 0.1);
  const y = lerp(last.y, target.y, 0.1);

  return new Vec2(x, y);
}
```

On each frame, we move 10% of the way from the last position to the target position.

Sounds simple enough, but moving 10% of the distance on each frame means that the distance is 10% shorter on the next frame, which also means that the element's velocity is reduced by 10% on each frame.

<LerpSteps />

This exponential effect is what causes the element to stop smoothly at the destination, but it has another effect