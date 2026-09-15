/**
 * SLATE — the tax on what the company buys, and getting it back.
 *
 * `capabilitiesOf` has always listed Reclaim The Tax as one of the nine things a
 * production company has to be able to do, and said what it was for: "claim
 * back the value added tax on everything the company buys, which for a
 * production is a fifth of the spend." The door opened the moment the company
 * got a VAT number, and behind it there was nothing. Not one króna was ever
 * reclaimed, `VAT_RATE` was read by a single test asserting it still equalled
 * the number written beside it, and a player could open that door and be no
 * better off than before — which is the fault this project's own arrears page
 * exists to catch, sitting in the middle of the page that lists the nine doors.
 *
 * What it actually is: a registered company charges VSK on what it sells and
 * reclaims it on what it buys, netting the two off every two months. A
 * production sells rarely and buys enormously, so the return is nearly always a
 * refund rather than a bill, and it is real money on a real lag.
 *
 * ## What is a purchase, and what only looks like one
 *
 * The thing that makes this worth building rather than a percentage of the
 * ledger is that most of what a company spends is not a purchase at all. Wages
 * carry no VSK. Insurance is an exempt supply. Property tax is a tax. Money the
 * company moves into its own sinking fund is not a purchase until the day it
 * buys a roof with it. Only three of the lot's seven standing costs are things
 * bought from somebody who charged tax on them, and `content/lot.ts` says which
 * and why on each line rather than here.
 *
 * So the reclaim is a fifth of a third of the overhead rather than a fifth of
 * everything, and the one genuinely large claim a company makes is the day it
 * builds something.
 */

import type { Simulation } from '../core/simulation';
import type { Id } from '../core/ids';
import type { Instant } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { instantFromZoned, zonedParts } from '../core/time';
import { VAT_ON_A_PURCHASE, VAT_PERIOD_MONTHS } from '../content/incorporation';
import { OVERHEAD } from '../content/lot';
import { LOT_NAME } from '../content/estate';
import { BUILD_MEMO } from './lot';
import { onRegister, parentCompany } from './company';

/** What the scheduler calls the day the return goes in. */
export const VAT_KIND = 'company.vat_return';

/** What the refund is posted under, so it can be told from anything else. */
export const VAT_MEMO = 'Reclaimed VSK';

/**
 * Every memo the ledger writes for something bought with VSK on it.
 *
 * Read off the content rather than listed here, so a line that changes what it
 * is changes what is reclaimable on it in the same edit. The lot writes its
 * overhead as `Sugar Land Studios: <label>`, which is the only place these
 * strings are formed, and `world/lot.ts` exports the build memo for the same
 * reason.
 */
export function vatableMemos(): string[] {
  return [
    ...OVERHEAD.filter((line) => line.carriesVat).map((line) => `${LOT_NAME}: ${line.label}`),
    BUILD_MEMO,
  ];
}

/** What the company bought with VSK on it between two instants, at the price paid. */
export function boughtWithVat(sim: Simulation, from: Instant, to: Instant): Money {
  const memos = new Set(vatableMemos());
  let spent = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.at < from || txn.at >= to || !memos.has(txn.memo)) continue;
    for (const posting of txn.postings) if (posting.amount > 0) spent += posting.amount;
  }
  return spent;
}

/**
 * The tax inside what was bought, which is what comes back.
 *
 * Zero for a company that is not on the VAT register, and that is the door: an
 * unregistered company pays exactly the same prices and simply keeps none of
 * it. The difference between the two is the only reason the registration is
 * worth its fee.
 */
export function reclaimable(sim: Simulation, from: Instant, to: Instant): Money {
  if (!onRegister(sim.universe, 'is_vat')) return 0;
  return Math.round(boughtWithVat(sim, from, to) * VAT_ON_A_PURCHASE);
}

/** The company's cash account. */
function purse(sim: Simulation, companyId: Id | undefined): Id | undefined {
  if (!companyId) return undefined;
  return Object.values(sim.universe.accounts)
    .find((one) => one.ownerId === companyId && one.kind === 'company_cash' && !one.closedAt)?.id;
}

/** Midnight on the first of the month, this many months on. */
function startOfMonthsOn(at: Instant, months: number, zone: string): Instant {
  const parts = zonedParts(at, zone);
  const zeroed = parts.month - 1 + months;
  return instantFromZoned(
    { year: parts.year + Math.floor(zeroed / 12), month: (zeroed % 12) + 1, day: 1, hour: 0, minute: 0 },
    zone,
  );
}

/**
 * Files the return for the period that has just ended.
 *
 * Posted as income under one memo, because it is not a sale and should never be
 * read as one — it is money the company had already handed over coming back.
 */
export function fileTheReturn(sim: Simulation, from: Instant): Money {
  const company = parentCompany(sim.universe);
  const account = purse(sim, company?.id);
  if (!account) return 0;
  const back = reclaimable(sim, from, sim.now);
  if (back <= 0) return 0;
  sim.income(account, back, VAT_MEMO, 'business');
  sim.notify({
    category: 'business',
    title: 'The VSK Return',
    body: `${formatMoney(back, { cents: false })} comes back on what the company bought over the `
      + `last ${VAT_PERIOD_MONTHS} months. Wages, cover and the rates carry no tax to reclaim, so `
      + 'this is the part that was bought from a supplier who charged it.',
    importance: 40,
  });
  return back;
}

/** Puts the return on the clock, every two months. */
export function registerVat(sim: Simulation): void {
  sim.onSchedule(VAT_KIND, (item) => {
    const from = Number(item.payload?.from ?? sim.now);
    fileTheReturn(sim, from);
    sim.schedule({
      at: startOfMonthsOn(sim.now, VAT_PERIOD_MONTHS, sim.homeZone),
      kind: VAT_KIND,
      label: 'The VSK Return',
      category: 'system',
      priority: 6,
      payload: { from: sim.now },
    });
  });

  if (!sim.universe.scheduled.some((one) => one.kind === VAT_KIND && one.status === 'pending')) {
    sim.schedule({
      at: startOfMonthsOn(sim.now, VAT_PERIOD_MONTHS, sim.homeZone),
      kind: VAT_KIND,
      label: 'The VSK Return',
      category: 'system',
      priority: 6,
      payload: { from: sim.now },
    });
  }
}

/** Where the reclaim stands, in a sentence. */
export function whereTheVatStands(sim: Simulation): string {
  if (!onRegister(sim.universe, 'is_vat')) {
    return 'The company isn’t on the VAT register, so the tax on everything it buys is simply a cost.';
  }
  const since = sim.now - VAT_PERIOD_MONTHS * 30 * 24 * 60 * 60 * 1000;
  const back = reclaimable(sim, since, sim.now);
  if (back <= 0) return 'The company has bought nothing lately that carried VSK to reclaim.';
  return `${formatMoney(back, { cents: false })} of VSK is standing on what the company has bought `
    + 'since the last return.';
}
