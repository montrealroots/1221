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
        energy: -10,
        memory: 'Decided to get a job, and went and got one.',
        significance: 5,
        note: 'You said yes to the idea of it. What is going, and what it pays, is on your own page.',
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
        memory: 'Spent a first wage in a weekend, on nothing anybody remembers.',
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

  // --- The rest of a childhood ---------------------------------------------
  {
    id: 'the_pet', title: 'The Animal', fromAge: 6, toAge: 14, urgency: 30,
    detail: 'Somebody at the door with a box, and everybody in the house already knows how this ends.',
    choices: [
      c('keep_it', 'Keep It', {
        attribute: { reliability: 1.5, vulnerability: 1 }, money: -140_00, parents: 2, morale: 8,
        memory: 'Got an animal at eight, and it was the first thing that was ever yours to look after.',
        significance: 5,
        note: 'It is yours to feed, walk and worry about, and you will be doing all three for years.',
      }),
      c('no', 'Somebody Else', {
        parents: 1, morale: -4,
        memory: 'Did not get the animal, and thought about it for a long time.',
        significance: 2,
        note: 'It went to somebody else’s house. You saw it once, in a garden, from a car.',
      }),
    ],
  },
  {
    id: 'moving_house', title: 'The Move', fromAge: 6, toAge: 15, urgency: 45,
    detail: 'A van outside, your room in boxes, and a new town on the other end of it.',
    choices: [
      c('start_again', 'Start Again Properly', {
        attribute: { adaptability: 2.5, social_instinct: 1.5 }, friend: 'make', stress: 8,
        memory: 'Moved towns as a child and set about making it work from the first week.',
        significance: 6,
        note: 'New town, new school, and you went at it from the first week rather than waiting.',
      }),
      c('hold_on', 'Hold On To The Old One', {
        attribute: { memorization: 1, grief: 1.5 }, friend: 'lose', stress: 10, morale: -6,
        memory: 'Moved towns and spent a year on the phone to the old one.',
        significance: 5,
        note: 'You kept ringing. It held for a while and then it did not, the way it does.',
      }),
    ],
  },
  {
    id: 'the_bully', title: 'The One Who Waits For You', fromAge: 8, toAge: 15, requires: 'at_school', urgency: 50,
    detail: 'It is the same corridor at the same time and everybody knows and nobody says.',
    choices: [
      c('tell', 'Tell Somebody', {
        attribute: { emotional_truth: 1.5, vulnerability: 1.5 }, parents: 5, stress: -8,
        memory: 'Told somebody about the one who waited, which took more than not telling did.',
        significance: 6,
        note: 'You told somebody. It was harder than saying nothing and it worked better.',
      }),
      c('stand', 'Stand There', {
        attribute: { resilience: 2.5, menace: 1 }, stress: 12,
        memory: 'Stood there instead of walking round, once, and it stopped.',
        significance: 6,
        note: 'You stood there. It stopped, and it cost you something to find out it would.',
      }),
      c('avoid', 'Take The Long Way', {
        attribute: { discretion: 1.5 }, stress: 5, morale: -5,
        memory: 'Took the long way round for a whole year.',
        significance: 4,
        note: 'You took the long way for a year, and it was fine, and you still know the route.',
      }),
    ],
  },
  {
    id: 'school_report', title: 'The Report', fromAge: 7, toAge: 17, requires: 'at_school', urgency: 35,
    detail: 'An envelope on the table and somebody waiting for you to open it in front of them.',
    choices: [
      c('own_it', 'Read It Out', {
        attribute: { note_integration: 2, resilience: 1 }, parents: 4,
        memory: 'Read a school report out loud at the table, including the bad line.',
        significance: 3,
        note: 'You read it out, including the line about effort. That went down better than hiding it.',
      }),
      c('bury', 'Leave It In The Bag', {
        attribute: { discretion: 1 }, parents: -4, stress: 6,
        memory: 'Left a school report in a bag for three weeks.',
        significance: 3,
        note: 'It stayed in the bag until somebody found it, which is worse and everybody knew it would be.',
      }),
    ],
  },
  {
    id: 'the_hospital', title: 'A Night In Hospital', fromAge: 5, toAge: 18, urgency: 55,
    detail: 'An arm at the wrong angle, a plastic chair, and four hours before anybody looks at it.',
    choices: [
      c('brave', 'Do Not Make A Fuss', {
        attribute: { injury_resilience: 2, restraint: 1.5 }, money: -220_00, stress: 6,
        memory: 'Broke something as a child and did not make a fuss about it, which everybody mentioned.',
        significance: 5,
        note: 'Nobody in that waiting room knew how much it hurt, which was the point.',
      }),
      c('honest', 'Say How Bad It Is', {
        attribute: { emotional_truth: 2 }, money: -220_00, parents: 3, stress: 10,
        memory: 'Broke something as a child and said exactly how bad it was.',
        significance: 5,
        note: 'You said exactly how bad it was, and they moved you up the list.',
      }),
    ],
  },
  {
    id: 'grandparent', title: 'The Kitchen With The Radio On', fromAge: 5, toAge: 20, urgency: 30,
    detail: 'Somebody older than everybody, a kitchen that smells the same every time, and no hurry at all.',
    choices: [
      c('listen', 'Sit And Listen', {
        attribute: { active_listening: 2.5, backstory_invention: 2 }, morale: 6,
        memory: 'Spent whole afternoons in a kitchen listening to somebody old tell it wrong on purpose.',
        significance: 6,
        note: 'Hours of it. Half of what you know about people, you got in that kitchen.',
      }),
      c('outside', 'Go And Play', {
        attribute: { stamina: 1 }, morale: 4,
        memory: 'Was outside for most of it, and wishes now that they had sat down.',
        significance: 3,
        note: 'You were outside for most of it. Everybody is, and everybody says the same thing later.',
      }),
    ],
  },
  {
    id: 'summer', title: 'The Long Summer', fromAge: 7, toAge: 16, urgency: 25,
    detail: 'Six weeks, nothing in them, and it will never be this long again.',
    choices: [
      c('outside', 'Be Out All Day', {
        attribute: { stamina: 1.5, physical_presence: 1 }, skill: { fitness: 2 }, morale: 8,
        memory: 'Spent a whole summer outside and came back in September a different shape.',
        significance: 4,
        note: 'Out at nine, back when it got dark, every day of it.',
      }),
      c('inside', 'Read Everything In The House', {
        attribute: { script_analysis: 2, backstory_invention: 1.5 }, morale: 4,
        memory: 'Spent a summer reading everything in the house, including the things meant for adults.',
        significance: 4,
        note: 'You read everything, including things nobody meant you to. It shows, later.',
      }),
      c('screen', 'Watch Everything', {
        attribute: { camera_awareness: 2, comedy_timing: 1.5 }, skill: { visual_language: 1.5 },
        morale: 5,
        memory: 'Watched everything, twice, in one summer, and started noticing how it was made.',
        significance: 5,
        note: 'Everything, twice, and by August you were noticing the cuts. That is where it starts.',
      }),
    ],
  },
  {
    id: 'first_gig', title: 'The First Gig', fromAge: 13, toAge: 19, urgency: 35,
    detail: 'A room too small for the number of people in it, and somebody’s parent waiting outside.',
    choices: [
      c('front', 'Get To The Front', {
        attribute: { magnetism: 2, physical_presence: 1.5 }, money: -35_00, morale: 10, friend: 'make',
        memory: 'Got to the front at the first gig and could not hear properly for two days.',
        significance: 5,
        note: 'Down the front, deaf until Tuesday, and worth every minute of it.',
      }),
      c('back', 'Stay At The Back', {
        attribute: { stillness: 1.5, active_listening: 1.5 }, money: -35_00, morale: 5,
        memory: 'Watched the first gig from the back, and saw the whole room rather than the band.',
        significance: 4,
        note: 'From the back you could see the whole room, which turns out to be the more useful view.',
      }),
    ],
  },
  {
    id: 'the_haircut', title: 'The Haircut', fromAge: 12, toAge: 19, urgency: 20,
    detail: 'You have seen a photograph and you are certain, and the person holding the scissors is not.',
    choices: [
      c('do_it', 'Do It', {
        attribute: { photogenic_quality: 1, resilience: 1.5 }, money: -30_00, morale: -4, stress: 5,
        memory: 'Had the haircut. There are photographs and they have not been destroyed.',
        significance: 3,
        note: 'It grew back. There are photographs, and somebody in your family has kept all of them.',
      }),
      c('sensible', 'Something Sensible', {
        attribute: { restraint: 1 }, money: -30_00,
        memory: 'Did not have the haircut, and quietly regrets it.',
        significance: 2,
        note: 'Sensible. You will wonder about it for years and never do it.',
      }),
    ],
  },
  {
    id: 'exam_results', title: 'Results Day', fromAge: 15, toAge: 19, requires: 'at_school', urgency: 60,
    detail: 'A hall, a table, an envelope with your name on it, and everybody watching everybody else open theirs.',
    choices: [
      c('open_there', 'Open It There', {
        attribute: { pressure_tolerance: 2, resilience: 1.5 }, stress: 10,
        memory: 'Opened the envelope in the hall in front of everybody.',
        significance: 6,
        note: 'You opened it there, in front of everybody, which is the braver of the two.',
      }),
      c('outside', 'Take It Outside', {
        attribute: { discretion: 2, restraint: 1 }, stress: 5,
        memory: 'Took the envelope outside and opened it round the corner, alone.',
        significance: 5,
        note: 'Round the corner, alone, and then you knew and nobody else did yet.',
      }),
    ],
  },
  {
    id: 'friend_moves', title: 'The One Who Left', fromAge: 10, toAge: 20, urgency: 40,
    detail: 'Their family is moving, it was decided months ago, and you found out on a Tuesday.',
    choices: [
      c('keep_up', 'Keep It Going', {
        attribute: { collaboration: 1.5, reliability: 2 }, stress: 4, morale: -3,
        memory: 'Kept a friendship going across a distance, for years, mostly by being the one who rang.',
        significance: 5,
        note: 'You were the one who rang, every time, for years. That is a thing you now know about yourself.',
      }),
      c('let_go', 'Let It Go', {
        attribute: { restraint: 1.5, grief: 1 }, friend: 'lose', morale: -6,
        memory: 'Let a friendship go when they moved, and it was the honest thing.',
        significance: 4,
        note: 'You let it go. It was honest, and it still went quiet faster than you expected.',
      }),
    ],
  },
  {
    id: 'first_drink', title: 'The First One', fromAge: 15, toAge: 21, urgency: 35,
    detail: 'A kitchen at a party, something warm in a plastic cup, and everybody pretending they have done this before.',
    choices: [
      c('in', 'Go With It', {
        attribute: { social_instinct: 1.5, adaptability: 1 }, stress: -4, morale: 5, energy: -12,
        memory: 'Had the first one at a kitchen party and did not enjoy any of it.',
        significance: 4,
        note: 'It was warm, it was horrible, and you said it was fine. Everybody did.',
      }),
      c('pass', 'Pass', {
        attribute: { restraint: 2, discretion: 1 }, morale: -2,
        memory: 'Passed on the first one, in a kitchen, in front of everybody.',
        significance: 4,
        note: 'You said no in a kitchen full of people, which takes more than saying yes did.',
      }),
    ],
  },
  {
    id: 'the_crash', title: 'In The Passenger Seat', fromAge: 14, toAge: 24, urgency: 60,
    detail: 'Somebody your age driving, somebody your age in the back, and a wall that was not there a second ago.',
    choices: [
      c('say_it', 'Say Something Next Time', {
        attribute: { safety_awareness: 2.5, emotional_truth: 1 }, stress: 14, friend: 'lose',
        memory: 'Was in a car that hit something, and never got in it with them again.',
        significance: 7,
        note: 'Nobody was hurt. You never got in a car with them again and you told them why.',
      }),
      c('nothing', 'Say Nothing', {
        attribute: { restraint: 1, discretion: 1.5 }, stress: 10,
        memory: 'Was in a car that hit something, and said nothing about it to anybody.',
        significance: 6,
        note: 'Nobody was hurt and nobody said anything. You still think about it in traffic.',
      }),
    ],
  },
  {
    id: 'the_flatshare', title: 'The Flatshare', fromAge: 18, toAge: 30, urgency: 40,
    detail: 'Three strangers, one bathroom, a rota nobody follows, and somebody’s milk with a name on it.',
    choices: [
      c('get_on', 'Make It Work', {
        attribute: { collaboration: 2, adaptability: 1.5 }, friend: 'make', stress: 4,
        memory: 'Lived with strangers and came out of it with one of them as a friend.',
        significance: 5,
        note: 'One of them turns out to be somebody you would go anywhere for. The other two you have lost.',
      }),
      c('keep_to_room', 'Keep To Your Room', {
        attribute: { discretion: 1.5, stillness: 1 }, stress: -3, morale: -4,
        memory: 'Lived with strangers for a year and barely knew any of them.',
        significance: 3,
        note: 'A year of it and you could not tell anybody their surnames.',
      }),
    ],
  },
  {
    id: 'the_landlord', title: 'The Damp Patch', fromAge: 18, toAge: 35, urgency: 45,
    detail: 'It has been there since October, it is now March, and the emails have stopped being answered.',
    choices: [
      c('push', 'Push It', {
        skill: { negotiation: 2.5, personal_finance: 1 }, attribute: { pressure_tolerance: 1.5 },
        stress: 8,
        memory: 'Got a landlord to fix something by being the tenant who would not go away.',
        significance: 5,
        note: 'It took eleven emails and a phone call to somebody’s office. It got fixed.',
      }),
      c('live_with_it', 'Live With It', {
        attribute: { resilience: 1 }, stress: 5, morale: -5,
        memory: 'Lived with a damp patch for a year rather than have the argument.',
        significance: 3,
        note: 'You put a wardrobe in front of it. It is still there, behind the wardrobe.',
      }),
    ],
  },
  {
    id: 'the_reunion', title: 'The Ten Years', fromAge: 26, toAge: 45, urgency: 30,
    detail: 'A message from somebody you have not thought about since, about a room full of people you were at school with.',
    choices: [
      c('go', 'Go', {
        attribute: { networking: 1.5, social_instinct: 1.5 }, money: -60_00, morale: 4, friend: 'make',
        memory: 'Went to the reunion, and half of them were unrecognizable and half had not changed at all.',
        significance: 4,
        note: 'Half of them you would have walked past. The other half had not moved an inch.',
      }),
      c('skip', 'Do Not Go', {
        attribute: { discretion: 1 }, stress: -3,
        memory: 'Did not go to the reunion, and heard about it for a month.',
        significance: 2,
        note: 'You did not go, and three people sent you photographs anyway.',
      }),
    ],
  },
  {
    id: 'a_parent_needs_you', title: 'The Other Way Round Now', fromAge: 28, toAge: 60, urgency: 65,
    detail: 'The person who looked after you needs looking after, and nobody has said it out loud yet.',
    choices: [
      c('step_up', 'Say It Out Loud', {
        attribute: { emotional_truth: 2.5, reliability: 2 }, parents: 10, stress: 16, energy: -15,
        memory: 'Was the one who said out loud that a parent needed help.',
        significance: 8,
        note: 'You said it. It was the hardest conversation of the year and somebody had to have it.',
      }),
      c('wait', 'Wait For Somebody Else To', {
        attribute: { restraint: 1 }, parents: -3, siblings: -3, stress: 10,
        memory: 'Waited for somebody else to say that a parent needed help.',
        significance: 6,
        note: 'Somebody else said it in the end. That sits in the family for a long time.',
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
