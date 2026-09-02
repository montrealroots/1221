/**
 * SLATE — the help corpus.
 *
 * Every workspace answers the same five questions, because a game this deep is
 * useless if the player cannot find out what a screen is for. Entries are
 * searchable, so typing "how do I buy a house" finds the property article.
 */

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
    actions: ['Look ahead by month', 'See conflicts flagged before they cost you', 'Open anything to deal with it'],
    connects: ['Travel, because being in the wrong city means missing things', 'Work, because a missed shift has consequences', 'Production, because a missed shoot day costs a day of budget'],
    keywords: ['calendar', 'schedule', 'diary', 'conflicts', 'clash', 'when', 'dates', 'what is on'],
    advanced: ['Two pending items that both require you and overlap in time are flagged as conflicted. Only items requiring your attendance can conflict.'],
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
    id: 'jobs', route: '/workspace/jobs', title: 'Work',
    what: 'Ordinary employment. You never have to become famous; you can get a job, show up, and build a life on it.',
    affects: ['Your skills against what the listing asks for', 'Your work history', 'How you come across', 'How contested the role is', 'Whether you turned up rested'],
    actions: ['Apply for a listing', 'Attend an interview', 'Accept or decline an offer', 'Ask for a promotion', 'Request time off', 'Resign'],
    connects: ['Calendar, because shifts occupy real hours', 'Bank, because wages arrive withheld', 'Casting, because a shift and an audition can collide'],
    keywords: ['job', 'work', 'apply', 'interview', 'shift', 'promotion', 'quit', 'fired', 'salary', 'employment'],
    advanced: ['Three missed shifts in a row ends the job. Attendance and performance both feed promotion odds.'],
  },
  {
    id: 'wellbeing', route: '/workspace/wellbeing', title: 'Wellbeing',
    what: 'Energy, stress, sleep debt, condition and morale. Not a medical model — a game state that decides how well you perform at everything else.',
    affects: ['How long you have been awake', 'How much you slept and how well', 'Work and shoot days', 'Travel across time zones', 'Whether you have eaten'],
    actions: ['Sleep', 'Rest or nap', 'Eat or cook', 'Exercise', 'See a counsellor when stress is high'],
    connects: ['Casting, because readiness changes how you audition', 'Production, because tired performances cost takes', 'Relationships, because being depleted shows'],
    keywords: ['energy', 'stress', 'sleep', 'tired', 'exhausted', 'health', 'hungry', 'eat', 'rest', 'burnout'],
    advanced: ['Readiness combines energy, stress, sleep debt, nourishment, morale and travel fatigue into a single 0 to 100 multiplier used by performance systems.'],
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
    what: 'Buying, owning, servicing and modifying. Every car keeps the configuration it left the factory with alongside the one it has now.',
    affects: ['Age, mileage and condition', 'Service history, or the lack of one', 'Factory options, which hold value', 'Modifications, which mostly do not'],
    actions: ['Browse and negotiate', 'Buy with cash, finance or a lease', 'Book service', 'Fit or remove parts', 'Sell or trade'],
    connects: ['Bank, for financing and running costs', 'Insurance, which must be told about modifications', 'Registration, which fails inspection with illegal parts', 'Travel, because a car is how you get to a location'],
    keywords: ['car', 'cars', 'buy a car', 'vehicle', 'service', 'repair', 'modify', 'tuning', 'wheels', 'exhaust', 'lease', 'finance'],
    advanced: [
      'Fitment is validated against make, model, year, trim, powertrain and body style, plus prerequisite parts.',
      'A stage two tune requires exhaust and intake first, because without them it damages the engine.',
    ],
  },
  {
    id: 'casting', route: '/workspace/casting', title: 'Casting',
    what: 'Submissions, self-tapes, auditions, callbacks and offers. You are scored the same way as everyone else in the room and you can lose to a better candidate.',
    affects: ['How well your instrument fits what the role needs', 'Audition technique or self-tape craft', 'How much you prepared', 'How rested you were on the day', 'Your age against the breakdown', 'What you have done before'],
    actions: ['Submit for a breakdown', 'Prepare, then perform', 'Accept or pass on an offer', 'Seek representation'],
    connects: ['Wellbeing, because readiness is a real input', 'Calendar, because auditions are appointments in a city', 'Projects, because booking one puts you on a shoot schedule', 'Bank, because a booking is a contract with a payment schedule'],
    keywords: ['audition', 'casting', 'self tape', 'callback', 'role', 'part', 'agent', 'manager', 'representation', 'booked', 'how do i audition'],
    advanced: [
      'Total score is 58% performance, 16% fit, 12% industry demand, 8% professional reputation and 6% age match.',
      'Missing an audition because you are in another city damages reliability.',
    ],
  },
  {
    id: 'projects', route: '/workspace/projects', title: 'Projects',
    what: 'One canonical project from idea to library. Rights, writing, development, packaging, greenlight, financing, casting, production, post, marketing, distribution, results and awards all point at the same record.',
    affects: ['Script quality and the draft you are on', 'Who is attached', 'Market appetite for the genre', 'Budget against comparable films', 'Your track record', 'Whether the rights are actually secured'],
    actions: ['Create a project', 'Option or buy rights', 'Write and rewrite drafts', 'Attach talent', 'Pitch to buyers', 'Greenlight if you have the authority', 'Arrange financing', 'Board a schedule and shoot', 'Run post', 'Plan a campaign and a release'],
    connects: ['Companies, because a greenlight needs authority and a balance sheet', 'Casting, for the cast', 'Calendar, for every shoot day', 'Bank, for every contract payment', 'Awards, for eligibility'],
    keywords: ['film', 'movie', 'project', 'script', 'write', 'produce', 'direct', 'greenlight', 'shoot', 'post production', 'release', 'box office', 'streaming', 'distribution', 'how do i make a movie'],
    advanced: [
      'You cannot greenlight without an active chain of title. An option expiring within six months blocks it.',
      'Final quality is 34% script, 20% directing, 18% cast, 15% production execution and 13% post.',
      'Theatrical: exhibitors keep about half of domestic, then the distributor fee and prints and advertising come off before profit.',
    ],
  },
  {
    id: 'company', route: '/workspace/company', title: 'Company',
    what: 'Found a company and grow it. Company money is a separate ledger from yours, and what it can commit to is derived from what it actually has.',
    affects: ['Liquid cash and credit', 'Library value from delivered projects', 'Track record, especially the profitable ones', 'Owned equipment and property', 'Company reputation'],
    actions: ['Found a company', 'Put capital in or take distributions out', 'Hire executives and create divisions', 'Buy or rent equipment', 'Launch merchandise'],
    connects: ['Projects, because the greenlight ceiling is set here', 'Bank, because payroll and overhead are real bills', 'Rights, because merchandising needs the rights to exist'],
    keywords: ['company', 'studio', 'start a studio', 'business', 'found', 'hire', 'employees', 'payroll', 'equipment', 'merchandise', 'how do i start my own studio'],
    advanced: ['Ceiling is roughly 2.6 times the balance sheet, multiplied by track record and reputation. Delivering profitable films is the only way to raise it meaningfully.'],
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
    id: 'awards', route: '/workspace/awards', title: 'Awards',
    what: 'Edition-specific awards and festivals. The 97th ceremony is a different object from the 98th, and once an edition is finalised its result never changes.',
    affects: ['The film itself, which dominates', 'Critical standing', 'Precursor wins earlier in the season', 'Campaign spend, at the margin only', 'Eligibility windows and release dates'],
    actions: ['Campaign in specific categories', 'Submit to festivals', 'Accept an acquisition offer out of a festival'],
    connects: ['Projects, because eligibility depends on format and release', 'Bank, because campaigns cost real money', 'Career, because winning moves demand, prestige and your quote'],
    keywords: ['awards', 'nomination', 'ceremony', 'campaign', 'festival', 'premiere', 'jury', 'won', 'vanguard'],
    advanced: ['Ballots are private. The audit shows what you could have known and says explicitly that the count is not visible to you.'],
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
    what: 'Preferences, accessibility, tutorial control and sandbox tools.',
    affects: [],
    actions: ['Set time speed', 'Turn on reduced motion', 'Switch guided or advanced mode', 'Replay the tutorial without touching your save', 'Enable sandbox tools'],
    connects: ['Sandbox changes are logged so history stays honest about them'],
    keywords: ['settings', 'preferences', 'accessibility', 'reduced motion', 'sandbox', 'cheat', 'tutorial', 'reset'],
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
