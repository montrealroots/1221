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
import { Panel, Fine, WhyNot } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency, centsFromTyped } from '@/engine/core/money';
import { dateKey, formatDate, formatDateKey, zonedParts } from '@/engine/core/time';
import { LookRegion, Open, at } from '@/ui/looks';
import { autopayAsk, cardRoom, cardsOf, cardTerms, DUE_KIND, minimumDue, stateOf, statementDayOf, statementDayRefusal, type CardTerm } from '@/engine/systems/credit';
import { bankById, banksIn } from '@/engine/content/banks';
import type { Account } from '@/engine/core/ledger';
import { transferRefusal } from '@/engine/systems/cardoffers';
import { limitFor } from '@/engine/systems/cardlife';
import { useState } from 'react';
import { inTheBank } from '@/engine/systems/spending';
import { PENDING } from '@/engine/content/pending';
import { FIRST_LATE_FEE, US_SAFE_HARBOR } from '@/engine/content/latefees';
import { bankOf, inSaveMoney } from '@/engine/systems/banking';
import { CARDS } from '@/engine/content/cards';

/**
 * A card's source and the day its terms are from, as the game writes a date. Said once where the source already ends on
 * that day: until 2026-10-17 (brief 14) 45 cards read "…/terms/, 2026-09-26, 2026-09-26.", the research's day and then
 * the same day again. Where the source ends on another day, the terms' day is named as such: until the same day 40 cards
 * read "…, September 26, 2026, April 10, 2026." with nothing saying which day was which (the data pass's record).
 */
const sourceAndDay = (source: string, asOf: string | undefined): string => {
  const day = asOf ? formatDateKey(asOf) : '';
  if (!day || source.endsWith(`, ${day}`)) return source;
  return /, [A-Z][a-z]+ \d{1,2}, \d{4}$/.test(source) ? `${source}. Terms as of ${day}` : `${source}, ${day}`;
};

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
    <Panel title={held.length ? 'Another Card' : 'Credit Card'} subtitle={credit.applied ? 'On its way' : held.length ? `${held.length} held` : 'None held'} help="bank.card">
      {credit.applied
        ? <LookRegion><p className="small" style={{ margin: 0 }}>{pending ? <Open subject={at('bank', pending.id)}>{pending.name}</Open> : 'The bank'} approved a card with a {money(credit.applied.limit)} limit. It arrives <Open subject={at('day', dateKey(credit.applied.arrivesAt, sim.homeZone))}>{formatDate(credit.applied.arrivesAt, sim.zone)}</Open>.</p></LookRegion>
        : !chosen
          ? <p className="small" style={{ margin: 0 }}>{held.length ? 'You already have a card from every bank here that issues one.' : `${home?.name ?? 'Your bank'} doesn’t issue a credit card, and no other bank here does.`}</p>
          : (
            <div className="col gap-3">
              <p className="small" style={{ margin: 0 }}>You can apply to any bank here, not only yours. It looks at your credit record and whether you have income or money to repay from, and if it says yes, the card arrives a week later. Applying takes a few points off your credit record, whether or not you’re approved.{held.length ? ' Credit bureaus look at how much of all your cards’ limits you use, taken together.' : ''}</p>
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
                  {from ? 'Apply And Move The Balance' : 'Apply For This Card'}
                </Gated>
              </div>
              {from && offer && (
                <p className="small" style={{ margin: 0 }}>
                  When the new card arrives, the {from.name}’s balance moves onto it {offer.feeShare ? `for a fee of ${pct(offer.feeShare)} of the balance` : 'with no fee'}{offer.feeMin ? ` (at least ${money(inSaveMoney(sim, offer.feeMin, chosen.currency))})` : ''}, and it’s charged {offer.introMonths !== undefined ? `${pct(offer.introApr ?? 0)} for ${offer.introMonths + ' months'}, then ` : ''}{offer.apr !== undefined ? pct(offer.apr) : 'the card’s own rate'}. The old card can’t be used for anything new while it waits, and it closes once the balance has moved.
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
  const intro = terms.standardApr !== undefined ? ` during the introductory months, then ${pct(terms.standardApr)}` : '';
  if (charge) {
    lines.push(`This is a charge card: ${terms.issuer ?? 'the bank'} takes the whole statement from your current account each month. It can’t carry a balance, and it charges ${pct(terms.apr)} a year on anything the account can’t cover.`);
  } else if (terms.aprFrom !== undefined && terms.aprTo !== undefined) {
    // The rate the card was set at when it opened (`card.apr`, as `cardTerms` reads it), not today's: from 2026-10-17. Until
    // then this said "yours opened at" the rate charged today, which in the introductory months is 0%.
    lines.push(`${pct(terms.apr)} a year on any balance you carry${intro}. ${terms.issuer} sets a new card’s rate between ${pct(terms.aprFrom)} and ${pct(terms.aprTo)} from your credit record when it opens. Yours was set at ${pct(card.apr ?? terms.priced)} when it opened, and the bank doesn’t reprice it. With your record today, a new card would get ${pct(terms.priced)}.`);
  } else {
    lines.push(`${pct(terms.apr)} a year on any balance you carry${intro}.`);
  }
  if (!charge) lines.push('Once a statement isn’t paid in full, interest builds up daily on what you owe, including the interest already added. Pay a statement in full, and new spending is charged no interest until the next one is due.');
  // Canada's rule where it runs (`CANADA_PENALTY`), the US's otherwise.
  const canadian = bankIso === 'CA';
  if (terms.penaltyApr) lines.push(terms.penaltyInForce
    ? `The penalty rate, ${pct(terms.penaltyApr)}, ${state.penalty ? `has applied since ${formatDate(state.penalty.noticeAt, sim.zone)}` : 'applies now'}. ${canadian ? 'Twelve' : 'Six'} payments on time in a row take it off.`
    : canadian ? `Miss two minimum payments in twelve months, and the rate goes up to ${pct(terms.penaltyApr)} at once, for at least twelve payments on time.` : `If a payment is sixty days late, the rate goes up to ${pct(terms.penaltyApr)} after 45 days’ notice.`);
  if (card.balance > 0) lines.push(`The card holds ${money(card.balance)} of your money.${bankIso === 'US' ? ' If it’s still there after six months, the bank sends it back to you.' : ''}`);
  // A fee the research didn't find isn't a fee of none; until 2026-09-26 the Barclaycard said it had none.
  // In a US card's first year the law holds its fees to a quarter of the limit (Reg Z §1026.52(a)), as the statement charges it.
  const firstYearFee = bankIso === 'US' && sim.now - card.openedAt < 365 * 86_400_000 ? Math.min(terms.annualFee, Math.round(limit * 0.25)) : undefined;
  lines.push(firstYearFee !== undefined && firstYearFee < terms.annualFee ? `The yearly fee is ${money(firstYearFee)} this first year, on your ${opened} statement, because the law limits a first year’s fees to a quarter of the credit limit. After that it’s ${money(terms.annualFee)} a year.` : terms.annualFee > 0 ? `The yearly fee is ${money(terms.annualFee)}, on your ${opened} statement.` : terms.estimated.includes('annualFee') ? 'No yearly fee was found for it, so none is charged in the game.' : 'No yearly fee.');
  lines.push(`Statements come on the ${statementDayOf(person, card)}${ordinal(statementDayOf(person, card))}, and payment is due ${terms.graceDays !== undefined ? `${terms.graceDays} days after each one` : 'on the 15th of the next month'}.${due ? ` The next payment is due ${formatDate(due.at, sim.zone)}.` : ''}`);
  // On a hardship plan a statement asks the plan’s payment in the minimum’s place (`autopayAsk`), and the plan’s line
  // below says so with this statement’s; the card’s own rule is what it asks once the plan ends. Until 2026-10-13 these
  // lines gave the card’s minimum on this statement on a plan too, and the late fee’s said “short of the minimum”, where
  // the due date judges the plan’s payment; found by that day’s guide audit.
  const plan = state.hardship;
  const thisOne = state.statementBalance > 0 && !plan;
  if (!charge) {
    if (terms.course) lines.push(`The minimum payment${plan ? ' once the plan ends' : ''} follows the revolving course: ${terms.course.shareByScore ? 'a share of the statement set by your credit grade' : terms.course.every ? `${money(inSaveMoney(sim, terms.course.pay ?? 0, bankById(card.bankId ?? '')!.currency))} for each ${money(inSaveMoney(sim, terms.course.every, bankById(card.bankId ?? '')!.currency))} owed` : `${money(inSaveMoney(sim, terms.course.pay ?? 0, bankById(card.bankId ?? '')!.currency))} of what’s owed`}${terms.minimumPlusInterest ? ' plus the month’s interest' : ''}.${thisOne ? ` On this statement it’s ${money(minimumDue(sim, state.statementBalance, terms, state.statementInterest ?? 0))}.` : ''}`);
    else lines.push(`The minimum payment${plan ? ' once the plan ends' : ''} is ${pct(terms.minimumShare)} of the statement${terms.minimumPlusInterest ? ' plus the month’s interest' : ''}${terms.minimumFloor > 0 ? `, or ${money(terms.minimumFloor)} if that’s more` : ''}${terms.minimumOfLimit ? `, and never under ${money(terms.minimumOfLimit)}, 1.25% of the limit, as Mexico’s central bank sets it` : ''}.${thisOne ? ` On this statement it’s ${money(minimumDue(sim, state.statementBalance, terms, state.statementInterest ?? 0))}.` : ''}`);
  }
  // As the engine takes it, by country: until 2026-09-27 every card read as America's rule of the day before.
  const asks = plan ? 'the plan’s payment' : 'the minimum';
  const short = plan || !charge ? asks : 'the statement';
  if (bankIso === 'US') {
    const asked = state.statementBalance > 0 ? autopayAsk(sim, person, card).due : undefined;
    // As the due date charges it (`systems/credit.ts`): the bank's fee, its lower first fee where it has one, each held to
    // the safe harbor, and never over the minimum. Until 2026-10-10 this said the bank's flat fee, which the harbor cut.
    const tier = card.bankId ? FIRST_LATE_FEE[card.bankId] : undefined;
    const first = Math.min(tier ? Math.min(terms.lateFee, inSaveMoney(sim, tier.first, 'USD')) : terms.lateFee, inSaveMoney(sim, US_SAFE_HARBOR.first, 'USD'));
    const again = Math.min(terms.lateFee, inSaveMoney(sim, US_SAFE_HARBOR.repeat, 'USD'));
    const capped = (fee: number) => money(asked !== undefined ? Math.min(fee, asked) : fee);
    lines.push(`Paying less than ${short} by the due date costs ${capped(first)} the first time, and ${capped(again)} if it happens again within ${tier?.withinPeriods ?? US_SAFE_HARBOR.withinPeriods} billing periods, but never more than ${asks} itself. If an autopay bounces and leaves the payment short, that fee is all you’re charged, with no returned payment fee on top. If it’s still short at the next due date, thirty days late, it goes on your credit record and the limit is cut.`);
  } else {
    const rule = terms.lateRule;
    const costs = rule ? `${rule.fixed ? `${money(rule.fixed)} and ` : ''}${pct(rule.share)} of ${rule.of === 'minimum' ? asks : rule.of === 'balance' ? 'the balance' : 'what went unpaid'}${rule.min !== undefined ? `, at least ${money(rule.min)}` : ''}${rule.max !== undefined ? `, at most ${money(rule.max)}` : ''}${rule.notOverMinimum ? `, never more than ${asks}` : ''}` : money(terms.lateFee);
    lines.push(`Paying less than ${short} by the due date costs ${costs}. It also goes on your credit record, and the limit is cut.${bankIso === 'GB' ? ` ${bankName} then takes what was missed from your other accounts with it.` : ''}`);
  }
  if (bankIso === 'GB' && state.persistentNoticeAt !== undefined && !state.hardship) {
    lines.push(`Persistent debt: over eighteen months, more of what you paid went to interest and fees than to the balance, and the bank wrote to you about it on ${formatDate(state.persistentNoticeAt, sim.zone)}. If that’s still so at thirty-six months, the bank freezes the interest, sets a payment of ${money(Math.ceil(owed / 48 / 100) * 100)} a month, and suspends the card.`);
  }
  if (state.suspended === 'late') lines.push(`Suspended: you’ve missed ${state.missed ?? 0} ${(state.missed ?? 0) === 1 ? 'payment' : 'payments'} in a row. It works again once you make a payment on time. Miss six in a row, and what’s owed is charged off to collections.`);
  // Until 2026-10-13 this said the card couldn’t be used until it was cleared. A plan ends, and its suspension with it,
  // only at the first statement or due date after it’s paid off (`systems/credit.ts`), as the guide says.
  if (plan) lines.push(`${state.suspended === 'persistent' ? `After three years of persistent debt, the bank put it on a payment plan on ${formatDate(plan.since, sim.zone)}` : `It’s been on a payment plan since ${formatDate(plan.since, sim.zone)}`}. There’s no interest, and each statement asks for the plan’s ${money(plan.payment)} instead of the minimum${state.statementBalance > 0 ? `, ${money(Math.min(state.statementBalance, plan.payment))} on this one` : ''}. You can’t use the card until the plan ends, at the first statement or due date after it’s paid off.`);
  // Credit a payment from another bank freed, held while it clears (`PENDING.paymentHoldDays`).
  const holds = state.paymentHolds ?? [];
  if (holds.length) lines.push(`${money(holds.reduce((sum, one) => sum + one.amount, 0))} of the credit your payment freed up is on hold until ${formatDate(Math.max(...holds.map((one) => one.until)), sim.zone)}, while the payment clears from another bank.${card.bankId && PENDING[card.bankId]?.paymentHoldWords ? ` ${PENDING[card.bankId]!.paymentHoldWords}` : ''}`);
  if (many) lines.push(everyday ? 'This is your everyday card: the day’s spending goes on it.' : 'The day’s spending goes on your everyday card, not this one, unless you make this the everyday card.');
  if (state.closing !== undefined) lines.push('It’s closed to new spending. You keep paying off what’s owed as before, and then the account closes.');
  if (state.overLimitOptIn) lines.push('You’ve opted in to going over the limit: a purchase can take it up to a tenth over, and this card charges nothing for it.');
  if (terms.capped) {
    const caps = [terms.capped.apr !== undefined ? `the rate at ${pct(terms.capped.apr)}` : '', terms.capped.lateFee !== undefined ? `the late fee at ${money(terms.capped.lateFee)}` : ''].filter(Boolean).join(' and ');
    lines.push(`${terms.capped.law} caps ${caps}, and the card is held to that. Source: ${terms.capped.source}.`);
  }
  const listed = terms.estimated.map((one) => TERM_WORDS[one]);
  const estimated = [terms.estimated.includes('card')
    ? `${terms.issuer ?? 'The bank'}’s own card wasn’t found, so its terms are estimated from a typical American card.`
    : terms.estimated.length > 0
      ? `${(listed.length < 2 ? listed.join('') : `${listed.slice(0, -1).join(', ')} and ${listed.at(-1)}`).replace(/^./, (c) => c.toUpperCase())} ${terms.estimated.length === 1 ? 'is' : 'are'} estimated. The rest are ${terms.issuer}’s published terms.`
      : '', state.overLimitOptIn ? 'How far over the limit a bank lets a purchase go is estimated.' : ''].filter(Boolean).join(' ');

  return (
    <Panel title={terms.name} subtitle={<Open subject={at('account', card.id)}>{`${many && everyday ? 'The everyday card, ' : ''}···${card.last4 ?? ''}`}</Open>} look={at('account', card.id)} help="bank.card">
      <div className="col gap-3">
        <div className="grid grid-3">
          <div className="stat">
            <Open subject={at('account', card.id)}>
              <span className="stat-label">Owed</span>{' '}
              <span className={`stat-value mono ${owed > 0 ? 'negative' : ''}`}>{money(owed)}</span>
            </Open>
          </div>
          <div className="stat">
            <Open subject={at('account', card.id)}>
              <span className="stat-label">Left To Spend</span>{' '}
              {/* What a purchase can take, as the till asks it (`cardRoom`): until 2026-10-10 the limit less what's owed,
                  which showed room on a locked, suspended or closing card and left out held payments. */}
              <span className="stat-value mono">{money(cardRoom(person, card))}</span>{' '}
              <span className="stat-note">Of a {money(limit)} limit</span>
            </Open>
          </div>
          <div className="stat">
            <Open subject={at('account', card.id)}>
              <span className="stat-label">{charge ? 'Kind' : 'Rate'}</span>{' '}
              <span className="stat-value mono">{charge ? 'Charge' : pct(terms.apr)}</span>{' '}
              <span className="stat-note">{charge ? 'Paid in full each month' : 'A year, on a balance carried'}</span>
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
            <Gated feature="card.set_statement_day" className="btn btn-sm btn-ghost" disabled={!dayWanted || dayWanted === statementDayOf(person, card) || Boolean(statementDayRefusal(person, card))} onClick={() => {
              const answer = run('card.set_statement_day', { day: dayWanted, accountId: card.id });
              if (answer.ok) { toast(`Statements come on the ${dayWanted}${ordinal(dayWanted)} now, and the due date moves with them.`, 'positive'); setDayWanted(0); }
            }}>Change The Day</Gated>
            <WhyNot reasons={[['Change The Day', statementDayRefusal(person, card)]]} />
          </div>
          <div className="field-act">
            <div className="field">
              <label htmlFor={`card-limit-${card.id}`}>New Limit ({cur}), Now {money(limit)}</label>
              <input id={`card-limit-${card.id}`} type="text" inputMode="decimal" value={limitWanted} onChange={(e) => setLimitWanted(e.target.value)} />
            </div>
            <Gated feature="card.request_limit" className="btn btn-sm" disabled={!limitWanted} onClick={() => {
              const answer = run<{ limit: number; granted: boolean }>('card.request_limit', { limit: centsFromTyped(limitWanted), accountId: card.id });
              if (answer.ok && answer.value?.granted) { toast(`Your limit is now ${money(answer.value.limit)}.`, 'positive'); setLimitWanted(''); }
            }}>Ask For This Limit</Gated>
          </div>
        </div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          <Gated feature="card.set_auto_raise" className="btn btn-sm btn-ghost" onClick={() => run('card.set_auto_raise', { on: Boolean(state.noAutoRaise), accountId: card.id })}>
            Raise My Limit Automatically: {state.noAutoRaise ? 'Off' : 'When My Record Earns It'}
          </Gated>
          {bankIso === 'US' && (
            <Gated feature="card.set_over_limit" className="btn btn-sm btn-ghost" onClick={() => run('card.set_over_limit', { on: !state.overLimitOptIn, accountId: card.id })}>
              Going Over The Limit: {state.overLimitOptIn ? 'Allowed' : 'Declined'}
            </Gated>
          )}
        </div>
        <Fine>
          {estimated}{estimated && terms.source ? ' ' : ''}{terms.source ? `Source: ${sourceAndDay(terms.source, terms.asOf)}.` : ''}
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
