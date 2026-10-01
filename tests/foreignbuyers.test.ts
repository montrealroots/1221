/**
 * A home bought in a country one isn't a citizen of (`systems/foreignbuyers.ts`,
 * from 2026-09-30): Canada's ban to 1 January 2027, Ontario's NRST and
 * Toronto's with it, British Columbia's additional transfer tax, and
 * England's 2% for a buyer not resident.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Person } from '@/engine/domain/model';
import { bcSvtRate, foreignBuyerFee, foreignBuyerRefusal, foreignBuyerTax } from '@/engine/systems/foreignbuyers';
import { MS_DAY } from '@/engine/core/time';
import { assessedValue, ownBuilt, type HomeFacts } from '@/engine/systems/homes';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { askingPrice, listingsIn, offerFor, offerRefusal } from '@/engine/systems/homes';

const who = (citizenshipId: string, home?: string) => ({ citizenshipId, ...(home ? { home: { kind: 'own', cityId: home } } : {}) }) as unknown as Person;

describe('the rules', () => {
  it('bars a non-Canadian from a Canadian city’s homes until 2027, and not a Canadian', () => {
    const sim = quickSave(undefined, 'foreign-ban');
    expect(foreignBuyerRefusal(sim, who('us'), 'ca-on-toronto')).toMatch(/1 January 2027/);
    expect(foreignBuyerRefusal(sim, who('ca'), 'ca-on-toronto')).toBeUndefined();
    expect(foreignBuyerRefusal(sim, who('us'), 'us-ny-newyork')).toBeUndefined();
    // A town under an agglomeration's 10,000 isn't in it.
    expect(foreignBuyerRefusal(sim, who('us'), 'ca-08-millbrook')).toBeUndefined();
    // And from 1 January 2027 the ban has lapsed.
    const later = { ...sim, now: Date.UTC(2027, 0, 2) } as typeof sim;
    expect(foreignBuyerRefusal(later, who('us'), 'ca-on-toronto')).toBeUndefined();
  });

  it('taxes a foreign buyer 35% in Toronto, 20% in Vancouver, and a non-resident 2% more in England', () => {
    expect(foreignBuyerTax(who('us'), 'ca-on-toronto', 1_000_000_00)).toBe(350_000_00);
    expect(foreignBuyerTax(who('us'), 'ca-bc-vancouver', 1_000_000_00)).toBe(200_000_00);
    expect(foreignBuyerTax(who('ca'), 'ca-on-toronto', 1_000_000_00)).toBe(0);
    expect(foreignBuyerTax(who('us', 'us-ny-newyork'), 'uk-eng-london', 1_000_000_00)).toBe(20_000_00);
    expect(foreignBuyerTax(who('us', 'uk-eng-london'), 'uk-eng-london', 1_000_000_00)).toBe(0);
  });
});

describe('an offer', () => {
  it('refuses a New Yorker’s offer on a Toronto home to let, and adds England’s 2% to a London one', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'foreign-offer');
    const toronto = listingsIn(sim, 'ca-on-toronto')[0]!;
    expect(offerRefusal(sim, sim.player, toronto.id, askingPrice(sim, toronto), 0.2, false)).toMatch(/1 January 2027/);
    const london = listingsIn(sim, 'uk-eng-london')[0]!;
    const price = askingPrice(sim, london);
    const resident = { ...sim.player, home: { ...sim.player.home!, cityId: 'uk-eng-london' } } as Person;
    expect(offerFor(sim, sim.player, london, 0.4, price, false).closing - offerFor(sim, resident, london, 0.4, price, false).closing).toBe(Math.round(price * 0.02));
  });

  it('adds the SRE’s MXN 5,252.02 convenio de renuncia to a foreigner’s home in Mexico City, and nothing to a Mexican’s', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'foreign-mx');
    const home = listingsIn(sim, 'mx-cmx-mexicocity')[0]!;
    const price = askingPrice(sim, home);
    const mexican = { ...sim.player, citizenshipId: 'mx' } as Person;
    const cur = saveCurrency(sim.universe);
    const fee = cur === 'MXN' ? 5_252_02 : exchange(5_252_02, 'MXN', cur)!;
    expect(foreignBuyerFee(sim, sim.player, 'mx-cmx-mexicocity')).toBe(fee);
    expect(foreignBuyerFee(sim, mexican, 'mx-cmx-mexicocity')).toBe(0);
    expect(foreignBuyerFee(sim, sim.player, 'ie-lei-dublin')).toBe(0);
    expect(offerFor(sim, sim.player, home, 0.4, price, false).closing - offerFor(sim, mexican, home, 0.4, price, false).closing).toBe(fee);
  });
});

describe('British Columbia’s speculation and vacancy tax', () => {
  it('takes 3% for 2026 and 4% from 2027 of a foreign owner’s empty home, a Canadian’s 0.5% for 2025 and 1% after, and nothing of one lived in half the year or let', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'svt');
    expect(bcSvtRate(sim.player, 'ca-bc-vancouver', 2026, 0, false)).toBe(0.03);
    expect(bcSvtRate(sim.player, 'ca-bc-vancouver', 2027, 0, false)).toBe(0.04);
    expect(bcSvtRate(sim.player, 'ca-bc-vancouver', 2025, 0, false)).toBe(0.02);
    expect(bcSvtRate(sim.player, 'ca-bc-vancouver', 2026, 200, false)).toBe(0);
    expect(bcSvtRate(sim.player, 'ca-bc-vancouver', 2026, 0, true)).toBe(0);
    expect(bcSvtRate(sim.player, 'ca-on-toronto', 2026, 0, false)).toBe(0);
    const canadian = { ...sim.player, citizenshipId: 'ca' } as Person;
    expect(bcSvtRate(canadian, 'ca-bc-vancouver', 2025, 0, false)).toBe(0.005);
    expect(bcSvtRate(canadian, 'ca-bc-vancouver', 2026, 0, false)).toBe(0.01);
    expect(bcSvtRate(canadian, 'ca-bc-vancouver', 2027, 0, false)).toBe(0.01);
    expect(bcSvtRate(canadian, 'ca-bc-vancouver', 2026, 200, false)).toBe(0);
  });

  it('is billed in July on an American’s Vancouver house left empty', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'svt-bill');
    const facts: HomeFacts = { type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_500, lot: 4_000, built: 2000, features: [], parts: {}, hoaUsd: 0 };
    const owned = ownBuilt(sim, sim.player, { cityId: 'ca-bc-vancouver', facts, price: 1_500_000_00, closing: 0 });
    owned.boughtAt -= 400 * MS_DAY;
    sim.advanceBy(400 * MS_DAY);
    const svt = sim.universe.transactions.filter((t) => t.memo.startsWith('Speculation And Vacancy Tax'));
    expect(svt.length).toBeGreaterThan(0);
    expect(svt[0]!.postings.filter((p) => p.amount > 0).reduce((a, p) => a + p.amount, 0)).toBeGreaterThan(Math.round(assessedValue(sim, owned) * 0.015));
  });
});
