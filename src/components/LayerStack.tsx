import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import { ImageView } from './ImageView';
import { strokePath } from '../stroke';
import type { ImageItem, PaperSheet } from '../types';

interface LayerStackProps {
  papers: PaperSheet[];
  images: ImageItem[];
  selectedId: string | null;
  ghost: boolean;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<ImageItem>) => void;
  onGestureStart: () => void;
}

/**
 * Sheets and images interleaved in z-order: each sheet sits on top of
 * everything placed on the sheets below it. Sheets are slightly translucent
 * (see .paper-sheet), so covered layers show through dimmed — like real
 * tracing paper. This is what makes "New Paper" visibly do something.
 *
 * Per sheet, strokes render above that sheet's images (ink over reference).
 * Images on covered sheets are naturally non-interactive: the newer sheet
 * div paints (and hit-tests) above them.
 */
export function LayerStack({
  papers,
  images,
  selectedId,
  ghost,
  onSelect,
  onChange,
  onGestureStart,
}: LayerStackProps) {
  return (
    <div className="layer-stack">
      {papers.map((paper) => (
        <Fragment key={paper.id}>
          <div
            className="paper-sheet"
            style={{ '--tilt': `${paper.tilt}deg` } as CSSProperties}
          />
          {images
            .filter((img) => img.paperId === paper.id)
            .map((img) => (
              <ImageView
                key={img.id}
                img={img}
                selected={img.id === selectedId}
                ghost={ghost}
                onSelect={onSelect}
                onChange={onChange}
                onGestureStart={onGestureStart}
              />
            ))}
          {paper.strokes.length > 0 && (
            <svg className="stroke-layer">
              {paper.strokes.map((stroke) => (
                <path key={stroke.id} d={strokePath(stroke.points)} />
              ))}
            </svg>
          )}
        </Fragment>
      ))}
    </div>
  );
}
