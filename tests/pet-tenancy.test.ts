/**
 * A rented home with a pet (`content/pettenancy.ts`, `depositFor`, `rentOf`,
 * `petArrives` in `systems/household.ts`, from 2026-10-04): a pet deposit
 * inside the deposit cap where the place's law counts it there, on top where
 * it doesn't, British Columbia's half a month; pet rent with the rent; a pet
 * come to a home already rented adding its deposit then.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import type { Simulation } from '@/engine/core/simulation';
import { costsAt, depositFor, rentOf } from '@/engine/systems/household';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const inSave = (sim: Simulation, cents: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? cents : exchange(cents, from, cur)!; };
const rent = (sim: Simulation, city: string) => costsAt(city, 'own', saveCurrency(sim.universe), sim.now).rent;

describe('a pet deposit', () => {
  it('sits inside New York’s month, and goes on top of Connecticut’s cap', () => {
    const sim = life('us-ny-newyork', 'pt-ny');
    sim.player.credit = { ...(sim.player.credit ?? {}), score: 720 } as typeof sim.player.credit;
    const ny = rent(sim, 'us-ny-newyork');
    expect(depositFor(sim, sim.player, 'own', 'us-ny-newyork', 0)).toBe(ny);
    expect(depositFor(sim, sim.player, 'own', 'us-ny-newyork', 1)).toBe(ny);
    const ct = rent(sim, 'us-ct-newhaven');
    expect(depositFor(sim, sim.player, 'own', 'us-ct-newhaven', 1)).toBe(ct + inSave(sim, 300_00, 'USD'));
    // Once however many.
    expect(depositFor(sim, sim.player, 'own', 'us-ct-newhaven', 2)).toBe(ct + inSave(sim, 300_00, 'USD'));
  });

  it('is half the month in British Columbia, and nothing in England, Ireland or Ontario', () => {
    const sim = life('ca-bc-vancouver', 'pt-bc');
    sim.player.credit = { ...(sim.player.credit ?? {}), score: 720 } as typeof sim.player.credit;
    const bc = rent(sim, 'ca-bc-vancouver');
    expect(depositFor(sim, sim.player, 'own', 'ca-bc-vancouver', 1)).toBe(Math.round(bc * 0.5) + Math.round(bc / 2));
    for (const city of ['uk-eng-london', 'ie-lei-dublin', 'ca-on-toronto']) expect(depositFor(sim, sim.player, 'own', city, 1)).toBe(depositFor(sim, sim.player, 'own', city, 0));
    // Its own pet deposit is half a month apart from the deposit, itself capped at half a month.
    expect(depositFor(sim, sim.player, 'own', 'ca-bc-vancouver', 0)).toBe(Math.round(bc * 0.5));
  });

  it('stands on each province’s own deposit cap, read by its atlas region (a poor record’s two months were asked in Toronto and Vancouver until 2026-10-04)', () => {
    const sim = life('ca-on-toronto', 'pt-caps');
    sim.player.credit = { ...(sim.player.credit ?? {}), score: 500 } as typeof sim.player.credit;
    expect(depositFor(sim, sim.player, 'own', 'ca-on-toronto', 0)).toBe(rent(sim, 'ca-on-toronto'));
    expect(depositFor(sim, sim.player, 'own', 'ca-bc-vancouver', 0)).toBe(Math.round(rent(sim, 'ca-bc-vancouver') * 0.5));
    // Where no cap is kept, a poor record's two months stand.
    expect(depositFor(sim, sim.player, 'own', 'mx-cmx-mexicocity', 0)).toBe(2 * rent(sim, 'mx-cmx-mexicocity'));
  });

  it('is taken on adopting in a rented home, held with the deposit, and pet rent is charged with the rent', () => {
    const sim = life('us-ct-newhaven', 'pt-adopt');
    expect(sim.player.home?.kind === 'own' || sim.player.home?.kind === 'shared').toBe(true);
    const held = () => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'escrow' && a.category === 'deposit')?.balance ?? 0;
    const before = held();
    const rentBefore = rentOf(sim, sim.player);
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'new-haven-shelter-dog', name: 'Rex' } });
    expect(held() - before).toBe(inSave(sim, 300_00, 'USD'));
    expect(rentOf(sim, sim.player) - rentBefore).toBe(inSave(sim, 35_65, 'USD'));
    // A second pet: its rent, but no second deposit.
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'new-haven-shelter-cat', name: 'Mog' } });
    expect(held() - before).toBe(inSave(sim, 300_00, 'USD'));
    expect(rentOf(sim, sim.player) - rentBefore).toBe(2 * inSave(sim, 35_65, 'USD'));
  });
});
