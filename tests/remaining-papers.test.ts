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
 *   was marked REAL ID.
 *
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
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeConfig, withFamily } from '@/engine/world/bootstrap';
import { exchange } from '@/engine/content/currency';
import { documentsOf, inForce, passportOf, photoIdOf, type PersonDocument } from '@/engine/systems/documents';
import { US_STATUS_KIND, f1Of, usStatusEnds } from '@/engine/systems/permission';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf } from '@/engine/systems/coursework';
import { idCardRefusal } from '@/engine/systems/identity';
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
    expect(refusal(sim, 'bank.open_current', { bankId: 'us-wells-fargo' })).toBe('Wells Fargo asks a new customer for a photo ID in force: a passport, a license or an ID card. Papers has each.');
    expect(idCardRefusal(sim.player, sim.now)).toBe('The DMV asks for a primary identity document in force: your passport, with your I-94 and I-20. Apply for or renew it on Papers first.');
  });

  it('PLAYER JOURNEY: a New York-born student’s papers are her license alone: a new bank takes it until it runs out on 14 June 2028, and then turns her away, the state ID card on Papers the next step, which it then takes', () => {
    const sim = life('rp-ny-a', 'us-ny-newyork');
    expect(kindsOf(sim)).toEqual(['license us-ny valid']);
    const license = documentsOf(sim.player)[0]!;
    expect(new Date(license.expiresAt!).toISOString().slice(0, 10)).toBe('2028-06-14');
    expect(photoIdOf(sim.player, sim.now)?.id).toBe(license.id);
    sim.advanceTo(license.expiresAt! + MS_HOUR);
    expect(photoIdOf(sim.player, sim.now)).toBeUndefined();
    expect(refusal(sim, 'bank.open_current', { bankId: 'us-wells-fargo' })).toBe('Wells Fargo asks a new customer for a photo ID in force: a passport, a license or an ID card. Papers has each.');
    // Its page says it's out of force; nothing in SLATE renews a license since the cars went, and the ID card is drawn.
    expect(page(sim, license.id)).toContain('Run out on June 14, 2028, it no longer counts for anything.');
    const screen = drawn(sim, PassportPane);
    expect(screen).toContain('Run Out');
    expect(drew('documents.apply_idcard').map((c) => [c.label, c.disabled])).toEqual([['Get Non-Driver Identification Card', false]]);
    const before = held(sim);
    expect(press('documents.apply_idcard')).toEqual([expect.stringMatching(/^Non-Driver Identification Card, for \$28\.00; good until /)]);
    expect(before - held(sim)).toBe(28_00);
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    // A citizen's card is REAL ID, and its page says so.
    expect(card.realId).toBe(true);
    expect(page(sim, card.id)).toContain('It meets REAL ID.');
    expect(photoIdOf(sim.player, sim.now)?.id).toBe(card.id);
  });
});

// ---------------------------------------------------------------------------
// tax.s8.passport: the office's terms where the applicant is
// ---------------------------------------------------------------------------

describe('tax.s8.passport', () => {
  it('PLAYER JOURNEY: a London-born student renews her British passport on Papers from New Haven: £116.50, the overseas fee, in dollars; no Renew It Faster, the Fast Track not sold abroad, and the command refused; issued in 21 days, the old one canceled on the new one’s day, once across a reload; until 2026-10-16 £102 and Fast Track offered', () => {
    const sim = life('rp-uk-b', 'uk-eng-london');
    const old = passportOf(sim.player, sim.now)!;
    const fee = usdOf(116_50, 'GBP');
    expect(fee).not.toBe(usdOf(102_00, 'GBP'));
    const screen = drawn(sim, PassportPane);
    expect(screen).toContain(`A New One ${'$' + (fee / 100).toFixed(2)} About 21 days; good for 10 years; from abroad`);
    expect(screen).toContain('Faster Not Offered HM Passport Office (Home Office) sells no faster service to an applicant abroad');
    expect(screen).toContain('An adult passport applied for online from outside the UK: £116.50 from 8 April 2026 (£130 on paper).');
    expect(drew('documents.apply_passport').map((c) => c.label)).toEqual(['Renew It']);
    const before = held(sim);
    expect(refusal(sim, 'documents.apply_passport', { expedite: true })).toBe('HM Passport Office (Home Office) sells no faster service to an applicant abroad.');
    expect(held(sim)).toBe(before);
    const applied = sim.now;
    expect(press('documents.apply_passport', 'Renew It')).toEqual([expect.stringMatching(/^Applied, for \$/)]);
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
    expect(press('documents.apply_passport', 'Renew It')).toEqual([expect.stringMatching(/^Applied, for \$130\.00\. /)]);
    expect(taken(sim, 'U.S. Passport Book, renewed on Form DS-82')).toEqual([130_00]);
    sim.advanceTo(sim.now + 43 * MS_DAY);
    const renewed = passportOf(sim.player, sim.now)!;
    expect(renewed.id).not.toBe(old.id);
    sim.must({ kind: 'documents.report_lost', payload: { documentId: renewed.id } });
    drawn(sim, PassportPane);
    expect(press('documents.apply_passport', 'Apply For One')).toEqual([expect.stringMatching(/^Applied, for \$165\.00\. /)]);
    expect(taken(sim, 'U.S. Passport Book')).toEqual([165_00]);
  });
});

// ---------------------------------------------------------------------------
// tax.s8.idcard: Connecticut's card for somebody not a citizen
// ---------------------------------------------------------------------------

describe('tax.s8.idcard', () => {
  it('PLAYER JOURNEY: her number come and her passport reported lost, Get Non-Driver Identification Card is shut with the DMV’s reason and the command refused, nothing taken; her passport renewed from abroad, the card is asked for, comes after SAVE’s ten federal workdays, and is Not For Federal Identification, across a reload; until 2026-10-16 it was issued with no identity document, marked REAL ID', () => {
    const sim = life('rp-uk-a', 'uk-eng-london');
    const passport = passportOf(sim.player, sim.now)!;
    sim.advanceTo(at(2026, 8, 30, 12));
    const ssn = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    sim.advanceTo(ssn.arrivesAt + MS_HOUR);
    sim.must({ kind: 'documents.report_lost', payload: { documentId: passport.id } });
    const why = 'The DMV asks for a primary identity document in force: your passport, with your I-94 and I-20. Apply for or renew it on Papers first.';
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
    expect(press('documents.apply_idcard')).toEqual([expect.stringMatching(/^Non-Driver Identification Card, for \$28\.00; good until May 31, 2029\.$/)]);
    const card = documentsOf(sim.player).find((d) => d.kind === 'idcard')!;
    expect([card.name, card.status, card.realId]).toEqual(['Non-Driver Identification Card, Limited Term', 'pending', false]);
    const again = reload(sim);
    again.advanceTo(card.readyAt! + MS_HOUR);
    const come = documentsOf(again.player).find((d) => d.kind === 'idcard')!;
    expect([come.status, come.realId]).toEqual(['valid', false]);
    const words = page(again, come.id);
    expect(words).toContain('It’s marked Not For Federal Identification: it isn’t REAL ID.');
    expect(words).not.toContain('It meets REAL ID.');
    expect(titled(again, 'Non-Driver Identification Card, Limited Term Arrived')).toHaveLength(1);
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
    expect(refusal(sim, 'bank.open_current', { bankId: 'us-wells-fargo' })).toBe('Wells Fargo asks a new customer for a photo ID in force: a passport, a license or an ID card. Papers has each.');
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
