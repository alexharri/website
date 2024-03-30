import { Plane } from "./Plane";

const EPSILON = 0.0000001;

export function planePlaneIntersection(p1: Plane, p2: Plane) {
  const direction = p1.normal.cross(p2.normal);

  if (direction.length() < EPSILON) return null; // Roughly parallel planes

  const denom = direction.dot(direction);
  const a = p2.normal.multiplyScalar(p1.distance);
  const b = p1.normal.multiplyScalar(p2.distance);

  const point = direction.clone().cross(b.sub(a)).divideScalar(denom);

  return { normal: direction.clone().normalize(), point };
}
