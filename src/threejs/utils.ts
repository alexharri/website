import { MeshPhongMaterial, Vector3 } from "three";

export type IVector3 = { x: number; y: number; z: number } | [number, number, number];

export function parseVector(vec?: IVector3) {
  if (!vec) return new Vector3(0, 0, 0);
  if (Array.isArray(vec)) return new Vector3(vec[0], vec[1], vec[2]);
  return new Vector3(vec.x, vec.y, vec.z);
}

const colors = {
  red: 0xff1919,
  darkred: 0xc20808,
  green: 0x15cf53,
  blue: 0x1370f2,
} as const;
export type IColor = number | keyof typeof colors;

export function getColor(color: IColor): number {
  if (typeof color === "string") color = colors[color];
  return color;
}

const materialCache: Partial<Record<number, MeshPhongMaterial>> = {};

export function getMaterial(color: IColor) {
  if (typeof color === "string") color = colors[color];
  return (materialCache[color] ||= new MeshPhongMaterial({ color }));
}
