import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Toolbar } from './components/Toolbar';
import { LayerStack } from './components/LayerStack';
import { DrawingSurface } from './components/DrawingSurface';
import { Ruler } from './components/Ruler';
import {
  DEFAULT_BUBBLE_OFFSET,
  DEFAULT_CALLOUT_COLOR,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_TEXTBOX_WIDTH,
  SCHEMA_VERSION,
  nextId,
  normalizeProject,
  sheetAnchor,
  uncalibratedScale,
} from './types';
import type { Anchor, Callout, ImageItem, PaperSheet, ProjectFile, ScaleCalibration, Selection, Stroke, TextBox, Tool } from './types';
import { anchorToScreen, screenToAnchor } from './anchor';
import newSheetSoundUrl from './assets/audio/new_sheet_sound.wav';

// Sheets are always tilt 0 for now: random per-sheet rotation misaligned
// sheet edges with the fixed corner rulers. Re-enable only together with
// proper paper rotation (pointer-coordinate mapping, see TASKS.md 0.2).
const newSheet = (): PaperSheet => ({
  id: nextId(),
  tilt: 0,
  strokes: [],
  textBoxes: [],
  callouts: [],
  calibration: null,
});

/** Everything undo/redo covers. Image data URLs are shared by reference, so snapshots are cheap. */
interface DocSnapshot {
  papers: PaperSheet[];
  images: ImageItem[];
}

const HISTORY_LIMIT = 50;

/** localStorage key for the New Sheet sound preference ('on' / 'off'). */
const SHEET_SOUND_PREF_KEY = 'tracelayer.newSheetSound';

/**
 * Before an image is removed, its anchored annotations get their current
 * screen position baked in and are re-anchored to the sheet — they stay
 * exactly where they were instead of jumping or pointing at a dead image id.
 */
const detachAnnotationsFromImage = (paperList: PaperSheet[], img: ImageItem): PaperSheet[] =>
  paperList.map((p) => ({
    ...p,
    textBoxes: p.textBoxes.map((t) =>
      t.anchor.kind === 'image' && t.anchor.imageId === img.id
        ? { ...t, ...anchorToScreen({ x: t.x, y: t.y }, t.anchor, [img]), anchor: sheetAnchor() }
        : t,
    ),
    callouts: p.callouts.map((c) =>
      c.anchor.kind === 'image' && c.anchor.imageId === img.id
        ? {
            ...c,
            bubble: anchorToScreen(c.bubble, c.anchor, [img]),
            target: anchorToScreen(c.target, c.anchor, [img]),
            anchor: sheetAnchor(),
          }
        : c,
    ),
  }));

export default function App() {
  const [ghost, setGhost] = useState(false);
  const [papers, setPapers] = useState<PaperSheet[]>(() => [newSheet()]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [opacity, setOpacity] = useState(0.85);
  const [tool, setTool] = useState<Tool>('select');
  const [scale, setScale] = useState<ScaleCalibration>(uncalibratedScale);
  const [penColor, setPenColor] = useState(DEFAULT_STROKE_COLOR);
  const [penWidth, setPenWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [calloutColor, setCalloutColor] = useState(DEFAULT_CALLOUT_COLOR);
  // Which sheet new strokes/text/callouts/imports land on. Independent of
  // z-order (a user can navigate to an earlier sheet without reshuffling the
  // stack) — see ARCHITECTURE.md for why the stack itself never reorders.
  const [activeSheetId, setActiveSheetId] = useState<string>(() => papers[0].id);
  const [sheetSoundOn, setSheetSoundOn] = useState(() => {
    try {
      return localStorage.getItem(SHEET_SOUND_PREF_KEY) !== 'off';
    } catch {
      return true;
    }
  });

  const toggleSheetSound = useCallback(() => {
    setSheetSoundOn((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SHEET_SOUND_PREF_KEY, next ? 'on' : 'off');
      } catch {
        // Preference just won't persist; the toggle still works this session.
      }
      return next;
    });
  }, []);

  // ---- Undo/redo ----
  // History lives in refs (no re-render per snapshot); historyVersion bumps
  // so canUndo/canRedo in the toolbar stay current.
  const pastRef = useRef<DocSnapshot[]>([]);
  const futureRef = useRef<DocSnapshot[]>([]);
  const docRef = useRef<DocSnapshot>({ papers, images });
  docRef.current = { papers, images };
  const [, setHistoryVersion] = useState(0);
  const bumpHistory = () => setHistoryVersion((v) => v + 1);

  const pushHistory = useCallback(() => {
    pastRef.current.push(docRef.current);
    if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
    futureRef.current = [];
    bumpHistory();
  }, []);

  const applySnapshot = (snap: DocSnapshot) => {
    setPapers(snap.papers);
    setImages(snap.images);
    setSelection(null);
  };

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(docRef.current);
    applySnapshot(prev);
    bumpHistory();
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(docRef.current);
    applySnapshot(next);
    bumpHistory();
  }, []);

  // Active sheet resolution: falls back to the top sheet if activeSheetId
  // doesn't match anything (e.g. after undoing the sheet that added it) —
  // self-healing, no effect needed to keep it in sync.
  const activeIndexFound = papers.findIndex((p) => p.id === activeSheetId);
  const activeIndex = activeIndexFound === -1 ? papers.length - 1 : activeIndexFound;
  const activeSheet = papers[activeIndex];

  const goToSheetIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(papers.length - 1, index));
      setActiveSheetId(papers[clamped].id);
      setSelection(null);
    },
    [papers],
  );
  // Stack order: papers[0] is the bottom sheet, the last entry the top one.
  // "Up" goes to the sheet above (later in the array), "Down" to the sheet
  // underneath — matching the physical stack, the toolbar arrows, and the
  // Alt+Up/Down / PageUp/PageDown shortcuts.
  const sheetUp = useCallback(() => goToSheetIndex(activeIndex + 1), [goToSheetIndex, activeIndex]);
  const sheetDown = useCallback(() => goToSheetIndex(activeIndex - 1), [goToSheetIndex, activeIndex]);

  // ---- Ghost Mode (owned by the main process; renderer mirrors it) ----
  useEffect(() => window.traceLayer.onGhostModeChanged(setGhost), []);

  // In Ghost Mode the window is click-through, which would make the toolbar
  // unusable. The main process forwards mousemove events, so we re-enable
  // mouse input only while the cursor is over the toolbar.
  useEffect(() => {
    if (!ghost) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        window.traceLayer.setIgnoreMouse(!el?.closest('.toolbar'));
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ghost]);

  // ---- Keyboard ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ghost) return;
      // Editing a text box/callout: let the browser handle native text
      // editing (typing, its own undo, Delete/Backspace-as-character) and
      // don't hijack global shortcuts.
      const target = e.target as HTMLElement | null;
      const editing = !!target?.isContentEditable;
      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === 'z' && !e.shiftKey) {
        if (editing) return;
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey && (key === 'y' || (key === 'z' && e.shiftKey))) {
        if (editing) return;
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'Escape') {
        if (editing) {
          target.blur();
          return;
        }
        setSelection(null);
        setTool('select');
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection && !editing) {
        if (selection.kind === 'image') {
          const img = images.find((i) => i.id === selection.id);
          if (!img || img.locked) return; // locked images survive stray Delete presses
          pushHistory();
          setPapers((prev) => detachAnnotationsFromImage(prev, img));
          setImages((prev) => prev.filter((i) => i.id !== img.id));
        } else if (selection.kind === 'text') {
          pushHistory();
          setPapers((prev) => prev.map((p) => ({ ...p, textBoxes: p.textBoxes.filter((t) => t.id !== selection.id) })));
        } else {
          pushHistory();
          setPapers((prev) => prev.map((p) => ({ ...p, callouts: p.callouts.filter((c) => c.id !== selection.id) })));
        }
        setSelection(null);
        return;
      }
      // Up = the sheet above (later in the stack), Down = the sheet underneath.
      if (!editing && (e.key === 'PageUp' || (e.altKey && e.key === 'ArrowUp'))) {
        e.preventDefault();
        sheetUp();
        return;
      }
      if (!editing && (e.key === 'PageDown' || (e.altKey && e.key === 'ArrowDown'))) {
        e.preventDefault();
        sheetDown();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ghost, selection, images, undo, redo, pushHistory, sheetUp, sheetDown]);

  // ---- Actions ----
  const toggleGhost = useCallback(() => {
    void window.traceLayer.setGhostMode(!ghost);
  }, [ghost]);

  const changeTool = useCallback((next: Tool) => {
    setTool(next);
    // Pen/eraser don't use the selection — clear it. Text/callout keep an
    // image selection: the selected image is the anchor target for the
    // annotation about to be placed (see onStagePointerDown).
    setSelection((sel) =>
      next === 'select' || ((next === 'text' || next === 'callout') && sel?.kind === 'image') ? sel : null,
    );
  }, []);

  const addPaper = useCallback(() => {
    pushHistory();
    const sheet = newSheet();
    setPapers((prev) => [...prev, sheet]);
    setActiveSheetId(sheet.id); // new sheet becomes the active target too
    setSelection(null); // whatever was selected is now under the new sheet
    if (sheetSoundOn) {
      // Best-effort paper sound; never let audio problems block the sheet.
      try {
        void new Audio(newSheetSoundUrl).play().catch(() => {});
      } catch {
        // ignore
      }
    }
  }, [pushHistory, sheetSoundOn]);

  // Deletes the active sheet with everything on it (strokes, notes, callouts,
  // images). Never deletes the last sheet — the toolbar disables the button.
  const deleteSheet = useCallback(() => {
    if (papers.length <= 1) return;
    const sheet = activeSheet;
    const hasContent =
      sheet.strokes.length > 0 ||
      sheet.textBoxes.length > 0 ||
      sheet.callouts.length > 0 ||
      images.some((img) => img.paperId === sheet.id);
    if (hasContent) {
      const ok = window.confirm(
        `Delete sheet ${activeIndex + 1}? Its drawings, notes and images are removed. (Ctrl+Z undoes this.)`,
      );
      if (!ok) return;
    }
    pushHistory();
    let remaining = papers.filter((p) => p.id !== sheet.id);
    // Annotations on *other* sheets may be anchored to this sheet's images —
    // bake their positions and re-anchor them to the sheet before the images go.
    for (const img of images) {
      if (img.paperId === sheet.id) remaining = detachAnnotationsFromImage(remaining, img);
    }
    setPapers(remaining);
    setImages((prev) => prev.filter((img) => img.paperId !== sheet.id));
    // The sheet that was underneath is the natural next target (it just got
    // revealed); when the bottom sheet was deleted, take the new bottom one.
    setActiveSheetId(remaining[Math.max(0, activeIndex - 1)].id);
    setSelection(null);
  }, [papers, images, activeSheet, activeIndex, pushHistory]);

  // Full reset, unlike New Sheet. Undoable (snapshot is pushed first).
  const newProject = useCallback(() => {
    const ok = window.confirm(
      'Start a new project? All sheets, drawings and images are cleared. (Ctrl+Z undoes this.)',
    );
    if (!ok) return;
    pushHistory();
    const sheet = newSheet();
    setPapers([sheet]);
    setImages([]);
    setActiveSheetId(sheet.id);
    setScale(uncalibratedScale());
    setOpacity(0.85);
    setSelection(null);
    setTool('select');
  }, [pushHistory]);

  const importImage = useCallback(async () => {
    const dataUrl = await window.traceLayer.importImage();
    if (!dataUrl) return;
    pushHistory();
    const img: ImageItem = {
      id: nextId(),
      dataUrl,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
      locked: false,
      paperId: activeSheet.id, // imports land on the active sheet
    };
    setImages((prev) => [...prev, img]);
    setSelection({ kind: 'image', id: img.id });
    setTool('select');
  }, [activeSheet, pushHistory]);

  // Snapshot of the screen under the overlay → image on the active sheet,
  // placed 1:1 with the screen (scale = 1/displayScaleFactor, centered on
  // the window) so the capture lines up exactly with what it traced.
  const captureUnder = useCallback(async () => {
    const shot = await window.traceLayer.captureUnder();
    if (!shot) return;
    pushHistory();
    const img: ImageItem = {
      id: nextId(),
      dataUrl: shot.dataUrl,
      x: 0,
      y: 0,
      scale: 1 / shot.scaleFactor,
      rotation: 0,
      opacity: 1,
      locked: false,
      paperId: activeSheet.id,
    };
    setImages((prev) => [...prev, img]);
    setSelection({ kind: 'image', id: img.id });
    setTool('select');
  }, [activeSheet, pushHistory]);

  // Live updates during a gesture; the undo snapshot is taken once at
  // gesture start (ImageView calls onGestureStart / pushHistory).
  const updateImage = useCallback((id: string, patch: Partial<ImageItem>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  }, []);

  // Lock/unlock the selected image. Locked images ignore move/scale/rotate
  // gestures (ImageView) and the Delete key, but stay selectable. Undoable.
  const toggleImageLock = useCallback(() => {
    if (selection?.kind !== 'image') return;
    const img = images.find((i) => i.id === selection.id);
    if (!img) return;
    pushHistory();
    updateImage(img.id, { locked: !img.locked });
  }, [selection, images, pushHistory, updateImage]);

  const addStroke = useCallback(
    (points: number[]) => {
      pushHistory();
      const stroke: Stroke = { id: nextId(), points, color: penColor, width: penWidth };
      setPapers((prev) =>
        prev.map((p) => (p.id === activeSheet.id ? { ...p, strokes: [...p.strokes, stroke] } : p)),
      );
    },
    [pushHistory, penColor, penWidth, activeSheet],
  );

  // One undo step per erase gesture, and only if it actually removed something.
  const erasePendingRef = useRef(false);
  const beginEraseGesture = useCallback(() => {
    erasePendingRef.current = true;
  }, []);
  const eraseStroke = useCallback(
    (strokeId: string) => {
      if (erasePendingRef.current) {
        pushHistory();
        erasePendingRef.current = false;
      }
      setPapers((prev) =>
        prev.map((paper) =>
          paper.strokes.some((s) => s.id === strokeId)
            ? { ...paper, strokes: paper.strokes.filter((s) => s.id !== strokeId) }
            : paper,
        ),
      );
    },
    [pushHistory],
  );

  const updateTextBox = useCallback((id: string, patch: Partial<TextBox>) => {
    setPapers((prev) => prev.map((p) => ({ ...p, textBoxes: p.textBoxes.map((t) => (t.id === id ? { ...t, ...patch } : t)) })));
  }, []);

  const updateCallout = useCallback((id: string, patch: Partial<Callout>) => {
    setPapers((prev) => prev.map((p) => ({ ...p, callouts: p.callouts.map((c) => (c.id === id ? { ...c, ...patch } : c)) })));
  }, []);

  // Placing a new text box or callout: click anywhere on the stage while
  // that tool is active. Existing items become pointer-events:none while a
  // placement/drawing tool is active (see .stage.drawing in styles.css), so
  // this always fires for an empty-area click. Otherwise, a plain click
  // deselects (matches the pre-existing behavior).
  const onStagePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (tool === 'text' || tool === 'callout') {
        const point = { x: e.clientX - window.innerWidth / 2, y: e.clientY - window.innerHeight / 2 };
        // Anchoring default: a selected image pins the new annotation to that
        // image (it follows the image's move/scale/rotate); otherwise the
        // annotation is anchored to the sheet. Coordinates are stored in
        // anchor space, so screen points convert on the way in.
        const anchor: Anchor =
          selection?.kind === 'image' && images.some((img) => img.id === selection.id)
            ? { kind: 'image', imageId: selection.id }
            : sheetAnchor();
        pushHistory();
        if (tool === 'text') {
          const local = screenToAnchor(point, anchor, images);
          const box: TextBox = {
            id: nextId(),
            sheetId: activeSheet.id,
            x: local.x,
            y: local.y,
            width: DEFAULT_TEXTBOX_WIDTH,
            text: '',
            anchor,
          };
          setPapers((prev) => prev.map((p) => (p.id === activeSheet.id ? { ...p, textBoxes: [...p.textBoxes, box] } : p)));
          setSelection({ kind: 'text', id: box.id });
        } else {
          const callout: Callout = {
            id: nextId(),
            sheetId: activeSheet.id,
            text: '',
            bubble: screenToAnchor(
              { x: point.x - DEFAULT_BUBBLE_OFFSET, y: point.y - DEFAULT_BUBBLE_OFFSET },
              anchor,
              images,
            ),
            target: screenToAnchor(point, anchor, images),
            style: { color: calloutColor },
            anchor,
          };
          setPapers((prev) => prev.map((p) => (p.id === activeSheet.id ? { ...p, callouts: [...p.callouts, callout] } : p)));
          setSelection({ kind: 'callout', id: callout.id });
        }
        setTool('select');
        return;
      }
      setSelection(null);
    },
    [tool, activeSheet, calloutColor, selection, images, pushHistory],
  );

  const saveProject = useCallback(async () => {
    const project: ProjectFile = { version: SCHEMA_VERSION, opacity, papers, images, scale };
    await window.traceLayer.saveProject(JSON.stringify(project, null, 2));
  }, [opacity, papers, images, scale]);

  const loadProject = useCallback(async () => {
    const raw = await window.traceLayer.loadProject();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ProjectFile;
      if (
        (parsed.version !== 1 && parsed.version !== 2 && parsed.version !== 3) ||
        !Array.isArray(parsed.papers) ||
        !Array.isArray(parsed.images)
      ) {
        throw new Error('Not a valid TraceLayer project');
      }
      pushHistory();
      const project = normalizeProject(parsed);
      setPapers(project.papers);
      setImages(project.images);
      setActiveSheetId(project.papers[project.papers.length - 1].id);
      setScale(project.scale ?? uncalibratedScale());
      setOpacity(typeof project.opacity === 'number' ? project.opacity : 0.85);
      setSelection(null);
      setTool('select');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Could not load project: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [pushHistory]);

  const selectedImage = selection?.kind === 'image' ? images.find((img) => img.id === selection.id) ?? null : null;

  return (
    <>
      <div className="drag-handle" title="Drag to move window" />
      <div
        className={`stage${ghost ? ' ghost' : ''}${tool !== 'select' ? ' drawing' : ''} tool-${tool}`}
        style={{ opacity }}
        onPointerDown={onStagePointerDown}
      >
        <Ruler scale={scale} />
        <LayerStack
          papers={papers}
          images={images}
          activeSheetId={activeSheet.id}
          selection={selection}
          ghost={ghost}
          onSelectImage={(id) => setSelection({ kind: 'image', id })}
          onChangeImage={updateImage}
          onSelectText={(id) => setSelection({ kind: 'text', id })}
          onChangeText={updateTextBox}
          onSelectCallout={(id) => setSelection({ kind: 'callout', id })}
          onChangeCallout={updateCallout}
          onGestureStart={pushHistory}
        />
        {!ghost && (tool === 'pen' || tool === 'eraser') && (
          <DrawingSurface
            tool={tool}
            sheetStrokes={activeSheet.strokes}
            penColor={penColor}
            penWidth={penWidth}
            onStrokeEnd={addStroke}
            onEraseGestureStart={beginEraseGesture}
            onErase={eraseStroke}
          />
        )}
      </div>
      <Toolbar
        ghost={ghost}
        opacity={opacity}
        tool={tool}
        canUndo={pastRef.current.length > 0}
        canRedo={futureRef.current.length > 0}
        selectedImageOpacity={selectedImage?.opacity ?? null}
        scale={scale}
        onScaleChange={setScale}
        penColor={penColor}
        penWidth={penWidth}
        onPenColorChange={setPenColor}
        onPenWidthChange={setPenWidth}
        calloutColor={calloutColor}
        onCalloutColorChange={setCalloutColor}
        sheetIndex={activeIndex}
        sheetCount={papers.length}
        onSheetUp={sheetUp}
        onSheetDown={sheetDown}
        onDeleteSheet={deleteSheet}
        sheetSoundOn={sheetSoundOn}
        onToggleSheetSound={toggleSheetSound}
        selectedImageLocked={selectedImage?.locked ?? null}
        onToggleImageLock={toggleImageLock}
        onNewProject={newProject}
        onToolChange={changeTool}
        onUndo={undo}
        onRedo={redo}
        onToggleGhost={toggleGhost}
        onNewPaper={addPaper}
        onImport={() => void importImage()}
        onCapture={() => void captureUnder()}
        onOpacityChange={setOpacity}
        onImageOpacityChange={(value) => {
          if (selection?.kind === 'image') updateImage(selection.id, { opacity: value });
        }}
        onImageGestureStart={pushHistory}
        onSave={() => void saveProject()}
        onLoad={() => void loadProject()}
        onHide={() => window.traceLayer.hideWindow()}
        onClose={() => window.traceLayer.closeApp()}
      />
    </>
  );
}
