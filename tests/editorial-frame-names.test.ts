/**
 * The top bar's two menu buttons, as a screen reader names them (from 2026-10-17, brief 14's editorial review). Each draws
 * its menu's arrow, and until then drew it as text, so the button's accessible name was “Advance ▾” and “Look After
 * Yourself ▾”. The arrow is in a span hidden from assistive technology now. Measured on the built app by
 * `docs/verification/language-2026-10-17/editorial/names.mjs` (`names.json`: the browser's own name, “Advance” exactly,
 * none with the arrow); this holds the markup that gives it, read from the source as `tests/defects-g7-1.test.ts` does.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const bar = readFileSync(fileURLToPath(new URL('../src/ui/shell/TimeControls.tsx', import.meta.url)), 'utf8');

describe('the top bar’s menu buttons: the arrow drawn, not said', () => {
  it('Advance and Look After Yourself each hide their arrow from a screen reader, and no arrow on the bar is said', () => {
    for (const menu of ['Advance', 'Look After Yourself']) expect(bar).toContain(`        ${menu} <span aria-hidden="true">▾</span>{!gate.open`);
    const said = bar.split('\n').filter((l) => l.includes('▾') && !l.includes('<span aria-hidden="true">▾</span>') && !/^\s*(\/\/|\*|\{\/\*|name was)/.test(l.trim()) && !l.includes('“Advance ▾”'));
    expect(said).toEqual([]);
  });
});
