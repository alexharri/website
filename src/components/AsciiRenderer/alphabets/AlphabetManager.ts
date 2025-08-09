import defaultAlphabet from "./default.json";
import programmingAlphabet from "./programming.json";
import pixelAlphabet from "./pixel.json";
import pixelShortAlphabet from "./pixel-short.json";

const alphabets = {
  default: defaultAlphabet,
  programming: programmingAlphabet,
  pixel: pixelAlphabet,
  "pixel-short": pixelShortAlphabet,
} as const;

export type AlphabetName = keyof typeof alphabets;

export function getAvailableAlphabets(): AlphabetName[] {
  return Object.keys(alphabets) as AlphabetName[];
}

export function getAlphabetCharacterVectors(name: AlphabetName) {
  return alphabets[name].characters;
}

export function getAlphabetMetadata(name: AlphabetName) {
  return alphabets[name].metadata;
}
