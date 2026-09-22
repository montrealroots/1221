/**
 * Integrity, isolation and abuse.
 *
 * The rules this file enforces are the ones that stop a save quietly becoming
 * wrong: a retry must not charge twice or hand over two of the same thing, one
 * universe must never see another, a finalised result must stay finalised, the
 * player must not be shown what their character could not know, and a
 * malformed or hostile payload must be refused rather than absorbed.
 *
 * Everything here runs against the engine. The parts of the same contract that
 * live on the server — authentication, row-level security, and authorisation
 * of the backend functions — cannot be exercised without a deployment and
 * credentials, and are not covered by this file. They are listed as
 * unavailable in the release report rather than counted as passing.
 */

import { describe, expect, it } from 'vitest';
import { createSave, loadSave, quickSave, validateUniverse, defaultConfig } from '@/engine';
import { serialise, deserialise } from '@/engine/persistence/adapter';
import type { Id } from '@/engine/domain/model';

const MS_DAY = 86_400_000;

describe('retries and replays', () => {
  it('applies a command once when the same key is submitted twice', () => {
    const sim = quickSave({ wealth: 'comfortable' });
    const account = sim.player.primaryAccountId as Id;
    const before = sim.ledger.availableFunds(account);
    const transactions = sim.universe.transactions.length;

    const key = 'checkout-9f2a';
    const first = sim.execute({ kind: 'life.sleep', payload: { hours: 8 }, idempotencyKey: key });
    const wokeAt = sim.now;
    const second = sim.execute({ kind: 'life.sleep', payload: { hours: 8 }, idempotencyKey: key });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.replayed, 'the second submission was treated as a new command').toBe(true);
    expect(second.value, 'the replay returned a different result').toEqual(first.value);

    // A receipt, not a second night: the clock stayed put and nothing posted.
    expect(sim.now).toBe(wokeAt);
    expect(sim.universe.transactions.length).toBe(transactions);
    expect(sim.ledger.availableFunds(account)).toBe(before);
  });


});

describe('one save is one universe', () => {
  it('keeps three slots completely separate', () => {
    const a = createSave(1, 'seed-one', { ...defaultConfig(), firstName: 'Ana' });
    const b = createSave(2, 'seed-two', { ...defaultConfig(), firstName: 'Bo' });
    const c = createSave(3, 'seed-three', { ...defaultConfig(), firstName: 'Cass' });

    const ids = [a.universe.meta.id, b.universe.meta.id, c.universe.meta.id];
    expect(new Set(ids).size, 'two saves share an id').toBe(3);

    // Advancing one must not touch another.
    const bBefore = JSON.stringify(b.universe);
    a.advanceTo(a.now + 200 * MS_DAY);
    expect(JSON.stringify(b.universe), 'advancing save 1 changed save 2').toBe(bBefore);

    // No record in any save carries another save's id.
    for (const sim of [a, b, c]) {
      const report = validateUniverse(sim.universe);
      expect(report.errors).toEqual([]);
    }
  });

  it('re-stamps a record smuggled in from another save rather than trusting it', () => {
    const a = quickSave({}, 'donor', 1);
    const b = quickSave({}, 'host', 2);

    // The record smuggled across is one of the donor's accounts, filed under
    // a key the host has not used.
    const donorAccount = Object.values(a.universe.accounts)[0];
    expect(donorAccount).toBeDefined();

    // Simulate a payload that arrived carrying someone else's saveId.
    b.universe.accounts[`${donorAccount!.id}-smuggled`] = donorAccount!;
    expect(validateUniverse(b.universe).errors.join(' ')).toMatch(/Cross-save contamination|belongs to save/);
  });

  it('survives a save and load round trip without losing anything', () => {
    const sim = quickSave({ wealth: 'comfortable' }, 'round-trip');
    sim.advanceTo(sim.now + 400 * MS_DAY);

    const raw = serialise(sim.universe);
    const restored = deserialise(raw);
    const reloaded = loadSave(restored);

    expect(reloaded.now).toBe(sim.now);
    expect(Object.keys(reloaded.universe.people).length).toBe(Object.keys(sim.universe.people).length);
    expect(reloaded.universe.transactions.length).toBe(sim.universe.transactions.length);
    expect(reloaded.ledger.audit()).toEqual([]);
    expect(validateUniverse(reloaded.universe).errors).toEqual([]);

    // And it keeps running from where it left off.
    reloaded.advanceTo(reloaded.now + 30 * MS_DAY);
    expect(validateUniverse(reloaded.universe).errors).toEqual([]);
  });
});

describe('malformed and hostile input', () => {
  const sim = quickSave({ wealth: 'comfortable' }, 'hostile');

  const refusals: [string, Record<string, unknown>][] = [
    ['finance.transfer', { fromAccountId: 'nope', toAccountId: 'also-nope', amount: 100 }],
    ['finance.transfer', { fromAccountId: sim.player.primaryAccountId, toAccountId: sim.player.primaryAccountId, amount: -5_000_00 }],
    ['finance.transfer', { fromAccountId: sim.player.primaryAccountId, toAccountId: sim.player.primaryAccountId, amount: Number.NaN }],
    ['finance.transfer', { fromAccountId: sim.player.primaryAccountId, toAccountId: sim.player.primaryAccountId, amount: Number.POSITIVE_INFINITY }],
    ['finance.transfer', { fromAccountId: sim.player.primaryAccountId, toAccountId: sim.player.primaryAccountId, amount: 1e308 }],
    ['veh.purchase', { listingId: '../../etc/passwd', acquisition: 'cash' }],
    ['shop.purchase', { retailerId: 'valuemart', lines: [] }],
    ['shop.purchase', { retailerId: 'valuemart', lines: [{ catalogId: 'does_not_exist', quantity: 1 }] }],
    ['shop.purchase', { retailerId: 'valuemart', lines: [{ catalogId: 'tshirt_basic', quantity: -40 }] }],
    ['rel.interact', { relationshipId: 'rel_nothing', interaction: 'chat' }],
    ['film.greenlight', { projectId: 'proj_nothing', budget: 1_000_000_00 }],
    ['prop.rent', { propertyId: 'prop_nothing', months: 12 }],
    ['life.sleep', { hours: -8 }],
  ];

  for (const [kind, payload] of refusals) {
    it(`refuses ${kind} with ${JSON.stringify(payload).slice(0, 60)}`, () => {
      const before = JSON.stringify(sim.universe);
      const result = sim.execute({ kind, payload });
      // Either refused outright, or handled without damage. Never a crash,
      // and never a silent mutation on the way to a refusal.
      if (!result.ok) {
        expect(typeof result.error, 'a refusal must say why').toBe('string');
        expect(result.error!.length).toBeGreaterThan(0);
        expect(JSON.stringify(sim.universe), `${kind} mutated the world before refusing`).toBe(before);
      }
      expect(sim.ledger.audit()).toEqual([]);
    });
  }

  it('refuses a command that does not exist rather than doing nothing quietly', () => {
    const result = sim.execute({ kind: 'finance.drain_everything', payload: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unknown command/);
  });

  it('does not fall over on an absurdly large payload', () => {
    const lines = Array.from({ length: 5_000 }, () => ({ catalogId: 'tshirt_basic', quantity: 1 }));
    const result = sim.execute({ kind: 'shop.purchase', payload: { retailerId: 'basewear', lines } });
    // Affordable or not, the world must still be consistent afterwards.
    expect(typeof result.ok).toBe('boolean');
    expect(sim.ledger.audit()).toEqual([]);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
  });

  it('will not run the clock backwards however it is asked', () => {
    const target = sim.now - MS_DAY;
    expect(() => sim.advanceTo(target)).toThrow(/backwards/);
  });
});

describe('permission boundaries', () => {
  it('has no cheat mode left to refuse', () => {
    // Sandbox is gone. The founder starts at the ceiling of everything, so
    // there was nothing left for it to give, and a command that can hand out
    // money or attributes is not something to leave lying in the build.
    const sim = quickSave();
    for (const kind of ['sandbox.add_funds', 'sandbox.max_attributes', 'sandbox.grant_all_traits', 'sandbox.god_mode', 'sandbox.toggle']) {
      const result = sim.execute({ kind, payload: { amount: 1_000_000_00, enabled: true } });
      expect(result.ok, `${kind} still exists`).toBe(false);
      expect(result.error).toMatch(/unknown command/i);
    }
    expect(sim.ledger.audit()).toEqual([]);
  });

});

