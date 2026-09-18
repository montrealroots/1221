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
import { decideSlip, type Squeeze } from './world/making';
import { decideReview, type Review } from './world/trouble';
import { FINDINGS } from './content/trouble';
import { decideTake, type Prospects } from './world/selling';
import { DEALS } from './content/selling';
import { decideHire, standingReads, type Hiring } from './world/crew';
import {
  ON_THE_BOARD, believedAt, decideOffer, reachOfBand, readOn, sheetFor, sparkBetween, sparkReads,
  whatItWants,
  type Offer,
} from './world/casting';
import {
  AXES, BOOKABLE, SIZES, TAPE_LEANS, THE_GIVING, passById, type AxisId,
} from './content/casting';
import { FURTHEST, HOUSE_HOLDS, SHADES, TOO_FAR, whyById, type Reading } from './content/audition';
import { decideAudition, remembersYou, whatTheyWant } from './world/audition';
import type { Looked } from './domain/company';
import { ageOn } from './world/family';
import { sheetOf, type AttributeSheet } from './domain/attributes';

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
  decide: ({ was, shutRunning, roll }) => {
    const answer = decideQuota(was, shutRunning, roll);
    return answer.tonnes === 0 ? 'shut' : 'open';
  },
});

interface Hire { woman: boolean; given: number; years: number }

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

// ---------------------------------------------------------------------------
// Somebody watching the finished work
// ---------------------------------------------------------------------------

/**
 * The two decks a review can draw from: a picture's and a season's.
 *
 * Not a plan id anywhere. What the decks differ by is whether consent is a
 * standing relationship and whether there is anybody above the cutting room,
 * which is a fact about the periods, and the sample carries the two answers.
 */
const PICTURE_DECK = FINDINGS.filter((one) => one.needs?.movedDuringTheWork === undefined
  && one.needs?.ratioAbove === undefined);
const SEASON_DECK = FINDINGS;

defineDecider<Review, string>({
  id: 'making.reviewed',
  decides: 'What a look at finished work turns up, and how far down it sends the work.',
  drawnIn: 'src/engine/world/making.ts',
  draws: ['making.review', 'making.found'],
  reads: {
    // How far this part had climbed, taken the way done is taken: the lowest
    // of its six. This is the whole difference between a free regression and a
    // ruinous one, and it belongs to the ladder rather than to the row.
    climbed: (r, t) => ({ ...r, climbed: t }),
    // How much the production left lying around. At nothing to find the week
    // passes; at everything, most weeks turn something up.
    exposure: (r, t) => ({ ...r, exposure: t }),
    // Whether this week's look finds anything, against the rate exposure sets.
    // Declared rather than hidden: a lawyer finding a thing this week and not
    // last week is genuinely not something the engine knows.
    whether: (r, t) => ({ ...r, whether: t * 0.35 }),
    // And which row comes off the deck, which is a second draw and not the
    // first. One roll doing both jobs correlates them: a low roll fires and
    // lands on the heaviest row, so the rare rows at the bottom could never
    // happen at all while every test still passed.
    which: (r, t) => ({ ...r, which: t }),
  },
  sample: (seed) => ({
    ladders: seed % 2 === 0 ? 'season' : 'picture',
    deck: seed % 2 === 0 ? SEASON_DECK : PICTURE_DECK,
    climbed: 0.2 + (seed % 5) * 0.2,
    exposure: (seed % 4) / 4,
    whether: 0.04 + (seed % 3) * 0.05,
    which: (seed % 7) / 7,
  }),
  decide: (review) => {
    const found = decideReview(review);
    return found.finding ? `${found.finding.dimension}, ${found.said}` : found.said;
  },
});

// ---------------------------------------------------------------------------
// The money that comes back
// ---------------------------------------------------------------------------

defineDecider<Prospects, string>({
  id: 'selling.take',
  decides: 'What a finished picture takes across ten years.',
  drawnIn: 'src/engine/world/selling.ts',
  reads: {
    // What it cost, because scale buys audience — sublinearly, but it buys it.
    // A quarter-million-euro picture and a hundred-million one cannot land in
    // the same band.
    budget: (p, t) => ({ ...p, negativeCents: Math.round((250_000 + t * 120_000_000) * 100) }),
    // And how it is being sold, which matters as much as the picture: a
    // streamer buyout reaches nobody after the check clears, and a studio
    // release reaches everybody for a decade.
    deal: (p, t) => ({
      ...p,
      dealId: DEALS[Math.min(DEALS.length - 1, Math.floor(t * DEALS.length))]!.id,
    }),
    // And who is in it. Two axes, because a picture beautifully played by
    // people the camera does not want is a different object from a plain one
    // played well, and both of those are things a buyer prices separately.
    cast: (p, t) => ({ ...p, cast: { truth: t * 100, reads: t * 100 } }),
    // And what the trade is currently writing about them, which is subtracted
    // rather than blended: it is not a quality of the work.
    conduct: (p, t) => ({ ...p, controversy: t * 100 }),
  },
  sample: (seed) => ({
    negativeCents: (2_000_000 + (seed % 9) * 7_000_000) * 100,
    dealId: DEALS[seed % DEALS.length]!.id,
    cast: { truth: 35 + (seed % 5) * 9, reads: 40 + (seed % 4) * 8 },
    controversy: (seed % 3) * 12,
  }),
  decide: (prospects) => {
    const roll = ((prospects.negativeCents / 100_000) % 13) / 13;
    const took = decideTake(prospects, roll).cents;
    // Banded against what it cost, because that is the only scale on which a
    // take means anything. Forty million is a triumph for one picture and a
    // disaster for another.
    const times = took / Math.max(1, prospects.negativeCents);
    if (times < 1) return 'never earns it back';
    if (times < 2.5) return 'earns its cost back';
    if (times < 5) return 'a real hit';
    return 'a phenomenon';
  },
});

// ---------------------------------------------------------------------------
// The people a picture needs
// ---------------------------------------------------------------------------

defineDecider<Hiring, string>({
  id: 'crew.hired',
  decides: 'Who gets a post on a picture, and whether they have worked here before.',
  drawnIn: 'src/engine/world/crew.ts',
  draws: ['crew.hire', 'crew.make'],
  reads: {
    // How many people have held this post for the company already. A crew that
    // has worked together gets rehired, and nothing else about this decision
    // matters as much.
    returning: (h, t) => ({ ...h, returning: Math.round(t * 5) }),
    // What the picture costs, because money reaches further: a quarter of a
    // million euros gets who is available and forty million gets who is wanted.
    budget: (h, t) => ({ ...h, negativeCents: Math.round((250_000 + t * 60_000_000) * 100) }),
    // And whether the post runs a department, because a head is both kept
    // harder and drawn from a shallower, better pool than anybody under them.
    head: (h, t) => ({ ...h, head: t >= 0.5 }),
  },
  sample: (seed) => ({
    returning: seed % 4,
    negativeCents: (1_000_000 + (seed % 7) * 5_000_000) * 100,
    head: seed % 2 === 0,
  }),
  decide: (hiring) => {
    const roll = ((hiring.negativeCents / 1_000) % 17) / 17;
    const answer = decideHire(hiring, roll);
    return `${answer.returning ? 'somebody they have used' : 'somebody new'}, ${standingReads(answer.standing)}`;
  },
});

// ---------------------------------------------------------------------------
// The people a picture puts on screen
// ---------------------------------------------------------------------------

interface Asking { offer: Offer; roll: number }

defineDecider<Asking, string>({
  id: 'casting.answered',
  decides: 'Whether a performer takes a part, counters, or passes — and on what.',
  drawnIn: 'src/engine/world/casting.ts',
  draws: ['casting.offer'],
  reads: {
    // Whether the dates are clear, which is first because no amount of money
    // moves a shooting schedule somebody else already owns.
    dates: (a, t) => ({ ...a, offer: { ...a.offer, free: t >= 0.5 } }),
    // What is being offered against what their people want. The whole of a
    // negotiation, held as one ratio.
    money: (a, t) => ({
      ...a,
      offer: { ...a.offer, feeCents: Math.round(a.offer.askCents * (0.4 + t * 1.6)) },
    }),
    // How much of the picture the part is. Somebody in demand turns down small
    // ones and somebody who is not takes whatever comes.
    size: (a, t) => ({ ...a, offer: { ...a.offer, carries: Math.round(3 + t * 52) } }),
    // And how wanted they are, which is what makes the same part an insult to
    // one person and a break for another.
    demand: (a, t) => ({ ...a, offer: { ...a.offer, demand: Math.round(t * 100) } }),
    // The draw, because the honest reason people say no is frequently no reason
    // at all, and declaring that is better than hiding it in a formula.
    draw: (a, t) => ({ ...a, roll: t }),
  },
  sample: (seed) => ({
    offer: {
      askCents: (150_000 + (seed % 5) * 90_000) * 100,
      feeCents: (150_000 + (seed % 5) * 90_000) * 100,
      carries: 12 + (seed % 4) * 9,
      free: true,
      demand: 45 + (seed % 6) * 8,
    },
    roll: ((seed * 7) % 13) / 13,
  }),
  decide: ({ offer, roll }) => {
    const answer = decideOffer(offer, roll);
    if (answer.took) return 'they take it';
    if ('counterCents' in answer) return 'their people name a number';
    return `they pass on ${passById(answer.passed)?.label.toLowerCase() ?? 'it'}`;
  },
});

interface Pile { bandCents: number; draw: number }

defineDecider<Pile, string>({
  id: 'casting.seen',
  decides: 'How good the people who come in for a part are.',
  drawnIn: 'src/engine/world/casting.ts',
  reads: {
    // What the picture set aside for the part. The only input, and the reason
    // greenlighting cheap is a casting decision months before anybody thinks of
    // it as one.
    band: (p, t) => ({ ...p, bandCents: Math.round((2_000 + t * 900_000) * 100) }),
    // And where in the band's spread this particular submission falls.
    draw: (p, t) => ({ ...p, draw: t }),
  },
  sample: (seed) => ({
    bandCents: (5_000 + (seed % 6) * 60_000) * 100,
    draw: ((seed * 5) % 11) / 11,
  }),
  decide: ({ bandCents, draw }) => {
    const reach = reachOfBand(bandCents);
    const standing = Math.max(1, Math.min(100, Math.round(reach - 18 + draw * 30)));
    // A fixed generator, so this reports what the band bought rather than what
    // the dice did on top of it.
    let n = 0;
    const sheet = sheetFor(standing, () => { n += 1; return ((n * 37) % 23) / 23; });
    const truth = readOn(sheet, 'truth');
    if (truth < 34) return 'whoever was free';
    if (truth < 52) return 'working performers';
    if (truth < 70) return 'people you have heard of';
    return 'people who don’t normally read for this';
  },
});

interface Belief { truth: number; looked: Looked; axis: AxisId; offset: number; lean: number }

defineDecider<Belief, string>({
  id: 'casting.shown',
  decides: 'What a company believes a performer is, before it has ever worked with them.',
  drawnIn: 'src/engine/world/casting.ts',
  reads: {
    // What they actually are, which nobody in the world has access to and which
    // every belief about them is nonetheless a distance from.
    truth: (b, t) => ({ ...b, truth: Math.round(1 + t * 99) }),
    // How far the office has got with them. A photograph, a tape they shot at
    // home and chose the best take of, eight minutes in the room, or a second
    // time with somebody directing.
    round: (b, t) => ({
      ...b,
      looked: {
        ...b.looked,
        rounds: BOOKABLE.slice(0, Math.floor(t * (BOOKABLE.length + 1))).map((r) => r.id),
      },
    }),
    // Which of the three the last note was on, where one was given. A session is
    // one note and a note is one axis, so this is what the room spent itself on.
    note: (b, t) => ({
      ...b,
      looked: { ...b.looked, ...(t < 0.5 ? {} : { note: b.axis }) },
    }),
    // And which axis is being asked about, because they do not close at the same
    // rate: a tape tells you a great deal about one of them and almost nothing
    // about another.
    axis: (b, t) => ({
      ...b,
      axis: AXES[Math.min(AXES.length - 1, Math.floor(t * AXES.length))]!.id,
    }),
    // Where inside the width this particular belief fell. Fixed for the life of
    // a save, so a round closes in on a point rather than redrawing it.
    draw: (b, t) => ({ ...b, offset: t * 2 - 1 }),
    // And how far this person's own tape misrepresents them, which is a fact
    // about their kitchen and their deadlines rather than about their acting,
    // and which only a round that watches a file can be fooled by.
    tape: (b, t) => ({ ...b, lean: (t * 2 - 1) * TAPE_LEANS }),
  },
  sample: (seed) => ({
    truth: 20 + (seed % 7) * 11,
    looked: { personId: 'somebody', rounds: BOOKABLE.slice(0, seed % 4).map((r) => r.id) },
    axis: AXES[seed % AXES.length]!.id,
    offset: ((seed * 3) % 9) / 9 * 2 - 1,
    lean: (((seed * 5) % 7) / 7 * 2 - 1) * TAPE_LEANS,
  }),
  decide: ({ truth, looked, axis, offset, lean }) => {
    const believed = believedAt(truth, looked, axis, offset, lean);
    const out = Math.abs(believed - truth);
    if (out < 4) return 'they know';
    if (out < 12) return 'about right';
    if (out < 26) return 'out by a tier';
    return 'they have no idea';
  },
});

// ---------------------------------------------------------------------------
// The other side of the room
// ---------------------------------------------------------------------------

interface InTheRoom { off: number; sawYou: boolean; free: boolean; roll: number }

defineDecider<InTheRoom, string>({
  id: 'audition.said',
  decides: 'Whether a room gives the player the part, and what the no is called.',
  drawnIn: 'src/engine/world/audition.ts',
  draws: ['audition.heard'],
  reads: {
    // How far what they played was from what the room wanted. The whole of it,
    // and deliberately the only thing about the performance that is read —
    // the player cannot act badly, so nothing here asks whether they did.
    played: (r, t) => ({ ...r, off: t * (TOO_FAR + 0.6) }),
    // Whether anybody was in a room with them or watching a file, which
    // decides what the no is called and nothing else. A tape's cost is paid
    // earlier, in the note it never gave.
    seen: (r, t) => ({ ...r, sawYou: t >= 0.5 }),
    // And whether they are free, because no reading survives being unavailable
    // and no amount of being right for something moves a shooting schedule.
    dates: (r, t) => ({ ...r, free: t >= 0.5 }),
    // The draw, because two people can both be right for something and one of
    // them gets it.
    luck: (r, t) => ({ ...r, roll: t }),
  },
  sample: (seed) => ({
    off: ((seed % 7) / 7) * TOO_FAR,
    sawYou: seed % 2 === 0,
    free: seed % 5 !== 0,
    roll: ((seed * 3) % 11) / 11,
  }),
  decide: ({ off, sawYou, free, roll }) =>
    whyById(decideAudition({ off, sawYou, free }, roll))?.label.toLowerCase() ?? 'nothing',
});

interface Asked { sim: Simulation; readings: number }

defineDecider<Asked, string>({
  id: 'audition.asked',
  decides: 'Whether a production shooting on the lot thinks of the player at all.',
  drawnIn: 'src/engine/world/audition.ts',
  draws: ['audition.calls'],
  reads: {
    // How many times these people have had them in, whatever came of it. The
    // research calls roster memory the main career ratchet and is explicit that
    // it pays out from a pass, so this counts readings and not parts won.
    memory: (a, t) => ({ ...a, readings: Math.round(t * 8) }),
  },
  sample: (seed) => ({ sim: quickSave({}, `asked-${seed % 4}`), readings: seed % 5 }),
  decide: ({ sim, readings }) => {
    const holder = 'RÚV, a limited series';
    for (let i = 0; i < readings; i += 1) {
      const id = `remembered-${i}`;
      sim.universe.auditions[id] = {
        id, saveId: sim.universe.meta.id, bookingId: `b-${i}`, officeId: holder, holder, size: 'day',
        feeCents: 1_00, from: sim.now, to: sim.now, closesAt: sim.now,
        wants: {}, state: 'over', why: 'went-another-way',
      };
    }
    const chance = remembersYou(sim, holder);
    for (let i = 0; i < readings; i += 1) delete sim.universe.auditions[`remembered-${i}`];
    if (chance < 0.2) return 'nobody has heard of them';
    if (chance < 0.45) return 'they might think of them';
    if (chance < 0.75) return 'they’d call them in';
    return 'they ask for them by name';
  },
});

interface WhatARoomWants {
  /** What these people like, across everything they ever cast. */
  house: Reading;
  /** The draw that decides whether this room keeps it. */
  holds: number;
  /** And what this room would have wanted if it belonged to nobody. */
  own: number;
}

/**
 * One room's want, built the way `whatIsGoing` builds it.
 *
 * `whatTheyWant` draws twice per shade — what the room would want alone, then
 * whether the house holds — so the scripted stream alternates between the two.
 * The per-shade shift on the first is there so the three shades are not one
 * shade written out three times.
 */
const roomWants = ({ house, holds, own }: WhatARoomWants): Reading => {
  let at = 0;
  return whatTheyWant((): number => {
    const draw = at;
    at += 1;
    return draw % 2 === 0 ? (own + Math.floor(draw / 2) * 0.29) % 1 : holds;
  }, house);
};

defineDecider<WhatARoomWants, string>({
  id: 'audition.house',
  decides: 'What one room wants, and how much of that is the taste of the people casting it.',
  drawnIn: 'src/engine/world/audition.ts',
  reads: {
    // What these people like. It is the same on every shade a room keeps, which
    // is what makes a holder learnable at all — read for them enough times and
    // the average of what you played is most of the way to this.
    taste: (w, t) => ({
      ...w,
      house: {
        warmth: Math.round((t * 2 - 1) * FURTHEST),
        size: Math.round((1 - t * 2) * FURTHEST),
        pace: Math.round((t * 2 - 1) * FURTHEST),
      },
    }),
    // Whether this room keeps it. Below `HOUSE_HOLDS` the want is the house's
    // and above it the room goes its own way, which is the three rooms in ten
    // that stop a holder from being a lookup.
    holds: (w, t) => ({ ...w, holds: t }),
    // And what the room wants when it does go its own way. Inert while the
    // house holds, which is the point of it being a separate input: sweeping
    // this across a sample that keeps the house proves nothing, and the sweep
    // runs six samples for exactly that reason.
    own: (w, t) => ({ ...w, own: t }),
  },
  // Even samples keep the house and odd ones do not, whatever `HOUSE_HOLDS` is
  // set to — so no sweep is measuring only one side of the branch. At nought
  // the house does not exist and `taste` is genuinely inert, which this test
  // would then say out loud rather than pass over.
  sample: (seed) => ({
    house: {
      warmth: (seed % 7) - 3,
      size: ((seed * 2) % 7) - 3,
      pace: ((seed * 3) % 7) - 3,
    },
    holds: seed % 2 === 0 ? HOUSE_HOLDS * 0.4 : Math.min(0.999, HOUSE_HOLDS + (1 - HOUSE_HOLDS) * 0.6),
    own: ((seed * 5) % 7) / 7,
  }),
  decide: (input) => {
    const want = roomWants(input);
    return SHADES.map((shade) => `${shade.label} ${want[shade.id]}`).join(', ');
  },
});

interface Pair { one: AttributeSheet; other: AttributeSheet; draw: number }

/** A sheet with a chosen shape on the three axes and a chosen generosity. */
const sheetShaped = (at: Record<string, number>, giving: number): AttributeSheet => sheetOf(50, {
  ...Object.fromEntries(AXES.flatMap((axis) => axis.of.map((a) => [a, at[axis.id] ?? 50]))),
  ...Object.fromEntries(THE_GIVING.map((id) => [id, giving])),
});

defineDecider<Pair, string>({
  id: 'casting.spark',
  decides: 'What two people carrying a picture have between them.',
  drawnIn: 'src/engine/world/casting.ts',
  reads: {
    // The shape of the first one, level taken out. Shape and never level,
    // because level would make the best performer alive maximally different
    // from everybody and therefore everybody's ideal partner.
    shape: (p, t) => ({
      ...p,
      one: sheetShaped({ truth: 20 + t * 70, repeatable: 55, reads: 90 - t * 70 }, 70),
    }),
    // And the shape of the second, swept the other way, so the sweep walks the
    // pair from identical through to opposite.
    against: (p, t) => ({
      ...p,
      other: sheetShaped({ truth: 90 - t * 70, repeatable: 55, reads: 20 + t * 70 }, 70),
    }),
    // What the two of them give whoever is in the scene with them, which is the
    // multiplier: generosity with nothing to be generous toward buys nothing.
    giving: (p, t) => ({
      ...p,
      one: sheetShaped({ truth: 90, repeatable: 50, reads: 20 }, Math.round(1 + t * 99)),
    }),
    // And whether they got on, which nobody can account for.
    rapport: (p, t) => ({ ...p, draw: t }),
  },
  sample: (seed) => ({
    one: sheetShaped({ truth: 30 + (seed % 5) * 14, repeatable: 55, reads: 80 - (seed % 5) * 12 }, 60),
    other: sheetShaped({ truth: 75 - (seed % 4) * 15, repeatable: 55, reads: 35 + (seed % 4) * 13 }, 65),
    draw: ((seed * 7) % 9) / 9,
  }),
  decide: ({ one, other, draw }) => sparkReads(sparkBetween(
    { attributes: one } as never, { attributes: other } as never, draw,
  )),
});

interface Wanted { sim: Simulation; sizeId: string; roleId: string }

/**
 * What one part is looking for, which was the last draw nothing accounted for.
 *
 * Twelve of the thirteen unowned streams turned out to belong to decisions that
 * were already registered and already documented — `weather.day` takes two dice,
 * `crew.hired` takes two, and so on — and they are declared on those deciders now.
 * This one was not any of them. `whatItWants` rolls a shape for every part on a
 * picture and nothing anywhere said what it was deciding or what it reads.
 *
 * What it decides: the size says what a part this big usually wants, and the draw
 * says what *this* one turned out to be. It is normalised back afterwards, so no
 * part is quietly worth more than another — a leaning is a shape, not a quantity,
 * and a part that wanted more of everything would be a part with a bigger budget
 * rather than a different one.
 *
 * It matters because it is the thing a player reads a room against. Every ask the
 * player answers is answered into one of these, so a build where every part wanted
 * the same thing is a build where the reading is a formality.
 */
defineDecider<Wanted, string>({
  id: 'casting.wants',
  decides: 'What one part on a picture is looking for.',
  drawnIn: 'src/engine/world/casting.ts',
  reads: {
    // How big the part is, which is the half that is not a draw: the size's own
    // leaning is what a part this size usually wants.
    size: (w, t) => ({ ...w, sizeId: SIZES[Math.floor(t * SIZES.length)]?.id ?? w.sizeId }),
    // And which part it is, because two parts of the same size on the same
    // picture are not the same part. This is the draw itself, keyed by role id.
    which: (w, t) => ({ ...w, roleId: `role_${Math.round(t * 1000)}` }),
  },
  sample: (seed) => ({
    sim: wantsFor(seed),
    sizeId: SIZES[seed % SIZES.length]!.id,
    roleId: `role_${seed}`,
  }),
  decide: ({ sim, sizeId, roleId }) => {
    const size = SIZES.find((one) => one.id === sizeId) ?? SIZES[0]!;
    const project = Object.values(sim.universe.projects)[0];
    if (!project) return 'nothing to be in';
    const wants = whatItWants(sim, project, roleId, size);
    // The shape, to one decimal, which is what a room is read against. Finer and
    // every draw differs, which would pass the sweep while proving nothing.
    return AXES.map((axis) => `${axis.id}:${(wants[axis.id] ?? 0).toFixed(1)}`).join(' ');
  },
});


/**
 * Who a format season is offered, which is a different draw from who reads for a
 * part and had to be its own entry.
 *
 * `casting.seen` above is about a band buying a standard of performer: the money
 * decides the spread and the draw places one submission in it. A cast board is not
 * bought — the contributors are civilians on a stipend, and what varies between
 * one pool and another is not how good they are at anything. It is whether the
 * twelve people available are people an audience would watch, and whether any of
 * them is already trouble.
 *
 * So the outcome reported is the shape of the pool rather than the quality of one
 * person, because that is what the choice is made out of.
 */
defineDecider<{ draw: number }, string>({
  id: 'casting.board',
  decides: 'What kind of people are available for a format season’s cast board.',
  drawnIn: 'src/engine/world/casting.ts',
  reads: {
    // The only input. There is no band to read: a format does not buy a standard
    // of contributor, it sees who is around.
    draw: (p, t) => ({ ...p, draw: t }),
  },
  sample: (seed) => ({ draw: ((seed * 7) % 13) / 13 }),
  decide: ({ draw }) => {
    let n = draw;
    const next = (): number => { n = (n * 9301 + 49297) % 1; return Math.abs(n * 233280 % 1); };
    // Twelve of them, which is a board's worth, read for the two things a format
    // is cast on.
    let appeal = 0;
    let trouble = 0;
    for (let i = 0; i < ON_THE_BOARD; i += 1) {
      appeal += 10 + next() * 85;
      if (next() < 0.25) trouble += 1;
    }
    const mean = appeal / ON_THE_BOARD;
    const said = mean < 40 ? 'nobody the country would watch'
      : mean < 60 ? 'a watchable dozen'
        : 'people who would carry a season';
    return `${said}, ${trouble === 0 ? 'none of them trouble' : `${trouble} already trouble`}`;
  },
});
const WANTS = new Map<number, Simulation>();
function wantsFor(seed: number): Simulation {
  const held = WANTS.get(seed);
  if (held) return held;
  const made = quickSave({}, `decider-wants-${seed}`);
  made.execute({ kind: 'company.develop', payload: { title: `A Thing ${seed}`, medium: 'film' } });
  WANTS.set(seed, made);
  return made;
}
