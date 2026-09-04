/**
 * SLATE — Companies, from one person with a laptop to a studio empire.
 *
 * Company money and personal money are separate ledgers with separate accounts.
 * Scale is earned: the greenlight ceiling is derived from cash, credit, library
 * value and track record, so a new production company genuinely cannot commit
 * to a two-hundred-million-dollar film no matter what the player types.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Company, Division, Employee, Equipment, Id, MerchandiseLine } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, addMonths, MS_DAY } from '../core/time';
import { applyRate, formatMoney, formatMoneyCompact, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { GEAR } from '../content/gear';
import { costOfLiving } from '../content/tax';
import { generateCompanyName, generatePersonName } from '../content/names';
import { createBill } from './finance';

// ---------------------------------------------------------------------------
// Roles and equipment
// ---------------------------------------------------------------------------

export interface RoleTemplate {
  title: string;
  department: string;
  baseSalary: Money;
  /** Single-project greenlight authority granted with the seat. */
  authorityShare: number;
  skills: string[];
  description: string;
}

export const COMPANY_ROLES: readonly RoleTemplate[] = [
  { title: 'Assistant', department: 'operations', baseSalary: 52_000_00, authorityShare: 0, skills: ['operations'], description: 'Keeps the calendar, the coverage and the coffee moving.' },
  { title: 'Creative Executive', department: 'development', baseSalary: 96_000_00, authorityShare: 0, skills: ['development_instinct', 'story_structure'], description: 'Reads everything, finds the one worth making.' },
  { title: 'Director Of Development', department: 'development', baseSalary: 168_000_00, authorityShare: 0.05, skills: ['development_instinct', 'packaging', 'talent_relations'], description: 'Runs the slate from idea to greenlight-ready.' },
  { title: 'Head Of Production', department: 'production', baseSalary: 245_000_00, authorityShare: 0.15, skills: ['budgeting', 'scheduling', 'crisis_management'], description: 'Owns whether the films actually get made on budget.' },
  { title: 'Head Of Business Affairs', department: 'legal', baseSalary: 265_000_00, authorityShare: 0.10, skills: ['negotiation', 'deal_structuring', 'rights_management'], description: 'Every contract, every chain of title, every option.' },
  { title: 'Head Of Marketing', department: 'marketing', baseSalary: 235_000_00, authorityShare: 0.08, skills: ['marketing_strategy', 'market_reading'], description: 'Turns a finished film into a thing people plan to see.' },
  { title: 'Head Of Distribution', department: 'distribution', baseSalary: 255_000_00, authorityShare: 0.12, skills: ['distribution_strategy', 'negotiation'], description: 'Windows, territories and the release date fight.' },
  { title: 'Chief Financial Officer', department: 'finance', baseSalary: 320_000_00, authorityShare: 0.20, skills: ['corporate_finance', 'accounting'], description: 'The person who says no, correctly, most of the time.' },
  { title: 'President Of Production', department: 'production', baseSalary: 480_000_00, authorityShare: 0.45, skills: ['slate_strategy', 'market_reading', 'talent_relations'], description: 'Runs the slate and can commit the company to a picture.' },
  { title: 'Chief Executive', department: 'executive', baseSalary: 750_000_00, authorityShare: 1.0, skills: ['slate_strategy', 'corporate_finance', 'leadership'], description: 'Full authority, and the person who wears every failure.' },
];

export interface EquipmentTemplate {
  name: string;
  brand: string;
  category: Equipment['category'];
  price: Money;
  qualityRating: number;
  dailyRental: Money;
  gearId: string;
  rentalOnly: boolean;
  about: string;
}

/**
 * The kit, from the real registry. Kept as a template list so the company
 * workspace and the older command payloads keep working; the source of truth
 * is content/gear.ts, which says what each thing is and whose it is.
 */
export const EQUIPMENT_CATALOG: readonly EquipmentTemplate[] = GEAR.map((g) => ({
  name: g.name,
  brand: g.maker,
  category: g.category,
  price: g.purchaseCalibration,
  qualityRating: g.qualityRating,
  dailyRental: g.dailyRentalCalibration,
  gearId: g.id,
  rentalOnly: g.rentalOnly ?? false,
  about: g.about,
}));

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerCompany(sim: Simulation): void {
  sim.onSchedule('co.payroll', (item) => runPayroll(sim, item.payload.companyId as Id));
  sim.onSchedule('co.quarter_close', (item) => closeQuarter(sim, item.payload.companyId as Id));
  sim.onSchedule('co.merch_cycle', (item) => runMerchandiseCycle(sim, item.payload.lineId as Id));

  sim.onCommand<{ name?: string; legalName?: string; structure: Company['structure']; kind: Company['kind']; locationId?: string; strategy?: string; initialCapital: Money; accountId?: Id }, { companyId: Id; cashAccountId: Id; greenlightCeiling: Money }>(
    'co.found',
    (p, { sim: s }) => {
      const player = s.player;
      const locationId = p.locationId ?? player.currentLocationId;
      CITIES.require(locationId);

      const accountId = p.accountId ?? player.primaryAccountId;
      if (!accountId) throw new CommandError('No personal account to capitalise the company from.');
      if (p.initialCapital <= 0) throw new CommandError('A company needs capital to start.');

      const formationCost = Math.round(
        (p.structure === 'c_corp' ? 2_400_00 : p.structure === 's_corp' ? 1_800_00 : p.structure === 'llc' ? 900_00 : 200_00)
        * costOfLiving(locationId),
      );
      if (s.ledger.availableFunds(accountId) < p.initialCapital + formationCost) {
        throw new CommandError(
          `Founding costs ${formatMoney(formationCost)} in filing fees on top of the ${formatMoney(p.initialCapital)} you want to put in.`,
        );
      }

      // No two companies in the world share a name, real or made here.
      const existingNames = new Set(Object.values(s.universe.companies).map((c) => c.name.toLowerCase()));
      const name = p.name?.trim() || generateCompanyName(
        s.rng('company_name', s.counter('company')),
        (candidate) => existingNames.has(candidate.toLowerCase()),
      );
      const companyId = s.nextId('company');

      const cash = s.openAccount({
        id: s.nextId('account'),
        kind: 'company_cash',
        name: `${name} — operating account`,
        ownerId: companyId,
        institution: 'Northbank Business',
        openedAt: s.now,
        category: 'company',
      });

      s.expense(accountId, formationCost, `${name} — formation and filing`, 'business');
      s.transfer(accountId, cash.id, p.initialCapital, `${name} — initial capitalisation`, 'business', { refType: 'company', refId: companyId });

      const company: Company = {
        id: companyId,
        saveId: s.universe.meta.id,
        name,
        legalName: p.legalName ?? `${name}, ${p.structure === 'llc' ? 'LLC' : p.structure === 'c_corp' ? 'Inc.' : p.structure === 's_corp' ? 'Inc.' : 'Co.'}`,
        structure: p.structure,
        kind: p.kind,
        ownerships: [{ holderId: player.id, holderKind: 'person', percent: 100 }],
        founderId: player.id,
        headquartersLocationId: locationId,
        strategy: p.strategy ?? 'Develop and produce original material.',
        divisionIds: [],
        employeeIds: [],
        cashAccountId: cash.id,
        projectIds: [],
        rightsIds: [],
        equipmentIds: [],
        reputation: clamp(Math.round(player.reputation.professionalReputation * 0.4), 0, 60),
        greenlightCeiling: 0,
        valuation: p.initialCapital,
        foundedAt: s.now,
        registeredIn: locationId,
      };
      s.universe.companies[company.id] = company;
      recomputeCeiling(s, company.id);

      // Overheads start immediately, which is what makes a company real.
      const overhead = Math.round(2_800_00 * costOfLiving(locationId));
      createBill(s, {
        payerId: company.id,
        name: `${name} — overhead`,
        category: 'business',
        amount: overhead,
        frequency: 'monthly',
        firstDueAt: addMonths(s.now, 1, s.homeZone),
        autopayAccountId: cash.id,
        refType: 'company', refId: company.id,
      });

      s.schedule({
        at: addDays(s.now, 14, s.homeZone),
        kind: 'co.payroll',
        label: `${name} — Payroll`,
        category: 'business',
        payload: { companyId: company.id },
        priority: 14,
        recurrence: { unit: 'week', interval: 2 },
        refType: 'company', refId: company.id,
      });
      s.schedule({
        at: addMonths(s.now, 3, s.homeZone),
        kind: 'co.quarter_close',
        label: `${name} — Quarter Close`,
        category: 'business',
        payload: { companyId: company.id },
        priority: 68,
        recurrence: { unit: 'month', interval: 3 },
        refType: 'company', refId: company.id,
      });

      s.remember({
        category: 'company',
        title: `Founded ${name}`,
        detail: `${company.legalName}, ${p.kind.replace(/_/g, ' ')} in ${CITIES.require(locationId).name}. Capitalised at ${formatMoney(p.initialCapital)}.`,
        refs: [{ type: 'company', id: company.id }],
        significance: 72, public: false, amount: p.initialCapital,
      });
      s.emit('company.founded', { companyId: company.id, name, kind: p.kind, capital: p.initialCapital });
      return { companyId: company.id, cashAccountId: cash.id, greenlightCeiling: company.greenlightCeiling };
    },
  );

  sim.onCommand<{ companyId: Id; amount: Money; fromAccountId?: Id }, { newCeiling: Money; cash: Money }>(
    'co.invest',
    (p, { sim: s }) => {
      const company = s.universe.companies[p.companyId];
      if (!company) throw new CommandError('No such company.');
      const fromAccountId = p.fromAccountId ?? s.player.primaryAccountId;
      if (!fromAccountId) throw new CommandError('No account to invest from.');
      if (s.ledger.availableFunds(fromAccountId) < p.amount) {
        throw new CommandError(`You cannot move ${formatMoney(p.amount)} into ${company.name} right now.`);
      }
      s.transfer(fromAccountId, company.cashAccountId, p.amount, `${company.name} — capital contribution`, 'business', { refType: 'company', refId: company.id });
      company.valuation += p.amount;
      recomputeCeiling(s, company.id);
      s.emit('company.capitalised', { companyId: company.id, amount: p.amount });
      return { newCeiling: company.greenlightCeiling, cash: s.ledger.account(company.cashAccountId).balance };
    },
  );

  sim.onCommand<{ companyId: Id; amount: Money; toAccountId?: Id }, { withdrawn: Money }>(
    'co.distribute',
    (p, { sim: s }) => {
      const company = s.universe.companies[p.companyId];
      if (!company) throw new CommandError('No such company.');
      const stake = company.ownerships.find((o) => o.holderId === s.player.id);
      if (!stake) throw new CommandError('You do not hold equity in that company.');

      const toAccountId = p.toAccountId ?? s.player.primaryAccountId;
      if (!toAccountId) throw new CommandError('No personal account to distribute into.');

      // A company cannot distribute money it has committed to productions.
      const committed = company.projectIds.reduce((sum, id) => {
        const project = s.universe.projects[id];
        if (!project || project.phase === 'released' || project.phase === 'library') return sum;
        return sum + Math.max(0, project.budget - project.spent);
      }, 0);
      const available = s.ledger.availableFunds(company.cashAccountId) - committed;
      if (available < p.amount) {
        throw new CommandError(
          `${company.name} has ${formatMoney(s.ledger.availableFunds(company.cashAccountId))} but ${formatMoney(committed)} is committed to projects in progress. Only ${formatMoney(Math.max(0, available))} can be distributed.`,
        );
      }

      s.transfer(company.cashAccountId, toAccountId, p.amount, `${company.name} — owner distribution`, 'business', { refType: 'company', refId: company.id });
      recomputeCeiling(s, company.id);
      s.emit('company.distribution', { companyId: company.id, amount: p.amount, toId: s.player.id });
      return { withdrawn: p.amount };
    },
  );

  sim.onCommand<{ companyId: Id; name: string; focus: string; budget?: Money; headId?: Id }, { divisionId: Id }>(
    'co.create_division',
    (p, { sim: s }) => {
      const company = s.universe.companies[p.companyId];
      if (!company) throw new CommandError('No such company.');
      if (company.employeeIds.length < 3) {
        throw new CommandError(`${company.name} has ${company.employeeIds.length} employee${company.employeeIds.length === 1 ? '' : 's'}. A division needs a team to run it — hire first.`);
      }
      const division: Division = {
        id: s.nextId('division'),
        saveId: s.universe.meta.id,
        companyId: company.id,
        name: p.name,
        focus: p.focus,
        headId: p.headId,
        budget: p.budget ?? 0,
        spent: 0,
        employeeIds: [],
        projectIds: [],
        createdAt: s.now,
      };
      s.universe.divisions[division.id] = division;
      company.divisionIds.push(division.id);
      s.emit('company.division_created', { companyId: company.id, divisionId: division.id, name: p.name });
      return { divisionId: division.id };
    },
  );

  sim.onCommand<{ companyId: Id; title: string; personId?: Id; divisionId?: Id; salary?: Money }, { employeeId: Id; annualSalary: Money; authority: Money }>(
    'co.hire',
    (p, { sim: s }) => {
      const company = s.universe.companies[p.companyId];
      if (!company) throw new CommandError('No such company.');
      const template = COMPANY_ROLES.find((r) => r.title === p.title);
      if (!template) throw new CommandError(`There is no standard role called "${p.title}".`);

      const col = costOfLiving(company.headquartersLocationId);
      const salary = p.salary ?? Math.round(template.baseSalary * col);

      // Can the company actually carry the payroll?
      const currentPayroll = company.employeeIds.reduce((sum, id) => sum + (s.universe.employees[id]?.annualSalary ?? 0), 0);
      const cash = s.ledger.availableFunds(company.cashAccountId);
      const runwayMonths = (currentPayroll + salary) > 0 ? cash / ((currentPayroll + salary) / 12) : 99;
      if (runwayMonths < 4) {
        throw new CommandError(
          `${company.name} has ${formatMoney(cash)}. Adding ${formatMoney(salary)} a year would leave under four months of payroll runway.`,
        );
      }

      const personId = p.personId ?? createExecutive(s, company, template);
      const person = s.universe.people[personId];
      if (!person) throw new CommandError('No such person.');

      const employee: Employee = {
        id: s.nextId('employee'),
        saveId: s.universe.meta.id,
        companyId: company.id,
        divisionId: p.divisionId,
        personId,
        title: template.title,
        department: template.department,
        annualSalary: salary,
        authority: Math.round(company.greenlightCeiling * template.authorityShare),
        performance: 60,
        hiredAt: s.now,
      };
      s.universe.employees[employee.id] = employee;
      company.employeeIds.push(employee.id);
      if (p.divisionId) s.universe.divisions[p.divisionId]?.employeeIds.push(employee.id);
      person.affiliationId = company.id;
      person.greenlightAuthority = Math.max(person.greenlightAuthority, employee.authority);

      s.remember({
        category: 'company',
        title: `${person.displayName} joined ${company.name}`,
        detail: `${template.title}, ${formatMoney(salary)} a year.`,
        refs: [{ type: 'company', id: company.id }, { type: 'person', id: personId }],
        significance: 30, public: false, amount: salary,
      });
      s.emit('company.hired', { companyId: company.id, employeeId: employee.id, personId, title: template.title, salary });
      return { employeeId: employee.id, annualSalary: salary, authority: employee.authority };
    },
  );

  sim.onCommand<{ employeeId: Id; reason?: string }, { severance: Money }>(
    'co.terminate',
    (p, { sim: s }) => {
      const employee = s.universe.employees[p.employeeId];
      if (!employee || employee.departedAt) throw new CommandError('That person does not work there.');
      const company = s.universe.companies[employee.companyId];
      if (!company) throw new CommandError('No such company.');

      const monthsServed = (s.now - employee.hiredAt) / (30.44 * MS_DAY);
      const severance = Math.round(employee.annualSalary / 12 * clamp(monthsServed / 12, 0.5, 6));
      if (s.ledger.availableFunds(company.cashAccountId) >= severance) {
        const person = s.universe.people[employee.personId];
        const to = person?.primaryAccountId;
        if (to) s.transfer(company.cashAccountId, to, severance, `${company.name} — severance`, 'business', { refType: 'employee', refId: employee.id });
      }

      employee.departedAt = s.now;
      company.employeeIds = company.employeeIds.filter((id) => id !== employee.id);
      const person = s.universe.people[employee.personId];
      if (person) {
        person.affiliationId = undefined;
        person.greenlightAuthority = 0;
      }
      s.emit('company.terminated', { companyId: company.id, employeeId: employee.id, reason: p.reason });
      return { severance };
    },
  );

  sim.onCommand<{ companyId: Id; templateName?: string; gearId?: string; acquire: 'purchase' | 'rental'; days?: number; projectId?: Id }, { equipmentId: Id; cost: Money }>(
    'co.acquire_equipment',
    (p, { sim: s }) => {
      const company = s.universe.companies[p.companyId];
      if (!company) throw new CommandError('No such company.');
      const template = EQUIPMENT_CATALOG.find((e) => e.gearId === p.gearId || e.name === p.templateName);
      if (!template) throw new CommandError('No such equipment.');
      if (p.acquire === 'purchase' && template.rentalOnly) {
        throw new CommandError(`${template.brand} does not sell the ${template.name}. It is rented, with the crew that comes with it.`);
      }

      const days = clamp(p.days ?? 30, 1, 365);
      const cost = p.acquire === 'purchase' ? template.price : template.dailyRental * days;
      if (s.ledger.availableFunds(company.cashAccountId) < cost) {
        throw new CommandError(
          `${p.acquire === 'purchase' ? 'Buying' : `Renting for ${days} days`} costs ${formatMoney(cost)} and ${company.name} has ${formatMoney(s.ledger.availableFunds(company.cashAccountId))}.`,
        );
      }
      s.expense(company.cashAccountId, cost, `${template.name} — ${p.acquire}`, 'equipment', { refType: 'company', refId: company.id });

      const equipment: Equipment = {
        id: s.nextId('equip'),
        saveId: s.universe.meta.id,
        ownerId: company.id,
        ownerKind: 'company',
        category: template.category,
        name: template.name,
        brand: template.brand,
        purchasePrice: cost,
        currentValue: p.acquire === 'purchase' ? template.price : 0,
        condition: 100,
        acquiredAt: s.now,
        acquiredVia: p.acquire,
        rentalEndsAt: p.acquire === 'rental' ? addDays(s.now, days, s.homeZone) : undefined,
        assignedToProjectId: p.projectId,
        maintenanceDueAt: p.acquire === 'purchase' ? addDays(s.now, 180, s.homeZone) : undefined,
        qualityRating: template.qualityRating,
      };
      s.universe.equipment[equipment.id] = equipment;
      company.equipmentIds.push(equipment.id);
      recomputeCeiling(s, company.id);
      s.emit('company.equipment_acquired', { companyId: company.id, equipmentId: equipment.id, cost, via: p.acquire });
      return { equipmentId: equipment.id, cost };
    },
  );

  sim.onCommand<{ companyId: Id; name: string; category: MerchandiseLine['category']; projectId?: Id; franchiseId?: Id; units: number; unitCost: Money; retailPrice: Money; royaltyRate?: number }, { lineId: Id; investment: Money }>(
    'co.launch_merchandise',
    (p, { sim: s }) => {
      const company = s.universe.companies[p.companyId];
      if (!company) throw new CommandError('No such company.');
      if (p.retailPrice <= p.unitCost) throw new CommandError('The retail price has to exceed the unit cost or every sale loses money.');

      // You need the merchandising rights.
      if (p.projectId) {
        const project = s.universe.projects[p.projectId];
        const rights = project?.rightsId ? s.universe.rights[project.rightsId] : undefined;
        if (!rights?.scope.merchandisingRights) {
          throw new CommandError(`The rights held on ${project?.title ?? 'that project'} do not include merchandising.`);
        }
      }

      const investment = p.unitCost * p.units;
      if (s.ledger.availableFunds(company.cashAccountId) < investment) {
        throw new CommandError(`Manufacturing ${p.units.toLocaleString('en-US')} units costs ${formatMoney(investment)} up front.`);
      }
      s.expense(company.cashAccountId, investment, `${p.name} — manufacturing`, 'merchandise', { refType: 'company', refId: company.id });

      const line: MerchandiseLine = {
        id: s.nextId('item'),
        saveId: s.universe.meta.id,
        ownerCompanyId: company.id,
        projectId: p.projectId,
        franchiseId: p.franchiseId,
        name: p.name,
        category: p.category,
        unitCost: p.unitCost,
        retailPrice: p.retailPrice,
        unitsManufactured: p.units,
        unitsSold: 0,
        unitsReturned: 0,
        inventoryValue: investment,
        revenue: 0,
        royaltyRate: p.royaltyRate ?? 0,
        royaltiesPaid: 0,
        launchedAt: s.now,
        status: 'selling',
      };
      s.universe.merchandise[line.id] = line;

      s.schedule({
        at: addDays(s.now, 30, s.homeZone),
        kind: 'co.merch_cycle',
        label: `${p.name} — Sales Cycle`,
        category: 'business',
        payload: { lineId: line.id },
        priority: 78,
        refType: 'company', refId: company.id,
      });
      s.emit('company.merchandise_launched', { companyId: company.id, lineId: line.id, units: p.units, investment });
      return { lineId: line.id, investment };
    },
  );
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

/**
 * What the company can actually commit to a single project.
 *
 * Derived from liquid cash, borrowing capacity, library value and track record.
 * This is the guard that makes "build a studio empire" a progression rather
 * than a text field.
 */
export function recomputeCeiling(sim: Simulation, companyId: Id): Money {
  const company = sim.universe.companies[companyId];
  if (!company) return 0;

  const cash = sim.ledger.availableFunds(company.cashAccountId);
  const credit = company.creditAccountId ? sim.ledger.availableFunds(company.creditAccountId) : 0;

  // Library: completed projects are collateral and a track record.
  const library = company.projectIds.reduce((sum, id) => {
    const project = sim.universe.projects[id];
    if (!project || project.phase !== 'library') return sum;
    return sum + Math.max(0, project.totalRevenue);
  }, 0);

  const delivered = company.projectIds.filter((id) => {
    const p = sim.universe.projects[id];
    return p && (p.phase === 'released' || p.phase === 'library');
  }).length;

  const profitable = company.projectIds.filter((id) => {
    const p = sim.universe.projects[id];
    return p && p.totalRevenue > p.totalCost && p.totalCost > 0;
  }).length;

  const trackRecord = delivered === 0
    ? 0.55
    : clamp(0.8 + (profitable / delivered) * 1.4, 0.6, 2.4);

  const equipment = company.equipmentIds.reduce((sum, id) => sum + (sim.universe.equipment[id]?.currentValue ?? 0), 0);
  const property = Object.values(sim.universe.properties)
    .filter((p) => p.ownerId === company.id && !p.soldAt)
    .reduce((sum, p) => sum + p.marketValue, 0);

  // A company can raise roughly three times its balance sheet against a slate.
  const balanceSheet = cash + credit + Math.round(library * 0.35) + Math.round(equipment * 0.5) + Math.round(property * 0.6);
  const ceiling = Math.round(balanceSheet * 2.6 * trackRecord * remap(company.reputation, 0, 100, 0.7, 1.6));

  company.greenlightCeiling = Math.max(0, ceiling);
  company.valuation = Math.max(
    balanceSheet,
    Math.round(balanceSheet + library * 0.8 + delivered * 250_000_00 * trackRecord),
  );

  // Executive authority tracks the ceiling.
  for (const employeeId of company.employeeIds) {
    const employee = sim.universe.employees[employeeId];
    if (!employee || employee.departedAt) continue;
    const template = COMPANY_ROLES.find((r) => r.title === employee.title);
    if (!template) continue;
    employee.authority = Math.round(company.greenlightCeiling * template.authorityShare);
    const person = sim.universe.people[employee.personId];
    if (person) person.greenlightAuthority = employee.authority;
  }

  return company.greenlightCeiling;
}

function createExecutive(sim: Simulation, company: Company, template: RoleTemplate): Id {
  const rng = sim.rng('executive', company.id, template.title, sim.counter('exec'));
  const name = generatePersonName(rng);
  const id = sim.nextId('person');

  const skills: Record<string, number> = {};
  for (const key of template.skills) skills[key] = rng.int(55, 92);
  skills['leadership'] = rng.int(45, 88);
  skills['operations'] = rng.int(40, 85);

  sim.universe.people[id] = {
    id, saveId: sim.universe.meta.id, isPlayer: false,
    firstName: name.first, lastName: name.last, displayName: `${name.first} ${name.last}`,
    pronouns: 'they/them',
    birthInstant: sim.now - rng.int(30, 60) * 365 * MS_DAY,
    homeRegionId: company.headquartersLocationId,
    citizenshipId: 'us',
    currentLocationId: company.headquartersLocationId,
    personality: {
      openness: rng.int(40, 88), conscientiousness: rng.int(60, 95), extraversion: rng.int(45, 92),
      agreeableness: rng.int(35, 80), emotionalStability: rng.int(45, 88),
      ambition: rng.int(65, 98), riskTolerance: rng.int(35, 85),
    },
    interests: [], goals: [], lifestyle: 'comfortable',
    background: `${template.title} at ${company.name}`,
    attributes: {}, traits: [], skills,
    wellbeing: { energy: 72, stress: 45, sleepDebt: 3, morale: 68, condition: 82, fitness: 55, travelFatigue: 0, nourishment: 72, hygiene: 80 },
    reputation: {
      publicFame: rng.int(0, 18), audienceAppeal: 50,
      professionalReputation: rng.int(48, 88), reliability: rng.int(60, 95),
      prestige: rng.int(20, 65), industryDemand: rng.int(35, 80), controversy: 0,
    },
    careerTrack: 'executive', representation: {}, quote: 0,
    creditIds: [], nominationIds: [], creditScore: rng.int(700, 820),
    tier: 'active', industryRole: template.title, affiliationId: company.id,
    greenlightAuthority: 0, createdAt: sim.now,
  };
  return id;
}

function runPayroll(sim: Simulation, companyId: Id): void {
  const company = sim.universe.companies[companyId];
  if (!company || company.dissolvedAt) return;

  const employees = company.employeeIds
    .map((id) => sim.universe.employees[id])
    .filter((e): e is Employee => Boolean(e) && !e?.departedAt);
  if (employees.length === 0) return;

  const total = employees.reduce((sum, e) => sum + Math.round(e.annualSalary / 26), 0);
  const available = sim.ledger.availableFunds(company.cashAccountId);

  if (available < total) {
    sim.requireDecision({
      urgency: 96, category: 'business',
      title: `${company.name} cannot make payroll`,
      detail: `${formatMoney(total)} is due to ${employees.length} employee${employees.length === 1 ? '' : 's'} and there is ${formatMoney(available)} in the account.`,
      route: '/workspace/company',
      refType: 'company', refId: company.id,
    });
    company.reputation = clamp(company.reputation - 8, 0, 100);
    for (const employee of employees) employee.performance = clamp(employee.performance - 10, 0, 100);
    sim.emit('company.payroll_missed', { companyId: company.id, due: total, available });
    return;
  }

  for (const employee of employees) {
    const person = sim.universe.people[employee.personId];
    const to = person?.primaryAccountId;
    const amount = Math.round(employee.annualSalary / 26);
    if (to) {
      sim.transfer(company.cashAccountId, to, amount, `${company.name} — salary`, 'salary', { refType: 'employee', refId: employee.id });
    } else {
      sim.expense(company.cashAccountId, amount, `${company.name} — payroll`, 'salary', { refType: 'employee', refId: employee.id });
    }
    // Executives get better at the job.
    const template = COMPANY_ROLES.find((r) => r.title === employee.title);
    if (person && template) {
      for (const key of template.skills) {
        person.skills[key] = clamp((person.skills[key] ?? 40) + 0.12, 0, 100);
      }
    }
  }
  recomputeCeiling(sim, company.id);
  sim.emit('company.payroll_paid', { companyId: company.id, total, headcount: employees.length });
}

function closeQuarter(sim: Simulation, companyId: Id): void {
  const company = sim.universe.companies[companyId];
  if (!company || company.dissolvedAt) return;

  const from = sim.now - 91 * MS_DAY;
  const accounts = new Set([company.cashAccountId, company.creditAccountId].filter(Boolean) as Id[]);
  let revenue = 0;
  let expenses = 0;

  for (const txn of sim.universe.transactions) {
    if (txn.at < from) continue;
    const delta = txn.postings.reduce((s, p) => (accounts.has(p.accountId) ? s + p.amount : s), 0);
    if (delta > 0) revenue += delta;
    else expenses += -delta;
  }

  const profit = revenue - expenses;
  // Reputation follows delivery and solvency, not ambition.
  const delivered = company.projectIds.filter((id) => {
    const p = sim.universe.projects[id];
    return p && p.phase === 'library' && sim.now - (p.releaseDate ?? 0) < 400 * MS_DAY;
  }).length;
  company.reputation = clamp(
    company.reputation + (profit > 0 ? 2 : -3) + delivered * 4,
    0, 100,
  );

  recomputeCeiling(sim, company.id);
  sim.emit('company.quarter_closed', { companyId: company.id, revenue, expenses, profit, valuation: company.valuation });

  if (profit < 0 && sim.ledger.availableFunds(company.cashAccountId) < Math.abs(profit)) {
    sim.requireDecision({
      urgency: 80, category: 'business',
      title: `${company.name} is burning cash`,
      detail: `Down ${formatMoneyCompact(-profit)} over the quarter with ${formatMoneyCompact(sim.ledger.availableFunds(company.cashAccountId))} left. It needs capital or costs need cutting.`,
      route: '/workspace/company',
      refType: 'company', refId: company.id,
    });
  }
}

function runMerchandiseCycle(sim: Simulation, lineId: Id): void {
  const line = sim.universe.merchandise[lineId];
  if (!line || line.status !== 'selling') return;
  const company = sim.universe.companies[line.ownerCompanyId];
  if (!company) return;

  const project = line.projectId ? sim.universe.projects[line.projectId] : undefined;
  const franchise = line.franchiseId ? sim.universe.franchises[line.franchiseId] : undefined;
  const rng = sim.rng('merch', line.id, sim.now);

  // Demand tracks how much the underlying property is loved right now.
  const heat = franchise
    ? franchise.strength - franchise.fatigue * 0.5
    : project
      ? (project.audienceScore ?? 45) * 0.6 + remap(project.boxOfficeDomestic, 0, 300_000_000_00, 0, 40)
      : 25;

  const monthsOut = (sim.now - line.launchedAt) / (30.44 * MS_DAY);
  const decay = Math.pow(0.62, monthsOut);
  const remaining = line.unitsManufactured - line.unitsSold - line.unitsReturned;
  if (remaining <= 0) {
    line.status = 'sold_out';
    return;
  }

  const sellThrough = clamp(remap(heat, 0, 100, 0.02, 0.34) * decay * rng.float(0.7, 1.35), 0, 0.85);
  const sold = Math.min(remaining, Math.round(line.unitsManufactured * sellThrough));
  const returns = Math.round(sold * rng.float(0.02, 0.09));
  const net = sold - returns;

  if (net > 0) {
    const revenue = net * line.retailPrice;
    line.unitsSold += sold;
    line.unitsReturned += returns;
    line.revenue += revenue;
    line.inventoryValue = Math.max(0, (line.unitsManufactured - line.unitsSold + line.unitsReturned) * line.unitCost);

    sim.income(company.cashAccountId, revenue, `${line.name} — sales`, 'merchandise', { refType: 'company', refId: company.id });

    if (line.royaltyRate > 0 && project) {
      const royalty = applyRate(revenue, line.royaltyRate);
      const rightsHolder = project.rightsId ? sim.universe.rights[project.rightsId] : undefined;
      const to = rightsHolder?.holderKind === 'person'
        ? sim.universe.people[rightsHolder.holderId]?.primaryAccountId
        : rightsHolder ? sim.universe.companies[rightsHolder.holderId]?.cashAccountId : undefined;
      if (to && sim.ledger.availableFunds(company.cashAccountId) >= royalty) {
        sim.transfer(company.cashAccountId, to, royalty, `${line.name} — royalty`, 'merchandise', { refType: 'company', refId: company.id });
        line.royaltiesPaid += royalty;
      }
    }
    if (franchise) franchise.merchandiseRevenue += revenue;
  }

  const stillHave = line.unitsManufactured - line.unitsSold;
  if (stillHave <= 0) {
    line.status = 'sold_out';
    sim.notify({
      category: 'business', title: `${line.name} sold out`,
      body: `${line.unitsSold.toLocaleString('en-US')} units, ${formatMoneyCompact(line.revenue)} of revenue.`,
      importance: 52, route: '/workspace/company',
    });
  } else if (monthsOut > 14) {
    // Overstock has to be written down.
    line.status = 'discontinued';
    const writeDown = line.inventoryValue;
    if (writeDown > 0) {
      sim.expense(company.cashAccountId, Math.min(writeDown, sim.ledger.availableFunds(company.cashAccountId)), `${line.name} — inventory write-down`, 'merchandise', { refType: 'company', refId: company.id });
      line.inventoryValue = 0;
    }
    sim.notify({
      category: 'business', title: `${line.name} discontinued`,
      body: `${stillHave.toLocaleString('en-US')} units unsold, written down at ${formatMoneyCompact(writeDown)}.`,
      importance: 48, route: '/workspace/company',
    });
  } else {
    sim.schedule({
      at: addDays(sim.now, 30, sim.homeZone),
      kind: 'co.merch_cycle',
      label: `${line.name} — Sales Cycle`,
      category: 'business',
      payload: { lineId: line.id },
      priority: 78,
      refType: 'company', refId: company.id,
    });
  }

  recomputeCeiling(sim, company.id);
  sim.emit('company.merchandise_cycle', { lineId: line.id, sold, revenue: net * line.retailPrice });
}

// ---------------------------------------------------------------------------
// Read models
// ---------------------------------------------------------------------------

export function companyDashboard(sim: Simulation, companyId: Id) {
  const company = sim.universe.companies[companyId];
  if (!company) return undefined;

  const employees = company.employeeIds
    .map((id) => sim.universe.employees[id])
    .filter((e): e is Employee => Boolean(e) && !e?.departedAt);
  const payrollAnnual = employees.reduce((s, e) => s + e.annualSalary, 0);
  const cash = sim.ledger.availableFunds(company.cashAccountId);

  const projects = company.projectIds.map((id) => sim.universe.projects[id]).filter(Boolean);
  const inProduction = projects.filter((p) => p && ['preproduction', 'production', 'post'].includes(p.phase)).length;
  const released = projects.filter((p) => p && (p.phase === 'released' || p.phase === 'library'));

  const libraryValue = released.reduce((s, p) => s + Math.max(0, p?.totalRevenue ?? 0), 0);
  const committed = projects.reduce((s, p) => {
    if (!p || p.phase === 'released' || p.phase === 'library') return s;
    return s + Math.max(0, p.budget - p.spent);
  }, 0);

  return {
    company,
    cash,
    committed,
    uncommitted: Math.max(0, cash - committed),
    payrollAnnual,
    runwayMonths: payrollAnnual > 0 ? Number((cash / (payrollAnnual / 12)).toFixed(1)) : undefined,
    headcount: employees.length,
    employees,
    divisions: company.divisionIds.map((id) => sim.universe.divisions[id]).filter(Boolean),
    projects,
    inProduction,
    releasedCount: released.length,
    libraryValue,
    equipment: company.equipmentIds.map((id) => sim.universe.equipment[id]).filter(Boolean),
    merchandise: Object.values(sim.universe.merchandise).filter((m) => m.ownerCompanyId === company.id),
  };
}

/** Companies the player owns any part of. */
export function playerCompanies(sim: Simulation): Company[] {
  return Object.values(sim.universe.companies)
    .filter((c) => !c.dissolvedAt && c.ownerships.some((o) => o.holderId === sim.universe.playerId))
    .sort((a, b) => b.valuation - a.valuation);
}

/** Explains the greenlight ceiling in plain language for the help panel. */
export function explainCeiling(sim: Simulation, companyId: Id): string[] {
  const company = sim.universe.companies[companyId];
  if (!company) return [];
  const cash = sim.ledger.availableFunds(company.cashAccountId);
  const delivered = company.projectIds.filter((id) => {
    const p = sim.universe.projects[id];
    return p && (p.phase === 'released' || p.phase === 'library');
  }).length;
  return [
    `Liquid cash of ${formatMoneyCompact(cash)} is the foundation of what you can commit.`,
    `Owned equipment and property add borrowing capacity against the slate.`,
    delivered === 0
      ? 'With nothing delivered yet, lenders and partners discount what you say you can do.'
      : `${delivered} delivered project${delivered === 1 ? '' : 's'} give you a track record, and the profitable ones multiply it.`,
    `Company reputation of ${company.reputation} out of 100 adjusts the whole figure.`,
    `That currently supports a single-project commitment of ${formatMoneyCompact(company.greenlightCeiling)}.`,
  ];
}
