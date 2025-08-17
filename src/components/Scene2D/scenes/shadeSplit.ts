import { Scene2DBase } from "../base";

export class ShadeSplitScene extends Scene2DBase {
  constructor(ctx: CanvasRenderingContext2D) {
    super(ctx);
  }

  draw() {
    const { ctx, width, height, elapsed } = this;

    const t = Math.sin((elapsed / 1000) * 0.5);

    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.closePath();
    ctx.fillStyle = "#bbbbbb";
    ctx.fill();

    const xOff = width * 0.2 * t;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width * 0.7 + xOff, 0);
    ctx.lineTo(width * 0.3 + xOff, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = "#333333";
    ctx.fill();
  }
}
