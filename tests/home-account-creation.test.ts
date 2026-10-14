/**
 * An account kept at home, modules 2 and 3 (2026-10-16): the research's terms (`content/homeaccounts.ts`), the rule
 * that offers or refuses an account (`homeAccountRefusal`, `systems/homeaccount.ts`), and a life made with one, as the
 * game makes it (`createSave` on `newLifeConfig`).
 *
 * The rule's every step is tested in its own words: nothing said, America before Yale, a bank with no research or none
 * SLATE can act on, an account not open before Yale, a bank that never opens a US citizen's, and an offer with what
 * follows. The place of birth never grants an account: born in London with nothing said about where they lived is
 * nothing, and born in London but raised in New York is the second step.
 *
 * The money is worked by hand from `content/currency.ts` (0.92 euros, 0.79 pounds to the dollar) and the family
 * profile (`WEALTH_PROFILE`, written in euros, converted to whole dollars by `wealthIn`). Modest: €4,800 in checking is
 * 480,000 / 0.92 = 521,739.13¢, so $5,217; €6,500 in savings is 706,521.74¢, so $7,065. Kept at Barclays, $7,065 is
 * 706,500 × 0.79 = 558,135p, whole pounds £5,581 (558,100p); bought back, 558,100 / 0.79 = 706,455.70, so 706,456¢; the
 * 44¢ over joins the checking, $5,217.44. Kept at Deutsche Bank, 706,500 × 0.92 = 649,980 euro cents, whole euros €6,499
 * (649,900); back, 649,900 / 0.92 = 706,413.04, so 706,413¢, and $5,217.87 in checking. Each adds to 1,228,200¢.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadPlacesFor, loadSave } from '@/engine';
import { newLifeConfig, withFamily, type NewSaveConfig } from '@/engine/world/bootstrap';
import { homeAccountRefusal, splitOf, whatFollows } from '@/engine/systems/homeaccount';
import { addHomeTerms, allHomeTerms, homeTerms, resetHomeTerms, RESEARCH } from '@/engine/content/homeaccounts';
import { bankById, banksIn } from '@/engine/content/banks';
import { daysOfAccount } from '@/engine/content/bankdays';
import { CITIES } from '@/engine/content/geography';
import { breaches } from '@/engine/core/invariants';
import { MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { ReviewStep, StartingPointStep, validate } from '@/ui/creation/CharacterCreation';

/** A Yale life, as the game makes one, from a modest family, banking at Chase. */
const life = (extra: Partial<NewSaveConfig> = {}): NewSaveConfig => ({
  ...withFamily(newLifeConfig(), 'modest'),
  homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId: 'us-chase', ...extra,
});
/** Raised in London from September 2008. */
const london = (bank: string, extra: Partial<NewSaveConfig> = {}) => life({ priorResidence: { cityId: 'uk-eng-london', fromYear: 2008, fromMonth: 9 }, homeBankId: bank, ...extra });
const accounts = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => !a.nominal && a.ownerId === sim.player.id);
const money = (sim: Simulation) => accounts(sim).filter((a) => a.kind === 'checking' || a.kind === 'savings').reduce((n, a) => n + a.balance, 0);

afterEach(() => { resetHomeTerms('gb-lloyds'); resetHomeTerms('gb-hsbc'); });

describe('the research, as SLATE keeps it', () => {
  it('names a real bank in each entry, in its country, with a source, and maps retention to what the bank does', () => {
    const all = allHomeTerms();
    expect(all).toHaveLength(55);
    for (const t of all) {
      const bank = bankById(t.bankId);
      expect(bank, t.bankId).toBeDefined();
      expect(t.source.length).toBeGreaterThan(10);
      const r = RESEARCH.banks[t.bankId]!;
      expect(t.nonResident).toBe(r.kept === true ? 'keeps' : r.kept === false ? 'closes' : 'conditional');
      // A charge for a customer abroad is in the bank's own money: whole units of it.
      if (t.nonResidentFee) expect(t.nonResidentFee.amount % 100).toBe(0);
      if (t.nonResident === 'conditional' && !t.unusable) expect(t.condition).toBeTruthy();
    }
    expect(homeTerms('gb-barclays')).toMatchObject({ nonResident: 'closes', closeNoticeDays: 60, confidence: 'H' });
    expect(homeTerms('gb-hsbc')).toMatchObject({ nonResident: 'keeps', confidence: 'H' });
    expect(homeTerms('de-deutsche-bank')).toMatchObject({ nonResident: 'conditional', confidence: 'M' });
    expect(homeTerms('fr-bnp-paribas')!.nonResidentFee).toMatchObject({ amount: 15_00, months: 1 });
    expect(homeTerms('ie-ptsb')).toMatchObject({ openFromAge: 18, ageAssumed: false });
    expect(homeTerms('gb-lloyds')).toMatchObject({ openFromAge: 16, ageAssumed: true, confidence: 'L' });
    // The American banks aren't kept from abroad, and a bank in the ~230 other countries has no research.
    expect(homeTerms('us-chase')).toBeUndefined();
    expect(homeTerms(banksIn('IT')[0]!.id)).toBeUndefined();
  });
});

describe('the rule, step by step, in its words', () => {
  it('1: born in London, nothing said about where they lived: none, whatever bank is named', () => {
    expect(homeAccountRefusal(life({ homeBankId: 'gb-hsbc' }), 'gb-hsbc')).toBe('You haven’t said where you lived before Yale.');
  });

  it('2: born in London, raised in New York: none; and born in America, never abroad: none', () => {
    const ny = life({ priorResidence: { cityId: 'us-ny-newyork', fromYear: 2010, fromMonth: 1 } });
    expect(homeAccountRefusal(ny, 'gb-hsbc')).toBe('You lived in America before Yale; your account is the one here.');
    const american = life({ homeRegionId: 'us-ny-newyork' });
    expect(homeAccountRefusal(american, 'gb-hsbc')).toBe('You haven’t said where you lived before Yale.');
    expect(homeAccountRefusal({ ...american, priorResidence: { cityId: 'us-ny-newyork', fromYear: 2002, fromMonth: 6 } }, 'gb-hsbc'))
      .toBe('You lived in America before Yale; your account is the one here.');
  });

  it('3: a bank elsewhere, a bank with no research, and one whose research leaves nothing to keep it on', () => {
    expect(homeAccountRefusal(london('de-deutsche-bank'), 'de-deutsche-bank')).toBe('Deutsche Bank isn’t a bank in United Kingdom.');
    const rome = banksIn('IT')[0]!;
    expect(homeAccountRefusal(life({ priorResidence: { cityId: 'it-laz-rome', fromYear: 2010, fromMonth: 1 } }), rome.id))
      .toBe(`SLATE has no research on what ${rome.name} does when a customer moves to America.`);
    expect(homeAccountRefusal(life({ priorResidence: { cityId: 'jp-13-tokyo', fromYear: 2010, fromMonth: 1 } }), 'jp-japan-post-bank'))
      .toBe('Japan Post Bank asks a customer going abroad to close the account, and keeps one only with someone in Japan acting for them, which SLATE doesn’t have.');
  });

  it('4: an account not open before Yale: moved there after, or too young for the bank', () => {
    expect(homeAccountRefusal(london('gb-hsbc', { priorResidence: { cityId: 'uk-eng-london', fromYear: 2026, fromMonth: 9 } }), 'gb-hsbc'))
      .toBe('You began living there after Yale began.');
    // TEST SETUP: a bank opening from 30, which no researched bank does; born 14 June 2002, 24 at the start.
    addHomeTerms({ ...homeTerms('gb-hsbc')!, openFromAge: 30 });
    expect(homeAccountRefusal(london('gb-hsbc'), 'gb-hsbc')).toBe('HSBC UK opens an account from 30; you left at 24.');
  });

  it('5: a bank that never opens a US citizen’s account refuses one born in America, and not one born in London', () => {
    // TEST SETUP: none of the sixty publishes this (the research's summary), so Lloyds is given it here.
    addHomeTerms({ ...homeTerms('gb-lloyds')!, usPersons: 'refuses' });
    expect(homeAccountRefusal(london('gb-lloyds', { homeRegionId: 'us-ny-newyork' }), 'gb-lloyds')).toBe('Lloyds Bank doesn’t open an account for a US citizen, so you never held one there.');
    expect(homeAccountRefusal(london('gb-lloyds'), 'gb-lloyds')).toBeUndefined();
  });

  it('6: a London-raised student on an F-1 keeps HSBC UK; Barclays is offered with its closing ahead; a conditional bank says its condition and footing', () => {
    expect(homeAccountRefusal(london('gb-hsbc'), 'gb-hsbc')).toBeUndefined();
    expect(whatFollows(london('gb-hsbc'), 'gb-hsbc')).toEqual([
      'HSBC UK keeps it for a customer who lives abroad.',
      'The bank says so in its own words.',
      'SLATE takes it HSBC UK opened accounts from 16: the research read no age.',
    ]);
    // Opened 14 June 2018, at 16, before 28 April 2026: two months, 60 days, from Monday 24 August 2026.
    expect(homeAccountRefusal(london('gb-barclays'), 'gb-barclays')).toBeUndefined();
    expect(whatFollows(london('gb-barclays'), 'gb-barclays')[0]).toBe('Barclays closes an account whose holder lives outside its country: it gives 60 days’ notice, so it closes on October 23, 2026.');
    // Moved there in May 2026, opened then: Britain's 90 days.
    expect(whatFollows(london('gb-barclays', { priorResidence: { cityId: 'uk-eng-london', fromYear: 2026, fromMonth: 5 } }), 'gb-barclays')[0])
      .toBe('Barclays closes an account whose holder lives outside its country: it gives 90 days’ notice, so it closes on November 22, 2026.');
    const berlin = life({ homeRegionId: 'de-be-berlin', priorResidence: { cityId: 'de-be-berlin', fromYear: 2002, fromMonth: 6 }, homeBankId: 'de-deutsche-bank' });
    expect(homeAccountRefusal(berlin, 'de-deutsche-bank')).toBeUndefined();
    expect(whatFollows(berlin, 'de-deutsche-bank').slice(0, 2)).toEqual([
      'Deutsche Bank keeps it, as an AktivKonto at €6.90 a month: its free account for students needs an address in the European Union, and the price list says it then carries on as an AktivKonto.',
      'The bank publishes its price for a customer abroad but no rule on moving: SLATE’s reading of it.',
    ]);
    const paris = life({ homeRegionId: 'fr-idf-paris', priorResidence: { cityId: 'fr-idf-paris', fromYear: 2002, fromMonth: 6 } });
    expect(whatFollows(paris, 'fr-bnp-paribas')).toContain('It charges €15.00 a month for a customer abroad.');
    expect(whatFollows(paris, 'fr-societe-generale')).toContain('It charges €75.00 a quarter for a customer abroad, which it doesn’t charge under 25, as you are.');
    expect(whatFollows(london('gb-lloyds'), 'gb-lloyds')[1]).toBe('The bank publishes nothing on a customer who moves abroad: SLATE’s assumption.');
  });
});

describe('a life made with an account kept at home', () => {
  it('opens Barclays’ current account at nothing and its savings with the family’s, in pounds, the money adding up to the cent', async () => {
    const sim = createSave(1, 'home-barclays', london('gb-barclays'));
    await loadPlacesFor(sim.universe);
    const [current, savings] = accounts(sim).filter((a) => a.bankId === 'gb-barclays');
    expect(current).toMatchObject({ kind: 'checking', name: 'Barclays Bank Account', currency: 'GBP', balance: 0 });
    expect(current!.held ?? 0).toBe(0);
    expect(savings).toMatchObject({ kind: 'savings', name: 'Everyday Saver', currency: 'GBP', held: 558_100, balance: 706_456 });
    const chase = accounts(sim).filter((a) => a.bankId === 'us-chase' && a.kind !== 'credit_card');
    expect(chase.map((a) => [a.kind, a.balance, a.currency])).toEqual([['checking', 521_744, undefined]]);
    expect(money(sim)).toBe(521_700 + 706_500);
    // Opened at 16, in June 2018, and in use until the morning the life starts.
    expect(new Date(savings!.openedAt).toISOString().slice(0, 10)).toBe('2018-06-14');
    expect(savings!.lastUsedBefore).toBe(sim.now);
    expect(sim.player.priorResidence).toMatchObject({ cityId: 'uk-eng-london', until: sim.now });
    expect(sim.player.primaryAccountId).toBe(chase[0]!.id);
    // A bank kept there keeps England's days, not Connecticut's.
    expect(daysOfAccount(savings!, sim.player)).toEqual({ countryId: 'uk', regionId: CITIES.get('uk-eng-london')!.parentId });
    expect(sim.ledger.audit()).toEqual([]);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('keeps a Berlin student’s savings at Deutsche Bank in euros, worked the same way', () => {
    const sim = createSave(1, 'home-db', life({ homeRegionId: 'de-be-berlin', priorResidence: { cityId: 'de-be-berlin', fromYear: 2002, fromMonth: 6 }, homeBankId: 'de-deutsche-bank' }));
    const db = accounts(sim).filter((a) => a.bankId === 'de-deutsche-bank');
    expect(db.map((a) => [a.name, a.currency, a.held ?? 0, a.balance])).toEqual([['AktivKonto', 'EUR', 0, 0], ['Flexgeld', 'EUR', 649_900, 706_413]]);
    expect(accounts(sim).find((a) => a.bankId === 'us-chase' && a.kind === 'checking')!.balance).toBe(521_787);
    expect(money(sim)).toBe(1_228_200);
  });

  it('with the savings moved, opens the American accounts exactly as a life with nothing kept, and a home current account at nothing', () => {
    const moved = createSave(1, 'home-moved', london('gb-hsbc', { savingsAtHome: false }));
    const none = createSave(1, 'home-moved', life());
    const american = (sim: Simulation) => accounts(sim).filter((a) => a.bankId?.startsWith('us-')).map((a) => [a.id, a.name, a.balance, a.number]);
    expect(american(moved)).toEqual(american(none));
    expect(money(moved)).toBe(money(none));
    expect(accounts(moved).filter((a) => a.bankId === 'gb-hsbc').map((a) => [a.kind, a.balance, a.held ?? 0])).toEqual([['checking', 0, 0]]);
    expect(splitOf({ checking: 521_700, savings: 706_500 }, 'USD', bankById('gb-hsbc'), false)).toEqual({ checking: 521_700, savings: 706_500, homeSavings: 0, homeSavingsHeld: 0 });
  });

  it('opens nothing at home for a birthplace alone, nor for a refused bank', () => {
    expect(accounts(createSave(1, 'home-born', life({ homeBankId: 'gb-hsbc' }))).some((a) => a.bankId === 'gb-hsbc')).toBe(false);
    expect(accounts(createSave(1, 'home-jpb', life({ homeRegionId: 'jp-13-tokyo', priorResidence: { cityId: 'jp-13-tokyo', fromYear: 2005, fromMonth: 4 }, homeBankId: 'jp-japan-post-bank' }))).some((a) => a.bankId === 'jp-japan-post-bank')).toBe(false);
  });

  it('keeps the account, its figure and where they lived through a save and a load, and plays days with the books in order', async () => {
    const sim = createSave(1, 'home-play', london('gb-hsbc'));
    await loadPlacesFor(sim.universe);
    const again = loadSave(deserialise(serialise(sim.universe)) as never);
    const saved = accounts(again).find((a) => a.bankId === 'gb-hsbc' && a.kind === 'savings')!;
    expect(saved).toMatchObject({ currency: 'GBP', held: 558_100, balance: 706_456, lastUsedBefore: sim.now });
    expect(again.player.priorResidence).toEqual(sim.player.priorResidence);
    // Across 31 August, the month's end, where HSBC UK pays its Flexible Saver's interest.
    again.advanceTo(again.now + 10 * MS_DAY);
    const paid = again.universe.transactions.filter((t) => t.postings.some((p) => p.accountId === saved.id && p.native !== undefined && t.category !== 'opening'));
    expect(paid.length).toBeGreaterThan(0);
    expect(saved.held).toBe(558_100 + paid.reduce((n, t) => n + t.postings.find((p) => p.accountId === saved.id)!.native!, 0));
    expect(again.ledger.audit()).toEqual([]);
    expect(breaches(again.universe)).toEqual([]);
    // Nobody touched them, and neither went inactive.
    expect(accounts(again).filter((a) => a.bankId === 'gb-hsbc').some((a) => a.inactive)).toBe(false);
  });
});

describe('the creation screen', () => {
  const text = (el: ReturnType<typeof createElement>) => renderToStaticMarkup(el).replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/\s+/g, ' ');
  const noop = () => undefined;

  it('draws Before Yale with the banks there, a refused one disabled with its reason, and the split', () => {
    const tokyo = life({ homeRegionId: 'jp-13-tokyo', priorResidence: { cityId: 'jp-13-tokyo', fromYear: 2005, fromMonth: 4 }, homeBankId: 'jp-mufg' });
    const html = renderToStaticMarkup(createElement(StartingPointStep, { config: tokyo, set: noop as never, setConfig: noop as never }));
    const words = text(createElement(StartingPointStep, { config: tokyo, set: noop as never, setConfig: noop as never }));
    for (const label of ['Before Yale', 'Where You Lived', 'I Lived Where I Was Born', 'Since', 'I Kept An Account There', 'Your Bank There', 'Your Savings', 'Kept At MUFG Bank', 'Moved To Chase']) expect(words).toContain(label);
    expect(html).toMatch(/<option value="jp-japan-post-bank" disabled="">Japan Post Bank<\/option>/);
    expect(words).toContain('Japan Post Bank: Japan Post Bank asks a customer going abroad to close the account');
    expect(words).toContain('MUFG keeps it through Global Direct');
    expect(words).toContain('It charges ¥300 a month for a customer abroad.');
    // ¥: 706,500 × 150 = 105,975,000, ¥1,059,750 exactly, so all of it.
    expect(words).toContain('Kept At MUFG Bank: ¥1,059,750 In 普通預金 (Ordinary Deposit)');
  });

  it('says America before Yale, and offers no bank, for one raised in New York', () => {
    const words = text(createElement(StartingPointStep, { config: life({ priorResidence: { cityId: 'us-ny-newyork', fromYear: 2010, fromMonth: 1 } }), set: noop as never, setConfig: noop as never }));
    expect(words).toContain('You lived in America before Yale; your account is the one here.');
    expect(words).not.toContain('I Kept An Account There');
  });

  it('writes Before Yale and the home bank on Review, and its figures', () => {
    const words = text(createElement(ReviewStep, { config: london('gb-barclays'), setConfig: noop as never }));
    expect(words).toContain('Before Yale London, United Kingdom, Since 2008');
    expect(words).toContain('Home Bank Barclays, £5,581.00 In Everyday Saver');
    expect(words).toContain('Checking $5,217.44');
  });

  it('refuses to go on with a refused bank ticked, or a time before birth, and goes on with an offered one', () => {
    const STARTING_POINT = 3;
    expect(validate(london('gb-hsbc'), STARTING_POINT as never)).toEqual([]);
    expect(validate(life({ priorResidence: { cityId: 'jp-13-tokyo', fromYear: 2005, fromMonth: 4 }, homeBankId: 'jp-japan-post-bank' }), STARTING_POINT as never))
      .toEqual(['Japan Post Bank asks a customer going abroad to close the account, and keeps one only with someone in Japan acting for them, which SLATE doesn’t have.']);
    expect(validate(london('gb-hsbc', { priorResidence: { cityId: 'uk-eng-london', fromYear: 1999, fromMonth: 1 } }), STARTING_POINT as never)).toContain('You can’t have lived there from before you were born.');
  });
});
