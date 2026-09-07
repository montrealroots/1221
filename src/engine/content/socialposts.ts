/**
 * SLATE — what the photo app and the text app actually say.
 *
 * Two generators, deliberately unlike each other. A caption under a photograph
 * is short, lowercase in spirit, and often not about the photograph at all. A
 * post on the text app is an argument, a correction, a number or a joke, and it
 * carries the tone of somebody expecting to be replied to. Writing both from
 * one set of patterns would produce captions that read like posts, which is the
 * single easiest way to make a fake social app feel fake.
 *
 * Everything is seeded from the account and the index, so a save always has the
 * same feed and two saves never have the same one.
 */

import type { Rng } from '../core/rng';
import type { SocialTopic } from './socialworld';

export interface PostKit {
  patterns: readonly string[];
  slots: Readonly<Record<string, readonly string[]>>;
}

const WHEN = ['this morning', 'last night', 'yesterday', 'on Sunday', 'at six', 'before work', 'in the rain', 'on the way home'];
const MOOD = [
  'worth it', 'not sorry', 'happy with this one', 'still thinking about it', 'first go',
  'third attempt', 'took long enough', 'do not ask how many goes', 'no notes',
  'better than it looks', 'quietly pleased', 'never doing that again',
];

/** Moods that only mean anything under a photograph. */
const LOOK_MOOD = [
  ...MOOD, 'no filter, no need', 'the light did the work', 'straight off the roll',
  'the sky did that, not me', 'cropped nothing',
];

/**
 * A caption is rarely only its sentence. It trails off, or it is prefaced, or
 * it ends in the tags an account always ends in. Those are the same shapes on
 * every account, so they live here once and are hung on whatever the topic
 * generated, which is what makes two thousand posts stop repeating themselves.
 */
const CAPTION_TAILS = [
  'more of these soon', 'swipe for the rest', 'link in the bio', 'prints available',
  'no idea why I like this one', 'happy to be wrong', 'back tomorrow',
  'saved this one for the grid', 'shot on the way to something else',
  'this took all week', 'thank you for the messages about the last one',
  'recipe below', 'tell me what you would have done', 'one of about nine',
  'the outtakes are worse', 'first time trying this', 'not sponsored, just good',
  'apologies to everybody who was waiting', 'part two later', 'the caption is the hard bit',
];

/** How a caption is put together. Plain is listed most because most are plain. */
export const CAPTION_FRAME: PostKit = {
  patterns: [
    '{body}', '{body}', '{body}',
    '{body}. {tail}',
    '{tail}. {body}',
    '{body} — {tail}',
    '{body} ({tail})',
    '{body}\n\n{tags}',
    '{body}. {tail}\n\n{tags}',
    '{body}\n\n{tail}',
    '{body}\n\n{tail}\n\n{tags}',
  ],
  slots: { tail: CAPTION_TAILS },
};

/** A post on the text app is often one sentence with another stuck to it. */
const POST_OPENERS = [
  'Right.', 'Saying this again.', 'For the avoidance of doubt.', 'Late to this.',
  'Every year, this.', 'Genuinely.', 'One more time.', 'Nobody asked, but.',
  'Filing this here.', 'Second attempt at posting this.', 'Because somebody will ask.',
  'Reposting because it happened again.',
];

const POST_ASIDES = [
  'Not a hard question.', 'Numbers in the reply.', 'Happy to be argued with.',
  'This is not controversial.', 'It has been like this for years.',
  'Nobody wants to hear it.', 'Sources at the bottom.', 'I have checked twice.',
  'That is the entire post.', 'Correct me if I am wrong.',
  'Working on a longer version of this.', 'Ask anybody who does the job.',
  'Screenshotting this for later.', 'It is not complicated.',
];

const POST_CLOSERS = [
  'Anyway.', 'Make of that what you will.', 'Nothing will change.',
  'That is all.', 'Back to work.', 'Do with that what you like.',
  'And yes, I checked.', 'Thread if anybody wants it.',
  'Muting this one, sorry.', 'Will regret posting this.', 'Ends.',
  'Replies are going to be a joy.',
];

export const POST_FRAME: PostKit = {
  patterns: [
    '{body}', '{body}', '{body}', '{body}',
    '{opener} {body}',
    '{body} {aside}',
    '{body} {closer}',
    '{opener} {body} {closer}',
    '{opener} {body} {aside}',
    '{body} {aside} {closer}',
  ],
  slots: { opener: POST_OPENERS, aside: POST_ASIDES, closer: POST_CLOSERS },
};

/** What each kind of account tags a photograph with. */
export const TOPIC_TAGS: Readonly<Record<SocialTopic, readonly string[]>> = {
  photo: ['#filmphotography #35mm', '#believeinfilm', '#shotonfilm #grain', '#availablelight'],
  street: ['#streetphotography', '#streetsofnowhere', '#candid #street', '#thestreetphotographyhub'],
  food: ['#homecooking', '#slowfood #dinner', '#baking #sourdough', '#eatlocal'],
  fashion: ['#menswear', '#slowfashion', '#secondhandfirst', '#tailoring #fit'],
  travel: ['#slowtravel', '#traveldiary', '#offseason', '#bytrain'],
  design: ['#interiordesign', '#architecture', '#designdetail', '#renovation'],
  fitness: ['#training', '#runeveryday', '#strengthwork', '#recovery'],
  film: ['#cinematography', '#onset', '#filmmaking', '#behindthescenes'],
  music: ['#livemusic', '#studiolife', '#vinyl', '#nowplaying'],
  news: ['#reporting', '#localnews', '#press', '#publicinterest'],
  sport: ['#matchday', '#nonleague', '#training', '#thegame'],
  comedy: ['#standup', '#worksinprogress', '#comedy', '#openmic'],
  tech: ['#buildinpublic', '#devlife', '#opensource', '#hardware'],
  politics: ['#localdemocracy', '#publicrecord', '#policy', '#accountability'],
  books: ['#currentlyreading', '#bookstagram', '#tbr', '#secondhandbooks'],
  business: ['#smallbusiness', '#trade', '#thehighstreet', '#books'],
};

// ---------------------------------------------------------------------------
// Captions
// ---------------------------------------------------------------------------

export const CAPTION_KITS: Readonly<Record<SocialTopic, PostKit>> = {
  photo: {
    patterns: [
      '{subject}, {when}',
      '{subject}. {mood}',
      'waited forty minutes for this one',
      '{gear}, wide open, {when}',
      'the whole roll was worth it for this',
      '{subject} — {mood}',
      'nothing clever, just {subject}',
      'shot {when} and nearly deleted it',
      '{subject}. printed this one',
      'the last frame on the roll',
      'straight out of camera',
      '{gear} and a lot of luck',
    ],
    slots: {
      when: WHEN, mood: LOOK_MOOD,
      subject: ['low cloud on the ridge', 'a wet street', 'the harbor at first light', 'somebody waiting', 'the same corner again', 'a window, and what was behind it', 'the last of the sun', 'fog on the water', 'a doorway', 'the market, packing up', 'reflections', 'a hand on a railing'],
      gear: ['35mm', '50mm', 'the old zoom', 'a borrowed lens', 'the pocket camera', 'medium format'],
    },
  },
  street: {
    patterns: [
      '{subject}, {when}',
      'nobody noticed me taking this',
      '{subject}. {mood}',
      'same corner, different day',
      'walked eleven miles for four frames',
      '{subject} — worth the wait',
      'this city, {when}',
      'the light between the buildings',
      'shot from the hip',
      '{subject}, and then it was gone',
      'one second later this was nothing',
      'the whole story is in the shoes',
    ],
    slots: {
      when: WHEN, mood: LOOK_MOOD,
      subject: ['two men arguing about a van', 'a queue that went round the block', 'somebody asleep on a bench', 'a dog watching a butcher', 'the flower stall', 'a bus window', 'kids on a wall', 'the newsagent at closing', 'a wedding party crossing', 'somebody running for it'],
    },
  },
  food: {
    patterns: [
      '{dish}. {mood}',
      '{dish}, {when}',
      'made {dish} again and got it right this time',
      '{dish} with what was in the fridge',
      'recipe in the highlights. {dish}',
      'four hours for {dish} and I would do it again',
      '{dish}, {mood}',
      'the trick is {trick}',
      'no photos of the failed one',
      '{dish} for one, no waste',
      'twenty minutes. {dish}',
      'if you only make one thing this week make {dish}',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      dish: ['focaccia', 'a proper ragu', 'roast chicken', 'dal', 'sourdough', 'ramen', 'a tomato salad', 'shakshuka', 'pasta with anchovies', 'a cottage pie', 'tarte tatin', 'congee'],
      trick: ['salting it earlier', 'resting it longer', 'less water', 'a colder oven', 'more acid', 'letting it sit overnight'],
    },
  },
  fashion: {
    patterns: [
      '{garment}, {source}',
      'this {garment} is eleven years old',
      '{garment} and nothing else needed',
      'everything here was under {price}',
      '{garment}. {mood}',
      'got the {garment} taken in and it changed everything',
      'wearing the same {garment} for the fourth day',
      '{garment}, {when}',
      'the fit is the whole thing',
      'resoled these for the third time',
      '{garment} from {source}',
      'no idea what I am doing but I like this',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      garment: ['coat', 'jacket', 'knit', 'trousers', 'boots', 'shirt', 'suit', 'scarf', 'denim'],
      source: ['a charity shop', 'a market', 'my dad', 'a sample sale', 'the archive', 'the tailor'],
      price: ['twenty', 'fifty', 'a hundred'],
    },
  },
  travel: {
    patterns: [
      '{place}, {when}',
      '{place}. {mood}',
      'three days in {place} and I would go back tomorrow',
      'got the night train to {place}',
      '{place} out of season is the only way',
      'walked {place} end to end',
      '{place} on almost nothing',
      'missed the last ferry and it was the best night of the trip',
      '{place}, and the weather did what it liked',
      'one bag, two weeks, {place}',
      'nobody here but us and the wind',
      '{place} — {mood}',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      place: ['the north coast', 'a mountain town', 'the old quarter', 'the islands', 'the delta', 'a port city', 'the highlands', 'the lakes', 'a desert road', 'the far south'],
    },
  },
  design: {
    patterns: [
      '{thing}, {when}',
      'the {thing} took eleven months',
      '{thing}. {mood}',
      'first coat on the {thing}',
      'this {thing} will outlast me',
      '{thing}, from a single board',
      'nobody sees the back of the {thing} and that is not the point',
      'measured twice. cut once. mostly',
      '{thing} — {mood}',
      'the joint is the whole job',
      'finished the {thing} at half two in the morning',
      'the drawing and the built thing, side by side',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      thing: [
        'oak bench', 'spindle chair', 'run of shelves', 'trestle table', 'wall cabinet',
        'plaster lamp', 'front door', 'winding stair', 'sash window', 'garden gate',
        'kitchen island', 'window seat', 'bookcase wall', 'hall bench', 'linen press',
        'pantry door', 'stone hearth', 'plywood desk',
      ],
    },
  },
  fitness: {
    patterns: [
      '{session}, {when}',
      '{session}. {mood}',
      'week nine of {session}',
      'nothing clever. {session}',
      'the boring bit is the bit that works',
      '{session} and then a very long shower',
      'six in the morning is the only time it happens',
      '{session}, and it did not feel good until the end',
      'consistency over everything',
      'rest day and I hate it',
      '{session} — {mood}',
      'the log does not lie',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      session: ['easy miles', 'squats', 'intervals', 'a long swim', 'hill repeats', 'deadlifts', 'a walk', 'the bike'],
    },
  },
  film: {
    patterns: [
      'on set, {when}',
      '{thing}. {mood}',
      'day eleven of twenty two',
      'the {thing} took all afternoon',
      'wrapped',
      'first day, and nothing is on fire yet',
      '{thing}, {when}',
      'the crew, at four in the morning',
      'nobody credits the {thing} and everybody notices it',
      'blocking, and then blocking again',
      'the monitor lies',
      '{thing} — {mood}',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      thing: ['lighting setup', 'dolly track', 'first shot', 'last shot', 'rain rig', 'crane move', 'night exterior', 'lunch'],
    },
  },
  music: {
    patterns: [
      '{thing}, {when}',
      '{thing}. {mood}',
      'one take, live, no fixes',
      'wrote this on the train',
      'the {thing} took nine hours',
      '{thing} — {mood}',
      'room mics only',
      'nobody is going to hear the {thing} and it matters anyway',
      'rehearsal, {when}',
      'the demo is better than the record and I know it',
      'small room, loud band',
      'finished it at four in the morning',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      thing: ['bass part', 'drum sound', 'string arrangement', 'vocal take', 'second verse', 'mix', 'pedalboard', 'piano'],
    },
  },
  news: {
    patterns: [
      '{subject}, {when}',
      'reporting on {subject} this week',
      '{subject}. more when we have it',
      'from the {place}, {when}',
      'the {subject} story, in pictures',
      '{subject} — {mood}',
      'this is what {subject} actually looks like',
      'permission given, faces obscured',
      'the queue for {subject}',
      'nobody was expecting this many people',
      '{subject}, and nobody in charge on site',
      'day four of {subject}',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      subject: ['the closure', 'the flooding', 'the march', 'the strike', 'the inquiry', 'the rebuild', 'the shortage'],
      place: ['picket line', 'town hall', 'harbour', 'depot', 'site office'],
    },
  },
  sport: {
    patterns: [
      '{thing}, {when}',
      '{thing}. {mood}',
      'from the away end',
      'four hours on a coach for this',
      '{thing} — {mood}',
      'the last minute of it',
      'nobody left early',
      'the away end, singing, two nil down',
      'training, {when}',
      'the boots after',
      'ninety minutes and my voice is gone',
      '{thing}, and the pitch was a swamp',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      thing: ['the equalizer', 'the warm up', 'full time', 'the tunnel', 'the away end', 'the celebration', 'the bench'],
    },
  },
  comedy: {
    patterns: [
      '{thing}. {mood}',
      'this went better than it had any right to',
      'new material, {when}',
      'the room was twelve people and one of them was staff',
      '{thing}, {when}',
      'bombed and learned something',
      'first paid gig',
      'the bit about {thing} finally works',
      'we are not funny people, we just say things',
      'six minutes, no notes',
      'nobody laughed at the good one',
      '{thing} — {mood}',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      thing: ['weddings', 'airports', 'landlords', 'group chats', 'bin day', 'car parks'],
    },
  },
  tech: {
    patterns: [
      '{thing}, {when}',
      '{thing}. {mood}',
      'the desk, finally finished',
      'took the {thing} apart and it is worse inside',
      '{thing} — {mood}',
      'cable management is a lie',
      'this {thing} is nine years old and still fine',
      'benchmarks in the next post',
      'the {thing} that finally fixed it',
      'four hours of setup, ten seconds of joy',
      'everything in the bag',
      '{thing}, opened up',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      thing: ['laptop', 'camera', 'keyboard', 'server', 'monitor', 'router', 'drive', 'microphone'],
    },
  },
  politics: {
    patterns: [
      '{subject}, {when}',
      'outside the {place}, {when}',
      '{subject}. more shortly',
      'the room for {subject}',
      'nobody from the department turned up',
      '{subject} — {mood}',
      'the crowd for {subject}',
      'papers handed out at the door',
      'the vote, {when}',
      'this is the third meeting about it',
      'they were expecting forty and got six hundred',
      '{subject}, and it went on until midnight',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      subject: ['the vote', 'the consultation', 'the hearing', 'the debate', 'the announcement'],
      place: ['town hall', 'committee room', 'chamber', 'gates'],
    },
  },
  books: {
    patterns: [
      '{thing}, {when}',
      'finished {thing} on the train',
      '{thing}. {mood}',
      'the pile is winning',
      'reading {thing} for the third time',
      'one line from {thing} and I had to stop',
      '{thing} — {mood}',
      'charity shop, one pound',
      'first edition, foxed, perfect',
      'started {thing} and cannot put it down',
      'the shelf, rearranged again',
      '{thing}, {when}',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      thing: ['this one', 'the new one', 'a reread', 'the biography', 'the short stories', 'the essays'],
    },
  },
  business: {
    patterns: [
      '{thing}, {when}',
      'the numbers for {thing}',
      '{thing}. {mood}',
      'first month in the new place',
      'signed the lease',
      '{thing} — {mood}',
      'twelve hours and the till agrees',
      'the quiet Tuesday that pays for the Saturday',
      'stock day',
      'four years today',
      '{thing}, {when}',
      'nobody tells you about the paperwork',
    ],
    slots: {
      when: WHEN, mood: MOOD,
      thing: ['the shop', 'the workshop', 'the van', 'the counter', 'the first order', 'the accounts'],
    },
  },
};

// ---------------------------------------------------------------------------
// Posts on the text app
// ---------------------------------------------------------------------------

export const POST_KITS: Readonly<Record<SocialTopic, PostKit>> = {
  news: {
    patterns: [
      'Confirmed: {subject}. More shortly.',
      '{subject}. We have asked for a response and will post it here.',
      'Correction: an earlier post said {subject}. It did not. Apologies.',
      'The document on {subject} is now public. Reading it now.',
      'Three things about {subject} that are not in the headline.',
      '{subject} is not new. It has been happening since {year}.',
      'Nobody has answered the obvious question about {subject}.',
      'Source on {subject}, in full, in the reply.',
      'This is the fourth time {subject} has been announced.',
      '{subject}: what we know, what we do not, and what is being briefed.',
      'The number everybody is quoting on {subject} is from a press release.',
      'We spent six weeks on {subject}. It publishes tomorrow.',
    ],
    slots: {
      subject: ['the closure', 'the contract', 'the shortage', 'the inquiry', 'the overrun', 'the recall', 'the ruling', 'the audit', 'the delay', 'the merger'],
      year: ['2019', '2021', 'before the pandemic', 'the last review'],
    },
  },
  politics: {
    patterns: [
      'The line on {subject} has changed three times this week.',
      '{subject}: the actual text says something different.',
      'Reading {subject} so you do not have to. Thread.',
      'Nobody voted for {subject}, and everybody is about to get it.',
      'The costing on {subject} does not survive a calculator.',
      '{subject} passed at eleven at night with nine people in the room.',
      'This is the amendment that matters in {subject}.',
      'Whatever you think about {subject}, the process was a mess.',
      'Two years of consultation on {subject}, ignored in a fortnight.',
      'The impact assessment for {subject} is four pages long.',
      '{subject} is popular in every poll and in no committee.',
      'Filed a request about {subject} in March. Still waiting.',
    ],
    slots: {
      subject: ['the bill', 'the reshuffle', 'the funding formula', 'the review', 'the pilot scheme', 'the levy', 'the moratorium', 'the framework'],
    },
  },
  film: {
    patterns: [
      '{picture} opened to {number} and nobody is admitting that is fine.',
      'The problem with {picture} is structural and it is on page {page}.',
      'Watched {picture} again. The {element} is doing all the work.',
      '{picture} is going to be reassessed in ten years and I will be here.',
      'Casting on {picture} is closed. It was closed a month ago.',
      'Nobody talks about how well {picture} is cut.',
      'The {element} in {picture} is the only reason it works.',
      '{picture} cost more to market than to make.',
      'A film like {picture} used to open on two thousand screens.',
      'The best thing about {picture} is what it does not explain.',
      'Genuinely do not understand the reaction to {picture}.',
      '{picture}, third act, the {element}. That is the whole review.',
    ],
    slots: {
      picture: ['A Second Language', 'Northbound', 'Glasshouse', 'The Long Weekend', 'Fault Lines', 'Low Tide', 'The Paper House', 'Winter Term'],
      element: ['sound design', 'editing', 'blocking', 'score', 'casting', 'production design'],
      number: ['under four million', 'nine and a bit', 'twelve', 'thirty one'],
      page: ['forty', 'sixty two', 'eighty eight'],
    },
  },
  sport: {
    patterns: [
      '{team} {score}. That is the game, and it was not close.',
      'The underlying numbers on {team} have been bad for six weeks.',
      '{team} are one injury from a very long winter.',
      'Nobody at {team} is going to say this out loud so I will.',
      'That is the third time {team} have conceded from that corner.',
      '{team} {score} and the manager is still talking about spirit.',
      'The transfer story about {team} is from an agent. It always is.',
      'Watch the {position} on the second goal. That is coaching.',
      '{team} have played nine games in twenty seven days.',
      'The away end at {team} deserved better than that.',
      'One shot on target. {team}. At home.',
      'This is what {team} look like when the press works.',
    ],
    slots: {
      team: ['the away side', 'the champions', 'the promoted lot', 'the home team', 'the bottom three', 'the leaders'],
      score: ['drew goalless', 'won three one', 'drew two apiece', 'won four nil', 'won one nil'],
      position: ['left back', 'holding midfielder', 'keeper', 'center half'],
    },
  },
  business: {
    patterns: [
      '{company} said {claim} on the call. The filing says otherwise.',
      'Margins at {company} have been falling for five quarters.',
      '{company} is a property business with a {sector} attached.',
      'The interesting number in the {company} results is on page eleven.',
      '{company} announced {number} jobs going and called it a realignment.',
      'Nobody buys {sector} at that multiple unless they know something.',
      'The {sector} shortage is a shipping problem, not a demand problem.',
      '{company} has changed its definition of the metric again.',
      'A small business does not get thirty day terms. It gets ninety.',
      'The rate move puts {number} on a typical mortgage. That is the story.',
      'Everybody in {sector} knows this and nobody will say it.',
      '{company}: revenue up, cash down. Ask why.',
    ],
    slots: {
      company: ['the retailer', 'the operator', 'the group', 'the chain', 'the manufacturer', 'the platform'],
      claim: ['demand was strong', 'the integration was complete', 'costs were under control', 'the guidance was unchanged'],
      sector: ['logistics', 'grocery', 'hospitality', 'construction', 'software', 'shipping'],
      number: ['four hundred', 'twelve hundred', 'ninety', 'two thousand'],
    },
  },
  tech: {
    patterns: [
      'The {thing} update broke {other}. Rolling back.',
      'Nobody needs {thing} to be a subscription.',
      'Spent four hours on {thing} and the answer was a semicolon.',
      '{thing} has been unmaintained for two years and half the world runs on it.',
      'The {thing} benchmark everybody quotes is run at settings nobody uses.',
      'If your {thing} needs a login to work offline, it is not yours.',
      '{thing}: fast, until it is not.',
      'Post mortem on the {thing} outage is worth reading in full.',
      'Every {thing} problem is a {other} problem wearing a hat.',
      'The best {thing} I own is nine years old.',
      'They removed the {thing} setting and called it simplification.',
      'Read the {thing} license before you build on it.',
    ],
    slots: {
      thing: ['router', 'build system', 'phone', 'library', 'editor', 'driver', 'backup', 'API'],
      other: ['DNS', 'the cache', 'permissions', 'the clock', 'encoding'],
    },
  },
  comedy: {
    patterns: [
      '{setup}',
      '{setup} Anyway.',
      'My {relation} just said {setup}',
      'Overheard: {setup}',
      'Nobody: absolutely nobody: me, at {time}: {setup}',
      '{setup} I will not be taking questions.',
      'Update on {topic}: worse.',
      'Every {topic} is just {setup}',
      'Started {topic}. Immediately regretted it.',
      '{setup} And that is the whole tweet.',
      'The {topic} industrial complex has gone too far.',
      'Sorry, {setup}',
    ],
    slots: {
      setup: ['I have been on hold for so long I know the album', 'the self checkout has accused me of theft again', 'a man in the queue is explaining sourdough to nobody', 'my train is late because of a train', 'the wedding invite says smart casual and I am at war'],
      relation: ['dad', 'flatmate', 'boss', 'neighbour'],
      topic: ['group chats', 'weddings', 'bin day', 'airports', 'landlords'],
      time: ['three in the morning', 'the dentist', 'a funeral'],
    },
  },
  books: {
    patterns: [
      'Finished {book}. The last forty pages justify the first three hundred.',
      '{book} is doing something with time that I have not seen before.',
      'Nobody is reviewing {book} honestly because of who published it.',
      'The opening sentence of {book} is the whole book.',
      '{book} would be better at half the length and everybody knows it.',
      'Reread {book} at thirty and it is a different novel.',
      'The advance for {book} was bigger than its print run.',
      '{book}: beautifully written, about nothing.',
      'If you bounced off {book} the first time, start at part two.',
      'A first novel like {book} does not come along often.',
      'Publishing will now produce forty books that look like {book}.',
      'The paperback of {book} has fixed the cover, thankfully.',
    ],
    slots: {
      book: ['the debut', 'the new one', 'the translation', 'the reissue', 'the short stories', 'the memoir'],
    },
  },
  food: {
    patterns: [
      'A sandwich should not cost {price}.',
      'The {dish} at that place is {price} and worth exactly none of it.',
      'Everybody has decided {ingredient} is over. Everybody is wrong.',
      'Restaurants are not expensive. Rent is expensive.',
      '{dish} is a technique, not a recipe.',
      'The {ingredient} shortage is going to show up on menus in six weeks.',
      'Salt it earlier. That is the whole thread.',
      'A basket that cost {price} in January costs more now.',
      'Nobody needs {ingredient} in {dish}.',
      'The best meal I have had this year cost {price}.',
      'If the menu has forty things on it, the freezer has forty things in it.',
      '{dish}: two ingredients, done properly.',
    ],
    slots: {
      dish: ['carbonara', 'a roast', 'ramen', 'dal', 'a chop', 'risotto'],
      ingredient: ['anchovies', 'butter', 'truffle oil', 'miso', 'chilli', 'stock'],
      price: ['nine pounds', 'fourteen', 'twenty two', 'four fifty'],
    },
  },
  travel: {
    patterns: [
      'The night train to {place} is still the best way to do it.',
      '{place} is three hours by rail and everybody flies it.',
      'Fares to {place} have doubled since the timetable changed.',
      'Missed the connection at {place}. Sleeping in the station.',
      'Nobody tells you the last bus from {place} is at six.',
      '{place} out of season, half the price, none of the queue.',
      'The visa page for {place} contradicts itself twice.',
      'Two changes and four hours to {place}. Worth it.',
      'The airport at {place} is a car park with a runway.',
      'Everything I own for two weeks in {place}, in one bag.',
      '{place} in the rain is better. I will not be arguing about this.',
      'The ferry to {place} has been canceled again.',
    ],
    slots: {
      place: ['the north coast', 'the islands', 'the border', 'the lakes', 'the old town', 'the far south', 'the port'],
    },
  },
  music: {
    patterns: [
      'The {element} on that record is why it still works.',
      'Nobody has written a better {element} since.',
      'The demo of {song} is better than the album version.',
      'That whole album was made in {days} days.',
      '{song} is three chords and a great idea.',
      'The {element} is doing the emotional work and the singer is getting the credit.',
      'Small venues are closing faster than anybody is counting.',
      'You can hear the room on {song}. That is the point.',
      'The reissue of {song} is quieter and better.',
      'Session players made half the records you love.',
      '{song} at half speed is a completely different song.',
      'The {element} at 2:41. That is the whole post.',
    ],
    slots: {
      element: ['bass line', 'drum sound', 'string part', 'harmony', 'key change', 'arrangement'],
      song: ['that single', 'the closer', 'the b side', 'the opener'],
      days: ['four', 'nine', 'eleven', 'three'],
    },
  },
  design: {
    patterns: [
      'This {thing} has been redesigned four times and is worse each time.',
      'The {thing} works because somebody removed three things.',
      'Nobody reads. Everybody scans. Design accordingly.',
      'The planning application for the {thing} is worth reading.',
      'Objecting to a {thing} on the grounds of character is doing a lot of work.',
      'A {thing} that needs a manual is a {thing} that failed.',
      'The best {thing} I have used this year is thirty years old.',
      'Every {thing} eventually becomes a form.',
      'The {thing} looks fine and takes eleven taps.',
      'Good {thing} is invisible and nobody gets promoted for it.',
      'They moved the {thing} and broke everybody muscle memory.',
      'The {thing}, before and after, in the reply.',
    ],
    slots: {
      thing: ['checkout', 'ticket machine', 'signage', 'form', 'app', 'shopfront', 'staircase', 'website'],
    },
  },
  fitness: {
    patterns: [
      'Week {week} and the boring plan is still working.',
      'Nobody gets better at {thing} in a fortnight.',
      'The injury was avoidable and it was my fault.',
      '{thing}, three times a week, for a year. That is it.',
      'Rest is training. Nobody wants to hear it.',
      'You cannot out-train sleep.',
      'The gym is full in January and empty by {month}.',
      'Doing {thing} badly for years is not experience.',
      'Progress is boring to watch and that is why it works.',
      'Came back from {injury} in eleven weeks. Slowly.',
      'The number on the bar is not the point and it is a bit the point.',
      '{thing}: technique first, then load.',
    ],
    slots: {
      week: ['four', 'nine', 'sixteen', 'twenty two'],
      thing: ['squats', 'running', 'swimming', 'pressing', 'mobility work'],
      month: ['March', 'February', 'the second week'],
      injury: ['a bad back', 'a torn calf', 'shin splints'],
    },
  },
  photo: {
    patterns: [
      'The {gear} argument is the most boring argument in photography.',
      'Shot the whole job on {lens} and nobody noticed.',
      '{principle} Everything else is a preference.',
      'The photograph everybody likes is never the one you like.',
      'Scanned {rolls} and got {keepers}.',
      'You do not need a new {gear}. You need to go outside.',
      'Prints change how you edit. Try one.',
      'Every photographer has one picture they cannot repeat.',
      'The client picked the frame I nearly deleted. Again.',
      'Nobody has ever asked what I shot it on.',
      '{principle}',
      'Thirty six frames is a discipline, not a limitation.',
      'A {lens} and {when} will teach you more than any course.',
      'Half the job is {craft}. The other half is turning up.',
      'Shot {rolls} this month and I am keeping {keepers}.',
      'If the {gear} is the interesting part, the picture is not.',
      'Learn {craft} before you buy anything.',
      'The frame I would defend in court is the one nobody liked.',
      '{principle} People forget that every ten years.',
      'Two photographers, same {lens}, same street, different work.',
      'You cannot fix {craft} in the edit.',
      'The best pictures I have are of people I asked first.',
    ],
    slots: {
      gear: ['sensor', 'camera body', 'brand', 'format', 'megapixel'],
      lens: ['one lens', 'a 35', 'a 50', 'the kit zoom', 'a borrowed 28', 'medium format'],
      principle: ['Light first.', 'Composition is what you leave out.', 'Distance is a decision.', 'Wait longer.', 'Get closer.', 'The background is half the photograph.'],
      rolls: ['four rolls', 'nine rolls', 'a hundred frames', 'three cards', 'twelve rolls'],
      keepers: ['two frames', 'one keeper', 'nothing', 'three', 'more than I expected'],
      craft: ['seeing', 'timing', 'exposure', 'framing', 'patience', 'asking'],
      when: ['an afternoon', 'a wet Tuesday', 'one long walk', 'a year of Sundays'],
    },
  },
  street: {
    patterns: [
      'Walked {miles} and got {keepers}.',
      'The city gives you about a second and a half.',
      'Nobody minds being photographed if you are honest about it.',
      'Same {spot}, four hundred times, and it is different every day.',
      'Shot from the hip for a year and my framing got better.',
      'A long lens is not street photography, it is surveillance.',
      'The best light in this city is {where} at {hour}.',
      'Ask. Most people say yes.',
      'The picture was gone before the camera was up.',
      '{weather} empties a street and fills a photograph.',
      'You cannot plan it. You can only be there.',
      'Walked {miles} this month for {keepers}.',
      '{where} at {hour} is the only reason I still live here.',
      'The {spot} has been rebuilt twice since I started shooting it.',
      'Everybody photographs {where}. Nobody photographs the {spot}.',
      '{weather} is not bad weather, it is free contrast.',
      'Standing still for an hour beats walking {miles}.',
      'The council is taking the {spot} out in March. Photograph it now.',
      'Street photography is ninety percent {failure}.',
      'Turned a corner at {hour} and there it was.',
      'You will get {keepers} out of {miles}, and that is a good day.',
      'The camera you have on you beats the one at home.',
    ],
    slots: {
      miles: ['eleven miles', 'four miles', 'half the city', 'the whole ring road', 'six hours'],
      keepers: ['one frame', 'nothing', 'two keepers', 'a single picture', 'three I like'],
      spot: ['corner', 'crossing', 'market', 'underpass', 'bus stop', 'arcade', 'flower stall'],
      where: ['between the buildings', 'under the bridge', 'along the canal', 'outside the station', 'on the seafront'],
      hour: ['five', 'half seven', 'first light', 'closing time', 'the last hour of it'],
      weather: ['Rain', 'Fog', 'A cold snap', 'Wind off the water', 'Hail'],
      failure: ['walking', 'waiting', 'missing it', 'being early', 'being wrong'],
    },
  },
  fashion: {
    patterns: [
      'Fit is the whole thing. Everything else is shopping.',
      'A {garment} that costs {price} and lasts twenty years is cheap.',
      'The {garment} has been the same shape for eighty years for a reason.',
      'Nobody notices your {garment}. They notice whether it fits.',
      'Buy the {garment} once. Get it altered. Wear it out.',
      'The second hand {garment} market is the only honest market left.',
      'That {garment} is not expensive, it is just made properly.',
      'Everybody is wearing the same {garment} and calling it personal style.',
      'Resole them. It is a third of the price of new.',
      'A tailor will do more for a {garment} than another {garment} will.',
      'The {cloth} is doing all the work.',
      'Trends are a rental agreement.',
    ],
    slots: {
      garment: ['jacket', 'coat', 'shirt', 'knit', 'pair of boots', 'suit'],
      price: ['four hundred', 'a thousand', 'sixty'],
      cloth: ['flannel', 'tweed', 'linen', 'cashmere', 'canvas'],
    },
  },
};

type Slots = Readonly<Record<string, readonly string[]>>;

function fill(pattern: string, slots: Slots, rng: Rng): string {
  return pattern.replace(/\{(\w+)\}/g, (whole, slot: string) => {
    const options = slots[slot];
    return options && options.length > 0 ? rng.pick([...options]) : whole;
  });
}

/**
 * Builds one caption or one post.
 *
 * Two stages, because that is what makes the world stop repeating itself. The
 * kit says the topic's own sentence; the frame, which every account on the app
 * shares, decides whether it is said plainly, prefaced, trailed off, or tagged.
 * A topic with three hundred sentences and a frame with fifty shapes is fifteen
 * thousand posts, and none of it had to be written twice.
 */
export function makeSocialText(
  kit: PostKit, rng: Rng, frame?: PostKit,
  options: { extra?: Slots; capitalize?: boolean } = {},
): string {
  const slots: Slots = { ...kit.slots, ...(options.extra ?? {}) };
  let body = fill(rng.pick([...kit.patterns]), slots, rng);
  // A sentence on the text app begins with a capital wherever it is put, so
  // this happens before the frame rather than to the finished string.
  if (options.capitalize) {
    body = body.charAt(0).toUpperCase() + body.slice(1);
    // A frame puts another sentence beside this one, and two sentences with no
    // full stop between them read as one broken one.
    if (frame && !/[.!?…]$/.test(body)) body += '.';
  }
  if (!frame) return body;
  return fill(rng.pick([...frame.patterns]), { ...frame.slots, ...slots, body: [body] }, rng).trim();
}

function combosIn(pattern: string, slots: Slots): number {
  let combos = 1;
  for (const [, slot] of pattern.matchAll(/\{(\w+)\}/g)) combos *= slots[slot!]?.length ?? 1;
  return combos;
}

/** How many different things a kit can say, for the checker to count. */
export function textSpace(kit: PostKit, frame?: PostKit, extra?: Slots): number {
  const slots: Slots = { ...kit.slots, ...(extra ?? {}) };
  let body = 0;
  for (const pattern of kit.patterns) body += combosIn(pattern, slots);
  if (!frame) return body;
  let shapes = 0;
  for (const pattern of frame.patterns) shapes += combosIn(pattern, { ...frame.slots, ...slots, body: ['x'] });
  return body * shapes;
}

// ---------------------------------------------------------------------------
// What people say back
// ---------------------------------------------------------------------------

/** Replies under a post on the text app, which is where an argument happens. */
export const REPLY_LINES: readonly string[] = [
  'Source?',
  'This is the first sensible thing I have read about it all week.',
  'Respectfully, no.',
  'Have you got a link for that?',
  'The second half of this is right and the first half is not.',
  'People have been saying this for years and nobody listened.',
  'Genuinely asking: how would you fix it?',
  'This aged well.',
  'This did not age well.',
  'Do you have the numbers for last year?',
  'Bookmarking this.',
  'You have got the direction right and the size wrong.',
  'Quoting this at work tomorrow.',
  'It is more complicated than that and you know it.',
  'Thank you for actually reading the document.',
  'The replies to this are going to be a disaster.',
  'Correct, and unpopular.',
  'This is the sort of post I stay here for.',
  'Not sure that follows.',
  'The chart would help.',
  'Somebody had to say it.',
  'And yet nothing will change.',
  'Where was this six months ago?',
  'Every single time.',
];

/** Comments under a photograph, which is a warmer room. */
export const PHOTO_COMMENTS: readonly string[] = [
  'This is beautiful 😍',
  'The light 🙌',
  'Okay this is my new wallpaper',
  'Stunning',
  'The colors here',
  'Third time looking at this today',
  'Where is this?',
  'Perfect',
  'You have such an eye',
  'Saving this one',
  'How do you get it this sharp',
  'Beautiful 🔥',
  'This one is going on the wall',
  'Honestly incredible',
  'Composition is unreal',
  'Need this printed',
  'The mood 😌',
  'Every post is a masterclass',
  'Straight to the saved folder',
  'Genuinely stopped scrolling for this',
  'How long did this take you',
  'Obsessed with this one 👏',
  'Please never stop posting',
];

/**
 * What gets said under a photograph of one particular thing. A comment on a
 * loaf and a comment on a long exposure are not interchangeable, and a feed
 * where they are is the tell that nobody is really there.
 */
export const TOPIC_COMMENTS: Readonly<Record<SocialTopic, readonly string[]>> = {
  photo: ['What lens?', 'Is this film?', 'What were you shooting at here', 'The grain 😍', 'Straight out of camera? Incredible', 'Would buy this as a print'],
  street: ['How do people not notice you', 'The timing on this', 'Did you ask them first?', 'This is the whole city in one frame', 'Nobody else is shooting like this', 'That second of luck 🙌'],
  food: ['Recipe please 🙏', 'Making this at the weekend', 'The crumb on that 😍', 'What oven temperature', 'I can smell this', 'Made this last night and it worked'],
  fashion: ['Where is the coat from', 'The fit on this 👌', 'Been looking for something like this for years', 'Is this tailored or off the rack', 'Color combination is perfect', 'Saving this for autumn'],
  travel: ['Adding this to the list', 'How long were you there', 'Was it busy at this time of year', 'Booked, thank you', 'What time of day is this', 'This is why I follow you'],
  design: ['What is the paint color', 'The proportions here 👏', 'Who made the joinery', 'Did you do this yourselves', 'Every detail is right', 'Where is the light fitting from'],
  fitness: ['What was the session', 'Strong 💪', 'How long did this take you to build up to', 'Needed to see this today', 'What are the splits', 'Back at it tomorrow'],
  film: ['Who shot this', 'The lighting setup 👀', 'What was the camera', 'This looks incredible', 'Cannot wait to see it', 'The production design here'],
  music: ['What is the setlist', 'Wish I had been there', 'The room sounds unreal', 'What are you recording on', 'On repeat all week', 'Playing this loud tonight'],
  news: ['Thank you for covering this', 'Is there a longer piece', 'Nobody else is reporting this', 'Sharing this everywhere', 'Where can I read the document', 'This needed saying'],
  sport: ['What a game', 'Best atmosphere in the league', 'Were you in the ground for this', 'The noise here 🔥', 'Season is alive', 'Deserved it'],
  comedy: ['Crying 😂', 'Why is this so accurate', 'Sending this to my brother', 'Not okay', 'Reading this out at dinner', 'Every time'],
  tech: ['What is the setup', 'Does this actually work', 'Is the code up anywhere', 'Been waiting for someone to do this', 'What are the specs', 'Nice build 👏'],
  politics: ['Where is the source for this', 'Somebody had to say it', 'Sharing with my councillor', 'This is exactly it', 'Thank you for reading the papers', 'And nothing will happen'],
  books: ['Adding to the pile', 'One of my favorites', 'What did you make of the ending', 'Beautiful edition', 'Reading this next', 'Which translation is this'],
  business: ['This is the real number', 'Small businesses everywhere', 'How long have you been trading', 'Supporting this', 'The margins on this are brutal', 'Good luck with the opening'],
};

/** Places a photograph says it was taken. Invented, like everything else here. */
export const PLACES: readonly string[] = [
  'Harbor Road', 'The Old Quarter', 'North Beach', 'Mill Lane', 'The Long Bridge',
  'Station Approach', 'Cliff Path', 'The Market Hall', 'Quarry Road', 'The Water Meadows',
  'Ferry Steps', 'Chapel Street', 'The Common', 'Dock Gate Six', 'Orchard Row',
];
