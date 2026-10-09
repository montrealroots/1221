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
 * a real one does. Every card held is here, each in its own panel, the
 * everyday one first; until 2026-09-28 a person held one card.
 */

import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency, centsFromTyped } from '@/engine/core/money';
import { dateKey, formatDate, zonedParts } from '@/engine/core/time';
import { LookRegion, Open, at } from '@/ui/looks';
import { cardRoom, cardsOf, cardTerms, DUE_KIND, minimumDue, stateOf, statementDayOf, type CardTerm } from '@/engine/systems/credit';
import { bankById, banksIn } from '@/engine/content/banks';
import type { Account } from '@/engine/core/ledger';
import { transferRefusal } from '@/engine/systems/cardoffers';
import { limitFor } from '@/engine/systems/cardlife';
import { useState } from 'react';
import { inTheBank } from '@/engine/systems/spending';
import { PENDING } from '@/engine/content/pending';
import { FIRST_LATE_FEE } from '@/engine/content/latefees';
import { bankOf, inSaveMoney } from '@/engine/systems/banking';
import { CARDS } from '@/engine/content/cards';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pct = (rate: number) => `${Number((rate * 100).toFixed(2))}%`;
const TERM_WORDS: Record<CardTerm, string> = {
  card: 'the card', rate: 'the rate', minimum: 'the minimum payment', lateFee: 'the late fee', annualFee: 'the yearly fee', returnedPaymentFee: 'the returned payment fee', cashAdvance: 'the cash advance’s terms',
};

export function BankCard({ bankId }: { bankId: string }) {
  const cards = useWorld((s) => cardsOf(s, s.player));
  const credit = useWorld((s) => s.player.credit);
  if (!credit) return null;
  // Every card held, the everyday one first, and then applying for another.
  return (
    <>
      {cards.map((card, i) => <CardPanel key={card.id} card={card} bankId={bankId} everyday={i === 0} many={cards.length > 1} />)}
      <CardApplication held={cards} />
    </>
  );
}

/**
 * Applying for a card (C1, C31): any bank in the country that issues one, as
 * in life, one card from each; with a balance moved onto it from a card held
 * at another bank where the new card takes one. Until 2026-09-28 only the
 * bank the current account was with, and only with no card held.
 */
function CardApplication({ held }: { held: Account[] }) {
  const { sim, run } = useGame();
  const [bankWanted, setBankWanted] = useState('');
  const [fromWanted, setFromWanted] = useState('');
  const credit = useWorld((s) => s.player.credit)!;
  const cur = saveCurrency(sim.universe);
  const money = (cents: number) => formatMoney(cents, cur, { cents: false });
  const home = bankOf(sim, sim.player);
  const issuers = (home ? banksIn(home.iso) : []).filter((b) => {
    const product = CARDS[b.id];
    return product !== undefined && !('none' in product) && !held.some((c) => c.bankId === b.id);
  });
  // Least important first: the bank the current account is with last.
  const ordered = [...issuers.filter((b) => b.id !== home?.id).reverse(), ...issuers.filter((b) => b.id === home?.id)];
  const chosen = ordered.find((b) => b.id === bankWanted) ?? ordered.at(-1);
  const product = chosen ? CARDS[chosen.id] : undefined;
  const offer = product && !('none' in product) ? product.transfer : undefined;
  const sources = offer ? held.filter((c) => c.bankId !== chosen?.id && c.balance < 0) : [];
  const from = sources.find((c) => c.id === fromWanted);
  // Offered only where the bank would take it: until 2026-09-27 Apply showed for a transfer the command refused.
  const refused = from && chosen ? transferRefusal(sim, sim.player, chosen.id, limitFor(sim, credit.score), from.id) : undefined;
  const pending = credit.applied ? bankById(credit.applied.bankId) : undefined;
  return (
    <Panel title={held.length ? 'Another Card' : 'Credit Card'} subtitle={credit.applied ? 'On its way' : held.length ? `${held.length} held` : 'None'}>
      {credit.applied
        ? <LookRegion><p className="small" style={{ margin: 0 }}>{pending ? <Open subject={at('bank', pending.id)}>{pending.name}</Open> : 'The bank'} approved a card with a {money(credit.applied.limit)} limit. It arrives <Open subject={at('day', dateKey(credit.applied.arrivesAt, sim.homeZone))}>{formatDate(credit.applied.arrivesAt, sim.zone)}</Open>.</p></LookRegion>
        : !chosen
          ? <p className="small" style={{ margin: 0 }}>{held.length ? 'You hold a card from every bank here that issues one.' : `${home?.name ?? 'Your bank'} doesn’t issue a credit card, and no other bank here does.`}</p>
          : (
            <div className="col gap-3">
              <p className="small" style={{ margin: 0 }}>Any bank here takes an application, not only yours. It reads your record and what you have to repay from, and if it says yes, the card comes in about a week. Applying costs your record a few points, yes or no.{held.length ? ' The bureaus read what’s used of all your cards’ limits together.' : ''}</p>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="card-apply-bank">Bank</label>
                  <select id="card-apply-bank" value={chosen.id} onChange={(e) => { setBankWanted(e.target.value); setFromWanted(''); }}>
                    {ordered.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                {sources.length > 0 && (
                  <div className="field">
                    <label htmlFor="card-apply-from">Move A Balance From</label>
                    <select id="card-apply-from" value={from?.id ?? ''} onChange={(e) => setFromWanted(e.target.value)}>
                      <option value="">Nothing</option>
                      {sources.map((c) => <option key={c.id} value={c.id}>{c.name}, {money(-c.balance)}</option>)}
                    </select>
                  </div>
                )}
                <Gated feature="card.apply" className="btn btn-sm" disabled={Boolean(refused)} onClick={() => run('card.apply', { bankId: chosen.id, ...(from ? { transfer: true, fromId: from.id } : {}) })}>
                  {from ? 'Apply And Move The Balance' : 'Apply For Its Card'}
                </Gated>
              </div>
              {from && offer && (
                <p className="small" style={{ margin: 0 }}>
                  The {from.name}’s balance moves onto it when it arrives, for {offer.feeShare ? `${pct(offer.feeShare)} of it` : 'no fee'}{offer.feeMin ? `, never under ${money(inSaveMoney(sim, offer.feeMin, chosen.currency))}` : ''}, at {offer.introMonths !== undefined ? `${pct(offer.introApr ?? 0)} for ${offer.introMonths + ' months'}, then ` : ''}{offer.apr !== undefined ? pct(offer.apr) : 'the card’s own rate'}. The old card takes nothing new while it waits, and closes once it’s moved.
                </p>
              )}
              {refused && <p className="small muted" style={{ margin: 0 }}>{refused}</p>}
            </div>
          )}
    </Panel>
  );
}

function CardPanel({ card, bankId, everyday, many }: { card: Account; bankId: string; everyday: boolean; many: boolean }) {
  const { sim, run, toast } = useGame();
  const person = useWorld((s) => s.player);
  const [limitWanted, setLimitWanted] = useState('');
  const [dayWanted, setDayWanted] = useState(0);
  const cur = saveCurrency(sim.universe);
  const money = (cents: number) => formatMoney(cents, cur, { cents: false });
  const credit = useWorld((s) => s.player.credit)!;
  const state = stateOf(person, card);
  const payable = useWorld((s) => Math.min(Math.max(0, -card.balance), inTheBank(s, s.player)));
  // Its own due date, or, the everyday card's, one from before cards were named.
  const due = useWorld((s) => s.timeline.pending().find((i) => i.kind === DUE_KIND && i.payload.personId === s.player.id
    && (i.payload.accountId === card.id || (i.payload.accountId === undefined && everyday))));
  const bankName = bankById(card.bankId ?? bankId)?.name ?? 'The bank';
  const terms = cardTerms(sim, card, credit.score);
  const bankIso = bankById(card.bankId ?? '')?.iso;
  const owed = Math.max(0, -card.balance);
  const limit = card.creditLimit ?? 0;
  const charge = terms.kind === 'charge';
  const opened = MONTH_NAMES[zonedParts(card.openedAt, sim.zone).month - 1];

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
    ? `The penalty rate, ${pct(terms.penaltyApr)}, is in force${state.penalty ? ` since ${formatDate(state.penalty.noticeAt, sim.zone)}` : ''}: ${canadian ? 'twelve' : 'six'} payments on time in a row takes it off.`
    : canadian ? `Two missed minimums in twelve months, and the rate becomes ${pct(terms.penaltyApr)} at once, for twelve payments on time at least.` : `Sixty days late, and after 45 days’ notice the rate becomes ${pct(terms.penaltyApr)}.`);
  if (card.balance > 0) lines.push(`The card holds ${money(card.balance)} of your money${bankIso === 'US' ? ', and sends it back after six months if it’s still there' : ''}.`);
  // A fee the research didn't find isn't a fee of none; until 2026-09-26 the Barclaycard said it had none.
  // In a US card's first year the law holds its fees to a quarter of the limit (Reg Z §1026.52(a)), as the statement charges it.
  const firstYearFee = bankIso === 'US' && sim.now - card.openedAt < 365 * 86_400_000 ? Math.min(terms.annualFee, Math.round(limit * 0.25)) : undefined;
  lines.push(firstYearFee !== undefined && firstYearFee < terms.annualFee ? `${money(firstYearFee)} this first year, on the statement in ${opened}: the law holds a first year’s fees to a quarter of the limit. ${money(terms.annualFee)} a year after.` : terms.annualFee > 0 ? `${money(terms.annualFee)} a year, on the statement in ${opened}.` : terms.estimated.includes('annualFee') ? 'Its yearly fee wasn’t found, so SLATE charges none.' : 'No yearly fee.');
  lines.push(`A statement on the ${statementDayOf(person, card)}${ordinal(statementDayOf(person, card))}, and the payment due ${terms.graceDays !== undefined ? `${terms.graceDays} days after it` : 'on the 15th of the next month'}${due ? `: next on ${formatDate(due.at, sim.zone)}` : ''}.`);
  if (!charge) {
    if (terms.course) lines.push(`The least a statement asks is the revolving course's: ${terms.course.shareByScore ? 'a share of it by your credit grade' : terms.course.every ? `${money(inSaveMoney(sim, terms.course.pay ?? 0, bankById(card.bankId ?? '')!.currency))} for each ${money(inSaveMoney(sim, terms.course.every, bankById(card.bankId ?? '')!.currency))} owed` : `${money(inSaveMoney(sim, terms.course.pay ?? 0, bankById(card.bankId ?? '')!.currency))} of what's owed`}${terms.minimumPlusInterest ? ' plus the month’s interest' : ''}${state.statementBalance > 0 ? `: ${money(minimumDue(sim, state.statementBalance, terms, state.statementInterest ?? 0))} on this one` : ''}.`);
    else lines.push(`The least a statement asks is ${pct(terms.minimumShare)} of it${terms.minimumPlusInterest ? ' plus the month’s interest' : ''}${terms.minimumFloor > 0 ? `, or ${money(terms.minimumFloor)} if that’s more` : ''}${terms.minimumOfLimit ? `, and never under ${money(terms.minimumOfLimit)}, 1.25% of the limit, as Mexico’s central bank sets it` : ''}${state.statementBalance > 0 ? `: ${money(minimumDue(sim, state.statementBalance, terms, state.statementInterest ?? 0))} on this one` : ''}.`);
  }
  // As the engine takes it, by country: until 2026-09-27 every card read as America's rule of the day before.
  const short = charge ? 'the statement' : 'the minimum';
  if (bankIso === 'US') {
    const asked = state.statementBalance > 0 ? minimumDue(sim, state.statementBalance, terms, state.statementInterest, state.statementPlanDue) : undefined;
    lines.push(`A payment short of ${short} costs ${money(asked !== undefined ? Math.min(terms.lateFee, asked) : terms.lateFee)}${asked === undefined || asked >= terms.lateFee ? ', or the minimum if that’s less' : ', the minimum, which the law holds it to'}.${card.bankId && FIRST_LATE_FEE[card.bankId] ? ` The first in ${FIRST_LATE_FEE[card.bankId]!.withinPeriods} billing periods costs ${money(inSaveMoney(sim, FIRST_LATE_FEE[card.bankId]!.first, 'USD'))}.` : ''} Still short at the next due date, thirty days past due, it goes on your record and the limit is cut.`);
  } else {
    const rule = terms.lateRule;
    const costs = rule ? `${rule.fixed ? `${money(rule.fixed)} and ` : ''}${pct(rule.share)} of ${rule.of === 'minimum' ? 'the minimum' : rule.of === 'balance' ? 'the balance' : 'what went unpaid'}${rule.min !== undefined ? `, at least ${money(rule.min)}` : ''}${rule.max !== undefined ? `, at most ${money(rule.max)}` : ''}${rule.notOverMinimum ? ', never more than the minimum' : ''}` : money(terms.lateFee);
    lines.push(`A payment short of ${short} costs ${costs}, goes on your record, and cuts the limit.${bankIso === 'GB' ? ` ${bankName} takes what was missed from your other accounts with it.` : ''}`);
  }
  if (bankIso === 'GB' && state.persistentNoticeAt !== undefined && !state.hardship) {
    lines.push(`Persistent debt: over eighteen months more went to interest and fees than to the card (the bank wrote on ${formatDate(state.persistentNoticeAt, sim.zone)}). At thirty-six the bank freezes the interest, sets ${money(Math.ceil(owed / 48 / 100) * 100)} a month, and suspends the card.`);
  }
  if (state.suspended === 'late') lines.push(`Suspended: ${state.missed ?? 0} payments missed in a row. It works again once a payment is made on time; six in a row and it's charged off to collections.`);
  if (state.hardship) lines.push(`${state.suspended === 'persistent' ? 'Three years of persistent debt, and the bank put it on a plan' : 'On a plan'} since ${formatDate(state.hardship.since, sim.zone)}: no interest, and ${money(state.hardship.payment)} a month until it’s cleared. The card can’t be used until then.`);
  // Credit a payment from another bank freed, held while it clears (`PENDING.paymentHoldDays`).
  const holds = state.paymentHolds ?? [];
  if (holds.length) lines.push(`${money(holds.reduce((sum, one) => sum + one.amount, 0))} of the credit your payment freed is held until ${formatDate(Math.max(...holds.map((one) => one.until)), sim.zone)}, while it clears from another bank.${card.bankId && PENDING[card.bankId]?.paymentHoldWords ? ` ${PENDING[card.bankId]!.paymentHoldWords}` : ''}`);
  if (many) lines.push(everyday ? 'The everyday card: the day’s spending goes on it.' : 'Beside the everyday card: the day’s spending goes on that one, and nothing goes on this unless you make it the everyday card.');
  if (state.closing !== undefined) lines.push('Closed to anything new. What’s owed is paid down as before, and then the account closes.');
  if (state.overLimitOptIn) lines.push(`Opted in to going over the limit: a purchase can take it up to a tenth over, SLATE’s estimate of what a bank allows${terms.overLimitFee ? `, for ${money(terms.overLimitFee)} a statement, three in a row at most` : ', and this card charges nothing for it'}.`);
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
    <Panel title={terms.name} subtitle={<Open subject={at('account', card.id)}>{`${many && everyday ? 'The everyday card, ' : ''}···${card.last4 ?? ''}`}</Open>} look={at('account', card.id)}>
      <div className="col gap-3">
        <div className="grid grid-3">
          <div className="stat">
            <Open subject={at('account', card.id)}>
              <span className="stat-label">Owed</span>
              <span className={`stat-value mono ${owed > 0 ? 'negative' : ''}`}>{money(owed)}</span>
            </Open>
          </div>
          <div className="stat">
            <Open subject={at('account', card.id)}>
              <span className="stat-label">Left To Spend</span>
              {/* What a purchase can take, as the till asks it (`cardRoom`): until 2026-10-10 the limit less what's owed,
                  which showed room on a locked, suspended or closing card and left out held payments. */}
              <span className="stat-value mono">{money(cardRoom(person, card))}</span>
              <span className="stat-note">Of a {money(limit)} limit</span>
            </Open>
          </div>
          <div className="stat">
            <Open subject={at('account', card.id)}>
              <span className="stat-label">{charge ? 'Kind' : 'Rate'}</span>
              <span className="stat-value mono">{charge ? 'Charge' : pct(terms.apr)}</span>
              <span className="stat-note">{charge ? 'Paid in full each month' : 'A year, on what’s carried'}</span>
            </Open>
          </div>
        </div>
        {lines.map((line) => <p key={line} className="small" style={{ margin: 0 }}>{line}</p>)}
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="finance.pay_card" className="btn btn-sm" disabled={payable === 0} onClick={() => run('finance.pay_card', { amount: 'full', accountId: card.id })}>
            {payable < owed ? 'Pay What You Can' : 'Pay Card In Full'} ({money(payable)})
          </Gated>
          {card.balance > 0 && (
            <Gated feature="card.refund_credit" className="btn btn-sm btn-ghost" onClick={() => run('card.refund_credit', { accountId: card.id })}>Send The Credit To My Account</Gated>
          )}
          {many && !everyday && state.closing === undefined && (
            <Gated feature="card.set_everyday" className="btn btn-sm btn-ghost" onClick={() => run('card.set_everyday', { accountId: card.id })}>Make It The Everyday Card</Gated>
          )}
          {state.closing === undefined && (
            <Gated feature="card.close" className="btn btn-sm btn-ghost" onClick={() => run('card.close', { accountId: card.id })}>Close The Card</Gated>
          )}
          {!state.hardship && owed > 0 && (
            <Gated feature="card.request_hardship" className="btn btn-sm btn-ghost" onClick={() => run('card.request_hardship', { accountId: card.id })}>Ask For Help With Payments</Gated>
          )}
          {!charge && (
            <Gated
              feature="finance.set_autopay"
              className="btn btn-sm btn-ghost"
              onClick={() => run('finance.set_autopay', { mode: state.autopay === 'full' ? 'minimum' : 'full', accountId: card.id })}
            >
              Autopay: {state.autopay === 'full' ? 'The Whole Statement' : 'The Minimum'}
            </Gated>
          )}
        </div>
        <div className="field-row">
          <div className="field-act">
            <div className="field">
              <label htmlFor={`card-statement-day-${card.id}`}>Statement Day</label>
              <select id={`card-statement-day-${card.id}`} value={dayWanted || statementDayOf(person, card)} onChange={(e) => setDayWanted(Number(e.target.value))}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}{ordinal(d)}</option>)}
              </select>
            </div>
            <Gated feature="card.set_statement_day" className="btn btn-sm btn-ghost" disabled={!dayWanted || dayWanted === statementDayOf(person, card)} onClick={() => {
              const answer = run('card.set_statement_day', { day: dayWanted, accountId: card.id });
              if (answer.ok) { toast(`Statements come on the ${dayWanted}${ordinal(dayWanted)} now, and the due date moves with them.`, 'positive'); setDayWanted(0); }
            }}>Move It</Gated>
          </div>
          <div className="field-act">
            <div className="field">
              <label htmlFor={`card-limit-${card.id}`}>A Different Limit ({cur}), Now {money(limit)}</label>
              <input id={`card-limit-${card.id}`} type="text" inputMode="decimal" value={limitWanted} onChange={(e) => setLimitWanted(e.target.value)} />
            </div>
            <Gated feature="card.request_limit" className="btn btn-sm" disabled={!limitWanted} onClick={() => {
              const answer = run<{ limit: number; granted: boolean }>('card.request_limit', { limit: centsFromTyped(limitWanted), accountId: card.id });
              if (answer.ok && answer.value?.granted) { toast(`The limit is ${money(answer.value.limit)} now.`, 'positive'); setLimitWanted(''); }
            }}>Ask For It</Gated>
          </div>
        </div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="card.set_auto_raise" className="btn btn-sm btn-ghost" onClick={() => run('card.set_auto_raise', { on: Boolean(state.noAutoRaise), accountId: card.id })}>
            Raise My Limit Unasked: {state.noAutoRaise ? 'Never' : 'When My Record Earns It'}
          </Gated>
          {bankIso === 'US' && (
            <Gated feature="card.set_over_limit" className="btn btn-sm btn-ghost" onClick={() => run('card.set_over_limit', { on: !state.overLimitOptIn, accountId: card.id })}>
              Going Over The Limit: {state.overLimitOptIn ? 'Allowed' : 'Declined'}
            </Gated>
          )}
        </div>
        <Fine>
          {estimated}{estimated && terms.source ? ' ' : ''}{terms.source ? `Source: ${terms.source}, ${terms.asOf}.` : ''}
        </Fine>
      </div>
    </Panel>
  );
}

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return 'th';
  return n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
}
