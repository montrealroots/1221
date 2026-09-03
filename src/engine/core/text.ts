/**
 * SLATE — how the game writes things down.
 *
 * Titles, labels and headings are Title Case: every word starts with a
 * capital. Prose is not — a sentence stays a sentence, with its punctuation.
 * Keeping the rule in one place means the interface, the engine and the
 * migration that repairs older saves all agree on what a label looks like.
 */

/**
 * Capitalises one word, leaving alone anything spelled the way it is on
 * purpose: acronyms (LA, VFX, P&L), mixed-case names (McKinsey, iPhone), and
 * anything with no letters in it at all.
 */
function capitaliseWord(word: string): string {
  if (!/[a-z]/.test(word)) return word;

  // Leading brackets and quotes are skipped; a leading digit is not. '97th' is
  // an ordinal, and '97Th' is nothing at all.
  const first = word.search(/[A-Za-z0-9]/);
  if (first < 0) return word;
  const lead = word[first] as string;
  if (lead >= '0' && lead <= '9') return word;
  if (/[A-Z]/.test(word.slice(first + 1))) return word;

  return word.slice(0, first) + lead.toUpperCase() + word.slice(first + 1);
}

/**
 * Whether a string is prose rather than a label.
 *
 * A full stop, question mark or exclamation at the end means somebody wrote a
 * sentence, and so does anything long enough to be one. Title-casing those
 * makes them worse, so they are left as they are.
 */
export function readsAsProse(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  if (/[.?!]$/.test(trimmed)) return true;
  return trimmed.split(/\s+/).length > 9;
}

/** Title Case for a label. Prose is returned untouched. */
export function titleCaseLabel(value: string): string {
  if (readsAsProse(value)) return value;
  return value.replace(/\S+/g, capitaliseWord);
}
