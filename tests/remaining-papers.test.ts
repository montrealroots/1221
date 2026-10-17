/**
 * Papers' documents, the owner's brief of 2026-10-16, section 8 ("Finish Papers And Documents";
 * docs/verification/integration-2026-10-16/prompts/tax.md, docs/verification/remaining/tax-checklist.json `tax.s8.*`):
 * what Papers holds, what reads each document in New Haven, and each lifecycle where it was short of its rule.
 *
 * - What a life's papers hold and what reads them: a London-born student's passport and F-1, read by the Social
 *   Security office, a new bank and the DMV; a New York-born student's license, read by a new bank until it runs out in
 *   June 2028, when the state ID card is the next step.
 * - The passport from abroad. Every life lives in New Haven, so a citizen of anywhere but the United States applies to
 *   her own office from abroad; until 2026-10-16 she was charged its fee at home and offered its faster service at home:
 *   a British student's Renew It was the UK's £102 (it's £116.50 from overseas, gov.uk, in force from 8 April 2026), and
 *   Renew It Faster the UK's Fast Track, which isn't sold outside the UK (gov.uk/get-a-passport-urgently); both read
 *   2026-10-16. A US citizen's renewal by mail on Form DS-82 is $130 with no acceptance fee, where until then every US
 *   application paid a first passport's $165 (State's fee chart, "Updated October 2026", read through search).
 * - Connecticut's ID card for somebody not a citizen. The DMV asks a primary identity document, valid and unexpired: for
 *   somebody born abroad a foreign passport with its supporting documents (an F-1's I-20 and I-94) or an Employment
 *   Authorization Document; and issues anyone but a citizen or a permanent resident a non-verified card, “Not for Federal
 *   Identification” (DMV checklist DI-3 Rev. 6-2026, and its Non-US Citizen Requirements, read 2026-10-16). Until
 *   2026-10-16 no document was asked, so a student whose passport was reported lost was issued a card, and every card
 *   was marked REAL ID. From 2026-10-17 (brief 11's KS-ct-idcard) the card comes by mail twenty business days on, after
 *   SAVE's ten for somebody not a citizen, and a citizen's runs to her first birthday at least seven years on; until
 *   then a citizen's was in force at the counter, and a non-citizen's came on SAVE's tenth day.
 *
 * - From later on 2026-10-17 (brief 12's KS-ct-idcard and KS-passport-fees, docs/verification/resolution-2026-10-17/
 *   research-criteria.md): Japan's fee from the United States is the US$62 MOFA's ordinance sets (read on e-Gov), and
 *   New Zealand's GST and urgent fee from abroad and Connecticut's term for somebody not a citizen are SLATE's
 *   assumptions, one value each (`NZ_FROM_ABROAD`, `NONCITIZEN_ID.toLawfulPresence`), said so on Papers. TEST SETUP
 *   turns a value as a correction would, inside the test and back after it: what was issued keeps its date, what was
 *   charged stands, and what's applied for after takes the new value.
 * - From 2026-10-17 (brief 11's tax.s8.f1_status): a passport run out under an F-1 ends nothing, the status reading the
 *   program and its grace alone, played on a London-born student who keeps up to her passport's end in June 2028 (seed
 *   rp-f1-run-out-45; TEST SETUP: the work done each midnight and the student tended, as tests/remaining-school.test.ts
 *   plays one).
 *
 * Every fee is the office's own, written as a literal; a fee in another currency is put in dollars at the engine's rate
 * table (`content/currency.ts`), which these items don't change.
 *
 * PLAYER JOURNEYS: new lives (`createSave`, `newLifeConfig`, the Scraping family), Ada Cole, at Yale in New Haven from
 * Monday 24 August 2026: born in London (seeds rp-uk-a, rp-uk-b) or New York (rp-ny-a, rp-ny-b), each holding the
 * papers creation drew for her (rp-uk-a a British passport issued 10 July 2026 and the F-1; rp-ny-b a US passport issued
 * 23 May 2026 and a New York license; rp-ny-a the license alone, issued 14 June 2020, running out 14 June 2028). Papers
 * is drawn as the player has it (react-dom/server), its Gated buttons pressed by their own onClick; a document's page is
 * its look, resolved as the screen opens it. FIXTURE: an OPT permit put on by hand, and a card marked as a save from
 * before held it, each said where it's done.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, isValidElement, type FunctionComponent, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeConfig, withFamily } from '@/engine/world/bootstrap';
import { exchange } from '@/engine/content/currency';
import { documentsOf, inForce, passportOf, photoIdOf, type PersonDocument } from '@/engine/systems/documents';
import { US_STATUS_KIND, businessDaysOn, f1Of, usStatusEnds } from '@/engine/systems/permission';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf } from '@/engine/systems/coursework';
import { NONCITIZEN_ID, idCardExpires, idCardRefusal } from '@/engine/systems/identity';
import { ID_CARDS } from '@/engine/content/identity';
import { NZ_FROM_ABROAD, PASSPORTS_ABROAD } from '@/engine/content/passportsabroad';
import { PASSPORTS } from '@/engine/content/passports';
import { ssnRefusal } from '@/engine/systems/taxid';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  clicks: [] as { feature: string; label: string; title?: string; disabled: boolean; onClick?: () => void }[],
  toasts: [] as string[],
}));

vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});

vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: (message: string) => { h.toasts.push(message); },
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

vi.mock('@/ui/guide/Guide', async (orig) => {
  const real = await orig<typeof import('@/ui/guide/Guide')>();
  const { createElement: ce } = await import('react');
  const words = (c: unknown): string => (Array.isArray(c) ? c.map(words).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : '');
  return {
    ...real,
    Gated: (props: Parameters<typeof real.Gated>[0]) => {
      h.clicks.push({ feature: props.feature, label: words(props.children), title: props.title, disabled: Boolean(props.disabled), onClick: props.onClick as never });
      return ce(real.Gated, props);
    },
  };
});

const { PassportPane, WorkPane } = await import('@/ui/papers/Documents');

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 12, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, NY);
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const reload = (sim: Simulation): Simulation => loadSave(JSON.parse(JSON.stringify(sim.universe)) as never);
const life = (seed: string, home: string): Simulation => createSave(1, seed, { ...withFamily(newLifeConfig(), 'scraping'), homeRegionId: home, firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const held = (sim: Simulation) => sim.ledger.accountsOf(sim.player.id).reduce((s, a) => s + a.balance, 0);
const refusal = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}) => sim.execute({ kind, payload }).error;
/** What a memo's postings took from her own accounts. */
const taken = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).map((t) => -t.postings.filter((p) => sim.universe.accounts[p.accountId]?.ownerId === sim.player.id).reduce((s, p) => s + p.amount, 0));
const usdOf = (cents: number, currency: string) => (currency === 'USD' ? cents : exchange(cents, currency, 'USD')!);
const kindsOf = (sim: Simulation) => documentsOf(sim.player).map((d) => `${d.kind} ${d.issuer} ${d.status}`);

function drawn(sim: Simulation, pane: FunctionComponent): string {
  h.sim = sim;
  h.clicks = [];
  return onScreen(renderToStaticMarkup(createElement(pane)));
}
const drew = (feature: string) => h.clicks.filter((c) => c.feature === feature);
function press(feature: string, label?: string): string[] {
  const found = drew(feature).filter((c) => label === undefined || c.label === label);
  expect(found, `one ${feature} button${label ? ` labelled ${label}` : ''}`).toHaveLength(1);
  h.toasts = [];
  found[0]!.onClick!();
  return h.toasts;
}
/** The words a node shows. */
function text(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((n) => text(n as ReactNode)).join('');
  if (!isValidElement(node)) return '';
  return text((node.props as { children?: ReactNode }).children);
}
/** A document's page, as Papers opens it: its summary and its body. */
function page(sim: Simulation, id: string): string {
  h.sim = sim;
  const found = resolveLook(sim, subject('document', id)) as Looked;
  return `${text(found.summary)} ${text(found.body)}`;
}

// ---------------------------------------------------------------------------
// tax.s8.inventory: what a life's papers hold, and what reads each
// ---------------------------------------------------------------------------

describe('tax.s8.inventory', () => {
  it('PLAYER JOURNEY: a London-born student’s papers are her passport and her F-1; the Social Security office, a new bank and the DMV each read the passport, and each says why once it’s reported lost', () => {
    const sim = life('rp-uk-a', 'uk-eng-london');
    expect(kindsOf(sim)).toEqual(['passport GB valid', 'visa US valid']);
    const passport = passportOf(sim.player, sim.now)!;
    // The F-1 to the program's end, 31 May 2029, and its 60 days' grace (8 CFR 214.2(f)(5)(iv)).
    expect(f1Of(sim.player)!.expiresAt).toBe(Date.UTC(2029, 4, 31, 12) + 60 * MS_DAY);
    expect(drawn(sim, PassportPane)).toContain(passport.number);
    expect(drawn(sim, WorkPane)).toContain('F-1 Student Visa');
    expect(photoIdOf(sim.player, sim.now)?.id).toBe(passport.id);
    // Registered and her number applied for and come, with the passport in force: the office's own steps.
    sim.advanceTo(at(2026, 8, 30, 12));
    expect(ssnRefusal(sim, sim.player)).toBeUndefined();
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    sim.advanceTo(ssn.arrivesAt + MS_HOUR);
    expect(idCardRefusal(sim.player, sim.now)).toBeUndefined();
    // Reported lost: canceled for good, the F-1 holding.
    sim.must({ kind: 'documents.report_lost', payload: { documentId: passport.id } });
    expect([passport.status, f1Of(sim.player)?.status]).toEqual(['lost', 'valid']);
    expect(photoIdOf(sim.player, sim.now)).toBeUndefined();
    expect(refusal(sim, 'bank.open_current', { bankId: 'us-wells-fargo' })).toBe('Wells Fargo needs a valid photo ID from a new customer: a passport, a driver’s license or an ID card. You can apply for a passport or an ID card on Papers, under Passport And ID.');
    expect(idCardRefusal(sim.player, sim.now)).toBe('The DMV asks for a primary identity document in force: your passport, with your I-94 and I-20. Apply for a passport or renew it under Your Passport first.');
  });

  it('PLAYER JOURNEY: a New York-born student’s papers are her license alone: a new bank takes it until it runs out on 14 June 2028, and then turns her away, the state ID card on Papers the next step, which it then takes', () => {
    const sim = life('rp-ny-a', 'us-ny-newyork');
    expect(kindsOf(sim)).toEqual(['license us-ny valid']);
    const license = documentsOf(sim.player)[0]!;
    expect(new Date(license.expiresAt!).toISOString().slice(0, 10)).toBe('2028-06-14');
    expect(photoIdOf(sim.player, sim.now)?.id).toBe(license.id);
    sim.advanceTo(license.expiresAt! + MS_HOUR);
    expect(photoIdOf(sim.player, sim.now)).toBeUndefined();
    expect(refusal(sim, 'bank.open_current', { bankId: 'us-wells-fargo' })).toBe('Wells Fargo needs a valid photo ID from a new customer: a passport, a driver’s license or an ID card. You can apply for a passport or an ID card on Papers, under Passport And ID.');
    // Its page says it's out of force; nothing in SLATE renews a license since the cars went, and the ID card is drawn.
    expect(page(sim, license.id)).toContain('It ran out on June 14, 2028 and no longer counts for anything.');
    const screen = drawn(sim, PassportPane);
    expect(screen).toContain('Run Out');
    expect(drew('documents.apply_idcard').map((c) => [c.label, c.disabled])).toEqual([['Get Non-Driver Identification Card', false]]);
    const before = held(sim);
    // Asked for an hour after the license ran out, on her birthday, Wednesday 14 June 2028: mailed within twenty business
    // days, Juneteenth and the Fourth not among them, Friday 14 July; to her birthday seven years on, 14 June 2035.
    expect(press('documents.apply_idcard')).toEqual(['Non-Driver Identification Card: you paid $28.00. The card comes July 14, 2028. It’s good until June 14, 2035.']);
    expect(before - held(sim)).toBe(28_00);
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    // On its way, it isn't a photo ID yet, and Wells Fargo still turns her away (from 2026-10-17: until then it was in
    // force at once).
    expect(card.status).toBe('pending');
    expect(photoIdOf(sim.player, sim.now)).toBeUndefined();
    expect(refusal(sim, 'bank.open_current', { bankId: 'us-wells-fargo' })).toBe('Wells Fargo needs a valid photo ID from a new customer: a passport, a driver’s license or an ID card. You can apply for a passport or an ID card on Papers, under Passport And ID.');
    sim.advanceTo(card.readyAt! + MS_HOUR);
    // A citizen's card is REAL ID, and its page says so.
    expect(card.status).toBe('valid');
    expect(card.realId).toBe(true);
    expect(page(sim, card.id)).toContain('It meets REAL ID.');
    expect(photoIdOf(sim.player, sim.now)?.id).toBe(card.id);
  });
});

// ---------------------------------------------------------------------------
// tax.s8.passport: the office's terms where the applicant is
// ---------------------------------------------------------------------------

describe('tax.s8.passport', () => {
  // From 2026-10-17 (brief 14's cross-area pass): a day's wait was printed “1 days”, found by the health area on a life in
  // Vancouver, where Canada's faster service takes a day.
  it('a passport office’s days and years are said in the right number: Canada’s faster service in Vancouver takes “1 day”', () => {
    const sim = quickSave({ startLocationId: 'ca-bc-vancouver', homeRegionId: 'ca-bc-vancouver', livesWhereBorn: true, wealth: 'comfortable' } as never, 'rp-ca-van', 1);
    const screen = drawn(sim, PassportPane);
    expect(screen).toMatch(/ Faster C\$[\d,.]+ 1 day Renew It /);
    expect(screen).not.toMatch(/\b1 (?:days|years)\b/);
  });

  it('PLAYER JOURNEY: a London-born student renews her British passport on Papers from New Haven: £116.50, the overseas fee, in dollars; no Renew It Faster, the Fast Track not sold abroad, and the command refused; issued in 21 days, the old one canceled on the new one’s day, once across a reload; until 2026-10-16 £102 and Fast Track offered', () => {
    const sim = life('rp-uk-b', 'uk-eng-london');
    const old = passportOf(sim.player, sim.now)!;
    const fee = usdOf(116_50, 'GBP');
    expect(fee).not.toBe(usdOf(102_00, 'GBP'));
    const screen = drawn(sim, PassportPane);
    expect(screen).toContain(`A New One ${'$' + (fee / 100).toFixed(2)} About 21 days; good for 10 years; from abroad`);
    expect(screen).toContain('Faster Not Offered HM Passport Office (Home Office) offers no faster service to applicants abroad');
    expect(screen).toContain('An adult passport applied for online from outside the UK: £116.50 from 8 April 2026 (£130 on paper).');
    expect(drew('documents.apply_passport').map((c) => c.label)).toEqual(['Renew It']);
    const before = held(sim);
    expect(refusal(sim, 'documents.apply_passport', { expedite: true })).toBe('HM Passport Office (Home Office) offers no faster service to applicants abroad.');
    expect(held(sim)).toBe(before);
    const applied = sim.now;
    expect(press('documents.apply_passport', 'Renew It')).toEqual([expect.stringMatching(/^Applied and paid \$/)]);
    expect(taken(sim, 'British Passport (Standard 34-Page)')).toEqual([fee]);
    // While it's decided the old one stands: the Social Security office and a new bank still take it.
    expect(photoIdOf(sim.player, sim.now)?.id).toBe(old.id);
    const again = reload(sim);
    again.advanceTo(applied + 21 * MS_DAY - MS_HOUR);
    expect(passportOf(again.player, again.now)?.id).toBe(old.id);
    again.advanceTo(applied + 21 * MS_DAY + MS_HOUR);
    const renewed = passportOf(again.player, again.now)!;
    expect(renewed.id).not.toBe(old.id);
    expect(documentsOf(again.player).find((d) => d.id === old.id)!.status).toBe('cancelled');
    expect(titled(again, 'British Passport (Standard 34-Page) Issued')).toHaveLength(1);
    // Its F-1 holds on the new passport: the status isn't the stamp.
    expect(f1Of(again.player)?.status).toBe('valid');
  });

  it('PLAYER JOURNEY: a New York-born student renews her US passport by mail for $130 on Form DS-82; reported lost, the next is a first passport’s $165 on Form DS-11; until 2026-10-16 both $165', () => {
    const sim = life('rp-ny-b', 'us-ny-newyork');
    const old = passportOf(sim.player, sim.now)!;
    // Issued 23 May 2026, at 24, for ten years: within fifteen years, at sixteen or older, never reported lost.
    expect([old.issuer, new Date(old.issuedAt!).toISOString().slice(0, 10)]).toEqual(['US', '2026-05-23']);
    const screen = drawn(sim, PassportPane);
    expect(screen).toContain('A New One $130.00 Up to 42 days; good for 10 years; renewed by mail');
    expect(press('documents.apply_passport', 'Renew It')).toEqual([expect.stringMatching(/^Applied and paid \$130\.00\. /)]);
    expect(taken(sim, 'U.S. Passport Book, renewed on Form DS-82')).toEqual([130_00]);
    sim.advanceTo(sim.now + 43 * MS_DAY);
    const renewed = passportOf(sim.player, sim.now)!;
    expect(renewed.id).not.toBe(old.id);
    sim.must({ kind: 'documents.report_lost', payload: { documentId: renewed.id } });
    drawn(sim, PassportPane);
    expect(press('documents.apply_passport', 'Apply For One')).toEqual([expect.stringMatching(/^Applied and paid \$165\.00\. /)]);
    expect(taken(sim, 'U.S. Passport Book')).toEqual([165_00]);
  });

  // Brief 11's KS-passport-fees (2026-10-17, docs/research/world/research-passports-abroad.json): the fees from abroad
  // read on the offices' own pages that day. Until then Iceland's and Brazil's were their fees at home, said to be
  // assumed, and Latvia's the embassy in Ireland's. Renamed later that day (brief 12, inputs/renames.json): until then
  // 'FIXTURE: the offices’ terms from abroad read on 2026-10-17: Iceland’s 19,000 ISK and express 39,200 ISK in all,
  // Brazil’s US$60, Latvia’s €140 (€115 under 20) in about eight weeks with no urgent service; Japan’s and New Zealand’s
  // still said to be SLATE’s', when Japan's fee was the yen fee at SLATE's rate.
  it('FIXTURE: the offices’ terms from abroad: Iceland’s 19,000 ISK and express 39,200 ISK in all, Brazil’s US$60, Latvia’s €140 (€115 under 20) in about eight weeks with no urgent service, read on 2026-10-17; Japan’s US$62 from 1 July 2026, its ordinance read on e-Gov later that day; New Zealand’s GST and urgent fee SLATE’s assumptions, one value each, said so', () => {
    expect(PASSPORTS_ABROAD['IS']).toMatchObject({ fee: 19000, currency: 'ISK', days: 6, daysEstimated: true, expedite: { extra: 20200, days: 2 } });
    expect(PASSPORTS_ABROAD['BR']).toMatchObject({ fee: 60, currency: 'USD', expedite: null });
    expect(PASSPORTS_ABROAD['LV']).toMatchObject({ fee: 140, youngFee: 115, currency: 'EUR', days: 56, daysEstimated: false, expedite: null });
    // Japan's, read in MOFA Ordinance 4 of 2006 as amended from 1 July 2026: the United States's row, ten years on paper.
    expect(PASSPORTS_ABROAD['JP']).toMatchObject({ fee: 62, currency: 'USD', expedite: null, assumed: [] });
    expect(PASSPORTS_ABROAD['JP']!.basis).toContain('US$62 from 1 July 2026, the fee MOFA’s ordinance on passport fees abroad sets for the United States (US$60 applied for online)');
    // New Zealand's: DIA's NZ$214.78 before GST, and SLATE's two assumptions, each one value, said on the screen as SLATE's.
    expect(NZ_FROM_ABROAD).toEqual({ feeBeforeGst: 214.78, urgentBeforeGst: 214.78, gstRate: 0.15, gstCharged: true });
    expect(PASSPORTS_ABROAD['NZ']).toMatchObject({ fee: 247, currency: 'NZD', days: 28, expedite: { extra: 247, days: 5 } });
    expect(PASSPORTS_ABROAD['NZ']!.assumed.slice(0, 2)).toEqual([
      'GST is charged. DIA charges none to a non-resident for New Zealand tax applying online, and whether you’re one turns on a home in New Zealand, which the game doesn’t keep.',
      'The urgent fee from overseas is the standard fee, as DIA’s 2022 schedule set it for an application online.',
    ]);
    for (const iso of ['IS', 'BR', 'LV', 'JP']) expect(PASSPORTS_ABROAD[iso]!.assumed.join(' ')).not.toMatch(/fees? (charged|wasn’t|weren’t)|assumed/);
  });

  it('PLAYER JOURNEY: a Tokyo-born student renews her Japanese passport on Papers from New Haven: US$62, the fee MOFA’s ordinance sets for the United States from 1 July 2026; no faster service, the command refused; a second application refused while hers is decided; charged once and issued on its day across a reload, the old one canceled then; until later on 2026-10-17 the window fee in Japan, 9,300 yen, at SLATE’s rate, the same $62.00 said to be SLATE’s', () => {
    const sim = life('rp-jp-a', 'jp-13-tokyo');
    const old = passportOf(sim.player, sim.now)!;
    expect(old.issuer).toBe('JP');
    // SLATE's rate put the yen fee at the same $62.00: what changed is whose figure it is, the ordinance's, not SLATE's
    // conversion of the fee in Japan, and the fine print no longer says it's SLATE's.
    expect(usdOf(9_300_00, 'JPY')).toBe(62_00);
    const { issuer, name } = PASSPORTS['JP']!;
    const screen = drawn(sim, PassportPane);
    expect(screen).toContain('A New One $62.00 About 30 days; good for 10 years; from abroad');
    expect(screen).toContain(`Faster Not Offered ${issuer} offers no faster service to applicants abroad`);
    expect(screen).toContain('At a Japanese embassy or consulate in the US, on paper: US$62 from 1 July 2026, the fee MOFA’s ordinance on passport fees abroad sets for the United States (US$60 applied for online)');
    expect(screen).not.toContain('yen fee');
    expect(drew('documents.apply_passport').map((c) => c.label)).toEqual(['Renew It']);
    const before = held(sim);
    expect(refusal(sim, 'documents.apply_passport', { expedite: true })).toBe(`${issuer} offers no faster service to applicants abroad.`);
    expect(held(sim)).toBe(before);
    const applied = sim.now;
    expect(press('documents.apply_passport', 'Renew It')).toEqual([expect.stringMatching(/^Applied and paid \$62\.00\. It should arrive by /)]);
    expect([taken(sim, name), before - held(sim)]).toEqual([[62_00], 62_00]);
    expect(refusal(sim, 'documents.apply_passport')).toBe('You’ve already applied, and it’s being decided.');
    expect(taken(sim, name)).toEqual([62_00]);
    const again = reload(sim);
    again.advanceTo(applied + 30 * MS_DAY - MS_HOUR);
    expect(passportOf(again.player, again.now)?.id).toBe(old.id);
    again.advanceTo(applied + 30 * MS_DAY + MS_HOUR);
    const renewed = passportOf(again.player, again.now)!;
    expect(renewed.id).not.toBe(old.id);
    expect(documentsOf(again.player).find((d) => d.id === old.id)!.status).toBe('cancelled');
    expect(titled(again, `${name} Issued`)).toHaveLength(1);
    expect(taken(again, name)).toEqual([62_00]);
  });

  it('PLAYER JOURNEY: an Auckland-born student renews her New Zealand passport faster on Papers from New Haven: NZ$247 and NZ$247 more, in dollars, GST charged and the urgent fee taken as the standard one, each said on the screen to be SLATE’s assumption; charged once, a second application refused, issued in five days across a reload', () => {
    const sim = life('rp-nz-a', 'nz-akl-auckland');
    const old = passportOf(sim.player, sim.now)!;
    expect(old.issuer).toBe('NZ');
    const fee = usdOf(247_00, 'NZD');
    const faster = usdOf(494_00, 'NZD');
    const screen = drawn(sim, PassportPane);
    expect(screen).toContain(`A New One ${'$' + (fee / 100).toFixed(2)} Up to 28 days; good for 10 years; from abroad`);
    expect(screen).toContain(`Faster ${'$' + (faster / 100).toFixed(2)} 5 days`);
    expect(screen).toContain('Online to DIA from overseas: NZ$214.78 before GST, NZ$247.00 with it, from 2 May 2025.');
    expect(screen).toContain('Assumed in the game: GST is charged. DIA charges none to a non-resident for New Zealand tax applying online');
    expect(screen).toContain('The urgent fee from overseas is the standard fee');
    expect(drew('documents.apply_passport').map((c) => c.label)).toEqual(['Renew It', 'Renew It Faster']);
    const applied = sim.now;
    expect(press('documents.apply_passport', 'Renew It Faster')).toEqual([expect.stringMatching(/^Applied and paid \$[\d,]+\.\d\d\. It should arrive by /)]);
    expect(taken(sim, 'New Zealand passport, expedited')).toEqual([faster]);
    expect(refusal(sim, 'documents.apply_passport')).toBe('You’ve already applied, and it’s being decided.');
    const again = reload(sim);
    again.advanceTo(applied + 5 * MS_DAY - MS_HOUR);
    expect(passportOf(again.player, again.now)?.id).toBe(old.id);
    again.advanceTo(applied + 5 * MS_DAY + MS_HOUR);
    const renewed = passportOf(again.player, again.now)!;
    expect(renewed.id).not.toBe(old.id);
    expect(documentsOf(again.player).find((d) => d.id === old.id)!.status).toBe('cancelled');
    expect(titled(again, 'New Zealand passport Issued')).toHaveLength(1);
    expect(taken(again, 'New Zealand passport, expedited')).toEqual([faster]);
  });

  it('PLAYER JOURNEY: New Zealand’s GST turned off after she has applied (TEST SETUP: `NZ_FROM_ABROAD.gstCharged`, as a correction would change it): her application, charged NZ$247 with GST, is issued on its day across a save and a load with nothing charged or refunded and its transaction as it was; reported lost, the next is NZ$214.78, faster NZ$429.56, the screen saying no GST is charged, and the faster one is charged that', () => {
    const sim = life('rp-nz-a', 'nz-akl-auckland');
    const old = passportOf(sim.player, sim.now)!;
    const withGst = usdOf(247_00, 'NZD');
    drawn(sim, PassportPane);
    const applied = sim.now;
    press('documents.apply_passport', 'Renew It');
    expect(taken(sim, 'New Zealand passport')).toEqual([withGst]);
    const charged = JSON.stringify(sim.universe.transactions.filter((t) => t.memo === 'New Zealand passport'));
    const posted = JSON.stringify(sim.universe.transactions);
    try {
      NZ_FROM_ABROAD.gstCharged = false;
      const again = reload(sim);
      // Nothing already posted moves: the ledger reads as it did, and what's on its way comes as it was applied for.
      expect(JSON.stringify(again.universe.transactions)).toBe(posted);
      again.advanceTo(applied + 28 * MS_DAY + MS_HOUR);
      const renewed = passportOf(again.player, again.now)!;
      expect(renewed.id).not.toBe(old.id);
      expect(JSON.stringify(again.universe.transactions.filter((t) => t.memo === 'New Zealand passport'))).toBe(charged);
      expect(taken(again, 'New Zealand passport')).toEqual([withGst]);
      // What's applied for after takes the value as it now stands.
      again.must({ kind: 'documents.report_lost', payload: { documentId: renewed.id } });
      const without = usdOf(214_78, 'NZD');
      const faster = usdOf(429_56, 'NZD');
      expect(without).toBeLessThan(withGst);
      const screen = drawn(again, PassportPane);
      expect(screen).toContain(`A New One ${'$' + (without / 100).toFixed(2)} Up to 28 days`);
      expect(screen).toContain(`Faster ${'$' + (faster / 100).toFixed(2)} 5 days`);
      expect(screen).toContain('Assumed in the game: No GST is charged, as you’re taken to be a non-resident for New Zealand tax.');
      expect(screen).not.toContain('GST is charged.');
      press('documents.apply_passport', 'Apply Faster');
      expect(taken(again, 'New Zealand passport, expedited')).toEqual([faster]);
      expect(taken(again, 'New Zealand passport')).toEqual([withGst]);
    } finally {
      NZ_FROM_ABROAD.gstCharged = true;
    }
  });

  it('PLAYER JOURNEY: a São Paulo-born student renews her Brazilian passport on Papers from New Haven: US$60, the consular fee of sixty reais-ouro from 1 June 2026; no faster service, the command refused; issued on its day, the old one canceled then, once across a reload; until 2026-10-17 the Polícia Federal’s R$257.25 at home', () => {
    const sim = life('rp-br-a', 'br-27-saopaulo');
    const old = passportOf(sim.player, sim.now)!;
    expect(old.issuer).toBe('BR');
    expect(usdOf(257_25, 'BRL')).not.toBe(60_00);
    const issuer = 'Polícia Federal (Departamento de Polícia Federal), Ministério da Justiça e Segurança Pública';
    const screen = drawn(sim, PassportPane);
    expect(screen).toContain('A New One $60.00 About 8 days; good for 10 years; from abroad');
    expect(screen).toContain(`Faster Not Offered ${issuer} offers no faster service to applicants abroad`);
    expect(screen).toContain('at the consular fee from 1 June 2026: 60 reais-ouro, a real-ouro being a dollar, so US$60.');
    expect(drew('documents.apply_passport').map((c) => c.label)).toEqual(['Renew It']);
    const before = held(sim);
    expect(refusal(sim, 'documents.apply_passport', { expedite: true })).toBe(`${issuer} offers no faster service to applicants abroad.`);
    expect(held(sim)).toBe(before);
    const applied = sim.now;
    expect(press('documents.apply_passport', 'Renew It')).toEqual([expect.stringMatching(/^Applied and paid \$60\.00\. It should arrive by /)]);
    expect(taken(sim, 'Passaporte comum')).toEqual([60_00]);
    const again = reload(sim);
    again.advanceTo(applied + 8 * MS_DAY - MS_HOUR);
    expect(passportOf(again.player, again.now)?.id).toBe(old.id);
    again.advanceTo(applied + 8 * MS_DAY + MS_HOUR);
    const renewed = passportOf(again.player, again.now)!;
    expect(renewed.id).not.toBe(old.id);
    expect(documentsOf(again.player).find((d) => d.id === old.id)!.status).toBe('cancelled');
    expect(titled(again, 'Passaporte comum Issued')).toHaveLength(1);
    expect(taken(again, 'Passaporte comum')).toEqual([60_00]);
  });

  it('PLAYER JOURNEY: a Reykjavík-born student renews her Icelandic passport faster on Papers from New Haven: express at the embassy, 39,200 ISK in all in dollars, charged once and issued in two days, the old one canceled then, across a reload; Renew It at 19,000 ISK; until 2026-10-17 no faster service was offered from abroad', () => {
    const sim = life('rp-is-a', 'is-39-reykjavik');
    const old = passportOf(sim.player, sim.now)!;
    expect(old.issuer).toBe('IS');
    const fee = usdOf(19_000_00, 'ISK');
    const faster = usdOf(39_200_00, 'ISK');
    const screen = drawn(sim, PassportPane);
    expect(screen).toContain(`A New One ${'$' + (fee / 100).toFixed(2)} About 6 days; good for 10 years; from abroad`);
    expect(screen).toContain(`Faster ${'$' + (faster / 100).toFixed(2)} 2 days`);
    expect(screen).toContain('At the Embassy of Iceland in Washington, the only post in the US that takes it, at the fee in Iceland: 19,000 ISK, or 39,200 ISK for express');
    expect(drew('documents.apply_passport').map((c) => c.label)).toEqual(['Renew It', 'Renew It Faster']);
    const applied = sim.now;
    expect(press('documents.apply_passport', 'Renew It Faster')).toEqual([expect.stringMatching(/^Applied and paid \$[\d,]+\.\d\d\. It should arrive by /)]);
    expect(taken(sim, 'Íslenskt vegabréf (Icelandic passport), expedited')).toEqual([faster]);
    expect(refusal(sim, 'documents.apply_passport')).toBe('You’ve already applied, and it’s being decided.');
    const again = reload(sim);
    again.advanceTo(applied + 2 * MS_DAY - MS_HOUR);
    expect(passportOf(again.player, again.now)?.id).toBe(old.id);
    again.advanceTo(applied + 2 * MS_DAY + MS_HOUR);
    const renewed = passportOf(again.player, again.now)!;
    expect(renewed.id).not.toBe(old.id);
    expect(documentsOf(again.player).find((d) => d.id === old.id)!.status).toBe('cancelled');
    expect(titled(again, 'Íslenskt vegabréf (Icelandic passport) Issued')).toHaveLength(1);
    expect(taken(again, 'Íslenskt vegabréf (Icelandic passport), expedited')).toEqual([faster]);
  });

  it('PLAYER JOURNEY: a Riga-born student renews her Latvian passport on Papers from New Haven: €140 at the embassy in Washington, in dollars, in up to 56 days; no urgent service there, the command refused; issued on its day across a reload; until 2026-10-17 the embassy in Ireland’s five weeks and its €165 urgent service', () => {
    const sim = life('rp-lv-a', 'lv-25-riga');
    const old = passportOf(sim.player, sim.now)!;
    expect(old.issuer).toBe('LV');
    const fee = usdOf(140_00, 'EUR');
    const issuer = 'Pilsonības un migrācijas lietu pārvalde (Office of Citizenship and Migration Affairs, PMLP/OCMA), under the Ministry of the Interior';
    const screen = drawn(sim, PassportPane);
    expect(screen).toContain(`A New One ${'$' + (fee / 100).toFixed(2)} Up to 56 days; good for 10 years; from abroad`);
    expect(screen).toContain(`Faster Not Offered ${issuer} offers no faster service to applicants abroad`);
    expect(screen).toContain('In person at the Embassy of Latvia in Washington, at its own fees from 1 May 2026: €140 (€115 under 20), in about eight weeks on average; no urgent service.');
    expect(drew('documents.apply_passport').map((c) => c.label)).toEqual(['Renew It']);
    const before = held(sim);
    expect(refusal(sim, 'documents.apply_passport', { expedite: true })).toBe(`${issuer} offers no faster service to applicants abroad.`);
    expect(held(sim)).toBe(before);
    const applied = sim.now;
    expect(press('documents.apply_passport', 'Renew It')).toEqual([expect.stringMatching(/^Applied and paid \$[\d,]+\.\d\d\. It should arrive by /)]);
    expect(taken(sim, 'Latvijas Republikas pilsoņa pase (Latvian citizen\'s passport)')).toEqual([fee]);
    const again = reload(sim);
    again.advanceTo(applied + 56 * MS_DAY - MS_HOUR);
    expect(passportOf(again.player, again.now)?.id).toBe(old.id);
    again.advanceTo(applied + 56 * MS_DAY + MS_HOUR);
    const renewed = passportOf(again.player, again.now)!;
    expect(renewed.id).not.toBe(old.id);
    expect(documentsOf(again.player).find((d) => d.id === old.id)!.status).toBe('cancelled');
    expect(titled(again, 'Latvijas Republikas pilsoņa pase (Latvian citizen\'s passport) Issued')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// tax.s8.idcard: Connecticut's card for somebody not a citizen
// ---------------------------------------------------------------------------

describe('tax.s8.idcard', () => {
  // Renamed on 2026-10-17 (brief 11's KS-ct-idcard, inputs/renames.json): until then 'PLAYER JOURNEY: her number come and
  // her passport reported lost, Get Non-Driver Identification Card is shut with the DMV’s reason and the command refused,
  // nothing taken; her passport renewed from abroad, the card is asked for, comes after SAVE’s ten federal workdays, and
  // is Not For Federal Identification, across a reload; until 2026-10-16 it was issued with no identity document, marked
  // REAL ID', when it came on SAVE's day, unmailed.
  it('PLAYER JOURNEY: her number come and her passport reported lost, Get Non-Driver Identification Card is shut with the DMV’s reason and the command refused, nothing taken; her passport renewed from abroad, the card is asked for, comes by mail twenty business days after SAVE’s ten federal workdays, and is Not For Federal Identification, across a reload; until 2026-10-16 it was issued with no identity document, marked REAL ID, and until 2026-10-17 it came on SAVE’s tenth day', () => {
    const sim = life('rp-uk-a', 'uk-eng-london');
    const passport = passportOf(sim.player, sim.now)!;
    sim.advanceTo(at(2026, 8, 30, 12));
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    sim.advanceTo(ssn.arrivesAt + MS_HOUR);
    sim.must({ kind: 'documents.report_lost', payload: { documentId: passport.id } });
    const why = 'The DMV asks for a primary identity document in force: your passport, with your I-94 and I-20. Apply for a passport or renew it under Your Passport first.';
    drawn(sim, PassportPane);
    expect(drew('documents.apply_idcard').map((c) => [c.disabled, c.title])).toEqual([[true, why]]);
    const before = held(sim);
    expect(refusal(sim, 'documents.apply_idcard')).toBe(why);
    expect([held(sim), documentsOf(sim.player).filter((d) => d.kind === 'idcard')]).toEqual([before, []]);
    // A new passport applied for from abroad, £116.50, in 21 days.
    drawn(sim, PassportPane);
    press('documents.apply_passport', 'Apply For One');
    sim.advanceTo(sim.now + 21 * MS_DAY + MS_HOUR);
    expect(passportOf(sim.player, sim.now)).toBeDefined();
    drawn(sim, PassportPane);
    expect(drew('documents.apply_idcard').map((c) => c.disabled)).toEqual([false]);
    // Asked for on Sunday 11 October 2026, 3 PM: SAVE's ten federal workdays, Columbus Day not among them, to Monday 26
    // October, then the mail's twenty, Veterans Day not among them, to Tuesday 24 November.
    expect(sim.now).toBe(Date.UTC(2026, 9, 11, 19));
    expect(press('documents.apply_idcard')).toEqual(['Non-Driver Identification Card: you paid $28.00. The card comes November 24, 2026. It’s good until May 31, 2029.']);
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    expect([card.name, card.status, card.realId, card.readyAt]).toEqual(['Non-Driver Identification Card, Limited Term', 'pending', false, Date.UTC(2026, 10, 24, 19)]);
    const again = reload(sim);
    again.advanceTo(card.readyAt! + MS_HOUR);
    const come = documentsOf(again.player).find((d) => d.kind === 'idcard')!;
    expect([come.status, come.realId]).toEqual(['valid', false]);
    const words = page(again, come.id);
    expect(words).toContain('It’s marked Not For Federal Identification: it isn’t REAL ID.');
    expect(words).not.toContain('It meets REAL ID.');
    expect(titled(again, 'Non-Driver Identification Card, Limited Term Arrived')).toHaveLength(1);
  });

  // Brief 11's KS-ct-idcard (2026-10-17, docs/research/world/research-ct-idcard.json): the card's term and its mailing
  // as the state publishes them. Until then six years from the day, SLATE's figure, and a citizen's in force at once.
  it('FIXTURE: Connecticut’s card is the DMV’s: $28, seven years to a birthday, mailed within twenty business days, SAVE’s ten first for somebody not a citizen (CGS 1-1h(b)(2); portal.ct.gov, read 2026-10-16)', () => {
    expect(ID_CARDS['us-ct']).toEqual({ name: 'Non-Driver Identification Card', fee: 28, years: 7, toBirthday: true, mailedBusinessDays: 20 });
    expect(NONCITIZEN_ID.saveBusinessDays).toBe(10);
  });

  it('GUARD: the card runs to the first birthday at least seven years on, by New Haven’s calendar: asked for the day before her birthday, seven years and a day; on it, seven years to the day; the day after, to the birthday eight years on', () => {
    // A New Haven life born 14 June 2002 at 7 AM UTC, 3 AM in New Haven; the days asked are TEST SETUP, the rule's own read.
    const person = life('rp-ny-a', 'us-ny-newyork').player;
    expect(new Date(person.birthInstant).toISOString()).toBe('2002-06-14T07:00:00.000Z');
    const card = ID_CARDS['us-ct']!;
    const on = (y: number, m: number, d: number, h = 12) => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: 0 }, 'America/New_York');
    const ends = (at: Instant) => new Date(idCardExpires(card, person, at)!).toISOString().slice(0, 10);
    expect(ends(on(2026, 6, 13))).toBe('2033-06-14');
    expect(ends(on(2026, 6, 14))).toBe('2033-06-14');
    expect(ends(on(2026, 6, 14, 23))).toBe('2033-06-14');
    expect(ends(on(2026, 6, 15))).toBe('2034-06-14');
    expect(ends(on(2026, 8, 24))).toBe('2034-06-14');
    // A card with no birthday runs its years from the day (New York's eight).
    expect(new Date(idCardExpires(ID_CARDS['us-ny']!, person, on(2026, 8, 24))!).toISOString().slice(0, 10)).toBe('2034-08-24');
  });

  it('GUARD: an Employment Authorization Document in force stands as the primary document without a passport (FIXTURE: an OPT permit put on by hand: no play brings OPT and a lost passport together before 2029)', () => {
    const sim = life('rp-uk-a', 'uk-eng-london');
    sim.advanceTo(at(2026, 8, 30, 12));
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    sim.advanceTo(ssn.arrivesAt + MS_HOUR);
    sim.must({ kind: 'documents.report_lost', payload: { documentId: passportOf(sim.player, sim.now)!.id } });
    expect(idCardRefusal(sim.player, sim.now)).toMatch(/^The DMV asks for a primary identity document in force/);
    // FIXTURE: an EAD for OPT, in force.
    documentsOf(sim.player).push({ id: 'ead', kind: 'permit', issuer: 'US', name: 'OPT (Form I-766)', number: 'EAD1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 300 * MS_DAY, destination: 'US' } as PersonDocument);
    expect(idCardRefusal(sim.player, sim.now)).toBeUndefined();
  });

  it('OLDER SAVE: a non-citizen’s card a save from before 2026-10-16 marked REAL ID is put right on opening, once, and its page says Not For Federal Identification', () => {
    const sim = life('rp-uk-a', 'uk-eng-london');
    // FIXTURE: the card as SLATE issued it before 2026-10-16.
    documentsOf(sim.player).push({ id: 'old-card', kind: 'idcard', issuer: 'us-ct', name: 'Non-Driver Identification Card, Limited Term', number: 'ID1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: Date.UTC(2029, 4, 31, 12), realId: true } as PersonDocument);
    const opened = reload(sim);
    const card = documentsOf(opened.player).find((d) => d.id === 'old-card')!;
    expect(card.realId).toBe(false);
    expect(page(opened, card.id)).toContain('It’s marked Not For Federal Identification: it isn’t REAL ID.');
    expect(documentsOf(reload(opened).player).find((d) => d.id === 'old-card')!.realId).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// tax.s8.f1_status: a passport run out under an F-1 (brief 11, 2026-10-17)
// ---------------------------------------------------------------------------

/** TEST SETUP: the work done each midnight, every open piece's every part prepared, as tests/remaining-school.test.ts plays a student who keeps up. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time, as that file tends one. */
const tend = (sim: Simulation, until: Instant) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};

/**
 * Whether a passport run out ends F-1 status while the student is in the US wasn't found (universities advise keeping
 * it valid six months ahead; Study in the States ties the six months to re-entry; tax-checklist.json, tax.s8.f1_status),
 * and SLATE ends nothing on it: the status reads the program and its grace (`usStatusEnds`), never the passport. No
 * test held that until brief 11. A London-born student's passport is drawn issued up to eight years before her first
 * day, so about one in nine runs out before her program ends: seed rp-f1-run-out-45, the first of rp-f1-run-out-1 to 60
 * whose passport runs out before her third year, has hers issued 14 June 2018.
 */
describe('tax.s8.f1_status', () => {
  it('PLAYER JOURNEY: a London-born student who keeps up, her British passport run out on 14 June 2028, mid-program, keeps her F-1 and her status: the F-1 in force to 30 July 2029, no ending raised, the status looked at on the program’s end, 31 May 2029, her standing good, across a reload; the passport alone is out of force, and a new bank turns her away for it', () => {
    let sim = working(life('rp-f1-run-out-45', 'uk-eng-london'));
    const passport = passportOf(sim.player, sim.now)!;
    expect(new Date(passport.expiresAt!).toISOString().slice(0, 10)).toBe('2028-06-14');
    const f1 = () => f1Of(sim.player)!;
    expect(f1().expiresAt).toBe(Date.UTC(2029, 4, 31, 12) + 60 * MS_DAY);
    tend(sim, passport.expiresAt! - MS_DAY);
    expect(passportOf(sim.player, sim.now)?.id).toBe(passport.id);
    tend(sim, at(2028, 6, 15));
    sim = working(reload(sim));
    // The passport out of force, read so by what reads it.
    expect(passportOf(sim.player, sim.now)).toBeUndefined();
    expect(photoIdOf(sim.player, sim.now)).toBeUndefined();
    expect(refusal(sim, 'bank.open_current', { bankId: 'us-wells-fargo' })).toBe('Wells Fargo needs a valid photo ID from a new customer: a passport, a driver’s license or an ID card. You can apply for a passport or an ID card on Papers, under Passport And ID.');
    // The F-1 and the status as they were.
    expect([f1().status, inForce(f1(), sim.now)]).toEqual(['valid', true]);
    expect(sim.player.school!.standing).toBe('good');
    expect(usStatusEnds(sim.player)).toBeUndefined();
    expect(sim.player.usOutOfStatus).toBeUndefined();
    expect(sim.universe.scheduled.filter((i) => i.kind === US_STATUS_KIND && i.status === 'pending').map((i) => i.at)).toEqual([Date.UTC(2029, 4, 31, 12)]);
    expect(Object.values(sim.universe.decisions).filter((d) => d.refType === 'us-status')).toEqual([]);
    expect(sim.universe.notifications.filter((n) => /Status/.test(n.title))).toEqual([]);
    expect(drawn(sim, WorkPane)).toContain('F-1 Student Visa');
  });
});

// ---------------------------------------------------------------------------
// tax.s8.idcard, its term: SLATE's assumption for somebody not a citizen (brief 12's KS-ct-idcard, 2026-10-17)
// ---------------------------------------------------------------------------

/**
 * No source gives Connecticut's term for the card the DMV doesn't verify (docs/research/world/research-ct-idcard.json, its
 * `brief12`): SLATE runs it to the end of the holder's lawful presence, one value, `NONCITIZEN_ID.toLawfulPresence`,
 * written on the card when it's applied for. These hold that Your ID says so, that turning the value (TEST SETUP, as a
 * correction would, and back after) leaves a card already issued, its charge and its notices as they were while the next
 * card takes the new term, and that a card played to its last day runs out then.
 */
describe('tax.s8.idcard, its term', () => {
  /** A British student at Yale with her Social Security number come, as the journeys above have her. */
  const withNumber = (sim: Simulation): Simulation => {
    sim.advanceTo(at(2026, 8, 30, 12));
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    sim.advanceTo(ssn.arrivesAt + MS_HOUR);
    return sim;
  };
  const TERM_NOTE = 'You’re not a US citizen, so your card runs to the end of your lawful presence: your program’s end while you’re at school, or your OPT’s end while you’re on OPT. The state publishes no term for a card it doesn’t verify, so this term is assumed. A card already issued keeps its date if the assumption is ever corrected.';

  it('PLAYER JOURNEY: Your ID on Papers tells a British student that her card’s term, to the end of her lawful presence, is SLATE’s assumption, not the state’s published policy, and that a card already issued keeps its date if that’s corrected; a New York-born citizen is told nothing of it', () => {
    expect(drawn(life('rp-uk-a', 'uk-eng-london'), PassportPane)).toContain(TERM_NOTE);
    const citizen = drawn(life('rp-ny-a', 'us-ny-newyork'), PassportPane);
    expect(citizen).toContain('Get Non-Driver Identification Card');
    expect(citizen).not.toContain('lawful presence');
    expect(citizen).not.toContain('publishes no term');
  });

  it('PLAYER JOURNEY: the term turned off while her card is on its way (TEST SETUP: `NONCITIZEN_ID.toLawfulPresence`, as a correction would change it): across a save and a load it comes on its day, Monday 2 November 2026, keeping 31 May 2029, its $28 and its notice as they were, and a second card is refused while she holds it; reported lost that day, the next runs seven years to her birthday, 14 June 2034, still after SAVE’s ten federal workdays and the mail’s twenty, coming Wednesday 16 December, still Not For Federal Identification, for $28 again, and Your ID says so', () => {
    const sim = withNumber(life('rp-uk-a', 'uk-eng-london'));
    drawn(sim, PassportPane);
    expect(press('documents.apply_idcard')).toEqual(['Non-Driver Identification Card: you paid $28.00. The card comes November 2, 2026. It’s good until May 31, 2029.']);
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    expect([card.status, card.name, card.realId, card.expiresAt]).toEqual(['pending', 'Non-Driver Identification Card, Limited Term', false, Date.UTC(2029, 4, 31, 12)]);
    expect(taken(sim, 'Non-Driver Identification Card')).toEqual([28_00]);
    const posted = JSON.stringify(sim.universe.transactions);
    try {
      NONCITIZEN_ID.toLawfulPresence = false;
      const again = reload(sim);
      // What's on its way comes as it was applied for, and nothing posted moves.
      expect(JSON.stringify(again.universe.transactions)).toBe(posted);
      again.advanceTo(card.readyAt! + MS_HOUR);
      const kept = documentsOf(again.player).find((d) => d.id === card.id)!;
      expect([kept.status, kept.name, kept.realId, kept.expiresAt]).toEqual(['valid', 'Non-Driver Identification Card, Limited Term', false, Date.UTC(2029, 4, 31, 12)]);
      expect(titled(again, 'Non-Driver Identification Card, Limited Term Arrived')).toHaveLength(1);
      expect(taken(again, 'Non-Driver Identification Card')).toEqual([28_00]);
      expect(refusal(again, 'documents.apply_idcard')).toBe('You already hold one in force.');
      expect(drawn(again, PassportPane)).toContain('You’re not a US citizen, and your card runs its full term to a birthday, as anyone’s does. The state publishes no term for a card it doesn’t verify, so this term is assumed.');
      // Reported lost, a new card is applied for, and takes the term as it now stands.
      again.must({ kind: 'documents.report_lost', payload: { documentId: kept.id } });
      const asked = again.now;
      drawn(again, PassportPane);
      expect(press('documents.apply_idcard')).toEqual(['Non-Driver Identification Card: you paid $28.00. The card comes December 16, 2026. It’s good until June 14, 2034.']);
      const next = documentsOf(again.player).find((d) => d.kind === 'idcard' && d.status === 'pending')!;
      expect([next.name, next.realId]).toEqual(['Non-Driver Identification Card', false]);
      // Her birthday, 14 June, the first at least seven years on from 2 November 2026; SAVE to Tuesday 17 November,
      // Veterans Day out, then the mail to Wednesday 16 December, Thanksgiving out: the rule anyone's card follows.
      expect([asked, next.expiresAt, next.readyAt]).toEqual([Date.UTC(2026, 10, 2, 19), Date.UTC(2034, 5, 14, 7), Date.UTC(2026, 11, 16, 19)]);
      expect(next.expiresAt).toBe(idCardExpires(ID_CARDS['us-ct']!, again.player, asked));
      expect(next.readyAt).toBe(businessDaysOn(businessDaysOn(asked, NONCITIZEN_ID.saveBusinessDays, true), ID_CARDS['us-ct']!.mailedBusinessDays!, true));
      expect(taken(again, 'Non-Driver Identification Card')).toEqual([28_00, 28_00]);
      expect(documentsOf(again.player).find((d) => d.id === card.id)!.expiresAt).toBe(Date.UTC(2029, 4, 31, 12));
      const third = reload(again);
      third.advanceTo(next.readyAt! + MS_HOUR);
      const come = documentsOf(third.player).find((d) => d.id === next.id)!;
      expect([come.status, come.expiresAt, come.realId]).toEqual(['valid', next.expiresAt, false]);
      expect(titled(third, 'Non-Driver Identification Card Arrived')).toHaveLength(1);
    } finally {
      NONCITIZEN_ID.toLawfulPresence = true;
    }
  });

  it('PLAYER JOURNEY: a British student who keeps up holds her card to its last day, the program’s end on 31 May 2029, and then it has run out: her row says so, the passport her photo ID, and with school over and no OPT the DMV turns her away for a new one with its reason; SLATE renews no state ID card, so a card run out is applied for anew', () => {
    let sim = working(withNumber(life('rp-uk-a', 'uk-eng-london')));
    drawn(sim, PassportPane);
    press('documents.apply_idcard');
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    tend(sim, card.readyAt! + MS_HOUR);
    expect(card.expiresAt).toBe(Date.UTC(2029, 4, 31, 12));
    tend(sim, card.expiresAt! - MS_HOUR);
    sim = working(reload(sim));
    const held1 = documentsOf(sim.player).find((d) => d.id === card.id)!;
    expect(inForce(held1, sim.now)).toBe(true);
    tend(sim, card.expiresAt! + MS_HOUR);
    expect(inForce(held1, sim.now)).toBe(false);
    expect(photoIdOf(sim.player, sim.now)?.kind).toBe('passport');
    const screen = drawn(sim, PassportPane);
    expect(screen).toContain('Run Out');
    expect(idCardRefusal(sim.player, sim.now)).toBe('On an F-1, the DMV asks for your I-20 and proof that you’re enrolled, and you’re not at school.');
    expect(drew('documents.apply_idcard').map((c) => [c.disabled, c.title])).toEqual([[true, 'On an F-1, the DMV asks for your I-20 and proof that you’re enrolled, and you’re not at school.']]);
    expect(refusal(sim, 'documents.apply_idcard')).toBe('On an F-1, the DMV asks for your I-20 and proof that you’re enrolled, and you’re not at school.');
    expect(taken(sim, 'Non-Driver Identification Card')).toEqual([28_00]);
  });
});
