import { createScene2D } from "../createScene2D";

export const breatheScene = createScene2D(
  ({ ctx, width, height, elapsed, variables }) => {
    const t = (Math.sin((elapsed / 1000) * 0.5) + 1) / 2;
    const radius = width * 0.05 + t * width * 0.4;

    const x = width * variables.xPosition;
    const y = height / 2;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  },
  {
    variables: {
      xPosition: {
        label: "math:x",
        type: "number",
        value: 0.7,
        range: [0.1, 0.9],
        step: 0.01,
        format: "percent",
      },
    },
  },
);
