import { Scene2DProps } from "./createScene2D";
import { breatheScene } from "./scenes/breathe";
import { circleScene } from "./scenes/circle";
import { shadeSplitScene } from "./scenes/shadeSplit";
import shade_split_0 from "./scenes/shade_split_0";
import circle_zoomed from "./scenes/circle_zoomed";
import rotating_square from "./scenes/rotating_square";
import slanted_line from "./scenes/slanted_line";

export const canvas2DScenes: Partial<Record<string, React.ComponentType<Scene2DProps>>> = {
  circle: circleScene,
  breathe: breatheScene,
  "shade-split": shadeSplitScene,
  shade_split_0,
  circle_zoomed,
  rotating_square,
  slanted_line,
};
