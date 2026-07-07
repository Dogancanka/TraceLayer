import { useEffect, useState } from 'react';

interface ToolbarProps {
  ghost: boolean;
  opacity: number;
  onToggleGhost: () => void;
  onNewPaper: () => void;
  onImport: () => void;
  onOpacityChange: (value: number) => void;
  onSave: () => void;
  onLoad: () => void;
  onHide: () => void;
  onClose: () => void;
}

export function Toolbar({
  ghost,
  opacity,
  onToggleGhost,
  onNewPaper,
  onImport,
  onOpacityChange,
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
            <label className="settings-row" title="Paper opacity">
              <span>Opacity</span>
              <input
                type="range"
                min={10}
                max={100}
                value={Math.round(opacity * 100)}
                onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
              />
            </label>
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
