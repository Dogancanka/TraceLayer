import { useEffect, useState } from 'react';
import type { Tool } from '../types';

interface ToolbarProps {
  ghost: boolean;
  opacity: number;
  tool: Tool;
  canUndo: boolean;
  canRedo: boolean;
  /** Opacity of the selected image, or null when nothing is selected. */
  selectedImageOpacity: number | null;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleGhost: () => void;
  onNewPaper: () => void;
  onImport: () => void;
  onOpacityChange: (value: number) => void;
  onImageOpacityChange: (value: number) => void;
  onImageGestureStart: () => void;
  onSave: () => void;
  onLoad: () => void;
  onHide: () => void;
  onClose: () => void;
}

export function Toolbar({
  ghost,
  opacity,
  tool,
  canUndo,
  canRedo,
  selectedImageOpacity,
  onToolChange,
  onUndo,
  onRedo,
  onToggleGhost,
  onNewPaper,
  onImport,
  onOpacityChange,
  onImageOpacityChange,
  onImageGestureStart,
  onSave,
  onLoad,
  onHide,
  onClose,
}: ToolbarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Settings controls are Edit Mode only; close the popover when Ghost Mode starts.
  useEffect(() => {
    if (ghost) setSettingsOpen(false);
  }, [ghost]);

  // The root keeps the `toolbar` class in both states: the Ghost Mode
  // hover check in App.tsx matches `.toolbar`, so the collapsed handle
  // stays clickable and Ghost Mode always remains exitable.
  if (collapsed) {
    return (
      <div className="toolbar toolbar-collapsed">
        <button
          type="button"
          className="expand-btn"
          onClick={() => setCollapsed(false)}
          title="Show controls"
        >
          ▲ TraceLayer
        </button>
      </div>
    );
  }

  return (
    <div className="toolbar">
      <div className="toolbar-grip" title="Drag to move window">
        ⠿
      </div>

      <button type="button" onClick={onNewPaper} disabled={ghost} title="Place a new sheet on top">
        New Paper
      </button>
      <button type="button" onClick={onImport} disabled={ghost} title="Import PNG/JPG">
        Import
      </button>

      <button
        type="button"
        className={tool === 'pen' ? 'active-tool' : ''}
        onClick={() => onToolChange(tool === 'pen' ? 'select' : 'pen')}
        disabled={ghost}
        title="Pen: draw on the top sheet"
      >
        Pen
      </button>
      <button
        type="button"
        className={tool === 'eraser' ? 'active-tool' : ''}
        onClick={() => onToolChange(tool === 'eraser' ? 'select' : 'eraser')}
        disabled={ghost}
        title="Eraser: remove strokes from the top sheet"
      >
        Erase
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={onUndo}
        disabled={ghost || !canUndo}
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={onRedo}
        disabled={ghost || !canRedo}
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>

      {/* Placeholder for future multi-page (PDF) support — see DocumentPages in types.ts. */}
      <div className="page-controller" title="Multi-page documents coming later">
        <button type="button" disabled title="Previous page">
          ‹
        </button>
        <span className="page-label">1 / 1</span>
        <button type="button" disabled title="Next page">
          ›
        </button>
      </div>

      <button
        type="button"
        className={`ghost-toggle${ghost ? ' active' : ''}`}
        onClick={onToggleGhost}
        title="Ghost Mode: clicks pass through to the app underneath (Ctrl+Alt+G)"
      >
        {ghost ? 'Ghost ON' : 'Ghost'}
      </button>

      <label className="opacity-control" title="Paper opacity">
        <span>Opacity</span>
        <input
          type="range"
          min={10}
          max={100}
          value={Math.round(opacity * 100)}
          onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
          disabled={ghost}
        />
      </label>

      {selectedImageOpacity !== null && (
        <label className="opacity-control" title="Selected image opacity">
          <span>Img</span>
          <input
            type="range"
            min={5}
            max={100}
            value={Math.round(selectedImageOpacity * 100)}
            onPointerDown={onImageGestureStart}
            onChange={(e) => onImageOpacityChange(Number(e.target.value) / 100)}
            disabled={ghost}
          />
        </label>
      )}

      <button type="button" onClick={onSave} disabled={ghost} title="Save project as JSON">
        Save
      </button>
      <button type="button" onClick={onLoad} disabled={ghost} title="Load project JSON">
        Load
      </button>

      <div className="settings-wrap">
        <button
          type="button"
          className={`settings-btn${settingsOpen ? ' active' : ''}`}
          onClick={() => setSettingsOpen((open) => !open)}
          disabled={ghost}
          title="Settings"
        >
          ⚙
        </button>
        {settingsOpen && (
          <div className="settings-popover">
            <div className="settings-hints">
              <div className="settings-hints-title">Shortcuts</div>
              <div>
                <span>Scale image</span>
                <span>Wheel</span>
              </div>
              <div>
                <span>Rotate image</span>
                <span>Shift + Wheel</span>
              </div>
              <div>
                <span>Remove image</span>
                <span>Delete</span>
              </div>
              <div>
                <span>Undo / Redo</span>
                <span>Ctrl+Z / Ctrl+Y</span>
              </div>
              <div>
                <span>Ghost Mode</span>
                <span>Ctrl+Alt+G</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="toolbar-sep" />

      <button
        type="button"
        className="icon-btn"
        onClick={() => setCollapsed(true)}
        title="Collapse controls"
      >
        ▾
      </button>
      <button type="button" className="icon-btn" onClick={onHide} title="Hide overlay (minimize)">
        –
      </button>
      <button type="button" className="close-btn" onClick={onClose} title="Quit TraceLayer">
        ✕
      </button>
    </div>
  );
}
