export class Vector3 {
  static get ORIGIN() {
    return new Vector3(0, 0, 0);
  }

  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
  ) {}

  add(vec: Vector3) {
    return new Vector3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
  }

  subtract(vec: Vector3) {
    return new Vector3(this.x - vec.x, this.y - vec.y, this.z - vec.z);
  }
}
