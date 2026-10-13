/**
 * Arrears settled on 2026-09-27, from `docs/UNBITTEN.md`: each entry here was
 * declared, written or said back and changed nothing, and each test moves
 * the input and watches the outcome move.
 */
import { quickSave } from '@/engine';
import { bankById } from '@/engine/content/banks';
import { exchange } from '@/engine/content/currency';
import { computeAnnualTax } from '@/engine/content/tax';
import type { Account } from '@/engine/core/ledger';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY,instantFromZoned } from '@/engine/core/time';
import type { Person } from '@/engine/domain/model';
import { BREAK_NOTICE } from '@/engine/systems/accountlife';
import { inSaveMoney } from '@/engine/systems/banking';
import { BONUSES,bonusRewards } from '@/engine/systems/cardoffers';
import type { CreditState } from '@/engine/systems/credit';
import { recordWages } from '@/engine/systems/earnings';
import { DISPOSED,LOVED_WORK,enjoyWork,lovedInWork,takeTheHouse } from '@/engine/systems/enjoyment';
import { careFor } from '@/engine/systems/health';
import { CHEX,FRENCH_CARDS,cardCeilingRoom,chargeForItem,closeForOverdraft,declines,lowestFirst,monthOrder,overdraftRoom,termsOf } from '@/engine/systems/lending';
import { freshWellbeing } from '@/engine/systems/life';
import { personalityOf } from '@/engine/systems/personality';
import { evenCraft } from '@/engine/systems/school';
import { spend } from '@/engine/systems/spending';
import { figuresFor } from '@/engine/systems/taxreturn';
import { describe,expect,it } from 'vitest';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
function pro(seed: string, extra: Record<string, unknown> = {}): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy', ...extra }, seed);
  sim.player.craft = evenCraft(50);
  return sim;
}
const body = (over: Partial<Person> = {}) => ({
  genres: [], personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, emotionalStability: 50, ambition: 50, riskTolerance: 50 },
  wellbeing: { energy: 70, sleepDebt: 0, condition: 80, fitness: 50, nourishment: 70, hygiene: 70, stress: 50, morale: 50 },
  ...over,
} as unknown as Person);

describe('a day of work, enjoyed', () => {
  // Until 2026-10-10 a job's medium, the road and its crafts were matched against the interests too; the owner removed them.
  it('finds the first of a play’s kinds they love, once however many they love', () => {
    const who = { genres: ['horror', 'comedy', 'tragedy'] };
    expect(lovedInWork(who, { genres: ['tragedy', 'comedy'] })).toEqual(['tragedy']);
    expect(lovedInWork(who, { genres: ['drama'] })).toEqual([]);
    expect(lovedInWork(who, {})).toEqual([]);
    expect(lovedInWork({ genres: [] }, { genres: ['comedy'] })).toEqual([]);
  });

  it('lifts the mood and eases the stress once for a loved kind, and moves nothing else', () => {
    const plain = body();
    const loves = body({ genres: ['comedy', 'tragedy'] });
    const day = { genres: ['comedy', 'tragedy'] };
    enjoyWork(plain, day);
    enjoyWork(loves, day);
    expect(loves.wellbeing.morale - plain.wellbeing.morale).toBeCloseTo(LOVED_WORK.mood, 10);
    expect(plain.wellbeing.stress - loves.wellbeing.stress).toBeCloseTo(LOVED_WORK.relief, 10);
    for (const dial of ['energy', 'sleepDebt', 'condition', 'fitness', 'nourishment', 'hygiene'] as const) expect(loves.wellbeing[dial]).toBe(plain.wellbeing[dial]);
  });

  // Until 2026-10-13 this took the road by openness too (`WorkDay.away`), which no day in the game set: it went that day.
  it('takes the room by extraversion, new work by openness and a rehearsal by agreeableness', () => {
    const shy = body({ personality: { ...body().personality, extraversion: 5 } });
    const bold = body({ personality: { ...body().personality, extraversion: 95 } });
    const even = body();
    // A house watching, from 2026-10-09; an audition's room until then.
    for (const one of [shy, bold, even]) takeTheHouse(one);
    expect(shy.wellbeing.stress).toBeCloseTo(50 + DISPOSED.room * 0.9, 10);
    expect(bold.wellbeing.stress).toBeCloseTo(50 - DISPOSED.room * 0.9, 10);
    expect(even.wellbeing.stress).toBe(50);
    // New work, from 2026-10-09, as the road was, with a blunt company that a day not of rehearsal doesn’t read.
    const open = body({ personality: { ...body().personality, openness: 95, agreeableness: 5 } });
    enjoyWork(open, { novel: true });
    expect(open.wellbeing.morale).toBeCloseTo(50 + DISPOSED.away * 0.9, 10);
    const fresh = body({ personality: { ...body().personality, openness: 95, agreeableness: 50 } });
    enjoyWork(fresh, { novel: true });
    expect(fresh.wellbeing.morale).toBeCloseTo(50 + DISPOSED.away * 0.9, 10);
    const home = body({ personality: { ...body().personality, openness: 95, agreeableness: 5 } });
    enjoyWork(home, { rehearsal: true });
    expect(home.wellbeing.morale).toBeCloseTo(50 - DISPOSED.rehearsal * 0.9, 10);
  });
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

  // Until 2026-10-14 this held Keeps Accounts to deducting every receipt of the work's other costs and Chaotic to fewer,
  // on a cost the test recorded by hand (`recordJobCost`, which nothing in play called). The owner had the `receipts`
  // knob go that day, with `recordJobCost` and the return's line that read them: the return is the same whoever keeps
  // accounts, and its New York itemizing takes the commission alone.
  it('files the same return for somebody who keeps accounts, the chaotic and the plain: the receipts knob went on 2026-10-14', () => {
    const tax = (traits: string[]) => {
      const sim = pro('receipts', { personalityTraits: traits });
      recordWages(sim.player, at(2027, 3, 1), NY, { gross: 100_000_00, commission: 8_000_00 });
      return figuresFor(sim.player, 2027).states.find((one) => one.state === 'us-ny')!.tax;
    };
    const plain = tax([]);
    expect(tax(['keeps_accounts'])).toBe(plain);
    expect(tax(['chaotic'])).toBe(plain);
    // The standard deduction beats the commission over 2% of income: nothing itemized.
    expect(plain).toBe(computeAnnualTax(100_000_00, 'us-ny-newyork', at(2027, 12, 31, 12), {}).regional);
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
    // Its own fee and no other: the ordinary account's isn't charged beside it.
    expect(sim.universe.transactions.some((t) => t.memo === `Monthly fee: ${acct.name}`)).toBe(false);
  }, 60_000);

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

  it('in Canada: overdraft protection by the use instead of the month, once a day at TD, where the bank sells it so', () => {
    const sim = lifeIn('ca-on-toronto', 'ca-td', 'ca-per-use', 'wealthy');
    const acct = current(sim);
    acct.overdraftLimit = 1_000_00;
    acct.overdraftPerUse = true;
    const fees = () => sim.universe.transactions.filter((t) => t.memo === 'Overdraft fee').length;
    set(sim, acct, -50_00);
    chargeForItem(sim, sim.player, 50_00);
    set(sim, acct, -80_00);
    chargeForItem(sim, sim.player, 30_00);
    expect(fees()).toBe(1);
    // RBC sells no pay-per-use: nothing by the use.
    const rbc = lifeIn('ca-on-toronto', 'ca-rbc', 'ca-rbc-use', 'wealthy');
    Object.assign(current(rbc), { overdraftLimit: 1_000_00, overdraftPerUse: true });
    set(rbc, current(rbc), -50_00);
    chargeForItem(rbc, rbc.player, 50_00);
    expect(rbc.universe.transactions.filter((t) => t.memo === 'Overdraft fee')).toHaveLength(0);
  });

  it('in France: LCL’s 21.02% on an unauthorized overdraft, a day at a time, beside its commission', () => {
    const sim = lifeIn('fr-idf-paris', 'fr-lcl', 'fr-lcl-rate');
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.kind === 'savings') set(sim, a, 0);
    const acct = current(sim);
    set(sim, acct, -1_000_00);
    acct.odAccrued = 0;
    sim.advanceBy(86_400_000);
    expect(acct.odAccrued).toBeGreaterThan(0);
    expect(acct.odAccrued!).toBeCloseTo((-acct.balance) * 0.2102 / 365, -1);
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

  // A Korean card's phone-bill bonus, after a month of the spending it asks, was tested here until 2026-10-09, when the
  // bills' bonuses went: nothing pays a bill since the home and its phone went.
  it('leaves the Korean cards and the bills without a bonus: nothing pays a bill now', () => {
    expect(BONUSES['kr-kb-kookmin']).toBeUndefined();
    expect(BONUSES['kr-shinhan']).toBeUndefined();
    expect(Object.values(BONUSES).every((b) => !('bills' in b))).toBe(true);
  });

  it('pays BMO’s 3% on groceries to $500 a cycle, and 0.5% past it and on the rest', () => {
    const credit = {} as CreditState;
    const got = bonusRewards(sim, card('ca-bmo'), credit, 0.005, { food: cad(800_00), other: 10_000 }, 1);
    expect(got).toBe(Math.round(cad(500_00) * 0.03 + (cad(800_00) - cad(500_00)) * 0.005 + 10_000 * 0.005));
    // A new cycle, a new cap.
    expect(bonusRewards(sim, card('ca-bmo'), credit, 0.005, { food: cad(100_00), other: 0 }, 2)).toBe(Math.round(cad(100_00) * 0.03));
    // And the last cycle's tally is gone, not kept.
    expect(Object.keys(credit.bonusUsed!).every((k) => k.endsWith('@c2'))).toBe(true);
  });

  it('pays RBC 1% past its first $6,000 of groceries a year, above its 0.5% base', () => {
    const credit = {} as CreditState;
    const big = cad(8_000_00);
    expect(bonusRewards(sim, card('ca-rbc'), credit, 0.005, { food: big, other: 0 }, 1)).toBe(Math.round(cad(6_000_00) * 0.02 + (big - cad(6_000_00)) * 0.01));
  });

  it('holds Bank of America’s 2% on groceries to $2,500 a quarter across statements, and 1% past it', () => {
    const credit = {} as CreditState;
    expect(bonusRewards(sim, card('us-bank-of-america'), credit, 0.01, { food: 2_000_00, other: 0 }, 1)).toBe(4_000);
    // The same quarter: $500 more at 2%, the rest at 1%.
    expect(bonusRewards(sim, card('us-bank-of-america'), credit, 0.01, { food: 1_000_00, other: 500_00 }, 2)).toBe(Math.round(500_00 * 0.02 + 500_00 * 0.01 + 500_00 * 0.01));
  });

  it('holds Scotiabank’s 1% to $15,000 a year, and pays CIBC’s without a cap', () => {
    const credit = {} as CreditState;
    const big = cad(10_000_00);
    expect(bonusRewards(sim, card('ca-scotiabank'), credit, 0.005, { food: big, other: 0 }, 1)).toBe(Math.round(big * 0.01));
    expect(bonusRewards(sim, card('ca-scotiabank'), credit, 0.005, { food: big, other: 0 }, 1)).toBe(Math.round((cad(15_000_00) - big) * 0.01 + (2 * big - cad(15_000_00)) * 0.005));
    expect(bonusRewards(sim, card('ca-cibc'), {} as CreditState, 0.005, { food: big, other: 100_00 }, 1)).toBe(Math.round(big * 0.02 + 100_00 * 0.005));
  });

  it('pays a card without a bonus its base rate on everything, and Santander Mexico nothing outside its categories', () => {
    expect(bonusRewards(sim, card('us-chase'), {} as CreditState, 0.015, { food: 100_00, other: 200_00 }, 1)).toBe(450);
    expect(BONUSES['us-chase']).toBeUndefined();
    // 1% of the groceries; the bills' 4% on telecoms went on 2026-10-09.
    expect(bonusRewards(sim, card('mx-santander'), {} as CreditState, 0.01, { food: 100_00, other: 200_00 }, 1)).toBe(100);
  });
});
