/**
 * Brief 23's long pages, read summary first (section 8, "Profile, Money, Papers, School, and help"), drawn as the player
 * has them on a played life: the save j01 left in its last spring, its six term reviews kept.
 *
 * - The Player Profile opens on who you are and whether anything holds your work back today, then the tables, and its
 *   head lists every section a press away (`PageIndex`). Until 2026-10-23 Readiness Today sat fifth, under the 54 genres,
 *   and the page had no index: 6,400 pixels at 1440 to scroll for a section near its foot.
 * - School's Term Reviews keeps each review's figures in a row and why under them across the table. Until then why was a
 *   seventh column, set in 55 pixels on a phone on its side (brief 23's walk).
 *
 * How the stacked table and the index look at each size is the walk's (`docs/verification/ui-2026-10-23/app/capture.mjs`),
 * not this file's: here the words, their order and what a press does.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, isValidElement, type FunctionComponent, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { deserialise } from '@/engine/persistence/adapter';
import { GUIDE_BY_ID } from '@/engine/content/guide';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tab: 'standing',
}));

// Without the original: it imports the looks, which import it back.
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

// A kept tab at the one a test asks for: the store it's kept in has no server snapshot to render from.
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(key === 'tab:/workspace/school' ? h.tab : initial) as T, () => undefined] as const };
});

const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { SchoolWorkspace } = await import('@/ui/workspaces/SchoolWorkspace');
const { PageIndex } = await import('@/ui/components/primitives');

/** j01's save in its last spring, as an older save opens: six term reviews kept, every panel of the Profile filled. */
const played = (): Simulation => loadSave(deserialise(gunzipSync(readFileSync('tests/fixtures/journey-j01-last-term-8283f80c.json.gz')).toString('utf8')) as never);
const words = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
function drawn(sim: Simulation, screen: FunctionComponent, tab = 'standing'): string {
  h.sim = sim;
  h.tab = tab;
  return renderToStaticMarkup(createElement(screen)).replace(/<!-- -->/g, '');
}
/** Every element a tree holds with the props given, in order. */
function found(node: ReactNode, type: string): { props: Record<string, unknown> }[] {
  if (Array.isArray(node)) return node.flatMap((n) => found(n, type));
  if (!isValidElement(node)) return [];
  const props = node.props as Record<string, unknown> & { children?: ReactNode };
  return [...(node.type === type ? [{ props }] : []), ...found(props.children, type)];
}

const SECTIONS = ['Identity And Background', 'Readiness Today', 'Attributes And Craft', 'Techniques', 'Genres', 'School Journey', 'Your Work So Far', 'Development History'];

describe('the Player Profile, summary first, every section a press away', () => {
  it('PLAYER JOURNEY: a played student’s Profile opens on who she is and Readiness Today, then the tables; On This Page under her name lists the eight sections in the order the page has them, each a section that takes the focus', () => {
    const sim = played();
    const html = drawn(sim, ProfileWorkspace);
    // The panels' own headings, in the page's order.
    const headings = [...html.matchAll(/<h2>(?:<button[^>]*>)?([^<]+)/g)].map((m) => m[1]!.trim()).filter((t) => SECTIONS.includes(t));
    expect(headings).toEqual(SECTIONS);
    // The index in the head, before the first panel, its buttons in the same order.
    const head = html.slice(0, html.indexOf('<section'));
    expect(words(head)).toBe(`Player Profile ${sim.player.displayName} On This Page ${SECTIONS.join(' ')}`);
    // Each button's section is on the page once, in the index's order, and can take the focus.
    const ids = [...html.matchAll(/<section id="([^"]+)" tabindex="-1"/g)].map((m) => m[1]!);
    expect(ids).toHaveLength(SECTIONS.length);
    expect(new Set(ids).size).toBe(ids.length);
    const sectionOf = (id: string) => words(html.slice(html.indexOf(`<section id="${id}"`))).split(' ').slice(0, 4).join(' ');
    ids.forEach((id, i) => expect(sectionOf(id).startsWith(SECTIONS[i]!.split(' ').slice(0, 2).join(' '))).toBe(true));
  });

  it('the guide’s Player Profile names its panels from the top in the order the page draws them, On This Page with them', () => {
    const short = GUIDE_BY_ID['craft.profile']?.short ?? '';
    const said = short.slice(short.indexOf('From the top'));
    const where = SECTIONS.map((s) => said.indexOf(s));
    expect(where.every((n) => n >= 0)).toBe(true);
    expect([...where].sort((a, b) => a - b)).toEqual(where);
    expect(said).toContain('On This Page, under your name, takes you to any of them.');
  });

  it('a press on the index brings its section to the top and gives it the focus without a second scroll; a section not on the page is let go', () => {
    const calls: string[] = [];
    const el = { scrollIntoView: (o: unknown) => calls.push(`scroll ${JSON.stringify(o)}`), focus: (o: unknown) => calls.push(`focus ${JSON.stringify(o)}`) };
    const real = globalThis.document;
    (globalThis as { document?: unknown }).document = { getElementById: (id: string) => (id === 'a' ? el : null) };
    try {
      const tree = PageIndex({ sections: [{ id: 'a', label: 'First' }, { id: 'gone', label: 'Second' }] });
      const nav = found(tree, 'nav')[0]!;
      expect(nav.props['aria-label']).toBe('On This Page');
      const [first, second] = found(tree, 'button');
      (first!.props.onClick as () => void)();
      expect(calls).toEqual(['scroll {"block":"start"}', 'focus {"preventScroll":true}']);
      expect(() => (second!.props.onClick as () => void)()).not.toThrow();
      expect(calls).toHaveLength(2);
    } finally {
      (globalThis as { document?: unknown }).document = real;
    }
  });
});

describe('School’s Term Reviews: the figures in a row, why under them', () => {
  it('PLAYER JOURNEY: each of a played student’s reviews is its term, standing, attendance, growths and coursework in a row, and why across the table under it, in the words the review keeps', () => {
    const sim = played();
    const history = sim.player.school!.history;
    expect(history.length).toBeGreaterThanOrEqual(4);
    const html = drawn(sim, SchoolWorkspace, 'standing');
    const table = html.slice(html.indexOf('<table class="review-table stack-table">'));
    expect(table.length).toBeLessThan(html.length);
    const head = table.slice(0, table.indexOf('</thead>'));
    expect(words(head)).toBe('Term Standing Attendance Growth Class Growth Coursework');
    const bodies = [...table.slice(0, table.indexOf('</table>')).matchAll(/<tbody>([\s\S]*?)<\/tbody>/g)].map((m) => m[1]!);
    expect(bodies).toHaveLength(history.length);
    bodies.forEach((body, i) => {
      const [figures, why] = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => m[0]);
      // The figures, each named for a phone on its side (`data-label`), the names drawn and not written.
      expect(figures).toMatch(/data-label="Attendance"[\s\S]*data-label="Growth"[\s\S]*data-label="Class Growth"[\s\S]*data-label="Coursework"/);
      expect(why).toBe(`<tr class="review-why"><td colSpan="6" class="small">${history[i]!.reason.replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;')}</td></tr>`);
    });
  });
});
