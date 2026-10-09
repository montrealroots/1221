/**
 * SLATE — how the played-through tools play (from 2026-10-10): the policies `tools/lives.ts` has used since the
 * connected world of 2026-10-09, moved here so the fitness, condition and mastery scenarios (`tools/fitness.ts`,
 * `tools/condition.ts`, `tools/mastery.ts`) play a student the same way, through public commands only.
 */
import { createSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import { newLifeConfig, type NewSaveConfig } from '../src/engine/world/bootstrap';
import { templateById } from '../src/engine/content/coursework';
import { courseworkOf, prepareRefusal, questionsFor } from '../src/engine/systems/coursework';
import { CHOICES, momentsOf } from '../src/engine/systems/classmates';
import { lookAfterOptions, lookAfterRefusal, occupiedAt, suggestedSleep } from '../src/engine/systems/life';
import { MS_HOUR, zonedParts } from '../src/engine/core/time';
import { WHICH, ownWorkRefusal } from '../src/engine/systems/production';
import { coverOn, mayEnroll } from '../src/engine/systems/health';
import { nextPractice } from '../src/ui/workspaces/ProfileWorkspace';
import { practiceRefusal, practicedToday } from '../src/engine/systems/practice';
import { PRACTICE, exerciseFor } from '../src/engine/content/practice';
import { ABILITY_DEFS, type AbilityId } from '../src/engine/content/abilities';
import { abilityOf } from '../src/engine/systems/attributes';

export function life(seed: string, p: Partial<NewSaveConfig>): Simulation {
  return createSave(1, seed, { ...newLifeConfig(), firstName: 'Ada', lastName: 'Cole', pronouns: 'they/them', ...p });
}

/** One evening's work, as `tests/journey-school-year.test.ts` plays it, the careful way. */
export function evening(sim: Simulation) {
  const cw = courseworkOf(sim, sim.player);
  if (!cw) return;
  for (const m of momentsOf(cw).filter((x) => x.status === 'open')) {
    const choice = ({ disagreement: 'both', study: 'yes', help: 'help', apology: 'accept', boundary: 'respect', encouragement: '' } as Record<string, string>)[m.kind] ?? CHOICES[m.kind][0]!.id;
    sim.execute({ kind: 'school.respond', payload: { momentId: m.id, choice } });
  }
  for (const a of cw.assignments.filter((x) => x.status === 'open' || x.status === 'revising')) {
    if (a.feedback && !a.feedback.seen) sim.execute({ kind: 'school.read_feedback', payload: { assignmentId: a.id } });
    for (const k of a.asks ?? []) if (k.status === 'open') sim.execute({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: true } });
    for (const { q, options } of questionsFor(a)) {
      if (a.answers[q.id]) continue;
      const pick = options.find((o) => o.supported) ?? options[0]!;
      sim.execute({ kind: 'school.choose', payload: { assignmentId: a.id, question: q.id, option: pick.id } });
    }
  }
}

/**
 * An hour free, used as a student who keeps up uses one: first the part they're cast in (a note to work, blocking
 * missed, lines not yet known), then a step on the work due soonest. One thing an hour, each taking its own time.
 * Until 2026-10-09's second measurement the player prepared only at eight in the evening, two steps a piece, and never
 * touched the part: its nights went off, and the faculty read the term as work falling short. That was the tool, not
 * the game: a player at eight was often at a call, and the part is the player's to learn.
 */
export function freeHour(sim: Simulation): boolean {
  const person = sim.player;
  if (occupiedAt(sim, sim.now) || (person.awakeSince ?? 0) > sim.now || person.wellbeing.energy < 30) return false;
  for (const which of WHICH) {
    for (const [kind, what] of [['school.work_note', 'note'], ['school.review_blocking', 'blocking'], ['school.learn_part', 'part']] as const) {
      if (!ownWorkRefusal(sim, person, which, what) && sim.execute({ kind, payload: { which } }).ok) return true;
    }
  }
  const cw = courseworkOf(sim, person);
  const open = (cw?.assignments ?? []).filter((x) => x.status === 'open' || x.status === 'revising')
    .sort((x, y) => (x.status === 'revising' ? x.revision!.dueOn : x.dueOn).localeCompare(y.status === 'revising' ? y.revision!.dueOn : y.dueOn));
  for (const a of open) {
    const act = templateById(a.template)!.activities.find((x) => x.dim !== 'partner' && (a.prep[x.dim] ?? 0) < 0.95 && !prepareRefusal(sim, person, a, x.id));
    if (act && sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: act.id } }).ok) return true;
  }
  return false;
}

/**
 * A free hour the practicing player spends on themselves (from 2026-10-09): stressed, an hour unwinding (an hour of
 * the restful interest the Profile suggested until the owner removed the interests on 2026-10-10); else practice on
 * what the last work was held back by most, else the ability furthest from full.
 */
export function practiceHour(sim: Simulation): boolean {
  const person = sim.player;
  if (occupiedAt(sim, sim.now) || (person.awakeSince ?? 0) > sim.now || person.wellbeing.energy < 40) return false;
  if (person.wellbeing.stress > 45) {
    if (!lookAfterRefusal(sim, 'unwind') && sim.execute({ kind: 'life.look_after', payload: { action: 'unwind' } }).ok) return true;
  }
  if (practicedToday(sim, person) >= PRACTICE.dailyHours) return false;
  const limit = nextPractice(person);
  const target = limit?.what ?? ABILITY_DEFS.map((d) => d.id).filter((id) => exerciseFor(id)).sort((a, b) => abilityOf(sim, person, a) - abilityOf(sim, person, b))[0];
  const e = target ? exerciseFor(target as AbilityId) : undefined;
  if (e && !practiceRefusal(sim, person, e)) return sim.execute({ kind: 'practice.exercise', payload: { exercise: e.id } }).ok;
  return false;
}

/** Cover kept, as a graduate keeps it: with none, enrolled where the papers allow (`mayEnroll`), checked at noon. */
export function keepCovered(sim: Simulation) {
  if (coverOn(sim.player, sim.now) || !mayEnroll(sim.player, sim.now).ok) return;
  sim.execute({ kind: 'health.enroll', payload: {} });
}

/** What the menu puts first and urgent, done; nothing done that isn't. */
export function lookAfter(sim: Simulation) {
  for (let n = 0; n < 3; n += 1) {
    const top = lookAfterOptions(sim)[0];
    if (!top || top.refused || !top.urgent) return;
    if (sim.execute({ kind: 'life.look_after', payload: { action: top.action } }).error) return;
  }
}


/**
 * One hour of an attentive student, as `tools/lives.ts` plays one (from 2026-10-10, for the scenario tools): what the
 * menu puts first and urgent, cover at noon, the evening's work at eight in New Haven, a free hour used from three
 * (from ten at the weekend) to ten, and to bed from eleven. `extra` is the scenario's own use of an hour: at seven
 * before classes, and in a free hour the school's work didn't take, as `tools/lives.ts`'s practicing student uses
 * one; it returns true when it spent the hour.
 */
export function attentiveHour(sim: Simulation, extra?: (hour: number, weekend: boolean) => boolean): void {
  const p = zonedParts(sim.now, sim.zone);
  const weekend = [0, 6].includes(new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay());
  const awake = (sim.player.awakeSince ?? 0) <= sim.now;
  lookAfter(sim);
  if (extra && awake && p.hour === 7 && extra(p.hour, weekend)) return;
  if (p.hour === 12) keepCovered(sim);
  if (p.hour === 20 && sim.player.currentLocationId === 'us-ct-newhaven') evening(sim);
  if (p.hour >= (weekend ? 10 : 15) && p.hour < 22 && freeHour(sim)) return;
  if (extra && awake && p.hour >= (weekend ? 10 : 15) && p.hour < 22 && extra(p.hour, weekend)) return;
  if ((p.hour >= 23 || p.hour < 5) && (sim.player.awakeSince ?? 0) <= sim.now && sim.execute({ kind: 'life.sleep', payload: { hours: suggestedSleep(sim).hours } }).ok) return;
  sim.advanceTo(sim.now + MS_HOUR);
}
