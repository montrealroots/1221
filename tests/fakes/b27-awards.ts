/**
 * Brief 27, K7's played helpers for the Actor Awards and the ceremony (tests/b27-actor-awards.test.ts,
 * tests/b27-ceremony.test.ts): a graduate's Desk Clerk on The Calloway Files in its 2026 season, accepted through the command,
 * prepared by its own steps and played by the clock, its credit due out in 2027 and so in the 34th Actor Awards. TEST SETUP,
 * said where it's done: SAG-AFTRA membership as tests/b27-audience.test.ts sets it; a skilled actor's levels, as years of work
 * would leave them, so the work is judged Strong or better; the offer on the record as casting writes one.
 */
import { expect } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { projectById } from '@/engine/content/careerwork';
import { actorEdition } from '@/engine/content/awards';
import { ensurePro, type Opportunity, type ProCredit } from '@/engine/systems/pro';
import { payTermsOf } from '@/engine/systems/projobs';
import { nominationsAt, showAt, submissionsOpen, type GuildEntry } from '@/engine/systems/actorawards';
import { at, graduate, played, prepareAll, skilled } from './career-world';

export const CLERK = projectById('calloway-files')!;
type Sim = ReturnType<typeof graduate>;

/** The Desk Clerk accepted, prepared and played to its end; its credit. */
export function clerk(seed: string): { sim: Sim; c: ProCredit } {
  const sim = graduate(seed);
  // TEST SETUP: SAG-AFTRA membership, and a skilled actor's levels.
  ensurePro(sim, sim.player).sag = { eligibleSince: sim.now - 60 * MS_DAY, memberSince: sim.now - 30 * MS_DAY };
  skilled(sim);
  // TEST SETUP: the offer for the part, written as casting writes one.
  const postedAt = at(2026, 9, 7);
  const terms = payTermsOf({ projectId: CLERK.id, postedAt });
  const o: Opportunity = { id: sim.nextId('pro'), projectId: CLERK.id, via: 'open', status: 'offered', postedAt, submitBy: postedAt + 7 * MS_DAY, history: [], counts: {}, offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: CLERK.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units } };
  sim.player.pro!.opportunities.push(o);
  const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
  // Prepared in the evenings, out of class, as a player presses the steps.
  for (let d = 1; d <= 3; d += 1) { played(sim, at(2026, 9, d + 1, 19)); prepareAll(sim, { engagementId: id }); }
  const e = sim.player.pro!.engagements.find((x) => x.id === id)!;
  for (let n = 0; n < 3 && e.status !== 'finished'; n += 1) played(sim, e.days.at(-1)!.to + MS_HOUR);
  expect(e.status).toBe('finished');
  return { sim, c: sim.player.pro!.credits.find((x) => x.engagementId === id)! };
}

export const ED = actorEdition(2027);

/** The clock, unplayed, to the 34th's submissions; the performance submitted through the command. */
export function submitted(sim: Sim, c: ProCredit): GuildEntry {
  sim.advanceTo(submissionsOpen(ED) + MS_HOUR);
  const r = sim.must<{ entryId: string }>({ kind: 'pro.actor_submit', payload: { creditId: c.id } });
  return sim.player.pro!.guild!.find((g) => g.id === r.entryId)!;
}

/** The clock, unplayed, to the morning after the nominations. */
export const toNominations = (sim: Sim) => sim.advanceTo(nominationsAt(ED) + MS_HOUR);
/** The show's hour. */
export const SHOW = showAt(ED);
