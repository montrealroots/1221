/**
 * SLATE — a gym membership (Stage 11 of `docs/BACKLOG.md`, recreation, from
 * 2026-10-01; the gyms in `content/gyms.ts`).
 *
 * **Joining** is in person, at a gym in the town you're in, on a tier your
 * age allows, while it's open: the joining fee, the first month and any
 * annual fee are paid then, with the place's tax. Each month after is
 * charged on the day it was joined, the annual fee each year on it, from
 * the bank, or owed. It goes on wherever you are until you leave it, as
 * a membership does.
 *
 * **Leaving** inside a minimum term pays the months left of it, SLATE's
 * reading of a term contract; the gyms' own early-termination terms
 * weren't all published.
 *
 * **What it does.** A workout in a member's gym, in its town and while it's
 * open, builds what a gym builds (`trainingAt` in `systems/dwelling.ts`),
 * and one with a pool can be swum in.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { GYM_TAX, GYMS, gymById, type Gym, type GymTier } from '../content/gyms';
import { shutAt } from './errands';
import { owe, payFromBank } from './household';

export const GYM_MONTH_KIND = 'gym.month';
const YEAR_MS = 365.2425 * MS_DAY;

export interface Membership { gymId: string; tier: string; since: Instant; termEnds?: Instant }

const inSave = (sim: Simulation, units: number, currency: string): Money => {
  const cents = Math.round(units * 100);
  const cur = saveCurrency(sim.universe);
  return cur === currency ? cents : exchange(cents, currency, cur) ?? cents;
};

/** An amount at a gym with its town's tax, in the save's money. */
export const taxed = (sim: Simulation, g: Gym, units: number): Money => inSave(sim, units * (1 + (GYM_TAX[g.cityId] ?? 0)), g.currency);

export const gymsIn = (cityId: string): Gym[] => GYMS.filter((g) => g.cityId === cityId);
export const tierOf = (g: Gym, name: string): GymTier | undefined => g.tiers.find((t) => t.name === name);

/** What joining costs now: the joining fee, the first month and any annual fee, taxed. */
export const joiningCost = (sim: Simulation, g: Gym, t: GymTier): Money => taxed(sim, g, (t.joining ?? 0) + t.monthly + (t.annual ?? 0));

const ageOf = (person: Person, at: Instant) => Math.floor((at - person.birthInstant) / YEAR_MS);

export function joinRefusal(sim: Simulation, person: Person, gymId: string, tierName: string): string | undefined {
  if (person.gym) return `You’re a member of ${gymById(person.gym.gymId)?.name ?? 'a gym'} already.`;
  const g = gymById(gymId);
  if (!g) return 'There’s no such gym.';
  const t = tierOf(g, tierName);
  if (!t) return 'It has no such membership.';
  if (person.currentLocationId !== g.cityId) return 'You join in person, in its town.';
  const age = ageOf(person, sim.now);
  if (t.minAge !== undefined && age < t.minAge) return `${t.name} is from ${t.minAge}.`;
  if (t.maxAge !== undefined && age > t.maxAge) return `${t.name} is to ${t.maxAge}.`;
  return g.week ? shutAt(g.week, g.name, g.cityId, sim.now) : undefined;
}

/** What leaving costs now: the months left of a minimum term, taxed. */
export function leavingCost(sim: Simulation, person: Person): Money {
  const m = person.gym;
  const g = m && gymById(m.gymId);
  const t = g && tierOf(g, m.tier);
  if (!m || !g || !t || m.termEnds === undefined || m.termEnds <= sim.now) return 0;
  const months = Math.ceil((m.termEnds - sim.now) / (YEAR_MS / 12));
  return taxed(sim, g, months * t.monthly);
}

/** The member's gym where they are, open now: a gym's workout, and its pool. */
export function gymHere(sim: Simulation, person: Person): Gym | undefined {
  const g = person.gym && gymById(person.gym.gymId);
  if (!g || g.cityId !== person.currentLocationId) return undefined;
  return g.week && shutAt(g.week, g.name, g.cityId, sim.now) ? undefined : g;
}

export function registerGyms(sim: Simulation): void {
  sim.onCommand<{ gymId: string; tier: string }, { paid: Money }>('gym.join', (p, { sim: s }) => {
    const person = s.player;
    const no = joinRefusal(s, person, String(p?.gymId), String(p?.tier));
    if (no) throw new CommandError(no);
    const g = gymById(String(p.gymId))!;
    const t = tierOf(g, String(p.tier))!;
    const cost = joiningCost(s, g, t);
    if (!payFromBank(s, person, cost, `${g.name}, joining and the first month`, 'personal')) throw new CommandError('The bank couldn’t pay.');
    person.gym = { gymId: g.id, tier: t.name, since: s.now, ...(t.termMonths ? { termEnds: s.now + t.termMonths * (YEAR_MS / 12) } : {}) };
    s.schedule({ at: s.now + YEAR_MS / 12, kind: GYM_MONTH_KIND, label: `${g.name}, The Month`, category: 'personal', priority: 30, payload: { personId: person.id, gymId: g.id, month: 1 } });
    return { paid: cost };
  });

  sim.onCommand<Record<string, never>, { paid: Money }>('gym.leave', (_p, { sim: s }) => {
    const person = s.player;
    if (!person.gym) throw new CommandError('You aren’t a member of a gym.');
    const g = gymById(person.gym.gymId)!;
    const cost = leavingCost(s, person);
    if (cost > 0 && !payFromBank(s, person, cost, `${g.name}, the rest of the term`, 'personal')) owe(s, person, cost, `${g.name}, the rest of the term`, 'personal');
    delete person.gym;
    for (const item of s.universe.scheduled) if (item.status === 'pending' && item.kind === GYM_MONTH_KIND && item.payload.personId === person.id) s.timeline.cancel(item.id, s.now);
    return { paid: cost };
  });

  sim.onSchedule(GYM_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const m = person?.gym;
    if (!person || !m || m.gymId !== item.payload.gymId) return;
    const g = gymById(m.gymId)!;
    const t = tierOf(g, m.tier)!;
    const month = Number(item.payload.month);
    // The annual fee comes round each twelfth month, with the month's.
    const due = taxed(s, g, t.monthly + (month % 12 === 0 ? (t.annual ?? 0) : 0));
    if (!payFromBank(s, person, due, `${g.name}, the month`, 'personal')) owe(s, person, due, `${g.name}, the month`, 'personal');
    s.schedule({ at: item.at + YEAR_MS / 12, kind: GYM_MONTH_KIND, label: `${g.name}, The Month`, category: 'personal', priority: 30, payload: { personId: person.id, gymId: g.id, month: month + 1 } });
  });
}
