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

const SOURCES = [...walk('src/ui'), ...walk('src/app'), ...walk('src/engine/systems'), ...walk('src/styles')];

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
      for (const match of text.matchAll(/id: '[a-z_-]+', label: '([^']+)'/g)) labels.push({ file, label: match[1]! });
    }
    // A floor so the scan cannot silently match nothing and pass. It used to
    // be twenty. The housing options were the last thing matching the old
    // pattern and they went with the page, taking the scan to zero; it now
    // matches the startup stages, which are written the same way.
    expect(labels.length).toBeGreaterThan(0);
    for (const { file, label } of labels) {
      expect(label, `${file}: ${label}`).not.toMatch(EMOJI);
      expect(label, `${file}: ${label}`).toMatch(/^[A-Za-z0-9?'’&, ]+$/);
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

/**
 * A thing does not need a handle to be looked at.
 *
 * The depth engine's first rule is that the name is the control: you press
 * "Stress", or "Reykjavík", or "Everyday Checking", and it opens. A button
 * labelled Open or Details or More is the opposite of that — it is a handle
 * bolted onto a thing that should have been pressable itself, and two of them
 * shipped on Home before the engine existed.
 *
 * A verb that says where it goes is not a handle. "Open Calendar" names a
 * screen and "Go There" names a route; "Open" names nothing.
 */
describe('affordances', () => {
  const HANDLES = ['Open', 'Show', 'Hide', 'Details', 'More', 'View', 'Expand'];

  it('labels no control with a bare handle', () => {
    const offenders: string[] = [];
    for (const file of SOURCES) {
      if (!file.endsWith('.tsx')) continue;
      const text = readFileSync(file, 'utf8');
      for (const [index, line] of text.split('\n').entries()) {
        // The whole of a button's text, on its own line between the tags.
        const alone = /^\s*(?:\{'\s*)?([A-Za-z]+)\s*(?:'\})?\s*$/.exec(line);
        const word = alone?.[1];
        if (!word || !HANDLES.includes(word)) continue;
        const before = text.split('\n').slice(Math.max(0, index - 4), index).join(' ');
        if (/<button|className="btn|className={`btn/.test(before)) {
          offenders.push(`${file}:${index + 1}  "${word}"`);
        }
      }
    }
    expect(offenders, 'controls whose whole label is a handle rather than a name').toEqual([]);
  });

  it('carries no information in a title attribute, on the screens depth reaches', () => {
    // Rule 13. A tooltip is not depth: it is invisible on a phone, invisible
    // to a keyboard and invisible to a screen reader, and it was how the
    // calendar row on Home used to say what it was.
    //
    // Held over Home and the look declarations, which is as far as the engine
    // has been taken. Thirteen more sit on the calendar, the shell and the
    // creation pickers; they are older than this rule and they move when
    // those screens do, not before. Widening the glob is what promotes them.
    const REACHED = /ui\/(screens\/Home|looks\/)/;
    const offenders: string[] = [];
    for (const file of SOURCES) {
      if (!file.endsWith('.tsx') || !REACHED.test(file)) continue;
      for (const [index, line] of readFileSync(file, 'utf8').split('\n').entries()) {
        if (/\stitle={/.test(line)) offenders.push(`${file}:${index + 1}`);
      }
    }
    expect(offenders, 'title attributes carrying what the screen should say').toEqual([]);
  });
});
