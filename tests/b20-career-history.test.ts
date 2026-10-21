/**
 * Brief 20's D1 and D4 for the career: an opportunity offered again against what's already done
 * (`docs/verification/audit-2026-10-21/criteria.md` D1, D4, C1 and C2; the career area's report,
 * `docs/verification/audit-2026-10-21/areas/career/REPORT.md`). Played by the clock and the commands:
 * - a part posted to the actor and missed, passed on, declined or let lapse comes round again only once the work it was
 *   cast for is over, ten weeks or more on, as a new casting of the part that says what came of it the last time; until
 *   2026-10-21 it came at ten weeks whatever, a run's part in the middle of the run that had cast it, in the first
 *   posting's words (found by brief 19's app walk and left: Nell and Wren came round twice);
 * - a part booked, worked and credited never comes round again;
 * - an agreement declined or let lapse, offered again on a new approach, says so; until 2026-10-21 the second offer read
 *   word for word as the first.
 *
 * TEST SETUP, said where it's done: the graduate made by the School's own handlers brought forward (`graduate`); the body
 * tended as the clock moves; for the parts offered, a life at the top of every ability and technique and knowing the
 * projects' genres, so it's offered parts at all (`baseLife`, as tests/b20-career-skill.test.ts's, its seed one of that
 * file's fixed list whose life was offered the part: a success-path fixture); for the agreement, a finished job and its
 * referral, and a seed read from the game's own draw at his office (`seedWhere`), as tests/journey-agent.test.ts has it.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, formatDate } from '@/engine/core/time';
import { PROJECTS, projectById } from '@/engine/content/careerwork';
import { POSTING, againWords, datesOf } from '@/engine/systems/projobs';
import { relationOf } from '@/engine/systems/proagent';
import type { Opportunity } from '@/engine/systems/pro';
import { AGENT, SURE, at, eng, finishedJob, graduate, offeredPart, opp, played, portfolio, reel, referredGraduate, seedWhere, tended, twin } from './fakes/b20-career';

const zone = 'America/New_York';
/** The postings of one part, oldest first. */
const postingsOf = (sim: Simulation, projectId: string): Opportunity[] => sim.player.pro!.opportunities.filter((o) => o.projectId === projectId).sort((a, b) => a.postedAt - b.postedAt);

/** A life offered Jess in Static On Route 9 (seed b20-skill-0 of tests/b20-career-skill.test.ts's fixed list), at the offer. */
const offeredJess = () => offeredPart('b20-skill-0', 'route-nine');

describe('D4: a part posted again comes as a new casting, after the work it was cast for, and says what came of it before', () => {
  it('PLAYER JOURNEY: over seventy weeks unsigned, each part posted again comes ten weeks on or more and after the last day of the work its last posting cast, saying how that one ended', () => {
    const sim = graduate('b20-history-reposts');
    tended(sim, sim.now + 70 * 7 * MS_DAY);
    let again = 0;
    let stage = 0;
    for (const t of PROJECTS) {
      const list = postingsOf(sim, t.id);
      list.forEach((o, i) => {
        if (i === 0) { expect(o.again).toBeUndefined(); return; }
        const before = list[i - 1]!;
        again += 1;
        if (t.medium === 'stage') stage += 1;
        // Ten weeks on or more, and after the last day of the work the last posting cast.
        expect(o.postedAt - before.postedAt).toBeGreaterThanOrEqual(POSTING.againDays * MS_DAY);
        expect(o.postedAt).toBeGreaterThanOrEqual(datesOf(before).at(-1)!.to);
        // What came of it before, copied in, and said in its record and on its card.
        expect(o.again).toEqual({ postedAt: before.postedAt, status: before.status, outcome: before.outcome });
        expect(before.outcome).toBe(`Submissions for ${t.role.part} closed on ${formatDate(before.submitBy, zone)}.`);
        expect(o.history[0]!.words).toBe(`${t.casting.charAt(0).toUpperCase()}${t.casting.slice(1)} posted ${t.role.part} in ${t.project} again, a new casting of the part. The last time it was posted to you, on ${formatDate(before.postedAt, zone)}: ${before.outcome}`);
        expect(againWords(o)).toBe(`It’s a new casting of the part. The last time it was posted to you, on ${formatDate(before.postedAt, zone)}: ${before.outcome}`);
      });
    }
    expect(again).toBeGreaterThan(3);
    // A run's part among them: Hester Vane's run is nine weeks from its fifth, so the ten weeks alone would put the next
    // casting in the middle of the first.
    expect(stage).toBeGreaterThan(0);
    // Kept past the bounds: what the record trims, `lastPosted` still says.
    for (const t of PROJECTS) {
      const list = postingsOf(sim, t.id);
      if (list.length) expect(sim.player.pro!.lastPosted![t.id]).toMatchObject({ id: list.at(-1)!.id, postedAt: list.at(-1)!.postedAt });
    }
  }, 120_000);

  it('PLAYER JOURNEY: declined, the part comes round as a new casting that says so; let lapse, it says that; booked, worked and credited, it never comes round again', () => {
    const { sim, o } = offeredJess();
    const declined = twin(sim);
    const lapsed = twin(sim);
    const booked = twin(sim);
    declined.must({ kind: 'pro.decline_offer', payload: { opportunityId: o.id } });
    played(lapsed, opp(lapsed, o.id).offer!.until + 60_000);
    expect(opp(lapsed, o.id).status).toBe('lapsed');
    const id = booked.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
    // The shoot days gone to at their stops, as the top bar meets them.
    played(booked, eng(booked, id).days.at(-1)!.to + MS_DAY);
    for (const s of [declined, lapsed, booked]) tended(s, o.postedAt + 60 * 7 * MS_DAY);
    for (const [s, outcome] of [[declined, `You declined Jess in Static On Route 9.`], [lapsed, opp(lapsed, o.id).outcome!]] as const) {
      const next = postingsOf(s, 'route-nine').find((x) => x.postedAt > o.postedAt)!;
      expect(next).toBeDefined();
      expect(next.again).toEqual({ postedAt: o.postedAt, status: opp(s, o.id).status, outcome });
      expect(next.history[0]!.words).toContain(`posted Jess in Static On Route 9 again, a new casting of the part. The last time it was posted to you, on ${formatDate(o.postedAt, zone)}: ${outcome}`);
    }
    expect(opp(lapsed, o.id).outcome).toMatch(/^You didn’t answer the offer for Jess by .+, so it lapsed\.$/);
    // Booked: worked, credited, and never posted again in the sixty weeks, where the other two lives were.
    expect(eng(booked, id).status).toBe('finished');
    expect(booked.player.pro!.credits.map((c) => c.role)).toContain('Jess');
    expect(postingsOf(booked, 'route-nine').map((x) => x.id)).toEqual([o.id]);
  }, 120_000);

  it('PLAYER JOURNEY: a part posted again through him says so in his notice when he submits you for it', () => {
    // TEST SETUP: an agreement signed with him, as tests/pro-work.test.ts's J3 has one, and the headshots and résumé made.
    const sim = graduate('b20-history-agent');
    portfolio(sim);
    sim.player.pro!.agreements.push({ id: sim.nextId('pro'), agentId: AGENT.id, offeredAt: sim.now - MS_DAY, standsUntil: sim.now + 13 * MS_DAY, status: 'accepted', terms: [], signedAt: sim.now, endsAt: sim.now + 730 * MS_DAY });
    tended(sim, sim.now + 60 * 7 * MS_DAY);
    const again = sim.player.pro!.opportunities.filter((o) => o.via === 'agent' && o.again && o.sent);
    expect(again.length).toBeGreaterThan(0);
    for (const o of again) {
      const t = projectById(o.projectId)!;
      const said = sim.universe.notifications.filter((n) => n.title === `Submitted For ${t.role.part}` && n.at === o.history.find((h) => h.kind === 'submitted')!.at);
      expect(said.length).toBe(1);
      expect(said[0]!.body).toContain(againWords(o)!);
    }
  }, 120_000);
});

describe('D1: an agreement offered again says what came of the last one', () => {
  it('PLAYER JOURNEY: declined, then six months and a new credit on, his second offer says he offered one before and she declined it; let lapse, it says that', () => {
    const seed = seedWhere('b20-history-again', (d) => d(1, 'interest') < SURE.meet && d(1, 'offer') < SURE.offer && d(2, 'interest') < SURE.meet && d(2, 'offer') < SURE.offer);
    const offered = () => {
      const { sim } = referredGraduate(seed);
      reel(sim);
      tended(sim, at(2026, 9, 4, 10));
      sim.must({ kind: 'pro.send_materials', payload: {} });
      tended(sim, at(2026, 9, 30, 12));
      expect(relationOf(sim.player, AGENT.id)!.stage).toBe('offered');
      return sim;
    };
    const first = offered();
    const firstOffer = first.player.pro!.agreements[0]!;
    expect(first.universe.notifications.at(-1)!.title).toBe('Thomas Ashgrove Offered You Representation');
    const declined = twin(first);
    const lapsed = twin(first);
    declined.must({ kind: 'pro.decline_agreement', payload: {} });
    tended(lapsed, firstOffer.standsUntil + 60_000);
    expect(lapsed.player.pro!.agreements[0]!.status).toBe('lapsed');
    for (const [s, words] of [[declined, `He offered you one before, on ${formatDate(firstOffer.offeredAt, zone)}, and you declined it.`], [lapsed, `He offered you one before, on ${formatDate(firstOffer.offeredAt, zone)}, and you let it lapse.`]] as const) {
      // Six months on, something new (TEST SETUP: a second job finished, as the work loop leaves one) and the résumé
      // brought up to date: the next approach, through the same referral's route.
      tended(s, at(2027, 4, 16, 10));
      finishedJob(s, 'strong', 'winter-ledger-hester');
      s.must({ kind: 'pro.update_resume', payload: {} });
      s.must({ kind: 'pro.send_materials', payload: {} });
      tended(s, at(2027, 5, 15, 12));
      const rel = relationOf(s.player, AGENT.id)!;
      expect(rel.stage).toBe('offered');
      const second = s.player.pro!.agreements.at(-1)!;
      expect(second.id).not.toBe(firstOffer.id);
      const said = s.universe.notifications.filter((n) => n.title.startsWith('Thomas Ashgrove Offered You Representation'));
      expect(said.map((n) => n.title)).toEqual(['Thomas Ashgrove Offered You Representation', 'Thomas Ashgrove Offered You Representation Again']);
      expect(said[1]!.body).toContain(`an agreement for one year. ${words} Every term`);
      expect(rel.history.filter((e) => e.kind === 'offer').at(-1)!.words).toBe(`He offered you representation again: an agreement for one year, standing until ${formatDate(second.standsUntil, zone)}. ${words}`);
    }
  }, 120_000);
});
