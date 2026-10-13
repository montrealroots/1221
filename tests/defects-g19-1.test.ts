/**
 * Group g19, part 1 (2026-10-12): the card's payment hold (`PENDING.paymentHoldDays`, `payCard` in
 * `systems/credit.ts`). Until 2026-10-12 it compared the card's bank with the primary account's, not the account
 * autopay paid from, so autopay from a Chase checking with the primary elsewhere was held fifteen days, and autopay
 * from another bank with the primary at Chase wasn't held at all. PLAYER JOURNEY: the New York student with a Chase
 * card who opens a second current account at Capital One. FIXTURES set balances and card spending by hand, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { PENDING } from '@/engine/content/pending';
import { DUE_KIND, cardsOf, stateOf } from '@/engine/systems/credit';

const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase' });
const primary = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
/** FIXTURE: an account's balance set by hand. */
const setTo = (sim: Simulation, id: string, to: number) => {
  const move = to - sim.universe.accounts[id]!.balance;
  if (move) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: id, amount: move }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -move }] });
};
/** FIXTURE: spent on a card. */
const owe = (sim: Simulation, id: string, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: id, amount: -amount }, { accountId: sim.nominalAccount('expense', 'Test').id, amount }] });
const dueOf = (sim: Simulation, id: string) => sim.universe.scheduled.find((i) => i.kind === DUE_KIND && i.status === 'pending' && i.payload.accountId === id);
/** Played to the card's next statement, when its due date goes on the calendar. */
const toStatement = (sim: Simulation, id: string) => { for (let d = 0; d < 40 && !dueOf(sim, id); d += 1) sim.advanceTo(sim.now + MS_DAY); };

/** A Chase card owing $400 at its statement, autopay in full, and a Capital One current account beside the Chase one. */
function twoBanks(seed: string) {
  const sim = student(seed);
  const chase = primary(sim);
  const cap = sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-capital-one' } }).accountId;
  const card = cardsOf(sim, sim.player)[0]!;
  expect(card.bankId).toBe('us-chase');
  expect(chase.bankId).toBe('us-chase');
  sim.must({ kind: 'finance.set_autopay', payload: { mode: 'full', accountId: card.id } });
  expect(stateOf(sim.player, card).autopay).toBe('full');
  return { sim, chase: chase.id, cap, card };
}

describe('the card’s payment hold reads the account autopay paid from', () => {
  const days = PENDING['us-chase']!.paymentHoldDays!;

  it('holds nothing when autopay pays the Chase card from a Chase account, though the primary is at Capital One', () => {
    const { sim, chase, cap, card } = twoBanks('g19-hold-own');
    sim.must({ kind: 'card.set_autopay_from', payload: { cardId: card.id, accountId: chase } });
    sim.must({ kind: 'bank.set_primary', payload: { accountId: cap } });
    expect(sim.player.primaryAccountId).toBe(cap);
    owe(sim, card.id, 400_00);
    toStatement(sim, card.id);
    const due = dueOf(sim, card.id)!;
    expect(due).toBeDefined();
    // FIXTURE: Chase holds enough for the whole statement, Capital One nothing.
    setTo(sim, chase, 5_000_00);
    setTo(sim, cap, 0);
    const before = sim.universe.accounts[chase]!.balance;
    sim.advanceTo(due.at + 1000);
    // Autopay took it from Chase, the card's own bank, so nothing is held while it clears.
    expect(sim.universe.accounts[chase]!.balance).toBeLessThan(before);
    expect(stateOf(sim.player, card).paidSinceStatement).toBeGreaterThan(0);
    expect(stateOf(sim.player, card).paymentHolds).toBeUndefined();
  });

  it('holds the Chase days when autopay pays the Chase card from Capital One, though the primary is at Chase', () => {
    const { sim, chase, cap, card } = twoBanks('g19-hold-other');
    sim.must({ kind: 'card.set_autopay_from', payload: { cardId: card.id, accountId: cap } });
    expect(sim.player.primaryAccountId).toBe(chase);
    owe(sim, card.id, 400_00);
    toStatement(sim, card.id);
    const due = dueOf(sim, card.id)!;
    expect(due).toBeDefined();
    // FIXTURE: Capital One holds enough for the whole statement.
    setTo(sim, cap, 5_000_00);
    const asked = stateOf(sim.player, card).statementBalance - stateOf(sim.player, card).paidSinceStatement;
    expect(asked).toBeGreaterThan(0);
    sim.advanceTo(due.at + 1000);
    expect(sim.universe.accounts[cap]!.balance).toBe(5_000_00 - asked);
    expect(stateOf(sim.player, card).paymentHolds).toEqual([{ amount: asked, until: due.at + days * MS_DAY }]);
  });

  it('still reads the primary account for a payment made by hand', () => {
    const { sim, chase, cap, card } = twoBanks('g19-hold-hand');
    // Autopay pinned to Capital One; by hand, the payment comes from the primary, at Chase, and isn't held.
    sim.must({ kind: 'card.set_autopay_from', payload: { cardId: card.id, accountId: cap } });
    owe(sim, card.id, 400_00);
    setTo(sim, chase, 5_000_00);
    sim.must({ kind: 'finance.pay_card', payload: { amount: 100_00 } });
    expect(stateOf(sim.player, card).paymentHolds).toBeUndefined();
  });
});
