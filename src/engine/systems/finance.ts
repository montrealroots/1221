/**
 * SLATE — Personal and company finance.
 *
 * Every balance in the game is the sum of postings. Salary is withheld at
 * source, bills are attempted against a real account with real available funds,
 * missed payments damage a real credit score, and the tax year reconciles what
 * was withheld against what was actually owed.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import { countWithdrawal } from './banking';
import type { Account } from '../core/ledger';
import { isLiability } from '../core/ledger';
import type { Money } from '../core/money';
import { applyRate, formatMoney, splitEvenly } from '../core/money';
import { addDays, addMonths, addYears, instantFromZoned, zonedParts, MS_DAY } from '../core/time';
import type { Bill, Id, Person } from '../domain/model';
import { computeAnnualTax, costOfLiving } from '../content/tax';
import { clamp } from '../core/rng';

export const PAYDAY_PRIORITY = 10;
export const BILL_PRIORITY = 20;

// ---------------------------------------------------------------------------
// Credit
// ---------------------------------------------------------------------------

/**
 * Recomputes a credit score from its real components. The weights mirror how
 * consumer scoring actually works: payment history dominates, utilisation is
 * next, then history length, mix and recent inquiries.
 */
export function recomputeCreditScore(sim: Simulation, personId: Id): number {
  const profile = sim.universe.creditProfiles[personId];
  if (!profile) return 300;

  const accounts = sim.ledger.accountsOf(personId);
  const revolving = accounts.filter((a) => a.kind === 'credit_card');
  const limit = revolving.reduce((s, a) => s + (a.creditLimit ?? 0), 0);
  const used = revolving.reduce((s, a) => s + Math.max(0, -a.balance), 0);
  profile.utilisation = limit > 0 ? clamp(used / limit, 0, 2) : 0;
  profile.accountsOpen = accounts.length;

  const totalPayments = profile.onTimePayments + profile.latePayments;
  const onTimeRate = totalPayments > 0 ? profile.onTimePayments / totalPayments : 1;

  const ageYears = Math.max(0, (sim.now - profile.oldestAccountAt) / (365.25 * MS_DAY));
  const recentInquiries = profile.hardInquiries.filter((i) => sim.now - i.at < 365 * MS_DAY).length;
  const recentDerogatory = profile.derogatory.filter((d) => sim.now - d.at < 7 * 365 * MS_DAY).length;

  // 300-850 scale, assembled from weighted components.
  let score = 300;
  score += 192 * Math.pow(onTimeRate, 2.2);            // payment history, 35%
  score += 165 * (1 - clamp(profile.utilisation / 0.9, 0, 1)); // utilisation, 30%
  score += 82 * clamp(ageYears / 12, 0, 1);            // length of history, 15%
  score += 55 * clamp(profile.accountsOpen / 6, 0, 1); // credit mix, 10%
  score += 56 * (1 - clamp(recentInquiries / 6, 0, 1)); // new credit, 10%
  score -= recentDerogatory * 65;

  profile.score = Math.round(clamp(score, 300, 850));
  const person = sim.universe.people[personId];
  if (person) person.creditScore = profile.score;
  return profile.score;
}

export function creditBand(score: number): string {
  if (score >= 800) return 'Exceptional';
  if (score >= 740) return 'Very good';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
}

/** APR a lender would offer at a given score, for a given product. */
export function offeredApr(score: number, product: 'card' | 'auto' | 'mortgage' | 'personal'): number {
  const base: Record<typeof product, number> = { card: 0.2249, auto: 0.0689, mortgage: 0.0665, personal: 0.1199 };
  const spread: Record<typeof product, number> = { card: 0.14, auto: 0.10, mortgage: 0.028, personal: 0.16 };
  const quality = clamp((score - 580) / 270, 0, 1);
  return Number((base[product] + spread[product] * (1 - quality)).toFixed(4));
}

/** Standard amortising payment for a loan. */
/**
 * Why a lender would say no before the paperwork: the score they want for
 * the product. Read by the screens that offer finance, so a choice that
 * will be refused is closed with the reason rather than failing when pressed.
 */
export function loanRefusal(sim: Simulation, borrowerId: Id, product: 'card' | 'auto' | 'mortgage' | 'personal'): string | undefined {
  const score = sim.universe.creditProfiles[borrowerId]?.score ?? 600;
  const minimum = product === 'mortgage' ? 620 : product === 'auto' ? 580 : 600;
  if (score < minimum) return `A ${product} loan needs a score of at least ${minimum}. Yours is ${score}.`;
  return undefined;
}

export function amortisedPayment(principal: Money, annualRate: number, months: number): Money {
  if (months <= 0) return principal;
  if (annualRate <= 0) return Math.ceil(principal / months);
  const r = annualRate / 12;
  const factor = Math.pow(1 + r, months);
  return Math.ceil((principal * r * factor) / (factor - 1));
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerFinance(sim: Simulation): void {
  // --- Scheduled: a bill falls due ----------------------------------------
  sim.onSchedule('finance.bill_due', (item) => {
    const billId = item.payload.billId as Id;
    const bill = sim.universe.bills[billId];
    if (!bill || !bill.active) return;
    attemptBillPayment(sim, bill);
  });

  // --- Scheduled: the month turns over -------------------------------------
  // Interest, fees and statements are the banking system's (see banking.ts);
  // what is left here is the score, which is read from all of it.
  sim.onSchedule('finance.month_close', () => {
    for (const person of Object.values(sim.universe.people)) {
      if (person.isPlayer || person.tier === 'full') recomputeCreditScore(sim, person.id);
    }
  });

  // --- Scheduled: tax year reconciliation ---------------------------------
  sim.onSchedule('finance.tax_year', (item) => {
    reconcileTaxYear(sim, item.payload.personId as Id, item.payload.year as number);
  });

  // --- Commands ------------------------------------------------------------

  sim.onCommand<{ ownerId: Id; kind: Account['kind']; name: string; institution?: string; initialDeposit?: Money; creditLimit?: Money }, { accountId: Id }>(
    'finance.open_account',
    (p, { sim: s }) => {
      const person = s.universe.people[p.ownerId];
      const company = s.universe.companies[p.ownerId];
      if (!person && !company) throw new CommandError('No such account holder.');

      if (p.kind === 'credit_card') {
        const profile = s.universe.creditProfiles[p.ownerId];
        const score = profile?.score ?? 600;
        if (score < 560) {
          throw new CommandError(`A credit score of ${score} is not enough to be approved for a card. Build history first.`);
        }
        profile?.hardInquiries.push({ at: s.now, reason: 'Credit card application' });
      }

      const account = s.openAccount({
        id: s.nextId('account'),
        kind: p.kind,
        name: p.name,
        ownerId: p.ownerId,
        institution: p.institution ?? 'Northbank',
        openedAt: s.now,
        creditLimit: p.creditLimit,
        apr: p.kind === 'credit_card' ? offeredApr(s.universe.creditProfiles[p.ownerId]?.score ?? 600, 'card') : undefined,
        last4: String(1000 + (s.counter('account_last4') * 7919) % 9000),
        balance: p.initialDeposit ?? 0,
      });

      if (person && !person.primaryAccountId && (p.kind === 'checking' || p.kind === 'cash')) {
        person.primaryAccountId = account.id;
      }
      recomputeCreditScore(s, p.ownerId);
      s.emit('finance.account_opened', { accountId: account.id, ownerId: p.ownerId, kind: p.kind });
      return { accountId: account.id };
    },
  );

  sim.onCommand<{ fromAccountId: Id; toAccountId: Id; amount: Money; memo?: string }, { transactionId: Id }>(
    'finance.transfer',
    (p, { sim: s }) => {
      if (p.amount <= 0) throw new CommandError('Transfer amount must be positive.');
      const available = s.ledger.availableFunds(p.fromAccountId);
      if (available < p.amount) {
        throw new CommandError(
          `Not enough available in ${s.ledger.account(p.fromAccountId).name}. You have ${formatMoney(available)} and need ${formatMoney(p.amount)}.`,
        );
      }
      const txn = s.transfer(p.fromAccountId, p.toAccountId, p.amount, p.memo ?? 'Transfer', 'transfer');
      // A savings product counts what leaves it, and charges past the allowance.
      countWithdrawal(s, p.fromAccountId);
      return { transactionId: txn.id };
    },
  );

  sim.onCommand<{ billId: Id; accountId?: Id }, { paid: boolean }>(
    'finance.pay_bill',
    (p, { sim: s }) => {
      const bill = s.universe.bills[p.billId];
      if (!bill) throw new CommandError('No such bill.');
      const accountId = p.accountId ?? bill.autopayAccountId ?? s.universe.people[bill.payerId]?.primaryAccountId;
      if (!accountId) throw new CommandError('No account selected to pay from.');
      const paid = payBill(s, bill, accountId, true);
      if (!paid) throw new CommandError(`Not enough available funds to pay ${bill.name} (${formatMoney(bill.amount)}).`);
      return { paid };
    },
  );

  sim.onCommand<{ payerId: Id; name: string; category: string; amount: Money; frequency: Bill['frequency']; firstDueAt: number; autopayAccountId?: Id; targetAccountId?: Id; refType?: string; refId?: Id }, { billId: Id }>(
    'finance.create_bill',
    (p, { sim: s }) => ({ billId: createBill(s, p).id }),
  );

  sim.onCommand<{ borrowerId: Id; principal: Money; months: number; product: 'auto' | 'mortgage' | 'personal'; depositAccountId?: Id; refType?: string; refId?: Id; name?: string }, { accountId: Id; monthlyPayment: Money; apr: number }>(
    'finance.take_loan',
    (p, { sim: s }) => {
      const refusal = loanRefusal(s, p.borrowerId, p.product);
      if (refusal) throw new CommandError(refusal);
      const profile = s.universe.creditProfiles[p.borrowerId];
      const score = profile?.score ?? 600;
      const apr = offeredApr(score, p.product);
      const monthlyPayment = amortisedPayment(p.principal, apr, p.months);

      const kind: Account['kind'] = p.product === 'mortgage' ? 'mortgage' : p.product === 'auto' ? 'auto_loan' : 'loan';
      const account = s.openAccount({
        id: s.nextId('account'),
        kind,
        name: p.name ?? `${p.product === 'mortgage' ? 'Mortgage' : p.product === 'auto' ? 'Auto loan' : 'Personal loan'}`,
        ownerId: p.borrowerId,
        institution: 'Northbank',
        openedAt: s.now,
        apr,
        originalPrincipal: p.principal,
        termMonthsRemaining: p.months,
        monthlyPayment,
      });

      // The loan creates a liability and, if requested, delivers the cash.
      const liability = s.nominalAccount('liability_other', 'Loan proceeds');
      if (p.depositAccountId) {
        s.post({
          memo: `${account.name} funded`,
          category: 'financing',
          postings: [
            { accountId: p.depositAccountId, amount: p.principal },
            { accountId: account.id, amount: -p.principal },
          ],
          refType: p.refType,
          refId: p.refId,
        });
      } else {
        s.post({
          memo: `${account.name} originated`,
          category: 'financing',
          postings: [
            { accountId: account.id, amount: -p.principal },
            { accountId: liability.id, amount: p.principal },
          ],
          refType: p.refType,
          refId: p.refId,
        });
      }

      profile?.hardInquiries.push({ at: s.now, reason: `${p.product} loan application` });

      const payer = s.universe.people[p.borrowerId];
      createBill(s, {
        payerId: p.borrowerId,
        name: `${account.name} Payment`,
        category: p.product === 'mortgage' ? 'housing' : p.product === 'auto' ? 'transport' : 'debt',
        amount: monthlyPayment,
        frequency: 'monthly',
        firstDueAt: addMonths(s.now, 1, s.homeZone),
        autopayAccountId: payer?.primaryAccountId,
        targetAccountId: account.id,
        refType: p.refType,
        refId: p.refId,
      });

      recomputeCreditScore(s, p.borrowerId);
      s.emit('finance.loan_taken', { accountId: account.id, borrowerId: p.borrowerId, principal: p.principal, apr, months: p.months });
      return { accountId: account.id, monthlyPayment, apr };
    },
  );

  sim.onCommand<{ accountId: Id; fromAccountId: Id; amount: Money }, { remaining: Money }>(
    'finance.pay_debt',
    (p, { sim: s }) => {
      const debt = s.ledger.account(p.accountId);
      if (!isLiability(debt.kind)) throw new CommandError(`${debt.name} is not a debt account.`);
      const owed = Math.max(0, -debt.balance);
      const amount = Math.min(p.amount, owed);
      if (amount <= 0) throw new CommandError(`${debt.name} is already paid off.`);
      if (s.ledger.availableFunds(p.fromAccountId) < amount) {
        throw new CommandError(`Not enough available funds to pay ${formatMoney(amount)}.`);
      }
      s.transfer(p.fromAccountId, p.accountId, amount, `Payment to ${debt.name}`, 'debt');
      recomputeCreditScore(s, debt.ownerId);
      return { remaining: Math.max(0, -debt.balance) };
    },
  );

  // --- Reactors ------------------------------------------------------------

  sim.onEvent('finance.bill_missed', 'credit.damage', (event, { sim: s }) => {
    const { payerId } = event.payload as { payerId: Id; billName: string; missedCount: number };
    const profile = s.universe.creditProfiles[payerId];
    if (!profile) return;
    profile.latePayments += 1;
    const { missedCount, billName } = event.payload as { missedCount: number; billName: string };
    if (missedCount >= 3) {
      profile.derogatory.push({ at: s.now, kind: 'collection', note: `${billName} sent to collections after ${missedCount} missed payments.` });
    }
    recomputeCreditScore(s, payerId);
  }, 20);

  sim.onEvent('finance.bill_paid', 'credit.reward', (event, { sim: s }) => {
    const { payerId } = event.payload as { payerId: Id };
    const profile = s.universe.creditProfiles[payerId];
    if (!profile) return;
    profile.onTimePayments += 1;
  }, 20);
}

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

export function createBill(
  sim: Simulation,
  spec: { payerId: Id; name: string; category: string; amount: Money; frequency: Bill['frequency']; firstDueAt: number; autopayAccountId?: Id; targetAccountId?: Id; refType?: string; refId?: Id; endsAt?: number },
): Bill {
  const bill: Bill = {
    id: sim.nextId('bill'),
    saveId: sim.universe.meta.id,
    payerId: spec.payerId,
    name: spec.name,
    category: spec.category,
    amount: spec.amount,
    frequency: spec.frequency,
    nextDueAt: spec.firstDueAt,
    autopayAccountId: spec.autopayAccountId,
    targetAccountId: spec.targetAccountId,
    active: true,
    missedCount: 0,
    refType: spec.refType,
    refId: spec.refId,
    createdAt: sim.now,
    endsAt: spec.endsAt,
  };
  sim.universe.bills[bill.id] = bill;
  sim.schedule({
    at: bill.nextDueAt,
    kind: 'finance.bill_due',
    label: `${bill.name} Due`,
    category: 'finance',
    payload: { billId: bill.id },
    priority: BILL_PRIORITY,
    refType: 'bill',
    refId: bill.id,
  });
  return bill;
}

function frequencyStep(sim: Simulation, from: number, frequency: Bill['frequency']): number | undefined {
  const z = sim.homeZone;
  switch (frequency) {
    case 'weekly': return addDays(from, 7, z);
    case 'biweekly': return addDays(from, 14, z);
    case 'monthly': return addMonths(from, 1, z);
    case 'quarterly': return addMonths(from, 3, z);
    case 'annual': return addYears(from, 1, z);
    case 'once': return undefined;
    default: return addMonths(from, 1, z);
  }
}

/** Attempts autopay, records the outcome, and re-arms the next occurrence. */
export function attemptBillPayment(sim: Simulation, bill: Bill): void {
  const accountId = bill.autopayAccountId ?? sim.universe.people[bill.payerId]?.primaryAccountId;
  const paid = accountId ? payBill(sim, bill, accountId, false) : false;

  if (!paid) {
    bill.missedCount += 1;
    sim.emit('finance.bill_missed', { billId: bill.id, payerId: bill.payerId, billName: bill.name, amount: bill.amount, missedCount: bill.missedCount });
    sim.requireDecision({
      urgency: Math.min(95, 55 + bill.missedCount * 15),
      category: 'finance',
      title: `${bill.name} Is Unpaid`,
      detail: `${formatMoney(bill.amount)} was due and there were not enough available funds. ${bill.missedCount >= 3 ? 'This has now gone to collections.' : `Missed ${bill.missedCount} time${bill.missedCount === 1 ? '' : 's'}.`}`,
      route: '/workspace/bank',
      actions: [{ label: 'Pay Now', commandKind: 'finance.pay_bill', payload: { billId: bill.id } }],
      refType: 'bill',
      refId: bill.id,
    });
  }

  const next = frequencyStep(sim, bill.nextDueAt, bill.frequency);
  if (next !== undefined && bill.active && (bill.endsAt === undefined || next <= bill.endsAt)) {
    bill.nextDueAt = next;
    sim.schedule({
      at: next,
      kind: 'finance.bill_due',
      label: `${bill.name} Due`,
      category: 'finance',
      payload: { billId: bill.id },
      priority: BILL_PRIORITY,
      refType: 'bill',
      refId: bill.id,
    });
  } else if (next === undefined) {
    bill.active = false;
  }
}

export function payBill(sim: Simulation, bill: Bill, accountId: Id, manual: boolean): boolean {
  if (sim.ledger.availableFunds(accountId) < bill.amount) return false;

  if (bill.targetAccountId) {
    // A debt payment: interest first, then principal, so amortisation is real.
    const debt = sim.ledger.account(bill.targetAccountId);
    const owed = Math.max(0, -debt.balance);
    const payment = Math.min(bill.amount, owed);
    if (payment > 0) {
      sim.transfer(accountId, bill.targetAccountId, payment, bill.name, bill.category, { refType: 'bill', refId: bill.id });
      if (debt.termMonthsRemaining !== undefined) debt.termMonthsRemaining = Math.max(0, debt.termMonthsRemaining - 1);
      if (Math.max(0, -debt.balance) === 0) {
        debt.closedAt = sim.now;
        bill.active = false;
        sim.remember({
          category: 'finance', title: `Paid Off ${debt.name}`,
          detail: `${debt.name} is settled in full.`,
          refs: [{ type: 'account', id: debt.id }], significance: 55, public: false,
        });
      }
    }
  } else {
    sim.expense(accountId, bill.amount, bill.name, bill.category, { refType: 'bill', refId: bill.id });
  }

  bill.lastPaidAt = sim.now;
  bill.missedCount = 0;
  sim.resolveDecision('bill', bill.id);
  sim.emit('finance.bill_paid', { billId: bill.id, payerId: bill.payerId, amount: bill.amount, manual });
  return true;
}

export function estimateAnnualIncome(sim: Simulation, person: Person): Money {
  // Wages used to be the first term here. There are no jobs any more, so
  // everything below is what actually arrives in the accounts.
  let annual = 0;
  // Trailing twelve months of non-wage income keeps withholding roughly honest.
  const from = sim.now - 365 * MS_DAY;
  const owned = new Set(sim.ledger.accountsOf(person.id).map((a) => a.id));
  for (const txn of sim.universe.transactions) {
    if (txn.at < from) continue;
    if (txn.category === 'salary') continue;
    if (!['royalty', 'contract', 'creator', 'sponsorship', 'production'].includes(txn.category)) continue;
    const delta = txn.postings.reduce((s, p) => (owned.has(p.accountId) ? s + p.amount : s), 0);
    if (delta > 0) annual += delta;
  }
  return annual;
}

export function recordTaxable(sim: Simulation, personId: Id, gross: Money, withheld: Money): void {
  const person = sim.universe.people[personId];
  if (!person) return;
  const year = zonedParts(sim.now, sim.homeZone).year;
  const key = `${personId}:${year}`;
  let record = Object.values(sim.universe.taxYears).find((t) => t.personId === personId && t.year === year);
  if (!record) {
    record = {
      id: sim.nextId('history'),
      saveId: sim.universe.meta.id,
      personId, year,
      grossIncome: 0, withheld: 0,
      federalTax: 0, stateTax: 0, localTax: 0, ficaTax: 0, selfEmploymentTax: 0,
      deductions: 0, balance: 0,
      jurisdictionPath: [],
    };
    sim.universe.taxYears[record.id] = record;
    // Reconcile in April of the following year.
    sim.schedule({
      at: instantFromZoned({ year: year + 1, month: 4, day: 15, hour: 9 }, sim.homeZone),
      kind: 'finance.tax_year',
      label: `${year} Tax Return Due`,
      category: 'finance',
      payload: { personId, year },
      priority: 30,
      refType: 'tax',
      refId: record.id,
    });
  }
  record.grossIncome += gross;
  record.withheld += withheld;
  void key;
}

export function reconcileTaxYear(sim: Simulation, personId: Id, year: number): void {
  const record = Object.values(sim.universe.taxYears).find((t) => t.personId === personId && t.year === year);
  const person = sim.universe.people[personId];
  if (!record || !person) return;

  const at = instantFromZoned({ year, month: 12, day: 31 }, sim.homeZone);
  const computed = computeAnnualTax(record.grossIncome, person.currentLocationId, at);
  record.federalTax = computed.federal;
  record.stateTax = computed.regional;
  record.localTax = computed.local;
  record.ficaTax = computed.payroll;
  record.balance = record.withheld - computed.total;
  record.filedAt = sim.now;

  const accountId = person.primaryAccountId;
  if (!accountId) return;

  if (record.balance > 0) {
    sim.income(accountId, record.balance, `${year} tax refund`, 'tax', { refType: 'tax', refId: record.id });
    sim.notify({
      category: 'finance',
      title: `${year} Tax Refund`,
      body: `You overpaid by ${formatMoney(record.balance)}. It has been deposited.`,
      route: '/workspace/bank',
      importance: 45,
    });
  } else if (record.balance < 0) {
    const owed = -record.balance;
    if (sim.ledger.availableFunds(accountId) >= owed) {
      sim.expense(accountId, owed, `${year} tax payment`, 'tax', { refType: 'tax', refId: record.id });
      sim.notify({
        category: 'finance', title: `${year} Taxes Paid`,
        body: `You owed ${formatMoney(owed)} beyond what was withheld. It has been paid.`,
        route: '/workspace/bank', importance: 55,
      });
    } else {
      sim.requireDecision({
        urgency: 88, category: 'finance',
        title: `${year} Taxes Owed`,
        detail: `You owe ${formatMoney(owed)} that was not withheld and cannot cover it from your primary account.`,
        route: '/workspace/bank',
        refType: 'tax', refId: record.id,
      });
    }
  }
  record.settledAt = sim.now;
  sim.emit('finance.tax_reconciled', { personId, year, balance: record.balance, total: computed.total });
}

/** Monthly interest on revolving debt and interest earned on savings. */
/**
 * Interest the old way, for anything the banking system does not close: kept
 * so a save that never reaches a month boundary in a test still behaves, and
 * so nothing that called this breaks. New months go through `closeMonth`.
 */
export function accrueInterest(sim: Simulation): void {
  for (const account of Object.values(sim.universe.accounts)) {
    if (account.nominal || account.closedAt) continue;

    if (isLiability(account.kind) && account.balance < 0 && account.apr) {
      const interest = applyRate(-account.balance, account.apr / 12);
      if (interest > 0) {
        const expense = sim.nominalAccount('expense', 'Interest charged');
        sim.post({
          memo: `Interest — ${account.name}`,
          category: 'interest',
          postings: [
            { accountId: account.id, amount: -interest },
            { accountId: expense.id, amount: interest },
          ],
          refType: 'account', refId: account.id,
        });
      }
    }

    if (account.kind === 'savings' && account.balance > 0) {
      const interest = applyRate(account.balance, 0.041 / 12);
      if (interest > 0) {
        sim.income(account.id, interest, 'Savings interest', 'interest', { refType: 'account', refId: account.id });
      }
    }
  }
}

/** Net worth: cash and liabilities plus the value of everything owned. */
export function netWorth(sim: Simulation, ownerId: Id): { cash: Money; assets: Money; liabilities: Money; total: Money } {
  let cash = 0;
  let liabilities = 0;
  for (const account of sim.ledger.accountsOf(ownerId)) {
    if (isLiability(account.kind)) liabilities += Math.max(0, -account.balance);
    else cash += account.balance;
  }
  let assets = 0;
  for (const property of Object.values(sim.universe.properties)) {
    if (property.ownerId === ownerId && property.tenure === 'owned' && !property.soldAt) assets += property.marketValue;
  }
  for (const vehicle of Object.values(sim.universe.vehicles)) {
    if (vehicle.ownerId === ownerId && !vehicle.soldAt) assets += vehicle.currentValue;
  }
  for (const asset of Object.values(sim.universe.assets)) {
    if (asset.ownerId === ownerId && !asset.soldAt) assets += asset.currentValue;
  }
  for (const company of Object.values(sim.universe.companies)) {
    if (company.dissolvedAt) continue;
    const stake = company.ownerships.find((o) => o.holderId === ownerId);
    if (stake) assets += applyRate(company.valuation, stake.percent / 100);
  }
  return { cash, assets, liabilities, total: cash + assets - liabilities };
}

/** Splits a payment across several recipients, preserving the exact total. */
export function distribute(total: Money, shares: number[]): Money[] {
  return shares.length > 0 ? splitEvenly(total, shares.length).map((v, i) => applyRate(total, (shares[i] ?? 0)) || v) : [];
}

// ---------------------------------------------------------------------------
// Standing bills
// ---------------------------------------------------------------------------

/**
 * The bills that arrive whether or not anybody is earning.
 *
 * These lived in the job system, which was the wrong home for them: a phone
 * plan is not a condition of employment. They outlived it.
 */
export function createLivingBills(sim: Simulation, personId: Id, cityId: string, hasHome: boolean): void {
  const col = costOfLiving(cityId);
  const person = sim.universe.people[personId];
  const account = person?.primaryAccountId;
  const firstOfMonth = nextMonthStart(sim);

  const standing: { name: string; category: string; base: Money }[] = [
    { name: 'Phone Plan', category: 'utilities', base: 68_00 },
    { name: 'Internet', category: 'utilities', base: 78_00 },
    { name: 'Streaming Subscriptions', category: 'subscriptions', base: 46_00 },
  ];
  if (hasHome) {
    standing.push({ name: 'Electricity', category: 'utilities', base: 130_00 });
    standing.push({ name: 'Water And Refuse', category: 'utilities', base: 82_00 });
  }

  for (const s of standing) {
    createBill(sim, {
      payerId: personId,
      name: s.name,
      category: s.category,
      amount: Math.round(s.base * col),
      frequency: 'monthly',
      firstDueAt: firstOfMonth,
      autopayAccountId: account,
    });
  }
}

/** Nine in the morning on the first of next month. */
export function nextMonthStart(sim: Simulation): number {
  const p = zonedParts(sim.now, sim.homeZone);
  const month = p.month === 12 ? 1 : p.month + 1;
  const year = p.month === 12 ? p.year + 1 : p.year;
  return instantFromZoned({ year, month, day: 1, hour: 9 }, sim.homeZone);
}
