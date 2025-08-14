export type DrawOptions = { elapsed: number; timeDelta: number };

export abstract class Scene2DBase {
  protected ctx: CanvasRenderingContext2D;
  protected elapsed: number = 0;
  protected timeDelta: number = 0;
  private startTime = Date.now();
  private lastTime = Date.now();

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  get width(): number {
    return this.ctx.canvas.width;
  }

  get height(): number {
    return this.ctx.canvas.height;
  }

  public render() {
    const now = Date.now();
    this.timeDelta = now - this.lastTime;
    this.elapsed = now - this.startTime;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.draw();

    this.lastTime = now;
  }

  abstract draw(): void;
}
