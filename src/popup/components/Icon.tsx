// Tek-stroke ikon seti (1.6 weight, currentColor) — tasarım devir paketinden.
// Eski inline SVG'lerin ve emoji nav ikonlarının yerini alır.

const ICON_PATHS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  results: '<path d="M4 6h12M4 12h16M4 18h9"/>',
  bookmark: '<path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4.2L5 20V5a1 1 0 0 1 1-1z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7L5.6 5.6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M19.5 4.5l-1.8 1.8M6.3 17.7l-1.8 1.8"/>',
  moon: '<path d="M20 13.5A8 8 0 0 1 10.5 4 7 7 0 1 0 20 13.5z"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 6.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>',
  download: '<path d="M12 3v12M7 11l5 5 5-5M4 20h16"/>',
  filter: '<path d="M4 5h16l-6.4 7.5V19l-3.2 1.6v-8.1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>',
  pencil: '<path d="M16.5 3.5l4 4L8 20l-4.5 1L4.5 16.5z"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  word: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 9l1.4 6L11 11l1.6 4L14 9"/>',
  pdf: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h2.2a1.6 1.6 0 0 1 0 3.2H8zM8 8v8"/>',
  folderPlus: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 11v5M9.5 13.5h5"/>',
  scales: '<path d="M12 4.5v15M8.5 19.5h7M5 7.5h14M12 4.5 5 7.5M12 4.5l7 3"/><path d="M2.6 12.4 5 7.5l2.4 4.9a2.6 2.6 0 0 1-4.8 0Z"/><path d="M16.6 12.4 19 7.5l2.4 4.9a2.6 2.6 0 0 1-4.8 0Z"/><circle cx="12" cy="4" r="1.1"/>',
  sliders: '<path d="M4 8h10M18 8h2M4 16h2M10 16h10"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 4v4h-4M21 12a9 9 0 0 1-15 6.7L3 16M3 20v-4h4"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  empty: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 9h16M8 13h6"/>',
  textT: '<path d="M5 6h14M12 6v13M9 19h6"/>',
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function Icon({
  name,
  size = 18,
  stroke = 1.6,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] ?? '' }}
    />
  );
}
