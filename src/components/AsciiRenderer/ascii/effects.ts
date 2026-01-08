export const EFFECTS = {
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
};
