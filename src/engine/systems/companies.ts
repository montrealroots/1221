/**
 * SLATE — a professional production and the parts in it (from 2026-10-08;
 * `systems/career.ts` keeps the booking, the days, the pay and the credit).
 *
 * **One production a job.** When the player takes a job, the production it
 * is gets an identity of its own (`Production`): its title, town, dates, and
 * the parts in it (`Slot`), each with its size, what it's cast on, who plays
 * it and its dates. The player's booking is the player's part, and
 * only the player's is paid to the player; nothing here pays anybody.
 *
 * **The other parts.** A stage play casts its company (three more parts, an
 * understudy among them where it runs); a screen job its guest cast (two); a
 * booth session is the actor alone. Each part goes to a former classmate now
 * and then (`COMPANY.chance`), where their craft carries the part's level
 * (within ten of its bar, a featured part five more), they're signed or live
 * in the town, and they aren't holding a part in another production then, nor
 * another part in this one; otherwise to a company actor, who is a part's
 * performer and not a person SLATE invents. A classmate asked who's on
 * another job is remembered as having been (the production's history). How
 * you get on with them decides none of it.
 *
 * **Shared days, not shared names.** A day worked counts toward knowing a
 * classmate in the cast only where you worked together that day: every day of
 * a stage run (one company, one room), and on screen the days your scenes
 * met, more often the bigger their part (`COMPANY.sharedOnScreen`). Each such
 * day is two hours toward knowing each other and half a point of bond, and the
 * first and the last are remembered. Until 2026-10-08 a classmate in the job
 * was credited with the player's own part, and the whole job's hours came at
 * its end whatever was shared.
 *
 * **Your part, learned** (`career.learn_part`, from 2026-10-08): an hour of
 * the actor's own on a booked part moves its lines a share of what's left
 * (`PART`, as the school's `PROCESS.own`), and trains no craft: knowing this
 * part isn't growing as an actor. Each day worked reads it: the reputation a
 * day earns rises with the lines known (to two and a half times a day's,
 * known cold), and the first day says on the job whether you came in off
 * book. A booth's copy is read there, not learned. Unlearned, a day earns
 * what it did before. Until then nothing about a professional part was the
 * actor's own work beyond turning up.
 *
 * **Changes.** The player replaced or recast: their part goes to a company
 * actor and the history keeps who played it before, and the work done stays
 * paid and credited as before. Credits name the production and the part.
 *
 * Every number here is SLATE's estimate.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import type { Role } from '../content/career';
import { CITIES } from '../content/geography';
import { CommandError } from '../core/simulation';
import { formatTime } from '../core/time';
import { occupiedAt } from './life';
import { exerts } from './body';
import { contactsOf } from './people';
import { BONDS, bondMove, focusOf, type Craft } from './school';

export type SlotSize = 'principal' | 'supporting' | 'featured' | 'understudy';
export type Performer = { kind: 'player' } | { kind: 'classmate'; i: number } | { kind: 'company' };
export interface Slot {
  id: string;
  part: string;
  size: SlotSize;
  status: 'cast' | 'replaced';
  performer: Performer;
  from: Instant;
  until: Instant;
  /** Days worked side by side with the player. */
  shared: number;
}
/** A production; its history, who was asked and who was replaced, is shown on the job (Career, Work). */
export interface Production { id: string; bookingId: string; title: string; medium: Role['medium']; slots: Slot[]; history: { at: Instant; what: string }[]; /** The player's part's lines known, 0 to 1. */ lines?: number }

export const COMPANY = {
  /** The other parts a production casts, by medium. */
  others: { stage: ['supporting', 'featured', 'understudy'], screen: ['supporting', 'featured'], voice: [] } as Record<Role['medium'], SlotSize[]>,
  /** A part going to a former classmate who fits it. */
  chance: 0.08,
  /** How far below the part's bar their read may be, by size. */
  below: { principal: 5, supporting: 10, featured: 15, understudy: 10 } as Record<SlotSize, number>,
  /** On screen, the share of days a part's scenes meet the player's. */
  sharedOnScreen: { principal: 0.8, supporting: 0.5, featured: 0.3, understudy: 0 } as Record<SlotSize, number>,
  /** A day side by side: hours toward knowing each other, and bond. */
  hoursPerDay: 2, bondPerDay: 0.5,
  /** Productions kept on the record. */
  kept: 60,
} as const;

const PART_WORDS: Record<SlotSize, string> = { principal: 'Your Part', supporting: 'A Supporting Part', featured: 'A Featured Part', understudy: 'An Understudy' };

export const productionsOf = (person: Person): Production[] => ((person.career as { productions?: Production[] } | undefined) ? ((person.career as { productions?: Production[] }).productions ??= []) : []);
export const productionOf = (person: Person, bookingId: string): Production | undefined => productionsOf(person).find((p) => p.bookingId === bookingId);

/** Whether a classmate holds a part in any production over these dates. */
function heldBetween(person: Person, i: number, from: Instant, until: Instant): Production | undefined {
  return productionsOf(person).find((p) => p.slots.some((s) => s.status === 'cast' && s.performer.kind === 'classmate' && s.performer.i === i && s.from <= until && s.until >= from));
}

/**
 * A production made for a job taken: its parts, the player's and the others,
 * each other part cast as above. `read` is how a classmate reads for the role (`auditionLevel`, from
 * `systems/rivals.ts`), `booked` records a classmate's credit. A booking is
 * taken once (`career.accept`, or a series picked up as a booking of its own).
 */
export function makeProduction(sim: Simulation, person: Person, booking: { id: string; roleId: string }, role: Role, cityId: string, from: Instant, until: Instant,
  read: (craft: Craft) => number, booked: (i: number) => void): Production {
  const year = new Date(from).getUTCFullYear();
  const p: Production = {
    id: `prod-${booking.id}`, bookingId: booking.id, title: `${role.label}, ${CITIES.require(cityId).name} ${year}`, medium: role.medium, history: [],
    slots: [{ id: `${booking.id}-0`, part: PART_WORDS.principal, size: 'principal', status: 'cast', performer: { kind: 'player' }, from, until, shared: 0 }],
  };
  const school = person.school;
  const rng = sim.rng('career.company', person.id, `company-${booking.id}`);
  const inThis = new Set<number>();
  COMPANY.others[role.medium].forEach((size, k) => {
    const slot: Slot = { id: `${booking.id}-${k + 1}`, part: PART_WORDS[size], size, status: 'cast', performer: { kind: 'company' }, from, until, shared: 0 };
    const draw = rng.next();
    const order = rng.next();
    if (school?.standing === 'graduated' && draw < COMPANY.chance) {
      const fit = school.classmates.map((m, i) => ({ m, i })).filter(({ m, i }) => {
        if (!m.career || inThis.has(i)) return false;
        if (read(m.craft) < role.bar - COMPANY.below[size]) return false;
        const c = contactsOf(person).find((x) => x.classmate === i);
        return Boolean(m.career.agencyId) || c?.cityId === cityId;
      });
      if (fit.length) {
        const pick = fit[Math.floor(order * fit.length)]!;
        const busy = heldBetween(person, pick.i, from, until)?.title ?? ((pick.m.career!.busyUntil ?? 0) > from ? 'another job' : undefined);
        if (busy) p.history.push({ at: sim.now, what: `${pick.m.name} was asked for ${slot.part.toLowerCase()}, and was on ${busy} then` });
        else {
          slot.performer = { kind: 'classmate', i: pick.i };
          inThis.add(pick.i);
          pick.m.career!.busyUntil = Math.max(pick.m.career!.busyUntil ?? 0, until);
          booked(pick.i);
          const c = contactsOf(person).find((x) => x.classmate === pick.i);
          c?.memory.unshift({ at: sim.now, what: `Cast in ${p.title} with you, ${slot.part.toLowerCase()}` });
          if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title: `${pick.m.name.split(' ')[0]} Is In It Too`, body: `${pick.m.name}, from your class at Yale, is cast in ${p.title}: ${slot.part.toLowerCase()}.`, importance: 45, route: '/workspace/career' });
        }
      }
    }
    p.slots.push(slot);
  });
  const all = productionsOf(person);
  all.push(p);
  if (all.length > COMPANY.kept) all.splice(0, all.length - COMPANY.kept);
  return p;
}

/** Learning a booked part: an hour, a share of what's left; off book from `offBook`; the day's reputation times up to `1 + reputation`. SLATE's estimates. */
export const PART = { minutes: 60, gain: 0.3, offBook: 0.8, reputation: 1.5 } as const;

/** Why the part can't be worked on now, or nothing. */
export function learnPartRefusal(sim: Simulation, person: Person, bookingId: string): string | undefined {
  const booking = person.career?.bookings.find((b) => b.id === bookingId);
  const p = productionOf(person, bookingId);
  if (!booking || booking.status !== 'accepted' || !p) return 'That isn’t a job you’re booked for.';
  if (p.medium === 'voice') return 'A booth’s copy is read there, not learned.';
  if ((p.lines ?? 0) >= 0.97) return 'You know it cold.';
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  return undefined;
}

/** The lines a production's part is known by, and, on its first day, the production's word on it. */
export function partOnTheDay(sim: Simulation, person: Person, bookingId: string, first: boolean): number {
  const p = productionOf(person, bookingId);
  if (!p) return 0;
  const lines = p.lines ?? 0;
  if (first && p.medium !== 'voice') p.history.push({ at: sim.now, what: lines >= PART.offBook ? 'You came in off book' : `You came in on book, ${Math.round(lines * 100)}% of your lines known` });
  return lines;
}

export function registerCompanies(sim: Simulation): void {
  sim.onCommand<{ bookingId: string }, { lines: number }>('career.learn_part', (q, { sim: s }) => {
    const person = s.player;
    const id = String(q?.bookingId);
    const no = learnPartRefusal(s, person, id);
    if (no) throw new CommandError(no);
    const p = productionOf(person, id)!;
    const focus = focusOf(person);
    s.advanceTo(s.now + PART.minutes * 60_000);
    exerts(person, 1.5, PART.minutes / 60);
    const before = p.lines ?? 0;
    p.lines = Math.min(1, before + PART.gain * Math.min(1.1, Math.max(0.5, focus)) * (1 - before));
    return { lines: p.lines };
  });
}

/**
 * A day the player worked on a production: each classmate in the cast who
 * shared it (every stage day; on screen by their part's share, drawn for
 * the day) is two hours nearer and half a point closer, the first and last
 * remembered. Returns the classmates who shared it.
 */
export function workedDay(sim: Simulation, person: Person, bookingId: string, day: number, last: boolean): number[] {
  const p = productionOf(person, bookingId);
  if (!p) return [];
  const out: number[] = [];
  for (const slot of p.slots) {
    if (slot.status !== 'cast' || slot.performer.kind !== 'classmate') continue;
    const together = p.medium === 'stage' || sim.rng('career.company', person.id, `shared-${slot.id}-${day}`).next() < COMPANY.sharedOnScreen[slot.size];
    const i = slot.performer.i;
    const c = contactsOf(person).find((x) => x.classmate === i);
    const m = person.school?.classmates[i];
    if (together) {
      slot.shared += 1;
      out.push(i);
      if (c) { c.hours += COMPANY.hoursPerDay; c.lastSeen = sim.now; }
      if (m) m.bond = Math.max(-100, Math.min(100, (m.bond ?? 0) + bondMove(person, COMPANY.bondPerDay)));
      if (c && slot.shared === 1) c.memory.unshift({ at: sim.now, what: `First day working together on ${p.title}` });
      if (c && m && (m.bond ?? 0) > BONDS.rival + 10) delete c.rival;
    }
    // The job's end remembered by everybody who shared any of it, whether or not they shared the last day.
    if (c && last && slot.shared > 0) c.memory.unshift({ at: sim.now, what: `Worked together on ${p.title}, ${slot.shared} ${slot.shared === 1 ? 'day' : 'days'} side by side` });
  }
  return out;
}

/** The player's part, replaced (fired or recast): a company actor plays it from now, and the history keeps who did before. */
export function playerReplaced(sim: Simulation, person: Person, bookingId: string, why: string): void {
  const p = productionOf(person, bookingId);
  const slot = p?.slots.find((s) => s.performer.kind === 'player' && s.status === 'cast');
  if (!p || !slot) return;
  slot.status = 'replaced';
  p.slots.push({ ...slot, id: `${slot.id}-r`, status: 'cast', performer: { kind: 'company' }, from: sim.now, shared: 0 });
  p.history.push({ at: sim.now, what: `Your part recast: ${why}` });
}
