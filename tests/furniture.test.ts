/**
 * Furniture of one's own (`systems/furniture.ts`, docs/WORLD.md stage 6c,
 * from 2026-09-29): IKEA's prices delivered and taxed, a home bought or built
 * empty, the floor a night's sleep without a bed, half the relief unwinding
 * without a sofa, and the pieces moving with their owner.
 */
import { describe, expect, it } from 'vitest';
import { roomList } from '@/engine/systems/rooms';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { salesTaxRate } from '@/engine/content/tax';
import { MOVERS } from '@/engine/content/furniture';
import { applyLookingAfter, sleepQuality } from '@/engine/systems/life';
import { ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { mattressCost, mattressFeeUsd, mattressWorn, moversCost, onTheFloor, pieceCost, unwindComfort } from '@/engine/systems/furniture';
import { followTheMove, itemsOf, leavingHome } from '@/engine/systems/items';

const save = (city: string, name: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_600, built: 2000, features: [], parts: {}, hoaUsd: 0 };
/** A home of their own, built empty, lived in. */
function empty(sim: Simulation, city: string) {
  const owned = ownBuilt(sim, sim.player, { cityId: city, facts: { ...facts }, price: 400_000_00, closing: 0 });
  // Moved into, the belongings coming along as a move brings them (`systems/items.ts`).
  const from = leavingHome(sim.player);
  sim.player.home = { kind: 'owned', cityId: city, homeId: owned.id, since: sim.now };
  followTheMove(sim.player, from);
  return owned;
}

describe('what a piece costs', () => {
  it('prices IKEA’s bed and sofa at their regular prices, delivered, with America’s sales tax on top and Britain’s VAT inside', () => {
    const ny = save('us-ny-newyork', 'furn-price');
    const rate = salesTaxRate('us-ny-newyork', ny.now, 'furniture');
    expect(rate).toBeGreaterThan(0);
    expect(pieceCost(ny, 'us-ny-newyork', 'bed')).toEqual({ amount: inSave(ny, (648 + 29) * 100 + Math.round(64_800 * rate), 'USD'), tax: inSave(ny, Math.round(64_800 * rate), 'USD') });
    expect(pieceCost(ny, 'uk-eng-london', 'sofa')!.amount).toBe(inSave(ny, 524_00, 'GBP'));
    expect(pieceCost(ny, 'uk-eng-london', 'sofa')!.tax).toBe(0);
    expect(pieceCost(ny, 'fr-idf-paris', 'bed')).toBeUndefined();
  });
});

describe('an empty home', () => {
  it('comes empty when bought or built, and a home owned before is furnished', () => {
    const sim = save('us-ny-newyork', 'furn-bare');
    const owned = empty(sim, 'us-ny-newyork');
    expect(owned.bare).toBe(true);
    expect(onTheFloor(sim.player)).toBe(true);
    delete owned.bare;
    expect(onTheFloor(sim.player)).toBe(false);
  });

  it('sleeps worse on the floor with no bed, by a sofa night’s 0.08, until a bed is bought', () => {
    const sim = save('us-ny-newyork', 'furn-sleep');
    const owned = empty(sim, 'us-ny-newyork');
    const floor = sleepQuality(sim, sim.player);
    delete owned.bare;
    const furnished = sleepQuality(sim, sim.player);
    owned.bare = true;
    expect(furnished - floor).toBeCloseTo(0.08, 6);
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += 10_000_00;
    const r = sim.execute<{ paid: number }>({ kind: 'home.furnish', payload: { piece: 'bed' } });
    expect(r.ok, r.error).toBe(true);
    expect(onTheFloor(sim.player)).toBe(false);
    expect(sleepQuality(sim, sim.player)).toBeCloseTo(furnished, 6);
    // A bed for each bedroom of theirs (from 2026-10-06; until then one at most), then refused.
    const rooms = roomList(sim, sim.player).filter((x) => x.kind === 'bedroom' && x.access === 'yours').length;
    for (let n = 1; n < rooms; n += 1) expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'bed' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'bed' } }).error).toMatch(rooms > 1 ? /Every bedroom of yours has a bed/ : /You have one/);
  });

  it('takes half the stress off unwinding with no sofa, and all of it with one', () => {
    const sim = save('uk-eng-london', 'furn-sofa');
    empty(sim, 'uk-eng-london');
    expect(unwindComfort(sim.player)).toBe(0.5);
    const w = sim.player.wellbeing;
    w.stress = 60;
    applyLookingAfter(sim.player, 'unwind', sim.now, 1, unwindComfort(sim.player));
    const half = 60 - w.stress;
    w.stress = 60;
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 1_000_00, 'GBP');
    expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'sofa' } }).ok).toBe(true);
    applyLookingAfter(sim.player, 'unwind', sim.now, 1, unwindComfort(sim.player));
    expect(60 - w.stress).toBeCloseTo(half * 2, 6);
  });

  it('keeps a bed bought in one home for the next', () => {
    const sim = save('us-ny-newyork', 'furn-move');
    empty(sim, 'us-ny-newyork');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += 10_000_00;
    expect(sim.execute({ kind: 'home.furnish', payload: { piece: 'bed' } }).ok).toBe(true);
    empty(sim, 'us-ny-newyork');
    expect(onTheFloor(sim.player)).toBe(false);
  });
});

describe('a mattress’s recycling fee, and movers', () => {
  it('adds California’s and Connecticut’s mattress fee to a bed, each from its day, and none in New York', () => {
    expect(mattressFeeUsd('us-ca-losangeles', Date.UTC(2026, 2, 31))).toBe(16);
    expect(mattressFeeUsd('us-ca-losangeles', Date.UTC(2026, 3, 2))).toBe(18);
    expect(mattressFeeUsd('us-ct-newhaven', Date.UTC(2026, 8, 30))).toBe(16);
    expect(mattressFeeUsd('us-ct-newhaven', Date.UTC(2026, 9, 2))).toBe(19.5);
    expect(mattressFeeUsd('us-ny-newyork', Date.UTC(2026, 9, 2))).toBe(0);
    const sim = save('us-ct-newhaven', 'furn-fee');
    const bed = pieceCost(sim, 'us-ct-newhaven', 'bed')!.amount;
    const sofa = pieceCost(sim, 'us-ct-newhaven', 'sofa')!.amount;
    const rate = salesTaxRate('us-ct-newhaven', sim.now, 'furniture');
    expect(bed).toBe(inSave(sim, 677_00 + Math.round(648_00 * rate) + mattressFeeUsd('us-ct-newhaven', sim.now) * 100, 'USD'));
    expect(sofa).toBe(inSave(sim, 828_00 + Math.round(799_00 * rate), 'USD'));
  });

  it('charges movers only for pieces of one’s own: a one-bedroom’s local or long-distance move, Ireland’s, and abroad where the pair is priced', () => {
    const sim = save('us-ny-newyork', 'furn-movers');
    expect(moversCost(sim, sim.player, 'us-ny-newyork', 'us-ny-newyork')).toBe(0);
    sim.player.furniture = { bed: sim.now };
    expect(moversCost(sim, sim.player, 'us-ny-newyork', 'us-ny-newyork')).toBe(inSave(sim, 475_00, 'USD'));
    expect(moversCost(sim, sim.player, 'us-ny-newyork', 'us-ca-losangeles')).toBe(inSave(sim, 1_850_00, 'USD'));
    expect(moversCost(sim, sim.player, 'uk-eng-london', 'uk-eng-london')).toBe(inSave(sim, 466_00, 'GBP'));
    expect(moversCost(sim, sim.player, 'uk-eng-london', 'uk-sct-edinburgh')).toBe(inSave(sim, 691_00, 'GBP'));
    // Abroad, the pair's estimate either way; none where nobody publishes one.
    expect(moversCost(sim, sim.player, 'us-ny-newyork', 'uk-eng-london')).toBe(inSave(sim, 2_516_50, 'USD'));
    expect(moversCost(sim, sim.player, 'ie-lei-dublin', 'uk-eng-london')).toBe(inSave(sim, 1_200_00, 'GBP'));
    expect(moversCost(sim, sim.player, 'uk-eng-london', 'ie-lei-dublin')).toBe(inSave(sim, 1_200_00, 'GBP'));
    // From 2026-10-01 every pair: MoveHub's middle from Mexico to Britain, AMC's from Dublin to Toronto.
    expect(moversCost(sim, sim.player, 'mx-cmx-mexicocity', 'uk-eng-london')).toBe(inSave(sim, 4_562_50, 'GBP'));
    expect(moversCost(sim, sim.player, 'ie-lei-dublin', 'ca-on-toronto')).toBe(inSave(sim, 3_250_00, 'EUR'));
    expect(moversCost(sim, sim.player, 'ca-on-toronto', 'uk-eng-london')).toBe(inSave(sim, 4_149_50, 'GBP'));
    expect(moversCost(sim, sim.player, 'ie-lei-dublin', 'mx-cmx-mexicocity')).toBe(inSave(sim, 4_902_00, 'GBP'));
    expect(moversCost(sim, sim.player, 'mx-cmx-mexicocity', 'ca-bc-vancouver')).toBe(inSave(sim, 3_356_50, 'GBP'));
    // Britain's distance, for a town near enough to be local.
    expect([5, 30, 80].map((mi) => MOVERS.uk!.local(mi))).toEqual([466, 578.5, 691]);
    expect(moversCost(sim, sim.player, 'ie-lei-dublin', 'ie-lei-dublin')).toBe(inSave(sim, 450_00, 'EUR'));
  });

  it('pays the movers on moving home with a bed of one’s own', () => {
    const sim = save('us-ny-newyork', 'furn-move');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 50_000_00, 'USD');
    sim.player.furniture = { bed: sim.now };
    const kind = sim.player.home!.kind === 'shared' ? 'own' : 'shared';
    const r = sim.execute({ kind: 'home.move', payload: { kind } });
    expect(r.ok, r.error).toBe(true);
    const paid = sim.universe.transactions.filter((t) => t.memo === 'Movers, your bed and sofa');
    expect(paid).toHaveLength(1);
    expect(paid[0]!.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(inSave(sim, 475_00, 'USD'));
  });
});

describe('a mattress wearing out', () => {
  it('wears after six years, sleeps half the floor’s cost worse at home, and a new one ends it', () => {
    const sim = save('us-ny-newyork', 'mattress-wear');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 10_000_00, 'USD');
    sim.player.furniture = { bed: sim.now - 6 * 365.2425 * 86_400_000 - 86_400_000 };
    expect(mattressWorn(sim.player, sim.now)).toBe(true);
    sim.player.wellbeing.stress = 0;
    const worn = sleepQuality(sim, sim.player);
    expect(sim.execute({ kind: 'home.replace_mattress', payload: {} }).ok).toBe(true);
    expect(mattressWorn(sim.player, sim.now)).toBe(false);
    expect(sleepQuality(sim, sim.player) - worn).toBeCloseTo(0.04, 10);
    // A bed bought five years ago, its first mattress still in it: an item since 2026-10-01.
    itemsOf(sim.player).find((i) => i.kind === 'furniture:bed')!.acquiredAt = sim.now - 5 * 365.2425 * 86_400_000;
    delete sim.player.mattressAt;
    expect(mattressWorn(sim.player, sim.now)).toBe(false);
  });

  it('prices IKEA’s mattress, delivered and taxed, with a state’s fee and a retailer’s removal: $399 and $30 in America, £299 and £60 in Britain, none in Canada', () => {
    const ny = save('us-ny-newyork', 'mattress-ny');
    const rate = salesTaxRate('us-ny-newyork', ny.now, 'furniture');
    expect(mattressCost(ny, 'us-ny-newyork')).toBe(inSave(ny, 399_00 + 29_00 + 30_00 + Math.round(399_00 * rate), 'USD'));
    expect(mattressCost(ny, 'uk-eng-london')).toBe(inSave(ny, 299_00 + 25_00 + 60_00, 'GBP'));
    expect(mattressCost(ny, 'ca-on-toronto')).toBe(inSave(ny, 499_00 + 59_00 + Math.round(499_00 * salesTaxRate('ca-on-toronto', ny.now, 'furniture')), 'CAD'));
    // A new bed brings its own mattress.
    ny.universe.accounts[ny.player.primaryAccountId!]!.balance += inSave(ny, 10_000_00, 'USD');
    ny.player.mattressAt = ny.now - 7 * 365.2425 * 86_400_000;
    ny.player.furniture = {};
    expect(ny.execute({ kind: 'home.furnish', payload: { piece: 'bed' } }).ok).toBe(true);
    expect(mattressWorn(ny.player, ny.now)).toBe(false);
  });
});
