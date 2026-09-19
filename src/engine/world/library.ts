/**
 * SLATE — selling the tail of a picture, and buying somebody else's.
 *
 * The last thing the production system could not do. A picture opened, paid out over a
 * year and a bit, and then it was finished — the row stayed in the ledger and nothing
 * would ever touch it again. Every studio in the business this models has a library and
 * trades out of it, and a game where the only way to have money next year is to make
 * something new is missing half of what a studio is.
 *
 * Two commands, and they are opposite ends of one market.
 *
 * ## What is actually being sold
 *
 * The remainder. `stillToPay` walks the same two functions the weekly tick walks —
 * `openingWeek` and `windowsInWeek` — from the week after the last one paid to the week
 * the last window shuts, and totals what they would have paid. That is deliberate and
 * it is the reason this file has no valuation model of its own: a price computed from a
 * separate table would be a second opinion about the same future, and the two would
 * drift the first time anybody moved a window.
 *
 * So the number being haggled over is exactly the money that will no longer arrive. The
 * haggling is in `content/library.ts` — who wants it, and what they pay against it.
 *
 * ## The back end travels with the money, not with the picture
 *
 * A sale is a receipt like any other, and it goes through `receive`, which means the
 * people carrying points take their share of it. That is the decision that stops this
 * being a loophole. Paid the other way — the buyer inherits the obligation — selling
 * would be the standard way to escape a back end given away in a short week, and every
 * player would sell every picture the moment the fee was paid.
 *
 * ## What selling costs, beyond the discount
 *
 * A sold picture is out of the ceremony. `eligible` refuses anything with a `soldAt`,
 * and that is the real price of taking cash early on something good: the trophy would
 * have lifted the windows, and lifted the standing of everybody who worked on it, which
 * is how a talent pool improves. Selling a hit in November and watching February go to
 * somebody else is the mistake this mechanic exists to make available.
 *
 * ## Buying, and why the numbers are all shown
 *
 * A listing shows what it is asking **and** what its windows will pay. It would have
 * been easy to hide the second and call the difference judgement, but the remainder here
 * is deterministic — an estimate over a known number is a lie, and this project has a
 * tool that fails prose for less. So both are printed and the decision is the honest one
 * underneath: a cheap listing is money over seven months against the same money in a
 * greenlight that might return three times or lose the lot. A studio that buys only
 * libraries is safe and grows slowly, which is a real way to play and a real ceiling.
 *
 * Roughly half the listings ask more than they will pay. They are there to be refused.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import type { Money } from '../core/money';
import type { Project } from '../domain/company';
import type { Channel } from '../content/format';
import { formatById, FORMATS } from '../content/format';
import { LAST_WEEK_ANYTHING_PAYS } from '../content/release';
import { STUDIO_BY_ID, STUDIOS } from '../content/rivals';
import {
  APPETITE_BY_STUDIO, APPETITES, ASKING_STRAYS, MOST_ON_THE_MARKET, SOONEST_WEEK,
  offerOn, titleFrom, whyNotQuote, type Appetite,
} from '../content/library';
import { cashAccountFor, projectsOf } from './company';
import { MS_WEEK } from './lot';
import { INCOME_PREFIX, CATEGORY, receive, reachesUs } from './takings';
import {
  RUN_KIND, dealsOn, openingWeek, settleTheTalent, windowsInWeek, type Opening,
} from './run';

/** Where a library sale is credited from, as its own window. */
export const LIBRARY_WINDOW = 'library';

/** Where what was paid for somebody else's library is charged. */
export const BOUGHT_ACCOUNT = 'expense:bought';

/**
 * What is left to pay on a run, from a given week to the end of its life.
 *
 * Walks the same functions the tick walks rather than integrating a curve, which costs
 * about ninety iterations and buys the one property that matters: a price and a payment
 * that cannot disagree, because they are the same arithmetic run twice.
 */
export function stillToPay(opening: Opening, formatId: string | undefined, fromWeek: number): Money {
  let sum = 0;
  for (let week = Math.max(1, fromWeek); week <= LAST_WEEK_ANYTHING_PAYS; week += 1) {
    const gross = openingWeek(opening, formatId, week);
    if (gross > 0) sum += reachesUs(gross, opening.channel);
    for (const window of windowsInWeek(opening, week)) sum += window.cents;
  }
  return sum;
}

/** How many weeks of a run have been paid, which is where a quote starts from. */
export const weeksInto = (opening: Opening): number => opening.weeksPaid;

export interface Quote {
  studioId: string;
  name: string;
  wants: string;
  /** What they would pay. Zero where they will not quote at all. */
  cents: Money;
  /** Why they will not, where they will not. */
  why?: string;
}

/**
 * What every studio would pay for what is left of one picture.
 *
 * All five, always, including the ones that refuse. A market where the studios that
 * will not deal are simply absent teaches nothing about who deals in what.
 */
export function quotesOn(sim: Simulation, projectId: Id): readonly Quote[] {
  const project = projectsOf(sim.universe).find((p) => p.id === projectId);
  const opening = project?.opening;
  if (!project || !opening) return [];
  const week = weeksInto(opening);
  const left = stillToPay(opening, project.formatId, week + 1);
  return APPETITES.map((appetite) => {
    const studio = STUDIO_BY_ID[appetite.studioId]!;
    const why = whyNotQuote(appetite, opening.channel, week);
    return {
      studioId: appetite.studioId,
      name: studio.name,
      wants: appetite.wants,
      cents: why ? 0 : offerOn(appetite, left, opening.wordOfMouth),
      why,
    };
  });
}

/** The best price on the table, for a screen that wants one figure. */
export function bestQuote(sim: Simulation, projectId: Id): Quote | undefined {
  const quotes = quotesOn(sim, projectId).filter((q) => q.why === undefined);
  if (quotes.length === 0) return undefined;
  return quotes.reduce((best, one) => (one.cents > best.cents ? one : best));
}

export function whyNotSellIt(sim: Simulation, projectId: Id, studioId: string): string | undefined {
  const project = projectsOf(sim.universe).find((p) => p.id === projectId);
  if (!project) return 'No such project.';
  const opening = project.opening;
  if (!opening) return 'It hasn’t opened. There’s no run to sell yet.';
  if (opening.soldAt !== undefined) return 'That one belongs to another studio now.';
  const appetite: Appetite | undefined = APPETITE_BY_STUDIO[studioId];
  if (!appetite) return 'No such studio.';
  const why = whyNotQuote(appetite, opening.channel, weeksInto(opening));
  if (why) return why;
  if (stillToPay(opening, project.formatId, weeksInto(opening) + 1) <= 0) {
    return 'Every window has shut. There’s nothing left in it to buy.';
  }
  return undefined;
}

/**
 * Sells the rest of a run, and stops it paying us.
 *
 * Three things happen and they belong in one place. The money comes in through the same
 * receipt path every other window uses, so the back end is paid out of it. The tick is
 * canceled, because an item that fires every week to pay nothing is how a save grows
 * without bound. And the people on it are settled now rather than at the last window,
 * since for this company the last window has arrived.
 */
export function sellTheTitle(
  sim: Simulation,
  projectId: Id,
  studioId: string,
): { ok: boolean; error?: string; cents: Money } {
  const no = whyNotSellIt(sim, projectId, studioId);
  if (no) return { ok: false, error: no, cents: 0 };
  const project = projectsOf(sim.universe).find((p) => p.id === projectId)!;
  const opening = project.opening!;
  const studio = STUDIO_BY_ID[studioId]!;
  const cents = offerOn(
    APPETITE_BY_STUDIO[studioId]!,
    stillToPay(opening, project.formatId, weeksInto(opening) + 1),
    opening.wordOfMouth,
  );

  receive(
    sim, project.companyId, project.id, LIBRARY_WINDOW, `${studio.name}, For The Library`,
    cents, dealsOn(project), `${project.id}:library:sale`,
    Object.values(project.ancillaries ?? {}),
  );

  opening.soldAt = sim.now;
  opening.soldToId = studioId;
  opening.soldForCents = cents;

  for (const item of sim.timeline.pending()) {
    if (item.kind === RUN_KIND && item.refId === project.id) sim.timeline.cancel(item.id, sim.now);
  }
  settleTheTalent(sim, project.id);

  sim.notify({
    category: 'business',
    title: `${studio.name} Took ${project.title}`,
    body: `The rest of its run belongs to ${studio.name} now, and so does whatever those windows pay.`,
    importance: 60,
  });
  return { ok: true, cents };
}

// ---------------------------------------------------------------------------
// The other side: what the rivals have up for sale
// ---------------------------------------------------------------------------

export interface Listing {
  id: string;
  sellerId: string;
  seller: string;
  title: string;
  formatId: string;
  channel: Channel;
  /** How far through its run it already is. */
  weeksRun: number;
  /** What its whole life was reckoned at, by whoever made it. */
  reckonedCents: Money;
  wordOfMouth: number;
  /** What the windows it has left will actually pay. Shown, not hidden. */
  leftCents: Money;
  askingCents: Money;
}

/** A month, as the market is refreshed in them. */
const monthKey = (at: number): string => {
  const d = new Date(at);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
};

/**
 * What is on the market this month.
 *
 * Drawn from the save's seed and the month rather than stored, for the same reason the
 * release calendar is: a stored market is a second place the truth lives, has to be
 * migrated, and drifts. Drawn, it is the same every time it is asked inside a month and
 * completely different the month after, which is what a market looks like.
 */
export function onTheMarket(sim: Simulation, at: number = sim.now): readonly Listing[] {
  const key = monthKey(at);
  const rng = sim.rng('library', key);
  const many = Math.floor(rng.next() * (MOST_ON_THE_MARKET + 1));
  const listings: Listing[] = [];
  for (let i = 0; i < many; i += 1) {
    const studio = STUDIOS[Math.floor(rng.next() * STUDIOS.length)]!;
    const channel = studio.channels[Math.floor(rng.next() * studio.channels.length)]!;
    const onChannel = FORMATS.filter((f) => f.channels.includes(channel));
    const format = onChannel[Math.floor(rng.next() * onChannel.length)] ?? FORMATS[0]!;
    // Far enough in that the shape is legible, and short of the end so that there is
    // something left worth buying. A position with four weeks in it is a rounding error
    // with a title on it.
    const weeksRun = SOONEST_WEEK + Math.floor(rng.next() * (LAST_WEEK_ANYTHING_PAYS - SOONEST_WEEK - 12));
    const reckonedCents = Math.round((900_000_00 + rng.next() * 26_000_000_00) * studio.pull);
    const wordOfMouth = Math.round((rng.next() * 1.7 - 0.85) * 100) / 100;
    const opening: Opening = {
      at: at - weeksRun * MS_WEEK,
      channel,
      campaignCents: 0,
      reckonedCents,
      wordOfMouth,
      weeksPaid: weeksRun,
    };
    const leftCents = stillToPay(opening, format.id, weeksRun + 1);
    if (leftCents <= 0) continue;
    listings.push({
      id: `${key}:${i}`,
      sellerId: studio.id,
      seller: studio.name,
      title: titleFrom(Math.floor(rng.next() * 997), Math.floor(rng.next() * 997)),
      formatId: format.id,
      channel,
      weeksRun,
      reckonedCents,
      wordOfMouth,
      leftCents,
      askingCents: Math.max(1, Math.round(leftCents * (1 + (rng.next() * 2 - 1) * ASKING_STRAYS))),
    });
  }
  return listings;
}

/**
 * One listing, found by its id rather than by what month it is now.
 *
 * The market is drawn rather than stored, so a row from last month is not gone — it is
 * simply not being asked about. The id carries the month it belongs to, which is what
 * lets a command name a position without the world having to keep a table of them.
 */
export function listingById(sim: Simulation, listingId: string): Listing | undefined {
  const [key] = listingId.split(':');
  const [year, month] = (key ?? '').split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return undefined;
  return onTheMarket(sim, Date.UTC(year!, month!, 8)).find((one) => one.id === listingId);
}

export function whyNotBuy(sim: Simulation, companyId: Id, listingId: string): string | undefined {
  const listing = listingById(sim, listingId);
  if (!listing) return 'That one isn’t on the market any more.';
  const cash = cashAccountFor(sim.universe, companyId);
  if (!cash) return 'The company has no cash account.';
  if (cash.balance < listing.askingCents) return 'The company doesn’t have it.';
  const already = projectsOf(sim.universe).some((p) => p.boughtAs === listingId);
  if (already) return 'You bought that one already.';
  return undefined;
}

/**
 * Buys somebody else's library position, which arrives as a picture already running.
 *
 * It is a real project with a real opening and a real weekly tick, which is what makes
 * the money arrive the way money arrives rather than as one lump with a memo. What it is
 * not is ours to be proud of: it carries `boughtIn`, the ceremony refuses it, and it
 * founds no line. A studio's standing should come from what it made.
 */
export function buyTheTitle(
  sim: Simulation,
  companyId: Id,
  listingId: string,
): { ok: boolean; error?: string; projectId?: Id } {
  const no = whyNotBuy(sim, companyId, listingId);
  if (no) return { ok: false, error: no };
  const listing = listingById(sim, listingId)!;
  const format = formatById(listing.formatId)!;
  const cash = cashAccountFor(sim.universe, companyId)!;

  const made: Project = {
    id: sim.nextId('project'),
    saveId: sim.universe.meta.id,
    companyId,
    title: listing.title,
    medium: format.medium,
    stage: 'delivered',
    startedAt: sim.now,
    spentCents: 0,
    delivered: [],
    formatId: format.id,
    secondsEach: format.secondsEach.least,
    boughtAs: listing.id,
    opening: {
      at: sim.now - listing.weeksRun * MS_WEEK,
      channel: listing.channel,
      campaignCents: 0,
      reckonedCents: listing.reckonedCents,
      wordOfMouth: listing.wordOfMouth,
      weeksPaid: listing.weeksRun,
      boughtIn: true,
    },
  };
  sim.universe.projects[made.id] = made;

  if (!sim.ledger.tryAccount(BOUGHT_ACCOUNT)) {
    sim.ledger.open({
      id: BOUGHT_ACCOUNT,
      saveId: sim.universe.meta.id,
      kind: 'expense',
      name: 'Libraries Bought',
      ownerId: 'world',
      balance: 0,
      openedAt: sim.now,
      nominal: true,
      category: CATEGORY,
    });
  }
  sim.post({
    memo: `${listing.title}, from ${listing.seller}`,
    category: CATEGORY,
    postings: [
      { accountId: cash.id, amount: -listing.askingCents },
      { accountId: BOUGHT_ACCOUNT, amount: listing.askingCents },
    ],
    refType: 'project',
    refId: made.id,
    idempotencyKey: `${made.id}:bought`,
  });

  sim.schedule({
    at: sim.now + MS_WEEK,
    kind: RUN_KIND,
    label: `${made.title}, Week By Week`,
    category: 'system',
    priority: 40,
    refType: 'project',
    refId: made.id,
    recurrence: { unit: 'week', interval: 1 },
    payload: { projectId: made.id },
  });
  return { ok: true, projectId: made.id };
}

/** What a library position has paid us since we bought it, off the postings. */
export function paidSinceBought(sim: Simulation, projectId: Id): Money {
  let sum = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.refType !== 'project' || txn.refId !== projectId) continue;
    for (const p of txn.postings) if (p.accountId.startsWith(INCOME_PREFIX)) sum += -p.amount;
  }
  return sum;
}

type Done = { ok: boolean; error?: string };

export function registerLibrary(sim: Simulation): void {
  sim.onCommand<{ projectId: Id; studioId: string }, Done & { cents: Money }>(
    'library.sell', (p) => sellTheTitle(sim, p.projectId, p.studioId),
  );
  sim.onCommand<{ companyId: Id; listingId: string }, Done & { projectId?: Id }>(
    'library.buy', (p) => buyTheTitle(sim, p.companyId, p.listingId),
  );
}
