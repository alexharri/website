---
title: "How I visually communicate my work"
description: ""
publishedAt: ""
image: ""
tags: []
---

Most software engineers could improve how they present their work. That's probably not a controversial take <EmDash /> we're prone to getting too into the weeds, highlighting the _how_ too much and spending too little time on the _what_ and _why_. Especially the _why_.

Over the past year, I've shared a lot of my work at Arkio through so-called "release comics". Here's an example:

<Image src="~/drawing-walls-on-vertical-faces.jpg" width={600} plain />
<SmallNote label="" center>An example of a release comic I shared within Arkio.</SmallNote>

These release comics have been a really effective medium to communicate changes. Their visual nature makes them really easy to understand at a glance.

> _at the risk of repeating myself, i continue to LOVE these comic-book style explanations for features and fixes!_

In this post, I want to explore this visual-first approach of communication and figure out what makes it so effective.


## Prior state

It's quite difficult to reason about a feature <EmDash /> its design and the value it brings <EmDash /> if you don't know why it was added. To properly evaluate it, you'd want to understand the problem it was designed to solve.

So when communicating a change, present the state of affairs _prior_ to your change. Was there a bug in a key workflow? <EmDash /> Explain why the workflow exists, how that bug affected the workflow, and what users did to work around it.

In the release comics, I often present the prior state (and contrast it to its current state) via a before-after comparison.

<Image src="~/guide-no-pass-through-geometry.jpg" width={700} plain />

A before-after comparison is a simple model for communicating change.

<p align="center">_Here's how the thing didn't work.<br />Here it is now, working!_</p>

Although the contrast is effective, it doesn't provide context on it's own. For that reason I usually share a short text description alongside these images, providing context and clarifying the scope of the change.

I believe that the visuals make the context easier to grasp. Less text is needed. Glancing at an image is far more effortless than reading a text description.

### New behavior

A before-after comparison is an obvious fit when changing existing behavior, but it can also be used to effectively present new behavior.

Take the example below which shows the addition of guide alignment under specific circumstances.

<Image src="~/two-point-guide-alignment.jpg" width={600} plain />

The prior image shows the experience without the added feature (guide alignment) and how frustrating that experience is for the user. Without the guides, the user can try his best to align to the geometry, but will likely be slightly off. Quite frustrating.

When contrasted to the prior state, the value of the new behavior <EmDash /> as shown in the after image <EmDash /> is easily understood. 

## Show, don't tell

A few months after joining, I profiled editing in Arkio and noticed that calculating three-plane intersections constituted around 52% of time spent when editing large geometries (geometry in Arkio is defined by planes and their intersections). Implementing the fast algorithm for three-plane intersections from [Real-Time Collision Detection][real_time_collision_detection] (chapter 5.4.5) resulted in those calculations becoming ~500% faster, which resulted in editing becoming ~72% faster.

[real_time_collision_detection]: https://www.amazon.com/Real-Time-Collision-Detection-Interactive-Technology/dp/1558607323

One way of sharing the change would be to just state the raw numbers. Telling people that the change improves edit performance by ~72% _sounds_ technically impressive, but what does that mean for users? Does the performance improvement translate to a better user experience?

To make the change palpable, I recorded a before/after video showing how the change nearly doubled the framerate when editing large objects.

<Image src="~/edit-performance-comparison.mp4" width={600} plain />

I did share the numbers alongside the video, but without the video demonstrating the concrete impact the numbers would have felt abstract.


## Multiple examples

A fairly simple change I made is to scale measurement labels to fit the line that they're describing, and fully hiding them when too small. It produced useful results in many circumstances, so I created multiple picture to demonstrate them:

<Image src="~/labels-hidden-when-small.jpg" width={600} plain />
<Image src="~/labels-scaled-to-fit.jpg" width={600} plain />
<Image src="~/labels-reduced-overlap.jpg" width={600} plain />

If you're presenting a change that has a broad impact, demonstrate that using multiple examples!


### Be illustrative

Using screenshots to demonstrate the prior state and advances made is great when possible. But for some changes, it helps to be more explicit and illustrate the changes by adding annotations, highlighting areas, and drawing diagrams.

Last summer I did a lot of work on Arkio's guide system. A big part of that work was eliminating false-positive guides and making helpful guides more available. One of the concrete changes was to disable guides whose origin was occluded.

A person reading a description of that change <EmDash /> _"Disabled guides whose origin is occluded."_ <EmDash /> would reasonably ask what the "origin of a guide" is and what it means for it to be occluded. So when sharing that change, I attached this illustration:

<Image src="~/guide-occlusion.jpg" width={600} plain />

Considering occlusion alone was not enough since guides could originate from behind users. Snapping to those guides would be unhelpful, so we added the condition that the guide's origin must be in the user's field of view for it to be used. I illustrated that like so:

<Image src="~/guide-fov-filtering.jpg" width={600} plain />

These visuals make the changes immediately understood at a glance. Reading a textual description of these changes would be significantly more mental effort for readers <EmDash /> most of which don't need a deep technical understanding of the changes. These visuals take little time to make, but they save a lot of time and effort <EmDash /> both for readers and the person communicating the change.


## Usage & context
























{/*
Prior to the overhaul, guides were filtered out based on distance. Specifically, if the guide was further away than 3x the radius of the bounding sphere of the geometry, the guide would not be used. The idea here is for the maximum distance a guide can be used at to be proportional to the size of the geometry.

This heuristic was effective in filtering out guides from smaller geometry <EmDash /> too effective, in fact. It was often very frustrating that geometry that was a reasonably short distance away and very visible to the user could not be used as guides. But increasing the 3x multiplier to a larger value would increase the number of false positives.

To resolve this, I replaced the "3x radius" heuristic with one that filters guides out based on the size of the guide edge in the user's field of view <EmDash /> the guide edge's FOV span.

Explaining the term "edge FOV span" through text would have been quite the challenge, so to illustrate this change I used two images:+

> Guides are now filtered based on the __size of guide edges in the user's field-of-view__. The current distance-based filtering has been disabled.
>
> This results in guides being available from _much_ further away than before — _much, much further away_. Combined with the recent addition of filtering out non-visible guides, our guides should behave more consistently and be available in more circumstances.
>
> TL;DR: If it's visible and big enough, it can be used as a guide

 1. One to show the removed 3x radius restriction.
 2. One to illustrate the new edge FOV span approach.

<Image src="~/guide-distance-limit.jpg" width={600} plain />
<Image src="~/guide-fov-span.jpg" width={600} plain />
*/}

