/**
 * SLATE — who is on the short video app, and what they say over it.
 *
 * The third roster, written apart from the other two for the same reason they
 * were written apart from each other: a caption under a photograph, a three
 * hundred character argument and the line over a fifteen second clip are three
 * different kinds of writing. This one is a hook. It is lowercase, it is
 * usually a promise, it very often begins in the middle, and it carries tags
 * because that is how the thing is found at all.
 *
 * Ninety one accounts, and the same rule as the other two: **these people are
 * SLATE's, not the real internet's.** Nobody real is named and no follower
 * count belongs to anybody.
 */

import type { Rng } from '../core/rng';
import type { PostKit } from './socialposts';
import type { SocialTopic } from './socialworld';

export interface ClipSeed {
  id: string;
  handle: string;
  name: string;
  topic: SocialTopic;
  followers: number;
  /** Days between posts. The app rewards posting daily and it shows. */
  cadenceDays: number;
  craft: number;
  bio: string;
}

function cl(
  id: string, handle: string, name: string, topic: SocialTopic,
  followers: number, cadenceDays: number, craft: number, bio: string,
): ClipSeed {
  return { id, handle, name, topic, followers, cadenceDays, craft, bio };
}

/** The people whose feed is fifteen seconds at a time. */
export const CLIP_PROFILES: readonly ClipSeed[] = [
  cl('c_onepanfix', 'onepanfix', 'One Pan Fix', 'food', 4_200_000, 1, 82, 'dinner in the time it takes to boil a kettle'),
  cl('c_thecoldbrewguy', 'thecoldbrewguy', 'Cold Brew', 'food', 1_840_000, 1, 79, 'coffee, timed to the second'),
  cl('c_lunchboxwars', 'lunchboxwars', 'Lunchbox Wars', 'food', 926_000, 1, 76, 'five days, two children, no repeats'),
  cl('c_thehotsaucelab', 'thehotsaucelab', 'Hot Sauce Lab', 'food', 2_460_000, 2, 84, 'burning my own mouth for content'),
  cl('c_dumplingcorner', 'dumplingcorner', 'Dumpling Corner', 'food', 1_320_000, 2, 88, 'folds, pleats and the wrapper'),
  cl('c_thebakerysecond', 'thebakerysecond', 'The Bakery Second', 'food', 684_000, 1, 85, 'proof, bake, cut, done'),
  cl('c_ninetysecondpasta', 'ninetysecondpasta', 'Ninety Second Pasta', 'food', 3_100_000, 1, 80, 'sauce first. always sauce first'),
  cl('c_thefridgeraid', 'thefridgeraid', 'Fridge Raid', 'food', 512_000, 1, 73, 'whatever is left, made edible'),
  cl('c_fitcheckdaily', 'fitcheckdaily', 'Fit Check Daily', 'fashion', 2_840_000, 1, 78, 'one outfit a day, no repeats this year'),
  cl('c_thriftrunhaul', 'thriftrunhaul', 'Thrift Run', 'fashion', 1_620_000, 1, 74, 'under twenty or it does not go in the bag'),
  cl('c_tailorsbench', 'tailorsbench', 'Tailors Bench', 'fashion', 486_000, 2, 91, 'watch a jacket get fixed'),
  cl('c_capsulethirty', 'capsulethirty', 'Capsule Thirty', 'fashion', 742_000, 2, 82, 'thirty things, a whole year'),
  cl('c_sneakerbench', 'sneakerbench', 'Sneaker Bench', 'fashion', 1_940_000, 1, 80, 'cleaning, restoring, ruining'),
  cl('c_theseamripper', 'theseamripper', 'Seam Ripper', 'fashion', 368_000, 3, 89, 'taking clothes apart to see how'),
  cl('c_gymfloorpov', 'gymfloorpov', 'Gym Floor', 'fitness', 3_400_000, 1, 77, 'form checks, mostly bad ones'),
  cl('c_fivemovesaday', 'fivemovesaday', 'Five Moves', 'fitness', 1_260_000, 1, 81, 'five, every morning, no equipment'),
  cl('c_thecouchtokay', 'thecouchtokay', 'Couch To Okay', 'fitness', 884_000, 2, 79, 'the unglamorous first eight weeks'),
  cl('c_mobilityminute', 'mobilityminute', 'Mobility Minute', 'fitness', 646_000, 1, 84, 'one joint, sixty seconds'),
  cl('c_therunclub', 'therunclub', 'The Run Club', 'fitness', 1_480_000, 1, 76, 'splits, shoes and shin splints'),
  cl('c_theclimbwall', 'theclimbwall', 'The Wall', 'fitness', 428_000, 2, 87, 'beta, falls and the send'),
  cl('c_povyourein', 'povyourein', 'POV Youre In', 'comedy', 6_200_000, 1, 74, 'you are the third person in every conversation'),
  cl('c_officebitroom', 'officebitroom', 'Office Bit', 'comedy', 2_920_000, 1, 76, 'the meeting could have been this'),
  cl('c_thefamilygroupchat', 'familygroupchat', 'Family Group Chat', 'comedy', 4_800_000, 1, 72, 'my mother, verbatim, with a wig'),
  cl('c_deadpanminute', 'deadpanminute', 'Deadpan', 'comedy', 1_140_000, 2, 84, 'no jokes. only truth. still funny'),
  cl('c_thebritishproblem', 'thebritishproblem', 'Very Sorry', 'comedy', 2_260_000, 1, 78, 'apologizing to furniture since forever'),
  cl('c_impressionsdesk', 'impressionsdesk', 'Impressions Desk', 'comedy', 3_640_000, 1, 80, 'people you know, badly'),
  cl('c_thewrongorder', 'thewrongorder', 'Wrong Order', 'comedy', 968_000, 2, 75, 'service industry, unfiltered'),
  cl('c_readthisbook', 'readthisbook', 'Read This', 'books', 1_720_000, 1, 79, 'sixty seconds, one book, no spoilers'),
  cl('c_theshelfsort', 'theshelfsort', 'Shelf Sort', 'books', 486_000, 2, 83, 'reorganising until it is beautiful'),
  cl('c_firstpagetest', 'firstpagetest', 'First Page Test', 'books', 842_000, 2, 86, 'if page one does not land, out it goes'),
  cl('c_thedaymakeup', 'thedaymakeup', 'The Day Look', 'photo', 2_140_000, 1, 76, 'one light, one lens, one take'),
  cl('c_shutterpov', 'shutterpov', 'Shutter POV', 'photo', 1_260_000, 1, 84, 'behind the camera, the whole time'),
  cl('c_editinpublic', 'editinpublic', 'Edit In Public', 'photo', 684_000, 2, 88, 'raw to final, nothing hidden'),
  cl('c_thefilmroll', 'thefilmroll', 'The Roll', 'photo', 428_000, 3, 90, 'thirty six frames, one at a time'),
  cl('c_streetlensrun', 'streetlensrun', 'Street Run', 'street', 926_000, 1, 82, 'one block, one hour, one keeper'),
  cl('c_transitpov', 'transitpov', 'Transit POV', 'street', 1_480_000, 1, 77, 'the commute, from inside it'),
  cl('c_thecornershopseries', 'cornershopseries', 'Corner Shop', 'street', 386_000, 2, 85, 'the same shop, every week, for years'),
  cl('c_gatetogate', 'gatetogate', 'Gate To Gate', 'travel', 3_800_000, 1, 78, 'the whole trip in fifty seconds'),
  cl('c_hostelvshotel', 'hostelvshotel', 'Hostel Or Hotel', 'travel', 1_640_000, 1, 75, 'same city, two budgets'),
  cl('c_thenighttrain', 'thenighttrainclip', 'Night Train', 'travel', 742_000, 2, 86, 'berths, dining cars and border stops'),
  cl('c_onebagonly', 'onebagonly', 'Forty Liters', 'travel', 1_180_000, 2, 80, 'everything, in forty liters'),
  cl('c_thecheapflightalert', 'cheapflightalert', 'Fare Alert', 'travel', 2_460_000, 1, 71, 'go now, it will be gone by six'),
  cl('c_thebuildlog', 'thebuildlog', 'Build Log', 'design', 1_920_000, 1, 84, 'one room, start to finish, in public'),
  cl('c_paintitright', 'paintitright', 'Paint It Right', 'design', 864_000, 2, 82, 'prep is ninety percent of it'),
  cl('c_thejoinerspov', 'thejoinerspov', 'Joiners POV', 'design', 1_360_000, 1, 89, 'cuts, joints and the swearing'),
  cl('c_smallspacefix', 'smallspacefix', 'Small Space', 'design', 2_080_000, 1, 79, 'thirty square meters, solved'),
  cl('c_theglueup', 'theglueup', 'The Glue Up', 'design', 482_000, 3, 91, 'clamps, cauls and holding your breath'),
  cl('c_setlifepov', 'setlifepov', 'Set Life', 'film', 1_740_000, 1, 82, 'what a shoot day actually looks like'),
  cl('c_onelightsetup', 'onelightsetup', 'One Light', 'film', 968_000, 2, 88, 'every look, from a single source'),
  cl('c_thecutexplained', 'thecutexplained', 'The Cut', 'film', 1_240_000, 2, 87, 'why that edit works, in sixty seconds'),
  cl('c_gafferstape', 'gafferstape', 'Gaffer Tape', 'film', 386_000, 2, 90, 'rigging, safely, on a budget'),
  cl('c_castingroompov', 'castingroompov', 'Casting Room', 'film', 642_000, 2, 84, 'the five seconds that decide it'),
  cl('c_thebeatdrop', 'thebeatdrop', 'The Beat', 'music', 4_400_000, 1, 78, 'made this in fifteen minutes'),
  cl('c_practiceroompov', 'practiceroompov', 'Practice Room', 'music', 862_000, 1, 88, 'scales, badly, in public'),
  cl('c_thesamplehunt', 'thesamplehunt', 'Sample Hunt', 'music', 1_360_000, 2, 85, 'crate to track'),
  cl('c_livingroomgig', 'livingroomgig', 'Living Room Gig', 'music', 2_120_000, 1, 83, 'one song, one take, no room treatment'),
  cl('c_thetheoryminute', 'thetheoryminute', 'Theory Minute', 'music', 528_000, 2, 89, 'why that chord hurts'),
  cl('c_matchdaypov', 'matchdaypov', 'Matchday POV', 'sport', 2_640_000, 1, 77, 'from the turnstile to the final whistle'),
  cl('c_thetrainingdrill', 'thetrainingdrill', 'The Drill', 'sport', 1_180_000, 1, 84, 'one drill, done properly'),
  cl('c_nonleaguerun', 'nonleaguerun', 'Non League', 'sport', 486_000, 2, 82, 'step seven, every Saturday'),
  cl('c_thestatsdesk', 'thestatsdeskclip', 'Stats Desk', 'sport', 924_000, 1, 80, 'the number nobody mentioned'),
  cl('c_buildinpublicpov', 'buildinpublicpov', 'Build In Public', 'tech', 1_460_000, 1, 81, 'shipping it whether it works or not'),
  cl('c_thereparibench', 'thereparibench', 'Repair Bench', 'tech', 862_000, 1, 88, 'fixing what they said you cannot'),
  cl('c_onecommand', 'onecommand', 'One Command', 'tech', 642_000, 1, 86, 'the terminal line that saves an hour'),
  cl('c_thesetupshelf', 'thesetupshelf', 'The Setup', 'tech', 1_940_000, 1, 74, 'cable management as a personality'),
  cl('c_phonesin60', 'phonesinsixty', 'Phones In Sixty', 'tech', 3_200_000, 1, 76, 'the whole review, in a minute'),
  cl('c_thereceiptcheck', 'thereceiptcheck', 'Receipt Check', 'business', 1_720_000, 1, 79, 'what it costs, itemised, out loud'),
  cl('c_smallshopdiary', 'smallshopdiary', 'Small Shop Diary', 'business', 684_000, 1, 85, 'one till, one year, in public'),
  cl('c_themarginminute', 'themarginminute', 'The Margin', 'business', 926_000, 2, 83, 'where the money actually goes'),
  cl('c_sidehustlereality', 'sidehustlereality', 'Side Hustle Reality', 'business', 2_260_000, 1, 72, 'the numbers nobody screenshots'),
  cl('c_thebreakingclip', 'thebreakingclip', 'Breaking', 'news', 2_840_000, 1, 74, 'what happened, in forty seconds'),
  cl('c_explainthisto', 'explainthisto', 'Explain This', 'news', 1_620_000, 1, 84, 'the story, from the beginning'),
  cl('c_thelocalpaperclip', 'thelocalpaperclip', 'Local Paper', 'news', 386_000, 2, 86, 'one town, covered properly'),
  cl('c_factorfiction', 'factorfiction', 'Fact Or Fiction', 'news', 1_180_000, 1, 80, 'that clip you saw, checked'),
  cl('c_thecouncilclip', 'thecouncilclip', 'Council Clip', 'politics', 642_000, 2, 85, 'the meeting, cut to the part that matters'),
  cl('c_readthebill', 'readthebill', 'Read The Bill', 'politics', 924_000, 2, 87, 'page numbers, on screen'),
  cl('c_thedoorstepround', 'thedoorstepround', 'Doorstep', 'politics', 486_000, 2, 79, 'what people actually say'),
  cl('c_povnewyork', 'povnewyork', 'POV A City', 'travel', 1_920_000, 1, 76, 'living somewhere, not visiting it'),
  cl('c_thelaundrette', 'thelaundretteclip', 'The Laundrette', 'street', 268_000, 2, 84, 'one room, all night, every week'),
  cl('c_makeupinthecar', 'makeupinthecar', 'In The Car', 'fashion', 1_340_000, 1, 73, 'done at the lights, sorry'),
  cl('c_thecleanwithme', 'thecleanwithme', 'Clean With Me', 'design', 3_600_000, 1, 71, 'nobody knows why this works but it does'),
  cl('c_studywithme', 'studywithme', 'Study With Me', 'books', 2_480_000, 1, 70, 'fifty minutes, ten off, on a loop'),
  cl('c_thelatenightpot', 'thelatenightpot', 'Late Night Pot', 'food', 862_000, 1, 81, 'one pot, after midnight'),
  cl('c_theskatespot', 'theskatespot', 'The Spot', 'sport', 1_460_000, 1, 82, 'same ledge, four hundred attempts'),
  cl('c_theopenmicnight', 'theopenmicnight', 'Open Mic', 'comedy', 742_000, 2, 83, 'five minutes, sometimes silent'),
  cl('c_thevinylminute', 'thevinylminute', 'Vinyl Minute', 'music', 486_000, 2, 86, 'one record, one side, one story'),
  cl('c_theinterviewclip', 'theinterviewclip', 'Interview Clip', 'film', 1_820_000, 1, 75, 'the answer that got cut'),
  cl('c_thehousetour', 'thehousetour', 'House Tour', 'design', 2_740_000, 1, 74, 'somebody let me in again'),
  cl('c_dayinthelifeof', 'dayinthelifeof', 'Day In The Life', 'business', 3_920_000, 1, 72, 'six in the morning to whenever'),
  cl('c_thelabbench', 'thelabbench', 'Lab Bench', 'tech', 528_000, 2, 89, 'science, done slowly, on camera'),
  cl('c_thegardenplot', 'thegardenplot', 'The Plot', 'design', 684_000, 2, 84, 'twelve months on one allotment'),
];

/** The sounds a clip is cut to. Invented, like everything else here. */
export const SOUNDS: readonly string[] = [
  'original sound', 'slowed and reverb', 'the walking bass one', 'that piano loop',
  'sped up, obviously', 'the one from the advert', 'a very tired synth',
  'somebody counting', 'the kitchen drum thing', 'no sound, on purpose',
  'a phone recording of rain', 'the eight bar loop', 'that saxophone again',
  'a choir, pitched down', 'the doorbell sample', 'field recording, market',
];

/** How each subject tags itself, because that is how a clip is found at all. */
export const CLIP_TAGS: Readonly<Record<SocialTopic, readonly string[]>> = {
  photo: ['#photography #howto', '#cameratok', '#shotonfilm', '#learnphotography'],
  street: ['#streettok', '#citylife', '#walkwithme', '#urbanphotography'],
  food: ['#foodtok #easyrecipe', '#cooking', '#dinnerideas', '#recipe #quick'],
  fashion: ['#fashiontok', '#fitcheck', '#thrifted', '#styletips'],
  travel: ['#traveltok', '#budgettravel', '#packing', '#solotravel'],
  design: ['#hometok #diy', '#renovation', '#woodworking', '#interiors'],
  fitness: ['#gymtok', '#formcheck', '#homeworkout', '#runtok'],
  film: ['#filmtok', '#behindthescenes', '#filmmaking', '#onset'],
  music: ['#musictok', '#producer', '#livemusic', '#songwriting'],
  news: ['#newstok', '#explained', '#localnews', '#factcheck'],
  sport: ['#sportstok', '#matchday', '#training', '#grassroots'],
  comedy: ['#comedytok', '#pov', '#relatable', '#skit'],
  tech: ['#techtok', '#buildinpublic', '#rightorepair', '#coding'],
  politics: ['#politicstok', '#localdemocracy', '#explained', '#publicrecord'],
  books: ['#booktok', '#currentlyreading', '#studytok', '#recommendations'],
  business: ['#smallbusiness', '#behindthecounter', '#numbers', '#thehighstreet'],
};

/**
 * The hook over a clip.
 *
 * Not a caption and not a post: a promise made in the first second, because
 * that is the only second the app gives you. Lowercase, in the middle of the
 * thought, and very often a number.
 */
export const CLIP_KITS: Readonly<Record<SocialTopic, PostKit>> = {
  food: {
    patterns: [
      'day {n} of {quest}', 'this took {time} and I am never doing it again',
      '{dish} but {twist}', 'stop {mistake}', 'the {dish} thing everybody gets wrong',
      'replying to a comment: yes, {answer}', '{dish} in {time}',
      'if you only learn one thing this week make it {dish}', 'nobody asked for {dish}. here is {dish}',
      '{twist}. that is the whole recipe', 'testing whether {twist} actually works',
      'watch what happens when you {mistake}',
    ],
    slots: {
      n: ['3', '7', '12', '21', '40', '100'],
      quest: ['cooking every dish in the book', 'no takeaway', 'a fiver a day', 'using up the freezer'],
      time: ['eleven minutes', 'four hours', 'one pan', 'the length of this sound', 'a whole Sunday'],
      dish: ['the ragu', 'a proper carbonara', 'focaccia', 'dal', 'roast potatoes', 'a curry paste', 'shakshuka'],
      twist: ['salt it the night before', 'no oil at all', 'cold pan, always', 'one ingredient', 'the sauce first'],
      mistake: ['rinsing the pasta', 'crowding the pan', 'cooking garlic first', 'skipping the rest'],
      answer: ['you can freeze it', 'the cheap one is better', 'it does need the anchovy'],
    },
  },
  fashion: {
    patterns: [
      'fit check, day {n}', 'everything here cost under {price}', '{garment} but {twist}',
      'stop {mistake}', 'thrifted the whole thing for {price}', 'how to make a {garment} fit',
      'day {n} of no new clothes', 'the {garment} nobody knows how to wear',
      'watch this {garment} get {fix}', 'one {garment}, {n} ways',
      'replying to a comment: yes, {answer}', '{twist}. that is the whole trick',
    ],
    slots: {
      n: ['4', '9', '30', '60', '200'],
      price: ['fifteen', 'thirty', 'a hundred', 'the price of lunch'],
      garment: ['coat', 'blazer', 'knit', 'pair of jeans', 'shirt', 'pair of boots'],
      twist: ['two sizes up', 'from the men’s section', 'hemmed by hand', 'worn backwards, sort of'],
      mistake: ['buying your size', 'ignoring the shoulders', 'dry cleaning everything'],
      fix: ['taken in', 'resoled', 'dyed', 'relined'],
      answer: ['it is machine washable', 'the charity shop one is better made'],
    },
  },
  fitness: {
    patterns: [
      'day {n} of {quest}', 'form check: {lift}', 'stop {mistake}',
      '{n} minutes, no equipment, {part}', 'if your {lift} hurts, watch this',
      'the {lift} cue that fixed mine', 'day {n} back after {injury}',
      '{n} weeks of this and here is the difference', 'nobody warms up properly. here is how',
      'replying to a comment: yes, {answer}', '{part} in {n} minutes',
      'why your {lift} stalls at the same weight every time',
    ],
    slots: {
      n: ['5', '14', '30', '60', '90'],
      quest: ['running every morning', 'the same five lifts', 'swimming before work', 'the couch to five'],
      lift: ['squat', 'deadlift', 'bench', 'overhead press', 'pull up'],
      mistake: ['chasing soreness', 'skipping the warm up', 'training the same thing daily'],
      part: ['hips', 'shoulders', 'the whole back', 'ankles'],
      injury: ['a torn calf', 'a bad back', 'shin splints'],
      answer: ['rest is training', 'you can do this at home'],
    },
  },
  comedy: {
    patterns: [
      'pov: {scene}', 'when {scene}', 'nobody: ... me: {reaction}',
      'my {person} every single time', 'the {place} experience, in {n} seconds',
      'if {scene} was a person', 'tell me you have {trait} without telling me',
      '{person}, but accurate', 'this is what {scene} sounds like',
      'day {n} of {quest}', 'replying to a comment: yes, {answer}',
      'the group chat when {scene}',
    ],
    slots: {
      n: ['5', '15', '30', '60'],
      scene: ['the meeting overruns', 'somebody says per my last email', 'the wifi goes', 'you are asked to say a few words', 'the bill arrives'],
      reaction: ['leaving', 'apologizing to a chair', 'agreeing to something in June'],
      person: ['mother', 'flatmate', 'manager', 'neighbour', 'uncle'],
      place: ['dentist', 'airport', 'garden center', 'family wedding', 'work do'],
      trait: ['been the eldest', 'worked in hospitality', 'a group chat you cannot leave'],
      quest: ['pretending I am fine', 'being normal at work', 'not replying'],
      answer: ['that was my actual mother', 'the wig helps'],
    },
  },
  design: {
    patterns: [
      'day {n} of {quest}', 'watch this {thing} come together', 'stop {mistake}',
      '{thing} from {material}, start to finish', 'the {thing} cost {price} to make',
      '{n} weeks in one minute', 'nobody prepares properly. watch',
      'the join everybody gets wrong', 'before and after, {n} days apart',
      'replying to a comment: yes, {answer}', '{material} but {twist}',
      'this room was unusable {n} weeks ago',
    ],
    slots: {
      n: ['3', '10', '28', '52'],
      quest: ['doing the house myself', 'one room a month', 'making everything in it'],
      thing: ['bench', 'run of shelves', 'kitchen island', 'front door', 'window seat'],
      mistake: ['skipping the primer', 'gluing before you dry fit', 'buying the cheap blade'],
      material: ['one board', 'reclaimed pine', 'offcuts', 'plywood'],
      price: ['forty pounds', 'nothing', 'less than the shop one'],
      twist: ['no screws', 'hand tools only', 'in a hallway'],
      answer: ['it is oak', 'you can do this in a flat'],
    },
  },
  travel: {
    patterns: [
      'gate to gate in {n} seconds', '{place} on {price} a day',
      'day {n} of {quest}', 'stop {mistake}', 'the {place} nobody posts about',
      'this train costs {price} and takes all night', '{n} hours in {place}',
      'everything I packed for {n} weeks', 'replying to a comment: yes, {answer}',
      'the cheapest way into {place}', '{place}, off season, empty',
      'what {price} actually gets you in {place}',
    ],
    slots: {
      n: ['30', '48', '60', '3', '6'],
      place: ['the far north', 'a border town', 'the old quarter', 'the island', 'the coast road'],
      price: ['twenty pounds', 'forty pounds', 'a hundred pounds'],
      quest: ['traveling without flying', 'one bag only', 'saying yes to everything'],
      mistake: ['booking the airport hotel', 'changing money at the airport', 'paying for the fast queue'],
      answer: ['the night train is worth it', 'you do not need the visa'],
    },
  },
  music: {
    patterns: [
      'made this in {time}', 'the chord that does that thing',
      'day {n} of {quest}', 'stop {mistake}', 'one take, no edits, {thing}',
      'why this {n} second loop works', 'sampling {source} because why not',
      'this is what {thing} sounds like in an empty room',
      'replying to a comment: yes, {answer}', 'the {thing} everybody plays wrong',
      '{time} to write, six months to finish', 'listen to what happens on the second bar',
    ],
    slots: {
      n: ['4', '8', '16', '30'],
      time: ['fifteen minutes', 'one afternoon', 'two years', 'a soundcheck'],
      quest: ['writing something daily', 'learning it properly', 'no plugins'],
      mistake: ['quantising everything', 'mixing on laptop speakers', 'adding another layer'],
      thing: ['the bass line', 'that turnaround', 'the bridge', 'the intro'],
      source: ['a market recording', 'a doorbell', 'my kettle', 'an old record'],
      answer: ['it is one microphone', 'the room is the reverb'],
    },
  },
  film: {
    patterns: [
      'one light, {n} looks', 'what a {day} actually looks like',
      'stop {mistake}', 'why that cut works', 'the {department} nobody thanks',
      'day {n} of {quest}', 'this shot took {time}',
      'replying to a comment: yes, {answer}', 'rigging this safely, on nothing',
      'the {n} seconds that got somebody cast', '{department}, from the floor',
      'watch the {element} do all the work',
    ],
    slots: {
      n: ['3', '5', '12', '30'],
      day: ['shoot day', 'night exterior', 'stage day', 'location recce'],
      mistake: ['lighting the whole room', 'shooting wide open by default', 'cutting on the line'],
      department: ['grip', 'art department', 'sound', 'continuity', 'the gaffer'],
      quest: ['shooting a short with nothing', 'one setup a day', 'learning the camera properly'],
      time: ['four hours', 'two takes', 'the whole morning'],
      element: ['sound', 'the blocking', 'the edit', 'the production design'],
      answer: ['it is a practical', 'the camera never moved'],
    },
  },
  photo: {
    patterns: [
      'stop {mistake}', 'one lens, {n} pictures', 'day {n} of {quest}',
      'watch this go from raw to final', 'the {setting} nobody explains properly',
      'this frame took {time}', '{n} seconds of {craft}',
      'replying to a comment: yes, {answer}', 'shot on {gear}, nothing else',
      'the difference {setting} makes', 'develop this roll with me',
      'why your pictures look flat',
    ],
    slots: {
      n: ['5', '12', '36', '60'],
      mistake: ['shooting everything wide open', 'editing before you cull', 'buying another body'],
      quest: ['one picture a day', 'film only', 'the same street every week'],
      setting: ['shutter angle', 'metering', 'white balance', 'the histogram'],
      time: ['forty minutes', 'three visits', 'one second'],
      craft: ['seeing', 'framing', 'waiting', 'asking'],
      gear: ['a 35', 'the pocket camera', 'a borrowed lens', 'medium format'],
      answer: ['it is straight out of camera', 'no filter, no need'],
    },
  },
  street: {
    patterns: [
      'one block, {n} minutes, one keeper', 'stop {mistake}',
      'day {n} of {quest}', 'the same {spot}, {n} weeks apart',
      'this happened in {time}', 'walk with me at {hour}',
      'replying to a comment: yes, {answer}', 'nobody notices you if you {craft}',
      'this {spot} is going in March. filming it now',
      '{hour} is the only hour', 'what {n} miles actually gets you',
      'the picture was gone before the camera was up',
    ],
    slots: {
      n: ['4', '11', '30', '52'],
      mistake: ['using a long lens', 'sneaking around', 'shooting from the hip forever'],
      quest: ['walking a different route daily', 'one roll a week', 'the whole ring road'],
      spot: ['corner', 'crossing', 'market', 'underpass', 'bus stop'],
      time: ['half a second', 'one frame', 'the time it takes to blink'],
      hour: ['five', 'first light', 'closing time', 'half seven'],
      craft: ['slow down', 'stand still', 'ask first'],
      answer: ['I asked them', 'it is a 28'],
    },
  },
  tech: {
    patterns: [
      'the one command that saves an hour', 'stop {mistake}',
      'day {n} of {quest}', 'fixing what they said you cannot',
      'this took {time} and cost {price}', '{n} second review',
      'replying to a comment: yes, {answer}', 'why your {thing} is slow',
      'shipping this whether it works or not', 'inside a {thing}, carefully',
      'nobody reads the license. I did', 'this setting is on by default and should not be',
    ],
    slots: {
      n: ['30', '45', '60', '90'],
      mistake: ['updating on release day', 'trusting the default', 'buying the biggest one'],
      quest: ['building in public', 'fixing something every day', 'no new hardware'],
      time: ['twenty minutes', 'a whole weekend', 'four attempts'],
      price: ['nothing', 'six pounds', 'less than the repair quote'],
      thing: ['phone', 'laptop', 'router', 'build', 'database'],
      answer: ['the part is four pounds', 'it is fixable at home'],
    },
  },
  news: {
    patterns: [
      'what actually happened, in {n} seconds', 'that clip you saw is {verdict}',
      'the story so far, from the beginning', 'stop {mistake}',
      'reading the document so you do not have to', 'day {n} of asking',
      'replying to a comment: yes, {answer}', 'this number is from a press release',
      'nobody has answered the obvious question', 'the correction nobody posted',
      'one town, one story, {n} days', 'here is where that figure comes from',
    ],
    slots: {
      n: ['30', '40', '60', '9'],
      verdict: ['four years old', 'from somewhere else', 'real but not what they said', 'edited'],
      mistake: ['sharing before checking', 'trusting the caption', 'reading the headline only'],
      answer: ['the source is in the pinned comment', 'I filed the request in March'],
    },
  },
  politics: {
    patterns: [
      'the meeting, cut to the part that matters', 'page {page}. read it',
      'stop {mistake}', 'day {n} of asking for this document',
      'what people actually said on the doorstep', 'this passed at eleven at night',
      'replying to a comment: yes, {answer}', 'the costing does not survive a calculator',
      'nobody voted for this and everybody is getting it', 'the amendment that matters',
      'four pages. that is the whole impact assessment', 'here is who turned up and who did not',
    ],
    slots: {
      n: ['9', '30', '90'],
      page: ['14', '42', '87', '113'],
      mistake: ['reading the summary only', 'trusting the press release', 'assuming it was debated'],
      answer: ['the vote is public', 'I read all of it'],
    },
  },
  books: {
    patterns: [
      'one book, {n} seconds, no spoilers', 'page one test: {verdict}',
      'day {n} of {quest}', 'stop {mistake}', 'reorganising until it is right',
      'the book everybody lies about finishing', 'replying to a comment: yes, {answer}',
      '{n} minutes on, ten off. study with me', 'this opening sentence does everything',
      'if you liked that, read this', 'the translation changes the whole book',
      'nobody talks about the last twenty pages',
    ],
    slots: {
      n: ['30', '50', '60', '100'],
      verdict: ['it stays', 'straight back on the shelf', 'one more page'],
      quest: ['a book a week', 'only what I already own', 'reading before the phone'],
      mistake: ['finishing books you hate', 'buying faster than you read'],
      answer: ['it is the newer translation', 'the audiobook is better'],
    },
  },
  sport: {
    patterns: [
      'matchday, gate to whistle', 'watch the {position} on the second goal',
      'stop {mistake}', 'day {n} of {quest}', 'step {step}, every Saturday',
      'the number nobody mentioned', 'replying to a comment: yes, {answer}',
      '{n} attempts at the same {thing}', 'this drill, done properly',
      'the away end deserved better', 'one shot on target. at home',
      'what {n} games in a month does to a squad',
    ],
    slots: {
      n: ['9', '40', '200', '400'],
      position: ['holding midfielder', 'left back', 'keeper', 'center half'],
      mistake: ['skipping the basics', 'training tired', 'copying the pros'],
      quest: ['a ground a week', 'the same drill daily', 'watching every level'],
      step: ['five', 'six', 'seven'],
      thing: ['ledge', 'trick', 'set piece', 'lift'],
      answer: ['non league is better', 'I paid at the gate'],
    },
  },
  business: {
    patterns: [
      'what it actually costs, itemised', 'day {n} of {quest}',
      'stop {mistake}', 'where the money really goes',
      'one till, one {period}, in public', 'the margin on this is {margin}',
      'replying to a comment: yes, {answer}', 'six in the morning to whenever',
      'nobody screenshots these numbers', 'this shop has been here {years} years',
      'the terms nobody negotiates', 'what {price} of stock looks like',
    ],
    slots: {
      n: ['30', '90', '365'],
      quest: ['opening a shop', 'no outside money', 'paying myself last'],
      mistake: ['pricing on cost', 'ignoring the card fees', 'discounting to fill a quiet day'],
      period: ['week', 'month', 'year'],
      margin: ['eleven percent', 'four percent', 'less than you think'],
      years: ['nine', 'twenty two', 'forty'],
      price: ['two thousand pounds', 'a week', 'a full pallet'],
      answer: ['the rent is the whole problem', 'we do pay above minimum'],
    },
  },
};

/** How the app is put together over the hook. */
export const CLIP_FRAME: PostKit = {
  patterns: [
    '{body}', '{body}', '{body}',
    '{body} {tags}',
    '{body} 🙏 {tags}',
    '{body}\n{tags}',
    '{body} (part {part}) {tags}',
    '{body} — {aside}',
    '{body} {aside} {tags}',
  ],
  slots: {
    part: ['1', '2', '3', '4'],
    aside: [
      'sound on', 'no because seriously', 'ignore my kitchen', 'do not come for me',
      'part two if this does numbers', 'yes I know', 'link in bio', 'stitch this',
      'duet if you disagree', 'comments are open', 'wait for it', 'the ending though',
    ],
  },
};

/** Said wherever the roster is shown, so nobody mistakes them for real people. */
export const CLIP_NOTE =
  'The clip app’s accounts are SLATE’s own as well. Nobody real is named, and no follower count belongs to anybody.';

/** What gets said under a clip, which is a faster and louder room than the others. */
export const CLIP_COMMENTS: readonly string[] = [
  'the way I gasped', 'okay but the ending 😭', 'part 2 please', 'this is so real',
  'not me watching this four times', 'the audacity 😂', 'saving this immediately',
  'why is this so satisfying', 'tutorial??', 'what sound is this',
  'the algorithm knew', 'first time this app has been useful', 'literally me',
  'stitching this later', 'no one is talking about the last three seconds',
  'genuinely helpful, thank you', 'this changed how I do it', 'crying at the caption',
  'the confidence 💀', 'came for the hook stayed for the whole thing',
  'ok but where is this', 'my algorithm is finally healing', 'sending to my group chat',
  'you make this look easy', 'unreal',
];

/** How many different things one subject can say, for the checker to count. */
export function clipSpace(kit: PostKit, frame: PostKit): number {
  const combos = (pattern: string, slots: Readonly<Record<string, readonly string[]>>) => {
    let total = 1;
    for (const [, slot] of pattern.matchAll(/\{(\w+)\}/g)) total *= slots[slot!]?.length ?? 1;
    return total;
  };
  let body = 0;
  for (const pattern of kit.patterns) body += combos(pattern, kit.slots);
  let shapes = 0;
  for (const pattern of frame.patterns) shapes += combos(pattern, { ...frame.slots, body: ['x'], tags: ['a', 'b', 'c', 'd'] });
  return body * shapes;
}

/** Picks a sound for a clip, so a feed has a few that everybody is using. */
export function pickSound(rng: Rng): string {
  return rng.pick([...SOUNDS]);
}
