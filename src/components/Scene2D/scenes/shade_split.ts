import { createScene2D } from "../createScene2D";

export default createScene2D(({ ctx, width, height, elapsed }) => {
  const t = Math.sin((elapsed / 1000) * 0.5);

  // Background
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.closePath();
  ctx.fillStyle = "#bbbbbb";
  ctx.fill();

  // Moving split shape
  const xOff = (height / 2) * t;

  const xCenter = width * 0.5;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(xCenter - height * 0.2 + xOff, 0);
  ctx.lineTo(xCenter + height * 0.2 + xOff, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = "#686868ff";
  ctx.fill();
});
