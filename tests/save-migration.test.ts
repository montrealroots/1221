/**
 * Saves written by the code before this pass's changes, opened by the code now (acceptance pass, 2026-10-11). The two
 * fixtures were written by `tools/scenarios.ts` at commit ff837dfa, the main branch before federal and state tax were
 * kept apart and before a first class had productions: genuine older saves, not hand-made ones.
 * - old-tax-plan: a student owing for 2026 on one combined balance (the IRS's and Connecticut's), under an IRS plan
 *   that took Connecticut's tax in, on 18 April 2027.
 * - old-leave: a student back from a first-year leave with the class of 2030, their first class kept without its
 *   productions, on 12 March 2028.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { owedOn, owedAll, FEDERAL_LIEN_KIND, TAX_PLAN_KIND, type TaxReturn } from '@/engine/systems/taxreturn';
import { STATE_LIEN_KIND, STATE_NOTICE_KIND, THREE_YEAR_KIND, stateOwedOn } from '@/engine/systems/statetax';

const raw = (name: string) => gunzipSync(readFileSync(`tests/fixtures/old-${name}-ff837dfa.json.gz`)).toString('utf8');
const open = (text: string) => loadSave(deserialise(text) as never);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

describe('an older save with one combined tax balance', () => {
  it('is divided once to the cent, says so, keeps the IRS plan federal, and goes on collecting each by its own', () => {
    const text = raw('tax-plan');
    const before = JSON.parse(text);
    const player = before.people[before.playerId];
    const old = player.returns['2026'] as TaxReturn;
    expect(old.stateDue).toBeUndefined();
    expect(player.taxPlan.status).toBe('active');
    const at = before.meta.now ?? before.now;
    // What the one balance came to at the save's moment, by the rules it ran on.
    const combined = owedOn(old, at ?? old.accruedAt!);

    let sim = open(text);
    const r = sim.player.returns!['2026']!;
    // Divided, and said so on the return, as an estimate.
    expect(r.split?.how).toMatch(/in proportion to each authority’s share of the return/);
    const ct = r.stateDue!['us-ct']!;
    expect(ct.migrated?.how).toBe(r.split!.how);
    expect(ct.owed).toBeGreaterThan(0);
    // Nothing lost, nothing invented: the IRS's and Connecticut's sum to what the one balance was.
    expect(Math.abs(owedOn(r, sim.now) + stateOwedOn(ct, r.due, sim.now) - combined)).toBeLessThanOrEqual(1);
    // The IRS plan covers federal tax only now, and says what was taken out.
    expect(sim.player.taxPlan!.covers).toBe(owedAll(sim.player, sim.now));
    expect(sim.player.taxPlan!.history.some((h) => /A state’s tax was taken out of the plan/.test(h.what))).toBe(true);
    // Connecticut's own collection begins; the IRS's plan payment is still on the calendar.
    expect(sim.universe.scheduled.some((i) => i.kind === STATE_NOTICE_KIND && i.status === 'pending')).toBe(true);
    expect(sim.universe.scheduled.some((i) => i.kind === TAX_PLAN_KIND && i.status === 'pending')).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);

    // Opened again: the same, nothing divided twice.
    const once = JSON.stringify(sim.player.returns);
    sim = reload(sim);
    expect(JSON.stringify(sim.player.returns)).toBe(once);

    // Played on two months: the plan takes its payments from the IRS's part, Connecticut bills its own.
    const irsBefore = owedOn(sim.player.returns!['2026']!, sim.now);
    sim.advanceTo(sim.now + 62 * MS_DAY);
    const after = sim.player.returns!['2026']!;
    expect(sim.player.taxPlan!.history.filter((h) => h.what === 'A payment').length + sim.player.taxPlan!.history.filter((h) => /missed/.test(h.what)).length).toBeGreaterThan(0);
    expect(owedOn(after, sim.now)).not.toBe(irsBefore);
    expect(after.stateDue!['us-ct']!.collection).toBeGreaterThan(0);
    expect(after.stateDue!['us-ct']!.payments ?? []).not.toContainEqual(expect.objectContaining({ how: 'plan' }));
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);
});

describe('an older save back from a leave', () => {
  it('opens, binds the first class’s ceilings, and plays its later terms’ productions once each, from where it was kept', () => {
    let sim = open(raw('leave'));
    const first = () => sim.player.school!.formerClasses![0]!;
    expect(first().productions ?? []).toHaveLength(0);
    const playedTo = first().playedTo;
    sim = reload(sim);
    // Two terms on: the first class's terms after the save's are played, each production once.
    sim.advanceTo(sim.now + 300 * MS_DAY);
    const prods = first().productions ?? [];
    expect(prods.length).toBeGreaterThan(0);
    const keys = prods.map((p) => `${p.term}|${p.name}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(prods.every((p) => p.term > playedTo)).toBe(true);
    expect(first().playedTo).toBeGreaterThan(playedTo);
    const names = new Set(first().classmates.map((m) => m.name));
    for (const p of prods) for (const c of p.cast) expect(names.has(c.name)).toBe(true);
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);
});

/**
 * Two saves written by main at 086d00ca, before liens, the longer plans and Oregon's three-year penalty were added
 * (remaining-gaps pass, 2026-10-11), by `tools/scenarios.ts` run from that commit:
 * - old-nonfiler: 24 May 2028, the 2026 return unfiled, Connecticut's assessment of it paid by a levy, the IRS's
 *   substitute return due on 13 August;
 * - old-state-plan: 23 February 2028, a Connecticut plan in force with five payments made.
 * Nothing the new rules would have done before the save is done on opening: no lien, no penalty, no letter.
 */
const raw086 = (name: string) => gunzipSync(readFileSync(`tests/fixtures/old-${name}-086d00ca.json.gz`)).toString('utf8');
const lienKinds = [STATE_LIEN_KIND, FEDERAL_LIEN_KIND, THREE_YEAR_KIND];
const taxPostings = (sim: Simulation) => sim.universe.transactions.filter((t) => t.category === 'tax').length;

describe('an older save from before liens', () => {
  it('opens with nothing charged or filed after the fact, opens again the same, and goes on', () => {
    const text = raw086('nonfiler');
    const before = JSON.parse(text);
    const oldCt = before.people[before.playerId].returns['2026'].stateDue['us-ct'];
    let sim = open(text);
    const ct = () => sim.player.returns!['2026']!.stateDue!['us-ct']!;
    expect(ct().balance).toBe(oldCt.balance);
    expect(ct().penalty).toBe(oldCt.penalty);
    expect(ct().lien).toBeUndefined();
    expect(ct().threeYear).toBeUndefined();
    expect(sim.player.returns!['2026']!.lien).toBeUndefined();
    expect(sim.universe.scheduled.filter((i) => i.status === 'pending' && lienKinds.includes(i.kind))).toEqual([]);
    expect(sim.universe.transactions.length).toBe(before.transactions.length);

    const once = JSON.stringify({ returns: sim.player.returns, plans: sim.player.statePlans });
    sim = reload(sim);
    expect(JSON.stringify({ returns: sim.player.returns, plans: sim.player.statePlans })).toBe(once);

    // Played past the IRS's substitute return: assessed, and Connecticut's paid balance files no lien later.
    const taxBefore = taxPostings(sim);
    sim.advanceTo(sim.now + 100 * MS_DAY);
    expect(sim.player.returns!['2026']!.substitute).toBeDefined();
    expect(ct().lien).toBeUndefined();
    expect(taxPostings(sim)).toBeGreaterThanOrEqual(taxBefore);
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);

  it('a state plan in force keeps its terms: no down payment, no long plan, no lien, its payments still taken', () => {
    const text = raw086('state-plan');
    const before = JSON.parse(text);
    const oldPlan = before.people[before.playerId].statePlans['us-ct'];
    let sim = open(text);
    const plan = () => sim.player.statePlans!['us-ct']!;
    expect(plan().status).toBe('active');
    expect(plan().monthly).toBe(oldPlan.monthly);
    expect(plan().down).toBeUndefined();
    expect(plan().long).toBeUndefined();
    sim = reload(sim);
    const paid = plan().history.filter((h) => h.what === 'A payment').length;
    sim.advanceTo(sim.now + 65 * MS_DAY);
    expect(plan().history.filter((h) => h.what === 'A payment' || /missed/i.test(h.what)).length).toBeGreaterThan(paid);
    for (const r of Object.values(sim.player.returns ?? {})) expect(r.stateDue?.['us-ct']?.lien).toBeUndefined();
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);
});
