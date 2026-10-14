/**
 * An account kept at home, operated from America: module 4 of 2026-10-16 (`systems/abroad.ts`). Every life here is made
 * as the game makes one (`createSave` on `newLifeConfig`, with Before Yale's fields) and played through its commands and
 * its clock: a London-raised student on an F-1 at HSBC UK, and at Barclays, which closes; a Berliner at Deutsche Bank; a
 * Tokyo-raised student at SMBC; a Parisian at BNP Paribas and at SG; and a US citizen raised in London.
 *
 * What was measured, worked by hand from `content/currency.ts` (0.92 euros, 0.79 pounds, 150 yen to the dollar) and the
 * research's figures (`content/homeaccounts.ts`):
 *
 * - Nothing new at a bank abroad: savings, a term deposit, a loan, an overdraft and a credit card are refused in the
 *   bank's words, wages in Yale's ("Yale pays into an account in America."), and cash paid in. Chase, where they live,
 *   opens savings the same day.
 * - Fees for a customer abroad on the bank's schedule, in its money: SMBC's ¥220 on 31 August, 22,000 sen, 147¢
 *   (22,000 / 150 = 146.67); BNP Paribas' €15 each month, 1,500 cents, 1,630¢; SG's €75 at the quarter's end for one of
 *   26, and none for one of 24; Deutsche Bank's €6.90 a month at its quarterly closing, 1,380 cents for August and
 *   September, 1,500¢ exactly (690 / 0.92 = 750 each).
 * - Tax at source on a non-resident: SMBC's savings, ¥1,059,750 (706,500¢), at 0.40% earn 706,500 × 0.004 / 365 =
 *   7.74¢ a day, 54¢ over the seven nights to 31 August, its pay month; Japan takes 15.315% from a customer abroad,
 *   round(54 × 0.15315) = 8¢, where a resident's 20.315% would be 11¢.
 * - Barclays' notice on the first morning, once, through a reload, and its closing on October 23, 2026 (60 days from
 *   August 24): interest settled, the savings gathered, the whole sent to Chase in two business days of both countries,
 *   Tuesday October 27, less Barclays' 2.75% and Chase's $15.
 * - A home card as the primary: HSBC UK's 2.75% on the day's food, in pence; at another bank's machine here, $100 is
 *   7,900p, 2.75% is 217p and the 2% beside it its £1.75 minimum, 392p, with the machine owner's $3.22.
 */
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { createSave, loadPlacesFor, loadSave } from '@/engine';
import { newLifeConfig, withFamily, type NewSaveConfig } from '@/engine/world/bootstrap';
import { addCountryHolidays } from '@/engine/content/holidays';
import { addHomeTerms, homeTerms, resetHomeTerms } from '@/engine/content/homeaccounts';
import { bankById } from '@/engine/content/banks';
import { breaches } from '@/engine/core/invariants';
import { instantFromZoned, MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { HOME_CLOSES_KIND } from '@/engine/systems/abroad';
import { closeForOverdraft } from '@/engine/systems/lending';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';

for (const country of ['uk', 'de', 'jp', 'fr']) addCountryHolidays(country, readFileSync(`public/holidays/${country}.tsv`, 'utf8'));

/** A Yale life, as the game makes one, from a modest family, banking at Chase, born 14 June 2002. */
const life = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({
  ...withFamily(newLifeConfig(), 'modest'),
  homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase', ...extra,
});
const london = (bank: string, extra: Partial<NewSaveConfig> = {}) => life({ priorResidence: { cityId: 'uk-eng-london', fromYear: 2008, fromMonth: 9 }, homeBankId: bank, ...extra });
const tokyo = (bank: string) => life({ homeRegionId: 'jp-13-tokyo', priorResidence: { cityId: 'jp-13-tokyo', fromYear: 2005, fromMonth: 4 }, homeBankId: bank });
const paris = (bank: string, extra: Partial<NewSaveConfig> = {}) => life({ homeRegionId: 'fr-idf-paris', priorResidence: { cityId: 'fr-idf-paris', fromYear: 2002, fromMonth: 6 }, homeBankId: bank, ...extra });
const berlin = () => life({ homeRegionId: 'de-be-berlin', priorResidence: { cityId: 'de-be-berlin', fromYear: 2002, fromMonth: 6 }, homeBankId: 'de-deutsche-bank' });

const make = async (config: NewSaveConfig, seed = 'abroad') => { const sim = createSave(1, seed, config); await loadPlacesFor(sim.universe); return sim; };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const mine = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => !a.nominal && a.ownerId === sim.player.id);
const at = (sim: Simulation, bankId: string, kind: 'checking' | 'savings') => mine(sim).find((a) => a.bankId === bankId && a.kind === kind)!;
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
const refused = (sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  const answer = sim.execute({ kind, payload });
  expect(answer.ok, kind).toBe(false);
  return String(answer.error);
};
const day = (sim: Simulation, month: number, d: number, hour = 10) => instantFromZoned({ year: 2026, month, day: d, hour }, sim.homeZone);
const postingsOn = (sim: Simulation, account: Account, memo: string) => sim.universe.transactions.filter((t) => t.memo.startsWith(memo)).map((t) => t.postings.find((p) => p.accountId === account.id)!).filter(Boolean);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

afterEach(() => { resetHomeTerms('gb-hsbc'); });

describe('nothing new at a bank abroad', () => {
  it('refuses savings, a term deposit, a loan, an overdraft and cash paid in at HSBC UK in its words, and wages in Yale’s; Chase opens savings', async () => {
    const sim = await make(london('gb-hsbc'));
    const hsbc = at(sim, 'gb-hsbc', 'checking');
    const words = 'HSBC UK opens its accounts for people living in the UK; for a customer abroad it has HSBC Expat, from £75,000.';
    expect(refused(sim, 'bank.open_savings', { bankId: 'gb-hsbc' })).toBe(words);
    expect(refused(sim, 'bank.open_term', { bankId: 'gb-hsbc', amount: 100_000 })).toBe(words);
    expect(refused(sim, 'bank.borrow', { bankId: 'gb-hsbc', amount: 100_000, months: 12 })).toBe(words);
    expect(refused(sim, 'bank.arrange_overdraft', { accountId: hsbc.id, limit: 50_000 })).toBe(words);
    expect(refused(sim, 'bank.redirect_deposits', { accountId: hsbc.id })).toBe('Yale pays into an account in America.');
    run(sim, 'cash.withdraw', { amount: 10_000, from: 'atm' });
    expect(refused(sim, 'cash.deposit', { amount: 5_000, toId: hsbc.id, at: 'counter' })).toBe('HSBC UK takes cash only at its own counters and machines, in its country.');
    // Where they live, the same day: Chase opens savings beside its current account.
    expect(run<{ accountId: string }>(sim, 'bank.open_savings', { bankId: 'us-chase' }).accountId).toBeTruthy();
    // Barclays in its own words.
    const other = await make(london('gb-barclays'));
    expect(refused(other, 'bank.open_savings', { bankId: 'gb-barclays' })).toBe('Barclays keeps accounts only for customers who live in the UK, and opens none for one who doesn’t.');
  });

  it('leaves a home account alone when Chase charges them off, and re-banks them where they live', async () => {
    const sim = await make(london('gb-hsbc'));
    const chase = at(sim, 'us-chase', 'checking');
    const hsbc = at(sim, 'gb-hsbc', 'checking');
    // TEST SETUP: Chase's current account below zero by more than it holds, as sixty days overdrawn would leave it.
    sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: chase.id, amount: -(chase.balance + 50_000) }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: chase.balance + 50_000 }] });
    closeForOverdraft(sim, sim.player, bankById('us-chase')!);
    const primary = sim.universe.accounts[sim.player.primaryAccountId!]!;
    expect(primary.bankId).not.toBe('gb-hsbc');
    expect(bankById(primary.bankId!)!.iso).toBe('US');
    expect(hsbc.closedAt).toBeUndefined();
  });
});

describe('the bank’s fee for a customer abroad, on its schedule, in its own money', () => {
  it('SMBC’s ¥220 at the month’s end; BNP Paribas’ €15 each month; SG’s €75 at the quarter’s end at 26 and none at 24', async () => {
    const japan = await make(tokyo('jp-smbc'));
    japan.advanceTo(day(japan, 9, 1, 6));
    const smbc = at(japan, 'jp-smbc', 'checking');
    expect(postingsOn(japan, smbc, 'Fee for a customer abroad').map((p) => [p.amount, p.native])).toEqual([[-147, -22_000]]);

    const bnp = await make(paris('fr-bnp-paribas'));
    bnp.advanceTo(day(bnp, 10, 1, 6));
    expect(postingsOn(bnp, at(bnp, 'fr-bnp-paribas', 'checking'), 'Fee for a customer abroad').map((p) => [p.amount, p.native])).toEqual([[-1_630, -1_500], [-1_630, -1_500]]);

    const young = await make(paris('fr-societe-generale'));
    young.advanceTo(day(young, 10, 1, 6));
    expect(postingsOn(young, at(young, 'fr-societe-generale', 'checking'), 'Fee for a customer abroad')).toEqual([]);
    const older = await make(paris('fr-societe-generale', { birthYear: 2000 }));
    older.advanceTo(day(older, 10, 1, 6));
    // €75 is 7,500 cents, 8,152¢ (7,500 / 0.92 = 8,152.17), at 30 September and not at 31 August.
    const sg = postingsOn(older, at(older, 'fr-societe-generale', 'checking'), 'Fee for a customer abroad');
    expect(sg.map((p) => [p.amount, p.native])).toEqual([[-8_152, -7_500]]);
  });

  it('charges Deutsche Bank’s €6.90 a month at its quarterly closing in its own figure, and takes no tax from the Flexgeld’s interest', async () => {
    const sim = await make(berlin());
    sim.advanceTo(day(sim, 10, 1, 6));
    const konto = at(sim, 'de-deutsche-bank', 'checking');
    expect(postingsOn(sim, konto, 'Quarterly closing, fees').map((p) => [p.amount, p.native])).toEqual([[-1_500, -1_380]]);
    expect(konto.held).toBe(-1_380);
    const flex = at(sim, 'de-deutsche-bank', 'savings');
    const interest = sim.universe.transactions.filter((t) => t.category === 'interest' && t.postings.some((p) => p.accountId === flex.id));
    expect(interest.length).toBe(1);
    expect(interest[0]!.postings.some((p) => sim.universe.accounts[p.accountId]?.name === 'Tax On Interest')).toBe(false);
  });
});

describe('tax at source on a customer abroad', () => {
  it('takes Japan’s 15.315% from SMBC’s interest on 31 August, not a resident’s 20.315%', async () => {
    const sim = await make(tokyo('jp-smbc'));
    sim.advanceTo(day(sim, 9, 1, 6));
    const savings = at(sim, 'jp-smbc', 'savings');
    const paid = sim.universe.transactions.find((t) => t.category === 'interest' && t.postings.some((p) => p.accountId === savings.id))!;
    const earned = -paid.postings.find((p) => sim.universe.accounts[p.accountId]?.name === 'Interest')!.amount;
    const tax = paid.postings.find((p) => sim.universe.accounts[p.accountId]?.name === 'Tax On Interest')!.amount;
    expect([earned, tax]).toEqual([54, 8]);
    expect(paid.postings.find((p) => p.accountId === savings.id)!.amount).toBe(46);
  });
});

describe('Barclays closes the account of a customer abroad', () => {
  it('says so on the first morning with its date, once through a reload, and closes on it, the money arriving at Chase less its costs', async () => {
    const first = await make(london('gb-barclays'));
    const notice = titled(first, 'Barclays Is Closing Your Account');
    expect(notice).toHaveLength(1);
    expect(notice[0]!.body).toContain('close on October 23, 2026');
    const sim = reload(first);
    await loadPlacesFor(sim.universe);
    expect(titled(sim, 'Barclays Is Closing Your Account')).toHaveLength(1);
    expect(sim.universe.scheduled.filter((i) => i.kind === HOME_CLOSES_KIND)).toHaveLength(1);

    sim.advanceTo(day(sim, 10, 23, 6));
    const current = at(sim, 'gb-barclays', 'checking');
    const saver = at(sim, 'gb-barclays', 'savings');
    const chase = at(sim, 'us-chase', 'checking');
    const before = { held: (saver.held ?? 0) + (current.held ?? 0), accrued: Math.floor(saver.accrued ?? 0) };
    sim.advanceTo(day(sim, 10, 23, 8));
    expect(current.closedAt).toBeDefined();
    expect(saver.closedAt).toBeDefined();
    expect([current.held, current.balance, saver.held, saver.balance]).toEqual([0, 0, 0, 0]);
    // The October interest settled first, then the saver gathered on the current account, then all of it sent.
    const settled = sim.universe.transactions.find((t) => t.memo === 'Interest: Everyday Saver, on closing')!;
    const earnedNative = settled.postings.find((p) => p.accountId === saver.id)!.native!;
    expect(settled.postings.find((p) => p.accountId === saver.id)!.amount).toBe(before.accrued);
    const out = sim.universe.transactions.find((t) => t.memo === 'To Chase: Chase Total Checking, abroad')!;
    const sent = out.postings.find((p) => p.accountId === current.id)!;
    expect(sent.native).toBe(-(before.held + earnedNative));
    const worth = -sent.amount;
    expect(titled(sim, 'Barclays Closed Your Account')[0]!.body).toContain('arriving October 27, 2026');

    sim.advanceTo(day(sim, 10, 27, 18));
    const arrived = sim.universe.transactions.find((t) => t.memo === 'From Barclays Bank Account at Barclays, abroad')!;
    expect(new Date(arrived.at).toISOString()).toBe('2026-10-27T21:00:00.000Z');
    const margin = Math.round(worth * 0.0275);
    expect(arrived.postings.find((p) => p.accountId === chase.id)!.amount).toBe(worth - margin - 1_500);
    expect(arrived.postings.find((p) => sim.universe.accounts[p.accountId]?.name === 'Exchange Margin')!.amount).toBe(margin);
    expect(titled(sim, 'Barclays Closed Your Account')).toHaveLength(1);
    expect(sim.ledger.audit()).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('keeps an F-1’s HSBC UK account past the same day, and schedules nothing', async () => {
    const sim = await make(london('gb-hsbc'));
    sim.advanceTo(day(sim, 10, 24));
    expect(sim.universe.scheduled.some((i) => i.kind === HOME_CLOSES_KIND)).toBe(false);
    expect(mine(sim).filter((a) => a.bankId === 'gb-hsbc').every((a) => !a.closedAt)).toBe(true);
  });

  it('closes a US citizen’s account at a bank that closes a US person’s, and keeps an F-1’s at the same bank', async () => {
    // TEST SETUP: none of the sixty banks publishes closing a US person's account (the research's summary), so HSBC UK is
    // given it here, with Barclays' 60 days.
    addHomeTerms({ ...homeTerms('gb-hsbc')!, usPersons: 'closes', closeNoticeDays: 60 });
    const citizen = await make(london('gb-hsbc', { homeRegionId: 'us-ny-newyork' }));
    const notice = titled(citizen, 'HSBC UK Is Closing Your Account');
    expect(notice).toHaveLength(1);
    expect(notice[0]!.body).toBe('HSBC UK closes an account held by a US citizen. It gives 60 days’ notice, so your accounts there close on October 23, 2026, and what they hold then is sent to Chase Total Checking at Chase by the bank’s own payment abroad.');
    const f1 = await make(london('gb-hsbc'));
    expect(titled(f1, 'HSBC UK Is Closing Your Account')).toEqual([]);
    expect(f1.universe.scheduled.some((i) => i.kind === HOME_CLOSES_KIND)).toBe(false);
  });
});

describe('a card from home, as the everyday card here', () => {
  it('charges HSBC UK’s 2.75% on the day’s food in pence, its cash machine fee abroad, and refuses its own machines and a credit card', async () => {
    const sim = await make(london('gb-hsbc'));
    const current = at(sim, 'gb-hsbc', 'checking');
    const saver = at(sim, 'gb-hsbc', 'savings');
    run(sim, 'bank.transfer', { fromId: saver.id, toId: current.id, amount: 100_000, in: 'GBP' });
    expect(current.held).toBe(100_000);
    run(sim, 'bank.set_primary', { accountId: current.id });
    sim.advanceTo(sim.now + 2 * MS_DAY);
    const food = sim.universe.transactions.filter((t) => t.category === 'food' && t.postings.some((p) => p.accountId === current.id));
    const fees = postingsOn(sim, current, 'Foreign transaction fee');
    expect(food.length).toBeGreaterThan(0);
    expect(fees).toHaveLength(food.length);
    for (const [i, t] of food.entries()) {
      const paid = -t.postings.find((p) => p.accountId === current.id)!.native!;
      expect(-fees[i]!.native!).toBe(Math.round(paid * 0.0275));
    }
    const atm = run<{ fee: number; ownerCharge?: number }>(sim, 'cash.withdraw', { amount: 10_000, from: 'other_atm' });
    expect(atm).toMatchObject({ ownerCharge: 322 });
    expect(postingsOn(sim, current, 'Cash withdrawal fee').at(-1)!.native).toBe(-392);
    expect(refused(sim, 'cash.withdraw', { amount: 10_000, from: 'atm' })).toBe('HSBC UK’s own machines and counters are in its country; here its card works at another bank’s machine.');
    expect(refused(sim, 'card.apply', {})).toBe('HSBC UK opens its accounts for people living in the UK; for a customer abroad it has HSBC Expat, from £75,000.');
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('refuses SMBC’s card as the everyday card here, in its words', async () => {
    const sim = await make(tokyo('jp-smbc'));
    expect(refused(sim, 'bank.set_primary', { accountId: at(sim, 'jp-smbc', 'checking').id })).toBe('SMBC’s Global Service has its customers cancel the debit card before they leave Japan.');
  });
});
