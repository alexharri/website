import { Config } from "../types";
import { Alphabet } from "../alphabets";

export const denseConfig: Config = {
  name: "dense",
  SAMPLING_CONFIG: {
    // More sampling points for denser character selection
    // prettier-ignore
    points: [
      { x: 0.2, y: 0.15 }, // top-left
      { x: 0.5, y: 0.15 }, // top-center  
      { x: 0.8, y: 0.15 }, // top-right
      { x: 0.2, y: 0.4 }, // mid-left
      { x: 0.5, y: 0.4 }, // mid-center
      { x: 0.8, y: 0.4 }, // mid-right
      { x: 0.2, y: 0.6 }, // mid-left-lower
      { x: 0.5, y: 0.6 }, // mid-center-lower
      { x: 0.8, y: 0.6 }, // mid-right-lower
      { x: 0.2, y: 0.85 }, // bottom-left
      { x: 0.5, y: 0.85 }, // bottom-center
      { x: 0.8, y: 0.85 }, // bottom-right
    ],
    // prettier-ignore
    externalPoints: [
      { x: -0.2, y: -0.15 }, { x: 0.5, y: -0.15 }, { x: 1.2, y: -0.15 },
      { x: -0.2, y: 0.4 }, { x: 0.5, y: 0.4 }, { x: 1.2, y: 0.4 },
      { x: -0.2, y: 0.6 }, { x: 0.5, y: 0.6 }, { x: 1.2, y: 0.6 },
      { x: -0.2, y: 1.15 }, { x: 0.5, y: 1.15 }, { x: 1.2, y: 1.15 },
    ],
    circleRadius: 10.0, // Smaller radius for more precision
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
  ALPHABETS: [Alphabet.ALL], // Use all available characters
  MAX_CHARACTERS: 150, // Limit to most distinct characters
  BLUR_RADIUS: 0,
};
