import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const denseConfig: Config = {
  name: "dense",
  SAMPLING_CONFIG: {
    points: [
      { x: 0.2, y: 0.15 },
      { x: 0.5, y: 0.15 },
      { x: 0.8, y: 0.15 },
      { x: 0.2, y: 0.4 },
      { x: 0.5, y: 0.4 },
      { x: 0.8, y: 0.4 },
      { x: 0.2, y: 0.6 },
      { x: 0.5, y: 0.6 },
      { x: 0.8, y: 0.6 },
      { x: 0.2, y: 0.85 },
      { x: 0.5, y: 0.85 },
      { x: 0.8, y: 0.85 },
    ],
    externalPoints: [
      { x: -0.2, y: -0.15 },
      { x: 0.5, y: -0.15 },
      { x: 1.2, y: -0.15 },
      { x: -0.2, y: 0.4 },
      { x: 0.5, y: 0.4 },
      { x: 1.2, y: 0.4 },
      { x: -0.2, y: 0.6 },
      { x: 0.5, y: 0.6 },
      { x: 1.2, y: 0.6 },
      { x: -0.2, y: 1.15 },
      { x: 0.5, y: 1.15 },
      { x: 1.2, y: 1.15 },
    ],
    circleRadius: 10.0,
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
  ALPHABETS: [Alphabet.ALL],
  MAX_CHARACTERS: 150,
  BLUR_RADIUS: 0,
};
