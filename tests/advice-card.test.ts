/**
 * The Profile's What To Work On Next said short, its reasoning behind Why This Recommendation, each shared part once
 * (from 2026-10-20, the owner's brief 16, section 6, `adviceSummary`). The recommendations here are TEST SETUP, made as
 * `recommendations` makes them, so the card's own rules are what's held: the step a recommendation shares with another is
 * said once, the first's own step isn't said again under the others, and the estimate's heading says whose it is.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { adviceSummary } from '@/engine/systems/next-steps';
import type { Recommendation } from '@/engine/systems/experience';
import { MS_DAY, formatDate } from '@/engine/core/time';
import type { WorkRecord } from '@/engine/systems/evaluation';
import { developmentOf } from '@/engine/systems/attributes';

const life = () => createSave(1, 'advice-card', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const ACT = 'That’s preparation, not training: give it more time before you show or tape your next piece.';
const prep = (label: string, points: number): Recommendation => {
  const now = `Going in short on it cost your recent work about ${points} ${points === 1 ? 'point' : 'points'} a piece off the whole.`;
  return { target: `prep:${label}`, label, focus: 'preparation', points, why: `${now} ${ACT}`, now, act: ACT };
};
const training: Recommendation = { target: 'imagination', label: 'Imagination', focus: 'steady', points: 0.6, why: '20 hours …', forecast: { points: 0.6, exact: 0.6, from: 41, to: 52, hours: 20, pieces: 3, of: 5 } };

describe('the advice card', () => {
  it('says a step two others share once, naming them; never the first’s own step again; and whose estimate it works out', () => {
    const sim = life();
    const card = adviceSummary(sim, sim.player, [prep('Lines', 3.1), training, prep('Rehearsal', 1), prep('Taking the director’s notes', 0.9)])!;
    expect(card.what).toBe('Lines');
    expect(card.why).toBe('Going in short on it cost your recent work about 3.1 points a piece off the whole.');
    expect(card.action).toBe(ACT);
    const others = card.details.find((d) => d.heading === 'Other Things Worth Your Time')!;
    expect(others.list).toBe(true);
    // The first said it: not said again, and not once more after the list.
    for (const l of [...others.lines, ...(others.after ?? [])]) expect(l).not.toContain('give it more time');
    expect(others.lines).toContain('Rehearsal: Going in short on it cost your recent work about 1 point a piece off the whole.');
    expect(others.lines).toContain('Imagination: an estimated 0.6 points a piece for 20 hours, from 41 to about 52.');
    expect(card.details[0]!.heading).toBe('How The Training Estimates Are Worked Out');

    // Training first: the two preparations' shared step is said once, after them, with both named.
    const second = adviceSummary(sim, sim.player, [training, prep('Rehearsal', 1), prep('Taking the director’s notes', 0.9)])!;
    expect(second.estimate).toBe('Estimate: 20 hours, an hour a day, would take it from 41 to about 52, worth about 0.6 points a piece on your recent work.');
    expect(second.details[0]!.heading).toBe('How The Estimate Is Worked Out');
    const rest = second.details.find((d) => d.heading === 'Other Things Worth Your Time')!;
    for (const l of rest.lines) expect(l).not.toContain('not training');
    expect(rest.after).toEqual(['Rehearsal and taking the director’s notes are preparation, not training: give each more time before you show or tape your next piece.']);

    // One preparation alone among the others keeps its own step on its line.
    const one = adviceSummary(sim, sim.player, [training, prep('Rehearsal', 1)])!;
    const line = one.details.find((d) => d.heading === 'Other Things Worth Your Time')!;
    expect(line.lines).toEqual([`Rehearsal: Going in short on it cost your recent work about 1 point a piece off the whole. ${ACT}`]);
    expect(line.after).toBeUndefined();
  });

  /**
   * From 2026-10-20 (brief 17): a card the same as the week before said nothing of why. Now, under why it matters, what the
   * record shows of it (`continuing`), and only what the record has. TEST SETUP: the work and the advice's note set as a
   * save keeps them.
   */
  const piece = (at: number, what: string, held: boolean): WorkRecord => ({ at, what, task: 'scene', taskLabel: 'A Scene Shown', overall: 50, dims: {}, mastery: false, ruleset: 'test', inputs: { key: `w:${what}:${at}` } as WorkRecord['inputs'], limits: held ? [{ kind: 'preparation', what: 'rehearsal', label: 'Rehearsal', dimension: 'execution', by: 8, whole: 3 }] : [{ kind: 'ability', what: 'focus', label: 'Focus', dimension: 'execution', by: 2, whole: 1 }] });
  const rehearsal: Recommendation = { ...prep('Rehearsal', 1.5), target: 'prep:rehearsal' };

  it('says how many recent pieces a preparation held back and the latest, and, with no work judged for a week, since when, once', () => {
    const sim = life();
    const day = (n: number) => sim.now - n * MS_DAY;
    const date = (n: number) => formatDate(day(n), sim.zone);
    // Fourteen pieces, the last twelve read: of those, the third and the eleventh from the end held back by rehearsal.
    sim.player.work = Array.from({ length: 14 }, (_, i) => piece(day(30 - i), `Piece ${i + 1}`, i === 0 || i === 1 || i === 4 || i === 12));
    const card = adviceSummary(sim, sim.player, [rehearsal])!;
    // The latest piece, two weeks before, held nothing back: said apart.
    expect(card.continuing).toBe(`It held back 2 of your last 12 pieces, most recently Piece 13, on ${date(18)}. None of your work has been judged since ${date(17)}, 2 weeks ago.`);
    // The first view: why, then this, then what to do (`AdviceCard`'s order).
    expect(card.why).toBe('Going in short on it cost your recent work about 1.5 points a piece off the whole.');
    expect(card.action).toBe(ACT);

    // The latest held back, and nothing since for eight days: said as one.
    sim.player.work = [piece(day(9), 'Scene Study', false), piece(day(8), 'Scene Study, revised', true)];
    expect(adviceSummary(sim, sim.player, [rehearsal])!.continuing).toBe(`It held back 1 of your last 2 pieces, Scene Study, revised, on ${date(8)}, 8 days ago, and none of your work has been judged since.`);
    // The latest held back on the same day as another piece that wasn't, and nothing since: said as one, the day once.
    sim.player.work = [piece(day(9), 'Scene Study', false), piece(day(8) - 3_600_000, 'A Movement Score', true), piece(day(8), 'Table Work', false)];
    expect(adviceSummary(sim, sim.player, [rehearsal])!.continuing).toBe(`It held back 1 of your last 3 pieces, A Movement Score, on ${formatDate(day(8) - 3_600_000, sim.zone)}, 8 days ago, and none of your work has been judged since.`);
    // Held back more in all than of late, by the journey's count for life: said with them.
    sim.player.journey = { totals: {}, byTerm: {}, milestones: [], limits: { 'preparation:rehearsal': { label: 'Rehearsal', n: 23, whole: 70, last: day(1) } } };
    sim.player.work = [piece(day(2), 'Scene Study', true), piece(day(1), 'Table Work', false)];
    expect(adviceSummary(sim, sim.player, [rehearsal])!.continuing).toBe(`It held back 1 of your last 2 pieces and 23 in all, most recently Scene Study, on ${date(2)}.`);
    delete sim.player.journey;
    // Judged yesterday: no word of a quiet week.
    sim.player.work = [piece(day(2), 'Scene Study', true), piece(day(1), 'Table Work', true)];
    expect(adviceSummary(sim, sim.player, [rehearsal])!.continuing).toBe(`It held back each of your last 2 pieces, most recently Table Work, on ${date(1)}.`);
    sim.player.work = [piece(day(1), 'Table Work', true)];
    expect(adviceSummary(sim, sim.player, [rehearsal])!.continuing).toBe(`It held back your last piece, Table Work, on ${date(1)}.`);
    // Nothing on the record that it held back, and work this week: nothing said.
    sim.player.work = [piece(day(1), 'Table Work', false)];
    expect(adviceSummary(sim, sim.player, [rehearsal])!.continuing).toBeUndefined();
  });

  it('says how long a training recommendation has led and the hours put in since, or what it took over from, from the advice’s note', () => {
    const sim = life();
    const at = (n: number) => sim.now - n * MS_DAY;
    const key = (n: number) => { const d = new Date(at(n)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`; };
    const imagination: Recommendation = { target: 'imagination', label: 'Imagination', exercise: 'given-circumstances', tier: 1, focus: 'steady', points: 0.6, why: '20 hours …', forecast: { points: 0.6, exact: 0.6, from: 41, to: 52, hours: 20, pieces: 3, of: 5 } };
    const noted = { level: 40, forecast: 0.6, discipline: 50 };
    sim.player.work = [piece(at(1), 'Table Work', false)];
    sim.player.experience = { features: {}, approaches: {}, exercises: {}, advised: { target: 'imagination', since: at(10), day: key(1), first: { at: at(10), ...noted }, last: { at: at(1), ...noted } } };
    // Three hours of its exercise since it took the lead, one before.
    developmentOf(sim.player).history.push(...[12, 6, 4, 2].map((n) => ({ at: at(n), id: 'imagination', delta: 0.2, source: 'practice:given-circumstances' })));
    expect(adviceSummary(sim, sim.player, [imagination])!.continuing).toBe(`It has led the advice on what to train since ${formatDate(at(10), sim.zone)}, and you’ve practiced The Given Circumstances for 3 hours in that time.`);
    // Another led when the advice was noted, two days ago: it says which.
    sim.player.experience.advised = { target: 'focus', since: at(10), day: key(2), first: { at: at(10), ...noted }, last: { at: at(2), ...noted } };
    expect(adviceSummary(sim, sim.player, [imagination])!.continuing).toMatch(/^It’s taken over from focus, which led the advice on what to train on \w+ \d+, \d{4}\.$/);
    // Noted three weeks ago, another may have led since without a note: nothing said of it.
    sim.player.experience.advised = { ...sim.player.experience.advised, day: key(21) };
    expect(adviceSummary(sim, sim.player, [imagination])!.continuing).toBeUndefined();
  });
});

