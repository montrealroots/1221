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
import { CENTS_IN_A_MILLION } from './core/money';
import { FORMAT_BY_ID } from './content/format';
import { bendTheRun } from './content/release';
import { STANDING_BY_ID } from './content/talent';
import { STUDIOS, STUDIO_BY_ID } from './content/rivals';
import { reckon, type Spec as BoxSpec } from './world/boxoffice';
import { whatTheyOpen } from './world/field';
import { POSTS } from './content/craft';
import { BILLINGS } from './content/roles';
import { rungOf } from './content/talent';
import { shortlistFor } from './world/production';
import { standsWithTheRoom } from './content/awards';

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


// ---------------------------------------------------------------------------
// What a release takes, what shape it takes it in, and who else is out that week
// ---------------------------------------------------------------------------

/**
 * The height of a run, as a rung.
 *
 * `world/boxoffice.ts` is a chain of nine named links, each of which may move a
 * carried figure. Every one is a place a sign can be inverted, and an inverted sign
 * there reads perfectly: "a bigger campaign means a smaller opening" is a sentence,
 * and until `sweepDirection` existed it was a sentence this build could not tell from
 * the truth.
 *
 * So the chain declares its directions and the sweep pushes each input end to end.
 * Six inputs, six claims. It takes no dice at all, which is why it says so: the same
 * plan in the same week returns the same figure every time, because a figure that
 * cannot be reproduced cannot be argued with.
 */
interface Opening {
  spentCents: number;
  craft: string;
  draw: string;
  campaignCents: number;
  crowding: number;
  month: number;
}

const REACH_UP = ['starting', 'working', 'sought', 'first'];
const asOpening = (o: Opening): BoxSpec => ({
  format: FORMAT_BY_ID.feature!,
  parts: 1,
  secondsEach: 110 * 60,
  spentCents: o.spentCents,
  campaignCents: o.campaignCents,
  reach: {
    director: STANDING_BY_ID[o.craft]!.reach,
    writer: STANDING_BY_ID[o.craft]!.reach,
    photography: STANDING_BY_ID[o.craft]!.reach,
    cutting: STANDING_BY_ID[o.craft]!.reach,
    music: STANDING_BY_ID[o.draw]!.reach,
    line: 1,
  },
  // The cast, which is most of the draw and used to be a post called Lead. Left out
  // when the cast became a list, and the sweep caught it within the hour: `draw`
  // was moving the composer alone, twenty-eight per cent of its own axis, and never
  // shifted a rung across six worlds. An input that no longer reaches what it names
  // is exactly what this test is for.
  castReach: Object.fromEntries(
    BILLINGS.map((b) => [b.id, STANDING_BY_ID[o.draw]!.reach]),
  ),
  month: o.month,
  crowding: o.crowding,
});

const HEIGHTS = ['quiet', 'modest', 'solid', 'strong', 'enormous'];
const heightOf = (cents: number): string => {
  const m = cents / CENTS_IN_A_MILLION;
  if (m < 4) return 'quiet';
  if (m < 12) return 'modest';
  if (m < 30) return 'solid';
  if (m < 70) return 'strong';
  return 'enormous';
};

defineDecider<Opening, string>({
  id: 'release.height',
  decides: 'How much a finished picture takes when it opens.',
  drawnIn: 'src/engine/world/boxoffice.ts',
  deterministic: true,
  reads: {
    // What was spent making it, across three orders of magnitude.
    spend: (o, t) => ({ ...o, spentCents: Math.round(200_000_00 + t * 80_000_000_00) }),
    // Who directed, wrote, shot and cut it.
    craft: (o, t) => ({ ...o, craft: REACH_UP[Math.min(3, Math.floor(t * 4))]! }),
    // Whose face is on it, and what it sounds like.
    draw: (o, t) => ({ ...o, draw: REACH_UP[Math.min(3, Math.floor(t * 4))]! }),
    // What was spent telling anybody, from nothing to ten times the floor.
    campaign: (o, t) => ({ ...o, campaignCents: Math.round(t * 2_500_000_00) }),
    // How much of the week was already spoken for.
    crowding: (o, t) => ({ ...o, crowding: t }),
    // And when in the year it opened.
    month: (o, t) => ({ ...o, month: Math.min(11, Math.floor(t * 12)) }),
  },
  sample: (seed) => ({
    spentCents: 1_500_000_00 + (seed % 5) * 900_000_00,
    craft: REACH_UP[seed % 4]!,
    draw: REACH_UP[(seed + 2) % 4]!,
    campaignCents: 250_000_00 + (seed % 3) * 200_000_00,
    crowding: (seed % 4) / 4,
    month: seed % 12,
  }),
  ladder: HEIGHTS,
  // Four up and one down, each read straight off the link that makes the claim.
  // `month` is left undeclared: the seasonal table has two peaks and two troughs, so
  // later in the year is not monotonically better and a direction would be false.
  rises: { spend: 'up', craft: 'up', draw: 'up', campaign: 'up', crowding: 'down' },
  decide: (o) => heightOf(reckon(asOpening(o)).cents),
});

/**
 * The shape of a run, as a rung.
 *
 * Separate from the height because they are separate, and the build kept conflating
 * them. A picture can open enormous and vanish, or open quietly and play until March,
 * and a model where quality only scales the total produces neither. This is the check
 * that the two really are independent: it sweeps what bends the curve and reads only
 * the curve.
 */
interface Shaped { mouth: number; legs: number }

defineDecider<Shaped, string>({
  id: 'release.shape',
  decides: 'Whether a run is front-loaded or has legs.',
  drawnIn: 'src/engine/content/release.ts',
  deterministic: true,
  reads: {
    // How well people speak of it.
    mouth: (s, t) => ({ ...s, mouth: t * 2 - 1 }),
    // And how much the format lets that matter at all.
    legs: (s, t) => ({ ...s, legs: t }),
  },
  sample: (seed) => ({ mouth: ((seed % 5) / 4) * 2 - 1, legs: 0.3 + (seed % 4) * 0.2 }),
  ladder: ['front-loaded', 'even', 'long legs'],
  rises: { mouth: 'up', legs: 'up' },
  decide: ({ mouth, legs }) => {
    // The share landing after the first four weeks. A blunt measure on purpose: it
    // is the one an exhibitor actually cares about.
    const tail = bendTheRun(mouth, legs).slice(4).reduce((sum, w) => sum + w, 0);
    if (tail < 0.30) return 'front-loaded';
    if (tail < 0.42) return 'even';
    return 'long legs';
  },
});

/**
 * Whether a rival studio opens something in a given week.
 *
 * The one decision in the release model that genuinely takes a die, and it has to:
 * what somebody else does is not a thing this company can derive. Drawn per studio
 * per week so a slate never has to be stored, which keeps the field knowable — a
 * player can read the weeks ahead and move their own date, and a rival who behaved
 * unpredictably would make that a coin toss rather than a judgement.
 */
interface Week { sim: Simulation; studioId: string; at: number }

defineDecider<Week, string>({
  id: 'rivals.open',
  decides: 'Whether another studio opens something this week, and how big.',
  drawnIn: 'src/engine/world/field.ts',
  draws: ['rivals'],
  reads: {
    // Which studio. Four a year and fourteen a year cannot behave the same.
    studio: (w, t) => ({
      ...w,
      studioId: STUDIOS[Math.min(STUDIOS.length - 1, Math.floor(t * STUDIOS.length))]!.id,
    }),
    // And when, all the way round the year, because they cluster.
    when: (w, t) => ({ ...w, at: w.at + Math.round(t * 51) * MS_WEEK }),
  },
  sample: (seed) => ({
    sim: quickSave(defaultConfig(), `rivals-${seed}`),
    studioId: STUDIOS[seed % STUDIOS.length]!.id,
    at: Date.UTC(1998, 0, 5) + (seed % 7) * MS_WEEK,
  }),
  decide: ({ sim, studioId, at }) => {
    const out = whatTheyOpen(sim, STUDIO_BY_ID[studioId]!, at);
    if (!out) return 'nothing';
    return out.pull > 0.5 ? 'something large' : 'something';
  },
});

/**
 * Who is up for a post when a shortlist is drawn.
 *
 * The other decision in this system that genuinely takes a die. Who happens to be
 * available and how far their name reaches is not a thing the company derives — it
 * is the world's answer — and the shortlist is where that lands.
 *
 * The rungs are weighted down hard on purpose: plenty of people are working and very
 * few are first call, so the top of a list feels like a decision rather than a
 * default. What the sweep checks is that the draw reaches more than one answer and
 * that the post asked for changes who turns up, because a shortlist that ignored the
 * post would be five names with a job title printed above them.
 */
interface Casting { sim: Simulation; projectId: string; postId: string }

defineDecider<Casting, string>({
  id: 'casting.shortlist',
  decides: 'Who is available for a post, and how far their names reach.',
  drawnIn: 'src/engine/world/production.ts',
  draws: ['casting'],
  reads: {
    // Which job. A shortlist that ignored this would be names under a heading.
    post: (c, t) => ({
      ...c,
      postId: POSTS[Math.min(POSTS.length - 1, Math.floor(t * POSTS.length))]!.id,
    }),
    // And which picture is asking, because two projects do not see the same room.
    project: (c, t) => ({ ...c, projectId: `p${Math.floor(t * 40)}` }),
  },
  sample: (seed) => ({
    sim: quickSave(defaultConfig(), `casting-${seed}`),
    projectId: `p${seed}`,
    postId: POSTS[seed % POSTS.length]!.id,
  }),
  // No ladder, and the absence is the claim. The outcome sits on a scale — a room
  // with a first call in it beats one without — but neither input pushes along it:
  // asking for a composer instead of a director does not make the room better or
  // worse, and nor does asking on behalf of a different picture. Who happens to be
  // free is the world's answer rather than a consequence of what was asked. A ladder
  // declared here with no direction to push along it would be decoration, which is
  // what `tests/deciders.test.ts` refuses, and inventing a direction to satisfy it
  // would be worse: a claim the model does not make.
  decide: ({ sim, projectId, postId }) => {
    const list = shortlistFor(sim, projectId, postId);
    if (list.length === 0) return 'starting';
    return list
      .map((one) => one.standingId)
      .reduce((best, id) => (rungOf(id) > rungOf(best) ? id : best), 'starting');
  },
});

/**
 * What the room thought of one picture.
 *
 * The ceremony reads how it was made, how well the page served the audience its
 * genre brought, and what people said — and no figure from the ledger appears in it
 * anywhere. That is the whole reason awards sit beside a box office rather than
 * duplicating it: the two are allowed to disagree, so a quiet picture nobody went to
 * can win and a hit can go home with nothing.
 *
 * The draw is small and declared. A room that ranked strictly by a figure would make
 * the night an announcement of something already knowable, and every year would go
 * to whoever spent most on a director.
 */
interface Judged { craft: number; serves: number; mouth: number }

const HOW_IT_STOOD = ['nowhere', 'in the room', 'in front'];

defineDecider<Judged, string>({
  id: 'awards.room',
  decides: 'What the year thinks of one picture.',
  drawnIn: 'src/engine/world/awards.ts',
  draws: ['awards'],
  reads: {
    // How it was made, which is most of what the room is looking at.
    craft: (j, t) => ({ ...j, craft: 0.7 + t * 0.9 }),
    // Whether the page served the audience its own genre brought.
    serves: (j, t) => ({ ...j, serves: t * 1.5 }),
    // And what people said, which the craft produced in the first place.
    mouth: (j, t) => ({ ...j, mouth: t * 2 - 1 }),
  },
  sample: (seed) => ({
    craft: 0.72 + (seed % 5) * 0.18,
    serves: 0.4 + (seed % 4) * 0.3,
    mouth: ((seed % 5) / 4) * 2 - 1,
  }),
  ladder: HOW_IT_STOOD,
  // All three up, and each is read straight off the weighting. There is nothing here
  // that could push a picture down the room's order by getting better.
  rises: { craft: 'up', serves: 'up', mouth: 'up' },
  decide: ({ craft, serves, mouth }) => {
    const at = standsWithTheRoom(craft, serves, mouth);
    if (at < 0.85) return 'nowhere';
    if (at < 1.15) return 'in the room';
    return 'in front';
  },
});
