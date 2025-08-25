import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const ascii60Config: Config = {
  name: "ascii-60",
  SAMPLING_CONFIG: {
    points: [
      { x: 0.3, y: 0.23 },
      { x: 0.7, y: 0.18 },
      { x: 0.3, y: 0.5 },
      { x: 0.7, y: 0.5 },
      { x: 0.3, y: 0.82 },
      { x: 0.7, y: 0.77 },
    ],
    externalPoints: [
      { x: -0.3, y: -0.23 },
      { x: 1.3, y: -0.23 },
      { x: -0.3, y: 0.5 },
      { x: 1.3, y: 0.5 },
      { x: -0.3, y: 1.23 },
      { x: 1.3, y: 1.23 },
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
  GENERATE_DEBUG_IMAGES: true,
  GENERATE_COMPOSITE_DEBUG_IMAGE: true,
  ALPHABETS: [Alphabet.ASCII],
  PICK_MOST_DISTINCT: 60,
  BLUR_RADIUS: 0,
};
