import type THREE from "three";

type Vector3 = THREE.Vector3;

export class Plane {
  private _distance: number;
  private _normal: Vector3;

  get distance() {
    return this._distance;
  }
  set distance(value: number) {
    this._distance = value;
  }
  get normal() {
    return this._normal.clone();
  }
  set normal(value: Vector3) {
    this._normal = value.clone();
  }

  constructor(distance: number, normal: Vector3) {
    this._distance = distance;
    this._normal = normal.clone();
  }

  static fromPointAndNormal(point: Vector3, normal: Vector3) {
    const distance = normal.dot(point);
    return new Plane(distance, normal);
  }
}
