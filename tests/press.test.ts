/**
 * The trade press.
 *
 * Two kinds of claim are checked here and they are different in kind.
 *
 * What the registry says about a real publication has to be right or absent.
 * A founding year, an owner, a city: those are public record, and an
 * approximate one presented as a fact is a lie the player cannot check.
 *
 * What the generator produces has to be honest about itself, and above all it
 * has to not repeat. The headline claim — fifty thousand different ways of
 * writing about a picture — is measured here by generating pieces and counting
 * the distinct ones, not by multiplying the lengths of some arrays together.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { makeRng } from '@/engine/core/rng';
import { commissionProject } from '@/engine/systems/zeitgeist';
import {
  BEAT_LABEL, CADENCE_LABEL, OUTLETS, OUTLET_KIND_LABEL, PAYWALL_LABEL, REGISTER_LABEL,
  outletsIn, outletsOnBeat, registersInUse,
} from '@/engine/content/press';
import { TYPE_STYLES, TYPOGRAPHY, fontFamilies, fontStylesheetHref, typeFor } from '@/engine/content/press-type';
import {
  DESK_OF, STORY_KINDS, STORY_KIND_LABEL, storyText, voiceOf,
  type StoryFacts, type StoryKind,
} from '@/engine/content/press-story';
import { coverEvent, frameCombinations, outletFor, writeStory } from '@/engine/content/press-write';
import { frontPage, outletActivity, pressForProject, publish } from '@/engine/systems/press';
import { COUNTRIES } from '@/engine/content/geography';

const MS_DAY = 86_400_000;

const TITLES = ['The Undertow', 'Slack Water', 'Obituary', 'Northern Signal', 'A Final Retrograde', 'Hinterland', 'Man of Tomorrow'];
const PEOPLE = ['Ana Reyes', 'Tom Okafor', 'Mira Lindqvist', 'Joseph Nakamura', 'Elena Vasquez'];
const HOUSES = ['Warner Bros.', 'A24', 'Universal', 'Neon', 'Focus Features'];

/** A story with everything on it, so every frame gets a chance to be chosen. */
function fullFacts(kind: StoryKind, i: number): StoryFacts {
  return {
    kind,
    title: TITLES[i % TITLES.length],
    format: 'feature',
    genres: ['thriller', 'drama'],
    certificate: 'R',
    runtimeMinutes: 108 + (i % 30),
    logline: 'A harbour pilot has one night to keep a ship off the rocks.',
    studio: HOUSES[i % HOUSES.length],
    network: 'Netflix',
    distributor: HOUSES[(i + 1) % HOUSES.length],
    person: PEOPLE[i % PEOPLE.length],
    personRole: 'director',
    director: PEOPLE[(i + 1) % PEOPLE.length],
    cast: [PEOPLE[(i + 2) % PEOPLE.length]!, PEOPLE[(i + 3) % PEOPLE.length]!],
    writer: PEOPLE[(i + 4) % PEOPLE.length],
    executive: PEOPLE[(i + 2) % PEOPLE.length],
    executiveTitle: 'President Of Production',
    successor: PEOPLE[(i + 3) % PEOPLE.length],
    priorWork: TITLES[(i + 2) % TITLES.length],
    budget: 20_000_000_00 + (i % 9) * 15_000_000_00,
    money: 4_000_000_00 + (i % 7) * 2_000_000_00,
    opening: 18_000_000_00 + (i % 11) * 4_000_000_00,
    weekendGross: 9_000_000_00,
    runningTotal: 120_000_000_00,
    previousWeekend: 21_000_000_00,
    theatres: 3200 + (i % 9) * 100,
    dropPercent: 38 + (i % 30),
    multiple: 2.4 + (i % 5) * 0.3,
    criticScore: 40 + (i % 55),
    audienceScore: 45 + (i % 50),
    reviewCount: 120 + (i % 90),
    episodes: 8 + (i % 5),
    seasons: 1 + (i % 5),
    viewers: 2_400_000 + (i % 9) * 400_000,
    rank: 1 + (i % 8),
    nominations: 1 + (i % 9),
    year: 2026 + (i % 4),
    dateLabel: '14 August',
    previousDateLabel: '2 May',
    daysOut: 60 + (i % 90),
    shootDays: 30 + (i % 30),
    city: 'Los Angeles',
    festival: 'the Toronto International Film Festival',
    award: 'Academy Awards',
    category: 'Best Director',
    note: 'The company said the schedule could not be made to work.',
  };
}

describe('the publications', () => {
  it('holds every outlet once, with an id, a home and a beat', () => {
    const outlets = OUTLETS.all();
    expect(outlets.length).toBeGreaterThanOrEqual(40);
    expect(new Set(outlets.map((o) => o.id)).size).toBe(outlets.length);
    for (const outlet of outlets) {
      expect(outlet.name.trim().length, outlet.id).toBeGreaterThan(1);
      expect(outlet.shortName.trim().length, outlet.id).toBeGreaterThan(0);
      expect(outlet.beats.length, outlet.id).toBeGreaterThan(0);
      expect(COUNTRIES.get(outlet.countryId), `${outlet.id} is published nowhere`).toBeDefined();
      expect(outlet.city.trim().length, outlet.id).toBeGreaterThan(1);
      expect(outlet.about.length, outlet.id).toBeGreaterThan(60);
      expect(outlet.site).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/);
      expect(outlet.reach, outlet.id).toBeGreaterThan(0);
      expect(outlet.reach, outlet.id).toBeLessThanOrEqual(100);
      expect(outlet.speed, outlet.id).toBeGreaterThan(0);
      expect(outlet.speed, outlet.id).toBeLessThanOrEqual(100);
    }
  });

  it('states a founding year only where the record is clear', () => {
    for (const outlet of OUTLETS.all()) {
      if (outlet.founded === undefined) continue;
      // Nothing predates the trade press and nothing is founded in the future.
      expect(outlet.founded, outlet.id).toBeGreaterThan(1700);
      expect(outlet.founded, outlet.id).toBeLessThan(2026);
    }
    // The oldest outlets on the roster are the newspapers and the wires, which
    // is a fact about the record rather than about the game.
    const oldest = OUTLETS.all().filter((o) => o.founded).sort((a, b) => a.founded! - b.founded!)[0];
    expect(oldest?.kind === 'newspaper' || oldest?.kind === 'wire').toBe(true);
  });

  it('covers every beat and every register the generator can write in', () => {
    for (const beat of Object.keys(BEAT_LABEL) as (keyof typeof BEAT_LABEL)[]) {
      expect(outletsOnBeat(beat).length, `nobody covers ${beat}`).toBeGreaterThan(0);
    }
    for (const register of registersInUse()) {
      expect(REGISTER_LABEL[register], register).toBeDefined();
    }
    // Every story kind has somebody who would run it.
    for (const kind of STORY_KINDS) {
      const rng = makeRng(`beat|${kind}`);
      expect(outletFor(kind, rng), `nobody covers ${kind}`).toBeDefined();
    }
  });

  it('labels everything in Title Case', () => {
    const labels = [
      ...Object.values(BEAT_LABEL), ...Object.values(REGISTER_LABEL),
      ...Object.values(OUTLET_KIND_LABEL), ...Object.values(CADENCE_LABEL),
      ...Object.values(PAYWALL_LABEL), ...Object.values(STORY_KIND_LABEL),
    ];
    const joining = new Set(['a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
    for (const label of labels) {
      const words = label.split(/\s+/);
      words.forEach((word, i) => {
        const first = word.replace(/^[^A-Za-z]+/, '')[0];
        if (!first) return;
        if (i > 0 && joining.has(word.toLowerCase())) return;
        expect(first, `"${label}" has a lowercase word`).toBe(first.toUpperCase());
      });
    }
  });

  it('publishes from more than one country', () => {
    const countries = new Set(OUTLETS.all().map((o) => o.countryId));
    expect(countries.size).toBeGreaterThan(5);
    expect(outletsIn('us').length).toBeGreaterThan(10);
    expect(outletsIn('uk').length).toBeGreaterThan(3);
  });
});

describe('the type each publication is set in', () => {
  it('gives every outlet a face, and a real fallback behind it', () => {
    for (const outlet of OUTLETS.all()) {
      const { style } = typeFor(outlet.id);
      expect(style, outlet.id).toBeDefined();
      // Every stack ends in a generic family, so a blocked webfont still reads.
      expect(style.headlineStack, outlet.id).toMatch(/(serif|sans-serif|monospace)$/);
      expect(style.bodyStack, outlet.id).toMatch(/(serif|sans-serif|monospace)$/);
      expect(style.headlineWeight).toBeGreaterThanOrEqual(400);
    }
  });

  it('never claims a publication’s own face is what is rendered', () => {
    for (const [id, entry] of Object.entries(TYPOGRAPHY)) {
      if (!entry.realTypeface) continue;
      const style = TYPE_STYLES[entry.style];
      // The face named as the publication's own is never the one shipped.
      expect(entry.realTypeface, id).not.toBe(style.headline);
      expect(entry.realTypeface, id).not.toBe(style.body);
    }
  });

  it('loads its faces in one request', () => {
    const href = fontStylesheetHref();
    expect(href.startsWith('https://fonts.googleapis.com/css2?')).toBe(true);
    for (const family of fontFamilies()) {
      expect(href, family).toContain(family.replace(/ /g, '+'));
    }
    // Ten styles, not forty families.
    expect(fontFamilies().length).toBeLessThanOrEqual(20);
  });

  it('does not set two outlets a player sees together in the same face', () => {
    // The biggest handful, which are the ones that appear side by side most.
    const biggest = OUTLETS.all().sort((a, b) => b.reach - a.reach).slice(0, 6);
    const styles = new Set(biggest.map((o) => typeFor(o.id).style.id));
    expect(styles.size).toBeGreaterThan(3);
  });
});

describe('how many ways there are to write a story', () => {
  it('has more than fifty thousand shapes before a single phrase is drawn', () => {
    expect(frameCombinations()).toBeGreaterThan(50_000);
  });

  it('writes fifty thousand pieces and almost none of them are the same', () => {
    const whole = new Set<string>();
    const ledes = new Set<string>();
    let written = 0;
    for (const kind of STORY_KINDS) {
      for (const outlet of OUTLETS.all()) {
        for (let i = 0; i < 40; i++) {
          const rng = makeRng(`press|${kind}|${outlet.id}|${i}`);
          const story = writeStory(outlet, fullFacts(kind, i), rng);
          expect(story, `${outlet.id} cannot write a ${kind}`).toBeDefined();
          written++;
          whole.add(storyText(story!));
          ledes.add(story!.paragraphs[0] ?? '');
        }
      }
    }
    expect(written).toBeGreaterThan(45_000);
    // The claim is fifty thousand different ways of writing about a picture.
    // This is the measurement of it: distinct finished pieces, not a product
    // of array lengths.
    expect(whole.size).toBeGreaterThan(50_000 * 0.95);
    expect(whole.size / written).toBeGreaterThan(0.99);
    expect(ledes.size).toBeGreaterThan(20_000);
  });

  it('writes a real paragraph rather than a headline and a stub', () => {
    for (const kind of STORY_KINDS) {
      for (let i = 0; i < 8; i++) {
        const rng = makeRng(`shape|${kind}|${i}`);
        const outlet = outletFor(kind, rng)!;
        const story = writeStory(outlet, fullFacts(kind, i), rng)!;
        expect(story.paragraphs.length, `${kind} ran short`).toBeGreaterThanOrEqual(2);
        for (const paragraph of story.paragraphs) {
          expect(paragraph.length, `${kind}: "${paragraph}"`).toBeGreaterThan(30);
          expect(paragraph.trim(), `${kind}: "${paragraph}"`).toMatch(/[.!?]$/);
        }
        expect(story.headline.length).toBeGreaterThan(6);
        expect(story.standfirst.length).toBeGreaterThan(6);
      }
    }
  });

  it('never says the same thing twice inside one piece', () => {
    for (const kind of STORY_KINDS) {
      for (let i = 0; i < 30; i++) {
        const rng = makeRng(`repeat|${kind}|${i}`);
        const outlet = outletFor(kind, rng)!;
        const story = writeStory(outlet, fullFacts(kind, i), rng)!;
        const blocks = [story.standfirst, ...story.paragraphs];
        for (let a = 0; a < blocks.length; a++) {
          for (let b = a + 1; b < blocks.length; b++) {
            const one = blocks[a]!;
            const two = blocks[b]!;
            const shorter = one.length <= two.length ? one : two;
            const longer = one.length <= two.length ? two : one;
            if (shorter.length < 40) continue;
            const chunk = shorter.slice(0, 40);
            expect(longer.includes(chunk), `${kind} repeats itself: "${chunk}"`).toBe(false);
          }
        }
      }
    }
  });

  it('writes clean English: no double spaces, no orphan punctuation, no empty slots', () => {
    for (const kind of STORY_KINDS) {
      for (let i = 0; i < 20; i++) {
        const rng = makeRng(`clean|${kind}|${i}`);
        const outlet = outletFor(kind, rng)!;
        const story = writeStory(outlet, fullFacts(kind, i), rng)!;
        const text = storyText(story);
        expect(text, kind).not.toMatch(/ {2}/);
        expect(text, kind).not.toMatch(/\s[,.;]/);
        // A doubled stop is a bug; 'Warner Bros., where' is not, so the
        // abbreviation-then-comma case is deliberately allowed.
        expect(text, kind).not.toMatch(/[^.]\.\.(?!\.)/);
        expect(text, kind).not.toMatch(/,,|;;/);
        expect(text, kind).not.toMatch(/\bundefined\b/);
        expect(text, kind).not.toMatch(/\bNaN\b/);
        expect(text, kind).not.toMatch(/\$NaN/);
        expect(text, kind).not.toMatch(/\[object/);
      }
    }
  });

  it('keeps a real title spelled the way it is spelled, even in a headline', () => {
    // Title Case is SLATE's rule for its own labels. A name is not a label:
    // 'Man of Tomorrow' stays as it is.
    let seen = 0;
    for (let i = 0; i < 400; i++) {
      const rng = makeRng(`case|${i}`);
      const facts = fullFacts(STORY_KINDS[i % STORY_KINDS.length]!, 6);
      const outlet = outletFor(facts.kind, rng)!;
      const story = writeStory(outlet, facts, rng)!;
      if (!story.headline.includes('Man of Tomorrow') && !/man of tomorrow/i.test(story.headline)) continue;
      seen++;
      expect(story.headline, 'a real title was recapitalised').toContain('Man of Tomorrow');
    }
    expect(seen, 'no headline carried the title at all').toBeGreaterThan(0);
  });

  it('sends a story only to somebody who covers that beat', () => {
    for (const kind of STORY_KINDS) {
      for (let i = 0; i < 40; i++) {
        const rng = makeRng(`beatcheck|${kind}|${i}`);
        const outlet = outletFor(kind, rng);
        expect(outlet, kind).toBeDefined();
        const stories = coverEvent(fullFacts(kind, i), rng, { count: 3 });
        expect(stories.length, kind).toBeGreaterThan(0);
        // Nobody runs the same event twice.
        expect(new Set(stories.map((s) => s.outletId)).size).toBe(stories.length);
      }
    }
  });

  it('gives every register its own way of ending a piece', () => {
    const bySignOff = new Map<string, Set<string>>();
    for (const outlet of OUTLETS.all()) {
      for (let i = 0; i < 25; i++) {
        const rng = makeRng(`close|${outlet.id}|${i}`);
        const story = writeStory(outlet, fullFacts('opening', i), rng)!;
        const last = story.paragraphs[story.paragraphs.length - 1] ?? '';
        const set = bySignOff.get(outlet.register) ?? new Set<string>();
        set.add(last);
        bySignOff.set(outlet.register, set);
      }
    }
    for (const [register, closes] of bySignOff) {
      expect(closes.size, `${register} always ends the same way`).toBeGreaterThan(4);
    }
  });

  it('has a desk for every kind, and a voice for every outlet', () => {
    for (const kind of STORY_KINDS) expect(DESK_OF[kind], kind).toBeDefined();
    for (const outlet of OUTLETS.all()) {
      const voice = voiceOf(outlet);
      expect(voice.numbers).toBeGreaterThanOrEqual(0);
      expect(voice.numbers).toBeLessThanOrEqual(1);
      expect(voice.opinion).toBeGreaterThanOrEqual(0);
      expect(voice.clip).toBeLessThanOrEqual(1);
    }
  });
});

describe('the press inside a save', () => {
  it('covers a running world without repeating itself', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'press-live');
    for (let i = 0; i < 40; i++) commissionProject(sim, 'us', `live-${i}`);
    sim.advanceTo(sim.now + 500 * MS_DAY);

    const page = frontPage(sim, 500);
    expect(page.length).toBeGreaterThan(30);
    const heads = new Set(page.map((p) => p.headline));
    // A front page with the same headline twice is the one thing that would
    // give the whole system away.
    expect(heads.size / page.length).toBeGreaterThan(0.97);
    const ledes = new Set(page.map((p) => p.paragraphs[0]));
    expect(ledes.size / page.length).toBeGreaterThan(0.95);
  });

  it('spreads the coverage across the trades rather than one masthead', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'press-spread');
    for (let i = 0; i < 40; i++) commissionProject(sim, 'us', `spread-${i}`);
    sim.advanceTo(sim.now + 500 * MS_DAY);

    const active = outletActivity(sim).filter((o) => o.pieces > 0);
    expect(active.length, 'only a handful of outlets ever run anything').toBeGreaterThan(8);
    const total = active.reduce((sum, o) => sum + o.pieces, 0);
    expect(active[0]!.pieces / total, 'one outlet wrote everything').toBeLessThan(0.35);
  });

  it('stays bounded however long a save runs', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'press-bounded');
    for (let i = 0; i < 60; i++) commissionProject(sim, 'us', `bound-${i}`);
    sim.advanceTo(sim.now + 1600 * MS_DAY);
    expect(sim.universe.press.length).toBeLessThanOrEqual(400);
  });

  it('files a piece against the thing it is about', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'press-filed');
    const project = commissionProject(sim, 'us', 'filed-1');
    expect(project).toBeDefined();
    publish(sim, { kind: 'greenlight', title: project!.title, studio: 'Neon', budget: 40_000_000_00 }, {
      projectId: project!.id,
    });
    const filed = pressForProject(sim, project!.id);
    expect(filed.length).toBeGreaterThan(0);
    for (const item of filed) expect(item.projectId).toBe(project!.id);
  });

  it('publishes nothing it has no honest way to write', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'press-empty');
    // A story kind with none of the facts its frames need is not invented.
    const before = sim.universe.press.length;
    publish(sim, { kind: 'earnings' }, {});
    expect(sim.universe.press.length).toBe(before);
  });
});
