import { createScene2D } from "../createScene2D";

export default createScene2D(
  ({ ctx, width, height }) => {
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.closePath();
    ctx.fillStyle = "#969696ff";
    ctx.fill();

    const yOff = 48;

    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height * 0.5 - yOff);
    ctx.lineTo(0, height * 0.5 + yOff);
    ctx.closePath();
    ctx.fillStyle = "#4a4a4aff";
    ctx.fill();
  },
  { static: true },
);
