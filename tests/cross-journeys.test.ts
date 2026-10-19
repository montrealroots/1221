/**
 * Journeys across School, Banking and Papers (from 2026-10-10), played through the game's commands, its calendar, its
 * money and its state. PLAYER JOURNEY marks play; a FIXTURE is set by hand to reach one moment, and says so. The
 * production journey is tests/journey-school-production.test.ts; leaving the School, tests/student-experience.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { netWorth } from '@/engine/systems/finance';
import { checkingsOf } from '@/engine/systems/lending';
import { bankAccountsOf } from '@/engine/systems/banking';
import { cardsOf, stateOf } from '@/engine/systems/credit';
import { periodsOf } from '@/engine/systems/statements';
import { careFor, healthOf, inHospital } from '@/engine/systems/health';
import { courseworkOf } from '@/engine/systems/coursework';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const wagesInto = (sim: Simulation, id: string, from: number, to: number) => sim.universe.transactions.filter((t) => t.at >= from && t.at < to && t.memo.startsWith('Work-study') && t.postings.some((p) => p.accountId === id && p.amount > 0)).length;

describe('PLAYER JOURNEY: a student changes banks while the School pays and a card falls due', () => {
  it('opens and funds Capital One, has Yale pay there after its pay cycle, moves autopay and savings, closes Chase, and keeps its history', () => {
    let sim = student('mv-move');
    tended(sim, at(2026, 9, 1, 18));
    const chase = sim.player.primaryAccountId!;
    // Applies and meets the requirements: a citizen with a number, online, at once; the debit card on its way.
    const cap = sim.must<{ accountId: string; cardAt: number }>({ kind: 'bank.open_current', payload: { bankId: 'us-capital-one' } });
    expect(sim.universe.accounts[cap.accountId]!.awaitingFunds).toBe(1);
    // Funds it from Chase: out now, in transit, in on Capital One's side in Chase's days.
    const sent = sim.must<{ arrivesAt: number }>({ kind: 'bank.transfer', payload: { fromId: chase, toId: cap.accountId, amount: 300_00 } });
    sim = reload(sim);
    tended(sim, sent.arrivesAt + MS_HOUR);
    expect(sim.universe.accounts[cap.accountId]!.awaitingFunds).toBeUndefined();
    // Redirects the School's pay: Yale's payroll a week on, every other payer two.
    const changed = sim.now;
    sim.must({ kind: 'bank.redirect_deposits', payload: { accountId: cap.accountId } });
    // Moves the card's autopay; a statement comes due through the change.
    for (const card of cardsOf(sim, sim.player)) sim.must({ kind: 'card.set_autopay_from', payload: { cardId: card.id, accountId: cap.accountId } });
    tended(sim, changed + 21 * MS_DAY);
    expect(wagesInto(sim, cap.accountId, changed + 7 * MS_DAY, changed + 21 * MS_DAY)).toBeGreaterThan(0);
    expect(wagesInto(sim, cap.accountId, changed, changed + 6 * MS_DAY)).toBe(0);
    expect(wagesInto(sim, chase, changed + 7 * MS_DAY, changed + 21 * MS_DAY)).toBe(0);
    // Makes Capital One primary, closes Chase's savings into Chase, then Chase into Capital One.
    sim.must({ kind: 'bank.set_primary', payload: { accountId: cap.accountId } });
    for (const s of bankAccountsOf(sim, sim.player).filter((a) => a.kind === 'savings' && a.bankId === 'us-chase')) sim.must({ kind: 'bank.close_savings', payload: { accountId: s.id } });
    for (const o of sim.player.payments?.standingOrders ?? []) sim.must({ kind: 'bank.cancel_standing_order', payload: { id: o.id } });
    sim.advanceTo(sim.now + 4 * MS_DAY);
    const worth = netWorth(sim, sim.player.id).total;
    const closed = sim.execute<{ arrivesAt?: number }>({ kind: 'bank.close_current', payload: { accountId: chase, remainderTo: cap.accountId } });
    expect(closed.ok, closed.error).toBe(true);
    expect(netWorth(sim, sim.player.id).total).toBe(worth);
    sim = reload(sim);
    tended(sim, sim.now + 5 * MS_DAY);
    expect(checkingsOf(sim, sim.player).map((a) => a.bankId)).toEqual(['us-capital-one']);
    // History kept: Chase's postings, its statements to its closing, and the card's autopay from Capital One.
    expect(sim.universe.transactions.filter((t) => t.postings.some((p) => p.accountId === chase)).length).toBeGreaterThan(5);
    expect(periodsOf(sim, sim.universe.accounts[chase]!)[0]!.label).toMatch(/Until It Closed/);
    for (const card of cardsOf(sim, sim.player)) expect(stateOf(sim.player, card).autopayFrom).toBe(cap.accountId);
  });
});

describe('PLAYER JOURNEY: a student falls ill', () => {
  it('is admitted, billed Yale Health’s share, has the days’ classes excused, recovers, and the evaluation reads the excused days as excused', () => {
    let sim = student('cj-ill');
    tended(sim, at(2026, 9, 28, 8));
    const school = sim.player.school!;
    const excusedBefore = school.tally.excused;
    const bills = healthOf(sim.player).bills.length;
    // FIXTURE: the week's illness drawn as a hospital stay (\`illnessWeek\` would draw it at its rate); the care, the
    // bill and the stay are the engine's own (\`careFor\`).
    careFor(sim, sim.player, { care: 'stay', what: 'An admission' }, sim.now);
    expect(inHospital(sim.player, sim.now + MS_HOUR)).toBe(true);
    expect(healthOf(sim.player).bills.length).toBe(bills + 1);
    const bill = healthOf(sim.player).bills.at(-1)!;
    expect(bill.amount).toBeGreaterThan(0);
    sim = reload(sim);
    tended(sim, at(2026, 10, 9, 18));
    expect(inHospital(sim.player, sim.now)).toBe(false);
    expect(sim.player.school!.tally.excused).toBeGreaterThan(excusedBefore);
    // Work due on a day in hospital moved to the course's next meeting, not missed.
    expect(courseworkOf(sim, sim.player)!.assignments.filter((a) => a.status === 'missed').length).toBe(0);
    // Recovered, to the term's evaluation: attendance counts only the days not excused.
    tended(sim, at(2026, 12, 12, 12));
    const review = sim.player.school!.history.find((h) => h.term === 0)!;
    expect(review.attendance).toBeGreaterThan(0.9);
    expect(Object.values(sim.player.school!.courses ?? {}).filter((r) => r.term === 0).every((r) => r.result === 'pass' || r.result === 'incomplete')).toBe(true);
  });
});
