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
 * **Leaving** follows the gym's own terms where it published them (from
 * 2026-10-05, `LeaveTerms` in `content/gyms.ts`): notice given, the
 * membership runs and bills until it ends, then ends; a buy-out ends a term
 * at once; a cancellation fee is paid; and inside a money-back window what
 * joining paid comes back. Until then every gym was left at once, and only
 * a term's months were paid. Where a gym published nothing, leaving inside
 * a minimum term pays the months left of it after any notice, SLATE's
 * reading of a term contract.
 *
 * **What it does.** A workout in a member's gym, in its town and while it's
 * open, builds what a gym builds (`trainingAt` in `systems/dwelling.ts`),
 * and one with a pool can be swum in.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { GYM_TAX, GYMS, gymById, type Gym, type GymTier } from '../content/gyms';
import { shutAt } from './errands';
import { owe, payFromBank, refundToBank } from './household';

export const GYM_MONTH_KIND = 'gym.month';
/** The day notice given ends a membership (from 2026-10-05). */
export const GYM_END_KIND = 'gym.end';
const YEAR_MS = 365.2425 * MS_DAY;
const MONTH_MS = YEAR_MS / 12;

export interface Membership {
  gymId: string; tier: string; since: Instant; termEnds?: Instant;
  /** What joining paid (from 2026-10-05): given back inside a money-back window. */
  paid?: Money;
  /** Notice given: when it ends. */
  endsAt?: Instant;
}

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
  if (person.gym?.endsAt !== undefined) return `You’re a member of ${gymById(person.gym.gymId)?.name ?? 'a gym'} until ${formatDate(person.gym.endsAt, sim.zone)}.`;
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

/** When notice given at a moment ends a membership, by its gym's terms: at once where it published none. */
export function noticeEnds(g: Gym, t: GymTier, at: Instant): Instant {
  const n = t.leave?.notice;
  if (!n) return at;
  const zone = CITIES.require(g.cityId).timeZone;
  if (n === 'calendar-month') {
    // Asked by the 1st, it ends with that month; after it, with the next.
    const p = zonedParts(at, zone);
    const ahead = p.month - 1 + (p.day === 1 ? 1 : 2);
    return instantFromZoned({ year: p.year + Math.floor(ahead / 12), month: (ahead % 12) + 1, day: 1, hour: 0, minute: 0 }, zone);
  }
  if (!n.business) return at + n.days * MS_DAY;
  // Business days: Monday to Friday, holidays not kept.
  let end = at;
  for (let left = n.days; left > 0;) {
    end += MS_DAY;
    const p = zonedParts(end, zone);
    const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
    if (weekday !== 0 && weekday !== 6) left -= 1;
  }
  return end;
}

/** What leaving now does: when it ends, what's paid to leave, what comes back, and why. */
export function leavingTerms(sim: Simulation, person: Person): { endsAt: Instant; pay: Money; back: Money; why: string; memo: string } | undefined {
  const m = person.gym;
  const g = m && gymById(m.gymId);
  const t = g && tierOf(g, m.tier);
  if (!m || !g || !t) return undefined;
  const terms = t.leave;
  if (terms?.refundDays !== undefined && m.paid !== undefined && sim.now - m.since <= terms.refundDays * MS_DAY) {
    return { endsAt: sim.now, pay: 0, back: m.paid, why: `Within ${terms.refundDays} days of joining, what joining paid comes back.`, memo: `${g.name}, money back` };
  }
  const inTerm = m.termEnds !== undefined && m.termEnds > sim.now;
  if (inTerm && terms?.buyOut !== undefined) return { endsAt: sim.now, pay: inSave(sim, terms.buyOut, g.currency), back: 0, why: 'The buy-out ends the term at once.', memo: `${g.name}, the buy-out` };
  const endsAt = noticeEnds(g, t, sim.now);
  const fee = terms?.fee !== undefined ? inSave(sim, terms.fee, g.currency) : 0;
  // A term's months left after the notice, where no buy-out was published: SLATE's reading of a term contract.
  const months = inTerm && m.termEnds! > endsAt ? taxed(sim, g, Math.ceil((m.termEnds! - endsAt) / MONTH_MS) * t.monthly) : 0;
  const zone = CITIES.require(g.cityId).timeZone;
  return {
    endsAt, pay: fee + months, back: 0,
    why: endsAt > sim.now ? `Notice: it ends ${formatDate(endsAt, zone)}, the months due before then paid.` : 'It ends at once.',
    memo: months > 0 ? `${g.name}, the rest of the term` : `${g.name}, the cancellation fee`,
  };
}

/** What leaving costs now: a buy-out or a fee where the gym published one, else a minimum term's months left. */
export function leavingCost(sim: Simulation, person: Person): Money {
  return leavingTerms(sim, person)?.pay ?? 0;
}

function endMembership(sim: Simulation, person: Person): void {
  delete person.gym;
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && (item.kind === GYM_MONTH_KIND || item.kind === GYM_END_KIND) && item.payload.personId === person.id) sim.timeline.cancel(item.id, sim.now);
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
    person.gym = { gymId: g.id, tier: t.name, since: s.now, paid: cost, ...(t.termMonths ? { termEnds: s.now + t.termMonths * (YEAR_MS / 12) } : {}) };
    s.schedule({ at: s.now + YEAR_MS / 12, kind: GYM_MONTH_KIND, label: `${g.name}, The Month`, category: 'personal', priority: 30, payload: { personId: person.id, gymId: g.id, month: 1 } });
    return { paid: cost };
  });

  // Leaving: notice given where the gym asks for it, its buy-out or fee paid, or its money back (from 2026-10-05).
  sim.onCommand<Record<string, never>, { paid: Money; back: Money; endsAt: Instant }>('gym.leave', (_p, { sim: s }) => {
    const person = s.player;
    if (!person.gym) throw new CommandError('You aren’t a member of a gym.');
    const g = gymById(person.gym.gymId)!;
    if (person.gym.endsAt !== undefined) throw new CommandError(`You’ve given notice: it ends ${formatDate(person.gym.endsAt, CITIES.require(g.cityId).timeZone)}.`);
    const l = leavingTerms(s, person)!;
    if (l.pay > 0 && !payFromBank(s, person, l.pay, l.memo, 'personal')) owe(s, person, l.pay, l.memo, 'personal');
    if (l.back > 0) refundToBank(s, person, l.back, l.memo, 'personal');
    if (l.endsAt <= s.now) endMembership(s, person);
    else {
      person.gym.endsAt = l.endsAt;
      s.schedule({ at: l.endsAt, kind: GYM_END_KIND, label: `${g.name} Ends`, category: 'personal', priority: 30, payload: { personId: person.id, gymId: g.id } });
    }
    return { paid: l.pay, back: l.back, endsAt: l.endsAt };
  });

  sim.onSchedule(GYM_END_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person?.gym || person.gym.gymId !== item.payload.gymId || person.gym.endsAt === undefined) return;
    endMembership(s, person);
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'Your Gym Membership Has Ended', body: `${gymById(String(item.payload.gymId))?.name ?? 'The gym'}: the notice you gave is up.`, importance: 25, route: '/workspace/routines' });
  });

  sim.onSchedule(GYM_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const m = person?.gym;
    if (!person || !m || m.gymId !== item.payload.gymId) return;
    // Notice given: a month due on or after the day it ends isn't charged.
    if (m.endsAt !== undefined && item.at >= m.endsAt) return;
    const g = gymById(m.gymId)!;
    const t = tierOf(g, m.tier)!;
    const month = Number(item.payload.month);
    // The annual fee comes round each twelfth month, with the month's.
    const due = taxed(s, g, t.monthly + (month % 12 === 0 ? (t.annual ?? 0) : 0));
    if (!payFromBank(s, person, due, `${g.name}, the month`, 'personal')) owe(s, person, due, `${g.name}, the month`, 'personal');
    s.schedule({ at: item.at + YEAR_MS / 12, kind: GYM_MONTH_KIND, label: `${g.name}, The Month`, category: 'personal', priority: 30, payload: { personId: person.id, gymId: g.id, month: month + 1 } });
  });
}
