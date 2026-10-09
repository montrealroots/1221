/**
 * SLATE — birthdays.
 *
 * Age decides a lot here: what a body can reach, how much a night puts back,
 * and how likely the year is to end the life. The game never marked
 * the day it changed, and nothing on the calendar said when that was. Now the
 * player's birthday is on it every year, at nine in the morning where they
 * live, and the day says the age they've turned.
 *
 * Somebody born on the 29th of February has it on the 28th in other years.
 * Countries differ on which day the law counts; the 28th is a common one.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { CITIES } from '../content/geography';
import { instantFromZoned, zonedParts, type Instant } from '../core/time';
import { END_KIND, ageOn, decideStretch, frailty } from './mortality';
import { healthOf } from './health';

export { ageOn };

export const BIRTHDAY_KIND = 'life.birthday';

/** Their birthday at or after an instant, at nine in the morning where they live. */
export function nextBirthday(sim: Simulation, person: Person, after: Instant): Instant {
  const zone = CITIES.get(person.currentLocationId)?.timeZone ?? sim.homeZone;
  // The date they were born on, where they were born: the instant is kept at
  // three in the morning of it in the home zone.
  const born = zonedParts(person.birthInstant, sim.homeZone);
  const now = zonedParts(after, zone);
  for (let year = now.year; year <= now.year + 2; year += 1) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const day = born.month === 2 && born.day === 29 && !leap ? 28 : born.day;
    const at = instantFromZoned({ year, month: born.month, day, hour: 9 }, zone);
    if (at > after) return at;
  }
  return after + 365 * 86_400_000;
}

/**
 * The next birthday on the calendar, and the year up to it drawn for its end
 * (`systems/mortality.ts`): a birthday is where a life table counts a year.
 */
function schedule(sim: Simulation, person: Person, after: Instant): void {
  const at = nextBirthday(sim, person, after);
  sim.schedule({
    at, kind: BIRTHDAY_KIND, label: 'Your Birthday', category: 'personal',
    priority: 20, payload: { personId: person.id },
  });
  decideStretch(sim, person, after, at);
  healthOf(person).endBand = bandOf(sim, person);
}

/**
 * The year's odds are drawn at a birthday, from the body as it is then
 * (`frailty`). A body that falls, or recovers, a quarter-band from that
 * draws the rest of the year again from its state now: the end pending is
 * taken off and the stretch to the birthday drawn afresh. Until 2026-09-27 a
 * collapse the day after a birthday changed nothing for a year.
 */
export const END_BAND = 0.25;

const bandOf = (sim: Simulation, person: Person) => Math.round(frailty(person.wellbeing.condition, (sim.now - person.birthInstant) / (365.2425 * 86_400_000)) / END_BAND) * END_BAND;

export function redrawIfChanged(sim: Simulation, person: Person): void {
  const h = healthOf(person);
  const band = bandOf(sim, person);
  if (h.endBand === undefined || band === h.endBand) { h.endBand = band; return; }
  h.endBand = band;
  const birthday = sim.universe.scheduled.find((one) => one.kind === BIRTHDAY_KIND && one.status === 'pending' && one.payload.personId === person.id);
  if (!birthday) return;
  // The year's drawn end is redrawn; a starved body's end (`starvedPastTheLimit`) isn't a draw, and stands.
  for (const one of sim.universe.scheduled) if (one.kind === END_KIND && one.status === 'pending' && one.payload.personId === person.id && one.payload.cause !== 'starved') sim.timeline.cancel(one.id, sim.now);
  decideStretch(sim, person, sim.now, birthday.at);
}

export function registerBirthdays(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'life.end_band', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) redrawIfChanged(s, person);
  });

  sim.onSchedule(BIRTHDAY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    if (!person) return;
    if (s.universe.meta.endedAt === undefined) {
      const age = ageOn(s, person, item.at);
      s.notify({
        category: 'personal',
        title: `Happy Birthday: ${age}`,
        body: `You're ${age} today.`,
        importance: 55,
      });
    }
    schedule(s, person, item.at);
  });
}

/** The player's next birthday on the calendar, where it isn't. */
export function armBirthdays(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  const due = sim.universe.scheduled.some((one) => one.kind === BIRTHDAY_KIND && one.status === 'pending');
  if (!due) schedule(sim, player, sim.now);
}
