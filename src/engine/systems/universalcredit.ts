/**
 * SLATE — Universal Credit, for someone living in Britain with nothing, or
 * little, coming in (docs/WORLD.md). From 2026-09-29. Researched from gov.uk
 * and the DWP; kept with its sources in
 * `docs/research/world/research-safetynet-home.json`.
 *
 * A claim runs in monthly assessment periods from the day it's made, each
 * paid seven days after it ends, so the first payment comes about five weeks
 * on. An award is the standard allowance (£424.90 a month for a single
 * claimant of 25 or over from April 2026, £338.58 under 25), and a renter's
 * housing element, the rent up to the Local Housing Allowance (the
 * shared-room rate under 35, the one-bedroom rate from 35), less 55% of what
 * was earned in the period (a single claimant without children has no work
 * allowance), and less £4.35 a month for each £250 of savings over £6,000;
 * over £16,000 there's none. Six nil awards in a row close it. A British or
 * Irish citizen may claim; anyone else in Britain on a visa has no recourse
 * to public funds. A returning British citizen resumes habitual residence at
 * once as a returning former resident (the DWP's guidance, ADM C1959–C1960),
 * which SLATE takes to hold for everyone coming home. It isn't taxable, and
 * isn't income on a return.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { rateOn } from '../content/career';
import { UNIVERSAL_CREDIT } from '../content/safetynet';
import { earningsOf, homeOf, ukTaxYear } from './earnings';
import { payeeAccount } from './cash';
import { citizenOf } from './documents';
import { residenceIn } from './residence';
import { isoOfCountry } from './documents';

export interface CreditClaim { filedAt: Instant; periodStart: Instant; nils: number; paid: Money; closedAt?: Instant; why?: string }

export const UC_PERIOD_KIND = 'benefits.uc_period';

const YEAR = 365.25 * MS_DAY;
const inGbp = (sim: Simulation, x: Money) => { const cur = saveCurrency(sim.universe); return cur === 'GBP' ? x : exchange(x, cur, 'GBP') ?? x; };
const fromGbp = (sim: Simulation, x: Money) => { const cur = saveCurrency(sim.universe); return cur === 'GBP' ? x : exchange(x, 'GBP', cur) ?? x; };
const dayKey = (at: Instant) => new Date(at).toISOString().slice(0, 10);

/** Whether they live in Britain. */
export const livesInBritain = (person: Person) => CITIES.get(homeOf(person))?.countryId === 'uk';

/** What they hold in deposits of their own, in pounds: the capital the DWP counts. */
function capitalOf(sim: Simulation, person: Person): Money {
  const held = Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings'))
    .reduce((x, a) => x + Math.max(0, a.balance), 0);
  return inGbp(sim, held);
}

/** Why they can't claim, or nothing. */
export function creditRefusal(sim: Simulation, person: Person): string | undefined {
  if (!livesInBritain(person)) return 'Universal Credit is for someone living in Britain.';
  const own = isoOfCountry(person.citizenshipId);
  // Settled, indefinite leave to remain lifts the condition of no recourse to public funds (from 2026-09-30).
  if (own !== 'GB' && own !== 'IE' && !citizenOf(person, 'GB') && residenceIn(person, 'GB', sim.now)?.route !== 'uk-settled') return 'On a visa, Britain gives no recourse to public funds.';
  const age = (sim.now - person.birthInstant) / YEAR;
  if (age >= UNIVERSAL_CREDIT.pensionAge) return 'Past the state pension age, it’s Pension Credit, not Universal Credit.';
  if (person.universalCredit && person.universalCredit.closedAt === undefined) return 'You have a claim open.';
  if (capitalOf(sim, person) > UNIVERSAL_CREDIT.capitalUpper * 100) return `Savings over £${UNIVERSAL_CREDIT.capitalUpper.toLocaleString('en-GB')} rule it out.`;
  return undefined;
}

/** An assessment period's award, in pounds, and how it was reached. */
export function creditAward(sim: Simulation, person: Person, _from: Instant, to: Instant): { award: Money; lines: string[] } {
  const age = (to - person.birthInstant) / YEAR;
  const standard = rateOn(age < 25 ? UNIVERSAL_CREDIT.standardUnder25 : UNIVERSAL_CREDIT.standard, dayKey(to));
  const lines = [`Standard allowance ${formatMoney(standard, 'GBP')}`];
  // The housing element paid London's rent to its local housing allowance, and the period's earnings were the career's
  // days, until the home and the career went in the scope reset of 2026-10-09: there's no rent to meet, and no pay.
  const housing = 0;
  const earned = 0;
  const taper = Math.round(earned * UNIVERSAL_CREDIT.taper);
  if (taper) lines.push(`Less 55% of ${formatMoney(earned, 'GBP')} earned`);
  const capital = capitalOf(sim, person);
  const over = Math.max(0, capital - UNIVERSAL_CREDIT.capitalLower * 100);
  const tariff = Math.ceil(over / 250_00) * Math.round(UNIVERSAL_CREDIT.tariffPer250 * 100);
  if (capital > UNIVERSAL_CREDIT.capitalUpper * 100) return { award: 0, lines: [...lines, 'Savings over £16,000'] };
  if (tariff) lines.push(`Less ${formatMoney(tariff, 'GBP')} for savings`);
  return { award: Math.max(0, standard + housing - taper - tariff), lines };
}

/** A month on from a moment, by the calendar. */
const monthOn = (at: Instant) => { const d = new Date(at); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours()); };

function schedule(sim: Simulation, person: Person, periodStart: Instant): void {
  sim.schedule({ at: monthOn(periodStart) + UNIVERSAL_CREDIT.payDaysAfter * MS_DAY, kind: UC_PERIOD_KIND, label: 'Universal Credit: The Month Assessed', category: 'system', priority: 12, payload: { personId: person.id } });
}

function close(sim: Simulation, person: Person, why: string): void {
  const claim = person.universalCredit;
  if (!claim || claim.closedAt !== undefined) return;
  claim.closedAt = sim.now;
  claim.why = why;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'benefits', title: 'Universal Credit Closed', body: why, importance: 55, route: '/workspace/papers' });
}

/** Files a claim: the first period starts today. */
export function claimCredit(sim: Simulation, person: Person): { firstPaymentAt: Instant } {
  const no = creditRefusal(sim, person);
  if (no) throw new CommandError(no);
  person.universalCredit = { filedAt: sim.now, periodStart: sim.now, nils: 0, paid: 0 };
  schedule(sim, person, sim.now);
  return { firstPaymentAt: monthOn(sim.now) + UNIVERSAL_CREDIT.payDaysAfter * MS_DAY };
}

export function registerUniversalCredit(sim: Simulation): void {
  sim.onSchedule(UC_PERIOD_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const claim = person?.universalCredit;
    if (!person || !claim || claim.closedAt !== undefined) return;
    if (!livesInBritain(person)) { close(s, person, 'You’ve left Britain, and the claim with it.'); return; }
    const from = claim.periodStart;
    const to = monthOn(from);
    const { award, lines } = creditAward(s, person, from, to);
    // A claim credits the year's National Insurance record, as it credits Class 3 (`systems/statepension.ts`).
    const r = earningsOf(person);
    const key = ukTaxYear(from);
    if (!(r.ukCredited ?? []).includes(key)) r.ukCredited = [...(r.ukCredited ?? []), key];
    claim.periodStart = to;
    if (award <= 0) {
      claim.nils += 1;
      if (claim.nils >= UNIVERSAL_CREDIT.nilsToClose) { close(s, person, `Six months in a row with nothing due: ${lines.join('; ')}.`); return; }
    } else {
      claim.nils = 0;
      const due = fromGbp(s, award);
      const account = payeeAccount(s, person);
      s.post({ memo: `Universal Credit: the month to ${formatDate(to, 'Europe/London')}`, category: 'benefit', postings: [{ accountId: account.id, amount: due }, { accountId: s.nominalAccount('income', 'Universal Credit').id, amount: -due }] });
      claim.paid += due;
      if (person.id === s.universe.playerId) s.notify({ category: 'benefits', title: 'Universal Credit Paid', body: `${formatMoney(due, saveCurrency(s.universe))}: ${lines.join('; ')}.`, importance: 40, route: '/workspace/papers' });
    }
    schedule(s, person, to);
  });
}
