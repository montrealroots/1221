/**
 * The map, as arithmetic.
 *
 * Two things have to be true for tapping a country to work. The projection has
 * to put a place where the outlines put it, so that the marker for Wellington
 * lands on New Zealand and not in the Pacific. And the framing has to produce
 * a view that is the shape of the viewport, never larger than the world, and
 * never outside it — otherwise zooming to Fiji shows the edge of the map and
 * half an ocean of nothing.
 *
 * The generated outline file is checked here too: it is built by a tool that
 * fetches from the network, so nothing else in the suite would notice if it
 * came out wrong.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  boxFromCorners, frameBox, markerRadiusAt, projectPoint, strokeAt,
  viewBoxOf, wholeWorld, wrapLongitude, type Box, type WorldMapData,
} from '@/ui/creation/world-map';
import { CITIES, COUNTRIES } from '@/engine/content/geography';

const SURFACE = { width: 2000, height: 1000 };

const MAP = JSON.parse(
  readFileSync('public/geo/world-map.json', 'utf8'),
) as WorldMapData;

// ---------------------------------------------------------------------------

describe('the projection', () => {
  it('puts the origin in the middle', () => {
    expect(projectPoint(0, 0, SURFACE)).toEqual({ x: 1000, y: 500 });
  });

  it('puts the corners in the corners', () => {
    expect(projectPoint(90, -180, SURFACE)).toEqual({ x: 0, y: 0 });
    expect(projectPoint(-90, 180, SURFACE)).toEqual({ x: 2000, y: 1000 });
  });

  it('puts real cities inside their country', () => {
    const cases: [string, string][] = [
      ['us-ca-losangeles', 'us'],
      ['uk-eng-london', 'uk'],
      ['jp-13-tokyo', 'jp'],
      ['au-nsw-sydney', 'au'],
      ['nz-wgn-wellington', 'nz'],
      ['br-sp-saopaulo', 'br'],
      ['za-gt-johannesburg', 'za'],
    ];
    for (const [cityId, countryId] of cases) {
      const city = CITIES.get(cityId);
      if (!city) continue; // A calibrated city that was renamed is not this test's business.
      const box = boxFromCorners(MAP.bounds[countryId] ?? []);
      expect(box, `${countryId} has no outline`).not.toBeNull();
      const point = projectPoint(city.latitude, city.longitude, MAP);
      // Generous: a 110m outline is coarse and a coastal city sits on its edge.
      expect(point.x, `${cityId} longitude`).toBeGreaterThan((box as Box).x - 12);
      expect(point.x, `${cityId} longitude`).toBeLessThan((box as Box).x + (box as Box).width + 12);
      expect(point.y, `${cityId} latitude`).toBeGreaterThan((box as Box).y - 12);
      expect(point.y, `${cityId} latitude`).toBeLessThan((box as Box).y + (box as Box).height + 12);
    }
  });

  it('folds a longitude that has gone round the world', () => {
    expect(wrapLongitude(190)).toBeCloseTo(-170);
    expect(wrapLongitude(-181.3)).toBeCloseTo(178.7);
    expect(wrapLongitude(0)).toBe(0);
    expect(wrapLongitude(Number.NaN)).toBe(0);
  });

  it('clamps a latitude that cannot exist', () => {
    expect(projectPoint(120, 0, SURFACE).y).toBe(0);
    expect(projectPoint(-120, 0, SURFACE).y).toBe(1000);
  });
});

// ---------------------------------------------------------------------------

describe('framing a country', () => {
  const shapes: [string, Box][] = [
    ['a wide country', { x: 200, y: 300, width: 600, height: 100 }],
    ['a tall country', { x: 900, y: 100, width: 60, height: 500 }],
    ['a tiny island', { x: 1990, y: 590, width: 2, height: 2 }],
    ['at the left edge', { x: 0, y: 400, width: 40, height: 40 }],
    ['at the right edge', { x: 1960, y: 400, width: 40, height: 40 }],
    ['at the top edge', { x: 800, y: 0, width: 40, height: 20 }],
    ['at the bottom edge', { x: 800, y: 980, width: 40, height: 20 }],
    ['the whole world', { x: 0, y: 0, width: 2000, height: 1000 }],
  ];

  for (const [what, target] of shapes) {
    it(`keeps ${what} inside the world, at the viewport's shape`, () => {
      const view = frameBox(target, SURFACE);
      expect(view.x).toBeGreaterThanOrEqual(0);
      expect(view.y).toBeGreaterThanOrEqual(0);
      expect(view.x + view.width).toBeLessThanOrEqual(SURFACE.width + 0.001);
      expect(view.y + view.height).toBeLessThanOrEqual(SURFACE.height + 0.001);
      expect(view.width / view.height).toBeCloseTo(SURFACE.width / SURFACE.height, 6);
      expect(view.width).toBeGreaterThan(0);
    });
  }

  it('never zooms past a floor, however small the country', () => {
    const view = frameBox({ x: 1000, y: 500, width: 0, height: 0 }, SURFACE);
    expect(view.width).toBeGreaterThanOrEqual(SURFACE.width * 0.06);
  });

  it('contains the country it was asked to frame', () => {
    const target = { x: 400, y: 300, width: 120, height: 80 };
    const view = frameBox(target, SURFACE);
    expect(view.x).toBeLessThanOrEqual(target.x);
    expect(view.y).toBeLessThanOrEqual(target.y);
    expect(view.x + view.width).toBeGreaterThanOrEqual(target.x + target.width);
    expect(view.y + view.height).toBeGreaterThanOrEqual(target.y + target.height);
  });

  it('writes a viewBox with four finite numbers', () => {
    const parts = viewBoxOf(frameBox({ x: 10, y: 10, width: 30, height: 20 }, SURFACE)).split(' ');
    expect(parts).toHaveLength(4);
    for (const part of parts) expect(Number.isFinite(Number(part))).toBe(true);
  });

  it('rejects corners that are not numbers', () => {
    expect(boxFromCorners([])).toBeNull();
    expect(boxFromCorners([1, 2, 3])).toBeNull();
    expect(boxFromCorners([1, 2, Number.NaN, 4])).toBeNull();
    expect(boxFromCorners([10, 20, 4, 8])).toEqual({ x: 4, y: 8, width: 6, height: 12 });
  });

  it('thins strokes and markers as the view closes in', () => {
    const world = wholeWorld(SURFACE);
    const close = frameBox({ x: 1000, y: 500, width: 20, height: 10 }, SURFACE);
    expect(strokeAt(close, SURFACE)).toBeLessThan(strokeAt(world, SURFACE));
    expect(markerRadiusAt(close, SURFACE)).toBeLessThan(markerRadiusAt(world, SURFACE));
    expect(strokeAt(close, SURFACE)).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------

describe('the generated outlines', () => {
  it('is a two-to-one equirectangular surface', () => {
    expect(MAP.projection).toBe('equirectangular');
    expect(MAP.width / MAP.height).toBe(2);
    expect(MAP.source).toMatch(/Natural Earth/);
  });

  it('draws a country SLATE knows, under the id SLATE uses', () => {
    for (const id of Object.keys(MAP.countries)) {
      expect(COUNTRIES.get(id), `${id} is not a country SLATE knows`).toBeTruthy();
    }
  });

  it('draws the countries anybody would look for first', () => {
    for (const id of ['us', 'uk', 'ca', 'au', 'nz', 'fr', 'de', 'it', 'es', 'jp', 'kr', 'mx', 'in', 'br', 'za', 'ru', 'cn']) {
      expect(MAP.countries[id], `${id} is missing from the map`).toBeTruthy();
      expect(MAP.bounds[id], `${id} has no frame`).toBeTruthy();
    }
  });

  it('gives every drawn country a frame, and every frame a country', () => {
    expect(Object.keys(MAP.bounds).sort()).toEqual(Object.keys(MAP.countries).sort());
  });

  it('writes path data and nothing else', () => {
    for (const [id, d] of Object.entries(MAP.countries)) {
      expect(d, `${id} is empty`).not.toBe('');
      expect(d, `${id} has an unexpected command`).toMatch(/^[MLZ0-9 .-]+$/);
      expect(d.startsWith('M'), `${id} does not begin with a move`).toBe(true);
      expect(d.endsWith('Z'), `${id} does not close`).toBe(true);
    }
  });

  it('never draws a country as a band across the whole world', () => {
    // Antarctica genuinely runs the full width; nothing else may.
    const offenders: string[] = [];
    for (const [id, d] of Object.entries(MAP.countries)) {
      for (const piece of d.split('Z')) {
        const xs = [...piece.matchAll(/[ML](-?[0-9.]+) (-?[0-9.]+)/g)]
          .map((m) => Number(m[1]));
        if (xs.length < 2) continue;
        if (Math.max(...xs) - Math.min(...xs) > MAP.width * 0.6) offenders.push(id);
      }
    }
    expect([...new Set(offenders)]).toEqual(['aq']);
  });

  it('frames each country somewhere on or near the surface', () => {
    for (const [id, corners] of Object.entries(MAP.bounds)) {
      const box = boxFromCorners(corners);
      expect(box, `${id} has unreadable corners`).not.toBeNull();
      const view = frameBox(box as Box, MAP);
      expect(view.x, id).toBeGreaterThanOrEqual(0);
      expect(view.y, id).toBeGreaterThanOrEqual(0);
      expect(view.x + view.width, id).toBeLessThanOrEqual(MAP.width + 0.001);
      expect(view.y + view.height, id).toBeLessThanOrEqual(MAP.height + 0.001);
    }
  });

  it('frames Russia on Russia rather than on the northern hemisphere', () => {
    const box = boxFromCorners(MAP.bounds.ru ?? []);
    expect(box).not.toBeNull();
    // Kaliningrad at the west end, Chukotka at the east. Not Alaska.
    expect((box as Box).x).toBeGreaterThan(MAP.width * 0.5);
  });
});

describe('the picker and the map it draws', () => {
  /**
   * They are on disk and nothing imports them.
   *
   * The birthplace picker came off Identity when the place of birth became the
   * family land, and it was the last thing using either component. That leaves
   * two files a cleanup would read as dead: the picker with its country and
   * region lists and its ranked town search, and the map it draws. Both are
   * kept deliberately, whole, for whatever screen wants a place chosen next —
   * so this fails if either is deleted or gutted rather than moved.
   */
  const read = (path: string) => readFileSync(new URL(`../src/ui/creation/${path}`, import.meta.url), 'utf8');

  it('keeps the location picker whole', () => {
    const source = read('LocationPicker.tsx');
    expect(source).toMatch(/export function LocationPicker/);
    // The three ways in: the map, the country and region lists, the search.
    expect(source).toMatch(/WorldMap/);
    expect(source).toMatch(/Country/);
    expect(source).toMatch(/Town Or City/);
  });

  it('keeps the map component whole', () => {
    const source = read('WorldMap.tsx');
    expect(source).toMatch(/export function WorldMap/);
    // Its features: framing a country, zooming to it, going back out.
    expect(source).toMatch(/frameBox|viewBoxOf/);
    expect(source).toMatch(/loadWorldMap/);
  });

  it('is off the identity page and nothing else pulls it back in', () => {
    const creation = readFileSync(new URL('../src/ui/creation/CharacterCreation.tsx', import.meta.url), 'utf8');
    // The import, not the word: the page carries a comment naming the file to
    // say where the picker went, and that comment is the point of it.
    expect(creation, 'the picker is back on Identity')
      .not.toMatch(/import\s*\{[^}]*LocationPicker[^}]*\}\s*from/);
    expect(creation, 'the picker is rendered again').not.toMatch(/<LocationPicker/);
    expect(creation, 'Identity should state the birthplace, not ask for it')
      .toMatch(/id="birthplace"[\s\S]{0,200}readOnly/);
  });
});
