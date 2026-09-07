/**
 * The glyphs on the phone.
 *
 * Drawn here as paths rather than pasted in as emoji, for two reasons. SLATE
 * carries no emoji outside its own brand mark, which a test enforces; and an
 * app that puts a picture of a magnifying glass where the magnifier control
 * belongs looks like a mock-up of an app rather than an app. These are
 * ordinary interface shapes — a magnifier, a bell, a thumb, a bar — drawn
 * from scratch. No third party icon set is copied or shipped.
 */

interface GlyphProps { size?: number; filled?: boolean }

function Svg({ size = 22, children, label }: { size?: number; children: React.ReactNode; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function SearchGlyph({ size }: GlyphProps) {
  return <Svg size={size}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></Svg>;
}

export function BellGlyph({ size }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.2 5.4 2 6.2H4c.8-.8 2-2.2 2-6.2Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Svg>
  );
}

export function HomeGlyph({ size, filled }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M4 11.2 12 4.5l8 6.7V20a.8.8 0 0 1-.8.8H4.8A.8.8 0 0 1 4 20Z" fill={filled ? 'currentColor' : 'none'} />
    </Svg>
  );
}

export function ShortsGlyph({ size, filled }: GlyphProps) {
  return (
    <Svg size={size}>
      <rect x="6.5" y="3.5" width="11" height="17" rx="4.5" fill={filled ? 'currentColor' : 'none'} />
      <path d="M10.6 9.4v5.2l4.2-2.6Z" fill={filled ? 'var(--ph-bg)' : 'currentColor'} stroke="none" />
    </Svg>
  );
}

export function SubsGlyph({ size, filled }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M5 7h14" /><path d="M3.5 11h17" />
      <rect x="3.5" y="14" width="17" height="6.5" rx="1.6" fill={filled ? 'currentColor' : 'none'} />
    </Svg>
  );
}

export function YouGlyph({ size, filled }: GlyphProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="8.6" r="3.6" fill={filled ? 'currentColor' : 'none'} />
      <path d="M4.8 20c.6-3.7 3.6-5.7 7.2-5.7s6.6 2 7.2 5.7" fill={filled ? 'currentColor' : 'none'} />
    </Svg>
  );
}

export function PlusGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M12 6v12M6 12h12" /></Svg>;
}

export function LikeGlyph({ size }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M7 10.5 11 4a2 2 0 0 1 3 1.8V9.5h4.2a1.8 1.8 0 0 1 1.75 2.2l-1.4 6.4A2 2 0 0 1 16.6 20H7Z" />
      <path d="M7 10.5V20H4.6A.6.6 0 0 1 4 19.4v-8.3a.6.6 0 0 1 .6-.6Z" />
    </Svg>
  );
}

export function DislikeGlyph({ size }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M17 13.5 13 20a2 2 0 0 1-3-1.8V14.5H5.8a1.8 1.8 0 0 1-1.75-2.2l1.4-6.4A2 2 0 0 1 7.4 4H17Z" />
      <path d="M17 13.5V4h2.4a.6.6 0 0 1 .6.6v8.3a.6.6 0 0 1-.6.6Z" />
    </Svg>
  );
}

export function ShareGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M4 13.5 20 6l-5.5 14-2.6-5.6Z" /><path d="M11.9 14.4 20 6" /></Svg>;
}

export function SaveGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M6.5 4h11a.8.8 0 0 1 .8.8V20l-6.3-3.6L5.7 20V4.8A.8.8 0 0 1 6.5 4Z" /></Svg>;
}

export function DownloadGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M12 4v11" /><path d="M7.5 10.5 12 15l4.5-4.5" /><path d="M4.5 19.5h15" /></Svg>;
}

export function CommentGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M4 5.6A1.6 1.6 0 0 1 5.6 4h12.8A1.6 1.6 0 0 1 20 5.6v8.8a1.6 1.6 0 0 1-1.6 1.6H9l-5 4Z" /></Svg>;
}

export function BackGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M19 12H5" /><path d="M11 6 5 12l6 6" /></Svg>;
}

export function MoreGlyph({ size = 18 }: GlyphProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="5.4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.6" r="1.4" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function CastGlyph({ size }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M4 12a7 7 0 0 1 7 7" /><path d="M4 16a3 3 0 0 1 3 3" />
      <circle cx="4.4" cy="19.4" r="0.9" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function DownGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M12 5v13" /><path d="M6.5 12.5 12 18l5.5-5.5" /></Svg>;
}

// --- Home screen marks ------------------------------------------------------

export function GearGlyph({ size = 28 }: GlyphProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" />
    </Svg>
  );
}

export function ClockGlyph({ size = 28 }: GlyphProps) {
  return <Svg size={size}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5.3l3.4 2" /></Svg>;
}

export function PhotosGlyph({ size = 28 }: GlyphProps) {
  return (
    <Svg size={size}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
      <circle cx="8.6" cy="9.6" r="1.6" />
      <path d="m4.4 17 4.9-4.6 3.5 3.2 3-2.6 4 3.6" />
    </Svg>
  );
}

export function MessagesGlyph({ size = 28 }: GlyphProps) {
  return <Svg size={size}><rect x="3.5" y="5" width="17" height="12" rx="2.2" /><path d="m4.5 6.5 7.5 5.6 7.5-5.6" /></Svg>;
}

export function MapsGlyph({ size = 28 }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M12 21s6.2-6.1 6.2-10.2A6.2 6.2 0 0 0 5.8 10.8C5.8 14.9 12 21 12 21Z" />
      <circle cx="12" cy="10.6" r="2.3" />
    </Svg>
  );
}

export function NotesGlyph({ size = 28 }: GlyphProps) {
  return (
    <Svg size={size}>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.4 8.4h7.2M8.4 12h7.2M8.4 15.6h4.4" />
    </Svg>
  );
}

export function WeatherGlyph({ size = 28 }: GlyphProps) {
  return (
    <Svg size={size}>
      <circle cx="9" cy="9.6" r="3" />
      <path d="M9.9 15.5A4 4 0 1 1 13.6 10a3.4 3.4 0 1 1 .5 6.8H9.9a.6.6 0 0 1 0-1.3Z" />
    </Svg>
  );
}

export function CameraGlyph({ size = 28 }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M3.5 8.4A1.9 1.9 0 0 1 5.4 6.5h2l1.3-2h6.6l1.3 2h2a1.9 1.9 0 0 1 1.9 1.9v8.6a1.9 1.9 0 0 1-1.9 1.9H5.4a1.9 1.9 0 0 1-1.9-1.9Z" />
      <circle cx="12" cy="12.6" r="3.4" />
    </Svg>
  );
}

export function CallGlyph({ size = 28 }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M6.4 3.8 9 4.6l1 3.4-2 1.6a11 11 0 0 0 6.4 6.4l1.6-2 3.4 1 .8 2.6a2 2 0 0 1-2 2.4A15.6 15.6 0 0 1 4 5.8a2 2 0 0 1 2.4-2Z" />
    </Svg>
  );
}
