/**
 * A green card and a second citizenship (`systems/residence.ts`,
 * `systems/citizenship.ts`, from 2026-09-30): EB-1A on the O-1's record,
 * timed by the I-140, the I-485 and the Visa Bulletin by country of birth;
 * federal Medicaid's status test from October 2026; and naturalizing in
 * Britain, Mexico and the United States, the citizenship of birth kept.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { careerOf } from '@/engine/systems/career';
import { citizenOf, citizenshipsOf, documentsOf } from '@/engine/systems/documents';
import { medicaidStatus, programFor } from '@/engine/systems/health';
import { workRefusal } from '@/engine/systems/permission';
import { GREEN_CARD, greenCardDays, residenceIn, routeRefusal } from '@/engine/systems/residence';
import { NATURALIZE, naturalizeRefusal } from '@/engine/systems/citizenship';
import { creditRefusal } from '@/engine/systems/universalcredit';

const YEAR = 365.2425 * MS_DAY;
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const record = (sim: Simulation) => { careerOf(sim.player).credits.push(...['broadway', 'lort-b', 'guest-hour'].map((roleId) => ({ roleId, year: 2030, cityId: 'us-ny-newyork' as const }))); };
/** Born in a town, living in New York. */
const bornIn = (born: string, seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: born, wealth: 'wealthy' }, seed);
const age = (sim: Simulation, route: string, years: number) => { for (const d of documentsOf(sim.player)) if (d.route === route && d.issuedAt !== undefined) d.issuedAt -= years * YEAR; };

describe('a green card', () => {
  it('is petitioned for on the O-1’s record from New York, and decided after the I-485’s 8.6 months with premium processing', () => {
    const sim = bornIn('mx-cmx-mexicocity', 'gc-mx');
    expect(routeRefusal(sim, sim.player, 'US')).toMatch(/three kinds/);
    const abroad = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity', livesWhereBorn: true }, 'gc-abroad');
    record(abroad);
    expect(routeRefusal(abroad, abroad.player, 'US')).toMatch(/inside the United States/);
    record(sim);
    expect(routeRefusal(sim, sim.player, 'US')).toBeUndefined();
    expect(workRefusal(sim.player, 'us-ny-newyork', sim.now + 400 * MS_DAY, sim.now + 401 * MS_DAY)).toBeDefined();
    const r = sim.execute<{ paid: number }>({ kind: 'documents.residence', payload: { country: 'US', premium: true } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(inSave(sim, (715 + 300 + 1_440 + 2_965) * 100, 'USD'));
    expect(routeRefusal(sim, sim.player, 'US')).toMatch(/being decided/);
    sim.advanceBy(Math.ceil(GREEN_CARD.i485Days) * MS_DAY + MS_DAY);
    expect(residenceIn(sim.player, 'US', sim.now)?.route).toBe('us-green-card');
    // It lets them work without an O-1.
    expect(workRefusal(sim.player, 'us-ny-newyork', sim.now + 400 * MS_DAY, sim.now + 401 * MS_DAY)).toBeUndefined();
  });

  it('takes the I-140’s 31 months without premium, and adds India’s years behind on the Visa Bulletin', () => {
    const mx = bornIn('mx-cmx-mexicocity', 'gc-days-mx');
    expect(greenCardDays(mx.player, false)).toBeCloseTo(31 * 30.44, 6);
    expect(greenCardDays(mx.player, true)).toBeCloseTo(8.6 * 30.44, 6);
    const india = bornIn('in-16-mumbai', 'gc-days-in');
    expect(greenCardDays(india.player, true)).toBeCloseTo((Date.UTC(2026, 9, 1) - Date.UTC(2023, 1, 1)) / MS_DAY + 8.6 * 30.44, 6);
  });
});

describe('federal Medicaid from October 2026', () => {
  it('is a citizen’s, or a green card holder’s after five years; not an O-1’s', () => {
    const us = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'medicaid-us');
    const after = Date.UTC(2026, 9, 2);
    expect(medicaidStatus(us.player, after)).toBe(true);
    const mx = bornIn('mx-cmx-mexicocity', 'medicaid-mx');
    expect(medicaidStatus(mx.player, Date.UTC(2026, 8, 1))).toBe(true);
    expect(medicaidStatus(mx.player, after)).toBe(false);
    // With no income last month: Medicaid for the citizen; New York's Essential Plan's band for the O-1's holder.
    expect(programFor(us.player, after)?.kind).toBe('medicaid');
    expect(programFor(mx.player, after)?.kind).toBe('essential');
    record(mx);
    mx.execute({ kind: 'documents.residence', payload: { country: 'US', premium: true } });
    mx.advanceBy(Math.ceil(GREEN_CARD.i485Days) * MS_DAY + MS_DAY);
    const later = Math.max(mx.now, after);
    expect(medicaidStatus(mx.player, later)).toBe(false);
    age(mx, 'us-green-card', 5);
    expect(medicaidStatus(mx.player, later)).toBe(true);
  });
});

describe('naturalizing', () => {
  it('makes an American British after a year settled and five years’ residence, the American citizenship kept, and opens Universal Credit when settled', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'nat-gb');
    record(sim);
    expect(naturalizeRefusal(sim, sim.player, 'GB')).toMatch(/residence there first/);
    expect(sim.execute({ kind: 'documents.residence', payload: { country: 'GB' } }).ok).toBe(true);
    age(sim, 'global-talent', 5);
    sim.player.home = { kind: 'shared', cityId: 'uk-eng-london', since: sim.now };
    sim.player.currentLocationId = 'uk-eng-london';
    expect(creditRefusal(sim, sim.player)).toMatch(/no recourse to public funds/);
    const earned = sim.player.earnings ?? (sim.player.earnings = { years: {}, quarters: {}, equityWeeks: [], months: {}, ukYears: {} } as never);
    (earned as { years: Record<string, { bySource?: Record<string, number> }> }).years[2031] = { ...(earned as { years: Record<string, object> }).years[2031], bySource: { uk: 10_000_00 } } as never;
    expect(sim.execute({ kind: 'documents.settle', payload: { country: 'GB' } }).ok).toBe(true);
    expect(creditRefusal(sim, sim.player) ?? '').not.toMatch(/no recourse/);
    expect(naturalizeRefusal(sim, sim.player, 'GB')).toMatch(/twelve months settled/);
    age(sim, 'uk-settled', 1);
    expect(naturalizeRefusal(sim, sim.player, 'GB')).toBeUndefined();
    const r = sim.execute<{ paid: number }>({ kind: 'documents.naturalize', payload: { country: 'GB' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(inSave(sim, (1_839 + 50) * 100, 'GBP'));
    expect(naturalizeRefusal(sim, sim.player, 'GB')).toMatch(/being decided/);
    sim.advanceBy((NATURALIZE.GB.days + 1) * MS_DAY);
    expect(citizenOf(sim.player, 'GB')).toBe(true);
    expect(citizenshipsOf(sim.player)).toEqual(['US', 'GB']);
  });

  it('makes a foreigner Mexican after five years’ residence, or two on outstanding artistic work', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'nat-mx');
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 2_000_000_00, 'MXN');
    expect(sim.execute({ kind: 'documents.residence', payload: { country: 'MX' } }).ok).toBe(true);
    age(sim, 'mx-temporary', 2);
    for (const d of documentsOf(sim.player)) if (d.route === 'mx-temporary') d.expiresAt = sim.now + YEAR;
    expect(naturalizeRefusal(sim, sim.player, 'MX')).toMatch(/five years’ residence/);
    record(sim);
    expect(naturalizeRefusal(sim, sim.player, 'MX')).toBeUndefined();
    expect(sim.execute({ kind: 'documents.naturalize', payload: { country: 'MX' } }).ok).toBe(true);
    sim.advanceBy((NATURALIZE.MX.days + 1) * MS_DAY);
    expect(citizenOf(sim.player, 'MX')).toBe(true);
    expect(citizenOf(sim.player, 'US')).toBe(true);
  });

  it('makes a green card holder American after five years', () => {
    const sim = bornIn('mx-cmx-mexicocity', 'nat-us');
    record(sim);
    sim.execute({ kind: 'documents.residence', payload: { country: 'US', premium: true } });
    sim.advanceBy(Math.ceil(GREEN_CARD.i485Days) * MS_DAY + MS_DAY);
    expect(naturalizeRefusal(sim, sim.player, 'US')).toMatch(/five years/);
    age(sim, 'us-green-card', 5);
    expect(sim.execute<{ paid: number }>({ kind: 'documents.naturalize', payload: { country: 'US' } }).value!.paid).toBe(inSave(sim, 760_00, 'USD'));
    sim.advanceBy((NATURALIZE.US.days + 1) * MS_DAY);
    expect(citizenOf(sim.player, 'US')).toBe(true);
    expect(naturalizeRefusal(sim, sim.player, 'CA')).toMatch(/Britain, Mexico and the United States/);
  });
});
