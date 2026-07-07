import { useCallback, useEffect, useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { LayerStack } from './components/LayerStack';
import { nextId, normalizeProject } from './types';
import type { ImageItem, PaperSheet, ProjectFile } from './types';

const randomTilt = () => (Math.random() - 0.5) * 1.6;

export default function App() {
  const [ghost, setGhost] = useState(false);
  const [papers, setPapers] = useState<PaperSheet[]>([{ id: nextId(), tilt: 0 }]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.85);

  // Main process owns Ghost Mode state (toolbar and global shortcut both
  // route through it); the renderer just mirrors it.
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

  // Delete removes the selected image; Escape deselects.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedId(null);
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setImages((prev) => prev.filter((img) => img.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const toggleGhost = useCallback(() => {
    void window.traceLayer.setGhostMode(!ghost);
  }, [ghost]);

  const addPaper = useCallback(() => {
    setPapers((prev) => [...prev, { id: nextId(), tilt: randomTilt() }]);
    setSelectedId(null); // whatever was selected is now under the new sheet
  }, []);

  const importImage = useCallback(async () => {
    const dataUrl = await window.traceLayer.importImage();
    if (!dataUrl) return;
    const img: ImageItem = {
      id: nextId(),
      dataUrl,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      paperId: papers[papers.length - 1].id, // imports land on the top sheet
    };
    setImages((prev) => [...prev, img]);
    setSelectedId(img.id);
  }, [papers]);

  const updateImage = useCallback((id: string, patch: Partial<ImageItem>) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  }, []);

  const saveProject = useCallback(async () => {
    const project: ProjectFile = { version: 1, opacity, papers, images };
    await window.traceLayer.saveProject(JSON.stringify(project, null, 2));
  }, [opacity, papers, images]);

  const loadProject = useCallback(async () => {
    const raw = await window.traceLayer.loadProject();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ProjectFile;
      if (parsed.version !== 1 || !Array.isArray(parsed.papers) || !Array.isArray(parsed.images)) {
        throw new Error('Not a TraceLayer v1 project');
      }
      const project = normalizeProject(parsed);
      setPapers(project.papers);
      setImages(project.images);
      setOpacity(typeof project.opacity === 'number' ? project.opacity : 0.85);
      setSelectedId(null);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Could not load project: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  return (
    <>
      <div className="drag-handle" title="Drag to move window" />
      <div
        className={`stage${ghost ? ' ghost' : ''}`}
        style={{ opacity }}
        onPointerDown={() => setSelectedId(null)}
      >
        <LayerStack
          papers={papers}
          images={images}
          selectedId={selectedId}
          ghost={ghost}
          onSelect={setSelectedId}
          onChange={updateImage}
        />
      </div>
      <Toolbar
        ghost={ghost}
        opacity={opacity}
        onToggleGhost={toggleGhost}
        onNewPaper={addPaper}
        onImport={() => void importImage()}
        onOpacityChange={setOpacity}
        onSave={() => void saveProject()}
        onLoad={() => void loadProject()}
        onHide={() => window.traceLayer.hideWindow()}
        onClose={() => window.traceLayer.closeApp()}
      />
    </>
  );
}
