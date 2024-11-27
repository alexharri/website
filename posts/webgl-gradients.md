---
title: "WebGL gradients"
description: ""
image: ""
publishedAt: ""
tags: []
---

Stripe launched a new design for stripe.com back in 2020 which showcased some beautiful, flowing, animated gradients.

<Image src="~/stripe-gradient.png" width={500} plain marginTop={8} />
<SmallNote center label="">Examples of gradients from various [product pages][stripe_product_page] on stripe.com.</SmallNote>

[stripe_product_page]: https://stripe.com/billing

I remember how striking they were when I first saw them. Since then, I've thought about how they might have been created more times than I'd like to admit.

Well, a few weeks ago I rolled up my sleeves and embarked on a journey to produce a flowing gradient effect. Here's what I got:

<WebGLShader fragmentShader="final" skew />

This is created using a WebGL shader and various types of noise.
