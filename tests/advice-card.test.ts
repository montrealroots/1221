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

const life = () => createSave(1, 'advice-card', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const ACT = 'That’s preparation, not training: prepare that part further before you show or tape the next piece.';
const prep = (label: string, points: number): Recommendation => {
  const now = `Coming to your work short on ${label.toLowerCase()} cost each piece about ${points} ${points === 1 ? 'point' : 'points'} off the whole.`;
  return { target: `prep:${label}`, label, focus: 'preparation', points, why: `${now} ${ACT}`, now, act: ACT };
};
const training: Recommendation = { target: 'imagination', label: 'Imagination', focus: 'steady', points: 0.6, why: '20 hours …', forecast: { points: 0.6, exact: 0.6, from: 41, to: 52, hours: 20, pieces: 3, of: 5 } };

describe('the advice card', () => {
  it('says a step two others share once, naming them; never the first’s own step again; and whose estimate it works out', () => {
    const sim = life();
    const card = adviceSummary(sim, sim.player, [prep('Lines', 3.1), training, prep('Rehearsal', 1), prep('Taking the director’s notes', 0.9)])!;
    expect(card.what).toBe('Lines');
    expect(card.why).toBe('Coming to your work short on lines cost each piece about 3.1 points off the whole.');
    expect(card.action).toBe(ACT);
    const others = card.details.find((d) => d.heading === 'Other Things Worth Your Time')!;
    expect(others.list).toBe(true);
    // The first said it: not said again, and not once more after the list.
    for (const l of [...others.lines, ...(others.after ?? [])]) expect(l).not.toContain('prepare that part further');
    expect(others.lines).toContain('Rehearsal: Coming to your work short on rehearsal cost each piece about 1 point off the whole.');
    expect(others.lines).toContain('Imagination: an estimated 0.6 points a piece for 20 hours, from 41 to about 52.');
    expect(card.details[0]!.heading).toBe('How The Training Estimates Are Worked Out');

    // Training first: the two preparations' shared step is said once, after them, with both named.
    const second = adviceSummary(sim, sim.player, [training, prep('Rehearsal', 1), prep('Taking the director’s notes', 0.9)])!;
    expect(second.estimate).toBe('Estimate: 20 hours, an hour a day, would take it from 41 to about 52, worth about 0.6 points a piece on your recent work.');
    expect(second.details[0]!.heading).toBe('How The Estimate Is Worked Out');
    const rest = second.details.find((d) => d.heading === 'Other Things Worth Your Time')!;
    for (const l of rest.lines) expect(l).not.toContain('not training');
    expect(rest.after).toEqual(['Rehearsal and taking the director’s notes are preparation, not training: prepare each part further before you show or tape the next piece.']);

    // One preparation alone among the others keeps its own step on its line.
    const one = adviceSummary(sim, sim.player, [training, prep('Rehearsal', 1)])!;
    const line = one.details.find((d) => d.heading === 'Other Things Worth Your Time')!;
    expect(line.lines).toEqual([`Rehearsal: Coming to your work short on rehearsal cost each piece about 1 point off the whole. ${ACT}`]);
    expect(line.after).toBeUndefined();
  });
});
