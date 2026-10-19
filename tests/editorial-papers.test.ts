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
import { quickSave } from '@/engine';
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
const life = (seed: string, where = 'us-ny-newyork') => { const sim = quickSave({ startLocationId: where, homeRegionId: where, livesWhereBorn: true, wealth: 'wealthy' }, seed); sim.player.documents = []; return sim; };
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
    expect(fine('US<MX')).toBe('B-1/B-2 Visitor Visa: The application fee is $185. The interview is about five months away at the Mexico City consulate (as of September 29, 2026, from a secondary source), and issuing it takes a week (estimated). It’s good for ten years, for multiple entries, by reciprocity.');
    expect(fine('US<BR')).toContain('(as of September 29, 2026, from a secondary source), and the game uses the same wait for Brazil’s posts, whose waits weren’t found, and issuing it takes a week (estimated).');
    expect(fine('CA<MX')).toBe('Visitor Visa (Canada): CAD 100, and CAD 85 for biometrics. A decision takes about 18 days after biometrics for a Mexican applicant (from a secondary source). It’s good for up to ten years, or until the passport runs out.');
    expect(fine('CA<BR')).toContain('for a Mexican applicant (from a secondary source), and the game uses the same for a Brazilian.');
    expect(fine('AU<MX')).toBe('Visitor Visa (Subclass 600): AUD 250 from July 1, 2026 (from a secondary source, since Home Affairs’ own pages couldn’t be read). In the game it takes 30 days to decide and is granted for a year, the longest of the three, six and twelve months it gives (both estimated).');
    expect(fine('BR<US')).toBe('Brazil e-Visa: US$80.90 through VFS Global, decided within ten business days. It’s good for ten years, for multiple entries, for a US citizen (from a secondary source), and the game uses the same for Canadians and Australians.');
    expect(fine('MX<BR')).toBe('Mexico Electronic Visa: US$10 from February 5, 2026, for a stay under 180 days, flying in (from Deloitte and the press, secondary sources). In the game it takes three days to decide (estimated).');
    // And the visit a passport would let a US citizen make, said as a sentence after "… would let you in for a week's visit."
    const sim = life('ed15-stay');
    sim.must({ kind: 'documents.apply_passport', payload: {} });
    sim.advanceBy(43 * MS_DAY);
    expect(mayEnter(sim.player, 'GB', sim.now).stay).toBe('A visitor can stay up to 180 days.');
  });
});
