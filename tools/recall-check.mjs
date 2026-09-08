/**
 * The game remembers what happened, and nothing else.
 *
 * A memory system is the easiest thing in a game to fake and the worst thing
 * to fake, because a world that misremembers is worse than a world with no
 * memory at all. So this measures the properties that make it real rather
 * than taking the code's word for any of them.
 *
 * One: nothing is invented. Every rule in the book is keyed to an event the
 * engine really emits — the same discipline the phrasebook is held to — and
 * every beat the director raises cites a record that really resolves in the
 * save it came from.
 *
 * Two: nothing important is lost. A life is played out and the memory is
 * checked for still holding the things nobody forgets, however long ago and
 * however much else has happened since.
 *
 * Three: it does not repeat itself. The same beat inside its cooldown is the
 * failure the freshness register exists to prevent, so a year is played and
 * every beat raised is checked against every other.
 *
 * Four: nobody knows what they were not there for.
 */

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { RECALLBOOK, NEVER_BELOW_HALF, RECALL_NOTE, RECALL_LIMITS_NOTE } from '../src/engine/content/recallbook.ts';
import {
  MAX_RECOLLECTIONS, TEXTURE_BELOW, describe, notSeenLately, openThreads, recall, recallStats,
  remember, whatTheyKnow, worthNow,
} from '../src/engine/systems/recall.ts';
import { fingerprint, freshest, markPlayed, playedWithin, timesPlayed } from '../src/engine/systems/freshness.ts';
import {
  BEATS_A_DAY, BEAT_COOLDOWN_DAYS, DIRECTOR_LIMITS_NOTE, DIRECTOR_NOTE, causeOf, keyOf, liveBeats,
  runTheDay,
} from '../src/engine/systems/director.ts';
import { quickSave } from '../src/engine/index.ts';
import { MS_DAY } from '../src/engine/core/time.ts';

const problems = [];

// --- One: nothing in the book is invented ------------------------------------

const source = execSync('git ls-files "src/engine/**/*.ts"', { encoding: 'utf8' })
  .split('\n').filter(Boolean)
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');
const emitted = new Set([...source.matchAll(/emit\('([a-z_.]+)'/g)].map((m) => m[1]));

const seen = new Set();
for (const rule of RECALLBOOK) {
  if (seen.has(rule.event)) problems.push(`${rule.event} has two rules`);
  seen.add(rule.event);
  if (!emitted.has(rule.event)) problems.push(`${rule.event} is remembered but never emitted by anything`);
  if (rule.weight < 1 || rule.weight > 100) problems.push(`${rule.event} is weighted ${rule.weight}`);
  if (rule.halfLife < 0) problems.push(`${rule.event} fades in negative days`);
  if (rule.tags.length === 0) problems.push(`${rule.event} is filed under nothing`);
  if (rule.what.length < 4) problems.push(`${rule.event} has nothing said about it`);
  if (rule.what !== rule.what[0].toUpperCase() + rule.what.slice(1)) {
    problems.push(`"${rule.what}" does not start with a capital`);
  }
  // A thing that never fades has to be a thing worth never forgetting.
  if (rule.halfLife === 0 && rule.weight < 40) {
    problems.push(`${rule.event} never fades and is only worth ${rule.weight}`);
  }
}

// --- Two: a life is remembered, and the big things are never lost ------------

const sim = quickSave({ birthYear: 2004, startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london' });
let ran = 0;
for (let day = 0; day < 730; day++) {
  if (sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok) ran++;
  if (day % 3 === 0 && sim.execute({ kind: 'life.shower', payload: {} }).ok) ran++;
  sim.advanceBy(MS_DAY);
}
if (ran < 200) problems.push(`only ${ran} things happened in two years, which is not a life to measure`);

const stats = recallStats(sim);
if (stats.entries < 40) problems.push(`two years of living left only ${stats.entries} memories`);
if (stats.entries > MAX_RECOLLECTIONS) problems.push('the memory grew past its own bound');

// The everyday is folded rather than kept a line at a time.
const showers = (sim.universe.recall?.entries ?? []).filter((one) => one.cause === 'life.showered');
const showerTimes = showers.reduce((sum, one) => sum + (one.times ?? 1), 0);
if (showerTimes < 100) problems.push(`only ${showerTimes} showers were remembered out of two years of them`);
if (showers.length >= showerTimes) problems.push('the everyday was kept a line at a time rather than folded into weeks');
if (showers.some((one) => one.weight >= TEXTURE_BELOW)) problems.push('something above the texture line was folded anyway');

// Anything that mattered is still there, whole, at the end of two years.
const heavy = (sim.universe.recall?.entries ?? []).filter((one) => one.weight >= NEVER_BELOW_HALF);
for (const one of heavy) {
  if (worthNow(one, sim.now) < one.weight / 2 - 0.001) {
    problems.push(`"${one.what}" faded below half though it was worth ${one.weight}`);
  }
}

// And it survives being pushed past the bound: a wedding is not evicted by
// two thousand showers.
{
  const crowded = quickSave({ birthYear: 2004 });
  remember(crowded, {
    kind: 'got', cause: 'rel.married', what: 'Got married', weight: 100,
    halfLifeDays: 0, tags: ['people'],
  });
  for (let i = 0; i < MAX_RECOLLECTIONS + 500; i++) {
    remember(crowded, {
      kind: 'did', cause: `filler.${i}`, what: 'Something small', weight: 21,
      halfLifeDays: 4, tags: ['filler'], at: crowded.now - i * 1000,
    });
  }
  const kept = crowded.universe.recall.entries;
  if (kept.length > MAX_RECOLLECTIONS) problems.push(`the memory holds ${kept.length}, past its own bound of ${MAX_RECOLLECTIONS}`);
  if (!kept.some((one) => one.cause === 'rel.married')) {
    problems.push('a wedding was evicted from the memory to make room for small things');
  }
}

// --- Three: it does not repeat itself ----------------------------------------

// Driven through the scheduler rather than by hand, because the day's look
// back is a scheduled thing and the point is that the real path behaves.
const played = quickSave({ birthYear: 1996, startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles' });
const raised = [];
let readTo = played.universe.notifications.length;
for (let day = 0; day < 730; day++) {
  played.advanceBy(MS_DAY);
  for (const notice of played.universe.notifications.slice(readTo)) {
    if (notice.refType !== 'recall' && notice.refType !== 'history') continue;
    raised.push({ key: `${notice.title}|${notice.body}`, at: notice.at, beat: notice });
  }
  readTo = played.universe.notifications.length;
}
// The scheduled path raises notices; every one has to resolve to a record.
for (const one of raised) {
  const id = one.beat.refId;
  const found = one.beat.refType === 'recall'
    ? played.universe.recall?.entries.some((entry) => entry.id === id)
    : played.universe.history.some((entry) => entry.id === id);
  if (!found) problems.push(`"${one.beat.title}" cites a ${one.beat.refType} record that is not in the save`);
}
// And the same thing raised by hand still cites something that resolves.
for (const beat of liveBeats(played)) {
  if (!beat.becauseRecallId && !beat.becauseHistoryId) problems.push(`"${beat.title}" would be raised without saying why`);
  else if (!causeOf(played, beat)) problems.push(`"${beat.title}" cites a record that is not in the save`);
}
const lastSeen = new Map();
for (const one of raised) {
  const before = lastSeen.get(one.key);
  if (before !== undefined && one.at - before < BEAT_COOLDOWN_DAYS * MS_DAY) {
    problems.push(`"${one.beat.title}" came round again after ${Math.round((one.at - before) / MS_DAY)} days`);
  }
  lastSeen.set(one.key, one.at);
}
// Two years should not be silent, and should not be a stream either. A save
// where nobody does anything is quiet on purpose: a world that invents
// something to say every morning is the fakery this is built to avoid.
if (raised.length === 0) problems.push('the world brought nothing up in two years');
if (raised.length > 730 * BEATS_A_DAY) problems.push('more was raised than the daily limit allows');

// Every kind of beat can actually fire.
//
// The loop above only proves the path. This proves the parts: each kind is
// given the conditions it is meant to respond to, and has to respond. A beat
// kind that can never fire is dead code pretending to be a feature.
const fired = new Set();
{
  // Somebody you have not seen, and something started and never finished.
  const world = quickSave({ birthYear: 1996, startLocationId: 'us-ca-losangeles', homeRegionId: 'us-ca-losangeles' });
  const friend = Object.values(world.universe.people).find((one) => !one.isPlayer && one.tier !== 'dormant');
  if (!friend) problems.push('the starting world has nobody to not see');
  else {
    remember(world, {
      kind: 'met', cause: 'rel.interaction', what: 'Spent time with somebody', weight: 40,
      halfLifeDays: 30, tags: ['people'], withIds: [friend.id], at: world.now - 200 * MS_DAY,
    });
    remember(world, {
      kind: 'did', cause: 'home.repair_booked', what: 'Booked a repair', weight: 22,
      halfLifeDays: 30, tags: ['home'], at: world.now - 120 * MS_DAY,
    });
    // Something really done, four times, and then stopped: the two guards on
    // "it has been a while" mean one memory is not enough to earn it.
    for (let i = 0; i < 5; i++) {
      remember(world, {
        kind: 'did', cause: 'week.trained', what: 'Trained', weight: 28,
        halfLifeDays: 30, tags: ['training'], at: world.now - (300 + i) * MS_DAY,
      });
    }
    for (const beat of liveBeats(world)) fired.add(beat.kind);
  }
}
{
  // Something kept at. Twelve in a month is the bar, so thirteen clears it.
  const world = quickSave({ birthYear: 1996 });
  for (let i = 0; i < 13; i++) {
    remember(world, {
      kind: 'did', cause: 'week.trained', what: 'Trained', weight: 28,
      halfLifeDays: 30, tags: ['training'], at: world.now - i * MS_DAY,
    });
  }
  for (const beat of liveBeats(world)) fired.add(beat.kind);
}
{
  // A year to the day.
  const world = quickSave({ birthYear: 1996 });
  for (let day = 0; day < 400; day++) {
    world.advanceBy(MS_DAY);
    for (const beat of liveBeats(world)) fired.add(beat.kind);
  }
}
for (const kind of ['anniversary', 'unfinished', 'not_seen', 'streak', 'long_time']) {
  if (!fired.has(kind)) problems.push(`a "${kind}" beat cannot be made to fire at all`);
}

// The register itself: the same key is never handed back twice running while
// an alternative exists.
{
  const box = quickSave({ birthYear: 1996 });
  const options = ['a', 'b', 'c', 'd'];
  let backToBack = 0;
  let previous;
  for (let i = 0; i < 60; i++) {
    const picked = freshest(box, 'test', options, (one) => one, 3, i).chosen;
    if (picked !== undefined && picked === previous) backToBack++;
    previous = picked;
    box.advanceBy(MS_DAY);
  }
  if (backToBack > 0) problems.push(`the same beat came back to back ${backToBack} times out of sixty`);
  const key = fingerprint('test', 'a');
  if ((timesPlayed(box, key)?.n ?? 0) === 0) problems.push('the register did not write down what it played');
  markPlayed(box, 'probe');
  if (!playedWithin(box, 'probe', 1)) problems.push('the register forgot something it had just written');
}

// --- Four: nobody knows what they were not there for -------------------------

{
  const world = quickSave({ birthYear: 1996 });
  const people = Object.values(world.universe.people).filter((one) => !one.isPlayer);
  const [there, elsewhere] = people;
  if (!there || !elsewhere) {
    problems.push('the starting world has fewer than two other people in it');
  } else {
    remember(world, {
      kind: 'met', cause: 'rel.interaction', what: 'Spent time with somebody', weight: 40,
      halfLifeDays: 30, tags: ['people'], withIds: [there.id],
    });
    if (whatTheyKnow(world, there.id).length !== 1) problems.push('somebody who was there does not remember it');
    if (whatTheyKnow(world, elsewhere.id).length !== 0) {
      problems.push('somebody who was not there remembers it anyway');
    }
  }
}

// --- The notes are written ---------------------------------------------------

for (const [name, note] of Object.entries({ RECALL_NOTE, RECALL_LIMITS_NOTE, DIRECTOR_NOTE, DIRECTOR_LIMITS_NOTE })) {
  if (note.length < 80) problems.push(`${name} does not say enough to be worth printing`);
}

// --- Say what was measured ---------------------------------------------------

const covered = RECALLBOOK.length;
const kinds = new Set(RECALLBOOK.map((one) => one.kind)).size;
const tags = new Set(RECALLBOOK.flatMap((one) => one.tags)).size;
const never = RECALLBOOK.filter((one) => one.halfLife === 0).length;
console.log(`${covered} of the ${emitted.size} things the engine can do are written down when they happen, under ${tags} headings and ${kinds} kinds of remembering.`);
console.log(`${never} of them never fade at all, and nothing weighted ${NEVER_BELOW_HALF} or over ever falls below half, however long ago it was.`);
console.log(`Two years of an ordinary life left ${stats.entries} memories, with ${showerTimes} showers folded into ${showers.length} weeks of them.`);
console.log(`A save where nobody did anything still had ${raised.length === 1 ? '1 thing' : `${raised.length} things`} brought up over two years, each naming the record it came from, and none of them twice inside ${BEAT_COOLDOWN_DAYS} days.`);
console.log(`All ${fired.size} kinds of beat were made to fire from the conditions they are meant to answer.`);
console.log('There is no model here and no network. It remembers what it did, and it cannot remember what it was never told.');

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const one of [...new Set(problems)]) console.error(`  - ${one}`);
  process.exit(1);
}
console.log('The memory holds.');
