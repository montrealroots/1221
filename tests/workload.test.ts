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
import { bandFor, courseworkOf, mostShort, remedyWords, shortAtShowing, shortCause, shortParts, showingForecast, termTally, termWarning, urgentWork, weightsOf, READER, TERM_CHECK, type Assignment } from '@/engine/systems/coursework';
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
  it('PLAYER JOURNEY: a term of pieces left unprepared is warned in the term, once, saying every part of each was short and that each one’s steps answer it, with the review’s day; kept through a reload', () => {
    let sim = life('workload-warned');
    tended(sim, at(2026, 10, 20));
    const ws = warnings(sim);
    expect(ws).toHaveLength(1);
    const cw = courseworkOf(sim, sim.player)!;
    const term = cw.warned![0]!;
    const shown = cw.assignments.filter((a) => a.term === term && a.shown);
    expect(shown.length).toBeGreaterThanOrEqual(TERM_CHECK.after);
    // Its figures are the term's own at the moment it was given: at least the mark less the margin, Unready.
    // Nothing was prepared, so each piece was short on every part: that's said, and not one part named by its tie (from
    // 2026-10-17, `shortCause`; until then "Most often short on them: …, on 1 of the 6 shown", brief 13's journey J15).
    const said = /^(\d+) of the (\d+) pieces shown this term so far were Unready\. On each of them every part was short of complete: it’s the preparation as a whole, not one part, and each one’s steps answer it\./.exec(ws[0]!.body)!;
    expect(said).not.toBeNull();
    expect(ws[0]!.body).not.toContain('Most often short');
    expect(shown.filter((a) => a.shown!.band === 'unready').every((a) => shortParts(sim.player, a).length === Object.keys(templateById(a.template)!.dims).filter((d) => d in weightsOf(a)).length)).toBe(true);
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

  it('PLAYER JOURNEY: the term’s review says what held the Unready pieces back: every part of each, where nothing was prepared', () => {
    const sim = life('workload-review');
    tended(sim, at(2027, 1, 2));
    const concern = sim.universe.notifications.find((n) => n.title === 'A Notice Of Academic Concern');
    expect(concern, 'a term with every piece unprepared draws a concern').toBeDefined();
    expect(concern!.body).toMatch(/pieces due in class were unready or not shown, short of what the program asks\. On each of them every part was short of complete\./);
    expect(concern!.body).not.toContain('Most often short');
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

  it('FIXTURE: what the Unready pieces were short on is said as it is (brief 13’s journeys, `shortCause`): every part of each, as left; a part short on two of them, named with its remedy; and where no part is short on more than one, none named (TEST SETUP: copies of the warned term’s solo pieces given preparation by hand)', () => {
    const sim = life('workload-warned');
    tended(sim, at(2026, 10, 20));
    const cw = courseworkOf(sim, sim.player)!;
    const pieces = termTally(cw.assignments, cw.warned![0]!).unreadyShown;
    expect(shortCause(sim.player, pieces)).toEqual({ kind: 'every' });
    // Solo pieces, whose parts are their own preparation alone (no partner part, no table work).
    const solo = pieces.filter((a) => !Object.keys(templateById(a.template)!.dims).some((d) => d === 'partner' || d === 'interpretation'));
    const [a, b] = [solo[0]!, solo.find((x) => x.template !== solo[0]!.template)!];
    expect(a && b).toBeTruthy();
    const allBut = (x: Assignment, short: string): Assignment => { const c = structuredClone(x); for (const d of Object.keys(c.prep) as (keyof Assignment['prep'])[]) c.prep[d] = d === short ? 0 : 1; return c; };
    const [da, db] = [Object.keys(weightsOf(a))[0]!, Object.keys(weightsOf(b)).find((d) => templateById(b.template)!.dims[d as keyof Assignment['prep']]!.label !== templateById(a.template)!.dims[Object.keys(weightsOf(a))[0]! as keyof Assignment['prep']]!.label)!];
    // The same part short on two: named, with its remedy, on 2.
    const two = shortCause(sim.player, [allBut(a, da), allBut(a, da)]);
    expect(two).toMatchObject({ kind: 'part', label: templateById(a.template)!.dims[da as keyof Assignment['prep']]!.label, n: 2, remedy: remedyWords(a, da as keyof Assignment['prep']) });
    // Two different parts short, one on each: none named.
    expect(shortCause(sim.player, [allBut(a, da), allBut(b, db)])).toEqual({ kind: 'scattered' });
    // One piece, one part: that part.
    expect(shortCause(sim.player, [allBut(b, db)])).toMatchObject({ kind: 'part', n: 1 });
    expect(shortCause(sim.player, [])).toBeUndefined();
  }, 180_000);

  it('FIXTURE: a term warned over Unready pieces each short on a different part names none of them, and says each one’s forecast says what held it back (TEST SETUP: a prepared twin’s term marked Working by hand, then solo pieces marked Unready, each with one part of its own taken back to nothing)', () => {
    const sim = life('workload-warned');
    tended(sim, at(2026, 10, 20), 1);
    expect(warnings(sim)).toHaveLength(0);
    const cw = courseworkOf(sim, sim.player)!;
    const term = cw.assignments.find((a) => a.shown)!.term;
    const shown = cw.assignments.filter((a) => a.term === term && a.shown && !a.revision);
    // The rest of the term Working, so the Unready ones are those picked below (the twin's own scene studies came out
    // Unready on their table work, which this twin never answered).
    for (const a of cw.assignments.filter((x) => x.term === term && x.shown)) { a.shown!.band = 'working'; if (a.revision) a.revision.band = 'working'; }
    const need = Math.ceil((ESTIMATE.coursework.unready - TERM_CHECK.margin) * termTally(cw.assignments, term).shown);
    const labels = new Set<string>();
    const picked: Assignment[] = [];
    // Solo pieces, whose parts are their own preparation alone (no partner part, no table work), each short on one.
    for (const a of shown.filter((x) => shortParts(sim.player, x).length === 0)) {
      const t = templateById(a.template)!;
      const d = (Object.keys(weightsOf(a)) as (keyof Assignment['prep'])[]).find((k) => k !== 'partner' && k !== 'interpretation' && !labels.has(t.dims[k]!.label));
      if (!d || picked.length >= need) continue;
      labels.add(t.dims[d]!.label);
      a.prep[d] = 0;
      a.shown!.band = 'unready';
      picked.push(a);
    }
    expect(picked).toHaveLength(need);
    expect(shortCause(sim.player, termTally(cw.assignments, term).unreadyShown)).toEqual({ kind: 'scattered' });
    termWarning(sim, sim.player, picked[0]!);
    expect(warnings(sim)).toHaveLength(1);
    expect(warnings(sim)[0]!.body).toContain(`${need} of the ${termTally(cw.assignments, term).shown} pieces shown this term so far were Unready. No one part was short on more than one of them: each one’s own forecast says what held it back.`);
    expect(warnings(sim)[0]!.body).not.toContain('Most often short');
  }, 180_000);

  it('PLAYER JOURNEY with FIXTURE: a Simulated Rehearsal shown Unready At The Table is short, as its warning and review read it, on that round’s parts, not the next round’s it has gone on to; and a copy with the next round done and the table not is named for the table (brief 13’s journeys, `shortAtShowing`; TEST SETUP: the copy’s parts set by hand)', () => {
    const sim = life('workload-rounds');
    let a: Assignment | undefined;
    while (!a && sim.now < at(2027, 3, 1)) {
      tended(sim, sim.now + 24 * MS_HOUR);
      a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.template === 'simulated-rehearsal' && x.roundsShown?.length === 1 && x.shown?.band === 'unready');
    }
    expect(a, 'a Simulated Rehearsal shown At The Table, Unready').toBeDefined();
    const t = templateById(a!.template)!;
    expect(a!.round).toBe(1);
    // As left, nothing prepared: the round shown was its table work, and the round it has gone on to is its lines and its feet.
    expect(new Set(shortAtShowing(sim.player, a!))).toEqual(new Set(t.rounds![0]!.dims));
    expect(new Set(shortParts(sim.player, a!))).toEqual(new Set(t.rounds![1]!.dims));
    // The next round done and the table not: what was short when it was shown is the table.
    const copy = structuredClone(a!);
    for (const d of t.rounds![1]!.dims) copy.prep[d as keyof Assignment['prep']] = 1;
    copy.reader = 1;
    expect(shortParts(sim.player, copy)).toEqual([]);
    // Both of the table's parts short: every part of the round shown.
    expect(shortCause(sim.player, [copy, structuredClone(copy)])).toEqual({ kind: 'every' });
    // Its scene known, its table work not: the table work, named on both.
    copy.prep.familiarity = 1;
    expect(shortAtShowing(sim.player, copy)).toEqual(['interpretation']);
    const named = mostShort(sim.player, [copy, structuredClone(copy)])!;
    expect(named).toMatchObject({ label: t.dims.interpretation!.label, n: 2 });
    expect(shortCause(sim.player, [copy, structuredClone(copy)])).toMatchObject({ kind: 'part', label: t.dims.interpretation!.label, n: 2 });
  }, 240_000);

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
