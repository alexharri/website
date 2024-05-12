---
title: "Stabilizing noisy input devices"
description: ""
image: ""
publishedAt: ""
---

Following is an interactive grid component where the light blue squircle snaps to the closest position in the grid. The white dot represents the input position—try dragging it around.

<NoNoise />

When the input is at the boundaries, the difference between picking one position over another is just a single pixel[1]. Highlighting the boundaries makes this more obvious, take a look:

<NoNoiseShowBoundaries />

As soon as the input crosses the boundary, the element switches positions. This means that a small amount of noise in the input could cause the input to intermittently cross the boundary, making the element jitter.

On precise input devices like trackpads, mice and smartphones we don't really get any observable noise. In those cases, this is a non-issue. However, less precise input devices like VR controllers suffer from jitter and wobbliness. And in the case of VR controllers, the degree of instability only increases as the target element gets further away.

<Scene scene="vr-controller" height={430} zoom={1.4} yOffset={-0.5} usesVariables />

Even if VR controller technology were perfect, human hand coordination introduces noise. Just try holding your hand in front of you and keeping it as still as you can. Even with great motor control, your hand will wiggle every so slightly—even if trying your best to keep it still.

To simulate this effect in our precise 2D environment, we'll introduce a noise component:

<NoiseComponent />

Take a look what happens at the boundaries in the grid example when we apply noise to the input.

<SomeNoise />

We observe the element jumping between positions at random, yet somewhat regular intervals.


## Option scoring

This general problem comes up in lots of applications where the software needs to make a choice between two or more options based on some input. Take the example of building a guide system like the ones found in design software like Figma or Photoshop.

When moving an element towards a guide, at some point the guide becomes close enough to the edge of the element that the software decides that the element should snap to the guide. But what if there are more than one guides which the element is close enough to snap to?

In that case, we can assign scores to each guide and pick the guide with the "best" score. In the case of guides, a good scoring mechanism would be taking the distance from the guide to the edge of the element.

```ts
function bestGuide(element: Element, guides: Guide[]) {
  let bestScore = Infinity;
  let bestGuide: Guide | undefined;

  for (const guide of guides) {
    const score = guide.distanceTo(element);
    if (score < SNAP_THRESHOLD && score < bestScore) {
      bestScore = score;
      bestGuide = guide;
    }
  }

  return bestGuide
}
```

However, this implementation suffers from the jittering problem described above. Take a look: