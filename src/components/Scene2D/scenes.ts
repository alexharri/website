import { Scene2DBase } from "./Scene2DBase";
import { BouncingBallScene } from "./scenes/bouncing-ball";

export const canvas2DScenes: Record<string, new (ctx: CanvasRenderingContext2D, width: number, height: number, props?: any) => Scene2DBase> = {
  "bouncing-ball": BouncingBallScene,
};