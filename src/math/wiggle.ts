import { lerp } from "./lerp";

export function createWiggle() {
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

  const tau = Math.PI * 2;
  let lastNow = Date.now();
  let time = 0;
  return (speed: number, amplitude: number) => {
    const currNow = Date.now();
    let elapsed = currNow - lastNow;
    lastNow = currNow;

    time += (elapsed / 1000) * speed * tau;

    let out = 0;
    for (const [item, offset] of waves) {
      out += Math.sin(time * item + offset) * amplitude;
    }
    return out;
  };
}
