/**
 * Brief 27, K7 (2026-10-25): the Actor Awards presented by SAG-AFTRA, by its 33rd Rules & Regulations (`b25-S48` in the
 * research register), loops 44 and 45: eligibility and placement each a rule's, said; submission by the actor through the
 * command, its fee paid and a second one returned, or by the production at the window's close by its draw; the nominating
 * committees' five, ties at the line and one performance an actor; the final vote; the show; and what a nomination leaves:
 * the résumé's line and visibility.
 *
 * PLAYER JOURNEYS: a graduate's Desk Clerk on The Calloway Files (tests/fakes/b27-awards.ts), played by the clock and due out
 * in February 2027, so in the 34th Actor Awards, the 33rd's rules carried forward; then the clock, unplayed, to each step.
 * Each save is one whose own draws give its case (`b27-aa-8`: nominated and losing, its production not submitting;
 * `b27-aa-55`: its production submitting), found by reading the draws, never forced. TEST SETUP, said where it's done: a
 * finished job and its release, as the work loop leaves them, for the rules' cases the clock wouldn't reach in a test.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { PROJECTS, addProjects } from '@/engine/content/careerwork';
import { ACTOR_AWARDS_33, ACTOR_RULES, actorEdition, institutionById } from '@/engine/content/awards';
import { honorsOf } from '@/engine/systems/pro';
import { VISIBILITY, visibilityOf } from '@/engine/systems/awards';
import {
  actorCheck, actorEligibleWords, actorNominees, actorProductionSubmits, actorSubmitRefusal, nominationsAt, showAt, submissionsClose, submissionsOpen,
} from '@/engine/systems/actorawards';
import { formatOf, voiceOnly } from '@/engine/systems/workflow';
import { finishedJob } from './fakes/b20-career';
import { graduate, notices } from './fakes/career-world';
import { CLERK, ED, SHOW, clerk, toNominations } from './fakes/b27-awards';

const LA = 'America/Los_Angeles';

describe('the Actor Awards', () => {
  it('keep the 33rd’s calendar as read and carry it forward a year at a time, said so', () => {
    expect(actorEdition(2026)).toBe(ACTOR_AWARDS_33);
    expect([ACTOR_AWARDS_33.submissions, ACTOR_AWARDS_33.nominationsAnnounced, ACTOR_AWARDS_33.finalCloses, ACTOR_AWARDS_33.ceremony]).toEqual([{ opens: '2026-08-24', closes: '2026-11-02' }, '2027-01-06', '2027-02-26', '2027-02-28']);
    expect(ED).toEqual({ number: 34, year: 2027, projected: true, submissions: { opens: '2027-08-24', closes: '2027-11-02' }, nominationsAnnounced: '2028-01-06', finalCloses: '2028-02-26', ceremony: '2028-02-28' });
    expect(submissionsClose(ACTOR_AWARDS_33)).toBe(instantFromZoned({ year: 2026, month: 11, day: 2, hour: 17, minute: 0 }, LA));
    expect(showAt(ACTOR_AWARDS_33)).toBe(instantFromZoned({ year: 2027, month: 2, day: 28, hour: 17, minute: 0 }, LA));
    expect(institutionById('actor-awards').coverage).toBe('enforced');
  });

  it('places a performance by the rules, and refuses what they refuse, each in its own words', () => {
    const sim = graduate('b27-aa-rules');
    const seen = new Set<string>();
    for (const t of PROJECTS.filter((p) => p.medium !== 'stage')) {
      // TEST SETUP: a finished job in the project, its credit released in 2026, as the work loop leaves them.
      const e = finishedJob(sim, 'strong', t.id);
      const c = sim.player.pro!.credits.find((x) => x.engagementId === e.id) ?? sim.player.pro!.credits.at(-1)!;
      Object.assign(c, { engagementId: e.id, releasedAt: instantFromZoned({ year: 2026, month: 6, day: 1, hour: 12, minute: 0 }, 'America/New_York') });
      const check = actorCheck(sim, sim.player, c);
      const flow = formatOf(t).workflow;
      if (t.union !== 'sag-aftra') expect(check.eligible, t.id).toBe(false);
      else if (flow === 'narration' || flow === 'reenactment' || flow === 'dubbing') expect(check.eligible, t.id).toBe(false);
      else if (t.medium === 'television' && voiceOnly(t)) expect(check).toEqual(expect.objectContaining({ eligible: false, why: expect.stringContaining('animated series') }));
      if (check.eligible) {
        expect(check.year).toBe(2026);
        seen.add(check.category);
        if (t.medium === 'film') expect(check.category).toBe(t.role.size === 'lead' ? 'film-lead' : 'film-supporting');
        expect(actorEligibleWords(sim.player, check)).toContain('at the 33rd Actor Awards. Submissions are open from August 24, 2026 to November 2, 2026, at 5 PM Pacific.');
        // The window in the clock's tense (brief 27's F): ahead, open, and gone.
        const ed = actorEdition(2026);
        expect([submissionsOpen(ed) - 1, submissionsOpen(ed), submissionsClose(ed) + 1].map((at) => actorEligibleWords(sim.player, check, at).match(/Submissions (\w+ ?\w*) from/)![1])).toEqual(['open', 'are open', 'were open']);
      } else expect(check.why.length).toBeGreaterThan(20);
    }
    expect(seen.has('tv-drama')).toBe(true);
    // A film's place: sent to streaming instead of cinemas, no run; not out yet, no year.
    const film = PROJECTS.find((t) => t.medium === 'film' && t.union === 'sag-aftra' && formatOf(t).after === 'theatrical' && !voiceOnly(t))!;
    const e = finishedJob(sim, 'strong', film.id);
    const c = sim.player.pro!.credits.at(-1)!;
    Object.assign(c, { engagementId: e.id, releasedAt: instantFromZoned({ year: 2026, month: 6, day: 1, hour: 12, minute: 0 }, 'America/New_York') });
    expect(actorCheck(sim, sim.player, c).eligible).toBe(true);
    c.release = { kind: 'streaming' };
    expect(actorCheck(sim, sim.player, c)).toEqual(expect.objectContaining({ eligible: false, why: 'A motion picture needs a seven-day paid run in cinemas in one of six major markets, and this one was sent to streaming instead.' }));
    delete c.release;
    delete c.releasedAt;
    expect(actorCheck(sim, sim.player, c)).toEqual(expect.objectContaining({ eligible: false, why: expect.stringContaining('no release on the calendar yet') }));
    // The falsifiability test: the same film made outside SAG-AFTRA's agreements, in the US and abroad. TEST SETUP: the
    // template registered as the slate's parts are, a finished job in it, and its release as the work loop leaves one.
    for (const [id, place, why] of [['test-aa-nonunion', film.place, 'The Actor Awards take productions signatory to a SAG-AFTRA agreement, and this one isn’t.'], ['test-aa-abroad', { ...film.place, cityId: 'uk-eng-london', city: 'London' }, 'It was made outside the US under another union’s agreement: SAG-AFTRA decides whether it covers a member’s work there, and the game doesn’t decide it.']] as const) {
      addProjects([{ ...film, id, union: 'none', place }]);
      const x = finishedJob(sim, 'strong', id);
      const xc = sim.player.pro!.credits.at(-1)!;
      Object.assign(xc, { engagementId: x.id, releasedAt: instantFromZoned({ year: 2026, month: 6, day: 1, hour: 12, minute: 0 }, 'America/New_York') });
      expect(actorCheck(sim, sim.player, xc)).toEqual({ eligible: false, why, year: 2026 });
    }
    // A credit whose part the record no longer holds says when its year was (brief 27's F), read from the credit: TEST
    // SETUP, its engagement gone, as the record's bound lets one go. Before the 33rd's window closes, and after.
    const was = sim.player.pro!.credits.find((x) => actorCheck(sim, sim.player, x).eligible)!;
    sim.player.pro!.engagements = sim.player.pro!.engagements.filter((x) => x.id !== was.engagementId);
    expect(actorCheck(sim, sim.player, was)).toEqual({ eligible: false, why: 'Its part is no longer on your record, so it can’t be submitted.' });
    sim.advanceTo(submissionsClose(ACTOR_AWARDS_33) + MS_HOUR);
    expect(actorCheck(sim, sim.player, was)).toEqual({ eligible: false, why: 'It was first shown in 2026, for the 33rd Actor Awards, whose submissions closed on November 2, 2026.' });
  });

  it('nominates the five with the most votes, every tie at the line too, and of one actor’s performances in a category only the one with more', () => {
    const others = Array.from({ length: 8 }, (_, k) => ({ id: `o${k}`, votes: 700 - k * 10 }));
    expect(actorNominees(others)).toEqual(['o0', 'o1', 'o2', 'o3', 'o4']);
    // A tie at the fifth: both nominated.
    expect(actorNominees([...others, { id: 'tie', votes: 660 }])).toEqual(['o0', 'o1', 'o2', 'o3', 'o4', 'tie']);
    // Two performances of the player's above the line: only the higher, and the next performance takes the other's place.
    expect(actorNominees([...others, { id: 'you:a', votes: 800 }, { id: 'you:b', votes: 790 }])).toEqual(['you:a', 'o0', 'o1', 'o2', 'o3']);
    expect(ACTOR_RULES.nominees).toBe(5);
  });

  it('PLAYER JOURNEY: submitted through the command, the fee paid and a second refused; nominated by the committees; the show’s result; the résumé’s line and visibility', () => {
    const { sim, c } = clerk('b27-aa-8');
    expect(['strong', 'exceptional']).toContain(c.band);
    const check = actorCheck(sim, sim.player, c);
    expect(check).toEqual({ eligible: true, year: 2027, category: 'tv-drama' });
    expect(actorSubmitRefusal(sim, sim.player, c.id)).toBe('Submissions open on August 24, 2027, for the 34th Actor Awards, on the 33rd’s rules carried forward.');
    sim.advanceTo(submissionsOpen(ED) + MS_HOUR);
    const ledger = sim.universe.transactions.length;
    const r = sim.must<{ entryId: string; fee: number }>({ kind: 'pro.actor_submit', payload: { creditId: c.id } });
    expect(JSON.stringify(sim.universe.transactions.slice(ledger))).toContain('Actor Awards submission: Desk Clerk, The Calloway Files');
    const g = sim.player.pro!.guild!.find((x) => x.id === r.entryId)!;
    expect([g.state, g.submittedBy, g.fee]).toEqual(['submitted', 'you', ACTOR_RULES.fee]);
    expect(actorSubmitRefusal(sim, sim.player, c.id)).toContain('a second submission for the same performance is returned');
    toNominations(sim);
    expect(g.state).toBe('nominated');
    expect(g.field!.nominees).toContain(`you:${c.id}`);
    expect(g.field!.nominees.length).toBeGreaterThanOrEqual(5);
    expect(notices(sim).some((n) => n.startsWith('You’re Nominated For An Actor Award | ') && n.includes('Outstanding Performance by a Female Actor in a Drama Series at the 34th Actor Awards'))).toBe(true);
    // A nomination is on the résumé's lines to come, and casting sees it.
    expect(honorsOf(sim.player).some((h) => h.line === `Actor Awards nomination: Outstanding Performance by a Female Actor in a Drama Series, for Desk Clerk in The Calloway Files, 2028`)).toBe(true);
    // Its own share: the rise at its morning, the Desk Clerk's Emmy year counted on both sides.
    expect(visibilityOf(sim.player, sim.now) - visibilityOf(sim.player, nominationsAt(ED) - MS_HOUR)).toBeCloseTo(VISIBILITY.nominated, 2);
    sim.advanceTo(SHOW + MS_HOUR);
    expect(g.state).toBe('lost');
    expect(notices(sim).some((n) => n.startsWith('The Actor Awards Tonight | '))).toBe(true);
  }, 300_000);

  it('PLAYER JOURNEY: the falsifiability twin, the same performance not submitted, its production’s draw saying no: never in the field', () => {
    const { sim, c } = clerk('b27-aa-8');
    expect(actorProductionSubmits(sim, 2027, c.project, c.role, true)).toBe(false);
    sim.advanceTo(submissionsClose(ED) + MS_HOUR);
    const g = sim.player.pro!.guild!.find((x) => x.creditId === c.id)!;
    expect(g.state).toBe('not-submitted');
    toNominations(sim);
    expect([g.state, g.field]).toEqual(['not-submitted', undefined]);
    expect(visibilityOf(sim.player, sim.now) - visibilityOf(sim.player, nominationsAt(ED) - MS_HOUR)).toBeCloseTo(0, 2);
    expect(actorSubmitRefusal(sim, sim.player, c.id)).toContain('closed on November 2, 2027 at 5 PM Pacific');
  }, 300_000);

  it('PLAYER JOURNEY: a production submits a performance the player didn’t, where its draw says so', () => {
    const { sim, c } = clerk('b27-aa-55');
    expect(actorProductionSubmits(sim, 2027, c.project, c.role, true)).toBe(true);
    sim.advanceTo(submissionsClose(ED) + MS_HOUR);
    const g = sim.player.pro!.guild!.find((x) => x.creditId === c.id)!;
    expect([g.state, g.submittedBy, g.fee]).toEqual(['submitted', 'production', undefined]);
    expect(notices(sim).some((n) => n.startsWith('The Calloway Files Submitted You For The Actor Awards | '))).toBe(true);
    expect(nominationsAt(ED)).toBeGreaterThan(submissionsOpen(ED) + 100 * MS_DAY);
    expect(CLERK.series).toBe('calloway-files');
  }, 300_000);
});
