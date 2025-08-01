import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const programmingConfig: Config = {
  name: "programming",
  SAMPLING_CONFIG: {
    // Fine-tuned sampling for programming symbols
    // prettier-ignore
    points: [
      { x: 0.25, y: 0.2 }, // top-left
      { x: 0.75, y: 0.2 }, // top-right
      { x: 0.15, y: 0.5 }, // mid-left
      { x: 0.5, y: 0.5 }, // center
      { x: 0.85, y: 0.5 }, // mid-right
      { x: 0.25, y: 0.8 }, // bottom-left
      { x: 0.75, y: 0.8 }, // bottom-right
      { x: 0.5, y: 0.3 }, // upper-center
    ],
    // prettier-ignore
    externalPoints: [
      { x: -0.25, y: -0.2 }, { x: 1.25, y: -0.2 },
      { x: -0.15, y: 0.5 }, { x: 1.15, y: 0.5 },
      { x: -0.25, y: 1.2 }, { x: 1.25, y: 1.2 },
      { x: 0.5, y: -0.3 }, { x: 0.5, y: 1.3 },
    ],
    circleRadius: 12.0,
  },
  CANVAS_WIDTH: 48,
  CANVAS_HEIGHT: 64,
  FONT_FAMILY: "Fira Code",
  FONT_SIZE: 48,
  CUSTOM_FONT_PATHS: {
    "Fira Code": ["/Users/alex/Library/Fonts/FiraCode-Regular.ttf"],
  },
  GENERATE_DEBUG_IMAGES: false, // Skip debug images for speed
  GENERATE_COMPOSITE_DEBUG_IMAGE: false,
  ALPHABETS: [Alphabet.ASCII, Alphabet.PROGRAMMING, Alphabet.SYMBOLS],
  MAX_CHARACTERS: 80,
  BLUR_RADIUS: 0,
};
