/**
 * The bank screen's savings, at each bank kept (group g14, from 2026-10-12).
 *
 * Since 2026-10-10 the engine opens one savings account at each bank where a current account is kept
 * (`bank.open_savings` with a `bankId`), and charges a savings withdrawal by the rules of the bank that holds it
 * (`savingsDebit`). Until 2026-10-12 the screen did neither: its Open panel looked for a savings account at any bank, so
 * savings at a second bank hid the primary bank's, and it ran the command with no bank, so a second bank's savings
 * couldn't be opened from any screen; and Move Money's withdrawal-fee note read the primary bank's rules, whatever bank
 * the savings being moved from was at.
 *
 * PLAYER JOURNEYS: the screen is rendered as the player has it, on a save played through the commands the screens give,
 * and its Open buttons are pressed as the player presses them. A FIXTURE sets the From choice in Move Money, as choosing
 * it there would; a static render can't choose it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { bankById } from '@/engine/content/banks';
import { bankAccountsOf } from '@/engine/systems/banking';
import { savingsDebit } from '@/engine/systems/accountlife';
import { checkingsOf } from '@/engine/systems/lending';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; onClick?: () => void; children: unknown }[],
  /** FIXTURE: what the screen's first useState starts at, in place of its own initial value (Move Money's From). */
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

// The screen's kept tab, at what it starts at: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back, and would get the original's hooks.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  return { ...real, Gated: (props: Parameters<typeof real.Gated>[0]) => { h.clicks.push({ feature: props.feature, onClick: props.onClick as (() => void) | undefined, children: props.children }); return ce(real.Gated, props); } };
});

const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');

/** The Accounts tab as the player sees it, as text, with Move Money's From set where named. */
function screen(sim: Simulation, from?: string): string {
  h.sim = sim;
  h.clicks = [];
  h.states = from ? [from] : [];
  const html = renderToStaticMarkup(createElement(BankWorkspace));
  h.states = [];
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}
/** The Open buttons the screen just drew, by what they say. */
const openButtons = () => h.clicks.filter((c) => c.feature === 'bank.open_savings').map((c) => ({ says: [c.children].flat().join(''), press: c.onClick! }));
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
const savingsAt = (sim: Simulation, bankId: string) => bankAccountsOf(sim, sim.player).find((a) => a.kind === 'savings' && a.bankId === bankId);
const currentAt = (sim: Simulation, bankId: string) => checkingsOf(sim, sim.player).find((a) => a.bankId === bankId)!;

/** A New York student at Chase, with Chase's savings as a new life opens it, and a current account opened at Capital One. */
function chaseAndCapitalOne(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase' });
  expect(savingsAt(sim, 'us-chase')).toBeDefined();
  run(sim, 'bank.open_current', { bankId: 'us-capital-one' });
  return sim;
}

/** An Auckland life, primary at one bank, with a current account and savings opened at the other and money sent to it. */
function aucklandAt(primary: string, other: string, seed: string): Simulation {
  const sim = quickSave({ startLocationId: 'nz-akl-auckland', homeRegionId: 'nz-akl-auckland', livesWhereBorn: true, bankId: primary, birthYear: 1985 }, seed);
  run(sim, 'bank.open_current', { bankId: other });
  run(sim, 'bank.open_savings', { bankId: other });
  // New Zealand's banks pay at once: it lands as it's sent.
  run(sim, 'bank.transfer', { fromId: currentAt(sim, primary).id, toId: savingsAt(sim, other)!.id, amount: 200_00 });
  expect(savingsAt(sim, other)!.balance).toBe(200_00);
  return sim;
}

describe('PLAYER JOURNEY: Open Savings at each bank kept', () => {
  it('offers the primary bank’s savings while savings is held at another bank, and opens it at the primary bank', () => {
    const sim = chaseAndCapitalOne('g14-open-primary');
    const capitalOne = bankById('us-capital-one')!;
    const chase = bankById('us-chase')!;
    // Chase's closed, Capital One's opened: savings is held, but not at Chase.
    run(sim, 'bank.close_savings', { accountId: savingsAt(sim, 'us-chase')!.id });
    run(sim, 'bank.open_savings', { bankId: 'us-capital-one' });
    expect(savingsAt(sim, 'us-chase')).toBeUndefined();
    expect(savingsAt(sim, 'us-capital-one')).toBeDefined();
    const text = screen(sim);
    // Until 2026-10-12 no Open button showed: savings at Capital One hid it.
    expect(openButtons().map((b) => b.says)).toEqual([`Open A ${chase.savings.name}`]);
    expect(text).toContain(`${chase.name}, not opened`);
    openButtons()[0]!.press();
    expect(savingsAt(sim, 'us-chase')?.name).toBe(chase.savings.name);
    expect(bankAccountsOf(sim, sim.player).filter((a) => a.kind === 'savings' && a.bankId === capitalOne.id)).toHaveLength(1);
    screen(sim);
    expect(openButtons()).toEqual([]);
  });

  it('offers a second bank’s savings beside the primary bank’s, and opens it at that bank', () => {
    const sim = chaseAndCapitalOne('g14-open-second');
    const capitalOne = bankById('us-capital-one')!;
    expect(savingsAt(sim, 'us-capital-one')).toBeUndefined();
    const text = screen(sim);
    // Until 2026-10-12 none showed: Chase's savings hid it, and the one Open button there was ran with no bank, so Chase's.
    expect(openButtons().map((b) => b.says)).toEqual([`Open A ${capitalOne.savings.name}`]);
    expect(text).toContain(`${capitalOne.name}, not opened`);
    openButtons()[0]!.press();
    expect(savingsAt(sim, 'us-capital-one')?.name).toBe(capitalOne.savings.name);
    expect(bankAccountsOf(sim, sim.player).filter((a) => a.kind === 'savings')).toHaveLength(2);
    screen(sim);
    expect(openButtons()).toEqual([]);
  });
});

describe('PLAYER JOURNEY: Move Money’s withdrawal-fee note reads the savings account’s own bank', () => {
  it('says ANZ’s fee is due on ANZ savings when the primary account is at ASB, which charges none, and ANZ charges it', () => {
    const sim = aucklandAt('nz-asb', 'nz-anz', 'g14-fee-anz');
    const anz = savingsAt(sim, 'nz-anz')!;
    // ANZ's one free withdrawal this month, used.
    run(sim, 'bank.transfer', { fromId: anz.id, toId: currentAt(sim, 'nz-anz').id, amount: 10_00 });
    const fee = savingsDebit(sim, anz).fee;
    expect(fee).toBeGreaterThan(0);
    const said = formatMoney(fee, saveCurrency(sim.universe));
    // Until 2026-10-12 the note read ASB's rules, which have no fee, and said nothing.
    expect(screen(sim, anz.id)).toContain(`The month’s free withdrawals are used: this one costs ${said}, from savings beside it.`);
    const before = anz.balance;
    run(sim, 'bank.transfer', { fromId: anz.id, toId: currentAt(sim, 'nz-anz').id, amount: 10_00 });
    expect(sim.universe.accounts[anz.id]!.balance).toBe(before - 10_00 - fee);
  });

  it('says no fee is coming on ASB savings when the primary account is at ANZ, which charges one, and ASB charges none', () => {
    const sim = aucklandAt('nz-anz', 'nz-asb', 'g14-fee-asb');
    const asb = savingsAt(sim, 'nz-asb')!;
    const anz = savingsAt(sim, 'nz-anz')!;
    // Until 2026-10-12 the note read ANZ's rules and said "past the month's free ones each costs the bank's fee" of ASB.
    expect(screen(sim, asb.id)).not.toMatch(/free withdrawals are used|This withdrawal is free/);
    // ANZ's own savings, untouched this month: its free one is still there, and the note says so.
    expect(screen(sim, anz.id)).toContain('This withdrawal is free; past the month’s free ones each costs the bank’s fee.');
    // Two out of ASB savings, and neither is charged.
    const before = asb.balance;
    run(sim, 'bank.transfer', { fromId: asb.id, toId: currentAt(sim, 'nz-asb').id, amount: 10_00 });
    run(sim, 'bank.transfer', { fromId: asb.id, toId: currentAt(sim, 'nz-asb').id, amount: 10_00 });
    expect(sim.universe.accounts[asb.id]!.balance).toBe(before - 20_00);
    expect(screen(sim, asb.id)).not.toMatch(/free withdrawals are used|This withdrawal is free/);
  });
});
