/**
 * The ordinary rooms.
 *
 * What a test can hold about the salon, the chemist, the post office and the
 * launderette: a chain only where a chain is allowed to own a pharmacy, a
 * counter that belongs to the national operator, a haircut that grows out on
 * a clock rather than a flag, a shelf that is the same shelf when you walk
 * back in, postage that answers to weight and distance, a parcel that can be
 * late or gone and can only arrive once, and a service wash that takes your
 * clothes away until tomorrow.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  counterPrice, describeParcel, describePharmacy, groomingNote, groomingOf, groomingPenalty,
  inTransit, launderettesIn, operatorAt, parcelsOf, pharmaciesIn, pharmacyChainOf, postOfficesIn,
  postagePrice, salonPrice, salonsIn, shelfAt,
} from '@/engine/systems/errands';
import {
  COUNTER_GOODS, ERRAND_NOTE, GROOMING_DAYS, MAX_PARCEL_GRAMS, PHARMACIES_ARE_INDEPENDENT, PHARMACY_NOTE,
  POST_NOTE,
  POSTAL_OPERATORS, SALON_SERVICES, SERVICE_WASH_SHARE, pharmacyChainsIn, postalOperatorIn,
} from '@/engine/content/errands';
import { LAUNDERETTE_LOAD } from '@/engine/systems/household';
import { shoppableItems } from '@/engine/content/catalog';
import { createAsset } from '@/engine/systems/commerce';
import { ensureWardrobe, garmentsOf } from '@/engine/systems/wardrobe';
import { costOfLiving } from '@/engine/content/tax';
import { MS_DAY, MS_MINUTE } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, OwnedAsset, Parcel } from '@/engine/domain/model';
import { placesIn, type Place } from '@/engine/content/places';

const LONDON = 'uk-eng-london';
const BERLIN = 'de-be-berlin';

function inTown(name: string, cityId: string = LONDON): Simulation {
  const sim = quickSave({ wealth: 'wealthy' }, name);
  sim.player.currentLocationId = cityId;
  sim.income(sim.player.primaryAccountId!, 200_000_00, 'Test funding', 'other');
  return sim;
}

/** Standing in a room, which is what every one of these commands needs. */
function standIn(sim: Simulation, place: Place): Place {
  sim.player.currentPlaceId = place.id;
  return place;
}

function own(sim: Simulation, catalogId: string): OwnedAsset {
  const item = shoppableItems().find((one) => one.id === catalogId)!;
  const asset = createAsset(sim, {
    ownerId: sim.player.id, catalogItem: item, purchasePrice: item.basePrice, acquiredVia: 'purchase',
  });
  ensureWardrobe(sim);
  return asset;
}

/** Run the delivery that is waiting on this parcel, without waiting for it. */
function deliver(sim: Simulation, parcelId: Id): void {
  const parcel = sim.universe.parcels[parcelId]!;
  sim.advanceTo(parcel.dueAt + MS_MINUTE);
}

// ---------------------------------------------------------------------------

describe('the rooms a town has', () => {
  it('puts a salon, a chemist, a post office and a launderette in a city', () => {
    const sim = inTown('rooms');
    expect(salonsIn(sim).length).toBeGreaterThan(0);
    expect(pharmaciesIn(sim).length).toBeGreaterThan(0);
    expect(postOfficesIn(sim).length).toBeGreaterThan(0);
    expect(launderettesIn(sim).length).toBeGreaterThan(0);
  });

  it('says plainly what is real about them and that nothing is medical advice', () => {
    expect(PHARMACY_NOTE).toMatch(/SLATE/);
    expect(PHARMACY_NOTE).toMatch(/n[o’]t medical advice/);
    expect(PHARMACY_NOTE).toMatch(/independently owned/);
    expect(POST_NOTE).toMatch(/SLATE/);
    // A post office counter has no business explaining pharmacy ownership law.
    expect(POST_NOTE).not.toMatch(/pharmac/i);
    expect(ERRAND_NOTE).toContain(PHARMACY_NOTE);
    expect(ERRAND_NOTE).toContain(POST_NOTE);
  });

  it('names a chemist after a chain that really trades in that country', () => {
    const sim = inTown('chains');
    expect(pharmacyChainsIn('uk').length).toBeGreaterThan(0);
    // The sign is the chain, whether or not a corner follows it: a second
    // branch in a city whose high street already has every chain is still
    // that chain's branch.
    const named = pharmaciesIn(sim).filter((place) => pharmacyChainOf(place));
    expect(named.length).toBeGreaterThan(0);
    for (const place of named) {
      const chain = pharmacyChainOf(place)!;
      expect(place.name.startsWith(chain.name)).toBe(true);
      expect(chain.about.length).toBeGreaterThan(15);
      expect(describePharmacy(place)).toContain(chain.name);
    }

    // And no chemist wears a name the high street already has, so a player
    // cannot see the same shop twice in one list.
    const street = placesIn(LONDON);
    expect(new Set(street.map((one) => one.name.toLowerCase())).size).toBe(street.length);
  });

  it('leaves a chemist independent where the law requires it, and says why', () => {
    const sim = inTown('apotheke', BERLIN);
    expect(PHARMACIES_ARE_INDEPENDENT.has('de')).toBe(true);
    for (const place of pharmaciesIn(sim)) {
      expect(pharmacyChainOf(place)).toBeUndefined();
      expect(place.name).toMatch(/Apotheke/);
      expect(describePharmacy(place)).toMatch(/owned by the pharmacist/);
    }
  });

  it('gives every country one national postal operator, and no country two', () => {
    const byCountry = new Map<string, number>();
    for (const operator of POSTAL_OPERATORS) {
      byCountry.set(operator.countryId, (byCountry.get(operator.countryId) ?? 0) + 1);
    }
    for (const [countryId, count] of byCountry) {
      expect(`${countryId}:${count}`).toBe(`${countryId}:1`);
    }
  });

  it('puts the national operator on the post office counter', () => {
    const sim = inTown('post');
    const operator = postalOperatorIn('uk')!;
    const post = postOfficesIn(sim)[0]!;
    expect(post.name).toBe(operator.name);
    expect(operatorAt(post)).toBe(operator.name);
  });
});

describe('the chair', () => {
  it('starts a life freshly cut, on the first day, and grows out from there', () => {
    const sim = inTown('fresh');
    // The clock starts at the beginning of the life rather than staying at a
    // hundred until somebody happens to sit in a chair.
    expect(sim.player.groomedAt).toBe(sim.now);
    expect(groomingOf(sim)).toBe(100);
    expect(groomingPenalty(sim)).toBe(0);
    sim.advanceTo(sim.now + GROOMING_DAYS * MS_DAY);
    expect(groomingOf(sim)).toBe(0);
    expect(groomingPenalty(sim)).toBeGreaterThan(0);
  });

  it('reads a save from before the salon as freshly cut rather than as a hole', () => {
    const sim = inTown('legacy');
    delete sim.player.groomedAt;
    expect(groomingOf(sim)).toBe(100);
    expect(groomingPenalty(sim)).toBe(0);
  });

  it('grows out over six weeks and then stops looking like a haircut', () => {
    const sim = inTown('grow');
    sim.player.groomedAt = sim.now;
    expect(groomingOf(sim)).toBe(100);
    sim.player.groomedAt = sim.now - (GROOMING_DAYS / 2) * MS_DAY;
    expect(groomingOf(sim)).toBeCloseTo(50, -1);
    sim.player.groomedAt = sim.now - GROOMING_DAYS * MS_DAY * 2;
    expect(groomingOf(sim)).toBe(0);
    expect(groomingPenalty(sim)).toBeGreaterThan(0);
    expect(groomingNote(sim)).toMatch(/first thing anybody notices/);
  });

  it('charges for the cut, takes the time, and resets the clock', () => {
    const sim = inTown('cut');
    const place = standIn(sim, salonsIn(sim)[0]!);
    sim.player.groomedAt = sim.now - GROOMING_DAYS * MS_DAY;
    expect(groomingOf(sim)).toBe(0);

    const service = SALON_SERVICES.find((one) => one.restores >= 100)!;
    const price = salonPrice(place, service.id);
    expect(price).toBeGreaterThan(0);
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const at = sim.now;

    const res = sim.execute<{ paid: number; note: string; grooming: number }>({
      kind: 'errand.haircut', payload: { placeId: place.id, service: service.id },
    });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.paid).toBe(price);
    expect(res.value!.grooming).toBe(100);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before - price);
    expect(sim.now).toBe(at + service.minutes * MS_MINUTE);
    expect(sim.player.groomedAt).toBe(sim.now);
    expect(res.value!.note.length).toBeGreaterThan(10);
  });

  it('puts back less for a trim than for a cut', () => {
    const sim = inTown('trim');
    const place = standIn(sim, salonsIn(sim)[0]!);
    sim.player.groomedAt = sim.now - GROOMING_DAYS * MS_DAY;
    const trim = SALON_SERVICES.find((one) => one.restores > 0 && one.restores < 100);
    if (!trim) return;
    sim.execute({ kind: 'errand.haircut', payload: { placeId: place.id, service: trim.id } });
    expect(groomingOf(sim)).toBeGreaterThan(0);
    expect(groomingOf(sim)).toBeLessThan(100);
  });

  it('will not cut your hair down the telephone', () => {
    const sim = inTown('remote');
    const place = salonsIn(sim)[0]!;
    sim.player.currentPlaceId = undefined;
    const res = sim.execute({
      kind: 'errand.haircut', payload: { placeId: place.id, service: SALON_SERVICES[0]!.id },
    });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/n[o’]t at/i);
  });
});

describe('the counter', () => {
  it('carries the same things every time you walk into the same branch', () => {
    const sim = inTown('shelf');
    const place = pharmaciesIn(sim)[0]!;
    const first = shelfAt(sim, place).map((one) => one.id);
    const second = shelfAt(sim, place).map((one) => one.id);
    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
    expect(first.length).toBeLessThanOrEqual(COUNTER_GOODS.length);
  });

  it('prices a thing higher where living is dearer', () => {
    const sim = inTown('prices');
    const good = COUNTER_GOODS[0]!;
    const london = pharmaciesIn(sim, LONDON)[0]!;
    const cheaper = pharmaciesIn(sim, 'in-mh-mumbai')[0];
    expect(counterPrice(london, good.id)).toBeGreaterThan(0);
    if (cheaper && costOfLiving('in-mh-mumbai') < costOfLiving(LONDON)) {
      expect(counterPrice(cheaper, good.id)).toBeLessThan(counterPrice(london, good.id));
    }
  });

  it('charges for what you picked up and puts time on the clock', () => {
    const sim = inTown('buy');
    const place = standIn(sim, pharmaciesIn(sim)[0]!);
    const good = shelfAt(sim, place)[0]!;
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const at = sim.now;
    const res = sim.execute<{ paid: number; bought: number; note: string }>({
      kind: 'errand.buy', payload: { placeId: place.id, items: [{ id: good.id, quantity: 2 }] },
    });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.bought).toBe(2);
    expect(res.value!.paid).toBe(counterPrice(place, good.id) * 2);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before - res.value!.paid);
    expect(sim.now).toBeGreaterThan(at);
  });

  it('will not sell you what it does not have on the shelf', () => {
    const sim = inTown('outof');
    const place = standIn(sim, pharmaciesIn(sim).find(
      (one) => shelfAt(sim, one).length < COUNTER_GOODS.length,
    ) ?? pharmaciesIn(sim)[0]!);
    const stocked = new Set(shelfAt(sim, place).map((one) => one.id));
    const missing = COUNTER_GOODS.find((one) => !stocked.has(one.id));
    if (!missing) return;
    const res = sim.execute({
      kind: 'errand.buy', payload: { placeId: place.id, items: [{ id: missing.id }] },
    });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/out of/i);
  });

  it('refuses an empty basket rather than charging nothing', () => {
    const sim = inTown('empty');
    const place = standIn(sim, pharmaciesIn(sim)[0]!);
    const res = sim.execute({ kind: 'errand.buy', payload: { placeId: place.id, items: [] } });
    expect(res.ok).toBe(false);
  });

  it('names things on a shelf and never a dose or a claim', () => {
    for (const good of COUNTER_GOODS) {
      expect(good.name).not.toMatch(/\b\d+\s?(mg|ml|mcg|iu)\b/i);
      expect(good.name).not.toMatch(/\b(cures?|treats?|prevents?)\b/i);
    }
  });
});

describe('the parcel', () => {
  it('charges more for heavier, and more again for further', () => {
    const sim = inTown('postage');
    const post = postOfficesIn(sim)[0]!;
    const light = postagePrice(post, 'tracked', 500, 'uk-eng-manchester');
    const heavy = postagePrice(post, 'tracked', 5_000, 'uk-eng-manchester');
    expect(heavy).toBeGreaterThan(light);
    const abroad = postagePrice(post, 'tracked', 500, 'jp-13-tokyo');
    expect(abroad).toBeGreaterThan(light);
  });

  it('takes it over the counter, charges the postage and puts it on its way', () => {
    const sim = inTown('send');
    const post = standIn(sim, postOfficesIn(sim)[0]!);
    const paid = postagePrice(post, 'tracked', 1_200, 'jp-13-tokyo');
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const res = sim.execute<{ parcelId: Id; paid: number; dueAt: number; operator: string }>({
      kind: 'errand.post',
      payload: { placeId: post.id, service: 'tracked', grams: 1_200, toCityId: 'jp-13-tokyo', contents: 'A script' },
    });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.paid).toBe(paid);
    expect(res.value!.operator).toBe(operatorAt(post));
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before - paid);

    const parcel = sim.universe.parcels[res.value!.parcelId]!;
    expect(parcel.status).toBe('in_transit');
    expect(parcel.saveId).toBe(sim.universe.meta.id);
    expect(parcel.dueAt).toBeGreaterThan(sim.now);
    expect(inTransit(sim).map((one) => one.id)).toContain(parcel.id);
    expect(describeParcel(sim, parcel)).toMatch(/on its way/i);
  });

  it('refuses a parcel with nothing in it, one too heavy, and one going nowhere', () => {
    const sim = inTown('refuse');
    const post = standIn(sim, postOfficesIn(sim)[0]!);
    const base = { placeId: post.id, service: 'tracked', toCityId: 'jp-13-tokyo' };
    expect(sim.execute({ kind: 'errand.post', payload: { ...base, grams: 0 } }).ok).toBe(false);
    expect(sim.execute({ kind: 'errand.post', payload: { ...base, grams: MAX_PARCEL_GRAMS + 1 } }).ok).toBe(false);
    expect(sim.execute({
      kind: 'errand.post', payload: { ...base, grams: 500, toCityId: post.cityId },
    }).ok).toBe(false);
  });

  it('arrives, or is late, or is gone, and only ever once', () => {
    let delivered = 0;
    let delayed = 0;
    let lost = 0;
    for (let i = 0; i < 40; i++) {
      const sim = inTown(`transit-${i}`);
      const post = standIn(sim, postOfficesIn(sim)[0]!);
      const res = sim.execute<{ parcelId: Id }>({
        kind: 'errand.post',
        payload: { placeId: post.id, service: 'tracked', grams: 900, toCityId: 'jp-13-tokyo', contents: 'A parcel' },
      });
      expect(res.ok, res.error).toBe(true);
      const id = res.value!.parcelId;
      deliver(sim, id);
      let parcel = sim.universe.parcels[id]!;
      if (parcel.status === 'delayed') {
        delayed += 1;
        deliver(sim, id);
        parcel = sim.universe.parcels[id]!;
      }
      expect(['delivered', 'lost']).toContain(parcel.status);
      if (parcel.status === 'delivered') {
        delivered += 1;
        // Running the world on past it must not deliver it a second time.
        const arrivedAt = parcel.arrivedAt;
        sim.advanceTo(sim.now + 30 * MS_DAY);
        expect(sim.universe.parcels[id]!.arrivedAt).toBe(arrivedAt);
        expect(sim.universe.parcels[id]!.status).toBe('delivered');
      } else {
        lost += 1;
      }
    }
    expect(delivered).toBeGreaterThan(0);
    expect(delayed + lost).toBeGreaterThan(0);
  });

  it('tells you nothing about an untracked parcel that it could not know', () => {
    const sim = inTown('untracked');
    const post = standIn(sim, postOfficesIn(sim)[0]!);
    const res = sim.execute<{ parcelId: Id }>({
      kind: 'errand.post',
      payload: { placeId: post.id, service: 'standard', grams: 600, toCityId: 'jp-13-tokyo', contents: 'A letter' },
    });
    expect(res.ok, res.error).toBe(true);
    const parcel = sim.universe.parcels[res.value!.parcelId]!;
    expect(parcel.tracked).toBe(false);
    expect(describeParcel(sim, parcel)).toMatch(/Nobody can tell you where it is/);
  });

  it('charges more for a service that promises more', () => {
    const sim = inTown('services');
    const post = postOfficesIn(sim)[0]!;
    const standard = postagePrice(post, 'standard', 1_000, 'jp-13-tokyo');
    const express = postagePrice(post, 'express', 1_000, 'jp-13-tokyo');
    expect(express).toBeGreaterThan(standard);
  });
});

describe('the service wash', () => {
  it('takes the clothes away until tomorrow, and costs more than doing it yourself', () => {
    const sim = inTown('wash');
    const place = standIn(sim, launderettesIn(sim)[0]!);
    const shirt = own(sim, 'c_uniqlo_supima');
    shirt.wardrobe!.cleanliness = 20;
    sim.player.wearing = [shirt.id];

    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const res = sim.execute<{ paid: number; pieces: number; readyAt: number }>({
      kind: 'errand.service_wash', payload: { placeId: place.id },
    });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.pieces).toBeGreaterThan(0);
    expect(res.value!.paid).toBeGreaterThan(LAUNDERETTE_LOAD);
    expect(SERVICE_WASH_SHARE).toBeGreaterThan(1);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before - res.value!.paid);

    expect(shirt.wardrobe!.cleanliness).toBe(100);
    expect(shirt.wardrobe!.awayUntil).toBe(res.value!.readyAt);
    expect(res.value!.readyAt).toBeGreaterThan(sim.now);
    expect(sim.player.wearing ?? []).not.toContain(shirt.id);
  });

  it('will not take a wash when nothing you own is dirty', () => {
    const sim = inTown('clean');
    const place = standIn(sim, launderettesIn(sim)[0]!);
    for (const asset of garmentsOf(sim, sim.player.id)) {
      if (asset.wardrobe) asset.wardrobe.cleanliness = 100;
    }
    const res = sim.execute({ kind: 'errand.service_wash', payload: { placeId: place.id } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/needs washing/i);
  });
});

describe('what the save carries', () => {
  it('keeps one player’s parcels out of another player’s post', () => {
    const one = inTown('mine');
    const post = standIn(one, postOfficesIn(one)[0]!);
    one.execute({
      kind: 'errand.post',
      payload: { placeId: post.id, service: 'tracked', grams: 700, toCityId: 'jp-13-tokyo', contents: 'A parcel' },
    });
    expect(parcelsOf(one).length).toBe(1);

    const other = inTown('theirs');
    expect(parcelsOf(other).length).toBe(0);
    expect(Object.keys(other.universe.parcels).length).toBe(0);

    const stray: Parcel = { ...parcelsOf(one)[0]!, personId: 'somebody-else' as Id };
    one.universe.parcels[`${stray.id}-stray` as Id] = { ...stray, id: `${stray.id}-stray` as Id };
    expect(parcelsOf(one).length).toBe(1);
  });
});
