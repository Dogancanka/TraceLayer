import type { ReactNode, SVGProps } from 'react';

/** Minimal stroke icons (feather-style), sized for the toolbar. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const LayersPlusIcon = () => (
  <Icon>
    <path d="M12 3 3 8l9 5 9-5-9-5Z" />
    <path d="m3 14 9 5 3.5-1.9" />
    <path d="M19 14.5v6M16 17.5h6" />
  </Icon>
);

export const ImageIcon = () => (
  <Icon>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </Icon>
);

export const PenIcon = () => (
  <Icon>
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
  </Icon>
);

export const NoteIcon = () => (
  <Icon>
    <path d="M5 3h10l4 4v14H5Z" />
    <path d="M15 3v4h4" />
    <path d="M8 11h8M8 15h5" />
  </Icon>
);

export const CalloutIcon = () => (
  <Icon>
    <rect x="2" y="4" width="13" height="9" rx="2" />
    <path d="M6 13v4" />
    <path d="M15 8.5h6M21 8.5l-3-3M21 8.5l-3 3" />
  </Icon>
);

export const EraserIcon = () => (
  <Icon>
    <path d="m7 21-4.3-4.3a1.5 1.5 0 0 1 0-2.1l9.6-9.6a1.5 1.5 0 0 1 2.1 0l5.6 5.6a1.5 1.5 0 0 1 0 2.1L13 19.6a1.5 1.5 0 0 1-1 .4H7Z" />
    <path d="M22 21H7" />
    <path d="m8 8 8 8" />
  </Icon>
);

export const UndoIcon = () => (
  <Icon>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
  </Icon>
);

export const RedoIcon = () => (
  <Icon>
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 15-6.7L21 13" />
  </Icon>
);

export const RulerIcon = () => (
  <Icon>
    <rect x="2" y="8" width="20" height="8" rx="1" />
    <path d="M6 8v3M10 8v3M14 8v3M18 8v3" />
  </Icon>
);

export const GhostIcon = () => (
  <Icon>
    <path d="M12 3a7 7 0 0 0-7 7v10l2.5-2 2.5 2 2-2 2 2 2.5-2 2.5 2V10a7 7 0 0 0-7-7Z" />
    <circle cx="9.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
  </Icon>
);

export const SaveIcon = () => (
  <Icon>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </Icon>
);

export const FolderIcon = () => (
  <Icon>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z" />
  </Icon>
);

export const GearIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </Icon>
);

export const LockIcon = () => (
  <Icon>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);

export const UnlockIcon = () => (
  <Icon>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </Icon>
);

export const TrashIcon = () => (
  <Icon>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
);

export const ChevronDownIcon = () => (
  <Icon>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const ChevronUpIcon = () => (
  <Icon>
    <path d="m6 15 6-6 6 6" />
  </Icon>
);

export const ChevronLeftIcon = () => (
  <Icon>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const ChevronRightIcon = () => (
  <Icon>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

export const MinusIcon = () => (
  <Icon>
    <path d="M5 12h14" />
  </Icon>
);

export const XIcon = () => (
  <Icon>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

export const CameraIcon = () => (
  <Icon>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
    <circle cx="12" cy="13" r="4" />
  </Icon>
);

export const DropletIcon = () => (
  <Icon>
    <path d="M12 3s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11Z" />
  </Icon>
);

/** Tiny dropdown hint for buttons that open a popover. */
export const DropArrow = () => (
  <svg
    className="drop-arrow"
    width={7}
    height={7}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);
