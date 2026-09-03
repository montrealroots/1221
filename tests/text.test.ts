/**
 * How the game writes labels down.
 */

import { describe, expect, it } from 'vitest';
import { readsAsProse, titleCaseLabel } from '@/engine/core/text';

describe('title case', () => {
  it('capitalises every word of a label', () => {
    expect(titleCaseLabel('New day')).toBe('New Day');
    expect(titleCaseLabel('skip to event')).toBe('Skip To Event');
    expect(titleCaseLabel('Rent — 3405 Rosemont Road due')).toBe('Rent — 3405 Rosemont Road Due');
    expect(titleCaseLabel('awards season')).toBe('Awards Season');
  });

  it('leaves words that are spelled that way on purpose', () => {
    expect(titleCaseLabel('LA office')).toBe('LA Office');
    expect(titleCaseLabel('VFX and P&L')).toBe('VFX And P&L');
    expect(titleCaseLabel('iPhone budget')).toBe('iPhone Budget');
    expect(titleCaseLabel('McKinsey report')).toBe('McKinsey Report');
  });

  it('leaves numbers, symbols and money alone', () => {
    expect(titleCaseLabel('97th The Vanguard Awards')).toBe('97th The Vanguard Awards');
    expect(titleCaseLabel('$250m greenlight')).toBe('$250m Greenlight');
  });

  it('does not touch a sentence', () => {
    for (const prose of [
      'You were too exhausted to work.',
      'Why did I not get the part?',
      'They accepted it. The air cleared.',
      'No bills overdue, no offers expiring, no conflicts on the calendar today.',
    ]) {
      expect(titleCaseLabel(prose), prose).toBe(prose);
      expect(readsAsProse(prose), prose).toBe(true);
    }
  });

  it('is idempotent, so running it twice changes nothing', () => {
    for (const label of ['New Day', 'Skip To Event', 'LA Office', 'Awards Season']) {
      expect(titleCaseLabel(titleCaseLabel(label))).toBe(titleCaseLabel(label));
    }
  });

  it('survives an empty or whitespace string', () => {
    expect(titleCaseLabel('')).toBe('');
    expect(titleCaseLabel('   ')).toBe('   ');
  });
});
