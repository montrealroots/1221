/**
 * SLATE — the cards in the hand, on the bank's screen
 * (`systems/security.ts`): each one's number and expiry, locking it, reporting
 * it lost, stolen or damaged, the bills on a replaced card, a new account
 * number where the bank gives one, and payments somebody else made, reported
 * as not the holder's.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { dateKey, formatDate } from '@/engine/core/time';
import { LookRegion, Open, at } from '@/ui/looks';
import { bankById } from '@/engine/content/banks';
import { FRAUD_LAW, SECURITY } from '@/engine/content/security';
import { cardAccount, disputeRefusal, ESTIMATE_YEARS, plasticView, type Which } from '@/engine/systems/security';
import { inSaveMoney } from '@/engine/systems/banking';
import { cardsOf } from '@/engine/systems/credit';
import type { Account } from '@/engine/core/ledger';
import { FRENCH_CARDS, FRENCH_CARDS_SOURCE, cardCeilingRoom } from '@/engine/systems/lending';

const WHY_WORDS = { lost: 'Lost', stolen: 'Stolen', damaged: 'Damaged', fraud: 'Used by somebody else' } as const;

export function BankSecurity({ bankId }: { bankId: string }) {
  const { sim, run, toast } = useGame();
  const [why, setWhy] = useState<'damaged' | 'lost' | 'stolen'>('lost');
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const person = useWorld((s) => s.player);
  const rules = SECURITY[bankId];
  const bank = bankById(bankId);
  const law = bank ? FRAUD_LAW[bank.iso] : undefined;
  // The debit card this bank issued, and every credit card held, each under its own bank's rules: until 2026-09-28 a person held one credit card.
  const debit = cardAccount(sim, person, 'debit');
  const cards: { which: Which; account: Account }[] = [
    ...(debit && debit.bankId === bankId ? [{ which: 'debit' as Which, account: debit }] : []),
    ...cardsOf(sim, person).map((account) => ({ which: 'credit' as Which, account })),
  ];
  if (cards.length === 0) return null;
  const ceiling = FRENCH_CARDS[bankId];
  const room = cardCeilingRoom(sim, person);
  const learned = (person.fraud ?? []).map((one, index) => ({ one, index })).filter(({ one }) => one.learnedAt <= sim.now && one.reportedAt === undefined
    && (sim.universe.accounts[one.accountId]?.bankId === bankId || cards.some((c) => c.account.id === one.accountId)));

  return (
    <Panel title="Your Cards" subtitle="Locking, loss and theft, and payments that weren’t yours">
      <LookRegion className="col gap-3">
        {cards.map(({ which, account }) => {
          const p = plasticView(sim, account, which);
          const own = SECURITY[account.bankId ?? bankId];
          const ownCurrency = bankById(account.bankId ?? bankId)?.currency ?? cur;
          const fee = which === 'debit' ? own?.replaceFeeDebit : own?.replaceFeeCredit;
          return (
            <div key={account.id} className="col gap-2">
              <div className="strong small"><Open subject={at('account', account.id)}>{which === 'debit' ? 'Debit card' : account.name} ending {p.last4}</Open>, expires <Open subject={at('day', dateKey(p.expiresAt, sim.homeZone))}>{formatDate(p.expiresAt, sim.zone)}</Open></div>
              {p.stopped && <p className="small" style={{ margin: 0 }}>{WHY_WORDS[p.stopped]}: stopped. A new one arrives {p.replacementAt ? formatDate(p.replacementAt, sim.zone) : 'soon'}.</p>}
              {p.locked && !p.stopped && <p className="small" style={{ margin: 0 }}>Locked: nothing new goes on it.</p>}
              {which === 'debit' && ceiling && (
                <p className="small" style={{ margin: 0 }}>
                  It pays up to {money(inSaveMoney(sim, ceiling.ceiling, 'EUR'))} {ceiling.window === 'month' ? 'a calendar month' : 'over any 30 days'}, SLATE’s estimate: the lowest the bank sets. {room !== undefined ? `${money(room)} is left. ` : ''}Past it a purchase goes on the credit card, or isn’t made. Source: {FRENCH_CARDS_SOURCE}.
                </p>
              )}
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {!p.stopped && (
                  <Gated feature="card.lock" className="btn btn-sm btn-ghost" onClick={() => run('card.lock', { which, locked: !p.locked, accountId: account.id })}>{p.locked ? 'Unlock It' : 'Lock It'}</Gated>
                )}
                {!p.stopped && (
                  <>
                    <select aria-label="Why" style={{ width: 'auto' }} value={why} onChange={(e) => setWhy(e.target.value as typeof why)}>
                      <option value="damaged">Damaged</option>
                      <option value="lost">Lost</option>
                      <option value="stolen">Stolen</option>
                    </select>
                    <Gated feature="card.report" className="btn btn-sm" onClick={() => {
                      const answer = run<{ arrivesAt: number; fee: number }>('card.report', { which, why, accountId: account.id });
                      if (answer.ok) toast(`Stopped. The new card arrives ${formatDate(answer.value!.arrivesAt, sim.zone)}${answer.value!.fee ? `, for ${money(answer.value!.fee)}` : ''}.`, 'positive');
                    }}>Report It</Gated>
                    {own?.rushFee !== undefined && (
                      <Gated feature="card.report" className="btn btn-sm btn-ghost" onClick={() => run('card.report', { which, why, rush: true, accountId: account.id })}>Report It, Rush The New One</Gated>
                    )}
                  </>
                )}
              </div>
              <Fine>
                {fee === undefined && own?.replaceWords ? `The bank’s terms: ${own.replaceWords} SLATE charges none. ` : ''}
                {fee === undefined && !own?.replaceWords ? 'The bank lists no fee for a new card, so SLATE charges none.' : fee === undefined ? '' : fee === 0 ? 'A new card is free.' : `A new card costs ${money(inSaveMoney(sim, fee, ownCurrency))}${own?.freeFor?.length ? `, and nothing when it’s ${own.freeFor.map((w) => w).join(' or ')}` : ''}.`}
                {own?.rushFee !== undefined ? ` Sent in a rush, ${money(inSaveMoney(sim, own.rushFee, ownCurrency))} more.` : ''}
                {(which === 'credit' ? own?.cardYearsCredit ?? own?.cardYears : own?.cardYears) === undefined ? ` Cards last ${ESTIMATE_YEARS} years here, SLATE’s estimate; the bank doesn’t say.` : ''}
              </Fine>
            </div>
          );
        })}
        {learned.map(({ one, index }) => (
          <div key={index} className="row-between small">
            <span>{money(one.amount)} {one.via === 'number' ? 'taken with your account number' : `on your ${one.which} card`}, {formatDate(one.at, sim.zone)}: not yours?</span>
            {disputeRefusal(sim, person, index) ? <span className="xs dim">{disputeRefusal(sim, person, index)}</span> : <Gated feature="card.dispute" className="btn btn-sm" onClick={() => {
              const answer = run<{ carried: number; refundAt: number }>('card.dispute', { index });
              if (answer.ok) toast(`Reported. The refund comes by ${formatDate(answer.value!.refundAt, sim.zone)}${answer.value!.carried ? `, less the ${money(answer.value!.carried)} the law leaves you` : ''}.`, 'positive');
            }}>Report It As Not Mine</Gated>}
          </div>
        ))}
        {rules?.newNumberOnFraud && (() => {
          // What a new number does (`EXPOSURE`, from 2026-10-10): attempts on the old one are declined; a card's own fraud is apart.
          const current = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
          const exposed = current?.exposed;
          const moved = exposed && current?.number !== exposed.number;
          return (
            <div className="col gap-1">
              <p className="xs" style={{ margin: 0 }}>{!exposed ? 'Your account number isn’t known to be exposed. A new number would cost a new debit card and protect against nothing yet.' : moved ? `Your old number was exposed on ${formatDate(exposed.at, sim.zone)}; it’s moved, and debits tried on the old one are declined until ${formatDate(exposed.until, sim.zone)}.` : `Your account number was exposed when your debit card was used on ${formatDate(exposed.at, sim.zone)}. Debits can be tried on it until ${formatDate(exposed.until, sim.zone)}; a new number closes it to them. It doesn’t stop a card being used: that’s the card’s own risk.`}</p>
              <Gated feature="bank.new_number" className="btn btn-sm btn-ghost" onClick={() => run('bank.new_number', {})}>Move My Account To A New Number</Gated>
            </div>
          );
        })()}
        {rules?.lostCardWords && <p className="xs dim" style={{ margin: 0 }}>{rules.lostCardWords}</p>}
        {rules?.suspectWords && <p className="xs dim" style={{ margin: 0 }}>{rules.suspectWords}</p>}
        {law?.debitWords && <p className="xs dim" style={{ margin: 0 }}>The law, for the debit card: {law.debitWords}</p>}
        {law?.creditWords && cards.some((c) => c.which === 'credit') && <p className="xs dim" style={{ margin: 0 }}>For the credit card: {law.creditWords}</p>}
        {law?.refundWords && <p className="xs dim" style={{ margin: 0 }}>A payment reported as not yours: {law.refundWords}</p>}
        {(rules || law) && <Fine>Source: {[rules?.source, law?.source].filter(Boolean).join('; ')}.</Fine>}
      </LookRegion>
    </Panel>
  );
}
