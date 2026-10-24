/**
 * SLATE — the awards and festivals (from 2026-10-24, the owner's brief 25, Parts 11 and 12; `docs/verification/
 * career-world-2026-10-23/criteria.md`, Module 6, X6 to X15). The brief names fourteen awards and eight festivals; each is
 * here with what this build could read of it on 2026-10-24, and only an edition whose rules were read decides whether the
 * player's work is eligible. Three were: the 78th Emmy Awards' Rules And Procedures (the Television Academy's, version 4 of
 * April 7, 2026: N23), the 2027 Sundance Film Festival's submissions page and its dates announcement (N25, N26), and the
 * 2026 International Emmy Awards' rules (N24). The Academy's Oscar rules, BAFTA's and AACTA's refused this build; others'
 * pages were read without their rules, or not reached. For those the game says it doesn't decide.
 *
 * A year whose rules aren't published yet is the last edition read, carried forward and said so (`projected`): its dates
 * are the same days a year on, never verified. The Emmy organizations are separate competitions: the Television Academy's
 * Emmys, NATAS's and the International Academy's each have their own rules here, and a festival's sections each have
 * their own.
 */

/** Every institution the brief names. */
export type InstitutionId =
  | 'oscars' | 'emmys' | 'natas' | 'iemmys' | 'bafta' | 'actor-awards' | 'golden-globes' | 'spirit' | 'critics-choice' | 'gotham'
  | 'aacta' | 'cesar' | 'goya' | 'annie'
  | 'cannes' | 'venice' | 'berlinale' | 'sundance' | 'tiff' | 'annecy' | 'idfa' | 'busan';

/** How far this build read it: its rules read and applied, some of it read, its pages refused, or not reached. */
export type Coverage = 'enforced' | 'read-in-part' | 'refused' | 'unreached';

export interface Institution {
  id: InstitutionId;
  name: string;
  kind: 'award' | 'festival';
  organizer: string;
  coverage: Coverage;
  /** This build's source records (`sources.json`) and the dossier's. */
  sources: readonly string[];
  /** What was read, or why nothing was, in a sentence the player reads. */
  known: string;
}

export const INSTITUTIONS: readonly Institution[] = [
  { id: 'oscars', name: 'Academy Awards', kind: 'award', organizer: 'Academy of Motion Picture Arts and Sciences', coverage: 'refused', sources: ['S42', 'S43', 'S92', 'S106'], known: 'Both its rules and its key dates pages turned this build away (HTTP 403), so the game doesn’t say whether a film is eligible.' },
  { id: 'emmys', name: 'Emmy Awards', kind: 'award', organizer: 'Television Academy', coverage: 'enforced', sources: ['N23'], known: 'The 78th Emmy Awards’ Rules And Procedures, version 4 of April 7, 2026, read in full: its eligibility year, entries and fees, performer categories, nominations and final round.' },
  { id: 'natas', name: 'NATAS Emmy Awards', kind: 'award', organizer: 'National Academy of Television Arts and Sciences', coverage: 'read-in-part', sources: ['N27'], known: 'Four competitions of its own, Daytime, Children’s And Family, News And Documentary and Sports, each with rules this build didn’t read; the game doesn’t decide them.' },
  { id: 'iemmys', name: 'International Emmy Awards', kind: 'award', organizer: 'International Academy of Television Arts and Sciences', coverage: 'enforced', sources: ['N24'], known: 'Read for 2026: a program produced and entered by an organization outside the U.S., first broadcast outside the U.S. in 2025.' },
  { id: 'bafta', name: 'BAFTA Film Awards', kind: 'award', organizer: 'British Academy of Film and Television Arts', coverage: 'refused', sources: ['N28'], known: 'Refused this build (HTTP 403) on its film rules page, so the game doesn’t say whether a film is eligible.' },
  { id: 'actor-awards', name: 'Actor Awards', kind: 'award', organizer: 'SAG-AFTRA', coverage: 'unreached', sources: ['N28'], known: 'The rules page this build tried wasn’t there (HTTP 404), so the game doesn’t decide.' },
  { id: 'golden-globes', name: 'Golden Globe Awards', kind: 'award', organizer: 'Golden Globes', coverage: 'unreached', sources: ['N28'], known: 'The rules page this build tried wasn’t there (HTTP 404), so the game doesn’t decide.' },
  { id: 'spirit', name: 'Film Independent Spirit Awards', kind: 'award', organizer: 'Film Independent', coverage: 'read-in-part', sources: ['N29'], known: 'Next presented on March 6, 2027, by its page; its rules weren’t read, so the game doesn’t decide.' },
  { id: 'critics-choice', name: 'Critics Choice Awards', kind: 'award', organizer: 'Critics Choice Association', coverage: 'read-in-part', sources: ['N29'], known: 'Only its home page was read, not its rules, so the game doesn’t decide.' },
  { id: 'gotham', name: 'Gotham Awards', kind: 'award', organizer: 'Gotham Film And Media Institute', coverage: 'unreached', sources: ['N28'], known: 'The awards page this build tried wasn’t there (HTTP 404), so the game doesn’t decide.' },
  { id: 'aacta', name: 'AACTA Awards', kind: 'award', organizer: 'Australian Academy of Cinema and Television Arts', coverage: 'unreached', sources: ['N28'], known: 'Unreachable from this build, so the game doesn’t decide.' },
  { id: 'cesar', name: 'César Awards', kind: 'award', organizer: 'L’Académie des Arts et Techniques du Cinéma', coverage: 'read-in-part', sources: ['N29'], known: 'Read as far as its home page, not its rules, so the game doesn’t decide.' },
  { id: 'goya', name: 'Goya Awards', kind: 'award', organizer: 'La Academia de las Artes y las Ciencias Cinematográficas de España', coverage: 'read-in-part', sources: ['N29'], known: 'Its home page only; its rules weren’t read, so the game doesn’t decide.' },
  { id: 'annie', name: 'Annie Awards', kind: 'award', organizer: 'ASIFA-Hollywood', coverage: 'unreached', sources: ['N28'], known: 'The rules page this build tried wasn’t there (HTTP 404), so the game doesn’t decide.' },
  { id: 'cannes', name: 'Cannes Film Festival', kind: 'festival', organizer: 'Festival de Cannes', coverage: 'read-in-part', sources: ['S65', 'N30'], known: 'Features registered by March 13, 2026 and shorts by March 2, 2026, by its submissions page, and a film selected in another festival’s international section no longer eligible. Its selection isn’t simulated.' },
  { id: 'venice', name: 'Venice International Film Festival', kind: 'festival', organizer: 'La Biennale di Venezia', coverage: 'read-in-part', sources: ['N30'], known: 'By its 2026 regulations, the 83rd edition is on the Lido, September 2 to 12, 2026: world premieres only, at most 21 films in competition. Its selection isn’t simulated.' },
  { id: 'berlinale', name: 'Berlin International Film Festival', kind: 'festival', organizer: 'Berlinale', coverage: 'read-in-part', sources: ['N30'], known: 'World premieres preferred, by its general guidelines, and a film shown on television, online or on demand not eligible. Its selection isn’t simulated.' },
  { id: 'sundance', name: 'Sundance Film Festival', kind: 'festival', organizer: 'Sundance Institute', coverage: 'enforced', sources: ['S69', 'S71', 'N25', 'N26'], known: 'The 2027 festival’s submissions page and its dates, read in full: Boulder, Colorado, January 21 to 31, 2027, its categories by origin, running time and premiere, and its deadlines.' },
  { id: 'tiff', name: 'Toronto International Film Festival', kind: 'festival', organizer: 'TIFF', coverage: 'unreached', sources: ['S72', 'N28'], known: 'A check on its submissions page stopped this build, so the game doesn’t decide.' },
  { id: 'annecy', name: 'Annecy International Animation Film Festival', kind: 'festival', organizer: 'Annecy Festival', coverage: 'unreached', sources: ['N28'], known: 'Its site couldn’t be reached from this build, so the game doesn’t decide.' },
  { id: 'idfa', name: 'International Documentary Film Festival Amsterdam', kind: 'festival', organizer: 'IDFA', coverage: 'read-in-part', sources: ['N30'], known: 'The 39th festival, November 12 to 22, 2026, by its entry regulations, with an early entry deadline of April 23, 2026. Its selection isn’t simulated.' },
  { id: 'busan', name: 'Busan International Film Festival', kind: 'festival', organizer: 'BIFF', coverage: 'read-in-part', sources: ['N29'], known: 'Nothing past its home page was read, so the game doesn’t decide.' },
];

export const institutionById = (id: InstitutionId): Institution => INSTITUTIONS.find((i) => i.id === id)!;

// ---------------------------------------------------------------------------------------------------------------------
// The Emmy Awards (N23)
// ---------------------------------------------------------------------------------------------------------------------

/** An edition's calendar, read or projected. */
export interface EmmyEdition {
  number: number;
  /** The year its awards are given. */
  year: number;
  /** Carried forward from the 78th, its dates the same days a year on, never verified. */
  projected: boolean;
  eligibility: { from: string; to: string };
  entryDeadline: string;
  nominationsAnnounced: string;
  finalEnds: string;
  creativeArts: string;
  telecast: string;
}

/** The 78th, as its Rules And Procedures give it (version 4, April 7, 2026). */
export const EMMYS_78: EmmyEdition = {
  number: 78, year: 2026, projected: false, eligibility: { from: '2025-06-01', to: '2026-05-31' }, entryDeadline: '2026-05-07',
  nominationsAnnounced: '2026-07-08', finalEnds: '2026-08-26', creativeArts: '2026-09-05', telecast: '2026-09-14',
};

/** The rules the 78th sets, which a projected edition keeps. */
export const EMMY_RULES = {
  /** Rule 4: an individual may enter themselves; a $125 processing charge and a $100 entry fee per entrant (Entry Fees, 1). */
  fees: { processing: 125_00, perEntrant: 100_00 },
  /** Performer Awards: guest categories for a performer in under half the eligible episodes. */
  guestBelow: 0.5,
  /**
   * The least stand-alone screen time: a guest's, of the episode entered; a supporting performer's in a movie or a limited
   * or anthology series, of the movie, the whole limited series or the anthology's part. Lead and a series' supporting
   * categories have none.
   */
  leastShare: 0.05,
  /** Nomination Procedures, 1: nominations by submissions, a category of 20 or more. */
  nominationsBySubmissions: [[20, 5], [81, 6], [161, 7], [241, 8]] as readonly (readonly [number, number])[],
} as const;

/** An edition by the year its awards are given: the 78th as read, any other projected from it. */
export function emmyEdition(year: number): EmmyEdition {
  if (year === EMMYS_78.year) return EMMYS_78;
  const move = (iso: string) => `${Number(iso.slice(0, 4)) + (year - EMMYS_78.year)}${iso.slice(4)}`;
  return {
    number: EMMYS_78.number + (year - EMMYS_78.year), year, projected: true,
    eligibility: { from: move(EMMYS_78.eligibility.from), to: move(EMMYS_78.eligibility.to) }, entryDeadline: move(EMMYS_78.entryDeadline),
    nominationsAnnounced: move(EMMYS_78.nominationsAnnounced), finalEnds: move(EMMYS_78.finalEnds), creativeArts: move(EMMYS_78.creativeArts), telecast: move(EMMYS_78.telecast),
  };
}

/** The year whose awards a premiere on a day falls in: June 1 to May 31, by the 78th's eligibility year. */
export function emmyYearOf(iso: string): number {
  const y = Number(iso.slice(0, 4));
  return iso.slice(5) >= '06-01' ? y + 1 : y;
}

/** The performer categories the player's work can be entered in. */
export type EmmyCategory = 'guest-drama' | 'guest-comedy' | 'supporting-drama' | 'supporting-comedy' | 'lead-limited' | 'supporting-limited' | 'voice-over';

/**
 * Each category's number in the 78th's book, by performer title, and where it's presented (ASSUMPTION: guest and
 * voice-over categories at the Creative Arts Awards, the others at the telecast, as the Academy has presented them; the
 * rules give the dates, not which category goes where).
 */
export const EMMY_CATEGORIES: Readonly<Record<EmmyCategory, { actor: number; actress: number; actorName: string; actressName: string; at: 'creative-arts' | 'telecast' }>> = {
  'guest-drama': { actor: 71, actress: 73, actorName: 'Outstanding Guest Actor In A Drama Series', actressName: 'Outstanding Guest Actress In A Drama Series', at: 'creative-arts' },
  'guest-comedy': { actor: 70, actress: 72, actorName: 'Outstanding Guest Actor In A Comedy Series', actressName: 'Outstanding Guest Actress In A Comedy Series', at: 'creative-arts' },
  'supporting-drama': { actor: 65, actress: 68, actorName: 'Outstanding Supporting Actor In A Drama Series', actressName: 'Outstanding Supporting Actress In A Drama Series', at: 'telecast' },
  'supporting-comedy': { actor: 64, actress: 67, actorName: 'Outstanding Supporting Actor In A Comedy Series', actressName: 'Outstanding Supporting Actress In A Comedy Series', at: 'telecast' },
  'lead-limited': { actor: 60, actress: 63, actorName: 'Outstanding Lead Actor In A Limited Or Anthology Series Or Movie', actressName: 'Outstanding Lead Actress In A Limited Or Anthology Series Or Movie', at: 'telecast' },
  'supporting-limited': { actor: 66, actress: 69, actorName: 'Outstanding Supporting Actor In A Limited Or Anthology Series Or Movie', actressName: 'Outstanding Supporting Actress In A Limited Or Anthology Series Or Movie', at: 'telecast' },
  'voice-over': { actor: 75, actress: 75, actorName: 'Outstanding Character Voice-Over Performance', actressName: 'Outstanding Character Voice-Over Performance', at: 'creative-arts' },
};

/**
 * A program's scenes, for a part's share of its running time (ASSUMPTION, the game's: an hour of television about 40
 * scenes, a half hour about 25, a movie or a limited series' episode about 50). The rules count minutes; the game counts the
 * part's scenes kept in the edit against these.
 */
export const SCENES_PER_EPISODE = { hour: 40, halfHour: 25, movie: 50 } as const;

/** A series' eligible episodes where its season's order isn't in the game (ASSUMPTION): ten. */
export const SEASON_EPISODES = 10;

/** A limited series' episodes, all of it, for a supporting performer's share (ASSUMPTION): six hours. */
export const LIMITED_EPISODES = 6;

// ---------------------------------------------------------------------------------------------------------------------
// The Sundance Film Festival (N25, N26)
// ---------------------------------------------------------------------------------------------------------------------

/** A category of the festival, by the submissions page. */
export type SundanceCategory = 'us-narrative-feature' | 'us-documentary-feature' | 'us-short';

export interface SundanceEdition {
  year: number;
  projected: boolean;
  from: string;
  to: string;
  place: string;
  /** The last (late) deadline for each kind of entry. */
  deadlines: { feature: string; short: string };
  /** A feature made available to the public before this day can't be submitted. */
  featureWindow: string;
  /** A short finished and made available before this day can't be submitted; one finished on or after it can, whatever its premiere. */
  shortWindow: string;
  /** When the festival tells a submitter (ASSUMPTION: the page doesn't say; the game's, December 1 before it). */
  notice: string;
}

/** The 2027 festival, as its pages give it. */
export const SUNDANCE_2027: SundanceEdition = {
  year: 2027, projected: false, from: '2027-01-21', to: '2027-01-31', place: 'Boulder, Colorado',
  deadlines: { feature: '2026-09-21', short: '2026-08-31' }, featureWindow: '2027-02-01', shortWindow: '2026-01-01', notice: '2026-12-01',
};

/** An edition by its year: 2027 as read, any other projected from it. */
export function sundanceEdition(year: number): SundanceEdition {
  if (year === SUNDANCE_2027.year) return SUNDANCE_2027;
  const move = (iso: string) => `${Number(iso.slice(0, 4)) + (year - SUNDANCE_2027.year)}${iso.slice(4)}`;
  return {
    year, projected: true, from: move(SUNDANCE_2027.from), to: move(SUNDANCE_2027.to), place: SUNDANCE_2027.place,
    deadlines: { feature: move(SUNDANCE_2027.deadlines.feature), short: move(SUNDANCE_2027.deadlines.short) },
    featureWindow: move(SUNDANCE_2027.featureWindow), shortWindow: move(SUNDANCE_2027.shortWindow), notice: move(SUNDANCE_2027.notice),
  };
}

export const SUNDANCE_CATEGORY_NAME: Readonly<Record<SundanceCategory, string>> = {
  'us-narrative-feature': 'U.S. Narrative Feature Films', 'us-documentary-feature': 'U.S. Documentary Feature Films', 'us-short': 'U.S. Short Films',
};

/** The festival's line between a short and a feature: under 50 minutes, credits included, is short. */
export const SHORT_UNDER_MINUTES = 50;
