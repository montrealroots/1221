/**
 * An account kept at home on every screen that shows its money: module 7 of 2026-10-16. Each screen is drawn with
 * react-dom/server from a life made as the game makes one (`createSave` on `newLifeConfig`, with Before Yale's fields)
 * and played on the clock: a London-raised F-1 student at HSBC UK, and Parisian ones at BNP Paribas and Barclays'
 * Londoner, for a fee and a closing.
 *
 * Worked by hand from `content/currency.ts` (0.79 pounds, 0.92 euros to the dollar): the Modest family's savings,
 * $6,500, buy £5,135.00 (650,000 × 0.79 = 513,500p), and HSBC UK's opening split keeps £5,581.00, 558,100p, worth
 * 558,100 / 0.79 = 706,455.7, so $7,064.56 (`module-2-3.md`). £100 moved to the current account is 12,658¢ (10,000 /
 * 0.79 = 12,658.2). Every screen says the pounds first and the dollars beside them; Move Money's From list and its quote
 * were module 5's and are tested there.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadPlacesFor, loadSave } from '@/engine';
import { newLifeConfig, withFamily, type NewSaveConfig } from '@/engine/world/bootstrap';
import { addCountryHolidays } from '@/engine/content/holidays';
import { instantFromZoned } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import '@/ui/looks/all';
import { resolveLook } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';

for (const country of ['uk', 'fr']) addCountryHolidays(country, readFileSync(`public/holidays/${country}.tsv`, 'utf8'));

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation, states: [] as unknown[] }));
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  /** TEST SETUP: what each useState starts at, in render order, in place of its own initial value, while any are left. */
  const useState = ((initial: unknown) => {
    const [value] = real.useState(initial);
    return [h.states.length > 0 ? h.states.shift() : value, () => undefined];
  }) as unknown as typeof real.useState;
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
    toast: noop, navigate: noop, standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim), GameProvider: ({ children }: { children: unknown }) => children };
});
const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');
const { BankStatements } = await import('@/ui/bank/BankStatements');
const { Home } = await import('@/ui/screens/Home');

/** A Yale life, as the game makes one, from a modest family, banking at Chase, born 14 June 2002. */
const life = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({
  ...withFamily(newLifeConfig(), 'modest'),
  homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase', ...extra,
});
const london = (bank: string) => life({ priorResidence: { cityId: 'uk-eng-london', fromYear: 2008, fromMonth: 9 }, homeBankId: bank });
const paris = (bank: string) => life({ homeRegionId: 'fr-idf-paris', priorResidence: { cityId: 'fr-idf-paris', fromYear: 2002, fromMonth: 6 }, homeBankId: bank });
const make = async (config: NewSaveConfig) => { const sim = createSave(1, 'screens', config); await loadPlacesFor(sim.universe); return sim; };
const reload = async (sim: Simulation) => { const next = loadSave(deserialise(serialise(sim.universe)) as never); await loadPlacesFor(next.universe); return next; };
const mine = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => !a.nominal && a.ownerId === sim.player.id);
const at = (sim: Simulation, bankId: string, kind: 'checking' | 'savings') => mine(sim).find((a) => a.bankId === bankId && a.kind === kind)!;
const run = (sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
};
const day = (sim: Simulation, month: number, d: number, hour = 10) => instantFromZoned({ year: 2026, month, day: d, hour }, sim.homeZone);
/** What the player reads on a screen: its markup with every tag taken out, and its entities read. */
const onScreen = (sim: Simulation, element: Parameters<typeof renderToStaticMarkup>[0], states: unknown[] = []) => {
  h.sim = sim;
  h.states = [...states];
  return renderToStaticMarkup(element).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
};
const summary = (sim: Simulation, kind: string, id: string) => (resolveLook(sim, subject(kind as never, id)) as { summary: string }).summary;
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title).map((n) => n.body);

/** Every screen that shows the London student's money, as they read it. */
function screens(sim: Simulation) {
  const saver = at(sim, 'gb-hsbc', 'savings');
  const current = at(sim, 'gb-hsbc', 'checking');
  return {
    bank: onScreen(sim, createElement(BankWorkspace)),
    home: onScreen(sim, createElement(Home)),
    saverLook: summary(sim, 'account', saver.id),
    currentLook: summary(sim, 'account', current.id),
    bankLook: summary(sim, 'bank', 'gb-hsbc'),
    // TEST SETUP: the Statements tab's Account and Period, its first two states, as the player chose them.
    statement: onScreen(sim, createElement(BankStatements), [saver.id, 1]),
  };
}

describe('an account kept at home, in its own money on every screen', () => {
  it('shows HSBC UK’s accounts in pounds with the dollars beside, on the bank, Home, the looks and the statement, through a reload', async () => {
    const sim = await make(london('gb-hsbc'));
    const saver = at(sim, 'gb-hsbc', 'savings');
    const current = at(sim, 'gb-hsbc', 'checking');
    expect([saver.held, saver.balance]).toEqual([558_100, 706_456]);
    run(sim, 'bank.transfer', { fromId: saver.id, toId: current.id, amount: 10_000, in: 'GBP' });
    sim.advanceTo(day(sim, 9, 1, 12));
    const interest = sim.universe.transactions.find((t) => t.memo === `Interest: ${saver.name}` && t.postings.some((p) => p.accountId === saver.id))!;
    const paid = interest.postings.find((p) => p.accountId === saver.id)!;
    const s = screens(sim);
    const held = (n: number) => `£${(n / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    // The bank: each account's balance in pounds with its dollars, Held From Abroad, its card's fees, its own rate.
    expect(s.bank).toContain(`HSBC UK ${saver.number}, Held From Abroad`);
    expect(s.bank).toContain(`Balance ${held(saver.held!)} About $${(saver.balance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} at an estimated exchange rate`);
    expect(s.bank).toContain('Balance £100.00 About $126.58 at an estimated exchange rate');
    expect(s.bank).toContain('Its debit card costs 2.75% of each purchase in dollars, and 2.75% and 2% (at least £1.75, at most £5.00) of the cash at another bank’s machine here, with the machine’s own fee.');
    expect(s.bank).toContain('Pays 1.05% a year (1.055% APY).');
    expect(s.bank).toMatch(/at your other banks, £5,\d{3} of it at HSBC UK\./);
    // Home's money line.
    expect(s.home).toContain(`and ${held(saver.held! + current.held!)} at HSBC UK. Worth`);
    // The looks: each account, and the bank.
    expect(s.saverLook).toContain(`You have ${held(saver.held!)} ($`);
    expect(s.currentLook).toContain('You have £100.00 ($126.58) in it at HSBC UK');
    expect(s.bankLook).toContain(`You have ${held(saver.held! + current.held!)} ($`);
    // August's statement, in pounds: the split brought in on the first morning, £100 out, its interest in (139¢ for the
    // seven nights on 693,798¢ at 1.05%, 109.81p, so 110p).
    expect(s.statement).toContain('In GBP, as HSBC UK keeps it, with its value in dollars, at an estimated exchange rate, under each figure.');
    expect(s.statement).toContain('Opening Balance £0.00 $0.00 in dollars Money In £5,582.10 $7,065.95 in dollars Money Out £100.00 $126.58 in dollars');
    expect([paid.amount, paid.native]).toEqual([139, 110]);
    expect(s.statement).toContain('Opening balance: Flexible Saver +£5,581.00 £5,581.00');
    expect(s.statement).toContain(`Interest, After Tax ${held(paid.native!)} $${(paid.amount / 100).toFixed(2)} in dollars`);
    expect(s.statement).toContain(`Closing Balance ${held(saver.held!)}`);
    expect(s.statement).toContain(`+${held(paid.native!)} ${held(saver.held!)}`);
    expect(s.statement).toContain('−£100.00 £5,481.00');
    // A line's look: the pounds it moved, with the dollars.
    const moved = sim.universe.transactions.find((t) => t.memo === `Moved to ${current.name}`)!;
    expect(summary(sim, 'transaction', moved.id)).toContain('took £100.00 ($126.58) out of Flexible Saver');

    // The same after a save and a load. The bank screen is compared by its accounts' panels: its Your Banks panel says
    // the everyday card's autopay after a load and not before, which has nothing to do with a home account.
    const again = screens(await reload(sim));
    expect({ ...again, bank: '' }).toEqual({ ...s, bank: '' });
    const panels = (text: string) => text.slice(text.indexOf('HSBC Bank Account HSBC UK'), text.indexOf('Move Money'));
    expect(panels(again.bank)).toBe(panels(s.bank));
    expect(panels(s.bank)).toContain('Balance £100.00');
  }, 120_000);

  it('tells the alerts and the statement notice in pounds', async () => {
    const sim = await make(london('gb-hsbc'));
    const saver = at(sim, 'gb-hsbc', 'savings');
    const current = at(sim, 'gb-hsbc', 'checking');
    run(sim, 'bank.set_alerts', { statements: true, lowBalance: 50_000 });
    run(sim, 'bank.transfer', { fromId: saver.id, toId: current.id, amount: 10_000, in: 'GBP' });
    sim.advanceTo(day(sim, 9, 1, 12));
    expect(titled(sim, `Statement Ready: ${current.name}`)).toEqual(['£100.00 ($126.58) at the close.']);
    expect(titled(sim, `Low Balance: ${current.name}`)[0]).toBe(`${current.name} at HSBC UK is down to £100.00 ($126.58), under the $500.00 you set.`);
  }, 120_000);

  it('says a bank’s fee for a customer abroad and a closing’s day on the account’s panel', async () => {
    const bnp = await make(paris('fr-bnp-paribas'));
    expect(onScreen(bnp, createElement(BankWorkspace))).toContain('For a customer abroad BNP Paribas charges €15.00 a month.');
    const barclays = await make(london('gb-barclays'));
    expect(onScreen(barclays, createElement(BankWorkspace))).toContain('Barclays closes it on October 23, 2026, and sends what it holds then to Chase Total Checking by its own payment abroad.');
    // An American account says none of it.
    const panel = onScreen(barclays, createElement(BankWorkspace));
    expect(panel.match(/Held From Abroad/g)).toHaveLength(2);
  }, 120_000);
});
