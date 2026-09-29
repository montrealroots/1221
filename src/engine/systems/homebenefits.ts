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
import { MS_DAY, formatDate, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { payeeAccount } from './cash';
import { isoOfCountry } from './documents';
import { earningsOf, homeOf } from './earnings';
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

export const HAP = {
  limitOwn: 660_00,
  limitShared: 500_00,
  discretion: 0.35,
  share: 0.18,
  disregardWeekly: 55_00,
  minimumWeekly: 35_82,
  incomeLimit: 40_000_00,
  source: 'https://www.dublincity.ie/residential/housing/housing-assistance-payment (Dublin City Council, 2026-09-29)',
} as const;

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

/** A month's differential rent, in euro cents: 18% of net weekly income over €55, at least €35.82 a week. */
export function differentialRent(netWeeklyEur: Money): Money {
  const weekly = Math.max(HAP.minimumWeekly, Math.round((netWeeklyEur - HAP.disregardWeekly) * HAP.share));
  return Math.round((weekly * 52) / 12);
}

export const livesInDublinCity = (person: Person) => homeOf(person) === 'ie-lei-dublin';

export function hapRefusal(sim: Simulation, person: Person): string | undefined {
  if (!livesInDublinCity(person)) return 'SLATE keeps Dublin City Council’s scheme: it’s for someone renting in Dublin.';
  if (!EU.has(isoOfCountry(person.citizenshipId) ?? '')) return 'On a visa, Ireland’s social housing support isn’t yours.';
  if (person.home?.kind !== 'own' && person.home?.kind !== 'shared') return 'It pays a landlord: it’s for someone renting.';
  if (person.hap) return 'You have it.';
  if (netWeeklyEur(sim, person) * 52 > HAP.incomeLimit) return 'Your net income is over the council’s €40,000 a year.';
  return undefined;
}

/**
 * A month's rent with HAP, in euro cents: what the council pays the landlord,
 * and what the tenant pays, the differential rent and anything over the limit.
 */
export function hapSplit(rentEur: Money, own: boolean, netWeekly: Money): { council: Money; tenant: Money } {
  const limit = Math.round((own ? HAP.limitOwn : HAP.limitShared) * (1 + HAP.discretion));
  const covered = Math.min(rentEur, limit);
  const differential = Math.min(covered, differentialRent(netWeekly));
  return { council: covered - differential, tenant: differential + Math.max(0, rentEur - limit) };
}

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
  if (!EU.has(isoOfCountry(person.citizenshipId) ?? '')) return 'On a visa, Ireland’s means-tested payments aren’t yours.';
  const age = (sim.now - person.birthInstant) / YEAR;
  if (age >= IRISH_JA.pensionAge) return 'At 66 it’s the State Pension, not Jobseeker’s Allowance.';
  if (person.jobseekers && person.jobseekers.closedAt === undefined) return 'You have a claim open.';
  return undefined;
}

export function desempleoRefusal(sim: Simulation, person: Person): string | undefined {
  if (!livesInMexicoCity(person)) return 'The Seguro de Desempleo is Mexico City’s, for someone living there.';
  if (isoOfCountry(person.citizenshipId) !== 'MX') return 'Its track for those come home is for Mexican citizens.';
  if (person.desempleo) return 'It’s paid once in a life, and you’ve had it.';
  const age = (sim.now - person.birthInstant) / YEAR;
  if (age < 18 || age > CDMX_DESEMPLEO.oldest) return 'It’s for someone of 18 to 64.';
  const back = person.returnedHomeAt;
  const since = Date.UTC(zonedParts(sim.now, 'America/Mexico_City').year - 1, 0, 1);
  if (back === undefined || back < since) return 'Its track is for someone come home from abroad since the first of January of last year.';
  return undefined;
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
  const no = desempleoRefusal(sim, person);
  if (no) throw new CommandError(no);
  person.desempleo = { filedAt: sim.now, payments: 0 };
  sim.schedule({ at: sim.now + 30 * MS_DAY, kind: DESEMPLEO_KIND, label: 'Seguro De Desempleo', category: 'system', priority: 12, payload: { personId: person.id } });
  return { firstPaymentAt: sim.now + 30 * MS_DAY };
}

function pay(sim: Simulation, person: Person, due: Money, memo: string, line: string): void {
  const account = payeeAccount(sim, person);
  sim.post({ memo, category: 'benefit', postings: [{ accountId: account.id, amount: due }, { accountId: sim.nominalAccount('income', line).id, amount: -due }] });
}

export function registerHomeBenefits(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { council: Money }>('benefits.hap', (_p, { sim: s }) => {
    const person = s.player;
    const no = hapRefusal(s, person);
    if (no) throw new CommandError(no);
    person.hap = { since: s.now };
    return { council: 0 };
  });

  sim.onSchedule(JA_WEEK_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const claim = person?.jobseekers;
    if (!person || !claim || claim.closedAt !== undefined) return;
    if (!livesInIreland(person)) { claim.closedAt = s.now; return; }
    const worked = new Set((person.career?.days ?? []).filter((d) => d.at >= item.at - 7 * MS_DAY && d.at < item.at).map((d) => formatDate(d.at, 'Europe/Dublin'))).size;
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
