interface ToolbarProps {
  ghost: boolean;
  opacity: number;
  onToggleGhost: () => void;
  onNewPaper: () => void;
  onImport: () => void;
  onOpacityChange: (value: number) => void;
  onSave: () => void;
  onLoad: () => void;
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
  onClose,
}: ToolbarProps) {
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
      <button type="button" className="close-btn" onClick={onClose} title="Quit TraceLayer">
        ✕
      </button>
    </div>
  );
}
