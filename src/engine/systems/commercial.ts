/**
 * SLATE — a commercial agent, beside the theatrical one.
 *
 * Actors often have two agents: a theatrical one for film, television and
 * the stage, and a commercial one for on-camera and voice-over commercials.
 * A commercial agent sends commercial auditions and takes the same 10% of
 * them. Its contract is the union's commercials contract, and leaving it
 * follows the commercials rule, not the theatrical one: with no bona fide
 * commercial offer in its first 120 days, or, from its 151st, whenever the
 * last 91 days brought less than $4,000 from commercials, residuals included
 * (SAG-AFTRA, "Can I terminate my agency contract early?"). Where both
 * contracts are signed with one agency the theatrical rules apply, which is
 * why SLATE's single contract kept them until 2026-09-28.
 *
 * The agencies are real ones with commercial departments in New York and Los
 * Angeles. What each needs to see (presence, and a record), how many
 * auditions a week each sends, and a first contract's year with a renewal to
 * a client it booked are SLATE's estimate.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { saveCurrency, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { ROLES, type CareerCity } from '../content/career';
import { attributesOf } from './attributes';
import { AUDITION_KIND, careerOf, genreOf, nextOwnId, roleById, workCity, type Audition } from './career';

export interface CommercialAgency { id: string; name: string; cities: readonly CareerCity[]; bar: number; auditionsPerWeek: number }

export const COMMERCIAL_AGENCIES: readonly CommercialAgency[] = [
  { id: 'cesd', name: 'CESD Talent', cities: ['us-ny-newyork', 'us-ca-losangeles'], bar: 72, auditionsPerWeek: 2 },
  { id: 'ddo', name: 'DDO Artists', cities: ['us-ca-losangeles'], bar: 68, auditionsPerWeek: 1.5 },
  { id: 'abrams', name: 'Abrams Artists Agency', cities: ['us-ny-newyork', 'us-ca-losangeles'], bar: 65, auditionsPerWeek: 1.5 },
];

/** The union's commercials rule for leaving, and a first contract's term (SLATE's estimate, as the theatrical one). */
export const COMMERCIAL_LEAVING = { firstDays: 120, initialDays: 151, windowDays: 91, floor: 4_000_00, termYears: 1, renewalYears: 3, source: 'https://servicesagaftra.custhelp.com/app/answers/detail/a_id/2360' } as const;

export interface CommercialRep { agencyId: string; cityId: CareerCity; signedAt: Instant; termEnds: Instant; initial: boolean }

export const commercialAgencyById = (id: string) => COMMERCIAL_AGENCIES.find((a) => a.id === id);

const zoneOf = (cityId: string) => CITIES.require(cityId).timeZone;
const usd = (sim: Simulation, cents: Money) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? cents : exchange(cents, 'USD', cur) ?? cents; };

/** How a commercial agent reads an actor: presence mostly, and the record, 0 to 100. */
export function commercialRead(sim: Simulation, person: Person): number {
  const a = attributesOf(sim, person);
  return 0.7 * a.presence + 0.3 * a.reputation;
}

/** Commercial earnings in a window before now: sessions and residuals both. */
export function commercialEarnings(sim: Simulation, person: Person, days: number): Money {
  const from = sim.now - days * MS_DAY;
  return (careerOf(person).commercialPay ?? []).filter((p) => p.at >= from && p.at <= sim.now).reduce((sum, p) => sum + p.amount, 0);
}

/** A commercial paycheck or residual, on the record the rule reads. */
export function recordCommercialPay(person: Person, at: Instant, amount: Money): void {
  const career = careerOf(person);
  career.commercialPay = [...(career.commercialPay ?? []), { at, amount }].slice(-200);
}

/** Whether they may leave their commercial agent now, and why not if not. */
export function mayLeaveCommercial(sim: Simulation, person: Person): { ok: boolean; why: string } {
  const rep = careerOf(person).commercial;
  if (!rep) return { ok: false, why: 'You have no commercial agent.' };
  const L = COMMERCIAL_LEAVING;
  const since = sim.now - rep.signedAt;
  const offered = careerOf(person).bookings.some((b) => b.offeredAt >= rep.signedAt && roleById(b.roleId).after?.kind === 'commercial');
  if (rep.initial && since < L.initialDays * MS_DAY) {
    return !offered && since >= L.firstDays * MS_DAY
      ? { ok: true, why: `No commercial offer in the first ${L.firstDays} days.` }
      : { ok: false, why: `In a first commercial contract’s first ${L.initialDays} days, you may leave only after ${L.firstDays} with no commercial offer.` };
  }
  const earned = commercialEarnings(sim, person, L.windowDays);
  return earned < usd(sim, L.floor)
    ? { ok: true, why: `Under the commercials floor in the last ${L.windowDays} days.` }
    : { ok: false, why: `Your commercials earned the floor or more in the last ${L.windowDays} days, and the contract holds.` };
}

/** Why a commercial agency won't meet or sign them now, or nothing if it will. */
export function commercialRefusal(sim: Simulation, person: Person, agencyId: string): string | undefined {
  const career = careerOf(person);
  const agency = commercialAgencyById(agencyId);
  if (!agency) return 'No such agency.';
  if (career.since === undefined) return 'Commercial agents take clients out of school.';
  if (career.commercial) return `You’re with ${commercialAgencyById(career.commercial.agencyId)!.name} for commercials.`;
  if (!agency.cities.includes(workCity(person))) return `${agency.name} has no commercial office where you work.`;
  if ((career.commercialMet ?? {})[agencyId] !== undefined && sim.now - career.commercialMet![agencyId]! < 180 * MS_DAY) return `${agency.name} met you in the last six months.`;
  return undefined;
}

/** A week of commercial auditions from the commercial agent: a Poisson count by its reach. */
export function commercialWeek(sim: Simulation, person: Person, weekStart: Instant): Omit<Audition, 'id' | 'status'>[] {
  const rep = careerOf(person).commercial;
  const agency = rep ? commercialAgencyById(rep.agencyId) : undefined;
  if (!rep || !agency) return [];
  const rng = sim.rng('career.auditions', person.id, `commercial-${weekStart}`);
  let n = 0;
  for (let p = rng.next(), limit = Math.exp(-agency.auditionsPerWeek); p > limit; p *= rng.next()) n += 1;
  const open = ROLES.filter((r) => r.after?.kind === 'commercial' && r.cities.includes(rep.cityId));
  const zone = zoneOf(rep.cityId);
  const out: Omit<Audition, 'id' | 'status'>[] = [];
  for (let k = 0; k < n && open.length; k += 1) {
    const role = open[Math.floor(rng.next() * open.length)]!;
    const day = Math.floor(rng.next() * 5);
    const p = zonedParts(weekStart, zone);
    const when = instantFromZoned({ year: p.year, month: p.month, day: p.day + day, hour: 10 + Math.floor(rng.next() * 7) }, zone);
    out.push({ roleId: role.id, at: when, mode: 'room', cityId: rep.cityId, via: 'commercial' });
  }
  return out;
}

/** The commercial agent's week put on the calendar, as the theatrical agency's is. */
export function scheduleCommercialWeek(sim: Simulation, person: Person, weekStart: Instant): void {
  const career = careerOf(person);
  for (const one of commercialWeek(sim, person, weekStart)) {
    const audition: Audition = { ...one, id: nextOwnId(career, 'a'), status: 'ahead', ...genreOf(roleById(one.roleId), 0) };
    career.auditions.push(audition);
    sim.schedule({ at: audition.at, kind: AUDITION_KIND, label: `Audition: ${roleById(audition.roleId).label}`, category: 'career', priority: 30, requiresPlayer: true, durationMinutes: 60, locationId: audition.cityId, payload: { personId: person.id, auditionId: audition.id } });
  }
}

/** A commercial contract's end: renewed for three years if the agent booked them a commercial in it, or over. */
export function commercialTermEnds(sim: Simulation, person: Person): void {
  const career = careerOf(person);
  const rep = career.commercial;
  if (!rep || sim.now < rep.termEnds) return;
  const booked = career.bookings.some((b) => b.offeredAt >= rep.signedAt && roleById(b.roleId).after?.kind === 'commercial' && (b.status === 'accepted' || b.status === 'worked'));
  const name = commercialAgencyById(rep.agencyId)!.name;
  if (booked) {
    rep.signedAt = rep.termEnds;
    rep.termEnds = rep.termEnds + COMMERCIAL_LEAVING.renewalYears * 365.25 * MS_DAY;
    rep.initial = false;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title: `${name} Renews For Commercials`, body: `Your commercial contract with ${name} renews for ${COMMERCIAL_LEAVING.renewalYears} years.`, importance: 55, route: '/workspace/career' });
    return;
  }
  delete career.commercial;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title: `${name} Let The Commercial Contract Run Out`, body: 'With no commercial booked in its year, the contract ended.', importance: 60, route: '/workspace/career' });
}

export function registerCommercial(sim: Simulation): void {
  // A meeting with a commercial agency: it signs an actor whose read clears its bar (`career.commercial`).
  sim.onCommand<{ agencyId: string }, { signed: boolean }>('career.commercial_meet', (p, { sim: s }) => {
    const person = s.player;
    const no = commercialRefusal(s, person, p.agencyId);
    if (no) throw new CommandError(no);
    const career = careerOf(person);
    const agency = commercialAgencyById(p.agencyId)!;
    (career.commercialMet ??= {})[agency.id] = s.now;
    const read = commercialRead(s, person) + 10 * (s.rng('career.commercial', person.id, `${agency.id}-${s.now}`).next() - 0.5);
    if (read < agency.bar) {
      s.notify({ category: 'career', title: `${agency.name} Passed`, body: `You met ${agency.name}’s commercial department, and they didn’t sign you. They’ll see you again in six months.`, importance: 55, route: '/workspace/career' });
      return { signed: false };
    }
    const cityId = workCity(person);
    career.commercial = { agencyId: agency.id, cityId, signedAt: s.now, termEnds: s.now + COMMERCIAL_LEAVING.termYears * 365.25 * MS_DAY, initial: true };
    s.notify({ category: 'career', title: `Signed With ${agency.name} For Commercials`, body: `${agency.name} will send you commercial auditions from its ${CITIES.require(cityId).name} office, for 10% of what they book.`, importance: 70, route: '/workspace/career' });
    return { signed: true };
  });

  sim.onCommand<Record<string, never>, { left: string }>('career.commercial_leave', (_p, { sim: s }) => {
    const person = s.player;
    const may = mayLeaveCommercial(s, person);
    if (!may.ok) throw new CommandError(may.why);
    const name = commercialAgencyById(careerOf(person).commercial!.agencyId)!.name;
    delete careerOf(person).commercial;
    return { left: name };
  });
}
