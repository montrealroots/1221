/**
 * SLATE — what you meant.
 *
 * A scene shows choices. You can press one, or type. Typing resolves to one
 * of the choices on screen, to a thing the runtime itself does (leave, skip),
 * to a short list when two choices are close, or to nothing supported — and
 * says so. It never resolves to success on its own: a sentence is not an
 * order the engine takes. There is no model behind this and no network; it is
 * a matcher over the words that are actually on the screen.
 */

export interface IntentChoice {
  id: string;
  label: string;
  aliases?: readonly string[];
  /** A choice that is shown but cannot be taken right now, with the reason. */
  disabled?: string;
}

export type RuntimeAction = 'leave' | 'skip' | 'help';

export type Intent =
  | { kind: 'choice'; choiceId: string; how: 'exact' | 'alias' | 'ordinal' | 'fuzzy' }
  | { kind: 'runtime'; action: RuntimeAction }
  | { kind: 'ambiguous'; candidates: string[] }
  | { kind: 'unsupported' };

/** Words that carry no meaning for matching. */
const STOP = new Set([
  'i', 'me', 'my', 'a', 'an', 'the', 'to', 'and', 'of', 'it', 'in', 'on', 'for', 'with',
  'want', 'would', 'like', 'please', 'lets', 'let', 'us', 'go', 'do', 'can', 'could',
  'just', 'some', 'that', 'this', 'then', 'now', 'ok', 'okay', 'yes', 'yeah', 'sure',
  'will', 'shall', 'im', 'ill', 'am', 'is', 'be', 'get', 'have', 'take', 'at',
  // When, and how much: "sleep for eight hours" is "sleep".
  'today', 'tonight', 'tomorrow', 'later', 'soon', 'morning', 'afternoon', 'evening', 'night', 'after', 'before',
  'hour', 'hours', 'minute', 'minutes', 'eight', 'nine', 'ten', 'twelve', 'few', 'couple',
]);

/** Things the runtime does regardless of the scene. Exact phrases only. */
const RUNTIME: Record<string, RuntimeAction> = {
  'leave': 'leave', 'leave scene': 'leave', 'quit': 'leave', 'exit': 'leave', 'stop': 'leave',
  'walk away': 'leave', 'walk out': 'leave', 'forget it': 'leave', 'never mind': 'leave', 'nevermind': 'leave',
  'skip': 'skip', 'skip it': 'skip', 'skip to the end': 'skip', 'summarise': 'skip', 'summarize': 'skip',
  'just do it': 'skip', 'get it over with': 'skip', 'fast forward': 'skip',
  'help': 'help', 'options': 'help', 'what can i do': 'help', 'what are my options': 'help', '?': 'help',
};

const ORDINALS: Record<string, number> = {
  'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5, 'sixth': 6,
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6,
  '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6,
};

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(text: string): string[] {
  return normalise(text)
    .split(' ')
    .map((t) => t.replace(/^-+|-+$/g, ''))
    .filter((t) => t.length > 0 && !STOP.has(t));
}

function phrasesOf(choice: IntentChoice): string[] {
  return [choice.id.replace(/[_.]/g, ' '), choice.label, ...(choice.aliases ?? [])].map(normalise);
}

/** The words of the choice's phrases that sit whole inside what was typed. */
function containedWords(clean: string, choice: IntentChoice): Set<string> {
  const padded = ` ${clean} `;
  const found = new Set<string>();
  for (const phrase of phrasesOf(choice)) {
    const words = tokens(phrase);
    // One word is a word, and the plain matching already counts it. Two or
    // more said together ("work out", "go to the gym") are what somebody
    // meant, however much else they said around them.
    if (words.length > 0 && phrase.split(' ').length >= 2 && padded.includes(` ${phrase} `)) for (const word of words) found.add(word);
  }
  return found;
}

/** How well the typed words cover a choice's words, 0-1. */
function overlap(clean: string, typed: string[], choice: IntentChoice): number {
  const own = new Set(phrasesOf(choice).flatMap(tokens));
  if (own.size === 0 || typed.length === 0) return 0;
  const hits = typed.filter((t) => own.has(t)).length;
  // Cover the choice's words, and do not drown them in unrelated ones.
  const coverage = hits / own.size;
  const precision = hits / typed.length;
  const score = coverage * 0.7 + precision * 0.3;
  // "keep it" against "Keep It Short" and "Keep It At An Hour": every typed
  // word is in the choice, so it is a candidate even though it covers little
  // of the label. Two such candidates are then offered back, not refused.
  const base = precision === 1 && hits > 0 ? Math.max(score, 0.6) : score;
  // "work out at the gym", "sleep for eight hours": a phrase the game knows,
  // said in a longer sentence. The extra words are how people talk, not a
  // reason to refuse. A whole phrase inside the sentence counts, and the
  // choice whose phrases account for more of the sentence wins: "work out"
  // beats "work" on its own. A phrase that accounts for less than half of
  // the sentence is a word in passing: "travel back in time" is not a trip.
  if (hits > 0) {
    const within = containedWords(clean, choice);
    const accounted = typed.filter((t) => within.has(t)).length / typed.length;
    if (within.size > 0 && accounted >= 0.5) return Math.max(base, 0.6 + 0.4 * accounted);
  }
  return base;
}

/** Every open choice scored against the text, best first. For tests and the console. */
export function rankIntent(text: string, choices: readonly IntentChoice[]): { id: string; score: number }[] {
  const clean = normalise(text);
  const typed = tokens(clean);
  return choices
    .filter((c) => !c.disabled)
    .map((choice) => ({ id: choice.id, score: Number(overlap(clean, typed, choice).toFixed(3)) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Resolves typed text against the choices on screen.
 *
 * Exact match on a label, id or alias wins. A bare number or ordinal picks by
 * position. A runtime phrase — leave, skip, help — is honored when typed on
 * its own. Otherwise the words are compared: a clear best is taken, two close
 * ones are offered back, and anything below the bar is unsupported.
 */
export function resolveIntent(text: string, choices: readonly IntentChoice[]): Intent {
  const clean = normalise(text);
  if (!clean) return { kind: 'unsupported' };
  const open = choices.filter((c) => !c.disabled);

  for (const choice of open) {
    const phrases = phrasesOf(choice);
    if (phrases[0] === clean || phrases[1] === clean) return { kind: 'choice', choiceId: choice.id, how: 'exact' };
    if (phrases.slice(2).includes(clean)) return { kind: 'choice', choiceId: choice.id, how: 'alias' };
  }

  const runtime = RUNTIME[clean];
  if (runtime) return { kind: 'runtime', action: runtime };

  const ordinal = /^\d+$/.test(clean) ? Number(clean) : ORDINALS[clean];
  if (ordinal !== undefined) {
    const choice = open[ordinal - 1];
    return choice ? { kind: 'choice', choiceId: choice.id, how: 'ordinal' } : { kind: 'unsupported' };
  }

  const typed = tokens(clean);
  if (typed.length === 0) return { kind: 'unsupported' };
  const scored = open
    .map((choice) => ({ choice, score: overlap(clean, typed, choice) }))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  const second = scored[1];
  if (!best || best.score < 0.5) return { kind: 'unsupported' };
  if (second && second.score >= best.score - 0.15 && second.score >= 0.4) {
    const close = scored.filter((s) => s.score >= best.score - 0.15).slice(0, 3);
    return { kind: 'ambiguous', candidates: close.map((s) => s.choice.id) };
  }
  return { kind: 'choice', choiceId: best.choice.id, how: 'fuzzy' };
}
