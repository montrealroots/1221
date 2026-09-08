/**
 * SLATE — the help corpus.
 *
 * Every workspace answers the same five questions, because a game this deep is
 * useless if the player cannot find out what a screen is for. Entries are
 * searchable, so typing "how do I buy a house" finds the property article.
 */

import { CITIES_WITH_REAL_GYMS } from '@/engine/content/fitness';

export interface HelpArticle {
  id: string;
  route: string;
  title: string;
  /** What is this? */
  what: string;
  /** What affects this? */
  affects: string[];
  /** What can I do here? */
  actions: string[];
  /** Where does this connect? */
  connects: string[];
  /** Phrases a player might actually type. */
  keywords: string[];
  /** Deeper mechanical detail, shown only in advanced mode. */
  advanced?: string[];
}

export const HELP_ARTICLES: readonly HelpArticle[] = [
  {
    id: 'home', route: '/home', title: 'Home',
    what: 'Your immediate life. Where you are, what time it is, what happens next, and anything that genuinely needs deciding.',
    affects: ['Everything scheduled on your calendar', 'Bills falling due', 'Offers and deadlines with a clock on them', 'How much energy you have left today'],
    actions: ['Deal with anything in the Decision Center', 'Sleep or skip ahead to your next commitment', 'Jump straight into whatever you are working on'],
    connects: ['Calendar decides what appears as next', 'Bank raises unpaid bills here', 'Casting and Projects raise offers here'],
    keywords: ['home', 'dashboard', 'today', 'what now', 'decisions', 'next'],
    advanced: ['Decision urgency is 0 to 100. Overdue items sort above everything regardless of urgency.'],
  },
  {
    id: 'calendar', route: '/workspace/calendar', title: 'Calendar',
    what: 'Every commitment in your life in one place, and the collision detector for all of them. If two things need you at once, this is where you find out.',
    affects: ['Work shifts', 'Auditions and meetings', 'Shoot days', 'Appointments', 'Flights', 'Bills and deadlines', 'Classes', 'Birthdays and anniversaries'],
    actions: ['Look ahead by month', 'See conflicts flagged before they cost you', 'Open anything to see what it is and what you can do to it', 'Plan something on a day: the gym, a run, a meal, an hour to read', 'Move, skip or cancel a plan; move or cancel an appointment; pay a bill from its entry'],
    connects: ['Travel, because being in the wrong city means missing things', 'Wellbeing and The City, because a plan opens as a scene when its time comes', 'Health, because moving an appointment moves the appointment itself', 'Production, because a missed shoot day costs a day of budget'],
    keywords: ['calendar', 'schedule', 'diary', 'conflicts', 'clash', 'when', 'dates', 'what is on', 'plan', 'plan something', 'reminder', 'reschedule', 'move it'],
    advanced: ['Two pending items that both require you and overlap in time are flagged as conflicted. Only items requiring your attendance can conflict.', 'A plan is yours to change; a bill, a flight or an observance belongs to the system that made it. When a plan comes due it raises a decision: play it out, just do it, or skip it. The scene finishing is what marks it attended; left alone past its window, it is missed.'],
  },
  {
    id: 'bank', route: '/workspace/bank', title: 'Bank',
    what: 'Accounts, bills, debt, credit and tax. Every balance here is the sum of its transactions, so anything you see can be traced to what caused it.',
    affects: ['Income from work, contracts, royalties and sponsorship', 'Rent or mortgage', 'Utilities and subscriptions', 'Loan and card interest', 'Tax withheld at source'],
    actions: ['Pay a bill', 'Move money between accounts', 'Open an account or apply for credit', 'Take a loan', 'Pay down debt', 'Read any transaction and what caused it'],
    connects: ['Property and Vehicles create bills when you buy', 'Work pays into your primary account', 'Insurance premiums are bills', 'Taxes depend on where you live'],
    keywords: ['bank', 'money', 'balance', 'bills', 'pay', 'credit score', 'loan', 'mortgage', 'tax', 'debt', 'transactions'],
    advanced: [
      'The ledger is double-entry. Every transaction sums to zero across its postings, which is why money cannot be created or lost.',
      'Credit score components: payment history 35%, utilisation 30%, length of history 15%, mix 10%, recent inquiries 10%.',
    ],
  },
  {
    id: 'wellbeing', route: '/workspace/wellbeing', title: 'Wellbeing',
    what: 'Energy, stress, sleep debt, condition and morale. Not a medical model — a game state that decides how well you perform at everything else.',
    affects: ['How long you have been awake', 'How much you slept and how well', 'Work and shoot days', 'Travel across time zones', 'Whether you have eaten'],
    actions: ['Sleep', 'Play an activity out — decide how long, see the cost and the clash, do it, see what it did', 'Or just do it, straight through, by the same rules', 'Eat or cook', 'Find a gym in The City and train there', 'See a counsellor when stress is high'],
    connects: ['Casting, because readiness changes how you audition', 'The City, because the gym is a building with a door and hours', 'Calendar, because anything you play out can be planned for later', 'Relationships, because being depleted shows'],
    keywords: ['energy', 'stress', 'sleep', 'tired', 'exhausted', 'health', 'hungry', 'eat', 'rest', 'burnout', 'play it out', 'scene', 'workout', 'sore', 'soreness', 'readiness'],
    advanced: ['Readiness combines energy, stress, sleep debt, nourishment, morale, travel fatigue and soreness into a single 0 to 100 multiplier used by performance systems.', 'A scene in progress stays above every screen until you finish or leave it. Leaving keeps what was already done. Typed text has to be one of the choices on screen; it never does anything on its own.'],
  },
  {
    id: 'city', route: '/workspace/city', title: 'The City',
    what: 'Where you are standing, what you can do there, and everywhere you could go instead — with what the journey costs in time, money and fuel.',
    affects: ['Traffic at the hour you set off', 'Whether you have a car here and fuel in it', 'Opening hours', 'Whether a place is real or SLATE’s own'],
    actions: ['Work out at a gym — walk in, buy a pass or use your membership, decide what today is for, do it one block at a time', 'Eat at a restaurant or café — get there, read the menu, order', 'Look around a landmark', 'Fill the tank', 'Take a hotel room', 'Go home'],
    connects: ['Wellbeing, because a workout is what moves fitness, condition and tomorrow’s soreness', 'Bank, because every pass, meal and fare is paid for', 'Calendar, because a gym session or a meal can be planned for later', 'Relationships, because a trainer remembers you'],
    keywords: ['city', 'where am i', 'gym', 'work out', 'workout', 'train', 'membership', 'day pass', 'trainer', 'class', 'restaurant', 'eat here', 'menu', 'drive', 'walk', 'taxi', 'fuel'],
    advanced: [`The landmarks and the named gyms are real and say only what is on the public record; their hours and prices are SLATE’s calibration and say so. Everything else in the city is SLATE’s own and says that too. Real gyms are listed in ${CITIES_WITH_REAL_GYMS.length} cities; everywhere else the gyms are invented.`],
  },
  {
    id: 'relationships', route: '/workspace/relationships', title: 'Relationships',
    what: 'Everyone you know, across seven dimensions rather than one bar: familiarity, affection, trust, respect, compatibility, commitment and conflict.',
    affects: ['How often you actually see each other', 'What you have done together and to each other', 'Underlying compatibility', 'Unresolved conflict, which poisons the rest'],
    actions: ['Talk, catch up or have a real conversation', 'Ask someone out — dinner, drinks, coffee, a film or a walk, at a place you pick', 'Play the date out: get ready, get there, the table, the door', 'Keep the promise you made at the door', 'Give a gift', 'Apologize', 'Define the relationship', 'Propose', 'Plan a wedding', 'Start a family'],
    connects: ['Calendar, because dates are commitments', 'Bank, because dates and weddings cost money', 'Household, because marriage merges one', 'Publicity, if a relationship becomes public'],
    keywords: ['friends', 'dating', 'date', 'ask out', 'dinner', 'drinks', 'promise', 'relationship', 'marriage', 'propose', 'wedding', 'family', 'children', 'kids', 'partner', 'breakup', 'divorce'],
    advanced: [
      'A date that comes round and is left alone is a standing-up. They waited, and they remember it for a year.',
      'Say you will call, or that you will arrange another evening, and they notice three days later whether you did.',
      'Memories decay on their own schedule. Big events have a decay of zero and never fade.',
      'A romantic relationship left alone long enough will end itself.',
    ],
  },
  {
    id: 'property', route: '/workspace/property', title: 'Property',
    what: 'Renting, buying, building and furnishing. Buying a home is a process, not a button: showings, offers, counters, inspection, appraisal, financing and closing, and every step that waits on you asks on Home with a scene behind it. A house on the market can be viewed; the agent is at the door and the rooms show their condition. A counter is a call from your agent, and the seller waits two days. The inspection report can be walked with the inspector or read anywhere, and four days of silence is a yes. Closing day is a table with the numbers on page one; sign, ask for three more days once, or walk away and lose the deposit. Then the keys, moving day, and the rooms furnished one at a time with the price on the line first.',
    affects: ['What you can put down and cover in closing costs', 'Your credit score and income against the payment', 'How motivated the seller is', 'Whether the appraisal supports the price'],
    actions: ['Book a showing', 'Make an offer', 'Respond to a counter', 'Act on inspection findings', 'Rent somewhere', 'Buy land and build on it', 'Design rooms and buy furnishings', 'List a property for sale'],
    connects: ['Bank, for the mortgage and closing costs', 'Taxes, which depend on the jurisdiction', 'Insurance, which a lender requires', 'Utilities, which start when you own', 'Wellbeing, because where you sleep affects how you sleep'],
    keywords: ['house', 'home', 'buy a house', 'rent', 'apartment', 'mansion', 'build a house', 'construction', 'land', 'interior', 'furniture', 'design', 'mortgage', 'real estate'],
    advanced: [
      'A lender refuses when the payment would exceed roughly 45% of measured income.',
      'Every account sits on a product with its own minimum, monthly fee, waiver and rate. The fee stops the month the balance clears the waiver.',
      'Cover is switched off until you switch it on. On, the balance can go below zero up to the limit and each time it does costs the fee. Off, the payment is simply refused.',
      'A savings product counts what leaves it and charges past its allowance. A certificate locks the money for its term; breaking it early gives back a share of the interest.',
      'A card runs a cycle: the statement closes monthly, the minimum is due three weeks later, clearing it in full costs nothing, and what you carry is what interest is charged on. Late is a fee and a mark on the record.',
      'A standing order moves money between your own accounts on a day of the month, and the bank gives up on it after three it cannot pay.',
      'Construction runs a dependency graph. Insulation waits on mechanical, electrical, plumbing and envelope.',
    ],
  },
  {
    id: 'vehicles', route: '/workspace/vehicles', title: 'Vehicles',
    what: 'Cars, motorcycles, boats and private aircraft: bought across a table, owned, serviced and modified. Every city has six lots — the new-car mall, the used lot, the classic dealer, the motorcycle dealer, the boat yard and the aircraft broker — and somebody on each floor who remembers you. Makes and models are real; every price and figure is SLATE’s own. Each keeps the configuration it left the factory with alongside the one it has now.',
    affects: ['Age, use and condition: miles on the road, hours on the water or in the air', 'What you find looking it over, which is a lever', 'Service history, or the lack of one', 'Factory options, which hold value', 'Modifications, which mostly do not', 'Where it is kept: a garage with so many spaces, a driveway, the street, a paid unit; a marina berth by the foot, a dry stack, a trailer at home, a private dock; a hangar, a shared hangar, a tie-down, or the ramp of wherever you flew it. Each has a monthly fee, and outside wears the thing and costs on the insurance', 'A crew on retainer for a yacht or an aircraft, billed monthly for as long as you own it'],
    actions: ['Go and see one: look it over, take it out (a drive, a ride, a sea trial, a demonstration flight), talk numbers', 'Offer, take their counter, or walk away — they may call', 'Trade in what you have of the same kind, ask for delivery or a ferry flight, ask them to fix what you found', 'Sign for cash, finance or a lease, and insure it from the same chair on the line that covers it', 'Move it: the garage, the driveway, the street, a storage unit, a berth, a dry stack, a trailer, your dock, a hangar or a tie-down', 'Name a boat or an aircraft', 'Book service', 'Fit or remove parts made for it', 'Drive, ride, spend a day on the water, or fly your own aircraft from Travel', 'Sell'],
    connects: ['Bank, for financing, berth and hangar bills and running costs', 'Insurance: motor, marine or aviation, offered at signing and told about modifications', 'The City, where the lots are', 'Calendar, for a delivery on its way', 'Travel, because a car is how you get to a location and your own aircraft is how you cross the country'],
    keywords: ['car', 'cars', 'buy a car', 'vehicle', 'dealership', 'dealer', 'negotiate', 'trade-in', 'trade in', 'test drive', 'delivery', 'service', 'repair', 'modify', 'tuning', 'wheels', 'exhaust', 'lease', 'finance', 'motorcycle', 'bike', 'boat', 'yacht', 'jet', 'aircraft', 'private jet', 'marina', 'berth', 'hangar'],
    advanced: [
      'The dealer has a floor and you never see it. Each offer is a round; after five their number stops moving. Walk away close to it and they call within two days.',
      'A delivered car is theirs until it arrives; it cannot be driven, sold or booked in. Collected cars get any agreed work done before the keys change hands.',
      'Fitment is validated against kind, make, model, year, trim, powertrain and body style, plus prerequisite parts. A car part never fits a boat.',
      'A stage two tune requires exhaust and intake first, because without them it damages the engine. A radar needs a plotter; a watermaker needs the generator.',
      'A boat counts engine hours and is serviced every hundred; an aircraft counts airframe hours and is serviced every two hundred. Both cost money at rest.',
      'Your own aircraft flies at what it costs to run rather than the charter rate, is checked against range and runway like any other, and lands where you do.',
      'A home’s garage has as many spaces as its kind, its features and any garage built on it say; a motorcycle takes half a space and a trailered boat takes two. What does not fit goes to the driveway, then the street. Moving home moves the cars.',
      'A marina has so many slips at each length and most of them are taken; a boat over the marina’s longest slip has to go elsewhere. A trailered boat pays the ramp each time out. A private dock costs nothing.',
      'An aircraft flown somewhere else sits on that ramp at a nightly rate, charged when it moves on or at the month’s end, while its hangar at home is still paid for.',
    ],
  },
  {
    id: 'social', route: '/workspace/social', title: 'Social',
    what: 'Four platforms with genuinely different mechanics and one audience engine underneath. Posting is not a guarantee of anything. Compose a post as a scene — format, angle, hook, effort — or use the quick form; a day after it goes up the audience says what it thought, in words that follow the numbers.',
    affects: ['Content quality, from your skill, the effort you put in and the gear you own', 'Your existing audience and its affinity', 'How consistently you post', 'Recent momentum', 'Time of day', 'Your public profile'],
    actions: ['Create an account', 'Make and publish a post', 'Schedule a post', 'Accept or decline a brand deal'],
    connects: ['Bank, because creator earnings and sponsorship are income', 'Marketing, because a post about a project feeds its campaign', 'Reputation, because virality moves fame'],
    keywords: ['social media', 'post', 'followers', 'audience', 'viral', 'brand deal', 'sponsorship', 'creator', 'monetisation', 'youtube', 'tiktok', 'instagram'],
    advanced: ['Virality is quality to the power 2.4, scaled by platform potential, trait modifiers and posting time. It is never guaranteed.'],
  },
  {
    id: 'phone', route: '/workspace/phone', title: 'Phone',
    what: 'A handset on the desk, with apps on it. The clock on it is the world clock, so an hour inside an app is an hour gone out of the day. YouTube is built as the app rather than as a panel of numbers: a feed from the channels you subscribe to, two hundred and forty channels with back catalogs, a watch page with comments, shorts, search, your own channel with uploads and thumbnails and scheduling, and analytics that show the median beside the total. The channels are SLATE\u2019s own; nobody real is named and no subscriber count belongs to anybody.',
    affects: ['What you have watched, which is what the feed learns from', 'Who you subscribe to, which is the whole subscriptions tab', 'The subject, because an hour of comedy and an hour of news do not leave you in the same state', 'The thumbnail you choose, which is most of whether anybody clicks', 'The hours you put into a video, which come out of your day'],
    actions: ['Open an app', 'Watch, skim or like a video', 'Subscribe to a channel', 'Comment on a video', 'Create your own channel', 'Upload, with a title, description, tags, thumbnail and a time', 'Read the comments you were warned about'],
    connects: ['Social, because a video you upload is also a post that earns', 'Wellbeing, because watching costs time and moves morale, energy and stress', 'Shopping, because the handset is the one you bought'],
    keywords: ['phone', 'iphone', 'youtube', 'video', 'app', 'feed', 'subscribe', 'channel', 'upload', 'thumbnail', 'comments', 'shorts', 'watch', 'analytics'],
    advanced: ['The world\u2019s back catalog is derived from each channel\u2019s seed rather than stored, so a save carries the player\u2019s own videos and history and not fourteen thousand rows of somebody else\u2019s.'],
  },
  {
    id: 'travel', route: '/workspace/travel', title: 'Travel',
    what: 'Anywhere else in the world: flights, hotels, private charter and driving between cities, with time zones and jet lag that follow you. Airlines, hotel brands and aircraft types are real names; every route, fare, property and rate is SLATE\'s own and says so. A booked flight is a day: three hours before it leaves it asks on Home, and you play it out (packing, the run to the airport, the desk and a seat, the gate with its delays and cancellations, the air, the carousel where a bag can go missing, the hotel desk) or just go. The gate closes forty-five minutes before departure on a player who never went, and a missed flight is what the fare says it is. Move a flight for the fare\'s fee, or cancel it. Whether a country wants a visa is real-world data SLATE does not carry.',
    affects: ['Distance and airport connectivity', 'How far ahead you book', 'Cabin, which changes both price and how wrecked you arrive', 'Aircraft range and runway length for private charter'],
    actions: ['Plan a trip', 'Search and book flights', 'Charter privately', 'Book a hotel', 'Cancel a booking'],
    connects: ['Calendar, because a flight occupies a day', 'Casting and Production, because being in the wrong city means missing work', 'Wellbeing, because time zones cost you'],
    keywords: ['travel', 'flight', 'fly', 'plane', 'airport', 'hotel', 'trip', 'private jet', 'charter', 'vacation'],
    advanced: ['Jet lag scales with flight duration and the number of time zones crossed, reduced by cabin comfort.'],
  },
  {
    id: 'health', route: '/workspace/health', title: 'Health',
    what: 'Simulated healthcare: providers, appointments, costs and recovery. This is a game system, not medical advice. An appointment coming round asks on Home: play it out, just go, or skip it, and an hour of silence is a no-show with a fee. Played, it is the desk (your card in network, out of network, or none), the room where you say what brought you in, an exam that ends in nothing, tests or a prescription, the bill, and a follow up you can book before you leave. Results come two days later on their own; a prescription is collected at a pharmacy and taken over days; the provider remembers you.',
    affects: ['Provider quality', 'Whether you have insurance, what it covers and whether the practice takes it', 'Whether you turn up', 'What you say brought you in'],
    actions: ['Book with a provider', 'Play the visit out, just go, or skip it', 'Collect a prescription', 'Book the follow up', 'See a counsellor when stress is high'],
    connects: ['Insurance, which decides what you pay', 'Bank, for the out-of-pocket cost', 'Wellbeing, because care restores condition', 'Calendar, because appointments are commitments'],
    keywords: ['doctor', 'dentist', 'health', 'appointment', 'chiropractor', 'therapy', 'counselling', 'optometrist', 'urgent care'],
  },
  {
    id: 'insurance', route: '/workspace/insurance', title: 'Insurance',
    what: 'Quote, premium, coverage, claim, decision, payout, renewal or lapse. The real shape of the thing.',
    affects: ['What is being insured and what it is worth', 'Your history of claims', 'For auto, how well you drive and whether the car is modified', 'For health, your age'],
    actions: ['Get a quote', 'Buy a policy', 'File a claim'],
    connects: ['Vehicles, where undisclosed modifications get a claim denied', 'Property, where a lender requires cover', 'Shopping, because valuable items should be scheduled'],
    keywords: ['insurance', 'policy', 'premium', 'claim', 'deductible', 'coverage', 'cover'],
    advanced: ['Filing a claim raises the premium by roughly 12% at the next cycle.'],
  },
  {
    id: 'education', route: '/workspace/education', title: 'Education',
    what: 'Classes, coaching and training that genuinely raise attributes and skills over time.',
    affects: ['Instructor quality', 'How rested and unstressed you are in the session', 'Your traits, which change how fast you learn', 'How high the attribute already is'],
    actions: ['Enrol in a course', 'Attend sessions', 'Drop out'],
    connects: ['Calendar, because sessions are commitments', 'Bank, because each session is paid for', 'Casting, because technique is a real audition input'],
    keywords: ['class', 'course', 'training', 'coach', 'acting class', 'learn', 'improve', 'school', 'study'],
    advanced: ['Gains have diminishing returns. The last ten points of an attribute are far harder than the first ten.'],
  },
  {
    id: 'track', route: '/workspace/track', title: 'Track',
    what: 'The one sport in the game. A season of real meets, every round of every one of them, and the times that come out of it.',
    affects: ['The sixteen running skills, weighted differently for every event', 'Form, which is built by sessions and lost by weeks off', 'Age, through the same youth curve everything else uses', 'The wind, in the events where a wind reading is taken'],
    actions: ['Go to the trial', 'Enter your events', 'Do a session', 'Race the next meet', 'Sit one out', 'Leave the squad'],
    connects: ['Education, because a school or a university is what you run for', 'University, because a place can be won on the track where a place is really won that way', 'Health, because a hamstring is a hamstring', 'Character, because the running skills sit on the same sheet as everything else'],
    keywords: ['track', 'running', 'sprint', 'race', 'meet', 'athletics', 'season', 'hundred meters', 'relay', 'hurdles'],
    advanced: ['The events, the meets, the records and the entry standards are real. Everybody else in the lane is SLATE’s own, and so is every time run in the game.'],
  },
  {
    id: 'shopping', route: '/workspace/shopping', title: 'Shopping',
    what: 'One commerce engine for everything you buy, from groceries to a grand complication. Purchases become real objects you own.',
    affects: ['Retailer tier and local cost of living', 'Sales tax in your jurisdiction', 'Delivery time by channel'],
    actions: ['Buy from a retailer', 'Return within the window', 'Save an outfit', 'Sell something you own'],
    connects: ['Bank, for the payment and the receipt', 'Wardrobe, for dress codes and red carpets', 'Insurance, for valuables', 'Pantry and cooking, for groceries'],
    keywords: ['shop', 'buy', 'store', 'groceries', 'clothes', 'watch', 'jewellery', 'furniture', 'wardrobe', 'outfit'],
  },
  {
    id: 'history', route: '/workspace/history', title: 'History',
    what: 'Everything that has happened, kept permanently. Where you lived, what you drove, who you were with, what you made.',
    affects: ['Every milestone any system records'],
    actions: ['Filter by category', 'Follow a record back to the thing it is about'],
    connects: ['All of it. History is written by every other system.'],
    keywords: ['history', 'timeline', 'past', 'memories', 'what happened', 'milestones', 'record'],
  },
  {
    id: 'character', route: '/workspace/character', title: 'Character',
    what: 'Your 88 performer attributes, your traits, your professional skills and your standing across seven separate reputations.',
    affects: ['Training and coaching', 'Work, which sharpens what you use', 'Traits, which modify attributes directly', 'Results, which move reputation'],
    actions: ['Read any attribute and what it does', 'See which traits you hold and what they change'],
    connects: ['Casting, Projects and Social all read from here'],
    keywords: ['character', 'attributes', 'traits', 'skills', 'stats', 'reputation', 'fame', 'me', 'who am i'],
    advanced: ['Fame, audience appeal, professional reputation, reliability, prestige, industry demand and controversy are tracked separately. You can be famous and disliked professionally.'],
  },
  {
    id: 'settings', route: '/workspace/settings', title: 'Settings',
    what: 'Preferences, accessibility and tutorial control.',
    affects: [],
    actions: ['Set time speed', 'Turn on reduced motion', 'Switch guided or advanced mode', 'Replay the tutorial without touching your save'],
    connects: ['Sandbox changes are logged so history stays honest about them'],
    keywords: ['settings', 'preferences', 'accessibility', 'reduced motion', 'tutorial', 'reset'],
  },
  {
    id: 'world', route: '/world', title: 'World',
    what: 'The discovery layer. Everything SLATE can do, grouped, with a way into each of it.',
    affects: [],
    actions: ['Browse every domain', 'Open any workspace'],
    connects: ['Every workspace in the game'],
    keywords: ['world', 'explore', 'discover', 'what can i do', 'everything'],
  },
];

export const HELP_BY_ROUTE: Readonly<Record<string, HelpArticle>> =
  Object.fromEntries(HELP_ARTICLES.map((a) => [a.route, a]));

export function searchHelp(query: string): HelpArticle[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return HELP_ARTICLES
    .map((article) => {
      let score = 0;
      if (article.title.toLowerCase().includes(q)) score += 60;
      for (const keyword of article.keywords) {
        if (keyword === q) score += 100;
        else if (keyword.includes(q)) score += 45;
        else if (q.includes(keyword)) score += 30;
      }
      if (article.what.toLowerCase().includes(q)) score += 20;
      for (const action of article.actions) if (action.toLowerCase().includes(q)) score += 25;
      return { article, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.article);
}
