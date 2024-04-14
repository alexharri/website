import { Plane } from "./Plane";

const EPSILON = 1e-5;

export function threePlaneIntersection(p1: Plane, p2: Plane, p3: Plane) {
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
