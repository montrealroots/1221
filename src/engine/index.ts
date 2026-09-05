/**
 * SLATE — Engine entry point.
 *
 * `createSave` builds a new universe and populates the world around the player.
 * `loadSave` rehydrates an existing one. Both return a Simulation with every
 * system registered, which is the only object the UI ever talks to.
 */

import { Simulation, type Command, type CommandResult } from './core/simulation';
import type { Id, SaveUniverse } from './domain/model';
import { SAVE_SCHEMA_VERSION } from './domain/model';
import { addDays, addMonths, formatDate, instantFromZoned, zonedParts, MS_DAY } from './core/time';
import { formatMoneyCompact } from './core/money';
import { clamp } from './core/rng';
import { titleCaseLabel } from './core/text';
import { performerTitleOf } from './core/performer';
import { LEVEL_XP, PROFESSION_BY_ID, type ProfessionId } from './content/professions';
import { CITIES } from './content/geography';
import { costOfLiving } from './content/tax';

import { registerFinance, recomputeCreditScore, netWorth } from './systems/finance';
import { registerLife, startOfLocalDay } from './systems/life';
import { registerWork, refreshOpenings, createLivingBills, JOB_TEMPLATES, hire, annualisedOpeningPay } from './systems/work';
import { registerRelationships, ensureHousehold } from './systems/relationships';
import { registerProperty, registerPropertyReactors, refreshListings, ensureAgents, generateProperty, moveIn } from './systems/property';
import { registerVehicles, refreshInventory } from './systems/vehicles';
import { registerCommerce } from './systems/commerce';
import { registerTravel } from './systems/travel';
import { registerServices, ensureProviders, ensureCourses } from './systems/services';
import { registerMedia } from './systems/media';
import { registerProfessions } from './systems/professions';
import { ensureHygieneTick, registerPlaces } from './systems/places';
import { registerDriving } from './systems/driving';
import { registerWorld } from './world/world';
import { registerShingle } from './systems/shingle';
import { SHINGLE_BY_ID } from './content/shingle';
import { FOUNDER_BACKGROUND_BY_ID } from './content/founder';
import { createUniverse, defaultConfig, WEALTH_PROFILES, type NewSaveConfig, careerLabel } from './world/bootstrap';

export * from './world/bootstrap';
export { Simulation };
export type { Command, CommandResult };

/**
 * Registers every system onto a simulation. Order matters only for event
 * reactor priority, which each system declares for itself.
 */
export function registerAllSystems(sim: Simulation): void {
  registerFinance(sim);
  registerLife(sim);
  registerWork(sim);
  registerRelationships(sim);
  registerProperty(sim);
  registerPropertyReactors(sim);
  registerVehicles(sim);
  registerCommerce(sim);
  registerTravel(sim);
  registerServices(sim);
  registerMedia(sim);
  registerPlaces(sim);
  registerProfessions(sim);
  registerDriving(sim);
  registerShingle(sim);
  registerWorld(sim);
}

/** How many times a recurring bill lands in a year. */
const BILLINGS_PER_YEAR: Record<string, number> = {
  weekly: 52, biweekly: 26, monthly: 12, quarterly: 4, annual: 1, once: 0,
};

/** Recurring world processes every save needs running. */
function armWorldClock(sim: Simulation): void {
  const z = sim.homeZone;

  sim.schedule({
    at: addDays(startOfLocalDay(sim), 1, z),
    kind: 'life.day_rollover',
    label: 'New Day', category: 'system', priority: 5,
  });

  const nextMonth = (() => {
    const p = zonedParts(sim.now, z);
    const month = p.month === 12 ? 1 : p.month + 1;
    const year = p.month === 12 ? p.year + 1 : p.year;
    return instantFromZoned({ year, month, day: 1, hour: 2 }, z);
  })();

  sim.schedule({
    at: nextMonth, kind: 'finance.month_close',
    label: 'Statement Close', category: 'system', priority: 8,
    recurrence: { unit: 'month', interval: 1 },
  });
  sim.schedule({ at: addDays(sim.now, 7, z), kind: 'work.refresh_openings', label: 'New Job Listings', category: 'career', priority: 60 });
  sim.schedule({ at: addDays(sim.now, 10, z), kind: 'prop.refresh_listings', label: 'New Property Listings', category: 'property', priority: 65 });
  sim.schedule({ at: addDays(sim.now, 14, z), kind: 'veh.refresh_inventory', label: 'Dealer Inventory', category: 'vehicles', priority: 68 });
  sim.schedule({ at: addDays(sim.now, 30, z), kind: 'prop.market_tick', label: 'Property Market', category: 'system', priority: 92 });
  ensureHygieneTick(sim);
  sim.schedule({ at: addDays(sim.now, 30, z), kind: 'veh.depreciate', label: 'Vehicle Values', category: 'system', priority: 93 });
  sim.schedule({ at: addDays(sim.now, 1, z), kind: 'social.decay_tick', label: 'Audience Update', category: 'system', priority: 88 });
  sim.schedule({ at: addDays(sim.now, 3, z), kind: 'shop.pantry_expiry', label: 'Pantry Check', category: 'system', priority: 95 });
  sim.schedule({ at: addDays(sim.now, 7, z), kind: 'rel.drift', label: 'Relationship Drift', category: 'system', priority: 90 });
  sim.schedule({ at: addDays(sim.now, 2, z), kind: 'world.tick', label: 'World Simulation', category: 'system', priority: 96 });
}

/** Builds the player's starting situation and the world around it. */
function populateWorld(sim: Simulation, config: NewSaveConfig): void {
  const player = sim.player;
  const cityId = config.startLocationId;
  const wealth = WEALTH_PROFILES[config.wealth];
  const col = costOfLiving(cityId);

  // --- Household ----------------------------------------------------------
  ensureHousehold(sim, player);

  // --- Accounts -----------------------------------------------------------
  const checking = sim.openAccount({
    id: sim.nextId('account'),
    kind: 'checking',
    name: 'Everyday checking',
    ownerId: player.id,
    institution: 'Northbank',
    openedAt: sim.now,
    last4: '4417',
    // Personal money, plus whatever the founder's old job left them with. The
    // background's capital is what the creation screen promised them, and it
    // is what they will open the company on.
    balance: wealth.checking + (FOUNDER_BACKGROUND_BY_ID[config.founderBackground]?.capital ?? 0),
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

  sim.universe.creditProfiles[player.id] = {
    personId: player.id,
    score: wealth.creditScore,
    utilisation: 0,
    onTimePayments: Math.max(0, Math.round((wealth.creditScore - 500) / 12)),
    latePayments: wealth.creditScore < 640 ? 4 : 0,
    accountsOpen: 1,
    oldestAccountAt: sim.now - Math.max(0, (wealth.creditScore - 500)) * 12 * MS_DAY,
    hardInquiries: [],
    derogatory: [],
  };

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
    sim.schedule({
      at: addMonths(sim.now, 1, sim.homeZone),
      kind: 'finance.bill_due',
      label: 'Credit Card Minimum Due',
      category: 'finance',
      payload: { billId: '' },
      priority: 20,
    });
  }
  recomputeCreditScore(sim, player.id);

  // --- The company --------------------------------------------------------
  // The whole premise: the strike ended every other production company, and
  // the player opens the only one trading. Founded through the same command a
  // player would use, so nothing here can reach a state the game cannot.
  {
    const name = config.companyName.trim() || `${player.lastName} ${SHINGLE_BY_ID[config.shingle]?.id === 'studio' ? 'Studios' : 'Pictures'}`;
    // The money from the old job goes into the business. Household money —
    // whatever the wealth level gave them — stays theirs, because a founder
    // with no rent money is a choice, not a default.
    const business = FOUNDER_BACKGROUND_BY_ID[config.founderBackground]?.capital ?? 0;
    const shape = SHINGLE_BY_ID[config.shingle];
    const founded = sim.execute({
      kind: 'co.found',
      payload: {
        name, shingle: config.shingle, remit: config.remit,
        capital: Math.max(0, business - (shape?.setup ?? 0)),
      },
    });
    if (!founded.ok) {
      // A founder who cannot afford the shape they picked opens the smallest
      // one instead, rather than starting with no company at all.
      sim.execute({
        kind: 'co.found',
        payload: {
          name, shingle: 'kitchen_table', remit: config.remit,
          capital: Math.max(0, business - (SHINGLE_BY_ID['kitchen_table']?.setup ?? 0)),
        },
      });
    }
  }

  // --- The world that already exists -------------------------------------
  ensureAgents(sim, cityId);
  ensureProviders(sim, cityId);
  ensureCourses(sim, cityId);
  refreshOpenings(sim);
  refreshListings(sim);
  refreshInventory(sim);

  // --- Housing ------------------------------------------------------------
  if (config.housing !== 'couch') {
    const kind = config.housing === 'owned' ? 'house' : config.housing === 'rental' ? 'condo' : 'apartment';
    const property = generateProperty(sim, cityId, kind, 'starting-home');
    property.name = config.housing === 'roommates' ? 'Shared apartment' : property.name;

    if (config.housing === 'owned') {
      property.ownerId = player.id;
      property.ownerKind = 'person';
      property.tenure = 'owned';
      property.purchasePrice = property.marketValue;
      property.purchasedAt = sim.now;
      property.isPrimaryResidence = true;
      moveIn(sim, player.id, property.id);
      // Owned from before the save begins, so the mortgage already exists.
      const principal = Math.round(property.marketValue * 0.72);
      sim.execute({
        kind: 'finance.take_loan',
        payload: {
          borrowerId: player.id, principal, months: 348, product: 'mortgage',
          refType: 'property', refId: property.id,
          name: `Mortgage — ${property.addressLine}`,
        },
      });
      property.mortgageAccountId = Object.values(sim.universe.accounts)
        .find((a) => a.kind === 'mortgage' && a.ownerId === player.id)?.id;
    } else {
      property.tenure = 'rented';
      property.ownerKind = 'none';
      property.isPrimaryResidence = true;
      const share = config.housing === 'roommates' ? 0.42 : 1;
      property.monthlyRent = Math.round((property.monthlyRent ?? Math.round(CITIES.require(cityId).medianRentCents)) * share);
      property.leaseEndsAt = addDays(sim.now, 300, sim.homeZone);
      moveIn(sim, player.id, property.id);
      sim.execute({
        kind: 'finance.create_bill',
        payload: {
          payerId: player.id,
          name: `Rent — ${property.addressLine}`,
          category: 'housing',
          amount: property.monthlyRent,
          frequency: 'monthly',
          firstDueAt: addDays(sim.now, 12, sim.homeZone),
          autopayAccountId: checking.id,
          refType: 'property', refId: property.id,
        },
      });
    }
  }

  createLivingBills(sim, player.id, cityId, config.housing !== 'couch');

  // --- Vehicle ------------------------------------------------------------
  if (config.startWithVehicle) {
    const listings = Object.values(sim.universe.vehicleListings)
      .filter((l) => l.status === 'active')
      .sort((a, b) => a.price - b.price);
    const affordable = listings.find((l) => l.price <= Math.max(12_000_00, wealth.checking + wealth.savings));
    const chosen = affordable ?? listings[0];
    if (chosen) {
      chosen.price = Math.min(chosen.price, Math.max(6_500_00, Math.round((wealth.checking + wealth.savings) * 0.55)));
      const result = sim.execute<{ vehicleId: Id }>({
        kind: 'veh.purchase',
        payload: { listingId: chosen.id, acquisition: 'cash', accountId: checking.id },
      });
      if (!result.ok) {
        // Could not afford anything: that is a legitimate starting position.
        sim.notify({
          category: 'vehicles', title: 'No Car Yet',
          body: 'You could not afford one at the start. Public transport and rideshares for now.',
          importance: 25, route: '/workspace/vehicles',
        });
      }
    }
  }

  // --- Employment ---------------------------------------------------------
  // The starting job has to be one the starting life can be lived on. Handing
  // somebody a twelve-hour-a-week reading gig and a flat whose rent is twice
  // what it pays is not a hard start, it is an unplayable one: they are broke
  // inside a year no matter what the player does.
  if (config.startWithJob) {
    const openings = Object.values(sim.universe.jobOpenings);
    const annualOutgoings = Object.values(sim.universe.bills)
      .filter((b) => b.payerId === player.id && b.active)
      .reduce((sum, bill) => sum + bill.amount * (BILLINGS_PER_YEAR[bill.frequency] ?? 12), 0);
    const needed = Math.round(annualOutgoings * 1.25);

    const canLiveOnIt = openings.filter((o) => annualisedOpeningPay(o) >= needed);
    const pool = canLiveOnIt.length > 0 ? canLiveOnIt : openings;

    // Within what is affordable, take the job that suits an actor: something
    // near the industry, or the flexible work that fits around auditions.
    const preferred = pool.find((o) => JOB_TEMPLATES.some((t) => t.title === o.title && t.industryAdjacency > 0.3))
      ?? pool.find((o) => o.sector === 'hospitality' || o.sector === 'gig' || o.sector === 'services')
      ?? pool[0];

    // If nothing on the board pays for the life, take the best-paying thing
    // going rather than something that guarantees insolvency.
    const chosen = canLiveOnIt.length > 0
      ? preferred
      : [...openings].sort((a, b) => annualisedOpeningPay(b) - annualisedOpeningPay(a))[0];
    if (chosen) hire(sim, player, chosen);
  }

  // --- Health cover -------------------------------------------------------
  const job = player.jobId ? sim.universe.jobs[player.jobId] : undefined;
  if (job?.benefits.health) {
    const quote = sim.execute<{ quoteId: Id }>({ kind: 'ins.quote', payload: { line: 'health' } });
    if (quote.ok && quote.value) {
      const policy = sim.universe.insurancePolicies[quote.value.quoteId];
      if (policy) policy.monthlyPremium = Math.round(policy.monthlyPremium * 0.28);
      sim.execute({ kind: 'ins.purchase', payload: { quoteId: quote.value.quoteId, accountId: checking.id } });
    }
  }

  // --- Social presence ----------------------------------------------------
  const handle = `${config.firstName}${config.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  sim.execute({
    kind: 'social.create_account',
    payload: { platform: 'lumen', handle, displayName: player.displayName },
  });


  // --- Opening history ----------------------------------------------------
  sim.remember({
    category: 'life',
    title: 'A New Life Begins',
    detail: `${player.displayName} in ${CITIES.require(cityId).name}, ${formatDate(sim.now, sim.homeZone)}. ${WEALTH_PROFILES[config.wealth].note}`,
    refs: [{ type: 'person', id: player.id }],
    significance: 100, public: false,
  });

  armWorldClock(sim);
  refreshMeta(sim);
  void col;
}

/** Keeps the save-slot summary in step with the world. */
export function refreshMeta(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  const worth = netWorth(sim, player.id);
  sim.universe.meta.characterName = player.displayName;
  sim.universe.meta.portrait = player.portrait;
  sim.universe.meta.careerLabel = careerLabel(player.careerTrack);
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
  // A save from before the real bodies, or one that skipped a January, needs
  // this year's editions to exist. Creating them is idempotent.
  // A save from before the studios lived inside it needs their clocks running.
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
 * Brings an older save forward. Each step is additive and idempotent: a missing
 * collection is created empty rather than the save being rejected, so old
 * history is never destroyed by an architecture change.
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
  if (from === SAVE_SCHEMA_VERSION) {
    return { migrated: false, from, to: SAVE_SCHEMA_VERSION, steps, problems };
  }

  const record = universe as unknown as Record<string, unknown>;
  const collections: [string, 'map' | 'list'][] = [
    ['people', 'map'], ['relationships', 'map'], ['households', 'map'],
    ['accounts', 'map'], ['transactions', 'list'], ['bills', 'map'],
    ['creditProfiles', 'map'], ['taxYears', 'map'],
    ['jobs', 'map'], ['jobOpenings', 'map'], ['jobApplications', 'map'],
    ['properties', 'map'], ['structures', 'map'], ['rooms', 'map'], ['zones', 'map'],
    ['furnishings', 'map'], ['propertyListings', 'map'], ['propertyOffers', 'map'],
    ['realEstateAgents', 'map'], ['constructionProjects', 'map'],
    ['constructionPhases', 'map'], ['changeOrders', 'map'],
    ['vehicles', 'map'], ['vehicleListings', 'map'], ['vehicleModifications', 'map'],
    ['serviceRecords', 'map'], ['assets', 'map'], ['outfits', 'map'], ['orders', 'map'],
    ['pantry', 'map'], ['healthProviders', 'map'], ['appointments', 'map'],
    ['insurancePolicies', 'map'], ['insuranceClaims', 'map'], ['courses', 'map'],
    ['enrollments', 'map'], ['trips', 'map'], ['flightBookings', 'map'],
    ['hotelBookings', 'map'], ['socialAccounts', 'map'], ['socialPosts', 'map'],
    ['brandDeals', 'map'], ['companies', 'map'],
    ['scheduled', 'list'], ['audits', 'list'], ['history', 'list'], ['notifications', 'list'],
    ['decisions', 'map'],
  ];

  for (const [key, shape] of collections) {
    if (record[key] === undefined || record[key] === null) {
      record[key] = shape === 'map' ? {} : [];
      steps.push(`Added missing collection '${key}'.`);
    }
  }

  // Schema 26 is the pivot: the player runs a production company in a world
  // where the strike ended every other one. A save from before it has no
  // industry state at all, so it is given the opening one.
  record['industry'] ??= {
    briefed: false, strikeMonths: 19, rivals: 0,
    material: 0, buyerHunger: 92, crewDepth: 34, ratesSet: {},
  };

  record['idempotency'] ??= {};
  record['counters'] ??= {};
  record['engineFailures'] ??= [];
  record['tutorial'] ??= { completed: [], active: [], dismissed: [], guidedMode: true, advancedMode: false };
  record['sandbox'] ??= {
    enabled: false, maxAttributesApplied: false, allTraitsGranted: false,
    unlimitedFunds: false, ignoreAuthority: false, godMode: false,
    allProfessionsUnlocked: false, log: [],
  };
  {
    const sandbox = record['sandbox'] as Record<string, unknown>;
    if (typeof sandbox['godMode'] !== 'boolean') sandbox['godMode'] = false;
    if (typeof sandbox['allProfessionsUnlocked'] !== 'boolean') sandbox['allProfessionsUnlocked'] = false;
    // An earlier build of god mode stored a rating ceiling here. It is gone.
    delete sandbox['ratingCeiling'];
  }

  if (typeof record['__idCounter'] !== 'number') {
    record['__idCounter'] = 100000;
    steps.push('Reset the id counter above any existing id.');
  }

  // Schema 10 put the clock on real time. A save from before it carries the
  // old 'standard' speed, which ran a world minute for every real second.
  const preferences = record['preferences'] as { timeSpeed?: string } | undefined;
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
  relabel(record['scheduled'] as Record<string, unknown>[], 'label');
  relabel(record['notifications'] as Record<string, unknown>[], 'title');
  relabel(record['history'] as Record<string, unknown>[], 'title');
  relabel(Object.values((record['decisions'] ?? {}) as Record<string, Record<string, unknown>>), 'title');
  if (relabelled > 0) {
    steps.push(`Put ${relabelled} stored label${relabelled === 1 ? '' : 's'} into Title Case.`);
  }

  // Every record must belong to this save and nothing else. Cross-save
  // contamination is the one corruption that is invisible until it matters.
  {
    const saveId = universe.meta.id;
    let reassigned = 0;
    for (const [key, shape] of collections) {
      const value = record[key];
      const entries = shape === 'map'
        ? Object.values(value as Record<string, { saveId?: string }>)
        : (value as { saveId?: string }[]);
      for (const entity of entries) {
        if (entity && typeof entity === 'object' && 'saveId' in entity && entity.saveId !== saveId) {
          entity.saveId = saveId;
          reassigned++;
        }
      }
    }
    if (reassigned > 0) steps.push(`Re-stamped ${reassigned} record${reassigned === 1 ? '' : 's'} onto this save.`);
  }

  // Schema 12 made everyone an actor to begin with and moved the other tracks
  // into professions unlocked in the game. A save whose player was a writer
  // keeps being a writer: the profession is unlocked at level two so their
  // standing is not lost, their skills are exactly as they were, and their
  // experience is read from the reputation they had already built.
  for (const person of Object.values(universe.people)) {
    if (!person.isPlayer) continue;
    if (person.industryXp === undefined) {
      person.industryXp = Math.round(person.reputation.professionalReputation * 8 + person.creditIds.length * 60);
      steps.push(`Read ${person.industryXp} XP of industry experience from the career so far.`);
    }
    person.professions ??= {};
    const track = person.careerTrack as string;
    if (track !== 'actor' && (PROFESSION_BY_ID as Record<string, unknown>)[track]) {
      const id = track as ProfessionId;
      if (!person.professions[id]) {
        person.professions[id] = { unlockedAt: universe.now, xp: LEVEL_XP[1] ?? 0, traitIds: [] };
        steps.push(`Kept ${person.displayName} a ${PROFESSION_BY_ID[id].name}: unlocked as a profession at level 2.`);
      }
      person.careerTrack = 'actor';
    } else if (track === 'civilian' || track === 'none') {
      person.careerTrack = 'actor';
      steps.push(`${person.displayName} now starts as ${performerTitleOf(person) === 'actress' ? 'an actress' : 'an actor'}, as everyone does.`);
    }
  }

  // Schema 23 made the city somewhere you move through. Everybody in an older
  // save starts clean and every car starts full, which is the kindest reading
  // of a world that was not tracking either.
  if (from < 23) {
    let people = 0;
    for (const person of Object.values(universe.people)) {
      if (person.wellbeing.hygiene === undefined) { person.wellbeing.hygiene = 80; people++; }
    }
    let cars = 0;
    for (const vehicle of Object.values(universe.vehicles)) {
      if (vehicle.fuelPercent === undefined) { vehicle.fuelPercent = 100; cars++; }
    }
    steps.push(`The city is somewhere you go now: restaurants, filling stations, hotels and the sights. ${people} people started clean and ${cars} car${cars === 1 ? '' : 's'} started full.`);
  }

  /**
   * Schema 26 removed the film and television half of the game.
   *
   * Projects, rights, drafts, roles, auditions, contracts, shoot days, post,
   * releases, reviews, awards, festivals, franchises, studios, networks, the
   * box office and the trade press are gone, along with everything that
   * scheduled work against them.
   *
   * This is a deletion, not a repair, and it is reported as one. A save that
   * had a career in it will say so in the migration report rather than quietly
   * losing it, and the life half — the money, the property, the cars, the
   * people, the city — comes through untouched.
   */
  if (from < 26) {
    const dropped: string[] = [];
    const drop = (key: string, label: string) => {
      const value = record[key];
      const count = Array.isArray(value) ? value.length : value && typeof value === 'object' ? Object.keys(value).length : 0;
      if (count > 0) dropped.push(`${count} ${label}`);
      delete record[key];
    };
    drop('projects', 'projects');
    drop('rights', 'rights deals');
    drop('scriptDrafts', 'script drafts');
    drop('roles', 'roles');
    drop('auditions', 'auditions');
    drop('contracts', 'contracts');
    drop('shootDays', 'shoot days');
    drop('postTasks', 'post tasks');
    drop('marketingCampaigns', 'campaigns');
    drop('releases', 'releases');
    drop('reviews', 'reviews');
    drop('awardEditions', 'award editions');
    drop('awardNominations', 'nominations');
    drop('festivalSubmissions', 'festival submissions');
    drop('franchises', 'franchises');
    drop('castingOffices', 'casting-office standings');
    drop('studios', 'studios');
    drop('networks', 'networks');
    drop('airings', 'airings');
    drop('streamingCharts', 'streaming charts');
    drop('saveRecords', 'record categories');
    drop('zeitgeist', 'zeitgeist');
    drop('talentDeals', 'talent deals');
    drop('boxOffice', 'box-office ledger');
    drop('trade', 'trade items');
    drop('press', 'press items');
    drop('divisions', 'company divisions');
    drop('employees', 'employees');
    drop('equipment', 'equipment');
    drop('merchandise', 'merchandise lines');

    // Anything on the calendar that belonged to the removed half goes with it,
    // or the scheduler wakes up to handlers that are not there any more.
    const deadPrefixes = [
      'cast.', 'film.', 'prod.', 'post.', 'rel.', 'crit.', 'award.', 'fest.',
      'studio.', 'network.', 'franchise.', 'ip.', 'press.', 'trade.', 'company.',
      'zeitgeist.', 'world.project_progress', 'box.', 'tape.',
    ];
    const scheduled = record['scheduled'] as { kind: string }[];
    const before = scheduled.length;
    record['scheduled'] = scheduled.filter((item) => !deadPrefixes.some((prefix) => item.kind.startsWith(prefix)));
    const cancelled = before - (record['scheduled'] as unknown[]).length;

    // Decisions pointing at things that no longer exist would sit in the tray
    // forever with nothing behind them.
    const decisions = record['decisions'] as Record<string, { refType?: string; route?: string }>;
    let closed = 0;
    for (const [id, decision] of Object.entries(decisions)) {
      const stale = ['project', 'role', 'audition', 'release', 'contract', 'draft', 'company'].includes(decision.refType ?? '')
        || (decision.route ?? '').startsWith('/workspace/casting')
        || (decision.route ?? '').startsWith('/workspace/projects');
      if (stale) { delete decisions[id]; closed++; }
    }

    // Credits are a list of project ids that no longer resolve.
    let uncredited = 0;
    for (const person of Object.values(universe.people)) {
      if ((person.creditIds?.length ?? 0) > 0) { person.creditIds = []; uncredited++; }
    }

    steps.push(
      dropped.length > 0
        ? `The film and television half of the game was removed. Dropped ${dropped.join(', ')}, cancelled ${cancelled} scheduled item${cancelled === 1 ? '' : 's'}, closed ${closed} decision${closed === 1 ? '' : 's'} and cleared the credits on ${uncredited} ${uncredited === 1 ? 'person' : 'people'}. None of it can be recovered from this save.`
        : 'The film and television half of the game was removed. This save had nothing in it.',
    );
  }

  universe.meta.schemaVersion = SAVE_SCHEMA_VERSION;
  steps.push(`Schema ${from} to ${SAVE_SCHEMA_VERSION}.`);
  return { migrated: true, from, to: SAVE_SCHEMA_VERSION, steps, problems };
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

  // The player must exist and be coherent.
  const player = universe.people[universe.playerId];
  if (!player) errors.push('The save has no player.');
  else {
    if (!player.isPlayer) errors.push('The player record is not flagged as the player.');
    if (!CITIES.get(player.currentLocationId)) errors.push(`Player is in an unknown location '${player.currentLocationId}'.`);
    if (player.primaryAccountId && !universe.accounts[player.primaryAccountId]) {
      errors.push('Player primary account points at an account that does not exist.');
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
  check('vehicle', Object.values(universe.vehicles));
  check('account', Object.values(universe.accounts));
  check('scheduled', universe.scheduled);

  // Ownership conservation: nothing owned by someone who does not exist.
  for (const property of Object.values(universe.properties)) {
    checked++;
    if (!property.ownerId) continue;
    if (!universe.people[property.ownerId] && !universe.companies[property.ownerId]) {
      errors.push(`Property ${property.id} is owned by '${property.ownerId}', who does not exist.`);
    }
  }
  for (const vehicle of Object.values(universe.vehicles)) {
    checked++;
    if (!universe.people[vehicle.ownerId] && !universe.companies[vehicle.ownerId]) {
      errors.push(`Vehicle ${vehicle.id} is owned by '${vehicle.ownerId}', who does not exist.`);
    }
  }

  // Relationships must point at real people.
  for (const rel of Object.values(universe.relationships)) {
    checked++;
    if (!universe.people[rel.aId] || !universe.people[rel.bId]) {
      errors.push(`Relationship ${rel.id} references a person who does not exist.`);
    }
  }

  // The timeline must be sorted and every pending item in the future or due.
  for (let i = 1; i < universe.scheduled.length; i++) {
    const prev = universe.scheduled[i - 1];
    const cur = universe.scheduled[i];
    if (prev && cur && prev.at > cur.at) {
      errors.push('The timeline is not sorted by time. Advancement would process events out of order.');
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

export { clamp };
