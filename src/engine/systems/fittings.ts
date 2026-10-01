/**
 * SLATE — an actor's own wardrobe lent to a production (Stage 13 of
 * `docs/BACKLOG.md`, from 2026-10-01; `research-career-depth.json`). A
 * production may ask a performer to supply their own clothes, and the
 * unions say what it pays for them, an outfit a week:
 * - SAG-AFTRA: $12 an outfit, $27 for formal wear (2023 MOA), rising to $14
 *   and $30 on 1 July 2027 (CBA Schedule A §11.D, Schedule B §16.D).
 * - ACTRA: the first two changes free, CA$30 each beyond, CA$50 a formal
 *   costume, each week.
 * - Equity UK and Irish Equity: no allowance, only cleaning or making good,
 *   so nothing is paid.
 * Mexico's ANDA rate wasn't found, and stage work isn't asked for clothes
 * here, so neither lends.
 *
 * Lent clothes are with the production from when they're handed over to
 * the day after the last call, out of reach, and come back worn, for the
 * wash. A formal outfit is one with a suit in it, SLATE's reading. The
 * allowance is paid beside the job's wages, untaxed, as a reimbursement.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, dateKey, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { rateOn, type RateSteps } from '../content/career';
import { careerOf, roleById, workCityOf, workDays, type Booking } from './career';
import { homeKeyOf, itemById, itemsOf, type Item } from './items';
import { wearable, type Garment } from './wardrobe';

export const RETURN_KIND = 'career.wardrobe_back';

export const ALLOWANCE = {
  sag: { regular: [['2014-09-24', 12_00], ['2027-07-01', 14_00]] as RateSteps, formal: [['2023-11-09', 27_00], ['2027-07-01', 30_00]] as RateSteps },
  actra: { change: 30_00, formal: 50_00, free: 2 },
} as const;

const inSave = (cents: Money, from: string, into: string) => (from === into ? cents : exchange(cents, from, into) ?? cents);
const isFormal = (person: Person, itemIds: readonly string[]) => itemIds.some((id) => (itemById(person, id)?.garment as Garment | undefined)?.kind === 'suit');

/** The weeks a booking's calls fall in. */
const weeksOf = (booking: Booking) => new Set(workDays(booking).map((d) => d.week)).size;

/** What a production pays for these outfits over the job, in the save's money; nothing where the union pays nothing; undefined where it doesn't lend. */
export function allowanceFor(sim: Simulation, person: Person, booking: Booking, outfitIds: readonly string[]): Money | undefined {
  const role = roleById(booking.roleId);
  const into = saveCurrency(sim.universe);
  const outfits = outfitIds.map((id) => (person.outfits ?? []).find((o) => o.id === id)!).filter(Boolean);
  const weeks = weeksOf(booking);
  const day = dateKey(booking.starts, CITIES.require(workCityOf(booking)).timeZone);
  if (role.union === 'sag') return outfits.reduce((sum, o) => sum + inSave(rateOn(isFormal(person, o.itemIds) ? ALLOWANCE.sag.formal : ALLOWANCE.sag.regular, day), 'USD', into), 0) * weeks;
  if (role.union === 'actra') {
    const formal = outfits.filter((o) => isFormal(person, o.itemIds)).length;
    const changes = Math.max(0, outfits.length - formal - ALLOWANCE.actra.free);
    return inSave(formal * ALLOWANCE.actra.formal + changes * ALLOWANCE.actra.change, 'CAD', into) * weeks;
  }
  if (role.union === 'equity-uk' || role.union === 'irish-equity') return 0;
  return undefined;
}

/** Why these outfits can't be lent for this booking, or nothing. */
export function furnishRefusal(sim: Simulation, person: Person, bookingId: string, outfitIds: readonly string[]): string | undefined {
  const booking = careerOf(person).bookings.find((b) => b.id === bookingId);
  if (!booking || booking.status !== 'accepted') return 'That isn’t a job you’ve taken.';
  if (booking.worked > 0) return 'The work has started.';
  if (booking.furnished) return 'You’ve lent it clothes already.';
  if (roleById(booking.roleId).medium !== 'screen') return 'Only screen work asks for clothes of your own here.';
  if (outfitIds.length < 1 || outfitIds.length > 6) return 'From one outfit to six.';
  const outfits = outfitIds.map((id) => (person.outfits ?? []).find((o) => o.id === id));
  if (outfits.some((o) => !o)) return 'That isn’t one of your outfits.';
  if (allowanceFor(sim, person, booking, outfitIds) === undefined) return 'SLATE doesn’t know what this union pays for clothes of your own.';
  for (const o of outfits) for (const id of o!.itemIds) {
    const item = itemById(person, id);
    if (!item?.garment || !wearable(sim, person, item as Item & { garment: Garment })) return `${item?.label ?? 'Something in it'} isn’t clean and to hand.`;
  }
  return undefined;
}

/** Lends the outfits: the allowance owed with the job's pay, the clothes with the production until the day after the last call. */
export function furnish(sim: Simulation, person: Person, bookingId: string, outfitIds: readonly string[]): Money {
  const no = furnishRefusal(sim, person, bookingId, outfitIds);
  if (no) throw new CommandError(no);
  const booking = careerOf(person).bookings.find((b) => b.id === bookingId)!;
  const allowance = allowanceFor(sim, person, booking, outfitIds)!;
  const days = workDays(booking);
  const backAt = days[days.length - 1]!.at + MS_DAY;
  const itemIds = [...new Set(outfitIds.flatMap((id) => (person.outfits ?? []).find((o) => o.id === id)!.itemIds))];
  for (const id of itemIds) itemById(person, id)!.at = { kind: 'service', serviceId: `production:${booking.id}`, readyAt: backAt };
  booking.wardrobeOwed = (booking.wardrobeOwed ?? 0) + allowance;
  booking.furnished = { outfitIds: [...outfitIds], itemIds, backAt };
  sim.schedule({ at: backAt, kind: RETURN_KIND, label: 'Your Clothes Back From The Production', category: 'career', priority: 25, payload: { personId: person.id, bookingId } });
  return allowance;
}

/** The clothes back: home to the wardrobe, worn. A job let go before it began gives them back unworn, and pays nothing for them. */
export function wardrobeBack(person: Person, booking: Booking): number {
  const lent = booking.furnished;
  if (!lent) return 0;
  const home = homeKeyOf(person.home);
  const worked = booking.worked > 0;
  if (!worked) booking.wardrobeOwed = 0;
  let back = 0;
  for (const item of itemsOf(person)) {
    if (!lent.itemIds.includes(item.id) || item.at.kind !== 'service') continue;
    item.at = home ? { kind: 'home', home, spot: 'wardrobe' } : { kind: 'person' };
    if (worked && item.garment) { item.garment.wears += 1; item.garment.dirty = true; }
    back += 1;
  }
  return back;
}

export function registerFittings(sim: Simulation): void {
  sim.onSchedule(RETURN_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const booking = person && careerOf(person).bookings.find((b) => b.id === item.payload.bookingId);
    if (person && booking) wardrobeBack(person, booking);
  });
  sim.onCommand<{ bookingId: string; outfitIds: string[] }, { allowance: Money }>('career.furnish_wardrobe', (p, { sim: s }) => ({
    allowance: furnish(s, s.player, String(p?.bookingId), Array.isArray(p?.outfitIds) ? p.outfitIds.map(String) : []),
  }));
}

/** When the clothes come back, for a screen. */
export const lentUntil = (booking: Booking): Instant | undefined => booking.furnished?.backAt;
