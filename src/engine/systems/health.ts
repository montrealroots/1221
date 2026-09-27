/**
 * SLATE — health cover after school (`content/career.ts` `UNION_HEALTH`,
 * `content/safetynet.ts`).
 *
 * The Yale Health plan a student pays for covers the academic year, to the
 * end of July; after it an actor is covered by what they earn or what they
 * buy. SAG-AFTRA's plan looks at each twelve-month base period ending a
 * quarter: earnings under it at the year's threshold give twelve months'
 * cover from three months after, for a quarterly premium. Equity-League's
 * gives six months from two months after ten weeks of Equity work in twelve.
 * Neither, and they may buy the marketplace's benchmark plan in New York or
 * California, in open enrollment or within 60 days of losing cover, paying
 * the whole premium each month and taking the credit on the return. A month
 * without cover in California is a month of its penalty on the return.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { saveCurrency, type Money } from '../core/money';
import { MS_DAY, formatDate, instantFromZoned, normalDate, zonedParts, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { UNION_HEALTH, rateOn } from '../content/career';
import { BENCHMARK, BENEFIT_STATE, ENROLLMENT, byYear, type BenefitState } from '../content/safetynet';
import { earningsOf, quartersBefore } from './earnings';
import { payFromCurrent } from './household';

export const HEALTH_MONTH_KIND = 'health.month';

export interface HealthRecord {
  marketplace?: { from: Instant; until?: Instant; state: BenefitState };
  sag?: { from: Instant; until: Instant };
  equity?: { from: Instant; until: Instant };
  /** The marketplace premiums paid each month, by year, for the premium tax credit. */
  premiums: Record<string, Money[]>;
  /** Months without cover while living in California, by year, for its penalty. */
  uncoveredInCalifornia: Record<string, number>;
  /** When cover last ended, which opens 60 days to enroll. */
  lostAt?: Instant;
  /** Whether they were covered at the last month's start. */
  covered: boolean;
}

export function healthOf(person: Person): HealthRecord {
  person.health ??= { premiums: {}, uncoveredInCalifornia: {}, covered: true };
  return person.health;
}

const usd = (cents: Money, into: string) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);
const HOME = 'America/New_York';
const firstOf = (year: number, month: number, zone = HOME) => instantFromZoned({ ...normalDate(year, month, 1), hour: 0 }, zone);

/** Until when the Yale Health plan covers them: while at school, and to 31 July of the year school ended. */
export function yaleUntil(person: Person): Instant | undefined {
  const school = person.school;
  if (!school) return undefined;
  if (school.standing !== 'graduated' && school.standing !== 'dismissed') return Number.POSITIVE_INFINITY;
  const since = person.career?.since;
  if (since === undefined) return Number.POSITIVE_INFINITY;
  const p = zonedParts(since, HOME);
  return firstOf(p.month >= 8 ? p.year + 1 : p.year, 8);
}

/** What covers them at a moment, first match: Yale, SAG-AFTRA, Equity-League, the marketplace. */
export function coverOn(person: Person, at: Instant): 'yale' | 'sag' | 'equity' | 'marketplace' | undefined {
  const h = person.health;
  if (at < (yaleUntil(person) ?? 0)) return 'yale';
  if (h?.sag && at >= h.sag.from && at < h.sag.until) return 'sag';
  if (h?.equity && at >= h.equity.from && at < h.equity.until) return 'equity';
  if (h?.marketplace && at >= h.marketplace.from && (h.marketplace.until === undefined || at < h.marketplace.until)) return 'marketplace';
  return undefined;
}

/** Whether they may enroll in the marketplace now: open enrollment, or 60 days from losing cover. */
export function mayEnroll(person: Person, at: Instant): { ok: boolean; why: string } {
  const state = BENEFIT_STATE[person.currentLocationId];
  if (!state) return { ok: false, why: 'SLATE has the marketplace in New York and Los Angeles.' };
  const h = healthOf(person);
  if (h.marketplace && (h.marketplace.until === undefined || h.marketplace.until > at)) return { ok: false, why: 'You’re enrolled.' };
  const p = zonedParts(at, HOME);
  const open = (p.month > ENROLLMENT.openFrom[0] || (p.month === ENROLLMENT.openFrom[0] && p.day >= ENROLLMENT.openFrom[1]))
    || (p.month < ENROLLMENT.openUntil[0] || (p.month === ENROLLMENT.openUntil[0] && p.day <= ENROLLMENT.openUntil[1]));
  if (open) return { ok: true, why: 'Open enrollment.' };
  if (h.lostAt !== undefined && at - h.lostAt <= ENROLLMENT.specialDays * MS_DAY) return { ok: true, why: `Within ${ENROLLMENT.specialDays} days of losing cover.` };
  return { ok: false, why: `Outside open enrollment, 1 November to 15 January, and not within ${ENROLLMENT.specialDays} days of losing cover.` };
}

/** The benchmark plan's premium a month, where they live, in a year. */
export const benchmarkFor = (state: BenefitState, year: number, into: string): Money => usd(byYear(BENCHMARK[state], year), into);

/** The health plans' month for them, from the first of the next month. */
export function armHealth(sim: Simulation, person: Person): void {
  if (sim.universe.scheduled.some((i) => i.kind === HEALTH_MONTH_KIND && i.status === 'pending' && i.payload.personId === person.id)) return;
  healthOf(person);
  const p = zonedParts(sim.now, HOME);
  sim.schedule({ at: firstOf(p.year, p.month + 1) + 30 * 60_000, kind: HEALTH_MONTH_KIND, label: 'Health Cover', category: 'system', priority: 6, payload: { personId: person.id } });
}

/**
 * A month's start. At a quarter's, SAG-AFTRA's plan reads the base period
 * that ended three months before. Each month, Equity-League's reads the last
 * twelve months' weeks; the premiums fall due; and what covers them is
 * settled, with a month uncovered in California counted.
 */
export function healthMonth(sim: Simulation, person: Person, at: Instant): void {
  const h = healthOf(person);
  const cur = saveCurrency(sim.universe);
  const p = zonedParts(at, HOME);
  const record = earningsOf(person);
  if (p.month % 3 === 1) {
    const q = (p.month + 2) / 3;
    const prev = q === 1 ? { y: p.year - 1, q: 4 } : { y: p.year, q: q - 1 };
    const base = quartersBefore(prev.y, prev.q, 4);
    const earned = base.reduce((sum, key) => sum + (record.quarters[key]?.sag ?? 0), 0);
    const baseEnds = Number(base[3]!.slice(0, 4));
    if (earned >= usd(rateOn(UNION_HEALTH.sagThreshold, `${baseEnds}-12-31`), cur)) {
      const until = firstOf(p.year + 1, p.month);
      h.sag = h.sag && h.sag.until >= at ? { from: h.sag.from, until } : { from: at, until };
    }
    if (h.sag && at >= h.sag.from && at < h.sag.until) payFromCurrent(sim, person, usd(rateOn(UNION_HEALTH.sagPremium, `${p.year}-${String(p.month).padStart(2, '0')}-01`), cur), 'SAG-AFTRA Health Plan premium', 'health');
  }
  const yearAgo = at - 365 * MS_DAY;
  const weeks = record.equityWeeks.filter((key) => instantFromZoned({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)), day: Number(key.slice(8, 10)), hour: 12 }, HOME) >= yearAgo).length;
  if (weeks >= UNION_HEALTH.equityWeeks && !(h.equity && h.equity.until > firstOf(p.year, p.month + 2))) {
    const from = firstOf(p.year, p.month + 2);
    h.equity = { from: h.equity && h.equity.until >= from ? h.equity.from : from, until: firstOf(p.year, p.month + 2 + UNION_HEALTH.equityMonths) };
  }
  // Equity-League's $300 a quarter, a third of it each month covered.
  if (h.equity && at >= h.equity.from && at < h.equity.until) payFromCurrent(sim, person, usd(Math.round(UNION_HEALTH.equityPremium / 3), cur), 'Equity-League Health premium', 'health');
  // The marketplace: a plan is the state's, and ends on leaving it.
  const m = h.marketplace;
  if (m && (m.until === undefined || at < m.until)) {
    if (BENEFIT_STATE[person.currentLocationId] !== m.state) m.until = at;
    else if (at >= m.from) {
      const premium = benchmarkFor(m.state, p.year, cur);
      if (payFromCurrent(sim, person, premium, 'Marketplace health plan premium', 'health')) (h.premiums[p.year] ??= []).push(premium);
      else m.until = at;
    }
  }
  const cover = coverOn(person, at);
  if (!cover && CITIES.get(person.currentLocationId)?.parentId === 'us-ca') h.uncoveredInCalifornia[p.year] = (h.uncoveredInCalifornia[p.year] ?? 0) + 1;
  if (h.covered && !cover) {
    h.lostAt = at;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'money', title: 'Your Health Cover Ended', body: `Nothing covers you from ${formatDate(at, HOME)}. You have ${ENROLLMENT.specialDays} days to enroll in the marketplace${CITIES.get(person.currentLocationId)?.parentId === 'us-ca' ? ', and every month uncovered in California costs its penalty on your return' : ''}.`, importance: 80, route: '/workspace/papers' });
  }
  h.covered = cover !== undefined;
}

export function registerHealth(sim: Simulation): void {
  sim.onSchedule(HEALTH_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    healthMonth(s, person, item.at);
    const p = zonedParts(item.at, HOME);
    s.schedule({ at: firstOf(p.year, p.month + 1) + 30 * 60_000, kind: HEALTH_MONTH_KIND, label: 'Health Cover', category: 'system', priority: 6, payload: { personId: person.id } });
  });

  sim.onCommand<Record<string, never>, { from: Instant; premium: Money }>('health.enroll', (_p, { sim: s }) => {
    const person = s.player;
    const may = mayEnroll(person, s.now);
    if (!may.ok) throw new CommandError(may.why);
    const state = BENEFIT_STATE[person.currentLocationId]!;
    const p = zonedParts(s.now, HOME);
    const from = firstOf(p.year, p.month + 1);
    healthOf(person).marketplace = { from, state };
    armHealth(s, person);
    const cur = saveCurrency(s.universe);
    return { from, premium: benchmarkFor(state, zonedParts(from, HOME).year, cur) };
  });

  sim.onCommand<Record<string, never>, { until: Instant }>('health.drop', (_p, { sim: s }) => {
    const m = healthOf(s.player).marketplace;
    if (!m || (m.until !== undefined && m.until <= s.now)) throw new CommandError('You aren’t enrolled.');
    const p = zonedParts(s.now, HOME);
    m.until = firstOf(p.year, p.month + 1);
    return { until: m.until };
  });
}

/** A plan's name, for the screens. */
export const COVER_LABEL = { yale: 'Yale Health', sag: 'SAG-AFTRA Health Plan', equity: 'Equity-League Health', marketplace: 'Marketplace Plan' } as const;
