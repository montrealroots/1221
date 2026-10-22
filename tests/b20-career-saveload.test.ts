/**
 * Brief 20's J4 and D1 for the career's obligations: saved and opened in the middle of each, and played on, nothing is
 * dropped or happens twice (`docs/verification/audit-2026-10-21/criteria.md` D1, "a save and a load dropping or
 * replaying a consequence", and J4; the career area's report). A life played straight through is held, at the end, to
 * the same life saved and opened at each obligation and played on with the same commands and the same clock: the same
 * save to the byte. The obligations: a submission waiting for casting's answer, a self-tape due, casting deciding, an
 * offer standing in What Needs You, work booked and not begun, a shoot between its days, a payday to come, pay held in
 * the agency's trust account (the commission still to come off it); and at his office an answer to come, a meeting set,
 * a decision to come, an agreement standing, and the School's follow-up after the showcase.
 *
 * TEST SETUP, said where it's done: the graduate made by the School's own handlers brought forward; the body tended as
 * the clock moves; the work life at the top of every ability and technique and knowing the projects' genres, so it's
 * offered a part (seed b20-skill-2 of tests/b20-career-skill.test.ts's fixed list, offered Robin in Last Bus To Eastview:
 * a success-path fixture); an agreement signed with him once the offer stands, so the pay goes through the trust account
 * with its commission; for his office, a finished job's referral and a seed read from his own draw (`seedWhere`); the
 * showcase's performances, as the showcase's system records them (tests/pro-agent.test.ts's `performed`).
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { serialise } from '@/engine/persistence/adapter';
import { PROJECTS } from '@/engine/content/careerwork';
import { genreState } from '@/engine/systems/engagement';
import { scheduleShowcaseFollowUp, relationOf } from '@/engine/systems/proagent';
import {
  AGENT, SURE, at, eng, graduate, opp, played, portfolio, prepareAll, reel, referredGraduate, represent, seedWhere, setSkill, submitted, tape, tended, toCasting,
  twin, waitFor,
} from './fakes/b20-career';

/** The whole save, as Save & Exit writes it. */
const bytes = (sim: Simulation): string => serialise(sim.universe);

/**
 * A life played step by step, saved and opened before each step, and every opened copy played on with the steps left:
 * each ends as the life played straight through ends, to the byte. Returns the life played straight through.
 */
function heldThrough(start: Simulation, steps: readonly { name: string; step: (s: Simulation) => void }[]): { sim: Simulation; checked: string[] } {
  const saves: { name: string; at: number; save: Simulation }[] = [];
  for (const [i, s] of steps.entries()) {
    saves.push({ name: s.name, at: i, save: twin(start) });
    s.step(start);
  }
  const end = bytes(start);
  const checked: string[] = [];
  for (const { name, at: from, save } of saves) {
    for (const s of steps.slice(from)) s.step(save);
    expect(bytes(save), `opened before ${name}`).toBe(end);
    checked.push(name);
  }
  return { sim: start, checked };
}

describe('saved and opened in the middle of the career’s obligations, nothing dropped or done twice', () => {
  it('PLAYER JOURNEY: a part from its submission to its pay held in trust and passed on, saved and opened before each step, ends as the life played straight through', () => {
    const sim = graduate('b20-skill-2');
    setSkill(sim, 100);
    for (const t of PROJECTS) for (const g of t.genres) genreState(sim.player, g).familiarity = 95;
    portfolio(sim);
    const o = waitFor(sim, (x) => x.projectId === 'eastview')!;
    let engagement = '';
    const { sim: done, checked } = heldThrough(sim, [
      { name: 'the submission', step: (s) => submitted(s, opp(s, o.id)) },
      { name: 'the sides, with the self-tape due', step: (s) => prepareAll(s, { opportunityId: o.id }) },
      { name: 'the self-tape', step: (s) => tape(s, opp(s, o.id)) },
      { name: 'casting deciding', step: (s) => toCasting(s, opp(s, o.id)) },
      {
        name: 'the offer standing in What Needs You',
        step: (s) => {
          expect(opp(s, o.id).status).toBe('offered');
          represent(s);
          const d = Object.values(s.universe.decisions).find((x) => x.refType === 'pro.offer' && x.refId === o.id && x.resolvedAt === undefined)!;
          s.must({ kind: 'world.take_decision_action', payload: { decisionId: d.id, actionIndex: 0 } });
          engagement = opp(s, o.id).engagementId!;
        },
      },
      { name: 'the work booked', step: (s) => played(s, eng(s, engagement).days[0]!.to + 60_000) },
      { name: 'the shoot between its days', step: (s) => played(s, eng(s, engagement).days.at(-1)!.to + 60_000) },
      { name: 'the payday to come', step: (s) => played(s, eng(s, engagement).pay[0]!.due + 60_000) },
      { name: 'the pay held in trust', step: (s) => played(s, eng(s, engagement).pay[0]!.inTrust!.releaseAt + MS_DAY) },
    ]);
    expect(checked).toHaveLength(9);
    // Once each: the work, the credit, the pay into trust and out of it, the commission taken.
    const e = eng(done, engagement);
    expect(e.status).toBe('finished');
    expect(e.log!.map((l) => l.status)).toEqual(['worked', 'worked']);
    expect(done.player.pro!.credits.filter((c) => c.engagementId === e.id)).toHaveLength(1);
    expect(e.pay).toHaveLength(1);
    const p = e.pay[0]!;
    expect(p.received).toMatchObject({ via: 'trust' });
    expect(p.received!.commission).toBe(Math.round(p.received!.gross * 0.1));
    expect(done.universe.transactions.filter((t) => t.id === p.inTrust!.txnId || t.id === p.received!.txnId)).toHaveLength(2);
    expect(done.universe.transactions.filter((t) => /Last Bus To Eastview/.test(t.memo))).toHaveLength(2);
  }, 240_000);

  it('PLAYER JOURNEY: an approach from his answer to the agreement standing, and the School’s follow-up after the showcase, saved and opened before each step, end as the life played straight through', () => {
    const seed = seedWhere('b20-saveload-agent', (d) => d(1, 'interest') < SURE.meet && d(1, 'offer') < SURE.offer);
    const { sim } = referredGraduate(seed);
    reel(sim);
    tended(sim, at(2026, 9, 4, 10));
    const stage = (s: Simulation) => relationOf(s.player, AGENT.id)!.stage;
    const { sim: done } = heldThrough(sim, [
      { name: 'the send', step: (s) => s.must({ kind: 'pro.send_materials', payload: {} }) },
      { name: 'his office’s answer to come', step: (s) => { tended(s, at(2026, 9, 18, 12)); expect(stage(s)).toBe('meeting'); } },
      { name: 'the meeting set', step: (s) => { tended(s, relationOf(s.player, AGENT.id)!.meeting!.at + 2 * 3_600_000); expect(stage(s)).toBe('deciding'); } },
      { name: 'the decision to come', step: (s) => { tended(s, at(2026, 9, 30, 12)); expect(stage(s)).toBe('offered'); } },
      { name: 'the agreement standing', step: (s) => s.must({ kind: 'pro.accept_agreement', payload: {} }) },
      { name: 'represented', step: (s) => tended(s, at(2026, 10, 30, 12)) },
    ]);
    expect(stage(done)).toBe('represented');
    expect(relationOf(done.player, AGENT.id)!.counts).toMatchObject({ sent: 1, 'meeting-set': 1, 'meeting-kept': 1, offer: 1, accepted: 1, represented: 1 });

    // The School's follow-up, on the calendar after the showcase (TEST SETUP: the showcase performed, as its system records it).
    const school = graduate('b20-saveload-follow-up');
    school.player.pro!.showcase = { term: 5, scenes: [], performed: [{ city: 'New York', at: school.now - 2 * MS_DAY, band: 'strong' }, { city: 'Los Angeles', at: school.now - MS_DAY, band: 'strong' }] };
    scheduleShowcaseFollowUp(school, school.player, school.now);
    const { sim: followed } = heldThrough(school, [{ name: 'the follow-up to come', step: (s) => tended(s, at(2026, 9, 7, 12)) }]);
    expect(followed.player.pro!.showcase!.followUp).toBeDefined();
    expect(followed.universe.notifications.filter((n) => n.title === 'The School’s Follow-Up After The Showcase')).toHaveLength(1);
  }, 240_000);
});
