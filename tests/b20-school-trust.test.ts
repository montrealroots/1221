/**
 * Brief 20's School area, B1 and B3: a classmate's trust after rehearsals kept or missed, and what it changes later
 * (2026-10-21). Lives from one seed (`b20-school-trust`, a New York student of modest means), played by the attentive
 * student (`tests/setup/b20-school.ts`), who books evenings with partners and keeps them:
 *
 * - A keeps every rehearsal.
 * - B, from 14 September, sleeps through every rehearsal with the first partner booked then (Aaliyah Fischer, the
 *   Consent And Intimacy Practice scene): an hour before it, to bed for three hours. Three are missed by 21 September.
 * - C is B until the evening after the third miss, then makes amends with her (`school.make_amends`).
 *
 * Relevant: a rehearsal kept adds to the partner's trust (`WORK.trust.kept`), one missed takes from it
 * (`WORK.trust.missed`) and is told; under the wary line (`WORK.trust.wary`) the partner declines the player's later
 * asks in so many words (`askRefusal`, coursework.ts), and the scene shown together comes out a band lower. Amends give
 * back half a missed rehearsal's trust each, above the line. No leak: the money and the attendance are the same.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { PARTNER_KIND, WORK, courseworkOf, mateRecord, trustOf } from '@/engine/systems/coursework';
import { at, balances, play, student, tallyOf, titled } from './setup/b20-school';

const SEED = 'b20-school-trust';
const END = at(2026, 9, 30);
const DECLINED = 'would rather work on it alone, after last time.';

const partnerOf = (sim: Simulation, i: { payload: Record<string, unknown> }) => courseworkOf(sim, sim.player)!.assignments.find((x) => x.id === i.payload.assignmentId)!.partner;

/** From 14 September, an hour before a rehearsal with the first partner booked then, to bed for three hours. */
function standsUp(state: { mate?: number; missed: number[] }, until = Number.POSITIVE_INFINITY) {
  return (sim: Simulation): boolean => {
    if (sim.now < at(2026, 9, 14) || sim.now > until) return false;
    const next = sim.universe.scheduled.find((i) => i.kind === PARTNER_KIND && i.status === 'pending' && i.payload.personId === sim.player.id && i.at > sim.now && i.at <= sim.now + 3_600_000);
    if (!next) return false;
    state.mate ??= partnerOf(sim, next);
    if (partnerOf(sim, next) !== state.mate) return false;
    if (!sim.execute({ kind: 'life.sleep', payload: { hours: 3 } }).ok) return false;
    state.missed.push(next.at);
    return true;
  };
}

describe('B1/B3: a partner’s trust, rehearsals kept against rehearsals slept through (seed b20-school-trust)', () => {
  const S = {} as { a: Simulation; b: Simulation; c: Simulation; bState: { mate?: number; missed: number[] }; cState: { mate?: number; missed: number[] }; amends?: { repaired: number }; trustBeforeAmends?: number };
  beforeAll(() => {
    S.a = play(student(SEED, { wealth: 'modest' }), END);
    S.bState = { missed: [] };
    S.b = play(student(SEED, { wealth: 'modest' }), END, standsUp(S.bState));
    S.cState = { missed: [] };
    S.c = play(student(SEED, { wealth: 'modest' }), at(2026, 9, 22, 18), standsUp(S.cState));
    S.trustBeforeAmends = trustOf(S.c.player.school!.classmates[S.cState.mate!]!);
    S.amends = S.c.must<{ repaired: number }>({ kind: 'school.make_amends', payload: { mate: S.cState.mate } });
    play(S.c, END, standsUp(S.cState, at(2026, 9, 22, 18)));
  }, 120_000);

  it('each rehearsal kept adds to the partner’s trust and each missed takes from it, said each time', () => {
    const i = S.bState.mate!;
    expect(S.bState.missed).toHaveLength(3);
    const a = mateRecord(S.a.player.school!.classmates[i]!);
    const b = mateRecord(S.b.player.school!.classmates[i]!);
    expect(b.missedByYou).toBe(3);
    expect(a.missedByYou ?? 0).toBe(0);
    expect(a.kept).toBeGreaterThan(b.kept ?? 0);
    expect(trustOf(S.a.player.school!.classmates[i]!)).toBeGreaterThan(WORK.trust.start + (a.kept! - 1) * WORK.trust.kept);
    expect(trustOf(S.b.player.school!.classmates[i]!)).toBeLessThan(WORK.trust.wary);
    const first = S.b.player.school!.classmates[i]!.name.split(' ')[0];
    expect(titled(S.b, `${first} Waited For You`).length).toBeGreaterThanOrEqual(1);
    expect(titled(S.b, `${first} Waited For You`)[0]!.body).toMatch(/It cost some of their trust, and they’ll remember it\. You can make amends under Your Partners\./);
    expect(titled(S.a, `${first} Waited For You`)).toHaveLength(0);
  });

  it('later: under the wary line the partner declines the player’s asks in so many words, and the scene together comes out lower', () => {
    const i = S.bState.mate!;
    const logB = mateRecord(S.b.player.school!.classmates[i]!).log!.map((l) => l.what);
    const logA = mateRecord(S.a.player.school!.classmates[i]!).log!.map((l) => l.what);
    expect(logB.some((w) => w.endsWith(DECLINED))).toBe(true);
    expect(logA.some((w) => w.endsWith(DECLINED))).toBe(false);
    // The piece they shared, shown on its day in both lives: the same assignment, a band apart.
    const shared = (sim: Simulation) => courseworkOf(sim, sim.player)!.assignments.find((x) => x.partner === i && x.shown)!;
    expect(shared(S.b).id).toBe(shared(S.a).id);
    const together = (sim: Simulation) => (shared(sim).shown as unknown as { together: { overall: number } }).together.overall;
    expect(together(S.b)).toBeLessThan(together(S.a));
    expect(shared(S.a).shown!.band).toBe('strong');
    expect(shared(S.b).shown!.band).toBe('working');
  });

  it('amends give back half a missed rehearsal’s trust each, above the wary line, and her asks aren’t declined for it after', () => {
    const i = S.cState.mate!;
    expect(S.amends).toEqual({ repaired: 3 });
    const after = trustOf(S.c.player.school!.classmates[i]!);
    expect(S.trustBeforeAmends).toBeLessThan(WORK.trust.wary);
    expect(after).toBeGreaterThanOrEqual(WORK.trust.wary);
    const log = mateRecord(S.c.player.school!.classmates[i]!).log!;
    const madeRight = log.find((l) => l.what === 'You made it right with them')!;
    expect(log.filter((l) => l.at > madeRight.at).some((l) => l.what.endsWith(DECLINED))).toBe(false);
    expect(S.c.execute({ kind: 'school.make_amends', payload: { mate: i } }).error).toBe('There’s nothing between you to make right.');
  });

  it('no leak: the money and the attendance are the same whether the rehearsals were kept or missed', () => {
    expect(balances(S.b)).toEqual(balances(S.a));
    expect(tallyOf(S.b)).toEqual(tallyOf(S.a));
    expect(tallyOf(S.c)).toEqual(tallyOf(S.a));
  });
});
