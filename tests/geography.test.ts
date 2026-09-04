/**
 * The world.
 *
 * SLATE ships every country and every first-level subdivision on Earth, and
 * knows the name of every populated place of a thousand people or more. Most
 * of those live on disk rather than in the bundle, so what matters here is
 * that the in-bundle set is coherent, that the calibrated cities kept their
 * identities when the world was layered underneath them, and that a city
 * nobody hand-tuned still comes out with economics a simulation can use.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import {
  CITIES, COUNTRIES, REGIONS, CITIES_IN_THE_WORLD, cityCount,
  cityTimeZone, distanceKm,
} from '@/engine/content/geography';

describe('the world SLATE ships with', () => {
  it('has every country and territory', () => {
    // 195 sovereign states plus dependencies and territories.
    expect(COUNTRIES.all().length).toBeGreaterThanOrEqual(240);
    for (const id of ['us', 'uk', 'ca', 'jp', 'ng', 'br', 'in', 'nz', 'is', 'fj', 'mn']) {
      expect(COUNTRIES.get(id), `${id} is missing`).toBeDefined();
    }
  });

  it('has every first-level subdivision on Earth', () => {
    expect(REGIONS.all().length).toBeGreaterThan(3_000);
    const us = REGIONS.all().filter((r) => r.parentId === 'us');
    // Fifty states, DC, and the inhabited territories.
    expect(us.length, `found ${us.length} US subdivisions`).toBeGreaterThanOrEqual(51);
    for (const name of ['California', 'Texas', 'Wyoming', 'Alaska', 'Hawaii']) {
      expect(us.some((r) => r.name === name), `${name} is missing`).toBe(true);
    }
  });

  it('knows the whole world, not just what is bundled', () => {
    expect(CITIES_IN_THE_WORLD).toBeGreaterThan(150_000);
    // The bundle carries a usable slice; the rest is a fetch away.
    expect(CITIES.all().length).toBeGreaterThan(1_000);
    expect(CITIES.all().length).toBeLessThan(CITIES_IN_THE_WORLD);
  });

  it('keeps every calibrated city under the identity it always had', () => {
    for (const id of [
      'us-ca-losangeles', 'us-ca-burbank', 'us-ny-newyork', 'uk-eng-london',
      'jp-13-tokyo', 'fr-idf-paris', 'ca-qc-montreal', 'au-nsw-sydney', 'ae-du-dubai',
    ]) {
      const city = CITIES.get(id);
      expect(city, `${id} lost its identity`).toBeDefined();
      expect(city!.industryPresence, `${id} lost its calibration`).toBeGreaterThan(0);
    }
  });

  it('gives a city nobody tuned by hand economics a simulation can use', () => {
    const derived = CITIES.all().filter((c) => c.industryPresence === 0 && c.population > 50_000);
    expect(derived.length, 'no derived cities to check').toBeGreaterThan(100);

    for (const city of derived.slice(0, 200)) {
      expect(city.costOfLivingIndex, `${city.name} has no cost of living`).toBeGreaterThan(0);
      expect(city.medianRentCents, `${city.name} has no rent`).toBeGreaterThan(0);
      expect(city.medianHomePriceCents).toBeGreaterThan(city.medianRentCents);
      expect(city.jobMarketDepth).toBeGreaterThanOrEqual(0);
      expect(city.jobMarketDepth).toBeLessThanOrEqual(100);
      expect(city.timeZone, `${city.name} has no time zone`).toMatch(/\//);
      // And it is honest about being derived.
      expect(city.source).toBe('calibrated_estimate');
    }
  });

  it('gives every bundled city a real time zone the clock can use', () => {
    for (const city of CITIES.all()) {
      expect(() => cityTimeZone(city.id)).not.toThrow();
      expect(() => new Intl.DateTimeFormat('en-US', { timeZone: city.timeZone }), city.name).not.toThrow();
    }
  });

  it('places every bundled city inside a real country and subdivision', () => {
    for (const city of CITIES.all()) {
      expect(COUNTRIES.get(city.countryId), `${city.name} is in no country`).toBeDefined();
      if (city.parentId !== city.countryId) {
        expect(REGIONS.get(city.parentId), `${city.name} is in no subdivision`).toBeDefined();
      }
    }
  });

  it('measures distance between real places sensibly', () => {
    const la = CITIES.require('us-ca-losangeles');
    const ny = CITIES.require('us-ny-newyork');
    const km = distanceKm(la, ny);
    // Los Angeles to New York is about 3,950 km as the crow flies.
    expect(km).toBeGreaterThan(3_700);
    expect(km).toBeLessThan(4_200);
  });
});

describe('the city files on disk', () => {
  const dir = 'public/geo';
  const files = readdirSync(dir).filter((f) => f.endsWith('.tsv'));

  it('covers essentially every country', () => {
    expect(files.length).toBeGreaterThan(200);
  });

  it('adds up to the whole world', () => {
    let total = 0;
    for (const file of files) {
      total += readFileSync(`${dir}/${file}`, 'utf8').split('\n').filter(Boolean).length;
    }
    expect(total).toBe(CITIES_IN_THE_WORLD);
  });

  it('agrees with the counts the picker shows', () => {
    for (const file of files.slice(0, 40)) {
      const id = file.replace('.tsv', '');
      const lines = readFileSync(`${dir}/${file}`, 'utf8').split('\n').filter(Boolean).length;
      expect(cityCount(id), `${id} count disagrees`).toBe(lines);
    }
  });

  it('holds well-formed rows with unique ids', () => {
    const seen = new Set<string>();
    for (const file of ['us.tsv', 'gb.tsv', 'uk.tsv', 'jp.tsv', 'br.tsv'].filter((f) => files.includes(f))) {
      for (const line of readFileSync(`${dir}/${file}`, 'utf8').split('\n')) {
        if (!line) continue;
        const parts = line.split('\t');
        expect(parts.length, `malformed row in ${file}: ${line}`).toBe(8);
        const [id, name, , lat, lon, tz, pop, kind] = parts;
        expect(['', 'x', 'c', 'a'], `unknown place kind in ${file}: ${line}`).toContain(kind);
        expect(id).toMatch(/^[a-z0-9-]+$/);
        expect(name!.length).toBeGreaterThan(0);
        expect(Number.isFinite(Number(lat))).toBe(true);
        expect(Number.isFinite(Number(lon))).toBe(true);
        expect(tz).toMatch(/\//);
        expect(Number.isFinite(Number(pop))).toBe(true);
        expect(seen.has(id!), `duplicate id ${id}`).toBe(false);
        seen.add(id!);
      }
    }
  });

  it('puts the United States somewhere near seventeen thousand towns', () => {
    expect(cityCount('us')).toBeGreaterThan(15_000);
  });

  /**
   * A city id written into the content is a promise that the place exists. A
   * festival pointing at a city that is not in the world has no venue, no time
   * zone and no travel to it, and nothing in the game would say so out loud —
   * it would just quietly be nowhere. So every one of them is resolved here.
   */
  it('resolves every city named anywhere in the content', () => {
    const known = new Set<string>();
    for (const file of readdirSync(dir)) {
      for (const line of readFileSync(`${dir}/${file}`, 'utf8').split('\n')) {
        const id = line.split('\t')[0];
        if (id) known.add(id);
      }
    }

    const sources: string[] = [];
    const walk = (folder: string) => {
      for (const entry of readdirSync(folder, { withFileTypes: true })) {
        const full = `${folder}/${entry.name}`;
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name)) sources.push(full);
      }
    };
    walk('src');

    const missing: string[] = [];
    for (const file of sources) {
      const text = readFileSync(file, 'utf8');
      const pattern = /(?:cityId|locationId|homeRegionId|currentLocationId):\s*'([a-z]{2}-[a-z0-9-]+)'/g;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        if (!known.has(match[1]!)) missing.push(`${file}: ${match[1]}`);
      }
    }
    expect(missing, `city ids in the content that are nowhere in the world:\n${missing.join('\n')}`).toEqual([]);
  });
});
