import { describe, expect, it } from 'vitest';
import { decideTake, MARKETING_MOVES, POST_MOVES, STORY_MOVES } from '@/engine/world/selling';

describe('production development reaches the commercial outcome', () => {
  const base = {
    negativeCents: 20_000_000_00,
    dealId: 'studio',
    cast: { truth: 60, reads: 60 },
    controversy: 0,
    appeal: 50,
    prestige: 0,
    spark: 50,
  } as const;

  it('makes the locked screenplay a real commercial input', () => {
    const weak = decideTake({ ...base, screenplayQuality: 20 }, 0.5).cents;
    const middle = decideTake({ ...base, screenplayQuality: 50 }, 0.5).cents;
    const strong = decideTake({ ...base, screenplayQuality: 90 }, 0.5).cents;

    expect(strong).toBeGreaterThan(middle);
    expect(middle).toBeGreaterThan(weak);
  });

  it('makes producer-built awareness a separate commercial input', () => {
    const quiet = decideTake({ ...base, marketingAwareness: 20 }, 0.5).cents;
    const neutral = decideTake({ ...base, marketingAwareness: 50 }, 0.5).cents;
    const loud = decideTake({ ...base, marketingAwareness: 90 }, 0.5).cents;

    expect(loud).toBeGreaterThan(neutral);
    expect(neutral).toBeGreaterThan(quiet);
    expect(MARKETING_MOVES.awareness).toBeGreaterThan(0);
  });

  it('makes completed re-edits move the outcome without letting them dominate it', () => {
    const hurt = decideTake({ ...base, postAdjustment: -8 }, 0.5).cents;
    const untouched = decideTake({ ...base, postAdjustment: 0 }, 0.5).cents;
    const helped = decideTake({ ...base, postAdjustment: 12 }, 0.5).cents;

    expect(helped).toBeGreaterThan(untouched);
    expect(untouched).toBeGreaterThan(hurt);
    expect(POST_MOVES.revision).toBeGreaterThan(0);
    expect(helped / untouched).toBeLessThan(1.2);
  });

  it('keeps a legacy picture neutral when it has no replacement screenplay record', () => {
    const legacy = decideTake(base, 0.5).cents;
    const neutral = decideTake({
      ...base,
      screenplayQuality: 50,
      marketingAwareness: 50,
      postAdjustment: 0,
    }, 0.5).cents;
    expect(legacy).toBe(neutral);
  });

  it('keeps screenplay leverage meaningful without making it the whole box office', () => {
    const low = decideTake({ ...base, screenplayQuality: 0 }, 0.5).cents;
    const high = decideTake({ ...base, screenplayQuality: 100 }, 0.5).cents;

    expect(STORY_MOVES.screenplay).toBeGreaterThan(0);
    expect(high / low).toBeGreaterThan(1.2);
    expect(high / low).toBeLessThan(2);
  });
});
