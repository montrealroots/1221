/**
 * SLATE — how the press writes about your industry.
 *
 * Nothing here is a real article and nothing here was written by a real
 * publication. These are SLATE's paragraphs about SLATE's invented films,
 * built in the register a given outlet writes in, and every screen that shows
 * one says so.
 *
 * The problem this solves is repetition. A career runs for decades and the
 * trades cover it the whole way; a hundred stories that all read "X has been
 * cast in Y" is a world with one sentence in it. So a piece is assembled
 * rather than picked: a headline, a lede, the facts, the context around them
 * and what it means, each drawn from a bank of frames, and each frame itself
 * carrying slots filled from shared phrase banks. The combinations run into
 * the hundreds of thousands, and `tests/press.test.ts` measures how many
 * genuinely distinct pieces come out rather than multiplying array lengths
 * together and calling that the answer.
 *
 * Two rules hold throughout.
 *
 * A frame declares what facts it needs, and is never chosen unless the story
 * actually carries them. That is what stops a piece saying a film opened to
 * nothing when nobody counted the weekend.
 *
 * A piece only ever contains what a published story could contain. The
 * generator is given facts by its caller; it never reaches into the save for
 * something the player's character could not know.
 */

import type { Rng } from '../core/rng';
import type { Outlet, Register } from './press';

// ---------------------------------------------------------------------------
// What a story is about
// ---------------------------------------------------------------------------

export type StoryKind =
  // Development
  | 'setup' | 'greenlight' | 'attachment' | 'casting' | 'shelved' | 'rights'
  // Production
  | 'production_start' | 'wrap' | 'trouble' | 'test_screening'
  // Marketing
  | 'trailer' | 'date_change'
  // Release
  | 'festival_premiere' | 'reviews' | 'opening' | 'hold' | 'collapse' | 'record'
  // Television
  | 'renewal' | 'cancellation' | 'ratings'
  // Awards
  | 'nomination' | 'win'
  // Business
  | 'deal' | 'executive' | 'library' | 'labour' | 'earnings';

export const STORY_KINDS: readonly StoryKind[] = [
  'setup', 'greenlight', 'attachment', 'casting', 'shelved', 'rights',
  'production_start', 'wrap', 'trouble', 'test_screening',
  'trailer', 'date_change',
  'festival_premiere', 'reviews', 'opening', 'hold', 'collapse', 'record',
  'renewal', 'cancellation', 'ratings',
  'nomination', 'win',
  'deal', 'executive', 'library', 'labour', 'earnings',
];

/** Which desk a story belongs to. The context a piece reaches for follows from this. */
export type Desk = 'development' | 'production' | 'marketing' | 'release' | 'television' | 'awards' | 'business';

export const DESK_OF: Readonly<Record<StoryKind, Desk>> = {
  setup: 'development', greenlight: 'development', attachment: 'development',
  casting: 'development', shelved: 'development', rights: 'development',
  production_start: 'production', wrap: 'production', trouble: 'production',
  test_screening: 'production',
  trailer: 'marketing', date_change: 'marketing',
  festival_premiere: 'release', reviews: 'release', opening: 'release',
  hold: 'release', collapse: 'release', record: 'release',
  renewal: 'television', cancellation: 'television', ratings: 'television',
  nomination: 'awards', win: 'awards',
  deal: 'business', executive: 'business', library: 'business',
  labour: 'business', earnings: 'business',
};

export const STORY_KIND_LABEL: Readonly<Record<StoryKind, string>> = {
  setup: 'Set Up', greenlight: 'Greenlit', attachment: 'Attached', casting: 'Cast',
  shelved: 'Shelved', rights: 'Rights', production_start: 'Cameras Roll',
  wrap: 'Wrapped', trouble: 'Trouble On Set', test_screening: 'Test Screening',
  trailer: 'Trailer', date_change: 'Date Change', festival_premiere: 'Festival Premiere',
  reviews: 'The Notices', opening: 'Opening Weekend', hold: 'The Hold',
  collapse: 'The Drop', record: 'A Record', renewal: 'Renewed',
  cancellation: 'Cancelled', ratings: 'Ratings', nomination: 'Nominated',
  win: 'A Win', deal: 'A Deal', executive: 'A Seat Changes',
  library: 'Library', labour: 'Labour', earnings: 'Earnings',
};

// ---------------------------------------------------------------------------
// What a story knows
// ---------------------------------------------------------------------------

/**
 * Everything a piece can draw on.
 *
 * All optional but `kind`: a frame declares which of these it needs and is
 * only ever chosen when they are there, so a story is never written around a
 * number nobody counted.
 */
export interface StoryFacts {
  kind: StoryKind;
  /** The picture or series the story is about. */
  title?: string;
  format?: string;
  genres?: string[];
  certificate?: string;
  runtimeMinutes?: number;
  logline?: string;
  /** The company behind it. */
  studio?: string;
  network?: string;
  distributor?: string;
  /** People, already resolved to the names a piece would print. */
  person?: string;
  personRole?: string;
  director?: string;
  cast?: string[];
  writer?: string;
  executive?: string;
  executiveTitle?: string;
  successor?: string;
  /** What somebody else in the story has made before. */
  priorWork?: string;
  /** Money, all in cents. */
  budget?: number;
  money?: number;
  opening?: number;
  weekendGross?: number;
  runningTotal?: number;
  previousWeekend?: number;
  /** Counts and percentages. */
  theatres?: number;
  dropPercent?: number;
  multiple?: number;
  criticScore?: number;
  audienceScore?: number;
  reviewCount?: number;
  episodes?: number;
  seasons?: number;
  viewers?: number;
  rank?: number;
  nominations?: number;
  /** Time. */
  year?: number;
  dateLabel?: string;
  previousDateLabel?: string;
  daysOut?: number;
  shootDays?: number;
  /** Places and events. */
  city?: string;
  countryId?: string;
  festival?: string;
  award?: string;
  category?: string;
  /** Free text the caller already wrote, used verbatim where a frame calls for it. */
  note?: string;
  /** True when the story is about the player. Changes nothing but the framing. */
  aboutPlayer?: boolean;
}

/** What an outlet brings to a piece. Derived from the outlet, never stored. */
export interface Voice {
  outletId: string;
  name: string;
  shortName: string;
  register: Register;
  city: string;
  /** How much number a piece carries, 0 to 1. */
  numbers: number;
  /** How much opinion, 0 to 1. */
  opinion: number;
  /** How short the sentences run, 0 to 1, where 1 is shortest. */
  clip: number;
}

const REGISTER_SHAPE: Readonly<Record<Register, { numbers: number; opinion: number; clip: number }>> = {
  scoop: { numbers: 0.45, opinion: 0.15, clip: 0.90 },
  business: { numbers: 0.95, opinion: 0.20, clip: 0.45 },
  balanced: { numbers: 0.60, opinion: 0.25, clip: 0.50 },
  critical: { numbers: 0.35, opinion: 0.85, clip: 0.40 },
  enthusiast: { numbers: 0.30, opinion: 0.65, clip: 0.60 },
  essay: { numbers: 0.20, opinion: 0.95, clip: 0.15 },
  wire: { numbers: 0.70, opinion: 0.02, clip: 0.85 },
  aggregate: { numbers: 1.00, opinion: 0.05, clip: 0.75 },
};

export function voiceOf(outlet: Outlet): Voice {
  const shape = REGISTER_SHAPE[outlet.register];
  return {
    outletId: outlet.id, name: outlet.name, shortName: outlet.shortName,
    register: outlet.register, city: outlet.city, ...shape,
  };
}

// ---------------------------------------------------------------------------
// Frames
// ---------------------------------------------------------------------------

/**
 * One piece of a story.
 *
 * `needs` is the contract: a frame is never chosen unless the story carries
 * every fact it names. `write` returns one or two sentences and may draw on
 * the shared phrase banks, which is where most of the variety comes from —
 * six frames with three four-way slots is not six sentences, it is hundreds.
 */
export interface Frame {
  needs?: (keyof StoryFacts)[];
  /** Registers this frame belongs to. Absent means any. */
  only?: Register[];
  /**
   * Story kinds this frame belongs to. Absent means any kind on its desk.
   *
   * The desk banks are shared — a casting story and a greenlight story reach
   * for the same kind of context — but not every line on a desk fits every
   * story on it. A standfirst about a second-weekend hold has no business
   * above a piece announcing an opening.
   */
  kinds?: StoryKind[];
  write: (f: StoryFacts, v: Voice, r: Rng) => string;
}

/** The frames a story carries, and which of them fit. */
export function usable(frames: readonly Frame[], f: StoryFacts, v: Voice): Frame[] {
  return frames.filter((frame) => {
    if (frame.only && !frame.only.includes(v.register)) return false;
    if (frame.kinds && !frame.kinds.includes(f.kind)) return false;
    return (frame.needs ?? []).every((key) => {
      const value = f[key];
      if (value === undefined || value === null) return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    });
  });
}

// ---------------------------------------------------------------------------
// The finished piece
// ---------------------------------------------------------------------------

export interface Story {
  outletId: string;
  outletName: string;
  kind: StoryKind;
  desk: Desk;
  headline: string;
  /** The line under the headline. */
  standfirst: string;
  /** The piece itself, one string per paragraph. */
  paragraphs: string[];
  /** Everything the piece is built from, so nothing has to be re-derived to show it. */
  register: Register;
}

/** The whole piece as one block, for a search index or a repeat check. */
export function storyText(story: Story): string {
  return [story.headline, story.standfirst, ...story.paragraphs].join(' ');
}
