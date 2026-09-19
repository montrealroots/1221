/**
 * The production system, held to the three things that make it a system.
 *
 * **It refuses.** A format the engine cannot carry, a channel the format cannot open
 * on, a shape past a lock, a share of the back end past the ceiling, a greenlight the
 * company cannot pay for. A door that never shuts is a doorway.
 *
 * **It is falsifiable.** Every link in the accumulator moves the figure when its
 * input moves, in the direction it claims. Checked twice: here link by link, and in
 * `tests/deciders.test.ts`, which sweeps the whole chain and fails on a backwards
 * direction. That sweep has already earned its place once on this system.
 *
 * **It happens over time.** The windows carry an opening week, and the test that
 * matters most in this file is the one proving a release does not pay everything at
 * once — because the first pass had exactly that defect and it looked fine.
 *
 * What is deliberately not tested is storage. There is no test that setting a format
 * stores the format: a field being written is not a behavior, it is the thing the
 * gate has a tool for catching when nothing reads it.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  FORMATS, FORMAT_BY_ID, formatsFor, formatsOn, whyNotThisChannel, whyNotThisShape,
} from '@/engine/content/format';
import {
  AIRS_ONCE, LAST_WEEK_ANYTHING_PAYS, SEASON, THE_RUN, WEEKS_OF_RUN, WINDOWS,
  bendTheRun, runFor, windowsAfter,
} from '@/engine/content/release';
import { POSTS, UNFILLED_REACH, axisStands, postsOn } from '@/engine/content/craft';
import {
  A_RUN_IS, MOST_POINTS, POINTS_COST_OF_THE_FEE, STANDINGS, offersFrom, pointsOutOf,
  standingAfter, upFrontCents,
} from '@/engine/content/talent';
import { inherits, pastItsBest } from '@/engine/content/lineage';
import { A_WEEK_HOLDS, STUDIOS, studiosOn } from '@/engine/content/rivals';
import { THE_CHAIN, reckon, theReceipt, type Spec } from '@/engine/world/boxoffice';
import { openingWeek, windowsInWeek, type Opening } from '@/engine/world/run';
import { crowding, theWeeksAhead, weekIndex } from '@/engine/world/field';
import { ENGINE_BY_ID } from '@/engine/content/concept';
import {
  ATTENTION, DIALS, GENRES, GENRE_BY_ID, MOST, UNWRITTEN, leftToSpend, servesIts,
  spent, whatItReads, whyNotWrite,
} from '@/engine/content/story';
import {
  SOURCES, SOURCE_BY_ID, carriedInto, floorAfter, whyNotFrom,
} from '@/engine/content/source';
import {
  AWARDS, AWARD_BY_ID, CEREMONY_MONTH, CONSIDERS_MONTHS, ROOM_WEIGHS,
  THE_ROOM_IS_A_ROOM, standsWithTheRoom,
} from '@/engine/content/awards';
import { nextCeremony } from '@/engine/world/awards';

// ---------------------------------------------------------------------------

const evenly = (reach: number): Record<string, number> =>
  Object.fromEntries(POSTS.map((p) => [p.id, reach]));

const BASE: Spec = {
  format: FORMAT_BY_ID.feature!,
  parts: 1,
  secondsEach: 110 * 60,
  spentCents: 3_000_000_00,
  campaignCents: 250_000_00,
  reach: evenly(1),
  month: 3,
  crowding: 0,
};

const heightOf = (over: Partial<Spec> = {}) => reckon({ ...BASE, ...over }).cents;

// ---------------------------------------------------------------------------

describe('the formats', () => {
  it('each differ from every other on something a reader reads', () => {
    const prints = FORMATS.map((f) => JSON.stringify([
      f.medium, f.cadences, f.parts, f.secondsEach, f.channels,
      f.expectsCampaignCents, f.legs, f.carriesForward,
    ]));
    expect(new Set(prints).size, 'two formats are one row twice').toBe(FORMATS.length);
  });

  it('refuses a shape outside its range and says what the range is', () => {
    const mini = FORMAT_BY_ID.miniseries!;
    const no = whyNotThisShape(mini, 1, 50 * 60);
    expect(no).toBeDefined();
    expect(no).toContain(`${mini.parts.least}`);
    expect(whyNotThisShape(mini, 5, 50 * 60)).toBeUndefined();
    expect(whyNotThisShape(mini, 5, 5 * 60)).toBeDefined();
  });

  it('keeps a micro-series out of cinemas, with the list of what is open', () => {
    const no = whyNotThisChannel(FORMAT_BY_ID.micro!, 'theatrical');
    expect(no).toBeDefined();
    expect(no).toContain('Service');
    expect(whyNotThisChannel(FORMAT_BY_ID.micro!, 'streaming')).toBeUndefined();
    expect(formatsOn('theatrical').map((f) => f.id)).toEqual(['feature']);
    expect(formatsFor('returning').map((f) => f.id)).not.toContain('feature');
  });

  it('lets a feature found a franchise and a television film not', () => {
    // The field that decides whether a format can be built on. A boolean would
    // have had five readers; this has one and it is the lineage term.
    expect(FORMAT_BY_ID.feature!.carriesForward).toBeGreaterThan(0.4);
    expect(FORMAT_BY_ID['tv-movie']!.carriesForward).toBeLessThan(0.1);
  });
});

describe('the posts', () => {
  it('covers all three axes and treats an empty post as ordinary', () => {
    for (const axis of ['craft', 'draw', 'thrift'] as const) {
      expect(postsOn(axis).length, `nothing moves ${axis}`).toBeGreaterThan(0);
    }
    // Not zero and not a penalty. Leaving a post alone should get an ordinary
    // picture, so filling one is a decision to do better or cheaper.
    expect(axisStands('craft', () => undefined)).toBe(UNFILLED_REACH);
  });

  it('weights the director above the rest of the craft, on purpose', () => {
    const director = POSTS.find((p) => p.id === 'director')!;
    for (const other of postsOn('craft')) {
      if (other.id !== 'director') expect(director.weight).toBeGreaterThan(other.weight);
    }
  });

  it('only lets people an audience has heard of be offered points', () => {
    const above = POSTS.filter((p) => p.aboveTheLine).map((p) => p.id);
    expect(above).toContain('director');
    expect(above).toContain('lead');
    expect(above).not.toContain('line');
  });
});

describe('the deal', () => {
  it('makes points cost most of the fee, so saying yes really relieves the budget', () => {
    const first = STANDINGS[3]!;
    const both = offersFrom(first, 1);
    expect(both.points.feeCents).toBeLessThan(both.fee.feeCents);
    expect(both.points.feeCents / both.fee.feeCents).toBeCloseTo(1 - POINTS_COST_OF_THE_FEE, 5);
    expect(both.fee.points).toBe(0);
    expect(both.points.points).toBe(first.wantsPoints);
  });

  it('asks more points the further up the rungs you go, and faster than the fee', () => {
    for (let i = 1; i < STANDINGS.length; i += 1) {
      expect(STANDINGS[i]!.wantsPoints).toBeGreaterThan(STANDINGS[i - 1]!.wantsPoints);
      expect(STANDINGS[i]!.asksPerPartCents).toBeGreaterThan(STANDINGS[i - 1]!.asksPerPartCents);
      expect(STANDINGS[i]!.reach).toBeGreaterThan(STANDINGS[i - 1]!.reach);
    }
    // The asymmetry that makes the trade a real decision rather than arithmetic.
    const climbPoints = STANDINGS[3]!.wantsPoints / STANDINGS[0]!.wantsPoints;
    const climbFee = STANDINGS[3]!.asksPerPartCents / STANDINGS[0]!.asksPerPartCents;
    expect(climbPoints).toBeGreaterThan(climbFee / 2);
  });

  it('costs nothing up front and takes a share of everything that arrives', () => {
    const deal = offersFrom(STANDINGS[2]!, 4).points;
    const fee = offersFrom(STANDINGS[2]!, 4).fee;
    expect(upFrontCents([deal])).toBeLessThan(upFrontCents([fee]));
    // And the share comes out of each receipt, which is what makes a hit expensive
    // long after the shoot is over.
    expect(pointsOutOf([deal], 1_000_000_00)).toBe(Math.round(1_000_000_00 * deal.points / 100));
    expect(pointsOutOf([fee], 1_000_000_00)).toBe(0);
  });

  it('will not let more of a picture be given away than exists', () => {
    const greedy = Array.from({ length: 12 }, () => offersFrom(STANDINGS[3]!, 1).points);
    const taken = pointsOutOf(greedy, 1_000_000_00);
    expect(taken).toBeLessThanOrEqual(Math.round(1_000_000_00 * MOST_POINTS / 100));
  });

  it('moves a standing on three in a row and on nothing less', () => {
    expect(standingAfter('working', [true, true, true])).toBe('sought');
    expect(standingAfter('working', [false, false, false])).toBe('starting');
    // The business forgives one of anything.
    expect(standingAfter('working', [true, true, false])).toBe('working');
    expect(standingAfter('working', [false, false, true])).toBe('working');
    expect(standingAfter('working', [true, true])).toBe('working');
    // And the ends of the ladder hold.
    expect(standingAfter('first', Array(A_RUN_IS).fill(true))).toBe('first');
    expect(standingAfter('starting', Array(A_RUN_IS).fill(false))).toBe('starting');
  });
});

describe('a line of them', () => {
  const line = (over: Partial<Parameters<typeof inherits>[0]> = {}) => inherits({
    ordinal: 2, lastReturned: 1.4, gapYears: 2.5, carriesForward: 0.55, ...over,
  });

  it('leaves the first of a name alone', () => {
    expect(line({ ordinal: 1 })).toBe(1);
  });

  it('pays a second one for what the first did', () => {
    expect(line({ lastReturned: 2 })).toBeGreaterThan(line({ lastReturned: 0.5 }));
    expect(line()).toBeGreaterThan(1);
  });

  it('tires, so that a fifth is worth less than a second', () => {
    expect(line({ ordinal: 2 })).toBeGreaterThan(line({ ordinal: 3 }));
    expect(line({ ordinal: 3 })).toBeGreaterThan(line({ ordinal: 5 }));
  });

  it('eventually turns against the line, which is the whole warning', () => {
    // A franchise run past its welcome is worse than a new title, because the
    // audience arrives already tired. If this never crossed one there would be no
    // reason ever to stop.
    expect(pastItsBest({ ordinal: 2, lastReturned: 1.4, gapYears: 2.5, carriesForward: 0.55 })).toBe(false);
    expect(pastItsBest({ ordinal: 8, lastReturned: 1.4, gapYears: 2.5, carriesForward: 0.55 })).toBe(true);
  });

  it('punishes both a hurried follow-up and a late one', () => {
    const best = line({ gapYears: 2.5 });
    expect(line({ gapYears: 0.2 })).toBeLessThan(best);
    expect(line({ gapYears: 9 })).toBeLessThan(best);
  });

  it('carries further for a format anybody remembers the name of', () => {
    expect(line({ carriesForward: 0.62 })).toBeGreaterThan(line({ carriesForward: 0.08 }));
  });
});

describe('the accumulator', () => {
  it('writes down every link, and the receipt reconciles to the answer', () => {
    const r = reckon(BASE);
    expect(r.said.length).toBe(THE_CHAIN.length);
    for (let i = 1; i < r.said.length; i += 1) {
      expect(r.said[i]!.was).toBe(r.said[i - 1]!.became);
    }
    expect(Math.round(r.said[r.said.length - 1]!.became)).toBe(r.cents);
    expect(theReceipt(r).length).toBe(THE_CHAIN.length);
  });

  it('moves with the spend, and less than proportionally', () => {
    const at1 = heightOf({ spentCents: 1_000_000_00 });
    const at4 = heightOf({ spentCents: 4_000_000_00 });
    expect(at4).toBeGreaterThan(at1);
    expect(at4).toBeLessThan(at1 * 4);
  });

  it('lets the draw move the height and the craft barely move it', () => {
    // The asymmetry the model turns on. A famous cast fills an opening; a fine
    // picture earns its money over twenty weeks instead.
    const base = heightOf();
    const draw = heightOf({ reach: { ...evenly(1), lead: 1.55, music: 1.55 } });
    const craft = heightOf({
      reach: { ...evenly(1), director: 1.55, writer: 1.55, photography: 1.55, cutting: 1.55 },
    });
    expect(draw - base).toBeGreaterThan(craft - base);
  });

  it('turns craft into word of mouth, which the draw does not touch', () => {
    expect(reckon({ ...BASE, reach: evenly(0.72) }).wordOfMouth).toBeLessThan(0);
    expect(reckon({ ...BASE, reach: evenly(1.55) }).wordOfMouth).toBeGreaterThan(0);
    const drawOnly = reckon({ ...BASE, reach: { ...evenly(1), lead: 1.55, music: 1.55 } });
    expect(drawOnly.wordOfMouth).toBeCloseTo(0, 6);
  });

  it('punishes a campaign under the floor harder than it rewards one over it', () => {
    const floor = BASE.format.expectsCampaignCents;
    const none = heightOf({ campaignCents: 0 });
    const met = heightOf({ campaignCents: floor });
    const twice = heightOf({ campaignCents: floor * 2 });
    expect(none).toBeLessThan(met);
    expect(twice).toBeGreaterThan(met);
    expect(met - none).toBeGreaterThan(twice - met);
  });

  it('empties an engine asked for more than it carries, and leaves a renewable one', () => {
    const t = ENGINE_BY_ID.transformation!;
    const within = heightOf({ format: FORMAT_BY_ID.serial!, parts: 12, secondsEach: 50 * 60, engine: t });
    const beyond = heightOf({
      format: FORMAT_BY_ID.serial!, parts: 12, secondsEach: 50 * 60, engine: { ...t, carries: 4 },
    });
    expect(beyond).toBeLessThan(within);
    expect(ENGINE_BY_ID.case!.carries).toBeUndefined();
    expect(heightOf({ engine: ENGINE_BY_ID.case! })).toBe(heightOf());
  });

  it('is hurt by a crowded week and helped by a good month', () => {
    expect(heightOf({ crowding: 1 })).toBeLessThan(heightOf({ crowding: 0 }));
    const best = SEASON.indexOf(Math.max(...SEASON));
    const worst = SEASON.indexOf(Math.min(...SEASON));
    expect(heightOf({ month: best })).toBeGreaterThan(heightOf({ month: worst }));
  });

  it('never goes negative, however badly everything goes', () => {
    expect(heightOf({
      spentCents: 1_00, campaignCents: 0, reach: evenly(0.72), crowding: 1, month: 0,
    })).toBeGreaterThanOrEqual(0);
  });
});

describe('the run', () => {
  it('bends later with good word of mouth and with longer legs', () => {
    const tail = (mouth: number, legs: number) =>
      bendTheRun(mouth, legs).slice(4).reduce((s, w) => s + w, 0);
    expect(tail(1, 0.62)).toBeGreaterThan(tail(0, 0.62));
    expect(tail(0, 0.62)).toBeGreaterThan(tail(-1, 0.62));
    // And legs on their own, at neutral word of mouth. This is the one that was
    // wrong: the first version scaled only the bend, so a serial and an anthology
    // produced identical curves and bad reviews made the longer-legged format the
    // more front-loaded of the two.
    expect(tail(0, 0.78)).toBeGreaterThan(tail(0, 0.40));
  });

  it('always sums to one and never inverts, however loved the thing is', () => {
    for (const mouth of [-1, -0.5, 0, 0.5, 1]) {
      for (const legs of [0.1, 0.4, 0.78, 1]) {
        expect(bendTheRun(mouth, legs).reduce((s, w) => s + w, 0)).toBeCloseTo(1, 6);
      }
    }
    expect(bendTheRun(1, 1)[0]!).toBeGreaterThan(bendTheRun(1, 1)[4]!);
    expect(THE_RUN.length).toBe(WEEKS_OF_RUN);
  });

  it('puts everything in week one for a thing that airs once', () => {
    expect(AIRS_ONCE[0]).toBe(1);
    expect(AIRS_ONCE.slice(1).every((w) => w === 0)).toBe(true);
    const tv = FORMAT_BY_ID['tv-movie']!;
    expect(tv.legs).toBe(0);
    expect(runFor(tv, 0.8)).toEqual(AIRS_ONCE);
  });

  it('does not pay everything at once, which is what the last pass got wrong', () => {
    // The most important test in this file. The windows carry an opening week and
    // the first pass honored none of them: everything landed on the opening day.
    const opening: Opening = {
      at: 0, channel: 'theatrical', campaignCents: 0,
      reckonedCents: 100_000_000_00, wordOfMouth: 0.2, weeksPaid: 0,
    };
    expect(openingWeek(opening, 'feature', 1)).toBeGreaterThan(0);
    expect(openingWeek(opening, 'feature', WEEKS_OF_RUN + 1)).toBe(0);
    // Nothing from the windows in week one, and the foreign sale by week eight.
    expect(windowsInWeek(opening, 1)).toHaveLength(0);
    expect(windowsInWeek(opening, 8).map((w) => w.id)).toContain('abroad');
    // And the broadcaster is still a year out.
    expect(windowsInWeek(opening, 8).map((w) => w.id)).not.toContain('aired');
    expect(windowsInWeek(opening, 54).map((w) => w.id)).toContain('aired');
  });

  it('pays each window its whole share across its weeks and no more', () => {
    const opening: Opening = {
      at: 0, channel: 'theatrical', campaignCents: 0,
      reckonedCents: 100_000_000_00, wordOfMouth: 0, weeksPaid: 0,
    };
    for (const window of windowsAfter('theatrical')) {
      let paid = 0;
      for (let week = 1; week <= LAST_WEEK_ANYTHING_PAYS; week += 1) {
        paid += windowsInWeek(opening, week).find((w) => w.id === window.id)?.cents ?? 0;
      }
      const whole = Math.round(
        Math.round(Math.round(opening.reckonedCents * 0.52) * 0.78) * window.share,
      );
      // Within rounding of one cent per week of the window.
      expect(Math.abs(paid - whole)).toBeLessThanOrEqual(window.overWeeks);
    }
  });

  it('opens a different set of windows behind each channel', () => {
    expect(windowsAfter('theatrical').map((w) => w.id)).toContain('home');
    expect(windowsAfter('broadcast').map((w) => w.id)).toEqual(['resold']);
    expect(windowsAfter('streaming').map((w) => w.id)).toEqual(['renewed']);
    expect(new Set(WINDOWS.map((w) => w.id)).size).toBe(WINDOWS.length);
  });
});

describe('the field', () => {
  it('is the same every time it is asked, so a date can be read ahead', () => {
    // Deliberate. A schedule nobody could look at would make choosing a date a coin
    // toss rather than a judgement about a good month crowded against a poor one
    // empty.
    const sim = quickSave({}, 'field-stable');
    const at = sim.now + 20 * 7 * 24 * 60 * 60 * 1000;
    expect(crowding(sim, at, 'theatrical')).toBe(crowding(sim, at, 'theatrical'));
  });

  it('varies across the weeks ahead rather than sitting at one number', () => {
    const sim = quickSave({}, 'field-varies');
    const ahead = theWeeksAhead(sim, sim.now, 'theatrical', 52);
    const seen = new Set(ahead.map((w) => w.crowding.toFixed(3)));
    expect(seen.size, 'every week is equally crowded, so the date decides nothing')
      .toBeGreaterThan(4);
    for (const week of ahead) {
      expect(week.crowding).toBeGreaterThanOrEqual(0);
      expect(week.crowding).toBeLessThanOrEqual(1);
    }
  });

  it('only lets a studio crowd a channel it actually works in', () => {
    expect(studiosOn('theatrical').map((s) => s.id)).not.toContain('halvard');
    expect(studiosOn('broadcast').map((s) => s.id)).toContain('halvard');
    expect(STUDIOS.every((s) => s.channels.length > 0)).toBe(true);
    expect(A_WEEK_HOLDS).toBeGreaterThan(1);
  });

  it('counts weeks the same way for any instant inside one', () => {
    // Buckets are aligned to the epoch rather than to a weekday, so a week here
    // runs Thursday to Thursday — the first of January 1970 was one. That is fine
    // for what this does, which is put two releases in the same bucket or not, and
    // the test says so rather than assuming Mondays as the first draft did.
    const day = 24 * 60 * 60 * 1000;
    const start = weekIndex(Date.UTC(1998, 0, 5)) * 7 * day;
    expect(weekIndex(start)).toBe(weekIndex(start + 6 * day));
    expect(weekIndex(start)).not.toBe(weekIndex(start + 8 * day));
  });
});

describe('the pipeline', () => {
  it('registers every command it needs', () => {
    const sim = quickSave({}, 'production-commands');
    for (const kind of [
      'production.shape', 'production.engage', 'production.commit',
      'production.open', 'production.shelve', 'production.follow_up',
    ]) {
      expect(sim.hasCommand(kind), `${kind} is not registered`).toBe(true);
    }
  });

  it('refuses every command on a project that is not there', () => {
    const sim = quickSave({}, 'production-missing');
    for (const [kind, payload] of [
      ['production.shape', { projectId: 'nope', formatId: 'feature', parts: 1, secondsEach: 110 * 60 }],
      ['production.engage', { projectId: 'nope', postId: 'director', talentId: 'x', dealKind: 'fee' }],
      ['production.commit', { projectId: 'nope' }],
      ['production.shelve', { projectId: 'nope' }],
      ['production.follow_up', { projectId: 'nope', title: 'Again' }],
    ] as const) {
      const done = sim.execute({ kind, payload: payload as Record<string, unknown> });
      expect(done.ok, `${kind} did not refuse a project that does not exist`).toBe(false);
    }
  });
});

describe('the script', () => {
  const evens = { depth: 3, dialogue: 3, pace: 3, turns: 3, threads: 3, spectacle: 3 };
  const loud = { depth: 0, dialogue: 0, pace: 5, turns: 5, threads: 0, spectacle: 5 };
  const quiet = { depth: 5, dialogue: 5, pace: 1, turns: 1, threads: 5, spectacle: 0 };

  it('makes the player spend from one pool, so nothing can be everything', () => {
    expect(spent(evens)).toBe(ATTENTION);
    expect(whyNotWrite(evens)).toBeUndefined();
    const everything = Object.fromEntries(DIALS.map((d) => [d, MOST]));
    const no = whyNotWrite(everything);
    expect(no).toBeDefined();
    expect(no).toContain(`${ATTENTION}`);
    expect(leftToSpend(evens)).toBe(0);
  });

  it('refuses a dial outside its range and names the range', () => {
    expect(whyNotWrite({ pace: 9 })).toContain(`${MOST}`);
    expect(whyNotWrite({ pace: -1 })).toBeDefined();
  });

  it('wants different things in different genres, which is all a genre does', () => {
    // A genre multiplies nothing. It decides which dials the audience it brings came
    // for, so the same script is a good horror picture and a poor drama.
    const thriller = GENRE_BY_ID.thriller!;
    const romance = GENRE_BY_ID.romance!;
    expect(servesIts(thriller, loud)).toBeGreaterThan(servesIts(romance, loud));
    expect(servesIts(romance, quiet)).toBeGreaterThan(servesIts(thriller, quiet));
  });

  it('gives every genre a different shape of want', () => {
    const prints = GENRES.map((g) => DIALS.map((d) => g.wants[d]).join(','));
    expect(new Set(prints).size, 'two genres want the same things').toBe(GENRES.length);
    // And none of them is simply better than another: the totals are close, so a
    // genre is a different audience and not a harder difficulty.
    const totals = GENRES.map((g) => DIALS.reduce((s, d) => s + g.wants[d], 0));
    expect(Math.max(...totals) - Math.min(...totals)).toBeLessThan(1.5);
  });

  it('splits the dials so a picture built to open is not built to last', () => {
    const thriller = GENRE_BY_ID.thriller!;
    const fast = whatItReads(thriller, loud);
    const deep = whatItReads(thriller, quiet);
    expect(fast.draw).toBeGreaterThan(deep.draw);
    expect(deep.craft).toBeGreaterThan(fast.craft);
  });

  it('reaches the reckoning, and moves both the height and the word of mouth', () => {
    const base = { ...BASE, genre: GENRE_BY_ID.action!, dials: evens };
    const opened = reckon({ ...base, dials: loud });
    const lasted = reckon({ ...base, dials: quiet });
    expect(opened.cents).toBeGreaterThan(lasted.cents);
    expect(lasted.wordOfMouth).toBeGreaterThan(opened.wordOfMouth);
    // And the receipt grew a link rather than a number changing quietly.
    expect(reckon(base).said.map((n) => n.by)).toContain('the script');
  });

  it('leaves a picture nobody wrote exactly where it was', () => {
    const before = reckon(BASE).cents;
    expect(reckon({ ...BASE, genre: GENRE_BY_ID.drama! }).cents).toBe(before);
    expect(UNWRITTEN.pace).toBe(3);
  });
});

describe('where it came from', () => {
  it('gives every provenance in the domain model a row, and no more', () => {
    // The list is fixed by `Provenance`, which is already written into saves. This
    // fills those six in rather than inventing a list beside them.
    expect(SOURCES.map((s) => s.id).sort()).toEqual(
      ['article', 'format', 'life_rights', 'novel', 'original', 'play'].sort(),
    );
  });

  it('differs on the fields something reads, not on the description', () => {
    const prints = SOURCES.map((s) => JSON.stringify([
      s.aboutCents, s.knownAlready, s.carriesInto, s.suits,
    ]));
    expect(new Set(prints).size, 'two sources are one row twice').toBe(SOURCES.length);
  });

  it('makes an original the cheapest thing in the business and the emptiest', () => {
    const original = SOURCE_BY_ID.original!;
    // The trade the whole table turns on: nothing to pay and no audience at all.
    expect(original.knownAlready).toBe(0);
    expect(original.carriesInto).toBe(0);
    for (const other of SOURCES) {
      if (other.id === 'original') continue;
      expect(other.aboutCents).toBeGreaterThan(original.aboutCents);
    }
  });

  it('brings the campaign floor down for material people already know', () => {
    const feature = FORMAT_BY_ID.feature!;
    const bare = floorAfter(feature.expectsCampaignCents, undefined);
    const novel = floorAfter(feature.expectsCampaignCents, SOURCE_BY_ID.novel!);
    expect(bare).toBe(feature.expectsCampaignCents);
    expect(novel).toBeLessThan(bare);
    // And that is a discount rather than a bonus, so the same campaign reads as a
    // bigger campaign instead of the picture simply taking more.
    const spend = 150_000_00;
    const withIt = reckon({ ...BASE, campaignCents: spend, source: SOURCE_BY_ID.novel! });
    const without = reckon({ ...BASE, campaignCents: spend });
    expect(withIt.cents).toBeGreaterThan(without.cents);
  });

  it('widens what a script may carry without making a thin one score better', () => {
    const full = { depth: 4, dialogue: 4, pace: 4, turns: 3, threads: 3, spectacle: 4 };
    expect(spent(full)).toBe(22);
    // Refused on its own, allowed off a novel — which hands over people and a world
    // that already work.
    expect(whyNotWrite(full)).toBeDefined();
    expect(whyNotWrite(full, carriedInto(SOURCE_BY_ID.novel!))).toBeUndefined();
    expect(leftToSpend(full, carriedInto(SOURCE_BY_ID.novel!))).toBe(0);
    // The room is not a result. A thin script off a novel is still a thin script.
    const thin = { depth: 1, dialogue: 1, pace: 1, turns: 1, threads: 1, spectacle: 1 };
    const genre = GENRE_BY_ID.drama!;
    expect(servesIts(genre, thin)).toBeLessThan(servesIts(genre, full));
  });

  it('refuses a format the material cannot honestly become, and says what it suits', () => {
    const play = SOURCE_BY_ID.play!;
    const label = (id: string) => FORMAT_BY_ID[id]?.label ?? id;
    const no = whyNotFrom(play, 'serial', 'A Continuing Series', label);
    expect(no).toBeDefined();
    expect(no).toContain('A Feature Film');
    expect(whyNotFrom(play, 'feature', 'A Feature Film', label)).toBeUndefined();
    // An original suits everything, which is what an empty list means.
    expect(SOURCE_BY_ID.original!.suits).toEqual([]);
    expect(whyNotFrom(SOURCE_BY_ID.original!, 'micro', 'A Micro-Series', label)).toBeUndefined();
  });

  it('keeps a licensed format out of a cinema and a play out of a service', () => {
    const label = (id: string) => FORMAT_BY_ID[id]?.label ?? id;
    expect(whyNotFrom(SOURCE_BY_ID.format!, 'feature', 'A Feature Film', label)).toBeDefined();
    expect(whyNotFrom(SOURCE_BY_ID.format!, 'serial', 'A Continuing Series', label)).toBeUndefined();
    expect(whyNotFrom(SOURCE_BY_ID.play!, 'micro', 'A Micro-Series', label)).toBeDefined();
  });
});

describe('what the year decides', () => {
  it('gives every craft award a post the engine actually models', () => {
    // A category for a job nothing models could not credit anybody, and crediting
    // people is two of the three things a win is for.
    for (const award of AWARDS) {
      if (award.id === 'picture') { expect(award.postId).toBeUndefined(); continue; }
      expect(POSTS.map((p) => p.id), `${award.id} credits a post that does not exist`)
        .toContain(award.postId);
    }
    expect(new Set(AWARDS.map((a) => a.id)).size).toBe(AWARDS.length);
  });

  it('lifts a picture more than any single craft award', () => {
    const picture = AWARD_BY_ID.picture!;
    for (const award of AWARDS) {
      if (award.id !== 'picture') expect(picture.liftsWindows).toBeGreaterThan(award.liftsWindows);
      expect(award.liftsWindows).toBeGreaterThan(1);
    }
  });

  it('reads how it was made and never what it took', () => {
    // The whole reason awards sit beside a box office instead of repeating it. All
    // three inputs raise the room's view and there is no money term at all.
    const base = standsWithTheRoom(1, 1, 0);
    expect(standsWithTheRoom(1.4, 1, 0)).toBeGreaterThan(base);
    expect(standsWithTheRoom(1, 1.4, 0)).toBeGreaterThan(base);
    expect(standsWithTheRoom(1, 1, 1)).toBeGreaterThan(base);
    // And craft carries more of it than the page, so the dials do not win twice.
    const byCraft = standsWithTheRoom(1.4, 1, 0) - base;
    const byPage = standsWithTheRoom(1, 1.4, 0) - base;
    expect(byCraft).toBeGreaterThan(byPage);
    expect(ROOM_WEIGHS.craft + ROOM_WEIGHS.page + ROOM_WEIGHS.mouth).toBeCloseTo(1, 6);
  });

  it('leaves the favorite usually winning and sometimes not', () => {
    // A room that ranked strictly by a figure would be an announcement rather than a
    // ceremony. The draw has to be smaller than the gap it is allowed to close.
    expect(THE_ROOM_IS_A_ROOM).toBeGreaterThan(0);
    expect(THE_ROOM_IS_A_ROOM).toBeLessThan(0.5);
  });

  it('only lifts the windows still ahead of the night', () => {
    // A win does not make a finished picture earn retroactively. The multiplier is
    // applied where the windows are paid, so anything already paid is untouched.
    const before: Opening = {
      at: 0, channel: 'theatrical', campaignCents: 0,
      reckonedCents: 100_000_000_00, wordOfMouth: 0, weeksPaid: 0,
    };
    const after: Opening = { ...before, liftedBy: 1.55 };
    const plain = windowsInWeek(before, 30).find((w) => w.id === 'service')!;
    const lifted = windowsInWeek(after, 30).find((w) => w.id === 'service')!;
    expect(lifted.cents).toBeGreaterThan(plain.cents);
    expect(lifted.cents / plain.cents).toBeCloseTo(1.55, 2);
  });

  it('holds the ceremony in a month with something left to lift', () => {
    // February, so a picture opened in October to be seen by the room is still
    // inside its run when the room votes. A ceremony beside the releases it judges
    // would have nothing ahead of it.
    const at = nextCeremony(Date.UTC(1998, 5, 1));
    expect(new Date(at).getUTCMonth()).toBe(CEREMONY_MONTH);
    expect(at).toBeGreaterThan(Date.UTC(1998, 5, 1));
    // And it rolls to the next year once this year's has gone.
    expect(new Date(nextCeremony(Date.UTC(1998, 0, 1))).getUTCFullYear()).toBe(1998);
    expect(new Date(nextCeremony(Date.UTC(1998, 8, 1))).getUTCFullYear()).toBe(1999);
    expect(CONSIDERS_MONTHS).toBeGreaterThan(12);
  });

  it('arms a ceremony on a fresh save, and only one', () => {
    const sim = quickSave({}, 'awards-armed');
    const armed = sim.timeline.pending().filter((one) => one.kind === 'awards.year');
    expect(armed.length).toBe(1);
  });
});
