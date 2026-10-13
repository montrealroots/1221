/**
 * What net worth says of the money held apart (group R5, from 2026-10-12; `systems/finance.ts`, `ui/looks/money.tsx`).
 *
 * Earlier on 2026-10-12 net worth stopped calling every escrow balance "held as a deposit", the rent deposit having
 * gone with the home on 2026-10-09. What replaced it was one fixed phrase for all of it, whatever held it: "held apart,
 * on its way between your banks or as SNAP on an EBT card". A Torontonian moving C$300 to CIBC was told it might be a
 * US benefit, and a New Yorker on SNAP with nothing on its way was told it might be between banks. The engine knew
 * which: Money In Transit is an escrow account of category `in_transit` (`systems/bankmoves.ts`), the EBT card one of
 * category `ebt` (`systems/assistance.ts`). Net worth now carries `held` by what holds it (`Worth.heldAs`), and the
 * sentence names each part from that.
 *
 * PLAYER JOURNEYS play through the commands the screens give. Each changes what holds the money and reads the
 * sentence again: the falsifiability test, run on the words.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { ebtBalance } from '@/engine/systems/assistance';
import { netWorth } from '@/engine/systems/finance';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';

const lifeIn = (cityId: string, bankId: string, seed: string) => quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
const primary = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const summary = (sim: Simulation) => (resolveLook(sim, at('networth', sim.player.id)) as Looked).summary;
const say = (sim: Simulation, cents: number) => formatMoney(cents, saveCurrency(sim.universe));

describe('PLAYER JOURNEY: a Toronto life at TD, moving money to CIBC', () => {
  it('says the money is on its way between the banks, and says nothing of SNAP or an EBT card', () => {
    const sim = lifeIn('ca-on-toronto', 'ca-td', 'r5-toronto');
    const td = primary(sim).id;
    const cibc = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'ca-cibc' }).accountId;
    expect(summary(sim)).not.toMatch(/on its way|held/);
    const sent = run<{ arrivesAt: number }>(sim, 'bank.transfer', { fromId: td, toId: cibc, amount: 300_00 });
    const worth = netWorth(sim, sim.player.id);
    expect(worth.heldAs).toEqual({ in_transit: 300_00 });
    const words = summary(sim);
    expect(words).toContain(`${say(sim, 300_00)} on its way between your banks`);
    expect(words).not.toMatch(/SNAP|EBT|held apart/);
    // Arrived, it’s in the bank: Money In Transit stays open at nothing, and the sentence says nothing of it.
    sim.advanceTo(sent.arrivesAt + MS_DAY);
    expect(netWorth(sim, sim.player.id).heldAs).toEqual({ in_transit: 0 });
    expect(summary(sim)).not.toMatch(/on its way|held/);
  }, 120_000);
});

describe('money held by anything else', () => {
  it('is held for later, as the account’s own kind is called, and never named as transit or SNAP', () => {
    // A landlord’s deposit stays open in a save from before 2026-10-09 whose holder had no current account to pay it
    // back into (`returnTheHomesMoney`, `engine/index.ts`). One is opened here to stand in for it.
    const sim = lifeIn('us-ny-newyork', 'us-chase', 'r5-other');
    const deposit = sim.openAccount({ id: sim.nextId('account'), kind: 'escrow', category: 'deposit', name: 'Deposit', ownerId: sim.player.id, institution: 'A Landlord', openedAt: sim.now });
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: deposit.id, amount: 750_00 }, { accountId: primary(sim).id, amount: -750_00 }] });
    const words = summary(sim);
    expect(words).toContain(`${say(sim, 750_00)} held for later`);
    expect(words).not.toMatch(/between your banks|SNAP/);
  }, 120_000);
});

describe('PLAYER JOURNEY: a New York life at Chase, on SNAP', () => {
  it('says the SNAP is on the EBT card, then the money between banks as well, each at its own amount', () => {
    const sim = lifeIn('us-ny-newyork', 'us-chase', 'r5-snap');
    run(sim, 'benefits.assistance');
    sim.advanceBy(8 * MS_DAY);
    const snap = ebtBalance(sim, sim.player);
    expect(snap).toBeGreaterThan(0);
    // SNAP and nothing on its way: no word of banks.
    const onSnap = summary(sim);
    expect(onSnap).toContain(`${say(sim, snap)} in SNAP on your EBT card`);
    expect(onSnap).not.toMatch(/between your banks|held apart/);

    // An account opened at Bank of America, funded from Chase: now both, each named for what holds it, and the parts
    // sum to what’s held.
    run(sim, 'bank.open_current', { bankId: 'us-bank-of-america', fundFrom: primary(sim).id, amount: 100_00 });
    const worth = netWorth(sim, sim.player.id);
    expect(worth.heldAs).toEqual({ ebt: snap, in_transit: 100_00 });
    expect(Object.values(worth.heldAs).reduce((s, x) => s + x, 0)).toBe(worth.held);
    const both = summary(sim);
    expect(both).toContain(`${say(sim, snap)} in SNAP on your EBT card`);
    expect(both).toContain(`${say(sim, 100_00)} on its way between your banks`);
    expect(both).not.toMatch(/held apart/);
  }, 120_000);
});
