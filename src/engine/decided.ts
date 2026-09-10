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
 * Two deciders today, and they are the only two things in the build that
 * decide anything. The list is meant to grow. When casting lands it lands
 * here, and it cannot land without saying what it reads.
 */

import { defineDecider } from './core/deciders';
import { quickSave, defaultConfig } from './index';
import type { Simulation } from './core/simulation';
import { CITIES } from './content/geography';
import { weatherOn } from './systems/weather';
import { MS_DAY } from './core/time';
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
