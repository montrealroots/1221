/**
 * The director's notes so far, on the rehearsal process (from 2026-10-13, `ui/components/RehearsalProcess.tsx`). Until
 * then a note's outcome went from the screen when the next call gave another note, and a player couldn't see whether
 * the note they had worked was taken: only a count, "Notes taken: N of M". Each earlier note is listed now with its
 * outcome, and the way it was worked with its figure before, after and at the next call. The last note’s own line named
 * the way by its kind alone until later that day, “Worked play this part another way” for a movement played to a side,
 * after the list had been given the way’s own label; found by the guide audit of that day, and held here too.
 *
 * PLAYER JOURNEY: the first spring's festival played through its calls, as tests/direction.test.ts plays it, every note
 * worked the first way offered and each change kept. TEST SETUP: the day kept rested (`tended`), so the calls are what's
 * measured. The screen is rendered as the player has it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { CALL_KIND } from '@/engine/systems/school';
import { hasProcess, solutionsOf } from '@/engine/systems/production';
import { workPiece } from '@/engine/systems/workpieces';
import { ADJUSTMENTS } from '@/engine/content/workbook';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

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
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

/** The process as a player sees it: its words, with every tooltip taken out before the tags. */
function shown(sim: Simulation): string {
  h.sim = sim;
  const casting = sim.player.school!.casting!;
  const html = renderToStaticMarkup(createElement(RehearsalProcess, { casting, which: 'school' } as never)).replace(/<!-- -->/g, '');
  return html.replace(/\stitle="[^"]*"/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

describe('the director’s notes so far', () => {
  it('PLAYER JOURNEY: lists each earlier note with what came of it, and the way it was worked with its figures', () => {
    const sim = createSave(1, 'notes-history', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.advanceTo(at(2027, 1, 4) + 60_000);
    const proc = () => { const c = sim.player.school!.casting!; return hasProcess(c) ? c.process : undefined; };
    const calls = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((a, b) => a.at - b.at);
    for (let k = 0; k < calls.length - 1; k += 1) {
      tended(sim, calls[k]!.at + 6 * MS_HOUR + 30 * 60_000);
      if ((proc()?.lines ?? 1) < 0.97) sim.execute({ kind: 'school.learn_part', payload: {} });
      if ((proc()?.blockingMissed ?? 0) > 0) sim.execute({ kind: 'school.review_blocking', payload: {} });
      const last = proc()?.notes.at(-1);
      if (last && last.taken === undefined && !last.worked) {
        const r = sim.execute<{ pending?: boolean }>({ kind: 'school.work_note', payload: {} });
        if (r.ok && r.value?.pending) sim.execute({ kind: 'work.settle', payload: { piece: 'part:school', keep: true } });
      }
    }
    const notes = proc()!.notes;
    expect(notes.length).toBeGreaterThan(2);
    const text = shown(sim);
    expect(text).toContain('The Director’s Notes So Far');
    // Every note but the last, with its outcome as the process has it.
    for (const n of notes.slice(0, -1)) {
      expect(text, n.text).toContain(n.text);
      const word = n.taken === undefined ? (n.worked ? '· Worked On' : '· Not Worked On') : n.taken ? '· Taken' : '· Not Taken';
      expect(text).toContain(`${n.text} ${word}`);
    }
    // A craft note worked a way: the way, its figure before and after, and at the next call.
    const worked = notes.slice(0, -1).find((n) => n.answer?.solution && n.answer.now !== undefined);
    expect(worked, 'an earlier craft note worked a way').toBeDefined();
    // The way's own label, kept on the answer from 2026-10-13: a movement played to a side names the side.
    expect(worked!.answer!.label, 'the way worked is kept by its label').toBeTruthy();
    expect(ADJUSTMENTS[worked!.answer!.solution as keyof typeof ADJUSTMENTS]).toBeDefined();
    const label = worked!.answer!.label!.toLowerCase();
    expect(text).toContain(`· Worked ${label}: ${worked!.answer!.before} before, ${worked!.answer!.after} after, ${worked!.answer!.now} at the next call`);
  }, 120_000);

  it('PLAYER JOURNEY: the last note worked by playing a movement to a side names the side, not the kind of way', () => {
    const sim = createSave(1, 'notes-last-way', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.advanceTo(at(2027, 1, 4) + 60_000);
    const proc = () => { const c = sim.player.school!.casting!; return hasProcess(c) ? c.process : undefined; };
    const calls = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((a, b) => a.at - b.at);
    // Played as the journey above plays it, until a note can be worked by playing a movement to a side: that way.
    let side: { option?: string; label: string } | undefined;
    for (let k = 0; k < calls.length - 1 && !side; k += 1) {
      tended(sim, calls[k]!.at + 6 * MS_HOUR + 30 * 60_000);
      if ((proc()?.lines ?? 1) < 0.97) sim.execute({ kind: 'school.learn_part', payload: {} });
      if ((proc()?.blockingMissed ?? 0) > 0) sim.execute({ kind: 'school.review_blocking', payload: {} });
      const last = proc()?.notes.at(-1);
      if (!last || last.taken !== undefined || last.worked) continue;
      const way = solutionsOf(workPiece(sim, sim.player, 'part:school'), last).find((o) => o.adjustment === 'beat-way');
      if (way && sim.execute({ kind: 'school.work_note', payload: { solution: way.adjustment, option: way.option } }).ok) { side = way; break; }
      const r = sim.execute<{ pending?: boolean }>({ kind: 'school.work_note', payload: {} });
      if (r.ok && r.value?.pending) sim.execute({ kind: 'work.settle', payload: { piece: 'part:school', keep: true } });
    }
    expect(side, 'a note worked by playing a movement to a side').toBeDefined();
    const answer = proc()!.notes.at(-1)!.answer!;
    // The workbook’s way at a movement (`optionsOf`): “Play”, the movement, and the side, here the Pace axis’s Measured.
    expect(side!.label).toBe('Play The Second Half Measured');
    expect(answer).toMatchObject({ solution: 'beat-way', label: 'Play The Second Half Measured' });
    const text = shown(sim);
    // Its own label, as The Director’s Notes So Far and a note said again name it; until 2026-10-13 the last note’s line
    // read “Worked play this part another way” here, the kind of way.
    expect(text).toContain('The director’s last note');
    expect(text).toContain(`Worked play the second half measured: ${answer.before} before, ${answer.after} after.`);
    expect(text).not.toContain('Worked play this part another way');
  }, 120_000);

  it('isn’t shown with one note or none: nothing earlier to list', () => {
    const sim = createSave(1, 'notes-history-none', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.advanceTo(at(2027, 1, 4) + 60_000);
    expect(shown(sim)).not.toContain('The Director’s Notes So Far');
  });
});
