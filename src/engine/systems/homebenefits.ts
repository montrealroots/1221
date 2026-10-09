/**
 * SLATE — what a citizen living at home in Ireland or Mexico City can claim
 * out of work (from 2026-09-29), researched from Citizens Information, the
 * Department of Social Protection's guidance and the Mexico City Gazette,
 * and kept in `docs/research/world/research-safetynet-home.json`.
 *
 * **Ireland, Jobseeker's Allowance.** €254 a week for a single person from
 * January 2026, paid weekly for the days out of work, a fifth of it a day
 * worked (SLATE's reading of a payment for days of unemployment), the first
 * three days of a claim unpaid. Means-tested on savings: nothing on the
 * first €20,000, €1 a week for each €1,000 of the next €10,000, €2 of the
 * next €10,000, €4 above €40,000. A returning Irish citizen can be
 * habitually resident at once, resuming their residence; an Irish, British
 * or other EU citizen living there may claim. Earnings beyond the days
 * worked, and a spouse's, aren't assessed.
 *
 * **Mexico City, the Seguro de Desempleo's track for Mexicans come home.**
 * The month's UMA, MXN 3,566.22 in 2026, for up to three months, once in a
 * life, to a Mexican of 18 to 64 living in the city who came back from
 * abroad since the first of January of the year before. The ordinary track
 * asks six months of formal work in the city, which an actor's engagements
 * aren't; SLATE doesn't have it. Mexico has no federal unemployment
 * insurance.
 *
 * **Dublin, the Housing Assistance Payment** (from 2026-09-29, Dublin City
 * Council's pages): the council pays the landlord the rent up to its limit,
 * a single adult's €660 a month for a place of their own and €500 for a room
 * shared, and up to 35% over it at its discretion, which SLATE takes; the
 * tenant pays the council a differential rent, 18% of their net weekly
 * income over €55, never less than €35.82 a week (the scheme from 6 April
 * 2026), and anything the rent is over the limit and the discretion. For
 * someone on the social housing list, with net income to €40,000 a year (the
 * council's table, dated 2023); SLATE takes an application as joining the
 * list, the list's wait not kept. Net income is last year's pay less its
 * tax, and the payments coming in now, pensions and Jobseeker's Allowance.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { payeeAccount } from './cash';
import { earningsOf, homeOf } from './earnings';
import { citizenshipsOf } from './documents';
import { computeAnnualTax } from '../content/tax';

export const IRISH_JA = {
  weekly: 254_00,
  waitingDays: 3,
  capital: [{ over: 20_000_00, upTo: 30_000_00, perThousand: 1_00 }, { over: 30_000_00, upTo: 40_000_00, perThousand: 2_00 }, { over: 40_000_00, upTo: Infinity, perThousand: 4_00 }],
  pensionAge: 66,
  source: 'https://www.citizensinformation.ie/en/social-welfare/unemployed-people/jobseekers-allowance/',
} as const;

export const CDMX_DESEMPLEO = {
  monthly: 3_566_22,
  payments: 3,
  oldest: 64.75,
  source: 'Gaceta Oficial de la Ciudad de México, 8 June 2026: Reglas de Operación, Seguro de Desempleo',
} as const;

// Dublin's Housing Assistance Payment (`HAP`, `hapRefusal`, `hapSplit`, `benefits.hap`) paid part of a renter's rent until
// the home and its rent went in the scope reset of 2026-10-09.

export const JA_WEEK_KIND = 'benefits.ja_week';
export const DESEMPLEO_KIND = 'benefits.desempleo_month';
const EU = new Set(['IE', 'GB', 'DE', 'FR', 'ES', 'LV', 'IT', 'NL', 'BE', 'PT', 'AT', 'SE', 'DK', 'FI', 'PL', 'CZ', 'GR']);
const YEAR = 365.25 * MS_DAY;

export interface JobseekerClaim { filedAt: Instant; waited: number; paid: Money; closedAt?: Instant }
export interface DesempleoClaim { filedAt: Instant; payments: number }

/** Someone's net income a week, in euro cents: last year's pay less its tax, and what comes in now, pensions and benefits. */
export function netWeeklyEur(sim: Simulation, person: Person): Money {
  const cur = saveCurrency(sim.universe);
  const eur = (c: Money) => (cur === 'EUR' ? c : exchange(c, cur, 'EUR') ?? c);
  const y = earningsOf(person).years[new Date(sim.now).getUTCFullYear() - 1];
  const gross = y ? Object.values(y.bySource ?? {}).reduce((a, b) => a + b, 0) || y.acting + y.workStudy : 0;
  const tax = gross > 0 ? computeAnnualTax(gross, homeOf(person), sim.now, { currency: cur }).total : 0;
  const mine = new Set(Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id).map((a) => a.id));
  let coming = 0;
  for (let i = sim.universe.transactions.length - 1; i >= 0; i -= 1) {
    const t = sim.universe.transactions[i]!;
    if (t.at < sim.now - 28 * MS_DAY) break;
    if (t.category !== 'pension' && t.category !== 'benefit') continue;
    for (const p of t.postings) if (mine.has(p.accountId) && p.amount > 0) coming += p.amount;
  }
  return Math.round(eur(gross - tax) / 52) + Math.round(eur(coming) / 4);
}

export const livesInDublinCity = (person: Person) => homeOf(person) === 'ie-lei-dublin';

export const livesInIreland = (person: Person) => CITIES.get(homeOf(person))?.countryId === 'ie';
export const livesInMexicoCity = (person: Person) => { const c = CITIES.get(homeOf(person)); return c?.countryId === 'mx' && (c.parentId === 'mx-09' || c.id.startsWith('mx-cmx')); };

const toMoney = (sim: Simulation, cents: Money, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur) ?? cents; };
const deposits = (sim: Simulation, person: Person) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings')).reduce((x, a) => x + Math.max(0, a.balance), 0);

/** The weekly means savings are assessed at, in euro cents. */
export function capitalMeans(savingsEur: Money): Money {
  let means = 0;
  for (const band of IRISH_JA.capital) {
    const inBand = Math.max(0, Math.min(savingsEur, band.upTo) - band.over);
    means += Math.floor(inBand / 1_000_00) * band.perThousand;
  }
  return means;
}

export function jobseekerRefusal(sim: Simulation, person: Person): string | undefined {
  if (!livesInIreland(person)) return 'Jobseeker’s Allowance is for someone living in Ireland.';
  if (!citizenshipsOf(person).some((c) => EU.has(c))) return 'On a visa, Ireland’s means-tested payments aren’t yours.';
  const age = (sim.now - person.birthInstant) / YEAR;
  if (age >= IRISH_JA.pensionAge) return 'At 66 it’s the State Pension, not Jobseeker’s Allowance.';
  if (person.jobseekers && person.jobseekers.closedAt === undefined) return 'You have a claim open.';
  return undefined;
}

/**
 * Mexico City's Seguro de Desempleo, filed for. Its track for a Mexican come
 * home from abroad read `returnedHomeAt`, which the career's move home wrote;
 * with the career gone in the scope reset, nothing comes home, and from the
 * connected world of 2026-10-09 it isn't filed for. Its other tracks ask a
 * formal job lost in the city, which SLATE has none of. A claim a save already
 * holds is paid out (`DESEMPLEO_KIND`).
 */
export function desempleoRefusal(): string {
  return 'Its tracks are for a job lost in the city or a Mexican come home from abroad, and neither is yours.';
}

/** A week's Jobseeker's Allowance, in euro cents: the days out of work, less the waiting days left, less the savings' means. */
export function jobseekerWeek(daysWorked: number, waitingLeft: number, savingsEur: Money): { due: Money; waited: number } {
  const out = Math.max(0, 5 - daysWorked);
  const waited = Math.min(waitingLeft, out);
  const days = out - waited;
  return { due: Math.max(0, Math.round((IRISH_JA.weekly * days) / 5) - capitalMeans(savingsEur)), waited };
}

export function claimAtHome(sim: Simulation, person: Person): { firstPaymentAt: Instant } {
  if (livesInIreland(person)) {
    const no = jobseekerRefusal(sim, person);
    if (no) throw new CommandError(no);
    person.jobseekers = { filedAt: sim.now, waited: 0, paid: 0 };
    sim.schedule({ at: sim.now + 7 * MS_DAY, kind: JA_WEEK_KIND, label: 'Jobseeker’s Allowance: The Week', category: 'system', priority: 12, payload: { personId: person.id } });
    return { firstPaymentAt: sim.now + 7 * MS_DAY };
  }
  throw new CommandError(desempleoRefusal());
}

function pay(sim: Simulation, person: Person, due: Money, memo: string, line: string): void {
  const account = payeeAccount(sim, person);
  sim.post({ memo, category: 'benefit', postings: [{ accountId: account.id, amount: due }, { accountId: sim.nominalAccount('income', line).id, amount: -due }] });
}

export function registerHomeBenefits(sim: Simulation): void {
  sim.onSchedule(JA_WEEK_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const claim = person?.jobseekers;
    if (!person || !claim || claim.closedAt !== undefined) return;
    if (!livesInIreland(person)) { claim.closedAt = s.now; return; }
    // The days worked in the week were the career's until it went on 2026-10-09: none now.
    const worked = 0;
    const cur = saveCurrency(s.universe);
    const savingsEur = cur === 'EUR' ? deposits(s, person) : exchange(deposits(s, person), cur, 'EUR') ?? deposits(s, person);
    const week = jobseekerWeek(worked, IRISH_JA.waitingDays - claim.waited, savingsEur);
    claim.waited += week.waited;
    if (week.due > 0) {
      const due = toMoney(s, week.due, 'EUR');
      pay(s, person, due, 'Jobseeker’s Allowance, the week', 'Jobseeker’s Allowance');
      claim.paid += due;
      if (person.id === s.universe.playerId) s.notify({ category: 'benefits', title: 'Jobseeker’s Allowance Paid', body: `${formatMoney(due, cur)} for the week.`, importance: 30, route: '/workspace/papers' });
    }
    s.schedule({ at: item.at + 7 * MS_DAY, kind: JA_WEEK_KIND, label: 'Jobseeker’s Allowance: The Week', category: 'system', priority: 12, payload: { personId: person.id } });
  });

  sim.onSchedule(DESEMPLEO_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const claim = person?.desempleo;
    if (!person || !claim || claim.payments >= CDMX_DESEMPLEO.payments || !livesInMexicoCity(person)) return;
    const due = toMoney(s, CDMX_DESEMPLEO.monthly, 'MXN');
    pay(s, person, due, 'Seguro de Desempleo, the month', 'Seguro De Desempleo');
    claim.payments += 1;
    if (person.id === s.universe.playerId) s.notify({ category: 'benefits', title: 'Seguro De Desempleo Paid', body: `${formatMoney(due, saveCurrency(s.universe))}, ${claim.payments} of ${CDMX_DESEMPLEO.payments}.`, importance: 30, route: '/workspace/papers' });
    if (claim.payments < CDMX_DESEMPLEO.payments) s.schedule({ at: item.at + 30 * MS_DAY, kind: DESEMPLEO_KIND, label: 'Seguro De Desempleo', category: 'system', priority: 12, payload: { personId: person.id } });
  });
}
