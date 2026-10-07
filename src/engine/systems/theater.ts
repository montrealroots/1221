/**
 * SLATE — a home theater's screen and seats, owned (the master plan's §43i,
 * from 2026-10-06; `research-lawn-watering.json`'s `homeTheaterKit`).
 *
 * Fixr's $25,000, the average a home theater is priced at, is "a fixed frame
 * screen LED projector with 7.1 speakers and amplifier, professional wiring,
 * and furniture". So the works leave the screen and its projector, and the
 * theater's four seats (Seatcraft's commonest layout, `THEATER`), as things
 * of the owner's at the home: moved, sold or carried off like any other. A
 * film night is held for as many as the seats there are, before the screen
 * (`hostRefusal`), and the screen is a film or television lover's screen at
 * home (`GEAR_FOR`) and a streaming service's (`watchRefusal`). Its
 * projector's draw isn't billed, no wattage having been read. Until
 * 2026-10-06 the theater's four seats were a number and its screen nothing.
 *
 * A theater finished before then is given them at the next day's turn, once.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { THEATER } from '../content/specialrooms';
import { addItem, homeKeyOf, itemsOf } from './items';
import type { OwnedHome } from './homes';

export const SCREEN_KIND = 'theater:screen';
export const SEAT_KIND = 'theater:seat';

/** The theater's screen and seats, given with the works, once. */
export function kitTheater(sim: Simulation, person: Person, owned: OwnedHome): void {
  if (owned.theaterKit || !owned.facts.features.includes('homeTheater')) return;
  const home = `owned:${owned.id}`;
  addItem(sim, person, { kind: SCREEN_KIND, label: 'Home Theater Projector And Screen', quantity: 1, condition: 1, at: { kind: 'home', home, spot: 'floor' }, acquiredAt: sim.now, bulky: true });
  addItem(sim, person, { kind: SEAT_KIND, label: 'Home Theater Seat', quantity: THEATER.seats, condition: 1, at: { kind: 'home', home, spot: 'floor' }, acquiredAt: sim.now, bulky: true });
  owned.theaterKit = true;
}

/** At the home they live in: whether the theater's screen is there, and how many of its seats. */
export function theaterAt(person: Person): { screen: boolean; seats: number } {
  const home = homeKeyOf(person.home);
  const here = itemsOf(person).filter((i) => i.at.kind === 'home' && i.at.home === home);
  return { screen: here.some((i) => i.kind === SCREEN_KIND), seats: here.filter((i) => i.kind === SEAT_KIND).reduce((n, i) => n + i.quantity, 0) };
}

export function registerTheater(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'theater.kit', (_e, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) for (const owned of person.homes ?? []) kitTheater(s, person, owned);
  });
}
