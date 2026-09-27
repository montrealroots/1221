/**
 * SLATE — an account's life, on the bank's screen: term deposits and their
 * end, breaking one early for the bank's penalty, taking interest during the
 * term, round-ups, a dormant account reactivated, unclaimed money claimed
 * back, and a new account or card canceled in its cooling-off period
 * (`systems/accountlife.ts`).
 */

import { useGame, useWorld } from '@/app/game-context';
import { Panel } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate } from '@/engine/core/time';
import { ACCOUNT_LIFE } from '@/engine/content/accountlife';
import { BREAK_NOTICE, breakQuote, END_WORDS, inCoolingOff, termEndOf } from '@/engine/systems/accountlife';
import type { TermEnd } from '@/engine/content/accountlife';

const END_BUTTON: Record<TermEnd, string> = {
  renews: 'Renew It At The End',
  savings: 'Move It To Savings At The End',
  paid_out: 'Pay It Out At The End',
};

export function BankAccountLife({ bankId }: { bankId: string }) {
  const { sim, run } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const person = useWorld((s) => s.player);
  const accounts = useWorld((s) => Object.values(s.universe.accounts).filter((a) => a.ownerId === s.player.id && !a.closedAt && !a.nominal));
  const rules = ACCOUNT_LIFE[bankId];
  const terms = accounts.filter((a) => a.category === 'term');
  const dormant = accounts.filter((a) => a.dormant);
  const inactive = accounts.filter((a) => a.inactive && !a.dormant);
  const cancelable = accounts.filter((a) => (a.kind === 'savings' || a.kind === 'credit_card') && inCoolingOff(sim, a) && a.id !== person.primaryAccountId);
  const unclaimed = person.unclaimed ?? [];
  if (terms.length === 0 && !rules?.roundUp && dormant.length === 0 && inactive.length === 0 && cancelable.length === 0 && unclaimed.length === 0 && !rules?.withdrawalFee) return null;

  return (
    <Panel title="Your Accounts Over Time" subtitle="Term deposits, round-ups, idle accounts, and changing your mind.">
      <div className="col gap-3">
        {terms.map((term) => {
          const quote = breakQuote(sim, term);
          const life = term.bankId ? ACCOUNT_LIFE[term.bankId] : undefined;
          return (
            <div key={term.id}>
              <div className="strong small">{term.name}, {money(term.balance)} at {((term.fixedRate ?? 0) * 100).toFixed(2)}%</div>
              <p className="small" style={{ margin: '2px 0' }}>
                {term.maturesAt ? `On ${formatDate(term.maturesAt, sim.zone)} it ${END_WORDS[termEndOf(term)]}.` : ''}
                {term.graceUntil && sim.now <= term.graceUntil ? ` Renewed: until ${formatDate(term.graceUntil, sim.zone)} it can be taken whole.` : ''}
              </p>
              <p className="xs dim" style={{ margin: '0 0 4px' }}>
                {term.breakAt !== undefined ? `Closing on ${formatDate(term.breakAt, sim.zone)}, on the notice given. ` : ''}{quote.refused ?? (quote.penalty > 0 ? `Broken now it costs ${money(quote.penalty)}${quote.estimate ? ', the interest so far: SLATE’s estimate of the bank’s penalty' : ''}.` : 'Broken now it comes out whole.')}
                {quote.words ? ` The bank’s terms: ${quote.words}` : ''}
              </p>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {(life?.endChoices ?? []).filter((end) => end !== termEndOf(term)).map((end) => (
                  <Gated key={end} feature="bank.set_term_end" className="btn btn-sm btn-ghost" onClick={() => run('bank.set_term_end', { accountId: term.id, atEnd: end })}>
                    {END_BUTTON[end]}
                  </Gated>
                ))}
                <Gated feature="bank.break_term" className="btn btn-sm btn-ghost" disabled={Boolean(quote.refused) || term.breakAt !== undefined} onClick={() => run('bank.break_term', { accountId: term.id })}>{BREAK_NOTICE[term.bankId ?? ''] ? `Give ${BREAK_NOTICE[term.bankId ?? '']} Days’ Notice` : 'Break It Early'}</Gated>
                {life?.interestDuringTerm && (
                  <Gated feature="bank.take_term_interest" className="btn btn-sm btn-ghost" disabled={Math.floor(term.accrued ?? 0) <= 0} onClick={() => run('bank.take_term_interest', { accountId: term.id })}>
                    Take The Interest So Far ({money(Math.floor(term.accrued ?? 0))})
                  </Gated>
                )}
              </div>
            </div>
          );
        })}
        {rules?.withdrawalFee !== undefined && rules.freeWithdrawals !== undefined && (
          <p className="small" style={{ margin: 0 }}>Savings here: {rules.freeWithdrawals} withdrawal{rules.freeWithdrawals === 1 ? '' : 's'} free a month, then {money(rules.withdrawalFee)} each.</p>
        )}
        {rules?.roundUp && (
          <div>
            <p className="small" style={{ margin: '0 0 4px' }}>Round-ups: {rules.roundUp}</p>
            <Gated feature="bank.set_round_ups" className="btn btn-sm btn-ghost" onClick={() => run('bank.set_round_ups', { on: !person.roundUps?.on })}>
              Round-Ups: {person.roundUps?.on ? 'On' : 'Off'}
            </Gated>
          </div>
        )}
        {inactive.map((a) => (
          <p key={a.id} className="small" style={{ margin: 0 }}>
            {a.name} is inactive, untouched for months{a.bankId && ACCOUNT_LIFE[a.bankId]?.dormantMonths !== undefined ? `, and goes dormant at ${ACCOUNT_LIFE[a.bankId]!.dormantMonths} months untouched` : ''}. Using it wakes it.
          </p>
        ))}
        {dormant.map((a) => (
          <div key={a.id} className="row-between small">
            <span>{a.name} is dormant, blocked until it’s used again.</span>
            <Gated feature="bank.reactivate" className="btn btn-sm" onClick={() => run('bank.reactivate', { accountId: a.id })}>Reactivate</Gated>
          </div>
        ))}
        {cancelable.map((a) => (
          <div key={a.id} className="row-between small">
            <span>{a.name} is new enough to cancel, {a.kind === 'credit_card' ? 'with anything spent still to repay' : 'its money back whole'}.</span>
            <Gated feature="bank.cancel_new" className="btn btn-sm btn-ghost" onClick={() => run('bank.cancel_new', { accountId: a.id })}>Cancel It</Gated>
          </div>
        ))}
        {unclaimed.length > 0 && (
          <div className="row-between small">
            <span>{money(unclaimed.reduce((sum, one) => sum + one.amount, 0))} went to {unclaimed[0]!.to} after years untouched.</span>
            <Gated feature="bank.claim_unclaimed" className="btn btn-sm" onClick={() => run('bank.claim_unclaimed', {})}>Claim It Back</Gated>
          </div>
        )}
        <p className="xs dim" style={{ margin: 0 }}>{rules ? `From the bank’s terms: ${rules.source}.` : 'This bank’s terms for these weren’t found.'}</p>
      </div>
    </Panel>
  );
}
