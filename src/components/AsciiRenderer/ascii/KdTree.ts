export interface KdTreeNode<T> {
  vector: number[];
  data: T;
  left?: KdTreeNode<T>;
  right?: KdTreeNode<T>;
  axis: number;
}

export class KdTree<T> {
  private root: KdTreeNode<T> | undefined;
  private dimensions: number;

  constructor(vectors: Array<{ vector: number[]; data: T }>) {
    if (vectors.length === 0) {
      throw new Error("Cannot create K-d tree with empty vectors array");
    }

    this.dimensions = vectors[0].vector.length;
    this.root = this.buildTree(vectors, 0);
  }

  private buildTree(
    vectors: Array<{ vector: number[]; data: T }>,
    depth: number,
  ): KdTreeNode<T> | undefined {
    if (vectors.length === 0) return undefined;
    if (vectors.length === 1) {
      return {
        vector: vectors[0].vector,
        data: vectors[0].data,
        axis: depth % this.dimensions,
      };
    }

    const axis = depth % this.dimensions;

    // Sort vectors by the current axis
    vectors.sort((a, b) => a.vector[axis] - b.vector[axis]);

    const medianIndex = Math.floor(vectors.length / 2);
    const median = vectors[medianIndex];

    return {
      vector: median.vector,
      data: median.data,
      axis,
      left: this.buildTree(vectors.slice(0, medianIndex), depth + 1),
      right: this.buildTree(vectors.slice(medianIndex + 1), depth + 1),
    };
  }

  private distance(vector1: number[], vector2: number[]): number {
    let sum = 0;
    for (let i = 0; i < this.dimensions; i++) {
      const diff = vector1[i] - vector2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  findNearest(target: number[]): { vector: number[]; data: T; distance: number } | null {
    if (!this.root) return null;

    let best: { node: KdTreeNode<T>; distance: number } | null = null;

    const search = (node: KdTreeNode<T> | undefined, depth: number): void => {
      if (!node) return;

      const distance = this.distance(target, node.vector);

      if (!best || distance < best.distance) {
        best = { node, distance };
      }

      const axis = depth % this.dimensions;
      const diff = target[axis] - node.vector[axis];

      // Choose which side to search first
      const primarySide = diff < 0 ? node.left : node.right;
      const secondarySide = diff < 0 ? node.right : node.left;

      // Search the primary side
      search(primarySide, depth + 1);

      // Check if we need to search the other side
      // Only search if the distance to the splitting plane is less than our best distance
      if (!best || Math.abs(diff) < best.distance) {
        search(secondarySide, depth + 1);
      }
    };

    search(this.root, 0);

    return best
      ? {
          vector: best.node.vector,
          data: best.node.data,
          distance: best.distance,
        }
      : null;
  }
}
