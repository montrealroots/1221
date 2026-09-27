/**
 * Arrears settled on 2026-09-27, from `docs/UNBITTEN.md`: each entry here was
 * declared, written or said back and changed nothing, and each test moves
 * the input and watches the outcome move.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { GENRES } from '@/engine/content/career';
import { DISPOSED, LOVED_WORK, enjoyWork, lovedInWork, takeTheRoom } from '@/engine/systems/enjoyment';
import { OFFER_KIND, beginCareer, callStress, careerOf, genreOf, roleById, type Booking } from '@/engine/systems/career';
import { computeAnnualTax } from '@/engine/content/tax';
import type { Person } from '@/engine/domain/model';
import { CALLS } from '@/engine/content/career';
import { RECEIPTS } from '@/engine/content/safetynet';
import { applySleep, freshWellbeing } from '@/engine/systems/life';
import { careFor } from '@/engine/systems/health';
import { recordJobCost, recordWages } from '@/engine/systems/earnings';
import { figuresFor } from '@/engine/systems/taxreturn';
import { personalityOf } from '@/engine/systems/personality';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { bankById } from '@/engine/content/banks';
import { CHEX, ESTIMATE, FRANCE, FRENCH_CARDS, cardCeilingRoom, chargeForItem, lowestFirst, monthOrder, closeForOverdraft, declines, overdraftRoom, termsOf } from '@/engine/systems/lending';
import { spend } from '@/engine/systems/household';
import { inSaveMoney } from '@/engine/systems/banking';
import { BREAK_NOTICE } from '@/engine/systems/accountlife';
import { BONUSES, bonusRewards } from '@/engine/systems/cardoffers';
import { exchange } from '@/engine/content/currency';
import type { CreditState } from '@/engine/systems/credit';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
function pro(seed: string, extra: Record<string, unknown> = {}): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy', ...extra }, seed);
  sim.player.craft = { acting: 50, voice: 50, speech: 50, body: 50, text: 50, singing: 50, screen: 50 };
  beginCareer(sim, sim.player);
  return sim;
}
const body = (over: Partial<Person> = {}) => ({
  interests: [], genres: [], personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 },
  wellbeing: { energy: 70, sleepDebt: 0, condition: 80, fitness: 50, nourishment: 70, hygiene: 70, stress: 50, morale: 50 },
  ...over,
} as unknown as Person);

describe('a day of work, enjoyed', () => {
  it('finds what of theirs a job is: its medium, its genre, and the road', () => {
    const who = { interests: ['film', 'theatre', 'travel', 'voice_acting'], genres: ['horror'] };
    expect(lovedInWork(who, { medium: 'screen', after: 'film', genre: 'horror', away: true })).toEqual(['film', 'travel', 'horror']);
    expect(lovedInWork(who, { medium: 'screen', after: 'tv', genre: 'drama', away: false })).toEqual([]);
    expect(lovedInWork(who, { medium: 'stage', away: false })).toEqual(['theatre']);
    expect(lovedInWork(who, { medium: 'voice', away: false })).toEqual(['voice_acting']);
    expect(lovedInWork({ interests: ['television'], genres: [] }, { medium: 'screen', after: 'tv', away: false })).toEqual(['television']);
  });

  it('lifts the mood and eases the stress for each, and moves nothing else', () => {
    const plain = body();
    const loves = body({ interests: ['film'], genres: ['horror'] });
    const day = { medium: 'screen' as const, after: 'film' as const, genre: 'horror', away: false };
    enjoyWork(plain, day);
    enjoyWork(loves, day);
    expect(loves.wellbeing.morale - plain.wellbeing.morale).toBeCloseTo(2 * LOVED_WORK.mood, 10);
    expect(plain.wellbeing.stress - loves.wellbeing.stress).toBeCloseTo(2 * LOVED_WORK.relief, 10);
    for (const dial of ['energy', 'sleepDebt', 'condition', 'fitness', 'nourishment', 'hygiene'] as const) expect(loves.wellbeing[dial]).toBe(plain.wellbeing[dial]);
  });

  it('takes the room by extraversion, the road by openness and a rehearsal by agreeableness', () => {
    const shy = body({ personality: { ...body().personality, extraversion: 5 } });
    const bold = body({ personality: { ...body().personality, extraversion: 95 } });
    const even = body();
    for (const one of [shy, bold, even]) takeTheRoom(one);
    expect(shy.wellbeing.stress).toBeCloseTo(50 + DISPOSED.room * 0.9, 10);
    expect(bold.wellbeing.stress).toBeCloseTo(50 - DISPOSED.room * 0.9, 10);
    expect(even.wellbeing.stress).toBe(50);
    const open = body({ personality: { ...body().personality, openness: 95, agreeableness: 5 } });
    enjoyWork(open, { medium: 'stage', away: true });
    expect(open.wellbeing.morale).toBeCloseTo(50 + DISPOSED.away * 0.9, 10);
    const home = body({ personality: { ...body().personality, openness: 95, agreeableness: 5 } });
    enjoyWork(home, { medium: 'stage', away: false, rehearsal: true });
    expect(home.wellbeing.morale).toBeCloseTo(50 - DISPOSED.rehearsal * 0.9, 10);
  });

  it('files a job under a genre by its medium, and a commercial under none', () => {
    const count: Record<string, number> = {};
    for (let n = 0; n < 2000; n += 1) { const g = genreOf(roleById('costar'), (n + 0.5) / 2000).genre!; count[g] = (count[g] ?? 0) + 1; }
    for (const [genre, share] of GENRES.screen) expect(count[genre]! / 2000).toBeCloseTo(share, 2);
    expect(genreOf(roleById('commercial'), 0.3)).toEqual({});
    expect(genreOf(roleById('audiobook'), 0.3)).toEqual({});
    expect(genreOf(roleById('animation'), 0.3)).toEqual({ genre: 'animated' });
    expect(['drama', 'comedy', 'musical']).toContain(genreOf(roleById('broadway'), 0.9).genre);
    // An offer that comes in is filed under one.
    const sim = pro('filed');
    careerOf(sim.player).auditions.push({ id: 'a1', roleId: 'costar', at: sim.now, mode: 'room', cityId: 'us-ny-newyork', status: 'booked' });
    sim.schedule({ at: sim.now + 60_000, kind: OFFER_KIND, label: 'An Offer', category: 'system', priority: 20, payload: { personId: sim.player.id, auditionId: 'a1' } });
    sim.advanceTo(sim.now + 120_000);
    expect(GENRES.screen.map(([g]) => g)).toContain(careerOf(sim.player).bookings.at(-1)!.genre);
  });

  it('on a played job: a rehearsal day in a loved genre leaves the mood higher and the craft the same', () => {
    const run = (genres: string[]) => {
      const sim = pro('loved-day', { genres });
      const b: Booking = { id: 'j', roleId: 'lort-b', cityId: 'us-ny-newyork', starts: at(2026, 1, 12, 8), units: 1, rehearsalWeeks: 1, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0, genre: 'western' };
      careerOf(sim.player).bookings.push(b);
      expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'j' } }).ok).toBe(true);
      const until = at(2026, 1, 13, 15);
      while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * 3_600_000));
      expect(b.worked).toBe(1);
      return sim.player;
    };
    const loves = run(['western']);
    const plain = run([]);
    expect(loves.wellbeing.morale).toBeGreaterThan(plain.wellbeing.morale);
    expect(loves.craft).toEqual(plain.craft);
  }, 60_000);
});

describe('what a trait costs, where the game now reaches it', () => {
  const traited = (traits: string[], over: Partial<Person> = {}) => ({ ...body(), personalityTraits: traits, wellbeing: freshWellbeing(), ...over } as unknown as Person);

  it('takes less out of a resilient body in illness', () => {
    const sim = pro('resilient');
    const hit = (traits: string[]) => {
      sim.player.personalityTraits = traits;
      sim.player.wellbeing.condition = 80;
      careFor(sim, sim.player, { care: 'visit', what: 'The flu', flu: true }, sim.now);
      return 80 - sim.player.wellbeing.condition;
    };
    const plain = hit([]);
    const resilient = hit(['resilient']);
    expect(resilient / plain).toBeCloseTo(personalityOf(traited(['resilient']), 'illnessToll'), 6);
    expect(resilient).toBeLessThan(plain);
  });

  it('puts back less for a homebody on a night away, and more for a restless one', () => {
    const away = { home: { cityId: 'us-ny-newyork' }, currentLocationId: 'us-ga-atlanta' } as Partial<Person>;
    const home = { home: { cityId: 'us-ny-newyork' }, currentLocationId: 'us-ny-newyork' } as Partial<Person>;
    const night = (traits: string[], where: Partial<Person>) => { const p = traited(traits, where); p.wellbeing.energy = 20; applySleep(p, 7, 0.8); return p.wellbeing.energy; };
    expect(night(['homebody'], away)).toBeLessThan(night(['homebody'], home));
    expect(night(['restless'], away)).toBeGreaterThan(night(['restless'], home));
    expect(night([], away)).toBe(night([], home));
  });

  it('charges a night owl more for an early call and an early riser more for a late one', () => {
    const owl = personalityOf(traited(['night_owl']), 'earlyCall');
    const lark = personalityOf(traited(['early_riser']), 'earlyCall');
    expect(owl).toBeGreaterThan(1);
    expect(lark).toBeLessThan(1);
    expect(personalityOf(traited(['early_riser']), 'lateCall')).toBeGreaterThan(personalityOf(traited(['night_owl']), 'lateCall'));
    // A seven o'clock screen call, an evening's performance, an eleven o'clock rehearsal.
    expect(callStress(traited(['night_owl']), 7, false)).toBeCloseTo(CALLS.early * owl, 10);
    expect(callStress(traited([]), 7, false)).toBe(CALLS.early);
    expect(callStress(traited(['early_riser']), 19, true)).toBeCloseTo(CALLS.late * personalityOf(traited(['early_riser']), 'lateCall'), 10);
    expect(callStress(traited(['early_riser']), 11, false)).toBe(0);
    expect(callStress(traited([]), 9, false)).toBe(0);
  });

  it('deducts every receipt for somebody who keeps accounts, and fewer for the chaotic', () => {
    const tax = (traits: string[]) => {
      const sim = pro('receipts', { personalityTraits: traits });
      recordWages(sim.player, at(2027, 3, 1), NY, { gross: 100_000_00, commission: 8_000_00 });
      recordJobCost(sim.player, at(2027, 5, 1), 12_000_00);
      return figuresFor(sim.player, 2027).states.find((one) => one.state === 'us-ny')!.tax;
    };
    const kept = tax(['keeps_accounts']);
    const plain = tax([]);
    const chaotic = tax(['chaotic']);
    expect(kept).toBeLessThan(plain);
    expect(plain).toBeLessThan(chaotic);
    // Every receipt, and never more than was spent.
    expect(kept).toBe(computeAnnualTax(100_000_00, 'us-ny-newyork', at(2027, 12, 31, 12), { deductions: 20_000_00 - 2_000_00 - 8_000_00 }).regional);
    expect(RECEIPTS.kept * personalityOf(traited(['keeps_accounts']), 'receipts')).toBeGreaterThan(1);
  });
});

describe('the banks’ open rules', () => {
  const lifeIn = (cityId: string, bankId: string, seed: string, wealth: 'modest' | 'wealthy' = 'modest') =>
    quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth, bankId }, seed);
  const current = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
  const set = (sim: Simulation, account: Account, amount: number) => {
    const diff = amount - account.balance;
    if (diff) sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: account.id, amount: diff }, { accountId: sim.nominalAccount('equity', 'Test').id, amount: -diff }] });
  };

  it('reports a US charge-off to ChexSystems, and most banks turn the report away for five years, fewer once it’s paid', () => {
    const sim = lifeIn('us-ny-newyork', 'us-chase', 'chex');
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'savings') set(sim, a, 0);
    set(sim, current(sim), -400_00);
    closeForOverdraft(sim, sim.player, bankById('us-chase')!);
    expect(sim.player.chex).toEqual({ at: sim.now, bank: 'Chase' });
    // The money went to a bank that took the report, or, turned away everywhere, to a second-chance account.
    const moved = current(sim);
    expect(moved.secondChance === true || !declines(sim, sim.player, bankById(moved.bankId!)!)).toBe(true);
    // Across many reports: about 85% turned away while it's owed.
    const citi = bankById('us-citi')!;
    let turned = 0;
    for (let n = 0; n < 2000; n += 1) { sim.player.chex = { at: sim.now - n * 1000, bank: 'Chase' }; if (declines(sim, sim.player, citi)) turned += 1; }
    expect(turned / 2000).toBeCloseTo(CHEX.declines.unpaid, 1);
    // Paid, about half.
    set(sim, current(sim), 1_000_000_00);
    sim.must({ kind: 'bank.pay_collections', payload: { amount: 1_000_000_00 } });
    turned = 0;
    for (let n = 0; n < 2000; n += 1) { sim.player.chex = { at: sim.now - n * 1000, bank: 'Chase' }; if (declines(sim, sim.player, citi)) turned += 1; }
    expect(turned / 2000).toBeCloseTo(CHEX.declines.paid, 1);
    // Five years on, nobody reads it; and a bank outside the US never did.
    for (let n = 0; n < 200; n += 1) {
      sim.player.chex = { at: sim.now - CHEX.years * 365 * MS_DAY - n * 1000, bank: 'Chase' };
      expect(declines(sim, sim.player, citi)).toBe(false);
    }
    sim.player.chex = { at: sim.now, bank: 'Chase' };
    expect(declines(sim, sim.player, bankById('gb-natwest')!)).toBe(false);
  });

  it('refuses a switch the next bank turns away, and a second-chance account has no overdraft and a monthly fee', () => {
    const sim = lifeIn('us-ny-newyork', 'us-chase', 'chex-switch', 'wealthy');
    // A report no US bank here will take: find one each turns away.
    let at = sim.now;
    const others = ['us-citi', 'us-wells-fargo', 'us-bank-of-america', 'us-capital-one'].map((id) => bankById(id)!);
    set(sim, current(sim), -1_00);
    closeForOverdraft(sim, sim.player, bankById('us-chase')!);
    for (let n = 0; n < 5000; n += 1) { sim.player.chex = { at: at - n, bank: 'Chase' }; if (others.every((b) => declines(sim, sim.player, b))) { at -= n; break; } }
    sim.player.chex = { at, bank: 'Chase' };
    const to = others.find((b) => b.id !== current(sim).bankId)!;
    expect(sim.execute({ kind: 'bank.switch', payload: { bankId: to.id } })).toMatchObject({ ok: false });
    expect(String(sim.execute({ kind: 'bank.switch', payload: { bankId: to.id } }).error)).toMatch(/ChexSystems/);
    const acct = current(sim);
    acct.secondChance = true;
    set(sim, acct, 500_00);
    expect(overdraftRoom(sim, sim.player)).toBe(0);
    const firstOf = instantFromZoned({ year: 2026, month: 2, day: 1, hour: 12 }, NY);
    sim.advanceTo(firstOf);
    expect(sim.universe.transactions.some((t) => t.memo === 'Second chance account fee' && t.postings.some((p) => p.accountId === acct.id && p.amount === -CHEX.secondChanceFee))).toBe(true);
  }, 60_000);

  it('in France: writes at a month past the limit, gives notice at sixty days, offers a loan at three months, and closes two months after the notice', () => {
    const sim = lifeIn('fr-idf-paris', 'fr-bnp-paribas', 'fr-overrun');
    sim.player.home = undefined;
    // Nothing at the bank to set off against it.
    for (const one of Object.values(sim.universe.accounts)) if (one.ownerId === sim.player.id && one.kind === 'savings') set(sim, one, 0);
    const acct = current(sim);
    acct.overdraftLimit = undefined;
    set(sim, acct, -800_00);
    const titled = (t: string) => sim.universe.notifications.some((n) => n.title === t);
    sim.advanceBy((FRANCE.informAfterDays + 2) * MS_DAY);
    expect(titled('BNP Paribas Wrote About Your Overrun')).toBe(true);
    sim.advanceBy((ESTIMATE.closeAfterDays - FRANCE.informAfterDays) * MS_DAY);
    expect(acct.closingNoticed).toBe(true);
    expect(acct.creditOffered).toBeUndefined();
    expect(acct.closedAt).toBeUndefined();
    sim.advanceBy((FRANCE.offerAfterDays - ESTIMATE.closeAfterDays + 1) * MS_DAY);
    expect(acct.creditOffered?.months).toBe(FRANCE.offerMonths);
    expect(acct.closedAt).toBeUndefined();
    expect(acct.closedAt).toBeUndefined();
    sim.advanceBy((ESTIMATE.closeAfterDays + FRANCE.closingNoticeDays - FRANCE.offerAfterDays) * MS_DAY);
    expect(acct.closedAt).toBeDefined();
  }, 120_000);

  it('in France: taking the offered loan clears the overrun into a loan', () => {
    const sim = lifeIn('fr-idf-paris', 'fr-bnp-paribas', 'fr-take');
    sim.player.home = undefined;
    const acct = current(sim);
    acct.overdraftLimit = undefined;
    set(sim, acct, -800_00);
    sim.advanceBy((FRANCE.offerAfterDays + 3) * MS_DAY);
    const offer = acct.creditOffered!;
    const before = acct.balance;
    sim.must({ kind: 'bank.take_overrun_loan', payload: {} });
    expect(acct.balance).toBe(before + offer.amount);
    expect(acct.creditOffered).toBeUndefined();
    expect(sim.execute({ kind: 'bank.take_overrun_loan', payload: {} }).ok).toBe(false);
  }, 120_000);

  it('in France: a debit card pays against its ceiling, not the balance, and past the ceiling declines', () => {
    const sim = lifeIn('fr-idf-paris', 'fr-bnp-paribas', 'fr-ceiling', 'wealthy');
    const acct = current(sim);
    set(sim, acct, 100_000_00);
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'debit' } });
    const ceiling = inSaveMoney(sim, FRENCH_CARDS['fr-bnp-paribas']!.ceiling, 'EUR');
    expect(cardCeilingRoom(sim, sim.player)).toBeLessThanOrEqual(ceiling);
    // A month's shopping near the ceiling, on the card.
    sim.post({ memo: 'Groceries', category: 'food', postings: [{ accountId: acct.id, amount: -(cardCeilingRoom(sim, sim.player)! - 50_00) }, { accountId: sim.nominalAccount('expense', 'Food').id, amount: cardCeilingRoom(sim, sim.player)! - 50_00 }] });
    expect(cardCeilingRoom(sim, sim.player)).toBe(50_00);
    const card = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card' && !a.closedAt)!;
    expect(card).toBeDefined();
    // The credit card full: past the ceiling, the day isn't bought, though the bank holds plenty.
    const limit = card.creditLimit!;
    set(sim, card, -limit);
    expect(spend(sim, sim.player, 80_00, 'Groceries', 'food')).toBe(false);
    // With room on it, the credit card takes the day.
    set(sim, card, 0);
    expect(spend(sim, sim.player, 80_00, 'Groceries', 'food')).toBe(true);
    expect(card.balance).toBe(-80_00);
    // Under the ceiling, the debit card pays with plenty in the bank.
    expect(spend(sim, sim.player, 40_00, 'Groceries', 'food')).toBe(true);
    // Only the card's purchases count against it, not the rent from the account.
    const room = cardCeilingRoom(sim, sim.player)!;
    sim.post({ memo: 'Rent', category: 'rent', postings: [{ accountId: acct.id, amount: -1_000_00 }, { accountId: sim.nominalAccount('expense', 'Rent').id, amount: 1_000_00 }] });
    expect(cardCeilingRoom(sim, sim.player)).toBe(room);
    // Crédit Agricole's is a calendar month: last month's shopping is forgotten on the 1st, where a rolling 30 days would still count it.
    const ca = lifeIn('fr-idf-paris', 'fr-credit-agricole', 'fr-ca-month', 'wealthy');
    const caAcct = current(ca);
    set(ca, caAcct, 100_000_00);
    ca.post({ memo: 'Groceries', category: 'food', postings: [{ accountId: caAcct.id, amount: -1_000_00 }, { accountId: ca.nominalAccount('expense', 'Food').id, amount: 1_000_00 }] });
    const firstOfMonth = instantFromZoned({ year: 2026, month: 2, day: 1, hour: 6 }, 'Europe/Paris');
    while (ca.now < firstOfMonth) ca.advanceTo(Math.min(firstOfMonth, ca.now + 6 * 3_600_000));
    const spentSince = ca.universe.transactions.filter((t) => t.at >= instantFromZoned({ year: 2026, month: 2, day: 1, hour: 0 }, ca.homeZone) && t.category === 'food').flatMap((t) => t.postings).filter((x) => x.accountId === caAcct.id && x.amount < 0).reduce((a, x) => a - x.amount, 0);
    expect(cardCeilingRoom(ca, ca.player)).toBe(inSaveMoney(ca, FRENCH_CARDS['fr-credit-agricole']!.ceiling, 'EUR') - spentSince);
    // A bank with no ceiling here has none.
    const us = lifeIn('us-ny-newyork', 'us-chase', 'us-no-ceiling');
    expect(cardCeilingRoom(us, us.player)).toBeUndefined();
  });

  it('in the US: no fee on a small item, Bank of America’s two a day at most, and the tie order each bank posts in', () => {
    const chase = lifeIn('us-ny-newyork', 'us-chase', 'us-small');
    set(chase, current(chase), -200_00);
    chargeForItem(chase, chase.player, 5_00);
    expect(current(chase).pendingItems).toBeUndefined();
    chargeForItem(chase, chase.player, 5_01);
    expect(current(chase).pendingItems![0]!.count).toBe(1);
    // Through a purchase: a $4 one into the overdraft draws no item, a $20 one does.
    const buyer = lifeIn('us-ny-newyork', 'us-chase', 'us-small-buy');
    current(buyer).debitOverdraft = true;
    buyer.must({ kind: 'bank.set_payments', payload: { everyday: 'debit' } });
    for (const a of Object.values(buyer.universe.accounts)) if (a.ownerId === buyer.player.id && a.kind === 'savings') set(buyer, a, 0);
    set(buyer, current(buyer), -100_00);
    expect(spend(buyer, buyer.player, 4_00, 'Groceries', 'food')).toBe(true);
    expect(current(buyer).pendingItems).toBeUndefined();
    expect(spend(buyer, buyer.player, 20_00, 'Groceries', 'food')).toBe(true);
    expect(current(buyer).pendingItems![0]!.count).toBe(1);
    const bofa = lifeIn('us-ny-newyork', 'us-bank-of-america', 'us-bofa');
    set(bofa, current(bofa), -200_00);
    const fees = () => bofa.universe.transactions.filter((t) => t.memo === 'Overdraft fee').length;
    chargeForItem(bofa, bofa.player, 1_00);
    expect(fees()).toBe(0);
    for (let n = 0; n < 3; n += 1) chargeForItem(bofa, bofa.player, 20_00);
    expect(fees()).toBe(2);
    // Overdrawn by a dollar or less, no fee.
    const near = lifeIn('us-ny-newyork', 'us-bank-of-america', 'us-bofa-near');
    set(near, current(near), -1_00);
    chargeForItem(near, near.player, 20_00);
    expect(near.universe.transactions.filter((t) => t.memo === 'Overdraft fee')).toHaveLength(0);
    // Ties: Wells Fargo posts the lowest first, Chase and Bank of America the highest.
    const wf = lifeIn('us-ny-newyork', 'us-wells-fargo', 'us-wf');
    expect(lowestFirst(wf, wf.player)).toBe(true);
    expect(lowestFirst(chase, chase.player)).toBe(false);
    expect(lowestFirst(bofa, bofa.player)).toBe(false);
    // The smaller of rent and bills first at Wells Fargo, the larger first elsewhere.
    expect(monthOrder(wf, wf.player, 2_000_00, 150_00)).toEqual(['bills', 'rent']);
    expect(monthOrder(wf, wf.player, 100_00, 150_00)).toEqual(['rent', 'bills']);
    expect(monthOrder(chase, chase.player, 2_000_00, 150_00)).toEqual(['rent', 'bills']);
    expect(monthOrder(chase, chase.player, 100_00, 150_00)).toEqual(['bills', 'rent']);
  });

  it('on the 1st, posts the bills before the rent at a bank that takes the lowest first', () => {
    const order = (bankId: string) => {
      const sim = lifeIn('us-ny-newyork', bankId, `ties-${bankId}`, 'wealthy');
      // Rent from the bank on its day, where the norm here is a check, which clears later.
      sim.must({ kind: 'bank.set_payments', payload: { rent: 'auto', bills: 'auto' } });
      const first = instantFromZoned({ year: 2026, month: 2, day: 1, hour: 21 }, NY);
      while (sim.now < first) sim.advanceTo(Math.min(first, sim.now + 6 * 3_600_000));
      const month = sim.universe.transactions.filter((t) => t.at >= first - 2 * 3_600_000 && (t.category === 'rent' || t.category === 'bills'));
      return month.map((t) => t.category);
    };
    expect(order('us-wells-fargo').slice(0, 2)).toEqual(['bills', 'rent']);
    expect(order('us-chase').slice(0, 2)).toEqual(['rent', 'bills']);
  }, 120_000);

  it('at NatWest: an early close on 35 days’ notice, closed when it runs', () => {
    const sim = lifeIn('uk-eng-london', 'gb-natwest', 'nw-notice', 'wealthy');
    set(sim, current(sim), 20_000_00);
    sim.must({ kind: 'bank.open_term', payload: { amount: 10_000_00 } });
    const term = termsOf(sim, sim.player).at(-1)!;
    const asked = sim.now;
    const answer = sim.must({ kind: 'bank.break_term', payload: { accountId: term.id } }) as { at: number };
    expect(answer.at).toBe(asked + BREAK_NOTICE['gb-natwest']! * MS_DAY);
    expect(term.closedAt).toBeUndefined();
    expect(sim.execute({ kind: 'bank.break_term', payload: { accountId: term.id } }).ok).toBe(false);
    sim.advanceBy((BREAK_NOTICE['gb-natwest']! - 1) * MS_DAY);
    expect(term.closedAt).toBeUndefined();
    sim.advanceBy(2 * MS_DAY);
    expect(term.closedAt).toBeDefined();
    // Another bank breaks it at once.
    const chase = lifeIn('us-ny-newyork', 'us-chase', 'chase-break', 'wealthy');
    set(chase, current(chase), 20_000_00);
    chase.must({ kind: 'bank.open_term', payload: { amount: 10_000_00 } });
    const t2 = termsOf(chase, chase.player).at(-1)!;
    chase.must({ kind: 'bank.break_term', payload: { accountId: t2.id } });
    expect(t2.closedAt).toBe(chase.now);
  }, 60_000);
});

describe('a card’s bonus categories', () => {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'modest' }, 'bonus');
  const card = (bankId: string) => ({ bankId } as unknown as Account);
  const cad = (c: number) => exchange(c, 'CAD', 'USD')!;

  it('pays BMO’s 3% on groceries and 1% on bills to $500 a cycle each, and 0.5% past it and on the rest', () => {
    const credit = {} as CreditState;
    const got = bonusRewards(sim, card('ca-bmo'), credit, 0.005, { food: cad(800_00), bills: cad(200_00), other: 10_000 }, 1);
    expect(got).toBe(Math.round(cad(500_00) * 0.03 + (cad(800_00) - cad(500_00)) * 0.005 + cad(200_00) * 0.01 + 10_000 * 0.005));
    // A new cycle, a new cap.
    expect(bonusRewards(sim, card('ca-bmo'), credit, 0.005, { food: cad(100_00), bills: 0, other: 0 }, 2)).toBe(Math.round(cad(100_00) * 0.03));
    // And the last cycle's tally is gone, not kept.
    expect(Object.keys(credit.bonusUsed!).every((k) => k.endsWith('@c2'))).toBe(true);
  });

  it('pays RBC 1% past its first $6,000 of groceries a year, above its 0.5% base', () => {
    const credit = {} as CreditState;
    const big = cad(8_000_00);
    expect(bonusRewards(sim, card('ca-rbc'), credit, 0.005, { food: big, bills: 0, other: 0 }, 1)).toBe(Math.round(cad(6_000_00) * 0.02 + (big - cad(6_000_00)) * 0.01));
  });

  it('holds Bank of America’s 2% on groceries to $2,500 a quarter across statements, and 1% past it', () => {
    const credit = {} as CreditState;
    expect(bonusRewards(sim, card('us-bank-of-america'), credit, 0.01, { food: 2_000_00, bills: 0, other: 0 }, 1)).toBe(4_000);
    // The same quarter: $500 more at 2%, the rest at 1%.
    expect(bonusRewards(sim, card('us-bank-of-america'), credit, 0.01, { food: 1_000_00, bills: 0, other: 500_00 }, 2)).toBe(Math.round(500_00 * 0.02 + 500_00 * 0.01 + 500_00 * 0.01));
  });

  it('shares Scotiabank’s $15,000 a year among its categories, and pays CIBC’s without a cap', () => {
    const credit = {} as CreditState;
    const big = cad(10_000_00);
    expect(bonusRewards(sim, card('ca-scotiabank'), credit, 0.005, { food: big, bills: big, other: 0 }, 1)).toBe(Math.round(cad(15_000_00) * 0.01 + (2 * big - cad(15_000_00)) * 0.005));
    expect(bonusRewards(sim, card('ca-cibc'), {} as CreditState, 0.005, { food: big, bills: big, other: 100_00 }, 1)).toBe(Math.round(big * 0.02 + big * 0.01 + 100_00 * 0.005));
  });

  it('pays a card without a bonus its base rate on everything, and Santander Mexico nothing outside its categories', () => {
    expect(bonusRewards(sim, card('us-chase'), {} as CreditState, 0.015, { food: 100_00, bills: 100_00, other: 100_00 }, 1)).toBe(450);
    expect(BONUSES['us-chase']).toBeUndefined();
    expect(bonusRewards(sim, card('mx-santander'), {} as CreditState, 0.01, { food: 100_00, bills: 100_00, other: 100_00 }, 1)).toBe(100);
  });
});
