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
import type { Personality, SaveUniverse } from './domain/model';
import { SAVE_SCHEMA_VERSION } from './domain/model';
import { addDays, formatDate, instantFromZoned, zonedParts, MS_DAY } from './core/time';
import { formatMoneyCompact } from './core/money';
import { clamp } from './core/rng';
import { plural, titleCaseLabel } from './core/text';
import { PERFORMER_NOUN, impliedPerformerTitle, isPerformerTitle } from './core/performer';
import { citizenshipFor } from './domain/citizenship';
import { cleanPersonality, cleanPersonalityTraits } from './systems/personality';

import { CITIES } from './content/geography';

import { netWorth } from './systems/finance';
import { registerLife, startOfLocalDay } from './systems/life';
import { registerPlans } from './world/plans';
import { registerWorld } from './world/world';
import {
  createUniverse, defaultConfig, WEALTH_PROFILES, type NewSaveConfig,
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
  const wealth = WEALTH_PROFILES[config.wealth];

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

  armWorldClock(sim);
}

/** Keeps the save-slot summary in step with the world. */
export function refreshMeta(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  const worth = netWorth(sim, player.id);
  sim.universe.meta.characterName = player.displayName;
  sim.universe.meta.portrait = player.portrait;
  sim.universe.meta.careerLabel = PERFORMER_NOUN[player.performerTitle];
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
 * its money, its calendar and its history are all still here — and
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
  record('accounts', 'the accounts');
  record('decisions', 'the decision center');
  record('idempotency', 'the command receipts');
  record('counters', 'the counters');
  list('transactions', 'the transactions');
  list('scheduled', 'the timeline');
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
    stamp(Object.values(universe.accounts));
    stamp(Object.values(universe.decisions));
    stamp(universe.transactions);
    stamp(universe.scheduled);
    stamp(universe.history);
    stamp(universe.notifications);
    if (reassigned > 0) steps.push(`Re-stamped ${reassigned} record${reassigned === 1 ? '' : 's'} onto this save.`);
  }

  if (!universe.preferences) {
    universe.preferences = {
      reducedMotion: false, audioEnabled: true, audioVolume: 0.6,
      timeSpeed: 'live', compactMode: false, showAdvancedNumbers: false,
      confirmLargePurchases: true, largePurchaseThreshold: 5_000_00,
    };
    steps.push('Created the preferences.');
  }

  // Schema 80 took out the whole character sheet, the film career and the
  // family: the attributes and the prodigy flag, the acting traits, the
  // industry reputation, the career track, the role on the estate, the quote
  // history, who somebody is to whom, their gender, the house they slept in,
  // the household they shared it with and the name their work was credited
  // under. Nothing in this build reads any of them. Earlier removals are in the same list, so a save from any older
  // build sheds all of it in one pass. The relatives themselves, the
  // households and the house stay in an older save as inert records, like
  // every other part this build has no screen for.
  //
  // 80 shed the performer title too, and 81 put it back, so it is not on the
  // list: a save from before 80 keeps the title it was made with. 80 shed the
  // personality and its traits as well, and 83 put those back the same way.
  // 82 shed the second citizenship.
  const SHED = [
    'attributes', 'prodigy', 'traits',
    'reputation', 'careerTrack', 'estateRole', 'quotes', 'relations', 'gender', 'residenceId',
    'householdId', 'stageName', 'skills', 'goals', 'lifestyle', 'creditScore', 'goatTraits',
    'secondCitizenshipId',
  ] as const;
  let shed = 0;
  for (const person of Object.values(universe.people ?? {})) {
    const p = person as unknown as Record<string, unknown>;
    let dropped = false;
    for (const key of SHED) {
      if (key in p) { delete p[key]; dropped = true; }
    }
    const well = p.wellbeing;
    if (well !== null && typeof well === 'object' && 'travelFatigue' in well) {
      delete (well as Record<string, unknown>).travelFatigue;
      dropped = true;
    }
    if (dropped) shed += 1;
  }
  // Older builds mirrored the title onto the save's own summary. It lives on
  // the person now, and the slot reads it through the career line.
  const meta = universe.meta as unknown as Record<string, unknown>;
  if ('performerTitle' in meta) delete meta.performerTitle;
  if (shed > 0) {
    steps.push(`Dropped the fields this build no longer reads from ${plural(shed, 'person', 'people')}.`);
  }

  // A save written under 80 lost the title from the person, and one from
  // before the title was kept never had it.
  //
  // The player's own can still be there. Every save made from 72 on carried a
  // premise record naming the player's title, including the pick somebody on
  // they/them made, and 80 left that record in place as inert JSON while it
  // shed the title everywhere else. So the player's comes back from there when
  // it is. Where it is not, which is a save made under 80 or one from before
  // 72, the pronouns decide as they would have at creation, and a pick made
  // under they/them is gone: it comes back an actor.
  const premise = (universe as unknown as { premise?: { playerTitle?: unknown } }).premise;
  const recorded = isPerformerTitle(premise?.playerTitle) ? premise.playerTitle : undefined;
  let recovered = 0;
  let titled = 0;
  for (const person of Object.values(universe.people ?? {})) {
    const p = person as unknown as Record<string, unknown>;
    if (isPerformerTitle(p.performerTitle)) continue;
    if (p.id === universe.playerId && recorded) {
      p.performerTitle = recorded;
      recovered += 1;
      continue;
    }
    p.performerTitle = impliedPerformerTitle(typeof p.pronouns === 'string' ? p.pronouns : '');
    titled += 1;
  }
  if (recovered > 0) steps.push('Gave the player back the title the save recorded for them.');
  if (titled > 0) {
    steps.push(`Gave ${plural(titled, 'person', 'people')} a title from their pronouns.`);
  }
  // A save written under 80 to 82 lost the personality, and nothing is left
  // to read it back from, so it gets the one creation starts everybody on,
  // with no traits. A save from before 80 kept its own, and is only tidied:
  // every axis a number on the slider, and only traits that can be held
  // together, four at most.
  let personalised = 0;
  for (const person of Object.values(universe.people ?? {})) {
    const p = person as unknown as Record<string, unknown>;
    const was = p.personality as Partial<Personality> | undefined;
    const personality = cleanPersonality(was);
    const held = Array.isArray(p.personalityTraits) ? (p.personalityTraits as string[]) : undefined;
    const traits = cleanPersonalityTraits(held);
    const same = was !== undefined && typeof was === 'object'
      && (Object.keys(personality) as (keyof Personality)[]).every((key) => was[key] === personality[key])
      && held !== undefined && held.length === traits.length && held.every((id, i) => id === traits[i]);
    if (same) continue;
    p.personality = personality;
    p.personalityTraits = traits;
    personalised += 1;
  }
  if (personalised > 0) {
    steps.push(`Gave ${plural(personalised, 'person', 'people')} a personality this build can read.`);
  }

  // Citizenship is the country somebody was born in, and until 82 it was asked
  // for, so a save can hold one that disagrees with the birthplace. It follows
  // the birthplace now. A birthplace that names no real country leaves what
  // was there alone, because there is nothing better to put in its place.
  let rebased = 0;
  for (const person of Object.values(universe.people ?? {})) {
    const p = person as unknown as Record<string, unknown>;
    const born = typeof p.homeRegionId === 'string' ? citizenshipFor(p.homeRegionId) : undefined;
    if (!born || p.citizenshipId === born) continue;
    p.citizenshipId = born;
    rebased += 1;
  }
  if (rebased > 0) {
    steps.push(`Made ${plural(rebased, 'person', 'people')} a citizen of the country they were born in.`);
  }

  // The slot's career line is the player's title. Before 80 it named the film
  // career, and under 80 it was left empty.
  const player = universe.people?.[universe.playerId];
  if (player) universe.meta.careerLabel = PERFORMER_NOUN[player.performerTitle];

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

  // The player must exist and be coherent.
  const player = universe.people[universe.playerId];
  if (!player) errors.push('The save has no player.');
  else {
    if (!player.isPlayer) errors.push('The player record isn’t flagged as the player.');
    if (!CITIES.get(player.currentLocationId)) errors.push(`Player is in an unknown location '${player.currentLocationId}'.`);
    if (player.primaryAccountId && !universe.accounts[player.primaryAccountId]) {
      errors.push('Player primary account points at an account that doesn’t exist.');
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
  check('account', Object.values(universe.accounts));
  check('scheduled', universe.scheduled);

  // The timeline must be sorted and every pending item in the future or due.
  for (let i = 1; i < universe.scheduled.length; i++) {
    const prev = universe.scheduled[i - 1];
    const cur = universe.scheduled[i];
    if (prev && cur && prev.at > cur.at) {
      errors.push('The timeline isn’t sorted by time. Advancement would process events out of order.');
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
