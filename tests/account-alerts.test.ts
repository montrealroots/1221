/**
 * Alerts on the accounts that matter (`systems/obligations.ts`, from 2026-10-10): every current account under the
 * low line, and an account short for a payment due from it. PLAYER JOURNEY: the New Haven student with a second bank,
 * the card's autopay moved to it while the school's money still goes to Chase. FIXTURES set balances by hand, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { DUE_KIND, cardsOf, stateOf } from '@/engine/systems/credit';
import { obligationsAhead, LOOKAHEAD_DAYS } from '@/engine/systems/obligations';
import { payeeAccount } from '@/engine/systems/cash';

const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const primary = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
/** FIXTURE: an account's balance set by hand. */
const setTo = (sim: Simulation, id: string, to: number) => {
  const move = to - sim.universe.accounts[id]!.balance;
  if (move) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: id, amount: move }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -move }] });
};
/** FIXTURE: spent on a card. */
const owe = (sim: Simulation, id: string, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: id, amount: -amount }, { accountId: sim.nominalAccount('expense', 'Test').id, amount }] });
/** Played to the card's next statement, when its due date goes on the calendar. */
const toStatement = (sim: Simulation, id: string) => { for (let d = 0; d < 40 && !sim.universe.scheduled.some((i) => i.kind === DUE_KIND && i.status === 'pending' && i.payload.accountId === id); d += 1) sim.advanceTo(sim.now + MS_DAY); };
const told = (sim: Simulation, title: RegExp) => sim.universe.notifications.filter((n) => title.test(n.title));

describe('PLAYER JOURNEY: autopay from one bank, school money into the other', () => {
  it('warns once that Capital One is short for the card, names the account, the payment and the remedy, and not again', () => {
    let sim = student('mv-second');
    const chase = primary(sim);
    const cap = sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-capital-one' } }).accountId;
    const card = cardsOf(sim, sim.player)[0]!;
    sim.must({ kind: 'card.set_autopay_from', payload: { cardId: card.id, accountId: cap } });
    // FIXTURE: $400 spent on the card, then played to its statement, which puts the due date on the calendar.
    owe(sim, card.id, 400_00);
    stateOf(sim.player, card).autopay = 'full';
    toStatement(sim, card.id);
    const due = sim.universe.scheduled.find((i) => i.kind === DUE_KIND && i.status === 'pending' && i.payload.accountId === card.id)!;
    expect(due).toBeDefined();
    setTo(sim, chase.id, 5_000_00);
    // The school's money still goes to Chase: the alert is about Capital One, which holds nothing.
    expect(payeeAccount(sim, sim.player).id).toBe(chase.id);
    sim = reload(sim);
    expect(obligationsAhead(sim, sim.player, due.at + 1)).toEqual(expect.arrayContaining([expect.objectContaining({ accountId: cap, amount: 400_00 })]));
    sim.advanceTo(due.at - (LOOKAHEAD_DAYS - 1) * MS_DAY);
    const short = told(sim, /^Short For A Payment: 360 Checking$/);
    expect(short).toHaveLength(1);
    expect(short[0]!.body).toMatch(/autopay, \$400\.00, comes from 360 Checking at Capital One on .* has \$0\.00 available\. Move money into it/);
    expect(told(sim, /^Short For A Payment: Chase/)).toHaveLength(0);
    sim = reload(sim);
    sim.advanceTo(due.at - 60_000);
    expect(told(sim, /^Short For A Payment/)).toHaveLength(1);
  });

  it('says nothing when the account can cover it, and nothing when turned off', () => {
    const sim = student('mv-move');
    const cap = sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-capital-one' } }).accountId;
    const card = cardsOf(sim, sim.player)[0]!;
    sim.must({ kind: 'card.set_autopay_from', payload: { cardId: card.id, accountId: cap } });
    owe(sim, card.id, 400_00);
    stateOf(sim.player, card).autopay = 'full';
    toStatement(sim, card.id);
    setTo(sim, cap, 1_000_00);
    const due = sim.universe.scheduled.find((i) => i.kind === DUE_KIND && i.status === 'pending' && i.payload.accountId === card.id)!;
    sim.advanceTo(due.at - MS_DAY);
    expect(told(sim, /^Short For A Payment/)).toHaveLength(0);
    const off = student('mv-exploit');
    off.must({ kind: 'bank.set_alerts', payload: { upcoming: false } });
    const offCap = off.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-capital-one' } }).accountId;
    const offCard = cardsOf(off, off.player)[0]!;
    off.must({ kind: 'card.set_autopay_from', payload: { cardId: offCard.id, accountId: offCap } });
    owe(off, offCard.id, 400_00);
    stateOf(off.player, offCard).autopay = 'full';
    toStatement(off, offCard.id);
    const offDue = off.universe.scheduled.find((i) => i.kind === DUE_KIND && i.status === 'pending' && i.payload.accountId === offCard.id)!;
    off.advanceTo(offDue.at - MS_DAY);
    expect(told(off, /^Short For A Payment/)).toHaveLength(0);
  });
});

describe('the low-balance line', () => {
  it('watches every current account, each told once until it’s back above the line', () => {
    const sim = student('mv-legacy');
    const chase = primary(sim);
    const cap = sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-capital-one' } }).accountId;
    setTo(sim, chase.id, 50_000_00);
    sim.must({ kind: 'bank.set_alerts', payload: { lowBalance: 100_00 } });
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(told(sim, /^Low Balance: 360 Checking$/)).toHaveLength(1);
    expect(told(sim, /^Low Balance: Chase/)).toHaveLength(0);
    sim.advanceTo(sim.now + 2 * MS_DAY);
    expect(told(sim, /^Low Balance: 360 Checking$/)).toHaveLength(1);
    // Read, as a player does; an unread notice the same again is merged into it, not repeated.
    for (const n of sim.universe.notifications) n.read = true;
    setTo(sim, cap, 500_00);
    sim.advanceTo(sim.now + MS_DAY);
    setTo(sim, cap, 0);
    sim.advanceTo(sim.now + MS_DAY);
    expect(told(sim, /^Low Balance: 360 Checking$/)).toHaveLength(2);
  });
});
