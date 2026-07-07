import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { TextBox } from '../types';

interface TextBoxViewProps {
  box: TextBox;
  selected: boolean;
  ghost: boolean;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<TextBox>) => void;
  /** Called once when a drag starts, or when editing begins (undo snapshot). */
  onGestureStart: () => void;
}

/** Movable, editable note bubble. Drag the grip to move; click the body to edit. */
export function TextBoxView({ box, selected, ghost, onSelect, onChange, onGestureStart }: TextBoxViewProps) {
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; origX: number; origY: number } | null>(
    null,
  );
  const contentRef = useRef<HTMLDivElement>(null);

  // Focus immediately if mounted already selected — the case right after
  // placing a new box. Deliberately mount-only (not keyed on `selected`) so
  // re-selecting an existing box by dragging its grip doesn't steal focus.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selected) contentRef.current?.focus();
  }, []);

  const onGripPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (ghost || e.button !== 0) return;
    e.stopPropagation();
    onSelect(box.id);
    onGestureStart();
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, origX: box.x, origY: box.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onGripPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    onChange(box.id, {
      x: drag.origX + (e.clientX - drag.startX),
      y: drag.origY + (e.clientY - drag.startY),
    });
  };

  const onGripPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className={`textbox${selected ? ' selected' : ''}`}
      style={{
        transform: `translate(-50%, -50%) translate(${box.x}px, ${box.y}px)`,
        width: box.width,
      }}
    >
      <div className="textbox-grip" onPointerDown={onGripPointerDown} onPointerMove={onGripPointerMove} onPointerUp={onGripPointerUp} title="Drag to move">
        ⠿
      </div>
      <div
        ref={contentRef}
        className="textbox-content"
        contentEditable={!ghost}
        suppressContentEditableWarning
        data-placeholder="Note…"
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(box.id);
        }}
        onFocus={onGestureStart}
        onInput={(e) => onChange(box.id, { text: e.currentTarget.innerText })}
      >
        {box.text}
      </div>
    </div>
  );
}
