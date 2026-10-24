/**
 * Brief 15's papers area (2026-10-19, `docs/verification/editorial-2026-10-19/papers/`): the variants of the sentences
 * the second editorial pass rewrote that no older test reads, each played or drawn as the player meets it. Papers is
 * drawn as the player has it (react-dom/server), its Gated buttons pressed by their own onClick, with the harness of
 * tests/remaining-papers.test.ts.
 *
 * - A passport's arrival says what it replaced only where it replaced something: a first passport says nothing of an
 *   old one, a renewal says the old one is canceled, and the travel authorization on it only where there was one. Until
 *   2026-10-19 every arrival said a travel authorization on the replaced passport had ended.
 * - Get on Your ID: a card applied for and on its way, one handed over at the counter, and a free one.
 * - A document reported stolen says stolen on its page.
 * - Naturalizing names the country.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, isValidElement, type FunctionComponent, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig, withFamily } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import { STATE_TAX, STATE_UNRESEARCHED } from '@/engine/content/statetax';
import { owedToState, statePlanRefusal, waiverRefusal } from '@/engine/systems/statetax';
import { earningsOf, recordWages } from '@/engine/systems/earnings';
import { formatMoney } from '@/engine/core/money';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate } from '@/engine/core/time';
import { documentsOf, licensingOf, mayDrive, mayEnter, passportOf, passportRefusal, type PersonDocument } from '@/engine/systems/documents';
import { CITIES } from '@/engine/content/geography';
import { VISAS } from '@/engine/content/visas';
import { VISITS, VISIT_KIND } from '@/engine/systems/papervisits';
import { CITIZENSHIP_KIND } from '@/engine/systems/citizenship';
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

const { PassportPane } = await import('@/ui/papers/Documents');

const YEAR = 365.25 * MS_DAY;
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** A life with no papers yet, so each test hands it exactly the ones it means (as tests/documents.test.ts makes one). */
const life = (seed: string, where = 'us-ny-newyork') => { const sim = quickSave({ startLocationId: where, homeRegionId: where, wealth: 'wealthy' }, seed); sim.player.documents = []; return sim; };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);

function drawn(sim: Simulation, pane: FunctionComponent): string {
  h.sim = sim;
  h.clicks = [];
  return onScreen(renderToStaticMarkup(createElement(pane)));
}
function press(feature: string): string[] {
  const found = h.clicks.filter((c) => c.feature === feature);
  expect(found, `one ${feature} button`).toHaveLength(1);
  h.toasts = [];
  found[0]!.onClick!();
  return h.toasts;
}
function text(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((n) => text(n as ReactNode)).join('');
  if (!isValidElement(node)) return '';
  return text((node.props as { children?: ReactNode }).children);
}
function page(sim: Simulation, id: string): string {
  h.sim = sim;
  const found = resolveLook(sim, subject('document', id)) as Looked;
  return `${text(found.summary)} ${text(found.body)}`;
}

describe('batch 1: documents, as the second pass says them', () => {
  it('a passport’s arrival names what it replaced only when it replaced something', () => {
    const sim = life('ed15-passport');
    const first = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    sim.advanceTo(first.readyAt + MS_HOUR);
    const one = passportOf(sim.player, sim.now)!;
    const arrived = titled(sim, `${one.name} Issued`).map((n) => n.body);
    expect(arrived).toEqual([`Your ${one.name}, ${one.number}, has arrived. It’s good until ${formatDate(one.expiresAt!, sim.zone)}.`]);
    // Renewed with no travel authorization on it: the old one is canceled, and nothing else is said.
    const second = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    sim.advanceTo(second.readyAt + MS_HOUR);
    const two = passportOf(sim.player, sim.now)!;
    expect(two.id).not.toBe(one.id);
    expect(titled(sim, `${two.name} Issued`).map((n) => n.body).at(-1)).toBe(`Your ${two.name}, ${two.number}, has arrived. It’s good until ${formatDate(two.expiresAt!, sim.zone)}. Your old passport is canceled.`);
    // FIXTURE: a travel authorization on the one in force, as a save from before 2026-10-09 holds; renewed again, it ends with it.
    const eta: PersonDocument = { id: 'ed15-eta', kind: 'authorization', issuer: 'GB', name: 'ETA', number: 'E1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 2 * YEAR, destination: 'GB', passportId: two.id };
    documentsOf(sim.player).push(eta);
    const third = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    sim.advanceTo(third.readyAt + MS_HOUR);
    const three = passportOf(sim.player, sim.now)!;
    expect(eta.status).toBe('cancelled');
    expect(titled(sim, `${three.name} Issued`).map((n) => n.body).at(-1)).toBe(`Your ${three.name}, ${three.number}, has arrived. It’s good until ${formatDate(three.expiresAt!, sim.zone)}. Your old passport is canceled, and the travel authorization issued on it ended with it.`);
  });

  it('Get on Your ID says a card handed over at the counter is yours now, and a free one names no fee', () => {
    // New York's Non-Driver ID Card, handed over to a citizen at once, for $14.00, good eight years.
    const ny = life('ed15-id-ny');
    drawn(ny, PassportPane);
    const [said] = press('documents.apply_idcard');
    const card = documentsOf(ny.player).find((d) => d.kind === 'idcard')!;
    expect(card.status).toBe('valid');
    expect(said).toBe(`You have your Non-Driver ID Card now, for $14.00. It’s good until ${formatDate(card.expiresAt!, ny.zone)}.`);
    // Mexico City's INE card: free, to a citizen of eighteen or more, with no end the game holds.
    const mx = life('ed15-id-mx', 'mx-cmx-mexicocity');
    drawn(mx, PassportPane);
    expect(press('documents.apply_idcard')).toEqual(['You have your Credencial Para Votar (INE) now.']);
  });

  it('brief 17: Your ID says what Get costs, how the card comes and how long it’s good for, before it’s pressed, as the command charges and issues it', () => {
    // New York's, handed over at once to a citizen; Connecticut's, mailed in 20 business days and run to a birthday; Mexico
    // City's, free; and Connecticut's for a London-born student on an F-1, SAVE's check first. Until 2026-10-20 the panel
    // drew Get alone, and the fee, the wait and the term came only in the toast after it.
    const ny = life('ed17-id-ny');
    expect(drawn(ny, PassportPane)).toContain('It costs $14.00, and you have it at once. It’s good for eight years.');
    expect(press('documents.apply_idcard')[0]).toMatch(/^You have your Non-Driver ID Card now, for \$14\.00\./);
    const ct = life('ed17-id-ct', 'us-ct-newhaven');
    expect(drawn(ct, PassportPane)).toContain('It costs $28.00 and comes by mail 20 business days after you apply. It’s good until your first birthday after seven years.');
    expect(press('documents.apply_idcard')[0]).toMatch(/^You applied for the Non-Driver Identification Card and paid \$28\.00\./);
    const mx = life('ed17-id-mx', 'mx-cmx-mexicocity');
    expect(drawn(mx, PassportPane)).toContain('It’s free, and you have it at once.');
    const f1 = createSave(1, 'ed17-id-f1', { ...newLifeConfig(), homeRegionId: 'uk-eng-london' });
    expect(drawn(f1, PassportPane)).toContain('It costs $28.00. The DMV checks your lawful presence first, which takes 10 federal workdays, and the card comes by mail 20 business days after that.');
  });

  it('a document reported stolen says stolen on its page, and one reported lost says lost', () => {
    const sim = life('ed15-stolen');
    const first = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    sim.advanceTo(first.readyAt + MS_HOUR);
    const passport = passportOf(sim.player, sim.now)!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: passport.id, stolen: true } });
    expect(page(sim, passport.id)).toContain(`You reported it stolen, so the number ending ${passport.number.replace(/\W/g, '').slice(-4)} is canceled.`);
    passport.stolen = undefined;
    expect(page(sim, passport.id)).toContain(`You reported it lost, so the number ending ${passport.number.replace(/\W/g, '').slice(-4)} is canceled.`);
  });

  it('naturalizing names the country it made you a citizen of', () => {
    for (const [iso, said, title] of [['MX', 'Mexico', 'Mexico'], ['GB', 'the United Kingdom', 'The United Kingdom']] as const) {
      const sim = life(`ed15-naturalize-${iso}`);
      // FIXTURE: an application for citizenship being decided, as a save from before 2026-10-16 can hold one.
      sim.player.naturalizing = { iso, readyAt: sim.now + MS_HOUR };
      sim.schedule({ at: sim.now + MS_HOUR, kind: CITIZENSHIP_KIND, label: 'Citizenship Decided', category: 'system', priority: 20, payload: { personId: sim.player.id } });
      sim.advanceTo(sim.now + 2 * MS_HOUR);
      expect(titled(sim, `A Citizen Of ${title}`).map((n) => n.body)).toEqual([`You were naturalized on ${formatDate(sim.now - MS_HOUR, sim.zone)}. You’re now a citizen of ${said}, and still a citizen of the country you were born in.`]);
    }
  });
});

describe('batch 1: Residence Abroad, pressed', () => {
  it('Naturalize, on a green card held five years as an older save holds one, says what was applied for and what it cost', async () => {
    const { WorkPane } = await import('@/ui/papers/Documents');
    const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'uk-eng-london', wealth: 'wealthy' }, 'ed15-naturalize-us');
    // FIXTURE: a US green card issued six years ago, as a save from before 2026-10-09 can hold one.
    documentsOf(sim.player).push({ id: 'ed15-gc', kind: 'permit', issuer: 'US', name: 'Green Card', number: 'GC1', status: 'valid', issuedAt: sim.now - 6 * YEAR, destination: 'US', route: 'us-green-card' } as PersonDocument);
    drawn(sim, WorkPane);
    const [said] = press('documents.naturalize');
    expect(said).toMatch(/^Applied for citizenship and paid \$[\d,]+\.\d{2}\.$/);
  });
});

describe('batch 1: the refusals and the fine print no older test reads', () => {
  it('a US renewal by mail says its terms in sentences under Your Passport', () => {
    const sim = life('ed15-renewal');
    const first = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    sim.advanceTo(first.readyAt + MS_HOUR);
    expect(drawn(sim, PassportPane)).toContain('You can renew by mail on Form DS-82: $130 to the Department of State, with no acceptance fee. Your most recent passport has to have been issued within the last 15 years, when you were 16 or older, and never reported lost or stolen.');
  });

  it('a citizenship with no passport office in the game, and a town with no driving rules, say so without promising more', () => {
    const sim = life('ed15-no-office');
    // FIXTURE: an Italian citizen, whose passport office the game doesn't have.
    sim.player.citizenshipId = 'it';
    expect(passportRefusal(sim.player)).toBe('Your country’s passport office isn’t in the game.');
    const nowhere = CITIES.all().find((c) => licensingOf(c.id) === undefined)!;
    expect(mayDrive(sim.player, nowhere.id, sim.now)).toEqual({ ok: false, why: `The game doesn’t have the driving rules for ${nowhere.name}.` });
  });

  it('a visa interview missed ends the application with no step the game doesn’t offer', () => {
    const sim = life('ed15-interview');
    const at = sim.now + 2 * MS_HOUR;
    // FIXTURE: a US visitor visa being decided, its interview elsewhere, as a save from before 2026-10-09 can hold one.
    const doc = { id: 'ed15-b1b2', kind: 'visa', issuer: 'US', name: 'B-1/B-2 Visitor Visa', number: 'V1', status: 'pending', appliedAt: sim.now, readyAt: at, destination: 'US', visit: { rule: 'us-interview', at, cityId: 'mx-cmx-mexicocity' } } as PersonDocument;
    documentsOf(sim.player).push(doc);
    sim.schedule({ at, kind: VISIT_KIND, label: VISITS['us-interview'].what, category: 'personal', priority: 33, payload: { personId: sim.player.id, documentId: doc.id } });
    sim.advanceTo(at + MS_HOUR);
    expect(doc.status).toBe('cancelled');
    expect(titled(sim, 'An Application Ended').map((n) => n.body)).toEqual(['You missed the visa interview: a no-show closes the application, and its fee isn’t refunded.']);
  });

  it('Going Abroad’s fine print for a visa reads as sentences, every figure and its source kept', () => {
    const fine = (key: string) => `${VISAS[key]!.name}: ${VISAS[key]!.basis}`;
    // Nothing takes an application since 2026-10-09, so the bases say no time the game took to decide one (brief 17,
    // 2026-10-20: until then "issuing it takes a week (estimated)", "In the game it takes 30 days to decide").
    expect(fine('US<MX')).toBe('B-1/B-2 Visitor Visa: The application fee is $185. The interview is about five months away at the Mexico City consulate (as of September 29, 2026, from a secondary source). It’s good for ten years, for multiple entries, by reciprocity.');
    expect(fine('US<BR')).toContain('(as of September 29, 2026, from a secondary source). The waits at Brazil’s posts weren’t found. It’s good for ten years');
    expect(fine('CA<MX')).toBe('Visitor Visa (Canada): CAD 100, and CAD 85 for biometrics. A decision takes about 18 days after biometrics for a Mexican applicant (from a secondary source). It’s good for up to ten years, or until the passport runs out.');
    expect(fine('CA<BR')).toContain('for a Mexican applicant (from a secondary source). The time for a Brazilian applicant wasn’t found.');
    expect(fine('AU<MX')).toBe('Visitor Visa (Subclass 600): AUD 250 from July 1, 2026 (from a secondary source, since Home Affairs’ own pages couldn’t be read). It’s granted for three, six or twelve months.');
    expect(fine('BR<US')).toBe('Brazil e-Visa: US$80.90 through VFS Global, decided within ten business days. It’s good for ten years, for multiple entries, for a US citizen (from a secondary source), and the game uses the same for Canadians and Australians.');
    expect(fine('MX<BR')).toBe('Mexico Electronic Visa: US$10 from February 5, 2026, for a stay under 180 days, flying in (from Deloitte and the press, secondary sources).');
    // And the visit a passport would let a US citizen make, said as a sentence after "… would let you in for a week's visit."
    const sim = life('ed15-stay');
    sim.must({ kind: 'documents.apply_passport', payload: {} });
    sim.advanceBy(43 * MS_DAY);
    expect(mayEnter(sim.player, 'GB', sim.now).stay).toBe('A visitor can stay up to 180 days.');
  });
});

describe('batch 2: a lien announced, or announced and never filed, says so', () => {
  it('California’s notice of intent reads as a lien still to be filed, and one dropped as never filed', async () => {
    const { StateLienAndPenalty } = await import('@/ui/components/LienPanels');
    const sim = life('ed15-lien-intent');
    // FIXTURE: a 2026 return with $600.00 owed to California, its lien announced, as `stateLienStep` leaves one.
    sim.player.returns = { '2026': { year: 2026, stateDue: { 'us-ca': { owed: 600_00, lien: { name: 'Notice Of State Tax Lien', status: 'intent', trigger: 'collection', amount: 600_00, recordedAt: 'the county recorder and the Secretary of State', intentAt: sim.now, fee: 0, history: [] } } } } } as never;
    const drawLien = () => drawn(sim, (() => createElement(StateLienAndPenalty, { year: 2026, state: 'us-ca' })) as FunctionComponent);
    expect(drawLien()).toContain('Notice Of State Tax Lien · Notice Of Intent Sent. It’s to be filed for $600.00, with the county recorder and the Secretary of State, unless you pay it or set up a payment plan first.');
    expect(drawLien()).not.toContain('It was filed for');
    (sim.player.returns as Record<string, { stateDue: Record<string, { lien: { status: string } }> }>)['2026']!.stateDue['us-ca']!.lien.status = 'dropped';
    expect(drawLien()).toContain('Notice Of State Tax Lien · Not Filed. It was never filed, because what it was for was paid or put under a payment plan first.');
  });
});

describe('batch 2: the Tax Returns tab, played', () => {
  it('a 2027 return left owing: the IRS plan says how it’s decided with and without a number, the state’s plan what it covers, a plan off direct debit says so, an unresearched state says the game doesn’t have its rules, and a UK year says its refund', async () => {
    const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
    const at = (year: number, month: number, day: number) => instantFromZoned({ year, month, day, hour: 12, minute: 0 }, 'America/New_York');
    // Ada Cole from the Scraping family, as tests/scope-taxpapers.test.ts plays her: her 2027 return filed on
    // 1 February 2028 with her money in a CD, so the IRS and Connecticut are both owed.
    const sim = createSave(1, 'r3-tax-scraping', { ...withFamily(newLifeConfig(), 'scraping'), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    sim.advanceTo(at(2027, 2, 1));
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    sim.advanceTo(at(2028, 2, 1));
    const own = (kind: string) => sim.ledger.accountsOf(sim.player.id).find((a) => a.kind === kind && !a.closedAt && a.category !== 'term')!;
    const checking = sim.universe.accounts[sim.player.primaryAccountId!]!;
    sim.must({ kind: 'bank.transfer', payload: { fromId: own('savings').id, toId: checking.id, amount: own('savings').balance } });
    sim.must({ kind: 'bank.open_term', payload: { amount: checking.balance } });
    sim.must({ kind: 'tax.file', payload: { year: 2027 } });
    const screen = drawn(sim, PapersWorkspace as FunctionComponent);
    // From 2026-10-20 (brief 16, section 7) each plan says what it does for you, then what it costs, then what a missed
    // payment does. Until then the IRS's said a monthly plan "has a setup fee." above "Setup fee: $0.00." for her, a low
    // income by direct debit, and Connecticut's said nothing of a missed payment but that DRS publishes no rule for one.
    expect(screen).toContain('With a Social Security number you apply online and the IRS answers within a minute; without one, your application goes by mail and the answer takes 30 days. A short-term plan gives you 180 days to pay, with no fee. A monthly plan for up to $50,000.00 has a setup fee that depends on your income and on paying by direct debit.');
    expect(screen).toContain('Setup fee: $0.00.');
    expect(screen).toContain('Connecticut DRS’s own payment plan spreads what you owe it over 2 to 12 months, and collection stops while it’s in force. It covers up to $50,000.00, and it’s separate from any plan with the IRS. There’s no fee. Interest keeps adding up while the plan runs. If you miss a payment, the plan ends and collection starts again.');
    expect(screen).toContain('Connecticut DRS doesn’t publish what happens after a missed payment, so in the game the plan ends.');
    // Applied for off direct debit, the CD broken to pay its fee: the note beside Each Month says so, where it said "Paid by you".
    const cd = sim.ledger.accountsOf(sim.player.id).find((a) => a.category === 'term' && !a.closedAt)!;
    sim.must({ kind: 'bank.break_term', payload: { accountId: cd.id } });
    sim.must({ kind: 'tax.apply_plan', payload: { kind: 'long', directDebit: false } });
    sim.advanceTo(sim.now + 2 * MS_HOUR);
    expect(sim.player.taxPlan!.status).toBe('active');
    expect(drawn(sim, PapersWorkspace as FunctionComponent)).toMatch(/EACH MONTH \$[\d,.]+ Not by direct debit|Each Month \$[\d,.]+ Not by direct debit/);
    // FIXTURE: the year's Connecticut balance moved under New Jersey, whose collection rules the game doesn't have.
    const r = sim.player.returns!['2027']!;
    r.stateDue = { 'us-nj': r.stateDue!['us-ct']! };
    const nj = drawn(sim, PapersWorkspace as FunctionComponent);
    expect(nj).toContain(STATE_UNRESEARCHED);
    expect(STATE_UNRESEARCHED).toBe('The game doesn’t have this state’s collection rules, so the balance is kept with no penalty, interest, notice or plan added.');
    expect(nj.match(/None added: the game doesn’t have this state’s rules/g)).toHaveLength(2);
    expect(statePlanRefusal(sim, sim.player, 'us-nj', 12)).toBe(STATE_UNRESEARCHED);
    // FIXTURE: a UK tax year's earnings and withholding, as work in Britain left them until the career went.
    const record = earningsOf(sim.player);
    record.ukYears = { '2026': 4_000_00 };
    record.ukWithheld = { '2026': 500_00 };
    expect(drawn(sim, PapersWorkspace as FunctionComponent)).toMatch(/2026–27: \$4,000\.00 earned and \$500\.00 withheld by payers\. It settles on January 31, 2028\. As things stand, you’d get a refund of \$500\.00\./);
  }, 120_000);

  /**
   * A state's plan before Apply For The Plan, on California's, whose rules carry a fee and a notice before a plan ends
   * (from 2026-10-20, brief 16, section 7): what it costs and what a missed payment does are said there, and the monthly
   * estimate under Pay Over counts the $34 the plan adds to what's owed, as the plan's own monthly payment does. Until
   * then the estimate left the fee out and read less than the plan then took. TEST SETUP: a 2026 return filed on
   * 1 February 2027 with the bank emptied first, as tests/state-tax.test.ts owes one.
   */
  it('California’s plan says its fee and what a missed payment does, and its estimate is the monthly payment the plan then makes', async () => {
    const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');
    const NY = 'America/New_York';
    const sim = quickSave({ startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles', wealth: 'wealthy' }, 'ed16-ca-plan');
    recordWages(sim.player, instantFromZoned({ year: 2026, month: 5, day: 1, hour: 9, minute: 0 }, NY), NY, { gross: 40_000_00 });
    sim.advanceTo(instantFromZoned({ year: 2027, month: 2, day: 1, hour: 12, minute: 0 }, NY));
    for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] });
    sim.must({ kind: 'tax.file', payload: { year: 2026 } });
    const owed = owedToState(sim.player, 'us-ca', sim.now);
    expect(owed).toBeGreaterThan(0);
    const screen = drawn(sim, PapersWorkspace as FunctionComponent);
    expect(screen).toContain('California FTB’s own payment plan spreads what you owe it over 1 to 60 months, and collection stops while it’s in force. It covers up to $25,000.00, and it’s separate from any plan with the IRS. A $34.00 fee is added to what you owe. Interest and the late-payment penalty keep adding up while the plan runs. If you miss a payment, California FTB sends an Intent to Terminate, and you have 30 days to press Catch Up before the plan ends and collection starts again. A new balance owed while the plan is in force counts as a missed payment.');
    // California publishes what a missed payment does, so the fine print doesn't say it isn't published.
    expect(screen).not.toContain('doesn’t publish what happens after a missed payment');
    const estimate = Math.ceil((owed + 34_00) / 60);
    expect(screen).toContain(`That’s about ${formatMoney(estimate, 'USD')} a month over 60 months.`);
    expect(sim.must<{ monthly: number }>({ kind: 'tax.apply_state_plan', payload: { state: 'us-ca', months: 60 } }).monthly).toBe(estimate);
  }, 120_000);
});

describe('batch 2: the states’ words that no life in New Haven reaches, said as sentences', () => {
  it('each notice fragment reads as a sentence once the notice capitalizes it, and a lien’s effect and a long plan’s terms are sentences too', () => {
    const letter = (state: keyof typeof STATE_TAX, code: string) => STATE_TAX[state].nonFiler.letters.find((l) => l.code === code)!.words;
    expect(letter('us-la', 'Notice Of Proposed Assessment')).toBe('you didn’t file, so it estimated the tax from what the IRS reported. You have 30 days to file or respond.');
    expect(letter('us-hi', 'Proposed Assessment')).toBe('you didn’t file, so it worked out the tax from what was reported. You have 30 days to file your own or object.');
    expect(STATE_TAX['us-oh'].notices.find((n) => n.code === 'bL0006')!.words).toBe('you have 60 days to pay or appeal.');
    expect(STATE_TAX['us-oh-columbus'].lien!.effect).toBe('It’s a judgment against you.');
    expect(STATE_TAX['us-nm'].plan.long!.how).toBe('It runs 13 to 72 months, with a lien filed as its security, and it’s approved online.');
  });

  it('a waiver asked for too late says what the rule asks, in the active voice', () => {
    const sim = life('ed15-waiver');
    const YEAR_MS = 365 * MS_DAY;
    // FIXTURE: an Oregon year with its three-year penalty, paid off two years ago.
    const r = { year: 2001, stateDue: { 'us-or': { owed: 0, threeYear: { amount: 100_00, at: sim.now - 3 * YEAR_MS }, payments: [{ at: sim.now - 2 * YEAR_MS, amount: 100_00, tax: 0, penalty: 100_00, interest: 0, how: 'payment' }] } } } as never;
    expect(waiverRefusal(sim, r, 'us-or')).toBe('You have to ask for a waiver before paying in full or within a year after, and that year has passed.');
  });
});
