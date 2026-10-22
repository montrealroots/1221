/**
 * No first-time notice comes twice (from 2026-10-21, the owner's brief 20, C2: "no first-time event twice"; the guide
 * area's audit, `docs/verification/audit-2026-10-21/areas/guide/`).
 *
 * The notices the code says once in a life, each found where it's sent and the rule that keeps it to once read:
 * - a new life's arrival: Welcome To The Class Of …, from `enroll` (`systems/school.ts`), sent as the life is made;
 *   Meeting Your Class and Registration And Your Account, orientation's sessions (`systems/coursework.ts`), each a
 *   session on the calendar that runs once; Fall Term 2026 Begins, the term's own start (`TERM_KIND`), once a term;
 * - the degree's: Your Equity Initiation Fee, sent where the union's bills are first made (`equityJoined`,
 *   `systems/propay.ts`), and never where they're there already;
 * - the record's first milestones (`first-strong`, `first-exceptional`, `first-mastery` in `systems/evaluation.ts`),
 *   each kept once by `first()`.
 * A notice already said and unread isn't said again (`notify` brings it up to now instead); a notice read is out of
 * that, so these are played with every notice read each day, and the save written and opened again each day, where a
 * replay on opening would show.
 *
 * TEST SETUP: the body kept fed and rested as the clock moves (`tended`); a graduate made through the School's own
 * Commencement handler (`graduate`, tests/fakes/career-work.ts), the degree's notice being what's under test.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { graduate, tended } from './fakes/career-work';

const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, title: RegExp) => sim.universe.notifications.filter((n) => title.test(n.title));

/** Played a day at a time for `days`, every notice read and the save opened again at each day's end. */
function daily(start: Simulation, days: number): Simulation {
  let sim = start;
  for (let d = 0; d < days; d += 1) {
    tended(sim, sim.now + MS_DAY);
    sim.must({ kind: 'world.mark_read', payload: {} });
    sim = reload(sim);
  }
  return sim;
}

describe('the notices said once', () => {
  it('PLAYER JOURNEY: a new life’s arrival notices come once each through its first fortnight, every notice read and the save opened again each day', () => {
    const made = createSave(1, 'b20-guide-firsts', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const sim = daily(made, 14);
    for (const title of [/^Welcome To The Class Of 2029$/, /^Meeting Your Class$/, /^Registration And Your Account$/, /^Fall Term 2026 Begins$/]) {
      expect(titled(sim, title).map((n) => n.title), String(title)).toHaveLength(1);
    }
  });

  it('PLAYER JOURNEY: the degree’s Equity notice comes once: through Commencement, and a month on with every notice read and the save opened again each day', () => {
    const sim = daily(graduate('b20-guide-firsts-degree'), 30);
    expect(titled(sim, /^Your Equity Initiation Fee$/)).toHaveLength(1);
    expect(sim.player.pro!.unionBills!.filter((b) => b.union === 'equity').length).toBeGreaterThan(0);
  });

  it('PLAYER JOURNEY: an older save’s first milestones stay once each through three weeks of its last spring, opened again each day', () => {
    const universe = deserialise(gunzipSync(readFileSync('tests/fixtures/journey-j01-last-term-8283f80c.json.gz')).toString('utf8'));
    const start = loadSave(universe as never);
    const firsts = (s: Simulation) => (s.player.journey?.milestones ?? []).filter((m) => m.kind.startsWith('first-')).map((m) => m.kind);
    expect(firsts(start)).toEqual(['first-strong']);
    const sim = daily(start, 21);
    const seen = firsts(sim);
    expect(seen).toEqual([...new Set(seen)]);
    expect(seen).toContain('first-strong');
  });
});
