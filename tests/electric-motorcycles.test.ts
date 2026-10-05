/**
 * Electric motorcycles and scooters (`tools/build-motorcycles.mjs`,
 * `EV_BIKE_UNKEPT` and the electric rules in `systems/vehicles.ts`, from
 * 2026-10-05): sold where their use was read, charged by their kWh, taxed in
 * Britain at the 150cc band's rate, no tenencia in Mexico City, insured as a
 * moped at 4 kW or less, and not sold where what taxes or insures one wasn't
 * read.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MOTO_MODELS, MOTO_TANKS } from '@/engine/content/motocatalog';
import { BIKE_INSURANCE, BIKE_FEES } from '@/engine/content/vehiclefees';
import { EV_BIKE_UNKEPT, EV_MOPED_KW, buyRefusal, modelById, monthlyInsurance, quote, renewal, type OwnedVehicle, type Quote } from '@/engine/systems/vehicles';
import { capacityOf, burnOf } from '@/engine/systems/fueltank';

const at = Date.UTC(2026, 9, 1);
const held = (id: string, j: string) => ({ id: 'owned', modelId: id, jurisdiction: j, cityId: '', boughtAt: at, ageAtPurchase: 0, listPrice: modelById(id)!.price, coverage: 'full', registrationDue: 0 }) as OwnedVehicle;
const evs = MOTO_MODELS.filter((m) => m.fuel === 'ev');

describe('an electric motorcycle', () => {
  it('is sold only with what it uses read, and charged from its battery by it', () => {
    expect(evs.length).toBeGreaterThan(20);
    expect(evs.every((m) => m.kwhPer100km! > 0 && /maker’s figure/.test(m.economyBasis))).toBe(true);
    const m = evs.find((x) => MOTO_TANKS[x.id]?.batteryKwh)!;
    expect(capacityOf(m)).toEqual({ size: MOTO_TANKS[m.id]!.batteryKwh, unit: 'kWh', estimated: false });
    expect(burnOf(m, 100)).toBeCloseTo(m.kwhPer100km!, 9);
  });

  it('is taxed in Britain at the 150cc band’s rate whatever its power', () => {
    const big = evs.find((x) => x.market === 'GB' && (x.kw ?? 0) > 30)!;
    const r = renewal(held(big.id, 'GB'), at);
    expect(r.amount).toBe(BIKE_FEES.GB.ved[0]![1] * 100);
    expect(r.memo).toBe('Vehicle tax, the year, a zero-emission motorcycle');
  });

  it('pays no tenencia in Mexico City, where a petrol one of its price would', () => {
    const ce04 = modelById('mx-bmw-motorrad-ce-04')!;
    const q = quote(ce04, 'mx-cmx-mexicocity', at) as Quote;
    expect(q.lines.find((l) => l.label === 'Tenencia, The Year')!.amount).toBe(0);
    const petrol = MOTO_MODELS.find((x) => x.market === 'MX' && x.fuel === 'petrol' && x.price / 100 > BIKE_FEES.CMX.subsidizedTo)!;
    expect((quote(petrol, 'mx-cmx-mexicocity', at) as Quote).lines.find((l) => l.label === 'Tenencia, The Year')!.amount).toBeGreaterThan(0);
  });

  it('is insured as a moped in Britain at 4 kW or less, and as a scooter above', () => {
    const moped = evs.find((x) => x.market === 'GB' && x.kind === 'scooter' && x.kw !== undefined && x.kw <= EV_MOPED_KW)!;
    const scooter = evs.find((x) => x.market === 'GB' && x.kind === 'scooter' && (x.kw ?? 0) > EV_MOPED_KW)!;
    expect(monthlyInsurance('GB', 'full', moped)).toBe(Math.round((BIKE_INSURANCE.GB.moped! * 100) / 12));
    expect(monthlyInsurance('GB', 'full', scooter)).toBe(Math.round((BIKE_INSURANCE.GB.scooter! * 100) / 12));
    // At the 4 kW itself, a moped.
    expect(monthlyInsurance('GB', 'full', { ...scooter, kw: EV_MOPED_KW })).toBe(Math.round((BIKE_INSURANCE.GB.moped! * 100) / 12));
  });

  it('isn’t sold in Ireland or British Columbia, whose rules for one weren’t read', () => {
    const ie = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'wealthy' }, 'ev-ie');
    expect(buyRefusal(ie, ie.player, evs.find((x) => x.market === 'GB')!.id, {})).toBe(EV_BIKE_UNKEPT.IE);
    const bc = quickSave({ startLocationId: 'ca-bc-vancouver', homeRegionId: 'ca-bc-vancouver', livesWhereBorn: true, wealth: 'wealthy' }, 'ev-bc');
    expect(buyRefusal(bc, bc.player, 'ca-niu-nqi-sport', {})).toBe(EV_BIKE_UNKEPT['CA-BC']);
  });
});
