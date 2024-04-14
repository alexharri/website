---
title: "Planes in 3D space"
---

{/** todo better system for this */}
<span data-varlabel="d">$d$</span>
<span data-varlabel="x">$x$</span>
<span data-varlabel="D">$D$</span>
<span data-varlabel="S">$S$</span>
<span data-varlabel="vec_n">$\vec{n}$</span>
<span data-varlabel="n">$n$</span>
<span data-varlabel="P_1">$P_1$</span>
<span data-varlabel="P_2">$P_2$</span>
<span data-varlabel="P_3">$P_3$</span>
<span data-varlabel="vec_v1">$\vec{v_1}$</span>
<span data-varlabel="vec_v2">$\vec{v_2}$</span>
<span data-varlabel="p_x">$p_x$</span>
<span data-varlabel="P">$P$</span>

A plane in 3D space can be thought of as flat surface that stretches infinitely far, splitting 3D space into two halves.

<Scene scene="what-is-a-plane" height={450} yOffset={-0.5} angle={10} usesVariables />

Planes have loads of uses in application which deal with 3D geometry. I've mostly been working with them in the context of an architectural modeler, where geometry is defined in terms of planes and their intersections.

When I was learning about planes, they felt quite abstract and non-intuitive, so it took some time for me to build an intuition for how to reason about and work with them.

In writing this, I want to provide you with an introduction to planes that focuses on building a practical, intuitive understanding for working with planes. I hope to achieve through the use of visual and interactive explanations, which will accompany us as we work through progressively more complex problems.

With that out of the way, let's get to it!

## Describing planes

There are many ways to describe planes, such as via

 1. a point in 3D space and a normal,
 2. three points in 3D space, forming a triangle, or
 3. a normal and a distance from an origin.

<Note>
  Throughout this post, the term _normal_ will refer to a _normalized_ direction vector (unit vector) whose magnitude (length) is equal to 1.
</Note>

Starting with the point-and-normal case, here's an example of a plane described by a point in 3D space $p$ and a normal $\vec{n}$:

<Scene scene="point-and-normal-with-plane" height={400} yOffset={-1} usesVariables />

The normal $\vec{n}$ describes the plane's orientation, where the surface of the plane is perpendicular to $\vec{n}$, while the point $p$ describes _a_ point which the plane intersects.

We described this plane in terms of a single point $p$, but keep in mind that this plane—let's call it $P$—intersects infinitely many points.

<Scene scene="plane-intersecting-points" height={400} yOffset={-1} usesVariables />

If $P$ were described by one of those other points intersecting $P$, we would be describing the exact same plane. This is a result of the infinite nature of planes.

This way of describing a plane—in terms of a point and a normal—is the [point-normal form][point_normal_form] of planes.

[point_normal_form]: https://en.wikipedia.org/wiki/Euclidean_planes_in_three-dimensional_space#Point%E2%80%93normal_form_and_general_form_of_the_equation_of_a_plane

We can also describe a plane using three points in 3D space $a$, $b$, $c$ forming a triangle:

<Scene scene="three-points" height={380} yOffset={-0.3} />

The triangle forms a plane, but for us to be able to do anything useful with the plane we'll need to calculate it's normal $\vec{n}$. Once we've calculated the plane's normal, we can use it along with one of the triangle's three points to describe the plane in point-normal form.

<Scene scene="three-points-normal-centered" height={380} yOffset={-0.3} />

<SmallNote label="" center>As mentioned earlier, the normal $\vec{n}$ describing a plane is a unit vector ($\|\vec{n}\|=1$) perpendicular to the plane.</SmallNote>

We can use $b - a$ and $c - a$ as two edge vectors that are parallel to the plane's surface.

<Scene scene="three-points-edge-vectors" height={380} yOffset={-0.3} />

By virtue of being parallel to the plane's surface, the vectors $b - a$ and $c - a$ are perpendicular to the plane's normal. This is where the cross product becomes useful to us.

The [cross product][cross_product] takes in two vectors $\vec{a}$ and $\vec{b}$ and returns a vector $\vec{c}$ that is perpendicular to both of them.

<p class="mathblock">$$\vec{c} = \vec{a} × \vec{b}$$</p>

[cross_product]: https://en.wikipedia.org/wiki/Cross_product

A vector perpendicular to the triangle's edge vectors $b - a$ and $c - a$ will also be perpendicular to the triangle's surface. Let's call this vector $\vec{d}$.

<p class="mathblock">$$\vec{d} = (b - a) × (c - a)$$</p>

<Scene scene="three-points-cross-product" height={400} yOffset={-0.3} />

<SmallNote label="" center>$\vec{d}$ has been scaled down for illustrative purposes</SmallNote>

$\vec{d}$ points in the right direction, but it's not a normal. For $\vec{d}$ to be a normal, it's magnitude needs to  equal 1.

We can normalize $\vec{d}$ to $\vec{n}$ by dividing $\vec{d}$ by its magnitude $\|\vec{d}\|$:

<p class="mathblock">$$\vec{n} = \dfrac{\vec{d}}{\|\vec{d}\|}$$</p>

This yields a normal $\vec{n}$ where $\|\vec{n}\| = 1$:

<Scene scene="three-points-normal" height={360} yOffset={-0.3} />

Having found the normal $\vec{n}$ we can use it and any of the points $a$, $b$, $c$ to describe the plane intersecting the three points in point-normal form.

<Scene scene="three-points-plane" height={400} yOffset={-1} />

It doesn't matter which of $a$, $b$, $c$ we use as the point in the point-normal form; we always get the same plane.


### Constant-normal form

There's one more way to describe a plane to cover, which is also the most important: through a normal $\vec{n}$ and a distance $d$.

<Scene scene="constant-normal-form" height={400} usesVariables />

This is the _constant-normal form_ of planes. It makes lots of calculations using planes much simpler.

In the constant-normal form, the distance $d$ denotes how close the plane gets to the origin. Thought of another way: multiplying the normal $\vec{n}$ by $d$ yields the point on the plane that's closest to the origin.

In getting a feel for the difference between the point-normal and constant-normal forms, take this example which describes the same plane in both forms:

<Scene scene="point-normal-and-constant-normal-form" height={400} usesVariables />

The green arrow represents $d$ times $\vec{n}$ from the constant-normal form, while the blue point and arrow represent the point $p$ and normal $\vec{n}$ from the point-normal form.

Translating from the point-normal to the constant-normal form is very easy: the distance $d$ is the [dot product][dot_product] of $\vec{n}$ and $p$.

[dot_product]: https://en.wikipedia.org/wiki/Dot_product

<p class="mathblock">$$\vec{n} \cdot p = d$$</p>

<SmallNote label="" center>If you're not familiar with the dot product, don't worry. We'll cover it thoroughly later on.</SmallNote>

The normal $\vec{n}$ stays the same across both forms, though in the example above you can observe the normal "flipping" visually when $d$ becomes negative.


## Distance from plane

Given an arbitrary point $x$ and a plane $P$ in constant-normal form, we may want to ask how far away the point is from the plane. In other words, what is the minimum distance $x$ needs to travel to lie on the plane?

<Scene scene="point-and-plane" height={400} />

We can frame this differently if we construct a plane $P_x$ intersecting $x$ that is parallel to $P$, which we can do in point-normal form using $x$ as the point and $P$'s normal $\vec{n}$ as the normal:

<Scene scene="point-distance-step-1" height={400} />

With two parallel planes, we can frame the problem as finding the distance between the two planes. This becomes trivial using their constant-normal forms since it allows us to take the difference between their distance components $d_1$ and $d_2$.

So let's find $P_x$'s distance using the $d = \vec{n} \cdot p$ equation we learned about:

<Scene scene="point-distance-step-2" height={400} />

With two distances $d_1$ and $d_2$ from the planes $P$ and $P_x$ the solution simply becomes:

<p class="mathblock">$$ d_1 - d_2 $$</p>

<Scene scene="point-distance-step-3" height={400} />

So, to simplify, given a plane $P$ having a normal $\vec{n}$ and distance $d$, we can calculate a point $x$'s distance from $P$ like so:

<p class="mathblock">$$ d - (\vec{n} \cdot x) $$</p>

The distance may be positive or negative depending on which side of the plane the point is on.


### Projecting a point onto a plane

We just looked at finding a point's distance to a plane. A case where that becomes useful is, for example, if you want to project a point onto a plane.

Given a point $x$ which we want to project onto plane $P$ whose normal is $\vec{n}$ and distance is $d$, we can do that fairly easily. First, let's assign the point's distance from the plane to $D$:

<p class="mathblock">$$ D = d - (\vec{n} \cdot x) $$</p>

Multiplying the plane's normal $\vec{n}$ by $D$ gives us a vector which when added to $x$ projects it onto the plane. Let's call the projected point $S$:

<p class="mathblock">$$ S = x + (\vec{n} \times D) $$</p>

<Scene scene="project-point-onto-plane-along-normal" height={400} />

The projection occurs along the plane's normal, which is sometimes useful. However, you'll often want to perform such a projection along an arbitrary direction, which we'll dive into later in the post. 


## Plane-plane intersection

The intersection of two planes forms an infinite line.

<Scene scene="intersecting-planes" height={340} usesVariables />

We can describe infinite lines in 3D space using a point $p$ and normal $\vec{n}$. The normal $\vec{n}$ describes the line's orientation, while the point $p$ describes a point which the line intersects (passes through).

<Scene scene="line" height={340} zoom={1.5} usesVariables />

Let's take two planes $P_1$ and $P_2$ whose normals are $\vec{n_1}$ and $\vec{n_2}$.

Finding the normal of $P_1$ and $P_2$'s intersection is deceptively simple. It's just the cross product of two the plane normals, which we'll assign to $\vec{d}$.

<p class="mathblock">$$\vec{d} = \vec{n_1} × \vec{n_2}$$</p>

Because the cross product does not yield a unit vector, we'll normalize $\vec{d}$ and assign the normalized direction vector to $\vec{n}$.

<p class="mathblock">$$\vec{n} = \dfrac{\vec{d}}{\|\vec{d}\|}$$</p>

This gives us the intersection's normal $\vec{n}$. Let's zoom in and see it in action.

<Scene scene="intersecting-planes-point-and-normal" height={380} zoom={2} />

This is all we have to do for two planes whose distance components are 0—we can just use $(0, 0, 0)$ as the intersection point and call it a day.

But for planes with non-zero distance components, we'll need to find the point of intersection. We'll take a look at how to do just that, right after we discuss the no-intersection case.

### Handling parallel planes

Two planes whose normals are parallel will never intersect, which is a case that we'll have to handle.

<Scene scene="parallel-planes" height={340} yOffset={-0.5} />

The cross product of two parallel normals is $(0, 0, 0)$. So if $\|\vec{d}\| = 0$, the planes do not intersect.

For many applications, we'll want to treat planes that are _almost_ parallel as being parallel. This means that our plane-plane intersection procedure should yield a result of "no intersection" when the magnitude of $\vec{d}$ is less than some epsilon.

```cs
Line PlanePlaneIntersection(Plane p1, Plane p2) {
  Vector3 direction = Vector3.cross(p1.normal, p2.normal);
  if (direction.magnitude < EPSILON) {
    return null; // Roughly parallel planes
  }
  // ...
}
```

But what should this epsilon be?

Given two normals $\vec{n_1}$ and $\vec{n_2}$ where the angle between $\vec{n_1}$ and $\vec{n_2}$ is $\theta$, we can find a reasonable epsilon by charting $\|\vec{n_1} × \vec{n_2}\|$ for different values of $\theta$:

<Image src="~/cross-product-magnitude-by-angle.png" plain width={840} />

The relationship is linear. As the difference in angles halves, so does the magnitude. A difference of 1° yields a magnitude 0.01745, and a difference of 1/2° yields half of that.

So to determine the epsilon, we can just ask: how low does the angle in degrees need to become for us to consider two planes parallel? Given an angle $\theta°$, we can find the epsilon $\epsilon$ via:

<p class="mathblock">$$\epsilon = 0.01745 \times \theta°$$</p>

If that angle is 1/256°, then we get:

<p class="mathblock">$$\dfrac{0.01745}{256} \approx 0.000068 $$</p>

Which epsilon you choose will depend on your use case.

### Finding the point of intersection

Having computed the normal and handled parallel planes, we can move onto finding a point $p$ along the line of intersection.

Since the line describing a plane-plane intersection is infinite, there are infinitely many points we could choose as $p$.

<Scene scene="intersecting-planes-points" height={380} zoom={1.3} usesVariables />

We can narrow the problem down by taking the plane parallel by the two plane normals $\vec{n_1}$, $\vec{n_2}$ and observing that it intersects the line at a single point.

<Scene scene="intersecting-planes-virtual-plane" height={360} yOffset={-1} usesVariables />

Since the point lies on the plane parallel to the two plane normals, we can find it by exclusively traveling along those normals.

This restrictions allows us to reframe the problem as finding finding two scaling factors $k_1$, $k_2$ which when applied to our plane normals $\vec{n_1}$, $\vec{n_2}$ yields a paralellogram whose tip is at the point of intersection.

<Scene scene="intersecting-planes-offset" height={500} usesVariables />

An interesting property of only traveling along the plane normals is that it yields the point on the line of intersection that is closest to the origin.

Anyway, once $k_1$ and $k_2$ are found, our solution for the point $p$ becomes:

<p class="mathblock">$$p = \vec{n_1} \times k_1 + \vec{n_2} \times k_2 $$</p>

The scaling factors $k_1$, $k_2$ can be computed like so:

```cs
float d11 = Vector3.Dot(p1.normal, p1.normal);
float d12 = Vector3.Dot(p1.normal, p2.normal);
float d22 = Vector3.Dot(p2.normal, p2.normal);

float denom = d11 * d22 - d12 * d12;

float k1 = (p1.distance * d22 - p2.distance * d12) / denom;
float k2 = (p2.distance * d11 - p1.distance * d12) / denom;

Vector3 point = p1.normal * k1 + p2.normal * k2;
```

<SmallNote label="" center>Based on code from [Real-Time Collision Detection by Christer Ericson][further_reading]</SmallNote>

I'm sorry for just throwing the answer for $k_1$ and $k_2$ out there like this. I've tried to find a good geometric way to visualize what's happening here, but I've been unsuccessful so far.

Through some mathematical magic, this code can be optimized down to:

```cs
Vector3 direction = Vector3.cross(p1.normal, p2.normal);

float denom = Vector3.Dot(direction, direction);
Vector3 a = p1.distance * p2.normal;
Vector3 b = p2.distance * p1.normal;
Vector3 point = Vector3.Cross(a - b, direction) / denom;
```

<SmallNote label="" center>How this optimization works can be found in chapter 5.4.4 of [Real-Time Collision Detection by Christer Ericson][further_reading].</SmallNote>

Which completes our plane-plane intersection implementation:

```cs
Line PlanePlaneIntersection(Plane p1, Plane p2) {
  Vector3 direction = Vector3.cross(p1.normal, p2.normal);
  if (direction.magnitude < EPSILON) {
    return null; // Roughly parallel planes
  }

  float denom = Vector3.Dot(direction, direction);
  Vector3 a = p1.distance * p2.normal;
  Vector3 b = p2.distance * p1.normal;
  Vector3 point = Vector3.Cross(a - b, direction) / denom;

  Vector3 normal = direction.normalized;

  return new Line(point, normal);
}
```


## Line-plane intersection

Earlier, we covered projecting a point onto a plane along the plane's normal.

However, it is generally more useful to be able to project a point onto a plane along an arbitrary direction given by a normal $\vec{n}$. Doing that boils down to finding the point of intersection for a line and a plane.

<Scene scene="project-point-onto-plane" height={420} yOffset={-1} usesVariables />

The line will be composed of the point $x$ and normal $\vec{n}$. Our goal will be to find a distance $D$ that $x$ needs to travel along $\vec{n}$ such that it lies on the plane.

But first we'll need to check if the line will intersect the plane at all, which we know how to do:

```cs
Vector3 LinePlaneIntersection(Line line, Plane plane) {
  float dot = Mathf.Abs(Vector3.Dot(line.normal, plane.normal));
  if (dot < EPSILON) {
      return null; // Line is parallel to plane's surface
  }

  // ...
}
```

<SmallNote label="" center>See if you can figure why Mathf.Abs is used here. We'll cover it later, so you'll see if you're right.</SmallNote>

Given in constant-normal form, the plane has a normal $\vec{n_p}$ and a distance $d_p$.

First, we can figure out the distance $D_p$ that we'd need to travel if $\vec{n}$ and $\vec{n_p}$ were parallel, which is what we did when projecting along the plane's normal.

<p class="mathblock">$$ D_p = d_p - (\vec{n_p} \cdot x) $$</p>

Let's try projecting $x$ along $\vec{n}$ using $D_p$ like so:

<p class="mathblock">$$ P = x + \vec{n} \times D_p $$</p>

We'll visualize $P$ as a red point:

<Scene scene="project-point-onto-plane-2" height={500} usesVariables />

As $\vec{n}$ and $\vec{n_p}$ become parallel, $D_p$ gets us closer and closer to the correct solution. However, as the angle between $\vec{n}$ and $\vec{n_p}$ increases, $D_p$ becomes increasingly too small.

Here, the dot product comes in handy. Let's do a refresher.

For two vectors $\vec{a}$ and $\vec{b}$, the dot product is defined as

<p class="mathblock">$$\vec{a} \cdot \vec{b} = \|\vec{a}\|\,\|\vec{b}\|\,cos\,\theta$$</p>

where $\theta$ is the angle between $\vec{a}$ and $\vec{b}$.

Consider the dot product of $\vec{n}$ and $\vec{n_p}$. Since both normals are unit vectors whose magnitudes are 1

<p class="mathblock">$$\|\vec{n}\| = \|\vec{n_p}\| = 1$$</p>

we can remove their magnitudes from the equation,

<p class="mathblock">$$\vec{n} \cdot \vec{n_p} = cos\,\theta$$</p>

making the dot product of $\vec{n}$ and $\vec{n_p}$ the cosine of the angle between them.

For two vectors, the cosine of their angles approaches 1 as the vectors become increasingly parallel, and approaches 0 as they become perpendicular.

Since $D_p$ becomes increasingly too small as $\vec{n}$ and $\vec{n_p}$ become more perpendicular, we can use $\vec{n} \cdot \vec{n_p}$ as a denominator for $D_p$. We'll assign this scaled-up version of $D_p$ to $D$:

<p class="mathblock">$$ D = \dfrac{D_p}{\vec{n} \cdot \vec{n_p}} $$</p>

With $D$ as our scaled-up distance, we find the point of intersection $P$ via:

<p class="mathblock">$$ P = x + \vec{n} \times D $$</p>

<Scene scene="project-point-onto-plane" height={500} usesVariables />

We can now get rid of $D_p$, which was defined as $d_p - (\vec{n_p} \cdot x)$, giving us the full equation for $D$:

<p class="mathblock">$$ D = \dfrac{d_p - (\vec{n_p} \cdot x)}{\vec{n} \cdot \vec{n_p}} $$</p>

Putting this into code, we get:

```cs
Vector3 LinePlaneIntersection(Line line, Plane plane) {
  float denom = Mathf.Abs(Vector3.Dot(line.normal, plane.normal));
  if (denom < EPSILON) {
      return null; // Line is parallel to plane's surface
  }

  float dist = Vector3.Dot(plane.normal, line.point);
  float D = (plane.distance - dist) / denom;
  return line.point + line.normal * D;
}
```


### Rays and lines

We've been talking about line-plane intersections, but I've been lying a bit by visualizing ray-plane intersections instead for visual clarity.

<Scene scene="project-point-onto-plane" height={500} usesVariables />

A ray and a line are quite similar; they're both represented through a normal $\vec{n}$ and a point $p$.

The core difference is that a ray (colored red) extends in the direction of $\vec{n}$ away from $p$, while a line (colored green) extends in the other direction as well:

<Scene scene="ray-and-line" height={500} usesVariables />

What this means for intersections is that a ray will not intersect planes when traveling backwards along it's normal:

<Scene scene="ray-and-line-plane-intersection" height={500} usesVariables />

Our implementation for ray-plane intersections will differ from our existing line-plane intersection implementation only in that it should yield a result of "no intersection" when the ray's normal $\vec{n}$ is pointing "away" from the plane's normal $\vec{n_p}$ at an obtuse angle.

Since $D$ represents how far to travel along the normal to reach the point of intersection, we could yield "no intersection" when $D$ becomes negative:

```cs
if (D < 0) {
  return null;
}
```

But for this we'd have to calculate $D$ first. That's not necessary since $D$ becomes negative as a consequence of the dot product $\vec{n} \cdot \vec{n_p}$ yielding a negative number when $\vec{n}$ and $\vec{n_p}$ are at an obtuse angle between 90° and 180°.

<SmallNote label="">If this feels non-obvious, it helps to remember that the dot product encodes the cosine of the angle between its two component vectors, which is why the dot product becomes negative for obtuse angles.</SmallNote>

Knowing that, we can change our initial "parallel normals" test from this:

```cs
Vector3 LinePlaneIntersection(Line line, Plane plane) {
  float denom = Mathf.Abs(Vector3.Dot(line.normal, plane.normal));
  if (denom < EPSILON) {
      return null; // Line is parallel to plane's surface
  }
  // ...
}
```

To this:

```cs
Vector3 RayPlaneIntersection(Line line, Plane plane) {
  float denom = Vector3.Dot(line.normal, plane.normal);
  if (denom < EPSILON) {
      return null; // Line is parallel to plane's surface
  }
  // ...
}
```

The $\vec{n} \cdot \vec{n_p} < \epsilon$ check covers both the _"line parallel to plane"_ case _and_ the case where the two normal vectors are at an obtuse angle.


## Three plane intersection

Given three planes $P_1$, $P_2$, $P_3$, there are five possible configurations in which they intersect or don't intersect:

 1. All three planes are parallel, with none of them intersecting each other.
 2. Two planes are parallel, and the third plane intersects the other two.
 3. All three planes intersect along a single line.
 4. The three planes intersect each other in pairs, forming three parallel lines of intersection.
 5. All three planes intersect each other at a single point.

<Scene scene="three-plane-intersection-configurations" height={400} yOffset={-1} zoom={1.1} usesVariables />

When finding the point-of-intersection, we'll first need to determine whether all three planes intersect at a single point—which for configurations 1 through 4, they don't.

Given $\vec{n_1}$, $\vec{n_2}$, $\vec{n_3}$ as the plane normals for $P_1$, $P_2$, $P_3$, we can determine whether the planes intersect at a single point with the formula:

<p class="mathblock">$$ \vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) \neq 0 $$</p>

When I first saw this, I found it hard to believe this would work for all cases. Still, it does! Let's take a deep dive to better understand what's happening.

### Two or more planes are parallel

We'll start off with the configurations where two or more planes are parallel:

<Scene scene="three-planes-some-parallel" height={400} />

If $\vec{n_2}$ and $\vec{n_3}$ are parallel then $\vec{n_2} × \vec{n_3}$ yields a vector whose magnitude is zero.

<p class="mathblock">$$\|\vec{n_2} × \vec{n_3}\| = 0$$</p>

And since the dot product is a multiple of the magnitudes of its component vectors:

<p class="mathblock">$$a \cdot b = \|a\|\,\|b\|\,cos\,\theta$$</p>

the final result is zero whenever $\vec{n_2}$ and $\vec{n_3}$ are parallel.

<p class="mathblock">$$\vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) = 0$$</p>

This takes care of the "all-planes-parallel" configuration, and the configuration where $\vec{n_2}$ and $\vec{n_3}$ are parallel

<Scene scene="three-planes-n2-n3-parallel" height={400} />

With that, let's consider the case where $\vec{n_1}$ is parallel to either $\vec{n_2}$ or $\vec{n_3}$ but $\vec{n_2}$ and $\vec{n_3}$ are not parallel to each other.

Let's take the example where $\vec{n_1}$ is parallel to $\vec{n_2}$ but $\vec{n_3}$ is parallel to neither.

<Scene scene="three-planes-n1-n2-parallel" height={400} />

The cross product $\vec{n_2} × \vec{n_3}$ yields a vector (colored red) that's perpendicular to both $\vec{n_2}$ and $\vec{n_3}$.

<Scene scene="three-planes-n1-n2-parallel-cross" height={400} />

Since $\vec{n_1}$ is parallel to $\vec{n_2}$, that means that $\vec{n_2} × \vec{n_3}$ is also perpendicular to $\vec{n_1}$. As we've learned, the dot product of two perpendicular is zero, meaning that:

<p class="mathblock">$$\vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) = 0$$</p>

Which also holds in the case where $\vec{n_1}$ is parallel to $\vec{n_3}$ instead of $\vec{n_2}$.

### Parallel lines of intersection

We've demonstrated that two of the three normals being parallel results in $\vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) = 0$. But what about the configurations where the three planes intersect along parallel lines? Those configurations have no parallel normals.

<Scene scene="three-planes-three-lines" height={400} />

As we learned when looking at plane-plane intersections, the cross product of the two plane normals yields the direction of the intersection line.

<Scene scene="three-planes-three-lines-cross" height={400} />

When all of the lines of intersection are parallel, all of the plane normals defining those lines are perpendicular them.

Yet again, because the dot product of perpendicular vectors is 0 we can conclude that $\vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) = 0$ for these configurations as well.

We can now begin our implementation. As usual, we'll use an epsilon to handle the _"roughly parallel"_ case:

```cs
Vector3 ThreePlaneIntersection(Plane p1, Plane p2, Plane p3) {
  Vector3 cross = Vector3.Cross(p2.normal, p3.normal);
  float dot = Vector3.Dot(p1.normal, cross);
  if (Mathf.Abs(dot) < EPSILON) {
    return null; // Planes do not intersect at a single point
  }
  // ...
}
```

## Computing the point intersection

We want to find the point at which our three planes $P_1$, $P_2$, $P_3$ intersect:

<Scene scene="three-intersecting-planes-point" height={400} />

Some of what we learned about two plane intersections will come into play here. Let's start by taking the line of intersection for $P_2$ and $P_3$ and varying the position of $P_1$. You'll notice that the point of intersection is the point at which $P_1$ intersects the line.

<Scene scene="three-intersecting-planes" height={400} usesVariables />

When $P_1$'s distance from the origin is 0, the vector pointing from the origin to the point of intersection is parallel to $P_1$ (and perpendicular to $P_1$'s normal).

<Scene scene="three-intersecting-planes-10" height={400} />

This vector—let's call it $\vec{V}$—will play a large role in computing the point of intersection.

We can find $\vec{V}$ through the cross product of two other vectors $\vec{v_1}$, $\vec{v_2}$. The first of those, $\vec{v_1}$, is just $P_1$'s normal.

<p class="mathblock">$$\vec{v_1} = \vec{n_1}$$</p>

The latter vector can be found via the equation

<p class="mathblock">$$\vec{v_2} = \vec{n_2} \times d_3 - \vec{n_3} \times d_2$$</p>

where $d_2$ and $d_3$ are the distances in the constant-normal form of planes $P_2$ and $P_3$.

With $\vec{v_1}$ and $\vec{v_2}$ defined, we assign their cross product to $\vec{V}$:

<p class="mathblock">$$ \vec{V} = \vec{v_1} × \vec{v_2} $$</p>

Let's see what it looks like:

<Scene scene="three-intersecting-planes-3" height={400} />

Hmm, not quite long enough. $\vec{V}$ certainly points in the right direction, but to make $\vec{V}$'s tip lie on the line of intersection, we need to compute some scaling factor for $\vec{V}$.

As it turns out, we've already computed this scaling factor:

<p class="mathblock">$$\vec{n_1} \cdot (\vec{n_2} × \vec{n_3})$$</p>

The product of $\vec{n_1} \cdot (\vec{n_2} × \vec{n_3})$—let's call that $D$—can be thought to represent how parallel $\vec{P_1}$'s normal is to the line intersection of $P_2$ and $P_3$.

$D$ approaches $\|\vec{n_2} × \vec{n_3}\|$ as $P_1$'s normal becomes parallel to the line of intersection $\vec{n_2} × \vec{n_3}$, and approaches 0 as they become perpendicular.

We want the $\vec{V}$'s magnitude to increase as $D$ decreases, so we'll make $\dfrac{1}{D}$ the scaling factor for $\vec{V}$.

<p class="mathblock">$$\vec{V} = \dfrac{\vec{v_1} × \vec{v_2}}{D}$$</p>

<Scene scene="three-intersecting-planes-4" height={400} />

Fully expanded, the equation for $\vec{V}$ becomes:

<p class="mathblock">$$\vec{V} = \dfrac{\vec{v_1} × \vec{v_2}}{D} = \dfrac{\vec{n_1} × ((\vec{n_2} \times d_3) - (\vec{n_3} \times d_2))}{\vec{n_1} \cdot (\vec{n_2} × \vec{n_3})}$$</p>

Bam! The problem is now reduced to traveling along the direction of the line intersection until we intersect with $P_1$.

<Scene scene="three-intersecting-planes-5" height={400} />

We could use our knowledge of line-plane intersections to solve this, but there is a more efficient approach I want to demonstrate.

It involves finding a scaling factor for the direction vector $\vec{n_2} × \vec{n_3}$ that scales it such that it's tip ends at $P_1$. Let's call this direction vector $\vec{U}$.

There's one observation we can make that simplifies that. Since $\vec{V}$ is perpendicular to $P_1$'s normal, the distance from $\vec{V}$'s tip to $P_1$ along the direction vector $\vec{U}$ is the same as the distance from the origin to $P_1$ along that same direction.

<Scene scene="three-intersecting-planes-6" height={400} />

With that, consider the vector $\vec{n_1} \times d_1$ where $\vec{n_1}$ and $d_1$ are the normal and distance of $P_1$.

<Scene scene="three-intersecting-planes-7" height={400} />

If $\vec{n_1}$ were parallel to $\vec{U}$, then $d_1$ would be the scaling factor we need, but let's see what happens with $\vec{U} \times d_1$:

<Scene scene="three-intersecting-planes-8" height={400} usesVariables />

As $\vec{n_1}$ and $\vec{U}$ become less parallel, $U \times d_1$ becomes increasingly too short.

One thing to note as well is that even when $\vec{n_1}$ and $\vec{U}$ are completely parallel, $\vec{U} \times d_1$ is still too short, which is due to $\vec{U}$ not being a unit vector. If we normalize $\vec{U}$ prior to multiplying with $d_1$ that problem goes away.

<Scene scene="three-intersecting-planes-11" height={400} usesVariables />

But we're getting ahead of ourselves—we won't need to normalize $\vec{U}$. Let's take a fresh look at how $D$ is defined:

<p class="mathblock">$$D = \vec{n_1} \cdot (\vec{n_2} × \vec{n_3})$$</p>

Having defined $\vec{U}$ as $\vec{n_2} × \vec{n_3}$, we can simplify this to

<p class="mathblock">$$D = \vec{n_1} \cdot \vec{U}$$</p>

Earlier I mentioned that we could think of $D$ as a measure of how parallel $P_1$'s normal $n_1$ is to $\vec{U}$ (the line intersection of $P_2$ and $P_3$). That's correct, but it's not the whole truth!

Since the dot product is a multiple of the magnitudes of its component vectors, $D$ also encodes the magnitude of $\vec{U}$. Hence, scaling $\vec{U}$ by $\dfrac{1}{D}$ does two things:

 1. it normalizes $\vec{U}$, and
 2. it increases the length of $\vec{U}$ as it becomes less parallel with $n_1$.

So $D$ is both the scaling factor we need for $\vec{U} \times d_1$, as well as $\vec{V}$:

<Scene scene="three-intersecting-planes-9" height={400} />

We've got our solution! Let's do a quick overview.

We define $\vec{V}$ as:

<p class="mathblock">$$\vec{V} = \vec{n_1} × ((\vec{n_2} \times d_3) - (\vec{n_3} \times d_2))$$</p>

We'll redefine $\vec{U}$ to include $d_1$:

<p class="mathblock">$$\vec{U} = (\vec{n_2} × \vec{n_3}) \cdot d_1$$</p>

Our scalar, $D$, remains defined the same:

<p class="mathblock">$$D = \vec{n_1} \cdot (\vec{n_2} × \vec{n_3})$$</p>

With this, we find our point of intersection $P$ by adding $\vec{V}$ and $\vec{U}$ together and scaling them by $\dfrac{1}{D}$:

<p class="mathblock">$$P = \dfrac{\vec{V} + \vec{U}}{D}$$</p>

Which fully expanded becomes:

<p class="mathblock">$$P = \dfrac{(\vec{n_1} × ((\vec{n_2} \times d_3) - (\vec{n_3} \times d_2))) + ((\vec{n_2} × \vec{n_3}) \cdot d_1)}{\vec{n_1} \cdot (\vec{n_2} × \vec{n_3})}$$</p>

Putting this into code, we get:

```cs
Vector3 ThreePlaneIntersection(Plane p1, Plane p2, Plane p3) {
  Vector3 dir = Vector3.Cross(p2.normal, p3.normal);
  
  float denom = Vector3.Dot(u);
  if (Mathf.Abs(denom) < EPSILON) {
    return null; // Planes do not intersect at a single point
  }

  Vector3 a = p2.normal * p3.distance;
  Vector3 b = p3.normal * p2.distance;
  Vector3 V = Vector3.Cross(p1.normal, a - b);
  Vector3 U = dir * p1.distance;

  return (V + U) / denom;
}
```


## Parting words

Thanks for reading!

A whole lot of hours went into building and writing this post, so I hope it achieved its goal of helping you build an intuitive mental model of planes.

If you're interested in knowing how these examples were built, this website is [open source on GitHub][website].

[website]: https://github.com/alexharri/website

<SectionAnchor id="further-reading">
  <h2>Further reading</h2>
</SectionAnchor>

[further_reading]: #further-reading

I highly recommend checking out [Real-Time Collision Detection by Christer Ericson][book_ref]. If you're building applications using 3D geometry, it will prove to be an incredibly useful resource.

[book_ref]: https://www.amazon.com/Real-Time-Collision-Detection-Interactive-Technology/dp/1558607323

I recently analysed the edit performance in [Arkio][arkio] and noticed that a method for solving three-plane intersections took around half of the total compute time when recalculating geometry. By implementing the more efficient method described in the book, we made the method __~500% faster__, increasing Arkio's edit performance by over __1.6x__. Crazy stuff!

[arkio]: https://www.arkio.is/

I started writing this post with the intention of understanding how the three plane intersection method worked. However, I felt that readers would need a better foundation and understanding of planes for this post to be of any value. In building that foundation, this post ended up quite a bit longer than I intended.

Anyway, it's a great book. [Check it out!][book_ref]

— Alex Harri
