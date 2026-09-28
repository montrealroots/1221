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
import { formatMoney, saveCurrency, centsFromTyped } from '@/engine/core/money';
import { formatDate, zonedParts } from '@/engine/core/time';
import { cardOf, cardTerms, DUE_KIND, minimumDue, statementDayOf, type CardTerm } from '@/engine/systems/credit';
import { bankById } from '@/engine/content/banks';
import { useState } from 'react';
import { inTheBank } from '@/engine/systems/household';
import { PENDING } from '@/engine/content/pending';
import { FIRST_LATE_FEE } from '@/engine/content/latefees';
import { inSaveMoney } from '@/engine/systems/banking';
import { CARDS } from '@/engine/content/cards';

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
  // Where the bank issues none, as `card.apply` refuses; until 2026-09-27 the button showed at 28 such banks.
  const current = sim.player.primaryAccountId ? sim.universe.accounts[sim.player.primaryAccountId] : undefined;
  const issuer = current?.bankId ? bankById(current.bankId) : undefined;
  const product = issuer ? CARDS[issuer.id] : undefined;
  const issuesNone = Boolean(product && 'none' in product);
  const bankName = issuer?.name ?? 'The bank';
  if (!card) {
    // No card: the one on its way, or applying for the bank's (C1).
    return (
      <Panel title="Credit Card" subtitle={credit.applied ? 'On its way' : 'None'}>
        {credit.applied
          ? <p className="small" style={{ margin: 0 }}>Approved with a {money(credit.applied.limit)} limit. It arrives {formatDate(credit.applied.arrivesAt, sim.zone)}.</p>
          : issuesNone
            ? <p className="small" style={{ margin: 0 }}>{bankName} doesn’t issue a credit card.</p>
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
  if (!charge) lines.push('Interest builds each day on what’s owed, the day’s interest included, once a statement isn’t paid in full; pay a statement in full and new spending draws none until the next is due.');
  // Canada's rule where it runs (`CANADA_PENALTY`), the US's otherwise.
  const canadian = bankIso === 'CA';
  if (terms.penaltyApr) lines.push(terms.penaltyInForce
    ? `The penalty rate, ${pct(terms.penaltyApr)}, is in force${credit.penalty ? ` since ${formatDate(credit.penalty.noticeAt, sim.zone)}` : ''}: ${canadian ? 'twelve' : 'six'} payments on time in a row takes it off.`
    : canadian ? `Two missed minimums in twelve months, and the rate becomes ${pct(terms.penaltyApr)} at once, for twelve payments on time at least.` : `Sixty days late, and after 45 days’ notice the rate becomes ${pct(terms.penaltyApr)}.`);
  if (card.balance > 0) lines.push(`The card holds ${money(card.balance)} of your money${bankIso === 'US' ? ', and sends it back after six months if it’s still there' : ''}.`);
  // A fee the research didn't find isn't a fee of none; until 2026-09-26 the Barclaycard said it had none.
  // In a US card's first year the law holds its fees to a quarter of the limit (Reg Z §1026.52(a)), as the statement charges it.
  const firstYearFee = bankIso === 'US' && sim.now - card.openedAt < 365 * 86_400_000 ? Math.min(terms.annualFee, Math.round(limit * 0.25)) : undefined;
  lines.push(firstYearFee !== undefined && firstYearFee < terms.annualFee ? `${money(firstYearFee)} this first year, on the statement in ${opened}: the law holds a first year’s fees to a quarter of the limit. ${money(terms.annualFee)} a year after.` : terms.annualFee > 0 ? `${money(terms.annualFee)} a year, on the statement in ${opened}.` : terms.estimated.includes('annualFee') ? 'Its yearly fee wasn’t found, so SLATE charges none.' : 'No yearly fee.');
  lines.push(`A statement on the ${statementDayOf(person)}${ordinal(statementDayOf(person))}, and the payment due ${terms.graceDays !== undefined ? `${terms.graceDays} days after it` : 'on the 15th of the next month'}${due ? `: next on ${formatDate(due.at, sim.zone)}` : ''}.`);
  if (!charge) {
    lines.push(`The least a statement asks is ${pct(terms.minimumShare)} of it${terms.minimumPlusInterest ? ' plus the month’s interest' : ''}${terms.minimumFloor > 0 ? `, or ${money(terms.minimumFloor)} if that’s more` : ''}${terms.minimumOfLimit ? `, and never under ${money(terms.minimumOfLimit)}, 1.25% of the limit, as Mexico’s central bank sets it` : ''}${credit.statementBalance > 0 ? `: ${money(minimumDue(sim, credit.statementBalance, terms, credit.statementInterest ?? 0))} on this one` : ''}.`);
  }
  // As the engine takes it, by country: until 2026-09-27 every card read as America's rule of the day before.
  const short = charge ? 'the statement' : 'the minimum';
  if (bankIso === 'US') {
    const asked = credit.statementBalance > 0 ? minimumDue(sim, credit.statementBalance, terms, credit.statementInterest, credit.statementPlanDue) : undefined;
    lines.push(`A payment short of ${short} costs ${money(asked !== undefined ? Math.min(terms.lateFee, asked) : terms.lateFee)}${asked === undefined || asked >= terms.lateFee ? ', or the minimum if that’s less' : ', the minimum, which the law holds it to'}.${card.bankId && FIRST_LATE_FEE[card.bankId] ? ` The first in ${FIRST_LATE_FEE[card.bankId]!.withinPeriods} billing periods costs ${money(inSaveMoney(sim, FIRST_LATE_FEE[card.bankId]!.first, 'USD'))}.` : ''} Still short at the next due date, thirty days past due, it goes on your record and the limit is cut.`);
  } else {
    const rule = terms.lateRule;
    const costs = rule ? `${rule.fixed ? `${money(rule.fixed)} and ` : ''}${pct(rule.share)} of ${rule.of === 'minimum' ? 'the minimum' : rule.of === 'balance' ? 'the balance' : 'what went unpaid'}${rule.min !== undefined ? `, at least ${money(rule.min)}` : ''}${rule.max !== undefined ? `, at most ${money(rule.max)}` : ''}${rule.notOverMinimum ? ', never more than the minimum' : ''}` : money(terms.lateFee);
    lines.push(`A payment short of ${short} costs ${costs}, goes on your record, and cuts the limit.${bankIso === 'GB' ? ` ${bankName} takes what was missed from your other accounts with it.` : ''}`);
  }
  if (bankIso === 'GB' && credit.persistentNoticeAt !== undefined && !credit.hardship) {
    lines.push(`Persistent debt: over eighteen months more went to interest and fees than to the card (the bank wrote on ${formatDate(credit.persistentNoticeAt, sim.zone)}). At thirty-six the bank freezes the interest, sets ${money(Math.ceil(owed / 48 / 100) * 100)} a month, and suspends the card.`);
  }
  if (credit.suspended === 'late') lines.push(`Suspended: ${credit.missed ?? 0} payments missed in a row. It works again once a payment is made on time; six in a row and it's charged off to collections.`);
  if (credit.hardship) lines.push(`${credit.suspended === 'persistent' ? 'Three years of persistent debt, and the bank put it on a plan' : 'On a plan'} since ${formatDate(credit.hardship.since, sim.zone)}: no interest, and ${money(credit.hardship.payment)} a month until it’s cleared. The card can’t be used until then.`);
  // Credit a payment from another bank freed, held while it clears (`PENDING.paymentHoldDays`).
  const holds = credit.paymentHolds ?? [];
  if (holds.length) lines.push(`${money(holds.reduce((sum, one) => sum + one.amount, 0))} of the credit your payment freed is held until ${formatDate(Math.max(...holds.map((one) => one.until)), sim.zone)}, while it clears from another bank.${card.bankId && PENDING[card.bankId]?.paymentHoldWords ? ` ${PENDING[card.bankId]!.paymentHoldWords}` : ''}`);
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
          <div className="field-act">
            <div className="field">
              <label htmlFor="card-statement-day">Statement Day</label>
              <select id="card-statement-day" value={dayWanted || statementDayOf(person)} onChange={(e) => setDayWanted(Number(e.target.value))}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}{ordinal(d)}</option>)}
              </select>
            </div>
            <Gated feature="card.set_statement_day" className="btn btn-sm btn-ghost" disabled={!dayWanted || dayWanted === statementDayOf(person)} onClick={() => {
              const answer = run('card.set_statement_day', { day: dayWanted });
              if (answer.ok) { toast(`Statements come on the ${dayWanted}${ordinal(dayWanted)} now, and the due date moves with them.`, 'positive'); setDayWanted(0); }
            }}>Move It</Gated>
          </div>
          <div className="field-act">
            <div className="field">
              <label htmlFor="card-limit">A Different Limit ({cur}), Now {money(limit)}</label>
              <input id="card-limit" type="text" inputMode="decimal" value={limitWanted} onChange={(e) => setLimitWanted(e.target.value)} />
            </div>
            <Gated feature="card.request_limit" className="btn btn-sm" disabled={!limitWanted} onClick={() => {
              const answer = run<{ limit: number; granted: boolean }>('card.request_limit', { limit: centsFromTyped(limitWanted) });
              if (answer.ok && answer.value?.granted) { toast(`The limit is ${money(answer.value.limit)} now.`, 'positive'); setLimitWanted(''); }
            }}>Ask For It</Gated>
          </div>
        </div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
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
