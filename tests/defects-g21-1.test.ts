/**
 * Group g21, part 1 (2026-10-12): Keep The Balance There's How It Works. `bank.stop_balance_transfer` is a step of a
 * British bank switch, drawn on the Accounts tab's Switch Bank panel (`ui/bank/BankLending.tsx`) and refused by
 * `systems/lending.ts` unless a switch is under way. Until the guide was corrected later that day,
 * `content/guide/money.ts` put it in A Card's Offers (`bank.card-offers`) covers, beside a card's money transfer and
 * plan, so its How It Works opened the card offers entry, not Another Bank, which the panel's own help opens. PLAYER
 * JOURNEY: a student in London, mid switch, pressing How It Works beside Keep The Balance There. Held against
 * BankLending's source, so a control moved off the panel, or a panel whose help changes, has to be answered here.
 *
 * SETTLED: the fix was prose in `content/guide/money.ts`, which part 1 didn't own. Both checks failed on the tree as it
 * stood on 2026-10-12 ("bank.stop_balance_transfer opens bank.card-offers"), and passed with the move applied in
 * memory, `tests/guide.test.ts` passing beside them. They were `it.fails` until the move landed, which kept the gate
 * green and the defect pinned. The move has landed: Another Bank (`bank.other-banks`) covers the step, and A Card's
 * Offers says nothing of the switch. That turned both red ("Expect test to fail"), and each is an `it` now.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { entryFor, GUIDE_BY_ID } from '@/engine/content/guide';

const SOURCE = readFileSync(new URL('../src/ui/bank/BankLending.tsx', import.meta.url), 'utf8');

/** The Switch Bank panel's source, from its opening tag to its close. */
function switchPanel(): string {
  const start = SOURCE.indexOf('<Panel title="Switch Bank"');
  expect(start, 'BankLending draws a Switch Bank panel').toBeGreaterThan(-1);
  const end = SOURCE.indexOf('</Panel>', start);
  return SOURCE.slice(start, end);
}

const idsIn = (text: string, attr: 'help' | 'feature') => [...text.matchAll(new RegExp(`${attr}="([^"]+)"`, 'g'))].map((m) => m[1]!);

describe('Keep The Balance There opens the switch’s entry, not a card’s offers', () => {
  it('every control and How It Works on the Switch Bank panel opens the panel’s own entry', () => {
    const panel = switchPanel();
    const [own] = idsIn(panel, 'help');
    expect(own).toBe('bank.other-banks');
    const ids = [...new Set([...idsIn(panel, 'help'), ...idsIn(panel, 'feature')])];
    expect(ids).toContain('bank.stop_balance_transfer');
    expect(ids.filter((id) => entryFor(id)?.id !== own).map((id) => `${id} opens ${entryFor(id)?.id}`)).toEqual([]);
  });

  it('A Card’s Offers no longer describes the switch step; Another Bank does', () => {
    const offers = GUIDE_BY_ID['bank.card-offers']!;
    const other = GUIDE_BY_ID['bank.other-banks']!;
    expect(offers.covers).not.toContain('bank.stop_balance_transfer');
    expect(other.covers).toContain('bank.stop_balance_transfer');
    const text = (e: typeof offers) => JSON.stringify([e.synonyms, e.questions, e.short, e.steps, e.needs, e.now, e.later, e.unavailable, e.connections]);
    expect(text(offers)).not.toMatch(/Stop The Balance Transfer|Keep The Balance There|switch/i);
    // The command's refusals (`systems/lending.ts`) are listed where the control's help lands.
    expect(text(other)).toMatch(/Keep The Balance There/);
    expect(text(other)).toMatch(/Its balance transfer is already stopped/);
  });
});
