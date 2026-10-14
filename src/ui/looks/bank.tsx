/**
 * SLATE — the bank, and a line on its statement.
 *
 * The Bank screen names two things the money looks did not: the bank itself,
 * at the head of the screen, and every line on a statement. Both were dead
 * text. A bank is a thing in the world — a real institution in a real
 * country, holding real accounts in your name — and a statement line is a
 * moment money moved, between accounts that are themselves things. So both
 * open, and both lead somewhere: the bank into the accounts it holds and the
 * last money through them, a line into each account it touched and the day it
 * happened.
 *
 * Nothing here is a figure anybody typed. A bank’s total is the sum of the
 * balances it holds, each the sum of its postings; a line’s amount is what its
 * postings did to the account (`Ledger.effectOn`).
 */

import { formatMoney, saveCurrency } from '@/engine/core/money';
import { Ledger, isLiability, type Account, type LedgerTransaction } from '@/engine/core/ledger';
import { dateKey, formatDate, formatWeekdayDate } from '@/engine/core/time';
import { titleCaseLabel } from '@/engine/core/text';
import { bankById, type Bank } from '@/engine/content/banks';
import { COUNTRIES } from '@/engine/content/geography';
import { bankOf } from '@/engine/systems/banking';
import { balanceText, heldOf } from '@/engine/systems/abroad';
import type { Simulation } from '@/engine';
import { Stat } from '@/ui/components/primitives';
import { defineLook, lookExists, type Way } from './registry';
import { at } from './subject';
import { spokenList, nameable } from './words';

/** How many of the last lines through a bank its look offers. */
const RECENT_LINES = 5;

/** Whether a string reads as a name: no identifier shapes, and a plain capital or digit first. */
const passesAsName = nameable;

/**
 * A world word that passes as a name. A memo has each word capitalized, as a
 * label is written; a bank’s own name is left as the bank writes it. One that
 * opens on a marked letter, as Íslandsbanki does, is written without the mark
 * before it falls back to the plain word.
 */
function asName(text: string, fallback: string, recase = true): string {
  const trimmed = text.trim();
  const named = recase ? trimmed.split(' ').map((w) => w.replace(/^[a-z]/, (c) => c.toUpperCase())).join(' ') : trimmed;
  if (passesAsName(named)) return named;
  const plain = named.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return passesAsName(plain) ? plain : fallback;
}

/** The accounts a person has open at one bank, the one the day comes out of first. */
function accountsAt(sim: Simulation, bankId: string): Account[] {
  const player = sim.universe.people[sim.universe.playerId];
  return Object.values(sim.universe.accounts)
    .filter((a) => a.ownerId === sim.universe.playerId && a.bankId === bankId && !a.nominal && !a.closedAt)
    .sort((a, b) => Number(b.id === player?.primaryAccountId) - Number(a.id === player?.primaryAccountId));
}

/** The latest lines through any of a set of accounts, newest first. */
function latestThrough(sim: Simulation, ids: ReadonlySet<string>, count: number): LedgerTransaction[] {
  const list = sim.universe.transactions;
  const out: LedgerTransaction[] = [];
  for (let i = list.length - 1; i >= 0 && out.length < count; i -= 1) {
    const txn = list[i]!;
    if (txn.postings.some((p) => ids.has(p.accountId))) out.push(txn);
  }
  return out;
}

/** The country a bank is in, by its ISO code, where the world has it. */
const countryOfIso = (iso: string) => COUNTRIES.all().find((c) => c.iso2?.toUpperCase() === iso.toUpperCase());

/**
 * What an owed or held figure says about an account, in a few words: an account kept at home in its own money, with the
 * dollars beside (`balanceText`, from 2026-10-16).
 */
function standing(sim: Simulation, a: Account, cur: string): string {
  return isLiability(a.kind)
    ? `${formatMoney(Math.max(0, -a.balance), cur)} owed on it`
    : `${balanceText(sim, a)} in it`;
}

/** What a line moved on an account kept in another currency, in that currency: the sum of its postings’ own figures. */
function nativeOn(txn: LedgerTransaction, account: Account): number | undefined {
  if (!account.currency) return undefined;
  return txn.postings.filter((p) => p.accountId === account.id).reduce((sum, p) => sum + (p.native ?? 0), 0);
}

// ---------------------------------------------------------------------------
// The bank
// ---------------------------------------------------------------------------

interface TheBank { bank: Bank; accounts: Account[]; home: boolean }

defineLook<TheBank>('bank', {
  gone: 'You hold nothing at that bank any more, so it has nothing of yours to show.',
  resolve: (sim, id) => {
    const bank = bankById(id);
    if (!bank) return undefined;
    const player = sim.universe.people[sim.universe.playerId];
    const home = player ? bankOf(sim, player)?.id === bank.id : false;
    const accounts = accountsAt(sim, bank.id);
    if (!home && accounts.length === 0) return undefined;
    return { bank, accounts, home };
  },
  seeds: (sim) => {
    const player = sim.universe.people[sim.universe.playerId];
    const id = player ? bankOf(sim, player)?.id : undefined;
    return id ? [id] : [];
  },
  look: ({ bank, accounts, home }, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const held = accounts.filter((a) => !isLiability(a.kind)).reduce((s, a) => s + a.balance, 0);
    const owed = accounts.filter((a) => isLiability(a.kind)).reduce((s, a) => s + Math.max(0, -a.balance), 0);
    const country = countryOfIso(bank.iso);
    // A bank kept at home holds its accounts in its own money: said in it, with the dollars beside (from 2026-10-16).
    const kept = accounts.some((a) => a.currency);
    const heldWords = kept ? `${formatMoney(accounts.filter((a) => !isLiability(a.kind)).reduce((s, a) => s + heldOf(a), 0), bank.currency)} (${formatMoney(held, cur)})` : formatMoney(held, cur);

    const ways: Way[] = accounts.map((a) => ({
      to: at('account', a.id),
      label: a.name,
      detail: `${a.last4 ? `Ending ${a.last4}, ` : ''}${standing(sim, a, cur)}`,
    }));
    for (const txn of latestThrough(sim, new Set(accounts.map((a) => a.id)), RECENT_LINES)) {
      ways.push({
        to: at('transaction', txn.id),
        label: asName(txn.memo, 'A Payment'),
        detail: `On ${formatDate(txn.at, sim.homeZone)}, the latest money through your accounts here`,
      });
    }
    if (country && lookExists(sim, at('country', country.id))) {
      ways.push({ to: at('country', country.id), label: country.name, detail: 'The country the bank answers to, and whose money it keeps' });
    }
    if (lookExists(sim, at('currency', bank.currency))) {
      ways.push({ to: at('currency', bank.currency), label: bank.currency, detail: 'The money it keeps your accounts in, and what it’s worth' });
    }

    const named = accounts.map((a) => a.name);
    return {
      name: asName(bank.name, 'Your Bank', false),
      kind: home ? 'Where The Day Comes Out Of' : 'A Bank You Hold Something With',
      parent: at('person', sim.universe.playerId),
      summary: accounts.length === 0
        ? 'You hold nothing open here today.'
        : owed > 0
          ? `You have ${heldWords} here and owe it ${formatMoney(owed, cur)}, across ${named.length === 1 ? 'one account' : `${named.length} accounts`}.`
          : `You have ${heldWords} here, across ${named.length === 1 ? 'one account' : `${named.length} accounts`}.`,
      body: (
        <>
          <p className="small">
            {bank.name} is a {country ? `${country.name} ` : ''}bank and keeps its accounts in {bank.currency}.
            {named.length > 0 ? ` In your name it holds ${spokenList(named)}.` : ''}
            {home ? ' Your current account is here, so the day’s spending and your pay go through it.' : ' Your current account is at another bank; what’s here stays here until you move it.'}
          </p>
          <div className="grid grid-3">
            <Stat label="Held Here" value={<span className="mono">{kept ? heldWords : formatMoney(held, cur)}</span>} note="Across what it holds for you" />
            <Stat label="Owed Here" value={<span className="mono">{formatMoney(owed, cur)}</span>} tone={owed > 0 ? 'negative' : undefined} note="On its cards and loans" />
            <Stat label="Accounts" value={String(accounts.length)} note="Open in your name" />
          </div>
        </>
      ),
      ways,
      provenance: 'Each balance is the sum of the postings against it, added up again every time you look.',
    };
  },
});

// ---------------------------------------------------------------------------
// One line on a statement
// ---------------------------------------------------------------------------

interface TheLine { txn: LedgerTransaction; touched: { account: Account; delta: number }[] }

/** A transaction by its id, newest first, since the latest are the ones asked for. */
function transactionById(sim: Simulation, id: string): LedgerTransaction | undefined {
  const list = sim.universe.transactions;
  for (let i = list.length - 1; i >= 0; i -= 1) if (list[i]!.id === id) return list[i];
  return undefined;
}

/** What one account saw of a line, in words: on an account kept at home, its own figure with the dollars beside. */
function movedWords(account: Account, delta: number, cur: string, native?: number): string {
  const amount = native !== undefined && account.currency ? `${formatMoney(Math.abs(native), account.currency)} (${formatMoney(Math.abs(delta), cur)})` : formatMoney(Math.abs(delta), cur);
  if (isLiability(account.kind)) {
    return delta < 0 ? `added ${amount} to what you owe on ${account.name}` : `took ${amount} off what you owe on ${account.name}`;
  }
  return delta > 0 ? `put ${amount} into ${account.name}` : `took ${amount} out of ${account.name}`;
}

defineLook<TheLine>('transaction', {
  gone: 'That line isn’t on any statement of yours. Whatever it was has been taken off the books.',
  resolve: (sim, id) => {
    const txn = transactionById(sim, id);
    if (!txn) return undefined;
    const touched = txn.postings
      .map((p) => sim.ledger.tryAccount(p.accountId))
      .filter((a): a is Account => !!a && !a.nominal && a.ownerId === sim.universe.playerId)
      .filter((a, i, all) => all.findIndex((b) => b.id === a.id) === i)
      .map((account) => ({ account, delta: Ledger.effectOn(txn, account.id) }))
      .filter((one) => one.delta !== 0);
    if (touched.length === 0) return undefined;
    return { txn, touched };
  },
  seeds: (sim) => {
    const mine = new Set(sim.ledger.accountsOf(sim.universe.playerId).filter((a) => !a.nominal).map((a) => a.id));
    return latestThrough(sim, mine, 3).map((t) => t.id);
  },
  look: ({ txn, touched }, { sim }) => {
    const cur = saveCurrency(sim.universe);
    const zone = sim.homeZone;
    const when = formatWeekdayDate(txn.at, zone);
    const pending = txn.postsAt !== undefined && txn.postsAt > sim.now;
    const said = touched.map((one) => movedWords(one.account, one.delta, cur, nativeOn(txn, one.account)));
    const first = touched[0]!;
    const category = titleCaseLabel(txn.category.replace(/_/g, ' '));

    const ways: Way[] = touched
      .filter((one) => lookExists(sim, at('account', one.account.id)))
      .map((one) => ({
        to: at('account', one.account.id),
        label: one.account.name,
        detail: `The account it ${one.delta > 0 ? 'came into' : 'came out of'}, and ${standing(sim, one.account, cur)} now`,
      }));
    ways.push({ to: at('day', dateKey(txn.at, zone)), label: when, detail: 'The day it went through, and everything else on it' });
    for (const other of [txn.reverses, txn.reversedBy]) {
      if (other && transactionById(sim, other)) {
        ways.push({
          to: at('transaction', other),
          label: other === txn.reverses ? 'What It Undid' : 'What Undid It',
          detail: other === txn.reverses ? 'The line this one reversed, to the cent' : 'The line that reversed this one, to the cent',
        });
      }
    }

    return {
      name: asName(txn.memo, category || 'A Payment'),
      kind: 'A Line On A Statement',
      parent: at('account', first.account.id),
      summary: `It ${spokenList(said)}, on ${when}.`,
      body: (
        <>
          <p className="small">
            The bank files it under {category.toLowerCase() || 'nothing in particular'}.{' '}
            {pending
              ? `It’s held against the balance now and posts on ${formatDate(txn.postsAt!, zone)}.`
              : txn.reversedBy ? 'It was reversed later, so it no longer counts against you.' : 'It has posted, and it stands.'}
          </p>
          <div className="grid grid-3">
            <Stat
              label="Amount"
              value={<span className="mono">{first.account.currency ? `${formatMoney(Math.abs(nativeOn(txn, first.account) ?? 0), first.account.currency)} (${formatMoney(Math.abs(first.delta), cur)})` : formatMoney(Math.abs(first.delta), cur)}</span>}
              tone={first.delta < 0 ? 'negative' : 'positive'}
              note={first.delta > 0 ? (isLiability(first.account.kind) ? 'Off what’s owed' : 'In') : (isLiability(first.account.kind) ? 'Onto what’s owed' : 'Out')}
            />
            <Stat label="When" value={formatDate(txn.at, zone)} note={pending ? 'Still pending' : 'Posted'} />
            <Stat label="Accounts" value={String(touched.length)} note={touched.length === 1 ? 'Of yours, touched by it' : 'Of yours, moved between'} />
          </div>
        </>
      ),
      ways,
      provenance: 'Every line has a matching entry on the other side of the books, and the two come to zero.',
    };
  },
});
