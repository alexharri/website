import { createScene2D } from "../createScene2D";

export default createScene2D(
  ({ ctx, width, height, variables }) => {
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.closePath();
    ctx.fillStyle = "#bbbbbb";
    ctx.fill();

    const xOff = width * 0.2 * variables.x;

    const xCenter = width * 0.5;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(xCenter + height * 0.2 + xOff, 0);
    ctx.lineTo(xCenter - height * 0.2 + xOff, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = "#333333";
    ctx.fill();
  },
  {
    static: true,
    variables: {
      x: {
        label: "math:x",
        range: [0, 1],
        type: "number",
        value: 0.5,
        step: 0.05,
      },
    },
  },
);
