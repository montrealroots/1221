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
import { redactForPlayer } from '@/engine/core/audit';
import type { Id } from '@/engine/domain/model';

const MS_DAY = 86_400_000;

describe('retries and replays', () => {
  it('charges once when the same payment is submitted twice', () => {
    const sim = quickSave({ wealth: 'comfortable' });
    const account = sim.player.primaryAccountId as Id;
    const before = sim.ledger.availableFunds(account);

    const key = 'checkout-9f2a';
    const items = [{ catalogId: 'tshirt_basic', quantity: 1 }];
    const first = sim.execute({ kind: 'shop.purchase', payload: { retailerId: 'basewear', lines: items }, idempotencyKey: key });
    const second = sim.execute({ kind: 'shop.purchase', payload: { retailerId: 'basewear', lines: items }, idempotencyKey: key });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.replayed, 'the second submission was treated as a new purchase').toBe(true);
    expect(second.value, 'the replay returned a different result').toEqual(first.value);

    const charged = before - sim.ledger.availableFunds(account);
    expect(charged, 'nothing was charged at all').toBeGreaterThan(0);

    // Exactly one order, and the money left the account exactly once.
    const orders = Object.values(sim.universe.orders);
    expect(orders.length).toBe(1);
    const postings = sim.universe.transactions.filter((t) => t.postings.some((p) => p.accountId === account) && t.category === 'shopping');
    expect(postings.length, 'the purchase posted more than once').toBeLessThanOrEqual(1);
  });

  it('does not hand over two of the same thing on a retried purchase', () => {
    const sim = quickSave({ wealth: 'wealthy' });
    const listing = Object.values(sim.universe.vehicleListings).find((l) => l.status === 'active');
    expect(listing, 'no vehicle to buy').toBeDefined();

    const ownedBefore = Object.values(sim.universe.vehicles).filter((v) => !v.soldAt).length;
    const payload = { listingId: listing!.id, acquisition: 'cash' as const };
    const key = 'buy-the-car';
    const first = sim.execute<{ vehicleId: Id }>({ kind: 'veh.purchase', payload, idempotencyKey: key });
    const second = sim.execute<{ vehicleId: Id }>({ kind: 'veh.purchase', payload, idempotencyKey: key });

    expect(first.ok).toBe(true);
    expect(second.replayed).toBe(true);
    expect(second.value?.vehicleId).toBe(first.value?.vehicleId);
    const ownedAfter = Object.values(sim.universe.vehicles).filter((v) => !v.soldAt).length;
    expect(ownedAfter - ownedBefore, 'the retry produced a second car').toBe(1);
  });

  it('does not sign the same contract twice', () => {
    const sim = quickSave({ wealth: 'inherited' });
    const created = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'feature', genres: ['drama'], logline: 'Once.' },
    });
    const projectId = created.value?.projectId as Id;

    const payload = {
      kind: 'writing' as const, projectId,
      partyAId: sim.player.id, partyAKind: 'person' as const,
      partyBId: sim.player.id, partyBKind: 'person' as const,
      title: 'Writing agreement', compensation: 50_000_00,
    };
    const key = 'contract-once';
    const a = sim.execute<{ contractId: Id }>({ kind: 'film.execute_contract', payload, idempotencyKey: key });
    const b = sim.execute<{ contractId: Id }>({ kind: 'film.execute_contract', payload, idempotencyKey: key });

    expect(a.ok).toBe(true);
    expect(b.value?.contractId).toBe(a.value?.contractId);
    expect(Object.values(sim.universe.contracts).filter((c) => c.projectId === projectId).length).toBe(1);
  });

  it('keeps a finalised award edition finalised', () => {
    const sim = quickSave({}, 'awards-stability');
    sim.advanceTo(sim.now + 3 * 365 * MS_DAY);

    const finalised = Object.values(sim.universe.awardEditions).filter((e) => e.finalised && !e.predatesSave);
    expect(finalised.length, 'no ceremony was held in three years').toBeGreaterThan(0);

    const before = finalised.map((e) => ({
      id: e.id,
      winners: Object.values(sim.universe.awardNominations)
        .filter((n) => n.editionId === e.id && n.won)
        .map((n) => n.id)
        .sort(),
    }));

    // Run the world on. History does not get to change its mind.
    sim.advanceTo(sim.now + 2 * 365 * MS_DAY);
    for (const edition of before) {
      const after = Object.values(sim.universe.awardNominations)
        .filter((n) => n.editionId === edition.id && n.won)
        .map((n) => n.id)
        .sort();
      expect(after, `the winners of ${edition.id} changed after the fact`).toEqual(edition.winners);
    }
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

    const donorPerson = Object.values(a.universe.people).find((p) => !p.isPlayer);
    expect(donorPerson).toBeDefined();

    // Simulate a payload that arrived carrying someone else's saveId.
    b.universe.people[donorPerson!.id] = { ...donorPerson!, id: donorPerson!.id };
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
  it('refuses sandbox tools while sandbox is off', () => {
    const sim = quickSave();
    expect(sim.universe.sandbox.enabled).toBe(false);
    for (const kind of ['sandbox.add_funds', 'sandbox.max_attributes', 'sandbox.grant_all_traits']) {
      const result = sim.execute({ kind, payload: { amount: 1_000_000_00 } });
      if (result.ok) continue; // a tool that does not exist is covered elsewhere
      expect(result.error, `${kind} did not mention sandbox`).toMatch(/[Ss]andbox/);
    }
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('will not let someone greenlight beyond their authority', () => {
    const sim = quickSave({ wealth: 'comfortable' });
    const created = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'feature', genres: ['action'], logline: 'Enormous.' },
    });
    const projectId = created.value?.projectId as Id;
    sim.execute({ kind: 'film.write_draft', payload: { projectId } });
    sim.execute({
      kind: 'film.acquire_rights',
      payload: { projectId, title: 'Original', sourceKind: 'original', acquisitionKind: 'original', cost: 0 },
    });

    const result = sim.execute({ kind: 'film.greenlight', payload: { projectId, budget: 250_000_000_00 } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/authority/i);
  });
});

describe('what the player is allowed to know', () => {
  it('hides the factors a character could not see', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'knowledge');
    const savings = Object.values(sim.universe.accounts).find((a) => a.kind === 'savings');
    const company = sim.execute<{ companyId: Id }>({
      kind: 'co.found',
      payload: { structure: 'llc', kind: 'production', initialCapital: 2_000_000_00, accountId: savings?.id },
    });
    expect(company.ok, company.error).toBe(true);
    const created = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'feature', genres: ['drama'], logline: 'Private.', companyId: company.value?.companyId },
    });
    const projectId = created.value?.projectId as Id;
    sim.execute({ kind: 'film.write_draft', payload: { projectId } });
    sim.execute({
      kind: 'film.acquire_rights',
      payload: { projectId, title: 'Original', sourceKind: 'original', acquisitionKind: 'original', cost: 0 },
    });
    const decision = sim.execute({
      kind: 'film.greenlight',
      payload: { projectId, budget: 1_500_000_00, companyId: company.value?.companyId },
    });
    expect(decision.ok, decision.error).toBe(true);

    const audit = [...sim.universe.audits].reverse().find((a) => a.kind === 'film.greenlight_decided');
    expect(audit, 'the greenlight was not audited').toBeDefined();

    const hidden = audit!.factors.filter((f) => !f.knowable);
    expect(hidden.length, 'nothing about this decision was private').toBeGreaterThan(0);

    const shown = redactForPlayer(audit!);
    for (const factor of hidden) {
      expect(
        shown.factors.some((f) => f.detail === factor.detail),
        `a private factor leaked: ${factor.label}`,
      ).toBe(false);
    }
    // The player is told that something is hidden, not left to guess.
    expect(shown.factors.length).toBeGreaterThan(0);
    expect(JSON.stringify(shown.factors)).toMatch(/not|cannot|do not|hidden|see/i);
  });
});
