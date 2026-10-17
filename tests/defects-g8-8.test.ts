/**
 * Five Papers and taxes defects found by the triage of 2026-10-12, each held here against the engine and the screen that
 * shows it (from 2026-10-12): File It's toast read the whole return's balance, the IRS's and every state's together, and
 * said a refund came back in a fixed 21 days, where the IRS's part could be owed and unpaid, a 1040-NR filed without a
 * Social Security number waits seven weeks more, and a reconsidered substitute pays back at once; an amendment that only
 * moved tax between the IRS and a state read as less tax; the IRS's payments list called another year's refund kept for
 * this one "from an amended return's refund"; two refusals used a straight apostrophe; and the returns' fine print and
 * No Returns Yet gave 15 April alone, the 21 days alone, and 120 days to replace the IRS's substitute, after which it
 * stood, where since 2026-10-10 their own return reconsiders it.
 *
 * The screen is rendered to markup (react-dom/server) over real saves, as tests/defects-g8-2.test.ts renders it:
 * `useGame` stands in for the provider, `run` is the save's own `execute`, a toast is kept for the test to read, and
 * Gated is the real one with its onClick kept so the test can press it. React's `useState(false)` is answered `true`
 * while `h.asking` is set, which opens Amend The Return. PLAYER JOURNEYS play through commands; FIXTURES set a state by
 * hand to reach one rule, and say so.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { RETURN } from '@/engine/content/safetynet';
import { recordWages, yearOf } from '@/engine/systems/earnings';
import { hasSsn, SSN } from '@/engine/systems/taxid';
import { PLAN, SUBSTITUTE, TAX_REFUND_KIND, TAX_SFR_KIND, deadline, nonresidentDeadline, nonresidentFor, owedAll, planRefusal, returnsOf } from '@/engine/systems/taxreturn';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  asking: false,
  toasts: [] as string[],
  clicks: [] as { feature: string; onClick?: () => void }[],
}));

// Amend The Return's explanation and its File The Amendment show after a press (`amending`): answered open while asking.
vi.mock('react', async (orig) => {
  const real = await orig<typeof import('react')>();
  const useState = ((init: unknown) => (h.asking && init === false ? [true, () => undefined] : real.useState(init))) as typeof real.useState;
  return { ...real, useState, default: { ...real, useState } };
});

// Papers' kept tab, at its first (Returns): the store it's kept in has no server snapshot to render from.
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
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  return { ...real, Gated: (props: Parameters<typeof real.Gated>[0]) => { h.clicks.push({ feature: props.feature, onClick: props.onClick as (() => void) | undefined }); return ce(real.Gated, props); } };
});

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const lifeIn = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const international = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
/** Played by somebody who looks after themselves, as tests/leave.test.ts plays one. */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
/** FIXTURE: every account of the player's with money in it emptied, by a posting, so the ledger still balances. */
const empty = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] }); };
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: sim.player.primaryAccountId!, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const moneyIn = (sim: Simulation) => (c: number) => formatMoney(c, saveCurrency(sim.universe));

/** Papers' Returns tab as the player has it: its text with the tags taken out; the Gated buttons it drew are in `h.clicks`. */
function drawn(sim: Simulation, asking = false): string {
  h.sim = sim;
  h.clicks = [];
  h.asking = asking;
  try {
    const html = renderToStaticMarkup(createElement(PapersWorkspace)).replace(/<!-- -->/g, '');
    return html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  } finally {
    h.asking = false;
  }
}
/** Its button pressed, as the player presses it: the toast it said. */
function pressed(sim: Simulation, feature: string, asking = false): string {
  drawn(sim, asking);
  const button = h.clicks.find((c) => c.feature === feature);
  expect(button?.onClick, `${feature} is drawn`).toBeDefined();
  h.toasts = [];
  button!.onClick!();
  expect(h.toasts).toHaveLength(1);
  return h.toasts[0]!;
}

describe('taxes-file-toast-whole-balance: File It says what happened to the IRS’s part and each state’s', () => {
  it('PLAYER JOURNEY: the IRS’s part owed and the bank empty, Connecticut’s a refund: no money “comes back in 21 days”', () => {
    const sim = lifeIn('us-ct-newhaven', 'g88-ct-refund');
    // FIXTURE: a year's pay that Connecticut over-withheld and the IRS withheld nothing from, as the paycheck records it.
    recordWages(sim.player, at(2026, 7, 1), NY, { gross: 30_000_00, withheld: 10_000_00, withheldBy: { 'us-ct': 10_000_00 } });
    play(sim, at(2027, 2, 1, 12));
    const r = returnsOf(sim.player)['2026']!;
    const to = r.figures.owedTo!;
    expect(to.irs).toBeGreaterThan(0);
    expect(to.states['us-ct']).toBeLessThan(0);
    // The whole return's balance is a refund: the old toast read it, and said so.
    expect(r.figures.balance).toBeLessThan(0);
    empty(sim);
    const toast = pressed(sim, 'tax.file');
    // What the engine did: the IRS's part is owed, not paid; Connecticut's refund comes on its own day.
    expect(r.owed).toBeGreaterThan(0);
    expect(r.refundAt).toBeUndefined();
    expect(r.stateDue!['us-ct']!.refundAt).toBeGreaterThan(sim.now);
    expect(toast).not.toMatch(/comes back|21 days/);
    expect(toast).toBe('Filed. Your bank couldn’t pay all of it. What you still owe is under Who It’s Owed To. A state refund comes on that state’s own schedule, under Who It’s Owed To.');
  }, 120_000);

  it('PLAYER JOURNEY: a 1040-NR filed without a Social Security number says the day its refund arrives, seven weeks past the 21 days', () => {
    const sim = international('g88-nra-refund');
    expect(hasSsn(sim.player)).toBe(false);
    // FIXTURE: a year's work-study with more withheld than a 1040-NR taxes, as Yale's payroll records it.
    recordWages(sim.player, at(2026, 10, 1), NY, { gross: 3_000_00, withheld: 600_00, workStudy: true, employer: 'yale-payroll' });
    tended(sim, at(2027, 2, 1, 12));
    const r = returnsOf(sim.player)['2026']!;
    expect(r.figures.form).toBe('1040-NR');
    expect(r.figures.owedTo!.irs).toBeLessThan(0);
    const toast = pressed(sim, 'tax.file');
    // What the engine did: the refund waits the ITIN's weeks too.
    expect(r.refundAt! - r.filedAt!).toBe((RETURN.refundDays + SSN.itinWeeks * 7) * MS_DAY);
    expect(toast).not.toMatch(new RegExp(`in ${RETURN.refundDays} days`));
    expect(toast).toContain(`Your IRS refund of ${moneyIn(sim)(-r.figures.owedTo!.irs)} arrives ${formatDate(r.refundAt!, sim.zone)}.`);
  }, 180_000);

  it('PLAYER JOURNEY: their own return in place of the IRS’s assessed one says what came back now, not in 21 days', () => {
    const sim = lifeIn('us-ny-newyork', 'g88-reconsider');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
    play(sim, at(2027, 2, 1, 12));
    const r = returnsOf(sim.player)['2026']!;
    // FIXTURE: the clock brought to a year past the due date, when the IRS proposes its own, as tests/tax-lifecycle.test.ts brings it.
    sim.universe.scheduled.filter((i) => i.kind === TAX_SFR_KIND).forEach((i) => sim.timeline.cancel(i.id, sim.now));
    sim.schedule({ at: sim.now + MS_HOUR, kind: TAX_SFR_KIND, label: 'The IRS', category: 'system', priority: 20, payload: { personId: sim.player.id, year: r.year, step: 'proposed' } });
    play(sim, sim.now + 2 * MS_HOUR);
    empty(sim);
    play(sim, sim.now + (SUBSTITUTE.answerDays + 2) * MS_DAY);
    expect(r.substitute).toBe(true);
    // FIXTURE: the IRS's figures counted a 1099 twice, $8,000 of tax more than their own return shows.
    const irs = r.figures.owedTo!.irs;
    r.substituteFigures = { ...r.substituteFigures!, balance: r.figures.balance + 8_000_00 };
    r.parts = { ...r.parts!, tax: irs + 8_000_00 };
    r.owed = r.parts.tax + r.parts.penalty + r.parts.interest;
    // A part paid: $2,000 past what their own return says.
    fund(sim, irs + 2_000_00 - Math.min(0, sim.universe.accounts[sim.player.primaryAccountId!]!.balance));
    sim.must({ kind: 'tax.pay', payload: { year: 2026, amount: irs + 2_000_00 } });
    fund(sim, 100_000_00);
    const toast = pressed(sim, 'tax.file');
    expect(r.reconsideredAt).toBe(sim.now);
    expect(sim.universe.transactions.some((t) => t.memo === 'Tax refund, 2026: the IRS’s return replaced by yours' && t.postings[0]!.amount === 2_000_00)).toBe(true);
    expect(toast).not.toMatch(/comes back in/);
    expect(toast).toContain(`refunded the ${moneyIn(sim)(2_000_00)} you’d paid beyond your return’s tax`);
  }, 180_000);

  it('PLAYER JOURNEY: the IRS’s assessment paid in full, New York’s side filed with it and the bank empty: what’s still owed is said', () => {
    const sim = lifeIn('us-ny-newyork', 'g88-reconsider-state');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
    play(sim, at(2027, 2, 1, 12));
    const r = returnsOf(sim.player)['2026']!;
    // FIXTURE: the clock brought to a year past the due date, as above.
    sim.universe.scheduled.filter((i) => i.kind === TAX_SFR_KIND).forEach((i) => sim.timeline.cancel(i.id, sim.now));
    sim.schedule({ at: sim.now + MS_HOUR, kind: TAX_SFR_KIND, label: 'The IRS', category: 'system', priority: 20, payload: { personId: sim.player.id, year: r.year, step: 'proposed' } });
    play(sim, sim.now + 2 * MS_HOUR);
    empty(sim);
    play(sim, sim.now + (SUBSTITUTE.answerDays + 2) * MS_DAY);
    expect(r.substitute).toBe(true);
    // Everything the IRS assessed paid, then nothing left in the bank for New York's side, filed for the first time with theirs.
    fund(sim, 100_000_00);
    sim.must({ kind: 'tax.pay', payload: { year: 2026 } });
    expect(r.owed).toBeUndefined();
    empty(sim);
    const toast = pressed(sim, 'tax.file');
    expect(r.reconsideredAt).toBe(sim.now);
    expect(r.owed ?? 0).toBe(0);
    expect(r.stateDue!['us-ny']!.owed).toBeGreaterThan(0);
    expect(toast).toContain('What you still owe is under Who It’s Owed To.');
  }, 180_000);
});

describe('taxes-amend-zero-change: an amendment that moves tax between the IRS and a state', () => {
  it('PLAYER JOURNEY: says no change in the total, in its toast and on its line, before and after the IRS processes it', () => {
    const sim = lifeIn('us-ct-newhaven', 'g88-amend-split');
    recordWages(sim.player, at(2026, 7, 1), NY, { gross: 30_000_00, withheld: 6_000_00, withheldBy: { 'us-ct': 1_000_00 } });
    play(sim, at(2027, 2, 1, 12));
    fund(sim, 50_000_00);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    // FIXTURE: a corrected W-2 that moves $500 of what was withheld from the IRS's box to Connecticut's.
    const y = yearOf(sim.player, 2026);
    y.withheldBy = { ...y.withheldBy, us: (y.withheldBy?.us ?? 0) - 500_00, 'us-ct': (y.withheldBy?.['us-ct'] ?? 0) + 500_00 };
    const toast = pressed(sim, 'tax.amend', true);
    const r = returnsOf(sim.player)['2026']!;
    const a = r.amended![0]!;
    expect(a.change).toBe(0);
    expect(a.irs).toBe(500_00);
    expect(a.states).toEqual({ 'us-ct': -500_00 });
    const money = moneyIn(sim);
    expect(toast).not.toMatch(/less tax|more tax/);
    expect(toast).toContain(`no change in the total: the IRS’s part up ${money(500_00)}, Connecticut’s down ${money(500_00)}`);
    const line = (text: string) => /Form 1040-X, filed [^:]+: .+?\. (?=The IRS takes|Processed)/.exec(text)?.[0] ?? '';    expect(line(drawn(sim))).not.toMatch(/less tax|more tax/);
    expect(line(drawn(sim))).toContain(`no change in the total: the IRS’s part up ${money(500_00)}, Connecticut’s down ${money(500_00)}`);
    // Processed, the IRS's change is kept as `change`: the line still says the total didn't move.
    play(sim, a.processAt + MS_HOUR);
    expect(a.processedAt).toBeDefined();
    expect(line(drawn(sim))).not.toMatch(/more tax|less tax/);
    expect(line(drawn(sim))).toContain('no change in the total');
  }, 120_000);
});

describe('taxes-refund-offset-label: another year’s refund kept for this one', () => {
  it('PLAYER JOURNEY: reads “from a refund” in the IRS’s list, not “from an amended return’s refund”', () => {
    const sim = lifeIn('us-ny-newyork', 'g88-offset');
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 40_000_00 });
    play(sim, at(2027, 2, 1, 12));
    empty(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const r26 = returnsOf(sim.player)['2026']!;
    expect(r26.owed).toBeGreaterThan(0);
    // FIXTURE: a 2027 return filed with a refund due within the hour, as tests/finance-paths.test.ts sets one.
    returnsOf(sim.player)['2027'] = { year: 2027, due: deadline(2027), figures: { ...r26.figures, balance: -2_000_00, owedTo: { irs: -2_000_00, states: {} } }, filedAt: sim.now, refund: 2_000_00, refundAt: sim.now + MS_HOUR };
    sim.schedule({ at: sim.now + MS_HOUR, kind: TAX_REFUND_KIND, label: 'Tax Refund: 2027', category: 'system', priority: 20, payload: { personId: sim.player.id, year: 2027 } });
    play(sim, sim.now + 2 * MS_HOUR);
    expect(r26.payments!.some((p) => p.how === 'refund offset' && p.amount === 2_000_00)).toBe(true);
    expect(r26.amended).toBeUndefined();
    const text = drawn(sim);
    expect(text).not.toContain('from an amended return’s refund');
    expect(text).toMatch(new RegExp(`${moneyIn(sim)(2_000_00).replace(/[$.]/g, '\\$&')} kept from a refund\\. \\$[\\d,]+\\.\\d\\d went to the tax`));
  }, 120_000);
});

describe('taxes-straight-apostrophes: the refusals beside Apply and Revise The Plan', () => {
  it('say “doesn’t” with the typographic apostrophe', () => {
    const sim = lifeIn('us-ny-newyork', 'g88-apostrophe');
    // FIXTURE: a year's high pay, as a recorded paycheck, so what's owed is past the Simple Payment Plan's limit.
    recordWages(sim.player, at(2026, 5, 1), NY, { gross: 300_000_00 });
    play(sim, at(2027, 2, 1, 12));
    empty(sim);
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    expect(owedAll(sim.player, sim.now)).toBeGreaterThan(PLAN.longMax);
    const no = planRefusal(sim, sim.player, 'long')!;
    expect(no).toContain('the game doesn’t offer');
    expect(no).not.toContain('\'');
    // FIXTURE: a monthly plan in force from before the balance grew past the limit.
    sim.player.taxPlan = { kind: 'long', status: 'active', appliedAt: sim.now, decideAt: sim.now, startedAt: sim.now, directDebit: true, fee: 0, monthly: 1_000_00, covers: 40_000_00, years: [2026], history: [] };
    const revised = sim.execute({ kind: 'tax.revise_plan', payload: {} });
    expect(revised.ok).toBe(false);
    expect(revised.error).toContain('the game doesn’t offer');
    expect(revised.error).not.toContain('\'');
  }, 120_000);
});

describe('taxes-returns-fine-print-stale: the returns’ fine print and No Returns Yet', () => {
  it('No Returns Yet gives a nonresident’s 15 June beside 15 April, and a citizen’s 15 April alone', () => {
    const sim = international('g88-no-returns');
    const thisYear = zonedParts(sim.now, sim.zone).year;
    expect(nonresidentFor(sim.player, thisYear)).toBe(true);
    const text = drawn(sim);
    expect(text).toContain('No Returns Yet');
    expect(text).toContain(formatDate(deadline(thisYear), sim.zone));
    expect(text).toContain(`or ${formatDate(nonresidentDeadline(thisYear, false), sim.zone)} for a 1040-NR with no wages on it`);
    const citizen = lifeIn('us-ny-newyork', 'g88-no-returns-citizen');
    const own = drawn(citizen);
    expect(own).toContain('No Returns Yet');
    expect(own).not.toContain('for a 1040-NR with no wages on it');
  });

  it('the fine print gives the 1040-NR’s June date, the ITIN’s wait, and what the IRS’s substitute comes to after its 120 days', () => {
    const text = drawn(lifeIn('us-ny-newyork', 'g88-fine'));
    expect(text).toContain('A return is due 15 April, or the next business day. A 1040-NR with no wages on it is due 15 June.');
    expect(text).toContain(`A refund comes ${RETURN.refundDays} days after filing, or ${RETURN.refundDays + SSN.itinWeeks * 7} days for a 1040-NR filed without a Social Security number.`);
    expect(text).not.toContain('yours to replace for 120 days');
    expect(text).toContain(`Nothing of it is assessed if your own return arrives within ${SUBSTITUTE.answerDays} days of its notice, and your return replaces it if it comes later`);
    // The comment beside SUBSTITUTE says what it was until 2026-10-10, and what their own return does now.
    const source = readFileSync(join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src/engine/systems/taxreturn.ts'), 'utf8');
    const doc = source.slice(source.lastIndexOf('/**', source.indexOf('export const SUBSTITUTE')), source.indexOf('export const SUBSTITUTE'));
    expect(doc).not.toMatch(/it's theirs to replace with their own until the Notice of Deficiency's 90\s+\*\s+days run out/);
    expect(doc).toMatch(/Until 2026-10-10 an assessed one stood/);
  });
});
