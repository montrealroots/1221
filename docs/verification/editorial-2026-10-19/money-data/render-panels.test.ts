/**
 * Brief 15, money-data: each bank's money panels drawn as a player at that bank has them (react-dom/server, as
 * tests/language-data-dates.test.ts draws them), and their words written to `rendered/<panel>.txt`, so the new words of
 * the research data are read on the screen that shows them. A life is made in a city of the bank's country at that bank
 * (`quickSave`), or a New York student (`createSave` with `newLifeConfig`) for a US bank. RENDER names the panels
 * (comma separated) and BANKS the banks (all, or a comma-separated list); both default to all.
 */
import { describe, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { THIRTEEN } from '@/engine/content/banks-thirteen';
import { unclaimedLaw } from '@/engine/systems/accountlife';
import { cardsOf, stateOf } from '@/engine/systems/credit';
const BANKS = THIRTEEN.flatMap((c) => c.banks.map((b) => ({ id: b.id, iso: c.iso })));

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));
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

const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<\/(p|div|li|h\d|tr|summary|details)>/g, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/ +([,.;:])/g, '$1').replace(/\n\s*/g, '\n').trim();

const CITY: Record<string, string> = {
  US: 'us-ny-newyork', CA: 'ca-on-toronto', MX: 'mx-cmx-mexicocity', GB: 'uk-eng-london', IE: 'ie-lei-dublin', IS: 'is-39-reykjavik',
  FR: 'fr-idf-paris', DE: 'de-be-berlin', ES: 'es-md-madrid', JP: 'jp-13-tokyo', KR: 'kr-11-seoul', AU: 'au-nsw-sydney', NZ: 'nz-akl-auckland',
};

const lifeAt = (bankId: string, iso: string): Simulation => iso === 'US'
  ? createSave(1, `md15-${bankId}`, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId })
  : quickSave({ startLocationId: CITY[iso], homeRegionId: CITY[iso], livesWhereBorn: true, wealth: 'comfortable', bankId }, `md15-${bankId}`);

const PANELS: Record<string, () => Promise<FunctionComponent<{ bankId: string }>>> = {
  security: async () => (await import('@/ui/bank/BankSecurity')).BankSecurity as FunctionComponent<{ bankId: string }>,
  accountlife: async () => (await import('@/ui/bank/BankAccountLife')).BankAccountLife as FunctionComponent<{ bankId: string }>,
  statements: async () => (await import('@/ui/bank/BankStatements')).BankStatements as FunctionComponent<{ bankId: string }>,
  cash: async () => (await import('@/ui/bank/BankCash')).BankCash as FunctionComponent<{ bankId: string }>,
  card: async () => (await import('@/ui/bank/BankCard')).BankCard as FunctionComponent<{ bankId: string }>,
};

describe('money-data render', () => {
  it('draws each panel at each bank', async () => {
    const want = (process.env.RENDER ?? Object.keys(PANELS).join(',')).split(',');
    const banks = (process.env.BANKS ?? 'all') === 'all' ? BANKS.filter((b) => CITY[b.iso]) : BANKS.filter((b) => process.env.BANKS!.split(',').includes(b.id));
    const dir = 'docs/verification/editorial-2026-10-19/money-data/rendered';
    mkdirSync(dir, { recursive: true });
    const out: Record<string, string[]> = Object.fromEntries(want.map((p) => [p, []]));
    for (const bank of banks) {
      let sim: Simulation;
      try { sim = lifeAt(bank.id, bank.iso); } catch (e) { for (const p of want) out[p]!.push(`=== ${bank.id}: no life (${(e as Error).message})`); continue; }
      const held = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.universe.playerId && a.kind === 'checking')?.bankId;
      if (want.includes('accountlife')) {
        // TEST SETUP, for Your Accounts Over Time's words only: a term deposit opened through its command, where the bank
        // offers one; the savings marked inactive, and dormant where the bank has a dormancy rule; and money the country
        // took as unclaimed. The words a state draws are what this reads, not how the state is reached.
        sim.execute({ kind: 'bank.open_term', payload: { amount: 100_000, bankId: bank.id } });
        const savings = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.universe.playerId && a.kind === 'savings' && a.bankId === bank.id && a.category !== 'term');
        if (savings) { savings.inactive = true; savings.dormant = true; }
        sim.player.unclaimed = [{ amount: 12_345, to: unclaimedLaw(bank.iso)?.to ?? 'the state', at: sim.now }];
      }
      if (want.includes('card')) {
        // TEST SETUP, for the card's words only: credit a payment freed, held while it clears, as `credit.ts` holds it.
        for (const card of cardsOf(sim, sim.player)) stateOf(sim.player, card).paymentHolds = [{ amount: 5_000, until: sim.now + 3 * 86_400_000 }];
      }
      for (const p of want) {
        h.sim = sim;
        const Panel = await PANELS[p]!();
        let words: string;
        try { words = onScreen(renderToStaticMarkup(createElement(Panel, { bankId: bank.id }))); } catch (e) { words = `(threw: ${(e as Error).message})`; }
        out[p]!.push(`=== ${bank.id} (the life banks at ${held})\n${words}`);
      }
    }
    for (const p of want) writeFileSync(`${dir}/${p}.txt`, out[p]!.join('\n\n') + '\n');
  });
});
