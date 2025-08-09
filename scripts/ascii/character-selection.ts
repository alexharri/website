/**
 * Algorithms for selecting the most distinct characters from a set of character vectors.
 * Provides both optimal and approximate solutions depending on the problem size.
 */

export class CharacterSelector {
  /**
   * Select the most distinct characters from a set of character vectors.
   * Uses optimal brute force for small sets, extremes-first algorithm for larger sets.
   */
  static selectMostDistinctCharacters(
    vectors: number[][],
    chars: string[],
    maxCount: number,
  ): { vectors: number[][]; chars: string[] } {
    if (vectors.length <= maxCount) {
      return { vectors, chars };
    }

    console.log(
      `Selecting ${maxCount} most distinct characters from ${vectors.length} candidates...`,
    );

    const n = vectors.length;
    
    // For small sets, use brute force optimal solution
    if (n <= 20 && maxCount <= 10) {
      return this.selectOptimalBruteForce(vectors, chars, maxCount);
    }
    
    // For larger sets, use extremes-first algorithm
    return this.selectUsingExtremes(vectors, chars, maxCount);
  }

  /**
   * Brute force optimal solution for small sets.
   * Finds the subset that maximizes the minimum pairwise distance.
   */
  private static selectOptimalBruteForce(
    vectors: number[][],
    chars: string[],
    maxCount: number,
  ): { vectors: number[][]; chars: string[] } {
    console.log(`Using optimal brute force for small set...`);
    
    const n = vectors.length;
    let bestSubset: number[] = [];
    let bestMinDistance = -1;

    // Try all combinations
    const combinations = this.generateCombinations(n, maxCount);
    console.log(`Evaluating ${combinations.length} combinations...`);
    
    for (const subset of combinations) {
      let minDistance = Infinity;
      for (let i = 0; i < subset.length; i++) {
        for (let j = i + 1; j < subset.length; j++) {
          const dist = this.euclideanDistance(vectors[subset[i]], vectors[subset[j]]);
          minDistance = Math.min(minDistance, dist);
        }
      }
      
      if (minDistance > bestMinDistance) {
        bestMinDistance = minDistance;
        bestSubset = subset;
      }
    }

    const selectedVectors = bestSubset.map(i => vectors[i]);
    const selectedChars = bestSubset.map(i => chars[i]);
    
    console.log(`Optimal selection with min distance ${bestMinDistance.toFixed(4)}`);
    return { vectors: selectedVectors, chars: selectedChars };
  }

  /**
   * Extremes-first algorithm for larger sets.
   * Prioritizes characters with extreme values to capture different visual shapes.
   */
  private static selectUsingExtremes(
    vectors: number[][],
    chars: string[],
    maxCount: number,
  ): { vectors: number[][]; chars: string[] } {
    console.log(`Using extremes-first algorithm to capture diverse visual shapes...`);
    
    const n = vectors.length;
    const dimensions = vectors[0].length;
    const selected: number[] = [];
    const used = new Set<number>();
    
    // Step 1: Find characters with extreme values in each dimension
    console.log(`Finding extremes across ${dimensions} dimensions...`);
    
    for (let dim = 0; dim < dimensions && selected.length < maxCount; dim++) {
      // Find minimum and maximum in this dimension
      let minIdx = -1, maxIdx = -1;
      let minVal = Infinity, maxVal = -Infinity;
      
      for (let i = 0; i < n; i++) {
        if (used.has(i)) continue;
        
        const val = vectors[i][dim];
        if (val < minVal) {
          minVal = val;
          minIdx = i;
        }
        if (val > maxVal) {
          maxVal = val;
          maxIdx = i;
        }
      }
      
      // Add minimum if not already selected and not too similar to existing selections
      if (minIdx !== -1 && !used.has(minIdx) && selected.length < maxCount) {
        const isSimilar = this.isSimilarToSelected(vectors, minIdx, selected, 0.3); // threshold for similarity
        if (!isSimilar || selected.length === 0) {
          selected.push(minIdx);
          used.add(minIdx);
          console.log(`  Extreme min dim ${dim}: '${chars[minIdx]}' (${minVal.toFixed(3)})`);
        } else {
          console.log(`  Skipped similar min dim ${dim}: '${chars[minIdx]}' (${minVal.toFixed(3)})`);
        }
      }
      
      // Add maximum if different and not already selected and not too similar
      if (maxIdx !== -1 && !used.has(maxIdx) && selected.length < maxCount) {
        const isSimilar = this.isSimilarToSelected(vectors, maxIdx, selected, 0.3);
        if (!isSimilar || selected.length === 0) {
          selected.push(maxIdx);
          used.add(maxIdx);
          console.log(`  Extreme max dim ${dim}: '${chars[maxIdx]}' (${maxVal.toFixed(3)})`);
        } else {
          console.log(`  Skipped similar max dim ${dim}: '${chars[maxIdx]}' (${maxVal.toFixed(3)})`);
        }
      }
    }
    
    // Step 2: Add characters with interesting patterns (high variance across dimensions)
    console.log(`Finding characters with interesting patterns...`);
    
    const candidates: { index: number; variance: number; range: number }[] = [];
    for (let i = 0; i < n; i++) {
      if (used.has(i)) continue;
      
      const vector = vectors[i];
      const mean = vector.reduce((sum, val) => sum + val, 0) / vector.length;
      const variance = vector.reduce((sum, val) => sum + (val - mean) ** 2, 0) / vector.length;
      const range = Math.max(...vector) - Math.min(...vector);
      
      candidates.push({ index: i, variance, range });
    }
    
    // Sort by variance (high variance = interesting patterns)
    candidates.sort((a, b) => b.variance - a.variance);
    
    // Add high-variance characters that aren't too similar to existing selections
    for (const candidate of candidates) {
      if (selected.length >= maxCount) break;
      
      const isSimilar = this.isSimilarToSelected(vectors, candidate.index, selected, 0.4); // slightly higher threshold
      if (!isSimilar) {
        selected.push(candidate.index);
        used.add(candidate.index);
        console.log(`  High variance: '${chars[candidate.index]}' (variance: ${candidate.variance.toFixed(3)})`);
      } else {
        console.log(`  Skipped similar variance: '${chars[candidate.index]}' (variance: ${candidate.variance.toFixed(3)})`);
      }
    }
    
    // Step 3: Fill remaining slots with maximally distant characters
    console.log(`Filling remaining slots with distant characters...`);
    
    while (selected.length < maxCount) {
      let bestIdx = -1;
      let maxMinDistance = -1;
      
      for (let i = 0; i < n; i++) {
        if (used.has(i)) continue;
        
        // Find minimum distance to any selected character
        let minDistance = Infinity;
        for (const selectedIdx of selected) {
          const dist = this.euclideanDistance(vectors[i], vectors[selectedIdx]);
          minDistance = Math.min(minDistance, dist);
        }
        
        if (minDistance > maxMinDistance) {
          maxMinDistance = minDistance;
          bestIdx = i;
        }
      }
      
      if (bestIdx === -1) break; // No more candidates
      
      selected.push(bestIdx);
      used.add(bestIdx);
      console.log(`  Max distance: '${chars[bestIdx]}' (min dist: ${maxMinDistance.toFixed(3)})`);
    }
    
    const selectedVectors = selected.map(i => vectors[i]);
    const selectedChars = selected.map(i => chars[i]);
    
    console.log(`Selected ${selected.length} characters with diverse visual shapes`);
    return { vectors: selectedVectors, chars: selectedChars };
  }

  /**
   * Generate all combinations of k elements from n elements.
   */
  private static generateCombinations(n: number, k: number): number[][] {
    const result: number[][] = [];
    
    function backtrack(start: number, current: number[]) {
      if (current.length === k) {
        result.push([...current]);
        return;
      }
      
      for (let i = start; i <= n - (k - current.length); i++) {
        current.push(i);
        backtrack(i + 1, current);
        current.pop();
      }
    }
    
    backtrack(0, []);
    return result;
  }

  /**
   * Check if a candidate character is too similar to already selected characters.
   */
  private static isSimilarToSelected(
    vectors: number[][],
    candidateIdx: number,
    selectedIndices: number[],
    threshold: number
  ): boolean {
    if (selectedIndices.length === 0) return false;
    
    const candidateVector = vectors[candidateIdx];
    
    for (const selectedIdx of selectedIndices) {
      const selectedVector = vectors[selectedIdx];
      const distance = this.euclideanDistance(candidateVector, selectedVector);
      
      if (distance < threshold) {
        return true; // Too similar
      }
    }
    
    return false; // Not similar to any selected character
  }

  /**
   * Calculate Euclidean distance between two vectors.
   */
  private static euclideanDistance(v1: number[], v2: number[]): number {
    return Math.sqrt(v1.reduce((sum, val, i) => sum + (val - v2[i]) ** 2, 0));
  }
}