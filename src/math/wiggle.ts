import { lerp } from "./lerp";

export function createWiggle(speed: number, amplitude: number) {
  const waves = [
    lerp(0.2, 0.4, Math.random()),
    lerp(0.2, 0.5, Math.random()),
    lerp(0.3, 0.4, Math.random()),
    lerp(0.5, 0.6, Math.random()),
    lerp(0.2, 0.5, Math.random()),
    lerp(0.4, 0.7, Math.random()),
    lerp(0.5, 0.7, Math.random()),
    lerp(0.2, 0.5, Math.random()),
    lerp(0.4, 0.8, Math.random()),
    lerp(0.8, 1, Math.random()),
  ].map((item) => [item, item * Math.random() * 5] as const);

  return () => {
    const now = Date.now();

    let out = 0;
    const fac = (now / 1000) * Math.PI * 2 * speed;
    for (const [item, offset] of waves) {
      out += Math.sin(fac * item + offset) * amplitude;
    }
    return out;
  };
}
