/**
 * SLATE — a dating app (Stage 10 of `docs/BACKLOG.md`, from 2026-10-01;
 * `research-relationships.json`). Online is how 39% of American couples
 * who met in 2017 met (Rosenfeld and others, 2019), and somebody met there
 * isn't from the business.
 *
 * Tinder and Hinge at their observed monthly prices where they were read:
 * Tinder Plus $24.99, £17.48 and C$26.99; Hinge+ $29.99 in America; free
 * to use besides. A month on one brings matches in your town, people with
 * jobs of their own (`systems/marriage.ts`), single, who'd go out with you;
 * how many isn't published, and SLATE takes one a month free and two paid,
 * its estimate. A match starts as somebody you've just met, and a date is
 * an invitation like any other.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { contactsOf, newContact } from './people';
import { owe, payFromBank } from './household';

export const DATING_MONTH_KIND = 'dating.month';
const MONTH_MS = 365.2425 * MS_DAY / 12;

export interface AppPlan { app: 'tinder' | 'hinge'; tier: 'free' | 'paid'; label: string; monthly: Readonly<Record<string, { amount: number; currency: string }>> }
export const APPS: readonly AppPlan[] = [
  { app: 'tinder', tier: 'free', label: 'Tinder', monthly: {} },
  { app: 'tinder', tier: 'paid', label: 'Tinder Plus', monthly: { us: { amount: 24.99, currency: 'USD' }, uk: { amount: 17.48, currency: 'GBP' }, ca: { amount: 26.99, currency: 'CAD' } } },
  { app: 'hinge', tier: 'free', label: 'Hinge', monthly: {} },
  { app: 'hinge', tier: 'paid', label: 'Hinge+', monthly: { us: { amount: 29.99, currency: 'USD' } } },
];
/** Matches a month, by tier: SLATE's estimate, none being published. */
export const MATCHES = { free: 1, paid: 2 } as const;

export interface DatingApp { label: string; since: Instant }

const countryOf = (person: Person) => CITIES.get(person.home?.cityId ?? person.currentLocationId)?.countryId ?? 'us';

/** A plan's month in the save's money, or nothing where it's free; undefined where it isn't sold. */
export function appPrice(sim: Simulation, person: Person, label: string): Money | undefined {
  const plan = APPS.find((a) => a.label === label);
  if (!plan) return undefined;
  if (plan.tier === 'free') return 0;
  const p = plan.monthly[countryOf(person)];
  if (!p) return undefined;
  const cents = Math.round(p.amount * 100);
  const cur = saveCurrency(sim.universe);
  return cur === p.currency ? cents : exchange(cents, p.currency, cur) ?? cents;
}

/** A month's matches, met in your town. */
export function matchMonth(sim: Simulation, person: Person, at: Instant): number {
  const app = person.datingApp;
  const plan = app && APPS.find((a) => a.label === app.label);
  if (!plan) return 0;
  const town = person.home?.cityId ?? person.currentLocationId;
  for (let i = 0; i < MATCHES[plan.tier]; i += 1) {
    const c = newContact(sim, person, town, `app-${at}-${i}`, { at, how: 'online', what: plan.label });
    c.single = true;
    c.interested = true;
    contactsOf(person).push(c);
  }
  return MATCHES[plan.tier];
}

export function registerDating(sim: Simulation): void {
  sim.onCommand<{ label?: string }, { label?: string; paid: Money }>('dating.app', (p, { sim: s }) => {
    const person = s.player;
    const label = p?.label;
    for (const item of s.universe.scheduled) if (item.status === 'pending' && item.kind === DATING_MONTH_KIND && item.payload.personId === person.id) s.timeline.cancel(item.id, s.now);
    if (!label) { delete person.datingApp; return { paid: 0 }; }
    const price = appPrice(s, person, label);
    if (price === undefined) throw new CommandError(`${label} isn’t sold where you live, as far as SLATE has read.`);
    if (price > 0 && !payFromBank(s, person, price, `${label}, the month`, 'personal')) throw new CommandError('The bank couldn’t pay.');
    person.datingApp = { label, since: s.now };
    s.schedule({ at: s.now + MONTH_MS, kind: DATING_MONTH_KIND, label: `${label}, The Month`, category: 'relationship', priority: 40, payload: { personId: person.id } });
    return { label, paid: price };
  });

  sim.onSchedule(DATING_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const app = person?.datingApp;
    if (!person || !app) return;
    const n = matchMonth(s, person, item.at);
    if (person.id === s.universe.playerId) s.notify({ category: 'relationship', title: `${n} ${n === 1 ? 'Match' : 'Matches'} On ${app.label}`, body: 'Somebody new to ask out, on the People screen.', importance: 30, route: '/workspace/people' });
    const price = appPrice(s, person, app.label) ?? 0;
    if (price > 0 && !payFromBank(s, person, price, `${app.label}, the month`, 'personal')) owe(s, person, price, app.label, 'personal');
    s.schedule({ at: item.at + MONTH_MS, kind: DATING_MONTH_KIND, label: `${app.label}, The Month`, category: 'relationship', priority: 40, payload: { personId: person.id } });
  });
}
