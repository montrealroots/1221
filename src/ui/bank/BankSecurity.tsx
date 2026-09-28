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
import { formatDate } from '@/engine/core/time';
import { bankById } from '@/engine/content/banks';
import { FRAUD_LAW, SECURITY } from '@/engine/content/security';
import { cardAccount, disputeRefusal, ESTIMATE_YEARS, plasticView, type Which } from '@/engine/systems/security';
import { inSaveMoney } from '@/engine/systems/banking';
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
  const cards = (['debit', 'credit'] as Which[])
    .map((which) => ({ which, account: cardAccount(sim, person, which) }))
    .filter((one) => one.account && one.account.bankId === bankId);
  if (cards.length === 0) return null;
  const ceiling = FRENCH_CARDS[bankId];
  const room = cardCeilingRoom(sim, person);
  const learned = (person.fraud ?? []).map((one, index) => ({ one, index })).filter(({ one }) => one.learnedAt <= sim.now && one.reportedAt === undefined && sim.universe.accounts[one.accountId]?.bankId === bankId);

  return (
    <Panel title="Your Cards" subtitle="Locking, loss and theft, and payments that weren’t yours">
      <div className="col gap-3">
        {cards.map(({ which, account }) => {
          const p = plasticView(sim, account!, which);
          const fee = which === 'debit' ? rules?.replaceFeeDebit : rules?.replaceFeeCredit;
          return (
            <div key={which} className="col gap-2">
              <div className="strong small">{which === 'debit' ? 'Debit card' : 'Credit card'} ending {p.last4}, expires {formatDate(p.expiresAt, sim.zone)}</div>
              {p.stopped && <p className="small" style={{ margin: 0 }}>{WHY_WORDS[p.stopped]}: stopped. A new one arrives {p.replacementAt ? formatDate(p.replacementAt, sim.zone) : 'soon'}.</p>}
              {p.locked && !p.stopped && <p className="small" style={{ margin: 0 }}>Locked: nothing new goes on it; the bills already on it still do.</p>}
              {p.billersStale && <p className="small" style={{ margin: 0 }}>The bills on the old number are being declined until they have this one.</p>}
              {which === 'debit' && ceiling && (
                <p className="small" style={{ margin: 0 }}>
                  It pays up to {money(inSaveMoney(sim, ceiling.ceiling, 'EUR'))} {ceiling.window === 'month' ? 'a calendar month' : 'over any 30 days'}, SLATE’s estimate: the lowest the bank sets. {room !== undefined ? `${money(room)} is left. ` : ''}Past it a purchase goes on the credit card, or isn’t made. Source: {FRENCH_CARDS_SOURCE}.
                </p>
              )}
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {!p.stopped && (
                  <Gated feature="card.lock" className="btn btn-sm btn-ghost" onClick={() => run('card.lock', { which, locked: !p.locked })}>{p.locked ? 'Unlock It' : 'Lock It'}</Gated>
                )}
                {!p.stopped && (
                  <>
                    <select aria-label="Why" style={{ width: 'auto' }} value={why} onChange={(e) => setWhy(e.target.value as typeof why)}>
                      <option value="damaged">Damaged</option>
                      <option value="lost">Lost</option>
                      <option value="stolen">Stolen</option>
                    </select>
                    <Gated feature="card.report" className="btn btn-sm" onClick={() => {
                      const answer = run<{ arrivesAt: number; fee: number }>('card.report', { which, why });
                      if (answer.ok) toast(`Stopped. The new card arrives ${formatDate(answer.value!.arrivesAt, sim.zone)}${answer.value!.fee ? `, for ${money(answer.value!.fee)}` : ''}.`, 'positive');
                    }}>Report It</Gated>
                    {rules?.rushFee !== undefined && (
                      <Gated feature="card.report" className="btn btn-sm btn-ghost" onClick={() => run('card.report', { which, why, rush: true })}>Report It, Rush The New One</Gated>
                    )}
                  </>
                )}
                {p.billersStale && <Gated feature="card.update_billers" className="btn btn-sm" onClick={() => run('card.update_billers', {})}>Give The Bills The New Number</Gated>}
              </div>
              <Fine>
                {fee === undefined && rules?.replaceWords ? `The bank’s terms: ${rules.replaceWords} SLATE charges none. ` : ''}
                {fee === undefined && !rules?.replaceWords ? 'The bank lists no fee for a new card, so SLATE charges none.' : fee === undefined ? '' : fee === 0 ? 'A new card is free.' : `A new card costs ${money(inSaveMoney(sim, fee, bankById(bankId)?.currency ?? cur))}${rules?.freeFor?.length ? `, and nothing when it’s ${rules.freeFor.map((w) => w).join(' or ')}` : ''}.`}
                {rules?.rushFee !== undefined ? ` Sent in a rush, ${money(inSaveMoney(sim, rules.rushFee, bankById(bankId)?.currency ?? cur))} more.` : ''}
                {(which === 'credit' ? rules?.cardYearsCredit ?? rules?.cardYears : rules?.cardYears) === undefined ? ` Cards last ${ESTIMATE_YEARS} years here, SLATE’s estimate; the bank doesn’t say.` : ''}
              </Fine>
            </div>
          );
        })}
        {learned.map(({ one, index }) => (
          <div key={index} className="row-between small">
            <span>{money(one.amount)} on your {one.which} card, {formatDate(one.at, sim.zone)}: not yours?</span>
            {disputeRefusal(sim, person, index) ? <span className="xs dim">{disputeRefusal(sim, person, index)}</span> : <Gated feature="card.dispute" className="btn btn-sm" onClick={() => {
              const answer = run<{ carried: number; refundAt: number }>('card.dispute', { index });
              if (answer.ok) toast(`Reported. The refund comes by ${formatDate(answer.value!.refundAt, sim.zone)}${answer.value!.carried ? `, less the ${money(answer.value!.carried)} the law leaves you` : ''}.`, 'positive');
            }}>Report It As Not Mine</Gated>}
          </div>
        ))}
        {rules?.newNumberOnFraud && (
          <Gated feature="bank.new_number" className="btn btn-sm btn-ghost" onClick={() => run('bank.new_number', {})}>Move My Account To A New Number</Gated>
        )}
        {rules?.lostCardWords && <p className="xs dim" style={{ margin: 0 }}>{rules.lostCardWords}</p>}
        {rules?.suspectWords && <p className="xs dim" style={{ margin: 0 }}>{rules.suspectWords}</p>}
        {law?.debitWords && <p className="xs dim" style={{ margin: 0 }}>The law, for the debit card: {law.debitWords}</p>}
        {law?.creditWords && cards.some((c) => c.which === 'credit') && <p className="xs dim" style={{ margin: 0 }}>For the credit card: {law.creditWords}</p>}
        {law?.refundWords && <p className="xs dim" style={{ margin: 0 }}>A payment reported as not yours: {law.refundWords}</p>}
        {(rules || law) && <Fine>Source: {[rules?.source, law?.source].filter(Boolean).join('; ')}.</Fine>}
      </div>
    </Panel>
  );
}
