/**
 * SLATE — the right to live in another country (docs/WORLD.md, stage 1d),
 * from 2026-09-30, researched in `docs/research/world/research-residence.json`
 * from the governments' own pages.
 *
 * Until then `residenceRefusal` ended "SLATE doesn't grant it yet": a
 * citizen, free movement or a job's permit were the only ways to live abroad.
 * Now, for an actor:
 * - **Britain, the Global Talent visa** for arts and culture: £561 for Arts
 *   Council England's endorsement and £205 for the visa, and the Immigration
 *   Health Surcharge, £1,035 a year, paid for the five years it's granted
 *   for. It lets its holder live and work there, and the surcharge makes the
 *   NHS theirs (`publicCareShareOf`). Arts Council England's criteria weren't
 *   read; SLATE endorses on the same record the O-1 is approved on, three of
 *   its kinds of evidence (`o1Evidence`), its reading. Settlement,
 *   indefinite leave to remain, £3,226, after five years ("exceptional
 *   promise"; "exceptional talent" is three, which SLATE doesn't tell apart)
 *   and with pay earned in Britain in the field.
 * - **Mexico, temporary residence** by economic solvency: savings of 11,460
 *   UMA over the last twelve months or an income of 680 UMA a month over
 *   six (the guidelines of 25 July 2025), MXN 1,344,373 or MXN 79,771 at
 *   2026's UMA of MXN 117.31; SLATE reads the savings as held now. The card,
 *   MXN 11,140.74 a year (Ley Federal de Derechos, 2026), and the consulate's
 *   visa, US$56. It lets its holder live there, not work. Permanent residence,
 *   MXN 13,578.96, after four years' temporary.
 * - **Canada** has none for a freelance actor: the Self-Employed Persons
 *   Program has been paused since 2024, "until further notice" from 19
 *   December 2025, and Express Entry has no category for the arts.
 * - **Ireland** has none either: an employment permit needs an employer's
 *   offer, and there's no artist's route.
 * - **The United States, a green card** by extraordinary ability, EB-1A,
 *   from later on 2026-09-30: the I-140 petition ($715), its Asylum Program
 *   Fee for a self-petitioner ($300) and the I-485 ($1,440), filed together
 *   while the category is current, from the US in status. Its extraordinary
 *   ability is read on the O-1's record, three of its kinds of evidence,
 *   SLATE's reading of the ten criteria's three. The I-140 takes 31 months,
 *   or 15 business days with premium processing ($2,965) (USCIS figures,
 *   reported); the I-485, FY2023's median, 8.6 months (USCIS's fact sheet).
 *   EB-1 is current for all but China (2023-07-01) and India (2023-02-01),
 *   October 2026's Visa Bulletin, by country of birth; one born there waits
 *   the years their line is behind, SLATE taking it to move a year a year.
 *   It lets its holder live and work anywhere in the US, ends the O-1's
 *   renewals, and after five years opens federal Medicaid and naturalizing.
 *   The card's renewal isn't charged, its ten years not read on USCIS's pages.
 * Citizenship by naturalization isn't kept: SLATE holds one citizenship.
 *
 * From the connected world of 2026-10-09 neither the Global Talent visa nor
 * the green card is applied for: each was endorsed or petitioned on the
 * O-1's record, the career's credits, and the career went in the scope reset
 * that day. Their fees, the Visa Bulletin's wait and the applications went;
 * a save that holds either keeps it, and what it opens: the NHS, settlement,
 * Medicaid after five years and naturalizing.
 *
 * From 2026-10-06 each waits on its visit (`systems/papervisits.ts`): the
 * Global Talent visa is granted the day its biometrics are enrolled, and the
 * green card's decision waits on the I-485's biometrics, either ended if
 * they're missed. Until then the visa was granted the day it was paid for.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { payFromBank, inTheBank } from './spending';
import { citizenOf, documentsOf, inForce, isoOfCountry, numberFor, type PersonDocument } from './documents';
import { CITIES } from '../content/geography';
import { homeOf } from './earnings';
import { earningsOf } from './earnings';

const YEAR_MS = 365.2425 * MS_DAY;

/** Settling from the Global Talent visa: indefinite leave after five years, £3,226. Its endorsement, visa and surcharge were here until 2026-10-09. */
export const GLOBAL_TALENT = { settleAfter: 5, ilr: 3_226 } as const;
export const MEXICAN_RESIDENCE = { uma: 117.31, savingsUma: 11_460, incomeUma: 680, temporary: 11_140.74, consularVisaUsd: 56, permanent: 13_578.96, permanentAfter: 4 } as const;

export type Route = 'global-talent' | 'uk-settled' | 'mx-temporary' | 'mx-permanent' | 'us-green-card';

const inSave = (sim: Simulation, units: number, from: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur) ?? c; };

/** The residence a person holds in a country, where one is in force. */
export function residenceIn(person: Person, iso: string, at: Instant): PersonDocument | undefined {
  return documentsOf(person).find((d) => d.route !== undefined && d.destination === iso && inForce(d, at));
}

/** Whether they hold Britain's permission with its health surcharge paid, which makes the NHS theirs. */
export const nhsByRoute = (person: Person, at: Instant): boolean => {
  const r = residenceIn(person, 'GB', at)?.route;
  return r === 'global-talent' || r === 'uk-settled';
};

/** Six months' income, a month's worth, in pesos, and savings in the bank, against Mexico's solvency tests. */
export function mexicanSolvency(sim: Simulation, person: Person): { savings: Money; monthly: Money; meets: boolean } {
  const cur = saveCurrency(sim.universe);
  const pesos = (c: Money) => (cur === 'MXN' ? c : exchange(c, cur, 'MXN') ?? c);
  const months = earningsOf(person).months;
  const now = new Date(sim.now);
  let six = 0;
  for (let i = 1; i <= 6; i += 1) { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)); six += months[`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`] ?? 0; }
  const savings = pesos(inTheBank(sim, person));
  const monthly = pesos(Math.round(six / 6));
  const r = MEXICAN_RESIDENCE;
  return { savings, monthly, meets: savings >= Math.round(r.savingsUma * r.uma * 100) || monthly >= Math.round(r.incomeUma * r.uma * 100) };
}

export function routeRefusal(sim: Simulation, person: Person, iso: string): string | undefined {
  const own = isoOfCountry(person.citizenshipId);
  if (citizenOf(person, iso)) return 'You’re a citizen there.';
  if (iso === 'CA') return 'Canada has no route for a freelance actor: its Self-Employed Persons Program is paused until further notice, and Express Entry has no category for the arts.';
  if (iso === 'IE') return 'Ireland has no route for a freelance actor: an employment permit needs an employer’s offer.';
  if (iso === 'US') {
    if (residenceIn(person, 'US', sim.now)) return 'You hold a green card.';
    if (documentsOf(person).some((d) => d.route === 'us-green-card' && d.status === 'pending')) return 'Your petition is being decided.';
    if (CITIES.get(homeOf(person))?.countryId !== 'us') return 'A green card is applied for from inside the United States, in status.';
    // Extraordinary ability was read on the O-1's record, the career's credits, until the career went in the scope reset of 2026-10-09.
    return 'Extraordinary ability is shown on a career’s record, and there’s none to show.';
  }
  if (iso === 'GB') {
    if (own === 'IE') return 'An Irish citizen lives in Britain under the Common Travel Area.';
    if (residenceIn(person, 'GB', sim.now)) return 'You hold permission to live there.';
    if (documentsOf(person).some((d) => d.destination === 'GB' && d.route === 'global-talent' && d.status === 'pending')) return 'Your application waits on its biometrics.';
    // Endorsed on the O-1's record, the career's credits, until the career went in the scope reset of 2026-10-09.
    return 'Arts Council England endorses talent shown in a career’s record, and there’s none to show.';
  }
  if (iso === 'MX') {
    if (residenceIn(person, 'MX', sim.now)) return 'You hold residence there.';
    const s = mexicanSolvency(sim, person);
    if (!s.meets) return `Mexico asks savings of MXN ${Math.round(MEXICAN_RESIDENCE.savingsUma * MEXICAN_RESIDENCE.uma).toLocaleString('en-US')} or an income of MXN ${Math.round(MEXICAN_RESIDENCE.incomeUma * MEXICAN_RESIDENCE.uma).toLocaleString('en-US')} a month over six months.`;
    return undefined;
  }
  return 'SLATE keeps routes to residence in Britain, Mexico and the United States.';
}

/** What applying costs, in the save's money: Mexico's, the only route a student can take. */
export function residenceFee(sim: Simulation): Money {
  return inSave(sim, MEXICAN_RESIDENCE.temporary, 'MXN') + inSave(sim, MEXICAN_RESIDENCE.consularVisaUsd, 'USD');
}

/** Settling: Britain's indefinite leave after five years with pay earned there; Mexico's permanent residence after four years' temporary. */
export function settleRefusal(sim: Simulation, person: Person, iso: string): string | undefined {
  const held = documentsOf(person).filter((d) => d.destination === iso && d.route !== undefined);
  const first = held.reduce<number | undefined>((a, d) => (d.issuedAt !== undefined && (a === undefined || d.issuedAt < a) ? d.issuedAt : a), undefined);
  const now = residenceIn(person, iso, sim.now);
  if (!now || first === undefined) return 'You hold no residence there to settle from.';
  if (now.route === 'uk-settled' || now.route === 'mx-permanent') return 'You’re settled there.';
  if (iso === 'GB') {
    if (sim.now - first < GLOBAL_TALENT.settleAfter * YEAR_MS - MS_DAY) return 'Settlement comes after five years on the Global Talent visa.';
    if (!(Object.values(earningsOf(person).years).some((y) => (y.bySource?.uk ?? 0) > 0))) return 'Settlement asks that you’ve earned money in Britain in your field.';
    return undefined;
  }
  if (iso === 'MX') return sim.now - first < MEXICAN_RESIDENCE.permanentAfter * YEAR_MS - MS_DAY ? 'Permanent residence comes after four years’ temporary.' : undefined;
  return 'SLATE keeps settlement in Britain and Mexico.';
}

function grant(sim: Simulation, person: Person, iso: string, route: Route, name: string, years?: number): void {
  const id = sim.nextId('document');
  documentsOf(person).push({ id, kind: route === 'mx-temporary' || route === 'mx-permanent' ? 'visa' : 'permit', issuer: iso, name, number: numberFor('R', id), status: 'valid', issuedAt: sim.now, ...(years ? { expiresAt: sim.now + years * YEAR_MS } : {}), destination: iso, route });
}

export function registerResidence(sim: Simulation): void {
  sim.onCommand<{ country: string }, { paid: Money }>('documents.residence', (p, { sim: s }) => {
    const person = s.player;
    const iso = String(p?.country ?? '').toUpperCase();
    const no = routeRefusal(s, person, iso);
    if (no) throw new CommandError(no);
    // Only Mexico's is applied for since 2026-10-09: the US and British branches went with the career's record they read.
    const fee = residenceFee(s);
    if (!payFromBank(s, person, fee, 'Mexican temporary residence, the card and the visa', 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    grant(s, person, 'MX', 'mx-temporary', 'Residente Temporal', 1);
    return { paid: fee };
  });

  sim.onCommand<{ country: string }, { paid: Money }>('documents.settle', (p, { sim: s }) => {
    const person = s.player;
    const iso = String(p?.country ?? '').toUpperCase();
    const no = settleRefusal(s, person, iso);
    if (no) throw new CommandError(no);
    const fee = iso === 'GB' ? inSave(s, GLOBAL_TALENT.ilr, 'GBP') : inSave(s, MEXICAN_RESIDENCE.permanent, 'MXN');
    if (!payFromBank(s, person, fee, iso === 'GB' ? 'Indefinite leave to remain' : 'Mexican permanent residence', 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    for (const d of documentsOf(person)) if (d.destination === iso && d.route !== undefined && d.status === 'valid') d.status = 'cancelled';
    grant(s, person, iso, iso === 'GB' ? 'uk-settled' : 'mx-permanent', iso === 'GB' ? 'Indefinite Leave To Remain' : 'Residente Permanente');
    return { paid: fee };
  });

  sim.onCommand<{ country: string }, { paid: Money }>('documents.renew_residence', (p, { sim: s }) => {
    const person = s.player;
    const held = documentsOf(person).filter((d) => d.destination === 'MX' && d.route === 'mx-temporary' && d.status === 'valid').sort((a, b) => (b.expiresAt ?? 0) - (a.expiresAt ?? 0))[0];
    if (String(p?.country ?? '').toUpperCase() !== 'MX' || !held) throw new CommandError('Only Mexican temporary residence is renewed, a year at a time.');
    if ((held.expiresAt ?? 0) - s.now > 30 * MS_DAY) throw new CommandError('It’s renewed within its last 30 days.');
    const fee = inSave(s, MEXICAN_RESIDENCE.temporary, 'MXN');
    if (!payFromBank(s, person, fee, 'Mexican temporary residence, renewed', 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    held.expiresAt = Math.max(held.expiresAt ?? s.now, s.now) + YEAR_MS;
    return { paid: fee };
  });
}
