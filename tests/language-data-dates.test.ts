/**
 * Brief 14's research data, its dates (2026-10-17, `docs/verification/language-2026-10-17/prompts/data.md`): the
 * reference data printed a date as its research wrote it, "2026-09-26", "8 April 2026", "Sept 2026", in the fine print
 * under what it explains, where the rest of the game writes "September 26, 2026". The words are rewritten where a
 * rebuild keeps them (`tools/research-dates.mjs`, and the builders that call it), and a day the code reads stays data,
 * written the game's way where a screen shows it (`formatDateKey`).
 *
 * Two kinds of case. The fields: every field of the research that a screen shows has no date left for the step, and no
 * numeric date outside a web address, a file's name, a quotation or a document's number. And the screens: a New York
 * student at Chase, the panels drawn as the player has them, each source line's day said the game's way, once, with
 * its value the data's.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { formatDateKey } from '@/engine/core/time';
import { bankById } from '@/engine/content/banks';
import { CARDS, CARD_LAW } from '@/engine/content/cards';
import { ACCOUNT_LIFE, UNCLAIMED } from '@/engine/content/accountlife';
import { CASH } from '@/engine/content/cash';
import { PENDING } from '@/engine/content/pending';
import { SECURITY, FRAUD_LAW } from '@/engine/content/security';
import { THIRTEEN } from '@/engine/content/banks-thirteen';
import { LENDING, SWITCHING } from '@/engine/content/banks-lending';
import { SHEETS } from '@/engine/content/banks-world-sheets';
import { WORLD_FEES } from '@/engine/content/banks-world-fees';
import { ROUND_UPS } from '@/engine/content/roundups';
import { OPENING, TRANSFERS } from '@/engine/content/bankopening';
import { unclaimedLaw } from '@/engine/systems/accountlife';
import { PASSPORTS } from '@/engine/content/passports';
import { ENTRY } from '@/engine/content/entry';
import { LICENSES } from '@/engine/content/licenses';
import { PASSPORTS_ABROAD } from '@/engine/content/passportsabroad';
import { VISAS } from '@/engine/content/visas';
import { RUNNING_TIMES, UNNAMED_RUNNING } from '@/engine/content/workload';
import { GUIDE } from '@/engine/content/guide';
import { CHAPTERS } from '@/engine/content/tutorial';
import { GENRE_DEMANDS } from '@/engine/content/demands';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as lookAt } from '@/ui/looks/subject';
import { gameDates, GENERATED } from '../tools/research-dates.mjs';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  /** FIXTURE: the tab a workspace opens on, as pressing it sets it. */
  tab: undefined as string | undefined,
}));
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key.startsWith('tab:') && h.tab !== undefined ? h.tab : initial) as T, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { BankWorkspace } = await import('@/ui/workspaces/BankWorkspace');
const { BankCard } = await import('@/ui/bank/BankCard');
const { BankCash } = await import('@/ui/bank/BankCash');
const { BankSecurity } = await import('@/ui/bank/BankSecurity');
const { BankAccountLife } = await import('@/ui/bank/BankAccountLife');
const { BankLending } = await import('@/ui/bank/BankLending');
const { BankStatements } = await import('@/ui/bank/BankStatements');
const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

/** What a screen says, as the player reads it. */
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1');
/** A panel drawn for a life, as its words. */
const drawn = (sim: Simulation, panel: () => ReactElement): string => {
  h.sim = sim;
  return onScreen(renderToStaticMarkup(panel()));
};
const nyStudent = (seed: string, bankId = 'us-chase'): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId });

/** A web address, a domain's path, a file's name or a quotation: the source's own, kept as it is. */
const KEPT = /\bhttps?:\/\/\S+|\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/\S*|\S+\.(?:pdf|html?|jsp|php|aspx?)\b|"[^"]*"|“[^”]*”|‘[^’]*’|(?<=^|[\s([])'[^']*'(?=$|[\s.,;:)\]])/g;
/** A date the game doesn't write: an ISO day or month, a day before its month, a short month, a slashed or dotted day. */
const NOT_THE_GAMES = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b|\b(?:Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.? \d{4}\b|(?<![\w/.-])\d{1,2}\/\d{1,2}\/\d{4}(?![\w/.-])|(?<![\w/.-])(?:0[1-9]|1[0-2])\/(?:19|20)\d{2}(?![\w/.-])|(?<![\w.])\d{1,2}\.\d{1,2}\.(?:19|20)\d{2}(?![\w.])/;
/** What's left of a field once its kept parts are set aside, and any date in it the game doesn't write. */
const notTheGames = (text: string): string | undefined => text.replace(KEPT, ' ').match(NOT_THE_GAMES)?.[0];
/**
 * The dates a shown field keeps, each with why: part of a document's own number, or in the bank's own words where the
 * screen says so.
 */
const KEEPS: readonly string[] = [
  'Décision n°19 du 29/12/2025/CM/UMOA', // the decision's number, as the UMOA writes it
  '12404-2026/09', // CIBC's form number
  'BNA Aviso 03/2018', // the Banco Nacional de Angola's notice number
];

/** Every string of the named fields of each entry of a record or list. */
function fieldsOf(data: unknown, names: readonly string[]): [string, string][] {
  const out: [string, string][] = [];
  const entries = Array.isArray(data) ? data.map((x, i) => [String(i), x] as const) : Object.entries(data as object);
  for (const [key, entry] of entries) for (const name of names) {
    const value = (entry as Record<string, unknown> | undefined)?.[name];
    if (typeof value === 'string') out.push([`${key}.${name}`, value]);
  }
  return out;
}
function holdsTheGamesDates(fields: [string, string][]): void {
  expect(fields.length).toBeGreaterThan(0);
  for (const [where, text] of fields) {
    expect(gameDates(text), where).toBe(text);
    let rest = text;
    for (const kept of KEEPS) rest = rest.split(kept).join(' ');
    expect(notTheGames(rest), `${where}: ${text}`).toBeUndefined();
  }
}

describe('the research data writes its dates the game’s way wherever a screen shows them', () => {
  it('the bank research made by scripts outside the repository: every field the screens show', () => {
    const data: Record<string, unknown> = { CARDS, CARD_LAW, ACCOUNT_LIFE, UNCLAIMED, CASH, PENDING, SECURITY, FRAUD_LAW };
    for (const exports of Object.values(GENERATED)) {
      for (const [name, paths] of Object.entries(exports)) holdsTheGamesDates(fieldsOf(data[name], paths.map((p) => p.split('.')[1]!)));
    }
  });

  it('the bank research kept by hand: each product’s, fee’s, overdraft’s, term’s, loan’s, round-up’s and opening’s source', () => {
    const banks = THIRTEEN.flatMap((c) => c.banks);
    holdsTheGamesDates([
      ...banks.flatMap((b) => [['current', b.current], ['savings', b.savings]].map(([k, p]) => [`${b.id}.${k}`, (p as { source: string }).source] as [string, string])),
      ...banks.flatMap((b) => [b.returned, b.card, b.dormant, b.quietMonth].filter(Boolean).map((x) => [b.id, (x as { source: string }).source] as [string, string])),
      ...Object.entries(LENDING).flatMap(([id, l]) => [l.overdraft, l.term, l.loan].filter(Boolean).map((x) => [id, (x as { source: string }).source] as [string, string])),
      ...fieldsOf(SWITCHING, ['source']),
      ...fieldsOf(ROUND_UPS, ['source']),
      ...fieldsOf(OPENING, ['source']),
      ...fieldsOf(TRANSFERS, ['source']),
      ...fieldsOf(WORLD_FEES, ['source']),
      ...Object.entries(SHEETS).flatMap(([iso, s]) => Object.entries(s.products ?? {}).flatMap(([bank, p]) => [p.current, p.savings].filter(Boolean).flatMap((x) => fieldsOf([x], ['name', 'note', 'source']).map(([k, v]) => [`${iso}.${bank}.${k}`, v] as [string, string])))),
      ...THIRTEEN.flatMap((c) => fieldsOf([c.interestTax], ['note', 'source']).map(([k, v]) => [`${c.iso}.interestTax.${k}`, v] as [string, string])),
      ...Object.entries(SHEETS).flatMap(([iso, s]) => fieldsOf([s.interestTax], ['note', 'source']).map(([k, v]) => [`${iso}.interestTax.${k}`, v] as [string, string])),
      ['US unclaimed', unclaimedLaw('US')!.source],
    ]);
  });
});

describe('the papers research and the running times write their dates the game’s way wherever a screen shows them', () => {
  it('each passport’s fee and its note from abroad, each entry rule’s note, the permit’s issuer, each office abroad and each visa: the builders’ words step and the hand-kept files', () => {
    holdsTheGamesDates([
      ...fieldsOf(PASSPORTS, ['feeBasis', 'abroad']),
      ...Object.entries(ENTRY).flatMap(([iso, d]) => fieldsOf(d.citizens, ['note']).map(([k, v]) => [`${iso}.${k}`, v] as [string, string])),
      ...Object.entries(LICENSES).flatMap(([id, l]) => (l.idp ? [[`${id}.idp.issuer`, l.idp.issuer] as [string, string]] : [])),
      ...fieldsOf(PASSPORTS_ABROAD, ['basis']),
      ...fieldsOf(VISAS, ['basis', 'name']),
    ]);
    // The builders' words step: the research keeps "8 April 2026", the game says "April 8, 2026".
    expect(PASSPORTS['GB']!.abroad).toContain('(from April 8, 2026)');
    expect(LICENSES['gb']!.idp!.issuer).toBe('PayPoint shops (in person; Post Office no longer issues since April 1, 2024)');
  });

  it('each production’s running time, as Source for the running time says it', () => {
    holdsTheGamesDates([...fieldsOf(RUNNING_TIMES, ['from']), ...fieldsOf(UNNAMED_RUNNING, ['from'])]);
    expect(RUNNING_TIMES['Ghosts']!.from).toContain('from August 31, 2017: 2 h 20');
  });
});

describe('the genres’ research writes its dates the game’s way, and the genre look shows them so', () => {
  it('each genre’s claim, reasons, what the research says, how it was read, what’s uncertain and its source: build-attribute-content’s words step', () => {
    holdsTheGamesDates(Object.entries(GENRE_DEMANDS).flatMap(([id, d]) => [
      ...fieldsOf([d], ['claim', 'sourceSupports', 'how', 'uncertainty', 'belongsTo', 'source']).map(([k, v]) => [`${id}.${k}`, v] as [string, string]),
      ...d.tags.map((t) => [`${id}.why:${t.tag}`, t.why] as [string, string]),
    ]));
  });

  it('PLAYER JOURNEY: a first-year opens Horror and Adventure: the source’s day, how it was read and the review’s day, as the game writes a date', () => {
    const sim = nyStudent('data-dates-genres');
    const words = (id: string) => onScreen(renderToStaticMarkup(createElement('div', null, (resolveLook(sim, lookAt('genre', id)) as Looked).body)));
    // Until 2026-10-17: "StageMilk (16 July 2024)", "reviewed 2026-10-10", "On review (2026-10-10)".
    expect(words('horror')).toContain('StageMilk (July 16, 2024), https://');
    expect(words('adventure')).toContain(', reviewed October 10, 2026; ');
    expect(words('absurdist')).toContain('On review (October 10, 2026)');
    for (const id of ['horror', 'adventure', 'absurdist']) expect(notTheGames(words(id)), id).toBeUndefined();
  });
});

describe('the guide, the tutorial and Papers say a day month first, as the game writes a date', () => {
  /** Every string an entry or a chapter holds. */
  const strings = (v: unknown, out: string[] = []): string[] => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
    else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
    return out;
  };
  it('every entry of the guide and every chapter of the tutorial, the papers guide’s built days among them', () => {
    const all = [...GUIDE, ...CHAPTERS].flatMap((e) => strings(e).map((t) => [e.id, t] as const));
    expect(all.length).toBeGreaterThan(1000);
    for (const [id, text] of all) expect(notTheGames(text), `${id}: ${text}`).toBeUndefined();
    const said = (id: string) => strings(GUIDE.find((e) => e.id === id)).join(' ');
    // Until 2026-10-17: "read on 15 October 2026", "born after 5 April 1978", "to 30 September", "by the next 31 January".
    expect(said('papers.doctor')).toContain('its pharmacy statutes, read on October 15, 2026');
    expect(said('papers.pensions')).toContain('68 for anyone born after April 5, 1978');
    expect(said('papers.health-cover')).toContain('Yale Delta Dental Basic runs to its September 30 whatever happens to Yale Health');
    expect(strings(CHAPTERS.find((c) => c.id === 'papers')).join(' ')).toContain('A UK tax year’s is settled on its own, by the next January 31.');
  });

  it('PLAYER JOURNEY: a student reads Health Cover’s dental plan and, with a UK pension claimed, the State Pension’s fine print', () => {
    const sim = nyStudent('data-dates-papers');
    h.tab = 'health';
    const health = drawn(sim, () => createElement(PapersWorkspace));
    expect(health).toContain('It’s paid for the year to September 30, and can’t be canceled once paid.');
    expect(notTheGames(health)).toBeUndefined();
    // TEST SETUP: a State Pension claimed, which a life reaches at 68; the panel shows for it.
    sim.player.statePensionFrom = sim.now;
    h.tab = 'benefits';
    const benefits = drawn(sim, () => createElement(PapersWorkspace));
    expect(benefits).toContain('State Pension age is 68 for anyone born after April 5, 1978, under the Pensions Act 2007.');
    expect(notTheGames(benefits)).toBeUndefined();
    h.tab = undefined;
  });
});

describe('PLAYER JOURNEY: a New York student at Chase reads each source line’s day as the game writes a date', () => {
  it('says the day a product, a card, its cash, its security and its term deposit were read, once each, as the data holds it', () => {
    const sim = nyStudent('data-dates-chase');
    const chase = bankById('us-chase')!;
    const screens = {
      accounts: drawn(sim, () => createElement(BankWorkspace)),
      card: drawn(sim, () => createElement(BankCard, { bankId: 'us-chase' })),
      cash: drawn(sim, () => createElement(BankCash, { bankId: 'us-chase' })),
      security: drawn(sim, () => createElement(BankSecurity, { bankId: 'us-chase' })),
      lending: drawn(sim, () => createElement(BankLending, { bank: chase, show: ['borrowing', 'term'] })),
      statements: drawn(sim, () => createElement(BankStatements)),
    };
    // A product's source and the day the bank's figures are from (`asOf`, data the code keeps as a key).
    expect(chase.current.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(screens.accounts).toContain(`Source: ${chase.current.source}, ${formatDateKey(chase.current.asOf)}.`);
    // The card's source ends on the day it was read, the same day as its terms: said once.
    const card = CARDS['us-chase'] as { source: string; asOf: string };
    expect(card.source.endsWith(`, ${formatDateKey(card.asOf)}`)).toBe(true);
    expect(screens.card).toContain(`Source: ${card.source}.`);
    expect(screens.card.split(formatDateKey(card.asOf)).length - 1).toBe(1);
    // Until 2026-10-17 these were "…/LGC61498.html ; minimum-payment formula …" and "…, 2026-09-26".
    expect(card.source).toContain('/LGC61498.html; minimum-payment formula from ');
    expect(screens.cash).toContain(`Source: ${CASH['us-chase']!.source}.`);
    expect(CASH['us-chase']!.source).toMatch(/, read September 26, 2026$/);
    expect(screens.security).toContain('Deposit Account Agreement and fee schedule effective June 14, 2026;');
    expect(screens.lending).toContain('Source: Chase 7-month CD, via fortune.com, September 24, 2026.');
    expect(screens.statements).toContain('Chase Deposit Account Agreement, effective June 14, 2026 (chase.com/');
    for (const [screen, words] of Object.entries(screens)) expect(notTheGames(words), screen).toBeUndefined();
  });
});

describe('PLAYER JOURNEY: a New York student at Bank of America reads Your Accounts Over Time', () => {
  it('says the day the bank’s terms and its round-up rule were read, and the day the rule was checked, as the game writes a date', () => {
    const sim = nyStudent('data-dates-bofa', 'us-bank-of-america');
    const words = drawn(sim, () => createElement(BankAccountLife, { bankId: 'us-bank-of-america' }));
    const rule = ROUND_UPS['us-bank-of-america']!;
    expect(rule.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Until 2026-10-17: "…, effective 7 August 2026; Keep the Change page and FAQ, checked 2026-10-13."
    expect(words).toContain(`Source: ${rule.source}, checked ${formatDateKey(rule.checked)}.`);
    expect(rule.source).toContain('effective August 7, 2026');
    expect(words).toContain(`Source: the bank’s terms, ${ACCOUNT_LIFE['us-bank-of-america']!.source}.`);
    expect(notTheGames(words)).toBeUndefined();
  });
});

// From 2026-10-17, at the merge of this pass (its record, Recorded And Left): a source read and checked on one day said
// that day once, and a card whose source ends on another day names its terms' day as such.
describe('PLAYER JOURNEY: each source line says each of its days once, and which day is which', () => {
  it('says NatWest’s round-up rule was read live and checked on one day, once, and BofA’s, checked on another, both', () => {
    const rule = ROUND_UPS['gb-natwest']!;
    const day = formatDateKey(rule.checked);
    expect(rule.source.endsWith(`read live ${day}`)).toBe(true);
    const words = drawn(nyStudent('data-dates-natwest'), () => createElement(BankAccountLife, { bankId: 'gb-natwest' }));
    expect(words).toContain(`Source: ${rule.source.replace(`read live ${day}`, `read live and checked ${day}`)}.`);
    expect(words.split(day).length - 1).toBe(1);
    const bofa = ROUND_UPS['us-bank-of-america']!;
    expect(drawn(nyStudent('data-dates-bofa-2', 'us-bank-of-america'), () => createElement(BankAccountLife, { bankId: 'us-bank-of-america' }))).toContain(`Source: ${bofa.source}, checked ${formatDateKey(bofa.checked)}.`);
  });

  it('names a card’s terms’ day where its source ends on the day it was read, Lloyds’s among them', () => {
    const card = CARDS['gb-lloyds'] as { source: string; asOf: string };
    expect(card.source).toMatch(/, September 26, 2026$/);
    expect(card.asOf).toBe('2026-04-10');
    // A Londoner at Lloyds, whose card the panel shows.
    const londoner = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, bankId: 'gb-lloyds' }, 'data-dates-lloyds');
    const words = drawn(londoner, () => createElement(BankCard, { bankId: 'gb-lloyds' }));
    expect(words).toContain(`Source: ${card.source}. Terms as of April 10, 2026.`);
    expect(notTheGames(words)).toBeUndefined();
  });
});
