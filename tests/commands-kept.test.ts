/**
 * The commands no test reached until the connected world of 2026-10-09, each through its public command: what it
 * changes, that it refuses what it should, and, where it has one, what reads what it wrote. A life the game's own
 * creation can't make (somebody in Paris, at sixty-six in Mexico City) is TEST SETUP, said where it's made; a state
 * set by hand that the game reaches by living (a debt for care, a lost passport) is said as test setup too.
 */
import { describe, expect, it } from 'vitest';
import { createSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { coverOn, healthOf, medicalDebtOf } from '@/engine/systems/health';
import { documentsOf } from '@/engine/systems/documents';
import { courseworkOf, setWork, trustOf } from '@/engine/systems/coursework';

const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const lifeIn = (city: string, seed: string, extra: Record<string, unknown> = {}) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'comfortable', ...extra }, seed);
const unread = (sim: Simulation) => sim.universe.notifications.filter((n) => !n.read).length;

describe('what needs you', () => {
  it('marks one notification read, or all of them, and says how many', () => {
    const sim = quickSave({}, 'mark-read');
    sim.notify({ category: 'personal', title: 'One', body: 'One.', importance: 40 });
    sim.notify({ category: 'personal', title: 'Two', body: 'Two.', importance: 40 });
    const before = unread(sim);
    const first = sim.universe.notifications.find((n) => !n.read)!;
    expect(sim.must<{ read: number }>({ kind: 'world.mark_read', payload: { notificationIds: [first.id] } }).read).toBe(1);
    expect(unread(sim)).toBe(before - 1);
    expect(sim.must<{ read: number }>({ kind: 'world.mark_read', payload: {} }).read).toBe(before - 1);
    expect(unread(sim)).toBe(0);
    expect(sim.must<{ read: number }>({ kind: 'world.mark_read', payload: {} }).read).toBe(0);
  });
});

describe('orientation', () => {
  it('catches up a session missed by hand, once its time has come, as long as the session', () => {
    const sim = student('orientation');
    const cw = courseworkOf(sim, sim.player)!;
    // Test setup: the tour's session missed, as one is by somebody asleep or away when it's held.
    const tour = sim.universe.scheduled.find((i) => i.status === 'pending' && i.kind === 'school.orientation' && i.payload.task === 'tour')!;
    expect(tour).toBeDefined();
    sim.timeline.cancel(tour.id, sim.now);
    expect(sim.execute({ kind: 'school.orientation', payload: { task: 'tour' } }).error).toBe('Its session is still ahead on the calendar.');
    expect(sim.execute({ kind: 'school.orientation', payload: { task: 'nonsense' } }).error).toBe('There’s no such session.');
    sim.advanceTo(tour.at + 4 * MS_HOUR);
    expect(cw.orientation.done.tour).toBeUndefined();
    const t0 = sim.now;
    const r = sim.execute({ kind: 'school.orientation', payload: { task: 'tour' } });
    expect(r.ok, r.error).toBe(true);
    expect(sim.now - t0).toBeGreaterThan(0);
    expect(cw.orientation.done.tour).toBeDefined();
    expect(sim.execute({ kind: 'school.orientation', payload: { task: 'tour' } }).error).toMatch(/^Done on /);
  });
});

describe('a partner, and making it right', () => {
  it('calls off a rehearsal late, which costs the partner’s trust and leaves something to make right, and amends repair it', () => {
    const sim = student('amends');
    sim.advanceTo(instantFromZoned({ year: 2026, month: 9, day: 14, hour: 18 }, 'America/New_York'));
    const cw = courseworkOf(sim, sim.player)!;
    for (const a of cw.assignments) if (a.status === 'open' || a.status === 'revising') a.status = 'done';
    const a = setWork(sim, sim.player, 'DRAM 103a/b', { year: 2026, month: 9, day: 28 })!;
    // Asked for the first free hour of the weekend, in the next day; accepted or not, the partner's answer is the engine's.
    sim.advanceTo(instantFromZoned({ year: 2026, month: 9, day: 19, hour: 8 }, 'America/New_York'));
    let asked = sim.execute<{ accepted: boolean; rehearsalId?: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: 0 } });
    for (let h = 10; h <= 20 && !asked.ok; h += 1) {
      asked = sim.execute<{ accepted: boolean; rehearsalId?: string }>({ kind: 'school.ask_partner', payload: { assignmentId: a.id, at: instantFromZoned({ year: 2026, month: 9, day: 19, hour: h }, 'America/New_York') } });
    }
    expect(asked.ok, asked.error).toBe(true);
    if (!asked.value!.accepted) return;
    const mate = sim.player.school!.classmates[a.partner!]!;
    const trust = trustOf(mate);
    expect(sim.execute({ kind: 'school.cancel_rehearsal', payload: { assignmentId: a.id, rehearsalId: 'nope' } }).error).toBe('There’s no such rehearsal booked.');
    const late = sim.must<{ late: boolean }>({ kind: 'school.cancel_rehearsal', payload: { assignmentId: a.id, rehearsalId: asked.value!.rehearsalId } });
    expect(late.late).toBe(true);
    expect(a.rehearsals.find((x) => x.id === asked.value!.rehearsalId)!.status).toBe('cancelled');
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.payload.rehearsalId === asked.value!.rehearsalId)).toBe(false);
    expect(trustOf(mate)).toBeLessThan(trust);
    // Amends for a late call-off mend the bond, not the trust (`CLASS.amends.lateCancel`), and take twenty minutes.
    const bond = mate.bond ?? 0;
    const t0 = sim.now;
    sim.must({ kind: 'school.make_amends', payload: { mate: a.partner } });
    expect(sim.now - t0).toBe(20 * 60_000);
    expect(mate.bond ?? 0).toBeGreaterThan(bond);
    expect(sim.execute({ kind: 'school.make_amends', payload: { mate: a.partner } }).error).toBe('There’s nothing between you to make right.');
  });
});

describe('cover and care', () => {
  it('drops a plan of one’s own at the month’s end, and refuses with none', () => {
    const sim = lifeIn('us-ny-newyork', 'drop', { wealth: 'wealthy' });
    const h = healthOf(sim.player);
    expect(sim.execute({ kind: 'health.drop', payload: {} }).error).toBe('You have no plan of your own to drop.');
    // Test setup: a marketplace plan, as enrolling at its window leaves one.
    h.marketplace = { from: sim.now - MS_DAY, state: 'ny' };
    expect(coverOn(sim.player, sim.now)).toBe('marketplace');
    const { until } = sim.must<{ until: number }>({ kind: 'health.drop', payload: {} });
    expect(coverOn(sim.player, until - MS_HOUR)).toBe('marketplace');
    expect(coverOn(sim.player, until + MS_HOUR)).toBeUndefined();
  });

  it('pays toward a debt for care from the current account, only what it holds', () => {
    const sim = lifeIn('us-ny-newyork', 'pay-bill');
    expect(sim.execute({ kind: 'health.pay_bill', payload: { amount: 10_00 } }).error).toBe('You owe nothing for care.');
    // Test setup: a bill for care, as a visit leaves one (`health.bill`), bigger than the bank and its overdraft can reach.
    const poor = lifeIn('us-ny-newyork', 'pay-bill-poor', { wealth: 'modest' });
    healthOf(poor.player).bills.push({ id: 'bill-test', at: poor.now, what: 'A Test Stay', amount: 30_000_00, dueAt: poor.now + MS_DAY });
    poor.schedule({ at: poor.now + MS_DAY, kind: 'health.bill', label: 'A Medical Bill', category: 'system', priority: 20, payload: { personId: poor.player.id, billId: 'bill-test' } });
    poor.advanceBy(2 * MS_DAY);
    const debt = medicalDebtOf(poor, poor.player)!;
    expect(debt.balance).toBe(-30_000_00);
    expect(poor.execute({ kind: 'health.pay_bill', payload: { amount: 0 } }).error).toBe('Say how much.');
    expect(poor.execute({ kind: 'health.pay_bill', payload: { amount: 29_000_00 } }).error).toBe('Your current account can’t cover it.');
    const current = poor.universe.accounts[poor.player.primaryAccountId!]!;
    const part = 100_00;
    expect(current.balance).toBeGreaterThan(part);
    expect(poor.must<{ paid: number }>({ kind: 'health.pay_bill', payload: { amount: part } }).paid).toBe(part);
    expect(debt.balance).toBe(-30_000_00 + part);
    expect(poor.ledger.audit()).toEqual([]);
  });

  it('fills a longer supply where you live for a condition kept up, at most its longest, and charges it', () => {
    const sim = lifeIn('us-ny-newyork', 'supply');
    const h = healthOf(sim.player);
    h.chronic = {};
    expect(sim.execute({ kind: 'health.extra_supply', payload: { days: 30 } }).error).toBe('You take no medicine for a condition.');
    // Test setup: high blood pressure, kept up.
    h.chronic = { hypertension: { treated: true } };
    expect(sim.execute({ kind: 'health.extra_supply', payload: { days: 9_999 } }).error).toMatch(/^At most \d+ days at once here\.$/);
    const before = sim.universe.transactions.length;
    const r = sim.must<{ paid: number }>({ kind: 'health.extra_supply', payload: { days: 60 } });
    expect(r.paid).toBeGreaterThanOrEqual(0);
    expect(h.chronic.hypertension!.supplyUntil).toBeGreaterThan(sim.now + 50 * MS_DAY);
    if (r.paid > 0) expect(sim.universe.transactions.length).toBeGreaterThan(before);
  });

  it('sells England’s prescription prepayment certificate to somebody under 60 the NHS treats, and only there', () => {
    expect(lifeIn('us-ny-newyork', 'prepay-ny').execute({ kind: 'health.prepay', payload: { months: 12 } }).error).toBe('It’s England’s, for its prescription charge.');
    const sim = lifeIn('uk-eng-london', 'prepay-london');
    const r = sim.execute<{ paid: number; until: number }>({ kind: 'health.prepay', payload: { months: 3 } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBeGreaterThan(0);
    expect(healthOf(sim.player).prepaidUntil).toBe(r.value!.until);
    expect(sim.execute({ kind: 'health.prepay', payload: { months: 3 } }).error).toBe('Yours runs more than another month.');
  });
});

describe('papers', () => {
  it('files a police report for a document reported lost, once, where the police take one online', () => {
    const sim = lifeIn('us-ny-newyork', 'police');
    const doc = documentsOf(sim.player).find((d) => d.kind === 'passport')!;
    expect(sim.execute({ kind: 'documents.police_report', payload: { documentId: doc.id } }).error).toBe('Report it lost first.');
    const lost = sim.execute({ kind: 'documents.report_lost', payload: { documentId: doc.id } });
    expect(lost.ok, lost.error).toBe(true);
    const r = sim.execute({ kind: 'documents.police_report', payload: { documentId: doc.id } });
    expect(r.ok, r.error).toBe(true);
    expect(doc.policeReport).toBe(sim.now);
    expect(sim.execute({ kind: 'documents.police_report', payload: { documentId: doc.id } }).error).toBe('A report is filed.');
  });

  it('issues an ID card where SLATE issues one, charges its fee, and refuses a second', () => {
    const sim = lifeIn('ie-lei-dublin', 'idcard-ie');
    const r = sim.execute<{ fee: number }>({ kind: 'documents.apply_idcard', payload: {} });
    expect(r.ok, r.error).toBe(true);
    sim.advanceBy(60 * MS_DAY);
    expect(documentsOf(sim.player).some((d) => d.kind === 'idcard')).toBe(true);
    expect(sim.execute({ kind: 'documents.apply_idcard', payload: {} }).ok).toBe(false);
    expect(lifeIn('is-39-reykjavik', 'idcard-is').execute({ kind: 'documents.apply_idcard', payload: {} }).error).toMatch(/^SLATE issues ID cards in /);
  });

  it('upgrades a Connecticut license to REAL ID, once, and nobody else’s', () => {
    expect(lifeIn('us-ny-newyork', 'realid-ny').execute({ kind: 'documents.real_id', payload: {} }).error).toMatch(/^Connecticut upgrades its own license/);
    // A life begun where it was born in Connecticut holds the state's license from the start.
    const sim = lifeIn('us-ct-newhaven', 'realid');
    expect(documentsOf(sim.player).some((d) => d.kind === 'license' && d.issuer === 'us-ct')).toBe(true);
    const r = sim.must<{ fee: number }>({ kind: 'documents.real_id', payload: {} });
    expect(r.fee).toBeGreaterThan(0);
    expect(sim.execute({ kind: 'documents.real_id', payload: {} }).error).toBe('It’s REAL ID already.');
  });
});

describe('a life in Mexico', () => {
  it('settles from temporary residence after four years, and naturalizes after five', () => {
    // TEST SETUP: a life begun in Mexico City by somebody born in New York, wealthy enough for the solvency test.
    const sim = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'us-ny-newyork', livesWhereBorn: false, wealth: 'wealthy' }, 'mx-settle');
    expect(sim.execute({ kind: 'documents.settle', payload: { country: 'MX' } }).error).toBe('You hold no residence there to settle from.');
    sim.must({ kind: 'documents.residence', payload: { country: 'MX' } });
    expect(sim.execute({ kind: 'documents.naturalize', payload: { country: 'MX' } }).error).toBe('It asks five years’ residence in Mexico.');
    for (let y = 0; y < 4; y += 1) {
      sim.advanceBy(340 * MS_DAY);
      sim.must({ kind: 'documents.renew_residence', payload: { country: 'MX' } });
      sim.advanceBy(26 * MS_DAY);
    }
    sim.advanceBy(5 * MS_DAY);
    const settled = sim.execute<{ paid: number }>({ kind: 'documents.settle', payload: { country: 'MX' } });
    expect(settled.ok, settled.error).toBe(true);
    expect(documentsOf(sim.player).some((d) => d.route === 'mx-permanent' && d.status === 'valid')).toBe(true);
    expect(sim.execute({ kind: 'documents.settle', payload: { country: 'MX' } }).error).toBe('You’re settled there.');
    sim.advanceBy(370 * MS_DAY);
    const nat = sim.execute<{ paid: number; readyAt: number }>({ kind: 'documents.naturalize', payload: { country: 'MX' } });
    expect(nat.ok, nat.error).toBe(true);
    expect(nat.value!.readyAt).toBeGreaterThan(sim.now);
    expect(sim.execute({ kind: 'documents.naturalize', payload: { country: 'MX' } }).error).toBe('An application is being decided.');
  }, 240_000);

  it('pays the Pensión para el Bienestar every two months to a Mexican of 65 living there, and nobody younger', () => {
    expect(lifeIn('mx-cmx-mexicocity', 'bienestar-young').execute({ kind: 'pension.bienestar', payload: {} }).error).toBe('From 65.');
    // TEST SETUP: a life begun at sixty-six, which creation's school can't make.
    const sim = quickSave({ startLocationId: 'mx-cmx-mexicocity', homeRegionId: 'mx-cmx-mexicocity', livesWhereBorn: true, wealth: 'modest', birthYear: 1960 }, 'bienestar');
    const r = sim.must<{ bimonthly: number }>({ kind: 'pension.bienestar', payload: {} });
    expect(r.bimonthly).toBeGreaterThan(0);
    expect(sim.execute({ kind: 'pension.bienestar', payload: {} }).error).toBe('You’re drawing it.');
    const before = sim.universe.transactions.length;
    sim.advanceBy(130 * MS_DAY);
    const paid = sim.universe.transactions.slice(before).filter((t) => t.category === 'pension' || /Bienestar/i.test(t.memo));
    expect(paid.length).toBeGreaterThanOrEqual(2);
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);
});

describe('a French bank', () => {
  it('offers a loan for an overrun three months past the overdraft, and taking it clears the overrun into a loan', () => {
    // TEST SETUP: a life banking in Paris, which a student's New Haven life doesn't; and the overrun posted by hand.
    const sim = quickSave({ startLocationId: 'fr-idf-paris', homeRegionId: 'fr-idf-paris', livesWhereBorn: true, wealth: 'modest', bankId: 'fr-bnp-paribas' }, 'fr-overrun');
    expect(sim.execute({ kind: 'bank.take_overrun_loan', payload: {} }).error).toBe('Your bank has offered no loan for an overrun.');
    const current = sim.universe.accounts[sim.player.primaryAccountId!]!;
    const to = -((current.overdraftLimit ?? 0) + 2_000_00);
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'savings' && a.balance > 0) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: a.balance }] });
    sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: current.id, amount: to - current.balance }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: current.balance - to }] });
    sim.advanceBy(100 * MS_DAY);
    expect(current.creditOffered).toBeDefined();
    const offered = current.creditOffered!.amount;
    const before = current.balance;
    const r = sim.must<{ apr: number; payment: number }>({ kind: 'bank.take_overrun_loan', payload: {} });
    expect(r.payment).toBeGreaterThan(0);
    expect(current.balance).toBe(before + offered);
    expect(Object.values(sim.universe.accounts).some((a) => a.ownerId === sim.player.id && a.kind === 'loan' && a.balance === -offered)).toBe(true);
    expect(sim.execute({ kind: 'bank.take_overrun_loan', payload: {} }).ok).toBe(false);
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);
});
