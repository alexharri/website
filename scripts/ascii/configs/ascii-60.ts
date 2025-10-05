import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const ascii60Config: Config = {
  name: "ascii-60",
  SAMPLING_CONFIG: {
    gridRows: 3,
    gridCols: 2,
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
