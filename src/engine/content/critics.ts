/**
 * SLATE — the critics, and how reception is actually counted.
 *
 * The outlets are the real ones. What SLATE invents is each outlet's taste
 * (how much it prizes prestige, how it leans by genre, how harsh it runs),
 * calibrated from its reputation and marked as SLATE's estimate. A review's
 * verdict is generated inside a save; no invented verdict is ever attributed
 * to a named living critic, which is why reviews carry the outlet and not a
 * byline.
 *
 * The aggregators follow their published rules:
 *   - Rotten Tomatoes: the Tomatometer is the share of counted reviews that
 *     are positive; 60% is the Fresh line; Certified Fresh needs a steady
 *     75% or better with 80 reviews for a wide release (40 for limited, 20
 *     for a television season), five of them from Top Critics. The audience
 *     score is the share of audience ratings of 3.5 stars or more.
 *   - Metacritic: a weighted average of critic scores on a 0-100 scale;
 *     61 and up is green, 40-60 yellow, below 40 red; Must-See needs 81 or
 *     better from at least 15 critics. The weights are undisclosed, so the
 *     tiers here are SLATE's estimate.
 *   - CinemaScore: opening-night audiences of wide releases grade A+ to F.
 *   - IMDb: a weighted average of user votes out of 10, which needs a body of
 *     votes before it means anything.
 */

import { Registry, REFERENCE_VERSION, type ReferenceRecord } from './reference';

export type OutletKind = 'trade' | 'newspaper' | 'magazine' | 'online' | 'broadcaster' | 'genre' | 'television';
export type ReviewScale = 'stars5' | 'stars4' | 'ten' | 'hundred' | 'letter' | 'percent';
export type Coverage = 'everything' | 'wide' | 'prestige' | 'genre' | 'television' | 'home';
export type ReviewTiming = 'festival' | 'embargo' | 'release' | 'late';
export type MetacriticTier = 'highest' | 'high' | 'standard' | 'low' | 'none';

export interface Outlet extends ReferenceRecord {
  type: OutletKind;
  countryId: string;
  scale: ReviewScale;
  /** Designated a Top Critic outlet by Rotten Tomatoes. */
  topCritic: boolean;
  metacriticTier: MetacriticTier;
  coverage: Coverage[];
  formats: ('film' | 'tv')[];
  /** 0-100 how much craft and ambition weigh against entertainment. */
  prestigeBias: number;
  /** 0-100 how much crowd-pleasing weighs. */
  populism: number;
  /** Points added to every score: a harsh desk runs negative. */
  harshness: number;
  /** Spread of an individual verdict around the outlet's read. */
  variance: number;
  genreLean: Partial<Record<string, number>>;
  timing: ReviewTiming;
  /** Only reviews work from these countries, plus anything released wide in its own market. */
  homeCountries?: string[];
  /** A genre desk: reviews only work in these genres. */
  onlyGenres?: string[];
  description: string;
}

const V = REFERENCE_VERSION;
const EST = { source: 'calibrated_estimate', confidence: 'medium', version: V, note: 'A real outlet. Its taste is SLATE\'s calibration, and no verdict here is attributed to a named critic.' } as const;
const O = (o: Omit<Outlet, 'source' | 'confidence' | 'version' | 'note'>): Outlet => ({ ...o, ...EST });

export const OUTLETS = new Registry<Outlet>('outlets', [
  // Trades: first to publish, at the premiere or the second the embargo lifts.
  O({ id: 'variety', name: 'Variety', type: 'trade', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'highest', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 60, populism: 45, harshness: 0, variance: 9, genreLean: {}, timing: 'festival', description: 'The trade of record. Reviews everything, first.' }),
  O({ id: 'hollywood-reporter', name: 'The Hollywood Reporter', type: 'trade', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'highest', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 62, populism: 42, harshness: 0, variance: 9, genreLean: {}, timing: 'festival', description: 'The other trade of record.' }),
  O({ id: 'deadline', name: 'Deadline', type: 'trade', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'standard', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 50, populism: 55, harshness: 2, variance: 10, genreLean: {}, timing: 'festival', description: 'Business-first trade with a generous reviewing desk.' }),
  O({ id: 'indiewire', name: 'IndieWire', type: 'online', countryId: 'us', scale: 'letter', topCritic: true, metacriticTier: 'high', coverage: ['everything', 'prestige'], formats: ['film', 'tv'], prestigeBias: 78, populism: 30, harshness: -2, variance: 10, genreLean: { documentary: 6, experimental: 8, action: -4 }, timing: 'festival', description: 'Festival-first, letter grades, and unmoved by a marketing budget.' }),
  O({ id: 'screen-daily', name: 'Screen International', type: 'trade', countryId: 'uk', scale: 'hundred', topCritic: true, metacriticTier: 'standard', coverage: ['everything', 'prestige'], formats: ['film'], prestigeBias: 70, populism: 35, harshness: 0, variance: 9, genreLean: {}, timing: 'festival', description: 'The international trade, at every festival that matters.' }),
  O({ id: 'the-wrap', name: 'TheWrap', type: 'online', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'standard', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 52, populism: 50, harshness: 0, variance: 10, genreLean: {}, timing: 'embargo', description: 'Hollywood coverage with a full reviewing slate.' }),

  // Papers of record.
  O({ id: 'nyt', name: 'The New York Times', type: 'newspaper', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'highest', coverage: ['everything', 'prestige'], formats: ['film', 'tv'], prestigeBias: 72, populism: 30, harshness: -1, variance: 10, genreLean: { documentary: 5, horror: -3 }, timing: 'embargo', description: 'The review the campaign quotes if it can.' }),
  O({ id: 'la-times', name: 'Los Angeles Times', type: 'newspaper', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'highest', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 64, populism: 40, harshness: 0, variance: 10, genreLean: {}, timing: 'embargo', description: 'The industry town\'s own paper.' }),
  O({ id: 'washington-post', name: 'The Washington Post', type: 'newspaper', countryId: 'us', scale: 'stars4', topCritic: true, metacriticTier: 'high', coverage: ['wide', 'prestige'], formats: ['film', 'tv'], prestigeBias: 60, populism: 42, harshness: 0, variance: 10, genreLean: {}, timing: 'embargo', description: 'Four stars, and a reviewing desk that likes a film with something to say.' }),
  O({ id: 'wsj', name: 'The Wall Street Journal', type: 'newspaper', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'high', coverage: ['wide', 'prestige'], formats: ['film', 'tv'], prestigeBias: 58, populism: 38, harshness: -3, variance: 11, genreLean: { horror: -5 }, timing: 'embargo', description: 'A sceptical desk that is hard to please.' }),
  O({ id: 'chicago-sun-times', name: 'Chicago Sun-Times', type: 'newspaper', countryId: 'us', scale: 'stars4', topCritic: true, metacriticTier: 'high', coverage: ['everything'], formats: ['film'], prestigeBias: 58, populism: 48, harshness: 1, variance: 10, genreLean: {}, timing: 'embargo', description: 'Ebert\'s paper, still reviewing on four stars.' }),
  O({ id: 'rogerebert', name: 'RogerEbert.com', type: 'online', countryId: 'us', scale: 'stars4', topCritic: true, metacriticTier: 'high', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 62, populism: 45, harshness: 1, variance: 10, genreLean: { documentary: 4 }, timing: 'embargo', description: 'Reviews everything that opens, with a soft spot for sincerity.' }),
  O({ id: 'chicago-tribune', name: 'Chicago Tribune', type: 'newspaper', countryId: 'us', scale: 'stars4', topCritic: true, metacriticTier: 'high', coverage: ['wide', 'prestige'], formats: ['film'], prestigeBias: 58, populism: 44, harshness: 0, variance: 10, genreLean: {}, timing: 'embargo', description: 'A steady four-star desk.' }),
  O({ id: 'usa-today', name: 'USA Today', type: 'newspaper', countryId: 'us', scale: 'stars4', topCritic: true, metacriticTier: 'standard', coverage: ['wide'], formats: ['film', 'tv'], prestigeBias: 42, populism: 62, harshness: 2, variance: 9, genreLean: { family: 4, action: 3 }, timing: 'embargo', description: 'Reviews for the multiplex.' }),
  O({ id: 'ap', name: 'Associated Press', type: 'newspaper', countryId: 'us', scale: 'stars4', topCritic: true, metacriticTier: 'standard', coverage: ['wide', 'prestige'], formats: ['film'], prestigeBias: 52, populism: 50, harshness: 0, variance: 9, genreLean: {}, timing: 'embargo', description: 'Syndicated to a thousand papers.' }),
  O({ id: 'npr', name: 'NPR', type: 'broadcaster', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'standard', coverage: ['prestige', 'wide'], formats: ['film', 'tv'], prestigeBias: 66, populism: 36, harshness: 0, variance: 10, genreLean: { documentary: 5 }, timing: 'release', description: 'Public radio\'s reviewing desk.' }),

  // Magazines and the culture press.
  O({ id: 'new-yorker', name: 'The New Yorker', type: 'magazine', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'high', coverage: ['prestige'], formats: ['film', 'tv'], prestigeBias: 86, populism: 18, harshness: -4, variance: 12, genreLean: { experimental: 8, action: -8, family: -6 }, timing: 'release', description: 'Long, late and merciless with the middlebrow.' }),
  O({ id: 'the-atlantic', name: 'The Atlantic', type: 'magazine', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'high', coverage: ['prestige', 'wide'], formats: ['film', 'tv'], prestigeBias: 72, populism: 30, harshness: -1, variance: 10, genreLean: {}, timing: 'release', description: 'Essays more than notices.' }),
  O({ id: 'rolling-stone', name: 'Rolling Stone', type: 'magazine', countryId: 'us', scale: 'stars5', topCritic: true, metacriticTier: 'high', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 56, populism: 50, harshness: 2, variance: 11, genreLean: { musical: 6, biography: 3 }, timing: 'embargo', description: 'Enthusiastic, star-rated, and quotable.' }),
  O({ id: 'ew', name: 'Entertainment Weekly', type: 'magazine', countryId: 'us', scale: 'letter', topCritic: true, metacriticTier: 'standard', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 46, populism: 60, harshness: 2, variance: 9, genreLean: { comedy: 3, family: 3 }, timing: 'embargo', description: 'Letter grades for everything on the schedule.' }),
  O({ id: 'vulture', name: 'Vulture', type: 'online', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'high', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 66, populism: 40, harshness: -1, variance: 11, genreLean: { comedy: 3 }, timing: 'embargo', description: 'New York magazine\'s culture desk. Strong on television.' }),
  O({ id: 'slate', name: 'Slate', type: 'online', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'standard', coverage: ['prestige', 'wide'], formats: ['film', 'tv'], prestigeBias: 68, populism: 34, harshness: -2, variance: 11, genreLean: {}, timing: 'release', description: 'Contrarian by temperament.' }),
  O({ id: 'av-club', name: 'The A.V. Club', type: 'online', countryId: 'us', scale: 'letter', topCritic: true, metacriticTier: 'high', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 64, populism: 40, harshness: -1, variance: 10, genreLean: { comedy: 2, science_fiction: 2 }, timing: 'embargo', description: 'Letter grades and long memories.' }),
  O({ id: 'slant', name: 'Slant Magazine', type: 'online', countryId: 'us', scale: 'stars4', topCritic: true, metacriticTier: 'standard', coverage: ['everything', 'prestige'], formats: ['film', 'tv'], prestigeBias: 82, populism: 20, harshness: -6, variance: 12, genreLean: { experimental: 8, action: -6 }, timing: 'release', description: 'The harshest desk that counts.' }),
  O({ id: 'film-stage', name: 'The Film Stage', type: 'online', countryId: 'us', scale: 'letter', topCritic: false, metacriticTier: 'low', coverage: ['prestige', 'everything'], formats: ['film'], prestigeBias: 78, populism: 26, harshness: -2, variance: 11, genreLean: { experimental: 6 }, timing: 'festival', description: 'Festival regulars with a cinephile readership.' }),
  O({ id: 'playlist', name: 'The Playlist', type: 'online', countryId: 'us', scale: 'letter', topCritic: false, metacriticTier: 'standard', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 70, populism: 32, harshness: -1, variance: 11, genreLean: {}, timing: 'festival', description: 'Early out of every festival.' }),
  O({ id: 'collider', name: 'Collider', type: 'online', countryId: 'us', scale: 'ten', topCritic: false, metacriticTier: 'low', coverage: ['wide', 'genre'], formats: ['film', 'tv'], prestigeBias: 40, populism: 66, harshness: 3, variance: 9, genreLean: { action: 4, science_fiction: 4, fantasy: 4 }, timing: 'embargo', description: 'Fan-facing, franchise-literate.' }),
  O({ id: 'slashfilm', name: '/Film', type: 'online', countryId: 'us', scale: 'ten', topCritic: false, metacriticTier: 'standard', coverage: ['wide', 'genre'], formats: ['film', 'tv'], prestigeBias: 48, populism: 58, harshness: 1, variance: 10, genreLean: { horror: 4, science_fiction: 3 }, timing: 'embargo', description: 'Film-nerd site with a reviewing spine.' }),
  O({ id: 'ign', name: 'IGN', type: 'online', countryId: 'us', scale: 'ten', topCritic: false, metacriticTier: 'standard', coverage: ['wide', 'genre'], formats: ['film', 'tv'], prestigeBias: 34, populism: 72, harshness: 3, variance: 9, genreLean: { action: 5, science_fiction: 5, fantasy: 5, animation: 3, drama: -3 }, timing: 'embargo', description: 'The games press, reviewing the blockbusters.' }),
  O({ id: 'paste', name: 'Paste', type: 'magazine', countryId: 'us', scale: 'ten', topCritic: false, metacriticTier: 'low', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 66, populism: 38, harshness: -1, variance: 11, genreLean: { musical: 4 }, timing: 'release', description: 'Music-rooted culture magazine.' }),
  O({ id: 'the-ringer', name: 'The Ringer', type: 'online', countryId: 'us', scale: 'hundred', topCritic: false, metacriticTier: 'none', coverage: ['wide'], formats: ['film', 'tv'], prestigeBias: 48, populism: 58, harshness: 0, variance: 10, genreLean: { sport: 6, comedy: 3 }, timing: 'release', description: 'Essays for the people who argue about movies.' }),

  // Genre desks.
  O({ id: 'bloody-disgusting', name: 'Bloody Disgusting', type: 'genre', countryId: 'us', scale: 'stars5', topCritic: false, metacriticTier: 'none', coverage: ['genre'], formats: ['film', 'tv'], prestigeBias: 30, populism: 60, harshness: 4, variance: 10, genreLean: { horror: 12, thriller: 4 }, timing: 'embargo', onlyGenres: ['horror'], description: 'Horror\'s home desk. Kind to the genre, hard on the cynical.' }),
  O({ id: 'dread-central', name: 'Dread Central', type: 'genre', countryId: 'us', scale: 'stars5', topCritic: false, metacriticTier: 'none', coverage: ['genre'], formats: ['film'], prestigeBias: 30, populism: 58, harshness: 3, variance: 11, genreLean: { horror: 10 }, timing: 'release', onlyGenres: ['horror'], description: 'Horror, all of it.' }),
  O({ id: 'fangoria', name: 'Fangoria', type: 'genre', countryId: 'us', scale: 'stars5', topCritic: false, metacriticTier: 'none', coverage: ['genre'], formats: ['film'], prestigeBias: 40, populism: 50, harshness: 2, variance: 11, genreLean: { horror: 10 }, timing: 'release', onlyGenres: ['horror'], description: 'The magazine horror grew up on.' }),
  O({ id: 'polygon', name: 'Polygon', type: 'online', countryId: 'us', scale: 'hundred', topCritic: false, metacriticTier: 'low', coverage: ['genre', 'wide'], formats: ['film', 'tv'], prestigeBias: 44, populism: 60, harshness: 1, variance: 10, genreLean: { animation: 6, science_fiction: 4, fantasy: 4 }, timing: 'embargo', onlyGenres: ['animation', 'science fiction', 'fantasy', 'action', 'family'], description: 'Animation and genre, taken seriously.' }),

  // Television desks.
  O({ id: 'tvline', name: 'TVLine', type: 'television', countryId: 'us', scale: 'letter', topCritic: false, metacriticTier: 'low', coverage: ['television'], formats: ['tv'], prestigeBias: 40, populism: 62, harshness: 2, variance: 9, genreLean: {}, timing: 'embargo', description: 'Television first, last and only.' }),
  O({ id: 'tv-guide', name: 'TV Guide', type: 'television', countryId: 'us', scale: 'stars5', topCritic: false, metacriticTier: 'standard', coverage: ['television'], formats: ['tv'], prestigeBias: 42, populism: 60, harshness: 2, variance: 9, genreLean: {}, timing: 'embargo', description: 'The listings magazine, still reviewing.' }),
  O({ id: 'hollywood-reporter-tv', name: 'The Hollywood Reporter Television', type: 'television', countryId: 'us', scale: 'hundred', topCritic: true, metacriticTier: 'highest', coverage: ['television'], formats: ['tv'], prestigeBias: 62, populism: 42, harshness: 0, variance: 9, genreLean: {}, timing: 'embargo', description: 'The trade\'s television desk.' }),

  // Britain and Ireland.
  O({ id: 'guardian', name: 'The Guardian', type: 'newspaper', countryId: 'uk', scale: 'stars5', topCritic: true, metacriticTier: 'highest', coverage: ['everything', 'prestige'], formats: ['film', 'tv'], prestigeBias: 70, populism: 32, harshness: 0, variance: 11, genreLean: { documentary: 4, horror: 2 }, timing: 'festival', description: 'Five stars or one, rarely three. First out of every festival.' }),
  O({ id: 'telegraph', name: 'The Telegraph', type: 'newspaper', countryId: 'uk', scale: 'stars5', topCritic: true, metacriticTier: 'high', coverage: ['everything', 'prestige'], formats: ['film', 'tv'], prestigeBias: 66, populism: 36, harshness: -1, variance: 11, genreLean: {}, timing: 'festival', description: 'Waspish, five-starred, at every festival.' }),
  O({ id: 'the-times', name: 'The Times', type: 'newspaper', countryId: 'uk', scale: 'stars5', topCritic: true, metacriticTier: 'high', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 62, populism: 40, harshness: -2, variance: 11, genreLean: {}, timing: 'embargo', description: 'Sharp, brief, five stars.' }),
  O({ id: 'independent', name: 'The Independent', type: 'newspaper', countryId: 'uk', scale: 'stars5', topCritic: true, metacriticTier: 'high', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 62, populism: 38, harshness: 0, variance: 11, genreLean: {}, timing: 'embargo', description: 'Online-only now, still reviewing everything.' }),
  O({ id: 'financial-times', name: 'Financial Times', type: 'newspaper', countryId: 'uk', scale: 'stars5', topCritic: true, metacriticTier: 'high', coverage: ['prestige', 'wide'], formats: ['film'], prestigeBias: 72, populism: 28, harshness: -3, variance: 11, genreLean: { experimental: 4, family: -4 }, timing: 'release', description: 'A demanding desk with a taste for the austere.' }),
  O({ id: 'empire', name: 'Empire', type: 'magazine', countryId: 'uk', scale: 'stars5', topCritic: true, metacriticTier: 'high', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 46, populism: 62, harshness: 3, variance: 9, genreLean: { action: 4, science_fiction: 4, fantasy: 3 }, timing: 'embargo', description: 'The blockbuster\'s best friend, and honest about it.' }),
  O({ id: 'total-film', name: 'Total Film', type: 'magazine', countryId: 'uk', scale: 'stars5', topCritic: true, metacriticTier: 'high', coverage: ['everything'], formats: ['film'], prestigeBias: 44, populism: 62, harshness: 3, variance: 9, genreLean: { action: 3, fantasy: 3 }, timing: 'embargo', description: 'Star-rated and mainstream.' }),
  O({ id: 'sight-and-sound', name: 'Sight and Sound', type: 'magazine', countryId: 'uk', scale: 'hundred', topCritic: true, metacriticTier: 'high', coverage: ['prestige'], formats: ['film'], prestigeBias: 92, populism: 12, harshness: -4, variance: 12, genreLean: { experimental: 12, documentary: 6, action: -10, family: -8 }, timing: 'release', description: 'The BFI\'s magazine. Cinema as an art, or not at all.' }),
  O({ id: 'little-white-lies', name: 'Little White Lies', type: 'magazine', countryId: 'uk', scale: 'stars5', topCritic: false, metacriticTier: 'standard', coverage: ['prestige', 'everything'], formats: ['film'], prestigeBias: 80, populism: 24, harshness: -2, variance: 12, genreLean: { experimental: 6 }, timing: 'release', description: 'Anticipation, enjoyment, and in retrospect.' }),
  O({ id: 'time-out', name: 'Time Out', type: 'magazine', countryId: 'uk', scale: 'stars5', topCritic: true, metacriticTier: 'high', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 62, populism: 42, harshness: 0, variance: 10, genreLean: {}, timing: 'embargo', description: 'City listings with a proper film desk.' }),
  O({ id: 'radio-times', name: 'Radio Times', type: 'television', countryId: 'uk', scale: 'stars5', topCritic: false, metacriticTier: 'none', coverage: ['television', 'wide'], formats: ['film', 'tv'], prestigeBias: 44, populism: 60, harshness: 2, variance: 9, genreLean: {}, timing: 'embargo', description: 'Britain\'s listings magazine.' }),
  O({ id: 'irish-times', name: 'The Irish Times', type: 'newspaper', countryId: 'ie', scale: 'stars5', topCritic: true, metacriticTier: 'standard', coverage: ['everything'], formats: ['film'], prestigeBias: 66, populism: 36, harshness: -1, variance: 11, genreLean: {}, timing: 'embargo', description: 'Ireland\'s paper of record.' }),

  // Elsewhere: each reviews its own market's releases and whatever opens wide there.
  O({ id: 'globe-and-mail', name: 'The Globe and Mail', type: 'newspaper', countryId: 'ca', scale: 'stars4', topCritic: true, metacriticTier: 'high', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 62, populism: 40, harshness: 0, variance: 10, genreLean: {}, timing: 'festival', homeCountries: ['ca', 'us'], description: 'Canada\'s paper of record, at Toronto every September.' }),
  O({ id: 'toronto-star', name: 'Toronto Star', type: 'newspaper', countryId: 'ca', scale: 'stars4', topCritic: true, metacriticTier: 'standard', coverage: ['everything'], formats: ['film'], prestigeBias: 54, populism: 48, harshness: 1, variance: 10, genreLean: {}, timing: 'embargo', homeCountries: ['ca', 'us'], description: 'Canada\'s biggest paper.' }),
  O({ id: 'smh', name: 'The Sydney Morning Herald', type: 'newspaper', countryId: 'au', scale: 'stars5', topCritic: true, metacriticTier: 'standard', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 58, populism: 44, harshness: 0, variance: 10, genreLean: {}, timing: 'release', homeCountries: ['au', 'nz', 'us', 'uk'], description: 'Australia\'s paper of record.' }),
  O({ id: 'le-monde', name: 'Le Monde', type: 'newspaper', countryId: 'fr', scale: 'hundred', topCritic: true, metacriticTier: 'standard', coverage: ['everything', 'prestige'], formats: ['film'], prestigeBias: 78, populism: 24, harshness: -3, variance: 11, genreLean: { experimental: 6, action: -6 }, timing: 'festival', homeCountries: ['fr', 'be', 'ch'], description: 'France\'s paper of record, at Cannes every May.' }),
  O({ id: 'cahiers', name: 'Cahiers du Cinéma', type: 'magazine', countryId: 'fr', scale: 'stars4', topCritic: false, metacriticTier: 'none', coverage: ['prestige'], formats: ['film'], prestigeBias: 96, populism: 6, harshness: -6, variance: 13, genreLean: { experimental: 14, action: -10, family: -10, comedy: -4 }, timing: 'release', homeCountries: ['fr', 'be', 'ch', 'us', 'uk', 'jp', 'kr'], description: 'The magazine that invented the auteur. Nothing is good enough.' }),
  O({ id: 'liberation', name: 'Libération', type: 'newspaper', countryId: 'fr', scale: 'hundred', topCritic: false, metacriticTier: 'none', coverage: ['everything'], formats: ['film'], prestigeBias: 74, populism: 28, harshness: -2, variance: 11, genreLean: {}, timing: 'festival', homeCountries: ['fr', 'be', 'ch'], description: 'The left bank\'s daily.' }),
  O({ id: 'el-pais', name: 'El País', type: 'newspaper', countryId: 'es', scale: 'hundred', topCritic: false, metacriticTier: 'none', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 66, populism: 36, harshness: -1, variance: 11, genreLean: {}, timing: 'release', homeCountries: ['es', 'mx', 'ar'], description: 'Spain\'s paper of record.' }),
  O({ id: 'spiegel', name: 'Der Spiegel', type: 'magazine', countryId: 'de', scale: 'hundred', topCritic: false, metacriticTier: 'none', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 64, populism: 36, harshness: -2, variance: 11, genreLean: {}, timing: 'release', homeCountries: ['de', 'at', 'ch'], description: 'Germany\'s news magazine.' }),
  O({ id: 'kinema-junpo', name: 'Kinema Junpo', type: 'magazine', countryId: 'jp', scale: 'stars5', topCritic: false, metacriticTier: 'none', coverage: ['everything'], formats: ['film'], prestigeBias: 68, populism: 36, harshness: -1, variance: 11, genreLean: { animation: 3 }, timing: 'release', homeCountries: ['jp'], description: 'Japan\'s oldest film magazine.' }),
  O({ id: 'cine21', name: 'Cine21', type: 'magazine', countryId: 'kr', scale: 'ten', topCritic: false, metacriticTier: 'none', coverage: ['everything'], formats: ['film'], prestigeBias: 66, populism: 38, harshness: -1, variance: 11, genreLean: { thriller: 3 }, timing: 'release', homeCountries: ['kr'], description: 'Korea\'s film weekly.' }),
  O({ id: 'the-hindu', name: 'The Hindu', type: 'newspaper', countryId: 'in', scale: 'stars5', topCritic: false, metacriticTier: 'none', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 60, populism: 42, harshness: 0, variance: 11, genreLean: {}, timing: 'release', homeCountries: ['in'], description: 'A serious desk for every Indian industry.' }),
  O({ id: 'filmfare', name: 'Filmfare', type: 'magazine', countryId: 'in', scale: 'stars5', topCritic: false, metacriticTier: 'none', coverage: ['everything'], formats: ['film'], prestigeBias: 40, populism: 66, harshness: 4, variance: 9, genreLean: { musical: 5, romance: 4 }, timing: 'release', homeCountries: ['in'], description: 'Bollywood\'s magazine, generous by nature.' }),
  O({ id: 'folha', name: 'Folha de S.Paulo', type: 'newspaper', countryId: 'br', scale: 'stars5', topCritic: false, metacriticTier: 'none', coverage: ['everything'], formats: ['film', 'tv'], prestigeBias: 60, populism: 40, harshness: -1, variance: 11, genreLean: {}, timing: 'release', homeCountries: ['br'], description: 'Brazil\'s biggest paper.' }),
  O({ id: 'reforma', name: 'Reforma', type: 'newspaper', countryId: 'mx', scale: 'stars5', topCritic: false, metacriticTier: 'none', coverage: ['everything'], formats: ['film'], prestigeBias: 56, populism: 44, harshness: 0, variance: 11, genreLean: {}, timing: 'release', homeCountries: ['mx'], description: 'Mexico City\'s daily.' }),
]);

/** The published rules the aggregators apply. */
export const AGGREGATOR_RULES = {
  rottenTomatoes: {
    /** A review counts as Fresh from this score, on SLATE's 0-100 scale. */
    freshAt: 60,
    certifiedFresh: { wide: { score: 75, reviews: 80, topCritics: 5 }, limited: { score: 75, reviews: 40, topCritics: 5 }, television: { score: 75, reviews: 20, topCritics: 0 } },
    /** An audience rating counts as positive from 3.5 stars out of 5. */
    audiencePositiveAt: 70,
    verifiedAudienceMinimum: 500,
    source: 'Rotten Tomatoes publishes these criteria.',
  },
  metacritic: {
    bands: [
      { min: 81, label: 'Universal Acclaim', colour: 'green' },
      { min: 61, label: 'Generally Favorable', colour: 'green' },
      { min: 40, label: 'Mixed Or Average', colour: 'yellow' },
      { min: 20, label: 'Generally Unfavorable', colour: 'red' },
      { min: 0, label: 'Overwhelming Dislike', colour: 'red' },
    ],
    mustSee: { score: 81, reviews: 15 },
    minimumReviews: 4,
    /** Metacritic does not publish its weights. These are SLATE's estimate. */
    tierWeights: { highest: 1.6, high: 1.3, standard: 1.0, low: 0.7, none: 0 } as Record<MetacriticTier, number>,
    source: 'Metacritic publishes its bands and the Must-See rule; the weights are its own and SLATE estimates them.',
  },
  cinemaScore: {
    /** Only wide theatrical openings are polled. */
    minimumTheaters: 1000,
    grades: [['A+', 93], ['A', 86], ['A-', 79], ['B+', 72], ['B', 65], ['B-', 58], ['C+', 51], ['C', 44], ['C-', 37], ['D+', 30], ['D', 23], ['D-', 16], ['F', 0]] as [string, number][],
    source: 'CinemaScore polls opening-night audiences of wide releases and publishes a letter grade.',
  },
  imdb: {
    /** Below this many votes the rating is shown but flagged as early. */
    settledVotes: 1000,
    source: 'IMDb shows a weighted average of user votes out of 10.',
  },
} as const;

/** How many reviews a release of this size collects, and how many of them are Top Critics and Metacritic critics. */
export function reviewTargets(strategy: string, theaters: number, television: boolean): { total: number; topCritics: number; metacritic: number; certified: 'wide' | 'limited' | 'television' } {
  if (television) return { total: 42, topCritics: 12, metacritic: 22, certified: 'television' };
  if (strategy === 'wide_theatrical' || (strategy === 'day_and_date' && theaters >= 1000)) return { total: theaters >= 3000 ? 330 : 240, topCritics: theaters >= 3000 ? 60 : 48, metacritic: theaters >= 3000 ? 56 : 46, certified: 'wide' };
  if (strategy === 'streaming_exclusive') return { total: 120, topCritics: 30, metacritic: 34, certified: 'limited' };
  if (strategy === 'platform') return { total: 150, topCritics: 38, metacritic: 40, certified: 'limited' };
  if (strategy === 'limited_theatrical' || strategy === 'day_and_date') return { total: 90, topCritics: 24, metacritic: 28, certified: 'limited' };
  if (strategy === 'festival_only') return { total: 22, topCritics: 8, metacritic: 8, certified: 'limited' };
  return { total: 26, topCritics: 5, metacritic: 9, certified: 'limited' };
}

/** A score on SLATE's 0-100 scale written the way the outlet writes it. */
export function scaleText(scale: ReviewScale, score: number): string {
  const s = Math.max(0, Math.min(100, score));
  switch (scale) {
    case 'stars5': { const stars = Math.round(s / 10) / 2; return `${'★'.repeat(Math.floor(stars))}${stars % 1 ? '½' : ''}${'☆'.repeat(5 - Math.ceil(stars))} ${stars}/5`; }
    case 'stars4': { const stars = Math.round(s / 12.5) / 2; return `${'★'.repeat(Math.floor(stars))}${stars % 1 ? '½' : ''}${'☆'.repeat(4 - Math.ceil(stars))} ${stars}/4`; }
    case 'ten': return `${Math.round(s / 10)}/10`;
    case 'percent': return `${Math.round(s)}%`;
    case 'letter': return letterGrade(s);
    default: return `${Math.round(s)}/100`;
  }
}

export function letterGrade(score: number): string {
  const grades: [string, number][] = [['A+', 97], ['A', 93], ['A-', 90], ['B+', 87], ['B', 83], ['B-', 80], ['C+', 77], ['C', 73], ['C-', 70], ['D+', 67], ['D', 63], ['D-', 60], ['F', 0]];
  for (const [grade, min] of grades) if (score >= min) return grade;
  return 'F';
}

/** Whether a score counts as Fresh once written in the outlet's own scale, the way Rotten Tomatoes reads it. */
export function isFresh(scale: ReviewScale, score: number): boolean {
  switch (scale) {
    case 'stars5': return Math.round(score / 10) / 2 >= 3;
    case 'stars4': return Math.round(score / 12.5) / 2 >= 2.5;
    case 'ten': return Math.round(score / 10) >= 6;
    case 'letter': return score >= 80;
    default: return score >= AGGREGATOR_RULES.rottenTomatoes.freshAt;
  }
}

export function metacriticBand(score: number): { label: string; colour: 'green' | 'yellow' | 'red' } {
  for (const band of AGGREGATOR_RULES.metacritic.bands) if (score >= band.min) return { label: band.label, colour: band.colour };
  return { label: 'Overwhelming Dislike', colour: 'red' };
}

export function cinemaScoreGrade(score: number): string {
  for (const [grade, min] of AGGREGATOR_RULES.cinemaScore.grades) if (score >= min) return grade;
  return 'F';
}
