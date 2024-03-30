---
title: "Three-plane intersections"
---

{/** todo better system for this */}
<span data-varlabel="d">$d$</span>
<span data-varlabel="vec_n">$\vec{n}$</span>
<span data-varlabel="n">$n$</span>
<span data-varlabel="P_1">$P_1$</span>
<span data-varlabel="P_2">$P_2$</span>
<span data-varlabel="P_3">$P_3$</span>

I want to explore an interesting algorithm I applied at work the other day. It has to do with computing the point intersection of three planes in 3D space.

## Planes

A plane can be thought of as flat surface that stretches infinitely far in all directions, splitting 3D space into two half-spaces.

<Scene scene="what-is-a-plane" height={340} yOffset={0.5} />

We'll visualize planes using square 2D surfaces (it's pretty hard to visualize infinite planes). Just keep in mind that planes are infinitely large!

There are many ways to describe planes:

 1. Using a point in 3D space and a normal.
 2. Using three points in 3D space, forming a triangle.
 3. Using a normal and a distance from an origin.

Normals can be thought of as vectors representing a direction. A normal is just a vector with a magnitude (length) of 1, or more formally, a vector $\vec{n}$ where $|\vec{n}| = 1$.

Let's look at the point and normal case first. Given a point in 3D space $\boldsymbol p$ and a normal $\boldsymbol{\vec{n}}$:

<Scene scene="point-and-normal" height={300} yOffset={0.5} />

<SmallNote center label="">The sphere represents the point $\boldsymbol p$ and the arrow represents the normal $\boldsymbol{\vec{n}}$.</SmallNote>

the plane can be described in terms of two constraints:

 1. The plane must intersect the point $\boldsymbol p$.
 2. The plane must be perpendicular to the normal $\boldsymbol{\vec{n}}$.

<Scene scene="point-and-normal-with-plane" height={400} yOffset={0} />

This way of describing a plane—in terms of a point and a normal—is the [point-normal form][point_normal_form] of the plane.

[point_normal_form]: https://en.wikipedia.org/wiki/Euclidean_planes_in_three-dimensional_space#Point%E2%80%93normal_form_and_general_form_of_the_equation_of_a_plane

We can also describe a plane using three points in 3D space forming a triangle. We'll call these points $a$, $b$, and $c$:

<Scene scene="three-points" height={380} yOffset={-0.3} />

Creating two edge vectors defined by $b - a$ and $c - a$ gives us two vectors that lie on the plane:

<Scene scene="three-points-edge-vectors" height={380} yOffset={-0.3} />

The cross product of two vectors yields a perpendicular vector, which we can use to get a vector $\vec{d}$ that's perpendicular to the plane formed by the triangle.

<p align="center">$$\vec{d} = (b - a) × (c - a)$$</p>

<Scene scene="three-points-cross-product" height={400} yOffset={-0.3} />

<SmallNote label="" center>$d$ has been scaled down to a third of its real length for clarity</SmallNote>

$\vec{d}$ represents a direction, but it's not normalized yet. We can normalize $\vec{d}$ to $\vec{n}$ by dividing $\vec{d}$ by its magnitude $|\vec{d}|$:

<p align="center">$$\vec{n} = \dfrac{\vec{d}}{|\vec{d}|}$$</p>

<Scene scene="three-points-normal" height={360} yOffset={-0.3} />

Having computed the normal $\vec{n}$ we can use it and any of the points $a$, $b$, $c$ to describe the plane intersecting the three points in its point-normal form.

<Scene scene="three-points-plane" height={400} yOffset={-1} />

It doesn't matter which of $a$, $b$, $c$ we use to define the plane; we always get the same unique plane.

This can be written in C# like so:

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


## Constant-normal form

We've covered the point-normal form of planes, and how we can derive the point-normal from three points in 3D space.

There's one form we've yet to cover, which is a more canonical way to describe planes: using a normal $\vec{n}$ and a distance $d$. This is called the _constant-normal form_ of a plane.

<Scene scene="constant-normal-form" height={400} />

In the constant-normal form, the distance $d$ denotes how close the plane gets to the origin. Thought of another way: multiplying the normal $\vec{n}$ by $d$ yields the point on the plane that's closest to the origin.

This is still a bit abstract, so here's an example that demonstrates the relationship between the point-normal and constant-normal forms:

<Scene scene="point-normal-and-constant-normal-form" height={400} />

The green arrow represents $d$ times $\vec{n}$ from the constant-normal form, while the blue point and arrow represent the point $p$ and normal $\vec{n}$ from the point-normal form.

Translating from the point-normal to the constant-normal form is very easy: the distance $d$ is the dot product of $\vec{n}$ and $p$.

<p align="center">$$\vec{n} \cdot p = d$$</p>

The normal $\vec{n}$ stays the same across both forms.

I find the constant-normal form less natural to think about when compared to the point-normal form, but it simplifies many plane operations.


## Distance from plane

Given an arbitrary point $x$ and a plane $P_1$ in constant-normal form, we may want to ask how far away the point is from the plane. In other words, what is the minimum distance $x$ needs to travel to lie on the plane?

<Scene scene="point-and-plane" height={400} />

We can frame this differently if we construct a plane $P_2$ intersecting $x$ that is parallel to $P_1$, which we can do in point-normal form using $x$ as the point and $P_1$'s normal $\vec{n}$ as the normal:

<Scene scene="point-distance-step-1" height={400} />

With two parallel planes, we can frame the problem as finding the distance between the two planes. This becomes trivial using their constant-normal forms since it allows us to take the difference between their distances.

So let's find $P_2$'s distance using the $d = \vec{n} \cdot p$ formula we learned about:

<Scene scene="point-distance-step-2" height={400} />

With two distances $d_1$, $d_2$ from the planes $P_1$, $P_2$ the solution becomes $d_2 - d_1$.

<Scene scene="point-distance-step-3" height={400} />

So, given a point $x$ and plane $P$ in constant-normal form having a normal $\vec{n}$ and distance $d$, we can define a function $dist(P, x)$ as:

<p align="center">$$dist(P, x) = \vec{n} \cdot x - d $$</p>

The distance may be positive or negative depending on which side of the plane the point is on. In either case, $x + \vec{n}\,\,dist(P, x)$ projects $x$ onto the plane along the normal's direction.


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

When finding the point-of-intersection for three planes, we'll first need to see whether the three planes all intersect.

Given that $\vec{n_1}$, $\vec{n_2}$, $\vec{n_3}$ are the plane normals for $P_1$, $P_2$, $P_3$, we can determine whether the planes intersect at a point with the formula:

<p align="center">$$ \vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) \neq 0 $$</p>

<SmallNote label="" center>The order in which we plug in the planes does not matter.</SmallNote>

Let's work through some examples. If $\vec{n_2}$ and $\vec{n_3}$ are parallel then $\vec{n_2} × \vec{n_3}$ yields a vector whose magnitude is zero.

<p align="center">$$|\vec{n_2} × \vec{n_3}| = 0$$</p>

And since the dot product is a multiple of the magnitudes of its component vectors:

<p align="center">$$a \cdot b = |a|\,|b|\,cos\,\theta$$</p>

the final result is zero whenever $\vec{n_2}$ and $\vec{n_3}$ are parallel.

<p align="center">$$\vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) = 0$$</p>

This takes care the configurations where $\vec{n_2}$ and $\vec{n_3}$ are parallel.

<Scene scene="three-planes-n2-n3-parallel" height={400} />

With that, let's consider the case where $\vec{n_1}$ is parallel to either $\vec{n_2}$ or $\vec{n_3}$ but $\vec{n_2}$ and $\vec{n_3}$ are not parallel to each other.

Let's take the example where $\vec{n_1}$ is parallel to $\vec{n_2}$ ($\vec{n_3}$ is parallel to neither).

<Scene scene="three-planes-n1-n2-parallel" height={400} />

The cross product $\vec{n_2} × \vec{n_3}$ yields a vector that's perpendicular to both $\vec{n_2}$ and $\vec{n_3}$.

<Scene scene="three-planes-n1-n2-parallel-cross" height={400} />

Since $\vec{n_1}$ is parallel to $\vec{n_2}$, that means that $\vec{n_2} × \vec{n_3}$ is also perpendicular to $\vec{n_1}$.

As we learned, the dot product of two perpendicular is zero, meaning that:

<p align="center">$$\vec{n_1} \cdot (\vec{n_2} × \vec{n_3}) = 0$$</p>

Which also holds in the case where $\vec{n_1}$ is parallel to $\vec{n_3}$.


[book_ref]: #real-time-collision-detection