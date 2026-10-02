/**
 * SLATE — your parents: their ages, their deaths, and their care (Stage 10 of
 * `docs/BACKLOG.md`, from 2026-10-02; the figures in `content/parents.ts`).
 *
 * A life has a mother and a father, met the first month the game reads them,
 * born their country's mean age before you and living where you were born.
 * Each one's death is drawn from the life table when they're met. From 65 a
 * parent may come to need care, in the years before they die; when they do,
 * Look After Them chooses how: pay for it where they live, give it yourself
 * in their town for the hours a carer gives, or leave it to the state and
 * their own means. A death weighs on you.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { clamp } from '../core/rng';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { CARE_HOURS, CARE_NEED, CARE_PRICE, CARING, PARENT_AGE } from '../content/parents';
import { countryFactor, tableChance } from './mortality';
import { supportPlace } from './support';
import { owe, payFromBank } from './household';
import { personalityOf } from './personality';

const YEAR_MS = 365.2425 * MS_DAY;

export interface Parent {
  role: 'mother' | 'father';
  born: Instant;
  cityId: string;
  dies: Instant;
  /** When care is needed, and of what kind; how you've chosen to see to it. */
  care?: { from: Instant; kind: 'home' | 'facility' };
  how?: 'pay' | 'give';
  died?: boolean;
  /** Told their care had begun. */
  told?: boolean;
}

export const parentsOf = (person: Person): Parent[] => person.parents ?? [];

/** The year a parent dies, drawn from the life table year by year from their age now. */
export function deathOf(sim: Simulation, key: string, born: Instant, countryId: string, at: Instant): Instant {
  const rng = sim.rng('family.parent', key, 'death');
  const factor = countryFactor(countryId);
  let age = Math.floor((at - born) / YEAR_MS);
  while (age < 120 && rng.next() >= Math.min(1, tableChance(age) * factor)) age += 1;
  return born + (age + rng.next()) * YEAR_MS;
}

/** Whether, and when, a parent's care begins: from 65, at the ACL's odds, the years before they die. */
export function careOf(sim: Simulation, key: string, role: Parent['role'], born: Instant, dies: Instant): Parent['care'] {
  const rng = sim.rng('family.parent', key, 'care');
  const at65 = born + CARE_NEED.from * YEAR_MS;
  if (dies <= at65 || rng.next() >= CARE_NEED.share) return undefined;
  const years = -Math.log(1 - rng.next()) * CARE_NEED.years[role];
  return { from: Math.max(at65, dies - years * YEAR_MS), kind: rng.next() < CARE_NEED.facility ? 'facility' : 'home' };
}

/** A life's parents, met: born their country's mean age before you, where you were born. */
export function meetParents(sim: Simulation, person: Person, at: Instant): Parent[] {
  if (person.parents) return person.parents;
  const cityId = person.homeRegionId ?? person.currentLocationId;
  const country = CITIES.get(cityId)?.countryId ?? 'us';
  const ages = PARENT_AGE[country] ?? PARENT_AGE.us!;
  person.parents = (['mother', 'father'] as const).map((role) => {
    const born = person.birthInstant - (role === 'father' ? ages.father ?? ages.mother : ages.mother) * YEAR_MS;
    const key = `${person.id}-${role}`;
    const dies = deathOf(sim, key, born, country, Math.max(at, person.birthInstant));
    const care = careOf(sim, key, role, born, dies);
    return { role, born, cityId, dies, ...(care ? { care } : {}) };
  });
  return person.parents;
}

export const needsCare = (p: Parent, at: Instant): boolean => !p.died && p.care !== undefined && at >= p.care.from && at < p.dies;

/** A month of a parent's care paid for, in the save's money, where they live; nothing where it isn't the family's to pay. */
export function careMonthly(sim: Simulation, p: Parent): Money {
  const price = CARE_PRICE[supportPlace(p.cityId)];
  if (!price || !p.care) return 0;
  const units = p.care.kind === 'facility' ? price.facilityMonthly : price.homeHourly !== undefined ? (price.homeHourly * CARE_HOURS[CITIES.get(p.cityId)?.countryId ?? 'us']! * 52) / 12 : undefined;
  if (!units) return 0;
  const c = Math.round(units * 100);
  const cur = saveCurrency(sim.universe);
  return cur === price.currency ? c : exchange(c, price.currency, cur) ?? c;
}

/** A carer's hours a week where you live. */
export const careHours = (person: Person): number => CARE_HOURS[CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId ?? 'us'] ?? CARE_HOURS.us!;

export function careRefusal(person: Person, p: Parent | undefined, how: 'pay' | 'give' | 'none', at: Instant): string | undefined {
  if (!p) return 'There’s no such parent.';
  if (!needsCare(p, at)) return 'They don’t need care.';
  if (how === 'give' && person.home?.cityId !== p.cityId) return `They live in ${CITIES.require(p.cityId).name}.`;
  return undefined;
}

/** The month: a parent who has died grieved; care paid for, or given. */
export function parentsMonth(sim: Simulation, person: Person, at: Instant): void {
  for (const p of meetParents(sim, person, at)) {
    if (p.died) continue;
    if (at >= p.dies) {
      p.died = true;
      const w = person.wellbeing;
      w.morale = clamp(w.morale - CARING.grief * personalityOf(person, 'moraleSwing'), 0, 100);
      if (person.id === sim.universe.playerId) sim.notify({ category: 'relationship', title: p.role === 'mother' ? 'Your Mother Died' : 'Your Father Died', body: `Your ${p.role} died, at ${Math.floor((p.dies - p.born) / YEAR_MS)}.`, importance: 90, route: '/workspace/people' });
      continue;
    }
    if (!needsCare(p, at)) continue;
    if (!p.told) {
      p.told = true;
      if (person.id === sim.universe.playerId) sim.notify({ category: 'relationship', title: p.role === 'mother' ? 'Your Mother Needs Care' : 'Your Father Needs Care', body: `Your ${p.role} needs ${p.care!.kind === 'facility' ? 'a care home' : 'care at home'} now. Look After Them on the People screen.`, importance: 80, route: '/workspace/people' });
    }
    if (p.how === 'pay') {
      const cost = careMonthly(sim, p);
      if (cost > 0 && !payFromBank(sim, person, cost, `Your ${p.role}’s care`, 'household')) owe(sim, person, cost, `Your ${p.role}’s care`, 'household');
    } else if (p.how === 'give') {
      const w = person.wellbeing;
      w.stress = clamp(w.stress + careHours(person) * (52 / 12) * CARING.stressPerHour * personalityOf(person, 'stressGain'), 0, 100);
    }
  }
}

export function registerParents(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'family.parents', (_e, { sim: s }) => {
    const person = s.player;
    if (zonedParts(s.now, s.homeZone).day !== 1) return;
    parentsMonth(s, person, s.now);
  });
  sim.onCommand<{ role: Parent['role']; how: 'pay' | 'give' | 'none' }, { how: string; monthly: Money }>('family.care', (p, { sim: s }) => {
    const person = s.player;
    const parent = meetParents(s, person, s.now).find((x) => x.role === p?.role);
    const how = p?.how === 'pay' || p?.how === 'give' ? p.how : 'none';
    const no = careRefusal(person, parent, how, s.now);
    if (no) throw new CommandError(no);
    if (how === 'none') delete parent!.how; else parent!.how = how;
    const monthly = how === 'pay' ? careMonthly(s, parent!) : 0;
    if (how === 'pay' && monthly === 0 && person.id === s.universe.playerId) s.notify({ category: 'relationship', title: 'Their Care', body: 'Where they live it isn’t the family’s to pay.', importance: 30, route: '/workspace/people' });
    return { how, monthly: monthly || 0 };
  });
}

export const formatCare = (sim: Simulation, p: Parent): string => formatMoney(careMonthly(sim, p), saveCurrency(sim.universe), { cents: false });
