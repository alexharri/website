import { KdTree } from "./KdTree";
import {
  AlphabetName,
  getAlphabetCharacterVectors,
  getAlphabetMetadata,
} from "../alphabets/AlphabetManager";

export interface CharacterData {
  char: string;
  vector: number[];
}

export interface SamplingPoint {
  x: number;
  y: number;
}

export interface SamplingConfig {
  points: SamplingPoint[];
  externalPoints?: SamplingPoint[];
  circleRadius: number;
}

export interface AlphabetMetadata {
  samplingConfig: SamplingConfig;
  fontSize: number;
  width: number;
  height: number;
}

type Effect = (vectors: number[][]) => void;

export class CharacterMatcher {
  private kdTree!: KdTree<string>;
  private samplingConfig!: SamplingConfig;
  private metadata!: AlphabetMetadata;
  private currentAlphabet: AlphabetName = "default";
  private characters: {
    data: string;
    vector: number[];
  }[] = [];

  constructor() {}

  loadAlphabet(alphabet: AlphabetName, effects: Effect[]): void {
    const characterVectors = getAlphabetCharacterVectors(alphabet);
    const metadata = getAlphabetMetadata(alphabet);

    const vectors = characterVectors.map(({ vector }) => [...vector]);
    for (const effect of effects) {
      effect(vectors);
    }

    this.characters = characterVectors.map(({ char }, i) => ({ vector: vectors[i], data: char }));
    this.kdTree = new KdTree(this.characters);
    this.currentAlphabet = alphabet;
    this.metadata = metadata;
    this.samplingConfig = metadata.samplingConfig;
  }

  public cache = new Map<number, string>();

  findBestCharacter(samplingVector: number[]): string {
    const result = this.kdTree.findNearest(samplingVector);
    return result ? result.data : " ";
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

  // Here for performance comparison
  findBestCharacterBruteForce(samplingVector: number[]): string {
    let best = "";
    let bestDistance = Infinity;
    for (const item of this.characters) {
      const dist = euclideanDistanceSquared(item.vector, samplingVector);
      if (dist < bestDistance) {
        bestDistance = dist;
        best = item.data;
      }
    }
    return best;
  }

  getSamplingConfig(): SamplingConfig {
    return this.samplingConfig;
  }

  getMetadata(): AlphabetMetadata {
    return this.metadata;
  }

  getCurrentAlphabet(): AlphabetName {
    return this.currentAlphabet;
  }
}

function euclideanDistanceSquared(a: number[], b: number[]): number {
  let sumSquared = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sumSquared += diff * diff;
  }

  return sumSquared;
}

function quantizeToKey(vector: number[]): number {
  let key = 0;
  for (let i = 0; i < vector.length; i++) {
    // Assuming vector values are in [0, 1] range
    const quantized = Math.floor(vector[i] * 7.9999999); // 0-7 (avoid hitting 8)
    key = (key << 3) | quantized; // 3 bits per dimension
  }
  return key;
}
