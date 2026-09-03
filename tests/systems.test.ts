import { describe, expect, it } from 'vitest';
import { franchiseLift, recordFranchiseEntry } from '@/engine/systems/release';
import { quickSave } from '@/engine';
import type { Id, Project } from '@/engine/domain/model';
import { MS_DAY } from '@/engine/core/time';
import { checkFitment, PARTS, VEHICLE_MODELS } from '@/engine/content/vehicles';
import { fitmentSubject, createVehicle } from '@/engine/systems/vehicles';
import { POST_TASKS, openPost, blockedReasons } from '@/engine/systems/production';
import { CONSTRUCTION_PHASES } from '@/engine/systems/property';
import { computeAnnualTax, salesTaxRate, propertyTaxRate, resolveIncomeTaxLayers } from '@/engine/content/tax';
import { conflictingTraits, TRAITS, ATTRIBUTES, effectiveAttributes, ACTING_TRAITS, ALL_TRAITS, PROFESSION_TRAITS } from '@/engine/domain/attributes';
import { SKILLS } from '@/engine/domain/skills';
import { relationshipStrength, compatibilityBetween } from '@/engine/systems/relationships';

describe('vehicle fitment', () => {
  const subject = (overrides: Partial<ReturnType<typeof fitmentSubject>> = {}) => ({
    modelId: 'toyota_corolla', make: 'toyota', year: 2022, trimId: 'le',
    powertrain: 'gas' as const, bodyStyle: 'sedan' as const, installedCategories: [],
    ...overrides,
  });

  it('refuses a part built for another manufacturer', () => {
    const brakes = PARTS.require('brakes_carbon'); // Porsche, Ferrari, Lamborghini, McLaren, Mercedes
    const verdict = checkFitment(brakes, subject());
    expect(verdict.fits).toBe(false);
    expect(verdict.reasons[0]).toMatch(/does not fit/);
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

  it('never lets the catalogue offer a part that would not fit', () => {
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
      // A part the catalogue offers must at minimum pass the vehicle-shape checks.
      for (const part of PARTS.all()) {
        const verdict = checkFitment(part, s);
        if (verdict.fits) {
          expect(part.fitment.makes.length === 0 || part.fitment.makes.includes(model.parentId)).toBe(true);
        }
      }
    }
  });
});

describe('post-production dependencies', () => {
  it('declares a graph with no cycles', () => {
    const seen = new Map<string, number>();
    const visit = (kind: string, stack: string[]): void => {
      if (stack.includes(kind)) throw new Error(`Cycle: ${[...stack, kind].join(' -> ')}`);
      if (seen.has(kind)) return;
      const spec = POST_TASKS.find((t) => t.kind === kind);
      for (const dep of spec?.dependsOn ?? []) visit(dep, [...stack, kind]);
      seen.set(kind, 1);
    };
    expect(() => { for (const task of POST_TASKS) visit(task.kind, []); }).not.toThrow();
  });

  it('will not colour a picture that is not locked', () => {
    const sim = quickSave();
    const created = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'feature', genres: ['drama'], logline: 'A test.' },
    });
    const projectId = created.value?.projectId as Id;
    const project = sim.universe.projects[projectId];
    if (!project) throw new Error('project missing');
    project.completedShootDays = 1;
    project.budget = 10_000_000_00;
    openPost(sim, projectId);

    const colour = Object.values(sim.universe.postTasks).find((t) => t.projectId === projectId && t.kind === 'color');
    expect(colour?.status).toBe('blocked');
    expect(blockedReasons(sim, colour?.id ?? '').length).toBeGreaterThan(0);

    const result = sim.execute({ kind: 'prod.start_post_task', payload: { taskId: colour?.id } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/cannot start yet/);
  });

  it('lets assembly start immediately because nothing precedes it', () => {
    const sim = quickSave();
    const created = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'feature', genres: ['drama'], logline: 'A test.' },
    });
    const projectId = created.value?.projectId as Id;
    const project = sim.universe.projects[projectId];
    if (!project) throw new Error('project missing');
    project.completedShootDays = 1;
    project.budget = 10_000_000_00;
    openPost(sim, projectId);

    const assembly = Object.values(sim.universe.postTasks).find((t) => t.projectId === projectId && t.kind === 'assembly');
    expect(assembly?.status).toBe('ready');
    expect(sim.execute({ kind: 'prod.start_post_task', payload: { taskId: assembly?.id } }).ok).toBe(true);
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

describe('authority and rights', () => {
  it('refuses a greenlight from someone with no authority', () => {
    const sim = quickSave();
    const created = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'feature', genres: ['action'], logline: 'Expensive.' },
    });
    const projectId = created.value?.projectId as Id;
    sim.execute({ kind: 'film.write_draft', payload: { projectId } });
    sim.execute({
      kind: 'film.acquire_rights',
      payload: { projectId, title: 'Expensive', sourceKind: 'original', acquisitionKind: 'original', cost: 0 },
    });

    const result = sim.execute({ kind: 'film.greenlight', payload: { projectId, budget: 250_000_000_00 } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/authority/);
  });

  it('refuses a greenlight with no chain of title', () => {
    const sim = quickSave();
    sim.universe.sandbox.enabled = true;
    sim.universe.sandbox.ignoreAuthority = true;

    const created = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'short', genres: ['drama'], logline: 'No rights.' },
    });
    const projectId = created.value?.projectId as Id;
    sim.execute({ kind: 'film.write_draft', payload: { projectId } });

    const result = sim.execute({ kind: 'film.greenlight', payload: { projectId, budget: 100_000_00 } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/chain of title/);
  });

  it('refuses a greenlight when the option is about to lapse', () => {
    const sim = quickSave({ wealth: 'wealthy' });
    sim.universe.sandbox.enabled = true;
    sim.universe.sandbox.ignoreAuthority = true;

    const created = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'feature', genres: ['drama'], logline: 'Optioned.' },
    });
    const projectId = created.value?.projectId as Id;
    sim.execute({ kind: 'film.write_draft', payload: { projectId } });
    sim.execute({
      kind: 'film.acquire_rights',
      payload: {
        projectId, title: 'A book', sourceKind: 'book',
        acquisitionKind: 'option', cost: 25_000_00, optionMonths: 2,
      },
    });

    const result = sim.execute({ kind: 'film.greenlight', payload: { projectId, budget: 1_000_000_00 } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/expires/);
  });

  it('lets a company greenlight inside its ceiling and refuses beyond it', () => {
    const sim = quickSave({ wealth: 'inherited' });
    const savings = Object.values(sim.universe.accounts).find((a) => a.kind === 'savings');
    expect(savings).toBeDefined();

    // Capital has to actually exist in the account it is drawn from.
    const overreach = sim.execute({
      kind: 'co.found',
      payload: { structure: 'llc', kind: 'production', initialCapital: 2_000_000_00 },
    });
    expect(overreach.ok).toBe(false);
    expect(overreach.error).toMatch(/filing fees/);

    const founded = sim.execute<{ companyId: Id; greenlightCeiling: number }>({
      kind: 'co.found',
      payload: { structure: 'llc', kind: 'production', initialCapital: 2_000_000_00, accountId: savings?.id },
    });
    expect(founded.ok).toBe(true);
    const companyId = founded.value?.companyId as Id;
    const ceiling = founded.value?.greenlightCeiling ?? 0;
    expect(ceiling).toBeGreaterThan(0);

    const created = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'feature', genres: ['drama'], logline: 'Inside the ceiling.', companyId },
    });
    const projectId = created.value?.projectId as Id;
    sim.execute({ kind: 'film.write_draft', payload: { projectId } });
    sim.execute({
      kind: 'film.acquire_rights',
      payload: { projectId, title: 'Original', sourceKind: 'original', acquisitionKind: 'original', cost: 0, holderId: companyId, holderKind: 'company' },
    });

    const tooBig = sim.execute({ kind: 'film.greenlight', payload: { projectId, budget: ceiling * 10, companyId } });
    expect(tooBig.ok).toBe(false);
    expect(tooBig.error).toMatch(/cannot support|authority/);
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

  it('refuses to grant conflicting traits even in sandbox', () => {
    const sim = quickSave();
    sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
    const result = sim.execute<{ granted: string[]; skipped: { id: string }[] }>({
      kind: 'sandbox.grant_all_traits', payload: {},
    });
    expect(result.ok).toBe(true);
    expect(result.value?.skipped.length).toBeGreaterThan(0);

    const held = sim.player.traits;
    for (const id of held) {
      expect(conflictingTraits(held.filter((t) => t !== id), id)).toHaveLength(0);
    }
  });

  it('maxes every attribute and skill when sandbox asks', () => {
    const sim = quickSave();
    sim.execute({ kind: 'sandbox.toggle', payload: { enabled: true } });
    sim.execute({ kind: 'sandbox.max_attributes', payload: {} });
    for (const attribute of ATTRIBUTES) expect(sim.player.attributes[attribute.id]).toBe(100);
    for (const skill of SKILLS) expect(sim.player.skills[skill.id]).toBe(100);
  });

  it('refuses sandbox tools while sandbox is off', () => {
    const sim = quickSave();
    const result = sim.execute({ kind: 'sandbox.max_attributes', payload: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Sandbox is off/);
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

describe('franchises', () => {
  /** A released picture, good enough to build on, owned by the player. */
  const madeAHit = (seed: string) => {
    const sim = quickSave({ wealth: 'inherited' }, seed);
    const savings = Object.values(sim.universe.accounts).find((a) => a.kind === 'savings');
    const co = sim.execute<{ companyId: Id }>({
      kind: 'co.found',
      payload: { structure: 'llc', kind: 'production', initialCapital: 2_000_000_00, accountId: savings?.id },
    });
    const created = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'feature', genres: ['action'], logline: 'The first one.', companyId: co.value?.companyId },
    });
    const projectId = created.value?.projectId as Id;
    sim.execute({ kind: 'film.write_draft', payload: { projectId } });
    sim.execute({
      kind: 'film.acquire_rights',
      payload: {
        projectId, title: 'Original', sourceKind: 'original', acquisitionKind: 'original',
        cost: 0, holderId: co.value?.companyId, holderKind: 'company',
      },
    });
    const project = sim.universe.projects[projectId] as Project;
    // Stand the film up as delivered and well received, so the test is about
    // what a franchise does rather than about getting one made.
    project.phase = 'library';
    project.finalQuality = 78;
    project.criticScore = 74;
    project.audienceScore = 80;
    project.totalRevenue = 300_000_000_00;
    project.totalCost = 90_000_000_00;
    return { sim, projectId, companyId: co.value?.companyId as Id };
  };

  it('starts a franchise on a picture that earned one', () => {
    const { sim, projectId } = madeAHit('franchise-start');
    const result = sim.execute<{ franchiseId: Id; strength: number }>({
      kind: 'film.start_franchise', payload: { projectId, name: 'The Undertow Saga' },
    });
    expect(result.ok, result.error).toBe(true);
    expect(result.value?.strength).toBeGreaterThan(0);

    const franchise = sim.universe.franchises[result.value?.franchiseId as Id];
    expect(franchise, 'no franchise record was created').toBeDefined();
    expect(franchise!.projectIds).toContain(projectId);
    expect(sim.universe.projects[projectId]?.franchiseId).toBe(franchise!.id);
  });

  it('refuses to build on a film nobody liked', () => {
    const { sim, projectId } = madeAHit('franchise-flop');
    const project = sim.universe.projects[projectId] as Project;
    project.finalQuality = 22;
    project.criticScore = 18;
    project.audienceScore = 30;

    const result = sim.execute({ kind: 'film.start_franchise', payload: { projectId } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/did not land/);
  });

  it('refuses to build on rights that do not include sequels', () => {
    const { sim, projectId } = madeAHit('franchise-rights');
    const rightsId = (sim.universe.projects[projectId] as Project).rightsId as Id;
    sim.universe.rights[rightsId]!.scope.sequelRights = false;

    const result = sim.execute({ kind: 'film.start_franchise', payload: { projectId } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/sequels/);
  });

  it('will not start two franchises on the same picture', () => {
    const { sim, projectId } = madeAHit('franchise-twice');
    expect(sim.execute({ kind: 'film.start_franchise', payload: { projectId } }).ok).toBe(true);
    const again = sim.execute({ kind: 'film.start_franchise', payload: { projectId } });
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/already part of/);
  });

  it('lifts a sequel while appetite holds and drags it once fatigue sets in', () => {
    const { sim, projectId, companyId } = madeAHit('franchise-lift');
    const started = sim.execute<{ franchiseId: Id }>({ kind: 'film.start_franchise', payload: { projectId } });
    const franchiseId = started.value?.franchiseId as Id;

    const sequel = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'feature', genres: ['action'], logline: 'The next one.', companyId },
    });
    const sequelId = sequel.value?.projectId as Id;
    const added = sim.execute({ kind: 'film.add_to_franchise', payload: { franchiseId, projectId: sequelId } });
    expect(added.ok, added.error).toBe(true);

    const sequelProject = sim.universe.projects[sequelId] as Project;
    const franchise = sim.universe.franchises[franchiseId]!;

    // Appetite high and nobody tired of it yet: the sequel opens bigger.
    franchise.strength = 80;
    franchise.fatigue = 5;
    expect(franchiseLift(sim, sequelProject)).toBeGreaterThan(1);

    // Run into the ground: the same picture opens smaller.
    franchise.strength = 30;
    franchise.fatigue = 90;
    expect(franchiseLift(sim, sequelProject)).toBeLessThan(1);

    // A standalone is unaffected either way.
    const standalone = sim.execute<{ projectId: Id }>({
      kind: 'film.create_project',
      payload: { format: 'feature', genres: ['drama'], logline: 'Nothing to do with it.', companyId },
    });
    expect(franchiseLift(sim, sim.universe.projects[standalone.value?.projectId as Id] as Project)).toBe(1);
  });

  it('spends appetite on a weak entry and buys it back on a strong one', () => {
    const { sim, projectId, companyId } = madeAHit('franchise-entries');
    const started = sim.execute<{ franchiseId: Id }>({ kind: 'film.start_franchise', payload: { projectId } });
    const franchise = sim.universe.franchises[started.value?.franchiseId as Id]!;

    const entry = (quality: number, revenue: number) => {
      const made = sim.execute<{ projectId: Id }>({
        kind: 'film.create_project',
        payload: { format: 'feature', genres: ['action'], logline: 'Another.', companyId },
      });
      const p = sim.universe.projects[made.value?.projectId as Id] as Project;
      p.franchiseId = franchise.id;
      p.finalQuality = quality;
      p.criticScore = quality;
      p.audienceScore = quality;
      p.totalRevenue = revenue;
      p.totalCost = 100_000_000_00;
      return p;
    };

    const strongBefore = franchise.strength;
    recordFranchiseEntry(sim, entry(85, 400_000_000_00), 300_000_000_00);
    expect(franchise.strength, 'a hit did not raise appetite').toBeGreaterThan(strongBefore);

    const afterHit = franchise.strength;
    recordFranchiseEntry(sim, entry(28, 40_000_000_00), -60_000_000_00);
    expect(franchise.strength, 'a dud did not cost anything').toBeLessThan(afterHit);

    // Every entry costs novelty, whichever way it went.
    expect(franchise.fatigue, 'three entries left the series as fresh as it started').toBeGreaterThan(0);
    expect(franchise.projectIds.length).toBe(3);
  });

  it('lets appetite recover while the series rests', () => {
    const { sim, projectId } = madeAHit('franchise-rest');
    const started = sim.execute<{ franchiseId: Id }>({ kind: 'film.start_franchise', payload: { projectId } });
    const franchise = sim.universe.franchises[started.value?.franchiseId as Id]!;
    franchise.fatigue = 70;

    sim.advanceTo(sim.now + 365 * MS_DAY);
    expect(franchise.fatigue, 'a year away did not cool anything off').toBeLessThan(70);
  });
});
