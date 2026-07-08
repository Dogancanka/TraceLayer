/** Active interaction tool. 'select' = move/scale/rotate images. */
export type Tool = 'select' | 'pen' | 'eraser' | 'text' | 'callout';

export const DEFAULT_STROKE_COLOR = '#3a3630';
export const DEFAULT_STROKE_WIDTH = 2;
export const DEFAULT_TEXTBOX_WIDTH = 190;
export const DEFAULT_CALLOUT_COLOR = '#3a3630';
/** Default offset (px) of a new callout's bubble from its arrow target. */
export const DEFAULT_BUBBLE_OFFSET = 70;

/**
 * What an annotation's coordinates are relative to.
 * - 'sheet' (the default): window-center-relative px, like strokes/images.
 * - 'image': px in that image's local space (relative to the image's center,
 *   before its scale/rotation are applied) — the annotation follows the image
 *   when it moves/scales/rotates. See src/anchor.ts for the mapping.
 * Applies to text boxes and callouts today; future shape annotations should
 * reuse this same type.
 */
export type Anchor = { kind: 'sheet' } | { kind: 'image'; imageId: string };

export const sheetAnchor = (): Anchor => ({ kind: 'sheet' });

/** One pen stroke. Flat [x0, y0, x1, y1, …] list, window-center-relative px. */
export interface Stroke {
  id: string;
  points: number[];
  /** CSS color. */
  color: string;
  /** Stroke width in px. */
  width: number;
}

/** A movable, editable note. `x`/`y` are in the anchor's space (see Anchor). */
export interface TextBox {
  id: string;
  /** The sheet this box belongs to; it renders and is interactive only when that sheet is reachable. */
  sheetId: string;
  x: number;
  y: number;
  /** Box width in px; height grows with content. */
  width: number;
  text: string;
  /** What x/y are relative to. Older files normalize to the sheet. */
  anchor: Anchor;
}

export interface CalloutStyle {
  /** CSS color for the bubble border, arrow, and text. */
  color: string;
}

/** A note bubble with an arrow pointing at a target point. */
export interface Callout {
  id: string;
  sheetId: string;
  text: string;
  /** Bubble position, in the anchor's space (see Anchor). */
  bubble: { x: number; y: number };
  /** Point the arrow points at, in the anchor's space. */
  target: { x: number; y: number };
  style: CalloutStyle;
  /** What bubble/target are relative to. Older files normalize to the sheet. */
  anchor: Anchor;
}

/** One sheet of tracing paper in the stack. */
export interface PaperSheet {
  id: string;
  /**
   * Sheet rotation in degrees. Kept in the file format for later paper
   * rotation, but currently always 0: random tilt misaligned sheets with the
   * fixed corner rulers, so it is disabled until real rotation (with pointer
   * mapping) lands.
   */
  tilt: number;
  /** Pen strokes drawn on this sheet. */
  strokes: Stroke[];
  /** Text notes placed on this sheet. */
  textBoxes: TextBox[];
  /** Callout bubbles (with arrows) placed on this sheet. */
  callouts: Callout[];
  /**
   * Reserved per-sheet scale calibration placeholder — mirrors
   * ScaleCalibration but scoped to a single sheet. Not wired to any UI yet;
   * the app currently uses one project-wide ScaleCalibration (ProjectFile.scale).
   * Reserved so per-sheet calibration can land later without another format change.
   */
  calibration: ScaleCalibration | null;
}

/** Which kind of item is currently selected, and its id. */
export type SelectionKind = 'image' | 'text' | 'callout';
export interface Selection {
  kind: SelectionKind;
  id: string;
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
   * Locked images cannot be moved/scaled/rotated/deleted (still selectable,
   * so the lock can be toggled off). Older files normalize to unlocked.
   */
  locked: boolean;
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

/**
 * Schema version of the on-disk project format. Bump this when the format
 * changes and extend `normalizeProject` to upgrade older files — never
 * remove an older version's normalization path.
 *
 * v1: papers had only `strokes`.
 * v2: papers also have `textBoxes`, `callouts`, and a reserved `calibration`
 *     placeholder (see PaperSheet).
 * v3: text boxes/callouts carry an `anchor` (sheet or image), images carry
 *     `locked`.
 */
export const SCHEMA_VERSION = 3;

/** On-disk project format (saved as .tracelayer.json). */
export interface ProjectFile {
  version: 1 | 2 | 3;
  opacity: number;
  papers: PaperSheet[];
  images: ImageItem[];
  /** Drawing scale (målestok); absent in older files. */
  scale?: ScaleCalibration;
  /**
   * Window (= sheet area) size in CSS px when the project was saved; absent
   * in older files. Applied on load so window-center-relative content lines
   * up with the paper edges the way it was saved. Optional/additive — no
   * schema version bump needed, older loaders ignore it.
   */
  window?: { width: number; height: number };
  /** Optional, reserved for future PDF pages. Absent in current files. */
  pages?: DocumentPages;
}

let idCounter = 0;
export const nextId = (): string =>
  `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

/**
 * Fill in fields that older project files (v1, or a v2 saved before a field
 * was added) may lack, so loading stays backwards compatible. Images without
 * a paperId land on the top sheet, where they remain interactive. Always
 * returns a current-shape (v2) project — the return value's `version` is
 * SCHEMA_VERSION regardless of the input's.
 */
export function normalizeProject(project: ProjectFile): ProjectFile {
  const rawPapers =
    project.papers.length > 0
      ? project.papers
      : [{ id: nextId(), tilt: 0, strokes: [], textBoxes: [], callouts: [], calibration: null }];
  const papers = rawPapers.map((paper) => ({
    ...paper,
    // Random per-sheet tilt is disabled for now (it misaligned sheets with
    // the corner rulers), so older files' tilts are flattened on load too.
    tilt: 0,
    strokes: (paper.strokes ?? []).map((stroke) => ({
      ...stroke,
      color: stroke.color ?? DEFAULT_STROKE_COLOR,
      width: stroke.width ?? DEFAULT_STROKE_WIDTH,
    })),
    textBoxes: (paper.textBoxes ?? []).map((box) => ({
      ...box,
      sheetId: box.sheetId ?? paper.id,
      width: box.width ?? DEFAULT_TEXTBOX_WIDTH,
      text: box.text ?? '',
      anchor: box.anchor ?? sheetAnchor(),
    })),
    callouts: (paper.callouts ?? []).map((callout) => ({
      ...callout,
      sheetId: callout.sheetId ?? paper.id,
      text: callout.text ?? '',
      style: callout.style ?? { color: DEFAULT_CALLOUT_COLOR },
      anchor: callout.anchor ?? sheetAnchor(),
    })),
    calibration: paper.calibration ?? null,
  }));
  const topPaperId = papers[papers.length - 1].id;
  return {
    ...project,
    version: SCHEMA_VERSION,
    papers,
    images: project.images.map((img) => ({
      ...img,
      opacity: img.opacity ?? 1,
      paperId: img.paperId ?? topPaperId,
      locked: img.locked ?? false,
    })),
    scale: project.scale ?? uncalibratedScale(),
  };
}
