/**
 * The bank journey (the owner's audit of 2026-10-06): a life in New York at
 * Wells Fargo run through Your Bank by the same commands the screens run, each
 * step reading what the one before it left.
 *
 * Wages paid in; alerts set; money moved to savings, and refused past what the
 * account held with nothing moved; cash from the machine and some of it paid
 * into savings; a standing order that went on its day and, canceled, didn't go
 * the next month; a scheduled payment that went and a canceled one that
 * didn't. Somebody else's use of the debit card, on a day the seed was chosen
 * for: caught by the alert, disputed the same day, the card stopped (the day's
 * groceries went on the credit card meanwhile) and replaced, and the money back
 * less the $50 Regulation E leaves the holder. A purchase on the credit card,
 * refused while it was locked; a cash advance and its fee; the statement on its
 * day with its minimum due; part paid by hand, the rest of the minimum taken by
 * autopay, the balance carried and its interest charged at the next statement;
 * the rewards redeemed and the card paid off, once. February's rent check
 * stopped before it was cashed, for the bank's fee, and still owed. A loan
 * borrowed, its first month charged and taken, and paid off; a CD opened, its
 * interest taken during the term, and broken for 91 days' interest. The credit
 * card lost and replaced on a new number; a second card applied for, made the
 * everyday card, overpaid and its credit sent back; the first card closed;
 * savings closed into checking and opened again. Saved and loaded twice on the
 * way, and every law of the world holding at the end.
 *
 * A second life in Dublin covers what the American bank doesn't do: an
 * arranged overdraft and its fee, taken once; a term deposit canceled inside
 * the fourteen cooling-off days, and one kept that AIB won't break but pays
 * interest on, less DIRT; and a bills direct debit taken back under SEPA's
 * eight weeks, owed again, and not taken back twice.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned, normalDate, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { CLOTHING_PRODUCTS } from '@/engine/content/clothingcatalog';
import { bankAccountsOf } from '@/engine/systems/banking';
import { cardOf, cardsOf, cardTerms, minimumDue, stateOf } from '@/engine/systems/credit';
import { paymentsOf } from '@/engine/systems/payments';

const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);
const bal = (sim: Simulation, id: string) => sim.universe.accounts[id]!.balance;
/** The transactions since an instant whose memo matches. */
const posted = (sim: Simulation, re: RegExp, since = 0) => sim.universe.transactions.filter((t) => t.at >= since && re.test(t.memo));
/** What a transaction did to one account. */
const on = (t: { postings: { accountId: string; amount: number }[] }, id: string) => t.postings.filter((p) => p.accountId === id).reduce((a, p) => a + p.amount, 0);
/** A day of the month at an hour, in the life's zone. */
const day = (sim: Simulation, month: number, d: number, hour = 12) => instantFromZoned({ year: 2026, month, day: d, hour }, sim.zone);
/** Noon tomorrow, when the shops are open. */
const nextNoon = (sim: Simulation) => { const p = zonedParts(sim.now + MS_DAY, sim.zone); return instantFromZoned({ ...normalDate(p.year, p.month, p.day), hour: 12 }, sim.zone); };
/** Money arriving the way it arrives: a posting from somewhere, never a balance typed in. */
const wages = (sim: Simulation, cents: number) => sim.post({
  memo: 'Wages', category: 'salary',
  postings: [{ accountId: sim.player.primaryAccountId!, amount: cents }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -cents }],
});

describe('a year of banking in New York', () => {
  it('moves, saves, schedules, spends, disputes, borrows and pays off, with a save and load in the middle', () => {
    // The seed was found by scanning `fraudOn` (`bank.fraud`'s draw) over the first thirty days of 3,000 seeds: this one's debit card is used by somebody else on the 8th of January, the first of five that were.
    let sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy', bankId: 'us-wells-fargo' }, 'journey-bank-153');
    const checking = sim.player.primaryAccountId!;
    const savings = bankAccountsOf(sim, sim.player).find((a) => a.kind === 'savings')!.id;
    const card = cardOf(sim, sim.player)!.id;
    const start = sim.now;

    // A month's wages paid in, which the bank lends against.
    wages(sim, 6_000_00);

    // Alerts: told of a payment of $100 or more.
    sim.must({ kind: 'bank.set_alerts', payload: { largePayment: 100_00 } });
    expect(sim.player.alerts?.largePayment).toBe(100_00);

    // A second savings account isn't opened beside the first.
    expect(sim.execute({ kind: 'bank.open_savings', payload: {} }).error).toBe('You already have a savings account.');

    // Moved to savings, to the cent; past what checking holds, refused and nothing moved.
    let [c0, s0] = [bal(sim, checking), bal(sim, savings)];
    sim.must({ kind: 'bank.transfer', payload: { fromId: checking, toId: savings, amount: 1_000_00 } });
    expect(bal(sim, checking)).toBe(c0 - 1_000_00);
    expect(bal(sim, savings)).toBe(s0 + 1_000_00);
    [c0, s0] = [bal(sim, checking), bal(sim, savings)];
    expect(sim.execute({ kind: 'bank.transfer', payload: { fromId: checking, toId: savings, amount: c0 + 1 } }).ok).toBe(false);
    expect([bal(sim, checking), bal(sim, savings)]).toEqual([c0, s0]);

    // Cash from the bank's own machine into the wallet, and some of it paid into savings.
    const out = sim.must<{ fee: number }>({ kind: 'cash.withdraw', payload: { amount: 200_00, from: 'atm' } });
    expect(bal(sim, checking)).toBe(c0 - 200_00 - out.fee);
    const wallet = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'cash')!.id;
    const w0 = bal(sim, wallet);
    sim.must({ kind: 'cash.deposit', payload: { amount: 50_00, toId: savings, at: 'counter' } });
    expect(bal(sim, wallet)).toBe(w0 - 50_00);
    expect(bal(sim, savings)).toBe(s0 + 50_00);
    expect(sim.execute({ kind: 'cash.deposit', payload: { amount: w0 + 1, toId: savings, at: 'counter' } }).error).toMatch(/^You have .* in cash\.$/);
    expect(bal(sim, wallet)).toBe(w0 - 50_00);

    // A standing order into savings on the 10th; a payment back from savings on the 12th, and another on the 14th thought better of.
    const order = sim.must<{ id: string }>({ kind: 'bank.add_standing_order', payload: { toId: savings, amount: 250_00, day: 10 } }).id;
    expect(sim.execute({ kind: 'bank.add_standing_order', payload: { toId: checking, amount: 250_00, day: 10 } }).error).toBe('A standing order of your own goes into one of your savings accounts.');
    sim.must({ kind: 'bank.schedule_payment', payload: { fromId: savings, toId: checking, amount: 400_00, at: day(sim, 1, 12, 9) } });
    const second = sim.must<{ id: string }>({ kind: 'bank.schedule_payment', payload: { fromId: savings, toId: checking, amount: 300_00, at: day(sim, 1, 14, 9) } }).id;
    sim.must({ kind: 'bank.cancel_scheduled', payload: { id: second } });
    // Canceled twice, the second is refused.
    expect(sim.execute({ kind: 'bank.cancel_scheduled', payload: { id: second } }).error).toBe('There’s no payment waiting by that name.');

    // On the credit card at a store at noon; then locked, and the same purchase refused with nothing charged.
    sim.advanceTo(day(sim, 1, 5));
    const tee = CLOTHING_PRODUCTS.find((p) => p.id === 'us-uniqlo-supima-cotton-t-shirt')!;
    const buy = { productId: tee.id, how: 'store', size: 'M', color: tee.colors[0], quantity: 10, payWith: 'credit' };
    let k0 = bal(sim, card);
    let c1 = bal(sim, checking);
    sim.must({ kind: 'clothes.buy', payload: buy });
    const spent = k0 - bal(sim, card);
    expect(spent).toBeGreaterThan(0);
    expect(bal(sim, checking)).toBe(c1);
    sim.must({ kind: 'card.lock', payload: { which: 'credit', locked: true } });
    k0 = bal(sim, card);
    expect(sim.execute({ kind: 'clothes.buy', payload: buy }).ok).toBe(false);
    expect(bal(sim, card)).toBe(k0);
    sim.must({ kind: 'card.lock', payload: { which: 'credit', locked: false } });
    // Cash on the card, for its fee: $10 or 5%, whichever is more.
    k0 = bal(sim, card);
    const advance = sim.must<{ fee: number }>({ kind: 'cash.withdraw', payload: { amount: 100_00, from: 'card' } });
    expect(advance.fee).toBe(10_00);
    expect(bal(sim, card)).toBe(k0 - 110_00);
    expect(stateOf(sim.player, sim.universe.accounts[card]!).cashOwed).toBe(100_00);
    sim.must({ kind: 'finance.set_autopay', payload: { mode: 'minimum' } });

    // Somebody else's use of the debit card on the 8th: over the alert's line, so known of at once.
    sim.advanceTo(day(sim, 1, 8, 13));
    const fraud = sim.player.fraud ?? [];
    expect(fraud).toHaveLength(1);
    const stolen = fraud[0]!;
    expect(stolen).toMatchObject({ accountId: checking, which: 'debit' });
    expect(stolen.learnedAt).toBe(stolen.at);
    expect(sim.universe.notifications.some((n) => n.title === 'A Large Payment' && n.body.includes('debit card'))).toBe(true);
    const oldLast4 = sim.universe.accounts[checking]!.plastic!.last4;

    // Disputed the same day: Regulation E leaves the holder $50 of it, and the card is stopped and replaced.
    const disputed = sim.must<{ carried: number; refundAt: number }>({ kind: 'card.dispute', payload: { index: 0 } });
    expect(disputed.carried).toBe(50_00);
    expect(sim.universe.accounts[checking]!.plastic!.stopped).toBeTruthy();
    expect(sim.execute({ kind: 'card.dispute', payload: { index: 0 } }).error).toBe('You’ve reported it already.');
    // A stopped debit card takes nothing from a machine; the counter still pays out.
    c1 = bal(sim, checking);
    expect(sim.execute({ kind: 'cash.withdraw', payload: { amount: 20_00, from: 'atm' } }).error).toBe('Your debit card is stopped; the counter can still pay out.');
    expect(bal(sim, checking)).toBe(c1);
    const counter = sim.must<{ fee: number }>({ kind: 'cash.withdraw', payload: { amount: 20_00, from: 'counter' } });
    expect(bal(sim, checking)).toBe(c1 - 20_00 - counter.fee);

    // Saved and loaded with the standing order, the scheduled payment and the refund all still ahead.
    sim = reload(sim);
    expect(paymentsOf(sim.player).standingOrders.map((o) => o.id)).toEqual([order]);
    expect(sim.player.fraud?.[0]?.reportedAt).toBeDefined();
    expect(sim.universe.scheduled.some((i) => i.kind === 'bank.fraud_refund' && i.status === 'pending')).toBe(true);

    // The 10th, the 12th and the 14th: the order and the first payment made, the canceled one not.
    sim.advanceTo(day(sim, 1, 15));
    const so = posted(sim, /^Standing order to /, start);
    expect(so).toHaveLength(1);
    expect(on(so[0]!, savings)).toBe(250_00);
    expect(on(so[0]!, checking)).toBe(-250_00);
    expect(zonedParts(so[0]!.at, sim.zone).day).toBe(10);
    const sp = posted(sim, /^Scheduled payment to /, start);
    expect(sp).toHaveLength(1);
    expect(on(sp[0]!, checking)).toBe(400_00);
    expect(zonedParts(sp[0]!.at, sim.zone).day).toBe(12);

    // The refund, in the law's ten business days: all of it but the $50.
    sim.advanceTo(Math.max(sim.now, disputed.refundAt) + MS_DAY);
    const refund = posted(sim, /^Refund: a payment you didn’t make$/, start);
    expect(refund).toHaveLength(1);
    expect(on(refund[0]!, checking)).toBe(stolen.amount - 50_00);
    // And the new debit card, on a new number.
    const plastic = sim.universe.accounts[checking]!.plastic!;
    expect(plastic.stopped).toBeFalsy();
    expect(plastic.last4).not.toBe(oldLast4);
    // The statement on the 20th: what was owed then, with its minimum due on the 14th of February.
    const cardAccount = () => sim.universe.accounts[card]!;
    const statedAt = day(sim, 1, 20, 9);
    const onCard = (t: { at: number }) => t.at <= statedAt;
    const charged = posted(sim, /./, start).filter(onCard).reduce((a, t) => a + on(t, card), 0);
    let credit = stateOf(sim.player, cardAccount());
    expect(credit.statementBalance).toBe(-charged);
    // The stopped debit card sent the day's groceries to the credit card until the new one came.
    const groceries = posted(sim, /^Groceries$/, start).filter((t) => onCard(t) && on(t, card) < 0);
    expect(groceries.length).toBeGreaterThan(0);
    for (const g of groceries) expect(g.at).toBeGreaterThan(stolen.at);
    // The cash advance drew its own interest from the day it was taken, grace period or none.
    expect(on(posted(sim, /^Cash advance interest$/, start)[0]!, card)).toBeLessThan(0);
    // Rewards at the card's 2% on purchases, the cash advance not among them.
    const purchases = spent + groceries.reduce((a, g) => a - on(g, card), 0);
    expect(credit.rewards).toBe(Math.round(purchases * 0.02));
    const due = sim.universe.scheduled.find((i) => i.kind === 'card.due' && i.status === 'pending')!;
    expect(zonedParts(due.at, sim.zone)).toMatchObject({ month: 2, day: 14 });
    const terms = cardTerms(sim, cardAccount(), sim.player.credit!.score);
    const minimum = minimumDue(sim, credit.statementBalance, terms, credit.statementInterest ?? 0, credit.statementPlanDue ?? 0);
    expect(minimum).toBe(25_00);

    // Ten dollars paid by hand now; the standing order canceled before February's.
    c1 = bal(sim, checking);
    k0 = bal(sim, card);
    expect(sim.must<{ paid: number }>({ kind: 'finance.pay_card', payload: { amount: 10_00 } }).paid).toBe(10_00);
    expect(bal(sim, card)).toBe(k0 + 10_00);
    expect(bal(sim, checking)).toBe(c1 - 10_00);
    sim.must({ kind: 'bank.cancel_standing_order', payload: { id: order } });
    expect(sim.execute({ kind: 'bank.cancel_standing_order', payload: { id: order } }).error).toBe('There’s no standing order by that name.');

    // February's rent goes by check in New York, cashed three days after it's posted; this one stopped before it's cashed.
    sim.advanceTo(day(sim, 2, 2));
    const check = paymentsOf(sim.player).checks[0]!;
    expect(check.memo).toBe('Rent');
    const clearing = sim.universe.scheduled.find((i) => i.id === check.itemId)!;
    expect(clearing.status).toBe('pending');
    c1 = bal(sim, checking);
    const stopped = sim.must<{ fee: number }>({ kind: 'bank.stop_check', payload: { id: check.id } });
    // Wells Fargo's $30 stop fee; the check off the calendar; and the rent, stopped, still owed to the landlord.
    expect(stopped.fee).toBe(30_00);
    expect(bal(sim, checking)).toBe(c1 - stopped.fee);
    expect(clearing.status).not.toBe('pending');
    const unpaid = posted(sim, /^Rent, unpaid$/, start);
    expect(unpaid).toHaveLength(1);
    const arrears = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.category === 'arrears')!;
    expect(on(unpaid[0]!, arrears.id)).toBe(-check.amount);
    expect(sim.execute({ kind: 'bank.stop_check', payload: { id: check.id } }).error).toBe('That check has been cashed, or was never written.');
    expect(bal(sim, checking)).toBe(c1 - stopped.fee);

    // The due date: autopay takes the rest of the minimum and no more, nothing is late, and the balance is carried.
    const beforeDue = sim.now + 1;
    sim.advanceTo(day(sim, 2, 15));
    const autopaid = posted(sim, /^Paid Wells Fargo Active Cash Card$/, beforeDue);
    expect(autopaid).toHaveLength(1);
    expect(on(autopaid[0]!, card)).toBe(minimum - 10_00);
    expect(posted(sim, /^Late fee$/, start)).toHaveLength(0);
    credit = stateOf(sim.player, cardAccount());
    expect(credit.carrying).toBe(true);
    // The canceled standing order didn't go on February's 10th.
    expect(posted(sim, /^Standing order to /, start)).toHaveLength(1);
    // Nor was the stopped check cashed on the 5th.
    expect(posted(sim, /^Rent$/, start).filter((t) => on(t, checking) < 0)).toHaveLength(0);
    expect(paymentsOf(sim.player).checks).toHaveLength(0);

    // February's statement charges the interest the carried balance built up.
    sim.advanceTo(day(sim, 2, 21));
    const interest = posted(sim, /^Interest$/, beforeDue).filter((t) => on(t, card) < 0);
    expect(interest).toHaveLength(1);
    expect(stateOf(sim.player, cardAccount()).statementInterest).toBe(-on(interest[0]!, card));

    // The rewards redeemed onto the card, once; then the card paid off, once.
    credit = stateOf(sim.player, cardAccount());
    const rewards = credit.rewards ?? 0;
    expect(rewards).toBeGreaterThan(0);
    k0 = bal(sim, card);
    expect(sim.must<{ redeemed: number }>({ kind: 'card.redeem_rewards', payload: {} }).redeemed).toBe(rewards);
    expect(bal(sim, card)).toBe(k0 + rewards);
    expect(sim.execute({ kind: 'card.redeem_rewards', payload: {} }).error).toBe('The card has no rewards to redeem.');
    c1 = bal(sim, checking);
    const owed = -bal(sim, card);
    expect(sim.must<{ paid: number }>({ kind: 'finance.pay_card', payload: { amount: 'full' } }).paid).toBe(owed);
    expect(bal(sim, card)).toBe(0);
    expect(bal(sim, checking)).toBe(c1 - owed);
    expect(sim.execute({ kind: 'finance.pay_card', payload: { amount: 'full' } }).error).toBe('You don’t owe anything on it.');
    expect(bal(sim, checking)).toBe(c1 - owed);

    // February's wages, and a loan against them: under Wells Fargo's least refused, then $5,000 over a year.
    wages(sim, 6_000_00);
    c1 = bal(sim, checking);
    expect(sim.execute({ kind: 'bank.borrow', payload: { amount: 1_000_00, months: 12 } }).error).toBe('The bank lends $3,000 or more.');
    const lent = sim.must<{ apr: number; payment: number }>({ kind: 'bank.borrow', payload: { amount: 5_000_00, months: 12 } });
    expect(bal(sim, checking)).toBe(c1 + 5_000_00);
    const loan = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'loan' && a.category === 'personal' && !a.closedAt)!;
    expect(loan.balance).toBe(-5_000_00);
    expect(sim.execute({ kind: 'bank.borrow', payload: { amount: 5_000_00, months: 12 } }).error).toBe('You already have a loan with the bank.');
    // Its first month: the month's interest charged, the payment taken.
    const loanDue = sim.universe.scheduled.find((i) => i.kind === 'bank.loan_due' && i.status === 'pending' && i.payload.accountId === loan.id)!;
    sim.advanceTo(loanDue.at + 60_000);
    const monthInterest = Math.round(5_000_00 * lent.apr / 12);
    expect(on(posted(sim, new RegExp(`^Interest: ${loan.name}$`), start)[0]!, loan.id)).toBe(-monthInterest);
    expect(on(posted(sim, new RegExp(`^Payment: ${loan.name}$`), start)[0]!, loan.id)).toBe(lent.payment);
    expect(sim.universe.accounts[loan.id]!.balance).toBe(-5_000_00 - monthInterest + lent.payment);
    // Paid off: closed, its calendar cleared, and nothing left to pay off.
    const paidOff = sim.must<{ paid: number }>({ kind: 'bank.repay_loan', payload: {} });
    expect(paidOff.paid).toBeGreaterThanOrEqual(-(-5_000_00 - monthInterest + lent.payment));
    expect(sim.universe.accounts[loan.id]!.balance).toBe(0);
    expect(sim.universe.accounts[loan.id]!.closedAt).toBe(sim.now);
    expect(sim.universe.scheduled.some((i) => i.kind === 'bank.loan_due' && i.status === 'pending' && i.payload.accountId === loan.id)).toBe(false);
    expect(sim.execute({ kind: 'bank.repay_loan', payload: {} }).error).toBe('You don’t have a loan to pay off.');

    // A CD of $10,000, set to pay out at its end.
    c1 = bal(sim, checking);
    const cd = sim.must<{ accountId: string; maturesAt: number }>({ kind: 'bank.open_term', payload: { amount: 10_000_00 } });
    expect(bal(sim, checking)).toBe(c1 - 10_000_00);
    expect(bal(sim, cd.accountId)).toBe(10_000_00);
    sim.must({ kind: 'bank.set_term_end', payload: { accountId: cd.accountId, atEnd: 'paid_out' } });
    expect(sim.universe.accounts[cd.accountId]!.atEnd).toBe('paid_out');
    // A month on it earns interest, which Wells Fargo lets out during the term; taken, there's nothing left to take.
    sim.advanceBy(30 * MS_DAY);
    const accrued = Math.floor(sim.universe.accounts[cd.accountId]!.accrued ?? 0);
    expect(accrued).toBeGreaterThan(0);
    c1 = bal(sim, checking);
    const took = sim.must<{ paid: number }>({ kind: 'bank.take_term_interest', payload: { accountId: cd.accountId } });
    expect(took.paid).toBe(accrued);
    expect(bal(sim, checking)).toBe(c1 + accrued);
    expect(sim.execute({ kind: 'bank.take_term_interest', payload: { accountId: cd.accountId } }).error).toBe('It hasn’t earned anything to take yet.');
    // Broken early, it costs 91 days' interest: with the interest taken already, nearly all of it out of the principal.
    const earned = Math.floor(sim.universe.accounts[cd.accountId]!.accrued ?? 0);
    c1 = bal(sim, checking);
    const broken = sim.must<{ paid: number; penalty: number }>({ kind: 'bank.break_term', payload: { accountId: cd.accountId } });
    const rate = sim.universe.accounts[cd.accountId]!.fixedRate!;
    expect(broken.penalty).toBe(Math.round(10_000_00 * rate * 91 / 365));
    expect(broken.paid).toBe(10_000_00 - (broken.penalty - earned));
    expect(bal(sim, checking)).toBe(c1 + broken.paid);
    expect(bal(sim, cd.accountId)).toBe(0);
    expect(sim.execute({ kind: 'bank.break_term', payload: { accountId: cd.accountId } }).error).toBe('That isn’t one of your term deposits.');

    // The credit card lost: stopped at once, for the bank's fee if it lists one; reported twice, charged once.
    sim.advanceTo(nextNoon(sim));
    k0 = bal(sim, card);
    const lost = sim.must<{ arrivesAt: number; fee: number }>({ kind: 'card.report', payload: { which: 'credit', why: 'lost' } });
    expect(bal(sim, card)).toBe(k0 - lost.fee);
    expect(sim.execute({ kind: 'card.report', payload: { which: 'credit', why: 'lost' } }).error).toBe('That card is stopped already; a new one is on its way.');
    expect(sim.execute({ kind: 'card.lock', payload: { which: 'credit', locked: true } }).error).toBe('That card is stopped; a new one is on its way.');
    expect(bal(sim, card)).toBe(k0 - lost.fee);
    // Nothing goes on a stopped card.
    expect(sim.execute({ kind: 'clothes.buy', payload: buy }).ok).toBe(false);
    expect(bal(sim, card)).toBe(k0 - lost.fee);
    const lostLast4 = cardAccount().plastic!.last4;
    sim.advanceTo(lost.arrivesAt + 60_000);
    expect(cardAccount().plastic!.stopped).toBeFalsy();
    expect(cardAccount().plastic!.last4).not.toBe(lostLast4);
    // The bills on the old number, given the new one where the bank doesn't pass it on.
    if (cardAccount().plastic!.billersStale) sim.must({ kind: 'card.update_billers', payload: {} });
    expect(sim.execute({ kind: 'card.update_billers', payload: {} }).error).toBe('Your bills already have your card’s number.');

    // A second card, from Citi: a hard inquiry on the record, applied for once, arriving in a week.
    const score = sim.player.credit!.score;
    const applied = sim.must<{ approved: boolean; limit: number }>({ kind: 'card.apply', payload: { bankId: 'us-citi' } });
    expect(applied.approved).toBe(true);
    expect(sim.player.credit!.score).toBeLessThan(score);
    const afterInquiry = sim.player.credit!.score;
    expect(sim.execute({ kind: 'card.apply', payload: { bankId: 'us-citi' } }).error).toBe('A card is already on its way.');
    expect(sim.player.credit!.score).toBe(afterInquiry);
    sim.advanceBy(8 * MS_DAY);
    const citi = cardsOf(sim, sim.player).find((a) => a.bankId === 'us-citi')!;
    expect(citi.creditLimit).toBe(applied.limit);
    // Made the everyday card, the day's spending on it goes there, and the old card is left alone.
    sim.must({ kind: 'card.set_everyday', payload: { accountId: citi.id } });
    expect(cardOf(sim, sim.player)!.id).toBe(citi.id);
    sim.advanceTo(nextNoon(sim));
    k0 = bal(sim, card);
    const ci0 = bal(sim, citi.id);
    sim.must({ kind: 'clothes.buy', payload: buy });
    expect(bal(sim, citi.id)).toBe(ci0 - spent);
    expect(bal(sim, card)).toBe(k0);
    // Its statement moved to the 5th, its limit lowered, never raised unasked, and going over it allowed.
    sim.must({ kind: 'card.set_statement_day', payload: { day: 5, accountId: citi.id } });
    const nextStatement = sim.universe.scheduled.find((i) => i.kind === 'card.statement' && i.status === 'pending' && i.payload.accountId === citi.id)!;
    expect(zonedParts(nextStatement.at, sim.zone).day).toBe(5);
    expect(sim.execute({ kind: 'card.set_statement_day', payload: { day: 30, accountId: citi.id } }).error).toBe('Pick a day from the 1st to the 28th.');
    expect(sim.must<{ limit: number; granted: boolean }>({ kind: 'card.request_limit', payload: { limit: 1_000_00, accountId: citi.id } })).toEqual({ limit: 1_000_00, granted: true });
    expect(citi.creditLimit).toBe(1_000_00);
    sim.must({ kind: 'card.set_auto_raise', payload: { on: false, accountId: citi.id } });
    expect(stateOf(sim.player, citi).noAutoRaise).toBe(true);
    sim.must({ kind: 'card.set_over_limit', payload: { on: true, accountId: citi.id } });
    expect(stateOf(sim.player, citi).overLimitOptIn).toBe(true);
    // Paid $20 more than it owed by hand, the card holds the credit; sent back, it's in checking.
    c1 = bal(sim, checking);
    const citiOwed = -bal(sim, citi.id);
    sim.must({ kind: 'finance.pay_card', payload: { amount: citiOwed + 20_00, accountId: citi.id } });
    expect(bal(sim, citi.id)).toBe(20_00);
    expect(sim.must<{ refunded: number }>({ kind: 'card.refund_credit', payload: { accountId: citi.id } }).refunded).toBe(20_00);
    expect(bal(sim, citi.id)).toBe(0);
    expect(bal(sim, checking)).toBe(c1 - citiOwed);
    expect(sim.execute({ kind: 'card.refund_credit', payload: { accountId: citi.id } }).error).toBe('The card holds no credit to send back.');
    // What Wells Fargo doesn't do, and what isn't there to do.
    expect(sim.execute({ kind: 'bank.new_number', payload: {} }).error).toBe('Wells Fargo doesn’t say it moves an account to a new number; closing it and opening another does.');
    expect(sim.execute({ kind: 'bank.claim_unclaimed', payload: {} }).error).toBe('No money of yours is held as unclaimed.');
    expect(sim.execute({ kind: 'bank.reactivate', payload: { accountId: checking } }).error).toBe('That account isn’t dormant.');
    expect(sim.execute({ kind: 'bank.pay_collections', payload: { amount: 1_00 } }).error).toBe('You don’t owe anything in collections.');
    // The Wells Fargo card closed, owing nothing, at once.
    if (bal(sim, card) < 0) sim.must({ kind: 'finance.pay_card', payload: { amount: 'full', accountId: card } });
    sim.must({ kind: 'card.close', payload: { accountId: card } });
    expect(cardAccount().closedAt).toBe(sim.now);

    // Savings closed into checking, every cent of it, and opened again.
    c1 = bal(sim, checking);
    const held = bal(sim, savings);
    sim.must({ kind: 'bank.close_savings', payload: { accountId: savings } });
    expect(sim.universe.accounts[savings]!.closedAt).toBe(sim.now);
    expect(bal(sim, savings)).toBe(0);
    // What it held, with the month's interest paid on closing, moved in one transaction.
    const closed = posted(sim, /^Closed Way2Save Savings$/, start);
    expect(closed).toHaveLength(1);
    expect(on(closed[0]!, checking)).toBeGreaterThanOrEqual(held);
    expect(bal(sim, checking)).toBe(c1 + on(closed[0]!, checking));
    const reopened = sim.must<{ accountId: string }>({ kind: 'bank.open_savings', payload: {} }).accountId;
    expect(reopened).not.toBe(savings);
    sim.must({ kind: 'bank.transfer', payload: { fromId: checking, toId: reopened, amount: 500_00 } });
    expect(bal(sim, reopened)).toBe(500_00);

    // Saved and loaded at the end, the books as they were.
    const books = Object.values(sim.universe.accounts).map((a) => [a.id, a.balance, a.closedAt ?? null]);
    sim = reload(sim);
    expect(Object.values(sim.universe.accounts).map((a) => [a.id, a.balance, a.closedAt ?? null])).toEqual(books);
    expect(cardOf(sim, sim.player)!.id).toBe(citi.id);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a bank in Dublin', () => {
  it('arranges an overdraft, cancels an account in its cooling-off days, and takes back a direct debit', () => {
    let sim = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'wealthy' }, 'journey-bank-dublin');
    const current = sim.player.primaryAccountId!;
    const start = sim.now;
    wages(sim, 4_000_00);

    // An arranged overdraft: past a month's wages refused; €1,000 arranged, AIB's €25.39 facility fee taken once; lowered, no second fee.
    let c0 = bal(sim, current);
    expect(sim.execute({ kind: 'bank.arrange_overdraft', payload: { limit: 9_000_00 } }).error).toMatch(/^The bank arranges between .* and .*\.$/);
    expect(bal(sim, current)).toBe(c0);
    const arranged = sim.must<{ limit: number; rate: number }>({ kind: 'bank.arrange_overdraft', payload: { limit: 1_000_00 } });
    expect(arranged.rate).toBe(0.1185);
    expect(sim.universe.accounts[current]!.overdraftLimit).toBe(1_000_00);
    expect(bal(sim, current)).toBe(c0 - 25_39);
    sim.must({ kind: 'bank.arrange_overdraft', payload: { limit: 500_00 } });
    expect(sim.universe.accounts[current]!.overdraftLimit).toBe(500_00);
    expect(bal(sim, current)).toBe(c0 - 25_39);
    expect(posted(sim, /^Overdraft facility fee$/, start)).toHaveLength(1);
    // Rent here goes by direct debit, never by check; savings linked to cover the current account.
    expect(sim.execute({ kind: 'bank.set_payments', payload: { rent: 'check' } }).error).toBe('Rent isn’t paid by check here.');
    expect(sim.must<{ payments: { linkSavings: boolean; rent: string } }>({ kind: 'bank.set_payments', payload: { linkSavings: true } }).payments).toMatchObject({ linkSavings: true, rent: 'auto' });
    // An Irish bank doesn't ask about debit card purchases into it.
    expect(sim.execute({ kind: 'bank.debit_overdraft', payload: { on: true } }).error).toBe('Your bank doesn’t ask you this.');

    // A fixed term deposit, canceled inside the fourteen cooling-off days: every cent back, no interest, no penalty.
    c0 = bal(sim, current);
    const first = sim.must<{ accountId: string }>({ kind: 'bank.open_term', payload: { amount: 10_000_00 } }).accountId;
    expect(bal(sim, current)).toBe(c0 - 10_000_00);
    sim.advanceBy(5 * MS_DAY);
    c0 = bal(sim, current);
    expect(sim.must<{ refunded: number }>({ kind: 'bank.cancel_new', payload: { accountId: first } }).refunded).toBe(10_000_00);
    expect(bal(sim, current)).toBe(c0 + 10_000_00);
    expect(sim.universe.accounts[first]!.closedAt).toBe(sim.now);
    expect(sim.execute({ kind: 'bank.cancel_new', payload: { accountId: first } }).error).toBe('That isn’t one of your accounts.');

    // Another, kept past the cooling-off: AIB won't break it, but pays its interest during the term, less DIRT.
    const term = sim.must<{ accountId: string }>({ kind: 'bank.open_term', payload: { amount: 10_000_00 } }).accountId;
    sim.must({ kind: 'bank.set_term_end', payload: { accountId: term, atEnd: 'paid_out' } });
    expect(sim.execute({ kind: 'bank.set_term_end', payload: { accountId: term, atEnd: 'savings' } }).error).toBe('AIB doesn’t let a term deposit end that way.');

    // Saved and loaded with the term deposit and the overdraft standing.
    sim = reload(sim);
    expect(sim.universe.accounts[current]!.overdraftLimit).toBe(500_00);
    expect(sim.universe.accounts[term]!.atEnd).toBe('paid_out');

    // The first of the month: rent and bills go by direct debit.
    sim.advanceTo(instantFromZoned({ year: 2026, month: 2, day: 2, hour: 12 }, sim.zone));
    expect(sim.execute({ kind: 'bank.break_term', payload: { accountId: term } }).error).toBe('AIB doesn’t let a term deposit be broken before its end.');
    const earned = Math.floor(sim.universe.accounts[term]!.accrued ?? 0);
    expect(earned).toBeGreaterThan(0);
    c0 = bal(sim, current);
    const took = sim.must<{ paid: number }>({ kind: 'bank.take_term_interest', payload: { accountId: term } });
    // Ireland's DIRT, 33%, taken at source.
    expect(took.paid).toBe(earned - Math.round(earned * 0.33));
    expect(bal(sim, current)).toBe(c0 + took.paid);

    // The bills direct debit taken back under SEPA's eight weeks: the money back, and the bill owed again; once only.
    const bills = posted(sim, /^Bills$/, start).find((t) => t.category === 'bills')!;
    const taken = -on(bills, current);
    expect(taken).toBeGreaterThan(0);
    c0 = bal(sim, current);
    const owedTo = () => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.category === 'arrears')?.balance ?? 0;
    const owed0 = owedTo();
    expect(sim.must<{ refunded: number }>({ kind: 'bank.reclaim_debit', payload: { transactionId: bills.id } }).refunded).toBe(taken);
    expect(bal(sim, current)).toBe(c0 + taken);
    expect(owedTo()).toBe(owed0 - taken);
    expect(bills.reversedBy).toBeDefined();
    expect(sim.execute({ kind: 'bank.reclaim_debit', payload: { transactionId: bills.id } }).error).toBe('That one has been taken back already.');
    expect(bal(sim, current)).toBe(c0 + taken);
    // Rent isn't a bills direct debit, and doesn't come back this way.
    const rent = posted(sim, /^Rent$/, start)[0]!;
    expect(sim.execute({ kind: 'bank.reclaim_debit', payload: { transactionId: rent.id } }).error).toBe('Only a bills direct debit taken from your current account can be taken back.');

    // The overdraft closed, owing nothing on it.
    sim.must({ kind: 'bank.arrange_overdraft', payload: { limit: 0 } });
    expect(sim.universe.accounts[current]!.overdraftLimit).toBeUndefined();
    expect(breaches(sim.universe)).toEqual([]);
  });
});
