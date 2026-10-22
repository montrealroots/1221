/**
 * TEST SETUP for brief 20's benefits area (`tests/b20-benefits-*.test.ts`), as tests/pro-work.test.ts makes it: the body
 * kept fed, rested and awake as the clock moves (`tended`, and `played`, which stops at every commitment that wants the
 * player and answers it Go, the stop's own rule, `answerStop`); a graduate of the class of 2029 made through the School's
 * own evaluation and Commencement with the last term put on the clock (`graduate`); an offer standing for a role posted
 * on a Monday, as casting's draw would make it (`offered`), which a test then accepts through `pro.accept_offer`, so its
 * days go on the calendar, are worked by the clock and paid by the pay's own handlers; and a skilled actor's craft and
 * abilities, set as years of work would leave them (`skilled`), for an input that mustn't leak.
 */
import { expect } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { answerStop } from '@/engine/world/clock';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { COMMENCEMENT_KIND, EVALUATION_KIND, evenCraft } from '@/engine/systems/school';
import { attributesOf } from '@/engine/systems/attributes';
import { projectById } from '@/engine/content/careerwork';
import type { Opportunity } from '@/engine/systems/pro';
import { datesOf, payTermsOf, postingTimes } from '@/engine/systems/projobs';

export const zone = 'America/New_York';
export const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);

/** Ada Cole at Yale in New Haven, born in New York, from Monday 24 August 2026. */
export const student = (seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });

/** TEST SETUP: rested, fed, steady and awake. */
export const tend = (sim: Simulation) => {
  Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
};
/** The clock moved six hours at a time, tended as it moves. */
export const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) { tend(sim); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); }
};
/** Played from the top bar: six hours at a time, Go pressed at every commitment that wants the player, tended as it moves. */
export const played = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    tend(sim);
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) {
      tend(sim);
      r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!;
    }
  }
};
export const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

/** TEST SETUP: a graduate of the class of 2029, by the School's own evaluation and Commencement, on 3 September 2026. */
export function graduate(seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}): Simulation {
  const sim = student(seed, more);
  tended(sim, at(2026, 9, 1, 18));
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  sim.schedule({ at: at(2026, 9, 3, 10), kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  tended(sim, at(2026, 9, 3, 13));
  expect(sim.player.school!.standing).toBe('graduated');
  return sim;
}

/** TEST SETUP: a skilled actor, as years of work would leave one: every technique at 92 and every ability at 95. */
export function skilled(sim: Simulation): void {
  sim.player.craft = evenCraft(92);
  const attrs = attributesOf(sim, sim.player) as unknown as Record<string, number>;
  for (const k of Object.keys(attrs)) if (typeof attrs[k] === 'number') attrs[k] = 95;
}

/** TEST SETUP: an offer standing for a role posted on the first Monday from `from`, as casting's draw would make it. */
export function offered(sim: Simulation, projectId: string, from: number): Opportunity {
  const posted = postingTimes(from, from + 8 * MS_DAY)[0]!;
  const terms = payTermsOf({ projectId, postedAt: posted });
  const o: Opportunity = { id: sim.nextId('pro'), projectId, via: 'open', status: 'offered', postedAt: posted, submitBy: posted + 7 * MS_DAY, history: [], counts: {}, offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: projectById(projectId)!.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units } };
  sim.player.pro!.opportunities.push(o);
  return o;
}

/** The job taken: the offer (`offered`) accepted through the command, its days worked and paid by the clock. */
export function worked(sim: Simulation, projectId: string, from = sim.now): { days: ReturnType<typeof datesOf>; engagementId: string } {
  const o = offered(sim, projectId, from);
  const a = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
  const days = datesOf(o);
  played(sim, days.at(-1)!.to + 10 * MS_DAY);
  return { days, engagementId: a.engagementId };
}

export const checkingOf = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
export const own = (sim: Simulation, kind: Account['kind']): Account => sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === kind && !a.closedAt && a.category !== 'term')!;
export const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
/** A transaction's posting to an account. */
export const postedTo = (sim: Simulation, memo: RegExp, accountId: string) => sim.universe.transactions.filter((t) => memo.test(t.memo)).map((t) => [t.at, t.postings.filter((p) => p.accountId === accountId).reduce((s, p) => s + p.amount, 0)] as const);

/**
 * Their savings moved into the checking account, and all of it into a CD, by the Bank screen's commands: nothing left to
 * pay from. A savings account the bank has closed, as it closes one left empty, has nothing to move.
 */
export function intoTheCd(sim: Simulation): void {
  const savings = own(sim, 'savings');
  if (savings && savings.balance > 0) sim.must({ kind: 'bank.transfer', payload: { fromId: savings.id, toId: checkingOf(sim).id, amount: savings.balance } });
  sim.must({ kind: 'bank.open_term', payload: { amount: checkingOf(sim).balance } });
  expect([checkingOf(sim).balance, own(sim, 'savings')?.balance ?? 0]).toEqual([0, 0]);
}
/** The CD broken early, its money back in the checking account. */
export function breakTheCd(sim: Simulation): void {
  const cd = sim.ledger.accountsOf(sim.player.id).find((a) => a.category === 'term' && !a.closedAt)!;
  sim.must({ kind: 'bank.break_term', payload: { accountId: cd.id } });
}
