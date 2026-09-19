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
 * The list is meant to grow, and it has: casting landed, and it landed here,
 * because it could not land anywhere else without saying what it reads.
 */

import { defineDecider } from './core/deciders';
import { quickSave, defaultConfig } from './index';
import type { Simulation } from './core/simulation';
import { CITIES } from './content/geography';
import { weatherOn } from './systems/weather';
import { MS_DAY } from './core/time';
import { CREW_BASE, ENQUIRY_SHAPES, type Enquiry } from './content/lot';
import { MS_WEEK, pullOn, stagesOn, wouldBook } from './world/lot';
import { decideQuota } from './world/sugar';
import { MEN, WOMEN } from './content/names';
import { ageOn } from './world/family';
import { onTheMarket } from './world/material';
import { appealFrom } from './content/material';
import { reckon, whatItCouldReach } from './content/release';
import { BEST_TEAM, DEPARTMENTS, LEAST_TEAM, monthsFor, rateFor } from './content/departments';

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
  decides: 'The sky over one city on one day.',
  drawnIn: 'src/engine/systems/weather.ts',
  draws: ['weather', 'weather-hours'],
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
  draws: ['family'],
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
    // What it will spend here was declared and is not, because the thing that
    // read it has gone. It decided which rebate tier a foreign production
    // qualified for, and the tier gate lived in the production system. The price
    // gate still reads the spend, and across this sweep's range it never binds —
    // so the input is inert, and an inert declared input is the exact defect the
    // sweep exists to catch. It comes back when the reimbursement does.
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

interface Ringing { sim: Simulation; crew: number; letWeeks: number }

/**
 * A world with a given crew base and a given three years behind it.
 *
 * Built rather than played, because sweeping this properly means reaching
 * states a five-year save cannot: a country with three times the crew it
 * started with, and a lot that has been full for three years. Both are
 * reachable and neither is quick.
 */
function ringingIn(seed: number): Ringing {
  const sim = lotFor(100 + seed);
  return { sim, crew: 1, letWeeks: 0 };
}

defineDecider<Ringing, string>({
  id: 'lot.rang',
  decides: 'How many productions ring about a stage in one month.',
  drawnIn: 'src/engine/world/lot.ts',
  draws: ['lot', 'lot.how-many'],
  reads: {
    // People in the country to crew a picture with. It starts at the national
    // base and every picture made here adds two dozen who are still here
    // afterwards, so this is the slow half and it only goes up.
    crew: (r, t) => ({ ...r, crew: 1 + t * 2 }),
    // And what the rooms did over the last three years, which is the fast half
    // and runs both ways: three quiet years and the lot is new again.
    record: (r, t) => ({ ...r, letWeeks: t * 3 * 52 * stagesOn(r.sim).length }),
  },
  sample: (seed) => ringingIn(seed % 4),
  decide: ({ sim, crew, letWeeks }) => {
    // A world posed rather than played: put the crew and the bookings where
    // the sweep asks for them and read what the lot would hear.
    const people = Object.values(sim.universe.people);
    const want = Math.round(CREW_BASE * crew) - CREW_BASE;
    for (let i = 0; i < want; i += 1) {
      const one = people[i % people.length];
      if (one) sim.universe.people[`crew-${i}`] = { ...one, id: `crew-${i}`, careerTrack: 'crew' };
    }
    // Across every room, because the record is what the LOT did and a lot with
    // one busy stage and three dark ones has not been busy.
    const rooms = stagesOn(sim);
    const each = rooms.length > 0 ? Math.round(letWeeks / rooms.length) : 0;
    for (const [i, room] of rooms.entries()) {
      if (each <= 0) break;
      sim.universe.bookings[`swept-${i}`] = {
        id: `swept-${i}`, saveId: sim.universe.meta.id, stageId: room.id, holder: 'somebody',
        kind: 'shooting', from: sim.now - each * MS_WEEK, to: sim.now, weekRateCents: 1,
      };
    }
    const calls = pullOn(sim).calls;
    for (let i = 0; i < want; i += 1) delete sim.universe.people[`crew-${i}`];
    for (const [i] of rooms.entries()) delete sim.universe.bookings[`swept-${i}`];
    if (calls < 1.25) return 'one a month';
    if (calls < 1.75) return 'about three every two months';
    if (calls < 2.5) return 'two a month';
    return 'as many as the country has';
  },
});

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
  ladder: ['shut', 'open'],
  // Both directions are read straight off the two comments above, which is the
  // method: declare what the model says it does, and let the sweep say whether it
  // does it. A bigger quota last year makes an open year more likely because last
  // year is the honest majority of the answer, and a longer run of shut years
  // builds pressure to reopen. `roll` is left undeclared — it is the political
  // decision the game admits it cannot model, and a draw owes no direction.
  rises: { lastYear: 'up', shutRunning: 'up' },
  decide: ({ was, shutRunning, roll }) => {
    const answer = decideQuota(was, shutRunning, roll);
    return answer.tonnes === 0 ? 'shut' : 'open';
  },
});


/** The given name a draw lands on, the way `staffTheGroup` lands on it. */
const nameFrom = (woman: boolean, t: number): string => (woman
  ? WOMEN[Math.floor(t * WOMEN.length)] ?? 'Anna'
  : MEN[Math.floor(t * MEN.length)]?.name ?? 'Jón');

/**
 * Who runs the sugar group, which is a draw and says so.
 *
 * Five seats at a company that has been trading since 1946, filled once when the
 * save opens and never again. It is in the registry because every die this game
 * rolls is, and because the alternative was a stream the ratchet could not see:
 * the gate counts draw streams nothing owns and it went from thirteen to
 * fourteen the moment this existed.
 *
 * What it decides is nobody's fortune. These five have no attribute sheet, hold
 * no rights and appear in no casting; they exist so that the screen saying who
 * runs the family business has an answer, and so that the head of milling is a
 * person rather than an empty chair. The one thing the draw settles that anybody
 * can feel is which name and which pronouns, which is why it is keyed per seat —
 * adding a sixth post later must not rename the five already in a save.
 */
interface Hire { woman: boolean; given: number; years: number }

defineDecider<Hire, string>({
  id: 'sugar.staff',
  decides: 'Who holds each of the five salaried seats at the sugar group.',
  drawnIn: 'src/engine/world/sugar.ts',
  reads: {
    // Whether they are a woman, which decides the given name, the patronymic
    // ending and the pronouns the screens use for them.
    woman: (h, t) => ({ ...h, woman: t < 0.5 }),
    // Which name off the table, out of the country's own.
    given: (h, t) => ({ ...h, given: t }),
    // And how old. Senior, because nobody mills two point two million tonnes at
    // twenty-six, so the range is the one a board of a seventy-year-old group
    // actually has rather than the general population's.
    years: (h, t) => ({ ...h, years: 41 + Math.floor(t * 23) }),
  },
  sample: (seed) => ({ woman: seed % 2 === 0, given: (seed % 11) / 11, years: 41 + (seed % 23) }),
  decide: ({ woman, given, years }) => `${nameFrom(woman, given)}, ${woman ? 'she/her' : 'he/him'}, ${years}`,
});

/**
 * What is on the market to option this month.
 *
 * Owns the `material` stream. There is no ladder and the absence is the claim, the
 * same way it is for a family's name: what somebody else happens to be selling sits
 * on a scale — a cheap original with a good title beats an expensive one — but
 * neither input pushes along it. A later month is not a better market and another
 * save is not a richer one. Declaring a direction here would assert an order the
 * model does not have.
 *
 * What it does check is that both inputs reach the outcome at all, which is the whole
 * point of the pool being drawn: a market that answered the same in every month, or
 * the same in every save, would be a catalog wearing a market's clothes.
 */
interface Market { sim: Simulation; at: number }

defineDecider<Market, string>({
  id: 'material.market',
  decides: 'Which properties are out there to be optioned this month.',
  drawnIn: 'src/engine/world/material.ts',
  draws: ['material'],
  reads: {
    // Which month is being asked about. The pool is redrawn in them.
    month: (m, t) => ({ ...m, at: Date.UTC(2031, Math.min(11, Math.floor(t * 12)), 8) }),
    // And which world is asking, because two saves do not see the same market.
    save: (m, t) => ({ ...m, sim: quickSave(defaultConfig(), `material-${Math.floor(t * 40)}`) }),
  },
  sample: (seed) => ({
    sim: quickSave(defaultConfig(), `material-${seed}`),
    at: Date.UTC(2031, seed % 12, 8),
  }),
  decide: ({ sim, at }) => {
    const out = onTheMarket(sim, at);
    if (out.length === 0) return 'nothing worth reading this month';
    const dearest = out.reduce((most, one) => Math.max(most, one.asksCents), 0);
    return `${out.length} listed, dearest at ${Math.round(dearest / 1_000_00)}`;
  },
});

/**
 * What a picture takes across its whole run.
 *
 * Deterministic in everything but the one draw, which is the point: an audience is
 * not a calculation, but it is not a coin toss either. A well made picture usually
 * does well and sometimes does not.
 *
 * Both declared inputs push the same way and say so. A dearer picture reaches
 * further, and better craft returns more — neither claim is subtle, and both are the
 * kind of thing a sign flip would invert while still reading perfectly in prose.
 */
interface Took {
  scope: number; spectacle: number; period: number;
  appeal: number; level: number; luck: number;
}

const TOOK = ['lost money', 'washed its face', 'did well', 'ran away'];

/** What the departments would charge for this shape of picture at this team level. */
const wouldCost = (t: Took): number => {
  const demands = { scope: t.scope, spectacle: t.spectacle, period: t.period };
  const level = Math.max(LEAST_TEAM, Math.min(BEST_TEAM, Math.round(t.level)));
  return DEPARTMENTS.reduce(
    (sum, one) => sum + rateFor(one, level) * monthsFor(one, demands), 0,
  );
};

defineDecider<Took, string>({
  id: 'release.took',
  decides: 'What a finished picture returns against what it cost.',
  drawnIn: 'src/engine/world/release.ts',
  draws: ['release'],
  reads: {
    // How much picture there is. The heaviest pull on an audience, and it costs across
    // all three phases, so it has to earn its keep on both sides at once.
    scope: (t, at) => ({ ...t, scope: 1 + Math.round(at * 4) }),
    // How much of it cannot be photographed as found. Pulls less than scope and costs
    // only on the floor and in finishing.
    spectacle: (t, at) => ({ ...t, spectacle: 1 + Math.round(at * 4) }),
    // How much of the world has to be built. Costs in design and on the floor, and
    // draws nobody, so this one is expected to push the rung the other way.
    period: (t, at) => ({ ...t, period: 1 + Math.round(at * 4) }),
    // Which team was hired. Not declared in `rises`, because it genuinely is not
    // monotone and that is the entire point of the model.
    level: (t, at) => ({ ...t, level: LEAST_TEAM + at * (BEST_TEAM - LEAST_TEAM) }),
    // How far the property carries, which costs nothing to make and is worth
    // everything to have. The only input that moves the take without touching the
    // budget at all.
    appeal: (t, at) => ({ ...t, appeal: appealFrom(at) }),
  },
  sample: (seed) => ({
    scope: 1 + (seed % 5),
    spectacle: 1 + ((seed * 3) % 5),
    period: 1 + ((seed * 7) % 5),
    appeal: appealFrom(((seed * 11) % 13) / 13),
    level: LEAST_TEAM + (seed % (BEST_TEAM - LEAST_TEAM + 1)),
    luck: (seed % 7) / 7,
  }),
  ladder: TOOK,
  // Scope up, spectacle up, period **down**, and the team level deliberately silent.
  //
  // `spend` was declared here once as a bare budget and the sweep deleted it, because
  // under the old model the outcome was a ratio in which the budget canceled: a
  // bigger picture took more money and cost more to make in the same breath. That is
  // no longer true and the deletion no longer holds. What a picture takes is now
  // capped by what its material could reach, so the budget sits in the denominator
  // alone and every input that moves it moves the rung.
  //
  // Period is the sharp one. It buys months of design and of the unit and reaches
  // nobody, so more of it can only make a picture return less against its cost. If
  // this ever sweeps up or inert, `PERIOD_PULLS` stopped being nought and the claim
  // that period is a trap dressed as prestige is no longer in the code.
  rises: { scope: 'up', spectacle: 'up', period: 'down', appeal: 'up' },
  decide: (t) => {
    const budgetCents = wouldCost(t);
    if (budgetCents <= 0) return 'lost money';
    const craft = (Math.max(LEAST_TEAM, Math.min(BEST_TEAM, t.level)) - LEAST_TEAM)
      / (BEST_TEAM - LEAST_TEAM);
    const reach = whatItCouldReach(
      { scope: t.scope, spectacle: t.spectacle, period: t.period }, t.appeal,
    );
    const share = reckon(reach, craft, t.luck) / budgetCents;
    if (share < 1) return 'lost money';
    if (share < 1.15) return 'washed its face';
    if (share < 1.5) return 'did well';
    return 'ran away';
  },
});
