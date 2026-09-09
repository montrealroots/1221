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
  },
  {
    id: 'blumhouse', tier: 'label', name: 'Blumhouse Productions, LLC',
    labels: ['Atomic Monster'],
    ownership: 'private',
    figures: [f('Jason Blum', 'Founder and Chief Executive Officer'), f('James Wan', 'Atomic Monster')],
    about: 'Horror at a budget small enough that a miss costs nothing and a hit pays for ten.',
  },
  {
    id: 'a24', tier: 'label', name: 'A24 Films LLC',
    labels: [],
    ownership: 'private',
    figures: [f('Daniel Katz', 'Co-Founder'), f('David Fenkel', 'Co-Founder')],
    about: 'Few films, made deliberately, and a name that means something to an audience.',
  },
  {
    id: 'legendary', tier: 'label', name: 'Legendary Entertainment, LLC',
    labels: ['Legendary Pictures'],
    ownership: 'subsidiary', parent: 'Apollo Global Management',
    figures: [f('Joshua Grode', 'Chief Executive Officer'), f('Mary Parent', 'Vice Chairman, Worldwide Production')],
    about: 'Big swings on scale: monsters, deserts and things that need a real budget.',
  },
  {
    id: 'searchlight', tier: 'label', name: 'Searchlight Pictures',
    labels: [],
    ownership: 'subsidiary', parent: 'The Walt Disney Company',
    figures: [f('Matthew Greenfield', 'President')],
    about: 'The awards arm of the biggest company there is, run at arm’s length from it.',
  },
  {
    id: 'focus', tier: 'label', name: 'Focus Features LLC',
    labels: [],
    ownership: 'subsidiary', parent: 'NBCUniversal Media, LLC',
    figures: [f('Peter Kujawski', 'Chairman')],
    about: 'Universal’s specialty label, and where its directors go to make the smaller thing.',
  },
  {
    id: 'neon', tier: 'label', name: 'Neon Rated, LLC',
    labels: [],
    ownership: 'private',
    figures: [f('Tom Quinn', 'Founder and Chief Executive Officer')],
    about: 'Buys and makes the film nobody else was going to, and keeps being right.',
  },
  {
    id: 'bad-robot', tier: 'label', name: 'Bad Robot Productions, LLC',
    labels: [],
    ownership: 'private',
    figures: [f('J.J. Abrams', 'Co-Chief Executive Officer'), f('Katie McGrath', 'Co-Chief Executive Officer')],
    about: 'A director’s company that makes television as seriously as it makes film.',
  },
  {
    id: 'plan-b', tier: 'label', name: 'Plan B Entertainment, Inc.',
    labels: [],
    ownership: 'subsidiary', parent: 'Mediawan',
    figures: [f('Brad Pitt', 'Principal'), f('Dede Gardner', 'Co-President'), f('Jeremy Kleiner', 'Co-President')],
    about: 'An actor’s production company that became a serious one, now French owned.',
  },
  {
    id: 'annapurna', tier: 'label', name: 'Annapurna Pictures, LLC',
    labels: [],
    ownership: 'private',
    figures: [f('Megan Ellison', 'Founder and Chief Executive Officer')],
    about: 'Backs directors other people have stopped backing, and takes the loss when it comes.',
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
