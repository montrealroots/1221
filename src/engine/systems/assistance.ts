/**
 * SLATE — the assistance a person out of money can claim where they live,
 * from 2026-10-01 (docs/WORLD.md), researched in
 * `docs/research/world/research-welfare.json` and
 * `research-documents-safetynet.json`. Until then a Canadian resident could
 * claim nothing, and an American only unemployment insurance, which an actor
 * between jobs often doesn't qualify for; a played life in Toronto starved.
 *
 * **Ontario Works**, for a single adult living in Ontario: CAD 343 a month
 * for basic needs and the actual rent up to CAD 390 for shelter, CAD 733 at
 * most. Liquid assets to CAD 10,000; the home lived in and a car are
 * exempt. Earnings come off it whole for the first three months on it, and
 * after them the first CAD 200 and half of the rest are kept (the policy
 * directives, updated 2026). Decided in four working days; paid monthly.
 * Anyone living in Ontario, however recently back from abroad.
 *
 * **BC Income Assistance**, for a single employable adult living in British
 * Columbia: CAD 560 for support and the actual rent up to CAD 500, CAD 1,060
 * at most (the rate table of 2023-08-01, still current). Assets to CAD 5,000,
 * the home and a car exempt. CAD 600 a month of earnings kept, after the
 * first month on it. A new applicant searches for work three weeks first.
 * The two-year independence rule was abolished on 2020-01-01.
 *
 * Canada's Employment Insurance isn't kept: a performer engaged by a
 * producer is self-employed under the Status of the Artist Act, and pays no
 * premium unless opting in to its special benefits only (CRA's Folio
 * S4-F14-C1; Royal Winnipeg Ballet v. M.N.R., 2006 FCA 87).
 *
 * **SNAP**, in New York, California and Connecticut, for a single adult: the
 * USDA's maximum allotment ($298 a month in fiscal 2026, $306 from 1 October
 * 2026) less 30% of net income, which is gross income less 20% of earnings
 * and the standard deduction ($209, then $217). The state's gross limit (New
 * York's 150% of poverty, $1,995 a month; California's and Connecticut's
 * 200%) and the federal net limit ($1,305, then $1,330) never bind for a
 * single adult here: 30% of net income takes the whole benefit well before
 * either, the shelter deduction that would lift them not being kept. Paid onto an EBT card that buys groceries only, which a day's
 * food draws on first. An able-bodied adult of 18 to 64 without 80 hours of
 * work a month is paid three months in three years (7 U.S.C. 2015(o), as the
 * 2025 law widened it). The excess shelter deduction isn't kept, its cap not
 * being read, so SLATE's benefit is the lower one a household with low rent
 * gets. A citizen's; a non-citizen's eligibility isn't kept.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { isoOfCountry } from './documents';
import { earningsOf } from './earnings';
import { citizenOf } from './documents';
import { rentOf } from './household';

export const ASSISTANCE_KIND = 'benefits.assistance_month';

export const ONTARIO_WORKS = { basic: 343, shelterMax: 390, assets: 10_000, exemptBase: 200, exemptShare: 0.5, exemptAfterMonths: 3, decidedDays: 6 } as const;
export const BC_ASSISTANCE = { support: 560, shelterMax: 500, assets: 5_000, exempt: 600, exemptAfterMonths: 1, workSearchDays: 21 } as const;
export const SNAP = {
  fy: [
    { from: '2025-10-01', max: 298, standard: 209 },
    { from: '2026-10-01', max: 306, standard: 217 },
  ],
  /** The states it's kept in, where SLATE keeps benefits. */
  states: ['us-ny', 'us-ca', 'us-ct'] as readonly string[],
  earnedDeduction: 0.2,
  share: 0.3,
  abawd: { from: 18, to: 64, hours: 80, months: 3, window: 36 },
} as const;

export type AssistanceScheme = 'ontario-works' | 'bc-assistance' | 'snap';
export interface AssistanceClaim { scheme: AssistanceScheme; since: Instant; months: number; /** SNAP: the months counted against the time limit, by 'YYYY-MM'. */ counted?: string[]; ebtAccountId?: string; closedAt?: Instant }

const YEAR = 365.2425 * MS_DAY;
const regionOf = (person: Person) => CITIES.get(person.home?.cityId ?? person.currentLocationId)?.parentId ?? '';

/** The scheme where they live, if SLATE keeps one. */
export function schemeFor(person: Person): AssistanceScheme | undefined {
  const region = regionOf(person);
  if (region === 'ca-08') return 'ontario-works';
  if (region === 'ca-02') return 'bc-assistance';
  if (SNAP.states.includes(region)) return 'snap';
  return undefined;
}

const inLocal = (sim: Simulation, cents: Money, currency: string): Money => { const cur = saveCurrency(sim.universe); return cur === currency ? cents : exchange(cents, cur, currency) ?? cents; };
const toSave = (sim: Simulation, cents: Money, currency: string): Money => { const cur = saveCurrency(sim.universe); return cur === currency ? cents : exchange(cents, currency, cur) ?? cents; };
const liquid = (sim: Simulation, person: Person) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash')).reduce((x, a) => x + Math.max(0, a.balance), 0);
const monthKey = (at: Instant) => { const p = zonedParts(at, 'UTC'); return `${p.year}-${String(p.month).padStart(2, '0')}`; };

/** A month's earnings, gross, in the save's money: the calendar month before a moment. */
function lastMonthEarned(person: Person, at: Instant): Money {
  const p = zonedParts(at - 15 * MS_DAY, 'UTC');
  return earningsOf(person).months[`${p.year}-${String(p.month).padStart(2, '0')}`] ?? 0;
}

/** Why they can't claim, or nothing. */
export function assistanceRefusal(sim: Simulation, person: Person): string | undefined {
  const scheme = schemeFor(person);
  if (!scheme) return 'SLATE keeps assistance in Ontario, British Columbia, New York, California and Connecticut only yet.';
  if (person.assistance && person.assistance.closedAt === undefined) return 'You have a claim open.';
  const own = isoOfCountry(person.citizenshipId);
  if (scheme === 'snap' && own !== 'US' && !citizenOf(person, 'US')) return 'SNAP is kept for a citizen; a non-citizen’s eligibility turns on status SLATE doesn’t keep.';
  if (scheme !== 'snap' && own !== 'CA' && !citizenOf(person, 'CA')) return 'Assistance is kept for a Canadian citizen; a newcomer’s eligibility turns on status SLATE doesn’t keep.';
  const age = (sim.now - person.birthInstant) / YEAR;
  if (age < 18) return 'It’s claimed by an adult.';
  if (scheme === 'ontario-works' && inLocal(sim, liquid(sim, person), 'CAD') > ONTARIO_WORKS.assets * 100) return `Ontario Works asks liquid assets under CAD ${ONTARIO_WORKS.assets.toLocaleString('en-US')}.`;
  if (scheme === 'bc-assistance' && inLocal(sim, liquid(sim, person), 'CAD') > BC_ASSISTANCE.assets * 100) return `Income assistance asks assets under CAD ${BC_ASSISTANCE.assets.toLocaleString('en-US')}.`;
  return undefined;
}

/** A month's Ontario Works or BC assistance, in Canadian cents: the rates less the earnings not exempt. */
export function provincialMonth(scheme: 'ontario-works' | 'bc-assistance', rentCad: Money, earnedCad: Money, monthsOn: number): Money {
  if (scheme === 'ontario-works') {
    const r = ONTARIO_WORKS;
    const kept = monthsOn >= r.exemptAfterMonths ? Math.min(earnedCad, r.exemptBase * 100) + Math.max(0, earnedCad - r.exemptBase * 100) * r.exemptShare : 0;
    return Math.max(0, r.basic * 100 + Math.min(rentCad, r.shelterMax * 100) - Math.round(earnedCad - kept));
  }
  const r = BC_ASSISTANCE;
  const kept = monthsOn >= r.exemptAfterMonths ? Math.min(earnedCad, r.exempt * 100) : 0;
  return Math.max(0, r.support * 100 + Math.min(rentCad, r.shelterMax * 100) - (earnedCad - kept));
}

/** A month's SNAP, in dollar cents: the maximum less 30% of net income, or none past a limit. */
export function snapMonth(grossUsd: Money, earnedUsd: Money, at: Instant): Money {
  const fy = [...SNAP.fy].reverse().find((f) => at >= Date.parse(`${f.from}T00:00:00Z`)) ?? SNAP.fy[0]!;
  const net = Math.max(0, grossUsd - Math.round(earnedUsd * SNAP.earnedDeduction) - fy.standard * 100);
  return Math.max(0, fy.max * 100 - Math.round(net * SNAP.share));
}

function schedule(sim: Simulation, person: Person, at: Instant): void {
  sim.schedule({ at, kind: ASSISTANCE_KIND, label: 'Assistance, The Month', category: 'system', priority: 12, payload: { personId: person.id } });
}

export function registerAssistance(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { scheme: AssistanceScheme; firstPaymentAt: Instant }>('benefits.assistance', (_p, { sim: s }) => {
    const person = s.player;
    const no = assistanceRefusal(s, person);
    if (no) throw new CommandError(no);
    const scheme = schemeFor(person)!;
    person.assistance = { scheme, since: s.now, months: 0 };
    // Ontario decides in four working days; British Columbia asks three weeks' work search first; SNAP pays from the month applied.
    const first = s.now + (scheme === 'ontario-works' ? ONTARIO_WORKS.decidedDays : scheme === 'bc-assistance' ? BC_ASSISTANCE.workSearchDays : 7) * MS_DAY;
    schedule(s, person, first);
    return { scheme, firstPaymentAt: first };
  });

  sim.onSchedule(ASSISTANCE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const claim = person?.assistance;
    if (!person || !claim || claim.closedAt !== undefined) return;
    // Moved away, the claim ends: each is the province's or the state's.
    if (schemeFor(person) !== claim.scheme) { claim.closedAt = s.now; return; }
    const mine = person.id === s.universe.playerId;
    const earned = lastMonthEarned(person, item.at);
    let due = 0;
    if (claim.scheme === 'snap') {
      const age = (item.at - person.birthInstant) / YEAR;
      const hours = (person.career?.days ?? []).filter((d) => d.at >= item.at - 30 * MS_DAY && d.at < item.at).length * 8;
      const key = monthKey(item.at);
      const within = (claim.counted ?? []).filter((m) => m > monthKey(item.at - SNAP.abawd.window * 30.44 * MS_DAY));
      const limited = age >= SNAP.abawd.from && age < SNAP.abawd.to + 1 && hours < SNAP.abawd.hours;
      if (limited && within.length >= SNAP.abawd.months) {
        if (mine) s.notify({ category: 'benefits', title: 'SNAP Time Limit Reached', body: 'Three months in three years without 80 hours of work a month: SNAP pays no more until you work them.', importance: 60, route: '/workspace/papers' });
        schedule(s, person, item.at + 30 * MS_DAY);
        return;
      }
      due = toSave(s, snapMonth(inLocal(s, earned, 'USD'), inLocal(s, earned, 'USD'), item.at), 'USD');
      if (due > 0) {
        if (limited) claim.counted = [...within, key];
        const ebt = claim.ebtAccountId ? s.universe.accounts[claim.ebtAccountId] : undefined;
        const account = ebt ?? s.openAccount({ id: s.nextId('account'), kind: 'escrow', category: 'ebt', name: 'EBT Card, SNAP', ownerId: person.id, institution: 'SNAP', openedAt: s.now });
        claim.ebtAccountId = account.id;
        s.post({ memo: 'SNAP, the month, onto the EBT card', category: 'benefit', postings: [{ accountId: account.id, amount: due }, { accountId: s.nominalAccount('income', 'SNAP').id, amount: -due }] });
      }
    } else {
      const liquidCad = inLocal(s, liquid(s, person), 'CAD');
      const limit = (claim.scheme === 'ontario-works' ? ONTARIO_WORKS.assets : BC_ASSISTANCE.assets) * 100;
      if (liquidCad <= limit) {
        due = toSave(s, provincialMonth(claim.scheme, inLocal(s, rentOf(s, person), 'CAD'), inLocal(s, earned, 'CAD'), claim.months), 'CAD');
        if (due > 0) s.post({ memo: `${claim.scheme === 'ontario-works' ? 'Ontario Works' : 'Income assistance'}, the month`, category: 'benefit', postings: [{ accountId: person.primaryAccountId!, amount: due }, { accountId: s.nominalAccount('income', claim.scheme === 'ontario-works' ? 'Ontario Works' : 'Income Assistance').id, amount: -due }] });
      }
    }
    if (due > 0) claim.months += 1;
    if (due > 0 && mine) s.notify({ category: 'benefits', title: claim.scheme === 'snap' ? 'SNAP Paid' : 'Assistance Paid', body: `${formatMoney(due, saveCurrency(s.universe))} for the month.`, importance: 30, route: '/workspace/papers' });
    schedule(s, person, item.at + 30 * MS_DAY);
  });
}

/** What the EBT card holds for the day's groceries, in the save's money. */
export function ebtBalance(sim: Simulation, person: Person): Money {
  const id = person.assistance?.ebtAccountId;
  return id ? Math.max(0, sim.universe.accounts[id]?.balance ?? 0) : 0;
}
