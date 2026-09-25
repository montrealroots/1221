/**
 * SLATE — your bank.
 *
 * The bank a person keeps their money with, as that bank has it: its name,
 * the accounts by the names it sells them under, each account's number the
 * way the country writes it, what savings pays and what the current account
 * costs and how the fee is waived, and the guarantee that stands behind the
 * money if the bank fails. Money moves between the accounts here, and a
 * savings account is opened or closed (`systems/banking.ts`).
 *
 * Every figure the bank publishes says where it came from; a figure that is
 * SLATE's estimate says that instead.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { BankLending } from '@/ui/bank/BankLending';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { bankingIn } from '@/engine/content/banks';
import type { Simulation } from '@/engine/core/simulation';
import type { Product } from '@/engine/content/banks';
import {
  bankAccountsOf, introStep, rateOn, bankOf, directDeposits, feeFor, inSaveMoney, interestTaxOn, monthEndAfter, monthStartOf, productOf,
} from '@/engine/systems/banking';

export function BankWorkspace() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (cents: number) => formatMoney(cents, cur, { cents: false });
  const bank = useWorld((s) => bankOf(s, s.player));
  const accounts = useWorld((s) => bankAccountsOf(s, s.player));
  const country = bank ? bankingIn(bank.iso) : undefined;
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [amount, setAmount] = useState('');

  if (!bank) {
    return <Empty title="No Bank" body="Your money isn’t held at a bank SLATE knows, so there’s nothing to show here." />;
  }

  const current = accounts.find((a) => a.kind === 'checking');
  const savings = accounts.find((a) => a.kind === 'savings');
  const fromId = from || current?.id || '';
  const toId = to || accounts.find((a) => a.id !== fromId)?.id || '';
  const monthStart = monthStartOf(sim, sim.now);
  const monthEnd = monthEndAfter(sim, sim.now);

  const move = () => {
    // Typed in whole units of the money, as a banking app takes it.
    const cents = Math.round(Number(amount.replace(/[^\d.]/g, '')) * 100);
    const answer = run<{ moved: number }>('bank.transfer', { fromId, toId, amount: cents });
    if (answer.ok && answer.value) {
      toast(`Moved ${money(answer.value.moved)}.`, 'positive');
      setAmount('');
    }
  };

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Your Bank</div>
        <h1>{bank.name}</h1>
        <p className="muted">
          Where your money is kept.
          {country?.guarantee && (country.guarantee.limit !== undefined && country.guarantee.currency && !country.guarantee.note
            ? ` Up to ${formatMoney(country.guarantee.limit, country.guarantee.currency, { cents: false })} of it is guaranteed by the ${country.guarantee.scheme} if the bank fails.`
            : ` It is guaranteed by the ${country.guarantee.scheme} if the bank fails: ${country.guarantee.note ?? 'the limit wasn’t found'}.`)}
          {!country?.guarantee && ' No deposit guarantee stands behind it that SLATE found.'}
          {country?.policy && ` The central bank’s ${country.policy.called} is ${(country.policy.rate * 100).toFixed(2)}%, since ${formatDate(Date.parse(`${country.policy.since}T12:00:00Z`), sim.zone)}.`}
        </p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 'var(--s5)' }}>
        {accounts.map((account) => {
          const product = productOf(account);
          const fee = feeFor(sim, account, monthStart);
          const tax = interestTaxOn(sim, account);
          const paidIn = directDeposits(sim, account, monthStart);
          return (
            <Panel key={account.id} title={account.name} subtitle={account.number}>
              <div className="col gap-3">
                <div className="stat">
                  <span className="stat-label">Balance</span>
                  <span className="stat-value mono">{money(account.balance)}</span>
                </div>
                <p className="small" style={{ margin: 0 }}>{interestWords(sim, product, tax, money, bank.currency, account.openedAt)}</p>
                {product?.monthlyFee ? (
                  <p className="small" style={{ margin: 0 }}>
                    {money(inSaveMoney(sim, product.monthlyFee, bank.currency))} a month
                    {product.waiver?.depositsAtLeast !== undefined && `, waived with ${money(inSaveMoney(sim, product.waiver.depositsAtLeast, bank.currency))} of wages paid in`}
                    {product.waiver?.balanceAtLeast !== undefined && `${product.waiver.depositsAtLeast !== undefined ? ' or' : ', waived'} by keeping ${money(inSaveMoney(sim, product.waiver.balanceAtLeast, bank.currency))} in it all month`}
                    {'. '}
                    {fee.fee === 0
                      ? `This month is waived so far${fee.waivedBy === 'deposits' ? `: ${money(paidIn)} paid in` : ''}.`
                      : `This month’s is due ${formatDate(monthEnd, sim.zone)} unless that changes.`}
                  </p>
                ) : (
                  <p className="small" style={{ margin: 0 }}>No monthly fee.</p>
                )}
                {product && <p className="xs dim" style={{ margin: 0 }}>{product.estimate ? 'Estimate' : 'Source'}: {product.source}, {product.asOf}.</p>}
                {account.kind === 'savings' && (
                  <div>
                    <Gated feature="bank.close_savings" className="btn btn-sm btn-ghost" onClick={() => run('bank.close_savings', { accountId: account.id })}>
                      Close It, Moving {money(account.balance)} To {current?.name ?? 'Your Current Account'}
                    </Gated>
                  </div>
                )}
              </div>
            </Panel>
          );
        })}
        {!savings && (
          <Panel title={bank.savings.name} subtitle="Not opened">
            <p className="small">
              {bank.savings.rate ? `Pays ${(bank.savings.rate * 100).toFixed(2)}% a year.` : 'Pays no published rate.'} Opening one costs nothing.
            </p>
            <Gated feature="bank.open_savings" className="btn btn-sm" onClick={() => run('bank.open_savings', {})}>
              Open A {bank.savings.name}
            </Gated>
          </Panel>
        )}
      </div>

      {accounts.length > 1 && (
        <Panel title="Move Money" subtitle="Between your own accounts, at once.">
          <div className="field-row">
            <div className="field">
              <label htmlFor="move-from">From</label>
              <select id="move-from" value={fromId} onChange={(e) => setFrom(e.target.value)}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ···{a.last4} ({money(a.balance)})</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="move-to">To</label>
              <select id="move-to" value={toId} onChange={(e) => setTo(e.target.value)}>
                {accounts.filter((a) => a.id !== fromId).map((a) => <option key={a.id} value={a.id}>{a.name} ···{a.last4}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="move-amount">Amount ({cur})</label>
              <input id="move-amount" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <Gated feature="bank.transfer" className="btn btn-primary btn-sm" onClick={move} disabled={!amount}>
            Move It
          </Gated>
        </Panel>
      )}

      <BankLending bank={bank} />

      <OtherCharges bank={bank} />

      {country?.howMoneyMoves && (
        <p className="small muted" style={{ marginTop: 'var(--s5)' }}>{country.howMoneyMoves}</p>
      )}
    </>
  );
}

/** Percent, to as many places as the figure has. */
const pct = (rate: number) => `${Number((rate * 100).toFixed(3))}%`;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * What an account pays, said the way the bank's terms put it: the rate, any
 * change announced, a floor or a cap, a bonus and what earns it, when it is
 * paid, and what the bank takes off it for tax.
 */
function interestWords(sim: Simulation, product: Product | undefined, tax: number, money: (cents: number) => string, currency: string, openedAt: number): string {
  const step = introStep(sim, product, openedAt, sim.now);
  const rate = step ?? rateOn(product, sim.now, sim.homeZone);
  if (!product || (rate <= 0 && !product.bonus && !product.intro)) return 'Pays no interest.';
  const said: string[] = [`Pays ${pct(rate)} a year`];
  if (step !== undefined) {
    // The steps still to come, and what it pays after them.
    let through = 0;
    const ahead: string[] = [];
    for (const one of product.intro ?? []) {
      through += one.months;
      ahead.push(`${pct(one.rate)} to month ${through}`);
    }
    said.push(` for now: ${ahead.join(', ')}, and ${pct(rateOn(product, sim.now, sim.homeZone))} after, counted from when it opened`);
  }
  const next = (product.changes ?? []).find((c) => c.from > new Date(sim.now).toISOString().slice(0, 10));
  if (next) said.push(`, ${pct(next.rate)} from ${formatDate(Date.parse(`${next.from}T12:00:00Z`), sim.zone)}`);
  if (product.rateFrom !== undefined) said.push(`, on a balance of ${money(inSaveMoney(sim, product.rateFrom, currency))} or more`);
  if (product.rateUpTo !== undefined) said.push(`, on up to ${money(inSaveMoney(sim, product.rateUpTo, currency))}`);
  said.push('.');
  if (product.bonus) {
    const earn = product.bonus.when === 'no_withdrawals'
      ? 'a month with nothing taken out'
      : product.bonus.growBy !== undefined ? `a month the balance grows by ${money(inSaveMoney(sim, product.bonus.growBy, currency))}` : 'a month the balance grows';
    said.push(` Another ${pct(product.bonus.rate)} for ${earn}.`);
  }
  said.push(product.pays
    ? ` It builds each day and is paid in ${product.pays.map((m) => MONTH_NAMES[m - 1]).join(' and ')}.`
    : ' It builds each day and is paid on the last day of the month.');
  if (product.taxFree) said.push(' Tax-free.');
  else if (tax > 0) said.push(` The bank takes ${pct(tax)} of it for tax.`);
  return said.join('');
}

/** The bank's charges that aren't an account's monthly fee, and the tax the country gives back. */
function OtherCharges({ bank }: { bank: import('@/engine/content/banks').Bank }) {
  const { sim } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(inSaveMoney(sim, c, bank.currency), cur);
  const refund = bankingIn(bank.iso)?.interestTax;
  const lines: string[] = [];
  if (bank.card) {
    lines.push(`The debit card costs ${bank.card.yearly !== undefined ? `${money(bank.card.yearly)} a year` : 'nothing a year'}${bank.card.perPurchase !== undefined ? ` and ${money(bank.card.perPurchase)} a purchase` : ''}${bank.card.freeUnder !== undefined ? `, free under ${bank.card.freeUnder}` : ''}. Source: ${bank.card.source}.`);
  }
  if (bank.returned) lines.push(`A payment the bank returns unpaid costs ${money(bank.returned.fee)}. Source: ${bank.returned.source}.`);
  if (bank.dormant) lines.push(`An account unused for ${bank.dormant.afterYears} years costs ${money(bank.dormant.yearly)} a year${bank.dormant.belowBalance !== undefined ? ` while it holds under ${money(bank.dormant.belowBalance)}` : ''}. Source: ${bank.dormant.source}.`);
  if (bank.quietMonth) lines.push(`A month with fewer than ${bank.quietMonth.minTransactions} transactions costs ${money(bank.quietMonth.fee)}${bank.quietMonth.unlessWages ? ', unless wages are paid in' : ''}. Source: ${bank.quietMonth.source}.`);
  if (refund?.refund) lines.push(refund.note);
  if (lines.length === 0) return null;
  return (
    <Panel title="Other Charges">
      <div className="col gap-2">
        {lines.map((line) => <p key={line} className="small" style={{ margin: 0 }}>{line}</p>)}
      </div>
    </Panel>
  );
}
