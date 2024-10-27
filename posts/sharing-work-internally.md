---
title: "Sharing your work internally"
description: ""
publishedAt: ""
image: ""
tags: []
---

Most software engineers could improve they way that they communicate their work within their company. That's probably not a controversial take <EmDash /> everyone could put more effort into communicating clearly.

But I think that software engineers tend to particularly prone to focusing on the wrong things when communicating to non-technical folks within their company. We tend to dive too much into technical details to show off the merits of our solutions. We tend to focus too much on the step-by-step behavior of what we built, failing to highlight the problem it solves.

I've been thinking about and reflecting on what matters when communicating your work within the confines of your company, and I've boiled it down to these keys factors:

 1. Prior state
 2. Advances made
 3. Usage & context
 4. Scope and follow-up

In this post, we'll break down what each of them means, when to highlight them, and discuss why they're important.

I'll also share how exactly I've been applying these at my own company. Over the past year at Arkio, I've taken up creating "release comics" which I use to share my changes in a really visual manner:

<Image src="~/drawing-walls-on-vertical-faces.jpg" width={600} plain />
<SmallNote label="" center>An example of a release comic I shared within Arkio.</SmallNote>

These release comics <EmDash /> when accompanied by some key information <EmDash /> have been a really effective tool that hits all four points I mention above. They've been great for communicating changes in geographically distributed company like Arkio.

But these comics are just one way of applying these ideas. We'll also discuss how they apply to other forms of communication such as live demos, design documents, pull requests, and presentations.

With that, let's get to it.


## Prior state

The phrase "prior state" refers to the before part of before/after <EmDash /> what was the state of affairs prior to your change?

Was there a bug affecting some key workflow? Explain how that bug affected the workflow and what users did to work around it. Was there some weird behavior? Show how it manifested.

In the release comics I represent the prior state in the most literal way possible: a before image.

<Image src="~/wall-joins-on-cell-edges.jpg" width={600} plain />

The image above shows a change to existing behavior, but we can also represents new behavior added to a system in the same manner. Take the example below <EmDash /> which shows the addition of guide alignment during two-point creation <EmDash /> where I compare the user experience with and without the feature using a before/after comparison.

<Image src="~/two-point-guide-alignment.jpg" width={600} plain />


## Advances made

This one is fairly straightforward. How does your change improve the state of things?

When sharing improvements, it's very effective to contrast those improvements with the prior state.


### Show, don't tell

A few months after joining, I profiled editing in Arkio and noticed that calculating three-plane intersections constituted 52% of time spent when editing large geometries (geometry in Arkio is defined by planes and their intersections). Implementing the fast algorithm for three-plane intersections from [Real-Time Collision Detection][real_time_collision_detection] (chapter 5.4.5) resulted in those calculations becoming ~500% faster. As a whole, editing became ~42% faster.

[real_time_collision_detection]: https://www.amazon.com/Real-Time-Collision-Detection-Interactive-Technology/dp/1558607323

One way of sharing the change would be to just state the raw numbers. Telling people that the change improves edit performance by ~42% _sounds_ technically impressive, but what does that mean for users of the app? Fast edits are cool and all, but is this creating value for our users?

To make the change palpable, I recorded a before/after video showing how the change nearly doubled the framerate when editing large objects.

<Image src="~/edit-performance-comparison.mp4" width={600} plain />

I shared the raw numbers alongside the video <EmDash /> but without visualizing the impact through the video, the numbers would have felt abstract and meaningless.


### Multiple examples

A fairly simple change I made is to scale down measurement labels when they're too large to fit the line that they're describing, and fully hiding them when too small. It had multiple effects, so I created a picture to demonstrate each of them:

<Image src="~/labels-hidden-when-small.jpg" width={600} plain />
<Image src="~/labels-scaled-to-fit.jpg" width={600} plain />
<Image src="~/labels-reduced-overlap.jpg" width={600} plain />


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

