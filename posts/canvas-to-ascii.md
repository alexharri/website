---
title: "Canvas to ASCII renderer"
---

Terminal-based LLM coding tools have been coming out left and right. A common motif accompanying those tools has been ASCII art, frequently animated.

I've noticed a few common issues with how people generate the ASCII characters, which leaves the ASCII art either feeling [jaggy][jaggies] or blurry. We can 

[jaggies]: https://en.wikipedia.org/wiki/Jaggies

In this post, let's dive into how we can generate sharp ASCII arts from a dynamic input image. Here's an example of what we'll build:

<AsciiScene height={540} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]}>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>

Let's get started!


## ASCII art


ASCII contains the following 95 printable characters, which are supported by pretty much every single monospace font:

[monospace]: https://en.wikipedia.org/wiki/Monospaced_font
[ascii]: https://en.wikipedia.org/wiki/ASCII

```text:no_ligatures
 !"#$%&\'()*+,-./
0123456789:;<=>?@
ABCDEFGHIJKLMNOPQRSTUVWXYZ
[\\]^_\`
abcdefghijklmnopqrstuvwxyz
{|}~
```

<SmallNote label="">These are the characters between code points 32-126 in the ASCII character set.</SmallNote>

ASCII art are images drawn with text using a [monospace][monospace] font, typically using only ASCII characters..


Here's an example of ASCII art:

```text:no_ligatures
                                              _.oo.
                      _.u[[/;:,.         .odMMMMMM'
                   .o888UU[[[/;:-.  .o@P^    MMM^
                  oN88888UU[[[/;::-.        dP^
                 dNMMNN888UU[[[/;:--.   .o@P^
               ,MMMMMMN888UU[[/;::-. o@^
                NNMMMNN888UU[[[/~.o@P^
                888888888UU[[[/o@^-..
               oI8888UU[[[/o@P^:--..
            .@^  YUU[[[/o@^;::---..
          oMP     ^/o@P^;:::---..
       .dMMM    .o@^ ^;::---...
      dMMMMMMM@^`       `^^^^
     YMMMUP^
      ^^
```

<SmallNote label="" center>Source: [https://paulbourke.net/dataformats/asciiart/](https://paulbourke.net/dataformats/asciiart/)</SmallNote>

ASCII art, especially when drawn by hand, can be really beautiful and clever. ASCII artists can achieve a lot by picking characters based on their shape and density. There is a [plethora][paulbourke_ascii] of [examples][star_wars_animation] of great ASCII art online.

[paulbourke_ascii]: https://paulbourke.net/dataformats/asciiart/
[star_wars_animation]: https://www.asciimation.co.nz/

In this post, we'll explore programmatically converting image data into ASCII art. There will be a strong focus on achieving excellent rendering results by using clever image processing techniques combined with some unique quirks of ASCII rendering.


## Converting image data into ASCII art

Since every character in a monospace font is equally wide and tall, we can split images into a grid, with each text character occupying a single cell of the grid.

Let's start with a simple 2D canvas:

<AsciiScene width={360} height={360} viewMode="canvas">
  <Scene2D scene="circle" />
</AsciiScene>

Monospace characters are typically taller than they are wide. For example, the monospace font in this blog is Fira Code, which has a width-to-height ratio of $0.6$.

The canvas above is $360 \times 360$. I'll pick a row height of $24$, which splits the canvas into $15$ rows. I'll also pick a column width of $20$, which gives us $18$ columns. Together, those constitute a $18 \times 15$ grid:

<AsciiScene width={360} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="transparent" hideAscii showGrid offsetAlign="left">
  <Scene2D scene="circle" />
</AsciiScene>

Our task is now to pick which character to place in each column. The simplest approach would be to calculate a lightness value for the cell and pick a character based on that.

We can get lightness values for each cell by sampling the lightness of the pixel at the cell's center:

<AsciiScene width={360} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="canvas" hideAscii showGrid offsetAlign="left" sampleQuality={1} showSamplingPoints alphabet="pixel-short">
  <Scene2D scene="circle" />
</AsciiScene>

We want each pixel's lightness as a value $L$ from $0$ to $1$, but our image data consists of pixels with RGB values.

We can use the following formula to convert an RGB color (with components values between $0$ and $255$) to a lightness value:

<p className="mathblock">$$ L = \dfrac{R \times 0.2126 + G \times 0.7152 + B \times 0.0722}{255} $$</p>

<SmallNote label="" center>Read more about [relative luminance][relative_luminance].</SmallNote>

[relative_luminance]: https://en.wikipedia.org/wiki/Relative_luminance#Relative_luminance_and_%22gamma_encoded%22_colorspaces

With a lightness value $L$ for each pixel, we can use that to determine the ASCII character to render.

### Mapping lightness values to ASCII characters

When picking a character from a lightness value, what we can look at is the "visual density" of each character. We can then pick the character whose density best matches the lightness value.

Consider, for example, the following characters ASCII characters:

```text
: - # = + @ * % .
```

We can sort them in approximate density order like so, with lower-density characters to the left, and high-density to the right:

```text
. : - = + * # % @
```

<SmallNote label="">That `:` comes before `-` is a matter of taste. They feel somewhat equally dense to me.</SmallNote>

Let's put these characters in an array:

```ts
const CHARS = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"]
// I added space as the first character
```

We can then map lightness values to characters in the array like so:

```ts
function getCharFromLightness(lightness: number) {
  const index = Math.floor(lightness * (CHARS.length - 1));
  return CHARS[index];
}
```

This maps low lightness values to low-density characters and high lightness values to high-density characters.

Rendering the circle from above with this method gives us this result:

<AsciiScene width={360} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="ascii" offsetAlign="left" sampleQuality={1} alphabet="pixel-short" increaseContrast>
  <Scene2D scene="circle" />
</AsciiScene>

That works... but the result is pretty ugly. We seem to always get `@` for cells that fall within the circle and a space for cells that fall outside.

Let's analyse what's happening to figure out what is going on.


## Downsampling

[Downsampling][image_scaling], in the context of image processing, is taking a larger image (in our case, the $360 \times 360$ canvas) and using that image's data to construct a lower resolution image (in our case, the $18 \times 15$ ASCII grid). The pixel values for the lower resolution image are calculated by sampling values from the higher resolution image.

[image_scaling]: https://en.wikipedia.org/wiki/Image_scaling

The simplest and fastest method of sampling is [nearest-neighbor interpolation][nearest_neighbor]. In nearest-neighbor interpolation, we take a single sample from the image that we're sampling from at the relative position of the pixel that we're collecting the sample for.

[nearest_neighbor]: https://en.wikipedia.org/wiki/Nearest-neighbor_interpolation

Let's quickly step through nearest-neighbor sampling using this rotating square example:

<AsciiScene width={600} minWidth={400} height={360} viewMode="canvas">
  <Scene2D scene="rotating_square" />
</AsciiScene>

We'll start by splitting the canvas into a grid, with each cell being $24 \times 24$ pixels. The grid represents the smaller (downsampled) image that's $24$ times smaller than the original image:

<AsciiScene width={600} minWidth={400} height={360} fontSize={20} rowHeight={24} columnWidth={24} viewMode="transparent" hideAscii showGrid offsetAlign="left" sampleQuality={1} alphabet="pixel-short">
  <Scene2D scene="rotating_square" />
</AsciiScene>

In nearest neighbor interpolation, we take a single sample. We'll take the sample at the center of each cell:

<AsciiScene width={600} minWidth={400} height={360} fontSize={20} rowHeight={24} columnWidth={24} viewMode="transparent" hideAscii showGrid showSamplingPoints offsetAlign="left" sampleQuality={1} alphabet="pixel-short">
  <Scene2D scene="rotating_square" />
</AsciiScene>

If we color each cell of our grid according to the sampled lightness value, we get the following image:

<AsciiScene width={600} minWidth={400} height={360} fontSize={20} rowHeight={24} columnWidth={24} viewMode="ascii" hideAscii pixelate offsetAlign="left" sampleQuality={1} alphabet="pixel-short">
  <Scene2D scene="rotating_square" />
</AsciiScene>

Notice the rough, jagged looking edges when the square is at an angle. Those are called [jaggies][jaggies], and they're a common artifact of nearest-neighbor interpolation.

[jaggies]: https://en.wikipedia.org/wiki/Jaggies

As we covered before, we can map the sampled lightness values to ASCII characters to create an ASCII rendering.

<AsciiScene width={600} minWidth={400} height={360} fontSize={20} rowHeight={24} columnWidth={24} viewMode="ascii" offsetAlign="left" sampleQuality={1} alphabet="pixel-short" increaseContrast>
  <Scene2D scene="rotating_square" />
</AsciiScene>

This is what was happening in our circle example above:

<AsciiScene width={360} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="ascii" sampleQuality={1} offsetAlign="left" alphabet="pixel-short" increaseContrast>
  <Scene2D scene="circle" />
</AsciiScene>

When we only sample a single pixel value, as is done in nearest-neighbor interpolation, the sampled pixel will either be inside of the circle or not, causing jaggies. Here's a zoomed in example where you can move the circle to illustrate:

<AsciiScene width={600} minWidth={400} height={360} fontSize={60} rowHeight={72} columnWidth={60} viewMode="transparent" showGrid offsetAlign="left" sampleQuality={1} showSamplingPoints alphabet="pixel-short" increaseContrast>
  <Scene2D scene="circle_zoomed" />
</AsciiScene>

Let's look at anti-aliasing techniques we can use to resolve the jaggies.

### Anti-aliasing

Consider this line:

<AsciiScene width={600} minWidth={200} height={360} rowHeight={40} columnWidth={40} viewMode="canvas" showControls={false}>
  <Scene2D scene="slanted_line" />
</AsciiScene>

The line's slope on the $y$ axis is $\dfrac{1}{3}x$. When we pixelate it with nearest-neighbor interpolation, we get the following:

<AsciiScene width={600} minWidth={200} height={360} rowHeight={40} columnWidth={40} hideAscii pixelate sampleQuality={1} alphabet="pixel-short" showControls={false}>
  <Scene2D scene="slanted_line" />
</AsciiScene>

We can get rid of the jagginess by taking multiple samples within each cell and using the average sampled lightness value to color the cell. Try varying the number of samples using the slider in the example below:

<AsciiScene width={600} minWidth={200} height={360} fontSize={40} rowHeight={40} columnWidth={40} viewModes={["ascii", "transparent", "canvas"]} hideAscii pixelate sampleQuality={3} alphabet="pixel-short" showSamplingPoints showGrid>
  <Scene2D scene="slanted_line" />
</AsciiScene>

With multiple samples, cells that lie on the edge of a shape will have some of its samples fall within the shape, and some outside of it. Averaging those, we get gray in-between color that smooth the downsampled rendering.

This method of collecting multiple samples from the larger image is called [supersampling][supersampling]. It's a common method of [anti-aliasing][anti_aliasing] (in other words, avoiding jaggies at edges).

[anti_aliasing]: https://en.wikipedia.org/wiki/Spatial_anti-aliasing
[supersampling]: https://en.wikipedia.org/wiki/Supersampling

Let's look at what supersampling does for the circle example from earlier. Try dragging the sample quality slider:

<AsciiScene width={360} height={408} fontSize={20} rowHeight={24} columnWidth={20} viewModes={["ascii", "transparent"]} alphabet="pixel-short" increaseContrast>
  <Scene2D scene="circle_sample_quality" />
</AsciiScene>

That looks alright -- the circle certainly looks smoother. Still, consider the bottom of the circle with the number of samples set to 4. It looks like so:

<AsciiScene width={360} height={120} fontSize={20} rowHeight={24} columnWidth={20} alphabet="pixel-short" increaseContrast sampleQuality={4}>
  <Scene2D scene="circle_bottom" />
</AsciiScene>

The choice of `.` at the edges of the bottom row is not very good. It doesn't really follow the shape of the circle very well. Take a look at the transparent view:

<AsciiScene width={360} height={120} fontSize={20} rowHeight={24} columnWidth={20} alphabet="pixel-short" increaseContrast sampleQuality={4} viewMode="transparent">
  <Scene2D scene="circle_bottom" />
</AsciiScene>

Those `.`s fall well outside of the actual circle.

This happens because, with four samples of a black and white image, we can only get 5 lightness values: 100%, 75%, 50%, 25% or 0%. Those 5 lightness values happen to map to the following characters:

* `@` for 100% lightness
* `%` for 75% lightness
* `*` for 50% lightness
* `.` for 25% lightness
* <code>&nbsp;</code> for 0% lightness

And for those cells at the edge of the bottom row, only one sample within the circle, so we get an average 25% lightness which resolves to `.`.

A better pick than `.` would be either `^` or `'`, since those characters would visually occupy the upper part of the cell. Still, if we swap out `.` in favor of `'` for this specific case, we'd just encounter the same problem in reverse at the top of the circle or when rendering some other image.

Increasing the number of samples also won't fix this issue either. No matter how many samples we take per cell, the samples will be averaged into a single lightness value. If we pick a character based on that single value, that character's shape might fit the underlying image well. It might not.

---

Our current approach doesn't really consider _which_ samples are light and which are dark. It just averages them into a single lightness value of picks a character based on that. By doing that, we're treating each ASCII characters as a single pixel within an image. This disregards that ASCII characters have shape.

We can make our ASCII renderings fara more crisp by picking characters based on their shape. Here's the circle rendered that way:

<AsciiScene width={360} height={408} fontSize={20} rowHeight={24} columnWidth={20} viewModes={["ascii", "transparent"]} sampleQuality={8}>
  <Scene2D scene="circle_raised" />
</AsciiScene>

Let's see how we can consider shape.


## Shape

So, what do I mean by shape?

Well, if we have a canvas with a diagonal split, for example:


<AsciiScene width={20 * 19} height={24 * 17} fontSize={20} rowHeight={24} columnWidth={20} viewModes={["ascii", "transparent"]} sampleQuality={3}>
  <Scene2D scene="diagonal_split" />
</AsciiScene>


When rendering an image as ASCII, we split the image into a grid. Each cell in that grid will be filled by a single ASCII character. So, for the region of the image that each cell represents, how do we pick the ASCII characters that best fits the image?








{/*
<AsciiScene height={650} fontSize={100} showSamplingCircles="raw" showSamplingPoints characterWidthMultiplier={1.25} characterHeightMultiplier={1.25} showGrid offsetAlign="center">
  <Scene2D scene="breathe" />
</AsciiScene>


<AsciiScene height={650} fontSize={20}>
  <Scene2D scene="shade-split" />
</AsciiScene>

<AsciiScene height={550} fontSize={100} viewModes={["transparent"]} showSamplingCircles="raw" characterWidthMultiplier={1.25} characterHeightMultiplier={1.25}>
  <Scene2D scene="shade_split_0" />
</AsciiScene>
*/}