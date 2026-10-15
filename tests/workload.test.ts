/**
 * School workload, said before it's held against you (from 2026-10-16, the owner's brief "Finish School Workload
 * Balance"; docs/verification/workload-2026-10-16/README.md). A piece says what it would come to shown today and what
 * holds it back (`showingForecast`); a term whose pieces are coming out Unready says so in the term, with the part most
 * often short, the steps that answer it and the day the faculty reviews it (`termWarning`); and the review's own notice
 * names the cause. Played through the clock, the game's own showings; what's put on by hand is TEST SETUP and named.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, formatDate, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { EVALUATION } from '@/engine/content/tasks';
import { bandFor, courseworkOf, mostShort, remedyWords, shortParts, showingForecast, termTally, termWarning, urgentWork, READER, TERM_CHECK, type Assignment } from '@/engine/systems/coursework';
import { templateById } from '@/engine/content/coursework';
import { classPeriod, ESTIMATE } from '@/engine/systems/school';
import { chiefLimit } from '@/engine/systems/evaluation';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
// TEST SETUP: the day kept rested, so the preparation is what's measured; `prepare` sets every open piece's parts, the
// partner's and the reader's too, at the level given (the road the student took, without the hours).
function tended(sim: Simulation, until: number, prepare?: number, which: (a: Assignment, i: number) => boolean = () => true) {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    if (prepare !== undefined) for (const [i, a] of (courseworkOf(sim, sim.player)?.assignments ?? []).entries()) if (a.status === 'open' && which(a, i)) { for (const k of Object.keys(a.prep) as (keyof Assignment['prep'])[]) a.prep[k] = prepare; a.reader = prepare; }
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const warnings = (sim: Simulation) => sim.universe.notifications.filter((n) => n.title === 'A Word On Your Coursework');

describe('school workload, said before it’s held against you', () => {
  it('PLAYER JOURNEY: a term of pieces left unprepared is warned in the term, once, with the part most often short, its remedy and the review’s day; kept through a reload', () => {
    let sim = life('workload-warned');
    tended(sim, at(2026, 10, 20));
    const ws = warnings(sim);
    expect(ws).toHaveLength(1);
    const cw = courseworkOf(sim, sim.player)!;
    const term = cw.warned![0]!;
    const shown = cw.assignments.filter((a) => a.term === term && a.shown);
    expect(shown.length).toBeGreaterThanOrEqual(TERM_CHECK.after);
    // Its figures are the term's own at the moment it was given: at least the mark less the margin, Unready.
    const said = /^(\d+) of the (\d+) pieces shown this term so far were Unready\. Most often short on them: ([a-z ’]+), on (\d+) of the \d+ shown\. (.+?) answers it\./.exec(ws[0]!.body)!;
    expect(said).not.toBeNull();
    expect(Number(said[1])).toBeGreaterThanOrEqual((ESTIMATE.coursework.unready - TERM_CHECK.margin) * Number(said[2]));
    expect(ws[0]!.body).toContain(`The faculty reviews the term on ${formatDate(instantFromZoned({ ...classPeriod(term).to, hour: 17 }, NY), NY)}`);
    // Once a term, and still once after a reload and a week more.
    sim = loadSave(deserialise(serialise(sim.universe)));
    expect(courseworkOf(sim, sim.player)!.warned).toEqual([term]);
    tended(sim, at(2026, 10, 27));
    expect(warnings(sim)).toHaveLength(1);
  }, 180_000);

  it('the warning comes before the review’s mark is reached: a term with some pieces prepared is warned while fewer than half are Unready', () => {
    const sim = life('workload-warned');
    // TEST SETUP: two pieces in three prepared to complete, by their place in the list; the rest left.
    tended(sim, at(2026, 11, 20), 1, (_, i) => i % 3 < 2);
    const ws = warnings(sim);
    expect(ws).toHaveLength(1);
    const [, unready, shown] = /^(\d+) of the (\d+) pieces shown/.exec(ws[0]!.body)!.map(Number);
    expect(unready).toBeGreaterThanOrEqual((ESTIMATE.coursework.unready - TERM_CHECK.margin) * shown!);
    expect(unready).toBeLessThan(ESTIMATE.coursework.unready * shown!);
  }, 240_000);

  it('a twin prepared to complete isn’t warned: the warning reads the pieces, not the calendar', () => {
    const sim = life('workload-warned');
    tended(sim, at(2026, 10, 20), 1);
    expect(warnings(sim)).toHaveLength(0);
  }, 180_000);

  it('a piece says what it would come to shown today, and what’s short, by the showing’s own rules', () => {
    const sim = life('workload-forecast');
    tended(sim, at(2026, 9, 3));
    const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.status === 'open' && x.partner !== undefined)!;
    expect(a).toBeDefined();
    // TEST SETUP: every part complete but the partner's, which stands at nothing.
    for (const k of Object.keys(a.prep) as (keyof Assignment['prep'])[]) a.prep[k] = 1;
    a.prep.partner = 0; a.reader = 0;
    const without = showingForecast(sim, sim.player, a);
    // Interpretation reads the choices answered too, not only its step, so only the partner part is asserted here.
    expect(shortParts(sim.player, a)).toContain('partner');
    expect(remedyWords(a, 'partner')).toContain(READER.label);
    expect(chiefLimit(without)).toMatch(/wasn’t complete, which cost the /);
    // The same piece with the partner part at what completes it: the forecast rises, and nothing is short.
    a.reader = EVALUATION.complete.coursework;
    const withIt = showingForecast(sim, sim.player, a);
    expect(shortParts(sim.player, a)).not.toContain('partner');
    expect(withIt.overall).toBeGreaterThan(without.overall + 5);
    // The forecast reads no day: the same whatever the student's readiness now.
    sim.player.wellbeing.energy = 10;
    expect(showingForecast(sim, sim.player, a).overall).toBe(withIt.overall);
  }, 120_000);

  it('the work is listed in the order to prepare it: soonest due first, and of two due the same day the one that would come out lower', () => {
    const sim = life('workload-forecast');
    tended(sim, at(2026, 9, 10));
    const u = urgentWork(sim, sim.player);
    expect(u.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < u.length; i += 1) expect(u[i - 1]!.due <= u[i]!.due).toBe(true);
    expect(u.map((x) => x.forecast)).toEqual(u.map((x) => showingForecast(sim, sim.player, x.a).overall));
    // Two due the same day: TEST SETUP the first of them prepared to complete, and it goes after the other.
    const day = u.find((x, i) => u.findIndex((y) => y.due === x.due) !== i)!.due;
    const [first, second] = u.filter((x) => x.due === day);
    for (const k of Object.keys(first!.a.prep) as (keyof Assignment['prep'])[]) first!.a.prep[k] = 1;
    first!.a.reader = 1;
    const v = urgentWork(sim, sim.player).filter((x) => x.due === day);
    expect(v[0]!.a.id).toBe(second!.a.id);
    expect(v.find((x) => x.a.id === first!.a.id)!.forecast).toBeGreaterThan(v[0]!.forecast);
  }, 120_000);

  it('PLAYER JOURNEY: the term’s review names what held the Unready pieces back, and what answers it', () => {
    const sim = life('workload-review');
    tended(sim, at(2027, 1, 2));
    const concern = sim.universe.notifications.find((n) => n.title === 'A Notice Of Academic Concern');
    expect(concern, 'a term with every piece unprepared draws a concern').toBeDefined();
    expect(concern!.body).toMatch(/pieces due in class were unready or not shown, short of what the program asks\. Most often short on them: [a-z ’]+, on \d+; .+ answers it\./);
  }, 300_000);
});

describe('school workload, found by the sweep (2026-10-16)', () => {
  it('the warning counts as the review does: a piece missed is due and Unready, so a term short with misses is warned', () => {
    const sim = life('workload-warned');
    // A twin prepared to complete, unwarned (above), its term then TEST SETUP: under the mark by the pieces shown, and
    // over it once the pieces left open are missed.
    tended(sim, at(2026, 10, 20), 1);
    expect(warnings(sim)).toHaveLength(0);
    const cw = courseworkOf(sim, sim.player)!;
    const term = cw.assignments.find((a) => a.shown)!.term;
    const shown = cw.assignments.filter((a) => a.term === term && a.shown && !a.revision);
    expect(shown.length).toBeGreaterThanOrEqual(TERM_CHECK.after);
    const mark = ESTIMATE.coursework.unready - TERM_CHECK.margin;
    const unready = Math.ceil(mark * shown.length) - 1;
    for (const [i, a] of shown.entries()) a.shown!.band = i < unready ? 'unready' : 'working';
    const missed = cw.assignments.filter((a) => a.term === term && !a.shown && a.status === 'open');
    expect(missed.length).toBeGreaterThanOrEqual(1);
    for (const a of missed) a.status = 'missed';
    const t = termTally(cw.assignments, term);
    expect(t.notShown).toBe(missed.length);
    expect(t.shown).toBe(cw.assignments.filter((a) => a.term === term && a.shown).length + missed.length);
    // Short of the mark by the pieces shown alone, over it with the missed counted.
    expect(unready).toBeLessThan(mark * shown.length);
    expect(t.unready).toBeGreaterThanOrEqual(mark * t.shown);
    termWarning(sim, sim.player, missed[0]!);
    expect(warnings(sim)).toHaveLength(1);
    expect(warnings(sim)[0]!.body).toMatch(new RegExp(`^${t.unready} of the ${t.shown} pieces due this term so far were Unready or not shown\\.`));
    expect(warnings(sim)[0]!.body).toContain('your standing falls a step');
    expect(warnings(sim)[0]!.body).not.toMatch(/still to come|notice of concern/);
  }, 180_000);

  it('the part most often short is counted by what it is on each piece and what answers it there, and every piece counted has it', () => {
    const sim = life('workload-warned');
    tended(sim, at(2026, 10, 20));
    const cw = courseworkOf(sim, sim.player)!;
    const term = cw.warned![0]!;
    const pieces = termTally(cw.assignments, term).unreadyShown;
    const top = mostShort(sim.player, pieces)!;
    const having = pieces.filter((a) => shortParts(sim.player, a).some((d) => templateById(a.template)!.dims[d]!.label === top.label && remedyWords(a, d) === top.remedy));
    expect(having.length).toBe(top.n);
    // The part's key alone names different work on different templates: counted by it, more pieces were put together.
    const keys = new Set(pieces.flatMap((a) => shortParts(sim.player, a).filter((d) => templateById(a.template)!.dims[d]!.label === top.label)));
    const byKey = Math.max(...[...keys].map((d) => pieces.filter((a) => shortParts(sim.player, a).includes(d)).length));
    expect(byKey).toBeGreaterThanOrEqual(top.n);
  }, 180_000);

  it('a scene’s table work is answered by the Table Work’s questions, not by “its own step”', () => {
    const sim = life('workload-forecast');
    tended(sim, at(2026, 9, 10));
    const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.sceneId && templateById(x.template)!.dims.interpretation && !templateById(x.template)!.activities.some((s) => s.dim === 'interpretation'))!;
    expect(a).toBeDefined();
    expect(remedyWords(a, 'interpretation')).toMatch(/Table Work/);
    expect(remedyWords(a, 'interpretation')).not.toMatch(/its own step/);
  }, 120_000);

  it('a piece played smaller is forecast at the band its showing gives: no higher than Working', () => {
    const sim = life('workload-forecast');
    tended(sim, at(2026, 9, 10));
    const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.status === 'open')!;
    expect(bandFor(a, 95)).toBe('exceptional');
    // TEST SETUP: a smaller piece of a part asked for.
    a.approach = { kind: 'smaller', dim: 'rehearsal' } as Assignment['approach'];
    expect(bandFor(a, 95)).toBe('working');
    expect(bandFor(a, 20)).toBe('unready');
  }, 120_000);
});
