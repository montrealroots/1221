/**
 * SLATE — your bank.
 *
 * The bank a person keeps their money with, as that bank has it: its name,
 * the accounts by the names it sells them under, each account's number the
 * way the country writes it, what savings pays and what the current account
 * costs and how the fee is waived, in five tabs: accounts, cards, payments
 * and cash, borrowing, and statements. The deposit guarantee behind the
 * money was said here until 2026-09-26, and nothing read it. Money moves between the accounts here, and a
 * savings account is opened or closed (`systems/banking.ts`). The credit
 * card is the bank's too, and is run here (`ui/bank/BankCard.tsx`); until
 * 2026-09-26 it was run from the Money panel and this screen left it out.
 *
 * Every figure the bank publishes says where it came from; a figure that is
 * SLATE's estimate says that instead.
 */

import { useState } from 'react';
import { SECTIONS, tabKey } from '@/ui/shell/sections';
import { useKept } from '@/ui/kept';
import { useGame, useWorld } from '@/app/game-context';
import { Panel, Empty, Fine } from '@/ui/components/primitives';
import { Gated } from '@/ui/guide/Guide';
import { BankLending } from '@/ui/bank/BankLending';
import { BankMoves } from '@/ui/bank/BankMoves';
import { BankCard } from '@/ui/bank/BankCard';
import { BankCardOffers } from '@/ui/bank/BankCardOffers';
import { BankSecurity } from '@/ui/bank/BankSecurity';
import { BankStatements } from '@/ui/bank/BankStatements';
import { BankPayments } from '@/ui/bank/BankPayments';
import { BankCash } from '@/ui/bank/BankCash';
import { BankAccountLife } from '@/ui/bank/BankAccountLife';
import { apyOf } from '@/engine/systems/statements';
import { formatMoney, saveCurrency, centsFromTyped } from '@/engine/core/money';
import { dateKey, formatDate } from '@/engine/core/time';
import { bankById, bankingIn } from '@/engine/content/banks';
import type { Simulation } from '@/engine/core/simulation';
import type { Product } from '@/engine/content/banks';
import { bankAccountsOf, introStep, rateOn, bankOf, directDeposits, feeFor, inSaveMoney, interestTaxOn, interestTaxFor, interestAllowanceLeft, monthEndAfter, monthStartOf, productOf, closesQuarterly, savingsNotice, tierRate, earningBalance } from '@/engine/systems/banking';
import { savingsDebit } from '@/engine/systems/accountlife';
import { savingsLeftThisMonth } from '@/engine/systems/cash';
import { ACCOUNT_LIFE } from '@/engine/content/accountlife';
import { CHEX, checkingsOf } from '@/engine/systems/lending';
import type { Account } from '@/engine/core/ledger';
import { LookRegion, Open, at } from '@/ui/looks';

export function BankWorkspace() {
  const { sim, run, toast } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (cents: number) => formatMoney(cents, cur, { cents: false });
  const bank = useWorld((s) => bankOf(s, s.player));
  const accounts = useWorld((s) => bankAccountsOf(s, s.player));
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useKept<BankTab>(tabKey('/workspace/bank'), 'accounts');

  if (!bank) {
    return <Empty title="No Bank" body="Your money isn’t held at a bank SLATE knows, so there’s nothing to show here." />;
  }

  const here = accounts.filter((a) => a.bankId === bank.id);
  // The primary account (from 2026-10-10: until then the first current account found, which with two banks could be the
  // other one, named as where savings closes and where Move Money starts from).
  const current = accounts.find((a) => a.id === sim.player.primaryAccountId) ?? accounts.find((a) => a.kind === 'checking');
  const savings = accounts.find((a) => a.kind === 'savings');
  const fromId = from || current?.id || '';
  const toId = to || accounts.find((a) => a.id !== fromId)?.id || '';
  const monthStart = monthStartOf(sim, sim.now);
  const monthEnd = monthEndAfter(sim, sim.now);

  // What a move out of savings costs, and what Germany's month still lets out, before it's made.
  const moving = accounts.find((a) => a.id === fromId);
  const savingsTerms = moving?.kind === 'savings' ? savingsDebit(sim, moving) : undefined;
  const freeLeft = moving?.kind === 'savings' && ACCOUNT_LIFE[bank.id]?.freeWithdrawals !== undefined && ACCOUNT_LIFE[bank.id]?.withdrawalFee ? savingsTerms!.fee === 0 : undefined;
  const allowanceLeft = moving ? savingsLeftThisMonth(sim, moving) : undefined;

  const move = () => {
    // Typed in whole units of the money, as a banking app takes it.
    const cents = centsFromTyped(amount);
    const answer = run<{ moved: number; arrivesAt?: number }>('bank.transfer', { fromId, toId, amount: cents });
    if (answer.ok && answer.value) {
      const later = answer.value.arrivesAt !== undefined && answer.value.arrivesAt > sim.now;
      toast(later ? `Sent ${money(answer.value.moved)}: it arrives ${formatDate(answer.value.arrivesAt!, sim.zone)}.` : `Moved ${money(answer.value.moved)}.`, 'positive');
      setAmount('');
    }
  };

  const panes: Record<BankTab, JSX.Element> = {
    accounts: (
      <>
      <div className="grid grid-2" style={{ marginBottom: 'var(--s5)' }}>
        {accounts.map((account) => {
          const product = productOf(account);
          const fee = feeFor(sim, account, monthStart);
          const tax = interestTaxOn(sim, account);
          // As the bank counts them: until 2026-09-27 wages only, where the bank counts any electronic deposit.
          const paidIn = directDeposits(sim, account, monthStart, product?.deposits);
          return (
            <Panel key={account.id} title={account.name} subtitle={<Open subject={at('account', account.id)}>{account.institution} {account.number}</Open>} look={at('account', account.id)}>
              <div className="col gap-3">
                <div className="stat">
                  <Open subject={at('account', account.id)}>
                    <span className="stat-label">Balance</span>
                    <span className="stat-value mono">{money(account.balance)}</span>
                  </Open>
                </div>
                <p className="small" style={{ margin: 0 }}>{interestWords(sim, product, tax, money, bank.currency, account.openedAt, closesQuarterly(account), account)}</p>
                {account.secondChance ? (
                  <p className="small" style={{ margin: 0 }}>A second-chance account: {formatMoney(inSaveMoney(sim, CHEX.secondChanceFee, 'USD'), cur)} a month, SLATE’s estimate, in place of the ordinary fee, and no overdraft.</p>
                ) : product?.monthlyFee ? (
                  <p className="small" style={{ margin: 0 }}>
                    {formatMoney(inSaveMoney(sim, product.monthlyFee, bank.currency), cur)} a month
                    {waiverWords(product, (c) => money(inSaveMoney(sim, c, bank.currency)))}
                    {'. '}
                    {fee.fee === 0
                      ? `This month is waived so far${fee.waivedBy === 'deposits' ? `: ${money(paidIn)} paid in` : ''}.`
                      : fee.waivedBy
                        ? `This month’s is lowered to ${formatMoney(fee.fee, cur)} so far${fee.waivedBy === 'deposits' ? `, with ${money(paidIn)} paid in` : ''}, ${closesQuarterly(account) ? 'for the quarter’s closing' : `due ${formatDate(monthEnd, sim.zone)}`}.`
                        : closesQuarterly(account) ? 'This month’s goes to the quarter’s closing unless that changes.' : `This month’s is due ${formatDate(monthEnd, sim.zone)} unless that changes.`}
                    {closesQuarterly(account) && (account.feesDue ?? 0) > 0 ? ` The quarter’s fees so far, ${money(account.feesDue ?? 0)}, come off at its closing.` : ''}
                  </p>
                ) : (
                  <p className="small" style={{ margin: 0 }}>No monthly fee.</p>
                )}
                {product && <Fine>{product.estimate ? 'Estimate' : 'Source'}: {product.source}, {product.asOf}.{CONFIDENCE[bank.confidence ?? 'H']}</Fine>}
                {account.kind === 'savings' && (
                  <div className="row gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    {savingsNotice(sim, account)
                      ? <span className="xs dim">Notice is given: it closes <Open subject={at('day', dateKey(savingsNotice(sim, account)!.at, sim.homeZone))}>{formatDate(savingsNotice(sim, account)!.at, sim.zone)}</Open>, and what it holds moves to {current ? <Open subject={at('account', current.id)}>{current.name}</Open> : 'your current account'}.</span>
                      : <>
                        <Gated feature="bank.close_savings" className="btn btn-sm btn-ghost" onClick={() => { const a = run<{ on?: number }>('bank.close_savings', { accountId: account.id }); if (a.ok && a.value?.on) toast(`Notice given: it closes ${formatDate(a.value.on, sim.zone)}.`, 'positive'); }}>
                          Close It
                        </Gated>
                        <span className="xs dim">{closingWords(sim, account, money, current?.name ?? 'your current account')}</span>
                      </>}
                  </div>
                )}
              </div>
            </Panel>
          );
        })}
        {!savings && (
          <Panel title={bank.savings.name} subtitle="Not opened">
            <p className="small">
              {interestWords(sim, bank.savings, bankingIn(bank.iso)?.interestTax?.rate ?? 0, money, bank.currency, sim.now, bank.iso === 'DE')} {bank.savings.monthlyFee ? `It costs ${formatMoney(inSaveMoney(sim, bank.savings.monthlyFee, bank.currency), cur)} a month${waiverWords(bank.savings, (c) => money(inSaveMoney(sim, c, bank.currency)))}.` : 'Opening one costs nothing.'}
            </p>
            <Gated feature="bank.open_savings" className="btn btn-sm" onClick={() => run('bank.open_savings', {})}>
              Open A {bank.savings.name}
            </Gated>
          </Panel>
        )}
      </div>

      {accounts.length > 1 && (
        <Panel title="Move Money" subtitle="Between your own accounts: at once at one bank; to another bank, in the sending bank’s days.">
          <div className="field-row">
            <div className="field">
              <label htmlFor="move-from">From</label>
              <select id="move-from" value={fromId} onChange={(e) => setFrom(e.target.value)}>
                {/* By balance, the most in it last. */}
                {[...accounts].sort((a, b) => a.balance - b.balance).map((a) => <option key={a.id} value={a.id}>{a.name} ···{a.last4}, {a.institution} ({money(a.balance)})</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="move-to">To</label>
              <select id="move-to" value={toId} onChange={(e) => setTo(e.target.value)}>
                {accounts.filter((a) => a.id !== fromId).sort((a, b) => a.balance - b.balance).map((a) => <option key={a.id} value={a.id}>{a.name} ···{a.last4}, {a.institution}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="move-amount">Amount ({cur})</label>
              <input id="move-amount" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          {savingsTerms && (freeLeft !== undefined || allowanceLeft !== undefined) && (
            <p className="xs dim" style={{ margin: '0 0 var(--s2)' }}>
              {freeLeft === true ? 'This withdrawal is free; past the month’s free ones each costs the bank’s fee. ' : ''}
              {freeLeft === false ? `The month’s free withdrawals are used: this one costs ${formatMoney(savingsTerms.fee, cur)}, from savings beside it. ` : ''}
              {allowanceLeft !== undefined ? `${money(allowanceLeft)} more can come out this month without notice.` : ''}
            </p>
          )}
          <Gated feature="bank.transfer" className="btn btn-primary btn-sm" onClick={move} disabled={!amount}>
            Move It
          </Gated>
        </Panel>
      )}


        <BankMoves />
        <BankLending bank={bank} show={['term', 'switch']} />
        <div style={{ marginBottom: 'var(--s5)' }}>
          <BankAccountLife bankId={bank.id} />
        </div>
        <OtherCharges bank={bank} />
      </>
    ),
    cards: (
      <div className="col gap-5">
        <BankCard bankId={bank.id} />
        <BankCardOffers bankId={bank.id} />
        <BankSecurity bankId={bank.id} />
      </div>
    ),
    payments: (
      <div className="col gap-5">
        <BankPayments />
        <BankCash bankId={bank.id} />
      </div>
    ),
    borrowing: <BorrowingAt primaryBank={bank} />,
    statements: <BankStatements />,
  };

  return (
    <>
      <LookRegion className="page-head">
        <div className="eyebrow">Your Bank</div>
        <h1><Open subject={at('bank', bank.id)}>{bank.name}</Open></h1>
        {/* What's held here, now. Until 2026-09-26 this said what the deposit
            guarantee covers and the central bank's rate, which nothing in play
            reads: no bank fails, and no rate follows it. */}
        {/* The primary account's bank, and the others kept beside it (from 2026-10-10: until then every account was at one bank, and it said so). */}
        <p className="muted">
          <Open subject={at('bank', bank.id)}>{money(here.reduce((sum, a) => sum + a.balance, 0))}</Open> held here, in{' '}
          {here.length === 1 && here[0]
            ? <Open subject={at('account', here[0].id)}>one account</Open>
            : <Open subject={at('bank', bank.id)}>{here.length} accounts</Open>}
          {accounts.length > here.length ? `, and ${money(accounts.filter((a) => a.bankId !== bank.id).reduce((sum, a) => sum + a.balance, 0))} at your other banks` : ''}.
        </p>
      </LookRegion>

      <BankTabs tab={tab} onTab={setTab} />
      <div role="tabpanel" id={`bank-pane-${tab}`} aria-labelledby={`bank-tab-${tab}`} tabIndex={0} className="bank-pane">
        {panes[tab]}
      </div>
    </>
  );
}

type BankTab = 'accounts' | 'cards' | 'payments' | 'borrowing' | 'statements';

/**
 * Borrowing at any bank held (from 2026-10-10): the lender chosen first, then that bank's own overdraft, loan and term
 * terms, on the current account there. Until then only the primary account's bank lent.
 */
function BorrowingAt({ primaryBank }: { primaryBank: import('@/engine/content/banks').Bank }) {
  const currents = useWorld((s) => checkingsOf(s, s.player));
  const [lender, setLender] = useState(primaryBank.id);
  const account = currents.find((a) => a.bankId === lender) ?? currents[0];
  const bank = (account?.bankId ? bankById(account.bankId) : undefined) ?? primaryBank;
  return (
    <div className="col gap-3">
      {currents.length > 1 && (
        <div className="field" style={{ maxWidth: 360 }}>
          <label htmlFor="lender">Borrow At</label>
          <select id="lender" value={bank.id} onChange={(e) => setLender(e.target.value)}>
            {currents.map((a) => <option key={a.id} value={a.bankId}>{a.institution}</option>)}
          </select>
        </div>
      )}
      <BankLending bank={bank} account={account} show={['borrowing']} />
    </div>
  );
}

/** The screen's parts, each under its own tab. Until 2026-09-26 they ran down one page, fourteen to sixteen panels long. */
/** Its tabs, as the rail lists them too (`ui/shell/sections.ts`, from 2026-10-08). */
const BANK_TABS = SECTIONS['/workspace/bank'] as readonly { id: BankTab; label: string }[];

/** The tabs, as a tab list: arrows move between them, Home and End go to the ends. */
function BankTabs({ tab, onTab }: { tab: BankTab; onTab: (tab: BankTab) => void }) {
  const go = (index: number) => {
    const next = BANK_TABS[(index + BANK_TABS.length) % BANK_TABS.length]!;
    onTab(next.id);
    document.getElementById(`bank-tab-${next.id}`)?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label="Your Bank">
      {BANK_TABS.map((one, i) => (
        <button
          key={one.id}
          id={`bank-tab-${one.id}`}
          type="button"
          role="tab"
          className="tab"
          aria-selected={one.id === tab}
          aria-controls={`bank-pane-${one.id}`}
          tabIndex={one.id === tab ? 0 : -1}
          onClick={() => onTab(one.id)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
            else if (e.key === 'Home') { e.preventDefault(); go(0); }
            else if (e.key === 'End') { e.preventDefault(); go(BANK_TABS.length - 1); }
          }}
        >
          {one.label}
        </button>
      ))}
    </div>
  );
}

/** How sure the research was of a bank outside the thirteen, where it wasn't sure. */
const CONFIDENCE: Record<'H' | 'M' | 'L', string> = {
  H: '',
  M: ' The research was only partly sure of this bank’s figures.',
  L: ' The research wasn’t sure of this bank’s figures.',
};

/** Percent, to as many places as the figure has. */
const pct = (rate: number) => `${Number((rate * 100).toFixed(3))}%`;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * What an account pays, said the way the bank's terms put it: the rate, any
 * change announced, a floor or a cap, a bonus and what earns it, when it is
 * paid, and what the bank takes off it for tax.
 */
function interestWords(sim: Simulation, product: Product | undefined, tax: number, money: (cents: number) => string, currency: string, openedAt: number, quarterly = false, account?: Account): string {
  const step = introStep(sim, product, openedAt, sim.now);
  // The tier the balance is in leads, as the engine pays it: until 2026-09-27 the headline was the base rate.
  const bankMoney = (x: number) => inSaveMoney(sim, x, currency);
  const tiered = account ? tierRate(product, account, earningBalance(product, account.balance, bankMoney), bankMoney) : undefined;
  const rate = tiered ?? step ?? rateOn(product, sim.now, sim.homeZone);
  // A rate the research didn't find isn't a rate of none: until 2026-09-26 Citi's savings said it paid no interest.
  if (product && product.rate === undefined && /no published rate/i.test(product.source) && !product.changes?.length && !product.tiers?.length && !product.bonus && !product.intro) return 'Its rate wasn’t found, so SLATE pays none on it.';
  if (!product || (rate <= 0 && !product.bonus && !product.intro)) return 'Pays no interest.';
  // The yield with the interest left in, credited monthly or in the bank's months (B31).
  const said: string[] = [`Pays ${pct(rate)} a year${tiered !== undefined ? ' on this balance' : ''} (${pct(Number(apyOf(rate, product.pays?.length ?? 12).toFixed(5)))} APY)`];
  if (step !== undefined) {
    // The steps still to come, and what it pays after them.
    let through = 0;
    const ahead: string[] = [];
    for (const one of product.intro ?? []) {
      through += one.months;
      ahead.push(`${pct(one.rate)} to month ${through}`);
    }
    said.push(` for now: ${ahead.join(', ')}, and ${pct(rateOn(product, sim.now, sim.homeZone))} after, counted from when it opened`);
  }
  // The bank's day, as the engine reads it: until 2026-09-27 a UTC one.
  const next = (product.changes ?? []).find((c) => c.from > dateKey(sim.now, sim.homeZone));
  if (next) { const [y, m, d] = next.from.split('-').map(Number); said.push(`, ${pct(next.rate)} from ${formatDate(Date.UTC(y!, m! - 1, d!, 12), 'UTC')}`); }
  for (const tier of product.tiers ?? []) said.push(`, ${pct(tier.rate)} on the whole balance from ${money(inSaveMoney(sim, tier.from, currency))}`);
  if (product.rateFrom !== undefined) said.push(`, on a balance of ${money(inSaveMoney(sim, product.rateFrom, currency))} or more`);
  if (product.rateUpTo !== undefined) said.push(`, on up to ${money(inSaveMoney(sim, product.rateUpTo, currency))}`);
  said.push('.');
  if (product.bonus) {
    const earn = product.bonus.when === 'no_withdrawals'
      ? 'a month with nothing taken out'
      : product.bonus.growBy !== undefined ? `a month the balance grows by ${money(inSaveMoney(sim, product.bonus.growBy, currency))}` : 'a month the balance grows';
    said.push(` Another ${pct(product.bonus.rate)} for ${earn}.`);
  }
  // As the engine pays it: in the bank’s months, at Germany’s quarterly closing, or each month’s end.
  said.push(product.pays
    ? ` It builds each day and is paid in ${product.pays.map((m) => MONTH_NAMES[m - 1]).join(' and ')}.`
    : quarterly
      ? ' It builds each day and is paid at the quarterly closing, the end of March, June, September and December.'
      : ' It builds each day and is paid on the last day of the month.');
  if (product.taxFree) said.push(' Tax-free.');
  else if (tax > 0) {
    // Past the year's allowance, where the country has one: until 2026-09-27 it read as tax on all of it.
    const iso = account?.bankId ? bankById(account.bankId)?.iso : undefined;
    const levy = iso ? bankingIn(iso)?.interestTax : undefined;
    const left = account ? interestAllowanceLeft(sim, account) : undefined;
    said.push(levy?.allowance !== undefined
      ? ` The bank takes ${pct(tax)} of what’s paid past the first ${money(inSaveMoney(sim, levy.allowance, currency))} of the year’s interest${left !== undefined ? `; ${money(left)} of that is left this year` : ''}.`
      : ` The bank takes ${pct(tax)} of it for tax.`);
    if (levy?.source) said.push(` Source: ${levy.source}.`);
  }
  return said.join('');
}

/** The bank's charges that aren't an account's monthly fee, and the tax the country gives back. */
function OtherCharges({ bank }: { bank: import('@/engine/content/banks').Bank }) {
  const { sim } = useGame();
  const cur = saveCurrency(sim.universe);
  const money = (c: number) => formatMoney(inSaveMoney(sim, c, bank.currency), cur);
  const refund = bankingIn(bank.iso)?.interestTax;
  const lines: string[] = [];
  if (bank.card) {
    lines.push(`The debit card costs ${bank.card.yearly !== undefined ? `${money(bank.card.yearly)} a year` : 'nothing a year'}${bank.card.perPurchase !== undefined ? ` and ${money(bank.card.perPurchase)} a purchase` : ''}${bank.card.freeUnder !== undefined ? `, free under ${bank.card.freeUnder}` : ''}. Source: ${bank.card.source}.`);
  }
  if (bank.returned) lines.push(`A payment the bank returns unpaid costs ${money(bank.returned.fee)}${bank.returned.ifShortAtLeast !== undefined ? `, none on a payment under ${money(bank.returned.ifShortAtLeast)}` : ''}${bank.returned.gapDays > 1 ? `, at most once every ${bank.returned.gapDays} business days` : ''}. Source: ${bank.returned.source}.`);
  if (bank.dormant) lines.push(`An account unused for ${bank.dormant.afterYears} years costs ${money(bank.dormant.yearly)} a year${bank.dormant.belowBalance !== undefined ? ` while it holds under ${money(bank.dormant.belowBalance)}` : ''}. Source: ${bank.dormant.source}.`);
  if (bank.quietMonth) lines.push(`A month with fewer than ${bank.quietMonth.minTransactions} transactions costs ${money(bank.quietMonth.fee)}${bank.quietMonth.unlessWages ? ', unless wages are paid in' : ''}. Source: ${bank.quietMonth.source}.`);
  if (refund?.refund) {
    const day = `${refund.refund.day} ${MONTH_NAMES[refund.refund.month - 1]}`;
    lines.push(`${refund.note} It’s paid here on ${day}${refund.refund.estimateDate ? ', which is SLATE’s estimate of the day' : ''}.`);
  }
  if (lines.length === 0) return null;
  return (
    <Panel title="Other Charges">
      <div className="col gap-2">
        {lines.map((line) => <p key={line} className="small" style={{ margin: 0 }}>{line}</p>)}
      </div>
    </Panel>
  );
}

/**
 * What closing savings moves: the balance, with this month's interest paid
 * less its tax. Until 2026-09-27 it said the balance, and more moved.
 */
function closingWords(sim: Simulation, account: Account, money: (c: number) => string, into: string): string {
  const earned = Math.floor(account.accrued ?? 0);
  const net = earned - (earned > 0 ? interestTaxFor(sim, account, earned) : 0);
  const left = savingsLeftThisMonth(sim, account);
  if (left !== undefined && account.balance + earned > left) return `It holds more than the ${money(left)} the month lets out without notice: closing it gives the law’s three months’ notice, and it moves to ${into} then.`;
  return `Its ${money(account.balance + net)}${net > 0 ? `, with ${money(net)} of interest built this month` : ''}, moves to ${into}.`;
}

/** How a fee is waived, the way the bank puts its conditions, each one an "or", and what lowers it. */
function waiverWords(product: Product, money: (cents: number) => string): string {
  const waiver = product.waiver;
  // As the bank counts them: any electronic deposit where it does, and until 2026-09-27 this said wages for every bank.
  const paidIn = product.deposits === 'electronic' ? 'of electronic deposits (wages, benefits or a tax refund) paid in' : 'of wages paid in';
  const cut = product.reduced;
  const lower = !cut ? '' : `; ${money(cut.to)} with ${[
    cut.depositsAtLeast !== undefined ? `${money(cut.depositsAtLeast)} ${paidIn}` : '',
    cut.averageAtLeast !== undefined ? `an average of ${money(cut.averageAtLeast)} over the month` : '',
    cut.ageBelow !== undefined ? `being under ${cut.ageBelow}` : '',
  ].filter(Boolean).join(', or ')}`;
  if (!waiver) return lower;
  const ways: string[] = [];
  if (waiver.depositsAtLeast !== undefined) {
    const also = waiver.depositsAlso;
    const extra = !also ? '' : also.either !== undefined
      ? ` and ${also.either} bills or card payments in ${also.months} months`
      : ` and ${[also.bills !== undefined ? `${also.bills} bills` : '', also.purchases !== undefined ? `${also.purchases} card payments` : ''].filter(Boolean).join(' or ')} in ${also.months} months`;
    ways.push(`${money(waiver.depositsAtLeast)} ${paidIn}${extra}`);
  }
  if (waiver.balanceAtLeast !== undefined) ways.push(`keeping ${money(waiver.balanceAtLeast)} in it all month`);
  if (waiver.averageAtLeast !== undefined) ways.push(`an average of ${money(waiver.averageAtLeast)} over the month`);
  if (waiver.linkedAverageAtLeast !== undefined) ways.push(`an average of ${money(waiver.linkedAverageAtLeast)} across your accounts at the bank`);
  if (waiver.ageBelow !== undefined) ways.push(`being under ${waiver.ageBelow}`);
  if (waiver.ageAtLeast !== undefined) ways.push(`being ${waiver.ageAtLeast} or over`);
  if (waiver.purchasesAtLeast !== undefined) ways.push(`${waiver.purchasesAtLeast} card payments in the month`);
  if (waiver.firstMonths !== undefined) ways.push(`the first ${waiver.firstMonths} months after opening`);
  if (ways.length === 0) return lower;
  return `, waived with ${ways.join(', or ')}${lower}`;
}
