/**
 * Owning a car (`systems/vehicles.ts`, docs/WORLD.md stage 3, from
 * 2026-09-29): each jurisdiction's quote to the cent, buying outright and
 * financed, the months after, a renewal, and selling.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { documentsOf } from '@/engine/systems/documents';
import { amortized, kept, modelById, modelsFor, monthKm, parkingYear, quote, runningCost, valueOf, vehiclesOf, type Quote } from '@/engine/systems/vehicles';

const q = (id: string, city: string, opts = {}) => quote(modelById(id)!, city, Date.UTC(2026, 8, 29), opts) as Quote;
const line = (x: Quote, re: RegExp) => x.lines.find((l) => new RegExp(re.source, 'i').test(l.label))!.amount;

describe('what a car costs to buy', () => {
  it('taxes a Honda CR-V in New York City at 8.875% on its price and destination, with title, plates and two years’ registration by weight', () => {
    const x = q('us-honda-cr-v', 'us-ny-newyork');
    expect(x.price).toBe(3_152_000 + 155_000);
    expect(line(x, /Sales tax/)).toBe(Math.round(x.price * 0.08875));
    // 3,472 lb: the 3,451–3,550 band's $56.50, the city's use tax $30 and the MCTD's $50.
    expect(line(x, /Registration/)).toBe(56_50 + 30_00 + 50_00);
    expect(line(x, /Title/)).toBe(50_00);
  });

  it('taxes the whole price at 7.75% in Connecticut over $50,000, and 6.35% under it', () => {
    expect(line(q('us-toyota-camry', 'us-ct-newhaven'), /Sales tax/)).toBe(Math.round(2_960_000 * 0.0635));
    const sierra = q('us-gmc-sierra', 'us-ct-newhaven');
    expect(sierra.price).toBe(4_850_000 + 279_500);
    expect(line(sierra, /Sales tax/)).toBe(Math.round(sierra.price * 0.0775));
  });

  it('charges Los Angeles 9.75%, and 10.25% from 1 October 2026', () => {
    const before = quote(modelById('us-toyota-rav4')!, 'us-ca-losangeles', Date.UTC(2026, 8, 29)) as Quote;
    const after = quote(modelById('us-toyota-rav4')!, 'us-ca-losangeles', Date.UTC(2026, 9, 2)) as Quote;
    expect(line(before, /Sales tax/)).toBe(Math.round(3_190_000 * 0.0975));
    expect(line(after, /Sales tax/)).toBe(Math.round(3_190_000 * 0.1025));
  });

  it('keeps Ireland’s VAT and VRT in the price and adds the motor tax by CO2; Ontario’s 13% HST; British Columbia’s GST and PST; Mexico City’s plates', () => {
    const corolla = q('ie-toyota-corolla', 'ie-lei-dublin');
    expect(corolla.price).toBe(3_322_000 + 100_000);
    expect(line(corolla, /Motor tax/)).toBe(170_00);
    const rogue = q('ca-nissan-rogue', 'ca-on-toronto');
    expect(line(rogue, /HST/)).toBe(Math.round((3_484_800 + 208_000) * 0.13));
    const tucson = q('ca-hyundai-tucson', 'ca-bc-vancouver');
    expect(line(tucson, /GST/)).toBe(Math.round(3_549_900 * 0.05));
    expect(line(tucson, /PST, 7%/)).toBe(Math.round(3_549_900 * 0.07));
    expect(line(q('mx-nissan-versa', 'mx-cmx-mexicocity'), /Plates/)).toBe(972_00);
    // Britain's on-the-road price has it all in, and in London a year's resident permit: Westminster's for 91 to 130 g/km, £126.12.
    expect(q('gb-ford-puma', 'uk-eng-london').total).toBe(2_714_500 + 126_12);
  });

  it('sells the market’s cars where one lives, and refuses a place SLATE doesn’t keep', () => {
    expect(modelsFor('ie-lei-dublin').every((m) => m.market === 'IE')).toBe(true);
    expect(quote(modelById('us-honda-cr-v')!, 'fr-idf-paris', Date.UTC(2026, 8, 29))).toMatch(/doesn’t have that place’s car taxes/);
    expect(quote(modelById('gb-ford-puma')!, 'us-ny-newyork', Date.UTC(2026, 8, 29))).toMatch(/another market/);
  });

  it('keeps iSeeCars’ share of value at three, five, seven and ten years, and prices a used car on it', () => {
    expect(kept(3)).toBeCloseTo(1 - 0.2479, 10);
    expect(kept(5)).toBeCloseTo(1 - 0.417, 10);
    expect(kept(10)).toBeCloseTo(1 - 0.6512, 10);
    expect(kept(4)).toBeCloseTo(1 - (0.2479 + 0.417) / 2, 10);
    expect(q('us-toyota-camry', 'us-ct-newhaven', { age: 5 }).price).toBe(Math.round(2_960_000 * (1 - 0.417)));
  });
});

describe('parking', () => {
  it('charges Westminster’s permit by CO2 in London and Dublin City’s €50, and nothing with a garage at a home owned', () => {
    const puma = modelById('gb-ford-puma')!;
    const street = { homes: [] } as unknown as Parameters<typeof parkingYear>[0];
    expect(parkingYear(street, puma, 'uk-eng-london')).toEqual({ amount: 126_12, currency: 'GBP' });
    expect(parkingYear(street, modelById('gb-mg-hs')!, 'uk-eng-london')!.amount).toBe(230_05);
    expect(parkingYear(street, modelById('ie-toyota-corolla')!, 'ie-lei-dublin')).toEqual({ amount: 50_00, currency: 'EUR' });
    const garaged = { homes: [{ cityId: 'uk-eng-london', facts: { features: ['garage'] } }] } as unknown as Parameters<typeof parkingYear>[0];
    expect(parkingYear(garaged, puma, 'uk-eng-london')).toBeUndefined();
    expect(parkingYear(street, modelById('us-honda-cr-v')!, 'us-ny-newyork')).toBeUndefined();
  });
});

describe('owning one', () => {
  it('costs a month of everyday driving at the place’s pump by the car’s official economy, and upkeep', () => {
    const sim = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'wealthy' }, 'car-run');
    // A license: a car whose owner may not drive sits idle (`systems/driving.ts`).
    documentsOf(sim.player).push({ id: 'lic', kind: 'license', issuer: 'ie', name: 'License', number: 'L1', status: 'valid', issuedAt: sim.now - 3650 * MS_DAY, expiresAt: sim.now + 3650 * MS_DAY });
    expect(sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'ie-skoda-octavia' } }).ok).toBe(true);
    const v = vehiclesOf(sim.player)[0]!;
    // Ireland's 15,196 km a year, a twelfth; 5.3 liters a hundred at €1.87.
    expect(monthKm(v)).toBeCloseTo(15_196 / 12, 6);
    const cur = saveCurrency(sim.universe);
    const eur = (c: number) => (cur === 'EUR' ? c : exchange(c, 'EUR', cur)!);
    const usd = (c: number) => (cur === 'USD' ? c : exchange(c, 'USD', cur)!);
    const km = 1_000;
    expect(runningCost(sim, v, km)).toBe(eur(Math.round((km * 5.3 * 187) / 100)) + usd(Math.round(km * 11.7 / 1.609344)));
    // A diesel at the diesel pump, €1.94: the Sportage, a diesel mild hybrid, 5.1 liters a hundred.
    const sportage = { ...v, modelId: 'ie-kia-sportage' };
    expect(runningCost(sim, sportage, km)).toBe(eur(Math.round((km * 5.1 * 194) / 100)) + usd(Math.round(km * 11.7 / 1.609344)));
    sim.advanceBy(31 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === 'Fuel and upkeep, the Skoda Octavia')).toBe(true);
    expect(v.km).toBeCloseTo(15_196 / 12, 6);
  });

  it('buys a CR-V in New York on a loan at Experian’s rate for the record, pays insurance and the loan each month, and sells it', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'car-ny');
    sim.player.credit = { ...(sim.player.credit ?? {}), score: 720 } as typeof sim.player.credit;
    const r = sim.execute<{ vehicleId: string; paid: number; monthly?: number }>({ kind: 'vehicle.buy', payload: { modelId: 'us-honda-cr-v', financed: true, months: 60 } });
    expect(r.ok, r.error).toBe(true);
    const cur = saveCurrency(sim.universe);
    const usd = (c: number) => (cur === 'USD' ? c : exchange(c, 'USD', cur)!);
    const v = vehiclesOf(sim.player)[0]!;
    // Prime, 661 to 780: 6.15% new.
    expect(v.loan!.apr).toBe(0.0615);
    expect(v.loan!.monthly).toBe(amortized(usd(3_307_000), 0.0615, 60));
    // Down: the taxes and fees; lent: the price.
    expect(r.value!.paid).toBe(usd(q('us-honda-cr-v', 'us-ny-newyork').total - 3_307_000));
    sim.advanceBy(31 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('Car insurance'))).toBe(true);
    expect(sim.universe.transactions.some((t) => t.memo.startsWith('Car loan payment'))).toBe(true);
    expect(v.loan!.owed).toBeLessThan(usd(3_307_000));
    const worth = valueOf(v, sim.now);
    const owed = v.loan!.owed;
    const s = sim.execute<{ value: number }>({ kind: 'vehicle.sell', payload: { vehicleId: v.id } });
    expect(s.ok, s.error).toBe(true);
    // Worth less than the loan a month on, the destination charge and a month's value gone: the rest comes from the bank.
    expect(s.value!.value).toBe(usd(worth) - owed);
    expect(s.value!.value).toBeLessThan(0);
    expect(vehiclesOf(sim.player)[0]!.soldAt).toBeDefined();
  });

  it('renews a British car’s vehicle tax each year at £200, and lends at the Bank of England’s personal loan rate', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'wealthy' }, 'car-gb');
    const r = sim.execute({ kind: 'vehicle.buy', payload: { modelId: 'gb-ford-puma', financed: true } });
    expect(r.ok, r.error).toBe(true);
    const v = vehiclesOf(sim.player)[0]!;
    expect(v.loan!.apr).toBe(0.069);
    sim.advanceTo(v.registrationDue + 60_000);
    const cur = saveCurrency(sim.universe);
    const tax = sim.universe.transactions.find((t) => t.memo === 'Vehicle tax, the year')!;
    expect(tax.postings.find((p) => p.amount > 0)!.amount).toBe(cur === 'GBP' ? 200_00 : exchange(200_00, 'GBP', cur));
  });
});
