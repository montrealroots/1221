import { describe, expect, it } from 'vitest';
import {
  applyRate, centsFromTyped, currencySymbol, formatMoney, formatMoneyCompact, saveCurrency, splitByWeights, splitEvenly, units,
} from '@/engine/core/money';
import { createSave, defaultConfig } from '@/engine';
import { currencyFor, wealthIn } from '@/engine/world/bootstrap';
import { Ledger, type Account, type LedgerHost, type LedgerTransaction } from '@/engine/core/ledger';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { netWorth } from '@/engine/systems/finance';

function host(): LedgerHost {
  return { accounts: {}, transactions: [] };
}

function account(id: string, kind: Account['kind'] = 'checking'): Account {
  return {
    id, saveId: 's', kind, name: id, ownerId: 'p', balance: 0,
    openedAt: 0, nominal: kind === 'income' || kind === 'expense' || kind === 'equity',
  };
}

describe('money', () => {
  it('is always integer cents', () => {
    expect(units(19.99)).toBe(1999);
    expect(units(0.1) + units(0.2)).toBe(units(0.3));
    expect(Number.isInteger(applyRate(1999, 0.0725))).toBe(true);
  });

  it('rounds a rate exactly once, away from zero', () => {
    expect(applyRate(1000, 0.5)).toBe(500);
    expect(applyRate(1001, 0.5)).toBe(501);
    expect(applyRate(-1001, 0.5)).toBe(-501);
  });

  it('splits without losing or inventing a cent', () => {
    for (const [amount, parts] of [[100, 3], [1, 7], [999999, 13], [-100, 3]] as [number, number][]) {
      const split = splitEvenly(amount, parts);
      expect(split).toHaveLength(parts);
      expect(split.reduce((s, v) => s + v, 0)).toBe(amount);
    }
  });

  it('splits by weight without losing a cent', () => {
    const split = splitByWeights(10_000, [1, 2, 3, 4]);
    expect(split.reduce((s, v) => s + v, 0)).toBe(10_000);
    expect(split[3]).toBeGreaterThan(split[0] as number);
  });

  it('formats compactly at scale', () => {
    expect(formatMoney(199_99, 'EUR')).toBe('€199.99');
    expect(formatMoneyCompact(1_500_000_00, 'EUR')).toBe('€1.5M');
    expect(formatMoneyCompact(2_400_000_000_00, 'EUR')).toBe('€2.4B');
    expect(formatMoneyCompact(2_400_000_000_00, 'ISK')).toBe('2.4B kr');
  });

  it('writes each currency the way it is written, from the one table', () => {
    // This formatter printed dollars while every notification the engine wrote
    // printed euros, for the same cents, on the same screen. The symbol is not
    // typed anywhere: it comes out of `content/currency.ts`, so the long form,
    // the compact form and the engine's own sentences can't be three opinions.
    expect(currencySymbol('EUR')).toBe('€');
    expect(formatMoney(1_000_00, 'EUR')).toContain(currencySymbol('EUR'));
    expect(formatMoney(199_99, 'EUR')).not.toContain('$');
    // Krónur have no decimals and the symbol goes after.
    expect(formatMoney(186_000_00, 'ISK')).toBe('186,000 kr');
    expect(formatMoney(-5_00, 'ISK')).toBe('-5 kr');
    expect(formatMoney(12_50, 'GBP')).toBe('£12.50');
  });

  it('keeps a save’s money in the currency of the country it starts in, and one from before 89 in euros', () => {
    const iceland = createSave(1, 'currency-is', defaultConfig());
    expect(currencyFor(defaultConfig().startLocationId)).toBe('ISK');
    expect(saveCurrency(iceland.universe)).toBe('ISK');
    // Scraping is 1,240 euros in checking, converted at SLATE's rates: 138
    // krónur and 0.92 euros to the dollar.
    const checking = iceland.universe.accounts[iceland.player.primaryAccountId!]!;
    expect(checking.balance).toBe(186_000_00);
    expect(wealthIn('scraping', 'ISK').checking).toBe(186_000_00);
    expect(wealthIn('scraping', 'EUR').checking).toBe(1_240_00);
    // Money is conserved in whatever it is kept in.
    expect(iceland.ledger.audit()).toEqual([]);
    const older = { meta: {} };
    expect(saveCurrency(older)).toBe('EUR');
  });
});

describe('the ledger', () => {
  it('refuses a transaction that does not balance', () => {
    const h = host();
    const ledger = new Ledger(h);
    ledger.open(account('a'));
    ledger.open(account('b'));

    const bad: LedgerTransaction = {
      id: 't1', saveId: 's', at: 0, memo: 'invented money', category: 'test',
      postings: [{ accountId: 'a', amount: 100 }, { accountId: 'b', amount: -50 }],
    };
    expect(() => ledger.post(bad)).toThrow(/does(n’t| not) balance/);
    expect(h.transactions).toHaveLength(0);
  });

  it('refuses a fractional posting', () => {
    const h = host();
    const ledger = new Ledger(h);
    ledger.open(account('a'));
    ledger.open(account('b'));
    expect(() => ledger.post({
      id: 't', saveId: 's', at: 0, memo: 'fraction', category: 'test',
      postings: [{ accountId: 'a', amount: 10.5 }, { accountId: 'b', amount: -10.5 }],
    })).toThrow(/Money is always cents/);
  });

  it('derives balances from postings and reconciles', () => {
    const h = host();
    const ledger = new Ledger(h);
    ledger.open(account('checking'));
    ledger.open(account('income', 'income'));

    ledger.post({
      id: 't1', saveId: 's', at: 0, memo: 'salary', category: 'salary',
      postings: [{ accountId: 'checking', amount: 250_000 }, { accountId: 'income', amount: -250_000 }],
    });

    expect(ledger.account('checking').balance).toBe(250_000);
    expect(ledger.audit()).toEqual([]);
    expect(ledger.recompute()['checking']).toBe(250_000);
  });

  it('detects a tampered balance', () => {
    const h = host();
    const ledger = new Ledger(h);
    ledger.open(account('checking'));
    ledger.open(account('income', 'income'));
    ledger.post({
      id: 't1', saveId: 's', at: 0, memo: 'salary', category: 'salary',
      postings: [{ accountId: 'checking', amount: 1000 }, { accountId: 'income', amount: -1000 }],
    });

    // Simulate someone assigning a balance directly, which is exactly what
    // the double-entry design exists to make impossible to hide.
    ledger.account('checking').balance = 999_999;
    const problems = ledger.audit();
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]).toMatch(/cached balance/);
  });

  it('reports available funds correctly for revolving credit', () => {
    const h = host();
    const ledger = new Ledger(h);
    const card = account('card', 'credit_card');
    card.creditLimit = 500_000;
    ledger.open(card);
    ledger.open(account('expense', 'expense'));

    ledger.post({
      id: 't', saveId: 's', at: 0, memo: 'purchase', category: 'shopping',
      postings: [{ accountId: 'card', amount: -120_000 }, { accountId: 'expense', amount: 120_000 }],
    });

    expect(ledger.account('card').balance).toBe(-120_000);
    expect(ledger.availableFunds('card')).toBe(380_000);
  });
});

describe('money conservation in a live universe', () => {
  it('holds over a simulated year of ordinary life', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 365 * MS_DAY);
    expect(sim.ledger.audit()).toEqual([]);

    // Every cached balance still equals the sum of its postings.
    const recomputed = sim.ledger.recompute();
    for (const [id, acct] of Object.entries(sim.universe.accounts)) {
      expect(acct.balance).toBe(recomputed[id] ?? 0);
    }
  });

  it('sums every posting in the universe to exactly zero', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 180 * MS_DAY);
    const grand = sim.universe.transactions
      .flatMap((t) => t.postings)
      .reduce((s, p) => s + p.amount, 0);
    expect(grand).toBe(0);
  });

  it('reports a finite, sane net worth', () => {
    const sim = quickSave();
    sim.advanceTo(sim.now + 90 * MS_DAY);
    const worth = netWorth(sim, sim.player.id);
    expect(Number.isFinite(worth.total)).toBe(true);
    expect(Number.isInteger(worth.cash)).toBe(true);
    // A deposit the landlord holds is theirs, and not money in the bank; nor
    // is what their pay put in a pension.
    expect(worth.total).toBe(worth.cash + worth.held + worth.pension - worth.liabilities);
    expect(worth.held).toBeGreaterThanOrEqual(0);
    // Nothing pays into a pension since the job engine went on 2026-09-26. A
    // save from before keeps the fund its pay built, and net worth counts it.
    expect(worth.pension).toBe(0);
  });
});

describe('an amount as it is typed', () => {
  it('reads a decimal comma or point, and thousands grouped either way', () => {
    const cases: [string, number][] = [
      ['12.50', 1250], ['12,50', 1250], ['12,5', 1250], ['1,000', 100000], ['1.000', 100000],
      ['1,000.50', 100050], ['1.000,50', 100050], ['1 000', 100000], ["1'000,25", 100025],
      ['€ 45', 4500], ['2.000.000', 200000000], ['2,000,000.5', 200000050], ['', 0], ['abc', 0],
    ];
    for (const [typed, cents] of cases) expect(centsFromTyped(typed), typed).toBe(cents);
  });
});
