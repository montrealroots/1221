/**
 * SLATE — more than one bank, on the bank's screen (from 2026-10-10, `systems/bankmoves.ts`).
 *
 * Until then the screen offered one button, Switch Bank, which in a country with no switching service moved
 * everything to the new bank the same day. Now each step is its own, and each says what it changes and what it
 * doesn't: opening an account at another bank, with what that bank asks and how long it takes; which account is
 * primary; where wages and other payments are paid; which account each standing order and each card's autopay pays
 * from; money on its way between banks; and closing an account, with what still uses it.
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { HowItWorks } from '@/ui/guide/HowItWorks';
import { formatMoney, saveCurrency, centsFromTyped } from '@/engine/core/money';
import { MS_HOUR, formatDate, formatTime } from '@/engine/core/time';
import { Open, at } from '@/ui/looks';
import { SWITCHING } from '@/engine/content/banks-lending';
import { ESTIMATE_CARD_DAYS, ESTIMATE_SEND_DAYS, TRANSFERS } from '@/engine/content/bankopening';
import { bankById } from '@/engine/content/banks';
import { SECURITY } from '@/engine/content/security';
import { bankAccountsOf, banksFor, inSaveMoney, isoOf } from '@/engine/systems/banking';
import { checkingsOf } from '@/engine/systems/lending';
import { balanceText } from '@/engine/systems/abroad';
import { homeOf } from '@/engine/systems/earnings';
import { paymentsOf } from '@/engine/systems/payments';
import { cardsOf, autopaySource } from '@/engine/systems/credit';
import { depositAccount, linkedTo, orderSource, DEPOSIT_LEAD, PAYER_LEAD } from '@/engine/systems/routing';
import { PRIMARY_DOES, applicationsOf, channelFor, closeRefusal, openRefusal, openingOf, transfersOf } from '@/engine/systems/bankmoves';

export function BankMoves() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur, { cents: false });
  const person = useWorld((s) => s.player);
  const currents = useWorld((s) => checkingsOf(s, s.player));
  const everyday = useWorld((s) => bankAccountsOf(s, s.player));
  const banks = useWorld((s) => banksFor(homeOf(s.player)));
  const applications = useWorld((s) => applicationsOf(s, s.player));
  const transfers = useWorld((s) => transfersOf(s, s.player));
  const pay = useWorld((s) => paymentsOf(s.player));
  const deposits = useWorld((s) => depositAccount(s, s.player));
  const cards = useWorld((s) => (s.player.credit ? cardsOf(s, s.player) : []));
  const iso = isoOf(homeOf(person)) ?? '';
  const service = SWITCHING[iso];
  const kept = new Set(currents.map((a) => a.bankId));
  const others = banks.filter((b) => !kept.has(b.id) && !applications.some((a) => a.bankId === b.id));
  const [target, setTarget] = useState('');
  const [fundFrom, setFundFrom] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [remainder, setRemainder] = useState<Record<string, string>>({});
  const [sources, setSources] = useState<Record<string, string>>({});
  const chosen = bankById(target || others[0]?.id || '');
  const rules = openingOf(chosen);
  const refusal = chosen ? openRefusal(sim, person, chosen.id) : undefined;
  const minimum = chosen && rules?.minimumDeposit ? inSaveMoney(sim, rules.minimumDeposit, chosen.currency) : 0;
  const scheme = TRANSFERS[iso];
  const name = (id: string | undefined) => (id ? sim.universe.accounts[id]?.name : undefined) ?? 'an account';
  const label = (id: string) => { const a = sim.universe.accounts[id]; return a ? `${a.name} ···${a.last4} (${a.institution ?? ''})` : id; };

  const open = () => {
    if (!chosen) return;
    const answer = run<{ accountId?: string; decidedAt?: number; arrivesAt?: number; cardAt?: number }>('bank.open_current', {
      bankId: chosen.id, ...(fundFrom || minimum > 0 ? { fundFrom: fundFrom || everyday.find((a) => a.bankId !== chosen.id)?.id, amount: centsFromTyped(fundAmount) || minimum } : {}),
    });
    if (!answer.ok || !answer.value) return;
    const v = answer.value;
    toast(v.decidedAt ? `Applied: ${chosen.name} decides by ${formatDate(v.decidedAt, sim.zone)}.` : `Opened at ${chosen.name}.${v.cardAt ? ` The card arrives ${formatDate(v.cardAt, sim.zone)}.` : ''}`, 'positive');
    setFundAmount('');
  };

  const whatItTakes = (): string => {
    if (!chosen) return '';
    const parts: string[] = [];
    if (channelFor(person, chosen) === 'branch') parts.push('Without a Social Security number, you apply in a branch here, with your passport and I-20: an hour there.');
    parts.push(rules?.reviewDays ? `It decides an application in ${rules.reviewDays} business days, the longer end of what it says.` : 'It opens the account as you apply.');
    parts.push(minimum > 0 ? `It asks for an opening deposit of ${money(minimum)}, sent from another of your accounts.` : rules ? 'It asks for no opening deposit.' : 'SLATE has found no opening deposit it asks for.');
    if (rules?.openedWhenFunded) parts.push('The account counts as open only once money is in it.');
    if (rules?.fundWithinDays) parts.push(`Unfunded ${rules.fundWithinDays} days after opening, it closes.`);
    if (rules?.closesAtZeroAfterDays) parts.push(`At a zero balance for ${rules.closesAtZeroAfterDays} days, it may close.`);
    // The card's line says what `cardArrival` and `openApproved` (`systems/bankmoves.ts`) do. Until 2026-10-12 it gave
    // Bank of America's 6 business days "with a digital card in the app meanwhile", and nothing read the 6: a digital
    // card works from the day the account opens, and nothing arrives after it (docs/UNBITTEN.md). And where a bank
    // publishes no days for a new card it gave SLATE's 7, while the card came in the bank's days for a replacement
    // (`SECURITY`): Citi's 5 and SMBC's 10, at 29 of the thirteen countries' 60 banks (tests/bank-moves-card-line.test.ts).
    const card = rules?.card;
    const replacement = chosen ? SECURITY[chosen.id]?.standardDays : undefined;
    parts.push(card?.digital ? 'The debit card works from the day the account opens, as a digital card in the app.'
      : card ? `The debit card takes ${card.days} ${card.business ? 'business' : 'calendar'} days.`
        : replacement !== undefined ? `The debit card takes ${replacement} business days, as the bank’s replacement card does: SLATE’s estimate, as no figure for a new account’s card was found.`
          : `The debit card takes ${ESTIMATE_CARD_DAYS} business days, SLATE’s estimate: the bank doesn’t say.`);
    // In the order `arrivalOf` (`systems/bankmoves.ts`) runs: the bank’s cut-off, its days, the country’s instant
    // scheme, the country’s cut-off, its days. Until 2026-10-12 the country’s cut-off was never read, so a Japanese
    // bank said SLATE’s 3-day estimate while Zengin landed the money the same day, and the bank’s cut-off was written
    // "12:30", Citi’s, whatever the number.
    // A cut-off is an hour of the bank’s day, written on the 12-hour clock by `formatTime`, as the house writes a
    // time the player reads: 15.5 is 3:30 PM, the clock that many hours into a day at UTC. For part of 2026-10-12 a
    // second formatter here wrote both cut-offs on a 24-hour clock, "before 15:30" for Zengin.
    const cutOff = (h: number) => formatTime(h * MS_HOUR, 'UTC');
    parts.push(rules?.sameDayBefore !== undefined ? `Money it sends to another bank arrives the same business day before ${cutOff(rules.sameDayBefore)}, the next after.`
      : rules?.sendDays ? `Money it sends to another bank takes ${rules.sendDays} business days.`
        : scheme?.instant ? `Money between banks here arrives at once, by ${scheme.scheme}.`
          : scheme?.sameDayBefore !== undefined ? `Money between banks here arrives the same business day before ${cutOff(scheme.sameDayBefore)}, the next after, by ${scheme.scheme}.`
            : scheme?.days ? `Money between banks here takes ${scheme.days} business day${scheme.days === 1 ? '' : 's'}, by ${scheme.scheme}.`
              : `Money it sends to another bank takes ${ESTIMATE_SEND_DAYS} business days, SLATE’s estimate: the bank doesn’t say.`);
    return parts.join(' ');
  };

  return (
    <div className="col gap-4" style={{ marginBottom: 'var(--s5)' }}>
      <Panel title="Your Banks" subtitle={currents.length > 1 ? `${currents.length} current accounts` : 'One current account'} help="bank.other-banks">
        <div className="col gap-3">
          {currents.map((a) => {
            const links = linkedTo(sim, person, a.id);
            const closing = closeRefusal(sim, person, a);
            const elsewhere = everyday.filter((b) => b.id !== a.id);
            const into = remainder[a.id] || elsewhere.find((b) => b.id === person.primaryAccountId)?.id || elsewhere[0]?.id || '';
            return (
              <div key={a.id} className="col gap-2" style={{ borderTop: '1px solid var(--line)', paddingTop: 'var(--s2)' }}>
                <p className="small" style={{ margin: 0 }}>
                  <Open subject={at('account', a.id)}><strong>{a.name}</strong></Open> at {a.institution}, {balanceText(sim, a, a.balance, undefined, { cents: false })}
                  {a.id === person.primaryAccountId ? '. Primary.' : '.'}
                  {a.awaitingFunds !== undefined ? ` Waiting for ${a.awaitingFunds > 1 ? `its opening deposit of ${money(a.awaitingFunds)}` : 'its first deposit'}${a.fundBy ? `, by ${formatDate(a.fundBy, sim.zone)}` : ''}.` : ''}
                  {a.plastic?.stopped === 'new' && a.plastic.replacementAt ? ` Its debit card arrives ${formatDate(a.plastic.replacementAt, sim.zone)}.` : ''}
                  {a.closingAt !== undefined ? ` Closing ${formatDate(a.closingAt, sim.zone)}, once its pending items post.` : ''}
                </p>
                {links.length > 0 && <p className="xs dim" style={{ margin: 0 }}>{links.join('. ')}.</p>}
                <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
                  {a.id !== person.primaryAccountId && a.closingAt === undefined && (
                    <Gated feature="bank.set_primary" className="btn btn-sm" onClick={() => { const r = run<{ unchanged: string[] }>('bank.set_primary', { accountId: a.id }); if (r.ok) toast(`${a.name} is primary. ${r.value?.unchanged.length ? 'What was set up elsewhere stays there.' : ''}`, 'positive'); }}>
                      Make Primary
                    </Gated>
                  )}
                  {deposits?.id !== a.id && pay.depositChange?.to !== a.id && a.closingAt === undefined && (
                    <Gated feature="bank.redirect_deposits" className="btn btn-sm btn-ghost" onClick={() => { const r = run<{ at: number }>('bank.redirect_deposits', { accountId: a.id }); if (r.ok && r.value) toast(`Wages and other payments go to ${a.name} from ${formatDate(r.value.at, sim.zone)}.`, 'positive'); }}>
                      Have Wages Paid Here
                    </Gated>
                  )}
                  {a.id !== person.primaryAccountId && a.closingAt === undefined && (
                    <>
                      {a.balance > 0 && elsewhere.length > 0 && (
                        <div className="field"><label htmlFor={`close-into-${a.id}`}>What It Holds Goes To</label>
                          <select id={`close-into-${a.id}`} value={into} onChange={(e) => setRemainder({ ...remainder, [a.id]: e.target.value })}>
                            {elsewhere.map((b) => <option key={b.id} value={b.id}>{label(b.id)}</option>)}
                          </select>
                        </div>
                      )}
                      <Gated feature="bank.close_current" className="btn btn-sm btn-ghost" title={closing} disabled={!!closing}
                        onClick={() => { const r = run<{ closedAt: number; arrivesAt?: number }>('bank.close_current', { accountId: a.id, remainderTo: into }); if (r.ok && r.value) toast(r.value.closedAt > sim.now ? `It closes ${formatDate(r.value.closedAt, sim.zone)}.` : `Closed.${r.value.arrivesAt ? ` What it held arrives ${formatDate(r.value.arrivesAt, sim.zone)}.` : ''}`, 'positive'); }}>
                        Close It
                      </Gated>
                    </>
                  )}
                </div>
                {closing && a.id !== person.primaryAccountId && <p className="xs dim" style={{ margin: 0 }}>To close it: {closing}</p>}
              </div>
            );
          })}
          <div className="row-between gap-2" style={{ alignItems: 'start' }}>
            <p className="xs dim" style={{ margin: 0 }}>
              The primary account is where {PRIMARY_DOES.map((w) => w.charAt(0).toLowerCase() + w.slice(1)).join('; ')}. Making another primary moves nothing already set up.
            </p>
            <HowItWorks help="bank.set_primary" />
          </div>
          <div className="row-between gap-2" style={{ alignItems: 'start' }}>
            <p className="xs dim" style={{ margin: 0 }}>
              Wages and other payments go to {name(deposits?.id)}{pay.depositChange ? `, and to ${name(pay.depositChange.to)} from ${formatDate(pay.depositChange.at, sim.zone)}` : ''}: a change reaches Yale’s payroll in {PAYER_LEAD['yale-payroll']} days, about one of its weekly pay cycles, as Yale says, and other payers in {DEPOSIT_LEAD.days}, SLATE’s estimate (employers say one to two pay cycles).
            </p>
            <HowItWorks help="bank.redirect_deposits" />
          </div>
        </div>
      </Panel>

      {(pay.standingOrders.length > 0 || cards.length > 0) && currents.length > 1 && (
        <Panel title="What Pays From Where" subtitle="Each set up on its own account, until you move it." help="bank.payments">
          <div className="col gap-2">
            {pay.standingOrders.map((o) => (
              <div key={o.id} className="field">
                <label htmlFor={`order-from-${o.id}`}>Standing Order, {money(o.amount)} On The {o.day}, Into {name(o.toId)}</label>
                <div className="field-act" style={{ flexWrap: 'wrap' }}>
                  <select id={`order-from-${o.id}`} value={sources[o.id] ?? orderSource(sim, person, o)?.id ?? ''} onChange={(e) => setSources({ ...sources, [o.id]: e.target.value })}>
                    {currents.filter((a) => a.id !== o.toId).map((a) => <option key={a.id} value={a.id}>{label(a.id)}</option>)}
                  </select>
                  <Gated feature="bank.set_order_source" className="btn btn-sm btn-ghost" disabled={!sources[o.id] || sources[o.id] === orderSource(sim, person, o)?.id}
                    onClick={() => { if (run('bank.set_order_source', { orderId: o.id, accountId: sources[o.id] }).ok) toast('It pays from there from its next date.', 'positive'); }}>
                    Pay From There
                  </Gated>
                </div>
              </div>
            ))}
            {cards.map((c) => (
              <div key={c.id} className="field">
                <label htmlFor={`autopay-from-${c.id}`}>{c.name} Autopay Pays From</label>
                <div className="field-act" style={{ flexWrap: 'wrap' }}>
                  <select id={`autopay-from-${c.id}`} value={sources[c.id] ?? autopaySource(sim, person, c)?.id ?? ''} onChange={(e) => setSources({ ...sources, [c.id]: e.target.value })}>
                    {currents.map((a) => <option key={a.id} value={a.id}>{label(a.id)}</option>)}
                  </select>
                  <Gated feature="card.set_autopay_from" className="btn btn-sm btn-ghost" disabled={!sources[c.id] || sources[c.id] === autopaySource(sim, person, c)?.id}
                    onClick={() => { if (run('card.set_autopay_from', { cardId: c.id, accountId: sources[c.id] }).ok) toast('Autopay pays from there from its next due date.', 'positive'); }}>
                    Pay From There
                  </Gated>
                  <HowItWorks help="card.set_autopay_from" />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {transfers.length > 0 && (
        <Panel title="On Its Way" subtitle="Between your banks: out of one, not yet in the other.">
          <ul className="small" style={{ margin: 0 }}>
            {transfers.map((t) => <li key={t.id}>{money(t.amount)} from {name(t.fromId)} to {t.toId ? name(t.toId) : bankById(t.toBankId)?.name ?? 'another bank'}, arriving {formatDate(t.at, sim.zone)}.</li>)}
          </ul>
        </Panel>
      )}

      <Panel title="Open An Account At Another Bank" subtitle={applications.length ? applications.map((a) => `${bankById(a.bankId)?.name} decides by ${formatDate(a.at, sim.zone)}`).join('; ') : undefined} help="bank.other-banks">
        {others.length === 0 ? <p className="small">You keep an account at every bank here SLATE knows.</p> : (
          <div className="col gap-3">
            <p className="small" style={{ margin: 0 }}>
              {service
                ? `The ${service.scheme} below moves everything for you in ${service.workingDays} working days. Or open a second account here and keep both.`
                : 'There’s no switching service here. To move banks: open the account, have your wages paid into it, move each standing order and autopay, move the money across, then close the old account. The new account starts with nothing, and its own history.'}
            </p>
            <div className="field-row">
              <div className="field"><label htmlFor="open-at">Bank</label>
                <select id="open-at" value={chosen?.id ?? ''} onChange={(e) => setTarget(e.target.value)}>
                  {others.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              {minimum > 0 && (
                <>
                  <div className="field"><label htmlFor="open-from">Opening Deposit From</label>
                    <select id="open-from" value={fundFrom} onChange={(e) => setFundFrom(e.target.value)}>
                      {everyday.filter((a) => a.bankId !== chosen?.id).map((a) => <option key={a.id} value={a.id}>{label(a.id)}</option>)}
                    </select>
                  </div>
                  <div className="field"><label htmlFor="open-amount">Amount ({cur})</label>
                    <input id="open-amount" type="text" inputMode="decimal" placeholder={String(minimum / 100)} value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
                  </div>
                </>
              )}
              <Gated feature="bank.open_current" className="btn btn-sm" disabled={!chosen || !!refusal} title={refusal} onClick={open}>
                Apply
              </Gated>
            </div>
            {refusal && <p className="small muted" style={{ margin: 0 }}>{refusal}</p>}
            <p className="small" style={{ margin: 0 }}>{whatItTakes()}</p>
            <Fine>Source: {rules?.source ?? 'nothing published was found for this bank; what SLATE assumes says so'}{scheme && !rules?.sendDays && rules?.sameDayBefore === undefined ? `; ${scheme.source}` : ''}.</Fine>
          </div>
        )}
      </Panel>
    </div>
  );
}
