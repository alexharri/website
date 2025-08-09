import { SamplingConfig } from "./ascii-renderer";
import { Alphabet } from "./alphabets";

export interface Config {
  name: string;
  SAMPLING_CONFIG: SamplingConfig;
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;
  FONT_FAMILY: string;
  FONT_SIZE: number;
  CUSTOM_FONT_PATHS: { [key: string]: string[] };
  GENERATE_DEBUG_IMAGES: boolean;
  GENERATE_COMPOSITE_DEBUG_IMAGE: boolean;
  ALPHABETS: Alphabet[];
  CUSTOM_CHARACTERS?: string; // Optional custom character set
  MAX_CHARACTERS: number | null;
  BLUR_RADIUS: number;
}

export interface CharacterVector {
  char: string;
  vector: number[];
}
