/**
 * SLATE — getting hurt, mending, and who pays when it was at work.
 *
 * Until 2026-09-28 nothing in SLATE was ever injured: a life ran, lifted,
 * swam, fought on stage and did its stunts on set without a sprain, and the
 * traits' and the crafts' words about injury were said back. Now each of
 * those, and everyday life, brings an injury at its published rate
 * (`content/injury.ts`): a pulled muscle, a sprain, a back strain, a broken
 * bone, a concussion, a cut or a knock, each with its care, its time to mend
 * and, for the worst, time off work. While it mends a workout is out of the
 * question and it weighs on the mood; off work, a stage part's understudy
 * goes on and a screen part is recast, as a stay in hospital does. Hurt at
 * work, workers' compensation pays the care and the state's share of the
 * week's wage for the time off, by the state's rules: two-thirds in New York
 * and California, 75% after tax in Connecticut, never under its least, which
 * at any wage the School pays is 75% of the whole (`compWeekly`). Until
 * 2026-10-12 this said two-thirds, and so did the notice, of a Connecticut
 * injury too; until 2026-10-13 the notice said “after tax” of every one.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { clamp } from '../core/rng';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { INJURY, INJURY_KIND, INJURY_MIX, WORKERS_COMP, type CompRules, type InjuryKind } from '../content/injury';
import { computeAnnualTax } from '../content/tax';
import { plural } from '../core/text';
import { personalityOf } from './personality';
import { billCare, dueWords, healthOf, shareOf } from './health';
import { payeeAccount } from './cash';
import { schoolEnded } from './school';

export const COMP_KIND = 'injury.comp';

export interface Injury {
  kind: InjuryKind;
  at: Instant;
  until: Instant;
  /** Kept off work until, for the worst. */
  offWorkUntil?: Instant;
  /**
   * Hurt at work: the job's state and its week's wage, which workers' compensation reads, and from 2026-10-12 the
   * employer where one pays a wage the compensation replaces (the Summer Cabaret's stipend, `systems/school.ts`).
   */
  atWork?: { stateId: string; weeklyWage: Money; paidDays: number; employer?: string; noFica?: boolean };
}

/**
 * The state’s share of the wage in words, for a notice: “two-thirds of your week’s wage”, or Connecticut’s 75%, “after
 * tax” only where the week paid is its share of the wage after tax (`compWeekly`). Connecticut’s least is never more
 * than 75% of the whole wage (CGS 31-307(a)), and a week under $473.60 is paid that: the Summer Cabaret’s $375 and any
 * week of work-study, whose 19 hours come to $437. Until 2026-10-13 the notice said “after tax” of every Connecticut
 * week, where each of those was paid 75% of the whole.
 */
const shareWords = (rules: CompRules, weekly: Money, wage: Money): string =>
  `${Math.abs(rules.share - 2 / 3) < 1e-9 ? 'two-thirds' : `${Math.round(rules.share * 100)}%`} of your week’s wage${rules.afterTax && weekly < Math.round(wage * rules.share) ? ' after tax' : ''}`;

export type InjurySource = keyof typeof INJURY_MIX;

/** Their injury now, if it hasn't mended. */
export function injuryOf(person: Person, at: Instant): Injury | undefined {
  const injury = healthOf(person).injury;
  return injury && injury.until > at ? injury : undefined;
}

/** Whether an injury keeps them off work at a moment. */
export function laidUp(person: Person, at: Instant): boolean {
  return (injuryOf(person, at)?.offWorkUntil ?? 0) > at;
}

/** Why a workout or a swim isn't possible now, hurt: none for a cut or a knock (`INJURY_KIND[].limits`). */
export function trainingRefusal(person: Person, at: Instant): string | undefined {
  const injury = injuryOf(person, at);
  if (!injury || INJURY_KIND[injury.kind].limits === 'none') return undefined;
  const days = Math.ceil((injury.until - at) / MS_DAY);
  return `Not with ${INJURY_KIND[injury.kind].label.toLowerCase()}; it has ${days} ${days === 1 ? 'day' : 'days'} yet to mend.`;
}

/** The care an injury needs (`INJURY_KIND[].care`), as a notice names it. */
const CARE_WORDS: Readonly<Record<'visit' | 'urgent' | 'emergency', string>> = { visit: 'a doctor’s visit', urgent: 'a visit to urgent care', emergency: 'a trip to the emergency room' };

/** A count under ten in words, as prose says one (`docs/STYLE.md`): "two sessions of physical therapy". */
const countWords = (n: number): string => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] ?? String(n);

/**
 * What an injury keeps them from while it mends, and what's done about it, said alike by its notice and its look
 * (`ui/looks/wellbeing.tsx`), each after a sentence naming when it mends. From 2026-10-20 (brief 17): until then the
 * notice gave its days and no date, put its cost before what it kept them from, said Call In Sick "excuses a day of
 * classes", which read as one day in all where `sickRefusal` takes it on any day it mends (on the Classes tab, which it
 * didn't name, for the whole day at school: its classes, calls and shift), and said nothing of the
 * physical side of the work it holds back (`conditionAt`), which the look said; an injury that lays them up didn't say
 * the School excuses the classes it keeps them from (`offSick`), and a cut or a knock didn't say it keeps them from
 * nothing. `enrolled` is the player at the School, whose absences are excused; another person's look is said in their
 * pronouns (`p`).
 */
export function injuryKeeps(kind: InjuryKind, enrolled: boolean, p: { they: string; them: string; their: string; theyAre: string } = { they: 'you', them: 'you', their: 'your', theyAre: 'you’re' }): string {
  const spec = INJURY_KIND[kind];
  if (spec.offWork) return `${p.theyAre.charAt(0).toUpperCase()}${p.theyAre.slice(1)} laid up until then, kept from classes, work and training.${enrolled ? ' What you miss at school is excused.' : ''}`;
  if (spec.limits !== 'none') return `Until then ${p.they} can’t work out, and it holds back the physical side of ${p.their} work.${enrolled ? ' Each day until then, Call In Sick, on School’s Classes tab, can excuse that day at school.' : ''}`;
  return `It won’t stop ${p.them} working out${enrolled ? ' or going to class' : ''}.`;
}

/** The chance of an injury over so many hours of a thing at its rate a thousand hours. */
export const chanceOver = (perThousand: number, hours: number): number => 1 - Math.exp(-(perThousand * hours) / 1000);

/**
 * Hours of something, and the chance it hurt them: drawn, and if it did, the
 * injury it was, its care billed or paid by workers' compensation, and the
 * time it keeps them from things.
 */
export function mayHurt(sim: Simulation, person: Person, source: InjurySource, chance: number, at: Instant, work?: { cityId: string; weeklyWage: Money; employer?: string; noFica?: boolean }): Injury | undefined {
  if (injuryOf(person, at)) return undefined;
  const rng = sim.rng('health.injury', person.id, `${source}-${at}`);
  if (rng.next() >= chance) return undefined;
  const mix = INJURY_MIX[source];
  let left = rng.next() * mix.reduce((s, [, w]) => s + w, 0);
  const kind = (mix.find(([, w]) => (left -= w) <= 0) ?? mix[mix.length - 1]!)[0];
  const spec = INJURY_KIND[kind];
  // A resilient body mends sooner (`illnessToll`).
  const days = Math.round((spec.days[0] + rng.next() * (spec.days[1] - spec.days[0])) * personalityOf(person, 'illnessToll'));
  const injury: Injury = { kind, at, until: at + days * MS_DAY, ...(spec.offWork ? { offWorkUntil: at + days * MS_DAY } : {}) };
  if (work) injury.atWork = { stateId: CITIES.get(work.cityId)?.parentId ?? 'us-ny', weeklyWage: work.weeklyWage, paidDays: 0, ...(work.employer ? { employer: work.employer } : {}), ...(work.noFica ? { noFica: true } : {}) };
  healthOf(person).injury = injury;
  const cur = saveCurrency(sim.universe);
  // The care: the visit it needs and its sessions of physical therapy, at what the plan leaves; at work, the employer's cover pays it.
  const care = shareOf(person, spec.care, at, cur) + spec.therapy * shareOf(person, 'visit', at, cur);
  // The bill named in sentence case, as every other bill is (“A doctor’s visit”), so a sentence that names it reads
  // “a sprained ankle’s care”. Until 2026-10-13 it took the notice’s title as it was, and “A Medical Bill Went Unpaid”
  // read “for a Sprained Ankle: its care”; found by the second round of that day’s evidence. Until 2026-10-19 (brief 15)
  // it was “A sprained ankle: its care”, which a sentence couldn’t carry: “the bill for a sprained ankle: its care”.
  const bill = !work && care > 0 ? billCare(sim, person, `${spec.label.charAt(0)}${spec.label.slice(1).toLowerCase()}’s care`, care, at) : undefined;
  const w = person.wellbeing;
  w.stress = clamp(w.stress + 6 * personalityOf(person, 'stressGain'), 0, 100);
  w.morale = clamp(w.morale - 4 * personalityOf(person, 'moraleSwing'), 0, 100);
  if (injury.offWorkUntil && injury.atWork) sim.schedule({ at: at + 7 * MS_DAY, kind: COMP_KIND, label: 'Workers’ Compensation', category: 'system', priority: 20, payload: { personId: person.id } });
  if (person.id === sim.universe.playerId) {
    // The state's own share (from 2026-10-12): until then every notice said two-thirds, Connecticut's 75% after tax too.
    const rules = injury.atWork ? WORKERS_COMP.states[injury.atWork.stateId] ?? WORKERS_COMP.states['us-ny']! : undefined;
    const weekly = rules && work ? compWeekly(sim, rules, work.weeklyWage, at, work.noFica) : 0;
    const careWords = `${CARE_WORDS[spec.care]}${spec.therapy ? ` and ${countWords(spec.therapy)} ${spec.therapy === 1 ? 'session' : 'sessions'} of physical therapy` : ''}`;
    sim.notify({
      category: 'health', title: spec.label,
      // The second sentence only where it has words (from 2026-10-16: until then a care of nothing left the notice ending
      // in a space, “19 days to mend. ”; found playing a withdrawal, brief 09's journeys).
      // What it keeps them from, from 2026-10-17 (brief 14): until then a sprain, which stops a workout (`trainingRefusal`),
      // said only its days, and the bill said "due in 30 days", not its date and what follows it (`dueWords`).
      // From 2026-10-17 (brief 14's health journey): a care the plan paid whole said nothing, so a player couldn't tell
      // whether care was had or what it cost, where the flu's notice says there's nothing to pay; and an injury that
      // limits the work didn't say Call In Sick excuses a day of classes for it (`sickRefusal`'s doctor's note), where
      // the flu's does. An injury that lays them up already says it keeps them from classes.
      // From 2026-10-20 (brief 17): the day it mends, what it keeps them from and what's done about it (`injuryKeeps`)
      // before what its care costs, as the flu's notice has them, and the care named where it's billed too. Until then a
      // billed injury said "You owe $699.13 for its care." without saying what the care was.
      body: [`It takes ${plural(days, 'day')} to mend, until ${formatDate(injury.until, sim.zone)}.`, injuryKeeps(kind, Boolean(person.school && !schoolEnded(person.school.standing))), work ? 'It happened at work, so workers’ compensation pays for the care' + (spec.offWork && rules ? `, and ${shareWords(rules, weekly, work.weeklyWage)} while you’re off.` : '.') : bill ? `You owe ${formatMoney(care, cur)} for its care, ${careWords}. ${dueWords(sim, bill.dueAt)}` : `Its care, ${careWords}, costs you nothing.`].join(' '),
      importance: 80, route: '/workspace/papers',
    });
  }
  return injury;
}

/** Everyday life's injuries for a day: each cause at its yearly rate a person. */
export function everydayInjury(sim: Simulation, person: Person, at: Instant): Injury | undefined {
  for (const [cause, perThousand] of Object.entries(INJURY.everydayYearly) as [InjurySource, number][]) {
    const hurt = mayHurt(sim, person, cause, perThousand / 1000 / 365, at);
    if (hurt) return hurt;
  }
  return undefined;
}

/** A day hurt: it weighs on the mood and the stress till it mends. */
export function injuryDay(person: Person, at: Instant): void {
  if (!injuryOf(person, at)) return;
  const w = person.wellbeing;
  w.morale = clamp(w.morale - INJURY.weighs.morale, 0, 100);
  w.stress = clamp(w.stress + INJURY.weighs.stress, 0, 100);
}

/** A week's benefit in the state's way: its share of the wage (after tax in Connecticut), between its floor and its ceiling. */
export function compWeekly(sim: Simulation, rules: CompRules, weeklyWage: Money, at: Instant, noFica = false): Money {
  const cur = saveCurrency(sim.universe);
  const inSave = (usd: Money) => exchange(usd, 'USD', cur) ?? usd;
  // After tax: the wage less a year of it's income and payroll tax, by the week (SLATE's reading of CGS 31-310's "after
  // taxes", worked on the tax table).
  // A wage that bore no FICA (a student's at their own school, an F-1's) has none taken off it (from 2026-10-13: until
  // then a work-study week paid 75% of the wage less a year of payroll tax never withheld; found by the review of that day).
  const tax = rules.afterTax ? computeAnnualTax(weeklyWage * 52, 'us-ct-newhaven', at, { currency: cur }) : undefined;
  const base = tax ? weeklyWage - Math.round((tax.total - (noFica ? tax.payroll : 0)) / 52) : weeklyWage;
  const share = Math.round(base * rules.share);
  // Connecticut’s floor, a fifth of the maximum, is held to 75% of the average weekly wage “as determined under section
  // 31-310”, the wage before deductions (CGS 31-307(a), read at https://www.cga.ct.gov/current/pub/chap_568.htm on
  // 2026-10-13). Until that day it was held to 75% of the wage after tax, so the Summer Cabaret’s $375 week paid a
  // resident $252.67 and an F-1 student $274.19, where the statute’s minimum is $281.25 to both.
  const floor = rules.minShareOfMax !== undefined ? Math.min(Math.round(inSave(rules.max) * rules.minShareOfMax), Math.round(weeklyWage * rules.share)) : inSave(rules.min);
  return clamp(share, floor, inSave(rules.max));
}

/** A week's workers' compensation: the state's share of the wage between its floor and ceiling, the waiting days unpaid unless the time off runs past the state's days. */
export function compWeek(sim: Simulation, person: Person, at: Instant): Money {
  const injury = healthOf(person).injury;
  const work = injury?.atWork;
  if (!injury || !work || !injury.offWorkUntil) return 0;
  const rules = WORKERS_COMP.states[work.stateId] ?? WORKERS_COMP.states['us-ny']!;
  const weekly = compWeekly(sim, rules, work.weeklyWage, injury.at, work.noFica);
  const offDays = Math.round((injury.offWorkUntil - injury.at) / MS_DAY);
  const through = Math.min(offDays, Math.round((at - injury.at) / MS_DAY));
  const waiting = offDays > rules.retroAfterDays ? 0 : rules.waitingDays;
  const owedDays = Math.max(0, through - waiting);
  const days = owedDays - work.paidDays;
  if (days <= 0) return 0;
  work.paidDays = owedDays;
  const amount = Math.round((weekly * days) / 7);
  const into = payeeAccount(sim, person);
  sim.post({ memo: 'Workers’ compensation', category: 'benefit', postings: [{ accountId: into.id, amount }, { accountId: sim.nominalAccount('income', 'Workers’ Compensation').id, amount: -amount }] });
  return amount;
}

export function registerInjury(sim: Simulation): void {
  sim.onEvent('world.day_rollover', 'injury.day', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      injuryDay(person, s.now);
      everydayInjury(s, person, s.now);
    }
  });
  sim.onSchedule(COMP_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const injury = person ? healthOf(person).injury : undefined;
    if (!person || !injury?.offWorkUntil) return;
    compWeek(s, person, item.at);
    if (item.at < injury.offWorkUntil) s.schedule({ at: Math.min(item.at + 7 * MS_DAY, injury.offWorkUntil), kind: COMP_KIND, label: 'Workers’ Compensation', category: 'system', priority: 20, payload: { personId: person.id } });
  });
}
