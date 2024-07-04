export const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

export const invLerp = (a: number, b: number, value: number) => (value - a) / (b - a);
