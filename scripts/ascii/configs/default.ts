import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const defaultConfig: Config = {
  name: "default",
  SAMPLING_CONFIG: {
    // prettier-ignore
    points: [
      { x: 0.3, y: 0.23 }, // top-left quadrant
      { x: 0.7, y: 0.18 }, // top-right quadrant
      { x: 0.3, y: 0.5 }, // center
      { x: 0.7, y: 0.5 }, // center
      { x: 0.3, y: 0.82 }, // bottom-left quadrant
      { x: 0.7, y: 0.77 }, // bottom-right quadrant
    ],
    // prettier-ignore
    externalPoints: [
      { x: -0.3,  y: -0.23 }, // top-left quadrant
      { x:  1.3,  y: -0.23 }, // top-right quadrant
      { x: -0.3,  y:  0.5 }, // center
      { x:  1.3,  y:  0.5 }, // center
      { x: -0.3,  y:  1.23 }, // bottom-left quadrant
      { x:  1.3,  y:  1.23 }, // bottom-right quadrant
    ],
    circleRadius: 13.5,
  },
  CANVAS_WIDTH: 48,
  CANVAS_HEIGHT: 64,
  FONT_FAMILY: "Fira Code",
  FONT_SIZE: 48,
  CUSTOM_FONT_PATHS: {
    "Fira Code": ["/Users/alex/Library/Fonts/FiraCode-Regular.ttf"],
  },
  GENERATE_DEBUG_IMAGES: false,
  GENERATE_COMPOSITE_DEBUG_IMAGE: false,
  ALPHABETS: [Alphabet.ASCII],
  MAX_CHARACTERS: null,
  BLUR_RADIUS: 0,
};
