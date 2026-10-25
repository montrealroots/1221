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
 * The list is meant to grow, and anything new that draws lands here, because
 * it cannot land anywhere else without saying what it reads. The scope reset
 * of 2026-10-09 took out the deciders of the driving, the trains, the flights,
 * the licenses, the career, the classmates's careers, the homes and the land.
 */

import { defineDecider } from './core/deciders';
import { quickSave } from './index';
import type { Simulation } from './core/simulation';
import { CITIES } from './content/geography';
import { weatherOn } from './systems/weather';
import { endBetween } from './systems/mortality';
import { accountNumber } from './systems/banknumber';
import { fraudOn } from './systems/security';
import { bankById } from './content/banks';
import { declines } from './systems/lending';
import { MS_DAY } from './core/time';
import { admittedClass, cabaretCompany, classmatesIn, goesOn, meanCraft, nightBand, nightEvaluation } from './systems/school';
import { drawDirection } from './systems/production';
import { PLAY_MATERIAL } from './content/material';
import { attributesOf } from './systems/attributes';
import { newLifeConfig } from './world/bootstrap';
import { startingDocuments } from './systems/documents';
import { illnessWeek } from './systems/health';
import { bodyOf } from './systems/body';
import { onsetMonth } from './systems/health';
import { mayHurt } from './systems/injury';
import { mayRefer, waitDays } from './systems/appointments';
import { reliabilityOf, setWork } from './systems/coursework';
import { therapyLifts } from './systems/therapy';
import { priorityOf } from './systems/classmates';
import { AGENTS } from './content/agents';
import { GATE, LEVELS, chancesFor, drawOf, offerOutcome, replyOutcome, rosterFor } from './systems/proagent';
import { DIRECT, HOLD, NEGOTIATE, castingDraw, postingsAt, releaseFate, slateReach } from './systems/projobs';
import { productionsOf, seriesOfYear, slatePartsAt } from './systems/slate';
import { PROJECTS } from './content/careerwork';
import { SERIES, seriesById } from './content/series';
import { decisionsTo, episodeDrawn, optionDrawn, pickupOf, revivalReturns, seasonAudienceWith } from './systems/series';
import { FORTUNE, responseOf } from './systems/market';
import { grows, invitedBack, pilotPicked, releaseGranted } from './systems/continuity';
import { actorFieldDrawn, actorProductionSubmits, actorWinners } from './systems/actorawards';
import { speechOf } from './systems/ceremony';
import { lateDays, rerunDrawn } from './systems/contracts';
import { cutDrawn, furtherDrawn, loopDrawn, pagesDrawn, planWork, promoDrawn, stressDrawn } from './systems/workflow';
import { simulateRun } from './systems/charts';
import { fieldDrawn, finalDrawn, festivalSelects, festivalSubmits, nominationsFor, productionEnters } from './systems/awards';
import type { Engagement } from './systems/pro';

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

// ---------------------------------------------------------------------------
// The end of a life
// ---------------------------------------------------------------------------

interface Year { sim: Simulation; age: number; countryId: string; condition: number }

/** A place in each country the table has, for the country a life is lived in. */
const COUNTRY_PLACES: Readonly<Record<string, string>> = {
  jp: 'jp-13-tokyo', is: 'is-39-reykjavik', uk: 'uk-eng-london', us: 'us-ca-losangeles', mx: 'mx-cmx-mexicocity',
};

defineDecider<Year, string>({
  id: 'life.end',
  decides: 'Whether the year up to the next birthday ends the life, and the day it does.',
  drawnIn: 'src/engine/systems/mortality.ts',
  reads: {
    // The life table: a year at twenty and a year at a hundred are not alike.
    age: (year, t) => ({ ...year, age: 20 + Math.round(t * 90) }),
    // Where they live: Japan's table sits years below Mexico's, and a year at
    // ninety-six, in good shape, ends about one life in eight in Tokyo and one
    // in four in Mexico City.
    country: (year, t) => {
      const ids = Object.keys(COUNTRY_PLACES);
      return { ...year, countryId: ids[Math.min(ids.length - 1, Math.floor(t * ids.length))]! };
    },
    // The shape they are in, against what the age allows.
    condition: (year, t) => ({ ...year, condition: Math.round(t * 100) }),
    // Two saves are two lives.
    world: (year, t) => ({ ...year, sim: skyFor(Math.round(t * 20)) }),
  },
  // Old, and a different age in each world, so each world's draw meets a
  // different chance and the country's share of it has somewhere to show.
  sample: (seed) => ({ sim: skyFor(seed), age: 88 + (seed % 6) * 3, countryId: 'us', condition: 60 }),
  decide: ({ sim, age, countryId, condition }) => {
    const player = sim.player;
    const from = sim.now;
    const person = {
      ...player,
      birthInstant: from - age * 365.2425 * MS_DAY,
      // Where they live, whose table it is (`homeOf`).
      currentLocationId: COUNTRY_PLACES[countryId]!,
      home: { kind: 'shared' as const, cityId: COUNTRY_PLACES[countryId]!, since: from },
      wellbeing: { ...player.wellbeing, condition },
    };
    const at = endBetween(sim, person, from, from + 365 * MS_DAY);
    // Which day of the year, or none: the day is part of the decision.
    return at === undefined ? 'lives' : `day ${Math.floor((at - from) / MS_DAY)}`;
  },
});

// ---------------------------------------------------------------------------
// The number an account opens under
// ---------------------------------------------------------------------------

interface Opening { sim: Simulation; bankId: string; kind: 'checking' | 'savings' }

/**
 * Banks of every numbering kind the tables carry, so a sweep across them
 * meets each: an IBAN country, a plain national number, and the thirteen's
 * own formats as they are filled in.
 */
const SPREAD_OF_BANKS = ['nl-ing', 'br-itau-unibanco', 'ch-ubs', 'ng-access-bank'].map((id) => {
  if (!bankById(id)) throw new Error(`The account-number sweep names ${id}, which the bank tables do not carry.`);
  return id;
});

defineDecider<Opening, string>({
  id: 'bank.number',
  decides: 'A bank account’s number, as it’s opened.',
  drawnIn: 'src/engine/systems/banknumber.ts',
  reads: {
    // The bank: its country's format and its own code.
    bank: (o, t) => ({ ...o, bankId: SPREAD_OF_BANKS[Math.min(SPREAD_OF_BANKS.length - 1, Math.floor(t * SPREAD_OF_BANKS.length))]! }),
    // A current account and a savings account are two numbers.
    kind: (o, t) => ({ ...o, kind: t < 0.5 ? 'checking' : 'savings' }),
    // Two saves are two sets of accounts.
    world: (o, t) => ({ ...o, sim: skyFor(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: skyFor(seed), bankId: SPREAD_OF_BANKS[seed % SPREAD_OF_BANKS.length]!, kind: 'checking' }),
  decide: ({ sim, bankId, kind }) => accountNumber(sim, sim.player, bankById(bankId)!, kind),
});

// ---------------------------------------------------------------------------
// Somebody else's use of a card
// ---------------------------------------------------------------------------

interface Theft { sim: Simulation; cityId: string }

/** A country for each kind of law and rate the table has: the US's, Britain's, the EU's, Australia's. */
const SPREAD_OF_FRAUD = ['us-ny-newyork', 'uk-eng-london', 'fr-idf-paris', 'au-nsw-sydney'];
const fraudCity = (t: number) => SPREAD_OF_FRAUD[Math.min(SPREAD_OF_FRAUD.length - 1, Math.floor(t * SPREAD_OF_FRAUD.length))]!;

defineDecider<Theft, string>({
  id: 'bank.fraud',
  decides: 'Whether somebody else uses a card on a day, which card, how much, and whether the bank stops it: here, the first such day in thirty years.',
  drawnIn: 'src/engine/systems/security.ts',
  reads: {
    // Where they bank: the country's rate, its average case and its banks' share stopped.
    country: (o, t) => ({ ...o, cityId: fraudCity(t), sim: livingIn(fraudCity(t), 0) }),
    // Two saves are two lives.
    world: (o, t) => ({ ...o, sim: livingIn(o.cityId, Math.round(t * 20)) }),
  },
  sample: (seed) => ({ cityId: SPREAD_OF_FRAUD[seed % SPREAD_OF_FRAUD.length]!, sim: livingIn(SPREAD_OF_FRAUD[seed % SPREAD_OF_FRAUD.length]!, seed) }),
  decide: ({ sim }) => {
    for (let day = 0; day < 30 * 365; day += 1) {
      const hit = fraudOn(sim, sim.player, sim.now + day * MS_DAY);
      if (hit) return 'day ' + day + ': ' + hit.which + ' ' + hit.amount + (hit.stopped ? ' stopped' : '');
    }
    return 'none';
  },
});

function livingIn(cityId: string, seed: number): Simulation {
  return quickSave({ startLocationId: cityId, homeRegionId: cityId }, `fraud-${seed}`);
}

// ---------------------------------------------------------------------------
// Drama school
// ---------------------------------------------------------------------------

/** A life begun at drama school, born in New York, under a seed. */
function atYale(seed: number): Simulation {
  return quickSave({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork' }, `yale-${seed}`);
}

defineDecider<{ sim: Simulation; born: string }, string>({
  id: 'documents.start',
  decides: 'The papers a life begins with: a US citizen’s passport and birth state’s license at the shares that hold them, and when each was issued (STARTING).',
  drawnIn: 'src/engine/systems/documents.ts',
  reads: {
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), born: 'us-ny-newyork' }),
  decide: ({ sim }) => { delete sim.player.documents; startingDocuments(sim, sim.player); return ((sim.player.documents as { kind: string; issuedAt?: number }[] | undefined) ?? []).map((d) => `${d.kind}@${Math.round((d.issuedAt ?? 0) / 86_400_000)}`).join(' ') || 'none'; },
});

defineDecider<{ sim: Simulation }, string>({
  id: 'attributes.presence',
  decides: 'A student’s presence: 55 to 80, most near the middle, for the faculty’s first choice.',
  drawnIn: 'src/engine/systems/attributes.ts',
  reads: {
    // Two saves are two people.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20) + 100) }),
  },
  sample: (seed) => ({ sim: atYale(seed) }),
  decide: ({ sim }) => {
    delete sim.player.attrs;
    return attributesOf(sim, sim.player).presence.toFixed(1);
  },
});

defineDecider<{ sim: Simulation }, string>({
  id: 'school.class',
  decides: 'Who the fifteen classmates are, actor or actress, the craft and drive each brings from the auditions, and the player’s craft among them.',
  drawnIn: 'src/engine/systems/school.ts',
  reads: {
    // Two saves are two admitted classes.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed) }),
  decide: ({ sim }) => {
    const { classmates, player } = admittedClass(sim, sim.player);
    return classmates.map((m) => `${m.name} ${meanCraft(m.craft).toFixed(1)}`).join(', ') + ` / ${meanCraft(player).toFixed(1)}`;
  },
});

defineDecider<{ sim: Simulation; day: number }, string>({
  id: 'school.attendance',
  decides: 'Which classmates are in class on a day, and so grow from it.',
  drawnIn: 'src/engine/systems/school.ts',
  reads: {
    // The day: each is drawn on its own.
    day: (o, t) => ({ ...o, day: Math.round(t * 60) }),
    // Two saves are two classes.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), day: seed % 60 }),
  // A fortnight of class days from the one read, so an absence shows.
  decide: ({ sim, day }) => Array.from({ length: 14 }, (_, n) => classmatesIn(sim, sim.player, `day-${day + n}`).map((x) => (x ? '1' : '0')).join('')).join(' '),
});

defineDecider<{ sim: Simulation; term: number }, string>({
  id: 'school.cabaret_mates',
  decides: 'A class’s Cabaret show in a term: its week among the term’s, and which of the classmates free that week are in it.',
  drawnIn: 'src/engine/systems/school.ts',
  reads: {
    // The term: each is drawn on its own.
    term: (o, t) => ({ ...o, term: Math.round(t * 5) }),
    // Two saves are two classes.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), term: seed % 6 }),
  decide: ({ sim, term }) => {
    const c = cabaretCompany(sim, sim.player, 'class-2029', term, 15, () => new Set());
    return c ? `${c.week.month}-${c.week.day}: ${c.members.join(' ')}` : 'none';
  },
});

/** A student set at one level in every ability and technique, and at an energy: what a night's decider reads. */
function atLevel(sim: Simulation, level: number, energy: number): Simulation {
  const p = sim.player;
  for (const k of Object.keys(p.craft!) as (keyof NonNullable<typeof p.craft>)[]) p.craft![k] = level;
  p.attrs = { presence: level, composure: level, listening: level, imagination: level, focus: level, adaptability: level, discipline: level };
  p.wellbeing.energy = energy;
  return sim;
}

defineDecider<{ sim: Simulation; level: number; ready: number }, string>({
  id: 'school.night',
  decides: 'How a night on stage goes: off, solid, strong or remarkable, by the evaluation of the part on the abilities and techniques, the day’s condition and its bounded variation.',
  drawnIn: 'src/engine/systems/school.ts',
  reads: {
    // The part on their craft.
    craft: (o, t) => ({ ...o, level: 40 + t * 50 }),
    // How ready they came.
    ready: (o, t) => ({ ...o, ready: 0.3 + t * 0.9 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), level: 50 + (seed % 30), ready: 0.6 + (seed % 5) / 10 }),
  decide: ({ sim, level, ready }) => { atLevel(sim, level, Math.min(100, ready * 80)); return Array.from({ length: 60 }, (_, n) => { const e = nightEvaluation(sim, sim.player, `d${n}`, {}, sim.now); return `${nightBand(e.overall)[0]}${Math.round(e.overall)}`; }).join(' '); },
});

defineDecider<{ sim: Simulation; term: number }, string>({
  id: 'production.direction',
  decides: 'Whether a production’s director asks for a way of playing it on one axis, which axis and which side, within what the play’s material takes (from 2026-10-10).',
  drawnIn: 'src/engine/systems/production.ts',
  reads: {
    // The production's term, which keys the draw with the play.
    term: (o, t) => ({ ...o, term: Math.round(t * 8) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), term: seed % 8 }),
  decide: ({ sim, term }) => PLAY_MATERIAL.map((m) => JSON.stringify(drawDirection(sim, sim.player, { play: m.id, term }))).join(' '),
});

defineDecider<{ sim: Simulation; night: number }, string>({
  id: 'school.understudy',
  decides: 'On which performances an understudy on call is sent on.',
  drawnIn: 'src/engine/systems/school.ts',
  reads: {
    // Which run of nights.
    night: (o, t) => ({ ...o, night: Math.round(t * 400) }),
    // Two saves are two runs of luck.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), night: seed * 7 }),
  // Two hundred nights, so the rare night on shows.
  decide: ({ sim, night }) => Array.from({ length: 200 }, (_, n) => (goesOn(sim, sim.player, sim.now + (night + n) * MS_DAY) ? String(night + n) : '')).filter(Boolean).join(',') || 'none',
});

defineDecider<{ sim: Simulation; bank: number }, string>({
  id: 'bank.chex',
  decides: 'Whether a US bank turns away somebody with a standing ChexSystems report.',
  drawnIn: 'src/engine/systems/lending.ts',
  reads: {
    // Each bank answers on its own.
    bank: (o, t) => ({ ...o, bank: Math.round(t * 4) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), bank: seed % 5 }),
  decide: ({ sim, bank }) => {
    sim.player.chex = { at: sim.now, bank: 'Chase' };
    const banks = ['us-chase', 'us-bank-of-america', 'us-wells-fargo', 'us-citi', 'us-capital-one'].map((id) => bankById(id)).filter((b) => b !== undefined);
    return banks.map((b, n) => (n >= bank && declines(sim, sim.player, b!) ? '1' : '0')).join('');
  },
});

defineDecider<{ sim: Simulation; week: number }, string>({
  id: 'health.illness',
  decides: 'What a week brings to a body: the flu in its season, a doctor’s visit, an emergency, a stay in hospital.',
  drawnIn: 'src/engine/systems/health.ts',
  reads: {
    // The week: in the flu season or out of it.
    week: (o, t) => ({ ...o, week: Math.round(t * 104) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), week: seed % 104 }),
  decide: ({ sim, week }) => Array.from({ length: 52 }, (_, n) => illnessWeek(sim, sim.player, sim.now + (week + n) * 7 * MS_DAY).map((e) => e.what).join('+') || '-').join(' '),
});

defineDecider<{ sim: Simulation }, string>({
  id: 'health.chronic',
  decides: 'The conditions a person carries from the start, depression, asthma, high blood pressure, diabetes (and whether type 1) or arthritis, and whether they wear lenses; and an asthmatic’s or an arthritic’s month’s visit.',
  drawnIn: 'src/engine/systems/health.ts',
  reads: {
    // Two saves are two bodies.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 40)) }),
  },
  sample: (seed) => ({ sim: atYale(seed) }),
  decide: ({ sim }) => {
    const h = sim.player.health!;
    return `${Object.keys(h.chronic ?? {}).sort().join('+') || 'none'}${h.lenses ? ', lenses' : ''}`;
  },
});

defineDecider<{ sim: Simulation }, string>({
  id: 'body.draw',
  decides: 'A body where creation set none: its height and body mass index from the birth country’s adult averages and spread.',
  drawnIn: 'src/engine/systems/body.ts',
  reads: {
    // Two saves are two bodies.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 40)) }),
  },
  sample: (seed) => ({ sim: atYale(seed) }),
  decide: ({ sim }) => {
    delete sim.player.body;
    const b = bodyOf(sim, sim.player);
    return `${b.heightCm.toFixed(0)}/${b.weightKg.toFixed(0)}`;
  },
});

defineDecider<{ sim: Simulation; bmi: number; age: number }, string>({
  id: 'health.onset',
  decides: 'Whether a condition begins in a month (diabetes, high blood pressure, arthritis), by age and weight.',
  drawnIn: 'src/engine/systems/health.ts',
  reads: {
    // A heavier body, and an older one, meet more of them.
    bmi: (o, t) => ({ ...o, bmi: 18 + t * 24 }),
    age: (o, t) => ({ ...o, age: 20 + t * 50 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), bmi: 20 + (seed % 20), age: 25 + (seed % 40) }),
  decide: ({ sim, bmi, age }) => {
    const person = sim.player;
    person.birthInstant = sim.now - age * 365.2425 * 86_400_000;
    person.body = { heightCm: 170, weightKg: bmi * 1.7 ** 2, habitKcal: 2_000, intake: 0, extra: 0 };
    const h = person.health!;
    h.drawn = true;
    const found: string[] = [];
    for (let m = 0; m < 240; m += 1) {
      h.chronic = {};
      const c = onsetMonth(sim, person, sim.now + m * 30.4375 * 86_400_000);
      if (c) found.push(`${m}${c[0]}`);
    }
    return found.join(',') || 'none';
  },
});

defineDecider<{ sim: Simulation; source: 'run' | 'stage' | 'fall'; key: number }, string>({
  id: 'health.injury',
  decides: 'Whether an hour of a thing, a day of work or a day of everyday life brings an injury, which one, and how long it takes to mend.',
  drawnIn: 'src/engine/systems/injury.ts',
  reads: {
    // What they were doing.
    source: (o, t) => ({ ...o, source: (['run', 'stage', 'fall'] as const)[Math.min(2, Math.floor(t * 3))]! }),
    // Each hour is its own draw.
    key: (o, t) => ({ ...o, key: Math.round(t * 1000) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), source: (['run', 'stage', 'fall'] as const)[seed % 3]!, key: seed * 13 }),
  decide: ({ sim, source, key }) => Array.from({ length: 40 }, (_, n) => {
    delete sim.player.health!.injury;
    const hurt = mayHurt(sim, sim.player, source, 0.5, sim.now + (key + n) * 3_600_000);
    return hurt ? `${hurt.kind[0]}${Math.round((hurt.until - hurt.at) / 86_400_000)}` : '-';
  }).join(''),
});

// ---------------------------------------------------------------------------
// The school's coursework and classmates, and the papers' appointments and therapy, as they stood on 2026-10-09
// ---------------------------------------------------------------------------

defineDecider<{ sim: Simulation; visit: number }, string>({
  id: 'health.referral',
  decides: 'A doctor’s visit kept ending in a referral to a specialist or not, at the place’s share of visits referred (REFERRAL_SHARE); swept at even odds.',
  drawnIn: 'src/engine/systems/appointments.ts',
  reads: {
    visit: (o, t) => ({ ...o, visit: Math.round(t * 400) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), visit: seed }),
  decide: ({ sim, visit }) => (mayRefer(sim, sim.player, { id: `v${visit}`, at: sim.now, what: 'A checkup' }, 0.5) ? 'referred' : 'not'),
});

defineDecider<{ sim: Simulation; day: number }, string>({
  id: 'school.coursework',
  decides: 'A course’s work when it’s set: which scene not yet worked, which part is yours, and which classmate partners you; and a showing’s luck, a little either side.',
  drawnIn: 'src/engine/systems/coursework.ts',
  reads: {
    // The day it’s set: each meeting draws its own.
    day: (o, t) => ({ ...o, day: Math.round(t * 20) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), day: seed % 20 }),
  // Acting I set on a class day in September, each day drawn apart.
  decide: ({ sim, day }) => {
    const a = setWork(sim, sim.player, 'DRAM 103a/b', { year: 2026, month: 9, day: 1 + day });
    return a ? `${a.sceneId} ${a.role} ${a.partner}` : 'none';
  },
});

defineDecider<{ sim: Simulation; who: number }, string>({
  id: 'school.partner',
  decides: 'How reliable each classmate is as a partner, drawn once by their drive; and whether they come to a rehearsal agreed, at that reliability.',
  drawnIn: 'src/engine/systems/coursework.ts',
  reads: {
    who: (o, t) => ({ ...o, who: Math.round(t * 14) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), who: seed % 15 }),
  decide: ({ sim, who }) => reliabilityOf(sim, sim.player, who).toFixed(3),
});

defineDecider<{ sim: Simulation; key: number }, string>({
  id: 'health.appointment',
  decides: 'How long a doctor’s appointment is waited for where a wait is a published distribution: England’s band and day within it, or whether a Canadian is seen the next day (`content/appointments.ts`).',
  drawnIn: 'src/engine/systems/appointments.ts',
  reads: {
    // Each booking its own draw.
    key: (o, t) => ({ ...o, key: Math.round(t * 1_000) }),
    world: (o, t) => ({ ...o, sim: quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', wealth: 'modest' }, `appt-${Math.round(t * 20)}`) }),
  },
  sample: (seed) => ({ sim: quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', wealth: 'modest' }, `appt-${seed}`), key: seed }),
  decide: ({ sim, key }) => Array.from({ length: 40 }, (_, n) => waitDays(sim, sim.player, `k${key}-${n}`)).join(' '),
});

defineDecider<{ sim: Simulation; at: number; nhs: number }, string>({
  id: 'health.therapy',
  decides: 'A course of CBT lifting depression or not, at NHS Talking Therapies’ 48.5% recovery or a private course’s 36% remission (THERAPY.recovery); swept at even odds.',
  drawnIn: 'src/engine/systems/therapy.ts',
  reads: {
    at: (o, t) => ({ ...o, at: Math.round(t * 400) }),
    nhs: (o, t) => ({ ...o, nhs: Math.round(t) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), at: seed, nhs: seed % 2 }),
  decide: ({ sim, at, nhs }) => String(Array.from({ length: 30 }, (_, n) => therapyLifts(sim, sim.player, nhs === 1, at * 30 + n)).filter(Boolean).length),
});

defineDecider<{ sim: Simulation; who: number }, string>({
  id: 'school.classmates',
  decides: 'What each classmate cares about most, drawn once by their drive; whether a class day brings a moment, and which, among those the record makes possible.',
  drawnIn: 'src/engine/systems/classmates.ts',
  reads: {
    who: (o, t) => ({ ...o, who: Math.round(t * 14) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), who: seed % 15 }),
  decide: ({ sim, who }) => priorityOf(sim, sim.player, who),
});

// ---------------------------------------------------------------------------
// The agent (from 2026-10-21, the owner's brief 19, G4 and G6)
// ---------------------------------------------------------------------------

const BANDS_IN_ORDER = ['unready', 'working', 'strong', 'exceptional'] as const;

defineDecider<{ sim: Simulation; band: number; room: number; atBar: number; approach: number }, string>({
  id: 'pro.agent',
  decides: 'An agent’s office’s answer to an approach, a meeting or a request, a pass or no answer, and after a meeting an offer or a pass: from the factors at the bar and a draw against the year’s other actors whose chance rises with the work’s band and the room on the list.',
  drawnIn: 'src/engine/systems/proagent.ts',
  reads: {
    // The best band of the work his office has to go on.
    band: (o, t) => ({ ...o, band: Math.round(t * 3) }),
    // The room on his list this year, short of the bar to beyond it.
    room: (o, t) => ({ ...o, room: Math.round(t * 3) }),
    // How many of the seven factors are at the bar or beyond.
    atBar: (o, t) => ({ ...o, atBar: Math.round(t * 7) }),
    // Which approach: each draws its own.
    approach: (o, t) => ({ ...o, approach: 1 + Math.round(t * 40) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), band: 1 + (seed % 3), room: 1 + (seed % 3), atBar: 4 + (seed % 4), approach: 1 + seed }),
  decide: ({ sim, band, room, atBar, approach }) => {
    const b = BANDS_IN_ORDER[band]!;
    const interest = { factors: [], atOrBeyond: atBar, needed: GATE, gate: atBar >= GATE, band: b, ...chancesFor(b, LEVELS[room]!) };
    const agent = AGENTS[0]!;
    return Array.from({ length: 30 }, (_, n) => `${replyOutcome(interest, drawOf(sim, sim.player, agent, approach + n, 'interest'), { requestable: [] })[0]}${offerOutcome(interest, drawOf(sim, sim.player, agent, approach + n, 'offer'))[0]}`).join(' ');
  },
});

defineDecider<{ sim: Simulation; year: number }, string>({
  id: 'pro.roster',
  decides: 'How many new actors an agent’s list has room for in a year, one to three, and of which billing and playing ages: the game’s assumption, drawn for each year.',
  drawnIn: 'src/engine/systems/proagent.ts',
  reads: {
    year: (o, t) => ({ ...o, year: 2026 + Math.round(t * 12) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), year: 2026 + (seed % 6) }),
  decide: ({ sim, year }) => JSON.stringify(rosterFor(sim, AGENTS[0]!, year)),
});

// ---------------------------------------------------------------------------
// Professional work (from 2026-10-21, brief 19's J1 and J5, `systems/projobs.ts`)
// ---------------------------------------------------------------------------

/**
 * TEST SETUP for the sweep: an agreement signed a day before and running a year, or none (`activeAgreement` reads it).
 * With the agent in the data: until 2026-10-21 it named 'jordan-parente', which the fictional agent's swap that day left
 * naming nobody, so no project was in its department's scope and `represented` was swept to no effect (the suite found it).
 */
function represent(sim: Simulation, on: boolean): void {
  const pro = sim.player.pro!;
  pro.agreements = on ? [{ id: 'sweep-agreement', agentId: AGENTS[0]!.id, offeredAt: sim.now - 2 * MS_DAY, standsUntil: sim.now, status: 'accepted', terms: [], signedAt: sim.now - MS_DAY, endsAt: sim.now + 400 * MS_DAY }] : [];
}

defineDecider<{ sim: Simulation; week: number; represented: number; title: number }, string>({
  id: 'pro.posting',
  decides: 'Which fictional projects post a role to the actor in a week, openly or through an agent, each at its chance (POSTING), and only parts written for the actor or for either.',
  drawnIn: 'src/engine/systems/projobs.ts',
  reads: {
    // Which weeks: each Monday draws its own.
    week: (o, t) => ({ ...o, week: Math.round(t * 50) }),
    // Represented or not: an agent's breakdowns bring roles open postings never do.
    represented: (o, t) => ({ ...o, represented: Math.round(t) }),
    // An actor or an actress (from 2026-10-21, the owner's word): only a part written for them or for either is posted.
    title: (o, t) => ({ ...o, title: Math.round(t) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), week: seed * 3, represented: seed % 2, title: (seed >> 1) % 2 }),
  decide: ({ sim, week, represented, title }) => {
    represent(sim, represented === 1);
    sim.player.performerTitle = title === 1 ? 'actress' : 'actor';
    return Array.from({ length: 12 }, (_, n) => postingsAt(sim, sim.player, sim.now + (week + n) * 7 * MS_DAY).map((x) => `${x.project.id}:${x.via}`).join('+') || '-').join(' ');
  },
});

defineDecider<{ sim: Simulation; week: number }, string>({
  id: 'pro.slate',
  decides: 'What work the world makes (brief 27, Area B): each market\u2019s productions of each kind in a week at its rate for the time of year, each one\u2019s parts, place, schedule and fate, and each year\u2019s new series.',
  drawnIn: 'src/engine/systems/slate.ts',
  reads: {
    // Which week: each Monday makes its own work, and the time of year moves each kind's rate.
    week: (o, t) => ({ ...o, week: Math.round(t * 50) }),
    // Which world: the save's seed makes its own slate.
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), week: seed * 3 }),
  decide: ({ sim, week }) => {
    const at = sim.now + week * 7 * MS_DAY;
    const made = productionsOf(sim, at).map((p) => `${p.kind}:${p.parts.length}:${p.parts[0]!.slate!.fate.kind}`).join('+') || '-';
    return `${made} | ${seriesOfYear(sim, 2027).map((s) => s.id.split('.').slice(3).join('.')).join(',')}`;
  },
});

defineDecider<{ sim: Simulation; represented: number; credits: number; skill: number }, string>({
  id: 'pro.slate_reach',
  decides: 'Which of the slate\u2019s parts reach the actor in a week (SLATE_REACH): an agent\u2019s breakdown or an open posting, the part\u2019s fit, the playing age, the actor\u2019s credits, the companies they\u2019ve worked for, where they live and when they\u2019re booked.',
  drawnIn: 'src/engine/systems/projobs.ts',
  reads: {
    // Represented or not: an agent's breakdowns reach a client more often than open postings reach anyone.
    represented: (o, t) => ({ ...o, represented: Math.round(t) }),
    // Professional credits: a lead in screen work comes to an actor with three or more.
    credits: (o, t) => ({ ...o, credits: Math.round(t * 4) }),
    // Craft: an agent puts up a client the part fits.
    skill: (o, t) => ({ ...o, skill: t }),
  },
  sample: (seed) => ({ sim: atYale(seed), represented: seed % 2, credits: seed % 5, skill: (seed % 7) / 6 }),
  decide: ({ sim, represented, credits, skill }) => {
    represent(sim, represented === 1);
    const p = sim.player;
    p.pro!.credits = Array.from({ length: credits }, (_, i) => ({ id: `c${i}`, kind: 'screen' as const, project: `Credit ${i}`, role: 'A Part', company: `Company ${i}`, year: 2026, medium: 'film' as const, status: 'released' as const, at: sim.now }));
    for (const k of Object.keys(p.craft ?? {}) as (keyof NonNullable<typeof p.craft>)[]) p.craft![k] = Math.round(skill * 100);
    const out: string[] = [];
    for (let n = 0; n < 16; n += 1) {
      const at = sim.now + n * 7 * MS_DAY;
      out.push(slatePartsAt(sim, at).filter((t) => t.access.agent || t.access.open).map((t) => Math.round(slateReach(sim, p, t, represented === 1 && t.access.agent ? 'agent' : 'open', at) * 100)).join(','));
    }
    return out.join(' ');
  },
});

defineDecider<{ sim: Simulation; band: number; fit: number; kind: number }, string>({
  id: 'pro.casting',
  decides: 'Casting’s call on a round, a callback or the role: the chance from the band, the fit and the field (CASTING), and the draw for the field.',
  drawnIn: 'src/engine/systems/projobs.ts',
  reads: {
    // The audition's band: a stronger one raises the chance, never to certainty.
    band: (o, t) => ({ ...o, band: Math.round(t * 3) }),
    // The role's fit, 0 to 1.
    fit: (o, t) => ({ ...o, fit: t }),
    // The kind of work, and the field it draws.
    kind: (o, t) => ({ ...o, kind: Math.round(t * (PROJECTS.length - 1)) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), band: seed % 4, fit: (seed % 5) / 4, kind: seed % PROJECTS.length }),
  decide: ({ sim, band, fit, kind }) => {
    const b = (['unready', 'working', 'strong', 'exceptional'] as const)[band]!;
    // The chemistry read's and the screen test's cuts too, from 2026-10-24 (brief 27, Part 9).
    return (['callback', 'chemistry', 'test', 'final'] as const).map((round) => Array.from({ length: 40 }, (_, n) => (castingDraw(sim, { postedAt: sim.now + n * 7 * 86_400_000, projectId: PROJECTS[kind]!.id }, round, b, fit).yes ? '1' : '0')).join('')).join(' ');
  },
});

defineDecider<{ sim: Simulation; week: number }, string>({
  id: 'pro.direct',
  decides: 'A direct offer or a posting (DIRECT): a part from a casting office that cast the actor before, the work judged Strong or better, offered without an audition, drawn by its week and the part.',
  drawnIn: 'src/engine/systems/projobs.ts',
  reads: {
    // Which week: each Monday's parts draw their own.
    week: (o, t) => ({ ...o, week: Math.round(t * 50) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), week: seed * 3 }),
  decide: ({ sim, week }) => Array.from({ length: 24 }, (_, n) => (sim.rng('pro.direct', String(week), `part-${n}`).next() < DIRECT.chance ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; band: number; worked: number }, string>({
  id: 'pro.negotiate',
  decides: 'A production’s answer to an agent’s ask (NEGOTIATE): raised to what was asked or kept, its chance by the last round’s band, and more where its casting office cast the actor before.',
  drawnIn: 'src/engine/systems/projobs.ts',
  reads: {
    // The last round's band: a stronger one, a likelier yes.
    band: (o, t) => ({ ...o, band: Math.round(t * 3) }),
    // Worked for the casting office before.
    worked: (o, t) => ({ ...o, worked: Math.round(t) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), band: seed % 4, worked: (seed >> 2) % 2 }),
  decide: ({ sim, band, worked }) => {
    const b = (['unready', 'working', 'strong', 'exceptional'] as const)[band]!;
    const chance = Math.min(1, NEGOTIATE.yes[b] + (worked ? NEGOTIATE.worked : 0));
    return Array.from({ length: 40 }, (_, n) => (sim.rng('pro.negotiate', PROJECTS[n % PROJECTS.length]!.id, sim.now + n * 86_400_000).next() < chance ? '1' : '0')).join('');
  },
});

defineDecider<{ sim: Simulation; band: number }, string>({
  id: 'pro.hold',
  decides: 'A production’s answer when asked to decide on a part it holds, against another offer on the same days (HOLD): booked with an offer or the hold let go, its chance by the last round’s band.',
  drawnIn: 'src/engine/systems/projobs.ts',
  reads: {
    // The last round's band: a stronger one, a likelier booking.
    band: (o, t) => ({ ...o, band: Math.round(t * 3) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), band: seed % 4 }),
  decide: ({ sim, band }) => {
    const chance = HOLD.book[(['unready', 'working', 'strong', 'exceptional'] as const)[band]!];
    return Array.from({ length: 40 }, (_, n) => (sim.rng('pro.hold', PROJECTS[n % PROJECTS.length]!.id, sim.now + n * 86_400_000).next() < chance ? '1' : '0')).join('');
  },
});

// ---------------------------------------------------------------------------------------------------------------------
// A series' seasons and what a contract brings (from 2026-10-24, brief 25's Module 4, `systems/series.ts`,
// `systems/contracts.ts`)
// ---------------------------------------------------------------------------------------------------------------------

/** TEST SETUP for the sweep: an engagement judged at a band on its one day worked, or with none worked. */
const judged = (id: string, band: number): Engagement => ({
  id, opportunityId: `o-${id}`, projectId: 'calloway-files-whitlock', role: 'Assistant DA Whitlock', status: 'working', days: [], pay: [], history: [], counts: {},
  log: band < 0 ? [] : [{ day: 0, at: 0, status: 'worked', band: (['unready', 'working', 'strong', 'exceptional'] as const)[band]! }],
});

defineDecider<{ sim: Simulation; year: number; renew: number }, string>({
  id: 'pro.series',
  decides: 'The network’s word on a series each year after its order runs out: another season, no more, or a canceled one back, by the series and the year, at its chance moved by the last season’s audience and reviews (renewChance).',
  drawnIn: 'src/engine/systems/series.ts',
  reads: {
    // How far on: each May adds its own word.
    year: (o, t) => ({ ...o, year: 2030 + Math.round(t * 15) }),
    // The network's chance of another season.
    renew: (o, t) => ({ ...o, renew: t }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), year: 2034 + (seed % 6), renew: SERIES[0]!.chance.renew }),
  decide: ({ sim, year, renew }) => decisionsTo(sim, { ...SERIES[0]!, chance: { ...SERIES[0]!.chance, renew } }, year).map((d) => `${d.year}:${d.what}`).join(' '),
});

defineDecider<{ sim: Simulation; year: number; outlet: number; performance: number }, string>({
  id: 'pro.audience',
  decides: 'A season of a series’ audience and reviews, the game’s simulation (AUDIENCE): its first season within its outlet’s range, each after moving from the last, the long-running fading, critics’ score, and from 2026-10-25 the player’s judged part in it (FORTUNE).',
  drawnIn: 'src/engine/systems/series.ts',
  reads: {
    // Which season: each moves from the last.
    year: (o, t) => ({ ...o, year: SERIES[0]!.firstSeason + Math.round(t * 15) }),
    // Broadcast in viewers or streaming in hours.
    outlet: (o, t) => ({ ...o, outlet: Math.round(t) }),
    // The player's part in the season, its size times its band, from unready to a lead's exceptional work.
    performance: (o, t) => ({ ...o, performance: t * 2 - 1 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), year: SERIES[0]!.firstSeason + (seed % 12), outlet: seed % 2, performance: 0 }),
  decide: ({ sim, year, outlet, performance }) => { const a = seasonAudienceWith(sim, { ...SERIES[0]!, outlet: outlet ? 'streaming' : 'broadcast' }, year, performance)!; return `${a.unit} ${a.average} ${a.critics}`; },
});

defineDecider<{ sim: Simulation; band: number }, string>({
  id: 'pro.episode',
  decides: 'A recurring part called for a further episode or not: its chance by the best the work was judged at, and a draw by the engagement and the episode.',
  drawnIn: 'src/engine/systems/series.ts',
  reads: {
    // The best band so far, or none worked: a part that plays well is written for again.
    band: (o, t) => ({ ...o, band: Math.round(t * 4) - 1 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), band: (seed % 5) - 1 }),
  decide: ({ sim, band }) => Array.from({ length: 40 }, (_, n) => (episodeDrawn(sim, judged(`e${n}`, band), 5 + (n % 8)) ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; band: number }, string>({
  id: 'pro.option',
  decides: 'An option on a recurring part for the next season, taken up or let go: its chance by the best the work was judged at, and a draw by the engagement.',
  drawnIn: 'src/engine/systems/series.ts',
  reads: {
    band: (o, t) => ({ ...o, band: Math.round(t * 4) - 1 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), band: (seed % 5) - 1 }),
  decide: ({ sim, band }) => Array.from({ length: 40 }, (_, n) => (optionDrawn(sim, judged(`e${n}`, band)) ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'pro.rerun',
  decides: 'A network rerun of an episode with the player’s work in it, which pays a residual: half the time, by the engagement.',
  drawnIn: 'src/engine/systems/contracts.ts',
  reads: {
    // Which engagements: each its own draw.
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 40 }, (_, n) => (rerunDrawn(sim, `e${first + n}`) ? '1' : '0')).join(''),
});

// The workflows' draws (from 2026-10-24, brief 25's Module 5, `systems/workflow.ts`), each keyed by the work, its project
// and its first day, never the engagement's id.

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'pro.board',
  decides: 'A booked part’s scenes, their places in the script and the order each day shoots them, by the work.',
  drawnIn: 'src/engine/systems/workflow.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => {
    const t = PROJECTS.find((p) => p.id === 'gull-season')!;
    const e = { id: 'e', projectId: t.id, days: Array.from({ length: 6 }, (_, k) => ({ from: (first + k) * 86_400_000, to: (first + k) * 86_400_000 + 3_600_000, label: `${t.project}: Shoot Day ${k + 1}` })) } as unknown as Engagement;
    planWork(sim, e, t);
    return (e.units ?? []).map((u) => `${u.day}:${u.scene}`).join(',');
  },
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'pro.stress',
  decides: 'Screamed lines in a booth’s or a dub’s session: in about a third of them, on one unit, announced three times in four.',
  drawnIn: 'src/engine/systems/workflow.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 40 }, (_, n) => { const d = stressDrawn(sim, `w${first + n}`, 0, 4); return d ? `${d.unit}${d.announced ? 'a' : 'u'}` : '-'; }).join(','),
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'pro.pages',
  decides: 'Revised pages for a work day, at its format’s chance, and the share of the lines they change.',
  drawnIn: 'src/engine/systems/workflow.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 40 }, (_, n) => pagesDrawn(sim, `w${first + n}`, 0, 0.35) ?? '-').join(','),
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'pro.loop',
  decides: 'A recall to loop after a screen wrap, about a third of the time, and the days on it’s asked for.',
  drawnIn: 'src/engine/systems/workflow.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 40 }, (_, n) => loopDrawn(sim, `w${first + n}`) ?? '-').join(','),
});

defineDecider<{ sim: Simulation; first: number; after: number }, string>({
  id: 'pro.release',
  decides: 'A slate production’s way out after the wrap (RELEASE_FATE): on time, held back months, sent to streaming instead of cinemas, or shelved, and from 2026-10-25 a limited release, another distributor’s later date or a film abroad first (routeOf), by the way its format comes out.',
  drawnIn: 'src/engine/systems/projobs.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    // The way its format comes out: a film for cinemas, a streamed series, a broadcast.
    after: (o, t) => ({ ...o, after: Math.round(t * 2) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7, after: seed % 3 }),
  decide: ({ sim, first, after }) => {
    const format = (['independent-feature', 'serialized-drama', 'procedural'] as const)[after]!;
    const base = PROJECTS.find((p) => p.format === format)!;
    return Array.from({ length: 40 }, (_, n) => { const f = releaseFate(sim, { ...base, slate: { ...(base.slate ?? {}), production: `p${first + n}` } } as never); return f.kind === 'late' ? `late${f.days}` : f.kind; }).join(',');
  },
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'pro.reshoot',
  decides: 'A feature’s reshoot day or a voice part’s pickup session after the wrap, two times in ten, and the days on it’s asked for.',
  drawnIn: 'src/engine/systems/workflow.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 40 }, (_, n) => furtherDrawn(sim, `w${first + n}`) ?? '-').join(','),
});

defineDecider<{ sim: Simulation; first: number; size: 'lead' | 'supporting' }, string>({
  id: 'pro.promo',
  decides: 'A promotional film for a lead’s or a supporting part’s release, three times in four for a lead and about one in three for a supporting part, by the work.',
  drawnIn: 'src/engine/systems/workflow.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    size: (o, t) => ({ ...o, size: t < 0.5 ? 'lead' : 'supporting' }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7, size: seed % 2 ? 'lead' : 'supporting' }),
  decide: ({ sim, first, size }) => Array.from({ length: 40 }, (_, n) => (promoDrawn(sim, `w${first + n}`, size) ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; year: number; recurring: boolean }, string>({
  id: 'pro.revival',
  decides: 'Whether a revived series’ producers bring back a character the player played: six times in ten for a recurring part and a quarter for one episode’s, less each year it was off past two.',
  drawnIn: 'src/engine/systems/series.ts',
  reads: {
    year: (o, t) => ({ ...o, year: 2030 + Math.round(t * 10) }),
    recurring: (o, t) => ({ ...o, recurring: t < 0.5 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), year: 2030 + (seed % 10), recurring: seed % 2 === 0 }),
  decide: ({ sim, year, recurring }) => {
    const base = PROJECTS.find((p) => p.series && (p.schedule.kind === 'episodes') === recurring)!;
    const s = seriesById(base.series!)!;
    return Array.from({ length: 40 }, (_, n) => (revivalReturns(sim, { ...s, id: `${s.id}-${n}` }, year, base) ? '1' : '0')).join('');
  },
});

defineDecider<{ sim: Simulation; year: number }, string>({
  id: 'actor.entry',
  decides: 'Whether a production submits for the Actor Awards a performance the player didn’t: half the time for Strong work or better, a tenth otherwise.',
  drawnIn: 'src/engine/systems/actorawards.ts',
  reads: { year: (o, t) => ({ ...o, year: 2026 + Math.round(t * 6) }), world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }) },
  sample: (seed) => ({ sim: atYale(seed), year: 2026 + (seed % 6) }),
  decide: ({ sim, year }) => Array.from({ length: 40 }, (_, n) => `${actorProductionSubmits(sim, year, `p${n}`, 'r', n % 2 === 0) ? 1 : 0}`).join(''),
});

defineDecider<{ sim: Simulation; year: number }, string>({
  id: 'actor.field',
  decides: 'An Actor Awards category’s anonymous field in a year: how many performances are submitted, and the votes each draws from the nominating committee.',
  drawnIn: 'src/engine/systems/actorawards.ts',
  reads: { year: (o, t) => ({ ...o, year: 2026 + Math.round(t * 6) }), world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }) },
  sample: (seed) => ({ sim: atYale(seed), year: 2026 + (seed % 6) }),
  decide: ({ sim, year }) => { const f = actorFieldDrawn(sim, year, 'tv-drama'); return `${f.submissions}:${f.others.slice(0, 8).map((o) => o.votes).join(',')}`; },
});

defineDecider<{ sim: Simulation; year: number }, string>({
  id: 'actor.final',
  decides: 'The Actor Awards’ final round in a category: each nominee’s votes from the nominations with the round’s own draw, the most winning and a tie giving the award to each tied.',
  drawnIn: 'src/engine/systems/actorawards.ts',
  reads: { year: (o, t) => ({ ...o, year: 2026 + Math.round(t * 6) }), world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }) },
  sample: (seed) => ({ sim: atYale(seed), year: 2026 + (seed % 6) }),
  decide: ({ sim, year }) => actorWinners(sim, year, 'film-lead', ['a', 'b', 'c', 'd', 'e'], { a: 700, b: 690, c: 650, d: 600, e: 560 }).join(','),
});

defineDecider<{ sim: Simulation; year: number }, string>({
  id: 'ceremony.speech',
  decides: 'An acceptance speech’s judgment: the remarks’ preparation, the actor’s composure and presence, and its own draw.',
  drawnIn: 'src/engine/systems/ceremony.ts',
  reads: { year: (o, t) => ({ ...o, year: 2026 + Math.round(t * 6) }), world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }) },
  sample: (seed) => ({ sim: atYale(seed), year: 2026 + (seed % 6) }),
  decide: ({ sim, year }) => Array.from({ length: 20 }, (_, n) => speechOf(sim, sim.player, { institution: 'actor-awards', year, creditId: `c${n}`, attend: { rsvp: 'attending', at: 0, prepared: n / 20 } } as never).band[0]).join(''),
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'pro.cut',
  decides: 'A scene of the player’s cut in the edit at the release, two times in ten, by the work.',
  drawnIn: 'src/engine/systems/workflow.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 40 }, (_, n) => (cutDrawn(sim, `w${first + n}`) ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'pro.late_pay',
  decides: 'How many days late a non-union producer pays a payment, none seven times in ten, by the payment.',
  drawnIn: 'src/engine/systems/contracts.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 40 }, (_, n) => lateDays(sim, `e${first + n}:1`)).join(','),
});

// The charts' and the awards' draws (from 2026-10-24, brief 25's Module 6, `systems/charts.ts` and `systems/awards.ts`),
// each keyed by the film, the year or the category, never an id.

defineDecider<{ sim: Simulation; first: number; performance: number }, string>({
  id: 'charts.gross',
  decides: 'A film’s run in the game’s own weekly chart: its opening, how it falls each week, its rank among the game’s own unnamed releases, its takings abroad, and from 2026-10-25 the player’s part lifting its opening (FORTUNE).',
  drawnIn: 'src/engine/systems/charts.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    // The player's part in it, its size times its band, from unready to a lead's exceptional work.
    performance: (o, t) => ({ ...o, performance: t * 2 - 1 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7, performance: 0 }),
  decide: ({ sim, first, performance }) => Array.from({ length: 12 }, (_, n) => { const run = simulateRun(sim, `film-${first + n}`, 'low-budget', (first + n) * 7 * 86_400_000, { lift: FORTUNE.gross * performance }); return run ? `${run.weeks[0]!.gross}:${run.weeks.length}:${run.weeks[0]!.rank}:${run.weeks[0]!.international}` : '-'; }).join(','),
});

// The series, releases and market cluster's draws (from 2026-10-25, the owner's brief 27, Parts 8, 12 and 13; `systems/
// market.ts`, `systems/continuity.ts`), each keyed by the production, the engagement or the series and the year.

defineDecider<{ sim: Simulation; first: number; performance: number }, string>({
  id: 'pro.quality',
  decides: 'A production’s own quality, and the critics’ and audience’s response to a film it reads with the player’s part (FORTUNE), the game’s simulation.',
  drawnIn: 'src/engine/systems/market.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    performance: (o, t) => ({ ...o, performance: t * 2 - 1 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7, performance: 0 }),
  decide: ({ sim, first, performance }) => Array.from({ length: 12 }, (_, n) => { const r = responseOf(sim, { project: `p${first + n}` }, performance); return `${r.critics}:${r.audience}`; }).join(','),
});

defineDecider<{ sim: Simulation; first: number; performance: number }, string>({
  id: 'pro.pilot',
  decides: 'A pilot’s network word: picked up to series or passed on, at a chance its own quality and the player’s part in it move (PILOT).',
  drawnIn: 'src/engine/systems/continuity.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    performance: (o, t) => ({ ...o, performance: t * 2 - 1 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7, performance: 0 }),
  decide: ({ sim, first, performance }) => Array.from({ length: 40 }, (_, n) => (pilotPicked(sim, { project: `pilot-${first + n}` } as never, performance) ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; band: number }, string>({
  id: 'pro.recurring',
  decides: 'A guest part brought back as a recurring character, six weeks before a season ordered or renewed: its chance by the best the work was judged at, none for working work (INVITE).',
  drawnIn: 'src/engine/systems/continuity.ts',
  reads: {
    band: (o, t) => ({ ...o, band: Math.round(t * 4) - 1 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), band: (seed % 5) - 1 }),
  decide: ({ sim, band }) => Array.from({ length: 40 }, (_, n) => (invitedBack(sim, judged(`e${n}`, band), 2031) ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; band: number; ratio: number }, string>({
  id: 'pro.grow',
  decides: 'A recurring part grown at its option, more episodes and more pay: its chance by the best the work was judged at and the season’s audience against its bar (GROW).',
  drawnIn: 'src/engine/systems/continuity.ts',
  reads: {
    band: (o, t) => ({ ...o, band: Math.round(t * 4) - 1 }),
    // The last season's audience against its outlet's bar, from half to twice.
    ratio: (o, t) => ({ ...o, ratio: 0.5 + t * 1.5 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), band: (seed % 5) - 1, ratio: 1 }),
  decide: ({ sim, band, ratio }) => Array.from({ length: 40 }, (_, n) => (grows(sim, judged(`e${n}`, band), 2031, ratio) ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; band: number }, string>({
  id: 'pro.option_release',
  decides: 'A production asked to release the actor from its option, against another offer: likelier the less it wanted the actor back (OPTION_RELEASE).',
  drawnIn: 'src/engine/systems/continuity.ts',
  reads: {
    band: (o, t) => ({ ...o, band: Math.round(t * 4) - 1 }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), band: (seed % 5) - 1 }),
  decide: ({ sim, band }) => Array.from({ length: 40 }, (_, n) => (releaseGranted(sim, judged(`e${n}`, band), `o${n}`) ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; year: number }, string>({
  id: 'pro.pickup',
  decides: 'A canceled series coming back on another network or streaming service, and that network’s name, the game’s invention (PICKUP).',
  drawnIn: 'src/engine/systems/series.ts',
  reads: {
    year: (o, t) => ({ ...o, year: 2030 + Math.round(t * 15) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), year: 2032 + (seed % 10) }),
  decide: ({ sim, year }) => Array.from({ length: 20 }, (_, n) => pickupOf(sim, { ...SERIES[0]!, id: `test-pickup-${n}` }, year) ?? '-').join(','),
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'awards.entry',
  decides: 'Whether a production enters a performance the player didn’t: half the time for strong work, a tenth otherwise.',
  drawnIn: 'src/engine/systems/awards.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 40 }, (_, n) => (productionEnters(sim, 2027 + (n % 3), `p${first + n}`, 'r', n % 2 === 0) ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'awards.field',
  decides: 'A category’s anonymous field for a year: how many entered, each entrant’s standing, and so the nominations the rules give it.',
  drawnIn: 'src/engine/systems/awards.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 8 }, (_, n) => { const f = fieldDrawn(sim, 2027 + n, `c${first}`); return `${f.submissions}:${nominationsFor(f.submissions)}:${Math.max(...f.others.map((o) => o.votes))}`; }).join(','),
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'awards.final',
  decides: 'The final round’s peer vote: which nominee wins, each standing as the nominations left it, with the round’s own draw.',
  drawnIn: 'src/engine/systems/awards.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 20 }, (_, n) => finalDrawn(sim, 2027 + n, `c${first}`, ['you', 'a', 'b', 'c', 'd'], { you: 70, a: 68, b: 66, c: 64, d: 62 })).join(','),
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'festival.submit',
  decides: 'Whether a production submits its film to Sundance, eight times in ten.',
  drawnIn: 'src/engine/systems/awards.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 40 }, (_, n) => (festivalSubmits(sim, 2027 + (n % 3), `p${first + n}`) ? '1' : '0')).join(''),
});

defineDecider<{ sim: Simulation; first: number }, string>({
  id: 'festival.select',
  decides: 'Whether Sundance selects a submitted film, at a chance its band sets, from a field the game doesn’t name.',
  drawnIn: 'src/engine/systems/awards.ts',
  reads: {
    first: (o, t) => ({ ...o, first: Math.round(t * 100) }),
    world: (o, t) => ({ ...o, sim: atYale(Math.round(t * 20)) }),
  },
  sample: (seed) => ({ sim: atYale(seed), first: seed * 7 }),
  decide: ({ sim, first }) => Array.from({ length: 60 }, (_, n) => (festivalSelects(sim, 2027, 'us-short', `p${first + n}`, 'exceptional') ? '1' : '0')).join(''),
});
