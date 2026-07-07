import type { CSSProperties } from 'react';
import type { PaperSheet } from '../types';

interface PaperStackProps {
  papers: PaperSheet[];
}

/**
 * Stack of tracing-paper sheets. Each new sheet mounts with a "placed on
 * top" drop animation (see .paper-sheet in styles.css); the tilt makes the
 * stack read as physical paper.
 */
export function PaperStack({ papers }: PaperStackProps) {
  return (
    <div className="paper-stack">
      {papers.map((paper) => (
        <div
          key={paper.id}
          className="paper-sheet"
          style={{ '--tilt': `${paper.tilt}deg` } as CSSProperties}
        />
      ))}
    </div>
  );
}
