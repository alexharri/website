---
title: "WebGL gradients"
description: ""
image: ""
publishedAt: ""
tags: []
---

Stripe launched a new design for stripe.com back in 2020 which showcased some beautiful, flowing, animated gradients.

<Image src="~/stripe-gradient.png" width={500} plain marginTop={8} />
<SmallNote center label="">Examples of gradients from various [product pages][stripe_product_page] on stripe.com.</SmallNote>

[stripe_product_page]: https://stripe.com/billing

I remember how striking they were when I first saw them. Since then, I've thought about how they might have been created more times than I'd like to admit.

Well, a few weeks ago I rolled up my sleeves and embarked on a journey to produce a flowing gradient effect. Here's what I got:

<WebGLShader fragmentShader="final" skew />

This is created using a WebGL shader and various types of noise functions.

The noise functions produce the flowing waves, smooth color blends, and blur effect. WebGL is used to run all that on the GPU, giving us buttery smooth performance.

In this post, I'll break down how I created this effect. We'll learn about WebGL and fragment shaders, various types of noise. Let's get to it!


## Color function

Our gradient effect will boil down to a function that takes in a pixel coordinate and spits out a value:

```ts
type Coords = { x: number, y: number };

function pixel(coords: Coords): Color;
```

For example, we can create a linear gradient over the X axis by mixing two colors using the <Code.ts>x</Code.ts> coordinate to determine how much to blend the two colors.

```ts
function pixel({ x, y }: Coords): Color {
  const red  = color("#ff0000");
  const blue = color("#0000ff");
  
  const t = x / (canvas.width - 1);
  return mix(red, blue, t);
}
```

When <Code.ts>x == 0</Code.ts>, we get a $t$ value of $0$, which gives us 100% red, but when <Code.ts>x == canvas.width - 1</Code.ts> we get a $t$ value of $1$, which gives us 100% blue. If $t = 0.3$ we'd get 70% red and 30% blue.


At <Code.ts>x</Code.ts> values between those, we get different mixes of red and blue, which gives us a smooth red-to-blue gradient:

<WebGLShader fragmentShader="x_lerp" width={150} height={150} />

We can interpolate along the Y axis as well:

```ts
let color = red;
color = mix(color,  blue, x / (canvas.width - 1));
color = mix(color, white, y / (canvas.height - 1));
```

This gives us a horizontal red-to-blue gradient that fades to white over the Y axis.

<WebGLShader fragmentShader="xy_lerp" width={150} height={150} />

If we want a wave-like gradient, we can use <Code.ts>sin(x)</Code.ts> to produce an oscillating $t$ value:

```ts
function pixel({ x, y }: Coords): Color {
  const red  = color("#ff0000");
  const blue = color("#0000ff");

  let t = sin(x);
  t = (t + 1) / 2; // Normalize 't'
  return mix(red, blue, t);
}
```

<SmallNote>$sin()$ returns a value between $-1$ and $1$ but our mixing function accepts a value from $0$ and $1$. For this reason, we normalize $t$ by remapping $[-1, 1]$ to $[0, 1]$ via $(t + 1) / 2$.</SmallNote>

<WebGLShader fragmentShader="x_sine_lerp" width={150} height={150} fragmentShaderOptions={{ waveLength: Math.PI * 2 }} />

Those waves are quite thin! That's because we're oscillating between red and blue every $\pi$ pixels.

We can control the rate of oscillation by defining a [wave length][wave_len], which determines how many pixels it takes to oscillate from red to blue and red again.

For a wave length of $W$, we can multiply <Code.ts>x</Code.ts> by $\dfrac{1}{W /\,2\pi}$:

[wave_len]: https://en.wikipedia.org/wiki/Wavelength

```ts
const waveLength = 40;
const toLength = 1 / (waveLength / (2 * PI));

function pixel({ x, y }: Coords): Color {
  let t = sin(x * toLength);
  // ...
}
```

This produces a oscillating gradient with the desired wave length:

<WebGLShader fragmentShader="x_sine_lerp" width={150} height={150} fragmentShaderOptions={{ waveLength: 40 }} />


## Motion