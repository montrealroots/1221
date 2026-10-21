/**
 * Brief 20's papers area, the defects it found (D1) and repaired, each held by a test that failed before the repair.
 *
 * P1, an OPT approved before the program ends said to be in force. OPT runs twelve months "from the later of your
 * program's end and the approval" (Papers' own words), so with premium processing, decided within thirty federal
 * workdays of an application made in the ninety days before the program's end, it's approved weeks before it starts:
 * `documents.permission` makes it valid with its first day, `issuedAt`, at the program's end. Nothing in the engine
 * took it as in force before then (`inForce` reads `issuedAt`, and `usWorkAuthorized` with it), but Papers did: its
 * row on the Work tab read In Force, and its page said "It’s in force until …" over "It no longer lets you work
 * anywhere: it’s out of force.", two sentences that each said what isn't so. Found reading the document look's
 * `whatItDoes`, whose out-of-force words a valid document could reach only by starting later than today.
 *
 * PLAYER JOURNEY: a new life (`createSave` with `newLifeConfig`), born in London, at Yale in New Haven from Monday 24
 * August 2026, played by the clock and the command Papers' OPT panel sends; Papers rendered to markup (react-dom/server)
 * over the save, with `useGame` standing in for the provider, which needs a browser, as tests/defects-g25-1.test.ts does.
 *
 * TEST SETUP: the body kept fed, rested and awake as the clock moves (`tended`); the F-1's program end moved to Wednesday
 * 4 November 2026 with its sixty days' grace (a life's own is 31 May 2029), so the ninety days before it fall in the
 * first term.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { documentsOf, inForce } from '@/engine/systems/documents';
import { f1Of, programEnd, usWorkAuthorized } from '@/engine/systems/permission';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { WorkPane } = await import('@/ui/papers/Documents');

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

function text(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((n) => text(n as ReactNode)).join('');
  if (!isValidElement(node)) return '';
  return text((node.props as { children?: ReactNode }).children);
}
const look = (sim: Simulation, id: string): Looked => {
  const found = resolveLook(sim, subject('document', id));
  if (!found || 'gone' in found) throw new Error(`document:${id} didn’t resolve`);
  return found as Looked;
};
/** The look as it reads: its summary, its body's words and its figures' values and notes. */
const page = (sim: Simulation, id: string) => {
  const l = look(sim, id);
  h.sim = sim;
  return `${l.summary} ${renderToStaticMarkup(createElement('div', null, l.body)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')}`;
};
const workTab = (sim: Simulation) => { h.sim = sim; return renderToStaticMarkup(createElement(WorkPane)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); };

describe('P1: an OPT approved before the program ends', () => {
  it('PLAYER JOURNEY: approved three weeks ahead, it reads Approved on the Work tab and its page says it starts on the program’s last day, not that it’s in force or out of force; from that day it reads In Force, across a reload', () => {
    const sim = createSave(1, 'b20-papers-opt-early', { ...newLifeConfig(), homeRegionId: 'uk-eng-london', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    // TEST SETUP: the program's end moved to Wednesday 4 November 2026.
    f1Of(sim.player)!.expiresAt = at(2026, 11, 4, 12) + 60 * MS_DAY;
    const ends = programEnd(sim.player)!;
    tended(sim, at(2026, 9, 1, 18));
    // Apply With Premium Processing, as the OPT panel sends it, inside the ninety days.
    const applied = sim.must<{ readyAt: number }>({ kind: 'documents.apply_opt', payload: { premium: true } });
    expect(applied.readyAt).toBeLessThan(ends - 14 * MS_DAY);
    tended(sim, applied.readyAt + MS_HOUR);
    const opt = documentsOf(sim.player).find((d) => d.kind === 'permit' && d.name.includes('OPT'))!;
    // Decided: valid, from the program's end, and not in force before it, as the engine reads it.
    expect([opt.status, opt.issuedAt]).toEqual(['valid', ends]);
    expect(inForce(opt, sim.now)).toBe(false);
    expect(usWorkAuthorized(sim.player, sim.now)).toBe(false);

    const from = formatDate(ends, NY);
    const until = formatDate(opt.expiresAt!, NY);
    for (const s of [sim, reload(sim)]) {
      const words = page(s, opt.id);
      expect(words).not.toContain('It’s in force until');
      expect(words).not.toContain('out of force');
      expect(words).toContain(`It’s approved, and it starts on ${from}. It runs to ${until}, and its number ends`);
      expect(words).toContain('It doesn’t let you work until then.');
      const tab = workTab(s);
      expect(tab).toContain(`${opt.number} ${from} ${until} Approved`);
      expect(tab).not.toContain(`${opt.number} ${from} ${until} In Force`);
    }

    // From the program's end it is in force, and says so.
    tended(sim, ends + MS_HOUR);
    expect(inForce(opt, sim.now)).toBe(true);
    expect(page(sim, opt.id)).toContain(`It’s in force until ${until}, and its number ends`);
    expect(page(sim, opt.id)).toContain('It lets you work in the United States.');
    expect(workTab(sim)).toContain(`${opt.number} ${from} ${until} In Force`);
  }, 60_000);
});
