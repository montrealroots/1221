/**
 * SLATE — a series' seasons: renewed, canceled and revived (from 2026-10-24, the owner's brief 25, Part 13;
 * `docs/verification/career-world-2026-10-23/criteria.md`, Module 4, D8). The series is the game's (`content/series.ts`).
 *
 * **Decided by the world, the same every time.** Each May after the seasons ordered run out, the network says whether
 * there's another: a draw keyed by the series and the year (decider `pro.series`), at the series' chance. A canceled
 * series can come back from its second year off, by the same kind of draw. Nothing here keeps state: a season's fate is
 * worked out from the seed each time it's asked, so a reload, a jump past several Mays or a save opened years on reads
 * the same seasons. What the player was told is kept on their own records, where it happened.
 *
 * **What a decision does** (`registerSeries`, at the first stop of the clock after it, before anything due then):
 * canceled, the season's production stops that day, so a part not yet cast in it closes, and work booked in it for days
 * not yet done is called off and owed nothing, while the pay for days worked and every record stay; the option on a part
 * for the next season lapses with it. Renewed, nothing is booked by itself: a part comes back only through its option or
 * a new casting. Revived, its parts are cast again, its old seasons and the work done in them as they were.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { addDays, formatDate, formatWeekdayDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { PROJECTS, projectById, type ProjectTemplate } from '../content/careerwork';
import { decisionAt, episodeDays, seasonWindow, seasonYearAt, seriesById, SERIES, type SeriesTemplate } from '../content/series';
import { noteEvent, type Engagement, type Opportunity } from './pro';
import type { Band } from './coursework';
import { clauseOf, type ContractExtra } from './contracts';
import { episodeOfDay, episodeOn, episodeWorkDays, type WorkDay } from './projobs';

/** The network's word on one season: another, no more, or back after time off. */
export interface SeasonDecision { year: number; at: Instant; what: 'renewed' | 'canceled' | 'revived' }

const NY = 'America/New_York';
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/**
 * A season's audience, the game's own simulation and said so (from 2026-10-25, the owner's brief 27, loop 36: "An episode
 * or batch releases → identify the correct reporting window and metric → calculate or ingest supported performance → ...
 * feed renewal or strategy decisions where justified"; Part 12: "Do not mix views, hours, viewers, reach, completion, and
 * retention ... model estimated internal performance and label it as simulated"). A broadcast series is measured in
 * viewers, an episode's average audience over the season in millions; a streaming series in hours viewed a week over the
 * season, in millions; the two are never set side by side as one figure. The series' first season is drawn within its
 * outlet's range, each season after moves from the last by up to `drift` either way, and from the sixth on each loses
 * `fade` of it; critics give each season a score of 100. ASSUMPTION every figure, on its own stream (decider
 * `pro.audience`): no published figure is used or claimed.
 */
export const AUDIENCE = {
  broadcast: { unit: 'viewers', first: [3, 9], bar: 5.5 },
  streaming: { unit: 'hours', first: [6, 40], bar: 18 },
  drift: 0.18,
  fade: { after: 5, share: 0.06 },
  critics: { least: 40, most: 95, middle: 65 },
} as const;

/** How a series is seen: its own outlet, or, kept from before it had one, by when its network decides. */
export const outletOf = (s: SeriesTemplate): 'broadcast' | 'streaming' => s.outlet ?? (s.decide.month === 1 ? 'streaming' : 'broadcast');

/** A season's audience and its reviews, the game's simulation: what it averaged, in its outlet's unit, and critics' score. */
export function seasonAudience(sim: Simulation, s: SeriesTemplate, year: number): { unit: 'viewers' | 'hours'; average: number; critics: number } | undefined {
  if (year < s.firstSeason) return undefined;
  const spec = AUDIENCE[outletOf(s)];
  let v = spec.first[0] + sim.rng('pro.audience', s.id).next() * (spec.first[1] - spec.first[0]);
  for (let y = s.firstSeason + 1; y <= year; y += 1) v *= 1 + (sim.rng('pro.audience', s.id, y).next() * 2 - 1) * AUDIENCE.drift;
  const n = year - s.firstSeason + 1;
  if (n > AUDIENCE.fade.after) v *= (1 - AUDIENCE.fade.share) ** (n - AUDIENCE.fade.after);
  const critics = Math.round(AUDIENCE.critics.least + sim.rng('pro.audience', s.id, year, 'critics').next() * (AUDIENCE.critics.most - AUDIENCE.critics.least));
  return { unit: spec.unit, average: Math.round(v * 10) / 10, critics };
}

/**
 * The network's chance of another season, read from the circumstances of the one before it (loop 38: "evaluate the
 * project's simulated commercial, creative, contractual, and strategic circumstances ... Do not reduce every renewal
 * decision to one viewer threshold"): the series' own chance, moved by how far the last season's audience stood from its
 * outlet's bar (a quarter either way at most), by its reviews, and down as a long-running series costs more (from its
 * tenth season). Its order, the contract, is the seasons it needs no word on. ASSUMPTION each weight, the game's.
 */
export const RENEW_WEIGHTS = { audience: 0.25, critics: 0.15, age: { after: 9, each: 0.03 }, least: 0.05, most: 0.95 } as const;
export function renewChance(sim: Simulation, s: SeriesTemplate, year: number): number {
  const last = seasonAudience(sim, s, year - 1);
  if (!last) return s.chance.renew;
  const audience = clamp(last.average / AUDIENCE[outletOf(s)].bar - 1, -1, 1);
  const critics = (last.critics - AUDIENCE.critics.middle) / (AUDIENCE.critics.most - AUDIENCE.critics.middle);
  const age = Math.max(0, year - s.firstSeason - RENEW_WEIGHTS.age.after) * RENEW_WEIGHTS.age.each;
  return clamp(s.chance.renew + RENEW_WEIGHTS.audience * audience + RENEW_WEIGHTS.critics * critics - age, RENEW_WEIGHTS.least, RENEW_WEIGHTS.most);
}

/** A season's audience in the player's words: "6.2 million viewers an episode", "18.4 million hours a week". */
export function audienceWords(a: NonNullable<ReturnType<typeof seasonAudience>>): string {
  return a.unit === 'viewers' ? `${a.average.toFixed(1)} million viewers an episode` : `${a.average.toFixed(1)} million hours viewed a week`;
}

/**
 * Every decision on a series up to the season beginning in `year`, in order, from the first after its order ran out.
 * The draw is keyed by the series and the year alone, so one year's answer never moves another's.
 */
export function decisionsTo(sim: Simulation, s: SeriesTemplate, year: number): SeasonDecision[] {
  const out: SeasonDecision[] = [];
  let on = true;
  let offSince = 0;
  for (let y = s.orderedThrough + 1; y <= year; y += 1) {
    const draw = sim.rng('pro.series', s.id, y).next();
    if (on) {
      // Read from the last season's audience and reviews (`renewChance`, from 2026-10-25, brief 27): until then the
      // series' own chance alone, the same whatever its seasons did.
      if (draw < renewChance(sim, s, y)) out.push({ year: y, at: decisionAt(s, y), what: 'renewed' });
      else { on = false; offSince = y; out.push({ year: y, at: decisionAt(s, y), what: 'canceled' }); }
    } else if (y - offSince >= s.chance.reviveAfter && draw < s.chance.revive) {
      on = true;
      out.push({ year: y, at: decisionAt(s, y), what: 'revived' });
    }
  }
  return out;
}

/** Whether the season beginning in `year` is made: every season through the order, and after it each renewed or revived. */
export function seasonMade(sim: Simulation, s: SeriesTemplate, year: number): boolean {
  if (year < s.firstSeason) return false;
  if (year <= s.orderedThrough) return true;
  const last = decisionsTo(sim, s, year).filter((d) => d.year <= year).pop();
  return last?.year === year && last.what !== 'canceled';
}

/** The season's number: one for each season made from the first, through this one. */
export function seasonNumber(sim: Simulation, s: SeriesTemplate, year: number): number {
  let n = 0;
  for (let y = s.firstSeason; y <= year; y += 1) if (seasonMade(sim, s, y)) n += 1;
  return n;
}

/**
 * When the season beginning in `year` stops being made: at the end of its window, or at the network's word on the next
 * one where that word is that there's no more, which comes in May, before the window's end.
 */
export function productionEnds(sim: Simulation, s: SeriesTemplate, year: number): Instant {
  const end = seasonWindow(s, year).to;
  const next = year + 1;
  return next > s.orderedThrough && !seasonMade(sim, s, next) ? Math.min(end, decisionAt(s, next)) : end;
}

/**
 * Whether work on these days is in a season of the series being made, as the world stands at `at`: each day inside the
 * window of a season that's made, and before its production ends, where the word that ends it has come by `at`. A day
 * after a May the network hasn't spoken in yet counts as in production: casting doesn't wait on the network's word.
 */
export function inProduction(sim: Simulation, seriesId: string, days: readonly { from: Instant }[], at: Instant): boolean {
  const s = seriesById(seriesId);
  if (!s) return true;
  return days.every((d) => {
    const year = seasonYearAt(s, d.from);
    if (year === undefined || !seasonMade(sim, s, year)) return false;
    const ends = productionEnds(sim, s, year);
    return d.from < ends || ends > at;
  });
}

/**
 * The series a save's decisions are read for: the fixed ones, and (from 2026-10-24, brief 27) the slate's the player has met,
 * as the save keeps them (`ProRecord.series`). A slate series the player never met decides its seasons all the same, but
 * nothing of theirs turns on it.
 */
export function seriesInPlay(sim: Simulation): SeriesTemplate[] {
  const kept = sim.universe.people[sim.universe.playerId]?.pro?.series;
  return [...SERIES, ...Object.values(kept ?? {})];
}

/** The parts of a series the save knows: the fixed parts, and the slate parts the player was shown. */
function partsOf(sim: Simulation, seriesId: string): Set<string> {
  const kept = sim.universe.people[sim.universe.playerId]?.pro?.projects ?? {};
  return new Set([...PROJECTS.filter((t) => t.series === seriesId).map((t) => t.id), ...Object.values(kept).filter((t) => t.series === seriesId).map((t) => t.id)]);
}

/** The decisions whose moment falls in a stretch of the clock, across every series in play, in order. */
export function decisionsBetween(sim: Simulation, from: Instant, to: Instant): { s: SeriesTemplate; d: SeasonDecision }[] {
  const out: { s: SeriesTemplate; d: SeasonDecision }[] = [];
  for (const s of seriesInPlay(sim)) {
    const last = new Date(to).getUTCFullYear() + 1;
    for (const d of decisionsTo(sim, s, last)) if (d.at > from && d.at <= to) out.push({ s, d });
  }
  return out.sort((a, b) => a.d.at - b.d.at);
}

/** A decision in the player's words: "On May 15, 2030, the network renewed The Calloway Files for a twelfth season." */
export function decisionWords(sim: Simulation, s: SeriesTemplate, d: SeasonDecision): string {
  const when = formatDate(d.at, NY);
  // What the network read (from 2026-10-25, brief 27, `renewChance`): the last season's audience and reviews, the game's.
  const last = d.what === 'revived' ? undefined : seasonAudience(sim, s, d.year - 1);
  const why = last ? ` Its last season averaged ${audienceWords(last)} and critics scored it ${last.critics} of 100, both the game’s estimates.` : '';
  if (d.what === 'canceled') return `On ${when}, the network canceled ${s.title}, and its production stopped that day.${why}`;
  const n = seasonNumber(sim, s, d.year);
  // The month its season begins, its own: a serialized series' February until 2026-10-25 read "July", every series' then.
  const month = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: NY }).format(new Date(seasonWindow(s, d.year).from));
  return d.what === 'renewed' ? `On ${when}, the network renewed ${s.title} for a season beginning in ${month}, its ${ordinal(n)}.${why}` : `On ${when}, the network brought ${s.title} back for a season beginning in ${month}, its ${ordinal(n)}.`;
}

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth'];
export const ordinal = (n: number): string => ORD[n - 1] ?? `${n}th`;
const titled = (x: string): string => `${x.charAt(0).toUpperCase()}${x.slice(1)}`;

// ---------------------------------------------------------------------------------------------------------------------
// A recurring part's season: the further episodes and the option (D7)
// ---------------------------------------------------------------------------------------------------------------------

/** The production's word on a further episode: two weeks before its first day, at ten. */
export const EPISODE_CALL_KIND = 'pro.series.episode';
/** The option's last day: exercised or let go, once. */
export const OPTION_KIND = 'pro.series.option';

/**
 * The chance the production calls the part for a further episode, and takes up its option, by the best the work was
 * judged at so far (ASSUMPTION, the game's: a part that plays well is written for again). Worked no day yet, the middle.
 */
export const EPISODE_CHANCE: Readonly<Record<Band | 'none', number>> = { exceptional: 0.8, strong: 0.65, working: 0.45, unready: 0.2, none: 0.4 };
export const OPTION_CHANCE: Readonly<Record<Band | 'none', number>> = { exceptional: 0.85, strong: 0.7, working: 0.45, unready: 0.15, none: 0.3 };
const CALL = { aheadDays: 14, hour: 10 } as const;
/** The option's last day: June 30 of the next season's year, at noon. */
const OPTION_BY = { month: 6, day: 30, hour: 12 } as const;

/** The best band an engagement's work was judged at, or none. */
export const bestBandOf = (e: Engagement): Band | undefined => (['exceptional', 'strong', 'working', 'unready'] as const).find((b) => e.log?.some((l) => l.band === b));

/** The season a series part's work is in, and for a recurring part its episodes and its option: what `contractFor` adds. */
export function seasonOf(t: ProjectTemplate, e: Engagement): ContractExtra {
  const s = t.series ? seriesById(t.series) : undefined;
  const first = e.days[0];
  if (!s || !first) return {};
  const year = seasonYearAt(s, first.from) ?? zonedParts(first.from, NY).year;
  if (t.schedule.kind !== 'episodes') return { season: { year, guaranteed: [], further: [] } };
  const guaranteed = [...new Set(e.days.map(episodeOfDay).filter((n): n is number => n !== undefined))];
  const last = Math.max(...guaranteed);
  const further: number[] = [];
  for (let n = last + 1; n <= s.episodes && further.length < t.schedule.expected - guaranteed.length; n += 1) further.push(n);
  return { season: { year, guaranteed, further }, option: { year: year + 1, by: instantFromZoned({ year: year + 1, ...OPTION_BY, minute: 0 }, NY) } };
}

/** A recurring part's season on the clock: the word on each further episode, and the option's last day. Once each. */
export function scheduleSeason(sim: Simulation, person: Person, e: Engagement): void {
  const t = projectById(e.projectId);
  const s = t?.series ? seriesById(t.series) : undefined;
  const year = e.contract?.series?.year;
  if (!t || !s || year === undefined) return;
  const pending = (kind: string, key: string) => sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind === kind && i.payload.key === key);
  for (const f of clauseOf(e.contract, 'episodes')?.further ?? []) {
    const key = `${e.id}:episode:${f.n}`;
    if (f.status !== 'pending' || pending(EPISODE_CALL_KIND, key)) continue;
    const p = zonedParts(addDays(episodeDays(s, year, f.n)[0]!, -CALL.aheadDays, NY), NY);
    const at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: CALL.hour, minute: 0 }, NY);
    sim.schedule({ at: Math.max(at, sim.now + 60_000), kind: EPISODE_CALL_KIND, label: `${t.project}: Episode ${f.n}`, category: 'system', priority: 40, refType: 'pro.engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id, n: f.n, key } });
  }
  const option = clauseOf(e.contract, 'option');
  const key = `${e.id}:option`;
  if (option?.status === 'open' && !pending(OPTION_KIND, key)) sim.schedule({ at: Math.max(option.by, sim.now + 60_000), kind: OPTION_KIND, label: `${t.project}: The Option`, category: 'system', priority: 40, refType: 'pro.engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id, key } });
}

/** Whether the production calls the part for a further episode (decider `pro.episode`), by the engagement and the episode. */
export const episodeDrawn = (sim: Simulation, e: Engagement, n: number): boolean => {
  const chance = (e.log ?? []).some((l) => l.status === 'missed') ? 0 : EPISODE_CHANCE[bestBandOf(e) ?? 'none'];
  return sim.rng('pro.episode', e.id, n).next() < chance;
};

/** Whether the production takes up its option (decider `pro.option`), by the engagement. */
export const optionDrawn = (sim: Simulation, e: Engagement): boolean => sim.rng('pro.option', e.id).next() < OPTION_CHANCE[bestBandOf(e) ?? 'none'];

// ---------------------------------------------------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------------------------------------------------

/** What the work loop lends the seasons (`systems/projobs.ts`): its steps, so a season's turns use the loop's own. */
export interface SeriesHooks {
  tell: (sim: Simulation, person: Person, title: string, body: string, importance?: number) => void;
  /** An opportunity closed, its calls off the clock. */
  close: (sim: Simulation, person: Person, o: Opportunity, outcome: string) => void;
  /** Work called off from now, and what's kept of it said. */
  callOff: (sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, why: string) => void;
  /** An episode's days added to the work, booked and promised. */
  addDays: (sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, days: readonly WorkDay[]) => void;
  /** The work over at its last day. */
  finish: (sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate) => void;
  /** The next season's engagement, from an option taken up. */
  renew: (sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, days: readonly WorkDay[]) => Engagement;
  /** Why work on these days can't be taken, or nothing: permission, SAG-AFTRA's thirty days, a clash. */
  refusal: (person: Person, days: readonly WorkDay[], except: string) => string | undefined;
}

const UNRESOLVED: readonly Opportunity['status'][] = ['open', 'submitted', 'audition', 'callback', 'offered'];

export function registerSeries(sim: Simulation, hooks: SeriesHooks): void {
  // The network's word, at the first stop of the clock after it, before anything due there.
  sim.onPassage('pro.series', (s, from) => {
    const person = s.universe.people[s.universe.playerId];
    const pro = person?.pro;
    if (!person || !pro) return;
    for (const { s: series, d } of decisionsBetween(s, from, s.now)) {
      const ids = partsOf(s, series.id);
      const words = decisionWords(s, series, d);
      const touched = pro.engagements.filter((e) => ids.has(e.projectId));
      if (d.what === 'canceled') {
        for (const o of pro.opportunities.filter((x) => ids.has(x.projectId) && UNRESOLVED.includes(x.status))) {
          const t = projectById(o.projectId)!;
          hooks.close(s, person, o, `${series.title} was canceled on ${formatDate(d.at, NY)}, so casting for ${t.role.part} stopped.`);
          hooks.tell(s, person, `${series.title} Is Canceled`, `${words} Casting for ${t.role.part} stopped with it.`, 70);
        }
        for (const e of touched.filter((x) => x.status !== 'finished' && x.status !== 'canceled' && x.days.some((day, i) => day.from >= d.at && !x.log?.some((l) => l.day === i)))) {
          hooks.callOff(s, person, e, projectById(e.projectId)!, words);
        }
        for (const e of touched) {
          const option = clauseOf(e.contract, 'option');
          if (option?.status !== 'open' || option.year !== d.year) continue;
          option.status = 'expired';
          option.settled = { at: s.now, why: `${series.title} was canceled, so there’s no next season to take it up for.` };
          noteEvent(s, e, { kind: 'problem', key: `option:${d.year}`, words: `${words} The option on you for its next season lapsed with it.` });
          hooks.tell(s, person, `${series.title} Is Canceled`, `${words} The option on you as ${e.role} for its next season lapsed with it, and the pay you earned in it stays yours.`, 70);
        }
        continue;
      }
      // Renewed or revived: nothing is booked by itself (T58, T62, T85). Said where the player has worked in it, and kept on
      // a contract whose option it opens; work done before stays as it was (T93).
      if (!touched.length) continue;
      const held = touched.find((e) => { const o = clauseOf(e.contract, 'option'); return o?.status === 'open' && o.year === d.year; });
      if (held) noteEvent(s, held, { kind: 'success', key: `series:${d.year}`, words });
      const next = held ? ` The production has until ${formatDate(clauseOf(held.contract, 'option')!.by, NY)} to take up its option on you as ${held.role}.` : d.what === 'revived' ? ' Its parts will be cast again.' : ' That doesn’t bring you back by itself: a part in it comes only through an option or a new casting.';
      hooks.tell(s, person, d.what === 'renewed' ? `${series.title} Is Renewed` : `${series.title} Is Back`, `${words}${next}`, 55);
    }
  });

  sim.onSchedule(EPISODE_CALL_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person?.pro?.engagements.find((x) => x.id === item.payload.engagementId);
    const n = Number(item.payload.n);
    const f = clauseOf(e?.contract, 'episodes')?.further.find((x) => x.n === n);
    const t = e ? projectById(e.projectId) : undefined;
    const year = e?.contract?.series?.year;
    if (!person || !e || !t || !f || f.status !== 'pending' || year === undefined || e.status === 'finished' || e.status === 'canceled') return;
    const days = episodeOn(t, year, n);
    const no = !inProduction(s, t.series!, days, s.now) ? `${t.project} isn’t being made by then` : hooks.refusal(person, days, e.id);
    f.at = s.now;
    if (!no && episodeDrawn(s, e, n)) {
      f.status = 'called';
      hooks.addDays(s, person, e, t, days);
      noteEvent(s, e, { kind: 'booked', key: `episode:${n}`, words: `The production called you as ${t.role.part} for episode ${n}, on ${formatDate(days[0]!.from, NY)} and ${formatDate(days[days.length - 1]!.from, NY)}.` });
      hooks.tell(s, person, `Called For Episode ${n}`, `${t.company} wants you as ${t.role.part} in episode ${n} of ${t.project}: ${formatWeekdayDate(days[0]!.from, NY)} and ${formatWeekdayDate(days[days.length - 1]!.from, NY)}, paid as your other episodes are. It’s on your calendar.`, 75);
      return;
    }
    f.status = 'not-called';
    const why = no ? ` ${no.charAt(0).toUpperCase()}${no.slice(1).replace(/\.$/, '')}.` : '';
    noteEvent(s, e, { kind: 'problem', key: `episode:${n}`, words: `The production didn’t call you as ${t.role.part} for episode ${n}.${why}` });
    hooks.tell(s, person, `Not In Episode ${n}`, `${t.company} won’t need ${t.role.part} in episode ${n} of ${t.project}.${why} An episode you aren’t called for isn’t paid: your contract guarantees only the episodes it names.`, 60);
    if (!episodesPendingIn(e) && e.days.every((_, i) => e.log?.some((l) => l.day === i))) hooks.finish(s, person, e, t);
  });

  sim.onSchedule(OPTION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person?.pro?.engagements.find((x) => x.id === item.payload.engagementId);
    const option = clauseOf(e?.contract, 'option');
    const t = e ? projectById(e.projectId) : undefined;
    const series = t?.series ? seriesById(t.series) : undefined;
    if (!person || !e || !t || !series || !option || option.status !== 'open') return;
    const lapse = (why: string) => {
      option.status = 'expired';
      option.settled = { at: s.now, why };
      noteEvent(s, e, { kind: 'problem', key: `option:${option.year}`, words: `${why}` });
      hooks.tell(s, person, `No ${titled(ordinal(option.season))} Season For ${t.role.part}`, `${why} So there’s no contract for you in ${t.project}’s next season. A part in it can still come through a new casting.`, 70);
    };
    if (!seasonMade(s, series, option.year)) { lapse(`${series.title} has no next season, so the option on you lapsed.`); return; }
    const days = episodeWorkDays(t, seasonWindow(series, option.year).from, t.schedule.kind === 'episodes' ? t.schedule.guaranteed : 0, option.year);
    const no = hooks.refusal(person, days, e.id);
    if (no) { lapse(`${t.company} couldn’t take up its option on you as ${t.role.part}: ${midSentence(no)}.`); return; }
    if (!optionDrawn(s, e)) { lapse(`${t.company} let its option on you as ${t.role.part} lapse on ${formatDate(option.by, NY)}.`); return; }
    const next = hooks.renew(s, person, e, t, days);
    option.status = 'exercised';
    option.settled = { at: s.now, why: `${t.company} took up its option on you as ${t.role.part} for the ${ordinal(option.season)} season.`, engagementId: next.id };
    noteEvent(s, e, { kind: 'booked', key: `option:${option.year}`, words: option.settled.why });
  });
}

/** A sentence made the middle of another: lowercased at its start, but for an acronym ("SAG-AFTRA work …"), its stop dropped. */
const midSentence = (x: string): string => (/^[A-Z]{2}/.test(x) ? x : `${x.charAt(0).toLowerCase()}${x.slice(1)}`).replace(/\.$/, '');

const episodesPendingIn = (e: Engagement): boolean => clauseOf(e.contract, 'episodes')?.further.some((f) => f.status === 'pending') ?? false;
