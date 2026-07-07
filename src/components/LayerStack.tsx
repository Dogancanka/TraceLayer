import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import { ImageView } from './ImageView';
import { TextBoxView } from './TextBoxView';
import { CalloutView } from './CalloutView';
import { strokePath } from '../stroke';
import { useWindowSize } from '../useWindowSize';
import type { Callout, ImageItem, PaperSheet, Selection, TextBox } from '../types';

interface LayerStackProps {
  papers: PaperSheet[];
  images: ImageItem[];
  /** The sheet new strokes/text/callouts/imports land on; highlighted so it reads clearly. */
  activeSheetId: string;
  selection: Selection | null;
  ghost: boolean;
  onSelectImage: (id: string) => void;
  onChangeImage: (id: string, patch: Partial<ImageItem>) => void;
  onSelectText: (id: string) => void;
  onChangeText: (id: string, patch: Partial<TextBox>) => void;
  onSelectCallout: (id: string) => void;
  onChangeCallout: (id: string, patch: Partial<Callout>) => void;
  onGestureStart: () => void;
}

/**
 * Sheets and their contents interleaved in z-order: each sheet sits on top of
 * everything placed on the sheets below it. Sheets are slightly translucent
 * (see .paper-sheet), so covered layers show through dimmed — like real
 * tracing paper. This is what makes "New Paper" visibly do something.
 *
 * Per sheet, paint order is: images, strokes, then text boxes/callouts (ink
 * and notes over reference material). Items on covered sheets are naturally
 * non-interactive: the newer sheet div paints (and hit-tests) above them.
 */
export function LayerStack({
  papers,
  images,
  activeSheetId,
  selection,
  ghost,
  onSelectImage,
  onChangeImage,
  onSelectText,
  onChangeText,
  onSelectCallout,
  onChangeCallout,
  onGestureStart,
}: LayerStackProps) {
  // Stroke/callout-arrow coordinates are window-center-relative; the <g>
  // translate maps them into the full-size svg. (A zero-size svg with
  // overflow:visible is NOT painted by Chromium — do not "simplify" back to that.)
  const { w, h } = useWindowSize();
  return (
    <div className="layer-stack">
      {papers.map((paper) => (
        <Fragment key={paper.id}>
          <div
            className={`paper-sheet${paper.id === activeSheetId ? ' active-sheet' : ''}`}
            style={{ '--tilt': `${paper.tilt}deg` } as CSSProperties}
          />
          {images
            .filter((img) => img.paperId === paper.id)
            .map((img) => (
              <ImageView
                key={img.id}
                img={img}
                selected={selection?.kind === 'image' && selection.id === img.id}
                ghost={ghost}
                onSelect={onSelectImage}
                onChange={onChangeImage}
                onGestureStart={onGestureStart}
              />
            ))}
          {paper.strokes.length > 0 && (
            <svg className="stroke-layer">
              <g transform={`translate(${w / 2} ${h / 2})`}>
                {paper.strokes.map((stroke) => (
                  <path
                    key={stroke.id}
                    d={strokePath(stroke.points)}
                    stroke={stroke.color}
                    strokeWidth={stroke.width}
                  />
                ))}
              </g>
            </svg>
          )}
          {paper.textBoxes.map((box) => (
            <TextBoxView
              key={box.id}
              box={box}
              selected={selection?.kind === 'text' && selection.id === box.id}
              ghost={ghost}
              onSelect={onSelectText}
              onChange={onChangeText}
              onGestureStart={onGestureStart}
            />
          ))}
          {paper.callouts.length > 0 && (
            <svg className="callout-arrow-layer">
              <g transform={`translate(${w / 2} ${h / 2})`}>
                <defs>
                  <marker
                    id={`callout-arrowhead-${paper.id}`}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M0,0 L10,5 L0,10 Z" fill="currentColor" />
                  </marker>
                </defs>
                {paper.callouts.map((callout) => (
                  <line
                    key={callout.id}
                    x1={callout.bubble.x}
                    y1={callout.bubble.y}
                    x2={callout.target.x}
                    y2={callout.target.y}
                    stroke={callout.style.color}
                    color={callout.style.color}
                    strokeWidth={1.6}
                    markerEnd={`url(#callout-arrowhead-${paper.id})`}
                  />
                ))}
              </g>
            </svg>
          )}
          {paper.callouts.map((callout) => (
            <CalloutView
              key={callout.id}
              callout={callout}
              selected={selection?.kind === 'callout' && selection.id === callout.id}
              ghost={ghost}
              onSelect={onSelectCallout}
              onChange={onChangeCallout}
              onGestureStart={onGestureStart}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
