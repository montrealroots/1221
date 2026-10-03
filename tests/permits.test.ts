/**
 * The permit or planning a home's works ask (`systems/permits.ts`,
 * docs/WORLD.md stage 5c, from 2026-09-29): each place's fee to the cent,
 * what's exempt, and the work waiting for a decision.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { PROJECTS } from '@/engine/content/homes';
import { ownBuilt, projectCost, type HomeFacts } from '@/engine/systems/homes';
import { worksPermit } from '@/engine/systems/permits';
import { modelById, parkingYear } from '@/engine/systems/vehicles';

const project = (id: string) => PROJECTS.find((p) => p.id === id)!;
const save = (city: string, name: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);
const inSave = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };
const toUsd = (sim: Simulation, c: number) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, cur, 'USD')!; };
const house = (lot = 8_000): HomeFacts => ({ type: 'house', address: 'Test House', beds: 3, baths: 2, size: 1_800, lot, built: 2000, features: [...(['yard', 'attic'] as const)], parts: {}, hoaUsd: 0 });

describe('what a permit costs', () => {
  it('charges New York’s alteration permit, $130 for the first $5,000 and $2.60 a $1,000 more', () => {
    const sim = save('us-ny-newyork', 'permit-ny');
    const cost = 168_000_00;
    const p = worksPermit(sim, 'us-ny-newyork', project('suite'), cost)!;
    const v = toUsd(sim, cost) / 100;
    expect(p.lines).toEqual([{ label: 'Alteration Permit', amount: inSave(sim, Math.round((130 + 2.6 * Math.ceil((v - 5_000) / 1_000)) * 100), 'USD') }]);
    expect(p.waitDays).toBe(0);
  });

  it('charges Los Angeles’s Table 1-A permit, plan check at 90% and the state’s fees on the work', () => {
    const sim = save('us-ca-losangeles', 'permit-la');
    const p = worksPermit(sim, 'us-ca-losangeles', project('bath-add'), inSave(sim, 60_000_00, 'USD'))!;
    // $60,000: $195 and $5.50 a $1,000.
    expect(p.lines[0]!.amount).toBe(inSave(sim, 525_00, 'USD'));
    expect(p.lines[1]!.amount).toBe(inSave(sim, 472_50, 'USD'));
    expect(p.lines[2]!.amount).toBe(inSave(sim, 7_80 + 2_40, 'USD'));
  });

  it('asks London’s prior approval for a suite, a householder application for more, and nothing for a loft', () => {
    const sim = save('uk-eng-london', 'permit-gb');
    // And from 2026-09-30 building control on its 35.7 m², Camden's 10 to 60 m² band with VAT.
    expect(worksPermit(sim, 'uk-eng-london', project('suite'), 100_000_00)).toEqual({ lines: [{ label: 'Prior Approval, A Larger Home Extension', amount: inSave(sim, 249_00, 'GBP') }, { label: 'Building Control', amount: inSave(sim, 1_875_55, 'GBP') }, { label: 'A Structural Engineer’s Report, Read Secondhand', amount: inSave(sim, 850_00, 'GBP') }], waitDays: 42, basis: expect.any(String) });
    const bigger = worksPermit(sim, 'uk-eng-london', project('suite-upscale'), 100_000_00)!;
    expect(bigger.lines[0]!.amount).toBe(inSave(sim, 548_00, 'GBP'));
    expect(bigger.waitDays).toBe(56);
    // From 2026-10-01 a conversion pays building control alone: Havering's £859 for a loft to 30 m² (the attic's 300 sq ft is 27.9),
    // £673 for a garage made a room, and a basement's 600 sq ft (55.7 m²) at the extension band.
    const only = (id: string) => worksPermit(sim, 'uk-eng-london', project(id), 100_000_00)!;
    expect(only('attic')).toEqual({ lines: [{ label: 'Building Control', amount: inSave(sim, 859_00, 'GBP') }], waitDays: 0, basis: expect.any(String) });
    expect(only('garage-room').lines[0]!.amount).toBe(inSave(sim, 673_00, 'GBP'));
    expect(only('basement').lines[0]!.amount).toBe(inSave(sim, 1_875_55, 'GBP'));
    expect(worksPermit(sim, 'uk-eng-london', project('bath-add'), 100_000_00)).toBeUndefined();
  });

  it('exempts a Dublin extension to 40 m², and asks €34 and twelve weeks for more or for a cottage', () => {
    const sim = save('ie-lei-dublin', 'permit-ie');
    // 384 sq ft is 35.7 m².
    expect(worksPermit(sim, 'ie-lei-dublin', project('suite'), 100_000_00)).toBeUndefined();
    const bigger = worksPermit(sim, 'ie-lei-dublin', project('suite-upscale'), 100_000_00)!;
    expect(bigger.lines[0]!.amount).toBe(inSave(sim, 34_00, 'EUR'));
    // And from 2026-09-30 the commencement notice's €30.
    expect(bigger.lines[1]).toEqual({ label: 'Commencement Notice', amount: inSave(sim, 30_00, 'EUR') });
    expect(bigger.waitDays).toBe(84);
    expect(worksPermit(sim, 'ie-lei-dublin', project('adu'), 100_000_00)).toBeDefined();
  });

  it('charges Toronto’s service index on the floor area, Vancouver’s permit on the value and Mexico City’s manifestación on what’s added', () => {
    const sim = save('ca-on-toronto', 'permit-ca');
    const m2 = (id: string) => (project(id).adds?.size ?? 0) / 10.7639104167097;
    const one = (city: string, id: string, cost = 100_000_00) => worksPermit(sim, city, project(id), cost)!;
    expect(one('ca-on-toronto', 'suite').lines[0]!.amount).toBe(inSave(sim, Math.round(18.56 * m2('suite') * 100), 'CAD'));
    expect(one('ca-on-toronto', 'suite').waitDays).toBe(14);
    expect(one('ca-on-toronto', 'basement').lines[0]!.amount).toBe(inSave(sim, Math.round(6.2 * m2('basement') * 100), 'CAD'));
    // A small bathroom's 48 sq ft is under the least.
    expect(one('ca-on-toronto', 'bath-add').lines[0]!.amount).toBe(inSave(sim, 214_79, 'CAD'));
    expect(one('ca-on-toronto', 'garage-build').lines[0]!.amount).toBe(inSave(sim, 214_79, 'CAD'));
    expect(worksPermit(sim, 'ca-on-toronto', project('attic'), 100_000_00)).toBeUndefined();
    // C$100,000 of work: $217, 45 thousands at $13.90 and 50 at $7.04.
    const cad = inSave(sim, 100_000_00, 'CAD');
    expect(one('ca-bc-vancouver', 'attic', cad).lines[0]!.amount).toBe(inSave(sim, 1_194_50, 'CAD'));
    expect(one('ca-bc-vancouver', 'attic', inSave(sim, 4_000_00, 'CAD')).lines[0]!.amount).toBe(inSave(sim, 217_00, 'CAD'));
    expect(one('mx-cmx-mexicocity', 'suite').lines[0]!.amount).toBe(inSave(sim, Math.round((447 + 23 * m2('suite')) * 100), 'MXN'));
    expect(one('mx-cmx-mexicocity', 'garage-build').lines[0]!.amount).toBe(inSave(sim, (447 + 23 * 18) * 100, 'MXN'));
    expect(worksPermit(sim, 'mx-cmx-mexicocity', project('basement'), 100_000_00)).toBeUndefined();
  });

  it('asks nothing for work that doesn’t change the building, or where SLATE keeps no permit', () => {
    const sim = save('us-ny-newyork', 'permit-none');
    expect(worksPermit(sim, 'us-ny-newyork', project('paint'), 5_000_00)).toBeUndefined();
    expect(worksPermit(sim, 'fr-idf-paris', project('suite'), 100_000_00)).toBeUndefined();
  });
});

describe('the work waiting for it', () => {
  it('pays London’s householder application when a bigger suite is started, and finishes it eight weeks later than the work alone', () => {
    const sim = save('uk-eng-london', 'permit-work');
    const owned = ownBuilt(sim, sim.player, { cityId: 'uk-eng-london', facts: house(), price: 600_000_00, closing: 0 });
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 1_000_000_00, 'GBP');
    const r = sim.execute<{ doneAt: number }>({ kind: 'home.renovate', payload: { homeId: owned.id, projectId: 'suite-upscale' } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.doneAt).toBe(sim.now + (56 + project('suite-upscale').days) * MS_DAY);
    const fee = sim.universe.transactions.find((t) => t.memo.startsWith('Householder Planning Application'))!;
    expect(fee.postings.filter((x) => x.amount > 0).reduce((a, x) => a + x.amount, 0)).toBe(inSave(sim, 548_00, 'GBP') + inSave(sim, 1_875_55, 'GBP') + inSave(sim, 850_00, 'GBP'));
    expect(projectCost(sim, owned, project('suite-upscale'))).toBeGreaterThan(0);
  });
  it('builds a garage, exempt in London, and a car kept in it pays no resident permit after', () => {
    const sim = save('uk-eng-london', 'permit-garage');
    const owned = ownBuilt(sim, sim.player, { cityId: 'uk-eng-london', facts: house(), price: 600_000_00, closing: 0 });
    expect(worksPermit(sim, 'uk-eng-london', project('garage-build'), 20_000_00)).toBeUndefined();
    expect(worksPermit(sim, 'ie-lei-dublin', project('garage-build'), 20_000_00)).toBeUndefined();
    expect(worksPermit(sim, 'us-ny-newyork', project('garage-build'), 20_000_00)).toBeDefined();
    const puma = modelById('gb-ford-puma')!;
    expect(parkingYear(sim.player, puma, 'uk-eng-london')).toBeDefined();
    sim.universe.accounts[sim.player.primaryAccountId!]!.balance += inSave(sim, 100_000_00, 'GBP');
    const r = sim.execute<{ doneAt: number }>({ kind: 'home.renovate', payload: { homeId: owned.id, projectId: 'garage-build' } });
    expect(r.ok, r.error).toBe(true);
    sim.advanceTo(r.value!.doneAt + MS_DAY);
    expect(owned.facts.features).toContain('garage');
    expect(owned.facts.parts.garageDoor).toBe(new Date(sim.now).getUTCFullYear());
    expect(parkingYear(sim.player, puma, 'uk-eng-london')).toBeUndefined();
  });
});
