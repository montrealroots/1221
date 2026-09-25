/**
 * SLATE — the guide: every part of the game, in the order a life meets it.
 *
 * A new life starts with everything shut but the guide. Each chapter says
 * what one part of the game does, and reading it opens that part: its
 * commands in the engine (`world/tutorial.ts` refuses the rest), and its
 * buttons, panels and underlined words on screen. The chapters are read in
 * order, so nothing is opened before the thing it leans on has been said.
 *
 * `opens` is the coverage matrix. Every command the engine registers, every
 * kind of look and every gated control on screen belongs to exactly one
 * chapter, and `tests/tutorial.test.ts` fails a command, look or control
 * that no chapter opens, or a chapter that opens nothing.
 *
 * The ids in `opens` are of three kinds: a command's own kind
 * (`life.sleep`), `look.<kind>` for the underlined words that open a look,
 * and `ui.<name>` for a button or panel that runs no command itself.
 */

export interface Chapter {
  id: string;
  title: string;
  /** One line: what the chapter is about. */
  lead: string;
  /** What the part of the game does, a paragraph at a time. */
  body: readonly string[];
  /** What reading it opens, said the way the screen names it. */
  names: readonly string[];
  /** The same, by id: commands, `look.*` and `ui.*`. */
  opens: readonly string[];
}

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'welcome',
    title: 'Your Life, Hour By Hour',
    lead: 'What SLATE is, and how Home is read.',
    body: [
      'SLATE is one life, lived on a real clock in a real town. Everything you see is worked out from where you are and what day it is: the local time, the season, the money, the prices and the law.',
      'Home is the day you’re standing in. The line under your name says the time, the town, its time zone, the season and the sky.',
      'An underlined word opens. Press one and what it names unfolds under it, with more to press inside: a day, a town, a country, its currency. A word opens once its chapter here has been read, and until then it’s plain text.',
      'Save & Exit is always there, top right. It writes the save and takes you back to the slots, and Continue brings you back to the same moment.',
    ],
    names: ['Where You Are', 'The day, the town, the region, the country, the currency, the season and the daylight, when you press them'],
    opens: ['ui.where', 'look.day', 'look.place', 'look.region', 'look.country', 'look.currency', 'look.season', 'look.daylight'],
  },
  {
    id: 'calendar',
    title: 'What’s Coming',
    lead: 'Commitments, and the moment one wants you.',
    body: [
      'The Calendar panel at the top of Home is what’s coming: the next thing that wants you, and the few after it.',
      'A commitment is something you’re expected at: a shift, or a plan you made. When the clock reaches one, it stops and asks.',
      'Go spends the hours it takes, and the clock goes through them. Call In Sick walks away from a shift: no pay for it, and three missed in four weeks costs the job. Skip It walks away from a plan of your own. Stand Here closes the question and leaves the clock where it is, still at the commitment.',
      'The clock hasn’t moved yet, so nothing has come due. The next chapter starts it.',
    ],
    names: ['Calendar', 'Go', 'Call In Sick and Skip It', 'The entries on it, when you press them'],
    opens: ['ui.calendar', 'ui.go', 'calendar.skip', 'look.entry'],
  },
  {
    id: 'clock',
    title: 'The Clock',
    lead: 'Time runs a minute a minute, and stops when you say.',
    body: [
      'The clock at the top runs one to one with real time: a minute here is a minute there. A new life starts with it paused, so nothing happens before you’re ready.',
      'Play starts it and Pause stops it. The world goes on around you while it runs: hours pass, you tire and get hungry, and what’s due comes due.',
      'Whatever moves the clock, it stops at anything that wants you, and waits for your answer.',
    ],
    names: ['Play and Pause'],
    opens: ['ui.play', 'world.set_preferences'],
  },
  {
    id: 'advance',
    title: 'Moving Time On',
    lead: 'Jumping ahead, and what happens on the way.',
    body: [
      'Advance moves the clock ahead on purpose, when you don’t want to wait: One Hour, This Evening at six, Tonight at ten, Tomorrow Morning at seven, the Next Event, Next Monday at nine, One Week, or Choose An Event from everything ahead.',
      'Everything on the way happens, in order. The clock stops at each commitment and asks, the way it does at any other. If a jump crosses some, it says how many first.',
      'A jump through the night is a night your character sleeps on their own, at their usual hours. Time only runs forwards.',
    ],
    names: ['Advance', 'Choose An Event'],
    opens: ['ui.advance', 'ui.skip'],
  },
  {
    id: 'needs',
    title: 'What Needs You',
    lead: 'What happened while you weren’t looking.',
    body: [
      'What Needs You is where the world tells you things: a payday, rent you couldn’t pay, a late card payment, a shift called off, a birthday. The number beside Home in the menu is how many are waiting.',
      'Mark Read clears them once you’ve seen them. Go There, where it shows, takes you to the screen for it.',
      'A question the world needs you to answer shows here too, with its answers as buttons, and Dismiss when you’d rather not.',
    ],
    names: ['What Needs You', 'Mark Read', 'A question’s answers, and Dismiss', 'A notice or a question, when you press it'],
    opens: ['ui.needs', 'world.mark_read', 'world.take_decision_action', 'world.dismiss_decision', 'look.notification', 'look.decision'],
  },
  {
    id: 'body',
    title: 'How You Are',
    lead: 'The dials a body runs on.',
    body: [
      'How You Are keeps three dials in front of you. Energy runs down every waking hour and faster on a short night. Stress climbs with work, owing money and a night on a sofa. Readiness is how well you’d do something right now, out of all the rest.',
      'Behind them, one press away, are the others: morale, condition, fitness, nourishment and hygiene, and the sleep you owe. Each says what moves it.',
      'Age sets how high condition and fitness can go. A body in its twenties barely loses a point a year; one in its seventies loses more than a point a year.',
    ],
    names: ['How You Are', 'Each dial, and readiness, when you press them'],
    opens: ['ui.how', 'look.dial', 'look.readiness'],
  },
  {
    id: 'sleep',
    title: 'Sleep',
    lead: 'The night, and what it gives back.',
    body: [
      'Sleep asks how many hours, between one and fourteen, and suggests a number from when you’re next wanted and what you owe. It says when you’d wake.',
      'A night puts energy back, less of it the more sleep you owe, and it mends condition as far as your fitness and age allow. A short night carries the debt into tomorrow.',
      'The world keeps going while you sleep. Anything on the calendar in those hours happens without you, and the dialog says what you’d sleep through. You can’t sleep on a shift.',
    ],
    names: ['Sleep'],
    opens: ['ui.sleep', 'life.sleep'],
  },
  {
    id: 'looking-after',
    title: 'Looking After Yourself',
    lead: 'Eating, washing, working out, unwinding.',
    body: [
      'Look After Yourself holds the four things besides sleep a body needs, each with how long it takes: Eat A Meal (40 minutes, paid for from your account), Shower (20 minutes), Work Out (an hour) and Unwind (an hour).',
      'Eating feeds you and lifts the mood. A shower is clean again and calmer. A workout builds fitness and eases stress, and costs energy, food and a shower. Unwinding takes the edge off stress.',
      'Something you love lifts you more: the menu says so beside it. When one can’t be done, it’s gray, with the reason.',
    ],
    names: ['Look After Yourself'],
    opens: ['ui.look-after', 'life.look_after'],
  },
  {
    id: 'plans',
    title: 'Your Own Plans',
    lead: 'Putting something of your own on the calendar.',
    body: [
      'Open Calendar is the month. Pick a day and make a plan: a name, a time, how long (five minutes to a day) and where.',
      'A plan is a commitment like a shift. The clock stops at it, and Go or Skip It is yours. Two things that want you at once are marked as a clash.',
      'Cancel takes a plan off before it comes. Plans you slept through on your own are missed, not kept.',
    ],
    names: ['Open Calendar', 'Make and cancel plans', 'Your plans and the stretches between them, when you press them'],
    opens: ['ui.open-calendar', 'calendar.schedule', 'calendar.cancel', 'look.plans', 'look.stretch'],
  },
  {
    id: 'work',
    title: 'The Day Job',
    lead: 'Shifts, pay and the rota.',
    body: [
      'Most actors keep a day job, and yours is the one your past leads to. It pays at least the legal minimum where you live, with tax taken before it reaches you, on the payday employers there use. Some work is tipped, and the tips come on top.',
      'The rota is on the calendar two weeks ahead. A shift is a commitment: the clock stops at it, and Go works it. A worked shift tires you more than the hours alone. Missed three times in four weeks, the job is gone, and finding the same work again takes about three weeks.',
      'Ask For An Extra Shift puts one more on a free day this week. Go Part-Time or Go Full-Time changes the hours from a week on. Quit ends it, and what you worked is paid on the next payday. Look For A Day Job starts the three-week search.',
      'You can only work where your citizenship lets you. Somewhere it doesn’t, there’s no day job to look for.',
    ],
    names: ['Work And Home', 'Ask For An Extra Shift', 'Go Part-Time or Full-Time', 'Quit', 'Look For A Day Job'],
    opens: ['ui.work', 'work.extra_shift', 'work.set_hours', 'work.quit', 'work.find_job'],
  },
  {
    id: 'weather',
    title: 'Weather',
    lead: 'The sky, and the one thing it decides.',
    body: [
      'The weather is the town’s own: its climate, its season and today’s luck, the same every time you look. The panel shows now and the days ahead, and each day opens hour by hour.',
      'Thunder comes about as often as it does in the real town, and in its warm season. A thunderstorm calls off outdoor work, construction and coaching, and the shift isn’t paid. It isn’t held against you.',
    ],
    names: ['Weather', 'The sky, the week, each day and each hour, when you press them'],
    opens: ['ui.weather', 'look.weather', 'look.forecastday', 'look.hours', 'look.skyhour', 'look.skyweek'],
  },
  {
    id: 'home',
    title: 'Rent And A Roof',
    lead: 'What it costs to live where you live.',
    body: [
      'Rent and bills are due at eight in the evening on the first of the month. The rent is the town’s, from published figures where there are some and estimated where there aren’t. Food is bought every day with the day’s meals.',
      'Money comes out of checking first, then savings, then the card while it has room. What none of them covers is owed to the landlord and paid off from the next money in. Owing weighs on you every day.',
      'Two months owed brings a notice to pay or quit: thirty days to get it under a month’s. Still over it then, you’re evicted. The deposit goes against what’s owed, your record takes it, and you sleep on a friend’s sofa until you can pay a deposit and a first month somewhere.',
      'Moving costs a deposit (more where your record is poor) and the rest of this month’s rent, from the bank, since a landlord doesn’t take a card. The old deposit comes back, less anything owed.',
    ],
    names: ['Move Into A Room', 'Get A Place Of Your Own'],
    opens: ['home.move'],
  },
  {
    id: 'money',
    title: 'Money And The Card',
    lead: 'The accounts, the card and your record.',
    body: [
      'Your money is kept in the currency of the country you started in. Money shows your checking, your net worth (the bank, plus any deposit a landlord holds), and anything owed.',
      'The card has a statement on the 20th and a payment due on the 15th of the next month. Autopay pays the whole statement, as much as checking holds, or only the minimum if you choose. A statement paid in full costs nothing; one that isn’t is charged the month’s interest. Paying less than the minimum is late: a fee, and a mark on your record.',
      'Your credit record rises with paying on time, and falls with a card used past a third of its limit, a late payment, rent owed or an eviction. It sets the card’s rate and limit, and the deposit a landlord asks. It shows as a number in the United States and Canada, and as a word elsewhere.',
      'Pay Card In Full pays it off now, or as much as you have.',
    ],
    names: ['Money', 'Pay Card In Full', 'Autopay', 'Your accounts, net worth and debts, when you press them'],
    opens: ['ui.money', 'finance.pay_card', 'finance.set_autopay', 'look.account', 'look.networth', 'look.debt'],
  },
  {
    id: 'life',
    title: 'A Whole Life',
    lead: 'Birthdays, age, and the end.',
    body: [
      'Your birthday comes every year, at nine in the morning where you live, and the age you turn changes what your body can reach and how much a night gives back.',
      'A life ends. Each year carries the chance a real year at your age carries where you live, from published life tables, heavier for a body worn down and lighter for one kept well. The game never says when.',
      'When it ends, the clock stops for good, and the save shows who you were, what you earned and what you left behind. It stays in its slot until you delete it.',
      'That’s every part of the game. The guide stays at the top whenever you want to read any of it again.',
    ],
    names: ['You, when you press your name'],
    opens: ['look.person'],
  },
];

export const CHAPTER_BY_ID: Readonly<Record<string, Chapter>> = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));

/** The chapter that opens a feature, by the feature's id. */
export const CHAPTER_FOR: Readonly<Record<string, Chapter>> = Object.fromEntries(
  CHAPTERS.flatMap((chapter) => chapter.opens.map((feature) => [feature, chapter] as const)),
);
