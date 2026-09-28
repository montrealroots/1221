/**
 * SLATE — the money, and what it comes to.
 *
 * Home prints four money facts and every one of them is a dead end: the name
 * of the account you spend from, the balance in it, a net worth, and what is
 * owed. None of them is a made-up figure. A balance is the sum of its postings
 * (`core/ledger.ts`), net worth is recomputed from the ledger every time it
 * is asked for (`systems/finance.ts`), and neither is stored
 * anywhere a screen could get them wrong.
 *
 * Three kinds live here. An `account` is a thing — a real account at a real
 * institution, with a balance, a last four and, where it is a card, a limit
 * and a rate. That is a floor a chain is allowed to end on. `networth` is a
 * figure rather than a thing, and it is treated the way readiness is: it opens
 * into a sentence about what makes it up and ways into the accounts actually
 * making it, because an account is a thing and a subtraction is not. `debt` is
 * the same again for the other side of the sheet.
 *
 * That the ledger is double-entry and audits clean is worth one line at the
 * foot of net worth. It is not worth a lecture, and it is never a level.
 */

import { formatMoney, saveCurrency, type Money } from '@/engine/core/money';
import { Ledger, isLiability, type Account, type AccountKind } from '@/engine/core/ledger';
import { MS_DAY } from '@/engine/core/time';
import { titleCaseLabel } from '@/engine/core/text';
import { netWorth, type Worth } from '@/engine/systems/finance';
import type { Person } from '@/engine/domain/model';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, type Way } from './registry';
import { at } from './subject';
import { isAre, spokenList } from './words';
import { cardTerms } from '@/engine/systems/credit';
import { lendingOf } from '@/engine/systems/lending';
import { cashOwedOn } from '@/engine/systems/cash';
import { transferRate } from '@/engine/systems/cardoffers';
import { bankById } from '@/engine/content/banks';

/** The window every "lately" sentence in this file means, and its word. */
const RECENT_DAYS = 30;
const RECENT_WORDS = 'thirty days';

/** What the world calls each sort of account. Never the engine’s word for it. */
const ACCOUNT_KIND: Readonly<Record<AccountKind, string>> = {
  checking: 'What You Spend From',
  savings: 'What You Put Aside',
  cash: 'Money In Hand',
  credit_card: 'A Line Of Credit',
  loan: 'Money You Borrowed',
  mortgage: 'The Loan On The Roof',
  auto_loan: 'The Loan On The Car',
  brokerage: 'Money At Work',
  company_cash: 'The Company Account',
  company_credit: 'The Company Card',
  escrow: 'Money Held For Later',
  production_account: 'A Production Account',
  // Nominal accounts never resolve, so these are here for completeness only.
  income: 'Where Money Comes From',
  expense: 'Where Money Goes',
  equity: 'What Was There To Start',
  asset_value: 'What A Thing Is Worth',
  liability_other: 'Something Owed',
};

/** How a spend category is written where a person reads it. */
const CATEGORY_WORDS: Readonly<Record<string, string>> = {
  opening: 'Carried From Before',
  groceries: 'Food',
};

const categoryWords = (key: string): string =>
  CATEGORY_WORDS[key] ?? titleCaseLabel(key.replace(/_/g, ' '));

const personIn = (sim: Simulation, id: string): Person | undefined =>
  sim.universe.people[id || sim.universe.playerId];

/** What a liability account actually has against it. Never negative. */
const owedOn = (a: Account): number => Math.max(0, -a.balance);

/** "22.49%", from a rate stored as a decimal. */
const ratePercent = (apr: number): string => `${(apr * 100).toFixed(2)}%`;

/**
 * The rate an account is charged at now: a card’s by its terms (an
 * introductory rate, a penalty rate, the legal cap, `cardTerms`), anything
 * else’s as written. Until 2026-09-27 a card’s look read the rate written on
 * it, 24.99% through a 0% introduction that Home showed as 0%.
 */
function rateOf(sim: Simulation, a: Account): number | undefined {
  // A current account overdrawn, or with one arranged, is charged its overdraft’s rate day by day (`systems/lending.ts`):
  // until 2026-09-27 it read as charging nothing. What’s owed the landlord carries none, and read as 0%.
  if (a.kind === 'checking') {
    const od = a.bankId ? lendingOf(bankById(a.bankId)).overdraft : undefined;
    const rate = a.overdraftRate ?? (od && 'rate' in od ? od.rate : undefined);
    return a.balance < 0 || (a.overdraftLimit ?? 0) > 0 ? rate : undefined;
  }
  if (a.category === 'arrears' || a.apr === 0) return undefined;
  if (a.kind !== 'credit_card' || a.apr === undefined) return a.apr;
  const owner = a.ownerId ? sim.universe.people[a.ownerId] : undefined;
  return cardTerms(sim, a, owner?.credit?.score ?? 650).apr;
}

/**
 * A year of interest on what an account owes, as the engine charges it: a
 * card’s cash and transfers at their own rates, the rest at the purchase
 * rate. Until 2026-09-27 the whole card was taken at the purchase rate.
 */
function yearOfInterest(sim: Simulation, a: Account): Money {
  const owed = owedOn(a);
  const owner = a.ownerId ? sim.universe.people[a.ownerId] : undefined;
  if (a.kind !== 'credit_card' || !owner?.credit) return Math.round(owed * (rateOf(sim, a) ?? 0));
  const terms = cardTerms(sim, a, owner.credit.score);
  const cash = cashOwedOn(owner, a);
  let transfers = 0;
  let transferInterest = 0;
  for (const one of owner.credit.transfers ?? []) { transfers += one.owed; transferInterest += one.owed * transferRate(sim, owner.credit, one); }
  const rest = Math.max(0, owed - cash - transfers);
  return Math.round(rest * terms.apr + cash * (terms.cashApr ?? terms.apr) + transferInterest);
}

/** How long it has been there, in the words a person uses for it. */
function heldFor(sim: Simulation, openedAt: number): string {
  const days = Math.max(0, Math.round((sim.now - openedAt) / MS_DAY));
  if (days < 30) return 'this month';
  if (days < 60) return 'last month';
  const months = Math.round(days / 30);
  if (months < 24) return `${months} months ago`;
  return `${Math.round(days / 365)} years ago`;
}

/** What has crossed an account lately, as money in and money out. */
function movement(sim: Simulation, accountId: string): { inward: number; outward: number } {
  const since = sim.now - RECENT_DAYS * MS_DAY;
  let inward = 0;
  let outward = 0;
  for (const txn of sim.ledger.history(accountId, 400)) {
    if (txn.at < since) continue;
    const delta = Ledger.effectOn(txn, accountId);
    if (delta > 0) inward += delta;
    else outward += -delta;
  }
  return { inward, outward };
}

/** The accounts with something standing against them, worst first. */
function debtsOf(sim: Simulation, ownerId: string): Account[] {
  return sim.ledger.accountsOf(ownerId)
    .filter((a) => isLiability(a.kind) && owedOn(a) > 0)
    .sort((a, b) => owedOn(b) - owedOn(a));
}

// ---------------------------------------------------------------------------
// One account
// ---------------------------------------------------------------------------

defineLook<Account>('account', {
  gone: 'That account is closed. Whatever was in it went somewhere else a while ago.',
  resolve: (sim, id) => {
    const account = sim.ledger.tryAccount(id);
    if (!account || account.nominal || account.closedAt) return undefined;
    return account;
  },
  seeds: (sim) => sim.ledger.accountsOf(sim.universe.playerId).map((a) => a.id),
  look: (account, { sim }) => {
    // Company and production accounts are owned by a company, not a person, so
    // neither the trail up nor the way across to Owed is theirs to offer.
    const owner = sim.universe.people[account.ownerId];
    const ways: Way[] = [];
    if (owner && isLiability(account.kind) && owedOn(account) > 0) {
      ways.push({
        to: at('debt', account.ownerId),
        label: 'Owed',
        detail: 'Everything standing against your name, and what the rates written on it would come to in a year',
      });
    }
    return {
      name: account.name,
      kind: ACCOUNT_KIND[account.kind],
      parent: owner ? at('person', owner.id) : undefined,
      summary: accountSentence(account, sim),
      body: accountBody(account, sim),
      ways,
      provenance: account.apr === undefined
        ? 'The balance is the sum of the postings against it, not a figure anybody typed in.'
        : 'The balance is the sum of the postings against it. A card’s rate is its terms’ now, and it’s charged at each statement on a balance the last statement didn’t clear.',
    };
  },
});

/** What the account is doing right now, in one sentence. */
function accountSentence(a: Account, sim: Simulation): string {
  const cur = saveCurrency(sim.universe);
  const where = a.institution ? ` at ${a.institution}` : '';
  const spendsFromIt = sim.universe.people[a.ownerId]?.primaryAccountId === a.id;

  if (isLiability(a.kind)) {
    const owed = owedOn(a);
    const limit = a.creditLimit ?? 0;
    if (owed === 0) {
      return limit > 0
        ? `You owe nothing on it${where}, and the whole ${formatMoney(limit, cur)} line is sitting there if you want it.`
        : `You owe nothing on it${where}, and it’s been clear for a while.`;
    }
    const free = Math.max(0, limit + a.balance);
    return limit > 0
      ? `You owe ${formatMoney(owed, cur)} on it${where}, which leaves ${formatMoney(free, cur)} of a ${formatMoney(limit, cur)} line still free.`
      : a.category === 'arrears'
        ? `You owe ${formatMoney(owed, cur)} on it${where}. It’s taken from the first money in the bank each night, unless you pay rent by hand.`
        : `You owe ${formatMoney(owed, cur)} on it${where}, and it comes down only as fast as you pay it down.`;
  }

  if (a.balance < 0) {
    return `You’re ${formatMoney(-a.balance, cur)} under${where}, and every day it stays under costs you.`;
  }
  if (a.balance === 0) {
    return `There’s nothing in it${where}, ${tailFor(a.kind, spendsFromIt)}`;
  }
  return `You have ${formatMoney(a.balance, cur)} in it${where}, ${tailFor(a.kind, spendsFromIt)}`;
}

/** What has crossed it lately, without saying "and nothing" twice. */
function movementSentence(inward: number, outward: number, cur: string): string {
  if (inward === 0 && outward === 0) return `Not a cent has moved through it in the last ${RECENT_WORDS}.`;
  if (outward === 0) return `${formatMoney(inward, cur)} has come in over the last ${RECENT_WORDS}, and nothing has gone the other way.`;
  if (inward === 0) return `${formatMoney(outward, cur)} has gone out over the last ${RECENT_WORDS}, and nothing has come in.`;
  return `Over the last ${RECENT_WORDS} ${formatMoney(inward, cur)} came in and ${formatMoney(outward, cur)} went out.`;
}

/** What the money in this sort of account is for. */
function tailFor(kind: AccountKind, spendsFromIt: boolean): string {
  switch (kind) {
    case 'savings':
      return 'set aside, and drawn on to pay what the current account can’t where you’ve linked it, and for what’s owed the landlord.';
    case 'brokerage':
      return 'and what it’s worth moves with the market.';
    case 'escrow':
      return 'and it isn’t yours to touch until the thing it’s for happens.';
    case 'cash':
      return 'and it spends without asking anybody.';
    default:
      return spendsFromIt ? 'and that’s what today comes out of.' : 'and it sits there until you move it.';
  }
}

function accountBody(a: Account, sim: Simulation) {
  const cur = saveCurrency(sim.universe);
  const { inward, outward } = movement(sim, a.id);
  const owed = owedOn(a);
  const limit = a.creditLimit ?? 0;
  const liability = isLiability(a.kind);

  const stats = [
    <Stat
      key="balance"
      label={liability ? 'Owed' : 'Balance'}
      value={<span className="mono">{formatMoney(liability ? owed : a.balance, cur)}</span>}
      tone={liability ? (owed > 0 ? 'negative' : undefined) : (a.balance < 0 ? 'negative' : undefined)}
      note={liability ? 'What is standing against it' : 'What is in it right now'}
    />,
  ];
  if (limit > 0) {
    stats.push(
      <Stat
        key="free"
        label="Still Free"
        value={<span className="mono">{formatMoney(Math.max(0, limit + a.balance), cur)}</span>}
        note={`Of a ${formatMoney(limit, cur)} line`}
      />,
    );
  }
  const rate = rateOf(sim, a);
  if (rate !== undefined) {
    stats.push(
      <Stat key="rate" label="Rate" value={ratePercent(rate)} note={a.kind === 'credit_card' ? 'A year, as the card charges it now' : 'A year, written on the account'} />,
    );
  }
  if (a.last4) {
    stats.push(<Stat key="last4" label="Ends In" value={<span className="mono">{a.last4}</span>} note="How the bank knows it" />);
  }

  return (
    <>
      <p className="small">
        {a.institution ?? 'The bank'} opened it {heldFor(sim, a.openedAt)}
        {a.last4 ? `, and it ends ${a.last4}` : ''}.{' '}
        {rate !== undefined && a.kind === 'checking'
          ? `Overdrawn, it’s charged ${ratePercent(rate)} a year on what’s under, day by day, and paid on the first; any fee is on the Bank screen.`
          : rate !== undefined
          ? `Anything left on it is charged at ${ratePercent(rate)} a year, against what’s still owing, not against what it started at.`
          : a.kind === 'checking' || a.kind === 'savings' ? 'It charges no interest; any fee the bank asks for keeping it is on the Bank screen.' : 'It charges no interest.'}
      </p>
      <p className="small">{movementSentence(inward, outward, cur)}</p>
      <div className="grid grid-3">{stats}</div>
    </>
  );
}

// ---------------------------------------------------------------------------
// What it all comes to
// ---------------------------------------------------------------------------

interface Holdings {
  person: Person;
  worth: Worth;
  accounts: Account[];
}

defineLook<Holdings>('networth', {
  gone: 'There’s nobody here for the money to belong to.',
  resolve: (sim, id) => {
    const person = personIn(sim, id);
    if (!person) return undefined;
    return {
      person,
      worth: netWorth(sim, person.id),
      accounts: sim.ledger.accountsOf(person.id),
    };
  },
  seeds: (sim) => [sim.universe.playerId],
  look: (held, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const { person, worth, accounts } = held;

    const ways: Way[] = accounts.map((a) => ({
      to: at('account', a.id),
      label: a.name,
      detail: isLiability(a.kind)
        ? `${a.institution ?? 'A lender'}, and ${formatMoney(owedOn(a), cur)} owed on it`
        : `${a.institution ?? 'A bank'}, and ${formatMoney(a.balance, cur)} in it`,
    }));
    if (worth.liabilities > 0) {
      ways.push({
        to: at('debt', person.id),
        label: 'Owed',
        detail: `${formatMoney(worth.liabilities, cur)} against your name, and what the rates written on it would come to in a year`,
      });
    }

    return {
      name: 'Net Worth',
      kind: 'What It All Comes To',
      parent: at('person', person.id),
      summary: worthSentence(worth, cur),
      body: worthBody(held, cur),
      facets: [
        {
          id: 'went',
          label: 'Where It Went',
          body: spendBody(sim, person.id),
        },
      ],
      ways,
      provenance: 'Added up from the ledger every time you ask, and stored nowhere. Every entry behind it has a matching entry somewhere else, and the books come to zero to the cent.',
    };
  },
});

/** Both sides of it, spoken. */
function worthSentence(w: Worth, cur: string): string {
  const parts: string[] = [];
  if (w.cash > 0) parts.push(`${formatMoney(w.cash, cur)} in the bank`);
  if (w.cash < 0) parts.push(`${formatMoney(-w.cash, cur)} overdrawn`);
  if (w.held > 0) parts.push(`${formatMoney(w.held, cur)} held as a deposit`);
  if (w.pension > 0) parts.push(`${formatMoney(w.pension, cur)} in a pension, locked until you retire`);
  if (w.liabilities > 0) parts.push(`${formatMoney(w.liabilities, cur)} owed against it`);
  if (parts.length === 0) {
    return 'You’re worth nothing at all today — no money anywhere and nothing owed.';
  }
  return `You’re worth ${formatMoney(w.total, cur)}: ${spokenList(parts)}.`;
}

function worthBody(held: Holdings, cur: string) {
  const { worth, accounts } = held;
  const names = accounts.map((a) => a.name);
  const spending = accounts.find((a) => a.id === held.person.primaryAccountId);

  return (
    <>
      <p className="small">
        {names.length === 0
          ? 'You have no accounts open anywhere, so there’s nothing holding the money but your pockets.'
          : `${spokenList(names)} ${isAre(names.length)} open in your name`}
        {names.length > 0 && spending ? `, and ${spending.name} is the one the day comes out of.` : names.length > 0 ? '.' : ''}
      </p>
      <div className="grid grid-3">
        <Stat label="In The Bank" value={<span className="mono">{formatMoney(worth.cash, cur)}</span>} note="Across every account" />
        <Stat
          label="Owed"
          value={<span className="mono">{formatMoney(worth.liabilities, cur)}</span>}
          tone={worth.liabilities > 0 ? 'negative' : undefined}
          note="Set against all of it"
        />
        <Stat
          label="Net"
          value={<span className="mono">{formatMoney(worth.total, cur)}</span>}
          tone={worth.total < 0 ? 'negative' : 'positive'}
          note="What is left when it settles"
        />
      </div>
    </>
  );
}

/** The other face of the same figure: what has been leaving it. */
function spendBody(sim: Simulation, ownerId: string) {
  const cur = saveCurrency(sim.universe);
  const spend = sim.ledger.spendByCategory(ownerId, sim.now - RECENT_DAYS * MS_DAY, sim.now);
  const rows = Object.entries(spend).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) {
    return <p className="small">You have spent nothing at all in the last {RECENT_WORDS}.</p>;
  }
  const total = rows.reduce((s, [, amount]) => s + amount, 0);
  const top = rows.slice(0, 3).map(([key]) => categoryWords(key).toLowerCase());

  return (
    <>
      <p className="small">
        {formatMoney(total, cur)} has gone out in the last {RECENT_WORDS}, and {spokenList(top)}{' '}
        {isAre(top.length)} where most of it went.
      </p>
      <div className="col gap-2">
        {rows.slice(0, 6).map(([key, amount]) => (
          <div key={key} className="row-between small">
            <span>{categoryWords(key)}</span>
            <span className="mono dim">{formatMoney(amount, cur)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// What is owed
// ---------------------------------------------------------------------------

interface Owing { person: Person; debts: Account[]; total: number }

defineLook<Owing>('debt', {
  gone: 'You don’t owe anybody anything, so there’s nothing standing against your name to look at.',
  resolve: (sim, id) => {
    const person = personIn(sim, id);
    if (!person) return undefined;
    const debts = debtsOf(sim, person.id);
    if (debts.length === 0) return undefined;
    return { person, debts, total: debts.reduce((s, a) => s + owedOn(a), 0) };
  },
  seeds: (sim) => (debtsOf(sim, sim.universe.playerId).length > 0 ? [sim.universe.playerId] : []),
  look: (owing, { sim }) => { const cur = saveCurrency(sim.universe); return ({
    name: 'Owed',
    kind: 'Money Against You',
    parent: at('networth', owing.person.id),
    summary: owing.debts.length === 1 && owing.debts[0]
      ? `You owe ${formatMoney(owing.total, cur)}, all of it on the ${owing.debts[0].name}.`
      : `You owe ${formatMoney(owing.total, cur)}, spread across ${spokenList(owing.debts.map((a) => a.name))}.`,
    body: debtBody(owing, cur, sim),
    ways: owing.debts.map((a) => ({
      to: at('account', a.id),
      label: a.name,
      detail: rateOf(sim, a) !== undefined
        ? `${formatMoney(owedOn(a), cur)} on it at ${ratePercent(rateOf(sim, a)!)}`
        : `${formatMoney(owedOn(a), cur)} on it, at no stated rate`,
    })),
    provenance: 'The rates come off the accounts themselves, and a card’s is charged at each statement on a balance carried. None of it is run forward — it’s what the balances are at this minute.',
  }); },
});

function debtBody(owing: Owing, cur: string, sim: Simulation) {
  const yearly = owing.debts.reduce((s, a) => s + yearOfInterest(sim, a), 0);
  // Every line open to them, a card with nothing on it among them, as a bureau reads it.
  const lines = Object.values(sim.universe.accounts).filter((a) => a.ownerId === owing.person.id && !a.closedAt && a.kind === 'credit_card' && (a.creditLimit ?? 0) > 0);
  const limits = lines.reduce((s, a) => s + (a.creditLimit ?? 0), 0);
  const revolving = lines;
  const used = limits > 0
    ? Math.round((revolving.reduce((s, a) => s + owedOn(a), 0) / limits) * 100)
    : 0;
  const dearest = owing.debts
    .filter((a) => rateOf(sim, a) !== undefined)
    .sort((a, b) => (rateOf(sim, b) ?? 0) - (rateOf(sim, a) ?? 0))[0];

  return (
    <>
      <p className="small">
        {yearly > 0
          ? `Carried at the rates they charge now, that would come to about ${formatMoney(yearly, cur)} a year, or ${formatMoney(Math.round(yearly / 12), cur)} a month for standing still. A card paid in full each month is charged none.`
          : 'None of them carries a rate, so the balance sits where it is until you pay it.'}
        {dearest ? ` The ${dearest.name} is the expensive one, at ${ratePercent(rateOf(sim, dearest) ?? 0)}.` : ''}
      </p>
      <p className="small">
        {limits > 0
          ? `You’re using ${used}% of the ${formatMoney(limits, cur)} of credit open to you. Over 30%, each month’s report costs your record points, more the more of it is used.`
          : 'None of it is revolving credit, so there’s no line to be using up.'}
      </p>
      <div className="grid grid-3">
        <Stat label="Owed" value={<span className="mono">{formatMoney(owing.total, cur)}</span>} tone="negative" note="Across everything" />
        <Stat
          label="A Year Of Interest"
          value={<span className="mono">{formatMoney(yearly, cur)}</span>}
          note="What carrying it costs"
        />
        <Stat
          label="Credit Used"
          value={limits > 0 ? `${used}%` : 'None open'}
          tone={used > 30 ? 'warning' : undefined}
          note={limits > 0 ? `Of ${formatMoney(limits, cur)}` : 'No revolving line'}
        />
      </div>
    </>
  );
}
