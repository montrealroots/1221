/**
 * SLATE — what a person is worth, and the deal that is the real decision.
 *
 * `craft.ts` says what posts a picture has to fill. This says what the people filling
 * them cost, what their name is worth, and — the part that matters — that the price
 * is not one number but a choice between two shapes of it.
 *
 * ## Money now against money later, which is the whole file
 *
 * A person can be paid a fee, or take much less up front for a share of what the
 * picture returns. That single decision is the most interesting thing in a studio
 * simulation, because it is the only place where the producer and the person they
 * are hiring are betting against each other about the same future, with real money,
 * before anybody knows anything.
 *
 * And it is what makes the locks load-bearing and not ceremonial. A person who
 * took points priced them against the shape and the channel they were told about. If
 * the shape could be cut afterwards, every deal would be signed against a promise
 * the producer could simply withdraw, and taking points would be a mistake nobody
 * should ever make. So the shape settles when the first person is engaged, and the
 * cast settles when the money is committed. The refusals are in `world/production.ts`
 * and this is why they are there.
 *
 * ## Why points are on what the company receives
 *
 * Not on what an audience paid. The gross is a number the company never touches —
 * roughly half of a theatrical one stays with the cinemas — and a share of it would
 * be a share of another party's money. Points here are a share of what actually
 * arrives, across every window, as it arrives. Which has a consequence worth keeping:
 * a points deal keeps paying out for a year after the opening, so a picture's cost is
 * not finished when its shoot is.
 *
 * ## Standing is a rung, not a score
 *
 * Four rungs, named, with the price attached. A list of people carrying numbers is a
 * spreadsheet, and a spreadsheet is what a player skims rather than reads. The rungs
 * are far enough apart that the cheap one is a real choice instead of an obvious
 * mistake, and `reach` runs below one at the bottom — engaging a beginner
 * is an active drag rather than a smaller benefit.
 */

/** How far a person's name reaches, as four named rungs. */
export interface Standing {
  /** Stable id. Saved on a person. */
  id: string;
  /** What this rung is called. */
  label: string;
  /**
   * What a person on this rung does to the axis their post sits on.
   *
   * Below one at the bottom on purpose: a picture staffed entirely from the bottom
   * finishes worse than one where nobody was chosen at all.
   */
  reach: number;
  /** What they ask, per part, as a fee. */
  asksPerPartCents: number;
  /**
   * How many points they want in exchange for giving up most of the fee.
   *
   * Rises faster than the fee does, which is the asymmetry that makes the deal a
   * real decision: the further up you go the worse the trade looks on paper, and the
   * better it looks if the picture works.
   */
  wantsPoints: number;
  /** Roughly how many of these exist for any one post, when a shortlist is drawn. */
  aboutHowMany: number;
}

export const STANDINGS: readonly Standing[] = [
  { id: 'starting', label: 'Starting Out', reach: 0.72, asksPerPartCents: 4_000_00, wantsPoints: 1.0, aboutHowMany: 6 },
  { id: 'working', label: 'Working', reach: 1.00, asksPerPartCents: 11_000_00, wantsPoints: 2.5, aboutHowMany: 4 },
  { id: 'sought', label: 'Sought After', reach: 1.28, asksPerPartCents: 26_000_00, wantsPoints: 5.0, aboutHowMany: 3 },
  { id: 'first', label: 'First Call', reach: 1.55, asksPerPartCents: 58_000_00, wantsPoints: 9.0, aboutHowMany: 2 },
];

export const STANDING_BY_ID: Readonly<Record<string, Standing>> = Object.fromEntries(
  STANDINGS.map((s) => [s.id, s]),
);

export const standingById = (id: string | undefined): Standing | undefined =>
  (id === undefined ? undefined : STANDING_BY_ID[id]);

/** The rungs, bottom first, so a move up or down is an index step. */
export const RUNGS: readonly string[] = STANDINGS.map((s) => s.id);

/** Which way a rung sits against another. */
export const rungOf = (id: string): number => RUNGS.indexOf(id);

// ---------------------------------------------------------------------------
// The deal
// ---------------------------------------------------------------------------

/**
 * Which shape of money a person took.
 *
 * Two, and there is deliberately no third. A deferred fee, a bonus on a threshold and
 * a first-dollar share are all real and all reduce here to the same question — is
 * this person carrying any of the risk — with numbers attached that nothing in this
 * build would read differently. They can be rows the day something does.
 */
export type DealKind = 'fee' | 'points' | 'threshold';

export interface Deal {
  kind: DealKind;
  /**
   * What the company pays at the greenlight, whatever happens afterwards.
   *
   * Inclusive of whatever the agent takes, because this is the figure that leaves
   * the bank and the ledger should hold one authoritative number rather than two
   * that have to be added up correctly at every call site.
   */
  feeCents: number;
  /** What the person themselves receives out of it, which is less. */
  theyGetCents: number;
  /** Percent of everything the company receives, where they took points. */
  points: number;
  /**
   * Whether a bonus falls due if the picture runs away.
   *
   * The third shape of money, and the one that costs nothing on most pictures. A
   * producer who gave somebody a threshold instead of a fee and then had a hit pays
   * for it out of the hit.
   */
  threshold?: boolean;
}

/**
 * How much of the fee is given up to take points at all.
 *
 * Most of it. A token reduction would make points a free lottery ticket, and the
 * decision only has teeth if saying yes genuinely relieves the production of cash it
 * would otherwise have had to find.
 */
export const POINTS_COST_OF_THE_FEE = 0.72;

/**
 * What an agent takes off the top, by rung.
 *
 * The company pays the fee and the person receives less than it, which is the whole
 * of what an agent is here. It matters because it is not flat: somebody starting out
 * has nobody representing them, so their price is exactly their price — and that is
 * a real, small edge for taking an unknown that has nothing to do with their reach.
 *
 * Read by the fee the company is charged, and by nothing else. An agent who also
 * negotiated, packaged their other clients or refused a lowball would be a system
 * rather than a percentage, and should arrive as one.
 */
export const AGENT_TAKES: Readonly<Record<string, number>> = {
  starting: 0,
  working: 0.10,
  sought: 0.10,
  first: 0.15,
};

/** What the person on this rung actually receives, before anybody takes a cut. */
export function asksFor(standing: Standing, parts: number): number {
  return Math.round(standing.asksPerPartCents * parts);
}

/** What the company is charged, which is what they ask plus what their agent takes. */
export function costsTheCompany(standing: Standing, parts: number): number {
  return Math.round(asksFor(standing, parts) * (1 + (AGENT_TAKES[standing.id] ?? 0)));
}

// ---------------------------------------------------------------------------
// The threshold, which is the bonus nobody budgets for
// ---------------------------------------------------------------------------

/**
 * What a picture has to return before a bonus falls due.
 *
 * Two and a half times what it cost. Deliberately well past washing its face: a
 * threshold a picture crosses routinely is a salary paid late, and the point of one
 * is that it costs nothing on most pictures and a great deal on the rare one that
 * runs away. A producer who gave somebody a threshold instead of a fee, and then had
 * a hit, pays for it out of the hit — which is the correct and unpleasant shape.
 */
export const THRESHOLD_AT = 2.5;

/**
 * What crossing it is worth, as a multiple of what they were originally paid.
 *
 * Read by the settlement when the last window shuts, and only for people above the
 * line. A grip does not have a threshold in their deal.
 */
export const THRESHOLD_PAYS = 1.5;

/** What a set of deals owes now that the picture has returned this much. */
export function thresholdOwed(
  deals: readonly { feeCents: number; threshold?: boolean }[],
  returned: number,
): number {
  if (returned < THRESHOLD_AT) return 0;
  return deals
    .filter((d) => d.threshold === true)
    .reduce((sum, d) => sum + Math.round(d.feeCents * THRESHOLD_PAYS), 0);
}

/**
 * The two offers a person on this rung would accept for this much work.
 *
 * Both, always, so a screen can put them side by side. Working out what they would
 * take is the engine's job; deciding which is better is the player's, and there is
 * no right answer to it in advance — which is the point.
 */
export function offersFrom(standing: Standing, parts: number): Readonly<Record<DealKind, Deal>> {
  const theyGet = asksFor(standing, parts);
  const full = costsTheCompany(standing, parts);
  const cut = (share: number) => ({
    feeCents: Math.round(full * share),
    theyGetCents: Math.round(theyGet * share),
  });
  return {
    fee: { kind: 'fee', ...cut(1), points: 0 },
    points: { kind: 'points', ...cut(1 - POINTS_COST_OF_THE_FEE), points: standing.wantsPoints },
    // Between the two: most of the fee now, and a bonus only if it runs away. It
    // costs a producer nothing on the pictures that do what they were expected to.
    threshold: { kind: 'threshold', ...cut(THRESHOLD_TAKES_OFF), points: 0, threshold: true },
  };
}

/**
 * How much of the fee comes off to take a threshold instead.
 *
 * Far less than points takes off, because a threshold is a far worse bet for the
 * person: it pays nothing at all unless the picture returns two and a half times its
 * cost, where points pay from the first euro that arrives.
 */
export const THRESHOLD_TAKES_OFF = 0.8;

/**
 * What a set of deals costs at the greenlight.
 *
 * Only the fees. Points cost nothing until something arrives, which is exactly the
 * property a producer short of cash is buying.
 */
export function upFrontCents(deals: readonly Deal[]): number {
  return deals.reduce((sum, d) => sum + d.feeCents, 0);
}

/** What a set of deals takes out of a sum the company has just received. */
export function pointsOutOf(deals: readonly Deal[], receivedCents: number): number {
  const points = deals.reduce((sum, d) => sum + d.points, 0);
  return Math.round(receivedCents * (Math.min(points, MOST_POINTS) / 100));
}

/**
 * The most of a picture that can be given away.
 *
 * A ceiling rather than a rule anybody is refused at, because the interesting failure
 * is a producer who covered a cash shortfall by giving away the back end and then
 * made a hit. Half is where that stops being a bad decision and starts being an
 * arithmetic error.
 */
export const MOST_POINTS = 50;

// ---------------------------------------------------------------------------
// Standing moves
// ---------------------------------------------------------------------------

/**
 * How many results in a row it takes to move a person up or down.
 *
 * Three, in either direction, and the same number both ways because an asymmetry here
 * would need evidence this project has not got. It is the rule everybody in the
 * business states about failure, and the version where a single result moves a career
 * makes casting a coin toss rather than a judgement.
 */
export const A_RUN_IS = 3;

/**
 * Where somebody's standing goes, given how their last pictures did.
 *
 * `results` is newest first, true where the picture returned more than it cost.
 * Returns the rung they should now be on, which may be the one they are on.
 *
 * Only an unbroken run counts. A person with two hits and a failure is exactly where
 * they were, which is right: the business forgives one of anything.
 */
export function standingAfter(now: string, results: readonly boolean[]): string {
  const at = rungOf(now);
  if (at < 0 || results.length < A_RUN_IS) return now;
  const recent = results.slice(0, A_RUN_IS);
  if (recent.every((won) => won)) return RUNGS[Math.min(RUNGS.length - 1, at + 1)] ?? now;
  if (recent.every((won) => !won)) return RUNGS[Math.max(0, at - 1)] ?? now;
  return now;
}
