/**
 * Brief 16, sections 7 and 8, the money area: the long explanations put in the order a player needs them (what it means
 * now, what you can do, what it costs or needs, then the full rules), on the Money screens and in How This Works. A
 * paragraph's end is part of what's said here, so the screens are read paragraph by paragraph, and their sentences
 * counted as `tools/voices.ts` and `tools/screen-text.mjs` count them.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { bankById } from '@/engine/content/banks';
import { FRAUD_LAW } from '@/engine/content/security';
import { liabilityFor } from '@/engine/systems/security';
import { cardsOf } from '@/engine/systems/credit';
import { MONEY } from '@/engine/content/guide/money';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** FIXTURE: what a screen's first useStates start at, in place of their own (the bank chosen on Open An Account At Another Bank). */
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

const { BankSecurity } = await import('@/ui/bank/BankSecurity');
const { BankMoves } = await import('@/ui/bank/BankMoves');

const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
const html = (sim: Simulation, component: FunctionComponent<{ bankId: string }>, bankId: string, states: unknown[] = []) => {
  h.sim = sim;
  h.states = [...states];
  return renderToStaticMarkup(createElement(component, { bankId }));
};
/** The paragraphs a player sees: a closed disclosure's inside isn't seen, as `tools/screen-text.mjs` reads a page. */
const seen = (markup: string) => [...markup.replace(/<details[\s\S]*?<\/details>/g, '').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((m) => onScreen(m[1]!));
/** Sentences as `tools/screen-text.mjs` counts them. */
const sentences = (t: string) => t.split(/(?<=[.!?”])\s+(?=[A-Z“"(])/).filter((x) => /[a-z]/i.test(x)).length;

const LIVES: readonly [string, string][] = [
  ['us-ny-newyork', 'us-chase'], ['ca-on-toronto', 'ca-td'], ['mx-cmx-mexicocity', 'mx-bbva'], ['uk-eng-london', 'gb-barclays'],
  ['ie-lei-dublin', 'ie-aib'], ['is-39-reykjavik', 'is-arion'], ['fr-idf-paris', 'fr-bnp-paribas'], ['de-be-berlin', 'de-deutsche-bank'],
  ['es-md-madrid', 'es-santander'], ['jp-13-tokyo', 'jp-mufg'], ['kr-11-seoul', 'kr-kb-kookmin'], ['au-nsw-sydney', 'au-commbank'],
  ['nz-akl-auckland', 'nz-kiwibank'],
];

describe('Your Cards says what to do, and by when, before the law’s words', () => {
  it('PLAYER JOURNEY: a New York student at Chase reads the deadline first, and the law folded under What The Law Says', () => {
    const sim = createSave(1, 'ed16-security', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase' });
    const markup = html(sim, BankSecurity as FunctionComponent<{ bankId: string }>, 'us-chase');
    expect(seen(markup)).toContain('If a debit card payment wasn’t you, press Report It As Not Mine within 2 business days of finding out, and you pay at most $50 of it. Within 60 days of the statement that showed it, you pay at most $500, and after that, you pay all of it. On a credit card, you pay at most $50 of one you report within 60 days of the statement that showed it.');
    // The law's three texts, whole, behind the disclosure, and none of them out of it.
    const law = /<details class="xs dim"><summary>What The Law Says<\/summary>([\s\S]*?)<\/details>/.exec(markup)?.[1] ?? '';
    expect(onScreen(law)).toBe(`The law on the debit card: ${FRAUD_LAW.US!.debitWords} The law on the credit card: ${FRAUD_LAW.US!.creditWords} The law on a payment you report as not yours: ${FRAUD_LAW.US!.refundWords}`);
    expect(seen(markup).filter((p) => p.startsWith('The law on'))).toEqual([]);
  });

  it('in each of the thirteen countries, the first amount it gives is what the game leaves you to pay of a payment reported at once', () => {
    for (const [region, bankId] of LIVES) {
      const sim = quickSave({ homeRegionId: region, startLocationId: region, wealth: 'comfortable', bankId }, `ed16-law-${bankId}`);
      const debit = sim.universe.accounts[sim.player.primaryAccountId!]!;
      const law = FRAUD_LAW[bankById(debit.bankId!)!.iso]!;
      const lead = seen(html(sim, BankSecurity as FunctionComponent<{ bankId: string }>, debit.bankId!)).find((p) => /^(If a (debit )?card payment wasn’t you|No law was found here)/.test(p));
      expect(lead, bankId).toBeDefined();
      expect(sentences(lead!), bankId).toBeLessThanOrEqual(3);
      // A large payment, found and reported the same moment: what the law leaves you to pay of it, as the game charges it.
      const amount = 1_000_000_00;
      const carried = liabilityFor(sim, debit, 'debit', amount, { learnedAt: sim.now, statedAt: sim.now });
      const said = carried === amount ? /^No law was found here that limits what you pay of a (debit )?card payment that wasn’t you\./
        : new RegExp(`^If a (debit )?card payment wasn’t you, press Report It As Not Mine.*?, and you pay ${carried === 0 ? 'nothing' : `at most ${formatMoney(carried, saveCurrency(sim.universe), { cents: carried % 100 !== 0 }).replace(/[$.]/g, '\\$&')}`} of it\\.`);
      expect(lead, bankId).toMatch(said);
      // "a card payment" only where a credit card is charged as the debit card is (`liabilityFor`): no limit of its own, or the same one.
      const card = cardsOf(sim, sim.player)[0];
      const credit = card ? liabilityFor(sim, card, 'credit', amount, { learnedAt: sim.now, statedAt: sim.now }) : undefined;
      expect(lead!.startsWith('If a card payment'), bankId).toBe(credit !== undefined && credit === carried && (law.creditMax === undefined || law.debitTiers.every((t) => t.withinDays === undefined)));
    }
  }, 300_000);

  it('a tier changed changes the sentence with what the game charges (TEST SETUP: the US’s first limit at $75)', () => {
    const sim = createSave(1, 'ed16-tier', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase' });
    const first = FRAUD_LAW.US!.debitTiers[0] as { max?: number };
    const was = first.max;
    first.max = 75_00;
    try {
      const debit = sim.universe.accounts[sim.player.primaryAccountId!]!;
      expect(liabilityFor(sim, debit, 'debit', 1_000_00, { learnedAt: sim.now, statedAt: sim.now })).toBe(75_00);
      expect(seen(html(sim, BankSecurity as FunctionComponent<{ bankId: string }>, 'us-chase')).join(' ')).toContain('within 2 business days of finding out, and you pay at most $75 of it.');
    } finally {
      first.max = was;
    }
  });
});

describe('Open An Account At Another Bank says what applying does, then what the account needs, what it costs, and how money it sends moves', () => {
  it('PLAYER JOURNEY: a New York student at Chase reads each bank’s terms in short paragraphs, in that order', () => {
    const sim = createSave(1, 'ed16-moves', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase' });
    const shown = (bankId: string) => {
      const all = seen(html(sim, BankMoves as unknown as FunctionComponent<{ bankId: string }>, 'us-chase', [bankId]));
      const from = all.findIndex((p) => /^(Without a Social Security number|It decides an application|It opens the account)/.test(p));
      return all.slice(from, from + 4);
    };
    const boa = shown('us-bank-of-america');
    expect(boa[0]).toMatch(/^(Without a Social Security number, you apply in person at a branch with your passport and I-20, which takes an hour\. )?It decides an application within 2 business days, the longest it says it takes\. The debit card works from the day the account opens, as a digital card in the app\.$/);
    expect(boa[1]).toBe('It asks for an opening deposit of $100, sent from another of your accounts as you apply.');
    expect(boa[2]).toMatch(/^Its Advantage Plus Banking costs \$12\.00 a month, waived /);
    expect(boa[3]).toBe('Money it sends to another bank takes 3 business days.');
    // Capital One's account needs money paid in to count as open, and closes without it.
    const capitalOne = shown('us-capital-one');
    expect(capitalOne[1]).toBe('It doesn’t ask for an opening deposit. The account only counts as open once money is paid in. If nothing is paid in within 60 days of opening, the bank closes it.');
    for (const bankId of ['us-bank-of-america', 'us-wells-fargo', 'us-citi', 'us-capital-one']) {
      for (const p of shown(bankId)) expect(sentences(p), `${bankId}: ${p}`).toBeLessThanOrEqual(3);
    }
  });
});

describe('How This Works on money keeps each explanation short', () => {
  /** Sentences as `tools/voices.ts --guide` counts them. */
  const counted = (s: string) => s.split(/(?<=[.!?])\s+(?=[A-Z“])/).map((x) => x.trim()).filter(Boolean).length;
  const FIELDS = ['short', 'steps', 'needs', 'now', 'later', 'interpret', 'unavailable', 'mistakes', 'next'] as const;

  it('has no string of five sentences or more, and no "That happens" with nothing before it to say what (from 2026-10-20, brief 16)', () => {
    const long: string[] = [];
    const vague: string[] = [];
    for (const e of MONEY) for (const f of FIELDS) {
      const v = (e as unknown as Record<string, string | readonly string[]>)[f]!;
      for (const [i, t] of (typeof v === 'string' ? [v] : v).entries()) {
        if (counted(t) >= 5) long.push(`${e.id} ${f} ${i + 1}: ${counted(t)}`);
        if (/(?:^|[.:;]\s)(?:It|This|That) (?:happens|does|is done)\b/.test(t)) vague.push(`${e.id} ${f} ${i + 1}`);
      }
    }
    expect(long).toEqual([]);
    expect(vague).toEqual([]);
  });

  it('lists Close It’s refusals one to an item, and Keeping An Account sends Cancel It’s reader there', () => {
    const other = MONEY.find((e) => e.id === 'bank.other-banks')!;
    const closing = other.unavailable.filter((u) => u.startsWith('Close It '));
    expect(closing).toHaveLength(9);
    for (const item of closing) expect(counted(item), item).toBeLessThanOrEqual(3);
    const upkeep = MONEY.find((e) => e.id === 'bank.upkeep')!;
    expect(upkeep.unavailable).toContain('Cancel It on a checking account is refused for the same reasons as Close It, such as an overdraft or money on its way. It’s grayed out, with the reason under it. Each reason is listed under Another Bank.');
    expect(upkeep.related).toContain('bank.other-banks');
  });
});
