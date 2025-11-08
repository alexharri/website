import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const sixSamplesConfig: Config = {
  name: "six-samples",
  SAMPLING_CONFIG: {
    points: [
      { x: 0.27, y: 0.18 },
      { x: 0.73, y: 0.18 },
      { x: 0.27, y: 0.5 },
      { x: 0.73, y: 0.5 },
      { x: 0.27, y: 0.82 },
      { x: 0.73, y: 0.82 },
    ],
    circleRadius: 9.3,
  },
  FONT_SIZE: 48,
  CANVAS_WIDTH: 40,
  CANVAS_HEIGHT: 64,
  FONT_FAMILY: "Fira Code",
  CUSTOM_FONT_PATHS: {
    "Fira Code": ["/Users/alex/Library/Fonts/FiraCode-Regular.ttf"],
  },
  GENERATE_DEBUG_IMAGES: true,
  GENERATE_COMPOSITE_DEBUG_IMAGE: true,
  ALPHABETS: [Alphabet.ASCII],
  PICK_MOST_DISTINCT: null,
  BLUR_RADIUS: 0,
};
