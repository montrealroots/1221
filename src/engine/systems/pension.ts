/**
 * SLATE — the SAG-Producers Pension Plan, and a pension from before.
 *
 * A year of covered earnings under a SAG-AFTRA contract at or above the
 * Plan's minimum is a Pension Credit, and each year's earnings add to the
 * pension payable at the Normal Retirement Age of 65. A participant is vested
 * at ten Pension Credits, or at five without a Permanent Break in Service
 * (the Plan's pages, "How do I know if I am vested?"). The pension is paid
 * monthly from the month after the 65th birthday, into the bank.
 *
 * A production's earnings count to $232,000 (the Plan's per-project
 * ceiling since July 2005), and a television episode's to $25,000 for a half
 * hour and $35,000 for an hour (since July 2024). A participant with ten or
 * more Pension Credits may start it early, from 55, reduced a quarter of a
 * percent for each month under 65 ("When can I start my pension?"). It's
 * taxable income on the year's return, with no payroll tax.
 *
 * From the Summary Plan Description (December 2019, unchanged by the Plan's
 * notices of August 2025 and July 2026): a credit needs $20,000 of covered
 * earnings in a year from 2012, which this said was held at 2012's figure
 * and is in fact still the Plan's; a year from 2010 adds 2% of its earnings
 * to the yearly pension. The Activity Test binds only who had five to nine
 * credits at the end of 1998, so no life SLATE begins meets it. SLATE's
 * estimate: a Permanent Break is taken as five years in a row without a
 * credit once one is earned. Until 2026-09-28 none of the ceilings, the
 * early start and the return were.
 *
 * A pension fund from before (the day job's, until 2026-09-26) sat in a
 * save, counted in its net worth and moved by nothing. It's paid out at 65
 * too, into the bank.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { earningsOf, recordPension } from './earnings';
import { CommandError } from '../core/simulation';
import { payeeAccount } from './cash';
import { careerOf, roleById } from './career';

export const SAG_PENSION = {
  creditEarnings: 20_000_00,
  accrual: 0.02,
  vestAt: 10,
  vestEarlyAt: 5,
  breakYears: 5,
  age: 65,
  /** The per-project ceiling on covered earnings, and an early start: from 55, with ten credits, a quarter of a percent less a month under 65. */
  projectCeiling: 232_000_00,
  /** Television's ceiling an episode, by its length, from 1 July 2024 (the Plan's 2024 Pension Summary FAQ, February 2025). */
  episodeCeiling: { half: 25_000_00, hour: 35_000_00 },
  earliest: 55,
  earlyCredits: 10,
  earlyPerMonth: 0.0025,
  /**
   * The law's most a year from a defined benefit plan, IRC section 415(b):
   * the lesser of $290,000 (2026, IRS Notice 2025-67) and the average of the
   * participant's three highest consecutive years. Until 2026-09-28 a long
   * career's pension had no ceiling. SLATE holds the figure at 2026's and
   * doesn't reduce it for a start before 62, as the law does.
   */
  lawLimit: 290_000_00,
  lawSource: 'https://www.irs.gov/pub/irs-drop/n-25-67.pdf',
  source: 'https://www.sagaftraplans.org/sag-pension/starting-your-pension-benefit/how-do-i-know-if-i-am-vested; the SAG-Producers Pension Plan Summary Plan Description, 2019',
} as const;

export const PENSION_KIND = 'pension.month';

const inSave = (sim: Simulation, usd: Money) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? usd : exchange(usd, 'USD', cur) ?? usd; };

/** Where the pension stands: each finished year's covered earnings and whether it was a credit, the credits, whether vested, and the pension a year at 65 in the save's currency. */
export function pensionOf(sim: Simulation, person: Person): { years: { year: number; earnings: Money; credit: boolean }[]; credits: number; vested: boolean; yearly: Money } {
  const now = zonedParts(sim.now, sim.homeZone).year;
  const floor = inSave(sim, SAG_PENSION.creditEarnings);
  const bookings = careerOf(person).bookings;
  // A production's ceiling: a film's per project, television's per episode by its length.
  const ceilingOf = (project: string): Money => {
    const booking = bookings.find((b) => b.id === project);
    const role = booking ? roleById(booking.roleId) : undefined;
    if (!booking || role?.after?.kind !== 'tv') return inSave(sim, SAG_PENSION.projectCeiling);
    const episodes = role.series ? role.series.episodes : role.arc ? booking.units : 1;
    return inSave(sim, SAG_PENSION.episodeCeiling[role.after.length]) * episodes;
  };
  // A year's covered earnings, each production to its ceiling; a year from before the breakdown was kept counts whole.
  const covered = (e: { sag: Money; sagByProject?: Record<string, Money> }) => (e.sagByProject ? Object.entries(e.sagByProject).reduce((sum, [project, v]) => sum + Math.min(v, ceilingOf(project)), 0) + Math.max(0, e.sag - Object.values(e.sagByProject).reduce((a, b) => a + b, 0)) : e.sag);
  const years = Object.entries(earningsOf(person).years)
    .map(([y, e]) => ({ year: Number(y), earnings: covered(e) }))
    .filter((y) => y.year < now && y.earnings > 0)
    .sort((a, b) => a.year - b.year)
    .map((y) => ({ ...y, credit: y.earnings >= floor }));
  const creditYears = years.filter((y) => y.credit).map((y) => y.year);
  const credits = creditYears.length;
  // A break: five years in a row without a credit, once one is earned.
  let broken = false;
  for (let i = 1; i < creditYears.length; i += 1) if (creditYears[i]! - creditYears[i - 1]! - 1 >= SAG_PENSION.breakYears) broken = true;
  if (credits && now - 1 - creditYears[creditYears.length - 1]! >= SAG_PENSION.breakYears) broken = true;
  const vested = credits >= SAG_PENSION.vestAt || (credits >= SAG_PENSION.vestEarlyAt && !broken);
  // The law's ceiling: the dollar limit, and the best three years in a row (section 415(b)).
  let best3 = 0;
  for (let i = 0; i + 2 < years.length; i += 1) {
    if (years[i + 2]!.year - years[i]!.year !== 2) continue;
    best3 = Math.max(best3, (years[i]!.earnings + years[i + 1]!.earnings + years[i + 2]!.earnings) / 3);
  }
  const accrued = Math.round(years.reduce((sum, y) => sum + y.earnings, 0) * SAG_PENSION.accrual);
  const yearly = Math.min(accrued, inSave(sim, SAG_PENSION.lawLimit), best3 > 0 ? Math.round(best3) : accrued);
  return { years, credits, vested, yearly };
}

/** When they turn 65. */
export function pensionAge(person: Person): Instant {
  return person.birthInstant + Math.round(SAG_PENSION.age * 365.2425 * MS_DAY);
}

/** How old they are, in whole months. */
const monthsOld = (person: Person, at: Instant) => Math.floor((at - person.birthInstant) / (30.436875 * MS_DAY));

/** Why an early start isn't open now, or nothing if it is. */
export function earlyRefusal(sim: Simulation, person: Person): string | undefined {
  if (person.pensionStart) return 'Your pension has begun.';
  const months = monthsOld(person, sim.now);
  if (months < SAG_PENSION.earliest * 12) return `A pension starts at ${SAG_PENSION.earliest} at the earliest.`;
  if (months >= SAG_PENSION.age * 12) return `At ${SAG_PENSION.age} it starts of itself.`;
  if (pensionOf(sim, person).credits < SAG_PENSION.earlyCredits) return `An early pension needs ${SAG_PENSION.earlyCredits} Pension Credits.`;
  return undefined;
}

/** What an early start leaves of the pension: a quarter of a percent less for each month under 65. */
export function earlyFactor(person: Person, at: Instant): number {
  return Math.max(0, 1 - SAG_PENSION.earlyPerMonth * Math.max(0, SAG_PENSION.age * 12 - monthsOld(person, at)));
}

/** The pension's month on the calendar: from 65, or now if that's passed. Once. */
export function armPension(sim: Simulation, person: Person): void {
  if (sim.universe.scheduled.some((i) => i.kind === PENSION_KIND && i.status === 'pending' && i.payload.personId === person.id)) return;
  sim.schedule({ at: Math.max(sim.now + 60_000, pensionAge(person)), kind: PENSION_KIND, label: 'Pension', category: 'system', priority: 20, payload: { personId: person.id } });
}

export function registerPension(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { factor: number }>('pension.start', (_p, { sim: s }) => {
    const person = s.player;
    const no = earlyRefusal(s, person);
    if (no) throw new CommandError(no);
    const factor = earlyFactor(person, s.now);
    person.pensionStart = { at: s.now, factor };
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === PENSION_KIND && one.payload.personId === person.id) s.timeline.cancel(one.id, s.now);
    s.schedule({ at: s.now + 60_000, kind: PENSION_KIND, label: 'Pension', category: 'system', priority: 20, payload: { personId: person.id } });
    return { factor };
  });

  sim.onSchedule(PENSION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    const into = payeeAccount(s, person);
    const cur = saveCurrency(s.universe);
    // A fund from before, paid out at 65.
    for (const fund of Object.values(s.universe.accounts)) {
      if (fund.ownerId !== person.id || fund.category !== 'pension' || fund.closedAt || fund.balance <= 0) continue;
      const held = fund.balance;
      s.post({ memo: `${fund.name}, paid out at ${SAG_PENSION.age}`, category: 'transfer', postings: [{ accountId: fund.id, amount: -held }, { accountId: into.id, amount: held }] });
      fund.closedAt = s.now;
      if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'Your Old Pension Is Paid Out', body: `${formatMoney(held, cur)} from ${fund.name}, now you’re ${SAG_PENSION.age}.`, importance: 60, route: '/workspace/bank' });
    }
    // The Plan's month, vested.
    const p = pensionOf(s, person);
    if (p.vested && p.yearly > 0) {
      // Begun at 65, or early and reduced.
      person.pensionStart ??= { at: s.now, factor: 1 };
      const month = Math.round((p.yearly * person.pensionStart.factor) / 12);
      s.post({ memo: 'SAG-Producers Pension Plan, the month', category: 'salary', postings: [{ accountId: into.id, amount: month }, { accountId: s.nominalAccount('income', 'Pension').id, amount: -month }] });
      recordPension(person, s.now, s.homeZone, month);
      if (person.id === s.universe.playerId && !item.payload.begun) s.notify({ category: 'career', title: 'Your SAG-AFTRA Pension Begins', body: `${formatMoney(month, cur)} a month from the SAG-Producers Pension Plan, on ${p.credits} Pension Credits, from ${formatDate(s.now, s.zone)}.`, importance: 70, route: '/workspace/career' });
    }
    s.schedule({ at: item.at + 30.44 * MS_DAY, kind: PENSION_KIND, label: 'Pension', category: 'system', priority: 20, payload: { personId: person.id, begun: true } });
  });
}
