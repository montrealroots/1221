/**
 * The video app has a world behind it.
 *
 * The contract asked for the app rather than a panel of numbers. Half of that
 * is interface and half of it is a world with enough in it that the app is
 * worth opening: enough channels, across enough subjects, with enough ways of
 * naming a video that a channel can run for years without repeating itself.
 * This measures that, so the claim in the docs is a number rather than a
 * feeling and cannot rot quietly when the roster grows.
 *
 * It also holds the line on what the channels are: SLATE's own, invented on
 * purpose, so that no real person's subscriber count is stated as fact.
 */

import { BEATS, BEAT_SLOT, REAL_CHANNELS, RUNTIMES, TOPICS, TOPIC_EFFECT, TOPIC_LABEL } from '../src/engine/content/channels.ts';
import { TITLE_KITS, THUMBNAILS, commentSpace, titleSpace } from '../src/engine/content/videos.ts';

/** A subject needs this many ways of naming a video before it can carry a channel. */
const TITLE_FLOOR = 350;
/** How many channels a subject needs before its feed is one voice. */
const CHANNELS_PER_TOPIC = 8;

const problems = [];

// --- The roster -------------------------------------------------------------

const ids = new Set();
const handles = new Set();
const names = new Set();
const perTopic = new Map();

for (const channel of REAL_CHANNELS) {
  if (ids.has(channel.id)) problems.push(`two channels share the id ${channel.id}`);
  if (handles.has(channel.handle)) problems.push(`two channels share the handle ${channel.handle}`);
  if (names.has(channel.name)) problems.push(`two channels are called ${channel.name}`);
  ids.add(channel.id); handles.add(channel.handle); names.add(channel.name);

  perTopic.set(channel.topic, (perTopic.get(channel.topic) ?? 0) + 1);

  if (!TOPICS.includes(channel.topic)) problems.push(`${channel.name} is about ${channel.topic}, which is not a subject`);
  if (channel.subscribers < 1_000) problems.push(`${channel.name} has almost nobody`);
  if (channel.cadenceDays < 1 || channel.cadenceDays > 30) problems.push(`${channel.name} uploads every ${channel.cadenceDays} days`);
  if (channel.craft < 40 || channel.craft > 100) problems.push(`${channel.name} has a craft of ${channel.craft}`);
  if (!/^[a-z0-9]+$/.test(channel.handle)) problems.push(`${channel.name} has the handle ${channel.handle}`);
  if (channel.about.length < 12) problems.push(`${channel.name} says almost nothing about itself`);
  if (!/[.!?]$/.test(channel.about)) problems.push(`${channel.name} does not finish its sentence`);
  for (const word of channel.name.split(' ')) {
    if (!/^[A-Z0-9]/.test(word)) problems.push(`${channel.name} is not Title Case`);
  }
}

for (const topic of TOPICS) {
  const count = perTopic.get(topic) ?? 0;
  const space = titleSpace(topic);
  const mark = count >= CHANNELS_PER_TOPIC && space >= TITLE_FLOOR ? 'ok  ' : 'THIN';
  console.log(`${mark} ${topic.padEnd(9)} ${String(count).padStart(3)} channels · ${String(space).padStart(6)} ways of naming a video`);
  if (count < CHANNELS_PER_TOPIC) problems.push(`${topic}: only ${count} channels, and a feed needs ${CHANNELS_PER_TOPIC}`);
  if (space < TITLE_FLOOR) problems.push(`${topic}: only ${space} titles, and the floor is ${TITLE_FLOOR}`);
  if (!TOPIC_LABEL[topic]) problems.push(`${topic} has no label`);
  if (!TOPIC_EFFECT[topic]) problems.push(`${topic} does nothing to you`);
  if (!BEAT_SLOT[topic]) problems.push(`${topic} has no slot a beat could narrow`);
  if (!TITLE_KITS[topic]) problems.push(`${topic} has no titles at all`);
}

// --- Beats ------------------------------------------------------------------

for (const [id, beat] of Object.entries(BEATS)) {
  const channel = REAL_CHANNELS.find((c) => c.id === id);
  if (!channel) { problems.push(`a beat is set for ${id}, which is not a channel`); continue; }
  const slot = BEAT_SLOT[channel.topic];
  const shelf = TITLE_KITS[channel.topic].slots[slot] ?? [];
  for (const subject of beat) {
    if (!shelf.includes(subject)) problems.push(`${channel.name} is about "${subject}", which is not on the ${channel.topic} shelf`);
  }
  // A channel that only ever says one thing runs out inside a year.
  if (beat.length < 2) problems.push(`${channel.name} has a beat of one subject and will repeat itself`);
}

for (const id of Object.keys(RUNTIMES)) {
  if (!REAL_CHANNELS.some((c) => c.id === id)) problems.push(`a runtime is set for ${id}, which is not a channel`);
}

// --- Thumbnails and comments ------------------------------------------------

const thumbIds = new Set();
for (const thumbnail of THUMBNAILS) {
  if (thumbIds.has(thumbnail.id)) problems.push(`two thumbnails share the id ${thumbnail.id}`);
  thumbIds.add(thumbnail.id);
  for (const word of thumbnail.label.split(' ')) {
    if (!/^[A-Z0-9]/.test(word)) problems.push(`thumbnail "${thumbnail.label}" is not Title Case`);
  }
  if (thumbnail.clickBias < 0.5 || thumbnail.clickBias > 2) problems.push(`${thumbnail.label} has a click bias of ${thumbnail.clickBias}`);
}
if (THUMBNAILS.length < 5) problems.push('there are too few thumbnails to be a choice');

const comments = commentSpace();
if (comments < 60) problems.push(`only ${comments} comments in the library`);

const totalTitles = TOPICS.reduce((sum, topic) => sum + titleSpace(topic), 0);
console.log(`\n${REAL_CHANNELS.length} channels across ${TOPICS.length} subjects.`);
console.log(`${totalTitles.toLocaleString('en-US')} ways of naming a video, ${comments} things a comment section says, ${THUMBNAILS.length} thumbnails.`);
console.log(`${Object.keys(BEATS).length} channels keep to a beat; ${Object.keys(RUNTIMES).length} keep to a runtime.`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('The app has a world behind it.');
