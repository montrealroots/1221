/**
 * A life that has ended keeps its clock where it stopped (`systems/mortality.ts`, `Simulation.advanceTo`), so a helper that
 * loops until a later time (`while (sim.now < until) sim.advanceTo(…)`, a hundred and sixty of them across the tests on
 * 2026-10-16) never returns once mortality's draw ends a life on the way: seed jl-17's did on 11 January 2027 at 9:58 PM,
 * and a probe spun on it until it was killed (brief 09's journeys). Here, for every test file (`vitest.config.ts`
 * setupFiles), the clock asked forward again and again on an ended life throws, naming the death, so such a loop fails
 * within a second or two and says why. A single call still returns where the clock stopped, as the engine has it, and so
 * does a bounded loop's every call; no test's own code or assertion is changed, and nothing is skipped or retried.
 */
import { Simulation } from '@/engine/core/simulation';
import { formatDateTime } from '@/engine/core/time';

/**
 * How many calls in a row may find an ended life's clock where it stopped before it's a loop that will never end: a
 * million, far past any bounded loop's count, so a loop that ends on its own still returns and is judged by its own
 * assertions, as it was before; a loop waiting for the clock reaches it in a second or two. It was 100 until later on
 * 2026-10-16, which failed such a bounded loop: `tests/personality.test.ts`'s `aYearAlone`, which read the clock 365
 * times on a 1955 life its seed's mortality had ended on 16 January 2026, eleven days in. From 2026-10-17 (brief 11)
 * that year runs on a seed whose two lives last it, each asserted alive on every day it reads, so no test is known to
 * need the million; it's kept for a bounded loop that does.
 */
export const ENDED_LIFE_CALLS = 1_000_000;

const asked = new WeakMap<Simulation, number>();
const real = Simulation.prototype.advanceTo;

Simulation.prototype.advanceTo = function advanceTo(this: Simulation, target, opts) {
  const ended = this.universe.meta.endedAt;
  if (ended !== undefined && target > this.now) {
    const n = (asked.get(this) ?? 0) + 1;
    asked.set(this, n);
    if (n >= ENDED_LIFE_CALLS) {
      asked.delete(this);
      const who = this.universe.people[this.universe.playerId]?.displayName ?? 'The player';
      throw new Error(`${who}’s life ended on ${formatDateTime(ended, this.zone)}, at ${this.universe.meta.endedAge ?? 'an unknown age'}, and its clock stays there: asked ${n} times to move it to a later time, a loop waiting for the clock would never return.`);
    }
  } else asked.delete(this);
  return real.call(this, target, opts);
};
