/**
 * What the UI audit of 2026-10-10 found said wrong or held untested: creation's height and weight are taken only both
 * given and in range, which the page now says; the Profile's genre to study says why it's offered; a decision about an
 * unclaimed account opens the account; and a risk-taker's card starts its autopay on the minimum, past 65 and not at it.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { openCredit } from '@/engine/systems/credit';
import { BODY_GIVEN, bodyGiven, newLifeConfig } from '@/engine/world/bootstrap';
import { subjectForRef } from '@/ui/looks/subject';
import { nextGenre } from '@/ui/workspaces/ProfileWorkspace';
import type { Person } from '@/engine/domain/model';

describe('creation’s height and weight', () => {
  it('are taken both given and in range, and not otherwise', () => {
    expect(bodyGiven({ heightCm: 170, weightKg: 65 })).toBe(true);
    expect(bodyGiven({ heightCm: 170 })).toBe(false);
    expect(bodyGiven({ heightCm: BODY_GIVEN.heightCm[1] + 1, weightKg: 65 })).toBe(false);
    expect(bodyGiven({ heightCm: 170, weightKg: BODY_GIVEN.weightKg[0] - 1 })).toBe(false);
    // Seven feet eleven was 241 cm, which the feet and inches allowed and creation dropped.
    expect(bodyGiven({ heightCm: (7 * 12 + 11) * 2.54, weightKg: 90 })).toBe(false);
    const sim = createSave(1, 'body-given', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', heightCm: 171, weightKg: 66 });
    expect(sim.player.body).toMatchObject({ heightCm: 171 });
  });
});

describe('the Profile’s genre to study', () => {
  it('says whether a part asks for it or it’s loved', () => {
    const loved = { genres: ['drama'], engagement: { byGenre: {} } } as unknown as Person;
    expect(nextGenre(loved)).toEqual({ id: 'drama', why: 'loved' });
    expect(nextGenre({ genres: [], engagement: { byGenre: {} } } as unknown as Person)).toBeUndefined();
  });
});

describe('a decision about an unclaimed account', () => {
  it('opens the account', () => {
    expect(subjectForRef({ refType: 'unclaimed-notice', refId: 'acct-1' })).toEqual(subjectForRef({ refType: 'account', refId: 'acct-1' }));
  });
});

describe('risk tolerance', () => {
  it('over 65 starts the card’s autopay on the minimum; at 65, in full', () => {
    for (const [risk, autopay] of [[66, 'minimum'], [65, 'full'], [20, 'full']] as const) {
      const sim = createSave(1, `risk-${risk}`, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
      sim.player.personality.riskTolerance = risk;
      openCredit(sim, sim.player, 700);
      expect(sim.player.credit!.autopay).toBe(autopay);
    }
  });
});
