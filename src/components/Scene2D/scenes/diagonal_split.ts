import { colors } from "../../../utils/cssVariables";
import { createScene2D } from "../createScene2D";

const colWidth = 20;
const rowHeight = 24;
const slope = colWidth / rowHeight;

export default createScene2D(({ ctx, width, height, targetHeight, targetWidth }) => {
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.closePath();
  ctx.fillStyle = colors.blue;
  ctx.fill();

  const rows = targetHeight / rowHeight;

  const xOff = height * 0.02;
  const xCenter = width * 0.5 + xOff;

  const xDelta = -colWidth * (rows / 2) * 3;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(xCenter - xDelta, 0);
  ctx.lineTo(xCenter + xDelta, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = colors.background300;
  ctx.fill();
});
