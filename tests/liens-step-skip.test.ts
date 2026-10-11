/**
 * The new lifecycles don't depend on how time is crossed, and don't run twice (remaining-gaps pass, 2026-10-11). An
 * Indiana balance is followed across 1 January 2027, where its interest rate changes by year, through its tax warrant
 * and lien, paid, and released: once a day at a time with the save opened again every thirty days, once in two jumps.
 * Then each step the calendar could repeat is repeated, and each command sent twice.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { loadSave } from '@/engine';
import { STATE_LIEN_KIND, fileState } from '@/engine/systems/statetax';
import type { TaxReturn } from '@/engine/systems/taxreturn';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number) => instantFromZoned({ year: y, month: m, day: d, hour: 12 }, NY);
const T1 = at(2027, 3, 1);
const T2 = at(2027, 5, 1);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

function owingIndiana(): Simulation {
  const sim = quickSave({ startLocationId: 'us-in-indianapolis', homeRegionId: 'us-in-indianapolis', livesWhereBorn: true, wealth: 'wealthy' }, 'in-step');
  for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] });
  // FIXTURE: a 2025 return due a day ago, Indiana's $3,000 owed with nothing in the bank.
  const r = { year: 2025, due: sim.now - MS_DAY, filedAt: sim.now, figures: { income: 50_000_00, balance: 3_000_00 } } as unknown as TaxReturn;
  sim.player.returns = { ...(sim.player.returns ?? {}), '2025': r };
  fileState(sim, sim.player, r, 'us-in', 3_000_00);
  return sim;
}
const payOff = (sim: Simulation) => {
  sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount: 20_000_00 }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -20_000_00 }] });
  sim.must({ kind: 'tax.pay_state', payload: { state: 'us-in', year: 2025 } });
};
const view = (sim: Simulation) => {
  const sd = sim.player.returns!['2025']!.stateDue!['us-in']!;
  return {
    sd: JSON.stringify(sd),
    notes: sim.universe.notifications.filter((n) => /Indiana|Warrant|Lien/.test(n.title + n.body)).map((n) => `${n.at}|${n.title}`),
    tax: sim.universe.transactions.filter((t) => t.category === 'tax').map((t) => `${t.at}|${t.memo}|${t.postings.map((p) => p.amount).join(',')}`),
  };
};

describe('an Indiana lien’s lifecycle', () => {
  it('is the same stepped a day at a time and opened again every thirty days as crossed in two jumps', () => {
    let a = owingIndiana();
    let days = 0;
    while (a.now < T1) { a.advanceTo(Math.min(T1, a.now + MS_DAY)); if (++days % 30 === 0) a = reload(a); }
    payOff(a);
    while (a.now < T2) { a.advanceTo(Math.min(T2, a.now + MS_DAY)); if (++days % 30 === 0) a = reload(a); }

    const b = owingIndiana();
    b.advanceTo(T1);
    payOff(b);
    b.advanceTo(T2);

    const va = view(a);
    const vb = view(b);
    // What the comparison stands on: a warrant filed, paid, and released, across the year's change of rate.
    const l = a.player.returns!['2025']!.stateDue!['us-in']!.lien!;
    expect(l.status).toBe('released');
    expect(l.filedAt).toBeLessThan(T1);
    // Notices, the warrant, its filing and its release; the payment and its fee.
    expect(va.notes.length).toBeGreaterThanOrEqual(5);
    expect(va.tax.length).toBeGreaterThanOrEqual(1);
    expect(va.sd).toBe(vb.sd);
    expect(va.notes).toEqual(vb.notes);
    expect(va.tax).toEqual(vb.tax);
    expect(a.ledger.audit()).toEqual([]);
  }, 300_000);

  it('runs each step once: a repeated release, a repeated decision, a payment sent twice', () => {
    const sim = owingIndiana();
    sim.advanceTo(T1);
    const sd = () => sim.player.returns!['2025']!.stateDue!['us-in']!;
    expect(sd().lien!.status).toBe('filed');
    payOff(sim);
    // Paid: a second payment is refused, and the release is on the calendar once.
    expect(sim.execute({ kind: 'tax.pay_state', payload: { state: 'us-in', year: 2025 } }).ok).toBe(false);
    const releases = () => sim.universe.scheduled.filter((i) => i.kind === STATE_LIEN_KIND && i.payload.action === 'release');
    expect(releases().filter((i) => i.status === 'pending')).toHaveLength(1);
    // The calendar's release, and a copy of it as a duplicate would be.
    const due = releases()[0]!.at;
    for (const action of ['release', 'release', 'decide', 'file']) sim.schedule({ at: due, kind: STATE_LIEN_KIND, label: 'Duplicate', category: 'system', payload: { personId: sim.player.id, year: 2025, state: 'us-in', action } });
    const before = view(sim);
    sim.advanceTo(due + 2 * MS_DAY);
    expect(sd().lien!.status).toBe('released');
    expect(sd().lien!.history.filter((h) => /Released/.test(h.what))).toHaveLength(1);
    const after = view(sim);
    expect(after.tax).toEqual(before.tax);
    expect(after.notes.length - before.notes.length).toBe(1);
    expect(sd().owed ?? 0).toBe(0);
    expect(sim.ledger.audit()).toEqual([]);
  }, 300_000);
});
