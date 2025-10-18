import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const threeSamplesConfig: Config = {
  name: "three-samples",
  SAMPLING_CONFIG: {
    points: [
      { x: 0.5, y: 0.25 },
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: 0.75 },
    ],
    circleRadius: 13.5,
  },
  CANVAS_WIDTH: 40,
  CANVAS_HEIGHT: 64,
  FONT_FAMILY: "Fira Code",
  FONT_SIZE: 48,
  CUSTOM_FONT_PATHS: {
    "Fira Code": ["/Users/alex/Library/Fonts/FiraCode-Regular.ttf"],
  },
  GENERATE_DEBUG_IMAGES: true,
  GENERATE_COMPOSITE_DEBUG_IMAGE: true,
  ALPHABETS: [Alphabet.ASCII],
  PICK_MOST_DISTINCT: null,
  BLUR_RADIUS: 0,
};
