/**
 * Which current accounts savings covers, on the How You Pay screen and in `bank.set_payments`, group r3b, from
 * 2026-10-12.
 *
 * A payment draws linked savings at the bank of the current account it comes from (`drawFromBank` in
 * `systems/spending.ts`): the primary for the day's spending, and a loan's repayment account for the loan
 * (`payFromBank` in `systems/lending.ts`), which a change of primary doesn't move. Until group r3b, `linkableSavings`,
 * the screen and the command read the primary account's bank alone, and said the link reached nothing more. With Chase
 * savings, a Citi loan repaid from the Chase current account and Citi made primary, the screen hid the control while it
 * was Off and the bank refused to turn it On, though On paid the loan from Chase savings; left On, the screen said On
 * covered nothing, and a player who believed it and turned it Off couldn't turn it back On. The link covers each current
 * account a payment comes from that has easy-access savings at the same bank, and the screen says which
 * (`linkCovers` in `systems/payments.ts`).
 *
 * Later the same day a card's autopay was brought under the one rule: it comes from the account it's set on, which a
 * change of primary pins where it was, and until then it drew no linked savings from any account but the primary, so on
 * this route the card's autopay from Chase bounced with Chase savings full while the screen said the link covered the
 * Chase current account (the verifier of group r3b played it). It draws at its account's bank now, and the screen names it.
 *
 * PLAYER JOURNEYS: the screen is rendered as the player has it, on a save played through the commands the screens
 * give, and its button is pressed as the player presses it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
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

const LINK = 'Savings Covers The Checking Account';
const NOTHING = 'covers nothing until you open some there';
const LEAD = 'When this is on, a payment your checking account can’t cover is taken from easy-access savings at the same bank, as far as the savings allows.';

/** How You Pay as the player sees it, as text. */
function screen(sim: Simulation): string {
  h.sim = sim;
  h.clicks = [];
  return renderToStaticMarkup(createElement(BankPayments)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}
/** The link's button as the screen just drew it, or nothing where it didn't. */
const linkButton = () => h.clicks.find((c) => c.feature === 'bank.set_payments' && [c.children].flat().join('').startsWith(LINK));
/** Presses the link's button where the screen drew it, and says whether it went. */
function press(sim: Simulation): boolean {
  screen(sim);
  const before = paymentsOf(sim.player).linkSavings;
  expect(linkButton(), 'the screen draws the link').toBeDefined();
  linkButton()!.onClick!();
  return paymentsOf(sim.player).linkSavings !== before;
}
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
/** FIXTURE: a month's wages paid into an account, as a job pays them, which the bank lends against. */
const wages = (sim: Simulation, id: string, amount: number) => sim.post({ memo: 'Wages', category: 'salary', postings: [{ accountId: id, amount }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -amount }] });
/** The life's card, whose autopay a new life sets on its primary account. */
const cardOf = (sim: Simulation): Account => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card' && !a.closedAt)!;
const savingsAt = (sim: Simulation, bankId: string) => Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && !a.closedAt && a.kind === 'savings' && a.category !== 'term' && a.bankId === bankId);

interface Route { sim: Simulation; chase: Account; citi: Account; chaseSavings: Account; loan: Account }

/**
 * The probe's route: a New York life at Chase, with Chase's savings as a new life opens it; a current account at
 * Citi; a month's wages into Chase (the FIXTURE); a Citi loan paid into Citi and repaid from the Chase current account;
 * and Citi made primary. `linkFirst` turns
 * the link On from the screen before any of it, while Chase is primary.
 */
function citiLoanRepaidFromChase(seed: string, linkFirst: boolean): Route {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', wealth: 'comfortable', bankId: 'us-chase' }, seed);
  const chase = sim.universe.accounts[sim.player.primaryAccountId!]!;
  const chaseSavings = savingsAt(sim, 'us-chase')!;
  expect(chaseSavings).toBeDefined();
  if (linkFirst) expect(press(sim)).toBe(true);
  const citi = sim.universe.accounts[run<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'us-citi' }).accountId]!;
  wages(sim, chase.id, 5_000_00);
  const { loanId } = run<{ loanId: string }>(sim, 'bank.borrow', { amount: 3_000_00, months: 24, bankId: 'us-citi', intoId: citi.id, repayFromId: chase.id });
  run(sim, 'bank.set_primary', { accountId: citi.id });
  expect(savingsAt(sim, 'us-citi')).toBeUndefined();
  return { sim, chase, citi, chaseSavings, loan: sim.universe.accounts[loanId]! };
}

describe('PLAYER JOURNEY: a Citi loan repaid from Chase, with Citi made primary and the link Off', () => {
  it('offers the link, says what it covers, turns it On, and On pays the loan from Chase savings', () => {
    const { sim, chase, citi, chaseSavings, loan } = citiLoanRepaidFromChase('r3b-link-off', false);
    // Until group r3b: undefined, since the primary's bank, Citi, has no savings.
    expect(linkableSavings(sim, sim.player)?.id).toBe(chaseSavings.id);
    const text = screen(sim);
    // Until group r3b the control wasn't drawn here, Off.
    expect(text).toContain(`${LINK}: Off`);
    expect(text).toContain(LEAD);
    const card = cardOf(sim);
    // The card's autopay stays on Chase, where a change of primary pins it: Chase savings covers it and the loan.
    expect(text).toContain(`${chaseSavings.name} covers ${chase.name}, which pays the ${card.name}’s autopay and the ${loan.name}.`);
    expect(text).toContain(`${citi.name}, which pays the day’s spending, has no easy-access savings at ${citi.institution} to cover it.`);
    expect(text).not.toContain(NOTHING);
    // The Chase current account down to $100, the rest moved into Chase savings, as Move Money moves it.
    run(sim, 'bank.transfer', { fromId: chase.id, toId: chaseSavings.id, amount: chase.balance - 100_00 });
    // Off, paying the loan off is refused: the Chase current account can't, and savings isn't linked.
    expect(sim.execute({ kind: 'bank.repay_loan', payload: { loanId: loan.id } }).error).toMatch(new RegExp(`^${chase.name} can’t cover the \\$[\\d,]+\\.\\d\\d it takes to pay it off, so nothing was paid\\.$`));
    // Until group r3b pressing it got “There’s no savings account at Citi to cover the current account.”
    expect(press(sim)).toBe(true);
    expect(paymentsOf(sim.player).linkSavings).toBe(true);
    expect(screen(sim)).toContain(`${LINK}: On`);
    // On, as the screen says: the loan is paid off, and what the Chase current account couldn't pay came from Chase savings.
    const saved = chaseSavings.balance;
    const { paid } = run<{ paid: number }>(sim, 'bank.repay_loan', { loanId: loan.id });
    expect(paid).toBeGreaterThan(100_00);
    expect(chase.balance).toBe(0);
    expect(saved - chaseSavings.balance).toBeGreaterThanOrEqual(paid - 100_00);
    expect(loan.closedAt).toBeDefined();
  });
});

describe('PLAYER JOURNEY: a card’s autopay left on Chase when Citi is made primary, the link On', () => {
  it('is paid from Chase savings when the Chase current account can’t, where until later on 2026-10-12 it bounced', () => {
    const { sim, chase, chaseSavings } = citiLoanRepaidFromChase('r3b-autopay', true);
    const card = cardOf(sim);
    run(sim, 'finance.set_autopay', { mode: 'full' });
    // The verifier's route: $400 on the card, the Chase current account emptied into Chase savings, the due dates passed.
    sim.post({ memo: 'A purchase', category: 'shopping', postings: [{ accountId: card.id, amount: -400_00 }, { accountId: sim.nominalAccount('expense', 'Shopping').id, amount: 400_00 }] });
    run(sim, 'bank.transfer', { fromId: chase.id, toId: chaseSavings.id, amount: chase.balance });
    const saved = chaseSavings.balance;
    sim.advanceTo(sim.now + 75 * 24 * 3_600_000);
    const bounced = sim.universe.notifications.filter((n) => /Card Payment Bounced/.test(n.title ?? ''));
    expect(bounced.map((n) => n.title)).toEqual([]);
    expect(chaseSavings.balance).toBeLessThan(saved);
    expect(card.closedAt).toBeUndefined();
  });
});

describe('PLAYER JOURNEY: the link left On when Citi is made primary, with a Citi loan repaid from Chase', () => {
  it('says what On covers, and can be turned Off and back On', () => {
    const { sim, chase, chaseSavings, loan } = citiLoanRepaidFromChase('r3b-link-on', true);
    const text = screen(sim);
    expect(text).toContain(`${LINK}: On`);
    // Until group r3b: “There’s no easy-access savings at Citi for it to draw on, so On covers nothing until there is.”
    expect(text).not.toContain(NOTHING);
    expect(text).toContain(`${chaseSavings.name} covers ${chase.name}, which pays the ${cardOf(sim).name}’s autopay and the ${loan.name}.`);
    expect(press(sim)).toBe(true);
    expect(screen(sim)).toContain(`${LINK}: Off`);
    // Until group r3b the control went once it was Off, and the bank refused to turn it back On.
    expect(press(sim)).toBe(true);
    expect(paymentsOf(sim.player).linkSavings).toBe(true);
  });

  it('covers nothing once the loan is repaid from Citi, and says so', () => {
    const { sim, citi, loan } = citiLoanRepaidFromChase('r3b-link-moved', true);
    run(sim, 'bank.set_loan_repayment', { loanId: loan.id, accountId: citi.id });
    run(sim, 'card.set_autopay_from', { cardId: cardOf(sim).id, accountId: citi.id });
    // Nothing pays from the Chase current account now, the loan nor the card's autopay, so its savings covers nothing.
    expect(linkableSavings(sim, sim.player)).toBeUndefined();
    const text = screen(sim);
    expect(text).toContain(`${LINK}: On`);
    expect(text).toContain(`You don’t have easy-access savings at ${citi.institution}, so turning this on ${NOTHING}.`);
    expect(press(sim)).toBe(true);
    expect(screen(sim)).not.toContain(LINK);
    expect(sim.execute({ kind: 'bank.set_payments', payload: { linkSavings: true } }).error).toBe(`There’s no savings account at ${citi.institution} to cover your checking account.`);
  });

  it('is refused naming both banks once the Chase savings is closed', () => {
    const { sim, chase, citi, chaseSavings } = citiLoanRepaidFromChase('r3b-link-closed', true);
    run(sim, 'bank.close_savings', { accountId: chaseSavings.id });
    expect(linkableSavings(sim, sim.player)).toBeUndefined();
    expect(screen(sim)).toContain(`You don’t have easy-access savings at ${citi.institution} or ${chase.institution}, so turning this on ${NOTHING}.`);
    expect(press(sim)).toBe(true);
    // Until group r3b it named the primary account's bank alone: “There’s no savings account at Citi to cover the current account.”
    expect(sim.execute({ kind: 'bank.set_payments', payload: { linkSavings: true } }).error).toBe(`There’s no savings account at ${citi.institution} or ${chase.institution} to cover the checking accounts your payments come from.`);
  });
});
