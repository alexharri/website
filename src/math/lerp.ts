export const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const lerpClamped = (a: number, b: number, t: number) => clamp(a * (1 - t) + b * t, 0, 1);

export const invLerp = (a: number, b: number, value: number) => (value - a) / (b - a);
