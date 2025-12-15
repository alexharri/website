import { colors } from "../../../utils/cssVariables";
import { createScene2D } from "../createScene2D";

const FRAC = 120 / 408;

export default createScene2D(
  ({ ctx, width, height: canvasHeight }) => {
    const height = canvasHeight / FRAC;
    const x = width / 2;
    const y = height / 2 - height * 0.065 - canvasHeight * 2;
    const radius = height / 3.1;

    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = colors.background300;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  },
  { static: true },
);
