/**
 * SLATE — everything under way, in one list (the master plan's §59, from
 * 2026-10-02).
 *
 * An order on its way, a car on order or at a shop, an appointment, a
 * journey booked, a document waiting to be issued, works on a home: each
 * keeps its own state in its own system. This reads them all into one list,
 * soonest first, each with when it's due and the screen it belongs to, so
 * nothing in progress is out of sight and nothing is started twice.
 *
 * What was stopped partway is listed too, from 2026-10-03, each with what
 * picks it up where it was left: a program partway through, a book begun,
 * flight training stopped, a build stopped on a bill unpaid. Until then
 * each could be taken up again only from its own screen, and nothing said
 * it was waiting. From 2026-10-06 a recipe stopped partway is listed while
 * it's safe to finish.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { PROJECTS } from '../content/homes';
import { ordersOf } from './orders';
import { modelById, vehiclesOf } from './vehicles';
import { journeysOf } from './journey';
import { documentsOf } from './documents';
import { appointmentsOf } from './appointments';
import { rentalsOf } from './rentals';
import { MACHINE_LABEL, faultsOf, type Machine } from './appliancefaults';
import { finished, programmeById } from './programmes';
import { NOVEL_WORDS, bookInHand } from './reading';
import { PILOT_TRAINING } from './aviation';
import { recipeById } from './kitchen';
import { COLD_CHAIN_HOURS } from './trips';

export interface UnderWay { kind: 'order' | 'car' | 'shop' | 'appointment' | 'journey' | 'document' | 'works' | 'rental' | 'repair'; label: string; until: Instant; route: string }

export function underWay(sim: Simulation, person: Person): UnderWay[] {
  const now = sim.now;
  const out: UnderWay[] = [];
  for (const o of ordersOf(person)) if (o.status === 'placed') out.push({ kind: 'order', label: `An Order From ${o.from}`, until: o.arrivesAt, route: '/workspace/belongings' });
  for (const v of vehiclesOf(person)) {
    if (v.soldAt !== undefined) continue;
    const m = modelById(v.modelId);
    const name = m ? `${m.make} ${m.model}` : 'The Car';
    if (v.deliveredAt !== undefined && v.deliveredAt > now) out.push({ kind: 'car', label: `${name}, On Order`, until: v.deliveredAt, route: '/workspace/vehicles' });
    if (v.inShop && v.inShop.until > now) out.push({ kind: 'shop', label: `${name}, At ${v.inShop.name ?? 'The Garage'}`, until: v.inShop.until, route: '/workspace/vehicles' });
  }
  for (const a of appointmentsOf(person)) if (a.at > now) out.push({ kind: 'appointment', label: `The Doctor: ${a.what}`, until: a.at, route: '/workspace/papers' });
  for (const j of journeysOf(person)) if ((j.status === 'booked' || j.status === 'underway') && j.arriveAt > now) out.push({ kind: 'journey', label: `To ${CITIES.get(j.toCity)?.name ?? 'A Town'}`, until: j.status === 'booked' ? j.leaveAt : j.arriveAt, route: '/workspace/travel' });
  for (const r of rentalsOf(person)) if (r.status === 'held' && r.heldUntil !== undefined) out.push({ kind: 'rental', label: 'A Rental Car Held For Its Deposit', until: r.heldUntil, route: '/workspace/travel' });
  for (const d of documentsOf(person)) if (d.status === 'pending' && d.readyAt !== undefined) out.push({ kind: 'document', label: `${d.name}, Being Issued`, until: d.readyAt, route: '/workspace/papers' });
  for (const h of person.homes ?? []) for (const w of h.works) if (w.doneAt > now) out.push({ kind: 'works', label: `${PROJECTS.find((p) => p.id === w.projectId)?.label ?? 'Works'}, ${h.facts.address}`, until: w.doneAt, route: '/workspace/homes' });
  for (const [m, f] of Object.entries(faultsOf(person)) as [Machine, NonNullable<ReturnType<typeof faultsOf>[Machine]>][]) if (f.fixAt !== undefined && f.fixAt > now) out.push({ kind: 'repair', label: `The ${MACHINE_LABEL[m]}, Being Mended`, until: f.fixAt, route: '/home' });
  return out.sort((a, b) => a.until - b.until || a.label.localeCompare(b.label));
}

/** Something stopped partway, and the command that picks it up where it was left. */
export interface Partway { kind: 'program' | 'book' | 'pilot' | 'build' | 'cooking'; label: string; note: string; since: Instant; route: string; resume: { command: string; payload: Record<string, unknown>; label: string } }

/** What was left partway, the last left first; from 2026-10-06 a recipe stopped partway too, while it's within USDA's two hours at `now`. */
export function leftPartway(person: Person, now?: Instant): Partway[] {
  const out: Partway[] = [];
  const c = person.cooking;
  if (c && (now === undefined || now - c.stoppedAt <= COLD_CHAIN_HOURS * 3_600_000)) out.push({ kind: 'cooking', label: recipeById(c.recipeId)?.name ?? 'Cooking', note: `${Math.round(c.minutesDone)} of ${c.minutes} minutes cooked; ${c.why}`, since: c.stoppedAt, route: '/workspace/food', resume: { command: 'food.resume_cooking', payload: {}, label: 'Finish Cooking It' } });
  for (const [id, w] of Object.entries(person.watching ?? {})) {
    const p = programmeById(id);
    if (!p || finished(p, w)) continue;
    out.push({ kind: 'program', label: p.title, note: `Season ${w.season + 1}, episode ${w.episode + 1}${w.minute > 0 ? `, ${w.minute} minutes in` : ''}`, since: w.at, route: '/workspace/belongings', resume: { command: 'tv.watch', payload: { programmeId: id, to: 'episode' }, label: w.minute > 0 ? 'Finish The Episode' : 'Watch The Next' } });
  }
  const book = bookInHand(person);
  if (book?.readWords) out.push({ kind: 'book', label: book.label, note: `${Math.round((100 * book.readWords) / NOVEL_WORDS)}% read`, since: book.acquiredAt, route: '/workspace/belongings', resume: { command: 'life.look_after', payload: { action: 'unwind', how: 'read' }, label: 'Read For An Hour' } });
  const t = person.pilotTraining;
  if (t?.status === 'stopped') out.push({ kind: 'pilot', label: 'Flight Training', note: t.monthsDone >= PILOT_TRAINING.months ? 'Stopped at the tests' : `Stopped after ${t.monthsDone} of ${PILOT_TRAINING.months} months`, since: t.startedAt, route: '/workspace/travel', resume: { command: 'pilot.train', payload: {}, label: 'Take It Up Again' } });
  const b = person.building;
  if (b?.unpaid !== undefined) out.push({ kind: 'build', label: 'Your House, Being Built', note: 'Stopped on a bill unpaid', since: b.stoppedAt ?? 0, route: '/workspace/homes', resume: { command: 'build.pay', payload: {}, label: 'Pay The Bill' } });
  return out.sort((a, b) => b.since - a.since);
}
