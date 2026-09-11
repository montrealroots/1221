/**
 * SLATE — Engine entry point.
 *
 * `createSave` builds a new universe and puts the player into it. `loadSave`
 * rehydrates an existing one. Both return a Simulation with every system
 * registered, which is the only object the UI ever talks to.
 *
 * What is registered here is now short: wellbeing and sleep, and the world
 * itself. The industry, the shops, the schools and everything else that used
 * to hang off this file went with the screens that showed them.
 */

import { Simulation, type Command, type CommandResult } from './core/simulation';
import type { Household, Premise, Property, SaveUniverse } from './domain/model';
import { SAVE_SCHEMA_VERSION, PREMISE_STATEMENT } from './domain/model';
import { addDays, formatDate, instantFromZoned, zonedParts, MS_DAY } from './core/time';
import { formatMoneyCompact } from './core/money';
import { clamp } from './core/rng';
import { PERFORMER_TITLES, impliedPerformerTitle, performerTitleOf } from './core/performer';
import { unknownTaste } from './core/taste';
import { titleCaseLabel } from './core/text';

import { CITIES } from './content/geography';

import { netWorth } from './systems/finance';
import { registerLife, startOfLocalDay } from './systems/life';
import { populateFamily } from './world/family';
import { buildTheLot, registerLot } from './world/lot';
import { registerSugar, seedTheQuota } from './world/sugar';
import { registerMaking } from './world/making';
import {
  companiesOf, foundTheCompany, foundTheSugarGroup, holdingsOf, postsOf, projectsOf, registerCompanyCommands,
} from './world/company';
import { registerPlans } from './world/plans';
import { registerWorld } from './world/world';
import { ESTATE_ACRES, HOUSE, estateCity } from './content/estate';
import {
  createUniverse, defaultConfig, WEALTH_PROFILES, careerLabel, type NewSaveConfig,
} from './world/bootstrap';

export * from './world/bootstrap';
export { Simulation };
export type { Command, CommandResult };

/**
 * Registers every system onto a simulation. Order matters only for event
 * reactor priority, which each system declares for itself.
 */
export function registerAllSystems(sim: Simulation): void {
  registerLife(sim);
  registerWorld(sim);
  registerPlans(sim);
  registerCompanyCommands(sim);
  registerLot(sim);
  registerSugar(sim);
  registerMaking(sim);
}

/** Recurring world processes every save needs running. */
function armWorldClock(sim: Simulation): void {
  const z = sim.homeZone;

  sim.schedule({
    at: addDays(startOfLocalDay(sim), 1, z),
    kind: 'life.day_rollover',
    label: 'New Day', category: 'system', priority: 5,
  });

  sim.schedule({
    at: addDays(sim.now, 2, z),
    kind: 'world.tick',
    label: 'World Simulation', category: 'system', priority: 96,
  });
}

/** Builds the player's starting situation. */
function populateWorld(sim: Simulation, config: NewSaveConfig): void {
  const player = sim.player;
  const cityId = config.startLocationId;
  const wealth = WEALTH_PROFILES[config.wealth];

  // --- Household ----------------------------------------------------------
  const household: Household = {
    id: sim.nextId('household'),
    saveId: sim.universe.meta.id,
    name: `${player.lastName} household`,
    memberIds: [player.id],
    dependentIds: [],
    headIds: [player.id],
    formedAt: sim.now,
    historyNotes: [],
  };
  sim.universe.households[household.id] = household;
  player.householdId = household.id;

  // --- Accounts -----------------------------------------------------------
  const checking = sim.openAccount({
    id: sim.nextId('account'),
    kind: 'checking',
    name: 'Everyday Checking',
    ownerId: player.id,
    institution: 'Northbank',
    openedAt: sim.now,
    last4: '4417',
    balance: wealth.checking,
  });
  player.primaryAccountId = checking.id;

  if (wealth.savings > 0) {
    sim.openAccount({
      id: sim.nextId('account'),
      kind: 'savings',
      name: 'Savings',
      ownerId: player.id,
      institution: 'Northbank',
      openedAt: sim.now,
      last4: '8802',
      balance: wealth.savings,
    });
  }

  if (wealth.cardLimit > 0) {
    const card = sim.openAccount({
      id: sim.nextId('account'),
      kind: 'credit_card',
      name: 'Northbank Everyday Card',
      ownerId: player.id,
      institution: 'Northbank',
      openedAt: sim.now - 400 * MS_DAY,
      creditLimit: wealth.cardLimit,
      apr: 0.2249,
      last4: '9931',
    });
    if (wealth.cardBalance < 0) {
      const expense = sim.nominalAccount('expense', 'Prior spending');
      sim.post({
        memo: 'Balance carried from before',
        category: 'opening',
        postings: [
          { accountId: card.id, amount: wealth.cardBalance },
          { accountId: expense.id, amount: -wealth.cardBalance },
        ],
      });
    }
  }

  // --- Housing ------------------------------------------------------------
  // The house on the family land. Not bought, not rented, not a rung on any
  // ladder: the tenure, the monthly rent, the market value and the bedroom
  // count that stood for how well you were doing all described somebody
  // working their way up, and that is not who this is. What survives is the
  // one thing the simulation needs — a roof with a condition, so a night in it
  // goes better than a night without one.
  const property: Property = {
    id: sim.nextId('prop'),
    saveId: sim.universe.meta.id,
    ownerKind: 'none',
    kind: 'house',
    name: HOUSE.name,
    addressLine: `${ESTATE_ACRES.toLocaleString('en-US')} acres, ${estateCity().name}`,
    locationId: cityId,
    tenure: 'owned',
    bedrooms: HOUSE.bedrooms,
    bathrooms: 4,
    interiorSqft: HOUSE.interiorSqft,
    lotSqft: ESTATE_ACRES * 43_560,
    yearBuilt: HOUSE.yearBuilt,
    features: [],
    marketValue: 0,
    condition: HOUSE.condition,
    annualPropertyTaxRate: 0,
    structureIds: [],
    isPrimaryResidence: true,
    createdAt: sim.now,
  };
  sim.universe.properties[property.id] = property;
  player.residenceId = property.id;
  household.residenceId = property.id;

  // --- The family ---------------------------------------------------------
  // Last, because everybody in it lives in the house the lines above just
  // built and belongs to the household above that. The land has been theirs
  // since before the player was born; until this ran, none of them existed.
  const stream = sim.rng('family');
  populateFamily(sim.universe, config.family, (ns) => sim.nextId(ns), () => stream.next());

  // --- The business -------------------------------------------------------
  // After the family, because the company is owned by the parents and staffed
  // by whoever the player said runs what. The Your People step decides who is
  // the principal of a production company, which is a heavier thing than the
  // step lets on.
  // The sugar first, because it is older than everything else here and it is
  // what pays for all of it. The family has been in cane since long before
  // anybody thought about a stage.
  foundTheSugarGroup(sim);
  seedTheQuota(sim);
  const company = foundTheCompany(sim);

  // --- The lot ------------------------------------------------------------
  // After the company, because the company owns it. The land was the family's
  // already; the stages on it were built, and they have been costing money
  // every month since.
  buildTheLot(sim, company.id);

  armWorldClock(sim);
}

/** Keeps the save-slot summary in step with the world. */
export function refreshMeta(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  const worth = netWorth(sim, player.id);
  sim.universe.meta.characterName = player.displayName;
  sim.universe.meta.portrait = player.portrait;
  sim.universe.meta.performerTitle = player.performerTitle;
  sim.universe.meta.careerLabel = careerLabel(player.careerTrack, performerTitleOf(player));
  sim.universe.meta.locationLabel = CITIES.get(player.currentLocationId)?.name ?? 'Unknown';
  sim.universe.meta.worldDateLabel = formatDate(sim.now, sim.homeZone);
  sim.universe.meta.netWorthLabel = formatMoneyCompact(worth.total);
  sim.universe.meta.lastPlayedAt = sim.now;
}

/** Creates a brand new save universe with every system wired up. */
export function createSave(slot: 1 | 2 | 3, seed: string, config: NewSaveConfig): Simulation {
  const { universe } = createUniverse(slot, seed, config);
  const sim = new Simulation(universe);
  registerAllSystems(sim);
  populateWorld(sim, config);
  return sim;
}

/** Rehydrates an existing universe. */
export function loadSave(universe: SaveUniverse): Simulation {
  const sim = new Simulation(universe);
  registerAllSystems(sim);

  // A save whose clock has fallen off — because it was written by a build that
  // scheduled something this one no longer handles — gets it put back. Both
  // are idempotent: nothing is scheduled twice.
  const armed = (kind: string) =>
    sim.universe.scheduled.some((one) => one.kind === kind && one.status === 'pending');
  if (!armed('life.day_rollover')) {
    sim.schedule({
      at: addDays(startOfLocalDay(sim), 1, sim.homeZone),
      kind: 'life.day_rollover',
      label: 'New Day', category: 'system', priority: 5,
    });
  }
  if (!armed('world.tick')) {
    sim.schedule({
      at: addDays(sim.now, 2, sim.homeZone),
      kind: 'world.tick',
      label: 'World Simulation', category: 'system', priority: 96,
    });
  }
  return sim;
}

// ---------------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------------

export interface MigrationResult {
  migrated: boolean;
  from: number;
  to: number;
  steps: string[];
  problems: string[];
}

/**
 * Brings an older save forward.
 *
 * This build reads a much smaller world than the ones before it: the shops,
 * the studios, the schools and the rest are gone, and so are the collections
 * that held them. A save from one of those builds still opens — its player,
 * its money, its home, its calendar and its history are all still here — and
 * the parts this build has no screen for are left on the object untouched
 * rather than deleted, so a save is never made smaller than the build that
 * wrote it. Anything genuinely missing is created empty.
 */
export function migrate(universe: SaveUniverse): MigrationResult {
  const from = universe.meta.schemaVersion ?? 1;
  const steps: string[] = [];
  const problems: string[] = [];

  if (from > SAVE_SCHEMA_VERSION) {
    problems.push(
      `This save was written by a newer version of SLATE (schema ${from}, this build understands ${SAVE_SCHEMA_VERSION}). Loading it could corrupt it.`,
    );
    return { migrated: false, from, to: SAVE_SCHEMA_VERSION, steps, problems };
  }

  // Every collection this build reads, created empty where a save predates it.
  const record = <K extends keyof SaveUniverse>(key: K, label: string) => {
    if (!universe[key]) {
      (universe as unknown as Record<string, unknown>)[key as string] = {};
      steps.push(`Created ${label}.`);
    }
  };
  const list = <K extends keyof SaveUniverse>(key: K, label: string) => {
    if (!Array.isArray(universe[key])) {
      (universe as unknown as Record<string, unknown>)[key as string] = [];
      steps.push(`Created ${label}.`);
    }
  };

  record('people', 'the people');
  record('households', 'the households');
  record('bonds', 'the bonds between people');
  record('companies', 'the family business');
  record('registrations', 'the registers it is on');
  record('signatures', 'the guilds it has signed with');
  record('policies', 'the cover it carries');
  record('holdings', 'the material it holds');
  record('posts', 'the posts it keeps');
  record('projects', 'the slate');
  record('properties', 'the properties');
  record('stages', 'the stages on the lot');
  record('bookings', 'who is booked onto them');
  list('quotaYears', 'what America let in each year');
  record('accounts', 'the accounts');
  record('decisions', 'the decision center');
  record('idempotency', 'the command receipts');
  record('counters', 'the counters');
  list('transactions', 'the transactions');
  list('scheduled', 'the timeline');
  list('audits', 'the audit trail');
  list('history', 'the history');
  list('notifications', 'the notifications');
  list('engineFailures', 'the failure log');

  if (typeof universe.__idCounter !== 'number') {
    universe.__idCounter = 100_000;
    steps.push('Reset the id counter above any existing id.');
  }

  // Schema 10 put the clock on real time. A save from before it carries the
  // old 'standard' speed, which ran a world minute for every real second.
  const preferences = universe.preferences as { timeSpeed?: string } | undefined;
  if (preferences?.timeSpeed === 'standard') {
    preferences.timeSpeed = 'live';
    steps.push('Moved the clock to real time.');
  }

  // Schema 11 put every label in Title Case. Labels are written into the save
  // when they are created, so an older save would go on reading 'New day'
  // forever while a fresh one read 'New Day'.
  let relabelled = 0;
  const relabel = <T extends Record<string, unknown>>(rows: T[] | undefined, field: keyof T & string) => {
    for (const row of rows ?? []) {
      const value = row[field];
      if (typeof value !== 'string') continue;
      const next = titleCaseLabel(value);
      if (next !== value) {
        (row as Record<string, unknown>)[field] = next;
        relabelled++;
      }
    }
  };
  relabel(universe.scheduled as unknown as Record<string, unknown>[], 'label');
  relabel(universe.notifications as unknown as Record<string, unknown>[], 'title');
  relabel(universe.history as unknown as Record<string, unknown>[], 'title');
  relabel(Object.values(universe.decisions ?? {}) as unknown as Record<string, unknown>[], 'title');
  if (relabelled > 0) {
    steps.push(`Put ${relabelled} stored label${relabelled === 1 ? '' : 's'} into Title Case.`);
  }

  // Schema 73 took heritage, the parents' heritages, and the adult height and
  // weight off the character. Nothing ever read them after creation, so they
  // are dropped rather than carried: a save that keeps fields nothing reads
  // teaches the next reader that something does.
  {
    let dropped = 0;
    for (const person of Object.values(universe.people)) {
      const row = person as unknown as Record<string, unknown>;
      for (const field of ['heritageId', 'parentHeritageIds', 'adultHeightCm', 'adultWeightKg']) {
        if (field in row) {
          delete row[field];
          dropped++;
        }
      }
    }
    if (dropped > 0) {
      steps.push(`Dropped ${dropped} field${dropped === 1 ? '' : 's'} nothing reads any more.`);
    }
  }

  // Every record must belong to this save and nothing else. Cross-save
  // contamination is the one corruption that is invisible until it matters.
  {
    const saveId = universe.meta.id;
    let reassigned = 0;
    const stamp = (entries: { saveId?: string }[]) => {
      for (const entity of entries) {
        if (entity && typeof entity === 'object' && 'saveId' in entity && entity.saveId !== saveId) {
          entity.saveId = saveId;
          reassigned++;
        }
      }
    };
    stamp(Object.values(universe.people));
    stamp(Object.values(universe.households));
    stamp(Object.values(universe.properties));
    stamp(Object.values(universe.accounts));
    stamp(Object.values(universe.decisions));
    stamp(universe.transactions);
    stamp(universe.scheduled);
    stamp(universe.audits);
    stamp(universe.history);
    stamp(universe.notifications);
    if (reassigned > 0) steps.push(`Re-stamped ${reassigned} record${reassigned === 1 ? '' : 's'} onto this save.`);
  }

  // Schema 72 made the premise part of the save. SLATE is an actor and actress
  // simulator; a save that does not say so is brought forward rather than
  // refused, and the title it should have been carrying all along is settled
  // from what the player stated, or from their pronouns where they stated
  // nothing. Both routes are recorded, because which one happened is itself
  // worth keeping.
  {
    const player = universe.people?.[universe.playerId];
    for (const person of Object.values(universe.people ?? {})) {
      if (!person.performerTitle) {
        person.performerTitle = impliedPerformerTitle(person.pronouns);
        steps.push(`Settled ${person.displayName}'s title from their pronouns.`);
      }
    }
    if (player && universe.meta.performerTitle !== player.performerTitle) {
      universe.meta.performerTitle = player.performerTitle;
      steps.push('Mirrored the player’s title onto the save.');
    }
    // A save written before the genre was named in full carries the old kind.
    // It is the same game, so it is restated rather than refused.
    const KNOWN_KINDS = ['actor-actress-life-simulator', 'actor-actress-simulator'];
    if (universe.premise && KNOWN_KINDS.includes(universe.premise.kind as string)
        && universe.premise.kind !== 'actor-actress-life-simulator') {
      universe.premise.kind = 'actor-actress-life-simulator';
      steps.push('Named the game in full: an actor and actress life simulator.');
    }
    if (!universe.premise || universe.premise.kind !== 'actor-actress-life-simulator') {
      const premise: Premise = {
        kind: 'actor-actress-life-simulator',
        statement: PREMISE_STATEMENT,
        titles: PERFORMER_TITLES,
        equalStanding: true,
        playerTitle: player?.performerTitle ?? 'actor',
        playerTitleSource: 'implied',
        recordedAt: universe.meta.createdAt ?? universe.now,
      };
      universe.premise = premise;
      steps.push('Wrote the premise into the save: an actor and actress life simulator.');
    } else {
      // It is there, but it must still agree with the person it is about.
      if (player && universe.premise.playerTitle !== player.performerTitle) {
        universe.premise.playerTitle = player.performerTitle;
        steps.push('Brought the premise’s title back into step with the player.');
      }
      if (universe.premise.statement !== PREMISE_STATEMENT) {
        universe.premise.statement = PREMISE_STATEMENT;
        steps.push('Restated the premise in this build’s words.');
      }
    }
  }

  // Schema 78: a company says which business it is in. Before the sugar group
  // there was only one, so anything without a trade is a film company.
  let traded = 0;
  for (const company of Object.values(universe.companies ?? {})) {
    const c = company as unknown as Record<string, unknown>;
    if (c.trade === undefined) { c.trade = 'film'; traded += 1; }
  }
  if (traded > 0) steps.push(`Marked ${traded === 1 ? 'one company' : `${traded} companies`} as being in film.`);

  // Schema 78: a picture carries the elements it has handed over.
  for (const project of Object.values(universe.projects ?? {})) {
    const p = project as unknown as Record<string, unknown>;
    if (!Array.isArray(p.delivered)) p.delivered = [];
  }

  if (!universe.preferences) {
    universe.preferences = {
      reducedMotion: false, audioEnabled: true, audioVolume: 0.6,
      timeSpeed: 'live', compactMode: false, showAdvancedNumbers: false,
      confirmLargePurchases: true, largePurchaseThreshold: 5_000_00,
    };
    steps.push('Created the preferences.');
  }

  // Schema 78: the attribute and skill sheets became a base plus its
  // exceptions. Before this every person carried all 813 attribute ids and all
  // 47 skill ids written out, and for almost everybody they were all the same
  // number — 20KB of JSON per person, and 63ms of structuredClone on every
  // command once a save held a thousand people. Both measured. The old shape
  // is folded into the new one by taking the number that appears most often as
  // the base and keeping only what differs.
  const fold = (sheet: unknown, fallback: number): { base: number; of?: Record<string, number> } => {
    if (sheet === null || typeof sheet !== 'object') return { base: fallback };
    const flat = sheet as Record<string, unknown>;
    if (typeof flat.base === 'number') return sheet as { base: number; of?: Record<string, number> };
    const entries = Object.entries(flat).filter(([, v]) => typeof v === 'number') as [string, number][];
    if (entries.length === 0) return { base: fallback };
    const seen = new Map<number, number>();
    for (const [, v] of entries) seen.set(v, (seen.get(v) ?? 0) + 1);
    let base = fallback;
    let most = -1;
    for (const [value, n] of seen) if (n > most) { most = n; base = value; }
    const of = Object.fromEntries(entries.filter(([, v]) => v !== base));
    return Object.keys(of).length > 0 ? { base, of } : { base };
  };
  let folded = 0;
  for (const person of Object.values(universe.people ?? {})) {
    const p = person as unknown as Record<string, unknown>;
    const wasFlat = typeof (p.attributes as Record<string, unknown>)?.base !== 'number'
      || typeof (p.skills as Record<string, unknown>)?.base !== 'number';
    p.attributes = fold(p.attributes, 10);
    p.skills = fold(p.skills, 5);
    if (wasFlat) folded += 1;
  }
  if (folded > 0) {
    steps.push(`Folded ${folded === 1 ? 'one sheet' : `${folded} sheets`} down to a base and its exceptions.`);
  }

  const migrated = from < SAVE_SCHEMA_VERSION || steps.length > 0;
  if (from < SAVE_SCHEMA_VERSION) steps.push(`Schema ${from} to ${SAVE_SCHEMA_VERSION}.`);
  universe.meta.schemaVersion = SAVE_SCHEMA_VERSION;

  return { migrated, from, to: SAVE_SCHEMA_VERSION, steps, problems };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  checked: number;
}

/**
 * Structural validation of a universe. Run on load, before release, and by the
 * test suite. Anything here failing means the world is internally inconsistent.
 */
export function validateUniverse(universe: SaveUniverse): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  let checked = 0;

  const sim = new Simulation(universe);

  // Money must reconcile.
  for (const problem of sim.ledger.audit()) errors.push(problem);
  checked += universe.transactions.length;

  // The premise must be in the save, and it must be about the person it names.
  // SLATE is an actor and actress life simulator; a universe that has lost that is
  // not one this build will vouch for.
  checked++;
  const premise = universe.premise;
  if (!premise) errors.push('The save doesn’t say what game it is: the premise is missing.');
  else {
    if (premise.kind !== 'actor-actress-life-simulator') {
      errors.push(`The save claims to be a '${premise.kind}', which SLATE isn’t.`);
    }
    if (premise.equalStanding !== true) {
      errors.push('The premise no longer holds actor and actress as equals.');
    }
    if (![...PERFORMER_TITLES].every((title) => premise.titles.includes(title))) {
      errors.push('The premise has lost one of the two titles the game is about.');
    }
    if (!PERFORMER_TITLES.includes(premise.playerTitle)) {
      errors.push(`The premise gives the player the title '${premise.playerTitle}', which is neither actor nor actress.`);
    }
  }

  // The player must exist and be coherent.
  const player = universe.people[universe.playerId];
  if (!player) errors.push('The save has no player.');
  else {
    if (!player.isPlayer) errors.push('The player record isn’t flagged as the player.');
    if (!PERFORMER_TITLES.includes(player.performerTitle)) {
      errors.push(`The player’s title is '${player.performerTitle}', which is neither actor nor actress.`);
    }
    if (premise && premise.playerTitle !== player.performerTitle) {
      errors.push(
        `The premise says the player is an ${premise.playerTitle} and the player record says ${player.performerTitle}.`,
      );
    }
    if (universe.meta.performerTitle !== player.performerTitle) {
      errors.push(
        `The save summary says ${universe.meta.performerTitle} and the player record says ${player.performerTitle}.`,
      );
    }
    if (!CITIES.get(player.currentLocationId)) errors.push(`Player is in an unknown location '${player.currentLocationId}'.`);
    if (player.primaryAccountId && !universe.accounts[player.primaryAccountId]) {
      errors.push('Player primary account points at an account that doesn’t exist.');
    }
  }

  // --- The business -------------------------------------------------------
  // Seven tables that point at each other and at people, so every pointer is
  // checked. A company owned by nobody, an arm with no parent or a project
  // hanging off a right that was never acquired are all silent until the day
  // a screen tries to open one.
  const companies = companiesOf(universe);
  const parents = companies.filter((one) => !one.parentId);
  if (Object.keys(universe.companies).length > 0 && parents.length !== 1) {
    errors.push(`The family holds ${parents.length} parent companies, and it has to hold exactly one.`);
  }
  for (const company of companies) {
    const total = company.ownerships.reduce((sum, one) => sum + one.percent, 0);
    if (company.ownerships.length > 0 && total !== 100) {
      errors.push(`${company.name} is ${total}% owned, which is not how owning something works.`);
    }
    for (const owner of company.ownerships) {
      const known = owner.holderKind === 'person' ? universe.people[owner.holderId] : universe.companies[owner.holderId];
      if (!known) errors.push(`${company.name} is part-owned by somebody the save doesn’t have.`);
    }
    if (company.parentId && !universe.companies[company.parentId]) {
      errors.push(`${company.name} is an arm of a company that doesn’t exist.`);
    }
    if (!CITIES.get(company.locationId)) {
      errors.push(`${company.name} is registered in an unknown place '${company.locationId}'.`);
    }
  }
  const companyIds = new Set(Object.keys(universe.companies));
  const belongsTo = (companyId: string, what: string): void => {
    if (!companyIds.has(companyId)) errors.push(`${what} belongs to a company that doesn’t exist.`);
  };
  for (const one of Object.values(universe.registrations)) belongsTo(one.companyId, `Registration ${one.number}`);
  for (const one of Object.values(universe.signatures)) belongsTo(one.companyId, `The ${one.guild} signature`);
  for (const one of Object.values(universe.policies)) belongsTo(one.companyId, `The ${one.kind} policy`);
  for (const one of holdingsOf(universe)) belongsTo(one.companyId, `The rights to ${one.title}`);
  for (const one of postsOf(universe)) {
    belongsTo(one.companyId, `The ${one.role} post`);
    if (one.personId && !universe.people[one.personId]) {
      errors.push(`The ${one.role} post is filled by somebody the save doesn’t have.`);
    }
  }
  for (const one of projectsOf(universe)) {
    belongsTo(one.companyId, one.title);
    if (one.holdingId && !universe.holdings[one.holdingId]) {
      errors.push(`${one.title} hangs off rights the save doesn’t have.`);
    }
  }

  // Nobody may carry a trait, an interest or a genre this build has never
  // heard of. It is a warning rather than an error: the save is still sound,
  // the engine drops what it does not know, and the player loses only a line
  // on a sheet. Saying so is what stops it being noticed years later.
  for (const person of Object.values(universe.people)) {
    checked++;
    const strange = unknownTaste(person);
    if (strange.length > 0) {
      warnings.push(
        `${person.displayName} carries ${strange.length} taste${strange.length === 1 ? '' : 's'} `
        + `this build doesn’t know: ${strange.slice(0, 4).join(', ')}`
        + `${strange.length > 4 ? ', and more' : ''}. They’ll be ignored.`,
      );
    }
  }

  // Save isolation.
  const saveId = universe.meta.id;
  const check = (label: string, items: { saveId?: string }[]) => {
    for (const item of items) {
      checked++;
      if (item.saveId && item.saveId !== saveId) {
        errors.push(`A ${label} record belongs to save '${item.saveId}', not '${saveId}'. Cross-save contamination.`);
        break;
      }
    }
  };
  check('person', Object.values(universe.people));
  check('property', Object.values(universe.properties));
  check('account', Object.values(universe.accounts));
  check('scheduled', universe.scheduled);

  // Ownership conservation: nothing owned by someone who does not exist.
  // A property is owned by a person or by a company, and `ownerKind` says
  // which — the lot is owned by the family business, not by anybody in it.
  for (const property of Object.values(universe.properties)) {
    checked++;
    if (!property.ownerId) continue;
    const owner = property.ownerKind === 'company'
      ? universe.companies[property.ownerId]
      : universe.people[property.ownerId];
    if (!owner) {
      const who = property.ownerKind === 'company' ? 'a company that' : 'somebody who';
      errors.push(`Property ${property.id} is owned by '${property.ownerId}', ${who} doesn’t exist.`);
    }
  }

  // Households must hold real people.
  for (const household of Object.values(universe.households)) {
    checked++;
    for (const memberId of household.memberIds) {
      if (!universe.people[memberId]) {
        errors.push(`Household ${household.id} lists '${memberId}', who doesn’t exist.`);
        break;
      }
    }
  }

  // The timeline must be sorted and every pending item in the future or due.
  for (let i = 1; i < universe.scheduled.length; i++) {
    const prev = universe.scheduled[i - 1];
    const cur = universe.scheduled[i];
    if (prev && cur && prev.at > cur.at) {
      errors.push('The timeline isn’t sorted by time. Advancement would process events out of order.');
      break;
    }
  }

  // Everybody in a save carries one of the two titles. Nobody is untitled and
  // nobody is something else.
  for (const person of Object.values(universe.people)) {
    checked++;
    if (!PERFORMER_TITLES.includes(person.performerTitle)) {
      errors.push(`${person.displayName} has the title '${person.performerTitle}', which is neither actor nor actress.`);
      break;
    }
  }

  // Wellbeing must stay inside its bounds.
  for (const person of Object.values(universe.people)) {
    checked++;
    const w = person.wellbeing;
    for (const [key, value] of Object.entries(w)) {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        errors.push(`${person.displayName} has a non-numeric wellbeing value for ${key}.`);
        break;
      }
      if (key !== 'sleepDebt' && (value < 0 || value > 100)) {
        errors.push(`${person.displayName} has ${key} at ${value}, outside 0 to 100.`);
        break;
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings, checked };
}

/** Convenience for tests and the developer console. */
export function quickSave(config?: Partial<NewSaveConfig>, seed = 'slate-test-seed', slot: 1 | 2 | 3 = 1): Simulation {
  return createSave(slot, seed, { ...defaultConfig(), ...config });
}

export { clamp, instantFromZoned, zonedParts };
