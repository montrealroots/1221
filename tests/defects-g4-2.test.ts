/**
 * Group g4, part 2, found in the connected-journey pass and fixed on 2026-10-12: the day's next commitment, Skip To
 * Event's mark for one in another city, and round-ups, each held to doing what it says.
 *
 * - Standing at a commitment, it's the next one. Home's Calendar panel, the Sleep dialog's next commitment and its
 *   suggestion asked the timeline for one strictly after now, so at a plan the clock had stopped at they said nothing
 *   was coming, and the dialog said the calendar was clear beside its own warning that the sleep went through it.
 * - Skip To Event marked an entry in another city Travel, and its field said no travel was booked. Travel went with
 *   the scope reset of 2026-10-09, and nothing takes the player to another city.
 * - Round-ups go into savings at the current account's bank: they went into the first savings found at any bank.
 * - At Wells Fargo a purchase moves the flat $1 its words say, not the change to the next dollar. At TD and
 *   Landsbankinn, whose amount the customer chooses with no default stated, SLATE rounded up and said it was its
 *   estimate beside their words, until 2026-10-13: the choice is the player's now, and nothing counts until it's made
 *   (`systems/roundups.ts`; `tests/roundups.test.ts` holds every bank to its rule).
 * - Round-ups stayed in the current account where there was no savings at its bank, until 2026-10-13: every bank's
 *   round-ups go into savings the customer holds there, and turning them on without it is refused now.
 *
 * PLAYER JOURNEYS through the commands the screens give, on real saves. A TEST SETUP clears the calendar, funds an
 * account or books an entry in another city, as named where it's done. The bank's panel is rendered as the player has
 * it, through the same stand-ins for the game's context as `tests/defects-g14-1.test.ts`.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Account } from '@/engine/core/ledger';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { CITIES } from '@/engine/content/geography';
import { ROUND_UPS } from '@/engine/content/roundups';
import { bankAccountsOf } from '@/engine/systems/banking';
import { roundUpOf } from '@/engine/systems/roundups';
import { checkingsOf } from '@/engine/systems/lending';
import { spend } from '@/engine/systems/spending';
import { hoursUntilNextCommitment, suggestedSleep } from '@/engine/systems/life';
import { nextCommitment, skipTargets, upcoming } from '@/engine/world/calendar';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

// The screen's kept state, at what it starts at: the store it's kept in has no server snapshot to render from.
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

const { BankAccountLife } = await import('@/ui/bank/BankAccountLife');

/** The bank's Your Accounts Over Time panel as the player sees it, as text. */
function panel(sim: Simulation, bankId: string): string {
  h.sim = sim;
  return renderToStaticMarkup(createElement(BankAccountLife, { bankId })).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

const TIME_CONTROLS = readFileSync(fileURLToPath(new URL('../src/ui/shell/TimeControls.tsx', import.meta.url)), 'utf8');

/** Test setup: nothing on the calendar that wants the player. */
function clearCalendar(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}

describe('standing at a commitment', () => {
  /** A plan of your own three hours off, and the clock run to it, stopping there as the screen's advance does. */
  function atThePlan(seed: string): { sim: Simulation; id: string } {
    const sim = quickSave({}, seed);
    clearCalendar(sim);
    const at = sim.now + 3 * MS_HOUR;
    const id = sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Gym', at, durationMinutes: 60 } }).id;
    sim.advanceTo(at, { stopOnPlayerRequired: true });
    expect(sim.now).toBe(at);
    expect(sim.timeline.get(id)!.status).toBe('pending');
    return { sim, id };
  }

  it('is the next commitment on Home, as the list under it says', () => {
    const { sim, id } = atThePlan('g4-2-stand-home');
    expect(upcoming(sim)[0]!.id).toBe(id);
    expect(nextCommitment(sim)?.id).toBe(id);
    // One later still comes after it.
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Lunch', at: sim.now + 4 * MS_HOUR, durationMinutes: 60 } });
    expect(nextCommitment(sim)?.id).toBe(id);
  });

  it('is what the Sleep dialog counts and suggests for, and the sleep it suggests goes through it, as its warning says', () => {
    const { sim, id } = atThePlan('g4-2-stand-sleep');
    expect(hoursUntilNextCommitment(sim)).toBe(0);
    const suggestion = suggestedSleep(sim);
    expect(suggestion.reason).not.toMatch(/calendar’s clear/);
    expect(suggestion.reason).toBe('It’s time for “Gym”, and you’re standing at it, so any sleep would go through it.');
    const crossed = sim.timeline.between(sim.now, sim.now + suggestion.hours * MS_HOUR).filter((i) => i.requiresPlayer);
    expect(crossed.map((i) => i.id)).toEqual([id]);
    // The dialog's own line for it says it's now, where "in less than a minute" said it hadn't come yet.
    expect(TIME_CONTROLS).toContain('Your next commitment is now, and you’re standing at it.');
  });

  it('is still counted from its hour, a little before it', () => {
    const sim = quickSave({}, 'g4-2-before');
    clearCalendar(sim);
    sim.must({ kind: 'calendar.schedule', payload: { title: 'Gym', at: sim.now + 2 * MS_HOUR, durationMinutes: 60 } });
    expect(hoursUntilNextCommitment(sim)).toBe(2);
    expect(suggestedSleep(sim).reason).toMatch(/^“Gym” is in 2 hours\./);
  });
});

describe('Skip To Event, for an entry in another city', () => {
  it('marks it Elsewhere, says where each is, and promises no travel', () => {
    const sim = quickSave({}, 'g4-2-elsewhere');
    clearCalendar(sim);
    const here = sim.player.currentLocationId;
    const there = CITIES.all().find((c) => c.id !== here && c.name)!.id;
    // TEST SETUP: an entry in another city, as a paper visit booked there before 2026-10-09 is.
    sim.onSchedule('test.elsewhere', () => undefined);
    sim.schedule({ at: sim.now + 2 * MS_DAY, kind: 'test.elsewhere', label: 'A Visit', category: 'personal', priority: 30, requiresPlayer: true, durationMinutes: 60, locationId: there, payload: {} });
    const target = skipTargets(sim).find((t) => t.entry.title === 'A Visit')!;
    expect(target.elsewhere).toBe(true);
    expect('needsTravel' in target).toBe(false);
    expect(target.travelNote).toBe(`You’re in ${CITIES.get(here)!.name} and this is in ${CITIES.get(there)!.name}.`);
    expect(TIME_CONTROLS).toContain('{entry.elsewhere && <span className="chip chip-negative">Elsewhere</span>}');
    expect(TIME_CONTROLS).not.toMatch(/>Travel</);
  });
});

const lifeIn = (cityId: string, bankId: string, seed: string) =>
  quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);
/** Test setup: money into an account, against a test income line. */
const give = (sim: Simulation, account: Account, amount: number) =>
  sim.post({ memo: 'Test', category: 'test', postings: [{ accountId: account.id, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const savingsAt = (sim: Simulation, bankId: string) => bankAccountsOf(sim, sim.player).find((a) => a.kind === 'savings' && a.category !== 'term' && a.bankId === bankId);
const currentAt = (sim: Simulation, bankId: string) => checkingsOf(sim, sim.player).find((a) => a.bankId === bankId);
const roundUpsInto = (sim: Simulation, account: Account) =>
  sim.universe.transactions.filter((t) => t.memo === 'Round-ups' && t.postings.some((q) => q.accountId === account.id && q.amount > 0)).length;

/**
 * A New York life at Citi, with savings there, and a current account opened at Bank of America and made the primary
 * one, with round-ups on and the day paid by debit card: Citi's savings were opened first.
 */
function citiThenBankOfAmerica(seed: string, savingsThere: boolean): { sim: Simulation; citi: Account } {
  const sim = lifeIn('us-ny-newyork', 'us-citi', seed);
  if (!savingsAt(sim, 'us-citi')) sim.must({ kind: 'bank.open_savings', payload: { bankId: 'us-citi' } });
  const citi = savingsAt(sim, 'us-citi')!;
  // Its opening deposit from Citi, and any days the bank takes to decide and the money to arrive.
  const opened = sim.must<{ decidedAt?: number; arrivesAt?: number }>({ kind: 'bank.open_current', payload: { bankId: 'us-bank-of-america', fundFrom: currentAt(sim, 'us-citi')!.id, amount: 100_00 } });
  const ready = Math.max(opened.decidedAt ?? 0, opened.arrivesAt ?? 0);
  if (ready > sim.now) sim.advanceTo(ready + MS_HOUR);
  sim.must({ kind: 'bank.set_primary', payload: { accountId: currentAt(sim, 'us-bank-of-america')!.id } });
  if (savingsThere) sim.must({ kind: 'bank.open_savings', payload: { bankId: 'us-bank-of-america' } });
  give(sim, currentAt(sim, 'us-bank-of-america')!, 1_000_00);
  if (savingsThere) sim.must({ kind: 'bank.set_round_ups', payload: { on: true } });
  sim.must({ kind: 'bank.set_payments', payload: { everyday: 'debit' } });
  return { sim, citi };
}

describe('round-ups', () => {
  it('go into savings at the current account’s bank, not the first savings found at another', () => {
    const { sim, citi } = citiThenBankOfAmerica('g4-2-roundups-own-bank', true);
    const boaSavings = savingsAt(sim, 'us-bank-of-america')!;
    expect(spend(sim, sim.player, 12_34, 'Groceries', 'food')).toBe(true);
    expect(sim.player.roundUps!.pending).toBe(66);
    sim.advanceBy(MS_DAY);
    expect(roundUpsInto(sim, boaSavings)).toBeGreaterThan(0);
    expect(roundUpsInto(sim, citi)).toBe(0);
  });

  // Until 2026-10-13 they could be turned on there and stayed in the current account each night; every bank's round-ups
  // go into savings held at it.
  it('won’t be turned on without savings at the current account’s bank, and stop, what was counted dropped, when it closes', () => {
    const { sim, citi } = citiThenBankOfAmerica('g4-2-roundups-none-there', false);
    expect(sim.execute({ kind: 'bank.set_round_ups', payload: { on: true } }).error).toBe('Round-ups go into savings at Bank of America. Open easy-access savings there first.');
    expect(spend(sim, sim.player, 12_34, 'Groceries', 'food')).toBe(true);
    expect(sim.player.roundUps?.pending ?? 0).toBe(0);
    sim.must({ kind: 'bank.open_savings', payload: { bankId: 'us-bank-of-america' } });
    sim.must({ kind: 'bank.set_round_ups', payload: { on: true } });
    expect(spend(sim, sim.player, 12_34, 'Groceries', 'food')).toBe(true);
    expect(sim.player.roundUps!.pending).toBe(66);
    sim.must({ kind: 'bank.close_savings', payload: { accountId: savingsAt(sim, 'us-bank-of-america')!.id } });
    sim.advanceBy(MS_DAY);
    expect(sim.player.roundUps).toMatchObject({ on: false, pending: 0, last: { notMoved: 66, why: 'there’s no easy-access savings at Bank of America' } });
    expect(roundUpsInto(sim, citi)).toBe(0);
    expect(sim.universe.transactions.some((t) => t.memo === 'Round-ups')).toBe(false);
  });

  it('move Wells Fargo’s flat $1 for each debit card purchase, whole-dollar ones too, as its own words on screen say', () => {
    expect(ROUND_UPS['us-wells-fargo']!.words).toMatch(/^Not a round-up: a flat \$1 for each one-time debit card purchase/);
    const sim = lifeIn('us-ny-newyork', 'us-wells-fargo', 'g4-2-wells-flat');
    give(sim, sim.universe.accounts[sim.player.primaryAccountId!]!, 1_000_00);
    sim.must({ kind: 'bank.set_round_ups', payload: { on: true } });
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'debit' } });
    expect(spend(sim, sim.player, 12_00, 'Groceries', 'food')).toBe(true);
    expect(sim.player.roundUps!.pending).toBe(1_00);
    expect(spend(sim, sim.player, 12_34, 'Groceries', 'food')).toBe(true);
    expect(sim.player.roundUps!.pending).toBe(2_00);
    expect(panel(sim, 'us-wells-fargo')).toContain(ROUND_UPS['us-wells-fargo']!.words.replace(/'/g, '&#x27;'));
  });

  // Until 2026-10-13 TD and Landsbankinn rounded up to the next whole unit as "SLATE's estimate", a default neither bank
  // states: the amount is the player's to choose now, and nothing counts until it's chosen.
  it('won’t start at TD, whose amount and how often are the customer’s with no default, until both are chosen; then each purchase counts the amount', () => {
    const sim = lifeIn('ca-on-toronto', 'ca-td', 'g4-2-td-estimate');
    give(sim, sim.universe.accounts[sim.player.primaryAccountId!]!, 1_000_00);
    if (!savingsAt(sim, 'ca-td')) sim.must({ kind: 'bank.open_savings', payload: { bankId: 'ca-td' } });
    sim.must({ kind: 'bank.set_payments', payload: { everyday: 'debit' } });
    expect(sim.execute({ kind: 'bank.set_round_ups', payload: { on: true } }).error).toBe('Choose the amount each purchase, C$0.50 to C$5.00.');
    expect(sim.execute({ kind: 'bank.set_round_ups', payload: { on: true, amount: 5.01 } }).error).toBe('Choose the amount each purchase, C$0.50 to C$5.00.');
    expect(sim.execute({ kind: 'bank.set_round_ups', payload: { on: true, amount: 1.25 } }).error).toBe('Choose how often it moves: daily, weekly, every two weeks.');
    expect(spend(sim, sim.player, 12_34, 'Groceries', 'food')).toBe(true);
    expect(sim.player.roundUps?.pending ?? 0).toBe(0);
    sim.must({ kind: 'bank.set_round_ups', payload: { on: true, amount: 1.25, every: 'week' } });
    expect(spend(sim, sim.player, 12_34, 'Groceries', 'food')).toBe(true);
    expect(spend(sim, sim.player, 12_00, 'Groceries', 'food')).toBe(true);
    expect(sim.player.roundUps!.pending).toBe(2 * 1_25);
    expect(roundUpOf(12_34)).not.toBe(1_25);
    for (const bankId of ['ca-td', 'is-landsbankinn']) {
      const words = panel(sim, bankId);
      expect(words).toContain(ROUND_UPS[bankId]!.words);
      expect(words).not.toContain('estimate');
    }
  });
});
