/**
 * Monte Carlo: play many randomized lives and see what breaks.
 *
 * Each life starts from a random place in the game's own space — a child, a
 * teenager, an adult or somebody in later life; broke or comfortable; on a
 * couch or in a house of their own; in one of eight cities on five
 * continents — and then does what a player might: asks the game for things
 * in its own words, plays out the scenes that open, takes or dismisses the
 * decisions that come up, and lets time pass in uneven slices. After every
 * step the world is checked against invariants that must hold no matter
 * what: the books balance, no number is NaN, the clock never runs backwards,
 * the save survives a round trip, and nobody who is dead keeps acting.
 *
 * A refusal is not a bug. "You cannot cover that" is the game working. A bug
 * is an exception inside a handler (execute wraps those with the command's
 * name and "failed:"), a scheduled event that could not be processed, an
 * invariant that broke, or anything that escaped to this harness at all.
 *
 * Every life is seeded, so any bug this finds reproduces from its seed.
 *
 *   npx vite-node tools/monte-carlo.mjs --lives 12 --days 90 --seed slate-mc
 *   npx vite-node tools/monte-carlo.mjs --only 7 --seed slate-mc --verbose
 */

import { writeFileSync } from 'node:fs';
import { quickSave, loadSave } from '../src/engine/index.ts';
import { serialise, deserialise } from '../src/engine/persistence/adapter.ts';
import { resolveAsk, planFor, everythingAskable } from '../src/engine/systems/ask.ts';
import { activeScene, sceneView } from '../src/engine/systems/scenes.ts';
import { openDecisions } from '../src/engine/world/world.ts';
import { isAlive, ageOf } from '../src/engine/systems/lifespan.ts';
import { HERITAGES } from '../src/engine/content/heritage.ts';
import { placesIn, menuOf } from '../src/engine/content/places.ts';
import { openingsFor, jobOf } from '../src/engine/systems/work.ts';
import { MARTIAL_ARTS, classesAt, DOINGS } from '../src/engine/content/theweek.ts';
import { CLUBS } from '../src/engine/content/schooling.ts';
import { testsOpenTo } from '../src/engine/systems/exams.ts';
import { ACTIVITIES } from '../src/engine/systems/life.ts';
import { CATALOG, RECIPES, RETAILERS } from '../src/engine/content/catalog.ts';
import { EXERCISES, CLASSES } from '../src/engine/content/fitness.ts';
import { relationshipsOf } from '../src/engine/systems/relationships.ts';
import { DATE_ACTIVITIES } from '../src/engine/content/dates.ts';
import { UNIVERSITIES, majorsAt } from '../src/engine/content/universities.ts';
import { applicationsOf } from '../src/engine/systems/university.ts';
import { BANK_PRODUCTS } from '../src/engine/content/banking.ts';
import { retailerAt, stockAt } from '../src/engine/systems/retail.ts';
import { salonsIn, pharmaciesIn, shelfAt } from '../src/engine/systems/errands.ts';
import { SALON_SERVICES } from '../src/engine/content/errands.ts';
import { cinemasIn, programmeIn, showtimesFor, ticketsOf } from '../src/engine/systems/cinema.ts';
import { venuesIn, eventsAt } from '../src/engine/systems/going.ts';
import { dealershipsIn } from '../src/engine/systems/dealership.ts';
import { plansOf } from '../src/engine/systems/plans.ts';

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true] : []))
    .filter((pair) => pair.length),
);
const LIVES = Number(args.lives ?? 8);
const DAYS = Number(args.days ?? 60);
const SEED = String(args.seed ?? 'slate-mc');
const ONLY = args.only !== undefined ? Number(args.only) : undefined;
const VERBOSE = Boolean(args.verbose);
const OUT = typeof args.out === 'string' ? args.out : undefined;

// ---------------------------------------------------------------------------
// A small seeded generator, so a life replays from its seed
// ---------------------------------------------------------------------------

function hash(text) {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function rngFrom(seed) {
  let a = hash(seed);
  return {
    next() { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; },
    int(lo, hi) { return lo + Math.floor(this.next() * (hi - lo + 1)); },
    pick(list) { return list[this.int(0, list.length - 1)]; },
    chance(p) { return this.next() < p; },
  };
}

// ---------------------------------------------------------------------------
// Where a life can start
// ---------------------------------------------------------------------------

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const START_YEAR = 2026;
const STAGES = [
  { name: 'child', age: 8 }, { name: 'teen', age: 15 },
  { name: 'adult', age: 28 }, { name: 'later', age: 62 },
];
const WEALTH = ['nothing', 'scraping', 'modest', 'comfortable', 'wealthy', 'inherited'];
const HOUSING = ['couch', 'roommates', 'rental', 'owned'];
const CITIES = [
  'us-ca-losangeles', 'us-ny-brooklyn', 'uk-eng-london', 'fr-84-lyon',
  'jp-32-osaka', 'ng-32-ibadan', 'br-21-riodejaneiro', 'au-vic-melbourne', 'in-07-delhi',
];
const PRONOUNS = ['she/her', 'he/him', 'they/them'];

function randomConfig(rng) {
  const stage = rng.pick(STAGES);
  const heritage = rng.pick(HERITAGES);
  return {
    stage: stage.name,
    config: {
      firstName: rng.pick(heritage.given ?? ['Alex']),
      lastName: rng.pick(heritage.surnames ?? ['Rivera']),
      pronouns: rng.pick(PRONOUNS),
      birthYear: START_YEAR - stage.age, birthMonth: rng.int(1, 12), birthDay: rng.int(1, 28),
      heritageId: heritage.id, parentHeritageIds: [heritage.id, rng.pick(HERITAGES).id],
      homeRegionId: rng.pick(CITIES),
      startLocationId: rng.pick(CITIES),
      wealth: rng.pick(WEALTH),
      housing: rng.pick(HOUSING),
      startWithVehicle: rng.chance(0.5),
      startYear: START_YEAR, startMonth: rng.int(1, 12), startDay: rng.int(1, 28),
    },
  };
}

// ---------------------------------------------------------------------------
// Invariants: what must hold after every step
// ---------------------------------------------------------------------------

function findBadNumbers(value, path, out, seen) {
  if (out.length >= 5) return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) out.push(`${path} = ${value}`);
    return;
  }
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const [k, v] of Object.entries(value)) findBadNumbers(v, `${path}.${k}`, out, seen);
}

function checkInvariants(sim, lastNow) {
  const problems = [];
  for (const line of sim.ledger.audit()) problems.push(['ledger', line]);
  const bad = [];
  findBadNumbers(sim.universe, 'universe', bad, new Set());
  for (const line of bad) problems.push(['nan', line]);
  if (sim.now < lastNow) problems.push(['time', `clock went from ${lastNow} back to ${sim.now}`]);
  for (const acct of Object.values(sim.universe.accounts)) {
    if (!Number.isFinite(acct.balance)) problems.push(['money', `account ${acct.id} balance ${acct.balance}`]);
  }
  return problems;
}

/** The save goes out as text and comes back; the books must still balance and match. */
function roundTrip(sim) {
  const before = sim.ledger.recompute();
  const raw = serialise(sim.universe);
  const again = loadSave(deserialise(raw));
  const problems = again.ledger.audit().map((line) => ['roundtrip', line]);
  const after = again.ledger.recompute();
  for (const [id, total] of Object.entries(before)) {
    if (after[id] !== total) problems.push(['roundtrip', `account ${id} was ${total}, came back ${after[id]}`]);
  }
  if (again.now !== sim.now) problems.push(['roundtrip', `clock was ${sim.now}, came back ${again.now}`]);
  return { problems, bytes: raw.length };
}

/** A scheduled event whose handler threw leaves this notification behind. */
const FAILED_EVENT_TITLE = 'A Scheduled Event Could Not Be Processed';
function failedEvents(sim, seenIds) {
  const out = [];
  for (const n of sim.universe.notifications) {
    if (n.title !== FAILED_EVENT_TITLE || seenIds.has(n.id)) continue;
    seenIds.add(n.id);
    out.push(n.body);
  }
  return out;
}


// ---------------------------------------------------------------------------
// Actors: real commands with real payloads, built from the save as it stands
// ---------------------------------------------------------------------------
//
// The ask box reaches a dozen commands. The other three hundred need an id the
// game already knows — a place in this city, a listing, a relationship — so
// each actor reads the save and builds the payload the way a screen would.
// A step returns null when there is nothing valid to do (the actor stops, and
// that is not a refusal), undefined to skip itself, or a command. A refusal
// from the game stops the sequence unless the step is marked soft.

const PLATFORM_IDS = ['streamtube', 'pulse', 'lumen', 'chatter'];
const INTERACTIONS = ['chat', 'catch_up', 'deep_talk', 'favour', 'apologise', 'confront', 'work_together', 'celebrate', 'support'];
const SAYINGS = ['Long day.', 'Out and about.', 'Coffee first, then everything else.', 'A quiet one tonight.', 'Trying something new this week.', 'Back at it.'];
const TITLES = ['A Day In The Life', 'What I Actually Do All Week', 'Trying It For The First Time', 'The Morning Routine', 'Nothing Fancy'];

const cityOf = (sim) => sim.player.currentLocationId;
const placesHere = (sim, kinds) => placesIn(cityOf(sim)).filter((p) => !kinds || kinds.includes(p.kind));
const pickOf = (rng, list) => (list.length > 0 ? rng.pick(list) : null);
const myAccounts = (sim) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && a.status !== 'closed' && !a.closedAt);
const myVehicles = (sim) => Object.values(sim.universe.vehicles).filter((v) => v.ownerId === sim.player.id && !v.soldAt && !v.deliveryDueAt);
const myAssets = (sim) => Object.values(sim.universe.assets).filter((a) => a.ownerId === sim.player.id && !a.soldAt);
const myAccountsOn = (sim) => Object.values(sim.universe.socialAccounts).filter((a) => a.ownerId === sim.player.id);
const othersHere = (sim) => Object.values(sim.universe.people).filter((p) => !p.isPlayer && isAlive(p, sim.now) && p.currentLocationId === cityOf(sim));
const activeRels = (sim) => relationshipsOf(sim, sim.player.id).filter((r) => !r.endedAt);
const otherOf = (sim, rel) => (rel.aId === sim.player.id ? rel.bId : rel.aId);
const hoursOn = (sim, rng, lo, hi) => sim.now + rng.int(lo, hi) * HOUR;
const activeListings = (sim) => Object.values(sim.universe.propertyListings).filter((x) => x.status === 'active');
const carListings = (sim) => Object.values(sim.universe.vehicleListings).filter((x) => x.status === 'active');

const cmd = (kind, payload = {}) => ({ kind, payload });
const soft = (step) => Object.assign(step, { soft: true });
const somewhere = (kinds, also) => (sim, rng) => pickOf(rng, placesHere(sim, kinds).filter((p) => !also || also(p)));
/** Go to the place the picker chooses, remembering it for the steps after. */
const goTo = (pick) => (sim, rng, ctx) => {
  const place = pick(sim, rng, ctx);
  if (!place) return null;
  ctx.place = place;
  if (sim.player.currentPlaceId === place.id) return undefined;
  return cmd('go.to', { placeId: place.id });
};

const ACTORS = [
  // Getting about
  ['go.somewhere', goTo(somewhere())],
  ['go.home', () => cmd('go.to', { home: true })],
  ['place.visit', goTo(somewhere(['park', 'beach', 'viewpoint', 'museum', 'landmark', 'market'])), (sim, rng) => cmd('place.visit', { minutes: rng.int(20, 120) })],
  ['hotel', goTo(somewhere(['hotel'])), (sim, rng) => cmd('place.book_room', { nights: rng.int(1, 3) })],
  ['travel.book_trip', (sim, rng) => {
    const to = pickOf(rng, CITIES.filter((c) => c !== cityOf(sim)));
    return to ? cmd('travel.book_trip', { toCityId: to, departAt: sim.now + rng.int(2, 10) * DAY, nights: rng.int(2, 4), cabin: rng.pick(['economy', 'economy', 'business']), stay: { kind: 'hotel', roomClass: 'standard' } }) : null;
  }],
  // The body
  ['life.shower', () => cmd('life.shower')],
  ['life.sleep', (sim, rng) => cmd('life.sleep', { hours: rng.int(4, 9) })],
  ['life.eat', (sim, rng) => { const item = pickOf(rng, CATALOG.all().filter((i) => i.category === 'dining')); return item ? cmd('life.eat', { catalogId: item.id }) : null; }],
  ['life.do_activity', (sim, rng) => cmd('life.do_activity', { activityId: rng.pick(ACTIVITIES).id })],
  ['life.cook', (sim, rng) => { const r = pickOf(rng, RECIPES.all()); return r ? cmd('life.cook', { recipeId: r.id }) : null; }],
  // Work
  ['job.take', (sim, rng) => { const job = pickOf(rng, openingsFor(sim)); return job ? cmd('job.take', { kindId: job.id }) : null; }],
  ['job.shift', () => cmd('job.shift')],
  ['job.call_in_sick', () => cmd('job.call_in_sick')],
  ['job.quit', (sim, rng) => (jobOf(sim) && rng.chance(0.15) ? cmd('job.quit') : null)],
  // The week, and training
  ['week.start_training', (sim, rng) => cmd('week.start_training', { artId: rng.pick(MARTIAL_ARTS).id })],
  ['week.train', () => cmd('week.train')],
  ['week.grade', () => cmd('week.grade')],
  ['week.take_class', (sim, rng) => { const c = pickOf(rng, classesAt(ageOf(sim))); return c ? cmd('week.take_class', { classId: c.id }) : null; }],
  ['week.spend', (sim, rng) => cmd('week.spend', { doingId: rng.pick(DOINGS).id })],
  ['track.join', () => cmd('track.join')],
  ['track.train', () => cmd('track.train')],
  // School and growing up
  ['school.attend', (sim, rng) => cmd('school.attend', { effort: rng.pick(['coast', 'normal', 'hard']) })],
  ['school.skip', () => cmd('school.skip')],
  ['school.join_club', (sim, rng) => cmd('school.join_club', { clubId: rng.pick(CLUBS).id })],
  ['school.audition', () => cmd('school.audition')],
  ['growing.lesson', () => cmd('growing.lesson')],
  ['growing.test', () => cmd('growing.test')],
  ['exam.register', (sim, rng) => { const t = pickOf(rng, testsOpenTo(sim)); return t ? cmd('exam.register', { testId: t.id }) : null; }],
  ['exam.study', () => cmd('exam.study')],
  ['exam.sit', () => cmd('exam.sit')],
  ['edu.enroll', (sim, rng) => { const c = pickOf(rng, Object.values(sim.universe.courses).filter((x) => x.locationId === cityOf(sim))); return c ? cmd('edu.enroll', { courseId: c.id }) : null; }],
  ['uni.apply', (sim, rng) => { const u = rng.pick(UNIVERSITIES); const m = pickOf(rng, majorsAt(u)); return m ? cmd('uni.apply', { universityId: u.id, majorId: m.id }) : null; }],
  ['uni.accept', (sim, rng) => { const a = pickOf(rng, applicationsOf(sim).filter((x) => x.status === 'offer')); return a ? cmd('uni.accept', { applicationId: a.id }) : null; }],
  // Papers
  ['doc.apply_license', () => cmd('doc.apply_license')],
  ['doc.apply_passport', () => cmd('doc.apply_passport')],
  // The gym
  ['gym.buy_pass', goTo(somewhere(['gym'])), (sim, rng, ctx) => cmd('gym.buy_pass', { placeId: ctx.place.id, product: rng.pick(['day_pass', 'monthly', 'annual']) })],
  ['gym.workout', goTo(somewhere(['gym'])),
    (sim, rng, ctx) => cmd('gym.check_in', { placeId: ctx.place.id }),
    (sim, rng, ctx) => cmd('gym.train_block', { placeId: ctx.place.id, exerciseId: rng.pick(EXERCISES).id, sets: rng.int(2, 4), intensity: rng.pick(['easy', 'steady', 'hard']) }),
    soft((sim, rng, ctx) => cmd('gym.train_block', { placeId: ctx.place.id, exerciseId: rng.pick(EXERCISES).id, sets: 3, intensity: 'steady' })),
    (sim, rng, ctx) => cmd('gym.finish_workout', { placeId: ctx.place.id })],
  ['gym.take_class', goTo(somewhere(['gym'])),
    soft((sim, rng, ctx) => cmd('gym.check_in', { placeId: ctx.place.id })),
    (sim, rng, ctx) => cmd('gym.take_class', { placeId: ctx.place.id, classId: rng.pick(CLASSES).id })],
  // The phone
  ['feed.create_profile', (sim, rng) => cmd('feed.create_profile', { platform: rng.pick(PLATFORM_IDS) })],
  ['feed.post', (sim, rng) => { const platform = rng.pick(PLATFORM_IDS); return cmd('feed.post', { platform, text: rng.pick(SAYINGS), images: platform === 'lumen' ? ['The view from here'] : undefined }); }],
  ['feed.scroll', (sim, rng) => cmd('feed.scroll', { platform: rng.pick(PLATFORM_IDS), minutes: rng.int(5, 40) })],
  ['feed.story', (sim, rng) => cmd('feed.story', { text: rng.pick(SAYINGS) })],
  ['feed.follow', (sim, rng) => { const p = pickOf(rng, Object.values(sim.universe.socialProfiles).filter((x) => x.ownerId !== sim.player.id && x.personId !== sim.player.id)); return p ? cmd('feed.follow', { profileId: p.id }) : null; }],
  ['video.create_channel', () => cmd('video.create_channel')],
  ['video.upload', (sim, rng) => cmd('video.upload', { title: rng.pick(TITLES) })],
  ['video.watch', (sim, rng) => { const v = pickOf(rng, Object.values(sim.universe.videos)); return v ? cmd('video.watch', { videoId: v.id, minutes: rng.int(2, 20) }) : null; }],
  ['social.create_account', (sim, rng) => cmd('social.create_account', { platform: rng.pick(PLATFORM_IDS), handle: `${sim.player.firstName}${rng.int(100, 999)}`.toLowerCase().replace(/[^a-z0-9]/g, '') })],
  ['social.create_post', (sim, rng) => { const a = pickOf(rng, myAccountsOn(sim)); return a ? cmd('social.create_post', { accountId: a.id, format: rng.pick(['text', 'photo', 'short_video']), title: rng.pick(TITLES), effortMinutes: rng.int(15, 120) }) : null; }],
  // People
  ['rel.meet', (sim, rng) => { const p = pickOf(rng, othersHere(sim)); return p ? cmd('rel.meet', { personId: p.id }) : null; }],
  ['rel.interact', (sim, rng) => { const r = pickOf(rng, activeRels(sim)); return r ? cmd('rel.interact', { relationshipId: r.id, interaction: rng.pick(INTERACTIONS) }) : null; }],
  ['rel.ask_out', (sim, rng) => { const r = pickOf(rng, activeRels(sim)); return r ? cmd('rel.ask_out', { personId: otherOf(sim, r), activityId: rng.pick(DATE_ACTIVITIES).id, at: hoursOn(sim, rng, 26, 96) }) : null; }],
  ['date.attend', (sim, rng) => { const d = pickOf(rng, Object.values(sim.universe.dates).filter((x) => x.status === 'planned' && x.at <= sim.now + 2 * HOUR)); return d ? cmd('date.attend', { dateId: d.id, mode: rng.pick(['play', 'summary']) }) : null; }],
  // Plans
  ['plan.create', (sim, rng) => cmd('plan.create', { title: rng.pick(['Coffee', 'A Walk', 'Phone Home', 'Laundry']), at: hoursOn(sim, rng, 3, 120), durationMinutes: rng.pick([30, 60, 90]) })],
  ['plan.attend', (sim, rng) => { const p = pickOf(rng, plansOf(sim).filter((x) => x.status === 'planned' && x.at <= sim.now + HOUR)); return p ? cmd('plan.attend', { planId: p.id, mode: rng.pick(['play', 'summary']) }) : null; }],
  ['plan.skip', (sim, rng) => { const p = pickOf(rng, plansOf(sim).filter((x) => x.status === 'planned')); return p ? cmd('plan.skip', { planId: p.id }) : null; }],
  // Money
  ['bank.open', (sim, rng) => cmd('bank.open', { productId: rng.pick(BANK_PRODUCTS).id })],
  ['finance.transfer', (sim, rng) => {
    const accts = myAccounts(sim);
    if (accts.length < 2) return null;
    const from = rng.pick(accts);
    const to = pickOf(rng, accts.filter((a) => a.id !== from.id));
    return to ? cmd('finance.transfer', { fromAccountId: from.id, toAccountId: to.id, amount: rng.int(500, 40000) }) : null;
  }],
  ['finance.pay_bill', (sim, rng) => { const b = pickOf(rng, Object.values(sim.universe.bills).filter((x) => x.payerId === sim.player.id)); return b ? cmd('finance.pay_bill', { billId: b.id }) : null; }],
  ['ins.quote', (sim, rng) => cmd('ins.quote', { line: rng.pick(['renters', 'auto', 'health', 'travel', 'life', 'valuables']) })],
  ['ins.purchase', (sim, rng) => { const q = pickOf(rng, Object.values(sim.universe.insurancePolicies).filter((x) => x.status === 'quoted' && x.holderId === sim.player.id)); return q ? cmd('ins.purchase', { quoteId: q.id }) : null; }],
  // A roof
  ['prop.rent', (sim, rng) => { const p = pickOf(rng, Object.values(sim.universe.properties).filter((x) => x.locationId === cityOf(sim) && x.monthlyRent && x.id !== sim.player.residenceId && !x.ownerId)); return p ? cmd('prop.rent', { propertyId: p.id, months: rng.pick([6, 12]) }) : null; }],
  ['prop.book_showing', (sim, rng) => { const l = pickOf(rng, activeListings(sim)); return l ? cmd('prop.book_showing', { listingId: l.id, at: hoursOn(sim, rng, 26, 120) }) : null; }],
  ['prop.make_offer', (sim, rng) => { const l = pickOf(rng, activeListings(sim)); return l ? cmd('prop.make_offer', { listingId: l.id, amount: Math.round(l.askingPrice * (0.85 + rng.next() * 0.15)), financingKind: 'cash', contingencies: [] }) : null; }],
  ['home.use', (sim, rng) => { const a = pickOf(rng, myAssets(sim)); return a ? cmd('home.use', { assetId: a.id }) : null; }],
  ['home.repair', (sim, rng) => { const a = pickOf(rng, myAssets(sim)); return a ? cmd('home.repair', { assetId: a.id }) : null; }],
  // Wheels
  ['veh.purchase', (sim, rng) => { const l = pickOf(rng, carListings(sim)); return l ? cmd('veh.purchase', { listingId: l.id, acquisition: 'cash' }) : null; }],
  ['veh.drive', (sim, rng) => { const v = pickOf(rng, myVehicles(sim)); return v ? cmd('veh.drive', { vehicleId: v.id, miles: rng.int(5, 60) }) : null; }],
  ['veh.cruise', (sim, rng) => { const v = pickOf(rng, myVehicles(sim)); return v ? cmd('veh.cruise', { vehicleId: v.id, hours: 1 }) : null; }],
  ['veh.sell', (sim, rng) => { const v = pickOf(rng, myVehicles(sim)); return v && rng.chance(0.2) ? cmd('veh.sell', { vehicleId: v.id }) : null; }],
  ['deal.haggle', goTo((sim, rng) => pickOf(rng, dealershipsIn(sim))),
    (sim, rng, ctx) => {
      const l = pickOf(rng, carListings(sim).filter((x) => !x.dealerPlaceId || x.dealerPlaceId === ctx.place.id));
      if (!l) return null;
      ctx.listing = l;
      return cmd('deal.open', { placeId: ctx.place.id, listingId: l.id });
    },
    soft((sim, rng, ctx) => { ctx.deal = ctx.value.dealId; return cmd('deal.test_drive', { dealId: ctx.deal }); }),
    soft((sim, rng, ctx) => cmd('deal.offer', { dealId: ctx.deal, price: Math.round(ctx.listing.price * (0.8 + rng.next() * 0.2)) })),
    (sim, rng, ctx) => (rng.chance(0.5) ? cmd('deal.sign', { dealId: ctx.deal, acquisition: 'cash' }) : cmd('deal.walk_away', { dealId: ctx.deal }))],
  // Shops, tables and counters
  ['shopping', goTo(somewhere(undefined, (p) => Boolean(retailerAt(p)))),
    (sim, rng, ctx) => cmd('retail.enter', { placeId: ctx.place.id }),
    (sim, rng, ctx) => { ctx.visit = ctx.value.visitId; const s = pickOf(rng, stockAt(sim, ctx.place)); return s ? cmd('retail.basket', { visitId: ctx.visit, catalogId: s.item.id }) : null; },
    soft((sim, rng, ctx) => { const s = pickOf(rng, stockAt(sim, ctx.place)); return s ? cmd('retail.basket', { visitId: ctx.visit, catalogId: s.item.id }) : undefined; }),
    (sim, rng, ctx) => cmd('retail.pay', { visitId: ctx.visit })],
  ['shop.purchase', (sim, rng) => cmd('shop.purchase', { retailerId: rng.pick(RETAILERS.all()).id, lines: [{ catalogId: rng.pick(CATALOG.all()).id, quantity: 1 }] })],
  ['dinner', goTo(somewhere(['restaurant', 'cafe', 'fast_food'])),
    (sim, rng, ctx) => cmd('dine.arrive', { placeId: ctx.place.id }),
    soft((sim, rng, ctx) => { ctx.visit = ctx.value.visitId; return cmd('dine.wait', { visitId: ctx.visit }); }),
    (sim, rng, ctx) => {
      const menu = menuOf(ctx.place);
      if (menu.length === 0) return null;
      const items = [];
      for (let i = rng.int(1, 2); i > 0; i -= 1) items.push(rng.pick(menu).name);
      return cmd('dine.order', { visitId: ctx.visit, items });
    },
    (sim, rng, ctx) => cmd('dine.settle', { visitId: ctx.visit, tipShare: rng.pick([0, 0.1, 0.18]) }),
    (sim, rng, ctx) => cmd('dine.leave', { visitId: ctx.visit })],
  ['haircut', goTo((sim, rng) => pickOf(rng, salonsIn(sim))), (sim, rng, ctx) => cmd('errand.haircut', { placeId: ctx.place.id, service: rng.pick(SALON_SERVICES).id })],
  ['pharmacy', goTo((sim, rng) => pickOf(rng, pharmaciesIn(sim))), (sim, rng, ctx) => { const g = pickOf(rng, shelfAt(sim, ctx.place)); return g ? cmd('errand.buy', { placeId: ctx.place.id, items: [{ id: g.id, quantity: 1 }] }) : null; }],
  // Nights out
  ['cine.book', (sim, rng) => {
    const place = pickOf(rng, cinemasIn(sim));
    const showing = pickOf(rng, programmeIn(sim, cityOf(sim)));
    if (!place || !showing) return null;
    const at = showtimesFor(sim, place, showing, sim.now + rng.pick([0, DAY])).find((t) => t > sim.now + 30 * 60 * 1000);
    return at ? cmd('cine.book', { placeId: place.id, showingId: showing.id, at, seats: 1 }) : null;
  }],
  ['cine.attend', (sim, rng) => { const t = pickOf(rng, ticketsOf(sim).filter((x) => !x.attendedAt && x.at >= sim.now - HOUR && x.at <= sim.now + HOUR)); return t ? cmd('cine.attend', { ticketId: t.id }) : null; }],
  ['going.book', (sim, rng) => { const place = pickOf(rng, venuesIn(sim)); if (!place) return null; const ev = pickOf(rng, eventsAt(sim, place)); return ev ? cmd('going.book', { placeId: place.id, eventId: ev.id }) : null; }],
  ['going.attend', (sim, rng) => { const t = pickOf(rng, Object.values(sim.universe.goingTickets ?? {}).filter((x) => !x.attendedAt && x.at >= sim.now - HOUR && x.at <= sim.now + HOUR)); return t ? cmd('going.attend', { ticketId: t.id }) : null; }],
  // Health
  ['health.book', (sim, rng) => { const p = pickOf(rng, Object.values(sim.universe.healthProviders).filter((x) => x.locationId === cityOf(sim))); return p ? cmd('health.book', { providerId: p.id, kind: rng.pick(['Check Up', 'Something Is Wrong', 'Follow Up']), at: hoursOn(sim, rng, 26, 240) }) : null; }],
  ['health.check_in', (sim, rng) => { const a = pickOf(rng, Object.values(sim.universe.appointments).filter((x) => x.status === 'scheduled' && x.at <= sim.now + HOUR && x.at >= sim.now - 2 * HOUR)); return a ? cmd('health.check_in', { appointmentId: a.id }) : null; }],
  // Scenes, started the way a screen starts them
  ['scene.activity', (sim, rng) => cmd('scene.start', { definitionId: 'wellbeing.activity', input: { activityId: rng.pick(ACTIVITIES).id } })],
  ['scene.gym', goTo(somewhere(['gym'])), (sim, rng, ctx) => cmd('scene.start', { definitionId: 'fitness.gym', input: { placeId: ctx.place.id } })],
  ['scene.meal', goTo(somewhere(['restaurant', 'cafe', 'fast_food'])), (sim, rng, ctx) => cmd('scene.start', { definitionId: 'life.meal', input: { placeId: ctx.place.id } })],
  ['scene.shop', goTo(somewhere(undefined, (p) => Boolean(retailerAt(p)))), (sim, rng, ctx) => cmd('scene.start', { definitionId: 'life.shop', input: { placeId: ctx.place.id } })],
  ['scene.run', (sim, rng) => cmd('scene.start', { definitionId: 'life.run', input: { minutes: rng.pick([20, 30, 45]) } })],
  ['scene.dress', (sim, rng) => cmd('scene.start', { definitionId: 'life.dress', input: { occasion: rng.pick(['a night out', 'work', 'a date']) } })],
  ['scene.compose', (sim, rng) => { const a = pickOf(rng, myAccountsOn(sim)); return a ? cmd('scene.start', { definitionId: 'social.compose', input: { accountId: a.id } }) : null; }],
];

/**
 * Run one actor: build each step from the save, execute it, stop on the first
 * refusal that is not soft. Returns a harness bug if a builder itself threw,
 * which is either a mistake here or an engine helper that cannot cope with
 * the state it was handed. Both are worth knowing.
 */
function act(sim, rng, actor, run, settle, stats) {
  const [name, ...steps] = actor;
  const ctx = { value: undefined };
  const stat = stats[name] ?? (stats[name] = { tried: 0, ok: 0, refused: 0, idle: 0 });
  let did = 0;
  for (const step of steps) {
    let next;
    try {
      next = step(sim, rng, ctx);
    } catch (err) {
      return { bug: `actor ${name} step ${steps.indexOf(step)} threw: ${err?.stack ?? err}` };
    }
    if (next === null) {
      if (did === 0) stat.idle += 1;
      return {};
    }
    if (next === undefined) continue;
    if (did === 0) stat.tried += 1;
    const result = run(next.kind, next.payload);
    if (!result.ok) {
      if (step.soft) continue;
      stat.refused += 1;
      return {};
    }
    did += 1;
    ctx.value = result.value;
    settle();
    // A scene opened, and the scene loop takes it from here.
    if (activeScene(sim)) { stat.ok += 1; return { scene: true }; }
  }
  if (did > 0) stat.ok += 1;
  return {};
}

// ---------------------------------------------------------------------------
// One life
// ---------------------------------------------------------------------------

const ASKABLES = everythingAskable();

function playLife(index) {
  const seed = `${SEED}-${index}`;
  const rng = rngFrom(seed);
  const { stage, config } = randomConfig(rng);
  const life = {
    index, seed, stage, config,
    steps: 0, days: 0, asks: 0, commands: 0, refusals: 0, scenesPlayed: 0, decisions: 0,
    byKind: {}, refusalsByKind: {}, refusalReasons: {}, actors: {}, bugs: [], ended: null, ms: 0,
  };
  const started = performance.now();
  let sim;
  try {
    sim = quickSave(config, seed);
  } catch (err) {
    life.bugs.push({ kind: 'throw', where: 'quickSave', message: String(err?.stack ?? err), day: 0, step: 0 });
    life.ms = performance.now() - started;
    return life;
  }
  const seenFailed = new Set();
  let lastNow = sim.now;
  const bug = (kind, message, extra = {}) => life.bugs.push({ kind, message, day: life.days, step: life.steps, ...extra });

  const run = (kindName, payload) => {
    life.steps += 1;
    life.commands += 1;
    life.byKind[kindName] = (life.byKind[kindName] ?? 0) + 1;
    let result;
    try {
      result = sim.execute({ kind: kindName, payload });
    } catch (err) {
      bug('throw', `${kindName}: ${err?.message ?? err}`, { command: kindName, payload });
      return { ok: false };
    }
    if (!result.ok) {
      if (result.error && result.error.startsWith(`${kindName} failed:`)) {
        bug('crash', result.error, { command: kindName, payload });
      } else {
        life.refusals += 1;
        life.refusalsByKind[kindName] = (life.refusalsByKind[kindName] ?? 0) + 1;
        const why = `${kindName}: ${result.error ?? '(no reason given)'}`;
        life.refusalReasons[why] = (life.refusalReasons[why] ?? 0) + 1;
      }
    }
    return result;
  };

  const settle = () => {
    for (const [kind, message] of checkInvariants(sim, lastNow)) bug(kind, message);
    for (const message of failedEvents(sim, seenFailed)) bug('missed', message);
    lastNow = sim.now;
  };

  try {
    for (let day = 0; day < DAYS; day += 1) {
      life.days = day;
      if (!isAlive(sim.player, sim.now)) { life.ended = `died at ${ageOf(sim)}`; break; }

      // Whatever is waiting on you: take a way through it, or wave it off.
      for (const decision of openDecisions(sim).slice(0, 4)) {
        life.decisions += 1;
        if (decision.actions.length > 0 && rng.chance(0.7)) {
          run('world.take_decision_action', { decisionId: decision.id, actionIndex: rng.int(0, decision.actions.length - 1) });
        } else {
          run('world.dismiss_decision', { decisionId: decision.id });
        }
        settle();
      }

      // A scene that is open gets played, choice by choice, until it is not.
      let session = activeScene(sim);
      let turns = 0;
      while (session && turns < 14) {
        turns += 1;
        let view;
        try {
          view = sceneView(sim, session);
        } catch (err) {
          bug('throw', `sceneView(${session.definitionId}): ${err?.message ?? err}`);
          break;
        }
        if (view.choices.length > 0 && !(view.canSkip && rng.chance(0.1)) && !(view.canLeave && rng.chance(0.08))) {
          const choice = rng.pick(view.choices);
          run('scene.choose', { sceneId: session.id, revision: session.revision, choiceId: choice.id });
        } else if (view.canSkip && rng.chance(0.5)) {
          run('scene.skip', { sceneId: session.id, revision: session.revision });
        } else if (view.canLeave) {
          run('scene.leave', { sceneId: session.id, revision: session.revision });
        } else if (view.freeText) {
          run('scene.choose', { sceneId: session.id, revision: session.revision, text: 'sure' });
        } else {
          break;
        }
        settle();
        const next = activeScene(sim);
        if (next && next.id === session.id && next.revision === session.revision && next.status === session.status) break;
        session = next;
      }
      if (turns > 0) life.scenesPlayed += 1;

      // Then ask the game for things, in its own words.
      if (!activeScene(sim)) {
        const asks = rng.int(1, 4);
        for (let a = 0; a < asks; a += 1) {
          const askable = rng.pick(ASKABLES);
          const phrase = rng.pick(askable.says);
          life.asks += 1;
          let plan;
          try {
            plan = resolveAsk(sim, phrase);
          } catch (err) {
            bug('throw', `resolveAsk("${phrase}"): ${err?.message ?? err}`);
            continue;
          }
          if (plan.kind === 'which' && plan.options.length > 0) {
            const option = rng.pick(plan.options);
            try {
              plan = planFor(sim, plan.askable.id, option.id);
            } catch (err) {
              bug('throw', `planFor(${plan.askable.id}, ${option.id}): ${err?.message ?? err}`);
              continue;
            }
          }
          if (plan.kind === 'do') {
            run(plan.command, plan.payload);
            settle();
            if (activeScene(sim)) break;
          }
        }
      }

      // A person who is out on their feet goes to bed. Without this reflex the
      // fuzzer spends its days being told to sleep first, and never gets
      // anywhere near the things that need a rested body.
      if (!activeScene(sim) && sim.player.wellbeing.energy < 15) {
        run('life.sleep', { hours: rng.int(6, 9) });
        settle();
      }

      // Then do things a screen would let you do, with the ids it would use.
      if (!activeScene(sim)) {
        for (let a = rng.int(2, 5); a > 0; a -= 1) {
          const outcome = act(sim, rng, rng.pick(ACTORS), run, settle, life.actors);
          if (outcome.bug) bug('throw', outcome.bug);
          if (activeScene(sim)) break;
        }
      }

      // Time passes in uneven slices, the way a day does.
      const slice = rng.pick([2 * HOUR, 6 * HOUR, 12 * HOUR, DAY, 26 * HOUR]);
      life.steps += 1;
      try {
        const result = sim.advanceBy(slice);
        for (const item of result.missed) {
          // The notification carries the reason; this is the fallback if none was left.
          if (failedEvents(sim, seenFailed).length === 0) bug('missed', `scheduled '${item.label}' (${item.kind}) was missed`);
        }
      } catch (err) {
        bug('throw', `advanceBy(${slice}): ${err?.stack ?? err}`);
        break;
      }
      settle();

      // Once a month the save goes out and comes back.
      if (day > 0 && day % 30 === 0) {
        try {
          const trip = roundTrip(sim);
          for (const [kind, message] of trip.problems) bug(kind, message);
          life.saveBytes = trip.bytes;
        } catch (err) {
          bug('roundtrip', `round trip threw: ${err?.message ?? err}`);
        }
      }
    }
  } catch (err) {
    bug('throw', `harness: ${err?.stack ?? err}`);
  }
  life.ms = performance.now() - started;
  life.ageAtEnd = (() => { try { return ageOf(sim); } catch { return undefined; } })();
  return life;
}

// ---------------------------------------------------------------------------
// The run, and the report
// ---------------------------------------------------------------------------

const lives = [];
const indices = ONLY !== undefined ? [ONLY] : Array.from({ length: LIVES }, (_, i) => i);
for (const i of indices) {
  const life = playLife(i);
  lives.push(life);
  const flag = life.bugs.length > 0 ? `${life.bugs.length} BUG${life.bugs.length === 1 ? '' : 'S'}` : 'clean';
  console.log(`life ${String(i).padStart(2)}  ${life.stage.padEnd(5)} ${life.config.wealth.padEnd(11)} ${life.config.housing.padEnd(9)} ${life.config.startLocationId.padEnd(20)} ${String(life.days).padStart(3)}d ${String(life.commands).padStart(4)} cmds ${String(life.refusals).padStart(4)} refused  ${(life.ms / 1000).toFixed(1)}s  ${flag}${life.ended ? `  (${life.ended})` : ''}`);
  if (VERBOSE) for (const b of life.bugs) console.log(`    [${b.kind}] day ${b.day} step ${b.step}: ${b.message}`);
}

const bugs = lives.flatMap((l) => l.bugs.map((b) => ({ ...b, life: l.index, seed: l.seed, stage: l.stage })));
const byClass = {};
for (const b of bugs) byClass[b.kind] = (byClass[b.kind] ?? 0) + 1;
const commands = lives.reduce((n, l) => n + l.commands, 0);
const refusals = lives.reduce((n, l) => n + l.refusals, 0);
const days = lives.reduce((n, l) => n + l.days, 0);
const ms = lives.reduce((n, l) => n + l.ms, 0);

console.log('');
console.log(`${lives.length} lives, ${days} simulated days, ${commands} commands (${refusals} refused), ${(ms / 1000).toFixed(1)}s.`);
if (bugs.length === 0) {
  console.log('No bugs. Every invariant held on every step of every life.');
} else {
  console.log(`${bugs.length} bugs: ${Object.entries(byClass).map(([k, n]) => `${k} ${n}`).join(', ')}.`);
  // Group by message shape so one root cause is one line.
  const grouped = new Map();
  for (const b of bugs) {
    const key = `${b.kind}|${b.message.replace(/[0-9a-f]{6,}|\d+/g, '#').slice(0, 140)}`;
    const entry = grouped.get(key) ?? { kind: b.kind, sample: b.message, count: 0, lives: new Set(), first: b };
    entry.count += 1; entry.lives.add(b.life);
    grouped.set(key, entry);
  }
  for (const entry of [...grouped.values()].sort((a, b) => b.count - a.count)) {
    console.log(`\n  [${entry.kind}] ×${entry.count} in ${entry.lives.size} life/lives — reproduce: --only ${entry.first.life} --seed ${SEED}`);
    console.log(`    ${entry.sample.split('\n')[0].slice(0, 220)}`);
  }
}

// Commands that were refused every single time they were tried are worth a look.
const tried = {}; const refusedAll = [];
for (const l of lives) for (const [k, n] of Object.entries(l.byKind)) tried[k] = (tried[k] ?? 0) + n;
const refusedTotals = {};
for (const l of lives) for (const [k, n] of Object.entries(l.refusalsByKind)) refusedTotals[k] = (refusedTotals[k] ?? 0) + n;
for (const [k, n] of Object.entries(tried)) if (n >= 5 && refusedTotals[k] === n) refusedAll.push(`${k} (${n})`);
if (refusedAll.length) console.log(`\nRefused every time they were tried: ${refusedAll.join(', ')}.`);

// The reasons behind the refusals, most common first. A reason that shows up
// thousands of times is either a fuzzer that keeps asking for the impossible
// or a path in the game that nobody can actually get down.
const reasons = {};
for (const l of lives) for (const [why, n] of Object.entries(l.refusalReasons)) reasons[why] = (reasons[why] ?? 0) + n;
const topReasons = Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, VERBOSE ? 60 : 25);
if (topReasons.length) {
  console.log('\nMost common refusals:');
  for (const [why, n] of topReasons) console.log(`  ×${String(n).padStart(5)}  ${why.length > 180 ? `${why.slice(0, 177)}...` : why}`);
}

// What the actors managed. An actor that never once got through is either
// asking for something the save never has, or a path nobody can get down.
const actorTotals = {};
for (const l of lives) {
  for (const [name, stat] of Object.entries(l.actors)) {
    const total = actorTotals[name] ?? (actorTotals[name] = { tried: 0, ok: 0, refused: 0, idle: 0 });
    for (const key of Object.keys(stat)) total[key] += stat[key];
  }
}
const never = Object.entries(actorTotals).filter(([, t]) => t.tried >= 5 && t.ok === 0).map(([name, t]) => `${name} (${t.tried})`);
if (never.length) console.log(`\nActors that never got through: ${never.join(', ')}.`);
if (VERBOSE) {
  console.log('\nActors:');
  for (const [name, t] of Object.entries(actorTotals).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${name.padEnd(22)} tried ${String(t.tried).padStart(4)}  ok ${String(t.ok).padStart(4)}  refused ${String(t.refused).padStart(4)}  idle ${String(t.idle).padStart(4)}`);
  }
}

if (OUT) {
  writeFileSync(OUT, JSON.stringify({ seed: SEED, lives, bugs, actors: actorTotals }, null, 2));
  console.log(`\nReport written to ${OUT}.`);
}
process.exit(bugs.length > 0 ? 1 : 0);
