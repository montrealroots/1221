/**
 * The people traits, charged (2026-09-28): what each said about other people
 * was said back until the classmates were there to read it. A slight cuts a
 * grudge-holder deeper and a forgiving person less; the guarded and the
 * independent warm slowly; somebody who needs people gets more from a friend
 * in the cast, and a cast without one weighs on them.
 */

import { describe, expect, it } from 'vitest';
import type { Person } from '@/engine/domain/model';
import { bondMove, castCompany, BONDS } from '@/engine/systems/school';
import { personalityOf } from '@/engine/systems/personality';
import { partTaken } from '@/engine/systems/rivals';

const who = (traits: string[]) => ({ personalityTraits: traits, personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 } } as unknown as Person);

describe('the people traits', () => {
  it('take a slight as they say they do', () => {
    const slight = BONDS.shared - BONDS.leadTaken;
    expect(bondMove(who(['holds_grudges']), slight)).toBeLessThan(bondMove(who([]), slight));
    expect(bondMove(who(['forgiving']), slight)).toBeGreaterThan(bondMove(who([]), slight));
    expect(bondMove(who(['quick_tempered']), slight)).toBeLessThan(bondMove(who([]), slight));
    expect(bondMove(who(['peacemaker']), slight)).toBeGreaterThan(bondMove(who([]), slight));
    // A slight doesn't move by warmth, nor a kindness by the wound.
    expect(bondMove(who(['guarded']), slight)).toBe(bondMove(who([]), slight));
    expect(bondMove(who(['holds_grudges']), BONDS.shared)).toBe(BONDS.shared);
  });

  it('warm as they say they do', () => {
    expect(bondMove(who(['guarded']), BONDS.shared)).toBeLessThan(BONDS.shared);
    expect(bondMove(who(['independent']), BONDS.shared)).toBeLessThan(BONDS.shared);
    expect(bondMove(who(['even_tempered']), BONDS.shared)).toBeLessThan(BONDS.shared);
    expect(bondMove(who(['open_book']), BONDS.shared)).toBeGreaterThan(BONDS.shared);
    expect(bondMove(who(['generous']), BONDS.shared)).toBeGreaterThan(BONDS.shared);
  });

  it('are worth more or less in company', () => {
    expect(personalityOf(who(['needs_people']), 'company')).toBeGreaterThan(1);
    expect(personalityOf(who(['independent']), 'company')).toBeLessThan(1);
    expect(personalityOf(who([]), 'company')).toBe(1);
    expect(castCompany(who(['needs_people']), 2)).toBeGreaterThan(castCompany(who([]), 2));
    expect(castCompany(who(['independent']), 2)).toBeLessThan(castCompany(who([]), 2));
    expect(castCompany(who([]), 0)).toBe(0);
    expect(castCompany(who(['independent']), 0)).toBe(0);
    expect(castCompany(who(['needs_people']), 0)).toBeLessThan(0);
  });

  it('set a part lost to a classmate after school between them, by how the player takes a slight', () => {
    const apart = (traits: string[]) => {
      const p = { ...who(traits), school: { classmates: [{ name: 'A', bond: 30 }] } } as unknown as Person;
      partTaken(p, 0);
      return 30 - p.school!.classmates[0]!.bond!;
    };
    expect(apart([])).toBe(BONDS.leadTaken);
    expect(apart(['holds_grudges'])).toBeGreaterThan(apart([]));
    expect(apart(['forgiving'])).toBeLessThan(apart([]));
  });
});
