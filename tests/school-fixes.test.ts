/**
 * The school repairs of 2026-10-10, each held by the behaviour it fixed: the term's coursework reaches its
 * evaluation, a piece shown again standing at its second band; a run played after its term's evaluation is judged at
 * the next, once; the craft a call or a night grows is kept in the development history; and the third year's solo
 * showing is judged and recorded.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { LABS } from '@/engine/content/school';
import { developmentOf } from '@/engine/systems/attributes';
import { courseworkOf, type Assignment, type Band } from '@/engine/systems/coursework';
import { ESTIMATE, LAB_KIND, evaluate, grewFrom, rehearse, type Casting } from '@/engine/systems/school';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** TEST SETUP: pieces shown in term 0 at these bands, a second showing's band where given. */
const shownAt = (bands: (Band | [Band, Band])[]) => bands.map((b, i) => ({ id: `t${i}`, term: 0, status: 'done', shown: { band: Array.isArray(b) ? b[0] : b, score: 0.5, at: 0, parts: { prep: 1, craft: 1, ready: 1 }, strengths: [] }, ...(Array.isArray(b) ? { revision: { dueOn: '', before: 0, band: b[1] } } : {}) }) as unknown as Assignment);

describe('a term’s coursework', () => {
  it('half or more of it unready, of three or more shown, falls short; half or more strong is noted', () => {
    for (const [bands, standing, words] of [
      [['unready', 'unready', 'working', 'strong'], 'concern', /2 of the 4 pieces you showed in class were unready/],
      [['strong', 'exceptional', 'working'], 'good', /noted your coursework: 2 of 3 pieces strong or better/],
      [['unready', 'unready'], 'good', /^(?!.*(unready|noted your coursework))/],
    ] as const) {
      const sim = life(`cw-${standing}-${bands.length}`);
      courseworkOf(sim, sim.player)!.assignments.push(...shownAt([...bands]));
      const review = evaluate(sim, sim.player, 0)!;
      expect(review.standing).toBe(standing);
      expect(review.reason).toMatch(words);
      expect(review.coursework?.shown).toBe(bands.length);
    }
  });

  it('reads a piece shown again at its second showing’s band', () => {
    const sim = life('cw-revised');
    courseworkOf(sim, sim.player)!.assignments.push(...shownAt([['unready', 'strong'], ['unready', 'working'], 'strong']));
    const review = evaluate(sim, sim.player, 0)!;
    expect(review.coursework).toEqual({ shown: 3, unready: 0, strong: 2 });
    expect(review.standing).toBe('good');
  });

  it('counts the floors as ESTIMATE says', () => {
    expect(ESTIMATE.coursework).toEqual({ shown: 3, unready: 0.5, strong: 0.5 });
  });
});

describe('a run played after its term’s evaluation', () => {
  it('is judged at the next, and once', () => {
    const sim = life('carlotta');
    const school = sim.player.school!;
    const carlotta: Casting = { production: 'Carlotta Festival Of New Plays', role: 'A Lead In A New Play', kind: 'carlotta', term: 0, performed: 4, size: 'lead', nights: { off: 4 } };
    school.unreviewed = [carlotta];
    const first = evaluate(sim, sim.player, 1)!;
    expect(first.standing).toBe('concern');
    expect(first.reason).toMatch(/Carlotta Festival Of New Plays fell short/);
    expect(carlotta.reviewed).toBe(true);
    expect(school.unreviewed).toBeUndefined();
    // Judged once: the next term doesn't read it again.
    school.casting = carlotta;
    expect(evaluate(sim, sim.player, 2)!.work).toBeUndefined();
  });
});

describe('the craft a call grows', () => {
  it('is kept in the development history under its source', () => {
    const sim = life('grew');
    grewFrom(sim, sim.player, 'rehearsal:test', (c) => rehearse(c, 1));
    const kept = developmentOf(sim.player).history.filter((h) => h.source === 'rehearsal:test');
    expect(kept.length).toBeGreaterThanOrEqual(4);
    expect(kept.every((h) => h.delta > 0)).toBe(true);
  });
});

describe('the third year’s solo showing', () => {
  it('is judged as a night, and kept in the record', () => {
    const sim = life('solo');
    sim.schedule({ at: sim.now + 60_000, kind: LAB_KIND, label: LABS.creator.name, category: 'school', priority: 30, payload: { personId: sim.player.id, showing: true } });
    sim.advanceTo(sim.now + 120_000);
    const work = (sim.player.work ?? []).filter((w) => w.what === LABS.creator.name);
    expect(work).toHaveLength(1);
    expect(sim.universe.notifications.some((n) => n.title.startsWith('Your Solo Showing'))).toBe(true);
  });
});
