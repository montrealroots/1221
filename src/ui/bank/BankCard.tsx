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
import { cardOf, cardTerms, DUE_KIND, minimumDue, type CardTerm } from '@/engine/systems/credit';
import { inTheBank } from '@/engine/systems/household';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pct = (rate: number) => `${Number((rate * 100).toFixed(2))}%`;
const TERM_WORDS: Record<CardTerm, string> = {
  card: 'the card', rate: 'the rate', minimum: 'the minimum payment', lateFee: 'the late fee', annualFee: 'the yearly fee',
};

export function BankCard({ bankId }: { bankId: string }) {
  const { sim, run } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (cents: number) => formatMoney(cents, cur, { cents: false });
  const card = useWorld((s) => cardOf(s, s.player));
  const credit = useWorld((s) => s.player.credit);
  const payable = useWorld((s) => Math.min(Math.max(0, -(cardOf(s, s.player)?.balance ?? 0)), inTheBank(s, s.player)));
  const due = useWorld((s) => s.timeline.pending().find((i) => i.kind === DUE_KIND && i.payload.personId === s.player.id));
  if (!card || !credit) return null;
  const terms = cardTerms(sim, card, credit.score);
  const owed = Math.max(0, -card.balance);
  const limit = card.creditLimit ?? 0;
  const charge = terms.kind === 'charge';
  const opened = MONTH_NAMES[zonedParts(card.openedAt, sim.zone).month - 1];
  const elsewhere = terms.bankId !== undefined && terms.bankId !== bankId;

  const lines: string[] = [];
  if (charge) {
    lines.push(`${terms.issuer ?? 'The bank'} takes the whole statement from your current account each month. It can’t carry a balance, and it charges ${pct(terms.apr)} a year on anything the account couldn’t cover.`);
  } else if (terms.aprFrom !== undefined && terms.aprTo !== undefined) {
    lines.push(`${pct(terms.apr)} a year on a balance carried. ${terms.issuer} prices a card between ${pct(terms.aprFrom)} and ${pct(terms.aprTo)} by the record, and yours buys this; it’s repriced on each statement.`);
  } else {
    lines.push(`${pct(terms.apr)} a year on a balance carried, repriced on each statement. A statement paid in full costs nothing.`);
  }
  lines.push(terms.annualFee > 0 ? `${money(terms.annualFee)} a year, on the statement in ${opened}.` : 'No yearly fee.');
  lines.push(`A statement on the 20th, and the payment due ${terms.graceDays !== undefined ? `${terms.graceDays} days after it` : 'on the 15th of the next month'}${due ? `: next on ${formatDate(due.at, sim.zone)}` : ''}.`);
  if (!charge) {
    lines.push(`The least a statement asks is ${pct(terms.minimumShare)} of it${terms.minimumPlusInterest ? ' plus the month’s interest' : ''}${terms.minimumFloor > 0 ? `, or ${money(terms.minimumFloor)} if that’s more` : ''}${credit.statementBalance > 0 ? `: ${money(minimumDue(sim, credit.statementBalance, terms, credit.statementInterest ?? 0))} on this one` : ''}.`);
  }
  lines.push(`A payment short of ${charge ? 'the statement' : 'the minimum'} costs ${money(terms.lateFee)}, goes on your record, and cuts the limit.`);
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
        <p className="xs dim" style={{ margin: 0 }}>
          {estimated}{estimated && terms.source ? ' ' : ''}{terms.source ? `Source: ${terms.source}, ${terms.asOf}.` : ''}
        </p>
      </div>
    </Panel>
  );
}
