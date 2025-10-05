import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const programmingConfig: Config = {
  name: "programming",
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
  GENERATE_DEBUG_IMAGES: false,
  GENERATE_COMPOSITE_DEBUG_IMAGE: false,
  ALPHABETS: [Alphabet.ASCII, Alphabet.PROGRAMMING, Alphabet.SYMBOLS],
  PICK_MOST_DISTINCT: 80,
  BLUR_RADIUS: 0,
};
