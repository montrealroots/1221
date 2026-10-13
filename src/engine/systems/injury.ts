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
 * and California, 75% after tax in Connecticut. Until 2026-10-12 this said
 * two-thirds, and so did the notice, of a Connecticut injury too.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { clamp } from '../core/rng';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { INJURY, INJURY_KIND, INJURY_MIX, WORKERS_COMP, type CompRules, type InjuryKind } from '../content/injury';
import { computeAnnualTax } from '../content/tax';
import { personalityOf } from './personality';
import { billCare, healthOf, shareOf } from './health';
import { payeeAccount } from './cash';

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

/** The state's share of the wage in words, for a notice: "two-thirds of your week’s wage", or Connecticut's after tax. */
const shareWords = (rules: CompRules): string =>
  `${Math.abs(rules.share - 2 / 3) < 1e-9 ? 'two-thirds' : `${Math.round(rules.share * 100)}%`} of your week’s wage${rules.afterTax ? ' after tax' : ''}`;

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
  if (!work && care > 0) billCare(sim, person, `${spec.label}: its care`, care, at);
  const w = person.wellbeing;
  w.stress = clamp(w.stress + 6 * personalityOf(person, 'stressGain'), 0, 100);
  w.morale = clamp(w.morale - 4 * personalityOf(person, 'moraleSwing'), 0, 100);
  if (injury.offWorkUntil && injury.atWork) sim.schedule({ at: at + 7 * MS_DAY, kind: COMP_KIND, label: 'Workers’ Compensation', category: 'system', priority: 20, payload: { personId: person.id } });
  if (person.id === sim.universe.playerId) {
    // The state's own share (from 2026-10-12): until then every notice said two-thirds, Connecticut's 75% after tax too.
    const rules = injury.atWork ? WORKERS_COMP.states[injury.atWork.stateId] ?? WORKERS_COMP.states['us-ny']! : undefined;
    sim.notify({
      category: 'health', title: spec.label,
      body: `${days} days to mend${spec.offWork ? ', and off work for them' : ''}. ${work ? 'It happened at work, so workers’ compensation pays the care' + (spec.offWork && rules ? ` and ${shareWords(rules)} while you’re off.` : '.') : care > 0 ? `Its care comes to ${formatMoney(care, cur)}, due in 30 days.` : ''}`,
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
  const floor = rules.minShareOfMax !== undefined ? Math.min(Math.round(inSave(rules.max) * rules.minShareOfMax), share) : inSave(rules.min);
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
