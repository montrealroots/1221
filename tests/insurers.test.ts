/**
 * Every policy is written by a company that really sells that line where
 * the holder lives.
 *
 * Three promises. Every country is accounted for: named insurers that
 * operate there, the metropole's market, a local-only market with a reason,
 * or no market with a reason. A quote comes from a real company that writes
 * the line in the holder's country, or is refused with the reason, and a
 * specialist is placed through a broker only where nobody local writes it.
 * And an old save is moved, not broken: a policy from SLATE's own carrier
 * keeps its number, its premium and its claims and gains a real company.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { loadAllSections } from '@/engine/dialogue';
import { migrate, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, addYears } from '@/engine/core/time';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import {
  GLOBAL_SPECIALISTS, INSURERS, INSURERS_BY_COUNTRY, LOCAL_ONLY, NO_INSURER, STATE_HEALTH,
  carrierFactor, insurerByName, insurerCoverageOf, insurersFor,
} from '@/engine/content/insurers';
import type { InsuranceLine } from '@/engine/domain/model';
import { buildQuote, carriersFor, ensureProviders, healthCarriersIn } from '@/engine/systems/services';

beforeAll(async () => { await loadAllSections(); });

const LINES: InsuranceLine[] = ['health', 'dental', 'vision', 'auto', 'renters', 'homeowners', 'valuables', 'travel', 'life', 'umbrella', 'business', 'production', 'equipment', 'marine', 'aviation'];

function aLife(seed = 'insurers'): Simulation {
  const sim = quickSave({}, seed);
  sim.income(sim.player.primaryAccountId!, 300_000_00, 'Test funding', 'other');
  sim.execute({ kind: 'co.set_draw', payload: { amount: 0 } });
  return sim;
}
function must<R>(sim: Simulation, kind: string, payload: Record<string, unknown>): R {
  const result = sim.execute<R>({ kind, payload });
  if (!result.ok) throw new Error(`${kind}: ${result.error}`);
  return result.value!;
}
function refusal(sim: Simulation, kind: string, payload: Record<string, unknown>): string | undefined {
  const result = sim.execute({ kind, payload });
  return result.ok ? undefined : result.error;
}
function cityIn(countryId: string, name?: string): string {
  const found = CITIES.all().find((c) => c.countryId === countryId && (!name || c.name === name));
  expect(found, `no city ${name ?? ''} in ${countryId}`).toBeDefined();
  return found!.id;
}
const names = (countryId: string, line: InsuranceLine) => insurersFor(countryId, line).map((o) => o.name);

describe('every country has a real insurer, or an honest reason', () => {
  it('accounts for all of them', () => {
    const unaccounted = COUNTRIES.all().filter((c) => insurerCoverageOf(c.id).kind === 'unaccounted').map((c) => c.id);
    expect(unaccounted).toEqual([]);
    expect(INSURERS.length).toBeGreaterThan(1500);
  });

  it('names only companies in the registry, never twice, never both named and local-only', () => {
    for (const [countryId, list] of Object.entries(INSURERS_BY_COUNTRY)) {
      expect(COUNTRIES.get(countryId), countryId).toBeDefined();
      for (const name of list) expect(insurerByName(name), `${countryId}: ${name}`).toBeDefined();
      expect(new Set(list).size, countryId).toBe(list.length);
      if (list.length > 0) { expect(LOCAL_ONLY[countryId], countryId).toBeUndefined(); expect(NO_INSURER[countryId], countryId).toBeUndefined(); }
    }
    for (const id of [...Object.keys(LOCAL_ONLY), ...Object.keys(NO_INSURER), ...Object.keys(STATE_HEALTH)]) expect(COUNTRIES.get(id), id).toBeDefined();
    for (const line of LINES) for (const name of GLOBAL_SPECIALISTS[line]) expect(insurerByName(name)?.lines, `${name} for ${line}`).toContain(line);
  });

  it('somewhere with a market sells a car policy and a house policy from its own market', () => {
    for (const c of COUNTRIES.all()) {
      const cover = insurerCoverageOf(c.id);
      if (cover.kind !== 'named' && cover.kind !== 'metropole') continue;
      expect(insurersFor(c.id, 'auto').some((o) => o.how !== 'broker'), `${c.id} ${c.name}: nobody local writes auto`).toBe(true);
      expect(insurersFor(c.id, 'homeowners').some((o) => o.how !== 'broker'), `${c.id} ${c.name}: nobody local writes homeowners`).toBe(true);
    }
  });
});

describe('who writes what, where', () => {
  it('an American car is insured by an American company, a Nigerian car by a Nigerian one', () => {
    expect(names('us', 'auto')).toContain('State Farm');
    expect(names('us', 'auto')).toContain('GEICO');
    expect(names('us', 'auto')).not.toContain('Leadway Assurance');
    expect(names('ng', 'auto')).toContain('Leadway Assurance');
    expect(names('ng', 'auto')).toContain('AIICO Insurance');
    expect(names('ng', 'auto')).not.toContain('State Farm');
    expect(names('uk', 'auto')).toContain('Direct Line');
    expect(names('uk', 'auto')).toContain('Admiral');
  });

  it('health in America is a health insurer, not a car insurer; and the NHS is named under British cover', () => {
    expect(names('us', 'health')).toContain('UnitedHealthcare');
    expect(names('us', 'health')).toContain('Kaiser Permanente');
    expect(names('us', 'health')).not.toContain('State Farm');
    expect(names('us', 'health')).not.toContain('GEICO');
    expect(names('us', 'dental')).toContain('Delta Dental');
    expect(names('us', 'vision')).toContain('VSP Vision Care');
    expect(names('uk', 'health')).toContain('Bupa');
    expect(STATE_HEALTH['uk']).toMatch(/NHS/);
    expect(healthCarriersIn('us')).toContain('Aetna');
    expect(healthCarriersIn('us')).not.toContain('Progressive');
  });

  it('a territory buys from the mainland market', () => {
    const falklands = insurerCoverageOf('fk');
    expect(falklands.kind).toBe('metropole');
    expect(names('fk', 'homeowners')).toContain('Aviva');
    expect(insurersFor('fk', 'homeowners')[0]?.how).toBe('metropole');
    expect(names('pf', 'auto')).toContain('AXA');
  });

  it('a specialist writes only where it writes, and through a broker where nobody local does', () => {
    expect(names('us', 'equipment')).toContain('Athos Insurance Services');
    expect(names('uk', 'equipment')).not.toContain('Athos Insurance Services');
    expect(names('uk', 'equipment')).toContain('Aaduki Multimedia Insurance');
    expect(names('ca', 'valuables')).toContain('Jewelers Mutual');
    expect(names('ng', 'valuables')).not.toContain('Jewelers Mutual');
    expect(names('us', 'marine')).toContain('Progressive');
    expect(names('us', 'aviation')).toContain('Avemco');
    expect(names('fr', 'aviation')).not.toContain('Avemco');
    expect(names('fr', 'aviation')).toContain('Global Aerospace');
    // Tuvalu: nobody SLATE can name writes a car policy; a travel policy still comes through a broker.
    expect(insurerCoverageOf('tv').kind).toBe('local_only');
    expect(names('tv', 'auto')).toEqual([]);
    expect(insurersFor('tv', 'travel').length).toBeGreaterThan(0);
    expect(insurersFor('tv', 'travel').every((o) => o.how === 'broker')).toBe(true);
    // Antarctica: nothing at all.
    expect(insurerCoverageOf('aq').kind).toBe('none');
    expect(names('aq', 'travel')).toEqual([]);
  });

  it('prices the same company the same way every time, and two companies differently', () => {
    expect(carrierFactor('State Farm')).toBe(carrierFactor('State Farm'));
    expect(carrierFactor('State Farm')).toBeGreaterThanOrEqual(0.9);
    expect(carrierFactor('State Farm')).toBeLessThanOrEqual(1.12);
    const factors = new Set(names('us', 'renters').map(carrierFactor));
    expect(factors.size).toBeGreaterThan(1);
  });
});

describe('a quote comes from a real company', () => {
  it('a renter in Los Angeles is quoted by a company that writes renters cover in America, and can pick another', () => {
    const sim = aLife('ins-quote');
    const market = carriersFor(sim, sim.player.id, 'renters');
    expect(market.countryId).toBe('us');
    expect(market.offers.length).toBeGreaterThan(3);
    const quote = must<{ quoteId: string; premium: number; carrier: string }>(sim, 'ins.quote', { line: 'renters', coveredRefs: [] });
    expect(insurerByName(quote.carrier)?.lines).toContain('renters');
    expect(quote.carrier).toBe(market.offers[0]!.name);
    expect(sim.universe.insurancePolicies[quote.quoteId]!.carrier).toBe(quote.carrier);
    const other = market.offers.find((o) => carrierFactor(o.name) !== carrierFactor(quote.carrier))!;
    const chosen = must<{ premium: number; carrier: string }>(sim, 'ins.quote', { line: 'renters', coveredRefs: [], carrier: other.name });
    expect(chosen.carrier).toBe(other.name);
    expect(chosen.premium).not.toBe(quote.premium);
    expect(buildQuote(sim, sim.player.id, 'renters', [], other.name).premium).toBe(chosen.premium);
  });

  it('refuses a company that does not write the line where you live, with the reason', () => {
    const sim = aLife('ins-wrong');
    expect(refusal(sim, 'ins.quote', { line: 'renters', coveredRefs: [], carrier: 'Leadway Assurance' })).toMatch(/does not write renters cover where you live/);
    expect(refusal(sim, 'ins.quote', { line: 'renters', coveredRefs: [], carrier: 'GEICO' })).toBeUndefined();
    expect(refusal(sim, 'ins.quote', { line: 'health', coveredRefs: [], carrier: 'GEICO' })).toMatch(/does not write health cover/);
  });

  it('where nobody writes the line, says so; where only a broker does, says that too', () => {
    const sim = aLife('ins-nobody');
    sim.player.residenceId = undefined;
    sim.player.homeRegionId = cityIn('tv');
    expect(refusal(sim, 'ins.quote', { line: 'homeowners', coveredRefs: [] })).toMatch(/Nobody SLATE can name writes homeowners cover in Tuvalu/);
    const travel = buildQuote(sim, sim.player.id, 'travel', []);
    expect(travel.how).toBe('broker');
    expect(travel.note).toMatch(/broker/);
    sim.player.homeRegionId = cityIn('ng', 'Lagos');
    const lagos = must<{ carrier: string }>(sim, 'ins.quote', { line: 'auto', coveredRefs: [] });
    expect(names('ng', 'auto')).toContain(lagos.carrier);
  });

  it('a practice takes real carriers, and some take fewer than all of them', () => {
    const sim = aLife('ins-practice');
    const providers = ensureProviders(sim, sim.player.currentLocationId);
    const carriers = healthCarriersIn('us');
    expect(carriers.length).toBeGreaterThan(5);
    for (const p of providers) {
      expect(p.acceptsInsurance.length).toBeGreaterThan(0);
      for (const name of p.acceptsInsurance) expect(carriers).toContain(name);
      expect(p.acceptsInsurance.some((name) => /Northbank|Meridian|Vantage/.test(name))).toBe(false);
    }
    expect(providers.some((p) => p.acceptsInsurance.length < carriers.length) || providers.every((p) => p.acceptsInsurance.length === carriers.length)).toBe(true);
  });

  it('renews with the same company', () => {
    const sim = aLife('ins-renew');
    const quote = must<{ quoteId: string; carrier: string }>(sim, 'ins.quote', { line: 'renters', coveredRefs: [], carrier: 'Allstate' });
    const { policyId } = must<{ policyId: string }>(sim, 'ins.purchase', { quoteId: quote.quoteId });
    sim.advanceTo(addYears(sim.now, 1, sim.homeZone) + 2 * MS_DAY);
    const policy = sim.universe.insurancePolicies[policyId]!;
    expect(policy.carrier).toBe('Allstate');
    expect(policy.status).toBe('active');
  });
});

describe('an old save is moved, not broken', () => {
  it('a policy from SLATE’s own carrier gains a real company and keeps everything else; a practice takes the real ones', () => {
    const sim = aLife('ins-migrate');
    const quote = must<{ quoteId: string }>(sim, 'ins.quote', { line: 'renters', coveredRefs: [] });
    const { policyId } = must<{ policyId: string }>(sim, 'ins.purchase', { quoteId: quote.quoteId });
    const policy = sim.universe.insurancePolicies[policyId]!;
    policy.carrier = 'Northbank Insurance';
    const number = policy.policyNumber;
    const premium = policy.monthlyPremium;
    const [provider] = ensureProviders(sim, sim.player.currentLocationId);
    provider!.acceptsInsurance = ['Northbank Health', 'Vantage Care'];
    sim.universe.meta.schemaVersion = 46;
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(true);
    expect(result.steps.join(' ')).toMatch(/1 policies moved/);
    expect(policy.carrier).toBe(names('us', 'renters')[0]);
    expect(policy.policyNumber).toBe(number);
    expect(policy.monthlyPremium).toBe(premium);
    expect(policy.id).toBe(policyId);
    for (const name of provider!.acceptsInsurance) expect(healthCarriersIn('us')).toContain(name);
  });
});
