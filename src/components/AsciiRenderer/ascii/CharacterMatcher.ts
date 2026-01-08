import { KdTree } from "./KdTree";
import { AlphabetName, getAlphabetCharacterVectors } from "../alphabets/AlphabetManager";

type Effect = (vectors: number[][]) => void;

export class CharacterMatcher {
  private kdTree!: KdTree<string>;
  private cache = new Map<number, string>();

  loadAlphabet(alphabet: AlphabetName, effects: Effect[], exclude: string): void {
    const characterVectors = getAlphabetCharacterVectors(alphabet).filter(
      (vector) => !exclude.includes(vector.char),
    );

    const vectors = characterVectors.map(({ vector }) => [...vector]);
    for (const effect of effects) {
      effect(vectors);
    }

    this.kdTree = new KdTree(
      characterVectors.map(({ char }, i) => ({ vector: vectors[i], data: char })),
    );
  }

  findBestCharacter(samplingVector: number[]): string {
    return this.kdTree.findNearest(samplingVector)?.data || " ";
  }

  findBestCharacterQuantized(samplingVector: number[]): string {
    const key = quantizeToKey(samplingVector);

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const result = this.findBestCharacter(samplingVector);
    this.cache.set(key, result);
    return result;
  }
}

const BITS = 5;
const RANGE = 8;

function quantizeToKey(vector: number[]): number {
  let key = 0;
  for (let i = 0; i < vector.length; i++) {
    const quantized = Math.min(RANGE - 1, Math.floor(vector[i] * RANGE));
    key = (key << BITS) | quantized;
  }
  return key;
}
