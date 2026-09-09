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
 * by revenue or by prestige, which rank them differently.
 *
 * Leadership in this industry changes constantly, so the list carries the date
 * it was checked and says so on the page. A name here is where somebody was,
 * not a promise about where they are.
 */

export const STUDIO_NOTE =
  'The companies, who owns them and who runs them are public record. The order is by how much '
  + 'work each one puts out, because that is what decides how often you would ever be in a room '
  + 'with them; ranked by revenue or by prestige they come out in a different order. Nothing here '
  + 'is invented.';

export const CHECKED_ON = 'September 2026';

export const CHURN_NOTE =
  'Leadership changes often and quietly. Disney, Paramount and Sony all changed hands at the top '
  + 'within the last eighteen months. Treat a name as where somebody was when this was checked.';

/** Where a company sits: one of the eight that make at scale, or a label. */
export type StudioTier = 'major' | 'label';

export interface StudioFigure {
  name: string;
  role: string;
}

export interface Studio {
  id: string;
  /** Ranked by output. */
  rank: number;
  tier: StudioTier;
  /** The full name it trades under. */
  name: string;
  /** The production labels beneath it, where it has them. */
  labels: readonly string[];
  /** The company that owns it, where one does. */
  parent?: string;
  independent: boolean;
  /** The people who run it. */
  figures: readonly StudioFigure[];
  /** Who oversees casting, where SLATE carries a name. */
  casting?: readonly StudioFigure[];
  about: string;
}

const f = (name: string, role: string): StudioFigure => ({ name, role });

export const STUDIOS: readonly Studio[] = [
  {
    id: 'disney', rank: 1, tier: 'major', name: 'The Walt Disney Company',
    labels: ['Walt Disney Pictures', 'Marvel Studios', 'Pixar Animation Studios', 'Lucasfilm Ltd.', '20th Century Studios'],
    independent: true,
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
    id: 'netflix', rank: 2, tier: 'major', name: 'Netflix, Inc.',
    labels: ['Netflix Film', 'Netflix Series'],
    independent: true,
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
    id: 'wbd', rank: 3, tier: 'major', name: 'Warner Bros. Discovery, Inc.',
    labels: ['Warner Bros. Pictures', 'Warner Bros. Television', 'New Line Cinema', 'HBO'],
    independent: true,
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
    id: 'nbcu', rank: 4, tier: 'major', name: 'NBCUniversal Media, LLC',
    labels: ['Universal Pictures', 'Universal Television'],
    parent: 'Comcast Corporation', independent: false,
    figures: [
      f('Donna Langley', 'Chairman, Entertainment and Studios'),
      f('Peter Cramer', 'Universal Pictures'),
      f('Erin Underhill', 'Universal Television'),
    ],
    casting: [f('Grace Wu', 'Casting, Television and Streaming')],
    about: 'A film studio and a television studio of the same size, under a cable parent.',
  },
  {
    id: 'amazon-mgm', rank: 5, tier: 'major', name: 'Amazon MGM Studios',
    labels: ['Metro-Goldwyn-Mayer', 'Prime Video'],
    parent: 'Amazon.com, Inc.', independent: false,
    figures: [
      f('Mike Hopkins', 'Prime Video and Amazon MGM Studios'),
      f('Courtenay Valenti', 'Film'),
      f('Vernon Sanders', 'Television'),
    ],
    about: 'A century-old studio bought whole and pointed at a streaming service.',
  },
  {
    id: 'sony', rank: 6, tier: 'major', name: 'Sony Pictures Entertainment Inc.',
    labels: ['Columbia Pictures', 'TriStar Pictures', 'Sony Pictures Television'],
    parent: 'Sony Group Corporation', independent: false,
    figures: [
      f('Ravi Ahuja', 'Chairman and Chief Executive Officer'),
      f('Tom Rothman', 'Motion Picture Group'),
      f('Katherine Pope', 'Sony Pictures Television'),
    ],
    about: 'The one major with no streaming service of its own, so it sells to all of them.',
  },
  {
    id: 'paramount', rank: 7, tier: 'major', name: 'Paramount Skydance Corporation',
    labels: ['Paramount Pictures'],
    independent: true,
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
    id: 'apple', rank: 8, tier: 'major', name: 'Apple Studios',
    labels: ['Apple TV'],
    parent: 'Apple Inc.', independent: false,
    figures: [
      f('Eddy Cue', 'Senior Vice President, Services'),
      f('Zack Van Amburg', 'Worldwide Video'),
      f('Jamie Erlicht', 'Worldwide Video'),
      f('Matt Dentler', 'Film'),
    ],
    about: 'The smallest slate of the eight and the most awarded per thing made.',
  },
  {
    id: 'blumhouse', rank: 9, tier: 'label', name: 'Blumhouse Productions, LLC',
    labels: ['Atomic Monster'],
    independent: true,
    figures: [f('Jason Blum', 'Founder and Chief Executive Officer'), f('James Wan', 'Atomic Monster')],
    about: 'Horror at a budget small enough that a miss costs nothing and a hit pays for ten.',
  },
  {
    id: 'a24', rank: 10, tier: 'label', name: 'A24 Films LLC',
    labels: [],
    independent: true,
    figures: [f('Daniel Katz', 'Co-Founder'), f('David Fenkel', 'Co-Founder')],
    about: 'Few films, made deliberately, and a name that means something to an audience.',
  },
  {
    id: 'legendary', rank: 11, tier: 'label', name: 'Legendary Entertainment, LLC',
    labels: ['Legendary Pictures'],
    parent: 'Apollo Global Management', independent: false,
    figures: [f('Joshua Grode', 'Chief Executive Officer'), f('Mary Parent', 'Vice Chairman, Worldwide Production')],
    about: 'Big swings on scale: monsters, deserts and things that need a real budget.',
  },
  {
    id: 'searchlight', rank: 12, tier: 'label', name: 'Searchlight Pictures',
    labels: [],
    parent: 'The Walt Disney Company', independent: false,
    figures: [f('Matthew Greenfield', 'President')],
    about: 'The awards arm of the biggest company there is, run at arm’s length from it.',
  },
  {
    id: 'focus', rank: 13, tier: 'label', name: 'Focus Features LLC',
    labels: [],
    parent: 'NBCUniversal Media, LLC', independent: false,
    figures: [f('Peter Kujawski', 'Chairman')],
    about: 'Universal’s specialty label, and where its directors go to make the smaller thing.',
  },
  {
    id: 'neon', rank: 14, tier: 'label', name: 'Neon Rated, LLC',
    labels: [],
    independent: true,
    figures: [f('Tom Quinn', 'Founder and Chief Executive Officer')],
    about: 'Buys and makes the film nobody else was going to, and keeps being right.',
  },
  {
    id: 'bad-robot', rank: 15, tier: 'label', name: 'Bad Robot Productions, LLC',
    labels: [],
    independent: true,
    figures: [f('J.J. Abrams', 'Co-Chief Executive Officer'), f('Katie McGrath', 'Co-Chief Executive Officer')],
    about: 'A director’s company that makes television as seriously as it makes film.',
  },
  {
    id: 'plan-b', rank: 16, tier: 'label', name: 'Plan B Entertainment, Inc.',
    labels: [],
    parent: 'Mediawan', independent: false,
    figures: [f('Brad Pitt', 'Principal'), f('Dede Gardner', 'Co-President'), f('Jeremy Kleiner', 'Co-President')],
    about: 'An actor’s production company that became a serious one, now French owned.',
  },
  {
    id: 'annapurna', rank: 17, tier: 'label', name: 'Annapurna Pictures, LLC',
    labels: [],
    independent: true,
    figures: [f('Megan Ellison', 'Founder and Chief Executive Officer')],
    about: 'Backs directors other people have stopped backing, and takes the loss when it comes.',
  },
  {
    id: 'lionsgate', rank: 18, tier: 'label', name: 'Lions Gate Entertainment Corp.',
    labels: ['Lionsgate Films', 'Lionsgate Television'],
    independent: true,
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

/** Everybody named across every company, for anything that wants a person. */
export function everyFigure(): { studio: Studio; figure: StudioFigure }[] {
  return STUDIOS.flatMap((studio) => [
    ...studio.figures.map((figure) => ({ studio, figure })),
    ...(studio.casting ?? []).map((figure) => ({ studio, figure })),
  ]);
}
