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
  fontSize: number; // always 1 (relative to font size)
  width: number; // character width relative to font size
  height: number; // character height relative to font size
}

export class CharacterMatcher {
  private kdTree!: KdTree<string>;
  private samplingConfig!: SamplingConfig;
  private metadata!: AlphabetMetadata;
  private currentAlphabet: AlphabetName = "default";

  constructor() {
    // Load default alphabet synchronously
    this.loadAlphabet("default");
  }

  loadAlphabet(alphabet: AlphabetName): void {
    // Get alphabet data
    const characterVectors = getAlphabetCharacterVectors(alphabet);
    const metadata = getAlphabetMetadata(alphabet);

    this.kdTree = new KdTree(characterVectors.map(({ vector, char }) => ({ vector, data: char })));
    this.currentAlphabet = alphabet;
    this.metadata = metadata;
    this.samplingConfig = metadata.samplingConfig;

    console.log(`✓ Loaded alphabet: ${alphabet}`);
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

  switchAlphabet(name: AlphabetName): void {
    if (name !== this.currentAlphabet) {
      this.loadAlphabet(name);
    }
  }
}
