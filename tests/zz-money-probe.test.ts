import { describe, it, expect } from 'vitest';
import { quickSave } from "@/engine";
import { MS_DAY } from "@/engine/core/time";

describe('money probe', () => {
  it('reports what moves over ten years', () => {
    const sim = quickSave();
    const u = sim.universe;
    const before = u.transactions.length;
    const snapshot = Object.fromEntries(Object.values(u.accounts).map((a) => [a.name, a.balance]));
    sim.advanceBy(365 * 10 * MS_DAY);
    const after = u.transactions.length;
    const snapshot2 = Object.fromEntries(Object.values(u.accounts).map((a) => [a.name, a.balance]));
    // eslint-disable-next-line no-console
    console.log('TXNS BEFORE', before, 'AFTER', after);
    console.log('BEFORE', JSON.stringify(snapshot, null, 1));
    console.log('AFTER ', JSON.stringify(snapshot2, null, 1));
    console.log('SCHEDULED KINDS', JSON.stringify([...new Set(u.scheduled.map((s) => s.kind))]));
    console.log('AUDIT', JSON.stringify(sim.ledger.audit()));
    console.log('ACCOUNT OWNERS', JSON.stringify(Object.values(u.accounts).map((a) => ({ n: a.name, k: a.kind, o: a.ownerId, nominal: a.nominal }))));
    console.log('PEOPLE', Object.keys(u.people).length, 'WITH ACCOUNTS', new Set(Object.values(u.accounts).map((a) => a.ownerId)).size);
    expect(true).toBe(true);
  });
});
