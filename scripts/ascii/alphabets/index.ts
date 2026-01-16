import { ASCII_CHARS } from "./ascii";
import { ASCII_SHORT_CHARS } from "./ascii-short";

export enum Alphabet {
  ASCII = "ascii",
  ASCII_SHORT = "ascii_short",
}

export const ALPHABET_SETS: Record<Alphabet, string[]> = {
  [Alphabet.ASCII]: ASCII_CHARS,
  [Alphabet.ASCII_SHORT]: ASCII_SHORT_CHARS,
};

export function combineAlphabets(alphabets: Alphabet[]): string[] {
  return [...new Set(alphabets.flatMap((alphabet) => ALPHABET_SETS[alphabet]))];
}
