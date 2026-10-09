/**
 * SLATE — how each thing is paid, on the bank's screen.
 *
 * The day's spending, the way the character pays it; savings linked to the
 * current account or not; standing orders
 * into savings; payments set for a date; checks in the post, and stopping
 * one; and, in SEPA, a direct debit taken back within eight weeks
 * (`systems/payments.ts`). How the rent and the bills were paid was chosen
 * here too, until the home went in the scope reset of 2026-10-09.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency, centsFromTyped } from '@/engine/core/money';
import { dateKey, formatDate, instantFromZoned, MS_DAY } from '@/engine/core/time';
import { LookRegion, Open, at } from '@/ui/looks';
import {
  checkFees, mayReclaim, paymentsOf, SCHEDULED_KIND,
} from '@/engine/systems/payments';
import { FRENCH_CARDS, cardCeilingRoom } from '@/engine/systems/lending';

export function BankPayments() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const person = useWorld((s) => s.player);
  const pay = useWorld((s) => paymentsOf(s.player));
  const cityId = person.currentLocationId;
  const accounts = useWorld((s) => Object.values(s.universe.accounts).filter((a) => a.ownerId === s.player.id && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings') && a.category !== 'term'));
  const savings = accounts.filter((a) => a.kind === 'savings');
  const current = accounts.find((a) => a.id === person.primaryAccountId);
  const scheduled = useWorld((s) => s.universe.scheduled.filter((i) => i.kind === SCHEDULED_KIND && i.status === 'pending' && i.payload.personId === s.player.id));
  // In the save's money, as the bank charges them; until 2026-09-27 the bank's own hundredths.
  const fees = checkFees(sim, person).fees;
  const ceiling = current?.bankId ? FRENCH_CARDS[current.bankId] : undefined;
  const ceilingRoom = cardCeilingRoom(sim, person);
  const reclaimable = useWorld((s) => (mayReclaim(cityId) ? s.universe.transactions.filter((t) => t.category === 'bills' && s.now - t.at <= 56 * MS_DAY && !t.reversedBy && !t.reverses
    && t.postings.some((p) => p.accountId === s.player.primaryAccountId && p.amount < 0)) : []));

  const [soAmount, setSoAmount] = useState('');
  const [soDay, setSoDay] = useState('1');
  const [soTo, setSoTo] = useState('');
  const [spFrom, setSpFrom] = useState('');
  const [spTo, setSpTo] = useState('');
  const [spAmount, setSpAmount] = useState('');
  const [spDate, setSpDate] = useState('');
  const cents = centsFromTyped;

  const addOrder = () => {
    const answer = run('bank.add_standing_order', { toId: soTo || savings[0]?.id, amount: cents(soAmount), day: Number(soDay) });
    if (answer.ok) { toast('Standing order set up.', 'positive'); setSoAmount(''); }
  };
  const schedule = () => {
    const [y, m, d] = spDate.split('-').map(Number);
    if (!y || !m || !d) return;
    const at = instantFromZoned({ year: y, month: m, day: d, hour: 9 }, sim.zone);
    const from = spFrom || current?.id;
    const to = spTo || accounts.find((a) => a.id !== from)?.id;
    const answer = run('bank.schedule_payment', { fromId: from, toId: to, amount: cents(spAmount), at });
    if (answer.ok) { toast(`Set for ${formatDate(at, sim.zone)}.`, 'positive'); setSpAmount(''); }
  };

  return (
    <Panel title="How You Pay" subtitle="The day’s spending, and where it’s paid from.">
      <div className="field-row">
        <div className="field">
          <label htmlFor="pay-everyday">The Day’s Spending</label>
          <select id="pay-everyday" value={pay.everyday} onChange={(e) => run('bank.set_payments', { everyday: e.target.value })}>
            <option value="cash">In Cash, Then The Debit Card</option>
            <option value="credit">On The Credit Card</option>
            <option value="debit">On The Debit Card</option>
          </select>
        </div>
      </div>
      <p className="small" style={{ margin: 'var(--s2) 0' }}>
        {pay.everyday === 'debit' && ceiling && ceilingRoom !== undefined ? `The debit card pays up to its ceiling ${ceiling.window === 'month' ? 'each calendar month' : 'over any 30 days'}, ${money(ceilingRoom)} still; past it the day’s shopping goes on the credit card, or isn’t bought. ` : ''}
      </p>
      {/* Only with savings to cover it: until 2026-09-27 it was offered with none, and On changed nothing. */}
      {savings.length > 0 && (
        <div className="col gap-2">
          <p className="small" style={{ margin: 0 }}>On, a payment the current account can’t make comes from savings, as far as savings lets it out, and the card’s autopay can draw on it too.</p>
          <div>
            <Gated feature="bank.set_payments" className="btn btn-sm btn-ghost" onClick={() => run('bank.set_payments', { linkSavings: !pay.linkSavings })}>
              Savings Covers The Current Account: {pay.linkSavings ? 'On' : 'Off'}
            </Gated>
          </div>
        </div>
      )}

      {savings.length > 0 && (
        <div style={{ marginTop: 'var(--s4)' }}>
          <div className="eyebrow">Standing Orders</div>
          {pay.standingOrders.map((order) => (
            <div key={order.id} className="row-between small" style={{ padding: '3px 0' }}>
              <span>{money(order.amount)} to {sim.universe.accounts[order.toId]?.name ?? 'savings'} on the {order.day}{ordinal(order.day)} of each month</span>
              <Gated feature="bank.cancel_standing_order" className="btn btn-sm btn-ghost" onClick={() => run('bank.cancel_standing_order', { id: order.id })}>Cancel</Gated>
            </div>
          ))}
          <div className="field-row">
            <div className="field"><label htmlFor="so-amount">Each Month ({cur})</label><input id="so-amount" inputMode="decimal" value={soAmount} onChange={(e) => setSoAmount(e.target.value)} /></div>
            <div className="field"><label htmlFor="so-day">On The Day</label><input id="so-day" inputMode="numeric" value={soDay} onChange={(e) => setSoDay(e.target.value)} /></div>
            {savings.length > 1 && (
              <div className="field">
                <label htmlFor="so-to">Into</label>
                <select id="so-to" value={soTo || savings[0]!.id} onChange={(e) => setSoTo(e.target.value)}>
                  {savings.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <Gated feature="bank.add_standing_order" className="btn btn-sm" onClick={addOrder} disabled={!soAmount}>Set Up A Standing Order Into Savings</Gated>
        </div>
      )}

      {accounts.length > 1 && (
        <div style={{ marginTop: 'var(--s4)' }}>
          <div className="eyebrow">Payments Set For A Date</div>
          <LookRegion>
          {scheduled.map((item) => (
            <div key={item.id} className="row-between small" style={{ padding: '3px 0' }}>
              <span>{money(Number(item.payload.amount))} to <Open subject={at('account', String(item.payload.toId))}>{sim.universe.accounts[String(item.payload.toId)]?.name}</Open> on <Open subject={at('day', dateKey(item.at, sim.homeZone))}>{formatDate(item.at, sim.zone)}</Open></span>
              <Gated feature="bank.cancel_scheduled" className="btn btn-sm btn-ghost" onClick={() => run('bank.cancel_scheduled', { id: item.id })}>Cancel</Gated>
            </div>
          ))}
          </LookRegion>
          <div className="field-row">
            <div className="field">
              <label htmlFor="sp-from">From</label>
              <select id="sp-from" value={spFrom || current?.id} onChange={(e) => setSpFrom(e.target.value)}>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sp-to">To</label>
              <select id="sp-to" value={spTo || accounts.find((a) => a.id !== (spFrom || current?.id))?.id} onChange={(e) => setSpTo(e.target.value)}>
                {accounts.filter((a) => a.id !== (spFrom || current?.id)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="sp-amount">Amount ({cur})</label><input id="sp-amount" inputMode="decimal" value={spAmount} onChange={(e) => setSpAmount(e.target.value)} /></div>
            <div className="field"><label htmlFor="sp-date">On</label><input id="sp-date" type="date" value={spDate} onChange={(e) => setSpDate(e.target.value)} /></div>
          </div>
          <Gated feature="bank.schedule_payment" className="btn btn-sm" onClick={schedule} disabled={!spAmount || !spDate}>Set The Payment</Gated>
        </div>
      )}

      {pay.checks.length > 0 && (
        <div style={{ marginTop: 'var(--s4)' }}>
          <div className="eyebrow">Checks Not Yet Cashed</div>
          {pay.checks.map((check) => (
            <div key={check.id} className="row-between small" style={{ padding: '3px 0' }}>
              <span>{check.memo}, {money(check.amount)}, cashed around {formatDate(check.clearsAt, sim.zone)}</span>
              <Gated feature="bank.stop_check" className="btn btn-sm btn-ghost" onClick={() => run('bank.stop_check', { id: check.id })}>
                Stop It{fees?.stopPayment ? ` (${money(fees.stopPayment)})` : ''}
              </Gated>
            </div>
          ))}
        </div>
      )}

      {reclaimable.length > 0 && (
        <div style={{ marginTop: 'var(--s4)' }}>
          <div className="eyebrow">Direct Debits You Can Take Back</div>
          <p className="xs dim" style={{ margin: '0 0 var(--s2)' }}>A SEPA direct debit comes back within eight weeks, no questions asked, and what it paid is owed again.</p>
          {reclaimable.map((t) => (
            <div key={t.id} className="row-between small" style={{ padding: '3px 0' }}>
              <span>{t.memo}, {formatDate(t.at, sim.zone)}</span>
              <Gated feature="bank.reclaim_debit" className="btn btn-sm btn-ghost" onClick={() => run('bank.reclaim_debit', { transactionId: t.id })}>Take It Back</Gated>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return 'th';
  return n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
}
