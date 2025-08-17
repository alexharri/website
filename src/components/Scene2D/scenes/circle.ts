import { createScene2D } from "../createScene2D";

export const circleScene = createScene2D(
  ({ ctx, width, height, elapsed, variables }) => {
    const tx = Math.sin(elapsed / variables.speed);
    const ty = Math.cos(elapsed / variables.speed);

    const x = width / 2 + tx * variables.xRange;
    const y = height / 2 + ty * variables.yRange;

    ctx.beginPath();
    ctx.arc(x, y, variables.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  },
  {
    variables: {
      radius: { type: "number", range: [10, 200], value: 125, label: "Radius" },
      speed: { type: "number", range: [100, 2000], value: 1000, label: "Speed" },
      xRange: { type: "number", range: [0, 400], value: 200, label: "X Range" },
      yRange: { type: "number", range: [0, 200], value: 100, label: "Y Range" },
    },
  },
);
