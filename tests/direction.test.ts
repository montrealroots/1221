/**
 * The director's notes on the craft (from 2026-10-12; `systems/production.ts`, `systems/workbook.ts`).
 *
 * Played through a production's calls (the Carlotta Festival of the first spring, as the production journey plays it;
 * TEST SETUP: the day kept rested so the calls are what's measured):
 * - past the lines and the blocking, a note names what the part's own forecast shows, as a director says it, with its
 *   place in the play and its figure;
 * - it offers several ways at it, each a different change, and the note worked one way keeps the way and its evidence;
 * - at the next call it's taken only where the work answered it (its figure risen, or its problem gone), and a note
 *   left alone is said again as still there; a later note on the same thing answers what came of the last.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { CALL_KIND } from '@/engine/systems/school';
import { hasProcess, solutionsOf, type DirectorNote } from '@/engine/systems/production';
import { workPiece } from '@/engine/systems/workpieces';
import { problemsOf } from '@/engine/systems/workbook';
import { WORKBOOK } from '@/engine/content/workbook';
import { loadSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

/** Plays the first spring's festival to its dress, working each note the way `work` picks, or leaving it. */
function festival(seed: string, work: (sim: Simulation, note: DirectorNote) => boolean) {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.advanceTo(at(2027, 1, 4) + 60_000);
  const proc = () => { const c = sim.player.school!.casting!; return hasProcess(c) ? c.process : undefined; };
  const calls = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((a, b) => a.at - b.at);
  const offered: number[] = [];
  // The part's problems after each call, for whether a note's problem had left the forecast when it was taken.
  const seen: { at: number; problems: string[] }[] = [];
  for (let k = 0; k < calls.length - 1; k += 1) {
    tended(sim, calls[k]!.at + 6 * MS_HOUR + 30 * 60_000);
    { const piece = workPiece(sim, sim.player, 'part:school'); if (piece) seen.push({ at: sim.now, problems: problemsOf(piece).map((p) => p.id) }); }
    if ((proc()?.lines ?? 1) < 0.97) sim.execute({ kind: 'school.learn_part', payload: {} });
    if ((proc()?.blockingMissed ?? 0) > 0) sim.execute({ kind: 'school.review_blocking', payload: {} });
    const last = proc()?.notes.at(-1);
    if (last && last.taken === undefined && !last.worked) {
      if (last.focus.kind === 'craft') offered.push(solutionsOf(workPiece(sim, sim.player, 'part:school'), last).length);
      if (work(sim, last)) {
        const r = sim.execute<{ pending?: boolean }>({ kind: 'school.work_note', payload: {} });
        expect(r.ok, r.error).toBe(true);
        if (r.value?.pending) sim.execute({ kind: 'work.settle', payload: { piece: 'part:school', keep: true } });
      }
    }
  }
  tended(sim, calls.at(-1)!.at + 7 * MS_HOUR);
  return { sim, notes: proc()!.notes, offered, seen };
}

describe('a note on the craft', () => {
  it('names what the part’s forecast shows, where, with several ways at it; worked, it keeps its way and its evidence', () => {
    const { notes, offered, seen } = festival('direction-worked', () => true);
    const craft = notes.filter((n) => n.focus.kind === 'craft');
    expect(craft.length).toBeGreaterThan(0);
    for (const n of craft) {
      const f = n.focus as Extract<DirectorNote['focus'], { kind: 'craft' }>;
      expect(['objective', 'listening', 'pacing', 'behavior', 'transitions', 'relationship']).toContain(f.note);
      expect(n.text.length).toBeGreaterThan(20);
      expect(n.answer?.solution).toBeDefined();
      expect(typeof n.answer?.before).toBe('number');
    }
    // Several ways at a note, as a rule: more than one on at least half the notes (a segment already played its own way
    // offers only the work).
    expect(offered.filter((x) => x > 1).length).toBeGreaterThanOrEqual(offered.length / 2);
    // Worked, and so taken where the work answered it; each taken one rose, or its problem left the forecast by the call
    // that took it. (Until later on 2026-10-12 this checked only that it rose; once a kept way was rehearsed in at the
    // calls, a way that dipped the figure when tried could take a problem out of the forecast, and the note was taken.)
    // From 2026-10-16 "rose" is by the evidence, not "no worse by a twentieth": a way that moved nothing doesn't take a note.
    for (const n of craft.filter((x) => x.taken)) {
      const problem = (n.focus as { problem: string }).problem;
      const rose = Math.max(n.answer!.after!, n.answer!.now ?? n.answer!.after!) - n.answer!.before >= WORKBOOK.evidence;
      const gone = seen.some((s) => s.at > n.at && !s.problems.includes(problem));
      expect(rose || gone, `${problem}: ${JSON.stringify(n.answer)}`).toBe(true);
      expect(['better', 'resolved']).toContain(n.outcome);
    }
  }, 120_000);

  it('worked a way that moves nothing, is learned from and not taken, says so, keeps it through a reload, and isn’t offered that way again', () => {
    const { sim, notes } = festival('direction-worked', () => true);
    const learned = notes.filter((n) => n.outcome === 'learned');
    expect(learned.length).toBeGreaterThan(0);
    for (const n of learned) {
      expect(n.taken).toBe(false);
      expect(n.worked).toBe(true);
      expect(Math.max(n.answer!.after, n.answer!.now ?? n.answer!.after) - n.answer!.before).toBeLessThan(WORKBOOK.evidence);
    }
    // The note given after a learned one on the same thing says what was tried didn't move it.
    const i = notes.findIndex((n) => n.outcome === 'learned' && n.answer!.after === n.answer!.before);
    const next = notes.slice(i + 1).find((m) => m.focus.kind === 'craft' && (m.focus as { note: string }).note === (notes[i]!.focus as { note: string }).note && (m.focus as { segment?: number }).segment === (notes[i]!.focus as { segment?: number }).segment);
    // Worse by the evidence at the call, it says it made it worse; otherwise that it didn't move it.
    const worse = (a: NonNullable<DirectorNote['answer']>) => Math.min(a.after, a.now ?? a.after) - a.before <= -WORKBOOK.evidence;
    if (next) expect(next.text).toContain(`which ${worse(notes[i]!.answer!) ? 'made it worse' : 'didn’t move it'}: worth knowing, and not the answer.`);
    // The way that moved nothing isn't the way it's worked again.
    const unmoved = notes.filter((n) => n.answer?.solution && n.answer.after === n.answer.before).map((n) => `${(n.focus as { problem: string }).problem}|${n.answer!.solution}`);
    expect(new Set(unmoved).size).toBe(unmoved.length);
    // Kept through a reload, outcome and all.
    const back = loadSave(deserialise(serialise(sim.universe)));
    const c = back.player.school!.casting!;
    expect(hasProcess(c) ? c.process.notes.map((n) => n.outcome) : []).toEqual(notes.map((n) => n.outcome));
  }, 120_000);

  it('left alone, is answered less often than worked, and said again as still there where it isn’t', () => {
    const left = festival('direction-worked', (_sim, n) => n.focus.kind !== 'craft').notes.filter((n) => n.focus.kind === 'craft');
    const worked = festival('direction-worked', () => true).notes.filter((n) => n.focus.kind === 'craft');
    expect(left.length).toBeGreaterThan(0);
    // Left alone, none is resolved while the part falls: a limit is still there while its own cost names it, however
    // another input overtakes it (from 2026-10-16; until then this seed's emotional depth note was resolved as the part
    // fell from 53.1 to 50.3).
    for (const n of left.filter((x) => x.outcome === 'resolved')) expect(n.answer!.now ?? n.answer!.after).toBeGreaterThanOrEqual(n.answer!.before - WORKBOOK.evidence);
    expect(left.every((n) => n.outcome === 'unchanged' || n.outcome === 'resolved')).toBe(true);
    const share = (xs: DirectorNote[]) => xs.filter((n) => n.taken).length / Math.max(1, xs.length);
    // The falsifiability test: working the notes changes what comes of them.
    expect(share(worked)).toBeGreaterThan(share(left));
    expect(left.some((n) => n.taken === false)).toBe(true);
    // A note given again after one left untaken says it's still there, one of three ways from 2026-10-20 (brief 16).
    left.forEach((n, i) => {
      const f = n.focus as { note: string; segment?: number };
      const prior = left.slice(0, i).reverse().find((m) => (m.focus as { note: string }).note === f.note && (m.focus as { segment?: number }).segment === f.segment);
      // In each director's voice from 2026-10-20 (brief 17, `directorVoiceOf`).
      if (prior && prior.taken === false) expect(n.text).toMatch(/^(?:Still: |Same note as at the last call\. |Not there yet\. |The same note as last time: |We’re still on the last note\. |Keep at the last note: )/);
    });
  }, 180_000);
});
