/**
 * SLATE — a personal trainer (Stage 11 of `docs/BACKLOG.md`, from
 * 2026-10-02), from `docs/research/world/research-hired-services.json` and
 * `research-gaps-services.json`, read 2026-10-02.
 *
 * **What a trainer does.** Supervised training builds more than training on
 * your own: Gavanda et al. (2025) measured 37% more squat strength gained
 * supervised; Storer et al. (2014) about twice the chest press, the leg press
 * not significantly more; Fisher et al.'s 2022 meta-analysis a standardized
 * strength effect of 0.40. SLATE takes Gavanda's 37% on a workout's build.
 *
 * **Who, and what it costs a session**, a town's named studios or trainers,
 * cheapest first: in New York Equinox's first tier, $120 to $135 (a
 * third-party page; Equinox publishes none); North Haven Health & Racquet's
 * $60 an hour near New Haven; in Los Angeles no named studio's rate was
 * confirmed, and the market's $75 to $150, the middle; PureGym's freelance
 * trainers' £30 to £50 and Third Space's from £85 in London; Swan Leisure's
 * €35 and Bodycoach's €60 in Dublin; Atom Athletics' C$84 and HST and Studio
 * Fitness's C$90 in Toronto; Noble Wellness's C$100 and Symmetrix's C$120 in
 * Vancouver; Mexico City's market, MX$500 to MX$1,200, about MX$730 on
 * average. A range is taken at its middle.
 *
 * Book one for a number of sessions a week: each workout while sessions are
 * left that week is one, paid at the trainer's price, and builds the more.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { spend } from './household';

export const SUPERVISED = 1.37;

export interface Trainer { id: string; cityId: string; name: string; currency: string; session: number; tax?: number }
export const TRAINERS: readonly Trainer[] = [
  { id: 'equinox-tier-1', cityId: 'us-ny-newyork', name: 'Equinox', currency: 'USD', session: (120 + 135) / 2 },
  { id: 'north-haven-health-racquet', cityId: 'us-ct-newhaven', name: 'North Haven Health & Racquet', currency: 'USD', session: 60 },
  { id: 'la-market', cityId: 'us-ca-losangeles', name: 'A Trainer At The Market Rate', currency: 'USD', session: (75 + 150) / 2 },
  { id: 'puregym-freelance', cityId: 'uk-eng-london', name: 'A PureGym Trainer', currency: 'GBP', session: (30 + 50) / 2 },
  { id: 'third-space', cityId: 'uk-eng-london', name: 'Third Space', currency: 'GBP', session: 85 },
  { id: 'swan-leisure', cityId: 'ie-lei-dublin', name: 'Swan Leisure', currency: 'EUR', session: 35 },
  { id: 'bodycoach', cityId: 'ie-lei-dublin', name: 'Bodycoach', currency: 'EUR', session: 60 },
  { id: 'atom-athletics', cityId: 'ca-on-toronto', name: 'Atom Athletics', currency: 'CAD', session: 84, tax: 0.13 },
  { id: 'studio-fitness', cityId: 'ca-on-toronto', name: 'Studio Fitness', currency: 'CAD', session: 90 },
  { id: 'noble-wellness', cityId: 'ca-bc-vancouver', name: 'Noble Wellness', currency: 'CAD', session: 100 },
  { id: 'symmetrix', cityId: 'ca-bc-vancouver', name: 'Symmetrix', currency: 'CAD', session: 120 },
  { id: 'cdmx-market', cityId: 'mx-cmx-mexicocity', name: 'A Trainer At The Market Rate', currency: 'MXN', session: 730 },
];

export interface Training { trainerId: string; perWeek: number; weekOf: Instant; used: number }

const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

/** A town's trainers, the cheapest session first. */
export const trainersIn = (cityId: string): Trainer[] => TRAINERS.filter((t) => t.cityId === cityId).sort((a, b) => a.session * (1 + (a.tax ?? 0)) - b.session * (1 + (b.tax ?? 0)));
export const sessionPrice = (sim: Simulation, t: Trainer): Money => inSave(sim, t.session * (1 + (t.tax ?? 0)), t.currency);

/**
 * A workout now with the trainer, if a session is left this week in their
 * town: paid, and its build's multiple; otherwise one.
 */
export function trainedSession(sim: Simulation, person: Person, at: Instant): number {
  const plan = person.training;
  const t = plan ? TRAINERS.find((x) => x.id === plan.trainerId) : undefined;
  if (!plan || !t || person.currentLocationId !== t.cityId) return 1;
  if (at - plan.weekOf >= 7 * MS_DAY) { plan.weekOf = at; plan.used = 0; }
  if (plan.used >= plan.perWeek) return 1;
  if (!spend(sim, person, sessionPrice(sim, t), `${t.name}, a session`, 'personal')) return 1;
  plan.used += 1;
  return SUPERVISED;
}

export function registerTrainers(sim: Simulation): void {
  sim.onCommand<{ trainerId?: string; perWeek?: number }, { perWeek: number }>('gym.trainer', (p, { sim: s }) => {
    const person = s.player;
    if (!p?.trainerId) { delete person.training; return { perWeek: 0 }; }
    const t = TRAINERS.find((x) => x.id === p.trainerId);
    if (!t || t.cityId !== person.currentLocationId) throw new CommandError('That trainer isn’t in the town you’re in.');
    const perWeek = Math.max(1, Math.min(5, Math.round(Number(p.perWeek) || 1)));
    person.training = { trainerId: t.id, perWeek, weekOf: s.now, used: 0 };
    return { perWeek };
  });
}
