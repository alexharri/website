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

The canvas above is $600 \times 360$. With a line height of $24$, we get $15$ rows. I'll also pick a letter width of 20, which gives us 30 columns. Together, those give us a $30 \times 15$ grid:

<AsciiScene width={600} height={360} fontSize={20} rowHeight={24} columnWidth={20}>
  <Scene2D scene="circle" />
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




<AsciiScene height={650} fontSize={100} showSamplingCircles="raw" showSamplingPoints characterWidthMultiplier={1.25} characterHeightMultiplier={1.25}>
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
