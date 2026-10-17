/**
 * Savings Covers The Current Account on the How You Pay screen (`ui/bank/BankPayments.tsx`), group r6, from 2026-10-12.
 *
 * The link covers a payment from a current account with easy-access savings at the same bank (`drawFromBank` in
 * `systems/spending.ts`), and since group g16 `bank.set_payments` refuses to turn it on where it would cover nothing.
 * Until 2026-10-12 the screen offered the control wherever the holder had savings at any bank, so with the only savings
 * at a bank no payment comes from, pressing it got the refusal, and before g16 it turned on and covered nothing. It's
 * offered now only with savings the link draws on (`linkCovers`), or while it's On, so it can be turned Off, and
 * says then that it covers nothing.
 *
 * Until group r3b, later the same day, this said the link reached savings at the primary account's bank only, and the
 * screen and the command read that bank alone. A loan's repayment account at another bank draws linked savings there
 * too (`tests/defects-r3b-1.test.ts`). Here no loan is held, and the card's autopay is moved to Capital One with the
 * primary (`card.set_autopay_from`), so nothing pays from the Chase current account, and Chase's savings covers
 * nothing. (Until later on 2026-10-12 the autopay was left on Chase, where a change of primary pins it, and this said
 * nothing paid from there: the autopay drew no linked savings then, and bounced with Chase savings full.)
 *
 * PLAYER JOURNEYS: the screen is rendered as the player has it, on a save played through the commands the screens
 * give, and its button is pressed as the player presses it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { linkCovers, paymentsOf } from '@/engine/systems/payments';

/** The savings the link draws on for some current account a payment comes from, or nothing (`linkCovers`). */
const linkableSavings = (sim: Simulation, person: Simulation['player']) => linkCovers(sim, person).find((one) => one.savings)?.savings;

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; onClick?: () => void; children: unknown }[],
}));

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

const { BankPayments } = await import('@/ui/bank/BankPayments');

const LINK = 'Savings Covers The Current Account';
const LEAD = 'When this is on, a payment a current account can’t cover is taken from easy-access savings at the same bank, as far as the savings allows.';

/** How You Pay as the player sees it, as text. */
function screen(sim: Simulation): string {
  h.sim = sim;
  h.clicks = [];
  return renderToStaticMarkup(createElement(BankPayments)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}
/** The link's button as the screen just drew it, or nothing where it didn't. */
const linkButton = () => h.clicks.find((c) => c.feature === 'bank.set_payments' && [c.children].flat().join('').startsWith(LINK));
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
const savingsAt = (sim: Simulation, bankId: string) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && !a.closedAt && a.kind === 'savings' && a.category !== 'term' && a.bankId === bankId);

/** Makes an account primary with every card's autopay on it, as a player moves both from the Bank screen. */
function primaryWithAutopay(sim: Simulation, accountId: string): void {
  run(sim, 'bank.set_primary', { accountId });
  for (const card of Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && a.kind === 'credit_card' && !a.closedAt)) run(sim, 'card.set_autopay_from', { cardId: card.id, accountId });
}

/** A New York life at Chase, with Chase's savings as a new life opens it, and a current account at Capital One. */
function chaseAndCapitalOne(seed: string): { sim: Simulation; capitalOne: string } {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'comfortable', bankId: 'us-chase' }, seed);
  expect(savingsAt(sim, 'us-chase')).toBeDefined();
  expect(savingsAt(sim, 'us-capital-one')).toBeUndefined();
  return { sim, capitalOne: run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-capital-one' }).accountId };
}

describe('PLAYER JOURNEY: the link with the only savings at another bank', () => {
  it('isn’t offered Off, where pressing it would be refused, and comes back with savings at the primary bank', () => {
    const { sim, capitalOne } = chaseAndCapitalOne('r6-link-off');
    expect(paymentsOf(sim.player).linkSavings).toBe(false);
    // With Chase primary, Chase's savings is the link's, and the screen offers it.
    expect(screen(sim)).toContain(`${LINK}: Off`);
    expect(linkButton()).toBeDefined();
    // Capital One made primary, the card's autopay with it: the only savings is at Chase, where nothing pays from now, and
    // the bank refuses it.
    primaryWithAutopay(sim, capitalOne);
    expect(linkableSavings(sim, sim.player)).toBeUndefined();
    expect(sim.execute({ kind: 'bank.set_payments', payload: { linkSavings: true } }).ok).toBe(false);
    const text = screen(sim);
    // Until 2026-10-12 the control was here, Off, and pressing it got the refusal.
    expect(text).not.toContain(LINK);
    expect(linkButton()).toBeUndefined();
    // Savings opened at Capital One: offered again, and pressing it turns the link on.
    run(sim, 'bank.open_savings', { bankId: 'us-capital-one' });
    expect(screen(sim)).toContain(`${LINK}: Off`);
    // Until group r3b: “On, a payment the current account can’t make comes from savings”, naming no account.
    expect(screen(sim)).toContain(LEAD);
    const card = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card' && !a.closedAt)!;
    expect(screen(sim)).toContain(`${savingsAt(sim, 'us-capital-one')!.name} covers ${sim.universe.accounts[capitalOne]!.name}, which pays the day’s spending and the ${card.name}’s autopay.`);
    linkButton()!.onClick!();
    expect(paymentsOf(sim.player).linkSavings).toBe(true);
    expect(screen(sim)).toContain(`${LINK}: On`);
  });
});

describe('PLAYER JOURNEY: the link left On when the primary account moves to another bank', () => {
  it('stays offered so it can be turned Off, says it covers nothing, and goes once it’s Off', () => {
    const { sim, capitalOne } = chaseAndCapitalOne('r6-link-on');
    screen(sim);
    linkButton()!.onClick!();
    expect(paymentsOf(sim.player).linkSavings).toBe(true);
    primaryWithAutopay(sim, capitalOne);
    const text = screen(sim);
    expect(text).toContain(`${LINK}: On`);
    expect(text).toContain('There’s no easy-access savings at Capital One, so turning this on covers nothing until there is.');
    expect(text).not.toContain(LEAD);
    linkButton()!.onClick!();
    expect(paymentsOf(sim.player).linkSavings).toBe(false);
    expect(screen(sim)).not.toContain(LINK);
  });
});
