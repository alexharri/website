import type THREE from "three";
import { Plane } from "./Plane";

const EPSILON = 0.0000001;

export function rayPlaneIntersection(
  plane: Plane,
  lineNormal: THREE.Vector3,
  linePoint: THREE.Vector3,
) {
  const denom = plane.normal.dot(lineNormal);
  if (denom < EPSILON) {
    return null; // Line and plane are parallel
  }

  const D = (plane.distance - plane.normal.dot(linePoint)) / denom;
  return linePoint.clone().add(lineNormal.clone().multiplyScalar(D));
}
