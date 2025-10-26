import { colors } from "../../../utils/cssVariables";
import { createScene2D } from "../createScene2D";

export default createScene2D(({ ctx, width, height }) => {
  const x = width * 0.8;
  const y = -width * 0.4;
  const radius = width * 0.81;

  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.fillStyle = colors.background300;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
});
