---
title: "Planes in 3D space"
---

{/** todo better system for this */}
<span data-varlabel="d">$d$</span>
<span data-varlabel="vec_n">$\vec{n}$</span>
<span data-varlabel="n">$n$</span>
<span data-varlabel="P_1">$P_1$</span>
<span data-varlabel="P_2">$P_2$</span>
<span data-varlabel="P_3">$P_3$</span>
<span data-varlabel="vec_v1">$\vec{v_1}$</span>
<span data-varlabel="vec_v2">$\vec{v_2}$</span>
<span data-varlabel="p_x">$p_x$</span>

A plane in 3D space can be thought of as flat surface that stretches infinitely far, splitting 3D space into two halves.

<Scene scene="what-is-a-plane" height={340} yOffset={0.5} />

There are lots of uses for planes. I've mostly been working with them in the context of an architectural modeler, where geometry is defined in terms of planes and their intersections.

This post can be thought of as a _"getting started with planes"_ type of article. The intent is to create the resource I wish I had when learning about planes.

With that out of the way, let's get to it!

## Describing planes

There are many ways to describe planes, such as via

 1. a point in 3D space and a normal,
 2. three points in 3D space, forming a triangle, or
 3. a normal and a distance from an origin.

<SmallNote label="">[Normals][normals] can be thought of as vectors representing a direction. A normal is a vector with a magnitude (length) of 1 (a vector $\vec{n}$ where $|\vec{n}| = 1$)</SmallNote>

[normals]: https://en.wikipedia.org/wiki/Normal_(geometry)

Let's look at the point and normal case first.

Here's an example of a plane described by a point in 3D space $p$ and a normal $\vec{n}$:

<Scene scene="point-and-normal-with-plane" height={400} yOffset={-1} />

The normal $\vec{n}$ describes the plane's orientation, where the surface of the plane is perpendicular to $\vec{n}$, while the point $p$ describes _a_ point which the plane intersects.

We described the plane in term of a single point $p$, but keep in mind that the plane $P$ intersects infinitely many points.

<Scene scene="plane-intersecting-points" height={400} yOffset={-1} />

If $P$ were described by one of those other points intersecting $P$, we would be describing the same plane. This is a result of the infinite nature of planes.

This way of describing a plane—in terms of a point and a normal—is the [point-normal form][point_normal_form] of the plane.

[point_normal_form]: https://en.wikipedia.org/wiki/Euclidean_planes_in_three-dimensional_space#Point%E2%80%93normal_form_and_general_form_of_the_equation_of_a_plane

<ThreeDots />

We can also describe a plane using three points in 3D space $a$, $b$, $c$ forming a triangle:

<Scene scene="three-points" height={380} yOffset={-0.3} />

The triangle forms a plane, but for us to be able to do anything useful with the plane we'll need to calculate it's normal $\vec{n}$. Once we've calculated the plane's normal, we can use any of the triangle's three points to describe the plane in point-normal form.

<Scene scene="three-points-normal-centered" height={380} yOffset={-0.3} />

<SmallNote label="" center>As mentioned earlier, the normal $\vec{n}$ describing a plane is a unit vector ($|\vec{n}|=1$) perpendicular to the plane.</SmallNote>

Taking $b - a$ and $c - a$ gives us two vectors that are parallel to the plane.

<Scene scene="three-points-edge-vectors" height={380} yOffset={-0.3} />

By virtue of being parallel to the plane, the vectors $b - a$ and $c - a$ are perpendicular to the plane's normal. This is where the cross product becomes useful to us.

The [cross product][cross_product] takes in two vectors $\vec{a}$ and $\vec{b}$ and returns a vector $\vec{c}$ that is perpendicular to both of them.

<p align="center">$$\vec{c} = \vec{a} × \vec{b}$$</p>

[cross_product]: https://en.wikipedia.org/wiki/Cross_product

A vector perpendicular to the triangle's edge vectors $(b - a)$ and $(c - a)$ will also be perpendicular to the triangle's plane. Let's call this vector $\vec{d}$.

<p align="center">$$\vec{d} = (b - a) × (c - a)$$</p>

<Scene scene="three-points-cross-product" height={400} yOffset={-0.3} />

<SmallNote label="" center>$\vec{d}$ has been scaled down for illustrative purposes</SmallNote>

$\vec{d}$ points in the right direction, but it's not a normal. For $\vec{d}$ to be a normal, it's magnitude needs to  equal 1.

We can normalize $\vec{d}$ to $\vec{n}$ by dividing $\vec{d}$ by its magnitude $|\vec{d}|$:

<p align="center">$$\vec{n} = \dfrac{\vec{d}}{|\vec{d}|}$$</p>

This yields a normal $\vec{n}$ where $|\vec{n}| = 1$:

<Scene scene="three-points-normal" height={360} yOffset={-0.3} />

Having computed the normal $\vec{n}$ we can use it and any of the points $a$, $b$, $c$ to describe the plane intersecting the three points in point-normal form.

<Scene scene="three-points-plane" height={400} yOffset={-1} />

<SmallNote center>Normals can also be referred to</SmallNote>

It doesn't matter which of $a$, $b$, $c$ we use as the point in the point-normal form; we always get the same plane.

Inferring the normal of three points can be written like so:

```cs
Vector3 NormalFromThreePoints(Vector3 a, Vector3 b, Vector3 c) {
  return Vector3.Cross(b - a, c - a).normalized;
}
```

<SmallNote center label="Further reading">[Calculating a Surface Normal][calc_surface_normal]</SmallNote>

[calc_surface_normal]: https://www.khronos.org/opengl/wiki/Calculating_a_Surface_Normal#Algorithm


{/* <Section title="Checking whether a point lies on a plane" heading="h3">
Given a point-normal plane described by a point $p$ and a normal $\vec{n}$, for any point $x$ on the plane the vector described by $p - x$ is perpendicular to $\vec{n}$:

<Scene scene="plane-perpendicular" height={400} />

<SmallNote label="" center>The red points represent $x$ while the red arrows represent the vector $p - x$</SmallNote>

The dot product for two vectors $\vec{a}$, $\vec{b}$ is defined as $\vec{a} \cdot \vec{b} = |\vec{a}|\,|\vec{b}|\,cos(\theta)$ where $\theta$ is the angle between $\vec{a}$ and $\vec{b}$. There are then two facts we can use to our advantage:

 1. for perpendicular vectors $\theta = \dfrac{\pi}{2}$
 2. $cos(\dfrac{\pi}{2}) = 0$

Since the vector $p - x$ for any point $x$ on the plane is perpendicular to $n$, we can ask if a point is on the plane by checking if $\vec{n} \cdot (p - x) = 0$. If $x$ is not on the plane, then $\vec{n} \cdot (p - x) \neq 0$.

```cs
bool IsPointOnPlane(Plane plane, Vector3 x) {
  float d = Vector3.Dot(plane.normal, plane.point - x);
  return Mathf.Abs(d) < EPSILON;
}
```
</Section> */}


### Constant-normal form

There's one way to describe planes we've yet to cover, which is through a normal $\vec{n}$ and a distance $d$.

<Scene scene="constant-normal-form" height={400} />

This is called the _constant-normal form_. It makes lots of calculations using planes much simpler.

In the constant-normal form, the distance $d$ denotes how close the plane gets to the origin. Thought of another way: multiplying the normal $\vec{n}$ by $d$ yields the point on the plane that's closest to the origin.

This is still a bit abstract, so here's an example that demonstrates the relationship between the point-normal and constant-normal forms:

<Scene scene="point-normal-and-constant-normal-form" height={400} />

The green arrow represents $d$ times $\vec{n}$ from the constant-normal form, while the blue point and arrow represent the point $p$ and normal $\vec{n}$ from the point-normal form.

Translating from the point-normal to the constant-normal form is very easy: the distance $d$ is the dot product of $\vec{n}$ and $p$.

<p align="center">$$\vec{n} \cdot p = d$$</p>

<SmallNote label="" center>If you're not familiar with the dot product, don't worry. We'll cover it thoroughly later on.</SmallNote>

The normal $\vec{n}$ stays the same across both forms, though in the example above you can observe the normal "flipping" when $d$ becomes negative.


## Distance from plane

Given an arbitrary point $x$ and a plane $P_1$ in constant-normal form, we may want to ask how far away the point is from the plane. In other words, what is the minimum distance $x$ needs to travel to lie on the plane?

<Scene scene="point-and-plane" height={400} />

We can frame this differently if we construct a plane $P_2$ intersecting $x$ that is parallel to $P_1$, which we can do in point-normal form using $x$ as the point and $P_1$'s normal $\vec{n}$ as the normal:

<Scene scene="point-distance-step-1" height={400} />

With two parallel planes, we can frame the problem as finding the distance between the two planes. This becomes trivial using their constant-normal forms since it allows us to take the difference between their distance components $d_1$ and $d_2$.

So let's find $P_2$'s distance using the $d = \vec{n} \cdot p$ formula we learned about:

<Scene scene="point-distance-step-2" height={400} />

With two distances $d_1$, $d_2$ from the planes $P_1$, $P_2$ the solution becomes $d_2 - d_1$.

<Scene scene="point-distance-step-3" height={400} />

So, given a plane $P$ with a normal of $\vec{n}$ and distance $d$, we can calculate a point $x$'s distance from $P$ like so:

<p align="center">$$(\vec{n} \cdot x) - d $$</p>

The distance may be positive or negative depending on which side of the plane the point is on.


## Projecting onto planes

In the last chapter, we learned how to compute a point's distance to a plane. A case where that becomes useful is, for example, if you want to project the point onto the plane.

Given a point $x$ which we want to project onto plane $P$ whose normal is $\vec{n}$ and distance is $d$, we can do that fairly easily. First, compute the point's distance $D$ from the plane:

<p align="center">$$D = (\vec{n} \cdot x) - d$$</p>

Multiplying the plane's normal $\vec{n}$ by $D$ gives us a vector which projects $x$ onto the plane. Let's call that final position $S$:

<p align="center">$$S = x + (\vec{n} \cdot D)$$</p>

This projection happens along the plane's normal, which can be useful, but you may want to project a point onto a plane along a different direction. For that, we'll need to perform a line-plane intersection.


## Line-plane intersections

TODO




In either case, $x + \vec{n}\,\,dist(P, x)$ projects $x$ onto the plane along the normal's direction.


## Plane-plane intersections

Two parallel planes with a common normal will never intersect.

<Scene scene="parallel-planes" height={340} />

However, two planes whose normals differ will intersect at some point; we are dealing with infinite planes after all.

<Scene scene="intersecting-planes" height={340} />

The intersection $I$ of two infinite planes in 3D space forms an infinite line comprised of a point $p_I$ and normal $\vec{n_I}$.

Let's define two planes $P_1$, $P_2$ whose normals are $\vec{n_1}$, $\vec{n_2}$ having distances $d_0$, $d_1$. The direction $\vec{d_I}$ of the intersection $I$ will be the cross product of two the plane normals:

<p align="center">$$\vec{d_I} = \vec{n_1} × \vec{n_2}$$</p>

The cross product does not yield a normalized vector, so we'll normalize $\vec{d_I}$ to $\vec{n_I}$:

<p align="center">$$\vec{n_I} = \dfrac{\vec{d_I}}{|\vec{d_I}|}$$</p>

Let's zoom in and see this in action.

<Scene scene="intersecting-planes-point-and-normal" height={380} zoom={2} />

### Handling parallel planes

If the two plane normals were perfectly equal (parallel) we'd get a $\vec{d_I}$ of $(0, 0, 0)$—not a valid normal. However, numerical precision and noisy inputs mean we often need to deal with _roughly_ parallel normals.

This means that our plane-plane intersection code should yield a result of "no intersection" when the magnitude of $\vec{d_I}$ is less than some epsilon.

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

Given two normals $\vec{n_1}$, $\vec{n_2}$ where the angle between $\vec{n_1}$ and $\vec{n_2}$ is $\theta$, we can find a reasonable epsilon by charting $|\vec{n_1} × \vec{n_2}|$ for different values of $\theta$:

<Image src="~/cross-product-magnitude-by-angle.png" plain width={840} />

The relationship is linear. As the difference in angles halves, so does the magnitude. A difference of 1° yields a magnitude 0.01745, and a difference of 1/2° yields half of that.

So to determine the epsilon, we can just ask: how low does the angle in degrees need to become for us to consider two planes parallel? Given an angle $\theta°$, we can find the epsilon $E$ via

<p align="center">$$e = \dfrac{0.01745}{\theta°}$$</p>

If that angle is 1/256°, then we get:

<p align="center">$$\dfrac{0.01745}{256} \approx 0.000068 $$</p>

Which epsilon you ultimately choose will depend on your use case.

### Finding the point of intersection

We've computed the normal and handled parallel planes. Next up we need to compute a point along the line of intersection.

Since the line describing the plane-plane intersection is infinite, there are infinitely many points we could compute.

However, with the restriction that we only travel along the directions of the plane normals, there is one and only one point on the line we can possibly hit. Note how the white parallelogram formed by the plane normals intersects the line at a single point.

<Scene scene="intersecting-planes-virtual-plane" height={360} yOffset={-1} />

This lets us reframe the problem to finding finding two scaling factors $k_1$, $k_2$ which applied to our plane normals $\vec{n_1}$, $\vec{n_2}$ yields a paralellogram whose tip is a point along the line-of-intersection.

These scaling factors can be computed like so:

```cs
float d11 = Vector3.Dot(p1.normal, p1.normal);
float d12 = Vector3.Dot(p1.normal, p2.normal);
float d22 = Vector3.Dot(p2.normal, p2.normal);

float denom = d11 * d22 - d12 * d12;

float k1 = (p1.distance * d22 - p2.distance * d12) / denom;
float k2 = (p2.distance * d11 - p1.distance * d12) / denom;

Vector3 point = p1.normal * k1 + p2.normal * k2;
```

<SmallNote label="" center>Based on code from [Real-Time Collision Detection by Christer Ericson][book_ref]</SmallNote>

Applying $k_1$, $k_2$ to our plane normals, we find our point-of-intersection:

<Scene scene="intersecting-planes-offset" height={500} />

An interesting property of this point is that it's the closest point on the line of intersection to the origin.

Through some mathematical magic, this can be optimized down to:

```cs
Vector3 direction = Vector3.cross(p1.normal, p2.normal);

float denom = Vector3.Dot(direction, direction);
Vector3 a = p1.distance * p2.normal;
Vector3 b = p2.distance * p1.normal;
Vector3 point = Vector3.Cross(a - b, direction) / denom;
```

<SmallNote label="" center>How this optimization works can be found in chapter 5.4.4 of [Real-Time Collision Detection by Christer Ericson][book_ref].</SmallNote>

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


## Three plane intersection

Given three planes $P_1$, $P_2$, $P_3$, there are five possible configurations:

 1. All three planes are parallel, with none of them intersecting each other.
 2. Two planes are parallel, and the third plane intersects the ther two.
 3. All three planes intersect along a single line.
 4. The three planes intersect each other in pairs, forming three lines of intersection.
 5. The planes intersect at a point.

<Scene scene="three-plane-intersection-configurations" height={400} yOffset={-1} zoom={1.1} />

When finding the point-of-intersection, we'll first need to determine whether the three planes all intersect each other—which for configurations 1 through 4, they don't.

Given that $\vec{n_1}$, $\vec{n_2}$, $\vec{n_3}$ are the plane normals for $P_1$, $P_2$, $P_3$, we can determine whether the planes intersect at a single point with the formula:

<p align="center">$$ \vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) \neq 0 $$</p>

When I first saw this, I found it hard to believe this would work for all cases. Still, it does! Let's take a deep dive to better understand what's happening.

### Two or more planes are parallel

We'll start off with the configurations where two or more planes are parallel:

<Scene scene="three-planes-some-parallel" height={400} />

If $\vec{n_2}$ and $\vec{n_3}$ are parallel then $\vec{n_2} × \vec{n_3}$ yields a vector whose magnitude is zero.

<p align="center">$$|\vec{n_2} × \vec{n_3}| = 0$$</p>

And since the dot product is a multiple of the magnitudes of its component vectors:

<p align="center">$$a \cdot b = |a|\,|b|\,cos\,\theta$$</p>

the final result is zero whenever $\vec{n_2}$ and $\vec{n_3}$ are parallel.

<p align="center">$$\vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) = 0$$</p>

This takes care of the "all-planes-parallel" configuration, and the configuration where $\vec{n_2}$ and $\vec{n_3}$ are parallel

<Scene scene="three-planes-n2-n3-parallel" height={400} />

With that, let's consider the case where $\vec{n_1}$ is parallel to either $\vec{n_2}$ or $\vec{n_3}$ but $\vec{n_2}$ and $\vec{n_3}$ are not parallel to each other.

Let's take the example where $\vec{n_1}$ is parallel to $\vec{n_2}$ but $\vec{n_3}$ is parallel to neither.

<Scene scene="three-planes-n1-n2-parallel" height={400} />

The cross product $\vec{n_2} × \vec{n_3}$ yields a vector that's perpendicular to both $\vec{n_2}$ and $\vec{n_3}$.

<Scene scene="three-planes-n1-n2-parallel-cross" height={400} />

Since $\vec{n_1}$ is parallel to $\vec{n_2}$, that means that $\vec{n_2} × \vec{n_3}$ is also perpendicular to $\vec{n_1}$. As we've learned, the dot product of two perpendicular is zero, meaning that:

<p align="center">$$\vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) = 0$$</p>

Which also holds in the case where $\vec{n_1}$ is parallel to $\vec{n_3}$.

### Parallel lines of intersection

We've demonstrated that two of the three normals being parallel results in $\vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) = 0$. But what about the configurations where the three planes intersect along parallel lines? Those configurations have no parallel normals.

<Scene scene="three-planes-three-lines" height={400} />

As we learned when looking at plane-plane intersections, the cross product of the two plane normals yields the direction of the intersection line.

<Scene scene="three-planes-three-lines-cross" height={400} />

When all of the lines of intersection are parallel, all of the plane normals defining those lines are perpendicular them.

Yet again, because the dot product of perpendicular vectors is 0 we can conclude that $\vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) = 0$ for these configurations as well.

We can now begin our implementation:

```cs
Vector3 ThreePlaneIntersection(Plane p1, Plane p2, Plane p3) {
  Vector3 p2CrossP3 = Vector3.Cross(p2.normal, p3.normal);
  if (Mathf.Abs(Vector3.Dot(p1.normal, p2CrossP3)) < EPSILON) {
    return null; // Planes do not intersect at a single point
  }
  // ...
}
```

## Computing the point intersection

We want to find the point at which our three planes $P_1$, $P_2$, $P_3$ intersect:

<Scene scene="three-intersecting-planes-point" height={400} />

Some of what we learned about two plane intersections will come into play here. Let's start by taking the line of intersection for $P_2$ and $P_3$ and varying the position of $P_1$. You'll notice that the point of intersection is the point at which $P_1$ intersects the line.

<Scene scene="three-intersecting-planes" height={400} />

When $P_1$'s distance from the origin is 0, the vector pointing from the origin to the point of intersection is parallel to $P_1$ (and perpendicular to $P_1$'s normal).

<Scene scene="three-intersecting-planes-10" height={400} />

This vector—let's call it $\vec{V}$—will play a large role in computing the point of intersection.

We can find $\vec{V}$ through the cross product of two other vectors $\vec{v_1}$, $\vec{v_2}$. The first of those, $\vec{v_1}$, is just $P_1$'s normal.

<p align="center">$$\vec{v_1} = \vec{n_1}$$</p>

The latter vector can be found via the formula

<p align="center">$$\vec{v_2} = (\vec{n_2} \cdot d_3) - (\vec{n_3} \cdot d_2)$$</p>

where $d_2$ and $d_3$ are the distances in the constant-normal form of planes $P_2$ and $P_3$.

We saw this earlier in the optimized plane-plane intersection implementation:

```cs
Vector3 a = p1.distance * p2.normal;
Vector3 b = p2.distance * p1.normal;
Vector3 point = Vector3.Cross(a - b, direction) / denom;
```

<SmallNote>$P_2$ corresponds to `p1` and $P_3$ to `p2`</SmallNote>

With $\vec{v_1}$ and $\vec{v_2}$ defined, let's see what their cross product yields:

<Scene scene="three-intersecting-planes-3" height={400} />

Hmm, not quite long enough. The cross product certainly points in the correct direction, but to make $\vec{V}$'s tip lie on the line of intersection, we need to compute some scaling factor for $\vec{V}$.

As it turns out, we've already computed this scaling factor:

<p align="center">$$\vec{n_1} \cdot (\vec{n_2} × \vec{n_3})$$</p>

The product of $\vec{n_1} \cdot (\vec{n_2} × \vec{n_3})$—let's call that $D$—can be thought to represent how parallel $\vec{P_1}$'s normal is to the line intersection of $P_2$ and $P_3$.

$D$ gets closer to 1 as $P_1$'s normal becomes parallel to the line of intersection $\vec{n_2} × \vec{n_3}$, and approaches 0 as they become perpendicular.

We want the $\vec{V}$'s magnitude to increase as $D$ decreases, so we'll make $\dfrac{1}{D}$ the scaling factor for $\vec{V}$.

<p align="center">$$\vec{V} = \dfrac{\vec{v_1} × \vec{v_2}}{D}$$</p>

<Scene scene="three-intersecting-planes-4" height={400} />

Fully expanded, the formula for $\vec{V}$ becomes:

<p align="center">$$\vec{V} = \dfrac{\vec{v_1} × \vec{v_2}}{D} = \dfrac{\vec{n_1} × ((\vec{n_2} \cdot d_3) - (\vec{n_3} \cdot d_2))}{\vec{n_1} \cdot (\vec{n_2} × \vec{n_3})}$$</p>

<SmallNote label="" center>Quite a mouthful!</SmallNote>

Bam! The problem is now reduced to traveling along the direction of the line intersection until we intersect with $P_1$.

<Scene scene="three-intersecting-planes-5" height={400} />

Our next step is find some scaling factor for the direction vector $\vec{n_2} × \vec{n_3}$ that scales it such that it's tip ends at $P_1$. Let's call this direction vector $\vec{U}$.

There's one observation we can make that simplifies that. Since $\vec{V}$ is perpendicular to $P_1$'s normal, the distance from $\vec{V}$'s tip to $P_1$ along the direction vector $\vec{U}$ is the same as the distance from the origin to $P_1$ along that same direction.

<Scene scene="three-intersecting-planes-6" height={400} />

With that, consider the vector $\vec{n_1} \cdot d_1$ where $\vec{n_1}$ and $d_1$ are the normal and the distance of the constant normal form of $P_1$.

<Scene scene="three-intersecting-planes-7" height={400} />

If $\vec{n_1}$ were parallel to $\vec{U}$ then $d_1$ would be the scaling factor we need, but let's see what happens with $\vec{U} \cdot d_1$:

<Scene scene="three-intersecting-planes-8" height={400} />

As $\vec{n_1}$ and $\vec{U}$ become less parallel, $U \cdot d_1$ becomes increasingly too short.

One thing to note as well is that even when $\vec{n_1}$ and $\vec{U}$ are completely parallel, $\vec{U} \cdot d_1$ is still too short. That is due to $\vec{U}$ being the cross product $\vec{n_2} × \vec{n_3}$ where $\vec{n_2}$ and $\vec{n_3}$ are not perpendicular. If we normalize $\vec{U}$ prior to multiplying with $d_1$ that problem goes away.

<Scene scene="three-intersecting-planes-11" height={400} />

But we're getting ahead of ourselves—we won't need to normalize $\vec{U}$. Let's take a fresh look at how $D$ is defined:

<p align="center">$$D = \vec{n_1} \cdot (\vec{n_2} × \vec{n_3})$$</p>

Having defined $\vec{U}$ as $\vec{n_2} × \vec{n_3}$, we can simplify this to

<p align="center">$$D = \vec{n_1} \cdot \vec{U}$$</p>

Earlier I mentioned that we could think of $D$ as a measure of how parallel $P_1$'s normal $n_1$ is to $\vec{U}$ (the line intersection of $P_2$ and $P_3$).

That's completely correct! But since the dot product multiplies the magnitudes of its component vectors, $D$ also encodes the magnitude of $\vec{U}$. Hence, dividing $\vec{U}$ by $D$ does two things:

 * it normalizes $\vec{U}$, and
 * it increases the length of $\vec{U}$ as it becomes less parallel with $n_1$.

So $D$ is both the scaling factor we need for $\vec{U} \cdot d_1$—as well as $\vec{V}$:

<Scene scene="three-intersecting-planes-9" height={400} />

We've got our solution! Let's do a quick overview.

We define $\vec{V}$ as

<p align="center">$$\vec{V} = \vec{n_1} × ((\vec{n_2} \cdot d_3) - (\vec{n_3} \cdot d_2))$$</p>

We'll simplify by including $d_1$ in our definition for $\vec{U}$:

<p align="center">$$\vec{U} = (\vec{n_2} × \vec{n_3}) \cdot d_1$$</p>

Our scalar for $D$ remains defined as

<p align="center">$$D = \vec{n_1} \cdot (\vec{n_2} × \vec{n_3})$$</p>

With this, we find our point of intersection $P$ by adding $\vec{V}$ and $\vec{U}$ together and dividing them by $D$:

<p align="center">$$P = \dfrac{\vec{V} + \vec{U}}{D}$$</p>

Which fully expanded becomes:

<p align="center">$$P = \dfrac{(\vec{n_1} × ((\vec{n_2} \cdot d_3) - (\vec{n_3} \cdot d_2))) + ((\vec{n_2} × \vec{n_3}) \cdot d_1)}{\vec{n_1} \cdot (\vec{n_2} × \vec{n_3})}$$</p>

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
  Vector3 v = Vector3.Cross(p1.normal, a - b);
  Vector3 u = dir * p1.distance;

  return (v + u) / d;
}
```




[book_ref]: #real-time-collision-detection