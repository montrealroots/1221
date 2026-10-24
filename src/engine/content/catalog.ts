/**
 * SLATE — real productions as their official pages had them (from 2026-10-23, the owner's brief 25, Parts 3 and 5;
 * `docs/verification/career-world-2026-10-23/criteria.md`, Module 2, C1 to C9). Reference data, not the save: what a
 * page said on the day this build read it, field by field, kept apart from anything that happens in a life.
 *
 * Every field is one of four kinds (C1, PROV-01):
 * - **read**: a source's id (`docs/verification/career-world-2026-10-23/sources.json`) and the page's own words, which
 *   the register's record of that page holds (tests/career-catalog.test.ts reads each against it);
 * - **conflict**: two sources disagreeing, both kept, the later one used, and why (C7);
 * - **assumption**: the game's, said as one;
 * - **unknown**: what no source this build read gives, and why. A field no source gives is unknown, never a default.
 *
 * Companies are their own records, and a production names each by the role its source gives (C2). A performer is
 * credited for the scope the source gives (C4): a cast page that names no characters leaves each character unknown. No
 * filming location is taken from a story's setting (C5).
 */

import { formatDate } from '../core/time';

/** The day this build read every page the catalog cites: each source's `retrieved` in the register, which the test holds. */
export const READ_ON = '2026-10-23';

/** A field read from a source: its id in the register, and the page's own words it rests on. */
export interface Read<T> { kind: 'read'; value: T; source: string; words: string }
/** Two sources disagreeing: the later one's value used, the earlier kept, and why the later wins. */
export interface Conflict<T> { kind: 'conflict'; value: T; source: string; words: string; against: { value: T; source: string; words: string }; why: string }
/** The game's own assumption, said as one. */
export interface Assumed<T> { kind: 'assumption'; value: T; why: string }
/** What no source this build read gives. */
export interface Unknown { kind: 'unknown'; why: string }
export type Field<T> = Read<T> | Conflict<T> | Assumed<T> | Unknown;

export type CompanyRole = 'producer' | 'in-association' | 'broadcaster' | 'streaming-platform' | 'distributor' | 'studio-label' | 'production-company';

export interface Company { id: string; name: string }

/** What a credit covers: the series as its page has it, one season, or the film. */
export type Scope = { kind: 'series' } | { kind: 'season'; n: number } | { kind: 'film' };

export interface CastCredit { performer: string; character: Field<string>; scope: Scope; source: string; words: string }
export interface PersonCredit { name: string; role: 'creator' | 'showrunner' | 'director' | 'writer' | 'producer'; scope: Scope; source: string; words: string }
export interface CompanyCredit { company: string; role: CompanyRole; source: string; words: string }

export interface Season {
  n: number;
  episodes: Field<number>;
  premiere: Field<string>;
  /** When its episodes come out, as its pages say it. */
  schedule: Field<string>;
}

export interface Production {
  id: string;
  title: string;
  format: 'series' | 'film';
  /** The source's own genre words; the game's genre ids for a drawn part are its assumption (`content/careerwork.ts`). */
  genres: Field<string>;
  /** Where it stands as of the reading: on the air, announced for release, released. */
  status: Field<string>;
  seasons: readonly Season[];
  companies: readonly CompanyCredit[];
  cast: readonly CastCredit[];
  people: readonly PersonCredit[];
  /** Classification by territory, each the source's. */
  ratings: readonly { territory: string; rating: string; source: string; words: string }[];
  languages: Field<readonly string[]>;
  runtime: Field<string>;
  filming: Field<string>;
  release: Field<string>;
  /** Every source a field of it reads. */
  sources: readonly string[];
}

const read = <T,>(value: T, source: string, words: string): Read<T> => ({ kind: 'read', value, source, words });
const unknown = (why: string): Unknown => ({ kind: 'unknown', why });
const NO_LANGUAGE = unknown('No page the game read states the language it’s made in.');
const NO_RUNTIME = unknown('No page the game read gives a running time.');
const NO_FILMING = unknown('No page the game read says where it’s filmed, and the game doesn’t take it from where the story is set.');
const series: Scope = { kind: 'series' };
const film: Scope = { kind: 'film' };

export const COMPANIES: readonly Company[] = [
  { id: 'apple-tv', name: 'Apple TV' },
  { id: 'see-saw-films', name: 'See-Saw Films' },
  { id: 'abc', name: 'ABC' },
  { id: 'hulu', name: 'Hulu' },
  { id: '20th-television', name: '20th Television' },
  { id: 'ryan-murphy-television', name: 'Ryan Murphy Television' },
  { id: 'brad-falchuk-teley-vision', name: 'Brad Falchuk Teley-Vision' },
  { id: 'warner-bros-television', name: 'Warner Bros. Television' },
  { id: 'amazon-mgm-studios', name: 'Amazon MGM Studios' },
  { id: 'orion-pictures', name: 'Orion Pictures' },
  { id: 'united-artists', name: 'United Artists' },
  { id: 'fireside-films', name: 'Fireside Films' },
  { id: 'baha-productions', name: 'Baha Productions' },
];

/** A series cast line from a page that gives each performer's character: "Angela Bassett as Athena Grant". */
const castFrom = (source: string, words: string, pairs: readonly (readonly [string, string])[], scope: Scope = series): CastCredit[] =>
  pairs.map(([performer, character]) => ({ performer, character: read(character, source, words), scope, source, words }));
/** Performers a page names without their characters. */
const named = (source: string, words: string, performers: readonly string[], scope: Scope, why: string): CastCredit[] =>
  performers.map((performer) => ({ performer, character: unknown(why), scope, source, words }));

const S80_CAST = 'The series stars Angela Bassett as Athena Grant, Jennifer Love Hewitt as Maddie Han, Oliver Stark as Evan “Buck” Buckley, Kenneth Choi as Howie “Chimney” Han, Aisha Hinds as Henrietta “Hen” Wilson, Ryan Guzman as Eddie Diaz, Gavin McHugh as Christopher Diaz, Corinne Messiah as May Grant and Elijah M. Cooper as Harry Grant.';
const S109_CAST = '“Abbott Elementary” stars Emmy® Award winner Quinta Brunson as Janine Teagues, Tyler James Williams as Gregory Eddie, Janelle James as Ava Coleman, Chris Perfetti as Jacob Hill, Lisa Ann Walter as Melissa Schemmenti, William Stanford Davis as Mr. Johnson and Emmy Award winner Sheryl Lee Ralph as Barbara Howard.';
const S79_ENSEMBLE = 'The ensemble cast includes Academy Award nominee Kristin Scott Thomas, Emmy Award nominee Jack Lowden, Saskia Reeves, BAFTA TV Award nominee Christopher Chung, Aimee-Ffion Edwards, Rosalind Eleazar, Joanna Scanlan, BAFTA Award nominee Samuel West, Ruth Bradley, Tom Brooke, Academy Award nominee Jonathan Pryce and Hugo Weaving, alongside new addition, BAFTA TV Award winner Lenny Rush.';
const S85_CAST = 'Season 2 Adam Scott as Patricia Arquette as Britt Lower as Tramell Tillman as Zach Cherry as Jen Tullock as Michael Chernus as Dichen Lachman as Sarah Bock as John Turturro as Christopher Walken as';

const SERIES: readonly Production[] = [
  {
    id: 'nine-one-one', title: '9-1-1', format: 'series',
    genres: read('procedural drama', 'S80', 'reimagine the procedural drama'),
    status: read('On the air: season 10 premiered October 15, 2026', 'S80', 'Season 10 premieres October 15, 2026.'),
    seasons: [{
      n: 10, episodes: unknown('Neither page the game read gives season 10’s number of episodes.'),
      premiere: read('October 15, 2026', 'S80', 'Season 10 premieres October 15, 2026.'),
      schedule: read('Thursdays on ABC; Fridays on Hulu', 'S81', 'New episodes air Thursdays on ABC and stream Fridays on Hulu and Hulu on Disney+ for bundle subscribers.'),
    }],
    companies: [
      { company: '20th-television', role: 'producer', source: 'S80', words: '“9-1-1” is produced by 20th Television in association with Ryan Murphy Television and Brad Falchuk Teley-Vision.' },
      { company: 'ryan-murphy-television', role: 'in-association', source: 'S80', words: '“9-1-1” is produced by 20th Television in association with Ryan Murphy Television and Brad Falchuk Teley-Vision.' },
      { company: 'brad-falchuk-teley-vision', role: 'in-association', source: 'S80', words: '“9-1-1” is produced by 20th Television in association with Ryan Murphy Television and Brad Falchuk Teley-Vision.' },
      { company: 'abc', role: 'broadcaster', source: 'S81', words: 'The season premiere aired on ABC on October 15 and is streaming on Hulu and Hulu on Disney+ for bundle subscribers as of October 16 .' },
      { company: 'hulu', role: 'streaming-platform', source: 'S81', words: 'The season premiere aired on ABC on October 15 and is streaming on Hulu and Hulu on Disney+ for bundle subscribers as of October 16 .' },
    ],
    cast: castFrom('S80', S80_CAST, [['Angela Bassett', 'Athena Grant'], ['Jennifer Love Hewitt', 'Maddie Han'], ['Oliver Stark', 'Evan “Buck” Buckley'], ['Kenneth Choi', 'Howie “Chimney” Han'], ['Aisha Hinds', 'Henrietta “Hen” Wilson'], ['Ryan Guzman', 'Eddie Diaz'], ['Gavin McHugh', 'Christopher Diaz'], ['Corinne Messiah', 'May Grant'], ['Elijah M. Cooper', 'Harry Grant']]),
    people: [
      ...['Ryan Murphy', 'Brad Falchuk', 'Tim Minear'].map((name) => ({ name, role: 'creator' as const, scope: series, source: 'S80', words: 'Created by executive producers Ryan Murphy, Brad Falchuk and Tim Minear' })),
      { name: 'Tim Minear', role: 'showrunner', scope: series, source: 'S80', words: 'Minear serves as showrunner.' },
    ],
    ratings: [],
    languages: NO_LANGUAGE, runtime: NO_RUNTIME, filming: NO_FILMING,
    release: read('Airs on ABC and streams on Hulu', 'S81', 'The season premiere aired on ABC on October 15 and is streaming on Hulu and Hulu on Disney+ for bundle subscribers as of October 16 .'),
    sources: ['S80', 'S81', 'S88'],
  },
  {
    id: 'slow-horses', title: 'Slow Horses', format: 'series',
    genres: read('thriller, drama', 'S78', 'Thriller, Drama'),
    status: read('Season 6 released from September 16, 2026, one episode a week to October 21', 'S79', 'six-episode sixth season will premiere globally on Wednesday, September 16, 2026 with the first episode, followed by one episode weekly until October 21, 2026'),
    seasons: [{
      n: 6,
      episodes: read(6, 'S79', 'six-episode sixth season will premiere globally on Wednesday, September 16, 2026 with the first episode, followed by one episode weekly until October 21, 2026'),
      premiere: read('September 16, 2026', 'S78', 'Season 6 Release Date: September 16, 2026'),
      schedule: read('Weekly to October 21, 2026', 'S79', 'six-episode sixth season will premiere globally on Wednesday, September 16, 2026 with the first episode, followed by one episode weekly until October 21, 2026'),
    }],
    companies: [
      { company: 'see-saw-films', role: 'producer', source: 'S79', words: 'The series is produced for Apple TV by See-Saw Films' },
      { company: 'apple-tv', role: 'streaming-platform', source: 'S79', words: 'The series is produced for Apple TV by See-Saw Films' },
    ],
    cast: [
      { performer: 'Gary Oldman', character: read('Jackson Lamb', 'S78', 'the notorious Jackson Lamb (Academy Award winner Sir Gary Oldman)'), scope: series, source: 'S78', words: 'the notorious Jackson Lamb (Academy Award winner Sir Gary Oldman)' },
      { performer: 'Olivia Cooke', character: read('Sidonie “Sid” Baker', 'S79', 'Olivia Cooke will reprise her role as Sidonie “Sid” Baker in the sixth season.'), scope: { kind: 'season', n: 6 }, source: 'S79', words: 'Olivia Cooke will reprise her role as Sidonie “Sid” Baker in the sixth season.' },
      ...named('S79', S79_ENSEMBLE, ['Kristin Scott Thomas', 'Jack Lowden', 'Saskia Reeves', 'Christopher Chung', 'Aimee-Ffion Edwards', 'Rosalind Eleazar', 'Joanna Scanlan', 'Samuel West', 'Ruth Bradley', 'Tom Brooke', 'Jonathan Pryce', 'Hugo Weaving', 'Lenny Rush'], { kind: 'season', n: 6 }, 'Season six’s release names the ensemble without their characters, and the cast page gives none.'),
    ],
    people: [
      { name: 'Gaby Chiappe', role: 'writer', scope: { kind: 'season', n: 6 }, source: 'S79', words: 'Season six is adapted for television by co-executive producer Gaby Chiappe, with Randall returning to direct.' },
      { name: 'Adam Randall', role: 'director', scope: { kind: 'season', n: 6 }, source: 'S79', words: 'Season six is adapted for television by co-executive producer Gaby Chiappe, with Randall returning to direct.' },
    ],
    ratings: [{ territory: 'US', rating: 'TV-MA', source: 'S78', words: 'Rated TV-MA' }],
    languages: NO_LANGUAGE, runtime: NO_RUNTIME, filming: NO_FILMING,
    release: read('Streams on Apple TV', 'S79', 'The series is produced for Apple TV by See-Saw Films'),
    sources: ['S78', 'S79', 'N04'],
  },
  {
    id: 'severance', title: 'Severance', format: 'series',
    genres: read('thriller', 'N03', 'Rated TV-MA Thriller Severance'),
    status: read('Season 2 released January 17, 2025; no later season in the pages read', 'N03', 'Season 2 Release Date: January 17, 2025'),
    seasons: [{
      n: 2, episodes: unknown('No page the game read gives a number of episodes.'),
      premiere: read('January 17, 2025', 'N03', 'Season 2 Release Date: January 17, 2025'),
      schedule: unknown('No page the game read says how its episodes come out.'),
    }],
    companies: [],
    cast: [
      { performer: 'Adam Scott', character: read('Mark Scout', 'N03', 'Mark Scout (Adam Scott) leads a team at Lumon Industries'), scope: series, source: 'N03', words: 'Mark Scout (Adam Scott) leads a team at Lumon Industries' },
      ...named('S85', S85_CAST, ['Patricia Arquette', 'Britt Lower', 'Tramell Tillman', 'Zach Cherry', 'Jen Tullock', 'Michael Chernus', 'Dichen Lachman', 'Sarah Bock', 'John Turturro', 'Christopher Walken'], { kind: 'season', n: 2 }, 'The cast page, as the game read it, names season two’s actors without their characters.'),
    ],
    people: [],
    ratings: [{ territory: 'US', rating: 'TV-MA', source: 'N03', words: 'Rated TV-MA' }],
    languages: NO_LANGUAGE, runtime: NO_RUNTIME, filming: NO_FILMING,
    release: unknown('Its pages say where to watch it only by their own platform’s links.'),
    sources: ['N03', 'S85'],
  },
  {
    id: 'abbott-elementary', title: 'Abbott Elementary', format: 'series',
    genres: read('workplace comedy', 'S109', 'In this workplace comedy'),
    status: read('On the air, Wednesdays on ABC', 'S109', 'Wednesdays, 8:30-9:02 p.m. ET/PT, on ABC; Streams on Hulu'),
    seasons: [],
    companies: [
      { company: 'warner-bros-television', role: 'producer', source: 'S109', words: 'The series is produced by Warner Bros. Television and 20th Television, a part of Disney Television Studios.' },
      { company: '20th-television', role: 'producer', source: 'S109', words: 'The series is produced by Warner Bros. Television and 20th Television, a part of Disney Television Studios.' },
      { company: 'abc', role: 'broadcaster', source: 'S109', words: 'Wednesdays, 8:30-9:02 p.m. ET/PT, on ABC; Streams on Hulu' },
      { company: 'hulu', role: 'streaming-platform', source: 'S109', words: 'Wednesdays, 8:30-9:02 p.m. ET/PT, on ABC; Streams on Hulu' },
    ],
    cast: castFrom('S109', S109_CAST, [['Quinta Brunson', 'Janine Teagues'], ['Tyler James Williams', 'Gregory Eddie'], ['Janelle James', 'Ava Coleman'], ['Chris Perfetti', 'Jacob Hill'], ['Lisa Ann Walter', 'Melissa Schemmenti'], ['William Stanford Davis', 'Mr. Johnson'], ['Sheryl Lee Ralph', 'Barbara Howard']]),
    people: [{ name: 'Quinta Brunson', role: 'creator', scope: series, source: 'S109', words: 'Quinta Brunson created the series and serves as executive producer' }],
    ratings: [],
    languages: NO_LANGUAGE, runtime: NO_RUNTIME, filming: NO_FILMING,
    release: read('Wednesdays on ABC; streams on Hulu', 'S109', 'Wednesdays, 8:30-9:02 p.m. ET/PT, on ABC; Streams on Hulu'),
    sources: ['S109', 'S86'],
  },
];

/** A film of Amazon MGM Studios' slate (S82), from the release's own line for it. */
function slate(id: string, title: string, words: string, release: Field<string>, people: PersonCredit[] = [], cast: CastCredit[] = [], label?: CompanyCredit): Production {
  return {
    id, title, format: 'film',
    genres: unknown('Its line on the slate gives no genre the game takes as one.'),
    status: read('Announced for release in theaters', 'S82', words),
    seasons: [],
    companies: [{ company: 'amazon-mgm-studios', role: 'distributor', source: 'S82', words: 'Our commitment to release at least 15 films every year into your theaters is on schedule.' }, ...(label ? [label] : [])],
    cast, people, ratings: [],
    languages: NO_LANGUAGE, runtime: NO_RUNTIME, filming: NO_FILMING,
    release, sources: ['S82'],
  };
}
const dated = (date: string, words: string): Read<string> => read(date, 'S82', words);
const directs = (name: string, words: string): PersonCredit[] => [{ name, role: 'director', scope: film, source: 'S82', words }];
const stars = (names: readonly string[], words: string): CastCredit[] => named('S82', words, names, film, 'Its stars are named on the slate without their characters.');
const labelOf = (company: string, words: string): CompanyCredit => ({ company, role: 'studio-label', source: 'S82', words });

const W = {
  sheep: 'The Sheep Detectives (May 8, 2026): In this witty, new breed of mystery , a shepherd (Hugh Jackman)',
  masters: 'Masters of the Universe (June 5, 2026): Director Travis Knight brings the world of Eternia to life on a massive scale with stars Nicholas Galitzine, Camila Mendes, and Idris Elba.',
  rob: 'How to Rob a Bank (September 4, 2026): Director David Leitch teams with Nicholas Hoult, Zoë Kravitz, Anna Sawai, Pete Davidson, and John C. Reilly',
  verity: 'Verity (October 2, 2026):',
  rocky: 'I Play Rocky (November 20, 2026): Director Peter Farrelly',
  bee: 'The Beekeeper 2 (January 15, 2027): Jason Statham returns',
  crown: 'The Thomas Crown Affair (March 5, 2027): A reimagining of the 1968 film, directed by and starring Academy Award winner Michael B. Jordan alongside Adria Arjona',
  space: 'Spaceballs: The New One (April 23, 2027): Director Josh Greenbaum',
  chosen: 'The Chosen: Crucifixion (2027)',
  colt: 'A Colt Is My Passport (Orion Pictures): Director Gareth Evans',
  high: 'Highlander (United Artists): Henry Cavill stars',
  mother: 'Your Mother Your Mother Your Mother (Orion Pictures) : Director Bassam Tariq and Mahershala Ali',
};
const ROCKY_RELEASE = 'The film releases in select theaters on November 6, 2026, and everywhere later in November';
const ROCKY_MAKERS = 'Farrelly directs from a script by Peter Gamble. Toby Emmerich, Christian Baha, and Farrelly produce the film from Fireside Films and Baha Productions.';

const FILMS: readonly Production[] = [
  slate('the-sheep-detectives', 'The Sheep Detectives', W.sheep, dated('May 8, 2026', W.sheep), [], [{ performer: 'Hugh Jackman', character: read('a shepherd', 'S82', W.sheep), scope: film, source: 'S82', words: W.sheep }]),
  slate('masters-of-the-universe', 'Masters of the Universe', W.masters, dated('June 5, 2026', W.masters), directs('Travis Knight', W.masters), stars(['Nicholas Galitzine', 'Camila Mendes', 'Idris Elba'], W.masters)),
  slate('how-to-rob-a-bank', 'How to Rob a Bank', W.rob, dated('September 4, 2026', W.rob), directs('David Leitch', W.rob), stars(['Nicholas Hoult', 'Zoë Kravitz', 'Anna Sawai', 'Pete Davidson', 'John C. Reilly'], W.rob)),
  slate('verity', 'Verity', W.verity, dated('October 2, 2026', W.verity)),
  {
    ...slate('i-play-rocky', 'I Play Rocky', W.rocky, {
      kind: 'conflict', value: 'November 6, 2026 in select theaters, everywhere later in November', source: 'S110', words: ROCKY_RELEASE,
      against: { value: 'November 20, 2026', source: 'S82', words: W.rocky },
      why: 'The trailer’s page, last changed October 22, 2026, is later than the slate of April 16, 2026, so its date is used.',
    }, [
      { name: 'Peter Farrelly', role: 'director', scope: film, source: 'S82', words: W.rocky },
      { name: 'Peter Gamble', role: 'writer', scope: film, source: 'S110', words: ROCKY_MAKERS },
    ], [
      { performer: 'Anthony Ippolito', character: read('a young Sylvester Stallone', 'S110', 'Anthony Ippolito ( The Offer ) stars as a young Sylvester Stallone.'), scope: film, source: 'S110', words: 'Anthony Ippolito ( The Offer ) stars as a young Sylvester Stallone.' },
      ...named('S110', 'The cast also includes Matt Dillon, AnnaSophia Robb, P.J. Byrne, Toby Kebbell, Tracy Letts, Jay Duplass, Stephan James, Kiki Seto, Robert Morgan, Saul Stein, Trevor St. John, Erik Palladino, and Rob Demery.', ['Matt Dillon', 'AnnaSophia Robb', 'P.J. Byrne', 'Toby Kebbell', 'Tracy Letts', 'Jay Duplass', 'Stephan James', 'Kiki Seto', 'Robert Morgan', 'Saul Stein', 'Trevor St. John', 'Erik Palladino', 'Rob Demery'], film, 'The trailer’s page names the rest of the cast without their characters.'),
    ]),
    companies: [
      { company: 'amazon-mgm-studios', role: 'distributor', source: 'S82', words: 'Our commitment to release at least 15 films every year into your theaters is on schedule.' },
      { company: 'fireside-films', role: 'production-company', source: 'S110', words: ROCKY_MAKERS },
      { company: 'baha-productions', role: 'production-company', source: 'S110', words: ROCKY_MAKERS },
    ],
    sources: ['S82', 'S110'],
  },
  slate('the-beekeeper-2', 'The Beekeeper 2', W.bee, dated('January 15, 2027', W.bee), [], stars(['Jason Statham'], W.bee)),
  slate('the-thomas-crown-affair', 'The Thomas Crown Affair', W.crown, dated('March 5, 2027', W.crown), directs('Michael B. Jordan', W.crown), stars(['Michael B. Jordan', 'Adria Arjona'], W.crown)),
  slate('spaceballs-the-new-one', 'Spaceballs: The New One', W.space, dated('April 23, 2027', W.space), directs('Josh Greenbaum', W.space)),
  slate('the-chosen-crucifixion', 'The Chosen: Crucifixion', W.chosen, dated('2027', W.chosen)),
  slate('a-colt-is-my-passport', 'A Colt Is My Passport', W.colt, unknown('Its line on the slate gives no date.'), directs('Gareth Evans', W.colt), [], labelOf('orion-pictures', W.colt)),
  slate('highlander', 'Highlander', W.high, unknown('Its line on the slate gives no date.'), [], stars(['Henry Cavill'], W.high), labelOf('united-artists', W.high)),
  slate('your-mother-your-mother-your-mother', 'Your Mother Your Mother Your Mother', W.mother, unknown('Its line on the slate gives no date.'), directs('Bassam Tariq', W.mother), stars(['Mahershala Ali'], W.mother), labelOf('orion-pictures', W.mother)),
];

/** Every production of the reference catalog, series then films. */
export const CATALOG: readonly Production[] = [...SERIES, ...FILMS];

export const productionById = (id: string): Production | undefined => CATALOG.find((p) => p.id === id);
export const companyName = (id: string): string => COMPANIES.find((c) => c.id === id)?.name ?? id;

/** The companies of a production in a role, by name: "20th Television". */
export const companiesAs = (p: Production, role: CompanyRole): string[] => p.companies.filter((c) => c.role === role).map((c) => companyName(c.company));

/**
 * What this build read for the catalog (C6): each page, what came of it, and the titles it named. A title named and not
 * imported says why. The inventory (`tools/catalog.mjs`) is worked out from this and the records above, never typed.
 */
export interface PageRead { source: string; result: 'read' | 'unreadable'; titles: readonly string[]; notImported?: Readonly<Record<string, string>> }
export const PAGES_READ: readonly PageRead[] = [
  { source: 'S78', result: 'read', titles: ['Slow Horses'] },
  { source: 'S79', result: 'read', titles: ['Slow Horses'] },
  { source: 'N04', result: 'read', titles: ['Slow Horses'] },
  { source: 'S80', result: 'read', titles: ['9-1-1'] },
  { source: 'S81', result: 'read', titles: ['9-1-1', 'Grey’s Anatomy', '9-1-1: Nashville', 'R.J. Decker'], notImported: { 'Grey’s Anatomy': 'Named in passing; the page is 9-1-1’s.', '9-1-1: Nashville': 'Named in passing; the page is 9-1-1’s.', 'R.J. Decker': 'Named in passing; the page is 9-1-1’s.' } },
  { source: 'S88', result: 'unreadable', titles: [] },
  { source: 'N03', result: 'read', titles: ['Severance'] },
  { source: 'S85', result: 'read', titles: ['Severance'] },
  { source: 'S109', result: 'read', titles: ['Abbott Elementary'] },
  { source: 'S86', result: 'unreadable', titles: [] },
  {
    source: 'S82', result: 'read',
    titles: ['The Sheep Detectives', 'Masters of the Universe', 'How to Rob a Bank', 'Verity', 'I Play Rocky', 'The Beekeeper 2', 'The Thomas Crown Affair', 'Spaceballs: The New One', 'The Chosen: Crucifixion', 'A Colt Is My Passport', 'Highlander', 'Your Mother Your Mother Your Mother', 'Project Hail Mary', 'Crime 101'],
    notImported: { 'Project Hail Mary': 'Released in March 2026; the page names it as past, not as part of the slate.', 'Crime 101': 'Streaming already; the page names it in a link, not in the slate.' },
  },
  { source: 'S110', result: 'read', titles: ['I Play Rocky'] },
  { source: 'S83', result: 'unreadable', titles: [] },
];

const listed = (xs: readonly string[]): string => (xs.length < 3 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/**
 * A production as a player reads it beside a part drawn from it (Module 2, C1 and C5): where it stands, who makes it and
 * where it's seen, who created and runs it, its cast as its pages name them, and what the pages don't give, said as not
 * given. Each line is the catalog's own reading; nothing here is the save's.
 */
export function productionWords(p: Production): string[] {
  const out: string[] = [];
  if (p.status.kind === 'read' || p.status.kind === 'conflict') out.push(`${p.status.value}.`);
  const made = companiesAs(p, 'producer');
  const assoc = companiesAs(p, 'in-association');
  const shown = [...companiesAs(p, 'broadcaster').map((c) => `on ${c}`), ...companiesAs(p, 'streaming-platform').map((c) => `streaming on ${c}`)];
  if (made.length) out.push(`Made by ${listed(made)}${assoc.length ? `, in association with ${listed(assoc)}` : ''}${shown.length ? `; ${shown.join(', ')}` : ''}.`);
  const creators = p.people.filter((x) => x.role === 'creator').map((x) => x.name);
  const runner = p.people.find((x) => x.role === 'showrunner')?.name;
  if (creators.length) out.push(`Created by ${listed(creators)}${runner ? `; ${runner} is the showrunner` : ''}.`);
  const named = p.cast.filter((c) => c.scope.kind === 'series' && c.character.kind === 'read').map((c) => `${c.performer} as ${(c.character as Read<string>).value}`);
  if (named.length) out.push(`Its cast: ${listed(named)}.`);
  const missing = [p.filming.kind === 'unknown' ? 'where it films' : '', p.runtime.kind === 'unknown' ? 'how long its episodes run' : ''].filter(Boolean);
  if (missing.length) out.push(`${listed(missing).replace(/^./, (c) => c.toUpperCase())} ${missing.length > 1 ? 'aren’t' : 'isn’t'} in the pages the game read.`);
  const [y, m, d] = READ_ON.split('-').map(Number);
  out.push(`Read from its official pages on ${formatDate(Date.UTC(y!, m! - 1, d!, 12), 'UTC')}.`);
  return out;
}
