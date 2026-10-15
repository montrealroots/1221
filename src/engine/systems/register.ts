/**
 * SLATE — a genre's register in words, and the concern behind a take's limit (from 2026-10-16, `content/concerns.ts`,
 * `content/genre-register.ts`). The brief's pane, the genre's look, the take's note and the guide read these, so what the
 * screen says a genre asks is what the take is judged by.
 */

import { ABILITY_DEFS, type AbilityId } from '../content/abilities';
import { CONCERNS, type Concern } from '../content/concerns';
import { GENRE_BY_ID } from '../content/film-genres';
import { GENRE_REGISTER } from '../content/genre-register';
import { DIMENSION_LABEL, type Dimension } from '../content/tasks';
import type { Brief } from '../content/briefs';
import type { Evaluation } from './evaluation';

const and = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0] ?? '');
const abilityLabel = (id: string) => ABILITY_DEFS.find((d) => d.id === id)?.label ?? id;

/** The dimensions a concern leans the take toward, most first. */
export const concernLeans = (c: Concern): Dimension[] => (Object.entries(CONCERNS[c].lean) as [Dimension, number][]).filter(([, x]) => x > 1).sort((a, b) => b[1] - a[1]).map(([d]) => d);

/** The abilities a concern draws on, most first. */
export function concernDraws(c: Concern): AbilityId[] {
  const w = new Map<AbilityId, number>();
  for (const xs of Object.values(CONCERNS[c].inputs)) for (const x of xs ?? []) w.set(x.ability, (w.get(x.ability) ?? 0) + x.weight);
  return [...w.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a);
}

/**
 * A concern in a sentence for the screen: its label and what it asks, what the take weighs more and draws on, and what
 * preparation answers it.
 */
export function concernWords(c: Concern): string {
  const def = CONCERNS[c];
  const leans = concernLeans(c).map((d) => DIMENSION_LABEL[d].toLowerCase());
  const draws = concernDraws(c).map((a) => abilityLabel(a).toLowerCase());
  return `${def.label}: ${def.words} The take weighs ${and(leans)} more and draws on your ${and(draws)}. ${def.helps}`;
}

/** A genre's concerns, none where it has no register. */
export const concernsOf = (genre: string): readonly Concern[] => GENRE_REGISTER[genre]?.concerns ?? [];

/** Where a genre's register comes from, in a sentence: the research's claim, or SLATE's reading of its conventions. */
export function registerBasisWords(genre: string): string | undefined {
  const r = GENRE_REGISTER[genre];
  if (!r) return undefined;
  return `${r.why} ${r.basis === 'research' ? 'From the genre’s research, mostly at low confidence.' : 'The research found nothing on how it’s played: this is SLATE’s reading of its conventions.'}`;
}

/**
 * The concern behind a take's chief limit (from 2026-10-16): where the first thing holding the take back is an ability
 * the brief's genre draws on, the concern that draws on it most. None where the limit is anything else, or the genre
 * doesn't ask it: the note then says only what held it back, as it did before.
 */
export function concernBehind(b: Brief, e: Pick<Evaluation, 'limits'>): Concern | undefined {
  const first = e.limits[0];
  if (!first || first.kind !== 'ability') return undefined;
  let best: { c: Concern; w: number } | undefined;
  for (const c of concernsOf(b.kinds[0]!)) {
    const w = Object.values(CONCERNS[c].inputs).flatMap((xs) => xs ?? []).filter((x) => x.ability === first.what).reduce((s, x) => s + x.weight, 0);
    if (w > 0 && (!best || w > best.w)) best = { c, w };
  }
  return best?.c;
}

/** The note beside a take's chief limit, where the genre asked for it: "Nordic Noir's Feeling Held In asks for it". */
export function concernNote(genre: string, c: Concern): string {
  return `${GENRE_BY_ID[genre]?.label ?? genre}’s ${CONCERNS[c].label} asks for it`;
}
