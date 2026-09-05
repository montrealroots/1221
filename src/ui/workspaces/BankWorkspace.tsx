import { titleCaseLabel } from '@/engine/core/text';
import { useState } from 'react';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Stat, Meter, MoneyText, Empty, Tabs, Modal } from '@/ui/components/primitives';
import { creditBand, netWorth, offeredApr, amortisedPayment } from '@/engine/systems/finance';
import { isLiability } from '@/engine/core/ledger';
import { formatMoney, formatMoneyCompact } from '@/engine/core/money';
import { formatDate, MS_DAY } from '@/engine/core/time';
import { computeAnnualTax } from '@/engine/content/tax';
import { estimateAnnualIncome } from '@/engine/systems/finance';

type Tab = 'accounts' | 'bills' | 'transactions' | 'credit' | 'tax';

export function BankWorkspace() {
  const { sim, run } = useGame();
  const [tab, setTab] = useState<Tab>('accounts');
  const [transferOpen, setTransferOpen] = useState(false);
  const [loanOpen, setLoanOpen] = useState(false);

  const accounts = useWorld((s) => s.ledger.accountsOf(s.player.id));
  const worth = useWorld((s) => netWorth(s, s.player.id));
  const bills = useWorld((s) => Object.values(s.universe.bills).filter((b) => b.payerId === s.player.id && b.active).sort((a, b) => a.nextDueAt - b.nextDueAt));
  const profile = useWorld((s) => s.universe.creditProfiles[s.player.id]);
  const transactions = useWorld((s) => s.universe.transactions.slice(-120).reverse());
  const ownedIds = new Set(accounts.map((a) => a.id));

  const overdue = bills.filter((b) => b.nextDueAt < sim.now || b.missedCount > 0);

  return (
    <>
      <div className="page-head">
        <div className="eyebrow">Bank</div>
        <h1>{formatMoneyCompact(worth.total)}</h1>
        <p className="muted">
          Net worth across cash, property, vehicles and possessions, less what you owe.
          Every balance below is the sum of its transactions.
        </p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 'var(--s5)' }}>
        <Stat label="Cash" value={<MoneyText amount={worth.cash} compact />} />
        <Stat label="Assets" value={<MoneyText amount={worth.assets} compact />} />
        <Stat label="Owed" value={<span className="mono negative">{formatMoneyCompact(worth.liabilities)}</span>} />
        <Stat
          label="Credit Score"
          value={<span className="mono">{profile?.score ?? '—'}</span>}
          note={profile ? creditBand(profile.score) : undefined}
        />
      </div>

      {overdue.length > 0 && (
        <div className="callout callout-negative" style={{ marginBottom: 'var(--s5)' }}>
          <strong>{overdue.length} bill{overdue.length === 1 ? '' : 's'} need attention.</strong>{' '}
          Missed payments damage your credit and, after three, go to collections.
        </div>
      )}

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'accounts', label: 'Accounts', badge: accounts.length },
          { id: 'bills', label: 'Bills', badge: overdue.length },
          { id: 'transactions', label: 'Transactions' },
          { id: 'credit', label: 'Credit' },
          { id: 'tax', label: 'Tax' },
        ]}
      />

      {tab === 'accounts' && (
        <Panel
          title="Accounts"
          flush
          actions={
            <>
              <button className="btn btn-sm" onClick={() => setTransferOpen(true)}>Transfer</button>
              <button className="btn btn-sm" onClick={() => setLoanOpen(true)}>Borrow</button>
              <button
                className="btn btn-sm"
                onClick={() => run('finance.open_account', { ownerId: sim.player.id, kind: 'savings', name: 'Savings' })}
              >
                Open Savings
              </button>
              <button
                className="btn btn-sm"
                onClick={() => run('finance.open_account', { ownerId: sim.player.id, kind: 'credit_card', name: 'Credit card', creditLimit: 500_000 })}
              >
                Apply For A Card
              </button>
            </>
          }
        >
          <div className="list">
            {accounts.map((account) => {
              const liability = isLiability(account.kind);
              const available = sim.ledger.availableFunds(account.id);
              return (
                <div key={account.id} className="list-item list-static">
                  <div className="grow">
                    <div className="small strong">{account.name}</div>
                    <div className="xs dim">
                      {account.institution ?? 'Bank'}
                      {account.last4 && ` ····${account.last4}`}
                      {account.apr !== undefined && ` · ${(account.apr * 100).toFixed(2)}% APR`}
                      {account.termMonthsRemaining !== undefined && ` · ${account.termMonthsRemaining} payments left`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono strong">
                      {liability
                        ? <span className="negative">{formatMoney(Math.max(0, -account.balance))}</span>
                        : <MoneyText amount={account.balance} />}
                    </div>
                    {account.creditLimit ? (
                      <div className="xs dim">{formatMoney(available)} available</div>
                    ) : null}
                    {liability && account.monthlyPayment ? (
                      <div className="xs dim">{formatMoney(account.monthlyPayment)}/mo</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {tab === 'bills' && (
        <Panel title="Bills" subtitle="Autopay runs against your primary account. If it cannot cover one, you hear about it." flush>
          {bills.length === 0 ? (
            <Empty title="No Bills" body="Nothing recurring is set up against you yet." />
          ) : (
            <div className="list">
              {bills.map((bill) => {
                const late = bill.nextDueAt < sim.now || bill.missedCount > 0;
                return (
                  <div key={bill.id} className="list-item list-static">
                    <div className="grow">
                      <div className="small strong">{bill.name}</div>
                      <div className="xs dim">
                        {titleCaseLabel(bill.category)} · {bill.frequency} · due {formatDate(bill.nextDueAt, sim.homeZone)}
                        {bill.missedCount > 0 && (
                          <span className="negative"> · missed {bill.missedCount}×</span>
                        )}
                      </div>
                    </div>
                    <span className="mono">{formatMoney(bill.amount)}</span>
                    {late && (
                      <button className="btn btn-sm btn-primary" onClick={() => run('finance.pay_bill', { billId: bill.id })}>
                        Pay Now
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {tab === 'transactions' && (
        <Panel title="Transactions" subtitle="Newest first. Every entry names what caused it." flush>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Memo</th><th>Category</th><th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => {
                  const delta = txn.postings.reduce((s, p) => (ownedIds.has(p.accountId) ? s + p.amount : s), 0);
                  if (delta === 0) return null;
                  return (
                    <tr key={txn.id}>
                      <td className="xs dim nowrap">{formatDate(txn.at, sim.homeZone)}</td>
                      <td className="small">{txn.memo}</td>
                      <td className="xs dim">{titleCaseLabel(txn.category)}</td>
                      <td className="num"><MoneyText amount={delta} signed /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'credit' && profile && (
        <div className="grid grid-2">
          <Panel title="Credit Score" subtitle={`${profile.score} — ${creditBand(profile.score)}`}>
            <div className="col gap-4">
              <Meter label="Score" value={profile.score - 300} max={550} hint={`${profile.score} on a 300 to 850 scale`} />
              <Meter label="Utilisation" value={profile.utilisation * 100} invert hint="How much of your available credit is in use. Under 30% is healthy." />
              <div className="grid grid-2">
                <Stat label="On-time Payments" value={profile.onTimePayments} />
                <Stat label="Late Payments" value={profile.latePayments} tone={profile.latePayments > 0 ? 'negative' : undefined} />
                <Stat label="Accounts Open" value={profile.accountsOpen} />
                <Stat label="Recent Inquiries" value={profile.hardInquiries.filter((i) => sim.now - i.at < 365 * MS_DAY).length} />
              </div>
            </div>
          </Panel>

          <Panel title="What You Would Be Offered" subtitle="Rates move with your score, which moves with your behaviour.">
            <div className="table-scroll">
              <table>
                <thead><tr><th>Product</th><th className="num">APR</th><th className="num">Payment On 100K</th></tr></thead>
                <tbody>
                  {(['mortgage', 'auto', 'personal', 'card'] as const).map((product) => {
                    const apr = offeredApr(profile.score, product);
                    const months = product === 'mortgage' ? 360 : product === 'auto' ? 60 : 48;
                    return (
                      <tr key={product}>
                        <td className="small" style={{ textTransform: 'capitalize' }}>{product}</td>
                        <td className="num mono">{(apr * 100).toFixed(2)}%</td>
                        <td className="num mono">
                          {product === 'card' ? '—' : formatMoney(amortisedPayment(10_000_000, apr, months))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {profile.derogatory.length > 0 && (
              <div className="callout callout-negative" style={{ marginTop: 'var(--s4)' }}>
                <strong>On your record</strong>
                <ul className="small" style={{ margin: 'var(--s2) 0 0', paddingLeft: 'var(--s4)' }}>
                  {profile.derogatory.map((entry, i) => (
                    <li key={i}>{entry.note} — {formatDate(entry.at, sim.homeZone)}</li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === 'tax' && <TaxPanel />}

      {transferOpen && <TransferDialog onClose={() => setTransferOpen(false)} />}
      {loanOpen && <LoanDialog onClose={() => setLoanOpen(false)} />}
    </>
  );
}

function TaxPanel() {
  const income = useWorld((s) => estimateAnnualIncome(s, s.player));
  const computation = useWorld((s) => computeAnnualTax(income, s.player.currentLocationId, s.now));
  const years = useWorld((s) => Object.values(s.universe.taxYears).filter((t) => t.personId === s.player.id).sort((a, b) => b.year - a.year));

  return (
    <div className="grid grid-2">
      <Panel title="This Year, As It Stands" subtitle={`Based on where you live and what you have earned.`}>
        <div className="grid grid-2" style={{ marginBottom: 'var(--s4)' }}>
          <Stat label="Estimated Gross" value={<span className="mono">{formatMoneyCompact(income)}</span>} />
          <Stat label="Effective Rate" value={`${(computation.effectiveRate * 100).toFixed(1)}%`} />
          <Stat label="Total Tax" value={<span className="mono negative">{formatMoneyCompact(computation.total)}</span>} />
          <Stat label="Take Home" value={<span className="mono positive">{formatMoneyCompact(computation.net)}</span>} />
        </div>
        <div className="col gap-2">
          {computation.lines.map((line) => (
            <div key={line.label}>
              <div className="row-between">
                <span className="small">{line.label}</span>
                <span className="mono small">{formatMoney(line.amount)}</span>
              </div>
              <div className="xs dim">{line.note}</div>
            </div>
          ))}
        </div>
        <p className="xs dim" style={{ marginTop: 'var(--s4)' }}>
          These rates are calibrated approximations of how real tax systems are structured. They are not filing advice.
        </p>
      </Panel>

      <Panel title="Filed Years" flush>
        {years.length === 0 ? (
          <Empty title="Nothing Filed Yet" body="Your first return is reconciled in April of the year after you start earning." />
        ) : (
          <div className="list">
            {years.map((year) => (
              <div key={year.id} className="list-item list-static">
                <div className="grow">
                  <div className="small strong">{year.year}</div>
                  <div className="xs dim">
                    {formatMoney(year.grossIncome)} gross · {formatMoney(year.withheld)} withheld
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono small">
                    {year.balance >= 0
                      ? <span className="positive">{formatMoney(year.balance)} refund</span>
                      : <span className="negative">{formatMoney(-year.balance)} owed</span>}
                  </div>
                  <div className="xs dim">{year.settledAt ? 'Settled' : 'Open'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function TransferDialog({ onClose }: { onClose: () => void }) {
  const { sim, run } = useGame();
  const accounts = sim.ledger.accountsOf(sim.player.id);
  const [from, setFrom] = useState(accounts[0]?.id ?? '');
  const [to, setTo] = useState(accounts[1]?.id ?? '');
  const [amount, setAmount] = useState(100);

  const submit = () => {
    const result = run('finance.transfer', { fromAccountId: from, toAccountId: to, amount: Math.round(amount * 100) });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title="Transfer"
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Transfer</button></>}
    >
      <div className="field">
        <label htmlFor="from">From</label>
        <select id="from" value={from} onChange={(e) => setFrom(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name} — {formatMoney(sim.ledger.availableFunds(a.id))} available</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="to">To</label>
        <select id="to" value={to} onChange={(e) => setTo(e.target.value)}>
          {accounts.filter((a) => a.id !== from).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="amount">Amount</label>
        <input id="amount" type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      </div>
    </Modal>
  );
}

function LoanDialog({ onClose }: { onClose: () => void }) {
  const { sim, run } = useGame();
  const [product, setProduct] = useState<'personal' | 'auto'>('personal');
  const [principal, setPrincipal] = useState(10_000);
  const [months, setMonths] = useState(48);
  const score = sim.universe.creditProfiles[sim.player.id]?.score ?? 600;
  const apr = offeredApr(score, product);
  const payment = amortisedPayment(principal * 100, apr, months);

  const submit = () => {
    const result = run('finance.take_loan', {
      borrowerId: sim.player.id,
      principal: principal * 100,
      months, product,
      depositAccountId: sim.player.primaryAccountId,
    });
    if (result.ok) onClose();
  };

  return (
    <Modal
      title="Borrow"
      onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={submit}>Take The Loan</button></>}
    >
      <p className="muted small">
        Your score of {score} decides the rate. A loan creates a real monthly bill that will be paid whether you remember it or not.
      </p>
      <div className="field">
        <label htmlFor="product">Product</label>
        <select id="product" value={product} onChange={(e) => setProduct(e.target.value as 'personal' | 'auto')}>
          <option value="personal">Personal Loan</option>
          <option value="auto">Auto Loan</option>
        </select>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="principal">Amount</label>
          <input id="principal" type="number" min={1000} step={500} value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="months">Term (Months)</label>
          <input id="months" type="number" min={12} max={84} step={12} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-3">
        <Stat label="APR" value={`${(apr * 100).toFixed(2)}%`} />
        <Stat label="Monthly" value={<span className="mono">{formatMoney(payment)}</span>} />
        <Stat label="Total Repaid" value={<span className="mono">{formatMoney(payment * months)}</span>} />
      </div>
    </Modal>
  );
}
