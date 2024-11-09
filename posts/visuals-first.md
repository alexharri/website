---
title: "Sharing changes, visuals first"
description: "Exploring my visuals-first approach to sharing my work internally."
publishedAt: "2024-11-09"
image: "/images/og-visuals-first.png"
tags: []
---

Over the past year, I've shared much of my work at [Arkio][arkio] internally through so-called "release comics". Here are some examples:

[arkio]: https://www.arkio.is/

<ImageCarousel
  height={440}
  images={[
    { src: "~/wall-snap-to-90-and-side-faces.jpg", dimensions: [3558, 2496] },
    { src: "~/imperial-units.jpg", dimensions: [3626, 2644] },
    { src: "~/wall-guide-system.jpg", dimensions: [3818, 2610] },
    { src: "~/wall-joins-on-cell-edges.jpg", dimensions: [3594, 2644] },
    { src: "~/teleporter-arc-width.jpg", dimensions: [3510, 2238] },
    { src: "~/distance-markers-orthogonal.jpg", dimensions: [3618, 2230] },
  ]}
>
  <SmallNote label="" center>Examples of release comics I've shared within Arkio.</SmallNote>
</ImageCarousel>

These release comics have been an effective medium for communicating changes. Their visual nature makes them really easy to understand at a glance.

<Image src="~/dace-quote.png" width={500} />
<SmallNote label="" center>The feedback I've gotten has been very positive.</SmallNote>

In this post, I'll explore this visual-first approach to sharing changes and discuss what makes it so effective. There'll definitely be some ideas for you to take and apply to your own communication!


## Prior state

To effectively evaluate and reason about a new feature, or a change to an existing one, you'd need to understand what motivated the addition of the feature in the first place. Was it added to work around some problem, or does it make some process more efficient? It helps to know.

So when communicating a change, present the state of affairs _prior_ to your change. If you're restructuring a key workflow, explain why the workflow exists and what wasn't working about it before. It gives the audience a framework to reason about your changes. 

In the release comics, I often present the prior state <EmDash /> and contrast it to the current state <EmDash /> via a before-after comparison.

<Image src="~/guide-no-pass-through-geometry.jpg" width={700} plain />

I love using before-after comparisons <EmDash /> they're such a simple model for communicating change.

<p align="center">_Here's how the thing didn't work.<br />Here it is now, working!_</p>

Although the contrast is effective, before-after images don't always provide enough context on their own. For that reason I usually share a short text description alongside the images, providing context and clarifying the scope of the change.

Still, the visuals are key. They make the context easier to grasp, so less text is needed. Glancing at an image is far more effortless than reading a text description.

### Introducing new behavior

A before-after comparison is an obvious fit when changing existing behavior, and it can also be used to effectively present new behavior. Take the example below, which shows the addition of guide alignment under specific circumstances.

<Image src="~/two-point-guide-alignment.jpg" width={600} plain />

The prior image shows the user experience without the feature (guide alignment). Without guides, the user can try his best to align to the geometry, but will usually be slightly off. Quite frustrating.

The after image then shows how guides make aligning to existing geometry a breeze. When contrasted to the prior state, the value of the new behavior is easily understood. 

## Show, don't tell

A few months after joining, I profiled editing in Arkio and noticed that calculating three-plane intersections constituted around 52% of the time spent when editing large geometries (geometry in Arkio is defined by planes and their intersections). Implementing the fast algorithm for three-plane intersections from [Real-Time Collision Detection][real_time_collision_detection] (chapter 5.4.5) resulted in those calculations becoming ~500% faster, which resulted in editing becoming ~72% faster.

[real_time_collision_detection]: https://www.amazon.com/Real-Time-Collision-Detection-Interactive-Technology/dp/1558607323

One way of sharing the change would be to just state the raw numbers. Telling people that the change improves edit performance by ~72% certainly _sounds_ technically impressive.

But what does that mean for users? Does the performance improvement translate to a better user experience?

To make the change palpable, I recorded a before/after video showing how the change nearly doubled the framerate when editing large objects.

<Image src="~/edit-performance-comparison.mp4" width={740} plain />
<SmallNote label="" center>Look at how much smoother the 'After' experience is!</SmallNote>

I did share the numbers alongside the video, but without the video demonstrating the impact the numbers would have felt abstract.


## Use multiple examples

Earlier this year I made a fairly simple change which was to scale measurement labels down when they were too large to fit the line that they describing (and fully hiding them when too small). It produced useful results in an array of circumstances, so I created multiple pictures to demonstrate:

<ImageCarousel
  width={600}
  images={[
    { src: "~/labels-hidden-when-small.jpg", dimensions: [3510, 2390] },
    { src: "~/labels-scaled-to-fit.jpg", dimensions: [3510, 2390] },
    { src: "~/labels-reduced-overlap.jpg", dimensions: [3510, 2390] },
  ]}
/>

The takeaway is fairly simple <EmDash /> if you're presenting a change that is useful in multiple circumstances, demonstrate that using multiple distinct examples.


## Annotations & illustrations

Last summer, I spent some weeks improving Arkio's guide system. A big part of that work was reducing false-positive guides, i.e. not providing guides that are unhelpful.

One of the concrete changes I made was to disable guides whose origins are occluded. A person reading a description of that change <EmDash /> _"Disabled guides whose origin is occluded."_ <EmDash /> would reasonably ask what the "origin of a guide" is and what it means for it to be occluded. So when sharing that change, I illustrated the idea:

<Image src="~/guide-occlusion.jpg" width={640} plain />

I think this quick and simple annotated image demonstrates the idea more efficiently than any text description can.

Using real screenshots is preferable, but those screenshots often benefit from augmentation <EmDash /> adding annotations to highlight areas, or diagrams to demonstrate an idea. Here are some more examples from my work on the guide system:

<ImageCarousel
  height={440}
  images={[
    { src: "~/guide-fov-filtering.jpg", dimensions: [3510, 2166] },
    { src: "~/guide-distance-limit.jpg", dimensions: [3802, 2580] },
    { src: "~/guide-fov-span.jpg", dimensions: [3802, 2710] },
  ]}
/>

I frequently use annotations for emphasis. The annotations in the example below are not necessary to understand the idea, but they help emphasize it and make it incredibly effortless to understand.

<Image src="~/wall-snaps.jpg" width={660} plain />

These visuals make the changes immediately understood at a glance, whereas textual descriptions require more effort from readers. Most people will not need a deep technical understanding of your changes <EmDash /> they'll appreciate being able to take a cursory glance at an image to get the general idea.


## Actions

I represent actions by connecting the start and end states using an arrow. Here I contrast two start states and their respective end states using arrows:

<Image src="~/wall-side-of-corner.jpg" width={600} plain />

I frequently pair actions with before-after comparisons. Here are some examples of before-after actions from my work on the wall tool for Arkio's 2.0 release:

<ImageCarousel
  width={600}
  images={[
    { src: "~/wall-vertical-faces.jpg", dimensions: [3602, 3126] },
    { src: "~/wall-create-from-corner.jpg", dimensions: [3310, 3344] },
    { src: "~/wall-create-from-edge.jpg", dimensions: [3310, 3082] },
  ]}
/>

This is just one way to represent actions, but it's worked quite well for me!


## Other mediums

This "release comic" idea is tailored to a distributed working culture. However, many of the ideas at work translate well to other forms of communication, like my favorite, live demos!

In live demos, I find that presenters sometimes spend far too little time (if any) explaining the prior state, or explaining the context of what they're presenting. When presenters go straight to showing off exactly how the thing they built works, it can leave the audience lost.

<Note>
Side note: as an audience member, even if you have the full context, it can be helpful to ask prodding questions like _"Under what circumstances would this be used?"_. Getting the presenter to provide context is useful for everyone involved, and makes any post-demo discussions much more productive.
</Note>

I also think that people should use far more annotations and diagrams than they currently do, whether in design documents or traditional presentations. Less text, more visuals! <EmDash /> They make absorbing ideas so much easier.


## Final words

I'm hoping that me writing this will influence some people out there to take a more visual-first approach to communication.

I've found the release comics to aid other people's understanding of my work, and the changes I'm making. They're quick and fun to make, save other people effort, and they act as a very portable artifact for a piece of work!

Sharing changes visually will fit some projects and roles better than others. Still, see if you don't find an opportunity to present your work visually!

<EmDash /> Alex Harri

