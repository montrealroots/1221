/**
 * Brief 27, K4 (2026-10-24): a direct offer (loop 16, "Offer arrives without an audition → establish why the player is a
 * plausible candidate ... Do not insert an audition merely because the generic workflow expects one") and asking for more
 * through the agent (loop 18, "propose changes → other party responds → terms may improve, remain unchanged ... Version
 * the agreement ... Negotiation is not unlimited rerolling for better pay"). Held here: a casting office that cast the
 * actor before, the work judged Strong, offers a later part without an audition, says why, and never a lead or for work
 * judged Working; the agent asks once, a fifth over the offer, the answer the next afternoon raising it or keeping it,
 * each said, the offer versioned and standing a day past the answer, the raised figure the one the booking pays.
 *
 * PLAYER JOURNEYS: a graduate played by the clock and the commands a player sends (tests/fakes/career-world.ts); TEST
 * SETUP, said where it's done: a finished job and its credit (tests/fakes/b20-career.ts's `finishedJob`), the agreement
 * (`represent`), and an offer put on the record as casting's draws would leave one. Each fixture's draw is read as the
 * game reads it, never forced.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { ProjectTemplate } from '@/engine/content/careerwork';
import { keepProject, productionsOf, slatePartsAt } from '@/engine/systems/slate';
import type { Opportunity } from '@/engine/systems/pro';
import { DIRECT, NEGOTIATE, OFFER_KIND, askMoreRefusal, askedAmount, directOfferFor, payTermsOf, postingTimes, postingsAt, travels, writtenFor } from '@/engine/systems/projobs';
import { graduate, notices, played } from './fakes/career-world';
import { finishedJob, represent } from './fakes/b20-career';

const WEEK = 7 * MS_DAY;

/** A slate part near New Haven, not a lead, from any production: the first the slate makes. */
function nearPart(sim: ReturnType<typeof graduate>, pick: (t: ProjectTemplate, week: number) => boolean): { t: ProjectTemplate; week: number } {
  for (let w = 1; w < 300; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
      if (travels(sim.player, t) || !writtenFor(t, sim.player)) continue;
      // Registered, so its terms and dates can be read (`keepProject`); a part nothing names is dropped from the save again.
      keepProject(sim.player, t);
      if (pick(t, week)) return { t, week };
    }
  }
  throw new Error('no such part');
}

/** TEST SETUP: an offer for a part put on the record as casting's draws would leave one, standing three days. */
function offered(sim: ReturnType<typeof graduate>, t: ProjectTemplate, postedAt: number): Opportunity {
  keepProject(sim.player, t);
  const terms = payTermsOf({ projectId: t.id, postedAt });
  const agreement = sim.player.pro!.agreements.find((a) => a.status === 'accepted');
  const o: Opportunity = {
    id: `test-${t.id}`, projectId: t.id, via: agreement ? 'agent' : 'open', status: 'offered', postedAt, submitBy: postedAt + WEEK, history: [], counts: {},
    ...(agreement ? { agentId: agreement.agentId, agreementId: agreement.id } : {}),
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units, version: 1 },
  };
  sim.player.pro!.opportunities.push(o);
  sim.schedule({ at: o.offer!.until, kind: OFFER_KIND, label: `The Offer For ${t.role.part} Lapses`, category: 'career', priority: 40, refType: 'pro.offer', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id } });
  return o;
}

describe('a direct offer', () => {
  it('comes from a casting office that cast the actor before, the work judged Strong, says why, and never for a lead or work judged Working', () => {
    const sim = graduate('b27-direct-rule');
    const { t: first } = nearPart(sim, (t) => t.role.size !== 'lead' && t.slate!.fate.kind === 'made');
    keepProject(sim.player, first);
    // TEST SETUP: the job for that casting office finished and credited, judged Strong.
    const job = finishedJob(sim, 'strong', first.id);
    let yes = 0;
    let no = 0;
    for (let w = 1; w < 200 && (yes === 0 || no === 0); w += 1) {
      const at = sim.now + w * WEEK;
      for (const t of slatePartsAt(sim, at)) {
        const d = directOfferFor(sim, sim.player, t, at);
        if (t.casting !== first.casting || t.role.size === 'lead') { expect(d, t.id).toBeUndefined(); continue; }
        if (d) {
          yes += 1;
          expect(d).toEqual({ engagementId: job.id, words: `${first.casting} cast you as ${first.role.part} in ${first.project}, where your work was Strong.` });
        } else no += 1;
      }
    }
    // Half the time it reaches them, by its own draw: some of each.
    expect([yes > 0, no > 0]).toEqual([true, true]);
    expect(DIRECT.chance).toBe(0.5);
    // The same job judged Working brings none.
    const working = graduate('b27-direct-working');
    keepProject(working.player, first);
    finishedJob(working, 'working', first.id);
    for (let w = 1; w < 60; w += 1) for (const t of slatePartsAt(working, working.now + w * WEEK)) expect(directOfferFor(working, working.player, t, working.now + w * WEEK)).toBeUndefined();
  });

  it('PLAYER JOURNEY: posted that week, the part comes as an offer, no audition set, the offer saying why', () => {
    const sim = graduate('b27-direct-journey');
    const { t: first } = nearPart(sim, (t) => t.role.size !== 'lead' && t.slate!.fate.kind === 'made');
    keepProject(sim.player, first);
    finishedJob(sim, 'strong', first.id);
    // The first Monday whose postings, read as the game reads them, bring a part from that office as a direct offer.
    let target: { t: ProjectTemplate; at: number } | undefined;
    for (const at of postingTimes(sim.now, sim.now + 150 * WEEK)) {
      const hit = postingsAt(sim, sim.player, at).find((x) => x.project.casting === first.casting && directOfferFor(sim, sim.player, x.project, at));
      if (hit) { target = { t: hit.project, at }; break; }
    }
    expect(target).toBeDefined();
    played(sim, target!.at + MS_HOUR);
    const o = sim.player.pro!.opportunities.find((x) => x.projectId === target!.t.id)!;
    expect([o.status, o.rounds ?? []]).toEqual(['offered', []]);
    expect(o.direct!.words).toBe(`${first.casting} cast you as ${first.role.part} in ${first.project}, where your work was Strong.`);
    expect(o.history.find((h) => h.key === 'offer')!.words).toContain(`offered you ${target!.t.role.part}`);
    expect(o.history.find((h) => h.key === 'offer')!.words).toContain(' without an audition.');
    // The offer's decision in What Needs You says it too.
    const q = Object.values(sim.universe.decisions).find((d) => d.refId === o.id)!;
    expect(q.detail).toContain(`without an audition. ${o.direct!.words}`);
  }, 120_000);
});

describe('asking for more through the agent', () => {
  it('PLAYER JOURNEY: asked once, a fifth over; raised the next afternoon by its draw, the offer versioned, standing a day past the answer, and the raise what the booking pays', () => {
    const sim = graduate('b27-ask-raised');
    represent(sim);
    // A part whose answer, read as the game reads it with no round judged (a direct offer's or none's chance), is a raise.
    const { t, week } = nearPart(sim, (x, wk) => payTermsOf({ projectId: x.id, postedAt: wk }).each !== undefined && x.union === 'sag-aftra' && sim.rng('pro.negotiate', x.id, wk).next() < NEGOTIATE.yes.working);
    played(sim, week);
    const o = offered(sim, t, week);
    const before = o.offer!.amount!;
    const r = sim.must<{ asked: number; answerAt: number }>({ kind: 'pro.ask_more', payload: { opportunityId: o.id } });
    expect(r.asked).toBe(askedAmount(before));
    expect(r.asked).toBeGreaterThan(before);
    expect(o.offer!.until).toBeGreaterThan(r.answerAt);
    // The lapse moved with it, so the offer doesn't lapse before the answer can be taken.
    expect(sim.universe.scheduled.find((i) => i.kind === OFFER_KIND && i.payload.opportunityId === o.id && i.status === 'pending')!.at).toBe(o.offer!.until);
    expect(askMoreRefusal(sim, sim.player, o)).toMatch(/has asked; the answer comes on /);
    played(sim, r.answerAt + MS_HOUR);
    expect([o.offer!.amount, o.offer!.version, o.offer!.asked!.answer, o.status]).toEqual([r.asked, 2, 'raised', 'offered']);
    expect(notices(sim).some((n) => n.startsWith(`The Offer For ${t.role.part} Is Raised | `))).toBe(true);
    // Not unlimited rerolling: once.
    expect(sim.execute({ kind: 'pro.ask_more', payload: { opportunityId: o.id } }).error).toMatch(/asked once already/);
    // Accepted, the booking pays the raised figure.
    const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
    const e = sim.player.pro!.engagements.find((x) => x.id === id)!;
    // The contract names the raised rate, and the pay it promises comes to at least that.
    expect(e.contract!.rate).toBe(r.asked);
    expect(e.contract!.estimate).toBeGreaterThanOrEqual(r.asked);
  }, 120_000);

  it('PLAYER JOURNEY: kept at its offer by its draw, said; refused without an agent, and with no figure to ask more of', () => {
    const sim = graduate('b27-ask-kept');
    represent(sim);
    const { t, week } = nearPart(sim, (x, wk) => payTermsOf({ projectId: x.id, postedAt: wk }).each !== undefined && sim.rng('pro.negotiate', x.id, wk).next() >= NEGOTIATE.yes.working + NEGOTIATE.worked);
    played(sim, week);
    const o = offered(sim, t, week);
    const before = o.offer!.amount!;
    const r = sim.must<{ asked: number; answerAt: number }>({ kind: 'pro.ask_more', payload: { opportunityId: o.id } });
    played(sim, r.answerAt + MS_HOUR);
    expect([o.offer!.amount, o.offer!.version, o.offer!.asked!.answer]).toEqual([before, 1, 'kept']);
    expect(notices(sim).some((n) => n.startsWith(`The Offer For ${t.role.part} Stands | `))).toBe(true);
    // Without an agent, no one asks.
    const alone = graduate('b27-ask-alone');
    played(alone, week);
    const a = offered(alone, t, week);
    expect(askMoreRefusal(alone, alone.player, a)).toBe('An agent asks for more on your behalf, and none represents you, so the offer is as it stands.');
  }, 120_000);
});
