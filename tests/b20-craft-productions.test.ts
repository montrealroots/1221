/**
 * Brief 20, the craft area's promises on a production (docs/verification/audit-2026-10-21/effects/craft.json), held
 * through the first spring's Carlotta Festival as the clock plays it: the calls answered as they come, the director's
 * notes worked or left, the way the part is played chosen or not, and the nights. Twins from one seed, tended alike
 * (`tend`, tests/fakes/craft-life.ts).
 *
 * TEST SETUP, said where it's used: away in New York for the afternoon of a call, as tests/evidence-g21-school.test.ts
 * misses one (a student with classes until three has no other way to miss a three o'clock call); and the abilities set
 * for the twins whose parts differ in size.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR } from '@/engine/core/time';
import { CALL_KIND, NIGHT_DIFFICULTY } from '@/engine/systems/school';
import { nightFactor, processOf, PROCESS } from '@/engine/systems/production';
import { optionsOf, problemsOf } from '@/engine/systems/workbook';
import { workPiece } from '@/engine/systems/workpieces';
import { at, live, reload, run, setAbility, student, tend } from './fakes/craft-life';

const CAST = at(2027, 1, 26);
const callsOf = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
const proc = (sim: Simulation) => processOf(sim.player.school!.casting!);
const nightsOf = (sim: Simulation) => (sim.player.work ?? []).filter((w) => w.task === 'performance');
/** Each evening of the rehearsal weeks, once the call is over, the last note worked where there's one to work (`school.work_note`), the first way offered. */
const workNotes = (sim: Simulation) => { const c = sim.player.school?.casting; const last = c ? processOf(c).notes.at(-1) : undefined; if (last && last.taken === undefined && !last.worked && !sim.execute({ kind: 'school.work_note', payload: { which: 'school' } }).error) tend(sim); };
/** One life lived to the first spring's casting, kept, and each twin a save of it opened again: the same life to there. */
const cast = new Map<string, Simulation>();
const twin = (seed: string): Simulation => { if (!cast.has(seed)) { const s = student(seed); live(s, CAST); cast.set(seed, s); } return reload(cast.get(seed)!); };

describe('productions.notes: worked, they reach the night and the calls', () => {
  it('a twin who works each note against one who leaves them: the notes share in the night\'s preparation, adaptability practised, the call after a note taken grows more', () => {
    const worker = twin('b20c-notes'), idle = twin('b20c-notes');
    const first = callsOf(worker).find((c) => c.payload.call === 'performance')!;
    live(worker, first.at + MS_HOUR, { eveningHour: 21.5, evening: workNotes });
    live(idle, first.at + MS_HOUR);
    const W = proc(worker), I = proc(idle);
    const share = (p: typeof W) => p.notes.reduce((t, n) => t + (n.taken ? 1 : n.outcome === 'learned' ? PROCESS.noteLearned : 0), 0) / p.notes.length;
    const nw = nightsOf(worker)[0]!, ni = nightsOf(idle)[0]!;
    const adapt = (sim: Simulation) => (sim.player.development?.history ?? []).filter((h) => h.id === 'adaptability' && h.source === 'work-note').length;
    console.log('FIGURES notes', W.notes.length, W.notes.filter((n) => n.worked).length, W.notes.filter((n) => n.taken).length, I.notes.filter((n) => n.taken).length, share(W), share(I), nw.inputs.prep.notes, ni.inputs.prep.notes, nw.overall, ni.overall, adapt(worker), adapt(idle));
    expect(W.notes.some((n) => n.worked)).toBe(true);
    expect(I.notes.some((n) => n.worked)).toBe(false);
    expect(nw.inputs.prep.notes).toBeCloseTo(share(W), 9);
    expect(ni.inputs.prep.notes).toBeCloseTo(share(I), 9);
    expect(nw.inputs.prep.notes).toBeGreaterThan(ni.inputs.prep.notes!);
    expect(adapt(worker)).toBeGreaterThan(0);
    expect(adapt(idle)).toBe(0);
    // Growth From A Night: the first night's growth, the play's skills under `night:`, scaled by the process against what
    // every call keeps (`nightFactor`), the worker's over the idle twin's.
    const fW = nightFactor(worker.player.school!.casting!), fI = nightFactor(idle.player.school!.casting!);
    const grew = (sim: Simulation, id: string) => (sim.player.development?.history ?? []).filter((h) => h.id === id && h.source.startsWith('night:') && h.at === nw.at).reduce((t, h) => t + h.delta, 0);
    console.log('FIGURES growth from a night', fW, fI, grew(worker, 'vocal'), grew(idle, 'vocal'), grew(worker, 'scene'), grew(idle, 'scene'));
    expect(fW).toBeGreaterThan(fI);
    expect(grew(idle, 'scene')).toBeGreaterThan(0);
    expect(grew(worker, 'scene') / grew(idle, 'scene')).toBeGreaterThan(1);
  });
});

describe('productions.part and productions.casting', () => {
  it('each call kept or missed counts in the attendance the spring\'s review reads: two missed, the review counts them', () => {
    const kept = twin('b20c-attend'), missed = twin('b20c-attend');
    const rehearsals = callsOf(missed).filter((c) => c.payload.call === 'rehearsal' && c.at < at(2027, 4, 23, 17)).slice(0, 2);
    for (const c of rehearsals) {
      // TEST SETUP: in New York for the call's afternoon.
      live(missed, c.at - MS_HOUR);
      missed.player.currentLocationId = 'us-ny-newyork';
      missed.advanceTo(c.at + 4 * MS_HOUR);
      missed.player.currentLocationId = 'us-ct-newhaven';
    }
    for (const sim of [kept, missed]) live(sim, at(2027, 4, 23, 18));
    const review = (sim: Simulation) => sim.player.school!.history.find((r) => r.term === 1)!;
    console.log('FIGURES attendance', review(kept).attendance, review(missed).attendance);
    expect(rehearsals.map((c) => missed.universe.scheduled.find((i) => i.id === c.id)!.status)).toEqual(['missed', 'missed']);
    expect(review(missed).attendance).toBeLessThan(review(kept).attendance);
  });

  it('the part\'s size sets how hard its nights are: a lead at the School is judged harder than a featured part', () => {
    const lead = student('b20c-cast'), featured = student('b20c-cast');
    for (const id of ['emotionalDepth', 'presence', 'listening', 'imagination', 'focus', 'memory', 'adaptability', 'composure', 'vocal', 'physical', 'scene', 'script', 'character', 'coldReading']) { setAbility(lead, id, 80); setAbility(featured, id, 30); }
    for (const sim of [lead, featured]) live(sim, CAST);
    expect(lead.player.school!.casting!.size).toBe('lead');
    expect(featured.player.school!.casting!.size).toBe('featured');
    for (const sim of [lead, featured]) live(sim, callsOf(sim).find((c) => c.payload.call === 'performance')!.at + MS_HOUR);
    expect(nightsOf(lead)[0]!.inputs.difficulty).toBe(NIGHT_DIFFICULTY.school.lead);
    expect(nightsOf(featured)[0]!.inputs.difficulty).toBe(NIGHT_DIFFICULTY.school.featured);
    expect(NIGHT_DIFFICULTY.school.lead).toBeGreaterThan(NIGHT_DIFFICULTY.school.featured);
    expect(NIGHT_DIFFICULTY.rep.featured).toBeGreaterThan(NIGHT_DIFFICULTY.school.lead);
  });
});

describe('productions.playing', () => {
  it('can\'t be chosen before a part is cast or once the run is over; chosen, it\'s counted toward the habits, rehearsed at the calls and read by each night', () => {
    const early = student('b20c-part-playing');
    live(early, at(2026, 9, 1, 18));
    expect(early.execute({ kind: 'school.choose_part_playing', payload: { which: 'school', pace: 'driven' } }).error).toBe('You aren’t cast in anything there.');
    const sim = twin('b20c-part-playing'), other = twin('b20c-part-playing');
    const before = sim.player.experience?.approaches?.driven?.chosen ?? 0;
    run(sim, 'school.choose_part_playing', { which: 'school', pace: 'driven' });
    expect(sim.player.experience!.approaches!.driven!.chosen).toBe(before + 1);
    const first = callsOf(sim).find((c) => c.payload.call === 'performance')!;
    for (const s of [sim, other]) live(s, first.at + MS_HOUR);
    const p = proc(sim);
    expect(p.playing!.prep).toBeGreaterThan(0);
    const n = nightsOf(sim)[0]!, m = nightsOf(other)[0]!;
    console.log('FIGURES part playing', p.playing!.prep, n.inputs.prep.approach, n.overall, m.overall, JSON.stringify(n.dims), JSON.stringify(m.dims));
    expect(n.inputs.prep.approach).toBeGreaterThan(0);
    expect(m.inputs.prep.approach).toBeUndefined();
    expect(n.dims).not.toEqual(m.dims);
    const last = callsOf(sim).filter((c) => c.payload.call === 'performance').at(-1)!;
    live(sim, last.at + MS_HOUR);
    expect(sim.execute({ kind: 'school.choose_part_playing', payload: { which: 'school', pace: 'measured' } }).error).toBe('The run is over.');
  });
});

describe('productions.part: Work It Through on the part', () => {
  it('works a movement\'s own blocking: Work It Slowly raises that movement\'s work, and its figure in the part\'s forecast', () => {
    const sim = twin('b20c-part-workbook');
    const calls = callsOf(sim).filter((c) => c.payload.call === 'rehearsal');
    live(sim, calls[5]!.at + 6.5 * MS_HOUR);
    tend(sim);
    const key = 'part:school';
    const piece = workPiece(sim, sim.player, key)!;
    expect(proc(sim).lines).toBeGreaterThanOrEqual(0.3);
    const problem = problemsOf(piece).find((p) => p.segment !== undefined && optionsOf(piece, p).some((o) => o.adjustment === 'work-beat'));
    expect(problem).toBeDefined();
    run(sim, 'work.identify', { piece: key, problem: problem!.id });
    const s = problem!.segment!;
    const work0 = proc(sim).work?.[s] ?? 0;
    const seg0 = piece.forecast().piece!.segments[s]!.overall;
    const t = run<{ before: number; after: number }>(sim, 'work.try', { piece: key, adjustment: 'work-beat' });
    console.log('FIGURES part workbook', problem!.id, work0, proc(sim).work?.[s], seg0, t.before, t.after);
    expect(proc(sim).work![s]).toBeGreaterThan(work0);
    expect(t.after).toBeGreaterThanOrEqual(t.before);
    expect(workPiece(sim, sim.player, key)!.forecast().piece!.segments[s]!.overall).toBeGreaterThanOrEqual(seg0);
  });
});

describe('productions.notes and productions.playing: the director\'s request', () => {
  it('a part played against it comes back as the note at the next work-through, and the choice changed, the next call takes it', () => {
    // On this seed the Carlotta's director asks for it driven (`drawDirection`, a draw of the production's own key).
    const sim = twin('b20c-direction-1');
    run(sim, 'school.choose_part_playing', { which: 'school', pace: 'measured' });
    const works = callsOf(sim).filter((c) => c.payload.stage === 'work');
    live(sim, works[0]!.at + 6.5 * MS_HOUR);
    const p = proc(sim);
    expect(p.direction).toEqual({ pace: 'driven' });
    const note = p.notes.at(-1)!;
    expect(note.focus).toEqual({ kind: 'direction', axis: 'pace', side: 'driven' });
    expect(sim.execute({ kind: 'school.work_note', payload: { which: 'school' } }).error).toBe('This note asks for the part played another way: change it under How You’ll Play It.');
    tend(sim);
    run(sim, 'school.choose_part_playing', { which: 'school', pace: 'driven' });
    const next = callsOf(sim).find((c) => c.at > sim.now && c.payload.call === 'rehearsal')!;
    live(sim, next.at + 6.5 * MS_HOUR);
    expect(note.taken).toBe(true);
    expect(p.notes.filter((n) => n.at > note.at).every((n) => n.focus.kind !== 'direction')).toBe(true);
  });
});
