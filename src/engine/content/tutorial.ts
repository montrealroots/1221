/**
 * SLATE — what the game has to teach, and when it is worth saying.
 *
 * This game has thirty-two commands a player can issue, six drill-down screens
 * and two companies, and until now it explained none of it. Every figure on every
 * screen has a sentence under it saying what it means, which is the right instinct
 * and is not the same thing: a player who does not know that a season's schedule
 * is decided at the greenlight and paid for afterwards will read a very clear
 * explanation of a number they had no reason to look at.
 *
 * ## What a lesson is, and the two rules it obeys
 *
 * A lesson is one thing the player can now do, said once, at the first moment
 * doing it is possible. Not a tour and not a modal at the front door. The two
 * rules follow from that:
 *
 * **A lesson has a condition, and the condition is read off the real world.** It
 * says "you have a company and no registration" rather than "step four". So the
 * order is whatever order the player plays in, a player who already knows the game
 * never sees a lesson about something they did before it came up, and nothing here
 * can be reached by a player who could not act on it. A tutorial that fires on a
 * step counter is a tutorial that tells you to do something the world will refuse.
 *
 * **Every lesson names the command or screen it teaches.** Which makes the
 * coverage question mechanical: `tests/tutorial.test.ts` walks the engine's own
 * command registry and fails when a command nothing teaches is added. That is the
 * only way a tutorial stays finished — otherwise the thirty-third command ships
 * with nothing explaining it and nobody notices for a year.
 *
 * And the rule underneath both, which is THE ONE RULE applied to prose: a lesson
 * whose condition can never be true is decoration. `tools/tutorial.mjs` plays
 * careers and reports which lessons never fired, the way `tools/dials.mjs` reports
 * numbers that never moved.
 *
 * ## What is deliberately not here
 *
 * No forced ordering, no blocking, no "click here" highlight, and nothing that
 * pauses the clock. A player can dismiss the lot at any point and the game does
 * not change. Teaching that stops the game to teach is a different game, and the
 * measurement that says so is in `docs/DEPTH.md`: every system here rides a tick
 * that already exists rather than getting a clock of its own.
 */


/** Where a lesson belongs, which is how the screen groups them. */
export type Strand =
  | 'first-week'
  | 'the-work'
  | 'the-body'
  | 'the-money'
  | 'the-company'
  | 'the-pictures'
  | 'the-lot'
  | 'the-estate'
  | 'the-year';

export interface Lesson {
  /** Stable id. Saved, so renaming one costs a migration. */
  id: string;
  /** The strand it belongs to, for grouping on the screen. */
  strand: Strand;
  /** A title in the house's title case. */
  title: string;
  /**
   * What it teaches, in the player's own terms.
   *
   * Two or three sentences. It says what the thing is, what it costs and what it
   * decides — in that order, because a player who knows what something costs
   * before they know what it decides has been given a price and no reason.
   */
  body: string;
  /**
   * The commands this lesson explains, by their registered kind.
   *
   * The link that makes coverage checkable. A lesson about a screen rather than an
   * action teaches no command and says so with an empty list, and the coverage
   * test counts commands rather than lessons.
   */
  teaches: readonly string[];
  /** The drill-down or workspace this lesson is about, where there is one. */
  screen?: string;
  /**
   * Lessons that have to have been seen first.
   *
   * Not an ordering of the game — an ordering of the *sentences*. "Renew the cover
   * or the doors shut" is not worth saying to somebody who has not been told what
   * cover is, and the world can perfectly well present both conditions in the same
   * week.
   */
  after?: readonly string[];
  /**
   * How loudly it arrives, on the same scale as every other notification.
   *
   * Held below the things that are actually happening on purpose. A lesson is never
   * more important than a part going without you.
   */
  importance: number;
}

/**
 * The few things a condition is allowed to ask about.
 *
 * Deliberately narrow. A condition that could reach the whole simulation would
 * grow into a second rules engine beside the real one, and the first time the two
 * disagreed the tutorial would start telling players to do things the world
 * refuses. So the world code fills this in once a week and the conditions read
 * nothing else.
 */
export interface LessonWorld {
  /** Weeks since the save opened. */
  week: number;
  /** Whether a company exists at all. */
  hasCompany: boolean;
  /** Registrations that are live right now. */
  registrations: number;
  /** Material the company holds, optioned or owned. */
  holdings: number;
  /** Posts with somebody in them. */
  filledPosts: number;
  /** Projects by where they have got to. */
  projects: { developing: number; greenlit: number; shooting: number; finished: number; delivered: number };
  /** Parts on the player's own projects with nobody cast. */
  openParts: number;
  /** Auditions the player could still answer. */
  openAuditions: number;
  /** Parts the player has been cast in. */
  partsWon: number;
  /** Sound stages on the lot, and how many are booked this week. */
  stages: { built: number; booked: number };
  /** Whether the estate's house needs work. */
  houseNeedsWork: boolean;
  /** How tired the player is, 0-100, where higher is worse. */
  tiredness: number;
  /** Whether a card is carrying a balance. */
  owesOnACard: boolean;
  /** Whether there is more than one account to move money between. */
  accounts: number;
  /** Whether anything is waiting on the player in the decision center. */
  decisionsOpen: number;
  /** Whether a term is inside its warning window. */
  termRunningOut: boolean;
  /** Whether a finished picture has never been sold. */
  unsoldFinished: number;
  /** Whether the sugar group has paid a dividend yet. */
  dividendPaid: boolean;
}

/**
 * Every lesson, in the order they were written rather than the order they fire.
 *
 * The order here decides nothing: `after` says what must come first and the world
 * decides the rest. They are grouped by strand so that a person editing them reads
 * one subject at a time.
 */
export const LESSONS: readonly Lesson[] = [
  // -------------------------------------------------------------------------
  // The first week
  // -------------------------------------------------------------------------
  {
    id: 'clock',
    strand: 'first-week',
    title: 'The Clock Is Yours',
    body: 'Time only moves when you let it. The controls at the top run the world at one '
      + 'minute to the minute, or faster when you’re waiting something out, and stop it dead. '
      + 'No part of this game runs on a timer. When the world stops for something, it is '
      + 'because something is waiting on you.',
    teaches: ['world.set_preferences'],
    screen: 'shell',
    importance: 30,
  },
  {
    id: 'sleep',
    strand: 'first-week',
    title: 'Sleeping Is A Decision',
    body: 'You book the hours and the world gives back what a body that age actually banks '
      + 'from them. Short nights build a debt that comes out of everything else, and the night '
      + 'that used to fix everything stops fixing everything as you get older. It’s the one '
      + 'thing you can do every single day that changes every other number.',
    teaches: ['life.sleep'],
    screen: 'wellbeing',
    importance: 35,
  },
  {
    id: 'notices',
    strand: 'first-week',
    title: 'Everything Reaches You Here',
    body: 'Parts you were asked about, terms running out, a picture past its date, the year’s '
      + 'judgement. Everything in this game happens somewhere you can see it, and nothing '
      + 'important arrives only as a number on a screen you’d have to already know to open.',
    teaches: ['world.mark_read', 'world.dismiss_decision'],
    screen: 'attention',
    importance: 25,
  },
  {
    id: 'decisions',
    strand: 'first-week',
    title: 'Some Things Stop The Clock',
    body: 'A decision waiting on you holds the world until you answer it, because it’s the '
      + 'kind of thing nobody sleeps through. Answer it or put it off — putting it '
      + 'off is a real answer here and it has real consequences. That’s why it’s offered.',
    teaches: ['world.take_decision_action'],
    screen: 'attention',
    after: ['notices'],
    importance: 45,
  },

  // -------------------------------------------------------------------------
  // The work
  // -------------------------------------------------------------------------
  {
    id: 'auditions',
    strand: 'the-work',
    title: 'An Office Has Asked For You',
    body: 'An office wants to see you for a part. You can send a tape or go into the room, and '
      + 'the difference matters: a tape gets an answer, a room gets a note about what they '
      + 'actually wanted. There’s a last day to be seen by, and being asked and not answering '
      + 'is the one thing an office remembers about a performer it has never met.',
    teaches: ['life.go_up'],
    screen: 'auditions',
    importance: 60,
  },
  {
    id: 'the-note',
    strand: 'the-work',
    title: 'The Note Is The Whole Game',
    body: 'A room tells you what it was looking for, and how far you take that note decides '
      + 'what you send next time. Take it a touch, take it seriously, or take it all the way — '
      + 'the far end of that is a different performance and not always a better one. What a room '
      + 'wants is a real thing you can learn, and the same holder keeps wanting it.',
    teaches: ['life.take_note'],
    screen: 'auditions',
    after: ['auditions'],
    importance: 50,
  },
  {
    id: 'clashes',
    strand: 'the-work',
    title: 'Work You Take Costs You Work You Can’t',
    body: 'A part you’re cast in owns its shooting dates, and anything that wants the same '
      + 'weeks is refused. That refusal isn’t a bug and it isn’t bad luck — it’s the price '
      + 'of the job you already said yes to, and it’s the main thing that shapes a career.',
    teaches: [],
    screen: 'plans',
    after: ['auditions'],
    importance: 40,
  },

  // -------------------------------------------------------------------------
  // The body
  // -------------------------------------------------------------------------
  {
    id: 'training',
    strand: 'the-body',
    title: 'Two Hours A Week',
    body: 'Training takes the hours out of your week instead of adding them to it, and it '
      + 'can’t beat what a body that age can be brought to. Age lowers the ceiling; nothing '
      + 'raises it. What training does is keep you at yours, and once you’re too spent to '
      + 'train, it refuses. That’s how a career quietly stops.',
    teaches: ['life.train'],
    screen: 'wellbeing',
    after: ['sleep'],
    importance: 35,
  },
  {
    id: 'tired',
    strand: 'the-body',
    title: 'You Are Running Down',
    body: 'Eight dials roll up into how ready you are, and readiness is read in the room. This '
      + 'isn’t a health bar you top up before a fight. It’s the accumulated state of a person '
      + 'who has been working, and the only ways back are sleeping properly, eating, and keeping '
      + 'the roof over your head in repair.',
    teaches: [],
    screen: 'wellbeing',
    after: ['sleep'],
    importance: 55,
  },

  // -------------------------------------------------------------------------
  // The money
  // -------------------------------------------------------------------------
  {
    id: 'ledger',
    strand: 'the-money',
    title: 'Every Balance Has A Reason',
    body: 'No number here is a number anyone typed. Every balance is the sum of what was '
      + 'posted to it, and you can follow any figure back to the payment that made it. When '
      + 'money moves, both sides of it are written down.',
    teaches: [],
    screen: 'money',
    importance: 30,
  },
  {
    id: 'accounts',
    strand: 'the-money',
    title: 'Money That Moves And Money That Sits',
    body: 'A current account pays nothing because it’s for money that’s moving. Money left '
      + 'on deposit earns, and a card left carrying a balance costs far more than the deposit '
      + 'earns — so the decision is which pocket things sit in. You can move money between your '
      + 'own accounts whenever you like.',
    teaches: ['life.transfer'],
    screen: 'money',
    after: ['ledger'],
    importance: 40,
  },
  {
    id: 'card',
    strand: 'the-money',
    title: 'The Card Is Charging You',
    body: 'A balance carried on a card is charged interest every month, and the minimum payment '
      + 'goes out whether you think about it or not. The minimum is designed to keep the balance '
      + 'alive, not to clear it. Clearing it’s the highest return available to you anywhere in '
      + 'this game.',
    teaches: [],
    screen: 'money',
    after: ['accounts'],
    importance: 60,
  },
  {
    id: 'tax',
    strand: 'the-money',
    title: 'The Year Is Settled In June',
    body: 'Income tax is worked out once a year on everything you earned, through the real bands '
      + 'for wherever you are, and it comes out of whichever account can stand it. If nothing '
      + 'can cover it the balance goes under. That’s exactly what a tax bill does.',
    teaches: [],
    screen: 'money',
    after: ['ledger'],
    importance: 55,
  },
  {
    id: 'upkeep',
    strand: 'the-estate',
    title: 'The Roof Will Not Keep Itself Up',
    body: 'A house left alone gets worse, and everything downstream of a night’s sleep goes '
      + 'with it — condition, energy, stress, and eventually your ability to train at all. '
      + 'Keeping it up costs money on a schedule. Not keeping it up isn’t a saving, it’s a '
      + 'different career.',
    teaches: ['life.upkeep'],
    screen: 'estate',
    importance: 65,
  },

  // -------------------------------------------------------------------------
  // The company
  // -------------------------------------------------------------------------
  {
    id: 'company',
    strand: 'the-company',
    title: 'The Family Business',
    body: 'You’re not only a performer here. There’s a company, and what it can legally do is '
      + 'decided by what it has: a registration to trade, guild signatures to employ people, '
      + 'cover over a shoot, material to make something of, and a person in the chair. Every one '
      + 'of those is a door, and every door is shut until the thing behind it exists.',
    teaches: [],
    screen: 'business',
    importance: 45,
  },
  {
    id: 'register',
    strand: 'the-company',
    title: 'Registering To Trade',
    body: 'A registration is what lets the company do business in a place, it costs a filing fee, '
      + 'and it runs out. An American arm is its own registration in its own state, and it’s the '
      + 'only thing that can sign with an American guild. Let a registration lapse and everything '
      + 'it was holding open shuts.',
    teaches: ['company.register', 'company.form_arm'],
    screen: 'business',
    after: ['company'],
    importance: 50,
  },
  {
    id: 'sign',
    strand: 'the-company',
    title: 'Signing With A Guild',
    body: 'You can’t employ people under an agreement you haven’t signed. A signature is what '
      + 'makes a crew hireable and a cast castable, and a signature dies with the registration '
      + 'underneath it — strike the company off and the guilds go with it.',
    teaches: ['company.sign'],
    screen: 'business',
    after: ['register'],
    importance: 50,
  },
  {
    id: 'insure',
    strand: 'the-company',
    title: 'Nobody Shoots Without Cover',
    body: 'Cover is bound once, charged once, and runs for twelve months — and the day it runs '
      + 'to is a real day. The premium is charged again when it comes round; if the company '
      + 'can’t find it, the cover goes into a month of grace and then lapses, and the doors it '
      + 'was holding open shut behind it.',
    teaches: ['company.insure'],
    screen: 'business',
    after: ['register'],
    importance: 55,
  },
  {
    id: 'posts',
    strand: 'the-company',
    title: 'An Empty Chair Runs Nothing',
    body: 'A company needs a person in the post, not a post. Until a head of production is in '
      + 'the chair, nothing gets developed, and the same is true of every other post the '
      + 'business declares. Filling one costs a salary from the week it starts.',
    teaches: ['company.fill_post'],
    screen: 'business',
    after: ['company'],
    importance: 45,
  },
  {
    id: 'option',
    strand: 'the-company',
    title: 'Material, Optioned Or Owned',
    body: 'A picture has to be *of* something. An option is eighteen months of the right to '
      + 'make it and then the rights go back — unless you greenlight, which exercises the option '
      + 'and turns it into ownership. Sitting on an option without saying yes is how you lose '
      + 'material you paid for.',
    teaches: ['company.option'],
    screen: 'business',
    after: ['company'],
    importance: 50,
  },

  // -------------------------------------------------------------------------
  // The pictures
  // -------------------------------------------------------------------------
  {
    id: 'develop',
    strand: 'the-pictures',
    title: 'Putting A Picture Into Development',
    body: 'Development is where a picture gets a plan, a budget and a shape. It’s cheap and it '
      + 'commits you to nothing, and it’s the only place the decisions that decide everything '
      + 'later are still cheap to change.',
    teaches: ['company.develop', 'company.breakdown'],
    screen: 'business',
    after: ['posts', 'option'],
    importance: 50,
  },
  {
    id: 'greenlight',
    strand: 'the-pictures',
    title: 'The Greenlight Decides The Overrun',
    body: 'Saying yes sets the schedule, and the schedule is where an overrun comes from. Give '
      + 'a picture four weeks to shoot what the money says takes six and it will run over; the '
      + 'draw only decides how badly. This is the single most consequential number you will '
      + 'ever set, and you set it months before anybody feels it.',
    teaches: ['company.greenlight'],
    screen: 'business',
    after: ['develop'],
    importance: 70,
  },
  {
    id: 'casting',
    strand: 'the-pictures',
    title: 'Casting Is Bought Months Earlier',
    body: 'What a part costs decides who comes in for it, so greenlighting cheap is a casting '
      + 'decision long before anybody thinks of it as one. You hold sessions, read people, and '
      + 'make offers — and a performer in demand turns down a small part that another would '
      + 'take as a break.',
    teaches: ['company.session', 'company.cast'],
    screen: 'business',
    after: ['greenlight'],
    importance: 55,
  },
  {
    id: 'board',
    strand: 'the-pictures',
    title: 'A Format Season Has A Cast Board',
    body: 'An unscripted season isn’t cast like a picture. Twelve civilians are around on a '
      + 'stipend, and what varies isn’t how good they’re at anything — it’s whether an '
      + 'audience would watch them, and whether any of them is already trouble. You pick who '
      + 'goes on the board.',
    teaches: ['company.board'],
    screen: 'business',
    after: ['greenlight'],
    importance: 45,
  },
  {
    id: 'crew',
    strand: 'the-pictures',
    title: 'The People Who Actually Make It',
    body: 'A crew that has worked for you before gets rehired, and that matters more than '
      + 'anything else about the decision. Money reaches further — a quarter of a million euro '
      + 'gets who is available and forty million gets who is wanted — and a head of department '
      + 'is drawn from a shallower, better pool than anybody under them.',
    teaches: [],
    screen: 'business',
    after: ['greenlight'],
    importance: 45,
  },
  {
    id: 'restaff',
    strand: 'the-pictures',
    title: 'Replacing A Person Mid-Flight',
    body: 'You can replace a person once the work is running, and it’s paid for out of what is '
      + 'left on the screen, not out of thin air. If the budget is spent, the answer is '
      + 'no, and that constraint is the whole reason the option exists at all.',
    teaches: ['company.restaff'],
    screen: 'business',
    after: ['greenlight'],
    importance: 40,
  },
  {
    id: 'deliver',
    strand: 'the-pictures',
    title: 'Delivery Is A Date And A List',
    body: 'A finished picture isn’t a delivered one. There’s a contractual date and a list of '
      + 'elements that have to be filed, and being past the date notifies you twice — once for '
      + 'the work that isn’t done and once for the elements that aren’t. A picture can only be sold '
      + 'before it is delivered.',
    teaches: ['company.deliver', 'company.claim_rebate'],
    screen: 'business',
    after: ['greenlight'],
    importance: 55,
  },
  {
    id: 'sell',
    strand: 'the-pictures',
    title: 'Selling It, And What A Buyer Is Pricing',
    body: 'A buyer prices what it cost, how it is being sold, who is in it, what the trade is '
      + 'currently writing about them, and whether the year noticed it. A streamer buyout '
      + 'reaches nobody after the check clears; a studio release reaches everybody for a decade. '
      + 'Scale buys audience, but sublinearly — a bigger picture usually earns a *smaller* '
      + 'multiple of what it cost.',
    teaches: ['company.sell', 'company.release'],
    screen: 'business',
    after: ['deliver'],
    importance: 60,
  },

  // -------------------------------------------------------------------------
  // The lot
  // -------------------------------------------------------------------------
  {
    id: 'lot',
    strand: 'the-lot',
    title: 'The Stages Pay For Themselves Or They Do Not',
    body: 'Productions enquire about the lot, and whether they book depends on whether a stage '
      + 'fits what they need and is free for the weeks they want. Building a stage is a large '
      + 'amount of money against an income you don’t control.',
    teaches: ['lot.build', 'lot.sell'],
    screen: 'estate',
    importance: 45,
  },
  {
    id: 'own-stage',
    strand: 'the-lot',
    title: 'Using Your Own Stage Costs You',
    body: 'When the family greenlights its own picture it books a stage the same way a paying '
      + 'tenant does, into the same table, against the same clashes — and pays nothing, because '
      + 'a company can’t rent from itself. Which is exactly what makes it expensive: every week '
      + 'your picture is on a stage is a week nobody else is paying for it. Owning the stages is '
      + 'the advantage. Using them is the price.',
    teaches: [],
    screen: 'estate',
    after: ['lot', 'greenlight'],
    importance: 50,
  },
  {
    id: 'rebate',
    strand: 'the-lot',
    title: 'Why Anybody Shoots In Iceland',
    body: 'A production that spends its money here gets a share of it back, and there’s a '
      + 'higher tier for one that spends more, works longer, shoots longer and puts fifty people '
      + 'on an Icelandic payroll for fifty days. That last one is the limb the country can fail: '
      + 'there are only so many crew in Iceland, and two large productions at once want a '
      + 'hundred of them.',
    teaches: [],
    screen: 'place',
    after: ['lot'],
    importance: 45,
  },
  {
    id: 'overhead',
    strand: 'the-lot',
    title: 'The Lot Costs Money Standing Still',
    body: 'Rates, power, the gate, the people who keep it running: a lot with nothing on it is '
      + 'still spending. Occupancy is the whole business, and an empty stage is the most '
      + 'expensive thing on the estate.',
    teaches: [],
    screen: 'estate',
    after: ['lot'],
    importance: 40,
  },

  // -------------------------------------------------------------------------
  // The year
  // -------------------------------------------------------------------------
  {
    id: 'calendar',
    strand: 'first-week',
    title: 'Putting Things On Your Own Calendar',
    body: 'Most of what is on your calendar was put there by other people. You can add your own, '
      + 'cancel it, or skip it when it comes round — and two things at the same time are allowed, '
      + 'because that’s a real situation, and the calendar flags it instead of refusing.',
    teaches: ['calendar.schedule', 'calendar.cancel', 'calendar.skip'],
    screen: 'plans',
    after: ['clock'],
    importance: 35,
  },
  {
    id: 'awards',
    strand: 'the-year',
    title: 'The Year Notices Things',
    body: 'Every February the year names five pictures and gives one of them the award. There '
      + 'are no academies and no categories here — it’s what was on the screen, which form it '
      + 'was, and a quarter of it is simply the people voting. Being named is the part that '
      + 'reaches an office that has never met you, and it’s worth something at a sale for as '
      + 'long as it is remembered.',
    teaches: [],
    screen: 'standing',
    after: ['deliver'],
    importance: 50,
  },
  {
    id: 'standing',
    strand: 'the-year',
    title: 'What The Industry Thinks Of You',
    body: 'Seven separate things, on four different clocks: how many people know your name, '
      + 'whether they rate the work, whether you’re easy to work with, what the trade is '
      + 'writing, and what the year noticed. They aren’t one number and they don’t move '
      + 'together — being difficult costs you work early and reputation is slower to build than '
      + 'to lose.',
    teaches: [],
    screen: 'standing',
    after: ['auditions'],
    importance: 45,
  },
  {
    id: 'teaching',
    strand: 'first-week',
    title: 'You Can Turn This Off',
    body: 'These notes arrive one a week, when something you can now do has become '
      + 'possible, and they never stop the clock or hold anything up. Switch them off whenever '
      + 'you like and nothing else about the game changes — and if you come back to it later '
      + 'and want them again, you can ask for the lot from the beginning.',
    teaches: ['learning.set', 'learning.again'],
    screen: 'shell',
    after: ['clock'],
    importance: 28,
  },
  {
    id: 'renewals',
    strand: 'the-company',
    title: 'Something Is About To Run Out',
    body: 'A registration, a policy or an option is inside two months of its date. Every one of '
      + 'those is holding a door open, and when the date passes the door shuts — a lapsed '
      + 'registration takes the guild signatures with it, lapsed cover stops anybody shooting, '
      + 'and an expired option sends the rights back. None of it is dramatic when it happens. It '
      + 'is just a thing you can no longer do.',
    teaches: [],
    screen: 'business',
    after: ['company'],
    importance: 68,
  },
  {
    id: 'dividend',
    strand: 'the-year',
    title: 'The Sugar Paid Out',
    body: 'The group kept a year of wages back and distributed the rest to the people who own '
      + 'it, and your share has landed in your account. This is the one income in the game that '
      + 'arrives whether or not you did anything, and it’s also the one you can’t increase.',
    teaches: [],
    screen: 'money',
    after: ['sugar'],
    importance: 52,
  },
  {
    id: 'sugar',
    strand: 'the-year',
    title: 'The Other Family Business',
    body: 'A sugar group that has been trading since 1946, and it has nothing to do with '
      + 'pictures. It sells a quota, pays a payroll, pays its corporation tax, keeps a year of '
      + 'wages back and distributes the rest to the people who own it, and you’re one of them. '
      + 'America deciding how much sugar to let in at the low duty is the largest thing in this '
      + 'game you have no influence over whatsoever.',
    teaches: [],
    screen: 'business',
    importance: 40,
  },
];

/** The lesson ids, for anything that needs to check one exists. */
export const LESSON_IDS: readonly string[] = LESSONS.map((one) => one.id);

export const LESSON_BY_ID: Readonly<Record<string, Lesson>> = Object.fromEntries(
  LESSONS.map((one) => [one.id, one]),
);

/** What the strands are called on the screen, in the order they are shown. */
export const STRANDS: readonly { id: Strand; name: string; about: string }[] = [
  { id: 'first-week', name: 'Your First Week', about: 'The clock, what reaches you, and your own calendar.' },
  { id: 'the-work', name: 'Getting Work', about: 'Being asked, being seen, and what a room actually wanted.' },
  { id: 'the-body', name: 'Keeping Going', about: 'What a body does over twenty-five years of it.' },
  { id: 'the-money', name: 'Money', about: 'Where it sits, what it earns, what it costs and what the year takes.' },
  { id: 'the-company', name: 'The Company', about: 'Every door, and the thing behind it that has to exist first.' },
  { id: 'the-pictures', name: 'Making Pictures', about: 'Development to delivery, and the decisions that decide the rest.' },
  { id: 'the-lot', name: 'The Lot', about: 'Stages, tenants, the rebate, and what standing still costs.' },
  { id: 'the-estate', name: 'The Estate', about: 'The roof over all of it.' },
  { id: 'the-year', name: 'The Year', about: 'What gets noticed, what the industry thinks, and the sugar.' },
];

/**
 * How many lessons may arrive in one week.
 *
 * One. A player who has just built a company and greenlit a picture has satisfied
 * the conditions of half this file at once, and six notices in a week is not
 * teaching, it is a wall of text with the game behind it. So the world takes the
 * most important eligible lesson and leaves the rest for next week, which also
 * means the order they arrive in is the order of what matters.
 */
export const LESSONS_A_WEEK = 1;

/** The notification category lessons arrive under, so a player can find them. */
export const LESSON_CATEGORY = 'learning';
