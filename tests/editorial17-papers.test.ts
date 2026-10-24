/**
 * Brief 17's papers area (2026-10-20, the owner's "Final Comprehensive Writing And Continuity Pass", sections 3 and 8):
 * what Papers says in sight before a button is pressed, where until then it was in the fine print, the toast after it,
 * or not said at all, and the words a player met that named nothing. Each test draws Papers as the player has it
 * (react-dom/server), with the harness of tests/remaining-papers.test.ts, and reads what's outside a Sources And Estimates
 * (`Fine`, a native disclosure) as what's in sight.
 *
 * - Your Long-Term Conditions says, on each row, what leaving it untreated does, from the rule's own figures; high blood
 *   pressure, which nothing charges, says nothing.
 * - A Dental Plan says what it pays and, for Yale's, that it can't be canceled once paid, before Buy Dental.
 * - The Marketplace says what you're enrolled in.
 * - Care And Its Bills puts an emergency's care in Title Case, the hospital's name as it's spelled.
 * - No Returns Yet says the F-1 rule to an F-1 life alone.
 * - Going Abroad says that nothing can be applied for here, in sight, and an authorization's years in words; each empty
 *   document list names what it lists.
 * - Unemployment, where no state pays a claim, says so as File A Claim's own refusal does.
 *
 * FIXTURE lives are quick-saves (`quickSave`), each said where it's made, their conditions, plans and bills set by hand
 * where no played life holds them on the day.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { healthOf } from '@/engine/systems/health';
import { CHRONIC } from '@/engine/content/safetynet';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
}));

// The screens' kept tab, set by the test: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});

// Without the original: it imports the looks, which import it back. `run` is the save's own execute.
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

const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

const words = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
/** Papers on a tab: everything it says, and what it says in sight, every Sources And Estimates (a `<details>`) left out. */
function papers(sim: Simulation, tab: string) {
  h.sim = sim;
  h.tabs = { 'tab:/workspace/papers': tab };
  const html = renderToStaticMarkup(createElement(PapersWorkspace as FunctionComponent));
  return { all: words(html), inSight: words(html.replace(/<details[\s\S]*?<\/details>/g, ' ')) };
}
/** A New Haven life with no papers or conditions of its own yet, so each test hands it exactly what it means. */
const life = (seed: string) => { const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven', wealth: 'wealthy' }, seed); sim.player.documents = []; return sim; };

describe('brief 17: Health Cover says, in sight, what an action changes', () => {
  it('Your Long-Term Conditions says on each row what leaving it untreated does, from the rule’s figures; high blood pressure, which nothing charges, says nothing', () => {
    const sim = life('ed17-chronic');
    // FIXTURE: five conditions, kept up but for asthma, as no life draws on its first day.
    healthOf(sim.player).chronic = { depression: { treated: true }, asthma: { treated: false }, diabetes: { treated: true, typeOne: true }, arthritis: { treated: true }, hypertension: { treated: true } };
    const { inSight } = papers(sim, 'health');
    expect(inSight).toContain('Depression: Kept Up Left untreated, your morale falls each week.');
    expect(inSight).toContain('Left Untreated Left untreated, your emergencies double.');
    expect(inSight).toContain('Left untreated, your emergencies quadruple and your condition falls each week.');
    expect(inSight).toContain('Left untreated, your energy falls each week.');
    expect(inSight.match(/Left untreated, /g)).toHaveLength(4);
    // The words follow the rule's figures, not a copy of them.
    expect([CHRONIC.untreated.asthmaEmergencies, CHRONIC.untreated.diabetesEmergencies]).toEqual([2, 4]);
    // Type 2 has the condition's fall without the emergencies.
    healthOf(sim.player).chronic = { diabetes: { treated: true, typeOne: false } };
    expect(papers(sim, 'health').inSight).toContain('Left untreated, your condition falls each week.');
    expect(papers(sim, 'health').inSight).not.toContain('emergencies');
  });

  it('A Dental Plan says what it pays, and that Yale’s is paid for its year and can’t be canceled, before Buy Dental; The Marketplace says what you’re enrolled in; an emergency’s care is in Title Case', () => {
    // A Yale student on her first day, Yale Delta Dental Basic offered.
    const sim = createSave(1, 'ed17-dental', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const { inSight } = papers(sim, 'health');
    expect(inSight).toContain('Buy Dental');
    expect(inSight).toMatch(/It pays for cleanings in full, and \d+% of a filling after a \$[\d.,]+ deductible, up to \$[\d.,]+ a year\. It pays only where your health plan doesn’t\. It’s paid for the year to September 30, and can’t be canceled once paid\./);
    // FIXTURE: HUSKY D since a month ago, as a withdrawn student's enrollment holds it.
    const life2 = life('ed17-enrolled');
    healthOf(life2.player).program = { kind: 'medicaid', state: 'ct', from: life2.now - 30 * MS_DAY, renewAt: life2.now + 300 * MS_DAY, band: 'low' };
    expect(papers(life2, 'health').inSight).toMatch(/You’re enrolled in HUSKY D since [A-Z][a-z]+ \d{1,2}, \d{4}\./);
    healthOf(life2.player).program!.from = life2.now + 3 * MS_DAY;
    expect(papers(life2, 'health').inSight).toMatch(/You’re enrolled in HUSKY D from [A-Z][a-z]+ \d{1,2}, \d{4}\./);
    // FIXTURE: an emergency's bill, its care written as the health system writes it.
    healthOf(sim.player).bills.push({ id: 'ed17-er', at: sim.now, what: 'The emergency room, Yale New Haven Hospital, York Street Campus Emergency Department', amount: 50_00, dueAt: sim.now + 30 * MS_DAY });
    expect(papers(sim, 'health').all).toContain('The Emergency Room, Yale New Haven Hospital, York Street Campus Emergency Department');
  });
});

describe('brief 17: Unemployment says where none is paid as File A Claim says it', () => {
  it('a life in Berlin, where no state pays a claim, is told what File A Claim’s own refusal says: worked or living in one of the three states', () => {
    // FIXTURE: a Berliner living in Berlin, as a quick-save begins one: no claim of Britain's, Ireland's or Mexico City's.
    const sim = quickSave({ startLocationId: 'de-be-berlin', homeRegionId: 'de-be-berlin', wealth: 'wealthy' }, 'ed17-nostate');
    const said = 'Unemployment is paid in the game only in New York, California and Connecticut, and you’d need to have worked or to live in one of them.';
    expect(papers(sim, 'benefits').inSight).toContain(said);
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).error).toBe(said);
  });
});

describe('brief 17: Tax Returns and Passport And ID say what applies to this life', () => {
  it('No Returns Yet says the F-1 rule to a student on an F-1 alone', () => {
    const citizen = papers(life('ed17-noreturn-us'), 'returns').all;
    expect(citizen).toContain('Each February, last year’s return is ready here if you owe tax, are due a refund, or had income over the standard deduction. The return for');
    expect(citizen).not.toContain('F-1');
    const f1 = createSave(1, 'ed17-noreturn-f1', { ...newLifeConfig(), homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    expect(papers(f1, 'returns').all).toContain('or had income over the standard deduction. On an F-1, you have one every year. The return for');
  });

  it('Going Abroad says, in sight, that nothing can be applied for here; each empty list names the papers it lists; the cancel sentence waits for a passport', () => {
    const sim = life('ed17-abroad');
    const passport = papers(sim, 'passport');
    expect(passport.inSight).toContain('Travel isn’t part of the game, so you can’t apply for a visa or travel authorization here.');
    // An authorization's term in words under ten, as prose writes a number (until 2026-10-20 "good for 1 year").
    expect(passport.inSight).toContain('Australia asks citizens of the United States for ETA (Electronic Travel Authority, subclass 601): A$20.00, applied for online, and good for one year or until the passport runs out.');
    expect(passport.all).not.toContain('Each country’s rules are shown as they stand');
    expect(passport.inSight).toContain('You don’t hold a passport, a visa or a travel authorization.');
    expect(passport.inSight).toContain('You don’t hold an ID card or a driving license.');
    expect(passport.inSight).not.toContain('it cancels the one before it');
    expect(papers(sim, 'work').inSight).toContain('You don’t hold a work permit or a visa.');
    // A passport held, renewing it cancels it: said before Renew It.
    const applied = sim.must<{ readyAt: number }>({ kind: 'documents.apply_passport', payload: {} });
    sim.advanceTo(applied.readyAt + MS_DAY);
    expect(papers(sim, 'passport').inSight).toContain('Renew It');
    expect(papers(sim, 'passport').inSight).toContain('When a new passport arrives, it cancels the one before it, and any travel authorization issued on the old one ends with it.');
  });
});
