export const EFFECTS = {
  globalNormalization(vectors: number[][]) {
    let maxValue = 0;
    for (const vector of vectors) {
      for (const v of vector) {
        maxValue = Math.max(maxValue, v);
      }
    }

    const K = vectors[0].length;
    for (const vector of vectors) {
      for (let i = 0; i < K; i++) {
        vector[i] = vector[i] / maxValue;
      }
    }
  },

  componentWiseGlobalNormalization(vectors: number[][]) {
    const K = vectors[0].length;
    const maxValues: number[] = vectors[0].map(() => 0);

    for (const vector of vectors) {
      for (let i = 0; i < K; i++) {
        maxValues[i] = Math.max(maxValues[i], vector[i]);
      }
    }

    const scalars = maxValues.map((v) => 1 / v);

    for (const vector of vectors) {
      for (let i = 0; i < K; i++) {
        vector[i] = vector[i] * scalars[i];
      }
    }
  },

  minimumMagnitude(vectors: number[][]) {
    function remap(
      value: number,
      fromMin: number,
      fromMax: number,
      toMin: number,
      toMax: number,
    ): number {
      return ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
    }

    const MIN_MAGNITUDE = 0.3;
    const REMAP_OVER = 1.5;

    for (const vector of vectors) {
      let magnitude = calcMagnitude(vector);
      if (magnitude > REMAP_OVER) continue;
      setMagnitude(vector, remap(magnitude, 0, REMAP_OVER, MIN_MAGNITUDE, REMAP_OVER));
    }
  },

  magnitude1(vectors: number[][]) {
    for (const vector of vectors) {
      setMagnitude(vector, 1);
    }
  },
};

function setMagnitude(vector: number[], targetMagnitude: number): void {
  const magnitude = calcMagnitude(vector);
  if (magnitude === 0) return;
  const scale = targetMagnitude / magnitude;
  for (let i = 0; i < vector.length; i++) {
    vector[i] *= scale;
  }
}

function calcMagnitude(vector: number[]): number {
  let sumOfSquares = 0;
  for (const component of vector) {
    sumOfSquares += component * component;
  }
  return Math.sqrt(sumOfSquares);
}
