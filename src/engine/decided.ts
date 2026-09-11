/**
 * SLATE — everything this build decides, registered.
 *
 * Importing this file registers every decider, the way `src/ui/looks/all.ts`
 * assembles the drill-down graph. `tests/deciders.test.ts` imports it and
 * sweeps each one; `tools/deciders.mjs` reads the `drawnIn` lines to check
 * that no file in the engine draws from the random number generator without
 * one of these accounting for it.
 *
 * It sits beside `index.ts` rather than under `core/` because a decider has to
 * call the real function on a real world to be worth anything, and that means
 * building a save. Nothing in the engine imports this, so there is no cycle:
 * it is read by the test and by the tool.
 *
 * The list is meant to grow. When casting lands it lands here, and it cannot
 * land without saying what it reads.
 */

import { defineDecider } from './core/deciders';
import { quickSave, defaultConfig } from './index';
import type { Simulation } from './core/simulation';
import { CITIES } from './content/geography';
import { weatherOn } from './systems/weather';
import { MS_DAY } from './core/time';
import { ENQUIRY_SHAPES, type Enquiry } from './content/lot';
import { wouldBook } from './world/lot';
import { decideQuota } from './world/sugar';
import { decideSlip, type Squeeze } from './world/making';
import { ageOn } from './world/family';

// ---------------------------------------------------------------------------
// The sky
// ---------------------------------------------------------------------------

/**
 * Cities chosen for how differently they behave, not alphabetically: the
 * arctic, the subarctic, an oceanic capital, a desert, the tropics, and the
 * southern hemisphere so a sweep across the year runs both ways round.
 */
const SPREAD_OF_PLACES = [
  'is-1-reykjavik', 'us-ak-anchorage', 'gb-eng-london', 'us-nv-lasvegas',
  'sg-01-singapore', 'au-nsw-sydney', 'us-ca-losangeles', 'ru-sa-yakutsk',
].filter((id) => CITIES.get(id) !== undefined);

interface Sky { sim: Simulation; cityId: string; instant: number }

defineDecider<Sky, string>({
  id: 'weather.day',
  decides: 'What the sky does in one city on one day.',
  drawnIn: 'src/engine/systems/weather.ts',
  reads: {
    // Latitude and climate: Yakutsk and Singapore cannot have the same day.
    place: (sky, t) => ({
      ...sky,
      cityId: SPREAD_OF_PLACES[Math.min(SPREAD_OF_PLACES.length - 1, Math.floor(t * SPREAD_OF_PLACES.length))]!,
    }),
    // The date, all the way round the year, so the seasons have to show.
    date: (sky, t) => ({ ...sky, instant: sky.instant + Math.round(t * 364) * MS_DAY }),
    // Two saves are two different worlds, and the sky is part of that.
    world: (sky, t) => ({ ...sky, sim: skyFor(Math.round(t * 20)) }),
  },
  sample: (seed) => ({
    sim: skyFor(seed),
    cityId: SPREAD_OF_PLACES[seed % SPREAD_OF_PLACES.length] ?? 'is-1-reykjavik',
    instant: skyFor(seed).now,
  }),
  decide: ({ sim, cityId, instant }) => {
    const city = CITIES.get(cityId);
    if (!city) return 'nowhere';
    const day = weatherOn(sim, city, instant);
    // The condition and the high, to the degree. Finer than that and every
    // draw differs, which would pass the sweep while proving nothing.
    return `${day.condition} ${Math.round(day.highC)}`;
  },
});

const SKIES = new Map<number, Simulation>();
function skyFor(seed: number): Simulation {
  const held = SKIES.get(seed);
  if (held) return held;
  const made = quickSave({}, `decider-sky-${seed}`);
  SKIES.set(seed, made);
  return made;
}

// ---------------------------------------------------------------------------
// The family
// ---------------------------------------------------------------------------

interface Household { seed: number; motherAge: number; fatherAge: number; twin: boolean }

defineDecider<Household, string>({
  id: 'family.born',
  decides: 'How old your parents are when the save opens, and whether you were born alone.',
  drawnIn: 'src/engine/index.ts',
  reads: {
    // The two answers creation actually asks for.
    motherAge: (h, t) => ({ ...h, motherAge: Math.round(16 + t * 42) }),
    fatherAge: (h, t) => ({ ...h, fatherAge: Math.round(16 + t * 42) }),
    // A twin is a third person, so the answer has a different shape.
    twin: (h, t) => ({ ...h, twin: t >= 0.5 }),
    // The birthday spread is drawn, so two saves of the same answers differ.
    world: (h, t) => ({ ...h, seed: Math.round(t * 20) }),
  },
  sample: (seed) => ({ seed, motherAge: 29, fatherAge: 31, twin: seed % 2 === 0 }),
  decide: ({ seed, motherAge, fatherAge, twin }) => {
    const base = defaultConfig();
    const sim = quickSave({
      family: {
        mother: { ...base.family.mother, ageAtBirth: motherAge },
        father: { ...base.family.father, ageAtBirth: fatherAge },
        twin: twin
          ? (base.family.twin ?? { firstName: 'Sam', identical: false, role: 'nothing in particular' as const })
          : undefined,
      },
    }, `decider-family-${seed}`);
    const people = Object.values(sim.universe.people).filter((p) => !p.isPlayer);
    return people
      .map((p) => `${ageOn(p.birthInstant, sim.now)}`)
      .sort()
      .join('/');
  },
});

// ---------------------------------------------------------------------------
// The lot
// ---------------------------------------------------------------------------

interface Enquired { sim: Simulation; need: Enquiry; from: number }

defineDecider<Enquired, string>({
  id: 'lot.booked',
  decides: 'Whether a production takes a stage at Sugar Land, and which one.',
  drawnIn: 'src/engine/world/lot.ts',
  reads: {
    // How much room it wants. The smallest stage that holds it is the one it
    // gets, so this has to move the answer between four different rooms.
    size: (e, t) => ({ ...e, need: { ...e.need, needsSqm: Math.round(400 + t * 5_800) } }),
    // How much air above it. Thirty meters is Askja's and nothing else's.
    height: (e, t) => ({ ...e, need: { ...e.need, needsHeightM: Math.round(6 + t * 24) } }),
    // Water. Only Lón has any.
    water: (e, t) => ({ ...e, need: { ...e.need, needsTank: t >= 0.5 } }),
    // What it will spend here, which decides which rebate tier it qualifies
    // for, which is the whole reason anybody looks at Iceland.
    spend: (e, t) => ({ ...e, need: { ...e.need, spendIsk: Math.round(t * 3_000_000_000) } }),
    // How long for. Long enough and it stops fitting around what is booked.
    weeks: (e, t) => ({ ...e, need: { ...e.need, weeks: Math.round(1 + t * 25) } }),
  },
  sample: (seed) => {
    const shape = ENQUIRY_SHAPES[seed % ENQUIRY_SHAPES.length]!.of;
    const sim = lotFor(seed);
    return { sim, need: { ...shape }, from: sim.now + 60 * MS_DAY };
  },
  decide: ({ sim, need, from }) => {
    const answer = wouldBook(sim, need, from);
    return answer.stageId ? (sim.universe.stages[answer.stageId]?.name ?? 'a stage') : 'nowhere';
  },
});

const LOTS = new Map<number, Simulation>();
function lotFor(seed: number): Simulation {
  const held = LOTS.get(seed);
  if (held) return held;
  const made = quickSave({}, `decider-lot-${seed}`);
  LOTS.set(seed, made);
  return made;
}

// ---------------------------------------------------------------------------
// The sugar
// ---------------------------------------------------------------------------

interface Quota { was: number | undefined; shutRunning: number; roll: number }

defineDecider<Quota, string>({
  id: 'sugar.quota',
  decides: 'How much sugar America lets in at the low duty, for one fiscal year.',
  drawnIn: 'src/engine/world/sugar.ts',
  reads: {
    // What it did last year, which is the honest majority of the answer.
    lastYear: (q, t) => ({ ...q, was: t < 0.5 ? 0 : Math.round(t * 120_000) }),
    // How long it has been shut, because a run builds pressure to reopen.
    shutRunning: (q, t) => ({ ...q, shutRunning: Math.round(t * 6) }),
    // And the draw, because it is a political decision and the game does not
    // know. Declaring this is admitting it rather than hiding it.
    roll: (q, t) => ({ ...q, roll: t }),
  },
  sample: (seed) => ({ was: seed % 2 === 0 ? 0 : 90_000, shutRunning: seed % 3, roll: (seed % 7) / 7 }),
  decide: ({ was, shutRunning, roll }) => {
    const answer = decideQuota(was, shutRunning, roll);
    return answer.tonnes === 0 ? 'shut' : 'open';
  },
});

// ---------------------------------------------------------------------------
// The shoot
// ---------------------------------------------------------------------------

defineDecider<Squeeze, string>({
  id: 'making.slip',
  decides: 'How many days past wrap a shoot runs.',
  drawnIn: 'src/engine/world/making.ts',
  reads: {
    // How far the schedule was cut below what the budget says the picture
    // takes. This is the read that matters: an overrun is mostly a decision
    // somebody made months earlier, not weather.
    tightness: (sq, t) => ({ ...sq, tightness: 0.45 + t * 0.85 }),
    // And how long the shoot is, because a twenty-week picture has four times
    // as many chances to lose a day as a five-week one.
    weeks: (sq, t) => ({ ...sq, weeks: Math.round(2 + t * 22) }),
  },
  sample: (seed) => ({ tightness: 0.5 + (seed % 8) * 0.1, weeks: 3 + (seed % 12) * 2 }),
  decide: (squeeze) => {
    const days = decideSlip(squeeze, ((squeeze.weeks * 7 + 3) % 11) / 11).days;
    if (days === 0) return 'on schedule';
    if (days <= 3) return 'a few days over';
    if (days <= 10) return 'a week or two over';
    return 'badly over';
  },
});
