/**
 * SLATE — what carries a part from one season to the next (from 2026-10-25, the owner's brief 27, Parts 8 and 13 and the
 * supplement's loops 20 and 38 to 41; the series, releases and market cluster): an option's hold on the actor's dates, a
 * guest part brought back as a recurring character, a recurring part grown, a pilot picked up to series or passed on,
 * and the network a season is seen on after another picked the series up.
 *
 * **An option holds the actor** (loop 20: "A hold or option begins → record its scope, dates, and terms → show how it
 * affects availability → a conflicting opportunity arrives → evaluate permitted responses → release, exercise, negotiate,
 * or decline according to the arrangement"). Until this module an open option on the next season held nothing: work
 * taken on its days was booked without a word, and at the option's last day the option lapsed for the clash. Now the
 * option holds the guaranteed episodes of the season it's for (`optionDays`), and an offer on any of those days says so
 * before it's accepted (`optionWarning`). The actor can decline the offer; accept it and give the option up
 * (`giveUpOptions`), which leaves the part in that season to another actor and the casting office offering nothing
 * without an audition again (`gaveUpWith`, `optionGivenUp`, kept in `ProRecord.optionsGivenUp`); or ask the production to release them first
 * (`pro.ask_option_release`), granted or refused the next afternoon by a draw that reads how much the production wants
 * them back (`OPTION_RELEASE`). Released, nothing is held against them. The option's last day ends the hold whatever
 * happened (`OPTION_KIND`, `systems/series.ts`).
 *
 * **A guest part brought back** (Part 13: "Guest work leading to a recurring engagement"). A guest part in a series the
 * player played to its end Strong or Exceptional is weighed once by its producers six weeks before the next season
 * (`INVITE`), if that season is ordered or the network has renewed it: they may bring the character back as a recurring
 * part in it, offered without an audition, a new part on a new contract with its own episodes and option. Never on a
 * cancellation, never for working work.
 *
 * **A part grown** (Part 13: "A recurring character receiving a larger role"; "Renegotiation and pay increases must follow
 * actual simulated agreements"). At the option, the production may write more for the part (`GROW`): more episodes
 * guaranteed and a raise beyond the option's, read from how the part was judged and the season's audience, and only
 * where the further days are clear. Said in the new contract, which keeps it (`Contract.grew`).
 *
 * **A pilot** (Part 8: "Pilots"). The slate makes pilots each winter (`pilotsOf`, `systems/slate.ts`), shot as an episode
 * of their kind. Accepting one carries an option on the actor for the series' first season (`pilotTerms`). In May its
 * network picks it up or passes (`PILOT`, decider `pro.pilot`), a draw that reads the pilot's own quality and the
 * player's part in it (`systems/market.ts`). Passed on, it never airs: shot on the credits, never on a reel. Picked up,
 * it's a series of the game's, run by `systems/series.ts`, and the option on the player is taken up or let go as any is.
 *
 * Every figure is the game's ASSUMPTION, said where it's set, and every network, series and season here is the game's
 * invention but the real series' baselines (`REAL_SERIES`), said so wherever it's read.
 */

import { CommandError, type Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { addDays, formatDate, formatTime, formatWeekdayDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { countWords } from '../core/text';
import { addProjects, projectById, type ProjectTemplate } from '../content/careerwork';
import { REAL_SERIES, SERIES, addSeries, decisionAt, episodeDays, episodesFrom, seasonWindow, seasonYearAt, seriesById, type SeriesTemplate } from '../content/series';
import { KIND_PROFILES } from '../content/slate';
import { BAND_LABEL, type Band } from './coursework';
import { noteEvent, type ContractClause, type Engagement, type Opportunity } from './pro';
import { clauseOf, OPTION_RAISE } from './contracts';
import { termOf, qualityOf, productionKey } from './market';
import {
  AUDIENCE, OPTION_CHANCE, bestBandOf, networkOf, optionDrawn, outletOf, seasonAudience, seasonMade, seasonName,
  type SeriesHooks,
} from './series';
import { WORK, datesOf, spansOf, projectOf, type WorkDay } from './projobs';
import { PILOTS } from './slate';

const NY = 'America/New_York';
const MIN = 60_000;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
type OptionClause = Extract<ContractClause, { kind: 'option' }>;

/** A part and the series a season of it is in, kept in the save as it was made, so a later build reads it the same. */
function keepPart(person: Person, t: ProjectTemplate, s?: SeriesTemplate): void {
  if (!person.pro) return;
  const kept = (person.pro.projects ??= {});
  if (!kept[t.id]) kept[t.id] = t;
  addProjects([t]);
  if (s && !SERIES.some((x) => x.id === s.id) && !REAL_SERIES.some((x) => x.id === s.id)) {
    const ks = (person.pro.series ??= {});
    if (!ks[s.id]) ks[s.id] = s;
    addSeries([s]);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// An option's hold on the actor's dates (loop 20)
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Asking to be released from an option: the chance the production agrees, the more the less it wanted the actor back
 * (one less the option's own chance, `OPTION_CHANCE`, by the best the work was judged), between `least` and `most`; and
 * the answer the next afternoon at three. ASSUMPTION each, the game's; drawn by the option's engagement and the offer it's
 * weighed against (decider `pro.option_release`).
 */
export const OPTION_RELEASE = { least: 0.15, most: 0.85, answerHour: 15 } as const;
export const OPTION_RELEASE_KIND = 'pro.option_release_answer';

/** The series an option is on: the part's own, or, for a pilot, the series it would become. */
function seriesOfOption(t: ProjectTemplate): SeriesTemplate | undefined {
  return t.series ? seriesById(t.series) : t.pilot ? pilotSeries(t) : undefined;
}

/** A season's first guaranteed episodes' days, as a recurring part's contract books them (`episodeWorkDays`). */
function seasonDays(part: ProjectTemplate, s: SeriesTemplate, year: number, count: number): WorkDay[] {
  return episodesFrom(s, year, seasonWindow(s, year).from).slice(0, count)
    .flatMap((n) => episodeDays(s, year, n).map((d, k) => ({ from: d, to: d + WORK.shoot.minutes * MIN, label: `${part.project}: Episode ${n}, Shoot Day ${k + 1}`, kind: 'shoot' as const })));
}

/** The days an open option holds: the guaranteed episodes of the season it's for, from that season's first day. */
export function optionDays(t: ProjectTemplate, option: Pick<OptionClause, 'year'>): WorkDay[] {
  const s = seriesOfOption(t);
  if (!s) return [];
  const part = t.pilot ? pilotPart(t, s) : t;
  return seasonDays(part, s, option.year, part.schedule.kind === 'episodes' ? part.schedule.guaranteed : 0);
}

/** An option standing open on an engagement of the actor's, with what it holds. */
export interface HeldOption { e: Engagement; t: ProjectTemplate; option: OptionClause; days: WorkDay[] }

/** The actor's open options whose held days fall on any of these, but the engagement given. */
export function heldOptions(person: Person, spans: readonly { from: Instant; to: Instant }[], except?: string): HeldOption[] {
  const out: HeldOption[] = [];
  for (const e of person.pro?.engagements ?? []) {
    const option = clauseOf(e.contract, 'option');
    const t = projectById(e.projectId);
    if (!t || e.id === except || e.status === 'canceled' || option?.status !== 'open') continue;
    const days = optionDays(t, option);
    if (days.some((d) => spans.some((x) => x.from < d.to && x.to > d.from))) out.push({ e, t, option, days });
  }
  return out;
}

/** A held option's days, as a sentence names them. */
const daysWords = (days: readonly WorkDay[]): string => (days.length ? `from ${formatDate(days[0]!.from, NY)} to ${formatDate(days[days.length - 1]!.from, NY)}` : '');

/** The offer's days as the actor would be away for them. */
const offerSpans = (person: Person, o: Opportunity) => spansOf(person, projectOf(o), datesOf(o));

/**
 * What accepting an offer does to the options holding its days, said before it's pressed: the option, what it holds, and
 * what giving it up costs; and where the actor asked to be released, where that stands.
 */
export function optionWarning(person: Person, o: Opportunity): string | undefined {
  const held = heldOptions(person, offerSpans(person, o));
  if (!held.length) return undefined;
  return held.map(({ e, t, option, days }) => {
    const s = seriesOfOption(t);
    const season = s ? seasonFor(s, option.year) : `the next season of ${t.project}`;
    const ask = option.release?.against === o.id && !option.release.answer
      ? ` You’ve asked ${t.company} to release you; the answer comes on ${formatWeekdayDate(option.release.answerAt, NY)} at ${formatTime(option.release.answerAt, NY)}.`
      : option.release?.answer === 'refused' ? ` ${t.company} refused to release you from it.` : ` Ask To Be Released, on this offer, asks ${t.company} to let you go first.`;
    return `${t.company} holds an option on you as ${e.role} for ${season}, and its guaranteed episodes fall on some of the same days, ${daysWords(days)}. Accepting this gives the option up: the part in that season goes to another actor, and ${t.casting} won’t offer you a part without an audition again.${ask}`;
  }).join(' ');
}

/** The season an option is for, in the words before an offer: a pilot's series' first, or another by the year it begins. */
function seasonFor(s: SeriesTemplate, year: number): string {
  return year === s.firstSeason && !seriesById(s.id) ? `the first season of ${s.title}, if its network picks it up` : `the season of ${s.title} that begins in ${year}`;
}

/** Work taken on days an option held, without a release: each such option given up, said and kept. */
export function giveUpOptions(sim: Simulation, person: Person, taken: Engagement, t: ProjectTemplate, spans: readonly { from: Instant; to: Instant }[]): void {
  for (const h of heldOptions(person, spans, taken.id)) {
    h.option.status = 'expired';
    h.option.givenUpFor = taken.id;
    const why = `You took ${t.role.part} in ${t.project} on days the option held, so you gave it up.`;
    h.option.settled = { at: sim.now, why };
    if (person.pro && h.t.series) (person.pro.optionsGivenUp ??= []).push({ casting: h.t.casting, seriesId: h.t.series, part: h.t.role.part, year: h.option.year, at: sim.now });
    else if (person.pro && h.t.pilot) (person.pro.optionsGivenUp ??= []).push({ casting: h.t.casting, seriesId: pilotSeries(h.t).id, part: h.t.role.part, year: h.option.year, at: sim.now });
    noteEvent(sim, h.e, { kind: 'problem', key: `option:${h.option.year}`, words: `${why} The part in that season goes to another actor.` });
    tellOf(sim, person, `You Gave Up The Option On ${h.e.role}`, `${why} ${h.t.company}’s option on you as ${h.e.role} is gone: the part in that season goes to another actor, and ${h.t.casting} won’t offer you a part without an audition again.`, 70);
  }
}

/** Whether the actor gave up an option on this part for the season beginning in `year`: its part then is another actor's. */
export function optionGivenUp(person: Person, t: ProjectTemplate, year: number | undefined): boolean {
  return year !== undefined && (person.pro?.optionsGivenUp ?? []).some((g) => g.seriesId === t.series && g.part === t.role.part && g.year === year);
}

/** Whether the actor ever gave up an option on work for this casting office, which then offers nothing without an audition. */
export function gaveUpWith(person: Person, casting: string): boolean {
  return (person.pro?.optionsGivenUp ?? []).some((g) => g.casting === casting);
}

/** The chance a production releases the actor from its option (`OPTION_RELEASE`). */
export const releaseChance = (e: Engagement): number => clamp(1 - OPTION_CHANCE[bestBandOf(e) ?? 'none'], OPTION_RELEASE.least, OPTION_RELEASE.most);

/** Whether it does, by the option's engagement and the offer it's weighed against (decider `pro.option_release`). */
export const releaseGranted = (sim: Simulation, e: Engagement, against: string): boolean => sim.rng('pro.option_release', e.id, against).next() < releaseChance(e);

/** When the production answers an ask to be released: the next afternoon at three. */
export const releaseAnswerAt = (now: Instant): Instant => {
  const p = zonedParts(addDays(now, 1, NY), NY);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: OPTION_RELEASE.answerHour, minute: 0 }, NY);
};

/** Why the actor can't ask to be released from an option against this offer now, or nothing. */
export function optionReleaseRefusal(sim: Simulation, person: Person, o: Opportunity | undefined): string | undefined {
  if (!o || o.status !== 'offered' || !o.offer) return 'There’s no offer standing to weigh against an option.';
  const held = heldOptions(person, offerSpans(person, o))[0];
  if (!held) return 'No production holds an option on you on any of this offer’s days.';
  const r = held.option.release;
  if (r && !r.answer) return `You’ve asked; ${held.t.company} answers on ${formatWeekdayDate(r.answerAt, NY)} at ${formatTime(r.answerAt, NY)}.`;
  if (r?.answer === 'refused') return `${held.t.company} refused on ${formatDate(r.answerAt, NY)}: the option stands. Decline the offer, or accept it and give the option up.`;
  const answerAt = releaseAnswerAt(sim.now);
  if (o.offer.until <= answerAt) return `The offer lapses on ${formatDate(o.offer.until, NY)} at ${formatTime(o.offer.until, NY)}, before ${held.t.company} could answer, so it’s a choice between them now.`;
  return undefined;
}

// ---------------------------------------------------------------------------------------------------------------------
// A guest part brought back as a recurring character (Part 13)
// ---------------------------------------------------------------------------------------------------------------------

/**
 * The producers' chance of bringing a guest part back as a recurring character in a season ordered or renewed, by the
 * best its work was judged: none for working or unready work. The part they offer guarantees two episodes and expects
 * five. ASSUMPTION each, the game's; drawn by the engagement and the season (decider `pro.recurring`).
 */
export const INVITE = { chance: { exceptional: 0.6, strong: 0.4, working: 0, unready: 0 } as Readonly<Record<Band, number>>, guaranteed: 2, expected: 5 } as const;
export const RECUR_KIND = 'pro.recurring_invite';

export const inviteChance = (band: Band | undefined): number => (band ? INVITE.chance[band] : 0);
export const invitedBack = (sim: Simulation, e: Engagement, year: number): boolean => sim.rng('pro.recurring', e.id, year).next() < inviteChance(bestBandOf(e));

/** The recurring part a guest part becomes: the same character, its episodes and option a recurring part's, cast without an audition. */
export function recurringPart(t: ProjectTemplate, year: number): ProjectTemplate {
  return {
    ...t, id: `${t.id}.recurring.${year}`,
    schedule: { kind: 'episodes', guaranteed: INVITE.guaranteed, expected: INVITE.expected },
    stages: { audition: t.stages.audition, callback: false }, leadDays: undefined, episodes: undefined, intimacy: undefined,
  };
}

/**
 * When the producers weigh a guest part for the season beginning in `year`: six weeks before its first day, so the part
 * isn't cast again before they've said, and never before the network's word on a season it has to renew.
 */
export function inviteAt(s: SeriesTemplate, year: number): Instant {
  const at = addDays(seasonWindow(s, year).from, -42, NY);
  return year > s.orderedThrough ? Math.max(at, decisionAt(s, year) + 60 * MIN) : at;
}

/**
 * A guest part in a series played to its end Strong or better, put before its producers for the next season: weighed then,
 * once, if that season is made (`RECUR_KIND`). Work judged lower is never weighed.
 */
function scheduleInvite(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, s: SeriesTemplate, year: number): void {
  if (t.schedule.kind === 'episodes' || inviteChance(bestBandOf(e)) === 0 || e.invite) return;
  sim.schedule({ at: Math.max(inviteAt(s, year + 1), sim.now + MIN), kind: RECUR_KIND, label: `${s.title}: Its New Season’s Characters`, category: 'career', priority: 40, refType: 'pro.engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id, year: year + 1 } });
}

/** Whether the producers' word on bringing this guest part back stands for a season: it's offered then, or isn't posted. */
export function inviteStands(person: Person, t: ProjectTemplate, year: number | undefined): boolean {
  return year !== undefined && (person.pro?.engagements ?? []).some((e) => e.projectId === t.id && e.invite?.invited === true && e.invite.year === year);
}

// ---------------------------------------------------------------------------------------------------------------------
// A recurring part grown at its option (Part 13)
// ---------------------------------------------------------------------------------------------------------------------

/**
 * The production writing more for a recurring part at its option: two more episodes guaranteed and a tenth more a day on
 * top of the option's raise. Its chance by the best the work was judged, moved by how far the season's audience stood
 * from its outlet's bar (`audience` for each whole bar over or under), never above `most`. ASSUMPTION each, the game's;
 * drawn by the engagement and the season (decider `pro.grow`).
 */
export const GROW = { episodes: 2, raise: 0.1, chance: { exceptional: 0.7, strong: 0.45, working: 0.1, unready: 0 } as Readonly<Record<Band, number>>, audience: 0.3, most: 0.9 } as const;

export function growChance(band: Band | undefined, ratio: number): number {
  return band ? clamp(GROW.chance[band] + GROW.audience * (ratio - 1), 0, GROW.most) : 0;
}

/** Whether the production grows the part at its option for `year`, its last season's audience at `ratio` of the bar. */
export const grows = (sim: Simulation, e: Engagement, year: number, ratio: number): boolean => sim.rng('pro.grow', e.id, year).next() < growChance(bestBandOf(e), ratio);

/** The season's audience against its outlet's bar: one at the bar, nothing measured, one. */
export function audienceRatio(sim: Simulation, s: SeriesTemplate, year: number): number {
  const a = seasonAudience(sim, s, year);
  return a ? a.average / AUDIENCE[outletOf(s)].bar : 1;
}

/**
 * The days an option taken up books, and the part grown where it is: more episodes, where the draw brings it and every
 * further day is clear (`refusal`); otherwise the days as they were.
 */
export function growthOf(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, s: SeriesTemplate, year: number, days: readonly WorkDay[], refusal: SeriesHooks['refusal']): { days: readonly WorkDay[]; grow?: { episodes: number; raise: number } } {
  if (t.schedule.kind !== 'episodes' || !grows(sim, e, year, audienceRatio(sim, s, year - 1))) return { days };
  const more = seasonDays(t, s, year, t.schedule.guaranteed + GROW.episodes);
  if (more.length <= days.length || refusal(person, more, e.id)) return { days };
  return { days: more, grow: { episodes: GROW.episodes, raise: GROW.raise } };
}

// ---------------------------------------------------------------------------------------------------------------------
// Pilots (Part 8)
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A pilot's network word: its chance of a series, the pilot's own quality and the player's part moving it (`termOf`,
 * `systems/market.ts`), between `least` and `most`; the option's last day some weeks after the word; and, picked up, the
 * pilot airing as the series' first episode some months after it, at the earliest. ASSUMPTION each, the game's: no
 * network publishes how often a pilot goes to series. Drawn by the pilot's production (decider `pro.pilot`).
 */
export const PILOT = { chance: { base: 0.35, quality: 0.2, part: 0.3, least: 0.05, most: 0.9 }, optionDays: 21, airsDays: 120, guaranteed: 2, expected: 6 } as const;
export const PILOT_KIND = 'pro.pilot_word';

export const pilotChance = (quality: number, term: number): number => clamp(PILOT.chance.base + PILOT.chance.quality * quality + PILOT.chance.part * term, PILOT.chance.least, PILOT.chance.most);

/** Whether a pilot's network picks it up, with the player's part in it at `term`. */
export const pilotPicked = (sim: Simulation, t: ProjectTemplate, term: number): boolean => sim.rng('pro.pilot', productionKey(t)).next() < pilotChance(qualityOf(sim, t), term);

/** The series a pilot becomes: its title, its network, one season ordered from July, its kind's episodes and chances. */
export function pilotSeries(t: ProjectTemplate): SeriesTemplate {
  const year = zonedParts(t.pilot!.decideAt, NY).year;
  const sp = KIND_PROFILES[t.kind]?.series ?? { episodes: 13, everyDays: 14, daysEach: 2, program: 'hour' as const, renew: 0.55, revive: 0.1 };
  return {
    id: `${productionKey(t)}.series`, title: t.project, company: t.pilot!.network, fictional: true, program: sp.program,
    firstSeason: year, orderedThrough: year, episodes: sp.episodes, everyDays: sp.everyDays, daysEach: sp.daysEach,
    season: { from: [7, 15], to: [5, 31] }, decide: { month: PILOTS.word.month, day: PILOTS.word.day, hour: PILOTS.word.hour },
    chance: { renew: sp.renew, revive: sp.revive, reviveAfter: 2 }, outlet: 'broadcast',
    words: `${t.project} and ${t.pilot!.network} are the game’s inventions, and so is each season: the network picked up its pilot in May ${year}, ordered one season, and says each May whether there’s another.`,
  };
}

/** The part a pilot's character becomes in its series: the same character, a recurring part's episodes and option. */
export function pilotPart(t: ProjectTemplate, s: SeriesTemplate): ProjectTemplate {
  return {
    ...t, id: `${t.id}.series`, series: s.id, pilot: undefined,
    schedule: { kind: 'episodes', guaranteed: PILOT.guaranteed, expected: PILOT.expected },
    stages: { audition: t.stages.audition, callback: false }, leadDays: undefined, episodes: undefined, intimacy: undefined,
    ...(t.slate ? { slate: { ...t.slate, production: s.id } } : {}),
  };
}

/** What a pilot's offer says of its terms, after its pay: the network's word in May, and the option on the series' first season. */
export function pilotOfferWords(t: ProjectTemplate): string | undefined {
  if (!t.pilot) return undefined;
  return `It’s a pilot for ${t.pilot.network}, a network invented for the game. On ${formatDate(t.pilot.decideAt, NY)}, the network picks it up to series or passes on it, and the contract gives the production an option on you for the series’ first season, at ${Math.round(OPTION_RAISE * 100)}% more a day, from July.`;
}

/** A pilot accepted: the option on the series' first season in its contract, and the network's word on the clock. */
export function pilotTerms(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate): void {
  if (!t.pilot || !e.contract) return;
  const year = zonedParts(t.pilot.decideAt, NY).year;
  e.contract.clauses.push({ kind: 'option', season: 1, year, by: addDays(t.pilot.decideAt, PILOT.optionDays, NY), raise: OPTION_RAISE, status: 'open' });
  sim.schedule({ at: t.pilot.decideAt, kind: PILOT_KIND, label: `${t.project}: The Network’s Word`, category: 'career', priority: 40, refType: 'pro.engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id } });
}

// ---------------------------------------------------------------------------------------------------------------------
// At the wrap: the network a season is seen on, and a pilot's airing held for its network's word
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A screen credit made at the wrap: the network its season is seen on, where another picked the series up (`PICKUP`); a
 * guest part played strongly, put before its producers for the next season (`INVITE`); and a pilot's airing held until
 * after its network's word, so nothing of it is out before the word. True where the release on the clock was moved, so
 * no promotional film is set for its first date.
 */
export function atWrap(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, creditId: string): boolean {
  const c = person.pro?.credits.find((x) => x.id === creditId);
  if (!c) return false;
  const s = t.series ? seriesById(t.series) : undefined;
  const year = s ? seasonYearAt(s, c.at) : undefined;
  if (s && year !== undefined) {
    const net = networkOf(sim, s, year);
    if (net.since !== undefined) c.network = net.name;
    // A guest part played strongly, put before its producers for the next season (`INVITE`).
    scheduleInvite(sim, person, e, t, s, year);
  }
  if (!t.pilot) return false;
  const item = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === 'pro.release' && i.refId === c.id);
  const earliest = addDays(t.pilot.decideAt, PILOT.airsDays, NY);
  if (item && item.at < earliest) {
    sim.timeline.cancel(item.id, sim.now);
    sim.schedule({ at: earliest, kind: 'pro.release', label: item.label, category: 'career', priority: 60, refType: 'pro.credit', refId: c.id, payload: { ...item.payload } });
  }
  return true;
}

// ---------------------------------------------------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------------------------------------------------

/** A notice of the career's, to the player alone. */
function tellOf(sim: Simulation, person: Person, title: string, body: string, importance = 70): void {
  if (person.id !== sim.universe.playerId) return;
  sim.notify({ category: 'career', title, body, importance, route: '/workspace/career' });
}

export function registerContinuity(sim: Simulation, hooks: SeriesHooks): void {
  sim.onCommand<{ opportunityId: string }, { answerAt: Instant }>('pro.ask_option_release', (p, { sim: s }) => {
    const person = s.player;
    const o = person.pro?.opportunities.find((x) => x.id === p?.opportunityId);
    const no = optionReleaseRefusal(s, person, o);
    if (no) throw new CommandError(no);
    const held = heldOptions(person, offerSpans(person, o!))[0]!;
    const answerAt = releaseAnswerAt(s.now);
    held.option.release = { at: s.now, answerAt, against: o!.id };
    s.schedule({ at: answerAt, kind: OPTION_RELEASE_KIND, label: `The Answer On The Option For ${held.e.role}`, category: 'career', priority: 40, refType: 'pro.engagement', refId: held.e.id, payload: { personId: person.id, engagementId: held.e.id, opportunityId: o!.id } });
    noteEvent(s, held.e, { kind: 'requested', key: `option:release:${o!.id}`, words: `You asked ${held.t.company} to release you from its option as ${held.e.role}, with the offer for ${projectOf(o!).role.part} on some of the days it holds.` });
    return { answerAt };
  });

  sim.onSchedule(OPTION_RELEASE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person?.pro?.engagements.find((x) => x.id === item.payload.engagementId);
    const option = clauseOf(e?.contract, 'option');
    const t = e ? projectById(e.projectId) : undefined;
    const against = String(item.payload.opportunityId);
    if (!person || !e || !t || option?.status !== 'open' || option.release?.against !== against || option.release.answer) return;
    const offer = person.pro?.opportunities.find((x) => x.id === against);
    const what = offer ? `the offer for ${projectOf(offer).role.part}` : 'the other offer';
    if (releaseGranted(s, e, against)) {
      option.release.answer = 'granted';
      option.status = 'expired';
      option.settled = { at: s.now, why: `${t.company} released you from its option as ${e.role}, at your asking.` };
      noteEvent(s, e, { kind: 'success', key: `option:${option.year}`, words: option.settled.why });
      tellOf(s, person, `Released From The Option On ${e.role}`, `${t.company} released you from its option as ${e.role}. You can accept ${what} without giving anything up, and a part in ${t.project}’s next season can still come through a new casting.`, 70);
      return;
    }
    option.release.answer = 'refused';
    noteEvent(s, e, { kind: 'problem', key: `option:release:${against}:refused`, words: `${t.company} wouldn’t release you from its option as ${e.role}.` });
    tellOf(s, person, `The Option On ${e.role} Stands`, `${t.company} won’t release you from its option as ${e.role}. You can decline ${what}, or accept it and give the option up.`, 70);
  });

  // A guest part brought back (`INVITE`): offered without an audition for days in the new season, or said why not.
  sim.onSchedule(RECUR_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person?.pro?.engagements.find((x) => x.id === item.payload.engagementId);
    const t = e ? projectById(e.projectId) : undefined;
    const series = t?.series ? seriesById(t.series) : undefined;
    const year = Number(item.payload.year);
    // The season ordered or renewed: a canceled series has no new characters to bring back.
    if (!person?.pro || !e || !t || !series || e.invite || !seasonMade(s, series, year)) return;
    const invited = invitedBack(s, e, year);
    e.invite = { year, invited };
    if (!invited) return;
    const rt = recurringPart(t, year);
    keepPart(person, rt, series);
    const band = bestBandOf(e);
    const words = `Your work as ${t.role.part} in ${seasonName(s, series, year - 1)} of ${series.title} was ${band ? BAND_LABEL[band] : 'strong'}, and its producers want ${t.role.part} back as a recurring character in its new season, with a new contract: ${countWords(INVITE.guaranteed)} episodes guaranteed.`;
    if (hooks.bringBack(s, person, rt, e, words)) {
      noteEvent(s, e, { kind: 'success', key: `invite:${year}:offered`, words: `The producers of ${series.title} offered ${t.role.part} back as a recurring character for its new season.` });
      return;
    }
    const why = `${series.title}’s producers wanted ${t.role.part} back as a recurring character, but its new season had no work for the part to offer you.`;
    noteEvent(s, e, { kind: 'problem', key: `invite:${year}:none`, words: why });
    tellOf(s, person, `${series.title} Can’t Bring Back ${t.role.part}`, `${why} Your work in it stays on your credits.`, 60);
  });

  // A pilot's network word (`PILOT`): picked up to series or passed on, and the option on the player with it.
  sim.onSchedule(PILOT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person?.pro?.engagements.find((x) => x.id === item.payload.engagementId);
    const t = e ? projectById(e.projectId) : undefined;
    if (!person?.pro || !e || !t?.pilot || e.pilot) return;
    const option = clauseOf(e.contract, 'option');
    const picked = pilotPicked(s, t, termOf(t.role.size, bestBandOf(e)));
    const series = pilotSeries(t);
    e.pilot = { at: s.now, picked, ...(picked ? { seriesId: series.id } : {}) };
    const label = 'The network’s word is the game’s simulation, read from the pilot’s own quality and your part in it.';
    if (!picked) {
      const c = e.creditId ? person.pro.credits.find((x) => x.id === e.creditId) : undefined;
      if (c && c.status === 'shot') {
        c.release = { kind: 'shelved', told: true };
        for (const i of s.universe.scheduled.filter((x) => x.status === 'pending' && ((x.kind === 'pro.release' && x.refId === c.id) || (x.kind === 'pro.promo' && x.refId === e.id)))) s.timeline.cancel(i.id, s.now);
        delete e.promo;
      }
      if (option?.status === 'open') { option.status = 'expired'; option.settled = { at: s.now, why: `${t.pilot.network} passed on ${t.project}, so there’s no series to take up the option for.` }; }
      const words = `${t.pilot.network} passed on ${t.project}: it won’t go to series, and the pilot won’t air. ${t.role.part} stays on your credits as shot, and the pay was yours. With no airing, its footage can’t go on a reel. ${label}`;
      noteEvent(s, e, { kind: 'problem', key: 'release:shelved', words });
      tellOf(s, person, `${t.project} Isn’t Picked Up`, words, 70);
      return;
    }
    keepPart(person, pilotPart(t, series), series);
    const words = `${t.pilot.network} picked up ${t.project} to series, a first season from July. ${label}`;
    noteEvent(s, e, { kind: 'success', key: 'pilot:picked', words });
    if (option?.status !== 'open' || e.status === 'canceled') { tellOf(s, person, `${t.project} Goes To Series`, `${words} The series goes on without you.`, 65); return; }
    const part = pilotPart(t, series);
    const days = optionDays(t, option);
    const no = hooks.refusal(person, days, e.id);
    if (no || !optionDrawn(s, e)) {
      option.status = 'expired';
      // Lowercased into the sentence but for an acronym ("SAG-AFTRA work ..."), as `systems/series.ts`'s option says it.
      const mid = no ? (/^[A-Z]{2}/.test(no) ? no : `${no.charAt(0).toLowerCase()}${no.slice(1)}`).replace(/\.$/, '') : '';
      option.settled = { at: s.now, why: no ? `${t.company} couldn’t take up its option on you as ${t.role.part}: ${mid}.` : `${t.company} let its option on you as ${t.role.part} lapse.` };
      noteEvent(s, e, { kind: 'problem', key: `option:${option.year}`, words: option.settled.why });
      tellOf(s, person, `${t.project} Goes To Series Without You`, `${words} ${option.settled.why} The series goes on without you.`, 70);
      return;
    }
    const next = hooks.renew(s, person, e, part, days, { first: true });
    option.status = 'exercised';
    option.settled = { at: s.now, why: `${t.company} took up its option on you as ${t.role.part} for the series’ first season.`, engagementId: next.id };
    noteEvent(s, e, { kind: 'booked', key: `option:${option.year}`, words: option.settled.why });
    tellOf(s, person, `${t.project} Goes To Series`, `${words} ${option.settled.why} The Work tab has your first season.`, 75);
  });
}
