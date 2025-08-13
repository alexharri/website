import { Scene2DBase } from "../Scene2DBase";

interface BouncingBallProps {
  speed?: number;
  ballRadius?: number;
  ballColor?: string;
}

export class BouncingBallScene extends Scene2DBase {
  private x: number;
  private y: number;
  private vx: number;
  private vy: number;
  private radius: number;
  private color: string;

  constructor(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    props: BouncingBallProps = {}
  ) {
    super(ctx, width, height);
    
    const speed = props.speed || 300;
    this.radius = props.ballRadius || 30;
    this.color = props.ballColor || "#ffffff";
    
    this.x = this.radius + Math.random() * (width - 2 * this.radius);
    this.y = this.radius + Math.random() * (height - 2 * this.radius);
    this.vx = (Math.random() - 0.5) * speed;
    this.vy = (Math.random() - 0.5) * speed;
  }

  render(): void {
    const deltaTime = 1/60; // Assume 60fps

    // Update position
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // Bounce off walls
    if (this.x - this.radius <= 0 || this.x + this.radius >= this.width) {
      this.vx = -this.vx;
      this.x = Math.max(this.radius, Math.min(this.width - this.radius, this.x));
    }
    if (this.y - this.radius <= 0 || this.y + this.radius >= this.height) {
      this.vy = -this.vy;
      this.y = Math.max(this.radius, Math.min(this.height - this.radius, this.y));
    }

    // Clear and draw
    this.clearCanvas();
    
    this.ctx.fillStyle = this.color;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}