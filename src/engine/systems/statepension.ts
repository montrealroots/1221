/**
 * SLATE — the UK's new State Pension (from 2026-09-29), researched from
 * gov.uk and the DWP and kept in
 * `docs/research/world/research-statepension.json`.
 *
 * A tax year (6 April to 5 April) qualifies with UK earnings at or over the
 * Lower Earnings Limit, £6,708 in 2026/27, or with National Insurance
 * credits, as a Universal Credit claim gives. Ten qualifying years give a
 * pension, thirty-five the full rate, and each is a thirty-fifth of it:
 * £241.30 a week from 6 April 2026 (£230.25 in 2025/26). It's claimed, not
 * given, from State Pension age, and paid every four weeks in arrears,
 * anywhere; the US is among the countries its yearly increase reaches.
 *
 * State Pension age is 67 for anyone born from 6 March 1961 to 5 April 1977,
 * and the Pensions Act 2007 raises it to 68 in 2044 to 2046: SLATE reads 68
 * for a life born after 5 April 1978, as every life it begins is. SLATE's
 * estimates: the Lower Earnings Limit held at 2026/27's for every year; the
 * rate held at 2026/27's, the triple lock's later increases not being known;
 * the "starting amount" for years before April 2016, which no life SLATE
 * begins has, left out. It's taxable income in the UK, and SLATE doesn't yet
 * tax it.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { rateOn, type RateSteps } from '../content/rates';
import { earningsOf, recordPension } from './earnings';
import { payeeAccount } from './cash';

export const STATE_PENSION = {
  weekly: [['2025-04-07', 230_25], ['2026-04-06', 241_30]] as RateSteps,
  lowerEarningsLimit: 6_708_00,
  yearsForAny: 10,
  yearsForFull: 35,
  source: 'https://www.gov.uk/new-state-pension; https://www.gov.uk/state-pension-age',
} as const;

export const STATE_PENSION_KIND = 'pension.state_payment';

/** The years of their National Insurance record that qualify, by the tax year's first calendar year; earnings kept in the save's money. */
export function qualifyingYears(person: Person, currency = 'GBP'): string[] {
  const r = earningsOf(person);
  const years = new Set<string>();
  const limit = currency === 'GBP' ? STATE_PENSION.lowerEarningsLimit : exchange(STATE_PENSION.lowerEarningsLimit, 'GBP', currency) ?? STATE_PENSION.lowerEarningsLimit;
  for (const [key, earned] of Object.entries(r.ukEarned ?? {})) if (earned >= limit) years.add(key);
  for (const key of r.ukCredited ?? []) years.add(key);
  return [...years].sort();
}

/** State Pension age: 68 for anyone born after 5 April 1978, 67 before it back to 6 March 1961, and 66 before that. */
export function statePensionAge(person: Person): Instant {
  const born = new Date(person.birthInstant);
  const years = person.birthInstant >= Date.UTC(1978, 3, 6) ? 68 : person.birthInstant >= Date.UTC(1961, 2, 6) ? 67 : 66;
  return Date.UTC(born.getUTCFullYear() + years, born.getUTCMonth(), born.getUTCDate(), 12);
}

/** A week's pension in pounds, on a day: a thirty-fifth of the full rate for each qualifying year, from ten. */
export function weeklyPension(person: Person, at: Instant, currency = 'GBP'): Money {
  const n = qualifyingYears(person, currency).length;
  if (n < STATE_PENSION.yearsForAny) return 0;
  return Math.round((rateOn(STATE_PENSION.weekly, new Date(at).toISOString().slice(0, 10)) * Math.min(n, STATE_PENSION.yearsForFull)) / STATE_PENSION.yearsForFull);
}

export function statePensionRefusal(sim: Simulation, person: Person): string | undefined {
  if (person.statePensionFrom !== undefined) return 'You’ve already claimed it.';
  if (sim.now < statePensionAge(person)) return `You can claim it from ${formatDate(statePensionAge(person), sim.zone)}, your State Pension age.`;
  const n = qualifyingYears(person, saveCurrency(sim.universe)).length;
  if (n < STATE_PENSION.yearsForAny) return `It takes ten qualifying years, and your National Insurance record has ${n}.`;
  return undefined;
}

export function registerStatePension(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { weekly: Money }>('pension.state', (_p, { sim: s }) => {
    const person = s.player;
    const no = statePensionRefusal(s, person);
    if (no) throw new CommandError(no);
    person.statePensionFrom = s.now;
    s.schedule({ at: s.now + 28 * MS_DAY, kind: STATE_PENSION_KIND, label: 'State Pension', category: 'system', priority: 20, payload: { personId: person.id } });
    return { weekly: weeklyPension(person, s.now, saveCurrency(s.universe)) };
  });

  sim.onSchedule(STATE_PENSION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person || person.statePensionFrom === undefined) return;
    const cur = saveCurrency(s.universe);
    const pounds = weeklyPension(person, item.at, cur) * 4;
    const due = cur === 'GBP' ? pounds : exchange(pounds, 'GBP', cur) ?? pounds;
    if (due > 0) {
      const account = payeeAccount(s, person);
      s.post({ memo: 'The State Pension, four weeks', category: 'pension', postings: [{ accountId: account.id, amount: due }, { accountId: s.nominalAccount('income', 'State Pension').id, amount: -due }] });
      // Income for the return and the month (`recordPension`, from 2026-10-10: until then a pension paid reached neither).
      recordPension(person, item.at, s.homeZone, due);
      if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'State Pension Paid', body: `${formatMoney(due, cur)} for four weeks.`, importance: 25, route: '/workspace/bank' });
    }
    s.schedule({ at: item.at + 28 * MS_DAY, kind: STATE_PENSION_KIND, label: 'State Pension', category: 'system', priority: 20, payload: { personId: person.id } });
  });
}

