/**
 * SLATE — a child by adoption or by a surrogate (Stage 10 of
 * `docs/BACKLOG.md`, from 2026-10-02; the routes and costs in
 * `content/adoption.ts`).
 *
 * Adopt pays the route's cost where you live and starts it. A newborn's
 * agency matches at its month's chance (decider `social.adopt`); a public
 * route places its child after its months, at the age its children are
 * placed. A surrogacy, where the law lets it, is paid at the start and the
 * child is born a pregnancy later. Either, single or as a couple; the child
 * is the couple's where you live with a partner, and joins the family's
 * month: its raising, its benefit and, in America, the Child Tax Credit and
 * the adoption credit on the return.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { NAMES } from '../content/people';
import { ADOPTION, SURROGACY, US_ADOPTION_CREDIT, familyPlace, type AdoptionRoute } from '../content/adoption';
import { PREGNANCY_DAYS } from '../content/children';
import { CHILD_MONTH_KIND, childrenOf, type Child } from './children';
import { livesWithPartner } from './marriage';
import { payFromBank } from './household';

export const ADOPT_KIND = 'child.adopted';
export const SURROGATE_BIRTH_KIND = 'child.surrogate_birth';
const YEAR_MS = 365.2425 * MS_DAY;
const MONTH_MS = YEAR_MS / 12;

export interface FamilyPath { kind: 'adoption' | 'surrogacy'; place: string; started: Instant; arrives: Instant; paid: Money; childAge: number }
export interface Adopted { at: Instant; cost: Money; year: number }

const placeOf = (person: Person) => familyPlace(person.home?.cityId ?? person.currentLocationId);
const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };
const ageAt = (person: Person, at: Instant) => (at - person.birthInstant) / YEAR_MS;

export const adoptionRoute = (person: Person): AdoptionRoute | undefined => ADOPTION[placeOf(person)];

/** Why a route can't be started, or nothing. */
export function adoptRefusal(_sim: Simulation, person: Person, kind: 'adoption' | 'surrogacy', at: Instant): string | undefined {
  if (person.familyPath) return 'A child is on the way already.';
  if (person.pregnancy) return 'A child is on the way.';
  if (kind === 'adoption') {
    const r = adoptionRoute(person);
    if (!r) return 'SLATE keeps no adoption where you live.';
    if (ageAt(person, at) < r.minAge) return `${r.place} asks you to be ${r.minAge} to adopt.`;
    return undefined;
  }
  const s = SURROGACY[placeOf(person)];
  if (!s) return placeOf(person) === 'ie' ? 'Ireland’s surrogacy law isn’t in force yet.' : 'SLATE keeps no surrogacy where you live.';
  return undefined;
}

/** What a route costs now, in the save's money. */
export function pathCost(sim: Simulation, person: Person, kind: 'adoption' | 'surrogacy'): Money {
  if (kind === 'adoption') { const r = adoptionRoute(person)!; return inSave(sim, r.cost, r.currency); }
  const s = SURROGACY[placeOf(person)]!;
  return inSave(sim, s.cost, s.currency);
}

/** When an agency's newborn is matched: each month at the chance its year's share gives (decider `social.adopt`). */
export function monthsToMatch(sim: Simulation, person: Person, matchedInYear: number, at: Instant, odds?: number): number {
  const monthly = odds ?? 1 - Math.pow(1 - matchedInYear, 1 / 12);
  const rng = sim.rng('social.adopt', person.id, String(at));
  let m = 1;
  while (m < 120 && rng.next() >= monthly) m += 1;
  return m;
}

function nameFor(sim: Simulation, person: Person, key: string): string {
  const country = (['us', 'uk', 'ie', 'ca', 'mx'] as const).find((x) => x === (person.home?.cityId ?? 'us').split('-')[0]) ?? 'us';
  const names = NAMES[country];
  const rng = sim.rng('social.adopt', person.id, `name-${key}`);
  const given = rng.next() < 0.5 ? names.female : names.male;
  return `${given[Math.floor(rng.next() * given.length)]} ${person.displayName.split(' ').slice(-1)[0]}`;
}

function welcome(sim: Simulation, person: Person, path: FamilyPath, at: Instant): Child {
  const partner = livesWithPartner(person);
  const child: Child = { id: sim.nextId('contact'), name: nameFor(sim, person, String(at)), born: Math.round(at - path.childAge * YEAR_MS), ...(partner ? { otherParentId: partner.id } : {}) };
  childrenOf(person).push(child);
  delete person.familyPath;
  if (path.kind === 'adoption') (person.adopted ??= []).push({ at, cost: path.paid, year: new Date(at).getUTCFullYear() });
  if (!sim.universe.scheduled.some((i) => i.kind === CHILD_MONTH_KIND && i.status === 'pending' && i.payload.personId === person.id)) {
    sim.schedule({ at: at + MONTH_MS, kind: CHILD_MONTH_KIND, label: 'The Family’s Month', category: 'relationship', priority: 30, payload: { personId: person.id } });
  }
  if (person.id === sim.universe.playerId) sim.notify({ category: 'relationship', title: path.kind === 'adoption' ? 'Your Child Came Home' : 'A Baby', body: path.kind === 'adoption' ? `${child.name}${path.childAge >= 1 ? `, ${Math.floor(path.childAge)}` : ''}, adopted, is home with you.` : `${child.name} was born to your surrogate, and is yours.`, importance: 90, route: '/workspace/people' });
  return child;
}

/**
 * America's federal adoption credit for a year, in a currency, from the
 * adoptions made final that year: each child's expenses to the most, phased
 * out by the return's income, and its refundable part.
 */
export function adoptionCredit(person: Person, year: number, magi: Money, into: string): { credit: Money; refundable: Money } {
  const usd = (n: number) => { const c = Math.round(n * 100); return into === 'USD' ? c : exchange(c, 'USD', into) ?? c; };
  const ones = (person.adopted ?? []).filter((a) => a.year === year);
  if (!ones.length) return { credit: 0, refundable: 0 };
  const left = Math.max(0, Math.min(1, (usd(US_ADOPTION_CREDIT.phaseTo) - magi) / (usd(US_ADOPTION_CREDIT.phaseTo) - usd(US_ADOPTION_CREDIT.phaseFrom))));
  const credit = Math.round(ones.reduce((s, a) => s + Math.min(a.cost, usd(US_ADOPTION_CREDIT.most)), 0) * left);
  return { credit, refundable: Math.min(credit, Math.round(ones.length * usd(US_ADOPTION_CREDIT.refundable) * left)) };
}

export function registerAdoption(sim: Simulation): void {
  sim.onCommand<{ kind: 'adoption' | 'surrogacy' }, { arrives: Instant; paid: Money }>('social.adopt', (p, { sim: s }) => {
    const person = s.player;
    const kind = p?.kind === 'surrogacy' ? 'surrogacy' : 'adoption';
    const no = adoptRefusal(s, person, kind, s.now);
    if (no) throw new CommandError(no);
    const paid = pathCost(s, person, kind);
    if (paid > 0 && !payFromBank(s, person, paid, kind === 'adoption' ? `Adoption, ${adoptionRoute(person)!.agency}` : 'Surrogacy, its costs', 'household')) throw new CommandError(`${formatMoney(paid, saveCurrency(s.universe))} is more than the bank can cover.`);
    let arrives: Instant;
    let childAge = 0;
    if (kind === 'adoption') {
      const r = adoptionRoute(person)!;
      childAge = r.childAge;
      arrives = s.now + (r.months !== undefined ? r.months : monthsToMatch(s, person, r.matchedInYear!, s.now)) * MONTH_MS;
    } else arrives = s.now + PREGNANCY_DAYS * MS_DAY;
    person.familyPath = { kind, place: placeOf(person), started: s.now, arrives, paid, childAge };
    if (kind === 'adoption') s.schedule({ at: arrives, kind: ADOPT_KIND, label: 'Your Child Comes Home', category: 'relationship', priority: 10, payload: { personId: person.id } });
    else s.schedule({ at: arrives, kind: SURROGATE_BIRTH_KIND, label: 'The Baby Is Due', category: 'relationship', priority: 10, payload: { personId: person.id } });
    if (person.id === s.universe.playerId) s.notify({ category: 'relationship', title: kind === 'adoption' ? 'Adopting' : 'A Surrogacy', body: kind === 'adoption' ? `Started with ${adoptionRoute(person)!.agency}${paid ? `, ${formatMoney(paid, saveCurrency(s.universe), { cents: false })} paid` : ''}. A child is expected about ${formatDate(arrives, s.zone)}.` : `Paid, ${formatMoney(paid, saveCurrency(s.universe), { cents: false })}. The baby is due ${formatDate(arrives, s.zone)}.`, importance: 70, route: '/workspace/people' });
    return { arrives, paid };
  });
  for (const kind of [ADOPT_KIND, SURROGATE_BIRTH_KIND]) {
    sim.onSchedule(kind, (item, s) => {
      const person = s.universe.people[String(item.payload.personId)];
      if (!person?.familyPath) return;
      welcome(s, person, person.familyPath, item.at);
    });
  }
}
