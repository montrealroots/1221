/**
 * SLATE — how each publication looks on the page.
 *
 * A masthead is most of what makes a publication recognisable, and a page of
 * stories that all use the same face is a page where every outlet reads the
 * same. So each one is set differently.
 *
 * Two things are kept strictly apart here, and the screen says which is which.
 *
 * `realTypeface` is the record: the face a publication actually uses, where
 * that is publicly documented. Several of those are commissioned, proprietary
 * faces — Guardian Egyptian, Cheltenham, Financier — which SLATE has no
 * licence to and does not ship. Where the record is not clear, the field is
 * simply absent rather than guessed at.
 *
 * `style` is SLATE's: a freely licensed face, served from Google Fonts, chosen
 * to sit in roughly the same part of the type spectrum so that two outlets are
 * visibly different from each other. It is a stand-in, it is never presented
 * as the publication's own type, and the profile panel says so in as many
 * words.
 *
 * Ten styles rather than forty, shared by character, so the page loads ten
 * families instead of a phone book.
 */

export type TypeStyleId =
  | 'didone' | 'slab' | 'transitional' | 'oldstyle' | 'grotesque'
  | 'condensed' | 'geometric' | 'humanist' | 'newspaper' | 'mono';

export interface TypeStyle {
  id: TypeStyleId;
  /** What kind of type this is, in the words a designer would use. */
  label: string;
  /** The face headlines are set in. Google Fonts family name. */
  headline: string;
  /** The face the body is set in. */
  body: string;
  /** CSS stacks, with a real fallback so nothing collapses if the font is blocked. */
  headlineStack: string;
  bodyStack: string;
  /** Weight and spacing that make the face read the way it should. */
  headlineWeight: number;
  headlineTracking: string;
}

export const TYPE_STYLES: Readonly<Record<TypeStyleId, TypeStyle>> = {
  didone: {
    id: 'didone', label: 'High-Contrast Serif',
    headline: 'Playfair Display', body: 'Source Sans 3',
    headlineStack: "'Playfair Display', 'Didot', 'Bodoni MT', Georgia, serif",
    bodyStack: "'Source Sans 3', 'Helvetica Neue', Arial, sans-serif",
    headlineWeight: 700, headlineTracking: '-0.01em',
  },
  slab: {
    id: 'slab', label: 'Slab Serif',
    headline: 'Zilla Slab', body: 'Noto Serif',
    headlineStack: "'Zilla Slab', 'Rockwell', 'Courier New', serif",
    bodyStack: "'Noto Serif', Georgia, 'Times New Roman', serif",
    headlineWeight: 700, headlineTracking: '-0.005em',
  },
  transitional: {
    id: 'transitional', label: 'Transitional Serif',
    headline: 'Libre Baskerville', body: 'Source Serif 4',
    headlineStack: "'Libre Baskerville', Baskerville, Georgia, serif",
    bodyStack: "'Source Serif 4', Georgia, 'Times New Roman', serif",
    headlineWeight: 700, headlineTracking: '0',
  },
  oldstyle: {
    id: 'oldstyle', label: 'Old-Style Serif',
    headline: 'EB Garamond', body: 'EB Garamond',
    headlineStack: "'EB Garamond', Garamond, Georgia, serif",
    bodyStack: "'EB Garamond', Garamond, Georgia, serif",
    headlineWeight: 600, headlineTracking: '0.005em',
  },
  grotesque: {
    id: 'grotesque', label: 'Grotesque Sans',
    headline: 'Archivo', body: 'Inter',
    headlineStack: "'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    bodyStack: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    headlineWeight: 700, headlineTracking: '-0.015em',
  },
  condensed: {
    id: 'condensed', label: 'Condensed Sans',
    headline: 'Oswald', body: 'Barlow',
    headlineStack: "'Oswald', 'Arial Narrow', 'Helvetica Neue Condensed', sans-serif",
    bodyStack: "'Barlow', 'Helvetica Neue', Arial, sans-serif",
    headlineWeight: 600, headlineTracking: '0.01em',
  },
  geometric: {
    id: 'geometric', label: 'Geometric Sans',
    headline: 'Space Grotesk', body: 'Inter',
    headlineStack: "'Space Grotesk', 'Futura', 'Century Gothic', sans-serif",
    bodyStack: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    headlineWeight: 700, headlineTracking: '-0.02em',
  },
  humanist: {
    id: 'humanist', label: 'Humanist Sans',
    headline: 'Nunito Sans', body: 'Nunito Sans',
    headlineStack: "'Nunito Sans', 'Segoe UI', 'Helvetica Neue', sans-serif",
    bodyStack: "'Nunito Sans', 'Segoe UI', 'Helvetica Neue', sans-serif",
    headlineWeight: 800, headlineTracking: '-0.01em',
  },
  newspaper: {
    id: 'newspaper', label: 'Newspaper Serif',
    headline: 'Lora', body: 'Lora',
    headlineStack: "'Lora', Georgia, 'Times New Roman', serif",
    bodyStack: "'Lora', Georgia, 'Times New Roman', serif",
    headlineWeight: 700, headlineTracking: '0',
  },
  mono: {
    id: 'mono', label: 'Monospaced',
    headline: 'IBM Plex Mono', body: 'IBM Plex Sans',
    headlineStack: "'IBM Plex Mono', 'SF Mono', Menlo, monospace",
    bodyStack: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
    headlineWeight: 600, headlineTracking: '-0.02em',
  },
};

export interface Typography {
  style: TypeStyleId;
  /**
   * The face the publication actually uses, where the record is clear. Absent
   * where it is not — a guess dressed as a fact is exactly what this game does
   * not do. These are proprietary faces SLATE does not ship and does not
   * reproduce; the field exists so the screen can say what the real thing is
   * while showing something else.
   */
  realTypeface?: string;
}

/**
 * Which face each outlet is set in.
 *
 * The pairings are chosen so that two outlets a player sees side by side never
 * look the same, and so that a publication's type sits in the right family —
 * a wire service should not read like a quarterly of film criticism.
 */
export const TYPOGRAPHY: Readonly<Record<string, Typography>> = {
  // American trades
  variety: { style: 'didone' },
  'hollywood-reporter': { style: 'transitional' },
  deadline: { style: 'grotesque' },
  indiewire: { style: 'geometric' },
  thewrap: { style: 'humanist' },
  puck: { style: 'oldstyle' },
  nexttv: { style: 'condensed' },

  // International trades
  'screen-international': { style: 'slab' },
  c21: { style: 'condensed' },
  'le-film-francais': { style: 'oldstyle' },
  'blickpunkt-film': { style: 'grotesque' },
  'kinema-junpo': { style: 'newspaper' },
  'bollywood-hungama': { style: 'humanist' },
  fotogramas: { style: 'didone' },

  // Criticism
  'sight-and-sound': { style: 'transitional' },
  cahiers: { style: 'oldstyle' },
  'film-comment': { style: 'newspaper' },
  'little-white-lies': { style: 'geometric' },
  rogerebert: { style: 'newspaper' },

  // Consumer
  empire: { style: 'condensed' },
  'total-film': { style: 'grotesque' },
  vulture: { style: 'didone' },
  slashfilm: { style: 'geometric' },
  collider: { style: 'humanist' },
  screenrant: { style: 'humanist' },
  'the-playlist': { style: 'slab' },
  'av-club': { style: 'mono' },

  // Aggregators
  'rotten-tomatoes': { style: 'humanist' },
  metacritic: { style: 'grotesque' },
  'box-office-mojo': { style: 'mono' },
  'the-numbers': { style: 'mono' },
  letterboxd: { style: 'geometric', realTypeface: 'Graphik' },

  // Newspapers — the ones whose commissioned faces are a matter of record.
  nyt: { style: 'transitional', realTypeface: 'Cheltenham for headlines, Imperial for text' },
  latimes: { style: 'newspaper' },
  guardian: { style: 'slab', realTypeface: 'Guardian Egyptian and Guardian Headline, commissioned from Commercial Type' },
  wsj: { style: 'transitional', realTypeface: 'Escrow and Exchange' },
  ft: { style: 'oldstyle', realTypeface: 'Financier and Metric, commissioned from Commercial Type' },
  'washington-post': { style: 'newspaper', realTypeface: 'Postoni for headlines' },
  'le-monde': { style: 'oldstyle', realTypeface: 'Le Monde Journal, drawn by Jean François Porchez' },

  // Wires
  reuters: { style: 'grotesque' },
  ap: { style: 'newspaper' },
  afp: { style: 'grotesque' },
  bloomberg: { style: 'mono' },
};

/** The type an outlet is set in, falling back to something readable. */
export function typeFor(outletId: string): { style: TypeStyle; realTypeface?: string } {
  const entry = TYPOGRAPHY[outletId];
  const style = TYPE_STYLES[entry?.style ?? 'newspaper'];
  return { style, realTypeface: entry?.realTypeface };
}

/**
 * Every family the press needs, for the one stylesheet link that loads them.
 *
 * Ten styles, twenty families at most, requested in a single call so the page
 * makes one request rather than forty.
 */
export function fontFamilies(): string[] {
  const wanted = new Set<string>();
  for (const style of Object.values(TYPE_STYLES)) {
    wanted.add(style.headline);
    wanted.add(style.body);
  }
  return [...wanted].sort();
}

/** The Google Fonts URL that loads all of them at the weights the styles use. */
export function fontStylesheetHref(): string {
  const families = fontFamilies()
    .map((family) => `family=${family.replace(/ /g, '+')}:wght@400;600;700;800`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
