/**
 * SLATE — the press that covers this industry.
 *
 * Every outlet here is a real publication and everything stated about it is
 * public record: when it started, who owns it, where it is published, how
 * often, and what it actually covers. Nothing about a real masthead is
 * invented — where a fact was not certain it is simply absent, because an
 * approximate founding year presented as a fact is a lie the player cannot
 * check.
 *
 * Two fields are SLATE's rather than the record's, and are marked as such
 * wherever they are shown:
 *
 *   `register` — how the outlet writes, as a category the generator uses. It
 *      is a reading of a house style, not a claim about editorial policy.
 *   `reach`, `speed` — how widely a piece travels in the simulation and how
 *      fast that outlet gets to a story. Both are calibration.
 *
 * Nothing any outlet "publishes" inside a save was written by that
 * publication. The stories are SLATE's, about SLATE's invented films, and the
 * screens say so on every page they appear.
 */

import { Registry, REFERENCE_VERSION, type ReferenceRecord } from './reference';

/**
 * How an outlet writes.
 *
 * These are the registers the generator writes in. A register is a way of
 * building a paragraph — where the news goes, how much number is in it, how
 * much opinion — not a judgement about a publication.
 */
export type Register =
  /** Breaks it first, short, exclusive framing, the deal at the top. */
  | 'scoop'
  /** The business of it: money, market, what the company is doing and why. */
  | 'business'
  /** Reports it straight with both sides and the context underneath. */
  | 'balanced'
  /** Weighs it as work: what it is trying to be and whether it gets there. */
  | 'critical'
  /** Writes for the audience that is excited about it. */
  | 'enthusiast'
  /** The long form: an argument with the film as its subject. */
  | 'essay'
  /** The wire: who, what, when, where, in that order, with nothing added. */
  | 'wire'
  /** Counts rather than writes: charts, scores, grosses. */
  | 'aggregate';

export const REGISTER_LABEL: Readonly<Record<Register, string>> = {
  scoop: 'Breaks It First',
  business: 'The Business Of It',
  balanced: 'Straight Down The Middle',
  critical: 'Weighs It As Work',
  enthusiast: 'For The People Who Are Excited',
  essay: 'The Long Argument',
  wire: 'The Wire',
  aggregate: 'Counts Rather Than Writes',
};

/** What an outlet covers. A piece only ever runs somewhere that covers its beat. */
export type Beat =
  | 'development' | 'production' | 'casting' | 'boxoffice' | 'television'
  | 'awards' | 'festivals' | 'business' | 'criticism' | 'labour' | 'streaming'
  | 'international';

export const BEAT_LABEL: Readonly<Record<Beat, string>> = {
  development: 'Development', production: 'Production', casting: 'Casting',
  boxoffice: 'Box Office', television: 'Television', awards: 'Awards',
  festivals: 'Festivals', business: 'Business', criticism: 'Criticism',
  labour: 'Labour', streaming: 'Streaming', international: 'International',
};

export type OutletKind = 'trade' | 'consumer' | 'criticism' | 'aggregator' | 'wire' | 'newspaper';

export const OUTLET_KIND_LABEL: Readonly<Record<OutletKind, string>> = {
  trade: 'Trade', consumer: 'Consumer', criticism: 'Criticism',
  aggregator: 'Aggregator', wire: 'Wire Service', newspaper: 'Newspaper',
};

export type Cadence = 'continuous' | 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly';

export const CADENCE_LABEL: Readonly<Record<Cadence, string>> = {
  continuous: 'Continuously', daily: 'Daily', weekly: 'Weekly',
  fortnightly: 'Fortnightly', monthly: 'Monthly', quarterly: 'Quarterly',
};

export type Paywall = 'none' | 'metered' | 'hard' | 'subscriber' | 'print';

export const PAYWALL_LABEL: Readonly<Record<Paywall, string>> = {
  none: 'Free To Read', metered: 'Metered', hard: 'Paywalled',
  subscriber: 'Subscriber Only', print: 'Print And Digital',
};

export interface Outlet extends ReferenceRecord {
  type: 'outlet';
  shortName: string;
  kind: OutletKind;
  /** The year it began publishing. Absent when the record is not clear. */
  founded?: number;
  /** Who owns it now. Absent when ownership is not settled or not clear. */
  owner?: string;
  /** Who started it, where the record names them. */
  foundedBy?: string;
  countryId: string;
  city: string;
  cadence: Cadence;
  beats: Beat[];
  register: Register;
  paywall: Paywall;
  /** How far a piece travels, 0 to 100. SLATE's calibration, not a circulation figure. */
  reach: number;
  /** How quickly they get to a story, 0 to 100. SLATE's calibration. */
  speed: number;
  /** What the publication is, in the record's terms. */
  about: string;
  site: string;
  /** The name a byline appears under, where the outlet uses one. */
  bylineStyle?: 'staff' | 'named' | 'none';
}

const base = {
  type: 'outlet' as const,
  source: 'public_reference' as const,
  confidence: 'high' as const,
  version: REFERENCE_VERSION,
};

/**
 * The outlets.
 *
 * Ordered roughly by how central each is to how the business talks about
 * itself, which is also the order the industry tab lists them in.
 */
const OUTLET_SEEDS: Outlet[] = [
  // --- The American trades -------------------------------------------------
  {
    ...base, id: 'variety', name: 'Variety', shortName: 'Variety', kind: 'trade',
    founded: 1905, foundedBy: 'Sime Silverman', owner: 'Penske Media Corporation',
    countryId: 'us', city: 'Los Angeles', cadence: 'continuous',
    beats: ['development', 'production', 'casting', 'boxoffice', 'television', 'awards', 'festivals', 'business', 'criticism', 'labour', 'streaming', 'international'],
    register: 'business', paywall: 'metered', reach: 96, speed: 88,
    about: 'Founded in New York in 1905 by Sime Silverman as a weekly covering vaudeville, and in Hollywood since 1933. It writes about the business as a business: the money, the market and the companies, alongside reviews and awards coverage.',
    site: 'variety.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'hollywood-reporter', name: 'The Hollywood Reporter', shortName: 'THR', kind: 'trade',
    founded: 1930, foundedBy: 'William R. Wilkerson', owner: 'Penske Media Corporation',
    countryId: 'us', city: 'Los Angeles', cadence: 'continuous',
    beats: ['development', 'production', 'casting', 'boxoffice', 'television', 'awards', 'festivals', 'business', 'criticism', 'labour', 'streaming'],
    register: 'balanced', paywall: 'metered', reach: 93, speed: 85,
    about: 'Hollywood’s first daily trade paper, founded in 1930 by William R. Wilkerson. It runs long features and awards coverage alongside the daily business, and has a weekly print edition.',
    site: 'hollywoodreporter.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'deadline', name: 'Deadline', shortName: 'Deadline', kind: 'trade',
    founded: 2006, foundedBy: 'Nikki Finke', owner: 'Penske Media Corporation',
    countryId: 'us', city: 'Los Angeles', cadence: 'continuous',
    beats: ['development', 'production', 'casting', 'boxoffice', 'television', 'awards', 'business', 'labour', 'streaming'],
    register: 'scoop', paywall: 'none', reach: 92, speed: 97,
    about: 'Started in 2006 by Nikki Finke as Deadline Hollywood Daily, a blog that broke news faster than the weeklies could print it, and bought by Penske Media in 2009. It still reads like that: the deal at the top, in as few words as it takes.',
    site: 'deadline.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'indiewire', name: 'IndieWire', shortName: 'IndieWire', kind: 'trade',
    founded: 1996, owner: 'Penske Media Corporation',
    countryId: 'us', city: 'Los Angeles', cadence: 'continuous',
    beats: ['development', 'festivals', 'criticism', 'awards', 'television', 'international', 'streaming'],
    register: 'critical', paywall: 'none', reach: 74, speed: 72,
    about: 'Founded in 1996 as a daily email for the American independent film community, and one of the first film publications to exist online first. It covers festivals, independent film and craft, and reviews.',
    site: 'indiewire.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'thewrap', name: 'TheWrap', shortName: 'TheWrap', kind: 'trade',
    founded: 2009, foundedBy: 'Sharon Waxman',
    countryId: 'us', city: 'Los Angeles', cadence: 'continuous',
    beats: ['development', 'boxoffice', 'television', 'business', 'awards', 'labour', 'streaming'],
    register: 'scoop', paywall: 'metered', reach: 68, speed: 84,
    about: 'Founded in 2009 by the journalist Sharon Waxman as a digital-first outlet covering the business of entertainment and the media companies behind it.',
    site: 'thewrap.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'puck', name: 'Puck', shortName: 'Puck', kind: 'trade',
    founded: 2021,
    countryId: 'us', city: 'New York', cadence: 'weekly',
    beats: ['business', 'development', 'television', 'awards', 'streaming'],
    register: 'business', paywall: 'subscriber', reach: 58, speed: 70,
    about: 'Launched in 2021 as a subscription newsletter business in which the writers are shareholders. Its Hollywood coverage is written as a private letter to people who already know the players.',
    site: 'puck.news', bylineStyle: 'named',
  },
  {
    ...base, id: 'nexttv', name: 'Broadcasting + Cable', shortName: 'B+C', kind: 'trade',
    founded: 1931, owner: 'Future plc',
    countryId: 'us', city: 'New York', cadence: 'weekly',
    beats: ['television', 'business', 'streaming'],
    register: 'business', paywall: 'none', reach: 44, speed: 58,
    about: 'A television industry trade running since 1931, covering broadcast, cable and now streaming distribution, carriage and ratings.',
    site: 'nexttv.com', bylineStyle: 'named',
  },

  // --- International trades ------------------------------------------------
  {
    ...base, id: 'screen-international', name: 'Screen International', shortName: 'Screen', kind: 'trade',
    founded: 1975, owner: 'Media Business Insight',
    countryId: 'uk', city: 'London', cadence: 'continuous',
    beats: ['development', 'production', 'festivals', 'business', 'international', 'criticism'],
    register: 'balanced', paywall: 'hard', reach: 66, speed: 74,
    about: 'The international film trade, published in London since 1975. It covers sales, co-production and the festival market from outside the American studio system, and its daily editions at Cannes, Berlin and Toronto are read across the market.',
    site: 'screendaily.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'c21', name: 'C21Media', shortName: 'C21', kind: 'trade',
    founded: 1991,
    countryId: 'uk', city: 'London', cadence: 'continuous',
    beats: ['television', 'business', 'international', 'streaming'],
    register: 'business', paywall: 'subscriber', reach: 40, speed: 66,
    about: 'A London television trade covering the international content business: commissions, formats, distribution and the markets where television is bought and sold.',
    site: 'c21media.net', bylineStyle: 'named',
  },
  {
    ...base, id: 'le-film-francais', name: 'Le Film Français', shortName: 'Le Film Français', kind: 'trade',
    founded: 1944,
    countryId: 'fr', city: 'Paris', cadence: 'weekly',
    beats: ['development', 'production', 'boxoffice', 'business', 'festivals', 'international'],
    register: 'business', paywall: 'subscriber', reach: 36, speed: 62,
    about: 'The French film industry’s own weekly, covering production, distribution and the French box office from Paris.',
    site: 'lefilmfrancais.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'blickpunkt-film', name: 'Blickpunkt:Film', shortName: 'Blickpunkt:Film', kind: 'trade',
    countryId: 'de', city: 'Munich', cadence: 'weekly',
    beats: ['boxoffice', 'business', 'development', 'international'],
    register: 'business', paywall: 'subscriber', reach: 30, speed: 58,
    about: 'The German film and home entertainment trade, covering distribution, exhibition and the German box office.',
    site: 'blickpunktfilm.de', bylineStyle: 'named',
  },
  {
    ...base, id: 'kinema-junpo', name: 'Kinema Junpo', shortName: 'Kinema Junpo', kind: 'criticism',
    founded: 1919,
    countryId: 'jp', city: 'Tokyo', cadence: 'fortnightly',
    beats: ['criticism', 'awards', 'international', 'development'],
    register: 'essay', paywall: 'print', reach: 34, speed: 30,
    about: 'Japan’s oldest film magazine, published since 1919, and the body behind the Kinema Junpo Awards, whose annual best-ten lists are among the longest-running critical records in cinema.',
    site: 'kinejun.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'bollywood-hungama', name: 'Bollywood Hungama', shortName: 'Bollywood Hungama', kind: 'consumer',
    founded: 1998,
    countryId: 'in', city: 'Mumbai', cadence: 'continuous',
    beats: ['casting', 'boxoffice', 'development', 'criticism', 'international'],
    register: 'enthusiast', paywall: 'none', reach: 62, speed: 82,
    about: 'An Indian film site running since 1998, covering Hindi cinema news, casting and the Indian box office.',
    site: 'bollywoodhungama.com', bylineStyle: 'staff',
  },
  {
    ...base, id: 'fotogramas', name: 'Fotogramas', shortName: 'Fotogramas', kind: 'consumer',
    founded: 1946, owner: 'Hearst España',
    countryId: 'es', city: 'Barcelona', cadence: 'monthly',
    beats: ['criticism', 'casting', 'development', 'international'],
    register: 'enthusiast', paywall: 'print', reach: 32, speed: 40,
    about: 'Spain’s longest-running film magazine, published since 1946, with reviews, interviews and the Fotogramas de Plata awards.',
    site: 'fotogramas.es', bylineStyle: 'named',
  },

  // --- Criticism -----------------------------------------------------------
  {
    ...base, id: 'sight-and-sound', name: 'Sight and Sound', shortName: 'Sight and Sound', kind: 'criticism',
    founded: 1932, owner: 'British Film Institute',
    countryId: 'uk', city: 'London', cadence: 'monthly',
    beats: ['criticism', 'festivals', 'international'],
    register: 'essay', paywall: 'print', reach: 42, speed: 22,
    about: 'The British Film Institute’s magazine, published since 1932, and the home of the decennial Greatest Films of All Time poll that has run since 1952.',
    site: 'bfi.org.uk', bylineStyle: 'named',
  },
  {
    ...base, id: 'cahiers', name: 'Cahiers du Cinéma', shortName: 'Cahiers', kind: 'criticism',
    founded: 1951, foundedBy: 'André Bazin, Jacques Doniol-Valcroze and Joseph-Marie Lo Duca',
    countryId: 'fr', city: 'Paris', cadence: 'monthly',
    beats: ['criticism', 'festivals', 'international'],
    register: 'essay', paywall: 'print', reach: 38, speed: 20,
    about: 'Founded in Paris in 1951, and the magazine where the critics who became the French New Wave — Godard, Truffaut, Rohmer, Rivette, Chabrol — argued their way into filmmaking. It still publishes a top ten every year.',
    site: 'cahiersducinema.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'film-comment', name: 'Film Comment', shortName: 'Film Comment', kind: 'criticism',
    founded: 1962, owner: 'Film at Lincoln Center',
    countryId: 'us', city: 'New York', cadence: 'quarterly',
    beats: ['criticism', 'festivals', 'international'],
    register: 'essay', paywall: 'print', reach: 30, speed: 18,
    about: 'Published since 1962 and edited from Film at Lincoln Center in New York. Long-form criticism, interviews and an annual poll.',
    site: 'filmcomment.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'little-white-lies', name: 'Little White Lies', shortName: 'LWLies', kind: 'criticism',
    founded: 2005, owner: 'TCO London',
    countryId: 'uk', city: 'London', cadence: 'quarterly',
    beats: ['criticism', 'festivals'],
    register: 'essay', paywall: 'print', reach: 28, speed: 30,
    about: 'A London film magazine founded in 2005, built around one film per issue and known for its illustration and its anticipation, enjoyment and retrospect scoring.',
    site: 'lwlies.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'rogerebert', name: 'RogerEbert.com', shortName: 'RogerEbert.com', kind: 'criticism',
    founded: 2002,
    countryId: 'us', city: 'Chicago', cadence: 'continuous',
    beats: ['criticism', 'festivals', 'awards'],
    register: 'critical', paywall: 'none', reach: 52, speed: 44,
    about: 'The site Roger Ebert began in 2002 and which has continued since his death in 2013, publishing reviews on his four-star scale alongside essays and festival coverage.',
    site: 'rogerebert.com', bylineStyle: 'named',
  },

  // --- Consumer ------------------------------------------------------------
  {
    ...base, id: 'empire', name: 'Empire', shortName: 'Empire', kind: 'consumer',
    founded: 1989, owner: 'Bauer Media Group',
    countryId: 'uk', city: 'London', cadence: 'monthly',
    beats: ['criticism', 'casting', 'development', 'production'],
    register: 'enthusiast', paywall: 'print', reach: 64, speed: 38,
    about: 'Britain’s biggest film magazine, launched in 1989. Set visits, cover interviews, five-star reviews, and the reader-voted Empire Awards.',
    site: 'empireonline.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'total-film', name: 'Total Film', shortName: 'Total Film', kind: 'consumer',
    founded: 1997, owner: 'Future plc',
    countryId: 'uk', city: 'Bath', cadence: 'monthly',
    beats: ['criticism', 'casting', 'development'],
    register: 'enthusiast', paywall: 'print', reach: 46, speed: 40,
    about: 'A British film monthly published since 1997, covering upcoming releases, interviews and reviews.',
    site: 'gamesradar.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'vulture', name: 'Vulture', shortName: 'Vulture', kind: 'consumer',
    founded: 2006, owner: 'Vox Media',
    countryId: 'us', city: 'New York', cadence: 'continuous',
    beats: ['criticism', 'television', 'awards', 'casting', 'streaming'],
    register: 'critical', paywall: 'metered', reach: 70, speed: 68,
    about: 'New York magazine’s culture site, started in 2006. Criticism, recaps and reporting with a voice of its own, and the closest thing American culture writing has to a running commentary.',
    site: 'vulture.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'slashfilm', name: '/Film', shortName: '/Film', kind: 'consumer',
    founded: 2005, owner: 'Static Media',
    countryId: 'us', city: 'Los Angeles', cadence: 'continuous',
    beats: ['development', 'casting', 'criticism', 'television'],
    register: 'enthusiast', paywall: 'none', reach: 48, speed: 76,
    about: 'A film site running since 2005, covering news, interviews and reviews for an audience that follows filmmaking closely.',
    site: 'slashfilm.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'collider', name: 'Collider', shortName: 'Collider', kind: 'consumer',
    founded: 2005, owner: 'Valnet',
    countryId: 'ca', city: 'Montreal', cadence: 'continuous',
    beats: ['development', 'casting', 'television', 'criticism', 'streaming'],
    register: 'enthusiast', paywall: 'none', reach: 56, speed: 80,
    about: 'A high-volume film and television site founded in 2005, now part of Valnet. News, interviews and lists at pace.',
    site: 'collider.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'screenrant', name: 'Screen Rant', shortName: 'Screen Rant', kind: 'consumer',
    founded: 2003, owner: 'Valnet',
    countryId: 'ca', city: 'Montreal', cadence: 'continuous',
    beats: ['development', 'casting', 'television', 'streaming'],
    register: 'enthusiast', paywall: 'none', reach: 58, speed: 86,
    about: 'One of the largest film and television sites by audience, founded in 2003 and now part of Valnet. Franchise coverage, explainers and news.',
    site: 'screenrant.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'the-playlist', name: 'The Playlist', shortName: 'The Playlist', kind: 'consumer',
    founded: 2006,
    countryId: 'us', city: 'New York', cadence: 'continuous',
    beats: ['criticism', 'festivals', 'development', 'awards'],
    register: 'critical', paywall: 'none', reach: 34, speed: 66,
    about: 'A film site started in 2006, covering festivals, independent film and the arthouse end of the studio slate.',
    site: 'theplaylist.net', bylineStyle: 'named',
  },
  {
    ...base, id: 'av-club', name: 'The A.V. Club', shortName: 'The A.V. Club', kind: 'consumer',
    founded: 1993,
    countryId: 'us', city: 'Chicago', cadence: 'continuous',
    beats: ['criticism', 'television', 'casting'],
    register: 'critical', paywall: 'none', reach: 44, speed: 62,
    about: 'Begun in 1993 as the section of The Onion that was not satire, and since then a criticism site in its own right, known for its letter-graded reviews and television recaps.',
    site: 'avclub.com', bylineStyle: 'named',
  },

  // --- Aggregators and counters -------------------------------------------
  {
    ...base, id: 'rotten-tomatoes', name: 'Rotten Tomatoes', shortName: 'Rotten Tomatoes', kind: 'aggregator',
    founded: 1998, foundedBy: 'Senh Duong', owner: 'Fandango Media',
    countryId: 'us', city: 'Los Angeles', cadence: 'continuous',
    beats: ['criticism', 'boxoffice'],
    register: 'aggregate', paywall: 'none', reach: 88, speed: 90,
    about: 'Started in 1998 by Senh Duong and named after the tomato thrown at a bad performance. It sorts critics’ reviews into fresh and rotten and publishes the percentage that were fresh, which is not an average score and is often read as one.',
    site: 'rottentomatoes.com', bylineStyle: 'none',
  },
  {
    ...base, id: 'metacritic', name: 'Metacritic', shortName: 'Metacritic', kind: 'aggregator',
    founded: 2001, owner: 'Fandango Media',
    countryId: 'us', city: 'Los Angeles', cadence: 'continuous',
    beats: ['criticism'],
    register: 'aggregate', paywall: 'none', reach: 72, speed: 86,
    about: 'Founded in 2001. It converts each review to a number, weights them by publication and publishes a weighted average out of a hundred, which is a different measurement from a fresh percentage.',
    site: 'metacritic.com', bylineStyle: 'none',
  },
  {
    ...base, id: 'box-office-mojo', name: 'Box Office Mojo', shortName: 'Box Office Mojo', kind: 'aggregator',
    founded: 1998, foundedBy: 'Brandon Gray', owner: 'IMDb',
    countryId: 'us', city: 'Seattle', cadence: 'daily',
    beats: ['boxoffice'],
    register: 'aggregate', paywall: 'none', reach: 76, speed: 92,
    about: 'A box office reporting site founded in 1998 and bought by IMDb in 2008. Daily and weekend grosses, theatre counts and running totals.',
    site: 'boxofficemojo.com', bylineStyle: 'none',
  },
  {
    ...base, id: 'the-numbers', name: 'The Numbers', shortName: 'The Numbers', kind: 'aggregator',
    founded: 1997, owner: 'Nash Information Services',
    countryId: 'us', city: 'Los Angeles', cadence: 'daily',
    beats: ['boxoffice', 'business'],
    register: 'aggregate', paywall: 'none', reach: 52, speed: 88,
    about: 'A box office and film financial data service running since 1997, tracking budgets, grosses and home entertainment alongside the theatrical run.',
    site: 'the-numbers.com', bylineStyle: 'none',
  },
  {
    ...base, id: 'letterboxd', name: 'Letterboxd', shortName: 'Letterboxd', kind: 'aggregator',
    founded: 2011, foundedBy: 'Matthew Buchanan and Karl von Randow',
    countryId: 'nz', city: 'Auckland', cadence: 'continuous',
    beats: ['criticism'],
    register: 'aggregate', paywall: 'none', reach: 66, speed: 78,
    about: 'A social network for film diaries, launched from Auckland in 2011. Its five-star average is an audience figure rather than a critical one, and the difference matters.',
    site: 'letterboxd.com', bylineStyle: 'none',
  },

  // --- Newspapers ----------------------------------------------------------
  {
    ...base, id: 'nyt', name: 'The New York Times', shortName: 'The Times', kind: 'newspaper',
    founded: 1851, owner: 'The New York Times Company',
    countryId: 'us', city: 'New York', cadence: 'daily',
    beats: ['criticism', 'business', 'labour', 'awards', 'television'],
    register: 'balanced', paywall: 'hard', reach: 90, speed: 60,
    about: 'Publishing since 1851. Its culture desk reviews wide releases and independent films alike, and its media desk covers the companies that own the studios.',
    site: 'nytimes.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'latimes', name: 'The Los Angeles Times', shortName: 'The L.A. Times', kind: 'newspaper',
    founded: 1881, owner: 'Nant Capital',
    countryId: 'us', city: 'Los Angeles', cadence: 'daily',
    beats: ['criticism', 'business', 'labour', 'awards', 'development'],
    register: 'balanced', paywall: 'hard', reach: 74, speed: 64,
    about: 'The paper of the city the industry is in, publishing since 1881. Its entertainment coverage is local news as much as culture writing.',
    site: 'latimes.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'guardian', name: 'The Guardian', shortName: 'The Guardian', kind: 'newspaper',
    founded: 1821, owner: 'Guardian Media Group',
    countryId: 'uk', city: 'London', cadence: 'daily',
    beats: ['criticism', 'festivals', 'business', 'labour', 'international'],
    register: 'critical', paywall: 'none', reach: 80, speed: 66,
    about: 'Founded in Manchester in 1821 and owned by the Scott Trust, which exists to keep it independent. Its film desk reviews on a five-star scale and covers the festivals in force.',
    site: 'theguardian.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'wsj', name: 'The Wall Street Journal', shortName: 'The Journal', kind: 'newspaper',
    founded: 1889, owner: 'News Corp',
    countryId: 'us', city: 'New York', cadence: 'daily',
    beats: ['business', 'streaming', 'labour'],
    register: 'business', paywall: 'hard', reach: 78, speed: 62,
    about: 'A business paper publishing since 1889. It covers the studios as public companies: earnings, subscriber numbers and the strategy behind a slate.',
    site: 'wsj.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'ft', name: 'The Financial Times', shortName: 'The FT', kind: 'newspaper',
    founded: 1888, owner: 'Nikkei',
    countryId: 'uk', city: 'London', cadence: 'daily',
    beats: ['business', 'streaming', 'international'],
    register: 'business', paywall: 'hard', reach: 70, speed: 58,
    about: 'Publishing on its salmon-pink paper since 1888 and owned by Nikkei since 2015. It covers the media companies as investments.',
    site: 'ft.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'washington-post', name: 'The Washington Post', shortName: 'The Post', kind: 'newspaper',
    founded: 1877, owner: 'Nash Holdings',
    countryId: 'us', city: 'Washington', cadence: 'daily',
    beats: ['criticism', 'business', 'labour'],
    register: 'balanced', paywall: 'hard', reach: 72, speed: 60,
    about: 'Publishing since 1877 and owned since 2013 by Nash Holdings, the company of Jeff Bezos. Its style section reviews and its business desk covers the industry.',
    site: 'washingtonpost.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'le-monde', name: 'Le Monde', shortName: 'Le Monde', kind: 'newspaper',
    founded: 1944,
    countryId: 'fr', city: 'Paris', cadence: 'daily',
    beats: ['criticism', 'festivals', 'international'],
    register: 'essay', paywall: 'hard', reach: 62, speed: 52,
    about: 'Founded in Paris in 1944 at the request of Charles de Gaulle. Its film criticism carries weight across the francophone world, particularly at Cannes.',
    site: 'lemonde.fr', bylineStyle: 'named',
  },

  // --- Wires ---------------------------------------------------------------
  {
    ...base, id: 'reuters', name: 'Reuters', shortName: 'Reuters', kind: 'wire',
    founded: 1851, foundedBy: 'Paul Julius Reuter', owner: 'Thomson Reuters',
    countryId: 'uk', city: 'London', cadence: 'continuous',
    beats: ['business', 'labour', 'boxoffice', 'international'],
    register: 'wire', paywall: 'none', reach: 86, speed: 94,
    about: 'A news agency founded in London in 1851, originally carrying stock prices by pigeon. It reports the industry as business news for other outlets to run.',
    site: 'reuters.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'ap', name: 'The Associated Press', shortName: 'The AP', kind: 'wire',
    founded: 1846,
    countryId: 'us', city: 'New York', cadence: 'continuous',
    beats: ['business', 'labour', 'boxoffice', 'awards', 'criticism'],
    register: 'wire', paywall: 'none', reach: 88, speed: 93,
    about: 'A not-for-profit news cooperative founded in 1846 and owned by the American news organisations that use it. Its film writing runs in hundreds of papers that have no film desk of their own.',
    site: 'apnews.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'afp', name: 'Agence France-Presse', shortName: 'AFP', kind: 'wire',
    founded: 1944,
    countryId: 'fr', city: 'Paris', cadence: 'continuous',
    beats: ['international', 'festivals', 'business', 'awards'],
    register: 'wire', paywall: 'none', reach: 72, speed: 90,
    about: 'A French news agency whose lineage runs to Havas in 1835 and which took its present form in 1944. It files from the festivals in several languages at once.',
    site: 'afp.com', bylineStyle: 'named',
  },
  {
    ...base, id: 'bloomberg', name: 'Bloomberg', shortName: 'Bloomberg', kind: 'wire',
    founded: 1990, owner: 'Bloomberg L.P.',
    countryId: 'us', city: 'New York', cadence: 'continuous',
    beats: ['business', 'streaming', 'labour'],
    register: 'business', paywall: 'metered', reach: 82, speed: 88,
    about: 'The news arm of the financial data company, founded in 1990. It covers the studios the way it covers any listed company, and often gets there first on a deal.',
    site: 'bloomberg.com', bylineStyle: 'named',
  },
];

export const OUTLETS = new Registry<Outlet>('outlets', OUTLET_SEEDS);

/** Everyone who covers a beat, strongest reach first. */
export function outletsOnBeat(beat: Beat): Outlet[] {
  return OUTLETS.all().filter((outlet) => outlet.beats.includes(beat))
    .sort((a, b) => b.reach - a.reach);
}

/** Everyone published in a country. */
export function outletsIn(countryId: string): Outlet[] {
  return OUTLETS.all().filter((outlet) => outlet.countryId === countryId)
    .sort((a, b) => b.reach - a.reach);
}

/** Every register that is actually in use, so the UI never lists an empty one. */
export function registersInUse(): Register[] {
  return [...new Set(OUTLETS.all().map((outlet) => outlet.register))];
}
