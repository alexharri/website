import { colors } from "../../../utils/cssVariables";
import { createScene2D } from "../createScene2D";

const HEIGHT = 360;

export default createScene2D(
  ({ ctx, width, height: canvasHeight, targetHeight }) => {
    const height = HEIGHT * (canvasHeight / targetHeight);
    const x = width / 2;
    const y = height / 2;
    const radius = height / 3.1;

    ctx.beginPath();
    ctx.rect(0, 0, width, canvasHeight);
    ctx.fillStyle = colors.background300;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  },
  {
    static: true,
    variables: {
      sampleQuality: {
        label: "Number of samples",
        range: [1, 16],
        type: "number",
        value: 1,
        step: 1,
        showValue: true,
      },
    },
  },
);
