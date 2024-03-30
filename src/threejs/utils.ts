import type THREE from "three";
import { Three } from "./types";

export type IVector3 = { x: number; y: number; z: number } | [number, number, number];

export function parseVector(THREE: Three, vec?: IVector3) {
  if (!vec) return new THREE.Vector3(0, 0, 0);
  if (Array.isArray(vec)) return new THREE.Vector3(vec[0], vec[1], vec[2]);
  return new THREE.Vector3(vec.x, vec.y, vec.z);
}

const colors = {
  white: 0xffffff,
  background: 0x090d13,
  gray: 0xcccccc,
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

const phongMaterialCache: Partial<Record<number, THREE.MeshPhongMaterial>> = {};

export function getPhongMaterial(THREE: Three, color: IColor) {
  if (typeof color === "string") color = colors[color];
  return (phongMaterialCache[color] ||= new THREE.MeshPhongMaterial({ color }));
}

const basicMaterialCache: Partial<Record<number, THREE.MeshBasicMaterial>> = {};

export function getBasicMaterial(THREE: Three, color: IColor) {
  if (typeof color === "string") color = colors[color];
  return (basicMaterialCache[color] ||= new THREE.MeshBasicMaterial({ color }));
}

const transparentMaterialCache: Partial<Record<number, THREE.MeshBasicMaterial>> = {};

export function getTransparentBasicMaterial(THREE: Three, color: IColor) {
  if (typeof color === "string") color = colors[color];
  return (transparentMaterialCache[color] ||= new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
  }));
}
