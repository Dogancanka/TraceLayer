import { useEffect, useState } from 'react';
import { uncalibratedScale } from '../types';
import type { ScaleCalibration, Tool } from '../types';

const SCALE_PRESETS = ['1:50', '1:100', '1:200'];
const PEN_COLORS = ['#3a3630', '#c0392b', '#2762c4', '#1e8a4c'];
const PEN_WIDTHS = [1, 2, 4];

interface ToolbarProps {
  ghost: boolean;
  opacity: number;
  tool: Tool;
  canUndo: boolean;
  canRedo: boolean;
  /** Opacity of the selected image, or null when nothing is selected. */
  selectedImageOpacity: number | null;
  scale: ScaleCalibration;
  onScaleChange: (scale: ScaleCalibration) => void;
  penColor: string;
  penWidth: number;
  onPenColorChange: (color: string) => void;
  onPenWidthChange: (width: number) => void;
  onNewProject: () => void;
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
  scale,
  onScaleChange,
  penColor,
  penWidth,
  onPenColorChange,
  onPenWidthChange,
  onNewProject,
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
  // One popover at a time; both are Edit Mode only, so Ghost Mode closes them.
  const [openPopover, setOpenPopover] = useState<'settings' | 'scale' | null>(null);
  const togglePopover = (which: 'settings' | 'scale') =>
    setOpenPopover((current) => (current === which ? null : which));

  useEffect(() => {
    if (ghost) setOpenPopover(null);
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

      <button
        type="button"
        onClick={onNewPaper}
        disabled={ghost}
        title="Place a new translucent sheet on top of the stack (does not clear anything)"
      >
        New Sheet
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
      {tool === 'pen' && (
        <div className="pen-options">
          {PEN_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`color-dot${penColor === color ? ' active' : ''}`}
              style={{ background: color }}
              onClick={() => onPenColorChange(color)}
              title={`Pen color ${color}`}
            />
          ))}
          {PEN_WIDTHS.map((width) => (
            <button
              key={width}
              type="button"
              className={`width-dot${penWidth === width ? ' active' : ''}`}
              onClick={() => onPenWidthChange(width)}
              title={`Pen width ${width} px`}
            >
              <span style={{ width: width + 2, height: width + 2 }} />
            </button>
          ))}
        </div>
      )}

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

      {/* Scale (målestok): label-only placeholder until real calibration lands. */}
      <div className="settings-wrap">
        <button
          type="button"
          className={`scale-btn${openPopover === 'scale' ? ' active' : ''}`}
          onClick={() => togglePopover('scale')}
          disabled={ghost}
          title="Drawing scale (målestok)"
        >
          {scale.drawingScale ?? 'Scale: –'}
        </button>
        {openPopover === 'scale' && (
          <div className="settings-popover scale-popover">
            <div className="settings-hints-title">
              Scale: {scale.drawingScale ?? 'Uncalibrated'}
            </div>
            <div className="scale-presets">
              {SCALE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={scale.drawingScale === preset ? 'active-tool' : ''}
                  onClick={() => onScaleChange({ ...scale, drawingScale: preset })}
                  title={`Label the drawing as ${preset} (no measurement yet)`}
                >
                  {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onScaleChange(uncalibratedScale())}
                title="Remove the scale label"
              >
                Clear
              </button>
            </div>
            <button type="button" disabled title="Measured calibration coming later">
              Calibrate…
            </button>
          </div>
        )}
      </div>

      <div className="settings-wrap">
        <button
          type="button"
          className={`settings-btn${openPopover === 'settings' ? ' active' : ''}`}
          onClick={() => togglePopover('settings')}
          disabled={ghost}
          title="Settings"
        >
          ⚙
        </button>
        {openPopover === 'settings' && (
          <div className="settings-popover">
            <button
              type="button"
              onClick={() => {
                setOpenPopover(null);
                onNewProject();
              }}
              title="Clear all sheets, drawings and images and start over"
            >
              New Project (clear workspace)
            </button>
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
