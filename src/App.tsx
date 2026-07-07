import { useCallback, useEffect, useRef, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { LayerStack } from './components/LayerStack';
import { DrawingSurface } from './components/DrawingSurface';
import { Ruler } from './components/Ruler';
import { DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH, nextId, normalizeProject, uncalibratedScale } from './types';
import type { ImageItem, PaperSheet, ProjectFile, ScaleCalibration, Stroke, Tool } from './types';

const randomTilt = () => (Math.random() - 0.5) * 1.6;
const newSheet = (tilt = 0): PaperSheet => ({ id: nextId(), tilt, strokes: [] });

/** Everything undo/redo covers. Image data URLs are shared by reference, so snapshots are cheap. */
interface DocSnapshot {
  papers: PaperSheet[];
  images: ImageItem[];
}

const HISTORY_LIMIT = 50;

export default function App() {
  const [ghost, setGhost] = useState(false);
  const [papers, setPapers] = useState<PaperSheet[]>(() => [newSheet()]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.85);
  const [tool, setTool] = useState<Tool>('select');
  const [scale, setScale] = useState<ScaleCalibration>(uncalibratedScale);
  const [penColor, setPenColor] = useState(DEFAULT_STROKE_COLOR);
  const [penWidth, setPenWidth] = useState(DEFAULT_STROKE_WIDTH);

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
    setSelectedId(null);
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
      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setTool('select');
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        pushHistory();
        setImages((prev) => prev.filter((img) => img.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ghost, selectedId, undo, redo, pushHistory]);

  // ---- Actions ----
  const toggleGhost = useCallback(() => {
    void window.traceLayer.setGhostMode(!ghost);
  }, [ghost]);

  const changeTool = useCallback((next: Tool) => {
    setTool(next);
    if (next !== 'select') setSelectedId(null);
  }, []);

  const addPaper = useCallback(() => {
    pushHistory();
    setPapers((prev) => [...prev, newSheet(randomTilt())]);
    setSelectedId(null); // whatever was selected is now under the new sheet
  }, [pushHistory]);

  // Full reset, unlike New Sheet. Undoable (snapshot is pushed first).
  const newProject = useCallback(() => {
    const ok = window.confirm(
      'Start a new project? All sheets, drawings and images are cleared. (Ctrl+Z undoes this.)',
    );
    if (!ok) return;
    pushHistory();
    setPapers([newSheet()]);
    setImages([]);
    setScale(uncalibratedScale());
    setOpacity(0.85);
    setSelectedId(null);
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
      paperId: papers[papers.length - 1].id, // imports land on the top sheet
    };
    setImages((prev) => [...prev, img]);
    setSelectedId(img.id);
    setTool('select');
  }, [papers, pushHistory]);

  // Snapshot of the screen under the overlay → image on the top sheet,
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
      paperId: papers[papers.length - 1].id,
    };
    setImages((prev) => [...prev, img]);
    setSelectedId(img.id);
    setTool('select');
  }, [papers, pushHistory]);

  // Live updates during a gesture; the undo snapshot is taken once at
  // gesture start (ImageView calls onGestureStart / pushHistory).
  const updateImage = useCallback((id: string, patch: Partial<ImageItem>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  }, []);

  const addStroke = useCallback(
    (points: number[]) => {
      pushHistory();
      setPapers((prev) => {
        const top = prev[prev.length - 1];
        const stroke: Stroke = { id: nextId(), points, color: penColor, width: penWidth };
        return [...prev.slice(0, -1), { ...top, strokes: [...top.strokes, stroke] }];
      });
    },
    [pushHistory, penColor, penWidth],
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

  const saveProject = useCallback(async () => {
    const project: ProjectFile = { version: 1, opacity, papers, images, scale };
    await window.traceLayer.saveProject(JSON.stringify(project, null, 2));
  }, [opacity, papers, images, scale]);

  const loadProject = useCallback(async () => {
    const raw = await window.traceLayer.loadProject();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ProjectFile;
      if (parsed.version !== 1 || !Array.isArray(parsed.papers) || !Array.isArray(parsed.images)) {
        throw new Error('Not a TraceLayer v1 project');
      }
      pushHistory();
      const project = normalizeProject(parsed);
      setPapers(project.papers);
      setImages(project.images);
      setScale(project.scale ?? uncalibratedScale());
      setOpacity(typeof project.opacity === 'number' ? project.opacity : 0.85);
      setSelectedId(null);
      setTool('select');
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Could not load project: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [pushHistory]);

  const selectedImage = images.find((img) => img.id === selectedId) ?? null;

  return (
    <>
      <div className="drag-handle" title="Drag to move window" />
      <div
        className={`stage${ghost ? ' ghost' : ''}${tool !== 'select' ? ' drawing' : ''}`}
        style={{ opacity }}
        onPointerDown={() => setSelectedId(null)}
      >
        <Ruler scale={scale} />
        <LayerStack
          papers={papers}
          images={images}
          selectedId={selectedId}
          ghost={ghost}
          onSelect={setSelectedId}
          onChange={updateImage}
          onGestureStart={pushHistory}
        />
        {!ghost && tool !== 'select' && (
          <DrawingSurface
            tool={tool}
            topStrokes={papers[papers.length - 1].strokes}
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
          if (selectedId) updateImage(selectedId, { opacity: value });
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
