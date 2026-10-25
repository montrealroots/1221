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
 * **Away at work.** An audition in person, a work day or a meeting at an agent's office takes the actor out of town for
 * its hours and the trip each way (`awayAt`), and the School counts them absent from what falls inside it: a class
 * missed, a call missed with the School's own consequences. Approved work's class days are excused, as the approval
 * arranged them.
 *
 * **Every number here is the game's estimate unless it cites a source**: the timings of a casting office, the chances,
 * the trips and the lead time are ASSUMPTIONS, said so on the screen. The rates are the unions' (`RATES`). Every
 * project, company and casting office is fictional but a part drawn from a real production (from 2026-10-23, brief 25's
 * Module 2), and each says which it is where it's first shown. Until then every one was fictional.
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
import { WORK_RULES } from '../content/workrules';
import type { Skill } from '../content/school';
import { PROJECTS, RATES, minimumOn, projectById, type ProjectKind, type ProjectTemplate, type Rate } from '../content/careerwork';
import { agencyOf, agentById, type AgentField } from '../content/agents';
import { IN_TOWN_MINUTES } from '../world/calendar';
import {
  activeAgreement, addCredit, currentOf, demoSources, eligibilityOf, ensurePro, finished, keepBounded, materialsCheck, noteEvent, reelSources, releaseScreenCredit, resolved,
  type Agreement, type AuditionRound, type Engagement, type MaterialKind, type MaterialProblem, type Opportunity, type OutsideWorkRequest, type PartPrep,
  type ProCredit, type ProEventKind, type ProId, type ProPayment,
} from './pro';
import { BAND_LABEL, prepLean, type Band } from './coursework';
import { bandOfQuality, chiefLimit, evaluate, recordWork, type EvalContext, type Evaluation } from './evaluation';
import { BRIEF, type BriefStep } from './briefs';
import { PROCESS } from './production';
import { nerves, repeatsToday, stepSpeed } from './attributes';
import { enjoyWork } from './enjoyment';
import { exerts } from './body';
import { laidUp, trainingRefusal } from './injury';
import { SPENT, startRefusal } from './life';
import { SELF_TAPE, genreSpeed, practiceGenres, relevantGenre, requirementOfRole } from './engagement';
import {
  CALL_KIND, ESTIMATE, classPeriod, conditionAt, countWords, coursesFor, focusAt, keyOf, offSick, ordinary, recessStart, schoolEnded, setStanding,
  termOf, termStart,
} from './school';
import { OPT_ZONE, PERMISSION_ENDED, f1Of, optRunsOut, settleOpt, usWorkAuthorized, workAuthorizedFor } from './permission';
import { documentsOf, passportOf } from './documents';
import { EQUITY_JOINED, PAY_KIND, SAG_QUALIFIES, dropPaydays, eligibilityRead, negotiatedAmount, sagWorkRefusal, schedulePay } from './propay';
import { TRIP, US_RULES, abroadRead, awayOn, bookTrip, extendTrip, needsTrip, planTrip, registerWorkTrips, tripOf, tripSpans, whereAt, whereWords, windowOf as tripWindow } from './worktrip';
import { weatherOn, type DayWeather } from './weather';
import { AGENT_TIMES, MEETING_KIND, TRAVEL_MINUTES } from './proagent';
import { companiesAs, productionById } from '../content/catalog';
import { episodeDays, episodesFrom, seasonYearAt, seriesById } from '../content/series';
import { clauseOf, contractFor, entitle, overtimeOf, paysOvertime, OPTION_RAISE } from './contracts';
import { inProduction, registerSeries, scheduleSeason, seasonOf } from './series';
import { STEP_LABEL, STEP_WORDS, afterWrap, dubDaysOf, cutInEdit, formatOf, furtherHours, keptBand, payUnitsOf, planWork, registerWorkflows, sessionDays, stepOf, voiceOnly, workHoursOf, workTheDay, workflowOf } from './workflow';
import { AFTER_WRAP, RELEASED, type After } from '../content/workflows';
import { registerAwards, visibilityOf } from './awards';
import { simulateRun } from './charts';
import { keepProject, pushedPart, restoreSlate, slatePartsAt } from './slate';

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
  /**
   * A chemistry read and a screen test (from 2026-10-24, brief 27, Part 9), ASSUMPTION each: a chemistry read five days on at
   * one, for an hour with the actors already cast; a screen test a week on from nine, five hours in hair, makeup, costume
   * and the takes. Each in person.
   */
  chemistryLeadDays: 5, chemistryHour: 13, chemistryMinutes: 60, testLeadDays: 7, testHour: 9, testMinutes: 300,
  cutDays: 1, decisionDays: 3, decisionHour: 17,
  offerDays: 3, offerHour: 17,
  leadDays: 35,
  shoot: { hour: 7, minutes: 660 }, rehearsal: { hour: 10, minutes: 480 }, performance: { hour: 20, minutes: 150 },
  /**
   * The workflows' days (from 2026-10-24, brief 25's Module 5), ASSUMPTION each: a multicamera table read from ten for
   * four hours, its tape night from two for eight, the camera run before the audience comes in; a fight rehearsal from
   * ten for six.
   */
  tableRead: { hour: 10, minutes: 240 }, tapeNight: { hour: 14, minutes: 480 }, fightRehearsal: { hour: 10, minutes: 360 },
  /** Asking for another time: once, at least a day ahead, the casting office's other times (eleven, two and five) in the next three weekdays. */
  moveAheadHours: 24, movesAllowed: 1, moveSlots: [11, 14, 17] as readonly number[], moveDays: 3,
  /** A step on the whole part takes twice its time on the sides; the part starts from half the sides' preparation. */
  partTimes: 2, sidesKept: 0.5,
  /** A professional audition's difficulty: a professional's (0), a callback a little more; each step of stakes as a brief's. */
  difficulty: { audition: 0, callback: 0.1, chemistry: 0.15, test: 0.2 },
  /** A work day on your feet, as a brief's rehearsal: 2.5 METs. */
  met: 2.5,
} as const;

/**
 * The chance a project open to the actor's own submission posts a role in a given week, by its kind, and the chance a
 * project's breakdown reaches a represented actor's agent in one. ASSUMPTION: the game's, for a steady trickle.
 */
export const POSTING = {
  open: { 'student-film': 0.3, 'non-union-short': 0.25, 'ultra-low-budget': 0.15, lort: 0.12, 'overseas-feature': 0.1, 'animated-series': 0.08, 'animated-feature': 0.06, dub: 0.08, documentary: 0.08, musical: 0.08 } as Readonly<Partial<Record<ProjectKind, number>>>,
  agent: 0.2,
  /**
   * The chance a breakdown of a kind added with the workflows reaches the agent in a week (from 2026-10-24, brief 25's
   * Module 5), where it isn't `agent`: rarer work for an emerging actor, so nine kinds more don't post nine times as often.
   */
  agentKind: { 'multicam-comedy': 0.08, 'capture-feature': 0.05, musical: 0.08, 'action-feature': 0.06, 'limited-series': 0.06, 'serialized-drama': 0.07, 'serialized-comedy': 0.07, anthology: 0.06, 'tv-movie': 0.06 } as Readonly<Partial<Record<ProjectKind, number>>>,
  /**
   * A project casts its role once a cycle: posted again only ten weeks after its last posting to the actor, and only once
   * the work that posting cast is over, as a new casting of the part (`againWords`). The second half from 2026-10-21
   * (brief 20's D4): until then a stage part came round at ten weeks while the run it had cast was still in its
   * rehearsals or on, and said nothing of the first time.
   */
  againDays: 70,
} as const;

/** A round of casting: the audition, the callback, and from 2026-10-24 (brief 27, Part 9) a chemistry read and a screen test. */
export type Round = AuditionRound['round'];

/** A part's rounds in order: the audition, then, where it has them, the callback, the chemistry read and the screen test. */
export function roundsOf(t: Pick<ProjectTemplate, 'stages'>): Round[] {
  return ['audition', ...(t.stages.callback ? ['callback' as const] : []), ...(t.stages.chemistry ? ['chemistry' as const] : []), ...(t.stages.test ? ['test' as const] : [])];
}

/** The round after one, if the part has another. */
export function nextRound(t: Pick<ProjectTemplate, 'stages'>, r: Round): Round | undefined {
  const all = roundsOf(t);
  return all[all.indexOf(r) + 1];
}

/** Each round as a sentence says it. */
export const ROUND_WORDS: Readonly<Record<Round, { name: string; noun: string }>> = {
  audition: { name: 'Audition', noun: 'audition' }, callback: { name: 'Callback', noun: 'callback' },
  chemistry: { name: 'Chemistry Read', noun: 'chemistry read' }, test: { name: 'Screen Test', noun: 'screen test' },
};

/** How long a round takes in person: an audition's or a callback's half hour, a chemistry read's hour, a screen test's five. */
export const roundMinutes = (r: Pick<AuditionRound, 'round'>): number => (r.round === 'chemistry' ? WORK.chemistryMinutes : r.round === 'test' ? WORK.testMinutes : WORK.auditionMinutes);

/**
 * A direct offer (from 2026-10-24, the owner's brief 27, loop 16: "Offer arrives without an audition → establish why the
 * player is a plausible candidate"): a slate part from a casting office that cast the actor before, the work judged Strong
 * or better, comes as an offer rather than a posting, half the time it reaches them, and never a lead, which still
 * auditions. ASSUMPTION each figure; drawn on its own stream (decider `pro.direct`).
 */
export const DIRECT = { chance: 0.5, bands: ['strong', 'exceptional'] as readonly Band[] } as const;

/**
 * Asking for more (from 2026-10-24, the owner's brief 27, loop 18: "propose changes → other party responds → terms may
 * improve, remain unchanged ... Negotiation is not unlimited rerolling"): an agent asks once, a fifth over the offer, and
 * the production answers the next afternoon at three, raising it to what was asked or keeping its offer, the offer then
 * standing a day past the answer. Its chance by the last round's band, and a little more where the casting office cast
 * the actor before. ASSUMPTION each figure; drawn on its own stream (decider `pro.negotiate`).
 */
export const NEGOTIATE = { ask: 0.2, yes: { unready: 0, working: 0.15, strong: 0.35, exceptional: 0.55 } as Readonly<Record<Band, number>>, worked: 0.15, answerHour: 15 } as const;

/**
 * A hold (from 2026-10-25, the owner's brief 27, loop 20: "A hold or option begins → record its scope, dates, and terms →
 * show how it affects availability → a conflicting opportunity arrives → evaluate permitted responses → release,
 * exercise, negotiate, or decline"): a production that asks the actor to a chemistry read or a screen test holds the
 * part's work days until the part is settled, booking nothing and paying nothing ("Do not treat every hold as a signed
 * paid engagement"). Accepting another offer on the same days lets the hold go, and the part with it; or the actor asks
 * the production to decide first, and it answers the next afternoon at three, booking them with an offer, its chance by
 * the last round's band, or letting the hold go. ASSUMPTION each figure; drawn on its own stream (decider `pro.hold`).
 */
export const HOLD = { book: { unready: 0, working: 0.15, strong: 0.45, exceptional: 0.7 } as Readonly<Record<Band, number>>, answerHour: 15 } as const;

/**
 * Casting's chance, ASSUMPTION every figure: by the band of the round it reads (a callback's cut from the first
 * audition, the final from the last), the fit (the chance at no fit is `fitFloor` of it), and the field each kind of
 * work draws (more actors for a network co-star than a student film). Held to `least` and `most`: a perfect audition
 * that fits the role in the easiest field still loses it one time in five.
 */
export const CASTING = {
  final: { unready: 0.04, working: 0.18, strong: 0.38, exceptional: 0.58 } as Readonly<Record<Band, number>>,
  callback: { unready: 0.1, working: 0.45, strong: 0.78, exceptional: 0.9 } as Readonly<Record<Band, number>>,
  /** The cut into a chemistry read and into a screen test (from 2026-10-24, brief 27), each from the round before it. */
  chemistry: { unready: 0.08, working: 0.4, strong: 0.7, exceptional: 0.85 } as Readonly<Record<Band, number>>,
  test: { unready: 0.06, working: 0.35, strong: 0.65, exceptional: 0.8 } as Readonly<Record<Band, number>>,
  fitFloor: 0.4,
  field: {
    'off-broadway': 0.8, lort: 0.85, 'network-drama': 0.75, 'low-budget': 0.85, 'ultra-low-budget': 1, 'student-film': 1.25, 'non-union-short': 1.2, 'overseas-feature': 0.8, 'network-comedy': 0.75,
    'multicam-comedy': 0.75, 'animated-series': 0.9, 'animated-feature': 0.8, dub: 1.1, 'capture-feature': 0.9, documentary: 1.1, musical: 0.85, 'action-feature': 0.8,
    'limited-series': 0.8, 'serialized-drama': 0.8, 'serialized-comedy': 0.8, anthology: 0.85, 'tv-movie': 0.9,
  } as Readonly<Record<ProjectKind, number>>,
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
  'overseas-feature': 'a large field: a studio feature shooting abroad sees tapes from actors in more than one country',
  'network-comedy': 'the largest field: a network co-star is seen by the most actors',
  'multicam-comedy': 'the largest field: a network co-star is seen by the most actors',
  'animated-series': 'a large field: voice casting hears actors from everywhere',
  'animated-feature': 'a large field: an animated feature hears actors from everywhere',
  dub: 'a middling field: dubbing casts from the voice actors it knows',
  'capture-feature': 'a large field',
  documentary: 'a middling field',
  musical: 'a large field: a regional musical casts from New York',
  'action-feature': 'a large field',
  'limited-series': 'a large field',
  'serialized-drama': 'a large field',
  'serialized-comedy': 'a large field',
  anthology: 'a large field',
  'tv-movie': 'a large field',
};

/** Missed work days a project allows before replacing the actor: the stage's understudy covers one, a shoot can't wait. ASSUMPTION. */
export const MISSES = { stage: 1, screen: 0 } as const;

/**
 * A slate production's way out after the wrap (from 2026-10-25, the owner's brief 27, loop 33: "Possible alternatives:
 * Delayed release. Different distributor. Limited release. Direct-to-streaming release. Shelving. No public release. Do
 * not force every completed project to succeed or release immediately"). Drawn at the wrap on the production's own stream
 * (decider `pro.release`), by the way its format comes out: a film for cinemas may be held back, sent to streaming instead,
 * or shelved; a series or a broadcast may be held back or shelved. The fixed parts briefs 19 to 25 wrote keep their
 * releases as written. ASSUMPTION every chance and the hold-back's months: nobody publishes how often a finished film or
 * series is held back or shelved.
 */
export const RELEASE_FATE: Readonly<Partial<Record<After, { late: number; streaming?: number; shelved: number }>>> = {
  theatrical: { late: 0.12, streaming: 0.12, shelved: 0.04 },
  streaming: { late: 0.08, shelved: 0.02 },
  broadcast: { late: 0.06, shelved: 0.02 },
};
export const RELEASE_LATE = { least: 60, most: 240 } as const;

/** A slate production's way out, by its own stream: on time unless its format's chances say otherwise. */
export function releaseFate(sim: Simulation, t: ProjectTemplate): NonNullable<ProCredit['release']> {
  const odds = t.slate ? RELEASE_FATE[formatOf(t).after] : undefined;
  if (!odds) return { kind: 'on-time' };
  const r = sim.rng('pro.release', t.slate!.production);
  const u = r.next();
  if (u < odds.shelved) return { kind: 'shelved' };
  if (u < odds.shelved + (odds.streaming ?? 0)) return { kind: 'streaming' };
  if (u < odds.shelved + (odds.streaming ?? 0) + odds.late) return { kind: 'late', days: RELEASE_LATE.least + Math.floor(r.next() * (RELEASE_LATE.most - RELEASE_LATE.least)) };
  return { kind: 'on-time' };
}

/** How long after it's shot a screen project comes out, so its footage can go on a reel. ASSUMPTION, by kind. */
export const RELEASE_DAYS: Readonly<Partial<Record<ProjectKind, number>>> = {
  'network-drama': 120, 'low-budget': 365, 'ultra-low-budget': 300, 'student-film': 180, 'non-union-short': 150, 'overseas-feature': 365, 'network-comedy': 120,
  'multicam-comedy': 60, 'animated-series': 240, 'animated-feature': 540, dub: 90, 'capture-feature': 450, documentary: 200, 'action-feature': 365,
  'limited-series': 240, 'serialized-drama': 200, 'serialized-comedy': 180, anthology: 200, 'tv-movie': 120,
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
export const NEGOTIATE_KIND = 'pro.negotiate_answer';
export const HOLD_KIND = 'pro.hold_answer';

/**
 * A weather day (from 2026-10-25, the owner's brief 27, Part 11: "Weather should affect production when circumstances
 * justify it"). A day on location (`onLocation`) whose forecast in the shoot's own town, read at six the evening before,
 * is a thunderstorm, fog, or wind at `windKph` or more is called off. Those are the agreement's own weather for making
 * usable sound or photography outdoors impossible (N13 Schedule A §25.A: "rain, wind or hail", "fog, wind, rain or
 * hail"), read as those three since a shower is shot through under covers (ASSUMPTION, the game's line). The rest of the
 * part's days slip a working day each, the flight home with them. A SAG-AFTRA day performer engaged and not used for any
 * reason but their own default, illness or incapacity is paid the day (N13 Schedule A §4.E), so the day off is paid with
 * the day it was. The Low Budget, Ultra Low Budget and non-union terms weren't read, so those are paid the days worked. A
 * weekly performer is paid by the week, and a week the slip adds pays a fifth of the weekly rate a day (N13 Schedule B
 * §12). A day that can't slip, where another booking or the end of permission is in the way, is shot without the actor,
 * its scenes cut from the part. Weather is the save's own, a function of its seed and the town, never drawn here; after
 * `most` such days on one part the production shoots the rest under cover (ASSUMPTION).
 */
export const WEATHER_DAY = { skies: ['Thunderstorm', 'Fog'] as readonly string[], windKph: 40, eveningHour: 18, most: 2, steps: ['shoot', 'stunt-day', 'reenactment'] as readonly string[] } as const;

/**
 * An ill day shot around (from 2026-10-25, the owner's brief 27, loop 28: "A schedule change, illness, conflict, absence
 * ... → determine its cause and relevant contractual rules ... → reschedule, excuse, warn, replace ... Do not impose
 * replacement automatically after one universal number of mistakes unless a specific established game arrangement
 * supports it"). Until then a shoot replaced the actor for any day missed, asleep or ill. Now a lead's or a supporting
 * part's production shoots around one day the actor is too ill to work, slipping the rest a working day each as a weather
 * day does, where nothing stands in the way; the day isn't paid, a performer's own illness being the agreement's exception
 * to paying a day engaged and not used (N13 Schedule A §4.E). A smaller part is recast, as a second ill day is, and a day
 * slept through is the actor's default, replaced as before. ASSUMPTION each line of it: the agreement says what's paid, not
 * when a production waits.
 */
export const ILL_DAY = { most: 1, sizes: ['lead', 'supporting'] as readonly string[] } as const;

/** How much of a screen venue's work is out on location, by its words: all of it, half where a stage or a set goes with locations, none in a studio, on a stage or in a room (the game's reading). */
export const locationShare = (venue: string): number => (/^locations\b/i.test(venue) ? 1 : /\blocations\b|wharves/i.test(venue) ? 0.5 : 0);

/** Whether a day of the work is out on location: a shoot day of a venue all on location, or every other shoot day, from the first, of one that's half. */
export function onLocation(t: ProjectTemplate, i: number): boolean {
  const share = t.medium === 'stage' ? 0 : locationShare(t.place.venue);
  const out = (k: number) => WEATHER_DAY.steps.includes(stepOf(t, k));
  if (!share || !out(i)) return false;
  if (share === 1) return true;
  let before = 0;
  for (let k = 0; k < i; k += 1) if (out(k)) before += 1;
  return before % 2 === 0;
}

/** The sky that stops a day on location, in words, or nothing where the day can go ahead. */
export function stoppingSky(w: Pick<DayWeather, 'condition' | 'windKph'>): string | undefined {
  if (w.condition === 'Thunderstorm') return 'thunderstorms';
  if (w.condition === 'Fog') return 'thick fog';
  if (w.windKph >= WEATHER_DAY.windKph) return 'high winds';
  return undefined;
}

/** Whether a day was called off for the weather and shot without the actor: lost, where a slipped day is only later. */
const lostDay = (e: Pick<Engagement, 'weather'>, i: number): boolean => e.weather?.some((w) => w.day === i && !w.slipped) ?? false;
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
  'non-union-short': 'non-union short film', 'overseas-feature': 'studio feature film shooting abroad', 'network-comedy': 'network television comedy',
  'multicam-comedy': 'multicamera television comedy', 'animated-series': 'animated television series', 'animated-feature': 'animated feature film',
  dub: 'English dub of a series from abroad', 'capture-feature': 'feature film’s performance capture', documentary: 'documentary', musical: 'musical in a regional theater’s season',
  'action-feature': 'studio action feature', 'limited-series': 'limited series', 'serialized-drama': 'serialized television drama',
  'serialized-comedy': 'serialized television comedy', anthology: 'anthology series', 'tv-movie': 'television movie',
};

/** One work day: when, its label on the calendar, and what it is. */
export interface WorkDay { from: Instant; to: Instant; label: string; kind: 'rehearsal' | 'performance' | 'shoot' | 'session' }

/**
 * The work's days, worked out from the posting and the project's schedule (`content/careerwork.ts`): a shoot's days on
 * consecutive weekdays from five weeks on; a run's rehearsals Tuesday to Saturday for its rehearsal weeks, from the
 * first Tuesday then, and its performances Tuesday to Sunday after. ASSUMPTION, each length the project's and each
 * shape the game's.
 */
export function datesOf(o: Pick<Opportunity, 'projectId' | 'postedAt'>): WorkDay[] {
  const t = projectOf(o);
  const zone = zoneOf(t.place.cityId);
  const start = addDays(dayAt(o.postedAt, 12, zone), t.leadDays ?? WORK.leadDays, zone);
  const at = (d: Instant, s: { hour: number; minutes: number }) => { const from = dayAt(d, s.hour, zone); return { from, to: from + s.minutes * MIN }; };
  const out: WorkDay[] = [];
  if (t.schedule.kind === 'episodes') return episodeWorkDays(t, start, t.schedule.guaranteed);
  if (t.schedule.kind === 'shoot') {
    // An action shoot's fight rehearsal days first (from 2026-10-24, brief 25's Module 5), with the stunt coordinator.
    const before = t.schedule.rehearsalDays ?? 0;
    const total = t.schedule.days + before;
    let shot = 0;
    for (let d = start; out.length < total; d = addDays(d, 1, zone)) {
      const wd = weekdayOf(d, zone);
      if (wd < 1 || wd > 5) continue;
      if (out.length < before) { out.push({ ...at(d, WORK.fightRehearsal), label: `${t.project}: ${STEP_LABEL['stunt-rehearsal']} ${out.length + 1}`, kind: 'shoot' }); continue; }
      shot += 1;
      const step = stepOf(t, out.length);
      const day = step === 'stunt-day' ? STEP_LABEL['stunt-day'].replace('Shoot Day', `Shoot Day ${shot}`) : step === 'reenactment' ? `${STEP_LABEL.reenactment} ${shot}` : `Shoot Day ${shot}`;
      out.push({ ...at(d, WORK.shoot), label: `${t.project}: ${day}`, kind: 'shoot' });
    }
    return out;
  }
  // A multicamera episode's week from its first Monday (Module 5): the table read Monday morning, rehearsal and camera
  // blocking Tuesday to Thursday, and the tape night Friday before a studio audience.
  if (t.schedule.kind === 'week') {
    let monday = start;
    while (weekdayOf(monday, zone) !== 1) monday = addDays(monday, 1, zone);
    for (let w = 0; w < t.schedule.weeks; w += 1) {
      for (let k = 0; k < 5; k += 1) {
        const day = addDays(monday, w * 7 + k, zone);
        const step = stepOf(t, w * 5 + k);
        out.push({ ...at(day, step === 'table-read' ? WORK.tableRead : step === 'tape-night' ? WORK.tapeNight : WORK.rehearsal), label: `${t.project}: ${STEP_LABEL[step]}`, kind: 'shoot' });
      }
    }
    return out;
  }
  // Sessions on weekdays (Module 5): the booth, the dub, narration, the capture stage.
  if (t.schedule.kind === 'sessions') {
    const step = stepOf(t, 0);
    return sessionDays(t, start, zone).map((d, k) => ({ ...d, label: `${t.project}: ${STEP_LABEL[step]} ${k + 1}`, kind: step === 'capture' ? 'shoot' as const : 'session' as const }));
  }
  let tuesday = start;
  while (weekdayOf(tuesday, zone) !== 2) tuesday = addDays(tuesday, 1, zone);
  for (let w = 0; w < t.schedule.rehearsalWeeks; w += 1) {
    // A musical's music rehearsals and choreography come first (Module 5): each day named for what it is.
    for (let k = 0; k < 5; k += 1) out.push({ ...at(addDays(tuesday, w * 7 + k, zone), WORK.rehearsal), label: `${t.project}: ${STEP_LABEL[stepOf(t, w * 5 + k)]}`, kind: 'rehearsal' });
  }
  const opening = addDays(tuesday, t.schedule.rehearsalWeeks * 7, zone);
  for (let w = 0; w < t.schedule.performanceWeeks; w += 1) {
    for (let k = 0; k < 6; k += 1) out.push({ ...at(addDays(opening, w * 7 + k, zone), WORK.performance), label: `${t.project}: Performance`, kind: 'performance' });
  }
  return out;
}

/**
 * A recurring part's guaranteed episodes from a day on (from 2026-10-24, brief 25's Module 4, D7): the season's next
 * episodes from then, in the season whose window holds it or, in the hiatus, the one beginning that August, each episode's
 * shoot days as a shoot's. Fewer than asked where the season has fewer left, and the posting waits for the next.
 */
export function episodeWorkDays(t: ProjectTemplate, from: Instant, count: number, year?: number): WorkDay[] {
  const s = t.series ? seriesById(t.series) : undefined;
  if (!s) return [];
  const y = year ?? seasonYearAt(s, from) ?? zonedParts(from, NY).year;
  return episodesFrom(s, y, from).slice(0, count).flatMap((n) => episodeOn(t, y, n));
}

/** One episode's shoot days, each labeled with the episode. */
export function episodeOn(t: ProjectTemplate, year: number, n: number): WorkDay[] {
  const s = seriesById(t.series!)!;
  return episodeDays(s, year, n).map((d, k) => ({ from: d, to: d + WORK.shoot.minutes * MIN, label: `${t.project}: Episode ${n}, Shoot Day ${k + 1}`, kind: 'shoot' as const }));
}

/** The episode a booked day is in, read from its label, where it's a recurring part's. */
export const episodeOfDay = (d: { label: string }): number | undefined => { const m = /: Episode (\d+),/.exec(d.label); return m ? Number(m[1]) : undefined; };

/** A booked day's kind, read from where it falls in the project's schedule: a run's rehearsals come first. */
export function dayKindOf(t: ProjectTemplate, index: number): WorkDay['kind'] {
  // A recurring part's episodes are shoot days (from 2026-10-24): until then a schedule was a run's or a shoot's. A booth's
  // session is its own from Module 5; a multicamera week's days and an action shoot's rehearsals are a screen production's.
  if (t.schedule.kind === 'sessions') return stepOf(t, index) === 'capture' ? 'shoot' : 'session';
  if (t.schedule.kind !== 'run') return 'shoot';
  return index < t.schedule.rehearsalWeeks * 5 ? 'rehearsal' : 'performance';
}

/** A rate's minimum on a day, on New York's calendar: the SAG-AFTRA day performer's by its contract year (S30), every other as `RATES` has it (`minimumOn`). */
export const rateOn = (rate: Rate, on: Instant): number | undefined => minimumOn(rate, dateKey(on, NY));

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
 * Why deferred pay is never paid, in the one sentence the offer, Booked Work and the Work tab all say. From 2026-10-21
 * (the app's second walk): until then the offer said a student film pays "only if it earns money later", Booked Work
 * "nothing is paid for it" and the Work tab "never paid", and the first and last can't both be true of a game in which
 * no film earns anything later.
 */
export const DEFERRED_WHY = 'a student film pays its actors only if it earns money later, and no film in the game does';

/**
 * The pay in a sentence: "It pays $1,283.00 a day for two days, the SAG-AFTRA Day Performer minimum." An offer's own
 * amount, where it's more than the scale (the pay's `negotiatedAmount`, at the offer), is said with the scale it's above.
 */
export function payWords(terms: PayTerms, amount: Money | undefined = terms.each): string {
  if (terms.deferred) return `The pay is deferred: ${DEFERRED_WHY}, so nothing is paid for its ${counted(terms.units, terms.per)} of work.`;
  const basis = terms.rate.basis === 'verified' ? `the ${/Minimum$/.test(terms.rate.label) ? terms.rate.label : `${terms.rate.label} minimum`}` : 'an estimate';
  const over = amount !== undefined && terms.each !== undefined && amount > terms.each;
  return `It pays ${formatMoney((amount ?? terms.each)!, 'USD')} a ${terms.per} for ${counted(terms.units, terms.per)}, ${over ? `above ${basis} of ${formatMoney(terms.each!, 'USD')}` : basis}.`;
}

/** The department field a project falls in, by the agent's published list (`content/agents.ts`). */
export function fieldOf(t: ProjectTemplate): AgentField {
  if (t.kind === 'off-broadway') return 'off-broadway';
  if (t.kind === 'lort' || t.kind === 'musical') return 'regional';
  // By the medium (from 2026-10-23, brief 25's Module 2): until then by the one television kind, network drama, so the
  // network comedy it added would have been filed under film.
  if (t.medium === 'television') return 'television';
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
 * What a role asks of the genres: its own requirement, or its project's, as the material states it (`requirementOfRole`,
 * from 2026-10-22, the owner's brief 22; until then the project's tags, the first listed carrying half). The work's,
 * never the player's own loves, which only enjoyment reads (tests/cohesion.test.ts). A professional audition, callback
 * or self-tape has no sides of its own in the game, so it reads the role's too.
 */
export const projectGenresOf = (t: ProjectTemplate) => requirementOfRole(t);

/**
 * How well the role suits the actor, from the record: the project's genres known, weighed (`relevantGenre`), against
 * what a brief counts complete (`BRIEF.complete.genre`); and the role's techniques against the actor's, each at most
 * mastered (`MASTERED`), by the role's weights. The two count alike. ASSUMPTION: the game's reading of "fit".
 *
 * Two things read the genre part, and they're different contributions (from 2026-10-22, the owner's brief 21): casting's
 * reading of the actor for the part (here, half the fit, which sets casting's chance with the round's band,
 * `chanceOf`), and the work itself, where knowing the genre is a part of the take's, the room's or the day's
 * preparation (`auditionContext`, `workContext`). The first is who casting thinks suits it; the second is how the
 * work comes out. Until that day the genre known was the best of the project's genres: knowing `thriller` counted as
 * knowing `psychological_thriller` in full.
 */
export function fitOf(person: Person, t: ProjectTemplate): Fit {
  // The project's genres, never the player's own loves, which only enjoyment reads: a preference changes what doing a
  // thing gives, never how good somebody is at it (tests/cohesion.test.ts).
  const genre = clamp(relevantGenre(person, projectGenresOf(t)).total / BRIEF.complete.genre, 0, 1);
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
export function chanceOf(band: Band, fit: number, kind: ProjectKind, round: Exclude<Round, 'audition'> | 'final'): number {
  const base = CASTING[round][band];
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
 * Whether a part is written for the actor: for either, or for an actor or an actress as their title says, as the
 * School casts its plays (`coveredPart`). From 2026-10-21, at the owner's word; until then every part went to anyone.
 */
export const writtenFor = (t: ProjectTemplate, person: Person): boolean => t.role.for === 'either' || t.role.for === person.performerTitle;

/** "Written for an actress.": who a part is written for, as a breakdown says it. */
export const writtenForWords = (t: ProjectTemplate): string => `Written for ${t.role.for === 'either' ? 'an actor or an actress' : `an ${t.role.for}`}.`;

/**
 * The last time a part was posted to the actor before a moment: the latest posting the record keeps of it, or, once
 * that's been trimmed (`OPPORTUNITIES_KEPT`), what `lastPosted` kept of it (from 2026-10-21, brief 20's D4). A posting
 * still open past its window, as a long jump leaves one until the jump's postings are done, is read as closed then.
 */
export function lastPostingOf(person: Person, t: ProjectTemplate, before: Instant): { postedAt: Instant; status: Opportunity['status']; outcome?: string; live: boolean } | undefined {
  const kept = (person.pro?.opportunities ?? []).filter((o) => o.projectId === t.id && o.postedAt < before).sort((a, b) => b.postedAt - a.postedAt)[0];
  if (kept) {
    if (kept.status === 'open' && kept.submitBy <= before) return { postedAt: kept.postedAt, status: 'lapsed', outcome: `Submissions for ${t.role.part} closed on ${formatDate(kept.submitBy, NY)}.`, live: false };
    return { postedAt: kept.postedAt, status: kept.status, ...(kept.outcome ? { outcome: kept.outcome } : {}), live: !resolved(kept) };
  }
  const past = person.pro?.lastPosted?.[t.id];
  return past && past.postedAt < before ? { postedAt: past.postedAt, status: past.status, ...(past.outcome ? { outcome: past.outcome } : {}), live: false } : undefined;
}

/**
 * Whether a part can be posted to the actor again at a moment: never posted, or its last posting ten weeks back or more
 * (`POSTING.againDays`), settled, and the work it cast over, its last day passed (`datesOf`), so a new casting can't fall
 * while the production that cast the part is still in rehearsal, running or shooting. The last two from 2026-10-21 (brief
 * 20's D4): until then ten weeks alone held it, and a run's part came round in its fifth week of rehearsals.
 */
export function postedAgainBy(person: Person, t: ProjectTemplate, at: Instant): boolean {
  const last = lastPostingOf(person, t, at);
  if (!last) return true;
  if (at - last.postedAt < POSTING.againDays * MS_DAY || last.live) return false;
  return datesOf({ projectId: t.id, postedAt: last.postedAt }).at(-1)!.to <= at;
}

/** What came of a part the last time it was posted, as a sentence: "The last time it was posted to you, on March 2, 2030: …". */
export function lastTimeWords(again: NonNullable<Opportunity['again']>): string {
  return `The last time it was posted to you, on ${formatDate(again.postedAt, NY)}${again.outcome ? `: ${again.outcome}` : '.'}`;
}

/** A part posted again, as its card and the agent's notice say it (from 2026-10-21, brief 20's D4). */
export const againWords = (o: Pick<Opportunity, 'again'>): string | undefined => (o.again ? `It’s a new casting of the part. ${lastTimeWords(o.again)}` : undefined);

/**
 * What a week's postings bring the actor (the decider `pro.posting`): each project drawn at its chance, its own draw
 * by the week and the way it comes, and none posted again before `postedAgainBy` lets it. Reads the representation in
 * force that Monday, who each part is written for (`writtenFor`) and the postings the record holds; draws nothing else.
 * A part written for someone else isn't drawn for, and each project's draw is its own, so leaving one out moves no
 * other's.
 */
export function postingsAt(sim: Simulation, person: Person, at: Instant): { project: ProjectTemplate; via: 'agent' | 'open' }[] {
  const agreement = activeAgreement(person, at);
  const week = dateKey(at, NY);
  const out: { project: ProjectTemplate; via: 'agent' | 'open' }[] = [];
  // The fixed parts, then (from 2026-10-24, brief 27, Area B) the slate's: the work the world made for this week.
  for (const t of [...PROJECTS, ...slatePartsAt(sim, at)]) {
    if (!writtenFor(t, person)) continue;
    const via = reachOf(t, agreement);
    if (!via) continue;
    if (!postedAgainBy(person, t, at)) continue;
    // A role the actor has been booked for isn't posted to them again: until 2026-10-21 it came round after its ten weeks
    // and could be booked and credited a second time (two Desk Clerks in The Calloway Files, found by the playthroughs).
    // Read from the engagements, live or kept, and from the credits, which are kept for good where finished engagements are
    // trimmed.
    // A part in a series is cast again for a later season (from 2026-10-24, brief 25's Module 4, D8): booked in this one,
    // or booked and not yet done, it isn't posted.
    if (t.series) {
      const days = datesOf({ projectId: t.id, postedAt: at });
      if (!seriesPosts(sim, t, days, at)) continue;
      const season = seriesSeasonOf(t, days[0]!.from);
      if (person.pro?.engagements.some((e) => e.projectId === t.id && e.status !== 'canceled' && (!finished(e) || seriesSeasonOf(t, e.days[0]?.from ?? 0) === season))) continue;
    } else if (person.pro?.engagements.some((e) => e.projectId === t.id && e.status !== 'canceled') || person.pro?.credits.some((c) => c.project === t.project && c.role === t.role.part)) continue;
    if (t.slate) {
      // A slate part reaches the actor by the slate's own reach (`slateReach`), drawn on its own stream.
      if (sim.rng('pro.slate_reach', week, t.id, via).next() < slateReach(sim, person, t, via, at)) out.push({ project: t, via });
      continue;
    }
    const chance = via === 'agent' ? POSTING.agentKind[t.kind] ?? POSTING.agent : POSTING.open[t.kind] ?? 0;
    if (sim.rng('pro.posting', week, t.id, via).next() < chance) out.push({ project: t, via });
  }
  return out;
}

/**
 * How likely a slate part is to reach the actor in its week (from 2026-10-24, brief 27, Area B: "Make opportunity supply
 * responsive to market, location, eligibility, representation access, availability, experience, skills, genres,
 * relationships, and established production circumstances"). Every figure an ASSUMPTION, each factor said where it's set:
 * - **who brings it**: an agent's breakdown reaches a client more often than an open posting reaches anyone (`SLATE_REACH`);
 * - **the playing age**: a part outside the actor's age by more than `CASTING.playingSpread` years reaches nobody's agent and
 *   no open call they'd answer;
 * - **fit**: an agent puts up a client the part suits, so the agent's chance rises with the part's fit (`fitOf`: its genres'
 *   knowledge and the techniques it asks), from a third at no fit;
 * - **experience**: a lead in professional screen work comes to an actor with three professional credits or more, and to
 *   anyone else a fifth as often; a supporting part through an agent to one with a credit, and half as often without;
 * - **relationships**: a company or casting office the actor has worked for comes back to them a half again as often;
 * - **where they live**: an open in-person audition farther than a day's trip reaches nobody there, and an agent's half as
 *   often; a self-tape reaches anyone;
 * - **availability**: an agent doesn't put up a client booked on the part's days.
 * The market, the season and the production's own circumstances are the slate's (`systems/slate.ts`): what's made where,
 * when, and whether a series is being made at all.
 */
export const SLATE_REACH = { agent: 0.45, open: 0.3, noFit: 0.35, leadCredits: 3, leadWithout: 0.2, supportingWithout: 0.5, worked: 1.5, farAgent: 0.5 } as const;
const PRO_SCREEN: ReadonlySet<ProjectKind> = new Set(['network-drama', 'network-comedy', 'multicam-comedy', 'serialized-drama', 'serialized-comedy', 'limited-series', 'tv-movie', 'anthology', 'low-budget', 'action-feature', 'capture-feature', 'overseas-feature', 'animated-feature']);
export function slateReach(sim: Simulation, person: Person, t: ProjectTemplate, via: 'agent' | 'open', at: Instant): number {
  const age = ageOn(person.birthInstant, at, sim.homeZone);
  if (age < t.requirements.ages[0] - CASTING.playingSpread || age > t.requirements.ages[1] + CASTING.playingSpread) return 0;
  let chance = via === 'agent' ? SLATE_REACH.agent : SLATE_REACH.open;
  if (via === 'agent') chance *= SLATE_REACH.noFit + (1 - SLATE_REACH.noFit) * fitOf(person, t).fit;
  const credits = (person.pro?.credits ?? []).filter((c) => c.kind !== 'student-film').length;
  if (t.role.size === 'lead' && PRO_SCREEN.has(t.kind) && credits < SLATE_REACH.leadCredits) chance *= SLATE_REACH.leadWithout;
  if (via === 'agent' && t.role.size === 'supporting' && credits < 1) chance *= SLATE_REACH.supportingWithout;
  const worked = (person.pro?.credits ?? []).some((c) => c.company === t.company) || (person.pro?.engagements ?? []).some((e) => { const x = projectById(e.projectId); return x !== undefined && (x.company === t.company || x.casting === t.casting); });
  if (worked) chance *= SLATE_REACH.worked;
  if (t.stages.audition === 'in-person' && needsTrip(person.currentLocationId, t.place.cityId)) chance *= via === 'agent' ? SLATE_REACH.farAgent : 0;
  if (via === 'agent' && bookedClash(person, datesOf({ projectId: t.id, postedAt: at }))) return 0;
  return Math.min(0.95, chance);
}

/** The season a day of a series part falls in, by the year it began. */
const seriesSeasonOf = (t: ProjectTemplate, at: Instant): number | undefined => { const s = t.series ? seriesById(t.series) : undefined; return s ? seasonYearAt(s, at) : undefined; };

/**
 * Whether a part in a series is cast for work on these days (from 2026-10-24, brief 25's Module 4, D8): each day in a
 * season being made (`inProduction`, `systems/series.ts`), and a recurring part only with its guaranteed episodes all left
 * in the season.
 */
export function seriesPosts(sim: Simulation, t: ProjectTemplate, days: readonly WorkDay[], at: Instant): boolean {
  if (!t.series) return true;
  if (t.schedule.kind === 'episodes' && days.length < t.schedule.guaranteed * (seriesById(t.series)?.daysEach ?? 0)) return false;
  return days.length > 0 && inProduction(sim, t.series, days, at);
}

/**
 * Casting's decision on a round (the decider `pro.casting`): the chance the band, the fit and the field give, and a draw
 * for the field of other actors, keyed by the posting (its project and when it was posted) and the round, so a reload
 * decides the same. Until 2026-10-23 (brief 25, criteria C11) it was keyed by the opportunity's id, its place in the
 * save's numbering, so a project added to the game took an id ahead of later postings and changed their casting: brief
 * 25's eighth project moved a played life's (tests/journey-career.test.ts) first booking from December to June.
 */
export function castingDraw(sim: Simulation, o: Pick<Opportunity, 'projectId' | 'postedAt'>, round: Exclude<Round, 'audition'> | 'final', band: Band, fit: number, lift = 0): { chance: number; yes: boolean } {
  // The player's visibility lifts the chance (from 2026-10-24, brief 25's Module 6, X13: `visibilityOf`), within casting's
  // own ceiling, and never past it.
  const chance = r3(Math.min(CASTING.most, chanceOf(band, fit, projectOf(o).kind, round) * (1 + lift)));
  return { chance, yes: sim.rng('pro.casting', o.projectId, o.postedAt, round).next() < chance };
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

/** The country of a project's town, by the gazetteer's id. */
export const countryOfProject = (t: Pick<ProjectTemplate, 'place'>): string => CITIES.get(t.place.cityId)?.countryId ?? (t.place.cityId.startsWith('us-') ? 'us' : '');
/** Whether a project's work is reached by a trip from home, abroad or in the US (`systems/worktrip.ts`, from 2026-10-23, the owner's brief 25). */
export const travels = (person: Person, t: ProjectTemplate): boolean => t.trip !== undefined && needsTrip(person.currentLocationId, t.place.cityId);
/** Whether that trip is abroad, so the work reads the country's permission. Until Module 2 (2026-10-23) every trip was. */
export const abroad = (person: Person, t: ProjectTemplate): boolean => travels(person, t) && countryOfProject(t) !== US_RULES;

/**
 * The time a booking takes the actor away for: its work days, or, for work abroad, every day from the trip's first leg to
 * its last, whole, since nothing at home can be gone to while away (W8). From 2026-10-23, the owner's brief 25.
 */
export function spansOf(person: Person, t: ProjectTemplate, days: readonly WorkDay[] | readonly { from: Instant; to: Instant; label: string }[]): { from: Instant; to: Instant; label: string }[] {
  if (!travels(person, t)) return [...days];
  const span = tripWindow(planTrip(person.currentLocationId, t.place.cityId, days)?.legs ?? []);
  if (!span) return [...days];
  const out: { from: Instant; to: Instant; label: string }[] = [];
  for (let d = dayAt(span.from, 0); d < span.to; d = addDays(d, 1, NY)) out.push({ from: Math.max(d, span.from), to: Math.min(addDays(d, 1, NY), span.to), label: `${t.project}: Away In ${t.place.city}` });
  return out;
}

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
export function classDaysIn(person: Person, days: readonly { from: Instant; to: Instant }[], cityId: string): number {
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
 * Whether the actor is away at professional work, an audition in person or a meeting with an agent's office at a
 * moment, and whether the dean approved it: the work day's, the audition's or the meeting's hours, with the trip each
 * way, and not missed. The School reads it for who's present (`present`, `systems/school.ts`), and excuses a class
 * missed for approved work; nothing approves a meeting, as nothing approves an audition.
 */
export function awayAt(person: Person, when: Instant): { label: string; approved: boolean } | undefined {
  const pro = person.pro;
  if (!pro) return undefined;
  // Away on a trip for work abroad (from 2026-10-23, the owner's brief 25, W8): from the first leg out to the last leg
  // home, wherever the trip has got to.
  const w = awayOn(person, when);
  if (w?.trip) {
    const e = pro.engagements.find((x) => x.id === w.trip!.engagementId);
    const t = e ? projectById(e.projectId) : undefined;
    return { label: `${t?.project ?? 'Work'}: Away In ${CITIES.get(w.trip.cityId)?.name ?? 'Another Country'}`, approved: e?.school === 'approved' };
  }
  for (const e of pro.engagements) {
    const t = projectById(e.projectId);
    if (!t) continue;
    const away = tripMinutes(person.currentLocationId, t.place.cityId) * MIN;
    for (let i = 0; i < e.days.length; i += 1) {
      const d = e.days[i]!;
      if (when < d.from - away || when > d.to + away) continue;
      const log = e.log?.find((l) => l.day === i);
      if (log?.status === 'missed' || (!log && e.status === 'canceled') || lostDay(e, i)) continue;
      return { label: d.label, approved: e.school === 'approved' };
    }
  }
  for (const o of pro.opportunities) {
    const t = projectById(o.projectId);
    if (!t) continue;
    for (const r of o.rounds ?? []) {
      if (r.form !== 'in-person' || r.status === 'missed' || (r.status === 'set' && o.status !== 'audition' && o.status !== 'callback')) continue;
      const away = tripMinutes(person.currentLocationId, t.place.cityId) * MIN;
      if (when >= r.at - away && when <= r.at + (roundMinutes(r) * MIN) + away) return { label: `${ROUND_WORDS[r.round].name}: ${t.role.part}`, approved: false };
    }
  }
  // A meeting with an agent's office, its hour and the trip each way as `scheduleMeeting` puts them on the calendar; by
  // video, its hour alone. From 2026-10-21 (brief 19's J6, found by the built-app walk): until then a student at a
  // meeting in New York at eleven was counted at a New Haven class the same hour.
  for (const [agentId, rel] of Object.entries(pro.relations)) {
    const m = rel.meeting;
    if (!m || m.status === 'missed') continue;
    const away = (m.where === 'office' ? TRAVEL_MINUTES[person.currentLocationId] ?? 0 : 0) * MIN;
    if (when >= m.at - away && when <= m.at + AGENT_TIMES.meetingMinutes * MIN + away) {
      const agent = agentById(agentId);
      return { label: `Meeting At ${agent ? agencyOf(agent).name : 'An Agent’s Office'}`, approved: false };
    }
  }
  return undefined;
}

/**
 * The career commitment the actor went to across a window, where there is one, said as a sentence names it: an audition
 * or callback in person they were at (its round done), or a meeting they kept at an agent's office, each with its trip
 * each way from home as the calendar puts it, or a meeting by video, its hour alone. Each trip is from home and back,
 * so two whose windows meet can't both be gone to, and the one the clock reached first is the one gone to: the
 * audition's handler and the meeting's read this before they judge or keep anything. From 2026-10-21 (the app's second
 * walk): until then an actress was judged at two auditions at 11 AM the same day, one in Hudson and one in Brooklyn,
 * though the notice that set the second said it clashed with the first, and a meeting at an audition's hour was kept too.
 */
export function attendedAcross(person: Person, from: Instant, to: Instant, except?: string): string | undefined {
  const pro = person.pro;
  if (!pro) return undefined;
  for (const o of pro.opportunities) {
    const t = projectById(o.projectId);
    if (!t || o.id === except) continue;
    const away = tripMinutes(person.currentLocationId, t.place.cityId) * MIN;
    for (const r of o.rounds ?? []) {
      if (r.form === 'in-person' && r.status === 'done' && r.at - away < to && r.at + roundMinutes(r) * MIN + away > from) return `the ${ROUND_WORDS[r.round].noun} for ${t.role.part} in ${t.place.city}`;
    }
  }
  for (const [agentId, rel] of Object.entries(pro.relations)) {
    const m = rel.meeting;
    if (!m || m.status !== 'kept' || m.id === except) continue;
    const away = (m.where === 'office' ? TRAVEL_MINUTES[person.currentLocationId] ?? 0 : 0) * MIN;
    if (m.at - away < to && m.at + AGENT_TIMES.meetingMinutes * MIN + away > from) {
      const agent = agentById(agentId);
      return `the meeting with ${agent ? `${agent.name}’s office` : 'an agent’s office'}`;
    }
  }
  return undefined;
}

/**
 * The career's commitments on the calendar that can't both be gone to: an audition in person and a meeting. Read when
 * it's called, never at this module's load: `proagent.ts` imports `school.ts`, which imports this module, which imports
 * `proagent.ts`, so in the built app this module can load before `MEETING_KIND` exists. From 40eab86a it was a Set
 * made at load, and the built app was blank on every page (`Cannot access … before initialization`), which the suite,
 * loading the modules in another order, didn't see; the app's fifth walk found it, the same day.
 */
const careerStop = (kind: string): boolean => kind === AUDITION_KIND || kind === MEETING_KIND;
/** A commitment's window, its trip each way included, as the calendar puts it (`travelMinutes`, `durationMinutes`). */
const windowOf = (i: ScheduledItem): readonly [Instant, Instant] => [i.at - (i.travelMinutes ?? 0) * MIN, i.at + ((i.durationMinutes ?? 0) + (i.travelMinutes ?? 0)) * MIN];

/**
 * The career commitments at or after one on the calendar whose windows meet its own, so that going to it misses them
 * (`attendedAcross`): an audition in person or a meeting, the same person's, among the calendar's pending items or a
 * list given (On The Way's, whose foreseen items aren't on it yet). From 2026-10-21 (the app's fourth walk): until then
 * the stop at the first of two auditions at 11 AM said nothing of the second, and On The Way said the clock stops at
 * each, where the second was missed with no stop and only Settled said so.
 */
export function careerClashes(sim: Simulation, item: ScheduledItem, among?: readonly ScheduledItem[]): ScheduledItem[] {
  if (!careerStop(item.kind)) return [];
  const [from, to] = windowOf(item);
  return (among ?? sim.universe.scheduled.filter((i) => i.status === 'pending')).filter((i) => {
    if (i.id === item.id || !careerStop(i.kind) || i.payload.personId !== item.payload.personId || i.at < item.at) return false;
    const [a, b] = windowOf(i);
    return a < to && b > from;
  });
}

/**
 * The booked work day whose own hours an audition in person at a moment would fall in: a live engagement's day, not
 * already missed, overlapping the round's half hour. The actor is at work then, so the round can't be gone to (from
 * 2026-10-21, brief 19's playthroughs: a callback set inside a shoot day's hours was gone to and judged as if the actor
 * had left the set for it, though the notice that set it had said it clashed with the shoot). A day missed is no longer
 * where the actor is, as `awayAt` reads it for the School: a stage actor who slept through a rehearsal's start can go
 * to an audition in its hours (a screen day missed replaces the actor, and the engagement's days go with it).
 */
export function workDayAt(person: Person, at: Instant, minutes: number = WORK.auditionMinutes): { label: string; from: Instant } | undefined {
  const end = at + minutes * MIN;
  for (const e of person.pro?.engagements ?? []) {
    if (!live(e)) continue;
    for (let i = 0; i < e.days.length; i += 1) {
      const d = e.days[i]!;
      if (d.from < end && d.to > at && e.log?.find((l) => l.day === i)?.status !== 'missed') return { label: d.label, from: d.from };
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
  // Abroad, the whole trip is away from the School (from 2026-10-23, the owner's brief 25, W8): its class days and calls.
  const away = spansOf(person, t, days);
  const calls = schoolCallsOn(sim, person, away, t.place.cityId).filter((i) => i.kind === CALL_KIND);
  const classes = classDaysIn(person, away, t.place.cityId);
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

/** Whether a recurring part still waits on the production's word on a further episode, so its work isn't over at its last day booked. */
export const episodesPending = (e: Engagement): boolean => clauseOf(e.contract, 'episodes')?.further.some((f) => f.status === 'pending') ?? false;

/** Another booking on the same days: a live engagement with a day inside the work's span. */
export function bookedClash(person: Person, days: readonly { from: Instant; to: Instant }[], except?: string): { label: string; from: Instant } | undefined {
  for (const e of person.pro?.engagements ?? []) {
    if (!live(e) || e.opportunityId === except) continue;
    for (const [i, x] of e.days.entries()) if (!lostDay(e, i) && days.some((d) => x.from < d.to && x.to > d.from)) return { label: x.label, from: x.from };
  }
  // A recall after the wrap holds its hours too (from 2026-10-25, brief 27's K5): a looping session, a reshoot day or a
  // pickup session set and not yet gone to. Until then an offer on the same day was taken without a word.
  for (const e of person.pro?.engagements ?? []) {
    if (e.opportunityId === except || e.status === 'canceled') continue;
    const t = projectById(e.projectId);
    const recalls = [
      ...(e.loop?.status === 'set' ? [{ from: e.loop.at, to: e.loop.at + AFTER_WRAP.loopHours * MS_HOUR, label: `${t?.project ?? 'Your Work'}: Looping Session` }] : []),
      ...(e.further?.status === 'set' ? [{ from: e.further.at, to: e.further.at + furtherHours(e.further.kind) * MS_HOUR, label: `${t?.project ?? 'Your Work'}: ${e.further.kind === 'reshoot' ? 'Reshoot Day' : 'Pickup Session'}` }] : []),
    ];
    for (const x of recalls) if (days.some((d) => x.from < d.to && x.to > d.from)) return { label: x.label, from: x.from };
  }
  // A trip abroad holds every day from its first leg to its last (from 2026-10-23, the owner's brief 25, W8).
  const exceptEngagement = person.pro?.engagements.find((e) => e.opportunityId === except)?.id;
  for (const x of tripSpans(person, exceptEngagement)) if (days.some((d) => x.from < d.to && x.to > d.from)) return { label: x.label, from: x.from };
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
  const clash = bookedClash(person, spansOf(person, t, datesOf(o)), o.id);
  if (clash) out.push(`You’re booked for ${clash.label} on ${formatDate(clash.from, NY)}, one of the same days.`);
  if (abroad(person, t)) {
    const read = abroadRead(person, countryOfProject(t), datesOf(o), undefined, at);
    if (read.basis === 'abroad-unsupported') out.push(read.words);
  }
  return out;
}

/**
 * The materials a submission for the project sends, and what's wrong with them (`materialsCheck`, the stage's, the
 * screen's or, for voice work, the voice's from 2026-10-24), with whether each stops the submission: what the core
 * counts as blocking, and a missing reel or voice demo where the casting office asks for one with every submission.
 */
export function materialProblems(person: Person, t: ProjectTemplate, at: Instant): (MaterialProblem & { stops: boolean })[] {
  return materialsCheck(person, t.medium === 'stage' ? 'stage' : voiceOnly(t) ? 'voice' : 'screen', at).map((p) => {
    const asked = (p.kind === 'reel' || p.kind === 'demo') && p.problem === 'missing' && t.requirements.sends.includes(p.kind);
    if (asked && p.kind === 'demo') {
      const heard = demoSources(person, at).length;
      return { ...p, stops: true, words: `${castingAs(t)} ${agrees(t, 'asks', 'ask')} for a voice demo with every submission, and you have none. ${heard ? `You have ${counted(heard, 'recording')} of your voice to mix a demo from: press Mix A Voice Demo on the Career screen’s Portfolio tab.` : 'You have nothing of your voice recorded yet: tape a voice brief on the Player Profile first.'}` };
    }
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
  // A booked part prepares as its workflow does (from 2026-10-24, brief 25's Module 5): its own step, and only the
  // three it reads, so a voice part has no lines to learn by heart.
  if ('engagement' in x) {
    const flow = workflowOf(projectById(x.engagement.projectId)!);
    if (step === 'special') {
      const sp = flow.prep.special;
      if (!sp) return 'This work has no preparation of its own beyond the part.';
      if (sp.onlyWithCrew) return `${sp.label} happens only on the work’s own rehearsal days, with the stunt coordinator, never alone.`;
      if ((x.engagement.prep?.special ?? 0) >= 0.97) return 'You’ve done all this step can do.';
      if (person.awakeSince !== undefined && person.awakeSince > sim.now) return 'You’re asleep.';
      if (sp.feet) {
        if (person.wellbeing.energy < SPENT) return 'You’re too tired to work on your feet. Sleep first.';
        const hurt = trainingRefusal(person, sim.now);
        if (hurt) return hurt;
      }
      return startRefusal(sim, person, sp.minutes, true);
    }
    if (BRIEF.steps[step as BriefStep] && !flow.prep.steps.includes(step as BriefStep)) return step !== 'lines' ? 'This work doesn’t ask for that step.' : voiceOnly(projectById(x.engagement.projectId)!) ? 'There are no lines to learn by heart: the script is on the stand in the booth.' : 'This part has no lines to learn.';
  }
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
      if (!clashesAt(sim, person, at - away * MIN, roundMinutes(r) + 2 * away, ownItem?.id).length) return at;
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
  const t = projectOf(o);
  if (abroad(person, t)) {
    // Work abroad reads the country's permission (from 2026-10-23, the owner's brief 25, W2 and W4): a country whose
    // rules aren't in the game refuses it; one whose visa is applied for once the contract exists lets the contract be
    // made, and the visa is checked again at the first departure. US permission isn't asked: the work isn't in the US.
    const read = abroadRead(person, countryOfProject(t), days, undefined, sim.now);
    if (read.basis === 'abroad-unsupported') return read.words;
    if (!passportOf(person, tripWindow(planTrip(person.currentLocationId, t.place.cityId, days)?.legs ?? [])?.to ?? days[days.length - 1]!.to)) return `Work in ${t.place.city} needs a passport in force until you’re home. Papers shows yours.`;
  } else {
    // Permission to work for every one of its days (`usWorkAuthorized`, brief 19's D8): read, never worked out here. Each
    // day whole, its start and its end, as the work day reads it when it comes (`workAuthorizedFor`, from 2026-10-22, the
    // owner's brief 22): until then its start alone.
    const bad = days.find((d) => !workAuthorizedFor(person, d));
    if (bad) return `${eligibilityOf(person, bad.from).words} That rules out work on ${formatDate(bad.from, NY)}.`;
  }
  // And SAG-AFTRA's membership from the 30th day after a first job of its (the pay's `sagWorkRefusal`, wired at the merge,
  // 2026-10-21). The pay's `workEligibilityRefusal` was wired here too and came out the same day: it refuses where a date
  // fails `usWorkAuthorized`, the check just above, so it never refused (its mutation survived); what it reads is kept
  // on the engagement by `schedulePay`.
  if (t.union === 'sag-aftra') {
    const sag = sagWorkRefusal(person, days, NY);
    if (sag) return sag;
  }
  const away = spansOf(person, t, days);
  const clash = bookedClash(person, away, o.id);
  if (clash) return `You’re booked for ${clash.label} on ${formatDate(clash.from, NY)}, so you can’t take this as well.`;
  // Out of term the work is yours, unless the School holds you for one of its calls on those days.
  if (!inSessionAny(person, away)) {
    const held = schoolCallsOn(sim, person, away, t.place.cityId)[0];
    if (held) return `The School holds you for ${held.label} on ${formatDate(held.at, NY)}, so you can’t take work then.`;
  }
  return undefined;
}

/** What accepting would bring with the School, said before it's pressed: work in term without approval, and the class days. */
export function acceptWarning(sim: Simulation, person: Person, o: Opportunity): string | undefined {
  const days = datesOf(o);
  const school = schoolWarning(sim, person, o, days);
  const trip = abroadWarning(sim, person, o, days);
  const held = holdWarning(person, o, days);
  return [held, trip, school].filter(Boolean).join(' ') || undefined;
}

// ---------------------------------------------------------------------------------------------------------------------
// Holds (from 2026-10-25, the owner's brief 27, loop 20; `HOLD`)
// ---------------------------------------------------------------------------------------------------------------------

/** The days a part holds: its work, and a trip's days away where it travels. */
const heldSpans = (person: Person, o: Opportunity) => spansOf(person, projectOf(o), datesOf(o));
const overlaps = (a: readonly { from: Instant; to: Instant }[], b: readonly { from: Instant; to: Instant }[]) => a.some((x) => b.some((y) => x.from < y.to && x.to > y.from));

/** Whether a part's hold on the actor's dates still stands: put on, and the part not yet settled. */
export const holding = (o: Opportunity): boolean => o.hold?.status === 'held' && (o.status === 'audition' || o.status === 'callback' || o.status === 'offered');

/** The actor's other parts whose holds stand on any of these days. */
export function holdsOn(person: Person, days: readonly { from: Instant; to: Instant }[], except?: string): Opportunity[] {
  return (person.pro?.opportunities ?? []).filter((x) => x.id !== except && holding(x) && overlaps(heldSpans(person, x), days));
}

/** The offers standing on a held part's days, the soonest to lapse first: what its production is asked to decide against. */
export function offersAgainst(person: Person, o: Opportunity): Opportunity[] {
  const held = heldSpans(person, o);
  return (person.pro?.opportunities ?? [])
    .filter((x) => x.id !== o.id && x.status === 'offered' && x.offer && overlaps(spansOf(person, projectOf(x), datesOf(x)), held))
    .sort((a, b) => a.offer!.until - b.offer!.until);
}

/** A hold's days as a player reads them: "from June 3 to June 9". */
const holdSpanWords = (o: Opportunity): string => {
  const days = datesOf(o);
  return days.length === 1 ? `on ${formatDate(days[0]!.from, NY)}` : `from ${formatDate(days[0]!.from, NY)} to ${formatDate(days[days.length - 1]!.from, NY)}`;
};

/** When the production answers an ask to decide: the next afternoon at three. */
export const holdAnswerAt = (now: Instant): Instant => dayAt(addDays(now, 1, NY), HOLD.answerHour);

/** What accepting an offer does to the parts holding its days, said before it's pressed. */
function holdWarning(person: Person, o: Opportunity, days: readonly WorkDay[]): string | undefined {
  const held = holdsOn(person, spansOf(person, projectOf(o), days), o.id);
  if (!held.length) return undefined;
  return held.map((x) => {
    const h = projectOf(x);
    return x.status === 'offered'
      ? `The offer for ${h.role.part} in ${h.project} is on some of the same days, and ${h.casting} ${agrees(h, 'holds', 'hold')} them. Accepting this declines it.`
      : `${castingAs(h)} ${agrees(h, 'holds', 'hold')} some of the same days for ${h.role.part} in ${h.project} until the part is cast. Accepting this lets that hold go and withdraws you from the part; Ask Them To Decide, on that part, asks ${h.casting} to book you or let you go first.`;
  }).join(' ');
}

/** Why the production can't be asked to decide on a held part now, or nothing. */
export function holdAskRefusal(sim: Simulation, person: Person, o: Opportunity | undefined): string | undefined {
  if (!o || !holding(o)) return 'No hold stands on your dates for this part.';
  const t = projectOf(o);
  if (o.status === 'offered') return `${castingAs(t)} ${agrees(t, 'has', 'have')} decided: the offer stands, to accept or decline.`;
  if (o.hold!.asked) return `You’ve asked; the answer comes on ${formatWeekdayDate(o.hold!.asked.answerAt, NY)} at ${formatTime(o.hold!.asked.answerAt, NY)}.`;
  const against = offersAgainst(person, o)[0];
  if (!against) return 'No other offer stands on these days, so there’s nothing to ask the production to decide against.';
  const answerAt = holdAnswerAt(sim.now);
  if (against.offer!.until <= answerAt) return `The offer for ${projectOf(against).role.part} lapses on ${formatDate(against.offer!.until, NY)} at ${formatTime(against.offer!.until, NY)}, before ${t.casting} could answer, so it’s a choice between them now.`;
  return undefined;
}

/** A hold put on: its days and its terms in the history, and the notice's sentence saying it. */
function placeHold(sim: Simulation, person: Person, o: Opportunity): string {
  const t = projectOf(o);
  const days = datesOf(o);
  o.hold = { at: sim.now, from: days[0]!.from, to: days[days.length - 1]!.to, status: 'held' };
  const span = holdSpanWords(o);
  note(sim, person, o, { kind: 'callback', key: 'hold:set', words: `${castingAs(t)} put a hold on your dates for ${t.role.part}, ${span}, until the part was cast. It booked nothing and paid nothing.` });
  const against = offersAgainst(person, o)[0];
  return ` ${castingAs(t)} ${agrees(t, 'puts', 'put')} a hold on your dates, ${span}, until the part is cast: it asks you to keep those days free, and it isn’t a booking and pays nothing.${against ? ` The offer for ${projectOf(against).role.part} is on some of the same days: accepting it lets this hold go, and Ask Them To Decide on the Opportunities tab asks ${t.casting} to book you or let you go first.` : ''}`;
}

/** The notice's sentence when a part ends while its hold stands. */
const holdGone = (o: Opportunity): string => (holding(o) ? ' The hold on your dates is let go.' : '');

/** A held part let go: its rounds and offer off the clock, and settled with the words. */
function letGo(sim: Simulation, person: Person, o: Opportunity, status: Opportunity['status'], words: string): void {
  sim.timeline.cancelFor('pro.opportunity', o.id, sim.now);
  sim.timeline.cancelFor('pro.offer', o.id, sim.now);
  note(sim, person, o, { kind: status === 'declined' ? 'declined' : status === 'passed' ? 'passed' : 'ended', key: 'hold:let-go', words });
  settle(sim, person, o, status, words);
}

/**
 * What accepting work abroad brings, said before it's pressed (from 2026-10-23, the owner's brief 25, W4): the dates
 * away, the production's arrangements, and the permission the work needs, which accepting doesn't give.
 */
function abroadWarning(sim: Simulation, person: Person, o: Opportunity, days: readonly WorkDay[]): string | undefined {
  const t = projectOf(o);
  if (!travels(person, t)) return undefined;
  const span = tripWindow(planTrip(person.currentLocationId, t.place.cityId, days)?.legs ?? []);
  const away = span ? `You’d be away from ${formatDate(span.from, NY)} to ${formatDate(span.to, NY)}. ` : '';
  // A trip in the US (Module 2, C10) says the days away and the production's arrangements; its permission is the US rule
  // acceptance already reads, so there's no permit to warn of.
  if (!abroad(person, t)) return `This work is in ${t.place.city}. ${away}${t.trip!.words}`;
  const read = abroadRead(person, countryOfProject(t), days, undefined, sim.now);
  const permit = read.basis === 'abroad-needed' ? `${read.words} Accepting is the contract, not permission to work: without the visa in force at your first flight, you can’t go, and the production releases you.` : read.words;
  return `This work is in ${t.place.city}. ${away}${t.trip!.words} ${permit}`;
}

/** What accepting would bring with the School and OPT, said before it's pressed. */
function schoolWarning(sim: Simulation, person: Person, o: Opportunity, days: readonly WorkDay[]): string | undefined {
  // OPT's days without work running out before the work begins (from 2026-10-22, the owner's brief 22): a booking
  // isn't employment until its first day (`employmentSpan`), so the days waiting for it count against OPT. Said before
  // Accept is pressed, as the School's rule below is; the work system releases the part if it comes to that.
  const runsOut = optRunsOut(person);
  if (runsOut !== undefined && days[0] && runsOut <= days[0].from) return `Your OPT’s ${WORK_RULES.opt.unemploymentDays} days without work run out on ${formatDate(runsOut - 1, OPT_ZONE)}, before this work begins on ${formatDate(days[0].from, NY)}, and a job counts as work only from its first day. Unless other work begins first, your OPT ends then, and with it this part.`;
  const t = projectOf(o);
  const away = spansOf(person, t, days);
  if (!inSessionAny(person, away)) return undefined;
  const req = requestFor(person, o);
  if (req?.status === 'approved') return 'The dean approved this work in term, so its class days are excused.';
  const classes = classDaysIn(person, away, t.place.cityId);
  // Any call of the School's the work takes, a showcase's as much as a production's (the dean's condition reads the
  // production calls alone, as the Bulletin ranks them).
  const call = schoolCallsOn(sim, person, away, t.place.cityId)[0];
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

/**
 * What a project is, said in a phrase: "a fictional Off-Broadway play", or, for a part drawn from a real production
 * (from 2026-10-23, brief 25's Module 2, C8), "a network television drama on ABC, in a part the game made up".
 */
export function kindPhrase(t: ProjectTemplate): string {
  if (!t.drawn) return `a fictional ${KIND_WORDS[t.kind]}`;
  const p = productionById(t.drawn.production);
  const on = p ? companiesAs(p, 'broadcaster')[0] ?? companiesAs(p, 'streaming-platform')[0] : undefined;
  return `a ${KIND_WORDS[t.kind]}${on ? ` on ${on}` : ''}, in a part the game made up`;
}

/**
 * A drawn part's notice (Module 2, C8), said on the role, the offer and the engagement: the game's own, not a casting
 * notice. Until the text pass of 2026-10-24 it said "the game's own part, for a season after its tenth of 9-1-1 as the
 * game imagines it", which the role's card had just called "a part the game made up", and the season came before its
 * series.
 */
export const drawnWords = (t: ProjectTemplate): string | undefined => (t.drawn
  ? `${t.role.part} is the game’s own character, in ${t.drawn.season}. It isn’t a real casting notice, and no one at the real production is casting it. ${t.drawn.placeWhy}`
  : undefined);

/** The role as a sentence names it: "Nell in A House On Calder Street, a fictional Off-Broadway play". */
export const roleWords = (t: ProjectTemplate): string => `${t.role.part} in ${t.project}, ${kindPhrase(t)}`;

/**
 * How the work is reached, in a sentence: a day's travel each way, or the trip the production books, door to door (from
 * 2026-10-23, brief 25's Module 2: until then the role's notice gave a day's travel for any work, "about 3 hours each
 * way" to Sydney).
 */
export function reachWords(person: Person, t: ProjectTemplate, days: readonly { from: Instant; to: Instant }[]): string {
  if (!travels(person, t)) return `Getting there takes about ${counted(Math.round(tripMinutes(person.currentLocationId, t.place.cityId) / 60), 'hour')} each way from where you live.`;
  const out = planTrip(person.currentLocationId, t.place.cityId, days)?.legs.filter((l) => l.way === 'out') ?? [];
  const hours = out.length ? Math.round((out[out.length - 1]!.arrives - out[0]!.departs) / MS_HOUR) : 0;
  return `It’s a trip the production books: about ${counted(hours, 'hour')} door to door each way, by car and by air, landing at least ${TRIP.arriveBeforeHours} hours before the first call.`;
}

/** The casting office as a sentence's subject: capitalized to start one ("The producers"), and its verb agreeing with it. */
export const castingAs = (t: ProjectTemplate): string => t.casting.charAt(0).toUpperCase() + t.casting.slice(1);
export const agrees = (t: ProjectTemplate, one: string, many: string): string => (/\bproducers$/i.test(t.casting) ? many : one);

// ---------------------------------------------------------------------------------------------------------------------
// The loop's steps
// ---------------------------------------------------------------------------------------------------------------------

/** A role posted to the actor at a Monday's posting: openly, or through the agent under the agreement in force. */
function post(sim: Simulation, person: Person, t: ProjectTemplate, at: Instant, via: 'agent' | 'open'): Opportunity | undefined {
  const pro = ensurePro(sim, person);
  if (pro.opportunities.some((o) => o.projectId === t.id && o.postedAt === at)) return undefined;
  const agreement = via === 'agent' ? activeAgreement(person, at) : undefined;
  // A part posted before is posted again as a new casting of it, with what came of it the last time (from 2026-10-21,
  // brief 20's D4: until then its words were the first posting's, as if it had never come).
  const last = lastPostingOf(person, t, at);
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId: t.id, via, status: 'open', postedAt: at, submitBy: addDays(at, WORK.submitDays, NY), history: [], counts: {},
    ...(agreement ? { agentId: agreement.agentId, agreementId: agreement.id } : {}),
    ...(last ? { again: { postedAt: last.postedAt, status: last.status, ...(last.outcome ? { outcome: last.outcome } : {}) } } : {}),
  };
  pro.opportunities.push(o);
  // A slate part is kept in the save as it was posted (from 2026-10-24, brief 27), and never posted again as new, so it
  // needs no last-posted record; a fixed part keeps one, as it comes round.
  if (t.slate) keepProject(person, t, t.series ? seriesById(t.series) : undefined);
  else (pro.lastPosted ??= {})[t.id] = { id: o.id, postedAt: at, status: 'open' };
  const agent = agentFor(o);
  const again = o.again ? ` again, a new casting of the part. ${lastTimeWords(o.again)}` : '.';
  // A casting office named by its role ("the production’s casting office", a part drawn from a real production) takes no
  // second possessive: until 2026-10-24 it read "The production’s casting office’s breakdown for Reese Pike".
  const breakdown = t.casting.startsWith('the ') ? `The breakdown for ${t.role.part} in ${t.project}, from ${t.casting},` : `${castingAs(t)}’s breakdown for ${t.role.part} in ${t.project}`;
  note(sim, person, o, { kind: 'opportunity', key: 'posted', words: agent ? `${breakdown} came to ${agent.name}${again}` : `${castingAs(t)} posted ${t.role.part} in ${t.project}${again}` });
  return o;
}

/** Each material as a sentence names it. */
const MATERIAL_WORDS: Record<MaterialKind, string> = { headshot: 'headshots', resume: 'résumé', reel: 'reel', demo: 'voice demo' };

/** A submission made, by the player or the agent: what it sent noted, and the casting office's answer on the clock. */
function submit(sim: Simulation, person: Person, o: Opportunity): void {
  const t = projectOf(o);
  // Voice work sends the voice demo where screen work sends the reel (from 2026-10-24, brief 27); until then every part
  // not on stage sent the reel, which a voice recording can't go on.
  const voice = voiceOnly(t);
  const kinds = (['headshot', 'resume', 'reel', 'demo'] as const).filter((k) => (voice ? k !== 'reel' && (t.requirements.sends.includes(k) || k === 'demo') : k !== 'demo' && (t.requirements.sends.includes(k) || (k === 'reel' && t.medium !== 'stage'))));
  o.sent = kinds.map((k) => currentOf(person.pro, k)).filter((m) => m !== undefined).map((m) => ({ kind: m.kind, id: m.id, made: m.made }));
  o.status = 'submitted';
  const sent = o.sent.map((m) => `your ${MATERIAL_WORDS[m.kind]} from ${formatDate(m.made, NY)}`);
  const agent = agentFor(o);
  const words = `${agent ? `${agent.name} submitted you` : 'You submitted yourself'} for ${t.role.part} in ${t.project}, sending ${spokenList(sent)}.`;
  note(sim, person, o, { kind: 'submitted', key: 'submitted', words });
  if (agent) tell(sim, person, `Submitted For ${t.role.part}`, `${words}${o.again ? ` ${againWords(o)}` : ''} ${castingAs(t)} ${agrees(t, 'answers', 'answer')} on ${formatWeekdayDate(dayAt(addDays(sim.now, WORK.replyDays, NY), WORK.replyHour), NY)}.`, 60);
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
  tell(sim, person, `Not Submitted For ${t.role.part}`, `${words} ${agent.name} can still submit you until ${formatDate(o.submitBy, NY)}, once that’s put right.`, 70);
}

/** An opportunity settled: its status, when, the outcome in words, and the record kept to its bounds. */
function settle(sim: Simulation, person: Person, o: Opportunity, status: Opportunity['status'], outcome: string): void {
  // A hold ends with its part (`HOLD`): the booking it became, or let go with the rest, in the history either way.
  if (holding(o)) {
    o.hold!.status = status === 'booked' ? 'booked' : 'released';
    o.hold!.settled = { at: sim.now, why: outcome };
    note(sim, person, o, { kind: 'ended', key: 'hold:ended', words: status === 'booked' ? 'The hold on your dates became the booking.' : `The hold on your dates, ${holdSpanWords(o)}, was let go.` });
  }
  o.status = status;
  o.resolvedAt = sim.now;
  o.outcome = outcome;
  const last = person.pro?.lastPosted?.[o.projectId];
  if (last?.id === o.id) Object.assign(last, { status, outcome });
  sim.resolveDecision('pro.offer', o.id, 'career');
  keepBounded(ensurePro(sim, person));
}

/**
 * A round set: an audition in person on the calendar, the first weekday from four days on at eleven (a callback at
 * two), with the trip; or a self-tape due by an evening. A clash with the calendar is said with the way to move it.
 */
function setRound(sim: Simulation, person: Person, o: Opportunity, which: Round): AuditionRound {
  const t = projectOf(o);
  // A chemistry read and a screen test are always in person (from 2026-10-24, brief 27): the actors already cast, the set.
  const later = which === 'chemistry' || which === 'test';
  const form = later ? 'in-person' : t.stages.audition;
  const at = later
    ? weekdayFrom(addDays(sim.now, which === 'chemistry' ? WORK.chemistryLeadDays : WORK.testLeadDays, NY), which === 'chemistry' ? WORK.chemistryHour : WORK.testHour)
    : form === 'in-person'
      ? weekdayFrom(addDays(sim.now, which === 'audition' ? WORK.auditionLeadDays : WORK.callbackLeadDays, NY), which === 'audition' ? WORK.auditionHour : WORK.callbackHour)
      : dayAt(addDays(sim.now, which === 'audition' ? WORK.tapeDays : WORK.callbackTapeDays, NY), WORK.tapeHour);
  const r: AuditionRound = { round: which, form, at, status: 'set' };
  const rounds = (o.rounds ??= []);
  rounds.push(r);
  const idx = rounds.length - 1;
  // Every round after the first is under way as a callback is: the opportunity's status says how far it's come, the round which.
  o.status = which === 'audition' ? 'audition' : 'callback';
  const trip = tripMinutes(person.currentLocationId, t.place.cityId);
  const name = ROUND_WORDS[which].name;
  let itemId: string | undefined;
  if (form === 'in-person') {
    itemId = sim.schedule({
      at, kind: AUDITION_KIND, label: `${name}: ${t.role.part}, ${t.project}`, category: 'career', priority: 40, requiresPlayer: true,
      durationMinutes: roundMinutes(r), travelMinutes: trip, locationId: t.place.cityId, refType: 'pro.opportunity', refId: o.id,
      payload: { personId: person.id, opportunityId: o.id, round: idx },
    }).id;
  } else {
    sim.schedule({ at, kind: TAPE_DUE_KIND, label: `Self-Tape Due: ${t.role.part}, ${t.project}`, category: 'career', priority: 40, refType: 'pro.opportunity', refId: o.id, payload: { personId: person.id, opportunityId: o.id, round: idx } });
  }
  const when = `${formatWeekdayDate(at, NY)} at ${formatTime(at, NY)}`;
  const clash = form === 'in-person' ? clashesAt(sim, person, at - trip * MIN, roundMinutes(r) + 2 * trip, itemId) : [];
  const words = which === 'chemistry'
    ? `${castingAs(t)} ${agrees(t, 'wants', 'want')} you to read with the actors already cast in ${t.project}, a chemistry read for ${t.role.part}: ${t.place.venue} in ${t.place.city}, ${when}, for an hour. Getting there takes about ${hoursWords(trip)} each way.`
    : which === 'test'
      ? `${castingAs(t)} ${agrees(t, 'wants', 'want')} to screen-test you for ${t.role.part} in ${t.project}, filmed in costume and makeup: ${t.place.venue} in ${t.place.city}, ${when}, for five hours. Getting there takes about ${hoursWords(trip)} each way.`
      : form === 'in-person'
    ? `${castingAs(t)} ${agrees(t, 'wants', 'want')} to see you${which === 'callback' ? ' again' : ''} for ${t.role.part} in ${t.project}: ${t.place.venue} in ${t.place.city}, ${when}. Getting there takes about ${hoursWords(trip)} each way.`
    : `${castingAs(t)} ${agrees(t, 'asks', 'ask')} for a self-tape${which === 'callback' ? ' for the callback' : ''} for ${t.role.part} in ${t.project}, due ${when}.`;
  // The history keeps it in the past, as the rest of a history is: until 2026-10-21 it kept the notice's present tense
  // ("asks for a self-tape"), among lines that said "submitted" and "was Working" (brief 19's app walk).
  const noted = which === 'chemistry'
    ? `${castingAs(t)} asked you to read with the actors already cast in ${t.project}, a chemistry read for ${t.role.part}: ${t.place.venue} in ${t.place.city}, ${when}.`
    : which === 'test'
      ? `${castingAs(t)} asked to screen-test you for ${t.role.part} in ${t.project}: ${t.place.venue} in ${t.place.city}, ${when}.`
      : form === 'in-person'
    ? `${castingAs(t)} asked to see you${which === 'callback' ? ' again' : ''} for ${t.role.part} in ${t.project}: ${t.place.venue} in ${t.place.city}, ${when}.`
    : `${castingAs(t)} asked for a self-tape${which === 'callback' ? ' for the callback' : ''} for ${t.role.part} in ${t.project}, due ${when}.`;
  note(sim, person, o, { kind: which === 'audition' ? 'audition' : 'callback', key: `${which}:set`, words: noted });
  const next = form === 'in-person' ? 'Prepare the sides on the Career screen’s Opportunities tab before you go.' : 'Prepare the sides, then press Tape It on the Career screen’s Opportunities tab.';
  const clashWords = clash.length ? ` It clashes with ${spokenList(clash)}. To ask for another time, press Ask For Another Time on the Opportunities tab, at least a day ahead. Casting moves it once.` : '';
  // A chemistry read or a screen test brings a hold on the part's days, once (from 2026-10-25, brief 27, loop 20; `HOLD`).
  const holdWords = later && !o.hold ? placeHold(sim, person, o) : '';
  const agent = agentFor(o);
  tell(sim, person, later ? `A ${ROUND_WORDS[which].name} For ${t.role.part}` : which === 'callback' ? `A Callback For ${t.role.part}` : form === 'in-person' ? `An Audition For ${t.role.part}` : `A Self-Tape For ${t.role.part}`, `${agent ? `${agent.name} passed this on: ` : ''}${words}${clashWords}${holdWords} ${next}`, 80);
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
  // Knowing the genre, in the room as on tape (from 2026-10-22, the owner's brief 21: until then an audition in person
  // read none of it, `TASK_PROFILES.audition`).
  prep.genre = fitOf(person, t).genre * BRIEF.complete.genre;
  required.genre = BRIEF.complete.genre;
  return {
    task: r.round === 'chemistry' ? TASK_PROFILES.chemistry! : r.round === 'test' ? TASK_PROFILES.screenTest! : r.form === 'self-tape' ? TASK_PROFILES.tape! : TASK_PROFILES.audition!,
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
  const name = ROUND_WORDS[r.round].name;
  recordWork(sim, person, e, { at: sim.now, what: `${t.role.part}, ${t.project}: ${name}${r.form === 'self-tape' ? ', Taped' : ''}`, band: r.band });
  note(sim, person, o, { kind: r.round === 'audition' ? 'audition' : 'callback', key: `${r.round}:done`, words: `Your ${r.form === 'self-tape' ? 'self-tape' : ROUND_WORDS[r.round].noun} for ${t.role.part} was ${BAND_LABEL[r.band]}.` });
  const cut = nextRound(t, r.round) !== undefined;
  const base = Math.max(sim.now, r.at);
  sim.schedule({
    at: dayAt(addDays(base, cut ? WORK.cutDays : WORK.decisionDays, NY), WORK.decisionHour), kind: CASTING_KIND, label: `Casting Decides: ${t.role.part}`, category: 'career', priority: 40,
    refType: 'pro.opportunity', refId: o.id, payload: { personId: person.id, opportunityId: o.id, round: idx },
  });
}

/** Whether the actor is there at a moment: awake, and not in hospital or laid up (`offSick`, the School's). */
const there = (person: Person, at: Instant): boolean => !(person.awakeSince !== undefined && person.awakeSince > at) && !offSick(person, at);

/** A round missed: the opportunity lapses, said, and the problem noted, with where the actor was if it was elsewhere. */
function missRound(sim: Simulation, person: Person, o: Opportunity, r: AuditionRound, elsewhere?: string): void {
  const t = projectOf(o);
  r.status = 'missed';
  const words = r.form === 'self-tape'
    ? `Your self-tape for ${t.role.part} wasn’t in by ${formatDate(r.at, NY)} at ${formatTime(r.at, NY)}, so ${t.casting} moved on without it.`
    : elsewhere
      ? `You were ${/^(in|on) /.test(elsewhere) ? '' : 'at '}${elsewhere}, so you missed the ${ROUND_WORDS[r.round].noun} for ${t.role.part} on ${formatDate(r.at, NY)} at ${formatTime(r.at, NY)}, and ${t.casting} moved on without you.`
      : `You missed the ${ROUND_WORDS[r.round].noun} for ${t.role.part} on ${formatDate(r.at, NY)} at ${formatTime(r.at, NY)}, so ${t.casting} moved on without you.`;
  note(sim, person, o, { kind: 'problem', key: `${r.round}:missed`, words });
  const gone = holdGone(o);
  settle(sim, person, o, 'lapsed', words);
  tell(sim, person, r.form === 'self-tape' ? `Your Self-Tape For ${t.role.part} Wasn’t In` : `You Missed The ${ROUND_WORDS[r.round].name} For ${t.role.part}`, `${words}${gone}`, 75);
}

/** Casting passed: said, with where to see what went into it. */
function pass(sim: Simulation, person: Person, o: Opportunity, why: string): void {
  const t = projectOf(o);
  const gone = holdGone(o);
  note(sim, person, o, { kind: 'passed', key: 'passed', words: why });
  settle(sim, person, o, 'passed', why);
  const agent = agentFor(o);
  tell(sim, person, `Not Cast As ${t.role.part}`, `${agent ? `${agent.name} passed this on: ` : ''}${why}${gone} Casting doesn’t give its reasons. The Opportunities tab shows what went into it: your audition, the role’s fit and the field.`, 65);
}

/**
 * Whether a part reaching the actor comes as a direct offer, and why (`DIRECT`): the finished work for the same casting
 * office, judged Strong or better, the latest such, and the draw.
 */
export function directOfferFor(sim: Simulation, person: Person, t: ProjectTemplate, at: Instant): { engagementId: ProId; words: string } | undefined {
  const pro = person.pro;
  if (!pro || !t.slate || t.role.size === 'lead') return undefined;
  const before = pro.engagements
    .filter((e) => finished(e) && e.status !== 'canceled' && projectById(e.projectId)?.casting === t.casting)
    .map((e) => ({ e, band: pro.credits.find((c) => c.engagementId === e.id)?.band }))
    .filter((x): x is { e: Engagement; band: Band } => x.band !== undefined && DIRECT.bands.includes(x.band))
    .sort((a, b) => (b.e.finishedAt ?? 0) - (a.e.finishedAt ?? 0))[0];
  if (!before || sim.rng('pro.direct', dateKey(at, NY), t.id).next() >= DIRECT.chance) return undefined;
  const was = projectById(before.e.projectId)!;
  return { engagementId: before.e.id, words: `${castingAs(t)} cast you as ${was.role.part} in ${was.project}, where your work was ${BAND_LABEL[before.band]}.` };
}

/** What asking for more would ask: a fifth over the offer, in whole dollars. */
export const askedAmount = (amount: Money): Money => Math.round((amount * (1 + NEGOTIATE.ask)) / 100) * 100;

/** Why the agent can't ask for more on an offer now, or nothing (`NEGOTIATE`). */
export function askMoreRefusal(sim: Simulation, person: Person, o: Opportunity | undefined): string | undefined {
  if (!o || o.status !== 'offered' || !o.offer) return 'There’s no offer standing.';
  if (o.offer.asked) return o.offer.asked.answer ? `${agentFor(o)?.name ?? 'Your agent'} asked once already, on ${formatDate(o.offer.asked.at, NY)}.` : `${agentFor(o)?.name ?? 'Your agent'} has asked; the answer comes on ${formatWeekdayDate(o.offer.asked.answerAt, NY)} at ${formatTime(o.offer.asked.answerAt, NY)}.`;
  if (!activeAgreement(person, sim.now)) return 'An agent asks for more on your behalf, and none represents you, so the offer is as it stands.';
  if (o.offer.amount === undefined) return 'The pay is deferred, so there’s no figure to ask more of.';
  return undefined;
}

/** An offer made, on the terms the work pays: standing three days, conveyed by the agent where one represents the actor. */
function makeOffer(sim: Simulation, person: Person, o: Opportunity): void {
  const t = projectOf(o);
  const terms = payTermsOf(o);
  const until = dayAt(addDays(sim.now, WORK.offerDays, NY), WORK.offerHour);
  o.offer = { at: sim.now, until, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units, version: 1 };
  o.status = 'offered';
  // He handles the offer where an agreement's in force, the actor's own submission too: covered work is his (the
  // agreement's Exclusive and What The Agent Does, `AGREEMENT_TERMS`).
  const agreement = activeAgreement(person, sim.now);
  if (agreement && !o.agreementId) { o.agentId = agreement.agentId; o.agreementId = agreement.id; }
  // Represented, a SAG-AFTRA offer is scale plus 10%, so his commission comes out of the ten (`negotiatedAmount`,
  // `systems/propay.ts`; wired at the merge, 2026-10-21).
  if (o.offer.amount !== undefined) o.offer.amount = negotiatedAmount(o.offer.amount, t.union, o.agreementId !== undefined);
  const days = datesOf(o);
  const span = `${days.length === 1 ? `on ${formatDate(days[0]!.from, NY)}` : `from ${formatDate(days[0]!.from, NY)} to ${formatDate(days[days.length - 1]!.from, NY)}`}, in ${t.place.city}`;
  const drawn = drawnWords(t);
  // What the contract adds to the pay, said with it (from 2026-10-24, brief 25's Module 4): a day's overtime, and a
  // recurring part's episodes and option.
  const more = termsWords(t, o.offer.amount, days);
  const why = o.direct ? ` ${o.direct.words}` : '';
  const words = `${castingAs(t)} ${agrees(t, 'offers', 'offer')} you ${roleWords(t)}${o.direct ? ' without an audition' : ''}.${why} ${payWords(terms, o.offer.amount)}${more} The work is ${span}. The offer stands until ${formatDate(until, NY)} at ${formatTime(until, NY)}.${drawn ? ` ${drawn}` : ''}`;
  // In the history, past (from 2026-10-21, as the rounds' lines): the offer stood until its day, whatever came of it.
  note(sim, person, o, { kind: 'offer', key: 'offer', words: `${castingAs(t)} offered you ${roleWords(t)}${o.direct ? ' without an audition' : ''}.${why} ${payWords(terms, o.offer.amount)}${more} The work was ${span}, and the offer stood until ${formatDate(until, NY)} at ${formatTime(until, NY)}.` });
  sim.schedule({ at: until, kind: OFFER_KIND, label: `The Offer For ${t.role.part} Lapses`, category: 'career', priority: 40, refType: 'pro.offer', refId: o.id, payload: { personId: person.id, opportunityId: o.id } });
  if (person.id !== sim.universe.playerId) return;
  const agent = agentFor(o);
  const warning = acceptWarning(sim, person, o);
  sim.requireDecision({
    urgency: 80, category: 'career', title: `An Offer For ${t.role.part}`, dueAt: until, route: '/workspace/career', refType: 'pro.offer', refId: o.id,
    detail: `${agent ? `${agent.name} passed on an offer. ` : ''}${words}${warning ? ` ${warning}` : ''}`,
    actions: [
      { label: 'Accept The Offer', commandKind: 'pro.accept_offer', payload: { opportunityId: o.id } },
      { label: 'Decline The Offer', commandKind: 'pro.decline_offer', payload: { opportunityId: o.id } },
    ],
  });
}

/**
 * What a contract adds to an offer's pay, in sentences after it (from 2026-10-24, brief 25's Module 4, D3 and D7): a day
 * performer's overtime on each eleven-hour day, and a recurring part's guaranteed and expected episodes and its option.
 */
// The days' lengths are the schedule's whenever it's posted, so the words read the same without a posting's own.
export function termsWords(t: ProjectTemplate, amount: Money | undefined, days: readonly WorkDay[] = datesOf({ projectId: t.id, postedAt: 0 })): string {
  const out: string[] = [];
  // Overtime only where the days run long enough for it (from 2026-10-24, brief 25's Module 5): a booth's sessions carry none.
  const ot = Math.max(0, ...days.map((d) => overtimeHours(d)));
  if (amount !== undefined && paysOvertime(t.pay) && ot === 2) out.push(`Each shoot day runs eleven hours with an hour for lunch, so its last two hours of work are overtime at time and one-half, ${formatMoney(overtimeOf(amount), 'USD')} more a day.`);
  else if (amount !== undefined && paysOvertime(t.pay) && ot > 0) out.push(`Each day runs ten hours with an hour for lunch, so its last hour of work is overtime at time and one-half, ${formatMoney(overtimeOf(amount, ot), 'USD')} more a day.`);
  // How the work is done (Module 5), and what it asks before anyone's cast: an intimate scene.
  out.push(formatOf(t).words);
  if (t.dub) out.push(`The dub’s pay follows the agreement’s rule for replacing another actor’s lines: its ${counted(t.dub.length, 'session')} pay ${spokenList(t.dub.map((d) => counted(dubDaysOf(d), 'day')))} in turn.`);
  if (t.intimacy) out.push(intimacyWords(t));
  const s = t.series ? seriesById(t.series) : undefined;
  if (s && t.schedule.kind === 'episodes') {
    out.push(`The contract guarantees ${counted(t.schedule.guaranteed, 'episode')} of the season’s ${counted(s.episodes, 'episode')}, ${counted(s.daysEach, 'shoot day')} each, and expects you in up to ${countWords(t.schedule.expected)}: a further episode is paid the same if the production calls you for it, and one it doesn’t call you for isn’t paid.`);
    out.push(`It gives the production an option on you for next season at ${Math.round(OPTION_RAISE * 100)}% more a day, taken up or let go by June 30.`);
  }
  return out.length ? ` ${out.join(' ')}` : '';
}

/**
 * What an intimate scene asks, said before the audition and with the offer (N13 §43.A): what it is, the closed set and the
 * coordinator, and that consent is the actor's to give or not without any cost to them.
 */
export const intimacyWords = (t: ProjectTemplate): string => (t.intimacy ? `The part has ${t.intimacy.words}, shot on a closed set with an intimacy coordinator and only with your written consent. A body double can do it instead, and declining it costs you nothing in the casting.` : '');

/**
 * The promised pay, one entry for each week of work: a run's by its weeks, a shoot's by the calendar week (Sunday to
 * Saturday), each due the Thursday after the week's last day of work, at noon (ASSUMPTION, after SAG-AFTRA's "Payment is
 * due on Thursday… for work performed through the previous Saturday", representation.md S5, for every kind of work).
 * Promised only: nothing's posted and nothing's received here. A student film's is deferred. Each is keyed
 * `<engagement>:<week>`, the week counted from 1 (counted from 0 until 2026-10-21, when the pay's part said it reads
 * from 1), `promisedAt` the moment the offer was accepted, the contract date its commission reads.
 */
export function promisedPay(sim: Simulation, e: Engagement, o: Opportunity, from?: number): ProPayment[] {
  const offer = o.offer!;
  const t = projectOf(o);
  // From a day on (an episode called for later, `systems/series.ts`): only its weeks, keyed after those already promised.
  const all = payGroups(e, t);
  const groups = from === undefined ? all : all.filter((g) => g[0]! >= from);
  const first = from === undefined ? 0 : all.length - groups.length;
  return groups.map((g, w) => {
    const last = e.days[g[g.length - 1]!]!.from;
    const due = addDays(dayAt(last, 12), (4 - weekdayOf(last) + 7) % 7 || 7, NY);
    // A day performer's two hours of overtime on each day (`systems/contracts.ts`, from 2026-10-24, brief 25's Module 4,
    // D3): until then a SAG-AFTRA day was paid its day rate for eleven hours on set.
    // Overtime on each day long enough for it (from 2026-10-24, brief 25's Module 5): a booth's four hours carry none, a
    // capture day's nine one hour, a shoot day's ten two. And a dub day's pay in days by N13 Schedule A §37 (`payUnitsOf`).
    const overtime = offer.amount !== undefined && offer.per === 'day' && paysOvertime(offer.rate) ? g.reduce((n, i) => n + (lostDay(e, i) ? 0 : overtimeOf(offer.amount!, overtimeHours(e.days[i]!))), 0) : 0;
    // A weather day (from 2026-10-25, brief 27, `WEATHER_DAY`): a day lost isn't worked; a day off is paid as a day on
    // SAG-AFTRA's day rate (N13 Schedule A §4.E), with the day it was; a week only the slip made pays a fifth a day.
    const held = paysOvertime(offer.rate) ? (e.weather ?? []).filter((w) => g.includes(w.day)).length : 0;
    const added = offer.per === 'week' && (e.weather?.some((w) => w.slipped) || (e.ill?.length ?? 0) > 0) && g.every((i) => e.days[i]!.from > endOf(e));
    const units = g.reduce((n, i) => n + (lostDay(e, i) ? 0 : payUnitsOf(t, i)), 0) + held;
    const promised = (offer.amount === undefined ? 0 : offer.per === 'week' ? (added ? Math.round((offer.amount * g.length) / 5) : offer.amount) : offer.amount * units) + overtime;
    // The days it pays for go on it, so the pay reads this week, not the calendar week before its payday (from 2026-10-21).
    const week = { from: e.days[g[0]!]!.from, to: e.days[g[g.length - 1]!]!.to };
    return { id: sim.nextId('pro'), key: `${e.id}:${w + 1 + (first ?? 0)}`, promised, currency: 'USD', promisedAt: sim.now, due, week, ...(overtime ? { overtime } : {}), ...(offer.amount === undefined ? { deferred: true as const } : {}) };
  });
}

/** The end of the calendar week the work's last day fell in before any weather slipped it: the weeks after it are the slip's. */
const endOf = (e: Pick<Engagement, 'days' | 'weather' | 'ill'>): Instant => {
  const slips = (e.weather ?? []).filter((w) => w.slipped).length + (e.ill?.length ?? 0);
  let last = e.days[e.days.length - 1]?.from ?? 0;
  // Each slip moved the last day a working day on: back that many to where it was.
  for (let k = 0; k < slips; k += 1) { last = addDays(last, -1, NY); while ([0, 6].includes(weekdayOf(last))) last = addDays(last, -1, NY); }
  return addDays(dayAt(last, 12), 7 - weekdayOf(last), NY);
};

/** A day's overtime hours: those past eight of its work time, up to the two at time and one-half (`OVERTIME`). */
export const overtimeHours = (d: { from: Instant; to: Instant }): number => Math.max(0, Math.min(2, workHoursOf(d) - 8));

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

/** The work days booked on the calendar, each wanting the player, with its trip: from a day on, for an episode called for later. */
function bookDays(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, from = 0, to?: number): void {
  // Abroad, the day starts at the hotel (from 2026-10-23, the owner's brief 25, W10): the set is a short drive.
  const trip = travels(person, t) ? TRIP.hotelMinutes : tripMinutes(person.currentLocationId, t.place.cityId);
  e.days.forEach((d, i) => {
    if (i < from || (to !== undefined && i > to) || d.from <= sim.now) return;
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
  // And the play's genres known (from 2026-10-22, the owner's brief 21), as a shoot day reads them: until then a night
  // on stage read none (`TASK_PROFILES.performance`).
  if (dayKindOf(t, i) === 'performance') return { ...base, task: TASK_PROFILES.performance!, prep: { lines: p.memorization, blocking: p.rehearsal, notes: p.interpretation, genre: fitOf(person, t).genre * BRIEF.complete.genre }, required: { lines: BRIEF.complete.memorization, blocking: BRIEF.complete.rehearsal, notes: BRIEF.complete.interpretation, genre: BRIEF.complete.genre } };
  return { ...base, task: TASK_PROFILES.camera!, prep: { interpretation: p.interpretation, memorization: p.memorization, rehearsal: p.rehearsal, genre: fitOf(person, t).genre * BRIEF.complete.genre }, required: { interpretation: BRIEF.complete.interpretation, memorization: BRIEF.complete.memorization, rehearsal: BRIEF.complete.rehearsal, genre: BRIEF.complete.genre } };
}

/**
 * A rehearsal day attended: the lines and the blocking move as a School call's do (`PROCESS.call`), and the breakdown at
 * the lines' rate. The lines go faster in a project of a kind known (`genreSpeed`, the project's genres weighed), as a
 * School play's lines are (`production.ts`); the blocking and the breakdown don't, since the day's own reading of the
 * genre (`workContext`) is what knowing it does for the choices. Until 2026-10-22 (the owner's brief 21) a professional
 * rehearsal read no genre: a comedy's lines were learned as fast whether the actor had played comedy or not.
 */
export function rehearseDay(person: Person, e: Engagement, t: ProjectTemplate): void {
  const p = (e.prep ??= { ...ZERO });
  p.memorization = r3(clamp(p.memorization + PROCESS.call.lines * genreSpeed(person, projectGenresOf(t)) * (1 - p.memorization), 0, 1));
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
      // Voice work is heard, not seen (from 2026-10-24, brief 25's Module 5): its credit can't go on a reel.
      ...(voiceOnly(t) ? { voice: true as const } : {}),
    });
    e.creditId = c.id;
    // Its way out, drawn now and said when its release comes due (`RELEASE_FATE`, from 2026-10-25, brief 27).
    c.release = releaseFate(sim, t);
    const days = RELEASE_DAYS[t.kind];
    if (days) sim.schedule({ at: dayAt(addDays(sim.now, days, NY), 12), kind: RELEASE_KIND, label: `${t.project} Is Released`, category: 'career', priority: 60, refType: 'pro.credit', refId: c.id, payload: { personId: person.id, creditId: c.id } });
  } else if (e.creditId && best) {
    const c = person.pro?.credits.find((x) => x.id === e.creditId);
    if (c) c.band = best;
  }
  noteEvent(sim, e, { kind: 'worked', key: 'finished', words: `${t.medium === 'stage' ? 'The run' : 'The shoot'} of ${t.project} finished, with ${counted(e.log!.filter((l) => l.status === 'worked').length, 'day')} worked.` });
  // Television work under SAG-AFTRA carries residuals from the day it's done (`entitle`, `systems/contracts.ts`, from
  // 2026-10-24, brief 25's Module 4, D5).
  entitle(sim, person, e, t);
  // A recall to loop, and an anthology's invitation for strong work (from 2026-10-24, brief 25's Module 5, `afterWrap`).
  // A reshoot needs the actor on the set: within a day's reach of home, where the work had no trip (from 2026-10-25, brief 27's K5).
  if (t.medium !== 'stage') afterWrap(sim, person, e, t, best, (title, body) => tell(sim, person, title, body, 70), travels(person, t) ? undefined : { minutes: tripMinutes(person.currentLocationId, t.place.cityId) });
  const rel = e.agentId ? person.pro?.relations[e.agentId] : undefined;
  if (rel) noteEvent(sim, rel, { kind: 'success', key: `eng:${e.id}:finished`, words: `You finished ${t.role.part} in ${t.project}.`, ref: e.id });
  keepBounded(ensurePro(sim, person));
  tell(sim, person, t.medium === 'stage' ? `${t.project} Closed` : `You Wrapped ${t.project}`, `${t.medium === 'stage' ? `The run of ${t.project} is over` : `${t.project} wrapped`}, and ${t.role.part} is on your professional credits${t.medium === 'stage' ? '' : voiceOnly(t) ? `, not yet released. It’s your voice with no picture of you, so it can go on a voice demo and not a reel${RELEASE_DAYS[t.kind] ? `; it comes out about ${counted(Math.round(RELEASE_DAYS[t.kind]! / 30), 'month')} on, estimated` : ''}` : `, not yet released. Its footage can go on a reel once it comes out${RELEASE_DAYS[t.kind] ? `, about ${counted(Math.round(RELEASE_DAYS[t.kind]! / 30), 'month')} on, estimated` : ''}`}. Update your résumé on the Portfolio tab to add it.`, 70);
}

/** A unit as a sentence names it: "scene 14". */
const unitWord = (t: ProjectTemplate, u: { scene: number }): string => `${workflowOf(t).judged[stepOf(t, t.schedule.kind === 'shoot' ? t.schedule.rehearsalDays ?? 0 : 0)]?.unit.one ?? 'scene'} ${u.scene}`;

/** A missed work day: the project's consequence, said. The stage's understudy covers one; a second, or a shoot day, and you're replaced. */
function missDay(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, i: number, at: Instant): void {
  (e.log ??= []).push({ day: i, at, status: 'missed' });
  const misses = e.log.filter((l) => l.status === 'missed').length;
  const allowed = t.medium === 'stage' ? MISSES.stage : MISSES.screen;
  const kind = dayKindOf(t, i);
  // The day named for what it was (from 2026-10-24, brief 25's Module 5): a tape night, a recording session.
  const what = STEP_WORDS[stepOf(t, i)];
  noteEvent(sim, e, { kind: 'problem', key: `missed:${i}`, words: `You missed ${what} of ${t.project} on ${formatDate(at, NY)}.` });
  const rel = e.agentId ? person.pro?.relations[e.agentId] : undefined;
  if (rel) noteEvent(sim, rel, { kind: 'problem', key: `eng:${e.id}:missed:${i}`, words: `You missed ${what} of ${t.project}.`, ref: e.id });
  if (misses <= allowed) {
    tell(sim, person, `You Missed ${kind === 'performance' ? 'A Performance' : 'A Rehearsal'} Of ${t.project}`, `You missed ${what} of ${t.project} on ${formatDate(at, NY)}.${kind === 'performance' ? ' Your understudy went on.' : ''} The company manager gave you a written warning: miss another day and the company replaces you.`, 85);
    return;
  }
  replace(sim, person, e, t, what);
}

/**
 * Work called off from now: the days to come taken off the calendar, the pay for days never worked taken off what was
 * promised, and the days worked: a week with nothing worked is owed nothing, a day rate's week only its days worked.
 * What `replace` and `release` share (from 2026-10-22, the owner's brief 22: until then `replace` did it alone).
 */
function callOff(sim: Simulation, e: Engagement, t: ProjectTemplate): Set<number> {
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
    // A recurring part's episodes are paid by the day as a shoot is (from 2026-10-24), and the overtime goes with its days.
    if (t.schedule.kind !== 'run' && days.length) {
      // A weather day's held pay on SAG-AFTRA's day rate stays whole: earned when the day was called off (from
      // 2026-10-25, brief 27, `WEATHER_DAY`; loop 32: earned pay isn't deleted when the work to come is called off).
      const rate = e.contract?.per === 'day' && paysOvertime(t.pay) ? e.contract.rate ?? 0 : 0;
      const held = rate ? (e.weather ?? []).filter((w) => days.includes(w.day)).length * rate : 0;
      p.promised = Math.round(((p.promised - held) / days.length) * done) + held;
      if (p.overtime) p.overtime = Math.round((p.overtime / days.length) * done);
    }
    return true;
  });
  // The paydays of the weeks dropped come off the clock with them (`dropPaydays`): until 2026-10-22 they stayed on it.
  dropPaydays(sim, e);
  // A recurring part's further episodes and its option go with the work (from 2026-10-24, brief 25's Module 4, D7):
  // their times came off the clock with its other calls above.
  const episodes = clauseOf(e.contract, 'episodes');
  for (const f of episodes?.further ?? []) if (f.status === 'pending') { f.status = 'off'; f.at = sim.now; }
  const option = clauseOf(e.contract, 'option');
  if (option?.status === 'open') { option.status = 'expired'; option.settled = { at: sim.now, why: 'The work was called off, and the option with it.' }; }
  return worked;
}

/** What's kept of work called off, said: the days worked still paid, and the credit where a night was played. */
function keptWords(e: Engagement, worked: Set<number>): string {
  const paid = worked.size ? `The ${counted(worked.size, 'day')} you worked ${worked.size === 1 ? 'is' : 'are'} still paid on ${worked.size === 1 ? 'its payday' : 'their paydays'}, and the rest are called off.` : 'You hadn’t worked a day of it, so nothing is owed, and its days are off your calendar.';
  return `${paid} ${e.creditId ? 'The part stays on your credits for the nights you played.' : 'There’s no credit for it.'}`;
}

/** Replaced: called off (`callOff`), no credit where nothing was shot. */
function replace(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, what: string): void {
  const worked = callOff(sim, e, t);
  noteEvent(sim, e, { kind: 'problem', key: 'replaced', words: `${t.company} replaced you as ${t.role.part} after you missed ${what}.` });
  keepBounded(ensurePro(sim, person));
  tell(sim, person, `Replaced As ${t.role.part}`, `You missed ${what} of ${t.project}, and ${t.company} replaced you as ${t.role.part}. ${keptWords(e, worked)}`, 90);
}

/**
 * Why permission to work no longer covers a day, in a sentence: OPT ended for its days without work, OPT run out on its
 * end date, or what permission says otherwise (`eligibilityOf`).
 */
function permissionWords(person: Person, at: Instant): string {
  const opt = documentsOf(person).filter((d) => d.kind === 'permit' && d.destination === 'US' && d.name.includes('OPT') && (d.issuedAt ?? Infinity) <= at).sort((a, b) => (b.issuedAt ?? 0) - (a.issuedAt ?? 0))[0];
  if (opt?.endedAt !== undefined && opt.endedAt <= at) return `Your OPT ended on ${formatDate(opt.endedAt - 1, OPT_ZONE)}, after more than ${WORK_RULES.opt.unemploymentDays} days without work, and without it you can’t work in the United States`;
  if (opt?.status === 'valid' && opt.expiresAt !== undefined && opt.expiresAt <= at) return `Your OPT ran out on ${formatDate(opt.expiresAt, OPT_ZONE)}, and without it you can’t work in the United States`;
  return eligibilityOf(person, at).words.replace(/\.$/, '');
}

/**
 * Released for want of permission to work (from 2026-10-22, the owner's brief 22): an employer can't go on employing
 * someone who has become unable to work for it (8 U.S.C. 1324a(a)(2)), so the work is called off from then
 * (`callOff`), the days worked still paid (the FLSA is enforced "without regard to whether an employee is documented",
 * DOL Fact Sheet #48), a stage credit already earned kept, and no penalty, since no agreement in the game gives one.
 * Until that day nothing read permission after acceptance, and b20-4 played 47 days of The Winter Ledger after its OPT
 * ended (docs/verification/career-genre-2026-10-22/before/b20-4/).
 */
export function release(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, at: Instant, why: string = permissionWords(person, at)): void {
  const begun = (e.log ?? []).some((l) => l.status === 'worked');
  const worked = callOff(sim, e, t);
  noteEvent(sim, e, { kind: 'problem', key: 'released', words: `${t.company} released you as ${t.role.part} on ${formatDate(sim.now, NY)}: ${why.charAt(0).toLowerCase()}${why.slice(1)}.` });
  keepBounded(ensurePro(sim, person));
  tell(sim, person, `Released As ${t.role.part}`, `${why}. So ${t.company} can’t ${begun ? 'keep you on' : 'start you'} as ${t.role.part} in ${t.project}, and has released you. ${keptWords(e, worked)}`, 90);
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

/**
 * The unions a first day brings: Equity by an Equity contract (S25), SAG-AFTRA eligibility by a principal role under
 * TV/Theatrical or Low Budget (S20, S22). Equity by a contract is billed as Equity by the degree is, its initiation fee
 * and dues from that day (`EQUITY_JOINED`, `systems/propay.ts`): until 2026-10-21 (brief 20) only the degree's membership
 * said so, and a member by a contract paid Equity's working dues from the pay and never its fee or its basic dues.
 */
function unionsFrom(sim: Simulation, person: Person, t: ProjectTemplate, at: Instant): void {
  const pro = ensurePro(sim, person);
  if (t.union === 'equity' && !pro.equity) {
    pro.equity = { since: at, how: 'contract' };
    sim.emit(EQUITY_JOINED, { personId: person.id });
  }
  if (t.union === 'sag-aftra' && SAG_QUALIFIES.includes(t.kind) && !pro.sag?.eligibleSince && !pro.sag?.memberSince) pro.sag = { ...(pro.sag ?? {}), eligibleSince: at };
}

// ---------------------------------------------------------------------------------------------------------------------
// The step a player takes on preparation, shared by the sides and the part
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A step on the sides or the part, by a practice brief's own steps and their arithmetic (`BRIEF.steps`, `prepareBrief`
 * in `systems/briefs.ts`): its time on the clock, its part moved by its gain at the hour's focus, halved for each time
 * the same step was done today, by the ability it's practice in and the way you prepare, of what's left.
 */
export function prepareOn(sim: Simulation, person: Person, x: PrepTarget, step: BriefStep | 'special'): { moved: number; part: keyof PartPrep; minutes: number } {
  if (step === 'special') return specialOn(sim, person, x as { engagement: Engagement });
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

/**
 * A workflow's own preparation on a booked part (from 2026-10-24, brief 25's Module 5): its step's time, the body's cost
 * where it's on your feet, and the part brought toward complete at its gain, halved again on each repeat that day, as a
 * brief's steps are.
 */
function specialOn(sim: Simulation, person: Person, x: { engagement: Engagement }): { moved: number; part: keyof PartPrep; minutes: number } {
  const sp = workflowOf(projectById(x.engagement.projectId)!).prep.special!;
  const prep = (x.engagement.prep ??= { ...ZERO });
  const focus = focusAt(sim, person, sim.now);
  const n = repeatsToday(sim, person, `pro:${x.engagement.id}<special`);
  sim.advanceTo(sim.now + sp.minutes * MIN);
  exerts(person, sp.feet ? BRIEF.met.feet : BRIEF.met.desk, sp.minutes / 60);
  const before = prep.special ?? 0;
  const able = sp.trains ? stepSpeed(sim, person, sp.trains) : 1;
  prep.special = r3(clamp(before + sp.gain * clamp(focus, 0.5, 1.1) * 0.5 ** n * able * (1 - before), 0, 1));
  if (sp.trains && prep.special > before) ordinary(sim, person, sp.trains, focus, BRIEF.trainingWeight, 'pro:special');
  return { moved: r3(prep.special - before), part: 'special', minutes: sp.minutes };
}

// ---------------------------------------------------------------------------------------------------------------------
// A season's turns (from 2026-10-24, brief 25's Module 4, D7 and D8, `systems/series.ts`)
// ---------------------------------------------------------------------------------------------------------------------

/**
 * The next season's engagement, from an option taken up: the contract's next version, at the option's raise on the
 * last season's day rate and never under the new season's scale plus ten where an agent's negotiating, for the season's
 * first guaranteed episodes. Through the same agreement as the last, so its commission is owed as a renewal of a contract
 * made in the agreement's term (`AGREEMENT_TERMS`' What You Still Owe After It Ends).
 */
function renewFromOption(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, days: readonly WorkDay[]): Engagement {
  const pro = ensurePro(sim, person);
  const old = opportunityOf(person, e.opportunityId);
  const scale = rateOn(RATES[t.pay], days[0]!.from) ?? 0;
  const amount = Math.max(Math.round((old?.offer?.amount ?? scale) * (1 + OPTION_RAISE)), negotiatedAmount(scale, t.union, e.agreementId !== undefined));
  const words = `${t.company} took up its option on you as ${t.role.part}: ${counted(days.length, 'shoot day')} from ${formatDate(days[0]!.from, NY)}, at ${formatMoney(amount, 'USD')} a day.`;
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId: t.id, via: old?.via ?? 'agent', status: 'booked', postedAt: sim.now, submitBy: sim.now, history: [], counts: {},
    offer: { at: sim.now, until: sim.now, rate: t.pay, amount, per: 'day', units: days.length }, resolvedAt: sim.now, outcome: words,
    ...(e.agentId ? { agentId: e.agentId } : {}), ...(e.agreementId ? { agreementId: e.agreementId } : {}),
  };
  pro.opportunities.push(o);
  const next: Engagement = {
    id: sim.nextId('pro'), opportunityId: o.id, projectId: t.id, role: t.role.part, status: 'booked', days: days.map(({ from, to, label }) => ({ from, to, label })),
    ...(e.agreementId ? { agreementId: e.agreementId, agentId: e.agentId } : {}), pay: [], history: [], counts: {},
    // The part is known from the last season.
    prep: { ...(e.prep ?? ZERO) },
  };
  pro.engagements.push(next);
  o.engagementId = next.id;
  next.eligibility = eligibilityRead(person, next.days, sim.now);
  next.pay = promisedPay(sim, next, o);
  schedulePay(sim, person, next);
  bookDays(sim, person, next, t);
  next.contract = contractFor(sim, next, o.offer!, t, undefined, { ...seasonOf(t, next), version: (e.contract?.version ?? 1) + 1, renews: e.id });
  scheduleSeason(sim, person, next);
  noteEvent(sim, next, { kind: 'booked', key: 'booked', words });
  keepBounded(pro);
  tell(sim, person, `${t.company} Takes Up Its Option`, `${words} It’s the next version of your contract, for the season beginning in July, and it guarantees ${counted(clauseOf(next.contract, 'episodes')?.numbers.length ?? 0, 'episode')} again. The Work tab has it.`, 80);
  return next;
}

/** The work loop's steps lent to the seasons (`registerSeries`). */
const SEASON_HOOKS = {
  tell,
  close: (sim: Simulation, person: Person, o: Opportunity, outcome: string) => {
    sim.timeline.cancelFor('pro.opportunity', o.id, sim.now);
    sim.timeline.cancelFor('pro.offer', o.id, sim.now);
    note(sim, person, o, { kind: 'problem', key: 'series:canceled', words: outcome });
    settle(sim, person, o, 'withdrawn', outcome);
  },
  callOff: (sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, why: string) => {
    const worked = callOff(sim, e, t);
    noteEvent(sim, e, { kind: 'problem', key: 'series:canceled', words: why });
    keepBounded(ensurePro(sim, person));
    tell(sim, person, `${t.project} Is Canceled`, `${why} So your work as ${t.role.part} is called off. ${keptWords(e, worked)}`, 85);
  },
  addDays: (sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, days: readonly WorkDay[]) => {
    const from = e.days.length;
    e.days.push(...days.map(({ from: f, to, label }) => ({ from: f, to, label })));
    bookDays(sim, person, e, t, from);
    planWork(sim, e, t, from);
    const o = opportunityOf(person, e.opportunityId);
    if (!o?.offer) return;
    const more = promisedPay(sim, e, o, from);
    e.pay.push(...more);
    if (e.contract) {
      e.contract.payKeys.push(...more.map((p) => p.key));
      e.contract.estimate += more.reduce((n, p) => n + p.promised, 0);
      e.contract.service.to = e.days[e.days.length - 1]!.to;
    }
    schedulePay(sim, person, e);
  },
  finish: (sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate) => finish(sim, person, e, t),
  renew: renewFromOption,
  refusal: (person: Person, days: readonly WorkDay[], except: string): string | undefined => {
    const bad = days.find((d) => !workAuthorizedFor(person, d));
    if (bad) return `${eligibilityOf(person, bad.from).words} That rules out work on ${formatDate(bad.from, NY)}.`;
    const sag = sagWorkRefusal(person, days, NY);
    if (sag) return sag;
    const clash = bookedClash(person, days, engagementOf(person, except)?.opportunityId);
    return clash ? `You’re booked for ${clash.label} on ${formatDate(clash.from, NY)}.` : undefined;
  },
};

// ---------------------------------------------------------------------------------------------------------------------
// A weather day (from 2026-10-25, the owner's brief 27, Part 11; `WEATHER_DAY`)
// ---------------------------------------------------------------------------------------------------------------------

/** The next working day after a moment, at the same time of day in the town's own zone. */
function nextWorkday(at: Instant, zone: string): Instant {
  let d = addDays(at, 1, zone);
  while ([0, 6].includes(weekdayOf(d, zone))) d = addDays(d, 1, zone);
  return d;
}

/**
 * The pay promised again after the work's days changed: each payment not yet paid set to what its week pays now
 * (`promisedPay`), its payday moved where its last day moved, and a week the slip added promised by the next key, so a
 * payment is never paid twice; the contract's estimate and dates follow.
 */
function repay(sim: Simulation, person: Person, e: Engagement, o: Opportunity): void {
  for (const f of promisedPay(sim, e, o)) {
    const p = e.pay.find((x) => x.key === f.key);
    if (!p) {
      e.pay.push(f);
      e.contract?.payKeys.push(f.key);
      continue;
    }
    if (p.received || p.inTrust) continue;
    const moved = p.due !== f.due;
    p.promised = f.promised;
    p.due = f.due;
    if (f.week) p.week = f.week;
    if (f.overtime) p.overtime = f.overtime; else delete p.overtime;
    const item = moved ? sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === PAY_KIND && i.payload.engagementId === e.id && i.payload.key === p.key) : undefined;
    if (item) sim.timeline.reschedule(item.id, Math.max(p.due + (p.late?.days ?? 0) * MS_DAY, sim.now + MIN));
  }
  if (e.contract) {
    e.contract.estimate = e.pay.reduce((n, p) => n + p.promised, 0);
    e.contract.service.to = e.days[e.days.length - 1]!.to;
  }
  schedulePay(sim, person, e);
}

/** What a weather day does to the pay, in a sentence, by how the work is paid. */
function weatherPayWords(o: Opportunity, slipped: boolean): string {
  const offer = o.offer!;
  if (offer.amount === undefined) return 'The pay is deferred, as it was.';
  if (offer.per === 'week') return slipped ? 'You’re paid by the week, so the day off changes nothing; a day the slip carries into a week of its own pays a fifth of your weekly rate, as SAG-AFTRA’s agreement prorates a day.' : 'You’re paid by the week, so the day changes nothing.';
  if (paysOvertime(offer.rate)) return `SAG-AFTRA’s agreement pays a day performer booked and not used through no fault of their own for the day, so the day off is paid${slipped ? ', and so is each day you work' : ''}.`;
  return slipped ? 'This work pays the days you work, so the day off isn’t paid; every day you work still is.' : 'This work pays the days you work, so the day isn’t paid.';
}

/**
 * The days from one on slipped a working day each, where nothing stands in the way: their calendar items moved, or booked
 * again where the day's own item is the one the clock is at; the flight home booked again from the new last day and the
 * per diem's days with it. Or what stands in the way, in words, and nothing moved.
 */
function slipDays(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, i: number): { home?: Instant; blocked?: undefined } | { blocked: string } {
  const zone = zoneOf(t.place.cityId);
  const moved = e.days.map((d, k) => (k < i ? d : { ...d, from: nextWorkday(d.from, zone), to: nextWorkday(d.from, zone) + (d.to - d.from) }));
  const later = moved.slice(i);
  const blocked = later.find((d) => !workAuthorizedFor(person, d)) ? 'your permission to work doesn’t reach the days it would need' : bookedClash(person, later, e.opportunityId) ? `you’re booked on a day it would need` : undefined;
  if (blocked) return { blocked };
  e.days = moved;
  const pending = (j: number) => sim.universe.scheduled.find((item) => item.status === 'pending' && item.kind === WORK_DAY_KIND && item.payload.engagementId === e.id && Number(item.payload.day) === j);
  for (let j = i; j < e.days.length; j += 1) {
    const item = pending(j);
    if (item) sim.timeline.reschedule(item.id, e.days[j]!.from);
    else bookDays(sim, person, e, t, j, j);
  }
  const trip = tripOf(person, e);
  const home = trip ? extendTrip(sim, person, trip, e.days) : undefined;
  if (trip && home && e.contract) { const perDiem = clauseOf(e.contract, 'per-diem'); if (perDiem) perDiem.days = daysAwayOf(trip); }
  return { home };
}

/**
 * A day on location called off for the weather, the evening before: the rest of the days slipped a working day each
 * where nothing stands in the way, the calendar, the flight home and the pay with them; where something does, the day
 * shot without the actor and its scenes cut from the part. Said in a notice and kept on the engagement.
 */
function weatherDay(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, i: number, sky: string): void {
  const zone = zoneOf(t.place.cityId);
  const was = e.days[i]!.from;
  const r = slipDays(sim, person, e, t, i);
  const blocked = r.blocked;
  const slipped = !blocked;
  if (!slipped) for (const u of e.units ?? []) if (u.day === i) u.cut = true;
  (e.weather ??= []).push({ day: i, at: sim.now, was, sky, slipped });
  const home = 'home' in r ? r.home : undefined;
  const o = opportunityOf(person, e.opportunityId);
  if (o?.offer) repay(sim, person, e, o);
  const city = t.place.city;
  const when = formatWeekdayDate(was, zone);
  const what = slipped
    ? `${city}’s forecast for ${when} is ${sky}, which can’t be shot outside, so ${t.company} called off your day on location and slipped the rest of your days a working day each: that day’s work is now on ${formatWeekdayDate(e.days[i]!.from, zone)}, and your last day ${formatWeekdayDate(e.days[e.days.length - 1]!.from, zone)}.`
    : `${city}’s forecast for ${when} is ${sky}, which can’t be shot outside, so ${t.company} called off your day on location. It couldn’t slip your days, since ${blocked}, so it shoots that day’s scenes later without you, and they’re cut from your part.`;
  const flight = home ? ` Your flight home moves with them, leaving ${formatWeekdayDate(home, zone)}, and the hotel keeps your room.` : '';
  const pay = o?.offer ? ` ${weatherPayWords(o, slipped)}` : '';
  noteEvent(sim, e, { kind: 'problem', key: `weather:${i}:${was}`, words: `${what}${flight}${pay}` });
  tell(sim, person, `A Weather Day On ${t.project}`, `${what}${flight}${pay} The Work tab has the days as they stand.`, 80);
}

/**
 * A day the actor is too ill to work, shot around (`ILL_DAY`): the rest slipped as a weather day's are, the day unpaid, said.
 * Returns whether it was; where it can't be, the day is missed as before.
 */
function illDay(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, i: number, at: Instant): boolean {
  if (t.medium === 'stage' || !ILL_DAY.sizes.includes(t.role.size) || (e.ill?.length ?? 0) >= ILL_DAY.most) return false;
  const r = slipDays(sim, person, e, t, i);
  if (r.blocked) return false;
  (e.ill ??= []).push({ day: i, at: sim.now, was: at });
  const o = opportunityOf(person, e.opportunityId);
  if (o?.offer) repay(sim, person, e, o);
  const zone = zoneOf(t.place.cityId);
  const what = `You were ${laidUp(person, at) ? 'laid up' : 'in hospital'} on ${formatWeekdayDate(at, zone)}, so ${t.company} kept the shoot going around you and slipped the rest of your days a working day each: that day’s work is now on ${formatWeekdayDate(e.days[i]!.from, zone)}, and your last day ${formatWeekdayDate(e.days[e.days.length - 1]!.from, zone)}.`;
  const home = 'home' in r ? r.home : undefined;
  const flight = home ? ` Your flight home moves with them, leaving ${formatWeekdayDate(home, zone)}.` : '';
  const pay = o?.offer?.amount === undefined ? '' : o.offer.per === 'week' ? ' You’re paid by the week, so the day changes nothing; a day the slip carries into a week of its own pays a fifth of your weekly rate.' : ` A day lost to your own illness or injury isn’t paid${paysOvertime(o.offer.rate) ? ', SAG-AFTRA’s agreement’s exception to paying a day engaged and not used' : ''}; every day you work still is.`;
  noteEvent(sim, e, { kind: 'problem', key: `ill:${i}:${at}`, words: `${what}${flight}${pay}` });
  tell(sim, person, `${t.project} Shoots Around You`, `${what}${flight}${pay} Another day lost the same way and the production recasts the part.`, 85);
  return true;
}

/** The days a trip keeps the actor away, as the contract's per diem counts them. */
const daysAwayOf = (trip: NonNullable<ReturnType<typeof tripOf>>): number => {
  const out = trip.legs.find((l) => l.way === 'out');
  const back = [...trip.legs].reverse().find((l) => l.way === 'back' && l.status === 'booked');
  return out && back ? Math.max(0, Math.round((dayAt(back.arrives, 12) - dayAt(out.departs, 12)) / MS_DAY) + 1) : 0;
};

/** Each day on location due a forecast by now, the evening before it, read once it's due: one weather day at a time. */
export function weatherPassage(sim: Simulation, person: Person): void {
  for (const e of person.pro?.engagements ?? []) {
    if (!live(e) || (e.weather?.length ?? 0) >= WEATHER_DAY.most) continue;
    const t = projectById(e.projectId);
    const city = t && CITIES.get(t.place.cityId);
    if (!t || !city) continue;
    for (let i = 0; i < e.days.length; i += 1) {
      const d = e.days[i]!;
      if (d.from < sim.now || e.log?.some((l) => l.day === i) || lostDay(e, i) || !onLocation(t, i)) continue;
      const eve = instantFromZoned({ ...zonedParts(addDays(d.from, -1, city.timeZone), city.timeZone), hour: WEATHER_DAY.eveningHour, minute: 0 }, city.timeZone);
      if (sim.now < eve) break;
      const sky = stoppingSky(weatherOn(sim, city, d.from));
      if (!sky) continue;
      weatherDay(sim, person, e, t, i, sky);
      break;
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Registration: the postings as the clock passes, the casting office's steps on the clock, and the commands
// ---------------------------------------------------------------------------------------------------------------------

const located = (sim: Simulation, item: ScheduledItem): { person: Person; o: Opportunity } | undefined => {
  const person = sim.universe.people[String(item.payload.personId)];
  const o = person ? opportunityOf(person, item.payload.opportunityId) : undefined;
  return person && o ? { person, o } : undefined;
};

/** What the workflows' clock and command borrow from here (`registerWorkflows`). */
const WORKFLOW_HOOKS = {
  tell: (sim: Simulation, person: Person, title: string, body: string) => tell(sim, person, title, body, 70),
  there: (person: Person, at: Instant) => there(person, at),
  genre: (person: Person, t: ProjectTemplate) => fitOf(person, t).genre * BRIEF.complete.genre,
  // An anthology's next story, offered without an audition to an actor whose work in its last was strong (Module 5).
  offerInvite: (sim: Simulation, person: Person, projectId: string, from: Engagement) => {
    const t = projectById(projectId);
    if (!t || person.pro?.engagements.some((x) => x.projectId === projectId)) return;
    const o = post(sim, person, t, sim.now, 'open');
    if (!o) return;
    const last = projectById(from.projectId)!;
    note(sim, person, o, { kind: 'opportunity', key: 'invited', words: `${t.company} invited you back into ${t.project}’s next story for your work as ${last.role.part}, without an audition.` });
    makeOffer(sim, person, o);
  },
};

/**
 * A slate production's fate, applied to work booked in it once the fate is known (from 2026-10-24, the owner's brief 27,
 * Area B: "Delays ... Recasting where justified ... Projects that never proceed"). Only work not yet begun: a production
 * that has started isn't pushed or dropped by the slate.
 * - **Never made:** the work is called off, nothing owed for days never worked (`callOff`), as any work called off is: the
 *   agreement's own terms for a production abandoned weren't read, so the game owes nothing more and says so.
 * - **Pushed back:** the booking for the old dates is released, and the production offers the part again for the new ones,
 *   at the same terms, through the same agent, as a fresh offer the actor can take or leave; left, the part is recast.
 */
function applyFates(sim: Simulation, person: Person): void {
  const pro = person.pro;
  if (!pro) return;
  for (const e of [...pro.engagements]) {
    const t = projectById(e.projectId);
    const fate = t?.slate?.fate;
    if (!t || !fate || fate.kind === 'made' || fate.at > sim.now) continue;
    if (e.status === 'finished' || e.status === 'canceled' || (e.log ?? []).length > 0 || e.history.some((h) => h.key === 'slate-fate')) continue;
    const first = e.days[0]?.from ?? sim.now;
    if (fate.kind === 'dropped') {
      callOff(sim, e, t);
      noteEvent(sim, e, { kind: 'problem', key: 'slate-fate', words: `${t.company} called off ${t.project} on ${formatDate(sim.now, NY)}, before its first day: it won’t be made.` });
      keepBounded(pro);
      tell(sim, person, `${t.project} Won’t Be Made`, `${t.company} called off ${t.project} before its first day, so your work in it as ${t.role.part} is off your calendar. You hadn’t worked a day of it, so nothing is owed: the agreement’s terms for a production abandoned before it starts weren’t read, so the game pays nothing more.`, 85);
      continue;
    }
    const next = pushedPart(t, fate.weeks);
    callOff(sim, e, t);
    noteEvent(sim, e, { kind: 'problem', key: 'slate-fate', words: `${t.company} pushed ${t.project} back ${counted(fate.weeks, 'week')} on ${formatDate(sim.now, NY)}, and released you from its old dates.` });
    const old = opportunityOf(person, e.opportunityId);
    keepProject(person, next, next.series ? seriesById(next.series) : undefined);
    const o: Opportunity = {
      id: sim.nextId('pro'), projectId: next.id, via: old?.via ?? 'open', status: 'callback', postedAt: old?.postedAt ?? sim.now, submitBy: sim.now, history: [], counts: {},
      ...(old?.agentId ? { agentId: old.agentId } : {}), ...(old?.agreementId ? { agreementId: old.agreementId } : {}),
    };
    pro.opportunities.push(o);
    keepBounded(pro);
    tell(sim, person, `${t.project} Is Pushed Back`, `${t.company} pushed ${t.project} back ${counted(fate.weeks, 'week')}, from ${formatDate(first, NY)}, and released you from the old dates, so they’re off your calendar. It offers you ${t.role.part} again for the new dates.`, 80);
    makeOffer(sim, person, o);
  }
}

export function registerProJobs(sim: Simulation): void {
  // The workflows' revised pages, looping sessions, invitations and choices (from 2026-10-24, brief 25's Module 5).
  registerWorkflows(sim, WORKFLOW_HOOKS);
  // The awards and festivals (from 2026-10-24, brief 25's Module 6).
  registerAwards(sim, (s, person, title, body) => tell(s, person, title, body, 65));
  // Work abroad's trips and visas (from 2026-10-23, the owner's brief 25): their handlers, lent what they need from here.
  registerWorkTrips(sim, {
    engagementOf, projectOf: (e) => projectById(e.projectId), there,
    release: (s, person, e, t, at, why) => release(s, person, e, t, at, why), tell,
  });
  // A series' seasons (from 2026-10-24, brief 25's Module 4): the network's word each May, a recurring part's further
  // episodes and its option, each through the loop's own steps.
  registerSeries(sim, SEASON_HOOKS);
  // The slate's parts and series the save keeps, back in the session before anything reads them (from 2026-10-24, brief 27).
  restoreSlate(sim.universe);
  // The week's postings, at each Monday the clock passes; a window passed closes; and the agent tries a submission his
  // breakdown brought, as soon as the role suits and the materials pass.
  // A day on location called off for the weather, the evening before (from 2026-10-25, brief 27, `WEATHER_DAY`).
  sim.onPassage('pro.weather', (s) => weatherPassage(s, s.player));
  sim.onPassage('pro.postings', (s, from) => {
    const person = s.universe.people[s.universe.playerId];
    if (!person) return;
    for (const at of postingTimes(from, s.now)) for (const { project, via } of postingsAt(s, person, at)) {
      const o = post(s, person, project, at, via);
      // Offered without an audition where the casting office cast the actor before (from 2026-10-24, brief 27, loop 16).
      const direct = o ? directOfferFor(s, person, project, at) : undefined;
      if (o && direct) { o.direct = direct; makeOffer(s, person, o); }
    }
    // What became of the slate's productions the actor is booked in, once it's known (from 2026-10-24, brief 27).
    applyFates(s, person);
    for (const o of person.pro?.opportunities ?? []) {
      if (o.status !== 'open') continue;
      if (s.now >= o.submitBy) {
        const t = projectOf(o);
        const held = o.via === 'agent' && o.history.some((x) => x.kind === 'problem');
        settle(s, person, o, 'lapsed', `Submissions for ${t.role.part} closed on ${formatDate(o.submitBy, NY)}${o.via === 'agent' ? `, before ${agentFor(o)?.name ?? 'your agent'} could submit you` : ''}.`);
        if (held) tell(s, person, `Submissions Closed For ${t.role.part}`, `${castingAs(t)} closed submissions for ${t.role.part} on ${formatDate(o.submitBy, NY)}, before ${agentFor(o)!.name} could submit you.`, 50);
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
    // Asleep, ill or at a booked day's work (`workDayAt`), the round is missed; and at another audition or a meeting
    // whose trip meets this one's (`attendedAcross`), missed with where they were.
    if (!there(at.person, item.at) || workDayAt(at.person, item.at, roundMinutes(r))) { missRound(s, at.person, at.o, r); return; }
    // Away on a trip for work abroad (from 2026-10-23, the owner's brief 25, W8): an audition in person at home can't be gone to.
    const w = awayOn(at.person, item.at);
    if (w) { missRound(s, at.person, at.o, r, whereWords(w)); return; }
    const trip = (item.travelMinutes ?? 0) * MIN;
    const elsewhere = attendedAcross(at.person, item.at - trip, item.at + roundMinutes(r) * MIN + trip, at.o.id);
    if (elsewhere) { missRound(s, at.person, at.o, r, elsewhere); return; }
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
    // The next round where the part has one (from 2026-10-24, brief 27: a chemistry read or a screen test after the callback).
    const next = nextRound(t, r.round);
    const cut = next !== undefined;
    // Availability and eligibility are checked, never drawn: booked on its days since, and casting goes elsewhere.
    const clash = cut ? undefined : bookedClash(person, datesOf(o), o.id);
    if (clash) {
      r.casting = { at: s.now, chance: 0, fit: f.fit, yes: false };
      pass(s, person, o, `You’re booked for ${clash.label} on ${formatDate(clash.from, NY)}, so ${t.casting} cast another actor as ${t.role.part}.`);
      return;
    }
    const d = castingDraw(s, o, next && next !== 'audition' ? next : 'final', r.band!, f.fit, visibilityOf(person, s.now));
    r.casting = { at: s.now, chance: d.chance, fit: f.fit, yes: d.yes };
    if (!d.yes) { pass(s, person, o, next === 'callback' ? `${castingAs(t)} didn’t call you back for ${t.role.part}.` : next ? `${castingAs(t)} didn’t ask you to the ${ROUND_WORDS[next].noun} for ${t.role.part}.` : `${castingAs(t)} cast another actor as ${t.role.part}.`); return; }
    if (next) { setRound(s, person, o, next); return; }
    makeOffer(s, person, o);
  });

  sim.onSchedule(NEGOTIATE_KIND, (item, s) => {
    const at = located(s, item);
    const offer = at?.o.offer;
    if (!at || at.o.status !== 'offered' || !offer?.asked || offer.asked.answer) return;
    const { person, o } = at;
    const t = projectOf(o);
    const last = o.rounds?.filter((r) => r.band).at(-1)?.band;
    const worked = o.direct !== undefined || person.pro!.engagements.some((e) => finished(e) && projectById(e.projectId)?.casting === t.casting);
    const chance = Math.min(1, (last ? NEGOTIATE.yes[last] : NEGOTIATE.yes.working) + (worked ? NEGOTIATE.worked : 0));
    const yes = s.rng('pro.negotiate', o.projectId, o.postedAt).next() < chance;
    const agent = agentFor(o)?.name ?? 'Your agent';
    if (yes) {
      offer.amount = offer.asked.amount;
      offer.version = (offer.version ?? 1) + 1;
      offer.asked.answer = 'raised';
    } else offer.asked.answer = 'kept';
    const words = yes
      ? `${castingAs(t)} raised its offer for ${t.role.part} to ${formatMoney(offer.amount!, 'USD')} a ${offer.per}, as ${agent} asked. It stands until ${formatDate(offer.until, NY)} at ${formatTime(offer.until, NY)}.`
      : `${castingAs(t)} kept its offer for ${t.role.part} at ${formatMoney(offer.amount!, 'USD')} a ${offer.per}, where ${agent} asked for ${formatMoney(offer.asked.amount, 'USD')}. It stands until ${formatDate(offer.until, NY)} at ${formatTime(offer.until, NY)}.`;
    note(s, person, o, { kind: 'offer', key: 'answered', words });
    tell(s, person, yes ? `The Offer For ${t.role.part} Is Raised` : `The Offer For ${t.role.part} Stands`, words, 70);
  });

  sim.onSchedule(HOLD_KIND, (item, s) => {
    const at = located(s, item);
    const asked = at?.o.hold?.asked;
    // Casting's own word may have come first: an offer, or the part gone to another actor, and nothing's left to answer.
    if (!at || !asked || asked.answer || !holding(at.o) || at.o.status === 'offered') return;
    const { person, o } = at;
    const t = projectOf(o);
    const last = o.rounds?.filter((r) => r.band).at(-1)?.band ?? 'working';
    const yes = s.rng('pro.hold', o.projectId, o.postedAt).next() < HOLD.book[last];
    asked.answer = yes ? 'booked' : 'released';
    const against = opportunityOf(person, asked.against);
    const other = against ? projectOf(against).role.part : 'the other part';
    if (yes) {
      // Booked: the rounds still to come are dropped, and the offer is made now.
      s.timeline.cancelFor('pro.opportunity', o.id, s.now);
      note(s, person, o, { kind: 'offer', key: 'hold:booked', words: `Asked to decide, ${t.casting} chose you for ${t.role.part} rather than let you go to ${other}.` });
      makeOffer(s, person, o);
      return;
    }
    const words = `Asked to decide, ${t.casting} let ${agrees(t, 'its', 'their')} hold go rather than choose before the offer for ${other} lapsed, and went on without you for ${t.role.part}.`;
    letGo(s, person, o, 'passed', words);
    tell(s, person, `The Hold On ${t.role.part} Is Let Go`, `${words} You’re free to take ${other}.`, 70);
  });

  sim.onSchedule(OFFER_KIND, (item, s) => {
    const at = located(s, item);
    if (!at || at.o.status !== 'offered' || !at.o.offer || at.o.offer.until > s.now) return;
    const t = projectOf(at.o);
    const words = `You didn’t answer the offer for ${t.role.part} by ${formatDate(at.o.offer.until, NY)} at ${formatTime(at.o.offer.until, NY)}, so it lapsed.`;
    const gone = holdGone(at.o);
    note(s, at.person, at.o, { kind: 'lapsed', key: 'lapsed', words });
    settle(s, at.person, at.o, 'lapsed', words);
    tell(s, at.person, `The Offer For ${t.role.part} Lapsed`, `${words}${gone}`, 70);
  });

  sim.onSchedule(WORK_DAY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person && engagementOf(person, item.payload.engagementId);
    const i = Number(item.payload.day);
    if (!person || !e || !live(e) || e.log?.some((l) => l.day === i)) return;
    const t = projectById(e.projectId)!;
    // Shot without the actor for the weather (`WEATHER_DAY`): nothing to work, and the last day still ends it.
    if (lostDay(e, i)) { if (i === e.days.length - 1 && live(e) && !episodesPending(e)) finish(s, person, e, t); return; }
    // Permission read where the work happens (from 2026-10-22, the owner's brief 22): OPT's days counted up to the day
    // first (`settleOpt`), which may end it and release this work (`PERMISSION_ENDED`), then the day read whole
    // (`workAuthorizedFor`). Without it the day doesn't happen: no judgment, record, practice, attendance or credit.
    // Until then permission was read at acceptance alone.
    settleOpt(s, person, item.at);
    if (!live(e)) return;
    if (abroad(person, t)) {
      // Abroad (from 2026-10-23, the owner's brief 25, W10): the country's permission for the day, and the actor there.
      const read = abroadRead(person, countryOfProject(t), [e.days[i]!], e.id, s.now);
      if (!read.authorized) { release(s, person, e, t, item.at, read.words.replace(/\.$/, '')); return; }
      if (whereAt(person, item.at).cityId !== t.place.cityId) {
        missDay(s, person, e, t, i, item.at);
        if (i === e.days.length - 1 && live(e) && !episodesPending(e)) finish(s, person, e, t);
        return;
      }
    } else if (!workAuthorizedFor(person, e.days[i]!)) {
      release(s, person, e, t, item.at);
      return;
    } else if (travels(person, t) && whereAt(person, item.at).cityId !== t.place.cityId) {
      // A trip in the US (Module 2, C10): the US rule above, and the actor there.
      missDay(s, person, e, t, i, item.at);
      if (i === e.days.length - 1 && live(e) && !episodesPending(e)) finish(s, person, e, t);
      return;
    }
    if (!there(person, item.at)) {
      // Too ill to work, on a lead's or a supporting part's day: shot around once, where it can be (`ILL_DAY`).
      if (offSick(person, item.at) && illDay(s, person, e, t, i, item.at)) return;
      missDay(s, person, e, t, i, item.at);
      // The last day missed, with the work still on: it ends there.
      if (i === e.days.length - 1 && live(e) && !episodesPending(e)) finish(s, person, e, t);
      return;
    }
    e.status = 'working';
    if (e.school === 'unapproved' && inSessionAt(person, item.at)) reportUnapproved(s, person, e, t);
    unionsFrom(s, person, t, item.at);
    const kind = dayKindOf(t, i);
    exerts(person, WORK.met, (e.days[i]!.to - e.days[i]!.from) / MS_HOUR);
    if (workflowOf(t).id !== 'stage') {
      // The part worked the way its production works (from 2026-10-24, the owner's brief 25, Part 8, `workTheDay`): an
      // unjudged day builds the part, a judged one plays its units in takes with the player's choices read, and either
      // leaves a report. Until then every screen day was one take judged as a self-tape, whatever the work.
      const done = workTheDay(s, person, e, t, i, item.at, fitOf(person, t).genre * BRIEF.complete.genre, () => rehearseDay(person, e, t));
      practiceGenres(s, person, projectGenresOf(t));
      (e.log ??= []).push({ day: i, at: item.at, status: 'worked', ...(done.band ? { band: done.band, overall: done.overall! } : {}) });
      // A musical's stage credit, from its first night, as a play's.
      if (t.medium === 'stage' && done.band && !e.creditId) {
        const c = addCredit(s, person, { kind: 'stage', project: t.project, role: t.role.part, company: t.company, year: zonedParts(item.at, NY).year, medium: 'stage', status: 'performed', ...(t.union !== 'none' ? { union: t.union } : {}), engagementId: e.id, at: item.at, band: done.band });
        e.creditId = c.id;
      }
    } else if (kind === 'rehearsal') {
      rehearseDay(person, e, t);
      // A rehearsal day is work in the project's genres, as a School call is (from 2026-10-22, the owner's brief 21).
      practiceGenres(s, person, projectGenresOf(t));
      (e.log ??= []).push({ day: i, at: item.at, status: 'worked' });
    } else {
      // Nerves before a house, as before a School night (`nerves`): stress by composure and extraversion, and composure
      // and presence grown by facing it. A shoot day has a crew, not a house, as a School tape has none. From 2026-10-21
      // (brief 20, found by the creation area): until then a professional night read neither.
      if (kind === 'performance') nerves(s, person, 'performance');
      const ev = evaluate(s, person, workContext(s, person, e, t, i));
      const band = bandOfQuality(ev.overall);
      recordWork(s, person, ev, { at: item.at, what: `${t.role.part}, ${t.project}: ${kind === 'performance' ? 'Performance' : `Shoot Day ${i + 1}`}`, band });
      (e.log ??= []).push({ day: i, at: item.at, status: 'worked', band, overall: ev.overall });
      // A night or a shoot day is work done in the project's genres, so it's practice in them, one day's worth shared
      // among them, as a School night and a taped brief are (`practiceGenres`; content/engagement.ts: "work done in it
      // ... is practice"). From 2026-10-21 (brief 19's J6, found by the playthroughs): until then a professional run
      // left no experience of its genres on the record, while the School's nights and the briefs' tapes did. The
      // project's genres, never the player's own loves (`fitOf`; tests/cohesion.test.ts).
      practiceGenres(s, person, projectGenresOf(t));
      // A stage credit is the part performed, from its first night (`ProCredit`'s 'performed').
      if (kind === 'performance' && !e.creditId) {
        const c = addCredit(s, person, { kind: 'stage', project: t.project, role: t.role.part, company: t.company, year: zonedParts(item.at, NY).year, medium: 'stage', status: 'performed', ...(t.union !== 'none' ? { union: t.union } : {}), engagementId: e.id, at: item.at, band });
        e.creditId = c.id;
      }
    }
    // The day's work taken as a School night or rehearsal is (`enjoyWork`): a project of a kind they love a better day, and
    // a rehearsal by agreeableness. From 2026-10-21 (brief 20, found by the creation area): until then a professional day
    // read neither, while the creation screen and the guide said a day's work in a loved genre is a better day.
    // The project's kinds of story, as a School play's are (`genresOfPlay`), set beside what the player loves only there.
    const { genres: kinds } = t;
    enjoyWork(person, { genres: kinds, ...(kind === 'rehearsal' ? { rehearsal: true } : {}) });
    // What the day's work takes out of the body, after it's judged, on top of its waking hours: a School rehearsal call's
    // (`ESTIMATE.energy.rehearsal`, SLATE's estimate), as the Actor Showcase's rehearsals and its performance take
    // (`systems/proshowcase.ts`). From 2026-10-21 (the owner's brief 20, D3, by the life area): until then a work day
    // took nothing but its waking hours, so eleven hours on set cost less than a six-hour School rehearsal call, which
    // takes these eight on top of its own.
    person.wellbeing.energy = clamp(person.wellbeing.energy - ESTIMATE.energy.rehearsal, 0, 100);
    if (e.log.filter((l) => l.status === 'worked').length === 1) noteEvent(s, e, { kind: 'worked', key: 'first', words: `Your first day as ${t.role.part} in ${t.project}.` });
    if (i === e.days.length - 1 && e.status === 'working' && !episodesPending(e)) finish(s, person, e, t);
  });

  // Permission to work ended (from 2026-10-22, the owner's brief 22): every engagement with a day still to come past the
  // end is released then (`release`), its days off the calendar at once, so the player hears of each at the moment,
  // not at its next work day.
  sim.onEvent(PERMISSION_ENDED, 'pro.release_unauthorized', (event, { sim: s }) => {
    const { personId, at } = event.payload as { personId: string; at: Instant };
    const person = s.universe.people[personId];
    for (const e of person?.pro?.engagements ?? []) {
      if (!live(e) || !e.days.some((d, i) => d.to > at && !e.log?.some((l) => l.day === i))) continue;
      release(s, person!, e, projectById(e.projectId)!, at);
    }
  });

  sim.onSchedule(RELEASE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    // A scene of yours cut in the edit (from 2026-10-24, brief 25's Module 5, T46): the credit and the pay stay, and the
    // credit's band is the best of the days on the scenes kept, which a reel cut from it shows.
    const pre = person?.pro?.credits.find((x) => x.id === String(item.payload.creditId));
    const e = pre?.engagementId ? engagementOf(person!, pre.engagementId) : undefined;
    // Its way out (`RELEASE_FATE`, from 2026-10-25, brief 27): held back, said and put on the clock again; shelved, said, and
    // never out, so its footage never goes on a reel and it never has a premiere.
    const fate = pre?.release;
    const held = pre && e && projectById(e.projectId);
    if (person && pre && held && fate?.kind === 'late' && !fate.told) {
      fate.told = true;
      const at = addDays(s.now, fate.days!, NY);
      s.schedule({ at, kind: RELEASE_KIND, label: `${pre.project} Is Released`, category: 'career', priority: 60, refType: 'pro.credit', refId: pre.id, payload: { personId: person.id, creditId: pre.id } });
      const words = `${pre.project}’s distributor held back its release to ${formatDate(at, NY)}. ${pre.role} stays on your credits as shot until then, and its footage can go on a reel once it’s out.`;
      noteEvent(s, e, { kind: 'problem', key: 'release:late', words });
      tell(s, person, `${pre.project}’s Release Is Held Back`, words, 60);
      return;
    }
    if (person && pre && held && fate?.kind === 'shelved') {
      const words = `${pre.project}’s distributor shelved it: it won’t be released. ${pre.role} stays on your credits as shot, and the pay was yours; with no release, its footage can’t go on a reel, and it has no premiere to enter for an award.`;
      noteEvent(s, e, { kind: 'problem', key: 'release:shelved', words });
      tell(s, person, `${pre.project} Is Shelved`, words, 65);
      return;
    }
    const cut = e ? cutInEdit(s, e) : undefined;
    const c = person && releaseScreenCredit(s, person, String(item.payload.creditId));
    if (!person || !c) return;
    const t = e ? projectById(e.projectId) : undefined;
    if (cut && e && t) {
      c.cut = (c.cut ?? 0) + 1;
      const kept = keptBand(e);
      if (kept) c.band = kept;
      noteEvent(s, e, { kind: 'problem', key: 'cut', words: `The edit cut your ${unitWord(t, cut)} from ${t.project}. ${c.role} stays on your credits, and the pay is yours.` });
    }
    // A film in cinemas enters the game's own weekly chart (from 2026-10-24, brief 25's Module 6, X5), its run drawn now
    // and read by the clock: the game's simulation, never a published figure, and never pay.
    // Sent to streaming instead of cinemas (`RELEASE_FATE`): no weekly chart of its own in cinemas.
    const streamed = c.release?.kind === 'streaming';
    if (t && formatOf(t).after === 'theatrical' && !streamed) c.run ??= simulateRun(s, t.id, t.kind, c.releasedAt ?? s.now);
    const out = t ? (streamed ? `${RELEASED.streaming}, its distributor having sent it to streaming instead of cinemas` : RELEASED[formatOf(t).after]) : 'is out';
    const words = c.voice ? `${c.project} ${out}, so ${c.role} shows as released on your credits. It’s your voice with no picture of you, so it goes on a voice demo, not a reel: Mix A Voice Demo on the Portfolio tab lists it.` : `${c.project} ${out}, so ${c.role} shows as released on your credits, and its footage can go on your reel. Cut A Reel on the Portfolio tab lists it.`;
    tell(s, person, `${c.project} Is Released`, cut && t ? `${words} The edit cut one of your scenes, ${unitWord(t, cut)}: the part stays on your credits with the pay, and the reel can use only the scenes kept.` : words, 60);
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
    return prepareOn(s, person, x!, p.step as BriefStep | 'special');
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
    const t = projectOf(o!);
    note(s, person, o!, { kind: r.round === 'audition' ? 'audition' : 'callback', key: `${r.round}:moved`, words: `At your asking, ${t.casting} moved your ${ROUND_WORDS[r.round].noun} for ${t.role.part} from ${formatDate(was, NY)} at ${formatTime(was, NY)} to ${formatWeekdayDate(to, NY)} at ${formatTime(to, NY)}.` });
    return { at: to };
  });

  sim.onCommand<{ opportunityId: string }, { asked: Money; answerAt: Instant }>('pro.ask_more', (p, { sim: s }) => {
    const person = s.player;
    const o = opportunityOf(person, p?.opportunityId);
    const no = askMoreRefusal(s, person, o);
    if (no) throw new CommandError(no);
    const t = projectOf(o!);
    const offer = o!.offer!;
    const amount = askedAmount(offer.amount!);
    const answerAt = dayAt(addDays(s.now, 1, NY), NEGOTIATE.answerHour);
    offer.asked = { at: s.now, amount, answerAt };
    // The offer stands a day past the answer, so there's time to take what comes.
    const until = Math.max(offer.until, dayAt(addDays(answerAt, 1, NY), WORK.offerHour));
    if (until !== offer.until) {
      offer.until = until;
      const lapse = s.universe.scheduled.find((i) => i.status === 'pending' && i.kind === OFFER_KIND && i.payload.opportunityId === o!.id);
      if (lapse) s.timeline.reschedule(lapse.id, until);
    }
    s.schedule({ at: answerAt, kind: NEGOTIATE_KIND, label: `The Answer On ${t.role.part}’s Pay`, category: 'career', priority: 40, refType: 'pro.offer', refId: o!.id, payload: { personId: person.id, opportunityId: o!.id } });
    const agent = agentFor(o!) ?? agentById(activeAgreement(person, s.now)!.agentId)!;
    note(s, person, o!, { kind: 'offer', key: 'asked', words: `${agent.name} asked ${t.casting} for ${formatMoney(amount, 'USD')} a ${offer.per}, a fifth over its offer of ${formatMoney(offer.amount!, 'USD')}.` });
    return { asked: amount, answerAt };
  });

  // Asking a production that holds the actor's dates to decide first, against another offer on them (`HOLD`).
  sim.onCommand<{ opportunityId: string }, { answerAt: Instant; against: string }>('pro.ask_hold', (p, { sim: s }) => {
    const person = s.player;
    const o = opportunityOf(person, p?.opportunityId);
    const no = holdAskRefusal(s, person, o);
    if (no) throw new CommandError(no);
    const t = projectOf(o!);
    const against = offersAgainst(person, o!)[0]!;
    const answerAt = holdAnswerAt(s.now);
    o!.hold!.asked = { at: s.now, against: against.id, answerAt };
    s.schedule({ at: answerAt, kind: HOLD_KIND, label: `The Answer On The Hold For ${t.role.part}`, category: 'career', priority: 40, refType: 'pro.hold', refId: o!.id, payload: { personId: person.id, opportunityId: o!.id } });
    const agreement = activeAgreement(person, s.now);
    const who = agentFor(o!)?.name ?? (agreement ? agentById(agreement.agentId)?.name : undefined) ?? 'You';
    note(s, person, o!, { kind: 'callback', key: 'hold:asked', words: `${who} asked ${t.casting} to book you as ${t.role.part} or let you go, with the offer for ${projectOf(against).role.part} on some of the same days.` });
    return { answerAt, against: against.id };
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
      ...(inSessionAny(person, spansOf(person, t, days)) ? { school: req?.status === 'approved' ? 'approved' as const : 'unapproved' as const } : {}),
    };
    pro.engagements.push(e);
    // What permission read when it was booked, the country's for work abroad (from 2026-10-23, the owner's brief 25).
    if (abroad(person, t)) e.eligibility = abroadRead(person, countryOfProject(t), e.days, e.id, s.now);
    e.pay = promisedPay(s, e, o!);
    // Each week's pay on the clock for its payday (`schedulePay`, `systems/propay.ts`), wired at the work loop's merge on
    // 2026-10-21: promised here, paid once when it comes.
    schedulePay(s, person, e);
    bookDays(s, person, e, t);
    // Work a long way from home books its trip (from 2026-10-23, the owner's brief 25, W6; in the US too from Module 2):
    // the flights, the cars and the hotel.
    const trip = bookTrip(s, person, e, t);
    // The contract, made now (from 2026-10-24, brief 25's Module 4, D1), and a recurring part's season on the clock: the
    // production's word on each further episode, and its option on the next season (`systems/series.ts`).
    e.contract = contractFor(s, e, o!.offer!, t, trip, seasonOf(t, e));
    scheduleSeason(s, person, e);
    // The part's scenes and the order they're shot in (from 2026-10-24, brief 25's Module 5, `planWork`).
    planWork(s, e, t);
    s.timeline.cancelFor('pro.offer', o!.id, s.now);
    // Work taken on days another part holds lets that hold go, and the part with it (`HOLD`), as the offer said it would.
    for (const x of holdsOn(person, spansOf(person, t, days), o!.id)) {
      const h = projectOf(x);
      const offered = x.status === 'offered';
      const why = `You took ${t.role.part} in ${t.project} on some of the same days, so ${offered ? `you declined ${h.role.part} in ${h.project}` : `you withdrew from ${h.role.part} in ${h.project}`} and its hold was let go.`;
      letGo(s, person, x, offered ? 'declined' : 'withdrawn', why);
      tell(s, person, offered ? `You Declined ${h.role.part}` : `You Withdrew From ${h.role.part}`, why, 60);
    }
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
    const req: OutsideWorkRequest = { id: s.nextId('pro'), opportunityId: o!.id, at: start, workingDays: days.length, classDays: classDaysIn(person, days, t.place.cityId), status: 'pending' };
    (pro.outsideWork ??= []).push(req);
    s.schedule({ at: decides, kind: SCHOOL_ANSWER_KIND, label: 'The Dean Decides On Your Outside Work', category: 'career', priority: 40, refType: 'pro.opportunity', refId: o!.id, payload: { personId: person.id, opportunityId: o!.id } });
    note(s, person, o!, { kind: 'requested', key: 'school:asked', words: `You asked the School to approve ${t.role.part} in ${t.project} in term: ${counted(days.length, 'working day')}, ${counted(req.classDays, 'class day')}.` });
    return { decides };
  });
}
