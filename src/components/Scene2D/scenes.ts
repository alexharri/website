import { BreatheScene } from "./scenes/breathe";
import { CircleScene } from "./scenes/circle";
import { ShadeSplitScene } from "./scenes/shadeSplit";

export const canvas2DScenes: Record<
  string,
  new (ctx: CanvasRenderingContext2D) => { render: () => void }
> = {
  circle: CircleScene,
  breathe: BreatheScene,
  "shade-split": ShadeSplitScene,
};
