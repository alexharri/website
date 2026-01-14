import { alphabets, AlphabetName } from "./alphabets";

export function getAvailableAlphabets(): AlphabetName[] {
  return Object.keys(alphabets) as AlphabetName[];
}

export function getAlphabetCharacterVectors(name: AlphabetName) {
  return alphabets[name].characters;
}

export function getAlphabetMetadata(name: AlphabetName) {
  return alphabets[name].metadata;
}

const characterVectorMapsByAlphabet = {} as Record<AlphabetName, Record<string, number[]>>;

for (const [alphabet, { characters }] of Object.entries(alphabets)) {
  const map: Record<string, number[]> = {};
  for (const { char, vector } of characters) {
    map[char] = vector;
  }
  characterVectorMapsByAlphabet[alphabet as AlphabetName] = map;
}

export function getCharacterVector(char: string, alphabet: AlphabetName): number[] {
  const map = characterVectorMapsByAlphabet[alphabet];
  return map[char] ?? map[" "];
}
