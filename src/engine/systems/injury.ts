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
 * work, workers' compensation pays the care and two-thirds of the week's
 * wage for the time off, by the state's rules.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import { clamp } from '../core/rng';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { INJURY, INJURY_KIND, INJURY_MIX, WORKERS_COMP, type InjuryKind } from '../content/injury';
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
  /** Hurt at work: the job's state and its week's wage, which workers' compensation reads. */
  atWork?: { stateId: string; weeklyWage: Money; paidDays: number };
}

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
export function mayHurt(sim: Simulation, person: Person, source: InjurySource, chance: number, at: Instant, work?: { cityId: string; weeklyWage: Money }): Injury | undefined {
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
  if (work) injury.atWork = { stateId: CITIES.get(work.cityId)?.parentId ?? 'us-ny', weeklyWage: work.weeklyWage, paidDays: 0 };
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
    sim.notify({
      category: 'health', title: spec.label,
      body: `${days} days to mend${spec.offWork ? ', and off work for them' : ''}. ${work ? 'It happened at work, so workers’ compensation pays the care' + (spec.offWork ? ' and two-thirds of your week’s wage while you’re off.' : '.') : care > 0 ? `Its care comes to ${formatMoney(care, cur)}, due in 30 days.` : ''}`,
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

/** A week's workers' compensation: two-thirds of the wage between the state's floor and ceiling, the waiting days unpaid unless the time off runs past fourteen. */
export function compWeek(sim: Simulation, person: Person, at: Instant): Money {
  const injury = healthOf(person).injury;
  const work = injury?.atWork;
  if (!injury || !work || !injury.offWorkUntil) return 0;
  const rules = WORKERS_COMP.states[work.stateId] ?? WORKERS_COMP.states['us-ny']!;
  const cur = saveCurrency(sim.universe);
  const inSave = (usd: Money) => exchange(usd, 'USD', cur) ?? usd;
  const weekly = clamp(Math.round(work.weeklyWage * WORKERS_COMP.share), inSave(rules.min), inSave(rules.max));
  const offDays = Math.round((injury.offWorkUntil - injury.at) / MS_DAY);
  const through = Math.min(offDays, Math.round((at - injury.at) / MS_DAY));
  const waiting = offDays > WORKERS_COMP.retroAfterDays ? 0 : rules.waitingDays;
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
