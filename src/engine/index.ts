/**
 * SLATE — Engine entry point.
 *
 * `createSave` builds a new universe and puts the player into it. `loadSave`
 * rehydrates an existing one. Both return a Simulation with every system
 * registered, which is the only object the UI ever talks to.
 *
 * What is registered here is the scope the owner set on 2026-10-09: the life
 * as it stood on 2026-09-29 (wellbeing, sleep, food, weather, the world),
 * with the banking, the school and the papers as they stood on 2026-10-09.
 * The home and its rent, the journeys, the cars, the land and the career went
 * that day, and `migrate` takes what they kept off a save (schema 90).
 */

import { registerStateTax } from './systems/statetax';
import { registerImss } from './systems/imss';
import { registerHomePensions } from './systems/homepensions';
import { registerHomeBenefits } from './systems/homebenefits';
import { registerSocialSecurity } from './systems/socialsecurity';
import { registerStatePension } from './systems/statepension';
import { registerUniversalCredit } from './systems/universalcredit';
import { Simulation, type Command, type CommandResult } from './core/simulation';
import type { Personality, SaveUniverse } from './domain/model';
import { SAVE_SCHEMA_VERSION } from './domain/model';
import type { SaveAdapter, Slot } from './persistence/adapter';
import {
  addDays, formatDate, instantFromZoned, startOfDay, startOfNextDay, zonedParts, MS_DAY, MS_HOUR, MS_MINUTE,
} from './core/time';
import { formatMoneyCompact, saveCurrency } from './core/money';
import { clamp } from './core/rng';
import { plural, titleCaseLabel } from './core/text';
import { PERFORMER_NOUN, impliedPerformerTitle, isPerformerTitle } from './core/performer';
import { citizenshipFor } from './domain/citizenship';
import { cleanPersonality, cleanPersonalityTraits } from './systems/personality';

import { CITIES, isCountryLoaded, loadCountryCities } from './content/geography';
import { isHolidaysLoaded, loadCountryHolidays } from './content/holidays';

import { netWorth } from './systems/finance';
import { registerLife } from './systems/life';
import { registerPlans } from './world/plans';
import { registerSpending } from './systems/spending';
import { armCredit, openCredit, registerCredit } from './systems/credit';
import { armBirthdays, registerBirthdays } from './systems/birthdays';
import { registerMortality } from './systems/mortality';
import { nextChapter, registerTutorial } from './world/tutorial';
import { armBanking, openAt, registerBanking, rebank, startingBank } from './systems/banking';
import { registerBankMoves } from './systems/bankmoves';
import { registerTaxId } from './systems/taxid';
import { registerLending } from './systems/lending';
import { registerStatements } from './systems/statements';
import { armPayments, freshPayments, registerPayments } from './systems/payments';
import { armCardLife, registerCardLife } from './systems/cardlife';
import { registerCash } from './systems/cash';
import { registerAccountLife } from './systems/accountlife';
import { registerCardOffers } from './systems/cardoffers';
import { registerSecurity } from './systems/security';
import { enroll, registerSchool, yearOfStudy } from './systems/school';
import { registerLeave } from './systems/leave';
import { registerInjury } from './systems/injury';
import { attributesOf, derivedAbilities } from './systems/attributes';
import { WORK_KEPT, countWork, limitsOnce } from './systems/evaluation';
import { bodyOf } from './systems/body';
import { drawMateAbilities } from './systems/school';
import { bindCeiling, ceilingBefore, focusAt, ordinary, redateCredits, upgradeCraft } from './systems/school';
import { registerCoursework } from './systems/coursework';
import { registerClassmates } from './systems/classmates';
import { WHICH, hasProcess, holderFor, registerProduction } from './systems/production';
import { registerPractice } from './systems/practice';
import { addPractice, playOfCredit, registerEngagement } from './systems/engagement';
import { registerBriefs } from './systems/briefs';
import { registerWorkbook } from './systems/workbook';
import { workPiece } from './systems/workpieces';
import { genresOfPlay } from './content/plays';
import { registerPlayReading } from './systems/playreading';
import { registerAppointments } from './systems/appointments';
import { registerTherapy } from './systems/therapy';
import { registerAssistance } from './systems/assistance';
import { registerEiSelfEmployed } from './systems/eiself';
import { registerCitizenship } from './systems/citizenship';
import { registerResidence } from './systems/residence';
import { registerPaperVisits } from './systems/papervisits';
import { registerIdentity } from './systems/identity';
import { armHealth, registerHealth } from './systems/health';
import { registerUnemployment } from './systems/unemployment';
import { armCollection, armTaxes, registerTaxReturn } from './systems/taxreturn';
import { registerDocuments, startingDocuments } from './systems/documents';
import { registerPermission, scheduleUsStatus, US_STATUS_KIND } from './systems/permission';
import { YALE_DRAMA } from './content/school';
import { CARDS } from './content/cards';
import { registerWorld } from './world/world';
import {
  createUniverse, defaultConfig, wealthIn, type NewSaveConfig,
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
  registerSpending(sim);
  registerCredit(sim);
  registerBirthdays(sim);
  registerMortality(sim);
  registerTutorial(sim);
  registerBanking(sim);
  registerBankMoves(sim);
  registerStatements(sim);
  registerPayments(sim);
  registerCardLife(sim);
  registerCash(sim);
  registerAccountLife(sim);
  registerCardOffers(sim);
  registerSecurity(sim);
  registerSchool(sim);
  registerLeave(sim);
  registerCoursework(sim);
  registerClassmates(sim);
  registerProduction(sim, focusAt, ordinary);
  registerPractice(sim);
  registerEngagement(sim);
  registerBriefs(sim);
  registerWorkbook(sim, workPiece);
  registerPlayReading(sim);
  registerHealth(sim);
  registerAppointments(sim);
  registerTherapy(sim);
  registerInjury(sim);
  registerUnemployment(sim);
  registerUniversalCredit(sim);
  registerStatePension(sim);
  registerSocialSecurity(sim);
  registerHomeBenefits(sim);
  registerHomePensions(sim);
  registerImss(sim);
  registerAssistance(sim);
  registerEiSelfEmployed(sim);
  registerTaxReturn(sim);
  registerStateTax(sim);
  registerLending(sim);
  registerDocuments(sim);
  registerTaxId(sim);
  registerIdentity(sim);
  registerResidence(sim);
  registerCitizenship(sim);
  registerPermission(sim);
  registerPaperVisits(sim);
}

/** Recurring world processes every save needs running. */
function armWorldClock(sim: Simulation): void {
  const z = sim.homeZone;

  sim.schedule({
    at: startOfNextDay(sim.now, z),
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
  const wealth = wealthIn(config.wealth, saveCurrency(sim.universe));

  // --- Accounts -----------------------------------------------------------
  // At a real bank where they live (`systems/banking.ts`). A country the
  // tables have no bank for keeps a plain current account and savings.
  const bank = startingBank(config.startLocationId, config.bankId, player.citizenshipId === 'us');
  if (bank) {
    openAt(sim, player, bank, { checking: wealth.checking, savings: wealth.savings });
  } else {
    const checking = sim.openAccount({
      id: sim.nextId('account'), kind: 'checking', name: 'Current Account', ownerId: player.id,
      openedAt: sim.now, balance: wealth.checking,
    });
    player.primaryAccountId = checking.id;
    if (wealth.savings > 0) {
      sim.openAccount({
        id: sim.nextId('account'), kind: 'savings', name: 'Savings Account', ownerId: player.id,
        openedAt: sim.now, balance: wealth.savings,
      });
    }
  }

  if (wealth.cardLimit > 0) {
    // The bank's own card, under its own name (`content/cards.ts`). Until
    // 2026-09-26 it was "<bank> Credit Card" on American terms, and not the
    // bank's at all.
    const product = bank ? CARDS[bank.id] : undefined;
    const card = sim.openAccount({
      id: sim.nextId('account'),
      kind: 'credit_card',
      name: product && !('none' in product) ? product.name : bank ? bank.name + ' Credit Card' : 'Credit Card',
      ownerId: player.id,
      institution: bank?.name,
      ...(bank ? { bankId: bank.id } : {}),
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
  // A home was moved into here, its deposit held and its rent due on the first, until the home went on 2026-10-09.
  player.payments = freshPayments();
  openCredit(sim, player, wealth.creditScore);
  // The year's return for every life (`systems/taxreturn.ts`). It was armed by enrolling at the school and by the career's
  // start, and a life begun elsewhere had none, until the career went in the scope reset of 2026-10-09.
  armTaxes(sim, player);
  // And the health record and its months (`systems/health.ts`), armed the same two ways until the same day.
  armHealth(sim, player);
  armBirthdays(sim);
  armBanking(sim);
  // A life that begins at drama school, where it's in the school's town.
  if (config.school === YALE_DRAMA.id && config.startLocationId === YALE_DRAMA.cityId) enroll(sim, player);
}

/** Keeps the save-slot summary in step with the world. */
export function refreshMeta(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;
  const worth = netWorth(sim, player.id);
  sim.universe.meta.characterName = player.displayName;
  sim.universe.meta.portrait = player.portrait;
  // A finished life says so on its slot, on every adapter, since the slot
  // list the server sends carries the labels and not the rest of the meta.
  const ended = sim.universe.meta.endedAge;
  // Where the life is: the year at school, or how the school ended. Until
  // 2026-09-27 it was the title alone, Actor or Actress, whatever the life;
  // until 2026-10-09 the agency after the school, which went with the career.
  const school = player.school;
  const where = !school ? '' : school.standing === 'graduated' ? ', Yale Drama Graduate' : school.standing === 'dismissed' || school.standing === 'withheld' || school.standing === 'withdrawn' ? ', Left Yale Drama' : `, Yale Drama Year ${yearOfStudy(player)}`;
  sim.universe.meta.careerLabel = PERFORMER_NOUN[player.performerTitle] + where + (ended !== undefined ? `, Died At ${ended}` : '');
  sim.universe.meta.locationLabel = CITIES.get(player.currentLocationId)?.name ?? 'Unknown';
  sim.universe.meta.worldDateLabel = formatDate(sim.now, sim.homeZone);
  sim.universe.meta.netWorthLabel = formatMoneyCompact(worth.total, saveCurrency(sim.universe));
}

/** Creates a brand new save universe with every system wired up. */
export function createSave(slot: 1 | 2 | 3, seed: string, config: NewSaveConfig): Simulation {
  const { universe } = createUniverse(slot, seed, config);
  const sim = new Simulation(universe);
  registerAllSystems(sim);
  populateWorld(sim, config);
  // The attributes, drawn at the start of the life (`systems/attributes.ts`).
  attributesOf(sim, sim.player);
  // The papers the life begins with (`systems/documents.ts`).
  startingDocuments(sim, sim.player);
  // A foreign student's status looked at when it can next change (`systems/permission.ts`, from 2026-10-01).
  scheduleUsStatus(sim, sim.player);
  return sim;
}

/** Rehydrates an existing universe. */
export function loadSave(universe: SaveUniverse): Simulation {
  const sim = new Simulation(universe);
  registerAllSystems(sim);
  // What held work back, for life (`Journey.limits`, from 2026-10-12): a save from before reads it from the detail it
  // kept, once; the pieces it no longer kept aren't invented.
  for (const person of Object.values(universe.people)) {
    if (!person.journey || person.journey.limits) continue;
    person.journey.limits = {};
    // Each piece once for each input that held it back (`limitsOnce`), as `countWork` counts it.
    for (const w of person.work ?? []) for (const [k, x] of limitsOnce(w.limits)) {
      const t = (person.journey.limits[k] ??= { label: x.label, n: 0, whole: 0, last: w.at });
      t.n += 1;
      t.whole = Math.round((t.whole + x.whole) * 10) / 10;
      t.last = Math.max(t.last, w.at);
    }
  }
  // A guide read to its end before 2026-10-12 is marked finished, so a chapter added later doesn't reopen it.
  if (universe.tutorial && !universe.tutorial.finished && !nextChapter(sim)) universe.tutorial.finished = true;
  // A save from before the attributes draws them on opening, the same draw a new life makes.
  if (universe.people[universe.playerId]) attributesOf(sim, sim.player);
  // A save made before 2026-10-12 and opened on its first day has its body on opening, as a new life does from its first
  // moment (`drawnBody`, `systems/body.ts`): until then such a life had none until its first midnight.
  if (universe.people[universe.playerId] && !sim.player.body) bodyOf(sim, sim.player);
  // A note said again before 2026-10-13 began "Still: i …" where its words began with the word I (`noteText`): put right
  // on opening, in every production the player is in.
  if (universe.people[universe.playerId]) for (const which of WHICH) { const h = holderFor(sim, sim.player, which); if (hasProcess(h)) for (const n of h.process.notes) n.text = n.text.replace(/^Still: i(?=[\s’'])/, 'Still: I'); }
  // A save from before papers: the ones the life would have begun with (`startingDocuments`).
  if (universe.people[universe.playerId]) startingDocuments(sim, sim.player);
  // A save from before 2026-10-01 has no look at a foreign student's status on its calendar: one is put there.
  if (universe.people[universe.playerId] && !universe.scheduled.some((one) => one.status === 'pending' && one.kind === US_STATUS_KIND && one.payload.personId === universe.playerId)) scheduleUsStatus(sim, sim.player);
  // What a home held of theirs comes back, once, on the first opening after the home went (schema 90).
  returnTheHomesMoney(sim);
  // A save from before the 21 skills takes each from the area it grew out of: the actor, the class and the term's starting marks.
  for (const person of Object.values(universe.people)) {
    if (person.craft) upgradeCraft(person.craft);
    for (const mate of person.school?.classmates ?? []) upgradeCraft(mate.craft);
    if (person.school?.tally) upgradeCraft(person.school.tally.craftAtStart);
    // How far each can grow: the ceiling kept, or one for a save from before ceilings (`CEILING`).
    if (person.craft) { person.craftCeiling ??= ceilingBefore(person.craft); bindCeiling(person.craft, person.craftCeiling); }
    for (const mate of person.school?.classmates ?? []) { mate.ceiling ??= ceilingBefore(mate.craft); bindCeiling(mate.craft, mate.ceiling); }
    // A first class kept after a leave, bound too (integration pass, 2026-10-10): until then only the class the student was
    // in was, and after a reload a first class grew past its ceilings, on to 100.
    for (const c of person.school?.formerClasses ?? []) for (const mate of c.classmates) { mate.ceiling ??= ceilingBefore(mate.craft); bindCeiling(mate.craft, mate.ceiling); }
  }
  const zone = sim.homeZone;

  // Every build has armed the rollover for the start of a day, and until the
  // spring-forward fix the day after one whose clocks skipped midnight was
  // taken to start at the hour that day began: 01:00, or 01:01 in Beirut and
  // Cairo, whose days of the jump were taken to start at 01:01 too. A save
  // written on the day of the jump carries its next rollover that late, and a
  // Beirut or Cairo save from the day before carries the jump day's at 01:01.
  // It is put back to the start of its day, or to now when the save is already
  // past that. Only that much is moved: a rollover further off the start of
  // its day, as a change in a zone's rules between the browser that armed it
  // and the one that opens it can leave one, runs where it was armed, as it
  // always has.
  for (const one of sim.timeline.pending()) {
    if (one.kind !== 'life.day_rollover') continue;
    const start = startOfDay(one.at, zone);
    const late = one.at - start;
    if (late > 0 && late <= MS_HOUR + MS_MINUTE) sim.timeline.reschedule(one.id, Math.max(start, sim.now));
  }
  // A Beirut or Cairo save from then, stopped in the first hour of the night
  // that began its day of the jump, holds that night as owed from 01:01, where
  // that build ran the day's rollover. Paid from there by this build, it would
  // not be taken for a night from the start of the day, and the day's meals
  // would not be eaten after it: nourishment read 63.75 at seven, where the
  // same night owed from 01:00 reads 76.00. It is owed from the start of the
  // day. The rollover that ran at 01:01 is what marks such a save: this build
  // runs it at 01:00, and a night it owes from 01:01 itself, from a stop there,
  // is left where it is. Tested on the minute past the start alone, a save and
  // a reload fed that night's meals twice.
  const rolledAt = new Set(
    sim.universe.scheduled.filter((one) => one.kind === 'life.day_rollover' && one.status === 'done').map((one) => one.at),
  );
  for (const person of Object.values(sim.universe.people)) {
    const owed = person.nightOwedFrom;
    if (owed === undefined || !rolledAt.has(owed)) continue;
    const start = startOfDay(owed, zone);
    if (owed - start === MS_MINUTE) person.nightOwedFrom = start;
  }

  // A save whose clock has fallen off — because it was written by a build that
  // scheduled something this one no longer handles — gets it put back. Both
  // are idempotent: nothing is scheduled twice.
  const armed = (kind: string) =>
    sim.universe.scheduled.some((one) => one.kind === kind && one.status === 'pending');
  if (!armed('life.day_rollover')) {
    sim.schedule({
      at: startOfNextDay(sim.now, zone),
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
  // Anybody with a home had a rent due until the home went on 2026-10-09. Until 2026-09-26 anybody with a job
  // had their rota two weeks out and a payday ahead too.
  armPayments(sim);
  armCardLife(sim);
  armCredit(sim);
  for (const person of Object.values(sim.universe.people)) armCollection(sim, person);
  // A life the career used to arm the returns for, and one begun outside the school, has them armed now (schema 90).
  if (sim.universe.people[sim.universe.playerId]) { armTaxes(sim, sim.player); armHealth(sim, sim.player); }
  armBirthdays(sim);
  // A save from before the banks banked at "Northbank", which never existed.
  rebank(sim);
  armBanking(sim);
  return sim;
}

/**
 * What a home held of theirs, given back once its home is gone (schema 90): the deposit the landlord held
 * (`category: 'deposit'`), into the current account, and rent paid ahead (`payments.rentCredit`), the same way. What
 * was owed on rent and bills stays owed, in the account it was kept in, and is paid off from the bank as anything
 * unpaid is (`systems/spending.ts`). The ledger keeps every posting the home made; nothing is taken out of it.
 */
function returnTheHomesMoney(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    const current = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
    if (!current) continue;
    for (const held of Object.values(sim.universe.accounts)) {
      if (held.ownerId !== person.id || held.kind !== 'escrow' || held.category !== 'deposit' || held.closedAt || held.balance <= 0) continue;
      sim.post({ memo: 'The deposit back: the home went', category: 'rent', postings: [{ accountId: current.id, amount: held.balance }, { accountId: held.id, amount: -held.balance }] });
      held.closedAt = sim.now;
    }
    // Read off the save as it was written: the settings dropped it from their shape with the rent (schema 91).
    const old = person.payments as unknown as { rentCredit?: number } | undefined;
    const ahead = old?.rentCredit ?? 0;
    if (ahead > 0 && old) {
      sim.post({ memo: 'Rent paid ahead, back: the home went', category: 'rent', postings: [{ accountId: current.id, amount: ahead }, { accountId: sim.nominalAccount('liability_other', 'Rent Paid Ahead').id, amount: -ahead }] });
      delete old.rentCredit;
    }
  }
}

// ---------------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------------

/**
 * What schema 90 takes off a person: every field the home, the journeys, the cars, the land, the career, and the
 * shops, belongings, people, family and industry of the line of 2026-10-09 kept, and nothing in this build reads.
 */
const GONE_AT_90 = [
  'acUnits', 'adopted', 'aircraft', 'alcohol', 'applianceFaults', 'automation', 'bagClaims', 'basket', 'boat', 'boatCertificates',
  'boats', 'bodyClock', 'building', 'buying', 'caPensions', 'caravans', 'career', 'cart', 'children', 'cleaningSince', 'clothesBought',
  'clubs', 'commissions', 'confirmIdUntil', 'contacts', 'cooking', 'counter', 'datingApp', 'dayShortcuts', 'driving', 'exclusionUsedAt',
  'familyPath', 'foodHelp', 'furniture', 'garmentsToReplace', 'goingBags', 'groomedAt', 'gym', 'hap', 'home', 'homes', 'homesOwned',
  'inspectedUsed', 'items', 'journeys', 'land', 'landBuying', 'laundryDry', 'libraryCard', 'licensing', 'living', 'luggageId', 'mailHold',
  'makeup', 'marriage', 'mattressAt', 'measures', 'motoLicensing', 'moveBy', 'offersMade', 'orders', 'outfits', 'packingLists', 'parents',
  'pawns', 'pets', 'pilot', 'pilotTraining', 'planes', 'portables', 'powerCut', 'pregnancy', 'rentals', 'reservations', 'roadside',
  'routines', 'shaves', 'sitter', 'stay', 'styles', 'subscriptions', 'supplyCuts', 'telecom', 'testDriven', 'training', 'trip',
  'utilitiesAt', 'vehicles', 'watching', 'owned',
  'pensionStart', 'dressed', 'tvLicence', 'wornNow', 'clothesSince', 'billSplit', 'trying', 'suppliesSince', 'usesFirst', 'favorites',
  'ikeaCredit', 'lastShave', 'showerMinutes', 'lastMakeup', 'lastStyle', 'bulkyYear', 'nailsAt', 'pilotLicences',
] as const;

/** What schema 91 takes off, by where it's kept: each read only by what went on 2026-10-09. */
const GONE_AT_91 = {
  payments: ['rent', 'bills', 'checks', 'checkbookBought'],
  health: ['sag', 'equity', 'cobra', 'cobraOffer', 'lastUnion'],
  attrs: ['reputation', 'recognition'],
  person: ['returnedHomeAt', 'mobility', 'parkingPermit'],
  plastic: ['billersStale'],
  year: ['homeInterest', 'homeTax', 'homePmi', 'rentalRent', 'rentalCosts', 'homeGain', 'homeGainShort', 'homeGainExcluded', 'homeGain1250', 'rentalDisposed', 'lodgerRent', 'lodgerTaxed', 'farmRent', 'farmTaxed'],
} as const;

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
  // The command receipts went on 2026-09-27: nothing in play passed a key, and a save from before keeps them no more.
  if ('idempotency' in universe) { delete (universe as unknown as Record<string, unknown>).idempotency; steps.push('Dropped the command receipts.'); }
  record('counters', 'the counters');
  list('transactions', 'the transactions');
  list('scheduled', 'the timeline');
  list('notifications', 'the notifications');
  // The history of milestones went on 2026-10-02: only a night's sleep was written to it, and nothing read it.
  if ('history' in universe) { delete (universe as unknown as Record<string, unknown>).history; steps.push('Dropped the history: nothing read it.'); }
  if ('engineFailures' in universe) { delete (universe as unknown as Record<string, unknown>).engineFailures; steps.push('Dropped the failure log: a failure is said to the player as it happens.'); }

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
  // 'fast' and 'faster' went on 2026-10-12: no control sent either, and the command takes neither now.
  if (preferences?.timeSpeed === 'fast' || preferences?.timeSpeed === 'faster') {
    preferences.timeSpeed = 'live';
    steps.push('Moved the clock from a faster speed to live.');
  }

  // Schema 11 put every label in Title Case. Labels are written into the save
  // when they are created, so an older save would go on reading 'New day'
  // forever while a fresh one read 'New Day'.
  //
  // This is the one pass that goes by the number, because the shape can't tell
  // an old label from a title somebody typed: a plan named 'Lunch with Mom'
  // looks like a label from before 11. It ran on every save from this line once
  // 87 made all of them older than the build, and rewrote what players typed.
  let relabelled = 0;
  if (from < 11) {
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
    relabel(Object.values(universe.decisions ?? {}) as unknown as Record<string, unknown>[], 'title');
  }
  if (relabelled > 0) {
    steps.push(`Put ${relabelled} stored label${relabelled === 1 ? '' : 's'} into Title Case.`);
  }

  // A home owned was `owned` on the day homes came in, 2026-09-28, and the first of `homes` until the homes went on
  // 2026-10-09: `owned` is on schema 90's list of fields to drop.

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
    stamp(universe.notifications);
    if (reassigned > 0) steps.push(`Re-stamped ${reassigned} record${reassigned === 1 ? '' : 's'} onto this save.`);
  }

  // SLATE's own reduced-motion setting went on 2026-10-02; nothing could change it, and the system's preference stands.
  if (universe.preferences && 'reducedMotion' in universe.preferences) delete (universe.preferences as unknown as Record<string, unknown>).reducedMotion;
  if (!universe.preferences) {
    universe.preferences = { timeSpeed: 'live' };
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
  //
  // 87 sheds `reputationDriftedAt`. The line this one replaced as main wrote it
  // on its player from 79 on: the day its reputation last faded, so that a
  // skip forward cost what living the days would have. The reputation it timed
  // is already on this list, so the date goes with it.
  const SHED = [
    'attributes', 'prodigy', 'traits',
    'reputation', 'careerTrack', 'estateRole', 'quotes', 'relations', 'gender', 'residenceId',
    'householdId', 'stageName', 'skills', 'goals', 'lifestyle', 'creditScore', 'goatTraits',
    'secondCitizenshipId', 'reputationDriftedAt',
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
  //
  // A save from the line this one replaced as main kept three of the seven
  // axes, conscientiousness, emotional stability and ambition, and its traits.
  // They are tidied the same way and come through as they were, because that
  // line's creation screen held them to the same slider, the same thirty-five
  // traits and the same pairs. The other four axes start where creation starts
  // them.
  let personalised = 0;
  for (const person of Object.values(universe.people ?? {})) {
    const p = person as unknown as Record<string, unknown>;
    const was = p.personality as Partial<Personality> | undefined;
    const personality = cleanPersonality(was);
    const held = Array.isArray(p.personalityTraits) ? (p.personalityTraits as string[]) : undefined;
    const traits = cleanPersonalityTraits(held);
    const same = was !== undefined && was !== null && typeof was === 'object'
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

  // 88 charges the waking day as the clock moves, from when each person's
  // waking day began. Before it the midnight rollover charged the whole day
  // ahead at once, so a save from before 88 has already paid for the rest of
  // the day it was saved in, or, saved before its first midnight, never pays
  // for that day, as that build never would. Its people's waking day is
  // counted from the next midnight: counting from the moment it was saved
  // would charge that stretch twice, thirty points of energy for a save made
  // at two in the afternoon.
  //
  // The next midnight is the first instant of the next calendar date, where
  // the rollover runs. It was a day added to the start of today, which on a
  // day whose clocks skipped midnight was one the next morning (01:01 in
  // Beirut and Cairo). That build's rollover ran then too, and the night came
  // with it, late. Against a rollover at midnight, a waking day counted from
  // one takes the person to be asleep at that midnight, and the night waits
  // for the next stop before a sound sleeper would wake, or never comes.
  {
    const midnight = startOfNextDay(universe.now, universe.homeZone);
    let paid = 0;
    for (const person of Object.values(universe.people ?? {})) {
      const p = person as unknown as Record<string, unknown>;
      if (typeof p.awakeSince === 'number') continue;
      p.awakeSince = midnight;
      paid += 1;
    }
    if (paid > 0) {
      steps.push(`Kept ${plural(paid, 'person', 'people')} from being charged twice for the rest of today.`);
    }
  }

  // 89 gave every new character a day job, and a save from before it was
  // given one here. The job engine went on 2026-09-26, when the owner kept
  // SLATE to acting. A save from before that loses what it held: the past
  // before acting, the job, the pay record, and the shifts, paydays, tips and
  // benefit payments still on its calendar. The money they already paid
  // stays in the ledger, as money that came in. A save of that era carries its
  // job, and only such a save is cleared: `earnings` came back as acting's pay
  // record (`systems/earnings.ts`), and until 2026-09-28 its being there was
  // taken for the day job's, and every save lost its pay record, which the tax
  // returns, unemployment and union health read, each time it was opened.
  {
    let cleared = 0;
    for (const person of Object.values(universe.people ?? {})) {
      const p = person as unknown as Record<string, unknown>;
      if (!('job' in p) && !('beforeActing' in p)) continue;
      delete p.job;
      delete p.earnings;
      delete p.beforeActing;
      cleared += 1;
    }
    const before = universe.scheduled?.length ?? 0;
    if (universe.scheduled) universe.scheduled = universe.scheduled.filter((item) => item.status !== 'pending' || !item.kind.startsWith('work.'));
    const dropped = before - (universe.scheduled?.length ?? 0);
    if (cleared > 0 || dropped > 0) {
      steps.push(`Took the day job off ${plural(cleared, 'person', 'people')}, and ${plural(dropped, 'shift or payday', 'shifts and paydays')} off the calendar.`);
    }
  }
  // 89 gave a save without a home a room in a shared flat; the home went at 90.
  if (from < 89) {
    const worker = universe.people?.[universe.playerId];
    if (worker && !worker.credit) {
      const carried = Object.values(universe.accounts ?? {}).some((a) => a.ownerId === worker.id && a.kind === 'credit_card' && a.balance < 0);
      worker.credit = { score: 650, late: [], autopay: 'full', statementBalance: 0, paidSinceStatement: 0, carrying: carried };
      steps.push('Opened a credit record at 650, a fair middle, for a save that kept none.');
    }
  }

  // A card from before 2026-09-26 carried its bank's name and nothing else:
  // it is the bank's card now, the bank the current account is at when it
  // was opened, and it takes that bank's own name for it.
  {
    let tied = 0;
    const accounts = universe.accounts ?? {};
    for (const account of Object.values(accounts)) {
      if (account.kind !== 'credit_card' || account.bankId || account.closedAt) continue;
      const owner = universe.people?.[account.ownerId ?? ''];
      const current = owner?.primaryAccountId ? accounts[owner.primaryAccountId] : undefined;
      if (!current?.bankId) continue;
      account.bankId = current.bankId;
      const product = CARDS[current.bankId];
      if (product && !('none' in product) && account.name === current.institution + ' Credit Card') account.name = product.name;
      tied += 1;
    }
    if (tied > 0) steps.push(`Made ${plural(tied, 'card', 'cards')} the bank’s own.`);
  }

  // 90 is the scope the owner set on 2026-10-09: the home and its rent, the journeys, the cars, the land and the
  // career went, and the shops, the belongings, the people, the family and the industry that the line of
  // 2026-10-09 carried went with them. A save from either line sheds what they kept on its people, the calendar's
  // events and the decisions nothing handles now, and a classmate's career. Its identity, its money and every posting
  // in its ledger, its school, its papers and its body are kept. The morning a home had its food bought becomes the
  // person's (`fedOn`), and what the home held of theirs is given back when the save is opened (`returnTheHomesMoney`).
  {
    let shedFrom = 0;
    for (const person of Object.values(universe.people ?? {})) {
      const p = person as unknown as Record<string, unknown>;
      const home = p.home as { fedOn?: number } | undefined;
      if (home && typeof home.fedOn === 'number' && p.fedOn === undefined) p.fedOn = home.fedOn;
      let dropped = false;
      for (const key of GONE_AT_90) if (key in p) { delete p[key]; dropped = true; }
      for (const mate of person.school?.classmates ?? []) { const m = mate as unknown as Record<string, unknown>; if ('career' in m) { delete m.career; dropped = true; } }
      if (dropped) shedFrom += 1;
    }
    if (shedFrom > 0) steps.push(`Took the home, the journeys, the cars, the land, the career and what went with them off ${plural(shedFrom, 'person', 'people')}.`);
    // The calendar and the decisions: what this build has no handler for is let go, never run late.
    const probe = new Simulation(universe);
    registerAllSystems(probe);
    const kinds = new Set(probe.scheduleKinds());
    const before = universe.scheduled.length;
    universe.scheduled = universe.scheduled.filter((item) => item.status !== 'pending' || kinds.has(item.kind));
    const unscheduled = before - universe.scheduled.length;
    if (unscheduled > 0) steps.push(`Let go ${plural(unscheduled, 'event', 'events')} on the calendar that nothing here runs.`);
    let undecided = 0;
    for (const [id, decision] of Object.entries(universe.decisions ?? {})) {
      if (decision.resolvedAt !== undefined || decision.dismissedAt !== undefined) continue;
      if ((decision.actions ?? []).some((a) => a.commandKind && !probe.hasCommand(a.commandKind))) { delete universe.decisions[id]; undecided += 1; }
    }
    if (undecided > 0) steps.push(`Let go ${plural(undecided, 'decision', 'decisions')} that nothing here can carry out.`);
    // Where it's unsafe to bring forward, it isn't: a ledger that doesn't reconcile is refused, and the slot left as it was.
    const unbalanced = probe.ledger.audit();
    if (unbalanced.length > 0) problems.push(`This save’s money doesn’t reconcile (${unbalanced[0]}), so it can’t be brought forward safely. It hasn’t been changed.`);
  }

  // 91, the connected world of 2026-10-09: what only the home, the career and the move home reached. Run on every
  // open, as 90's is, so a save written between the two loses the same. A rent already paid ahead (`rentCredit`) is
  // kept, for `returnTheHomesMoney` to give back.
  {
    let shed = 0;
    const drop = (o: unknown, keys: readonly string[]) => {
      if (!o || typeof o !== 'object') return;
      const r = o as Record<string, unknown>;
      for (const k of keys) if (k in r) { delete r[k]; shed += 1; }
    };
    for (const person of Object.values(universe.people ?? {})) {
      drop(person.payments, GONE_AT_91.payments);
      drop(person.health, GONE_AT_91.health);
      drop(person.attrs, GONE_AT_91.attrs);
      drop(person, GONE_AT_91.person);
      for (const year of Object.values(person.earnings?.years ?? {})) drop(year, GONE_AT_91.year);
    }
    for (const account of Object.values(universe.accounts ?? {})) drop(account.plastic, GONE_AT_91.plastic);
    if (shed > 0) steps.push(`Let go ${plural(shed, 'thing', 'things')} only the home, the career and a move home reached.`);
  }

  // 92, the connected attributes of 2026-10-09. Run on every open, and a no-op once done: each step fills only what's
  // missing. Nothing is rerolled and no past is invented:
  // - the five new abilities, for anybody with a craft and drawn attributes, from what's already true of them
  //   (`derivedAbilities`: the mean of their kin in the craft, and discipline from conscientiousness);
  // - genre practice from the save's own record: each night a credit says was played, in its play's kinds, one
  //   night's practice shared among them; familiarity, sessions and interests begin at nothing, which is what the save
  //   records of them;
  // - the development history and the work history begin empty: the showings and nights judged before keep their
  //   bands as they were judged (`Showing`, `Run.nights`), under the rules of their time, and aren't judged again.
  {
    let filled = 0;
    let practiced = 0;
    for (const person of Object.values(universe.people ?? {})) {
      if (!person.craft) continue;
      const a = person.attrs as (Record<string, number | undefined> & object) | undefined;
      if (a) {
        const d = derivedAbilities(person) as unknown as Record<string, number>;
        for (const k of Object.keys(d)) if (a[k] === undefined) { a[k] = d[k]; filled += 1; }
      }
      if (!person.engagement) {
        person.engagement = { byGenre: {} };
        for (const credit of person.school?.credits ?? []) {
          const genres = genresOfPlay(playOfCredit(credit.production)) ?? [];
          for (let n = 0; n < (credit.wentOn ?? 0) && genres.length; n += 1) { addPractice(person, genres); practiced += 1; }
        }
      }
      person.development ??= { day: '', counts: {}, history: [] };
      person.work ??= [];
    }
    if (filled > 0) steps.push(`Drew ${plural(filled, 'ability', 'abilities')} from what the craft and the character already held.`);
    if (practiced > 0) steps.push(`Counted ${plural(practiced, 'night', 'nights')} on stage as practice in their plays’ genres.`);
  }

  // 93, the attributes finished (2026-10-10). Run on every open, a no-op once done:
  // - each classmate's abilities drawn and kept (`drawMateAbilities`), from their craft as it stands and the save's
  //   seed, so casting reads them by the same rules as the player's;
  // - the journey's durable counts built from the results the save holds (`countWork`). A save that had already
  //   reached the 160 kept in detail lost the ones before its oldest: `detailBefore` says from when, and nothing is
  //   made up for the time before it.
  {
    let mates = 0;
    let counted = 0;
    for (const person of Object.values(universe.people ?? {})) {
      for (const [i, m] of (person.school?.classmates ?? []).entries()) {
        if (m.abilities) continue;
        m.abilities = drawMateAbilities(universe.meta.seed, person.id, i, m.craft);
        mates += 1;
      }
      if (!person.journey && person.work?.length) {
        for (const w of person.work) { countWork(person, w); counted += 1; }
        if (person.work.length >= WORK_KEPT) person.journey!.detailBefore = person.work[0]!.at;
      }
    }
    if (mates > 0) steps.push(`Drew ${plural(mates, 'classmate’s abilities', 'classmates’ abilities')} from their craft.`);
    if (counted > 0) steps.push(`Counted ${plural(counted, 'judged piece of work', 'judged pieces of work')} into the journey’s lasting record.`);
  }

  // 94, the interests removed (2026-10-10, at the owner's word): each person's interests on the character sheet, and
  // what they'd done of them (`engagement.byInterest`: familiarity, sessions, satiation), dropped. Nothing else read
  // them. The genres, their familiarity and practice, and every ticket already paid on the ledger stay as they were.
  {
    let dropped = 0;
    for (const person of Object.values(universe.people ?? {})) {
      const p = person as unknown as { interests?: unknown; engagement?: { byInterest?: unknown } };
      if (p.interests !== undefined) { delete p.interests; dropped += 1; }
      if (p.engagement && p.engagement.byInterest !== undefined) delete p.engagement.byInterest;
    }
    if (dropped > 0) steps.push(`Let go of ${plural(dropped, 'person’s interests', 'people’s interests')}: the game no longer keeps them.`);
  }

  // The credits' years, from the acceptance pass of 2026-10-11 on: an older save's dated by their terms' casting notices,
  // once (`redateCredits`). Until then a credit kept the year it was written down, often the year after its run.
  {
    const school = universe.people?.[universe.playerId]?.school;
    if (school && !school.creditsDated) {
      const { redated, kept } = redateCredits(school, universe.notifications ?? []);
      if (redated > 0) steps.push(`Dated ${plural(redated, 'credit', 'credits')} by ${redated === 1 ? 'its run' : 'their runs'}, not the year ${redated === 1 ? 'it was' : 'they were'} written down.`);
      if (kept > 0) steps.push(`Kept the year of ${plural(kept, 'credit', 'credits')} with no casting notice left to date ${kept === 1 ? 'it' : 'them'}.`);
    }
  }

  // The slot's career line is the player's title. Before 80 it named the film
  // career, and under 80 it was left empty.
  const player = universe.people?.[universe.playerId];
  // The slot's line, where a save has none: `refreshMeta` writes the year at school or how it ended beside the title,
  // and an open doesn't take that back off (from 2026-10-12; until then every open wrote the bare title over it, and
  // a slot that migrated was saved back without the school year until the next autosave). A save from before 80 has
  // the film career's line, and that goes, whatever it says.
  if (player && (from < 80 || !universe.meta.careerLabel)) universe.meta.careerLabel = PERFORMER_NOUN[player.performerTitle];

  const migrated = from < SAVE_SCHEMA_VERSION || steps.length > 0;
  if (from < SAVE_SCHEMA_VERSION) steps.push(`Schema ${from} to ${SAVE_SCHEMA_VERSION}.`);
  universe.meta.schemaVersion = SAVE_SCHEMA_VERSION;

  return { migrated, from, to: SAVE_SCHEMA_VERSION, steps, problems };
}

/**
 * What opening a slot does before the game starts: refuse a save from a newer
 * build, and bring everything else forward.
 *
 * Every save goes through `migrate`, whatever number it carries. The number
 * used to decide, and when the line this one replaced as main also wrote 83, a
 * save of theirs that needed every step skipped all of them and broke the
 * first command run on it. `migrate` reads what a save holds, and on a save
 * that is already current it changes nothing, so running it every time asks
 * nothing of the number.
 *
 * A save that changed is written back, after a checkpoint of what was stored.
 * One opened out of the backup is not: restoring has already swapped the two,
 * and a checkpoint then copied the restored save over the newer one it had
 * just set aside, so the slot lost it. The first autosave writes it instead,
 * on this device. On Base44 the restore itself doesn't take yet; §10 of
 * `SLATE_CURRENT_MASTER_HANDOFF.md` says why.
 */
export async function openSlot(
  adapter: SaveAdapter,
  slot: Slot,
  opts: { fromBackup?: boolean } = {},
): Promise<{ universe: SaveUniverse; migration: MigrationResult } | { error: string }> {
  const fromBackup = opts.fromBackup ?? false;
  const universe = fromBackup ? await adapter.restoreBackup(slot) : await adapter.load(slot);
  if (!universe) return { error: fromBackup ? 'There’s no backup for that slot.' : 'That slot is empty.' };

  const from = universe.meta.schemaVersion ?? 1;
  if (from > SAVE_SCHEMA_VERSION) {
    return {
      error: `Slot ${slot} was written by a newer version of SLATE (schema ${from}). Opening it here could damage it, so it hasn’t been loaded.`,
    };
  }

  const migration = migrate(universe);
  if (migration.problems.length > 0) return { error: migration.problems.join(' ') };
  if (migration.migrated && !fromBackup) {
    await adapter.backup(slot);
    await adapter.save(universe);
  }
  return { universe, migration };
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
/**
 * Pulls in the full city list of every country a save needs before it can
 * be checked or opened: anywhere a person in it stands or calls home. The
 * gazetteer ships the larger places eagerly and the rest a country at a
 * time, and a city id carries its country as its first segment, so this
 * reads it off the ids. Until 2026-09-26 only resuming did this, after the
 * save screen had already checked the save, so a life begun in a town
 * outside the bundled set (Pittsburgh, Annapolis) was refused as being in
 * an unknown location. Since 2026-09-28 it brings the same countries'
 * holidays, which a bank there keeps as business days (`content/bankdays.ts`).
 */
export async function loadPlacesFor(universe: SaveUniverse, load: (countryId: string) => Promise<number> = loadCountryCities, holidays: (countryId: string) => Promise<number> = loadCountryHolidays): Promise<void> {
  const ids = new Set<string>();
  const countries = new Set<string>();
  for (const person of Object.values(universe.people ?? {})) {
    for (const cityId of [person.currentLocationId, person.homeRegionId]) {
      const countryId = cityId?.split('-')[0];
      if (countryId && !isHolidaysLoaded(countryId)) countries.add(countryId);
      if (!cityId || CITIES.get(cityId)) continue;
      if (countryId && !isCountryLoaded(countryId)) ids.add(countryId);
    }
  }
  await Promise.all([...[...ids].map((id) => load(id).catch(() => 0)), ...[...countries].map((id) => holidays(id).catch(() => 0))]);
}

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
