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


## Color as a function of position

Our gradient effect will boil down to a function that takes in a pixel position and spits out a value:

```ts
type Position = { x: number, y: number };

function pixel({ x, y }: Position): Color;
```

For example, we can create a linear gradient over the X axis by mixing two colors using the value of <Ts>x</Ts> to determine how much to blend the two colors.

```ts
function pixel({ x, y }: Position): Color {
  const red  = color("#ff0000");
  const blue = color("#0000ff");
  
  const t = x / (canvas.width - 1);
  return mix(red, blue, t);
}
```

When <Ts>x == 0</Ts>, we get a $t$ value of $0$, which gives us 100% red, but when <Ts>x == canvas.width - 1</Ts> we get a $t$ value of $1$, which gives us 100% blue. If $t = 0.3$ we'd get 70% red and 30% blue.


At <Ts>x</Ts> values between those, we get different mixes of red and blue, which gives us a smooth red-to-blue gradient:

<WebGLShader fragmentShader="x_lerp" width={150} height={150} />

We can interpolate along the Y axis as well:

```ts
let color = red;
color = mix(color,  blue, x / (canvas.width - 1));
color = mix(color, white, y / (canvas.height - 1));
```

This gives us a horizontal red-to-blue gradient that fades to white over the Y axis.

<WebGLShader fragmentShader="xy_lerp" width={150} height={150} />

If we want a wave-like gradient, we can use <Ts>sin(x)</Ts> to produce an oscillating $t$ value:

```ts
function pixel({ x, y }: Position): Color {
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

For a wave length of $L$, we can multiply <Ts>x</Ts> by $\dfrac{1}{L}2\pi$:

[wave_len]: https://en.wikipedia.org/wiki/Wavelength

```ts
const WAVE_LEN = 40;
const toWaveLength = (1 / WAVE_LEN) * (2 * PI);

function pixel({ x, y }: Position): Color {
  let t = sin(x * toWaveLength);
  // ...
}
```

This produces a oscillating gradient with the desired wave length:

<WebGLShader fragmentShader="x_sine_lerp" width={150} height={150} fragmentShaderOptions={{ waveLength: 40 }} />


### Adding motion

So far we've just been producing static images. To introduce motion, we'll update our color function to take in a <Ts>time</Ts> value as well.

```ts
function pixel({ x, y }: Position, time: number): Color;
```

We'll define <Ts>time</Ts> as the "elapsed" time, measured in seconds, and add it to the value passed to the <Ts method>sin</Ts> function. That will makes the wave shift over time.

```ts
let t = sin(x * toWaveLength + time * PI);
                               // @info {w=9} Adding 'time * PI' to the value passed to 'sin' makes the wave move by half a wave length per second.
```

Here's the result:

<WebGLShader fragmentShader="x_sine_lerp_time" width={150} height={150} fragmentShaderOptions={{ waveLength: 40 }} />

These two variables, position and time, will be the main components that drive our animation.

We'll create a single color function that will, on every frame, and for every pixel, calculate a color for the current time and pixel position. The colors returned for each pixel will be used to create a single frame of our animation.

<WebGLShader fragmentShader="final" width={1000} height={250} />

But consider the amount of work that needs to be done. A $1{,}000 \times 250$ canvas -- like the one above -- constitutes $250{,}000$ pixels. That's $250{,}000$ invocations of our pixel function on every frame -- a lot of work for a single threaded CPU to perform 60 times a second!

That's where WebGL and shaders come in -- they allow us to run our color function in parallel on the GPU.

Conceptually, nothing changes. We're still going to be writing a single color function that takes a position and time value and returns a color. But instead of writing it in JavaScript and running it on the CPU, we'll write it in GLSL and run it on the GPU.


## WebGL and GLSL

WebGL can be thought of as a subset of [OpenGL][opengl], a cross-platform API for rendering graphics. WebGL is based on [OpenGL ES][opengl_es] -- an OpenGL spec for embedded systems (like mobile devices).

<SmallNote label="">Here's a page listing [differences between OpenGL and WebGL][opengl_vs_webgl]. We won't encounter those differences in this post, so I won't dwell on them.</SmallNote>

GLSL stands for [OpenGL Shading Language][glsl] and it's the language we'll write our color function in. GLSL is strongly typed and has a C-like syntax.

[opengl]: https://en.wikipedia.org/wiki/OpenGL
[opengl_es]: https://en.wikipedia.org/wiki/OpenGL_ES
[opengl_vs_webgl]: https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences
[glsl]: https://en.wikipedia.org/wiki/OpenGL_Shading_Language

There are two types of shaders, vertex shaders and fragment shaders, which serve different purposes. Our color function will run in the fragment shader -- sometimes referred to as a "pixel shader" -- so that's where we'll spend our time.

I'll mostly abstract the WebGL boilerplate away so that we can stay focused on our main goal, which is creating cool gradients. At the end of the post I'll link to the resource that helped me set up the WebGL plumbing.


## Writing a fragment shader

To get us acquainted with writing fragment shaders, let's walk through how to create the following wave:

<WebGLShader fragmentShader="wave_animated" height={150} width={400} />

To get started, here's a WebGL fragment shader that sets every pixel to the same color.

```glsl
void main() {
  vec4 color = vec4(0.7, 0.1, 0.4, 1.0);
  gl_FragColor = color;
}
```

WebGL fragment shaders must define a <Gl method>main</Gl> function, and that <Gl method>main</Gl> function is invoked once for each pixel. The <Gl method>main</Gl> function must set the value of <Gl>gl_FragColor</Gl> -- a special variable that determines the color of the pixel.

In other words: <Gl method>main</Gl> is our color function and <Gl>gl_FragColor</Gl> is the output of that function.

WebGL colors are stored as vectors with 3 or 4 components (<Gl>vec3</Gl> or <Gl>vec4</Gl>) with values between 0 and 1, where the first three components are the [RGB][rgb] components. For 4D vectors, the fourth component is the [alpha][alpha] value -- 1 for fully opaque, 0 for transparent.

[rgb]: https://en.wikipedia.org/wiki/RGB_color_model
[alpha]: https://en.wikipedia.org/wiki/Alpha_compositing

If we run the shader, we see that every pixel is set to the color we specified:

<WebGLShader fragmentShader="single_color" height={150} width={150} />

<SmallNote label="" center>The color <Gl>vec3(0.7, 0.1, 0.4)</Gl> roughly translates to `rgba(178, 25, 102)` in CSS -- or `#b21966` in hex.</SmallNote>

Let's create a linear gradient that fades to another color, such as `#e59919`, which corresponds to <Gl>vec3(0.9, 0.6, 0.1)</Gl> (I've been using [this tool][glsl_to_hex] to convert from hex to GLSL colors, and vice versa).

[glsl_to_hex]: https://airtightinteractive.com/util/hex-to-glsl/

```glsl
vec3 color_1 = vec3(0.7, 0.1, 0.4);
vec3 color_2 = vec3(0.9, 0.6, 0.1);
```

<SmallNote label="">We're storing the colors without the alpha value by using <Gl>vec3</Gl> instead of <Gl>vec4</Gl>.</SmallNote>

To gradually transition from <Gl>color_1</Gl> to <Gl>color_2</Gl> over the Y axis, we'll need the Y position of the current pixel. In WebGL fragment shaders, we get that via a special input variable called [<Gl>gl_FragCoord</Gl>][frag_coord]:

[frag_coord]: https://registry.khronos.org/OpenGL-Refpages/gl4/html/gl_FragCoord.xhtml

```glsl
float y = gl_FragCoord.y;
```
<SmallNote label="">In GLSL we need to specify the number type. We'll only use <Gl>float</Gl> and <Gl>int</Gl> in this post, which both use 32 bits. See [GLSL data types][glsl_data_types].</SmallNote>

[glsl_data_types]: https://www.khronos.org/opengl/wiki/Data_Type_(GLSL)

We can then calculate a blend value -- which we'll call $t$ -- by dividing the <Gl>y</Gl> coord by the canvas height.

<SmallNote>I've configured the coordinates such that <Gl>gl_FragCoord</Gl> is <Gl>(0.0, 0.0)</Gl> at the lower-left corner and <Gl>(CANVAS_WIDTH, CANVAS_HEIGHT)</Gl> at the upper right corner. We'll go into detail on this later on.</SmallNote>

```glsl
// We'll learn how to make the canvas width dynamic later
const float CANVAS_WIDTH = 150.0;

float y = gl_FragCoord.y;
float t = y / (CANVAS_WIDTH - 1.0);
```

<SmallNote label="">In GLSL, a number literal with a fraction (e.g. <Gl>4.0</Gl>) is a float while a number literal without one (e.g. <Gl>4</Gl>) is an integer.</SmallNote>

We can then mix the two colors via the built-in [<Gl method>mix</Gl> function][mix] -- it takes in two colors and a blend value between 0 and 1.

[mix]: https://registry.khronos.org/OpenGL-Refpages/gl4/html/mix.xhtml

```glsl
vec3 color = mix(color_1, color_2, t);
```

<SmallNote label="">GLSL has a bunch of [built-in math functions][built_in] such as <Gl method>sin</Gl>, <Gl method>clamp</Gl>, and <Gl method>pow</Gl>.</SmallNote>

[built_in]: https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf

We can then assign our newly calculated <Gl>color</Gl> to <Gl>gl_FragColor</Gl>:

```glsl
vec3 color = mix(color_1, color_2, t);
gl_FragColor = color;
```

But wait -- we get an error.

<blockquote className="monospace">ERROR: 'assign' : cannot convert from '3-component vector of float' to 'FragColor 4-component vector of float'</blockquote>

This error is a bit obtuse, but it's telling us that we can't assign our <Gl>vec3 color</Gl> to <Gl>gl_FragColor</Gl> because it's of type <Gl>vec4</Gl>. In other words, we need to add an alpha channel to <Gl>color</Gl>. We can do that like so:

```glsl
vec3 color = mix(color_1, color_2, t);
gl_FragColor = vec4(color, 1.0);
```

This gives us a linear gradient!

<WebGLShader fragmentShader="linear_gradient" height={150} width={150} />

### Vector constructors

I want to briefly mention how awesome the vector constructor syntax in GLSL is. When passing a vector to a vector [constructor][vector_constructors], the components of the passed vector are read left-to-right -- similar to JavaScript's [spread][spread] syntax.

[spread]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax

```glsl
vec3 a;

// this:
vec4 foo = vec4(a.x, a.y, a.z, 1.0);

// is equivalent to this:
vec4 foo = vec4(a, 1.0);
```

[vector_constructors]: https://www.khronos.org/opengl/wiki/Data_Type_(GLSL)#Vector_constructors

You can pass scalars alongside vectors in any way you see fit, as long as the number of values passed to the vectors is correct:

```glsl
vec4(1.0 vec2(2.0, 3.0), 4.0); // OK

vec4(vec2(1.0, 2.0), vec2(3.0, 4.0)); // OK

vec4(vec2(1.0, 2.0), 3.0); // Error, not enough components
```

I love this syntax! Anyway, back to our shader.


### Coloring the area under a curve

Let's start by coloring the area under a curve white. For now, the curve will be a simple line, with the result looking like so:

<WebGLShader fragmentShader="linear_gradient_area_under_line" height={150} width={150} showControls={false} />

We'll adjust the curve to be an animated sine wave after.

First, let's calculate the Y position of the curve at the current pixel's X position:

```glsl
const float Y_START = CANVAS_HEIGHT * 0.4; // Start at 40%
const float INCLINE = 0.2; // Climb 0.2px every 1px

float x = gl_FragCoord.x;

// Curve Y at current X position
float curve_y = Y_START + (x * INCLINE);
```

We can then determine the pixel's [signed][signed_distance] distance from the curve through subtraction:

[signed_distance]: https://en.wikipedia.org/wiki/Signed_distance_function

```glsl
float dist_signed = curve_y - y;
```

What we care about is whether our pixel is above or below the curve, which we can determine by reading the sign of the distance via the <Gl method>sign</Gl> function, which returns $-1.0$ if the distance is negative, or $1.0$ if the distance is positive.

```glsl
float dist_signed = curve_y - y;
float dist_sign = sign(dist_signed); // -1.0 or 1.0
```

We can use the sign to calculate an alpha (blend) by normalizing the sign to $0.0$ or $1.0$, which we can do via $(dist\_sign + 1)\,/\,2$ since:

<p className="mathblock">$$\begin{align}
(-1 + 1)\,/\,2 = 0&\\
(1 + 1)\,/\,2 = 1&\\
\end{align}$$</p>



```glsl
float alpha = (dist_sign + 1.0) / 2.0;
```

So, for every pixel, <Gl>alpha</Gl> will be either set to $0.0$ or $1.0$. If <Gl>alpha == 1.0</Gl> we want to color the pixel white, but if <Gl>alpha == 0.0</Gl> we want the pixel to retain the color from the linear gradient.

We can do that with the <Gl method>mix</Gl> function:

```glsl
color = mix(color, white, alpha);
```

This colors the area under the curve white:

<WebGLShader fragmentShader="linear_gradient_area_under_line" height={150} width={150} showControls={false} />

Currently the incline is set to $0.2$. Here's a canvas where you can configure the amount of inline from $-1$ to $1$:

<WebGLShader fragmentShader="linear_gradient_area_under_line" height={150} width={150} />

### Why branchless?

Calculating an alpha value by normalizing the sign and passing that to the <Gl method>mix</Gl> function may seem overly roundabout. Couldn't you just use an if statement?

```glsl
if (sign(dist_signed) == 1.0) {
  color = white;
}
```

That works, but you generally want to avoid branching in code that runs on the GPU. There are [nuances][branch_nuances] to the performance of branches in shader code, but branchless code is usually preferable.

[branch_nuances]: http://www.gamedev.net/forums/topic/712557-is-branching-logic-in-shaders-really-still-a-problem/5448827/

In our case, calculating the <Gl>alpha</Gl> and running the <Gl method>mix</Gl> function boils down to sequential math instructions, which GPUs excel at.


### Converting the curve to a wave

Currently, we're calculating the Y of our curve like so, producing a slanted line:

```glsl
float curve_y = Y_START + (x * INCLINE);
```

To instead produce a sine wave-shaped curve, we can define the curve as:

<p className="mathblock">$$Y + A \times sin(x \times L')$$</p>

where $x$ is the current pixel's X position, $A$ is the [amplitude][amplitude] of the wave, $Y$ is the _vertical position_ of the wave (the Y position of the wave's center), and $L'$ is the "wave length multiplier", defined as

[amplitude]: https://www.mathsisfun.com/algebra/amplitude-period-frequency-phase-shift.html

<p className="mathblock">$$L' = \dfrac{1}{L}2\pi $$</p>

where $L$ is the wave length in pixels.

Putting this into code, we get:

```glsl
const float WAVE_Y = 0.5;
const float WAVE_AMP = 15.0;
const float WAVE_LEN = 75.0;

const float toWaveLength = (1.0 / WAVE_LEN) * 2.0 * PI;

float y_base = CANVAS_HEIGHT * WAVE_Y;
float curve_y = y_base + sin(x * toWaveLength) * WAVE_AMP;
```

Which produces a sine wave:

<WebGLShader fragmentShader="linear_gradient_area_under_wave" height={150} width={150} showControls={false} />

Here's a canvas that makes the $Y$, $A$ and $L$ components configurable:

<WebGLShader fragmentShader="linear_gradient_area_under_wave" height={150} width={150} />


### Applying a gradient to the wave

Instead of the wave being a flat white color, let's make it a gradient.

The background is current composed of two colors: <Gl>color_1</Gl> and <Gl>color_2</Gl>. Let's rename those to <Gl>bg_color_1</Gl> and <Gl>bg_color_2</Gl>:

```glsl
vec3 bg_color_1 = vec3(0.7, 0.1, 0.4);
vec3 bg_color_2 = vec3(0.9, 0.6, 0.1);
```

Let's then introduce two new colors for the foreground: <Gl>fg_color_1</Gl> and <Gl>fg_color_2</Gl>. Those will be used to create a linear gradient we will apply to the wave.

```glsl
vec3 fg_color_1 = vec3(1.0, 0.7, 0.5);
vec3 fg_color_2 = vec3(1.0, 1.0, 0.9);
```

We can calculate both the background color and foreground color for the current pixel using the same $t$ value (calculated via the pixel's Y position):

```glsl
float t = y / (CANVAS_HEIGHT - 1.0);

vec3 bg_color = mix(bg_color_1, bg_color_2, t);
vec3 fg_color = mix(fg_color_1, fg_color_2, t);
```

Let's also rename the <Gl>alpha</Gl> value to <Gl>fg_alpha</Gl> since it's the alpha value of the foreground.

```glsl
float fg_alpha = (dist_sign + 1.0) / 2.0;
```

With the background color, foreground color, and foreground alpha calculated, we can calculate the final color via the <Gl method>mix</Gl> function -- assigning the result to <Gl>gl_FragColor</Gl>:

```glsl
float fg_alpha = (dist_sign + 1.0) / 2.0;

vec3 color = mix(bg_color, fg_color, fg_alpha);
gl_FragColor = vec4(color, 1.0);
```

<WebGLShader fragmentShader="linear_gradient_area_under_wave_2" height={150} width={150} />


#### Alpha compositing

What we just did -- combining two images using an alpha mask -- is a form of [alpha compositing][alpha_compositing].

[alpha_compositing]: https://ciechanow.ski/alpha-compositing/

<Image src="~/alpha-compositing.svg" plain />

In calculating our two color values and an alpha value, we produced three assets:

 * For each pixel, we calculated both a foreground color and a background color. Together, those pixels form two images -- our foreground and background gradients.
 * The alpha values we calculated for each pixel constitute our alpha mask. Each pixel in an alpha mask has a value from $0$ to $1$, denoting how transparent or opaque that pixel is.

We then combined those three assets into a final image using the <Gl method>mix</Gl> function.

Even though the compositing was done with a single <Gl method>mix</Gl> invocation, I like to think of this as two operations. First, we applied the alpha mask to our foreground image.

<Image src="~/alpha-compositing-alpha-mask.svg" plain />

Secondly, we layered the masked foreground onto the background, giving us our final image:

<Image src="~/alpha-compositing-final.svg" plain />


### Animating the wave

For the shader to produce motion, we'll need to provide the shader with a time variable. We can do that using [uniforms][uniform].

[uniform]: https://www.khronos.org/opengl/wiki/Uniform_(GLSL)

```glsl
uniform float time; // Time in seconds
```

Uniforms can be thought of as global variables that the shader has read-only access to. The values of the uniforms are set by the user prior to rendering, and the values are read by the shader during rendering.

You can think of uniforms as per-frame constants. For any given draw call, each shader invocation will have the uniforms set to the same values.

<SmallNote label="">Using the term "per-frame" is shaky. Multiple draw calls may be made when rendering a "frame". In this post, however, each frame is always the result of a single draw call.</SmallNote>

Uniform variables can be of many types, such floats, vectors and textures (we'll discuss textures later). They can also be of custom struct types:

```glsl
struct Foo {
  vec3 position;
  vec3 color;
}

uniform Foo foo;
```

Anyway, with <Gl>time</Gl> now accessible in our shader as a uniform we can start animating the wave. As a refresher, we're currently calculating our curve's Y value like so:

```glsl
float curve_y = WAVE_CENTER + sin(x * toWaveLength) * WAVE_AMPLITUDE;
```

This is getting a bit long, so let's extract the input to <Gl method>sin</Gl> into a variable called <Gl>sine_input</Gl>.

```glsl
float sine_input = x * toWaveLength;
float curve_y = WAVE_CENTER + sin(sine_input) * WAVE_AMPLITUDE;
```

Now let's add <Gl>time * PI</Gl> to the sine input:

```glsl
float sine_input = x * toWaveLength + time * PI;
```

<WebGLShader fragmentShader="wave_animated_slow" height={150} width={150} />

Adding <Gl>time * PI</Gl> shifts the phase of the wave by half a wavelength per second. To instead shift the wave by a full wavelength per second, we'd multiply <Gl>time</Gl> by $2\pi$.

However, instead of thinking in "wavelengths per second", I'd like to be able to specify a number of pixels that the wave will move per second -- let $S$ be the pixels to move per second.

Since $2\pi$ moves the wave by one wavelength per second, we can multiply $2\pi$ by the proportion of the wave's speed $S$ and wave's length $L$:

<p className="mathblock">$time \times 2\pi\dfrac{S}{L}$</p>

which will cause the wave to move by $S$ pixels per second.

Let's define a constant, <Gl>WAVE_SPEED</Gl>, for the wave's speed, $S$:

```glsl
const float WAVE_LEN = 75.0; // Length in pixels
const float WAVE_SPEED = 20.0; // Pixels per seconds
```

Putting our equation into code, we get:

```glsl
const float toWaveLength = (1.0 / WAVE_LEN) * 2.0 * PI;
const float toPhase = (WAVE_SPEED / WAVE_LEN) * 2.0 * PI;

float wave_fac = sin(x * toWaveLength + time * toPhase);
```

We now have a constant that we can use to control the speed of the wave:

<WebGLShader fragmentShader="wave_animated" height={150} width={150} />

## Adding blur

Take another look at the final animation and consider the role that blur plays. The waves in the animation slowly fluctuate between a blurry and a sharp state, providing contrast and visual interest.

<WebGLShader fragmentShader="final" width={1000} height={250} />

The blur isn't applied uniformly. The wave slowly transitions from being fully blurred to being only partially blurred -- or not blurred at all.

To simulate this effect, we'll need to be able to apply variable amounts of blur. As a step towards that, let's apply a gradually increasing blur across the horizontal axis, from left to right.

<WebGLShader fragmentShader="wave_animated_blur_left_to_right" height={150} width={250} />

### Gaussian blur

When thinking about how I'd approach the blur problem, my first thought was to use a [gaussian blur][gaussian_blur]. I figured I'd determine the amount of blur to apply via a [noise function][perlin_noise] and then sampling neighboring pixels according to the blur amount.

[gaussian_blur]: https://en.wikipedia.org/wiki/Gaussian_blur
[perlin_noise]: https://en.wikipedia.org/wiki/Perlin_noise

That's a valid approach -- progressive blur in WebGL is certainly [feasible][progressive_blur]. However, this approach turned out to be expensive in terms of both performance and complexity. 

[progressive_blur]: https://tympanus.net/Tutorials/WebGLProgressiveBlur/

First off, in order to get a decent blur you need to sample lots of neighboring pixels, and the amount of pixels to sample only increases as the blur radius gets larger (our effect requires a very large blur). This becomes very expensive, very quickly.

Secondly, for us to be able to sample neighboring pixels we'd need to calculate their values up front. To do that we'd pre-render the alpha channel [into a texture][render_to_a_texture] for us to sample, which would require setting up another shader and complicating our pipeline.

[render_to_a_texture]: https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html

I opted to take a different approach that doesn't require sampling neighboring pixels. Let's take a look.


### Calculate blur using signed distance


Let's look at how we're calculating the <Gl>fg_alpha</Gl> again:

```glsl
float dist_signed = curve_y - y;
float dist_sign = sign(dist_signed);

float fg_alpha = (dist_sign + 1.0) / 2.0;
```

By taking the sign of our distance, we always get 0% or 100% opacity -- either fully transparent or opaque. Instead, let's make the alpha gradually increase from $0$ to $1$ over a given amount of pixels, e.g. 50px. Let's define a constant for that.

```glsl
const float BLUR_AMOUNT = 50.0;
```

We'll change the calculation for <Gl>fg_alpha</Gl> to start at $0.0$ and then add <Gl>dist_signed / BLUR_AMOUNT</Gl>.

```glsl
float fg_alpha = 0.0 + dist_signed / BLUR_AMOUNT;
```

When <Gl>dist_signed == 0.0</Gl>, the alpha will be $0.0$, and as <Gl>dist_signed</Gl> approaches <Gl>BLUR_AMOUNT</Gl> the alpha approaches $1.0$. However, when <Gl>dist_signed</Gl> exceeds <Gl>BLUR_AMOUNT</Gl> the alpha will go over $1.0$. The alpha can also become negative when <Gl>dist_signed</Gl> is negative. Neither of those are desirable -- alpha values should only range from $0$ to $1$ -- so let's clamp <Gl>fg_alpha</Gl> to the range $[0.0, 1.0]$ using the built-in <Gl method>clamp</Gl> function:

```glsl
fg_alpha = clamp(fg_alpha, 0.0, 1.0);
```

This produces a blur effect, though you might notice that the wave shifts down as the blur increases -- try varying the amount of blur using the slider.

<WebGLShader fragmentShader="wave_animated_blur_down_even" height={150} width={250} />

Let's put that aside for the time being and make the blur gradually increasing from left to right. To do that, we can calculate a $t$ value for the blur by taking <Gl>gl_FragCoord.x / (CANVAS_WIDTH - 1)</Gl>:

```glsl
float blur_t = gl_FragCoord.x / (CANVAS_WIDTH - 1);
```

We'll then calculate the blur amount by [linearly interpolating][lerp] (lerping) between <Gl>1.0</Gl> and <Gl>BLUR_AMOUNT</Gl> using the $t$ value and the <Gl method>mix</Gl> function:

[lerp]: https://en.wikipedia.org/wiki/Linear_interpolation

```glsl
float blur_amount = mix(1.0, BLUR_AMOUNT, blur_t);
```

By using <Gl>blur_amount</Gl> to calculate the alpha, we get a gradually increasing blur:

```glsl
float fg_alpha = dist_signed / blur_amount;
fg_alpha = clamp(fg_alpha, 0.0, 1.0);
```

<WebGLShader fragmentShader="wave_animated_blur_down" height={150} width={250} />

Let's now fix how the wave shifts down as <Gl>blur_amount</Gl> increases.

Consider why the down-shift occurs. For pixels where <Gl>{"dist_signed <= 0"}</Gl> the alpha is $0$ regardless of the value of <Gl>blur_amount</Gl>, thus the top of the wave stays fixed. At the same time, the alpha is $1$ for all pixels where <Gl>{"dist_signed >= blur_amount"}</Gl>, which shifts the "bottom" of the wave down as the blur increases.

What we want is for the alpha to be $0.5$ when <Gl>{"dist_signed == 0"}</Gl>, which we can do by starting <Gl>fg_alpha</Gl> at $0.5$:

```glsl
float fg_alpha = 0.5 + dist_signed / blur_amount;
fg_alpha = clamp(fg_alpha, 0.0, 1.0);
```

This shifts the "top" and "bottom" of the wave up and down equally as the amount of blur increases:

<WebGLShader fragmentShader="wave_animated_blur_left_to_right" height={150} width={250} />


## Creating a natural wave

If you look at the final gradient, you'll see that the waves look a lot more natural than the sine waves we've been working with so far. I'll disable the blur so that you can see the waves better.

<WebGLShader fragmentShader="final" height={250} fragmentShaderOptions={{ blurAmount: 10 }} skew />

There's loads of ways that you could go about creating such a wave, but I'll show you the two.


### Stacked sine waves

I often reach for stacked sine waves when I need a simple and natural wave-like noise function. Here's an example:

<WebGLShader fragmentShader="sine_stack_final" width={800} height={200} />

The idea is to sum the output of multiple sine waves with different wave lengths, amplitudes, and phase speeds.

<p align="center">Take the following sine waves:</p>

<WebGLShader fragmentShader="sine_stack_decomposed" width={600} height={250} />

<p align="center" style={{ marginBottom: -40 }}>If you sum their output, you get a fairly interesting final wave:</p>

<WebGLShader fragmentShader="sine_stack_composed" width={600} height={170} />

<p style={{ marginTop: -24 }}>Each individual wave is a pure sine wave whose input components -- an $x$ position and a time value -- have been scaled differently. An individual wave's equation can be described as</p>

<p className="mathblock">$$\sin(x \times L + \text{time} \times S) \times A$$</p>

where the $L$, $S$ and $A$ components are scalars controling different aspects of the wave:

 * $L$ determines the wave length,
 * $S$ determines the phase evolution speed, and
 * $A$ determines the amplitude of the wave.

The final wave can be described as the sum of $N$ such waves:

<p className="mathblock">$$\begin{align}
\sum_{n=1}^{N}\ \sin(x \times L_n + \text{time} \times S_n) \times A_n\\
\end{align}$$</p>

Which put in code looks like so:

```glsl
float sum = 0.0;
sum += sin(x * L1 + time * S1) * A1;
sum += sin(x * L2 + time * S2) * A2;
sum += sin(x * L3 + time * S3) * A3;
...
return sum;
```

The problem is finding $L$, $S$, $A$ scalars for each individual sine wave that, when stacked, produce a nice looking final wave.

In finding those values, I first create a "baseline wave" with the $L$, $S$, $A$ components set to a value that feels right.

```glsl
const float L = 0.011;
const float S = 0.28;
const float A = 32.0;

float sum = 0.0;
sum += sin(x * L + time * S) * A;
```

These constants produce the following wave. The length, speed and amplitude feel along the lines of what I want the final wave to look like.

<WebGLShader fragmentShader="sine_stack_0" width={800} height={200} />

I then add more sine waves that use the baseline $L$, $S$, $A$ components, scaled by some constants. After some trial and error, I ended up with the following:

```glsl
float sum = 0.0;
sum += sin(x * (L / 1.000) + time * 0.90 * S) * A * 0.64;
sum += sin(x * (L / 1.153) + time * 1.15 * S) * A * 0.40;
sum += sin(x * (L / 1.622) + time * 0.75 * S) * A * 0.48;
sum += sin(x * (L / 1.871) + time * 0.65 * S) * A * 0.43;
sum += sin(x * (L / 2.013) + time * 1.05 * S) * A * 0.32;
```

<SmallNote label="">The "unevenness" of the wavelength and phase speed scalars ($L$ and $S$) is intentional. The idea is to make it unlikely for the waves to converge at the same time because that would result in excessive amounts of [constructive and destructive interference][interference].</SmallNote>

[interference]: https://en.wikipedia.org/wiki/Wave_interference

These five sine waves give us quite a fairly natural looking final wave:

<WebGLShader fragmentShader="sine_stack_2" width={800} height={200} />

But there's one aspect that I don't like: the wave feels like it's moving left at a fairly even speed. That's not surprising considering that each individual wave is moving left at a constant rate.

We can counteract that by making the phase evolution of some waves negative:

```glsl
float sum = 0.0;
sum += sin(x * (L / 1.000) + time *  0.90 * S) * A * 0.64;
sum += sin(x * (L / 1.153) + time *  1.15 * S) * A * 0.40;
sum += sin(x * (L / 1.622) + time * -0.75 * S) * A * 0.48;
sum += sin(x * (L / 1.871) + time *  0.65 * S) * A * 0.43;
sum += sin(x * (L / 2.013) + time * -1.05 * S) * A * 0.32;
```

Looking at the wave now, it fluctuates between flowing to the left or right with periods of relative stillness.

<WebGLShader fragmentShader="sine_stack_3" width={800} height={200} />

Because all of the sine waves are relative to $L$, $S$, $A$ we can tune the waves as a whole by adjusting those constants. Increase $S$ to make the wave faster, $L$ to make the waves shorter, and $A$ to make the waves taller.

<WebGLShader fragmentShader="sine_stack_3_LSA" width={800} height={200} />


### Tide

The wave is looking good, but it stays relatively still on the vertical axis. I want to make it more dynamic by adding periods of high and low tide. We can do that by adding a few more sine invocations with the $L$ component removed:

```glsl
float sum = 0.0;
// ...

sum += sin(time *  0.46 * S) * A * 0.64;
sum += sin(time * -0.68 * S) * A * 0.48;
sum += sin(time *  0.59 * S) * A * 0.72;
```

Removing the $L$ component makes the waves flat. They still fluctuate, but they do so uniformly over the width of the canvas. Here's the result of only including these waves:

<WebGLShader fragmentShader="sine_stack_4" width={800} height={200} />

Here's the final wave with the tide component added:

<WebGLShader fragmentShader="sine_stack_final" width={800} height={200} />

It's a pretty good wave -- definitely passable for our purposes. But we can create a better, more natural wave using simplex noise.


### Simplex noise

[Simplex noise][simplex_noise] is a family of $n$-dimensional noise functions designed by [Ken Perlin][ken_perlin], the inventor of "classic" [perlin noise][perlin_noise]. Simplex noise was designed to address some of the [drawbacks][perlin_drawbacks] of perlin noise.

[simplex_noise]: https://en.wikipedia.org/wiki/Simplex_noise
[perlin_noise]: https://en.wikipedia.org/wiki/Perlin_noise
[ken_perlin]: https://en.wikipedia.org/wiki/Ken_Perlin
[perlin_drawbacks]: https://noiseposti.ng/posts/2022-01-16-The-Perlin-Problem-Moving-Past-Square-Noise.html

For our wave we'll use 2D simplex noise -- 2D meaning that the noise function takes two (numeric) arguments. Simplex noise functions return a single numeric value between $1$ and $-1$, so the 2D function's signature could be written as:

```glsl
float simplex_noise(float x, float y);
```

You've probably seen textures like this:

[generate_terrain]: https://www.redblobgames.com/maps/terrain-from-noise/

<WebGLShader
  fragmentShader="simplex_noise"
  width={400}
  height={250}
  fragmentShaderOptions={{ xScale: 0.02, yScale: 0.02 }}
  animate={false}
/>

These sorts of textures can be generated using simplex or perlin noise. They can be used, for example, as a height map used to [generate terrain][generate_terrain] in video games.

The texture above is generated by calculating the lightness of each pixel using the output of the simplex noise function for the pixel's $(x, y)$ position.

```glsl
float x = gl_FragCoord.x;
float y = gl_FragCoord.y;

float lightness = (simplex_noise(x, y) + 1.0) / 2.0;
vec3 color = vec3(lightness);
gl_FragColor = vec4(color, 1.0);
```

Interpreting the output of a 2D gradient noise function as a third coordinate gives us a point in 3D space. That idea allows us to create smooth, but noisy, 3D surfaces. Take this array of points:

<Scene autoRotate scene="simplex-point-array" height={350} />

The points are arranged in a grid configuration on the $x$ and $z$ axes. The $y$ position of each point is the output of <Gl>simplex_noise(x, z)</Gl>:

```ts
for (const point of points) {
  const { x, z } = point.position;
  point.position.y = simplex_noise(x, z);
}
```

But how does all of this relate to generating an animated wave?

Consider what happens if we use $\text{time}$ as the $z$ position. As $\text{time}$ passes, the $z$ position moves forward, giving us 1D slices of the surface across the $x$ axis. Here's a visualization:

<Scene autoRotate scene="simplex" height={480} angle={-18} xRotation={154} />

<SmallNote label="" center>TODO: Fix negative angle</SmallNote>

Using $\text{time}$ as the $z$ position effectively gives us a cross section of the surface that's moving over the $z$ axis.

Putting this in code for our 2D canvas is quite simple:

```glsl
uniform float time;
float x = gl_FragCoord.x;

float curve_y = Y_START + simplex_noise(x, time) * WAVE_HEIGHT;
```

Which gives us an animated wave:

<WebGLShader fragmentShader="simplex_wave" width={800} height={200} />

<SmallNote label="" center>Just a single simplex noise function call already produces a very natural-looking wave.</SmallNote>

I've been simplifying things a bit by omitting the scalars I've been using. Like before, there are three scalars that determine the characteristics of our wave: $L$ determines the wave length, $S$ determines the evolution speed, and $A$ determines the amplitude of the wave.

We scale $x$ by $L$ to make the wave shorter or longer on the horizontal axis

<p className="mathblock">$$\text{simplex}(x \times L,\ \text{time})$$</p>

and scale $\text{time}$ by $S$ to speed up or slow down the evolution of our wave -- the speed at which our figurative cross section moves across the $z$ axis:

<p className="mathblock">$$\text{simplex}(x \times L,\ \text{time} \times S)$$</p>

Lastly, we scale the output of the $\text{simplex}$ function by $A$, which determines the amplitude of our wave.

<p className="mathblock">$$\text{simplex}(x \times L,\ \text{time} \times S) \times A$$</p>

As mentioned before, simplex noise returns a value from $1$ and $-1$. So to make a wave with a height of $96$, you'd scale the output of the $\text{simplex}$ function by $48$.

As mentioned before, simplex noise returns a value from $1$ and $-1$. So to make a wave with a height of $96$, you'd make the amplitude $A$ equal $48$:

```glsl
const float L = 0.0015;
const float S = 0.12;
const float A = 48.0;

simplex_noise(x * L, time * S) * A;
```

Anyway, let's create a nice looking simplex wave! As before, I'll start by finding constants that create a "baseline" wave that I like:

```glsl
const float L = 0.0018;
const float S = 0.04;
const float A = 48.0;

float sum = 0.0;
sum += simplex_noise(x * (L / 1.00), time * S * 1.00) * A * 1.00;
```

These produce the following wave:

<WebGLShader fragmentShader="simplex_stack_0" width={800} height={200} />

A single simplex wave looks too simple -- the peaks and valleys look too evenly spaced and predictable. Like sine waves, we can stack simplex waves to get a more natural looking final wave.

I added a few increasingly large waves with various speeds and amplitudes. Here's what I ended up with:

```glsl
float sum = 0.0;
sum += simplex_noise(x * (L / 1.00), time * S * 1.00)) * A * 0.85;
sum += simplex_noise(x * (L / 1.30), time * S * 1.26)) * A * 1.15;
sum += simplex_noise(x * (L / 1.86), time * S * 1.09)) * A * 0.60;
sum += simplex_noise(x * (L / 3.25), time * S * 0.89)) * A * 0.40;
```

<SmallNote label="">I reduced $A$ from 48 to 32. With more waves added, 48 became too high.</SmallNote>

This produces a wave that feels natural yet visually interesting.

<WebGLShader fragmentShader="simplex_stack_1" width={800} height={200} />

I don't feel that this wave needs a tide component. Constructive interference seems to do a good enough job of introducing ebbs and flows.

But there _is_ one component I feel is missing, which is flow. The wave feels too "still", which makes it feel a bit artificial, so let's make it flow a bit in one direction.

To make the wave flow left, we can add <Gl>time</Gl> to the <Gl>x</Gl> component, scaled by some constant that determines the amount of flow. Let's name that constant $F$.

```glsl
const float F = 0.031;

float sum = 0.0;
sum += simplex_noise(x * (L / 1.00) + F * time, ...) * ...;
sum += simplex_noise(x * (L / 1.30) + F * time, ...) * ...;
sum += simplex_noise(x * (L / 1.86) + F * time, ...) * ...;
sum += simplex_noise(x * (L / 3.25) + F * time, ...) * ...;
```

This adds a subtle, flowing feel to the wave. I'll let you vary the amount of flow to feel the difference.

<WebGLShader fragmentShader="simplex_stack_final" width={800} height={200} />

The amount of flow at 1x may feel a bit suble, but that's intentional. If the flow is easily noticeable, there's too much of it.


## Multiple waves

We've created a natural looking wave using simplex noise. Let's now update our shader to include multiple waves.

<WebGLShader fragmentShader="multiple_waves" width={800} height={200} />

As a first step, I'll create a <Gl>wave_alpha</Gl> function that takes in a Y position and height for the wave.

```glsl
float wave_alpha(float Y, float height) {
  // ...
}
```

We'll calculate the alpha like before: take the signed distance of the pixel's and wave's Y positions and use the distance to calculate the alpha.

```glsl
float wave_alpha(float Y, float wave_height) {
  float wave_y = Y + noise(gl_FragCoord.x) * wave_height;
  float dist_signed = wave_y - gl_FragCoord.y;
  float alpha = clamp(0.5 + dist_signed, 0.0, 1.0);
  return alpha;
}
```

Let's use this to calculate the alpha values of two waves:

```glsl
const float WAVE1_HEIGHT = 24.0;
const float WAVE2_HEIGHT = 32.0;
const float WAVE1_Y = 0.80 * CANVAS_HEIGHT;
const float WAVE2_Y = 0.35 * CANVAS_HEIGHT;

float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT);
float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT);
```

We'll then pick three colors -- one for the background, two for the waves:

```glsl
vec3 bg_color = vec3(...);
vec3 w1_color = vec3(...);
vec3 w2_color = vec3(...);
```

And composite those into a final image using the alphas:

```glsl
vec3 color = bg_color;
color = mix(color, w1_color, w1_alpha);
color = mix(color, w2_color, w2_alpha);
gl_FragColor = vec4(color, 1.0);
```

This gives us the following result:

<WebGLShader fragmentShader="multiple_waves" width={800} height={200} fragmentShaderOptions={{ offsetScalar: 0 }} />

This does gives us two waves, but they're completely in sync. We'll need to introduce an offset for the noise to make the waves distinct.

One way to add an offset is to provide each wave with an offset value and pass that to the noise function:

```glsl
float wave_alpha(float Y, float wave_height, float offset) {
  noise(..., offset);
  // ...
}

float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT, -72.2);
float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT, 163.9);
```

The noise function would then add the offset to the time component and use that when calculating the noise.

```glsl
float noise(float x, float offset) {
  // ...

  float t = time + offset;

  float sum = 0.0;
  sum += simplex_noise(x * L + F * t, t * S * 1.00);
  // ...
}
```

This would produce identical waves -- but the waves would be offset in time so no one would notice. If we want the waves to be distinct (for whatever reason), we can calculate multiple offsets and pass those to the different individual <Gl method>simplex_noise</Gl> functions:

```glsl
float noise(float x, float offset) {
  float o1 = offset * 1.0;
  float o2 = offset * 2.0;

  float sum = 0.0;
  sum += simplex_noise(x * L + F * t, t * S * 1.00 + o1);
  sum += simplex_noise(x * L + F * t, t * S * 1.00 + o2);
}
```

This would produce visually distinct waves.

Anyway, I want to backtrack a bit to discuss the offset value and mentiona that we don't actually need to provide the offset manually:

```glsl
float wave_alpha(float Y, float wave_height, float offset) {
  noise(..., offset);
  // ...
}

// Providing these offsets is unnecessary
float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT, -72.2);
float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT, 163.9);
```

We can just calculate an offset in the <Gl method>wave_alpha</Gl> using the Y and height components:

```glsl
float wave_alpha(float Y, float wave_height) {
  float noise_offset = Y * wave_height;
  noise(..., noise_offset);
  // ...
}
```

How random the offset needs to be ultimately depend on your application. If you need really random offsets, you can use more complicated methods to calculate them, but we just need the offsets not to be too close that it becomes visually noticeable.

Anyway, we can now easily generate an arbitrary number of waves! Let's move on.


## Background color noise

You've probably seen animated 2D noise like so:

<WebGLShader fragmentShader="perlin_noise" width={350} height={250} />

Above is an example of 3D [perlin noise][perlin_noise] -- the first two components are the X and Y position, and the third is time. I like to think of a 2D plane on the X/Y axes moving through a 3D volume along the Z axis (time) -- I find that to be a useful mental model.

Anyway, here's what the shader looks like:

```glsl
float x = gl_FragCoord.x * 0.02;
float y = gl_FragCoord.y * 0.02;
float z = u_time * 0.6;

float noise = perlin_noise(x, y, z);
float lightness = (noise + 1.0) / 2.0; // Remap from [-1, 1] to [0, 1]

gl_FragColor = vec4(lightness, lightness, lightness, 1.0);
```

If we scale the noise up, slow the evolution down, and make the X scale higher than the Y scale, we start to get fairly decent looking background noise:

<WebGLShader
  fragmentShader="perlin_noise"
  width={800}
  height={250}
  fragmentShaderOptions={{ xScale: 0.004, yScale: 0.010, timeScale: 0.2 }}
/>

Perlin is the most common type of noise used for this purpose, but I find it a bit too "blobby". Simplex noise does not have the same level of blobbiness -- it feels more natural to me. Here's a side-by-side comparison:

<WebGLShader fragmentShader="simplex_perlin_split" width={800} height={250} />

<SmallNote label="" center>Perlin noise is left, simplex noise is right.</SmallNote>

Either would work, but I find simplex noise more natural so let's go with it. Here's what simplex noise looks like scaled up and slowed down:

<WebGLShader
  fragmentShader="simplex_noise"
  width={800}
  height={250}
  fragmentShaderOptions={{ xScale: 0.0017, yScale: 0.005, timeScale: 0.2 }}
/>

We can stack perlin noise just like we do with sine waves -- layering noise of different scales, speeds and amplitudes. After some tweaking, here's what I came up with:

<WebGLShader fragmentShader="simplex_noise_stacked" width={800} height={250} />

Let's break down how I got here.

<span data-varlabel="time">$\text{time}$</span>