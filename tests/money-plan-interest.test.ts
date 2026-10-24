/**
 * What a card's plans cost, as the debt look says it (from 2026-10-12). The engine charges a plan's balance no
 * purchase interest (`planLeftOf`): a plan with a fee pays its fee in place of interest, and a plan charged as interest
 * (`content/plans.ts`) pays its own rate on what's left. Until then the look priced a plan's balance at the purchase
 * rate, so on a card in a 0% introduction a plan charged as interest read as "They’re charged no interest today." while
 * its interest posted every statement (the prose verifier of 2026-10-12 found it on a Bank of Ireland card).
 * TEST SETUP: a plan written onto the card's state, as `card.plan` makes one, on a scraping New York life whose Chase
 * card is in its 15-month 0% introduction.
 */
import { describe, expect, it } from 'vitest';
import { isValidElement, type ReactNode } from 'react';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { cardTerms, stateOf } from '@/engine/systems/credit';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', bankId: 'us-chase', wealth: 'scraping' }, seed);
function wordsIn(node: ReactNode, out: string[] = []): string[] {
  if (node === null || node === undefined || typeof node === 'boolean') return out;
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return out; }
  if (Array.isArray(node)) { for (const child of node) wordsIn(child, out); return out; }
  if (isValidElement(node)) wordsIn((node.props as { children?: ReactNode }).children, out);
  return out;
}
const owedWords = (sim: Simulation) => wordsIn((resolveLook(sim, at('debt', sim.player.id)) as Looked).body).join('');

describe('a card’s plans, as the debt look prices them', () => {
  it('counts a plan charged as interest at its own rate, on a card at 0%', () => {
    const sim = life('plan-interest');
    const card = sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === 'credit_card')!;
    expect(cardTerms(sim, card, sim.player.credit!.score).apr).toBe(0);
    const owed = -card.balance;
    expect(owedWords(sim)).toContain('They’re charged no interest today.');
    // TEST SETUP: the card's balance on a plan charged as interest at 6.7%.
    stateOf(sim.player, card).plans = [{ left: owed, monthly: Math.ceil(owed / 12), fee: 0, monthsLeft: 12, apr: 0.067 }];
    const words = owedWords(sim);
    expect(words).not.toContain('They’re charged no interest today.');
    expect(words).toMatch(/would cost about \$\d+(\.\d\d)? a year/);
  });

  it('counts a plan with a fee at no interest, its fee in place of it', () => {
    const sim = life('plan-fee');
    const card = sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === 'credit_card')!;
    const owed = -card.balance;
    // TEST SETUP: the card's balance on a plan with a monthly fee and no rate.
    stateOf(sim.player, card).plans = [{ left: owed, monthly: Math.ceil(owed / 12), fee: Math.round(owed * 0.0172), monthsLeft: 12 }];
    expect(owedWords(sim)).toContain('They’re charged no interest today.');
  });
});
