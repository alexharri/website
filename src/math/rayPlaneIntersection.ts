import type * as THREE from "three";
import { Plane } from "./Plane";

const EPSILON = 0.0000001;

export function rayPlaneIntersection(
  plane: Plane,
  lineNormal: THREE.Vector3,
  linePoint: THREE.Vector3,
) {
  const denom = plane.normal.dot(lineNormal);
  if (denom < EPSILON) {
    return null; // Ray and plane are parallel, or ray does not hit plane
  }

  const D = (plane.distance - plane.normal.dot(linePoint)) / denom;
  return linePoint.clone().add(lineNormal.clone().multiplyScalar(D));
}
