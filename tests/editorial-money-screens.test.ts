/**
 * Brief 15, the money area (`docs/verification/editorial-2026-10-19/money/`): the money screens' new words, rendered as
 * the player has them, where no other test reads them. A New York student at Chase unless a case says otherwise; TEST
 * SETUP lines set a card's terms or a country's law where the case needs one the research doesn't give.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { bankById } from '@/engine/content/banks';
import { CARDS, CARD_LAW, type CardLaw, type CardProduct } from '@/engine/content/cards';
import { cardsOf } from '@/engine/systems/credit';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
}));

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { BankCard } = await import('@/ui/bank/BankCard');
const { BankCardOffers } = await import('@/ui/bank/BankCardOffers');
const { BankStatements } = await import('@/ui/bank/BankStatements');

const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1');
function drawn(sim: Simulation, component: FunctionComponent<{ bankId: string }>, bankId = 'us-chase'): string {
  h.sim = sim;
  return onScreen(renderToStaticMarkup(createElement(component, { bankId })));
}
const nyStudent = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase' });

const cards = CARDS as Record<string, CardProduct | { none: true; source: string }>;
const laws = CARD_LAW as Record<string, CardLaw>;

describe('the card’s panels', () => {
  it('names Chase’s plans as published, not as the bank’s own words, since the research summarises them', () => {
    const words = drawn(nyStudent('ed15-plans'), BankCardOffers);
    expect(words).toContain('The bank’s published plans: Chase Pay Over Time (formerly My Chase Plan): a fixed monthly fee instead of interest; 0% during the 15-month intro period, then up to 1.72% of the plan amount per month.');
    expect(words).not.toContain('in its words');
  });

  it('says a charge card is paid from the checking account, and a capped rate under the law, the law named in the source line', () => {
    const sim = quickSave({ homeRegionId: 'fr-idf-paris', startLocationId: 'fr-idf-paris', livesWhereBorn: true, wealth: 'comfortable', bankId: 'fr-bnp-paribas' }, 'ed15-charge');
    const card = cardsOf(sim, sim.player)[0]!;
    const bank = bankById(card.bankId!)!;
    const kept = { card: cards[bank.id], law: laws[bank.iso] };
    try {
      const words = drawn(sim, BankCard, bank.id);
      expect(words).toMatch(/This is a charge card: BNP Paribas takes the whole statement from your checking account each month\./);
      // TEST SETUP: a revolving card at 40% and a law capping it at 25%, as tests/cards.test.ts sets one.
      cards[bank.id] = { ...(kept.card as CardProduct), kind: 'revolving', apr: 0.4 };
      laws[bank.iso] = { aprCap: 0.25, law: 'A Test Act', source: 'test' };
      card.apr = 0.4;
      expect(drawn(sim, BankCard, bank.id)).toContain('The law here caps the rate at 25%, and the card is held to that. Source: A Test Act; test.');
    } finally {
      if (kept.card) cards[bank.id] = kept.card;
      if (kept.law) laws[bank.iso] = kept.law; else delete laws[bank.iso];
    }
  });
});

describe('the Statements tab', () => {
  it('labels the low balance alert in a checking account’s words', () => {
    const words = drawn(nyStudent('ed15-alerts'), BankStatements as FunctionComponent<{ bankId: string }>);
    expect(words).toContain('Any Checking Account Under (USD)');
    expect(words).not.toContain('Current Account');
  });
});
