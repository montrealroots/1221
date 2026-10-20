/**
 * A classmate's answers read later (from 2026-10-10): an invitation turned down twice stops them asking for a while;
 * a classmate you helped with their lines asks you in turn; a boundary accepted lifts sooner than one pushed back on.
 * Each through `school.respond` and the day's own draw of moments (`classMoment`), against a twin that answered the
 * other way, across a reload, an answer given once.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CLASS, MOMENT_KIND, boundaryLiftsAfter, classMoment, keptWith, momentsOf, owesYouLines, personOf, stoppedAsking, type Moment } from '@/engine/systems/classmates';
import { courseworkOf, mateRecord } from '@/engine/systems/coursework';

const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

/** TEST SETUP: only the first classmate met, cares about `priority`; nothing on the calendar in the way. */
function onlyOne(seed: string, priority: 'craft' | 'career') {
  const sim = student(seed);
  for (const i of sim.universe.scheduled) if (i.status === 'pending' && i.requiresPlayer) sim.timeline.cancel(i.id, sim.now);
  sim.player.school!.classmates.forEach((m, i) => { mateRecord(m).met = i === 0 ? sim.now : undefined; });
  personOf(sim.player.school!.classmates[0]!).priority = priority;
  return sim;
}
/** TEST SETUP: a moment of a kind from the first classmate, as the day's draw makes one (kept on them too). */
function bring(sim: Simulation, kind: Moment['kind'], id: string, extra: Partial<Moment> = {}) {
  const mate = sim.player.school!.classmates[0]!;
  const m = { id, mate: 0, kind, at: sim.now, until: sim.now + MS_DAY, status: 'open', text: 'test', ...extra } as Moment;
  momentsOf(courseworkOf(sim, sim.player)!).push(m);
  (personOf(mate).moments ??= []).unshift({ at: sim.now, kind });
  sim.schedule({ at: m.until, kind: MOMENT_KIND, label: 'Answer', category: 'school', priority: 33, requiresPlayer: false, payload: { personId: sim.player.id, momentId: id } });
}
/** The day's draw over forty class days at this moment: the kinds the first classmate brings. */
function draws(sim: Simulation): string[] {
  const kinds: string[] = [];
  for (let d = 0; d < 40; d += 1) {
    // Forty distinct class days, each its own draw; a moment drawn is let lapse and taken off the record so the next
    // day's draw isn't held back by the same-kind wait, which this isn't testing.
    const m = classMoment(sim, sim.player, { year: 2026, month: 9 + Math.floor(d / 20), day: (d % 20) + 1 });
    if (m) { kinds.push(`${m.kind}:${m.text}`); m.status = 'lapsed'; (personOf(sim.player.school!.classmates[0]!).moments ?? []).shift(); }
  }
  return kinds;
}

describe('an invitation to run lines turned down twice', () => {
  it('stops the classmate asking for a while; said yes, they go on asking', () => {
    const run = (answer: 'no' | 'yes') => {
      let sim = onlyOne(`gap-study-${answer}`, 'craft');
      for (const n of [1, 2]) {
        bring(sim, 'study', `s${n}`, { when: sim.now + 2 * MS_DAY + n * MS_DAY });
        sim.must({ kind: 'school.respond', payload: { momentId: `s${n}`, choice: answer } });
        expect(sim.execute({ kind: 'school.respond', payload: { momentId: `s${n}`, choice: answer } }).error).toBe('You’ve answered it.');
        // Each its own day, past the same-kind wait, as the record would have them.
        for (const m of personOf(sim.player.school!.classmates[0]!).moments!) m.at -= (CLASS.sameKindDays + 1) * MS_DAY;
      }
      sim = reload(sim);
      return { stopped: stoppedAsking(sim.player.school!.classmates[0]!, sim.now), invited: draws(sim).some((k) => k.startsWith('study:')) };
    };
    expect(run('no')).toEqual({ stopped: true, invited: false });
    expect(run('yes')).toEqual({ stopped: false, invited: true });
  });
});

describe('a classmate you helped with their lines', () => {
  it('asks you to run lines in turn, though they care most about getting seen; one you turned away doesn’t', () => {
    const run = (answer: 'help' | 'no') => {
      let sim = onlyOne(`gap-help-${answer}`, 'career');
      bring(sim, 'help', 'h1');
      sim.must({ kind: 'school.respond', payload: { momentId: 'h1', choice: answer } });
      for (const m of personOf(sim.player.school!.classmates[0]!).moments!) m.at -= (CLASS.sameKindDays + 1) * MS_DAY;
      sim = reload(sim);
      const mate = sim.player.school!.classmates[0]!;
      return { owes: owesYouLines(mate, sim.now), invitation: draws(sim).find((k) => k.startsWith('study:')) };
    };
    const helped = run('help');
    expect(helped.owes).toBe(true);
    // In their voice (from 2026-10-20, brief 17): one under pressure to be seen offers an hour, “…: you ran theirs when they were behind.”
    expect(helped.invitation).toMatch(/[Yy]ou ran theirs when they were behind\./);
    const refused = run('no');
    expect(refused.owes).toBe(false);
    expect(refused.invitation).toBeUndefined();
  });
});

describe('a boundary', () => {
  it('accepted lifts after two rehearsals kept; pushed back on, after four', () => {
    for (const [answer, after] of [['respect', CLASS.boundary.liftAfterKept.accepted], ['argue', CLASS.boundary.liftAfterKept.pushedBack]] as const) {
      let sim = onlyOne(`gap-boundary-${answer}`, 'craft');
      bring(sim, 'boundary', 'b1');
      sim.must({ kind: 'school.respond', payload: { momentId: 'b1', choice: answer } });
      sim = reload(sim);
      const mate = sim.player.school!.classmates[0]!;
      expect(boundaryLiftsAfter(personOf(mate).boundary!)).toBe(after);
      for (let k = 1; k < after; k += 1) keptWith(mate);
      expect(personOf(mate).boundary).toBeDefined();
      keptWith(mate);
      expect(personOf(mate).boundary).toBeUndefined();
    }
  });

  it('set before the answer was kept lifts after three, as it did', () => {
    const sim = onlyOne('gap-boundary-legacy', 'craft');
    const mate = sim.player.school!.classmates[0]!;
    // LEGACY STATE: a boundary from a save written before 2026-10-10, with no record of how it was taken.
    personOf(mate).boundary = { since: sim.now, keptSince: 0 };
    expect(boundaryLiftsAfter(personOf(mate).boundary!)).toBe(CLASS.boundary.liftAfterKept.before);
  });
});
