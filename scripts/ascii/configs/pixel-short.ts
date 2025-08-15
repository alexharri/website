import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const pixelShortConfig: Config = {
  name: "pixel-short",
  SAMPLING_CONFIG: {
    points: [{ x: 0.5, y: 0.5 }],
    circleRadius: 40,
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
  ALPHABETS: [Alphabet.ASCII_SHORT],
  PICK_MOST_DISTINCT: null,
  BLUR_RADIUS: 0,
};
