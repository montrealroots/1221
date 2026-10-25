/**
 * Brief 27, K7 (2026-10-25): what an award does after it, loop 47: "Result becomes part of the record → materials and
 * industry reference update → appropriate representatives and casting processes can consider it → relevant opportunities or
 * negotiation circumstances may change → effects persist without making future work automatic. Avoid endlessly stacking
 * reputation rewards for the same award." Held here: an agent's office reads recognition as a step up in the work it has to
 * go on, once however much there is, and says so; and a production asked for more agrees likelier by half the actor's
 * visibility, where the same ask without the nomination is kept.
 *
 * PLAYER JOURNEYS: a graduate's offer, asked for more through the command and the answer played by the clock. TEST SETUP,
 * said where it's done: a finished job, an agreement with an agent (tests/fakes/b20-career.ts), a nomination on the record
 * as the awards' clock leaves one, and the offer as casting's draws would leave one. The part is found where its own draw
 * gives the case, never forced.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { ProjectTemplate } from '@/engine/content/careerwork';
import { AGENTS } from '@/engine/content/agents';
import { keepProject, productionsOf } from '@/engine/systems/slate';
import { visibilityOf } from '@/engine/systems/awards';
import { interestOf } from '@/engine/systems/proagent';
import { showAt, type GuildEntry } from '@/engine/systems/actorawards';
import { actorEdition } from '@/engine/content/awards';
import type { Opportunity } from '@/engine/systems/pro';
import { NEGOTIATE, OFFER_KIND, payTermsOf, travels, writtenFor } from '@/engine/systems/projobs';
import { finishedJob, represent } from './fakes/b20-career';
import { graduate, notices, played } from './fakes/career-world';

const WEEK = 7 * MS_DAY;
type Sim = ReturnType<typeof graduate>;

/** TEST SETUP: an Actor Awards nomination on the record for a finished job's credit, as the awards' clock leaves one. */
function nominatedFor(sim: Sim, year: number): GuildEntry {
  const e = finishedJob(sim, 'strong', 'calloway-files');
  const c = sim.player.pro!.credits.at(-1)!;
  c.engagementId = e.id;
  const g: GuildEntry = { id: `test-guild-${year}`, institution: 'actor-awards', year, category: 'tv-drama', creditId: c.id, engagementId: e.id, state: 'nominated', ceremonyAt: showAt(actorEdition(year)), field: { submissions: 120, nominees: [`you:${c.id}`], standing: {} } };
  (sim.player.pro!.guild ??= []).push(g);
  return g;
}

describe('what an award does after it', () => {
  it('an agent’s office reads recognition as a step up in the work, once however much there is, and says so; the falsifiability twin has none', () => {
    const agent = AGENTS[0]!;
    const plain = graduate('b27-effects-agent');
    finishedJob(plain, 'strong', 'calloway-files');
    const without = interestOf(plain, plain.player, agent, plain.now).factors.find((f) => f.id === 'work')!;
    const sim = graduate('b27-effects-agent');
    nominatedFor(sim, 2025);
    const once = interestOf(sim, sim.player, agent, sim.now).factors.find((f) => f.id === 'work')!;
    const order = ['short', 'near', 'at', 'beyond'];
    expect(order.indexOf(once.level)).toBe(Math.min(3, order.indexOf(without.level) + 1));
    expect(once.words).toContain('It can see your recognition too: your Actor Awards nomination for Desk Clerk.');
    // Never stacking: a second nomination, the same step.
    nominatedFor(sim, 2026);
    const twice = interestOf(sim, sim.player, agent, sim.now).factors.find((f) => f.id === 'work')!;
    expect(twice.level).toBe(once.level);
    expect(twice.words).toContain('and one other.');
  });

  it('PLAYER JOURNEY: a production asked for more agrees by half the actor’s visibility; the falsifiability twin, the same ask without the nomination, is kept', () => {
    const answer = (withNomination: boolean) => {
      const sim = graduate('b27-effects-ask');
      represent(sim);
      if (withNomination) nominatedFor(sim, 2026);
      // A part whose answer's draw falls between the chance without the visibility and with it, read as the game reads it,
      // the same part for both twins: the visibility a nomination lends, read from a save that has one.
      const ref = graduate('b27-effects-ask');
      nominatedFor(ref, 2026);
      const v = (at: number) => NEGOTIATE.visibility * visibilityOf(ref.player, at);
      let found: { t: ProjectTemplate; week: number } | undefined;
      for (let w = 1; w < 300 && !found; w += 1) {
        const week = sim.now + w * WEEK;
        for (const p of productionsOf(sim, week)) for (const t of p.parts) {
          if (found || travels(sim.player, t) || !writtenFor(t, sim.player) || t.union !== 'sag-aftra') continue;
          keepProject(sim.player, t);
          if (payTermsOf({ projectId: t.id, postedAt: week }).each === undefined) continue;
          const draw = sim.rng('pro.negotiate', t.id, week).next();
          if (draw >= NEGOTIATE.yes.working + 0.002 && draw < NEGOTIATE.yes.working + v(week + 2 * MS_DAY) - 0.002) found = { t, week };
        }
      }
      expect(found).toBeDefined();
      const { t, week } = found!;
      played(sim, week);
      // TEST SETUP: an offer for the part, as casting's draws would leave one.
      const terms = payTermsOf({ projectId: t.id, postedAt: week });
      const a = sim.player.pro!.agreements.find((x) => x.status === 'accepted')!;
      const o: Opportunity = {
        id: `test-${t.id}`, projectId: t.id, via: 'agent', agentId: a.agentId, agreementId: a.id, status: 'offered', postedAt: week, submitBy: week + WEEK, history: [], counts: {},
        offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: t.pay, amount: terms.each!, per: terms.per, units: terms.units, version: 1 },
      };
      sim.player.pro!.opportunities.push(o);
      sim.schedule({ at: o.offer!.until, kind: OFFER_KIND, label: `The Offer For ${t.role.part} Lapses`, category: 'career', priority: 40, refType: 'pro.offer', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id } });
      const r = sim.must<{ answerAt: number }>({ kind: 'pro.ask_more', payload: { opportunityId: o.id } });
      played(sim, r.answerAt + MS_HOUR);
      return { answer: o.offer!.asked!.answer, sim, t };
    };
    const recognized = answer(true);
    expect(recognized.answer).toBe('raised');
    expect(notices(recognized.sim).some((n) => n.startsWith(`The Offer For ${recognized.t.role.part} Is Raised | `))).toBe(true);
    expect(answer(false).answer).toBe('kept');
  }, 300_000);
});
