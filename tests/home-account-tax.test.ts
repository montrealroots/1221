/**
 * The tax on an account kept at home, and America's reports on it: module 6 of 2026-10-16 (`recordInterest`'s country
 * and tax at source, `figuresFor`'s foreign interest and its credit, `Account.peak`, `foreignAccountsNotice`). Every life
 * is made as the game makes one (`createSave` on `newLifeConfig`, with Before Yale's fields) and played on the clock to
 * the 2026 return on 1 February 2027.
 *
 * Worked by hand from the research (`content/homeaccounts.ts`) and `content/currency.ts` (0.79 pounds, 150 yen):
 *
 * - An F-1 student raised in Tokyo, at SMBC: its interest in 2026 was August's 53¢, paid with SMBC's February and
 *   August (the savings less the ¥7,480 the current account opens with, 701,513¢, 7.69¢ a night for seven), and Japan
 *   took 15.315%, round(8.12) = 8¢. The 1040-NR's income is the work-study and the scholarship, 165,600 + 1,401,400 =
 *   1,567,000¢, without the 53¢ (IRC 862(a)(1), 872(a)); Connecticut's tax is on the same 1,567,000¢. Until the current
 *   account opened with its fees, 54¢. Until 2026-10-16 this was 54¢, 472¢ and 589¢: SMBC's fee overdrew the empty current account, and the
 *   overdraft's set-off settled the savings' interest on 31 October and 31 December as if closing it.
 * - A US citizen raised in London, at HSBC UK: its interest, 141 + 607 + 628 + 608 + 628 + 630 = 2,612¢, is on the
 *   1040, 1,567,000 + 2,612 = 1,569,612¢; Britain took nothing, so nothing is credited. (Until brief 21, 2026-10-22,
 *   HSBC's 1.05% AER ran as the nominal rate, 2,625¢.)
 * - A US citizen raised in Tokyo, wealthy, at SMBC: August's 3,168¢ of interest, Japan's 485¢ taken (until 2026-10-16,
 *   65,204¢ and 9,986¢, the set-off's early payments beside it). With $30,000 of wages beside it (TEST SETUP), income
 *   is 3,000,000 + 165,600 + 3,168 = 3,168,768¢; less the $16,100 deduction 1,558,768¢ taxed, $1,240 at 10% to $12,400
 *   and 12% of the $3,187.68 over it, 382.52, so 162,252¢ before the credit. The credit is the lesser of Japan's 485¢
 *   and the US tax on the interest, 162,252 × 3,168 / 3,168,768 = 162.21, so 162¢. With $250,000 instead, the US tax
 *   on it is past Japan's, and the credit is Japan's 485¢ whole.
 * - FBAR: the comfortable citizen's Flexible Saver at most £36,198.38 in 2026, 3,619,838 / 0.79 = 4,582,073.4, so
 *   $45,820.73 ($45,821.56 until brief 21's AER, above), over $10,000: told once, through a reload. The modest one's £5,601.63 ($7,090.67) isn't. The modest one
 *   who sent $4,000 to HSBC UK and £3,000 back passed $10,000 for some days only, and is told.
 * - Form 8938: the wealthy citizen's savings open ¥7,480 lower, 6,194,897,000 sen, the current account holding it, and
 *   earn the same 3,168¢ (41,299,313¢ at 0.40% for seven nights, 3,168.17), 2,683¢ after Japan's tax, which is ¥4,024.50,
 *   held as the whole ¥4,025 (from 2026-10-16: a yen account holds whole yen); with SMBC's fee taken from the current
 *   account, the savings' most is 6,195,299,500 and the current account's its opening 748,000, each converted to the
 *   cent and added, 41,301,997 + 4,987 = 41,306,984¢, so $413,070 (until the current account opened with its fees,
 *   $413,068). On 31 December, the current account five fees down at 638,000: 41,301,997 + 4,253 = 41,306,250¢,
 *   $413,062.50, so $413,063: over $50,000 at the year's end and $75,000 at any time;
 *   with no return to file, the form isn't due, and with one it is. An F-1 student over all of these is never told.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, loadPlacesFor, loadSave } from '@/engine';
import { newLifeConfig, withFamily, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { addCountryHolidays } from '@/engine/content/holidays';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { yearOf } from '@/engine/systems/earnings';
import { connecticutTax, figuresFor, returnsOf } from '@/engine/systems/taxreturn';
import type { Simulation } from '@/engine/core/simulation';

for (const country of ['uk', 'jp']) addCountryHolidays(country, readFileSync(`public/holidays/${country}.tsv`, 'utf8'));

/** A Yale life, as the game makes one, banking at Chase, born 14 June 2002. */
const life = (family: StartingWealth, extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({
  ...withFamily(newLifeConfig(), family),
  homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase', ...extra,
});
const tokyo = { priorResidence: { cityId: 'jp-13-tokyo', fromYear: 2005, fromMonth: 4 }, homeBankId: 'jp-smbc' };
const london = { priorResidence: { cityId: 'uk-eng-london', fromYear: 2008, fromMonth: 9 }, homeBankId: 'gb-hsbc' };
const american = { homeRegionId: 'us-ny-newyork' };

const make = async (config: NewSaveConfig, seed = 'tax') => { const sim = createSave(1, seed, config); await loadPlacesFor(sim.universe); return sim; };
const reload = async (sim: Simulation) => { const next = loadSave(deserialise(serialise(sim.universe)) as never); await loadPlacesFor(next.universe); return next; };
const mine = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => !a.nominal && a.ownerId === sim.player.id);
const at = (sim: Simulation, bankId: string, kind: 'checking' | 'savings') => mine(sim).find((a) => a.bankId === bankId && a.kind === kind)!;
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
const SEASON = Date.UTC(2027, 1, 2, 17);
const told = (sim: Simulation) => sim.universe.notifications.filter((n) => n.title === 'Your 2026 Accounts Abroad').map((n) => n.body);
/** Each interest payment at a bank: what it earned, and what was taken at source. */
const interestAt = (sim: Simulation, bankId: string) => sim.universe.transactions.filter((t) => t.category === 'interest' && t.postings.some((p) => sim.universe.accounts[p.accountId]?.bankId === bankId)).map((t) => {
  const named = (name: string) => t.postings.find((p) => sim.universe.accounts[p.accountId]?.nominal && sim.universe.accounts[p.accountId]!.name === name)?.amount ?? 0;
  return [-named('Interest'), named('Tax On Interest')];
});
/** TEST SETUP: wages beside the year's interest, so the return has a federal tax for a credit to be measured against. */
const wages = (sim: Simulation, cents: number) => {
  const y = yearOf(sim.player, 2026);
  y.workStudy += cents;
  y.byResidence['us-ct-newhaven'] = (y.byResidence['us-ct-newhaven'] ?? 0) + cents;
};
const FOOTER = 'The game doesn’t file either form for you or charge the penalties for not filing one. It also converts at its own exchange rate, not the Treasury’s rate for the year’s end.';

describe('the interest of an account kept at home, on the return', () => {
  it('leaves an F-1 student’s interest from SMBC off the 1040-NR, and out of Connecticut’s tax, with Japan’s tax recorded', async () => {
    const sim = await make(life('modest', { homeRegionId: 'jp-13-tokyo', ...tokyo }));
    sim.advanceTo(SEASON);
    expect(interestAt(sim, 'jp-smbc')).toEqual([[53, 8]]);
    const y = yearOf(sim.player, 2026);
    expect(y.foreignInterest).toEqual({ JP: { gross: 53, withheld: 8 } });
    const r = returnsOf(sim.player)[2026]!;
    expect(r.figures.form).toBe('1040-NR');
    expect([y.workStudy, y.scholarship, y.acting, y.unemployment]).toEqual([165_600, 1_401_400, 0, 0]);
    expect(r.figures.income).toBe(1_567_000);
    expect(r.figures.foreignCredit).toBe(0);
    expect(r.figures.states).toEqual([{ state: 'us-ct', tax: connecticutTax(1_567_000), credit: 0 }]);
    // Nothing to tell: an F-1 student isn't a US person, and nothing was kept of the account for it.
    expect(told(sim)).toEqual([]);
    expect(mine(sim).some((a) => a.peak)).toBe(false);
  }, 120_000);

  it('puts a US citizen’s interest from HSBC UK on the 1040 and Connecticut’s, with no credit for Britain’s nothing', async () => {
    const sim = await make(life('modest', { ...american, ...london }));
    sim.advanceTo(SEASON);
    // HSBC's 1.05% AER worked from its nominal 1.045% a year, credited monthly (from 2026-10-22, brief 21: until then the
    // 1.05% ran as nominal, 142, 610, 630, 611, 632 and 632, $26.25); each month about 1.04498/1.05 of what it was.
    expect(interestAt(sim, 'gb-hsbc')).toEqual([[141, 0], [607, 0], [628, 0], [608, 0], [628, 0], [630, 0]]);
    const y = yearOf(sim.player, 2026);
    expect(y.foreignInterest).toEqual({ GB: { gross: 2_612, withheld: 0 } });
    const f = figuresFor(sim.player, 2026);
    expect(f.form).toBeUndefined();
    expect(f.income).toBe(1_569_612);
    expect(f.foreignCredit).toBe(0);
    // Connecticut taxes the interest with the rest: its tax on the whole, not on the whole less the interest.
    expect(f.states).toEqual([{ state: 'us-ct', tax: connecticutTax(1_569_612), credit: 0 }]);
    expect(connecticutTax(1_569_612)).toBeGreaterThan(connecticutTax(1_567_000));
  }, 120_000);

  it('credits Japan’s 15.315% to a US citizen up to the US tax on the interest, and whole where that tax is more', async () => {
    const sim = await make(life('wealthy', { ...american, ...tokyo }));
    sim.advanceTo(SEASON - 3 * 86_400_000);
    expect(interestAt(sim, 'jp-smbc')).toEqual([[3_168, 485]]);
    expect(yearOf(sim.player, 2026).foreignInterest).toEqual({ JP: { gross: 3_168, withheld: 485 } });
    const plain = figuresFor(sim.player, 2026);
    expect([plain.income, plain.federal, plain.foreignCredit]).toEqual([168_768, 0, 0]);
    wages(sim, 3_000_000);
    const low = figuresFor(sim.player, 2026);
    expect(low.income).toBe(3_168_768);
    expect(low.foreignCredit).toBe(162);
    expect(low.federal).toBe(162_252 - 162);
    wages(sim, 22_000_000);
    const high = figuresFor(sim.player, 2026);
    expect(high.foreignCredit).toBe(485);
  }, 120_000);
});

describe('FBAR and Form 8938, said once at the return, to a US person', () => {
  it('tells a comfortable citizen of the FBAR once, through a reload before and after, and not a modest one', async () => {
    const sim = await make(life('comfortable', { ...american, ...london }));
    sim.advanceTo(Date.UTC(2027, 0, 20, 12));
    expect(told(sim)).toEqual([]);
    const again = await reload(sim);
    again.advanceTo(SEASON);
    expect(told(again)).toEqual([`Your accounts at banks outside America held $45,820.73 together at most in 2026 (the highest each held at a day’s end, at an estimated exchange rate), over $10,000. So FinCEN Form 114, the FBAR, is due April 15, 2027, extended automatically to October 15, 2027, and is filed online with FinCEN, not with your return. ${FOOTER}`]);
    expect(at(again, 'gb-hsbc', 'savings').peak?.['2026']?.max).toBe(3_619_838);
    const later = await reload(again);
    later.advanceTo(SEASON + 20 * 86_400_000);
    expect(told(later)).toHaveLength(1);

    const modest = await make(life('modest', { ...american, ...london }));
    modest.advanceTo(SEASON);
    expect(at(modest, 'gb-hsbc', 'savings').peak?.['2026']?.max).toBe(560_163);
    expect(told(modest)).toEqual([]);
  }, 180_000);

  it('tells a modest citizen whose accounts there passed $10,000 for some days only, read each night', async () => {
    const sim = await make(life('modest', { ...american, ...london }));
    const chase = at(sim, 'us-chase', 'checking');
    const hsbc = at(sim, 'gb-hsbc', 'checking');
    run(sim, 'bank.transfer', { fromId: chase.id, toId: hsbc.id, amount: 400_000 });
    sim.advanceTo(Date.UTC(2026, 8, 10, 15));
    const arrived = hsbc.held!;
    expect(arrived).toBeGreaterThan(300_000);
    run(sim, 'bank.transfer', { fromId: hsbc.id, toId: chase.id, amount: 300_000, in: 'GBP' });
    sim.advanceTo(SEASON);
    const saver = at(sim, 'gb-hsbc', 'savings');
    expect(hsbc.peak?.['2026']).toEqual({ max: arrived, last: arrived - 300_000 });
    // Together under $10,000 at the year's end, over it at the most each held.
    expect((saver.peak!['2026']!.last + hsbc.peak!['2026']!.last) / 0.79).toBeLessThan(1_000_000);
    expect(told(sim)).toHaveLength(1);
  }, 180_000);

  it('says Form 8938 isn’t due without a return and is with one, for the wealthy; never tells an F-1 student or one never abroad', async () => {
    const none = await make(life('wealthy', { ...american, ...tokyo }));
    none.advanceTo(SEASON);
    expect(returnsOf(none.player)[2026]).toBeUndefined();
    expect(told(none)).toEqual([`Your accounts at banks outside America held $413,070 together at most in 2026 (the highest each held at a day’s end, at an estimated exchange rate), over $10,000. So FinCEN Form 114, the FBAR, is due April 15, 2027, extended automatically to October 15, 2027, and is filed online with FinCEN, not with your return. They held $413,063 on December 31, over Form 8938’s $50,000 at the year’s end, and $413,070 at most, over Form 8938’s $75,000 at any time, but the form goes only with an income tax return, and you have none to file for 2026. ${FOOTER}`]);

    const filing = await make(life('wealthy', { ...american, ...tokyo }));
    filing.advanceTo(SEASON - 3 * 86_400_000);
    wages(filing, 3_000_000);
    filing.advanceTo(SEASON);
    expect(returnsOf(filing.player)[2026]).toBeDefined();
    expect(told(filing)[0]).toContain('over Form 8938’s $75,000 at any time, so Form 8938 goes with your 2026 return.');

    const f1 = await make(life('wealthy', london));
    f1.advanceTo(SEASON);
    expect(told(f1)).toEqual([]);
    const home = await make(life('comfortable', american));
    home.advanceTo(SEASON);
    expect(told(home)).toEqual([]);
    expect(mine(home).some((a) => a.peak)).toBe(false);
  }, 240_000);
});
