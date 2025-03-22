---
title: "WebGL gradients"
description: ""
image: ""
publishedAt: ""
tags: []
---

A few weeks ago I rolled up my sleeves and embarked on a journey to produce a flowing gradient effect. Here's what I ended up with:

<WebGLShader fragmentShader="final" skew minWidth={600} maintainHeight={0.3} seed={16192} />

This effect is written in a WebGL shader, using noise functions to produce the flowing waves and dynamic blur. In this post, I'll break down how I created this effect. We'll learn about WebGL, fragment shaders, and we'll dive into noise functions.

Let's get to it!


## Color as a function of position

Building the gradient effect will boil down to writing a function that takes in a pixel position and returns a color value:

```ts
type Position = { x: number, y: number };

function pixelColor({ x, y }: Position): Color;
```

For every pixel on the canvas, we'll invoke the function with the pixel's position to determine the color of the pixel. You can think of this like so:

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

<SmallNote>When <Ts>x == 0</Ts>, we get a $t$ value of $0$, which gives us 100% red. When <Ts>x == canvas.width - 1</Ts> we get a $t$ value of $1$, which gives us 100% blue. If $t = 0.3$ we'd get 70% red and 30% blue.</SmallNote>

This produces red-to-blue gradient over the width of the canvas (the $x$ axis):

<WebGLShader fragmentShader="x_lerp" width={150} height={150} />

If we want an oscillating gradient (red to blue to red again, repeating), we can do that by using <Ts>sin(x)</Ts> to calculate the blending factor:

```ts
function pixelColor({ x, y }: Position): Color {
  let t = sin(x);
  t = (t + 1) / 2; // Normalize
  return mix(red, blue, t);
}
```

<SmallNote>$sin()$ returns a value between $-1$ and $1$, but our mixing function accepts a value from $0$ and $1$. For this reason, we normalize $t$ by remapping $[-1, 1]$ to $[0, 1]$ via $(t + 1)\,/\,2$.</SmallNote>

<WebGLShader fragmentShader="x_sine_lerp" width={150} height={150} fragmentShaderOptions={{ waveLength: Math.PI * 2 }} showControls={false} />

Those waves are quite thin! That's because we're oscillating between red and blue every $\pi$ pixels.

We can control the rate of oscillation by defining a [wave length][wave_len] multiplier. It will determine over how many pixels the gradient oscillates from red to blue and red again.

For a wave length of $L$ pixels the multiplier should be $\dfrac{2\pi}{L}$:

[wave_len]: https://en.wikipedia.org/wiki/Wavelength

```ts
const L = 40;
const toWaveLength = (2 * PI) / L;

function pixelColor({ x, y }: Position): Color {
  let t = sin(x * toWaveLength);
  // ...
}
```

This produces a oscillating gradient with the desired wave length:

<WebGLShader fragmentShader="x_sine_lerp" width={150} height={150} fragmentShaderOptions={{ waveLength: 40 }} />


### Adding motion

So far we've just been producing static images. To introduce motion, we'll update our color function to take in a <Ts>time</Ts> value as well.

```ts
function pixelColor({ x, y }: Position, time: number): Color;
```

We'll define <Ts>time</Ts> as the "elapsed" time, measured in seconds.

If add <Ts>time</Ts> to the pixel's $x$ position, we will simulate the canvas "scrolling" to the right one pixel a second:

```ts
let t = sin((x + time) * toWaveLength);
```

But scrolling one pixel a second is very slow. Let's add a speed constant $S$ to control the speed of the scrolling motion and multiply <Ts>time</Ts> by it:

```ts
const S = 20;

let t = sin((x + time * S) * toWaveLength);
```

Here's the result -- I'll let you vary $S$ so that you can adjust the speed:

<WebGLShader fragmentShader="x_sine_lerp_time" width={150} height={150} />

And voila -- we've got movement!

<ThreeDots />

These two inputs, time and the pixel's position, will be the main components that drive our final effect.

We'll spend the rest of the post writing a color function that will calculate a color for every pixel -- with the pixel's position and time as the function's inputs. Together, the colors of each pixel constitute a single frame of animation.

<WebGLShader fragmentShader="final" width={1000} height={250} />

But consider the amount of work that needs to be done. A $1{,}000 \times 250$ canvas, like the one above, contains $250{,}000$ pixels. That's $250{,}000$ invocations of our pixel function every frame -- a lot of work for a CPU thread to perform 60 times a second!

That's why we'll write our color function as a WebGL shader: WebGL shaders run on the GPU! The GPU is designed for pararellized work, which allows us to run the color function in parallel.

Conceptually, nothing changes. We're still going to be writing a single color function that takes a position and time value and returns a color. But instead of writing it in JavaScript and running it on the CPU, we'll write it in GLSL (the language for shaders) and run it on the GPU.


## WebGL and GLSL

WebGL can be thought of as a subset of [OpenGL][opengl], a cross-platform API for rendering graphics. WebGL is based on [OpenGL ES][opengl_es] -- an OpenGL spec for embedded systems (like mobile devices).

<SmallNote label="">Here's a page listing [differences between OpenGL and WebGL][opengl_vs_webgl]. We won't encounter those differences in this post.</SmallNote>

OpenGL shaders are written in GLSL, which stands for [OpenGL Shading Language][glsl]. It's a strongly typed language with a C-like syntax.

[opengl]: https://en.wikipedia.org/wiki/OpenGL
[opengl_es]: https://en.wikipedia.org/wiki/OpenGL_ES
[opengl_vs_webgl]: https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences
[glsl]: https://en.wikipedia.org/wiki/OpenGL_Shading_Language

There are two types of shaders, vertex shaders and fragment shaders, which serve different purposes. Our color function will run in the fragment shader (sometimes referred to as a "pixel shader"). That's where we'll spend most of our time.

<Note>
<p>There's tons of boilerplate code involved in setting up a WebGL rendering pipeline. I'll mostly omit it so that we can stay focused on our main goal, which is creating a cool gradient shader.</p>
<p>At the end of the post I'll link to resources I found helpful in learning about how to set up and work with WebGL.</p>
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

We can think of <Gl method>main</Gl> as our color function and <Gl>gl_FragColor</Gl> as its return value.

WebGL colors are represented through vectors with 3 or 4 components: <Gl>vec3</Gl> for RGB and <Gl>vec4</Gl> for RGBA colors. For both types the first three components of the vector are the red, green and blue components (RGB), and for 4D vectors the fourth component is the [alpha][alpha] component of the color.

[rgb]: https://en.wikipedia.org/wiki/RGB_color_model
[alpha]: https://en.wikipedia.org/wiki/Alpha_compositing

```glsl
vec3 red = vec3(1.0, 0.0, 0.0);
vec3 blue = vec3(0.0, 0.0, 1.0);
vec3 white = vec3(1.0, 1.0, 1.0);
vec4 semi_transparent_green = vec4(0.0, 1.0, 0.0, 0.5);
```

The color we saw in the shader above (<Gl>vec3(0.7, 0.1, 0.4)</Gl>) roughly translates to `rgba(178, 25, 102)` in CSS (`#b21966` in hex).

```glsl
void main() {
  vec4 color = vec4(0.7, 0.1, 0.4, 1.0);
  gl_FragColor = color;
}
```

If we run the shader, we see that every pixel is set to that color:

<WebGLShader fragmentShader="single_color" height={100} width={100} />

Let's create a linear gradient that fades to another color, such as `#e59919`, which corresponds to <Gl>vec3(0.9, 0.6, 0.1)</Gl>.

[glsl_to_hex]: https://airtightinteractive.com/util/hex-to-glsl/

```glsl
vec3 color_1 = vec3(0.7, 0.1, 0.4);
vec3 color_2 = vec3(0.9, 0.6, 0.1);
```

<SmallNote label="">I've been using [this tool][glsl_to_hex] to convert from hex to GLSL colors, and vice versa</SmallNote>

To gradually transition from <Gl>color_1</Gl> to <Gl>color_2</Gl> over the $y$ axis, we'll need the $y$ position of the current pixel. In WebGL fragment shaders, we get that via a special input variable called [<Gl>gl_FragCoord</Gl>][frag_coord]:

[frag_coord]: https://registry.khronos.org/OpenGL-Refpages/gl4/html/gl_FragCoord.xhtml

```glsl
float y = gl_FragCoord.y;
```
<SmallNote label=""><Gl>float</Gl> corresponds to a 32-bit floating point number. We'll only use the <Gl>float</Gl> and <Gl>int</Gl> number types in this post, which both use 32 bits.</SmallNote>

[glsl_data_types]: https://www.khronos.org/opengl/wiki/Data_Type_(GLSL)

We can then calculate a blend value -- which we'll call $t$ -- by dividing the <Gl>y</Gl> coord by the canvas height.


```glsl
// We'll learn how to make the canvas width dynamic later
const float CANVAS_WIDTH = 150.0;

float y = gl_FragCoord.y;
float t = y / (CANVAS_WIDTH - 1.0);
```

<SmallNote>I've configured the coordinates such that <Gl>gl_FragCoord</Gl> is <Gl>(0.0, 0.0)</Gl> at the lower-left corner and <Gl>(CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1)</Gl> at the upper right corner. This will stay consistent throughout the post.</SmallNote>

We can then mix the two colors via the [built-in <Gl method>mix</Gl> function][mix]. It takes in two colors and a blend value between 0 and 1.

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

But wait -- we get a compile-time error.

<blockquote className="monospace">ERROR: 'assign' : cannot convert from '3-component vector of float' to 'FragColor 4-component vector of float'</blockquote>

This error is a bit obtuse, but it's telling us that we can't assign our <Gl>vec3 color</Gl> to <Gl>gl_FragColor</Gl> because <Gl>gl_FragColor</Gl> is of type <Gl>vec4</Gl>.

In other words, we need to add an alpha component to <Gl>color</Gl> prior to passing it to <Gl>gl_FragColor</Gl>. We can do that like so:

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

I love this syntax, but enough about that -- back to writing shaders!


### Coloring the lower half white

Let's color the bottom half of our canvas white, like so:

<WebGLShader fragmentShader="linear_gradient_area_under_line" height={150} width={150} showControls={false} />

To do that, we'll first calculate the $y$ position of the canvas' midline:

```glsl
const float LINE_Y = CANVAS_HEIGHT * 0.5;
```

We can then determine the pixel's [signed][signed_distance] distance from the line through subtraction:

[signed_distance]: https://en.wikipedia.org/wiki/Signed_distance_function

```glsl
float y = gl_FragCoord.y;

float dist = LINE_Y - y;
```

What determines whether our pixel should be white is whether it's below the line, which we can determine by reading the sign of the distance via the <Gl method>sign</Gl> function. It returns $-1.0$ if the value is negative and $1.0$ if the value is positive.

```glsl
float dist = LINE_Y - y;

sign(dist); // -1.0 or 1.0
```

We can use the sign to calculate an alpha (blend) by normalizing the sign to $0.0$ or $1.0$, which we can do via $(dist\_sign + 1)\,/\,2$ since:

<p className="mathblock">$$\begin{align}
(-1 + 1)\,/\,2 = 0&\\
(1 + 1)\,/\,2 = 1&\\
\end{align}$$</p>

```glsl
float alpha = (sign(dist) + 1.0) / 2.0;
```

This <Gl>alpha</Gl> represents how white our pixel should be. If <Gl>alpha == 1.0</Gl> we want to color the pixel white, but if <Gl>alpha == 0.0</Gl> we want the pixel to retain the color from the linear gradient.

We can achieve exactly that by blending <Gl>color</Gl> (the linear gradient's color) and <Gl>white</Gl> using the <Gl method>mix</Gl> function:

```glsl
color = mix(color, white, alpha);
```

As we can see, this colors the bottom half of the canvas white:

<WebGLShader fragmentShader="linear_gradient_area_under_line" height={150} width={150} showControls={false} />


Calculating an alpha value by normalizing the sign and passing that to the <Gl method>mix</Gl> function may seem overly roundabout -- couldn't you just use an if statement?

```glsl
if (sign(dist) == 1.0) {
  color = white;
}
```

That works, but only if you want to pick one of the colors. As we extend this to smoothly blend between the colors, using the sign of the distance won't work.

<Note>
As an additional point, you generally want to avoid branching in code that runs on the GPU. There are [nuances][branch_nuances] to the performance of branches in shader code, but branchless code is usually preferable. In our case, calculating the <Gl>alpha</Gl> and running the <Gl method>mix</Gl> function boils down to sequential math instructions that GPUs excel at.
</Note>

[branch_nuances]: http://www.gamedev.net/forums/topic/712557-is-branching-logic-in-shaders-really-still-a-problem/5448827/


### Drawing arbitrary curves

We're currently coloring everything under <Gl>LINE_Y</Gl> constant white, but the line doesn't need to be determined constant -- we can calculate $y$ using any arbitrary expression. That allows us to draw the area under any curve white.

Let's, for example, define the curve $C$ as a slanted line

<p className="mathblock">$$ C = Y + x \times I $$</p>

where $Y$ is the start position of the line, and $I$ is the incline of the line. We can put this into code like so:

```glsl
const float Y = 0.4 * CANVAS_HEIGHT;
const float I = 0.2;

float x = gl_FragCoord.x;

float curve_y = Y + x * I;
```

This produces the slanted line in the canvas below -- I'll let you vary $I$ to see the effect:

<WebGLShader fragmentShader="linear_gradient_area_under_slanted_line" height={150} width={150} />

We could also do a parabola like so:

```glsl
// Adjust x=0 to be in the middle of the canvas
float x = gl_FragCoord.x - CANVAS_WIDTH / 2.0;

float curve_y = Y + pow(x, 2.0) / 40.0;
```

<WebGLShader fragmentShader="linear_gradient_area_under_exponential" height={150} width={150} showControls={false} />

We're still calculating the alpha in the same, simple manner:

```glsl
float dist = curve_y - gl_FragCoord.y;
float alpha = (sign(dist) + 1.0) / 2.0;
```

The point is that we can calculate the curve's $y$ in any way we see fit.

### Producing an animate wave

To produce a sine wave, we can define the curve as:

<p className="mathblock">$$C = Y + A \times sin(x \times \dfrac{2\pi}{L})$$</p>

where $Y$ is the wave's center (it's $y$ position), $L$ is the wave's length in pixels, and $A$ is the [amplitude][amplitude] of the wave.

[amplitude]: https://www.mathsisfun.com/algebra/amplitude-period-frequency-phase-shift.html

Putting this into code, we get:

```glsl
const float Y = 0.5 * CANVAS_HEIGHT;
const float A = 15.0;
const float L = 75.0;

const float W = (2.0 * PI) / L; // Wave length multiplier

float curve_y = Y + sin(x * W) * A;
```

Which produces a sine wave:

<WebGLShader fragmentShader="linear_gradient_area_under_wave" height={150} width={150} showControls={false} />

At the moment, the wave is completely static. For the shader to produce any motion, we'll need to provide the shader with a time variable. We can do that using [uniforms][uniform].

[uniform]: https://www.khronos.org/opengl/wiki/Uniform_(GLSL)

```glsl
uniform float u_time;
```

Uniforms can be thought of as global variables that the shader has _read-only_ access to. The actual values of uniforms are controlled on the JavaScript side (we'll see how later).

For any given draw call, each shader invocation will have uniforms set to the same values. This is what the name "uniform" is referring to -- the values of uniforms are _uniform_ across shader invocations. You can think of uniforms as per-draw-call constants.

<SmallNote label="">Uniforms are constant across a draw-call, but uniforms are [not compile-time constant][uniform_const], so you cannot use the value of a uniform in `const` variables.</SmallNote>

[uniform_const]: https://www.khronos.org/opengl/wiki/Type_Qualifier_(GLSL)#Uniforms

Uniform variables can be of many types, such as floats, vectors and textures (we'll cover textures later). They can even be of custom struct types:

```glsl
struct Foo {
  vec3 position;
  vec4 color;
}

uniform Foo u_foo;
```

But what's up with the <Gl>u_</Gl> prefix of <Gl>u_time</Gl>?

```glsl
uniform float u_time;
```

Prefixing uniform names with <Gl>u_</Gl> is a GLSL convention. You won't encounter compiler errors if you don't, but using the <Gl>u_</Gl> prefix for uniform names is a very established pattern.

Anyway, with <Gl>u_time</Gl> now accessible in our shader we can start producing motion. As a refresher, we're currently calculating our curve's $y$ value like so:

```glsl
float curve_y = Y + sin(x * W) * A;
```

Like we did early on in the post, we can add <Gl>u_time</Gl> to the $x$ position, multiplied by some constant that controls the speed, to shift the wave to the left:

```glsl
const float S = 25.0;

float curve_y = Y + sin((x + u_time * S) * W) * A;
```

Since <Gl>u_time</Gl> is the elapsed time in seconds, an $S$ value of $25$ causes the wave to move 25 pixels to the left per second. I'll let you vary $S$ to see the effect:

<WebGLShader fragmentShader="wave_animated" height={150} width={150} />

We've got a moving wave -- awesome!


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

We can calculate both the background color and foreground color for the current pixel using the same $t$ value (calculated via the pixel's $y$ position):

```glsl
float t = y / (CANVAS_HEIGHT - 1.0);

vec3 bg_color = mix(bg_color_1, bg_color_2, t);
vec3 fg_color = mix(fg_color_1, fg_color_2, t);
```

With the background color and foreground color calculated, we can blend them using <Gl>alpha</Gl>:

```glsl
float alpha = (sign(curve_y - y) + 1.0) / 2.0;

vec3 color = mix(bg_color, fg_color, alpha);
```

Which applies the foreground gradient to the wave:

<WebGLShader fragmentShader="wave_animated_2" height={150} width={150} showControls={false} />


## Adding blur

Take another look at the final animation and consider the role that blur plays. The waves in the animation slowly fluctuate between a blurry and a sharp state.

<WebGLShader fragmentShader="final" skew minWidth={600} maintainHeight={0.3} />

The blur isn't applied uniformly. The wave slowly transitions from being fully blurred to being only partially blurred -- or not blurred at all.

To simulate this effect, we'll need to be able to apply variable amounts of blur. As a step towards that, let's apply a gradually increasing blur across the horizontal axis, from left to right.

<WebGLShader fragmentShader="wave_animated_blur_left_to_right" height={150} width={250} />

### Gaussian blur

When thinking about how I'd approach the blur problem, my first thought was to use a [gaussian blur][gaussian_blur]. I figured I'd determine the amount of blur to apply via a [noise function][perlin_noise] and then sample neighboring pixels according to the blur amount.

[gaussian_blur]: https://en.wikipedia.org/wiki/Gaussian_blur
[perlin_noise]: https://en.wikipedia.org/wiki/Perlin_noise

That's a valid approach -- progressive blur in WebGL is certainly [feasible][progressive_blur] -- but in order to get a decent blur we'd need to sample lots of neighboring pixels, and the amount of pixels to sample only increases as the blur radius gets larger. Pur effect requires a very large blur, so that becomes expensive very quickly.

[progressive_blur]: https://tympanus.net/Tutorials/WebGLProgressiveBlur/

<SmallNote label="">Additionally, for us to be able to sample neighboring pixel alpha with any reasonable performance we'd need to calculate their alpha values up front. To do that we'd need to pre-render the alpha channel [into a texture][render_to_a_texture] for us to sample, which would require setting up another shader and render pass. Not a big deal, but it would add complexity.</SmallNote>

[render_to_a_texture]: https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html

I opted to take a different approach that doesn't require sampling neighboring pixels. Let's take a look.


### Calculate blur using signed distance


Let's look at how we're calculating the <Gl>alpha</Gl> again:

```glsl
float dist = curve_y - y;
float alpha = (sign(dist) + 1.0) / 2.0;
```

By taking the sign of our distance, we always get 0% or 100% opacity -- either fully transparent or completely opaque. Let's instead make <Gl>alpha</Gl> gradually transition from $0$ to $1$ over a certain distance of pixels, e.g. 50px. Let's define a constant for that:

```glsl
const float BLUR_AMOUNT = 50.0;
```

We'll then change the calculation for <Gl>alpha</Gl> to just be <Gl>dist / BLUR_AMOUNT</Gl>.

```glsl
float alpha = dist / BLUR_AMOUNT;
```

When <Gl>dist == 0.0</Gl>, the alpha will be $0.0$, and as <Gl>dist</Gl> approaches <Gl>BLUR_AMOUNT</Gl> the alpha approaches $1.0$. This will cause <Gl>alpha</Gl> to transition from $0$ to $1$ over the desired number of pixels, but we need to consider that

 * when <Gl>dist</Gl> exceeds <Gl>BLUR_AMOUNT</Gl> the alpha will go over $1.0$, and
 * the alpha becomes negative when <Gl>dist</Gl> is negative.
 
Neither of those are desirable -- alpha values should only range from $0$ to $1$ -- so we'll clamp <Gl>alpha</Gl> to the range $[0.0, 1.0]$ using the built-in <Gl method>clamp</Gl> function:

```glsl
float alpha = dist / BLUR_AMOUNT;
alpha = clamp(alpha, 0.0, 1.0);
```

This produces a blur effect, though you might notice that the wave "shifts down" as the blur increases -- try varying the amount of blur using the slider:

<WebGLShader fragmentShader="wave_animated_blur_down_even" height={150} width={250} />

Let's put that aside for the time being and make the blur gradually increasing from left to right. To gradually increase the blur, we can [linearly interpolate][lerp] from no blur to <Gl>BLUR_AMOUNT</Gl> over the $x$ axis like so:

[lerp]: https://en.wikipedia.org/wiki/Linear_interpolation

```glsl
float tx = gl_FragCoord.x / (CANVAS_WIDTH - 1)
float blur_amount = mix(1.0, BLUR_AMOUNT, tx);
```

By using <Gl>blur_amount</Gl> to calculate the alpha, we get a gradually increasing blur:

```glsl
float alpha = dist / blur_amount;
alpha = clamp(alpha, 0.0, 1.0);
```

<WebGLShader fragmentShader="wave_animated_blur_down" height={150} width={250} />

Let's now fix how the wave shifts down as <Gl>blur_amount</Gl> increases. Consider why the wave shifts down as the blur increases:

 * For pixels where <Gl>{"dist <= 0"}</Gl> the alpha is $0$ regardless of the value of <Gl>blur_amount</Gl>, thus the top of the wave stays fixed.
 * At the same time, the alpha is $1$ for all pixels where <Gl>{"dist >= blur_amount"}</Gl>, which shifts the bottom of the wave down as the blur increases.

What we want is for <Gl>alpha</Gl> to be $0.5$ when <Gl>{"dist == 0"}</Gl>, which we can do by starting <Gl>alpha</Gl> at $0.5$:

```glsl
float alpha = 0.5 + dist / blur_amount;
alpha = clamp(alpha, 0.0, 1.0);
```

This causes the top of the wave to shift up by <Gl>-blur_amount / 2</Gl> and the bottom of the wave to shift down by <Gl>blur_amount / 2</Gl>, keeping the wave centered:

<WebGLShader fragmentShader="wave_animated_blur_left_to_right" height={150} width={250} />

We'll tweak the blur later on to make it look really good, but this forms the basis for how we'll calculate our blur.

Let's now and work on creating a natural-looking wave effect.


## Creating a natural wave

If you look at the final gradient, you'll see that the waves look a lot more natural than the sine waves we've been working with so far. I'll disable the blur so that you can see the waves better.

<WebGLShader fragmentShader="final" fragmentShaderOptions={{ blurAmount: 10 }} skew minWidth={600} maintainHeight={0.3} />


There's loads of ways that you could go about creating such a wave, but I'll show you the two.


### Stacked sine waves

I often reach for stacked sine waves when I need a simple and natural wave-like noise function. Here's an example:

<WebGLShader fragmentShader="sine_stack_final" width={800} height={200} maintainHeight={0.7} />

The idea is to sum the output of multiple sine waves with different wave lengths, amplitudes, and phase speeds.

<p align="center">Take the following pure sine waves:</p>

<WebGLShader fragmentShader="sine_stack_decomposed" width={600} height={250} maintainHeight={0.7} />

<p align="center" style={{ marginBottom: -40 }}>If you sum their output, you get an interesting final wave:</p>

<WebGLShader fragmentShader="sine_stack_composed" width={600} height={170} maintainHeight={0.7} />

<p style={{ marginTop: -24 }}>Each individual pure sine has input components -- an $x$ position and a time value -- that been scaled differently. An individual wave's equation can be described as</p>

<p className="mathblock">$$\sin(x \times L + \text{time} \times S) \times A$$</p>

where the $L$, $S$ and $A$ components are scalars controling different aspects of the wave:

 * $L$ determines the wave length,
 * $S$ determines the phase evolution speed, and
 * $A$ determines the amplitude of the wave.

The final wave can be described as the sum of $N$ such waves:

<p className="mathblock">$$\begin{align}
\sum_{n=1}^{N}\ \sin(x \times L_n + \text{time} \times S_n) \times A_n\\
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

The problem, then, is finding $L$, $S$, $A$ scalars for each individual sine wave that, when stacked, produce a nice looking final wave.

In finding those values, I first create a "baseline wave" with the $L$, $S$, $A$ components set to values that _feel_ right.

```glsl
const float L = 0.011;
const float S = 0.28;
const float A = 32.0;

float y = sin(x * L + u_time * S) * A;
```

These constants produce the following wave:

<WebGLShader fragmentShader="sine_stack_0" width={800} height={200} />

The wave looks roughly what I want the final wave to look like, so these are good basline values for the $L$, $S$, $A$ components.

I then add more sine waves that use the baseline $L$, $S$, $A$ components, scaled by some constants. After some trial and error, I ended up with the following:

```glsl
float y = 0.0;
y += sin(x * (L / 1.000) + u_time * 0.90 * S) * A * 0.64;
y += sin(x * (L / 1.153) + u_time * 1.15 * S) * A * 0.40;
y += sin(x * (L / 1.622) + u_time * 0.75 * S) * A * 0.48;
y += sin(x * (L / 1.871) + u_time * 0.65 * S) * A * 0.43;
y += sin(x * (L / 2.013) + u_time * 1.05 * S) * A * 0.32;
```

<SmallNote label="">The "unevenness" of the wavelength and phase speed scalars ($L$, $S$) is intentional. The idea is to make it unlikely for many of the waves to converge at the same time because that would result in excessive amounts of [constructive and destructive interference][interference].</SmallNote>

[interference]: https://en.wikipedia.org/wiki/Wave_interference

These five sine waves give us quite a fairly natural looking final wave:

<WebGLShader fragmentShader="sine_stack_2" width={800} height={200} />

But there's one aspect that I don't like: the wave feels like it's moving left at a fairly even rate. That's not surprising considering that each individual wave is moving left at a constant rate.

We can counteract that by making the phase evolution of some waves negative:

```glsl
float y = 0.0;
y += sin(x * (L / 1.000) + u_time *  0.90 * S) * A * 0.64;
y += sin(x * (L / 1.153) + u_time *  1.15 * S) * A * 0.40;
y += sin(x * (L / 1.622) + u_time * -0.75 * S) * A * 0.48;
y += sin(x * (L / 1.871) + u_time *  0.65 * S) * A * 0.43;
y += sin(x * (L / 2.013) + u_time * -1.05 * S) * A * 0.32;
```

Looking at the wave now, it fluctuates between flowing to the left or right with periods of relative stillness.

<WebGLShader fragmentShader="sine_stack_3" width={800} height={200} />

Because all of the sine waves are relative to $L$, $S$, $A$, we can tune the waves as a whole by adjusting those constants -- increase $S$ to make the wave faster, $L$ to make the waves shorter, and $A$ to make the waves taller -- I'll let you vary $L$ and $S$ to see the effect:

<WebGLShader fragmentShader="sine_stack_3_LSA" width={800} height={200} />

We've gotten a pretty natural looking wave by stacking pure sine waves, but we won't actually make use of stacked sine waves in our final effect.

However, we _will_ use the idea of stacking noise of different scales and speeds. It's a really powerful idea. When used with better noise functions, stacking will help us achieve _really_ good looking noise.

With that being said, let's look at some real noise functions.


### Simplex noise

[Simplex noise][simplex_noise] is a family of $n$-dimensional gradient noise functions designed by [Ken Perlin][ken_perlin], the inventor of "classic" [perlin noise][perlin_noise]. Simplex noise was designed to address some of the [drawbacks][perlin_drawbacks] of perlin noise.

[simplex_noise]: https://en.wikipedia.org/wiki/Simplex_noise
[perlin_noise]: https://en.wikipedia.org/wiki/Perlin_noise
[ken_perlin]: https://en.wikipedia.org/wiki/Ken_Perlin
[perlin_drawbacks]: https://noiseposti.ng/posts/2022-01-16-The-Perlin-Problem-Moving-Past-Square-Noise.html

The dimensionality of a simplex noise functions refers to how many numeric input values the function takes (the 2D simplex noise function takes in two numeric arguments while the 3D function takes three). However, all simplex noise functions return a single numeric value between $1$ and $-1$.

2D simplex noise is frequently used, for example, to [procedurally generate terrain][generate_terrain] in video games. Here's an example texture created using 2D simplex noise that could be used as a height map:

[generate_terrain]: https://www.redblobgames.com/maps/terrain-from-noise/

<WebGLShader fragmentShader="simplex_noise" width={400} height={250} animate={false} showControls={false} />

This texture was generated by calculating the lightness of each pixel using the output of the 2D simplex noise function with the pixel's $(x, y)$ position as the input.

```glsl
const float L = 0.02;

float x = gl_FragCoord.x * L;
float y = gl_FragCoord.y * L;

float lightness = (simplex_noise(x, y) + 1.0) / 2.0;

gl_FragColor = vec4(vec3(lightness), 1.0);
```

The $L$ scalar controls the scale of the $(x, y)$ coordinates. As $L$ increases, the noise becomes more granular. Here's a canvas that let's you adjust $L$ to see the effect:

<WebGLShader fragmentShader="simplex_noise" width={400} height={250} animate={false} />

We'll use 2D simplex noise to create an animated 1D wave. How exactly we'll do that may be very obvious, so let's visualize and break it down.


## 1D animation using 2D noise

Interpreting the output of a 2D gradient noise function as a third coordinate gives us a 3D surface. Take this array of points:

<Scene autoRotate scene="simplex-point-array" height={350} />

The points are arranged in a grid configuration on the $x$ and $z$ axes, with the $y$ position of each point being derived from the output of <Gl>simplex_noise(x, z)</Gl>:

```ts
for (const point of points) {
  const { x, z } = point.position;
  point.position.y = simplex_noise(x, z);
}
```

But how does all of this relate to generating an animated wave?

Consider what happens if we use time as the $z$ position. As time passes, the $z$ position moves forward, giving us different 1D slices of the $y$ values of the surface along the $x$ axis. Here's a visualization:

<Scene autoRotate scene="simplex" height={480} angle={-18} xRotation={154} />

<SmallNote label="" center>TODO: Fix negative angle</SmallNote>

Putting this in code for our 2D canvas is quite simple:

```glsl
uniform float u_time;

const float L = 0.0015;
const float S = 0.12;
const float A = 40.0;

float x = gl_FragCoord.x;

float curve_y = Y + simplex_noise(x * L, u_time * S) * A;
```

This gives us a smooth animated wave:

<WebGLShader fragmentShader="simplex_wave" width={800} height={200} />

<SmallNote label="" center>Just a single simplex noise function call already produces a very natural-looking wave!</SmallNote>

Like before, there are three scalars that determine the characteristics of our wave: $L$, $S$ and $A$. We scale $x$ by $L$ to make the wave shorter or longer on the horizontal axis:

<p className="mathblock">$$\text{simplex}(x \times L,\ \text{time})$$</p>

We then scale $\text{time}$ by $S$ to speed up or slow down the evolution of our wave -- the speed at which we move across the $z$ axis in the visualization above:

<p className="mathblock">$$\text{simplex}(x \times L,\ \text{time} \times S)$$</p>

Lastly, we scale the output of the $\text{simplex}$ function by $A$, which determines the amplitude (height) of our wave.

<p className="mathblock">$$\text{simplex}(x \times L,\ \text{time} \times S) \times A$$</p>

<SmallNote label="" center>As mentioned before, simplex noise returns a value between $1$ and $-1$, so to make a wave with a height of $96$ you'd set $A$ to $48$.</SmallNote>

All of this produces a pretty good looking wave, though it feels a bit simple. The peaks and valleys look too evenly spaced and predictable.

<WebGLShader fragmentShader="simplex_wave" width={800} height={200} />

This is where stacking comes in. We can stack simplex waves of various lengths and speeds to get a more interesting final wave. I tweaked the constants and added a few increasingly large waves -- some slower and some faster. Here's what I ended up with:

```glsl
const float L = 0.0018;
const float S = 0.04;
const float A = 32.0;

float y = 0.0;
y += simplex_noise(x * (L / 1.00), u_time * S * 1.00)) * A * 0.85;
y += simplex_noise(x * (L / 1.30), u_time * S * 1.26)) * A * 1.15;
y += simplex_noise(x * (L / 1.86), u_time * S * 1.09)) * A * 0.60;
y += simplex_noise(x * (L / 3.25), u_time * S * 0.89)) * A * 0.40;
```

This produces a wave that feels natural, yet visually interesting.

<WebGLShader fragmentShader="simplex_stack_1" width={800} height={200} />

Looks awesome, but there is one component I feel is missing, which is directional flow. The wave is too "still", which makes it feel a bit artificial.

To make the wave flow left, we can add <Gl>u_time</Gl> to the <Gl>x</Gl> component, scaled by some constant that determines the amount of flow. Let's name that constant $F$.

```glsl
const float F = 0.031;

float y = 0.0;
y += simplex_noise(x * (L / 1.00) + F * u_time, ...) * ...;
y += simplex_noise(x * (L / 1.30) + F * u_time, ...) * ...;
y += simplex_noise(x * (L / 1.86) + F * u_time, ...) * ...;
y += simplex_noise(x * (L / 3.25) + F * u_time, ...) * ...;
```

This adds a subtle flow to the wave. I'll let you vary the amount of flow to feel the difference it makes:

<WebGLShader fragmentShader="simplex_stack_final" width={800} height={200} />

<SmallNote label="" center>The amount of flow at 1x may feel a bit suble, but that's intentional. If the flow is easily noticeable, there's too much of it.</SmallNote>

I think we've got a good looking wave. Let's move onto the next step.


## Multiple waves

Let's now update our shader to include multiple waves. As a first step, I'll create a reusable <Gl>wave_alpha</Gl> function that takes in a $y$ position and height for the wave.

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

We'll use that to calculate the wave's $y$ position:

```glsl
float wave_alpha(float Y, float wave_height) {
  float wave_y = Y + wave_noise() * wave_height;
}
```

which we'll then use to calculate the distance from the wave to the pixel's $y$ position, using that to calculate the value of <Gl>alpha</Gl>:

```glsl
float wave_alpha(float Y, float wave_height) {
  float wave_y = Y + wave_noise() * wave_height;
  float dist = (wave_y - y);
  float alpha = clamp(0.5 + dist, 0.0, 1.0);
  return alpha;
}
```

We can then use the <Gl>wave_alpha</Gl> function to calculate alpha values for two waves, each with their separate $y$ positions and heights:

```glsl
const float WAVE1_HEIGHT = 24.0;
const float WAVE2_HEIGHT = 32.0;
const float WAVE1_Y = 0.80 * CANVAS_HEIGHT;
const float WAVE2_Y = 0.35 * CANVAS_HEIGHT;

float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT);
float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT);
```

To render a background and two waves, we'll need three colors. I picked these blue colors that I find nice to look at:

```glsl
vec3 bg_color = vec3(0.102, 0.208, 0.761);
vec3 w1_color = vec3(0.094, 0.502, 0.910);
vec3 w2_color = vec3(0.384, 0.827, 0.898);
```

We can composite those into a final image by blending them using the two wave alpha values:

```glsl
vec3 color = bg_color;
color = mix(color, w1_color, w1_alpha);
color = mix(color, w2_color, w2_alpha);
gl_FragColor = vec4(color, 1.0);
```

This gives us the following result:

<WebGLShader fragmentShader="multiple_waves" width={800} height={200} fragmentShaderOptions={{ offsetScalar: 0 }} />

We do get two waves, but they're completely in sync with each other. This makes sense because the only inputs to our noise functions are the pixel's $x$ position and time, which are identical for both waves.

To fix this we'll introduce wave-specific offsets that we pass to the noise functions. One way to do that is just to provide each wave with a literal <Gl>offset</Gl> value and pass that to the noise function:

```glsl
float wave_alpha(float Y, float wave_height, float offset) {
  wave_noise(offset);
  // ...
}

float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT, -72.2);
float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT, 163.9);
```

The <Gl method>wave_noise</Gl> function could then add <Gl>offset</Gl> to <Gl>u_time</Gl> and use that when calculating the noise.

```glsl
float wave_noise(float offset) {
  float time = u_time + offset;

  float noise = 0.0;
  noise += simplex_noise(x * L + F * time, time * S) * A;
  // ...
}
```

This produces identical waves, just offset in time. By making the offset large enough, you get waves far enough apart that no one could possibly notice that they're the same wave.

But we don't actually need to provide the offset manually. We can just calculate an offset in the <Gl method>wave_alpha</Gl> function using the Y and height components:

```glsl
float wave_alpha(float Y, float wave_height) {
  float offset = Y * wave_height;
  wave_noise(offset);
  // ...
}
```

Using the constants for our two waves from above, and a canvas height of $200$, we get two offsets:

<p className="mathblock">$$\begin{align}
24 \times 0.80 \times 200 = 3{,}840 &\\
32 \times 0.35 \times 200 = 2{,}240 &\\
\end{align}$$</p>

With these offsets added to $\text{time}$, the two waves become spaced apart by $1{,}600$ seconds. No one's gonna notice that.

<SmallNote label="">How random and far apart your offsets needs to be ultimately depend on your application. If you need really random offsets, you can use more complicated methods to calculate them, but we just need the offsets not to be very close (a difference of 50 would do the trick).</SmallNote>

With the offsets added, we get two distinct waves:

<WebGLShader fragmentShader="multiple_waves" width={800} height={200} />

Having updated our shader to handle multiple waves, let's move onto making the color of our waves dynamic.


## Background noise

To generate the noise for the waves above, we used a 2D noise function to generate animated 1D noise.

That pattern holds for higher dimensions as well -- when generating $n$ dimensional noise, we need use an $n + 1$-dimensional noise function with $\text{time}$ as the value of the last dimension.

Here's the static 2D simplex noise we saw earlier:

<WebGLShader fragmentShader="simplex_noise" width={350} height={250} animate={false} showControls={false} />

To animate it, we'll use a 3D simplex noise function with the signature:

```glsl
float simplex_noise(float x, float y, float z);
```

We'll pass the pixel's $x$ and $y$ positions as the first two arguments, and $\text{time}$ as the third argument.

```glsl
const float L = 0.02;
const float S = 0.6;

float x = gl_FragCoord.x;
float y = gl_FragCoord.y;

simplex_noise(x * L, y * L, time * S);
```

We use the simplex noise to calculate a lightness value, which we use as the color of the pixel:

```glsl
float lightness = (simplex_noise(...) + 1.0) / 2.0;

gl_FragColor = vec4(vec3(lightness), 1.0);
```

This gives us animated 2D noise:

<WebGLShader fragmentShader="simplex_noise" width={350} height={250} showControls={false} />

It's worth mentioning that we could use classic perlin noise instead of simplex. Perlin noise has been in use longer and is more popular than simplex noise, but I find perlin a bit too "blocky". Simplex noise, by comparison, feels more natural to me. Here's a side-by-side comparison:

<WebGLShader fragmentShader="simplex_perlin_split" width={800} height={250} />

<SmallNote label="" center>Perlin noise is left, simplex noise is right.</SmallNote>

Anyway, our goal is for this noise to eventually be used to create the background color of our final gradient:

<WebGLShader fragmentShader="final" skew minWidth={600} maintainHeight={0.3} />

For our background noise to start looking like that we'll need to make some adjustments. Let's scale up the noise and also make the scale of the noise larger on the $x$ axis than the $y$ axis.

Here is a canvas where the noise has been scaled up by $11$, and the $y$ scale is $3$ times smaller than the $x$
 scale -- I'll let you control the scale ($L$) to see the effect. I also slowed the evolution down to a fifth of its prior speed.

<WebGLShader
  fragmentShader="simplex_noise"
  width={800}
  height={250}
  fragmentShaderOptions={{ L: 0.0017, yScale: 3.0, timeScale: 0.2 }}
/>

Looks pretty good, but the noise feels a bit too evenly spaced. Yet again, we'll use stacking to make the noise more interesting.

After some constant tweaking, here's what I came up with:

```glsl
const float L = 0.0015;
const float S = 0.13;
const float Y_SCALE = 3.0;

float x = gl_FragCoord.x;
float y = gl_FragCoord.y * Y_SCALE;

float noise = 0.5;
noise += simplex_noise(x * L * 1.0, y * L * 1.00, time * S + O1) * 0.30;
noise += simplex_noise(x * L * 0.6, y * L * 0.85, time * S + O2) * 0.26;
noise += simplex_noise(x * L * 0.4, y * L * 0.70, time * S + O3) * 0.22;

float lightness = clamp(noise, 0.0, 1.0);
```

This gives us more interesting noise. The larger noise provides smooth, sweeping fades, and the smaller noise gives us finer detail and visual interest:

<WebGLShader fragmentShader="simplex_noise_stacked_0" width={800} height={250} />

As a final cherry on top, I want to add a directional flow component. I'll make two of the noises drift left, and the other drift right.

```glsl
float F = 0.11 * u_time;

float sum = 0.5;
sum += simplex_noise(x ... +  F * 1.0, ..., ...) * ...;
sum += simplex_noise(x ... + -F * 0.6, ..., ...) * ...;
sum += simplex_noise(x ... +  F * 0.8, ..., ...) * ...;

float lightness = clamp(sum, 0.0, 1.0);
```

Here's what that looks like (you can vary the amount of flow to better see the effect):

<WebGLShader fragmentShader="simplex_noise_stacked_1" width={800} height={250} />

This makes the background noise generally flow to the left -- but not uniformly so.

I think this is looking quite good! We'll make this a bit cleaner by moving these calculations into a <Gl method>background_noise</Gl> method that returns a value between $0$ to $1$:

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

Let's move beyond black and white background noise and add some color to the mix!


## Color mapping

We've saw examples of color mapping earlier when we interpolated between, for example, red and blue:

```glsl
vec3 red  = vec3(1.0, 0.0, 0.0);
vec3 blue = vec3(0.0, 0.0, 1.0);

float t = gl_FragCoord.x / (CANVAS_WIDTH - 1.0);

vec3 color = mix(red, blue, t);
```

In this case, we're mapping the $x$ positions of each pixel to a specific blend of red and blue.

<WebGLShader fragmentShader="x_lerp" width={150} height={150} />

Let's do the same thing for our background noise. Instead of using the background noise as a lightness value, let's map it to a blend of blue and red:

```glsl
float t = background_noise();
vec3 color = mix(blue, red, t);
```

This gives us a blue-to-red gradient:

<WebGLShader fragmentShader="simplex_noise_stacked_2" width={800} height={250} />

That's pretty cool, but I'd like to be able to map the $t$ value to _any_ gradient, such as this one:

<div className="flow" style={{
  height: 50,
  width: 300,
  background: `linear-gradient(90deg, rgba(8,0,143,1) 0%, rgba(250,0,32,1) 50%, rgba(255,204,43,1) 100%)`,
  margin: "40px auto",
}} />

The above gradient is a `<div>` element with the following CSS linear gradient as a background:

```css
background: linear-gradient(
  90deg,
  rgb(8, 0, 143) 0%,
  rgb(250, 0, 32) 50%,
  rgb(255, 204, 43) 100%
);
```

We can replicate this in a shader by defining the three colors of the gradient as three <Gl>vec3</Gl>s:

```glsl
vec3 color1 = vec3(0.031, 0.0, 0.561);
vec3 color2 = vec3(0.980, 0.0, 0.125);
vec3 color3 = vec3(1.0,   0.8, 0.169);
```

and mixing them using $t$ and some clever math:

```glsl
float t = gl_FragCoord.x / (CANVAS_WIDTH - 1.0);

vec3 color = color1;
color = mix(color, color2, min(1.0, t * 2.0));
color = mix(color, color3, max(0.0, (t - 0.5) * 2.0));
```

With this, we've replicated the CSS gradient in a shader:

<WebGLShader fragmentShader="three_point_gradient" width={300} height={50} />

We can put this into a function and use that function in our simplex background noise shader:

```glsl
vec3 calc_color(float t) {
  vec3 color = color1;
  color = mix(color, color2, min(1.0, t * 2.0));
  color = mix(color, color3, max(0.0, (t - 0.5) * 2.0));
  return color;
}

vec3 color = calc_color(background_noise());
gl_FragColor = vec4(calc_color(t), 1.0);
```

Doing that maps the background noise to the gradient:

<WebGLShader fragmentShader="simplex_noise_stacked_3" width={800} height={200} />

Our <Gl method>calc_color</Gl> function is set up to handle three-step gradients, but we can pretty easily create functions that handle gradients with $n$ stops. Here is an exampe of a 5-stop gradient:

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

This works. The above function produces the following rainbow:

<WebGLShader fragmentShader="rainbow" width={300} height={50} />

But this way of calculating the gradient is burdensome and not very flexible. If we want to change the gradient, we need to manually hardcode the gradient colors into our shader and adjust the function to handle the correct number of color stops. Hardcoding the colors also makes it impossible to dynamically determine the colors of the gradient at runtime.

Let's move on from hardcoding the gradient to reading the gradient from a texture.


## Reading the gradient from a texture

Textures are arrays of data. We can put many types of data into textures, but in our case we'll store image data in the texture.

We'll generate an image texture for our gradient in JavaScript and then pass that texture to our WebGL shader. The shader can then read data from that texture.

Before diving into how we read data from textures in shaders, let's create a image texture containing a gradient.


### Creating a linear gradient

I want to programmatically generate linear gradients for our shader with JavaScript. Doing that gives us full control of the gradient, and allows us to change it dynamically at runtime.

I used [this gradient generator][gradient_generator] to pick the following colors:

```ts
const colors = [
  "hsl(204deg 100% 22%)",
  "hsl(199deg 100% 29%)",
  "hsl(189deg 100% 32%)",
  "hsl(173deg 100% 33%)",
  "hsl(154deg 100% 39%)",
  "hsl( 89deg  70% 56%)",
  "hsl( 55deg 100% 50%)"
];
```

We'll create a temporary <Ts>canvas</Ts> element to render the gradient to:

```ts
const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 64;
const ctx = canvas.getContext("2d");
```

We'll then create a [<Ts>CanvasGradient</Ts>][canvas_gradient] via <Ts method>createLinearGradient</Ts> and write the colors to it:

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

Lastly, we'll set the newly created <Ts>linearGradient</Ts> as the active fill style and draw a rectangle over the canvas.

```ts
ctx.fillStyle = linearGradient;
ctx.fillRect(0, 0, width, height);
```

Here's what the canvas looks like after the <Gl method>fillRect</Gl> call:

<WebGLShader fragmentShader="read_texture" width={256} height={64} colorConfiguration="blue_to_yellow" />

[gradient_generator]: https://www.joshwcomeau.com/gradient-generator/

Now that we've rendered a linear gradient onto a canvas element, let's get it into our shader.

### Writing canvas contents to a texture

I won't cover this in detail -- I want to stay focused on shaders, not the WebGL API. I'll refer you to [this post on rendering to a texture][render_to_texture] if you want to explore this in more detail.

Anyway, the following code creates a WebGL texture and writes the canvas contents to it:

[render_to_texture]: https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html

```ts
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
gl.bindTexture(gl.TEXTURE_2D, null);
```

Let's look at how we can read this texture in our shader.

### Passing the texture our shader and reading from it

GLSL shaders read data from textures via [samplers][samplers]. Samplers are a function that accept texture coordinates and return the value of the texture at that position.

[samplers]: https://www.khronos.org/opengl/wiki/Sampler_(GLSL)

There are different sampler types for different value types: `isampler` for signed integers, `usampler` for unsigned integers, and `sampler` for floats. Our image texture contains floats so we'll use the unprefixed `sampler`.

Samplers also have dimensionality. You can have 1D, 2D or 3D samplers. Since we'll be reading from a 2D image texture, we'll use a `sampler2D`. If you were reading signed integers from a 3D texture, you'd use a `usampler3D`.

In the shader, we'll declare our sampler via a uniform. I'll name it <Gl>u_gradient</Gl>:

```glsl
uniform sampler2D u_gradient;
```

I won't cover how to pass the gradient texture to the WebGL shader on the JavaScript side -- I want to stay focused on the shader side -- but I'll refer you to [this post][webgl_textures] on WebGL textures.

[webgl_textures]: https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html

To read data from samplers, we'll need to use OpenGL's [texture lookup functions][texture_lookup_functions]. In our case, we're reading 2D image data, so we'll use the built-in <Gl method>texture2D</Gl> function.

[texture_lookup_functions]: https://www.khronos.org/opengl/wiki/Sampler_(GLSL)#Texture_lookup_functions

```glsl
texture2D(textureSampler, textureCoordinates2D);
```

<Gl method>texture2D</Gl> takes two arguments, a sampler and 2D texture coordinates. The coordinates are normalized so $(0, 0)$ is the top-left corner of the texture and $(1, 1)$ is the bottom-right corner of the texture.

<SmallNote>texture2D coordinates are typically normalized, but samplers may also use "texel space" coordinates which range from $[0, S]$ where $S$ is the size of the texture for that dimension.</SmallNote>

Here's our texture again, for reference:

<WebGLShader fragmentShader="read_texture" width={256} height={64} colorConfiguration="blue_to_yellow" />

The texture is uniform over the $y$ axis so we can just set the $y$ coordinate to $0.5$. We'll get the same color for any value of $y$ so it doesn't really matter what we choose.

As for the $x$ axis, reading the color at $x = 0.0$ should yield blue and at $x = 1.0$ we should get yellow. We can verify this with the following shader

```glsl
uniform sampler2D u_gradient;
uniform float u_x;

void main() {
  gl_FragColor = texture2D(u_gradient, vec2(u_x, 0.5));
}
```

As you slide $x$ from $0$ to $1$ in the canvas below, the color should change from blue to yellow:

<WebGLShader fragmentShader="read_texture_t" width={100} height={100} colorConfiguration="blue_to_yellow" />

It works! We can now map values between $0$ and $1$ to colors on the gradient.

### Applying a gradient to the background noise

Let's use this and map the background noise to the gradient. As a refresher, we've defined a <Gl method>background_noise</Gl> function that returns a value between $0$ and $1$:

```glsl
float background_noise() {
  float noise = 0.5;
  noise += simplex_noise(...);
  noise += simplex_noise(...);
  // ...

  return clamp(noise, 0.0, 1.0);
}
```

We can map output of <Gl method>background_noise</Gl> to a color from the gradient and return it like so:

```glsl
uniform sampler2D u_gradient;

float t = background_noise();

gl_FragColor = texture2D(u_gradient, vec2(t, 0.5));
```

As we can see, this has the effect of applying our gradient to the background noise:

<WebGLShader fragmentShader="simplex_noise_stacked_4" width={800} height={200} colorConfiguration="blue_to_yellow" />

Reading the linear gradient as a texture in our shader gives us a lot of flexibility in how we create the linear gradient. We can easily swap out the gradient dynamically, say, to this funky pastel gradient:

```css
linear-gradient(
  hsl(141 75% 72%) 0%,
  hsl(41 90% 62%) 50%,
  hsl(358 64% 50%) 100%
);
```

<WebGLShader fragmentShader="simplex_noise_stacked_4" width={800} height={200} colorConfiguration="pastel" />

We've covered a ton of ground! We've learned how to programmatically generate linear gradient textures and read them in WebGL shaders, using that to generate colorful background noise.

We'll soon use all of this in the final effect, but before we get to that, let's look at blending the waves.


## Dynamic blur

Currently, our waves have sharp edges:

<WebGLShader fragmentShader="multiple_waves" width={800} height={200} />

But in the final effect we see varying amounts of blur applied to each wave, with the amount of blur evolving over time.

<WebGLShader fragmentShader="final" skew minWidth={600} maintainHeight={0.3} />

Let's get started building this sort of blur. As a refresher, we're currently calculating the alpha of our waves like so:

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

To add blur we'll define a <Gl method>calc_blur</Gl> function to calculate the amount of blur to apply. We'll use it to calculate a <Gl>blur</Gl> value and divide <Gl>dist</Gl> by it, like so:

```glsl
float blur = calc_blur();
float alpha = clamp(0.5 + dist / blur, 0.0, 1.0);
```

This mimics how we applied blur in an earlier section.

Still, we've yet to define the <Gl method>calc_blur</Gl> function. Let's start off by applying a progressively increasing left-to-right blur over the width of the canvas like we did before:

```glsl
float calc_blur() {
  float t = x / (CANVAS_WIDTH - 1.0);
  float blur = mix(1.0, BLUR_AMOUNT, t);
  return blur;
}
```

<WebGLShader fragmentShader="multiple_waves_blur_0" width={800} height={200} />

Looks good! To make the blur dynamic, we'll yet again reach for simplex noise function. The setup should feel familiar -- it's almost identical to the <Gl method>wave_noise</Gl> function we defined earlier:

```glsl
float calc_blur() {
  const float L = 0.0018;
  const float S = 0.1;
  const float F = 0.034;
  
  float noise = simplexNoise(x * L + F * u_time, u_time * S);
  float t = (noise + 1.0) / 2.0;
  float blur = mix(1.0, BLUR_AMOUNT, t);
  return blur;
}
```

If we were to apply this as-is to our waves, each wave's blur would look identical. For the wave blurs to be distinct we'll need to apply an offset to <Gl>u_time</Gl>.

Conveniently for us, we can reuse the same offset we calculated for the <Gl method>wave_noise</Gl> function:

```glsl
float wave_alpha(float Y, float wave_height) {
  float offset = Y * wave_height;
  float wave_y = Y + wave_noise(x, offset) * wave_height;
  float blur = calc_blur(offset);
  // ...
}

float calc_blur(float offset) {
  float time = u_time * offset;
  float blur_fac = (simplexNoise(x * L + F * time, time * S) + 1.0) / 2.0;
  // ...
}
```

This works, we get a dynamic blur:

<WebGLShader fragmentShader="multiple_waves_blur_1" width={800} height={200} />

But honestly, it looks pretty bad. The blur looks harsh -- like it has distinct "edges" at the top and bottom.

Also, the whole wave feels somewhat blurry, just unevenly so. We don't seem to get those long, sharp edges that appear in the final effect:

<WebGLShader fragmentShader="final" skew minWidth={600} maintainHeight={0.3} />

Let's start off by fixing the harsh edges.


## Making our blur look better

Consider how we're calculating the alpha:

```glsl
float alpha = clamp(0.5 + dist_signed / blur, 0.0, 1.0);
```

The alpha equals $0.5$ when the distance is $0$, and it then linearly increases or decreases until it hits either $0.0$ or $1.0$, at which point the <Gl method>clamp</Gl> function kicks in.

This produces an alpha curve that looks like so:

<WebGLShader fragmentShader="alpha_curve_0" width={330} height={200} />

The harsh stops at $0.0$ and $1.0$ produce the sharp-feeling edges that we observe at the edges of the blur.

<WebGLShader fragmentShader="multiple_waves_blur_1" width={800} height={200} showControls={false} />

The [smoothstep][smoothstep] function can help here. Smoothstep is a family of interpolation functions that, as the name suggests, smooth the transition from $0$ to $1$. Here's a chart showing the output:

[smoothstep]: https://en.wikipedia.org/wiki/Smoothstep

<WebGLShader fragmentShader="alpha_curve_1" width={330} height={200} />

Applying it is simple -- we'll assign the result of <Gl>smoothstep(alpha)</Gl> to <Gl>alpha</Gl>:

```glsl
float alpha = clamp(0.5 + dist_signed / blur, 0.0, 1.0);
alpha = smoothstep(alpha);
```

This results in a smooth blur:

<WebGLShader fragmentShader="multiple_waves_blur_2" width={800} height={200} />

Following is a side-by-side comparison. The blur to the left is smoothed, while the right one is not.

<WebGLShader fragmentShader="multiple_waves_blur_2_side_by_side" width={800} height={200} />

That takes care of the sharp edges. Let's now tackle the issue of the wave as a whole being too blurry.


### Making the wave less uniformly blurry

Here's our <Gl method>calc_blur</Gl> method as we left it:

```glsl
float calc_blur() {
  // ...
  float noise = simplexNoise(x * L + F * u_time, u_time * S);
  float t = (noise + 1.0) / 2.0;
  float blur = mix(1.0, BLUR_AMOUNT, t);
  return blur;
}
```

The edge becomes sharper as $t$ approaches $0$, and blurrier as $t$ approaches $1$. However, the wave only becomes sharp when $t$ is _very_ close to zero.

Consider the visualization below. It visualizes the value of $t$ over the wave in the chart below the canvas:

<WebGLShader fragmentShader="multiple_waves_blur_4" width={800} height={320} showControls={false} />

<SmallNote label="" center>$t=1$ at the top of the chart, and $t=0$ at the bottom</SmallNote>

You'll notice that the wave gets sharp when the chart gets close to touching the bottom -- at values close to zero -- but it rarely gets close to zero. The $t$ value spends too much time around the middle, which causes the wave to be _somewhat_ blurry over its entire length.

We want to somehow bias $t$ such that it spends more time at values very close to zero, while still reaching values close to one. We can do this by applying an exponent to $t$.

Consider the what applying an exponent does to values in the range $[0, 1]$. Applying a power of $2$ to a value close to zero, such as $0.1$, gives us $0.01$:

<p className="mathblock">$$0.1^2=0.01$$</p>

while for $0.9$ we get $0.81$:

<p className="mathblock">$$0.9^2=0.81$$</p>

When exponentiating numbers between zero and one, numbers close to zero approach zero way faster than numbers close to one. Here's a chart for $x^2$ for values of $x$ between zero and one:

<WebGLShader fragmentShader="alpha_curve_2" width={330} height={200} showControls={false} />

This effect only gets more extreme as we increase the exponent. $0.1^3$ gives us $0.001$ while $0.9^3$ results in roughly $0.73$:

<p className="mathblock">$$0.1^3=0.001$$<br />$$0.9^3=0.729$$</p>

<SmallNote label="" center>$0.1$ got $99\%$ smaller while $0.9$ got roughly $20\%$ smaller!</SmallNote>

To get a feel for this, here's a chart of $x^n$ that lets you vary $n$:

<WebGLShader fragmentShader="alpha_curve_3" width={330} height={200} />

<SmallNote label="" center>Notice how an exponent of $1$ has no effect.</SmallNote>

With that, let's apply an exponent to $t$. We can do that with the built-in <Gl method>pow</Gl> function:

```glsl
float t = (noise + 1.0) / 2.0;
t = pow(t, exponent);
```

Here's a canvas that lets you vary the value of <Gl>exponent</Gl> from $0$ to $4$. I intentionally set <Gl>exponent</Gl> to a default value of $1$ (no effect) so that you can see the change occur as you increase it.

<WebGLShader fragmentShader="multiple_waves_blur_4" width={800} height={320} />

As you increase the exponent, $t$ tends to "hug" the floor of the chart more and more. This produces noticeable periods of relative sharpness while not muting higher values of $t$ too much. I feel like an exponent of $2.0$ to $2.7$ gives good results -- I'll go with $2.5$.

Let's bring back the other wave and see what we've got:

<WebGLShader fragmentShader="multiple_waves_blur_5" width={800} height={200} showControls={false} fragmentShaderOptions={{ value: 50 }} />

Hmm, the blur now feels a bit weak. Let's ramp it up -- I'll change the blur amount from $50$ to $130$:

<WebGLShader fragmentShader="multiple_waves_blur_5" width={800} height={200} />

Now we're talking! We've got a pretty great looking blur going!


## Putting it all together

We've got all of the individual pieces we need to construct our final effect -- let's finally put it together!

Each wave is represented by an alpha value:

```glsl
float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT);
float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT);
```

We're currently using those alpha values to blend these three blue colors:

```glsl
vec3 bg_color = vec3(0.102, 0.208, 0.761);
vec3 w1_color = vec3(0.094, 0.502, 0.910);
vec3 w2_color = vec3(0.384, 0.827, 0.898);
```

But the trick to our final effect lies in using <Gl method>background_noise</Gl> to generate three different, distinct background noises and blending those instead.

To be able to generate three distinct background noises, we'll have to update the <Gl method>background_noise</Gl> method to take an offset and add that to <Gl>u_time</Gl>. We've done this twice before, so at this point this is just routine:

```glsl
float background_noise(float offset) {
  float time = u_time + offset;
  
  float noise = 0.5;
  noise += simplexNoise(..., time * S) * ...;
  noise += simplexNoise(..., time * S) * ...;
  // ...
  return clamp(noise, 0.0, 1.0);
}
```

This allows us to generate multiple distinct background noises. Let's start off by interpreting the background noise as lightness values:

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

<WebGLShader fragmentShader="final_effect_0" width={800} height={200} />

Just try to tell me that this effect doesn't look _absolutely sick_! The effect we get is flowing, smooth and quite dramatic at times.

The only thing that's really left to do is mapping the final <Gl>lightness</Gl> value to a gradient. Let's use this one:

<WebGLShader fragmentShader="read_texture" width={256} height={64} colorConfiguration="default" />

Like before, we'll get the texture into our shader via a <Gl>uniform sampler2D</Gl>:

```glsl
uniform sampler2D u_gradient;
```

We then map the lightness value to the gradient, assigning the result to <Gl>gl_FragColor</Gl>:

```glsl
gl_FragColor = texture2D(u_gradient, vec2(lightness, 0.5));
```

This applies the gradient to our effect:

<WebGLShader fragmentShader="final_effect_1" width={800} height={200} />

Looks gorgeous. We can make this more sleek by increasing the height of the canvas a bit and adding a skew:

<WebGLShader fragmentShader="final_effect_1" height={250} skew />

Sick, right? This effect could be used to add a modern and elegant touch to any landing page.

We can apply any gradient to this effect. Below is a canvas that lets you pick the gradient:

<WebGLShader fragmentShader="final_effect_1" height={200} colorConfiguration="blue_to_yellow" />