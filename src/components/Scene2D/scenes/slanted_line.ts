import { colors } from "../../../utils/cssVariables";
import { createScene2D } from "../createScene2D";

export default createScene2D(
  ({ ctx, width, height }) => {
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = colors.background200;
    ctx.fill();

    const slope = 1 / 3;

    const deltaY = (width / 2) * slope;

    const shiftX = width * 0.01;

    ctx.beginPath();
    ctx.moveTo(-shiftX, height / 2 + deltaY);
    ctx.lineTo(width + shiftX, height / 2 - deltaY);
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = width * 0.052;
    ctx.stroke();
  },
  {
    variables: {
      sampleQuality: {
        label: "Number of samples",
        range: [1, 4],
        type: "number",
        value: 1,
        step: 1,
        showValue: true,
      },
    },
  },
);
