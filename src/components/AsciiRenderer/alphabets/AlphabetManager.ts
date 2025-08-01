import defaultAlphabet from "./default.json";
import denseAlphabet from "./dense.json";
import programmingAlphabet from "./programming.json";

const alphabets = {
  default: defaultAlphabet,
  dense: denseAlphabet,
  programming: programmingAlphabet,
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
