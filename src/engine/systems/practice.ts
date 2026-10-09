/**
 * SLATE — deliberate practice (from the connected attributes of 2026-10-09).
 *
 * `practice.exercise` is an hour on one exercise (`content/practice.ts`): the
 * hour passes, it costs energy, and the ability or technique it trains grows
 * by deliberate practice (`develop`), which goes on past where classes level
 * off. What stops it being farmed: the same exercise again the same day
 * gives half what it gave before, a day's practice stops counting at four
 * hours, and nothing grows from anything but the hour itself (opening a
 * screen, saving and loading, or asking again is no hour). Discipline grows
 * once for each day practised.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatTime, zonedParts } from '../core/time';
import { EXERCISE_BY_ID, PRACTICE, type Exercise } from '../content/practice';
import { alreadyApplied, develop, developmentOf, levelOf, markApplied, targetId } from './attributes';
import { focusAt } from './school';
import { SPENT, commitmentWithin, occupiedAt } from './life';
import { exerts } from './body';
import { trainingRefusal } from './injury';
import { inHospital } from './health';

/** Today's date at home, the key a day's practice is counted under. */
const today = (sim: Simulation) => { const p = zonedParts(sim.now, sim.homeZone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

/** The hours practised today, from the development ledger's own count. */
export function practicedToday(sim: Simulation, person: Person): number {
  const led = developmentOf(person);
  return led.practice?.day === today(sim) ? led.practice.hours : 0;
}

/** Why an exercise can't be done now, or nothing. */
export function practiceRefusal(sim: Simulation, person: Person, e: Exercise | undefined): string | undefined {
  if (!e) return 'There’s no such exercise.';
  if (inHospital(person, sim.now)) return 'Not from a hospital bed.';
  const asleep = person.awakeSince !== undefined && person.awakeSince > sim.now;
  if (asleep) return 'You’re asleep.';
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  const ahead = commitmentWithin(sim, PRACTICE.minutes);
  if (ahead) return ahead;
  if (practicedToday(sim, person) >= PRACTICE.dailyHours) return `You’ve practiced ${PRACTICE.dailyHours} hours today: past that, more stops helping. Tomorrow.`;
  if (e.feet) {
    if (person.wellbeing.energy < SPENT) return 'You’re too tired to work on your feet. Sleep first.';
    const hurt = trainingRefusal(person, sim.now);
    if (hurt) return hurt;
  }
  if (e.partnered && !person.school?.classmates.length) return 'It takes a classmate, and you have no class to ask.';
  return undefined;
}

/** An hour's practice: the time, the energy, and what it grew. */
export function practiceHour(sim: Simulation, person: Person, e: Exercise): { gained: number; level: number; discipline: number } {
  const focus = focusAt(sim, person, sim.now);
  sim.advanceTo(sim.now + PRACTICE.minutes * 60_000);
  exerts(person, e.feet ? PRACTICE.met.feet : PRACTICE.met.desk, PRACTICE.minutes / 60);
  person.wellbeing.energy = Math.max(0, person.wellbeing.energy - (e.feet ? PRACTICE.energy.feet : PRACTICE.energy.desk));
  const gained = develop(sim, person, e.trains, { weight: 1, focus, deliberate: true, source: `practice:${e.id}` });
  // The day's hours, and discipline once for a day kept.
  const led = developmentOf(person);
  const day = today(sim);
  const first = led.practice?.day !== day;
  led.practice = { day, hours: (first ? 0 : led.practice!.hours) + PRACTICE.minutes / 60, days: (led.practice?.days ?? 0) + (first ? 1 : 0), ...(first ? { last: day } : { last: led.practice!.last }) };
  // Deliberate, so a habit kept up reaches its full and doesn't stall a hair under it (from 2026-10-10).
  const discipline = first ? develop(sim, person, 'discipline', { weight: PRACTICE.disciplineDay, focus: 1, deliberate: true, source: 'practice-day' }) : 0;
  return { gained, level: levelOf(sim, person, targetId(e.trains)), discipline };
}

export function registerPractice(sim: Simulation): void {
  sim.onCommand<{ exercise: string; actionId?: string }, { gained: number; level: number; discipline: number }>('practice.exercise', (p, { sim: s }) => {
    const person = s.player;
    const e = EXERCISE_BY_ID[String(p?.exercise)];
    const no = alreadyApplied(person, p?.actionId) ?? practiceRefusal(s, person, e);
    if (no) throw new CommandError(no);
    markApplied(person, p?.actionId);
    return practiceHour(s, person, e!);
  });
}
