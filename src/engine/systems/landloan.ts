/**
 * SLATE — a loan on land (docs/WORLD.md, stage 4e), from 2026-09-30,
 * researched in `docs/research/world/research-land-2.json`.
 *
 * America's Farm Credit System lends on farmland and bare land, and it's the
 * one land lender whose terms were read: about 6.3% in 2026, 35% down, as
 * is common on bare land, over up to 30 years (Farm Credit East, figures
 * from loan guides, secondary). Britain's AMC, Ireland's banks and Farm
 * Credit Canada publish how much they lend on land but not at what rate,
 * and Mexico's Infonavit lends only to someone formally employed, which an
 * actor isn't: SLATE keeps no loan there. A town lot isn't farmland, and
 * isn't financed. The loan is paid monthly, a payment missed owed; a sale
 * pays it off first.
 *
 * Missed, from later on 2026-09-30, the lender takes the land as a mortgage's
 * lender takes a home, on the home's timings (`HOME` in `systems/homes.ts`):
 * foreclosure begun when the oldest payment is 120 days late and the land
 * sold at 210, at the home's forced-sale share of its worth, on the record as
 * a home's foreclosure is. Regulation X's 120 days binds a loan on a home
 * lived in, not on land; no land lender's timing was read, and SLATE takes
 * the home's as the nearest. Until then a land loan missed only went into
 * arrears, without end.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { HOME } from './homes';
import { CITIES } from '../content/geography';
import type { Money } from '../core/money';
import { LAND_MARKETS } from '../content/land';
import { owe, payFromBank } from './household';
import { amortized } from './vehicles';
import type { Parcel } from './land';

export const LAND_LOAN = { apr: 0.063, down: 0.35, years: 30 } as const;
export const LAND_LOAN_KIND = 'land.loan_month';
const LAND_ROUTE = '/workspace/land';

export interface LandLoan { owed: Money; monthly: Money; monthsLeft: number; missed?: number; foreclosureAt?: Instant }

/** Whether a market's land is financed: America's acreage. */
export function financeable(market: number): boolean {
  const m = LAND_MARKETS[market];
  return Boolean(m && m.kind === 'acreage' && m.currency === 'USD');
}

/** A loan's opening: what's lent of a price, and its month, in the save's money. */
export function openLandLoan(price: Money): LandLoan {
  const owed = Math.round(price * (1 - LAND_LOAN.down));
  return { owed, monthly: amortized(owed, LAND_LOAN.apr, LAND_LOAN.years * 12), monthsLeft: LAND_LOAN.years * 12 };
}

/** A month of it: interest on what's owed, the rest off it; a payment the bank can't make, owed. True when the lender's sale is due. */
export function landLoanMonth(sim: Simulation, person: Person, parcel: Parcel): boolean {
  const loan = parcel.loan;
  if (!loan) return false;
  const interest = Math.round((loan.owed * LAND_LOAN.apr) / 12);
  const payment = Math.min(loan.monthly, loan.owed + interest);
  const principal = payment - interest;
  const paid = payFromBank(sim, person, payment, `Land loan payment, ${LAND_MARKETS[parcel.market]!.label}`, 'land');
  if (!paid) { owe(sim, person, payment, 'Land loan payment', 'land'); loan.missed = (loan.missed ?? 0) + 1; } else { loan.missed = 0; delete loan.foreclosureAt; }
  // The oldest missed payment's lateness: a payment each thirty days.
  const late = ((loan.missed ?? 0) - 1) * 30;
  if (late >= HOME.foreclosureStarts && loan.foreclosureAt === undefined) {
    loan.foreclosureAt = sim.now + (HOME.foreclosureSale - late) * MS_DAY;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'home', title: 'Foreclosure On Your Land', body: `The lender has begun to foreclose on ${LAND_MARKETS[parcel.market]!.label}. Pay what’s owed before ${formatDate(loan.foreclosureAt, CITIES.get(person.home?.cityId ?? person.currentLocationId)?.timeZone ?? 'UTC')}, or it’s sold.`, importance: 95, route: LAND_ROUTE });
  }
  if (loan.foreclosureAt !== undefined && sim.now >= loan.foreclosureAt) return true;
  // The payment was booked as spent; its principal moves off the loan.
  sim.post({ memo: 'Land loan, principal repaid', category: 'land', postings: [{ accountId: sim.nominalAccount('liability_other', 'Land Loans').id, amount: principal }, { accountId: sim.nominalAccount('expense', 'Land').id, amount: -principal }] });
  loan.owed -= principal;
  loan.monthsLeft -= 1;
  if (loan.owed <= 0 || loan.monthsLeft <= 0) { delete parcel.loan; return false; }
  sim.schedule({ at: sim.now + 30 * MS_DAY, kind: LAND_LOAN_KIND, label: 'Land Loan Payment', category: 'home', priority: 30, payload: { personId: person.id, parcelId: parcel.id } });
  return false;
}
