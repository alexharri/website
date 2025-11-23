import path from "path";
import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const twoSamplesConfig: Config = {
  name: "two-samples",
  SAMPLING_CONFIG: {
    points: [
      { x: 0.5, y: 0.27 },
      { x: 0.5, y: 0.73 },
    ],
    circleRadius: 13.8,
  },
  FONT_SIZE: 48,
  CANVAS_WIDTH: 40,
  CANVAS_HEIGHT: 64,
  FONT_FAMILY: "Fira Code",
  CUSTOM_FONT_PATHS: {
    "Fira Code": [path.resolve("../../public/fonts/FiraCode-Regular.ttf")],
  },
  GENERATE_DEBUG_IMAGES: true,
  GENERATE_COMPOSITE_DEBUG_IMAGE: true,
  ALPHABETS: [Alphabet.ASCII],
  PICK_MOST_DISTINCT: null,
  BLUR_RADIUS: 0,
};
