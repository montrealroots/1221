/**
 * Five defects found by the triage of 2026-10-12 in the work so far, the workbook and the productions, each held here
 * against the engine (from 2026-10-12):
 * - Your Work So Far's note that keeps coming back printed the ledger's key ("A note on memorization", "dim:memorization");
 * - Work It Through's preparation problems were labelled in sentence case on a button ("The lines: Not There Yet");
 * - the Summer Cabaret booked the third show's afternoon rehearsals over the second show's Saturday matinees, and the
 *   summer part flipped between the two shows from one call to the next while they overlapped;
 * - a craft note worked through `school.work_note` skipped every check `work.try` makes of the same way (a hospital
 *   bed, asleep, too tired for work on your feet), and a fixed hour, not the way's own minutes, set its window;
 * - a note on the director's request could be worked for an hour that could never answer it.
 * PLAYER JOURNEYS play through commands; FIXTURES set a state by hand to reach one rule, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { BRIEFS } from '@/engine/content/briefs';
import { ADJUSTMENTS } from '@/engine/content/workbook';
import { CALL_KIND, SUMMER_KIND } from '@/engine/systems/school';
import { hasProcess, holderFor, ownWorkRefusal, solutionsOf, stagesOf, type DirectorNote, type Process } from '@/engine/systems/production';
import { problemsOf, tryRefusal, wayRefusal } from '@/engine/systems/workbook';
import { workPiece } from '@/engine/systems/workpieces';
import { identityOf } from '@/engine/systems/artistry';
import { journeyOf } from '@/engine/systems/evaluation';
import { courseworkOf, notesOf } from '@/engine/systems/coursework';
import { recordNote } from '@/engine/systems/learning';
import { healthOf } from '@/engine/systems/health';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** Played by somebody who looks after themselves, awake through the evening, as tests/direction.test.ts plays one. */
const tended = (sim: Simulation, until: number, step = 6 * MS_HOUR) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + step)); } };
const dayOf = (when: number) => { const p = zonedParts(when, zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

describe('Your Work So Far: a note that keeps coming back', () => {
  it('names the note’s subject as the class does, not the ledger’s key', () => {
    const sim = student('g8-11-artistry');
    const person = sim.player;
    // FIXTURE: six pieces judged for life, and the same note on the lines given three times and still open, kept by the
    // coursework's own ledger (`recordNote`), rather than three showings played to it.
    journeyOf(person).totals = { scene: { n: 6, sum: 300, best: 60, bands: {}, mastery: 0 } };
    const notes = notesOf(courseworkOf(sim, person)!);
    for (const on of ['2026-09-21', '2026-10-05', '2026-10-19']) recordNote(notes, { kind: 'dim', dim: 'memorization' }, on, `fixture-${on}`, 'DRAM 100a');
    const line = identityOf(person).weaknesses.find((w) => w.label === 'A Note That Keeps Coming Back');
    expect(line).toBeDefined();
    expect(line!.line).toBe('The same note has been given 3 times and is still open: Lines.');
    expect(line!.evidence).toEqual(['The class’s notes: Lines']);
    expect(`${line!.line} ${line!.evidence.join(' ')}`).not.toMatch(/memorization|dim:/);
  });
});

describe('Work It Through: a part of preparation short', () => {
  it('is labelled in Title Case, as every button is', () => {
    const sim = student('g8-11-prep');
    // TEST SETUP: the clock's own commitments cleared and the day kept rested, as tests/workbook.test.ts does, so the
    // brief is what's measured.
    const go = (kind: string, payload: Record<string, unknown>) => {
      for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
      Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
      sim.must({ kind, payload });
    };
    const brief = BRIEFS[0]!;
    go('brief.choose', { brief: brief.id, reading: brief.readings[0]!.id });
    // Read, the lines learned and a first rehearsal: the genre, never prepared, is what's short.
    for (const step of ['read', 'lines', 'lines', 'rehearse']) go('brief.prepare', { brief: brief.id, step });
    const prep = problemsOf(workPiece(sim, sim.player, `brief:${brief.id}`)!).filter((p) => p.kind === 'prep');
    expect(prep.map((p) => p.label)).toContain('Knowing The Genre: Not There Yet');
    for (const p of prep) {
      expect(p.label).toMatch(/: Not There Yet$/);
      // Every word of it starts with a capital.
      for (const word of p.label.split(/\s+/)) expect(word, p.label).toMatch(/^[^a-z]/);
    }
  });
});

/** The first spring's Carlotta Festival, played to its first work-through note of `kind`, keeping up the part between calls. */
function toNote(seed: string, kind: DirectorNote['focus']['kind'], before?: (sim: Simulation) => void) {
  const sim = student(seed);
  sim.advanceTo(at(2027, 1, 4) + 60_000);
  const proc = (): Process => { const c = sim.player.school!.casting!; if (!hasProcess(c)) throw new Error('no process'); return c.process; };
  const calls = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((a, b) => a.at - b.at);
  for (const call of calls) {
    tended(sim, call.at + 6 * MS_HOUR + 30 * 60_000);
    if (call === calls[0]) before?.(sim);
    if (proc().lines < 0.97) sim.execute({ kind: 'school.learn_part', payload: {} });
    if (proc().blockingMissed > 0) sim.execute({ kind: 'school.review_blocking', payload: {} });
    const last = proc().notes.at(-1);
    if (last && last.taken === undefined && !last.worked) {
      if (last.focus.kind === kind) return { sim, note: last, proc: proc(), next: calls[calls.indexOf(call) + 1]! };
      sim.execute({ kind: 'school.work_note', payload: {} });
    }
  }
  throw new Error(`no ${kind} note`);
}

describe('PLAYER JOURNEY: Work On The Note, for a note on the craft', () => {
  it('refuses the way from a hospital bed, asleep or too tired to be on your feet, as Work It Through refuses it', () => {
    const { sim, note } = toNote('g8-11-craft', 'craft');
    const piece = workPiece(sim, sim.player, 'part:school')!;
    const way = solutionsOf(piece, note).find((o) => ADJUSTMENTS[o.adjustment].feet)!;
    expect(way).toBeDefined();
    const payload = { solution: way.adjustment, ...(way.option ? { option: way.option } : {}) };
    const was = sim.now;
    const refused = (why: string) => {
      expect(wayRefusal(sim, sim.player, piece, way.adjustment)).toBe(why);
      expect(sim.execute({ kind: 'school.work_note', payload }).error).toBe(why);
      expect(note.worked).toBeUndefined();
      expect(sim.now).toBe(was);
    };
    // FIXTURE: in a hospital bed for the next three hours, as a stay puts one.
    healthOf(sim.player).inHospitalUntil = sim.now + 3 * MS_HOUR;
    refused('Not from a hospital bed.');
    // The same way through the workbook's door: the same reason.
    expect(sim.execute({ kind: 'work.identify', payload: { piece: 'part:school', problem: (note.focus as { problem: string }).problem } }).ok).toBe(true);
    expect(tryRefusal(sim, sim.player, workPiece(sim, sim.player, 'part:school'), way.adjustment, way.option)).toBe('Not from a hospital bed.');
    healthOf(sim.player).inHospitalUntil = sim.now - 1;
    // FIXTURE: asleep, then awake and spent.
    sim.player.awakeSince = sim.now + MS_HOUR;
    refused('You’re asleep.');
    sim.player.awakeSince = sim.now;
    sim.player.wellbeing.energy = 10;
    refused('You’re too tired to work on your feet. Sleep first.');
    // The falsifiability test: rested and well, the same way is worked.
    sim.player.wellbeing.energy = 90;
    expect(sim.execute({ kind: 'school.work_note', payload }).ok).toBe(true);
    expect(note.worked).toBe(true);
  }, 120_000);

  it('lets the way’s own minutes set the window before the next commitment, not a fixed hour', () => {
    const { sim, note } = toNote('g8-11-craft', 'craft');
    const next = sim.universe.scheduled.filter((i) => i.status === 'pending' && i.requiresPlayer === true && i.at > sim.now + MS_HOUR).sort((a, b) => a.at - b.at)[0]!;
    tended(sim, next.at - 40 * 60_000);
    const piece = workPiece(sim, sim.player, 'part:school')!;
    const ways = solutionsOf(piece, note);
    const short = ways.find((o) => o.minutes <= 30)!;
    expect(short).toBeDefined();
    // Forty minutes before it: a half-hour way fits.
    expect(ownWorkRefusal(sim, sim.player, 'school', 'note')).toBeUndefined();
    expect(wayRefusal(sim, sim.player, piece, short.adjustment)).toBeUndefined();
    for (const long of ways.filter((o) => o.minutes > 40)) expect(wayRefusal(sim, sim.player, piece, long.adjustment)).toMatch(/there isn’t the time before it/);
    const r = sim.execute<{ worked: boolean }>({ kind: 'school.work_note', payload: { solution: short.adjustment, ...(short.option ? { option: short.option } : {}) } });
    expect(r.ok, r.error).toBe(true);
    expect(note.worked).toBe(true);
    expect(sim.now).toBe(next.at - (40 - short.minutes) * 60_000);
  }, 120_000);
});

describe('PLAYER JOURNEY: Work On The Note, for a note on the director’s request', () => {
  it('spends no hour on it, says what answers it, and the changed playing does', () => {
    // The Carlotta's director in this life asks for it driven (`drawDirection`); the part is played measured from the
    // read-through, so the first work-through's note is on the request.
    const { sim, note, proc, next } = toNote('g8-11-dir-b', 'direction', (s) => {
      expect(s.player.school!.casting && hasProcess(s.player.school!.casting) ? s.player.school!.casting.process.direction : undefined).toEqual({ pace: 'driven' });
      s.must({ kind: 'school.choose_part_playing', payload: { which: 'school', pace: 'measured' } });
    });
    expect(note.focus).toMatchObject({ kind: 'direction', axis: 'pace', side: 'driven' });
    const why = 'This note asks for the part played another way: change it under How You’ll Play It.';
    expect(ownWorkRefusal(sim, sim.player, 'school', 'note')).toBe(why);
    const was = sim.now;
    expect(sim.execute({ kind: 'school.work_note', payload: {} }).error).toBe(why);
    expect(sim.now).toBe(was);
    expect(note.worked).toBeUndefined();
    // What answers it: the part played as asked, taken at the next call.
    sim.must({ kind: 'school.choose_part_playing', payload: { which: 'school', pace: 'driven' } });
    expect(ownWorkRefusal(sim, sim.player, 'school', 'note')).toBe('You’ve changed how you play it: the next call will show it.');
    tended(sim, next.at + 7 * MS_HOUR);
    expect(note.taken).toBe(true);
    expect(proc.notes.includes(note)).toBe(true);
  }, 120_000);
});

describe('PLAYER JOURNEY: the Summer Cabaret of 2027', () => {
  /** A first-year in the summer's company, played from the spring. */
  function company(seed: string) {
    const sim = student(seed);
    sim.advanceTo(at(2027, 3, 20, 12));
    // TEST SETUP: in good standing, which the company asks of a student; this is a test of the summer, not the year.
    sim.player.school!.standing = 'good';
    sim.player.currentLocationId = 'us-ct-newhaven';
    sim.must({ kind: 'school.summer_cabaret', payload: {} });
    return sim;
  }
  const summerCalls = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === SUMMER_KIND && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);

  it('books no show’s rehearsal over another show’s performance, and numbers the calls it keeps', () => {
    const sim = company('g8-11-summer');
    const calls = summerCalls(sim);
    const shows = calls.filter((i) => i.payload.call === 'performance');
    const rehearsals = calls.filter((i) => i.payload.call === 'rehearsal');
    const clashes = rehearsals.filter((r) => shows.some((p) => p.payload.run !== r.payload.run && p.at < r.at + r.durationMinutes! * 60_000 && r.at < p.at + p.durationMinutes! * 60_000));
    expect(clashes.map((r) => `${r.payload.run} ${dayOf(r.at)}`)).toEqual([]);
    // The third show's Saturdays under the second's run gave way; the rest of its weeks are kept.
    const third = rehearsals.filter((r) => r.payload.run === 2);
    expect(third.map((r) => dayOf(r.at))).not.toContain('2027-07-24');
    expect(third.map((r) => dayOf(r.at))).not.toContain('2027-07-31');
    expect(third.map((r) => dayOf(r.at))).toContain('2027-08-07');
    for (const run of [0, 1, 2]) {
      const mine = rehearsals.filter((r) => r.payload.run === run);
      expect(mine.map((r) => r.payload.n)).toEqual(mine.map((_, i) => i + 1));
      expect(mine.every((r) => r.payload.of === mine.length)).toBe(true);
      expect(mine.map((r) => r.payload.stage)).toEqual(stagesOf(mine.length));
    }
  });

  it('keeps the summer part on one show while two overlap: the one rehearsing, else the one running', () => {
    const sim = company('g8-11-summer');
    const school = sim.player.school!;
    const readThrough = summerCalls(sim).find((i) => i.payload.run === 2 && i.payload.n === 1)!;
    expect(dayOf(readThrough.at)).toBe('2027-07-23');
    tended(sim, at(2027, 7, 20, 9));
    const held: { at: number; show: number }[] = [];
    while (sim.now < at(2027, 8, 3, 9)) {
      tended(sim, sim.now + MS_HOUR, MS_HOUR);
      held.push({ at: sim.now, show: school.summer!.shows!.indexOf(holderFor(sim, sim.player, 'summer') as never) });
    }
    expect(school.summer!.out).toBeFalsy();
    expect(readThrough.status).toBe('done');
    // The second show to the third's read-through, the second's opening night that morning included; the third from it
    // on, the second's nights and matinees to its closing on 1 August included.
    expect(held.filter((h) => h.at < readThrough.at).every((h) => h.show === 1)).toBe(true);
    expect(held.filter((h) => h.at > readThrough.at).every((h) => h.show === 2)).toBe(true);
  }, 180_000);
});
