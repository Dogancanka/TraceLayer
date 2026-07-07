import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import type { ImageItem } from '../types';

interface ImageLayerProps {
  images: ImageItem[];
  selectedId: string | null;
  ghost: boolean;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<ImageItem>) => void;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 20;

export function ImageLayer({ images, selectedId, ghost, onSelect, onChange }: ImageLayerProps) {
  return (
    <div className="image-layer">
      {images.map((img) => (
        <ImageView
          key={img.id}
          img={img}
          selected={img.id === selectedId}
          ghost={ghost}
          onSelect={onSelect}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

interface ImageViewProps {
  img: ImageItem;
  selected: boolean;
  ghost: boolean;
  onSelect: (id: string | null) => void;
  onChange: (id: string, patch: Partial<ImageItem>) => void;
}

function ImageView({ img, selected, ghost, onSelect, onChange }: ImageViewProps) {
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (ghost || e.button !== 0) return;
    e.stopPropagation(); // keep the stage from deselecting
    onSelect(img.id);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: img.x,
      origY: img.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    onChange(img.id, {
      x: drag.origX + (e.clientX - drag.startX),
      y: drag.origY + (e.clientY - drag.startY),
    });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Wheel = scale, Shift+wheel = rotate.
  const onWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (ghost) return;
    onSelect(img.id);
    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
    if (e.shiftKey) {
      onChange(img.id, { rotation: img.rotation + (delta > 0 ? 3 : -3) });
    } else {
      const factor = delta > 0 ? 1 / 1.06 : 1.06;
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, img.scale * factor));
      onChange(img.id, { scale });
    }
  };

  return (
    <div
      className={`image-item${selected ? ' selected' : ''}`}
      style={{
        transform: `translate(-50%, -50%) translate(${img.x}px, ${img.y}px) rotate(${img.rotation}deg) scale(${img.scale})`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      <img src={img.dataUrl} alt="" draggable={false} />
    </div>
  );
}
