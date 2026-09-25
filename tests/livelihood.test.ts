/**
 * The five that were open after the money system: eviction, hours, what the
 * record decides past the card's rate, tips, and Tokyo's minimum wage.
 *
 * A notice to pay or quit at two months owed, withdrawn under one, eviction
 * when it runs out, the deposit against the debt, a sofa that sleeps badly,
 * and a room again once there's a deposit and a month. Moving: a deposit and
 * the rest of the month from checking, the old deposit back less what's
 * owed, and two months' deposit for a poor record. The card's limit raised
 * for a clean record and cut by a late payment. Tips where the custom is to
 * tip. An extra shift, and full-time from a week on.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createSave, defaultConfig, quickSave } from '@/engine';
import { placeProfile } from '@/engine/world/place';
import { outdoorWeather } from '@/engine/systems/weather';
import { mayWorkIn } from '@/engine/domain/citizenship';
import { loadCountryCities } from '@/engine/content/geography';
import { rentAt } from '@/engine/content/rents';
import type { Simulation } from '@/engine';
import {
  arrearsOf, depositFor, moveCost, rentOf, spend,
} from '@/engine/systems/household';
import { SHIFT_KIND, TIPS_KIND, withholdingRate } from '@/engine/systems/work';
import { sleepQuality } from '@/engine/systems/life';
import { patternOf, jobFor } from '@/engine/content/jobs';
import { MS_DAY, MS_HOUR, instantFromZoned, startOfNextDay, zonedParts } from '@/engine/core/time';

const accounts = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id);
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const card = (sim: Simulation) => accounts(sim).find((a) => a.kind === 'credit_card');
const deposit = (sim: Simulation) => accounts(sim).find((a) => a.kind === 'escrow' && a.category === 'deposit');
/** Checking set to an amount, and savings emptied: payments draw on both. */
const setChecking = (sim: Simulation, to: number) => {
  const savings = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'savings');
  if (savings && savings.balance !== 0) {
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: savings.id, amount: -savings.balance }, { accountId: sim.nominalAccount('income', 'Test').id, amount: savings.balance }] });
  }
  const move = to - checking(sim).balance;
  if (move !== 0) sim.post({ memo: 'test', category: 'test', postings: [{ accountId: checking(sim).id, amount: move }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -move }] });
};
const days = (sim: Simulation, n: number) => {
  for (let d = 0; d < n; d += 1) sim.advanceTo(startOfNextDay(sim.now, sim.zone) + 7 * MS_HOUR);
};
const shifts = (sim: Simulation) => sim.timeline.pending().filter((i) => i.kind === SHIFT_KIND).sort((a, b) => a.at - b.at);

describe('the landlord', () => {
  it('serves a notice at two months owed, and evicts when it runs out with a month still owed', () => {
    const sim = quickSave({ dayJob: false, wealth: 'nothing' }, 'evict');
    setChecking(sim, 0);
    spend(sim, sim.player, rentOf(sim, sim.player) * 2, 'Rent', 'rent', true);
    expect(arrearsOf(sim, sim.player)).toBe(rentOf(sim, sim.player) * 2);
    days(sim, 1);
    const notice = sim.player.home!.noticeUntil!;
    expect(notice - sim.now).toBeGreaterThan(29 * MS_DAY);
    expect(sim.universe.notifications.some((n) => n.title === 'A Notice To Pay Or Quit')).toBe(true);
    const score = sim.player.credit!.score;
    days(sim, 31);
    expect(sim.player.home!.kind).toBe('sofa');
    expect(sim.player.credit!.score).toBeLessThanOrEqual(score - 60);
    expect(rentOf(sim, sim.player)).toBe(0);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('withdraws the notice once what’s owed is under a month', () => {
    const sim = quickSave({ dayJob: false, wealth: 'nothing' }, 'withdraw');
    setChecking(sim, 0);
    const rent = rentOf(sim, sim.player);
    spend(sim, sim.player, rent * 2, 'Rent', 'rent', true);
    days(sim, 1);
    expect(sim.player.home!.noticeUntil).toBeDefined();
    setChecking(sim, rent * 2);
    days(sim, 1);
    expect(sim.player.home!.noticeUntil).toBeUndefined();
    days(sim, 35);
    expect(sim.player.home!.kind).toBe('shared');
  });

  it('keeps the deposit against the debt, and a sofa sleeps worse than a bed', () => {
    const sim = quickSave({ dayJob: false, wealth: 'comfortable' }, 'sofa');
    expect(sim.execute({ kind: 'home.move', payload: { kind: 'own' } }).ok).toBe(true);
    const held = deposit(sim)!.balance;
    expect(held).toBeGreaterThan(0);
    setChecking(sim, 0);
    // Nothing on the card either, so the rent can only be owed.
    const c = card(sim)!;
    const owe = (c.creditLimit ?? 0) + c.balance;
    if (owe > 0) spend(sim, sim.player, owe, 'Rent', 'rent', true);
    const rent = rentOf(sim, sim.player);
    spend(sim, sim.player, rent * 2, 'Rent', 'rent', true);
    const bed = sleepQuality(sim, sim.player);
    days(sim, 32);
    expect(sim.player.home!.kind).toBe('sofa');
    expect(deposit(sim)!.balance).toBe(0);
    // The same person at the same moment, with only the bed changed: the owing
    // has raised their stress too, which costs a night by itself.
    const onSofa = sleepQuality(sim, sim.player);
    sim.player.home!.kind = 'shared';
    const inBed = sleepQuality(sim, sim.player);
    sim.player.home!.kind = 'sofa';
    expect(inBed - onSofa).toBeCloseTo(0.08, 9);
    void bed;
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('takes a room again once there is a deposit, a month and a month’s food behind it', () => {
    const sim = quickSave({ dayJob: false, wealth: 'nothing' }, 'rehoused');
    setChecking(sim, 0);
    spend(sim, sim.player, rentOf(sim, sim.player) * 2, 'Rent', 'rent', true);
    days(sim, 33);
    expect(sim.player.home!.kind).toBe('sofa');
    setChecking(sim, arrearsOf(sim, sim.player) + moveCost(sim, sim.player, 'shared') * 3);
    days(sim, 2);
    expect(sim.player.home!.kind).toBe('shared');
    expect(sim.universe.notifications.some((n) => n.title === 'You Found A Room')).toBe(true);
  });
});

describe('moving', () => {
  it('costs a deposit and the rest of the month from checking, and gives the old deposit back', () => {
    const sim = quickSave({ dayJob: false, wealth: 'comfortable' }, 'move');
    const before = checking(sim).balance;
    const cost = moveCost(sim, sim.player, 'own');
    // The month's deposit held on the room they started in comes back first.
    const startingDeposit = deposit(sim)!.balance;
    expect(startingDeposit).toBe(rentOf(sim, sim.player));
    expect(sim.execute({ kind: 'home.move', payload: { kind: 'own' } }).ok).toBe(true);
    expect(before - checking(sim).balance).toBe(cost - startingDeposit);
    expect(sim.player.home!.kind).toBe('own');
    const held = deposit(sim)!.balance;
    const back = checking(sim).balance;
    const costBack = moveCost(sim, sim.player, 'shared');
    expect(sim.execute({ kind: 'home.move', payload: { kind: 'shared' } }).ok).toBe(true);
    expect(checking(sim).balance - back).toBe(held - costBack);
    // No money, no move, and the reason says what it takes.
    const broke = quickSave({ dayJob: false, wealth: 'nothing' }, 'move-broke');
    const answer = broke.execute({ kind: 'home.move', payload: { kind: 'own' } });
    expect(answer.ok).toBe(false);
    expect(answer.error).toMatch(/deposit/);
  });

  it('asks two months’ deposit of a poor record', () => {
    const good = quickSave({ dayJob: false, wealth: 'comfortable' }, 'deposit');
    const rent = rentOf(good, good.player);
    expect(depositFor(good, good.player, 'shared')).toBe(rent);
    good.player.credit!.score = 560;
    expect(depositFor(good, good.player, 'shared')).toBe(rent * 2);
  });
});

describe('the record', () => {
  it('rises each month for a card kept at zero, paid as agreed', () => {
    const sim = quickSave({ dayJob: false, wealth: 'comfortable' }, 'zero');
    expect(card(sim)!.balance).toBe(0);
    const score = sim.player.credit!.score;
    // The 20th of each month is a statement: January to June is six.
    sim.advanceTo(instantFromZoned({ year: 2026, month: 6, day: 25, hour: 7 }, sim.zone));
    expect(card(sim)!.balance).toBe(0);
    expect(sim.player.credit!.score).toBe(score + 6 * 3);
  });

  it('counts rent owed in a month the card owes nothing', () => {
    const sim = quickSave({ dayJob: false, wealth: 'comfortable' }, 'zero-owed');
    const score = sim.player.credit!.score;
    // No room on the card, nothing in the bank: the rent is owed to the landlord.
    card(sim)!.creditLimit = 0;
    setChecking(sim, 0);
    spend(sim, sim.player, rentOf(sim, sim.player), 'Rent', 'rent', true);
    expect(arrearsOf(sim, sim.player)).toBeGreaterThan(0);
    for (let d = 0; d < 20; d += 1) {
      setChecking(sim, 0);
      sim.advanceTo(startOfNextDay(sim.now, sim.zone) + 7 * MS_HOUR);
    }
    // January's statement, on the 20th, owed nothing: paid as agreed, less the rent owed.
    expect(sim.player.credit!.score).toBe(score + 3 - 10);
  });

  it('raises the card’s limit for a clean record at six months, and a late payment cuts it', () => {
    const sim = quickSave({ dayJob: false, wealth: 'comfortable' }, 'limit');
    const limit = card(sim)!.creditLimit!;
    days(sim, 200);
    expect(card(sim)!.creditLimit).toBe(Math.round(limit * 1.2 / 100) * 100);
    // Owe on it, empty checking, and let the payment come due.
    spend(sim, sim.player, checking(sim).balance + 10_000_00, 'Rent', 'rent', true);
    const raised = card(sim)!.creditLimit!;
    // The spend lands after July's statement, so August's states it and it falls
    // due in the middle of September.
    for (let d = 0; d < 60; d += 1) {
      setChecking(sim, 0);
      sim.advanceTo(startOfNextDay(sim.now, sim.zone) + 7 * MS_HOUR);
    }
    expect(sim.player.credit!.late.length).toBeGreaterThan(0);
    expect(card(sim)!.creditLimit!).toBeLessThan(raised);
    expect(card(sim)!.creditLimit!).toBeGreaterThanOrEqual(-card(sim)!.balance - 1);
  });
});

describe('the job', () => {
  it('pays tips at the end of a shift where the custom is to tip, and none where it isn’t', () => {
    const la = createSave(1, 'tips-la', { ...defaultConfig(), beforeActing: 'hospitality', homeRegionId: 'us-ca-losangeles', startLocationId: 'us-ca-losangeles', livesWhereBorn: true });
    const first = shifts(la)[0]!;
    la.advanceTo(first.at + 8 * MS_HOUR);
    const tips = la.universe.transactions.filter((t) => t.category === 'tips');
    expect(tips).toHaveLength(1);
    // Ten dollars an hour for seven hours of bar work.
    expect(tips[0]!.postings.find((p) => p.accountId === la.player.primaryAccountId)!.amount).toBe(70_00);
    const iceland = quickSave({ beforeActing: 'hospitality' }, 'tips-is');
    const shift = shifts(iceland)[0]!;
    iceland.advanceTo(shift.at + 8 * MS_HOUR);
    expect(iceland.universe.transactions.filter((t) => t.category === 'tips')).toHaveLength(0);
    expect(iceland.timeline.pending().filter((i) => i.kind === TIPS_KIND)).toHaveLength(0);
  });

  it('takes an extra shift on the first day this week not already worked, one at a time', () => {
    const sim = quickSave({}, 'extra');
    const job = jobFor('school');
    const answer = sim.execute<{ at: number }>({ kind: 'work.extra_shift', payload: {} });
    expect(answer.ok, answer.error).toBe(true);
    const p = zonedParts(answer.value!.at, sim.zone);
    expect(job.days).not.toContain(new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay());
    expect(p.hour).toBe(job.startHour);
    expect(sim.execute({ kind: 'work.extra_shift', payload: {} }).ok).toBe(false);
    // Asked on a Wednesday, the next four days are café days, so it's Monday.
    const midweek = quickSave({}, 'extra-midweek');
    midweek.advanceTo(instantFromZoned({ year: 2026, month: 1, day: 7, hour: 18 }, midweek.zone));
    const later = midweek.execute<{ at: number }>({ kind: 'work.extra_shift', payload: {} });
    expect(later.ok, later.error).toBe(true);
    const q = zonedParts(later.value!.at, midweek.zone);
    expect([q.month, q.day]).toEqual([1, 12]);
  });

  it('goes full-time from a week on, five eight-hour days, and withholds on the bigger year', () => {
    const sim = quickSave({}, 'full-time');
    const rate = withholdingRate(sim, sim.player);
    const answer = sim.execute<{ from: number }>({ kind: 'work.set_hours', payload: { fullTime: true } });
    expect(answer.ok, answer.error).toBe(true);
    const week = patternOf(jobFor('school'), true);
    expect(week.days).toHaveLength(5);
    expect(week.hours).toBe(8);
    const later = shifts(sim).filter((s) => s.at > answer.value!.from);
    expect(later.length).toBeGreaterThan(4);
    for (const s of later) expect(s.durationMinutes).toBe(8 * 60);
    // The week already promised stands, part-time.
    const promised = shifts(sim).filter((s) => s.at <= answer.value!.from);
    expect(promised.length).toBeGreaterThan(2);
    expect(promised.every((s) => s.durationMinutes === 7 * 60)).toBe(true);
    expect(withholdingRate(sim, sim.player)).toBeGreaterThan(rate);
    expect(sim.execute({ kind: 'work.set_hours', payload: { fullTime: true } }).ok).toBe(false);
  });
});

describe('the screens and the game agree', () => {
  it('on the rent a place card prints, and on how the record is said', () => {
    // Home printed the atlas's 473K for Mosfellsbær while the game charged
    // from Iceland's published 205,000.
    const sim = quickSave({}, 'agree');
    const place = placeProfile(sim, sim.player.currentLocationId)!;
    expect(place.localRent).toBe('205K kr');
    expect(place.medianRentCents).toBe(rentAt(sim.player.currentLocationId, 'USD').oneBed);
    // Starting Point printed the score as a number in Iceland, where Home says a word.
    const source = readFileSync('src/ui/creation/CharacterCreation.tsx', 'utf8');
    expect(source).not.toContain('<span className="stat-label">Credit Score</span>');
    expect(source.match(/scoreIsANumberIn\(config\.startLocationId\)/g)?.length).toBe(2);
  });
});

describe('what citizenship and risk decide', () => {
  it('gives a day job only where the citizenship has the right to work', async () => {
    await loadCountryCities('DE');
    const berlin = 'de-be-berlin';
    // Born in Mosfellsbær, working in Los Angeles: a visa café work doesn't get.
    const abroad = createSave(1, 'visa', { ...defaultConfig(), startLocationId: 'us-ca-losangeles', livesWhereBorn: false });
    expect(abroad.player.citizenshipId).toBe('is');
    expect(abroad.player.job).toBeUndefined();
    expect(mayWorkIn('is', 'us-ca-losangeles').may).toBe(false);
    // Born in Berlin, working in Mosfellsbær: the European Economic Area.
    const eea = createSave(1, 'eea', { ...defaultConfig(), homeRegionId: berlin, livesWhereBorn: false });
    expect(eea.player.citizenshipId).toBe('de');
    expect(eea.player.job?.jobId).toBe('school');
    // Britain and Ireland, and Australia and New Zealand, move freely; Britain and Germany don't now.
    expect(mayWorkIn('uk', 'ie-lei-dublin').may).toBe(true);
    expect(mayWorkIn('nz', 'au-nsw-sydney').may).toBe(true);
    expect(mayWorkIn('uk', berlin).may).toBe(false);
  });

  it('starts somebody who takes risks on the card’s minimum, and everybody else clearing it', () => {
    const cautious = quickSave({ personality: { ...defaultConfig().personality, riskTolerance: 30 } }, 'risk-low');
    const reckless = quickSave({ personality: { ...defaultConfig().personality, riskTolerance: 90 } }, 'risk-high');
    expect(cautious.player.credit!.autopay).toBe('full');
    expect(reckless.player.credit!.autopay).toBe('minimum');
  });
});

describe('what the audit found', () => {
  it('draws on savings once checking is empty, before the card', () => {
    const sim = quickSave({ dayJob: false, wealth: 'modest' }, 'sweep');
    const savings = accounts(sim).find((a) => a.kind === 'savings')!;
    const move = -checking(sim).balance;
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: checking(sim).id, amount: move }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -move }] });
    const before = savings.balance;
    const cardBefore = card(sim)!.balance;
    spend(sim, sim.player, 10_000_00, 'Rent', 'rent', true);
    expect(before - savings.balance).toBe(10_000_00);
    expect(card(sim)!.balance).toBe(cardBefore);
  });

  it('starts with the month’s deposit held on the home they live in', () => {
    const sim = quickSave({ dayJob: false }, 'held');
    expect(deposit(sim)!.balance).toBe(rentOf(sim, sim.player));
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('misses a plan slept through on autopilot, and keeps one the clock stopped at', () => {
    const sim = quickSave({ dayJob: false }, 'asleep-plan');
    const at = instantFromZoned({ year: 2026, month: 1, day: 7, hour: 7, minute: 30 }, sim.zone);
    const made = sim.execute<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Early Call', at } });
    sim.advanceTo(at + MS_HOUR);
    expect(sim.timeline.get(made.value!.id)!.status).toBe('missed');
  });

  it('won’t let anybody sleep on a shift', () => {
    const sim = quickSave({}, 'sleep-at-work');
    const first = shifts(sim)[0]!;
    sim.advanceTo(first.at + MS_HOUR);
    const answer = sim.execute({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(answer.ok).toBe(false);
    expect(answer.error).toMatch(/at work until/);
  });

  it('looks for work in three weeks where there’s a right to it, and quits', () => {
    const sim = quickSave({ dayJob: false }, 'find');
    const looking = sim.execute<{ until: number }>({ kind: 'work.find_job', payload: {} });
    expect(looking.ok, looking.error).toBe(true);
    expect(looking.value!.until - sim.now).toBe(21 * MS_DAY);
    days(sim, 23);
    expect(sim.player.job!.lookingUntil).toBeUndefined();
    expect(shifts(sim).length).toBeGreaterThan(0);
    expect(sim.execute({ kind: 'work.quit', payload: {} }).ok).toBe(true);
    expect(shifts(sim)).toHaveLength(0);
    const abroad = createSave(1, 'find-abroad', { ...defaultConfig(), startLocationId: 'us-ca-losangeles', livesWhereBorn: false });
    const refused = abroad.execute({ kind: 'work.find_job', payload: {} });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/visa/);
  });

  it('calls off an outdoor shift in a thunderstorm, unpaid and not held against anybody', () => {
    // A builder in Sydney, where the model gives thunderstorms their season, meets one.
    const sim = createSave(1, 'storm', { ...defaultConfig(), beforeActing: 'trades', homeRegionId: 'au-nsw-sydney', startLocationId: 'au-nsw-sydney', livesWhereBorn: true, wealth: 'inherited' });
    let calledOff = 0;
    for (let d = 0; d < 730 && calledOff === 0; d += 1) {
      days(sim, 1);
      calledOff = sim.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.calledOff === true).length;
    }
    expect(calledOff).toBeGreaterThan(0);
    const off = sim.universe.scheduled.find((i) => i.kind === SHIFT_KIND && i.payload.calledOff === true)!;
    expect(outdoorWeather(sim, 'au-nsw-sydney', off.at).calledOff).toBe(true);
    expect(sim.player.job!.unpaid.some((one) => one.at === off.at)).toBe(false);
    expect(sim.player.job!.missed).not.toContain(off.at);
  });
});
