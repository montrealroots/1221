/**
 * SLATE — the companies that make the work, and the people who run them.
 *
 * Real companies, real ownership, real names. Everything here is public
 * record: who owns whom, who runs what, and which labels sit under which roof.
 * None of it is invented and none of it is a claim about anybody's private
 * business.
 *
 * The order is by how much work each puts out — the thing that decides how
 * often an actor or an actress would ever be in a room with them — rather than
 * by revenue or by prestige, which rank them differently. The order lives in
 * the order of the list. No number is attached to a company, because a number
 * would read as a score, and this is not one.
 *
 * Ownership is the fact, not a judgement. A company here is one of three
 * things: owned by its shareholders and traded on an exchange, held privately,
 * or a subsidiary of somebody bigger. "Independent" is deliberately not a word
 * this file uses — it means one thing on a balance sheet and a different thing
 * on a marquee, and Disney would qualify under the first reading, which is not
 * what anybody means by it.
 *
 * Leadership in this industry changes constantly, so the list carries the date
 * it was checked and says so on the page. A name here is where somebody was,
 * not a promise about where they are.
 */

import { GENRE_BY_ID, type Interest } from '@/engine/content/interests';
import { CITIES, type City } from '@/engine/content/geography';

export const STUDIO_NOTE =
  'The companies, who owns them and who runs them are public record. The order is by how much '
  + 'work each one puts out, because that is what decides how often you would ever be in a room '
  + 'with them; ranked by revenue or by prestige they come out in a different order. Open one to '
  + 'see who is in the chair. Nothing here is invented.';

export const CHECKED_ON = 'September 2026';

export const CHURN_NOTE =
  'Leadership changes often and quietly. Disney, Paramount and Sony all changed hands at the top '
  + 'within the last eighteen months. Treat a name as where somebody was when this was checked.';

/** Where a company sits: one of the eight that make at scale, or a label. */
export type StudioTier = 'major' | 'label';

/**
 * How a company is owned.
 *
 * Three states, and they are exclusive. `public` means shares trade on an
 * exchange and it answers to no parent company. `private` means it does not
 * trade and it answers to no parent company. `subsidiary` means somebody else
 * owns it, and `parent` names them.
 */
export type Ownership = 'public' | 'private' | 'subsidiary';

export const OWNERSHIP_LABEL: Readonly<Record<Ownership, string>> = {
  public: 'Publicly Traded',
  private: 'Privately Held',
  subsidiary: 'Subsidiary',
};

/**
 * The shape of a thing a company makes. A company that makes no television is
 * never going to be the one that casts a series regular, however big it is.
 */
export type Format = 'feature' | 'series' | 'limited' | 'animation' | 'documentary' | 'unscripted';

export const FORMAT_LABEL: Readonly<Record<Format, string>> = {
  feature: 'Feature Films',
  series: 'Television Series',
  limited: 'Limited Series',
  animation: 'Animation',
  documentary: 'Documentary',
  unscripted: 'Unscripted',
};

/** The money a thing is made for, which decides the size of what is in it. */
export type BudgetBand = 'tentpole' | 'studio' | 'mid' | 'low' | 'micro';

export const BUDGET_LABEL: Readonly<Record<BudgetBand, string>> = {
  tentpole: 'Tentpole',
  studio: 'Studio',
  mid: 'Mid-Budget',
  low: 'Low-Budget',
  micro: 'Micro-Budget',
};

/**
 * How readily an unknown gets a speaking part.
 *
 * The single fact that decides whether somebody with no credits has a route in
 * at all, and the one thing the rest of this file could not answer. It is not
 * the same axis as budget: Blumhouse is cheap and casts unknowns because the
 * economics need it, and Annapurna is cheap and casts movie stars because
 * auteurs bring them.
 */
export type NewFaces = 'discovers' | 'open' | 'guarded';

export const NEW_FACES_LABEL: Readonly<Record<NewFaces, string>> = {
  discovers: 'Casts Unknowns',
  open: 'Open To New Faces',
  guarded: 'Casts On Name',
};

export const NEW_FACES_NOTE: Readonly<Record<NewFaces, string>> = {
  discovers: 'The model runs on people nobody has heard of. A first credit here can be a lead.',
  open: 'Casts unknowns regularly, usually through a wide search for one particular part.',
  guarded: 'Speaking parts go to people with a credit list. An unknown gets background or a day.',
};

/** How often there is anything to be cast in at all. */
export type Volume = 'vast' | 'high' | 'steady' | 'selective' | 'rare';

export const VOLUME_LABEL: Readonly<Record<Volume, string>> = {
  vast: 'Vast',
  high: 'High',
  steady: 'Steady',
  selective: 'Selective',
  rare: 'Rare',
};

export const VOLUME_NOTE: Readonly<Record<Volume, string>> = {
  vast: 'More scripted titles a year than anybody else on the list.',
  high: 'A full slate every year, and it fills out.',
  steady: 'A handful a year, and they arrive.',
  selective: 'Few, and every one of them is a decision somebody made.',
  rare: 'It moves when it has found the one thing worth moving for.',
};

/**
 * The SAG-AFTRA agreement a production works under, which is set by its budget
 * rather than by who is making it.
 *
 * All eighteen of these are signatories, so scale applies to all of them; what
 * differs is which schedule of minimums. The two low tiers are here because
 * they are real and a smaller production would reach them — none of these
 * eighteen works that far down, and a test says which ones they do reach.
 */
export type Agreement = 'theatrical' | 'low_budget' | 'modified_low' | 'ultra_low';

export const AGREEMENT_LABEL: Readonly<Record<Agreement, string>> = {
  theatrical: 'Basic Theatrical And Television',
  low_budget: 'Low Budget Agreement',
  modified_low: 'Modified Low Budget Agreement',
  ultra_low: 'Ultra Low Budget Agreement',
};

/** What a day is worth at the bottom of each agreement, before anybody negotiates. */
export interface Scale {
  /** A day as an extra, which is where somebody with no credits starts. */
  background: number;
  /** A day performer: on the call sheet, with lines. */
  day: number;
  /** A weekly performer, which is what a run of days becomes. */
  week: number;
}

export const SCALE: Readonly<Record<Agreement, Scale>> = {
  theatrical: { background: 210, day: 1_200, week: 4_200 },
  low_budget: { background: 190, day: 630, week: 2_200 },
  modified_low: { background: 150, day: 430, week: 1_500 },
  ultra_low: { background: 130, day: 260, week: 940 },
};

/** Which agreement a production at each budget falls under. */
export const AGREEMENT_FOR: Readonly<Record<BudgetBand, Agreement>> = {
  tentpole: 'theatrical',
  studio: 'theatrical',
  mid: 'theatrical',
  low: 'theatrical',
  micro: 'low_budget',
};

export const UNION_NOTE =
  'All eighteen are SAG-AFTRA signatories, so every one of them pays at least scale. Which '
  + 'schedule of minimums applies is set by the budget of the production, not by the company.';

export const SCALE_NOTE =
  'Rounded from the published minimums as of the date below; the exact figure moves with each '
  + 'contract. Scale is the floor and not the price. Anybody with leverage is negotiated above '
  + 'it, and the distance between the two is most of what a career turns out to be.';

export interface StudioFigure {
  name: string;
  role: string;
}

export interface Studio {
  id: string;
  tier: StudioTier;
  /** The full name it trades under. */
  name: string;
  /** The production labels beneath it, where it has them. */
  labels: readonly string[];
  ownership: Ownership;
  /** The company that owns it. Set on a subsidiary and on nothing else. */
  parent?: string;
  /** Where its shares trade, on the ones that trade. */
  ticker?: string;
  /** Who holds control, where one party does despite the shares being public. */
  control?: string;
  /** The people who run it. */
  figures: readonly StudioFigure[];
  /** Who oversees casting, where SLATE carries a name. */
  casting?: readonly StudioFigure[];
  about: string;
  /** What it makes, in the shapes it makes them. */
  formats: readonly Format[];
  /** The money it works at, biggest first. */
  budgets: readonly BudgetBand[];
  /**
   * Roughly how many scripted titles a year — films and series together.
   *
   * A rounded figure, and the band it falls into is derived from it rather
   * than stored beside it, so the two can never come to disagree.
   */
  titlesAYear: number;
  /**
   * The genres it really works in, by the ids in FILM_GENRES. Joined rather
   * than written out, so that a company and a performer are talking about the
   * same list of genres and nothing has to be matched by name.
   *
   * Named `worksIn` and not `genres`: a person's `genres` are their taste, and
   * only `core/taste.ts` may read those. A company working in horror is a
   * different fact about a different thing, and the two should not look alike
   * to somebody reading the code or to the checker that guards the door.
   */
  worksIn: readonly string[];
  /** What it is known for making, in a line. */
  specialty: string;
  /** A few things it made that somebody would recognize by name. */
  knownFor: readonly string[];
  /** How readily it puts somebody with no credits on a call sheet. */
  newFaces: NewFaces;
  /**
   * Where it actually shoots, by the city ids in the gazetteer. Joined the
   * same way the genres are, so the distance from wherever the player is
   * standing to wherever the work is is a real number rather than a mood.
   */
  shootsIn: readonly string[];
}

const f = (name: string, role: string): StudioFigure => ({ name, role });

export const STUDIOS: readonly Studio[] = [
  {
    id: 'disney', tier: 'major', name: 'The Walt Disney Company',
    labels: ['Walt Disney Pictures', 'Marvel Studios', 'Pixar Animation Studios', 'Lucasfilm Ltd.', '20th Century Studios'],
    ownership: 'public', ticker: 'NYSE: DIS',
    figures: [
      f('Josh D’Amaro', 'Chief Executive Officer'),
      f('Dana Walden', 'President and Chief Creative Officer'),
      f('Alan Bergman', 'Walt Disney Studios'),
      f('Kevin Feige', 'Marvel Studios'),
      f('Pete Docter', 'Pixar, Chief Creative Officer'),
    ],
    casting: [f('Jason B. Stamey', 'Casting, Hulu Originals')],
    about: 'The largest slate there is, and the one with the most franchises attached to it.',
    formats: ['feature', 'series', 'limited', 'animation', 'documentary'],
    budgets: ['tentpole', 'studio'],
    worksIn: ['superhero', 'animated', 'family', 'childrens', 'fantasy', 'fairy_tale',
      'adventure', 'science_fiction', 'space_opera', 'action', 'musical', 'epic'],
    specialty: 'Superhero pictures, animated features and the fairy tales they came from, made for a family to watch together.',
    knownFor: ['Avengers: Endgame', 'The Mandalorian', 'Inside Out 2', 'Moana'],
    newFaces: 'open',
    titlesAYear: 35,
    shootsIn: ['us-ca-burbank', 'us-ca-losangeles', 'us-ga-atlanta', 'uk-eng-london',
      'au-nsw-sydney'],
  },
  {
    id: 'netflix', tier: 'major', name: 'Netflix, Inc.',
    labels: ['Netflix Film', 'Netflix Series'],
    ownership: 'public', ticker: 'NASDAQ: NFLX',
    figures: [
      f('Ted Sarandos', 'Co-Chief Executive Officer'),
      f('Greg Peters', 'Co-Chief Executive Officer'),
      f('Dan Lin', 'Film'),
      f('Bela Bajaria', 'Chief Content Officer'),
    ],
    casting: [f('Cesar A. Rocha', 'Head of Series Casting')],
    about: 'The biggest scripted output of anybody, and the widest reach to put it in front of.',
    formats: ['feature', 'series', 'limited', 'animation', 'documentary', 'unscripted'],
    budgets: ['tentpole', 'studio', 'mid', 'low'],
    worksIn: ['thriller', 'drama', 'action', 'romantic_comedy', 'comedy', 'crime', 'true_crime',
      'documentary', 'science_fiction', 'fantasy', 'horror', 'teen', 'mystery', 'anime'],
    specialty: 'No house style at all, on purpose: thrillers, romantic comedies, true crime and anime, because a subscription has to hold everybody.',
    knownFor: ['Stranger Things', 'Squid Game', 'The Crown', 'Glass Onion'],
    newFaces: 'open',
    titlesAYear: 120,
    shootsIn: ['us-ca-losangeles', 'us-ga-atlanta', 'uk-eng-london', 'ca-on-toronto',
      'es-md-madrid', 'kr-11-seoul'],
  },
  {
    id: 'wbd', tier: 'major', name: 'Warner Bros. Discovery, Inc.',
    labels: ['Warner Bros. Pictures', 'Warner Bros. Television', 'New Line Cinema', 'HBO'],
    ownership: 'public', ticker: 'NASDAQ: WBD',
    figures: [
      f('David Zaslav', 'Chief Executive Officer'),
      f('Michael De Luca', 'Warner Bros. Motion Picture Group'),
      f('Pam Abdy', 'Warner Bros. Motion Picture Group'),
      f('Casey Bloys', 'HBO'),
      f('Channing Dungey', 'Warner Bros. Television'),
    ],
    casting: [f('Mele Nagler', 'Casting, Warner Bros. Television')],
    about: 'Under an agreed acquisition by Paramount Skydance that has not closed.',
    formats: ['feature', 'series', 'limited', 'animation', 'documentary'],
    budgets: ['tentpole', 'studio', 'mid'],
    worksIn: ['superhero', 'action', 'fantasy', 'epic', 'horror', 'supernatural', 'crime',
      'drama', 'historical_drama', 'thriller', 'comedy', 'animated'],
    specialty: 'DC and tentpole action on one side, HBO’s prestige drama on the other, and New Line’s horror between them.',
    knownFor: ['Barbie', 'The Batman', 'Succession', 'House Of The Dragon'],
    newFaces: 'open',
    titlesAYear: 55,
    shootsIn: ['us-ca-burbank', 'us-ca-losangeles', 'us-ny-newyork', 'uk-eng-london',
      'us-ga-atlanta'],
  },
  {
    id: 'nbcu', tier: 'major', name: 'NBCUniversal Media, LLC',
    labels: ['Universal Pictures', 'Universal Television'],
    ownership: 'subsidiary', parent: 'Comcast Corporation',
    figures: [
      f('Donna Langley', 'Chairman, Entertainment and Studios'),
      f('Peter Cramer', 'Universal Pictures'),
      f('Erin Underhill', 'Universal Television'),
    ],
    casting: [f('Grace Wu', 'Casting, Television and Streaming')],
    about: 'A film studio and a television studio of the same size, under a cable parent.',
    formats: ['feature', 'series', 'limited', 'animation', 'unscripted'],
    budgets: ['tentpole', 'studio', 'mid'],
    worksIn: ['horror', 'monster_movie', 'creature_feature', 'action', 'adventure', 'comedy',
      'animated', 'family', 'thriller', 'drama', 'musical', 'police_procedural',
      'medical_drama'],
    specialty: 'Blockbuster action and animation, a horror line that keeps paying for itself, and the network procedurals.',
    knownFor: ['Oppenheimer', 'Wicked', 'Jurassic World', 'The Office'],
    newFaces: 'open',
    titlesAYear: 50,
    shootsIn: ['us-ca-losangeles', 'us-ny-newyork', 'us-ga-atlanta', 'uk-eng-london'],
  },
  {
    id: 'amazon-mgm', tier: 'major', name: 'Amazon MGM Studios',
    labels: ['Metro-Goldwyn-Mayer', 'Prime Video'],
    ownership: 'subsidiary', parent: 'Amazon.com, Inc.',
    figures: [
      f('Mike Hopkins', 'Prime Video and Amazon MGM Studios'),
      f('Courtenay Valenti', 'Film'),
      f('Vernon Sanders', 'Television'),
    ],
    about: 'A century-old studio bought whole and pointed at a streaming service.',
    formats: ['feature', 'series', 'limited', 'documentary', 'unscripted'],
    budgets: ['tentpole', 'studio', 'mid'],
    worksIn: ['action', 'espionage', 'thriller', 'fantasy', 'science_fiction', 'superhero',
      'drama', 'comedy', 'romance', 'crime'],
    specialty: 'Spy franchises, superheroes and sword-and-sorcery at tentpole size, built to hold a subscription rather than a weekend.',
    knownFor: ['Reacher', 'The Boys', 'The Rings Of Power', 'No Time To Die'],
    newFaces: 'open',
    titlesAYear: 35,
    shootsIn: ['us-ca-losangeles', 'uk-eng-london', 'us-ga-atlanta', 'ca-bc-vancouver'],
  },
  {
    id: 'sony', tier: 'major', name: 'Sony Pictures Entertainment Inc.',
    labels: ['Columbia Pictures', 'TriStar Pictures', 'Sony Pictures Television'],
    ownership: 'subsidiary', parent: 'Sony Group Corporation',
    figures: [
      f('Ravi Ahuja', 'Chairman and Chief Executive Officer'),
      f('Tom Rothman', 'Motion Picture Group'),
      f('Katherine Pope', 'Sony Pictures Television'),
    ],
    about: 'The one major with no streaming service of its own, so it sells to all of them.',
    formats: ['feature', 'series', 'limited', 'animation'],
    budgets: ['tentpole', 'studio', 'mid'],
    worksIn: ['superhero', 'action', 'animated', 'anime', 'horror', 'comedy', 'drama',
      'thriller', 'science_fiction', 'biographical'],
    specialty: 'Superheroes, animation with a look of its own, and the anime nobody else releases at this size.',
    knownFor: ['Spider-Man: No Way Home', 'Into The Spider-Verse', 'Breaking Bad', 'Ghostbusters'],
    newFaces: 'guarded',
    titlesAYear: 30,
    shootsIn: ['us-ca-losangeles', 'us-ga-atlanta', 'uk-eng-london', 'us-ny-newyork'],
  },
  {
    id: 'paramount', tier: 'major', name: 'Paramount Skydance Corporation',
    labels: ['Paramount Pictures'],
    ownership: 'public', ticker: 'NASDAQ: PSKY',
    control: 'The Ellison family holds the voting stock.',
    figures: [
      f('David Ellison', 'Chairman and Chief Executive Officer'),
      f('Josh Greenstein', 'Studios'),
      f('Dana Goldberg', 'Studios'),
      f('Cindy Holland', 'Streaming'),
      f('George Cheeks', 'Television Media'),
    ],
    about: 'Family controlled after the Skydance merger, and mid-acquisition of Warner Bros.',
    formats: ['feature', 'series', 'limited', 'animation', 'unscripted'],
    budgets: ['tentpole', 'studio', 'mid'],
    worksIn: ['action', 'military', 'war', 'thriller', 'espionage', 'western', 'drama', 'crime',
      'comedy', 'animated', 'family', 'science_fiction'],
    specialty: 'Action franchises at scale and the modern westerns, with the animation brands running underneath them.',
    knownFor: ['Top Gun: Maverick', 'Mission: Impossible', 'Yellowstone', 'SpongeBob SquarePants'],
    newFaces: 'guarded',
    titlesAYear: 30,
    shootsIn: ['us-ca-losangeles', 'us-ny-newyork', 'uk-eng-london', 'it-laz-rome'],
  },
  {
    id: 'apple', tier: 'major', name: 'Apple Studios',
    labels: ['Apple TV'],
    ownership: 'subsidiary', parent: 'Apple Inc.',
    figures: [
      f('Eddy Cue', 'Senior Vice President, Services'),
      f('Zack Van Amburg', 'Worldwide Video'),
      f('Jamie Erlicht', 'Worldwide Video'),
      f('Matt Dentler', 'Film'),
    ],
    about: 'The smallest slate of the eight and the most awarded per thing made.',
    formats: ['feature', 'series', 'limited', 'documentary'],
    budgets: ['tentpole', 'studio', 'mid'],
    worksIn: ['drama', 'science_fiction', 'thriller', 'espionage', 'comedy', 'historical_drama',
      'biographical', 'mystery', 'documentary'],
    specialty: 'Prestige drama and hard science fiction, made expensively and slowly, for directors who want the last word.',
    knownFor: ['Ted Lasso', 'Severance', 'CODA', 'Killers Of The Flower Moon'],
    newFaces: 'guarded',
    titlesAYear: 18,
    shootsIn: ['us-ca-losangeles', 'us-ny-newyork', 'uk-eng-london'],
  },
  {
    id: 'blumhouse', tier: 'label', name: 'Blumhouse Productions, LLC',
    labels: ['Atomic Monster'],
    ownership: 'private',
    figures: [f('Jason Blum', 'Founder and Chief Executive Officer'), f('James Wan', 'Atomic Monster')],
    about: 'Horror at a budget small enough that a miss costs nothing and a hit pays for ten.',
    formats: ['feature', 'series'],
    budgets: ['low', 'micro'],
    worksIn: ['horror', 'psychological_horror', 'supernatural', 'occult', 'slasher',
      'found_footage', 'body_horror', 'creature_feature', 'horror_comedy', 'thriller',
      'survival'],
    specialty: 'Supernatural, slasher and found-footage horror, several a year, mostly with unknown faces in the leads.',
    knownFor: ['Get Out', 'Paranormal Activity', 'The Purge', 'M3GAN'],
    newFaces: 'discovers',
    titlesAYear: 10,
    shootsIn: ['us-ca-losangeles', 'us-ga-atlanta', 'us-la-neworleans'],
  },
  {
    id: 'a24', tier: 'label', name: 'A24 Films LLC',
    labels: [],
    ownership: 'private',
    figures: [f('Daniel Katz', 'Co-Founder'), f('David Fenkel', 'Co-Founder')],
    about: 'Few films, made deliberately, and a name that means something to an audience.',
    formats: ['feature', 'series', 'limited', 'documentary'],
    budgets: ['mid', 'low'],
    worksIn: ['art_house', 'drama', 'horror', 'psychological_horror', 'folk_horror',
      'coming_of_age', 'black_comedy', 'absurdist', 'surrealist', 'queer_cinema',
      'science_fiction'],
    specialty: 'Elevated horror, coming-of-age and the strange middle between them: the film a first-time director gets to make.',
    knownFor: ['Everything Everywhere All At Once', 'Lady Bird', 'Hereditary', 'Midsommar'],
    newFaces: 'discovers',
    titlesAYear: 20,
    shootsIn: ['us-ny-newyork', 'us-ca-losangeles', 'us-nm-santafe'],
  },
  {
    id: 'legendary', tier: 'label', name: 'Legendary Entertainment, LLC',
    labels: ['Legendary Pictures'],
    ownership: 'subsidiary', parent: 'Apollo Global Management',
    figures: [f('Joshua Grode', 'Chief Executive Officer'), f('Mary Parent', 'Vice Chairman, Worldwide Production')],
    about: 'Big swings on scale: monsters, deserts and things that need a real budget.',
    formats: ['feature', 'series'],
    budgets: ['tentpole', 'studio'],
    worksIn: ['kaiju', 'monster_movie', 'creature_feature', 'science_fiction', 'space_opera',
      'fantasy', 'epic', 'action', 'adventure', 'war'],
    specialty: 'Giant-monster pictures and science-fiction epics, co-financed with a major so that one failure cannot end it.',
    knownFor: ['Dune', 'Godzilla', 'Pacific Rim', 'The Dark Knight'],
    newFaces: 'guarded',
    titlesAYear: 4,
    shootsIn: ['us-ca-losangeles', 'us-ga-atlanta', 'au-qld-goldcoast'],
  },
  {
    id: 'searchlight', tier: 'label', name: 'Searchlight Pictures',
    labels: [],
    ownership: 'subsidiary', parent: 'The Walt Disney Company',
    figures: [f('Matthew Greenfield', 'President')],
    about: 'The awards arm of the biggest company there is, run at arm’s length from it.',
    formats: ['feature', 'limited', 'documentary'],
    budgets: ['mid', 'low'],
    worksIn: ['drama', 'black_comedy', 'biographical', 'period_drama', 'historical_drama',
      'art_house', 'coming_of_age', 'satire', 'romantic_drama', 'queer_cinema'],
    specialty: 'Character drama, black comedy and the biographical picture, at a budget that only has to clear a modest gross.',
    knownFor: ['Nomadland', 'The Shape Of Water', 'Poor Things', 'The Banshees Of Inisherin'],
    newFaces: 'open',
    titlesAYear: 8,
    shootsIn: ['us-ca-losangeles', 'us-ny-newyork', 'uk-eng-london', 'ie-lei-dublin'],
  },
  {
    id: 'focus', tier: 'label', name: 'Focus Features LLC',
    labels: [],
    ownership: 'subsidiary', parent: 'NBCUniversal Media, LLC',
    figures: [f('Peter Kujawski', 'Chairman')],
    about: 'Universal’s specialty label, and where its directors go to make the smaller thing.',
    formats: ['feature', 'documentary'],
    budgets: ['mid', 'low'],
    worksIn: ['drama', 'period_drama', 'historical_drama', 'biographical', 'romantic_drama',
      'art_house', 'coming_of_age', 'black_comedy', 'queer_cinema', 'horror'],
    specialty: 'Period drama, literary adaptation and the occasional horror, made for a festival first and a wide release after.',
    knownFor: ['Brokeback Mountain', 'Promising Young Woman', 'The Holdovers', 'Downton Abbey'],
    newFaces: 'open',
    titlesAYear: 10,
    shootsIn: ['us-ca-losangeles', 'us-ny-newyork', 'uk-eng-london'],
  },
  {
    id: 'neon', tier: 'label', name: 'Neon Rated, LLC',
    labels: [],
    ownership: 'private',
    figures: [f('Tom Quinn', 'Founder and Chief Executive Officer')],
    about: 'Buys and makes the film nobody else was going to, and keeps being right.',
    formats: ['feature', 'documentary'],
    budgets: ['low', 'micro'],
    worksIn: ['art_house', 'drama', 'horror', 'psychological_thriller', 'black_comedy',
      'satire', 'surrealist', 'documentary', 'coming_of_age', 'thriller'],
    specialty: 'Foreign-language drama, satire and horror bought out of festivals and pushed all the way to the Oscars.',
    knownFor: ['Parasite', 'Anatomy Of A Fall', 'I, Tonya', 'Longlegs'],
    newFaces: 'discovers',
    titlesAYear: 10,
    shootsIn: ['us-ny-newyork', 'us-ca-losangeles'],
  },
  {
    id: 'bad-robot', tier: 'label', name: 'Bad Robot Productions, LLC',
    labels: [],
    ownership: 'private',
    figures: [f('J.J. Abrams', 'Co-Chief Executive Officer'), f('Katie McGrath', 'Co-Chief Executive Officer')],
    about: 'A director’s company that makes television as seriously as it makes film.',
    formats: ['feature', 'series', 'limited'],
    budgets: ['tentpole', 'studio', 'mid'],
    worksIn: ['science_fiction', 'mystery', 'space_opera', 'action', 'adventure', 'thriller',
      'espionage', 'supernatural', 'drama'],
    specialty: 'Science fiction and mystery with a puzzle at the middle of it, built as readily for a season as for a running time.',
    knownFor: ['Lost', 'Alias', 'Star Trek', 'Westworld'],
    newFaces: 'open',
    titlesAYear: 5,
    shootsIn: ['us-ca-santamonica', 'us-ca-losangeles', 'ca-bc-vancouver'],
  },
  {
    id: 'plan-b', tier: 'label', name: 'Plan B Entertainment, Inc.',
    labels: [],
    ownership: 'subsidiary', parent: 'Mediawan',
    figures: [f('Brad Pitt', 'Principal'), f('Dede Gardner', 'Co-President'), f('Jeremy Kleiner', 'Co-President')],
    about: 'An actor’s production company that became a serious one, now French owned.',
    formats: ['feature', 'series', 'limited', 'documentary'],
    budgets: ['studio', 'mid', 'low'],
    worksIn: ['drama', 'historical_drama', 'biographical', 'social_realism', 'black_comedy',
      'satire', 'crime', 'war', 'period_drama', 'coming_of_age'],
    specialty: 'Historical drama and social realism about something that really happened, with the director picked before the script is bought.',
    knownFor: ['12 Years A Slave', 'Moonlight', 'Minari', 'The Big Short'],
    newFaces: 'open',
    titlesAYear: 6,
    shootsIn: ['us-ca-losangeles', 'us-la-neworleans', 'us-ny-newyork'],
  },
  {
    id: 'annapurna', tier: 'label', name: 'Annapurna Pictures, LLC',
    labels: [],
    ownership: 'private',
    figures: [f('Megan Ellison', 'Founder and Chief Executive Officer')],
    about: 'Backs directors other people have stopped backing, and takes the loss when it comes.',
    formats: ['feature', 'series', 'documentary'],
    budgets: ['studio', 'mid', 'low'],
    worksIn: ['drama', 'black_comedy', 'satire', 'crime', 'neo_noir', 'biographical',
      'historical_drama', 'thriller', 'art_house', 'science_fiction'],
    specialty: 'Auteur drama, satire and neo-noir at a real budget: the films a studio would develop for years and never make.',
    knownFor: ['Zero Dark Thirty', 'Her', 'Phantom Thread', 'Vice'],
    newFaces: 'guarded',
    titlesAYear: 3,
    shootsIn: ['us-ca-losangeles', 'us-ny-newyork'],
  },
  {
    id: 'lionsgate', tier: 'label', name: 'Lions Gate Entertainment Corp.',
    labels: ['Lionsgate Films', 'Lionsgate Television'],
    ownership: 'public', ticker: 'NYSE: LION',
    figures: [
      f('Jon Feltheimer', 'Chief Executive Officer'),
      f('Michael Burns', 'Vice Chairman'),
      f('Adam Fogelson', 'Motion Picture Group'),
      f('Kevin Beggs', 'Television'),
    ],
    about: 'A studio without a conglomerate behind it, which shows in what it green-lights.',
    formats: ['feature', 'series', 'limited', 'unscripted'],
    budgets: ['studio', 'mid', 'low'],
    worksIn: ['action', 'thriller', 'horror', 'dystopian', 'teen', 'revenge', 'martial_arts',
      'crime', 'drama', 'war', 'comedy'],
    specialty: 'Genre franchises at a mid-budget — action, thrillers and young-adult series — and television made for other people’s services.',
    knownFor: ['The Hunger Games', 'John Wick', 'Twilight', 'La La Land'],
    newFaces: 'open',
    titlesAYear: 25,
    shootsIn: ['us-ca-santamonica', 'us-ca-losangeles', 'us-ga-atlanta', 'ca-on-toronto'],
  },
];

export const STUDIO_BY_ID: Readonly<Record<string, Studio>> = Object.fromEntries(
  STUDIOS.map((one) => [one.id, one]),
);

/** The eight that make at scale, or the labels beneath and beside them. */
export function studiosInTier(tier: StudioTier): Studio[] {
  return STUDIOS.filter((one) => one.tier === tier);
}

/**
 * The one fact that sits beside the ownership word: where the shares trade, or
 * who the owner is. Private companies have neither, and get nothing.
 */
export function ownershipDetail(studio: Studio): string | undefined {
  return studio.ownership === 'subsidiary' ? studio.parent : studio.ticker;
}

/** Everybody named across every company, for anything that wants a person. */
export function everyFigure(): { studio: Studio; figure: StudioFigure }[] {
  return STUDIOS.flatMap((studio) => [
    ...studio.figures.map((figure) => ({ studio, figure })),
    ...(studio.casting ?? []).map((figure) => ({ studio, figure })),
  ]);
}

/** Everybody named at one company, the people first and casting after them. */
export function peopleAt(studio: Studio): readonly StudioFigure[] {
  return [...studio.figures, ...(studio.casting ?? [])];
}

/**
 * What a company works in, as the genres themselves.
 *
 * The ids are checked against FILM_GENRES rather than trusted: a genre renamed
 * on one side and not the other would otherwise leave a company quietly
 * working in nothing, and nothing about the page would look wrong.
 */
export function genresOf(studio: Studio): Interest[] {
  return studio.worksIn.map((id) => {
    const genre = GENRE_BY_ID[id];
    if (!genre) throw new Error(`${studio.name} names a genre that does not exist: ${id}`);
    return genre;
  });
}

/**
 * The band its output falls into.
 *
 * Derived rather than stored: a number and a word for the same fact, kept
 * side by side, is two things to update and one of them will be forgotten.
 */
export function volumeOf(studio: Studio): Volume {
  const n = studio.titlesAYear;
  if (n >= 50) return 'vast';
  if (n >= 20) return 'high';
  if (n >= 8) return 'steady';
  if (n >= 4) return 'selective';
  return 'rare';
}

/**
 * Where it shoots, as the cities themselves.
 *
 * Checked against the gazetteer rather than trusted, for the same reason the
 * genres are: a city renamed on one side would otherwise leave a company
 * shooting nowhere and nothing on the page would look wrong.
 */
export function citiesFor(studio: Studio): City[] {
  return studio.shootsIn.map((id) => {
    const city = CITIES.get(id);
    if (!city) throw new Error(`${studio.name} shoots in a city that does not exist: ${id}`);
    return city;
  });
}

/** Does it shoot where somebody is already standing? */
export function shootsWhere(studio: Studio, cityId: string): boolean {
  return studio.shootsIn.includes(cityId);
}

/** The agreements its budgets fall under, without repeats. */
export function agreementsFor(studio: Studio): Agreement[] {
  return [...new Set(studio.budgets.map((band) => AGREEMENT_FOR[band]))];
}

/** The least anybody is paid for a day here, before a word is negotiated. */
export function scaleFloor(studio: Studio): Scale {
  const rates = agreementsFor(studio).map((one) => SCALE[one]);
  return {
    background: Math.min(...rates.map((r) => r.background)),
    day: Math.min(...rates.map((r) => r.day)),
    week: Math.min(...rates.map((r) => r.week)),
  };
}

/** Who would make a thing in this genre. The join, run the other way. */
export function studiosWorkingIn(genreId: string): Studio[] {
  return STUDIOS.filter((one) => one.worksIn.includes(genreId));
}

/** Who makes this shape of thing at all — a company with no television in it
 *  is never the one casting a series regular, whatever its size. */
export function studiosMaking(format: Format): Studio[] {
  return STUDIOS.filter((one) => one.formats.includes(format));
}

/** Who shoots where somebody is. The join from the map back to the work. */
export function studiosShootingIn(cityId: string): Studio[] {
  return STUDIOS.filter((one) => one.shootsIn.includes(cityId));
}
