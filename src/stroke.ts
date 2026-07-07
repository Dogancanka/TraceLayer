import type { Stroke } from './types';

/**
 * SVG path through a flat [x0, y0, x1, y1, …] point list, smoothed by
 * drawing quadratic curves through segment midpoints.
 */
export function strokePath(points: number[]): string {
  const n = points.length / 2;
  if (n === 0) return '';
  const x0 = points[0];
  const y0 = points[1];
  if (n === 1) return `M ${x0} ${y0} l 0.01 0`; // a dot
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < n - 1; i++) {
    const x = points[2 * i];
    const y = points[2 * i + 1];
    const mx = (x + points[2 * i + 2]) / 2;
    const my = (y + points[2 * i + 3]) / 2;
    d += ` Q ${x} ${y} ${mx} ${my}`;
  }
  d += ` L ${points[2 * n - 2]} ${points[2 * n - 1]}`;
  return d;
}

/** True if (x, y) lies within `radius` px of any segment of the stroke. */
export function strokeHit(stroke: Stroke, x: number, y: number, radius: number): boolean {
  const pts = stroke.points;
  const n = pts.length / 2;
  const r2 = radius * radius;
  if (n === 1) {
    const dx = x - pts[0];
    const dy = y - pts[1];
    return dx * dx + dy * dy <= r2;
  }
  for (let i = 0; i < n - 1; i++) {
    const ax = pts[2 * i];
    const ay = pts[2 * i + 1];
    const abx = pts[2 * i + 2] - ax;
    const aby = pts[2 * i + 3] - ay;
    const len2 = abx * abx + aby * aby;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - ax) * abx + (y - ay) * aby) / len2));
    const dx = x - (ax + t * abx);
    const dy = y - (ay + t * aby);
    if (dx * dx + dy * dy <= r2) return true;
  }
  return false;
}
