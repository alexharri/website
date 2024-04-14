import { Plane } from "./Plane";

const EPSILON = 1e-5;

export function threePlaneIntersection(p1: Plane, p2: Plane, p3: Plane) {
  const u = p2.normal.cross(p3.normal);

  const denom = p1.normal.dot(u);

  if (Math.abs(denom) < EPSILON) {
    return null; // Planes do not intersect at a single point
  }

  const p2n_p3d = p2.normal.multiplyScalar(p3.distance);
  const p3n_p2d = p3.normal.multiplyScalar(p2.distance);
  const c = p1.normal.cross(p2n_p3d.sub(p3n_p2d));
  const d = u.multiplyScalar(p1.distance);

  return d.add(c).divideScalar(denom);
}
