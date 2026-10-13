/**
 * Five productions defects found by the triage of 2026-10-12, each held here against the engine and the screen that
 * shows it (from 2026-10-12):
 * - a movement held back most by tiring was given "I don't know what you want in…", the note for believability, which
 *   the drain costs most, in place of a note on its pacing;
 * - the chair's Delivered read a night's stamina drain and a slip's shake from the night's draw, so a night fully
 *   prepared on a sufficient day read as less delivered by a stamina under full;
 * - a Summer Cabaret member laid up by an injury at the company's work was paid workers' compensation and the full
 *   stipend for the same days, and the notice named New York's two-thirds where Connecticut's 75% after tax applies;
 * - once a way at a note was put back, The Ways At It was hidden, and Work On The Note worked whatever place was last
 *   chosen in the shorter list of the ways left;
 * - working a blocking note given for a missed call left the gap open, so the next work-through gave the same note.
 *
 * PLAYER JOURNEYS play through the clock and the commands; FIXTURES set a state by hand to reach one rule, and say so.
 * The screen is rendered to markup (react-dom/server) over a real save, as tests/defects-g8-12.test.ts renders it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { CALL_KIND, STIPEND_KIND, SUMMER_KIND, nightEvaluation } from '@/engine/systems/school';
import { craftNoteOf, hasProcess, noteText, ownWorkRefusal, reworkable, solutionsOf, type DirectorNote, type Holder, type Process } from '@/engine/systems/production';
import { workPiece } from '@/engine/systems/workpieces';
import { judge, type Performer } from '@/engine/systems/evaluation';
import { judgePiece, toneSegments, type PieceSpec, type Problem } from '@/engine/systems/piece';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { SUMMER_CABARET } from '@/engine/content/school';
import { INJURY_KIND } from '@/engine/content/injury';
import { healthOf } from '@/engine/systems/health';
import type { AbilityId } from '@/engine/content/abilities';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, force: false }));

// An injury on a Summer Cabaret stage, drawn as the call draws it (its own key, its own kind), with only the chance made
// certain, and only for a kind that keeps one off work: the company's calls are the only stage calls that carry a wage.
vi.mock('@/engine/systems/injury', async (orig) => {
  const real = await orig<typeof import('@/engine/systems/injury')>();
  const { INJURY_KIND, INJURY_MIX } = await import('@/engine/content/injury');
  const mayHurt: typeof real.mayHurt = (sim, person, source, chance, at, work) => {
    if (h.force && source === 'stage' && work) {
      const rng = sim.rng('health.injury', person.id, `${source}-${at}`);
      rng.next();
      const mix = INJURY_MIX[source];
      let left = rng.next() * mix.reduce((s, [, w]) => s + w, 0);
      const kind = (mix.find(([, w]) => (left -= w) <= 0) ?? mix[mix.length - 1]!)[0];
      if (INJURY_KIND[kind].offWork) return real.mayHurt(sim, person, source, 1, at, work);
    }
    return real.mayHurt(sim, person, source, chance, at, work);
  };
  return { ...real, mayHurt };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { RehearsalProcess } = await import('@/ui/components/RehearsalProcess');

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** Played by somebody who looks after themselves, awake through the evening, as tests/defects-g8-11.test.ts plays one. */
const tended = (sim: Simulation, until: number, step = 6 * MS_HOUR) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + step)); } };
const proc = (sim: Simulation): Process => { const c = sim.player.school!.casting!; if (!hasProcess(c)) throw new Error('no process'); return c.process; };
const schoolCalls = (sim: Simulation, call: string) => sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === call && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);

describe('a movement held back most by tiring', () => {
  /** A play in two movements on a night's load, by an actor of even abilities and a stamina of 50. */
  const spec: PieceSpec = { segments: toneSegments(['grave', 'grave'], 2), work: [], part: 'blocking', perTurn: 0, perBlend: 0, most: 1, load: 0.6 };
  const performer = (stamina: number): Performer => ({ ability: (id: AbilityId) => (id === 'stamina' ? stamina : 90), full: () => 100, technique: () => 99 });
  const night = (stamina: number) => judgePiece('g8-13', performer(stamina), { task: TASK_PROFILES.performance!, techniques: { scene: 1 }, prep: { lines: 1, blocking: 1, notes: 1 }, required: { lines: 1, blocking: 1, notes: 1 }, difficulty: 0, condition: { readiness: 100 }, key: 'g8-13-pacing', expected: true }, spec);
  const second: Problem = { id: 'segment:1', kind: 'segment', segment: 1, label: 'The Second Half Holds It Back', why: '', measure: 0 };

  it('is a note on its pacing, "It sags in…", not "I don’t know what you want in…"', () => {
    const e = night(50);
    // What holds the second half back most is the drain, and the quality it costs most is believability.
    expect(e.piece!.segments[1]!.chief).toMatchObject({ kind: 'condition', what: 'stamina', label: 'Stamina, By The Second Half', dimension: 'believability' });
    expect(craftNoteOf(second, e)).toBe('pacing');
    const focus = { kind: 'craft' as const, note: craftNoteOf(second, e), problem: second.id, segment: 1, where: 'The Second Half', measure: 0 };
    expect(noteText(focus)).toBe('It sags in the second half: hold it the whole way through.');
    // The falsifiability test: at full stamina nothing drains, and the same movement's note goes back to what holds it.
    const whole = night(100);
    expect(whole.piece!.segments[1]!.chief?.what).not.toBe('stamina');
    expect(craftNoteOf(second, whole)).not.toBe('pacing');
  });
});

describe('a night’s delivery', () => {
  const ctx = (readiness: number) => ({ task: TASK_PROFILES.performance!, techniques: { scene: 1 }, prep: { lines: 1, blocking: 1, notes: 1 }, required: { lines: 1, blocking: 1, notes: 1 }, difficulty: 0, condition: { readiness }, key: 'g8-13-day' });
  const even: Performer = { ability: () => 60, full: () => 100, technique: () => 60 };

  it('keeps the day’s condition apart from a movement’s drain and a slip’s shake', () => {
    const late = judge('g8-13', even, { ...ctx(100), drain: { f: 0.8, label: 'Stamina, By The Close' }, shaken: { f: 0.9, label: 'Shaken By A Slip In The Middle' } });
    expect(late.dimensions.some((d) => d.condition < 1)).toBe(true);
    for (const d of late.dimensions) expect(d.day, d.dimension).toBe(1);
    // A tired day is the day's: what fatigue reaches reads it in both.
    const tired = judge('g8-13', even, { ...ctx(30), drain: { f: 0.8, label: 'Stamina, By The Close' } });
    const reached = tired.dimensions.filter((d) => d.day < 1);
    expect(reached.length).toBeGreaterThan(0);
    for (const d of reached) expect(d.condition).toBeLessThan(d.day);
  });

  it('PLAYER JOURNEY: reads a night fully prepared on a sufficient day as fully delivered, whatever the stamina', () => {
    const sim = student('g8-13-delivery');
    sim.advanceTo(at(2027, 1, 4) + 60_000);
    const casting = sim.player.school!.casting!;
    const first = schoolCalls(sim, 'performance')[0]!;
    expect(first).toBeDefined();
    tended(sim, first.at - 30 * 60_000, MS_HOUR);
    // FIXTURE: the part learned, set and every note taken, as an actor who kept up every call and the work between makes
    // it, and a stamina of 50, under full, so the second half drains.
    const p = proc(sim);
    Object.assign(p, { lines: 1, blocking: 1, blockingMissed: 0 });
    for (const n of p.notes) n.taken = true;
    sim.player.wellbeing.fitness = 50;
    const forecast = nightEvaluation(sim, sim.player, 'g8-13-forecast', casting, first.at, casting.size ?? 'lead', 'school', true);
    expect(forecast.piece!.segments[1]!.drain).toBeLessThan(1);
    expect(forecast.dimensions.every((d) => d.prepared === 1)).toBe(true);
    sim.player.awakeSince = first.at - 8 * MS_HOUR;
    sim.advanceTo(first.at + 60_000);
    expect(first.status).toBe('done');
    const judged = (sim.player.work ?? []).find((w) => w.inputs.key === `night:${sim.player.id}:${casting.production}-${first.at}`)!;
    expect(judged).toBeDefined();
    // A sufficient day: readiness at 60 or over, and nothing the flu or an injury takes.
    expect(judged.inputs.condition.readiness).toBeGreaterThanOrEqual(60);
    expect(judged.inputs.condition).not.toHaveProperty('ill');
    expect(judged.inputs.condition).not.toHaveProperty('injured');
    expect(judged.inputs.condition).not.toHaveProperty('concussed');
    const run = (sim.player.school!.runs ?? []).find((r) => r.production === casting.production)!;
    expect(run.nights).toBe(1);
    expect(run.delivered).toBe(1);
    expect((casting as { delivered?: { sum: number; n: number } }).delivered).toEqual({ sum: 1, n: 1 });
  }, 240_000);
});

describe('PLAYER JOURNEY: the Summer Cabaret of 2027, laid up by an injury on its stage', () => {
  it('pays workers’ compensation for the days off and the stipend for the rest, and names Connecticut’s share', () => {
    const sim = student('g8-13-summer');
    sim.advanceTo(at(2027, 3, 20, 12));
    // TEST SETUP: in good standing, which the company asks of a student; this is a test of the summer, not the year.
    sim.player.school!.standing = 'good';
    sim.player.currentLocationId = 'us-ct-newhaven';
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    const calls = sim.universe.scheduled.filter((i) => i.kind === SUMMER_KIND && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
    tended(sim, calls[0]!.at - 60_000, MS_HOUR);
    delete healthOf(sim.player).injury;
    h.force = true;
    try {
      while (!healthOf(sim.player).injury?.atWork && sim.now < calls.at(-1)!.at) tended(sim, sim.now + 6 * MS_HOUR, MS_HOUR);
    } finally {
      h.force = false;
    }
    const injury = healthOf(sim.player).injury!;
    expect(injury.atWork).toMatchObject({ stateId: 'us-ct', weeklyWage: SUMMER_CABARET.stipendWeekly });
    expect(injury.offWorkUntil).toBeGreaterThan(injury.at);
    const notice = sim.universe.notifications.find((n) => n.category === 'health' && n.title === INJURY_KIND[injury.kind].label && n.body.includes('It happened at work'))!;
    expect(notice).toBeDefined();
    // The $375 week is paid 75% of the whole, Connecticut’s least for it. Until 2026-10-13 the notice said “75% of your
    // week’s wage after tax”, which it wasn’t, and this test held that.
    expect(notice.body).toContain('workers’ compensation pays the care and 75% of your week’s wage while you’re off.');
    expect(notice.body).not.toContain('two-thirds');

    // The Fridays whose week the time off touches, played to the one after it ends.
    const fridays = sim.universe.scheduled.filter((i) => i.kind === STIPEND_KIND && i.payload.personId === sim.player.id && i.at > injury.at && i.at - 7 * MS_DAY < injury.offWorkUntil!).sort((a, b) => a.at - b.at);
    expect(fridays.length).toBeGreaterThan(0);
    tended(sim, fridays.at(-1)!.at + MS_HOUR, MS_HOUR);
    expect(sim.player.school!.summer!.out).toBeFalsy();
    const gross = (when: number) => sim.universe.transactions.filter((t) => t.at === when && t.memo === 'Yale Summer Cabaret stipend, the week').reduce((s, t) => s - t.postings.filter((x) => x.accountId === sim.nominalAccount('income', 'Wages').id).reduce((a, x) => a + x.amount, 0), 0);
    const comp = sim.universe.transactions.filter((t) => t.memo === 'Workers’ compensation' && t.at > injury.at).length;
    expect(comp).toBeGreaterThan(0);
    // Each week's stipend is for the days of it not kept off the stage: none is paid twice.
    let paid = 0;
    let owed = 0;
    for (const f of fridays) {
      const off = Math.max(0, Math.min(injury.offWorkUntil!, f.at) - Math.max(injury.at, f.at - 7 * MS_DAY));
      paid += gross(f.at);
      owed += Math.round(SUMMER_CABARET.stipendWeekly * (1 - off / (7 * MS_DAY)));
    }
    expect(paid).toBe(owed);
    expect(paid).toBeLessThan(fridays.length * SUMMER_CABARET.stipendWeekly);
  }, 300_000);

  it('goes on paying the stipend to a member laid up by an injury at other work, which compensation pays for that wage', () => {
    const sim = student('g8-13-summer-other');
    sim.advanceTo(at(2027, 3, 20, 12));
    // TEST SETUP: in good standing, as above.
    sim.player.school!.standing = 'good';
    sim.player.currentLocationId = 'us-ct-newhaven';
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    const friday = sim.universe.scheduled.filter((i) => i.kind === STIPEND_KIND && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at)[1]!;
    tended(sim, friday.at - 3 * MS_DAY, MS_HOUR);
    // FIXTURE: a broken bone at a work-study shift, its wage a shift's, keeping them off the stage the whole week.
    healthOf(sim.player).injury = { kind: 'fracture', at: friday.at - 7 * MS_DAY, until: friday.at + 40 * MS_DAY, offWorkUntil: friday.at + 40 * MS_DAY, atWork: { stateId: 'us-ct', weeklyWage: 90_00, paidDays: 0 } };
    tended(sim, friday.at + MS_HOUR, MS_HOUR);
    const wages = sim.universe.transactions.filter((t) => t.at === friday.at && t.memo === 'Yale Summer Cabaret stipend, the week');
    expect(wages).toHaveLength(1);
    expect(-wages[0]!.postings.find((x) => x.accountId === sim.nominalAccount('income', 'Wages').id)!.amount).toBe(SUMMER_CABARET.stipendWeekly);
  }, 300_000);
});

/** The first spring's Carlotta Festival, played to its first work-through note on the craft, keeping up the part. */
function toCraftNote(seed: string): { sim: Simulation; note: DirectorNote } {
  const sim = student(seed);
  sim.advanceTo(at(2027, 1, 4) + 60_000);
  for (const call of schoolCalls(sim, 'rehearsal')) {
    tended(sim, call.at + 6 * MS_HOUR + 30 * 60_000);
    if (proc(sim).lines < 0.97) sim.execute({ kind: 'school.learn_part', payload: {} });
    if (proc(sim).blockingMissed > 0) sim.execute({ kind: 'school.review_blocking', payload: {} });
    const last = proc(sim).notes.at(-1);
    if (last && last.taken === undefined && !last.worked) {
      if (last.focus.kind === 'craft') return { sim, note: last };
      sim.execute({ kind: 'school.work_note', payload: {} });
    }
  }
  throw new Error('no craft note');
}

describe('PLAYER JOURNEY: a way at a note put back', () => {
  it('shows The Ways At It again, the way put back gone from it, so the next is chosen', () => {
    const { sim, note } = toCraftNote('g8-13-ways');
    const piece = workPiece(sim, sim.player, 'part:school')!;
    const ways = solutionsOf(piece, note);
    const change = ways.find((o) => o.adjustment === 'beat-way')!;
    expect(change).toBeDefined();
    const html = () => { h.sim = sim; return renderToStaticMarkup(createElement(RehearsalProcess, { casting: sim.player.school!.casting! as Holder, which: 'school' })).replace(/<!-- -->/g, ''); };
    expect(html()).toContain('aria-label="A Way At The Note"');
    // Worked a way that changes how it's played, then put back.
    sim.must({ kind: 'school.work_note', payload: { solution: change.adjustment, option: change.option } });
    expect(html()).not.toContain('aria-label="A Way At The Note"');
    sim.must({ kind: 'work.settle', payload: { piece: 'part:school', keep: false } });
    expect(reworkable(proc(sim))).toBe(true);
    const left = solutionsOf(workPiece(sim, sim.player, 'part:school'), note);
    expect(left.some((o) => o.adjustment === change.adjustment && o.option === change.option)).toBe(false);
    const markup = html();
    const select = markup.match(/<select aria-label="A Way At The Note"[^>]*>(.*?)<\/select>/)?.[1];
    expect(select).toBeDefined();
    expect([...select!.matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map((m) => m[1])).toEqual(left.map((o) => o.label));
    expect(markup).toContain(`Work On The Note: ${left[0]!.label}`);
  }, 180_000);
});

describe('PLAYER JOURNEY: a blocking note given for a missed call', () => {
  it('closes the gap once worked, as going back through the book does', () => {
    const sim = student('g8-13-blocking');
    sim.advanceTo(at(2027, 1, 4) + 60_000);
    const rehearsals = schoolCalls(sim, 'rehearsal');
    const work = rehearsals.findIndex((r) => r.payload.stage === 'work');
    const blocking = rehearsals[work - 1]!;
    expect(blocking.payload.stage).toBe('blocking');
    for (const call of rehearsals.slice(0, work - 1)) {
      tended(sim, call.at + 6 * MS_HOUR + 30 * 60_000);
      if (proc(sim).lines < 0.97) sim.execute({ kind: 'school.learn_part', payload: {} });
    }
    // A day in New York over the last blocking call: missed, a gap in the book, and not caught up.
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, blocking.at + 7 * MS_HOUR);
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(blocking.status).toBe('missed');
    expect(proc(sim).blockingMissed).toBe(1);
    tended(sim, rehearsals[work]!.at + 6 * MS_HOUR + 30 * 60_000);
    const note = proc(sim).notes.at(-1)!;
    expect(note.focus.kind).toBe('blocking');
    expect(note.text).toBe('The blocking isn’t set in you: go back through the book, so the stage pictures land where they’re meant to.');
    sim.must({ kind: 'school.work_note', payload: {} });
    expect(proc(sim).blockingMissed).toBe(0);
    expect(ownWorkRefusal(sim, sim.player, 'school', 'blocking')).toBe('You haven’t missed any blocking.');
    // The next work-through: the note was taken, and a blocking note now is for the blocking still short, not the gap.
    const next = rehearsals.slice(work + 1).find((r) => r.payload.stage === 'work')!;
    tended(sim, next.at + 6 * MS_HOUR + 30 * 60_000);
    expect(note.taken).toBe(true);
    const after = proc(sim).notes.at(-1)!;
    expect(after).not.toBe(note);
    if (after.focus.kind === 'blocking') expect(proc(sim).blocking).toBeLessThan(0.7);
  }, 180_000);
});
