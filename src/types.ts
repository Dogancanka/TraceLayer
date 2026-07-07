/** Active interaction tool. 'select' = move/scale/rotate images. */
export type Tool = 'select' | 'pen' | 'eraser';

export const DEFAULT_STROKE_COLOR = '#3a3630';
export const DEFAULT_STROKE_WIDTH = 2;

/** One pen stroke. Flat [x0, y0, x1, y1, …] list, window-center-relative px. */
export interface Stroke {
  id: string;
  points: number[];
  /** CSS color. */
  color: string;
  /** Stroke width in px. */
  width: number;
}

/** One sheet of tracing paper in the stack. */
export interface PaperSheet {
  id: string;
  /** Small random rotation (degrees) so stacked sheets read as physical paper. */
  tilt: number;
  /** Pen strokes drawn on this sheet. */
  strokes: Stroke[];
}

/** An imported PNG/JPG with its transform, relative to the window center. */
export interface ImageItem {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  scale: number;
  /** Degrees. */
  rotation: number;
  /** Per-image opacity, 0.05–1 (multiplies with the global paper opacity). */
  opacity: number;
  /**
   * The sheet this image sits on. Sheets and their images render
   * interleaved, so a newer sheet covers older sheets' images.
   */
  paperId: string;
}

/**
 * Drawing scale (målestok) calibration. Currently a UI placeholder: only
 * `drawingScale` is set (via presets like "1:100"). Future calibration
 * ("mark two points, enter real distance") should fill `unit`,
 * `pixelsPerUnit`, and `calibrationPoints` — the fields are reserved so the
 * file format will not need to change.
 */
export interface ScaleCalibration {
  /** Real-world unit, e.g. 'mm' | 'cm' | 'm'. Null = uncalibrated. */
  unit: string | null;
  /** Nominal drawing scale label, e.g. '1:100'. Null = uncalibrated. */
  drawingScale: string | null;
  /** Screen pixels per real-world unit. Null until measured calibration. */
  pixelsPerUnit: number | null;
  /** Window-center-relative points picked during calibration. */
  calibrationPoints: { x: number; y: number }[];
}

export const uncalibratedScale = (): ScaleCalibration => ({
  unit: null,
  drawingScale: null,
  pixelsPerUnit: null,
  calibrationPoints: [],
});

/**
 * Reserved for future multi-page document (PDF) support. Not populated yet —
 * the toolbar's page controller is a disabled 1/1 placeholder. When
 * implementing: render each page to an image and reuse the existing
 * ImageItem pipeline; `pageImageIds` reference ImageItem ids so transforms
 * keep working unchanged.
 */
export interface DocumentPages {
  currentPage: number;
  pageCount: number;
  pageImageIds: string[];
}

/** On-disk project format (saved as .tracelayer.json). */
export interface ProjectFile {
  version: 1;
  opacity: number;
  papers: PaperSheet[];
  images: ImageItem[];
  /** Drawing scale (målestok); absent in older files. */
  scale?: ScaleCalibration;
  /** Optional, reserved for future PDF pages. Absent in current files. */
  pages?: DocumentPages;
}

let idCounter = 0;
export const nextId = (): string =>
  `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

/**
 * Fill in fields that older project files (still version 1) may lack, so
 * loading stays backwards compatible. Images without a paperId land on the
 * top sheet, where they remain interactive.
 */
export function normalizeProject(project: ProjectFile): ProjectFile {
  const rawPapers =
    project.papers.length > 0 ? project.papers : [{ id: nextId(), tilt: 0, strokes: [] }];
  const papers = rawPapers.map((paper) => ({
    ...paper,
    strokes: (paper.strokes ?? []).map((stroke) => ({
      ...stroke,
      color: stroke.color ?? DEFAULT_STROKE_COLOR,
      width: stroke.width ?? DEFAULT_STROKE_WIDTH,
    })),
  }));
  const topPaperId = papers[papers.length - 1].id;
  return {
    ...project,
    papers,
    images: project.images.map((img) => ({
      ...img,
      opacity: img.opacity ?? 1,
      paperId: img.paperId ?? topPaperId,
    })),
    scale: project.scale ?? uncalibratedScale(),
  };
}
