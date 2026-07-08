import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Callout } from '../types';

type DragField = 'bubble' | 'target';

interface CalloutViewProps {
  callout: Callout;
  /** Resolved screen (window-center) positions — bubble/target mapped out of the callout's anchor space by the caller. */
  bubblePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  selected: boolean;
  ghost: boolean;
  onSelect: (id: string) => void;
  /** Non-positional changes (text). */
  onChange: (id: string, patch: Partial<Callout>) => void;
  /** Position change, in screen coords; the caller converts back to anchor space. */
  onMove: (id: string, field: DragField, screenPoint: { x: number; y: number }) => void;
  /** Called once when a drag starts, or when editing begins (undo snapshot). */
  onGestureStart: () => void;
}

/**
 * A note bubble plus a draggable arrow target handle. The arrow line itself
 * is rendered by the caller (LayerStack) in a shared per-sheet svg, above
 * images/strokes; this component renders only the interactive bubble and
 * target handle.
 */
export function CalloutView({
  callout,
  bubblePosition,
  targetPosition,
  selected,
  ghost,
  onSelect,
  onChange,
  onMove,
  onGestureStart,
}: CalloutViewProps) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    field: DragField;
  } | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  // The contentEditable div is uncontrolled: while it has focus the browser
  // owns its DOM. Writing state back into it on every keystroke resets the
  // caret to the start (text came out reversed), so external text changes
  // (undo/redo, project load, initial mount) sync here only while unfocused.
  useEffect(() => {
    const el = textRef.current;
    if (el && document.activeElement !== el && el.innerText !== callout.text) {
      el.innerText = callout.text;
    }
  }, [callout.text]);

  // Focus immediately if mounted already selected — the case right after
  // placing a new callout. Mount-only so re-selecting an existing callout by
  // dragging its grip/handle doesn't steal focus.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selected) textRef.current?.focus();
  }, []);

  const beginDrag = (field: DragField) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (ghost || e.button !== 0) return;
    e.stopPropagation();
    onSelect(callout.id);
    onGestureStart();
    const orig = field === 'bubble' ? bubblePosition : targetPosition;
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, origX: orig.x, origY: orig.y, field };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const point = { x: drag.origX + (e.clientX - drag.startX), y: drag.origY + (e.clientY - drag.startY) };
    onMove(callout.id, drag.field, point);
  };

  const onDragEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <>
      <div
        className={`callout-bubble${selected ? ' selected' : ''}`}
        style={{
          transform: `translate(-50%, -50%) translate(${bubblePosition.x}px, ${bubblePosition.y}px)`,
          borderColor: callout.style.color,
        }}
      >
        <div
          className="callout-grip"
          style={{ color: callout.style.color }}
          onPointerDown={beginDrag('bubble')}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          title="Drag to move"
        >
          ⠿
        </div>
        <div
          ref={textRef}
          className="callout-text"
          contentEditable={!ghost}
          data-placeholder="Note…"
          onPointerDown={(e) => {
            e.stopPropagation();
            onSelect(callout.id);
          }}
          onFocus={onGestureStart}
          onInput={(e) => onChange(callout.id, { text: e.currentTarget.innerText })}
        />
      </div>
      {selected && !ghost && (
        <div
          className="callout-target-handle"
          style={{
            transform: `translate(-50%, -50%) translate(${targetPosition.x}px, ${targetPosition.y}px)`,
            background: callout.style.color,
          }}
          onPointerDown={beginDrag('target')}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          title="Drag to move the arrow target"
        />
      )}
    </>
  );
}
