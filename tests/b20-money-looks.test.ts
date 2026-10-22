/**
 * Brief 20's money area, M1: the money looks are presentation, and their purpose is to say the truth about what play left
 * behind. After a played half-term (Capital One, the day's groceries on its card, autopay on the minimum so the card
 * carries and is charged interest), each look opened as the player opens it says what the ledger holds, worked here from
 * the accounts themselves: Net Worth the whole and its parts (`netWorth`), Owed what the card owes, each account its
 * balance and, for the card, what's free of its limit, the bank what's held and owed there, a statement line what it did,
 * and the currency the money of the place.
 *
 * PLAYER JOURNEY: a new life as creation makes one (`newLifeConfig`), Ada Cole, born in New York, a US citizen, an actor
 * at Yale in New Haven from Monday 24 August 2026 at 7:30 AM, with the wealthy family's money, at Capital One. Nothing is
 * set by hand. Seed: b20-money-looks.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import { formatMoney } from '@/engine/core/money';
import { netWorth } from '@/engine/systems/finance';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as lookAt } from '@/ui/looks/subject';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 12) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const usd = (cents: number) => formatMoney(cents, 'USD');
const whole = (cents: number) => formatMoney(cents, 'USD', { cents: false });

describe('the money looks after a played half-term', () => {
  it('say what the ledger holds: worth and its parts, what’s owed, each account, the bank, a statement line and the money', () => {
    const sim = createSave(1, 'b20-money-looks', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-capital-one' });
    expect(sim.execute({ kind: 'bank.set_payments', payload: { everyday: 'credit' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'finance.set_autopay', payload: { mode: 'minimum' } }).ok).toBe(true);
    sim.advanceTo(at(2026, 12, 22));
    const look = (kind: string, id: string) => resolveLook(sim, lookAt(kind as never, id)) as Looked;
    const mine = Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt);
    const checking = mine.find((a) => a.kind === 'checking')!;
    const savings = mine.find((a) => a.kind === 'savings')!;
    const card = mine.find((a) => a.kind === 'credit_card')!;
    const owed = -card.balance;
    expect(owed).toBeGreaterThan(0);

    // Net worth: the accounts summed here, the bank's and the card's, and netWorth's own figure the same.
    const inBank = checking.balance + savings.balance;
    const worth = netWorth(sim, sim.player.id);
    expect(worth).toMatchObject({ cash: inBank, liabilities: owed, total: inBank - owed });
    expect(look('networth', sim.player.id).summary).toBe(`You’re worth ${whole(inBank - owed)}: ${whole(inBank)} in the bank and ${whole(owed)} owed against it.`);
    // Owed: the card's balance.
    expect(look('debt', sim.player.id).summary).toBe(`You owe ${usd(owed)}, all of it on the ${card.name}.`);
    // Each account its balance, and the card what's free of its limit.
    expect(look('account', checking.id).summary).toBe(`You have ${usd(checking.balance)} in it at Capital One. It’s your primary account, so the day’s spending comes out of it.`);
    expect(look('account', savings.id).summary).toContain(`You have ${whole(savings.balance)} in it at Capital One.`);
    expect(look('account', card.id).summary).toBe(`You owe ${usd(owed)} on it at Capital One, which leaves ${usd(card.creditLimit! - owed)} of its ${usd(card.creditLimit!)} limit free to use.`);
    // The bank: what's held and owed there.
    expect(look('bank', 'us-capital-one').summary).toBe(`You have ${whole(inBank)} here and owe it ${usd(owed)}, across 3 accounts.`);
    // A statement line: the card's last interest, what it added.
    const interest = sim.universe.transactions.filter((t) => t.memo === 'Interest' && t.postings.some((p) => p.accountId === card.id)).at(-1)!;
    const added = -interest.postings.find((p) => p.accountId === card.id)!.amount;
    expect(look('transaction', interest.id).summary).toBe(`It added ${usd(added)} to what you owe on ${card.name}, on Sunday, December 20, 2026.`);
    // The money of the place.
    expect(look('currency', 'USD').summary).toBe('The dollar is the money here, written $. Every exchange rate is quoted against it.');
  });
});
