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
 *   2026's UMA of MXN 117.31; SLATE read the savings as held on the day. The card,
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
 *
 * From 2026-10-16 (brief 09's journeys) Mexico's residence isn't sold either:
 * Papers' Residence Abroad sold the card and its visa to a New Haven student
 * on the solvency test, $674.93, then its renewal, permanent residence and a
 * Mexican citizenship (`systems/citizenship.ts`), and nothing outside those
 * papers read any of it, living in Mexico having gone with moving on
 * 2026-10-09. Its rule is said, as Going Abroad says a country's, and each
 * step refused with the reason; a card a save holds is kept until it runs
 * out, and a naturalization applied for is still decided.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { payFromBank } from './spending';
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

// Mexico's solvency test, savings in the bank or six months' income against its UMA (`mexicanSolvency`), opened the
// route until 2026-10-16, and went when the route stopped being sold: it read the bank for a sale nothing reads.

const pesosOf = (units: number) => `MXN ${units.toLocaleString('en-US', { minimumFractionDigits: units % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
/** Why SLATE grants none of Mexico's papers, said after each of its rules (from 2026-10-16). */
export const MEXICO_UNREAD = 'Moving abroad isn’t part of the game, so it grants none of Mexico’s papers.';
/** Mexico's rule for temporary residence by solvency, in its own figures. */
export const MEXICO_RULE = `Mexico grants temporary residence on savings of ${pesosOf(Math.round(MEXICAN_RESIDENCE.savingsUma * MEXICAN_RESIDENCE.uma))} or an income of ${pesosOf(Math.round(MEXICAN_RESIDENCE.incomeUma * MEXICAN_RESIDENCE.uma))} a month over six months, with the card at ${pesosOf(MEXICAN_RESIDENCE.temporary)} a year and the consulate’s visa at US$${MEXICAN_RESIDENCE.consularVisaUsd}.`;
/** Why a Mexican card isn't renewed (from 2026-10-16), its rule and the reason. */
export const MEXICO_RENEWAL = `Mexico renews temporary residence a year at a time, in the card’s last 30 days, for ${pesosOf(MEXICAN_RESIDENCE.temporary)}. ${MEXICO_UNREAD}`;

/** Why a route to residence is refused: every one is, since 2026-10-16 (until then Mexico's opened on its solvency test). */
export function routeRefusal(sim: Simulation, person: Person, iso: string): string {
  const own = isoOfCountry(person.citizenshipId);
  if (citizenOf(person, iso)) return 'You’re a citizen there.';
  if (iso === 'CA') return 'Canada has no route for a freelance actor. Its Self-Employed Persons Program is paused until further notice, and Express Entry has no category for the arts.';
  if (iso === 'IE') return 'Ireland has no route for a freelance actor, because an employment permit needs an employer’s offer.';
  if (iso === 'US') {
    if (residenceIn(person, 'US', sim.now)) return 'You hold a green card.';
    if (documentsOf(person).some((d) => d.route === 'us-green-card' && d.status === 'pending')) return 'Your petition is being decided.';
    if (CITIES.get(homeOf(person))?.countryId !== 'us') return 'A green card is applied for from inside the United States, while you’re in status.';
    // Extraordinary ability was read on the O-1's record, the career's credits, until the career went in the scope reset of 2026-10-09.
    return 'A green card for extraordinary ability needs a record of professional work, and the game has none to show.';
  }
  if (iso === 'GB') {
    if (own === 'IE') return 'An Irish citizen lives in Britain under the Common Travel Area.';
    if (residenceIn(person, 'GB', sim.now)) return 'You hold permission to live there.';
    if (documentsOf(person).some((d) => d.destination === 'GB' && d.route === 'global-talent' && d.status === 'pending')) return 'Your application is waiting on your biometrics appointment.';
    // Endorsed on the O-1's record, the career's credits, until the career went in the scope reset of 2026-10-09.
    return 'Arts Council England endorses talent shown in a record of professional work, and the game has none to show.';
  }
  if (iso === 'MX') {
    if (residenceIn(person, 'MX', sim.now)) return 'You hold residence there.';
    // Until 2026-10-16 one meeting the solvency test was refused nothing here, and Papers sold the card for $674.93.
    return `${MEXICO_RULE} ${MEXICO_UNREAD}`;
  }
  return 'The game has routes to residence only in Britain, Mexico and the United States.';
}

// What applying cost in the save's money, the card and the visa (`residenceFee`), went with the sale on 2026-10-16.

/**
 * Since when residence in a country has been held without a break, back from the one in force (from 2026-10-10):
 * each earlier grant counts while it reached the next, ended or run out no more than a day before it. Until then
 * settlement and naturalization counted from the first grant ever, across a lapse of any length.
 */
export function continuousSince(person: Person, iso: string, at: Instant): Instant | undefined {
  const now = residenceIn(person, iso, at);
  if (!now || now.issuedAt === undefined) return undefined;
  const earlier = documentsOf(person).filter((d) => d !== now && d.destination === iso && d.route !== undefined && d.issuedAt !== undefined).sort((a, b) => b.issuedAt! - a.issuedAt!);
  let since = now.issuedAt;
  for (const d of earlier) {
    if (d.issuedAt! >= since) continue;
    const ended = d.endedAt ?? d.expiresAt ?? Number.POSITIVE_INFINITY;
    if (ended + MS_DAY < since) break;
    since = d.issuedAt!;
  }
  return since;
}

/** Settling: Britain's indefinite leave after five years with pay earned there; Mexico's permanent residence after four years' temporary, held without a break. */
export function settleRefusal(sim: Simulation, person: Person, iso: string): string | undefined {
  const first = continuousSince(person, iso, sim.now);
  const now = residenceIn(person, iso, sim.now);
  if (!now || first === undefined) return 'You hold no residence there to settle from.';
  if (now.route === 'uk-settled' || now.route === 'mx-permanent') return 'You’re settled there.';
  if (iso === 'GB') {
    if (sim.now - first < GLOBAL_TALENT.settleAfter * YEAR_MS - MS_DAY) return 'Settlement comes after five years on the Global Talent visa.';
    if (!(Object.values(earningsOf(person).years).some((y) => (y.bySource?.uk ?? 0) > 0))) return 'Settlement asks that you’ve earned money in Britain in your field, and you haven’t.';
    return undefined;
  }
  // Granted past the four years until 2026-10-16, for MXN 13,578.96; from then the rule, and past it the reason.
  if (iso === 'MX') return sim.now - first < MEXICAN_RESIDENCE.permanentAfter * YEAR_MS - MS_DAY ? 'Permanent residence comes after four years of temporary residence.' : `Mexico grants permanent residence after four years of temporary residence, for ${pesosOf(MEXICAN_RESIDENCE.permanent)}. ${MEXICO_UNREAD}`;
  return 'The game has settlement only in Britain and Mexico.';
}

/** Britain's settlement, the one grant left (from 2026-10-16: Mexico's cards, a visa a year or for good, were granted here until then). */
function grant(sim: Simulation, person: Person, iso: string, route: Route, name: string): void {
  const id = sim.nextId('document');
  documentsOf(person).push({ id, kind: 'permit', issuer: iso, name, number: numberFor('R', id), status: 'valid', issuedAt: sim.now, destination: iso, route });
}

export function registerResidence(sim: Simulation): void {
  // Every route is refused since 2026-10-16. The US and British branches went with the career's record they read on
  // 2026-10-09; Mexico's card was paid for from the bank and granted for a year until 2026-10-16, read by nothing.
  sim.onCommand<{ country: string }, { paid: Money }>('documents.residence', (p, { sim: s }) => {
    throw new CommandError(routeRefusal(s, s.player, String(p?.country ?? '').toUpperCase()));
  });

  sim.onCommand<{ country: string }, { paid: Money }>('documents.settle', (p, { sim: s }) => {
    const person = s.player;
    const iso = String(p?.country ?? '').toUpperCase();
    const no = settleRefusal(s, person, iso);
    if (no) throw new CommandError(no);
    // Britain's alone since 2026-10-16: Mexico's permanent residence, MXN 13,578.96, was granted until then.
    const fee = inSave(s, GLOBAL_TALENT.ilr, 'GBP');
    if (!payFromBank(s, person, fee, 'Indefinite leave to remain', 'documents')) throw new CommandError(`Your bank can’t cover ${formatMoney(fee, saveCurrency(s.universe))}, so nothing was charged.`);
    for (const d of documentsOf(person)) if (d.destination === iso && d.route !== undefined && d.status === 'valid') d.status = 'cancelled';
    grant(s, person, iso, 'uk-settled', 'Indefinite Leave To Remain');
    return { paid: fee };
  });

  // Mexico's card, in force and in its last 30 days, was renewed a year for MXN 11,140.74 until 2026-10-16; from then
  // the rule and the reason, the card a save holds running out at its end.
  sim.onCommand<{ country: string }, { paid: Money }>('documents.renew_residence', () => {
    throw new CommandError(MEXICO_RENEWAL);
  });
}
