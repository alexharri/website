import { createScene2D } from "../createScene2D";

export const shadeSplitScene = createScene2D(
  ({ ctx, width, height, elapsed, variables }) => {
    const t = Math.sin((elapsed / 1000) * variables.speed);

    // Background
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.closePath();
    ctx.fillStyle = `#${variables.lightColor.toString(16).padStart(6, '0')}`;
    ctx.fill();

    // Moving split shape
    const xOff = width * variables.splitAmplitude * t;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width * variables.topSplit + xOff, 0);
    ctx.lineTo(width * variables.bottomSplit + xOff, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = `#${variables.darkColor.toString(16).padStart(6, '0')}`;
    ctx.fill();
  },
  {
    variables: {
      speed: { type: "number", range: [0.1, 2], value: 0.5, step: 0.1, label: "Speed" },
      splitAmplitude: { type: "number", range: [0, 0.5], value: 0.2, step: 0.05, format: "percent", label: "Split Amplitude" },
      topSplit: { type: "number", range: [0.3, 0.9], value: 0.7, step: 0.05, format: "percent", label: "Top Split" },
      bottomSplit: { type: "number", range: [0.1, 0.7], value: 0.3, step: 0.05, format: "percent", label: "Bottom Split" },
      lightColor: { type: "number", range: [0x888888, 0xffffff], value: 0xbbbbbb, label: "Light Color" },
      darkColor: { type: "number", range: [0x000000, 0x888888], value: 0x333333, label: "Dark Color" },
    },
  },
);
