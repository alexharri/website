---
title: "Sticky option scoring"
description: ""
image: ""
publishedAt: ""
---

Following is an interactive grid component where the light blue squircle snaps to the closest position in the grid. The white dot represents the input position—try dragging it around.

<NoNoise />

When the input is at the boundaries, the difference between picking one position over another is just a single pixel[1]. Highlighting the boundaries makes this more obvious, take a look:

<NoNoiseShowBoundaries />

As soon as the input crosses the boundary, the element switches positions. This means that a small amount of noise in the input could cause the input to cross the boundary, changing the result.

On precise input devices like trackpads, mice and smartphones we don't really get any observable noise. In those cases, this is a non-issue. However, less precise input devices like VR controllers suffer from jitter and wobbliness.

And in the case of VR controllers, the degree of instability only increases as the target element gets further away. In the example below the amount of controller wobble stays the same but the resulting noise at the target destination increases significantly as the controller gets further away.

<Scene scene="vr-controller" height={430} zoom={1.4} yOffset={-0.5} usesVariables />

Even if VR controller technology were perfect, human hand coordination introduces noise. Just try holding your hand in front of you and keeping it as still as you can. Even with great motor control, your hand will wiggle every so slightly—even if trying your best to keep it still.

To simulate this effect in our precise 2D environment, we'll introduce a noise component:

<NoiseComponent />

Take a look what happens at the boundaries in the grid example when we apply noise to the input.

<SomeNoise />

At the boundaries the element tends to jump between positions, resulting in somewhat of an unstable feeling.


## Option scoring

This general problem comes up in lots of applications where software needs to make a choice between two or more options based on an input. Take the example of building a guide system like the ones found in design software like Figma or Photoshop.

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

Again, we see instability at the boundary.

This naive method of option scoring—always picking the best score—can result in applications that feel finnicky. Even unstable.

---

Let's simplify this even further. We'll just consider two options—left and right.

Like before, the input will be represented by a white dot. Our two options will be in the form of two lines at each side of the canvas.

<Options />

Our method of scoring will be to subtract the horizontal distance from the input to the line from a constant.

```ts
function score(inputX: number, lineX: number): number {
  const distance = Math.abs(inputX - lineX);
  return CONSTANT - distance;
}
```

We want the "better" option to be the one which is closer to the input, so we'll consider a higher score to be better.

Let's see what this looks like when we visualize the scores.

<OptionsWithScore />

This gives us a very clear view of what's happening. As soon as the score for one option overtakes as the best score, that option is immediately picked.

Let's see how we can remedy the instability by introducing stickiness to our scoring.


## Sticky option scoring

The instability arises from us picking a new option when the scores have not changed by enough to warrant picking a new option.

To combat this, we can adjust our scoring mechanism to inflate the score of the last picked option by some amount, like 20%.

```ts
for (const option of options) {
  let score = guide.calculateScore(input);

  if (options === lastPickedOption) {
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

As we can see, the influence of noise has been greatly diminished because the change needed to cause an option to overtake is greater than the amount of noise.

I call this method of inflating the score of the last picked option _sticky option scoring_, and the amount we inflate the score by is the _stickiness factor_. For example, multiplying the score of the last picked option by 1.2 corresponds to a stickiness factor of 20%.


---

A side effect of boosting the score of the last picked option is the switch between options no longer occurs at the midpoint between said options. The boundary between the options is still at the middle, but it has been widened.

<OptionsStickyGap />

This, in effect, creates two points-of-change. The boundary is no longer a single pixel. Rather, it is a proportion of the distance between the options.

In the case where the scores between two options change linearly and symmetrically, like in our example where the score is a function of distance, we can calculate these points of change. Let's give the distance between the options the name $D$ and we'll give the stickiness factor the name $S$. The width of the boundary $W$ then becomes:

<p className="mathblock">$$ W = D \times \dfrac{S}{2 + S} $$</p>

With that, our two points of change $P_1$ and $P_2$ become the midpoint between the options plus/minus half the width of the boundary $W$:

<p className="mathblock">$$ P_1 = D \times 0.5 - W \times 0.5 $$<br />$$ P_2 = D \times 0.5 + W \times 0.5 $$</p>

The example below allows you to change the stickiness factor between 0% and 100%.

<OptionsStickyGapDynamic />


## Picking a stickiness factor

Picking an appropriate stickiness factor for your application is a mix of an art and a science, though I've typically picked stickiness factors between 10-50%. That range tends to feel great.

There's nothing preventing you from using larger stickiness factors, such as 200% or 500%. The example below allows you to pick stickiness factors from 0% to 1,000% in 100% increments.

<LargeStickinessFactors />

Larger stickiness factors mean that the input needs to move _really far_ for it to have an effect on the picked option, which just feels off. The application should responds much quicker to the change.

The 10-50% range I mentioned is pretty broad. There are two variables I've found to be good heuristics for determining which part of the range to use, which are

 1. the input's relative scale, and
 2. the amount of noise in your input.

 The latter point regarding noise is more immediately obvious. More noise in the input warrants a larger stickiness factor to combat its effect. But what "relative scale of input" means is less obvious, so let's take a better look. 


### Relative scale of input

The most obvious example to use to demonstrate this idea is a canvas based editor like Figma.

If the users level of zoom is 500%, each pixel of change in the input—the users mouse position—corresponds to just 0.2px of change in the document. And if the user is zoomed out to 25%, each pixel of change in the input corresponds to 4px of change in the document. As the users scale decreases or increases, so does the relative scale of the input.

When the input's scale is small, such as when the user is zoomed in, the input is inherently more stable since more change is needed from the user to produce the same change. The increased stability means a lower need for stickiness.

It's important to highlight the fact that a lower stickiness factor is desirable since it increases the responsiveness of the application. Using a higher stickiness factor increases stability _at the expense_ of responsiveness, so be mindful when picking the stickiness factor.
