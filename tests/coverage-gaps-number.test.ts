/**
 * A new account number (`bank.new_number`) and what it protects against (from 2026-10-10): a debit card used by
 * somebody else at a bank that renumbers a compromised account leaves the account's number exposed; a debit tried on
 * it goes through while it's the account's number, disputable at nothing under Regulation E; moved to a new number,
 * the old one's attempts are declined, while a card's own fraud stays its own risk. The New Haven student banking at
 * Bank of America (a choice at creation). The day's draws are given (TEST SETUP: at 21% a year an attempt comes about
 * once in four and a half years); their rates aren't changed.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { EXPOSURE, attemptOnNumber, cardAccount, somebodyElse } from '@/engine/systems/security';

const student = (seed: string, bankId: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const current = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
/** TEST SETUP: somebody uses the card, as the day's draw would have it, not stopped. */
const used = (sim: Simulation, which: 'debit' | 'credit', amount = 80_00) => somebodyElse(sim, sim.player, { which, account: cardAccount(sim, sim.player, which)!, amount, stopped: false });

describe('a debit card used by somebody else', () => {
  it('exposes the account’s number at a bank that renumbers, and not at one that doesn’t', () => {
    const bofa = student('num-bofa', 'us-bank-of-america');
    used(bofa, 'debit');
    expect(current(bofa).exposed).toMatchObject({ number: current(bofa).number });
    const chase = student('num-chase', 'us-chase');
    used(chase, 'debit');
    expect(current(chase).exposed).toBeUndefined();
  });
});

describe('a debit tried on an exposed number', () => {
  it('goes through while it’s the account’s number, and disputed, the law leaves nothing and stops no card', () => {
    let sim = student('num-taken', 'us-bank-of-america');
    used(sim, 'debit');
    sim = reload(sim);
    const before = current(sim).balance;
    attemptOnNumber(sim, sim.player, { size: 0.5 });
    expect(current(sim).balance).toBeLessThan(before);
    const index = sim.player.fraud!.length - 1;
    expect(sim.player.fraud![index]).toMatchObject({ via: 'number', which: 'debit' });
    const stopped = current(sim).plastic?.stopped;
    const r = sim.must<{ carried: number }>({ kind: 'card.dispute', payload: { index } });
    expect(r.carried).toBe(0);
    expect(current(sim).plastic?.stopped).toBe(stopped);
    expect(sim.execute({ kind: 'card.dispute', payload: { index } }).error).toBe('You’ve reported it already.');
  });

  it('is declined on the old number once the account has moved, while a card’s own fraud goes on', () => {
    let sim = student('num-moved', 'us-bank-of-america');
    used(sim, 'debit');
    const old = current(sim).number;
    sim.must({ kind: 'bank.new_number', payload: {} });
    expect(current(sim).number).not.toBe(old);
    sim = reload(sim);
    const before = current(sim).balance;
    const taken = (sim.player.fraud ?? []).length;
    attemptOnNumber(sim, sim.player, { size: 0.5 });
    expect(current(sim).balance).toBe(before);
    expect((sim.player.fraud ?? []).length).toBe(taken);
    expect(sim.universe.notifications.some((n) => n.title === 'A Debit On Your Old Number Declined')).toBe(true);
    // The credit card's own risk is untouched by the debit account's number.
    used(sim, 'credit', 50_00);
    expect(sim.player.fraud!.at(-1)).toMatchObject({ which: 'credit', amount: 50_00 });
  });

  it('stops being tried after its year, and the account’s own payments go on', () => {
    const sim = student('num-expiry', 'us-bank-of-america');
    used(sim, 'debit');
    sim.must({ kind: 'bank.new_number', payload: {} });
    sim.advanceTo(current(sim).exposed!.until + MS_DAY);
    attemptOnNumber(sim, sim.player, { size: 0.5 });
    expect(current(sim).exposed).toBeUndefined();
    expect(EXPOSURE.days).toBe(365);
    // The debit card replaced with the number has arrived, and works.
    expect(cardAccount(sim, sim.player, 'debit')!.plastic?.stopped).toBeUndefined();
  });
});
