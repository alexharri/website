---
title: "Sticky option scoring"
description: ""
image: ""
publishedAt: ""
---

Below is an interactive grid component where the blue element snaps to the closest position in the grid. The white dot represents the input position—try dragging it around.

<NoNoise />

When the input is at the boundaries, the difference between picking one position over another is just a single pixel[1]. Highlighting the boundaries makes this more obvious, take a look:

<NoNoiseShowBoundaries />

In this grid component, the element switches positions as soon as the input crosses the boundary. This makes for a very responsive application.

However, consider what happens when we introduce some noise to the input.

<NoiseComponent />

When the input is close to a boundary, a small amount of noise can nudge the input over the boundary, making the element switch positions. Try out the updated grid component below with noise introduced:

<SomeNoise />

The noise component, especially at the boundaries, causes jittering and a feeling of instability. On precise input devices like trackpads, mice and smartphones we don't really get any observable noise. In those cases, this is a non-issue. However, less precise input devices like VR controllers suffer from jitter and wobbliness.

And in the case of VR controllers, the degree of instability only increases as the target element gets further away. In the example below the amount of controller wobble stays the same but the resulting noise at the target destination increases significantly as the controller gets further away.

<Scene scene="vr-controller" height={430} zoom={1.4} yOffset={-0.5} usesVariables />

Even if VR controller technology were perfect, human hand coordination introduces noise. Just try holding your hand in front of you and keeping it as still as you can. Even with great motor control, your hand will wiggle every so slightly—even if trying your best to keep it still.

## Option scoring

This general problem arises when software needs to make a choice between two or more options based on an input. Take the example of building a guide system like the ones found in design software like Figma or Photoshop.

When moving an element towards a guide, at some point the guide becomes close enough to the edge of the element that the software decides that the element should snap to the guide. But what if there are more than one guides which the element is close enough to snap to?

In that case, we can assign scores to each guide and pick the guide with the "best" score. In the case of guides, a good scoring mechanism would be taking the distance from the guide to the edge of the element.

```ts
function bestGuide(element: Element, guides: Guide[]) {
  let bestScore = Infinity;
  let bestGuide: Guide | undefined;

  for (const guide of guides) {
    const score = guide.distanceTo(element);
    if (score < bestScore) {
      bestScore = score;
      bestGuide = guide;
    }
  }

  return bestGuide
}
```

This naive implementation faces the same issue as our grid component above. When the element is roughly the same distance away from two guides, tiny nudges in either direction change which guide is picked. Let's see what this looks like:

<Guides />

Again, we see instability at the boundary. This naive method of option scoring—always picking the best score—can result in applications that feel finnicky. Even unstable.

Let's simplify and consider the "minimal reproduction" for this problem. It just has two options: left and right. Like before, the input will be represented by a white dot. Our two options will be in the form of two lines at each side of the canvas.

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

Let's see how we can widen this infinitely small boundary by introducing stickiness to our scoring.


## Sticky option scoring

The problem results from us picking a new option when the scores have not changed by enough to warrant picking a new option.

To combat this, we can adjust our scoring mechanism to inflate the score of the last picked option by some amount, for example 20%.

```ts
for (const option of options) {
  let score = guide.calculateScore(input);

  if (option === lastPickedOption) {
    score *= 1.2; // Increase score by 20%
  }
  
  if (score > bestScore) {
    bestScore = score;
    bestOption = guide;
  }
}
```

Increasing the score of the last picked option by 20% means that another option needs to be at least 20% better for it to overtake as the best option.

Let's take a look at our example again with the 20% boost specifically highlighted to show its impact.

<OptionsSticky />

As we can see, the influence of noise has been greatly diminished because the amount of change needed to cause an option to overtake has been significantly increased.

I call this inflating of the score of the last picked option _sticky option scoring_, and the amount we inflate the score by is the _stickiness factor_. For example, multiplying the score of the last picked option by 1.2 corresponds to a stickiness factor of 20%.


### The widened boundary

A side effect of boosting the score of the last picked option is the switch between options no longer occurs at the midpoint between said options. The boundary between the options is still at the middle, but it has been widened.

<OptionsStickyGap />

The boundary is no longer a single pixel. Rather, it is a proportion of the distance between the options. This, in effect, creates two points-of-change.

In the case where the scores between two options change linearly and symmetrically, like in our example where the score is a function of distance, we can calculate these points of change. Let's give the distance between the options the name $D$ and we'll give the stickiness factor the name $S$. The width of the boundary $W$ then becomes:

<p className="mathblock">$$ W = D \times \dfrac{S}{2 + S} $$</p>

With that, our two points of change $P_1$ and $P_2$ become the midpoint between the options plus/minus half the width of the boundary $W$:

<p className="mathblock">$$ P_1 = D \times 0.5 - W \times 0.5 $$<br />$$ P_2 = D \times 0.5 + W \times 0.5 $$</p>

The example below allows you to change the stickiness factor between 0% and 100%.

<OptionsStickyGapDynamic />


## Picking a stickiness factor

Picking an appropriate stickiness factor for your application is a mix of an art and a science, though in my applications I've found 10-50% to be a good range.

There's nothing preventing you from using larger stickiness factors, such as 200% or 500%. The example below allows you to pick stickiness factors from 0% to 1,000% in 100% increments.

<LargeStickinessFactors />

Larger stickiness factors make the change needed to pick a new option _really large_ relative to the distance between the options. This tends to feel off since it makes application slow to responds to change.

The 10-50% range I mentioned is pretty broad, so how can we narrow it down? There are two variables I've found to be good heuristics for determining which part of the range to use, which are

 1. the input's relative scale, and
 2. the amount of noise in your input.

 The latter point regarding noise is more immediately obvious; more noise in the input warrants a larger stickiness factor to combat its effect. But what "relative scale of input" means is less obvious, so let's take a better look. 


### Relative scale of input

The most obvious example to use to demonstrate this idea is a canvas based editor like Figma.

If the user's level of zoom is 500%, each pixel of change in the input—the user's mouse position—corresponds to just 0.2px of change in the document. And if the user is zoomed out to 25%, each pixel of change in the input corresponds to 4px of change in the document. As the user's scale decreases or increases, so does the relative scale of the input.

When the input's scale is small, such as when the user is zoomed in, the input is inherently more stable since more change is needed from the user to produce the same change. The increased stability means a lower _need_ for stickiness.


### Stickiness & responsiveness

I think it's worth highlighting the fact that increasing stability through stickiness comes at the expense of responsiveness. As you add more stickiness, the application does become more stable, but it also becomes slower to respond to change.

Stickiness is definitely not a silver bullet. It's a trade-off.
