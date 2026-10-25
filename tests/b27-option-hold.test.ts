/**
 * Brief 27, the series, releases and market cluster (2026-10-25): loop 20's "A hold or option begins → record its scope,
 * dates, and terms → show how it affects availability → a conflicting opportunity arrives → evaluate permitted responses
 * → release, exercise, negotiate, or decline according to the arrangement" (`systems/continuity.ts`). Held here: an open
 * option on a recurring part holding the next season's guaranteed episodes; an offer on those days saying so before it's
 * accepted, with what giving the option up costs; Ask To Be Released and its refusals' words; the production's answer the
 * next afternoon, granted or refused by its draw; accepted after a release, nothing given up; accepted without one, the
 * option given up, the part in that season posted to the actor no more and the casting office offering nothing without an
 * audition; declined, the option standing to its last day. Each branch a fork of one played save. From the review of
 * 2026-10-25: a second offer on the option's days while an ask is pending on another says so, as the ask's refusal does,
 * and a release granted after the offer was declined says there's nothing left to accept.
 *
 * PLAYER JOURNEYS: a graduate's Assistant DA Whitlock on The Calloway Files in its 2026 season, the offer accepted through
 * the command and played by the clock into June 2027, the option open; then an offer on the option's days, and the
 * player's answer through the commands. TEST SETUP, said where it's done: SAG-AFTRA membership, as
 * tests/b27-revival.test.ts sets it; the offers on the record as casting's draws would leave them; an agent representing
 * the actor, so the part, cast through agents, could reach them; and the part's days and credit judged Strong, as a judge
 * would have left them, where the production's wish for the actor is read.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR, dateKey } from '@/engine/core/time';
import { addProjects, projectById, type ProjectTemplate } from '@/engine/content/careerwork';
import { SERIES } from '@/engine/content/series';
import { productionsOf } from '@/engine/systems/slate';
import { ensurePro, type Engagement, type Opportunity } from '@/engine/systems/pro';
import { clauseOf } from '@/engine/systems/contracts';
import { DIRECT, acceptRefusal, acceptWarning, datesOf, directOfferFor, payTermsOf, postingTimes, postingsAt, spansOf, travels, writtenFor } from '@/engine/systems/projobs';
import { OPTION_RELEASE, gaveUpWith, heldOptions, optionDays, optionReleaseRefusal, releaseAnswerAt, releaseChance, releaseGranted } from '@/engine/systems/continuity';
import type { Simulation } from '@/engine/core/simulation';
import { at, graduate, notices, played, reload } from './fakes/career-world';
import { represent } from './fakes/b20-career';
import { offered } from './fakes/b27-series';

const CALLOWAY = SERIES[0]!;
const WHITLOCK = projectById('calloway-files-whitlock')!;
const WEEK = 7 * MS_DAY;

/** Whitlock accepted for the 2026 season and played into June 2027, its option on the 2027 season open. */
function heldSave(seed: string): { sim: Simulation; e: Engagement } {
  const sim = graduate(seed);
  // TEST SETUP: SAG-AFTRA membership, as tests/b27-revival.test.ts sets it.
  ensurePro(sim, sim.player).sag = { eligibleSince: sim.now - 60 * MS_DAY, memberSince: sim.now - 30 * MS_DAY };
  const o = offered(sim, WHITLOCK, at(2026, 9, 7));
  const id = sim.must<{ engagementId: string }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).engagementId;
  const e = sim.player.pro!.engagements.find((x) => x.id === id)!;
  played(sim, at(2027, 6, 1));
  expect(clauseOf(e.contract, 'option')).toMatchObject({ year: 2027, status: 'open' });
  // TEST SETUP: the days judged Strong, as a judge would have left them, so the production wants the actor back.
  for (const l of e.log ?? []) if (l.status === 'worked') l.band = 'strong';
  return { sim, e };
}

/** The June 2027 slate parts near home whose days fall on the option's, each with the Monday it's posted. */
function conflicting(sim: Simulation, e: Engagement): { t: ProjectTemplate; week: number }[] {
  const held = optionDays(WHITLOCK, clauseOf(e.contract, 'option')!);
  const out: { t: ProjectTemplate; week: number }[] = [];
  for (const week of postingTimes(at(2027, 6, 1), at(2027, 7, 6))) for (const p of productionsOf(sim, week)) for (const t of p.parts) {
    if (travels(sim.player, t) || !writtenFor(t, sim.player) || t.slate!.fate.kind !== 'made') continue;
    addProjects([t]);
    if (payTermsOf({ projectId: t.id, postedAt: week }).each === undefined) continue;
    const days = datesOf({ projectId: t.id, postedAt: week });
    if (days.some((d) => held.some((h) => d.from < h.to && d.to > h.from))) out.push({ t, week });
  }
  return out;
}

/** TEST SETUP: an offer on the option's days whose production's answer to Ask To Be Released would be `want`, or none. */
function offerAnswered(sim: Simulation, e: Engagement, want: boolean): Opportunity {
  for (const { t, week } of conflicting(sim, e)) {
    const o = offered(sim, t, week);
    if (!acceptRefusal(sim, sim.player, o) && releaseGranted(sim, e, o.id) === want) return o;
    o.status = 'withdrawn';
  }
  throw new Error(`no offer answered ${want}`);
}

describe('an option’s hold on the actor’s dates', () => {
  it('PLAYER JOURNEY: holds the next season’s guaranteed episodes, says so on an offer on those days, and asks the player to choose: released, refused, given up or declined', () => {
    const { sim, e } = heldSave('b27-option-hold');
    const option = clauseOf(e.contract, 'option')!;
    const held = optionDays(WHITLOCK, option);
    expect(held.length).toBe(2 * CALLOWAY.daysEach);
    // An offer on days the option doesn't hold says nothing of it, and has nothing to ask.
    const clear = offered(sim, projectById('eastview')!, at(2027, 6, 1));
    expect(heldOptions(sim.player, spansOf(sim.player, projectById('eastview')!, datesOf(clear)))).toEqual([]);
    expect(optionReleaseRefusal(sim, sim.player, clear)).toBe('No production holds an option on you on any of this offer’s days.');
    clear.status = 'withdrawn';

    // Asked and released: accepted with nothing given up, and the part can still come through a new casting.
    const released = reload(sim);
    const er = released.player.pro!.engagements.find((x) => x.id === e.id)!;
    const o1 = offerAnswered(released, er, true);
    const t1 = projectById(o1.projectId)!;
    const warning = acceptWarning(released, released.player, o1)!;
    expect(warning).toContain(`Bright Harbor Television holds an option on you as Assistant DA Whitlock for the season of The Calloway Files that begins in 2027, and its guaranteed episodes fall on some of the same days`);
    expect(warning).toContain('Accepting this gives the option up: the part in that season goes to another actor, and Kettering Casting won’t offer you a part without an audition again. Ask To Be Released, on this offer, asks Bright Harbor Television to let you go first.');
    expect(optionReleaseRefusal(released, released.player, o1)).toBeUndefined();
    const asked = released.must<{ answerAt: number }>({ kind: 'pro.ask_option_release', payload: { opportunityId: o1.id } });
    expect(asked.answerAt).toBe(releaseAnswerAt(released.now));
    expect(optionReleaseRefusal(released, released.player, o1)).toMatch(/^You’ve asked; Bright Harbor Television answers on /);
    expect(released.execute({ kind: 'pro.ask_option_release', payload: { opportunityId: o1.id } }).error).toMatch(/^You’ve asked;/);
    // A second offer on the option's days, while the ask on the first is pending, says so as the ask's refusal does.
    const second = conflicting(released, er).find(({ t }) => t.id !== t1.id)!;
    const o1b = offered(released, second.t, second.week);
    expect(acceptWarning(released, released.player, o1b)).toMatch(/You’ve asked Bright Harbor Television to release you, over another offer; the answer comes on /);
    expect(acceptWarning(released, released.player, o1b)).not.toContain('Ask To Be Released, on this offer');
    expect(optionReleaseRefusal(released, released.player, o1b)).toMatch(/^You’ve asked; Bright Harbor Television answers on /);
    o1b.status = 'withdrawn';
    released.advanceTo(asked.answerAt + MS_HOUR);
    const r1 = clauseOf(er.contract, 'option')!;
    expect(r1).toMatchObject({ status: 'expired', release: { answer: 'granted' } });
    expect(notices(released).some((n) => n.startsWith('Released From The Option On Assistant DA Whitlock | Bright Harbor Television released you from its option'))).toBe(true);
    expect(acceptWarning(released, released.player, o1) ?? '').not.toContain('holds an option on you');
    released.must({ kind: 'pro.accept_offer', payload: { opportunityId: o1.id } });
    expect(r1.settled!.why).toBe('Bright Harbor Television released you from its option as Assistant DA Whitlock, at your asking.');
    expect(gaveUpWith(released.player, WHITLOCK.casting)).toBe(false);

    // Asked and refused: the option stands, the warning says so; accepted anyway, it's given up.
    const refused = reload(sim);
    const ef = refused.player.pro!.engagements.find((x) => x.id === e.id)!;
    const o2 = offerAnswered(refused, ef, false);
    const a2 = refused.must<{ answerAt: number }>({ kind: 'pro.ask_option_release', payload: { opportunityId: o2.id } });
    refused.advanceTo(a2.answerAt + MS_HOUR);
    expect(clauseOf(ef.contract, 'option')).toMatchObject({ status: 'open', release: { answer: 'refused' } });
    expect(notices(refused).some((n) => n.startsWith('The Option On Assistant DA Whitlock Stands | Bright Harbor Television won’t release you from its option'))).toBe(true);
    expect(acceptWarning(refused, refused.player, o2)).toContain('Bright Harbor Television refused to release you from it.');
    expect(optionReleaseRefusal(refused, refused.player, o2)).toMatch(/^Bright Harbor Television refused on .*: the option stands\. Decline the offer, or accept it and give the option up\.$/);

    // Accepted without a release (the refused fork goes on, and the falsifiability twin of the released one): given up.
    refused.must({ kind: 'pro.accept_offer', payload: { opportunityId: o2.id } });
    const gone = clauseOf(ef.contract, 'option')!;
    expect(gone.status).toBe('expired');
    expect(refused.player.pro!.optionsGivenUp).toEqual([expect.objectContaining({ casting: WHITLOCK.casting, seriesId: CALLOWAY.id, part: WHITLOCK.role.part, year: 2027 })]);
    expect(gone.settled!.why).toBe(`You took ${projectById(o2.projectId)!.role.part} in ${projectById(o2.projectId)!.project} on days the option held, so you gave it up.`);
    expect(notices(refused).some((n) => n.startsWith('You Gave Up The Option On Assistant DA Whitlock | '))).toBe(true);
    expect(gaveUpWith(refused.player, WHITLOCK.casting)).toBe(true);
    // The part in that season is another actor's: never posted to the actor in it, where the released fork's is.
    represent(refused);
    represent(released);
    const mondays = postingTimes(at(2027, 6, 7), at(2028, 3, 1));
    const posted = (s: Simulation) => mondays.filter((m) => postingsAt(s, s.player, m).some((p) => p.project.id === WHITLOCK.id)).length;
    expect(posted(refused)).toBe(0);
    expect(posted(released)).toBeGreaterThan(0);
    // And its casting office offers nothing without an audition: TEST SETUP, the work judged Strong and a slate part of its.
    for (const s of [released, refused]) { const c = s.player.pro!.credits.find((x) => x.engagementId === e.id); if (c) c.band = 'strong'; }
    const slate = { ...t1, id: `${t1.id}.kettering`, casting: WHITLOCK.casting, role: { ...t1.role, size: 'supporting' as const } };
    addProjects([slate]);
    const when = [...Array(60).keys()].map((k) => at(2027, 9, 6) + k * WEEK).find((m) => released.rng('pro.direct', dateKey(m, 'America/New_York'), slate.id).next() < DIRECT.chance)!;
    expect(directOfferFor(released, released.player, slate, when)).toBeDefined();
    expect(directOfferFor(refused, refused.player, slate, when)).toBeUndefined();

    // Asked, then declined before the answer: the release, granted, says there's nothing left to accept.
    const late = reload(sim);
    const el = late.player.pro!.engagements.find((x) => x.id === e.id)!;
    const o4 = offerAnswered(late, el, true);
    const a4 = late.must<{ answerAt: number }>({ kind: 'pro.ask_option_release', payload: { opportunityId: o4.id } });
    late.must({ kind: 'pro.decline_offer', payload: { opportunityId: o4.id } });
    late.advanceTo(a4.answerAt + MS_HOUR);
    const part4 = projectById(o4.projectId)!.role.part;
    expect(notices(late).some((n) => n.startsWith(`Released From The Option On Assistant DA Whitlock | Bright Harbor Television released you from its option as Assistant DA Whitlock. The offer for ${part4} isn’t standing any more, and nothing holds those days now,`))).toBe(true);
    expect(notices(late).some((n) => n.includes(`You can accept the offer for ${part4}`))).toBe(false);

    // Declined: the option stands to its last day, and the production decides then as it would have.
    const declined = reload(sim);
    const ed = declined.player.pro!.engagements.find((x) => x.id === e.id)!;
    const o3 = offerAnswered(declined, ed, true);
    declined.must({ kind: 'pro.decline_offer', payload: { opportunityId: o3.id } });
    expect(clauseOf(ed.contract, 'option')!.status).toBe('open');
    declined.advanceTo(option.by + MS_HOUR);
    expect(clauseOf(ed.contract, 'option')!.status).not.toBe('open');
    expect(clauseOf(ed.contract, 'option')!.settled!.why).not.toContain('you gave it up');
    expect(declined.player.pro!.optionsGivenUp ?? []).toEqual([]);
  }, 900_000);

  it('refuses an ask the production couldn’t answer before the offer lapses', () => {
    const { sim, e } = heldSave('b27-option-hold-lapse');
    const o = offerAnswered(sim, e, true);
    o.offer!.until = sim.now + 2 * MS_HOUR;
    expect(optionReleaseRefusal(sim, sim.player, o)).toMatch(/^The offer lapses on .* before Bright Harbor Television could answer, so it’s a choice between them now\.$/);
    expect(sim.execute({ kind: 'pro.ask_option_release', payload: { opportunityId: 'none' } }).error).toBe('There’s no offer standing to weigh against an option.');
    // How much the production wants the actor back is read: work judged Exceptional is let go less often than Working work,
    // each within the answer's bounds.
    const judged = (band: 'exceptional' | 'working'): Engagement => ({ ...e, log: e.log!.map((l) => (l.band ? { ...l, band } : l)) });
    expect(releaseChance(judged('exceptional'))).toBeLessThan(releaseChance(judged('working')));
    for (const band of ['exceptional', 'working'] as const) expect(releaseChance(judged(band))).toBeGreaterThanOrEqual(OPTION_RELEASE.least);
  }, 900_000);
});
