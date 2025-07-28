export interface KdTreeNode<T> {
  point: number[];
  data: T;
  left?: KdTreeNode<T>;
  right?: KdTreeNode<T>;
  axis: number;
}

export class KdTree<T> {
  private root: KdTreeNode<T> | undefined;
  private dimensions: number;

  constructor(points: Array<{ point: number[]; data: T }>) {
    if (points.length === 0) {
      throw new Error("Cannot create K-d tree with empty points array");
    }
    
    this.dimensions = points[0].point.length;
    this.root = this.buildTree(points, 0);
  }

  private buildTree(points: Array<{ point: number[]; data: T }>, depth: number): KdTreeNode<T> | undefined {
    if (points.length === 0) return undefined;
    if (points.length === 1) {
      return {
        point: points[0].point,
        data: points[0].data,
        axis: depth % this.dimensions,
      };
    }

    const axis = depth % this.dimensions;
    
    // Sort points by the current axis
    points.sort((a, b) => a.point[axis] - b.point[axis]);
    
    const medianIndex = Math.floor(points.length / 2);
    const median = points[medianIndex];
    
    return {
      point: median.point,
      data: median.data,
      axis,
      left: this.buildTree(points.slice(0, medianIndex), depth + 1),
      right: this.buildTree(points.slice(medianIndex + 1), depth + 1),
    };
  }

  private distance(point1: number[], point2: number[]): number {
    let sum = 0;
    for (let i = 0; i < this.dimensions; i++) {
      const diff = point1[i] - point2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  findNearest(target: number[]): { point: number[]; data: T; distance: number } | null {
    if (!this.root) return null;
    
    let best: { node: KdTreeNode<T>; distance: number } | null = null;
    
    const search = (node: KdTreeNode<T> | undefined, depth: number): void => {
      if (!node) return;
      
      const distance = this.distance(target, node.point);
      
      if (!best || distance < best.distance) {
        best = { node, distance };
      }
      
      const axis = depth % this.dimensions;
      const diff = target[axis] - node.point[axis];
      
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
    
    return best ? {
      point: best.node.point,
      data: best.node.data,
      distance: best.distance,
    } : null;
  }
}