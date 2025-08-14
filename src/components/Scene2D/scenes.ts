import { CircleScene } from "./scenes/circle";

export const canvas2DScenes: Record<
  string,
  new (ctx: CanvasRenderingContext2D) => { render: () => void }
> = {
  circle: CircleScene,
};
