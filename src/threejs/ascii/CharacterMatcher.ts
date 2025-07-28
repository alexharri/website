import { KdTree } from './KdTree';
import asciiSamplingResults from './ascii-sampling-results.json';

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
  circleRadius: number;
}

export class CharacterMatcher {
  private kdTree: KdTree<string>;
  private samplingConfig: SamplingConfig;

  constructor() {
    // Build K-d tree from the sampling results
    const points = asciiSamplingResults.characters.map(char => ({
      point: char.vector,
      data: char.char,
    }));
    
    this.kdTree = new KdTree(points);
    this.samplingConfig = asciiSamplingResults.metadata.samplingConfig;
  }

  findBestCharacter(samplingVector: number[]): string {
    const result = this.kdTree.findNearest(samplingVector);
    return result ? result.data : ' ';
  }

  getSamplingConfig(): SamplingConfig {
    return this.samplingConfig;
  }
}