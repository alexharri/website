import { createScene2D } from "../createScene2D";

const slope = 0.14;

export default createScene2D(
  ({ ctx, width, height }) => {
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.closePath();
    ctx.fillStyle = "#969696ff";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height * (0.5 - slope));
    ctx.lineTo(0, height * (0.5 + slope));
    ctx.closePath();
    ctx.fillStyle = "#4a4a4aff";
    ctx.fill();
  },
  {
    // variables: {
    //   slope: {
    //     range: [0, 0.5],
    //     type: "number",
    //     value: 0.14,
    //     label: "Slope",
    //   },
    // },
  },
);
