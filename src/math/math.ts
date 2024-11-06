type IVector2 = { x: number; y: number } | [number, number];

function parseVec2(vec: IVector2) {
  if (Array.isArray(vec)) return { x: vec[0], y: vec[1] };
  return { x: vec.x, y: vec.y };
}

export function distance(p1: IVector2, p2: IVector2) {
  p1 = parseVec2(p1);
  p2 = parseVec2(p2);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function manhattanDistance(p1: IVector2, p2: IVector2) {
  p1 = parseVec2(p1);
  p2 = parseVec2(p2);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.abs(dx) + Math.abs(dy);
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
