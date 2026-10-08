/**
 * SLATE — a production's schedule changed after casting (from 2026-10-08), on
 * the job's own calls, pay, travel and production (`systems/career.ts`,
 * `systems/companies.ts`). Until then a job's calls were fixed the day it was
 * taken.
 *
 * **The production proposes.** Now and then (`SCHEDULE.chance`, drawn when
 * the job is taken: `career.schedule`) a production changes its plans, and
 * says so ahead of time, with what changes and why, the dates and the cast
 * affected, any clash with what the player has on, and what it costs or pays:
 * - **postpone** the start, or the calls left, by a week or two. The player
 *   answers by a date. Refused or unanswered, they're released, and paid as a
 *   cancellation: on stage LORT's two weeks' salary, four within four weeks
 *   of the start (Equity LORT); on screen, the booked days not worked, a firm
 *   booking being the producer's to pay (SLATE's estimate: SAG-AFTRA's text
 *   wasn't found);
 * - **move a call's time**, on notice; answered only where it clashes. One
 *   that leaves less than twelve hours' rest after the call before is a
 *   forced call, paid the lesser of the day's rate and $900 (SAG-AFTRA);
 * - **add a day**, paid, on screen: the player's to take or not;
 * - **cut the calls left**, on notice: on stage a closing on two weeks'
 *   notice, a shorter notice paid out (LORT); on screen the days cut, paid
 *   (SLATE's estimate).
 * The player may ask, once a screen job, to move one call to the day after
 * its last; the production answers the next day. A run's performances don't
 * move for one actor.
 *
 * **Nothing double-booked.** A change is taken only with nothing the player
 * has on in its way: a call, a plan, a meeting, another job, a journey of
 * their own elsewhere. Said so, and they call it off or refuse. The confirmed
 * calls stand until a change takes effect; then the calls superseded are
 * canceled, and a call no longer in the job's calls does nothing if one
 * fires (`Booking.calls`). What's worked stays worked and paid; the lines
 * learned and the days side by side stay. The production's own travel moves
 * with it; a room already taken isn't refunded or extended for them: they're
 * told, and arrange it. A classmate cast who can't make the new dates
 * withdraws, and a company actor takes the part.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { saveCurrency } from '../core/money';
import { MS_DAY, MS_HOUR, formatDate, formatTime, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { PAY_KIND, STAY_KIND, TRAVEL_KIND, WORK_KIND, careerOf, finishJob, paydaysFor, roleById, schedulePay, sendHome, unitRate, usd, workCityOf, workDays, workMinutes, type Booking } from './career';
import { playerReplaced, productionOf, productionsOf, type Production } from './companies';
import { journeysOf, whereBy } from './journey';

export type ChangeKind = 'postpone' | 'postpone_rest' | 'call_time' | 'add_day' | 'cut_rest' | 'request';
type Call = { at: Instant; week: number; rehearsal: boolean };
export interface Proposal {
  id: string;
  kind: ChangeKind;
  reason: string;
  made: Instant;
  dueAt: Instant;
  /** The calls as they'd be: the worked ones as they were. */
  to: Call[];
  /** The calls it moves, adds or cuts, by their old time (an added one by its new). */
  affected: Instant[];
  conflicts: string[];
  consequences: string;
  mustRespond: boolean;
  status: 'pending' | 'applied' | 'refused' | 'withdrawn' | 'expired';
  closedAt?: Instant;
}

export const SCHEDULE = {
  /** A job whose production changes its schedule. SLATE's estimate. */
  chance: 0.12,
  weights: { postpone: 3, postpone_rest: 2, call_time: 3, add_day: 2, cut_rest: 1 } as Record<Exclude<ChangeKind, 'request'>, number>,
  answerDays: 3, noticeDays: 2,
  postponeDays: [7, 14] as const,
  callHours: [-2, 2, 3] as const,
  /** SAG-AFTRA: twelve hours' rest between calls; a forced call paid the lesser of the day's rate and $900. */
  restHours: 12, forcedCallUsd: 900_00,
  /** Equity LORT: a production canceled pays two weeks' salary, four within four weeks of the start; a closing, two weeks' notice. */
  lort: { earlyWeeks: 2, lateWeeks: 4, lateWithinDays: 28, closingNoticeDays: 14 },
  /** A request to move a call, granted at these odds where nothing's in the way. SLATE's estimate. */
  requestYes: 0.5,
  source: 'research-agency-change-and-scheduling.json: SAG-AFTRA rest periods and forced calls; Equity LORT cancellation and closing notice. Pay for a firm screen booking canceled is SLATE’s estimate.',
} as const;

export const SCHEDULE_KIND = 'career.schedule_change';
export const SCHEDULE_DUE_KIND = 'career.schedule_due';
export const SCHEDULE_REPLY_KIND = 'career.schedule_reply';

const REASONS: Record<ChangeKind, readonly string[]> = {
  postpone: ['the director’s other commitment ran over', 'a lead’s availability changed', 'the money came through later than planned'],
  postpone_rest: ['a lead fell ill', 'the set wasn’t ready', 'a location fell through'],
  call_time: ['the light', 'a location’s permit', 'the scene order changed'],
  add_day: ['a scene needed another day', 'weather lost a day', 'the director wants a pickup'],
  cut_rest: ['the producers cut the schedule', 'ticket sales were slow', 'the budget was cut'],
  request: ['you asked'],
};

const eligible = (booking: Booking) => { const role = roleById(booking.roleId); return !role.series && role.medium !== 'voice' && role.after?.kind !== 'commercial'; };

/** Whether this job's production will change its schedule, which way, and when it says so (`career.schedule`). */
export function changeFor(sim: Simulation, person: Person, booking: Booking): { kind: Exclude<ChangeKind, 'request'>; x: number } | undefined {
  if (!eligible(booking)) return undefined;
  const rng = sim.rng('career.schedule', person.id, booking.id);
  if (rng.next() >= SCHEDULE.chance) return undefined;
  const screen = roleById(booking.roleId).medium === 'screen';
  const kinds = (Object.keys(SCHEDULE.weights) as Exclude<ChangeKind, 'request'>[]).filter((k) => k !== 'add_day' || screen);
  let left = rng.next() * kinds.reduce((n, k) => n + SCHEDULE.weights[k], 0);
  const kind = kinds.find((k) => (left -= SCHEDULE.weights[k]) <= 0) ?? kinds.at(-1)!;
  return { kind, x: rng.next() };
}

/** At a job's taking: its change, if it has one, put on the calendar for when the production says so. */
export function planChange(sim: Simulation, person: Person, booking: Booking): void {
  const change = changeFor(sim, person, booking);
  if (!change) return;
  const calls = workDays(booking);
  const first = calls[0]!.at;
  const when = change.kind === 'postpone' ? Math.max(sim.now + MS_HOUR, first - 10 * MS_DAY) : calls[Math.min(calls.length - 1, Math.floor(calls.length * 0.4))]!.at - 3 * MS_DAY;
  if (when >= first - 2 * MS_HOUR && change.kind === 'postpone') return;
  sim.schedule({ at: Math.max(sim.now + MS_HOUR, when), kind: SCHEDULE_KIND, label: 'A Schedule Change', category: 'system', priority: 20, payload: { personId: person.id, bookingId: booking.id, change: change.kind, x: change.x } });
}

const done = (b: Booking) => b.worked + (b.missedNights ?? 0);
const proposalsOf = (p: Production): Proposal[] => ((p as Production & { proposals?: Proposal[] }).proposals ??= []);
export const proposalsFor = (person: Person, bookingId: string): Proposal[] => { const p = productionOf(person, bookingId); return p ? proposalsOf(p) : []; };

/** What's in the way of these calls: anything the player has on then, or a journey of theirs elsewhere. */
export function conflictsFor(sim: Simulation, person: Person, booking: Booking, to: readonly Call[], old: readonly Call[]): string[] {
  const role = roleById(booking.roleId);
  const city = workCityOf(booking);
  const before = new Set(old.map((c) => c.at));
  const out: string[] = [];
  for (const c of to) {
    if (before.has(c.at) || c.at <= sim.now) continue;
    const ends = c.at + workMinutes(role, c.rehearsal) * 60_000;
    for (const x of sim.universe.scheduled) {
      if (x.status !== 'pending' || !x.requiresPlayer || !x.durationMinutes || x.payload.bookingId === booking.id) continue;
      if (x.at < ends && x.at + x.durationMinutes * 60_000 > c.at) out.push(`${x.label}, ${formatDate(x.at, sim.zone)} at ${formatTime(x.at, sim.zone)}`);
    }
    // A journey of their own (not a job's) that has them elsewhere then, or leaves while the call's on.
    const mine = journeysOf(person).filter((j) => (j.status === 'booked' || j.status === 'underway') && j.bookingId === undefined);
    const placed = journeysOf(person).filter((j) => (j.status === 'booked' || j.status === 'underway') && j.arriveAt <= c.at).sort((a, b) => b.arriveAt - a.arriveAt)[0];
    if (placed && placed.bookingId === undefined && placed.toCity !== city) out.push(`Your journey: you’ll be in ${CITIES.require(whereBy(person, c.at)).name} on ${formatDate(c.at, sim.zone)}`);
    for (const j of mine) if (j.leaveAt >= c.at - 2 * MS_HOUR && j.leaveAt < ends) out.push(`Your journey to ${CITIES.require(j.toCity).name}, leaving ${formatDate(j.leaveAt, sim.zone)} at ${formatTime(j.leaveAt, sim.zone)}`);
  }
  return [...new Set(out)];
}

/** The calls a change makes of the calls there are now, or nothing where it changes nothing. */
function changed(sim: Simulation, booking: Booking, kind: ChangeKind, x: number): { to: Call[]; affected: Instant[] } | undefined {
  const calls = workDays(booking);
  const n = done(booking);
  const past = calls.slice(0, n);
  const ahead = calls.slice(n).filter((c) => c.at > sim.now + MS_HOUR);
  if (!ahead.length || ahead.length !== calls.length - n) return undefined;
  const role = roleById(booking.roleId);
  const zone = CITIES.require(workCityOf(booking)).timeZone;
  if (kind === 'postpone' || kind === 'postpone_rest') {
    if (kind === 'postpone' && n > 0) return undefined;
    const delta = (kind === 'postpone' ? SCHEDULE.postponeDays[x < 0.5 ? 0 : 1] : 7) * MS_DAY;
    return { to: [...past, ...ahead.map((c) => ({ ...c, at: c.at + delta }))], affected: ahead.map((c) => c.at) };
  }
  if (kind === 'call_time') {
    const i = Math.min(ahead.length - 1, Math.floor(x * ahead.length));
    const hours = SCHEDULE.callHours[Math.floor((x * 7) % SCHEDULE.callHours.length)]!;
    const moved = { ...ahead[i]!, at: ahead[i]!.at + hours * MS_HOUR };
    return { to: [...past, ...ahead.map((c, k) => (k === i ? moved : c))], affected: [ahead[i]!.at] };
  }
  if (kind === 'add_day' || kind === 'request') {
    if (role.medium !== 'screen') return undefined;
    const last = calls.at(-1)!;
    let at = last.at + MS_DAY;
    while ([0, 6].includes(zonedParts(at, zone).weekday)) at += MS_DAY;
    if (kind === 'add_day') return { to: [...calls, { at, week: last.week, rehearsal: false }], affected: [at] };
    // A call asked to move goes to the day after the last.
    const i = Math.min(ahead.length - 1, Math.floor(x * ahead.length));
    return { to: [...past, ...ahead.filter((_, k) => k !== i), { at, week: last.week, rehearsal: false }], affected: [ahead[i]!.at] };
  }
  // Cut: on stage the performances past two weeks' notice; on screen the last half of what's left, at least one.
  if (role.medium === 'stage') {
    const keep = ahead.filter((c) => c.at <= sim.now + SCHEDULE.lort.closingNoticeDays * MS_DAY || c.rehearsal);
    if (keep.length === ahead.length) return undefined;
    return { to: [...past, ...keep], affected: ahead.slice(keep.length).map((c) => c.at) };
  }
  const cut = Math.max(1, Math.floor(ahead.length / 2));
  // Never cut to nothing: a job with no call worked keeps one.
  if (n === 0 && ahead.length - cut < 1) return undefined;
  return { to: [...past, ...ahead.slice(0, ahead.length - cut)], affected: ahead.slice(ahead.length - cut).map((c) => c.at) };
}

/** A day's rate, or a stage week's, in the save's money. */
const dayRate = (sim: Simulation, b: Booking) => unitRate(b, sim.now, saveCurrency(sim.universe));
const money = (sim: Simulation, m: Money) => `${saveCurrency(sim.universe)} ${(m / 100).toFixed(2)}`;

/** What a change pays or costs, in words, and the pay itself where it's owed on taking effect. */
function costsOf(sim: Simulation, booking: Booking, kind: ChangeKind, to: readonly Call[], affected: readonly Instant[]): { words: string; owed: Money } {
  const role = roleById(booking.roleId);
  const rate = dayRate(sim, booking);
  if (kind === 'call_time' && role.union === 'sag') {
    const sorted = [...to].sort((a, b) => a.at - b.at);
    const i = sorted.findIndex((c) => !workDays(booking).some((o) => o.at === c.at));
    const prev = i > 0 ? sorted[i - 1] : undefined;
    if (prev && sorted[i]!.at - (prev.at + workMinutes(role, prev.rehearsal) * 60_000) < SCHEDULE.restHours * MS_HOUR) {
      const owed = Math.min(rate, usd(SCHEDULE.forcedCallUsd, saveCurrency(sim.universe)));
      return { words: `Less than ${SCHEDULE.restHours} hours’ rest after the call before: a forced call, paid ${money(sim, owed)} (the lesser of the day’s rate and $900, SAG-AFTRA).`, owed };
    }
  }
  if (kind === 'add_day') return { words: `One more day, paid at the day’s rate, ${money(sim, rate)}.`, owed: 0 };
  if (kind === 'cut_rest') {
    if (role.medium === 'stage') return { words: 'Closing on two weeks’ notice, the performances past it cut (Equity LORT).', owed: 0 };
    const owed = rate * affected.length;
    return { words: `${affected.length} ${affected.length === 1 ? 'day' : 'days'} cut, booked and so paid, ${money(sim, owed)} (SLATE’s estimate of a firm booking).`, owed };
  }
  return { words: '', owed: 0 };
}

/** What refusing a postponement pays: the cancellation's. */
function cancellationPay(sim: Simulation, booking: Booking): { words: string; owed: Money } {
  const role = roleById(booking.roleId);
  const rate = dayRate(sim, booking);
  const calls = workDays(booking);
  if (role.medium === 'stage') {
    const weeks = done(booking) > 0 ? SCHEDULE.lort.earlyWeeks : calls[0]!.at - sim.now > SCHEDULE.lort.lateWithinDays * MS_DAY ? SCHEDULE.lort.earlyWeeks : SCHEDULE.lort.lateWeeks;
    return { words: `released, and paid ${weeks} weeks’ salary, ${money(sim, rate * weeks)} (Equity LORT)`, owed: rate * weeks };
  }
  const left = calls.length - done(booking);
  return { words: `released, and paid the ${left} booked ${left === 1 ? 'day' : 'days'} not worked, ${money(sim, rate * left)} (SLATE’s estimate of a firm booking)`, owed: rate * left };
}

function propose(sim: Simulation, person: Person, booking: Booking, kind: ChangeKind, x: number): Proposal | undefined {
  const p = productionOf(person, booking.id);
  if (!p || booking.status !== 'accepted') return undefined;
  const made = changed(sim, booking, kind, x);
  if (!made) return undefined;
  const old = workDays(booking);
  const conflicts = conflictsFor(sim, person, booking, made.to, old);
  const costs = costsOf(sim, booking, kind, made.to, made.affected);
  const mustRespond = kind === 'postpone' || kind === 'postpone_rest' || kind === 'add_day' || (kind === 'call_time' && conflicts.length > 0);
  const firstAffected = Math.min(...made.affected);
  const dueAt = Math.max(sim.now + MS_HOUR, Math.min(sim.now + (mustRespond ? SCHEDULE.answerDays : SCHEDULE.noticeDays) * MS_DAY, firstAffected - MS_DAY));
  const refusal = kind === 'postpone' || kind === 'postpone_rest' ? ` Refused or unanswered, you’re ${cancellationPay(sim, booking).words}.` : kind === 'add_day' || kind === 'call_time' ? ' Refused, the schedule stays as it is.' : '';
  const travel = booking.location !== undefined ? ' The production’s travel moves with it.' : workCityOf(booking) !== (person.home?.cityId ?? person.currentLocationId) ? ' A room you’ve taken there isn’t moved or refunded for you: check it.' : '';
  const reasons = REASONS[kind];
  const proposal: Proposal = {
    id: `${booking.id}-c${proposalsOf(p).length + 1}`, kind, reason: reasons[Math.floor(x * reasons.length) % reasons.length]!, made: sim.now, dueAt,
    to: made.to, affected: made.affected, conflicts, consequences: `${costs.words}${refusal}${travel}`.trim(), mustRespond, status: 'pending',
  };
  proposalsOf(p).push(proposal);
  p.history.push({ at: sim.now, what: `The production proposed a change: ${describe(sim, proposal)}` });
  sim.schedule({ at: dueAt, kind: SCHEDULE_DUE_KIND, label: 'A Schedule Change Is Due', category: 'system', priority: 21, payload: { personId: person.id, bookingId: booking.id, proposalId: proposal.id } });
  return proposal;
}

/** A change in words: what, which calls, and why (the reason is the game's, simulated). */
export function describe(sim: Simulation, pr: Proposal): string {
  const dates = pr.affected.map((t) => formatDate(t, sim.zone)).join(', ');
  const what = pr.kind === 'postpone' ? 'the start postponed' : pr.kind === 'postpone_rest' ? 'the calls left postponed a week' : pr.kind === 'call_time' ? 'a call’s time moved' : pr.kind === 'add_day' ? 'a day added' : pr.kind === 'cut_rest' ? 'the calls left cut' : 'a call moved, as you asked';
  return `${what} (${dates}), because ${pr.reason}`;
}

function tell(sim: Simulation, person: Person, title: string, body: string): void {
  if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title, body, importance: 65, route: '/workspace/career' });
}

/** A change taken: the calls replaced, the superseded ones canceled, pay, travel and the cast brought into line. Throws what's in the way. */
export function applyProposal(sim: Simulation, person: Person, booking: Booking, pr: Proposal): void {
  const old = workDays(booking);
  const conflicts = conflictsFor(sim, person, booking, pr.to, old);
  if (conflicts.length) throw new CommandError(`It clashes with ${conflicts.join('; ')}. Call that off or move it first, or refuse the change.`);
  const role = roleById(booking.roleId);
  const costs = costsOf(sim, booking, pr.kind, pr.to, pr.affected);
  const n = done(booking);
  const delta = pr.to.length === old.length ? (pr.to[n]?.at ?? 0) - (old[n]?.at ?? 0) : 0;
  booking.calls = pr.to.map((c) => ({ ...c }));
  // Superseded calls canceled; the calls to come put on the calendar, once each.
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.kind === WORK_KIND && item.payload.bookingId === booking.id) sim.timeline.cancel(item.id, sim.now);
  const city = workCityOf(booking);
  const reads = role.medium === 'stage' || role.after?.kind === 'tv';
  for (const [k, c] of booking.calls.entries()) {
    if (k < n) continue;
    const table = reads && k === 0;
    sim.schedule({
      at: c.at, kind: WORK_KIND,
      label: role.medium === 'screen' ? `${table ? 'The Table Read, Then On Set' : 'On Set'}: ${role.label}` : `${table && c.rehearsal ? 'The Table Read' : c.rehearsal ? 'Rehearsal' : 'Performance'}: ${role.label}`,
      category: 'career', priority: 34, requiresPlayer: true, durationMinutes: workMinutes(role, c.rehearsal), locationId: city,
      payload: { personId: person.id, bookingId: booking.id, callAt: c.at, ...(table ? { tableRead: true } : {}) },
    });
  }
  if (costs.owed > 0) booking.cancellationOwed = (booking.cancellationOwed ?? 0) + costs.owed;
  // Paid by the new calls' paydays, as a job taken is (`paydaysFor`): the old ones canceled, so none pays twice or too soon; and a
  // last check after the last call for anything a change owes.
  const last = booking.calls.at(-1)!.at;
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.kind === PAY_KIND && item.payload.bookingId === booking.id) sim.timeline.cancel(item.id, sim.now);
  const ahead = booking.calls.slice(n);
  for (const when of paydaysFor(role, ahead.length ? ahead : booking.calls.slice(-1), CITIES.require(city).timeZone)) if (when > sim.now) schedulePay(sim, person, booking, when);
  schedulePay(sim, person, booking, Math.max(sim.now + 60_000, last + 7 * MS_DAY), true);
  // The production's travel and the trip home, moved with the calls; a room already taken flagged, not changed.
  for (const x of sim.universe.scheduled) {
    if (x.status !== 'pending' || x.payload.bookingId !== booking.id || (x.kind !== TRAVEL_KIND && x.kind !== STAY_KIND)) continue;
    if (delta && x.payload.direction === 'out') sim.timeline.reschedule(x.id, x.at + delta);
    if (x.payload.direction === 'back') sim.timeline.reschedule(x.id, Math.max(sim.now + MS_HOUR, last + MS_DAY));
    if (x.kind === STAY_KIND && x.payload.direction === 'out') x.payload.back = last + MS_DAY;
  }
  const roomTaken = sim.universe.scheduled.find((x) => x.kind === STAY_KIND && x.status === 'done' && x.payload.direction === 'out' && x.payload.bookingId === booking.id);
  if (roomTaken && Number(roomTaken.payload.back) < last) tell(sim, person, 'Your Room Runs Out Before The Work', `Your room in ${CITIES.require(city).name} was taken to ${formatDate(Number(roomTaken.payload.back), sim.zone)}; the calls now run to ${formatDate(last, sim.zone)}. Arrange the nights through Travel.`);
  // The cast: dates moved; a classmate who can't make them withdraws, a company actor in the part.
  const p = productionOf(person, booking.id)!;
  const first = booking.calls[0]!.at;
  for (const slot of p.slots) {
    if (slot.status !== 'cast') continue;
    slot.from = Math.min(slot.from, first);
    slot.until = last;
    if (slot.performer.kind !== 'classmate') continue;
    const i = slot.performer.i;
    const elsewhere = productionsOf(person).some((q) => q !== p && q.slots.some((s) => s.status === 'cast' && s.performer.kind === 'classmate' && s.performer.i === i && s.from <= last && s.until >= first));
    if (!elsewhere) continue;
    const m = person.school!.classmates[i]!;
    slot.status = 'replaced';
    p.slots.push({ ...slot, id: `${slot.id}-r`, status: 'cast', performer: { kind: 'company' }, from: sim.now, shared: 0 });
    p.history.push({ at: sim.now, what: `${m.name} couldn’t make the new dates and withdrew from ${slot.part.toLowerCase()}${slot.shared ? ` after ${slot.shared} ${slot.shared === 1 ? 'day' : 'days'} side by side` : ''}; a company actor plays it` });
    // Cast, not worked through: the casting's credit given back where nothing was worked.
    if (!slot.shared) { const credits = m.career?.credits ?? []; const k = credits.map((c) => c.roleId).lastIndexOf(p.roleId); if (k >= 0) credits.splice(k, 1); }
    tell(sim, person, `${m.name.split(' ')[0]} Withdrew`, `${m.name} couldn’t make ${p.title}’s new dates. A company actor plays ${slot.part.toLowerCase()}.`);
  }
  pr.status = 'applied';
  pr.closedAt = sim.now;
  p.history.push({ at: sim.now, what: `Schedule changed: ${describe(sim, pr)}` });
  // Cut to what's already worked: the job's finished now, its credit earned by the work done.
  if (n >= booking.calls.length && booking.worked > 0) finishJob(sim, person, careerOf(person), booking, role, { at: sim.now });
  for (const d of Object.values(sim.universe.decisions)) if (d.refType === 'schedule' && d.refId === pr.id && !d.resolvedAt) d.resolvedAt = sim.now;
}

/** Refused or let expire: a postponement releases them, paid as a cancellation; anything else stays as it was. */
export function refuseProposal(sim: Simulation, person: Person, booking: Booking, pr: Proposal, how: 'refused' | 'expired'): void {
  pr.status = how;
  pr.closedAt = sim.now;
  const p = productionOf(person, booking.id)!;
  for (const d of Object.values(sim.universe.decisions)) if (d.refType === 'schedule' && d.refId === pr.id && !d.resolvedAt) d.resolvedAt = sim.now;
  if (pr.kind !== 'postpone' && pr.kind !== 'postpone_rest') {
    p.history.push({ at: sim.now, what: `The change wasn’t taken (${how}); the schedule stands` });
    return;
  }
  const pay = cancellationPay(sim, booking);
  booking.status = 'released';
  booking.cancellationOwed = (booking.cancellationOwed ?? 0) + pay.owed;
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.kind === WORK_KIND && item.payload.bookingId === booking.id) sim.timeline.cancel(item.id, sim.now);
  schedulePay(sim, person, booking, sim.now + 60_000, true);
  sendHome(sim, booking);
  playerReplaced(sim, person, booking.id, `released: the new dates were ${how}${booking.worked ? ` after ${booking.worked} ${booking.worked === 1 ? 'day' : 'days'} worked` : ''}`);
  tell(sim, person, 'Released From The Job', `The new dates for ${roleById(booking.roleId).label} were ${how}: you’re ${pay.words}. What you worked is paid as it was.`);
}

export function registerRescheduling(sim: Simulation): void {
  sim.onSchedule(SCHEDULE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const booking = person && careerOf(person).bookings.find((b) => b.id === item.payload.bookingId);
    if (!person || !booking) return;
    const pr = propose(s, person, booking, item.payload.change as ChangeKind, Number(item.payload.x));
    // Only the player has a career a production changes; a change that changes nothing isn't proposed.
    if (!pr || person.id !== s.universe.playerId) return;
    const role = roleById(booking.roleId);
    const body = `${role.label}: ${describe(s, pr)}. ${pr.conflicts.length ? `It clashes with ${pr.conflicts.join('; ')}. ` : ''}${pr.consequences}`;
    if (!pr.mustRespond) { tell(s, person, 'A Schedule Change', `${body} It takes effect ${formatDate(pr.dueAt, s.zone)}.`); return; }
    s.requireDecision({
      urgency: 75, category: 'career', title: 'The Production Asks To Change Your Dates', detail: `${body} Answer by ${formatDate(pr.dueAt, s.zone)}.`,
      route: '/workspace/career', dueAt: pr.dueAt, refType: 'schedule', refId: pr.id,
      actions: [
        { label: 'Accept The Change', commandKind: 'career.answer_schedule', payload: { bookingId: booking.id, proposalId: pr.id, accept: true } },
        { label: 'Refuse It', commandKind: 'career.answer_schedule', payload: { bookingId: booking.id, proposalId: pr.id, accept: false } },
      ],
    });
  });

  sim.onSchedule(SCHEDULE_DUE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const booking = person && careerOf(person).bookings.find((b) => b.id === item.payload.bookingId);
    const pr = person && booking ? proposalsFor(person, booking.id).find((x) => x.id === item.payload.proposalId) : undefined;
    if (!person || !booking || !pr || pr.status !== 'pending') return;
    // The job gone meanwhile: the production withdraws it.
    if (booking.status !== 'accepted') { pr.status = 'withdrawn'; pr.closedAt = s.now; return; }
    if (pr.mustRespond) { refuseProposal(s, person, booking, pr, 'expired'); return; }
    // A notice takes effect at its date, unless something now stands in its way: then the production keeps the old time.
    try { applyProposal(s, person, booking, pr); tell(s, person, 'The Schedule Changed', `${roleById(booking.roleId).label}: ${describe(s, pr)}.`); }
    catch (e) { pr.status = 'withdrawn'; pr.closedAt = s.now; productionOf(person, booking.id)!.history.push({ at: s.now, what: `The production kept the old time: ${(e as Error).message}` }); }
  });

  sim.onCommand<{ bookingId: string; proposalId: string; accept: boolean }, { status: Proposal['status'] }>('career.answer_schedule', (q, { sim: s }) => {
    const person = s.player;
    const booking = careerOf(person).bookings.find((b) => b.id === q?.bookingId);
    const pr = booking ? proposalsFor(person, booking.id).find((x) => x.id === q?.proposalId) : undefined;
    if (!booking || !pr || pr.status !== 'pending') throw new CommandError('There’s no such change waiting on you.');
    if (!pr.mustRespond) throw new CommandError('It’s the production’s notice: it takes effect on its date.');
    if (q.accept === true) applyProposal(s, person, booking, pr);
    else refuseProposal(s, person, booking, pr, 'refused');
    return { status: pr.status };
  });

  sim.onCommand<{ bookingId: string; callAt: Instant }, { answerBy: Instant }>('career.request_schedule', (q, { sim: s }) => {
    const person = s.player;
    const booking = careerOf(person).bookings.find((b) => b.id === q?.bookingId);
    const no = requestRefusal(s, person, booking, Number(q?.callAt));
    if (no) throw new CommandError(no);
    booking!.scheduleAsked = true;
    const answerBy = s.now + MS_DAY;
    s.schedule({ at: answerBy, kind: SCHEDULE_REPLY_KIND, label: 'The Production Answers', category: 'system', priority: 20, payload: { personId: person.id, bookingId: booking!.id, callAt: Number(q.callAt) } });
    return { answerBy };
  });

  sim.onSchedule(SCHEDULE_REPLY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const booking = person && careerOf(person).bookings.find((b) => b.id === item.payload.bookingId);
    if (!person || !booking || booking.status !== 'accepted') return;
    const calls = workDays(booking);
    const ahead = calls.slice(done(booking));
    const i = ahead.findIndex((c) => c.at === Number(item.payload.callAt));
    const yes = i >= 0 && s.rng('career.schedule', person.id, `request-${booking.id}`).next() < SCHEDULE.requestYes;
    const pr = yes ? propose(s, person, booking, 'request', (i + 0.5) / ahead.length) : undefined;
    if (!pr) { tell(s, person, 'The Production Can’t Move It', `${roleById(booking.roleId).label}: the call on ${formatDate(Number(item.payload.callAt), s.zone)} stays where it is.`); return; }
    try { applyProposal(s, person, booking, pr); tell(s, person, 'Your Call Moved', `${roleById(booking.roleId).label}: ${describe(s, pr)}.`); }
    catch (e) { pr.status = 'withdrawn'; pr.closedAt = s.now; tell(s, person, 'The Production Can’t Move It', (e as Error).message); }
  });
}

/** Why a call can't be asked to move, or nothing. */
export function requestRefusal(sim: Simulation, person: Person, booking: Booking | undefined, callAt: Instant): string | undefined {
  if (!booking || booking.status !== 'accepted') return 'That isn’t a job you’re booked for.';
  if (roleById(booking.roleId).medium !== 'screen') return 'A run’s calls are the company’s: they don’t move for one actor.';
  if (!eligible(booking)) return 'A series’ or a commercial’s calls aren’t yours to move.';
  if (booking.scheduleAsked) return 'You’ve asked once already on this job.';
  if (!workDays(booking).slice(done(booking)).some((c) => c.at === callAt)) return 'That isn’t one of its calls to come.';
  if (callAt - sim.now < 2 * MS_DAY) return 'Too near: a call is asked to move two days ahead or more.';
  if (proposalsFor(person, booking.id).some((p) => p.status === 'pending')) return 'A change is waiting already.';
  return undefined;
}
