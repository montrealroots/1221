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
 * The Academy Awards, the Tonys, the Oliviers and the Ariels publish how
 * many films or productions are eligible, not how many performances, so a
 * performance's field isn't known, and SLATE doesn't put work up for them.
 */

export type AwardBody = 'emmys' | 'bafta-film';

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

/** Each body's dates: when its eligibility year ends (month, day), when nominations are announced and the ceremony held. */
export const AWARD_DATES: Readonly<Record<AwardBody, { windowEnds: [number, number]; entryBy: [number, number]; nominations: [number, number]; ceremony: [number, number] }>> = {
  emmys: { windowEnds: [5, 31], entryBy: [5, 7], nominations: [7, 8], ceremony: [9, 14] },
  'bafta-film': { windowEnds: [12, 31], entryBy: [10, 31], nominations: [1, 19], ceremony: [2, 21] },
};

/** A performer's Emmy entry, in US cents: the processing charge and the individual's fee. */
export const EMMY_ENTRY = { processing: 125_00, individual: 100_00 } as const;
