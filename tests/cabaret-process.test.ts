/**
 * The Yale Cabaret's and the Summer Cabaret's rehearsals as a process (from
 * 2026-10-08; `systems/production.ts`): a Cabaret show's evenings staged as a
 * new piece's week (read, block, work, the technical and dress at once), a
 * Summer Cabaret show's afternoons as a full production's; the part learned,
 * a blocking evening missed and caught up, the nights playing on it, and
 * every closing looked back on once, its open notes carried into the
 * coursework's ledger.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import type { ScheduledItem } from '@/engine/core/scheduler';
import { CABARET_KIND, CALL_KIND, SUMMER_KIND, cabaretRefusal, cabaretWeek } from '@/engine/systems/school';
import { routinesOf, stepLabel } from '@/engine/systems/routines';
import { cabaretStages, hasProcess, nightFactor, parFor, processOf, reflect, stagesFor } from '@/engine/systems/production';
import { courseworkOf, notesOf } from '@/engine/systems/coursework';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const pending = (sim: Simulation, kind: string): ScheduledItem[] => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending').sort((a, b) => a.at - b.at);

describe('a Cabaret show’s week', () => {
  it('is a new piece’s, not a full production’s: read, two evenings blocking, work, and the technical and dress at once', () => {
    expect(cabaretStages(9)).toEqual(['read', 'blocking', 'blocking', 'work', 'work', 'work', 'work', 'work', 'techdress']);
    expect(stagesFor(9, 'cabaret')).not.toContain('dress');
    expect(parFor(9, false, 'cabaret')).not.toBe(parFor(9));
  });

  it('is staged when joined, played on its process, looked back on once, and an actor at every evening plays as before', () => {
    let sim = life('cb-week');
    tended(sim, at(2026, 9, 14, 20));
    const joined = sim.execute<{ week: string }>({ kind: 'school.cabaret', payload: {} });
    expect(joined.ok, joined.error).toBe(true);
    const evenings = pending(sim, CABARET_KIND).filter((i) => i.payload.call === 'rehearsal');
    expect(evenings.map((i) => i.payload.stage)).toEqual(cabaretStages(evenings.length));
    expect(evenings[0]!.label).toBe('Yale Cabaret: Read-Through');
    expect(evenings.at(-1)!.label).toBe('Yale Cabaret: Technical And Dress Rehearsal');
    sim = reload(sim);
    const shows = pending(sim, CABARET_KIND).filter((i) => i.payload.call === 'performance');
    tended(sim, shows[0]!.at - MS_HOUR);
    const cab = sim.player.school!.cabaret!;
    expect(processOf(cab)).toMatchObject({ calls: evenings.length, format: 'cabaret', blockingMissed: 0 });
    expect(processOf(cab).dress).toBeDefined();
    expect(nightFactor(cab)).toBeCloseTo(1, 10);
    tended(sim, shows.at(-1)!.at + 3 * MS_HOUR);
    expect(cab.performed).toBe(shows.length);
    // Looked back on once, the credit kept once.
    expect(processOf(cab).reflection?.text).toMatch(/^Yale Cabaret, Season \d+: \d+ calls answered of \d+;/);
    expect(sim.universe.notifications.filter((n) => n.title.startsWith('Looking Back: Yale Cabaret'))).toHaveLength(1);
    expect((sim.player.school!.credits ?? []).filter((c) => c.kind === 'cabaret')).toHaveLength(1);
    expect(reflect(sim, sim.player, cab, 'again')).toBeUndefined();
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('a blocking evening missed is a gap caught up from the book; the part learned between evenings; refused once the run is over', () => {
    const sim = life('cb-missed');
    tended(sim, at(2026, 9, 14, 20));
    sim.must({ kind: 'school.cabaret', payload: {} });
    const evenings = pending(sim, CABARET_KIND).filter((i) => i.payload.call === 'rehearsal');
    tended(sim, evenings[0]!.at + 6 * MS_HOUR);
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, evenings[1]!.at + 6 * MS_HOUR);
    sim.player.currentLocationId = 'us-ct-newhaven';
    const cab = sim.player.school!.cabaret!;
    expect(processOf(cab).blockingMissed).toBe(1);
    expect(sim.execute({ kind: 'school.review_blocking', payload: { which: 'cabaret' } }).ok).toBe(true);
    expect(processOf(cab).blockingMissed).toBe(0);
    const lines = processOf(cab).lines;
    expect(sim.execute({ kind: 'school.learn_part', payload: { which: 'cabaret' } }).ok).toBe(true);
    expect(processOf(cab).lines).toBeGreaterThan(lines);
    const shows = pending(sim, CABARET_KIND).filter((i) => i.payload.call === 'performance');
    tended(sim, shows.at(-1)!.at + 3 * MS_HOUR);
    expect(sim.execute({ kind: 'school.learn_part', payload: { which: 'cabaret' } }).error).toBe('The run is over.');
    expect(sim.execute({ kind: 'school.learn_part', payload: { which: 'summer' } }).error).toBe('You aren’t cast in anything there.');
  });
});

describe('the Summer Cabaret', () => {
  it('rehearses each show as a full production, each its own process, each looked back on at its closing', () => {
    const sim = life('cb-summer');
    sim.player.school!.classmates[0]!.craft.scene = 99;
    tended(sim, at(2027, 4, 20, 20));
    sim.player.school!.standing = 'good';
    const joined = sim.execute({ kind: 'school.summer_cabaret', payload: {} });
    expect(joined.ok, joined.error).toBe(true);
    const first = pending(sim, SUMMER_KIND).filter((i) => i.payload.call === 'rehearsal' && i.payload.run === 0);
    expect(first[0]!.label).toBe('Summer Cabaret: Read-Through');
    expect(first.at(-1)!.label).toBe('Summer Cabaret: Dress Rehearsal');
    expect(first.at(-2)!.label).toBe('Summer Cabaret: Technical Rehearsal');
    const firstShows = pending(sim, SUMMER_KIND).filter((i) => i.payload.call === 'performance' && i.payload.run === 0);
    tended(sim, firstShows.at(-1)!.at + 3 * MS_HOUR);
    const [one, two] = sim.player.school!.summer!.shows!;
    expect(hasProcess(one)).toBe(true);
    expect(processOf(one!).calls).toBe(first.length);
    expect(processOf(one!).reflection).toBeDefined();
    expect(hasProcess(two)).toBe(false);
    // Between shows the part to work on is the next show's.
    const lines = processOf(two!).lines;
    tended(sim, sim.now + 20 * MS_HOUR);
    if (!sim.execute({ kind: 'school.learn_part', payload: { which: 'summer' } }).error) expect(processOf(two!).lines).toBeGreaterThan(lines);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('looking back', () => {
  it('carries a production’s notes not taken into the coursework’s ledger, once each', () => {
    const sim = life('cb-reflect');
    tended(sim, at(2026, 9, 2, 20));
    const holder = { production: 'A Test' };
    const p = processOf(holder);
    Object.assign(p, { calls: 10, of: 12, lines: 0.5, blocking: 0.6 });
    p.notes.push({ at: sim.now, text: 'x', focus: { kind: 'lines' }, taken: false }, { at: sim.now, text: 'y', focus: { kind: 'lines' }, taken: false }, { at: sim.now, text: 'z', focus: { kind: 'skill', skill: 'voice' }, taken: true });
    const text = reflect(sim, sim.player, holder, 'A Test')!;
    expect(text).toMatch(/10 calls answered of 12; 1 of 3 notes taken/);
    const notes = notesOf(courseworkOf(sim, sim.player)!);
    expect(notes.filter((n) => n.key === 'dim:memorization')).toHaveLength(1);
    // Two lines notes not taken are one thing carried, given once.
    expect(notes.find((n) => n.key === 'dim:memorization')!.given).toBe(1);
    expect(notes.find((n) => n.key === 'dim:memorization')!.history.at(-1)!.course).toBe('A Test');
    expect(notes.some((n) => n.key === 'skill:voice')).toBe(false);
  });
});

describe('the Bulletin’s rules for the Cabaret', () => {
  it('bars a double-cast actor, and a routine learns a Cabaret part by the same command', () => {
    const sim = life('cb-double');
    sim.player.school!.classmates[0]!.craft.scene = 99;
    sim.advanceTo(at(2027, 1, 4) + 60_000);
    // The Rep's Seagull in the winter and the Carlotta in the spring: two castings, not at once, so the Cabaret is open.
    expect(sim.player.school!.casting).toBeDefined();
    expect(sim.player.school!.rep).toBeDefined();
    expect(cabaretRefusal(sim, sim.player)).toBeUndefined();
    // A School call in the same weeks as the Rep's: double-cast, and barred.
    const week = cabaretWeek(sim, sim.player, sim.player.school!.termsBegun - 1)!;
    const rep = pending(sim, CALL_KIND).find((i) => i.payload.which === 'rep' && Math.abs(i.at - at(week.year, week.month, week.day)) < 21 * 86_400_000);
    expect(rep).toBeDefined();
    sim.schedule({ at: rep!.at + 86_400_000, durationMinutes: 60, kind: CALL_KIND, label: 'A School Call', category: 'school', priority: 32, payload: { personId: sim.player.id, call: 'rehearsal' } });
    expect(cabaretRefusal(sim, sim.player)).toBe('Cast in two productions at once, you can’t take a Cabaret show: the Bulletin bars double-cast actors from it.');
    const free = life('cb-routine');
    tended(free, at(2026, 9, 14, 20));
    free.must({ kind: 'school.cabaret', payload: {} });
    expect(free.execute({ kind: 'routine.save', payload: { name: 'Bad', steps: [{ kind: 'school.learn_part', payload: { which: 'opera' } }] } }).error).toBe('That isn’t a part you could be cast in.');
    free.must({ kind: 'routine.save', payload: { name: 'Cabaret Lines', steps: [{ kind: 'school.learn_part', payload: { which: 'cabaret' } }] } });
    const routine = routinesOf(free.player).at(-1)!;
    expect(stepLabel(free.player, routine.steps[0]!)).toBe('Learn Your Cabaret Part');
    for (const step of routine.steps) free.must({ kind: step.kind, payload: step.payload });
    expect(processOf(free.player.school!.cabaret!).lines).toBeGreaterThan(0);
  });
});
