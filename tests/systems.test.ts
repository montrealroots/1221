import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { checkFitment, PARTS, VEHICLE_MODELS } from '@/engine/content/vehicles';
import { fitmentSubject, createVehicle } from '@/engine/systems/vehicles';
import { CONSTRUCTION_PHASES } from '@/engine/systems/property';
import { computeAnnualTax, salesTaxRate, propertyTaxRate, resolveIncomeTaxLayers } from '@/engine/content/tax';
import { conflictingTraits, TRAITS, ATTRIBUTES, effectiveAttributes, ACTING_TRAITS, ALL_TRAITS, PROFESSION_TRAITS } from '@/engine/domain/attributes';
import { SKILLS } from '@/engine/domain/skills';
import { relationshipStrength, compatibilityBetween } from '@/engine/systems/relationships';

describe('vehicle fitment', () => {
  const subject = (overrides: Partial<ReturnType<typeof fitmentSubject>> = {}) => ({
    kind: 'car' as const, modelId: 'toyota_corolla', make: 'toyota', year: 2022, trimId: 'le',
    powertrain: 'gas' as const, bodyStyle: 'sedan' as const, installedCategories: [],
    ...overrides,
  });

  it('refuses a part built for another manufacturer', () => {
    const brakes = PARTS.require('brakes_carbon'); // Porsche, Ferrari, Lamborghini, McLaren, Mercedes
    const verdict = checkFitment(brakes, subject());
    expect(verdict.fits).toBe(false);
    expect(verdict.reasons[0]).toMatch(/does(n’t| not) fit/);
  });

  it('refuses a combustion part on an electric car', () => {
    const exhaust = PARTS.require('exhaust_catback');
    const verdict = checkFitment(exhaust, subject({
      modelId: 'tesla_model3', make: 'tesla', trimId: 'rwd', powertrain: 'ev',
    }));
    expect(verdict.fits).toBe(false);
    expect(verdict.reasons.some((r) => r.includes('electric'))).toBe(true);
  });

  it('refuses a part outside the model years it was made for', () => {
    const headunit = PARTS.require('info_headunit'); // fits 2015-2021
    expect(checkFitment(headunit, subject({ year: 2024 })).fits).toBe(false);
    expect(checkFitment(headunit, subject({ year: 2018 })).fits).toBe(true);
  });

  it('refuses a part whose prerequisites are not fitted', () => {
    const stage2 = PARTS.require('tune_stage2'); // requires exhaust and intake
    expect(checkFitment(stage2, subject()).fits).toBe(false);
    expect(checkFitment(stage2, subject({ installedCategories: ['exhaust', 'intake'] })).fits).toBe(true);
  });

  it('refuses an SUV wheel on a sedan', () => {
    const wheels = PARTS.require('wheels_forged_22');
    expect(checkFitment(wheels, subject()).fits).toBe(false);
    expect(checkFitment(wheels, subject({
      modelId: 'porsche_cayenne', make: 'porsche', trimId: 'base', bodyStyle: 'suv',
    })).fits).toBe(true);
  });

  it('warns about warranty, legality and insurance without blocking', () => {
    const straightPipe = PARTS.require('exhaust_straight');
    const verdict = checkFitment(straightPipe, subject());
    expect(verdict.fits).toBe(true);
    expect(verdict.warnings.some((w) => w.includes('warranty'))).toBe(true);
    expect(verdict.warnings.some((w) => w.includes('street legal'))).toBe(true);
    expect(verdict.warnings.some((w) => w.includes('insurer'))).toBe(true);
  });

  it('voids the warranty in a live universe when the part says it does', () => {
    const sim = quickSave({ wealth: 'comfortable' });
    const vehicle = createVehicle(sim, {
      ownerId: sim.player.id, modelId: 'honda_civic', trimId: 'sport',
      year: new Date(sim.now).getUTCFullYear(), mileage: 12,
      configuration: { paint: 'Black', wheels: '18"', interior: 'Cloth', options: [], modificationIds: [] },
      purchasePrice: 2_690_000, acquisition: 'cash', condition: 100,
    });
    expect(vehicle.warranty.voided).toBe(false);

    sim.execute({ kind: 'veh.book_modification', payload: { vehicleId: vehicle.id, partIds: ['tune_stage1'] } });
    sim.advanceTo(sim.now + 10 * MS_DAY);
    expect(sim.universe.vehicles[vehicle.id]?.warranty.voided).toBe(true);
  });

  it('never lets the catalog offer a part that would not fit', () => {
    const sim = quickSave();
    for (const model of VEHICLE_MODELS.all().slice(0, 6)) {
      const trim = model.trims[0];
      if (!trim) continue;
      const vehicle = createVehicle(sim, {
        ownerId: sim.player.id, modelId: model.id, trimId: trim.id,
        year: 2024, mileage: 100,
        configuration: { paint: 'x', wheels: 'y', interior: 'z', options: [], modificationIds: [] },
        purchasePrice: trim.msrp, acquisition: 'cash', condition: 100,
      });
      const s = fitmentSubject(sim, vehicle);
      // A part the catalog offers must at minimum pass the vehicle-shape checks.
      for (const part of PARTS.all()) {
        const verdict = checkFitment(part, s);
        if (verdict.fits) {
          expect(part.fitment.makes.length === 0 || part.fitment.makes.includes(model.parentId)).toBe(true);
        }
      }
    }
  });
});

describe('construction dependencies', () => {
  it('declares a graph with no cycles', () => {
    const visit = (phase: string, stack: string[]): void => {
      if (stack.includes(phase)) throw new Error(`Cycle: ${[...stack, phase].join(' -> ')}`);
      const spec = CONSTRUCTION_PHASES.find((p) => p.phase === phase);
      for (const dep of spec?.dependsOn ?? []) visit(dep, [...stack, phase]);
    };
    expect(() => { for (const phase of CONSTRUCTION_PHASES) visit(phase.phase, []); }).not.toThrow();
  });

  it('only references phases that exist', () => {
    const names = new Set(CONSTRUCTION_PHASES.map((p) => p.phase));
    for (const phase of CONSTRUCTION_PHASES) {
      for (const dep of phase.dependsOn) expect(names.has(dep)).toBe(true);
    }
  });

  it('allocates the whole budget across its phases', () => {
    const total = CONSTRUCTION_PHASES.reduce((s, p) => s + p.budgetShare, 0);
    expect(total).toBeGreaterThan(0.97);
    expect(total).toBeLessThan(1.03);
  });
});


describe('tax by jurisdiction', () => {
  it('charges no state income tax where there is none', () => {
    const at = Date.UTC(2026, 5, 1);
    const texas = computeAnnualTax(120_000_00, 'us-tx-austin', at);
    const california = computeAnnualTax(120_000_00, 'us-ca-losangeles', at);
    expect(texas.regional).toBe(0);
    expect(california.regional).toBeGreaterThan(0);
    expect(texas.total).toBeLessThan(california.total);
  });

  it('is progressive: a higher income pays a higher effective rate', () => {
    const at = Date.UTC(2026, 5, 1);
    const low = computeAnnualTax(45_000_00, 'us-ca-losangeles', at);
    const high = computeAnnualTax(450_000_00, 'us-ca-losangeles', at);
    expect(high.effectiveRate).toBeGreaterThan(low.effectiveRate);
  });

  it('charges the self-employed both halves of payroll tax', () => {
    const at = Date.UTC(2026, 5, 1);
    const employed = computeAnnualTax(90_000_00, 'us-ca-losangeles', at);
    const selfEmployed = computeAnnualTax(90_000_00, 'us-ca-losangeles', at, { selfEmployed: true });
    expect(selfEmployed.payroll).toBeGreaterThan(employed.payroll);
  });

  it('never takes more than the gross', () => {
    const at = Date.UTC(2026, 5, 1);
    for (const city of ['us-ca-losangeles', 'us-ny-newyork', 'uk-eng-london', 'ae-du-dubai']) {
      for (const income of [0, 10_000_00, 100_000_00, 5_000_000_00]) {
        const tax = computeAnnualTax(income, city, at);
        expect(tax.total).toBeLessThanOrEqual(income);
        expect(tax.net).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('resolves the most specific sales tax rate available', () => {
    const at = Date.UTC(2026, 5, 1);
    // Los Angeles is above the California base rate.
    expect(salesTaxRate('us-ca-losangeles', at, 'clothing'))
      .toBeGreaterThan(salesTaxRate('us-ca-sandiego', at, 'clothing'));
    // Groceries are exempt in California.
    expect(salesTaxRate('us-ca-losangeles', at, 'groceries')).toBe(0);
    // Oregon has no sales tax at all.
    expect(salesTaxRate('us-or-portland', at, 'clothing')).toBe(0);
  });

  it('has a property tax rate everywhere', () => {
    const at = Date.UTC(2026, 5, 1);
    for (const city of ['us-ca-losangeles', 'us-tx-austin', 'uk-eng-london', 'jp-13-tokyo']) {
      expect(propertyTaxRate(city, at)).toBeGreaterThanOrEqual(0);
    }
  });

  it('stacks federal and regional layers', () => {
    const at = Date.UTC(2026, 5, 1);
    const layers = resolveIncomeTaxLayers('us-ca-losangeles', at);
    expect(layers.length).toBeGreaterThanOrEqual(2);
    expect(layers[0]?.jurisdictionCode).toBe('US');
  });
});

describe('attributes and traits', () => {
  it('has exactly 88 attributes and 42 acting traits', () => {
    expect(ATTRIBUTES).toHaveLength(88);
    expect(TRAITS).toHaveLength(42);
    expect(ACTING_TRAITS).toHaveLength(42);
    // The professions add their own on top; acting's forty-two are untouched.
    expect(ALL_TRAITS.length).toBe(42 + PROFESSION_TRAITS.length);
    expect(PROFESSION_TRAITS.length).toBeGreaterThan(0);
  });

  it('has no duplicate ids anywhere', () => {
    expect(new Set(ATTRIBUTES.map((a) => a.id)).size).toBe(88);
    expect(new Set(TRAITS.map((t) => t.id)).size).toBe(42);
    expect(new Set(ALL_TRAITS.map((t) => t.id)).size).toBe(ALL_TRAITS.length);
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(SKILLS.length);
  });

  it('only modifies skills that exist, from profession traits', () => {
    const ids = new Set(SKILLS.map((s) => s.id));
    for (const trait of PROFESSION_TRAITS) {
      for (const key of Object.keys(trait.skillMods ?? {})) {
        expect(ids.has(key), `${trait.id} modifies unknown skill ${key}`).toBe(true);
      }
      for (const other of trait.conflictsWith ?? []) {
        expect(ALL_TRAITS.some((t) => t.id === other), `${trait.id} conflicts with unknown ${other}`).toBe(true);
      }
    }
  });

  it('only modifies attributes that exist', () => {
    const ids = new Set(ATTRIBUTES.map((a) => a.id));
    for (const trait of TRAITS) {
      for (const key of Object.keys(trait.attributeMods ?? {})) {
        expect(ids.has(key), `${trait.id} modifies unknown attribute ${key}`).toBe(true);
      }
    }
  });

  it('declares conflicts symmetrically enough to be enforced', () => {
    for (const trait of TRAITS) {
      for (const other of trait.conflictsWith ?? []) {
        expect(conflictingTraits([other], trait.id)).toContain(other);
      }
    }
  });

  it('keeps trait-modified attributes inside 0 to 100', () => {
    const sheet = Object.fromEntries(ATTRIBUTES.map((a) => [a.id, 98]));
    const boosted = effectiveAttributes(sheet, TRAITS.map((t) => t.id));
    for (const value of Object.values(boosted)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it('gives the founder every trait, and keeps them exclusive for everybody else', () => {
    // The founder is the one exception in the save: they hold the whole list,
    // contradictory pairs included, and the prodigy flag is what stops the
    // penalty half of each one applying. Nobody else gets that, and the
    // command that hands a trait out still refuses a conflicting pick.
    const sim = quickSave();
    expect(sim.player.prodigy).toBe(true);
    expect(sim.player.traits).toHaveLength(ALL_TRAITS.length);

    const other = Object.values(sim.universe.people).find((p) => !p.isPlayer)!;
    expect(other.prodigy).toBeFalsy();
    for (const id of other.traits) {
      expect(conflictingTraits(other.traits.filter((t) => t !== id), id), id).toHaveLength(0);
    }

    // And the rule is still enforced where a trait is actually chosen.
    expect(conflictingTraits(['writer_page_machine'], 'writer_polisher').length).toBeGreaterThan(0);
  });

  it('starts every attribute and skill at the ceiling', () => {
    const sim = quickSave();
    for (const attribute of ATTRIBUTES) expect(sim.player.attributes[attribute.id]).toBe(100);
    for (const skill of SKILLS) expect(sim.player.skills[skill.id]).toBe(100);
  });

});

describe('relationships', () => {
  it('keeps every dimension inside its bounds through interaction', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 30 * MS_DAY);
    for (const rel of Object.values(sim.universe.relationships)) {
      for (const [key, value] of Object.entries(rel.dimensions)) {
        expect(value, `${key} out of range`).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it('lets unresolved conflict drag a relationship down', () => {
    const sim = quickSave();
    const rel = Object.values(sim.universe.relationships)[0];
    if (!rel) return;
    rel.dimensions = {
      familiarity: 80, affection: 80, trust: 80, respect: 80,
      compatibility: 80, commitment: 80, conflict: 0,
    };
    const calm = relationshipStrength(rel, sim.now);
    rel.dimensions.conflict = 90;
    expect(relationshipStrength(rel, sim.now)).toBeLessThan(calm);
  });

  it('scores compatibility symmetrically', () => {
    const sim = quickSave();
    const people = Object.values(sim.universe.people).slice(0, 5);
    for (const a of people) {
      for (const b of people) {
        expect(compatibilityBetween(a, b)).toBe(compatibilityBetween(b, a));
      }
    }
  });
});


/**
 * The car you were promised at creation.
 *
 * "Start With A Car" is ticked by default, and it used to be a box that did
 * nothing for most starts. The listing was priced off checking plus savings
 * and then paid for out of checking alone, so a comfortable character silently
 * got no car while a wealthy one did, and the floor price meant anybody poor
 * got nothing at all with no explanation on the screen they had just ticked.
 */
describe('the starting vehicle', () => {
  const WEALTHS = ['scraping', 'modest', 'comfortable', 'wealthy', 'inherited'] as const;

  const ownedBy = (sim: ReturnType<typeof quickSave>) =>
    Object.values(sim.universe.vehicles).filter((v) => v.ownerId === sim.player.id && !v.soldAt);

  it('actually arrives at every wealth level that could afford one', () => {
    for (const wealth of WEALTHS) {
      const sim = quickSave({ wealth, startWithVehicle: true }, `car-${wealth}`);
      expect(ownedBy(sim).length, `${wealth} ticked the box and got no car`).toBe(1);
      expect(sim.ledger.audit(), wealth).toEqual([]);
    }
  });

  it('leaves them solvent afterwards rather than spending the last of it', () => {
    for (const wealth of WEALTHS) {
      const sim = quickSave({ wealth, startWithVehicle: true }, `car-solvent-${wealth}`);
      const left = sim.universe.accounts[sim.player.primaryAccountId!]?.balance ?? 0;
      expect(left, `${wealth} was left with ${left}`).toBeGreaterThan(0);
    }
  });

  it('gives a bigger start a better car than a smaller one', () => {
    const poor = quickSave({ wealth: 'scraping', startWithVehicle: true }, 'car-poor');
    const rich = quickSave({ wealth: 'wealthy', startWithVehicle: true }, 'car-rich');
    expect(ownedBy(rich)[0]!.purchasePrice ?? 0).toBeGreaterThan(ownedBy(poor)[0]!.purchasePrice ?? 0);
  });

  it('says so plainly when somebody genuinely cannot afford anything', () => {
    // Forty dollars. No car is the right answer, and it is stated rather than
    // left as a ticked box that quietly did nothing.
    const sim = quickSave({ wealth: 'nothing', startWithVehicle: true }, 'car-broke');
    expect(ownedBy(sim)).toHaveLength(0);
    expect(sim.universe.notifications.some((n) => /No Car Yet/.test(n.title))).toBe(true);
  });

  it('gives nobody a car when the box is not ticked', () => {
    const sim = quickSave({ wealth: 'inherited', startWithVehicle: false }, 'car-none');
    expect(ownedBy(sim)).toHaveLength(0);
    expect(sim.universe.notifications.some((n) => /No Car Yet/.test(n.title))).toBe(false);
  });
});
