/**
 * The series, releases and market cluster's played-journey helpers (brief 27, 2026-10-25), on tests/fakes/career-world.ts's
 * graduate and clock. TEST SETUP where said: an offer on the record as casting's draws would leave one, standing three
 * days, as tests/b27-release.test.ts writes it; the rest is the clock and the commands a player sends.
 */
import { expect } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { addProjects, projectById, type ProjectTemplate } from '@/engine/content/careerwork';
import { keepProject, pilotsOf, productionsOf } from '@/engine/systems/slate';
import type { Engagement, Opportunity, ProCredit } from '@/engine/systems/pro';
import { OFFER_KIND, RELEASE_KIND, payTermsOf, releaseFate, travels, writtenFor } from '@/engine/systems/projobs';
import { formatOf } from '@/engine/systems/workflow';
import { played } from './career-world';
import type { Simulation } from '@/engine/core/simulation';

export const WEEK = 7 * MS_DAY;
export type Fate = NonNullable<ProCredit['release']>['kind'];

/** A slate film for cinemas near home, made, written for the player, paid, whose way out is the one wanted and that passes `more`. */
export function slateFilm(sim: Simulation, want: Fate, more: (t: ProjectTemplate) => boolean = () => true, from = 1): { t: ProjectTemplate; week: number } {
  for (let w = from; w < 500; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
      if (formatOf(t).after !== 'theatrical' || travels(sim.player, t) || !writtenFor(t, sim.player) || t.slate!.fate.kind !== 'made') continue;
      if (releaseFate(sim, t).kind !== want || !more(t)) continue;
      addProjects([t]);
      if (payTermsOf({ projectId: t.id, postedAt: week }).each === undefined) continue;
      keepProject(sim.player, t);
      return { t, week };
    }
  }
  throw new Error(`no film ${want}`);
}

/** A pilot near home, written for the player, that passes `more`, from the winters after now. */
export function slatePilot(sim: Simulation, more: (t: ProjectTemplate) => boolean = () => true): { t: ProjectTemplate; week: number } {
  for (let w = 1; w < 400; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of pilotsOf(sim, week)) for (const t of p.parts) {
      if (travels(sim.player, t) || !writtenFor(t, sim.player) || !more(t)) continue;
      addProjects([t]);
      if (payTermsOf({ projectId: t.id, postedAt: week }).each === undefined) continue;
      keepProject(sim.player, t);
      return { t, week };
    }
  }
  throw new Error('no pilot');
}

/** TEST SETUP: an offer for a part on the record as casting's draws would leave one, standing three days. */
export function offered(sim: Simulation, t: ProjectTemplate, postedAt: number): Opportunity {
  const terms = payTermsOf({ projectId: t.id, postedAt });
  const o: Opportunity = {
    id: sim.nextId('pro'), projectId: t.id, via: 'open', status: 'offered', postedAt, submitBy: postedAt + WEEK, history: [], counts: {},
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units, version: 1 },
  };
  sim.player.pro!.opportunities.push(o);
  sim.schedule({ at: o.offer!.until, kind: OFFER_KIND, label: `The Offer For ${t.role.part} Lapses`, category: 'career', priority: 40, refType: 'pro.offer', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id } });
  return o;
}

/** Accepted through the command and played to the wrap, with its credit, and when its release is due where it has one. */
export function wrapped(sim: Simulation, t: ProjectTemplate, week: number, mustFinish = true): { e: Engagement; c: ProCredit | undefined; due: number | undefined } {
  played(sim, week);
  const o = offered(sim, t, week);
  const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
  const e = sim.player.pro!.engagements.find((x) => x.id === id)!;
  for (let n = 0; n < 4 && e.status !== 'finished' && e.status !== 'canceled'; n += 1) played(sim, e.days.at(-1)!.to + 2 * MS_HOUR);
  if (mustFinish) expect(e.status).toBe('finished');
  const c = sim.player.pro!.credits.find((x) => x.engagementId === e.id);
  const due = c ? sim.universe.scheduled.find((i) => i.kind === RELEASE_KIND && i.refId === c.id && i.status === 'pending')?.at : undefined;
  return { e, c, due };
}

/** A fixed part by id. */
export const part = (id: string): ProjectTemplate => projectById(id)!;

/**
 * The first slate film with the way out wanted that the player works to its end: one missed on its first day (the clock's
 * stop met asleep, as the played helper can) is passed over for the next, as a player would take the next part.
 */
export function wrappedFilm(sim: Simulation, want: Fate, more: (t: ProjectTemplate) => boolean = () => true): { t: ProjectTemplate; e: Engagement; c: ProCredit; due: number } {
  for (let k = 0; k < 4; k += 1) {
    const { t, week } = slateFilm(sim, want, more);
    const w = wrapped(sim, t, week, false);
    if (w.e.status === 'finished' && w.c && w.due !== undefined) return { t, e: w.e, c: w.c, due: w.due };
  }
  throw new Error(`no film ${want} worked to its end`);
}
