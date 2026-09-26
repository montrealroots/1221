/**
 * SLATE — cash, on the bank's screen: what's in hand, taking it out at an
 * ATM, the counter, the Post Office or on the card, and paying it in
 * (`systems/cash.ts`). What a withdrawal costs is shown before it's made.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { CASH } from '@/engine/content/cash';
import { walletOf, withdrawalQuote, type CashFrom, type CashTo } from '@/engine/systems/cash';
import { cardOf, cardTerms } from '@/engine/systems/credit';

export function BankCash({ bankId }: { bankId: string }) {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const person = useWorld((s) => s.player);
  const inHand = useWorld((s) => Math.max(0, walletOf(s, s.player)?.balance ?? 0));
  const accounts = useWorld((s) => Object.values(s.universe.accounts).filter((a) => a.ownerId === s.player.id && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings') && a.category !== 'term'));
  const rules = CASH[bankId];
  const card = cardOf(sim, person);
  const [outAmount, setOutAmount] = useState('');
  const [from, setFrom] = useState<CashFrom>('atm');
  const [inAmount, setInAmount] = useState('');
  const [into, setInto] = useState('');
  const [at, setAt] = useState<CashTo>('counter');
  const cents = (v: string) => Math.round(Number(v.replace(/[^\d.]/g, '')) * 100);
  const quote = outAmount ? withdrawalQuote(sim, person, cents(outAmount), from) : undefined;
  const cash = card && person.credit ? cardTerms(sim, card, person.credit.score) : undefined;

  const withdraw = () => {
    const answer = run<{ fee: number; ownerFee?: boolean }>('cash.withdraw', { amount: cents(outAmount), from });
    if (answer.ok && answer.value) {
      toast(`${money(cents(outAmount))} in hand${answer.value.fee > 0 ? `, for ${money(answer.value.fee)}` : ''}.`, 'positive');
      setOutAmount('');
    }
  };
  const deposit = () => {
    const answer = run('cash.deposit', { amount: cents(inAmount), toId: into || accounts[0]?.id, at });
    if (answer.ok) { toast('Paid in.', 'positive'); setInAmount(''); }
  };

  return (
    <Panel title="Cash" subtitle={`${money(inHand)} in hand.`}>
      <div className="field-row">
        <div className="field">
          <label htmlFor="cash-out">Take Out ({cur})</label>
          <input id="cash-out" inputMode="decimal" value={outAmount} onChange={(e) => setOutAmount(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="cash-from">From</label>
          <select id="cash-from" value={from} onChange={(e) => setFrom(e.target.value as CashFrom)}>
            {card && <option value="card">A Cash Advance On The Card</option>}
            {rules?.postOffice && <option value="post_office">The Post Office</option>}
            <option value="counter">The Counter</option>
            <option value="other_atm">Another Bank’s ATM</option>
            <option value="atm">Your Bank’s ATM</option>
          </select>
        </div>
      </div>
      {quote && (
        <p className="small" style={{ margin: 'var(--s2) 0' }}>
          {quote.refused ?? `${quote.fee > 0 ? `${money(quote.fee)} for it` : 'Free'}${quote.ownerFee ? ', and the machine’s owner may add a fee of its own, which the screen shows before you take it; SLATE doesn’t know it' : ''}.`}
          {from === 'card' && cash && !quote.refused && ` It draws ${(cash.cashApr * 100).toFixed(2)}% a year from today, with no grace period.`}
        </p>
      )}
      <Gated feature="cash.withdraw" className="btn btn-sm" disabled={!outAmount || Boolean(quote?.refused)} onClick={withdraw}>Take It Out</Gated>

      {inHand > 0 && (
        <div style={{ marginTop: 'var(--s4)' }}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="cash-in">Pay In ({cur})</label>
              <input id="cash-in" inputMode="decimal" value={inAmount} onChange={(e) => setInAmount(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cash-into">Into</label>
              <select id="cash-into" value={into || accounts[0]?.id} onChange={(e) => setInto(e.target.value)}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="cash-at">At</label>
              <select id="cash-at" value={at} onChange={(e) => setAt(e.target.value as CashTo)}>
                {rules?.postOffice === 'both' && <option value="post_office">The Post Office</option>}
                <option value="atm">An ATM</option>
                <option value="counter">The Counter</option>
              </select>
            </div>
          </div>
          <Gated feature="cash.deposit" className="btn btn-sm" disabled={!inAmount} onClick={deposit}>Pay It In</Gated>
        </div>
      )}
      <p className="xs dim" style={{ margin: 'var(--s2) 0 0' }}>
        {rules ? `Fees and limits from the bank: ${rules.source}.` : 'This bank’s cash fees weren’t found, so taking cash out here costs nothing.'}
        {cash?.estimated.includes('cashAdvance') ? ' The cash advance’s fee is SLATE’s estimate of a US card’s: 5% or $10.' : ''}
      </p>
    </Panel>
  );
}
