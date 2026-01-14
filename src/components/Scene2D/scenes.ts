import { Scene2DProps } from "./createScene2D";
import { breatheScene } from "./scenes/breathe";
import { circleScene } from "./scenes/circle";
import shade_split from "./scenes/shade_split";
import saturn from "./scenes/saturn";
import circle_zoomed from "./scenes/circle_zoomed";
import circle_zoomed_bottom from "./scenes/circle_zoomed_bottom";
import circle_sample_quality from "./scenes/circle_sample_quality";
import circle_bottom from "./scenes/circle_bottom";
import circle_raised from "./scenes/circle_raised";
import rotating_square from "./scenes/rotating_square";
import rotating_square_raised from "./scenes/rotating_square_raised";
import slanted_line from "./scenes/slanted_line";
import staircase_effect from "./scenes/staircase_effect";
import shade_split_static from "./scenes/shade_split_static";

export const canvas2DScenes: Partial<Record<string, React.ComponentType<Scene2DProps>>> = {
  circle: circleScene,
  circle_sample_quality,
  circle_raised,
  circle_bottom,
  breathe: breatheScene,
  saturn,
  shade_split,
  shade_split_static,
  circle_zoomed,
  circle_zoomed_bottom,
  rotating_square,
  rotating_square_raised,
  staircase_effect,
  slanted_line,
};
