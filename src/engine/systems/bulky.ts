/**
 * SLATE — a piece of furniture got rid of, collected by the council as its
 * own rules say (the master plan's §35d, from 2026-10-03;
 * `docs/research/world/research-home-property-gaps.json`, each council's own
 * page unless marked).
 *
 * - New York: DSNY collects up to six items a collection day, free, no
 *   appointment, set out the night before.
 * - Los Angeles: LA Sanitation, free and unlimited, asked for a business day
 *   ahead of the collection day.
 * - New Haven: $50 an appointment for a tenant, a homeowner's first of the
 *   year free (read secondhand).
 * - London: Westminster's bulky collection, £36 for up to six items and £6.40
 *   each after, done within three working days.
 * - Toronto: an oversized item goes out on garbage day, free, no tag.
 * - Mexico City: Sunday is the day for bulky things, free (read secondhand).
 * - Vancouver has no curbside collection of large items, and Dublin's wasn't
 *   read, so nothing is collected there.
 * It's taken on the next business day, or two where the town asks a day's
 * notice or does it within days, SLATE's reading where no day is published.
 * Collected, it's gone, and the floor it took is free.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { CITIES } from '../content/geography';
import { afterBusinessDays } from '../content/bankdays';
import { inSaveMoney } from './banking';
import { payFromBank } from './household';
import { homeKeyOf, itemsOf } from './items';

interface BulkyRule { fee: (items: number, firstThisYear: boolean) => number; currency: string; maxItems?: number; days: number }
export const BULKY: Readonly<Record<string, BulkyRule>> = {
  'us-ny-newyork': { fee: () => 0, currency: 'USD', maxItems: 6, days: 1 },
  'us-ca-losangeles': { fee: () => 0, currency: 'USD', days: 2 },
  'us-ct-newhaven': { fee: (_n, first) => (first ? 0 : 50), currency: 'USD', days: 2 },
  'uk-eng-london': { fee: (n) => 36 + Math.max(0, n - 6) * 6.4, currency: 'GBP', days: 3 },
  'ca-on-toronto': { fee: () => 0, currency: 'CAD', days: 2 },
  'mx-cmx-mexicocity': { fee: () => 0, currency: 'MXN', days: 2 },
};
export const BULKY_KIND = 'items.bulky_collected';

export function bulkyRefusal(person: Person, itemIds: readonly string[]): string | undefined {
  const home = homeKeyOf(person.home);
  if (!home || person.home!.kind === 'sofa') return 'There’s no home of yours to collect from.';
  const rule = BULKY[person.home!.cityId];
  if (!rule) return person.home!.cityId === 'ca-bc-vancouver' ? 'Vancouver collects no large items at the curb: they’re taken to its transfer stations.' : 'SLATE doesn’t know how the council here collects large items.';
  if (itemIds.length === 0) return 'Choose what goes.';
  if (rule.maxItems && itemIds.length > rule.maxItems) return `It takes ${rule.maxItems} items a collection day.`;
  for (const id of itemIds) {
    const it = itemsOf(person).find((i) => i.id === id);
    if (!it || !it.bulky || it.at.kind !== 'home' || it.at.home !== home) return 'Only furniture at home is collected.';
    if (it.collectAt !== undefined) return `The ${it.label} is booked for collection.`;
  }
  return undefined;
}

export function bulkyFee(sim: Simulation, person: Person, items: number): Money {
  const rule = BULKY[person.home?.cityId ?? ''];
  if (!rule) return 0;
  const year = new Date(sim.now).getUTCFullYear();
  const first = (person.bulkyYear ?? 0) !== year;
  return inSaveMoney(sim, Math.round(rule.fee(items, first) * 100), rule.currency);
}

export function registerBulky(sim: Simulation): void {
  sim.onCommand<{ itemIds: string[] }, { collectAt: Instant; fee: Money }>('items.discard', (p, { sim: s }) => {
    const person = s.player;
    const ids = Array.isArray(p?.itemIds) ? p.itemIds.map(String) : [];
    const no = bulkyRefusal(person, ids);
    if (no) throw new CommandError(no);
    const rule = BULKY[person.home!.cityId]!;
    const fee = bulkyFee(s, person, ids.length);
    if (fee > 0 && !payFromBank(s, person, fee, 'A bulky collection', 'household')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    person.bulkyYear = new Date(s.now).getUTCFullYear();
    const city = CITIES.require(person.home!.cityId);
    const collectAt = afterBusinessDays(s.now, rule.days, city.countryId, city.timeZone);
    for (const id of ids) itemsOf(person).find((i) => i.id === id)!.collectAt = collectAt;
    s.schedule({ at: collectAt, kind: BULKY_KIND, label: 'A Bulky Collection', category: 'home', priority: 30, payload: { personId: person.id, itemIds: ids } });
    return { collectAt, fee };
  });
  sim.onSchedule(BULKY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    const ids = new Set((item.payload.itemIds as string[]) ?? []);
    person.items = itemsOf(person).filter((i) => !(ids.has(i.id) && i.collectAt !== undefined));
  });
}
