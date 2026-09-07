/**
 * The photo app, the text app and the clip app have a world behind them.
 *
 * The same measurement the video app gets, for the same reason: the claim in
 * the docs should be a number and not a feeling. This counts the accounts, the
 * subjects they cover, and how many different things each subject can say on
 * each app, and it holds the line that the two apps are written apart — a
 * caption kit, a post kit and a hook kit for a subject must not be the same
 * words.
 *
 * It also holds the line on who these people are: SLATE's own, invented on
 * purpose, so no real person's follower count is ever stated as fact.
 */

import {
  PHOTO_PROFILES, PROFILE_NOTE, REAL_PROFILES, SOCIAL_TOPICS, SOCIAL_TOPIC_LABEL, TEXT_PROFILES,
} from '../src/engine/content/socialworld.ts';
import {
  CAPTION_FRAME, CAPTION_KITS, PHOTO_COMMENTS, PLACES, POST_FRAME, POST_KITS, REPLY_LINES,
  TOPIC_COMMENTS, TOPIC_TAGS, textSpace,
} from '../src/engine/content/socialposts.ts';
import {
  CLIP_COMMENTS, CLIP_FRAME, CLIP_KITS, CLIP_NOTE, CLIP_PROFILES, CLIP_TAGS, SOUNDS, clipSpace,
} from '../src/engine/content/clipworld.ts';
import { readFileSync } from 'node:fs';

/** How many different captions a subject needs before a grid repeats itself. */
const CAPTION_FLOOR = 2_000;
/** How many different posts a subject needs before a timeline repeats itself. */
const POST_FLOOR = 400;
/** How many different hooks a subject needs before the clip feed repeats. */
const CLIP_FLOOR = 400;
/** How many accounts a subject needs on an app before its feed is one voice. */
const PROFILES_PER_TOPIC = 2;

const problems = [];

// --- The roster -------------------------------------------------------------

const ids = new Set();
const handles = new Set();
const names = new Set();
const photoTopics = new Map();
const textTopics = new Map();
const clipTopics = new Map();

for (const profile of REAL_PROFILES) {
  const photo = PHOTO_PROFILES.includes(profile);
  if (ids.has(profile.id)) problems.push(`two accounts share the id ${profile.id}`);
  if (handles.has(profile.handle)) problems.push(`two accounts share the handle ${profile.handle}`);
  if (names.has(profile.name)) problems.push(`two accounts are called ${profile.name}`);
  ids.add(profile.id); handles.add(profile.handle); names.add(profile.name);

  const bucket = photo ? photoTopics : textTopics;
  bucket.set(profile.topic, (bucket.get(profile.topic) ?? 0) + 1);

  if (!SOCIAL_TOPICS.includes(profile.topic)) problems.push(`${profile.name} is about ${profile.topic}, which is not a subject`);
  if (profile.followers < 10_000) problems.push(`${profile.name} has almost nobody`);
  if (profile.cadenceDays < 1 || profile.cadenceDays > 14) problems.push(`${profile.name} posts every ${profile.cadenceDays} days`);
  if (profile.craft < 60 || profile.craft > 100) problems.push(`${profile.name} has a craft of ${profile.craft}`);
  if (!/^[a-z0-9._]+$/.test(profile.handle)) problems.push(`${profile.name} has the handle ${profile.handle}`);
  if (profile.bio.length < 12) problems.push(`${profile.name} says almost nothing about itself`);
  if (!/[.!?]$/.test(profile.bio)) problems.push(`${profile.name} does not finish its sentence`);
  for (const word of profile.name.split(' ')) {
    if (!/^[A-Z0-9]/.test(word)) problems.push(`${profile.name} is not Title Case`);
  }
  const prefix = photo ? 'p_' : 't_';
  if (!profile.id.startsWith(prefix)) problems.push(`${profile.name} is on the wrong app for its id`);
}

// The clip app's own roster, held to the same line as the other two.
for (const profile of CLIP_PROFILES) {
  if (ids.has(profile.id)) problems.push(`two accounts share the id ${profile.id}`);
  if (handles.has(profile.handle)) problems.push(`two accounts share the handle ${profile.handle}`);
  if (names.has(profile.name)) problems.push(`two accounts are called ${profile.name}`);
  ids.add(profile.id); handles.add(profile.handle); names.add(profile.name);
  clipTopics.set(profile.topic, (clipTopics.get(profile.topic) ?? 0) + 1);

  if (!SOCIAL_TOPICS.includes(profile.topic)) problems.push(`${profile.name} is about ${profile.topic}, which is not a subject`);
  if (profile.followers < 10_000) problems.push(`${profile.name} has almost nobody`);
  if (profile.cadenceDays < 1 || profile.cadenceDays > 14) problems.push(`${profile.name} posts every ${profile.cadenceDays} days`);
  if (profile.craft < 60 || profile.craft > 100) problems.push(`${profile.name} has a craft of ${profile.craft}`);
  if (!/^[a-z0-9._]+$/.test(profile.handle)) problems.push(`${profile.name} has the handle ${profile.handle}`);
  // The bios here are the app's own voice: lowercase, unfinished on purpose.
  if (profile.bio.length < 10) problems.push(`${profile.name} says almost nothing about itself`);
  if (/^[A-Z]/.test(profile.bio)) problems.push(`${profile.name} writes its bio like the other apps`);
  for (const word of profile.name.split(' ')) {
    if (!/^[A-Z0-9]/.test(word)) problems.push(`${profile.name} is not Title Case`);
  }
  if (!profile.id.startsWith('c_')) problems.push(`${profile.name} is on the wrong app for its id`);
}

// --- What each subject can say ----------------------------------------------

for (const topic of SOCIAL_TOPICS) {
  const captions = textSpace(CAPTION_KITS[topic], CAPTION_FRAME, { tags: TOPIC_TAGS[topic] ?? [] });
  const posts = textSpace(POST_KITS[topic], POST_FRAME);
  const clips = clipSpace(CLIP_KITS[topic], CLIP_FRAME);
  const onPhoto = photoTopics.get(topic) ?? 0;
  const onText = textTopics.get(topic) ?? 0;
  const onClip = clipTopics.get(topic) ?? 0;
  const thin = captions < CAPTION_FLOOR || posts < POST_FLOOR || clips < CLIP_FLOOR
    || onPhoto < PROFILES_PER_TOPIC || onText < PROFILES_PER_TOPIC || onClip < PROFILES_PER_TOPIC;
  console.log(
    `${thin ? 'THIN' : 'ok  '} ${topic.padEnd(9)}`
    + ` ${String(onPhoto).padStart(3)} photo · ${String(onText).padStart(3)} text`
    + ` · ${String(onClip).padStart(3)} clip`
    + ` · ${String(captions).padStart(8)} captions · ${String(posts).padStart(7)} posts`
    + ` · ${String(clips).padStart(7)} hooks`,
  );
  if (captions < CAPTION_FLOOR) problems.push(`${topic}: only ${captions} captions, and the floor is ${CAPTION_FLOOR}`);
  if (posts < POST_FLOOR) problems.push(`${topic}: only ${posts} posts, and the floor is ${POST_FLOOR}`);
  if (onPhoto < PROFILES_PER_TOPIC) problems.push(`${topic}: only ${onPhoto} accounts on the photo app`);
  if (onText < PROFILES_PER_TOPIC) problems.push(`${topic}: only ${onText} accounts on the text app`);
  if (clips < CLIP_FLOOR) problems.push(`${topic}: only ${clips} hooks, and the floor is ${CLIP_FLOOR}`);
  if (onClip < PROFILES_PER_TOPIC) problems.push(`${topic}: only ${onClip} accounts on the clip app`);
  if (!CLIP_TAGS[topic] || CLIP_TAGS[topic].length < 3) problems.push(`${topic} has too few tags on the clip app`);
  if (!SOCIAL_TOPIC_LABEL[topic]) problems.push(`${topic} has no label`);
  if (!TOPIC_TAGS[topic] || TOPIC_TAGS[topic].length < 3) problems.push(`${topic} has too few tags`);
  if (!TOPIC_COMMENTS[topic] || TOPIC_COMMENTS[topic].length < 4) problems.push(`${topic} has too few comments of its own`);

  // The two apps are written apart. If a subject says the same sentence on
  // both, one of the two generators has been copied into the other.
  const shared = CAPTION_KITS[topic].patterns.filter((p) => POST_KITS[topic].patterns.includes(p));
  for (const line of shared) problems.push(`${topic} says "${line}" on both apps`);
  const alsoClip = CLIP_KITS[topic].patterns.filter(
    (p) => CAPTION_KITS[topic].patterns.includes(p) || POST_KITS[topic].patterns.includes(p),
  );
  for (const line of alsoClip) problems.push(`${topic} says "${line}" on the clip app as well`);
}

// --- The rooms under a post -------------------------------------------------

if (PHOTO_COMMENTS.length < 20) problems.push(`only ${PHOTO_COMMENTS.length} general comments under a photograph`);
if (REPLY_LINES.length < 20) problems.push(`only ${REPLY_LINES.length} replies on the text app`);
if (PLACES.length < 10) problems.push(`only ${PLACES.length} places a photograph says it was taken`);
for (const line of PHOTO_COMMENTS) {
  if (REPLY_LINES.includes(line)) problems.push(`"${line}" is said on both apps`);
}
if (CLIP_COMMENTS.length < 20) problems.push(`only ${CLIP_COMMENTS.length} comments under a clip`);
if (SOUNDS.length < 12) problems.push(`only ${SOUNDS.length} sounds to shoot a clip to`);
for (const line of CLIP_COMMENTS) {
  if (PHOTO_COMMENTS.includes(line) || REPLY_LINES.includes(line)) {
    problems.push(`"${line}" is said under a clip and on another app as well`);
  }
}

// --- The claim in the file --------------------------------------------------

const WORDS = {
  'two hundred and forty': 240, 'two hundred and fifty': 250, 'two hundred and sixty': 260,
  'two hundred and seventy': 270, 'two hundred and eighty': 280, 'two hundred and ninety': 290,
  'three hundred': 300,
};
const source = readFileSync(new URL('../src/engine/content/socialworld.ts', import.meta.url), 'utf8');
const claim = source.match(/\* ([A-Z][a-z]+ hundred and [a-z]+(?: [a-z]+)?) accounts/);
if (!claim) problems.push('the file no longer says how many accounts there are');
else {
  const said = WORDS[claim[1].toLowerCase()];
  if (said === undefined) problems.push(`cannot read the claim "${claim[1]} accounts"`);
  else if (said !== REAL_PROFILES.length) {
    problems.push(`the file claims ${said} accounts and there are ${REAL_PROFILES.length}`);
  }
}
if (!/SLATE/.test(PROFILE_NOTE) || !/Nobody real/.test(PROFILE_NOTE)) {
  problems.push('the note that says these are not real people has gone');
}
if (!/SLATE/.test(CLIP_NOTE) || !/Nobody real/.test(CLIP_NOTE)) {
  problems.push('the clip app has lost the note that says these are not real people');
}

const CLIP_WORDS = {
  eighty: 80, 'eighty five': 85, ninety: 90, 'ninety one': 91, 'ninety five': 95,
  'a hundred': 100, 'a hundred and ten': 110,
};
const clipSource = readFileSync(new URL('../src/engine/content/clipworld.ts', import.meta.url), 'utf8');
const clipClaim = clipSource.match(/\* ([A-Za-z]+(?: [a-z]+)?(?: and [a-z]+)?) accounts/);
if (!clipClaim) problems.push('the clip file no longer says how many accounts there are');
else {
  const said = CLIP_WORDS[clipClaim[1].toLowerCase()];
  if (said === undefined) problems.push(`cannot read the claim "${clipClaim[1]} accounts"`);
  else if (said !== CLIP_PROFILES.length) {
    problems.push(`the clip file claims ${said} accounts and there are ${CLIP_PROFILES.length}`);
  }
}

const totalCaptions = SOCIAL_TOPICS.reduce(
  (sum, topic) => sum + textSpace(CAPTION_KITS[topic], CAPTION_FRAME, { tags: TOPIC_TAGS[topic] ?? [] }), 0,
);
const totalPosts = SOCIAL_TOPICS.reduce((sum, topic) => sum + textSpace(POST_KITS[topic], POST_FRAME), 0);
const totalClips = SOCIAL_TOPICS.reduce((sum, topic) => sum + clipSpace(CLIP_KITS[topic], CLIP_FRAME), 0);
const everybody = REAL_PROFILES.length + CLIP_PROFILES.length;
console.log(`\n${everybody} accounts across ${SOCIAL_TOPICS.length} subjects`
  + ` — ${PHOTO_PROFILES.length} on the photo app, ${TEXT_PROFILES.length} on the text app,`
  + ` ${CLIP_PROFILES.length} on the clip app.`);
console.log(`${totalCaptions.toLocaleString('en-US')} captions, ${totalPosts.toLocaleString('en-US')} posts`
  + ` and ${totalClips.toLocaleString('en-US')} hooks.`);
console.log(`${PHOTO_COMMENTS.length} general comments, ${REPLY_LINES.length} replies,`
  + ` ${CLIP_COMMENTS.length} under a clip, ${SOUNDS.length} sounds, ${PLACES.length} places.`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('All three apps have a world behind them.');
