/**
 * A refused command puts the world back in place, each record in its own object (`restoreUniverse`). Until 2026-10-11
 * records were matched by id or name, and two with one name, two years' productions of the Carlotta Festival, two
 * Cabaret shows of a season, a classmate in a production and a Cabaret show the same term, came back as one object,
 * the earlier one's record lost. Found by tests/school-paths.test.ts when a class's Cabaret shows were added.
 * FIXTURE: a first class's productions put on by hand, two sharing a name.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';

describe('a refused command', () => {
  it('leaves records that share a name as they were, each its own', () => {
    const sim = createSave(1, 'restore-names', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'they/them' });
    const school = sim.player.school!;
    const show = (term: number) => ({ term, academic: term, name: 'Yale Cabaret, Season 61', from: `2029-0${term}-01`, to: `2029-0${term}-03`, cast: [{ name: `Mate ${term}`, part: 'A Part In A Cabaret Show', size: 'featured' as const, quality: 50 + term }] });
    school.formerClasses = [{ classOf: 2029, classmates: [], playedTo: 5, left: sim.now, offset: 0, productions: [show(4), show(5)] }];
    school.around = { term: 0, list: [{ name: 'Mate 1', production: 'Hedda Gabler', part: 'Thea' }, { name: 'Mate 1', production: 'Yale Cabaret, Season 59', part: 'A Part In A Cabaret Show' }] };
    const [a, b] = school.formerClasses[0]!.productions!;
    // Refused: withdrawing asks to be confirmed.
    expect(sim.execute({ kind: 'school.withdraw', payload: {} }).ok).toBe(false);
    const after = sim.player.school!.formerClasses![0]!.productions!;
    expect(after[0]).toBe(a);
    expect(after[1]).toBe(b);
    expect(after.map((p) => p.term)).toEqual([4, 5]);
    expect(sim.player.school!.around!.list.map((x) => x.production)).toEqual(['Hedda Gabler', 'Yale Cabaret, Season 59']);
  });
});
