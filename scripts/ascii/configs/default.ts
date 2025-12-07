import path from "path";
import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const defaultConfig: Config = {
  name: "default",
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
      { x: 0, y: -0.2, affects: [0, 1] },
      { x: 1, y: -0.2, affects: [0, 1] },
      { x: -0.2, y: 0, affects: [0, 2] },
      { x: 1.2, y: 0, affects: [1, 3] },
      { x: -0.2, y: 0.5, affects: [0, 2, 4] },
      { x: 1.2, y: 0.5, affects: [1, 3, 5] },
      { x: -0.2, y: 1, affects: [2, 4] },
      { x: 1.2, y: 1, affects: [3, 5] },
      { x: 0, y: 1.2, affects: [4, 5] },
      { x: 1, y: 1.2, affects: [4, 5] },
    ],
    circleRadius: 13.5,
  },
  CANVAS_WIDTH: 48,
  CANVAS_HEIGHT: 64,
  FONT_FAMILY: "Fira Code",
  FONT_SIZE: 48,
  CUSTOM_FONT_PATHS: {
    "Fira Code": [path.resolve("../../public/fonts/FiraCode-Regular.ttf")],
  },
  GENERATE_DEBUG_IMAGES: true,
  GENERATE_COMPOSITE_DEBUG_IMAGE: true,
  ALPHABETS: [Alphabet.ASCII],
  PICK_MOST_DISTINCT: null,
  BLUR_RADIUS: 0,
};
