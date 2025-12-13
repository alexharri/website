---
title: "Canvas to ASCII renderer"
---

ASCII art uses [ASCII characters][ascii_characters] to create images, typically in a [monospace][monospace] font. Here's an example of an ASCII art piece:

[ascii_characters]: https://en.wikipedia.org/wiki/ASCII#Printable_character_table

<AsciiScene fontSize={15} characterWidthMultiplier={0.61} rows={20} cols={40}>
{`                                            _.oo.
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
      dMMMMMMM@^\       \^^^^
     YMMMUP^
      ^^`}
</AsciiScene>

<SmallNote label="" center>Source: [https://paulbourke.net/dataformats/asciiart/](https://paulbourke.net/dataformats/asciiart/)</SmallNote>

I really like the ring around the planet. The artist manages to produce sharp edges by picking characters that match the ring's contour really well. The gradient of the 

Sharp edges like these are an aspect of ASCII rendering that is often overlooked when programmatically rendering images as ASCII. Consider this animated 3D scene that is rendered via ASCII characters:

<Image src="~/cube-logo-short.mp4" plain width={700} noMargin />

<SmallNote label="" center>Source: [cognition.ai](https://cognition.ai/)</SmallNote>

It's a cool effect, especially while in motion, but take a look at those blurry edges! The characters follow the cube's contour very poorly and as a result the edges look blurry and inconsistent:

<Image src="~/cube-logo-zoomed-in.png" plain width={450} noMargin />

This blurriness arises from a common mistake made when implementing an ASCII renderer: ignoring the shape of ASCII characters and only considering visual density.

Blurry edges in ASCII rendering have become a small pet peeve of mine, so I recently took the time to implement an ASCII renderer that focuses on contour matching and rendering quality. Here's what it produces for an image of Saturn:

<AsciiScene height={500} width={500} minWidth={500} fontSize={14} characterWidthMultiplier={0.75} characterHeightMultiplier={0.9} viewModes={["ascii", "split", "canvas"]} splitMode="static" effects={{
  global_crunch: 1.5,
  directional_crunch: 1.25,
}}>
  <Scene2D scene="saturn" />
</AsciiScene>

<SmallNote label="" center>Try the 'Split' mode to compare the image to the resulting ASCII.</SmallNote>

Here's an interactive 3D scene rendered in real time with the same renderer -- try dragging it around:

<AsciiScene height={540} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]} optimizePerformance splitMode="dynamic" effects={{
  global_crunch: 2.2,
  directional_crunch: 2.8,
}}>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>

In this post I'll cover how I built this ASCII renderer in detail.

We'll start with the basics of image-to-ASCII conversion and see where the common issue of blurry edges comes from. After that I'll show you how to fix that to achieve sharp, high-quality ASCII rendering. We'll cover wide range of ideas, ranging from the basics of image processing to nearest neighbor lookups in a high-dimensional space.

We'll also take a look at we can apply effects such as contrast enhancement, here's an example:

<AsciiScene height={450} width={700} fontSize={13} characterWidthMultiplier={0.8} characterHeightMultiplier={0.8} viewModes={["ascii", "split", "canvas"]} usesVariables splitMode="static" exclude="|v" effectSlider={{
  global_crunch: [1, 1.5],
  directional_crunch: [1, 2.75],
}}>
  <WebGLShader fragmentShader="multiple_waves" seed={9581} />
</AsciiScene>

Let's get to it!


## Image to ASCII conversion

ASCII has the following 95 printable characters:

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

We'll start by rendering the following image, containing a white circle, as ASCII:

<AsciiScene width={360} height={360} viewMode="canvas">
  <Scene2D scene="circle" />
</AsciiScene>

ASCII rendering almost always uses a [monospace][monospace] font. Since every character in a monospace font is equally wide and tall, we can split the image into a grid. Each grid cell will contain a single ASCII character.

The image with the circle is $360 \times 360$ pixels. For the ASCII grid I'll pick a row height of $24$ pixels and a column width of $20$ pixels. That splits the canvas into $15$ rows and $18$ columns -- an $18 \times 15$ grid:

<AsciiScene width={360} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="transparent" hideAscii showGrid offsetAlign="left">
  <Scene2D scene="circle" />
</AsciiScene>

<SmallNote label="" center>Monospace characters are typically taller than they are wide. The monospace font in this blog is Fira Code, which has a width-to-height ratio of $0.6$.</SmallNote>

Our task is now to pick which character to place in each column. The simplest approach is to calculate a lightness value for each cell and pick a character based on that.

We can get a lightness value for each cell by sampling the lightness of the pixel at the cell's center:

<AsciiScene width={360} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="canvas" hideAscii showGrid offsetAlign="left" sampleQuality={1} showSamplingPoints alphabet="pixel-short">
  <Scene2D scene="circle" />
</AsciiScene>

We want each pixel's lightness as a numeric value between $0$ and $1$, but our image data consists of pixels with [RGB][rgb] color values.

[rgb]: https://en.wikipedia.org/wiki/RGB_color_model

We can use the following formula to convert an RGB color (with components values between $0$ and $255$) to a lightness value:

<p className="mathblock">$$ \dfrac{R \times 0.2126 + G \times 0.7152 + B \times 0.0722}{255} $$</p>

<SmallNote label="" center>See [relative luminance][relative_luminance].</SmallNote>

[relative_luminance]: https://en.wikipedia.org/wiki/Relative_luminance#Relative_luminance_and_%22gamma_encoded%22_colorspaces

### Mapping lightness values to ASCII characters

Now that we have a lightness value for each cell, we want to use them to pick ASCII characters.

Consider the following ASCII characters:

```text
: - # = + @ * % .
```

We can sort them in approximate density order like so, with lower-density characters to the left, and high-density characters to the right:

```text
. : - = + * # % @
```

<SmallNote label="">That `:` comes before `-` is a matter of taste. They feel somewhat equally dense to me.</SmallNote>

We'll put these characters in a <Ts>CHARS</Ts> array:

```ts
const CHARS = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"]
```

<SmallNote label="">I added space as the first (least dense) character.</SmallNote>

We can then map lightness values between $0$ and $1$ to one of those characters like so:

```ts
function getCharacterFromLightness(lightness: number) {
  const index = Math.floor(lightness * (CHARS.length - 1));
  return CHARS[index];
}
```

This maps low lightness values to low-density characters and high lightness values to high-density characters.

Rendering the circle from above with this method gives us:

<AsciiScene width={360} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="ascii" offsetAlign="left" sampleQuality={1} alphabet="pixel-short" increaseContrast>
  <Scene2D scene="circle" />
</AsciiScene>

That works... but the result is pretty ugly. We seem to always get `@` for cells that fall within the circle and a space for cells that fall outside.

This happens because we've pretty much just implemented nearest-neighbor downsampling. Let's see what that means.

## Downsampling

[Downsampling][image_scaling], in the context of image processing, is taking a larger image (in our case, the $360 \times 360$ canvas) and using that image's data to construct a lower resolution image (in our case, the $18 \times 15$ ASCII grid). The pixel values of the lower resolution image are calculated by sampling values from the higher resolution image.

[image_scaling]: https://en.wikipedia.org/wiki/Image_scaling

The simplest and fastest method of sampling is [nearest-neighbor interpolation][nearest_neighbor] where we only take a single sample from the higher resolution image. That's what we did above.

[nearest_neighbor]: https://en.wikipedia.org/wiki/Nearest-neighbor_interpolation

Consider this rotating square split into a $24 \times 24$ pixel grid:

<AsciiScene width={600} minWidth={400} height={360} fontSize={20} rowHeight={24} columnWidth={24} viewMode="transparent" hideAscii showGrid offsetAlign="left" sampleQuality={1} alphabet="pixel-short">
  <Scene2D scene="rotating_square" />
</AsciiScene>

For a shape like this, using nearest-neighbor interpolation, the single sample taken for each cell either falls inside or outside of the shape, resulting in either $0\%$ or $100\%$ lightness:

<AsciiScene width={600} minWidth={400} height={360} fontSize={20} rowHeight={24} columnWidth={24} viewMode="transparent" hideAscii showGrid showSamplingPoints offsetAlign="left" sampleQuality={1} alphabet="pixel-short" optimizePerformance>
  <Scene2D scene="rotating_square" />
</AsciiScene>

If, instead of picking an ASCII character for each grid cell, we color each grid cell according the the sampled value, we get the following pixelated rendering:

<AsciiScene width={600} minWidth={400} height={360} fontSize={20} rowHeight={24} columnWidth={24} viewMode="ascii" hideAscii pixelate offsetAlign="left" sampleQuality={1} alphabet="pixel-short" optimizePerformance>
  <Scene2D scene="rotating_square" />
</AsciiScene>

Notice the rough, jagged looking edges when the square is at an angle. Those are an aliasing artifacts (often called [jaggies][jaggies]), and they're a common result of using nearest-neighbor interpolation.

[jaggies]: https://en.wikipedia.org/wiki/Jaggies

### Anti-aliasing

The obvious idea to get rid of these jaggies is to take more than one sample.

Consider this line:

<AsciiScene width={600} minWidth={200} height={360} rowHeight={40} columnWidth={40} viewMode="canvas" showControls={false}>
  <Scene2D scene="slanted_line" />
</AsciiScene>

The line's slope on the $y$ axis is $\dfrac{1}{3}x$. When we pixelate it with nearest-neighbor interpolation, we get the following:

<AsciiScene width={600} minWidth={200} height={360} rowHeight={40} columnWidth={40} hideAscii pixelate sampleQuality={1} alphabet="pixel-short" showControls={false}>
  <Scene2D scene="slanted_line" />
</AsciiScene>

Let's try to get rid of the jagginess by taking multiple samples within each cell and using the average sampled lightness value to color the cell. The example below lets you vary the number of samples using the slider:

<AsciiScene width={600} minWidth={200} height={360} fontSize={40} rowHeight={40} columnWidth={40} viewModes={["ascii", "transparent", "canvas"]} hideAscii pixelate sampleQuality={3} alphabet="pixel-short" showSamplingPoints showGrid usesVariables>
  <Scene2D scene="slanted_line" />
</AsciiScene>

Works as expected! With multiple samples, cells that lie on the edge of a shape will have some of its samples fall within the shape, and some outside of it. Averaging those, we get gray in-between colors that smooth the downsampled image.

This method of collecting multiple samples from the larger image is called [supersampling][supersampling]. It's a common method of [spatial anti-aliasing][anti_aliasing] (in other words, avoiding jaggies at edges). Here's what the rotating square looks like with supersampling (using $16$ samples for each cell):

<AsciiScene width={600} minWidth={400} height={360} fontSize={20} rowHeight={24} columnWidth={24} viewMode="ascii" hideAscii pixelate offsetAlign="left" sampleQuality={16} alphabet="pixel-short">
  <Scene2D scene="rotating_square" />
</AsciiScene>

[anti_aliasing]: https://en.wikipedia.org/wiki/Spatial_anti-aliasing
[supersampling]: https://en.wikipedia.org/wiki/Supersampling

Let's look at what supersampling does for the circle example from earlier. Try dragging the sample quality slider:

<AsciiScene width={360} height={408} fontSize={20} rowHeight={24} columnWidth={20} viewModes={["ascii", "transparent"]} offsetAlign="left" alphabet="pixel-short" increaseContrast usesVariables>
  <Scene2D scene="circle_sample_quality" />
</AsciiScene>

The circle becomes less jagged, but the edges feel blurry. Why's that?

Well, they feel blurry because we're pretty much just rendering a low-resolution pixelated image of a circle. Below is the same example, but instead of rendering ASCII character, we color the grid cells (pixels) according to the average sampled lightness:

<AsciiScene width={360} height={408} fontSize={20} rowHeight={24} columnWidth={20} viewModes={["ascii", "transparent"]} offsetAlign="left" alphabet="pixel-short" pixelate usesVariables>
  <Scene2D scene="circle_sample_quality" />
</AsciiScene>

Our ASCII rendering of the circle is pretty much just a low-resolution rendering of the original high-resolution circle, scaled up to the original size -- of course it feels blurry. Upscaled low-resolution images are always going to look blurry and bad.

Increasing the number of samples is insufficient. No matter how many samples we take per cell, the samples will be averaged into a single lightness value, used to render a single pixel.

And that's the core problem: treating each grid cell as a pixel in an image. It's an obvious and simple method, but it disregards that ASCII characters have shape.

We can make our ASCII renderings fara more crisp by picking characters based on their shape. Here's the circle rendered that way:

<AsciiScene width={360} height={408} fontSize={20} rowHeight={24} columnWidth={20} viewModes={["ascii", "transparent"]} sampleQuality={8} increaseContrast offsetAlign="left" exclude="$">
  <Scene2D scene="circle_raised" />
</AsciiScene>

Same for the rotating cube -- look at the results we can achieve when we consider shape:

<AsciiScene width={600} minWidth={400} height={360} fontSize={20} rowHeight={24} columnWidth={19} viewMode="ascii" offsetAlign="left" sampleQuality={10} exclude="$">
  <Scene2D scene="rotating_square" />
</AsciiScene>

Let's see how we can implement this.


## Shape

So, what do I mean by shape? Well, consider the characters `T`, `L` and `O` placed within grid cells:

<AsciiScene alphabet="two-samples" showGrid fontSize={100} height={260} width={520}>
  {"T L O"}
</AsciiScene>

The character `T` is top-heavy. Its visual density in the upper half of the grid cell is higher than in the lower half. The opposite can be said for `L` -- it's bottom-heavy. `O` is pretty much equally heavy in the upper and lower halves of the cell.

We might also compare characters like `L` and `J`. The character `L` is heavier within the left half of the cell, while `J` is heavier in the right half:

<AsciiScene alphabet="two-samples" showGrid fontSize={100} height={260} width={360}>
  {"L J"}
</AsciiScene>

We also have more "extreme" characters, such as `_` and `^` that only occupy the lower or upper portion of the cell, respectively:

<AsciiScene alphabet="two-samples" showGrid fontSize={100} height={260} width={360}>
  {"_ ^"}
</AsciiScene>

This is what I mean by "shape", at least in the context of ASCII rendering. Shape refers to which regions of a cell a given character visually occupies.


### Quantifying shape

How might we quantify shape so that we can somehow pick characters based on their shape?

Let's start by only considering how much characters occupy the upper and lower region of our cell. We'll do that by defining two _sampling circles_ for each grid cell:

<AsciiScene alphabet="two-samples" showGrid fontSize={100} rows={2.2} cols={6} showSamplingCircles>
  {""}
</AsciiScene>

<SmallNote label="" center>It may seem odd to use circles instead of just splitting the cell into two rectangles, but using sampling circles will give us more flexibility later on.</SmallNote>

A character placed within a cell will overlap each of the cell's sampling circles to _some_ extent (sometimes zero).

<AsciiScene alphabet="two-samples" showGrid fontSize={250} rows={1} cols={1} showSamplingCircles forceSamplingValue={0}>
  {"T"}
</AsciiScene>

Now we'll quantify how much the character overlaps each sampling circle from $0$ to $1$. An overlap of $0$ means that there's no overlap and $1$ means that the character completely overlaps the sampling circle.

One way to compute the overlap is to take a bunch of samples within the circle and checking if they fall inside or outside of the character, dividing the number samples that fall inside by the total number of samples:

<AsciiScene alphabet="two-samples" sampleQuality={50} showGrid fontSize={250} rows={1} cols={1} showSamplingCircles showSamplingPoints forceSamplingValue={0}>
  {"T"}
</AsciiScene>

<SmallNote center label=""></SmallNote>

[fermat_spiral]: https://en.wikipedia.org/wiki/Fermat%27s_spiral

These points are generated using a [Fermat spiral][fermat_spiral], but that's just to make the visualization look nicer. It's simpler and more effective to just take a sample at every pixel.

Anyway, for T, we get approximately $0.261$ for the upper circle and $0.097$ for the lower. Those values form a $2$-dimensional vector:

<p className="mathblock">$$\begin{bmatrix} 0.261 \\ 0.097 \end{bmatrix}$$</p>

This way we can generate a "shape vector" for each ASCII character that quantifies that character's shape.

Below are some ASCII characters and their shape vectors. I'm coloring the sampling circles using the component values of the shape vectors:

<AsciiScene alphabet="two-samples" showGrid fontSize={120} rows={2} cols={3} showSamplingCircles offsetAlign="left">
  {"._=\n*%@"}
</AsciiScene>

We can plot all of the printable ASCII characters on a 2D plane using their shape vectors as 2D coordinates:

<CharacterPlot max={0.435} highlight="^@qTMuX$g=C" />


### Shape-based lookup

With our characters laid out on a 2D plane, we can find the best (nearest) character for any given 2D input coordinates. Try hovering the chart below to see what I mean:

<CharacterPlot max={0.435} highlight="^@qTMuX$g=C" showHoverLine />

So then, now we need to calculate a 2D vector for each cell in the grid to use as lookup coordinates.

Let's use the following zoomed in circle as an example. It is split into three grid cells:

<AsciiScene alphabet="two-samples" fontSize={200} rows={1} cols={3} viewMode="canvas" showGrid>
  <Scene2D scene="circle_zoomed_bottom" />
</AsciiScene>

Overlaying our sampling circles, we see varying degrees of overlap:

<AsciiScene alphabet="two-samples" fontSize={200} rows={1} cols={3} hideAscii showGrid showSamplingCircles forceSamplingValue={0} log>
  <Scene2D scene="circle_zoomed_bottom" />
</AsciiScene>

We haven't actually calculated the average lightness value for these yet. Before we do that, we need to decide how many samples to take, and where to take them from.

It would be simple to take a sample at each pixel like we did when calculating the shape vectors for each character. We could afford to do that when calculating the shape vectors because we only need to generate them once up front. After they're generated, we can use them again and again.

However, if we're converting an animated canvas or video to ASCII, we need to be mindful of performance. An ASCII rendering might have hundreds or thousands of cells. In that context, collecting dozens or hundreds of samples per sampling circle would _crush_ performance.

For now let's pick a sampling quality of $3$, with the samples placed like so:

<AsciiScene alphabet="two-samples" sampleQuality={3} fontSize={200} rows={1} cols={3} hideAscii showGrid showSamplingCircles showSamplingPoints increaseContrast>
  <Scene2D scene="circle_zoomed_bottom" />
</AsciiScene>

For the top sampling circle of the leftmost cell, we get one white sample and two black, giving us an average lightness of $0.33$. Doing the same calculation for all of the sampling circles, we get the following sampling vectors:

<p className="mathblock">$$\begin{gathered}
\left[\, \begin{matrix} 0.33 \\ 0.00 \end{matrix} \,\right]
\:
\left[\, \begin{matrix} 1.00 \\ 0.33 \end{matrix} \,\right]
\:
\left[\, \begin{matrix} 1.00 \\ 0.66 \end{matrix} \,\right]
\end{gathered}$$</p>

We can now find the closest characters using these sampling vectors as 2D input coordinates.

Let's see what that mapping looks like on our plot from before. I'll color the input coordinates blue and label them C0, C1 and C2:

<CharacterPlot highlight="P$" inputPoints={[
  { vector: [0.33, 0], label: "C0" },
  { vector: [1, 0.33], label: "C1" },
  { vector: [1, 0.66], label: "C2" }
]} />

Hmm... this is not quite what we want. Since none of the shape vector components exceed $0.4$, they're all clustered towards the bottom-left region of our plot. This makes our high input coordinates map to a few character on the edge of the cluster.

We can fix this by _normalizing_ the shape vectors. We'll do that by taking the maximum value of each component across all shape vectors, and dividing the components of each shape vectors by the maximum. Expressed in code, that looks like so:

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
  { vector: [1, 0.33], label: "C1", align: "left" },
  { vector: [1, 0.66], label: "C2", align: "left" }
]} normalize />

We get `'`, `M` and `$`.  Let's see how well those characters match the circle:

<AsciiScene alphabet="two-samples" sampleQuality={3} fontSize={200} rows={1} cols={3} viewMode="transparent" increaseContrast>
  <Scene2D scene="circle_zoomed_bottom" />
</AsciiScene>

Those characters fit the shape of the circle very well! We can also try rendering the full circle from before with the same method:

<AsciiScene width={360} height={408} fontSize={20} rowHeight={24} columnWidth={18} alphabet="two-samples" sampleQuality={3} viewModes={["ascii", "transparent"]} increaseContrast>
  <Scene2D scene="circle_raised" />
</AsciiScene>

Awesome stuff! It's easy to observe that the picked characters follow the shape of the circle fairly well.


### Limits of a 2D character vector

Using two sampling circles -- one upper and one lower -- already produces much better result compared to the prior $1$-dimensional pixel approach. However, it still fall short when trying to capture other aspects of a character's shape.

For example, the two circles don't capture the shape of characters that fall in the middle of the cell. Consider `-`:

<AsciiScene alphabet="two-samples" showGrid fontSize={150} rows={1.5} cols={2.5} hideSpaces showSamplingCircles>
  {"-"}
</AsciiScene>

For `-`, we get a character vector of $\begin{bmatrix} 0.029 \\ 0.002 \end{bmatrix}$. That doesn't represent the character very well at all.

The two upper-lower sampling circles also don't capture left-right differences. Consider `p` and `q`:

<AsciiScene alphabet="two-samples" showGrid fontSize={150} rows={1.5} cols={3.8} hideSpaces showSamplingCircles>
  {"p q"}
</AsciiScene>

Their character vectors, $\begin{bmatrix} 0.16 \\ 0.27 \end{bmatrix}$ and $\begin{bmatrix} 0.16 \\ 0.28 \end{bmatrix}$, are pretty much identical.

## Increasing to 6D

Since cells are taller than they are wide (at least with our monospace font), we can use $6$ sampling circles to cover the area of the cell quite well:

<AsciiScene alphabet="six-samples" showGrid showSamplingCircles fontSize={200} rows={1.4} cols={1.8} hideSpaces forceSamplingValue={0}>
  {"-"}
</AsciiScene>

$6$ sampling circles capture left-right differences, such as between `p` and `q`, while also capturing differences across the top, bottom and middle regions of the cell, differentating `^`, `-` and `_`. They also capture the shape of "diagonal" characters like `/` to a reasonable degree.

<AsciiScene alphabet="six-samples" showGrid showSamplingCircles fontSize={200} rows={1.4} cols={1.8} hideSpaces>
  {"/"}
</AsciiScene>

One problem with this grid-like configuration for the sampling circles is that there are gaps. Consider `.`, for example. It inconveniently falls between the sampling circles:

<AsciiScene alphabet="six-samples" showGrid showSamplingCircles fontSize={200} rows={1.4} cols={1.8} hideSpaces>
  {"."}
</AsciiScene>

To compensate for this, we can stagger the sampling circles vertically (e.g. lowering the left sampling circles, and raising the right ones) and make them a bit larger. This causes the cell to be almost fully covered while not causing excessive overlap across the sampling circles:

<AsciiScene showGrid showSamplingCircles fontSize={140} rows={1.5} cols={2.3} hideSpaces>
  {"."}
</AsciiScene>

We can use the same procedure as before to generate character vectors using these sampling circles, this time yielding a $6$-dimensional vector. Consider the character `L`:

<AsciiScene showGrid showSamplingCircles fontSize={200} rows={1.4} cols={1.8} hideSpaces>
  {"L"}
</AsciiScene>

For `L`, we get the vector:

<p className="mathblock">$$\begin{bmatrix} 0.10 & 0.00 \\ 0.20 & 0.02 \\ 0.09 & 0.09 \end{bmatrix}$$</p>

<SmallNote label="" center>I'm presenting the $6$-dimensional vector in a $3 \times 2$ matrix form because it's easier to grok geometrically, but the actual vector is a flat list of numbers.</SmallNote>

The lightness values certainly look L-shaped! I'd say that `L`'s shape vector describes its shape fairly well.

If we normalize the 6D shape vectors in the same manner as before, `L`'s shape vector becomes:

<p className="mathblock">$$\begin{bmatrix} 0.44 & 0.00 \\ 0.53 & 0.06 \\ 0.51 & 0.45 \end{bmatrix}$$</p>

Which just makes the L shape more obvious.

---

Now, with a 6D shape vector for every character, the next step is to be able to find up the "most similar" shape vector given an input 6D sampling vector.

In two dimensions, we could plot the characters on a 2D grid and perform a nearest neighbor search in a fairly straightforward manner:

<CharacterPlot highlight="a" inputPoints={[
  { vector: [0.44, 0.63], label: "Input" }
]} normalize />

The same idea applies in $6$ dimensions, though it's less intuitive to visualize. We'll lay our shape vectors out as points in some $6$-dimensional space and perform nearest neighbor lookups with an input 6D sampling vector (point).


### Nearest neighbor lookups in a 6D space

Finding the nearest neighbor (closest point) in an N-dimensional space boils down to finding the point whose Euclidian distance to our input point is the smallest.

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

Now, let's say that we have our ASCII characters and their associated shape vectors in a <Ts>CHARACTERS</Ts> array:

```ts
const CHARACTERS: Array<{
  character: string,
  shapeVector: number[],
}> = [...];
```

We can then perform a nearest neighbor search like so:

```ts
function findCharacter(samplingVector: number[]) {
  let bestCharacter = "";
  let bestDistance = Infinity;
  
  for (const { character, shapeVector } of CHARACTERS) {
    const dist = euclideanDistanceSquared(shapeVector, samplingVector);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestCharacter = character;
    }
  }
  
  return bestCharacter;
}
```

This gives us the ASCII character whose shape best matches our sampling vector.

Do note that this is not very performant. Once we start rendering thousands of ASCII characters at $60$ <abbr title="Frames per second">FPS</abbr>, we'll need to speed up performance significantly.

We'll take a look at how we can do that later -- let's first get to rendering some scenes!


### Trying out the 6D sampling approach

If we render the circle example from before with 6D sampling vectors, we get the following:

<AsciiScene width={360} height={360} fontSize={20} rowHeight={24} columnWidth={20} viewMode="ascii" offsetAlign="left" sampleQuality={4} alphabet="default" increaseContrast>
  <Scene2D scene="circle" />
</AsciiScene>

Those are some really good character picks! `L` is an excellent pick for the upper-right part and `P` is a great pick for the lower-right part.

Let's look at our rotating square:

<AsciiScene width={600} minWidth={400} height={360} fontSize={20} rowHeight={24} columnWidth={19} viewMode="ascii" offsetAlign="left" sampleQuality={10}>
  <Scene2D scene="rotating_square" />
</AsciiScene>

Oh yeah, that's excellent. You can easily tell that it's a rotating square -- the picked characters match the shape very well.

Now, let's try rendering a 3D scene!


### Rendering a 3D scene

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

The shade split is quite obvious -- `i`s on the left and `B`s on the right -- but the boundary is not very sharp.

By applying some image processing effects to the sampling vector, we can enhance the boundary so that it appears sharper:

<AsciiScene width={600} minWidth={400} height={360} fontSize={13} rowHeight={15} effects={["crunch"]}>
  <Scene2D scene="shade_split" />
</AsciiScene>

Here's the 3D scene from earlier with this same effect applied:

<AsciiScene height={540} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]} effects={["crunch"]}>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>

Quite a drastic difference! Let's look at how we can implement this sharpening effect.

## Increasing sharpness

Consider this color boundary:

<AsciiScene showGrid fontSize={140} rows={1.4} cols={3.4} viewMode="transparent" sampleQuality={5} hideAscii>
  <Scene2D scene="shade_split_static" />
</AsciiScene>

For the middle three cells, we get the same 6D sampling vector that looks like so:

<p className="mathblock">$$\begin{bmatrix} 0.65 & 0.65 \\ 0.31 & 0.31 \\ 0.22 & 0.22 \end{bmatrix}$$</p>

I'll start visualizing vectors using circles with different lightness levels like so -- it makes things easier to parse:

<Vector6D
  samplingVector={[0.65, 0.65, 0.31, 0.31, 0.22, 0.22]}
/>

Currently, this sampling vector resolves to the character `T`:

<InteractiveVector6D
  samplingVector={[0.65, 0.65, 0.31, 0.31, 0.22, 0.22]}
  showCharacterPick
/>

That's a sensible choice -- the character `T` is visually dense in the top half and less so in the bottom half. Still, I want the picked character to emphasize the shape of the boundary better. We can achieve that by enhancing the contrast of the sampling vector.

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

As the exponent is increased to $2$ the darker components of the sampling vector quickly become _much_ darker. However, the lighter components also get pulled towards zero by a significant amount.

I don't want that. I want to increase the contrast _between_ the lighter and darker components of the sampling vector, not the vector in its entirety.

To achieve that, we can normalize the sampling vector to the range $[0, 1]$ prior to applying the exponent, and then "denormalizing" the vector back to the original range afterwards.

The normalization to $[0, 1]$ can be done by dividing each component by the maximum component value. After applying the exponent, mapping back to the original range is done by multiplying each component by the same max value:

```ts
const maxValue = Math.max(...samplingVector)

samplingVector = samplingVector.map((value) => {
  value = x / maxValue; // Normalize
  value = Math.pow(x, exponent);
  value = x * maxValue; // Denormalize
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

Awesome! The pick of `"` over `T` emphasizes the separation between the lighter region above and the darker region below!

<AsciiScene showGrid fontSize={140} rows={1.4} cols={3.4} viewMode="transparent" sampleQuality={5} effects={["crunch"]}>
  <Scene2D scene="shade_split_static" />
</AsciiScene>

There's a trade-off to consider, though. By enhancing the contrast, we get a character that less faithfully represents the lightness of the region that the cell encompasses. We do, however, get a character that better matches the "shape" of the region.

Another aspect to consider is that because we normalize prior to applying the exponent, the highest values -- and values close to the highest value -- are not affected much when an exponent is applied. This causes vectors that are uniform-ish in value to not be affected much by contrast enhancement:

<InteractiveVector6D
  vary="global_exponent"
  showCharacterPick
  samplingVector={[0.64, 0.52, 0.62, 0.51, 0.60, 0.50]}
/>

<SmallNote label="" center>Because the vector is fairly uniform the contrast enhancement only has a slight effect and doesn't change the picked character.</SmallNote>

This is a good thing! If we have a smooth gradient in our image, we'd want to retain it. We very much do _not_ want to introduce unnecessary choppiness.

Vectors at the boundaries of two different-colored surfaces will have larger differences in the sampling vector, which the contrast enhancement enhances:

<InteractiveVector6D
  vary="global_exponent"
  showCharacterPick
  samplingVector={[0.68, 0.31, 0.76, 0.31, 0.77, 0.78]}
/>

<SmallNote label="" center>I _love_ the transition from `& -> b -> L` as the L-shape of the vector becomes more pronounced!</SmallNote>

Compare the 3D scene ASCII rendering with and without this contrast enhancement:

<AsciiScene height={540} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]} effects={["global_crunch"]} optimizePerformance vary={["global_crunch_exponent"]} usesVariables>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>

We see edges becoming sharper, but this is not at the level of quality I want just yet. Not all edges become quite sharp enough, and those that do encounter a "staircasing" effect.

The example below demonstrates the staircase effect -- observe how the darker part of the edge becomes "staircase-y" as you increase the exponent:

<AsciiScene width={400} height={300} fontSize={19} rowHeight={18} columnWidth={15} viewMode="transparent" vary={["global_crunch_exponent", "directional_crunch_exponent"]} effects={["crunch"]} usesVariables exclude="|v">
  <Scene2D scene="staircase_effect" />
</AsciiScene>

Why might this be? Well, a cell at the edge might have one or a few light sample in the top-left corner, while the rest of the samples will be dark. When the sampling vector has at least one sample, _all_ of the dark samples will be crunched as a result. This looks kind of like so:

<InteractiveVector6D
  vary="global_exponent"
  showCharacterPick
  samplingVector={[0.6, 0.2, 0.2, 0.2, 0.2, 0.2]}
/>

Consider the row in the middle of the canvas, progressing from left to right. As we start off, every sample is light and we get `U`s, so the first characters will be U

```text
UUUUUUUU ->
```

Then, as we progress a bit further, we start getting dark bottom samples. Those are crunched by the lighter components so we get some `Y`s:

```text
UUUUUUUUYY ->
```

As we move right we get more and more dark bottom samples, which all get crunched the same. This results in characters that more and more only visually occupy the upper region:

```text
UUUUUUUUYYf""''` ->
```

After we move a bit more to the right, we get no light samples. That causes no crunching to occur, resulting in us getting `!`s:

```text
UUUUUUUUYYf""''`!!!!!!!!!! ->
```

This sudden stop in crunching as we get no more light samples is what causes the staircasing effect:

```text:no_ligatures
                   !!!!!!!!
             !!!!!!!!!!!!!!
      !!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!
```

To get rid of this we'll apply a another layer of contrast enhancement, this time looking outside of the boundary of each cell.

### Directional contrast enhancement

We currently have sampling circles arranged like so:

<AsciiScene alphabet="simple-directional-crunch" showGrid fontSize={140} rows={2.2} cols={2.6} hideSpaces showSamplingCircles forceSamplingValue={0}>
  {"F"}
</AsciiScene>

For each of those sampling circles, we'll specify an "external sampling circle", placed outside of the cell's boundary like so:

<AsciiScene alphabet="simple-directional-crunch" showGrid fontSize={140} rows={2.2} cols={2.6} hideSpaces showSamplingCircles showExternalSamplingCircles forceSamplingValue={0}>
  {"F"}
</AsciiScene>

Each of those external sampling circles is "reaching" into the region of a neighboring cell. Together, the samples that are collected by the external sampling circles constitute an "external sampling vector".

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

But here, for each index $i$ of our sampling vector, we'll calculate the max value like so:

```ts
const maxValue = Math.max(samplingVector[i], externalSamplingVector[i])
```

Aside from that, the contrast enhancement is performed in the same way:

```ts
samplingVector = samplingVector.map((value, i) => {
  const maxValue = Math.max(value, externalSamplingVector[i]);
  value = value / maxValue;
  value = Math.pow(value, exponent);
  value = value * maxValue;
  return value;
});
```

As we can see in the example below, light values in the external sampling vector push values in the sampling vector down:

<InteractiveVector6D
  samplingVector={[0.51, 0.51, 0.52, 0.52, 0.53, 0.53]}
  externalVector={[0.80, 0.51, 0.57, 0.52, 0.53, 0.53]}
  vary="directional_exponent"
  showCharacterPick
/>

I call this "directional contrast enhancement", since each of the external samples reaches outside of the cell in the _direction_ of the sampling vector component that it is enhancing the contrast of. I describe the other effect as "global contrast enhancement", since it acts on all of the sampling vector's components.

However, this doesn't quite get rid of the staircasing effect. Take a look -- in the example below, the global crunch is set use an exponent of $4$, but you can vary the directional crunch exponent:

<AsciiScene width={400} height={300} alphabet="simple-directional-crunch" fontSize={19} rowHeight={18} columnWidth={15} viewMode="transparent" usesVariables exclude="|v" effects={{
  global_crunch: 4,
  directional_crunch: [1, { range: [1, 5], step: 0.25 }],
}}>
  <Scene2D scene="staircase_effect" />
</AsciiScene>

We can see the lower edge "shift down" a bit as the characters closest to the edge change from `!` to `:`. 

The change to `!` to `:` is good, but not enough. To properly get rid of the staircasing, I'd want a sequence like so:

```text:no_ligatures
            ..::!!
      ..::!!!!!!!!
..::!!!!!!!!!!!!!!
```

Our problem is that the directional crunch is too local -- it isn't reaching the middle components of the sampling vector. Even if both of the top external samples are light, it only affects the uppermost components:

<InteractiveVector6D
  samplingVector={[0.3, 0.3, 0.3, 0.3, 0.3, 0.3]}
  externalVector={[0.8, 0.8, 0.3, 0.3, 0.3, 0.3]}
  vary="directional_exponent"
  showCharacterPick
  exclude="|v"
/>

But because the lightness of the four bottom components is retained, we don't get to `.`, just `:`.

### Wider directional crunch

I'd like to "widen" the directional crunch so that, for example, light external values close to the top spread to the middle components of the sampling vector.

To do that, I'll introduce a few more external sampling circles, arranged like so:

<AsciiScene showGrid fontSize={140} rows={2.2} cols={2.6} hideSpaces showSamplingCircles showExternalSamplingCircles forceSamplingValue={0}>
  {"F"}
</AsciiScene>

These are a total of $10$ external sampling circles. Each of the external sampling circles will specify $n$ "internal" sampling circles that it affects. The example below lets you hover the sampling circles to see the relationships:


<InteractiveVector6D
  samplingVector={[0.3, 0.3, 0.3, 0.3, 0.3, 0.3]}
  externalVector={[0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3]}
  drawAffects
/>

For each component of the sampling vector, we take the _maximum_ external sampling value across the external sampling circles that affect that component, and crunch it with that.

Let's implement this. Given that the internal and external sampling circles are ordered like so:

<InteractiveVector6D
  samplingVector={[0.3, 0.3, 0.3, 0.3, 0.3, 0.3]}
  externalVector={[0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3]}
  showOrder
  drawAffects
/>

We can define a mapping from the the internal to the external sampling circles that affect it:

```ts
const AFFECTING_EXTERNAL_INDICES = [
  [0, 1, 2, 4],
  [0, 1, 3, 5],
  [2, 4, 6],
  [3, 5, 7],
  [4, 6, 8, 9],
  [5, 7, 8, 9],
];
```

With this, we can change the calculation from <Ts>maxValue</Ts> to take the maximum affecting external value:

```ts
// Before
const maxValue = Math.max(value, externalSamplingVector[i]);

// After
let maxValue = value;
for (const externalIndex of AFFECTING_EXTERNAL_INDICES[i]) {
  maxValue = Math.max(value, externalSamplingVector[externalIndex]);
}
```

Which makes the direction crunch implementation look like so:

```ts
samplingVector = samplingVector.map((value, i) => {
  let maxValue = value;
  for (const externalIndex of AFFECTING_EXTERNAL_INDICES[i]) {
    maxValue = Math.max(value, externalSamplingVector[externalIndex]);
  }
  value = value / maxValue;
  value = Math.pow(value, exponent);
  value = value * maxValue;
  return value;
});
```

With this change, check out what happens if the top four external sampling circles are light: it causes the crunching to be applied to all but the bottom two sampling circles, giving us the desired effect

<InteractiveVector6D
  samplingVector={[0.3, 0.3, 0.3, 0.3, 0.3, 0.3]}
  externalVector={[0.8, 0.8, 0.8, 0.8, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3]}
  vary="directional_exponent"
  showCharacterPick
  exclude="|v"
  drawAffects
/>

It only takes an exponent of a bit less than $2$ for the vector to get crunched to `.`! Even if only the two top-left external sampling circles are light, the vector gets crunched sufficiently for us to get `.` with an exponent just under $4$:

<InteractiveVector6D
  samplingVector={[0.3, 0.3, 0.3, 0.3, 0.3, 0.3]}
  externalVector={[0.8, 0.3, 0.8, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3]}
  vary="directional_exponent"
  showCharacterPick
  exclude="|v"
  drawAffects
/>

Let's try this new and improved directional crunch and see if it resolves the staircasing effect:

<AsciiScene width={400} height={300} fontSize={19} rowHeight={18} columnWidth={15} viewMode="transparent" usesVariables exclude="|v" effects={{
  global_crunch: 2.7,
  directional_crunch: [1, { range: [1, 4], step: 0.25 }],
}}>
  <Scene2D scene="staircase_effect" />
</AsciiScene>

Oh yeah -- that looks awesome! You can clearly see the edge form.

Here's the 3D scene again, this time with both the global and improved directional crunch. I'll let you toggle the crunching effect on and off so that you can see the difference.

<AsciiScene height={540} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]} optimizePerformance effects={{
  global_crunch: 2.7,
  directional_crunch: 3.7,
}}>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>

The crunching makes the edges crisp as heck!

## Final words

These two types of contrast enhancement make the image feel sharper and far more readable than otherwise.

## Appendix I: Character lookup performance

Earlier in this post I showed how can find the best character by finding the character with the shortest Euclidian distance to our sampling vector.

```ts
function findCharacter(samplingVector: number[]) {
  let bestCharacter = "";
  let bestDistance = Infinity;
  
  for (const { shapeVector, character } of CHARACTERS) {
    const dist = euclideanDistanceSquared(shapeVector, samplingVector);
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
  CHARACTERS.map(({ character, shapeVector }) => ({
    point: shapeVector,
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


## Various cool examples

<AsciiScene height={700} fontSize={12} characterWidthMultiplier={0.9} characterHeightMultiplier={0.9} viewModes={["ascii", "split", "canvas"]} effects={["crunch"]} vary={["global_crunch_exponent", "directional_crunch_exponent"]} lightnessEasingFunction="darken" usesVariables>
  <Scene scene="cube-logo" seed={20367} />
</AsciiScene>


## Old intro

Terminal-based LLM coding tools have been coming out left and right. A common motif accompanying those tools has been ASCII art, frequently animated.

I've noticed a few common issues with how people generate the ASCII characters, which leaves the ASCII art either feeling [jaggy][jaggies] or blurry. We can 

[jaggies]: https://en.wikipedia.org/wiki/Jaggies

In this post, let's dive into how we can generate sharp ASCII arts from a dynamic input image. Here's an example of what we'll build:

<AsciiScene height={540} fontSize={12} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]} usesVariables effects={{
  global_crunch: [2.2, { range: [1, 5], step: 0.25 }],
  directional_crunch: [2.8, { range: [1, 5], step: 0.25 }],
}}>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>

<AsciiScene width={400} height={300} fontSize={19} rowHeight={18} columnWidth={15} viewMode="transparent" usesVariables exclude="|v" effects={{
  global_crunch: [1, { range: [1, 5], step: 0.25 }],
  directional_crunch: [1, { range: [1, 5], step: 0.25 }],
}}>
  <Scene2D scene="staircase_effect" />
</AsciiScene>

<AsciiScene width={400} height={300} fontSize={19} rowHeight={18} columnWidth={15} viewMode="transparent" usesVariables exclude="|v" optimizePerformance effects={{
  global_crunch: [1, { range: [1, 5], step: 0.25 }],
  directional_crunch: [1, { range: [1, 5], step: 0.25 }],
}}>
  <Scene2D scene="staircase_effect" />
</AsciiScene>

<AsciiScene height={700} fontSize={12} characterWidthMultiplier={0.9} characterHeightMultiplier={0.9} viewModes={["ascii", "split", "canvas"]} lightnessEasingFunction="darken">
  <Scene scene="cube-logo" seed={20367} />
</AsciiScene>

<SmallNote label="" center>Look how sharp the edges are as a result of picking characters that match them!</SmallNote>

<AsciiScene height={450} width={700} fontSize={13} characterWidthMultiplier={0.8} characterHeightMultiplier={0.8} viewModes={["ascii", "split", "canvas"]} usesVariables exclude="|v" effects={{
  global_crunch: [1, { range: [1, 5], step: 0.25 }],
  directional_crunch: [1, { range: [1, 5], step: 0.25 }],
}}>
  <WebGLShader fragmentShader="multiple_waves" seed={9581} />
</AsciiScene>

Let's get started!

