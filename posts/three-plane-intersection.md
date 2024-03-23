---
title: "Three-plane intersections"
---

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

The cross product of two vectors yields a perpendicular vectors, which we can use to get a vector $\vec{d}$ that's perpendicular to the plane formed by the triangle.

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








{/** todo better system for this */}
<span data-varlabel="d">$d$</span>
<span data-varlabel="vec_n">$\vec{n}$</span>
<span data-varlabel="n">$n$</span>

