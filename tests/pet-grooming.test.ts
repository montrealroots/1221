/**
 * A dog's bath and a pet's water (`pets.groom`, `groomDue`, `PET_WATER_L`, from
 * 2026-10-04): due every three months, at home in half an hour and a bath's
 * water or at the town's named groomer at its price; said the day it's due;
 * and what each pet drinks counted in the month's water.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { inSaveMoney } from '@/engine/systems/banking';
import { salesTaxRate } from '@/engine/content/tax';
import { GROOM_EVERY_DAYS, HOME_BATH_MINUTES, groomDue, groomerPrice, petsOf } from '@/engine/systems/pets';
import { PET_WATER_L, countWash, litersUsed } from '@/engine/systems/water';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);

describe('a dog’s bath', () => {
  it('is due three months on, and taken at the groomer at its price or at home in half an hour', () => {
    const sim = life('uk-eng-london', 'groom-ldn');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'battersea-dog', name: 'Rex' } });
    const rex = petsOf(sim.player)[0]!;
    expect(groomDue(rex)).toBe(rex.adoptedAt + GROOM_EVERY_DAYS * MS_DAY);
    expect(groomerPrice(sim, sim.player)).toBe(inSaveMoney(sim, 53_00, 'GBP'));
    // A month on, the bath moves the next one three months from it.
    sim.advanceBy(30 * MS_DAY);
    const before = sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const r = sim.must<{ paid: number; due: number }>({ kind: 'pets.groom', payload: { petId: rex.id, at: 'groomer' } });
    expect(r.paid).toBe(inSaveMoney(sim, 53_00, 'GBP'));
    expect(before - sim.universe.accounts[sim.player.primaryAccountId!]!.balance).toBe(r.paid);
    expect(r.due).toBe(sim.now + GROOM_EVERY_DAYS * MS_DAY);
    expect(groomDue(rex)).toBe(r.due);
    // At home: no money, half an hour, a bath's water.
    const at = sim.now;
    const baths = sim.player.living?.baths ?? 0;
    const home = sim.must<{ paid: number }>({ kind: 'pets.groom', payload: { petId: rex.id, at: 'home' } });
    expect(home.paid).toBe(0);
    expect(sim.now - at).toBe(HOME_BATH_MINUTES * 60_000);
    expect(sim.player.living?.baths ?? 0).toBe(baths + 1);
  });

  it('is said the day it comes due, and isn’t asked of a cat', () => {
    const sim = life('us-ny-newyork', 'groom-due');
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-dog', name: 'Rex' } });
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'aspca-cat', name: 'Mog' } });
    const mog = petsOf(sim.player).find((p) => p.species === 'cat')!;
    expect(sim.execute({ kind: 'pets.groom', payload: { petId: mog.id, at: 'home' } }).error).toBe('That isn’t a dog of yours.');
    const said = () => sim.universe.notifications.filter((n) => n.title === 'Rex Is Due A Bath').length;
    sim.advanceBy((GROOM_EVERY_DAYS - 2) * MS_DAY);
    expect(said()).toBe(0);
    sim.advanceBy(4 * MS_DAY);
    expect(said()).toBe(1);
  });

  it('adds Ontario’s HST to Toronto’s groomer, whose list is before it', () => {
    const sim = life('ca-on-toronto', 'groom-to');
    expect(groomerPrice(sim, sim.player)).toBe(Math.round(inSaveMoney(sim, 105_00, 'CAD') * (1 + salesTaxRate('ca-on-toronto', sim.now, 'goods'))));
    expect(salesTaxRate('ca-on-toronto', sim.now, 'goods')).toBeCloseTo(0.13, 6);
  });
});

describe('a pet’s water', () => {
  it('is drunk every day of the month, counted with the household’s', () => {
    const sim = life('uk-eng-london', 'pet-water');
    const without = litersUsed(sim.player, 'uk-eng-london', 3);
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'battersea-dog' } });
    sim.must({ kind: 'pets.adopt', payload: { shelterId: 'battersea-cat' } });
    expect(litersUsed(sim.player, 'uk-eng-london', 3) - without).toBeCloseTo((PET_WATER_L.dog + PET_WATER_L.cat) * 31, 6);
    expect(PET_WATER_L.dog).toBeCloseTo(1.4, 6);
  });

  it('counts a wash on the first day, before the home’s record was otherwise begun', () => {
    const sim = life('uk-eng-london', 'first-wash');
    delete sim.player.living;
    countWash(sim.player, false);
    const living = () => sim.player.living;
    expect(living()?.showers).toBe(1);
  });
});
