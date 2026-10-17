/**
 * The place look’s words for the player’s own city and for another, as a player opens them (third round of
 * 2026-10-13, loose end L8). Since the scope of 2026-10-09 nobody is moved, so the city a player stands in is the one
 * they live in (`homeCityOf`), and a city on the map is theirs or another. The look kept words for standing in a city
 * away from home (“Where You Are”, “Home, … back”, “You’re … from home in”, “You’re here and not home”) and for home
 * while away (“you’re not in it today”), which no life reached; they went on 2026-10-13. What’s left is held here, each
 * reached the way a player reaches it: New Haven’s look opened, Connecticut pressed from it, and a town of it pressed
 * from there.
 *
 * PLAYER JOURNEY: a new life (`createSave` with `newLifeConfig`), Ada Cole, born in New York, at Yale in New Haven from
 * Monday 24 August 2026 at 7:30 AM. The distance is worked here from the gazetteer’s coordinates by the great circle
 * (a radius of 6,371 km, 0.621371 miles to the kilometer, as the country reads miles), never by the engine’s helper.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { CITIES } from '@/engine/content/geography';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

// Without the original: it imports the looks, which import it back.
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

const { at, resolveLook } = await import('@/ui/looks');

/** The words a player reads: tags out, entities back. */
const words = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1').trim();

/** A look as it opens: its name, kind, summary, body’s words and its ways. */
function look(sim: Simulation, kind: string, id: string) {
  h.sim = sim;
  const found = resolveLook(sim, at(kind, id));
  if (!found || 'gone' in found) throw new Error(`${kind}:${id} didn’t resolve`);
  const body = words(renderToStaticMarkup(createElement('div', null, found.body)).replace(/<!-- -->/g, ''));
  return { name: found.name, kind: found.kind, summary: found.summary, body, ways: found.ways ?? [] };
}

/** The great-circle distance in miles, to the mile, from two places' coordinates. */
function miles(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = Math.PI / 180;
  const s = Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2
    + Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2 * Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad);
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(s)) * 0.621371);
}

describe('the place look, home and another city', () => {
  it('PLAYER JOURNEY: New Haven opens as Where You Live, with no line about home; Connecticut pressed from it and Litchfield from there opens as A City On The Map, 33 miles from home in New Haven on the same clock, with the way back saying it’s where she lives', () => {
    const sim = createSave(1, 'd3-place', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');

    const home = look(sim, 'place', 'us-ct-newhaven');
    expect([home.name, home.kind]).toEqual(['New Haven', 'Where You Live']);
    expect(home.summary).toMatch(/^This is where you live\. It’s 7:30 AM, and [\d.,]+[KMB]? people live here\.$/);
    expect(home.body).not.toContain('from home');
    expect(home.ways.map((w) => w.label)).not.toContain('New Haven');

    // Connecticut, pressed from New Haven’s look; then its town that isn’t New Haven.
    const state = home.ways.find((w) => w.to.kind === 'region')!;
    expect([state.label, state.to.id]).toEqual(['Connecticut', 'us-ct']);
    const region = look(sim, 'region', state.to.id);
    const town = region.ways.find((w) => w.to.kind === 'place' && w.to.id !== 'us-ct-newhaven')!;
    expect([town.label, town.to.id]).toEqual(['Litchfield', 'us-ct-litchfield']);

    // 41.3081, −72.9282 to 41.7473, −73.1887: 33.2 miles by the great circle.
    expect(miles(CITIES.get('us-ct-newhaven')!, CITIES.get('us-ct-litchfield')!)).toBe(33);
    const away = look(sim, 'place', town.to.id);
    expect([away.name, away.kind]).toEqual(['Litchfield', 'A City On The Map']);
    expect(away.summary).toBe('It’s 7:30 AM there, 33 mi from home.');
    expect(away.body).toContain('It’s 33 mi from home in New Haven, and on the same clock as home.');
    expect(away.ways.find((w) => w.to.kind === 'place' && w.to.id === 'us-ct-newhaven')).toMatchObject({ label: 'New Haven', detail: 'Where you actually live, and it’s 7:30 AM there' });
  });
});
