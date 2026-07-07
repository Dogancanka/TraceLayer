/** One sheet of tracing paper in the stack. */
export interface PaperSheet {
  id: string;
  /** Small random rotation (degrees) so stacked sheets read as physical paper. */
  tilt: number;
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
}

/** On-disk project format (saved as .tracelayer.json). */
export interface ProjectFile {
  version: 1;
  opacity: number;
  papers: PaperSheet[];
  images: ImageItem[];
}

let idCounter = 0;
export const nextId = (): string =>
  `${Date.now().toString(36)}-${(idCounter++).toString(36)}`;
