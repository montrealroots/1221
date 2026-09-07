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
  // Two rounded screens leaning right and overlapping, which is the shape the
  // shorts tab has, with a solid play triangle through the waist. Both are
  // filled rather than stroked so their union comes out as one silhouette; the
  // outline state is the same silhouette with a smaller one punched out of it.
  // Drawn from that geometry, not traced: SLATE ships no third party artwork.
  const shell = (inset: number, fill: string) => (
    <g transform="rotate(20 12 12)" fill={fill} stroke="none">
      <rect x={5.6 + inset} y={2.4 + inset} width={8.2 - inset * 2} height={12.4 - inset * 2} rx={4.1 - inset} />
      <rect x={10.2 + inset} y={9.2 + inset} width={8.2 - inset * 2} height={12.4 - inset * 2} rx={4.1 - inset} />
    </g>
  );
  return (
    <Svg size={size}>
      {shell(0, 'currentColor')}
      {!filled && shell(1.5, 'var(--ph-bg)')}
      <path
        d="M10.5 9.5l4.6 2.5-4.6 2.5v-5z"
        fill={filled ? 'var(--ph-bg)' : 'currentColor'}
        stroke="none"
      />
    </Svg>
  );
}

export function SubsGlyph({ size, filled }: GlyphProps) {
  // A screen with a solid play triangle in it and the panel behind it peeking
  // out along the top, which is the shape the subscriptions tab uses.
  return (
    <Svg size={size}>
      <path d="M6.5 4.5h11" />
      <rect x="3.5" y="7.5" width="17" height="12.5" rx="2.2" fill={filled ? 'currentColor' : 'none'} />
      <path
        d="M10.4 11l4.6 2.7-4.6 2.7v-5.4z"
        fill={filled ? 'var(--ph-bg)' : 'currentColor'}
        stroke="none"
      />
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

/** The plus on its own disc, which is what the create tab is. */
export function CreateGlyph({ size }: GlyphProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="10.5" fill="var(--ph-raised)" stroke="none" />
      <path d="M12 7.4v9.2M7.4 12h9.2" strokeWidth={1.9} />
    </Svg>
  );
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

/** The slashed circle the text app's assistant sits behind. */
export function AskGlyph({ size }: GlyphProps) {
  return <Svg size={size}><circle cx="12" cy="12" r="7.2" /><path d="M19.5 3.5L8.5 18.5" /></Svg>;
}

/** Two people, which is what a community is. */
export function PeopleGlyph({ size }: GlyphProps) {
  return (
    <Svg size={size}>
      <circle cx="9" cy="8.5" r="3.1" /><path d="M3.5 19a5.7 5.7 0 0 1 11 0" />
      <circle cx="17" cy="9.5" r="2.4" /><path d="M15.5 15.4a4.8 4.8 0 0 1 5 3.6" />
    </Svg>
  );
}

/** A list, which is lines inside a card. */
export function ListGlyph({ size }: GlyphProps) {
  return <Svg size={size}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M7.5 9.5h9M7.5 13h9M7.5 16.5h5" /></Svg>;
}

/** A microphone in a ring, which is a live room. */
export function SpacesGlyph({ size }: GlyphProps) {
  return <Svg size={size}><circle cx="12" cy="12" r="8.5" /><rect x="10" y="8" width="4" height="6" rx="2" /><path d="M8.4 12.6a3.6 3.6 0 0 0 7.2 0" /></Svg>;
}

/** The studio, drawn as what a launch looks like. */
export function RocketGlyph({ size }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M12 3.5c3.4 2.3 5 5.4 5 8.6l-2.6 3.2h-4.8L7 12.1c0-3.2 1.6-6.3 5-8.6z" />
      <circle cx="12" cy="10.4" r="1.7" />
      <path d="M9.6 15.3L7.5 20l3.2-1.6M14.4 15.3L16.5 20l-3.2-1.6" />
    </Svg>
  );
}

/** A circle with a line through it, which is what blocked looks like. */
export function BlockGlyph({ size }: GlyphProps) {
  return <Svg size={size}><circle cx="12" cy="12" r="8.5" /><path d="M6 6l12 12" /></Svg>;
}

/** A person in a ring, which is where an account lives. */
export function AccountGlyph({ size }: GlyphProps) {
  return <Svg size={size}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="10" r="2.8" /><path d="M6.8 18.4a5.6 5.6 0 0 1 10.4 0" /></Svg>;
}

/** A question in a ring. */
export function HelpGlyph({ size }: GlyphProps) {
  return <Svg size={size}><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.8c0 1.7-2.4 2-2.4 3.4" /><path d="M12 17h.01" /></Svg>;
}

/** A shield, which is where privacy lives. */
export function ShieldGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M12 3.5l7 2.6v5.4c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6.1l7-2.6z" /><path d="M9 12l2.2 2.2L15.4 10" /></Svg>;
}

/** A card with a line across it, which is what a timeline setting shows. */
export function TimelineGlyph({ size }: GlyphProps) {
  return <Svg size={size}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="M3.5 10h17M8 14h8" /></Svg>;
}

/** The three bars an app puts its own menu behind. */
export function MenuGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
}

/** The sliders a search page filters itself with. */
export function SlidersGlyph({ size }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M3 7h6M15 7h6M3 17h10M19 17h2" />
      <circle cx="12" cy="7" r="2.6" /><circle cx="16" cy="17" r="2.6" />
    </Svg>
  );
}

/** The square and pencil that starts a message. */
export function ComposeGlyph({ size }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M11 4.5H5.5A1.5 1.5 0 0 0 4 6v12a1.5 1.5 0 0 0 1.5 1.5h12A1.5 1.5 0 0 0 19 18v-5.5" />
      <path d="M17.2 3.6a1.9 1.9 0 0 1 2.7 2.7L12.6 13.6l-3.4.7.7-3.4 7.3-7.3z" />
    </Svg>
  );
}

/** A padlock, which is what a private account puts beside its name. */
export function LockGlyph({ size }: GlyphProps) {
  return (
    <Svg size={size}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.4 10.5V8a3.6 3.6 0 0 1 7.2 0v2.5" />
    </Svg>
  );
}

/** The eye a view count sits beside. */
export function EyeGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.7" /></Svg>;
}

/** The card a tagged photograph goes behind. */
export function TaggedGlyph({ size, filled }: GlyphProps) {
  return (
    <Svg size={size}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill={filled ? 'currentColor' : 'none'} />
      <circle cx="12" cy="10.5" r="2.4" stroke={filled ? 'var(--ph-bg)' : 'currentColor'} />
      <path d="M8 16.2a4.4 4.4 0 0 1 8 0" stroke={filled ? 'var(--ph-bg)' : 'currentColor'} />
    </Svg>
  );
}

/** The check inside a verified badge. Drawn, like everything else here. */
export function TickGlyph({ size = 11 }: GlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5.5 12.5l4.4 4.3L18.5 8" />
    </svg>
  );
}

/** The photo app's like, which is a heart and not a thumb. */
export function HeartGlyph({ size, filled }: GlyphProps) {
  return (
    <Svg size={size}>
      <path
        d="M12 20.5S3.5 15.2 3.5 9.4A4.9 4.9 0 0 1 12 6.2a4.9 4.9 0 0 1 8.5 3.2c0 5.8-8.5 11.1-8.5 11.1z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </Svg>
  );
}

/** A speech bubble, which is what a comment is on both of the other two apps. */
export function BubbleGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M20.5 12c0 4.1-3.8 7.4-8.5 7.4a10 10 0 0 1-2.8-.4L4.5 20.5l1.4-3.6A7 7 0 0 1 3.5 12c0-4.1 3.8-7.4 8.5-7.4s8.5 3.3 8.5 7.4z" /></Svg>;
}

/** The paper plane. Sharing a post is sending it to somebody. */
export function SendGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M21 3L10.5 13.5" /><path d="M21 3l-6.8 18-3.7-7.5L3 9.8 21 3z" /></Svg>;
}

export function BookmarkGlyph({ size, filled }: GlyphProps) {
  return <Svg size={size}><path d="M6 3.5h12v17l-6-4.4-6 4.4v-17z" fill={filled ? 'currentColor' : 'none'} /></Svg>;
}

/** The grid on a profile, which is how a photo account is read. */
export function GridGlyph({ size, filled }: GlyphProps) {
  return (
    <Svg size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" fill={filled ? 'currentColor' : 'none'} />
      <path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17" stroke={filled ? 'var(--ph-bg)' : 'currentColor'} />
    </Svg>
  );
}

/** The reel, which is a frame with the diagonal of a film strip across it. */
export function ReelsGlyph({ size, filled }: GlyphProps) {
  return (
    <Svg size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" fill={filled ? 'currentColor' : 'none'} />
      <path d="M3.8 9h16.4M8.6 3.6L11.4 9M14.4 3.6L17.2 9" stroke={filled ? 'var(--ph-bg)' : 'currentColor'} />
      <path d="M10.4 12.4l4.4 2.6-4.4 2.6v-5.2z" fill={filled ? 'var(--ph-bg)' : 'none'} stroke={filled ? 'var(--ph-bg)' : 'currentColor'} />
    </Svg>
  );
}

/** The two arrows a post goes round on again. */
export function RepostGlyph({ size }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M4.5 8.5h11a3 3 0 0 1 3 3v1.5" /><path d="M7.5 5.5l-3 3 3 3" />
      <path d="M19.5 15.5h-11a3 3 0 0 1-3-3V11" /><path d="M16.5 18.5l3-3-3-3" />
    </Svg>
  );
}

/** The bars beside a post that say how many people it was put in front of. */
export function ViewsGlyph({ size }: GlyphProps) {
  return <Svg size={size}><path d="M4.5 19.5V13M9.5 19.5V8.5M14.5 19.5v-9M19.5 19.5V5" /></Svg>;
}

export function CallGlyph({ size = 28 }: GlyphProps) {
  return (
    <Svg size={size}>
      <path d="M6.4 3.8 9 4.6l1 3.4-2 1.6a11 11 0 0 0 6.4 6.4l1.6-2 3.4 1 .8 2.6a2 2 0 0 1-2 2.4A15.6 15.6 0 0 1 4 5.8a2 2 0 0 1 2.4-2Z" />
    </Svg>
  );
}
