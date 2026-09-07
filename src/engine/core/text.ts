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

/** The formats a project comes in, written the way the trade writes them. */
const FORMAT_LABELS: Readonly<Record<string, string>> = { feature: 'Feature', short: 'Short', series: 'Series', limited_series: 'Limited Series', documentary: 'Documentary', tv_movie: 'TV Movie' };
export function formatLabel(format: string): string {
  return FORMAT_LABELS[format] ?? titleCaseLabel(format.replace(/_/g, ' '));
}

/** The same formats in a sentence: "makes features", "makes limited series". */
const FORMAT_PLURALS: Readonly<Record<string, string>> = { feature: 'features', short: 'shorts', series: 'series', limited_series: 'limited series', documentary: 'documentaries', tv_movie: 'TV movies' };
export function formatPlural(format: string): string {
  return FORMAT_PLURALS[format] ?? `${format.replace(/_/g, ' ')}s`;
}

/**
 * The things you can own and buy, written the way the game writes them
 * everywhere else. The stored keys are terse and American; the labels are the
 * game's own spelling, in Title Case like every other label.
 */
const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  jewelry: 'Jewelry',
  groceries: 'Groceries',
  prepared_food: 'Prepared Food',
  clothing: 'Clothing',
  footwear: 'Footwear',
  watch: 'Watches',
  furniture: 'Furniture',
  appliance: 'Appliances',
  electronics: 'Electronics',
  art: 'Art',
  accessory: 'Accessories',
};
export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? titleCaseLabel(category.replace(/_/g, ' '));
}

/**
 * A count with its noun, agreeing with itself.
 *
 * Nothing in the game should ever print "1 things". Pass the plural only when
 * it is not the singular with an s on the end.
 */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}
