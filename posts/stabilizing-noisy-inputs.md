---
title: "Sticky option scoring"
description: ""
image: ""
publishedAt: ""
---

Below is an interactive grid component where the blue element snaps to the position in the grid that's closest to the input position. The white dot represents the input position—try dragging it around.

<NoNoise />

At the boundaries, the difference between picking one position over another is just a single pixel[1]. Highlighting the boundaries makes this more obvious:

<NoNoiseShowBoundaries />

When the input crosses the boundary that changes the selected grid position. Makes sense, but consider what happens when we introduce some noise to the input.

<NoiseComponent />

When the input is close to a boundary, a small amount of noise can nudge the input over the boundary, changing the resulting grid position. Below is the same grid component with noise introduced—see what happens at the boundaries.

<SomeNoise />

The noise component causes jittering and a feeling of instability at the boundaries. On precise input devices like trackpads, mice and smartphones we don't really get any observable noise. In those cases, this is a non-issue. However, less precise input devices like VR controllers suffer from jitter and wobbliness.

And in the case of VR controllers, the degree of instability only increases as the target element gets further away. In the example below the amount of controller wobble stays the same but the resulting noise at the target destination increases significantly as the controller gets further away.

<Scene scene="vr-controller" height={430} zoom={1.4} yOffset={-0.5} usesVariables />

Even if VR controller technology were perfect, human hand coordination introduces noise. Just try holding your hand in front of you and keeping it as still as you can. Even with great motor control, your hand will wiggle every so slightly.

## Option scoring

Take the example of building a guide system like the ones found in design software like Figma or Photoshop.

When moving an element towards a guide, at some point the guide becomes close enough to the edge of the element that the software decides that the element should snap to the guide. But what if there are more than one guides which the element is close enough to snap to?

In that case, we can assign scores to each guide and pick the guide with the best score. In the case of guides, a good scoring mechanism would be taking the distance from the guide to the edge of the element.

```ts
function findBestGuide(element: Element, guides: Guide[]) {
  let bestScore = Infinity;
  let bestGuide: Guide | null = null;

  for (const guide of guides) {
    const score = guide.distanceTo(element);
    if (score < bestScore) { // Lower (closer) is better
      bestScore = score;
      bestGuide = guide;
    }
  }

  return bestGuide
}
```

This method of scoring the options (guides) certainly works, but it forms a boundary at midpoint between the two guides.

<Guides />

The boundary is infinitely thin so, just like in our grid example, a tiny nudge in either direction would change the picked guide. If any sort of noise were introduced, that would result in instability and jittering at the boundary.

---

Let's simplify and consider the "minimal reproduction" for this general problem. We'll use two options: left and right. Like before, the input will be represented by a white dot. Our two options will be in the form of two lines at each side of the canvas.

<Options />

Our method of scoring will be to take the horizontal distance from the input to the line, and subtract that from a constant.

```ts
function score(inputX: number, lineX: number): number {
  const distance = Math.abs(inputX - lineX);
  return CONSTANT - distance;
}
```

This creates a score that increases as the input gets closer to the line, meaning higher scores are better. Let's take a look at our component again with the scores visualized.

<OptionsWithScore />

This gives us a very clear view of what's happening. The point where the scores are equal create a boundary where an infintely small nudge in either direction changes which option is picked.

Let's see how we can widen this infinitely thin boundary by introducing stickiness.


## Sticky option scoring

The jittering problem results from picking a new option when the scores have not changed by enough to warrant a new option being picked.

To combat this, we can adjust our scoring mechanism to inflate the scores of the last picked option by some percentage, for example 20%.

```ts
for (const option of options) {
  let score = option.calculateScore(input);

  if (option === lastPickedOption) {
    score *= 1.2; // Increase score of last picked option by 20%
  }
  
  if (score > bestScore) {
    bestScore = score;
    bestOption = option;
  }
}
```

Increasing the score of the last picked option by 20% means that another option needs to be at least 20% better for it to overtake as the best option.

Let's take a look at our example again with the 20% boost highlighted to show its impact.

<OptionsSticky />

As we can see, the influence of noise has been greatly diminished because the amount of change needed to cause an option to overtake has been significantly increased.

I call this inflating of the score of the last picked option _sticky option scoring_, and the amount that the score is inflated by the _stickiness factor_. For example, multiplying the score of the last picked option by 1.2 corresponds to a stickiness factor of 20%.


### The widened boundary

A side effect of boosting the score of the last picked option is the switch between options no longer occurs at the midpoint between said options. The boundary between the options is still at the middle, but it has been widened.

<OptionsStickyGap />

When using a percentage-based stickiness factor, the boundary becomes a proportion of the distance between the options. This, in effect, creates two points-of-change.

We can calculate these points of change. Let's give the distance between the options the name $D$ and we'll give the stickiness factor the name $S$. The width of the boundary $W$ then becomes:

<p className="mathblock">$$ W = D \times \dfrac{S}{2 + S} $$</p>

With that, our two points of change $P_1$ and $P_2$ become the midpoint between the options plus/minus half the width of the boundary $W$:

<p className="mathblock">$$ P_1 = D \times 0.5 - W \times 0.5 $$<br />$$ P_2 = D \times 0.5 + W \times 0.5 $$</p>

Which we can simplify to:

<p className="mathblock">$$ P_1 = (D - W) \times 0.5 $$<br />$$ P_2 = (D + W) \times 0.5 $$</p>

The example below allows you to change the stickiness factor between 0% and 100%.

<OptionsStickyGapDynamic />


## Picking a stickiness factor

Picking an appropriate stickiness factor for your application is a mix of an art and a science, though in my applications I've found 10-50% to be a good range.

There's nothing preventing you from using larger stickiness factors, such as 200% or 500%. The example below allows you to pick stickiness factors from 0% to 1,000% in 100% increments.

<LargeStickinessFactors />

Larger stickiness factors make the change needed to pick a new option very large relative to the distance between the options. This tends to not feel great since it makes application slow to responds to change.

The 10-50% range I mentioned is pretty broad, so how can we narrow it down? There are two variables I've found to be good heuristics for determining which part of the range to use, which are

 1. the input's relative scale, and
 2. the amount of noise in your input.

 The latter point regarding noise is more immediately obvious; more noise in the input warrants a larger stickiness factor to combat its effect. But what "relative scale of input" means is less obvious, so let's take a better look. 


### Relative scale of input

The most obvious example to use to demonstrate this idea is a canvas based editor like Figma.

If the user's level of zoom is 500%, each pixel of change in the input (the user's mouse position) corresponds to just 0.2px of change in the document. And if the user is zoomed out to 25%, each pixel of change in the input corresponds to 4px of change in the document. As the user's scale decreases or increases, so does the relative scale of the input.

When the input's scale is small, such as when the user is zoomed in, the input is inherently more stable since more change is needed from the user to produce the same change. The increased stability means a lower _need_ for stickiness.


### Stickiness & responsiveness

I think it's worth highlighting the fact that increasing stability through stickiness comes at the expense of responsiveness. As you add more stickiness, the application does become more stable, but it also becomes slower to respond to change.

Stickiness is definitely not a silver bullet. It's a trade-off.


## Example: Applying sticky option scoring

I want to highlighting a recent example where I used sticky option scoring to improve the stability of Arkio's Move tool.

For context, Arkio is an architectural modeler in VR. One of Arkio's tools, the Move tool, allows users to grab geometry and move it around. When the geometry that the user is moving overlaps with other geometry in the model, the tool performs a snap-like operation where the geometry being moved is aligned to the geometry it overlapped with.

[ Add video of grabbing a cell and placing it onto another cell ]

The move tool often has multiple ways to solve the overlap, which requires the tool to pick which face to align. Here is an illustration:

<Image src="~/overlap.svg" plain width={500} noMargin />

The box with the blue outline is the geometry being moved. The move tool can choose to solve this overlap by either

 * aligning the bottom face and moving the cell up, or
 * aligning the left face and moving the cell left.

This produces two different results:

<Image src="~/overlap-solutions.svg" plain width={640} noMargin />

The move tool produces a score for each overlapping face. I won't get into the details of the scoring mechanism, but you can think of the score representing how "deep" the overlap is for the given face.

This creates a boundary along the line where both faces are equally deep. At the boundary, a small nudge in either direction would change the result.

<Image src="~/overlap-boundary.svg" plain width={640} noMargin />

Applying sticky option scoring widened the boundary, requiring more movement from the user to switch positions. Here is a video I made showing the before and after:

<Image src="~/bash-stickiness.mp4" plain width={840} noMargin />

Notice how little movement was required to switch positions before, especially in contrast to how much movement is needed after adding a stickiness factor. This change significantly improved the tool's stability, and by extension made it feel much more usable.