/**
 * The guide's worked example for The Guide (`start.guide`) set its scene by pressing Rest in Look After Yourself. The
 * menu has no Rest: it holds Eat A Meal, Order In, Shower, Work Out and Unwind (`LOOKING_AFTER`, `systems/life.ts`),
 * and while its chapter is unread the control a player presses is the menu's own button, Look After Yourself, wearing
 * Locked (`ui/shell/TimeControls.tsx`). Every press the guide names in that menu is held here against the menu's labels
 * (from 2026-10-12).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GUIDE, GUIDE_BY_ID } from '@/engine/content/guide';
import { LOOKING_AFTER } from '@/engine/systems/life';

const MENU = 'Look After Yourself';
const LABELS = new Set(Object.values(LOOKING_AFTER).map((l) => l.label));

/** Each thing a sentence says to press inside the menu: "pressing X in Look After Yourself", "Open Look After Yourself and press X". */
function pressedInMenu(text: string): string[] {
  return [
    ...[...text.matchAll(/\bpress(?:ing)? ([A-Z][^.,;:“”]*?) (?:in|under|on) Look After Yourself\b/g)].map((m) => m[1]!),
    ...[...text.matchAll(/\bOpen Look After Yourself and press ([A-Z][^.,;:“”]*?)[.,;]/g)].map((m) => m[1]!),
  ];
}

/** What an entry's worked example says to press in the menu that the menu doesn't have. */
function unknownPresses(example: { setup: string; steps: readonly string[]; result: string }): string[] {
  return [example.setup, ...example.steps, example.result].flatMap(pressedInMenu).filter((label) => !LABELS.has(label));
}

describe('the guide presses only what Look After Yourself holds', () => {
  it('reads a press out of a sentence, and tells a real item from one the menu lacks', () => {
    // The check's own falsifiability: the old setup names Rest, which the menu lacks; the menu's own button names nothing inside it.
    expect(unknownPresses({ setup: 'A guided life, two chapters read, pressing Rest in Look After Yourself.', steps: [], result: '' })).toEqual(['Rest']);
    expect(unknownPresses({ setup: 'A guided life, two chapters read, pressing Look After Yourself.', steps: [], result: '' })).toEqual([]);
    expect(unknownPresses({ setup: '', steps: ['Open Look After Yourself and press Eat A Meal.'], result: '' })).toEqual([]);
  });

  it('the menu button the guide’s example presses is the one the top bar draws, Locked while its chapter is unread', () => {
    const bar = readFileSync(fileURLToPath(new URL('../src/ui/shell/TimeControls.tsx', import.meta.url)), 'utf8');
    expect(bar).toContain(`${MENU} ▾{!gate.open && <span className="lock-word">Locked</span>}`);
  });

  it('names no item the menu lacks in any entry’s worked example, The Guide’s included', () => {
    const wrong = GUIDE.flatMap((e) => unknownPresses(e.example).map((label) => `${e.id}: ${label}`));
    expect(wrong).toEqual([]);
    expect(unknownPresses(GUIDE_BY_ID['start.guide']!.example)).toEqual([]);
  });
});
