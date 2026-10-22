/**
 * The School's request to meet, passed on from the agent's office after the showcase, lapsing on its date (from
 * 2026-10-22, brief 20's journeys, F10: "The School's request to meet passes its deadline with no notice and no change to
 * the relation"). The follow-up's notice says to send materials by a date "and his office sets a time"; until then the
 * date went by with nothing said and nothing kept, and only the Representation tab's next step changed its words.
 *
 * TEST SETUP: a graduate made by the School's own handlers (`tests/fakes/career-work.ts`'s `graduate`), its showcase
 * recorded as performed at Strong in both cities, as tests/pro-agent.test.ts records it, and a seed whose first draw for
 * his interest falls under the least chance to meet, so the follow-up asks; the clock tended six hours at a time.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { rngFor } from '@/engine/core/rng';
import { AGENTS } from '@/engine/content/agents';
import { ASK_LAPSE_KIND, nextStep, relationOf, scheduleShowcaseFollowUp } from '@/engine/systems/proagent';
import { at, graduate, reload, tended } from './fakes/career-work';

const AGENT = AGENTS[0]!;
const PERSON = 'person_000001';
const rel = (sim: Simulation) => relationOf(sim.player, AGENT.id)!;
const notices = (sim: Simulation) => sim.universe.notifications.filter((n) => n.refType === 'pro-agent').map((n) => `${n.title}: ${n.body}`);
/** TEST SETUP: the first seed of the prefix whose first interest draw is under 0.12, the least chance to meet at any room. */
function asking(prefix: string): string {
  for (let i = 0; i < 20_000; i += 1) {
    const seed = `${prefix}-${i}`;
    if (rngFor(seed, 'pro.agent', PERSON, AGENT.id, 'approach-1', 'interest').next() < 0.12) return seed;
  }
  throw new Error(`No seed for ${prefix}`);
}
/** TEST SETUP: the graduate's showcase performed and its follow-up come, a request to meet passed on. */
function followedUp(seed: string): Simulation {
  const sim = graduate(seed);
  // The day's class ran from nine to three, so the afternoon is free from three (as tests/pro-agent.test.ts's graduate).
  tended(sim, at(2026, 9, 3, 15));
  sim.must({ kind: 'pro.headshots', payload: {} });
  sim.must({ kind: 'pro.update_resume', payload: {} });
  sim.player.pro!.showcase = { term: 5, scenes: [], performed: [{ city: 'New York', at: sim.now - 2 * MS_DAY, band: 'strong' }, { city: 'Los Angeles', at: sim.now - MS_DAY, band: 'strong' }] };
  scheduleShowcaseFollowUp(sim, sim.player, sim.now);
  tended(sim, at(2026, 9, 6, 12));
  expect(sim.player.pro!.showcase!.followUp?.agents).toEqual([AGENT.id]);
  return sim;
}

describe('the School’s request to meet, on its last day', () => {
  it('PLAYER JOURNEY: unanswered by October 6, it lapses that day, said and kept on the record, and an approach after it is an ordinary one; answered in time, nothing lapses', () => {
    const seed = asking('b20-ask-lapse');
    const lapses = followedUp(seed);
    const answers = followedUp(seed);
    // The last day is on the calendar, as an offer's is.
    expect(lapses.timeline.pending().filter((i) => i.kind === ASK_LAPSE_KIND).map((i) => i.at)).toEqual([at(2026, 10, 6, 10)]);
    expect(nextStep(lapses, lapses.player, AGENT)).toMatch(/by October 6, 2026, and his office sets a time\.$/);
    // One answers in time.
    answers.must({ kind: 'pro.agent_check', payload: {} });
    answers.must({ kind: 'pro.send_materials', payload: {} });
    for (const sim of [lapses, answers]) tended(sim, at(2026, 10, 7, 12));
    const after = reload(lapses);
    expect(rel(after).history.filter((e) => e.kind === 'ask-lapsed').map((e) => e.words)).toEqual(['His office’s request to meet, passed on by the School, lapsed on October 6, 2026: no materials came.']);
    expect(notices(after).filter((n) => n.startsWith('The Request To Meet'))).toEqual(['The Request To Meet From Halberd Talent Lapsed: You didn’t send your materials to Thomas Ashgrove’s office at Halberd Talent by October 6, 2026, so the request to meet that it passed on through the School after the showcase has lapsed. You can still send them from the Representation tab. It’s then an ordinary approach, which his office answers in its usual time.']);
    expect(nextStep(after, after.player, AGENT)).not.toMatch(/sets a time/);
    // The twin who answered: no lapse said or kept.
    expect(rel(answers).history.some((e) => e.kind === 'ask-lapsed')).toBe(false);
    expect(notices(answers).some((n) => n.startsWith('The Request To Meet'))).toBe(false);
    // It lapses once, a save opened past its day saying nothing more.
    tended(after, at(2026, 11, 1, 12));
    expect(rel(after).history.filter((e) => e.kind === 'ask-lapsed')).toHaveLength(1);
  });
});
