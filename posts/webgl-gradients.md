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

<WebGLShader fragmentShader="linear_gradient_area_under_line" height={150} width={150} />

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

This colors the area under the curve white!

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
const float WAVE_Y = CANVAS_HEIGHT * 0.5;
const float WAVE_AMP = 15.0;
const float WAVE_LEN = 75.0;

const float toWaveLength = (1.0 / WAVE_LEN) * (2.0 * PI);

float curve_y = WAVE_Y + sin(x * toWaveLength) * WAVE_AMP;
```

Which produces a sine wave:

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

In calculating our color and alpha values, we produced three assets:

 * For each pixel, we calculated both a foreground color and a background color. Together, those pixels form two images -- our foreground and background gradients.
 * The alpha values we calculated for each pixel constitute our alpha mask. Each pixel in an alpha mask has a value from $0$ to $1$ that denotes how transparent or opaque that pixel is.

Using alpha compositing, we then combined those three assets into a final image.

I like to think of the alpha compositing we performed as two separate steps: First we applied the alpha mask to our foreground image.

<Image src="~/alpha-compositing-alpha-mask.svg" plain />

We then layered the masked foreground onto the background, giving us our final image:

<Image src="~/alpha-compositing-final.svg" plain />


### Animating the wave

For the shader to produce motion, we'll need to provide the shader with a time variable. We can do that using [uniforms][uniform].

[uniform]: https://www.khronos.org/opengl/wiki/Uniform_(GLSL)

```glsl
uniform float time; // Time in seconds
```

Uniforms can be thought of as global variables that the shader has read-only access to. The values of the uniforms are set by the user prior to rendering, and the values are read by the shader during rendering.

From the perspective of a shader, uniforms are constants. When rendering a frame, each shader invocation will have the uniforms set to the same values. You can even use uniforms in constant expressions:

```glsl
uniform float time;

const float time_ms = time * 1000.0; // This is OK
```

Uniform variables can be of many types, such floats, vectors and textures (we'll get into textures later). They can also be of struct types:

```glsl
struct Foo {
  vec3 position;
  vec3 color;
}

uniform Foo foo;
```

Anyway, with <Gl>float time</Gl> now accessible in our shader as a uniform, we can start animating the wave. As a refresher, we're currently calculating our curve's Y value like so:

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

Adding <Gl>time * PI</Gl> shifts the phase of the wave by half a wavelength per second. To instead shift the wave by a full wavelength per second, we'd multiply time by $2\pi$.

However, instead of thinking in "wavelengths per second", I'd like to be able to specify a number of pixels that the wave will move per second.

Since $time \times 2\pi$ moves the wave by one wavelength per second, we can multiply $2\pi$ by the proportion of the wave's speed $S$ and wave's length $L$:

<p className="mathblock">$time \times 2\pi\dfrac{S}{L}$</p>

Which will cause the wave to move by $S$ pixels per second.

Let's define a constant for the wave's speed $S$:

```glsl
const float WAVE_LEN = 75.0; // Length in pixels
const float WAVE_SPEED = 20.0; // Pixels per seconds
```

Putting our equation into code, we get:

```glsl
const float toWaveLength = (1.0 / WAVE_LEN) * (2.0 * PI);
const float toPhase = (WAVE_SPEED / WAVE_LEN) * (2.0 * PI);

float wave_fac = sin(x * toWaveLength + u_time * toPhase);
```

We now have a constant that we can use to control the speed of the wave:

<WebGLShader fragmentShader="wave_animated" height={150} width={150} />

TODO: Make $W_S$ a slider

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

This produces a blur effect, though you might notice that the wave appears to have shifted down.

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

As we can see, the wave shifts down as <Gl>blur_amount</Gl> increases.

This makes sense. For pixels where <Gl>{"dist_signed <= 0"}</Gl> the alpha is $0$ regardless of the value of <Gl>blur_amount</Gl> so the top of the wave stays fixed. At the same time, alpha is $1$ for all pixels where <Gl>{"dist_signed >= blur_amount"}</Gl>, which shifts the "bottom" of the wave down as the blur increases.

What we want is for the alpha to be $0.5$ when <Gl>{"dist_signed == 0"}</Gl>, which we can do by starting <Gl>fg_alpha</Gl> at $0.5$:

```glsl
float fg_alpha = 0.5 + dist_signed / blur_amount;
fg_alpha = clamp(fg_alpha, 0.0, 1.0);
```

<WebGLShader fragmentShader="wave_animated_blur_left_to_right" height={150} width={250} />