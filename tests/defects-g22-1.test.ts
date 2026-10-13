/**
 * Defects, group g22, part 1 (from 2026-10-12).
 *
 * tutorial-bank-chapter-stale. The guide's “Your Bank” chapter (`content/tutorial.ts`) said three things the bank
 * doesn't do. It put Statements “under the accounts”, though they're a tab of their own beside Accounts, Cards,
 * Payments And Cash and Borrowing (`ui/shell/sections.ts`, `ui/workspaces/BankWorkspace.tsx`). It said Move Money
 * moved money between your own accounts “at once”, though between two banks it goes out now and arrives in the
 * sending bank's days (`systems/banking.ts`, bank.transfer, from 2026-10-10). And it said asking for help with
 * payments got the plan, though the bank refuses anyone whose current accounts and savings could clear the card today
 * (`systems/cardlife.ts`, card.request_hardship, from 2026-10-10).
 *
 * The chapter's words are in `content/tutorial.ts`, which this pass couldn't edit, so the three checks of the chapter
 * failed until they were corrected there on 2026-10-12. Each is held against the game on a played save, not against a
 * sentence: put Statements back on the Accounts tab, make a move between banks land at once, or grant the plan to
 * anyone with a balance, and the check turns the other way.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { bankAccountsOf } from '@/engine/systems/banking';
import { cardOf } from '@/engine/systems/credit';
import { CHAPTER_BY_ID } from '@/engine/content/tutorial';
import { SECTIONS } from '@/ui/shell/sections';

const BANK = CHAPTER_BY_ID['bank']!;
const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

/** The chapter's sentences, its asides in brackets left out. */
function sentences(text: readonly string[]): string[] {
  return text.join(' ').replace(/\s*\([^)]*\)/g, '').split(/(?<=[.!?])\s+/);
}

const newYorker = (seed: string) =>
  quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'comfortable', bankId: 'us-chase' }, seed);
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
/** TEST SETUP: money posted to an account from outside, as a deposit from family would be. */
const give = (sim: Simulation, accountId: string, amount: number) =>
  sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });

describe('tutorial-bank-chapter-stale: where Statements are', () => {
  const tabs = SECTIONS['/workspace/bank'] ?? [];
  const workspace = source('ui/workspaces/BankWorkspace.tsx');
  // A tab of their own when the bank's tabs name one and the Statements pane is drawn there and nowhere else.
  const ownTab = tabs.some((t) => t.id === 'statements' && t.label === 'Statements')
    && /statements:\s*<BankStatements\s*\/>/.test(workspace)
    && (workspace.match(/<BankStatements\b/g) ?? []).length === 1;

  it('are a tab of the bank’s own', () => {
    expect(ownTab).toBe(true);
  });

  it('are where the chapter says they are', () => {
    const said = sentences(BANK.body).filter((s) => /\bStatements\b/.test(s));
    expect(said.length).toBeGreaterThan(0);
    expect(said.some((s) => /\bunder the accounts\b/i.test(s))).toBe(!ownTab);
    expect(said.some((s) => /\btab\b/i.test(s))).toBe(ownTab);
  });
});

describe('tutorial-bank-chapter-stale: how long Move Money takes', () => {
  /** A New Yorker's moves: Chase to its own savings, and Chase to a second bank. */
  function moves() {
    const sim = newYorker('g22-move');
    const chase = sim.universe.accounts[sim.player.primaryAccountId!]!;
    give(sim, chase.id, 2_000_00);
    const savingsId = bankAccountsOf(sim, sim.player).find((a) => a.kind === 'savings' && a.bankId === chase.bankId)?.id
      ?? run<{ accountId: string }>(sim, 'bank.open_savings', { bankId: chase.bankId }).accountId;
    const capId = run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId;
    const saved = sim.universe.accounts[savingsId]!.balance;
    const atOneBank = run<{ arrivesAt?: number }>(sim, 'bank.transfer', { fromId: chase.id, toId: savingsId, amount: 100_00 });
    const landedAtOnce = atOneBank.arrivesAt === undefined && sim.universe.accounts[savingsId]!.balance === saved + 100_00;
    const toAnother = run<{ arrivesAt?: number }>(sim, 'bank.transfer', { fromId: chase.id, toId: capId, amount: 100_00 });
    const later = toAnother.arrivesAt !== undefined && toAnother.arrivesAt > sim.now && sim.universe.accounts[capId]!.balance === 0;
    return { landedAtOnce, later };
  }

  it('is at once at one bank, and in the sending bank’s days to another', () => {
    expect(moves()).toEqual({ landedAtOnce: true, later: true });
  });

  it('is as long as the chapter says it is', () => {
    const { later } = moves();
    const said = BANK.body.filter((p) => p.includes('Move Money'));
    expect(said.length).toBeGreaterThan(0);
    const text = said.join(' ');
    // A move that can land later has to be said to, and “at once” has to be held to one bank.
    expect(/\b(another|other|different) bank/i.test(text)).toBe(later);
    if (later) for (const s of sentences(said).filter((x) => /\bat once\b/i.test(x))) expect(s).toMatch(/\b(one|the same) bank\b/i);
  });
});

describe('tutorial-bank-chapter-stale: who gets help with payments', () => {
  /** Whether the bank refuses the plan to someone whose bank accounts could clear the card, and grants it once they can't. */
  function refusesTheAble(): boolean {
    const sim = newYorker('g22-hardship');
    const card = cardOf(sim, sim.player)!;
    give(sim, card.id, -500_00);
    const able = sim.execute({ kind: 'card.request_hardship', payload: { accountId: card.id } });
    for (const a of bankAccountsOf(sim, sim.player)) if (a.balance !== 0) give(sim, a.id, -a.balance);
    run(sim, 'card.request_hardship', { accountId: card.id });
    expect(sim.player.credit?.suspended).toBe('hardship');
    return !able.ok && /you can’t/.test(String(able.error));
  }

  it('is refused to anyone who could pay the card off from the bank', () => {
    expect(refusesTheAble()).toBe(true);
  });

  it('is said to be for someone who can’t clear the card', () => {
    const refused = refusesTheAble();
    const said = sentences(BANK.body).filter((s) => /help with payments|hardship/i.test(s));
    expect(said.length).toBeGreaterThan(0);
    expect(said.some((s) => /can[’']t|cannot|unable/i.test(s))).toBe(refused);
  });
});
