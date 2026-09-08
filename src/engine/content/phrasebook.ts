/**
 * SLATE — saying what you want in your own words.
 *
 * The game has three hundred and forty commands. This is the much shorter list
 * of things somebody would actually type at it, and the words they would use.
 *
 * Every entry points at something the game really does. Nothing here invents a
 * capability: an entry either runs a real command, or it takes you to the
 * screen where that thing is done and says so. Where an entry needs something
 * picked — which dentist, which friend — it says what kind of thing, and the
 * resolver finds the candidates in the world rather than guessing one.
 *
 * The phrasings are the point. "I want to go to bed", "get some sleep", "turn
 * in" and "kip" are all the same thing to a person and should be the same
 * thing here.
 */

/** What an entry needs before it can run. */
export type Needs = 'nothing' | 'place' | 'person' | 'screen';

export interface Askable {
  id: string;
  /** What it is, in the words a button would use. */
  label: string;
  /** Everything somebody might type for it. */
  says: readonly string[];
  /**
   * The command it runs. Absent when it is a screen rather than a command.
   *
   * For an entry that needs a place, this is what happens once you are
   * standing in the right one; getting there is `go.to` and the resolver
   * works out which of the two you needed.
   */
  command?: string;
  /** A fixed payload, where the command takes one and it is always the same. */
  payload?: Readonly<Record<string, unknown>>;
  /** Where it is done. Carried on every entry so the answer can always point. */
  route: string;
  needs: Needs;
  /** The kind of place to look for, where it needs one. */
  placeKind?: string;
  /** What this actually does, said plainly, for the confirmation. */
  about: string;
}

const a = (
  id: string, label: string, says: readonly string[], route: string, needs: Needs,
  about: string, command?: string, payload?: Readonly<Record<string, unknown>>, placeKind?: string,
): Askable => ({ id, label, says, route, needs, about, command, payload, placeKind });

/**
 * The things you can ask for.
 *
 * Ordered by nothing in particular; the resolver scores rather than scans. What
 * matters is that every phrasing somebody would really use is on the entry it
 * belongs to, and that no entry claims a command the game does not have.
 */
export const PHRASEBOOK: readonly Askable[] = [
  // --- The body, which is most of an ordinary day --------------------------
  a('sleep', 'Go To Bed', [
    'sleep', 'go to bed', 'get some sleep', 'turn in', 'have a kip', 'nap', 'lie down',
    'get an early night', 'go to sleep', 'rest', 'bed',
  ], '/workspace/wellbeing', 'nothing', 'Eight hours, or as many as you have left in the night.',
  'life.sleep', { hours: 8 }),
  a('shower', 'Have A Shower', [
    'shower', 'have a shower', 'get clean', 'wash', 'bath', 'take a bath', 'freshen up',
  ], '/workspace/wellbeing', 'nothing', 'A shower, wherever you are standing that has one.', 'life.shower'),
  a('eat', 'Eat Something', [
    'eat', 'have something to eat', 'get food', 'have dinner', 'have lunch', 'have breakfast',
    'im hungry', 'grab a bite', 'feed myself',
  ], '/workspace/wellbeing', 'screen', 'What is in the house, and what it does for you.'),
  a('cook', 'Cook Something', [
    'cook', 'make dinner', 'cook a meal', 'make something', 'cook for everybody', 'make food',
  ], '/workspace/wellbeing', 'screen', 'A recipe you have the ingredients and the pans for.'),

  // --- Where you are -------------------------------------------------------
  a('go_home', 'Go Home', [
    'go home', 'head home', 'back home', 'get home', 'home',
  ], '/workspace/city', 'nothing', 'Back to wherever you live.', 'go.to', { home: true }),
  a('go_out', 'Go Somewhere', [
    'go somewhere', 'go out', 'leave the house', 'get out of here', 'where can i go',
  ], '/workspace/city', 'screen', 'Everywhere in this city, and how long it takes to get there.'),
  a('refuel', 'Fill The Tank', [
    'fill up', 'get fuel', 'get petrol', 'get gas', 'refuel', 'fill the tank', 'the tank is empty',
    'fill up the car', 'fill the car up', 'put fuel in the car', 'put gas in the car',
    'petrol station', 'gas station', 'filling station', 'need fuel', 'need gas', 'need petrol',
  ], '/workspace/city', 'place', 'A filling station, and the tank full.', 'place.refuel', undefined, 'gas_station'),

  // --- The four ordinary rooms ---------------------------------------------
  a('dentist', 'Go To The Dentist', [
    'dentist', 'go to the dentist', 'see a dentist', 'dental', 'my teeth', 'get my teeth looked at',
    'toothache', 'book a check up', 'my teeth hurt', 'my tooth hurts', 'i need a filling',
  ], '/workspace/health', 'place', 'A dental practice in this city, and a look at your teeth.',
  'go.to', undefined, 'dentist'),
  a('vet', 'Take Them To The Vet', [
    'vet', 'go to the vet', 'take the dog to the vet', 'take the cat to the vet', 'the animal is not well',
    'boosters', 'get them chipped', 'the dog is ill', 'the cat is ill', 'my pet is not well',
  ], '/workspace/health', 'place', 'A veterinary practice in this city.', 'go.to', undefined, 'vet'),
  a('licensing', 'Go To The Licensing Office', [
    'dmv', 'licensing office', 'renew my license', 'get a license', 'driving license',
    'register the car', 'change my address', 'the rmv', 'the dvla',
  ], '/workspace/city', 'place', 'The licensing office for where you are standing, and a ticket.',
  'go.to', undefined, 'license_office'),
  a('phone_shop', 'Go To The Phone Shop', [
    'phone shop', 'get a phone', 'phone contract', 'sim card', 'new plan', 'fix my screen',
    'my screen is cracked', 'change network',
  ], '/workspace/city', 'place', 'A phone shop, a plan, or the screen mended.', 'go.to', undefined, 'phone_shop'),
  a('chemist', 'Go To The Chemist', [
    'chemist', 'pharmacy', 'drugstore', 'pick up a prescription', 'get some paracetamol',
  ], '/workspace/city', 'place', 'A pharmacy, and what is on the counter.', 'go.to', undefined, 'pharmacy'),
  a('post', 'Go To The Post Office', [
    'post office', 'post a parcel', 'send a parcel', 'send something', 'buy stamps', 'mail something',
  ], '/workspace/city', 'place', 'A post office, and a counter to queue at.', 'go.to', undefined, 'post_office'),
  a('haircut', 'Get A Haircut', [
    'haircut', 'get my hair cut', 'barber', 'salon', 'get a trim', 'do something about my hair',
  ], '/workspace/city', 'place', 'A chair, and something done about your hair.', 'go.to', undefined, 'salon'),
  a('launderette', 'Do The Washing', [
    'launderette', 'laundromat', 'do the washing', 'wash my clothes', 'service wash',
  ], '/workspace/city', 'place', 'A launderette, and somebody else doing it if you would rather.',
  'go.to', undefined, 'launderette'),

  // --- Work ----------------------------------------------------------------
  a('work_shift', 'Work The Shift', [
    'work', 'go to work', 'do my shift', 'work the shift', 'go in', 'clock in', 'do a shift',
    'earn some money', 'do my hours',
  ], '/workspace/character', 'nothing', 'The shift you are down for, if you are down for one today.', 'job.shift'),
  a('call_in_sick', 'Ring In Sick', [
    'call in sick', 'ring in sick', 'phone in sick', 'im ill', 'im not going in', 'pull a sickie',
  ], '/workspace/character', 'nothing', 'A phone call, and whether it was true is a thing they find out.',
  'job.call_in_sick'),
  a('quit_job', 'Hand Your Notice In', [
    'quit', 'quit my job', 'hand my notice in', 'resign', 'leave my job', 'jack it in',
  ], '/workspace/character', 'nothing', 'You are done there. The hours already worked still get paid.',
  'job.quit'),
  a('find_job', 'Find A Job', [
    'get a job', 'find a job', 'look for work', 'i need money', 'apply for a job', 'saturday job',
  ], '/workspace/character', 'screen', 'What is going in this city for somebody your age.'),

  // --- School and the tests ------------------------------------------------
  a('school', 'Go To School', [
    'go to school', 'school', 'attend school', 'go to class', 'go to lessons',
  ], '/workspace/education', 'nothing', 'The day on your timetable, and what it does to the marks.',
  'school.attend', { effort: 'normal' }),
  a('school_hard', 'Go And Work', [
    'work hard at school', 'try at school', 'concentrate', 'go and work', 'pay attention',
  ], '/workspace/education', 'nothing', 'The same day, taken seriously, which costs more and is worth more.',
  'school.attend', { effort: 'hard' }),
  a('skip_school', 'Skip School', [
    'skip school', 'bunk off', 'skive', 'not go to school', 'ditch school', 'play truant',
  ], '/workspace/education', 'nothing', 'Not going. It costs the marks and somebody notices.', 'school.skip'),
  a('revise', 'Work A Past Paper', [
    'revise', 'study', 'do some revision', 'past paper', 'prepare for the exam', 'cram',
  ], '/workspace/education', 'nothing', 'Two hours on a past paper for the next thing you are down for.',
  'exam.study'),
  a('exams', 'The Big Tests', [
    'exam', 'exams', 'sat', 'act', 'gcse', 'put my name down for the sat', 'sit an exam',
    'test', 'report card', 'my grades',
  ], '/workspace/education', 'screen', 'What you can sit where you are, and what came back.'),

  // --- Training and the week -----------------------------------------------
  a('train_art', 'Train', [
    'train', 'go to training', 'jiu jitsu', 'judo', 'karate', 'boxing', 'muay thai', 'go to the dojo',
    'do some training', 'martial arts',
  ], '/workspace/wellbeing', 'nothing', 'A session on the mat at the gym you train at.', 'week.train'),
  a('grade_up', 'Take The Grading', [
    'grading', 'go for my belt', 'take the grading', 'grade up', 'next belt',
  ], '/workspace/wellbeing', 'nothing', 'The panel, if the time and the hours are there. It can be failed.',
  'week.grade'),
  a('track_train', 'Train On The Track', [
    'go to the track', 'train for track', 'do a session', 'sprint training', 'run a session',
  ], '/workspace/track', 'nothing', 'A session, and what it does to the running skills.', 'track.train'),
  a('gym', 'Go To The Gym', [
    'gym', 'go to the gym', 'work out', 'lift', 'exercise', 'do a workout', 'hit the gym',
    'lift weights', 'go training', 'do some cardio',
  ], '/workspace/city', 'place', 'A gym in this city, where a session is booked and worked through.',
  'go.to', undefined, 'gym'),
  a('classes', 'Take A Class', [
    'take a class', 'acting class', 'dance class', 'singing lesson', 'learn something',
    'music lesson', 'evening class', 'learn to cook',
  ], '/workspace/wellbeing', 'screen', 'The classes that exist in every town, and what each builds.'),
  a('week', 'The Rest Of The Week', [
    'what should i do', 'hang out', 'see my friends', 'go out with friends', 'do something today',
    'the weekend', 'lunch',
  ], '/workspace/wellbeing', 'screen', 'The hours around the lessons, and who you spend them with.'),

  // --- Money ---------------------------------------------------------------
  a('bank', 'Look At The Money', [
    'money', 'bank', 'my balance', 'how much have i got', 'check my account', 'am i broke',
    'my bills', 'what do i owe',
  ], '/workspace/bank', 'screen', 'Accounts, bills, cards and what is owed.'),
  a('pay_bills', 'Pay The Bills', [
    'pay the bills', 'pay a bill', 'settle up', 'pay what i owe',
  ], '/workspace/bank', 'screen', 'What is outstanding, and paying it.'),
  a('shop', 'Go Shopping', [
    'shopping', 'buy something', 'go to the shops', 'go shopping', 'i need clothes', 'buy clothes',
  ], '/workspace/shopping', 'screen', 'Everything you could buy, and who has it in stock.'),

  // --- People --------------------------------------------------------------
  a('people', 'The People You Know', [
    'my friends', 'my family', 'who do i know', 'call somebody', 'ring my mum', 'my relationships',
    'ask somebody out', 'text somebody',
  ], '/workspace/relationships', 'screen', 'Everyone in your life, and what you could do about them.'),

  // --- The picture ---------------------------------------------------------
  a('shoot', 'Shoot Something', [
    'shoot', 'shoot a day', 'film something', 'make a film', 'plan a shoot', 'shoot day',
  ], '/workspace/film', 'screen', 'Planning a day, the kit for it, and shooting it.'),
  a('kit', 'The Kit', [
    'hire a camera', 'rent a camera', 'get a lens', 'kit', 'camera', 'lighting', 'rental house',
  ], '/workspace/film', 'screen', 'Hiring what a day needs, and what you own already.'),

  // --- Going out -----------------------------------------------------------
  a('cinema', 'Go To The Cinema', [
    'cinema', 'go to the cinema', 'see a film', 'watch a film', 'movies', 'go to the movies',
  ], '/workspace/goingout', 'screen', 'What is on, where, and a seat at it.'),
  a('going_out', 'What Is On', [
    'what is on', 'whats on', 'go out tonight', 'a concert', 'a match', 'a gig', 'an exhibition',
    'the theater', 'fashion week',
  ], '/workspace/goingout', 'screen', 'Everything on in town, and getting into it.'),

  // --- Travel --------------------------------------------------------------
  a('travel', 'Go Somewhere Else', [
    'travel', 'fly somewhere', 'book a flight', 'go abroad', 'take a trip', 'go on holiday',
    'book a hotel', 'go to another city',
  ], '/workspace/travel', 'screen', 'Trips, flights and somewhere to stay.'),

  // --- The papers and the health -------------------------------------------
  a('doctor', 'See A Doctor', [
    'doctor', 'see a doctor', 'book an appointment', 'im not well', 'gp', 'physician',
  ], '/workspace/health', 'screen', 'Providers where you are, and an appointment with one.'),
  a('papers', 'The Papers', [
    'passport', 'apply for a passport', 'renew my passport', 'my documents', 'my papers',
  ], '/workspace/travel', 'screen', 'A passport, a license, and what each is worth waiting for.'),

  // --- The house -----------------------------------------------------------
  a('house', 'The House', [
    'my house', 'buy a house', 'move', 'rent somewhere', 'furnish', 'my home', 'property',
  ], '/workspace/property', 'screen', 'Buying, renting, building and furnishing.'),
  a('repair', 'Get It Repaired', [
    'repair', 'fix it', 'get it fixed', 'the washing machine is broken', 'something is broken',
  ], '/workspace/property', 'screen', 'What is broken in the house, and what fixing it costs.'),

  // --- Vehicles ------------------------------------------------------------
  a('vehicles', 'The Cars', [
    'my car', 'buy a car', 'sell my car', 'service the car', 'drive', 'a motorbike', 'a boat',
  ], '/workspace/vehicles', 'screen', 'Buying, owning, servicing and selling.'),

  // --- Yourself ------------------------------------------------------------
  a('character', 'Look At Yourself', [
    'me', 'my stats', 'my skills', 'my attributes', 'how am i doing', 'who am i', 'my life',
  ], '/workspace/character', 'screen', 'Attributes, skills, standing, and the years so far.'),
  a('history', 'What Has Happened', [
    'history', 'what has happened', 'my past', 'the timeline', 'memories',
  ], '/workspace/history', 'screen', 'Everything that has happened, in order.'),
  a('calendar', 'The Calendar', [
    'calendar', 'what is coming up', 'my schedule', 'what am i doing tomorrow', 'diary',
  ], '/workspace/calendar', 'screen', 'Every commitment you have, and what collides.'),
  a('phone', 'The Phone', [
    'my phone', 'youtube', 'instagram', 'tiktok', 'post something', 'scroll',
  ], '/workspace/phone', 'screen', 'The handset, and the apps on it.'),
];

export const ASKABLE_BY_ID: Readonly<Record<string, Askable>> = Object.fromEntries(
  PHRASEBOOK.map((one) => [one.id, one]),
);

export const ASK_NOTE =
  'Type what you want in your own words. SLATE works out which of the things it actually does you '
  + 'meant, asks when it cannot tell, and does it. It will not pretend to have done something it '
  + 'cannot: where the answer is no, the answer says what would make it yes.';

export const ASK_LIMITS_NOTE =
  'This is a matcher over the things the game really does, not a model and not a parser. It knows '
  + 'the phrasings on this list and nothing else, so an unusual way of putting it comes back as not '
  + 'understood rather than as a guess.';
