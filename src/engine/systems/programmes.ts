/**
 * SLATE — a program watched at home, episode by episode (the master plan's
 * §34a, from 2026-10-03).
 *
 * Until then unwinding in front of the TV named only live TV or a service:
 * nothing was watched. Now each market's programs that week
 * (`content/programmes.ts`) are watched on a service the character pays for,
 * or on a broadcaster live and on its free player where the law's TV license
 * allows (`watchRefusal`). Each watch runs the real minutes of the episode
 * in front of them, to its end or for an hour, and where it stops is kept:
 * the next watch resumes there, into the next episode and the next season,
 * until the program runs out. A broadcaster's player holds its latest
 * series, so a broadcast program starts there.
 *
 * An hour's watching unwinds as an hour unwinding does
 * (`applyLookingAfter`); an episode shorter or longer unwinds by its share
 * of the hour, SLATE's reading of the same rate.
 */
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import { PROGRAMMES, type Programme } from '../content/programmes';
import { SERVICES } from '../content/homelife';
import { marketOf, planPrice, plansHere, subscriptionsOf, watchRefusal } from './homelife';
import { applyLookingAfter, lookAfterRefusal } from './life';
import { atHome } from './dwelling';
import { unwindComfort } from './furniture';
import { watchPower } from './televisions';

/** Where a program was left: season and episode from 0, minutes into it. */
export interface Watching { season: number; episode: number; minute: number; at: Instant }

export const programmesHere = (person: Person): Programme[] => PROGRAMMES.filter((p) => p.market === marketOf(person));
export const programmeById = (id: string): Programme | undefined => PROGRAMMES.find((p) => p.id === id);
const watchingOf = (person: Person): Record<string, Watching> => (person.watching ??= {});

/** Where it would be picked up: where it was left, or its start. */
export function placeIn(person: Person, p: Programme): Omit<Watching, 'at'> {
  const w = person.watching?.[p.id];
  if (w) return { season: w.season, episode: w.episode, minute: w.minute };
  return { season: p.broadcast ? p.seasons.length - 1 : 0, episode: 0, minute: 0 };
}

export const finished = (p: Programme, at: Omit<Watching, 'at'>): boolean => at.season >= p.seasons.length;

/** The way they'd watch it: a service of theirs that has it, or the broadcaster; nothing where none does. */
export function wayFor(person: Person, p: Programme): string | undefined {
  const mine = subscriptionsOf(person).find((s) => p.ways.includes(SERVICES.find((x) => x.id === s.id)?.service ?? ''));
  if (mine) return mine.id;
  return p.ways.includes('live') ? 'live' : undefined;
}

/** The cheapest plan where they live that shows it, to subscribe in place; nothing where none does or one of theirs already does. */
export function cheapestPlanFor(sim: Simulation, person: Person, p: Programme): { id: string; label: string; monthly: number } | undefined {
  if (wayFor(person, p)) return undefined;
  return plansHere(person)
    .filter((plan) => p.ways.includes(SERVICES.find((x) => x.id === plan.id)?.service ?? ''))
    .map((plan) => ({ id: plan.id, label: plan.label, monthly: planPrice(sim, person, plan) }))
    .sort((a, b) => a.monthly - b.monthly)[0];
}

/** Why it can't be watched now, or nothing. */
export function programmeRefusal(sim: Simulation, person: Person, p: Programme): string | undefined {
  if (!atHome(person)) return 'That’s at home.';
  if (finished(p, placeIn(person, p))) return `You’ve watched all of ${p.title}.`;
  const how = wayFor(person, p);
  if (!how) return `It’s on ${p.service}: you don’t subscribe to it.`;
  return watchRefusal(sim, person, how);
}

/** Moves a place on by some minutes; the minutes actually watched, short where the program runs out. */
export function watchOn(p: Programme, from: Omit<Watching, 'at'>, minutes: number): { to: Omit<Watching, 'at'>; watched: number } {
  const to = { ...from };
  let left = minutes;
  let watched = 0;
  while (left > 0 && !finished(p, to)) {
    const [episodes, length] = p.seasons[to.season]!;
    const step = Math.min(left, length - to.minute);
    to.minute += step;
    watched += step;
    left -= step;
    if (to.minute >= length) {
      to.minute = 0;
      to.episode += 1;
      if (to.episode >= episodes) { to.episode = 0; to.season += 1; }
    }
  }
  return { to, watched };
}

/** Minutes to the end of the episode in front of them. */
export function episodeLeft(p: Programme, at: Omit<Watching, 'at'>): number {
  return finished(p, at) ? 0 : p.seasons[at.season]![1] - at.minute;
}

export function registerProgrammes(sim: Simulation): void {
  sim.onCommand<{ programmeId: string; to?: 'episode' | 'hour' }, { watched: number; season: number; episode: number; minute: number; finished: boolean }>('tv.watch', (p, { sim: s }) => {
    const person = s.player;
    const prog = programmeById(String(p?.programmeId));
    if (!prog || prog.market !== marketOf(person)) throw new CommandError('That isn’t shown where you live.');
    const busy = lookAfterRefusal(s, 'unwind');
    if (busy) throw new CommandError(busy);
    const no = programmeRefusal(s, person, prog);
    if (no) throw new CommandError(no);
    const from = placeIn(person, prog);
    const { to, watched } = watchOn(prog, from, p?.to === 'hour' ? 60 : episodeLeft(prog, from));
    s.advanceTo(s.now + watched * 60_000);
    // The set at home drew its power for the time watched (`systems/televisions.ts`, from 2026-10-04).
    watchPower(person, watched);
    applyLookingAfter(person, 'unwind', s.now, 1, unwindComfort(person) * (watched / 60));
    watchingOf(person)[prog.id] = { ...to, at: s.now };
    return { watched, ...to, finished: finished(prog, to) };
  });
}
