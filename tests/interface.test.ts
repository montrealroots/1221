/**
 * The interface is text.
 *
 * No emoji on a tab, a tile, a breadcrumb or a search result, and no glyph
 * standing in for a word: a symbol that is a picture on one platform and a
 * box on another is not a label, and a screen reader has nothing to say
 * about it. The one picture the game keeps is its own mark, the clapper,
 * and only where it is the brand and never inside an accessible name.
 *
 * Two things are outside that rule, both on purpose.
 *
 * The weather keeps its picture, because the weather is the one place where a
 * picture reads faster than a word and where every phone, every forecast and
 * every newspaper uses one. It is always beside the word rather than instead
 * of it, and always hidden from a screen reader, which has the word.
 *
 * And the apps inside the phone are not SLATE's interface. They are other
 * people's apps, drawn as they are: a comment section that says nothing but
 * "Perfect" where the real one says "Perfect 🔥" is not the app. So
 * `src/ui/phone` is exempt, and SLATE's own chrome around it is not.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_DESTINATIONS, DESTINATIONS } from '@/ui/shell/destinations';
import { WEATHER_EMOJI } from '@/engine/systems/weather';

// Anything Unicode says may be drawn as a picture, plus the selectors and
// joiners that make one. A tick or a cross in the Dingbats block that has no
// emoji form is a glyph, not an emoji, and passes.
const EMOJI = /\p{Extended_Pictographic}|\u{FE0F}|\u{200D}|[\u{1F1E6}-\u{1F1FF}]/u;
const BRAND = '🎬';
const BRAND_FILES = new Set([
  'src/app/SlateApp.tsx', 'src/ui/startup/StartupSequence.tsx', 'src/ui/saves/SaveSlots.tsx',
  'src/ui/creation/CharacterCreation.tsx', 'src/ui/shell/GameShell.tsx',
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx|css)$/.test(name)) out.push(path);
  }
  return out;
}

/** The apps inside the phone are other people's apps and keep their emoji. */
const PHONE = /^src[\\/]ui[\\/]phone[\\/]/;

const SOURCES = [...walk('src/ui'), ...walk('src/app'), ...walk('src/engine/systems'), ...walk('src/engine/scenes'), ...walk('src/styles')]
  .filter((file) => !PHONE.test(file));

describe('navigation', () => {
  it('names every destination in plain words', () => {
    for (const dest of ALL_DESTINATIONS) {
      expect(dest.label, dest.route).toMatch(/^[A-Z][A-Za-z]*( [A-Z][A-Za-z]*)*$/);
      expect(dest.detail, dest.route).not.toMatch(EMOJI);
      expect('icon' in dest, `${dest.route} carries an icon`).toBe(false);
    }
    for (const group of DESTINATIONS) expect(group.label).toMatch(/^[A-Z][A-Za-z]*( [A-Z][A-Za-z]*)*$/);
  });

  it('labels every tab with words, not pictures', () => {
    const labels: { file: string; label: string }[] = [];
    for (const file of SOURCES) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/\{ id: '[a-z_-]+', label: '([^']+)'/g)) labels.push({ file, label: match[1]! });
    }
    expect(labels.length).toBeGreaterThan(20);
    for (const { file, label } of labels) {
      expect(label, `${file}: ${label}`).not.toMatch(EMOJI);
      expect(label, `${file}: ${label}`).toMatch(/^[A-Za-z0-9?'&, ]+$/);
      // Title Case: every word capitalised, as the rest of the game is.
      for (const word of label.split(' ')) expect(word, `${file}: "${label}"`).toMatch(/^[A-Z0-9]/);
    }
  });
});

describe('the whole interface', () => {
  it('has no emoji anywhere but the brand mark, and that only where it is the brand', () => {
    const weather = Object.values(WEATHER_EMOJI);
    for (const file of SOURCES) {
      const text = readFileSync(file, 'utf8');
      let stripped = BRAND_FILES.has(file) ? text.split(BRAND).join('') : text;
      // The weather's own pictures are allowed wherever the weather is shown.
      for (const picture of weather) stripped = stripped.split(picture).join('');
      const hit = stripped.match(EMOJI);
      expect(hit, `${file} carries ${hit?.[0] ?? ''}`).toBeNull();
    }
  });

  it('keeps the weather picture beside the word and out of the accessible name', () => {
    const weather = Object.values(WEATHER_EMOJI);
    for (const file of SOURCES) {
      // The table the pictures are declared in is the one place they stand alone.
      if (file.endsWith('weather.ts')) continue;
      const text = readFileSync(file, 'utf8');
      for (const line of text.split('\n')) {
        if (!weather.some((picture) => line.includes(picture))) continue;
        expect(line, `${file}: ${line.trim()}`).toMatch(/aria-hidden="true"/);
      }
    }
  });

  it('keeps the brand mark out of every accessible name', () => {
    for (const file of BRAND_FILES) {
      const text = readFileSync(file, 'utf8');
      for (const line of text.split('\n')) {
        if (!line.includes(BRAND)) continue;
        expect(line, `${file}: ${line.trim()}`).toMatch(/aria-hidden="true"|aria-label="SLATE"/);
      }
    }
  });
});
