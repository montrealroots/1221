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
  /** FIXTURE: what a screen's first useStates start at, in place of their own initial values (Move Money's From). */
  states: [] as unknown[],
}));

vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((initial: unknown) => {
    const [value, set] = real.useState(initial);
    return h.states.length ? [h.states.shift(), set] : [value, set];
  }) as typeof real.useState;
  return { ...real, default: { ...real, useState }, useState };
});

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
const { BankSecurity } = await import('@/ui/bank/BankSecurity');
const { BankLending } = await import('@/ui/bank/BankLending');
const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');

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

describe('the Accounts and Cards tabs’ term and card words', () => {
  it('a French debit card’s spending limit is labelled an estimate in a sentence, not a fragment', () => {
    const sim = quickSave({ homeRegionId: 'fr-idf-paris', startLocationId: 'fr-idf-paris', livesWhereBorn: true, wealth: 'comfortable', bankId: 'fr-bnp-paribas' }, 'ed15-ceiling');
    const words = drawn(sim, BankSecurity, 'fr-bnp-paribas');
    expect(words).toMatch(/It pays up to €[\d,.]+ (a calendar month|over any 30 days)\./);
    expect(words).toContain('The limit shown is the lowest the bank sets, which is estimated.');
  });

  it('a TD term deposit, paid out at its end, says it goes into the checking account', () => {
    const sim = quickSave({ homeRegionId: 'ca-on-toronto', startLocationId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'comfortable', bankId: 'ca-td' }, 'ed15-term-end');
    h.sim = sim;
    const words = onScreen(renderToStaticMarkup(createElement(BankLending, { bank: bankById('ca-td')!, show: ['term'] })));
    expect(words).toMatch(/At its end it is paid, with its interest, into your checking account, unless you choose another way the bank allows\./);
  });
});

describe('m1, on the Accounts tab: Move Money’s hint gives the month’s allowance to the cent', () => {
  it('Deutsche Bank savings with €1,999.50 of the month’s €2,000 left says €1,999.50 under Move Money, not €2,000', () => {
    const sim = quickSave({ homeRegionId: 'de-be-berlin', startLocationId: 'de-be-berlin', livesWhereBorn: true, wealth: 'comfortable', bankId: 'de-deutsche-bank' }, 'ed15-m1-hint');
    const mine = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.closedAt && a.bankId === 'de-deutsche-bank' && a.category !== 'term');
    const saver = mine.find((a) => a.kind === 'savings')!;
    const current = mine.find((a) => a.kind === 'checking')!;
    expect(sim.execute({ kind: 'bank.transfer', payload: { fromId: saver.id, toId: current.id, amount: 50 } }).ok).toBe(true);
    // Move Money's From set to the savings, as the player chooses it.
    h.states = [saver.id];
    h.sim = sim;
    const words = onScreen(renderToStaticMarkup(createElement(BankWorkspace)));
    h.states = [];
    // Until brief 15 the hint was written in whole euros, €2,000, which Move It then refused.
    expect(words).toContain('You can take out €1,999.50 more this month without notice.');
  });
});

describe('a card’s published plans and rewards, in English, with the bank’s own names kept', () => {
  it('MUFG’s plans and Global Point read as sentences, the Japanese names beside them, every figure kept', () => {
    const sim = quickSave({ homeRegionId: 'jp-13-tokyo', startLocationId: 'jp-13-tokyo', livesWhereBorn: true, wealth: 'comfortable', bankId: 'jp-mufg' }, 'ed15-mufg-plans');
    expect(cardsOf(sim, sim.player).map((c) => c.bankId)).toContain('jp-mufg');
    const words = drawn(sim, BankCardOffers, 'jp-mufg');
    // Until brief 15: "分割払い 3-24回 at 14.75-18.00%/yr (3回 ¥2.46, 12回 ¥9.84 per ¥100); 2回 free; リボ 18.00%/yr".
    expect(words).toContain('The bank’s published plans: installments (分割払い) over 3 to 24 payments at 14.75% to 18.00% a year (¥2.46 per ¥100 over 3 payments, ¥9.84 over 12), and 2 payments free; revolving payments (リボ) at 18.00% a year.');
    expect(words).toContain('Its published rewards: Global Point: 1 point for each ¥1,000 spent in a month, worth up to ¥5; up to 20% back at participating partner stores, with conditions, among them paying from an MUFG Bank account.');
  });
});
