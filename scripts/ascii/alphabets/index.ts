import { ASCII_CHARS } from "./ascii";
import { GREEK_CHARS } from "./greek";
import { CYRILLIC_CHARS } from "./cyrillic";
import { SYMBOL_CHARS } from "./symbols";
import { EXTENDED_LATIN_CHARS } from "./extended-latin";
import { PROGRAMMING_CHARS } from "./programming";

export enum Alphabet {
  ASCII = "ascii",
  GREEK = "greek",
  CYRILLIC = "cyrillic",
  SYMBOLS = "symbols",
  EXTENDED_LATIN = "extended_latin",
  PROGRAMMING = "programming",
  ALL = "all",
}

export const ALPHABET_SETS: Record<Alphabet, string[]> = {
  [Alphabet.ASCII]: ASCII_CHARS,
  [Alphabet.GREEK]: GREEK_CHARS,
  [Alphabet.CYRILLIC]: CYRILLIC_CHARS,
  [Alphabet.SYMBOLS]: SYMBOL_CHARS,
  [Alphabet.EXTENDED_LATIN]: EXTENDED_LATIN_CHARS,
  [Alphabet.PROGRAMMING]: PROGRAMMING_CHARS,
  [Alphabet.ALL]: [],
};

export function combineAlphabets(alphabets: Alphabet[]): string[] {
  // Handle "all" shortcut
  if (alphabets.includes(Alphabet.ALL)) {
    const allAlphabets = Object.values(Alphabet).filter(
      (a) => a !== Alphabet.ALL
    ) as Alphabet[];
    return [
      ...new Set(allAlphabets.flatMap((alphabet) => ALPHABET_SETS[alphabet])),
    ];
  }

  return [...new Set(alphabets.flatMap((alphabet) => ALPHABET_SETS[alphabet]))];
}
