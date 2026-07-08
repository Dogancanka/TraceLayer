import type { Anchor, ImageItem } from './types';

export interface Point {
  x: number;
  y: number;
}

/**
 * Coordinate mapping for anchored annotations (see Anchor in types.ts).
 *
 * Sheet-anchored points ARE window-center coordinates — both functions are
 * identity for them. Image-anchored points live in the image's local space
 * (relative to the image center, before scale/rotation); mapping applies the
 * image's transform in the same order ImageView's CSS does:
 * translate → rotate → scale.
 *
 * If an image anchor points at an image that no longer exists, the point is
 * treated as sheet-anchored so nothing crashes — but deletion paths should
 * re-anchor affected annotations explicitly (see detachAnnotationsFromImage
 * in App.tsx) so positions don't jump.
 */

/** Anchor-space → window-center coordinates. */
export function anchorToScreen(point: Point, anchor: Anchor, images: ImageItem[]): Point {
  if (anchor.kind === 'image') {
    const img = images.find((i) => i.id === anchor.imageId);
    if (img) {
      const rad = (img.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      return {
        x: img.x + img.scale * (cos * point.x - sin * point.y),
        y: img.y + img.scale * (sin * point.x + cos * point.y),
      };
    }
  }
  return point;
}

/** Window-center coordinates → anchor space (inverse of anchorToScreen). */
export function screenToAnchor(point: Point, anchor: Anchor, images: ImageItem[]): Point {
  if (anchor.kind === 'image') {
    const img = images.find((i) => i.id === anchor.imageId);
    if (img && img.scale !== 0) {
      const rad = (img.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = (point.x - img.x) / img.scale;
      const dy = (point.y - img.y) / img.scale;
      return { x: cos * dx + sin * dy, y: -sin * dx + cos * dy };
    }
  }
  return point;
}
