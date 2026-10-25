/**
 * SLATE — the Actor Awards presented by SAG-AFTRA (from 2026-10-25, the owner's brief 27, K7, loops 44 and 45: "evaluate
 * current rules and category placement → confirm authority and submission route → submit or enter through the
 * organization's actual process → close eligibility at the appropriate deadline"; "apply the researched
 * organization-specific stages ... Do not use a generic public popularity vote for every award"). Its 33rd Rules &
 * Regulations were read on 2026-10-25 (`b25-S48` in brief 27's research register), and each step here is a section of them:
 *
 * - **Eligibility** (Three): work first exhibited or broadcast in the calendar year, from a production signatory to a
 *   SAG-AFTRA agreement; a motion picture scripted, over 60 minutes, not a documentary, with a seven-day paid run in
 *   cinemas beginning that year in one of six major markets (the game assumes a release in cinemas plays Los Angeles County
 *   for a week); a comedy or drama series of six episodes or more, a limited or anthology series, or a television movie;
 *   any performer who appeared, on camera or in voice-over, with no least screen time.
 * - **Placement** (One): a film's lead in the leading role and anyone else in the supporting; television's categories
 *   aren't split by billing, so a guest and a series regular share one.
 * - **Submission** (Four): by the actor, or for them by their production, between the window's days, $200 a performance,
 *   one category a performance, a second submission for it returned. A production submits a performance the player didn't
 *   at the window's close or doesn't (decider `actor.entry`, at the Emmys' production chances).
 * - **Nominations** (Five, A): committees of members drawn at random vote five nominees in each category, more only for a
 *   tie at the line, and of two performances by one actor in a category only the one with more votes (decider
 *   `actor.field`: each category's anonymous field, the game's, never a real ballot).
 * - **Final voting** (Five, B): every paid-up member in the US and Canada, the most votes winning, a tie giving the award to
 *   each tied (decider `actor.final`).
 * - **The show**: the result is the player's at its hour (the ceremony, `systems/ceremony.ts`).
 *
 * A later year is the 33rd carried forward, its days a year on, said so. Recognition here is visibility, as an Emmy's is
 * (`visibilityOf`, `systems/awards.ts`); other nominees and winners are never named.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { projectById } from '../content/careerwork';
import { ACTOR_CATEGORIES, ACTOR_RULES, actorEdition, type ActorCategory, type ActorEdition } from '../content/awards';
import type { FormatId } from '../content/workflows';
import { seriesById } from '../content/series';
import { countryOfPlace } from '../content/geography';
import { ensurePro, type ProCredit, type ProId } from './pro';
import { formatOf, voiceOnly } from './workflow';
import { spend, spendRefusal } from './spending';
import { inSaveMoney } from './banking';
import { FIELD, RUNNING_MINUTES, STANDING, normal, ordinal, premiereOf, tenths, visibilityOf } from './awards';
import { homeOpening, splitYearsWhy } from './market';
import { invitation, type Attendance } from './ceremony';

const NY = 'America/New_York';
const LA = 'America/Los_Angeles';
export const ACTOR_AWARDS_KIND = 'pro.actor_awards';

// ---------------------------------------------------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------------------------------------------------

export type GuildState = 'not-submitted' | 'submitted' | 'not-nominated' | 'nominated' | 'lost' | 'won' | 'disqualified';

/** One performance in one Actor Awards year: its submission, by the player or their production, and what came of it. */
export interface GuildEntry {
  id: ProId;
  institution: 'actor-awards';
  /** The calendar year its work was first shown, whose awards it competes for. */
  year: number;
  category: ActorCategory;
  creditId: ProId;
  engagementId: ProId;
  state: GuildState;
  submittedBy?: 'you' | 'production';
  submittedAt?: Instant;
  fee?: Money;
  /** The category's field, kept: its size, the nominees' ids (the player's as `you:<credit>`), their votes, and the winners'. */
  field?: { submissions: number; nominees: string[]; standing: Record<string, number>; winners?: string[] };
  /** When the show gives the result. */
  ceremonyAt: Instant;
  watchedAt?: Instant;
  /** Whether the player went, and how it went (`systems/ceremony.ts`). */
  attend?: Attendance;
  why?: string;
}

export const guildOf = (person: Person): GuildEntry[] => (person.pro ? (person.pro.guild ??= []) : []);

/** A day of the guild's calendar at an hour of Los Angeles' day. */
const laAt = (iso: string, hour: number): Instant => { const [year, month, day] = iso.split('-').map(Number) as [number, number, number]; return instantFromZoned({ year, month, day, hour, minute: 0 }, LA); };
const longDay = (iso: string) => formatDate(laAt(iso, 12), NY);

/** The window's close, 5 p.m. PT (Four, 2). */
export const submissionsClose = (ed: ActorEdition): Instant => laAt(ed.submissions.closes, 17);
/** Its opening, at the start of the day in Los Angeles. */
export const submissionsOpen = (ed: ActorEdition): Instant => laAt(ed.submissions.opens, 0);
/** The nominations' morning: ASSUMPTION, 6 a.m. PT, the rules giving the day only. */
export const nominationsAt = (ed: ActorEdition): Instant => laAt(ed.nominationsAnnounced, 6);
/** Final voting's close, noon PT (Section Two). */
export const finalAt = (ed: ActorEdition): Instant => laAt(ed.finalCloses, 12);
/** The show, 5 p.m. PT, as its home page says (`b27-AA-home`). */
export const showAt = (ed: ActorEdition): Instant => laAt(ed.ceremony, 17);

/** A category's name for this performer: a male actor's or a female actor's, as the categories are. */
export const actorCategoryName = (person: Person, c: ActorCategory): string => (person.performerTitle === 'actress' ? ACTOR_CATEGORIES[c].actressName : ACTOR_CATEGORIES[c].actorName);
/** "the 33rd Actor Awards", and a projected year said so. */
export const actorAwardsName = (ed: ActorEdition): string => `the ${ordinal(ed.number)} Actor Awards${ed.projected ? ', on the 33rd’s rules carried forward' : ''}`;

// ---------------------------------------------------------------------------------------------------------------------
// Eligibility, by the 33rd's Section Three
// ---------------------------------------------------------------------------------------------------------------------

const DRAMA: readonly FormatId[] = ['procedural', 'serialized-drama'];
const COMEDY: readonly FormatId[] = ['single-camera-comedy', 'serialized-comedy', 'multicam-comedy'];
const LIMITED: readonly FormatId[] = ['limited-series', 'anthology', 'tv-movie'];

export type ActorCheck = { eligible: true; year: number; category: ActorCategory } | { eligible: false; why: string; year?: number };

/**
 * Why a credit whose part the record no longer holds can't be submitted, read from the credit itself (from 2026-10-25,
 * brief 27's F, as `pastWhy` in `systems/awards.ts`): by then its year's submissions have closed. Until then this said
 * "This work's scenes are no longer in the game, so it can't say".
 */
function pastWhy(sim: Simulation, c: ProCredit): string {
  if (c.medium === 'stage') return 'The Actor Awards are for motion pictures and television programs.';
  if (c.releasedAt === undefined) return c.release?.kind === 'shelved' ? 'It was shelved and never shown, so it never had a year at the Actor Awards.' : 'Its part is no longer on your record, so it can’t be submitted.';
  const year = zonedParts(c.releasedAt, NY).year;
  const ed = actorEdition(year);
  if (sim.now <= submissionsClose(ed)) return 'Its part is no longer on your record, so it can’t be submitted.';
  return `It was first shown in ${year}, for ${actorAwardsName(ed)}, whose submissions closed on ${longDay(ed.submissions.closes)}.`;
}

/** Whether a credit's performance can be submitted for the Actor Awards, in which year and category; each refusal a rule's, said. */
export function actorCheck(sim: Simulation, person: Person, c: ProCredit): ActorCheck {
  const e = c.engagementId ? person.pro?.engagements.find((x) => x.id === c.engagementId) : undefined;
  const t = e ? projectById(e.projectId) : undefined;
  if (!t || !e) return { eligible: false, why: pastWhy(sim, c) };
  // A film released abroad first is placed by its run at home, in the US, where the major markets are (from 2026-10-25,
  // brief 27, `homeOpening`, `systems/market.ts`): until then every film by its premiere.
  const first = premiereOf(sim, person, c);
  const premiere = homeOpening(first, c);
  const year = premiere !== undefined ? zonedParts(premiere, NY).year : undefined;
  const y = year !== undefined ? { year } : {};
  if (t.medium === 'stage') return { eligible: false, why: 'The Actor Awards are for motion pictures and television programs.' };
  if (t.union !== 'sag-aftra') {
    return countryOfPlace(t.place.cityId) === 'us'
      ? { eligible: false, why: 'The Actor Awards take productions signatory to a SAG-AFTRA agreement, and this one isn’t.', ...y }
      : { eligible: false, why: 'It was made outside the US under another union’s agreement: SAG-AFTRA decides whether it covers a member’s work there, and the game doesn’t decide it.', ...y };
  }
  const flow = formatOf(t).workflow;
  if (flow === 'narration' || flow === 'reenactment') return { eligible: false, why: t.medium === 'film' ? 'Documentaries aren’t eligible in the motion picture categories.' : 'The television categories are for scripted programs, and this is nonfiction.', ...y };
  if (flow === 'dubbing') return { eligible: false, why: 'A program has to have first aired in the US, and a dub is of one made and first shown abroad.', ...y };
  if (premiere === undefined || year === undefined) return { eligible: false, why: 'It has no release on the calendar yet, and the year it’s first shown sets its awards year.' };
  const kept = (e.units ?? []).filter((u) => (u.takes?.length ?? 0) > 0 && !u.cut);
  if (!voiceOnly(t) && e.units?.length && !kept.length) return { eligible: false, why: 'None of your scenes is in it as it was shown.', year };
  if (t.medium === 'film') {
    const minutes = RUNNING_MINUTES[t.format] ?? 0;
    if (minutes <= ACTOR_RULES.featureOver) return { eligible: false, why: `Short films, ${ACTOR_RULES.featureOver} minutes or less, aren’t eligible.`, year };
    if (c.release?.kind === 'streaming') return { eligible: false, why: 'A motion picture needs a seven-day paid run in cinemas in one of six major markets, and this one was sent to streaming instead.', year };
    const split = splitYearsWhy(first, c);
    if (split) return { eligible: false, why: split, year };
    if (formatOf(t).after !== 'theatrical') return { eligible: false, why: 'A motion picture needs a seven-day paid run in cinemas in one of six major markets, and this one had none.', year };
    return { eligible: true, year, category: t.role.size === 'lead' ? 'film-lead' : 'film-supporting' };
  }
  if (voiceOnly(t)) return { eligible: false, why: 'The television categories are for comedy and drama series, limited series and television movies, and the rules don’t say whether an animated series is one, so the game doesn’t place it.', year };
  if (LIMITED.includes(t.format)) return { eligible: true, year, category: 'tv-limited' };
  if (!DRAMA.includes(t.format) && !COMEDY.includes(t.format)) return { eligible: false, why: 'Its program isn’t a comedy or drama series, a limited series or a television movie.', year };
  const series = t.series ? seriesById(t.series) : undefined;
  if (series && series.episodes < ACTOR_RULES.seriesEpisodes) return { eligible: false, why: `A series needs at least ${ACTOR_RULES.seriesEpisodes} episodes in the year, and this one has ${series.episodes}.`, year };
  return { eligible: true, year, category: DRAMA.includes(t.format) ? 'tv-drama' : 'tv-comedy' };
}

/**
 * An eligible check in words: the category and the edition, and the submissions' window in the tense the clock reads it
 * (from 2026-10-25, brief 27's F: until then a window two years gone read "Submissions are open from August 24, 2032",
 * seen on the built app in January 2034).
 */
export function actorEligibleWords(person: Person, check: Extract<ActorCheck, { eligible: true }>, now?: Instant): string {
  const ed = actorEdition(check.year);
  const are = now === undefined ? 'are open' : now > submissionsClose(ed) ? 'were open' : now < submissionsOpen(ed) ? 'open' : 'are open';
  return `Eligible for ${actorCategoryName(person, check.category)} at ${actorAwardsName(ed)}. Submissions ${are} from ${longDay(ed.submissions.opens)} to ${longDay(ed.submissions.closes)}, at 5 PM Pacific.`;
}

// ---------------------------------------------------------------------------------------------------------------------
// Submission, by Section Four
// ---------------------------------------------------------------------------------------------------------------------

/** The individual performance's fee, $200 (Four, 5). */
export const actorFee = (sim: Simulation): Money => inSaveMoney(sim, ACTOR_RULES.fee, 'USD');

/** Why the player can't submit this credit now, or nothing. */
export function actorSubmitRefusal(sim: Simulation, person: Person, creditId: string): string | undefined {
  const c = person.pro?.credits.find((x) => x.id === creditId);
  if (!c) return 'There’s no such credit.';
  const check = actorCheck(sim, person, c);
  if (!check.eligible) return check.why;
  const ed = actorEdition(check.year);
  const had = guildOf(person).find((g) => g.creditId === c.id && g.year === check.year);
  if (had && had.state !== 'not-submitted') return 'It’s already submitted: a second submission for the same performance is returned.';
  if (sim.now < submissionsOpen(ed)) return `Submissions open on ${longDay(ed.submissions.opens)}, for ${actorAwardsName(ed)}.`;
  if (sim.now > submissionsClose(ed)) return `Submissions closed on ${longDay(ed.submissions.closes)} at 5 PM Pacific, for ${actorAwardsName(ed)}.`;
  if (spendRefusal(sim, person, actorFee(sim), 'career')) return `Your bank can’t cover the ${formatMoney(actorFee(sim), saveCurrency(sim.universe))} submission.`;
  return undefined;
}

/** Submits the player's performance, paying the fee: the work of the command `pro.actor_submit`. */
export function submitActor(sim: Simulation, person: Person, creditId: string): GuildEntry {
  const no = actorSubmitRefusal(sim, person, creditId);
  if (no) throw new CommandError(no);
  const c = person.pro!.credits.find((x) => x.id === creditId)!;
  const check = actorCheck(sim, person, c) as Extract<ActorCheck, { eligible: true }>;
  const fee = actorFee(sim);
  if (!spend(sim, person, fee, `Actor Awards submission: ${c.role}, ${c.project}`, 'career')) throw new CommandError(`Your bank can’t cover ${formatMoney(fee, saveCurrency(sim.universe))}, so nothing was charged.`);
  const list = guildOf(person);
  const was = list.find((g) => g.creditId === c.id && g.year === check.year);
  const entry: GuildEntry = was ?? { id: sim.nextId('pro'), institution: 'actor-awards', year: check.year, category: check.category, creditId: c.id, engagementId: c.engagementId!, state: 'submitted', ceremonyAt: showAt(actorEdition(check.year)) };
  Object.assign(entry, { state: 'submitted', category: check.category, submittedBy: 'you', submittedAt: sim.now, fee });
  if (!was) list.push(entry);
  return entry;
}

/** Whether a production submits a performance the player didn't (decider `actor.entry`), at the Emmys' production chances. */
export const actorProductionSubmits = (sim: Simulation, year: number, project: string, role: string, strong: boolean): boolean =>
  sim.rng('actor.entry', year, project, role).next() < (strong ? FIELD.production.strong : FIELD.production.other);

// ---------------------------------------------------------------------------------------------------------------------
// Nominations and final voting, by Section Five
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A category's submissions in a year, and every other performance's votes (ASSUMPTION every figure, the game's: the rules
 * publish no counts), on its own stream (decider `actor.field`), the same whoever asks.
 */
export const ACTOR_FIELD = { leastSubmissions: 80, mostSubmissions: 300 } as const;
export function actorFieldDrawn(sim: Simulation, year: number, category: ActorCategory): { submissions: number; others: { id: string; votes: number }[] } {
  const rng = sim.rng('actor.field', year, category);
  const submissions = Math.round(ACTOR_FIELD.leastSubmissions + (ACTOR_FIELD.mostSubmissions - ACTOR_FIELD.leastSubmissions) * rng.next());
  return { submissions, others: Array.from({ length: submissions }, (_, k) => ({ id: `${year}:${category}:${k + 1}`, votes: tenths(FIELD.mean + FIELD.spread * normal(rng.next(), rng.next())) })) };
}

/**
 * The nominees from a category's votes (Five, A.8, 11 and 12): the five with the most, and every performance tied with the
 * fifth; of one actor's performances in the category, only the one with the most votes, the next performance taking its
 * place. The player's performances are `you:<credit>`.
 */
export function actorNominees(votes: readonly { id: string; votes: number }[], n: number = ACTOR_RULES.nominees): string[] {
  const sorted = [...votes].sort((a, b) => b.votes - a.votes || a.id.localeCompare(b.id));
  const firstMine = sorted.findIndex((v) => v.id.startsWith('you:'));
  const counted = sorted.filter((v, i) => !v.id.startsWith('you:') || i === firstMine);
  if (counted.length <= n) return counted.map((v) => v.id);
  const line = counted[n - 1]!.votes;
  return counted.filter((v) => v.votes >= line).map((v) => v.id);
}

/** Final voting (Five, B, decider `actor.final`): each nominee's votes kept from the nominations with the round's own draw; the most wins, a tie each tied. */
export function actorWinners(sim: Simulation, year: number, category: ActorCategory, nominees: readonly string[], standing: Readonly<Record<string, number>>): string[] {
  const rng = sim.rng('actor.final', year, category);
  const scored = nominees.map((id) => ({ id, score: tenths((standing[id] ?? 10 * FIELD.mean) / 10 + FIELD.spread * normal(rng.next(), rng.next())) }));
  const top = Math.max(...scored.map((x) => x.score));
  return scored.filter((x) => x.score === top).map((x) => x.id);
}

/** A performance's standing with the nominating committee: its work's band, the player's visibility then, and its own draw. */
function standingOf(sim: Simulation, person: Person, g: GuildEntry, c: ProCredit, at: Instant): number {
  const mine = sim.rng('actor.field', g.year, g.category, c.project, c.role);
  return (STANDING[c.band ?? 'working'] ?? 55) + FIELD.visibilityWeight * visibilityOf(person, at - MS_DAY) + FIELD.yours * normal(mine.next(), mine.next());
}

// ---------------------------------------------------------------------------------------------------------------------
// The clock
// ---------------------------------------------------------------------------------------------------------------------

type Tell = (title: string, body: string) => void;

/**
 * Each stop, every step due: the production's submission at the window's close; at the nominations each category's field
 * with all the player's performances in it, rechecked first, an entry its work no longer holds disqualified; the final
 * round's close; the show. Each reads its record's state first, so it runs once.
 */
export function actorAwardsPassage(sim: Simulation, person: Person, tell: Tell): void {
  const pro = person.pro;
  if (!pro) return;
  const now = sim.now;
  const list = guildOf(person);
  for (const c of pro.credits) {
    if (c.medium === 'stage') continue;
    const check = actorCheck(sim, person, c);
    if (!check.eligible) continue;
    const ed = actorEdition(check.year);
    const close = submissionsClose(ed);
    if (now <= close || list.some((g) => g.creditId === c.id && g.year === check.year)) continue;
    // A production submits only work it had by the close.
    const submits = c.at <= close && actorProductionSubmits(sim, check.year, c.project, c.role, c.band === 'strong' || c.band === 'exceptional');
    list.push({ id: sim.nextId('pro'), institution: 'actor-awards', year: check.year, category: check.category, creditId: c.id, engagementId: c.engagementId!, state: submits ? 'submitted' : 'not-submitted', ceremonyAt: showAt(ed), ...(submits ? { submittedBy: 'production' as const, submittedAt: close } : {}) });
    if (submits) tell(`${c.project} Submitted You For The Actor Awards`, `Its production submitted you for ${actorCategoryName(person, check.category)} at ${actorAwardsName(ed)}, for ${c.role}. The nominations are announced on ${longDay(ed.nominationsAnnounced)}.`);
  }
  // The nominations, a category at a time, every performance of the player's in it together (Five, A.8).
  const due = list.filter((g) => g.state === 'submitted' && now >= nominationsAt(actorEdition(g.year)));
  for (const g of due) {
    if (g.state !== 'submitted') continue;
    const c = pro.credits.find((x) => x.id === g.creditId);
    const check = c ? actorCheck(sim, person, c) : undefined;
    if (!c || !check?.eligible || check.year !== g.year || check.category !== g.category) {
      g.state = 'disqualified';
      g.why = !check ? 'its work is no longer in the game.' : !check.eligible ? check.why : 'it was first shown in another year, or placed in another category.';
      if (c) tell('An Actor Awards Submission Returned', `Your submission for ${c.role} in ${c.project} was returned: ${g.why}`);
    }
  }
  const groups = new Map<string, GuildEntry[]>();
  for (const g of due.filter((x) => x.state === 'submitted')) groups.set(`${g.year}:${g.category}`, [...(groups.get(`${g.year}:${g.category}`) ?? []), g]);
  for (const mine of groups.values()) {
    const { year, category } = mine[0]!;
    const ed = actorEdition(year);
    const { submissions, others } = actorFieldDrawn(sim, year, category);
    const votes = [...others, ...mine.map((g) => ({ id: `you:${g.creditId}`, votes: tenths(standingOf(sim, person, g, pro.credits.find((x) => x.id === g.creditId)!, nominationsAt(ed))) }))];
    const nominees = actorNominees(votes);
    const standing = Object.fromEntries(votes.filter((v) => nominees.includes(v.id)).map((v) => [v.id, v.votes]));
    for (const g of mine) {
      const c = pro.credits.find((x) => x.id === g.creditId)!;
      g.field = { submissions: submissions + mine.length, nominees, standing };
      const name = actorCategoryName(person, category);
      if (nominees.includes(`you:${g.creditId}`)) {
        g.state = 'nominated';
        tell('You’re Nominated For An Actor Award', `You’re one of ${nominees.length} nominees for ${name} at ${actorAwardsName(ed)}, for ${c.role} in ${c.project}. ${invitation(sim, person, g)}`);
        continue;
      }
      g.state = 'not-nominated';
      const other = mine.some((x) => x !== g && nominees.includes(`you:${x.creditId}`));
      if (other) g.why = 'your other performance in the category had more votes, and of one actor’s performances in a category only that one is nominated.';
      tell('The Actor Awards Nominations Are Out', `You weren’t nominated for ${name} at ${actorAwardsName(ed)}, for ${c.role} in ${c.project}${other ? `: ${g.why}` : `: ${nominees.length} of ${submissions + mine.length} submissions were.`}`);
    }
  }
  for (const g of list) {
    if (g.state !== 'nominated' || !g.field) continue;
    const ed = actorEdition(g.year);
    if (now >= finalAt(ed) && !g.field.winners) {
      const shared = list.find((x) => x !== g && x.year === g.year && x.category === g.category && x.field?.winners);
      g.field.winners = shared?.field?.winners ?? actorWinners(sim, g.year, g.category, g.field.nominees, g.field.standing);
    }
    if (now >= g.ceremonyAt && g.field.winners) {
      g.state = g.field.winners.includes(`you:${g.creditId}`) ? 'won' : 'lost';
      // Going, the show itself tells it (`systems/ceremony.ts`); otherwise it's read from home.
      const c = pro.credits.find((x) => x.id === g.creditId);
      if (g.attend?.rsvp !== 'attending' && c) tell('The Actor Awards Tonight', `${actorCategoryName(person, g.category)} was presented tonight, with you among its ${g.field.nominees.length} nominees for ${c.role} in ${c.project}. Watch the show, or read the result, on the Career screen’s Charts And Awards tab.`);
    }
  }
}

/** A submission in a line, by where it stands. */
export function actorRecapWords(person: Person, g: GuildEntry): string {
  const c = person.pro?.credits.find((x) => x.id === g.creditId);
  const ed = actorEdition(g.year);
  const name = actorCategoryName(person, g.category);
  const at = actorAwardsName(ed);
  if (g.state === 'won') return `You won ${name} at ${at}, for ${c?.role} in ${c?.project}.`;
  if (g.state === 'lost') return `Nominated for ${name} at ${at}, for ${c?.role} in ${c?.project}. You didn’t win.`;
  if (g.state === 'nominated') return `Nominated for ${name} at ${at}; it’s presented on ${formatDate(g.ceremonyAt, NY)}.`;
  if (g.state === 'not-nominated') return `Submitted for ${name} at ${at}, and not nominated${g.why ? `: ${g.why}` : '.'}`;
  if (g.state === 'disqualified') return `Your submission for ${name} at ${at} was returned: ${g.why ?? 'the work no longer met the rules.'}`;
  if (g.state === 'not-submitted') return `Not submitted for ${at}: the window closed on ${longDay(ed.submissions.closes)}.`;
  return `Submitted for ${name} at ${at}${g.submittedBy === 'production' ? ' by the production' : ''}; the nominations are announced on ${longDay(ed.nominationsAnnounced)}.`;
}

/** Registers the guild's clock and its command. */
export function registerActorAwards(sim: Simulation, tell: (s: Simulation, person: Person, title: string, body: string) => void): void {
  sim.onPassage(ACTOR_AWARDS_KIND, (s) => actorAwardsPassage(s, s.player, (title, body) => tell(s, s.player, title, body)));
  sim.onCommand<{ creditId: string }, { entryId: string; fee: Money }>('pro.actor_submit', (p, { sim: s }) => {
    const g = submitActor(s, s.player, String(p?.creditId));
    ensurePro(s, s.player);
    return { entryId: g.id, fee: g.fee ?? 0 };
  });
}
