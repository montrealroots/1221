/**
 * SLATE — the card's own offers, on the bank's screen
 * (`systems/cardoffers.ts`): its introductory rate, a balance moved from a
 * card at another bank (applied for on `ui/bank/BankCard.tsx` since
 * 2026-09-28), a money transfer into the current account, a plan
 * that pays a purchase off in equal months for a fee, and rewards.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency, centsFromTyped } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { Open, at } from '@/ui/looks';
import { bankById } from '@/engine/content/banks';
import { cardsOf, cardTerms, stateOf } from '@/engine/systems/credit';
import type { Account } from '@/engine/core/ledger';
import { BONUSES, PLAN_MONTHS, planMonthsOf, planRoom, transferRate } from '@/engine/systems/cardoffers';
import { INTEREST_PLANS } from '@/engine/content/plans';
import { inSaveMoney } from '@/engine/systems/banking';

const pct = (rate: number) => `${Number((rate * 100).toFixed(2))}%`;

export function BankCardOffers(_props: { bankId: string }) {
  const cards = useWorld((s) => cardsOf(s, s.player));
  const credit = useWorld((s) => s.player.credit);
  if (!credit) return null;
  // Each card's own, where it has any; until 2026-09-28 a person held one card. A balance moved from another bank's card is applied for beside the card (`ui/bank/BankCard.tsx`).
  return <>{cards.map((card) => <CardOffers key={card.id} card={card} />)}</>;
}

function CardOffers({ card }: { card: Account }) {
  const { sim, run, toast } = useGame();
  const [moveAmount, setMoveAmount] = useState('');
  const [planAmount, setPlanAmount] = useState('');
  const [planMonths, setPlanMonths] = useState<number>(PLAN_MONTHS[0]);
  const cur = saveCurrency(sim.universe);
  const money = (cents: number) => formatMoney(cents, cur, { cents: false });
  const interestPlan = card.bankId ? INTEREST_PLANS[card.bankId] : undefined;
  const lengths = planMonthsOf(card);
  const months = lengths.includes(planMonths) ? planMonths : lengths[0]!;
  const record = useWorld((s) => s.player.credit)!;
  const credit = stateOf(sim.player, card);
  const cents = centsFromTyped;

  const terms = cardTerms(sim, card, record.score);
  const transfers = credit.transfers ?? [];
  const plans = credit.plans ?? [];
  const room = planRoom(sim.player, card);
  if (!terms.introUntil && !terms.moneyTransferFee && !terms.planFeeShare && !(card?.bankId && INTEREST_PLANS[card.bankId]) && !terms.rewardsRate && transfers.length === 0 && plans.length === 0) return null;

  const lines: string[] = [];
  if (terms.standardApr !== undefined && terms.introUntil !== undefined) lines.push(`${pct(terms.apr)} on purchases until ${formatDate(terms.introUntil, sim.zone)}, then ${pct(terms.standardApr)}.${bankById(card.bankId ?? '')?.iso === 'US' ? ' A payment sixty days late ends it early.' : ''}`);
  else if (terms.introUntil !== undefined && credit.introLost) lines.push('Its introductory rate ended with a payment sixty days late.');
  for (const one of transfers) {
    lines.push(`${one.kind === 'balance' ? 'A balance transfer' : 'A money transfer'}: ${money(one.owed)} at ${pct(transferRate(sim, credit, one))}${one.introUntil !== undefined && sim.now < one.introUntil && !credit.introLost ? ` until ${formatDate(one.introUntil, sim.zone)}, then ${pct(one.apr)}` : ''}, interest from the day it was made.`);
  }
  for (const plan of plans) lines.push(`A plan: ${money(plan.left)} left, ${money(plan.monthly)} a month for ${plan.monthsLeft === 1 ? 'one more month' : plan.monthsLeft + ' more months'}, and ${money(plan.fee)} a month in place of interest.`);
  const bonus = card?.bankId ? BONUSES[card.bankId] : undefined;
  // Each category as the card pays it (`BONUSES`), not a base rate the rest may not earn: until 2026-09-27 this
  // said "the rest at the base rate" of cards that pay nothing on the rest, or less past a cap.
  const per = { quarter: 'a quarter', year: 'a year', cycle: 'a statement', month: 'a month' } as const;
  const part = (what: string, b: { rate: number; cap?: number; after?: number } | undefined, cur2: string) => b === undefined ? undefined
    : `${pct(b.rate)} on ${what}${b.cap !== undefined ? ` to the first ${money(inSaveMoney(sim, b.cap, cur2))} ${per[bonus!.per]}, ${pct(b.after ?? 0)} after` : ''}`;
  const bonusWords = bonus && card?.bankId ? [part('groceries', bonus.food, bankById(card.bankId)?.currency ?? 'USD'), bonus.other ? part('everything else', bonus.other, bankById(card.bankId)?.currency ?? 'USD') : `${pct(terms.rewardsRate ?? 0)} on everything else`].filter(Boolean).join('; ') : undefined;
  if (terms.rewardsRate || bonus) lines.push(`Rewards: ${bonusWords ?? `${pct(terms.rewardsRate ?? 0)} back on every purchase`}, counted at each statement. ${money(credit.rewards ?? 0)} to redeem.${terms.rewardsWords ? ` The bank’s words: ${terms.rewardsWords}. ${bonus ? 'Groceries are what a card buys here: nothing pays a bill since 2026-10-09.' : 'Its categories are ones a card doesn’t buy in SLATE, so the base rate is what it would earn.'}` : ''}`);

  return (
    <Panel title="The Card’s Offers" subtitle={<Open subject={at('account', card.id)}>{terms.name}</Open>} look={at('account', card.id)}>
      <div className="col gap-3">
        {lines.map((line) => <p key={line} className="small" style={{ margin: 0 }}>{line}</p>)}
        {terms.rewardsRate && (
          <Gated feature="card.redeem_rewards" className="btn btn-sm btn-ghost" disabled={(credit.rewards ?? 0) <= 0} onClick={() => run('card.redeem_rewards', { accountId: card.id })}>Redeem Onto The Card</Gated>
        )}
        {terms.moneyTransferFee && (
          <div className="field-row">
            <div className="field">
              <label htmlFor={`card-money-transfer-${card.id}`}>A Money Transfer To Your Account ({cur})</label>
              <input id={`card-money-transfer-${card.id}`} inputMode="decimal" value={moveAmount} onChange={(e) => setMoveAmount(e.target.value)} />
            </div>
            <Gated feature="card.money_transfer" className="btn btn-sm" disabled={!moveAmount} onClick={() => {
              const answer = run<{ fee: number }>('card.money_transfer', { amount: cents(moveAmount), accountId: card.id });
              if (answer.ok) { toast(`Moved, for a ${money(answer.value!.fee)} fee.`, 'positive'); setMoveAmount(''); }
            }}>Move It ({pct(terms.moneyTransferFee)} Fee)</Gated>
          </div>
        )}
        {(terms.planFeeShare || interestPlan) && (
          <>
            <p className="small" style={{ margin: 0 }}>
              {interestPlan
                ? `A plan pays part of what purchases owe off in equal months: ${Object.entries(interestPlan.months).map(([m, t]) => `${m} months ${t.apr !== undefined ? `at ${pct(t.apr)} a year` : t.fee ? `for ${pct(t.fee)} of it` : 'free'}`).join(', ')}${interestPlan.min !== undefined ? `, on ${formatMoney(inSaveMoney(sim, interestPlan.min, bankById(card!.bankId!)!.currency), cur)} or more` : ''}. ${money(room)} can go into one.`
                : `A plan pays part of what purchases owe off in equal months for ${pct(terms.planFeeShare!)} of it a month, the most the bank says it charges, instead of interest. ${money(room)} can go into one.`}
            </p>
            <div className="field-row">
              <div className="field">
                <label htmlFor={`card-plan-amount-${card.id}`}>Into A Plan ({cur})</label>
                <input id={`card-plan-amount-${card.id}`} inputMode="decimal" value={planAmount} onChange={(e) => setPlanAmount(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor={`card-plan-months-${card.id}`}>Over</label>
                <select id={`card-plan-months-${card.id}`} value={months} onChange={(e) => setPlanMonths(Number(e.target.value))}>
                  {lengths.map((m) => <option key={m} value={m}>{m + ' months'}</option>)}
                </select>
              </div>
              <Gated feature="card.plan" className="btn btn-sm" disabled={!planAmount || room <= 0} onClick={() => {
                const answer = run('card.plan', { amount: cents(planAmount), months, accountId: card.id });
                if (answer.ok) setPlanAmount('');
              }}>Make The Plan</Gated>
            </div>
          </>
        )}
        {terms.planWords && terms.planFeeShare && <p className="xs dim" style={{ margin: 0 }}>The bank’s plans, in its words: {terms.planWords}</p>}
      </div>
    </Panel>
  );
}
