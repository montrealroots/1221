/**
 * The teaching, held to the two things that make it a feature and not decoration.
 *
 * **Coverage.** Every command a player can issue is explained by some lesson. The
 * list is not maintained here: it is read off the engine's own command registry, so
 * the day somebody registers a thirty-third command this fails and names it. A
 * tutorial that is finished today and silently incomplete in a month is the normal
 * outcome, and this is the only thing that prevents it.
 *
 * **Reachability.** Every lesson fires on a career somebody actually plays. A
 * lesson whose condition can never be true is exactly the shape THE ONE RULE is
 * about — declared, plausible, and read by nothing — and the only way to know is to
 * play the game and watch. `tools/tutorial.mjs` does the long version across many
 * seeds; this does enough of it to fail a build.
 *
 * And one thing that is a claim the docstrings make and would otherwise go
 * unchecked: **the teaching changes nothing.** Two careers from one seed, one with
 * it on and one with it off, have to come out identical. If they do not, the
 * tutorial is a game mechanic pretending to be help.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { LESSONS, LESSON_BY_ID, LESSON_IDS, STRANDS, LESSONS_A_WEEK } from '@/engine/content/tutorial';
import { WHEN, lessonsDue, theLessonWorld, theTeachingWeek, teaching, seen } from '@/engine/world/tutorial';
import { playACareer } from './played';

/** Every command the engine actually registers, asked of the engine. */
function registeredCommands(): string[] {
  const sim = quickSave({}, 'tutorial-commands');
  return [...(sim as unknown as { commandHandlers: Map<string, unknown> }).commandHandlers.keys()].sort();
}

describe('the lessons themselves', () => {
  it('has one, and each is a whole sentence of a thing', () => {
    expect(LESSONS.length).toBeGreaterThan(20);
    for (const lesson of LESSONS) {
      expect(lesson.id, 'a lesson with no id').toMatch(/^[a-z][a-z-]*$/);
      expect(lesson.title.length, `${lesson.id} has no title`).toBeGreaterThan(8);
      // Long enough to say what the thing is, what it costs and what it decides.
      // A one-line lesson is a label, and this game already labels everything.
      expect(lesson.body.length, `${lesson.id}'s body is too short to teach anything`).toBeGreaterThan(120);
      expect(lesson.importance, `${lesson.id} has no importance`).toBeGreaterThan(0);
      expect(STRANDS.some((one) => one.id === lesson.strand), `${lesson.id} is in no strand`).toBe(true);
    }
  });

  it('gives every lesson exactly one condition, and every condition a lesson', () => {
    // Both directions. A lesson with no condition can never fire and a condition
    // with no lesson is a sentence nothing says, and each is silent.
    for (const lesson of LESSONS) {
      expect(WHEN[lesson.id], `${lesson.id} has no condition, so it can never be said`).toBeDefined();
    }
    for (const id of Object.keys(WHEN)) {
      expect(LESSON_BY_ID[id], `there is a condition for '${id}' and no lesson with that id`).toBeDefined();
    }
  });

  it('has no id twice and no prerequisite that does not exist', () => {
    expect(new Set(LESSON_IDS).size).toBe(LESSON_IDS.length);
    for (const lesson of LESSONS) {
      for (const need of lesson.after ?? []) {
        expect(LESSON_BY_ID[need], `${lesson.id} waits for '${need}', which is not a lesson`).toBeDefined();
        expect(need, `${lesson.id} waits for itself`).not.toBe(lesson.id);
      }
    }
  });

  it('cannot deadlock on its own prerequisites', () => {
    // A cycle in `after` is a set of lessons none of which can ever be first, so
    // none of them is ever said. Walked rather than reasoned about, because two
    // lessons each waiting for the other is easy to write and invisible to read.
    const seenIn = new Map<string, number>();
    const walk = (id: string, path: string[]): void => {
      if (path.includes(id)) throw new Error(`Lessons wait on each other in a circle: ${[...path, id].join(' → ')}`);
      if (seenIn.has(id)) return;
      seenIn.set(id, 1);
      for (const need of LESSON_BY_ID[id]?.after ?? []) walk(need, [...path, id]);
    };
    expect(() => { for (const id of LESSON_IDS) walk(id, []); }).not.toThrow();
  });

  it('teaches every command the engine registers', () => {
    const taught = new Set(LESSONS.flatMap((one) => one.teaches));
    const registered = registeredCommands();
    const untaught = registered.filter((kind) => !taught.has(kind));
    expect(
      untaught,
      `${untaught.length} of ${registered.length} commands have no lesson explaining them: `
      + `${untaught.join(', ')}. Every command a player can issue needs a lesson, or the player `
      + 'has to already know the game to find it.',
    ).toEqual([]);
  });

  it('does not claim to teach a command that does not exist', () => {
    const registered = new Set(registeredCommands());
    for (const lesson of LESSONS) {
      for (const kind of lesson.teaches) {
        expect(
          registered.has(kind),
          `${lesson.id} says it teaches '${kind}', which the engine does not register. `
          + 'Either the name is wrong or the command was renamed and this was not.',
        ).toBe(true);
      }
    }
  });
});

describe('the teaching over a career', () => {
  it('says one thing at a time', () => {
    const sim = quickSave({}, 'tutorial-pace');
    const said = theTeachingWeek(sim);
    expect(said.length).toBeLessThanOrEqual(LESSONS_A_WEEK);
    // And the notification it raised is a real one on the real list.
    expect(sim.universe.notifications.filter((one) => one.refType === 'lesson').length).toBe(said.length);
  });

  it('never says the same thing twice', () => {
    const sim = quickSave({}, 'tutorial-once');
    const all: string[] = [];
    for (let i = 0; i < 60; i += 1) all.push(...theTeachingWeek(sim).map((one) => one.id));
    expect(new Set(all).size).toBe(all.length);
  });

  it('holds a lesson back until what it waits for has been said', () => {
    const sim = quickSave({}, 'tutorial-order');
    for (let i = 0; i < 40; i += 1) theTeachingWeek(sim);
    for (const lesson of LESSONS) {
      if (!seen(sim, lesson.id)) continue;
      for (const need of lesson.after ?? []) {
        expect(seen(sim, need), `${lesson.id} was said before '${need}'`).toBe(true);
      }
    }
  });

  it('stops entirely when the player switches it off, and starts again when asked', () => {
    const sim = quickSave({}, 'tutorial-off');
    sim.execute({ kind: 'learning.set', payload: { off: true } });
    expect(teaching(sim)).toBe(false);
    for (let i = 0; i < 20; i += 1) expect(theTeachingWeek(sim)).toEqual([]);
    expect(sim.universe.notifications.filter((one) => one.refType === 'lesson')).toEqual([]);

    sim.execute({ kind: 'learning.set', payload: { off: false } });
    expect(teaching(sim)).toBe(true);
    expect(theTeachingWeek(sim).length).toBe(1);
  });

  it('forgets everything when the player asks to be taught again', () => {
    const sim = quickSave({}, 'tutorial-again');
    for (let i = 0; i < 10; i += 1) theTeachingWeek(sim);
    const had = Object.keys(sim.universe.tutorial?.seen ?? {}).length;
    expect(had).toBeGreaterThan(0);
    const out = sim.execute<{ ok: boolean; forgotten: number }>({ kind: 'learning.again', payload: {} });
    expect(out.value?.forgotten).toBe(had);
    expect(Object.keys(sim.universe.tutorial?.seen ?? {})).toEqual([]);
    expect(teaching(sim)).toBe(true);
  });

  it('changes nothing about the career it is teaching', () => {
    // The claim every docstring in this feature makes. Same seed, one career with
    // the teaching on and one with it off: if the outcomes differ, the tutorial is
    // a mechanic wearing help's clothes.
    const taught = quickSave({}, 'tutorial-neutral');
    const alone = quickSave({}, 'tutorial-neutral');
    alone.execute({ kind: 'learning.set', payload: { off: true } });

    const a = playACareer(taught, 3, {});
    const b = playACareer(alone, 3, {});
    expect(a).toEqual(b);

    // And the money, which is the part a hidden mechanic would show up in.
    const balances = (sim: typeof taught) => Object.values(sim.universe.accounts)
      .map((one) => `${one.name}:${one.balance}`).sort();
    expect(balances(taught)).toEqual(balances(alone));
    expect(taught.ledger.audit()).toEqual([]);
  });

  it('reaches most of its lessons on a career somebody plays', () => {
    // Reachability, at the size a test can afford. `tools/tutorial.mjs` plays
    // twenty-five years across many seeds and reports every lesson that never
    // fired; this plays five and asserts a floor, so a condition that becomes
    // unreachable fails a build rather than waiting for somebody to run the tool.
    // Read off the save rather than off the return of a manual call. The teaching
    // is already armed on the weekly schedule, so a career plays it without help —
    // and the first version of this counted only what its own extra calls returned,
    // which was the nine lessons the schedule had not already got to. The save is
    // the only honest record of what was said.
    const sim = quickSave({}, 'tutorial-reach');
    playACareer(sim, 5, {});
    const fired = new Set(Object.keys(sim.universe.tutorial?.seen ?? {}));
    expect(
      fired.size,
      `only ${fired.size} of ${LESSONS.length} lessons fired in five played years: `
      + `${LESSONS.filter((one) => !fired.has(one.id)).map((one) => one.id).join(', ')} did not.`,
    ).toBeGreaterThanOrEqual(12);
  });
});

describe('the lesson world', () => {
  it('counts a real save without throwing, and counts nothing as nothing', () => {
    const sim = quickSave({}, 'tutorial-world');
    const world = theLessonWorld(sim);
    // A fresh save has a company (the family's) and a house, and nothing made yet.
    expect(world.week).toBe(0);
    expect(world.projects.delivered).toBe(0);
    expect(world.accounts).toBeGreaterThan(0);
    for (const [key, value] of Object.entries(world)) {
      if (typeof value === 'number') {
        expect(Number.isFinite(value), `${key} is ${value}`).toBe(true);
        expect(value, `${key} is negative`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('is read by every condition, with nothing on it that nothing asks about', () => {
    // THE ONE RULE, applied to the one shape in this feature that could quietly
    // grow dead fields. Every key on the lesson world has to be touched by at
    // least one condition, which is checked by reading the conditions' source —
    // crude, and it caught three dead fields when this feature was written.
    const sim = quickSave({}, 'tutorial-fields');
    const world = theLessonWorld(sim);
    const source = Object.values(WHEN).map((fn) => fn.toString()).join('\n');
    for (const key of Object.keys(world)) {
      expect(
        source.includes(`.${key}`),
        `nothing in WHEN reads the lesson world's '${key}', so counting it is decoration`,
      ).toBe(true);
    }
  });

  it('offers nothing when everything has been said', () => {
    const sim = quickSave({}, 'tutorial-exhausted');
    const held = sim.universe.tutorial ?? { seen: {}, dismissed: false };
    for (const id of LESSON_IDS) held.seen[id] = sim.now;
    sim.universe.tutorial = held;
    expect(lessonsDue(sim, theLessonWorld(sim))).toEqual([]);
  });
});
