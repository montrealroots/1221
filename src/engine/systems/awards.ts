/**
 * SLATE — awards and festivals for the player's work (from 2026-10-24, the owner's brief 25, Parts 11 and 12;
 * `docs/verification/career-world-2026-10-23/criteria.md`, Module 6, X6 to X15).
 *
 * Two competitions decide, each by the rules this build read (`content/awards.ts`): the Television Academy's Emmy Awards,
 * whose 78th Rules And Procedures let a performer enter themselves (rule 4) for a performer category their part fits, and
 * the Sundance Film Festival, where only the production submits a film. Every other institution the brief names is listed
 * with what was read of it, and the game doesn't decide its eligibility.
 *
 * An Emmy year runs its course on the clock (`pro.awards`, a passage reactor): at the entry deadline, eligible work the
 * player didn't enter is entered by its production or not (decider `awards.entry`); at the nominations, each category's
 * anonymous field of submissions is drawn (decider `awards.field`: its size, every entrant's standing, ids that stay with
 * the competition), the number of nominations set by the 78th's table and its tie rules; at the final round's end the
 * winner is settled (decider `awards.final`) and kept; at the ceremony the result is the player's to watch or read. A
 * Sundance year likewise: the production's submission at the deadline (decider `festival.submit`), the festival's word
 * (decider `festival.select`) and the screening. Each step reads its record's own state first, so a reload runs nothing
 * twice and decides nothing again.
 *
 * Recognition is visibility, nothing more: it raises how casting sees the player for a while (`visibilityOf`), and never
 * pays, rewrites a contract or guarantees another award. Other nominees and winners are never named.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { formatMoney } from '../core/money';
import { MS_DAY, addDays, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { projectById, type ProjectTemplate } from '../content/careerwork';
import {
  EMMY_CATEGORIES, EMMY_RULES, LIMITED_EPISODES, actorEdition, SCENES_PER_EPISODE, SEASON_EPISODES, SHORT_UNDER_MINUTES, SUNDANCE_CATEGORY_NAME, emmyEdition, emmyYearOf,
  sundanceEdition, type EmmyCategory, type EmmyEdition, type SundanceCategory, type SundanceEdition,
} from '../content/awards';
import type { FormatId } from '../content/workflows';
import { seriesById } from '../content/series';
import { ensurePro, type Engagement, type ProCredit, type ProId } from './pro';
import { formatOf, voiceOnly } from './workflow';
import { spend, spendRefusal } from './spending';
import { inSaveMoney } from './banking';
import { saveCurrency } from '../core/money';
import { countWords, plural } from '../core/text';
import { countryOfPlace } from '../content/geography';
import { requirementOfRole } from './engagement';
import { peakOf } from './charts';
import { invitation, type Attendance } from './ceremony';

const NY = 'America/New_York';
export const AWARDS_KIND = 'pro.awards';

// ---------------------------------------------------------------------------------------------------------------------
// The records
// ---------------------------------------------------------------------------------------------------------------------

export type AwardState = 'not-entered' | 'entered' | 'not-nominated' | 'nominated' | 'lost' | 'won' | 'disqualified';

/** One performance in one Emmy year: the player's entry or the production's, and what came of it. */
export interface AwardEntry {
  id: ProId;
  institution: 'emmys';
  year: number;
  category: EmmyCategory;
  creditId: ProId;
  engagementId: ProId;
  state: AwardState;
  enteredBy?: 'you' | 'production';
  enteredAt?: Instant;
  fee?: Money;
  /**
   * The category's field, kept with the competition: its size, the nominations, the nominees' ids, the winner's. The
   * player's entries are `you:<credit>`, every one in the category together (`fieldFor`); a field drawn before
   * 2026-10-25 held one entry of the player's, as `you` (`isYou`).
   */
  field?: { submissions: number; nominations: number; nominees: string[]; standing: Record<string, number>; winner?: string };
  /** When the result is the player's to see: the ceremony. */
  ceremonyAt: Instant;
  watchedAt?: Instant;
  /** Whether the player went, and how it went (`systems/ceremony.ts`, from 2026-10-25, brief 27's K7). */
  attend?: Attendance;
  why?: string;
}

export type FestivalState = 'not-submitted' | 'submitted' | 'not-selected' | 'selected' | 'screened';

/** One film in one Sundance year: the production's submission, the festival's word, the screening. */
export interface FestivalEntry {
  id: ProId;
  institution: 'sundance';
  year: number;
  category: SundanceCategory;
  creditId: ProId;
  engagementId: ProId;
  state: FestivalState;
  submittedAt?: Instant;
  noticeAt: Instant;
  screenedAt?: Instant;
}

const awardsOf = (person: Person): AwardEntry[] => (person.pro ? (person.pro.awards ??= []) : []);
const festivalsOf = (person: Person): FestivalEntry[] => (person.pro ? (person.pro.festivals ??= []) : []);

/** A day of a provider's calendar at a time, in New York. */
const dayAt = (iso: string, hour: number): Instant => { const [year, month, day] = iso.split('-').map(Number) as [number, number, number]; return instantFromZoned({ year, month, day, hour, minute: 0 }, NY); };
const isoOf = (at: Instant): string => { const p = zonedParts(at, NY); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

// ---------------------------------------------------------------------------------------------------------------------
// When the work comes out
// ---------------------------------------------------------------------------------------------------------------------

/** A credit's premiere: when it was released, or when its release is on the clock; nothing where neither. */
export function premiereOf(sim: Simulation, person: Person, c: ProCredit): Instant | undefined {
  if (c.releasedAt !== undefined) return c.releasedAt;
  // Its distributor's way out (from 2026-10-25, brief 27's `RELEASE_FATE`): shelved, none; held back and not yet said, the
  // day it will come, so an Emmy year read before the hold-back is said is the one the release falls in.
  if (c.release?.kind === 'shelved') return undefined;
  const at = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === 'pro.release' && i.refId === c.id && i.payload.personId === person.id)?.at;
  // Taken over by another distributor, its date moved as a hold-back's is (from 2026-10-25, `routeOf`, `systems/market.ts`).
  return at !== undefined && (c.release?.kind === 'late' || c.release?.kind === 'distributor') && !c.release.told ? addDays(at, c.release.days ?? 0, NY) : at;
}

const engagementOf = (person: Person, c: ProCredit): Engagement | undefined => (c.engagementId ? person.pro?.engagements.find((e) => e.id === c.engagementId) : undefined);

// ---------------------------------------------------------------------------------------------------------------------
// Emmy eligibility, by the 78th's rules
// ---------------------------------------------------------------------------------------------------------------------

const DRAMA: readonly FormatId[] = ['procedural', 'serialized-drama'];
const COMEDY: readonly FormatId[] = ['single-camera-comedy', 'serialized-comedy', 'multicam-comedy'];
const LIMITED: readonly FormatId[] = ['limited-series', 'anthology', 'tv-movie'];

export type EmmyCheck =
  | { eligible: true; year: number; category: EmmyCategory; scenes: number; of: number; episodes: number; season: number }
  | { eligible: false; why: string; year?: number };

/**
 * Why a credit whose part the record no longer holds can't be entered, read from the credit itself (from 2026-10-25, brief
 * 27's F). A finished engagement goes only once nothing to come reads it (`keepBounded`, `stillRead`), so by then its Emmy
 * year has passed. Until then this said "This work's scenes are no longer in the game, so it can't say", which a long
 * career's older credits showed on Charts And Awards (the built app's ceremony walk).
 */
function pastWhy(sim: Simulation, c: ProCredit): string {
  if (c.medium !== 'television') return `The Emmy Awards are for programs first presented on television, and this is a ${c.medium === 'stage' ? 'play' : 'film'}.`;
  if (c.releasedAt === undefined) return c.release?.kind === 'shelved' ? 'It was shelved and never shown, so it never had an Emmy year.' : 'Its part is no longer on your record, so it can’t be entered.';
  const ed = emmyEdition(emmyYearOf(isoOf(c.releasedAt)));
  if (sim.now <= deadlineOf(ed)) return 'Its part is no longer on your record, so it can’t be entered.';
  return `Its premiere fell in the ${ordinal(ed.number)} Emmy Awards’ year, whose entries closed on ${longDay(ed.entryDeadline)}${ed.projected ? ', as the game projects it' : ''}.`;
}

/**
 * Whether a credit's performance can be entered for an Emmy, and in what: the program's kind and placement, the part's
 * episodes against the season's and its share of the episode's running time (the game counts scenes), and the year its
 * premiere falls in. Every refusal is a rule of the 78th's, said.
 */
export function emmyCheck(sim: Simulation, person: Person, c: ProCredit): EmmyCheck {
  const e = engagementOf(person, c);
  const t = e ? projectById(e.projectId) : undefined;
  if (!t || !e) return { eligible: false, why: pastWhy(sim, c) };
  const premiere = premiereOf(sim, person, c);
  const year = premiere !== undefined ? emmyYearOf(isoOf(premiere)) : undefined;
  if (t.medium !== 'television') return { eligible: false, why: 'The Emmy Awards are for programs first presented on television, and this is a film.', ...(year ? { year } : {}) };
  const fmt = formatOf(t);
  if (fmt.workflow === 'narration' || fmt.workflow === 'reenactment') return { eligible: false, why: 'Performers in documentary and nonfiction programs aren’t eligible in any performer category.' };
  if (fmt.workflow === 'dubbing') return { eligible: false, why: 'A program produced abroad isn’t eligible unless U.S. and foreign partners co-produced it to be shown on U.S. television, and a new English soundtrack doesn’t make it eligible.' };
  if (premiere === undefined || year === undefined) return { eligible: false, why: 'It isn’t on the air yet, and isn’t due to be: its premiere sets its Emmy year.' };
  if (voiceOnly(t)) {
    // A program's audience by its genres as the project states them (`requirementOfRole`), never the player's own.
    if (requirementOfRole(t).needs.some((n) => n.id === 'childrens')) return { eligible: false, why: 'Animation for children under 13 is eligible only in the Children’s And Family Emmys, which the game doesn’t cover.', year };
    return { eligible: true, year, category: 'voice-over', scenes: 0, of: 0, episodes: 1, season: 1 };
  }
  const kept = (e.units ?? []).filter((u) => (u.takes?.length ?? 0) > 0 && !u.cut);
  const byEpisode = new Map<number, number>();
  for (const u of kept) byEpisode.set(u.episode ?? 0, (byEpisode.get(u.episode ?? 0) ?? 0) + 1);
  const best = Math.max(0, ...byEpisode.values());
  if (!kept.length) return { eligible: false, why: 'None of your scenes is in the program as it aired.', year };
  const drama = DRAMA.includes(t.format), comedy = COMEDY.includes(t.format);
  if (LIMITED.includes(t.format)) {
    // The supporting categories' 5% is of the movie, of the complete limited series, or of the anthology's part; a lead's
    // has none.
    const whole = t.format === 'limited-series' ? LIMITED_EPISODES * SCENES_PER_EPISODE.hour : SCENES_PER_EPISODE.movie;
    const mine = t.format === 'limited-series' ? kept.length : best;
    const lead = t.role.size === 'lead';
    if (!lead && mine / whole < EMMY_RULES.leastShare) return { eligible: false, why: `A brief appearance: ${mine} of about ${whole} scenes, under the 5% of the running time a supporting performer needs.`, year };
    return { eligible: true, year, category: lead ? 'lead-limited' : 'supporting-limited', scenes: mine, of: whole, episodes: byEpisode.size, season: byEpisode.size };
  }
  if (!drama && !comedy) return { eligible: false, why: 'Its program isn’t a kind the Emmys’ performer categories hold.', year };
  const per = drama ? SCENES_PER_EPISODE.hour : SCENES_PER_EPISODE.halfHour;
  const series = t.series ? seriesById(t.series) : undefined;
  const season = series?.episodes ?? SEASON_EPISODES;
  const episodes = byEpisode.size;
  // A part in under half the episodes is a guest's, unless an earlier year's nomination for it was a supporting one: the
  // 78th's Guest Performer Eligibility keeps it in the supporting category from then on.
  const principal = awardsOf(person).some((a) => a.creditId !== c.id && a.year < year && (a.category === 'supporting-drama' || a.category === 'supporting-comedy')
    && ['nominated', 'won', 'lost'].includes(a.state) && person.pro?.credits.some((x) => x.id === a.creditId && x.project === c.project && x.role === c.role));
  const guest = episodes / season < EMMY_RULES.guestBelow && !principal;
  // A guest's 5% is of the episode entered, its best; a supporting performer in a series has no minimum but not being a cameo.
  if (guest && best / per < EMMY_RULES.leastShare) return { eligible: false, why: `A brief appearance: ${best} of about ${per} scenes, under the 5% of the episode’s running time a guest performer needs.`, year };
  return { eligible: true, year, category: guest ? (drama ? 'guest-drama' : 'guest-comedy') : (drama ? 'supporting-drama' : 'supporting-comedy'), scenes: best, of: per, episodes, season };
}

/** An eligible check in words: the category, the edition, and what the rules read of the part. */
export function eligibleWords(person: Person, check: Extract<EmmyCheck, { eligible: true }>): string {
  const ed = emmyEdition(check.year);
  const at = `${categoryName(person, check.category)} at the ${ordinal(ed.number)} Emmy Awards${ed.projected ? ', on the 78th’s rules carried forward' : ''}`;
  if (check.category === 'voice-over') return `Eligible for ${at}: a character’s voice in animation for viewers 13 and over.`;
  const share = `${check.scenes} of about ${check.of} scenes in an episode`;
  return check.category.startsWith('guest')
    ? `Eligible for ${at}: ${plural(check.episodes, 'episode')} of the season’s ${check.season}, under half, with ${share}.`
    : `Eligible for ${at}: ${share}.`;
}

/**
 * The International Emmy Awards' word on a program (N24): a program produced outside the U.S. and entered by its producer.
 * Every series the game casts is made in the U.S., so the answer is the same for each, and it's said.
 */
export function internationalWhy(t: ProjectTemplate): string {
  if (countryOfPlace(t.place.cityId) === 'us') return `The International Emmy Awards take programs produced outside the U.S., and ${t.project} is made in the U.S.`;
  return 'The International Emmy Awards take a program its producer enters, and the game doesn’t decide what a producer enters.';
}

/** A category's name for this performer: an actor's or an actress's, as the categories are. */
export const categoryName = (person: Person, c: EmmyCategory): string => (person.performerTitle === 'actress' ? EMMY_CATEGORIES[c].actressName : EMMY_CATEGORIES[c].actorName);

/** The day an edition's category is presented, at 5 PM in Los Angeles' day, said in New York's clock (ASSUMPTION: the hour). */
export function ceremonyOf(ed: EmmyEdition, c: EmmyCategory): Instant {
  return dayAt(EMMY_CATEGORIES[c].at === 'creative-arts' ? ed.creativeArts : ed.telecast, 20);
}

/** The entry fee a performer entering themselves pays, a non-member: the processing charge and the entry fee. */
export const entryFee = (sim: Simulation): Money => inSaveMoney(sim, EMMY_RULES.fees.processing + EMMY_RULES.fees.perEntrant, 'USD');

/**
 * The end of an edition's entry day, on the Academy's own clock (ASSUMPTION: the rules say "until May 7" and give their
 * voting deadline in Pacific time, so the day ends at midnight in Los Angeles). Until the module was read again once built
 * it ended at midnight in New York, three hours early.
 */
export const deadlineOf = (ed: EmmyEdition): Instant => {
  const [year, month, day] = ed.entryDeadline.split('-').map(Number) as [number, number, number];
  return instantFromZoned({ year, month, day, hour: 23, minute: 59 }, 'America/Los_Angeles');
};

/** Why the player can't enter this credit now, or nothing. */
/**
 * Another entry of the player's in the same year and category for the same program, a program being its title as the
 * credit names it (from 2026-10-25, brief 27's F). The 78th's rules let a performer "enter multiple achievements in a
 * performing category if the achievements are for different programs" (N23, Performer Awards). Until then a long career's
 * two parts in The Errand Of Penwick were both entered for one guest award, and both nominated.
 */
function sameProgramEntry(person: Person, c: ProCredit, year: number, category: EmmyCategory): AwardEntry | undefined {
  return awardsOf(person).find((a) => a.creditId !== c.id && a.year === year && a.category === category && a.state !== 'not-entered' && a.state !== 'disqualified'
    && person.pro?.credits.find((x) => x.id === a.creditId)?.project === c.project);
}

export function entryRefusal(sim: Simulation, person: Person, creditId: string): string | undefined {
  const c = person.pro?.credits.find((x) => x.id === creditId);
  if (!c) return 'There’s no such credit.';
  const check = emmyCheck(sim, person, c);
  if (!check.eligible) return check.why;
  const ed = emmyEdition(check.year);
  const mine = awardsOf(person).find((a) => a.creditId === c.id && a.year === check.year);
  if (mine && mine.state !== 'not-entered') return `It’s already entered for the ${ordinal(ed.number)} Emmy Awards.`;
  const other = sameProgramEntry(person, c, check.year, check.category);
  const oc = other ? person.pro!.credits.find((x) => x.id === other.creditId)! : undefined;
  if (oc) return `${oc.role} in ${c.project} is entered for ${categoryName(person, check.category)} at the ${ordinal(ed.number)} Emmy Awards already, and a performer can enter a category more than once only for different programs.`;
  if (sim.now > deadlineOf(ed)) return `The entry deadline for the ${ordinal(ed.number)} Emmy Awards was ${longDay(ed.entryDeadline)}${ed.projected ? ', as the game projects it' : ''}.`;
  if (spendRefusal(sim, person, entryFee(sim), 'career')) return `Your bank can’t cover the ${formatMoney(entryFee(sim), saveCurrency(sim.universe))} entry.`;
  return undefined;
}

/** Enters the player for the Emmy their credit fits, paying the fee: the Work of the command `pro.award_enter`. */
export function enterAward(sim: Simulation, person: Person, creditId: string): AwardEntry {
  const no = entryRefusal(sim, person, creditId);
  if (no) throw new CommandError(no);
  const c = person.pro!.credits.find((x) => x.id === creditId)!;
  const check = emmyCheck(sim, person, c) as Extract<EmmyCheck, { eligible: true }>;
  const fee = entryFee(sim);
  if (!spend(sim, person, fee, `Emmy Awards entry: ${c.role}, ${c.project}`, 'career')) throw new CommandError(`Your bank can’t cover ${formatMoney(fee, saveCurrency(sim.universe))}, so nothing was charged.`);
  const ed = emmyEdition(check.year);
  const list = awardsOf(person);
  const was = list.find((a) => a.creditId === c.id && a.year === check.year);
  const entry: AwardEntry = was ?? { id: sim.nextId('pro'), institution: 'emmys', year: check.year, category: check.category, creditId: c.id, engagementId: c.engagementId!, state: 'entered', ceremonyAt: ceremonyOf(ed, check.category) };
  Object.assign(entry, { state: 'entered', category: check.category, enteredBy: 'you', enteredAt: sim.now, fee, ceremonyAt: ceremonyOf(ed, check.category) });
  if (!was) list.push(entry);
  return entry;
}

/** A festival's days in words: "January 21 to 31, 2027", the month and year said once where they're the same. */
function daysWords(from: string, to: string): string {
  const a = formatDate(dayAt(from, 12), NY), b = formatDate(dayAt(to, 12), NY);
  if (from.slice(0, 7) === to.slice(0, 7)) return `${a.replace(/, \d{4}$/, '')} to ${Number(to.slice(8, 10))}, ${to.slice(0, 4)}`;
  return `${a} to ${b}`;
}

export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
const longDay = (iso: string) => formatDate(dayAt(iso, 12), NY);

// ---------------------------------------------------------------------------------------------------------------------
// The field, the nominations and the final round
// ---------------------------------------------------------------------------------------------------------------------

/** How the work was judged, as the field's standing reads it (ASSUMPTION, the game's: the band's middle). */
export const STANDING: Readonly<Record<string, number>> = { unready: 35, working: 55, strong: 70, exceptional: 85 };

/** The field's draw (ASSUMPTION): a category's submissions, and every entrant's standing, the game's, never a real ballot. */
export const FIELD = { leastSubmissions: 60, mostSubmissions: 230, mean: 55, spread: 14, yours: 12, visibilityWeight: 60, production: { strong: 0.5, other: 0.1 } } as const;

/** The nominations a category's submissions give it, by the 78th's table (Nomination Procedures, 1). */
export function nominationsFor(submissions: number): number {
  let n = 0;
  for (const [least, k] of EMMY_RULES.nominationsBySubmissions) if (submissions >= least) n = k;
  if (submissions >= 20) return n;
  if (submissions >= 8) return Math.round(submissions / 4);
  return Math.min(2, submissions);
}

/**
 * The nominees from a field ranked by votes, the target its table gives, a tie across the line settled by the 78th's rules
 * (Nomination Procedures, 2 to 5): the count closest to the target prevails; between two a step from it, the higher; two
 * steps, the lower. Three steps from it, or a count under three or over seven, is the Awards Committee's to decide, which
 * the game reads as the count without the tied entries, where that leaves any (ASSUMPTION).
 */
export function nominate(votes: readonly { id: string; votes: number }[], target: number): string[] {
  const sorted = [...votes].sort((a, b) => b.votes - a.votes || a.id.localeCompare(b.id));
  if (sorted.length <= target) return sorted.map((v) => v.id);
  const line = sorted[target - 1]!.votes;
  const low = sorted.filter((v) => v.votes > line).length;
  const high = sorted.filter((v) => v.votes >= line).length;
  if (high === target) return sorted.slice(0, target).map((v) => v.id);
  const committee = low >= 1 ? low : high;
  const dLow = target - low, dHigh = high - target;
  let n = dLow < dHigh ? low : dHigh < dLow ? high : dLow === 1 ? high : dLow === 2 ? low : committee;
  if (n < 3 || n > 7) n = committee;
  return sorted.slice(0, n).map((v) => v.id);
}

/**
 * An entrant's votes: their standing in tenths of a point. Rounded to whole points, the first build's, two entrants met at
 * the nomination line in about half of the categories its probe drew, where a tie is the rules' exception; in tenths it's
 * about one in twenty.
 */
export const tenths = (standing: number) => Math.round(standing * 10);

/** A draw from a normal curve, from two uniform draws. */
export const normal = (a: number, b: number) => Math.sqrt(-2 * Math.log(Math.max(1e-9, a))) * Math.cos(2 * Math.PI * b);

/**
 * A category's anonymous field for a year (decider `awards.field`): its submissions, the player's among them, and each
 * other entrant's id and standing, the same whoever asks. It's keyed by the category's kind, which an actor's and an
 * actress's categories share, so both have the same count of entries and the 78th's parity between their nominations
 * holds (Nomination Procedures, 1).
 */
export function fieldDrawn(sim: Simulation, year: number, category: string): { submissions: number; others: { id: string; votes: number }[] } {
  const rng = sim.rng('awards.field', year, category);
  const submissions = Math.round(FIELD.leastSubmissions + (FIELD.mostSubmissions - FIELD.leastSubmissions) * rng.next());
  return { submissions, others: Array.from({ length: submissions - 1 }, (_, k) => ({ id: `${year}:${category}:${k + 1}`, votes: tenths(FIELD.mean + FIELD.spread * normal(rng.next(), rng.next())) })) };
}

/**
 * A category's field for a year, every entry of the player's in it together: its submissions and each entrant's standing,
 * the player's from the work and visibility, each entry `you:<credit>` with its own draw. The 78th's rules let a performer
 * "enter multiple achievements in a performing category if the achievements are for different programs", and a category
 * award is "a single, must-give award … with the highest vote-getter receiving an Emmy" (N23, Performer Awards and
 * Emmy Winners, read again on 2026-10-25). Until brief 27's F each entry drew a field of its own with the player in it
 * once, so two entries in one category could both win: a long career (`tools/long-career.ts`) won Outstanding Guest
 * Actress In A Comedy Series three times at the 84th, and the drama award three times. One entry's field is the one it
 * drew before.
 */
function fieldFor(sim: Simulation, person: Person, mine: readonly { a: AwardEntry; c: ProCredit }[]): { submissions: number; votes: { id: string; votes: number }[] } {
  const { year, category } = mine[0]!.a;
  const { submissions, others } = fieldDrawn(sim, year, category);
  const seen = visibilityOf(person, dayAt(emmyEdition(year).nominationsAnnounced, 9) - MS_DAY);
  const yours = mine.map(({ c }) => {
    const r = sim.rng('awards.field', year, category, c.project, c.role);
    return { id: youIn(c.id), votes: tenths((STANDING[c.band ?? 'working'] ?? 55) + FIELD.visibilityWeight * seen + FIELD.yours * normal(r.next(), r.next())) };
  });
  return { submissions: submissions - 1 + mine.length, votes: [...others, ...yours] };
}

/** The player's entry's id in a field. */
export const youIn = (creditId: string): string => `you:${creditId}`;
/** Whether an id in an entry's field is that entry: `you:<credit>`, or `you` in a field drawn before 2026-10-25. */
export const isYou = (a: Pick<AwardEntry, 'creditId'>, id: string | undefined): boolean => id === 'you' || id === youIn(a.creditId);
/** How many of a field's nominees are the player's. */
export const yoursIn = (nominees: readonly string[]): number => nominees.filter((id) => id === 'you' || id.startsWith('you:')).length;

/** The final round (decider `awards.final`): a peer vote for one among the nominees, each nominee's standing kept from the nominations, with the round's own draw. */
export function finalDrawn(sim: Simulation, year: number, category: string, nominees: readonly string[], standing: Readonly<Record<string, number>>): string {
  const rng = sim.rng('awards.final', year, category);
  const scored = nominees.map((id) => ({ id, score: (standing[id] ?? 10 * FIELD.mean) / 10 + FIELD.spread * normal(rng.next(), rng.next()) }));
  return scored.sort((x, y) => y.score - x.score || x.id.localeCompare(y.id))[0]!.id;
}

/** Whether a production enters a performance the player didn't (decider `awards.entry`): half the time for strong work, a tenth otherwise. */
export const productionEnters = (sim: Simulation, year: number, project: string, role: string, strong: boolean): boolean =>
  sim.rng('awards.entry', year, project, role).next() < (strong ? FIELD.production.strong : FIELD.production.other);

// ---------------------------------------------------------------------------------------------------------------------
// Sundance, by its 2027 rules
// ---------------------------------------------------------------------------------------------------------------------

/** A film's running time, by its format (ASSUMPTION, the game's: no cut of these invented films exists to time). */
export const RUNNING_MINUTES: Readonly<Partial<Record<FormatId, number>>> = {
  short: 15, 'student-film': 22, 'independent-feature': 95, 'studio-feature': 115, 'action-feature': 120, capture: 110, 'animated-feature': 95, narration: 88, reenactment: 88,
};

/** Whether a production of this kind submits to a festival at all (ASSUMPTION): a studio's films aren't sent to Sundance by open submission. */
const SUBMITS: readonly string[] = ['short', 'student-film', 'independent-feature', 'narration', 'reenactment'];

export type FestivalCheck = { eligible: true; year: number; category: SundanceCategory } | { eligible: false; why: string; year?: number };

/**
 * A film's place in Sundance's next year after it wraps: its category by running time and kind, all the game's films being
 * U.S. productions; a feature only while its world premiere is its own, so a release before the festival's day rules it
 * out, said before it comes; a short completed in the window, whatever its premiere.
 */
export function festivalCheck(sim: Simulation, person: Person, c: ProCredit): FestivalCheck {
  const e = engagementOf(person, c);
  const t = e ? projectById(e.projectId) : undefined;
  if (!t || !e) return { eligible: false, why: 'This work is no longer in the game.' };
  if (t.medium !== 'film') return { eligible: false, why: 'Sundance’s film sections are for films; this is television.' };
  const minutes = RUNNING_MINUTES[t.format];
  if (minutes === undefined) return { eligible: false, why: 'This film has no running time in the game, so it doesn’t say.' };
  const wrapped = e.days.at(-1)?.to ?? c.at;
  const ed = nextSundance(wrapped, minutes < SHORT_UNDER_MINUTES);
  const category: SundanceCategory = minutes < SHORT_UNDER_MINUTES ? 'us-short' : t.format === 'narration' || t.format === 'reenactment' ? 'us-documentary-feature' : 'us-narrative-feature';
  if (!SUBMITS.includes(t.format)) return { eligible: false, why: 'A studio’s film isn’t sent to Sundance by open submission, and the production hasn’t.', year: ed.year };
  const premiere = premiereOf(sim, person, c);
  if (category === 'us-short') {
    // A short finished on or after the window's day is eligible whatever its premiere; one finished before it only if it
    // wasn't out before it. The first build refused every short finished before the day, out or not, so no short the game
    // casts, finished in the fall, ever reached the festival a year on (its probe of sixteen lives).
    const window = dayAt(ed.shortWindow, 0);
    if (wrapped < window && premiere !== undefined && premiere < window) return { eligible: false, why: `It was finished and out before ${longDay(ed.shortWindow)}, so the ${ed.year} festival can’t take it.`, year: ed.year };
    return { eligible: true, year: ed.year, category };
  }
  if (premiere !== undefined && premiere < dayAt(ed.featureWindow, 0)) return { eligible: false, why: `Its release on ${formatDate(premiere, NY)} comes before ${longDay(ed.featureWindow)}, so it can’t keep the world premiere the ${ed.year} festival asks of a feature.`, year: ed.year };
  return { eligible: true, year: ed.year, category };
}

/** The first festival whose deadline for the kind of film comes after a day: the one a film finished then goes to. */
export function nextSundance(at: Instant, short: boolean): SundanceEdition {
  const y = zonedParts(at, NY).year;
  for (let year = Math.max(2027, y); year < y + 3; year += 1) {
    const ed = sundanceEdition(year);
    if (dayAt(short ? ed.deadlines.short : ed.deadlines.feature, 23) >= at) return ed;
  }
  return sundanceEdition(y + 2);
}

/** The production's chance of submitting, and the festival's of selecting, by how the work was judged (ASSUMPTION, the game's: the page gives no counts). */
export const FESTIVAL = { submit: 0.8, select: { unready: 0.005, working: 0.02, strong: 0.06, exceptional: 0.15 } as Readonly<Record<string, number>> } as const;

/** Whether the production submits its film (decider `festival.submit`). */
export const festivalSubmits = (sim: Simulation, year: number, project: string): boolean => sim.rng('festival.submit', year, project).next() < FESTIVAL.submit;

/** Whether the festival selects a submitted film (decider `festival.select`), at its band's chance. */
export const festivalSelects = (sim: Simulation, year: number, category: string, project: string, band: string | undefined): boolean =>
  sim.rng('festival.select', year, category, project).next() < (FESTIVAL.select[band ?? 'working'] ?? FESTIVAL.select.working!);

/** A festival entry in words, by where it stands. */
export function festivalWords(person: Person, f: FestivalEntry): string {
  const c = person.pro?.credits.find((x) => x.id === f.creditId);
  const ed = sundanceEdition(f.year);
  const film = c?.project ?? 'The film';
  const fest = `the ${ed.year} Sundance Film Festival`;
  const cat = SUNDANCE_CATEGORY_NAME[f.category];
  if (f.state === 'not-submitted') return `${film} wasn’t submitted to ${fest}: its production didn’t send it.`;
  if (f.state === 'submitted') return `${film} is submitted to ${fest}, in ${cat}. The festival answers about ${formatDate(f.noticeAt, NY)}${ed.projected ? ', on the game’s reckoning' : ''}.`;
  if (f.state === 'not-selected') return `${film} wasn’t selected for ${fest}.`;
  if (f.state === 'selected') return `${film} is an official selection of ${fest}, in ${cat}. It screens in ${ed.place}, ${daysWords(ed.from, ed.to)}.`;
  return `${film} screened at ${fest}, in ${cat}, an official selection.`;
}

/** A film's place in the festival before anything's submitted: its category and deadline, or why it can't go. */
export function festivalCheckWords(c: FestivalCheck): string {
  if (!c.eligible) return c.why;
  const ed = sundanceEdition(c.year);
  const deadline = c.category === 'us-short' ? ed.deadlines.short : ed.deadlines.feature;
  return `Eligible for the ${ed.year} Sundance Film Festival, in ${SUNDANCE_CATEGORY_NAME[c.category]}. The production submits it or doesn’t, by ${longDay(deadline)}${ed.projected ? ', on the game’s reckoning' : ''}; you can’t.`;
}

// ---------------------------------------------------------------------------------------------------------------------
// The clock
// ---------------------------------------------------------------------------------------------------------------------

/** Tells the player a notice. */
type Tell = (title: string, body: string) => void;

/**
 * Each stop, every step of every year due: entries at the deadline, the field and the nominations, the final round, the
 * ceremony; the festival's submission, word and screening. Each reads its record's state first, so it runs once.
 */
export function awardsPassage(sim: Simulation, person: Person, tell: Tell): void {
  if (!person.pro) return;
  const now = sim.now;
  for (const c of person.pro.credits) {
    if (c.medium === 'television') emmyStep(sim, person, c, now, tell);
    if (c.medium === 'film') festivalStep(sim, person, c, now, tell);
  }
  for (const a of awardsOf(person)) resultStep(sim, person, a, now, tell);
}

function emmyStep(sim: Simulation, person: Person, c: ProCredit, now: Instant, tell: Tell): void {
  const check = emmyCheck(sim, person, c);
  if (!check.eligible) {
    // An entry its work no longer holds: disqualified at the next step, as the rules disqualify an ineligible entry at any stage.
    for (const a of awardsOf(person).filter((x) => x.creditId === c.id && x.state === 'entered' && now >= dayAt(emmyEdition(x.year).nominationsAnnounced, 9))) {
      a.state = 'disqualified';
      a.why = check.why;
      tell('An Emmy Entry Disqualified', `Your entry for ${c.role} in ${c.project} was disqualified: ${check.why}`);
    }
    return;
  }
  const ed = emmyEdition(check.year);
  const list = awardsOf(person);
  let a = list.find((x) => x.creditId === c.id && x.year === check.year);
  if (now > deadlineOf(ed) && !a) {
    // A production enters only work it had by the deadline: a part booked after it waits for the next year's, if any.
    // Nor a second part of the player's in a program it has entered in this category (`sameProgramEntry`).
    const twice = sameProgramEntry(person, c, check.year, check.category);
    const entered = c.at <= deadlineOf(ed) && !twice && productionEnters(sim, check.year, c.project, c.role, c.band === 'strong' || c.band === 'exceptional');
    a = { id: sim.nextId('pro'), institution: 'emmys', year: check.year, category: check.category, creditId: c.id, engagementId: c.engagementId!, state: entered ? 'entered' : 'not-entered', ceremonyAt: ceremonyOf(ed, check.category), ...(entered ? { enteredBy: 'production' as const, enteredAt: deadlineOf(ed) } : {}), ...(twice ? { why: `another part of yours in ${c.project} is entered in the category, and a performer can enter a category more than once only for different programs.` } : {}) };
    list.push(a);
    if (entered) tell(`${c.project} Entered You For The Emmys`, `You’re entered for ${categoryName(person, check.category)} at the ${ordinal(ed.number)} Emmy Awards, for ${c.role}, by its production. The nominations are announced on ${longDay(ed.nominationsAnnounced)}.`);
  }
  if (!a || a.state !== 'entered') return;
  const announced = dayAt(ed.nominationsAnnounced, 9);
  if (now >= announced && !a.field) {
    // Every entry of the player's in the category, its work still eligible there, in the one field; one its work no longer
    // holds is disqualified at its own credit's step.
    const mine = list.filter((x) => x.year === a!.year && x.category === a!.category && x.state === 'entered' && !x.field).flatMap((x) => {
      const xc = x === a ? c : person.pro!.credits.find((y) => y.id === x.creditId);
      const ok = xc && (x === a || (() => { const k = emmyCheck(sim, person, xc); return k.eligible && k.year === x.year && k.category === x.category; })());
      return ok ? [{ a: x, c: xc }] : [];
    });
    const { submissions, votes } = fieldFor(sim, person, mine);
    const target = nominationsFor(submissions);
    const nominees = nominate(votes, target);
    const standing = Object.fromEntries(votes.filter((v) => nominees.includes(v.id)).map((v) => [v.id, v.votes]));
    for (const { a: x, c: xc } of mine) {
      x.field = { submissions, nominations: nominees.length, nominees: [...nominees], standing: { ...standing } };
      x.state = nominees.includes(youIn(xc.id)) ? 'nominated' : 'not-nominated';
      const name = categoryName(person, x.category);
      const also = yoursIn(nominees) - (x.state === 'nominated' ? 1 : 0);
      // Two parts of the player's in one category: the 78th's single award, said (N23).
      const others = also > 0 ? ` ${also === 1 ? 'Another part of yours is' : `${countWords(also).replace(/^./, (m) => m.toUpperCase())} other parts of yours are`} nominated in the category too, and only one of the ${countWords(also + 1)} can win it.` : '';
      tell(x.state === 'nominated' ? 'You’re Nominated For An Emmy' : 'The Emmy Nominations Are Out',
        x.state === 'nominated'
          ? `You’re one of ${nominees.length} nominees for ${name} at the ${ordinal(ed.number)} Emmy Awards, for ${xc.role} in ${xc.project}.${others} ${invitation(sim, person, x)}`
          : `You weren’t nominated for ${name} at the ${ordinal(ed.number)} Emmy Awards, for ${xc.role} in ${xc.project}: ${nominees.length} of ${submissions} entries were.`);
    }
  }
}

function resultStep(sim: Simulation, person: Person, a: AwardEntry, now: Instant, tell: Tell): void {
  if (a.state !== 'nominated' || !a.field) return;
  const ed = emmyEdition(a.year);
  const c = person.pro!.credits.find((x) => x.id === a.creditId);
  if (!c) return;
  if (now >= dayAt(ed.finalEnds, 23) && a.field.winner === undefined) a.field.winner = finalDrawn(sim, a.year, a.category, a.field.nominees, a.field.standing);
  if (now >= a.ceremonyAt && a.field.winner !== undefined) {
    a.state = isYou(a, a.field.winner) ? 'won' : 'lost';
    // Going, the show itself tells it (from 2026-10-25, brief 27's K7, `systems/ceremony.ts`); otherwise it's read from home.
    if (a.attend?.rsvp !== 'attending') tell(`The ${EMMY_CATEGORIES[a.category].at === 'creative-arts' ? 'Creative Arts Emmys' : 'Emmy Awards'} Tonight`, `${categoryName(person, a.category)} was presented tonight, with you among its ${a.field.nominations} nominees for ${c.role} in ${c.project}. Watch the ceremony, or read the result, on the Career screen’s Charts And Awards tab.`);
  }
}

function festivalStep(sim: Simulation, person: Person, c: ProCredit, now: Instant, tell: Tell): void {
  const check = festivalCheck(sim, person, c);
  if (!check.eligible) return;
  const ed = sundanceEdition(check.year);
  const list = festivalsOf(person);
  let f = list.find((x) => x.creditId === c.id && x.year === check.year);
  const deadline = dayAt(check.category === 'us-short' ? ed.deadlines.short : ed.deadlines.feature, 23);
  if (now >= deadline && !f) {
    const submits = festivalSubmits(sim, check.year, c.project);
    f = { id: sim.nextId('pro'), institution: 'sundance', year: check.year, category: check.category, creditId: c.id, engagementId: c.engagementId!, state: submits ? 'submitted' : 'not-submitted', noticeAt: dayAt(ed.notice, 10), ...(submits ? { submittedAt: deadline } : {}) };
    list.push(f);
    if (submits) tell(`${c.project} Is Submitted To Sundance`, `${c.project}’s production submitted it to the ${ed.year} Sundance Film Festival, in ${SUNDANCE_CATEGORY_NAME[check.category]}. The festival answers about ${formatDate(f.noticeAt, NY)}${ed.projected ? ', on the game’s reckoning' : ''}.`);
  }
  if (!f) return;
  if (f.state === 'submitted' && now >= f.noticeAt) {
    const selected = festivalSelects(sim, check.year, check.category, c.project, c.band);
    f.state = selected ? 'selected' : 'not-selected';
    tell(selected ? `${c.project} Is Selected For Sundance` : `${c.project} Wasn’t Selected For Sundance`,
      selected ? `${c.project} is an official selection of the ${ed.year} Sundance Film Festival, in ${SUNDANCE_CATEGORY_NAME[check.category]}. It screens in ${ed.place}, ${daysWords(ed.from, ed.to)}.`
        : `${c.project} wasn’t selected for the ${ed.year} Sundance Film Festival.`);
  }
  if (f.state === 'selected' && now >= dayAt(ed.from, 18)) {
    f.state = 'screened';
    f.screenedAt = dayAt(ed.from, 18);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// The ceremony
// ---------------------------------------------------------------------------------------------------------------------

// Watching a show and its lines are the ceremony's from 2026-10-25 (brief 27's K7), read for an Emmy and an Actor Award alike.
export { ceremonyLines, watchRefusal } from './ceremony';

/** The recap: the same result in a line. */
export function recapWords(person: Person, a: AwardEntry): string {
  const c = person.pro?.credits.find((x) => x.id === a.creditId);
  const name = categoryName(person, a.category);
  const ed = emmyEdition(a.year);
  if (a.state === 'won') return `You won ${name} at the ${ordinal(ed.number)} Emmy Awards, for ${c?.role} in ${c?.project}.`;
  if (a.state === 'lost') {
    // Lost to another of the player's own parts in the one field (`fieldFor`).
    const other = a.field?.winner?.startsWith('you:') && !isYou(a, a.field.winner) ? person.pro?.credits.find((x) => `you:${x.id}` === a.field!.winner) : undefined;
    return `Nominated for ${name} at the ${ordinal(ed.number)} Emmy Awards, for ${c?.role} in ${c?.project}. ${other ? `You won it for ${other.role} in ${other.project} instead.` : 'You didn’t win.'}`;
  }
  if (a.state === 'nominated') return `Nominated for ${name} at the ${ordinal(ed.number)} Emmy Awards; it’s presented on ${formatDate(a.ceremonyAt, NY)}.`;
  if (a.state === 'not-nominated') return `Entered for ${name} at the ${ordinal(ed.number)} Emmy Awards, and not nominated.`;
  if (a.state === 'disqualified') return `Disqualified from ${name} at the ${ordinal(ed.number)} Emmy Awards: ${a.why ?? 'the work no longer met the rules'}`;
  if (a.state === 'not-entered') return `Not entered for the ${ordinal(ed.number)} Emmy Awards: ${a.why ?? 'the entry deadline passed.'}`;
  return `Entered for ${name} at the ${ordinal(ed.number)} Emmy Awards${a.enteredBy === 'production' ? ' by the production' : ''}; the nominations are announced on ${longDay(ed.nominationsAnnounced)}.`;
}

/**
 * What the Portfolio keeps: every nomination, win and festival selection, oldest first, for good. A loss keeps its
 * nomination; an entry not nominated, a disqualification and a film not selected leave nothing here.
 */
export function recognitionOf(person: Person): { id: string; words: string }[] {
  const pro = person.pro;
  if (!pro) return [];
  const out: { id: string; at: Instant; words: string }[] = [];
  for (const a of pro.awards ?? []) {
    if (!['nominated', 'won', 'lost'].includes(a.state)) continue;
    out.push({ id: a.id, at: dayAt(emmyEdition(a.year).nominationsAnnounced, 9), words: recapWords(person, a) });
  }
  for (const f of pro.festivals ?? []) if (f.state === 'selected' || f.state === 'screened') out.push({ id: f.id, at: f.noticeAt, words: festivalWords(person, f) });
  return out.sort((x, y) => x.at - y.at).map(({ id, words }) => ({ id, words }));
}

// ---------------------------------------------------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------------------------------------------------

/**
 * What each recognition lends casting's eye, and over how long it fades to nothing (ASSUMPTION, the game's); and, from
 * 2026-10-25 (brief 27's loop 34: "Publicity should influence exposure where appropriate, not directly manufacture
 * artistic merit or guarantee awards"), a promotional film the actor appeared in, the least of them.
 */
export const VISIBILITY = { selected: 0.05, nominated: 0.08, won: 0.15, topThree: 0.04, promo: 0.03, speech: 0.03, fadeDays: 3 * 365, most: 0.3 } as const;

/**
 * How visible the player's work has made them at a moment: each festival selection, nomination, win, film in the top
 * three of the game's own chart and, from 2026-10-25, promotional film appeared in, each fading to nothing over three
 * years from when it came. From 2026-10-25 (brief 27's K7) an Actor Awards nomination and win count as an Emmy's
 * do, and so does a Strong acceptance speech or better (`systems/ceremony.ts`), at `speech`. Casting reads it, and so does
 * an awards field's standing (`fieldFor`, `actorawards.ts`), at its weight; nothing pays it, and it never touches the
 * work's judged quality.
 */
export function visibilityOf(person: Person, at: Instant): number {
  const pro = person.pro;
  if (!pro) return 0;
  const fade = (since: Instant | undefined, weight: number) => (since === undefined || since > at ? 0 : weight * Math.max(0, 1 - (at - since) / (VISIBILITY.fadeDays * MS_DAY)));
  let v = 0;
  for (const a of pro.awards ?? []) {
    const ed = emmyEdition(a.year);
    if (['nominated', 'won', 'lost'].includes(a.state)) v += fade(dayAt(ed.nominationsAnnounced, 9), VISIBILITY.nominated);
    if (a.state === 'won') v += fade(a.ceremonyAt, VISIBILITY.won);
  }
  for (const f of pro.festivals ?? []) if (f.state === 'selected' || f.state === 'screened') v += fade(f.noticeAt, VISIBILITY.selected);
  for (const c of pro.credits) {
    const peak = peakOf(c.run, at);
    if (peak !== undefined && peak <= 3) v += fade(c.run!.opening, VISIBILITY.topThree);
  }
  for (const e of pro.engagements) if (e.promo?.status === 'done') v += fade(e.promo.at, VISIBILITY.promo);
  for (const g of pro.guild ?? []) {
    // The nominations' morning, 6 a.m. in Los Angeles, which is 9 in New York.
    if (['nominated', 'won', 'lost'].includes(g.state)) v += fade(dayAt(actorEdition(g.year).nominationsAnnounced, 9), VISIBILITY.nominated);
    if (g.state === 'won') v += fade(g.ceremonyAt, VISIBILITY.won);
  }
  for (const n of [...(pro.awards ?? []), ...(pro.guild ?? [])]) if (n.attend?.speech && (n.attend.speech.band === 'strong' || n.attend.speech.band === 'exceptional')) v += fade(n.ceremonyAt, VISIBILITY.speech);
  return Math.min(VISIBILITY.most, Math.round(v * 1000) / 1000);
}

/** The project a credit is of, for the screens. */
export const projectOfCredit = (person: Person, c: ProCredit): ProjectTemplate | undefined => { const e = engagementOf(person, c); return e ? projectById(e.projectId) : undefined; };

/** Registers the awards' clock and commands. */
export function registerAwards(sim: Simulation, tell: (s: Simulation, person: Person, title: string, body: string) => void): void {
  sim.onPassage(AWARDS_KIND, (s) => awardsPassage(s, s.player, (title, body) => tell(s, s.player, title, body)));
  sim.onCommand<{ creditId: string }, { entryId: string; fee: Money }>('pro.award_enter', (p, { sim: s }) => {
    const a = enterAward(s, s.player, String(p?.creditId));
    ensurePro(s, s.player);
    return { entryId: a.id, fee: a.fee ?? 0 };
  });
  // Watching a ceremony is the ceremony's from 2026-10-25 (brief 27's K7, `systems/ceremony.ts`'s `pro.watch_ceremony`),
  // for the Actor Awards' shows as for the Emmys'.
}
