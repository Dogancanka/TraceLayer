import { useEffect, useState } from 'react';
import type { ScaleCalibration } from '../types';

// Keep in sync with .paper-sheet inset in styles.css (18px 18px 52px 18px —
// the bottom margin makes room for the full-width control bar chrome).
const TOP = 18;
const RIGHT = 18;
const BOTTOM = 52;
const LEFT = 18;
const THICKNESS = 16;

/** CSS reference pixel density; real-world sizes are approximate until measured calibration exists. */
const CSS_PX_PER_MM = 96 / 25.4;

/** Candidate major-tick steps in real mm, picked so majors are ≥ ~55 px apart. */
const MM_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

interface TickSpec {
  minorPx: number;
  minorsPerMajor: number;
  label: (px: number) => string;
  cornerLabel: string;
}

const trimNum = (v: number) => String(Math.round(v * 100) / 100);

function formatMm(mm: number): string {
  if (mm === 0) return '0';
  if (mm >= 1000) return `${trimNum(mm / 1000)} m`;
  if (mm >= 10) return `${trimNum(mm / 10)} cm`;
  return `${trimNum(mm)} mm`;
}

function computeTicks(scale: ScaleCalibration): TickSpec {
  const match = /^1:(\d+)$/.exec(scale.drawingScale ?? '');
  if (!match) {
    return {
      minorPx: 10,
      minorsPerMajor: 10,
      label: (px) => String(px),
      cornerLabel: 'px',
    };
  }
  // Real-world mm represented by one CSS px at this drawing scale.
  const realMmPerPx = Number(match[1]) / CSS_PX_PER_MM;
  const majorMm = MM_STEPS.find((step) => step / realMmPerPx >= 55) ?? MM_STEPS[MM_STEPS.length - 1];
  return {
    minorPx: majorMm / 5 / realMmPerPx,
    minorsPerMajor: 5,
    label: (px) => formatMm(px * realMmPerPx),
    cornerLabel: scale.drawingScale ?? '',
  };
}

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

interface RulerProps {
  scale: ScaleCalibration;
}

/**
 * Minimal corner ruler along the paper's top and left edges, in the sheet
 * margin. Uncalibrated: CSS px. With a scale preset (e.g. 1:100): real-world
 * lengths, computed from the CSS reference DPI — approximate until measured
 * calibration exists (hence the ≈ in the corner). Origin is the paper's
 * top-left corner.
 */
export function Ruler({ scale }: RulerProps) {
  const { w, h } = useWindowSize();
  const spec = computeTicks(scale);
  const width = Math.max(0, w - LEFT - RIGHT);
  const height = Math.max(0, h - TOP - BOTTOM);
  const approx = spec.cornerLabel !== 'px';

  const ticks = (length: number) => {
    const out: { pos: number; major: boolean; text: string | null }[] = [];
    for (let k = 0; k * spec.minorPx <= length; k++) {
      const pos = k * spec.minorPx;
      const major = k % spec.minorsPerMajor === 0;
      out.push({ pos, major, text: major && k > 0 ? spec.label(pos) : null });
    }
    return out;
  };

  return (
    <div className="ruler" aria-hidden>
      <svg
        className="ruler-top"
        style={{ left: LEFT, top: TOP - THICKNESS, width, height: THICKNESS }}
      >
        {ticks(width).map((t) => (
          <g key={t.pos}>
            <line
              x1={t.pos}
              x2={t.pos}
              y1={THICKNESS}
              y2={THICKNESS - (t.major ? 7 : 4)}
            />
            {t.text && (
              <text x={t.pos + 3} y={THICKNESS - 8}>
                {t.text}
              </text>
            )}
          </g>
        ))}
      </svg>
      <svg
        className="ruler-left"
        style={{ left: LEFT - THICKNESS, top: TOP, width: THICKNESS, height }}
      >
        {ticks(height).map((t) => (
          <g key={t.pos}>
            <line
              y1={t.pos}
              y2={t.pos}
              x1={THICKNESS}
              x2={THICKNESS - (t.major ? 7 : 4)}
            />
            {t.text && (
              <text x={THICKNESS - 8} y={t.pos + 3} transform={`rotate(-90 ${THICKNESS - 8} ${t.pos + 3})`}>
                {t.text}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div
        className="ruler-corner"
        style={{ left: LEFT - THICKNESS, top: TOP - THICKNESS }}
        title={approx ? 'Approximate until calibrated' : 'Uncalibrated (CSS pixels)'}
      >
        {approx ? `≈${spec.cornerLabel}` : 'px'}
      </div>
    </div>
  );
}
