/**
 * SLATE — writing one piece.
 *
 * The assembler. It picks an outlet that covers the beat, chooses a headline,
 * a lede, the facts, the context and the close from frames that fit the story
 * it has been given, and hands back a piece of several paragraphs.
 *
 * The freshness guarantee is here rather than in the banks. A save keeps a
 * window of what has already been printed; the assembler draws again when it
 * lands on something inside that window, and gives up only after it has run
 * out of combinations to try, at which point it takes the best it has rather
 * than failing. That is the same shape as the premise engine, and it is
 * measured the same way: `tests/press.test.ts` writes thousands of pieces and
 * counts how many are genuinely distinct.
 */

import type { Rng } from '../core/rng';
import { OUTLETS, type Beat, type Outlet } from './press';
import {
  DESK_OF, usable, voiceOf,
  type Frame, type Story, type StoryFacts, type StoryKind, type Voice,
} from './press-story';
import { DEV_DETAILS, DEV_HEADLINES, DEV_LEDES } from './press-frames-development';
import { PROD_DETAILS, PROD_HEADLINES, PROD_LEDES } from './press-frames-production';
import { REL_DETAILS, REL_HEADLINES, REL_LEDES } from './press-frames-release';
import { BIZ_DETAILS, BIZ_HEADLINES, BIZ_LEDES } from './press-frames-business';
import { CLOSES, CONTEXTS, STANDFIRSTS } from './press-frames-context';
import { titleCaseLabel } from '../core/text';

// ---------------------------------------------------------------------------
// The banks, in one place
// ---------------------------------------------------------------------------

const HEADLINES: Partial<Record<StoryKind, Frame[]>> = {
  ...DEV_HEADLINES, ...PROD_HEADLINES, ...REL_HEADLINES, ...BIZ_HEADLINES,
};
const LEDES: Partial<Record<StoryKind, Frame[]>> = {
  ...DEV_LEDES, ...PROD_LEDES, ...REL_LEDES, ...BIZ_LEDES,
};
const DETAILS: Partial<Record<StoryKind, Frame[]>> = {
  ...DEV_DETAILS, ...PROD_DETAILS, ...REL_DETAILS, ...BIZ_DETAILS,
};

/**
 * What the whole thing is capable of, counted rather than claimed.
 *
 * This is the number of shapes a piece can take: every headline against every
 * lede against every detail against every context against every close, for
 * each story kind and each register. It is an upper bound on the frames alone
 * and does not count the phrase slots inside them, which multiply it further —
 * so the honest figure for how many distinct pieces come out is the one the
 * test measures, not this one.
 */
export function frameCombinations(): number {
  let total = 0;
  for (const kind of Object.keys(LEDES) as StoryKind[]) {
    const heads = HEADLINES[kind]?.length ?? 0;
    const ledes = LEDES[kind]?.length ?? 0;
    const details = DETAILS[kind]?.length ?? 0;
    const contexts = CONTEXTS[DESK_OF[kind]]?.length ?? 0;
    for (const closes of Object.values(CLOSES)) {
      total += heads * ledes * details * contexts * closes.length;
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// Which beat a story belongs to
// ---------------------------------------------------------------------------

const BEAT_OF: Readonly<Record<StoryKind, Beat>> = {
  setup: 'development', greenlight: 'development', attachment: 'development',
  casting: 'casting', shelved: 'development', rights: 'development',
  production_start: 'production', wrap: 'production', trouble: 'production',
  test_screening: 'production',
  trailer: 'development', date_change: 'development',
  festival_premiere: 'festivals', reviews: 'criticism', opening: 'boxoffice',
  hold: 'boxoffice', collapse: 'boxoffice', record: 'boxoffice',
  renewal: 'television', cancellation: 'television', ratings: 'television',
  nomination: 'awards', win: 'awards',
  deal: 'business', executive: 'business', library: 'business',
  labour: 'labour', earnings: 'business',
};

/**
 * Who covers this.
 *
 * Weighted by reach and by how fast they get to a story, so the same event
 * usually runs in a different place each time without the biggest names being
 * rare. An outlet that does not cover the beat never appears.
 */
export function outletFor(kind: StoryKind, rng: Rng, options: { countryId?: string; exclude?: string[] } = {}): Outlet | undefined {
  const beat = BEAT_OF[kind];
  const excluded = new Set(options.exclude ?? []);
  const pool = OUTLETS.all().filter((outlet) => outlet.beats.includes(beat) && !excluded.has(outlet.id));
  if (pool.length === 0) return undefined;

  const weights = pool.map((outlet) => {
    let weight = outlet.reach * 0.6 + outlet.speed * 0.4;
    // A story from a market gets covered hardest in that market.
    if (options.countryId && outlet.countryId === options.countryId) weight *= 2.2;
    else if (options.countryId && outlet.countryId !== 'us') weight *= 0.5;
    return Math.max(1, weight);
  });
  let roll = rng.float(0, weights.reduce((a, b) => a + b, 0));
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// ---------------------------------------------------------------------------
// Writing it
// ---------------------------------------------------------------------------

/** One frame from a bank, of the ones that fit. */
function draw(bank: readonly Frame[] | undefined, f: StoryFacts, v: Voice, rng: Rng): Frame | undefined {
  const fits = usable(bank ?? [], f, v);
  if (fits.length === 0) return undefined;
  return fits[rng.int(0, fits.length - 1)];
}

/** How many paragraphs an outlet runs, by how much it likes to write. */
function depthOf(v: Voice, rng: Rng): number {
  if (v.register === 'wire' || v.register === 'aggregate') return rng.chance(0.4) ? 2 : 3;
  if (v.register === 'scoop') return rng.chance(0.5) ? 3 : 4;
  if (v.register === 'essay') return 4;
  return rng.chance(0.35) ? 3 : 4;
}

export interface WriteOptions {
  /** Pieces already printed. A draw that lands inside this is tried again. */
  taken?: (text: string) => boolean;
  /** How many times to redraw before taking the best available. */
  attempts?: number;
}

/**
 * One story, written by one outlet.
 *
 * Returns nothing when the facts do not support a piece at all — a kind with
 * no usable lede is a story the generator has no honest way to write, and
 * making one up is exactly what it must not do.
 */
export function writeStory(
  outlet: Outlet,
  facts: StoryFacts,
  rng: Rng,
  options: WriteOptions = {},
): Story | undefined {
  const v = voiceOf(outlet);
  const kind = facts.kind;
  const taken = options.taken ?? (() => false);
  const attempts = options.attempts ?? 14;

  let best: Story | undefined;
  for (let attempt = 0; attempt <= attempts; attempt++) {
    const headline = draw(HEADLINES[kind], facts, v, rng);
    const lede = draw(LEDES[kind], facts, v, rng);
    if (!headline || !lede) return undefined;

    const detail = draw(DETAILS[kind], facts, v, rng);
    const context = draw(CONTEXTS[DESK_OF[kind]], facts, v, rng);
    const close = draw(CLOSES[v.register], facts, v, rng);

    const paragraphs = [tidy(lede.write(facts, v, rng))];
    const depth = depthOf(v, rng);
    // A paragraph that repeats a phrase already in the piece is dropped rather
    // than printed. Two frames can legitimately reach for the same fact — the
    // logline, a budget, a score — and a page that states it twice in four
    // paragraphs is the single thing that makes generated writing look
    // generated.
    const add = (frame: Frame | undefined) => {
      if (!frame || paragraphs.length >= depth) return;
      const text = tidy(frame.write(facts, v, rng));
      if (!text.trim()) return;
      if (paragraphs.some((existing) => overlaps(existing, text))) return;
      // A line of four words is the tail of a paragraph, not a paragraph. Real
      // writing ends 'Fingers crossed.' on the same line as what came before
      // it, and a one-clause block on its own reads like a stub.
      if (text.length < 34 && paragraphs.length > 0) {
        paragraphs[paragraphs.length - 1] = `${paragraphs[paragraphs.length - 1]} ${text}`;
        return;
      }
      paragraphs.push(text);
    };
    add(detail);
    add(context);
    add(close);

    // Written once and checked once: calling write twice would draw different
    // phrases each time and check something the reader never sees.
    const standFrame = draw(STANDFIRSTS[DESK_OF[kind]], facts, v, rng);
    const standText = standFrame ? tidy(standFrame.write(facts, v, rng)) : '';
    const standfirst = standText && !paragraphs.some((paragraph) => overlaps(paragraph, standText))
      ? standText
      : fallbackStandfirst(facts, v);
    const story: Story = {
      outletId: outlet.id,
      outletName: outlet.name,
      kind,
      desk: DESK_OF[kind],
      headline: tidy(headlineCase(headline.write(facts, v, rng), facts)),
      standfirst,
      paragraphs,
      register: outlet.register,
    };

    best ??= story;
    if (!taken(story.headline) && !taken(story.paragraphs[0] ?? '')) return story;
  }
  return best;
}

/**
 * The small repairs no template can make for itself.
 *
 * A company is called Warner Bros. and a sentence ends in a full stop, so a
 * sentence about that company ends in two. Nothing in a frame can know that,
 * because the frame does not know what name will be dropped into it — so it is
 * fixed once, here, at the end.
 */
function tidy(text: string): string {
  return text
    // 'Warner Bros..' — a name that ends in a stop, then the sentence's own.
    // 'Warner Bros., where' is left alone: that one is correct English.
    .replace(/([^.])\.\.(?!\.)/g, '$1.')
    // A slot that came back empty leaves a doubled space behind it.
    .replace(/ {2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}

/**
 * A headline in Title Case, with every name left exactly as it is spelled.
 *
 * Every label in SLATE is Title Case, and a headline is a label — but a
 * headline is also full of names, and a name is spelled the way the thing is
 * spelled. 'Man of Tomorrow' does not become 'Man Of Tomorrow' because it
 * appeared in a headline, and 'de Havilland' does not become 'De Havilland'.
 *
 * So the whole line is title-cased for the sake of the frame's own words —
 * genres and formats arrive lowercase from the registries — and then every
 * name the story carries is put back the way it came.
 */
function headlineCase(text: string, f: StoryFacts): string {
  let out = titleCaseLabel(text);
  const names: (string | undefined)[] = [
    f.title, f.person, f.director, f.writer, f.executive, f.successor,
    f.studio, f.network, f.distributor, f.festival, f.award, f.category,
    f.city, f.priorWork, ...(f.cast ?? []),
  ];
  for (const name of names) {
    if (!name || name.length < 2) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(escaped, 'gi'), name);
  }
  return out;
}

/**
 * Whether two paragraphs say the same thing.
 *
 * Cheap and deliberately blunt: any run of forty characters in common is a
 * repeated clause, and a repeated clause is a repeated paragraph as far as a
 * reader is concerned.
 */
function overlaps(a: string, b: string): boolean {
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  const window = 40;
  if (shorter.length < window) return longer.includes(shorter);
  for (let i = 0; i + window <= shorter.length; i += 8) {
    if (longer.includes(shorter.slice(i, i + window))) return true;
  }
  return false;
}

/**
 * The line under the headline, when the story carries too little for any of
 * the written ones. Deliberately plain: a standfirst that tries to be clever
 * with nothing to be clever about is worse than one that just states the case.
 */
function fallbackStandfirst(f: StoryFacts, v: Voice): string {
  const bits: string[] = [];
  if (f.title) bits.push(f.title);
  if (f.studio ?? f.network) bits.push(`at ${f.studio ?? f.network}`);
  if (f.dateLabel) bits.push(`for ${f.dateLabel}`);
  if (bits.length === 0) return `Reported for ${v.name}.`;
  return `${bits.join(' ')}.`;
}

/**
 * The whole coverage of one event: who ran it, and what each of them said.
 *
 * A big story runs in several places and reads differently in each, which is
 * the point of having registers at all. `count` is how many outlets pick it up.
 */
export function coverEvent(
  facts: StoryFacts,
  rng: Rng,
  options: WriteOptions & { count?: number; countryId?: string } = {},
): Story[] {
  const wanted = options.count ?? 1;
  const stories: Story[] = [];
  const used: string[] = [];
  for (let i = 0; i < wanted; i++) {
    const outlet = outletFor(facts.kind, rng, { countryId: options.countryId, exclude: used });
    if (!outlet) break;
    used.push(outlet.id);
    const story = writeStory(outlet, facts, rng, options);
    if (story) stories.push(story);
  }
  return stories;
}
