import { useEffect, useState } from 'react';
import { uncalibratedScale } from '../types';
import type { ScaleCalibration, Tool } from '../types';
import {
  CalloutIcon,
  CameraIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DropArrow,
  DropletIcon,
  EraserIcon,
  FolderIcon,
  GearIcon,
  GhostIcon,
  ImageIcon,
  LayersPlusIcon,
  LockIcon,
  MinusIcon,
  NoteIcon,
  PenIcon,
  RedoIcon,
  RulerIcon,
  SaveIcon,
  TrashIcon,
  UndoIcon,
  UnlockIcon,
  XIcon,
} from './icons';

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
  calloutColor: string;
  onCalloutColorChange: (color: string) => void;
  /** 0-based index of the active sheet, and how many sheets exist. */
  sheetIndex: number;
  sheetCount: number;
  /** Navigate to the sheet above (later in the stack) / underneath. */
  onSheetUp: () => void;
  onSheetDown: () => void;
  /** Deletes the active sheet. Disabled in the UI when only one sheet exists. */
  onDeleteSheet: () => void;
  /** New Sheet sound preference (persisted in localStorage by the app). */
  sheetSoundOn: boolean;
  onToggleSheetSound: () => void;
  /** Locked state of the selected image, or null when no image is selected. */
  selectedImageLocked: boolean | null;
  onToggleImageLock: () => void;
  onNewProject: () => void;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleGhost: () => void;
  onNewPaper: () => void;
  onImport: () => void;
  onCapture: () => void;
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
  calloutColor,
  onCalloutColorChange,
  sheetIndex,
  sheetCount,
  onSheetUp,
  onSheetDown,
  onDeleteSheet,
  sheetSoundOn,
  onToggleSheetSound,
  selectedImageLocked,
  onToggleImageLock,
  onNewProject,
  onToolChange,
  onUndo,
  onRedo,
  onToggleGhost,
  onNewPaper,
  onImport,
  onCapture,
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
          <ChevronRightIcon />
          <span>TraceLayer</span>
        </button>
      </div>
    );
  }

  // Left toolbox: ONE compact column of icon buttons, grouped top-to-bottom:
  // sheet/import/snapshot → drawing/text/callout → navigation/delete →
  // scale/save/settings → view/window. Sized to fit entirely (no scrolling)
  // within the 500px minimum window height — see .toolbar in styles.css.
  return (
    <div className="toolbar">
      <div className="toolbar-grip" title="Drag to move window">
        ⠿
      </div>

      {/* sheet / import / snapshot */}
      <button
        type="button"
        className="icon-btn"
        onClick={onNewPaper}
        disabled={ghost}
        title="New Sheet: place a translucent sheet on top (clears nothing)"
      >
        <LayersPlusIcon />
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={onImport}
        disabled={ghost}
        title="Import PNG/JPG onto the active sheet"
      >
        <ImageIcon />
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={onCapture}
        disabled={ghost}
        title="Snapshot: capture the screen under the overlay onto the active sheet (aligned 1:1)"
      >
        <CameraIcon />
      </button>

      <div className="toolbar-sep" />

      <button
        type="button"
        className={`icon-btn${tool === 'pen' ? ' active-tool' : ''}`}
        onClick={() => onToolChange(tool === 'pen' ? 'select' : 'pen')}
        disabled={ghost}
        title="Pen: draw on the active sheet"
      >
        <PenIcon />
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
        className={`icon-btn${tool === 'eraser' ? ' active-tool' : ''}`}
        onClick={() => onToolChange(tool === 'eraser' ? 'select' : 'eraser')}
        disabled={ghost}
        title="Eraser: remove strokes from the active sheet"
      >
        <EraserIcon />
      </button>
      <button
        type="button"
        className={`icon-btn${tool === 'text' ? ' active-tool' : ''}`}
        onClick={() => onToolChange(tool === 'text' ? 'select' : 'text')}
        disabled={ghost}
        title="Text: click the active sheet to place a note"
      >
        <NoteIcon />
      </button>
      <button
        type="button"
        className={`icon-btn${tool === 'callout' ? ' active-tool' : ''}`}
        onClick={() => onToolChange(tool === 'callout' ? 'select' : 'callout')}
        disabled={ghost}
        title="Callout: click the active sheet to place a bubble with an arrow"
      >
        <CalloutIcon />
      </button>
      {tool === 'callout' && (
        <div className="pen-options">
          {PEN_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`color-dot${calloutColor === color ? ' active' : ''}`}
              style={{ background: color }}
              onClick={() => onCalloutColorChange(color)}
              title={`Callout color ${color}`}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        className="icon-btn"
        onClick={onUndo}
        disabled={ghost || !canUndo}
        title="Undo (Ctrl+Z)"
      >
        <UndoIcon />
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={onRedo}
        disabled={ghost || !canRedo}
        title="Redo (Ctrl+Y)"
      >
        <RedoIcon />
      </button>

      <div className="toolbar-sep" />

      {/* navigation / delete: which sheet in the stack new strokes/notes/imports
          land on. Not to be confused with the (disabled) PDF page-controller. */}
      <span className="sheet-label" title="Active sheet (target of new content)">
        Sheet {sheetIndex + 1}/{sheetCount}
      </span>
      <button
        type="button"
        className="icon-btn"
        onClick={onSheetUp}
        disabled={ghost || sheetIndex === sheetCount - 1}
        title="Sheet above (Alt+Up / PageUp)"
      >
        <ChevronUpIcon />
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={onSheetDown}
        disabled={ghost || sheetIndex === 0}
        title="Sheet underneath (Alt+Down / PageDown)"
      >
        <ChevronDownIcon />
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={onDeleteSheet}
        disabled={ghost || sheetCount <= 1}
        title={sheetCount <= 1 ? 'The last sheet cannot be deleted' : 'Delete the active sheet (asks first if it has content)'}
      >
        <TrashIcon />
      </button>
      <div className="toolbar-sep" />

      {/* Scale (målestok): label-only placeholder until real calibration lands.
          (The old disabled PDF page-controller placeholder was removed from the
          toolbox to keep the single column within the 500px minimum window
          height — multi-page support remains reserved via DocumentPages in
          types.ts.) */}
      <div className="settings-wrap">
        <button
          type="button"
          className={`icon-btn scale-btn${openPopover === 'scale' ? ' active-tool' : ''}`}
          onClick={() => togglePopover('scale')}
          disabled={ghost}
          title={`Drawing scale (målestok): ${scale.drawingScale ?? 'uncalibrated'}`}
        >
          <RulerIcon />
          <DropArrow />
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

      <button type="button" className="icon-btn" onClick={onSave} disabled={ghost} title="Save project as JSON">
        <SaveIcon />
      </button>
      <button type="button" className="icon-btn" onClick={onLoad} disabled={ghost} title="Load project JSON">
        <FolderIcon />
      </button>

      <div className="settings-wrap">
        <button
          type="button"
          className={`icon-btn settings-btn${openPopover === 'settings' ? ' active-tool' : ''}`}
          onClick={() => togglePopover('settings')}
          disabled={ghost}
          title="Settings"
        >
          <GearIcon />
          <DropArrow />
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
            <button
              type="button"
              onClick={onToggleSheetSound}
              title="Play a paper sound when a new sheet is added"
            >
              New Sheet sound: {sheetSoundOn ? 'On' : 'Off'}
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
                <span>Prev / Next sheet</span>
                <span>Alt+↑/↓, PgUp/PgDn</span>
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

      {/* view / window: ghost, opacity, image controls, collapse/hide/close */}
      <label className="opacity-control" title="Paper opacity">
        <DropletIcon />
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
          <ImageIcon />
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
      {selectedImageLocked !== null && (
        <button
          type="button"
          className={`icon-btn${selectedImageLocked ? ' active-tool' : ''}`}
          onClick={onToggleImageLock}
          disabled={ghost}
          title={
            selectedImageLocked
              ? 'Unlock image (locked images cannot be moved, scaled, rotated or deleted)'
              : 'Lock image against accidental move/scale/rotate/delete'
          }
        >
          {selectedImageLocked ? <LockIcon /> : <UnlockIcon />}
        </button>
      )}

      <button
        type="button"
        className={`icon-btn ghost-toggle${ghost ? ' active' : ''}`}
        onClick={onToggleGhost}
        title="Ghost Mode: clicks pass through to the app underneath (Ctrl+Alt+G)"
      >
        <GhostIcon />
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setCollapsed(true)}
        title="Collapse controls"
      >
        <ChevronLeftIcon />
      </button>
      <button type="button" className="icon-btn" onClick={onHide} title="Hide overlay (minimize)">
        <MinusIcon />
      </button>
      <button type="button" className="icon-btn close-btn" onClick={onClose} title="Quit TraceLayer">
        <XIcon />
      </button>
    </div>
  );
}
