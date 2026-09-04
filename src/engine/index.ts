/**
 * SLATE — Engine entry point.
 *
 * `createSave` builds a new universe and populates the world around the player.
 * `loadSave` rehydrates an existing one. Both return a Simulation with every
 * system registered, which is the only object the UI ever talks to.
 */

import { LEGACY_BODY_NAMES } from './content/award-bodies';
import { LEGACY_FESTIVAL_NAMES } from './content/festival-rules';
import { BUYERS, LEGACY_BUYER_NAMES } from './content/industry';
import { countryOfCity, primaryLanguageOf } from './content/geography';
import { Simulation, type Command, type CommandResult } from './core/simulation';
import type { Id, SaveUniverse } from './domain/model';
import { SAVE_SCHEMA_VERSION } from './domain/model';
import { addDays, addMonths, formatDate, instantFromZoned, zonedParts, MS_DAY } from './core/time';
import { formatMoneyCompact } from './core/money';
import { clamp } from './core/rng';
import { titleCaseLabel } from './core/text';
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
import { registerFilm, registerBuyerOffer } from './systems/film';
import { registerCasting } from './systems/casting';
import { registerProduction } from './systems/production';
import { registerRelease, registerFranchises } from './systems/release';
import { registerCritics } from './systems/critics';
import { registerIpLicensing } from './systems/ip';
import { registerStudios, ensureStudioSchedules } from './systems/studios';
import { registerNetworks, ensureNetworkSchedules } from './systems/networks-live';
import { registerZeitgeist, ensureZeitgeist, commissionProject } from './systems/zeitgeist';
import { registerProfessions } from './systems/professions';
import { registerRealPeople } from './systems/real-people';
import { registerPress } from './systems/press';
import { craftFromLegacy } from './content/screenplay';
import { registerDriving } from './systems/driving';
import { LEVEL_XP, PROFESSION_BY_ID, type ProfessionId } from './content/professions';
import { ensureSeasons, registerAwards, setUpSeason } from './systems/awards';
import { registerCompany } from './systems/company';
import { registerWorld } from './world/world';
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
  registerFilm(sim);
  registerBuyerOffer(sim);
  registerCasting(sim);
  registerProduction(sim);
  registerRelease(sim);
  registerCritics(sim);
  registerFranchises(sim);
  registerIpLicensing(sim);
  registerStudios(sim);
  registerNetworks(sim);
  registerZeitgeist(sim);
  registerProfessions(sim);
  registerRealPeople(sim);
  registerPress(sim);
  registerDriving(sim);
  registerAwards(sim);
  registerCompany(sim);
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
  sim.schedule({ at: addDays(sim.now, 30, z), kind: 'veh.depreciate', label: 'Vehicle Values', category: 'system', priority: 93 });
  sim.schedule({ at: addDays(sim.now, 1, z), kind: 'social.decay_tick', label: 'Audience Update', category: 'system', priority: 88 });
  sim.schedule({ at: addDays(sim.now, 3, z), kind: 'shop.pantry_expiry', label: 'Pantry Check', category: 'system', priority: 95 });
  sim.schedule({ at: addDays(sim.now, 7, z), kind: 'rel.drift', label: 'Relationship Drift', category: 'system', priority: 90 });
  sim.schedule({ at: addDays(sim.now, 5, z), kind: 'cast.opportunity_scan', label: 'Casting Breakdowns', category: 'career', priority: 72 });
  sim.schedule({ at: addDays(sim.now, 2, z), kind: 'world.tick', label: 'World Simulation', category: 'system', priority: 96 });
  sim.schedule({ at: addDays(sim.now, 30, z), kind: 'franchise.cool_off', label: 'Franchise Appetite', category: 'system', priority: 94 });
  ensureStudioSchedules(sim);
  ensureNetworkSchedules(sim);
  ensureZeitgeist(sim);

  const nextYear = zonedParts(sim.now, z).year + 1;
  sim.schedule({
    at: instantFromZoned({ year: nextYear, month: 1, day: 2, hour: 3 }, z),
    kind: 'award.season_setup',
    label: 'Awards Season', category: 'system', priority: 80,
  });
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

  // --- The world that already exists -------------------------------------
  ensureAgents(sim, cityId);
  ensureProviders(sim, cityId);
  ensureCourses(sim, cityId);
  refreshOpenings(sim);
  refreshListings(sim);
  refreshInventory(sim);
  setUpSeason(sim, zonedParts(sim.now, sim.homeZone).year);
  setUpSeason(sim, zonedParts(sim.now, sim.homeZone).year + 1);

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

  // --- The industry is already running -----------------------------------
  // A save opens with the world already mid-production on a few things, in
  // the player's own market and abroad.
  // The two at home are already casting, so there is something to be seen for
  // on day one; the rest are simply being made somewhere else.
  const startHome = countryOfCity(sim.universe.people[sim.universe.playerId]?.currentLocationId) ?? 'us';
  for (const [i, market] of [startHome, startHome, 'us', 'uk', 'kr', 'fr'].entries()) {
    commissionProject(sim, market, `seed-${i}`, i < 2);
  }

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
  ensureSeasons(sim);
  // A save from before the studios lived inside it needs their clocks running.
  ensureStudioSchedules(sim);
  ensureNetworkSchedules(sim);
  ensureZeitgeist(sim);
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
    ['brandDeals', 'map'], ['projects', 'map'], ['rights', 'map'],
    ['scriptDrafts', 'map'], ['roles', 'map'], ['auditions', 'map'], ['contracts', 'map'],
    ['shootDays', 'map'], ['postTasks', 'map'], ['marketingCampaigns', 'map'],
    ['releases', 'map'], ['reviews', 'map'], ['awardEditions', 'map'],
    ['awardNominations', 'map'], ['festivalSubmissions', 'map'], ['franchises', 'map'],
    ['companies', 'map'], ['divisions', 'map'], ['employees', 'map'],
    ['equipment', 'map'], ['merchandise', 'map'],
    ['scheduled', 'list'], ['audits', 'list'], ['history', 'list'], ['notifications', 'list'],
    ['press', 'list'],
    ['decisions', 'map'],
  ];

  for (const [key, shape] of collections) {
    if (record[key] === undefined || record[key] === null) {
      record[key] = shape === 'map' ? {} : [];
      steps.push(`Added missing collection '${key}'.`);
    }
  }

  record['idempotency'] ??= {};
  record['counters'] ??= {};
  record['engineFailures'] ??= [];

  // Schema 10 put the clock on real time. A save from before it carries the
  // old 'standard' speed, which ran a world minute for every real second.
  const preferences = record['preferences'] as { timeSpeed?: string } | undefined;
  if (preferences?.timeSpeed === 'standard') {
    preferences.timeSpeed = 'live';
    steps.push('Moved the clock to real time.');
  }

  // Schema 11 put every label in Title Case. Labels are written into the save
  // when they are created — a scheduled item keeps the words it was given — so
  // an older save would have gone on reading 'New day' forever while a fresh
  // one read 'New Day'. Repair them in place rather than leaving two builds
  // worth of capitalisation in one universe.
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

  // Schema 9 also denormalised the billing block onto the project so a credit
  // outlives the simulation of the person who earned it. Rebuild it from the
  // attachments an older save already has.
  const projects = record['projects'] as Record<string, {
    credits?: unknown[]; castIds?: string[]; writerIds?: string[]; producerIds?: string[];
    directorId?: string; showrunnerId?: string;
  }>;
  const peopleById = record['people'] as Record<string, { displayName?: string; stageName?: string }>;
  let credited = 0;
  for (const project of Object.values(projects)) {
    if (Array.isArray(project.credits)) continue;
    const credits: { personId: string; name: string; role: string }[] = [];
    const add = (personId: string | undefined, role: string) => {
      if (!personId) return;
      const person = peopleById[personId];
      if (!person) return;
      credits.push({ personId, name: person.stageName ?? person.displayName ?? 'Uncredited', role });
    };
    for (const id of project.castIds ?? []) add(id, 'cast');
    for (const id of project.writerIds ?? []) add(id, 'writer');
    for (const id of project.producerIds ?? []) add(id, 'producer');
    add(project.directorId, 'director');
    add(project.showrunnerId, 'showrunner');
    project.credits = credits;
    credited++;
  }
  if (credited > 0) steps.push(`Rebuilt the credit list on ${credited} project${credited === 1 ? '' : 's'}.`);

  // Schema 9 moved casting rooms onto the role. A save written before that has
  // the auditions but no index, so rebuild it from the auditions themselves
  // rather than losing anybody's casting history.
  const roles = record['roles'] as Record<string, { id: string; auditionIds?: string[] }>;
  const auditions = record['auditions'] as Record<string, { id: string; roleId: string }>;
  let indexed = 0;
  for (const role of Object.values(roles)) {
    if (Array.isArray(role.auditionIds)) continue;
    role.auditionIds = [];
    indexed++;
  }
  if (indexed > 0) {
    for (const audition of Object.values(auditions)) {
      const role = roles[audition.roleId];
      if (role?.auditionIds && !role.auditionIds.includes(audition.id)) role.auditionIds.push(audition.id);
    }
    steps.push(`Rebuilt the casting-room index on ${indexed} role${indexed === 1 ? '' : 's'}.`);
  }
  record['tutorial'] ??= { completed: [], active: [], dismissed: [], guidedMode: true, advancedMode: false };
  record['sandbox'] ??= { enabled: false, maxAttributesApplied: false, allTraitsGranted: false, unlimitedFunds: false, ignoreAuthority: false, log: [] };
  if (typeof record['__idCounter'] !== 'number') {
    record['__idCounter'] = 100000;
    steps.push('Reset the id counter above any existing id.');
  }

  // Every record must belong to this save and nothing else.
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

  // Schema 12 made everyone an actor to begin with and moved the other
  // tracks into professions unlocked in the game. A save whose player was a
  // writer keeps being a writer: the profession is unlocked at level two so
  // their standing is not lost, their skills are exactly as they were, and
  // their experience is read from the reputation they had already built.
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
      steps.push(`${person.displayName} now starts as an actor/actress, as everyone does.`);
    }
  }

  // Schema 13 gave every car a location. A car from before is wherever its
  // owner is now, which is the only honest guess and the one that changes
  // nothing about what the player can do today.
  let parked = 0;
  for (const vehicle of Object.values(universe.vehicles)) {
    if (vehicle.locationId) continue;
    const owner = universe.people[vehicle.ownerId];
    if (owner) { vehicle.locationId = owner.currentLocationId; parked++; }
  }
  if (parked > 0) steps.push(`Placed ${parked} car${parked === 1 ? '' : 's'} where their owners are.`);

  // Schema 14 put the real award bodies in. Every project now says where it
  // is from, what language it speaks and how it reached the public, which is
  // what the bodies' rules read. Finalised results under the older fictional
  // bodies stay exactly as they were: history is not rewritten. Editions of
  // those bodies that had not yet been decided are retired, since nothing
  // can decide them now, and their pending entries go with them.
  let described = 0;
  for (const project of Object.values(universe.projects)) {
    const creator = universe.people[project.createdById];
    const country = project.productionCountryId
      ?? countryOfCity(project.productionLocationIds[0]) ?? countryOfCity(creator?.currentLocationId) ?? 'us';
    if (!project.productionCountryId) { project.productionCountryId = country; described++; }
    project.language ??= primaryLanguageOf(country);
    if (!project.releaseStrategy && project.releaseDate) {
      const release = project.releaseId ? universe.releases[project.releaseId] : undefined;
      project.releaseStrategy = release?.strategy
        ?? (project.format === 'series' || project.format === 'limited_series' || project.format === 'tv_movie' ? 'streaming_exclusive'
          : project.format === 'short' ? 'festival_only'
          : project.budget >= 15_000_000_00 ? 'wide_theatrical' : 'limited_theatrical');
    }
  }
  if (described > 0) steps.push(`Gave ${described} project${described === 1 ? '' : 's'} a country, a language and a way of reaching the public.`);

  let retired = 0;
  const retiredEditionIds = new Set<string>();
  for (const edition of Object.values(universe.awardEditions)) {
    if (!LEGACY_BODY_NAMES[edition.bodyId] || edition.finalised) continue;
    retiredEditionIds.add(edition.id);
    delete universe.awardEditions[edition.id];
    retired++;
  }
  for (const nomination of Object.values(universe.awardNominations)) {
    if (retiredEditionIds.has(nomination.editionId)) delete universe.awardNominations[nomination.id];
  }
  let withdrawn = 0;
  for (const submission of Object.values(universe.festivalSubmissions)) {
    if (!LEGACY_FESTIVAL_NAMES[submission.festivalId]) continue;
    if (submission.status === 'under_review' || submission.status === 'selected') { submission.status = 'withdrawn'; withdrawn++; }
  }
  const before = universe.scheduled.length;
  universe.scheduled = universe.scheduled.filter((item) => {
    if ((item.kind === 'award.nominations' || item.kind === 'award.ceremony') && retiredEditionIds.has(String(item.payload.editionId))) return false;
    if ((item.kind === 'fest.decision' || item.kind === 'fest.screening')) {
      const submission = universe.festivalSubmissions[String(item.payload.submissionId)];
      if (submission && LEGACY_FESTIVAL_NAMES[submission.festivalId]) return false;
    }
    return true;
  });
  if (retired > 0 || withdrawn > 0 || before !== universe.scheduled.length) {
    steps.push(`The award bodies are now the real ones. Retired ${retired} undecided edition${retired === 1 ? '' : 's'} of the earlier fictional bodies and ${withdrawn} pending festival submission${withdrawn === 1 ? '' : 's'}; every decided result was kept as it was.`);
  }

  // Schema 15: the studios are the real ones. A pitch still waiting on one of
  // the earlier fictional buyers can never be answered, so it lapses; an offer
  // from one of them that was never accepted is withdrawn. Every deal already
  // done keeps the name it was done under: that is history.
  if (from < 15) {
    const pending = universe.scheduled.length;
    universe.scheduled = universe.scheduled.filter((item) => !(item.kind === 'film.pitch_response' && !BUYERS.get(String(item.payload.buyerId))));
    const lapsed = pending - universe.scheduled.length;
    let withdrawnOffers = 0;
    for (const decision of Object.values(universe.decisions)) {
      if (decision.resolvedAt || decision.dismissedAt) continue;
      const stale = decision.actions.some((a) => a.commandKind === 'film.accept_buyer_offer' && !BUYERS.get(String(a.payload.buyerId)));
      if (stale) { decision.dismissedAt = universe.now; withdrawnOffers++; }
    }
    if (lapsed > 0 || withdrawnOffers > 0) {
      const names = Object.values(LEGACY_BUYER_NAMES).slice(0, 3).join(', ');
      steps.push(`The studios are now the real ones. ${lapsed} pending pitch${lapsed === 1 ? '' : 'es'} and ${withdrawnOffers} open offer${withdrawnOffers === 1 ? '' : 's'} from the earlier fictional buyers (${names} and the rest) lapsed; every deal already done was kept under the name it was done with.`);
    } else {
      steps.push('The studios are now the real ones.');
    }
  }

  if (from < 16) {
    // The studios and networks now live inside the save: their standing with
    // the player, their results, their dated slate playing out, the weekend
    // chart and the trades. Nothing already in the save is touched; the new
    // collections start empty and the world fills them from here.
    record['studios'] ??= {};
    record['networks'] ??= {};
    record['talentDeals'] ??= {};
    record['boxOffice'] ??= { weekends: [], yearToDate: {}, pending: [] };
    record['trade'] ??= [];
    steps.push('The studios and networks now act inside the save: their dated slates release on the day, the weekend box office is counted, and their standing with you is kept.');
  }

  if (from < 17) {
    // Television became a schedule rather than a list: a grid every week, a
    // rating on every airing, a renewal every May, and a chart for the
    // services. The records a save sets for itself are kept from here too.
    record['airings'] ??= [];
    record['streamingCharts'] ??= [];
    record['saveRecords'] ??= {};
    steps.push('Television now runs on a schedule: every linear network has a week, every airing has a rating, the services publish a weekly chart, and the records your universe sets are kept.');
  }

  if (from < 18) {
    // The world stopped making films to fill a casting page and started
    // commissioning them the way an industry does: by country, by what that
    // country makes, and by what is warm there this year. The filler that was
    // only ever there to have something open is cleared out — but nothing the
    // player ever touched goes with it.
    record['zeitgeist'] ??= { markets: {}, lastTick: 0, history: [] };
    const touched = new Set<string>();
    const player = universe.people[universe.playerId];
    for (const id of player?.creditIds ?? []) touched.add(id);
    for (const contract of Object.values(universe.contracts)) if (contract.projectId) touched.add(contract.projectId);
    for (const audition of Object.values(universe.auditions)) {
      const role = universe.roles[audition.roleId];
      if (role?.projectId) touched.add(role.projectId);
    }
    for (const nomination of Object.values(universe.awardNominations)) if (nomination.projectId) touched.add(nomination.projectId);
    for (const submission of Object.values(universe.festivalSubmissions)) if (submission.projectId) touched.add(submission.projectId);

    const filler = Object.values(universe.projects).filter((p) => p.createdById !== universe.playerId
      && !p.catalogueQid
      && !p.ownerCompanyId
      && !touched.has(p.id)
      && (p.logline === 'An independent production, casting now.' || p.phase === 'preproduction' || p.phase === 'idea'));
    let clearedRoles = 0;
    for (const project of filler) {
      for (const role of Object.values(universe.roles)) {
        if (role.projectId !== project.id) continue;
        delete universe.roles[role.id];
        clearedRoles++;
      }
      delete universe.projects[project.id];
    }
    // Any decision or scheduled item pointing at something that is gone goes too.
    for (const decision of Object.values(universe.decisions)) {
      if (decision.refType === 'role' && decision.refId && !universe.roles[decision.refId]) decision.dismissedAt = universe.now;
      if (decision.refType === 'project' && decision.refId && !universe.projects[decision.refId]) decision.dismissedAt = universe.now;
    }
    universe.scheduled = universe.scheduled.filter((item) => {
      if (item.refType === 'project' && item.refId && !universe.projects[item.refId]) return false;
      if (item.refType === 'role' && item.refId && !universe.roles[item.refId]) return false;
      return true;
    });
    steps.push(filler.length > 0
      ? `The world commissions its own films now, by country and by what is in fashion there. ${filler.length} unstarted filler production${filler.length === 1 ? '' : 's'} and ${clearedRoles} open role${clearedRoles === 1 ? '' : 's'} that existed only to fill the casting page were cleared; everything you were ever attached to was kept.`
      : 'The world commissions its own films now, by country and by what is in fashion there.');
  }

  if (from < 19) {
    // You can now go to a real person by name rather than only opening a room.
    // Every part keeps a record of who was asked, what they were offered and
    // what they said, so a second attempt reads back the first answer instead
    // of rolling a new one. Parts that already exist start that record empty —
    // nothing that was cast before stops being cast.
    for (const role of Object.values(universe.roles)) role.offers ??= [];
    steps.push('You can take a part to somebody by name now. Every part keeps the offers put to it and the answers, so asking twice cannot book the same person twice.');
  }

  if (from < 20) {
    // The trade press writes about your industry now, in the register each
    // publication actually writes in. Nothing already in the save changes; the
    // coverage starts from here, and the one-line trade items a save already
    // has are kept exactly as they were.
    record['press'] ??= [];
    // Every picture keeps the approaches made for its chairs, the same way a
    // part keeps its offers. Existing projects start that record empty;
    // nothing already attached comes off.
    for (const project of Object.values(universe.projects)) project.approaches ??= [];
    steps.push('The trades cover your industry now. Variety, Deadline, The Hollywood Reporter and the rest each write in their own register, and everything they publish is kept.');
  }

  if (from < 21) {
    // A draft is a document now: fourteen craft dimensions, a scene list and a
    // cast of characters. Every draft already in the save keeps its numbers —
    // the three it had become three of the fourteen and the rest are filled
    // from its quality — and its scenes are broken down the first time
    // anything needs them, rather than being invented here and now.
    let carried = 0;
    for (const draft of Object.values(universe.scriptDrafts)) {
      draft.craft ??= craftFromLegacy(draft.structure, draft.dialogue, draft.characters, draft.quality);
      draft.scenes ??= [];
      draft.scriptCharacters ??= [];
      carried++;
    }
    steps.push(carried > 0
      ? `A script is a document now: fourteen craft dimensions, a scene list and a cast of characters. ${carried} draft${carried === 1 ? '' : 's'} already in the save kept every number ${carried === 1 ? 'it' : 'they'} had.`
      : 'A script is a document now: fourteen craft dimensions, a scene list and a cast of characters.');
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
  check('project', Object.values(universe.projects));
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

  // Projects must not claim cast who do not exist.
  for (const project of Object.values(universe.projects)) {
    checked++;
    for (const castId of project.castIds) {
      if (!universe.people[castId]) {
        errors.push(`Project ${project.title} lists a cast member '${castId}' who does not exist.`);
        break;
      }
    }
    if (project.spent > project.budget + project.contingency && project.budgetLocked) {
      warnings.push(`${project.title} has spent ${formatMoneyCompact(project.spent)} against a locked budget of ${formatMoneyCompact(project.budget)}.`);
    }
  }

  // Post-production dependencies must never be violated.
  for (const task of Object.values(universe.postTasks)) {
    checked++;
    if (task.status !== 'complete' && task.status !== 'in_progress') continue;
    const siblings = Object.values(universe.postTasks).filter((t) => t.projectId === task.projectId);
    for (const dep of task.dependsOn) {
      const upstream = siblings.find((t) => t.kind === dep);
      if (upstream && upstream.status !== 'complete' && task.status === 'complete') {
        errors.push(`Post task '${task.name}' completed while '${upstream.name}' is still ${upstream.status}. Dependency violated.`);
      }
    }
  }

  // Award history must be stable.
  for (const edition of Object.values(universe.awardEditions)) {
    checked++;
    if (!edition.finalised) continue;
    const noms = Object.values(universe.awardNominations).filter((n) => n.editionId === edition.id);
    if (noms.length > 0 && noms.every((n) => n.won === undefined)) {
      errors.push(`Award edition ${edition.id} is finalised but no winner was recorded.`);
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
