/**
 * SLATE — Daily life: wellbeing, sleep and ordinary activities.
 *
 * Sleeping is a real interaction that advances the world. Eating, exercising,
 * commuting and relaxing all consume actual world time and move real state.
 * A day in SLATE is a budget of hours, and how you spend it matters.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, Person, Wellbeing } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, formatTime, instantFromZoned, zonedParts, MS_HOUR, MS_MINUTE, MS_DAY } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { CATALOG, RECIPES, retailPrice } from '../content/catalog';
import { EQUIPMENT_LABEL, FITTED_KITCHEN, equipmentFrom, type EquipmentKind } from '../content/kitchen';
import { works } from './household';
import { costOfLiving } from '../content/tax';
import { modifierFor } from '../domain/attributes';
import { personalityModifier } from '../content/personality-traits';
import { rememberFact } from './memory';
import { addMemory, applyDelta, findRelationship } from './relationships';
import { ceilingAt, recoveryFactorAt } from '../content/lifespan';
import { yearsBetween } from './lifespan';

// ---------------------------------------------------------------------------
// Wellbeing model
// ---------------------------------------------------------------------------

/** Hourly drain applied while awake. */
export const ENERGY_DRAIN_PER_HOUR = 3.0;
/**
 * How fast somebody gets hungry while awake, per hour.
 *
 * Calibrated against what a year of it costs: a little over three meals a
 * day and about seventeen dollars, which is what one person feeding
 * themselves in this city actually spends. It was four, back when nothing
 * called applyElapsedWellbeing and the number never mattered.
 */
export const NOURISHMENT_DRAIN_PER_HOUR = 2.0;

export function freshWellbeing(): Wellbeing {
  return {
    energy: 82, stress: 18, sleepDebt: 0, morale: 62,
    condition: 88, fitness: 50, travelFatigue: 0, nourishment: 75, hygiene: 80,
  };
}

/**
 * Applies the passage of time to a person's condition. Called by the world
 * tick rather than by individual activities, so it stays consistent whether an
 * hour passed by playing or by skipping.
 */
/** One of this person's personality knobs, or 1 when they hold nothing that touches it. */
export function personalityOf(person: Person, key: string): number {
  return personalityModifier(person.personalityTraits ?? [], key);
}

export function applyElapsedWellbeing(person: Person, hours: number, opts: { asleep?: boolean } = {}): void {
  const w = person.wellbeing;
  if (opts.asleep) return;

  const traitDrain = modifierFor(person, 'stressPerShootDay') * personalityOf(person, 'stressGain');
  w.energy = clamp(w.energy - ENERGY_DRAIN_PER_HOUR * hours * (1 + (w.sleepDebt / 24) * 0.5), 0, 100);
  w.nourishment = clamp(w.nourishment - NOURISHMENT_DRAIN_PER_HOUR * hours, 0, 100);
  w.sleepDebt = Math.min(60, w.sleepDebt + hours * 0.34);

  // Running on empty costs you.
  if (w.energy < 15) w.stress = clamp(w.stress + hours * 1.6 * traitDrain, 0, 100);
  if (w.nourishment < 20) {
    w.condition = clamp(w.condition - hours * 0.5, 0, 100);
    w.morale = clamp(w.morale - hours * 0.7, 0, 100);
  }
  if (w.stress > 75) w.condition = clamp(w.condition - hours * 0.25, 0, 100);

  const recovery = modifierFor(person, 'recoveryRate') * personalityOf(person, 'stressRecovery');
  w.stress = clamp(w.stress - hours * 0.35 * recovery, 0, 100);

  // Travel wears off faster on somebody restless and slower on a homebody.
  // Hygiene is not touched here — places.ts owns that tick, and draining it
  // in two places would drain it twice.
  w.travelFatigue = clamp(w.travelFatigue - hours * 0.9 * (2 - personalityOf(person, 'travelFatigue')), 0, 100);
}

/**
 * A single 0-100 readiness number other systems consult: how well is this
 * person going to perform right now?
 */
export function readiness(person: Person): number {
  const w = person.wellbeing;
  const energyPart = remap(w.energy, 0, 100, 0.45, 1.15);
  const stressPart = remap(w.stress, 0, 100, 1.12, 0.62);
  const debtPart = remap(w.sleepDebt, 0, 30, 1.05, 0.66);
  const nourishPart = remap(w.nourishment, 0, 100, 0.78, 1.05);
  const moralePart = remap(w.morale, 0, 100, 0.82, 1.12);
  const travelPart = remap(w.travelFatigue, 0, 100, 1.0, 0.80);
  // Turning up to a room having not showered in two days is not nothing, but
  // it is not much either: a few points, not a career.
  const cleanPart = remap(w.hygiene ?? 80, 0, 100, 0.92, 1.03);
  // Legs that have not forgiven yesterday's squats. Real, and short-lived.
  const sorePart = remap(person.training?.soreness ?? 0, 0, 100, 1.0, 0.84);
  return clamp(100 * energyPart * stressPart * debtPart * nourishPart * moralePart * travelPart * cleanPart * sorePart / 1.35, 5, 100);
}

export function wellbeingSummary(person: Person): string {
  const w = person.wellbeing;
  if (w.energy < 15) return 'Running on empty. You need sleep before anything else.';
  if (w.sleepDebt > 20) return 'Badly short on sleep. Everything is harder than it should be.';
  if (w.stress > 78) return 'Stretched very thin. Something is going to give.';
  if (w.nourishment < 25) return 'Hungry, and it’s starting to show.';
  if (w.energy > 75 && w.stress < 30) return 'Rested, steady and ready for a real day.';
  if (w.morale < 30) return 'Flat. The work is fine, the feeling isn’t.';
  return 'Holding up.';
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export interface ActivityDef {
  id: string;
  name: string;
  category: 'rest' | 'care' | 'food' | 'fitness' | 'leisure' | 'social' | 'chores' | 'transport' | 'creative';
  description: string;
  /** Default duration in minutes. */
  minutes: number;
  /** Whether the player can choose the duration. */
  variableDuration?: { min: number; max: number };
  /** Effects applied per hour of the activity. */
  perHour: Partial<Record<keyof Wellbeing, number>>;
  /** One-off effects applied on completion. */
  onComplete?: Partial<Record<keyof Wellbeing, number>>;
  /** Base cost in cents before local pricing. */
  cost?: Money;
  /** Skill or attribute practised, with gain per hour. */
  practises?: { key: string; kind: 'attribute' | 'skill'; gain: number }[];
  /** Requires being at home. */
  requiresHome?: boolean;
  /** Requires another person present. */
  requiresCompanion?: boolean;
  /** Tags used by search and the tutorial. */
  tags: string[];
}

export const ACTIVITIES: readonly ActivityDef[] = [
  { id: 'shower', name: 'Shower And Get Ready', category: 'care', description: 'Twenty minutes that make the rest of the day possible.', minutes: 25, perHour: { energy: 6, stress: -8, morale: 4, hygiene: 200 }, requiresHome: true, tags: ['morning', 'grooming'] },
  { id: 'nap', name: 'Take A Nap', category: 'rest', description: 'A short sleep that takes the edge off without touching your sleep debt much.', minutes: 45, variableDuration: { min: 20, max: 120 }, perHour: { energy: 22, stress: -14, sleepDebt: -0.8 }, tags: ['rest'] },
  { id: 'rest', name: 'Rest', category: 'rest', description: 'Sit down and do nothing in particular.', minutes: 60, variableDuration: { min: 15, max: 240 }, perHour: { energy: 8, stress: -9, morale: 2 }, tags: ['rest'] },
  { id: 'cook', name: 'Cook A Meal', category: 'food', description: 'Uses what is in your kitchen. Cheaper and better than ordering.', minutes: 40, perHour: { energy: -3, stress: -4 }, practises: [{ key: 'cooking', kind: 'skill', gain: 1.1 }], requiresHome: true, tags: ['food', 'kitchen'] },
  { id: 'eat_out', name: 'Eat Out', category: 'food', description: 'Somebody else cooks and you pay for the privilege.', minutes: 75, perHour: { stress: -6, morale: 5 }, cost: 62_00, tags: ['food', 'social'] },
  { id: 'order_in', name: 'Order Delivery', category: 'food', description: 'Fast, convenient, and the most expensive way to eat badly.', minutes: 20, perHour: { stress: -2 }, cost: 38_00, tags: ['food', 'fast'] },
  { id: 'gym', name: 'Train At The Gym', category: 'fitness', description: 'An hour that costs energy now and returns it for months.', minutes: 75, variableDuration: { min: 30, max: 150 }, perHour: { energy: -14, stress: -16, fitness: 2.4, condition: 1.2, morale: 5, hygiene: -18 }, cost: 0, practises: [{ key: 'fitness', kind: 'skill', gain: 1.8 }], tags: ['health', 'fitness'] },
  { id: 'run', name: 'Go For A Run', category: 'fitness', description: 'Free, immediate, and the fastest way to move stress.', minutes: 45, variableDuration: { min: 20, max: 120 }, perHour: { energy: -12, stress: -18, fitness: 1.9, condition: 0.9, morale: 6, hygiene: -22 }, practises: [{ key: 'fitness', kind: 'skill', gain: 1.4 }], tags: ['health', 'free'] },
  { id: 'watch', name: 'Watch Something', category: 'leisure', description: 'Research, if you want to call it that.', minutes: 110, variableDuration: { min: 30, max: 300 }, perHour: { energy: 2, stress: -8, morale: 6 }, practises: [{ key: 'script_analysis', kind: 'attribute', gain: 0.35 }], tags: ['leisure', 'research'] },
  { id: 'read', name: 'Read', category: 'leisure', description: 'Slower than watching and considerably better for the work.', minutes: 60, variableDuration: { min: 20, max: 240 }, perHour: { energy: -1, stress: -10, morale: 5 }, practises: [{ key: 'script_analysis', kind: 'attribute', gain: 0.6 }, { key: 'character_writing', kind: 'skill', gain: 0.5 }], tags: ['leisure', 'craft'] },
  { id: 'rehearse', name: 'Rehearse', category: 'creative', description: 'Work on material by yourself. Nobody sees it and it shows on the day.', minutes: 90, variableDuration: { min: 30, max: 240 }, perHour: { energy: -7, stress: 2 }, practises: [{ key: 'preparation', kind: 'attribute', gain: 1.0 }, { key: 'memorization', kind: 'attribute', gain: 0.8 }, { key: 'emotional_truth', kind: 'attribute', gain: 0.35 }], tags: ['craft', 'acting'] },
  { id: 'write', name: 'Write', category: 'creative', description: 'Pages, or the honest attempt at pages.', minutes: 120, variableDuration: { min: 30, max: 360 }, perHour: { energy: -8, stress: 3, morale: 2 }, practises: [{ key: 'page_speed', kind: 'skill', gain: 1.0 }, { key: 'dialogue', kind: 'skill', gain: 0.7 }, { key: 'story_structure', kind: 'skill', gain: 0.6 }], tags: ['craft', 'writing'] },
  { id: 'errands', name: 'Run Errands', category: 'chores', description: 'The unglamorous hour that stops things falling apart.', minutes: 70, perHour: { energy: -6, stress: 3 }, tags: ['chores'] },
  { id: 'housework', name: 'Housework', category: 'chores', description: 'Keeps the place in condition, which is worth more than it sounds.', minutes: 60, perHour: { energy: -8, stress: -2 }, requiresHome: true, tags: ['chores', 'home'] },
  { id: 'socialise', name: 'See Friends', category: 'social', description: 'The thing that keeps you a person rather than a career.', minutes: 150, variableDuration: { min: 60, max: 360 }, perHour: { energy: -4, stress: -14, morale: 9 }, cost: 45_00, requiresCompanion: false, tags: ['social', 'relationships'] },
  { id: 'network', name: 'Industry Event', category: 'social', description: 'A room full of people who could change your year.', minutes: 180, perHour: { energy: -9, stress: 6, morale: 2 }, cost: 30_00, practises: [{ key: 'networking', kind: 'attribute', gain: 1.4 }], tags: ['career', 'social'] },
  { id: 'commute', name: 'Commute', category: 'transport', description: 'Time you don’t get back.', minutes: 45, perHour: { energy: -5, stress: 7 }, tags: ['transport'] },
];

export const ACTIVITY_BY_ID: Readonly<Record<string, ActivityDef>> =
  Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// The kitchen
// ---------------------------------------------------------------------------

/**
 * What you can actually cook with, and how good it is.
 *
 * A home is fitted: a hob, an oven, a fridge, pans, a knife. Everything past
 * that is a thing you went out and bought, and the machine you bought is
 * better than the one that came with the flat, which is the entire reason
 * anybody buys one. The number against each kind is the quality of the best
 * one you own of it.
 */
export function kitchenOf(sim: Simulation, personId: Id): Map<EquipmentKind, number> {
  const kit = new Map<EquipmentKind, number>();
  const person = sim.universe.people[personId];
  if (!person?.residenceId) return kit;
  for (const kind of FITTED_KITCHEN) kit.set(kind, 50);
  for (const asset of Object.values(sim.universe.assets)) {
    if (asset.ownerId !== personId || asset.soldAt) continue;
    // A broken machine is not a slow machine. It does nothing at all.
    if (!works(asset)) continue;
    const item = asset.catalogId ? CATALOG.get(asset.catalogId) : undefined;
    if (!item) continue;
    for (const kind of equipmentFrom(item.name, item.category)) {
      // A thing in poor condition is a worse thing to cook with.
      const worth = Math.round(item.quality * clamp(asset.condition / 100, 0.4, 1));
      kit.set(kind, Math.max(kit.get(kind) ?? 0, worth));
    }
  }
  return kit;
}

/** The kit a dish needs that you do not have, in words. */
export function missingEquipment(sim: Simulation, personId: Id, recipeId: string): string[] {
  const recipe = RECIPES.get(recipeId);
  if (!recipe) return [];
  const kit = kitchenOf(sim, personId);
  return recipe.equipment
    .filter((kind) => !kit.has(kind as EquipmentKind))
    .map((kind) => EQUIPMENT_LABEL[kind as EquipmentKind] ?? kind);
}

/** Who else is at home to be fed right now. */
export function othersAtHome(sim: Simulation, personId: Id): Id[] {
  const person = sim.universe.people[personId];
  if (!person?.residenceId) return [];
  return Object.values(sim.universe.people)
    .filter((other) => other.id !== personId && (other.aliveUntil === undefined || other.aliveUntil > sim.now) && other.residenceId === person.residenceId)
    .map((other) => other.id);
}

export function registerLife(sim: Simulation): void {
  sim.onSchedule('life.day_rollover', () => {
    dailyRollover(sim);
    sim.schedule({
      at: addDays(startOfLocalDay(sim), 1, sim.homeZone),
      kind: 'life.day_rollover',
      label: 'New Day',
      category: 'system',
      priority: 5,
    });
  });

  // --- Sleep ---------------------------------------------------------------

  sim.onCommand<{ hours: number; startAt?: number }, { wokeAt: number; quality: number; recovered: number }>(
    'life.sleep',
    (p, { sim: s }) => {
      const person = s.player;
      const hours = clamp(p.hours, 0.5, 16);
      const start = p.startAt ?? s.now;
      if (start < s.now) throw new CommandError('You can’t go to sleep in the past.');
      const wakeAt = start + Math.round(hours * MS_HOUR);

      // Anything scheduled during the night still happens; the world does not
      // pause because the player is unconscious.
      const crossed = s.timeline.between(s.now, wakeAt).filter((i) => i.requiresPlayer === true);

      const quality = sleepQuality(s, person);
      const before = { ...person.wellbeing };

      if (start > s.now) s.advanceTo(start);
      s.emit('life.sleep_started', { personId: person.id, hours, quality });
      s.advanceTo(wakeAt);

      applySleep(person, hours, quality, s.now);
      person.lastSleptAt = s.now;
      const recovered = person.wellbeing.energy - before.energy;

      s.emit('life.woke', { personId: person.id, hours, quality, recovered });
      s.remember({
        category: 'life',
        title: hours >= 7 ? 'Slept well' : 'Short night',
        detail: `${hours.toFixed(1)} hours, waking at ${formatTime(s.now, s.zone)}.`,
        refs: [{ type: 'person', id: person.id }],
        significance: 3,
        public: false,
      });

      if (crossed.length > 0) {
        s.notify({
          category: 'schedule',
          title: `You Slept Through ${crossed.length} Commitment${crossed.length === 1 ? '' : 's'}`,
          body: crossed.map((c) => c.label).join(', '),
          importance: 70,
          route: '/workspace/calendar',
        });
      }

      return { wokeAt: s.now, quality, recovered };
    },
  );

  // --- Activities ----------------------------------------------------------

  sim.onCommand<{ activityId: string; minutes?: number; companionId?: Id; accountId?: Id }, { finishedAt: number; effects: Record<string, number>; cost: Money }>(
    'life.do_activity',
    (p, { sim: s }) => {
      const def = ACTIVITY_BY_ID[p.activityId];
      if (!def) throw new CommandError(`No such activity: ${p.activityId}`);
      const person = s.player;

      const minutes = clamp(
        p.minutes ?? def.minutes,
        def.variableDuration?.min ?? def.minutes,
        def.variableDuration?.max ?? def.minutes,
      );

      if (def.requiresHome && !person.residenceId) {
        throw new CommandError(`${def.name} needs somewhere to live. You don’t have a home yet.`);
      }
      if (person.wellbeing.energy < 8 && (def.perHour.energy ?? 0) < 0) {
        throw new CommandError('You’re too exhausted for that. Sleep first.');
      }

      const conflicts = s.timeline.conflicts(s.now, minutes);
      if (conflicts.length > 0) {
        const first = conflicts[0];
        throw new CommandError(
          `That would run into "${first?.label}" at ${formatTime(first?.at ?? s.now, s.zone)}. Move one of them first.`,
        );
      }

      let cost = 0;
      if (def.cost) {
        cost = Math.round(def.cost * costOfLiving(person.currentLocationId));
        const accountId = p.accountId ?? person.primaryAccountId;
        if (!accountId) throw new CommandError('No account to pay from.');
        if (s.ledger.availableFunds(accountId) < cost) {
          throw new CommandError(`${def.name} costs about ${formatMoney(cost)} and you can’t cover it right now.`);
        }
        s.expense(accountId, cost, def.name, def.category === 'food' ? 'dining' : 'lifestyle');
      }

      const hours = minutes / 60;
      s.advanceTo(s.now + minutes * MS_MINUTE);

      const effects = applyActivity(s, person, def, hours);
      s.emit('life.activity_completed', { personId: person.id, activityId: def.id, minutes, cost, effects });
      return { finishedAt: s.now, effects, cost };
    },
  );

  // --- Cooking -------------------------------------------------------------

  sim.onCommand<
    { recipeId: string; forPeopleIds?: Id[] },
    { servings: number; nourishment: number; fed: Id[]; usedEquipment: string[] }
  >(
    'life.cook',
    (p, { sim: s }) => {
      const recipe = RECIPES.get(p.recipeId);
      if (!recipe) throw new CommandError('No such recipe.');
      const person = s.player;
      if (!person.residenceId) throw new CommandError('You need a kitchen. You don’t have a home yet.');

      // The kit before the food: there is no point checking the pantry for a
      // dish you have nothing to cook it in.
      const kit = kitchenOf(s, person.id);
      const short = recipe.equipment.filter((kind) => !kit.has(kind as EquipmentKind));
      if (short.length > 0) {
        const words = short.map((kind) => EQUIPMENT_LABEL[kind as EquipmentKind] ?? kind);
        throw new CommandError(`You don’t have what you need to cook that: ${words.join(', ')}. Appliances are in Shopping.`);
      }

      // Check the pantry actually has the ingredients.
      const missing: string[] = [];
      const consume: { itemId: Id; quantity: number }[] = [];
      for (const ing of recipe.ingredients) {
        let needed = ing.quantity;
        for (const stock of Object.values(s.universe.pantry)) {
          if (stock.catalogId !== ing.catalogId || stock.quantity <= 0) continue;
          if (stock.expiresAt < s.now) continue;
          const take = Math.min(needed, stock.quantity);
          consume.push({ itemId: stock.id, quantity: take });
          needed -= take;
          if (needed <= 0.0001) break;
        }
        if (needed > 0.0001) missing.push(CATALOG.get(ing.catalogId)?.name ?? ing.catalogId);
      }
      if (missing.length > 0) {
        throw new CommandError(`You’re missing ${missing.join(', ')}. Buy groceries first.`);
      }

      for (const c of consume) {
        const stock = s.universe.pantry[c.itemId];
        if (!stock) continue;
        stock.quantity = Math.max(0, stock.quantity - c.quantity);
        if (stock.quantity <= 0.0001) delete s.universe.pantry[c.itemId];
      }

      // What you cooked it with. A machine better than the fitted one does
      // something the fitted one does not: a cleaner plate, a shorter job.
      const used = recipe.equipment.map((kind) => kit.get(kind as EquipmentKind) ?? 50);
      const kitQuality = used.length > 0 ? used.reduce((a, b) => a + b, 0) / used.length : 50;
      const kitEdge = clamp((kitQuality - 50) / 100, -0.1, 0.45);

      const skill = person.skills['cooking'] ?? 5;
      const difficultyGap = skill - recipe.difficulty;
      const qualityMultiplier = clamp(0.62 + difficultyGap / 90 + kitEdge * 0.5, 0.45, 1.45);
      const nourishment = Math.round(recipe.nourishment * qualityMultiplier);
      // Good kit is quicker. It never makes a slow braise a fast one.
      const minutes = Math.max(2, Math.round(recipe.prepMinutes * (1 - kitEdge * 0.4)));

      s.advanceTo(s.now + minutes * MS_MINUTE);
      person.wellbeing.nourishment = clamp(person.wellbeing.nourishment + nourishment, 0, 100);
      person.wellbeing.morale = clamp(person.wellbeing.morale + recipe.quality * qualityMultiplier * 0.04, 0, 100);
      person.wellbeing.energy = clamp(person.wellbeing.energy - minutes * 0.05, 0, 100);
      person.skills['cooking'] = clamp(skill + 0.6, 0, 100);

      // The rest of what you made goes to whoever is there to eat it. You get
      // one serving; the others get one each until the dish runs out.
      const offered = p.forPeopleIds ?? othersAtHome(s, person.id);
      const fed: Id[] = [];
      for (const otherId of offered) {
        if (fed.length >= recipe.servings - 1) break;
        const other = s.universe.people[otherId];
        if (!other || other.id === person.id) continue;
        other.wellbeing.nourishment = clamp(other.wellbeing.nourishment + nourishment, 0, 100);
        other.wellbeing.morale = clamp(other.wellbeing.morale + recipe.quality * qualityMultiplier * 0.05, 0, 100);
        rememberFact(s, other.id, {
          kind: 'event', aboutId: person.id, weight: 34, sourceKind: 'cooking',
          text: `${person.displayName} cooked ${recipe.name} for them.`,
        });
        const rel = findRelationship(s, person.id, other.id);
        if (rel) {
          applyDelta(rel.dimensions, { affection: 1.4, trust: 0.6, familiarity: 0.8 });
          addMemory(s, rel, {
            kind: 'cooked_for', summary: `You cooked ${recipe.name} for them.`,
            impact: 2, decayDays: 120,
          });
        }
        fed.push(other.id);
      }

      s.emit('life.cooked', {
        personId: person.id, recipeId: recipe.id, servings: recipe.servings,
        nourishment, fed, minutes,
      });
      return {
        servings: recipe.servings, nourishment, fed,
        usedEquipment: recipe.equipment.slice(),
      };
    },
  );

  sim.onCommand<{ catalogId: string; accountId?: Id }, { nourishment: number; cost: Money }>(
    'life.eat',
    (p, { sim: s }) => {
      const person = s.player;
      const item = CATALOG.get(p.catalogId);
      if (!item) throw new CommandError('No such item.');

      // Prefer eating from the pantry; only pay if it is a dining purchase.
      let cost = 0;
      const stock = Object.values(s.universe.pantry).find((i) => i.catalogId === p.catalogId && i.quantity > 0 && i.expiresAt > s.now);
      if (stock) {
        stock.quantity = Math.max(0, stock.quantity - 1);
        if (stock.quantity <= 0.0001) delete s.universe.pantry[stock.id];
      } else if (item.category === 'dining') {
        cost = retailPrice(item.id, 'greenrow', costOfLiving(person.currentLocationId));
        const accountId = p.accountId ?? person.primaryAccountId;
        if (!accountId) throw new CommandError('No account to pay from.');
        if (s.ledger.availableFunds(accountId) < cost) throw new CommandError(`That costs ${formatMoney(cost)} and you can’t cover it.`);
        s.expense(accountId, cost, item.name, 'dining');
      } else {
        throw new CommandError(`You don’t have any ${item.name}. Buy some first.`);
      }

      const nourishment = item.nourishment ?? 15;
      s.advanceTo(s.now + (item.category === 'dining' ? 55 : 15) * MS_MINUTE);
      person.wellbeing.nourishment = clamp(person.wellbeing.nourishment + nourishment, 0, 100);
      person.wellbeing.morale = clamp(person.wellbeing.morale + item.quality * 0.03, 0, 100);
      person.lastAteAt = s.now;
      s.emit('life.ate', { personId: person.id, catalogId: item.id, nourishment, cost });
      return { nourishment, cost };
    },
  );
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

export function startOfLocalDay(sim: Simulation): number {
  const p = zonedParts(sim.now, sim.homeZone);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day }, sim.homeZone);
}

/** 0-1 quality of a night's sleep, from the bed, the stress and the hour. */
export function sleepQuality(sim: Simulation, person: Person): number {
  let quality = 0.72;

  const property = person.residenceId ? sim.universe.properties[person.residenceId] : undefined;
  if (!property) quality -= 0.18;
  else {
    quality += remap(property.condition, 0, 100, -0.12, 0.10);
    const bedroom = Object.values(sim.universe.rooms).find(
      (r) => r.kind === 'bedroom' && sim.universe.structures[r.structureId]?.propertyId === property.id,
    );
    if (bedroom) quality += remap(bedroom.quality, 0, 100, -0.06, 0.16);
  }

  quality -= remap(person.wellbeing.stress, 0, 100, 0, 0.24);
  quality += modifierFor(person, 'recoveryRate') * 0.06 - 0.06;
  // A light sleeper and a night owl both lose here; somebody who can sleep
  // anywhere gains it back.
  quality *= personalityOf(person, 'sleepQuality');

  const hour = zonedParts(sim.now, sim.zone).hour;
  if (hour >= 1 && hour < 5) quality -= 0.08; // going to bed very late
  return clamp(quality, 0.28, 1);
}

export function applySleep(person: Person, hours: number, quality: number, at?: number): void {
  const w = person.wellbeing;
  // A night puts back less at sixty than it did at twenty. This is the first
  // thing about ageing anybody notices, so it is the first thing the game
  // does with it.
  const years = at === undefined ? 0 : yearsBetween(person.birthInstant, at, 'UTC');
  const banked = at === undefined ? 1 : recoveryFactorAt(years);
  const effective = hours * quality;

  w.energy = clamp(w.energy + effective * 13.5 * banked * personalityOf(person, 'energyRecovery'), 0, 100);
  // Debt clears with the whole night, not only with the part of it above five
  // and a half hours. The old formula only ever paid down the excess, which
  // was harmless while nothing accrued debt in the first place — once the
  // waking day started running, an ordinary night cleared about two points
  // against six accrued and every character spiralled into the cap.
  w.sleepDebt = Math.max(0, w.sleepDebt - Math.max(0, effective - 5.5) * 2.2 - effective * 1.4);
  if (hours < 6) w.sleepDebt += (6 - hours) * 1.35;
  w.stress = clamp(w.stress - effective * 4.2, 0, 100);
  // Proportional, not a step. These used to be a threshold at six and a half
  // effective hours, which an unattended night never reaches — so a coasting
  // character lost morale every single night and sat at zero forever. Five
  // hours of real rest is break-even; more than that helps, less costs.
  const restful = effective - 5;
  // And a good night still cannot take a body above what a body that age can
  // reach. The daily clamp is not enough on its own: sleep runs after it.
  const ceiling = at === undefined ? 100 : ceilingAt(years).condition;
  w.condition = clamp(Math.min(w.condition + restful * 0.9 * (restful > 0 ? banked : 1), ceiling), 0, 100);
  w.morale = clamp(w.morale + restful * 1.6 * (restful > 0 ? banked : 1), 0, 100);
  w.travelFatigue = clamp(w.travelFatigue - effective * 6, 0, 100);
  w.nourishment = clamp(w.nourishment - hours * 1.6, 0, 100);
}

function applyActivity(sim: Simulation, person: Person, def: ActivityDef, hours: number): Record<string, number> {
  const effects: Record<string, number> = {};
  const w = person.wellbeing;

  for (const [key, perHour] of Object.entries(def.perHour) as [keyof Wellbeing, number][]) {
    const delta = perHour * hours;
    const before = w[key];
    w[key] = clamp(before + delta, 0, key === 'sleepDebt' ? 60 : 100);
    effects[key] = Math.round((w[key] - before) * 10) / 10;
  }
  if (def.onComplete) {
    for (const [key, delta] of Object.entries(def.onComplete) as [keyof Wellbeing, number][]) {
      const before = w[key];
      w[key] = clamp(before + delta, 0, key === 'sleepDebt' ? 60 : 100);
      effects[key] = (effects[key] ?? 0) + Math.round((w[key] - before) * 10) / 10;
    }
  }

  const trainingGain = modifierFor(person, 'trainingGain');
  for (const practice of def.practises ?? []) {
    const sheet = practice.kind === 'attribute' ? person.attributes : person.skills;
    const current = sheet[practice.key] ?? 0;
    // Diminishing returns: the last ten points are far harder than the first ten.
    const headroom = remap(current, 0, 100, 1.0, 0.12);
    const gain = practice.gain * hours * trainingGain * headroom;
    sheet[practice.key] = clamp(current + gain, 0, 100);
    effects[practice.key] = Math.round(gain * 100) / 100;
  }

  void sim;
  return effects;
}

/** Runs once per local day: property wear, relationship drift, weekly upkeep. */
/**
 * What living on autopilot tops out at. A player who actually manages sleep,
 * food and downtime should always be able to do better than these.
 */
const COASTING_ENERGY_CEILING = 74;
const COASTING_STRESS_FLOOR = 14;
const COASTING_NOURISHMENT_TARGET = 76;

/** What the unattended day accounts for, sleep included. */
const HOURS_IN_A_DAY = 24;

export function dailyRollover(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;

  // Homes and cars wear.
  for (const property of Object.values(sim.universe.properties)) {
    if (property.soldAt) continue;
    property.condition = clamp(property.condition - 0.012, 0, 100);
  }
  for (const asset of Object.values(sim.universe.assets)) {
    if (asset.soldAt) continue;
    const def = asset.catalogId ? CATALOG.get(asset.catalogId) : undefined;
    const rate = def?.depreciation ?? 0.15;
    asset.currentValue = Math.max(0, Math.round(asset.currentValue * (1 - rate / 365)));
  }

  // Fitness decays without use; condition slowly recovers toward fitness. And
  // both are held under what a body of that age can reach, so a seventy year
  // old with perfect habits is a very fit seventy year old rather than
  // indistinguishable from a very fit twenty five year old.
  for (const person of Object.values(sim.universe.people)) {
    if (person.tier === 'dormant' || person.tier === 'background') continue;
    const w = person.wellbeing;
    const ceiling = ceilingAt(yearsBetween(person.birthInstant, sim.now, sim.homeZone));
    w.fitness = clamp(Math.min(w.fitness - 0.18, ceiling.fitness), 0, 100);
    const target = Math.min(60 + w.fitness * 0.4, ceiling.condition);
    w.condition = clamp(Math.min(w.condition + (target - w.condition) * 0.02, ceiling.condition), 0, 100);
  }

  liveTheUnattendedDay(sim);

  sim.emit('world.day_rollover', { date: sim.now });
}

/**
 * People sleep and eat whether or not anybody tells them to.
 *
 * The player directing a night's sleep or a meal is always better than this:
 * they choose the hours, they choose the food, and they get the full benefit.
 * But a character who is simply carried forward by the clock — which is what
 * Skip to Event and a long jump both do — must not starve in a fortnight and
 * stay ruined forever. A default night is a mediocre night, not a free one.
 */
function liveTheUnattendedDay(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    if (person.tier !== 'full' && person.tier !== 'active') continue;
    const w = person.wellbeing;

    // A night they did not plan. Shorter, poorer, and it does not clear debt
    // the way a deliberate one does.
    const sinceSlept = person.lastSleptAt === undefined ? Number.POSITIVE_INFINITY : sim.now - person.lastSleptAt;
    let sleptHours = 0;
    if (sinceSlept >= 20 * MS_HOUR) {
      const quality = sleepQuality(sim, person) * 0.95;
      const hours = clamp(7.8 - w.stress * 0.012, 5.4, 8.4);
      sleptHours = hours;
      applySleep(person, hours, quality, sim.now);
      person.lastSleptAt = sim.now;

      // Coasting keeps you going; it does not get you to your best. Choosing
      // when and how long to sleep is worth something, so autopilot stops
      // short of what a deliberate night reaches.
      w.energy = Math.min(w.energy, COASTING_ENERGY_CEILING);
      w.stress = Math.max(w.stress, COASTING_STRESS_FLOOR);
    }

    // And then the rest of the day happens.
    //
    // This is the line that was missing. applyElapsedWellbeing existed, was
    // exported and was called by nothing at all, so a coasted day only ever
    // ran its sleep: energy never drained, stress never built, sleep debt
    // never accrued, and hunger moved about ten points instead of eighty. A
    // character carried forward by the clock was permanently well rested and
    // ate two thirds of a meal a day.
    applyElapsedWellbeing(person, Math.max(0, HOURS_IN_A_DAY - sleptHours));

    // Meals. Out of the pantry if there is any, otherwise the cheapest thing
    // nearby, and only while they can actually pay for it. Somebody working
    // eleven-hour days eats more than somebody who is not, so this tops up to
    // a target rather than counting out a fixed three plates. Going hungry
    // because the money ran out is a real outcome; going hungry because the
    // simulation would only serve you three times is not.
    for (let meal = 0; meal < 6 && w.nourishment < COASTING_NOURISHMENT_TARGET; meal++) {
      if (!eatWhateverIsAround(sim, person)) break;
    }

    // Going without food is a real consequence, not a stuck number.
    if (w.nourishment < 25) {
      w.energy = clamp(w.energy - 6, 0, 100);
      w.condition = clamp(w.condition - 0.6, 0, 100);
      w.morale = clamp(w.morale - 1.2, 0, 100);
    }
  }
}

/**
 * The default meal: pantry first, then the cheapest thing they can afford.
 * Returns whether they actually managed to eat.
 */
function eatWhateverIsAround(sim: Simulation, person: Person): boolean {
  const w = person.wellbeing;

  const stock = Object.values(sim.universe.pantry)
    .filter((i) => i.quantity > 0 && i.expiresAt > sim.now && i.householdId === person.householdId)
    .sort((a, b) => a.expiresAt - b.expiresAt)[0];
  if (stock) {
    stock.quantity = Math.max(0, stock.quantity - 1);
    if (stock.quantity <= 0.0001) delete sim.universe.pantry[stock.id];
    const item = CATALOG.get(stock.catalogId);
    w.nourishment = clamp(w.nourishment + (item?.nourishment ?? 15), 0, 100);
    person.lastAteAt = sim.now;
    return true;
  }

  if (!person.isPlayer) {
    // NPCs feed themselves off-screen; their money is not modeled.
    w.nourishment = clamp(w.nourishment + 30, 0, 100);
    person.lastAteAt = sim.now;
    return true;
  }

  const accountId = person.primaryAccountId;
  if (!accountId) return false;
  const col = costOfLiving(person.currentLocationId);

  // Somebody feeding themselves without a plan shops, they do not eat out
  // three times a day. They also do not eat one thing for the rest of their
  // life: taking the single best value in the catalog every time meant the
  // same line of pasta five hundred and twenty-seven times in a year, and food
  // costing under four dollars a day. Pick from the good-value end, weighted,
  // so it is still somebody being careful with money and not the same meal
  // forever.
  const candidates = CATALOG.all()
    .filter((i) => (i.category === 'groceries' || i.category === 'dining') && (i.nourishment ?? 0) > 0)
    .filter((i) => !isIngredientOnly(i.name))
    .map((i) => {
      const retailer = i.category === 'groceries' ? 'valuemart' : 'cornerstore';
      const cost = Math.max(1, retailPrice(i.id, retailer, col));
      return { item: i, cost, value: (i.nourishment ?? 0) / cost };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, UNPLANNED_MEAL_CHOICES)
    .filter((c) => sim.ledger.availableFunds(accountId) >= c.cost);
  if (candidates.length === 0) return false;

  const rng = sim.rng('meal', person.id, sim.now);
  const picked = rng.weighted(candidates, (c) => c.value);
  sim.expense(accountId, picked.cost, `${picked.item.name} — ${rng.pick(UNPLANNED_MEAL_NOTES)}`, 'food');
  w.nourishment = clamp(w.nourishment + (picked.item.nourishment ?? 15), 0, 100);
  person.lastAteAt = sim.now;
  return true;
}

/**
 * Things nobody eats as they are.
 *
 * The unplanned meal picks the best value in the shop, and once the larder
 * carried what a recipe actually needs that meant a careful person was living
 * on plain flour and tinned coconut milk, which costs almost nothing and is
 * not eating. Flour is an ingredient. So is stock, so is oil, so is a jar of
 * cumin. They are bought to cook with, and the cook command is where they
 * belong.
 */
const INGREDIENT_ONLY = /flour|yeast|baking powder|stock|pur[\u00e9e]+e?|pastry|vinegar|\boil\b|extract|paste|polenta|sugar|peppercorns|salt|paprika|cumin|cinnamon|oregano|bay leaves|chilli flakes|coconut milk|breadcrumbs|gochujang|harissa|miso/i;

function isIngredientOnly(name: string): boolean {
  return INGREDIENT_ONLY.test(name);
}

/**
 * How wide the net is when somebody eats without having shopped.
 *
 * Forty is the value end of the catalog — the staples, the everyday
 * proteins, the bread, and the occasional bought lunch. Wider than this and a
 * careful person is eating tasting menus; narrower and they live on dried
 * pasta and tinned beans, which was what happened when the larder arrived and
 * filled the cheap end with forty more things to be careful with.
 */
const UNPLANNED_MEAL_CHOICES = 40;

/** Why it was that, this time. Read straight off the bank statement. */
const UNPLANNED_MEAL_NOTES: readonly string[] = [
  'eating without a plan',
  'because it was what was in',
  'standing up at the counter',
  'eaten at the desk',
  'grabbed on the way past',
  'nothing else in the house',
  'quickest thing there was',
  'out of the packet',
  'because the shop was still open',
  'not really a meal',
];

/** How many hours until the player must be somewhere. */
export function hoursUntilNextCommitment(sim: Simulation): number | undefined {
  const next = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true);
  if (!next) return undefined;
  return (next.at - sim.now) / MS_HOUR;
}

/** A sensible default bedtime given tomorrow's first commitment. */
export function suggestedSleep(sim: Simulation): { hours: number; reason: string } {
  const next = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true);
  const debt = sim.player.wellbeing.sleepDebt;
  const ideal = clamp(7.5 + debt * 0.12, 6, 11);
  if (!next) return { hours: Math.round(ideal * 2) / 2, reason: 'Nothing is scheduled, so sleep as long as you need.' };

  const available = (next.at - sim.now) / MS_HOUR - 1.5;
  if (available < ideal) {
    return {
      hours: Math.max(3, Math.round(available * 2) / 2),
      reason: `"${next.label}" is in ${available.toFixed(1)} hours, so a full night isn’t available.`,
    };
  }
  return { hours: Math.round(ideal * 2) / 2, reason: debt > 8 ? 'You’re carrying real sleep debt.' : 'A normal night.' };
}

export const DAY_MS = MS_DAY;
