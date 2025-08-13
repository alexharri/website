export abstract class Scene2DBase {
  protected ctx: CanvasRenderingContext2D;
  protected width: number;
  protected height: number;
  protected startTime: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.startTime = Date.now();
  }

  abstract render(): void;

  protected getElapsedTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  protected clearCanvas(): void {
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}