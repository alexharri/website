import { createScene2D } from "../createScene2D";

export const shadeSplitScene = createScene2D(({ ctx, width, height, elapsed }) => {
  const t = Math.sin((elapsed / 1000) * 0.5);

  // Background
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.closePath();
  ctx.fillStyle = "#bbbbbb";
  ctx.fill();

  // Moving split shape
  const xOff = width * 0.2 * t;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width * 0.7 + xOff, 0);
  ctx.lineTo(width * 0.3 + xOff, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = "#333333";
  ctx.fill();
});
