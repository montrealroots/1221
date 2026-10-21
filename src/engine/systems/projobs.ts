/**
 * SLATE — professional work, from a casting notice to the lasting credit (from 2026-10-21, the owner's brief 19, items
 * J1 to J5, A3, A4 and F4's work half; `docs/verification/career-2026-10-20/design.md`, The Work Loop, Work Eligibility
 * and The School's Rules). Built on the professional record (`systems/pro.ts`) and the fictional projects
 * (`content/careerwork.ts`); the pay a booking promises is written here and scheduled by the pay's system.
 *
 * **The loop.** An opportunity is one role in one project. It's posted, a submission sends the portfolio, the casting
 * office answers with an audition in person or a self-tape, a callback follows where the project has one, casting
 * decides, an offer stands for a few days, and accepting it books the work days on the calendar. The work is judged by
 * the evaluation every piece of work goes through (`systems/evaluation.ts`), and leaves a credit through `addCredit`: a
 * stage credit at the first performance, a screen credit when it's shot, released later through `releaseScreenCredit`.
 * Not every opportunity uses every stage: a student film's director sees actors once, a network co-star's office asks
 * for a tape and no callback.
 *
 * **Who can be seen for what (J3, J4).** Open roles (the student film, the non-union short, the ultra-low-budget film,
 * and an Equity open call for members) are posted each Monday by a decider (`pro.posting`) and the actor submits to them
 * directly. A role a casting office releases to agents only reaches an actor through an agent: while an agreement is in
 * force (`activeAgreement`, the one rule for it), the agent's breakdowns bring those, within his department's published
 * fields, and he submits where the role suits and the materials pass (`materialsCheck`), and says what's missing where
 * they don't. He conveys the answers and the offers; on SAG-AFTRA work at the minimum the agreement has him ask for scale
 * plus ten, which the pay's `negotiatedAmount` prices at the offer (this file priced it itself until 2026-10-21).
 * Representation changes what reaches the actor and how an offer comes, not whether they can submit to
 * an open call themselves.
 *
 * **Casting is decided apart from quality (J5).** What casting reads, in order: the audition's band (how good it was),
 * the role's fit (genre knowledge, and the role's techniques against the actor's), availability and eligibility, which
 * are checked and never drawn, and then the field of other actors, a draw by the decider `pro.casting` at a chance the
 * band, the fit and the kind of work give (`CASTING`). The chance never reaches certainty, so a strong actor can lose a
 * role, and a developing actor whose band and fit suit a smaller project can book it.
 *
 * **Work while enrolled (A3).** The Bulletin (`docs/research/career-2026-10-20/yale.md` §4, B27 p.148): the School
 * "discourages students from pursuing outside paid or unpaid professional work while school is in session"; "In rare
 * situations, professionally meaningful, short-term outside work that is communicated to the program chair and dean with
 * timeliness and transparency is approved"; "Only students in good standing may proceed with requests"; the request is a
 * written proposal, the chair recommends and the dean decides in writing; Yale Rep calls rank first and approved outside
 * work last (p.142); "Accepting and performing outside work without required approval is regarded as a conflict of
 * interest and may lead to academic warning or dismissal." The figures are the design's ASSUMPTIONS, said where they
 * apply (`OUTSIDE_WORK`): asked 14 days ahead, at most 10 working days, not a student film, decided 7 days on, approved
 * only when every condition holds, with no School or Yale Rep call taken and no more than two class days. Work taken in
 * term without approval brings an academic warning the first time and dismissal the second, through the School's own
 * standing (`setStanding`). Summer and the winter break are the student's, unless the School holds them for a call on
 * those days. An F-1 student is refused at acceptance by `usWorkAuthorized`, and the request says why: CPT is processed
 * only for training every student in the program must do (yale.md §6), and Acting has none.
 *
 * **Away at work.** An audition in person or a work day takes the actor out of town for its hours and the trip each way
 * (`awayAt`), and the School counts them absent from what falls inside it: a class missed, a call missed with the
 * School's own consequences. Approved work's class days are excused, as the approval arranged them.
 *
 * **Every number here is the game's estimate unless it cites a source**: the timings of a casting office, the chances,
 * the trips and the lead time are ASSUMPTIONS, said so on the screen. The rates are the unions' (`RATES`). Every
 * project, company and casting office is fictional, and each says so where it's first shown.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { ScheduledItem } from '../core/scheduler';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, addDays, ageOn, dateKey, formatDate, formatTime, formatWeekdayDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { plural, spokenList } from '../core/text';
import { CITIES } from '../content/geography';
import { MASTERED, TECHNIQUE_LABEL } from '../content/abilities';
import { TASK_PROFILES } from '../content/tasks';
import { ENGAGEMENT } from '../content/engagement';
import type { Skill } from '../content/school';
import { PROJECTS, RATES, SAG_DAY_BY_YEAR, projectById, type ProjectKind, type ProjectTemplate, type Rate } from '../content/careerwork';
import { agencyOf, agentById, type AgentField } from '../content/agents';
import { IN_TOWN_MINUTES } from '../world/calendar';
import {
  activeAgreement, addCredit, currentOf, eligibilityOf, ensurePro, keepBounded, materialsCheck, noteEvent, reelSources, releaseScreenCredit,
  type Agreement, type AuditionRound, type Engagement, type MaterialProblem, type Opportunity, type OutsideWorkRequest, type PartPrep,
  type ProEventKind, type ProPayment,
} from './pro';
import { BAND_LABEL, prepLean, type Band } from './coursework';
import { bandOfQuality, chiefLimit, evaluate, recordWork, type EvalContext, type Evaluation } from './evaluation';
import { BRIEF, type BriefStep } from './briefs';
import { PROCESS } from './production';
import { repeatsToday, stepSpeed } from './attributes';
import { exerts } from './body';
import { trainingRefusal } from './injury';
import { SPENT, startRefusal } from './life';
import { SELF_TAPE } from './engagement';
import {
  CALL_KIND, classPeriod, conditionAt, countWords, coursesFor, focusAt, keyOf, offSick, ordinary, recessStart, schoolEnded, setStanding,
  termOf, termStart,
} from './school';
import { f1Of, usWorkAuthorized } from './permission';
import { negotiatedAmount, sagWorkRefusal, schedulePay } from './propay';

// ---------------------------------------------------------------------------------------------------------------------
// The rules: each a published one with its source, or the game's ASSUMPTION
// ---------------------------------------------------------------------------------------------------------------------

/** New York's clock: the casting offices', and the one the postings and the pay keep. */
const NY = 'America/New_York';
const MIN = 60_000;

/**
 * A casting office's timings, every one an ASSUMPTION (no source in the research gives one; representation.md, "no
 * response times" and work.md §4): postings each Monday at nine for a week; an answer two days after a submission; an
 * audition the first weekday four days on, at eleven, half an hour; a self-tape due four days on at six in the evening;
 * a callback four days after the audition at two, or a taped one three days on; casting deciding a day after a round it
 * cuts from and three days after the last, at five; an offer standing three days; the work five weeks after the
 * posting. A shoot day runs seven to six, a rehearsal ten to six, a performance from eight for two and a half hours.
 */
export const WORK = {
  postHour: 9, submitDays: 7,
  replyDays: 2, replyHour: 10,
  auditionLeadDays: 4, auditionHour: 11, auditionMinutes: 30,
  tapeDays: 4, tapeHour: 18,
  callbackLeadDays: 4, callbackHour: 14, callbackTapeDays: 3,
  cutDays: 1, decisionDays: 3, decisionHour: 17,
  offerDays: 3, offerHour: 17,
  leadDays: 35,
  shoot: { hour: 7, minutes: 660 }, rehearsal: { hour: 10, minutes: 480 }, performance: { hour: 20, minutes: 150 },
  /** Asking for another time: once, at least a day ahead, the casting office's other times (eleven, two and five) in the next three weekdays. */
  moveAheadHours: 24, movesAllowed: 1, moveSlots: [11, 14, 17] as readonly number[], moveDays: 3,
  /** A step on the whole part takes twice its time on the sides; the part starts from half the sides' preparation. */
  partTimes: 2, sidesKept: 0.5,
  /** A professional audition's difficulty: a professional's (0), a callback a little more; each step of stakes as a brief's. */
  difficulty: { audition: 0, callback: 0.1 },
  /** A work day on your feet, as a brief's rehearsal: 2.5 METs. */
  met: 2.5,
} as const;

/**
 * The chance a project open to the actor's own submission posts a role in a given week, by its kind, and the chance a
 * project's breakdown reaches a represented actor's agent in one. ASSUMPTION: the game's, for a steady trickle.
 */
export const POSTING = {
  open: { 'student-film': 0.3, 'non-union-short': 0.25, 'ultra-low-budget': 0.15, lort: 0.12 } as Readonly<Partial<Record<ProjectKind, number>>>,
  agent: 0.2,
  /** A project casts its role once a cycle: posted again only ten weeks after its last posting to the actor. */
  againDays: 70,
} as const;

/**
 * Casting's chance, ASSUMPTION every figure: by the band of the round it reads (a callback's cut from the first
 * audition, the final from the last), the fit (the chance at no fit is `fitFloor` of it), and the field each kind of
 * work draws (more actors for a network co-star than a student film). Held to `least` and `most`: a perfect audition
 * that fits the role in the easiest field still loses it one time in five.
 */
export const CASTING = {
  final: { unready: 0.04, working: 0.18, strong: 0.38, exceptional: 0.58 } as Readonly<Record<Band, number>>,
  callback: { unready: 0.1, working: 0.45, strong: 0.78, exceptional: 0.9 } as Readonly<Record<Band, number>>,
  fitFloor: 0.4,
  field: { 'off-broadway': 0.8, lort: 0.85, 'network-drama': 0.75, 'low-budget': 0.85, 'ultra-low-budget': 1, 'student-film': 1.25, 'non-union-short': 1.2 } as Readonly<Record<ProjectKind, number>>,
  least: 0.01, most: 0.8,
  /** An actor plays three years either side of their own age. */
  playingSpread: 3,
} as const;

/** The field's size as a player reads it, by kind of work: more actors are seen for a network role. ASSUMPTION. */
export const FIELD_WORDS: Readonly<Record<ProjectKind, string>> = {
  'off-broadway': 'a large field: an Off-Broadway part draws many actors',
  lort: 'a large field: a regional theater casts from New York',
  'network-drama': 'the largest field: a network co-star is seen by the most actors',
  'low-budget': 'a large field',
  'ultra-low-budget': 'a middling field',
  'student-film': 'a small field: a student film sees fewer actors',
  'non-union-short': 'a small field',
};

/** Missed work days a project allows before replacing the actor: the stage's understudy covers one, a shoot can't wait. ASSUMPTION. */
export const MISSES = { stage: 1, screen: 0 } as const;

/** How long after it's shot a screen project comes out, so its footage can go on a reel. ASSUMPTION, by kind. */
export const RELEASE_DAYS: Readonly<Partial<Record<ProjectKind, number>>> = {
  'network-drama': 120, 'low-budget': 365, 'ultra-low-budget': 300, 'student-film': 180, 'non-union-short': 150,
};

/** The School's rule on outside work in term: the design's ASSUMPTIONS for the Bulletin's words (this file's header). */
export const OUTSIDE_WORK = { aheadDays: 14, mostDays: 10, decisionDays: 7, mostClassDays: 2, minutes: 60, decisionHour: 10 } as const;

/**
 * Getting there, each way, from where you live: across town, or between the projects' cities. ASSUMPTION: by train or by
 * road, as the game estimates it. Providence's two trips went with it on 2026-10-21, when the regional company moved to
 * Hudson.
 */
const TRIPS: Readonly<Record<string, number>> = {
  'us-ct-newhaven|us-ny-newyork': 120, 'us-ct-newhaven|us-ny-hudson': 120, 'us-ny-hudson|us-ny-newyork': 120,
};
export function tripMinutes(from: string, to: string): number {
  if (from === to) return IN_TOWN_MINUTES;
  return TRIPS[[from, to].sort().join('|')] ?? 180;
}

// Scheduled kinds: `pro.*`, never `work.*` (`migrate` drops those).
export const REPLY_KIND = 'pro.reply';
export const AUDITION_KIND = 'pro.audition';
export const TAPE_DUE_KIND = 'pro.tape_due';
export const CASTING_KIND = 'pro.casting_decision';
export const OFFER_KIND = 'pro.offer_lapse';
export const WORK_DAY_KIND = 'pro.work_day';
export const RELEASE_KIND = 'pro.release';
export const SCHOOL_ANSWER_KIND = 'pro.school_answer';

const ZERO: PartPrep = { interpretation: 0, memorization: 0, rehearsal: 0 };
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const cap = (x: string): string => x.charAt(0).toUpperCase() + x.slice(1);
/** A count with its noun, in words under ten as prose has them (docs/STYLE.md): "two days", "12 days", "one class day". */
export const counted = (n: number, one: string, many = `${one}s`): string => (n >= 0 && n < 10 ? `${countWords(n)} ${n === 1 ? one : many}` : plural(n, one, many));

// ---------------------------------------------------------------------------------------------------------------------
// Reading an opportunity: its project, its days, its pay, its fit
// ---------------------------------------------------------------------------------------------------------------------

export const projectOf = (o: Pick<Opportunity, 'projectId'>): ProjectTemplate => projectById(o.projectId)!;
const zoneOf = (cityId: string): string => CITIES.get(cityId)?.timeZone ?? NY;
/** A moment's date at an hour, in a zone. */
const dayAt = (t: Instant, hour: number, zone: string = NY, minute = 0): Instant => {
  const p = zonedParts(t, zone);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute, second: 0 }, zone);
};
const weekdayOf = (t: Instant, zone: string = NY): number => zonedParts(t, zone).weekday;
/** The first weekday, Monday to Friday, on or after a moment's date, at an hour. */
function weekdayFrom(t: Instant, hour: number, zone: string = NY): Instant {
  let d = dayAt(t, hour, zone);
  while (weekdayOf(d, zone) === 0 || weekdayOf(d, zone) === 6) d = addDays(d, 1, zone);
  return d;
}

/** What kind of work a project is, said in a phrase after "a fictional". */
export const KIND_WORDS: Readonly<Record<ProjectKind, string>> = {
  'off-broadway': 'Off-Broadway play', lort: 'play in a regional theater’s season', 'network-drama': 'network television drama',
  'low-budget': 'low-budget feature film', 'ultra-low-budget': 'ultra-low-budget feature film', 'student-film': 'student film',
  'non-union-short': 'non-union short film',
};

/** One work day: when, its label on the calendar, and what it is. */
export interface WorkDay { from: Instant; to: Instant; label: string; kind: 'rehearsal' | 'performance' | 'shoot' }

/**
 * The work's days, worked out from the posting and the project's schedule (`content/careerwork.ts`): a shoot's days on
 * consecutive weekdays from five weeks on; a run's rehearsals Tuesday to Saturday for its rehearsal weeks, from the
 * first Tuesday then, and its performances Tuesday to Sunday after. ASSUMPTION, each length the project's and each
 * shape the game's.
 */
export function datesOf(o: Pick<Opportunity, 'projectId' | 'postedAt'>): WorkDay[] {
  const t = projectOf(o);
  const zone = zoneOf(t.place.cityId);
  const start = addDays(dayAt(o.postedAt, 12, zone), WORK.leadDays, zone);
  const at = (d: Instant, s: { hour: number; minutes: number }) => { const from = dayAt(d, s.hour, zone); return { from, to: from + s.minutes * MIN }; };
  const out: WorkDay[] = [];
  if (t.schedule.kind === 'shoot') {
    for (let d = start; out.length < t.schedule.days; d = addDays(d, 1, zone)) {
      const wd = weekdayOf(d, zone);
      if (wd >= 1 && wd <= 5) out.push({ ...at(d, WORK.shoot), label: `${t.project}: Shoot Day ${out.length + 1}`, kind: 'shoot' });
    }
    return out;
  }
  let tuesday = start;
  while (weekdayOf(tuesday, zone) !== 2) tuesday = addDays(tuesday, 1, zone);
  for (let w = 0; w < t.schedule.rehearsalWeeks; w += 1) {
    for (let k = 0; k < 5; k += 1) out.push({ ...at(addDays(tuesday, w * 7 + k, zone), WORK.rehearsal), label: `${t.project}: Rehearsal`, kind: 'rehearsal' });
  }
  const opening = addDays(tuesday, t.schedule.rehearsalWeeks * 7, zone);
  for (let w = 0; w < t.schedule.performanceWeeks; w += 1) {
    for (let k = 0; k < 6; k += 1) out.push({ ...at(addDays(opening, w * 7 + k, zone), WORK.performance), label: `${t.project}: Performance`, kind: 'performance' });
  }
  return out;
}

/** A booked day's kind, read from where it falls in the project's schedule: a run's rehearsals come first. */
export function dayKindOf(t: ProjectTemplate, index: number): WorkDay['kind'] {
  if (t.schedule.kind === 'shoot') return 'shoot';
  return index < t.schedule.rehearsalWeeks * 5 ? 'rehearsal' : 'performance';
}

/** A rate's minimum on a day: the SAG-AFTRA day performer's by its contract year (S30), every other as `RATES` has it. */
export function rateOn(rate: Rate, on: Instant): number | undefined {
  if (rate.id !== 'sag-tv-day') return rate.amount;
  const key = dateKey(on, NY);
  return [...SAG_DAY_BY_YEAR].reverse().find((r) => r.from <= key)?.amount ?? rate.amount;
}

/** The offer's terms as they'd stand at a moment: the rate, a day's or a week's pay at scale, and how many. */
export interface PayTerms { rate: Rate; per: 'day' | 'week'; units: number; each?: Money; deferred: boolean }

/**
 * What the work pays: the minimum on its first day, by the day or the week, for its days or weeks; deferred for a
 * student film (SAGindie's Student Film Agreement, S32). Until 2026-10-21 this priced a represented actor's SAG-AFTRA work
 * at scale plus ten itself (`AGREEMENT_TERMS`' Scale Plus Ten, representation.md S3); the pay's `negotiatedAmount` prices
 * it now, at the offer (`makeOffer`), so the terms here are the rate's scale.
 */
export function payTermsOf(o: Pick<Opportunity, 'projectId' | 'postedAt'>): PayTerms {
  const t = projectOf(o);
  const days = datesOf(o);
  const rate = RATES[t.pay];
  const amount = rateOn(rate, days[0]!.from);
  const deferred = rate.deferred === true || amount === undefined;
  const weeks = t.schedule.kind === 'run' ? t.schedule.rehearsalWeeks + t.schedule.performanceWeeks : Math.ceil(days.length / 5);
  return { rate, per: rate.per, units: rate.per === 'day' ? days.length : weeks, ...(amount !== undefined ? { each: Math.round(amount) } : {}), deferred };
}

/**
 * The pay in a sentence: "It pays $1,283.00 a day for two days, the SAG-AFTRA Day Performer minimum." An offer's own
 * amount, where it's more than the scale (the pay's `negotiatedAmount`, at the offer), is said with the scale it's above.
 */
export function payWords(terms: PayTerms, amount: Money | undefined = terms.each): string {
  if (terms.deferred) return `The pay is deferred: a student film pays its actors only if it earns money later, so nothing is paid for its ${counted(terms.units, terms.per)} of work.`;
  const basis = terms.rate.basis === 'verified' ? `the ${/Minimum$/.test(terms.rate.label) ? terms.rate.label : `${terms.rate.label} minimum`}` : 'an estimate';
  const over = amount !== undefined && terms.each !== undefined && amount > terms.each;
  return `It pays ${formatMoney((amount ?? terms.each)!, 'USD')} a ${terms.per} for ${counted(terms.units, terms.per)}, ${over ? `above ${basis} of ${formatMoney(terms.each!, 'USD')}` : basis}.`;
}

/** The department field a project falls in, by the agent's published list (`content/agents.ts`). */
export function fieldOf(t: ProjectTemplate): AgentField {
  if (t.kind === 'off-broadway') return 'off-broadway';
  if (t.kind === 'lort') return 'regional';
  if (t.kind === 'network-drama') return 'television';
  return 'film';
}

/** Whether an agent's department covers a project's field: Television, Film, Off-Broadway and Regional Theater among his. */
export function inScope(agentId: string, t: ProjectTemplate): boolean {
  const agent = agentById(agentId);
  return !!agent && agencyOf(agent).department.fields.includes(fieldOf(t));
}

/** The role's fit: how well you know its genre, and its techniques against yours, each 0 to 1, and the two together. */
export interface Fit { genre: number; demands: number; fit: number }

/**
 * How well the role suits the actor, from the record: genre knowledge, the better of studied and worked in, against what
 * a brief counts complete (`BRIEF.complete.genre`); and the role's techniques against the actor's, each at most
 * mastered (`MASTERED`), by the role's weights. The two count alike. ASSUMPTION: the game's reading of "fit".
 */
export function fitOf(person: Person, t: ProjectTemplate): Fit {
  // The project's genres, never the player's own loves, which only enjoyment reads: a preference changes what doing a
  // thing gives, never how good somebody is at it (tests/cohesion.test.ts).
  const { genres: projectGenres } = t;
  const known = Math.max(0, ...projectGenres.map((g) => {
    const s = person.engagement?.byGenre[g];
    return Math.max(s?.familiarity ?? 0, s?.practice ?? 0) / 100;
  }));
  const genre = clamp(known / BRIEF.complete.genre, 0, 1);
  const asks = Object.entries(t.role.techniques) as [Skill, number][];
  const total = asks.reduce((a, [, w]) => a + w, 0);
  const demands = total > 0 ? asks.reduce((a, [s, w]) => a + w * clamp((person.craft?.[s] ?? 0) / MASTERED, 0, 1), 0) / total : 1;
  return { genre: r3(genre), demands: r3(demands), fit: r3((genre + demands) / 2) };
}

/** A fit as a phrase. */
export const fitWords = (f: number): string => (f >= 0.75 ? 'a close fit' : f >= 0.5 ? 'a fair fit' : f >= 0.25 ? 'a loose fit' : 'a poor fit');

/**
 * The role's techniques, as a player reads them: "The part asks for On Camera and Comedy, where 90 is mastered. Your On
 * Camera is at 54 and your Comedy at 52." Until 2026-10-21's walk of the built app each skill carried its level in a
 * clause ("On Camera, yours at 92 and Scene Study, yours at 92"), which read as four things, not two.
 */
export function demandsWords(person: Person, t: ProjectTemplate): string {
  const skills = Object.keys(t.role.techniques) as Skill[];
  const yours = skills.map((s, i) => `${i === 0 ? 'Your' : 'your'} ${TECHNIQUE_LABEL[s]} ${i === 0 ? 'is ' : ''}at ${Math.round(person.craft?.[s] ?? 0)}`);
  return `The part asks for ${spokenList(skills.map((s) => TECHNIQUE_LABEL[s]))}, where ${MASTERED} is mastered. ${spokenList(yours)}.`;
}

/** Casting's chance for a band and a fit in a kind of work, for a callback's cut or the final decision (`CASTING`). */
export function chanceOf(band: Band, fit: number, kind: ProjectKind, round: 'callback' | 'final'): number {
  const base = (round === 'callback' ? CASTING.callback : CASTING.final)[band];
  return r3(clamp(base * (CASTING.fitFloor + (1 - CASTING.fitFloor) * clamp(fit, 0, 1)) * CASTING.field[kind], CASTING.least, CASTING.most));
}

/** A chance as a player reads it, an estimate: "about 1 in 4". */
export function chanceWords(chance: number): string {
  if (chance >= 0.45) return `about ${Math.round(chance * 10)} in 10`;
  const n = Math.max(2, Math.round(1 / Math.max(chance, 0.01)));
  return `about 1 in ${n}`;
}

// ---------------------------------------------------------------------------------------------------------------------
// The decisions the game draws (`src/engine/decided.ts`)
// ---------------------------------------------------------------------------------------------------------------------

/** The Monday-at-nine postings in a stretch of the clock, after `from` and up to `to`. */
export function postingTimes(from: Instant, to: Instant): Instant[] {
  const out: Instant[] = [];
  let b = dayAt(from, WORK.postHour, NY);
  b = addDays(b, -((weekdayOf(b) + 6) % 7), NY);
  while (b <= from) b = addDays(b, 7, NY);
  for (; b <= to; b = addDays(b, 7, NY)) out.push(b);
  return out;
}

/**
 * How a project reaches the actor in a week, if it can: through the agent where one represents them, his department
 * covers it and its office takes agents' submissions; posted openly where it takes actors' own; or not at all, where
 * its office casts through agents only and nobody represents them.
 */
export function reachOf(t: ProjectTemplate, agreement: Agreement | undefined): 'agent' | 'open' | undefined {
  if (agreement && t.access.agent && inScope(agreement.agentId, t)) return 'agent';
  return t.access.open ? 'open' : undefined;
}

/**
 * What a week's postings bring the actor (the decider `pro.posting`): each project drawn at its chance, its own draw
 * by the week and the way it comes, and none posted again within `POSTING.againDays` of its last. Reads the
 * representation in force that Monday and the postings the record holds; draws nothing else.
 */
export function postingsAt(sim: Simulation, person: Person, at: Instant): { project: ProjectTemplate; via: 'agent' | 'open' }[] {
  const agreement = activeAgreement(person, at);
  const week = dateKey(at, NY);
  const out: { project: ProjectTemplate; via: 'agent' | 'open' }[] = [];
  for (const t of PROJECTS) {
    const via = reachOf(t, agreement);
    if (!via) continue;
    if (person.pro?.opportunities.some((o) => o.projectId === t.id && o.postedAt < at && at - o.postedAt < POSTING.againDays * MS_DAY)) continue;
    const chance = via === 'agent' ? POSTING.agent : POSTING.open[t.kind] ?? 0;
    if (sim.rng('pro.posting', week, t.id, via).next() < chance) out.push({ project: t, via });
  }
  return out;
}

/**
 * Casting's decision on a round (the decider `pro.casting`): the chance the band, the fit and the field give, and a draw
 * for the field of other actors, keyed by the opportunity and the round so a reload decides the same.
 */
export function castingDraw(sim: Simulation, o: Pick<Opportunity, 'id' | 'projectId'>, round: 'callback' | 'final', band: Band, fit: number): { chance: number; yes: boolean } {
  const chance = chanceOf(band, fit, projectOf(o).kind, round);
  return { chance, yes: sim.rng('pro.casting', o.id, round).next() < chance };
}

// ---------------------------------------------------------------------------------------------------------------------
// The School's rule, and being away
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Whether a moment is in term for a student, by the School's calendar: from a term's first day to the end of its
 * classes, and in the spring on to the summer recess, the work period after classes being term time (yale.md §1,
 * B27 p.150). The summer and the winter break between a fall's classes and the spring term aren't. ASSUMPTION: the
 * game's reading of "while school is in session"; a leave of absence doesn't take a student out of it.
 */
export function inSessionAt(person: Person, when: Instant): boolean {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return false;
  const p = zonedParts(when, NY);
  const day = { year: p.year, month: p.month, day: p.day };
  const term = termOf(day);
  const start = termStart(term);
  if (keyOf(day) < keyOf(start.date)) return false;
  return keyOf(day) <= keyOf(start.fall ? classPeriod(term).to : recessStart(term));
}

/** Whether any of the work falls in term. */
export const inSessionAny = (person: Person, days: readonly { from: Instant }[]): boolean => days.some((d) => inSessionAt(person, d.from));

/**
 * The School's own calls (a production's, the Cabaret's, a shift, the showcase's) pending on the work's days, with the
 * trip each way: a kind of the School's, or any the School files under its category. The day's classes name no person,
 * so they're never among them (the class days count them; a guard that kept them out by kind was mutation-tested away on
 * 2026-10-21 as settled by that). Until 2026-10-21 it read the School's kinds alone, which would have missed a showcase
 * call kept outside them.
 */
export function schoolCallsOn(sim: Simulation, person: Person, days: readonly { from: Instant; to: Instant }[], cityId: string): ScheduledItem[] {
  const away = tripMinutes(person.currentLocationId, cityId) * MIN;
  return sim.universe.scheduled.filter((i) => i.status === 'pending' && i.requiresPlayer && (i.kind.startsWith('school.') || i.category === 'school') && i.payload.personId === person.id
    && days.some((d) => i.at < d.to + away && i.at + (i.durationMinutes ?? 0) * MIN > d.from - away));
}

/** The class days the work takes: a day of the timetable with a course in it, inside the work's hours and the trip. */
export function classDaysIn(person: Person, days: readonly WorkDay[], cityId: string): number {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return 0;
  const away = tripMinutes(person.currentLocationId, cityId) * MIN;
  return days.filter((d) => {
    const p = zonedParts(d.from, NY);
    if (!coursesFor(school, { year: p.year, month: p.month, day: p.day }).length) return false;
    const nine = dayAt(d.from, 9), three = dayAt(d.from, 15);
    return d.from - away < three && d.to + away > nine;
  }).length;
}

/**
 * Whether the actor is away at professional work or an audition in person at a moment, and whether the dean approved
 * it: the work day's or the audition's hours, with the trip each way, and not missed. The School reads it for who's
 * present (`present`, `systems/school.ts`), and excuses a class missed for approved work.
 */
export function awayAt(person: Person, when: Instant): { label: string; approved: boolean } | undefined {
  const pro = person.pro;
  if (!pro) return undefined;
  for (const e of pro.engagements) {
    const t = projectById(e.projectId);
    if (!t) continue;
    const away = tripMinutes(person.currentLocationId, t.place.cityId) * MIN;
    for (let i = 0; i < e.days.length; i += 1) {
      const d = e.days[i]!;
      if (when < d.from - away || when > d.to + away) continue;
      const log = e.log?.find((l) => l.day === i);
      if (log?.status === 'missed' || (!log && e.status === 'canceled')) continue;
      return { label: d.label, approved: e.school === 'approved' };
    }
  }
  for (const o of pro.opportunities) {
    const t = projectById(o.projectId);
    if (!t) continue;
    for (const r of o.rounds ?? []) {
      if (r.form !== 'in-person' || r.status === 'missed' || (r.status === 'set' && o.status !== 'audition' && o.status !== 'callback')) continue;
      const away = tripMinutes(person.currentLocationId, t.place.cityId) * MIN;
      if (when >= r.at - away && when <= r.at + (WORK.auditionMinutes * MIN) + away) return { label: `${r.round === 'callback' ? 'Callback' : 'Audition'}: ${t.role.part}`, approved: false };
    }
  }
  return undefined;
}

/** The request to the School for an opportunity, if one was made. */
export const requestFor = (person: Person, o: Pick<Opportunity, 'id'>): OutsideWorkRequest | undefined => person.pro?.outsideWork?.find((r) => r.opportunityId === o.id);

/** One of the School's conditions for outside work in term, and whether it holds now. */
export interface SchoolCondition { id: 'standing' | 'timely' | 'short' | 'meaningful' | 'calls' | 'classes'; holds: boolean; words: string }

/** When the dean decides a request: seven days after it's made, at ten. */
export const decidesAt = (req: Pick<OutsideWorkRequest, 'at'>): Instant => dayAt(addDays(req.at, OUTSIDE_WORK.decisionDays, NY), OUTSIDE_WORK.decisionHour);

/**
 * The School's conditions for an opportunity's work in term, as the dean would weigh them at a moment (the header's
 * Bulletin quotations, and `OUTSIDE_WORK`'s ASSUMPTIONS): good standing, asked in time, short, professionally
 * meaningful, no School or Yale Rep call taken, and no more than two class days. `askedAt` is when it was or would be
 * asked.
 */
export function conditionsFor(sim: Simulation, person: Person, o: Opportunity, askedAt: Instant): SchoolCondition[] {
  const t = projectOf(o);
  const days = datesOf(o);
  const first = days[0]!.from;
  const ahead = Math.floor((first - askedAt) / MS_DAY);
  const calls = schoolCallsOn(sim, person, days, t.place.cityId).filter((i) => i.kind === CALL_KIND);
  const classes = classDaysIn(person, days, t.place.cityId);
  const standing = person.school?.standing;
  return [
    { id: 'standing', holds: standing === 'good', words: standing === 'good' ? 'You’re in good standing, as a request needs.' : 'Only a student in good standing may ask, and you aren’t in good standing now.' },
    { id: 'timely', holds: ahead >= OUTSIDE_WORK.aheadDays, words: `Asked ${counted(Math.max(0, ahead), 'day')} before the first day, ${ahead >= OUTSIDE_WORK.aheadDays ? 'in good time' : 'too late'}: the game takes ${OUTSIDE_WORK.aheadDays} days or more as asking in good time.` },
    { id: 'short', holds: days.length <= OUTSIDE_WORK.mostDays, words: `${cap(counted(days.length, 'working day'))}, ${days.length <= OUTSIDE_WORK.mostDays ? 'short enough' : 'too many'}: the game takes ${OUTSIDE_WORK.mostDays} or fewer as short-term.` },
    { id: 'meaningful', holds: t.kind !== 'student-film', words: t.kind !== 'student-film' ? `It’s professional work under ${t.union === 'none' ? 'a paid contract' : `${/^[AEIOU]/.test(t.contract) ? 'an' : 'a'} ${t.contract} contract`}.` : 'In the game’s reading of the rule, a student film isn’t the professional work it makes room for.' },
    { id: 'calls', holds: calls.length === 0, words: calls.length ? `It takes ${calls[0]!.label} on ${formatDate(calls[0]!.at, NY)}, and the School’s and Yale Rep’s calls come first.` : 'It takes no call of a School or Yale Rep production.' },
    { id: 'classes', holds: classes <= OUTSIDE_WORK.mostClassDays, words: `It takes ${counted(classes, 'class day')}, ${classes <= OUTSIDE_WORK.mostClassDays ? 'within' : 'more than'} the ${countWords(OUTSIDE_WORK.mostClassDays)} the game allows.` },
  ];
}

// ---------------------------------------------------------------------------------------------------------------------
// What stands in the way: each refusal said in the player's words, before it's pressed and when it is
// ---------------------------------------------------------------------------------------------------------------------

/** An opportunity of the player's, by its id. */
export const opportunityOf = (person: Person, id: unknown): Opportunity | undefined => person.pro?.opportunities.find((o) => o.id === id);
/** An engagement of the player's, by its id. */
export const engagementOf = (person: Person, id: unknown): Engagement | undefined => person.pro?.engagements.find((e) => e.id === id);

const live = (e: Engagement) => e.status !== 'finished' && e.status !== 'canceled';

/** Another booking on the same days: a live engagement with a day inside the work's span. */
export function bookedClash(person: Person, days: readonly { from: Instant; to: Instant }[], except?: string): { label: string; from: Instant } | undefined {
  for (const e of person.pro?.engagements ?? []) {
    if (!live(e) || e.opportunityId === except) continue;
    for (const x of e.days) if (days.some((d) => x.from < d.to && x.to > d.from)) return { label: x.label, from: x.from };
  }
  return undefined;
}

/** What keeps the actor from the role, each in a sentence: the union an open call is for, the ages, a technique, another booking. */
export function eligibilityProblems(person: Person, o: Opportunity, at: Instant): string[] {
  const t = projectOf(o);
  const out: string[] = [];
  if (o.via === 'open' && t.access.open === 'equity-members' && !person.pro?.equity) out.push('It’s an open call for Equity members, and you aren’t one yet. The degree makes you a member, and so does a contract with an Equity company.');
  const age = ageOn(person.birthInstant, at, NY);
  const [lo, hi] = t.requirements.ages;
  if (age + CASTING.playingSpread < lo || age - CASTING.playingSpread > hi) out.push(`Casting wants actors who play ${lo} to ${hi}, and at ${age} you’re outside that.`);
  for (const [s, level] of Object.entries(t.requirements.skills ?? {}) as [Skill, number][]) {
    if ((person.craft?.[s] ?? 0) < level) out.push(`The part needs ${TECHNIQUE_LABEL[s].toLowerCase()} at ${level}, and yours is at ${Math.round(person.craft?.[s] ?? 0)}.`);
  }
  const clash = bookedClash(person, datesOf(o), o.id);
  if (clash) out.push(`You’re booked for ${clash.label} on ${formatDate(clash.from, NY)}, one of the same days.`);
  return out;
}

/**
 * The materials a submission for the project sends, and what's wrong with them (`materialsCheck`, the stage's or the
 * screen's), with whether each stops the submission: what the core counts as blocking, and a missing reel where the
 * casting office asks for one with every submission.
 */
export function materialProblems(person: Person, t: ProjectTemplate, at: Instant): (MaterialProblem & { stops: boolean })[] {
  return materialsCheck(person, t.medium === 'stage' ? 'stage' : 'screen', at).map((p) => {
    const asked = p.kind === 'reel' && p.problem === 'missing' && t.requirements.sends.includes('reel');
    const pieces = asked ? reelSources(person, at).filter((x) => x.usable).length : 0;
    return { ...p, stops: p.blocking || asked, ...(asked ? { words: `${castingAs(t)} ${agrees(t, 'asks', 'ask')} for a reel with every submission, and you have none. ${pieces ? `You have ${counted(pieces, 'recorded piece')} to cut one from: press Cut A Reel on the Career screen’s Portfolio tab.` : 'You have nothing recorded to cut one from yet: tape a practice brief on the Player Profile first.'}` } : {}) };
  });
}

/** Why the player can't submit themselves for an opportunity now, or nothing. */
export function submitRefusal(sim: Simulation, person: Person, o: Opportunity | undefined): string | undefined {
  if (!o) return 'There’s no such casting notice.';
  const t = projectOf(o);
  if (o.status !== 'open') return o.status === 'lapsed' && !o.rounds?.length ? `Submissions closed on ${formatDate(o.submitBy, NY)}.` : 'You’ve already been submitted for it.';
  if (o.via === 'agent') return `${agentById(o.agentId ?? '')?.name ?? 'Your agent'} submits you for this one: ${t.casting} ${agrees(t, 'takes', 'take')} submissions only from agents.`;
  if (!t.access.open) return `${castingAs(t)} ${agrees(t, 'takes', 'take')} submissions only from agents, so you can’t submit yourself.`;
  if (sim.now >= o.submitBy) return `Submissions closed on ${formatDate(o.submitBy, NY)}.`;
  const no = eligibilityProblems(person, o, sim.now)[0];
  if (no) return no;
  const stops = materialProblems(person, t, sim.now).find((p) => p.stops);
  return stops?.words;
}

/** What's being prepared: the sides for an audition still to come, or the part for booked work. */
export type PrepTarget = { opportunity: Opportunity } | { engagement: Engagement };
const prepOfTarget = (x: PrepTarget): PartPrep => ('opportunity' in x ? x.opportunity.prep : x.engagement.prep) ?? ZERO;
const idOfTarget = (x: PrepTarget): string => ('opportunity' in x ? x.opportunity.id : x.engagement.id);

/** A step's time on the sides or the part (`BRIEF.steps`), the part's twice the sides'. */
export const prepMinutes = (x: PrepTarget, step: BriefStep): number => BRIEF.steps[step].minutes * ('engagement' in x ? WORK.partTimes : 1);

/** The round still to come, if any: the last one set. */
export const roundToCome = (o: Opportunity): AuditionRound | undefined => [...(o.rounds ?? [])].reverse().find((r) => r.status === 'set');

/** Why a step of preparation can't be done now, or nothing. */
export function prepareRefusal(sim: Simulation, person: Person, x: PrepTarget | undefined, step: string): string | undefined {
  if (!x) return 'There’s nothing to prepare for that.';
  if ('opportunity' in x && (!roundToCome(x.opportunity) || (x.opportunity.status !== 'audition' && x.opportunity.status !== 'callback'))) return 'There are no sides yet: casting sends them with an audition.';
  if ('engagement' in x && !live(x.engagement)) return 'That work is over.';
  const s = BRIEF.steps[step as BriefStep];
  if (!s) return 'That isn’t a step of preparation.';
  const prep = prepOfTarget(x);
  if (prep[s.part] >= 0.97) return 'You’ve done all this step can do.';
  if (step === 'rehearse' && prep.memorization < BRIEF.rehearseNeeds) return 'Learn some of the lines first: there’s nothing to rehearse without them.';
  if (person.awakeSince !== undefined && person.awakeSince > sim.now) return 'You’re asleep.';
  if (s.feet) {
    if (person.wellbeing.energy < SPENT) return 'You’re too tired to work on your feet. Sleep first.';
    const hurt = trainingRefusal(person, sim.now);
    if (hurt) return hurt;
  }
  return startRefusal(sim, person, prepMinutes(x, step as BriefStep), true);
}

/** Why the self-tape can't be taped now, or nothing. */
export function tapeRefusal(sim: Simulation, person: Person, o: Opportunity | undefined): string | undefined {
  const r = o && roundToCome(o);
  if (!o || !r || r.form !== 'self-tape' || (o.status !== 'audition' && o.status !== 'callback')) return 'There’s no self-tape asked for.';
  if (sim.now >= r.at) return `It was due on ${formatDate(r.at, NY)} at ${formatTime(r.at, NY)}.`;
  if (r.at - sim.now < SELF_TAPE.minutes * MIN) return `It’s due at ${formatTime(r.at, NY)}, and there’s less than the hour a self-tape takes before then.`;
  if (!person.craft) return 'Your training hasn’t begun: there’s no craft to tape yet.';
  if (person.awakeSince !== undefined && person.awakeSince > sim.now) return 'You’re asleep.';
  return startRefusal(sim, person, SELF_TAPE.minutes, true);
}

/** The other times the casting office has, in the next three weekdays after the one it gave: those clear of your commitments, first. */
export function otherTime(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound): Instant | undefined {
  const t = projectOf(o);
  const away = tripMinutes(person.currentLocationId, t.place.cityId);
  const ownItem = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === AUDITION_KIND && i.payload.opportunityId === o.id);
  let day = r.at;
  for (let n = 0; n < WORK.moveDays;) {
    day = addDays(day, 1, NY);
    if (weekdayOf(day) === 0 || weekdayOf(day) === 6) continue;
    n += 1;
    for (const hour of WORK.moveSlots) {
      const at = dayAt(day, hour);
      if (at - sim.now < WORK.moveAheadHours * MS_HOUR) continue;
      if (!clashesAt(sim, person, at - away * MIN, WORK.auditionMinutes + 2 * away, ownItem?.id).length) return at;
    }
  }
  return undefined;
}

/** What on the calendar falls inside a stretch: what wants the player there, and a class day's classes not yet on it. */
export function clashesAt(sim: Simulation, person: Person, from: Instant, minutes: number, ignore?: string): string[] {
  const to = from + minutes * MIN;
  const out = sim.timeline.conflicts(from, minutes, ignore).filter((i) => i.payload.personId === undefined || i.payload.personId === person.id)
    .map((i) => `${i.label} at ${formatTime(i.at, NY)}`);
  const school = person.school;
  if (school && !schoolEnded(school.standing)) {
    const p = zonedParts(from, NY);
    const nine = dayAt(from, 9), three = dayAt(from, 15);
    const planned = out.some((x) => x.startsWith('Classes'));
    if (!planned && coursesFor(school, { year: p.year, month: p.month, day: p.day }).length && from < three && to > nine) out.push('your classes, from 9:00 AM');
  }
  return out;
}

/** Why the audition can't be moved now, or nothing. */
export function moveRefusal(sim: Simulation, person: Person, o: Opportunity | undefined): string | undefined {
  const r = o && roundToCome(o);
  if (!o || !r || r.form !== 'in-person') return 'There’s no audition in person to move.';
  if ((r.moved ?? 0) >= WORK.movesAllowed) return 'You’ve already asked once, and casting is keeping the time it gave.';
  if (r.at - sim.now < WORK.moveAheadHours * MS_HOUR) return 'It’s less than a day away, and casting needs a day’s notice to move it.';
  if (!otherTime(sim, person, o, r)) return 'Casting has no other time clear of your calendar in the days it’s seeing actors.';
  return undefined;
}

/** Why an offer can't be accepted now, or nothing: lapsed, permission to work on any of its days, another booking, a School hold. */
export function acceptRefusal(sim: Simulation, person: Person, o: Opportunity | undefined): string | undefined {
  if (!o || o.status !== 'offered' || !o.offer) return 'There’s no offer to accept.';
  if (sim.now >= o.offer.until) return `The offer lapsed on ${formatDate(o.offer.until, NY)}.`;
  const days = datesOf(o);
  // Permission to work for every one of its days (`usWorkAuthorized`, brief 19's D8): read, never worked out here.
  const bad = days.find((d) => !usWorkAuthorized(person, d.from));
  if (bad) return `${eligibilityOf(person, bad.from).words} That rules out work on ${formatDate(bad.from, NY)}.`;
  // And SAG-AFTRA's membership from the 30th day after a first job of its (the pay's `sagWorkRefusal`, wired at the merge,
  // 2026-10-21). The pay's `workEligibilityRefusal` was wired here too and came out the same day: it refuses where a date
  // fails `usWorkAuthorized`, the check just above, so it never refused (its mutation survived); what it reads is kept
  // on the engagement by `schedulePay`.
  if (projectOf(o).union === 'sag-aftra') {
    const sag = sagWorkRefusal(person, days, NY);
    if (sag) return sag;
  }
  const clash = bookedClash(person, days, o.id);
  if (clash) return `You’re booked for ${clash.label} on ${formatDate(clash.from, NY)}, so you can’t take this as well.`;
  // Out of term the work is yours, unless the School holds you for one of its calls on those days.
  if (!inSessionAny(person, days)) {
    const held = schoolCallsOn(sim, person, days, projectOf(o).place.cityId)[0];
    if (held) return `The School holds you for ${held.label} on ${formatDate(held.at, NY)}, so you can’t take work then.`;
  }
  return undefined;
}

/** What accepting would bring with the School, said before it's pressed: work in term without approval, and the class days. */
export function acceptWarning(sim: Simulation, person: Person, o: Opportunity): string | undefined {
  const days = datesOf(o);
  if (!inSessionAny(person, days)) return undefined;
  const req = requestFor(person, o);
  if (req?.status === 'approved') return 'The dean approved this work in term, so its class days are excused.';
  const t = projectOf(o);
  const classes = classDaysIn(person, days, t.place.cityId);
  // Any call of the School's the work takes, a showcase's as much as a production's (the dean's condition reads the
  // production calls alone, as the Bulletin ranks them).
  const call = schoolCallsOn(sim, person, days, t.place.cityId)[0];
  const misses = [classes ? counted(classes, 'class day') : '', call ? `${call.label} on ${formatDate(call.at, NY)}` : ''].filter(Boolean);
  const asked = req?.status === 'pending' ? ` Your request is with the dean, who decides on ${formatDate(decidesAt(req), NY)}.` : req?.status === 'refused' ? ' The dean refused your request.' : '';
  return `This work falls in term, and the School hasn’t approved it.${asked}${misses.length ? ` You’d miss ${spokenList(misses)}.` : ''} Working in term without approval brings an academic warning the first time and dismissal the second, as the game reads the Bulletin’s “may lead to academic warning or dismissal”.`;
}

/** Why the player can't ask the School to approve the work, or nothing. */
export function requestRefusal(sim: Simulation, person: Person, o: Opportunity | undefined): string | undefined {
  if (!o) return 'There’s no such casting notice.';
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return 'The School’s rule on outside work is for its students.';
  if (!['open', 'submitted', 'audition', 'callback', 'offered'].includes(o.status)) return 'It’s settled, so there’s nothing to ask the School for.';
  const days = datesOf(o);
  if (!inSessionAny(person, days)) return 'None of its days fall in term, so the School’s approval isn’t needed.';
  const req = requestFor(person, o);
  if (req) return req.status === 'pending' ? `You’ve asked already. The dean decides on ${formatDate(decidesAt(req), NY)}.` : `The dean has already decided: ${req.status === 'approved' ? 'approved' : 'refused'}.`;
  if (school.standing !== 'good') return 'Only a student in good standing may ask for outside work, as the Bulletin says, and you aren’t in good standing now.';
  // An F-1 student: no off-campus work while studying (`usWorkAuthorized`), and none the School can authorize (yale.md §6).
  if (f1Of(person) && days.some((d) => !usWorkAuthorized(person, d.from))) return 'Your F-1 doesn’t let you work for an employer outside the School while you’re a student, and the School can’t authorize it: Yale’s office for international students arranges training off campus only where every student in the program must do it, and Acting has no such training.';
  return startRefusal(sim, person, OUTSIDE_WORK.minutes);
}

// ---------------------------------------------------------------------------------------------------------------------
// The record: the history, the agent's words, and the notices
// ---------------------------------------------------------------------------------------------------------------------

/** The agent an opportunity came through, where one did. */
const agentFor = (o: Pick<Opportunity, 'agentId'>) => (o.agentId ? agentById(o.agentId) : undefined);

/** The agent's words as a message carries them: the line, and the short note that they're invented. */
function asAgent(o: Pick<Opportunity, 'agentId'>, words: string): string {
  const agent = agentFor(o);
  return agent ? `${words} ${agent.fictional}` : words;
}

/** An event in the opportunity's history, and in the agent's where it came through him (the relationship's record, G5). */
function note(sim: Simulation, person: Person, o: Opportunity, e: { kind: ProEventKind; words: string; key: string }): void {
  noteEvent(sim, o, e);
  const rel = o.agentId ? person.pro?.relations[o.agentId] : undefined;
  if (rel) noteEvent(sim, rel, { ...e, key: `opp:${o.id}:${e.key}`, ref: o.id });
}

function tell(sim: Simulation, person: Person, title: string, body: string, importance = 70): void {
  if (person.id !== sim.universe.playerId) return;
  sim.notify({ category: 'career', title, body, importance, route: '/workspace/career' });
}

/** The role as a sentence names it: "Nell in A House On Calder Street, a fictional Off-Broadway play". */
export const roleWords = (t: ProjectTemplate): string => `${t.role.part} in ${t.project}, a fictional ${KIND_WORDS[t.kind]}`;

/** The casting office as a sentence's subject: capitalized to start one ("The producers"), and its verb agreeing with it. */
export const castingAs = (t: ProjectTemplate): string => t.casting.charAt(0).toUpperCase() + t.casting.slice(1);
const agrees = (t: ProjectTemplate, one: string, many: string): string => (/^the producers\b/i.test(t.casting) ? many : one);

// ---------------------------------------------------------------------------------------------------------------------
// The loop's steps
// ---------------------------------------------------------------------------------------------------------------------

/** A role posted to the actor at a Monday's posting: openly, or through the agent under the agreement in force. */
function post(sim: Simulation, person: Person, t: ProjectTemplate, at: Instant, via: 'agent' | 'open'): Opportunity | undefined {
  const pro = ensurePro(sim, person);
  if (pro.opportunities.some((o) => o.projectId === t.id && o.postedAt === at)) return undefined;
  const agreement = via === 'agent' ? activeAgreement(person, at) : undefined;
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId: t.id, via, status: 'open', postedAt: at, submitBy: addDays(at, WORK.submitDays, NY), history: [], counts: {},
    ...(agreement ? { agentId: agreement.agentId, agreementId: agreement.id } : {}),
  };
  pro.opportunities.push(o);
  const agent = agentFor(o);
  note(sim, person, o, { kind: 'opportunity', key: 'posted', words: agent ? `${castingAs(t)}’s breakdown for ${t.role.part} in ${t.project} came to ${agent.name}.` : `${castingAs(t)} posted ${t.role.part} in ${t.project}.` });
  return o;
}

/** A submission made, by the player or the agent: what it sent noted, and the casting office's answer on the clock. */
function submit(sim: Simulation, person: Person, o: Opportunity): void {
  const t = projectOf(o);
  const kinds = (['headshot', 'resume', 'reel'] as const).filter((k) => t.requirements.sends.includes(k) || (k === 'reel' && t.medium !== 'stage'));
  o.sent = kinds.map((k) => currentOf(person.pro, k)).filter((m) => m !== undefined).map((m) => ({ kind: m.kind, id: m.id, made: m.made }));
  o.status = 'submitted';
  const sent = o.sent.map((m) => `your ${m.kind === 'headshot' ? 'headshots' : m.kind === 'resume' ? 'résumé' : 'reel'} from ${formatDate(m.made, NY)}`);
  const agent = agentFor(o);
  const words = `${agent ? `${agent.name} submitted you` : 'You submitted yourself'} for ${t.role.part} in ${t.project}, sending ${spokenList(sent)}.`;
  note(sim, person, o, { kind: 'submitted', key: 'submitted', words });
  if (agent) tell(sim, person, `Submitted For ${t.role.part}`, asAgent(o, `${words} ${castingAs(t)} ${agrees(t, 'answers', 'answer')} on ${formatWeekdayDate(dayAt(addDays(sim.now, WORK.replyDays, NY), WORK.replyHour), NY)}.`), 60);
  sim.schedule({
    at: dayAt(addDays(sim.now, WORK.replyDays, NY), WORK.replyHour), kind: REPLY_KIND, label: `Casting Answers: ${t.role.part}`, category: 'career', priority: 40,
    refType: 'pro.opportunity', refId: o.id, payload: { personId: person.id, opportunityId: o.id },
  });
}

/** The agent's try at a submission his breakdown brought: made where the role suits and the materials pass, the reason noted once where not. */
function agentTries(sim: Simulation, person: Person, o: Opportunity): void {
  const t = projectOf(o);
  const agent = agentFor(o)!;
  const agreement = activeAgreement(person, sim.now);
  if (!agreement || agreement.id !== o.agreementId) {
    settle(sim, person, o, 'withdrawn', `Your representation ended before ${agent.name} submitted you, so no submission was made.`);
    return;
  }
  const no = [...eligibilityProblems(person, o, sim.now), ...materialProblems(person, t, sim.now).filter((p) => p.stops).map((p) => p.words)];
  if (!no.length) { submit(sim, person, o); return; }
  // Said when something new stands in the way, with all of it: a problem put right since leaves nothing new to say.
  if (no.every((x) => o.history.some((h) => h.kind === 'problem' && h.words.includes(x)))) return;
  const words = `${agent.name} didn’t submit you for ${t.role.part} in ${t.project}. ${no.join(' ')}`;
  note(sim, person, o, { kind: 'problem', key: `held:${o.counts.problem ?? 0}`, words });
  tell(sim, person, `Not Submitted For ${t.role.part}`, asAgent(o, `${words} ${agent.name} can still submit you until ${formatDate(o.submitBy, NY)}, once that’s put right.`), 70);
}

/** An opportunity settled: its status, when, the outcome in words, and the record kept to its bounds. */
function settle(sim: Simulation, person: Person, o: Opportunity, status: Opportunity['status'], outcome: string): void {
  o.status = status;
  o.resolvedAt = sim.now;
  o.outcome = outcome;
  sim.resolveDecision('pro.offer', o.id, 'career');
  keepBounded(ensurePro(sim, person));
}

/**
 * A round set: an audition in person on the calendar, the first weekday from four days on at eleven (a callback at
 * two), with the trip; or a self-tape due by an evening. A clash with the calendar is said with the way to move it.
 */
function setRound(sim: Simulation, person: Person, o: Opportunity, which: 'audition' | 'callback'): AuditionRound {
  const t = projectOf(o);
  const form = t.stages.audition;
  const at = form === 'in-person'
    ? weekdayFrom(addDays(sim.now, which === 'audition' ? WORK.auditionLeadDays : WORK.callbackLeadDays, NY), which === 'audition' ? WORK.auditionHour : WORK.callbackHour)
    : dayAt(addDays(sim.now, which === 'audition' ? WORK.tapeDays : WORK.callbackTapeDays, NY), WORK.tapeHour);
  const r: AuditionRound = { round: which, form, at, status: 'set' };
  const rounds = (o.rounds ??= []);
  rounds.push(r);
  const idx = rounds.length - 1;
  o.status = which;
  if (which === 'audition') o.auditionAt = at; else o.callbackAt = at;
  const trip = tripMinutes(person.currentLocationId, t.place.cityId);
  const name = which === 'callback' ? 'Callback' : 'Audition';
  let itemId: string | undefined;
  if (form === 'in-person') {
    itemId = sim.schedule({
      at, kind: AUDITION_KIND, label: `${name}: ${t.role.part}, ${t.project}`, category: 'career', priority: 40, requiresPlayer: true,
      durationMinutes: WORK.auditionMinutes, travelMinutes: trip, locationId: t.place.cityId, refType: 'pro.opportunity', refId: o.id,
      payload: { personId: person.id, opportunityId: o.id, round: idx },
    }).id;
  } else {
    sim.schedule({ at, kind: TAPE_DUE_KIND, label: `Self-Tape Due: ${t.role.part}, ${t.project}`, category: 'career', priority: 40, refType: 'pro.opportunity', refId: o.id, payload: { personId: person.id, opportunityId: o.id, round: idx } });
  }
  const when = `${formatWeekdayDate(at, NY)} at ${formatTime(at, NY)}`;
  const clash = form === 'in-person' ? clashesAt(sim, person, at - trip * MIN, WORK.auditionMinutes + 2 * trip, itemId) : [];
  const words = form === 'in-person'
    ? `${castingAs(t)} ${agrees(t, 'wants', 'want')} to see you${which === 'callback' ? ' again' : ''} for ${t.role.part} in ${t.project}: ${t.place.venue} in ${t.place.city}, ${when}. Getting there takes about ${hoursWords(trip)} each way.`
    : `${castingAs(t)} ${agrees(t, 'asks', 'ask')} for a self-tape${which === 'callback' ? ' for the callback' : ''} for ${t.role.part} in ${t.project}, due ${when}.`;
  note(sim, person, o, { kind: which, key: `${which}:set`, words });
  const next = form === 'in-person' ? 'Prepare the sides on the Career screen’s Opportunities tab before you go.' : 'Prepare the sides, then press Tape It on the Career screen’s Opportunities tab.';
  const clashWords = clash.length ? ` It clashes with ${spokenList(clash)}. To ask for another time, press Ask For Another Time on the Opportunities tab, at least a day ahead. Casting moves it once.` : '';
  const agent = agentFor(o);
  tell(sim, person, which === 'callback' ? `A Callback For ${t.role.part}` : form === 'in-person' ? `An Audition For ${t.role.part}` : `A Self-Tape For ${t.role.part}`, asAgent(o, `${agent ? `${agent.name} passed this on: ` : ''}${words}${clashWords} ${next}`), 80);
  return r;
}

/** Minutes as a player reads them: "2 hours", "30 minutes". */
const hoursWords = (minutes: number): string => (minutes % 60 === 0 ? counted(minutes / 60, 'hour') : minutes > 60 ? `${counted(Math.floor(minutes / 60), 'hour')} and ${counted(minutes % 60, 'minute')}` : counted(minutes, 'minute'));

/** What an audition round asks: the taped brief's judge for a self-tape, an audition's in the room, with the sides' preparation. */
export function auditionContext(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound, idx: number): EvalContext {
  const t = projectOf(o);
  const p = o.prep ?? ZERO;
  const prep: Record<string, number> = { interpretation: p.interpretation, memorization: p.memorization, rehearsal: p.rehearsal };
  const required: Record<string, number> = { interpretation: BRIEF.complete.interpretation, memorization: BRIEF.complete.memorization, rehearsal: BRIEF.complete.rehearsal };
  if (r.form === 'self-tape') { prep.genre = fitOf(person, t).genre * BRIEF.complete.genre; required.genre = BRIEF.complete.genre; }
  return {
    task: r.form === 'self-tape' ? TASK_PROFILES.tape! : TASK_PROFILES.audition!,
    techniques: t.role.techniques, prep, required,
    difficulty: WORK.difficulty[r.round] + (t.role.stakes - 1) * BRIEF.stakes,
    condition: conditionAt(sim, person, sim.now), families: t.role.families, key: `pro:${person.id}:${o.id}:${idx}`,
  };
}

/** A round judged: kept on the work record, the round's band and what held it back, and casting's next step on the clock. */
function finishRound(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound, idx: number, e: Evaluation): void {
  const t = projectOf(o);
  r.status = 'done';
  r.overall = e.overall;
  r.band = bandOfQuality(e.overall);
  const held = chiefLimit(e);
  if (held) r.held = held;
  const name = r.round === 'callback' ? 'Callback' : 'Audition';
  recordWork(sim, person, e, { at: sim.now, what: `${t.role.part}, ${t.project}: ${name}${r.form === 'self-tape' ? ', Taped' : ''}`, band: r.band });
  note(sim, person, o, { kind: r.round, key: `${r.round}:done`, words: `Your ${r.form === 'self-tape' ? 'self-tape' : r.round} for ${t.role.part} was ${BAND_LABEL[r.band]}.` });
  const cut = r.round === 'audition' && t.stages.callback;
  const base = Math.max(sim.now, r.at);
  sim.schedule({
    at: dayAt(addDays(base, cut ? WORK.cutDays : WORK.decisionDays, NY), WORK.decisionHour), kind: CASTING_KIND, label: `Casting Decides: ${t.role.part}`, category: 'career', priority: 40,
    refType: 'pro.opportunity', refId: o.id, payload: { personId: person.id, opportunityId: o.id, round: idx },
  });
}

/** Whether the actor is there at a moment: awake, and not in hospital or laid up (`offSick`, the School's). */
const there = (person: Person, at: Instant): boolean => !(person.awakeSince !== undefined && person.awakeSince > at) && !offSick(person, at);

/** A round missed: the opportunity lapses, said, and the problem noted. */
function missRound(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound): void {
  const t = projectOf(o);
  r.status = 'missed';
  const words = r.form === 'self-tape'
    ? `Your self-tape for ${t.role.part} wasn’t in by ${formatDate(r.at, NY)} at ${formatTime(r.at, NY)}, so ${t.casting} moved on without it.`
    : `You missed the ${r.round} for ${t.role.part} on ${formatDate(r.at, NY)} at ${formatTime(r.at, NY)}, so ${t.casting} moved on without you.`;
  note(sim, person, o, { kind: 'problem', key: `${r.round}:missed`, words });
  settle(sim, person, o, 'lapsed', words);
  tell(sim, person, r.form === 'self-tape' ? `Your Self-Tape For ${t.role.part} Wasn’t In` : `You Missed The ${r.round === 'callback' ? 'Callback' : 'Audition'} For ${t.role.part}`, asAgent(o, words), 75);
}

/** Casting passed: said, with where to see what went into it. */
function pass(sim: Simulation, person: Person, o: Opportunity, why: string): void {
  const t = projectOf(o);
  note(sim, person, o, { kind: 'passed', key: 'passed', words: why });
  settle(sim, person, o, 'passed', why);
  const agent = agentFor(o);
  tell(sim, person, `Not Cast As ${t.role.part}`, asAgent(o, `${agent ? `${agent.name} passed this on: ` : ''}${why} Casting doesn’t give its reasons. The Opportunities tab shows what went into it: your audition, the role’s fit and the field.`), 65);
}

/** An offer made, on the terms the work pays: standing three days, conveyed by the agent where one represents the actor. */
function makeOffer(sim: Simulation, person: Person, o: Opportunity): void {
  const t = projectOf(o);
  const terms = payTermsOf(o);
  const until = dayAt(addDays(sim.now, WORK.offerDays, NY), WORK.offerHour);
  o.offer = { at: sim.now, until, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units };
  o.status = 'offered';
  // He handles the offer where an agreement's in force, the actor's own submission too: covered work is his (the
  // agreement's Exclusive and What The Agent Does, `AGREEMENT_TERMS`).
  const agreement = activeAgreement(person, sim.now);
  if (agreement && !o.agreementId) { o.agentId = agreement.agentId; o.agreementId = agreement.id; }
  // Represented, a SAG-AFTRA offer is scale plus 10%, so his commission comes out of the ten (`negotiatedAmount`,
  // `systems/propay.ts`; wired at the merge, 2026-10-21).
  if (o.offer.amount !== undefined) o.offer.amount = negotiatedAmount(o.offer.amount, t.union, o.agreementId !== undefined);
  const days = datesOf(o);
  const words = `${castingAs(t)} ${agrees(t, 'offers', 'offer')} you ${roleWords(t)}. ${payWords(terms, o.offer.amount)} The work is ${days.length === 1 ? `on ${formatDate(days[0]!.from, NY)}` : `from ${formatDate(days[0]!.from, NY)} to ${formatDate(days[days.length - 1]!.from, NY)}`}, in ${t.place.city}. The offer stands until ${formatDate(until, NY)} at ${formatTime(until, NY)}.`;
  note(sim, person, o, { kind: 'offer', key: 'offer', words });
  sim.schedule({ at: until, kind: OFFER_KIND, label: `The Offer For ${t.role.part} Lapses`, category: 'career', priority: 40, refType: 'pro.offer', refId: o.id, payload: { personId: person.id, opportunityId: o.id } });
  if (person.id !== sim.universe.playerId) return;
  const agent = agentFor(o);
  const warning = acceptWarning(sim, person, o);
  sim.requireDecision({
    urgency: 80, category: 'career', title: `An Offer For ${t.role.part}`, dueAt: until, route: '/workspace/career', refType: 'pro.offer', refId: o.id,
    detail: asAgent(o, `${agent ? `${agent.name} passed on an offer. ` : ''}${words}${warning ? ` ${warning}` : ''}`),
    actions: [
      { label: 'Accept The Offer', commandKind: 'pro.accept_offer', payload: { opportunityId: o.id } },
      { label: 'Decline The Offer', commandKind: 'pro.decline_offer', payload: { opportunityId: o.id } },
    ],
  });
}

/**
 * The promised pay, one entry for each week of work: a run's by its weeks, a shoot's by the calendar week (Sunday to
 * Saturday), each due the Thursday after the week's last day of work, at noon (ASSUMPTION, after SAG-AFTRA's "Payment is
 * due on Thursday… for work performed through the previous Saturday", representation.md S5, for every kind of work).
 * Promised only: nothing's posted and nothing's received here. A student film's is deferred. Each is keyed
 * `<engagement>:<week>`, the week counted from 1 (counted from 0 until 2026-10-21, when the pay's part said it reads
 * from 1), `promisedAt` the moment the offer was accepted, the contract date its commission reads.
 */
export function promisedPay(sim: Simulation, e: Engagement, o: Opportunity): ProPayment[] {
  const offer = o.offer!;
  const t = projectOf(o);
  const groups = payGroups(e, t);
  return groups.map((g, w) => {
    const last = e.days[g[g.length - 1]!]!.from;
    const due = addDays(dayAt(last, 12), (4 - weekdayOf(last) + 7) % 7 || 7, NY);
    const promised = offer.amount === undefined ? 0 : offer.per === 'week' ? offer.amount : offer.amount * g.length;
    // The days it pays for go on it, so the pay reads this week, not the calendar week before its payday (from 2026-10-21).
    const week = { from: e.days[g[0]!]!.from, to: e.days[g[g.length - 1]!]!.to };
    return { id: sim.nextId('pro'), key: `${e.id}:${w + 1}`, promised, currency: 'USD', promisedAt: sim.now, due, week, ...(offer.amount === undefined ? { deferred: true as const } : {}) };
  });
}

/** The days in each paid week, by their indexes: a run's weeks from its first Tuesday; a shoot's calendar weeks. */
export function payGroups(e: Pick<Engagement, 'days'>, t: ProjectTemplate): number[][] {
  const out = new Map<string, number[]>();
  const first = e.days[0]?.from ?? 0;
  e.days.forEach((d, i) => {
    const key = t.schedule.kind === 'run' ? String(Math.floor((dayAt(d.from, 12) - dayAt(first, 12) + MS_HOUR * 2) / (7 * MS_DAY))) : dateKey(addDays(dayAt(d.from, 12), -weekdayOf(d.from), NY), NY);
    (out.get(key) ?? out.set(key, []).get(key)!).push(i);
  });
  return [...out.values()];
}

/** The work days booked on the calendar, each wanting the player, with its trip. */
function bookDays(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate): void {
  const trip = tripMinutes(person.currentLocationId, t.place.cityId);
  e.days.forEach((d, i) => {
    if (d.from <= sim.now) return;
    sim.schedule({
      at: d.from, kind: WORK_DAY_KIND, label: d.label, category: 'career', priority: 38, requiresPlayer: true, durationMinutes: (d.to - d.from) / MIN,
      travelMinutes: trip, locationId: t.place.cityId, refType: 'pro.engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id, day: i, kind: dayKindOf(t, i) },
    });
  });
}

/** What a work day asks: a night on stage's judge for a performance, the camera's for a shoot day, with the part's preparation. */
export function workContext(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, i: number): EvalContext {
  const p = e.prep ?? ZERO;
  const base = { techniques: t.role.techniques, difficulty: (t.role.stakes - 1) * BRIEF.stakes, condition: conditionAt(sim, person, sim.now), families: t.role.families, key: `pro:${person.id}:${e.id}:${i}` };
  // A night reads the part's lines, blocking and the director's notes: here the lines learned, the rehearsal on its feet
  // and the breakdown, against what completes each (`BRIEF.complete`).
  if (dayKindOf(t, i) === 'performance') return { ...base, task: TASK_PROFILES.performance!, prep: { lines: p.memorization, blocking: p.rehearsal, notes: p.interpretation }, required: { lines: BRIEF.complete.memorization, blocking: BRIEF.complete.rehearsal, notes: BRIEF.complete.interpretation } };
  return { ...base, task: TASK_PROFILES.camera!, prep: { interpretation: p.interpretation, memorization: p.memorization, rehearsal: p.rehearsal, genre: fitOf(person, t).genre * BRIEF.complete.genre }, required: { interpretation: BRIEF.complete.interpretation, memorization: BRIEF.complete.memorization, rehearsal: BRIEF.complete.rehearsal, genre: BRIEF.complete.genre } };
}

/** A rehearsal day attended: the lines and the blocking move as a School call's do (`PROCESS.call`), and the breakdown at the lines' rate. */
function rehearse(e: Engagement): void {
  const p = (e.prep ??= { ...ZERO });
  p.memorization = r3(clamp(p.memorization + PROCESS.call.lines * (1 - p.memorization), 0, 1));
  p.rehearsal = r3(clamp(p.rehearsal + PROCESS.call.blocking * (1 - p.rehearsal), 0, 1));
  p.interpretation = r3(clamp(p.interpretation + PROCESS.call.lines * (1 - p.interpretation), 0, 1));
}

/** The best band a booking's work was judged at. */
const bestBand = (e: Engagement): Band | undefined => (['exceptional', 'strong', 'working', 'unready'] as const).find((b) => e.log?.some((l) => l.band === b));

/** The work over: a screen credit as shot and its release on the clock, the stage credit's band brought up to the run's best. */
function finish(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate): void {
  e.status = 'finished';
  e.finishedAt = sim.now;
  const best = bestBand(e);
  if (t.medium !== 'stage' && !e.creditId) {
    const worked = e.log!.find((l) => l.status === 'worked')!;
    const c = addCredit(sim, person, {
      kind: t.kind === 'student-film' ? 'student-film' : 'screen', project: t.project, role: t.role.part, company: t.company,
      year: zonedParts(worked.at, NY).year, medium: t.medium, status: 'shot', ...(t.union !== 'none' ? { union: t.union } : {}), engagementId: e.id, at: worked.at, ...(best ? { band: best } : {}),
    });
    e.creditId = c.id;
    const days = RELEASE_DAYS[t.kind];
    if (days) sim.schedule({ at: dayAt(addDays(sim.now, days, NY), 12), kind: RELEASE_KIND, label: `${t.project} Is Released`, category: 'career', priority: 60, refType: 'pro.credit', refId: c.id, payload: { personId: person.id, creditId: c.id } });
  } else if (e.creditId && best) {
    const c = person.pro?.credits.find((x) => x.id === e.creditId);
    if (c) c.band = best;
  }
  noteEvent(sim, e, { kind: 'worked', key: 'finished', words: `${t.medium === 'stage' ? 'The run' : 'The shoot'} of ${t.project} finished, with ${counted(e.log!.filter((l) => l.status === 'worked').length, 'day')} worked.` });
  const rel = e.agentId ? person.pro?.relations[e.agentId] : undefined;
  if (rel) noteEvent(sim, rel, { kind: 'success', key: `eng:${e.id}:finished`, words: `You finished ${t.role.part} in ${t.project}.`, ref: e.id });
  keepBounded(ensurePro(sim, person));
  tell(sim, person, t.medium === 'stage' ? `${t.project} Closed` : `You Wrapped ${t.project}`, `${t.medium === 'stage' ? `The run of ${t.project} is over` : `${t.project} wrapped`}, and ${t.role.part} is on your professional credits${t.medium === 'stage' ? '' : `, not yet released. Its footage can go on a reel once it comes out${RELEASE_DAYS[t.kind] ? `, about ${counted(Math.round(RELEASE_DAYS[t.kind]! / 30), 'month')} on, estimated` : ''}`}. Update your résumé on the Portfolio tab to add it.`, 70);
}

/** A missed work day: the project's consequence, said. The stage's understudy covers one; a second, or a shoot day, and you're replaced. */
function missDay(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, i: number, at: Instant): void {
  (e.log ??= []).push({ day: i, at, status: 'missed' });
  const misses = e.log.filter((l) => l.status === 'missed').length;
  const allowed = t.medium === 'stage' ? MISSES.stage : MISSES.screen;
  const kind = dayKindOf(t, i);
  const what = kind === 'shoot' ? 'a shoot day' : kind === 'rehearsal' ? 'a rehearsal' : 'a performance';
  noteEvent(sim, e, { kind: 'problem', key: `missed:${i}`, words: `You missed ${what} of ${t.project} on ${formatDate(at, NY)}.` });
  const rel = e.agentId ? person.pro?.relations[e.agentId] : undefined;
  if (rel) noteEvent(sim, rel, { kind: 'problem', key: `eng:${e.id}:missed:${i}`, words: `You missed ${what} of ${t.project}.`, ref: e.id });
  if (misses <= allowed) {
    tell(sim, person, `You Missed ${kind === 'performance' ? 'A Performance' : 'A Rehearsal'} Of ${t.project}`, `You missed ${what} of ${t.project} on ${formatDate(at, NY)}.${kind === 'performance' ? ' Your understudy went on.' : ''} The company manager gave you a written warning: miss another day and the company replaces you.`, 85);
    return;
  }
  replace(sim, person, e, t, what);
}

/** Replaced: the days to come called off, the pay for days never worked taken off what was promised, no credit where nothing was shot. */
function replace(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, what: string): void {
  e.status = 'canceled';
  e.finishedAt = sim.now;
  sim.timeline.cancelFor('pro.engagement', e.id, sim.now);
  const worked = new Set((e.log ?? []).filter((l) => l.status === 'worked').map((l) => l.day));
  const groups = payGroups(e, t);
  // Promised, not received: a week with nothing worked is owed nothing, a day rate's week only its days worked. Pay the
  // pay system holds as received stays as it was. The week is read from the key, not the entry's place in the list.
  e.pay = e.pay.filter((p) => {
    if (p.received) return true;
    const days = groups[Number(p.key.slice(p.key.lastIndexOf(':') + 1)) - 1] ?? [];
    const done = days.filter((d) => worked.has(d)).length;
    if (!done) return false;
    if (t.schedule.kind === 'shoot' && days.length) p.promised = Math.round((p.promised / days.length) * done);
    return true;
  });
  noteEvent(sim, e, { kind: 'problem', key: 'replaced', words: `${t.company} replaced you as ${t.role.part} after you missed ${what}.` });
  keepBounded(ensurePro(sim, person));
  const paid = worked.size ? `The ${counted(worked.size, 'day')} you worked ${worked.size === 1 ? 'is' : 'are'} still paid, and the rest are called off.` : 'You hadn’t worked a day of it, so nothing is owed.';
  tell(sim, person, `Replaced As ${t.role.part}`, `You missed ${what} of ${t.project}, and ${t.company} replaced you as ${t.role.part}. ${paid} ${e.creditId ? 'The part stays on your credits for the nights you played.' : 'There’s no credit for it.'}`, 90);
}

/**
 * Work taken in term without the School's approval, found at its first day: the Bulletin's "academic warning or
 * dismissal", through the School's own standing. The first time a warning, the second dismissal; on warning already,
 * dismissal, as the School steps a grave breach (`breach`, `systems/school.ts`).
 */
function reportUnapproved(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate): void {
  const pro = ensurePro(sim, person);
  e.school = 'reported';
  pro.unapproved = (pro.unapproved ?? 0) + 1;
  const school = person.school!;
  const to = school.standing === 'warning' || pro.unapproved >= 2 ? 'dismissed' : 'warning';
  noteEvent(sim, e, { kind: 'problem', key: 'unapproved', words: `You took ${t.role.part} in ${t.project} in term without the School’s approval.` });
  setStanding(sim, person, to, `You took outside work in term without the School’s approval: ${t.role.part} in ${t.project}. The Bulletin treats it as a conflict of interest, which may lead to academic warning or dismissal.`);
}

/** The unions a first day brings: Equity by an Equity contract (S25), SAG-AFTRA eligibility by a principal role under TV/Theatrical or Low Budget (S20, S22). */
function unionsFrom(sim: Simulation, person: Person, t: ProjectTemplate, at: Instant): void {
  const pro = ensurePro(sim, person);
  if (t.union === 'equity' && !pro.equity) pro.equity = { since: at, how: 'contract' };
  if (t.union === 'sag-aftra' && (t.kind === 'network-drama' || t.kind === 'low-budget') && !pro.sag?.eligibleSince && !pro.sag?.memberSince) pro.sag = { ...(pro.sag ?? {}), eligibleSince: at };
}

// ---------------------------------------------------------------------------------------------------------------------
// The step a player takes on preparation, shared by the sides and the part
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A step on the sides or the part, by a practice brief's own steps and their arithmetic (`BRIEF.steps`, `prepareBrief`
 * in `systems/briefs.ts`): its time on the clock, its part moved by its gain at the hour's focus, halved for each time
 * the same step was done today, by the ability it's practice in and the way you prepare, of what's left.
 */
export function prepareOn(sim: Simulation, person: Person, x: PrepTarget, step: BriefStep): { moved: number; part: keyof PartPrep; minutes: number } {
  const s = BRIEF.steps[step];
  const minutes = prepMinutes(x, step);
  const prep: PartPrep = 'opportunity' in x ? (x.opportunity.prep ??= { ...ZERO }) : (x.engagement.prep ??= { ...ZERO });
  const focus = focusAt(sim, person, sim.now);
  const n = repeatsToday(sim, person, `pro:${idOfTarget(x)}<${step}`);
  sim.advanceTo(sim.now + minutes * MIN);
  exerts(person, s.feet ? BRIEF.met.feet : BRIEF.met.desk, minutes / 60);
  const before = prep[s.part];
  const gain = s.gain * clamp(focus, 0.5, 1.1) * 0.5 ** n;
  const able = s.trains ? stepSpeed(sim, person, s.trains) : 1;
  prep[s.part] = r3(clamp(before + gain * prepLean(person, s.part) * able * (1 - before), 0, 1));
  if (s.trains && prep[s.part] > before) ordinary(sim, person, s.trains, focus, BRIEF.trainingWeight, `pro:${s.part}`);
  return { moved: r3(prep[s.part] - before), part: s.part, minutes };
}

// ---------------------------------------------------------------------------------------------------------------------
// Registration: the postings as the clock passes, the casting office's steps on the clock, and the commands
// ---------------------------------------------------------------------------------------------------------------------

const located = (sim: Simulation, item: ScheduledItem): { person: Person; o: Opportunity } | undefined => {
  const person = sim.universe.people[String(item.payload.personId)];
  const o = person ? opportunityOf(person, item.payload.opportunityId) : undefined;
  return person && o ? { person, o } : undefined;
};

export function registerProJobs(sim: Simulation): void {
  // The week's postings, at each Monday the clock passes; a window passed closes; and the agent tries a submission his
  // breakdown brought, as soon as the role suits and the materials pass.
  sim.onPassage('pro.postings', (s, from) => {
    const person = s.universe.people[s.universe.playerId];
    if (!person) return;
    for (const at of postingTimes(from, s.now)) for (const { project, via } of postingsAt(s, person, at)) post(s, person, project, at, via);
    for (const o of person.pro?.opportunities ?? []) {
      if (o.status !== 'open') continue;
      if (s.now >= o.submitBy) {
        const t = projectOf(o);
        const held = o.via === 'agent' && o.history.some((x) => x.kind === 'problem');
        settle(s, person, o, 'lapsed', `Submissions for ${t.role.part} closed on ${formatDate(o.submitBy, NY)}${o.via === 'agent' ? `, before ${agentFor(o)?.name ?? 'your agent'} could submit you` : ''}.`);
        if (held) tell(s, person, `Submissions Closed For ${t.role.part}`, asAgent(o, `${castingAs(t)} closed submissions for ${t.role.part} on ${formatDate(o.submitBy, NY)}, before ${agentFor(o)!.name} could submit you.`), 50);
      } else if (o.via === 'agent') agentTries(s, person, o);
    }
  });

  sim.onSchedule(REPLY_KIND, (item, s) => {
    const at = located(s, item);
    if (!at || at.o.status !== 'submitted') return;
    setRound(s, at.person, at.o, 'audition');
  });

  sim.onSchedule(AUDITION_KIND, (item, s) => {
    const at = located(s, item);
    const idx = Number(item.payload.round);
    const r = at?.o.rounds?.[idx];
    if (!at || !r || r.status !== 'set' || r.form !== 'in-person' || r.at !== item.at) return;
    if (!there(at.person, item.at)) { missRound(s, at.person, at.o, r); return; }
    finishRound(s, at.person, at.o, r, idx, evaluate(s, at.person, auditionContext(s, at.person, at.o, r, idx)));
  });

  sim.onSchedule(TAPE_DUE_KIND, (item, s) => {
    const at = located(s, item);
    const r = at?.o.rounds?.[Number(item.payload.round)];
    if (at && r && r.status === 'set') missRound(s, at.person, at.o, r);
  });

  sim.onSchedule(CASTING_KIND, (item, s) => {
    const at = located(s, item);
    const r = at?.o.rounds?.[Number(item.payload.round)];
    if (!at || !r || r.status !== 'done' || r.casting || (at.o.status !== 'audition' && at.o.status !== 'callback')) return;
    const { person, o } = at;
    const t = projectOf(o);
    const f = fitOf(person, t);
    const cut = r.round === 'audition' && t.stages.callback;
    // Availability and eligibility are checked, never drawn: booked on its days since, and casting goes elsewhere.
    const clash = cut ? undefined : bookedClash(person, datesOf(o), o.id);
    if (clash) {
      r.casting = { at: s.now, chance: 0, fit: f.fit, yes: false };
      pass(s, person, o, `You’re booked for ${clash.label} on ${formatDate(clash.from, NY)}, so ${t.casting} cast another actor as ${t.role.part}.`);
      return;
    }
    const d = castingDraw(s, o, cut ? 'callback' : 'final', r.band!, f.fit);
    r.casting = { at: s.now, chance: d.chance, fit: f.fit, yes: d.yes };
    if (!d.yes) { pass(s, person, o, cut ? `${castingAs(t)} didn’t call you back for ${t.role.part}.` : `${castingAs(t)} cast another actor as ${t.role.part}.`); return; }
    if (cut) { setRound(s, person, o, 'callback'); return; }
    makeOffer(s, person, o);
  });

  sim.onSchedule(OFFER_KIND, (item, s) => {
    const at = located(s, item);
    if (!at || at.o.status !== 'offered' || !at.o.offer || at.o.offer.until > s.now) return;
    const t = projectOf(at.o);
    const words = `You didn’t answer the offer for ${t.role.part} by ${formatDate(at.o.offer.until, NY)} at ${formatTime(at.o.offer.until, NY)}, so it lapsed.`;
    note(s, at.person, at.o, { kind: 'lapsed', key: 'lapsed', words });
    settle(s, at.person, at.o, 'lapsed', words);
    tell(s, at.person, `The Offer For ${t.role.part} Lapsed`, asAgent(at.o, words), 70);
  });

  sim.onSchedule(WORK_DAY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person && engagementOf(person, item.payload.engagementId);
    const i = Number(item.payload.day);
    if (!person || !e || !live(e) || e.log?.some((l) => l.day === i)) return;
    const t = projectById(e.projectId)!;
    if (!there(person, item.at)) {
      missDay(s, person, e, t, i, item.at);
      // The last day missed, with the work still on: it ends there.
      if (i === e.days.length - 1 && live(e)) finish(s, person, e, t);
      return;
    }
    e.status = 'working';
    if (e.school === 'unapproved' && inSessionAt(person, item.at)) reportUnapproved(s, person, e, t);
    unionsFrom(s, person, t, item.at);
    const kind = dayKindOf(t, i);
    exerts(person, WORK.met, (e.days[i]!.to - e.days[i]!.from) / MS_HOUR);
    if (kind === 'rehearsal') {
      rehearse(e);
      (e.log ??= []).push({ day: i, at: item.at, status: 'worked' });
    } else {
      const ev = evaluate(s, person, workContext(s, person, e, t, i));
      const band = bandOfQuality(ev.overall);
      recordWork(s, person, ev, { at: item.at, what: `${t.role.part}, ${t.project}: ${kind === 'performance' ? 'Performance' : `Shoot Day ${i + 1}`}`, band });
      (e.log ??= []).push({ day: i, at: item.at, status: 'worked', band, overall: ev.overall });
      // A stage credit is the part performed, from its first night (`ProCredit`'s 'performed').
      if (kind === 'performance' && !e.creditId) {
        const c = addCredit(s, person, { kind: 'stage', project: t.project, role: t.role.part, company: t.company, year: zonedParts(item.at, NY).year, medium: 'stage', status: 'performed', ...(t.union !== 'none' ? { union: t.union } : {}), engagementId: e.id, at: item.at, band });
        e.creditId = c.id;
      }
    }
    if (e.log.filter((l) => l.status === 'worked').length === 1) noteEvent(s, e, { kind: 'worked', key: 'first', words: `Your first day as ${t.role.part} in ${t.project}.` });
    if (i === e.days.length - 1 && e.status === 'working') finish(s, person, e, t);
  });

  sim.onSchedule(RELEASE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const c = person && releaseScreenCredit(s, person, String(item.payload.creditId));
    if (person && c) tell(s, person, `${c.project} Is Released`, `${c.project} is out, so ${c.role} shows as released on your credits, and its footage can go on your reel. Cut A Reel on the Portfolio tab lists it.`, 60);
  });

  sim.onSchedule(SCHOOL_ANSWER_KIND, (item, s) => {
    const at = located(s, item);
    const req = at && requestFor(at.person, at.o);
    if (!at || !req || req.status !== 'pending') return;
    const conditions = conditionsFor(s, at.person, at.o, req.at);
    const recommended = conditions.filter((c) => c.id !== 'standing').every((c) => c.holds);
    const approved = recommended && conditions.every((c) => c.holds);
    req.status = approved ? 'approved' : 'refused';
    req.decidedAt = s.now;
    req.why = conditions.filter((c) => !c.holds).map((c) => c.words).join(' ') || conditions.map((c) => c.words).join(' ');
    const e = at.person.pro?.engagements.find((x) => x.opportunityId === at.o.id && live(x));
    if (e && approved && e.school === 'unapproved') e.school = 'approved';
    const t = projectOf(at.o);
    note(s, at.person, at.o, { kind: approved ? 'success' : 'refused', key: 'school', words: `The dean ${approved ? 'approved' : 'refused'} your request to work as ${t.role.part} in term.` });
    tell(s, at.person, approved ? 'The Dean Approves Your Outside Work' : 'The Dean Doesn’t Approve Your Outside Work', approved
      ? `The chair of Acting recommended your request, and the dean approved it in writing: ${t.role.part} in ${t.project}, ${counted(req.workingDays, 'working day')}. ${conditions.map((c) => c.words).join(' ')} The class days it takes are excused.`
      : `${recommended ? 'The chair of Acting recommended your request, but' : 'The chair of Acting didn’t recommend your request, and'} the dean didn’t approve it: ${t.role.part} in ${t.project}. ${req.why} Taking the work in term without approval brings an academic warning the first time and dismissal the second.`, 85);
  });

  sim.onCommand<{ opportunityId: string }, { submitted: true }>('pro.submit', (p, { sim: s }) => {
    const person = s.player;
    const o = opportunityOf(person, p?.opportunityId);
    const no = submitRefusal(s, person, o);
    if (no) throw new CommandError(no);
    submit(s, person, o!);
    return { submitted: true };
  });

  sim.onCommand<{ opportunityId?: string; engagementId?: string; step: string }, { moved: number; part: string; minutes: number }>('pro.prepare', (p, { sim: s }) => {
    const person = s.player;
    const o = p?.opportunityId !== undefined ? opportunityOf(person, p.opportunityId) : undefined;
    const e = p?.engagementId !== undefined ? engagementOf(person, p.engagementId) : undefined;
    const x: PrepTarget | undefined = o ? { opportunity: o } : e ? { engagement: e } : undefined;
    const no = prepareRefusal(s, person, x, String(p?.step));
    if (no) throw new CommandError(no);
    return prepareOn(s, person, x!, p.step as BriefStep);
  });

  sim.onCommand<{ opportunityId: string }, { band: Band; overall: number }>('pro.tape_audition', (p, { sim: s }) => {
    const person = s.player;
    const o = opportunityOf(person, p?.opportunityId);
    const no = tapeRefusal(s, person, o);
    if (no) throw new CommandError(no);
    const r = roundToCome(o!)!;
    const idx = o!.rounds!.indexOf(r);
    // Judged as the brief's tape is (`tapeBrief`): at the moment it starts, the hour on the clock after.
    const e = evaluate(s, person, auditionContext(s, person, o!, r, idx));
    s.advanceTo(s.now + SELF_TAPE.minutes * MIN);
    person.wellbeing.energy = clamp(person.wellbeing.energy - ENGAGEMENT.energy.desk, 0, 100);
    finishRound(s, person, o!, r, idx, e);
    return { band: r.band!, overall: r.overall! };
  });

  sim.onCommand<{ opportunityId: string }, { at: Instant }>('pro.move_audition', (p, { sim: s }) => {
    const person = s.player;
    const o = opportunityOf(person, p?.opportunityId);
    const no = moveRefusal(s, person, o);
    if (no) throw new CommandError(no);
    const r = roundToCome(o!)!;
    const idx = o!.rounds!.indexOf(r);
    const to = otherTime(s, person, o!, r)!;
    const item = s.universe.scheduled.find((i) => i.status === 'pending' && i.kind === AUDITION_KIND && i.payload.opportunityId === o!.id && i.payload.round === idx);
    if (item) s.timeline.reschedule(item.id, to);
    const was = r.at;
    r.at = to;
    r.moved = (r.moved ?? 0) + 1;
    if (r.round === 'audition') o!.auditionAt = to; else o!.callbackAt = to;
    const t = projectOf(o!);
    note(s, person, o!, { kind: r.round, key: `${r.round}:moved`, words: `At your asking, ${t.casting} moved your ${r.round} for ${t.role.part} from ${formatDate(was, NY)} at ${formatTime(was, NY)} to ${formatWeekdayDate(to, NY)} at ${formatTime(to, NY)}.` });
    return { at: to };
  });

  sim.onCommand<{ opportunityId: string }, { engagementId: string; days: number }>('pro.accept_offer', (p, { sim: s }) => {
    const person = s.player;
    const o = opportunityOf(person, p?.opportunityId);
    const no = acceptRefusal(s, person, o);
    if (no) throw new CommandError(no);
    const pro = ensurePro(s, person);
    const t = projectOf(o!);
    const days = datesOf(o!);
    const agreement = activeAgreement(person, s.now);
    const req = requestFor(person, o!);
    const e: Engagement = {
      id: s.nextId('pro'), opportunityId: o!.id, projectId: t.id, role: t.role.part, status: 'booked', days: days.map(({ from, to, label }) => ({ from, to, label })),
      ...(agreement ? { agreementId: agreement.id, agentId: agreement.agentId } : {}), pay: [], history: [], counts: {},
      // The sides are part of the script: the part starts from half of what they had.
      prep: { interpretation: r3((o!.prep?.interpretation ?? 0) * WORK.sidesKept), memorization: r3((o!.prep?.memorization ?? 0) * WORK.sidesKept), rehearsal: r3((o!.prep?.rehearsal ?? 0) * WORK.sidesKept) },
      ...(inSessionAny(person, days) ? { school: req?.status === 'approved' ? 'approved' as const : 'unapproved' as const } : {}),
    };
    pro.engagements.push(e);
    e.pay = promisedPay(s, e, o!);
    // Each week's pay on the clock for its payday (`schedulePay`, `systems/propay.ts`), wired at the work loop's merge on
    // 2026-10-21: promised here, paid once when it comes.
    schedulePay(s, person, e);
    bookDays(s, person, e, t);
    s.timeline.cancelFor('pro.offer', o!.id, s.now);
    const words = `You accepted ${t.role.part} in ${t.project}: ${counted(days.length, 'work day')}, from ${formatDate(days[0]!.from, NY)}.`;
    noteEvent(s, e, { kind: 'booked', key: 'booked', words });
    note(s, person, o!, { kind: 'booked', key: 'booked', words });
    o!.engagementId = e.id;
    settle(s, person, o!, 'booked', words);
    return { engagementId: e.id, days: days.length };
  });

  sim.onCommand<{ opportunityId: string }, { declined: true }>('pro.decline_offer', (p, { sim: s }) => {
    const person = s.player;
    const o = opportunityOf(person, p?.opportunityId);
    if (!o || o.status !== 'offered') throw new CommandError('There’s no offer to decline.');
    const t = projectOf(o);
    s.timeline.cancelFor('pro.offer', o.id, s.now);
    const words = `You declined ${t.role.part} in ${t.project}.`;
    note(s, person, o, { kind: 'declined', key: 'declined', words });
    settle(s, person, o, 'declined', words);
    return { declined: true };
  });

  sim.onCommand<{ opportunityId: string }, { decides: Instant }>('pro.request_outside_work', (p, { sim: s }) => {
    const person = s.player;
    const o = opportunityOf(person, p?.opportunityId);
    const no = requestRefusal(s, person, o);
    if (no) throw new CommandError(no);
    const t = projectOf(o!);
    const days = datesOf(o!);
    const start = s.now;
    s.advanceTo(start + OUTSIDE_WORK.minutes * MIN);
    const pro = ensurePro(s, person);
    const decides = dayAt(addDays(start, OUTSIDE_WORK.decisionDays, NY), OUTSIDE_WORK.decisionHour);
    const req: OutsideWorkRequest = { id: s.nextId('pro'), opportunityId: o!.id, at: start, firstDay: days[0]!.from, workingDays: days.length, classDays: classDaysIn(person, days, t.place.cityId), status: 'pending' };
    (pro.outsideWork ??= []).push(req);
    s.schedule({ at: decides, kind: SCHOOL_ANSWER_KIND, label: 'The Dean Decides On Your Outside Work', category: 'career', priority: 40, refType: 'pro.opportunity', refId: o!.id, payload: { personId: person.id, opportunityId: o!.id } });
    note(s, person, o!, { kind: 'requested', key: 'school:asked', words: `You asked the School to approve ${t.role.part} in ${t.project} in term: ${counted(days.length, 'working day')}, ${counted(req.classDays, 'class day')}.` });
    return { decides };
  });
}
