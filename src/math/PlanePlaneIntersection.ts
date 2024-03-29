import { Plane } from "./Plane";

const EPSILON = 0.0000001;

export function planePlaneIntersection(p1: Plane, p2: Plane) {
  const direction = p1.normal.cross(p2.normal);
  if (direction.length() < EPSILON) {
    return null; // Roughly parallel planes
  }
  const normal = direction.normalize();

  const d11 = p1.normal.dot(p1.normal);
  const d12 = p1.normal.dot(p2.normal);
  const d22 = p2.normal.dot(p2.normal);

  const denom = d11 * d22 - d12 * d12;

  const k1 = (p1.distance * d22 - p2.distance * d12) / denom;
  const k2 = (p2.distance * d11 - p1.distance * d12) / denom;

  const point = p1.normal.multiplyScalar(k1).add(p2.normal.multiplyScalar(k2));

  return { normal, point };
}

export function planePlaneIntersectionNew(p1: Plane, p2: Plane) {
  const direction = p1.normal.cross(p2.normal);

  if (direction.length() < EPSILON) return null; // Roughly parallel planes

  const denom = direction.dot(direction);
  const a = p2.normal.multiplyScalar(p1.distance);
  const b = p1.normal.multiplyScalar(p2.distance);

  const point = direction.clone().cross(b.sub(a)).divideScalar(denom);

  return { normal: direction.clone().normalize(), point };
}
