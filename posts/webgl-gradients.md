---
title: "A flowing WebGL gradient, deconstructed"
description: "An introduction to writing WebGL shaders using gradient noise and cool math."
image: "/images/og-webgl-gradients.png"
publishedAt: "2025-04-12"
tags: ["WebGL", "GLSL", "Mathematics", "TypeScript"]
---

A few weeks ago I embarked on a journey to create a flowing gradient effect -- here's what I ended up making:

<WebGLShader fragmentShader="final" skew height={275} minWidth={600} maintainHeight={0.3} seed={16192} colorConfiguration={["default", "blue_to_yellow", "green"]} />

This effect is written in a WebGL shader using noise functions and some clever math.

In this post, I'll break it down step by step. You need no prior knowledge of WebGL or shaders -- we'll start by building a mental model for writing shaders and then recreate the effect from scratch.

We'll cover a lot in this post: writing shaders, interpolation, color mapping, gradient noise, and more. I'll help you develop an intuition for these concepts using dozens of visual (and interactive!) explanations.

If you just want to see the final code, I'll include a link to the shader code at the end of the post (this blog is [open source][alexharri_website] so you can just take a look).

[alexharri_website]: https://github.com/alexharri/website/

Let's get started!


## Color as a function of position

Building the gradient effect will boil down to writing a function that takes in a pixel position and returns a color value:

```ts
type Position = { x: number, y: number };

function pixelColor({ x, y }: Position): Color;
```

For every pixel on the canvas, we'll invoke the color function with the pixel's position to calculate its color. A canvas frame might be rendered like so:

```ts
for (let x = 0; x < canvas.width; x++) {
  for (let y = 0; y < canvas.height; y++) {
    const color = pixelColor({ x, y });
    canvas.drawPixel({ x, y }, color);
  }
}
```

To start, let's write a color function that produces a linear gradient like so:

<WebGLShader fragmentShader="x_lerp" width={150} height={150} />

To produce this red-to-blue gradient we'll blend red and blue with a blend factor that increases from $0$ to $1$ over the width of the canvas -- let's call that blending factor $t$. We can calculate it like so:

```ts
function pixelColor({ x, y }: Position): Color {
  const t = x / (canvas.width - 1);
}
```

Having calculated the blending factor $t$, we'll use it to mix red and blue:

```ts
const red  = color("#ff0000");
const blue = color("#0000ff");

function pixelColor({ x, y }: Position): Color {
  const t = x / (canvas.width - 1);  
  return mix(red, blue, t);
}
```

The <Ts method>mix</Ts> function is an interpolation function that [linearly interpolates][lerp] between the two input colors using a blend factor between $0$ and $1$ ($t$ in our case).

A <Ts method>mix</Ts> function for two numbers can be implemented like so:

```ts
function mix(a: number, b: number, t: number) {
  return a * (1 - t) + b * t;
}
```

<SmallNote label="">The mix function is often called "lerp" -- short for linear interpolation.</SmallNote>

A <Ts method>mix</Ts> function for two colors works the same way, except we mix the color components. To mix two RGB colors, for example, we'd mix the red, green, and blue channels.

```ts
function mix(a: Color, b: Color, t: number) {
  return new Color(
    a.r * (1 - t) + b.r * t,
    a.g * (1 - t) + b.g * t,
    a.b * (1 - t) + b.b * t,
  );
}
```

Anyway, <Ts>mix(red, blue, t)</Ts> produces a red-to-blue gradient over the width of the canvas (the $x$ axis):

<WebGLShader fragmentShader="x_lerp" width={150} height={150} />

<SmallNote label="">When <Ts>x == 0</Ts> we get a $t$ value of $0$, giving us 100% red. When <Ts>x == canvas.width - 1</Ts> we get a $t$ value of $1$, giving us 100% blue. If $t = 0.3$ we get 70% red and 30% blue.</SmallNote>

If we want an oscillating gradient (red to blue to red again, repeating), we can do that by using <Ts>sin(x)</Ts> to calculate the blending factor:

```ts
function pixelColor({ x, y }: Position): Color {
  let t = sin(x);
  t = (t + 1) / 2; // Normalize
  return mix(red, blue, t);
}
```

<SmallNote><Ts method>sin</Ts> returns a value between $-1$ and $1$, but the <Ts method>mix</Ts> function accepts a value between $0$ and $1$. For this reason, we normalize $t$ by remapping $[-1, 1]$ to $[0, 1]$ via $(t + 1)\,/\,2$.</SmallNote>

This produces the following effect:

<WebGLShader fragmentShader="x_sine_lerp" width={150} height={150} fragmentShaderOptions={{ waveLength: Math.PI * 2 }} showControls={false} />

Those waves are very thin! That's because we're oscillating between red and blue every $\pi$ pixels.

We can control the rate of oscillation by defining a [frequency][frequency] multiplier. It will determine over how many pixels the gradient oscillates from red to blue and red again. To produce a wavelength of $L$ pixels, we'll set the frequency multiplier to $\dfrac{2\pi}{L}$:

[frequency]: https://en.wikipedia.org/wiki/Frequency

```ts
const L = 40;
const frequency = (2 * PI) / L;

function pixelColor({ x, y }: Position): Color {
  let t = sin(x * frequency);
  // ...
}
```

This produces an oscillating gradient with the desired wavelength -- try changing the value of $L$ using the slider to see the effect:

<WebGLShader fragmentShader="x_sine_lerp" width={150} height={150} fragmentShaderOptions={{ waveLength: 40 }} usesVariables />


### Adding motion

So far we've only produced static images. To introduce motion, we'll update our color function to take in a <Ts>time</Ts> value as well.

```ts
function pixelColor({ x, y }: Position, time: number): Color;
```

We'll define <Ts>time</Ts> as the elapsed time, measured in seconds.

By adding <Ts>time</Ts> to the pixel's $x$ position, we simulate the canvas "scrolling" to the right one pixel a second:

```ts
let t = sin((x + time) * frequency);
```

But scrolling one pixel a second is very slow. Let's add a speed constant $S$ to control the speed of the scrolling motion and multiply <Ts>time</Ts> by it:

```ts
const S = 20;

let t = sin((x + time * S) * frequency);
```

Here's the result -- try adjusting the speed via the $S$ slider:

<WebGLShader fragmentShader="x_sine_lerp_time" width={150} height={150} usesVariables />

Voila, we've got movement!

These two inputs -- time and the pixel's position -- will be the main components that drive our final effect.

We'll spend the rest of the post writing a color function that will calculate a color for every pixel -- with the pixel's position and time as the function's inputs. Together, the colors of each pixel constitute a single frame of animation.

<WebGLShader fragmentShader="final" width={1000} minWidth={600} height={300} maintainHeight={0.3} seed={43414} />

But consider the amount of work that needs to be done. A $1{,}000 \times 300$ canvas<MediaQuery query="(min-width: 1000px)">, like the one above,</MediaQuery><MediaQuery query="(max-width: 999px)">, for example,</MediaQuery> contains $300{,}000$ pixels. That's $300{,}000$ invocations of our pixel function every frame -- a ton of work for a CPU to perform 60 times a second! This is where WebGL comes in.

WebGL shaders run on the GPU, which is useful to us because the GPU is designed for highly parallel computation. A GPU can invoke our color function thousands of times in parallel, making the task of rendering a single frame a breeze.

Conceptually, nothing changes. We're still going to be writing a single color function that takes a position and time value and returns a color. But instead of writing it in JavaScript and running it on the CPU, we'll write it in GLSL and run it on the GPU.


## WebGL and GLSL

WebGL can be thought of as a subset of [OpenGL][opengl], which is a cross-platform API for graphics rendering. WebGL is based on [OpenGL ES][opengl_es] -- an OpenGL spec for embedded systems (like mobile devices).

<SmallNote label="">Here's a page listing the [differences between OpenGL and WebGL][opengl_vs_webgl]. We won't encounter those differences in this post.</SmallNote>

OpenGL shaders are written in GLSL, which stands for [OpenGL Shading Language][glsl]. It's a strongly typed language with a C-like syntax.

[opengl]: https://en.wikipedia.org/wiki/OpenGL
[opengl_es]: https://en.wikipedia.org/wiki/OpenGL_ES
[opengl_vs_webgl]: https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences
[glsl]: https://en.wikipedia.org/wiki/OpenGL_Shading_Language

There are two types of shaders, vertex shaders and fragment shaders, which serve different purposes. Our color function will run in a fragment shader (sometimes referred to as a "pixel shader"). That's where we'll spend most of our time.

<Note>
<p>There's tons of boilerplate code involved in setting up a WebGL rendering pipeline. I'll mostly omit it so that we can stay focused on our main goal, which is creating a cool gradient effect.</p>
<p>Throughout this post, I'll link to resources I found helpful in learning about how to set up and work with WebGL.</p>
</Note>



## Writing a fragment shader

Here's a WebGL fragment shader that sets every pixel to the same color.

```glsl
void main() {
  vec4 color = vec4(0.7, 0.1, 0.4, 1.0);
  gl_FragColor = color;
}
```

WebGL fragment shaders have a <Gl method>main</Gl> function that is invoked once for each pixel. The <Gl method>main</Gl> function sets the value of <Gl>gl_FragColor</Gl> -- a special variable that specifies the color of the pixel.

We can think of <Gl method>main</Gl> as the entry point of our color function and <Gl>gl_FragColor</Gl> as its return value.

WebGL colors are represented through vectors with 3 or 4 components: <Gl>vec3</Gl> for RGB and <Gl>vec4</Gl> for RGBA colors. The first three components (RGB) are the red, green, and blue components. For 4D vectors, the fourth component is the [alpha][alpha] component of the color -- its opacity.

[rgb]: https://en.wikipedia.org/wiki/RGB_color_model
[alpha]: https://en.wikipedia.org/wiki/Alpha_compositing

```glsl
vec3 red = vec3(1.0, 0.0, 0.0);
vec3 blue = vec3(0.0, 0.0, 1.0);
vec3 white = vec3(1.0, 1.0, 1.0);
vec4 semi_transparent_green = vec4(0.0, 1.0, 0.0, 0.5);
```

WebGL colors use a [fractional representation][rgb_representation], where each components is a value between $0$ and $1$. Consider the color in the shader:

```glsl
void main() {
  vec4 color = vec4(0.7, 0.1, 0.4, 1.0);
  gl_FragColor = color;
}
```

We can trivially convert the fractional GLSL color <Gl>vec3(0.7, 0.1, 0.4)</Gl> to the percentage-based CSS color <Css>rgb(70%, 10%, 40%)</Css>. We can also multiply the fraction by 255 to get the unsigned integer representation <Css>rgb(178, 25, 102)</Css>.

[rgb_representation]: https://en.wikipedia.org/wiki/RGB_color_model#Numeric_representations

Anyway, if we run the shader we see that every pixel is set to that color:

<WebGLShader fragmentShader="single_color" height={100} width={100} />

Let's create a linear gradient that fades to another color over the $y$ axis. Let's use <Css>rgb(229, 154, 25)</Css> -- it corresponds to <Gl>vec3(0.9, 0.6, 0.1)</Gl> in GLSL.

[glsl_to_hex]: https://airtightinteractive.com/util/hex-to-glsl/

```glsl
vec3 color_1 = vec3(0.7, 0.1, 0.4);
vec3 color_2 = vec3(0.9, 0.6, 0.1);
```

<SmallNote label="">I've been using [this tool][glsl_to_hex] to convert from hex to GLSL colors, and vice versa</SmallNote>

To gradually transition from <Gl>color_1</Gl> to <Gl>color_2</Gl> over the $y$ axis, we'll need the $y$ coordinate of the current pixel. In WebGL fragment shaders, we get that via a special variable called [<Gl>gl_FragCoord</Gl>][frag_coord]:

[frag_coord]: https://registry.khronos.org/OpenGL-Refpages/gl4/html/gl_FragCoord.xhtml

```glsl
float y = gl_FragCoord.y;
```
<SmallNote label=""><Gl>float</Gl> corresponds to a 32-bit floating point number. We'll only use the <Gl>float</Gl> and <Gl>int</Gl> number types in this post, both of which are 32-bit.</SmallNote>

[glsl_data_types]: https://www.khronos.org/opengl/wiki/Data_Type_(GLSL)

Similar to before, we'll use the pixel's $y$ coordinate to calculate a blend value $t$ by dividing $y$ by the canvas height.


```glsl
const float CANVAS_WIDTH = 150.0;

float y = gl_FragCoord.y;
float t = y / (CANVAS_WIDTH - 1.0);
```

<SmallNote>I've configured the coordinates such that <Gl>gl_FragCoord</Gl> is <Gl>(0.0, 0.0)</Gl> at the lower-left corner and <Gl>(CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1)</Gl> at the upper right corner. This will stay consistent throughout the post.</SmallNote>

We'll mix the two colors with GLSL's [built-in <Gl method>mix</Gl> function][mix].

[mix]: https://registry.khronos.org/OpenGL-Refpages/gl4/html/mix.xhtml

```glsl
vec3 color = mix(color_1, color_2, t);
```

<SmallNote label="">GLSL has a bunch of [built-in math functions][built_in] such as <Gl method>sin</Gl>, <Gl method>clamp</Gl>, and <Gl method>pow</Gl>.</SmallNote>

[built_in]: https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf

We'll assign our newly calculated <Gl>color</Gl> to <Gl>gl_FragColor</Gl>:

```glsl
vec3 color = mix(color_1, color_2, t);
gl_FragColor = color;
```

But wait -- we get a compile-time error.

<blockquote className="monospace">ERROR: 'assign' : cannot convert from '3-component vector of float' to 'FragColor 4-component vector of float'</blockquote>

This error is a bit obtuse, but it's telling us that we can't assign our <Gl>vec3 color</Gl> to <Gl>gl_FragColor</Gl> because <Gl>gl_FragColor</Gl> is of type <Gl>vec4</Gl>.

In other words, we need to add an alpha component to <Gl>color</Gl> before passing it to <Gl>gl_FragColor</Gl>. We can do that like so:

```glsl
vec3 color = mix(color_1, color_2, t);
gl_FragColor = vec4(color, 1.0);
```

This gives us a linear gradient!

<WebGLShader fragmentShader="linear_gradient" height={150} width={150} />

### Vector constructors

You may have raised an eyebrow at the <Gl>vec4(color, 1.0)</Gl> expression above -- it's equivalent to <Gl>vec4(vec3(...), 1.0)</Gl>, which is perfectly valid in GLSL!

When passing a vector to a [vector constructor][vector_constructors], the components of the input vector are read left-to-right -- similar to JavaScript's [spread][spread] syntax.

[spread]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax

```glsl
vec3 a;

// this:
vec4 foo = vec4(a.x, a.y, a.z, 1.0);

// is equivalent to this:
vec4 foo = vec4(a, 1.0);
```

[vector_constructors]: https://www.khronos.org/opengl/wiki/Data_Type_(GLSL)#Vector_constructors

You can combine number and vector inputs in any way you see fit as long as the total number of values passed to the vector constructor is correct:

```glsl
vec4(1.0 vec2(2.0, 3.0), 4.0); // OK

vec4(vec2(1.0, 2.0), vec2(3.0, 4.0)); // OK

vec4(vec2(1.0, 2.0), 3.0); // Error, not enough components
```


### Coloring areas different colors

Let's color the bottom half of our canvas white, like so:

<WebGLShader fragmentShader="linear_gradient_area_under_line" height={150} width={150} showControls={false} />

To do that, we'll first calculate the $y$ position of the canvas' midline:

```glsl
const float MID_Y = CANVAS_HEIGHT * 0.5;
```

We can then determine the pixel's [signed][signed_distance] distance from the line through subtraction:

[signed_distance]: https://en.wikipedia.org/wiki/Signed_distance_function

```glsl
float y = gl_FragCoord.y;

float dist = MID_Y - y;
```

What determines whether our pixel should be white or not is whether it's below the line, which we can determine by reading the sign of the distance via the <Gl method>sign</Gl> function. The <Gl method>sign</Gl> function returns $-1.0$ if the value is negative and $1.0$ if it's positive.

```glsl
float dist = MID_Y - y;

sign(dist); // -1.0 or 1.0
```

We can calculate an alpha (blend) value by normalizing the sign to $0.0$ or $1.0$ via $(\text{sign}(\text{dist}) + 1)\,/\,2$.

<p className="mathblock">$$\begin{align}
(-1 + 1)\,/\,2 = 0&\\
(1 + 1)\,/\,2 = 1&\\
\end{align}$$</p>

```glsl
float alpha = (sign(dist) + 1.0) / 2.0;
```

Blending <Gl>color</Gl> and <Gl>white</Gl> using <Gl>alpha</Gl> colors the bottom half of the canvas white:

```glsl
color = mix(color, white, alpha);
```

<WebGLShader fragmentShader="linear_gradient_area_under_line" height={150} width={150} showControls={false} />

Here, <Gl>alpha</Gl> represents how white our pixel is. If <Gl>alpha == 1.0</Gl> the pixel is colored white, but if <Gl>alpha == 0.0</Gl> the original value of <Gl>color</Gl> is retained.

Calculating an alpha value by normalizing the sign and passing that to the <Gl method>mix</Gl> function may seem overly roundabout. Couldn't you just use an if statement?

```glsl
if (sign(dist) == 1.0) {
  color = white;
}
```

You could, but only if you want to pick 100% of either color. As we extend this to smoothly blend between the colors, using conditionals won't work.

<Note>
As an additional point, you generally want to avoid branching (if-else statements) in code that runs on the GPU. There are [nuances][branch_nuances] to the performance of branches in shader code, but branchless code is usually preferable. In our case, calculating the <Gl>alpha</Gl> and running the <Gl method>mix</Gl> function boils down to sequential math instructions that GPUs excel at.
</Note>

[branch_nuances]: http://www.gamedev.net/forums/topic/712557-is-branching-logic-in-shaders-really-still-a-problem/5448827/


### Drawing arbitrary curves

We're currently coloring everything under <Gl>MID_Y</Gl> white, but the line doesn't need to be determined by a constant -- we can calculate the $y$ of a curve using an arbitrary expression and use that to calculate <Gl>dist</Gl>:

```glsl
float curve_y = <some expression>;

float dist = curve_y - y;
```

That allows us to draw the area under any curve white. Let's, for example, define the curve as a slanted line

<p className="mathblock">$$ y = Y + x \times I $$</p>

where $Y$ is the start position of the line, and $I$ is the _incline_ of the line. We can put this into code like so:

```glsl
const float Y = 0.4 * CANVAS_HEIGHT;
const float I = 0.2;

float x = gl_FragCoord.x;

float curve_y = Y + x * I;
```

This produces the slanted line in the canvas below -- you can vary $I$ to see the effect:

<WebGLShader fragmentShader="linear_gradient_area_under_slanted_line" height={150} width={150} usesVariables />


We could also draw a parabola like so:

```glsl
// Adjust x=0 to be in the middle of the canvas
float x = gl_FragCoord.x - CANVAS_WIDTH / 2.0;

float curve_y = Y + pow(x, 2.0) / 40.0;
```

<WebGLShader fragmentShader="linear_gradient_area_under_exponential" height={150} width={150} />

The point is that we can define the curve however we want.

### Producing an animated wave

To draw a sine wave, we can define the curve as:

<p className="mathblock">$$ y = Y + A \times sin(x \times \dfrac{2\pi}{L}) $$</p>

where $Y$ is the wave's baseline $y$ position, $A$ is the [amplitude][amplitude] of the wave, and $L$ is the wave's length in pixels. Putting this into code, we get:

[amplitude]: https://www.mathsisfun.com/algebra/amplitude-period-frequency-phase-shift.html

```glsl
const float Y = 0.5 * CANVAS_HEIGHT;
const float A = 15.0;
const float L = 75.0;

const float frequency = (2.0 * PI) / L;

float curve_y = Y + sin(x * frequency) * A;
```

This draws a sine wave:

<WebGLShader fragmentShader="linear_gradient_area_under_wave" height={150} width={150} />

At the moment, things are completely static. For our shader to produce any motion we'll need to introduce a time variable. We can do that using [uniforms][uniform].

[uniform]: https://www.khronos.org/opengl/wiki/Uniform_(GLSL)

```glsl
uniform float u_time;
```

You can think of uniforms as per-draw call constants -- global variables that the shader has _read-only_ access to. The actual values of uniforms are controlled on the JavaScript side.

Within a given draw call, each shader invocation will have uniforms set to the same values. This is what the name "uniform" refers to -- the values of uniforms are _uniform_ across shader invocations within a given draw call. The JavaScript side can, however, change the values of uniforms _between_ draw calls.

<SmallNote label="">Uniforms are constant within draw calls but they are [not compile-time constant][uniform_const], meaning you cannot use the value of a uniform in `const` variables.</SmallNote>

[uniform_const]: https://www.khronos.org/opengl/wiki/Type_Qualifier_(GLSL)#Uniforms

Uniform variables can be of many types, such as floats, vectors, and textures (we'll cover textures later). But what's up with the <Gl>u_</Gl> prefix?

```glsl
uniform float u_time;
```

Prefixing uniform names with <Gl>u_</Gl> is a GLSL convention. You won't encounter compiler errors if you don't, but prefixing uniform names with <Gl>u_</Gl> is a very established pattern.

<SmallNote>There are similar conventions for the names of attributes and varyings (they're prefixed with <Gl>a_</Gl> and <Gl>v_</Gl>, respectively), but we won't use attributes or varyings in this post.</SmallNote>

Anyway, with <Gl>u_time</Gl> now accessible in our shader we can start producing motion. As a refresher, we're currently calculating our curve's $y$ value like so:

```glsl
float curve_y = Y + sin(x * W) * A;
```

Adding <Gl>u_time</Gl> to the pixel's $x$ position shifts the wave to the left over time:

```glsl
float curve_y = Y + sin((x + u_time) * W) * A;
```

But moving one pixel a second is quite slow (<Gl>u_time</Gl> is measured in seconds), so we'll add a speed constant $S$ to control the speed:

```glsl
const float S = 25.0;

float curve_y = Y + sin((x + u_time * S) * W) * A;
```

Try varying $S$ to see the speed change:

<WebGLShader fragmentShader="wave_animated_0" height={150} width={150} usesVariables />


### Applying a gradient to the lower half

Instead of the lower half being a flat white color, let's make it a gradient (like the upper half).

The upper half's gradient is currently composed of two colors: <Gl>color_1</Gl> and <Gl>color_2</Gl>. Let's rename those to <Gl>upper_color_1</Gl> and <Gl>upper_color_2</Gl>:

```glsl
vec3 upper_color_1 = vec3(0.7, 0.1, 0.4);
vec3 upper_color_2 = vec3(0.9, 0.6, 0.1);
```

For the lower half's gradient, we'll introduce two new colors: <Gl>lower_color_1</Gl> and <Gl>lower_color_2</Gl>.

```glsl
vec3 lower_color_1 = vec3(1.0, 0.7, 0.5);
vec3 lower_color_2 = vec3(1.0, 1.0, 0.9);
```

We'll calculate a $t$ value using the pixel's $y$ position, using that to gradually mix the colors over the $y$ axis:

```glsl
float t = y / (CANVAS_HEIGHT - 1.0);

vec3 upper_color = mix(upper_color_1, upper_color_2, t);
vec3 lower_color = mix(lower_color_1, lower_color_2, t);
```

With this, we've effectively calculated two gradients. We'll then determine which gradient to use for the current pixel's color using <Gl>alpha</Gl>:

```glsl
float alpha = (sign(curve_y - y) + 1.0) / 2.0;

vec3 color = mix(upper_color, lower_color, alpha);
```

This applies the gradients to the halves:

<WebGLShader fragmentShader="wave_animated_1" height={150} width={150} />

Since the value of <Gl>alpha</Gl> is calculated using the sign of the distance, its value will abruptly change from $0.0$ to $1.0$ at the wave's edge -- that's what gives us the sharp split.

Let's look at how we can make the split smoother using blur.


## Adding blur

Take another look at the final animation and consider the role that blur plays:

<WebGLShader fragmentShader="final" skew height={275} minWidth={600} maintainHeight={0.3} seed={16192} />

The blur isn't applied uniformly over the wave -- a variable amount of blur is applied to different parts of the wave, and the amount fluctuates over time.

How might we achieve that?

### Gaussian blur

When thinking about how I'd approach the blur problem, my first thought was to use [Gaussian blur][gaussian_blur]. I figured I'd determine the amount of blur to apply via a [noise function][perlin_noise] and then sample neighboring pixels according to the blur amount.

[gaussian_blur]: https://en.wikipedia.org/wiki/Gaussian_blur
[perlin_noise]: https://en.wikipedia.org/wiki/Perlin_noise

That's a valid approach -- progressive blur in WebGL is [feasible][progressive_blur] -- but in order to get a decent blur we'd need to sample lots of neighboring pixels, and the amount of pixels to sample only increases as the blur radius gets larger. The final effect requires a very large blur radius, so that becomes incredibly expensive _very_ quickly.

[progressive_blur]: https://tympanus.net/Tutorials/WebGLProgressiveBlur/

<SmallNote label="">Additionally, for us to be able to sample the alpha values of neighboring pixels with any reasonable performance, we'd need to calculate their alpha values up front. To do that we'd need to pre-render the alpha channel [into a texture][render_to_a_texture] for us to sample, which would require setting up another shader and render pass. Not a huge deal, but it _would_ add complexity.</SmallNote>

[render_to_a_texture]: https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html

I opted to take a different approach that doesn't require sampling neighboring pixels. Let's take a look.


### Calculate blur using signed distance

Here's how we're currently calculating <Gl>alpha</Gl>:

```glsl
float dist = curve_y - y;
float alpha = (sign(dist) + 1.0) / 2.0;
```

By taking the sign of our distance, we always get an opacity of 0% or 100% -- either fully transparent or completely opaque. Let's instead make <Gl>alpha</Gl> gradually transition from $0$ to $1$ over a number of pixels. Let's define a constant for that:

```glsl
const float BLUR_AMOUNT = 50.0;
```

We'll change the calculation for <Gl>alpha</Gl> to just be <Gl>dist / BLUR_AMOUNT</Gl>.

```glsl
float alpha = dist / BLUR_AMOUNT;
```

When <Gl>dist == 0.0</Gl>, the alpha will be $0$, and as <Gl>dist</Gl> approaches <Gl>BLUR_AMOUNT</Gl> the alpha approaches $1$. This will cause <Gl>alpha</Gl> to transition from $0$ to $1$ over the desired number of pixels, but we need to consider that

 1. when <Gl>dist</Gl> exceeds <Gl>BLUR_AMOUNT</Gl> the alpha will exceed $1.0$, and
 2. the alpha becomes negative when <Gl>dist</Gl> is negative.
 
Both of those would cause problems (alpha values should only range from $0$ to $1$) so we'll clamp <Gl>alpha</Gl> to the range $[0.0, 1.0]$ using the built-in <Gl method>clamp</Gl> function:

```glsl
float alpha = dist / BLUR_AMOUNT;
alpha = clamp(alpha, 0.0, 1.0);
```

This produces a blur effect, but we can observe the wave "shifting down" as the blur increases -- try varying the amount of blur using the slider:

<WebGLShader fragmentShader="wave_animated_blur_down_even" height={150} width={250} usesVariables />

We can fix the downshift by starting <Gl>alpha</Gl> at $0.5$:

```glsl
float alpha = 0.5 + dist / BLUR_AMOUNT;
alpha = clamp(alpha, 0.0, 1.0);
```

Starting at $0.5$ causes <Gl>alpha</Gl> to transition from $0$ to $1$ as <Gl>dist</Gl> ranges from <Gl>-BLUR_AMOUNT / 2</Gl> to <Gl>BLUR_AMOUNT / 2</Gl>, which keeps the wave centered:

<WebGLShader fragmentShader="wave_animated_blur_middle" height={150} width={250} usesVariables />

Let's now make blur gradually increase from left to right. To gradually increase the blur, we can [linearly interpolate][lerp] from no blur to <Gl>BLUR_AMOUNT</Gl> over the $x$ axis like so:

[lerp]: https://en.wikipedia.org/wiki/Linear_interpolation

```glsl
float t = gl_FragCoord.x / (CANVAS_WIDTH - 1)
float blur_amount = mix(1.0, BLUR_AMOUNT, t);
```

Using <Gl>blur_amount</Gl> to calculate the alpha, we get a gradually increasing blur:

```glsl
float alpha = dist / blur_amount;
alpha = clamp(alpha, 0.0, 1.0);
```

<WebGLShader fragmentShader="wave_animated_blur_left_to_right" height={150} width={250} usesVariables />

This forms the basis for how we'll produce the blur in the final effect.

The blur currently looks a bit "raw", but let's put that aside for the time being. We'll make it look awesome later in the post.

Let's now work on creating a natural-looking wave.


## Stacking sine waves

I often reach for stacked sine waves when I need a simple and natural wave-like noise function. Here's an example of a wave created using stacked sine waves:

<WebGLShader fragmentShader="sine_stack_final" width={800} height={200} maintainHeight={0.7} seed={30511} />

The idea is to sum the output of multiple sine waves with different wavelengths, amplitudes, and phase speeds.

<p align="center">Take the following pure sine waves:</p>

<WebGLShader fragmentShader="sine_stack_decomposed" width={600} height={310} maintainHeight={1} seed={3633} />

<p align="center" style={{ marginBottom: -40 }}>If you combine them into a single wave, you get an interesting final wave:</p>

<WebGLShader fragmentShader="sine_stack_composed" width={600} height={210} maintainHeight={1} seed={3633} />

<p style={{ marginTop: -24 }}>The equation for the individual sine waves is</p>

<p className="mathblock">$$\sin(x \times L + \text{time} \times S) \times A$$</p>

where $L$, $S$ and $A$ are variables that control different aspects of the wave:

 * $L$ determines the wavelength,
 * $S$ determines the phase evolution speed, and
 * $A$ determines the amplitude of the wave.

The final wave can be described as the sum of $N$ such waves:

<p className="mathblock">$$\begin{align}
      \sin(x \times L_1\,+&\,\text{time} \times S_1) \times A_1 \\
+\,   \sin(x \times L_2\,+&\,\text{time} \times S_2) \times A_2 \\
      &\vdots \\
+\,   \sin(x \times L_n\,+&\,\text{time} \times S_n) \times A_n
\end{align}$$</p>

Which put into code, looks like so:

```glsl
float sum = 0.0;
sum += sin(x * L1 + u_time * S1) * A1;
sum += sin(x * L2 + u_time * S2) * A2;
sum += sin(x * L3 + u_time * S3) * A3;
...
return sum;
```

The problem, then, is finding $L$, $S$, $A$ values for each sine wave that, when stacked, produce a nice-looking final wave.

In finding those values, I first create a "baseline wave" with the $L$, $S$, $A$ components set to values that feel right. I picked these values:

```glsl
const float L = 0.015;
const float S = 0.6;
const float A = 32.0;

float sum = sin(x * L + u_time * S) * A;
```

They produce the following wave:

<WebGLShader fragmentShader="sine_stack_0" width={800} height={200} maintainHeight={0.7} seed={30511} />

This wave has the rough shape of what I want the final wave to look like, so these values serve as a good baseline.

I then add more sine waves that use the baseline $L$, $S$, $A$ values multiplied by some constants. After some trial and error, I ended up with the following:

```glsl
float sum = 0.0;
sum += sin(x * (L / 1.000) + u_time *  0.90 * S) * A * 0.64;
sum += sin(x * (L / 1.153) + u_time *  1.15 * S) * A * 0.40;
sum += sin(x * (L / 1.622) + u_time * -0.75 * S) * A * 0.48;
sum += sin(x * (L / 1.871) + u_time *  0.65 * S) * A * 0.43;
sum += sin(x * (L / 2.013) + u_time * -1.05 * S) * A * 0.32;
```

<SmallNote label="">Observe how $S$ is multiplied by a negative number for waves 3 and 5. Making some of the waves travel in the opposite direction prevents the final wave from feeling as if it's moving in one direction at a constant rate.</SmallNote>

These five sine waves give us a reasonably natural-looking final wave:

<WebGLShader fragmentShader="sine_stack_3" width={800} height={200} seed={30511} maintainHeight={0.7} />

Because all of the sine waves are defined by $L$, $S$, $A$, we can tune the waves together by adjusting those constants. Increase $S$ to make the waves faster, $L$ to make the waves shorter, and $A$ to make the waves taller. Try varying $L$ and $S$:

<WebGLShader fragmentShader="sine_stack_3_LSA" width={800} height={200} seed={30511} maintainHeight={0.7} usesVariables />

We won't actually make use of stacked sine waves in our final effect. We _will_, however, use the idea of stacking waves of different scales and speeds.


## Simplex noise

[Simplex noise][simplex_noise] is a family of $n$-dimensional gradient noise functions developed by [Ken Perlin][ken_perlin]. Ken first introduced "classic" [Perlin noise][perlin_noise] in 1983 and later created simplex noise in 2001 to address some of the [drawbacks][perlin_drawbacks] of Perlin noise.

[simplex_noise]: https://en.wikipedia.org/wiki/Simplex_noise
[perlin_noise]: https://en.wikipedia.org/wiki/Perlin_noise
[ken_perlin]: https://en.wikipedia.org/wiki/Ken_Perlin
[perlin_drawbacks]: https://noiseposti.ng/posts/2022-01-16-The-Perlin-Problem-Moving-Past-Square-Noise.html

The dimensionality of a simplex noise function refers to how many numeric input values the function takes (the 2D simplex noise function takes two numeric arguments, the 3D function takes three). All simplex noise functions return a single numeric value between $-1$ and $1$.

2D simplex noise is frequently used, for example, to [procedurally generate terrain][generate_terrain] in video games. Here's an example texture created using 2D simplex noise that could be used as a height map:

[generate_terrain]: https://www.redblobgames.com/maps/terrain-from-noise/

<WebGLShader fragmentShader="simplex_noise" width={400} minWidth={200} height={250} animate={false} showControls={false} />

It is generated by calculating the lightness of each pixel using the output of the 2D simplex noise function with the pixel's $x$ and $y$ coordinates as inputs.

```glsl
const float L = 0.02;

float x = gl_FragCoord.x * L;
float y = gl_FragCoord.y * L;

float lightness = (simplex_noise(x, y) + 1.0) / 2.0;

gl_FragColor = vec4(vec3(lightness), 1.0);
```

<SmallNote>The <Gl method>simplex_noise</Gl> implementation I'm using can be found in [this GitHub repository][webgl_noise].</SmallNote>

[webgl_noise]: https://github.com/stegu/webgl-noise

$L$ controls the scale of the $(x, y)$ coordinates. As $L$ increases, the noise becomes smaller. Here's a canvas where you can adjust $L$ to see the effect:

<WebGLShader fragmentShader="simplex_noise" width={400} minWidth={200} height={250} animate={false} usesVariables />

We'll use 2D simplex noise to create an animated 1D wave. The idea behind that may not be very obvious, so let's see how it works.


### 1D animation using 2D noise

Consider the following points:

<Scene autoRotate scene="simplex-point-array" height={350} />

The points are arranged in a grid configuration on the $x$ and $z$ axes, with the $y$ coordinate of each point calculated via <Gl>simplex_noise(x, z)</Gl>:

```ts
for (const point of points) {
  const { x, z } = point;
  point.y = simplex_noise(x, z);
}
```

By doing this we've effectively created a 3D surface from a 2D input (the $x$ and $z$ coordinates).

Fair enough, but how does that relate to generating an animated wave?

Consider what happens if we use time as the $z$ coordinate. As time passes, the value of $z$ increases, giving us different 1D slices of the $y$ values of the surface along the $x$ axis. Here's a visualization:

<Scene autoRotate scene="simplex" height={480} angle={18} xRotation={154} />

Putting this into code for our 2D canvas is fairly simple:

```glsl
uniform float u_time;

const float L = 0.0015;
const float S = 0.12;
const float A = 40.0;

float x = gl_FragCoord.x;

float curve_y = MID_Y + simplex_noise(x * L, u_time * S) * A;
```

This gives us a smooth animated wave:

<WebGLShader fragmentShader="simplex_wave" width={800} height={200} seed={11993} maintainHeight={0.7} />

<SmallNote label="" center>A single simplex noise function call already produces a very natural-looking wave!</SmallNote>

The same three $L$, $S$, $A$ variables determine the characteristics of our wave. We scale $x$ by $L$ to make the wave shorter or longer on the horizontal axis:

<p className="mathblock">$$\text{simplex}(x \times L,\ \text{time})$$</p>

We scale $\text{time}$ by $S$ to control the evolution speed of our wave -- the speed at which we move across the $z$ axis in the visualization above:

<p className="mathblock">$$\text{simplex}(x \times L,\ \text{time} \times S)$$</p>

Lastly, we scale the output of the $\text{simplex}$ function by $A$, which determines the amplitude (height) of our wave.

<p className="mathblock">$$\text{simplex}(x \times L,\ \text{time} \times S) \times A$$</p>

<SmallNote label="" center>Simplex noise returns a value between $-1$ and $1$, so to make a wave with a height of $96$ you'd set $A$ to $48$.</SmallNote>

Even though the simplex wave feels natural, I find the peaks and valleys to look too evenly spaced and predictable.

That's where stacking comes in. We can stack simplex waves of various lengths and speeds to get a more interesting final wave. I tweaked the constants and added a few increasingly large waves -- some slower and some faster. Here's what I ended up with:

```glsl
const float L = 0.0018;
const float S = 0.04;
const float A = 40.0;

float noise = 0.0;
noise += simplex_noise(x * (L / 1.00), u_time * S * 1.00)) * A * 0.85;
noise += simplex_noise(x * (L / 1.30), u_time * S * 1.26)) * A * 1.15;
noise += simplex_noise(x * (L / 1.86), u_time * S * 1.09)) * A * 0.60;
noise += simplex_noise(x * (L / 3.25), u_time * S * 0.89)) * A * 0.40;
```

This produces a wave that feels natural, yet visually interesting.

<WebGLShader fragmentShader="simplex_stack_1" width={800} height={200} seed={31993} maintainHeight={0.7} />

Looks awesome, but there is one component I feel is missing, which is directional flow. The wave is too "still", which makes it feel a bit artificial.

To make the wave flow left, we can add <Gl>u_time</Gl> to the <Gl>x</Gl> component, scaled by a constant $F$ that determines the amount of flow.

```glsl
const float F = 0.043;

float noise = 0.0;
noise += simplex_noise(x * (L / 1.00) + F * u_time, ...) * ...;
noise += simplex_noise(x * (L / 1.30) + F * u_time, ...) * ...;
noise += simplex_noise(x * (L / 1.86) + F * u_time, ...) * ...;
noise += simplex_noise(x * (L / 3.25) + F * u_time, ...) * ...;
```

This adds a subtle flow to the wave. Try changing the amount of flow to feel the difference it makes:

<WebGLShader fragmentShader="simplex_stack_final" width={800} height={200} seed={31993} maintainHeight={0.7} usesVariables />

<SmallNote label="" center>The amount of flow may feel subtle, but that's intentional. If the flow is easily noticeable, there's too much of it.</SmallNote>

I think we've got a good-looking wave. Let's move on to the next step.


## Multiple waves

Let's update our shader to include multiple waves. As a first step, I'll create a reusable <Gl method>wave_alpha</Gl> function that takes in a $y$ position and height for the wave and returns an alpha value.

```glsl
float wave_alpha(float Y, float height) {
  // ...
}
```

To keep things clean, I'll create a <Gl method>wave_noise</Gl> function that returns the stacked simplex wave we defined in the last section:

```glsl
float wave_noise() {
  float noise = 0.0;
  noise += simplex_noise(...) * ...;
  noise += simplex_noise(...) * ...;
  // ...
  return noise;
}
```

We'll use that in <Gl method>wave_alpha</Gl> to calculate the wave's $y$ position and the pixel's distance to it:

```glsl
float wave_alpha(float Y, float wave_height) {
  float wave_y = Y + wave_noise() * wave_height;
  float dist = wave_y - gl_FragCoord.y;
}
```

Using the distance to compute the <Gl>alpha</Gl> value:

```glsl
float wave_alpha(float Y, float wave_height) {
  float wave_y = Y + wave_noise() * wave_height;
  float dist = wave_y - gl_FragCoord.y;
  float alpha = clamp(0.5 + dist, 0.0, 1.0);
  return alpha;
}
```

We'll then use the <Gl method>wave_alpha</Gl> function to calculate alpha values for two waves, each with their separate $y$ positions and heights:

```glsl
const float WAVE1_HEIGHT = 24.0;
const float WAVE2_HEIGHT = 32.0;
const float WAVE1_Y = 0.80 * CANVAS_HEIGHT;
const float WAVE2_Y = 0.35 * CANVAS_HEIGHT;

float wave1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT);
float wave2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT);
```

Two waves split the canvas in three. I like to think of the upper third as the background, with two waves drawn in front of it (with wave 1 in the middle and wave 2 at the front).

To draw a background and two waves, we'll need three colors. I picked these nice blue colors:

```glsl
vec3 background_color = vec3(0.102, 0.208, 0.761);
vec3 wave1_color = vec3(0.094, 0.502, 0.910);
vec3 wave2_color = vec3(0.384, 0.827, 0.898);
```

Finally, we'll calculate the pixel's color by blending these colors using the two waves' alpha values:

```glsl
vec3 color = background_color;
color = mix(color, wave1_color, wave1_alpha);
color = mix(color, wave2_color, wave2_alpha);
gl_FragColor = vec4(color, 1.0);
```

This gives us the following result:

<WebGLShader fragmentShader="multiple_waves" width={800} minWidth={600} height={200} fragmentShaderOptions={{ offsetScalar: 0 }} maintainHeight={0.7} seed={18367} />

We do get two waves, but they're completely in sync with each other.

This makes sense because the inputs to our noise function are the pixel's $x$ position and the current time, which are the same for both waves.

To fix this we'll introduce wave-specific offset values that we pass to the noise functions. One way to do that is just to provide each wave with a literal <Gl>offset</Gl> value and pass that to the noise function:

```glsl
float wave_alpha(float Y, float wave_height, float offset) {
  wave_noise(offset);
  // ...
}

float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT, -72.2);
float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT, 163.9);
```

The <Gl method>wave_noise</Gl> function can then add <Gl>offset</Gl> to <Gl>u_time</Gl> and use that when calculating the noise.

```glsl
float wave_noise(float offset) {
  float time = u_time + offset;

  float noise = 0.0;
  noise += simplex_noise(x * L + F * time, time * S) * A;
  // ...
}
```

This produces identical waves, but offset in time. By making the offset large enough, we get waves spaced far enough apart in time that no one would notice that they're the same wave.

But we don't actually need to provide the offset manually. We can derive an offset in the <Gl method>wave_alpha</Gl> function using the <Gl>Y</Gl> and <Gl>wave_height</Gl> arguments:

```glsl
float wave_alpha(float Y, float wave_height) {
  float offset = Y * wave_height;
  wave_noise(offset);
  // ...
}
```

Given the wave constants above and a canvas height of $200$, we get the following offsets:

<p className="mathblock">$$\begin{align}
24 \times 0.80 \times 200 = 3{,}840 &\\
32 \times 0.35 \times 200 = 2{,}240 &\\
\end{align}$$</p>

With these offsets, the waves differ in time by $1{,}600$ seconds. No one's gonna notice that.

With the offsets added, we get two distinct waves:

<WebGLShader fragmentShader="multiple_waves" width={800} minWidth={600} height={200} maintainHeight={0.7} seed={20367} />

Now that we've updated our shader to handle multiple waves, let's move onto making the waves not be a single solid color.

## Animated 2D noise

When generating the animated waves above, we used a 2D noise function to generate animated 1D noise.

That pattern holds for higher dimensions as well. When generating $n$-dimensional noise, we use an $n + 1$-dimensional noise function with time as the value of the last dimension.

Here's the static 2D simplex noise we saw earlier:

<WebGLShader fragmentShader="simplex_noise" width={400} minWidth={200} height={250} animate={false} showControls={false} />

To animate it, we'll use the 3D simplex noise function, passing the pixel's $x$ and $y$ positions as the first two arguments and time as the third argument.

```glsl
const float L = 0.02;
const float S = 0.6;

float x = gl_FragCoord.x;
float y = gl_FragCoord.y;

float noise = simplex_noise(x * L, y * L, u_time * S);
```

We'll normalize the noise to $[0, 1]$ and use it as a lightness value:

```glsl
float lightness = (noise + 1.0) / 2.0;

gl_FragColor = vec4(vec3(lightness), 1.0);
```

This gives us animated 2D noise:

<WebGLShader fragmentShader="simplex_noise" width={400} minWidth={200} height={250} showControls={false} />

Our goal for this animated 2D noise is for it to eventually be used to create the colors of the waves in our final gradient:

<WebGLShader fragmentShader="final" skew height={275} minWidth={600} maintainHeight={0.3} seed={20582} />

For the noise to start looking like that we'll need to make some adjustments. Let's scale up the noise and also make the scale of the noise larger on the $x$ axis than the $y$ axis.

```glsl
const float L = 0.0017;
const float S = 0.2;
const float Y_SCALE = 3.0;

float x = gl_FragCoord.x;
float y = gl_FragCoord.y * Y_SCALE;
```

I made $L$ around $11$ times smaller and introduced <Gl>Y_SCALE</Gl> to make the noise shorter on $y$ axis. I also reduced the speed $S$ by about 80%.

With these adjustments, we get the following noise:

<WebGLShader
  fragmentShader="simplex_noise"
  width={800}
  height={250}
  minWidth={600}
  maintainHeight={0.3}
  fragmentShaderOptions={{ L: 0.0017, yScale: 3.0, timeScale: 0.2 }}
  showControls={false}
/>

Looks pretty good, but the noise feels a bit too evenly spaced. Yet again, we'll use stacking to make the noise more interesting. Here's what I came up with:

```glsl
const float L = 0.0015;
const float S = 0.13;
const float Y_SCALE = 3.0;

float x = gl_FragCoord.x;
float y = gl_FragCoord.y * Y_SCALE;

float noise = 0.5;
noise += simplex_noise(x * L * 1.0, y * L * 1.00, u_time * S) * 0.30;
noise += simplex_noise(x * L * 0.6, y * L * 0.85, u_time * S) * 0.26;
noise += simplex_noise(x * L * 0.4, y * L * 0.70, u_time * S) * 0.22;

float lightness = clamp(noise, 0.0, 1.0);
```

The larger noise provides larger, sweeping fades, and the smaller noise gives us the finer details:

<WebGLShader
  fragmentShader="simplex_noise_stacked_0"
  width={800}
  height={250}
  minWidth={600}
  maintainHeight={0.3}
  seed={11350}
/>

As a final cherry on top, I want to add a directional flow component. I'll make two of the noises drift left, and the other drift right.

```glsl
float F = 0.11 * u_time;

float sum = 0.5;
sum += simplex_noise(x ... +  F * 1.0, ..., ...) * ...;
sum += simplex_noise(x ... + -F * 0.6, ..., ...) * ...;
sum += simplex_noise(x ... +  F * 0.8, ..., ...) * ...;

float lightness = clamp(sum, 0.0, 1.0);
```

Here's what that looks like:

<WebGLShader
  fragmentShader="simplex_noise_stacked_1"
  width={800}
  height={250}
  minWidth={600}
  maintainHeight={0.3}
  seed={22836}
  usesVariables
/>

This makes the noise feel like it flows to the left -- but not uniformly so.

I think this is looking quite good! Let's clean things up putting this into a <Gl method>background_noise</Gl> function:

```glsl
float background_noise() {
  float noise = 0.5;
  noise += simplex_noise(...);
  noise += simplex_noise(...);
  // ...

  return clamp(noise, 0.0, 1.0);
}

float lightness = background_noise()
gl_FragColor = vec4(vec3(lightness), 1.0);
```

Now let's move beyond black and white and add some color to the mix!


### Color mapping

<WebGLShader fragmentShader="x_lerp" width={150} height={150} />

This red-to-blue gradient works by calculating a $t$ value based on the pixel's $x$ coordinate and mapping it to a color -- some blend of red and blue -- using the $t$ value:

```glsl
vec3 red  = vec3(1.0, 0.0, 0.0);
vec3 blue = vec3(0.0, 0.0, 1.0);

float t = gl_FragCoord.x / (CANVAS_WIDTH - 1.0);
vec3 color = mix(red, blue, t);
```

What we can do is use our new <Gl method>background_noise</Gl> function to calculate the $t$ value.

```glsl
float t = background_noise();
vec3 color = mix(red, blue, t);
```

That has the effect of mapping the noise to a red-to-blue gradient:

<WebGLShader
  fragmentShader="simplex_noise_stacked_2"
  width={800}
  height={250}
  minWidth={600}
  maintainHeight={0.3}
  seed={22836}
/>

That's pretty cool, but I'd like to be able to map the $t$ value to _any_ gradient, such as this one:

<div className="flow" style={{
  height: 64,
  width: 256,
  background: `linear-gradient(90deg, rgba(8,0,143,1) 0%, rgba(250,0,32,1) 50%, rgba(255,204,43,1) 100%)`,
  margin: "40px auto",
}} />

This gradient is a <Html>{"<div>"}</Html> element with its background set to this CSS gradient:

```css
background: linear-gradient(
  90deg,
  rgb(8, 0, 143) 0%,
  rgb(250, 0, 32) 50%,
  rgb(255, 204, 43) 100%
);
```

We can replicate this in a shader. First, we'll convert the three colors of the gradient to <Gl>vec3</Gl> colors:

```glsl
vec3 color1 = vec3(0.031, 0.0, 0.561);
vec3 color2 = vec3(0.980, 0.0, 0.125);
vec3 color3 = vec3(1.0,   0.8, 0.169);
```

We then mix the colors using $t$ and some clever math:

```glsl
float t = gl_FragCoord.x / (CANVAS_WIDTH - 1.0);

vec3 color = color1;
color = mix(color, color2, min(1.0, t * 2.0));
color = mix(color, color3, max(0.0, (t - 0.5) * 2.0));
gl_FragColor = vec4(color, 1.0);
```

This replicates the CSS gradient perfectly:

<WebGLShader fragmentShader="three_point_gradient" width={256} height={64} />

I'll move the color calculations into a <Gl method>calc_color</Gl> function to clean things up:

```glsl
vec3 calc_color(float t) {
  vec3 color = color1;
  color = mix(color, color2, min(1.0, t * 2.0));
  color = mix(color, color3, max(0.0, (t - 0.5) * 2.0));
  return color;
}
```

Now that we have a <Gl method>calc_color</Gl> function that maps $t$ values to the gradient, we can easily map <Gl method>background_noise</Gl> to it:

```glsl
float t = background_noise();
gl_FragColor = vec4(calc_color(t), 1.0);
```

Here's the result:

<WebGLShader
  fragmentShader="simplex_noise_stacked_3"
  width={800}
  height={250}
  minWidth={600}
  maintainHeight={0.3}
  seed={12926}
/>

Our <Gl method>calc_color</Gl> function is set up to handle 3-stop gradients, but we can update it to handle gradients with $n$ stops. Here is an example of a 5-stop gradient:

```glsl
vec3 calc_color(float t) {
  vec3 color1 = vec3(1.0, 0.0, 0.0);
  vec3 color2 = vec3(1.0, 1.0, 0.0);
  vec3 color3 = vec3(0.0, 1.0, 0.0);
  vec3 color4 = vec3(0.0, 0.0, 1.0);
  vec3 color5 = vec3(1.0, 0.0, 1.0);

  float num_stops = 5.0;
  float N = num_stops - 1.0;

  vec3 color = mix(color1, color2, min(t * N, 1.0));
  color = mix(color, color3, clamp((t - 1.0 / N) * N, 0.0, 1.0));
  color = mix(color, color4, clamp((t - 2.0 / N) * N, 0.0, 1.0));
  color = mix(color, color5, clamp((t - 3.0 / N) * N, 0.0, 1.0));
  return color;
}
```

The above function produces the following:

<WebGLShader fragmentShader="rainbow" width={256} height={64} />

This works, but defining the gradient in code like this is (obviously) not great. The colors of the gradient are hardcoded into our shader, and we need to manually adjust the function to handle the correct number of color stops.

We can make this more dynamic by reading the gradient from a texture.


## Gradient texture

To pass image data -- such as a linear gradient -- from JavaScript to our shader, we can use [textures][opengl_texture]. Textures are arrays of data that can, amongst other things, store a 2D image.

[opengl_texture]: https://www.khronos.org/opengl/wiki/texture

Firstly, we'll generate an image containing a linear gradient in JavaScript. We'll write that image to a texture and pass that texture to our WebGL shader. The shader can then read data from the texture.


### Rendering a gradient to a canvas

I used [this gradient generator][gradient_generator] to pick the following gradient:

<div className="flow" style={{
  height: 64,
  width: 256,
  background: "linear-gradient(90deg, hsl(204deg 100% 22%), hsl(199deg 100% 29%), hsl(189deg 100% 32%), hsl(173deg 100% 33%), hsl(154deg 100% 39%), hsl(89deg 70% 56%), hsl(55deg 100% 50%))",
  margin: "40px auto",
}} />

It consists of these colors:

```ts
const colors = [
  "hsl(204deg 100% 22%)",
  "hsl(199deg 100% 29%)",
  "hsl(189deg 100% 32%)",
  "hsl(173deg 100% 33%)",
  "hsl(154deg 100% 39%)",
  "hsl( 89deg  70% 56%)",
  "hsl( 55deg 100% 50%)",
];
```

To render the gradient to a canvas, we'll first have to create one. We can do that like so:

```ts
const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 64;
const ctx = canvas.getContext("2d");
```

The gradient is written to a [<Ts>CanvasGradient</Ts>][canvas_gradient] like so:

[canvas_gradient]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient

```ts
const linearGradient = ctx.createLinearGradient(
  0, 0, // Top-left corner
  canvas.width, 0 // Top-right corner
);

for (const [i, color] of colors.entries()) {
  const stop = i / (colors.length - 1);
  linearGradient.addColorStop(stop, color);
}
```

Setting the gradient as the active fill style and drawing a rectangle over the dimensions renders the gradient.

```ts
ctx.fillStyle = linearGradient;
ctx.fillRect(0, 0, canvas.width, canvas.height);
```

<WebGLShader fragmentShader="read_texture" width={256} height={64} colorConfiguration="blue_to_yellow" />

[gradient_generator]: https://www.joshwcomeau.com/gradient-generator/

Now that we've rendered a linear gradient onto a canvas element, let's write it into a texture and pass it to our shader.

### Reading canvas contents from a shader

The following code creates a WebGL texture and writes the canvas contents to it:

```ts
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
gl.bindTexture(gl.TEXTURE_2D, null);
```

<SmallNote label="">I won't cover how this works -- I want to stay focused on shaders, not the WebGL API. I'll refer you to [this post on rendering to a texture][render_to_texture] if you want to explore this in more detail.</SmallNote>

[render_to_texture]: https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html

GLSL shaders read data from textures using [samplers][samplers]. A sampler is a function that takes texture coordinates and returns _a_ value for the texture at that position. Emphasis on "_a_" value because when texture coordinates fall _between_ data points, the sampler returns an interpolated result derived from surrounding values.

[samplers]: https://www.khronos.org/opengl/wiki/Sampler_(GLSL)

There are different sampler types for different value types: `isampler` for signed integers, `usampler` for unsigned integers, and `sampler` for floats. Our image texture contains floats so we'll use the unprefixed `sampler`.

Samplers also have dimensionality. You can have 1D, 2D or 3D samplers. Since we'll be reading from a 2D image texture, we'll use a `sampler2D`. If you were reading unsigned integers from a 3D texture, you'd use a `usampler3D`.

In our shader, we'll declare our sampler via a uniform. I'll name it <Gl>u_gradient</Gl>:

```glsl
uniform sampler2D u_gradient;
```

On the JavaScript side, we'll make <Gl>u_gradient</Gl> point to our <Gl>texture</Gl> like so:

```ts
const gradientUniformLocation = gl.getUniformLocation(program, "u_gradient");
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.uniform1i(gradientUniformLocation, 0);
```

<SmallNote label="">Again, I won't cover how this works -- I want to stay focused on the shader side -- but I'll refer you to [this post][webgl_textures] on WebGL textures.</SmallNote>

[webgl_textures]: https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html

To read data from a texture (via a sampler) we'll use one of OpenGL's built-in [texture lookup functions][texture_lookup_functions]. In our case, we're reading 2D image data, so we'll use <Gl method>texture2D</Gl>.

[texture_lookup_functions]: https://www.khronos.org/opengl/wiki/Sampler_(GLSL)#Texture_lookup_functions

<Gl method>texture2D</Gl> takes two arguments, a sampler and 2D texture coordinates. The coordinates are normalized so $(0, 0)$ is the top-left corner of the texture and $(1, 1)$ is the bottom-right corner of the texture.

<SmallNote><Gl method>texture2D</Gl> coordinates are typically normalized, but samplers may also use "texel space" coordinates which range from $[0, S]$ where $S$ is the size of the texture for that dimension.</SmallNote>

Here's our texture again, for reference:

<WebGLShader fragmentShader="read_texture" width={256} height={64} colorConfiguration="blue_to_yellow" />

The texture is uniform over the $y$ axis so we can just set the $y$ coordinate to $0.5$ (we could also use $0.0$ or $1.0$, the result would be the same).

<SmallNote label="">Since the texture is uniform over the $y$ axis, its height doesn't matter. I'm using a height of $64$ because it looks nice for this post, but you could use a height of $1$ instead.</SmallNote>

As for the $x$ axis, reading the color at $x = 0.0$ should yield blue, and at $x = 1.0$ we should get yellow. We can verify this with the following shader

```glsl
uniform sampler2D u_gradient;
uniform float u_x;

void main() {
  gl_FragColor = texture2D(u_gradient, vec2(u_x, 0.5));
}
```

In the canvas below, the $x$ slider controls the value of <Gl>u_x</Gl>. As you slide $x$ from $0$ to $1$ the color should change from blue to yellow:

<WebGLShader fragmentShader="read_texture_t" width={100} height={100} colorConfiguration="blue_to_yellow" usesVariables />

It works! We can now map values between $0$ and $1$ to the gradient texture. This makes mapping <Gl method>background_noise</Gl> to the gradient trivial:

```glsl
uniform sampler2D u_gradient;

float t = background_noise();

gl_FragColor = texture2D(u_gradient, vec2(t, 0.5));
```

As we can see, this has the effect of applying our gradient to the background noise:

<WebGLShader
  fragmentShader="simplex_noise_stacked_4"
  width={800}
  height={250}
  minWidth={600}
  maintainHeight={0.3}
  seed={12926}
  colorConfiguration="blue_to_yellow"
/>

Defining the gradient in JavaScript and generating it dynamically gives us a lot of flexibility. We can easily change the gradient, say, to this funky pastel gradient:

```ts
const colors = [
  "hsl(141 75% 72%)",
  "hsl(41 90% 62%)",
  "hsl(358 64% 50%)",
];
```

<WebGLShader
  fragmentShader="simplex_noise_stacked_4"
  width={800}
  height={250}
  minWidth={600}
  maintainHeight={0.3}
  seed={12926}
  colorConfiguration="pastel"
/>

We'll soon use this in the final effect, but before we get to that, let's finish blending our waves.


## Dynamic blur

In the final effect, we see varying amounts of blur applied to each wave, with the amount of blur evolving:

<WebGLShader fragmentShader="final" skew height={275} minWidth={600} maintainHeight={0.3} seed={16192} />

Our current waves, however, have sharp edges:

<WebGLShader fragmentShader="multiple_waves" width={800} minWidth={600} height={200} maintainHeight={0.7} seed={9581} />

Let's get started building a dynamic blur. As a refresher, we're currently calculating the alpha of our waves like so:

```glsl
float x = gl_FragCoord.x;
float y = gl_FragCoord.y;

float wave_alpha(float Y, float wave_height) {
  float offset = Y * wave_height;
  float wave_y = Y + wave_noise(offset) * wave_height;
  float dist = wave_y - y;

  float alpha = clamp(0.5 + dist, 0.0, 1.0);
  return alpha;
}
```

Let's define a <Gl method>calc_blur</Gl> function that calculates the amount of blur to apply. We'll start simple with an increasing left-to-right blur over the width of the canvas:

```glsl
float calc_blur() {
  float t = x / (CANVAS_WIDTH - 1.0);
  float blur = mix(1.0, BLUR_AMOUNT, t);
  return blur;
}
```

We'll use it to calculate a <Gl>blur</Gl> value and divide <Gl>dist</Gl> by it -- like we did earlier in this post:

```glsl
float blur = calc_blur();
float alpha = clamp(0.5 + dist / blur, 0.0, 1.0);
```

This gives us a left-to-right blur:

<WebGLShader fragmentShader="multiple_waves_blur_0" width={800} minWidth={600} height={200} maintainHeight={0.7} seed={9581} usesVariables />

To make the blur dynamic, we'll yet again reach for the simplex noise function. The setup should feel familiar, it's almost identical to the <Gl method>wave_noise</Gl> function we defined earlier:

```glsl
float calc_blur() {
  const float L = 0.0018;
  const float S = 0.1;
  const float F = 0.034;
  
  float noise = simplex_noise(x * L + F * u_time, u_time * S);
  float t = (noise + 1.0) / 2.0;
  float blur = mix(1.0, BLUR_AMOUNT, t);
  return blur;
}
```

If we were to apply this as-is to our waves, each wave's blur would look identical. For the wave blurs to be distinct we'll need to add an offset to <Gl>u_time</Gl>.

Conveniently for us, we can reuse the same offset we calculated for the <Gl method>wave_noise</Gl> function:

```glsl
float calc_blur(float offset) {
  float time = u_time * offset;
  float noise = simplex_noise(x * L + F * time, time * S);
  // ...
}

float wave_alpha(float Y, float wave_height) {
  float offset = Y * wave_height;
  float wave_y = Y + wave_noise(offset) * wave_height;
  float blur = calc_blur(offset);
  // ...
}
```

This gives us a dynamic blur:

<WebGLShader fragmentShader="multiple_waves_blur_1" width={800} minWidth={600} height={200} maintainHeight={0.7} seed={9581} usesVariables />

But, honestly, the blur looks pretty bad. It feels like it has distinct "edges" at the top and bottom of each wave.

Also, the waves feel somewhat blurry all over, just unevenly so. We don't seem to get those long, sharp edges that appear in the final effect:

<WebGLShader fragmentShader="final" skew minWidth={600} maintainHeight={0.3} seed={16192} />

Let's start by fixing the harsh edges.


### Making our blur look better

Consider how we're calculating the alpha:

```glsl
float alpha = clamp(0.5 + dist / blur, 0.0, 1.0);
```

The alpha equals $0.5$ when the distance is $0$. It then linearly increases or decreases until it hits either $0.0$ or $1.0$, at which point the <Gl method>clamp</Gl> function kicks in.

Let's chart the alpha curve so that we can see this visually:

<Image src="~/dist-blur-linear-clamped.png" plain width={560} />

The harsh stops at $0.0$ and $1.0$ produce the sharp-feeling edges that we observe at the edges of the blur.

<WebGLShader fragmentShader="multiple_waves_blur_1" width={800} minWidth={600} height={200} maintainHeight={0.7} seed={9581} usesVariables />

The [smoothstep][smoothstep] function can help here. Smoothstep is a family of interpolation functions that, as the name suggests, smooth the transition from $0$ to $1$.

I'm defining <Gl method>smoothstep</Gl> like so:

```glsl
float smoothstep(float t) {
  return t * t * t * (t * (6.0 * t - 15.0) + 10.0);
}
```

<SmallNote label="" center>This is the ["quintic" variant][smoothstep_variants] of the smoothstep function. It applies a bit more smoothing than the "default" smoothstep implementation.</SmallNote>

[smoothstep_variants]: https://iquilezles.org/articles/smoothsteps/

Applying <Gl method>smoothstep</Gl> to our alpha curve is quite simple:

```glsl
float alpha = clamp(0.5 + dist / blur, 0.0, 1.0);
alpha = smoothstep(alpha);
```

Below is a chart showing the smoothed alpha curve -- I'll include the original non-smoothed curve for comparison:

[smoothstep]: https://en.wikipedia.org/wiki/Smoothstep

<Image src="~/dist-blur-smoothstep.png" plain width={560} />

This results in a _much_ smoother blur:

<WebGLShader fragmentShader="multiple_waves_blur_2" width={800} minWidth={600} height={200} showControls={false} maintainHeight={0.7} seed={9581} />

Following is a side-by-side comparison. The blur to the left is smoothed, while the right one is not.

<WebGLShader fragmentShader="multiple_waves_blur_2_side_by_side" width={800} minWidth={600} height={200} maintainHeight={0.7} seed={9581} usesVariables />

That takes care of the sharp edges. Let's now tackle the issue of the wave as a whole being too blurry.


### Making the wave less uniformly blurry

Here's our <Gl method>calc_blur</Gl> method as we left it:

```glsl
float calc_blur() {
  // ...
  float noise = simplex_noise(x * L + F * u_time, u_time * S);
  float t = (noise + 1.0) / 2.0;
  float blur = mix(1.0, BLUR_AMOUNT, t);
  return blur;
}
```

The edge becomes sharper as $t$ approaches $0$, and blurrier as $t$ approaches $1$. However, the wave only becomes sharp when $t$ is _very_ close to zero.

The canvas below has a visualization that illustrates this. The lower half is a chart showing the value of $t$ over the $x$ axis (with $t=0$ at the bottom to $t=1$ at the top):

<WebGLShader fragmentShader="multiple_waves_blur_3" width={800} minWidth={600} height={320} maintainHeight={0.7} seed={32839} showControls={false} />

You'll notice that the wave becomes sharp when the chart gets close to touching the bottom -- at values near zero -- but it rarely dips that low. The value of $t$ lingers around the middle too much, causing the wave to be _somewhat_ blurry over its entire length.

We can bias low values of $t$ to get close to $0$ by raising $t$ to a power — i.e. applying an exponent.

Consider how an exponent affects values between $0$ and $1$. Numbers close to $0$ experiece a strong pull towards $0$ while larger numbers experience less pull. For example, $0.1^2 = 0.01$, a 90% reduction, while $0.9^2 = 0.81$, only a reduction of 10%.

The level of pull depends on the exponent. Here's a chart of $x^2$ for values of $x$ between $0$ and $1$:

<Image src="~/x-pow-2-chart.png" plain width={500} />

This effect becomes more pronounced as we increase the exponent:

<p className="mathblock">$$0.1^3=0.001$$<br />$$0.9^3=0.729$$</p>

<SmallNote label="" center>$0.1$ got $99\%$ smaller while $0.9$ got roughly $20\%$ smaller!</SmallNote>

The following chart shows $x^n$ over the range $[0, 1]$ for different values of $n$:

<Image src="~/x-pow-n-chart.png" plain width={500} />

<SmallNote label="" center>Notice how an exponent of $1$ has no effect.</SmallNote>

As you can see, a higher exponent translates to a stronger pull towards zero.

With that, let's apply an exponent to $t$. We can do that with the built-in <Gl method>pow</Gl> function:

```glsl
float t = (noise + 1.0) / 2.0;
t = pow(t, exponent);
```

Below is a canvas that lets you vary the value of <Gl>exponent</Gl> from $0$ to $4$. I intentionally set <Gl>exponent</Gl> to a default value of $1$ (no effect) so that you can see the effect of increasing the exponent directly (the light-blue line that stays behind represents the value of $t$ prior to applying the exponent).

<WebGLShader fragmentShader="multiple_waves_blur_3" width={800} minWidth={600} height={320} maintainHeight={0.7} seed={18399} usesVariables />

As the exponent increases, $t$ tends to "hug" the bottom of the chart more and more. This produces noticeable periods of relative sharpness while not muting higher values of $t$ _too_ much. I feel like an exponent of $2.0$ to $2.7$ gives good results -- I'll go with $2.5$.

Let's bring back the other wave and see what we've got:

<WebGLShader fragmentShader="multiple_waves_blur_4" width={800} minWidth={600} height={200} maintainHeight={0.7} seed={18399} showControls={false} fragmentShaderOptions={{ value: 50 }} />

Applying an exponent does dampen the strength of the blur, so let's ramp the blur amount up -- I'll increase it from $50$ to $130$.

<WebGLShader fragmentShader="multiple_waves_blur_4" width={800} minWidth={600} height={200} maintainHeight={0.7} seed={18399} showControls={false} />

Now we're talking! We've got a pretty great-looking blur going!


## Putting it all together

We've got all of the individual pieces we need to construct our final effect -- let's finally put it together!

Each wave is represented by an alpha value:

```glsl
float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT);
float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT);
```

We're currently using those alpha values to blend three colors -- these three shades of blue from the previous section:

```glsl
vec3 bg_color = vec3(0.102, 0.208, 0.761);
vec3 wave1_color = vec3(0.094, 0.502, 0.910);
vec3 wave2_color = vec3(0.384, 0.827, 0.898);
```

The trick to our final effect lies in substituting each of those colors with a unique background noise and blending those.

We need our three background noises to be distinct. To support that we'll update our <Gl method>background_noise</Gl> function to take an offset value and add that to <Gl>u_time</Gl>. We've done this twice before so at this point this is just routine:

```glsl
float background_noise(float offset) {
  float time = u_time + offset;
  
  float noise = 0.5;
  noise += simplex_noise(..., time * S) * ...;
  noise += simplex_noise(..., time * S) * ...;
  // ...
  return clamp(noise, 0.0, 1.0);
}
```

We can now easily generate multiple distinct background noises. Let's start by interpreting the background noises as lightness values:

```glsl
float bg_lightness = background_noise(0.0);
float w1_lightness = background_noise(200.0);
float w2_lightness = background_noise(400.0);
```

We can blend these lightness values using the wave alpha values to calculate a final <Gl>lightness</Gl> value and pass <Gl>vec3(lightness)</Gl> to <Gl>gl_FragColor</Gl>:

```glsl
float lightness = bg_lightness;
lightness = mix(lightness, w1_lightness, w1_alpha);
lightness = mix(lightness, w2_lightness, w2_alpha);

gl_FragColor = vec4(vec3(lightness), 1.0);
```

This gives us the following effect:

<WebGLShader fragmentShader="final_effect_0" width={800} minWidth={600} height={200} maintainHeight={0.7} seed={30005} />

Just try to tell me that this effect doesn't look _absolutely sick!_ It's smooth, flowing, and quite dramatic at times.

The obvious next step is to map the final <Gl>lightness</Gl> value to a gradient. Let's use this one:

<WebGLShader fragmentShader="read_texture" width={256} height={64} colorConfiguration="default" />

Like before, we'll get the texture into our shader via a <Gl>uniform sampler2D</Gl>:

```glsl
uniform sampler2D u_gradient;
```

We then map the lightness value to the gradient like so:

```glsl
gl_FragColor = texture2D(u_gradient, vec2(lightness, 0.5));
```

This applies the gradient to our effect:

<WebGLShader fragmentShader="final_effect_1" width={800} minWidth={600} height={200} maintainHeight={0.7} seed={30005} />

Looks gorgeous. We can make this more sleek by increasing the height of the canvas a bit and adding a skew:

<WebGLShader fragmentShader="final_effect_1" skew minWidth={600} height={250} maintainHeight={0.7} seed={24560} />

Sick, right? This could be used to add a modern and elegant touch to any landing page. Implementing the skew effect is deceptively simple -- it's just a transform of <Css>skewY(-6deg)</Css>.

Since we're generating the gradient in JavaScript, we can easily swap out the gradient. Here's a canvas with a few cool gradients I picked:

<WebGLShader fragmentShader="final_effect_1" skew minWidth={600} height={250} maintainHeight={0.7} seed={30005} colorConfiguration={["blue_to_yellow", "green", "orange"]} />

It took a long time to get here, but we've ended up with something really cool.

## Final words

I hope this was a good introduction to writing shaders, and I hope I provided you with the tools and intuition to get started writing shaders yourself!

At the beginning of the post I promised to link to the final shader code, so [here it is][final_shader_code].

[final_shader_code]: https://github.com/alexharri/website/blob/eb9551dd73126857045035b378b194dbf923c675/src/components/WebGLShader/shaders/fragment/final.ts

The final shader includes a few additional elements that were not covered in the post. For example, the blur is calculated in multiple parts using an exponent range, adding a "haziness" element to the effect. I also added an oscillating "blur bias" to introduce periods of global blurriness and sharpness.

Take a look at this black-and-white version of the final effect and see if you can spot those elements (it's much easier to see without color):

<WebGLShader fragmentShader="final" skew height={275} minWidth={600} maintainHeight={0.3} seed={16192} colorConfiguration="black_white" />

I didn't cover these additional elements because they're not core to the effect -- they just add a layer of refinement. There are loads of ways in which you could tweak or add to the effect. I tried tons of ideas and kept those around because they worked very well. I suggest tweaking the code and trying to add some refinements yourself!

Huge thanks to my friends, [Gunnlaugur Þór Briem][gthb_linkedin] and [Eiríkur Fannar Torfason][eirikur_dev], for reading a draft version of this post -- they provided great feedback.

[gthb_linkedin]: https://www.linkedin.com/in/gunnlaugur-briem/
[eirikur_dev]: https://eirikur.dev/

Thanks so much for reading. Take what you learned and go write some awesome shaders!

-- Alex Harri
