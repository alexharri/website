import { Scene2DBase } from "../base";

export class BreatheScene extends Scene2DBase {
  constructor(ctx: CanvasRenderingContext2D) {
    super(ctx);
  }

  draw() {
    const { ctx, width, height, elapsed } = this;

    const t = Math.sin(elapsed / 1000 / 5);
    const radius = width / 2 + t * 300;

    const x = width;
    const y = height / 2;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}
