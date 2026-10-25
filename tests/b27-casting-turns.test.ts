/**
 * Brief 27, offers and auditions (2026-10-25): what casting does between the posting and the booking, beyond its own
 * draws. The supplement's loop 10 ("An attached performer may be affected by ... Conditional offers ... Changed role
 * requirements"), loop 19 ("If the agreement is conditional: keep that condition visible → do not treat uncertain work as
 * guaranteed income → resolve the condition at the appropriate time"), Area B ("Recasting where justified"), and loop 14
 * ("Support justified rescheduling and withdrawal. Late arrival, absence, document problems, or conflicts must produce
 * appropriate outcomes, not a universal arbitrary penalty"). Held here: a lead offered on condition of its last round,
 * held and not booked, booked or fallen away by that round; a part whose requirement changes at the cut releasing the actor
 * who no longer fits and keeping the one who does; a part lost and recast, posted again and decided afresh; a withdrawal
 * with notice costing nothing where a no-show is remembered by the office, in its cuts and its direct offers, and an illness
 * isn't; a chemistry read asked to move, granted or not by the production, more often with a clash to give.
 *
 * PLAYER JOURNEYS: a graduate played by the clock and the commands a player sends (tests/fakes/career-world.ts); TEST
 * SETUP, said where it's done: a finished job and its credit (`finishedJob`), the actor's levels (`setSkill`), the rounds
 * before the one a journey is about on the record as casting would leave them, its item on the clock, and a stay in
 * hospital. Every draw is read as the game reads it, never forced.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR, addDays, formatTime, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { ProjectTemplate } from '@/engine/content/careerwork';
import { keepProject, productionsOf, slatePartsAt } from '@/engine/systems/slate';
import type { AuditionRound, Opportunity } from '@/engine/systems/pro';
import {
  AUDITION_KIND, CASTING, CASTING_KIND, HOLD, OFFER_KIND, WORK, askedAmount, castingDraw, chanceOf, fitOf, datesOf, directOfferFor, eligibilityProblems, moveRefusal, payTermsOf, postingTimes, postingsAt, roundsOf, spansOf, travels, tripMinutes, writtenFor,
} from '@/engine/systems/projobs';
import {
  CONDITIONAL, NOTICE, RECAST, RESCHEDULE, castingLift, conditionalOfferFor, recastDrawn, rememberedWords, remembers, rescheduleAskWords, rescheduleChance, rescheduleRefusal, rescheduleWords, rewriteDrawn, withdrawWarning,
} from '@/engine/systems/offers';
import { MS_DAY as DAY } from '@/engine/core/time';
import { graduate, notices, played, portfolio, reload, tend } from './fakes/career-world';
import { genreState } from '@/engine/systems/engagement';
import { finishedJob, represent, setSkill } from './fakes/b20-career';

const WEEK = 7 * MS_DAY;
const NY = 'America/New_York';
type Sim = ReturnType<typeof graduate>;
const opp = (sim: Sim, id: string): Opportunity => sim.player.pro!.opportunities.find((o) => o.id === id)!;

function weekdayAt(sim: Sim, days: number, hour: number): number {
  let d = addDays(sim.now, days, NY);
  while ([0, 6].includes(zonedParts(d, NY).weekday)) d = addDays(d, 1, NY);
  const p = zonedParts(d, NY);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0 }, NY);
}

/** Whether the actor plays the part's ages, as casting reads them (`CASTING.playingSpread`). */
const plays = (sim: Sim, t: ProjectTemplate, at: number): boolean => {
  const age = Math.floor((at - sim.player.birthInstant) / (365.2425 * DAY));
  return age + CASTING.playingSpread >= t.requirements.ages[0] && age - CASTING.playingSpread <= t.requirements.ages[1];
};

/** Slate parts near New Haven written for the actor, of an age they play, posted from a week on, matching. */
function* near(sim: Sim, pick: (t: ProjectTemplate, week: number) => boolean): Generator<{ t: ProjectTemplate; week: number }> {
  for (let w = 1; w < 200; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
      if (travels(sim.player, t) || !writtenFor(t, sim.player) || !plays(sim, t, week)) continue;
      keepProject(sim.player, t);
      if (pick(t, week)) yield { t, week };
    }
  }
}
const first = (sim: Sim, pick: (t: ProjectTemplate, week: number) => boolean) => { const x = near(sim, pick).next(); if (x.done) throw new Error('no such part'); return x.value; };

/** TEST SETUP: the rounds before `round` on the record as done and judged Strong, `round` set on a weekday ahead, its item on the clock. */
function atRoundOf(sim: Sim, t: ProjectTemplate, week: number, round: AuditionRound['round'], days = 3): Opportunity {
  const all = roundsOf(t);
  const before = all.slice(0, all.indexOf(round));
  const rounds: AuditionRound[] = before.map((x, i) => ({ round: x, form: x === 'audition' ? t.stages.audition : 'in-person', at: sim.now - (before.length - i) * MS_DAY, status: 'done', band: 'strong', overall: 70, casting: { at: sim.now - MS_DAY, chance: 0.7, fit: 0.5, yes: true } }));
  const at = weekdayAt(sim, days, 13);
  rounds.push({ round, form: round === 'audition' ? t.stages.audition : 'in-person', at, status: 'set' });
  const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: round === 'audition' ? 'audition' : 'callback', postedAt: week, submitBy: week + WEEK, history: [], counts: {}, rounds };
  sim.player.pro!.opportunities.push(o);
  sim.schedule({ at, kind: AUDITION_KIND, label: `${round}: ${t.role.part}`, category: 'career', priority: 40, requiresPlayer: true, durationMinutes: 30, travelMinutes: tripMinutes(sim.player.currentLocationId, t.place.cityId), locationId: t.place.cityId, refType: 'pro.opportunity', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id, round: rounds.length - 1 } });
  return o;
}

/** TEST SETUP: the audition on the record as done and judged Strong, and casting's word on it on the clock an hour on (`b27-holds`'s `atTheCut`). */
function atTheCut(sim: Sim, t: ProjectTemplate, week: number): Opportunity {
  const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'audition', postedAt: week, submitBy: week + WEEK, history: [], counts: {}, rounds: [{ round: 'audition', form: t.stages.audition, at: sim.now - MS_DAY, status: 'done', band: 'strong', overall: 70 }] };
  sim.player.pro!.opportunities.push(o);
  sim.schedule({ at: sim.now + MS_HOUR, kind: CASTING_KIND, label: `Casting Decides: ${t.role.part}`, category: 'career', priority: 40, refType: 'pro.opportunity', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id, round: 0 } });
  return o;
}

describe('an offer on condition', () => {
  it('PLAYER JOURNEY: a lead from an office that cast the actor before comes on condition of its last round; accepted, the dates are held and nothing is booked; the round decides, booked for the actor whose round goes well and fallen away for the twin whose doesn’t', () => {
    // A life whose slate brings such a lead by a Monday's postings, read as the game reads them, and whose condition's draw
    // falls between the weakest band's chance and the strongest's.
    let fixture: { base: Sim; t: ProjectTemplate; at: number } | undefined;
    for (let n = 0; n < 8 && !fixture; n += 1) {
      const base = graduate(`b27-conditional-${n}`);
      // TEST SETUP: an agent, through whom a lead in screen work reaches the actor (its office takes agents' submissions).
      represent(base);
      const lead = near(base, (t) => t.role.size === 'lead' && !!(t.stages.chemistry || t.stages.test) && t.slate!.fate.kind === 'made').next();
      if (lead.done) continue;
      const office = lead.value.t.casting;
      // TEST SETUP: three finished jobs, one for that office judged Strong, so a lead reaches the actor (`slateReach`).
      const was = first(base, (t) => t.casting === office && t.role.size !== 'lead');
      finishedJob(base, 'strong', was.t.id);
      for (const x of near(base, (t) => t.casting !== office && t.role.size !== 'lead')) { finishedJob(base, 'working', x.t.id); if (base.player.pro!.credits.length >= 3) break; }
      for (const at of postingTimes(base.now, base.now + 150 * WEEK)) {
        const hit = postingsAt(base, base.player, at).find((x) => x.project.casting === office && conditionalOfferFor(base, base.player, x.project, at));
        if (!hit) continue;
        const u = base.rng('pro.conditional', hit.project.id, at, 'met').next();
        if (u >= CONDITIONAL.met.unready && u < CONDITIONAL.met.exceptional) fixture = { base, t: hit.project, at };
        break;
      }
    }
    expect(fixture).toBeDefined();
    const { base, t, at } = fixture!;
    // The falsifiability twin for the office's memory: one whose no-show it remembers gets no offer on condition.
    // TEST SETUP: the no-show on the record as `rememberMiss` leaves one, a week before.
    const marked = reload(base);
    marked.player.pro!.noShows = [{ casting: t.casting, projectId: t.id, at: marked.now - WEEK, how: 'no-show' }];
    expect(conditionalOfferFor(marked, marked.player, t, at)).toBeUndefined();
    played(marked, at + MS_HOUR);
    expect(marked.player.pro!.opportunities.filter((x) => x.projectId === t.id && x.condition)).toEqual([]);
    played(base, at + MS_HOUR);
    const o = base.player.pro!.opportunities.find((x) => x.projectId === t.id)!;
    const round = t.stages.test ? 'test' : 'chemistry';
    expect([o.status, o.condition, o.rounds ?? [], o.direct]).toEqual(['offered', { round, engagementId: expect.any(String), words: expect.stringMatching(/cast you as .* where your work was (Strong|Exceptional)\.$/) }, [], undefined]);
    // Its notice says why and on what condition, and nothing of an audition it hasn't had yet.
    const words = o.history.find((h) => h.key === 'offer')!.words;
    expect(words).toContain(`${o.condition!.words} It’s offered on one condition:`);
    expect(words).not.toContain('without an audition');
    const q = Object.values(base.universe.decisions).find((d) => d.refId === o.id)!;
    expect(q.detail).toContain('nothing is booked or paid until it goes your way');
    // Its decision's acceptance is named as the card names it.
    expect(q.actions.map((x) => x.label)).toEqual(['Accept On Its Condition', 'Decline The Offer']);
    const r = base.must<{ conditional: true; round: string; at: number }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    expect([r.conditional, r.round, o.status, o.condition!.accepted, o.hold?.status]).toEqual([true, round, 'callback', base.now, 'held']);
    // Uncertain work isn't guaranteed income: nothing booked, nothing promised.
    expect(base.player.pro!.engagements.filter((e) => e.projectId === t.id)).toEqual([]);
    expect(base.universe.decisions[q.id]!.resolvedAt).toBeDefined();
    // Saved on its condition, the same.
    const strong = reload(base);
    const weak = reload(base);
    // TEST SETUP: the actors' levels, the input the twins differ by; for both, the part's genres known and the sides
    // prepared, as years of work and Prepare's steps would leave them.
    setSkill(strong, 96);
    setSkill(weak, 15);
    for (const sim of [strong, weak]) {
      for (const g of t.genres) genreState(sim.player, g).familiarity = 95;
      opp(sim, o.id).prep = { interpretation: 1, memorization: 1, rehearsal: 1 };
    }
    for (const sim of [strong, weak]) played(sim, r.at + 4 * MS_DAY);
    const os = opp(strong, o.id);
    const ow = opp(weak, o.id);
    expect(os.rounds!.at(-1)!.band).toBe('exceptional');
    expect(ow.rounds!.at(-1)!.band).toBe('unready');
    // The strong actor's round goes their way: booked through the work loop's own acceptance, on the terms accepted.
    expect([os.condition!.outcome, os.status]).toEqual(['met', 'booked']);
    const e = strong.player.pro!.engagements.find((x) => x.opportunityId === o.id)!;
    expect(e.days).toHaveLength(datesOf(os).length);
    expect(e.pay.length).toBeGreaterThan(0);
    expect(notices(strong).some((n) => n.startsWith(`${t.role.part} Is Yours | `))).toBe(true);
    // The weak twin's falls away: nothing booked, the hold let go.
    expect([ow.condition!.outcome, ow.status, ow.hold!.status]).toEqual(['failed', 'passed', 'released']);
    expect(weak.player.pro!.engagements.filter((x) => x.projectId === t.id)).toEqual([]);
    expect(notices(weak).some((n) => n.startsWith(`The Offer For ${t.role.part} Falls Away | `))).toBe(true);
  }, 300_000);
});

describe('an offer on condition, asked to decide', () => {
  it('PLAYER JOURNEY: accepted on its condition, another offer on the same days, and the production asked to decide: its yes books the part on the terms accepted, the negotiated pay with them, and says so rather than offering it afresh', () => {
    const base = graduate('b27-conditional-hold');
    // A part with a chemistry read whose production, asked to decide, books by its own draw (`HOLD.book`, the condition's
    // round not yet judged), and another part on some of the same days: read from the draws, never forced.
    const overlap = (a: readonly { from: number; to: number }[], b: readonly { from: number; to: number }[]) => a.some((x) => b.some((y) => x.from < y.to && x.to > y.from));
    let found: { t: ProjectTemplate; week: number; other: ProjectTemplate } | undefined;
    for (let w = 1; w < 400 && !found; w += 1) {
      const week = base.now + w * WEEK;
      for (const p of productionsOf(base, week)) for (const t of p.parts) {
        if (found || !t.stages.chemistry || travels(base.player, t) || !writtenFor(t, base.player) || !plays(base, t, week)) continue;
        if (base.rng('pro.hold', t.id, week).next() >= HOLD.book.working) continue;
        keepProject(base.player, t);
        if (payTermsOf({ projectId: t.id, postedAt: week }).each === undefined) continue;
        const held = spansOf(base.player, t, datesOf({ projectId: t.id, postedAt: week }));
        for (const u of p.parts) {
          if (u.project === t.project || travels(base.player, u) || !writtenFor(u, base.player)) continue;
          keepProject(base.player, u);
          if (payTermsOf({ projectId: u.id, postedAt: week }).each === undefined) continue;
          if (overlap(spansOf(base.player, u, datesOf({ projectId: u.id, postedAt: week })), held)) { found = { t, week, other: u }; break; }
        }
        if (!found) for (const q of productionsOf(base, week)) for (const u of q.parts) {
          if (found || u.project === t.project || travels(base.player, u) || !writtenFor(u, base.player)) continue;
          keepProject(base.player, u);
          if (payTermsOf({ projectId: u.id, postedAt: week }).each === undefined) continue;
          if (overlap(spansOf(base.player, u, datesOf({ projectId: u.id, postedAt: week })), held)) found = { t, week, other: u };
        }
      }
    }
    expect(found).toBeDefined();
    const { t, week, other } = found!;
    played(base, week);
    // TEST SETUP: the conditional offer on the record as `offerOnCondition` leaves one, its pay raised as an agent's ask
    // answered yes leaves it; and the other offer as casting's draws would leave one, standing three days.
    const offerOf = (u: ProjectTemplate, raised: boolean) => {
      const terms = payTermsOf({ projectId: u.id, postedAt: week });
      return { at: base.now, until: base.now + 3 * MS_DAY, rate: u.pay, amount: raised ? askedAmount(terms.each!) : terms.each!, per: terms.per, units: terms.units, version: raised ? 2 : 1 };
    };
    const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'offered', postedAt: week, submitBy: week + WEEK, history: [], counts: {}, condition: { round: 'chemistry', words: 'Cast before.' }, offer: offerOf(t, true) };
    const x: Opportunity = { id: `test-${other.id}`, projectId: other.id, via: 'open', status: 'offered', postedAt: week, submitBy: week + WEEK, history: [], counts: {}, offer: offerOf(other, false) };
    base.player.pro!.opportunities.push(o);
    const raised = o.offer!.amount!;
    expect(base.must<{ conditional: true }>({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } }).conditional).toBe(true);
    expect([o.status, o.hold?.status, base.player.pro!.engagements.filter((e) => e.projectId === t.id)]).toEqual(['callback', 'held', []]);
    base.player.pro!.opportunities.push(x);
    base.schedule({ at: x.offer!.until, kind: OFFER_KIND, label: `The Offer For ${other.role.part} Lapses`, category: 'career', priority: 40, refType: 'pro.offer', refId: x.id, payload: { personId: base.player.id, opportunityId: x.id } });
    const asked = base.must<{ answerAt: number }>({ kind: 'pro.ask_hold', payload: { opportunityId: o.id } });
    played(base, asked.answerAt + MS_HOUR);
    // Booked on the terms accepted, the condition settled as met: not offered afresh at the first pay.
    expect([o.hold!.asked!.answer, o.condition!.outcome, o.status]).toEqual(['booked', 'met', 'booked']);
    const e = base.player.pro!.engagements.find((y) => y.opportunityId === o.id)!;
    expect(e.contract!.rate).toBe(raised);
    expect(raised).toBeGreaterThan(payTermsOf({ projectId: t.id, postedAt: week }).each!);
    expect(notices(base).some((n) => n.startsWith(`${t.role.part} Is Yours | Asked to decide, ${t.casting} chose you for ${t.role.part} rather than let you go to ${other.role.part}, so the offer you accepted on its condition is firm`))).toBe(true);
    expect(o.history.filter((h) => h.key === 'offer')).toEqual([]);
  }, 300_000);
});

describe('a requirement changed during casting', () => {
  it('PLAYER JOURNEY: the part now needs a technique at a level, said at the cut; the actor below it is released, the twin above it goes on, and the change is what the part asks from then', () => {
    const base = graduate('b27-rewrite');
    const { t, week } = first(base, (x, wk) => !!x.stages.callback && rewriteDrawn(base, x, wk)?.skill !== undefined);
    const change = rewriteDrawn(base, t, week)!.skill!;
    played(base, week);
    const below = reload(base);
    const above = reload(base);
    // TEST SETUP: the technique the change asks, below its level for one actor and above it for the twin.
    below.player.craft![change.skill] = change.level - 10;
    above.player.craft![change.skill] = change.level + 10;
    const ob = atTheCut(below, t, week);
    const oa = atTheCut(above, t, week);
    played(below, below.now + 2 * MS_HOUR);
    played(above, above.now + 2 * MS_HOUR);
    expect(ob.rewrite).toMatchObject({ skill: change });
    expect(ob.status).toBe('withdrawn');
    expect(ob.outcome).toMatch(/and you no longer fit it, so (it|they) released you from /);
    expect(notices(below).some((n) => n.startsWith(`${t.project} Changes ${t.role.part} | `))).toBe(true);
    expect(oa.rewrite).toMatchObject({ skill: change });
    expect(oa.status === 'callback' || oa.status === 'passed').toBe(true);
    expect(oa.history.find((h) => h.key === 'rewrite')!.words).toMatch(/You still fit it, so you’re still in the running\.$/);
    // What the part asks from then is the change: the twin's technique falling under it is a problem casting reads.
    above.player.craft![change.skill] = change.level - 1;
    expect(eligibilityProblems(above.player, oa, above.now).some((p) => p.includes(` at ${change.level}, and yours is at ${change.level - 1}.`))).toBe(true);
    expect(opp(reload(above), oa.id).rewrite).toMatchObject({ skill: change });
  }, 240_000);
});

describe('a requirement changed during casting: the playing ages', () => {
  it('PLAYER JOURNEY: the part rewritten for other ages, said at the cut; the actor outside them is released, the twin inside them goes on, and the new ages are what casting reads from then', () => {
    const base = graduate('b27-rewrite-ages');
    const { t, week } = first(base, (x, wk) => !!x.stages.callback && rewriteDrawn(base, x, wk)?.ages !== undefined);
    const ages = rewriteDrawn(base, t, week)!.ages!;
    played(base, week);
    // TEST SETUP: the actor's age, the input the twins differ by: in the middle of the new ages for one, and just past
    // them, on the side the part moved from, for the other.
    const born = (sim: Sim, age: number) => { const p = zonedParts(sim.now, NY); sim.player.birthInstant = instantFromZoned({ year: p.year - age, month: p.month, day: 1, hour: 12, minute: 0 }, NY); };
    const inside = Math.round((ages[0] + ages[1]) / 2);
    const outside = ages[0] > t.requirements.ages[0] ? ages[0] - CASTING.playingSpread - 1 : ages[1] + CASTING.playingSpread + 1;
    const out = reload(base);
    const kept = reload(base);
    born(out, outside);
    born(kept, inside);
    const oo = atTheCut(out, t, week);
    const ok = atTheCut(kept, t, week);
    played(out, out.now + 2 * MS_HOUR);
    played(kept, kept.now + 2 * MS_HOUR);
    expect(oo.rewrite).toMatchObject({ ages });
    expect(oo.status).toBe('withdrawn');
    expect(oo.outcome).toMatch(new RegExp(`for actors who play ${ages[0]} to ${ages[1]}, where it had asked for ${t.requirements.ages[0]} to ${t.requirements.ages[1]}, and you no longer fit it, so (it|they) released you from .*: at ${outside} you’re outside that\\.$`));
    expect(ok.rewrite).toMatchObject({ ages });
    expect(ok.history.find((h) => h.key === 'rewrite')!.words).toMatch(/You still fit it, so you’re still in the running\.$/);
    // What casting reads from then is the new range: the twin at the released actor's age is a problem eligibility names
    // in the new ages, and at the middle of them none. TEST SETUP: the twin's age moved.
    born(kept, outside);
    expect(eligibilityProblems(kept.player, ok, kept.now)).toContain(`Casting wants actors who play ${ages[0]} to ${ages[1]}, and at ${outside} you’re outside that.`);
    born(kept, inside);
    expect(eligibilityProblems(kept.player, ok, kept.now).some((p) => p.startsWith('Casting wants actors who play'))).toBe(false);
    expect(opp(reload(kept), ok.id).rewrite).toMatchObject({ ages });
  }, 240_000);
});

describe('a part recast', () => {
  it('PLAYER JOURNEY: a part lost at casting’s word is recast the next Monday, posted again for the actor to submit to and decided afresh; the twin whose part settled too near its first day sees none', () => {
    const base = graduate('b27-recast');
    // A part recast by its draw, its first day far enough off, and the recast's own casting draw and the first casting's on
    // either side of a chance casting could give, so which stream decides it shows.
    const { t, week } = first(base, (x, wk) => !!x.access.open && recastDrawn(base, x.id, wk, 60) && datesOf({ projectId: x.id, postedAt: wk })[0]!.from - wk > 40 * MS_DAY
      && Math.abs(base.rng('pro.casting', x.id, wk, 'callback', 'recast').next() - base.rng('pro.casting', x.id, wk, 'callback').next()) > 0.1
      && Math.max(base.rng('pro.casting', x.id, wk, 'callback', 'recast').next(), base.rng('pro.casting', x.id, wk, 'callback').next()) < 0.7);
    // Headshots, a résumé and a reel, by the Portfolio tab's and the Player Profile's commands, so a submission can be made.
    portfolio(base);
    played(base, week + MS_DAY);
    const late = reload(base);
    // TEST SETUP: the part lost at casting's word on its audition, as `pass` leaves one, settled now; in the twin, settled
    // within three weeks of its first day.
    const lost = (sim: Sim, resolvedAt: number): Opportunity => {
      const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'passed', postedAt: week, submitBy: week + WEEK, history: [], counts: {}, resolvedAt, outcome: 'Cast another actor.', rounds: [{ round: 'audition', form: t.stages.audition, at: resolvedAt - MS_DAY, status: 'done', band: 'working', overall: 55, casting: { at: resolvedAt, chance: 0.3, fit: 0.5, yes: false } }] };
      sim.player.pro!.opportunities.push(o);
      return o;
    };
    const o = lost(base, base.now);
    const firstDay = datesOf(o)[0]!.from;
    const monday = postingTimes(base.now, base.now + 8 * MS_DAY)[0]!;
    expect(firstDay - monday).toBeGreaterThanOrEqual(RECAST.leadDays * MS_DAY);
    played(base, monday + MS_HOUR);
    const n = base.player.pro!.opportunities.find((x) => x.recast?.from === o.id)!;
    expect([n.status, n.via, n.postedAt, n.recast!.at]).toEqual(['open', 'open', week, monday]);
    expect(datesOf(n)).toEqual(datesOf(o));
    expect(notices(base).some((x) => x.startsWith(`${t.role.part} Is Recast | `) && /the actor (it|they) cast left the part/.test(x))).toBe(true);
    base.must({ kind: 'pro.submit', payload: { opportunityId: n.id } });
    expect(n.status).toBe('submitted');
    // Decided afresh: its draw is its own, not the first casting's. A chance between the two draws (the visibility lift
    // set to reach it) goes one way for the recast and the other for the first casting.
    const fresh = base.rng('pro.casting', t.id, week, 'callback', 'recast').next();
    const was = base.rng('pro.casting', t.id, week, 'callback').next();
    const plain = castingDraw(base, n, 'callback', 'exceptional', 1).chance;
    const lift = (fresh + was) / 2 / plain - 1;
    const d = castingDraw(base, n, 'callback', 'exceptional', 1, lift);
    expect([d.yes, d.yes === (fresh < d.chance), d.yes === (was < d.chance)]).toEqual([fresh < was, true, false]);
    expect(castingDraw(base, o, 'callback', 'exceptional', 1, lift).yes).toBe(was < d.chance);
    // The falsifiability twin: settled within three weeks of the first day, nothing is recast.
    const tooLate = postingTimes(firstDay - 20 * MS_DAY, firstDay)[0]!;
    played(late, tooLate - 2 * MS_DAY);
    const ol = lost(late, late.now);
    played(late, tooLate + MS_HOUR);
    expect(late.player.pro!.opportunities.some((x) => x.recast?.from === ol.id)).toBe(false);
  }, 240_000);
});

describe('withdrawing, and not turning up', () => {
  it('PLAYER JOURNEY: withdrawn with notice, nothing is held against the actor; the twin who sleeps through is remembered, and the office’s cuts halve and its direct offers stop; one in hospital isn’t; one withdrawing late is', () => {
    const base = graduate('b27-noshow');
    // An office that cast the actor before, Strong, and later posts a part it would offer without an audition.
    const { t: was } = first(base, (x) => x.role.size !== 'lead' && x.slate!.fate.kind === 'made');
    finishedJob(base, 'strong', was.id);
    const { t, week } = first(base, (x) => x.casting === was.casting && x.stages.audition === 'in-person' && x.id !== was.id);
    let direct: { part: ProjectTemplate; at: number } | undefined;
    // A week after the audition and within the two years an office remembers.
    for (let w = 3; w < 90 && !direct; w += 1) {
      const at = week + w * WEEK;
      for (const p of slatePartsAt(base, at)) if (p.casting === was.casting && directOfferFor(base, base.player, p, at)) { direct = { part: p, at }; break; }
    }
    expect(direct).toBeDefined();
    played(base, week);
    const [notice, asleep, ill, late] = [reload(base), reload(base), reload(base), reload(base)];
    const os = [notice, asleep, ill, late].map((sim) => atRoundOf(sim, t, week, 'audition'));
    const at = os[0]!.rounds![0]!.at;
    // With notice: two days ahead.
    expect(withdrawWarning(notice, os[0]!)).toMatch(/won’t hold it against you\.$/);
    expect(notice.must<{ notice: boolean }>({ kind: 'pro.withdraw', payload: { opportunityId: os[0]!.id } }).notice).toBe(true);
    expect([os[0]!.status, os[0]!.outcome]).toEqual(['withdrawn', `You withdrew from ${t.role.part} in ${t.project}, with notice.`]);
    expect(notice.universe.scheduled.some((i) => i.kind === AUDITION_KIND && i.payload.opportunityId === os[0]!.id && i.status === 'pending')).toBe(false);
    expect(remembers(notice.player, t.casting, notice.now)).toBe(false);
    // Asleep at the time: a no-show the office remembers. TEST SETUP: asleep through it, the clock moved untended.
    asleep.player.awakeSince = at + 3 * MS_HOUR;
    asleep.advanceTo(at + MS_HOUR);
    expect([os[1]!.status, asleep.player.pro!.noShows?.map((x) => x.how)]).toEqual(['lapsed', ['no-show']]);
    expect(asleep.execute({ kind: 'pro.withdraw', payload: { opportunityId: os[1]!.id } }).error).toBe('You’re not in the running for it now.');
    // In hospital at the time: missed, and not held against the actor. TEST SETUP: a stay in hospital over it.
    Object.assign(ill.player.health!, { inHospitalUntil: at + MS_DAY });
    tend(ill);
    ill.advanceTo(at + MS_HOUR);
    expect([os[2]!.status, ill.player.pro!.noShows ?? []]).toEqual(['lapsed', []]);
    // Withdrawing with less than a day's notice: remembered as late.
    played(late, at - 3 * MS_HOUR);
    expect(withdrawWarning(late, os[3]!)).toMatch(/less than a day away, so withdrawing now is late notice/);
    expect(late.must<{ notice: boolean }>({ kind: 'pro.withdraw', payload: { opportunityId: os[3]!.id } }).notice).toBe(false);
    expect(late.player.pro!.noShows!.map((x) => x.how)).toEqual(['late']);
    // What the office remembers, said on the card: the part, and how.
    expect(rememberedWords(asleep.player, t, asleep.now)).toMatch(new RegExp(`remembers that you didn’t turn up for ${t.role.part} in ${t.project}, on .*: (its|their) cuts are half as likely to go your way, estimated\\.$`));
    expect(rememberedWords(late.player, t, late.now)).toMatch(new RegExp(`remembers that you withdrew from ${t.role.part} in ${t.project} at less than a day’s notice, on `));
    expect(rememberedWords(notice.player, t, notice.now)).toBeUndefined();
    // What the office's memory does: halves its cuts, read at the cut itself (a later part of its own at casting's word, the
    // same for both twins but the memory), and stops its direct offers, for the no-show and not the twin with notice.
    const { t: later, week: lw } = first(base, (x, wk) => x.casting === t.casting && x.id !== t.id && !!x.stages.callback && wk > week + 2 * WEEK && !rewriteDrawn(base, x, wk));
    const cut = [notice, asleep].map((sim) => { played(sim, lw); return atTheCut(sim, later, lw); });
    played(notice, notice.now + 2 * MS_HOUR);
    played(asleep, asleep.now + 2 * MS_HOUR);
    expect(cut[1]!.rounds![0]!.casting!.chance).toBeCloseTo(cut[0]!.rounds![0]!.casting!.chance * NOTICE.cut, 2);
    expect(castingLift(asleep.player, t, asleep.now, 0)).toBe(NOTICE.cut - 1);
    expect(castingLift(notice.player, t, notice.now, 0)).toBe(0);
    expect(directOfferFor(notice, notice.player, direct!.part, direct!.at)).toBeDefined();
    expect(directOfferFor(asleep, asleep.player, direct!.part, direct!.at)).toBeUndefined();
    expect(directOfferFor(ill, ill.player, direct!.part, direct!.at)).toBeDefined();
    // Kept through a save, and forgotten after two years.
    expect(remembers(reload(asleep).player, t.casting, asleep.now)).toBe(true);
    expect(remembers(asleep.player, t.casting, asleep.now + NOTICE.rememberDays * MS_DAY)).toBe(false);
  }, 300_000);
});

describe('asking to reschedule a chemistry read', () => {
  it('PLAYER JOURNEY: a chemistry read set on a day that clashes with the calendar says so, and points at Ask To Reschedule and its chance, not at Ask For Another Time, which refuses it', () => {
    const base = graduate('b27-reschedule-clash-notice');
    // A part whose cut into its chemistry read the game's own draw passes for a Strong callback, its requirement unchanged.
    const { t, week } = first(base, (x, wk) => !!x.stages.callback && !!x.stages.chemistry && !rewriteDrawn(base, x, wk)
      && base.rng('pro.casting', x.id, wk, 'chemistry').next() < chanceOf('strong', fitOf(base.player, x).fit, x.kind, 'chemistry'));
    played(base, week);
    // TEST SETUP: the audition and the callback on the record as done and judged Strong, and casting's word on the callback
    // on the clock an hour on.
    const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: 'callback', postedAt: week, submitBy: week + WEEK, history: [], counts: {}, rounds: [
      { round: 'audition', form: t.stages.audition, at: base.now - 2 * MS_DAY, status: 'done', band: 'strong', overall: 70, casting: { at: base.now - MS_DAY, chance: 0.7, fit: 0.5, yes: true } },
      { round: 'callback', form: 'in-person', at: base.now - MS_DAY, status: 'done', band: 'strong', overall: 70 },
    ] };
    base.player.pro!.opportunities.push(o);
    const cut = base.now + MS_HOUR;
    base.schedule({ at: cut, kind: CASTING_KIND, label: `Casting Decides: ${t.role.part}`, category: 'career', priority: 40, refType: 'pro.opportunity', refId: o.id, payload: { personId: base.player.id, opportunityId: o.id, round: 1 } });
    // The chemistry read's time as casting sets it (`WORK`), and a plan of the actor's own across it.
    let day = addDays(cut, WORK.chemistryLeadDays, NY);
    while ([0, 6].includes(zonedParts(day, NY).weekday)) day = addDays(day, 1, NY);
    const p = zonedParts(day, NY);
    const at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: WORK.chemistryHour, minute: 0 }, NY);
    base.must({ kind: 'calendar.schedule', payload: { title: 'Tutoring At The Library', at: at - MS_HOUR, durationMinutes: 180 } });
    played(base, cut + MS_HOUR);
    expect([o.rounds!.length, o.rounds![2]!.round, o.rounds![2]!.at]).toEqual([3, 'chemistry', at]);
    const said = notices(base).find((n) => n.startsWith(`A Chemistry Read For ${t.role.part} | `))!;
    expect(said).toContain(`It clashes with Tutoring At The Library at ${formatTime(at - MS_HOUR, NY)}. ${rescheduleAskWords('chemistry')}`);
    expect(said).not.toContain('Ask For Another Time');
    expect(rescheduleAskWords('chemistry')).toBe(`To ask the production to move it, press Ask To Reschedule on the Opportunities tab, at least a day ahead. The production decides: about ${Math.round(rescheduleChance('chemistry', true) * 10)} in 10 with the clash to give as the reason, estimated.`);
    // And the button it names takes the ask.
    expect(rescheduleRefusal(base, base.player, o)).toBeUndefined();
  }, 240_000);

  it('PLAYER JOURNEY: asked, the production answers the next afternoon by its draw: moved for the actor with a clash to give as the reason, kept for the twin without one', () => {
    const base = graduate('b27-reschedule');
    // A chemistry read whose draw falls between the chance without a clash and the chance with one.
    const { t, week } = first(base, (x, wk) => {
      if (!x.stages.chemistry) return false;
      const u = base.rng('pro.reschedule', x.id, wk, 'chemistry').next();
      return u >= rescheduleChance('chemistry', false) && u < rescheduleChance('chemistry', true);
    });
    played(base, week);
    const plain = reload(base);
    const clash = reload(base);
    const o1 = atRoundOf(plain, t, week, 'chemistry', 4);
    const o2 = atRoundOf(clash, t, week, 'chemistry', 4);
    const at = o1.rounds!.at(-1)!.at;
    // A plan of the actor's own at the same hour: the clash that justifies asking.
    clash.must({ kind: 'calendar.schedule', payload: { title: 'Tutoring At The Library', at: at - MS_HOUR, durationMinutes: 180 } });
    expect(moveRefusal(plain, plain.player, o1)).toBe('A chemistry read is set around other people’s days: Ask To Reschedule asks the production, which may say no.');
    expect(rescheduleWords(plain, plain.player, o1)).toBe(`The chemistry read is set around other people’s days, so the production decides whether to move it: about ${Math.round(RESCHEDULE.chance.chemistry * 10)} in 10, estimated.`);
    expect(rescheduleWords(clash, clash.player, o2)).toMatch(/about \d in 10, estimated, more for the clash on your calendar\.$/);
    const r1 = plain.must<{ answerAt: number }>({ kind: 'pro.ask_reschedule', payload: { opportunityId: o1.id } });
    const r2 = clash.must<{ answerAt: number }>({ kind: 'pro.ask_reschedule', payload: { opportunityId: o2.id } });
    expect(rescheduleRefusal(plain, plain.player, o1)).toMatch(/^You’ve asked; the production answers on /);
    played(plain, r1.answerAt + MS_HOUR);
    played(clash, r2.answerAt + MS_HOUR);
    const k1 = o1.rounds!.at(-1)!;
    const k2 = o2.rounds!.at(-1)!;
    expect([k1.reschedule!.answer, k1.at]).toEqual(['refused', at]);
    expect(notices(plain).some((n) => n.startsWith('Your Chemistry Read Stays | '))).toBe(true);
    expect(k2.reschedule!.answer).toBe('granted');
    expect(k2.at).toBeGreaterThan(at);
    expect(clash.universe.scheduled.find((i) => i.kind === AUDITION_KIND && i.payload.opportunityId === o2.id && i.status === 'pending')!.at).toBe(k2.at);
    expect(notices(clash).some((n) => n.startsWith('Your Chemistry Read Is Moved | '))).toBe(true);
    expect(rescheduleRefusal(clash, clash.player, o2)).toBe('You’ve asked once, and the production moved it.');
    // An audition asks casting itself, and a round less than a day away can't be asked about.
    const a = atRoundOf(reload(base), t, week, 'audition', 4);
    expect(rescheduleRefusal(plain, plain.player, a)).toBe('There’s no chemistry read or screen test to reschedule. An audition or a callback moves with Ask For Another Time.');
    const soon = reload(base);
    const o3 = atRoundOf(soon, t, week, 'chemistry', 1);
    played(soon, o3.rounds!.at(-1)!.at - 12 * MS_HOUR);
    expect(rescheduleRefusal(soon, soon.player, o3)).toBe('It’s less than a day away, and the production needs a day’s notice to reschedule.');
  }, 240_000);
});
