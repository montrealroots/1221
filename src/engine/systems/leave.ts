/**
 * SLATE — a leave of absence, a year repeated, and the Yale account that a term past the sixth is billed to (from
 * 2026-10-10). Until then a student ill for half a term could only take Incompletes, a course failed withheld the
 * degree with no way back, and the program ran six calendar terms whatever happened in them.
 *
 * The calendar term stays the master index; where the student is in the program is the calendar term less
 * `SchoolRecord.offset` (`academicTerm`), which a leave or a repeated year moves two terms, a whole year, so a fall
 * is always a fall. The curriculum (courses, labs, productions, the years' rules) reads the academic term; dates read
 * the calendar.
 *
 * - **A leave** (`LEAVE_RULES`): asked for (`school.request_leave`), decided by the chair and the dean in five working
 *   days (SLATE's estimate), called off while pending or before it begins (`school.cancel_leave`). Granted, it begins
 *   that day, or with the next term when the term's evaluation is past or, for a personal leave, its tenth day of
 *   classes is. Courses in progress are left `withdrawn`, taken again on return; the term's coursework, castings and
 *   any Cabaret show end; hours worked are paid and no more are worked; aid stops, and the term's living-expense
 *   scholarship is returned on the tuition rebate schedule (SLATE's reading of p.183's recalculation). Yale Health's
 *   student cover ends that day, or back to the insurance term's start with its fee refunded where classes hadn't begun;
 *   a medical leave keeps Yale Health as Affiliate cover the School pays for, and a personal one can buy it
 *   (`school.buy_affiliate`) by its deadline. Care had in a lapse is billed again as the cover then was
 *   (`repriceCare`, `systems/health.ts`). An F-1 student's personal leave is refused, with why: their record would be
 *   terminated and they would have fifteen days to leave the country, which SLATE can't play since travel went; a
 *   medical leave is an authorized reduced course load, and the I-20 is extended a year (SLATE's reading of the DSO's).
 * - **Coming back**: notice in writing eight weeks before the return term (`school.return_notice`), with a Yale Health
 *   physician's clearance after a medical leave (SLATE's: well enough, out of hospital and not laid up); registration
 *   again on return (`school.reregister`); no notice and the leave ends in dismissal, as the Bulletin's does.
 * - **A year repeated** (`EXTENDED_STUDY`): SLATE's faculty model. At the end of a year with a course failed (a Fail, a
 *   Permanent Incomplete), or within thirty days of a last year's evaluation, the student can ask to repeat the year
 *   (`school.request_repeat`); refused past nine semesters, or a second time. Granted, the year's courses are taken
 *   again; each attempt stays on the record, and the degree reads the best (`degreeShortfall`). The Bulletin's
 *   disqualification thresholds dismiss (`disqualified`).
 * - **The Yale account**: a term past the sixth has no tuition support, so its tuition and health fee are billed there,
 *   due in thirty days (SLATE's estimate); unpaid, a financial hold and the late fee, $125 a month to $375 a term; the
 *   hold stops registration and the diploma until it's paid (`school.pay_balance`). A ledger account, so the balance is
 *   the sum of its postings.
 */
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { formatDate, MS_DAY, type Instant } from '../core/time';
import { COURSES, EXTENDED_STUDY, LEAVE_RULES, MANDATORY_LEAVE, YALE_DRAMA } from '../content/school';
import {
  ESTIMATE, EVALUATION_KIND, PAYDAY_KIND, conferIfReady, advanceMates, drawCohort, formerProductions, keepCredit, schoolProduction, TERM_KIND, academicTerm, at, classPeriod, hasNeed, isClassDay, leaveCabaret, planWeek, schedule,
  schoolEnded, setStanding, termAccount, termBegins, termLabel, termStart, yearOfTerm, zone, type SchoolRecord,
} from './school';
import { degreeShortfall, failsOf, INCOMPLETE_DUE_KIND } from './courserecord';
import { courseworkOf, lapseTerm } from './coursework';
import { businessDaysOn, f1Of, scheduleUsStatus } from './permission';
import { addYears } from './documents';
import { healthOf, inHospital, repriceCare } from './health';
import { injuryOf, laidUp } from './injury';
import { inSaveMoney } from './banking';
import { drawFromBank, expenseFor } from './spending';
import { payeeAccount } from './cash';

export type LeaveKind = 'personal' | 'medical';
export type LeaveReason = 'illness' | 'injury' | 'mental-health' | 'family' | 'financial' | 'personal' | 'professional';
export const LEAVE_REASONS: Readonly<Record<LeaveReason, { kind: LeaveKind; label: string }>> = {
  illness: { kind: 'medical', label: 'Illness' },
  injury: { kind: 'medical', label: 'Injury' },
  'mental-health': { kind: 'medical', label: 'Mental Health' },
  family: { kind: 'personal', label: 'Family' },
  financial: { kind: 'personal', label: 'Money' },
  personal: { kind: 'personal', label: 'Personal' },
  professional: { kind: 'personal', label: 'A Professional Commitment' },
};

export interface Leave {
  id: string;
  kind: LeaveKind;
  reason: LeaveReason;
  requestedAt: Instant;
  /** Pending a decision; granted and waiting for its term; on; or how it ended (`rescinded`: a mandatory leave overturned on appeal). */
  status: 'pending' | 'granted' | 'refused' | 'canceled' | 'on' | 'returned' | 'dismissed' | 'withdrawn' | 'rescinded';
  /** How many terms it runs (from 2026-10-10; a leave from before is two). */
  terms?: number;
  /** A mandatory medical leave (Bulletin p.159, from 2026-10-10): its assessment, the dean's decision, and an appeal. */
  mandatory?: { assessedAt: Instant; why: string; appealBy: Instant; appeal?: { at: Instant; decideAt: Instant; outcome?: 'rescinded' | 'upheld'; why?: string } };
  /** The course records it left unfinished, by key, so an appeal that overturns it can restore them. */
  withdrawnKeys?: string[];
  /** The calendar term it begins in, and the one it ends at. */
  firstTerm: number;
  returnTerm: number;
  decideAt: Instant;
  decidedAt?: Instant;
  /** A refusal's reason, or a dismissal's. */
  why?: string;
  startedAt?: Instant;
  /** Yale Health's student cover ended: back to the insurance term's start (`retro`), or the day it began. */
  coverEnds?: Instant;
  retro?: boolean;
  /** What came back or went back on the Yale account: the health fee refunded, the scholarship returned. */
  feeRefund?: Money;
  aidReturned?: Money;
  /** Affiliate cover: the School's for a medical leave, or bought, its cost and the student fee credited. */
  affiliate?: { by: 'school' | 'self'; at: Instant; cost: Money; credit: Money };
  affiliateBy?: Instant;
  /** The term's student fee, paid and not refunded, which Affiliate cover is credited with. */
  feeCredit?: Money;
  withdrawnCourses?: string[];
  noticeBy?: Instant;
  noticeAt?: Instant;
  returnedAt?: Instant;
  f1Extended?: boolean;
}

export interface Repeat {
  requestedAt: Instant;
  status: 'pending' | 'granted' | 'refused' | 'canceled';
  decideAt: Instant;
  decidedAt?: Instant;
  why?: string;
  /** The year of the program repeated, its calendar terms, and the courses failed in it. */
  year: number;
  terms: [number, number];
  courses: string[];
}

/** Yale Health's assessment of whether a student can go on (`MANDATORY_LEAVE`): when, why, and what it found. */
export interface Welfare {
  at: Instant;
  trigger: string;
  assessAt: Instant;
  status: 'scheduled' | 'assessed' | 'decided' | 'closed';
  attended?: boolean;
  outcome?: 'fit' | 'modifications' | 'leave' | 'voluntary';
  why?: string;
  decideAt?: Instant;
  decidedAt?: Instant;
}

export const WELFARE_KIND = 'school.welfare';
export const WELFARE_DECIDE_KIND = 'school.welfare_decide';
export const APPEAL_KIND = 'school.leave_appeal';
/** An additional term asked for: the courses it retakes, their season's calendar term, and the decision. */
export interface ExtraRequest { requestedAt: Instant; decideAt: Instant; status: 'pending' | 'granted' | 'refused' | 'canceled'; term: number; courses: { code: string; academic: number; name: string }[]; why?: string }

/**
 * The financial-aid office's review of support for terms past six (from 2026-10-10): tuition support "ordinarily
 * limited to six terms ... exceptions are extremely rare" (p.182), so SLATE's office grants the exception only where a
 * medical leave, mandatory or not, made the extra terms; the six-term limit names tuition, and SLATE's office keeps
 * need-based living aid for an approved extra term. Both labeled as the office's decisions, not the Bulletin's.
 */
export interface AidReview { requestedAt: Instant; decideAt: Instant; status: 'pending' | 'decided'; tuition?: boolean; living?: boolean; why?: string }

export const EXTRA_DECIDE_KIND = 'school.extra_decide';
export const AID_DECIDE_KIND = 'school.aid_decide';
export const LEAVE_DECIDE_KIND = 'school.leave_decide';
export const LEAVE_NOTICE_KIND = 'school.leave_notice';
export const REPEAT_DECIDE_KIND = 'school.repeat_decide';
export const REPEAT_DUE_KIND = 'school.repeat_due';
export const ACCOUNT_DUE_KIND = 'school.account_due';

/** What a leave or a hold leaves on the calendar when everything else of the school's is called off. */
// Read when called: school.ts imports this module, so its constants aren't there while this one loads.
const kept = () => new Set([LEAVE_DECIDE_KIND, LEAVE_NOTICE_KIND, ACCOUNT_DUE_KIND, INCOMPLETE_DUE_KIND, PAYDAY_KIND, REPEAT_DECIDE_KIND, REPEAT_DUE_KIND, APPEAL_KIND, EXTRA_DECIDE_KIND, AID_DECIDE_KIND]);

const termNow = (school: SchoolRecord) => Math.max(0, school.termsBegun - 1);
const evaluated = (school: SchoolRecord, term: number) => school.history.some((h) => h.term === term);
const notify = (sim: Simulation, person: Person, title: string, body: string, importance = 80) => {
  if (person.id === sim.universe.playerId) sim.notify({ category: 'school', title, body, importance, route: '/workspace/school' });
};
const money = (sim: Simulation, cents: Money) => formatMoney(cents, saveCurrency(sim.universe));
const usd = (sim: Simulation, cents: Money) => inSaveMoney(sim, cents, 'USD');

/** The calendar terms they've been enrolled in: begun and not left on leave. A save from before has every term begun. */
export function enrolledTerms(school: SchoolRecord): number[] {
  return school.enrolled ?? Array.from({ length: school.termsBegun }, (_, i) => i);
}

/** The terms of leave they've had, each leave its own length. */
export const leaveTermsUsed = (school: SchoolRecord): number => (school.leaves ?? []).filter((l) => l.status === 'returned' || l.status === 'dismissed' || l.status === 'withdrawn').reduce((s, l) => s + (l.terms ?? LEAVE_RULES.terms), 0) + (school.leave?.status === 'on' ? school.leave.terms ?? LEAVE_RULES.terms : 0);

/**
 * The lengths a leave could run from where it would begin, each with why it can't where it can't (from 2026-10-10;
 * until then every leave was a year). The Bulletin allows one, two or three terms, and three in all (p.158, p.194).
 * The acting courses run in sequence, most of them year-long, fall then spring (DRAM 103a/b and its like), and the
 * Bulletin says nothing of finishing a second half on its own: so a leave must bring the student back in the season
 * of the term they'd resume, or they'd return to second halves whose first they haven't taken. Worked out from the
 * course list, not fixed: a curriculum of one-term courses would let a one-term leave through.
 */
export function leaveLengths(sim: Simulation, school: SchoolRecord, kind: LeaveKind): { terms: number; why?: string }[] {
  const start = leaveStart(sim, school, kind);
  const resume = academicTerm(school, start.term);
  const used = leaveTermsUsed(school);
  const yearLong = COURSES.filter((c) => c.year === yearOfTerm(Math.min(YALE_DRAMA.terms - 1, resume)) && c.terms.length > 1).map((c) => c.code);
  return [1, 2, 3].map((n) => {
    if (used + n > LEAVE_RULES.maxTerms) return { terms: n, why: `You’ve had ${used} term${used === 1 ? '' : 's'} of leave; the Bulletin allows ${LEAVE_RULES.maxTerms} in all.` };
    const back = termStart(start.term + n).fall;
    if (back !== termStart(start.term).fall && yearLong.length) return { terms: n, why: `You’d come back in the ${back ? 'fall' : 'spring'} to the second halves of year-long courses (${yearLong.slice(0, 2).join(', ')} and others) whose first halves you haven’t taken.` };
    return { terms: n };
  });
}

/** The day of a term's classes it is: 0 before they begin. */
export function classDayOf(term: number, now: Instant): number {
  const period = classPeriod(term);
  let n = 0;
  for (let d = period.from; at(d, 0) <= now && n < 200; d = nextDay(d)) if (isClassDay(term, d)) n += 1;
  return n;
}
const nextDay = (d: { year: number; month: number; day: number }) => {
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day + 1));
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
};

/** When a leave asked for now would begin: this term, now, or the next term's start. */
export function leaveStart(sim: Simulation, school: SchoolRecord, kind: LeaveKind): { term: number; now: boolean } {
  const t = termNow(school);
  if (evaluated(school, t)) return { term: t + 1, now: false };
  if (kind === 'medical' || sim.now < at(classPeriod(t).from, 0)) return { term: t, now: true };
  return classDayOf(t, sim.now) <= LEAVE_RULES.personalByClassDay ? { term: t, now: true } : { term: t + 1, now: false };
}

/** Whether a Yale Health physician would recommend a medical leave: care, an injury or illness within the lookback, or unwell now. */
export function physicianRecommends(person: Person, now: Instant): boolean {
  const h = healthOf(person);
  const since = now - LEAVE_RULES.medicalLookbackDays * MS_DAY;
  if ((h.inHospitalUntil ?? 0) > since || (h.fluUntil ?? 0) > since) return true;
  if (h.injury && h.injury.until > since) return true;
  if (h.bills.some((b) => b.at > since && /visit|urgent|emergency|hospital|stay|doctor/i.test(b.what))) return true;
  return person.wellbeing.condition < ESTIMATE.sickBelow;
}

/** Whether a Yale Health physician would clear a return now. */
export function clearedToReturn(person: Person, now: Instant): string | undefined {
  if (inHospital(person, now)) return 'You’re in hospital: a Yale Health physician can’t clear you to come back yet.';
  if (laidUp(person, now)) return `You’re laid up until ${formatDate(injuryOf(person, now)!.offWorkUntil!, zone())}: a Yale Health physician can’t clear you yet.`;
  if ((healthOf(person).fluUntil ?? 0) > now) return 'You’re down with the flu: a Yale Health physician can’t clear you until it’s past.';
  if (person.wellbeing.condition < ESTIMATE.sickBelow) return 'You’re not well enough yet for a Yale Health physician to clear you to come back.';
  return undefined;
}

/** Why a leave of a kind, for a reason, can't be asked for now, or nothing. */
export function leaveRefusal(sim: Simulation, person: Person, kind: LeaveKind, reason?: LeaveReason): string | undefined {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return 'You’re not at school.';
  if (school.termsBegun === 0) return 'A leave is from the program, and your first term hasn’t begun.';
  const l = school.leave;
  if (l?.status === 'pending') return `Your request is with the chair and the dean, decided by ${formatDate(l.decideAt, sim.zone)}.`;
  if (l?.status === 'granted') return `Your leave is granted, from ${termLabel(l.firstTerm)}.`;
  if (l?.status === 'on') return 'You’re on leave.';
  if (school.repeat?.status === 'pending') return 'Your request to repeat the year is being decided.';
  if (school.awaitingDegree || school.repeatBy !== undefined) return 'Your terms are done; what’s left is the degree.';
  if (reason && LEAVE_REASONS[reason].kind !== kind) return `${LEAVE_REASONS[reason].label} is a reason for a ${LEAVE_REASONS[reason].kind} leave.`;
  if (reason === 'professional') return 'The School doesn’t normally grant a leave to take on a professional commitment.';
  const lengths = leaveLengths(sim, school, kind);
  if (!lengths.some((x) => !x.why)) return lengths.find((x) => x.terms === LEAVE_RULES.terms)?.why ?? lengths[0]!.why;
  const start = leaveStart(sim, school, kind);
  if (academicTerm(school, start.term) >= YALE_DRAMA.terms) return 'Your terms in the program are done.';
  if (kind === 'personal') {
    if (f1Of(person)) return 'On an F-1, a personal leave ends your status: the School would report it, and you’d have fifteen days to leave the United States, which SLATE can’t play. A medical leave keeps your status, as a reduced course load.';
    if (academicTerm(school, termNow(school)) === 0 && !evaluated(school, termNow(school))) return 'A personal leave comes after one term completed.';
    const open = degreeShortfall(school);
    if (open.incomplete.length) return `A personal leave asks you to be current with your requirements: make up ${open.incomplete.map((r) => r.name).join(', ')} first.`;
    if (open.failed.length) return `A personal leave asks you to be current with your requirements, and ${open.failed.map((r) => r.name).join(', ')} ${open.failed.length === 1 ? 'isn’t' : 'aren’t'} passed.`;
  } else if (!physicianRecommends(person, sim.now)) {
    return `A medical leave is on a Yale Health physician’s written recommendation, and nothing in the last ${LEAVE_RULES.medicalLookbackDays} days would bring one: no illness, injury or stay in hospital.`;
  }
  return undefined;
}

/** A leave asked for: with the chair and the dean. */
export function requestLeave(sim: Simulation, person: Person, kind: LeaveKind, reason: LeaveReason, terms: number = LEAVE_RULES.terms): Leave {
  const no = leaveRefusal(sim, person, kind, reason);
  if (no) throw new CommandError(no);
  const school = person.school!;
  const length = leaveLengths(sim, school, kind).find((x) => x.terms === terms);
  if (!length) throw new CommandError('A leave is one, two or three terms.');
  if (length.why) throw new CommandError(length.why);
  const start = leaveStart(sim, school, kind);
  const decideAt = Math.min(businessDaysOn(sim.now, LEAVE_RULES.decideWorkingDays), start.now ? Number.POSITIVE_INFINITY : Math.max(sim.now + 3_600_000, at(termStart(start.term).date, 8)));
  const leave: Leave = { id: `leave-${(school.leaves?.length ?? 0) + 1}`, kind, reason, requestedAt: sim.now, status: 'pending', firstTerm: start.term, returnTerm: start.term + terms, terms, decideAt };
  school.leave = leave;
  sim.schedule({ at: decideAt, kind: LEAVE_DECIDE_KIND, label: 'Your Leave: The Decision', category: 'school', priority: 33, payload: { personId: person.id, leaveId: leave.id } });
  return leave;
}

/** Ends whatever leave is open, on the way out of the School. */
export function closeLeave(school: SchoolRecord, status: 'withdrawn' | 'dismissed'): void {
  const l = school.leave;
  if (!l) return;
  if (l.status === 'pending' || l.status === 'granted') l.status = 'canceled';
  else if (l.status === 'on') l.status = status;
  (school.leaves ??= []).push(l);
  delete school.leave;
}

const cancelPending = (sim: Simulation, person: Person, keep = kept()) => {
  for (const i of sim.universe.scheduled) if (i.status === 'pending' && i.kind.startsWith('school.') && i.payload.personId === person.id && !keep.has(i.kind)) sim.timeline.cancel(i.id, sim.now);
};

/** The insurance term a calendar term falls in begins: 1 August for a fall, 1 February for a spring. */
export function insuranceStart(term: number): Instant {
  const s = termStart(term);
  const [m, d] = s.fall ? LEAVE_RULES.insuranceTermFrom.fall : LEAVE_RULES.insuranceTermFrom.spring;
  return at({ year: s.date.year, month: m, day: d }, 0);
}

/** The share of a term's living-expense scholarship returned on a leave begun now: the rebate schedule's. */
export function rebateShare(term: number, now: Instant): number {
  const period = classPeriod(term);
  const from = at(period.from, 0), to = at(period.to, 23);
  if (now <= from) return 1;
  const passed = (now - from) / Math.max(1, to - from);
  for (const [upTo, share] of LEAVE_RULES.rebate) if (passed <= upTo) return share;
  return 0;
}

/**
 * The leave begins: the term left, the cover, the aid and the status, and the way back on the calendar. `begun`: the
 * term's start had run, its aid and fee with it; false where the leave begins with the term, which then never runs.
 */
export function startLeave(sim: Simulation, person: Person, begun = true): void {
  const school = person.school!;
  const l = school.leave!;
  const t = l.firstTerm;
  const begunHere = begun && school.termsBegun > t;
  cancelPending(sim, person);
  // Courses in progress are left, and taken again on return.
  const left: string[] = [];
  const keys: string[] = [];
  for (const [key, r] of Object.entries(school.courses ?? {})) if (r.term === t && r.result === undefined) { r.result = 'withdrawn'; r.why = 'left on a leave of absence'; left.push(r.name); keys.push(key); }
  l.withdrawnCourses = left;
  l.withdrawnKeys = keys;
  lapseTerm(sim, person, t);
  leaveCabaret(sim, person, 'a leave of absence');
  // What was played before the leave goes on the résumé now, and the castings close (from the acceptance pass of
  // 2026-10-11): until then a run finished before a leave waited for the next casting, a year on, to be credited.
  keepCredit(sim, school);
  delete school.casting;
  delete school.rep;
  // The term isn't one enrolled in.
  school.enrolled = enrolledTerms(school).filter((x) => x !== t);
  const n = l.terms ?? LEAVE_RULES.terms;
  // Back to the class a year below: the class they leave goes on (`joinCohort`, at the term they resume). A term left
  // partway isn't played forward for the class, which had that part of it with the player already: SLATE's boundary.
  school.joinsCohort ??= { offsetBefore: school.offset ?? 0, lastWith: begunHere ? t : t - 1 };
  school.offset = (school.offset ?? 0) + n;
  school.classOf += Math.round(n / 2);
  l.status = 'on';
  l.startedAt = sim.now;
  // The aid of a term begun: returned on the rebate schedule; the health fee back where the cover goes back to its start.
  const cur = saveCurrency(sim.universe);
  // Costs grow with the calendar (`termAccount`), so the calendar term.
  const account = termAccount(cur, hasNeed(person), t);
  const beforeClasses = sim.now <= at(classPeriod(t).from, 23, 59);
  l.retro = begunHere && beforeClasses;
  if (begunHere) {
    const aided = school.enrolledBilled?.[String(t)] === undefined;
    const share = rebateShare(t, sim.now);
    if (hasNeed(person) && aided && share > 0) {
      l.aidReturned = Math.round(share * account.livingScholarship);
      chargeAccount(sim, person, l.aidReturned, `Living-expense scholarship returned on the rebate schedule (${Math.round(share * 100)}%), ${termLabel(t)}: leave of absence`);
    }
    if (!l.retro) l.feeCredit = account.healthPlan;
    if (l.retro) {
      l.feeRefund = account.healthPlan;
      creditAccount(sim, person, l.feeRefund, `Yale Health fee refunded, ${termLabel(t)}: cover canceled back to the insurance term’s start`);
    }
    const billed = school.enrolledBilled?.[String(t)];
    if (billed && share > 0) creditAccount(sim, person, Math.round(share * billed), `Tuition rebated (${Math.round(share * 100)}%), ${termLabel(t)}: leave of absence`);
  }
  l.coverEnds = !begunHere || l.retro ? insuranceStart(t) : sim.now;
  if (l.kind === 'medical') {
    l.affiliate = { by: 'school', at: sim.now, cost: 0, credit: 0 };
  } else {
    (school.uncovered ??= []).push({ from: l.coverEnds });
    const season = termStart(t).fall ? LEAVE_RULES.affiliateBy.fall : LEAVE_RULES.affiliateBy.spring;
    // 15 September or 31 January, or thirty days from applying for the leave, whichever is later.
    l.affiliateBy = Math.max(at({ year: termStart(t).date.year, month: season[0], day: season[1] }, 23, 59), l.requestedAt + LEAVE_RULES.affiliateDays * MS_DAY);
    if (l.coverEnds < sim.now) repriceCare(sim, person, l.coverEnds, sim.now, 'Yale Health cover canceled back to the insurance term’s start, on a leave of absence');
  }
  // What was worked is paid; no more is worked.
  if (school.workStudy.owedHours > 0 && !sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind === PAYDAY_KIND && i.payload.personId === person.id)) schedule(sim, person, sim.now + 60_000, { kind: PAYDAY_KIND, label: 'Work-Study Payday', minutes: 0, requiresPlayer: false });
  // An F-1 student's I-20 runs a year longer, as the reduced course load allows.
  const f1 = f1Of(person);
  if (f1?.expiresAt !== undefined) { f1.expiresAt = addYears(f1.expiresAt, n / 2); l.f1Extended = true; scheduleUsStatus(sim, person); }
  // The way back.
  const back = at(termStart(l.returnTerm).date, 9);
  l.noticeBy = back - LEAVE_RULES.noticeWeeks * 7 * MS_DAY;
  if (l.noticeBy - 14 * MS_DAY > sim.now) sim.schedule({ at: l.noticeBy - 14 * MS_DAY, kind: LEAVE_NOTICE_KIND, label: 'Your Leave: Notice Of Return Due', category: 'school', priority: 33, payload: { personId: person.id, remind: true } });
  sim.schedule({ at: Math.max(l.noticeBy, sim.now + 60_000), kind: LEAVE_NOTICE_KIND, label: 'Your Leave: Notice Of Return Due', category: 'school', priority: 33, payload: { personId: person.id } });
  sim.schedule({ at: Math.max(back, sim.now + 120_000), kind: TERM_KIND, label: termBegins(l.returnTerm), category: 'school', priority: 30, payload: { personId: person.id, term: l.returnTerm } });
  notify(sim, person, 'Your Leave Has Begun', [
    `You’re on a ${l.kind} leave until ${termLabel(l.returnTerm)}, ${formatDate(back, zone())}${termStart(l.returnTerm).estimate ? ', SLATE’s estimate' : ''}.`,
    left.length ? `${left.join(', ')} ${left.length === 1 ? 'is' : 'are'} left unfinished, to be taken again when you’re back.` : '',
    l.aidReturned ? `${money(sim, l.aidReturned)} of the term’s scholarship goes back on the rebate schedule, on your Yale account.` : '',
    l.kind === 'medical' ? 'Yale Health keeps covering you as Affiliate cover, which the School pays for.' : `Yale Health’s student cover ${l.retro ? 'is canceled back to the insurance term’s start, and its fee refunded' : l.coverEnds! > sim.now ? `ends on ${formatDate(l.coverEnds!, zone())}` : 'ended today'}. Affiliate cover, ${money(sim, usd(sim, LEAVE_RULES.affiliatePerTerm))} a term, can be bought until ${formatDate(l.affiliateBy!, zone())}.`,
    l.f1Extended ? 'Your I-20 is extended a year, as an authorized reduced course load.' : '',
    `Give notice of your return by ${formatDate(l.noticeBy, zone())}${l.kind === 'medical' ? ', with a Yale Health physician’s clearance' : ''}, or the leave ends in dismissal.`,
  ].filter(Boolean).join(' '), 85);
}

/** Back from leave at the term it ends: the cover back, and registration to do again. */
export function returnFromLeave(sim: Simulation, person: Person): void {
  const school = person.school!;
  const l = school.leave!;
  l.status = 'returned';
  l.returnedAt = sim.now;
  for (const gap of school.uncovered ?? []) if (gap.until === undefined) gap.until = sim.now;
  (school.leaves ??= []).push(l);
  delete school.leave;
  school.mustRegister = true;
  planWeek(sim, person, sim.now);
  notify(sim, person, 'Back From Your Leave', `Welcome back for ${termLabel(l.returnTerm)}. Register on the Standing tab before classes: until you do, they don’t count you. You’re in year ${yearOfTerm(academicTerm(school, l.returnTerm))} again, with the courses you left, in the class of ${school.classOf}.`, 85);
}

/**
 * A first class played on through each term it has (from 2026-10-10, `tools/scenarios.ts`): until then it was played
 * forward to the term the student rejoined and stopped there, still a year ahead a year after its own degree. Each
 * term the student's calendar reaches, the classes they began with have theirs, to their sixth. A class kept before
 * its offset was (`offset` absent) stays where it was.
 */
export function followFormerClasses(sim: Simulation, person: Person, term: number): void {
  for (const c of person.school?.formerClasses ?? []) {
    if (c.offset === undefined) continue;
    // A term at a time, its classes then its productions (`formerProductions`, from the integration pass of
    // 2026-10-10), so a run grows craft the term's classes grew first, as the student's own class's does; and only a
    // term that's over, its last class day and its last night both past (`formerTermEnds`), so nothing is recorded
    // before it happened.
    for (let t = c.playedTo + 1; t < term; t += 1) {
      const academic = t - c.offset;
      if (academic < YALE_DRAMA.terms && sim.now < formerTermEnds(t, academic)) break;
      advanceMates(c.classmates, [academic]);
      formerProductions(sim, person, c, t, academic);
      c.playedTo = t;
      // Its sixth term over, the class has its degrees: said once, as the term is played once (`playedTo` passes it; a
      // guard on `graduatedAt` besides was found redundant by mutation in the integration pass).
      if (academic === YALE_DRAMA.terms - 1) {
        c.graduatedAt = sim.now;
        if (person.id === sim.universe.playerId) notify(sim, person, `The Class Of ${c.classOf} Graduates`, `Your first class has its degrees: ${c.classmates.slice(0, 3).map((m) => m.name).join(', ')} and the rest. What you shared with them stays on your record.`, 55);
      }
    }
    // The next term's end, on the calendar, while the class has a term left (`FORMER_KIND`): a term is caught up there,
    // not months later at the next term's start.
    const next = c.playedTo + 1;
    if (next - c.offset < YALE_DRAMA.terms && !sim.universe.scheduled.some((i) => i.kind === FORMER_KIND && i.status === 'pending' && i.payload.personId === person.id && i.payload.term === next)) {
      sim.schedule({ at: Math.max(sim.now + 60_000, formerTermEnds(next, next - c.offset)), kind: FORMER_KIND, label: `The Class Of ${c.classOf}`, category: 'system', priority: 30, payload: { personId: person.id, term: next } });
    }
  }
}

/** A first class's term caught up at its end (`followFormerClasses`). */
export const FORMER_KIND = 'school.former_class';

/** When a first class's term is over: the day after its last class day or its last night, whichever is later. */
export function formerTermEnds(term: number, academic: number): Instant {
  let last = classPeriod(term).to;
  for (let rank = 1; rank <= YALE_DRAMA.classSize; rank += 1) {
    const p = schoolProduction(term, rank, academic);
    const end = p?.runs[p.runs.length - 1];
    if (end && (end.year * 10000 + end.month * 100 + end.day) > (last.year * 10000 + last.month * 100 + last.day)) last = end;
  }
  return at(last, 23) + MS_DAY;
}

/** Where a first class is in its program at a calendar term: its academic term, past the sixth once it has its degree. */
export const formerStage = (c: NonNullable<SchoolRecord['formerClasses']>[number], term: number): number | undefined => (c.offset === undefined ? undefined : term - c.offset);

/**
 * Fallen a year behind, by a leave or a repeated year, a student goes on with the class that's now at their stage
 * (from 2026-10-10; until then the first class waited for them, frozen, and was still at their side on return). The
 * first class is kept whole, every relationship and record, and played forward through the terms it went on without
 * them, their classes and their productions (`followFormerClasses`); the new class is drawn (`drawCohort`) and
 * brought to the same stage by the terms they've had, their productions among them (`joinedHistory`, from the
 * integration pass of 2026-10-10: until then both classes had only their classes played forward). Coursework kept
 * from before keeps its partners' names.
 */
export function joinCohort(sim: Simulation, person: Person, term: number): void {
  const school = person.school!;
  const academic = academicTerm(school, term);
  const old = school.classmates;
  // The first class's place in the program at each calendar term since: the term less the offset the student had
  // before falling behind, which is theirs.
  const behind = school.joinsCohort ?? { offsetBefore: Math.max(0, (school.offset ?? 0) - 2), lastWith: term - 1 };
  const stamp = courseworkOf(sim, person);
  for (const a of stamp?.assignments ?? []) if (a.partner !== undefined && a.partnerName === undefined) a.partnerName = old[a.partner]?.name;
  (school.formerClasses ??= []).push({ classOf: school.classOf - 1, classmates: old, playedTo: behind.lastWith, left: sim.now, offset: behind.offsetBefore });
  followFormerClasses(sim, person, term);
  const next = drawCohort(sim, person, school.classOf);
  const joined = { classOf: school.classOf, classmates: next, playedTo: -1, left: sim.now, productions: [] as NonNullable<NonNullable<SchoolRecord['formerClasses']>[number]['productions']> };
  for (let a = 0; a < academic; a += 1) { advanceMates(next, [a]); formerProductions(sim, person, joined, term - academic + a, a); }
  if (joined.productions.length) school.joinedHistory = joined.productions;
  school.classmates = next;
  delete school.around;
  delete school.castRead;
  notify(sim, person, `The Class Of ${school.classOf}`, `You go on with the class of ${school.classOf}, ${next.length} actors in their ${academic % 2 === 0 ? 'first' : 'second'} term of year ${yearOfTerm(academic)}, as you are. Your first class, the class of ${school.classOf - 1}, is a year ahead now; they’re on the Standing tab, and what you shared with them stays yours.`, 75);
}

// ---------------------------------------------------------------------------
// Disqualification, an additional term, and the aid review
// ---------------------------------------------------------------------------

/**
 * The faculty's review of a disqualification (p.194 says a student "may be" disqualified), from 2026-10-10: SLATE's
 * faculty dismiss a student already on academic warning, one reviewed before, or one with no repeat left within nine
 * semesters; otherwise they place them on warning, the year to be repeated (`school.request_repeat` at its end).
 * Nothing when the thresholds aren't met. Kept on the record.
 */
export function facultyReview(sim: Simulation, person: Person, term: number): { outcome: 'dismissed' | 'warning'; why: string } | undefined {
  const school = person.school!;
  const out = disqualified(school);
  if (!out) return undefined;
  const already = school.standing === 'warning';
  const before = (school.reviews ?? []).length > 0;
  const room = enrolledTerms(school).length + 2 <= EXTENDED_STUDY.maxSemesters;
  const outcome = already || before || !room ? 'dismissed' : 'warning';
  const why = outcome === 'dismissed'
    ? `${out} The faculty reviewed it and disqualified you: ${already ? 'you were already on academic warning' : before ? 'they had reviewed a disqualification before' : 'there’s no room left to repeat the year within nine semesters'}.`
    : `${out} The faculty reviewed it and kept you, on academic warning: the year is to be repeated, which you ask for at its end.`;
  (school.reviews ??= []).push({ at: sim.now, term, outcome, why });
  if (outcome === 'warning') { school.standing = 'warning'; notify(sim, person, 'A Faculty Review: On Warning', why, 90); }
  return { outcome, why };
}

/** The courses an additional term would retake, the earliest season first: failed or left, not passed since. */
export function extraCourses(school: SchoolRecord): { season: 'fall' | 'spring'; courses: { code: string; academic: number; name: string }[] }[] {
  const open = degreeShortfall(school).failed;
  const by = (fall: boolean) => open.filter((r) => termStart(r.academic ?? r.term).fall === fall).map((r) => ({ code: r.code, academic: r.academic ?? r.term, name: r.name }));
  return [{ season: 'fall' as const, courses: by(true) }, { season: 'spring' as const, courses: by(false) }].filter((x) => x.courses.length);
}

/** Why an additional term can't be asked for now, or nothing, and the term it would be. */
export function extraRefusal(sim: Simulation, person: Person): { why?: string; term?: number; courses?: { code: string; academic: number; name: string }[] } {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return { why: 'You’re not at school.' };
  if (school.extraRequest?.status === 'pending') return { why: `Your request is with the chair and the dean, decided by ${formatDate(school.extraRequest.decideAt, sim.zone)}.` };
  if (school.extra) return { why: `Your additional term is ${termLabel(school.extra.term)}.` };
  if (school.repeat?.status === 'pending') return { why: 'Your request to repeat the year is being decided.' };
  const t = termNow(school);
  if (school.repeatBy === undefined && !school.awaitingDegree) return { why: 'An additional term comes after your last year’s evaluation, for what it left unpassed.' };
  if (school.repeatBy !== undefined && sim.now > school.repeatBy) return { why: 'Its thirty days have run out.' };
  const plan = extraCourses(school);
  if (!plan.length) return { why: 'Every course is passed: there’s nothing to retake.' };
  // The next term whose season has retakes.
  let term = t + 1;
  while (!plan.some((p) => (p.season === 'fall') === termStart(term).fall)) term += 1;
  const courses = plan.find((p) => (p.season === 'fall') === termStart(term).fall)!.courses;
  const would = enrolledTerms(school).length + 1 + (term - t - 1 > 0 ? 0 : 0);
  if (would > EXTENDED_STUDY.maxSemesters) return { why: `It would make ${would} semesters, past the nine the Bulletin allows.` };
  if (disqualified(school)) return { why: 'The faculty’s disqualification stands against it.' };
  return { term, courses };
}

// ---------------------------------------------------------------------------
// A mandatory medical leave
// ---------------------------------------------------------------------------

/** What would start an assessment now: the student's observed function, never a diagnosis; or nothing. */
export function welfareTrigger(sim: Simulation, person: Person): string | undefined {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return undefined;
  const since = sim.now - MANDATORY_LEAVE.lookbackDays * MS_DAY;
  const stays = (healthOf(person).careLog ?? []).filter((c) => c.care === 'stay' && c.at >= since).length;
  if (stays >= MANDATORY_LEAVE.stays) return `${stays} stays in hospital in ${MANDATORY_LEAVE.lookbackDays} days`;
  const t = school.tally;
  if (t.classDays >= MANDATORY_LEAVE.minClassDays && t.excused / t.classDays >= MANDATORY_LEAVE.excusedShare) return `${t.excused} of the term’s ${t.classDays} class days missed ill`;
  return undefined;
}

/** A class day missed ill, or a stay in hospital: whether Yale Health asks to assess the student. */
export function considerWelfare(sim: Simulation, person: Person): void {
  const school = person.school;
  if (!school || school.welfare || school.leave) return;
  const trigger = welfareTrigger(sim, person);
  if (!trigger) return;
  const assessAt = businessDaysOn(sim.now, MANDATORY_LEAVE.assessWorkingDays);
  school.welfare = { at: sim.now, trigger, assessAt, status: 'scheduled' };
  sim.schedule({ at: assessAt, kind: WELFARE_KIND, label: 'Yale Health: An Assessment', category: 'school', priority: 34, requiresPlayer: true, durationMinutes: MANDATORY_LEAVE.assessMinutes, locationId: YALE_DRAMA.cityId, payload: { personId: person.id } });
  notify(sim, person, 'Yale Health Asks To See You', `With ${trigger}, Yale Health has asked to assess whether you can go on with your studies for now, on ${formatDate(assessAt, zone())}. It’s an individual assessment of how you’re managing and what the School can adjust for you, not of any diagnosis; it can end with nothing changed, with modifications, or with a recommendation of a medical leave that the dean decides. You can ask for a medical leave yourself first. Refusing the assessment is itself a ground the Bulletin names.`, 90);
}

/** What an assessment finds now: fit; back within two weeks, so the modifications are enough; or not, so a leave. */
export function assess(sim: Simulation, person: Person): { outcome: 'fit' | 'modifications' | 'leave'; why: string } {
  if (!clearedToReturn(person, sim.now)) return { outcome: 'fit', why: 'You’re managing your studies now: nothing needs to change.' };
  const h = healthOf(person);
  const soon = sim.now + MANDATORY_LEAVE.soonDays * MS_DAY;
  const back = Math.max(h.inHospitalUntil ?? 0, h.fluUntil ?? 0, injuryOf(person, sim.now)?.offWorkUntil ?? 0);
  if (back > sim.now && back <= soon) return { outcome: 'modifications', why: `You should be back on your feet by ${formatDate(back, zone())}: excused absences and Incompletes, which the School already gives, are enough.` };
  return { outcome: 'leave', why: back > soon ? `You won’t be able to take part in classes before ${formatDate(back, zone())}, past what excused absences and Incompletes can carry.` : 'You aren’t able to take part in classes, and nothing says when you will be.' };
}

/** A mandatory leave's appeal decided: overturned if the student's cleared and the term is young enough to resume. */
function rescindable(sim: Simulation, person: Person, l: Leave): string | undefined {
  if (clearedToReturn(person, sim.now)) return `You weren’t cleared: ${clearedToReturn(person, sim.now)}`;
  const period = classPeriod(l.firstTerm);
  const from = at(period.from, 0), to = at(period.to, 23);
  if ((to - sim.now) / Math.max(1, to - from) < MANDATORY_LEAVE.resumeWithin) return 'Too much of the term has gone to resume it.';
  if (termNow(person.school!) !== l.firstTerm) return 'The term it began in is over.';
  return undefined;
}

/** A mandatory leave overturned: the term resumed, its courses restored, the way back taken off the calendar. */
function rescind(sim: Simulation, person: Person, l: Leave): void {
  const school = person.school!;
  const n = l.terms ?? LEAVE_RULES.terms;
  for (const key of l.withdrawnKeys ?? []) { const r = school.courses?.[key]; if (r && r.result === 'withdrawn') { delete r.result; delete r.why; } }
  school.offset = Math.max(0, (school.offset ?? 0) - n);
  school.classOf -= Math.round(n / 2);
  delete school.joinsCohort;
  school.enrolled = [...new Set([...enrolledTerms(school), l.firstTerm])].sort((a, b) => a - b);
  if (l.aidReturned) creditAccount(sim, person, l.aidReturned, `Living-expense scholarship restored, ${termLabel(l.firstTerm)}: the leave overturned on appeal`);
  const f1 = f1Of(person);
  if (l.f1Extended && f1?.expiresAt !== undefined) { f1.expiresAt = addYears(f1.expiresAt, -n / 2); scheduleUsStatus(sim, person); }
  for (const i of sim.universe.scheduled) if (i.status === 'pending' && i.payload.personId === person.id && (i.kind === LEAVE_NOTICE_KIND || (i.kind === TERM_KIND && i.payload.term === l.returnTerm))) sim.timeline.cancel(i.id, sim.now);
  l.status = 'rescinded';
  (school.leaves ??= []).push(l);
  delete school.leave;
  planWeek(sim, person, sim.now);
  schedule(sim, person, at(classPeriod(l.firstTerm).to, 17), { kind: EVALUATION_KIND, label: `${termLabel(l.firstTerm)} Evaluation`, minutes: 0, payload: { term: l.firstTerm }, requiresPlayer: false });
  if (academicTerm(school, l.firstTerm) + 1 < YALE_DRAMA.terms) sim.schedule({ at: Math.max(at(termStart(l.firstTerm + 1).date, 9), sim.now + 60_000), kind: TERM_KIND, label: termBegins(l.firstTerm + 1), category: 'school', priority: 30, payload: { personId: person.id, term: l.firstTerm + 1 } });
}

/** A term past the sixth enrolled in: no tuition support, so its tuition and health fee are billed to the Yale account. */
export function billUnsupportedTerm(sim: Simulation, person: Person, term: number, livingPaid = false): void {
  const school = person.school!;
  const cur = saveCurrency(sim.universe);
  const a = termAccount(cur, false, term);
  (school.enrolledBilled ??= {})[String(term)] = a.tuition;
  chargeAccount(sim, person, a.tuition, `Tuition, ${termLabel(term)}: a term past the six the tuition scholarship supports`);
  // The health fee is met by the living scholarship where it's paid (the term's own posting, `TERM_KIND`).
  if (!livingPaid) chargeAccount(sim, person, a.healthPlan, `Yale Health fee, ${termLabel(term)}`);
  sim.schedule({ at: sim.now + EXTENDED_STUDY.dueDays * MS_DAY, kind: ACCOUNT_DUE_KIND, label: 'Yale Account: Payment Due', category: 'school', priority: 33, payload: { personId: person.id, term } });
  notify(sim, person, 'A Term Without Tuition Support', `The tuition scholarship supports six terms, and this is your ${enrolledTerms(school).length}th: ${money(sim, a.tuition)} tuition and ${money(sim, a.healthPlan)} for Yale Health are on your Yale account, due by ${formatDate(sim.now + EXTENDED_STUDY.dueDays * MS_DAY, zone())}. Unpaid, a financial hold stops registration and the diploma, with a ${money(sim, usd(sim, EXTENDED_STUDY.lateFee))} late fee a month.`, 85);
}

// ---------------------------------------------------------------------------
// The Yale account
// ---------------------------------------------------------------------------

/** The student's Yale account, a ledger account: what's owed is the sum of its postings. */
export function yaleAccount(sim: Simulation, person: Person, open = true): Account | undefined {
  const found = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'loan' && a.category === 'yale-account');
  if (found || !open) return found;
  return sim.openAccount({ id: sim.nextId('account'), kind: 'loan', name: 'Yale Student Account', ownerId: person.id, institution: 'Yale University', openedAt: sim.now, category: 'yale-account', apr: 0 });
}

/** What's owed on it: positive owed, negative a credit. */
export const accountOwed = (sim: Simulation, person: Person): Money => 0 - (yaleAccount(sim, person, false)?.balance ?? 0) || 0;

function chargeAccount(sim: Simulation, person: Person, amount: Money, memo: string): void {
  if (amount <= 0) return;
  sim.post({ memo, category: 'school', postings: [{ accountId: sim.nominalAccount('expense', expenseFor('school')).id, amount }, { accountId: yaleAccount(sim, person)!.id, amount: -amount }] });
}

/** A credit on the account; a credit balance left over is refunded to the bank, as Yale refunds one. */
function creditAccount(sim: Simulation, person: Person, amount: Money, memo: string): void {
  if (amount <= 0) return;
  const acc = yaleAccount(sim, person)!;
  sim.post({ memo, category: 'school', postings: [{ accountId: acc.id, amount }, { accountId: sim.nominalAccount('expense', expenseFor('school')).id, amount: -amount }] });
  if (acc.balance > 0) {
    const back = acc.balance;
    sim.post({ memo: 'Yale account credit balance refunded', category: 'school', postings: [{ accountId: payeeAccount(sim, person).id, amount: back }, { accountId: acc.id, amount: -back }] });
  }
}

/** Why a payment on the Yale account can't be made, or nothing. */
export function payBalanceRefusal(sim: Simulation, person: Person, amount: Money): string | undefined {
  const owed = accountOwed(sim, person);
  if (owed <= 0) return 'Your Yale account owes no balance.';
  if (!(amount > 0)) return 'Pay something.';
  if (amount > owed) return `${money(sim, owed)} is owed; pay that or less.`;
  if (drawFromBank(sim, person, amount, false).short > 0) return 'Your bank can’t cover it.';
  return undefined;
}

/** A payment from the bank onto the Yale account; the hold lifts once nothing is owed. */
export function payBalance(sim: Simulation, person: Person, amount: Money): { owed: Money; held: boolean } {
  const no = payBalanceRefusal(sim, person, amount);
  if (no) throw new CommandError(no);
  const bank = drawFromBank(sim, person, amount, false);
  sim.post({ memo: 'Payment: Yale Student Account', category: 'school', postings: [...bank.postings, { accountId: yaleAccount(sim, person)!.id, amount }] });
  const school = person.school!;
  const owed = accountOwed(sim, person);
  if (owed <= 0 && school.hold !== undefined) {
    delete school.hold;
    notify(sim, person, 'The Financial Hold Is Lifted', 'Your Yale account is paid. Registration and the diploma are open to you again.', 70);
    conferIfReady(sim, person, 'Your Yale account paid');
  }
  return { owed, held: school.hold !== undefined };
}

/** The account's due date passed: a hold and the month's late fee, to the term's cap; again in a month while owed. */
export function accountDue(sim: Simulation, person: Person, term: number): void {
  const school = person.school;
  if (!school) return;
  const owed = accountOwed(sim, person);
  if (owed <= 0) return;
  school.hold ??= sim.now;
  const fees = (school.lateFees ??= {});
  const key = String(term);
  const fee = Math.min(usd(sim, EXTENDED_STUDY.lateFee), usd(sim, EXTENDED_STUDY.lateFeeTermCap) - (fees[key] ?? 0));
  if (fee > 0) {
    fees[key] = (fees[key] ?? 0) + fee;
    chargeAccount(sim, person, fee, `Late payment fee, ${termLabel(term)}`);
  }
  if (!schoolEnded(school.standing)) sim.schedule({ at: sim.now + 30 * MS_DAY, kind: ACCOUNT_DUE_KIND, label: 'Yale Account: Payment Due', category: 'school', priority: 33, payload: { personId: person.id, term } });
  notify(sim, person, 'A Financial Hold', `${money(sim, accountOwed(sim, person))} is owed on your Yale account${fee > 0 ? `, with a ${money(sim, fee)} late fee` : ''}. While it’s unpaid, a hold stops registration and the diploma. Pay it on the Standing tab.`, 85);
}

// ---------------------------------------------------------------------------
// Failing, repeating and disqualification
// ---------------------------------------------------------------------------

/**
 * The Bulletin's disqualification (p.194): two Fails in a term, three by the end of the second enrolled, four by the
 * third, five by the fourth, six by the fifth, or seven in all. SLATE's faculty act on it at the evaluation; the
 * Bulletin says a student "may be" disqualified.
 */
export function disqualified(school: SchoolRecord): string | undefined {
  const fails = failsOf(school);
  if (!fails.length) return undefined;
  const order = enrolledTerms(school);
  const byTerm = new Map<number, number>();
  for (const r of fails) byTerm.set(r.term, (byTerm.get(r.term) ?? 0) + 1);
  for (const [term, n] of byTerm) if (n >= EXTENDED_STUDY.disqualify.inOneTerm) return `${n} courses failed in ${termLabel(term)}: the Bulletin disqualifies a student with ${EXTENDED_STUDY.disqualify.inOneTerm} Failures in a term.`;
  for (const [n, most] of Object.entries(EXTENDED_STUDY.disqualify.byTerm)) {
    const upTo = order.slice(0, Number(n));
    if (order.length < Number(n)) continue;
    const count = fails.filter((r) => upTo.includes(r.term)).length;
    if (count >= most) return `${count} Failures by the end of your ${ordinal(Number(n))} term: the Bulletin disqualifies at ${most}.`;
  }
  if (fails.length >= EXTENDED_STUDY.disqualify.total) return `${fails.length} Failures in all: the Bulletin disqualifies at ${EXTENDED_STUDY.disqualify.total}.`;
  return undefined;
}
const ordinal = (n: number) => ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'][n - 1] ?? `${n}th`;

/** The year just finished, its two calendar terms, and its courses not passed; or why a repeat can't be asked for. */
export function repeatRefusal(sim: Simulation, person: Person): string | undefined {
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return 'You’re not at school.';
  if (school.repeat?.status === 'pending') return `Your request is with the chair and the dean, decided by ${formatDate(school.repeat.decideAt, sim.zone)}.`;
  if (school.leave && ['pending', 'granted', 'on'].includes(school.leave.status)) return 'Not with a leave under way.';
  const t = termNow(school);
  const academic = academicTerm(school, t);
  if (academic < 1 || academic % 2 === 0 || !evaluated(school, t)) return 'A year is repeated from its end, after the spring’s evaluation.';
  if (school.repeatBy === undefined && academic === YALE_DRAMA.terms - 1) return 'Your last year’s evaluation is past.';
  if (school.repeatBy !== undefined && sim.now > school.repeatBy) return 'Its thirty days have run out.';
  if (school.repeatBy === undefined && sim.now >= at(termStart(t + 1).date, 0)) return 'The next year has begun.';
  if (!repeatCourses(school, t).length) return 'Every course this year was passed: there’s nothing to repeat it for.';
  // SLATE's faculty grant a year once (from 2026-10-10: until then one repeat in all, whatever the year).
  if ((school.repeatedYears ?? []).includes(yearOfTerm(academic))) return `SLATE’s faculty don’t approve year ${yearOfTerm(academic)} a second time.`;
  const would = enrolledTerms(school).length + 2;
  if (would > EXTENDED_STUDY.maxSemesters) return `Repeating would make ${would} semesters, past the nine the Bulletin allows for the degree.`;
  return undefined;
}

/** The courses failed in the year ending with a spring term, by their latest attempts. */
export function repeatCourses(school: SchoolRecord, spring: number): string[] {
  // A course left on a leave is taken again on return, not repeated for.
  return degreeShortfall(school).failed.filter((r) => r.result !== 'withdrawn' && (r.term === spring || r.term === spring - 1)).map((r) => r.name);
}

export function requestRepeat(sim: Simulation, person: Person): Repeat {
  const no = repeatRefusal(sim, person);
  if (no) throw new CommandError(no);
  const school = person.school!;
  const t = termNow(school);
  const next = school.repeatBy === undefined ? at(termStart(t + 1).date, 8) : Number.POSITIVE_INFINITY;
  const decideAt = Math.max(sim.now + 3_600_000, Math.min(businessDaysOn(sim.now, EXTENDED_STUDY.decideWorkingDays), next));
  const repeat: Repeat = { requestedAt: sim.now, status: 'pending', decideAt, year: yearOfTerm(academicTerm(school, t)), terms: [t - 1, t], courses: repeatCourses(school, t) };
  school.repeat = repeat;
  sim.schedule({ at: decideAt, kind: REPEAT_DECIDE_KIND, label: 'Repeating The Year: The Decision', category: 'school', priority: 33, payload: { personId: person.id } });
  return repeat;
}

/** A last year failed, with a repeat open to them: thirty days to ask, or the degree is withheld. False where none is. */
export function offerRepeat(sim: Simulation, person: Person): boolean {
  const school = person.school!;
  school.repeatBy = sim.now + EXTENDED_STUDY.requestDays * MS_DAY;
  // A repeat of the last year, or an additional term to retake what's unpassed, whichever is open (from 2026-10-10:
  // until then a repeat alone, so a first year's course failed and never retaken withheld the degree at once).
  const repeat = !repeatRefusal(sim, person);
  const extra = extraRefusal(sim, person);
  if (!repeat && extra.why) { delete school.repeatBy; return false; }
  sim.schedule({ at: school.repeatBy, kind: REPEAT_DUE_KIND, label: 'Finishing The Degree: Last Day To Ask', category: 'school', priority: 33, payload: { personId: person.id } });
  const unpassed = degreeShortfall(school).failed.map((r) => r.name);
  notify(sim, person, 'Your Degree Isn’t Complete', `${unpassed.join(', ')} ${unpassed.length === 1 ? 'isn’t' : 'aren’t'} passed, and the degree needs every course. By ${formatDate(school.repeatBy, zone())} you can ask ${[repeat ? 'to repeat the year' : '', !extra.why ? `for an additional term, ${termLabel(extra.term!)}, to retake ${extra.courses!.length === 1 ? 'it' : 'them'}` : ''].filter(Boolean).join(' or ')}, on the Standing tab: a term past the sixth has no tuition support unless the aid office grants it. Not asked for, the degree is withheld.`, 90);
  return true;
}

const extendF1 = (sim: Simulation, person: Person) => {
  const f1 = f1Of(person);
  if (f1?.expiresAt === undefined) return;
  f1.expiresAt = addYears(f1.expiresAt, 1);
  scheduleUsStatus(sim, person);
};

// ---------------------------------------------------------------------------
// Commands and the calendar
// ---------------------------------------------------------------------------

export function registerLeave(sim: Simulation): void {
  const personOf = (item: { payload: Record<string, unknown> }) => sim.universe.people[String(item.payload.personId)];

  sim.onCommand<{ kind: LeaveKind; reason: LeaveReason; terms?: number }, { decideAt: Instant; firstTerm: number; startsNow: boolean }>('school.request_leave', (p, { sim: s }) => {
    const kind = p?.kind === 'medical' ? 'medical' : 'personal';
    const reason = (p?.reason ?? (kind === 'medical' ? 'illness' : 'personal')) as LeaveReason;
    if (!(reason in LEAVE_REASONS)) throw new CommandError('Give a reason.');
    const leave = requestLeave(s, s.player, kind, reason, p?.terms === undefined ? LEAVE_RULES.terms : Number(p.terms));
    return { decideAt: leave.decideAt, firstTerm: leave.firstTerm, startsNow: leave.firstTerm === termNow(s.player.school!) && !evaluated(s.player.school!, leave.firstTerm) };
  });

  // A first class's term over: caught up now (`followFormerClasses`), while the student is at the School.
  sim.onSchedule(FORMER_KIND, (item, s) => {
    const person = personOf(item);
    if (!person?.school || schoolEnded(person.school.standing)) return;
    followFormerClasses(s, person, Number(item.payload.term) + 1);
  });

  sim.onSchedule(WELFARE_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const w = school?.welfare;
    if (!person || !school || !w || w.status !== 'scheduled') return;
    // A voluntary leave asked for since: the assessment isn't needed.
    if (school.leave) { w.status = 'closed'; w.outcome = 'voluntary'; w.why = 'You asked for a medical leave yourself.'; (school.welfares ??= []).push(w); delete school.welfare; return; }
    // There in person, or in hospital, where Yale Health sees them: attended. Elsewhere, refused, a ground in itself.
    w.attended = inHospital(person, item.at) || (person.currentLocationId === YALE_DRAMA.cityId && !(person.awakeSince !== undefined && person.awakeSince > item.at));
    const a = assess(s, person);
    w.status = 'assessed';
    w.outcome = a.outcome;
    w.why = w.attended ? a.why : `You didn’t come to the assessment, which the Bulletin counts as a ground of its own; on your records, ${a.why.charAt(0).toLowerCase()}${a.why.slice(1)}`;
    if (a.outcome === 'leave') {
      w.decideAt = businessDaysOn(s.now, 1);
      s.schedule({ at: w.decideAt, kind: WELFARE_DECIDE_KIND, label: 'The Dean’s Decision', category: 'school', priority: 34, payload: { personId: person.id } });
      notify(s, person, 'Yale Health Recommends A Medical Leave', `${w.why} Yale Health has recommended a medical leave to the dean, who decides by ${formatDate(w.decideAt, zone())}. You can still ask for one yourself.`, 90);
      return;
    }
    w.status = 'closed';
    (school.welfares ??= []).push(w);
    delete school.welfare;
    notify(s, person, a.outcome === 'fit' ? 'Yale Health’s Assessment: Go On' : 'Yale Health’s Assessment: Modifications', w.why, 75);
  });

  sim.onSchedule(WELFARE_DECIDE_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const w = school?.welfare;
    if (!person || !school || !w || w.status !== 'assessed') return;
    w.decidedAt = s.now;
    w.status = 'decided';
    (school.welfares ??= []).push(w);
    delete school.welfare;
    if (school.leave || schoolEnded(school.standing)) return;
    // Decided on the day: well since, nothing's imposed.
    if (assess(s, person).outcome !== 'leave') { notify(s, person, 'The Dean Decides Against A Leave', 'You’re managing now, and the dean imposes no leave.', 75); return; }
    const t = termNow(school);
    const terms = leaveLengths(s, school, 'medical').find((x) => !x.why)?.terms;
    if (terms === undefined) return;
    school.leave = { id: `leave-${(school.leaves?.length ?? 0) + 1}`, kind: 'medical', reason: 'illness', requestedAt: s.now, status: 'granted', firstTerm: evaluated(school, t) ? t + 1 : t, returnTerm: (evaluated(school, t) ? t + 1 : t) + terms, terms, decideAt: s.now, decidedAt: s.now, mandatory: { assessedAt: w.at, why: w.why ?? '', appealBy: s.now + MANDATORY_LEAVE.appealDays * MS_DAY } };
    if (!evaluated(school, t)) startLeave(s, person);
    notify(s, person, 'A Medical Leave, By The Dean’s Decision', `The dean has placed you on a medical leave on Yale Health’s recommendation: ${w.why} You can appeal in writing to the dean until ${formatDate(school.leave?.mandatory?.appealBy ?? s.now, zone())}; the leave stands while the appeal is heard.`, 95);
  });

  sim.onCommand<{ statement?: string }, { decideAt: Instant }>('school.appeal_leave', (_p, { sim: s }) => {
    const person = s.player;
    const l = person.school?.leave;
    if (!l?.mandatory) throw new CommandError('Only a leave the dean imposed can be appealed.');
    if (l.mandatory.appeal) throw new CommandError(`You appealed on ${formatDate(l.mandatory.appeal.at, s.zone)}.`);
    if (s.now > l.mandatory.appealBy) throw new CommandError(`The appeal had to be in by ${formatDate(l.mandatory.appealBy, s.zone)}.`);
    const decideAt = businessDaysOn(s.now, MANDATORY_LEAVE.appealDecideWorkingDays);
    l.mandatory.appeal = { at: s.now, decideAt };
    s.schedule({ at: decideAt, kind: APPEAL_KIND, label: 'The Dean On Your Appeal', category: 'school', priority: 34, payload: { personId: person.id } });
    return { decideAt };
  });

  sim.onSchedule(APPEAL_KIND, (item, s) => {
    const person = personOf(item);
    const l = person?.school?.leave;
    const ap = l?.mandatory?.appeal;
    if (!person || !l || !ap || ap.outcome) return;
    const no = rescindable(s, person, l);
    ap.outcome = no ? 'upheld' : 'rescinded';
    ap.why = no ?? 'You’re cleared, and enough of the term is left to resume it.';
    if (no) { notify(s, person, 'Your Appeal Is Turned Down', `The dean upholds the leave. ${no}`, 90); return; }
    rescind(s, person, l);
    notify(s, person, 'Your Leave Is Overturned', `The dean has overturned the leave: ${ap.why} Your courses this term are restored and classes count you again. A casting lost when the leave began isn’t given back.`, 90);
  });

  sim.onCommand<Record<string, never>, { decideAt: Instant; term: number }>('school.request_extra_term', (_p, { sim: s }) => {
    const person = s.player;
    const school = person.school;
    const plan = extraRefusal(s, person);
    if (plan.why || !school) throw new CommandError(plan.why ?? 'You’re not at school.');
    const decideAt = businessDaysOn(s.now, EXTENDED_STUDY.decideWorkingDays);
    school.extraRequest = { requestedAt: s.now, decideAt, status: 'pending', term: plan.term!, courses: plan.courses! };
    s.schedule({ at: decideAt, kind: EXTRA_DECIDE_KIND, label: 'An Additional Term: The Decision', category: 'school', priority: 33, payload: { personId: person.id } });
    return { decideAt, term: plan.term! };
  });

  sim.onSchedule(EXTRA_DECIDE_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const r = school?.extraRequest;
    if (!person || !school || !r || r.status !== 'pending' || schoolEnded(school.standing)) return;
    const would = enrolledTerms(school).length + 1;
    const why = would > EXTENDED_STUDY.maxSemesters ? `It would make ${would} semesters, past the nine the Bulletin allows.` : disqualified(school);
    if (why) {
      r.status = 'refused';
      r.why = why;
      if (school.repeatBy !== undefined) { delete school.repeatBy; setStanding(s, person, 'withheld', `The chair and the dean refused an additional term. ${why}`); }
      else notify(s, person, 'An Additional Term Refused', why, 85);
      return;
    }
    r.status = 'granted';
    school.extra = { term: r.term, courses: r.courses };
    delete school.repeatBy;
    delete school.awaitingDegree;
    for (const i of s.universe.scheduled) if (i.status === 'pending' && i.payload.personId === person.id && (i.kind === REPEAT_DUE_KIND || i.kind === 'school.commencement')) s.timeline.cancel(i.id, s.now);
    s.schedule({ at: Math.max(at(termStart(r.term).date, 9), s.now + 60_000), kind: TERM_KIND, label: termBegins(r.term), category: 'school', priority: 30, payload: { personId: person.id, term: r.term } });
    extendF1(s, person);
    notify(s, person, 'An Additional Term Granted', `The chair and the dean granted it: in ${termLabel(r.term)} you retake ${r.courses.map((c) => c.name).join(', ')}, and only those, with the class then in that year. ${termStart(r.term).fall ? 'Passed, the degree is conferred at Yale’s December conferral.' : 'Passed, the degree comes at Commencement in May.'} A term past six has no tuition support unless the aid office grants an exception: ask for its review. This is SLATE’s faculty model: the Bulletin sets no rule for it.`, 85);
  });

  sim.onCommand<Record<string, never>, { decideAt: Instant }>('school.request_aid_review', (_p, { sim: s }) => {
    const person = s.player;
    const school = person.school;
    if (!school || schoolEnded(school.standing)) throw new CommandError('You’re not at school.');
    if (school.aidReview?.status === 'pending') throw new CommandError(`It’s with the aid office, decided by ${formatDate(school.aidReview.decideAt, s.zone)}.`);
    if (school.aidReview?.status === 'decided') throw new CommandError('The aid office has reviewed your support.');
    const extra = enrolledTerms(school).length >= EXTENDED_STUDY.supportedTerms || school.extra || school.repeat?.status === 'granted' || (school.leaves ?? []).some((l) => l.status === 'returned');
    if (!extra) throw new CommandError('Support past six terms is reviewed once a seventh is coming: you’re within the six.');
    const decideAt = businessDaysOn(s.now, EXTENDED_STUDY.decideWorkingDays);
    school.aidReview = { requestedAt: s.now, decideAt, status: 'pending' };
    s.schedule({ at: decideAt, kind: AID_DECIDE_KIND, label: 'The Aid Office’s Review', category: 'school', priority: 33, payload: { personId: person.id } });
    return { decideAt };
  });

  sim.onSchedule(AID_DECIDE_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const r = school?.aidReview;
    if (!person || !school || !r || r.status !== 'pending') return;
    const medical = (school.leaves ?? []).some((l) => l.kind === 'medical' && (l.status === 'returned' || l.status === 'on'));
    r.status = 'decided';
    r.tuition = medical;
    r.living = hasNeed(person);
    r.why = `${medical ? 'An exception to the six terms of tuition support, since a medical leave made the extra terms.' : 'No exception to the six terms of tuition support: the Bulletin calls them extremely rare, and SLATE’s office grants one only where a medical leave made the extra terms.'} ${r.living ? 'Your need-based living aid continues for the approved terms.' : 'No living aid: none was found for you before.'}`;
    notify(s, person, 'The Aid Office’s Review', `${r.why} These are the aid office’s decisions in SLATE’s model, not rules the Bulletin states.`, 80);
  });

  sim.onCommand<{ confirm?: boolean }, { canceled: true }>('school.cancel_leave', (p, { sim: s }) => {
    const school = s.player.school;
    const l = school?.leave;
    if (!school || !l || (l.status !== 'pending' && l.status !== 'granted')) throw new CommandError(l?.status === 'on' ? 'You’re on leave: you come back at the term it ends, with notice. To leave for good, withdraw.' : 'No leave is asked for.');
    if (!p?.confirm) throw new CommandError('Calling it off keeps you at the School as you are. Confirm to go ahead.');
    for (const i of s.universe.scheduled) if (i.status === 'pending' && i.kind === LEAVE_DECIDE_KIND && i.payload.personId === s.player.id) s.timeline.cancel(i.id, s.now);
    l.status = 'canceled';
    (school.leaves ??= []).push(l);
    delete school.leave;
    return { canceled: true };
  });

  sim.onSchedule(LEAVE_DECIDE_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const l = school?.leave;
    if (!person || !school || !l || l.id !== item.payload.leaveId || l.status !== 'pending') return;
    if (schoolEnded(school.standing)) { l.status = 'canceled'; return; }
    l.decidedAt = s.now;
    // Decided on the state now, not the request's: a personal leave still asks to be current.
    const open = degreeShortfall(school);
    const why = l.kind === 'personal' && (open.incomplete.length || open.failed.length) ? `You weren’t current with your requirements: ${[...open.incomplete, ...open.failed].map((r) => r.name).join(', ')}.` : undefined;
    if (why) {
      l.status = 'refused';
      l.why = why;
      (school.leaves ??= []).push(l);
      delete school.leave;
      notify(s, person, 'Your Leave Is Refused', `The chair and the dean refused it. ${why} You stay at the School as you are.`, 85);
      return;
    }
    l.status = 'granted';
    const t = termNow(school);
    if (l.firstTerm <= t && !evaluated(school, t)) { l.firstTerm = t; l.returnTerm = t + (l.terms ?? LEAVE_RULES.terms); startLeave(s, person); return; }
    notify(s, person, 'Your Leave Is Granted', `The chair and the dean granted a ${l.kind} leave from ${termLabel(l.firstTerm)}, ${formatDate(at(termStart(l.firstTerm).date, 9), zone())}, to ${termLabel(l.returnTerm)}. Until it begins you’re at the School as before; it can still be called off.`, 80);
  });

  sim.onSchedule(LEAVE_NOTICE_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const l = school?.leave;
    if (!person || !school || !l || l.status !== 'on' || l.noticeAt !== undefined) return;
    if (item.payload.remind === true) { notify(s, person, 'Two Weeks To Give Notice', `Tell the registrar you’re coming back by ${formatDate(l.noticeBy!, zone())}${l.kind === 'medical' ? ', with a Yale Health physician’s clearance' : ''}, on the Standing tab.`, 80); return; }
    l.why = 'no notice of return given';
    setStanding(s, person, 'dismissed', `You didn’t give notice of your return by ${formatDate(l.noticeBy!, zone())}, and a student who doesn’t return from an approved leave, with no extension, is dismissed (Bulletin p.158).`);
  });

  sim.onCommand<Record<string, never>, { noticeAt: Instant; returnsAt: Instant }>('school.return_notice', (_p, { sim: s }) => {
    const person = s.player;
    const l = person.school?.leave;
    if (!l || l.status !== 'on') throw new CommandError('You’re not on leave.');
    if (l.noticeAt !== undefined) throw new CommandError(`You gave notice on ${formatDate(l.noticeAt, s.zone)}.`);
    if (s.now > l.noticeBy!) throw new CommandError('Its deadline has passed.');
    if (l.kind === 'medical') { const no = clearedToReturn(person, s.now); if (no) throw new CommandError(no); }
    l.noticeAt = s.now;
    return { noticeAt: s.now, returnsAt: at(termStart(l.returnTerm).date, 9) };
  });

  sim.onCommand<{ confirm?: boolean }, { cost: Money; credit: Money }>('school.buy_affiliate', (p, { sim: s }) => {
    const person = s.player;
    const school = person.school;
    const l = school?.leave;
    if (!school || !l || l.status !== 'on') throw new CommandError('Affiliate cover is for a student on leave.');
    if (l.affiliate) throw new CommandError(l.affiliate.by === 'school' ? 'The School pays for your Affiliate cover.' : 'You have it.');
    if (s.now > (l.affiliateBy ?? 0)) throw new CommandError(`It could be bought until ${formatDate(l.affiliateBy ?? s.now, s.zone)}.`);
    const credit = l.feeCredit ?? 0;
    const cost = Math.max(0, (l.terms ?? LEAVE_RULES.terms) * usd(s, LEAVE_RULES.affiliatePerTerm) - credit);
    if (!p?.confirm) throw new CommandError(`Affiliate cover for the leave’s two terms is ${formatMoney(cost, saveCurrency(s.universe))}${credit ? `, with the ${formatMoney(credit, saveCurrency(s.universe))} student fee you paid credited` : ''}, paid in full now. Confirm to buy it.`);
    const bank = drawFromBank(s, person, cost, false);
    if (bank.short > 0) throw new CommandError('Your bank can’t cover it.');
    s.post({ memo: 'Yale Health Affiliate Coverage, a leave of absence', category: 'health', postings: [...bank.postings, { accountId: s.nominalAccount('expense', expenseFor('health')).id, amount: cost }] });
    l.affiliate = { by: 'self', at: s.now, cost, credit };
    // Continuous from the day student cover ended: the lapse is closed, and care had in it billed as Yale Health's.
    const from = l.coverEnds!;
    school.uncovered = (school.uncovered ?? []).filter((g) => !(g.from === from && g.until === undefined));
    repriceCare(s, person, from, s.now, 'Yale Health Affiliate cover, back to the day student cover ended');
    return { cost, credit };
  });

  sim.onCommand<Record<string, never>, { registeredAt: Instant }>('school.reregister', (_p, { sim: s }) => {
    const school = s.player.school;
    if (!school || schoolEnded(school.standing)) throw new CommandError('You’re not at school.');
    if (!school.mustRegister) throw new CommandError('You’re registered.');
    if (school.hold !== undefined) throw new CommandError(`A financial hold stops registration: ${formatMoney(accountOwed(s, s.player), saveCurrency(s.universe))} is owed on your Yale account.`);
    delete school.mustRegister;
    school.registeredAt = s.now;
    return { registeredAt: s.now };
  });

  sim.onCommand<Record<string, never>, { decideAt: Instant }>('school.request_repeat', (_p, { sim: s }) => ({ decideAt: requestRepeat(s, s.player).decideAt }));

  sim.onCommand<{ confirm?: boolean }, { canceled: true }>('school.cancel_repeat', (p, { sim: s }) => {
    const school = s.player.school;
    if (school?.repeat?.status !== 'pending') throw new CommandError('No repeat is asked for.');
    if (!p?.confirm) throw new CommandError(school.repeatBy !== undefined ? `Calling it off leaves the degree withheld if you don’t ask again by ${formatDate(school.repeatBy, s.zone)}. Confirm to go ahead.` : 'Calling it off carries you on to the next year with the course not passed, and the degree can’t be completed without it. Confirm to go ahead.');
    for (const i of s.universe.scheduled) if (i.status === 'pending' && i.kind === REPEAT_DECIDE_KIND && i.payload.personId === s.player.id) s.timeline.cancel(i.id, s.now);
    school.repeat.status = 'canceled';
    return { canceled: true };
  });

  sim.onSchedule(REPEAT_DECIDE_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    const r = school?.repeat;
    if (!person || !school || !r || r.status !== 'pending' || schoolEnded(school.standing)) return;
    r.decidedAt = s.now;
    const would = enrolledTerms(school).length + 2;
    const why = would > EXTENDED_STUDY.maxSemesters ? `It would make ${would} semesters, past the nine the Bulletin allows.` : disqualified(school);
    if (why) {
      r.status = 'refused';
      r.why = why;
      if (school.repeatBy !== undefined) { setStanding(s, person, 'withheld', `The chair and the dean refused your request to repeat the year. ${why}`); return; }
      notify(s, person, 'Your Repeat Is Refused', `The chair and the dean refused it. ${why}`, 85);
      return;
    }
    r.status = 'granted';
    school.repeats = (school.repeats ?? 0) + 1;
    (school.repeatedYears ??= []).push(r.year);
    school.joinsCohort ??= { offsetBefore: school.offset ?? 0, lastWith: termNow(school) };
    school.offset = (school.offset ?? 0) + 2;
    school.classOf += 1;
    extendF1(s, person);
    const t = termNow(school);
    // A last year's: the program had no next term on the calendar.
    if (school.repeatBy !== undefined) {
      delete school.repeatBy;
      for (const i of s.universe.scheduled) if (i.status === 'pending' && i.kind === REPEAT_DUE_KIND && i.payload.personId === person.id) s.timeline.cancel(i.id, s.now);
      s.schedule({ at: Math.max(at(termStart(t + 1).date, 9), s.now + 60_000), kind: TERM_KIND, label: termBegins(t + 1), category: 'school', priority: 30, payload: { personId: person.id, term: t + 1 } });
    }
    const past = enrolledTerms(school).length + 2 - EXTENDED_STUDY.supportedTerms;
    notify(s, person, 'You’ll Repeat The Year', `The chair and the dean granted it: from ${termLabel(t + 1)} you take year ${r.year}’s courses again, and what you did the first time stays on your record. ${past > 0 ? `The tuition scholarship supports six terms, so ${past === 1 ? 'one term' : `${past} terms`} of it will be billed to your Yale account. ` : ''}${f1Of(person) ? 'Your I-20 is extended a year. ' : ''}This is SLATE’s faculty model: the Bulletin sets no rule for repeating a course.`, 85);
  });

  sim.onSchedule(REPEAT_DUE_KIND, (item, s) => {
    const person = personOf(item);
    const school = person?.school;
    if (!person || !school || schoolEnded(school.standing) || school.repeatBy === undefined) return;
    if (school.repeat?.status === 'pending' || school.extraRequest?.status === 'pending' || school.extra) return;
    delete school.repeatBy;
    setStanding(s, person, 'withheld', 'You didn’t ask to repeat the year in its thirty days, and the degree needs every course passed.');
  });

  sim.onCommand<{ amount?: Money }, { owed: Money; held: boolean }>('school.pay_balance', (p, { sim: s }) => {
    const amount = Math.round(Number(p?.amount ?? accountOwed(s, s.player)));
    return payBalance(s, s.player, amount);
  });

  sim.onSchedule(ACCOUNT_DUE_KIND, (item) => {
    const person = personOf(item);
    if (person) accountDue(sim, person, Number(item.payload.term));
  });
}

