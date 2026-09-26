/**
 * SLATE — statements, the year, and alerts, on the bank's screen.
 *
 * Every account the character has held, open or closed, and each statement
 * period it had: what it opened and closed at, every entry with the balance
 * after it, and for the card what the statement asked and what paying only
 * the minimum would take. The year's interest, the tax the bank took and
 * every fee. And the alerts the bank sends (`systems/statements.ts`).
 */

import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate, zonedParts } from '@/engine/core/time';
import type { Account } from '@/engine/core/ledger';
import { dueAt } from '@/engine/systems/credit';
import {
  accountStatement, alertsOf, cardStatement, periodsOf, yearSummary, type StatementLine,
} from '@/engine/systems/statements';

const KINDS = new Set(['checking', 'savings', 'credit_card', 'loan']);

export function BankStatements() {
  const { sim } = useGame();
  const accounts = useWorld((s) => Object.values(s.universe.accounts)
    .filter((a) => a.ownerId === s.player.id && !a.nominal && KINDS.has(a.kind))
    // Open ones first, the current account first among them.
    .sort((a, b) => Number(Boolean(a.closedAt)) - Number(Boolean(b.closedAt)) || (a.id === s.player.primaryAccountId ? -1 : b.id === s.player.primaryAccountId ? 1 : 0)));
  const [accountId, setAccountId] = useState('');
  const account = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const periods = account ? periodsOf(sim, account) : [];
  const [periodIndex, setPeriodIndex] = useState(0);
  const period = periods[Math.min(periodIndex, periods.length - 1)];
  if (!account || !period) return null;

  return (
    <>
      <Panel title="Statements" subtitle="Every entry on each account, with the balance after it.">
        <div className="field-row">
          <div className="field">
            <label htmlFor="statement-account">Account</label>
            <select id="statement-account" value={account.id} onChange={(e) => { setAccountId(e.target.value); setPeriodIndex(0); }}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}{a.last4 ? ` ···${a.last4}` : ''}{a.institution ? `, ${a.institution}` : ''}{a.closedAt ? ' (Closed)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="statement-period">Period</label>
            <select id="statement-period" value={periodIndex} onChange={(e) => setPeriodIndex(Number(e.target.value))}>
              {periods.map((p, i) => <option key={p.from} value={i}>{p.label}</option>)}
            </select>
          </div>
        </div>
        {account.kind === 'credit_card' ? <CardStatementView account={account} period={period} /> : <AccountStatementView account={account} period={period} />}
      </Panel>
      <YearView />
      <AlertsView />
    </>
  );
}

function AccountStatementView({ account, period }: { account: Account; period: ReturnType<typeof periodsOf>[number] }) {
  const { sim } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const st = accountStatement(sim, account, period);
  const owed = account.kind === 'loan';
  return (
    <div className="col gap-3">
      <div className="grid grid-3">
        <Figure label={owed ? 'Owed At The Start' : 'Opening Balance'} value={money(st.opening)} />
        <Figure label={owed ? 'Paid Off' : 'Money In'} value={money(owed ? st.moneyOut : st.moneyIn)} />
        <Figure label={owed ? 'Added' : 'Money Out'} value={money(owed ? st.moneyIn : st.moneyOut)} />
        {!owed && <Figure label="Interest, After Tax" value={money(st.interest)} />}
        {!owed && <Figure label="Fees" value={money(st.fees)} />}
        <Figure label={owed ? 'Owed At The End' : period.to > sim.now ? 'Balance Now' : 'Closing Balance'} value={money(st.closing)} />
      </div>
      <Lines lines={st.lines} sign={1} empty="The account stood still in this period." card={owed} />
    </div>
  );
}

function CardStatementView({ account, period }: { account: Account; period: ReturnType<typeof periodsOf>[number] }) {
  const { sim } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  const st = cardStatement(sim, account, period);
  const closed = period.to <= sim.now;
  const due = closed ? dueAt(sim.zone, period.to, st.terms.graceDays) : undefined;
  return (
    <div className="col gap-3">
      <div className="grid grid-3">
        <Figure label="Brought Forward" value={money(st.previous)} />
        <Figure label="Payments And Credits" value={money(st.payments)} />
        <Figure label="Spending" value={money(st.spending)} />
        <Figure label="Fees" value={money(st.fees)} />
        <Figure label="Interest" value={money(st.interest)} />
        <Figure label={closed ? 'New Balance' : 'Balance Now'} value={money(st.newBalance)} />
      </div>
      {closed && st.newBalance > 0 && st.minimum !== undefined && (
        <p className="small" style={{ margin: 0 }}>
          {st.terms.kind === 'charge'
            ? `${st.terms.issuer ?? 'The bank'} takes the whole ${money(st.newBalance)} from your current account${due ? ` on ${formatDate(due, sim.zone)}` : ''}.`
            : `The least to pay is ${money(st.minimum)}${due ? `, by ${formatDate(due, sim.zone)}` : ''}. Pay the whole ${money(st.newBalance)} and none of it draws interest.`}
        </p>
      )}
      {closed && st.minimumOnly && st.terms.kind !== 'charge' && (
        <div className="callout small">
          {st.minimumOnly === 'never'
            ? 'Paying only the minimum, and spending nothing more, would never pay this off: the minimum doesn’t cover the interest.'
            : `Paying only the minimum, and spending nothing more, takes ${yearsAndMonths(st.minimumOnly.months)} and ${money(st.minimumOnly.total)} in all. ${money(st.minimumOnly.threeYears)} a month pays it off in three years, ${money(st.minimumOnly.threeYearsTotal)} in all.`}
        </div>
      )}
      {st.nextInterest !== undefined && (
        <p className="xs dim" style={{ margin: 0 }}>If none of it is paid, next month’s interest will be about {money(st.nextInterest)}.</p>
      )}
      <Lines lines={st.lines} sign={1} empty="The card went unused and unpaid in this period." card />
    </div>
  );
}

function YearView() {
  const { sim } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(c, cur);
  // From the first entry in the books, the life's first morning.
  const first = zonedParts(sim.universe.transactions[0]?.at ?? sim.now, sim.zone).year;
  const last = zonedParts(sim.now, sim.zone).year;
  const years = Array.from({ length: last - first + 1 }, (_, i) => last - i);
  const [year, setYear] = useState(last);
  const y = yearSummary(sim, sim.player.id, year);
  return (
    <Panel title="The Year" subtitle="Interest, the tax taken off it, and every fee, as the bank reports them.">
      <div className="field" style={{ maxWidth: 240 }}>
        <label htmlFor="statement-year">Year</label>
        <select id="statement-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((one) => <option key={one} value={one}>{one}{one === last ? ', So Far' : ''}</option>)}
        </select>
      </div>
      <div className="grid grid-3" style={{ marginTop: 'var(--s3)' }}>
        <Figure label="Interest Earned" value={money(y.interestEarned)} note="Before tax" />
        <Figure label="Tax Taken Off It" value={money(y.taxTaken)} />
        <Figure label="Bank Fees" value={money(y.bankFees)} />
        <Figure label="Card Fees" value={money(y.cardFees)} />
        <Figure label="Card Interest Paid" value={money(y.cardInterest)} />
      </div>
      {y.byFee.length > 0 && (
        <div className="col gap-1" style={{ marginTop: 'var(--s3)' }}>
          {y.byFee.map((one) => (
            <div key={one.memo} className="row-between small"><span>{one.memo}</span><span className="mono">{money(one.amount)}</span></div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function AlertsView() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const alerts = useWorld((s) => alertsOf(s.player));
  const [low, setLow] = useState(alerts.lowBalance !== undefined ? String(alerts.lowBalance / 100) : '');
  const [large, setLarge] = useState(alerts.largePayment !== undefined ? String(alerts.largePayment / 100) : '');
  const cents = (v: string) => (v.trim() === '' ? null : Math.round(Number(v.replace(/[^\d.]/g, '')) * 100));
  const save = () => {
    const answer = run('bank.set_alerts', { lowBalance: cents(low), largePayment: cents(large) });
    if (answer.ok) toast('Alerts saved.', 'positive');
  };
  return (
    <Panel title="Alerts" subtitle="What the bank tells you, in What Needs You.">
      <div className="field-row">
        <div className="field">
          <label htmlFor="alert-low">Current Account Under ({cur})</label>
          <input id="alert-low" type="text" inputMode="decimal" placeholder="Off" value={low} onChange={(e) => setLow(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="alert-large">A Payment Over ({cur})</label>
          <input id="alert-large" type="text" inputMode="decimal" placeholder="Off" value={large} onChange={(e) => setLarge(e.target.value)} />
        </div>
      </div>
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        <Gated feature="bank.set_alerts" className="btn btn-sm btn-primary" onClick={save}>Save Alerts</Gated>
        <Gated feature="bank.set_alerts" className="btn btn-sm btn-ghost" onClick={() => run('bank.set_alerts', { statements: !alerts.statements })}>
          Statement Ready: {alerts.statements ? 'On' : 'Off'}
        </Gated>
      </div>
    </Panel>
  );
}

/** A figure, labeled. */
function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value mono" style={{ fontSize: 'var(--size-md)' }}>{value}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  );
}

/** The entries, newest first as a banking app shows them, each with the balance after it. */
function Lines({ lines, sign, empty, card }: { lines: StatementLine[]; sign: 1 | -1; empty: string; card?: boolean }) {
  const { sim } = useGame();
  const cur = saveCurrency(sim.universe);
  if (lines.length === 0) return <p className="small muted" style={{ margin: 0 }}>{empty}</p>;
  return (
    <div className="statement-lines">
      <div className="row-between xs dim" style={{ padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
        <span style={{ flex: '0 0 110px' }}>Date</span>
        <span style={{ flex: 1 }}>What</span>
        <span style={{ flex: '0 0 130px', textAlign: 'right' }}>{card ? 'Charged / Paid' : 'In / Out'}</span>
        <span style={{ flex: '0 0 130px', textAlign: 'right' }}>{card ? 'Owed After' : 'Balance'}</span>
      </div>
      {[...lines].reverse().map((line) => {
        const shown = line.amount * sign;
        const credit = card ? shown < 0 : shown > 0;
        return (
          <div key={line.id} className="row-between small" style={{ padding: '4px 0', borderBottom: '1px solid var(--line-soft, var(--line))' }}>
            <span className="dim" style={{ flex: '0 0 110px' }}>{formatDate(line.at, sim.zone)}</span>
            <span style={{ flex: 1 }}>{line.memo}</span>
            <span className={`mono ${credit ? 'positive' : ''}`} style={{ flex: '0 0 130px', textAlign: 'right' }}>
              {credit ? '+' : '−'}{formatMoney(Math.abs(shown), cur)}
            </span>
            <span className="mono dim" style={{ flex: '0 0 130px', textAlign: 'right' }}>{formatMoney(line.balance * sign, cur)}</span>
          </div>
        );
      })}
    </div>
  );
}

function yearsAndMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const years = y === 0 ? '' : y === 1 ? 'a year' : `${y} years`;
  const rest = m === 0 ? '' : m === 1 ? 'a month' : `${m} months`;
  return [years, rest].filter(Boolean).join(' and ') || 'under a month';
}
