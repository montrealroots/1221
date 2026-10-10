/**
 * The record of runs the chair reads (from 2026-10-10): School, Rep, Cabaret and Summer nights kept as runs
 * (`noteRun`), read at the next casting once each (`readRuns`), weighted by nights up to a cap and by kind, with the
 * record before carried at half, so a short run can't erase a long one and more runs add evidence, never advantage.
 * The faculty's term evaluation reads the term's School, Rep and Cabaret runs; the Summer Cabaret reaches casting
 * only. TEST SETUP builds runs directly where a whole term's play would be needed; one test plays a Cabaret night
 * through the scheduler.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { CABARET_KIND, ESTIMATE, castScore, evaluate, evenCraft, noteRun, readRuns, type Casting, type Run, type SchoolRecord } from '@/engine/systems/school';

const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const R = ESTIMATE.casting.record;

/** TEST SETUP: a run of `nights` nights delivered at `d` (or missed), as the nights would note it. */
function played(school: SchoolRecord, run: Run & { term?: number }, nights: number, d: number | 'missed', rep = false) {
  for (let n = 0; n < nights; n += 1) noteRun(school, run, rep, n, d === 'missed' ? 'missed' : { delivery: d, quality: 60 });
}
const production = (name: string, term: number): Casting => ({ production: name, role: 'A Lead', kind: 'thesis', term, performed: 0, size: 'lead' });

describe('the chair’s read of the runs since the last casting', () => {
  it('reads a long strong run, then a short weak Cabaret without erasing it, each run once', () => {
    const school = student('runs-blend').player.school!;
    const hedda = production('Hedda Gabler', 0);
    played(school, hedda, 8, 0.95);
    const first = readRuns(school, 1, hedda)!;
    expect(first.delivery).toBeCloseTo(0.95, 3);
    expect(first.size).toBe('lead');
    expect(first.from!.map((f) => f.source)).toEqual(['school']);
    school.lastWork = first;
    const cab = Object.assign(school.cabaret ??= { term: 1, week: '2027-02-04', performed: 0 }, { production: 'The Yale Cabaret', role: 'A Part', size: 'supporting' as const });
    played(school, cab as Run & { term: number }, 2, 0.3);
    const second = readRuns(school, 2, undefined)!;
    // The record before at half its weight (8 × 0.5 = 4) against two Cabaret nights at half (1): 0.95·4 + 0.3·1 over 5.
    expect(second.delivery).toBeCloseTo((0.95 * 4 + 0.3 * 1) / 5, 3);
    expect(second.size).toBe('lead');
    school.lastWork = second;
    // Read again with nothing new: the same delivery, and no run read twice.
    expect(readRuns(school, 3, undefined)!.delivery).toBeCloseTo(second.delivery!, 3);
    expect((school.runs ?? []).every((r) => r.readAtCasting !== undefined)).toBe(true);
  });

  it('holds many runs to an average with its evidence capped: more performances give no advantage', () => {
    const school = student('runs-cap').player.school!;
    for (let k = 0; k < 6; k += 1) played(school, production(`Play ${k}`, k), 8, 1);
    const read = readRuns(school, 6, undefined)!;
    expect(read.delivery).toBe(1);
    expect(read.weight).toBe(R.cap);
    const s = { craft: evenCraft(60), fit: 60 };
    expect(castScore({ ...s, last: read }, {})).toBe(castScore({ ...s, last: { delivery: 1 } }, {}));
  });

  it('reads nights missed out of hospital as nothing delivered, and recovers with a strong run after', () => {
    const school = student('runs-missed').player.school!;
    const run = production('Measure For Measure', 0);
    played(school, run, 4, 0.9);
    played(school, run, 4, 'missed');
    school.lastWork = readRuns(school, 1, run)!;
    expect(school.lastWork.delivery).toBeCloseTo(0.45, 3);
    played(school, production('The Seagull', 1), 8, 0.95, true);
    const after = readRuns(school, 2, undefined)!;
    expect(after.delivery!).toBeGreaterThan(school.lastWork.delivery!);
    expect(after.from!.at(-1)!.source).toBe('rep');
  });

  it('reads a Summer show at casting, and the faculty’s evaluation doesn’t', () => {
    const sim = student('runs-summer');
    const school = sim.player.school!;
    const show: Run = { production: 'Yale Summer Cabaret 2027, Show 1', role: 'A Part', size: 'supporting', nights: { off: 4 } };
    school.summer = { year: 2027, played: [4], until: 0, shows: [show] };
    played(school, show, 4, 0.2);
    expect(school.runs![0]!.source).toBe('summer');
    // The term's evaluation sees no run: its nights were the summer's.
    expect(evaluate(sim, sim.player, 0)!.work).toBeUndefined();
    expect(readRuns(school, 1, undefined)!.from!.map((f) => f.source)).toEqual(['summer']);
  });

  it('reads a save from before the record (LEGACY STATE): its last production’s delivery as that run', () => {
    const school = student('runs-legacy').player.school!;
    const old = { ...production('Hedda Gabler', 0), delivered: { sum: 7.2, n: 8 } } as Casting;
    const read = readRuns(school, 1, old)!;
    expect(read.delivery).toBeCloseTo(0.9, 3);
    expect(read.from!.map((f) => f.what)).toEqual(['Hedda Gabler']);
  });
});

describe('a Cabaret night through the scheduler', () => {
  it('is kept in the record of runs, and survives a reload', () => {
    let sim = student('runs-cabaret');
    const school = sim.player.school!;
    school.cabaret = { term: 0, week: '2026-10-01', performed: 0, production: 'The Yale Cabaret', role: 'A Part', size: 'supporting' };
    sim.player.awakeSince = sim.now;
    sim.schedule({ at: sim.now + 60_000, kind: CABARET_KIND, label: 'Yale Cabaret: Performance', category: 'school', priority: 30, payload: { personId: sim.player.id, call: 'performance', last: false } });
    sim.advanceTo(sim.now + 120_000);
    sim = reload(sim);
    const runs = sim.player.school!.runs ?? [];
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ source: 'cabaret', nights: 1, missed: 0 });
    expect(runs[0]!.delivered).toBeGreaterThan(0);
  });
});
