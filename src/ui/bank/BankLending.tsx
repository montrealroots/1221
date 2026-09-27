/**
 * SLATE — the bank's lending and the ways out of it, on the bank screen.
 *
 * The overdraft the bank runs and, where it arranges one, the limit and the
 * rate the record earns; a term deposit, locked for its term and ended the
 * bank's way (until 2026-09-26 this said one was always paid out and never
 * broken early, which Module 7 had made untrue); a personal
 * loan, offered at the rate and payment the bank would set before it is
 * taken, and paid off whenever there's the money; and a move to another
 * bank where you live (`systems/lending.ts`). What is SLATE's estimate
 * rather than the bank's figure says so.
 */

import { useState } from 'react';
import { homeOf } from '@/engine/systems/earnings';
import { useGame, useWorld } from '@/app/game-context';
import { Panel } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency, centsFromTyped } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import type { Bank } from '@/engine/content/banks';
import { SWITCHING } from '@/engine/content/banks-lending';
import { ACCOUNT_LIFE } from '@/engine/content/accountlife';
import { END_WORDS } from '@/engine/systems/accountlife';
import { banksFor, inSaveMoney, isoOf } from '@/engine/systems/banking';
import {
  ESTIMATE, LOAN_DUE_KIND, SWITCH_KIND, collectionsOf, lendingOf, loanOf, loanOffer, overdraftOffer, overdraftRoom, termsOf,
  FRANCE,
} from '@/engine/systems/lending';

/** Whole units typed, as a banking app takes them, in hundredths. */
const cents = centsFromTyped;
const pct = (rate: number) => `${Number((rate * 100).toFixed(2))}%`;

/** The bank screen's parts this shows: what's borrowed, what's put away for a term, and moving banks. */
export type LendingPart = 'borrowing' | 'term' | 'switch';

export function BankLending({ bank, show }: { bank: Bank; show: readonly LendingPart[] }) {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const lending = lendingOf(bank);
  const current = useWorld((s) => (s.player.primaryAccountId ? s.universe.accounts[s.player.primaryAccountId] : undefined));
  const room = useWorld((s) => overdraftRoom(s, s.player));
  const offer = useWorld((s) => overdraftOffer(s, s.player));
  const terms = useWorld((s) => termsOf(s, s.player));
  const loan = useWorld((s) => loanOf(s, s.player));
  const debt = useWorld((s) => collectionsOf(s, s.player));
  const [toCollections, setToCollections] = useState('');
  const loanDue = useWorld((s) => s.universe.scheduled.find((one) => one.kind === LOAN_DUE_KIND && one.status === 'pending'));
  const switching = useWorld((s) => s.universe.scheduled.find((one) => one.kind === SWITCH_KIND && one.status === 'pending'));
  // A bank owed a charged-off debt won't open an account.
  const owedTo = useWorld((s) => collectionsOf(s, s.player)?.institution);
  const others = banksFor(homeOf(sim.player)).filter((b) => b.id !== bank.id && b.name !== owedTo);
  const rule = SWITCHING[isoOf(homeOf(sim.player)) ?? ''];

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
      {show.includes('borrowing') && (
      <Panel title="Overdraft" subtitle={od ? undefined : 'None on record'}>
        {!od && <p className="small">{bank.name} has no overdraft terms SLATE found, so the account never goes below zero here: a payment it can’t cover comes from savings if you’ve linked it, then goes on the card, and otherwise is declined or returned unpaid.</p>}
        {od?.kind === 'per_item' && (
          <p className="small">
            {bank.name} pays what the account can’t without an arrangement, and charges {formatMoney(inSaveMoney(sim, od.fee, bank.currency), cur)}
            {od.atMidnight ? ' for an account still overdrawn at midnight' : ' for each item that overdraws it'}
            {od.maxPerDay !== undefined && !od.atMidnight ? `, at most ${od.maxPerDay} a day` : ''}
            {od.maxPerMonth !== undefined ? `, at most ${od.maxPerMonth} a month` : ''}
            {od.nextDay ? ', unless the account is back by the end of the next business day' : ''}
            {od.graceUpTo !== undefined ? `, and nothing while it’s overdrawn by ${formatMoney(inSaveMoney(sim, od.graceUpTo, bank.currency), cur, { cents: false })} or less` : ''}
            {od.rate !== undefined ? `, with ${pct(od.rate)} a year on what’s overdrawn` : ''}.
            {' '}It covers up to about {money(room)}, SLATE’s estimate: the bank publishes no limit.
          </p>
        )}
        {od?.kind === 'per_item' && od.debitCard === 'never' && (
          <p className="small">{bank.name} never pays an everyday debit card purchase into an overdraft: one it can’t pay goes on the card, or is declined.</p>
        )}
        {od?.kind === 'per_item' && od.debitCard === 'opt_in' && (
          <div className="col gap-2">
            <p className="small" style={{ margin: 0 }}>
              {current?.debitOverdraft
                ? 'You’ve opted in: an everyday debit card purchase the account can’t cover is paid into the overdraft, with its fee.'
                : 'You haven’t opted in, so an everyday debit card purchase the account can’t cover goes on the card, or is declined, and costs no fee. Bills and checks go into the overdraft either way. The law has a US bank ask first.'}
            </p>
            <div>
              <Gated feature="bank.debit_overdraft" className="btn btn-sm btn-ghost" onClick={() => run('bank.debit_overdraft', { on: !current?.debitOverdraft })}>
                {current?.debitOverdraft ? 'Opt Out Of Debit Card Overdrafts' : 'Opt In To Debit Card Overdrafts'}
              </Gated>
            </div>
          </div>
        )}
        {od?.kind === 'tacit' && (
          <p className="small">
            {bank.name} pays what the account can’t without an arrangement (a descubierto), at {pct(od.rate)} a year on what’s overdrawn, and a commission of {pct(od.commission.share)} of the month’s deepest point, at least {formatMoney(inSaveMoney(sim, od.commission.min, bank.currency), cur)}.
            {od.cap ? ` The two together may not cost more than ${pct(od.cap.rate)} a year on what was overdrawn day by day; the law’s cap (${od.cap.source}).` : ''}
            {' '}It covers up to about {money(room)}, SLATE’s estimate: the bank publishes no limit.
          </p>
        )}
        {od?.kind === 'unarranged' && (
          <p className="small">
            {bank.name} arranges no overdraft on this account, but pays what it can’t{od.rate !== undefined ? `, at ${pct(od.rate)} a year` : ''}
            {od.monthlyFee !== undefined ? `, and charges ${formatMoney(inSaveMoney(sim, od.monthlyFee, bank.currency), cur)} for a month it’s more than ${formatMoney(inSaveMoney(sim, od.graceUpTo ?? 0, bank.currency), cur, { cents: false })} overdrawn${od.freeUnder !== undefined ? `, none under ${od.freeUnder}` : ''}` : ''}.
            {od.rate === undefined ? ' The bank charges interest too, at a rate it doesn’t publish, so none is charged here.' : ''}
            {' '}It covers up to about {money(room)}, SLATE’s estimate.
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
              {od.setupFee !== undefined ? ` ${formatMoney(inSaveMoney(sim, od.setupFee, bank.currency), cur)} to set one up.` : ''}
              {od.yearlyFee !== undefined ? ` ${formatMoney(inSaveMoney(sim, od.yearlyFee, bank.currency), cur)} a year to have one.` : ''}
              {od.beyond ? ` Past the limit the bank still pays${od.beyond.rate !== undefined ? `, at ${pct(od.beyond.rate)} a year on the part beyond it` : ''}${od.beyond.fee !== undefined ? `, for ${formatMoney(inSaveMoney(sim, od.beyond.fee, bank.currency), cur)} an operation${od.beyond.maxPerMonth !== undefined ? `, at most ${od.beyond.maxPerMonth} a month` : ''}` : ''}${od.beyond.monthlyFee !== undefined ? `, and ${formatMoney(inSaveMoney(sim, od.beyond.monthlyFee, bank.currency), cur)} for a month it’s more than ${formatMoney(inSaveMoney(sim, od.beyond.graceUpTo ?? 0, bank.currency), cur, { cents: false })} past it` : ''}.` : ''}
            </p>
            {'refused' in offer
              ? <p className="small muted" style={{ margin: 0 }}>{offer.refused}</p>
              : (
                <>
                  <p className="xs dim" style={{ margin: 0 }}>
                    It would arrange {od.minLimit !== undefined ? `${money(offer.min)} to ` : 'up to '}{money(offer.max)} at {pct(offer.rate)}: a month of your wages is SLATE’s estimate of what a bank allows.
                  </p>
                  <div className="field-act">
                    <div className="field"><label htmlFor="od-limit">{`Overdraft Limit (${cur})`}</label><input id="od-limit" type="text" inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} /></div>
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
      )}

      {show.includes('term') && (
      <Panel title={lending.term?.called ?? 'Term Deposit'} subtitle={lending.term ? `${lending.term.months} months at ${pct(lending.term.rate)}` : 'None on record'}>
        {!lending.term && <p className="small">{bank.name} publishes no term deposit rate SLATE found.</p>}
        {lending.term && (
          <div className="col gap-3">
            <p className="small" style={{ margin: 0 }}>
              Locked for {lending.term.months} months at a fixed {pct(lending.term.rate)}. At its end it {END_WORDS[ACCOUNT_LIFE[bank.id]?.atEnd ?? 'paid_out']}, unless you choose another way the bank allows. Breaking one early, where the bank lets you, is under Your Accounts Over Time.
              {lending.term.minAmount !== undefined ? ` It takes ${formatMoney(inSaveMoney(sim, lending.term.minAmount, bank.currency), cur, { cents: false })} or more.` : ''}
              {lending.term.market ? ' The rate is the market’s average: the bank publishes none of its own.' : ''}
            </p>
            {terms.map((t) => (
              <p key={t.id} className="small strong" style={{ margin: 0 }}>
                {money(t.balance)} at {pct(t.fixedRate ?? 0)}, ends {formatDate(t.maturesAt ?? sim.now, sim.zone)}.
              </p>
            ))}
            <div className="field-act">
              <div className="field"><label htmlFor="term-amount">{`Term Deposit Amount (${cur})`}</label><input id="term-amount" type="text" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} /></div>
              <Gated feature="bank.open_term" className="btn btn-sm" disabled={!deposit}
                onClick={() => { if (run('bank.open_term', { amount: cents(deposit) }).ok) { toast('Put away.', 'positive'); setDeposit(''); } }}>
                Put It Away
              </Gated>
            </div>
            <p className="xs dim" style={{ margin: 0 }}>Source: {lending.term.source}.</p>
          </div>
        )}
      </Panel>
      )}

      {show.includes('borrowing') && debt && (
        <Panel title="In Collections" subtitle={`${money(-debt.balance)} owed`}>
          <div className="col gap-3">
            <p className="small" style={{ margin: 0 }}>
              {debt.institution} closed your account after it was overdrawn {bank.id.startsWith('fr-') ? `past its limit, on ${FRANCE.closingNoticeDays} days’ notice as French law asks` : `for ${ESTIMATE.closeAfterDays} days, SLATE’s estimate of how long a bank lets one run`}, and charged off what it couldn’t recover. It’s on your record until it’s paid.
            </p>
            <div className="field-act">
              <div className="field"><label htmlFor="collections-pay">{`Pay Toward It (${cur})`}</label><input id="collections-pay" type="text" inputMode="decimal" value={toCollections} onChange={(e) => setToCollections(e.target.value)} /></div>
              <Gated feature="bank.pay_collections" className="btn btn-sm" disabled={!toCollections}
                onClick={() => { if (run('bank.pay_collections', { amount: cents(toCollections) }).ok) { toast('Paid.', 'positive'); setToCollections(''); } }}>
                Pay It
              </Gated>
            </div>
          </div>
        </Panel>
      )}

      {show.includes('borrowing') && current?.creditOffered && (
        <Panel title="A Loan For The Overrun" subtitle={`${money(current.creditOffered.amount)} over ${current.creditOffered.months} months at ${pct(current.creditOffered.apr)}`}
          actions={<Gated feature="bank.take_overrun_loan" className="btn btn-sm" onClick={() => { if (run('bank.take_overrun_loan', {}).ok) toast('The overrun is a loan now.', 'positive'); }}>Take The Loan</Gated>}>
          <p className="small" style={{ margin: 0 }}>Three months past your overdraft, French law has the bank offer another credit for it. The rate is the top of its personal loan rates, SLATE’s estimate of what it would offer. Source: {FRANCE.source}.</p>
        </Panel>
      )}

      {show.includes('borrowing') && (
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
            <div className="field-act">
              <div className="field"><label htmlFor="loan-amount">{`Loan Amount (${cur})`}</label><input id="loan-amount" type="text" inputMode="decimal" value={borrow} onChange={(e) => setBorrow(e.target.value)} /></div>
              <div className="field" style={{ flex: '0 0 auto' }}><label htmlFor="loan-months">Over</label><select id="loan-months" style={{ width: 'auto' }} value={months} onChange={(e) => setMonths(e.target.value)}>
                {[12, 24, 36, 48, 60, 72, 84]
                  .filter((m) => m >= (lending.loan!.minMonths ?? ESTIMATE.loanMonths[0]) && m <= (lending.loan!.maxMonths ?? ESTIMATE.loanMonths[1]))
                  .map((m) => <option key={m} value={m}>{m} Months</option>)}
              </select></div>
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
      )}

      {show.includes('switch') && (
      <Panel title="Switch Bank" subtitle={switching ? `Under way, done ${formatDate(switching.at, sim.zone)}` : undefined}>
        {others.length === 0 ? <p className="small">No other bank where you live is on record.</p> : (
          <div className="col gap-3">
            <p className="small" style={{ margin: 0 }}>
              {rule
                ? `Through the ${rule.scheme}: ${rule.workingDays} working days, and your balances, wages and bills move with you.`
                : 'You open the new accounts and move the money yourself, the same day.'}
              {' '}An overdraft has to be cleared first. Term deposits and loans stay where they are.
            </p>
            <div className="field-act">
              <div className="field"><label htmlFor="switch-to">Switch To</label><select id="switch-to" value={target} onChange={(e) => setTarget(e.target.value)}>
                {/* The dearest current account first, the cheapest last. */}
                {[...others].sort((a, b) => (b.current.monthlyFee ?? 0) - (a.current.monthlyFee ?? 0)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select></div>
              <Gated feature="bank.switch" className="btn btn-sm" disabled={!!switching || !target}
                onClick={() => { if (run('bank.switch', { bankId: target }).ok) toast('Switch started.', 'positive'); }}>
                Switch
              </Gated>
            </div>
          </div>
        )}
      </Panel>
      )}
    </div>
  );
}
