import { Scene2DProps } from "./createScene2D";
import { breatheScene } from "./scenes/breathe";
import { circleScene } from "./scenes/circle";
import { shadeSplitScene } from "./scenes/shadeSplit";

export const canvas2DScenes: Partial<Record<string, React.ComponentType<Scene2DProps>>> = {
  circle: circleScene,
  breathe: breatheScene,
  "shade-split": shadeSplitScene,
};
