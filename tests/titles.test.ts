/**
 * Naming what the world makes.
 *
 * Two promises, and both are measured rather than asserted.
 *
 * A title reads like a title, and like one for the thing it is naming. A
 * network procedural, a Korean thriller and a family animation cannot come out
 * of the same seventy nouns and still sound like three different industries,
 * so each genre family has its own vocabulary and its own shapes, and the
 * tests check that the shapes actually differ.
 *
 * And nothing repeats. Not in a run of ten thousand, not across a ten-year
 * career, not against the real record. That is the claim, so that is what is
 * counted here.
 */

import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { makeRng } from '@/engine/core/rng';
import { commissionProject } from '@/engine/systems/zeitgeist';
import { generateTitle, registerFor, vocabularySize } from '@/engine/content/titles';
import { generateCharacterName, generateCompanyName } from '@/engine/content/names';
import { addKnownTitles, normaliseTitle, titleTaken } from '@/engine/content/filmography';

const MS_DAY = 86_400_000;

const KINDS: { genres: string[]; format: string; label: string }[] = [
  { genres: ['crime', 'thriller'], format: 'feature', label: 'crime film' },
  { genres: ['horror'], format: 'feature', label: 'horror film' },
  { genres: ['science-fiction'], format: 'feature', label: 'science fiction' },
  { genres: ['romance', 'comedy'], format: 'feature', label: 'romance' },
  { genres: ['comedy'], format: 'series', label: 'comedy series' },
  { genres: ['procedural', 'crime'], format: 'series', label: 'procedural' },
  { genres: ['medical'], format: 'series', label: 'medical series' },
  { genres: ['drama'], format: 'feature', label: 'drama' },
  { genres: ['documentary'], format: 'documentary', label: 'documentary' },
  { genres: ['family', 'animation'], format: 'feature', label: 'family' },
  { genres: ['fantasy'], format: 'limited_series', label: 'fantasy series' },
  { genres: ['war'], format: 'feature', label: 'war' },
  { genres: ['western'], format: 'feature', label: 'western' },
  { genres: ['sport'], format: 'feature', label: 'sport' },
  { genres: ['historical', 'period-drama'], format: 'series', label: 'period series' },
  { genres: ['musical'], format: 'feature', label: 'musical' },
  { genres: ['action', 'adventure'], format: 'feature', label: 'action' },
  { genres: ['mystery'], format: 'limited_series', label: 'mystery series' },
];

/** Every title one kind can make, drawn without ever repeating itself. */
function run(kind: typeof KINDS[number], count: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const title = generateTitle(makeRng(`t|${kind.label}|${i}`), {
      genres: kind.genres, format: kind.format, taken: (candidate) => seen.has(candidate),
    });
    seen.add(title);
    out.push(title);
  }
  return out;
}

describe('the vocabulary', () => {
  it('holds more than a thousand words across every kind of picture', () => {
    const size = vocabularySize();
    expect(size.registers).toBeGreaterThanOrEqual(15);
    // The ask was a thousand realistic names. This is the vocabulary behind
    // them, which is a larger number than the titles it can make is small.
    expect(size.words).toBeGreaterThan(1000);
    expect(size.standalone).toBeGreaterThan(100);
  });

  it('knows which family every genre belongs to', () => {
    for (const kind of KINDS) {
      expect(registerFor(kind.genres), kind.label).toBeDefined();
    }
    // Genres that are named alike land in the same family; ones that are not,
    // do not.
    expect(registerFor(['slasher'])).toBe(registerFor(['horror']));
    expect(registerFor(['heist'])).toBe(registerFor(['crime']));
    expect(registerFor(['legal'])).toBe(registerFor(['medical']));
    expect(registerFor(['horror'])).not.toBe(registerFor(['romance']));
    expect(registerFor(['western'])).not.toBe(registerFor(['science-fiction']));
    expect(registerFor([])).toBe('drama');
  });
});

describe('what comes out', () => {
  it('makes ten thousand titles of one kind without a single repeat', () => {
    for (const kind of KINDS.slice(0, 6)) {
      const titles = run(kind, 10_000);
      expect(new Set(titles).size, `${kind.label} repeated itself`).toBe(titles.length);
    }
  });

  it('reads like a title: no empty slots, no doubled words, real capitals', () => {
    for (const kind of KINDS) {
      for (const title of run(kind, 300)) {
        expect(title.trim(), kind.label).toBe(title);
        expect(title.length, `${kind.label}: "${title}"`).toBeGreaterThan(2);
        expect(title.length, `${kind.label}: "${title}"`).toBeLessThan(70);
        expect(title, kind.label).not.toMatch(/ {2}/);
        expect(title, kind.label).not.toMatch(/\bundefined\b/);
        expect(title, kind.label).not.toMatch(/\b(\w+) \1\b/i);
        // 'A Open Sabotage' is the one grammatical mistake a shape can make.
        expect(title, `${kind.label}: "${title}"`).not.toMatch(/\bA [AEIOU]/);
        // Every title starts with a capital, like every label in the game.
        expect(title[0], `${kind.label}: "${title}"`).toBe(title[0]?.toUpperCase());
      }
    }
  });

  it('names a series like a series and a film like a film', () => {
    // A procedural falls in the institution family, so these are its units.
    const unitish = /\b(Ward|Chambers|Division|Practice|Rotation|Unit|Wing|Firm)\b/;
    const series = run({ genres: ['procedural', 'crime'], format: 'series', label: 's' }, 500);
    const feature = run({ genres: ['procedural', 'crime'], format: 'feature', label: 'f' }, 500);
    const seriesRate = series.filter((t) => unitish.test(t)).length / series.length;
    const filmRate = feature.filter((t) => unitish.test(t)).length / feature.length;
    expect(seriesRate, `series are not named like series (${seriesRate.toFixed(2)})`).toBeGreaterThan(0.2);
    expect(seriesRate, 'a film is named as unit-ishly as a series').toBeGreaterThan(filmRate * 2);
  });

  it('gives each kind of picture its own words', () => {
    const words = new Map<string, Set<string>>();
    for (const kind of KINDS) {
      const bag = new Set<string>();
      for (const title of run(kind, 400)) {
        for (const word of title.split(/\W+/)) if (word.length > 3) bag.add(word.toLowerCase());
      }
      words.set(kind.label, bag);
    }
    // A horror title and a romance title should barely share a vocabulary.
    const horror = words.get('horror film')!;
    const romance = words.get('romance')!;
    const shared = [...horror].filter((w) => romance.has(w)).length;
    expect(shared / Math.min(horror.size, romance.size), 'horror and romance sound the same')
      .toBeLessThan(0.2);
  });

  it('is deterministic: the same seed gives the same title', () => {
    for (const kind of KINDS) {
      const a = generateTitle(makeRng(`fixed|${kind.label}`), { genres: kind.genres, format: kind.format });
      const b = generateTitle(makeRng(`fixed|${kind.label}`), { genres: kind.genres, format: kind.format });
      expect(b, kind.label).toBe(a);
    }
  });

  it('names a franchise entry after its franchise', () => {
    for (let i = 0; i < 40; i++) {
      const title = generateTitle(makeRng(`fr|${i}`), {
        genres: ['action'], format: 'feature', franchise: 'Ironpoint',
      });
      expect(title.startsWith('Ironpoint: '), title).toBe(true);
      expect(title.length).toBeGreaterThan('Ironpoint: '.length + 2);
    }
  });

  it('always finds a free title, even when nearly everything is taken', () => {
    // A cruel test: refuse every candidate that does not carry a colon, which
    // rules out almost the whole shape space and forces the compound forms.
    const title = generateTitle(makeRng('cornered'), {
      genres: ['drama'], format: 'feature',
      taken: (candidate) => !candidate.includes(':'),
    });
    expect(title.length).toBeGreaterThan(3);
  });
});

describe('nothing collides with the real record', () => {
  beforeAll(() => {
    // The known-titles index is what stops a generated title being a real one.
    // In the game it is filled from the studio catalogues as they load; here
    // it is filled from the roster's twenty thousand real credits, which is
    // the largest list of real titles the repository ships.
    const credits = readFileSync('public/industry/people-credits.tsv', 'utf8');
    const titles = credits.split('\n').slice(2)
      .map((line) => line.split('\t')[2] ?? '')
      .filter(Boolean);
    addKnownTitles([...new Set(titles)].join('\n'));
  });

  it('never hands back a title the record already has', () => {
    for (const kind of KINDS) {
      for (const title of run(kind, 500)) {
        expect(titleTaken(title), `${kind.label} produced a real title: "${title}"`).toBe(false);
      }
    }
  });

  it('respects whatever the caller says is taken', () => {
    const banned = new Set(['The Undertow', 'Reservoir', 'Lighthouse'].map(normaliseTitle));
    for (let i = 0; i < 500; i++) {
      const title = generateTitle(makeRng(`ban|${i}`), {
        genres: ['drama'], format: 'feature',
        taken: (candidate) => banned.has(normaliseTitle(candidate)),
      });
      expect(banned.has(normaliseTitle(title)), title).toBe(false);
    }
  });
});

describe('a whole universe never repeats itself', () => {
  it('runs ten years without two things sharing a title', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'titles-decade');
    for (let year = 0; year < 10; year++) {
      for (let i = 0; i < 10; i++) commissionProject(sim, 'us', `y${year}-${i}`);
      for (let i = 0; i < 4; i++) commissionProject(sim, 'uk', `uk${year}-${i}`);
      sim.advanceTo(sim.now + 365 * MS_DAY);
    }

    const titles = Object.values(sim.universe.projects).map((p) => p.title);
    expect(titles.length, 'a ten-year universe made almost nothing').toBeGreaterThan(100);
    const keys = titles.map(normaliseTitle);
    const duplicates = keys.filter((key, i) => keys.indexOf(key) !== i);
    expect(duplicates, `duplicate titles: ${[...new Set(duplicates)].join(', ')}`).toEqual([]);

    // And none of them is a real film.
    const real = titles.filter((title) => titleTaken(title));
    expect(real, `generated titles that collide with the record: ${real.join(', ')}`).toEqual([]);
  });

  it('never names two waves the same thing', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'titles-waves');
    for (let year = 0; year < 8; year++) {
      for (const country of ['us', 'uk', 'jp']) {
        for (let i = 0; i < 5; i++) commissionProject(sim, country, `w${year}-${country}-${i}`);
      }
      sim.advanceTo(sim.now + 365 * MS_DAY);
    }
    const waves = (sim.universe.zeitgeist?.history ?? []).map((w) => w.name);
    expect(waves.length, 'no movement ever started').toBeGreaterThan(2);
    expect(new Set(waves).size, `duplicate waves: ${waves.join(' | ')}`).toBe(waves.length);
  });

  it('never puts two shows with one name on television', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'titles-tv');
    sim.advanceTo(sim.now + 5 * 365 * MS_DAY);
    const shows: string[] = [];
    for (const network of Object.values(sim.universe.networks)) {
      for (const slot of network.schedule?.slots ?? []) shows.push(slot.title);
    }
    const keys = shows.map(normaliseTitle);
    const duplicates = keys.filter((key, i) => keys.indexOf(key) !== i);
    expect(duplicates, `two shows called the same thing: ${[...new Set(duplicates)].join(', ')}`).toEqual([]);
  });

  it('never gives two companies the same name', () => {
    const seen = new Set<string>();
    const rng = makeRng('companies');
    for (let i = 0; i < 900; i++) {
      const name = generateCompanyName(rng, (candidate) => seen.has(candidate.toLowerCase()));
      expect(seen.has(name.toLowerCase()), name).toBe(false);
      seen.add(name.toLowerCase());
    }
    expect(seen.size).toBe(900);
  });

  it('never puts two characters of one name in the same picture', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'titles-characters');
    for (let i = 0; i < 50; i++) commissionProject(sim, 'us', `c-${i}`);
    const byProject = new Map<string, string[]>();
    for (const role of Object.values(sim.universe.roles)) {
      const list = byProject.get(role.projectId) ?? [];
      list.push(role.characterName);
      byProject.set(role.projectId, list);
    }
    for (const [projectId, names] of byProject) {
      expect(new Set(names).size, `${projectId} has two characters called the same thing: ${names.join(', ')}`)
        .toBe(names.length);
    }
  });

  it('still lets a character name recur between different pictures', () => {
    // Names repeat across films, as they do in life. Only within one picture
    // is it a mistake.
    const rng = makeRng('recurrence');
    const names = new Set<string>();
    for (let i = 0; i < 400; i++) names.add(generateCharacterName(rng));
    expect(names.size).toBeLessThan(400);
    expect(names.size).toBeGreaterThan(120);
  });
});
