import { createScene2D } from "../createScene2D";

export default createScene2D(({ ctx, width, height }) => {
  // Background
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.closePath();
  ctx.fillStyle = "#bbbbbb";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height * 0.45);
  ctx.lineTo(width, height * 0.45);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = "#555555";
  ctx.fill();
});
