/**
 * SLATE — a series' seasons: renewed, canceled and revived (from 2026-10-24, the owner's brief 25, Part 13;
 * `docs/verification/career-world-2026-10-23/criteria.md`, Module 4, D8). The series is the game's (`content/series.ts`).
 *
 * **Decided by the world, the same every time.** Each May after the seasons ordered run out, the network says whether
 * there's another: a draw keyed by the series and the year (decider `pro.series`), at the series' chance. A canceled
 * series can come back from its second year off, by the same kind of draw. Nothing here keeps state: a season's fate is
 * worked out from the seed each time it's asked, so a reload, a jump past several Mays or a save opened years on reads
 * the same seasons. What the player was told is kept on their own records, where it happened. From 2026-10-25 (brief 27,
 * Part 12) a season's audience reads one thing more, the player's own judged work in it, which the work day posts once as
 * it's judged and the record keeps whole (`ProRecord.seasonMarks`, `systems/market.ts`), each season reading only what
 * was posted before the word that follows it; so the seasons still read the same on every asking.
 *
 * **From 2026-10-25** (brief 27, Part 13): a series back after its cancellation may come back on another network
 * (`PICKUP`), which is then the network its seasons are seen on and says each word on them, at the series' own chance;
 * and two real series are continued after their verified baseline (`REAL_SERIES`, `content/series.ts`), every season
 * after it the simulation's, said so wherever a word on it is read.
 *
 * **What a decision does** (`registerSeries`, at the first stop of the clock after it, before anything due then):
 * canceled, the season's production stops that day, so a part not yet cast in it closes, and work booked in it for days
 * not yet done is called off and owed nothing, while the pay for days worked and every record stay; the option on a part
 * for the next season lapses with it. Renewed, nothing is booked by itself: a part comes back only through its option or
 * a new casting. Revived, its parts are cast again, its old seasons and the work done in them as they were; and, from
 * 2026-10-25 (brief 27, loop 41), each character the player played in it is brought back by a new offer, or not, by its
 * producers' plans (`REVIVAL`), never by restoring the old engagement.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, addDays, formatDate, formatWeekdayDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { PROJECTS, projectById, type ProjectTemplate } from '../content/careerwork';
import { decisionAt, episodeDays, seasonWindow, seasonYearAt, seriesById, simulatedFrom, REAL_SERIES, SERIES, type SeriesTemplate } from '../content/series';
import { COMPANY_WORDS } from '../content/slate';
import { FORTUNE, seasonTerm } from './market';
import { registerContinuity, growthOf } from './continuity';
import { finished, noteEvent, type Engagement, type Opportunity } from './pro';
import type { Band } from './coursework';
import { clauseOf, type ContractExtra } from './contracts';
import { WORK, counted, episodeOfDay, episodeOn, episodeWorkDays, type WorkDay } from './projobs';

/**
 * The network's word on one season: another, no more, or back after time off; and, from 2026-10-25 (brief 27, Part 13),
 * where it came back on another network, that network (`PICKUP`).
 */
export interface SeasonDecision { year: number; at: Instant; what: 'renewed' | 'canceled' | 'revived'; network?: string }

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

/**
 * How many seasons a series had before `year`'s, by the years since its first: a real series' counted on from its
 * baseline's number (from 2026-10-25), so 9-1-1 fades and costs more as a series in its tenth season does.
 */
const ageOf = (s: SeriesTemplate, year: number): number => (s.real?.baseline.season ?? 1) - 1 + year - s.firstSeason;

/** How a series is seen: its own outlet, or, kept from before it had one, by when its network decides. */
export const outletOf = (s: SeriesTemplate): 'broadcast' | 'streaming' => s.outlet ?? (s.decide.month === 1 ? 'streaming' : 'broadcast');

/**
 * A season's audience and its reviews, the game's simulation: what it averaged, in its outlet's unit, and critics' score.
 * From 2026-10-25 (the owner's brief 27, Part 12: "A strong player performance must matter without guaranteeing a hit")
 * both read the player's judged work in the season (`seasonTerm`, `systems/market.ts`): the audience moved by a natural
 * log of `FORTUNE.season` times the term, the critics by `FORTUNE.seasonCritics` times it, inside the drift a season
 * draws on its own. Until then neither read it. A real series is simulated only after its baseline season, which has
 * no figure here: the catalog's pages give none.
 */
export function seasonAudience(sim: Simulation, s: SeriesTemplate, year: number): { unit: 'viewers' | 'hours'; average: number; critics: number } | undefined {
  return seasonAudienceWith(sim, s, year, seasonTerm(sim, s, year));
}

/** A season's audience and its reviews with the player's term given (`seasonAudience` reads it from the record). */
export function seasonAudienceWith(sim: Simulation, s: SeriesTemplate, year: number, term: number): { unit: 'viewers' | 'hours'; average: number; critics: number } | undefined {
  const from = simulatedFrom(s);
  if (year < from) return undefined;
  const spec = AUDIENCE[outletOf(s)];
  let v = spec.first[0] + sim.rng('pro.audience', s.id).next() * (spec.first[1] - spec.first[0]);
  for (let y = from + 1; y <= year; y += 1) v *= 1 + (sim.rng('pro.audience', s.id, y).next() * 2 - 1) * AUDIENCE.drift;
  const n = ageOf(s, year) + 1;
  if (n > AUDIENCE.fade.after) v *= (1 - AUDIENCE.fade.share) ** (n - AUDIENCE.fade.after);
  v *= Math.exp(FORTUNE.season * term);
  const drawn = AUDIENCE.critics.least + sim.rng('pro.audience', s.id, year, 'critics').next() * (AUDIENCE.critics.most - AUDIENCE.critics.least);
  const critics = Math.round(clamp(drawn + FORTUNE.seasonCritics * term, 0, 100));
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
  const base = s.chance.renew;
  const last = seasonAudience(sim, s, year - 1);
  if (!last) return base;
  const audience = clamp(last.average / AUDIENCE[outletOf(s)].bar - 1, -1, 1);
  const critics = (last.critics - AUDIENCE.critics.middle) / (AUDIENCE.critics.most - AUDIENCE.critics.middle);
  const age = Math.max(0, ageOf(s, year) - RENEW_WEIGHTS.age.after) * RENEW_WEIGHTS.age.each;
  return clamp(base + RENEW_WEIGHTS.audience * audience + RENEW_WEIGHTS.critics * critics - age, RENEW_WEIGHTS.least, RENEW_WEIGHTS.most);
}

/**
 * A canceled series picked up by another network (from 2026-10-25, the owner's brief 27, Part 13: "Revival or a
 * distributor change where plausible"; loop 41's "A later revival: requires a plausible new project event"): of the
 * series that come back, the share that come back on another outlet of the same kind, a broadcast series on another
 * network and a streaming one on another service, so its audience is counted as it was. The network's name is the game's
 * invention, from the slate's company words. ASSUMPTION the figure, drawn by the series and the year it's back (decider
 * `pro.pickup`), on its own stream, so whether the series comes back is drawn as it was.
 *
 * The network that picks it up is the one its seasons are seen on (`networkOf`), on its credits and its pages, and the
 * one whose word each May its decisions are said in; its seasons are renewed at the series' own chance, read from their
 * audience and reviews as any series' are. Until the review of 2026-10-25 a pickup renewed it at a chance of the new
 * network's own, `PICKUP.renew`: since decisions are worked out from the seed on every asking, a save from before, told
 * a season was renewed after a revival, read it as canceled once the pickup's draw fell to another network (10 of 100
 * saves of The Calloway Files by 2045), and the option and the season's casting with it.
 */
export const PICKUP = { chance: 0.5 } as const;

/** Whether a series back in `year` came back on another network, and its name; nothing where its own network brought it back. */
export function pickupOf(sim: Simulation, s: SeriesTemplate, year: number): string | undefined {
  const r = sim.rng('pro.pickup', s.id, year);
  if (r.next() >= PICKUP.chance) return undefined;
  const kinds = outletOf(s) === 'streaming' ? ['Streaming', 'Plus'] : ['Television', 'Network'];
  return `${r.pick(COMPANY_WORDS.first)} ${r.pick(COMPANY_WORDS.second)} ${r.pick(kinds)}`;
}

/**
 * The network a season of the series is seen on: the last that brought it back by `year`, or its own, `since` the year
 * another picked it up. A revival by its own network after a pickup takes it home: until the review of 2026-10-25 it
 * kept the network that had picked it up, so its credits said "Seen on" one while its word said its own brought it back.
 */
export function networkOf(sim: Simulation, s: SeriesTemplate, year: number): { name: string; since?: number } {
  let net: { name: string; since?: number } = { name: s.company };
  for (const d of decisionsTo(sim, s, year)) if (d.what === 'revived' && d.year <= year) net = d.network ? { name: d.network, since: d.year } : { name: s.company };
  return net;
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
      // Back on another network, by its own draw (`PICKUP`): who has it, never whether it came back or what the next word is.
      const network = pickupOf(sim, s, y);
      out.push({ year: y, at: decisionAt(s, y), what: 'revived', ...(network ? { network } : {}) });
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

/**
 * The season's number: one for each season made from the first, through this one; a real series' counted on from its
 * baseline's number (from 2026-10-25). A real series whose pages give no number is counted from its baseline as one, for
 * the record alone: the player reads its seasons by their years (`seasonName`).
 */
export function seasonNumber(sim: Simulation, s: SeriesTemplate, year: number): number {
  let n = (s.real?.baseline.season ?? 1) - 1;
  for (let y = s.firstSeason; y <= year; y += 1) if (seasonMade(sim, s, y)) n += 1;
  return n;
}

/** Whether a series' seasons are said by their number: every one but a real series whose pages give none. */
export const numbered = (s: SeriesTemplate): boolean => !s.real || s.real.baseline.season !== undefined;

/** A season by name: "the eleventh season", or, for a real series whose pages give no number, "the season beginning in 2027". */
export function seasonName(sim: Simulation, s: SeriesTemplate, year: number): string {
  if (numbered(s)) return `the ${ordinal(seasonNumber(sim, s, year))} season`;
  return year <= s.real!.baseline.year ? `the season on the air in ${s.real!.baseline.year}` : `the season beginning in ${year}`;
}

/** Whether a season of a series is the simulation's: every one of a series the game invents, and a real one's after its baseline. */
export const simulatedSeason = (s: SeriesTemplate, year: number): boolean => year >= simulatedFrom(s);

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
    // A real series' baseline season is the real production's, never the game's to cast in (from 2026-10-25, brief 27,
    // `REAL_SERIES`): until then a part drawn from 9-1-1 was posted for days in its real tenth season.
    if (year === undefined || !seasonMade(sim, s, year) || !simulatedSeason(s, year)) return false;
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
  // The real series the simulation continues (from 2026-10-25, brief 27, `REAL_SERIES`).
  return [...SERIES, ...REAL_SERIES, ...Object.values(kept ?? {})];
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
  // A real series' word is the simulation's (from 2026-10-25, brief 27, Part 13), and says so.
  const real = continuationWords(s);
  const sim_ = s.real ? ', in the game’s simulation,' : ',';
  // Who says it: the network its last season was seen on, where another picked it up (`PICKUP`, `networkOf`); and a
  // revival by its own network after that, the one that first aired it. Until the review of 2026-10-25 every word said
  // "the network", which after a pickup read as the network that had picked it up.
  const on = networkOf(sim, s, d.year - 1);
  const says = on.since !== undefined ? (d.what === 'revived' ? 'the network that first aired it' : on.name) : 'the network';
  if (d.what === 'canceled') return `On ${when}${sim_} ${says} canceled ${s.title}, and its production stopped that day.${why}${real}`;
  const n = seasonNumber(sim, s, d.year);
  const its = numbered(s) ? `, its ${ordinal(n)}` : '';
  // The month its season begins, its own: a serialized series' February until 2026-10-25 read "July", every series' then.
  const month = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: NY }).format(new Date(seasonWindow(s, d.year).from));
  if (d.what === 'renewed') return `On ${when}${sim_} ${says} renewed ${s.title} for a season beginning in ${month}${its}.${why}${real}`;
  // Back on another network (`PICKUP`): who, and that it's the game's invention.
  if (d.network) return `On ${when}${sim_} ${d.network}, a ${outletOf(s) === 'streaming' ? 'streaming service' : 'network'} invented for the game, picked up ${s.title} after its cancellation, for a season beginning in ${month}${its}.${real}`;
  return `On ${when}${sim_} ${says} brought ${s.title} back for a season beginning in ${month}${its}.${real}`;
}

/**
 * What a word on a real series' simulated future adds (from 2026-10-25, brief 27, Part 13: "Generated future offers,
 * characters, renewals, and cancellations must belong explicitly to the simulation"): that it's the game's own, said with
 * the network's words, a revival's character plans, a guest part's invitation back and an option with no season to take
 * up. Nothing for a series the game invents, whose words say so already. Until the review of 2026-10-25 only the
 * network's words said it.
 */
export const continuationWords = (s: SeriesTemplate): string => (s.real ? ' It’s the game’s own continuation of the real series, not an announcement.' : '');

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
  /**
   * The next season's engagement, from an option taken up; from 2026-10-25 (brief 27, Part 13) with the part grown
   * (`GROW`), or a pilot's option taken up into its series' first season (`PILOT`), where either is so.
   */
  renew: (sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, days: readonly WorkDay[], how?: { grow?: { episodes: number; raise: number }; first?: true }) => Engagement;
  /** Why work on these days can't be taken, or nothing: permission, SAG-AFTRA's thirty days, a clash. */
  refusal: (person: Person, days: readonly WorkDay[], except: string) => string | undefined;
  /** A revival's offer for a character the actor played, without an audition (`REVIVAL`): whether one could be made. */
  bringBack: (sim: Simulation, person: Person, t: ProjectTemplate, from: Engagement, words: string) => boolean;
}

const UNRESOLVED: readonly Opportunity['status'][] = ['open', 'submitted', 'audition', 'callback', 'offered'];

/**
 * A revival's character plans (from 2026-10-25, the owner's brief 27, loop 41: "A later revival: requires a plausible new
 * project event → checks elapsed time, agreements, availability, and character plans → creates a new engagement rather
 * than silently restoring the old one"). The chance its producers want back a character the player played to its end: a
 * recurring part's more than a single episode's, less each year the series was off past the two a revival needs, never
 * under `least`. Wanted, the character comes back by a new offer without an audition, its days in the new season's first
 * weeks, cast `castWeeks` into it; the old contract's option lapsed with the cancellation, so nothing carries over but the
 * character. ASSUMPTION each figure, the game's; drawn by the series, the season and the part (decider `pro.revival`).
 */
export const REVIVAL = { recurring: 0.6, guest: 0.25, perYear: 0.1, least: 0.05, castWeeks: 1 } as const;
export const REVIVAL_KIND = 'pro.revival';

/** How many years a revived series was off: from the network's word canceling it to the word bringing it back. */
export function yearsOff(sim: Simulation, s: SeriesTemplate, year: number): number {
  const ended = decisionsTo(sim, s, year).filter((d) => d.year < year && d.what === 'canceled').pop();
  return ended ? year - ended.year : 0;
}

/** The chance a revival's producers bring back a character the player played (`REVIVAL`). */
export function revivalChance(sim: Simulation, s: SeriesTemplate, year: number, t: ProjectTemplate): number {
  const base = t.schedule.kind === 'episodes' ? REVIVAL.recurring : REVIVAL.guest;
  return Math.max(REVIVAL.least, base - REVIVAL.perYear * Math.max(0, yearsOff(sim, s, year) - s.chance.reviveAfter));
}

/** Whether they do, by its draw. */
export const revivalReturns = (sim: Simulation, s: SeriesTemplate, year: number, t: ProjectTemplate): boolean => sim.rng('pro.revival', s.id, year, t.id).next() < revivalChance(sim, s, year, t);

/** When a revived season's returning characters are cast: so their work falls in its first weeks, and after the word. */
export function revivalCastAt(s: SeriesTemplate, year: number): Instant {
  const at = addDays(seasonWindow(s, year).from, REVIVAL.castWeeks * 7 - WORK.leadDays, NY);
  return Math.max(at, decisionAt(s, year) + MS_DAY);
}

export function registerSeries(sim: Simulation, hooks: SeriesHooks): void {
  // Pilots, an option's hold on the actor's dates, a guest part's invitation back and a part grown (from 2026-10-25,
  // the owner's brief 27, Parts 8 and 13 and loop 20; `systems/continuity.ts`).
  registerContinuity(sim, hooks);
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
      // Revived, its producers say before the new season whether the characters the player played come back (from
      // 2026-10-25, brief 27's loop 41, `REVIVAL`): until then "Its parts will be cast again", and nothing more came of it.
      const roles = [...new Set(touched.filter((e) => finished(e) && e.status !== 'canceled').map((e) => e.role))];
      if (d.what === 'revived' && roles.length) s.schedule({ at: revivalCastAt(series, d.year), kind: REVIVAL_KIND, label: `${series.title}: Its Returning Characters`, category: 'career', priority: 40, refType: 'pro.series', refId: series.id, payload: { personId: person.id, seriesId: series.id, year: d.year } });
      const back = roles.length === 1 ? `whether ${roles[0]} comes back` : `whether the parts you played come back`;
      const next = held ? ` The production has until ${formatDate(clauseOf(held.contract, 'option')!.by, NY)} to take up its option on you as ${held.role}.` : d.what === 'revived' ? (roles.length ? ` Its producers will say by ${formatDate(revivalCastAt(series, d.year), NY)}, ${back}, and its other parts will be cast again.` : ' Its parts will be cast again.') : ' That doesn’t bring you back by itself: a part in it comes only through an option or a new casting.';
      hooks.tell(s, person, d.what === 'renewed' ? `${series.title} Is Renewed` : `${series.title} Is Back`, `${words}${next}`, 55);
    }
  });

  // A revival's character plans (`REVIVAL`): each character the player played to its end, the latest work as each, brought
  // back by a new offer or said not to be. Read from the engagements the record keeps (`ENGAGEMENTS_KEPT`, the latest twenty).
  sim.onSchedule(REVIVAL_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const series = seriesById(String(item.payload.seriesId));
    const year = Number(item.payload.year);
    if (!person?.pro || !series || !seasonMade(s, series, year)) return;
    const ids = partsOf(s, series.id);
    const played = new Map<string, Engagement>();
    for (const e of person.pro.engagements.filter((x) => ids.has(x.projectId) && finished(x) && x.status !== 'canceled').sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))) {
      if (!played.has(e.projectId)) played.set(e.projectId, e);
    }
    const off = yearsOff(s, series, year);
    for (const e of played.values()) {
      const t = projectById(e.projectId);
      if (!t || e.revival?.year === year) continue;
      const returns = revivalReturns(s, series, year, t);
      e.revival = { year, returns };
      // A real series' revival is the simulation's, and says so (`continuationWords`).
      const words = `${series.title} is back after ${counted(off, 'year')} off, and its producers want ${t.role.part} back, with a new contract for its new season.${continuationWords(series)}`;
      if (returns && hooks.bringBack(s, person, t, e, words)) {
        noteEvent(s, e, { kind: 'success', key: `revival:${year}`, words: `The producers of ${series.title} brought ${t.role.part} back for its new season, with an offer.` });
        continue;
      }
      const why = returns
        ? `${series.title} is back, and its producers wanted ${t.role.part} back, but its new season had no work for the part to offer you.`
        : `${series.title} is back after ${counted(off, 'year')} off without ${t.role.part}: its producers’ plans for the new season don’t bring the character back.`;
      const said = `${why}${continuationWords(series)}`;
      noteEvent(s, e, { kind: 'problem', key: `revival:${year}`, words: said });
      hooks.tell(s, person, `${series.title} Comes Back Without ${t.role.part}`, `${said} Your work in its earlier seasons stays on your credits, and a part in it can still come through a new casting.`, 60);
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
      // A real series whose pages give no number names the season by its year (from 2026-10-25, `numbered`).
      hooks.tell(s, person, `No ${numbered(series) ? `${titled(ordinal(option.season))} Season` : `Season Beginning In ${option.year}`} For ${t.role.part}`, `${why} So there’s no contract for you in ${t.project}’s next season. A part in it can still come through a new casting.`, 70);
    };
    if (!seasonMade(s, series, option.year)) { lapse(`${series.title} has no next season, so the option on you lapsed.${continuationWords(series)}`); return; }
    const days = episodeWorkDays(t, seasonWindow(series, option.year).from, t.schedule.kind === 'episodes' ? t.schedule.guaranteed : 0, option.year);
    const no = hooks.refusal(person, days, e.id);
    if (no) { lapse(`${t.company} couldn’t take up its option on you as ${t.role.part}: ${midSentence(no)}.`); return; }
    if (!optionDrawn(s, e)) { lapse(`${t.company} let its option on you as ${t.role.part} lapse on ${formatDate(option.by, NY)}.`); return; }
    // The part grown, where the work and the season's audience bring it and its further days are clear (from 2026-10-25,
    // brief 27, Part 13, `GROW`): until then every option carried the part on as it was.
    const grown = growthOf(s, person, e, t, series, option.year, days, hooks.refusal);
    const next = hooks.renew(s, person, e, t, grown.days, grown.grow ? { grow: grown.grow } : undefined);
    option.status = 'exercised';
    option.settled = { at: s.now, why: `${t.company} took up its option on you as ${t.role.part} for ${seasonName(s, series, option.year)}.`, engagementId: next.id };
    noteEvent(s, e, { kind: 'booked', key: `option:${option.year}`, words: option.settled.why });
  });
}

/** A sentence made the middle of another: lowercased at its start, but for an acronym ("SAG-AFTRA work …"), its stop dropped. */
const midSentence = (x: string): string => (/^[A-Z]{2}/.test(x) ? x : `${x.charAt(0).toLowerCase()}${x.slice(1)}`).replace(/\.$/, '');

const episodesPendingIn = (e: Engagement): boolean => clauseOf(e.contract, 'episodes')?.further.some((f) => f.status === 'pending') ?? false;
