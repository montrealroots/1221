/**
 * SLATE — unemployment insurance between jobs, in New York, California and Connecticut
 * (`content/safetynet.ts`).
 *
 * A claim is filed with the state the base period's wages were earned in,
 * the most of them where they were earned in more than one, as an
 * interstate claim is: a New Haven actor paid for New York work claims in
 * New York. Until 2026-09-28 a claim went to the state they lived in, and
 * where the wages' state isn't one SLATE pays in, or the wages are from
 * before where they were earned was kept, it still does. Its
 * base period is the first four of the last five completed quarters, or the
 * last four where those fall short, and it pays only where the wages in it
 * meet the state's tests: New York's $3,500 quarter, two quarters and one and
 * a half times; California's $1,300 quarter, or $900 and one and a quarter
 * times. The weekly benefit is the state's share of the high quarter, between
 * its floor and its maximum; the first week that would pay is the unpaid
 * waiting week. Each Sunday the week is certified: a week with work pays by
 * New York's hours, less California's share of the earnings, or less
 * two-thirds of them in Connecticut, a week abroad pays nothing (a week
 * elsewhere in the country is certified as an interstate claim is), and the claim ends at 26 weeks' benefit, or in
 * California half the base period's wages, or a year from filing. What's paid
 * is income on the return.
 */

import type { Simulation } from '../core/simulation';
import { usWorkAuthorized } from './permission';
import { inHospital } from './health';
import { laidUp } from './injury';
import { schoolEnded } from './school';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, formatDate, instantFromZoned, normalDate, zonedParts, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { BENEFIT_STATE, CALIFORNIA_UI, NEW_YORK_UI, type BenefitState, CONNECTICUT_UI } from '../content/safetynet';
import { earningsOf, homeOf, quarterKey, quartersBefore, recordBenefit, workedBetween } from './earnings';
import { payeeAccount } from './cash';
import { rateOn } from '../content/rates';
import { claimCredit, livesInBritain } from './universalcredit';
import { claimAtHome, livesInIreland, livesInMexicoCity } from './homebenefits';

export const BENEFIT_WEEK_KIND = 'benefits.week';

export interface Claim {
  state: BenefitState;
  filedAt: Instant;
  endsAt: Instant;
  weekly: Money;
  maxTotal: Money;
  paid: Money;
  waited: boolean;
  basePeriod: string[];
  closedAt?: Instant;
}

export interface UnemploymentRecord { claim?: Claim; past: Claim[] }

export function unemploymentOf(person: Person): UnemploymentRecord {
  person.unemployment ??= { past: [] };
  return person.unemployment;
}

const usd = (cents: Money, into: string) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);
const dollars = (cents: number) => Math.floor(cents / 100) * 100;

/** Whether a base period's wages qualify, and for what, in a state: the weekly benefit and the most a claim pays. */
export function monetary(state: BenefitState, wages: Money[], into = 'USD', year = 2026): { ok: boolean; weekly: Money; maxTotal: Money; why: string } {
  const total = wages.reduce((a, b) => a + b, 0);
  const sorted = [...wages].sort((a, b) => b - a);
  const hq = sorted[0] ?? 0;
  const quarters = wages.filter((w) => w > 0).length;
  const $ = (c: Money) => formatMoney(usd(c, into), into);
  if (state === 'ny') {
    const u = NEW_YORK_UI;
    const hqNeeded = usd(u.highQuarterMinimum, into);
    // Wages in two quarters, which the Department asks, are settled by the next two tests: one quarter's
    // total can never be one and a half times itself, and past $19,118 the others must hold $9,559.
    if (hq < hqNeeded) return { ok: false, weekly: 0, maxTotal: 0, why: `New York asks for ${$(u.highQuarterMinimum)} in one quarter.` };
    if (total < u.totalTimesHighQuarter * hq && hq < usd(19_118_00, into)) return { ok: false, weekly: 0, maxTotal: 0, why: 'New York asks for base-period wages of one and a half times the high quarter.' };
    if (hq >= usd(19_118_00, into) && total - hq < usd(9_559_00, into)) return { ok: false, weekly: 0, maxTotal: 0, why: `New York asks for ${$(9_559_00)} in the other quarters.` };
    const over = usd(u.over25Until, into);
    let weekly = quarters === 4
      ? (hq > over ? Math.max(usd(u.floor, into), hq / 26) : hq / 25)
      : (hq > usd(4_000_00, into) ? Math.max(usd(u.floor, into), (hq + (sorted[1] ?? 0)) / 2 / 26) : hq > over ? Math.max(usd(u.floor, into), hq / 26) : hq / 25);
    weekly = Math.min(usd(u.maximum, into), dollars(weekly));
    return { ok: true, weekly, maxTotal: weekly * u.weeks, why: `${$(weekly)} a week for up to ${u.weeks} weeks.` };
  }
  if (state === 'ct') {
    const u = CONNECTICUT_UI;
    const floor = usd(rateOn(u.floor, `${year}-12-31`), into);
    // The two highest quarters' average over 26, to the dollar, from the floor to the maximum.
    const weekly = Math.min(usd(u.maximum, into), Math.max(floor, dollars(((sorted[0] ?? 0) + (sorted[1] ?? 0)) / 2 / 26)));
    if (total < u.totalTimesWeekly * weekly) return { ok: false, weekly: 0, maxTotal: 0, why: `Connecticut asks for base-period wages of ${u.totalTimesWeekly} times the weekly benefit: ${$(u.totalTimesWeekly * weekly)} for ${$(weekly)}.` };
    return { ok: true, weekly, maxTotal: weekly * u.weeks, why: `${$(weekly)} a week for up to ${u.weeks} weeks.` };
  }
  const u = CALIFORNIA_UI;
  const enough = hq >= usd(u.highQuarterMinimum, into) || (hq >= usd(u.lowHighQuarter, into) && total >= u.totalTimesHighQuarter * hq);
  if (!enough) return { ok: false, weekly: 0, maxTotal: 0, why: `California asks for ${$(u.highQuarterMinimum)} in one quarter, or ${$(u.lowHighQuarter)} and one and a quarter times it in all.` };
  const weekly = Math.min(usd(u.maximum, into), Math.max(usd(u.floor, into), dollars(hq / 26)));
  const maxTotal = Math.min(weekly * u.weeks, Math.round(total / 2));
  return { ok: true, weekly, maxTotal, why: `${$(weekly)} a week, up to ${$(maxTotal)} in all.` };
}

/** The states SLATE pays unemployment in, by their region. */
const CLAIM_STATES: Readonly<Record<string, BenefitState>> = { 'us-ny': 'ny', 'us-ca': 'ca', 'us-ct': 'ct' };

/** The state a claim filed now goes to: where the last five quarters' wages were mostly earned, if it's one SLATE pays in. */
export function claimStateFor(person: Person, at: Instant): BenefitState | undefined {
  const p = zonedParts(at, 'America/New_York');
  const [y, q] = quarterKey(p.year, p.month).split('-').map(Number) as [number, number];
  const by: Record<string, Money> = {};
  for (const key of quartersBefore(y, q, 5)) for (const [state, wages] of Object.entries(earningsOf(person).quarters[key]?.byState ?? {})) by[state] = (by[state] ?? 0) + wages;
  const most = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
  return most ? CLAIM_STATES[most[0]] : undefined;
}

/** The base period a claim filed at a moment reads: the basic one, or the alternate where the basic falls short. */
export function basePeriodFor(person: Person, state: BenefitState, at: Instant, into = 'USD'): { quarters: string[]; wages: Money[]; result: ReturnType<typeof monetary> } {
  const p = zonedParts(at, 'America/New_York');
  const [y, q] = quarterKey(p.year, p.month).split('-').map(Number) as [number, number];
  const record = earningsOf(person).quarters;
  const read = (keys: string[]) => keys.map((k) => record[k]?.wages ?? 0);
  const basic = quartersBefore(y, q, 5).slice(0, 4);
  const first = monetary(state, read(basic), into, p.year);
  if (first.ok) return { quarters: basic, wages: read(basic), result: first };
  const alternate = quartersBefore(y, q, 4);
  const second = monetary(state, read(alternate), into, p.year);
  return second.ok ? { quarters: alternate, wages: read(alternate), result: second } : { quarters: basic, wages: read(basic), result: first };
}

/** A week's benefit, with its work: New York by hours, unless the pay reaches the maximum; California less its earnings past the disregard. */
export function weekBenefit(claim: Claim, hours: number, pay: Money, into = 'USD'): Money {
  if (claim.state === 'ny') {
    if (pay >= usd(NEW_YORK_UI.maximum, into)) return 0;
    const band = NEW_YORK_UI.hourBands.find(([upTo]) => hours <= upTo);
    return band ? Math.round(claim.weekly * band[1]) : 0;
  }
  if (claim.state === 'ct') {
    // The benefit less two-thirds of the week's pay, which comes to nothing at the statute's one and a half times the benefit.
    const dollarsOf = Math.round(pay / 100) * 100;
    return Math.max(0, claim.weekly - Math.ceil((dollarsOf * CONNECTICUT_UI.partialShare) / 100) * 100);
  }
  const kept = Math.max(usd(CALIFORNIA_UI.disregard, into), pay * CALIFORNIA_UI.disregardShare);
  return Math.max(0, Math.round(claim.weekly - Math.max(0, pay - kept)));
}

function nextSunday(from: Instant, zone: string): Instant {
  const p = zonedParts(from, zone);
  for (let n = 1; n <= 7; n += 1) {
    const at = instantFromZoned({ ...normalDate(p.year, p.month, p.day + n), hour: 20 }, zone);
    const q = zonedParts(at, zone);
    if (new Date(Date.UTC(q.year, q.month - 1, q.day)).getUTCDay() === 0) return at;
  }
  return from + 7 * MS_DAY;
}

function close(sim: Simulation, person: Person, why: string): void {
  const record = unemploymentOf(person);
  const claim = record.claim;
  if (!claim) return;
  claim.closedAt = sim.now;
  record.past.push(claim);
  delete record.claim;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'benefits', title: 'Your Unemployment Claim Ended', body: why, importance: 60, route: '/workspace/papers' });
}

/**
 * Why a student can't be paid, or nothing (from 2026-10-10): Connecticut takes somebody enrolled full-time as not
 * available for work, CGS 31-235(b) withholding the availability protection from a claimant who was a full-time
 * student in the two years before (unless they worked full-time through them), and the Labor Department asking a
 * student to change classes or leave them for a job. SLATE's reading: enrolled at the school, summer included, is
 * full-time. New York's and California's own student rules aren't kept, and their claims don't read this.
 */
export function studentUnavailable(person: Person, state: BenefitState): string | undefined {
  const s = person.school;
  if (state !== 'ct' || !s || schoolEnded(s.standing)) return undefined;
  return 'Connecticut takes a full-time student as not available for work (CGS 31-235(b)): a claim pays once you’ve left school.';
}

export function registerUnemployment(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { weekly: Money; maxTotal: Money; firstPaymentAt?: Instant }>('benefits.claim', (_p, { sim: s }) => {
    const person = s.player;
    // Living in Britain, the claim is Universal Credit's (`systems/universalcredit.ts`).
    if (livesInBritain(person)) { const uc = claimCredit(s, person); return { weekly: 0, maxTotal: 0, firstPaymentAt: uc.firstPaymentAt }; }
    // In Ireland, Jobseeker's Allowance; in Mexico City, its Seguro de Desempleo (`systems/homebenefits.ts`).
    if (livesInIreland(person) || livesInMexicoCity(person)) { const home = claimAtHome(s, person); return { weekly: 0, maxTotal: 0, firstPaymentAt: home.firstPaymentAt }; }
    const state = claimStateFor(person, s.now) ?? BENEFIT_STATE[homeOf(person)];
    if (!state) throw new CommandError('SLATE pays unemployment in New York, California and Connecticut, where you’d have to have worked or live.');
    const record = unemploymentOf(person);
    if (record.claim) throw new CommandError('You have a claim open.');
    // A claim was refused on a job until the career went in the scope reset of 2026-10-09; there are no jobs to be on.
    // In Connecticut a full-time student isn't available for work (from 2026-10-10, `studentUnavailable`).
    const studying = studentUnavailable(person, state);
    if (studying) throw new CommandError(studying);
    // A noncitizen is paid only with permission to work in the US (FUTA 3304(a)(14)), from 2026-10-10: until then a
    // dismissed student out of status was paid.
    if (!usWorkAuthorized(person, s.now)) throw new CommandError('Unemployment pays a noncitizen only with permission to work in the US, such as OPT (FUTA 3304(a)(14)).');
    const cur = saveCurrency(s.universe);
    const base = basePeriodFor(person, state, s.now, cur);
    if (!base.result.ok) throw new CommandError(`${base.result.why} Your base period’s quarters paid ${base.wages.map((w) => formatMoney(w, cur)).join(', ')}.`);
    const zone = CITIES.require(homeOf(person)).timeZone;
    record.claim = {
      state, filedAt: s.now, endsAt: s.now + 365 * MS_DAY, weekly: base.result.weekly, maxTotal: base.result.maxTotal,
      // Connecticut has no waiting week.
      paid: 0, waited: state === 'ct', basePeriod: base.quarters,
    };
    s.schedule({ at: nextSunday(s.now, zone), kind: BENEFIT_WEEK_KIND, label: 'Unemployment: The Week Certified', category: 'system', priority: 12, payload: { personId: person.id } });
    return { weekly: base.result.weekly, maxTotal: base.result.maxTotal };
  });

  sim.onSchedule(BENEFIT_WEEK_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const claim = person ? unemploymentOf(person).claim : undefined;
    if (!person || !claim) return;
    const cur = saveCurrency(s.universe);
    if (s.now >= claim.endsAt) { close(s, person, 'A year from filing, the benefit year is over.'); return; }
    // Certified from anywhere in the country, as an interstate claim is, and
    // not from abroad, where they aren't available for work. Until 2026-09-27
    // it paid only in the claim's state, and a New York claimant who moved to
    // Los Angeles was paid nothing for the rest of the benefit year.
    // Able and available: in the country, not a student, allowed to work, and not in hospital or laid up on the day
    // the week is certified (the last two from 2026-10-10).
    const available = CITIES.get(person.currentLocationId)?.countryId === 'us' && !studentUnavailable(person, claim.state) && usWorkAuthorized(person, s.now) && !inHospital(person, s.now) && !laidUp(person, s.now);
    // The week's hours and pay worked: the career's days until the career went on 2026-10-09, and from 2026-10-10 the
    // school's work-study and Summer Cabaret wages paid in it (`workedBetween`), which until then were taken as none.
    const worked = workedBetween(s, person, item.at - 7 * MS_DAY, item.at);
    const due = available ? Math.min(weekBenefit(claim, worked.hours, worked.pay, cur), claim.maxTotal - claim.paid) : 0;
    const zone = CITIES.require(homeOf(person)).timeZone;
    const again = () => s.schedule({ at: nextSunday(item.at, zone), kind: BENEFIT_WEEK_KIND, label: 'Unemployment: The Week Certified', category: 'system', priority: 12, payload: { personId: person.id } });
    if (due <= 0) { again(); return; }
    if (!claim.waited) {
      claim.waited = true;
      if (person.id === s.universe.playerId) s.notify({ category: 'benefits', title: 'Your Waiting Week', body: `The first week a claim would pay isn’t paid: ${formatMoney(due, cur)} this week. Benefits start next week.`, importance: 50, route: '/workspace/papers' });
      again();
      return;
    }
    const account = payeeAccount(s, person);
    {
      s.post({
        memo: `Unemployment insurance: the week to ${formatDate(item.at, zone)}`, category: 'benefit',
        postings: [{ accountId: account.id, amount: due }, { accountId: s.nominalAccount('income', 'Unemployment Insurance').id, amount: -due }],
      });
      recordBenefit(person, item.at, zone, due);
      claim.paid += due;
    }
    if (claim.paid >= claim.maxTotal) { close(s, person, `The claim has paid all it can: ${formatMoney(claim.paid, cur)}.`); return; }
    again();
  });
}
