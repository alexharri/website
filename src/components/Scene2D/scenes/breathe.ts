import { createScene2D } from "../createScene2D";

export const breatheScene = createScene2D(
  ({ ctx, width, height, elapsed, variables }) => {
    const t = Math.sin((elapsed / 1000) * 0.5);
    const radius = Math.max(0, width / 4 + t * 200);

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
        type: "number",
        range: [0.1, 0.9],
        value: 0.7,
        step: 0.01,
        format: "percent",
        label: "math:x",
      },
    },
  },
);
