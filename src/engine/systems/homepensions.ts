/**
 * SLATE — Ireland's State Pension (Contributory) and Mexico's Pensión para
 * el Bienestar (from 2026-09-29), researched from Citizens Information and
 * the Diario Oficial and kept in `docs/research/world/research-ireland.json`
 * and `research-mexico.json`.
 *
 * **Ireland.** Anyone born from 1959 is paid on the Total Contributions
 * Approach: the full rate, €299.30 a week at 66 in 2026, times their
 * contributions over 2,080, never more than all of it, with 520 paid
 * contributions to qualify at all. Deferred it's more: €313.40 claimed at
 * 67, €328.90 at 68 or later. It's claimed, not given, and paid weekly,
 * abroad too. Class A and Class S both count, one contribution a week, and
 * a self-employed year is paid on an income of €5,000 or more; SLATE counts
 * a calendar year of Irish earnings at that as 52 contributions, the usual
 * reading, which Citizens Information doesn't state. Not kept: credited
 * contributions (Jobseeker's Allowance gives none; Jobseeker's Benefit,
 * which SLATE doesn't pay, would), the Yearly Average blend that runs out
 * in 2034 before any life SLATE begins claims, the €10 more at 80,
 * and contributions combined with another EU country's or Britain's. It's
 * taxable in Ireland, and SLATE doesn't yet tax it.
 *
 * **Ireland, the State Pension (Non-Contributory)**, from 2026-09-29, for a
 * record too short or none: €288 a week from 66, €298 from 80, to someone
 * living in Ireland, less every euro of weekly means over the first €30 (in
 * steps of €2.50). Means are other pensions, earnings over €200 a week, and
 * savings, assessed as Jobseeker's Allowance's are; the home lived in isn't
 * counted. Ireland pays the higher of the two pensions, not both (read
 * secondhand). Until then a short Irish record gave a small pension and
 * nothing beside it, and a played life ended its days broke in Dublin. SLATE
 * reads other pensions from the last four weeks' and earnings from last
 * year's, a week's worth of each.
 *
 * **The Living Alone Increase**, €22 a week, to someone on either who lives
 * alone: SLATE has no partners, so a place of one's own or a home owned.
 * **The Fuel Allowance**, €38 a week for the 28 weeks from late September,
 * to someone on the means-tested pension; its own income limit, which the
 * sources disagree on, SLATE takes as met by the pension's means test.
 *
 * **Mexico.** The Pensión para el Bienestar de las Personas Adultas Mayores
 * is universal and not contributory: MXN 6,400 every two months to a
 * Mexican of 65 or over living in Mexico, from the 2026 rules (DOF 12
 * February 2026). Paid only while they live there. IMSS's own pension under
 * the 1997 law, on weeks of Mexican work, is `systems/imss.ts`; until
 * 2026-09-29 SLATE had no Mexican work to earn them in.
 *
 * Both held at 2026's figures, later increases not being known.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { earningsOf, homeOf } from './earnings';
import { payeeAccount } from './cash';
import { isoOfCountry } from './documents';
import { capitalMeans, livesInIreland } from './homebenefits';

export const IRISH_PENSION = {
  /** The weekly full rate by the age it's first claimed at, euro cents. */
  weeklyAt: [[66, 299_30], [67, 313_40], [68, 328_90]] as const,
  paidNeeded: 520,
  forFull: 2_080,
  perYear: 52,
  /** The income a self-employed year pays PRSI on. */
  yearFloor: 5_000_00,
  age: 66,
  source: 'https://www.citizensinformation.ie/en/social-welfare/older-and-retired-people/state-pension-contributory/',
} as const;

export const IRISH_NCP = {
  weekly: 288_00,
  weekly80: 298_00,
  disregard: 30_00,
  step: 2_50,
  earningsDisregard: 200_00,
  livingAlone: 22_00,
  fuelWeekly: 38_00,
  fuelWeeks: 28,
  source: 'https://www.gov.ie/en/publication/state-pension-non-contributory/ (read through Citizens Information and search excerpts, 2026-09-29)',
} as const;

export const BIENESTAR = {
  bimonthly: 6_400_00,
  age: 65,
  source: 'https://dof.gob.mx/nota_detalle.php?codigo=5779939&fecha=12%2F02%2F2026',
} as const;

export const IRISH_PENSION_KIND = 'pension.ie_week';
export const BIENESTAR_KIND = 'pension.bienestar_payment';
const YEAR_MS = 365.2425 * MS_DAY;
const ageAt = (person: Person, at: Instant) => (at - person.birthInstant) / YEAR_MS;
const twoMonthsOn = (at: Instant) => { const d = new Date(at); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 2, d.getUTCDate(), d.getUTCHours()); };
const inSave = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };

/** Their Irish contributions: 52 for each calendar year of Irish earnings at €5,000 or more, to the year they turn 66. */
export function irishContributions(person: Person, currency: string): number {
  const floor = currency === 'EUR' ? IRISH_PENSION.yearFloor : exchange(IRISH_PENSION.yearFloor, 'EUR', currency) ?? IRISH_PENSION.yearFloor;
  const last = new Date(person.birthInstant).getUTCFullYear() + IRISH_PENSION.age;
  let n = 0;
  for (const [year, y] of Object.entries(earningsOf(person).years)) if (Number(year) <= last && (y.bySource?.ie ?? 0) >= floor) n += IRISH_PENSION.perYear;
  return n;
}

/** A week's Irish pension in euro cents, claimed at an age: the rate for that age, times the contributions over 2,080. */
export function irishWeekly(contributions: number, claimAge: number): Money {
  if (contributions < IRISH_PENSION.paidNeeded) return 0;
  const rate = [...IRISH_PENSION.weeklyAt].reverse().find(([age]) => claimAge >= age)?.[1] ?? 0;
  return Math.round((rate * Math.min(contributions, IRISH_PENSION.forFull)) / IRISH_PENSION.forFull);
}

const IRISH_RESIDENTS = new Set(['IE', 'GB', 'DE', 'FR', 'ES', 'LV', 'IT', 'NL', 'BE', 'PT', 'AT', 'SE', 'DK', 'FI', 'PL', 'CZ', 'GR']);
const inEur = (sim: Simulation, cents: Money) => { const cur = saveCurrency(sim.universe); return cur === 'EUR' ? cents : exchange(cents, cur, 'EUR') ?? cents; };

/** A week's means for the non-contributory pension, in euro cents: other pensions, earnings over €200, and savings. */
export function irishMeans(sim: Simulation, person: Person): Money {
  const mine = new Set(Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id).map((a) => a.id));
  const since = sim.now - 28 * MS_DAY;
  let pensions = 0;
  for (let i = sim.universe.transactions.length - 1; i >= 0; i -= 1) {
    const t = sim.universe.transactions[i]!;
    if (t.at < since) break;
    if (t.category !== 'pension' || t.memo.startsWith('The State Pension (Non-Contributory)') || t.memo.startsWith('The State Pension (Contributory)')) continue;
    for (const p of t.postings) if (mine.has(p.accountId) && p.amount > 0) pensions += p.amount;
  }
  const year = new Date(sim.now).getUTCFullYear() - 1;
  const y = earningsOf(person).years[year];
  const earned = y ? Object.values(y.bySource ?? {}).reduce((a, b) => a + b, 0) || y.acting + y.workStudy : 0;
  const deposits = Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((x, a) => x + Math.max(0, a.balance), 0);
  return Math.round(inEur(sim, pensions) / 4) + Math.max(0, Math.round(inEur(sim, earned) / 52) - IRISH_NCP.earningsDisregard) + capitalMeans(inEur(sim, deposits));
}

/** The non-contributory pension's week, in euro cents: the rate for the age less the means over €30, by €2.50. */
export function nonContributoryWeekly(age: number, meansEur: Money): Money {
  const rate = age >= 80 ? IRISH_NCP.weekly80 : IRISH_NCP.weekly;
  const over = Math.max(0, meansEur - IRISH_NCP.disregard);
  return Math.max(0, rate - Math.ceil(over / IRISH_NCP.step) * IRISH_NCP.step);
}

const meansTested = (person: Person) => livesInIreland(person) && IRISH_RESIDENTS.has(isoOfCountry(person.citizenshipId) ?? '');

/** The Irish pension's week as it's paid, in euro cents: the higher of the two, the Living Alone Increase, and the Fuel Allowance in its season. */
export function irishWeekPaid(sim: Simulation, person: Person, contributoryEur: Money, at: Instant): { total: Money; means: boolean; fuel: Money; alone: Money } {
  const ncp = meansTested(person) ? nonContributoryWeekly(ageAt(person, at), irishMeans(sim, person)) : 0;
  const means = ncp > contributoryEur;
  const base = Math.max(ncp, contributoryEur);
  // The Living Alone Increase was paid on a home of their own until the home went in the scope reset of 2026-10-09,
  // and with it what says who they live with.
  const alone = 0;
  const fuel = means && inFuelSeason(at) ? IRISH_NCP.fuelWeekly : 0;
  return { total: base + alone + fuel, means, fuel, alone };
}

/** The 28 weeks from the fourth Monday of September, SLATE's reading of "late September". */
export function inFuelSeason(at: Instant): boolean {
  const d = new Date(at);
  const y = d.getUTCMonth() >= 8 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  const first = new Date(Date.UTC(y, 8, 1)).getUTCDay();
  const start = Date.UTC(y, 8, 1 + ((8 - first) % 7) + 21);
  return at >= start && at < start + IRISH_NCP.fuelWeeks * 7 * MS_DAY;
}

export function irishPensionRefusal(sim: Simulation, person: Person): string | undefined {
  if (person.irishPension) return 'You’re drawing it.';
  if (ageAt(person, sim.now) < IRISH_PENSION.age) return 'From 66; more if you wait to 67, and more again to 68.';
  const n = irishContributions(person, saveCurrency(sim.universe));
  if (n >= IRISH_PENSION.paidNeeded) return undefined;
  if (!meansTested(person)) return `It takes 520 paid contributions; your Irish record has ${n}. The means-tested pension is for someone living in Ireland.`;
  if (nonContributoryWeekly(ageAt(person, sim.now), irishMeans(sim, person)) === 0) return `Your Irish record has ${n} contributions, and your means are over the non-contributory pension’s.`;
  return undefined;
}

export const livesInMexico = (person: Person) => CITIES.get(homeOf(person))?.countryId === 'mx';

export function bienestarRefusal(sim: Simulation, person: Person): string | undefined {
  if (person.bienestarFrom !== undefined) return 'You’re drawing it.';
  if (isoOfCountry(person.citizenshipId) !== 'MX') return 'It’s for Mexicans.';
  if (!livesInMexico(person)) return 'It’s for Mexicans living in Mexico.';
  if (ageAt(person, sim.now) < BIENESTAR.age) return 'From 65.';
  return undefined;
}

export function registerHomePensions(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { weekly: Money }>('pension.ie_state', (_p, { sim: s }) => {
    const person = s.player;
    const no = irishPensionRefusal(s, person);
    if (no) throw new CommandError(no);
    const weeklyEur = irishWeekly(irishContributions(person, saveCurrency(s.universe)), Math.floor(ageAt(person, s.now)));
    person.irishPension = { from: s.now, weeklyEur };
    s.schedule({ at: s.now + 7 * MS_DAY, kind: IRISH_PENSION_KIND, label: 'State Pension (Ireland)', category: 'system', priority: 20, payload: { personId: person.id } });
    return { weekly: inSave(s, irishWeekPaid(s, person, weeklyEur, s.now).total, 'EUR') };
  });

  sim.onSchedule(IRISH_PENSION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const claim = person?.irishPension;
    if (!person || !claim) return;
    const week = irishWeekPaid(s, person, claim.weeklyEur, item.at);
    const due = inSave(s, week.total, 'EUR');
    if (due > 0) {
      const account = payeeAccount(s, person);
      s.post({ memo: `The State Pension (${week.means ? 'Non-Contributory' : 'Contributory'}), the week${week.alone ? ', living alone' : ''}${week.fuel ? ', and the Fuel Allowance' : ''}`, category: 'pension', postings: [{ accountId: account.id, amount: due }, { accountId: s.nominalAccount('income', 'State Pension (Ireland)').id, amount: -due }] });
    }
    s.schedule({ at: item.at + 7 * MS_DAY, kind: IRISH_PENSION_KIND, label: 'State Pension (Ireland)', category: 'system', priority: 20, payload: { personId: person.id } });
  });

  sim.onCommand<Record<string, never>, { bimonthly: Money }>('pension.bienestar', (_p, { sim: s }) => {
    const person = s.player;
    const no = bienestarRefusal(s, person);
    if (no) throw new CommandError(no);
    person.bienestarFrom = s.now;
    s.schedule({ at: twoMonthsOn(s.now), kind: BIENESTAR_KIND, label: 'Pensión Para El Bienestar', category: 'system', priority: 20, payload: { personId: person.id } });
    return { bimonthly: inSave(s, BIENESTAR.bimonthly, 'MXN') };
  });

  sim.onSchedule(BIENESTAR_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person || person.bienestarFrom === undefined) return;
    // Paid while they live in Mexico, and held while they don't.
    if (livesInMexico(person)) {
      const due = inSave(s, BIENESTAR.bimonthly, 'MXN');
      const account = payeeAccount(s, person);
      s.post({ memo: 'Pensión para el Bienestar, two months', category: 'pension', postings: [{ accountId: account.id, amount: due }, { accountId: s.nominalAccount('income', 'Pensión para el Bienestar').id, amount: -due }] });
      if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'Pensión Para El Bienestar Paid', body: `${formatMoney(due, saveCurrency(s.universe))} for two months, since ${formatDate(person.bienestarFrom, s.zone)}.`, importance: 25, route: '/workspace/bank' });
    }
    s.schedule({ at: twoMonthsOn(item.at), kind: BIENESTAR_KIND, label: 'Pensión Para El Bienestar', category: 'system', priority: 20, payload: { personId: person.id } });
  });
}
