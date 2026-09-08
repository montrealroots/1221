/**
 * SLATE — growing up, which is most of a life.
 *
 * A childhood is not a loading screen before the career. It is the part where
 * a person is made: the first day at a school, the bike, the tooth, the best
 * friend, the falling out, the job that paid badly, the test that was failed
 * and taken again. All of it happens on a date, all of it is a decision, and
 * all of it leaves something behind — a memory, a little more of something, or
 * a person who is now in your life.
 *
 * None of this is a claim about anybody real. Every friend in here is SLATE's
 * own and every moment is generic to a life rather than taken from one.
 */

import type { Money } from '../core/money';

export const GROWING_NOTE =
  'The years between five and twenty five are not a gap between the character creation screen and '
  + 'a career. Everything in here happens on a day, in the place you are living, to the family you '
  + 'were born into, and what you decide is what you get. Nobody in it is real: the friends are '
  + 'SLATE’s own and the moments are the ordinary ones, not anybody’s in particular.';

export const ALLOWANCE_NOTE =
  'What a child gets is what the household can spare, so a family with money gives more of it. The '
  + 'amounts are SLATE’s own calibration and it stops when you start earning.';

export const DRIVING_NOTE =
  'The learning is real and the test can be failed. How many lessons it takes, what they cost and '
  + 'how hard the test is are SLATE’s own calibration; the age you may sit it is the country’s own '
  + 'and is carried with the other legal ages.';

// ---------------------------------------------------------------------------
// What a moment does
// ---------------------------------------------------------------------------

export interface Effect {
  /** Performer attributes moved, and by how much. */
  attribute?: Readonly<Record<string, number>>;
  /** Skills moved, and by how much. */
  skill?: Readonly<Record<string, number>>;
  /** Energy, stress and morale. */
  energy?: number;
  stress?: number;
  morale?: number;
  /** Money in or out, in cents. */
  money?: Money;
  /** How it lands with the people who raised you, and with your brothers and sisters. */
  parents?: number;
  siblings?: number;
  /** Whether it makes somebody a friend, or costs you one. */
  friend?: 'make' | 'lose';
  /** What goes in the history. */
  memory: string;
  significance: number;
  /** Whether anybody outside the room would know. */
  public?: boolean;
  /** What is said back, in the moment. */
  note: string;
}

export interface Choice {
  id: string;
  label: string;
  effect: Effect;
}

/** What a moment needs to be true before it can happen at all. */
export type Requires =
  | 'at_school' | 'at_secondary' | 'at_university' | 'has_sibling' | 'runs' | 'works'
  | 'may_drive' | 'may_work' | 'lives_at_home';

export interface Moment {
  id: string;
  title: string;
  /** What is happening, in the words the game would use. */
  detail: string;
  fromAge: number;
  toAge: number;
  requires?: Requires;
  /** How loudly it asks. */
  urgency: number;
  choices: readonly Choice[];
}

function c(id: string, label: string, effect: Effect): Choice {
  return { id, label, effect };
}

export const MOMENTS: readonly Moment[] = [
  // --- Small ---------------------------------------------------------------
  {
    id: 'first_day', title: 'The First Day', fromAge: 5, toAge: 6, requires: 'at_school', urgency: 40,
    detail: 'New shoes, a bag that is too big, and somebody at the gate telling you it will be fine.',
    choices: [
      c('hold_on', 'Hold On To Them', {
        attribute: { vulnerability: 1.5 }, parents: 3, stress: 6,
        memory: 'Cried at the gate on the first day and was fine by lunchtime.',
        significance: 4,
        note: 'You would not let go. Somebody had to be prised off, and by lunch you had forgotten about it.',
      }),
      c('walk_in', 'Walk In', {
        attribute: { resilience: 1.5, magnetism: 0.5 }, morale: 4,
        memory: 'Walked into the first day at school without looking back.',
        significance: 4,
        note: 'You went in without looking back. Somebody at the gate found that harder than you did.',
      }),
    ],
  },
  {
    id: 'tooth', title: 'The Tooth', fromAge: 6, toAge: 8, urgency: 20,
    detail: 'It has been hanging on for a week and it comes out in an apple.',
    choices: [
      c('pillow', 'Under The Pillow', {
        money: 2_00, parents: 2, morale: 3,
        memory: 'Left a tooth under the pillow and found something under it in the morning.',
        significance: 2,
        note: 'Under the pillow. There was something there in the morning and nobody has ever explained it.',
      }),
      c('keep', 'Keep It', {
        attribute: { backstory_invention: 0.8 },
        memory: 'Kept a tooth in a matchbox for years.',
        significance: 2,
        note: 'It went in a matchbox in a drawer, and it is probably still there.',
      }),
    ],
  },
  {
    id: 'bike', title: 'The Bike', fromAge: 6, toAge: 9, urgency: 30,
    detail: 'Somebody is holding the back of the saddle and swearing they have not let go.',
    choices: [
      c('again', 'Get Back On', {
        attribute: { coordination: 2, resilience: 1.5 }, skill: { fitness: 1 }, parents: 2,
        memory: 'Learned to ride a bike in an afternoon, after falling off it four times.',
        significance: 4,
        note: 'Four times off and back on, and then you were down the road and nobody was holding anything.',
      }),
      c('stop', 'Leave It For Now', {
        stress: -5, morale: -2,
        memory: 'Gave up on the bike that summer and learned the year after.',
        significance: 2,
        note: 'It went back in the garage. You learned the year after, and nobody minded.',
      }),
    ],
  },
  {
    id: 'party', title: 'The Party', fromAge: 6, toAge: 11, urgency: 25,
    detail: 'Your birthday, and the question is how many people are coming.',
    choices: [
      c('everyone', 'The Whole Class', {
        attribute: { magnetism: 1.5, social_instinct: 1 }, money: -80_00, parents: -1, friend: 'make',
        memory: 'Had the whole class round for a birthday, which was too many.',
        significance: 3,
        note: 'Thirty people in a house built for four. Somebody was sick and it was worth it.',
      }),
      c('few', 'Three Of Them', {
        attribute: { collaboration: 1 }, money: -20_00, friend: 'make', morale: 4,
        memory: 'Had three friends round for a birthday, and it was the better party.',
        significance: 3,
        note: 'Three people, a film and too much cake. It was the better party and you knew it.',
      }),
    ],
  },
  {
    id: 'trip', title: 'The School Trip', fromAge: 8, toAge: 13, requires: 'at_school', urgency: 30,
    detail: 'A coach at seven in the morning and a form that had to be signed a month ago.',
    choices: [
      c('go', 'Go', {
        attribute: { adaptability: 1.5, ensemble_blending: 1 }, money: -45_00, friend: 'make', morale: 5,
        memory: 'Went on the school trip and was sick on the coach.',
        significance: 3,
        note: 'You were sick on the coach on the way there and it was still the best week of the year.',
      }),
      c('stay', 'Stay Home', {
        money: 0, stress: -4, morale: -4,
        memory: 'Did not go on the school trip, and heard about it for a term.',
        significance: 2,
        note: 'You stayed. Everybody talked about it for a term and you smiled through all of it.',
      }),
    ],
  },
  {
    id: 'picked_last', title: 'Picked Last', fromAge: 8, toAge: 12, requires: 'at_school', urgency: 25,
    detail: 'Two captains, one ball, and everybody in a line while the names go.',
    choices: [
      c('prove', 'Prove Them Wrong', {
        attribute: { resilience: 2, physical_presence: 1 }, skill: { fitness: 1.5 }, stress: 5,
        memory: 'Was picked last, and spent a year making sure it did not happen again.',
        significance: 4,
        note: 'It stayed with you. It is still there, and it is why you do some of what you do.',
      }),
      c('shrug', 'Let It Go', {
        attribute: { restraint: 1.5, discretion: 1 }, stress: -3,
        memory: 'Was picked last and genuinely did not mind.',
        significance: 2,
        note: 'You genuinely did not mind. Not everybody has that and it is worth something.',
      }),
    ],
  },
  {
    id: 'talent', title: 'The Talent Show', fromAge: 8, toAge: 13, requires: 'at_school', urgency: 35,
    detail: 'A hall, a microphone that does not work, and a sign-up sheet on the door.',
    choices: [
      c('sing', 'Put Your Name Down', {
        attribute: { projection: 2, singing: 1.5, magnetism: 1.5 }, stress: 8, morale: 6, public: true,
        memory: 'Stood up in front of the whole school and did not die of it.',
        significance: 5,
        note: 'Two hundred faces and a microphone that cut out halfway. You finished it anyway.',
      }),
      c('watch', 'Watch From The Back', {
        attribute: { active_listening: 1 },
        memory: 'Watched the talent show from the back and thought about it for a week.',
        significance: 2,
        note: 'You watched, and you thought about it all the way home.',
      }),
    ],
  },

  // --- Bigger --------------------------------------------------------------
  {
    id: 'big_school', title: 'The Big School', fromAge: 11, toAge: 13, requires: 'at_secondary', urgency: 45,
    detail: 'A new building, a map you cannot read, and nobody from your old class in your form.',
    choices: [
      c('find_people', 'Find Your People', {
        attribute: { social_instinct: 2, networking: 1 }, friend: 'make', morale: 5,
        memory: 'Found the right two people in the first week of secondary school.',
        significance: 5,
        note: 'By Friday there were two of them and that was the next seven years sorted.',
      }),
      c('head_down', 'Keep Your Head Down', {
        attribute: { preparation: 1.5, discretion: 1.5 }, stress: 4,
        memory: 'Kept out of everybody’s way through the first year of secondary school.',
        significance: 4,
        note: 'You got through it by not being noticed, which works and costs something.',
      }),
    ],
  },
  {
    id: 'phone', title: 'The First Phone', fromAge: 11, toAge: 14, urgency: 30,
    detail: 'Everybody else has one. That is the whole argument and it is not a bad one.',
    choices: [
      c('earn', 'Earn Half Of It', {
        attribute: { preparation: 1 }, skill: { personal_finance: 2 }, money: -60_00, parents: 4,
        memory: 'Paid for half of the first phone, which took a summer.',
        significance: 3,
        note: 'You paid half. It took a summer and it was the first thing you ever bought.',
      }),
      c('ask', 'Just Ask', {
        parents: -2, morale: 4,
        memory: 'Was given a phone, and it was old and it was fine.',
        significance: 2,
        note: 'It was somebody else’s old one and it was completely fine.',
      }),
    ],
  },
  {
    id: 'best_friend', title: 'The Best Friend', fromAge: 10, toAge: 15, urgency: 35,
    detail: 'One of them turns out to be the one you call first.',
    choices: [
      c('in', 'All The Way In', {
        attribute: { collaboration: 2, chemistry: 1.5 }, friend: 'make', morale: 8,
        memory: 'Made a best friend, the kind you call first.',
        significance: 6,
        note: 'That is the one you call first now, and you will for a long time.',
      }),
      c('careful', 'Keep Something Back', {
        attribute: { discretion: 2, restraint: 1 }, friend: 'make',
        memory: 'Made a close friend and never quite let them all the way in.',
        significance: 4,
        note: 'Close, but not all the way. You have your reasons and they are yours.',
      }),
    ],
  },
  {
    id: 'falling_out', title: 'The Falling Out', fromAge: 12, toAge: 17, urgency: 40,
    detail: 'Something small said in front of other people, and now neither of you will go first.',
    choices: [
      c('go_first', 'Go First', {
        attribute: { emotional_truth: 2, vulnerability: 1.5 }, stress: -6, friend: 'make',
        memory: 'Went first after a falling out, which was the harder thing.',
        significance: 5,
        note: 'You went first. It was the harder thing and it worked.',
      }),
      c('wait', 'Wait Them Out', {
        attribute: { restraint: 1.5 }, stress: 8, friend: 'lose',
        memory: 'Waited somebody out after a falling out, and lost them over it.',
        significance: 5,
        note: 'Neither of you went first. That was that, and you still think about it.',
      }),
    ],
  },
  {
    id: 'first_crush', title: 'The First One', fromAge: 12, toAge: 16, urgency: 30,
    detail: 'You cannot concentrate in one particular room and everybody can tell.',
    choices: [
      c('say', 'Say Something', {
        attribute: { vulnerability: 2, romance: 1.5, resilience: 1 }, stress: 10, morale: 5,
        memory: 'Said something, at fourteen, and survived the answer.',
        significance: 5,
        note: 'You said it. Whatever came back, you said it, and that is the part that lasts.',
      }),
      c('nothing', 'Say Nothing', {
        attribute: { subtext: 2, restraint: 1.5 }, morale: -3,
        memory: 'Never said anything, and thought about it for two years.',
        significance: 4,
        note: 'You never said anything. Two years of it, and they never knew.',
      }),
    ],
  },
  {
    id: 'party_you_shouldnt', title: 'The Party You Were Not At', fromAge: 14, toAge: 17, urgency: 35,
    detail: 'Somebody’s house, somebody’s parents away, and you said you were somewhere else.',
    choices: [
      c('go', 'Go Anyway', {
        attribute: { adaptability: 1.5, social_instinct: 1.5 }, parents: -5, stress: 8, morale: 6,
        friend: 'make',
        memory: 'Went to a party under a story that did not hold, and got caught.',
        significance: 4,
        note: 'The story did not hold and everybody knew by Monday. It was worth it.',
      }),
      c('home', 'Stay In', {
        attribute: { reliability: 2 }, parents: 4, morale: -3,
        memory: 'Stayed in on the night everybody else was out.',
        significance: 3,
        note: 'You stayed in. It was quiet and everybody talked about it for a month.',
      }),
    ],
  },
  {
    id: 'heartbreak', title: 'The First Real One', fromAge: 15, toAge: 19, urgency: 45,
    detail: 'It ends, and it is the first thing that has ever actually hurt.',
    choices: [
      c('feel_it', 'Feel All Of It', {
        attribute: { emotional_truth: 3, grief: 2, vulnerability: 2 }, stress: 14, morale: -10,
        memory: 'Went through the first real heartbreak without pretending it was nothing.',
        significance: 7,
        note: 'You let it be as bad as it was. Every actor in the world has been to that room.',
      }),
      c('bury_it', 'Get On With It', {
        attribute: { restraint: 2, resilience: 1.5 }, stress: 6, morale: -4,
        memory: 'Got on with it after the first real heartbreak, and it came back later.',
        significance: 6,
        note: 'You got on with it. It will find you again in about four years.',
      }),
    ],
  },

  // --- Money ---------------------------------------------------------------
  {
    id: 'first_job', title: 'The First Job', fromAge: 14, toAge: 18, requires: 'may_work', urgency: 45,
    detail: 'A card in a window, a shift nobody else wants, and somebody who will pay you for it.',
    choices: [
      c('take_it', 'Take It', {
        skill: { operations: 2, public_speaking: 1.5 }, attribute: { punctuality: 2, reliability: 1.5 },
        money: 320_00, energy: -10,
        memory: 'Took the first job, which paid badly and taught more than it paid.',
        significance: 5,
        note: 'Minimum wage, a manager who counts the float twice, and a summer of it.',
      }),
      c('not_yet', 'Not Yet', {
        stress: -4,
        memory: 'Turned down the first job offer and stayed a child a while longer.',
        significance: 3,
        note: 'Not yet. There is time, and you only get to be this age once.',
      }),
    ],
  },
  {
    id: 'first_wage', title: 'The First Wage', fromAge: 14, toAge: 19, requires: 'works', urgency: 30,
    detail: 'A number in an account with your name on it, and it is smaller than you expected.',
    choices: [
      c('spend', 'Spend It', {
        morale: 8, skill: { personal_finance: -0.5 }, money: -180_00,
        memory: 'Spent the first wage in a weekend, on nothing anybody remembers.',
        significance: 3,
        note: 'Gone by Sunday. Nobody can tell you what on and that is fine.',
      }),
      c('save', 'Put It Away', {
        skill: { personal_finance: 3 }, attribute: { career_strategy: 1 }, morale: -2,
        memory: 'Saved the first wage, and every one after it for a year.',
        significance: 4,
        note: 'It went in an account and stayed there, which almost nobody does at that age.',
      }),
    ],
  },

  // --- Driving --------------------------------------------------------------
  {
    id: 'learn_to_drive', title: 'Learning To Drive', fromAge: 16, toAge: 30, requires: 'may_drive', urgency: 40,
    detail: 'An instructor with dual controls and a great deal of patience, and it costs by the hour.',
    choices: [
      c('start', 'Book The Lessons', {
        skill: { driving: 4 }, money: -45_00, energy: -8,
        memory: 'Started learning to drive.',
        significance: 4,
        note: 'Mirror, signal, and an hour of roundabouts. The first one is paid for.',
      }),
      c('later', 'Later', {
        stress: -2,
        memory: 'Put off learning to drive.',
        significance: 2,
        note: 'It can wait. Plenty of people never bother at all.',
      }),
    ],
  },

  // --- Later ---------------------------------------------------------------
  {
    id: 'after_school', title: 'What Happens Next', fromAge: 17, toAge: 19, urgency: 55,
    detail: 'Everybody is asking, including people with no business asking.',
    choices: [
      c('study', 'Keep Studying', {
        attribute: { script_analysis: 1.5, preparation: 1.5 }, parents: 4,
        memory: 'Decided to keep studying, which pleased a lot of people.',
        significance: 5,
        note: 'That is the plan, and the people who asked are all delighted.',
      }),
      c('work', 'Go And Work', {
        skill: { operations: 2 }, attribute: { resilience: 1.5 }, parents: -2,
        memory: 'Decided to go and work rather than keep studying.',
        significance: 5,
        note: 'Work, then. Somebody at a table will have an opinion about it for years.',
      }),
      c('go_for_it', 'Chase It', {
        attribute: { emotional_truth: 2, career_strategy: 2, resilience: 2 }, parents: -4, stress: 10,
        memory: 'Decided at eighteen to chase acting, and told everybody so.',
        significance: 7, public: true,
        note: 'You said it out loud, to people who did not want to hear it. That is the whole thing.',
      }),
    ],
  },
  {
    id: 'move_out', title: 'Moving Out', fromAge: 18, toAge: 26, requires: 'lives_at_home', urgency: 50,
    detail: 'A box of things that fits in one car, and a door that is yours.',
    choices: [
      c('go', 'Go', {
        attribute: { adaptability: 2, resilience: 1.5 }, skill: { cooking: 1, personal_finance: 1 },
        parents: -1, stress: 8, morale: 8,
        memory: 'Moved out, with everything owned in one car.',
        significance: 7,
        note: 'One car, one trip. The first night is very quiet and then it is yours.',
      }),
      c('stay', 'Stay A While', {
        parents: 3, stress: -5, morale: -2,
        memory: 'Stayed at home longer than most, and saved a great deal of money doing it.',
        significance: 4,
        note: 'You stayed. It is cheaper, it is warmer, and everybody has an opinion.',
      }),
    ],
  },
  {
    id: 'the_call', title: 'The Call At Two In The Morning', fromAge: 19, toAge: 45, urgency: 60,
    detail: 'Somebody in the family, and it is not good news, and you are the one they rang.',
    choices: [
      c('go_now', 'Go Now', {
        attribute: { reliability: 2.5, emotional_truth: 1.5 }, parents: 8, siblings: 6,
        energy: -25, stress: 12,
        memory: 'Got in the car at two in the morning because somebody in the family rang.',
        significance: 7,
        note: 'You went. Whatever it cost the next day, you went, and they will not forget it.',
      }),
      c('morning', 'First Thing', {
        attribute: { restraint: 1 }, parents: -2, stress: 6,
        memory: 'Waited until morning after a call in the middle of the night.',
        significance: 5,
        note: 'You went first thing. It was the sensible call and it is not the one they remember.',
      }),
    ],
  },
];

export const MOMENT_BY_ID: Readonly<Record<string, Moment>> = Object.fromEntries(
  MOMENTS.map((one) => [one.id, one]),
);

/** Everything that could happen at this age. */
export function momentsAt(age: number): Moment[] {
  return MOMENTS.filter((one) => age >= one.fromAge && age <= one.toAge);
}

// ---------------------------------------------------------------------------
// Pocket money
// ---------------------------------------------------------------------------

/** What a child is given a week, before the local cost of living. SLATE's own. */
export const ALLOWANCE_BY_AGE: readonly { fromAge: number; aWeek: Money }[] = [
  { fromAge: 5, aWeek: 2_00 },
  { fromAge: 8, aWeek: 5_00 },
  { fromAge: 11, aWeek: 10_00 },
  { fromAge: 14, aWeek: 20_00 },
  { fromAge: 16, aWeek: 30_00 },
];

/** The age pocket money stops, because by then you are earning or you are not. */
export const ALLOWANCE_STOPS_AT = 18;

export function allowanceAt(age: number): Money {
  let out = 0;
  for (const band of ALLOWANCE_BY_AGE) if (age >= band.fromAge) out = band.aWeek;
  return age >= ALLOWANCE_STOPS_AT ? 0 : out;
}

// ---------------------------------------------------------------------------
// The driving test
// ---------------------------------------------------------------------------

/** What an hour with an instructor costs, before the local cost of living. */
export const LESSON_COST = 45_00;

/** What the test itself costs. */
export const TEST_COST = 62_00;

/** How many hours it takes most people before they are ready. */
export const LESSONS_TO_READY = 20;

/** The mark a test is passed on, out of a hundred. */
export const TEST_PASSES_AT = 62;
