/**
 * The production system, held to the two things that make it a system.
 *
 * **It has to refuse.** A format the engine cannot carry, a channel the format
 * cannot open on, a shape past a lock, a commitment the company cannot pay for.
 * Every one of those is a door, and a door that never shuts is a doorway.
 *
 * **It has to be falsifiable.** Every link in the accumulator must move the
 * number when its input moves, in the direction it says it moves. That is checked
 * twice over: here, link by link, and in `tests/deciders.test.ts`, which sweeps
 * the whole chain end to end and fails if any declared direction is backwards.
 *
 * What is deliberately not tested is storage. There is no test that setting a
 * format stores the format, because a field being stored is not a behavior — it
 * is the thing this project has a tool for catching when nothing reads it.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  FORMATS, FORMAT_BY_ID, formatById, formatsFor, formatsOn, whyNotThisShape,
  MOST_PARTS_ANY_FORMAT,
} from '@/engine/content/format';
import {
  THE_RUN, WEEKS_OF_RUN, WINDOWS, SEASON, bendTheRun, whyNotThisChannel, AIRS_ONCE,
  EXHIBITOR_KEEPS, DISTRIBUTION_FEE,
} from '@/engine/content/release';
import {
  BANDS, DEPARTMENTS, axisStands, headsCostCents, departmentsOn, DEFAULT_BAND,
} from '@/engine/content/department';
import {
  reckon, layTheRun, theReceipt, THE_CHAIN, type Spec,
} from '@/engine/world/boxoffice';
import { isLocked, LOCKS, LOCK_SAID } from '@/engine/world/production';
import { ENGINE_BY_ID } from '@/engine/content/concept';

// ---------------------------------------------------------------------------
// A baseline to move one thing at a time against
// ---------------------------------------------------------------------------

const evenly = (band: string): Record<string, string> =>
  Object.fromEntries(DEPARTMENTS.map((d) => [d.id, band]));

const BASE: Spec = {
  format: FORMAT_BY_ID.feature!,
  parts: 1,
  secondsEach: 110 * 60,
  spentCents: 3_000_000_00,
  campaignCents: 250_000_00,
  staffing: evenly('working'),
  month: 3,
  field: 0,
};

const heightOf = (over: Partial<Spec> = {}) => reckon({ ...BASE, ...over }).cents;

// ---------------------------------------------------------------------------
// The formats
// ---------------------------------------------------------------------------

describe('the formats', () => {
  it('each differ from every other on something a reader reads', () => {
    // The rule from `docs/research/README.md`: an option earns its place when
    // something reads it. Two rows identical on every read field would be one row
    // with two names, which is the exact defect `tools/wired.mjs` exists for.
    const fingerprints = FORMATS.map((f) => JSON.stringify([
      f.medium, f.cadences, f.parts, f.secondsEach, f.channels, f.expectsCampaignCents, f.legs,
    ]));
    expect(new Set(fingerprints).size, 'two formats are the same row twice').toBe(FORMATS.length);
  });

  it('says what it is and how long it holds an audience', () => {
    for (const f of FORMATS) {
      expect(f.what.length, `${f.id} is not explained`).toBeGreaterThan(40);
      expect(f.parts.least).toBeGreaterThan(0);
      expect(f.parts.most).toBeGreaterThanOrEqual(f.parts.least);
      expect(f.secondsEach.most).toBeGreaterThanOrEqual(f.secondsEach.least);
      expect(f.channels.length, `${f.id} can be sold nowhere`).toBeGreaterThan(0);
      expect(f.legs).toBeGreaterThanOrEqual(0);
      expect(f.legs).toBeLessThanOrEqual(1);
    }
  });

  it('refuses a shape outside its range, and says what the range is', () => {
    const mini = FORMAT_BY_ID.miniseries!;
    const tooFew = whyNotThisShape(mini, 1, 50 * 60);
    expect(tooFew).toBeDefined();
    // A refusal that does not say where to go is a wall rather than a rule.
    expect(tooFew).toContain(`${mini.parts.least}`);
    expect(tooFew).toContain(`${mini.parts.most}`);
    expect(whyNotThisShape(mini, 5, 50 * 60)).toBeUndefined();
    expect(whyNotThisShape(mini, 5, 5 * 60)).toBeDefined();
  });

  it('keeps a micro-series out of cinemas, with the list of what is open', () => {
    const micro = FORMAT_BY_ID.micro!;
    const no = whyNotThisChannel(micro, 'theatrical');
    expect(no).toBeDefined();
    expect(no).toContain('streaming');
    expect(whyNotThisChannel(micro, 'streaming')).toBeUndefined();
  });

  it('can be looked up by cadence and by channel', () => {
    expect(formatsFor('single').map((f) => f.id)).toContain('feature');
    expect(formatsFor('returning').map((f) => f.id)).not.toContain('feature');
    expect(formatsOn('theatrical').map((f) => f.id)).toEqual(['feature']);
    expect(formatById('nope')).toBeUndefined();
    expect(MOST_PARTS_ANY_FORMAT).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// The departments
// ---------------------------------------------------------------------------

describe('the departments', () => {
  it('covers all three axes, because three is what the release reads', () => {
    for (const axis of ['craft', 'draw', 'thrift'] as const) {
      expect(departmentsOn(axis).length, `nothing moves ${axis}`).toBeGreaterThan(0);
    }
  });

  it('makes a cheap head an active drag and not merely a smaller benefit', () => {
    // The thing that makes the bottom band a real choice rather than an obvious
    // mistake in one direction: staffing at the bottom is worse than not choosing.
    const bottom = axisStands('craft', evenly('starting'));
    const engineDefault = axisStands('craft', {});
    expect(bottom).toBeLessThan(engineDefault);
    expect(engineDefault).toBe(axisStands('craft', evenly(DEFAULT_BAND)));
    expect(axisStands('craft', evenly('first'))).toBeGreaterThan(engineDefault);
  });

  it('weights the director above the rest of the craft, on purpose', () => {
    const director = DEPARTMENTS.find((d) => d.id === 'director')!;
    for (const other of departmentsOn('craft')) {
      if (other.id === 'director') continue;
      expect(director.weight).toBeGreaterThan(other.weight);
    }
  });

  it('charges per part, so a season of heads costs more than a film of them', () => {
    const one = headsCostCents(evenly('working'), 1);
    const eight = headsCostCents(evenly('working'), 8);
    expect(eight).toBe(one * 8);
    expect(headsCostCents(evenly('first'), 1)).toBeGreaterThan(one);
  });

  it('prices every band above the one below it', () => {
    for (let i = 1; i < BANDS.length; i += 1) {
      expect(BANDS[i]!.perPartCents).toBeGreaterThan(BANDS[i - 1]!.perPartCents);
      expect(BANDS[i]!.worth).toBeGreaterThan(BANDS[i - 1]!.worth);
    }
  });
});

// ---------------------------------------------------------------------------
// The accumulator
// ---------------------------------------------------------------------------

describe('the accumulator', () => {
  it('writes down every link it ran, and the receipt reconciles to the answer', () => {
    // The whole reason the take is a chain rather than a function. A model whose
    // output cannot be taken apart is indistinguishable from a roll with prose on
    // top, and the receipt is what makes the difference checkable.
    const r = reckon(BASE);
    expect(r.said.length).toBe(THE_CHAIN.length);
    for (let i = 1; i < r.said.length; i += 1) {
      // Each link is handed exactly what the one before it handed on. A gap here
      // would mean a link reading something other than the carried figure.
      expect(r.said[i]!.was).toBe(r.said[i - 1]!.became);
    }
    expect(Math.round(r.said[r.said.length - 1]!.became)).toBe(r.cents);
    expect(theReceipt(r).length).toBe(THE_CHAIN.length);
    for (const line of theReceipt(r)) expect(line.length).toBeGreaterThan(20);
  });

  it('moves with the spend, and less than proportionally', () => {
    const at1 = heightOf({ spentCents: 1_000_000_00 });
    const at4 = heightOf({ spentCents: 4_000_000_00 });
    expect(at4).toBeGreaterThan(at1);
    // Four times the money is emphatically not four times the take. That is what
    // stops the budget being a dial you turn up.
    expect(at4).toBeLessThan(at1 * 4);
  });

  it('lets the draw move the height and the craft barely move it', () => {
    // The asymmetry the whole model turns on. A famous cast fills an opening; a
    // well-made film does not, and earns its money over twenty weeks instead.
    const base = heightOf();
    const betterDraw = heightOf({ staffing: { ...evenly('working'), casting: 'first', music: 'first' } });
    const betterCraft = heightOf({
      staffing: { ...evenly('working'), director: 'first', writer: 'first', photography: 'first', cutting: 'first' },
    });
    expect(betterDraw).toBeGreaterThan(base);
    expect(betterCraft).toBeGreaterThan(base);
    expect(betterDraw - base).toBeGreaterThan(betterCraft - base);
  });

  it('turns craft into word of mouth, which the height does not carry', () => {
    const poor = reckon({ ...BASE, staffing: evenly('starting') });
    const fine = reckon({ ...BASE, staffing: evenly('first') });
    expect(poor.wordOfMouth).toBeLessThan(0);
    expect(fine.wordOfMouth).toBeGreaterThan(0);
  });

  it('punishes a campaign under the floor harder than it rewards one over it', () => {
    const floor = BASE.format.expectsCampaignCents;
    const none = heightOf({ campaignCents: 0 });
    const met = heightOf({ campaignCents: floor });
    const double = heightOf({ campaignCents: floor * 2 });
    expect(none).toBeLessThan(met);
    expect(double).toBeGreaterThan(met);
    // Spending nothing costs more than doubling gains, because a half-campaign
    // buys awareness without reach.
    expect(met - none).toBeGreaterThan(double - met);
  });

  it('empties an engine that was asked for more than it carries', () => {
    const transformation = ENGINE_BY_ID.transformation!;
    const within = heightOf({
      format: FORMAT_BY_ID.serial!, parts: 12, secondsEach: 50 * 60, engine: transformation,
    });
    const beyond = heightOf({
      format: FORMAT_BY_ID.serial!, parts: 12, secondsEach: 50 * 60,
      engine: { ...transformation, carries: 4 },
    });
    expect(beyond).toBeLessThan(within);
  });

  it('leaves a renewable engine alone, which is the point of the distinction', () => {
    const caseOfTheWeek = ENGINE_BY_ID.case!;
    expect(caseOfTheWeek.carries).toBeUndefined();
    const withEngine = heightOf({ engine: caseOfTheWeek, parts: 1 });
    const without = heightOf({ parts: 1 });
    expect(withEngine).toBe(without);
  });

  it('is hurt by a crowded week and helped by a good month', () => {
    expect(heightOf({ field: 1 })).toBeLessThan(heightOf({ field: 0 }));
    const best = SEASON.indexOf(Math.max(...SEASON));
    const worst = SEASON.indexOf(Math.min(...SEASON));
    expect(heightOf({ month: best })).toBeGreaterThan(heightOf({ month: worst }));
  });

  it('never goes negative, however badly everything goes', () => {
    const disaster = heightOf({
      spentCents: 1_00, campaignCents: 0, staffing: evenly('starting'), field: 1, month: 0,
    });
    expect(disaster).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Height and shape, which are separate
// ---------------------------------------------------------------------------

describe('the run', () => {
  it('bends later with good word of mouth and earlier with bad', () => {
    const tail = (mouth: number) => bendTheRun(mouth, 0.62).slice(4).reduce((s, w) => s + w, 0);
    expect(tail(1)).toBeGreaterThan(tail(0));
    expect(tail(0)).toBeGreaterThan(tail(-1));
  });

  it('always sums to one, whatever it is bent to', () => {
    for (const mouth of [-1, -0.5, 0, 0.5, 1]) {
      for (const legs of [0.1, 0.4, 0.78, 1]) {
        const sum = bendTheRun(mouth, legs).reduce((s, w) => s + w, 0);
        expect(sum).toBeCloseTo(1, 6);
      }
    }
  });

  it('never inverts the run, however loved the thing is', () => {
    // At the best possible word of mouth week one must still beat week five, or
    // the bend has stopped describing a release and started describing a fantasy.
    const curve = bendTheRun(1, 1);
    expect(curve[0]!).toBeGreaterThan(curve[4]!);
    expect(THE_RUN.length).toBe(WEEKS_OF_RUN);
  });

  it('puts everything in the first week for a thing that airs once', () => {
    expect(AIRS_ONCE[0]).toBe(1);
    expect(AIRS_ONCE.slice(1).every((w) => w === 0)).toBe(true);
    const tvMovie = FORMAT_BY_ID['tv-movie']!;
    expect(tvMovie.legs).toBe(0);
    const run = layTheRun(reckon({ ...BASE, format: tvMovie }), tvMovie, 'broadcast');
    expect(run.weeks.length).toBe(1);
  });

  it('separates what the audience paid from what the company banked', () => {
    // The single most misunderstood number in the business being modeled: about
    // half a theatrical gross never leaves the cinemas at all.
    const run = layTheRun(reckon(BASE), BASE.format, 'theatrical');
    expect(run.grossCents).toBeGreaterThan(run.rentalCents);
    const expected = Math.round(
      Math.round(run.grossCents * (1 - EXHIBITOR_KEEPS)) * (1 - DISTRIBUTION_FEE),
    );
    expect(run.rentalCents).toBe(expected);
  });

  it('does not put an exhibitor in front of a broadcaster', () => {
    const mini = FORMAT_BY_ID.miniseries!;
    const spec = { ...BASE, format: mini, parts: 5, secondsEach: 50 * 60 };
    const run = layTheRun(reckon(spec), mini, 'broadcast');
    expect(run.rentalCents).toBe(Math.round(run.grossCents * (1 - DISTRIBUTION_FEE)));
  });

  it('opens a different set of windows behind each channel', () => {
    const theatrical = layTheRun(reckon(BASE), BASE.format, 'theatrical');
    const mini = FORMAT_BY_ID.miniseries!;
    const broadcast = layTheRun(
      reckon({ ...BASE, format: mini, parts: 5, secondsEach: 50 * 60 }), mini, 'broadcast',
    );
    const ids = (r: typeof theatrical) => r.takes.map((t) => t.id).sort();
    expect(ids(theatrical)).not.toEqual(ids(broadcast));
    // A series has no home release and no foreign theatrical, and it does get
    // sold on again. That is the whole reason `Window.after` is a field.
    expect(ids(broadcast)).toContain('resold');
    expect(ids(theatrical)).not.toContain('resold');
    expect(theatrical.totalCents).toBeGreaterThan(theatrical.rentalCents);
  });

  it('gives every window a distinct account name and an opening date', () => {
    expect(new Set(WINDOWS.map((w) => w.id)).size).toBe(WINDOWS.length);
    for (const w of WINDOWS) {
      expect(w.share).toBeGreaterThan(0);
      expect(w.opensAfterWeeks).toBeGreaterThan(0);
      expect(w.weeks).toBeGreaterThan(0);
    }
  });

  it('lets a loved failure and an unloved hit both exist', () => {
    // The check that height and shape really are independent rather than two
    // names for quality. A model that cannot produce both of these is a model
    // where craft is just a multiplier.
    const unlovedHit = reckon({
      ...BASE, staffing: { ...evenly('starting'), casting: 'first', music: 'first' },
    });
    const lovedFailure = reckon({
      ...BASE, campaignCents: 0,
      staffing: { ...evenly('first'), casting: 'starting', music: 'starting' },
    });
    expect(unlovedHit.cents).toBeGreaterThan(lovedFailure.cents);
    expect(unlovedHit.wordOfMouth).toBeLessThan(lovedFailure.wordOfMouth);
  });
});

// ---------------------------------------------------------------------------
// The pipeline, on a real save
// ---------------------------------------------------------------------------

describe('the progressive lock', () => {
  it('registers every command the pipeline needs', () => {
    const sim = quickSave({}, 'production-commands');
    for (const kind of [
      'production.shape', 'production.staff', 'production.commit',
      'production.release', 'production.shelve',
    ]) {
      expect(sim.hasCommand(kind), `${kind} is not registered`).toBe(true);
    }
  });

  it('refuses a command on a project that is not there, through the envelope', () => {
    // A handler that answers `{ ok: false }` has refused, and the command
    // envelope has to say so rather than reporting a successful nothing.
    const sim = quickSave({}, 'production-missing');
    for (const [kind, payload] of [
      ['production.shape', { projectId: 'nope', formatId: 'feature', parts: 1, secondsEach: 110 * 60 }],
      ['production.staff', { projectId: 'nope', posts: { director: 'first' } }],
      ['production.commit', { projectId: 'nope' }],
      ['production.shelve', { projectId: 'nope' }],
    ] as const) {
      const done = sim.execute({ kind, payload: payload as Record<string, unknown> });
      expect(done.ok, `${kind} did not refuse a project that does not exist`).toBe(false);
    }
  });

  it('shuts the shape behind the first head engaged, and says why', () => {
    // The mechanic the whole file turns on, checked on the refusal rather than on
    // the field: past the lock the shape is not editable, and the reason is inside
    // the fiction — the heads were priced against this much work.
    const project = {
      id: 'p1', saveId: 's', companyId: 'c', title: 'A Thing', medium: 'film' as const,
      stage: 'idea' as const, startedAt: 0, spentCents: 0,
      formatId: 'feature', locked: ['shape'],
    };
    expect(isLocked(project as never, 'shape')).toBe(true);
    expect(isLocked(project as never, 'staffing')).toBe(false);
    expect(LOCKS.length).toBe(3);
    for (const lock of LOCKS) expect(LOCK_SAID[lock].length).toBeGreaterThan(20);
  });
});
