/**
 * Brief 20's money area, B1 and B3: interest, each reached through the commands a player sends and the clock, in twin
 * lives alike in everything but the one choice (docs/verification/audit-2026-10-21/criteria.md).
 *
 * - A card carried against one paid in full: Capital One's Platinum, 28.99% and no introductory rate, the day's
 *   groceries on it. Autopay set to the whole statement in one twin and to the minimum in the other (Autopay on the
 *   card's panel, `finance.set_autopay`). The twin paying in full is charged nothing; the one paying the minimum loses the
 *   grace period at the first due date and is charged at each statement after, the interest built a day at a time on
 *   what's owed. What mustn't move: the record (both paid on time, a sliver of the limit used), the savings' interest and
 *   the School.
 * - Autopay against paying by hand: SLATE's autopay is never off (it pays the minimum or the whole statement); what a
 *   player can do instead is pay by hand first (Pay Card on the panel, `finance.pay_card`), which leaves autopay nothing
 *   to ask. A twin who pays each statement in full by hand the day it comes ends where the twin left to autopay ends:
 *   the same interest (none), the same record, the same fees (none). How it's paid doesn't matter; whether it is does.
 * - A savings rate paying interest: Capital One's 360 Performance Savings at 3.00%. One twin moves $50,000 from checking
 *   into it at noon on 1 September (Move Money); September's interest is the other's and the twenty-nine midnights
 *   from the 2nd to the 30th of $50,000 at 3.00% a year, worked here by hand. What mustn't move: the card and the School.
 * - Which bank holds the money changes nothing at the School: the same life at Chase and at Capital One, through the fall
 *   term, has the same School record, the same craft and the same body.
 *
 * PLAYER JOURNEYS: new lives as creation makes them (`newLifeConfig`), Ada Cole, born in New York, a US citizen, an
 * actor at Yale in New Haven from Monday 24 August 2026 at 7:30 AM, with the wealthy family's money, at Capital One
 * unless a bank is named. Nothing is set by hand. Seeds: b20-money-carry, b20-money-byhand, b20-money-save,
 * b20-money-bank, chosen for these tests and not swapped.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import { cardsOf, stateOf } from '@/engine/systems/credit';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 12) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const life = (seed: string, bankId = 'us-capital-one'): Simulation => createSave(1, seed, {
  ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId,
});
const own = (sim: Simulation, kind: Account['kind']): Account => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt && !a.nominal && a.category !== 'term')!;
const card = (sim: Simulation) => cardsOf(sim, sim.player)[0]!;
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
/** What each posting with this memo did to an account, oldest first, with when. */
const posted = (sim: Simulation, account: Account, memo: RegExp) => sim.universe.transactions
  .filter((t) => memo.test(t.memo) && t.postings.some((p) => p.accountId === account.id))
  .map((t) => ({ at: t.at, amount: t.postings.filter((p) => p.accountId === account.id).reduce((n, p) => n + p.amount, 0) }));

describe('a card carried against one paid in full', () => {
  it('charges the one paying the minimum interest at each statement after its first due date, a day at a time at 28.99%, and the one paying in full nothing; the record, the savings and the School are the same', () => {
    const full = life('b20-money-carry');
    const minimum = life('b20-money-carry');
    for (const sim of [full, minimum]) run(sim, 'bank.set_payments', { everyday: 'credit' });
    run(full, 'finance.set_autopay', { mode: 'full' });
    run(minimum, 'finance.set_autopay', { mode: 'minimum' });
    for (const sim of [full, minimum]) sim.advanceTo(at(2027, 1, 21));

    // Full: never charged.
    expect(posted(full, card(full), /^Interest$/)).toEqual([]);
    // The minimum: the 20 September statement was paid only to its minimum on 15 October, so the 20 October statement
    // and each after charge what built since, a day at a time.
    const charged = posted(minimum, card(minimum), /^Interest$/);
    expect(charged.map((c) => c.at)).toEqual([at(2026, 10, 20, 9), at(2026, 11, 20, 9), at(2026, 12, 20, 9), at(2027, 1, 20, 9)]);
    for (const c of charged) expect(c.amount).toBeLessThan(0);
    // Its size: what's owed grows, so each month's interest is more than the one before, and no more than what the card
    // owed at the statement would build in a 31-day cycle at 28.99% compounded nightly.
    for (let i = 1; i < charged.length; i += 1) expect(-charged[i]!.amount).toBeGreaterThan(-charged[i - 1]!.amount);
    const owedAtLast = -card(minimum).balance;
    expect(-charged.at(-1)!.amount).toBeLessThanOrEqual(Math.ceil(owedAtLast * ((1 + 0.2899 / 365) ** 31 - 1)));
    expect(stateOf(minimum.player, card(minimum)).carrying).toBe(true);
    expect(stateOf(full.player, card(full)).carrying).toBe(false);
    // Paid on time either way: no fee, nothing late, and the same record.
    for (const sim of [full, minimum]) expect(posted(sim, card(sim), /fee/i)).toEqual([]);
    expect(minimum.player.credit!.late).toEqual([]);
    expect(minimum.player.credit!.score).toBe(full.player.credit!.score);
    expect(card(minimum).creditLimit).toBe(card(full).creditLimit);
    // The savings' interest and the School are the same.
    expect(posted(minimum, own(minimum, 'savings'), /^Interest: /)).toEqual(posted(full, own(full, 'savings'), /^Interest: /));
    expect(JSON.stringify(minimum.player.school?.tally)).toBe(JSON.stringify(full.player.school?.tally));
  });
});

describe('autopay against paying by hand', () => {
  it('ends the same: paid in full by hand on each statement’s day, or by autopay on its due date, no interest, no fee and the same record', () => {
    const auto = life('b20-money-byhand');
    const hand = life('b20-money-byhand');
    for (const sim of [auto, hand]) run(sim, 'bank.set_payments', { everyday: 'credit' });
    for (const [y, m] of [[2026, 9], [2026, 10], [2026, 11], [2026, 12]] as const) {
      auto.advanceTo(at(y, m, 20, 10));
      hand.advanceTo(at(y, m, 20, 10));
      run(hand, 'finance.pay_card', { amount: 'full' });
    }
    for (const sim of [auto, hand]) sim.advanceTo(at(2027, 1, 16));
    // Autopay asked nothing of the twin who paid by hand: every payment hers was by hand, and every one of the other's
    // was autopay's, on a due date at noon.
    const paidOf = (sim: Simulation) => posted(sim, card(sim), /^Paid /);
    expect(paidOf(hand).map((p) => p.at)).toEqual([at(2026, 9, 20, 10), at(2026, 10, 20, 10), at(2026, 11, 20, 10), at(2026, 12, 20, 10)]);
    expect(paidOf(auto).map((p) => p.at)).toEqual([at(2026, 10, 15), at(2026, 11, 15), at(2026, 12, 15), at(2027, 1, 15)]);
    for (const sim of [auto, hand]) {
      expect(posted(sim, card(sim), /^Interest$|fee/i)).toEqual([]);
      expect(sim.player.credit!.late).toEqual([]);
    }
    expect(hand.player.credit!.score).toBe(auto.player.credit!.score);
  });
});

describe('a savings rate paying interest', () => {
  it('pays $50,000 moved into 3.00% APY savings on 1 September its twenty-nine midnights at the month’s end, worked by hand, and the card and the School don’t see it', () => {
    const moved = life('b20-money-save');
    const kept = life('b20-money-save');
    for (const sim of [moved, kept]) sim.advanceTo(at(2026, 9, 1));
    run(moved, 'bank.transfer', { fromId: own(moved, 'checking').id, toId: own(moved, 'savings').id, amount: 50_000_00 });
    for (const sim of [moved, kept]) sim.advanceTo(at(2026, 10, 1));
    const interest = (sim: Simulation) => posted(sim, own(sim, 'savings'), /^Interest: 360 Performance Savings$/);
    // August's, before the move, the same; September's, paid at 11 PM on the 30th, more by the midnights of the 2nd to
    // the 30th, each a day of $50,000 at the rate that earns 3.00% APY credited monthly, 12 × (1.03^(1/12) − 1) =
    // 2.95952% a year: 29 × 5,000,000¢ × 0.0295952 ÷ 365 = 11,757.0¢. What's paid is the whole cents built up, the
    // fraction carried, so the gap is that sum rounded either way. Until brief 21 (2026-10-22) the APY ran as a nominal
    // 3.00%: 11,917.8¢, and a year of it 3.0416%.
    expect(interest(moved).map((i) => i.at)).toEqual([at(2026, 8, 31, 23), at(2026, 9, 30, 23)]);
    expect(interest(moved)[0]).toEqual(interest(kept)[0]);
    const gap = interest(moved)[1]!.amount - interest(kept)[1]!.amount;
    expect(gap === 11_756 || gap === 11_757 || gap === 11_758, String(gap)).toBe(true);
    // Checking earns nothing at Capital One, so what left it cost nothing there.
    expect(posted(moved, own(moved, 'checking'), /^Interest/)).toEqual([]);
    // The card and the School don't read where the money is.
    expect(moved.player.credit!.score).toBe(kept.player.credit!.score);
    expect(card(moved).creditLimit).toBe(card(kept).creditLimit);
    expect(JSON.stringify(moved.player.school?.tally)).toBe(JSON.stringify(kept.player.school?.tally));
  });
});

describe('which bank holds the money', () => {
  it('changes nothing at the School: the same life at Chase and at Capital One ends the fall term with the same record, craft and body', () => {
    const chase = life('b20-money-bank', 'us-chase');
    const capital = life('b20-money-bank', 'us-capital-one');
    for (const sim of [chase, capital]) sim.advanceTo(at(2026, 12, 20));
    // The banks do differ: different accounts, different numbers, a different card at a different rate.
    expect(own(chase, 'checking').bankId).toBe('us-chase');
    expect(own(capital, 'checking').bankId).toBe('us-capital-one');
    expect(card(chase).apr).not.toBe(card(capital).apr);
    // And the School can't tell.
    expect(JSON.stringify(capital.player.school)).toBe(JSON.stringify(chase.player.school));
    expect(JSON.stringify(capital.player.craft)).toBe(JSON.stringify(chase.player.craft));
    expect(capital.player.wellbeing).toEqual(chase.player.wellbeing);
  });
});
