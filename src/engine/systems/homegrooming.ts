/**
 * SLATE — a haircut at home with clippers, and nails trimmed (the master
 * plan's §31h, from 2026-10-06; the figures in `content/homegrooming.ts`).
 * Until then a haircut was had only at a barber's or a salon, and nails
 * weren't kept.
 *
 * **A haircut at home** needs clippers of their own, bought where a kit's
 * price was read, and takes the 45 minutes SLATE gives a salon service whose
 * list names none (`GROOMING`). It is a haircut as a barber's is: it lifts
 * the mood by how due one was, and the next is due from it (`groomingLift`,
 * `groomedAt`); only the money differs.
 *
 * **Nails** grow by the published rates, and a trim is due when they've grown
 * what one takes off. Trimmed at home, they're due again from then. What
 * long nails do to a life isn't sized by anything SLATE has read, so a nail
 * due is only shown, and how long a trim takes isn't kept.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatTime, type Instant } from '../core/time';
import { clamp } from '../core/rng';
import type { Money } from '../core/money';
import { CITIES } from '../content/geography';
import { CLIPPER_KITS, NAILS, type ClipperKit } from '../content/homegrooming';
import { inSaveMoney } from './banking';
import { spend } from './household';
import { addItem, homeKeyOf, itemsOf } from './items';
import { atHome } from './dwelling';
import { GROOMING, groomingLift } from './hygiene';
import { occupiedAt } from './life';
import { personalityOf } from './personality';

const MONTH_MS = (365.2425 / 12) * MS_DAY;

/** The clipper kit sold where they are, with its price in the save's money; nothing where none was priced. */
export function clipperOffer(sim: Simulation, person: Person): { kit: ClipperKit; cost: Money } | undefined {
  const kit = CLIPPER_KITS.find((k) => k.country === CITIES.get(person.currentLocationId)?.countryId);
  return kit ? { kit, cost: inSaveMoney(sim, Math.round(kit.price * 100), kit.currency) } : undefined;
}

/** Whether they own clippers. */
export const hasClippers = (person: Person): boolean => itemsOf(person).some((i) => i.clippers);

/** Why clippers can't be bought here, or nothing. */
export function clipperRefusal(sim: Simulation, person: Person): string | undefined {
  if (hasClippers(person)) return 'You have clippers already.';
  if (!person.home || person.home.kind === 'sofa') return 'Clippers are kept at a home of your own.';
  if (!clipperOffer(sim, person)) return 'SLATE has no published price for a clipper kit here.';
  return undefined;
}

/** Why they can't cut their own hair now, or nothing. */
export function homeCutRefusal(person: Person): string | undefined {
  if (!hasClippers(person)) return 'You need clippers of your own.';
  if (!atHome(person)) return 'Your clippers are at home.';
  return undefined;
}

/** When nails are next due a trim: from the last trim, or from when the life began, by the growth to what a trim takes off. */
export function nailsDue(person: Person, which: 'fingers' | 'toes'): Instant {
  const last = person.nailsAt?.[which] ?? person.createdAt;
  return last + (NAILS.trimMm[which] / NAILS.growthMmMonth[which]) * MONTH_MS;
}

export function registerHomeGrooming(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { paid: Money }>('hygiene.buy_clippers', (_p, { sim: s }) => {
    const person = s.player;
    const no = clipperRefusal(s, person);
    if (no) throw new CommandError(no);
    const { kit, cost } = clipperOffer(s, person)!;
    if (!spend(s, person, cost, `${kit.retailer}, ${kit.name}`, 'personal')) throw new CommandError('The payment didn’t go through.');
    const home = homeKeyOf(person.home);
    addItem(s, person, { kind: 'grooming:clippers', label: kit.name, quantity: 1, condition: 1, at: home && person.home!.cityId === person.currentLocationId ? { kind: 'home', home, spot: 'bathroom' } : { kind: 'person' }, acquiredAt: s.now, paid: cost, clippers: true });
    return { paid: cost };
  });

  sim.onCommand<Record<string, never>, { doneAt: number }>('hygiene.cut_hair', (_p, { sim: s }) => {
    const person = s.player;
    const no = homeCutRefusal(person);
    if (no) throw new CommandError(no);
    const busy = occupiedAt(s, s.now);
    if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.`);
    s.advanceTo(s.now + GROOMING.minutes * 60_000);
    person.wellbeing.morale = clamp(person.wellbeing.morale + groomingLift(person, s.now) * personalityOf(person, 'moraleSwing'), 0, 100);
    person.groomedAt = s.now;
    return { doneAt: s.now };
  });

  sim.onCommand<{ which?: 'fingers' | 'toes' }, { due: Instant }>('hygiene.trim_nails', (p, { sim: s }) => {
    const person = s.player;
    if (!atHome(person)) throw new CommandError('Nails are trimmed at home.');
    const which = p?.which === 'toes' ? 'toes' : 'fingers';
    person.nailsAt = { ...person.nailsAt, [which]: s.now };
    return { due: nailsDue(person, which) };
  });
}
