/**
 * Brief 20, the craft area's promises on the screens (docs/verification/audit-2026-10-21/effects/craft.json): what the
 * guide says a pane or a look shows, drawn from the real components against a life played through the commands and the
 * clock. FIXTURE: the game's context stood in for, as tests/genre-identity-screens.test.ts stands it in (the save the
 * components read, `run` sending a command), and `useKept` held at its first value, as tests/guide-examples-craft.test.ts
 * holds it; nothing else of the screens is replaced.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Simulation } from '@/engine/core/simulation';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { suggestions } from '@/engine/systems/briefs';
import { identityOf } from '@/engine/systems/artistry';
import { courseworkOf } from '@/engine/systems/coursework';
import { at, clearDay, live, run, student, workScene } from './fakes/craft-life';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(_key: string, initial: T) => [initial, () => undefined] as const };
});
const { BriefPane } = await import('@/ui/components/BriefPane');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');

const words = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const text = (node: ReactNode): string => words(renderToStaticMarkup(createElement('div', null, node)));
const rest = (sim: Simulation) => { clearDay(sim); Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 }); };

describe('craft.identity > craft.brief-tape: Where It Would Show Next, beside a brief', () => {
  it('lists the briefs the work so far points to, each with why and a button to open it, from the record the takes left', () => {
    const sim = student('b20c-where-next');
    const b = BRIEF_BY_ID['brief-absurdist']!;
    rest(sim); run(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    for (const step of ['read', 'lines', 'rehearse']) { rest(sim); run(sim, 'brief.prepare', { brief: b.id, step }); }
    rest(sim); run(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id });
    h.sim = sim;
    const pane = words(renderToStaticMarkup(createElement(BriefPane, { genre: b.kinds[0]!, brief: b.id, onOpen: () => undefined, practice: (id: string) => createElement('span', { 'data-practice': id }) })));
    expect(pane).toContain('Where It Would Show Next');
    // What the pane lists is the engine's suggestions for this record, the brief open left out, each said with its why.
    const ideas = suggestions(sim.player, undefined, identityOf(sim.player)).filter((s) => s.brief !== b.id);
    expect(ideas.length).toBeGreaterThan(0);
    for (const s of ideas.slice(0, 2)) expect(pane).toContain(words(s.why).trim().slice(0, 40));
  });
});

describe('craft.work > coursework.feedback: a showing opens from the record as a take does', () => {
  it('the first Scene Study shown in class opens on its look with its whole and its band, judged as it was', () => {
    const sim = student('b20c-show');
    live(sim, at(2026, 9, 8, 12), { evening: (s) => workScene(s, ['read', 'learn', 'reader', 'rehearse']) });
    const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.course === 'DRAM 103a/b')!;
    const rec = (sim.player.work ?? []).find((w) => w.at === a.shown!.at && w.what === 'Scene Study')!;
    h.sim = sim;
    const look = resolveLook(sim, { kind: 'work', id: rec.inputs.key }) as { name: string; summary: ReactNode; body: ReactNode };
    const all = `${text(look.name)} ${text(look.summary)} ${text(look.body)}`;
    // Its whole, and each dimension as it was judged, the limits beside them.
    expect(all).toContain(rec.overall.toFixed(1));
    for (const [, q] of Object.entries(rec.dims)) expect(all).toContain(q.toFixed(1));
    expect(a.feedback!.text.length).toBeGreaterThan(0);
  });
});
