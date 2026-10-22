/**
 * Brief 20, the craft area's controlled comparisons reached through the clock (criteria B1 and B3;
 * docs/verification/audit-2026-10-21/areas/craft): a showing in class, a revision, a night on stage and the chair's
 * casting, each come to by living the days (`live`, tests/fakes/craft-life.ts), never by calling its handler.
 *
 * Twins alike but for one input, from one seed: the same evenings' commands, the same classes and calls, tended alike
 * (`tend`). TEST SETUP is only the input itself, set before the first day: an ability's level (`setAbility`). Tiredness is
 * the clock's: a twin kept up through a night, an hour at a time, as a player who's there keeps them up. Preparation and
 * a note's reading are the player's own commands, or their absence.
 *
 * Figures measured on 2026-10-21 at 12c04ee1 (`FIGURES` in the log); the area's report gives them.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { CALL_KIND } from '@/engine/systems/school';
import { courseworkOf, notesOf, type Assignment } from '@/engine/systems/coursework';
import { noteKey } from '@/engine/systems/learning';
import { readiness } from '@/engine/systems/life';
import { at, live, reload, run, sceneStudy, setAbility, student, workScene } from './fakes/craft-life';

const firstScene = (sim: Simulation): Assignment => courseworkOf(sim, sim.player)!.assignments.find((a) => a.course === 'DRAM 103a/b')!;
const shownRecord = (sim: Simulation, a: Assignment) => (sim.player.work ?? []).find((w) => w.at === a.shown!.at && w.what === 'Scene Study')!;
/** The first Scene Study, prepared each evening by the steps in `order`, shown at Acting I on 8 September. */
const SHOWN = at(2026, 9, 8, 12);
const FULL = ['read', 'learn', 'reader', 'rehearse'] as const;

describe('B3, a showing in class: what it reads, reached through the clock', () => {
  it('an ability: emotional depth at 20 against 90, the same scene prepared the same way', () => {
    const lo = student('b20c-show'); setAbility(lo, 'emotionalDepth', 20);
    const hi = student('b20c-show'); setAbility(hi, 'emotionalDepth', 90);
    for (const sim of [lo, hi]) live(sim, SHOWN, { evening: (s) => workScene(s, FULL) });
    const L = firstScene(lo), H = firstScene(hi);
    console.log('FIGURES showing emotion', L.shown?.score, H.shown?.score, L.shown?.band, H.shown?.band, JSON.stringify(L.prep) === JSON.stringify(H.prep));
    expect(L.prep).toEqual(H.prep);
    expect(H.shown!.score).toBeGreaterThan(L.shown!.score);
  });

  it('preparation: the lines never learned hold the band down; every part prepared shows Working or better', () => {
    const full = student('b20c-show'), noLines = student('b20c-show');
    live(full, SHOWN, { evening: (s) => workScene(s, FULL) });
    live(noLines, SHOWN, { evening: (s) => workScene(s, ['read', 'reader']) });
    const F = firstScene(full), N = firstScene(noLines);
    console.log('FIGURES showing prep', F.shown?.score, F.shown?.band, N.shown?.score, N.shown?.band, JSON.stringify(N.prep));
    expect(N.prep.memorization).toBe(0);
    expect(N.shown!.score).toBeLessThan(F.shown!.score);
    expect(N.shown!.band).toBe('unready');
    expect(F.shown!.band).not.toBe('unready');
  });

  it('the day: untended from the morning before and kept up through the night, the showing is judged worse than rested', () => {
    const rested = student('b20c-show'), up = student('b20c-show');
    // The same evenings' work to the 6th; from eight on the 7th one is left to the day and the night as they come, up
    // through it an hour at a time, and the other tended and to bed at eleven.
    const evening = (s: Simulation, day: number) => { if (day < at(2026, 9, 7)) workScene(s, FULL); };
    live(rested, SHOWN, { evening });
    live(up, SHOWN, { evening, upFrom: at(2026, 9, 7, 8) });
    const R = firstScene(rested), U = firstScene(up);
    const rRec = shownRecord(rested, R), uRec = shownRecord(up, U);
    console.log('FIGURES showing tired', rRec.inputs.condition.readiness.toFixed(1), uRec.inputs.condition.readiness.toFixed(1), R.shown?.score, U.shown?.score);
    expect(U.prep).toEqual(R.prep);
    expect(uRec.inputs.condition.readiness).toBeLessThan(60);
    expect(rRec.inputs.condition.readiness).toBeGreaterThanOrEqual(60);
    expect(U.shown!.score).toBeLessThan(R.shown!.score);
  });

  it('a night not slept with the evening before tended: readiness at nine stays over the sufficient mark, and the showing costs nothing (measured, said in the report)', () => {
    const rested = student('b20c-show'), up = student('b20c-show');
    live(rested, SHOWN, { evening: (s) => workScene(s, FULL) });
    live(up, SHOWN, { evening: (s) => workScene(s, FULL), upFrom: at(2026, 9, 7, 22) });
    const R = firstScene(rested), U = firstScene(up);
    const uRec = shownRecord(up, U);
    console.log('FIGURES showing one night up', shownRecord(rested, R).inputs.condition.readiness.toFixed(1), uRec.inputs.condition.readiness.toFixed(1), R.shown?.score, U.shown?.score);
    expect(U.prep).toEqual(R.prep);
    expect(uRec.inputs.condition.readiness).toBeGreaterThanOrEqual(60);
    expect(U.shown!.score).toBe(R.shown!.score);
  });
});

describe('B3, feedback: a note read and worked on reaches the revision; one unread doesn\'t', () => {
  it('the note on the rehearsal, read and rehearsed against left unread, shown again the next day', () => {
    // No rehearsal before the showing: its note is on the rehearsal (the part shortest by its weight).
    const order = ['read', 'learn', 'reader'] as const;
    const reader = student('b20c-note'), skipper = student('b20c-note');
    for (const sim of [reader, skipper]) live(sim, SHOWN, { evening: (s) => workScene(s, order) });
    const a0 = firstScene(reader), b0 = firstScene(skipper);
    expect(a0.feedback!.focus).toEqual({ kind: 'dim', dim: 'rehearsal' });
    expect(b0.feedback!.focus).toEqual(a0.feedback!.focus);
    expect(a0.status).toBe('revising');
    // The evening between: one reads the note and rehearses; the other leaves it unread, and the piece can't be worked.
    const revised = at(2026, 9, 9, 12);
    live(reader, revised, { evening: (s) => workScene(s, ['rehearse'], 3) });
    live(skipper, revised, { evening: (s) => workScene(s, ['rehearse'], 3, false) });
    const A = firstScene(reader), B = firstScene(skipper);
    const reshown = (sim: Simulation) => (sim.player.work ?? []).find((w) => w.what === 'Scene Study, revised')!;
    const note = (sim: Simulation, a: Assignment) => notesOf(courseworkOf(sim, sim.player)!).find((n) => n.key === noteKey(a.feedback!.focus))!;
    console.log('FIGURES feedback first', a0.shown!.score, b0.shown!.score);
    console.log('FIGURES feedback', A.prep.rehearsal, B.prep.rehearsal, A.revision, B.revision, reshown(reader).overall, reshown(skipper).overall, note(reader, A).status, note(skipper, B).status);
    expect(B.feedback!.seen).toBeFalsy();
    expect(B.prep.rehearsal).toBe(0);
    expect(A.prep.rehearsal).toBeGreaterThan(0.2);
    expect(A.revision!.applied).toBe(true);
    expect(B.revision!.applied).toBe(false);
    expect(reshown(reader).overall).toBeGreaterThan(reshown(skipper).overall);
    expect(note(reader, A).status).toBe('resolved');
    expect(note(skipper, B).status).toBe('open');
    // And the meeting it was shown again at grew the course's skills more for the note taken (`WORK.revision`).
    const grewAt = (sim: Simulation) => (sim.player.development?.history ?? []).filter((h) => h.source === 'class:DRAM 103a/b' && h.at >= at(2026, 9, 9) && h.at < revised).reduce((t, h) => t + h.delta, 0);
    console.log('FIGURES feedback growth', grewAt(reader), grewAt(skipper));
    expect(grewAt(reader)).toBeGreaterThan(grewAt(skipper));
  });
});

describe('B3, a night on stage: what it reads, reached through the clock (the first spring\'s Carlotta Festival)', () => {
  const nights = (sim: Simulation) => (sim.player.work ?? []).filter((w) => w.task === 'performance' && w.what === 'Carlotta Festival Of New Plays');
  const firstNight = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.call === 'performance').sort((a, b) => a.at - b.at)[0]!.at;

  it('an ability a casting doesn\'t read but a night does: discipline at 20 against 90, cast alike', () => {
    const lo = student('b20c-night'); setAbility(lo, 'discipline', 20);
    const hi = student('b20c-night'); setAbility(hi, 'discipline', 90);
    for (const sim of [lo, hi]) live(sim, at(2027, 1, 26));
    expect(lo.player.school!.casting!.size).toBe(hi.player.school!.casting!.size);
    const curtain = firstNight(lo);
    for (const sim of [lo, hi]) live(sim, curtain + 3_600_000);
    const L = nights(lo)[0]!, H = nights(hi)[0]!;
    console.log('FIGURES night discipline', L.overall, H.overall, lo.player.school!.casting!.size, JSON.stringify(L.dims), JSON.stringify(H.dims));
    expect(H.overall).toBeGreaterThan(L.overall);
    expect(H.dims.consistency).toBeGreaterThan(L.dims.consistency!);
  });

  it('the day: kept up the night and day before the first curtain, the night is judged worse', () => {
    const rested = student('b20c-night'), up = student('b20c-night');
    for (const sim of [rested, up]) live(sim, at(2027, 1, 26));
    const curtain = firstNight(rested);
    live(rested, curtain + 3_600_000);
    live(up, curtain + 3_600_000, { upFrom: curtain - 22 * 3_600_000 });
    const R = nights(rested)[0]!, U = nights(up)[0]!;
    console.log('FIGURES night tired', R.inputs.condition.readiness.toFixed(1), U.inputs.condition.readiness.toFixed(1), R.overall, U.overall);
    expect(U.inputs.condition.readiness).toBeLessThan(60);
    expect(U.overall).toBeLessThan(R.overall);
  });
});

describe('B1, casting: abilities change who is cast; what isn\'t read changes nothing', () => {
  const castAt = at(2027, 1, 26);
  const you = (sim: Simulation) => sim.player.school!.castRead!.rows.find((r) => r.you)!;
  const rankOf = (sim: Simulation) => sim.player.school!.castRead!.rows.findIndex((r) => r.you);

  it('every ability and technique a night reads at 30 against 80: the stronger reads first and takes the bigger part', () => {
    const ids = ['emotionalDepth', 'presence', 'listening', 'imagination', 'focus', 'memory', 'adaptability', 'composure', 'vocal', 'physical', 'scene', 'script', 'character', 'coldReading'];
    const lo = student('b20c-cast'), hi = student('b20c-cast');
    for (const id of ids) { setAbility(lo, id, 30); setAbility(hi, id, 80); }
    for (const sim of [lo, hi]) live(sim, castAt);
    console.log('FIGURES casting abilities', you(lo).fit, you(lo).part, rankOf(lo), you(hi).fit, you(hi).part, rankOf(hi));
    expect(you(hi).fit).toBeGreaterThan(you(lo).fit);
    expect(rankOf(hi)).toBe(0);
    expect(rankOf(lo)).toBeGreaterThan(rankOf(hi));
    const size = { featured: 0, supporting: 1, lead: 2 } as const;
    expect(size[hi.player.school!.casting!.size!]).toBeGreaterThan(size[lo.player.school!.casting!.size!]);
  });

  it('genre experience is not read by the casting: six sessions of study change no fit, no read and no part', () => {
    // `castFit` judges a night with its preparation complete; genre experience reaches preparation (`genreSpeed`), not
    // a night prepared, so the chair's read doesn't see it. Measured, and said in the report as it stands.
    const plain = student('b20c-cast'), studied = student('b20c-cast');
    for (const h of [10, 14, 34, 38]) { live(studied, at(2026, 8, 29, h)); run(studied, 'genre.study', { genre: 'drama' }); }
    for (const sim of [plain, studied]) live(sim, castAt);
    expect(studied.player.engagement!.byGenre.drama!.familiarity).toBeGreaterThan(20);
    expect(studied.player.school!.castRead).toEqual(plain.player.school!.castRead);
    expect(studied.player.school!.casting).toEqual(plain.player.school!.casting);
  });

  it('a day tired at the cast list\'s going up changes nothing in the read: the chair reads a sufficient day for everyone', () => {
    const rested = student('b20c-cast'), up = student('b20c-cast');
    live(rested, castAt);
    live(up, castAt, { upFrom: castAt - 30 * 3_600_000 });
    expect(readiness(up.player)).toBeLessThan(readiness(rested.player));
    expect(up.player.school!.castRead!.rows).toEqual(rested.player.school!.castRead!.rows);
    expect(up.player.school!.casting).toEqual(rested.player.school!.casting);
  });
});

describe('B3, the scene goes on: its next piece is set after the showing', () => {
  it('a piece shown is followed by the course\'s next, set at the meeting it was shown at', () => {
    const sim = student('b20c-show');
    live(sim, at(2026, 9, 10, 12), { evening: (s) => workScene(s, FULL) });
    const all = courseworkOf(sim, sim.player)!.assignments.filter((a) => a.course === 'DRAM 103a/b');
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(sceneStudy(sim)!.id).not.toBe(all[0]!.id);
  });
});

describe('D1: time and a save across a showing', () => {
  it('a week jumped in one go across the showing brings it due once; a save opened the night before shows it as the life played straight through does', () => {
    const straight = student('b20c-show');
    live(straight, at(2026, 9, 7, 23, 30), { evening: (s) => workScene(s, FULL) });
    const opened = reload(straight);
    const jumped = reload(straight);
    live(straight, SHOWN);
    live(opened, SHOWN);
    // Sent a week on in one advance, nobody there: the night slept alone, the class met, the piece shown or missed, once.
    jumped.advanceTo(at(2026, 9, 14, 12));
    const shownOn = (sim: Simulation) => (sim.player.work ?? []).filter((w) => w.what === 'Scene Study' && w.at >= at(2026, 9, 8) && w.at < at(2026, 9, 9));
    const A = firstScene(straight), O = firstScene(opened), J = firstScene(jumped);
    expect(shownOn(straight)).toHaveLength(1);
    expect(shownOn(opened)).toHaveLength(1);
    expect(O.shown).toEqual(A.shown);
    expect(O.feedback).toEqual(A.feedback);
    expect(shownOn(jumped).length + (J.status === 'missed' ? 1 : 0)).toBe(1);
    expect(courseworkOf(jumped, jumped.player)!.assignments.filter((a) => a.course === 'DRAM 103a/b' && a.setOn === '2026-08-30')).toHaveLength(1);
  });
});
