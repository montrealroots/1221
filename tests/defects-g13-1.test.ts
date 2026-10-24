/**
 * Money-look defects found by the readings of 2026-10-12, each fixed and held here (`ui/looks/money.tsx`,
 * `systems/finance.ts`):
 * - net worth said every escrow balance was "held as a deposit". The rent deposit went on 2026-10-09, and what an
 *   escrow account holds now is money on its way between the holder’s banks, or SNAP on an EBT card, each named for
 *   the account holding it (from group R5’s fix, later on 2026-10-12: until then one phrase said either). Its
 *   "In The Bank" counted Cash In Hand, and the account sentences sent the reader to the landlord and to rent paid by hand, which
 *   went with the home;
 * - Owed called a card in its 0% introduction "the expensive one, at 0.00%", and said none of the debts carried a
 *   rate when the card’s standard rate was weeks off.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { formatDate, MS_DAY } from '@/engine/core/time';
import { cardTerms } from '@/engine/systems/credit';
import { arrearsAccount } from '@/engine/systems/spending';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';

const lifeIn = (extra: Record<string, unknown>, seed: string) =>
  quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', bankId: 'us-chase', ...extra }, seed);

/** Every string in a body, joined, the way a page reads it. */
function wordsIn(node: ReactNode, out: string[] = []): string[] {
  if (node === null || node === undefined || typeof node === 'boolean') return out;
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return out; }
  if (Array.isArray(node)) { for (const child of node) wordsIn(child, out); return out; }
  if (isValidElement(node)) wordsIn((node.props as { children?: ReactNode }).children, out);
  return out;
}
const read = (node: ReactNode) => wordsIn(node).join('');

/** The labels and notes of the Stats in a body. */
function statsIn(node: ReactNode, out: { label: string; note: string }[] = []): { label: string; note: string }[] {
  if (node === null || node === undefined || typeof node === 'boolean' || typeof node !== 'object') return out;
  if (Array.isArray(node)) { for (const child of node) statsIn(child, out); return out; }
  if (isValidElement(node)) {
    const props = node.props as { label?: unknown; note?: unknown; children?: ReactNode };
    if (typeof props.label === 'string') out.push({ label: props.label, note: String(props.note ?? '') });
    statsIn(props.children, out);
  }
  return out;
}

const look = (sim: Simulation, kind: string, id: string) => resolveLook(sim, at(kind, id)) as Looked;
const checkingOf = (sim: Simulation) => sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === 'checking')!;
const source = (...path: string[]) => readFileSync(join(fileURLToPath(new URL('../src/', import.meta.url)), ...path), 'utf8');

describe('net worth, after the rent deposit went', () => {
  it('says money on its way to another bank is on its way, not held as a deposit, and counts cash in hand as in hand', () => {
    const sim = lifeIn({ wealth: 'comfortable' }, 'g13-transit');
    // An account opened at another bank, funded from Chase: the deposit leaves at once and travels (`bank.open_current`).
    expect(sim.execute({ kind: 'bank.open_current', payload: { bankId: 'us-bank-of-america', fundFrom: checkingOf(sim).id, amount: 500_00 } }).ok).toBe(true);
    expect(sim.execute({ kind: 'cash.withdraw', payload: { amount: 60_00, from: 'atm' } }).ok).toBe(true);
    const worth = look(sim, 'networth', sim.player.id);
    expect(worth.summary).not.toMatch(/deposit/);
    // Named from the account that holds it (`Worth.heldAs`). Until a later fix of 2026-10-12 (group R5) this asserted
    // the one phrase net worth gave all of it, "held apart, on its way between your banks or as SNAP on an EBT card",
    // which told a Torontonian it might be SNAP: `tests/defects-r5-2.test.ts` holds the Toronto and SNAP lives.
    expect(worth.summary).toMatch(/\$500\.00 on its way between your banks/);
    expect(worth.summary).not.toMatch(/SNAP|EBT/);
    // "Or", as spokenList joins the parts with "and": "$1,674.00 in the bank and in hand and $963.00 owed" read twice.
    expect(worth.summary).toMatch(/ in the bank or in hand/);
    expect(statsIn(worth.body).map((s) => s.label)).toContain('In The Bank And In Hand');
    expect(statsIn(worth.body).map((s) => s.label)).not.toContain('In The Bank');
  });

  it('says only "in the bank" where nothing is in hand, so the words follow the wallet', () => {
    const sim = lifeIn({ wealth: 'comfortable' }, 'g13-no-wallet');
    const worth = look(sim, 'networth', sim.player.id);
    expect(worth.summary).toMatch(/ in the bank/);
    expect(worth.summary).not.toMatch(/in hand/);
    expect(statsIn(worth.body).map((s) => s.label)).toContain('In The Bank');
    expect(statsIn(worth.body).map((s) => s.label)).not.toContain('In The Bank And In Hand');
  });

  it('sends Bills Owed and savings to what went unpaid, not to the landlord or to rent paid by hand', () => {
    const sim = lifeIn({ wealth: 'comfortable' }, 'g13-arrears');
    const owed = arrearsAccount(sim, sim.player);
    sim.post({ memo: 'test', category: 'test', postings: [{ accountId: owed.id, amount: -120_00 }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: 120_00 }] });
    const bills = look(sim, 'account', owed.id);
    expect(bills.summary).not.toMatch(/rent|landlord|by hand/);
    expect(bills.summary).toMatch(/the first money in your primary account/);
    const savings = sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === 'savings')!;
    const set = look(sim, 'account', savings.id);
    expect(set.summary).not.toMatch(/landlord/);
    expect(set.summary).toMatch(/and it pays off anything left unpaid\.$/);
  });

  it('documents what `held` and `cash` hold now, and names the rent and work files in the past tense', () => {
    const finance = source('engine', 'systems', 'finance.ts');
    // The doc comment straight above a field: from the last `/**` before it.
    const docAbove = (field: string) => { const end = finance.indexOf(field); return finance.slice(finance.lastIndexOf('/**', end), end); };
    const heldDoc = docAbove('held: Money;');
    expect(heldDoc).toMatch(/Money In Transit/);
    expect(heldDoc).toMatch(/SNAP/);
    expect(heldDoc).not.toMatch(/^\/\*\* Theirs, held by somebody else: a rent deposit/);
    const cashDoc = docAbove('cash: Money;');
    expect(cashDoc).toMatch(/Cash In Hand/);
    expect(finance).not.toMatch(/came back\s+\*?\s*in their own systems \(`work\.ts`, `household\.ts`/);
    expect(source('ui', 'looks', 'money.tsx')).not.toMatch(/What’s owed the landlord carries none/);
  });
});

describe('Owed, on a card in its introduction', () => {
  it('says the card is at its introductory rate until a date and then its own, and never calls 0% the expensive one', () => {
    // A scraping New York life opens a Chase Freedom Unlimited 400 days back, with $913 on it and its 15-month 0% left.
    const sim = lifeIn({ wealth: 'scraping' }, 'g13-intro');
    const card = sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === 'credit_card')!;
    const terms = cardTerms(sim, card, sim.player.credit!.score);
    expect(terms.apr).toBe(0);
    expect(terms.introUntil! > sim.now).toBe(true);
    const owed = read(look(sim, 'debt', sim.player.id).body);
    expect(owed).not.toMatch(/expensive one, at 0\.00%/);
    expect(owed).not.toMatch(/None of them carries a rate/);
    expect(owed).toContain(`The Chase Freedom Unlimited is at 0.00% until ${formatDate(terms.introUntil!, sim.zone)}, then ${(terms.standardApr! * 100).toFixed(2)}%.`);
  });

  it('calls the card the expensive one at its own rate once the introduction ends', () => {
    const sim = lifeIn({ wealth: 'scraping' }, 'g13-intro-over');
    const card = sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === 'credit_card')!;
    sim.advanceTo(cardTerms(sim, card, sim.player.credit!.score).introUntil! + 2 * MS_DAY);
    const terms = cardTerms(sim, card, sim.player.credit!.score);
    expect(terms.apr).toBeGreaterThan(0);
    const owed = read(look(sim, 'debt', sim.player.id).body);
    expect(owed).not.toMatch(/ until /);
    expect(owed).toContain(`The Chase Freedom Unlimited is the expensive one, at ${(terms.apr * 100).toFixed(2)}%.`);
  });
});
