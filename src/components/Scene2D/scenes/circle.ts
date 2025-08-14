import { Scene2DBase } from "../base";

export class CircleScene extends Scene2DBase {
  constructor(ctx: CanvasRenderingContext2D) {
    super(ctx);
  }

  draw() {
    const { ctx, width, height, elapsed } = this;

    const tx = Math.sin(elapsed / 1000);
    const ty = Math.cos(elapsed / 1000);
    const radius = 125;

    const x = width / 2 + tx * 200;
    const y = height / 2 + ty * 100;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}
