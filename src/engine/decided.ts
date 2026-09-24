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
 * The list is meant to grow. It is down to the sky after the revamp took the
 * family and the film side out, and anything new that draws lands here,
 * because it cannot land anywhere else without saying what it reads.
 */

import { defineDecider } from './core/deciders';
import { quickSave } from './index';
import type { Simulation } from './core/simulation';
import { CITIES } from './content/geography';
import { weatherOn } from './systems/weather';
import { MS_DAY } from './core/time';

// ---------------------------------------------------------------------------
// The sky
// ---------------------------------------------------------------------------

/**
 * Cities chosen for how differently they behave, not alphabetically: the
 * arctic, the subarctic, an oceanic capital, a desert, the tropics, and the
 * southern hemisphere so a sweep across the year runs both ways round.
 *
 * Every one has to be in the gazetteer the game boots with, and a name that
 * isn't stops the sweep. The list was filtered instead, and five of its eight
 * names dropped out without a word: `gb-eng-london`, `is-1-reykjavik`,
 * `sg-01-singapore` and `ru-sa-yakutsk` were ids the gazetteer never had
 * (Yakutsk is `ru-63-yakutsk`), and Anchorage is there only once the United
 * States' towns are loaded, which the sweep never does. The sweep ran on Las
 * Vegas, Sydney and Los Angeles, and the arctic, the subarctic and the tropics
 * it claimed were not in it.
 */
const SPREAD_OF_PLACES = [
  'sj-21-longyearbyen', 'gl-07-nuuk', 'is-39-reykjavik', 'uk-eng-london',
  'us-nv-lasvegas', 'sg-singapore', 'au-nsw-sydney', 'us-ca-losangeles',
].map((id) => {
  if (!CITIES.get(id)) throw new Error(`The sky's sweep names ${id}, which the gazetteer does not carry.`);
  return id;
});

interface Sky { sim: Simulation; cityId: string; instant: number }

defineDecider<Sky, string>({
  id: 'weather.day',
  decides: 'What the sky does in one city on one day.',
  drawnIn: 'src/engine/systems/weather.ts',
  reads: {
    // Latitude and climate: Longyearbyen and Singapore cannot have the same day.
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
    cityId: SPREAD_OF_PLACES[seed % SPREAD_OF_PLACES.length]!,
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
