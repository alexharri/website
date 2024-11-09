import type * as THREE from "three";
import { Plane } from "./Plane";

export function threePlaneIntersection(p1: Plane, p2: Plane, p3: Plane) {
  const EPSILON = 1e-5;

  const dir = p2.normal.cross(p3.normal);
  const denom = p1.normal.dot(dir);

  if (Math.abs(denom) < EPSILON) {
    return null; // Planes do not intersect at a single point
  }

  const a = p2.normal.multiplyScalar(p3.distance);
  const b = p3.normal.multiplyScalar(p2.distance);
  const V = p1.normal.cross(a.sub(b));
  const U = dir.multiplyScalar(p1.distance);

  return U.add(V).divideScalar(denom);
}

export function rayPlaneIntersection(
  plane: Plane,
  lineNormal: THREE.Vector3,
  linePoint: THREE.Vector3,
) {
  const EPSILON = 0.0000001;

  const denom = plane.normal.dot(lineNormal);
  if (denom < EPSILON) {
    return null; // Ray and plane are parallel, or ray does not hit plane
  }

  const D = (plane.distance - plane.normal.dot(linePoint)) / denom;
  return linePoint.clone().add(lineNormal.clone().multiplyScalar(D));
}

export function linePlaneIntersection(
  plane: Plane,
  lineNormal: THREE.Vector3,
  linePoint: THREE.Vector3,
) {
  const EPSILON = 0.0000001;

  const denom = plane.normal.dot(lineNormal);
  if (Math.abs(denom) < EPSILON) {
    return null; // Line and plane are parallel
  }

  const D = (plane.distance - plane.normal.dot(linePoint)) / denom;
  return linePoint.clone().add(lineNormal.clone().multiplyScalar(D));
}

export function planePlaneIntersection(p1: Plane, p2: Plane) {
  const EPSILON = 0.0000001;

  const direction = p1.normal.cross(p2.normal);

  if (direction.length() < EPSILON) return null; // Roughly parallel planes

  const denom = direction.dot(direction);
  const a = p2.normal.multiplyScalar(p1.distance);
  const b = p1.normal.multiplyScalar(p2.distance);

  const point = direction.clone().cross(b.sub(a)).divideScalar(denom);

  return { normal: direction.clone().normalize(), point };
}
