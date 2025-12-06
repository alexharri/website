/**
 * Easing functions for animations
 * Based on standard easing equations
 */

/**
 * Back easing out - overshoots and comes back
 * Useful for bouncy entrance animations
 */
export const backOut = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/**
 * Cubic easing in/out - smooth acceleration and deceleration
 */
export const cubicInOut = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

/**
 * Exponential easing in/out - dramatic acceleration
 */
export const expoInOut = (t: number): number => {
  return t === 0
    ? 0
    : t === 1
    ? 1
    : t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
};

/**
 * Maps a value from one range to another with optional easing
 * @param value - The input value
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @param easeFn - Optional easing function to apply
 * @returns The mapped value
 */
export const fit = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  easeFn?: (t: number) => number
): number => {
  let t = (value - inMin) / (inMax - inMin);
  t = Math.max(0, Math.min(1, t)); // clamp to [0,1]
  if (easeFn) t = easeFn(t);
  return outMin + t * (outMax - outMin);
};
