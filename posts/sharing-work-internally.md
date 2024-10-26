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
 3. Usage & workflow
 4. Scope and follow-up

In this post, we'll break down what each of them means, when to highlight them, and discuss why they're important.

I'll also share how exactly I've been applying these at my own company. Over the past year at Arkio, I've taken up creating "release comics" which I use to share my changes in a really visual manner:

<Image src="~/drawing-walls-on-vertical-faces.jpg" width={600} plain />
<SmallNote label="" center>An example of a release comic I shared within Arkio <EmDash /> I've created over 50 of these over the past year!</SmallNote>

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

