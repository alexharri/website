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

  constructor() {}

  loadAlphabet(alphabet: AlphabetName, effects: Effect[]): void {
    const characterVectors = getAlphabetCharacterVectors(alphabet);
    const metadata = getAlphabetMetadata(alphabet);

    const vectors = characterVectors.map(({ vector }) => [...vector]);
    for (const effect of effects) {
      effect(vectors);
    }

    this.kdTree = new KdTree(characterVectors.map(({ vector, char }) => ({ vector, data: char })));
    this.currentAlphabet = alphabet;
    this.metadata = metadata;
    this.samplingConfig = metadata.samplingConfig;
  }

  findBestCharacter(samplingVector: number[]): string {
    const result = this.kdTree.findNearest(samplingVector);
    return result ? result.data : " ";
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
