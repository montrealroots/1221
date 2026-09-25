/**
 * SLATE — the bank's lending and the ways out of it, on the bank screen.
 *
 * The overdraft the bank runs and, where it arranges one, the limit and the
 * rate the record earns; a term deposit, locked for its term; a personal
 * loan, offered at the rate and payment the bank would set before it is
 * taken, and paid off whenever there's the money; and a move to another
 * bank where you live (`systems/lending.ts`). What is SLATE's estimate
 * rather than the bank's figure says so.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import type { Bank } from '@/engine/content/banks';
import { SWITCHING } from '@/engine/content/banks-lending';
import { banksFor, inSaveMoney, isoOf } from '@/engine/systems/banking';
import {
  ESTIMATE, LOAN_DUE_KIND, SWITCH_KIND, lendingOf, loanOf, loanOffer, overdraftOffer, overdraftRoom, termsOf,
} from '@/engine/systems/lending';

/** Whole units typed, as a banking app takes them, in hundredths. */
const cents = (typed: string) => Math.round(Number(typed.replace(/[^\d.]/g, '')) * 100);
const pct = (rate: number) => `${Number((rate * 100).toFixed(2))}%`;

export function BankLending({ bank }: { bank: Bank }) {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const lending = lendingOf(bank);
  const current = useWorld((s) => (s.player.primaryAccountId ? s.universe.accounts[s.player.primaryAccountId] : undefined));
  const room = useWorld((s) => overdraftRoom(s, s.player));
  const offer = useWorld((s) => overdraftOffer(s, s.player));
  const terms = useWorld((s) => termsOf(s, s.player));
  const loan = useWorld((s) => loanOf(s, s.player));
  const loanDue = useWorld((s) => s.universe.scheduled.find((one) => one.kind === LOAN_DUE_KIND && one.status === 'pending'));
  const switching = useWorld((s) => s.universe.scheduled.find((one) => one.kind === SWITCH_KIND && one.status === 'pending'));
  const others = banksFor(sim.player.currentLocationId).filter((b) => b.id !== bank.id);
  const rule = SWITCHING[isoOf(sim.player.currentLocationId) ?? ''];

  const [limit, setLimit] = useState('');
  const [deposit, setDeposit] = useState('');
  const [borrow, setBorrow] = useState('');
  const [months, setMonths] = useState(String(lending.loan?.minMonths ?? 24));
  const [target, setTarget] = useState(others[0]?.id ?? '');
  const asked = cents(borrow);
  const quote = useWorld((s) => (asked > 0 ? loanOffer(s, s.player, asked, Number(months)) : undefined), [asked, months]);
  const od = lending.overdraft;

  return (
    <div className="grid grid-2" style={{ margin: 'var(--s5) 0' }}>
      <Panel title="Overdraft" subtitle={od ? undefined : 'None on record'}>
        {!od && <p className="small">{bank.name} has no overdraft terms SLATE found, so the account never goes below zero here: what it can’t pay comes off savings, then the card.</p>}
        {od?.kind === 'per_item' && (
          <p className="small">
            {bank.name} pays what the account can’t without an arrangement, and charges {formatMoney(inSaveMoney(sim, od.fee, bank.currency), cur)}
            {od.rate !== undefined ? ' for an account still overdrawn at midnight' : ' for each item that overdraws it'}
            {od.maxPerDay !== undefined && od.rate === undefined ? `, at most ${od.maxPerDay} a day` : ''}
            {od.graceUpTo !== undefined ? `, and nothing while it’s overdrawn by ${formatMoney(inSaveMoney(sim, od.graceUpTo, bank.currency), cur, { cents: false })} or less` : ''}
            {od.rate !== undefined ? `, with ${pct(od.rate)} a year on what’s overdrawn` : ''}.
            {' '}It covers up to about {money(room)}, SLATE’s estimate: the bank publishes no limit.
          </p>
        )}
        {od?.kind === 'secured' && (
          <p className="small">
            Your general account lends against your time deposits: {pct(od.share)} of them up to {formatMoney(inSaveMoney(sim, od.max, bank.currency), cur, { cents: false })}, at their rate plus {pct(od.over)}. Just now that’s {money(room)}.
          </p>
        )}
        {od?.kind === 'arranged' && (
          <div className="col gap-3">
            <p className="small" style={{ margin: 0 }}>
              {(current?.overdraftLimit ?? 0) > 0
                ? `Arranged to ${money(current!.overdraftLimit!)} at ${pct(current!.overdraftRate ?? od.rate)} a year.`
                : 'None arranged.'}
              {od.rateTo !== undefined ? ` The bank prices it by your record, ${pct(od.rate)} to ${pct(od.rateTo)}.` : (current?.overdraftLimit ?? 0) > 0 ? '' : ` ${pct(od.rate)} a year on what’s used.`}
              {od.buffer !== undefined ? ` The first ${formatMoney(inSaveMoney(sim, od.buffer, bank.currency), cur, { cents: false })} is free.` : ''}
              {od.monthlyFee !== undefined ? ` ${formatMoney(inSaveMoney(sim, od.monthlyFee, bank.currency), cur)} a month while it’s arranged.` : ''}
              {od.yearlyFee !== undefined ? ` ${formatMoney(inSaveMoney(sim, od.yearlyFee, bank.currency), cur)} a year to have one.` : ''}
            </p>
            {'refused' in offer
              ? <p className="small muted" style={{ margin: 0 }}>{offer.refused}</p>
              : (
                <>
                  <p className="xs dim" style={{ margin: 0 }}>
                    It would arrange {od.minLimit !== undefined ? `${money(offer.min)} to ` : 'up to '}{money(offer.max)} at {pct(offer.rate)}: a month of your wages is SLATE’s estimate of what a bank allows.
                  </p>
                  <div className="row gap-2">
                    <input className="grow" type="text" inputMode="decimal" aria-label={`Overdraft Limit (${cur})`} value={limit} onChange={(e) => setLimit(e.target.value)} />
                    <Gated feature="bank.arrange_overdraft" className="btn btn-sm" disabled={!limit}
                      onClick={() => { if (run('bank.arrange_overdraft', { limit: cents(limit) }).ok) { toast('Overdraft arranged.', 'positive'); setLimit(''); } }}>
                      Arrange It
                    </Gated>
                  </div>
                </>
              )}
            {(current?.overdraftLimit ?? 0) > 0 && (
              <div>
                <Gated feature="bank.arrange_overdraft" className="btn btn-sm btn-ghost" onClick={() => run('bank.arrange_overdraft', { limit: 0 })}>
                  Close The Overdraft
                </Gated>
              </div>
            )}
          </div>
        )}
        <p className="xs dim" style={{ marginTop: 'var(--s3)' }}>{od ? `Source: ${od.source}.` : bank.overdraft ?? ''}</p>
      </Panel>

      <Panel title={lending.term?.name ?? 'Term Deposit'} subtitle={lending.term ? `${lending.term.months} months at ${pct(lending.term.rate)}` : 'None on record'}>
        {!lending.term && <p className="small">{bank.name} publishes no term deposit rate SLATE found.</p>}
        {lending.term && (
          <div className="col gap-3">
            <p className="small" style={{ margin: 0 }}>
              Locked for {lending.term.months} months at a fixed {pct(lending.term.rate)}, and paid out with its interest, less any tax, into {current?.name ?? 'your current account'} at the end. SLATE doesn’t break one early.
              {lending.term.minAmount !== undefined ? ` It takes ${formatMoney(inSaveMoney(sim, lending.term.minAmount, bank.currency), cur, { cents: false })} or more.` : ''}
              {lending.term.market ? ' The rate is the market’s average: the bank publishes none of its own.' : ''}
            </p>
            {terms.map((t) => (
              <p key={t.id} className="small strong" style={{ margin: 0 }}>
                {money(t.balance)} at {pct(t.fixedRate ?? 0)}, ends {formatDate(t.maturesAt ?? sim.now, sim.zone)}.
              </p>
            ))}
            <div className="row gap-2">
              <input className="grow" type="text" inputMode="decimal" aria-label={`Term Deposit Amount (${cur})`} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
              <Gated feature="bank.open_term" className="btn btn-sm" disabled={!deposit}
                onClick={() => { if (run('bank.open_term', { amount: cents(deposit) }).ok) { toast('Put away.', 'positive'); setDeposit(''); } }}>
                Put It Away
              </Gated>
            </div>
            <p className="xs dim" style={{ margin: 0 }}>Source: {lending.term.source}.</p>
          </div>
        )}
      </Panel>

      <Panel title="Personal Loan" subtitle={loan ? `${money(-loan.balance)} owed` : lending.loan ? undefined : 'None on record'}>
        {!lending.loan && !loan && <p className="small">{bank.name} publishes no personal loan rate SLATE found.</p>}
        {loan && (
          <div className="col gap-3">
            <p className="small" style={{ margin: 0 }}>
              {money(-loan.balance)} owed at {pct(loan.apr ?? 0)} a year, {money(loan.loanPayment ?? 0)} a month
              {loanDue ? `, next on ${formatDate(loanDue.at, sim.zone)}` : ''}. A payment the account can’t make goes on your record.
            </p>
            <div>
              <Gated feature="bank.repay_loan" className="btn btn-sm" onClick={() => { if (run('bank.repay_loan', {}).ok) toast('Paid off.', 'positive'); }}>
                Pay It Off
              </Gated>
            </div>
          </div>
        )}
        {!loan && lending.loan && (
          <div className="col gap-3">
            <p className="small" style={{ margin: 0 }}>
              {lending.loan.market
                ? `At the market’s average, ${pct(lending.loan.from)}: the bank publishes no rate of its own.`
                : lending.loan.to !== undefined ? `${pct(lending.loan.from)} to ${pct(lending.loan.to)} a year, by your record.` : `From ${pct(lending.loan.from)} a year.`}
              {' '}Repaid in equal monthly payments. A bank lends against wages paid in, and a payment may take up to {Math.round(ESTIMATE.loanShareOfPay * 100)}% of a month’s: SLATE’s estimate.
            </p>
            <div className="row gap-2">
              <input className="grow" type="text" inputMode="decimal" aria-label={`Loan Amount (${cur})`} value={borrow} onChange={(e) => setBorrow(e.target.value)} />
              <select aria-label="Months" value={months} onChange={(e) => setMonths(e.target.value)}>
                {[12, 24, 36, 48, 60, 72, 84]
                  .filter((m) => m >= (lending.loan!.minMonths ?? ESTIMATE.loanMonths[0]) && m <= (lending.loan!.maxMonths ?? ESTIMATE.loanMonths[1]))
                  .map((m) => <option key={m} value={m}>{m} Months</option>)}
              </select>
            </div>
            {quote && ('refused' in quote
              ? <p className="small muted" style={{ margin: 0 }}>{quote.refused}</p>
              : <p className="small" style={{ margin: 0 }}>{pct(quote.apr)} a year: {money(quote.payment)} a month for {months} months.</p>)}
            <div>
              <Gated feature="bank.borrow" className="btn btn-sm" disabled={!quote || 'refused' in quote}
                onClick={() => { if (run('bank.borrow', { amount: asked, months: Number(months) }).ok) { toast('Borrowed.', 'positive'); setBorrow(''); } }}>
                Borrow It
              </Gated>
            </div>
            <p className="xs dim" style={{ margin: 0 }}>Source: {lending.loan.source}.</p>
          </div>
        )}
      </Panel>

      <Panel title="Switch Bank" subtitle={switching ? `Under way, done ${formatDate(switching.at, sim.zone)}` : undefined}>
        {others.length === 0 ? <p className="small">No other bank where you live is on record.</p> : (
          <div className="col gap-3">
            <p className="small" style={{ margin: 0 }}>
              {rule
                ? `Through the ${rule.scheme}: ${rule.workingDays} working days, and your balances, wages and bills move with you.`
                : 'You open the new accounts and move the money yourself, the same day.'}
              {' '}An overdraft has to be cleared first. Term deposits and loans stay where they are.
            </p>
            <div className="row gap-2">
              <select className="grow" aria-label="Bank To Switch To" value={target} onChange={(e) => setTarget(e.target.value)}>
                {others.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <Gated feature="bank.switch" className="btn btn-sm" disabled={!!switching || !target}
                onClick={() => { if (run('bank.switch', { bankId: target }).ok) toast('Switch started.', 'positive'); }}>
                Switch
              </Gated>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
