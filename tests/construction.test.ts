/**
 * Building a house (`systems/construction.ts`, docs/WORLD.md stage 5a, from
 * 2026-09-29): each place's contract and fees to the cent, the zoning's bulk,
 * the stages billed and the work stopped for an unpaid bill, the house a home
 * owned at the end, and London's self-build exemption lost on a sale.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { LAND_MARKETS } from '@/engine/content/land';
import { SQFT_PER_M2, STAGES } from '@/engine/content/construction';
import { buildFees, buildQuote, buildRefusal, mostFloor, type BuildQuote } from '@/engine/systems/construction';
import { parcelsOf, type Parcel } from '@/engine/systems/land';
import { homesOf } from '@/engine/systems/homes';

const idx = (label: RegExp) => LAND_MARKETS.findIndex((m) => label.test(m.label));
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const fund = (sim: Simulation, cents: number) => { sim.universe.accounts[sim.player.primaryAccountId!]!.balance += cents; };
const save = (city: string, name: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
const lot = (market: RegExp, acres: number, paid = 500_000_00): Parcel => ({ id: 'parcel_x', market: idx(market), acres, boughtAt: 0, paid });
/** A parcel owned, as if bought. */
const own = (sim: Simulation, market: RegExp, acres: number, paid = 500_000_00) => { const p = { ...lot(market, acres, paid), id: `parcel_${parcelsOf(sim.player).length + 1}`, boughtAt: sim.now }; parcelsOf(sim.player).push(p); return p; };
const fee = (q: BuildQuote, re: RegExp) => q.fees.find((l) => re.test(l.label))!.amount;
const memoed = (sim: Simulation, re: RegExp) => sim.universe.transactions.filter((t) => re.test(t.memo));

describe('what building costs', () => {
  it('prices New York at the Northeast’s $179.30 a square foot, with DOB’s $0.06 a square foot, and fits only what R2’s 0.75 takes', () => {
    const brooklyn = lot(/Brooklyn/, 2_850 / 43_560);
    expect(mostFloor('nyc', brooklyn.acres)).toBeCloseTo(2_137.5, 6);
    const q = buildQuote(brooklyn, 'ne-owner', true) as BuildQuote;
    expect(q.contract).toBe(30_857_530);
    expect(q.fees).toEqual([{ label: 'New Building Permit', amount: 103_26 }]);
    expect(buildQuote(brooklyn, 'ne-median', true)).toMatch(/doesn’t fit: the lot takes 2,137 sq ft/);
    // Under 1,667 sq ft, the $100 least.
    expect(buildFees('nyc', 1_000, 0).lines[0]!.amount).toBe(100_00);
  });

  it('charges New Haven’s permit by the $1,000 and the state’s education fee, and fits by RS-2’s coverage on two stories', () => {
    const q = buildQuote(lot(/New Haven/, 0.25), 'ne-average', true) as BuildQuote;
    expect(q.contract).toBe(51_405_310);
    expect(fee(q, /Building Permit/)).toBe(7_745_00);
    expect(fee(q, /Education/)).toBe(133_65);
    expect(mostFloor('new-haven', 4_000 / 43_560)).toBeCloseTo(2_400, 6);
    expect(buildQuote(lot(/New Haven/, 4_000 / 43_560), 'ne-median', true)).toMatch(/doesn’t fit/);
  });

  it('values Los Angeles’s permit on LADBS’s table and adds plan check, the state’s fees, the linkage and school fees and the certificate; R1 takes 45% of the lot', () => {
    const q = buildQuote(lot(/Los Angeles/, 5_000 / 43_560), 'w-owner', true) as BuildQuote;
    expect(q.contract).toBe(29_820_282);
    // Valuation $101 × 1,686 = $170,286: $395 and $3.50 a $1,000.
    expect(fee(q, /^Building Permit/)).toBe(991_00);
    expect(fee(q, /Plan Check/)).toBe(891_90);
    expect(fee(q, /Strong-Motion/)).toBe(22_14);
    expect(fee(q, /Building Standards/)).toBe(6_81);
    expect(fee(q, /Linkage/)).toBe(17_500_68);
    expect(fee(q, /School/)).toBe(9_070_68);
    expect(fee(q, /Occupancy/)).toBe(150_00);
    expect(buildQuote(lot(/Los Angeles/, 5_000 / 43_560), 'w-median', true)).toMatch(/2,250 sq ft/);
  });

  it('charges London’s building control with VAT and Croydon’s and the Mayor’s CIL, spared for someone building to live in it', () => {
    const plot = lot(/Croydon/, 200 / 4_046.8564224);
    const m2 = Math.round(93 * SQFT_PER_M2) / SQFT_PER_M2;
    const letting = buildQuote(plot, 'nds-3b5p', false) as BuildQuote;
    expect(letting.contract).toBe(Math.round(2_640 * m2 * 100));
    expect(fee(letting, /Building Control/)).toBe(1_222_20);
    expect(fee(letting, /Levy/)).toBe(Math.round((209.61 + 30.3) * m2 * 100));
    const living = buildQuote(plot, 'nds-3b5p', true) as BuildQuote;
    expect(fee(living, /Levy, Spared/)).toBe(0);
    expect(living.spared).toBe(fee(letting, /Levy/));
    expect(living.total).toBe(letting.total - living.spared);
  });

  it('bills the contract in NAHB’s seven stages, to the cent, over the place’s months', () => {
    const q = buildQuote(lot(/Brooklyn/, 2_850 / 43_560), 'ne-owner', true) as BuildQuote;
    expect(q.stages.map((s) => s.name)).toEqual(STAGES.map((s) => s.name));
    expect(q.stages.reduce((a, s) => a + s.amount, 0)).toBe(q.contract);
    // Interior finishes, $103,391 of $407,947 (NAHB’s stages sum to $428,214, a dollar under its total, less the fees).
    expect(q.stages[5]!.amount).toBe(Math.round(q.contract * 103_391 / 407_947));
    expect(q.permitDays).toBe(67);
    expect(q.stages.reduce((a, s) => a + s.days, 0)).toBeCloseTo(10.4 * 30.436875, -1);
  });

  it('builds only on a town lot', () => {
    expect(buildQuote(lot(/Upstate/, 10), 'ne-owner', true)).toMatch(/only on a town lot/);
  });
});

describe('building it', () => {
  it('pays the fees at the start, each stage as it’s done, and ends with a home owned at what the land and building cost', () => {
    const sim = save('us-ny-newyork', 'build-ny');
    const p = own(sim, /Queens/, 2_850 / 43_560, 380_000_00);
    const q = buildQuote(p, 'ne-owner', true) as BuildQuote;
    fund(sim, inSave(sim, q.total, 'USD'));
    const r = sim.execute<{ fees: number; finishesBy: number }>({ kind: 'build.start', payload: { parcelId: p.id, designId: 'ne-owner' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.fees).toBe(inSave(sim, q.feesTotal, 'USD'));
    expect(buildRefusal(sim, sim.player, p.id, 'ne-owner', true)).toMatch(/being built already/);
    // Being built on, it isn't sold or split.
    expect(sim.execute({ kind: 'land.sell', payload: { parcelId: p.id } }).error).toMatch(/being built/);
    sim.advanceTo(r.value!.finishesBy + MS_DAY);
    const bills = memoed(sim, /^The contractor, /);
    expect(bills).toHaveLength(STAGES.length);
    expect(bills.reduce((a, t) => a + t.postings.filter((x) => x.amount > 0).reduce((b, x) => b + x.amount, 0), 0)).toBe(q.stages.reduce((a, s) => a + inSave(sim, s.amount, 'USD'), 0));
    expect(sim.player.building).toBeUndefined();
    const home = homesOf(sim.player).find((h) => h.facts.address === 'Your House In Queens')!;
    expect(home).toBeDefined();
    expect(home.price).toBe(inSave(sim, 380_000_00 + q.contract, 'USD'));
    expect(home.closing).toBe(inSave(sim, q.feesTotal, 'USD'));
    expect(home.facts.size).toBe(1_721);
    expect(home.facts.lot).toBe(2_850);
    expect(p.builtOn).toBe(home.id);
    expect(p.soldAt).toBeDefined();
    const moved = sim.execute({ kind: 'home.move_in', payload: { homeId: home.id } });
    expect(moved.ok, moved.error).toBe(true);
  });

  it('refuses to start what the bank can’t pay the permits and fees for', () => {
    const sim = save('us-ny-newyork', 'build-poor');
    const p = own(sim, /Queens/, 2_850 / 43_560);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0) a.balance = 0;
    expect(buildRefusal(sim, sim.player, p.id, 'ne-owner', true)).toMatch(/more than the bank holds/);
    expect(sim.execute({ kind: 'build.start', payload: { parcelId: p.id, designId: 'ne-owner' } }).ok).toBe(false);
    expect(sim.player.building).toBeUndefined();
  });

  it('stops work on a bill the bank can’t pay, and Pay The Contractor starts it again', () => {
    const sim = save('us-ny-newyork', 'build-stop');
    const p = own(sim, /Queens/, 2_850 / 43_560);
    const q = buildQuote(p, 'ne-owner', true) as BuildQuote;
    fund(sim, inSave(sim, q.feesTotal, 'USD'));
    expect(sim.execute({ kind: 'build.start', payload: { parcelId: p.id, designId: 'ne-owner' } }).ok).toBe(true);
    sim.advanceBy((q.permitDays + 1) * MS_DAY);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0 && a.kind !== 'escrow') a.balance = 0;
    sim.advanceBy((q.stages[0]!.days + 1) * MS_DAY);
    const b = sim.player.building!;
    expect(b.unpaid).toBe(q.stages[0]!.amount);
    expect(b.stoppedAt).toBeDefined();
    expect(b.stage).toBe(0);
    // Stopped, nothing moves on.
    sim.advanceBy(60 * MS_DAY);
    expect(sim.player.building!.stage).toBe(0);
    expect(sim.execute({ kind: 'build.pay', payload: {} }).ok).toBe(false);
    fund(sim, inSave(sim, q.contract, 'USD'));
    const paid = sim.execute<{ paid: number }>({ kind: 'build.pay', payload: {} });
    expect(paid.ok, paid.error).toBe(true);
    expect(paid.value!.paid).toBe(inSave(sim, q.stages[0]!.amount, 'USD'));
    expect(sim.player.building!.stage).toBe(1);
    expect(sim.player.building!.unpaid).toBeUndefined();
  });

  it('owes London’s spared levy when the self-built house is sold within three years', () => {
    const sim = save('uk-eng-london', 'build-gb');
    const p = own(sim, /Croydon/, 200 / 4_046.8564224, 400_000_00);
    const q = buildQuote(p, 'nds-3b5p', true) as BuildQuote;
    fund(sim, inSave(sim, q.total, 'GBP'));
    const r = sim.execute<{ finishesBy: number }>({ kind: 'build.start', payload: { parcelId: p.id, designId: 'nds-3b5p', live: true } });
    expect(r.ok, r.error).toBe(true);
    sim.advanceTo(r.value!.finishesBy + MS_DAY);
    const home = homesOf(sim.player).find((h) => h.facts.address === 'Your House In Croydon')!;
    expect(home.clawback!.amount).toBe(inSave(sim, q.spared, 'GBP'));
    const sold = sim.execute({ kind: 'home.sell', payload: { homeId: home.id } });
    expect(sold.ok, sold.error).toBe(true);
    const levy = memoed(sim, /self-build exemption lost/);
    expect(levy).toHaveLength(1);
    expect(levy[0]!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(inSave(sim, q.spared, 'GBP'));
    expect(home.clawback).toBeUndefined();
  });

  it('owes nothing when it’s sold three years after it was finished', () => {
    const sim = save('uk-eng-london', 'build-gb-late');
    const p = own(sim, /Havering/, 200 / 4_046.8564224, 300_000_00);
    const q = buildQuote(p, 'nds-2b4p', true) as BuildQuote;
    fund(sim, inSave(sim, q.total + 200_000_00, 'GBP'));
    const r = sim.execute<{ finishesBy: number }>({ kind: 'build.start', payload: { parcelId: p.id, designId: 'nds-2b4p', live: true } });
    expect(r.ok, r.error).toBe(true);
    sim.advanceTo(r.value!.finishesBy + MS_DAY);
    const home = homesOf(sim.player).find((h) => h.facts.address === 'Your House In Havering')!;
    sim.advanceTo(home.clawback!.until + MS_DAY);
    expect(sim.execute({ kind: 'home.sell', payload: { homeId: home.id } }).ok).toBe(true);
    expect(memoed(sim, /self-build exemption lost/)).toHaveLength(0);
  });
});
