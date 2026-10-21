/**
 * Brief 14's cross-area pass (2026-10-17): the score a raised card limit needs is one figure, `RAISE_FROM` in
 * `systems/credit.ts`, which the six-monthly review, a raise asked for (`card.request_limit` in `systems/cardlife.ts`),
 * its notice and the guide's card entry all read (`docs/verification/language-2026-10-17/crossarea/defects.md`, 3). Until
 * then the ask, its notice and the guide each typed 700 beside the review's constant (money `glossary.md`, For The
 * Coordinator), so a change to the rule would have left them saying, and doing, the old figure.
 *
 * In a file of its own because it moves the constant for every module that imports it. FIXTURE: `RAISE_FROM` moved to
 * 720 (a mocked module), so a figure that only agreed with the constant by being typed the same can't pass; `credit.ts`'s
 * own review keeps the real one, and nothing here reaches it. TEST SETUP: the credit score set by hand.
 *
 * PLAYER JOURNEY: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actress at Yale in New Haven from Monday
 * 24 August 2026 at 7:30 AM, with the Chase Freedom Unlimited every such life starts with.
 */
import { describe, expect, it, vi } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { stateOf } from '@/engine/systems/credit';
import { ASK_EVERY } from '@/engine/systems/cardlife';

const MOVED = 720;
vi.mock('@/engine/systems/credit', async (orig) => ({ ...(await orig<typeof import('@/engine/systems/credit')>()), RAISE_FROM: 720 }));
const { RAISE_FROM } = await import('@/engine/systems/credit');

const student = (seed: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** An instant in New Haven in 2026 before 1 November, on Eastern Daylight Time (UTC−4), worked out here. */
const edt = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour + 4, minute);
const chaseCard = (sim: Simulation) => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card' && a.bankId === 'us-chase' && !a.closedAt)!;
const notes = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

describe('the score a raised card limit needs', () => {
  it('is one figure: moved, a raise asked for a point under it is declined and the notice says the moved figure, at it the raise is granted, and the guide says the moved figure for the ask and the six-monthly review', () => {
    expect(RAISE_FROM).toBe(MOVED);
    const sim = student('xarea-raise');
    sim.advanceTo(edt(8, 24, 9, 1));
    const card = chaseCard(sim);
    const limit = card.creditLimit!;
    sim.player.credit!.late = []; // TEST SETUP: nothing late
    sim.player.credit!.score = MOVED - 1; // TEST SETUP
    expect(sim.must({ kind: 'card.request_limit', payload: { limit: limit + 100_00 } })).toEqual({ limit, granted: false });
    expect(notes(sim, 'Limit Increase Declined').map((n) => n.body)).toEqual([
      expect.stringMatching(new RegExp(`^The bank kept your limit at \\$[\\d,]+\\.\\d\\d\\. It raises a limit only with a credit score of ${MOVED} or more, no late payment in the last year, and income or savings that cover the payments on a higher one\\.$`)),
    ]);
    sim.player.credit!.score = MOVED; // TEST SETUP
    stateOf(sim.player, card).askedAt! -= ASK_EVERY; // TEST SETUP: six months since the declined ask (brief 20's D2)
    expect(sim.must({ kind: 'card.request_limit', payload: { limit: limit + 100_00 } })).toEqual({ limit: limit + 100_00, granted: true });

    const entry = GUIDE_BY_ID['bank.card']!;
    expect(entry.reads.find((f) => f.label === 'A Limit Review')?.value).toBe(`Every six months: a fifth more for a score of ${MOVED} or more with no late payment in a year, or as much of it as your income or savings cover, unless you turned Raise My Limit Automatically off. Income covers it when the minimum payment on the whole new limit, with your other cards’ and loans’, is no more than a quarter of what you earned a month over the past year; savings cover it when what you hold in the bank is at least the new limit and all you owe on cards and loans`);
    expect(entry.now.filter((line) => line.startsWith('Ask For This Limit:'))).toEqual([`Ask For This Limit: a lower limit is granted at once, but never below what you owe. A higher one, up to a fifth more than now, can be asked for six months after the card opened and six months after you last asked or it was last raised. It needs a credit score of ${MOVED} or more, no late payment in a year, a card that isn’t suspended, and income or savings that cover the payments on it, as a review does.`]);
    // No 700 is left in what the guide says of the card.
    expect(JSON.stringify(entry)).not.toMatch(/\b700\b/);
  });
});
