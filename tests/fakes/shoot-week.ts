/**
 * TEST SETUP for brief 20's D3 measurement (tests/b20-life-fatigue.test.ts, docs/verification/audit-2026-10-21/areas/
 * life/REPORT.md): a graduate living in New Haven, booked through `pro.accept_offer` for Gull Season's Wren, six shoot
 * days on consecutive weekdays in New York from Monday 14 September 2026, each a 7 AM call two hours away (`tripMinutes`).
 *
 * What's set by hand, and only that: the graduate (`graduate`, the School's own Commencement with the last term put on
 * the clock); a skilled actor's craft, abilities and the project's genres (`skilled`, as tests/pro-work.test.ts sets
 * one), so the work's judgment has room to show the day's condition; and the offer standing, as casting's `makeOffer`
 * leaves one (the opportunity record, `offered`). The booking itself is the player's `pro.accept_offer`, which puts the
 * days on the calendar through the work system's own `bookDays`; the part is prepared through `pro.prepare`, and every
 * hour after is the clock and the player's commands.
 */
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, zonedParts } from '@/engine/core/time';
import { graduate, at } from './career-work';
import { lookAfter } from '../../tools/policy';
import { readiness, suggestedSleep } from '@/engine/systems/life';
import { answerStop } from '@/engine/world/clock';
import { WORK_DAY_KIND } from '@/engine/systems/projobs';
import { ensurePro, type Opportunity } from '@/engine/systems/pro';
import { projectById, PROJECTS } from '@/engine/content/careerwork';
import { evenCraft } from '@/engine/systems/school';
import { attributesOf } from '@/engine/systems/attributes';
import { genreState } from '@/engine/systems/engagement';
import { EVALUATION } from '@/engine/content/tasks';

export { at };
export const FIRST_CALL = at(2026, 9, 14, 7);

/** A booked week: the save at Sunday 13 September, 6 PM, with six shoot days ahead from Monday at seven. */
export function shootWeek(seed = 'b20-d3'): Simulation {
  const sim = graduate(seed);
  sim.player.craft = evenCraft(92);
  const attrs = attributesOf(sim, sim.player) as unknown as Record<string, number>;
  for (const k of Object.keys(attrs)) if (typeof attrs[k] === 'number') attrs[k] = 95;
  for (const t of PROJECTS) for (const g of t.genres) genreState(sim.player, g).familiarity = 95;
  const t = projectById('gull-season')!;
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId: t.id, via: 'open', status: 'offered', postedAt: FIRST_CALL - 35 * MS_DAY, submitBy: sim.now - MS_DAY,
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, amount: 1_000_00, per: 'day', units: 6 }, history: [], counts: {},
  };
  ensurePro(sim, sim.player).opportunities.push(o);
  sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
  const e = sim.player.pro!.engagements[0]!;
  // The part prepared as a player prepares it, each step pressed until it can do no more, an hour apart, from four in
  // the afternoon: the graduate's last class day runs to three (`graduate`).
  play(sim, at(2026, 9, 3, 16), () => false);
  for (let n = 0; n < 24; n += 1) {
    let any = false;
    for (const step of ['read', 'lines', 'rehearse']) if (sim.execute({ kind: 'pro.prepare', payload: { engagementId: e.id, step } }).ok) any = true;
    play(sim, sim.now + MS_HOUR, () => false);
    if (!any) break;
  }
  play(sim, at(2026, 9, 13, 18), (s) => zonedParts(s.now, s.zone).hour === 23);
  return sim;
}

/** One call, as the clock stopped at it, and the day's work as it was judged and what was left at the wrap. */
export interface Day { label: string; energy: number; debt: number; readiness: number; overall?: number; tired?: boolean; wrapEnergy?: number }

/**
 * The clock moved an hour at a time, as the top bar's One Hour moves it: what Look After Yourself puts first and urgent
 * taken first (`lookAfter`, tools/policy.ts), to bed when `bed` says with the Sleep dialog's suggestion, and Go pressed at
 * every stop (`answerStop`). Each work day's call is read as the clock stands at it.
 */
export function play(sim: Simulation, until: number, bed: (sim: Simulation) => boolean, days: Day[] = []): Day[] {
  while (sim.now < until) {
    lookAfter(sim);
    if ((sim.player.awakeSince ?? 0) <= sim.now && bed(sim) && sim.execute({ kind: 'life.sleep', payload: { hours: suggestedSleep(sim).hours } }).ok) continue;
    const to = Math.min(until, sim.now + MS_HOUR);
    let r = sim.advanceTo(to, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) {
      const item = r.interruptedBy;
      const w = sim.player.wellbeing;
      const day: Day | undefined = item.kind === WORK_DAY_KIND ? { label: item.label, energy: w.energy, debt: w.sleepDebt, readiness: readiness(sim.player) } : undefined;
      r = answerStop(sim, { item, wanted: to, sentFrom: r.sentFrom }, 'go').result!;
      if (day) {
        const work = sim.player.work!.at(-1)!;
        day.overall = work.overall;
        day.tired = (work.inputs.condition as { readiness: number }).readiness < EVALUATION.sufficientReadiness;
        day.wrapEnergy = sim.player.wellbeing.energy;
        days.push(day);
      }
    }
  }
  return days;
}

export const atHour = (hour: number) => (s: Simulation) => zonedParts(s.now, s.zone).hour === hour;
