/**
 * Brief 27, K4 (2026-10-25): holds, the supplement's loop 20 ("A hold or option begins → record its scope, dates, and
 * terms → show how it affects availability → a conflicting opportunity arrives → evaluate permitted responses → release,
 * exercise, negotiate, or decline according to the arrangement. Expiry: removes restrictions at the correct time →
 * notifies the player where useful → preserves the history. Do not treat every hold as a signed paid engagement."). Held
 * here: casting's cut into a chemistry read puts a hold on the part's work days, said and kept, booking nothing and paying
 * nothing; another offer on the same days says what accepting it does, and accepting it lets the hold go and withdraws
 * the actor from the part; asked to decide first, the production books them with an offer or lets the hold go, by its
 * own draw, each said; the hold ends with the part, as the booking it became or let go.
 *
 * PLAYER JOURNEYS: a graduate played by the clock and the commands a player sends (tests/fakes/career-world.ts); TEST
 * SETUP, said where it's done: the audition and callback on the record as done and judged Strong with casting's word on
 * the clock, and the other offer on the record as casting's draws would leave one. Each draw is read as the game reads
 * it, never forced.
 */
import { describe, expect, it } from 'vitest';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import type { ProjectTemplate } from '@/engine/content/careerwork';
import { keepProject, productionsOf } from '@/engine/systems/slate';
import type { AuditionRound, Opportunity } from '@/engine/systems/pro';
import {
  AUDITION_KIND, CASTING_KIND, HOLD, OFFER_KIND, acceptWarning, chanceOf, datesOf, fitOf, holdAnswerAt, holdAskRefusal, payTermsOf, roundsOf, spansOf, travels, writtenFor,
} from '@/engine/systems/projobs';
import { graduate, notices, played } from './fakes/career-world';

const WEEK = 7 * MS_DAY;
type Sim = ReturnType<typeof graduate>;
const overlap = (a: readonly { from: number; to: number }[], b: readonly { from: number; to: number }[]) => a.some((x) => b.some((y) => x.from < y.to && x.to > y.from));

/** Another part posted the same week, near New Haven, with a figure to its pay, whose days meet the held part's. */
function conflicting(sim: Sim, t: ProjectTemplate, week: number): ProjectTemplate | undefined {
  const held = spansOf(sim.player, t, datesOf({ projectId: t.id, postedAt: week }));
  for (const p of productionsOf(sim, week)) for (const u of p.parts) {
    if (u.project === t.project || travels(sim.player, u) || !writtenFor(u, sim.player)) continue;
    keepProject(sim.player, u);
    if (payTermsOf({ projectId: u.id, postedAt: week }).each === undefined) continue;
    if (overlap(spansOf(sim.player, u, datesOf({ projectId: u.id, postedAt: week })), held)) return u;
  }
  return undefined;
}

/**
 * A part near New Haven with a chemistry read, whose cut into it the game's own draw passes for a Strong callback, whose
 * answer when asked to decide is the one wanted (`HOLD.book`, read for any band from Working up), and another part on the
 * same days: read from the draws as the game reads them, never forced.
 */
function heldPart(sim: Sim, answer: 'booked' | 'released'): { t: ProjectTemplate; week: number; other: ProjectTemplate } {
  for (let w = 1; w < 400; w += 1) {
    const week = sim.now + w * WEEK;
    for (const p of productionsOf(sim, week)) for (const t of p.parts) {
      if (!t.stages.chemistry || travels(sim.player, t) || !writtenFor(t, sim.player)) continue;
      keepProject(sim.player, t);
      if (sim.rng('pro.casting', t.id, week, 'chemistry').next() >= chanceOf('strong', fitOf(sim.player, t).fit, t.kind, 'chemistry')) continue;
      const draw = sim.rng('pro.hold', t.id, week).next();
      if (answer === 'booked' ? draw >= HOLD.book.working : draw < HOLD.book.exceptional) continue;
      const other = conflicting(sim, t, week);
      if (other) return { t, week, other };
    }
  }
  throw new Error('no such part');
}

/** TEST SETUP: the rounds before the chemistry read on the record as done, each judged Strong, and casting's word on the last on the clock an hour on. */
function atTheCut(sim: Sim, t: ProjectTemplate, week: number): Opportunity {
  const before = roundsOf(t).slice(0, roundsOf(t).indexOf('chemistry'));
  const rounds: AuditionRound[] = before.map((round, i) => ({
    round, form: round === 'audition' ? t.stages.audition : 'in-person', at: sim.now - (before.length - i) * MS_DAY, status: 'done', band: 'strong', overall: 0.7,
    ...(i < before.length - 1 ? { casting: { at: sim.now - MS_DAY, chance: 0.7, fit: 0.5, yes: true } } : {}),
  }));
  const o: Opportunity = { id: `test-${t.id}`, projectId: t.id, via: 'open', status: before.length > 1 ? 'callback' : 'audition', postedAt: week, submitBy: week + WEEK, history: [], counts: {}, rounds };
  sim.player.pro!.opportunities.push(o);
  sim.schedule({ at: sim.now + MS_HOUR, kind: CASTING_KIND, label: `Casting Decides: ${t.role.part}`, category: 'career', priority: 40, refType: 'pro.opportunity', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id, round: rounds.length - 1 } });
  return o;
}

/** TEST SETUP: an offer for a part on the record as casting's draws would leave one, standing three days. */
function offered(sim: Sim, u: ProjectTemplate, postedAt: number): Opportunity {
  const terms = payTermsOf({ projectId: u.id, postedAt });
  const o: Opportunity = {
    id: `test-${u.id}`, projectId: u.id, via: 'open', status: 'offered', postedAt, submitBy: postedAt + WEEK, history: [], counts: {},
    offer: { at: sim.now, until: sim.now + 3 * MS_DAY, rate: u.pay, ...(terms.each !== undefined ? { amount: terms.each } : {}), per: terms.per, units: terms.units, version: 1 },
  };
  sim.player.pro!.opportunities.push(o);
  sim.schedule({ at: o.offer!.until, kind: OFFER_KIND, label: `The Offer For ${u.role.part} Lapses`, category: 'career', priority: 40, refType: 'pro.offer', refId: o.id, payload: { personId: sim.player.id, opportunityId: o.id } });
  return o;
}

/** A part played to casting's cut into its chemistry read, by the clock: the hold put on. */
function heldBy(sim: Sim, answer: 'booked' | 'released') {
  const { t, week, other } = heldPart(sim, answer);
  played(sim, week);
  const o = atTheCut(sim, t, week);
  played(sim, sim.now + 2 * MS_HOUR);
  return { t, week, other, o };
}

describe('a hold on the actor’s dates', () => {
  it('PLAYER JOURNEY: put on at the cut into a chemistry read, its days and terms said and kept, booking nothing and paying nothing; another offer on the same days says what accepting it does, and accepting it lets the hold go and withdraws the actor, said', () => {
    const sim = graduate('b27-hold-let-go');
    const { t, week, other, o } = heldBy(sim, 'released');
    const days = datesOf(o);
    expect(o.rounds!.at(-1)!.round).toBe('chemistry');
    expect([o.hold!.status, o.hold!.from, o.hold!.to]).toEqual(['held', days[0]!.from, days.at(-1)!.to]);
    expect(notices(sim).some((n) => n.startsWith(`A Chemistry Read For ${t.role.part} | `) && n.includes('a hold on your dates') && n.includes('it isn’t a booking and pays nothing'))).toBe(true);
    expect(o.history.find((h) => h.key === 'hold:set')!.words).toMatch(/put a hold on your dates for .*, until the part was cast\. It booked nothing and paid nothing\.$/);
    // Not a signed, paid engagement: no booking, no pay promised.
    expect(sim.player.pro!.engagements).toEqual([]);
    // Nothing to ask the production to decide against yet.
    expect(holdAskRefusal(sim, sim.player, o)).toBe('No other offer stands on these days, so there’s nothing to ask the production to decide against.');
    // The other offer arrives, and says what accepting it does to the hold.
    const b = offered(sim, other, week);
    expect(acceptWarning(sim, sim.player, b)).toContain(`some of the same days for ${t.role.part} in ${t.project} until the part is cast. Accepting this lets that hold go and withdraws you from the part`);
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: b.id } });
    expect([o.status, o.hold!.status]).toEqual(['withdrawn', 'released']);
    expect(o.outcome).toBe(`You took ${other.role.part} in ${other.project} on some of the same days, so you withdrew from ${t.role.part} in ${t.project} and its hold was let go.`);
    expect(notices(sim).some((n) => n.startsWith(`You Withdrew From ${t.role.part} | `))).toBe(true);
    // The chemistry read is off the calendar; the history keeps the hold's end.
    expect(sim.universe.scheduled.some((i) => i.kind === AUDITION_KIND && i.payload.opportunityId === o.id && i.status === 'pending')).toBe(false);
    expect(o.history.map((h) => h.key)).toEqual(expect.arrayContaining(['hold:set', 'hold:let-go', 'hold:ended']));
  }, 240_000);

  it('PLAYER JOURNEY: asked to decide first, the production books the actor by its draw: the offer made now, the chemistry read dropped, and the hold the booking once it’s accepted', () => {
    const sim = graduate('b27-hold-booked');
    const { t, week, other, o } = heldBy(sim, 'booked');
    const b = offered(sim, other, week);
    const r = sim.must<{ answerAt: number; against: string }>({ kind: 'pro.ask_hold', payload: { opportunityId: o.id } });
    expect([r.answerAt, r.against]).toEqual([holdAnswerAt(sim.now), b.id]);
    expect(holdAskRefusal(sim, sim.player, o)).toMatch(/^You’ve asked; the answer comes on /);
    played(sim, r.answerAt + MS_HOUR);
    expect([o.hold!.asked!.answer, o.status, o.hold!.status]).toEqual(['booked', 'offered', 'held']);
    expect(o.history.find((h) => h.key === 'hold:booked')!.words).toBe(`Asked to decide, ${t.casting} chose you for ${t.role.part} rather than let you go to ${other.role.part}.`);
    expect(sim.universe.scheduled.some((i) => i.kind === AUDITION_KIND && i.payload.opportunityId === o.id && i.status === 'pending')).toBe(false);
    expect(Object.values(sim.universe.decisions).some((d) => d.refId === o.id && d.title === `An Offer For ${t.role.part}`)).toBe(true);
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: o.id } });
    expect([o.status, o.hold!.status]).toEqual(['booked', 'booked']);
    expect(o.history.find((h) => h.key === 'hold:ended')!.words).toBe('The hold on your dates became the booking.');
  }, 240_000);

  it('PLAYER JOURNEY: asked to decide first, the production lets the hold go by its draw, said, and the other offer is free to take; asked too late, refused', () => {
    const sim = graduate('b27-hold-released');
    const { t, week, other, o } = heldBy(sim, 'released');
    const b = offered(sim, other, week);
    // An offer lapsing before the answer can come leaves a choice between them.
    const until = b.offer!.until;
    b.offer!.until = holdAnswerAt(sim.now) - MS_HOUR;
    expect(holdAskRefusal(sim, sim.player, o)).toMatch(new RegExp(`^The offer for ${other.role.part} lapses on .*, before ${t.casting} could answer, so it’s a choice between them now\\.$`));
    b.offer!.until = until;
    const r = sim.must<{ answerAt: number }>({ kind: 'pro.ask_hold', payload: { opportunityId: o.id } });
    played(sim, r.answerAt + MS_HOUR);
    expect([o.hold!.asked!.answer, o.status, o.hold!.status]).toEqual(['released', 'passed', 'released']);
    expect(notices(sim).some((n) => n.startsWith(`The Hold On ${t.role.part} Is Let Go | `) && n.includes(`You’re free to take ${other.role.part}.`))).toBe(true);
    expect(acceptWarning(sim, sim.player, b) ?? '').not.toContain('hold');
    sim.must({ kind: 'pro.accept_offer', payload: { opportunityId: b.id } });
    expect(b.status).toBe('booked');
  }, 240_000);
});
