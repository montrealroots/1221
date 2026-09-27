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
      'A commitment is something you’re expected at, like a plan you made. When the clock reaches one, it stops and asks.',
      'Go spends the hours it takes, and the clock goes through them. Skip It walks away from a plan of your own. Stand Here closes the question and leaves the clock where it is, still at the commitment.',
      'The clock hasn’t moved yet, so nothing has come due. The next chapter starts it.',
    ],
    names: ['Calendar', 'Go', 'Skip It', 'The entries on it, when you press them'],
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
      'What Needs You is where the world tells you things: rent you couldn’t pay, a late card payment, a birthday. The number beside Home in the menu is how many are waiting.',
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
      'How You Are keeps three dials in front of you. Energy runs down every waking hour and faster on a short night. Stress climbs with owing money and a night on a sofa. Readiness is how well you’d do something right now, out of all the rest.',
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
      'The world keeps going while you sleep. Anything on the calendar in those hours happens without you, and the dialog says what you’d sleep through.',
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
      'A plan is a commitment. The clock stops at it, and Go or Skip It is yours. Two things that want you at once are marked as a clash.',
      'Cancel takes a plan off before it comes. Plans you slept through on your own are missed, not kept.',
    ],
    names: ['Open Calendar', 'Make and cancel plans', 'Your plans and the stretches between them, when you press them'],
    opens: ['ui.open-calendar', 'calendar.schedule', 'calendar.cancel', 'look.plans', 'look.stretch'],
  },
  {
    id: 'weather',
    title: 'Weather',
    lead: 'The sky over wherever you are.',
    body: [
      'The weather is the town’s own: its climate, its season and today’s luck, the same every time you look. The panel shows now and the days ahead, and each day opens hour by hour.',
      'Thunder comes about as often as it does in the real town, and in its warm season.',
    ],
    names: ['Weather', 'The sky, the week, each day and each hour, when you press them'],
    opens: ['ui.weather', 'look.weather', 'look.forecastday', 'look.hours', 'look.skyhour', 'look.skyweek'],
  },
  {
    id: 'school',
    title: 'Drama School',
    lead: 'Where your life as an actor begins.',
    body: [
      'You begin as a first-year in the MFA in Acting at the David Geffen School of Drama at Yale University, in New Haven: one of the sixteen actors admitted this year, and the one the faculty wanted most from the auditions. You arrive on the first day of the fall term, for registration and orientation, and classes begin a week later.',
      'Tuition is met for every student by the tuition scholarship. Yale’s aid for living costs goes by need, so the Yale Health plan, billed each term, and the cost of living come from your bank unless the school finds need.',
      'Classes run nine to three on the class days: the year’s courses, each training an area of your craft. Be there, in New Haven and awake, and your craft grows, more when you come rested. You began ahead of every classmate in every area, and they grow too. Unwell, Call In Sick excuses the day; staying away when you’re well is an absence.',
      'Every student works: six hours each Saturday of the class weeks, and elective evenings front of house at Yale Rep when you Take An Elective Shift. Hours are paid on Fridays.',
      'From the spring the chair casts you each term: in a School project, or, as the class’s best actor in good standing, understudying at Yale Rep, on call at every performance. Missed rehearsal calls take you out of the casting pool, and a missed performance is a grave breach.',
      'At the end of each term’s classes the faculty weigh your attendance and your growth against the class. Short, your standing falls a step, from concern to warning to dismissal; after six terms in standing, the MFA.',
      'The School panel on Home shows your year, standing, place in the class and what’s next, and its button, named for the school, opens it all, tab by tab.',
    ],
    names: ['School', 'Your school, from the School panel', 'Call In Sick', 'Take An Elective Shift'],
    opens: ['ui.school', 'school.call_in_sick', 'school.take_shift'],
  },
  {
    id: 'career',
    title: 'The Business',
    lead: 'Getting seen, getting sent out, and getting paid.',
    body: [
      'In your last spring the class shows scenes to agents, managers and casting directors in New York, and a week later in Los Angeles. The agencies whose bar your showing clears may offer to represent you; Sign takes one, for 10% of what you earn.',
      'From the Monday after school ends, your agency sends you out: a self-tape you make wherever you are, or an audition in the room in its city. Be awake, and be there. Miss three and they let you go. Submit Yourself sends you after the low budget films that take submissions, with or without an agency.',
      'A booking comes days after the audition and stands two days: Take It puts the days on your calendar, Pass lets it go. Every day of a job is in its city; miss one and you’re replaced.',
      'You’re paid each contract’s minimum, SAG-AFTRA’s on the Thursday after the week and Equity’s each Friday, less the agency’s commission, Equity’s working dues and tax withheld. Your first SAG-AFTRA job makes you eligible, and working under it again thirty days on means joining; your first Equity contract makes you a member.',
      'Leave The Agency is open on SAG-AFTRA’s terms. Where You Live moves you to New York, Los Angeles or back to New Haven.',
      'A management firm can offer too, beside an agency: 10% beside an agent, 15% without one, an audition a week more, and meetings that can bring an agency. Leave Your Manager is open after the first year.',
      'A shooting day runs ten to twelve hours, and the hours past the contract’s are paid as overtime. Television and film work pays residuals after it’s made: reruns, syndication, streaming years, and a film’s television money.',
    ],
    names: ['Career', 'Sign', 'Submit Yourself', 'Take It', 'Pass', 'Leave The Agency', 'Leave Your Manager', 'A Room', 'Your Own'],
    opens: ['ui.career', 'career.sign', 'career.self_submit', 'career.accept', 'career.pass', 'career.leave', 'career.sign_manager', 'career.leave_manager', 'career.relocate'],
  },
  {
    id: 'papers',
    title: 'Between Jobs',
    lead: 'Cover, benefits and the return.',
    body: [
      'Yale’s health plan covers you to the end of July after school. After it, SAG-AFTRA’s plan covers a year when a year’s earnings under it reach its threshold, and Equity-League’s six months after ten weeks of Equity work. Without either, Enroll buys the marketplace’s plan in New York or California, in open enrollment or within 60 days of losing cover; Drop The Plan ends it.',
      'Between jobs, File A Claim opens unemployment insurance where you live, if your base period’s wages qualify. The first week that would pay is unpaid, and a week with work pays less, or nothing.',
      'A union plan that ends can be kept by COBRA: Elect COBRA within 60 days and it covers you from the day it ended, at its full cost. Illness comes as it does to anyone your age, and each piece of care brings a bill for what your plan leaves you; unpaid, it’s a medical debt, and Pay It Off settles it. A condition you carry costs its care each month: Let It Go stops it, Keep It Up starts it again.',
      'Each February a year’s return is ready: File It by mid-April. A balance comes from your bank, a refund comes 21 days on, and filing late with a balance costs penalties. Pay What’s Owed settles what the bank couldn’t.',
    ],
    names: ['Taxes And Cover', 'Enroll', 'Drop The Plan', 'Elect COBRA', 'Pay It Off', 'Keep It Up', 'Let It Go', 'File A Claim', 'File It', 'Pay What’s Owed'],
    opens: ['ui.papers', 'health.enroll', 'health.drop', 'health.elect_cobra', 'health.pay_bill', 'health.treat', 'benefits.claim', 'tax.file', 'tax.pay'],
  },
  {
    id: 'home',
    title: 'Rent And A Roof',
    lead: 'What it costs to live where you live.',
    body: [
      'Rent and bills are due at eight in the evening on the first of the month. The rent is the town’s, from published figures where there are some and estimated where there aren’t. Food is bought every day with the day’s meals.',
      'Money comes out of checking first, then savings if you’ve linked it to checking, then the card while it has room. What none of them covers is owed to the landlord and paid off from the next money in. Owing weighs on you every day.',
      'Two months owed brings a notice to pay or quit: thirty days to get it under a month’s. Still over it then, you’re evicted. The deposit goes against what’s owed, your record takes it, and you sleep on a friend’s sofa until you can pay a deposit and a first month somewhere.',
      'Pay The Landlord pays what you owe, and anything over it goes against the next month’s rent.',
      'Moving costs a deposit (more where your record is poor) and the rest of this month’s rent, from the bank, since a landlord doesn’t take a card. The old deposit comes back, less anything owed.',
    ],
    names: ['Home', 'Pay The Landlord', 'Move Into A Room', 'Get A Place Of Your Own'],
    opens: ['ui.home', 'home.pay_landlord', 'home.move'],
  },
  {
    id: 'money',
    title: 'Money',
    lead: 'Everything you have and owe, at a glance.',
    body: [
      'Your money is kept in the currency of the country you started in. Money shows your current account, your net worth (the bank, plus any deposit a landlord holds), anything owed, your card, and your credit record.',
      'Your credit record rises with paying on time, and falls with a card used past a third of its limit, a late payment, rent owed or an eviction. It sets the card’s rate where the bank prices by it, the card’s limit, and the deposit a landlord asks. It shows as a number in the United States and Canada, and as a word elsewhere.',
      'The accounts and the card are your bank’s, and the next chapter opens them.',
    ],
    names: ['Money', 'Your accounts, net worth and debts, when you press them'],
    opens: ['ui.money', 'look.account', 'look.networth', 'look.debt'],
  },
  {
    id: 'bank',
    title: 'Your Bank',
    lead: 'A real bank where you live, and what it does with your money.',
    body: [
      'Your money is kept at a real bank in the country you live in, under the names that bank gives its accounts, and each account has a number written the way the country writes one. The button on the Money panel, named for your bank, opens it.',
      'A savings account pays the bank’s rate, built up each day on what it holds and paid on the last day of the month. Where the country has the bank take tax off interest first, it does. Where a bank publishes no rate, the one shown is SLATE’s estimate and says so.',
      'A current account that charges a monthly fee takes it on the last day of the month, unless the month met the bank’s own waiver: enough of your wages paid in, or enough kept in it all month. The bank screen says how this month stands.',
      'Your credit card is the bank’s own, under its own name and terms: the rate, or the range it prices a record within; any yearly fee; the minimum; the late fee; and the days to the due date, held to the law’s caps. A statement comes on the 20th. Autopay pays the whole statement from your account, or only the minimum if you choose; a statement paid in full costs nothing, and one that isn’t is charged the month’s interest. Paying less than the minimum is late: a fee, a mark on your record, and a lower limit. Some banks, much of Europe’s among them, issue a card that takes the whole statement every month and can’t carry a balance. Pay Card In Full pays it off now, or as much as you have. Where the bank’s card wasn’t found, its terms are SLATE’s estimate, and the screen says so.',
      'With no card, apply for the bank’s: it reads your record and what you have to repay from, and a card comes in about a week. Move the statement day and the due date moves with it. Ask for a higher limit or a lower one, and say whether the bank may raise it unasked. In the US, opt in to going over the limit or not. Close the card and it takes nothing new while what’s owed is paid down. Miss two payments in a row and the card is suspended; six, and it’s charged off to collections. Ask for help with payments and the bank freezes the interest and sets a payment that clears it in four years.',
      'Interest builds each day on what the card owes, once a statement isn’t paid in full, and a statement paid in full keeps new spending interest-free. The rate is set by your record when the card opens and held there; in the US a payment sixty days late brings the card’s penalty rate after 45 days’ notice, until six are paid on time. Pay more than you owe and the card holds your credit; Send The Credit To My Account moves it back.',
      'Statements, under the accounts, show every entry on each account you’ve held, month by month (quarter by quarter in Germany, whose banks close an account each quarter), with the balance after each, and for the card what the statement asked and what paying only the minimum would take. The Year adds up the interest, the tax taken off it and every fee. Alerts tell you when the current account ends a day under a line you set, when a payment goes over one, and when a statement is ready.',
      'How You Pay sets how each thing is paid: rent from the bank on the 1st by the country’s usual way (a standing order, a direct debit, an online payment), by check where rent goes by check, or by hand; bills the same, or on the credit card; and the day’s spending on the debit card or the credit card. A payment the current account can’t make comes back unpaid, the bank charges for that, and it’s owed. Savings covers the current account only if you link it. Standing orders move money into savings on a day each month, a payment can be set for a date, a check can be stopped before it’s cashed, and in the euro area a direct debit can be taken back within eight weeks.',
      'Cash takes money out at your bank’s ATM, another bank’s, the counter, or in Britain the Post Office where your bank allows it, each for the bank’s own fee, and the machines no more in a day than it lets out; another machine’s owner may add a fee of its own. A cash advance on the card costs its fee and draws its rate from the day it’s taken, with no grace period, and a payment to the card goes to the dearer balance first. Cash can be paid back in, and the day’s groceries paid in cash. In Germany a savings account lets out €2,000 a month without notice.',
      'A card can be locked and unlocked; the bills already on it still go through. Reported lost, stolen or damaged, it stops at once and a new one with a new number follows in the bank’s days, for its fee, and a card nears its expiry with a new one sent ahead. Somebody else may use a card, as often as the country’s official figures say it happens: the bank stops some of it and asks, and the rest shows up in an alert or on the statement. Report it as not yours in time and the law decides what you carry and how fast the rest comes back.',
      'Some cards open at an introductory rate for months, pay rewards on what goes on them, lend into your account for a money transfer, or pay a purchase off in equal months for a fee in place of interest. After switching banks, the new bank’s card can take the old card’s balance, for its fee and at its transfer rate.',
      'A term deposit ends as its bank ends it unless you choose another way the bank allows, in time for any notice it needs: renewed for the same term, with any days’ grace to take it whole; moved into easy-access savings; or paid out. The bank writes before the end. Break It Early costs the bank’s penalty, shown before you do. Some banks let the interest be taken during the term, round purchases up into savings, or charge for savings withdrawals past a free number a month. An account left untouched goes inactive and then dormant, blocked until reactivated, and after the country’s years its money goes to the state, to be claimed back. A new account or card can be canceled in the country’s cooling-off period.',
      'Move Money moves it between your own accounts at once. A savings account can be opened, or closed with its money moved back.',
      'Where the bank runs an overdraft, the account can go below zero its way: arranged to a limit, with interest and any fee, or paid item by item with a fee for each. A US bank won’t pay an everyday debit card purchase into an overdraft unless you’ve opted in. An account left overdrawn for sixty days is closed: the bank charges off what it can’t recover, the debt goes to collections and onto your record, and your money moves to another bank. Pay It, under In Collections, pays the debt down. A term deposit locks money away at a fixed rate for its term, and ends the way its bank ends it. A personal loan is repaid in equal monthly payments, and a payment missed goes on your record. And you can move to another bank where you live. Your card stays with the bank that issued it, as loans and term deposits do.',
    ],
    names: ['Your bank, from the Money panel', 'Your credit card, Pay Card In Full and Autopay', 'Apply, close, the statement day, the limit, going over it, and help with payments', 'Statements, The Year and Alerts', 'Cash: taking it out and paying it in', 'The card’s offers: its introductory rate, a balance or money transfer, a plan, and rewards', 'Your cards: locking one, reporting it lost or stolen, and payments that weren’t yours', 'Term deposits, round-ups, dormant and unclaimed accounts, and canceling something new', 'How You Pay, standing orders, payments set for a date, stopping a check and taking back a direct debit', 'Move Money', 'Open and close a savings account', 'Arrange an overdraft', 'Put money in a term deposit', 'Borrow, and pay a loan off', 'Opt in or out of debit card overdrafts', 'Pay a debt in collections', 'Switch bank'],
    opens: ['ui.bank', 'finance.pay_card', 'finance.set_autopay', 'card.apply', 'card.money_transfer', 'card.plan', 'card.redeem_rewards', 'card.lock', 'card.report', 'card.update_billers', 'card.dispute', 'bank.new_number', 'card.close', 'card.refund_credit', 'card.set_statement_day', 'card.request_limit', 'card.set_auto_raise', 'card.set_over_limit', 'card.request_hardship', 'bank.set_alerts', 'cash.withdraw', 'cash.deposit', 'bank.set_term_end', 'bank.break_term', 'bank.take_term_interest', 'bank.set_round_ups', 'bank.reactivate', 'bank.cancel_new', 'bank.claim_unclaimed', 'bank.set_payments', 'bank.add_standing_order', 'bank.cancel_standing_order', 'bank.schedule_payment', 'bank.cancel_scheduled', 'bank.stop_check', 'bank.reclaim_debit', 'bank.transfer', 'bank.open_savings', 'bank.close_savings', 'bank.arrange_overdraft', 'bank.open_term', 'bank.borrow', 'bank.repay_loan', 'bank.debit_overdraft', 'bank.pay_collections', 'bank.switch'],
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
