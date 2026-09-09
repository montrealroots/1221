/**
 * SLATE — the week itself: the dojo, the lunch hall, the gym floor and the
 * Saturday you spend with somebody.
 *
 * The martial arts here are real and so are their grading systems, which are
 * the most publicly documented thing about any of them: Brazilian jiu jitsu
 * runs white to black with stripes and minimum times set by the IBJJF, judo
 * runs kyu grades then dan grades and turns the belt red at the top, karate
 * counts kyu downward to shodan, taekwondo counts geup downward to dan and
 * gives a junior a poom instead. And the ones that grade nobody — boxing,
 * Muay Thai, wrestling, mixed martial arts — are carried as grading nobody,
 * because inventing a belt for a boxer would be inventing a fact.
 *
 * What is SLATE's own: how long a particular character takes to get anywhere,
 * what a class costs, what a session does to a skill, and every word anybody
 * says in the room.
 */

import type { Money } from '../core/money';

export const ARTS_NOTE =
  'The arts are real and so are their grading systems. Brazilian jiu jitsu goes white, blue, purple, '
  + 'brown, black with four stripes on each and minimum times between them; judo counts kyu grades up '
  + 'to first dan and then dan grades to tenth, turning the belt red and white at sixth and red at '
  + 'ninth; karate and taekwondo count downward to first kyu or first geup and then upward through '
  + 'the dan grades. Boxing, Muay Thai, wrestling and mixed martial arts grade nobody, and SLATE says '
  + 'so rather than inventing a belt for them.';

export const GRADING_NOTE =
  'Where a federation publishes a minimum time at a grade, that minimum is carried: the IBJJF really '
  + 'does want two years at blue before purple. How long past the minimum any particular person takes, '
  + 'and whether they pass on the day, is SLATE’s own and depends on the hours they have actually put '
  + 'in rather than on the calendar alone.';

export const CLASS_NOTE =
  'What a class costs, how often it runs and what an hour on the mat is worth to a skill are SLATE’s '
  + 'own calibration. There’s no fee schedule for the world’s gyms and none is claimed. The gym '
  + 'itself, the instructor and everybody you train with are SLATE’s own inventions.';

export const CHILD_NOTE =
  'A child trains where a child really can. Most arts take children from about five, gradings for '
  + 'children are separate from the adult ones almost everywhere, and a black belt in Brazilian jiu '
  + 'jitsu can’t be awarded before nineteen. Contact rules are lighter for children in every one of '
  + 'these arts, and SLATE holds a child below the grade an adult could reach at the same age.';

export const WEEK_NOTE =
  'A week is not only lessons. There’s a lunch hour with somebody or without one, an hour in the gym '
  + 'hall, an afternoon after school and a Saturday, and what you do with them builds different things. '
  + 'None of this is anybody’s published research on adolescence; it’s SLATE’s reading of what a week '
  + 'at that age is actually made of.';

// ---------------------------------------------------------------------------
// The arts
// ---------------------------------------------------------------------------

/** How an art grades, which differs completely between them. */
export type GradingStyle = 'belts' | 'kyu_dan' | 'geup_dan' | 'levels' | 'none';

export const GRADING_LABEL: Readonly<Record<GradingStyle, string>> = {
  belts: 'Belts And Stripes',
  kyu_dan: 'Kyu Grades, Then Dan Grades',
  geup_dan: 'Geup Grades, Then Dan Grades',
  levels: 'Numbered Levels',
  none: 'No Grades At All',
};

/** One rung of a real grading ladder. */
export interface Grade {
  id: string;
  /** What it is really called. */
  label: string;
  /** The least time at the grade below, in months, where a body publishes one. */
  minMonths: number;
  /** Hours on the mat SLATE wants before it will put somebody up for it. */
  hours: number;
  /** The youngest age this grade can really be awarded at. */
  fromAge: number;
  about: string;
}

export interface MartialArt {
  id: string;
  /** The real name. */
  name: string;
  /** Where it comes from, which is a fact about it. */
  origin: string;
  grading: GradingStyle;
  grades: readonly Grade[];
  /** The age a child can really start. */
  fromAge: number;
  /** What a session costs, and what it does. */
  fee: Money;
  /** How hard an hour of it is, out of a hundred. */
  demand: number;
  /** Which skills an hour of it feeds, and how much of the hour each gets. */
  feeds: readonly { key: string; kind: 'skill' | 'attribute'; share: number }[];
  about: string;
}

const g = (
  id: string, label: string, minMonths: number, hours: number, fromAge: number, about: string,
): Grade => ({ id, label, minMonths, hours, fromAge, about });

/**
 * The arts, and how each of them really grades.
 *
 * The belts, the kyu and dan counts, the geup counts and the published minimum
 * times are matters of public record. The hours SLATE wants at each grade are
 * SLATE's own, because no federation publishes a number of hours.
 */
export const MARTIAL_ARTS: readonly MartialArt[] = [
  {
    id: 'bjj', name: 'Brazilian Jiu Jitsu', origin: 'Brazil, out of Kodokan judo',
    grading: 'belts', fromAge: 5, fee: 30_00, demand: 32,
    feeds: [
      { key: 'self_defense', kind: 'skill', share: 0.4 },
      { key: 'fitness', kind: 'skill', share: 0.3 },
      { key: 'resilience', kind: 'skill', share: 0.3 },
    ],
    grades: [
      g('white', 'White Belt', 0, 0, 16, 'Where everybody starts, and where most of what happens to you is being tapped.'),
      g('blue', 'Blue Belt', 12, 180, 16, 'The first real one. A blue belt can defend themselves and knows it.'),
      g('purple', 'Purple Belt', 24, 520, 16, 'The IBJJF wants two years at blue, and the game wants the mat time to go with it.'),
      g('brown', 'Brown Belt', 18, 900, 18, 'Eighteen months at purple at the least, and it shows in everything.'),
      g('black', 'Black Belt', 12, 1400, 19, 'A year at brown at the least and nineteen years old at the least, which is the rule.'),
    ],
    about: 'The ground art. Nobody is strong enough to skip the technique and everybody finds that out in the first week.',
  },
  {
    id: 'judo', name: 'Judo', origin: 'Japan, founded by Kano Jigoro in 1882',
    grading: 'kyu_dan', fromAge: 5, fee: 18_00, demand: 34,
    feeds: [
      { key: 'self_defense', kind: 'skill', share: 0.35 },
      { key: 'fitness', kind: 'skill', share: 0.35 },
      { key: 'resilience', kind: 'skill', share: 0.3 },
    ],
    grades: [
      g('rokkyu', 'Sixth Kyu', 0, 0, 6, 'White belt, and learning to fall before learning to throw, which is the point.'),
      g('gokyu', 'Fifth Kyu', 3, 40, 6, 'Yellow in most federations, and the first few throws that actually land.'),
      g('yonkyu', 'Fourth Kyu', 4, 90, 7, 'Orange, and the first time randori is more than surviving.'),
      g('sankyu', 'Third Kyu', 6, 170, 9, 'Green, and by now the falls are automatic.'),
      g('nikyu', 'Second Kyu', 6, 270, 11, 'Blue, and you’re the one the beginners are thrown by.'),
      g('ikkyu', 'First Kyu', 9, 400, 13, 'Brown, and the last grade before the belt everybody outside the sport has heard of.'),
      g('shodan', 'First Dan', 12, 620, 15, 'Black. In judo it means competent rather than expert, and everybody in judo says so.'),
      g('nidan', 'Second Dan', 24, 950, 17, 'Two years at least, and the technical grading gets serious.'),
      g('sandan', 'Third Dan', 36, 1400, 20, 'Three more years, and now you’re teaching.'),
    ],
    about: 'Throws, holds, chokes and armlocks, and a governing philosophy about maximum efficiency that Kano actually wrote down.',
  },
  {
    id: 'karate', name: 'Karate', origin: 'Okinawa, then mainland Japan',
    grading: 'kyu_dan', fromAge: 5, fee: 16_00, demand: 28,
    feeds: [
      { key: 'self_defense', kind: 'skill', share: 0.35 },
      { key: 'fitness', kind: 'skill', share: 0.25 },
      { key: 'time_management', kind: 'skill', share: 0.15 },
      { key: 'resilience', kind: 'skill', share: 0.25 },
    ],
    grades: [
      g('kyu10', 'Tenth Kyu', 0, 0, 5, 'White, and the first stance held long enough to hurt.'),
      g('kyu8', 'Eighth Kyu', 3, 45, 5, 'Yellow in most schools, and the first kata all the way through.'),
      g('kyu6', 'Sixth Kyu', 4, 110, 6, 'Green, and kumite starts being a conversation rather than a panic.'),
      g('kyu4', 'Fourth Kyu', 6, 210, 8, 'Purple in a lot of schools, and the kata get long.'),
      g('kyu2', 'Second Kyu', 6, 330, 10, 'Brown, and the grading panel stops being kind.'),
      g('kyu1', 'First Kyu', 6, 460, 12, 'Brown with a stripe, and the black belt grading is now a date rather than an idea.'),
      g('shodan', 'First Dan', 12, 700, 14, 'Shodan. It’s written as beginning level, which is the joke and also the truth.'),
      g('nidan', 'Second Dan', 24, 1100, 16, 'Two more years, and the syllabus goes back to the beginning at a higher standard.'),
    ],
    about: 'Kata, kihon and kumite. The stances are unreasonable on purpose and every one of them is teaching something.',
  },
  {
    id: 'taekwondo', name: 'Taekwondo', origin: 'Korea, codified in the twentieth century',
    grading: 'geup_dan', fromAge: 4, fee: 15_00, demand: 30,
    feeds: [
      { key: 'self_defense', kind: 'skill', share: 0.3 },
      { key: 'fitness', kind: 'skill', share: 0.35 },
      { key: 'dancing', kind: 'skill', share: 0.1 },
      { key: 'resilience', kind: 'skill', share: 0.25 },
    ],
    grades: [
      g('geup10', 'Tenth Geup', 0, 0, 4, 'White, and the first kicks that go higher than a knee.'),
      g('geup8', 'Eighth Geup', 3, 40, 4, 'Yellow, and the first poomsae.'),
      g('geup6', 'Sixth Geup', 4, 95, 5, 'Green, and sparring in a hogu that’s too big for you.'),
      g('geup4', 'Fourth Geup', 5, 180, 7, 'Blue, and the head kicks start landing.'),
      g('geup2', 'Second Geup', 6, 290, 9, 'Red, and the whole school knows you’re close.'),
      g('geup1', 'First Geup', 6, 400, 11, 'Red with a black stripe, and the dan grading is booked.'),
      g('poom', 'First Poom', 6, 560, 8, 'The junior black belt. Under fifteen it’s a poom, and it becomes a dan when you’re old enough.'),
      g('dan1', 'First Dan', 6, 620, 15, 'Black, and the Kukkiwon certificate that goes with it.'),
      g('dan2', 'Second Dan', 12, 950, 16, 'A year at least, and the poomsae get long.'),
      g('dan3', 'Third Dan', 24, 1400, 18, 'Two more years, and you’re running a class of your own.'),
    ],
    about: 'The kicking art, and an Olympic sport since 2000. Everything is thrown from the hip and everything is thrown high.',
  },
  {
    id: 'muay_thai', name: 'Muay Thai', origin: 'Thailand',
    grading: 'none', fromAge: 7, fee: 20_00, demand: 42,
    feeds: [
      { key: 'self_defense', kind: 'skill', share: 0.35 },
      { key: 'fitness', kind: 'skill', share: 0.4 },
      { key: 'resilience', kind: 'skill', share: 0.25 },
    ],
    grades: [],
    about: 'Eight limbs: fists, elbows, knees and shins. Traditional Muay Thai grades nobody at all, and what a fighter has instead is a record.',
  },
  {
    id: 'boxing', name: 'Boxing', origin: 'Ancient, codified in England in 1867',
    grading: 'none', fromAge: 8, fee: 14_00, demand: 40,
    feeds: [
      { key: 'self_defense', kind: 'skill', share: 0.3 },
      { key: 'fitness', kind: 'skill', share: 0.45 },
      { key: 'resilience', kind: 'skill', share: 0.25 },
    ],
    grades: [],
    about: 'Two hands and footwork, and more conditioning than anything else in this list. There are no belts in a boxing gym; there’s a card on the wall.',
  },
  {
    id: 'wrestling', name: 'Wrestling', origin: 'Everywhere, and older than the records',
    grading: 'none', fromAge: 6, fee: 12_00, demand: 44,
    feeds: [
      { key: 'self_defense', kind: 'skill', share: 0.3 },
      { key: 'fitness', kind: 'skill', share: 0.45 },
      { key: 'resilience', kind: 'skill', share: 0.25 },
    ],
    grades: [],
    about: 'Folkstyle at an American school, freestyle and Greco Roman everywhere else. No grades, a weight class, and the hardest practice in any gym.',
  },
  {
    id: 'krav_maga', name: 'Krav Maga', origin: 'Israel, developed for the military',
    grading: 'levels', fromAge: 14, fee: 22_00, demand: 36,
    feeds: [
      { key: 'self_defense', kind: 'skill', share: 0.5 },
      { key: 'fitness', kind: 'skill', share: 0.25 },
      { key: 'resilience', kind: 'skill', share: 0.25 },
    ],
    grades: [
      g('p1', 'Practitioner One', 0, 0, 14, 'The first of the practitioner levels, and mostly about not being there when it lands.'),
      g('p2', 'Practitioner Two', 4, 60, 14, 'More of the same under more pressure, which is the whole method.'),
      g('p3', 'Practitioner Three', 6, 150, 15, 'Weapons defenses start, and they’re unnervingly practical.'),
      g('p4', 'Practitioner Four', 8, 280, 16, 'The pressure tests get long enough to be genuinely tiring.'),
      g('p5', 'Practitioner Five', 10, 430, 17, 'The last practitioner level before the graduate ones.'),
      g('g1', 'Graduate One', 12, 620, 18, 'Where it stops being a course and starts being how you move.'),
    ],
    about: 'Not a sport and not a tradition: a self defense system with numbered levels rather than belts, and no competition at the end of it.',
  },
  {
    id: 'mma', name: 'Mixed Martial Arts', origin: 'Modern, out of everything else on this list',
    grading: 'none', fromAge: 14, fee: 26_00, demand: 46,
    feeds: [
      { key: 'self_defense', kind: 'skill', share: 0.4 },
      { key: 'fitness', kind: 'skill', share: 0.35 },
      { key: 'resilience', kind: 'skill', share: 0.25 },
    ],
    grades: [],
    about: 'Striking, wrestling and the ground in one session. It grades nobody, because it’s three arts in a room rather than a tradition.',
  },
  {
    id: 'aikido', name: 'Aikido', origin: 'Japan, founded by Ueshiba Morihei',
    grading: 'kyu_dan', fromAge: 6, fee: 15_00, demand: 22,
    feeds: [
      { key: 'self_defense', kind: 'skill', share: 0.25 },
      { key: 'fitness', kind: 'skill', share: 0.2 },
      { key: 'mindfulness', kind: 'skill', share: 0.3 },
      { key: 'listening', kind: 'skill', share: 0.25 },
    ],
    grades: [
      g('kyu5', 'Fifth Kyu', 0, 0, 6, 'The first grading, and mostly about the roll.'),
      g('kyu3', 'Third Kyu', 6, 90, 8, 'The forms start joining up into something continuous.'),
      g('kyu1', 'First Kyu', 12, 300, 12, 'The last kyu grade, and the one that takes the longest.'),
      g('shodan', 'First Dan', 12, 520, 15, 'Black, and the hakama that goes with it in most schools.'),
    ],
    about: 'Redirection rather than resistance. The most argued about art on this list and the calmest room in any of them.',
  },
  {
    id: 'kendo', name: 'Kendo', origin: 'Japan, out of the sword schools',
    grading: 'kyu_dan', fromAge: 7, fee: 17_00, demand: 34,
    feeds: [
      { key: 'self_defense', kind: 'skill', share: 0.15 },
      { key: 'fitness', kind: 'skill', share: 0.25 },
      { key: 'mindfulness', kind: 'skill', share: 0.3 },
      { key: 'resilience', kind: 'skill', share: 0.3 },
    ],
    grades: [
      g('kyu3', 'Third Kyu', 0, 0, 7, 'The first grade anybody takes, and the armor is heavier than it looks.'),
      g('kyu1', 'First Kyu', 9, 160, 10, 'The last kyu grade, and the strikes finally sound right.'),
      g('shodan', 'First Dan', 3, 320, 13, 'Black in name only: kendo doesn’t use a colored belt at all.'),
      g('nidan', 'Second Dan', 12, 560, 15, 'A year at least, and the seniors stop going easy.'),
      g('sandan', 'Third Dan', 24, 900, 17, 'Two more years, and the gradings have a failure rate that’s talked about.'),
    ],
    about: 'Shinai, bogu and a shout. There’s no colored belt anywhere in kendo, which surprises everybody who assumes there is.',
  },
  {
    id: 'capoeira', name: 'Capoeira', origin: 'Brazil, out of the Angolan diaspora',
    grading: 'belts', fromAge: 5, fee: 14_00, demand: 30,
    feeds: [
      { key: 'fitness', kind: 'skill', share: 0.3 },
      { key: 'dancing', kind: 'skill', share: 0.35 },
      { key: 'musical_instrument', kind: 'skill', share: 0.15 },
      { key: 'self_defense', kind: 'skill', share: 0.2 },
    ],
    grades: [
      g('crua', 'Corda Crua', 0, 0, 5, 'The raw cord, and the first ginga that doesn’t look like falling over.'),
      g('amarela', 'Corda Amarela', 8, 90, 6, 'The colors differ by group; the ladder doesn’t.'),
      g('azul', 'Corda Azul', 12, 260, 9, 'The acrobatics arrive, and so does playing the berimbau.'),
      g('verde', 'Corda Verde', 18, 500, 12, 'By now you’re leading songs in the roda.'),
      g('formado', 'Formado', 24, 900, 16, 'Graduated, and teaching the children’s class on Saturdays.'),
    ],
    about: 'A game, a fight and a dance at once, played in a circle to a berimbau. Every group grades on cords and every group uses different colors.',
  },
];

export const ART_BY_ID: Readonly<Record<string, MartialArt>> = Object.fromEntries(
  MARTIAL_ARTS.map((one) => [one.id, one]),
);

/** How much of an art a child is held below, because a child is a child. */
export const CHILD_CEILING = 0.72;
/** How many hours a session on the mat is. */
export const SESSION_HOURS = 1.5;
/** The most sessions anybody gets out of a week without breaking. */
export const SESSIONS_A_WEEK = 4;

// ---------------------------------------------------------------------------
// The week around the lessons
// ---------------------------------------------------------------------------

/** When something can be done, because a Tuesday is not a Saturday. */
export type When = 'lunch' | 'gym_class' | 'after_school' | 'evening' | 'weekend' | 'any';

export const WHEN_LABEL: Readonly<Record<When, string>> = {
  lunch: 'The Lunch Hour',
  gym_class: 'Gym Class',
  after_school: 'After School',
  evening: 'The Evening',
  weekend: 'The Weekend',
  any: 'Any Time',
};

/** Something a person can spend part of a week doing. */
export interface Doing {
  id: string;
  label: string;
  when: When;
  /** The ages it makes sense at. */
  fromAge: number;
  toAge: number;
  /** Hours it takes out of the day. */
  hours: number;
  /** What it costs, where it costs anything. */
  cost: Money;
  /** What it takes out of you, out of a hundred. */
  demand: number;
  /** Whether it needs somebody else there. */
  needsAFriend: boolean;
  /** What it builds, and how much of the hour each gets. */
  feeds: readonly { key: string; kind: 'skill' | 'attribute'; share: number }[];
  about: string;
}

const d = (
  id: string, label: string, when: When, fromAge: number, toAge: number, hours: number,
  cost: Money, demand: number, needsAFriend: boolean,
  feeds: readonly { key: string; kind: 'skill' | 'attribute'; share: number }[], about: string,
): Doing => ({ id, label, when, fromAge, toAge, hours, cost, demand, needsAFriend, feeds, about });

/**
 * The rest of a week.
 *
 * A school week is thirty lessons and about a hundred other hours, and what
 * happens in those hours is most of who somebody turns into. Every one of
 * these is SLATE's own: what it builds, what it costs and what it takes out of
 * you are calibration rather than anybody's finding about adolescence.
 */
export const DOINGS: readonly Doing[] = [
  // The lunch hour, which is a whole social system of its own.
  d('lunch_with_friends', 'Sit With Your Friends', 'lunch', 5, 18, 1, 6_00, 4, true,
    [{ key: 'small_talk', kind: 'skill', share: 0.5 }, { key: 'listening', kind: 'skill', share: 0.5 }],
    'The table you sit at is the single most political decision of a school day and everybody knows it.'),
  d('lunch_alone', 'Eat Somewhere Quiet', 'lunch', 5, 18, 1, 6_00, 0, false,
    [{ key: 'reading', kind: 'skill', share: 0.6 }, { key: 'mindfulness', kind: 'skill', share: 0.4 }],
    'The library, the music corridor, the bench nobody uses. Not every lunch hour has to be spent performing.'),
  d('lunch_library', 'Get The Homework Done', 'lunch', 8, 18, 1, 6_00, 6, false,
    [{ key: 'study_skills', kind: 'skill', share: 0.6 }, { key: 'time_management', kind: 'skill', share: 0.4 }],
    'An hour now is an hour you aren’t spending at eleven at night, which is the entire argument.'),
  d('lunch_practice', 'Practice Something', 'lunch', 8, 18, 1, 6_00, 10, false,
    [{ key: 'musical_instrument', kind: 'skill', share: 0.5 }, { key: 'memory', kind: 'skill', share: 0.5 }],
    'A practice room, a script, a set of scales. Lunch hours are where most quiet competence gets built.'),

  // Gym class, which everybody has an opinion about.
  d('gym_join_in', 'Join In Properly', 'gym_class', 5, 18, 1, 0, 22, false,
    [{ key: 'fitness', kind: 'skill', share: 0.6 }, { key: 'resilience', kind: 'skill', share: 0.4 }],
    'It’s an hour of exercise a week that somebody else has organized, which is more than most adults manage.'),
  d('gym_swimming', 'The Swimming Block', 'gym_class', 6, 16, 1, 0, 24, false,
    [{ key: 'swimming', kind: 'skill', share: 0.7 }, { key: 'fitness', kind: 'skill', share: 0.3 }],
    'A few weeks of it a year, and it’s the only place a lot of people ever learn.'),
  d('gym_hide', 'Sit It Out', 'gym_class', 5, 18, 1, 0, 2, false,
    [{ key: 'small_talk', kind: 'skill', share: 1 }],
    'A note, a bench and a conversation. It costs the hour and it builds nothing much, which is the honest answer.'),

  // After school and the evening.
  d('hang_out', 'Hang Around Town', 'after_school', 11, 19, 3, 12_00, 8, true,
    [{ key: 'small_talk', kind: 'skill', share: 0.4 }, { key: 'navigation', kind: 'skill', share: 0.3 }, { key: 'bargaining', kind: 'skill', share: 0.3 }],
    'A bus, a high street, a shop you buy nothing in and three hours that vanish.'),
  d('somebodys_house', 'Go To Somebody’s House', 'after_school', 6, 19, 3, 0, 6, true,
    [{ key: 'empathy', kind: 'skill', share: 0.4 }, { key: 'listening', kind: 'skill', share: 0.3 }, { key: 'cards', kind: 'skill', share: 0.3 }],
    'The version of a friendship that happens where a parent can hear it, which is a different friendship.'),
  d('help_at_home', 'Help At Home', 'evening', 7, 25, 2, 0, 12, false,
    [{ key: 'housekeeping', kind: 'skill', share: 0.4 }, { key: 'cooking', kind: 'skill', share: 0.4 }, { key: 'home_repair', kind: 'skill', share: 0.2 }],
    'Unglamorous, and the reason some people leave home able to run a house and some don’t.'),
  d('read_a_book', 'Read Something', 'evening', 6, 99, 2, 0, 4, false,
    [{ key: 'reading', kind: 'skill', share: 0.5 }, { key: 'memory', kind: 'skill', share: 0.25 }, { key: 'research', kind: 'skill', share: 0.25 }],
    'The cheapest thing on this list and, over ten years, one of the most compounding.'),
  d('online', 'Get Lost Online', 'evening', 9, 99, 3, 0, 6, false,
    [{ key: 'computer_literacy', kind: 'skill', share: 0.5 }, { key: 'typing', kind: 'skill', share: 0.5 }],
    'Three hours that were going to be one. It genuinely teaches something, which is the awkward part.'),
  d('practice_instrument', 'Practice Properly', 'evening', 6, 99, 1, 0, 10, false,
    [{ key: 'musical_instrument', kind: 'skill', share: 0.7 }, { key: 'time_management', kind: 'skill', share: 0.3 }],
    'Twenty minutes a day beats three hours on a Sunday, and every teacher says so for a reason.'),
  d('cook_dinner', 'Cook For Everybody', 'evening', 10, 99, 2, 18_00, 14, false,
    [{ key: 'cooking', kind: 'skill', share: 0.6 }, { key: 'nutrition', kind: 'skill', share: 0.25 }, { key: 'time_management', kind: 'skill', share: 0.15 }],
    'The first meal anybody makes for other people is worse than they think and better than they feared.'),
  d('early_night', 'Have An Early Night', 'evening', 5, 99, 2, 0, 0, false,
    [{ key: 'sleep_hygiene', kind: 'skill', share: 1 }],
    'Boring, unfashionable, and the single highest return thing on this page.'),

  // The weekend, which is the biggest block anybody has.
  d('weekend_out', 'A Whole Day Out', 'weekend', 10, 99, 8, 40_00, 16, true,
    [{ key: 'navigation', kind: 'skill', share: 0.3 }, { key: 'small_talk', kind: 'skill', share: 0.4 }, { key: 'photography', kind: 'skill', share: 0.3 }],
    'A train somewhere, a whole day, and the sort of memory that turns up again twenty years later.'),
  d('weekend_sleepover', 'Stay Over', 'weekend', 7, 18, 12, 0, 10, true,
    [{ key: 'empathy', kind: 'skill', share: 0.5 }, { key: 'small_talk', kind: 'skill', share: 0.5 }],
    'Nobody sleeps and everybody says something at two in the morning that they meant.'),
  d('weekend_park', 'Down The Park', 'weekend', 6, 25, 3, 0, 18, true,
    [{ key: 'fitness', kind: 'skill', share: 0.5 }, { key: 'cycling', kind: 'skill', share: 0.25 }, { key: 'small_talk', kind: 'skill', share: 0.25 }],
    'Free, outside, and involves other people, which is three things at once.'),
  d('weekend_volunteer', 'Volunteer Somewhere', 'weekend', 12, 99, 4, 0, 16, false,
    [{ key: 'empathy', kind: 'skill', share: 0.35 }, { key: 'conflict_resolution', kind: 'skill', share: 0.2 }, { key: 'first_aid', kind: 'skill', share: 0.2 }, { key: 'childcare', kind: 'skill', share: 0.25 }],
    'A charity shop, a food bank, a care home. It looks good on a form and it does something to you as well.'),
  d('weekend_chores', 'Get The Week Straight', 'weekend', 10, 99, 3, 0, 14, false,
    [{ key: 'housekeeping', kind: 'skill', share: 0.4 }, { key: 'time_management', kind: 'skill', share: 0.3 }, { key: 'personal_finance', kind: 'skill', share: 0.3 }],
    'Washing, the shop, the bit of paperwork nobody wants. A Sunday afternoon of it buys the whole week back.'),
  d('weekend_fix', 'Fix Something', 'weekend', 12, 99, 3, 15_00, 16, false,
    [{ key: 'home_repair', kind: 'skill', share: 0.5 }, { key: 'car_maintenance', kind: 'skill', share: 0.3 }, { key: 'research', kind: 'skill', share: 0.2 }],
    'A bike, a shelf, a tap, a car. The first one takes four hours and the second takes forty minutes.'),
  d('weekend_garden', 'Do The Garden', 'weekend', 8, 99, 3, 12_00, 15, false,
    [{ key: 'gardening', kind: 'skill', share: 0.7 }, { key: 'mindfulness', kind: 'skill', share: 0.3 }],
    'Slow, physical and the results arrive months later, which is unlike almost everything else here.'),
];

export const DOING_BY_ID: Readonly<Record<string, Doing>> = Object.fromEntries(
  DOINGS.map((one) => [one.id, one]),
);

/** What somebody of this age could be doing at this point in a week. */
export function doingsAt(age: number, when: When): Doing[] {
  return DOINGS.filter((one) => age >= one.fromAge && age <= one.toAge
    && (when === 'any' || one.when === when));
}

// ---------------------------------------------------------------------------
// The classes anybody can take, at any age
// ---------------------------------------------------------------------------

export interface LifeClass {
  id: string;
  label: string;
  fromAge: number;
  /** What a session costs. */
  fee: Money;
  hours: number;
  demand: number;
  feeds: readonly { key: string; kind: 'skill' | 'attribute'; share: number }[];
  about: string;
}

/**
 * The classes that exist in every town.
 *
 * Not schools and not universities: the evening class, the community center,
 * the thing on a Tuesday. Every one of these builds something the skill sheet
 * actually carries, which is the point of it being on the sheet.
 */
export const LIFE_CLASSES: readonly LifeClass[] = [
  { id: 'acting', label: 'An Acting Class', fromAge: 6, fee: 35_00, hours: 2, demand: 18, about: 'A room, an exercise and somebody watching. The one on this list that’s also the job.', feeds: [{ key: 'emotional_truth', kind: 'attribute', share: 0.4 }, { key: 'listening', kind: 'skill', share: 0.3 }, { key: 'public_speaking', kind: 'skill', share: 0.3 }] },
  { id: 'dance', label: 'A Dance Class', fromAge: 4, fee: 22_00, hours: 1.5, demand: 26, about: 'Ballet, tap, jazz, street. An actor who can move gets seen for things an actor who can’t doesn’t.', feeds: [{ key: 'dancing', kind: 'skill', share: 0.6 }, { key: 'fitness', kind: 'skill', share: 0.4 }] },
  { id: 'singing', label: 'A Singing Lesson', fromAge: 7, fee: 40_00, hours: 1, demand: 14, about: 'Breath, support and a range that gets bigger rather than louder.', feeds: [{ key: 'singing', kind: 'attribute', share: 0.7 }, { key: 'public_speaking', kind: 'skill', share: 0.3 }] },
  { id: 'instrument', label: 'A Music Lesson', fromAge: 5, fee: 38_00, hours: 1, demand: 12, about: 'One instrument, half an hour a week with somebody who knows, and years of it.', feeds: [{ key: 'musical_instrument', kind: 'skill', share: 0.7 }, { key: 'memory', kind: 'skill', share: 0.3 }] },
  { id: 'swimming_lesson', label: 'A Swimming Lesson', fromAge: 3, fee: 18_00, hours: 1, demand: 24, about: 'The one on this list that’s a safety issue rather than a hobby.', feeds: [{ key: 'swimming', kind: 'skill', share: 0.8 }, { key: 'fitness', kind: 'skill', share: 0.2 }] },
  { id: 'first_aid_course', label: 'A First Aid Course', fromAge: 12, fee: 60_00, hours: 6, demand: 16, about: 'A day, a certificate, and the four minutes before an ambulance arrives.', feeds: [{ key: 'first_aid', kind: 'skill', share: 1 }] },
  { id: 'cookery', label: 'A Cookery Class', fromAge: 9, fee: 45_00, hours: 3, demand: 18, about: 'Knife, heat, seasoning, and why the recipe said to wait.', feeds: [{ key: 'cooking', kind: 'skill', share: 0.7 }, { key: 'nutrition', kind: 'skill', share: 0.3 }] },
  { id: 'language_class', label: 'A Language Class', fromAge: 7, fee: 30_00, hours: 2, demand: 16, about: 'Two years before anybody says a full sentence, and then it’s yours.', feeds: [{ key: 'languages', kind: 'skill', share: 1 }] },
  { id: 'photography_class', label: 'A Photography Class', fromAge: 10, fee: 42_00, hours: 3, demand: 12, about: 'Light, frame and the moment. Useful to anybody who will ever be in front of a camera.', feeds: [{ key: 'photography', kind: 'skill', share: 0.7 }, { key: 'drawing', kind: 'skill', share: 0.3 }] },
  { id: 'life_drawing', label: 'A Life Drawing Class', fromAge: 16, fee: 25_00, hours: 3, demand: 12, about: 'Two hours of looking properly, which is a harder skill than drawing.', feeds: [{ key: 'drawing', kind: 'skill', share: 0.7 }, { key: 'empathy', kind: 'skill', share: 0.3 }] },
  { id: 'sewing_class', label: 'A Sewing Class', fromAge: 9, fee: 28_00, hours: 3, demand: 12, about: 'A hem, a zip, and then a jacket that fits because you made it fit.', feeds: [{ key: 'sewing', kind: 'skill', share: 1 }] },
  { id: 'diy_workshop', label: 'A Home Repair Workshop', fromAge: 14, fee: 35_00, hours: 3, demand: 20, about: 'Somebody shows you which wall you may drill and which you may not.', feeds: [{ key: 'home_repair', kind: 'skill', share: 0.8 }, { key: 'research', kind: 'skill', share: 0.2 }] },
  { id: 'car_class', label: 'A Car Maintenance Class', fromAge: 15, fee: 40_00, hours: 3, demand: 22, about: 'Oil, tires, brake pads and the noise that means stop driving.', feeds: [{ key: 'car_maintenance', kind: 'skill', share: 1 }] },
  { id: 'money_class', label: 'A Personal Finance Course', fromAge: 14, fee: 30_00, hours: 2, demand: 12, about: 'Interest, tax, a budget and how a loan actually works, none of which most schools teach.', feeds: [{ key: 'personal_finance', kind: 'skill', share: 0.7 }, { key: 'mental_arithmetic', kind: 'skill', share: 0.3 }] },
  { id: 'public_speaking_class', label: 'A Public Speaking Group', fromAge: 13, fee: 20_00, hours: 2, demand: 18, about: 'A short talk in front of strangers every week until it stops being terrifying.', feeds: [{ key: 'public_speaking', kind: 'skill', share: 0.6 }, { key: 'small_talk', kind: 'skill', share: 0.2 }, { key: 'resilience', kind: 'skill', share: 0.2 }] },
  { id: 'meditation', label: 'A Meditation Class', fromAge: 10, fee: 18_00, hours: 1, demand: 6, about: 'Sitting still on purpose, which is much harder than it sounds and gets easier.', feeds: [{ key: 'mindfulness', kind: 'skill', share: 0.7 }, { key: 'resilience', kind: 'skill', share: 0.3 }] },
  { id: 'chess_club', label: 'A Chess Club', fromAge: 6, fee: 8_00, hours: 2, demand: 10, about: 'Losing a great many games to somebody older than you, which is how anybody learns it.', feeds: [{ key: 'chess', kind: 'skill', share: 0.7 }, { key: 'memory', kind: 'skill', share: 0.3 }] },
  { id: 'wine_course', label: 'A Wine Course', fromAge: 18, fee: 65_00, hours: 2, demand: 8, about: 'Six glasses, a spittoon, and the ability to order for a table without guessing.', feeds: [{ key: 'wine', kind: 'skill', share: 0.8 }, { key: 'etiquette', kind: 'skill', share: 0.2 }] },
  { id: 'bartending_course', label: 'A Bartending Course', fromAge: 18, fee: 70_00, hours: 4, demand: 20, about: 'Twenty drinks made properly, fast, while holding a conversation.', feeds: [{ key: 'bartending', kind: 'skill', share: 0.8 }, { key: 'small_talk', kind: 'skill', share: 0.2 }] },
  { id: 'etiquette_class', label: 'An Etiquette Class', fromAge: 12, fee: 45_00, hours: 2, demand: 8, about: 'Which fork, which room, which sentence. It’s snobbery until the night it isn’t.', feeds: [{ key: 'etiquette', kind: 'skill', share: 0.7 }, { key: 'small_talk', kind: 'skill', share: 0.3 }] },
];

export const CLASS_BY_ID: Readonly<Record<string, LifeClass>> = Object.fromEntries(
  LIFE_CLASSES.map((one) => [one.id, one]),
);

/** The classes open to somebody this age. */
export function classesAt(age: number): LifeClass[] {
  return LIFE_CLASSES.filter((one) => age >= one.fromAge);
}

/** How much of a session goes into a skill at the very top of the range. */
export const CEILING_DRAG = 0.35;
/** What a class is worth per hour, at the bottom of the range. */
export const PER_HOUR = 1.8;
