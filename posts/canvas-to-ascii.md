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

I generally think of ASCII art as images drawn with text using a [monospace][monospace] font. The characters in the text used to draw the image can be of different character sets, the most common of which is [ASCII][ascii].

ASCII contains the following 95 printable characters, which are supported by pretty much every single monospace font in existence:

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

Hand-drawn ASCII art can be really beautiful and clever. The artist can achieve a lot by picking characters based on their shape and density. There is a [plethora][paulbourke_ascii] of [examples][star_wars_animation] of great ASCII art online.

[paulbourke_ascii]: https://paulbourke.net/dataformats/asciiart/
[star_wars_animation]: https://www.asciimation.co.nz/

This post will focus on the automatically converting image data into ASCII art, with a strong focus on achieving a similar quality and sharpness to the rendering as compared to a human picking characters.


## Converting image data into ASCII art

Since every character in a monospace font is equally wide and tall, we can split images into a grid, with each text character occupying a single cell of the grid.

Let's start with a simple 2D canvas:

<AsciiScene width={600} height={360} viewMode="canvas">
  <Scene2D scene="circle" />
</AsciiScene>

Monospace characters are typically taller than they are wide. For example, the monospace font in this blog is Fira Code, which has a width-to-height ratio of $0.6$.

The canvas above is $600 \times 360$. With a row height of $24$, we get $15$ rows. I'll also pick a column width of 20, which gives us 30 columns. Together, those give us a $30 \times 15$ grid:

<AsciiScene width={600} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="transparent" hideAscii showGrid offsetAlign="left">
  <Scene2D scene="circle" />
</AsciiScene>

Our task is now to pick which character to place in each column. The simplest approach would be to calculate a lightness value for the cell and pick a character based on that.

We can get lightness values for each cell by sampling the lightness of the pixel at the cell's center:

<AsciiScene width={600} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="transparent" hideAscii showGrid offsetAlign="left" sampleQuality={1} showSamplingPoints alphabet="pixel-short">
  <Scene2D scene="circle" />
</AsciiScene>

We want each pixel's lightness as a value $L$ from $0$ to $1$, but our image data consists of pixels with RGB values.

We can use the following formula to convert an RGB color (with components values of $0$ to $255$) to a lightness value:

<p className="mathblock">$$ L = \dfrac{R \times 0.2126 + G \times 0.7152 + B \times 0.0722}{255} $$</p>

<SmallNote label="" center>Read more about [relative luminance][relative_luminance].</SmallNote>

[relative_luminance]: https://en.wikipedia.org/wiki/Relative_luminance#Relative_luminance_and_%22gamma_encoded%22_colorspaces

With a lightness value $L$ for each pixel, we can use that to determine the ASCII character to render.

### Picking characters from lightness values

When picking a character from a lightness value, what we can look at is the "visual density" of each character. We can then pick the character whose density best matches the lightness value.

Consider, for example, the following characters ASCII characters:

```text
: - # = + @ * % .
```

We can sort them in (approximate) density order like so, with lower-density characters to the left, and high-density to the right:

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

This results in the following:

<AsciiScene width={600} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="ascii" offsetAlign="left" sampleQuality={1} alphabet="pixel-short">
  <Scene2D scene="circle" />
</AsciiScene>

That's... pretty ugly. We seem to always get `@` for cells that fall within the circle, and `.` for cells that fall outside.

This happens because we're sampling a single point that will either fall inside the circle, returning 100% white, or fall outside of the circle, which returns the background color. There's no in-between.

<AsciiScene width={600} height={360} fontSize={60} rowHeight={72} columnWidth={60} viewMode="transparent" showGrid offsetAlign="left" sampleQuality={1} showSamplingPoints alphabet="pixel-short">
  <Scene2D scene="circle_zoomed" />
</AsciiScene>

.

.

.

.

.

.

.

.

.

.

.

.




<AsciiScene height={650} fontSize={100} showSamplingCircles="raw" showSamplingPoints characterWidthMultiplier={1.25} characterHeightMultiplier={1.25} showGrid showControls offsetAlign="center">
  <Scene2D scene="breathe" />
</AsciiScene>

.

.

.

.

.

.

.

.

.

.

.

.



<AsciiScene height={650} fontSize={20}>
  <Scene2D scene="shade-split" />
</AsciiScene>

.

.

.

.

.

.

.

.

.

.

.

.


<AsciiScene height={550} fontSize={100} viewModes={["transparent"]} showSamplingCircles="raw" characterWidthMultiplier={1.25} characterHeightMultiplier={1.25}>
  <Scene2D scene="shade_split_0" />
</AsciiScene>

.

.

.

.

.

.

.

.
