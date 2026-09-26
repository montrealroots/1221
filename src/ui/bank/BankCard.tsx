/**
 * SLATE — the credit card, on the bank's screen.
 *
 * The card is the bank's product (`content/cards.ts`), so it is shown where
 * the bank's accounts are: its name, what it owes and what's left of the
 * limit, the rate the record buys and how the bank prices it, the yearly
 * fee, the statement and the due date, the minimum and the late fee, and
 * the law's caps. Paying it and the autopay are here. Until 2026-09-26 the
 * card was run from the Money panel on Home and this screen didn't show it.
 *
 * A card issued by a bank the player has since left stays with that bank, as
 * a real one does, and says so.
 */

import { useGame, useWorld } from '@/app/game-context';
import { Panel } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate, zonedParts } from '@/engine/core/time';
import { cardOf, cardTerms, DUE_KIND, minimumDue, statementDayOf, type CardTerm } from '@/engine/systems/credit';
import { bankById } from '@/engine/content/banks';
import { useState } from 'react';
import { inTheBank } from '@/engine/systems/household';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pct = (rate: number) => `${Number((rate * 100).toFixed(2))}%`;
const TERM_WORDS: Record<CardTerm, string> = {
  card: 'the card', rate: 'the rate', minimum: 'the minimum payment', lateFee: 'the late fee', annualFee: 'the yearly fee', returnedPaymentFee: 'the returned payment fee', cashAdvance: 'the cash advance’s terms',
};

export function BankCard({ bankId }: { bankId: string }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const [limitWanted, setLimitWanted] = useState('');
  const [dayWanted, setDayWanted] = useState(0);
  const cur = saveCurrency(sim.universe);
  const money = (cents: number) => formatMoney(cents, cur, { cents: false });
  const card = useWorld((s) => cardOf(s, s.player));
  const credit = useWorld((s) => s.player.credit);
  const payable = useWorld((s) => Math.min(Math.max(0, -(cardOf(s, s.player)?.balance ?? 0)), inTheBank(s, s.player)));
  const due = useWorld((s) => s.timeline.pending().find((i) => i.kind === DUE_KIND && i.payload.personId === s.player.id));
  if (!credit) return null;
  if (!card) {
    // No card: the one on its way, or applying for the bank's (C1).
    return (
      <Panel title="Credit Card" subtitle={credit.applied ? 'On its way' : 'None'}>
        {credit.applied
          ? <p className="small" style={{ margin: 0 }}>Approved with a {money(credit.applied.limit)} limit. It arrives {formatDate(credit.applied.arrivesAt, sim.zone)}.</p>
          : (
            <>
              <p className="small">The bank reads your record and what you have to repay from, and if it says yes, the card comes in about a week. Applying costs your record a few points, yes or no.</p>
              <Gated feature="card.apply" className="btn btn-sm" onClick={() => run('card.apply', {})}>Apply For The Bank’s Card</Gated>
            </>
          )}
      </Panel>
    );
  }
  const terms = cardTerms(sim, card, credit.score);
  const bankIso = bankById(card.bankId ?? '')?.iso;
  const owed = Math.max(0, -card.balance);
  const limit = card.creditLimit ?? 0;
  const charge = terms.kind === 'charge';
  const opened = MONTH_NAMES[zonedParts(card.openedAt, sim.zone).month - 1];
  const elsewhere = terms.bankId !== undefined && terms.bankId !== bankId;

  const lines: string[] = [];
  if (charge) {
    lines.push(`${terms.issuer ?? 'The bank'} takes the whole statement from your current account each month. It can’t carry a balance, and it charges ${pct(terms.apr)} a year on anything the account couldn’t cover.`);
  } else if (terms.aprFrom !== undefined && terms.aprTo !== undefined) {
    lines.push(`${pct(terms.apr)} a year on a balance carried. ${terms.issuer} prices a card between ${pct(terms.aprFrom)} and ${pct(terms.aprTo)} by the record when it opens; yours opened at this, and it’s held there. A record today would get ${pct(terms.priced)}.`);
  } else {
    lines.push(`${pct(terms.apr)} a year on a balance carried.`);
  }
  lines.push('Interest builds each day on what’s owed, the day’s interest included, once a statement isn’t paid in full; pay a statement in full and new spending draws none until the next is due.');
  if (terms.penaltyApr) lines.push(terms.penaltyInForce ? `The penalty rate, ${pct(terms.penaltyApr)}, is in force: six payments on time in a row takes it off.` : `Sixty days late, and after 45 days’ notice the rate becomes ${pct(terms.penaltyApr)}.`);
  if (card.balance > 0) lines.push(`The card holds ${money(card.balance)} of your money${bankIso === 'US' ? ', and sends it back after six months if it’s still there' : ''}.`);
  lines.push(terms.annualFee > 0 ? `${money(terms.annualFee)} a year, on the statement in ${opened}.` : 'No yearly fee.');
  lines.push(`A statement on the ${statementDayOf(person)}${ordinal(statementDayOf(person))}, and the payment due ${terms.graceDays !== undefined ? `${terms.graceDays} days after it` : 'on the 15th of the next month'}${due ? `: next on ${formatDate(due.at, sim.zone)}` : ''}.`);
  if (!charge) {
    lines.push(`The least a statement asks is ${pct(terms.minimumShare)} of it${terms.minimumPlusInterest ? ' plus the month’s interest' : ''}${terms.minimumFloor > 0 ? `, or ${money(terms.minimumFloor)} if that’s more` : ''}${credit.statementBalance > 0 ? `: ${money(minimumDue(sim, credit.statementBalance, terms, credit.statementInterest ?? 0))} on this one` : ''}.`);
  }
  lines.push(`A payment short of ${charge ? 'the statement' : 'the minimum'} costs ${money(terms.lateFee)}, goes on your record, and cuts the limit.`);
  if (credit.suspended === 'late') lines.push(`Suspended: ${credit.missed ?? 0} payments missed in a row. It works again once a payment is made on time; six in a row and it's charged off to collections.`);
  if (credit.hardship) lines.push(`On a plan: no interest, and ${money(credit.hardship.payment)} a month until it's cleared. The card can't be used until then.`);
  if (credit.closing !== undefined) lines.push('Closed to anything new. What’s owed is paid down as before, and then the account closes.');
  if (credit.overLimitOptIn) lines.push(`Opted in to going over the limit: a purchase can take it up to a tenth over, SLATE’s estimate of what a bank allows${terms.overLimitFee ? `, for ${money(terms.overLimitFee)} a statement, three in a row at most` : ', and this card charges nothing for it'}.`);
  if (terms.capped) {
    const caps = [terms.capped.apr !== undefined ? `the rate at ${pct(terms.capped.apr)}` : '', terms.capped.lateFee !== undefined ? `a late fee at ${money(terms.capped.lateFee)}` : ''].filter(Boolean).join(' and ');
    lines.push(`${terms.capped.law} caps ${caps}, and holds the card to it. Source: ${terms.capped.source}.`);
  }
  const estimated = terms.estimated.includes('card')
    ? `${terms.issuer ?? 'The bank'}’s own card wasn’t found, so its terms are SLATE’s estimate of a typical American card's.`
    : terms.estimated.length > 0
      ? `${terms.estimated.map((one) => TERM_WORDS[one]).join(', ').replace(/^./, (c) => c.toUpperCase())} ${terms.estimated.length === 1 ? 'is' : 'are'} SLATE’s estimate; the rest is ${terms.issuer}’s.`
      : '';

  return (
    <Panel title={terms.name} subtitle={`${elsewhere ? `Issued by ${terms.issuer}, which you’ve left; ` : ''}···${card.last4 ?? ''}`}>
      <div className="col gap-3">
        <div className="grid grid-3">
          <div className="stat">
            <span className="stat-label">Owed</span>
            <span className={`stat-value mono ${owed > 0 ? 'negative' : ''}`}>{money(owed)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Left To Spend</span>
            <span className="stat-value mono">{money(Math.max(0, limit - owed))}</span>
            <span className="stat-note">Of a {money(limit)} limit</span>
          </div>
          <div className="stat">
            <span className="stat-label">{charge ? 'Kind' : 'Rate'}</span>
            <span className="stat-value mono">{charge ? 'Charge' : pct(terms.apr)}</span>
            <span className="stat-note">{charge ? 'Paid in full each month' : 'A year, on what’s carried'}</span>
          </div>
        </div>
        {lines.map((line) => <p key={line} className="small" style={{ margin: 0 }}>{line}</p>)}
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="finance.pay_card" className="btn btn-sm" disabled={payable === 0} onClick={() => run('finance.pay_card', { amount: 'full' })}>
            {payable < owed ? 'Pay What You Can' : 'Pay Card In Full'} ({money(payable)})
          </Gated>
          {card.balance > 0 && (
            <Gated feature="card.refund_credit" className="btn btn-sm btn-ghost" onClick={() => run('card.refund_credit', {})}>Send The Credit To My Account</Gated>
          )}
          {credit.closing === undefined && (
            <Gated feature="card.close" className="btn btn-sm btn-ghost" onClick={() => run('card.close', {})}>Close The Card</Gated>
          )}
          {!credit.hardship && owed > 0 && (
            <Gated feature="card.request_hardship" className="btn btn-sm btn-ghost" onClick={() => run('card.request_hardship', {})}>Ask For Help With Payments</Gated>
          )}
          {!charge && (
            <Gated
              feature="finance.set_autopay"
              className="btn btn-sm btn-ghost"
              onClick={() => run('finance.set_autopay', { mode: credit.autopay === 'full' ? 'minimum' : 'full' })}
            >
              Autopay: {credit.autopay === 'full' ? 'The Whole Statement' : 'The Minimum'}
            </Gated>
          )}
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="card-statement-day">Statement Day</label>
            <select id="card-statement-day" value={dayWanted || statementDayOf(person)} onChange={(e) => setDayWanted(Number(e.target.value))}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}{ordinal(d)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="card-limit">A Different Limit</label>
            <input id="card-limit" inputMode="decimal" value={limitWanted} placeholder={String(Math.round(limit / 100))} onChange={(e) => setLimitWanted(e.target.value)} />
          </div>
        </div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="card.set_statement_day" className="btn btn-sm btn-ghost" disabled={!dayWanted || dayWanted === statementDayOf(person)} onClick={() => {
            const answer = run('card.set_statement_day', { day: dayWanted });
            if (answer.ok) { toast(`Statements come on the ${dayWanted}${ordinal(dayWanted)} now, and the due date moves with them.`, 'positive'); setDayWanted(0); }
          }}>Move The Statement Day</Gated>
          <Gated feature="card.request_limit" className="btn btn-sm" disabled={!limitWanted} onClick={() => {
            const answer = run<{ limit: number; granted: boolean }>('card.request_limit', { limit: Math.round(Number(limitWanted.replace(/[^\d.]/g, '')) * 100) });
            if (answer.ok && answer.value?.granted) { toast(`The limit is ${money(answer.value.limit)} now.`, 'positive'); setLimitWanted(''); }
          }}>Ask For It</Gated>
          <Gated feature="card.set_auto_raise" className="btn btn-sm btn-ghost" onClick={() => run('card.set_auto_raise', { on: Boolean(credit.noAutoRaise) })}>
            Raise My Limit Unasked: {credit.noAutoRaise ? 'Never' : 'When My Record Earns It'}
          </Gated>
          {bankIso === 'US' && (
            <Gated feature="card.set_over_limit" className="btn btn-sm btn-ghost" onClick={() => run('card.set_over_limit', { on: !credit.overLimitOptIn })}>
              Going Over The Limit: {credit.overLimitOptIn ? 'Allowed' : 'Declined'}
            </Gated>
          )}
        </div>
        <p className="xs dim" style={{ margin: 0 }}>
          {estimated}{estimated && terms.source ? ' ' : ''}{terms.source ? `Source: ${terms.source}, ${terms.asOf}.` : ''}
        </p>
      </div>
    </Panel>
  );
}

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return 'th';
  return n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
}
