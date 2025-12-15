import { createScene2D } from "../createScene2D";

export default createScene2D(
  ({ ctx, width, height }) => {
    // Background
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.closePath();
    ctx.fillStyle = "#a8a8a8ff";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height * 0.45);
    ctx.lineTo(width, height * 0.45);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = "#393939ff";
    ctx.fill();
  },
  { static: true },
);
