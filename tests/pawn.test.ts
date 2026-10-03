/**
 * Pawning jewelry and watches (`systems/pawn.ts`, from 2026-10-02): a loan
 * of 37.5% of what the piece would sell for second-hand, interest by each
 * place's law or pawnbroker, redeemed where it was pledged, and forfeit on
 * its day, with the surplus paid where the law gives it.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { addItem, homeKeyOf, itemById, type Item } from '@/engine/systems/items';
import { owedUnits, pawnsOf, pledgeQuote, pledgeRefusal } from '@/engine/systems/pawn';
import { inSaveMoney } from '@/engine/systems/banking';

const WATCH = 'us-timex-weekender-37mm-fabric-strap-watch';
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;

function watch(sim: Simulation, paid: number): Item {
  const p = sim.player;
  return addItem(sim, p, { kind: WATCH, label: 'A Watch', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(p.home)!, spot: 'drawers' }, acquiredAt: sim.now, paid, garment: { kind: 'accessory', slot: 'accessory', care: 'hand', wears: 0, washes: 0 } });
}

describe('a pledge', () => {
  it('lends 37.5% of the second-hand worth, and is redeemed with New York’s 4% a month or part', () => {
    const sim = life('us-ny-newyork', 'pawn-ny');
    const w = watch(sim, inSaveMoney(sim, 1_000_00, 'USD'));
    expect(pledgeQuote(sim, sim.player, [w.id]).loanUnits).toBeCloseTo(1000 * 0.28 * 0.375, 2);
    const before = bank(sim);
    const r = sim.must<{ pawnId: string; loan: number }>({ kind: 'pawn.pledge', payload: { itemIds: [w.id] } });
    expect(bank(sim) - before).toBe(r.loan);
    expect(w.at.kind).toBe('service');
    const pawn = pawnsOf(sim.player)[0]!;
    // Forty-five days: two months' interest.
    expect(owedUnits(pawn, pawn.at + 45 * MS_DAY)).toBeCloseTo(105 + 2 * 4.2, 6);
    sim.advanceBy(45 * MS_DAY);
    const mid = bank(sim);
    sim.must({ kind: 'pawn.redeem', payload: { pawnId: r.pawnId } });
    expect(mid - bank(sim)).toBe(inSaveMoney(sim, 113_40, 'USD'));
    expect(w.at.kind).toBe('home');
    expect(pawnsOf(sim.player)).toEqual([]);
    expect(sim.universe.accounts[pawn.accountId]!.closedAt).toBeDefined();
  });

  it('charges Los Angeles’s one-off charge and $3 a month at least, New Haven’s 5% on a small loan', () => {
    const la = life('us-ca-losangeles', 'pawn-la');
    const a = watch(la, inSaveMoney(la, 1_000_00, 'USD'));
    la.must({ kind: 'pawn.pledge', payload: { itemIds: [a.id] } });
    const pa = pawnsOf(la.player)[0]!;
    expect(owedUnits(pa, pa.at + MS_DAY)).toBeCloseTo(105 + 3.15 + 15, 6);
    const nh = life('us-ct-newhaven', 'pawn-nh');
    const b = watch(nh, inSaveMoney(nh, 100_00, 'USD'));
    nh.must({ kind: 'pawn.pledge', payload: { itemIds: [b.id] } });
    const pb = pawnsOf(nh.player)[0]!;
    expect(pb.loanUnits).toBeCloseTo(10.5, 2);
    expect(owedUnits(pb, pb.at + MS_DAY)).toBeCloseTo(10.5 * 1.05, 6);
  });

  it('charges H&T by the day in London, 28 days at least', () => {
    const sim = life('uk-eng-london', 'pawn-ldn');
    const w = watch(sim, inSaveMoney(sim, 1_000_00, 'GBP'));
    sim.must({ kind: 'pawn.pledge', payload: { itemIds: [w.id] } });
    const p = pawnsOf(sim.player)[0]!;
    const daily = p.loanUnits * 0.1049 * 12 / 365.25;
    expect(owedUnits(p, p.at + 3 * MS_DAY)).toBeCloseTo(p.loanUnits + 28 * daily, 6);
    expect(owedUnits(p, p.at + 40 * MS_DAY)).toBeCloseTo(p.loanUnits + 40 * daily, 6);
  });

  it('is forfeit on its day: New York pays the surplus, Los Angeles keeps the piece', () => {
    const ny = life('us-ny-newyork', 'pawn-ny-out');
    const w = watch(ny, inSaveMoney(ny, 1_000_00, 'USD'));
    ny.must({ kind: 'pawn.pledge', payload: { itemIds: [w.id] } });
    const p = pawnsOf(ny.player)[0]!;
    ny.advanceTo(p.until + MS_DAY);
    expect(itemById(ny.player, w.id)).toBeUndefined();
    expect(pawnsOf(ny.player)).toEqual([]);
    // Sold at its second-hand worth, $280, less the loan and five months at 4%: $154 paid back.
    const paid = (sim: Simulation) => Object.values(sim.universe.transactions).filter((t) => t.memo.endsWith('a pledge unredeemed')).flatMap((t) => t.postings).filter((x) => x.accountId === sim.player.primaryAccountId).reduce((a, x) => a + x.amount, 0);
    expect(paid(ny)).toBe(inSaveMoney(ny, 154_00, 'USD'));
    const la = life('us-ca-losangeles', 'pawn-la-out');
    const a = watch(la, inSaveMoney(la, 1_000_00, 'USD'));
    la.must({ kind: 'pawn.pledge', payload: { itemIds: [a.id] } });
    const q = pawnsOf(la.player)[0]!;
    la.advanceTo(q.until + MS_DAY);
    expect(itemById(la.player, a.id)).toBeUndefined();
    expect(paid(la)).toBe(0);
    expect(la.universe.accounts[q.accountId]!.balance).toBe(0);
  });

  it('takes only jewelry and watches, not worn, where SLATE keeps a pawnbroker’s terms', () => {
    const sim = life('us-ny-newyork', 'pawn-no');
    const w = watch(sim, 100_00);
    sim.player.wornNow = { itemIds: [w.id], since: sim.now };
    expect(pledgeRefusal(sim, sim.player, [w.id])).toBe('You’re wearing the A Watch.');
    sim.player.wornNow = { itemIds: [], since: sim.now };
    expect(pledgeRefusal(sim, sim.player, [w.id, 'x'])).toBe('A pawnbroker here takes jewelry and watches.');
    expect(pledgeRefusal(sim, sim.player, [{ ...w }.id])).toBeUndefined();
    const mx = life('mx-cmx-mexicocity', 'pawn-mx');
    expect(pledgeRefusal(mx, mx.player, ['x'])).toBe('SLATE keeps no pawnbroker’s terms in this town.');
  });

  it('charges Los Angeles’s $3 at least on a small loan, values by Kijiji’s half in Toronto, and is redeemed only where it was made', () => {
    const la = life('us-ca-losangeles', 'pawn-la-small');
    const a = watch(la, inSaveMoney(la, 100_00, 'USD'));
    la.must({ kind: 'pawn.pledge', payload: { itemIds: [a.id] } });
    const p = pawnsOf(la.player)[0]!;
    // $10.50 at 3% is 32 cents: the month is $3, and the one-off charge on a loan under $20 is $3.
    expect(owedUnits(p, p.at + MS_DAY)).toBeCloseTo(10.5 + 3 + 3, 6);
    la.player.currentLocationId = 'us-ny-newyork';
    expect(la.execute({ kind: 'pawn.redeem', payload: { pawnId: p.id } }).error).toBe('A pledge is redeemed where it was made.');
    const to = life('ca-on-toronto', 'pawn-to');
    const b = watch(to, inSaveMoney(to, 1_000_00, 'CAD'));
    expect(pledgeQuote(to, to.player, [b.id]).loanUnits).toBeCloseTo(1000 * 0.5 * 0.375, 1);
  });
});
