import { createScene2D } from "../createScene2D";

export default createScene2D(
  ({ ctx, width, height, variables }) => {
    const x = width / 2 + height * 0.8 + variables.x * height * 0.5 + 2;
    const y = height / 2;
    const radius = height * 1;

    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = "black";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  },
  {
    variables: {
      x: {
        label: "math:x",
        value: 0,
        range: [-1, 1],
        type: "number",
        step: 0.05,
        showValue: false,
      },
    },
  },
);
