---
title: "Canvas to ASCII renderer"
---

Terminal-based LLM coding tools have been coming out left and right. A common motif accompanying those tools has been ASCII art, frequently animated.

I've noticed a few common issues with how people generate the ASCII characters, which leaves the ASCII art either feeling [jaggy][jaggies] or blurry. We can 

[jaggies]: https://en.wikipedia.org/wiki/Jaggies

In this post, let's dive into how we can generate sharp ASCII arts from a dynamic input image. Here's an example of what we'll build:

<AsciiScene height={540} fontSize={11} sampleQuality={1} characterWidthMultiplier={0.85} characterHeightMultiplier={0.85} viewModes={["ascii", "split", "canvas"]} effects={["crunch"]}>
  <Scene scene="cube" autoRotate zoom={2.7} yOffset={0.45} />
</AsciiScene>

Let's get started!
