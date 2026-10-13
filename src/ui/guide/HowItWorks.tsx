/**
 * SLATE — How This Works, beside a feature (from 2026-10-12): opens the guide's reference at the feature's entry,
 * over the screen, so nothing under it is lost. It runs no command and moves no clock.
 *
 * Its prop is `help`, never `feature`: `tests/tutorial.test.ts` counts a literal feature prop as a gated control, and a help
 * link mustn't stand in for one.
 */

import { entryFor } from '@/engine/content/guide';
import { useHelp } from './help-context';

export function HowItWorks({ help, label = 'How This Works' }: { help: string; label?: string }) {
  const { open } = useHelp();
  const entry = entryFor(help);
  if (!entry) return null;
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm how-it-works"
      aria-label={`${label}: ${entry.title}`}
      aria-haspopup="dialog"
      onClick={() => open(entry.id)}
    >
      {label}
    </button>
  );
}
