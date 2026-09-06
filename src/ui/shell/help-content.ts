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
    actions: ['Talk, catch up or have a real conversation', 'Ask someone out', 'Give a gift', 'Apologise', 'Define the relationship', 'Propose', 'Plan a wedding', 'Start a family'],
    connects: ['Calendar, because dates are commitments', 'Bank, because dates and weddings cost money', 'Household, because marriage merges one', 'Publicity, if a relationship becomes public'],
    keywords: ['friends', 'dating', 'relationship', 'marriage', 'propose', 'wedding', 'family', 'children', 'kids', 'partner', 'breakup', 'divorce'],
    advanced: [
      'Memories decay on their own schedule. Big events have a decay of zero and never fade.',
      'A romantic relationship left alone long enough will end itself.',
    ],
  },
  {
    id: 'property', route: '/workspace/property', title: 'Property',
    what: 'Renting, buying, building and furnishing. Buying a home is a process, not a button: showings, offers, counters, inspection, appraisal, financing and closing.',
    affects: ['What you can put down and cover in closing costs', 'Your credit score and income against the payment', 'How motivated the seller is', 'Whether the appraisal supports the price'],
    actions: ['Book a showing', 'Make an offer', 'Respond to a counter', 'Act on inspection findings', 'Rent somewhere', 'Buy land and build on it', 'Design rooms and buy furnishings', 'List a property for sale'],
    connects: ['Bank, for the mortgage and closing costs', 'Taxes, which depend on the jurisdiction', 'Insurance, which a lender requires', 'Utilities, which start when you own', 'Wellbeing, because where you sleep affects how you sleep'],
    keywords: ['house', 'home', 'buy a house', 'rent', 'apartment', 'mansion', 'build a house', 'construction', 'land', 'interior', 'furniture', 'design', 'mortgage', 'real estate'],
    advanced: [
      'A lender refuses when the payment would exceed roughly 45% of measured income.',
      'Construction runs a dependency graph. Insulation waits on mechanical, electrical, plumbing and envelope.',
    ],
  },
  {
    id: 'vehicles', route: '/workspace/vehicles', title: 'Vehicles',
    what: 'Buying across a table, owning, servicing and modifying. Every city has three lots — the new-car mall, the used lot and the classic dealer — and somebody on each floor who remembers you. Every car keeps the configuration it left the factory with alongside the one it has now.',
    affects: ['Age, mileage and condition', 'What you find looking it over, which is a lever', 'Service history, or the lack of one', 'Factory options, which hold value', 'Modifications, which mostly do not'],
    actions: ['Go and see a car: look it over, drive it, talk numbers', 'Offer, take their counter, or walk away — they may call', 'Trade in a car, ask for delivery, ask them to fix what you found', 'Sign for cash, finance or a lease, and insure it from the same chair', 'Book service', 'Fit or remove parts', 'Sell'],
    connects: ['Bank, for financing and running costs', 'Insurance, offered at signing and told about modifications', 'The City, where the lots are', 'Calendar, for a delivery on its way', 'Travel, because a car is how you get to a location'],
    keywords: ['car', 'cars', 'buy a car', 'vehicle', 'dealership', 'dealer', 'negotiate', 'trade-in', 'trade in', 'test drive', 'delivery', 'service', 'repair', 'modify', 'tuning', 'wheels', 'exhaust', 'lease', 'finance'],
    advanced: [
      'The dealer has a floor and you never see it. Each offer is a round; after five their number stops moving. Walk away close to it and they call within two days.',
      'A delivered car is theirs until it arrives; it cannot be driven, sold or booked in. Collected cars get any agreed work done before the keys change hands.',
      'Fitment is validated against make, model, year, trim, powertrain and body style, plus prerequisite parts.',
      'A stage two tune requires exhaust and intake first, because without them it damages the engine.',
    ],
  },
  {
    id: 'social', route: '/workspace/social', title: 'Social',
    what: 'Four platforms with genuinely different mechanics and one audience engine underneath. Posting is not a guarantee of anything.',
    affects: ['Content quality, from your skill, the effort you put in and the gear you own', 'Your existing audience and its affinity', 'How consistently you post', 'Recent momentum', 'Time of day', 'Your public profile'],
    actions: ['Create an account', 'Make and publish a post', 'Schedule a post', 'Accept or decline a brand deal'],
    connects: ['Bank, because creator earnings and sponsorship are income', 'Marketing, because a post about a project feeds its campaign', 'Reputation, because virality moves fame'],
    keywords: ['social media', 'post', 'followers', 'audience', 'viral', 'brand deal', 'sponsorship', 'creator', 'monetisation', 'youtube', 'tiktok', 'instagram'],
    advanced: ['Virality is quality to the power 2.4, scaled by platform potential, trait modifiers and posting time. It is never guaranteed.'],
  },
  {
    id: 'travel', route: '/workspace/travel', title: 'Travel',
    what: 'Trips, commercial flights, private charter and hotels. Travel is what ties geography, the calendar and your location together.',
    affects: ['Distance and airport connectivity', 'How far ahead you book', 'Cabin, which changes both price and how wrecked you arrive', 'Aircraft range and runway length for private charter'],
    actions: ['Plan a trip', 'Search and book flights', 'Charter privately', 'Book a hotel', 'Cancel a booking'],
    connects: ['Calendar, because a flight occupies a day', 'Casting and Production, because being in the wrong city means missing work', 'Wellbeing, because time zones cost you'],
    keywords: ['travel', 'flight', 'fly', 'plane', 'airport', 'hotel', 'trip', 'private jet', 'charter', 'vacation'],
    advanced: ['Jet lag scales with flight duration and the number of time zones crossed, reduced by cabin comfort.'],
  },
  {
    id: 'health', route: '/workspace/health', title: 'Health',
    what: 'Simulated healthcare: providers, appointments, costs and recovery. This is a game system, not medical advice.',
    affects: ['Provider quality', 'Whether you have insurance and what it covers', 'Whether you turn up', 'How long the wait is'],
    actions: ['Book with a provider', 'Attend or cancel', 'See a counsellor when stress is high'],
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
