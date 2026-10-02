/**
 * SLATE — the awards an actor's work can be put up for (Stage 13 of
 * `docs/BACKLOG.md`, from 2026-10-01), from
 * `docs/research/world/research-career-depth.json` and
 * `research-award-pools.json`.
 *
 * Two bodies publish how many performances each category's slots are drawn
 * from, and SLATE keeps those two:
 * - **The Primetime Emmys** (the Television Academy): each acting
 *   category's submissions for the 78th, 2026, and its slots by the
 *   Academy's formula. Eligibility runs 1 June to 31 May; nominations were
 *   announced 8 July and the ceremony held 14 September 2026, and the 79th's
 *   dates weren't announced by 1 October 2026, so each year takes 2026's,
 *   SLATE's reading. A performer's entry is a $125 processing charge and $100
 *   for the individual, $225, waived for a member (the Academy's 2026 rules).
 * - **The BAFTA Film Awards**: the performances submitted for 2026, 301
 *   supporting actors and 208 supporting actresses, with six nominees each.
 *   Nominations 19 January and the ceremony 21 February (2027's, from
 *   BAFTA); a film's entrant enters its performances.
 *
 * Until 2026-10-02 SLATE didn't put work up for the Academy Awards, the
 * Tonys, the Oliviers or the Ariels, which publish how many films or
 * productions are eligible but not how many performances. From then
 * (`research-gaps-awards-negotiation.json`), each field is counted or
 * derived, and `OTHER_FIELDS` says which.
 */

export type AwardBody = 'emmys' | 'bafta-film' | 'oscars' | 'tonys' | 'oliviers' | 'ariel';

/** The Primetime Emmys' 2026 fields, by category and the performer's word. */
export const EMMY_FIELDS: Readonly<Record<string, Readonly<Record<'actor' | 'actress', { submissions: number; slots: number }>>>> = {
  'guest-comedy': { actor: { submissions: 84, slots: 6 }, actress: { submissions: 82, slots: 6 } },
  'guest-drama': { actor: { submissions: 84, slots: 6 }, actress: { submissions: 51, slots: 6 } },
  'supporting-comedy': { actor: { submissions: 185, slots: 7 }, actress: { submissions: 149, slots: 7 } },
  'supporting-drama': { actor: { submissions: 228, slots: 7 }, actress: { submissions: 222, slots: 7 } },
};

export const EMMY_NAMES: Readonly<Record<string, string>> = {
  'guest-comedy': 'Outstanding Guest {title} In A Comedy Series',
  'guest-drama': 'Outstanding Guest {title} In A Drama Series',
  'supporting-comedy': 'Outstanding Supporting {title} In A Comedy Series',
  'supporting-drama': 'Outstanding Supporting {title} In A Drama Series',
};

/** BAFTA Film's 2026 fields for a supporting performance, and its six nominees. */
export const BAFTA_FIELDS: Readonly<Record<'actor' | 'actress', { submissions: number; slots: number }>> = {
  actor: { submissions: 301, slots: 6 },
  actress: { submissions: 208, slots: 6 },
};

/**
 * The actors' share of a field where only its total is known: 1,075 of the
 * 1,865 performers on the Academy's 98th Reminder List, counted from the
 * list. Used for the Tonys, the Oliviers and the Ariels, SLATE's proxy.
 */
export const ACTOR_SHARE = 1075 / 1865;
const split = (total: number, slots: number) => ({ actor: { submissions: Math.round(total * ACTOR_SHARE), slots }, actress: { submissions: Math.round(total * (1 - ACTOR_SHARE)), slots } });

/**
 * The other four bodies' fields for a supporting or featured performance,
 * and their nominees:
 * - **The Academy Awards**, counted: the 98th Reminder List's 1,075 actors and
 *   790 actresses. Lead and supporting draw from the same list, and five are
 *   nominated in each.
 * - **The Tonys**, derived: the 2025-26 season's 19 eligible plays (8 new, 11
 *   revivals) at 19.6 performers a production (AAPAC's 647 Broadway actors
 *   over 33 productions, 2018-19), 372, five in Featured Role In A Play. The
 *   19.6 counts musicals' companies too, so it overstates a play's.
 * - **The Oliviers**, derived: 110 productions on the 2026 Theater panel's
 *   list at Broadway's 19.6, 2,156, five a category; no London cast size is
 *   published, so it is a proxy.
 * - **The Ariels**, derived: Ariel 68's 43 fiction features at the Academy
 *   list's 7.17 performers a film with a cast, 308, five in Coactuación.
 */
export const OTHER_FIELDS: Readonly<Record<Exclude<AwardBody, 'emmys'>, Readonly<Record<'actor' | 'actress', { submissions: number; slots: number }>>>> = {
  'bafta-film': BAFTA_FIELDS,
  oscars: { actor: { submissions: 1075, slots: 5 }, actress: { submissions: 790, slots: 5 } },
  tonys: split(19 * 19.6, 5),
  oliviers: split(110 * 19.6, 5),
  ariel: split(43 * 7.17, 5),
};

/** Each category's name, with the performer's word. */
export const OTHER_NAMES: Readonly<Record<Exclude<AwardBody, 'emmys'>, string>> = {
  'bafta-film': 'Supporting {title}, BAFTA Film',
  oscars: '{title} In A Supporting Role, The Academy Awards',
  tonys: 'Best Performance By An {title} In A Featured Role In A Play, The Tonys',
  oliviers: 'Best {title} In A Supporting Role, The Oliviers',
  ariel: 'Mejor Coactuación {genero}, The Ariels',
};

/**
 * Each body's dates: when its eligibility year ends (month, day), when nominations are announced and the ceremony held. */
export const AWARD_DATES: Readonly<Record<AwardBody, { windowEnds: [number, number]; entryBy: [number, number]; nominations: [number, number]; ceremony: [number, number] }>> = {
  emmys: { windowEnds: [5, 31], entryBy: [5, 7], nominations: [7, 8], ceremony: [9, 14] },
  'bafta-film': { windowEnds: [12, 31], entryBy: [10, 31], nominations: [1, 19], ceremony: [2, 21] },
  // The 99th's, from the Academy: films of the calendar year, nominations 21 January, the ceremony 14 March.
  oscars: { windowEnds: [12, 31], entryBy: [12, 31], nominations: [1, 21], ceremony: [3, 14] },
  // The 80th's aren't announced; the pattern, a late-April cutoff and early-May nominations, at the 79th's 7 June ceremony. SLATE's reading.
  tonys: { windowEnds: [4, 30], entryBy: [4, 30], nominations: [5, 5], ceremony: [6, 7] },
  // 2026's: productions opening by 17 February, nominations 5 March, the ceremony 12 April.
  oliviers: { windowEnds: [2, 17], entryBy: [2, 17], nominations: [3, 5], ceremony: [4, 12] },
  // Ariel 68's: films of the calendar year before, nominations 8 July, the ceremony 3 October.
  ariel: { windowEnds: [12, 31], entryBy: [2, 27], nominations: [7, 8], ceremony: [10, 3] },
};

/** A performer's Emmy entry, in US cents: the processing charge and the individual's fee. */
export const EMMY_ENTRY = { processing: 125_00, individual: 100_00 } as const;
