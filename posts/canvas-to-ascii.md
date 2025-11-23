---
title: "Canvas to ASCII renderer"
---

Terminal-based LLM coding tools have been coming out left and right. A common motif accompanying those tools has been ASCII art, frequently animated.

I've noticed a few common issues with how people generate the ASCII characters, which leaves the ASCII art either feeling [jaggy][jaggies] or blurry. We can 

[jaggies]: https://en.wikipedia.org/wiki/Jaggies

In this post, let's dive into how we can generate sharp ASCII arts from a dynamic input image. Here's an example of what we'll build:

<AsciiScene height={540} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]} effects={["crunch"]} optimizePerformance>
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

<AsciiScene width={600} minWidth={400} height={360} fontSize={60} rowHeight={72} columnWidth={60} viewMode="transparent" showGrid offsetAlign="left" sampleQuality={1} showSamplingPoints alphabet="pixel-short" increaseContrast usesVariables>
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

<AsciiScene width={600} minWidth={200} height={360} fontSize={40} rowHeight={40} columnWidth={40} viewModes={["ascii", "transparent", "canvas"]} hideAscii pixelate sampleQuality={3} alphabet="pixel-short" showSamplingPoints showGrid usesVariables>
  <Scene2D scene="slanted_line" />
</AsciiScene>

With multiple samples, cells that lie on the edge of a shape will have some of its samples fall within the shape, and some outside of it. Averaging those, we get gray in-between color that smooth the downsampled rendering.

This method of collecting multiple samples from the larger image is called [supersampling][supersampling]. It's a common method of [anti-aliasing][anti_aliasing] (in other words, avoiding jaggies at edges).

[anti_aliasing]: https://en.wikipedia.org/wiki/Spatial_anti-aliasing
[supersampling]: https://en.wikipedia.org/wiki/Supersampling

Let's look at what supersampling does for the circle example from earlier. Try dragging the sample quality slider:

<AsciiScene width={360} height={408} fontSize={20} rowHeight={24} columnWidth={20} viewModes={["ascii", "transparent"]} alphabet="pixel-short" increaseContrast usesVariables>
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

<AsciiScene width={360} height={408} fontSize={20} rowHeight={24} columnWidth={20} viewModes={["ascii", "transparent"]} sampleQuality={8} increaseContrast>
  <Scene2D scene="circle_raised" />
</AsciiScene>

Let's see how we can consider shape.


## Shape

What do I mean by shape? Well, consider the characters "T", "L" and "O" placed within a grid:

<AsciiScene alphabet="two-samples" showGrid fontSize={100} height={260} width={520}>
  {"T L O"}
</AsciiScene>

The character "T" is top-heavy. Its visual density in the upper half of the grid cell is higher than in the lower half. The opposite can be said for "L" -- it's bottom-heavy. "O" somewhat equally occupies the upper and lower halves of the cell.

We might also compare characters like "L" and "J". The character "L" is heavier within the left half of the cell, while "J" is heavier in the right half:

<AsciiScene alphabet="two-samples" showGrid fontSize={100} height={260} width={360}>
  {"L J"}
</AsciiScene>

We also have more "extreme" characters, such as `_` and `^` that only occupy the lower or upper portion of the cell, respectively:

<AsciiScene alphabet="two-samples" showGrid fontSize={100} height={260} width={360}>
  {"_ ^"}
</AsciiScene>

This is what I mean by "shape" in the context of ASCII rendering. It refers to which regions of a cell each character visually occupies.


### Quantifying shape

How might we quantify shape so that we can pick characters based on their shape?

Let's start by only considering how much characters occupy the upper and lower region of our cell. We'll do that by defining two _sampling circles_ for each grid cell:

<AsciiScene alphabet="two-samples" showGrid fontSize={100} rows={2.2} cols={6} showSamplingCircles>
  {""}
</AsciiScene>

Let's consider a single cell. Once a character is placed within the cell, the character will overlap the cell's sampling circles by _some_ amount (sometimes zero).

<AsciiScene alphabet="two-samples" showGrid fontSize={250} rows={1} cols={1} showSamplingCircles forceSamplingValue={0}>
  {"T"}
</AsciiScene>

We'll then quantify the characters overlap with the sampling circle from $0$ to $1$ with $0$ meaning no overlap and $1$ meaning that the character completely fills the sampling circle.

One approach would be to take a bunch of random samples on the circle:

<AsciiScene alphabet="two-samples" sampleQuality={50} showGrid fontSize={250} rows={1} cols={1} showSamplingCircles showSamplingPoints forceSamplingValue={0}>
  {"T"}
</AsciiScene>

<SmallNote center label=""></SmallNote>

[fermat_spiral]: https://en.wikipedia.org/wiki/Fermat%27s_spiral

Each sample will fall either outside or inside of the character. We can count the number of points that fall within the character and divide by the total number of points, giving us a value between $0$ and $1$.

I generated the points above using a [Fermat spiral][fermat_spiral], but it'd be simpler and more effective to just take a sample at every single pixel. The random points just look nicer as a visualization.

Anyway, for T, we get approximately $0.261$ for the upper circle and $0.097$ for the lower. We can interpret this as a $2$-dimensional vector:

<p className="mathblock">$$\begin{bmatrix} 0.261 \\ 0.097 \end{bmatrix}$$</p>

We can use this technique to generate a "character vector" that describes the shape of each ASCII character.

Take the example below. In it, I color the sampling circles with their sampled lightness value:

<AsciiScene alphabet="two-samples" showGrid fontSize={120} rows={2} cols={3} showSamplingCircles offsetAlign="left">
  {"._=\n*%@"}
</AsciiScene>

We can also represent this numerically. I'll define a $\text{shape}(C)$ function that outputs the character vector for a given character $C$. With it, we get:

<p className="mathblock">$$\begin{align}
\text{shape}(\texttt{.}) &= \begin{bmatrix} 0 \\ 0.099 \end{bmatrix} \\[4pt]
\text{shape}(\texttt{\_}) &= \begin{bmatrix} 0 \\ 0.142 \end{bmatrix} \\[4pt]
\text{shape}(\texttt{*}) &= \begin{bmatrix} 0.167 \\ 0.115 \end{bmatrix} \\[4pt]
\text{shape}(\texttt{=}) &= \begin{bmatrix} 0.110 \\ 0.097 \end{bmatrix} \\[4pt]
\text{shape}(\texttt{\%}) &= \begin{bmatrix} 0.305 \\ 0.225 \end{bmatrix} \\[4pt]
\text{shape}(\texttt{@}) &= \begin{bmatrix} 0.277 \\ 0.281 \end{bmatrix} \\
\end{align}$$</p>

We can use also these character vectors as 2D coordinates and plot the character on a 2D plane:

<CharacterPlot max={0.435} highlight="^@qTMuX$g=C" />


### Shape-based lookup

With our characters layed out on a 2D plane, we can, given input 2D coordinates, use those to resolve the "best" character for those coordinates. Try hovering the chart below to see what I mean:

<CharacterPlot max={0.435} highlight="^@qTMuX$g=C" showHoverLine />

Our problem, then, is calculating 2D coordinates for each cell in our grid to use for this lookup.

Let's consider the following zoomed in circle. I made the canvas' size so that it splits cleanly into three grid cells:

<AsciiScene alphabet="two-samples" fontSize={200} rows={1} cols={3} viewMode="canvas" showGrid>
  <Scene2D scene="circle_zoomed_bottom" />
</AsciiScene>

Overlaying our sampling circles, we see varying degrees of overlap:

<AsciiScene alphabet="two-samples" fontSize={200} rows={1} cols={3} hideAscii showGrid showSamplingCircles forceSamplingValue={0} log>
  <Scene2D scene="circle_zoomed_bottom" />
</AsciiScene>

We haven't calculated the actual sampling values for these circles yet. We can't do that without determining the number of samples and the position of those samples within the circles.

When calculating the values for our character vectors, we could afford to use a really high number of samples because we only need to generate the character vectors once up front. After they're generated, we can use them again and again.

But when converting an image to ASCII -- especially an animated canvas -- performance matters a lot. We can't just sample indiscriminately without considering performance.

Let's pick a sampling quality of $3$, with the samples placed like so:

<AsciiScene alphabet="two-samples" sampleQuality={3} fontSize={200} rows={1} cols={3} hideAscii showGrid showSamplingCircles showSamplingPoints increaseContrast>
  <Scene2D scene="circle_zoomed_bottom" />
</AsciiScene>

For the top sampling circle of the leftmost cell, we get one white sample and two black. That gives us an average lightness of $0.33$ repeating for the sampling circle. Doing the same calculation for all three cells, we get the following vectors:

<p className="mathblock">$$\begin{gathered}
\left[\, \begin{matrix} 0.33 \\ 0 \end{matrix} \,\right]
\:
\left[\, \begin{matrix} 1 \\ 0.33 \end{matrix} \,\right]
\:
\left[\, \begin{matrix} 1 \\ 0.66 \end{matrix} \,\right]
\end{gathered}$$</p>

We can then perform a nearest-neighbor search on the 2D plot using these as input coordinates. Let's see what that looks like on our plot from before -- I'll color the points blue and label them -- from left to right -- C0, C1 and C2:

<CharacterPlot highlight="P$" inputPoints={[
  { vector: [0.33, 0], label: "C0" },
  { vector: [1, 0.33], label: "C1" },
  { vector: [1, 0.66], label: "C2" }
]} />

Hmm... this is not quite what we want. Since none of the vector components exceed $0.4$, they're all clustered towards the bottom-left region of our plot. This makes our relatively high input vectors map to a few character on the edge of the cluster.

We can fix this by _normalizing_ the character vectors. We'll do that by taking the maximum value of each component across all character vectors, and dividing the components of each character vectors by the maximum. Expressed in code, this looks like so:

```ts
const max = [0, 0]

for (const vector of characterVectors) {
  for (const [i, value] of Object.entries(vector)) {
    if (value > max[i]) {
      max[i] = value;
    }
  }
}

const normalizedCharacterVectors = characterVectors.map(
  vector => vector.map((value, i) => value / max[i])
)
```

Here's what the plot looks like with the characters vectors normalized:

<CharacterPlot highlight="^@qTMuX$g=C" normalize />

If we now map the input vectors to their nearest neighbors, we get a much more sensible result:

<CharacterPlot highlight="M$'" inputPoints={[
  { vector: [0.33, 0], label: "C0" },
  { vector: [1, 0.33], label: "C1" },
  { vector: [1, 0.66], label: "C2" }
]} normalize />

When rendered as ASCII, this looks like so:

<AsciiScene alphabet="two-samples" sampleQuality={3} fontSize={200} rows={1} cols={3} viewMode="transparent" increaseContrast>
  <Scene2D scene="circle_zoomed_bottom" />
</AsciiScene>

Those characters fit the shape of the circle very well! We can also try rendering the full circle from before with the same method:

<AsciiScene width={360} height={408} fontSize={20} rowHeight={24} columnWidth={18} alphabet="two-samples" sampleQuality={3} viewModes={["ascii", "transparent"]} increaseContrast>
  <Scene2D scene="circle_raised" />
</AsciiScene>

Awesome stuff! It's easy to observe that the picked characters follow the shape of the circle fairly well.


### Limits of a 2D character vector

Two sampling circles -- one upper and one lower -- fall short when trying to capture other aspects of a character's shape. They don't capture the shape of characters that fall in the middle of the cell. Consider `-`:

<AsciiScene alphabet="two-samples" showGrid fontSize={100} rows={1.5} cols={3.8}>
  {"-"}
</AsciiScene>

For `-`, we get a character vector of $\begin{bmatrix} 0.029 \\ 0.002 \end{bmatrix}$. That doesn't represent the character very well.

The two upper-lower sampling circles also don't capture left-right differences. Consider `p` and `q`:

<AsciiScene alphabet="two-samples" showGrid fontSize={100} rows={1.5} cols={3.8}>
  {"p q"}
</AsciiScene>

Their character vectors, $\begin{bmatrix} 0.16 \\ 0.27 \end{bmatrix}$ and $\begin{bmatrix} 0.16 \\ 0.28 \end{bmatrix}$, are pretty much identical.

## Increasing to 6D

Since cells are taller than they are wide, at least with most monospace fonts, $6$ sampling circles cover a cell quite well:

<AsciiScene alphabet="six-samples" showGrid showSamplingCircles fontSize={200} rows={1.4} cols={1.8} hideSpaces forceSamplingValue={0}>
  {"-"}
</AsciiScene>

$6$ sampling circles both capture left-right differences, while also considering characters that fall in the middle vertically, such as `-`. They also capture the shape of "diagonal" characters like `/`.

<AsciiScene alphabet="six-samples" showGrid showSamplingCircles fontSize={200} rows={1.4} cols={1.8} hideSpaces>
  {"/"}
</AsciiScene>

<SmallNote label="" center>The `/` character hits the top-right, center-left, center-right and bottom-left cells. It doesn't touch the top-left and bottom-right cell.</SmallNote>

One problem with this grid-like configuration for the sampling circles is that there are gaps. Consider `.`, for example. It mostly falls between the sampling circles:

<AsciiScene alphabet="six-samples" showGrid showSamplingCircles fontSize={200} rows={1.4} cols={1.8} hideSpaces>
  {"."}
</AsciiScene>

To compensate for this, we can stagger the sampling circles vertically (e.g. lowering the left sampling circles, and raising the right ones) and make them a bit larger. This causes the cell to be almost fully covered while not causing excessive overlap across the sampling circles:

<AsciiScene showGrid showSamplingCircles fontSize={140} rows={1.5} cols={2.3} hideSpaces>
  {"."}
</AsciiScene>

<SmallNote label="" center>This is the configuration I settled on because it yielded good results for me. One could experiment and try other configurations.</SmallNote>

We can use the same procedure as before to generate character vectors using these sampling circles, this time yielding a $6$-dimensional vector. Consider the character `L`:

<AsciiScene showGrid showSamplingCircles fontSize={200} rows={1.4} cols={1.8} hideSpaces>
  {"L"}
</AsciiScene>

For `L`, we get the vector:

<p className="mathblock">$$\begin{bmatrix} 0.10 & 0.00 \\ 0.20 & 0.02 \\ 0.09 & 0.09 \end{bmatrix}$$</p>

The lightness values certainly look L-shaped! I'd say that L's character vector describes its shape fairly well.

If we normalize the 6D character vectors in the same manner as before, `L`'s character vector becomes:

<p className="mathblock">$$\begin{bmatrix} 0.44 & 0.00 \\ 0.53 & 0.06 \\ 0.51 & 0.45 \end{bmatrix}$$</p>

It just makes the L shape all the more obvious.

---

Now, with a 6D character vector describing every character, the next step is to be able to look up the "most similar" character vector given an input 6D sampling vector.

In two dimensions, we could plot the characters on a 2D grid and perform a nearest neighbor search in a fairly straightforward manner:

<CharacterPlot highlight="a" inputPoints={[
  { vector: [0.44, 0.63], label: "Input" }
]} normalize />

The same idea applies in $6$ dimensions, though it's less intuitive to visualize. We'll lay our character vectors out as points in some $6$-dimensional space and perform nearest neighbor lookups with an input 6D sampling vector (point).


### Nearest neighbor lookups in a 6D space

Finding the closest point (nearest neighbor) in an N-dimensional space boils down to finding the point whose Euclidian distance to our input point is the smallest.

Given two points in 2D space, $a$ and $b$, we can calculate the Euclidian distance between them $d$ like so:

<p className="mathblock">$$ d = \sqrt{(a_1 - b_1)^2 + (a_2 - b_2)^2} $$</p>

This generalizes to higher dimensions:

<p className="mathblock">$$ d = \sqrt{(a_1 - b_1)^2 + (a_2 - b_2)^2 + \cdots + (a_n - b_n)^2} $$</p>

Which put into code looks like so:

```ts
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;

  for (let i = 0; i < a.length; i++) {
    const difference = a[i] - b[i];
    sum += difference * difference;
  }

  return Math.sqrt(sum);
}
```

Though, if we're just using this for the purposes of finding the closest point, we can skip the expensive <Ts>Math.sqrt()</Ts> call and just return the squared distance:

```ts
function euclideanDistanceSquared(a: number[], b: number[]): number {
  // ...
  return sum;
}
```

<SmallNote label="">Since we're searching for the smallest value (shortest distance), it only matter that the values' relative order stays the same. The absolute value doesn't matter.</SmallNote>

Now, let's say that we have our ASCII characters and their associated character vectors in a <Ts>CHARACTER_VECTORS</Ts> array:

```ts
const CHARACTER_VECTORS: Array<{
  character: string,
  vector: number[],
}> = [...];
```

We can then perform a nearest neighbor search like so:

```ts
function findCharacter(samplingVector: number[]) {
  let bestCharacter = "";
  let bestDistance = Infinity;
  
  for (const { vector, character } of CHARACTER_VECTORS) {
    const dist = euclideanDistanceSquared(vector, samplingVector);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestCharacter = character;
    }
  }
  
  return bestCharacter;
}
```

This gives us the ASCII character whose shape best matches our sampling vector, but this is not very performant. Once we start rendering thousands of ASCII characters at $60$ FPS (frames per second), we'll need to speed up performance significantly. We'll take a look at how we can do that later -- let's get to rendering some scenes!

### Trying out the 6D sampling approach

If we render the circle example from before with 6D sampling vectors, we get the following:

<AsciiScene width={360} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="ascii" offsetAlign="left" sampleQuality={4} alphabet="default" increaseContrast>
  <Scene2D scene="circle" />
</AsciiScene>

That's pretty good! Notice the quality of the character picks for e.g. the upper-right and lower-right parts of the circle -- `L` is a really good pick for the upper-right part and `P` is a great pick for the lower-right part.

Let's look at our rotating square:

<AsciiScene width={600} minWidth={400} height={360} fontSize={20} rowHeight={24} columnWidth={19} viewMode="ascii" offsetAlign="left" sampleQuality={10}>
  <Scene2D scene="rotating_square" />
</AsciiScene>

Oh yeah, that's excellent. You can easily tell that it's a rotating square -- the picked characters match the shape very well.

<SmallNote label="" center>(insert more examples?)</SmallNote>

Now, let's try rendering a 3D scene!


## Rendering a 3D scene

Consider the following 3D scene:

<AsciiScene height={540} viewMode="canvas" optimizePerformance>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>

If we render it as ASCII, we get the following:

<AsciiScene height={540} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]} optimizePerformance>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>

That's pretty cool, but honestly, the ASCII rendering looks pretty blurry. It all kind of blends together, especially at some angles like this one:

<AsciiScene height={500} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewMode="split" optimizePerformance>
  <Scene scene="cube" zoom={2.7} xRotation={230} yOffset={0.45} />
</AsciiScene>

I'd like the ASCII character picks to consider edges better. When there is a sharp change in color -- like when two faces of a cube meet -- I'd like to see more "sharpness" in ASCII rendering.

For example, consider the following split:

<AsciiScene width={600} minWidth={400} height={360} viewMode="canvas">
  <Scene2D scene="shade_split" />
</AsciiScene>

It's currently rendered like so:

<AsciiScene width={600} minWidth={400} height={360} fontSize={13} rowHeight={15}>
  <Scene2D scene="shade_split" />
</AsciiScene>

You can see the shade split -- `i`s on the left and `B`s on the right -- but the boundary is not very sharp.

By applying some image processing techniques to our sampling vector, we can make the boundary look much sharper:

<AsciiScene width={600} minWidth={400} height={360} fontSize={13} rowHeight={15} effects={["crunch"]}>
  <Scene2D scene="shade_split" />
</AsciiScene>

Notice the difference?

Take a look at the 3D scene from before again, with the same effect applied:

<AsciiScene height={540} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]} effects={["crunch"]}>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>

Quite a drastic difference! Let's look at how we can implement this sharpening effect.

## Vector crunching

Consider the ASCII characters that are rendered on top of this color boundary:

<AsciiScene showGrid fontSize={140} rows={1.4} cols={3.4} viewMode="transparent" sampleQuality={5} hideAscii>
  <Scene2D scene="shade_split_static" />
</AsciiScene>

We get this 6D sampling vector:

<p className="mathblock">$$\begin{bmatrix} 0.65 & 0.65 \\ 0.31 & 0.31 \\ 0.22 & 0.22 \end{bmatrix}$$</p>

Which I'll visualize like so:

<Vector6D
  samplingVector={[0.65, 0.65, 0.31, 0.31, 0.22, 0.22]}
/>

Currently, this sampling vector resolves to the character "T", which is a sensible choice. The character T is visually dense in the top half, and less so in the bottom half.

<InteractiveVector6D
  samplingVector={[0.65, 0.65, 0.31, 0.31, 0.22, 0.22]}
  showCharacterPick
/>

Still, I want the picked character to emphasize the boundary better. We can achieve that by enhancing the contrast of the sampling vector.

### Contrast enhancement

To increase the contrast of our sampling vector, we might raise each component of the vector to the power of some exponent.

Consider how an exponent affects values between $0$ and $1$. Numbers close to $0$ experiece a strong pull towards $0$ while larger numbers experience less pull. For example, $0.1^2 = 0.01$, a 90% reduction, while $0.9^2 = 0.81$, only a reduction of 10%.

The level of pull depends on the exponent. Here's a chart of $x^2$ for values of $x$ between $0$ and $1$:

<Image src="~/x-pow-2-chart.png" plain width={500} />

This effect becomes more pronounced with higher exponents:

<Image src="~/x-pow-n-chart.png" plain width={500} />

<SmallNote label="" center>A higher exponent translates to a stronger pull towards zero</SmallNote>

In the example below you can vary the exponent between $1$ and $2$:

<InteractiveVector6D
  vary="global_exponent"
  normalize={false}
  samplingVector={[0.65, 0.65, 0.31, 0.31, 0.22, 0.22]}
/>

As the exponent is increased to $2$, the darker components of the sampling vector certainly get darker. However, the lightest (top) components also get moved significantly towards zero.

I don't want that. I want to increase the contrast _between_ the lighter and darker components of the sampling vector.

To achieve that, we can normalize the sampling vector to the range $[0, 1]$ prior to applying the exponent, and then "denormalizing" the vector back to the original range afterwards.

The normalization to $[0, 1]$ can be done by dividing each component by the maximum component value. After applying the exponent, mapping back to the original range is done by multiplying each component by the same max value:

```ts
const maxValue = Math.max(...samplingVector)

samplingVector = samplingVector.map((value) => {
  value = x / maxValue; // Normalize
  value = Math.pow(x, exponent);
  value = x * maxValue; // Map back to original range
  return value;
})
```

Here's the same example, but with this normalization applied:

<InteractiveVector6D
  vary="global_exponent"
  samplingVector={[0.65, 0.65, 0.31, 0.31, 0.22, 0.22]}
/>

Very nice! The lightest component values are retained, and the contrast between the lighter and darker components is increased by "crunching" the lower values.

This affects which character is picked. The following example shows how the selected character changes as the contrast is increased:

<InteractiveVector6D
  vary="global_exponent"
  showCharacterPick
  samplingVector={[0.65, 0.65, 0.31, 0.31, 0.22, 0.22]}
/>

Awesome! Enhancing the vector's contrast gives us a character pick that emphasizes the shape in the extreme.

Because we normalize prior to applying the exponent, the highest values are not affected all. At the same time, values that are _close_ to the maximum value of the vector are only slightly affected. This causes vectors that are fairly uniform in value not to be affected much by contrast enhancement:

<InteractiveVector6D
  vary="global_exponent"
  showCharacterPick
  samplingVector={[0.64, 0.52, 0.62, 0.51, 0.60, 0.50]}
/>

<SmallNote label="" center>Because the vector is uniform the contrast enhancement only has a slight effect and doesn't change the picked character.</SmallNote>

This is a good thing! If we have a smooth gradient in our image we want to retain it -- we don't want to introduce unnecessary choppiness.

Vectors at the boundaries of two different-colored surfaces will have larger differences in the sampling vector, which the contrast enhancement enhances:

<InteractiveVector6D
  vary="global_exponent"
  showCharacterPick
  samplingVector={[0.68, 0.31, 0.76, 0.31, 0.77, 0.78]}
/>

<SmallNote label="" center>I _love_ the transition from `& -> b -> L` as the L-shape of the vector becomes more enhanced!</SmallNote>

Compare the 3D scene ASCII rendering with and without this contrast enhancement!

<AsciiScene height={540} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]} effects={["global_crunch"]} optimizePerformance vary={["global_crunch_exponent"]} usesVariables>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>


### Directional contrast enhancement

To further increase the contrast between boundaries. let's look _outside_ of the cell's boundary and sample regions outside of the cell.

We currently have sampling circles arranged like so:

<AsciiScene alphabet="default" showGrid fontSize={140} rows={2.2} cols={2.6} hideSpaces showSamplingCircles forceSamplingValue={0}>
  {"-"}
</AsciiScene>

For each of those sampling circles, we'll specify an "external sampling circle", placed outside of the cell's boundary like so:

<AsciiScene alphabet="default" showGrid fontSize={140} rows={2.2} cols={2.6} hideSpaces showSamplingCircles showExternalSamplingCircles forceSamplingValue={0}>
  {"-"}
</AsciiScene>

Each of those external sampling circles is "reaching" into the region of a neighboring cell. Together, the samples that are collected by the external sampling circles constitute an "external sampling vector". I'll call this the "external vector" for conciseness.

Let's simplify the visualization and consider a single example. Imagine that we collected a sampling vector and an external sampling vector that look like so:

<InteractiveVector6D
  samplingVector={[0.51, 0.51, 0.52, 0.52, 0.53, 0.53]}
  externalVector={[0.80, 0.51, 0.57, 0.52, 0.53, 0.53]}
  showCharacterPick
/>

The sampling vector itself is a fairly uniform, with values ranging from $0.51$ to $0.53$. The external vector's values are similar, except in the upper left region where the values are significantly lighter. This indicates that in the underlying image the region of the image to the upper left of the cell is lighter.

To enhance the apparent boundary at the upper left corner of the cell we'd want the darken top-left and middle-left components of the sampling vector. We can do that by applying a component-wise contrast enhancement using the components of the external vector

In our previous contrast enhancement, we determined the max value across the component's of the sampling vector:

```ts
const maxValue = Math.max(...samplingVector)
```

But here, for each index $i$ of our sampling vectors, we'll calculate the max value like so:

```ts
const maxValue = Math.max(samplingVector[i], externalSamplingVector[i])
```

Aside from that, the contrast enhancement is performed in the same way:

```ts
samplingVector = samplingVector.map((value, i) => {
  const maxValue = Math.max(value, externalSamplingVector[i])
  value = x / maxValue;
  value = Math.pow(x, exponent);
  value = x * maxValue;
  return value;
})
```

This makes lighter values in the external vector push lower values in the sampling vector down:

<InteractiveVector6D
  samplingVector={[0.51, 0.51, 0.52, 0.52, 0.53, 0.53]}
  externalVector={[0.80, 0.51, 0.57, 0.52, 0.53, 0.53]}
  vary="directional_exponent"
  showCharacterPick
/>

I call this "directional contrast enhancement", since each of the external samples reaches outside of the cell in the _direction_ of the sampling vector component that it is enhancing the contrast of. I describe the other effect as "global contrast enhancement", since it acts on all of the sampling vector components together.

Try dragging the slider below to gradually apply directional contrast enhancement to the 3D scene from before. The directional contrast enhancement is applied _on top of_ a layer of global contrast enhancement:

<AsciiScene height={540} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]} effects={["crunch"]} optimizePerformance vary={["directional_crunch_exponent"]} usesVariables>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>

<SmallNote label="" center>I find that an exponent of $7$ for the directional crunch works well.</SmallNote>

## Final words

These two types of contrast enhancement make the image feel sharper and far more readable than otherwise.

## Appendix I: Character lookup performance

Earlier in this post I showed how can find the best character by finding the character with the shortest Euclidian distance to our sampling vector.

```ts
function findCharacter(samplingVector: number[]) {
  let bestCharacter = "";
  let bestDistance = Infinity;
  
  for (const { vector, character } of CHARACTER_VECTORS) {
    const dist = euclideanDistanceSquared(vector, samplingVector);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestCharacter = character;
    }
  }
  
  return bestCharacter;
}
```

I tried benchmarking this for $100{,}000$ input sampling vectors on my Macbook -- $100$K invocations of this function consistently take about $190$ms. If we assume that we'll want to be able to use this for an animated canvas at $60$ frames per second (FPS), we only have $16{.}66$ms to render each frame. We can use this to get a rough budget for how many lookups we can perform each frame:

<p className="mathblock">$$ 100{,}000 \times \dfrac{16{.}66\ldots}{190} \approx 8{,}772 $$</p>

If we allow ourselves $50\%$ of the performance budget for just lookups, this gives us a budget of about $4$K characters. Not terrible, but far from great, especially considering that the benchmark was run on a powerful laptop. Let's see how we can improve this.


### k-d trees

$k$-d trees are data structure that enables nearest-neighbor lookups in multi-dimensional ($k$-dimensional) space -- perfect for our purpose. Their performance [degrades in higher dimensions][kd_search_performance] (e.g. $\gt20$), but they perform well in $6$ dimensions.

[kd_search_performance]: https://graphics.stanford.edu/~tpurcell/pubs/search.pdf

Internally, $k$-d trees are a binary tree where each node is a $k$-dimensional point. Each node can be thought to split the $k$-dimensional space in half with a hyperplane, with the left subtree on one side of the hyperplane and the right subtree on the other.

<SmallNote>I won't go into much detail on $k$-d trees here.</SmallNote>

Let's see how it performs! We'll construct a $k$-d tree with our characters and their associated vectors:

```ts
const kdTree = new KdTree(
  CHARACTER_VECTORS.map(({ character, vector }) => ({
    point: vector,
    data: character,
  }))
);
```

After that, we can perform nearest-neighbor searches with sampling vectors:

```ts
const result = kdTree.findNearest(samplingVector);
```

Running $100$K such lookups takes $66$ms on my Macbook. That's about $3$x faster than the brute-force approach. We can use this to calculate, roughly, the number of lookups we can perform per frame:

<p className="mathblock">$$ 100{,}000 \times \dfrac{16{.}66\ldots}{66} \approx 25{,}253 $$</p>

That's a lot of lookups per frame, but again, we're benchmarking on a powerful machine. We can easily expect a $5$-$10$x smaller performance budget on mobile devices.

Let's see how we can eek out even more performance.


### Caching

An obvious avenue for speeding up lookups is trying to cache the result:

```ts
function searchCached(vector: number[]) {
  const key = generateCacheKey(vector)
  
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  
  const result = search(samplingVector);
  cache.set(key, result);
  return result;
}
```

But how does one generate a cache key for a $6$-dimensional vector?

Well, one way is to quantize each vector component so that it fits into a set number of bits and packing those bits into a single number. JavaScript numbers give us $32$ bits to work with, so each vector component has at most $5$ bits to play around with.

We can quantize a numeric value between $0$ and $1$ to the range $0$ to $31$ (the most that $5$ bits can store) like so:

```ts
const RANGE = 2 ** 5; // Equivalent to Math.pow(2, 5)

function quantizeTo5Bits(value: number) {
  return Math.min(RANGE - 1, Math.floor(value * RANGE));
}
```

<SmallNote label="">Applying a max of <Ts>RANGE - 1</Ts> is done so that a <Ts>value</Ts> of exactly $1$ is mapped to $31$ instead of $32$.</SmallNote>

We can quantize each vector component in this manner and use bit shifting to pack all of the quantized values into a single number like so:

```ts
const BITS = 5;
const RANGE = 2 ** BITS;

function generateCacheKey(vector: number[]): number {
  let key = 0;
  for (let i = 0; i < vector.length; i++) {
    const quantized = Math.min(RANGE - 1, Math.floor(vector[i] * RANGE));
    key = (key << BITS) | quantized;
  }
  return key;
}
```

The <Ts>RANGE</Ts> is current set to <Ts>2 ** 5</Ts>, but consider how large that makes our key space. Each vector component is one of $32$ possible values. With $6$ vector components, makes the total number of possible keys $32^6$, which equals $1{,}073{,}741{,}824$. If the cache were to be fully saturated, just storing those keys alone would take $8$GB of memory! I'd also expect the cache hit rate to be incredibly low if we were to lazily fill the cache.

We can pick any number between $1$ and $32$ for our range.

Here's the number of keys -- and the memory needed to store them -- for range sizes between $6$ and $12$.

<Table
  align="right"
  columns={["Range", "Number of keys", { title: "Memory needed for keys", width: 160 }]}
  data={[
    [ 6, "46,656", "364.50 KB" ],
    [ 7, "117,649", "919.13 KB" ],
    [ 8, "262,144", "2.00 MB" ],
    [ 9, "531,441", "4.05 MB" ],
    [ 10, "1,000,000", "7.63 MB" ],
    [ 11, "1,771,561", "13.52 MB" ],
    [ 12, "2,985,984", "22.78 MB" ],
  ]}
/>

There is a memory-vs-quality trade-off to consider. As the range gets smaller, the quality of the results drops. If we pick a range of $6$, for example, there only possible lightness values are $0$, $0.2$, $0.4$, $0.6$, $0.8$ and $1$. That _does_ affect the quality of the ASCII rendering.

Cached lookups are incredibly fast. So fast that lookup performance is not really a concern anymore. If we prepopulate the cache, we can expect consistently fast performance, though I encountered no problems lazily populating the cache.

## Appendix II: GPU accelerated sampling

