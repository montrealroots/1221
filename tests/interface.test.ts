/**
 * The interface is text.
 *
 * No emoji on a tab, a tile, a breadcrumb or a search result, and no glyph
 * standing in for a word: a symbol that is a picture on one platform and a
 * box on another is not a label, and a screen reader has nothing to say
 * about it. The one picture the game keeps is its own mark, the clapper,
 * and only where it is the brand and never inside an accessible name.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_DESTINATIONS, DESTINATIONS } from '@/ui/shell/destinations';

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

const SOURCES = [...walk('src/ui'), ...walk('src/app'), ...walk('src/engine/systems'), ...walk('src/engine/scenes'), ...walk('src/styles')];

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
    for (const file of SOURCES) {
      const text = readFileSync(file, 'utf8');
      const stripped = BRAND_FILES.has(file) ? text.split(BRAND).join('') : text;
      const hit = stripped.match(EMOJI);
      expect(hit, `${file} carries ${hit?.[0] ?? ''}`).toBeNull();
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
