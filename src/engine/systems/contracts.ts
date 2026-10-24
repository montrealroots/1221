/**
 * SLATE — an engagement's contract, where each payment stands, and the money a contract brings beside its wages: overtime,
 * the producer's pension and health contribution, a per diem, residuals, and pay that comes late (from 2026-10-24, the
 * owner's brief 25, Part 7; `docs/verification/career-world-2026-10-23/criteria.md`, Module 4, D1 to D6).
 *
 * The rules are the agreements' own, as AMPTP publishes them (the register's `sources.json`): N13, the 2014 Codified Basic
 * Agreement; N14, the 2014 Television Agreement; N15 to N17, the 2017, 2020 and 2023 memoranda that changed them; N12,
 * the 2026 memorandum. SAG-AFTRA's own pages refused this build (S21, S41, S95, S96: HTTP 403). What the game imagines on
 * top of them (a telecast, a rerun, how late a producer pays) is its own, said as one where a player reads it.
 *
 * **The contract** (`contractFor`) is made when an offer is accepted and kept on the engagement: the classification and
 * billing, the format, the agreement, the day it was made, the service dates, the place, the basis and the rate, the
 * estimated gross, the payments it promised, and only the clauses that apply. Its estimate is gross pay before withholding,
 * commission and dues, said as an estimate, and never cash: nothing is posted until a payment is paid.
 *
 * **Overtime** (N13, Schedule A §9): a day performer is paid time and one-half for the ninth and tenth hours of work time,
 * an hour being an eighth of the day rate (its own worked example, $110 an hour on $880 a day). The game's shoot day runs
 * eleven hours, seven to six (`WORK.shoot`), and an hour of it is lunch (ASSUMPTION), so each day worked is ten hours of
 * work time and pays two hours at time and one-half. Only SAG-AFTRA's TV and theatrical day performer rate carries it here:
 * the Low Budget and Ultra Low Budget agreements' own overtime terms weren't read, nor a weekly performer's.
 *
 * **The producer's contribution** (`contributionOn`): on SAG-AFTRA TV and theatrical pay, 19.5% (N16, from 2020), and one
 * percent more to the Health Plan from the later of July 1, 2026 and the first Sunday ninety days after ratification
 * (N12): the vote closed on June 4, 2026 (N18, press reports), so the game reads September 6, 2026. Paid by the producer
 * on top of the pay, to the plans: shown, never posted to the player's accounts and never taken from the pay. Sideletter
 * K's 16.5% for a new series' first two seasons (N12) applies to no series here, none being in its first two.
 *
 * **Per diem** (N13 §35.B(2)): $60 a day for meals on overnight locations, its allowances frozen in 2020 and 2023 and kept
 * in 2026 (N16, N17, N12). That a trip the production books counts as an overnight location is the game's reading. Paid
 * once the actor's home, for each day away, apart from wages: no withholding, no commission, and not on the tax return as
 * wages (ASSUMPTION: an allowance under an accountable plan).
 *
 * **Residuals** (N14 §18): four records, each kept apart. The entitlement, made when SAG-AFTRA television work is done;
 * each exploitation, a telecast, which the game imagines; each calculation; and each settlement, paid once by its key. The
 * first telecast is paid for by the salary (§18(a)). A network prime-time rerun pays 100% of "total actual compensation",
 * up to a ceiling (§18(b)(1)): pay for time worked with overtime hours at straight time, and no allowances (§18(b)(4)); the
 * ceilings the 2016–17 column's, $3,668 for an hour and $2,578 for a half-hour, frozen by N15 to N17 and kept by N12. Due
 * within thirty days of the rerun (§18(b)(5)). When the telecasts come and whether there's a rerun are the game's: the
 * first ten weeks after the work is done, a rerun half the time, six months after it (ASSUMPTION, decider `pro.rerun`).
 *
 * **Late pay**: a non-union short's producer pays late three times in ten, by one to four weeks (ASSUMPTION, decider
 * `pro.late_pay`), with no union to answer to. A payment past its payday is overdue; asked about, it's disputed, and the
 * producer answers that it'll pay within three business days, and does.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, addDays, dateKey, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { plural, spokenList } from '../core/text';
import { RATES, projectById, type ProjectKind, type ProjectTemplate } from '../content/careerwork';
import { seriesById } from '../content/series';
import { CITIES } from '../content/geography';
import { ensurePro, noteEvent, type Contract, type ContractClause, type Engagement, type ProId, type ProPayment, type Residual, type WorkTrip } from './pro';
import { inSaveMoney } from './banking';
import { payeeAccount } from './cash';
import { recordWages } from './earnings';
import { businessDaysOn } from './permission';
import { PAY_KIND, projectOf, weekOf, withholdingOn } from './propay';
import { seasonNumber } from './series';
import { KIND_WORDS, counted, overtimeHours } from './projobs';
import { dubDaysOf, formatOf } from './workflow';

const NY = 'America/New_York';
const MIN = 60_000;

// ---------------------------------------------------------------------------------------------------------------------
// The rules
// ---------------------------------------------------------------------------------------------------------------------

/** A day performer's overtime (N13, Schedule A §9): from the ninth hour, an hour an eighth of the day, at time and one-half. */
export const OVERTIME = { straightHours: 8, workHours: 10, lunchHours: 1, premium: 1.5 } as const;

/** The rates the overtime clause applies to: SAG-AFTRA's TV and theatrical day performer, the only one whose terms were read. */
export const OVERTIME_RATES: readonly string[] = ['sag-tv-day'];

/** The per diem for meals on overnight locations (N13 §35.B(2)): breakfast $12, lunch $18, dinner $30. */
export const PER_DIEM = { perDay: 60_00 } as const;

/** The network prime-time rerun's ceiling (N14 §18(b)(1)b), the 2016–17 column, frozen since. */
export const RERUN_CEILING = { hour: 3_668_00, 'half-hour': 2_578_00 } as const;

/** The producer's pension and health contribution (N16; N12's added 1% to the Health Plan from the day the game reads). */
export const CONTRIBUTION = { rate: 0.195, healthFrom: '2026-09-06', healthAdd: 0.01 } as const;

/** The SAG-AFTRA work whose contract carries the contribution: the TV agreement's and the Basic Agreement's. */
// From 2026-10-24 (brief 25's Module 5), the kinds the workflows brought under the same two agreements; not the animated
// series, under the Television Animation Agreement, which the game hasn't read.
const CONTRIBUTING: readonly ProjectKind[] = [
  'network-drama', 'network-comedy', 'overseas-feature', 'multicam-comedy', 'animated-feature', 'dub', 'capture-feature', 'documentary', 'action-feature',
  'limited-series', 'serialized-drama', 'serialized-comedy', 'anthology', 'tv-movie',
];

/** The work that carries residuals here: SAG-AFTRA television, an hour's drama or a half-hour's comedy. */
const PROGRAM: Readonly<Partial<Record<ProjectKind, 'hour' | 'half-hour'>>> = { 'network-drama': 'hour', 'network-comedy': 'half-hour', 'multicam-comedy': 'half-hour' };

/**
 * SAG-AFTRA screen work whose residuals the game doesn't pay, and why (from 2026-10-24, Module 5): the terms that would
 * set them weren't read, so its contract says so rather than showing none.
 */
const RESIDUALS_UNREAD: Readonly<Partial<Record<ProjectKind, string>>> = {
  'animated-series': 'The Television Animation Agreement’s residuals weren’t read, so the game pays none on this work.',
  'animated-feature': 'A feature’s residuals come from its later sales to television and streaming, which the game doesn’t follow, so it pays none.',
  dub: 'A dub’s residuals depend on where the series is shown, which the game doesn’t follow, so it pays none.',
  'capture-feature': 'A feature’s residuals come from its later sales to television and streaming, which the game doesn’t follow, so it pays none.',
  documentary: 'A documentary’s residuals depend on where it’s shown, which the game doesn’t follow, so it pays none.',
  'action-feature': 'A feature’s residuals come from its later sales to television and streaming, which the game doesn’t follow, so it pays none.',
  'limited-series': 'Streaming residuals weren’t read, so the game pays none on this work.',
  'serialized-drama': 'Streaming residuals weren’t read, so the game pays none on this work.',
  'serialized-comedy': 'Streaming residuals weren’t read, so the game pays none on this work.',
  anthology: 'Streaming residuals weren’t read, so the game pays none on this work.',
  'tv-movie': 'The rerun ceiling for a program longer than an hour wasn’t read, so the game pays no residual on this work.',
};

/**
 * The telecasts the game imagines (ASSUMPTION, every figure): the first ten weeks after the work is done, at nine at night;
 * a network prime-time rerun half the time, twenty-six weeks after it; and each rerun's residual paid on the thirtieth day
 * after it, the last the agreement allows (N14 §18(b)(5)).
 */
export const RESIDUALS = { firstAfterDays: 70, rerunAfterDays: 182, rerunChance: 0.5, payWithinDays: 30, hour: 21 } as const;

/** A non-union producer's late pay (ASSUMPTION): three times in ten, by seven to twenty-eight days; an answer in three business days. */
export const LATE = { chance: 0.3, minDays: 7, spanDays: 22, answerBusinessDays: 3 } as const;

export const RESIDUAL_AIR_KIND = 'pro.residual.air';
export const RESIDUAL_PAY_KIND = 'pro.residual.pay';

const usd = (c: Money): string => formatMoney(c, 'USD');
const pct = (r: number): string => `${Math.round(r * 1000) / 10}%`;

/**
 * A day's overtime on a day rate (USD cents): its hours past eight at time and one-half of an eighth of the day, two on a
 * shoot day's ten hours of work. The hours from 2026-10-24 (brief 25's Module 5), when days of other lengths came: a
 * capture day's nine carry one, a booth session's four none.
 */
export const overtimeOf = (dayRate: Money, hours: number = OVERTIME.workHours - OVERTIME.straightHours): Money => Math.round((dayRate / OVERTIME.straightHours) * OVERTIME.premium * hours);

/** Whether work under a rate carries the overtime clause. */
export const paysOvertime = (rate: string): boolean => OVERTIME_RATES.includes(rate);

/** The contribution's rate on a day: 19.5%, and 20.5% from September 6, 2026. */
export const contributionRate = (at: Instant): number => (dateKey(at, NY) >= CONTRIBUTION.healthFrom ? Math.round((CONTRIBUTION.rate + CONTRIBUTION.healthAdd) * 1000) / 1000 : CONTRIBUTION.rate);

/** The producer's contribution on a payment of `gross` (the save's money), where the work's agreement carries one. */
export function contributionOn(project: ProjectTemplate, at: Instant, gross: Money): { rate: number; amount: Money } | undefined {
  if (project.union !== 'sag-aftra' || !CONTRIBUTING.includes(project.kind)) return undefined;
  const rate = contributionRate(at);
  return { rate, amount: Math.round(gross * rate) };
}

// ---------------------------------------------------------------------------------------------------------------------
// The contract
// ---------------------------------------------------------------------------------------------------------------------

const BILLING: Readonly<Record<ProjectTemplate['role']['size'], string>> = { lead: 'a lead', supporting: 'a supporting part', featured: 'a featured part', 'co-star': 'a co-star' };

/** The days away on a trip, counted where home is, from the first departure to the arrival home, both days counted. */
export function daysAway(trip: Pick<WorkTrip, 'legs'>, zone: string, until?: Instant): number {
  const out = trip.legs.find((l) => l.way === 'out');
  const back = [...trip.legs].reverse().find((l) => l.way === 'back' && l.status !== 'canceled' && l.status !== 'missed');
  if (!out) return 0;
  const end = until ?? back?.arrives ?? out.arrives;
  const a = zonedParts(out.departs, zone);
  const b = zonedParts(end, zone);
  const day = (p: typeof a) => Date.UTC(p.year, p.month - 1, p.day);
  return Math.max(0, Math.round((day(b) - day(a)) / MS_DAY) + 1);
}

/** What makes a contract beyond its template and offer: the version, what it renews, and the season and its episodes. */
export interface ContractExtra {
  version?: number;
  renews?: ProId;
  season?: { year: number; guaranteed: number[]; further: number[] };
  option?: { year: number; by: Instant };
}

/**
 * The contract made when an offer's accepted (or an option's exercised), from the template, the offer and the payments it
 * promised: each clause only where it applies. Its money is US cents, as the offer's.
 */
export function contractFor(sim: Simulation, e: Engagement, offer: NonNullable<import('./pro').Opportunity['offer']>, t: ProjectTemplate, trip: WorkTrip | undefined, extra: ContractExtra = {}): Contract {
  const rate = RATES[t.pay];
  const deferred = offer.amount === undefined;
  const clauses: ContractClause[] = [];
  if (deferred) clauses.push({ kind: 'deferred' });
  // Overtime where a day runs long enough for it (from 2026-10-24, Module 5): the longest day's hours past eight.
  const hours = Math.max(0, ...e.days.map((d) => overtimeHours(d)));
  if (!deferred && paysOvertime(t.pay) && hours > 0) clauses.push({ kind: 'overtime', hourly: Math.round(offer.amount! / OVERTIME.straightHours), hours, premium: OVERTIME.premium, perDay: overtimeOf(offer.amount!, hours) });
  const program = t.union === 'sag-aftra' ? PROGRAM[t.kind] : undefined;
  if (program) clauses.push({ kind: 'residuals', program, ceiling: RERUN_CEILING[program] });
  else if (t.union === 'sag-aftra' && RESIDUALS_UNREAD[t.kind]) clauses.push({ kind: 'rule', id: 'residuals-unread', words: RESIDUALS_UNREAD[t.kind]! });
  const made = sim.now;
  if (t.union === 'sag-aftra' && CONTRIBUTING.includes(t.kind)) clauses.push({ kind: 'contributions', rate: contributionRate(e.days[0]?.from ?? made) });
  if (trip && t.trip) {
    clauses.push({ kind: 'trip', words: t.trip.words });
    if (t.union === 'sag-aftra') clauses.push({ kind: 'per-diem', perDay: PER_DIEM.perDay, days: daysAway(trip, sim.zone) });
  }
  const s = t.series ? seriesById(t.series) : undefined;
  if (s && extra.season && t.schedule.kind === 'episodes') {
    clauses.push({ kind: 'episodes', ordered: s.episodes, guaranteed: t.schedule.guaranteed, expected: t.schedule.expected, daysEach: s.daysEach, numbers: extra.season.guaranteed, further: extra.season.further.map((n) => ({ n, status: 'pending' as const })) });
  }
  if (s && extra.option) clauses.push({ kind: 'option', season: seasonNumber(sim, s, extra.option.year), year: extra.option.year, by: extra.option.by, raise: OPTION_RAISE, status: 'open' });
  // The workflow's rules last (from 2026-10-24, brief 25's Module 5, `workflowRules`).
  clauses.push(...workflowRules(t));
  const first = e.days[0];
  const last = e.days[e.days.length - 1];
  const basis: Contract['basis'] = deferred ? 'deferred' : t.schedule.kind === 'episodes' ? 'episode' : offer.per;
  return {
    version: extra.version ?? 1, madeAt: made, classification: rate.label, billing: `${BILLING[t.role.size]}${t.schedule.kind === 'episodes' ? ', recurring' : ''}`,
    format: KIND_WORDS[t.kind], agreement: t.contract,
    service: { from: first?.from ?? made, to: last?.to ?? made }, place: `${t.place.venue}, ${t.place.city}`,
    basis, ...(offer.amount !== undefined ? { rate: offer.amount } : {}), per: offer.per, units: offer.units,
    estimate: e.pay.reduce((n, p) => n + (p.deferred ? 0 : p.promised), 0),
    payKeys: e.pay.map((p) => p.key),
    ...(s && extra.season ? { series: { id: s.id, year: extra.season.year, season: seasonNumber(sim, s, extra.season.year) } } : {}),
    ...(extra.renews ? { renews: extra.renews } : {}),
    clauses,
  };
}

/**
 * The rules a workflow's work carries into its contract (from 2026-10-24, brief 25's Module 5), each the agreement's where
 * it names one (N13, N17) and the game's where it says so.
 */
function workflowRules(t: ProjectTemplate): ContractClause[] {
  const fmt = formatOf(t);
  const out: ContractClause[] = [];
  if (fmt.workflow === 'multicam') out.push({ kind: 'rule', id: 'rehearsal-paid', words: 'Every day of the week is paid from the first rehearsal, the table read included: a half-hour multicamera series’ rehearsal begins its employment, as the agreement sets.' });
  if (t.dub) out.push({ kind: 'rule', id: 'dubbing', words: `A day’s pay covers any number of unsynchronized lines and up to five synchronized lines each for up to three characters, and a day more for each part of more than five and each further set of up to three, as the agreement sets; your character alone, any number of lines, is a day. So its ${counted(t.dub.length, 'session')} pay ${spokenList(t.dub.map((d) => counted(dubDaysOf(d), 'day')))} in turn.` });
  if (fmt.workflow === 'dubbing' || (fmt.workflow === 'voice' && t.union === 'sag-aftra')) out.push({ kind: 'rule', id: 'stressful', words: fmt.workflow === 'dubbing' ? 'The producer tells you before each session whether it asks for screams or other vocally stressful lines, and if it doesn’t, you may refuse them, as the agreement sets.' : 'The producer tells you before each session whether it asks for screams or other vocally stressful lines, and if it doesn’t, you may refuse them: the agreement’s rule for dubbing, which the game applies to animation, its assumption.' });
  if (fmt.daysOnly) out.push({ kind: 'rule', id: 'days-only', words: fmt.workflow === 'capture' ? 'Each day you’re called in is paid, and the days between aren’t: performance capture has no consecutive employment, its drops and pickups unlimited, and several characters in a day at no more pay, as the agreement sets.' : 'Each session is paid as a day, and the days between aren’t: voice work on an animated feature is outside the rule that pays the days between, as the agreement sets.' });
  if (t.schedule.kind === 'shoot' && t.schedule.stuntDays?.length) out.push({ kind: 'rule', id: 'stunts', words: 'A stunt is done by you only with your consent, given before it, and with a qualified stunt coordinator there and consulted, as the agreement sets. Without your consent the stunt double does it.' });
  if (t.intimacy) out.push({ kind: 'rule', id: 'intimacy', words: `The part has ${t.intimacy.words}. It’s shot on a closed set with an intimacy coordinator, only with your written consent describing it; you can withdraw consent until it’s shot, and a body double does it then, as the agreement allows. Declining it doesn’t cost you the part, the pay or the credit.` });
  if (fmt.looping) out.push({ kind: 'rule', id: 'looping', words: `The production can recall you within ${fmt.looping} months of the wrap to loop: a four-hour session paid half a day, as the agreement sets.` });
  if (voiceOnlyFormat(fmt.workflow)) out.push({ kind: 'rule', id: 'voice-over', words: 'Voice-over work is outside an agent’s agreement, so no commission is owed on it.' });
  return out;
}

const voiceOnlyFormat = (w: string): boolean => w === 'voice' || w === 'dubbing' || w === 'narration';

/** The raise an option on a next season carries (ASSUMPTION, the game's terms). */
export const OPTION_RAISE = 0.05;

/** A clause of a kind, where the contract has one. */
export function clauseOf<K extends ContractClause['kind']>(c: Contract | undefined, kind: K): Extract<ContractClause, { kind: K }> | undefined {
  return c?.clauses.find((x) => x.kind === kind) as Extract<ContractClause, { kind: K }> | undefined;
}

/** The payments a contract promised that the engagement no longer owes: its work called off before their days. */
export const notOwed = (e: Engagement): string[] => (e.contract?.payKeys ?? []).filter((k) => !e.pay.some((p) => p.key === k));

// ---------------------------------------------------------------------------------------------------------------------
// Where a payment stands
// ---------------------------------------------------------------------------------------------------------------------

export type PayState = 'estimated' | 'earned' | 'due' | 'overdue' | 'disputed' | 'held' | 'settled' | 'deferred';

/**
 * Where a payment stands, from its record and the clock: estimated before its days are over, earned once they are, due on
 * its payday, overdue after it unpaid, disputed once asked about, held in the agency's trust account, settled once paid,
 * or deferred. A payment no longer owed isn't on the engagement at all (`notOwed`).
 */
export function payState(p: ProPayment, now: Instant, zone: string = NY): PayState {
  if (p.deferred) return 'deferred';
  if (p.received) return 'settled';
  if (p.inTrust) return 'held';
  if (now < weekOf(p, zone).to) return 'estimated';
  const today = dateKey(now, zone);
  const due = dateKey(p.due, zone);
  if (today < due) return 'earned';
  if (today === due) return 'due';
  return p.asked ? 'disputed' : 'overdue';
}

/** Why the player can't ask about a payment now, or nothing. */
export function askRefusal(sim: Simulation, e: Engagement | undefined, p: ProPayment | undefined): string | undefined {
  if (!e || !p) return 'There’s no such payment.';
  const state = payState(p, sim.now, sim.zone);
  if (state === 'disputed') return `You asked about it on ${formatDate(p.asked!.at, sim.zone)}, and the answer was that it’d be paid by ${formatDate(p.asked!.answer, sim.zone)}.`;
  if (state !== 'overdue') return 'You can ask about a payment once it’s past its payday and unpaid.';
  return undefined;
}

/**
 * How late a non-union producer pays a payment, in days, by a key naming it: none seven times in ten (decider
 * `pro.late_pay`). The pay system names a payment by its work, its first day and its number (`schedulePay`).
 */
export function lateDays(sim: Simulation, key: string): number {
  const r = sim.rng('pro.late_pay', key);
  return r.next() < LATE.chance ? LATE.minDays + Math.floor(r.next() * LATE.spanDays) : 0;
}

// ---------------------------------------------------------------------------------------------------------------------
// Residuals
// ---------------------------------------------------------------------------------------------------------------------

/** Nine at night, on the day `days` after a moment, in New York. */
function evening(at: Instant, days: number): Instant {
  const p = zonedParts(addDays(at, days, NY), NY);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: RESIDUALS.hour, minute: 0 }, NY);
}

/**
 * The work's "total actual compensation" (N14 §18(b)(4)): its pay for the days worked, overtime hours at straight time and
 * not their premium, and no allowance. In US cents.
 */
export function totalActualCompensation(e: Engagement): Money {
  return e.pay.reduce((n, p) => {
    if (p.deferred) return n;
    const ot = p.overtime ?? 0;
    return n + (p.promised - ot) + Math.round(ot / OVERTIME.premium);
  }, 0);
}

/** The residual records, begun empty. */
const residualsOf = (sim: Simulation, person: Person): Residual[] => (ensurePro(sim, person).residuals ??= []);

/**
 * The entitlement, made once when SAG-AFTRA television work with a residuals clause is done (`finish`, `systems/projobs.ts`),
 * with its first telecast on the clock. Nothing where no day was worked.
 */
export function entitle(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate): Residual | undefined {
  const clause = clauseOf(e.contract, 'residuals');
  if (!clause || !(e.log ?? []).some((l) => l.status === 'worked')) return undefined;
  const all = residualsOf(sim, person);
  const had = all.find((r) => r.engagementId === e.id);
  if (had) return had;
  const r: Residual = {
    id: sim.nextId('pro'), engagementId: e.id, projectId: t.id, role: t.role.part, at: sim.now,
    program: clause.program, ceiling: clause.ceiling, base: totalActualCompensation(e),
    exploitations: [{ key: `${e.id}:first`, kind: 'first-telecast', at: evening(sim.now, RESIDUALS.firstAfterDays), status: 'planned' }],
    calculations: [], settlements: [],
  };
  all.push(r);
  scheduleAir(sim, person, r, r.exploitations[0]!);
  noteEvent(sim, e, { kind: 'success', key: 'residuals', words: `Your work as ${t.role.part} carries residuals: a network rerun of the episode pays you again.` });
  return r;
}

function scheduleAir(sim: Simulation, person: Person, r: Residual, x: Residual['exploitations'][number]): void {
  if (sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind === RESIDUAL_AIR_KIND && i.payload.key === x.key)) return;
  const t = projectById(r.projectId);
  sim.schedule({ at: Math.max(x.at, sim.now + MIN), kind: RESIDUAL_AIR_KIND, label: `${t?.project ?? 'Your Episode'} Is On`, category: 'career', priority: 45, refType: 'pro.residual', refId: r.id, payload: { personId: person.id, residualId: r.id, key: x.key } });
}

/** Whether there's a network rerun of the work's episode (decider `pro.rerun`): half the time, by the engagement. */
export const rerunDrawn = (sim: Simulation, engagementId: string): boolean => sim.rng('pro.rerun', engagementId).next() < RESIDUALS.rerunChance;

const programWords = (r: Pick<Residual, 'program'>): string => (r.program === 'hour' ? 'an hour' : 'a half-hour');

/** A network prime-time rerun's residual (N14 §18(b)(1)): all of the work's total actual compensation, up to the ceiling. */
export const rerunAmount = (r: Pick<Residual, 'base' | 'ceiling'>): Money => Math.min(r.base, r.ceiling);

/** A residual's calculation in the player's words. */
export function calculationWords(r: Residual, c: Residual['calculations'][number]): string {
  if (c.share === 0) return 'The first telecast is paid for by the salary, so it pays no more.';
  return `${pct(c.share)} of ${usd(c.base)}, the pay for your time worked with overtime at straight time, up to ${usd(c.ceiling)} for ${programWords(r)}’s program: ${usd(c.amount)}.`;
}

/** An episode on the air: the first telecast, paid for by the salary, decides the rerun; the rerun's residual is worked out and put on the clock. */
function air(s: Simulation, person: Person, r: Residual, key: string): void {
  const x = r.exploitations.find((y) => y.key === key);
  const t = projectById(r.projectId);
  if (!x || x.status !== 'planned' || !t) return;
  x.status = 'aired';
  const e = person.pro?.engagements.find((y) => y.id === r.engagementId);
  const zone = s.zone;
  if (x.kind === 'first-telecast') {
    r.calculations.push({ key, at: s.now, base: r.base, share: 0, ceiling: r.ceiling, amount: 0 });
    let more = '';
    if (rerunDrawn(s, r.engagementId)) {
      const rerun = { key: `${r.engagementId}:rerun:1`, kind: 'network-rerun' as const, at: evening(s.now, RESIDUALS.rerunAfterDays), status: 'planned' as const };
      r.exploitations.push(rerun);
      scheduleAir(s, person, r, rerun);
      more = ` The network has scheduled a rerun on ${formatDate(rerun.at, zone)}, which pays you a residual.`;
    }
    if (e) noteEvent(s, e, { kind: 'success', key: `aired:${key}`, words: `Your episode of ${t.project} was on the air, its first telecast, which your pay covered.` });
    if (person.id === s.universe.playerId) s.notify({ category: 'career', title: `${t.project} Is On Tonight`, body: `Your episode of ${t.project}, with you as ${r.role}, is on tonight. Your pay for the work covers its first telecast, so it pays nothing more.${more}`, importance: 50, route: '/workspace/career?tab=work' });
    return;
  }
  const amount = rerunAmount(r);
  const c = { key, at: s.now, base: r.base, share: 1, ceiling: r.ceiling, amount };
  r.calculations.push(c);
  const due = instantFromZoned({ ...zonedParts(addDays(s.now, RESIDUALS.payWithinDays, NY), NY), hour: 12, minute: 0 }, NY);
  r.settlements.push({ key, due, amount });
  s.schedule({ at: due, kind: RESIDUAL_PAY_KIND, label: `Residual: ${t.project}`, category: 'home', priority: 30, refType: 'pro.residual', refId: r.id, payload: { personId: person.id, residualId: r.id, key } });
  if (e) noteEvent(s, e, { kind: 'success', key: `aired:${key}`, words: `Your episode of ${t.project} was rerun on the network, which owes you a residual of ${usd(amount)}.` });
  if (person.id === s.universe.playerId) s.notify({ category: 'career', title: `A Rerun Of ${t.project}`, body: `Your episode of ${t.project} is rerun tonight. A network rerun in prime time pays you a residual: ${calculationWords(r, c)} It’s paid by ${formatDate(due, zone)}.`, importance: 55, route: '/workspace/career?tab=work' });
}

/** A rerun's residual paid, once by its key: wages, withheld as wages are, straight to the player, no commission. */
function settleResidual(s: Simulation, person: Person, r: Residual, key: string): void {
  const st = r.settlements.find((x) => x.key === key);
  const t = projectById(r.projectId);
  // GUARD: once. A settlement already paid is never paid again (a reload, a replayed notice or a second firing finds it so).
  if (!st || st.paid || !t) return;
  const cur = saveCurrency(s.universe);
  const gross = inSaveMoney(s, st.amount, 'USD');
  const w = withholdingOn(s, person, gross, s.now, t.place.cityId);
  const kept = gross - w.total;
  const into = payeeAccount(s, person);
  const txn = s.post({
    memo: `Residual: ${t.company}, ${t.project}, a network rerun`, category: 'salary',
    postings: [
      { accountId: into.id, amount: kept },
      { accountId: s.nominalAccount('income', 'Residuals').id, amount: -gross },
      ...(w.total ? [{ accountId: s.nominalAccount('expense', 'Tax Withheld').id, amount: w.total }] : []),
    ],
  });
  recordWages(person, s.now, s.zone, { gross, withheld: w.total, withheldBy: w.byState, employer: t.company, commission: 0, dues: 0, ...(CITIES.get(t.place.cityId) ? { where: t.place.cityId } : {}) });
  st.paid = { at: s.now, gross, withheld: w.total, net: kept, txnId: txn.id };
  const e = person.pro?.engagements.find((y) => y.id === r.engagementId);
  if (e) noteEvent(s, e, { kind: 'paid', key: `residual:${key}`, words: `${t.company} paid ${formatMoney(gross, cur)} in residuals for the rerun, and ${formatMoney(kept, cur)} reached you.` });
  if (person.id === s.universe.playerId) s.notify({ category: 'career', title: `Residual For ${t.project}`, body: `${t.company} paid ${formatMoney(gross, cur)} in residuals for the rerun of your episode${w.total ? `, less ${formatMoney(w.total, cur)} withheld for tax` : ''}, so ${formatMoney(kept, cur)} went into your ${into.name}. It came straight to you, with no commission taken.`, importance: 55, route: '/workspace/career?tab=work' });
}

// ---------------------------------------------------------------------------------------------------------------------
// Per diem
// ---------------------------------------------------------------------------------------------------------------------

/**
 * The per diem for a trip, paid once when the actor's home (`systems/worktrip.ts`'s arrival): the clause's rate for each
 * day away, in the save's money, apart from wages. Keyed by the engagement, so a reload or a second arrival can't pay it twice.
 */
export function payPerDiem(s: Simulation, person: Person, e: Engagement, trip: WorkTrip): void {
  const clause = clauseOf(e.contract, 'per-diem');
  const t = projectOf(e);
  if (!clause || !t) return;
  const key = `${e.id}:per-diem`;
  const all = (e.allowances ??= []);
  if (all.some((a) => a.key === key)) return;
  const days = daysAway(trip, s.zone, s.now);
  if (!days) return;
  const cur = saveCurrency(s.universe);
  const amount = inSaveMoney(s, clause.perDay * days, 'USD');
  const into = payeeAccount(s, person);
  const txn = s.post({
    memo: `Per diem: ${t.company}, ${t.project}, ${plural(days, 'day')}`, category: 'reimbursement',
    postings: [{ accountId: into.id, amount }, { accountId: s.nominalAccount('income', 'Per Diem').id, amount: -amount }],
  });
  all.push({ key, kind: 'per-diem', days, perDay: clause.perDay, amount, at: s.now, txnId: txn.id });
  noteEvent(s, e, { kind: 'paid', key, words: `${t.company} paid ${formatMoney(amount, cur)} in per diem for ${plural(days, 'day')} away.` });
  if (person.id === s.universe.playerId) s.notify({ category: 'career', title: `Per Diem For ${t.project}`, body: `${t.company} paid your per diem for meals, ${usd(clause.perDay)} for each day of the ${plural(days, 'day')} you were away: ${formatMoney(amount, cur)} into your ${into.name}. It isn’t wages, so nothing was withheld and no commission was taken.`, importance: 50, route: '/workspace/career?tab=work' });
}

// ---------------------------------------------------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------------------------------------------------

const residualFor = (s: Simulation, payload: Record<string, unknown>): { person: Person; r: Residual } | undefined => {
  const person = s.universe.people[String(payload.personId)];
  const r = person?.pro?.residuals?.find((x) => x.id === payload.residualId);
  return person && r ? { person, r } : undefined;
};

export function registerContracts(sim: Simulation): void {
  sim.onSchedule(RESIDUAL_AIR_KIND, (item, s) => {
    const at = residualFor(s, item.payload);
    if (at) air(s, at.person, at.r, String(item.payload.key));
  });
  sim.onSchedule(RESIDUAL_PAY_KIND, (item, s) => {
    const at = residualFor(s, item.payload);
    if (at) settleResidual(s, at.person, at.r, String(item.payload.key));
  });

  sim.onCommand<{ engagementId: string; key: string }, { answer: Instant }>('pro.ask_pay', (p, { sim: s }) => {
    const person = s.player;
    const e = person.pro?.engagements.find((x) => x.id === p?.engagementId);
    const pay = e?.pay.find((x) => x.key === p?.key);
    const no = askRefusal(s, e, pay);
    if (no) throw new CommandError(no);
    const t = projectOf(e!)!;
    const answer = instantFromZoned({ ...zonedParts(businessDaysOn(s.now, LATE.answerBusinessDays, true, NY), NY), hour: 12, minute: 0 }, NY);
    pay!.asked = { at: s.now, answer };
    // The payday moved up to the answer, where it was later.
    const item = s.universe.scheduled.find((i) => i.status === 'pending' && i.kind === PAY_KIND && i.payload.key === pay!.key);
    if (item && item.at > answer && s.timeline.cancel(item.id, s.now)) s.schedule({ at: answer, kind: PAY_KIND, label: item.label, category: 'home', priority: 30, refType: 'engagement', refId: e!.id, payload: item.payload });
    noteEvent(s, e!, { kind: 'problem', key: `asked:${pay!.key}`, words: `You asked ${t.company} about the pay for the week of ${formatDate(weekOf(pay!, s.zone).from, s.zone)}, overdue since ${formatDate(pay!.due, s.zone)}, and it said it would pay by ${formatDate(answer, s.zone)}.` });
    return { answer };
  });
}
