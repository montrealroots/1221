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

import { registerFinance, recomputeCreditScore, netWorth, createLivingBills } from './systems/finance';
import { registerLife, startOfLocalDay } from './systems/life';
import { registerRelationships, ensureHousehold } from './systems/relationships';
import { registerProperty, registerPropertyReactors, refreshListings, ensureAgents, generateProperty, moveIn } from './systems/property';
import { registerVehicles, refreshInventory } from './systems/vehicles';
import { kindOf } from './content/vehicles';
import { registerCommerce } from './systems/commerce';
import { registerTravel } from './systems/travel';
import { registerServices, ensureProviders, ensureCourses } from './systems/services';
import { registerMedia } from './systems/media';
import { registerProfessions } from './systems/professions';
import { ensureHygieneTick, registerPlaces } from './systems/places';
import { registerDriving } from './systems/driving';
import { registerScenes } from './systems/scenes';
import { registerPlans } from './systems/plans';
import { registerFitness } from './systems/fitness';
import { registerDealership } from './systems/dealership';
import { registerDating } from './systems/dating';
import { registerViewings } from './systems/viewings';
import { ensureInteriors, registerPurchase } from './systems/purchase';
import { registerCare } from './systems/care';
import { registerJourney } from './systems/journey';
import { ensureKeepings, registerStorage } from './systems/storage';
import { ensureBankClocks, ensureProducts, registerBanking } from './systems/banking';
import { registerDining } from './systems/dining';
import { registerRetail } from './systems/retail';
import { jewellerySlotFor } from './content/wardrobe';
import { CATALOG } from './content/catalog';
import { ensureWardrobe, registerWardrobe } from './systems/wardrobe';
import { registerJewellery } from './systems/jewellery';
import { registerCostume } from './systems/costume';
import './scenes';
import { registerWorld } from './world/world';
import { registerShingle } from './systems/shingle';
import { DEFAULT_FOUNDER_DRAW } from './content/shingle';
import { registerAuthorship } from './systems/authorship';
import { FOUNDER_ATTRIBUTES, FOUNDER_TRAITS } from './content/founder';
import { CEILING, GOAT_TRAITS } from './content/prodigy';
import { ALL_TRAITS, ATTRIBUTES } from './domain/attributes';
import { SKILLS } from './domain/skills';
import {
  createUniverse, defaultConfig, WEALTH_PROFILES, careerLabel,
  FOUNDING_STAKE, FOUNDING_CAPITAL, FOUNDING_SHINGLE, FOUNDING_REMIT, type NewSaveConfig,
} from './world/bootstrap';

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
  registerAuthorship(sim);
  registerFitness(sim);
  registerDealership(sim);
  registerDating(sim);
  registerViewings(sim);
  registerPurchase(sim);
  registerCare(sim);
  registerJourney(sim);
  registerStorage(sim);
  registerBanking(sim);
  registerDining(sim);
  registerRetail(sim);
  registerWardrobe(sim);
  registerJewellery(sim);
  registerCostume(sim);
  registerPlans(sim);
  registerScenes(sim);
  registerWorld(sim);
}

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

/**
 * The cheapest thing that still counts as a car.
 *
 * Somebody starting with nothing and a ticked box owns a twenty-year-old
 * something, not nothing at all. Low enough that tax, registration and plates
 * — which add about two fifths to the sticker — still fit inside the poorest
 * start that ticked the box.
 */
const BEATER_PRICE = 600_00;

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
    name: 'Everyday Checking',
    ownerId: player.id,
    institution: 'Northbank',
    openedAt: sim.now,
    last4: '4417',
    // Personal money, plus the founding stake. The stake is here for the few
    // lines it takes to open the company and then it is gone into the
    // business; what is left afterwards is exactly the wealth level's own
    // money, so a founder can still be broke while running a company.
    balance: wealth.checking + FOUNDING_STAKE,
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
    // An independent, opened this morning, wholly owned by the character. No
    // choice of shape and no fallback to a smaller one: the stake is sized to
    // this shingle, so it always opens. `must` rather than `execute` because a
    // save without the company is not a save this game can play.
    sim.must({
      kind: 'co.found',
      payload: {
        name: config.companyName.trim() || `${player.lastName} Pictures`,
        shingle: FOUNDING_SHINGLE,
        remit: FOUNDING_REMIT,
        capital: FOUNDING_CAPITAL,
      },
    });
  }

  // --- The world that already exists -------------------------------------
  ensureAgents(sim, cityId);
  ensureProviders(sim, cityId);
  ensureCourses(sim, cityId);
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
    // A car, specifically: the bike lot's cheapest is not what somebody
    // starting out with a car is picturing.
    const listings = Object.values(sim.universe.vehicleListings)
      .filter((l) => l.status === 'active' && (l.kind ?? 'car') === 'car')
      .sort((a, b) => a.price - b.price);
    // Budgeted against the account that will actually pay. It used to be
    // priced off checking plus savings and then paid out of checking alone,
    // so a comfortable start silently got no car while a wealthy one did. A
    // third of the purse, because tax, registration and plates add roughly
    // two fifths again on top of the sticker.
    const purse = sim.ledger.availableFunds(checking.id);
    const budget = Math.round(purse * 0.33);
    // The best car the budget actually reaches, rather than always the
    // cheapest one with its price rewritten — which is how a modest start
    // ended up owning a fifteen-hundred-dollar Range Rover.
    const chosen = listings.filter((l) => l.price <= budget).sort((a, b) => b.price - a.price)[0]
      ?? listings[0];
    if (chosen) {
      // Nothing in the lot is within reach: they own something old instead.
      if (chosen.price > budget) chosen.price = Math.max(BEATER_PRICE, Math.min(chosen.price, budget));
      const result = sim.execute<{ vehicleId: Id }>({
        kind: 'veh.purchase',
        payload: { listingId: chosen.id, acquisition: 'cash', accountId: checking.id },
      });
      if (!result.ok) {
        // Genuinely destitute. A legitimate starting position, and said out
        // loud rather than left as a box that was ticked and did nothing.
        sim.notify({
          category: 'vehicles', title: 'No Car Yet',
          body: 'You could not afford one at the start. Public transport and rideshares for now.',
          importance: 25, route: '/workspace/vehicles',
        });
      }
    }
  }

  // Health cover used to arrive with a job that had benefits. With no jobs
  // there is no employer cover: a policy is something you go and buy.

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
  // The accounts a life starts with sit on products like any other, so a new
  // save has the same fees, cover and rates a loaded one does.
  ensureProducts(sim);
  ensureWardrobe(sim);
  return sim;
}

/** Rehydrates an existing universe. */
export function loadSave(universe: SaveUniverse): Simulation {
  const sim = new Simulation(universe);
  registerAllSystems(sim);
  // The rooms you already live in become rooms (idempotent; see purchase.ts).
  ensureInteriors(sim);
  // Everything you own is kept somewhere (idempotent; see storage.ts).
  ensureKeepings(sim);
  // Every account sits on a product (idempotent; see banking.ts).
  ensureProducts(sim);
  ensureWardrobe(sim);
  ensureBankClocks(sim);
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

  // Schema 27 removed sandbox. The founder starts maxed at everything, so
  // there is nothing left for a cheat mode to give them. Any save still
  // carrying the block loses it here.
  delete (record as Record<string, unknown>)['sandbox'];

  record['idempotency'] ??= {};
  record['counters'] ??= {};
  record['engineFailures'] ??= [];
  record['tutorial'] ??= { completed: [], active: [], dismissed: [], guidedMode: true, advancedMode: false };

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
        ? `The film and television half of the game was removed. Dropped ${dropped.join(', ')}, canceled ${cancelled} scheduled item${cancelled === 1 ? '' : 's'}, closed ${closed} decision${closed === 1 ? '' : 's'} and cleared the credits on ${uncredited} ${uncredited === 1 ? 'person' : 'people'}. None of it can be recovered from this save.`
        : 'The film and television half of the game was removed. This save had nothing in it.',
    );
  }

  if (from < 28) {
    // Schema 28: the founder is the once-in-a-lifetime one. Every attribute,
    // every skill, every producing attribute and every trait in the game, all
    // at the top of their scale at the same time. Nothing is taken away from
    // an older save — the sheets only ever go up, and the history, money and
    // relationships in the save are untouched.
    const player = universe.people[universe.playerId];
    if (player) {
      for (const attribute of ATTRIBUTES) {
        player.attributes[attribute.id] = Math.max(player.attributes[attribute.id] ?? 0, CEILING);
      }
      for (const skill of SKILLS) {
        player.skills[skill.id] = Math.max(player.skills[skill.id] ?? 0, CEILING);
      }
      player.founder = Object.fromEntries(
        FOUNDER_ATTRIBUTES.map((a) => [a.id, Math.max(player.founder?.[a.id] ?? 0, CEILING)]),
      );
      player.traits = [...new Set([...player.traits, ...ALL_TRAITS.map((t) => t.id)])];
      player.founderTraits = [...new Set([
        ...(player.founderTraits ?? []),
        ...GOAT_TRAITS.map((t) => t.id),
        ...FOUNDER_TRAITS.map((t) => t.id),
      ])];
      player.prodigy = true;
      steps.push(
        `${player.displayName} is the prodigy: ${ATTRIBUTES.length} attributes, ${SKILLS.length} skills and `
        + `${FOUNDER_ATTRIBUTES.length} producing attributes at ${CEILING}, and all `
        + `${player.traits.length + player.founderTraits.length} traits held at once.`,
      );
    }
    // And nobody else acquires one. A G.O.A.T. trait on a second person would
    // make the word meaningless, and the founder traits belong to whoever the
    // save gave them to.
    const goatIds = new Set(GOAT_TRAITS.map((t) => t.id));
    let stripped = 0;
    for (const person of Object.values(universe.people)) {
      if (person.isPlayer) continue;
      const before = person.founderTraits?.length ?? 0;
      if (before === 0) continue;
      person.founderTraits = person.founderTraits!.filter((id) => !goatIds.has(id));
      if (person.founderTraits.length !== before) stripped++;
    }
    if (stripped > 0) steps.push(`Took the G.O.A.T. traits off ${stripped} other ${stripped === 1 ? 'person' : 'people'}. There is one.`);
  }

  if (from < 29) {
    // Schema 29: the job system is gone. There are no shifts, no listings, no
    // applications and no wages — the player runs a production company and
    // that is the only work there is.
    const dropped: string[] = [];
    for (const [key, label] of [['jobs', 'jobs'], ['jobOpenings', 'listings'], ['jobApplications', 'applications']] as const) {
      const value = record[key];
      const count = value && typeof value === 'object' ? Object.keys(value).length : 0;
      if (count > 0) dropped.push(`${count} ${label}`);
      delete record[key];
    }
    for (const person of Object.values(universe.people)) {
      delete (person as unknown as Record<string, unknown>)['jobId'];
    }
    // A payday or a shift on the calendar would wake a handler that is not
    // there any more.
    const scheduled = record['scheduled'] as { kind: string }[];
    const before = scheduled.length;
    record['scheduled'] = scheduled.filter(
      (item) => !item.kind.startsWith('work.') && item.kind !== 'finance.payday',
    );
    const cancelled = before - (record['scheduled'] as unknown[]).length;

    // And any decision or notification pointing at the screen that went.
    const decisions = record['decisions'] as Record<string, { route?: string; category?: string }>;
    let closed = 0;
    for (const [id, decision] of Object.entries(decisions)) {
      if ((decision.route ?? '').startsWith('/workspace/jobs')) { delete decisions[id]; closed++; }
    }

    // With no wages, a founder pays themselves out of the company they own.
    // Older saves get the draw and the standing order that pays it.
    for (const company of Object.values(universe.companies)) {
      if (typeof company.founderDraw !== 'number') company.founderDraw = DEFAULT_FOUNDER_DRAW;
    }
    const playerCompanyId = universe.playerCompanyId;
    const hasDraw = (record['scheduled'] as { kind: string }[]).some((i) => i.kind === 'co.draw');
    if (playerCompanyId && !hasDraw) {
      (record['scheduled'] as unknown[]).push({
        id: `sched_draw_${playerCompanyId}`,
        saveId: universe.meta.id,
        at: addMonths(universe.now, 1, universe.homeZone),
        kind: 'co.draw',
        label: "Founder's Draw",
        category: 'finance',
        payload: { companyId: playerCompanyId },
        priority: 14,
        status: 'pending',
        refType: 'company',
        refId: playerCompanyId,
        recurrence: { unit: 'month', interval: 1 },
      });
    }

    steps.push(
      dropped.length > 0
        ? `Employment was removed. Dropped ${dropped.join(', ')}, canceled ${cancelled} scheduled item${cancelled === 1 ? '' : 's'} and closed ${closed} decision${closed === 1 ? '' : 's'}. Wages already paid stay in the ledger; nothing further is earned that way.`
        : 'Employment was removed. This save had none.',
    );
  }

  if (from < 30) {
    // Schema 30: a day can be lived through text. Scenes in progress, what
    // people remember as facts, gym passes and workouts, and the plans you
    // make for yourself all get a home in the save. Nothing already there is
    // touched: an older save simply has none of them yet.
    //
    // A save that carried the reference overlay's `immersion` field keeps its
    // sessions: they move to `scenes` rather than being dropped.
    const legacy = record['immersion'] as { activeId?: string; sessions?: Record<string, unknown> } | undefined;
    const carried = legacy?.sessions ? Object.keys(legacy.sessions).length : 0;
    if (!record['scenes']) {
      record['scenes'] = {
        version: 2,
        activeId: legacy?.activeId,
        sessions: Object.fromEntries(
          Object.entries(legacy?.sessions ?? {}).map(([id, session]) => {
            const old = session as Record<string, unknown>;
            return [id, {
              saveId: universe.meta.id,
              participantIds: [],
              committed: [],
              ...old,
              // The overlay wrote transcript lines without a speaker.
              transcript: ((old['transcript'] as { at: number; text: string; who?: string }[] | undefined) ?? [])
                .map((line) => ({ at: line.at, who: line.who ?? 'world', text: line.text })),
            }];
          }),
        ),
      };
    }
    delete record['immersion'];
    for (const key of ['memberships', 'workouts', 'plans'] as const) {
      if (!record[key] || typeof record[key] !== 'object') record[key] = {};
    }
    steps.push(carried > 0
      ? `Scenes, memory, fitness and plans added; ${carried} scene${carried === 1 ? '' : 's'} carried over from the reference overlay.`
      : 'Scenes, memory, fitness and plans added. This save had none yet.');
  }

  if (from < 31) {
    // Schema 31: a car is bought across a table. Deals — the conversation
    // about one car at one dealership — get a home; a car can be waiting on
    // delivery; a listing knows which dealership it sits on. Nothing already
    // in the save is touched.
    if (!record['vehicleDeals']) record['vehicleDeals'] = {};
  }

  if (from < 32) {
    // Schema 32: a date is a record from the asking to the walk home. A date
    // already on the calendar from before keeps its scheduled item and gets a
    // record when it comes round. Nothing already in the save is touched.
    if (!record['dates']) record['dates'] = {};
  }

  if (from < 33) {
    // Schema 33: the save keeps which lines of the dialogue library it has
    // heard, and when, so a voice does not repeat itself. Never the text.
    if (!record['dialogue']) record['dialogue'] = { version: 1, seen: {} };
  }

  if (from < 34) {
    // Schema 34: a post can carry what the audience said a day on. Nothing
    // already in the save is touched; older posts simply have no reactions.
  }
  if (from < 35) {
    // Schema 35: an offer carries its counter rounds, when the inspection was
    // answered, whether closing was delayed once and the appraisal gap. All
    // optional; nothing already in the save is touched. Homes bought or
    // rented from the market get an interior the first time the save loads
    // (see ensureInteriors), so the rooms you already live in become rooms.
  }

  if (from < 36) {
    // Schema 36: prescriptions, and an appointment that remembers what you
    // came in about, whether tests were ordered, and whether it was paid.
    // Health, dental and vision policies name the carrier providers know.
    universe.prescriptions ??= {};
    for (const policy of Object.values(universe.insurancePolicies)) {
      if ((policy.line === 'health' || policy.line === 'dental' || policy.line === 'vision') && policy.carrier === 'Northbank Insurance') policy.carrier = 'Northbank Health';
    }
  }

  if (from < 37) {
    // Schema 37: a flight booking carries the day as it was played (the bag,
    // the seat, the delay, the bags on arrival) and can be missed or moved.
    // All optional; nothing already in the save is touched.
  }

  if (from < 38) {
    // Schema 38: vehicles and listings carry what kind of thing they are.
    // Everything from before is a car, and is stamped so from the catalog
    // rather than guessed; nothing else about it is touched.
    for (const vehicle of Object.values(universe.vehicles)) {
      if (!vehicle.kind) vehicle.kind = kindOf(vehicle.catalogId);
    }
    for (const listing of Object.values(universe.vehicleListings)) {
      if (!listing.kind) listing.kind = kindOf(listing.catalogId.split(':')[0] ?? '');
    }
    steps.push('Vehicles and listings stamped with their kind.');
  }

  if (from < 39) {
    // Schema 39: every vehicle is kept somewhere, homes know their garage
    // and their dock, and a boat or an aircraft may carry a name. The
    // placing itself happens when the save is loaded and the systems are
    // there to ask (ensureKeepings); an old berth-and-crew bill becomes the
    // keeping bill rather than a second charge. Nothing is removed.
    steps.push('Vehicles to be placed in garages, berths and hangars on load.');
  }

  if (from < 40) {
    // Schema 40: a queue for a marina slip. Nothing existing has one, and
    // the collection is created empty the first time somebody joins.
    universe.berthWaitlists ??= {};
    steps.push('Marina waiting lists ready.');
  }

  if (from < 41) {
    // Schema 41: bank products, statements and standing orders. Accounts from
    // before are matched to the product they most resemble on load, so a
    // checking account keeps its balance and gains a fee and cover it did
    // not have. Nothing is closed and no balance is touched.
    universe.accountStatements ??= {};
    universe.standingOrders ??= {};
    steps.push('Bank products, statements and standing orders ready.');
  }

  if (from < 42) {
    // Schema 42: a room has a host and a server, a shop floor has somebody on
    // it, and both remember you. Nothing before this had a sitting or a visit
    // recorded, so both collections start empty; the storefronts themselves are
    // read from the catalog rather than stored, so no save is rewritten.
    universe.diningVisits ??= {};
    universe.retailVisits ??= {};
    steps.push('Rooms and shop floors ready to be walked into.');
  }

  if (from < 43) {
    // Schema 43: clothes have a color, a cloth, a state of cleanliness and a
    // history of being worn, and a person has what they currently have on.
    // Everything already owned keeps its price, its condition and its slot; the
    // new fields are filled in on load from what the thing is, so no wardrobe
    // is emptied and nothing is re-bought.
    universe.wornRecords ??= {};
    steps.push('Wardrobe given color, cloth and a memory of being worn.');
  }

  if (from < 44) {
    // Schema 44: jewelry stopped being one peg. Earrings, a necklace, a ring
    // and a bracelet are worn at the same time, so each has its own slot, and
    // everything already owned is moved to the right one from what it is.
    // Nothing is lost: a piece that is none of the four keeps the old slot.
    let moved = 0;
    for (const asset of Object.values(universe.assets)) {
      const w = asset.wardrobe as { slot?: string } | undefined;
      if (!w || w.slot !== 'jewellery') continue;
      const item = asset.catalogId ? CATALOG.get(asset.catalogId) : undefined;
      const slot = jewellerySlotFor(item?.subcategory ?? '', asset.name);
      if (slot === 'jewellery') continue;
      w.slot = slot;
      moved++;
    }
    // Anything on you that has moved slot is still on you: `wearing` is a list
    // of ids, so the peg changing underneath it does not take it off.
    steps.push(`Jewelry split into earrings, necklace, ring and bracelet (${moved} moved).`);
  }

  if (from < 45) {
    // Schema 45: a jeweler will make you something. Nothing already owned
    // changes; the collection simply starts empty.
    universe.commissions ??= {};
    steps.push('Commissions ready: a bench will now make you a piece.');
  }

  if (from < 46) {
    // Schema 46: a costume house will cut you something, and so will you.
    // Nothing already owned changes; the collection simply starts empty.
    universe.costumes ??= {};
    steps.push('Workroom ready: a costume can now be cut for you, or by you.');
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
