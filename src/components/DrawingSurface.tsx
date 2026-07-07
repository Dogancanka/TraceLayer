import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { strokeHit, strokePath } from '../stroke';
import { useWindowSize } from '../useWindowSize';
import type { Stroke, Tool } from '../types';

const ERASE_RADIUS = 6;
const MIN_POINT_DIST = 1.5;

interface DrawingSurfaceProps {
  tool: Exclude<Tool, 'select'>;
  /** Strokes of the top sheet — the only sheet the eraser can reach. */
  topStrokes: Stroke[];
  penColor: string;
  penWidth: number;
  onStrokeEnd: (points: number[]) => void;
  onEraseGestureStart: () => void;
  onErase: (strokeId: string) => void;
}

/**
 * Full-stage input layer, mounted only while the pen or eraser tool is
 * active in Edit Mode. Pen strokes preview locally and are committed on
 * pointer-up; the eraser removes whole strokes it touches.
 */
export function DrawingSurface({
  tool,
  topStrokes,
  penColor,
  penWidth,
  onStrokeEnd,
  onEraseGestureStart,
  onErase,
}: DrawingSurfaceProps) {
  const [livePoints, setLivePoints] = useState<number[] | null>(null);
  const activeRef = useRef(false);
  const { w, h } = useWindowSize();

  // Stroke coordinates are window-center-relative, same as image transforms.
  const toCenter = (e: ReactPointerEvent): [number, number] => [
    e.clientX - window.innerWidth / 2,
    e.clientY - window.innerHeight / 2,
  ];

  const eraseAt = (x: number, y: number) => {
    for (const stroke of topStrokes) {
      if (strokeHit(stroke, x, y, ERASE_RADIUS)) onErase(stroke.id);
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    activeRef.current = true;
    const [x, y] = toCenter(e);
    if (tool === 'pen') {
      setLivePoints([x, y]);
    } else {
      onEraseGestureStart();
      eraseAt(x, y);
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeRef.current) return;
    const [x, y] = toCenter(e);
    if (tool === 'pen') {
      setLivePoints((prev) => {
        if (!prev) return prev;
        const lx = prev[prev.length - 2];
        const ly = prev[prev.length - 1];
        if (Math.hypot(x - lx, y - ly) < MIN_POINT_DIST) return prev;
        return [...prev, x, y];
      });
    } else {
      eraseAt(x, y);
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!activeRef.current) return;
    activeRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (tool === 'pen' && livePoints) onStrokeEnd(livePoints);
    setLivePoints(null);
  };

  return (
    <div
      className={`drawing-surface ${tool}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {livePoints && (
        <svg className="stroke-layer">
          <g transform={`translate(${w / 2} ${h / 2})`}>
            <path d={strokePath(livePoints)} stroke={penColor} strokeWidth={penWidth} />
          </g>
        </svg>
      )}
    </div>
  );
}
