/**
 * An older save's credits dated by their runs (limitations pass, 2026-10-11). Until the acceptance pass of 2026-10-11
 * a credit took the year it was written down, at the next casting: a fall's run was dated the January after, and a run
 * before a leave a year later. A save from then keeps those years; opened now, each is dated by its term's casting
 * notice, once, and one with no notice left keeps its year and says so. The résumé shows the year, which nothing read
 * until then.
 *
 * The first year is played by the attentive policy (`tools/policy.ts`). FIXTURE: its credits put back to the year the
 * code before the acceptance pass would have written them after a year's leave, and one credit with no casting notice
 * added, by hand.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, migrate } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { redateCredits, type SchoolRecord } from '@/engine/systems/school';
import { attentiveHour, life } from '../tools/policy';

const at = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, 'America/New_York');
/** Opened as a slot is: brought forward (`migrate`), then loaded. */
let steps: string[] = [];
const reload = (sim: Simulation) => { const u = deserialise(serialise(sim.universe)) as never; steps = migrate(u).steps; return loadSave(u); };

describe('an older save’s credits', () => {
  it('are dated by their terms’ casting notices once, and one with no notice keeps its year, said', () => {
    let sim = life('credits-dated', { homeRegionId: 'us-ny-newyork' });
    while (sim.now < at(2027, 9, 10)) attentiveHour(sim);
    const school = () => sim.player.school!;
    const played = (school().credits ?? []).filter((c) => c.kind !== 'cabaret' && c.kind !== 'summer');
    expect(played.length).toBeGreaterThan(0);
    expect(played.every((c) => c.year === 2027)).toBe(true);
    expect(school().creditsDated).toBe(true);

    // FIXTURE: as the code before wrote them after a year away, and one with nothing to date it, from before.
    delete school().creditsDated;
    for (const c of played) c.year = 2028;
    school().credits!.unshift({ production: 'A Production With No Notice', role: 'A Part', kind: 'project', year: 2026, wentOn: 3 });
    school().credits!.push({ production: played[0]!.production, role: played[0]!.role, kind: played[0]!.kind, year: 2031, wentOn: 1 });

    sim = reload(sim);
    const credits = school().credits!;
    expect(credits[0]).toMatchObject({ production: 'A Production With No Notice', year: 2026, yearAsKept: true });
    expect(credits.slice(1, -1).map((c) => c.year)).toEqual(played.map(() => 2027));
    expect(credits.slice(1, -1).every((c) => c.yearAsKept === undefined)).toBe(true);
    // Three years past its casting is no run of it: kept, and said.
    expect(credits.at(-1)).toMatchObject({ year: 2031, yearAsKept: true });
    expect(school().creditsDated).toBe(true);
    expect(steps).toContain(`Dated ${played.length === 1 ? '1 credit by its run, not the year it was' : `${played.length} credits by their runs, not the year they were`} written down.`);
    expect(steps).toContain('Kept the year of 2 credits with no casting notice left to date them.');

    // Opened again: nothing dated twice.
    const once = JSON.stringify(school().credits);
    sim = reload(sim);
    expect(JSON.stringify(school().credits)).toBe(once);
    expect(steps.some((s) => /credit/.test(s))).toBe(false);
  }, 180_000);

  it('are matched in the order they were written, each notice once, by production and part, within two years after it', () => {
    // FIXTURE: casting notices and credits by hand, the rule read alone.
    const notice = (y: number, m: number, title: string, body: string) => ({ at: at(y, m, 5), title: `Cast: ${title}`, body });
    const notices = [
      notice(2027, 1, 'Carlotta Festival Of New Plays', 'The chair has cast you as Thea in the Carlotta Festival Of New Plays.'),
      notice(2027, 9, 'Directors’ Thesis Production I', 'The chair has cast you as Jo in Directors’ Thesis Production I.'),
      notice(2028, 1, 'Carlotta Festival Of New Plays', 'The chair has cast you as Thea in the Carlotta Festival Of New Plays.'),
      notice(2028, 9, 'Directors’ Thesis Production II', 'The chair has cast you as Mae in Directors’ Thesis Production II, and in the company of Yale Rep’s October Production.'),
    ];
    const credit = (production: string, role: string, year: number, kind: 'carlotta' | 'thesis' | 'role' = 'carlotta') => ({ production, role, kind, year, wentOn: 3 });
    const school = { creditsDated: undefined, credits: [
      // The 2027 Carlotta run went unplayed, so no credit: the thesis's comes first, and the Carlotta after it is 2028's.
      credit('Directors’ Thesis Production I', 'Jo', 2028, 'thesis'),
      credit('Carlotta Festival Of New Plays', 'Thea', 2028),
      // A second of one notice's production and part: none left for it.
      credit('Carlotta Festival Of New Plays', 'Thea', 2029),
      // A Rep company part, by its production: the notice doesn't name the part.
      credit('Yale Rep’s October Production', 'A Featured Part In The Company', 2029, 'role'),
    ] } as unknown as SchoolRecord;
    expect(redateCredits(school, notices)).toEqual({ redated: 2, kept: 1 });
    expect(school.credits!.map((c) => [c.year, c.yearAsKept ?? false])).toEqual([[2027, false], [2028, false], [2029, true], [2028, false]]);
    // A year written before its casting, or more than two after, isn't a run of it.
    const early = { credits: [credit('Carlotta Festival Of New Plays', 'Thea', 2026)] } as unknown as SchoolRecord;
    const late = { credits: [credit('Carlotta Festival Of New Plays', 'Thea', 2030)] } as unknown as SchoolRecord;
    const wrongPart = { credits: [credit('Carlotta Festival Of New Plays', 'Nina', 2027)] } as unknown as SchoolRecord;
    for (const s of [early, late, wrongPart]) { redateCredits(s, notices.slice(0, 1)); expect(s.credits![0]!.yearAsKept).toBe(true); }
  });
});
