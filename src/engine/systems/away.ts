/**
 * SLATE — a home kept while it's empty: the post held, and a house sitter
 * (the master plan's "Still Open", from 2026-10-03; the services and prices
 * in `content/away.ts`).
 *
 * **Somebody home** (`someoneHome`): a partner who lives there, a sitter
 * staying, or the player in town and not held anywhere else by a commitment.
 * It decides whether the cleaner gets in without a key (`cleanerGetsIn` in
 * `systems/dwelling.ts`) and whether a parcel is handed over or left at the
 * door to be taken (`deliver` in `systems/orders.ts`).
 *
 * **The post held**: booked for some days from the first its notice allows,
 * at its fee. While it holds, a license or ID card in the post waits, and
 * where the hold takes parcels (USPS's) so does an order to the home; each
 * comes when the hold gives back what it kept, on its last day or the next
 * business day after. Ended early, what it kept comes then; the fee isn't
 * given back, Canada Post's terms saying so and no other's saying otherwise.
 *
 * **A sitter**: booked from now for some nights at the town's nightly price,
 * paid up front, and ended early without a refund, SLATE's reading of a
 * sitter's booking.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, addDays, formatDate, startOfDay, zonedParts, type Instant } from '../core/time';
import type { Money } from '../core/money';
import { formatMoney, saveCurrency } from '../core/money';
import { CITIES } from '../content/geography';
import { MAIL_HOLDS, POST_HOUR, SITTER_NIGHT, type MailHoldRule } from '../content/away';
import { afterBusinessDays, businessDay } from '../content/bankdays';
import { inSaveMoney } from './banking';
import { payFromBank } from './household';
import { contactsOf } from './people';
import { homeKeyOf } from './items';

export interface MailHold { service: string; home: string; from: Instant; until: Instant; releaseAt: Instant; parcels: boolean }
export interface SitterStay { home: string; from: Instant; until: Instant }

/** Scheduled deliveries a hold has put back carry this in their payload. */
export const HELD = 'heldByPost';

const countryOf = (person: Person): string | undefined => CITIES.get(person.home?.cityId ?? '')?.countryId;
const zoneOf = (person: Person): string => CITIES.require(person.home!.cityId).timeZone;
const keyOf = (at: Instant, zone: string): string => { const p = zonedParts(at, zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

export const holdRuleFor = (person: Person): MailHoldRule | undefined => MAIL_HOLDS[countryOf(person) ?? ''];

/** Whether a partner lives with them, a sitter's staying, or they're in town and not held by a commitment, through a span. */
export function someoneHome(sim: Simulation, person: Person, from: Instant, to: Instant): boolean {
  if (!person.home) return false;
  if (contactsOf(person).some((c) => c.livesWith !== undefined)) return true;
  if (sitterThrough(person, from, to)) return true;
  if (person.home.cityId !== person.currentLocationId) return false;
  return !sim.universe.scheduled.some((x) => x.status === 'pending' && x.requiresPlayer && x.durationMinutes && x.at < to && x.at + x.durationMinutes * 60_000 > from && (x.payload.personId === undefined || x.payload.personId === person.id));
}

/** Whether a sitter's staying in the home they live in through a span. */
export function sitterThrough(person: Person, from: Instant, to: Instant): boolean {
  const s = person.sitter;
  return Boolean(s && s.home === homeKeyOf(person.home) && s.from <= from && s.until >= to);
}

/** When a hold on the home's post would start, booked now: the next day, or after its business days' notice. */
export function holdStart(sim: Simulation, person: Person, rule: MailHoldRule): Instant {
  const zone = zoneOf(person);
  const day = rule.noticeBusinessDays > 0 ? afterBusinessDays(sim.now, rule.noticeBusinessDays, countryOf(person)!, zone) : sim.now;
  return startOfDay(addDays(day, 1, zone), zone);
}

/** A hold of some days from a start: its end, when what it kept comes, and its fee in the save's money. */
export function holdQuote(sim: Simulation, person: Person, days: number): { from: Instant; until: Instant; releaseAt: Instant; fee: Money } | undefined {
  const rule = holdRuleFor(person);
  if (!rule || !person.home) return undefined;
  const zone = zoneOf(person);
  const from = holdStart(sim, person, rule);
  const until = startOfDay(addDays(from, days, zone), zone);
  let weekdays = 0;
  for (let at = from; at < until; at = addDays(at, 1, zone)) { const w = zonedParts(at, zone).weekday; if (w !== 0 && w !== 6) weekdays += 1; }
  // Delivered on the last day, or the next business day after the end.
  let release = rule.deliversAfter ? until : addDays(until, -1, zone);
  while (rule.deliversAfter && !businessDay(countryOf(person)!, keyOf(release, zone))) release = addDays(release, 1, zone);
  return { from, until, releaseAt: release + POST_HOUR * MS_HOUR, fee: inSaveMoney(sim, Math.round(rule.fee(days, weekdays) * 100), rule.currency) };
}

export function holdRefusal(sim: Simulation, person: Person, days: number): string | undefined {
  if (!person.home || person.home.kind === 'sofa') return 'There’s no home of yours for the post to hold.';
  const rule = holdRuleFor(person);
  if (!rule) return countryOf(person) === 'mx' ? 'Correos de México doesn’t hold a home’s delivery.' : 'The post here keeps no hold on a home’s delivery.';
  if (!Number.isInteger(days) || days < rule.leastDays) return `${rule.service} holds ${rule.leastDays === 1 ? 'a day' : `${rule.leastDays} days`} at the least.`;
  if (rule.mostDays !== undefined && days > rule.mostDays) return `${rule.service} holds ${rule.mostDays} days at the most.`;
  const held = person.mailHold;
  if (held && held.releaseAt > sim.now) return `The post’s already held, to ${formatDate(held.until, sim.zone)}.`;
  return undefined;
}

/** When something in the post to the home they live in comes instead, held: its hold's giving back, or none. */
export function heldUntil(person: Person, at: Instant, parcel: boolean, home = homeKeyOf(person.home)): Instant | undefined {
  const h = person.mailHold;
  if (!h || h.home !== home || at < h.from || at >= h.releaseAt || (parcel && !h.parcels)) return undefined;
  return h.releaseAt;
}

/** A delivery put back to the hold's end: rebooked as it was, marked held. */
export function holdBack(sim: Simulation, item: { kind: string; label: string; category: string; priority: number; payload: Record<string, unknown> }, releaseAt: Instant): void {
  sim.schedule({ at: releaseAt, kind: item.kind, label: item.label, category: item.category, priority: item.priority, payload: { ...item.payload, [HELD]: true } });
}

export function sitterRefusal(person: Person, nights: number, now: Instant): string | undefined {
  if (!person.home || person.home.kind === 'sofa') return 'There’s no home of yours to sit.';
  if (!SITTER_NIGHT[person.home.cityId]) return `No sitter’s nightly price is published for ${CITIES.get(person.home.cityId)?.name ?? 'the town'}.`;
  if (!Number.isInteger(nights) || nights < 1) return 'A sitter stays a night at the least.';
  if (person.sitter && person.sitter.until > now && person.sitter.home === homeKeyOf(person.home)) return 'A sitter’s already staying.';
  return undefined;
}

export const sitterFee = (sim: Simulation, person: Person, nights: number): Money => {
  const rate = SITTER_NIGHT[person.home?.cityId ?? ''];
  return rate ? inSaveMoney(sim, Math.round(rate.amount * 100), rate.currency) * nights : 0;
};

export function registerAway(sim: Simulation): void {
  sim.onCommand<{ days: number }, MailHold & { paid: Money }>('home.hold_mail', (p, { sim: s }) => {
    const person = s.player;
    const days = Number(p?.days);
    const no = holdRefusal(s, person, days);
    if (no) throw new CommandError(no);
    const rule = holdRuleFor(person)!;
    const q = holdQuote(s, person, days)!;
    if (q.fee > 0 && !payFromBank(s, person, q.fee, rule.service, 'household')) throw new CommandError(`${formatMoney(q.fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    person.mailHold = { service: rule.service, home: homeKeyOf(person.home)!, from: q.from, until: q.until, releaseAt: q.releaseAt, parcels: rule.parcels };
    return { ...person.mailHold, paid: q.fee };
  });
  sim.onCommand<Record<string, never>, { releaseAt: Instant }>('home.end_hold', (_p, { sim: s }) => {
    const person = s.player;
    const h = person.mailHold;
    if (!h || h.releaseAt <= s.now) throw new CommandError('The post isn’t held.');
    const zone = zoneOf(person);
    // What it kept comes the next delivery day; a hold not yet begun simply ends.
    const releaseAt = Math.max(s.now, startOfDay(addDays(s.now, 1, zone), zone) + POST_HOUR * MS_HOUR);
    h.until = Math.min(h.until, startOfDay(addDays(s.now, 1, zone), zone));
    h.releaseAt = h.from > s.now ? s.now : releaseAt;
    for (const one of s.universe.scheduled) {
      if (one.status !== 'pending' || !one.payload[HELD] || one.payload.personId !== person.id || one.at <= h.releaseAt) continue;
      s.timeline.cancel(one.id, s.now);
      holdBack(s, one, Math.max(h.releaseAt, s.now));
    }
    return { releaseAt: h.releaseAt };
  });
  sim.onCommand<{ nights: number }, SitterStay & { paid: Money }>('home.sitter', (p, { sim: s }) => {
    const person = s.player;
    const nights = Number(p?.nights);
    const no = sitterRefusal(person, nights, s.now);
    if (no) throw new CommandError(no);
    const fee = sitterFee(s, person, nights);
    if (!payFromBank(s, person, fee, 'A house sitter', 'household')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    person.sitter = { home: homeKeyOf(person.home)!, from: s.now, until: s.now + nights * MS_DAY };
    return { ...person.sitter, paid: fee };
  });
  sim.onCommand<Record<string, never>, { ended: true }>('home.end_sitter', (_p, { sim: s }) => {
    const person = s.player;
    if (!person.sitter || person.sitter.until <= s.now) throw new CommandError('No sitter’s staying.');
    person.sitter.until = s.now;
    return { ended: true };
  });
}
