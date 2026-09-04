/**
 * SLATE — Every genre, in alphabetical order, with what it actually is.
 *
 * A genre is not a tag. It is a set of expectations an audience brings, a
 * budget band the business has learned to expect, a runtime it usually sits
 * at, a certificate it usually carries, and a different answer to the
 * question "what makes this good". A horror picture lives or dies on tension
 * and almost never on dialogue; a courtroom drama is the reverse. So every
 * genre here carries its own weighting of the craft, and the script system,
 * the critics, the greenlight and the box office all read the same table.
 *
 * The genre names, descriptions and conventions are ordinary film and
 * television usage. The numbers beside them — appetite, budget index, the
 * craft weights — are SLATE's calibration, not a published figure, and the
 * interface says so wherever it shows them.
 */

/** The craft the script is judged on. Every genre weights these differently. */
export const CRAFT_DIMENSIONS = [
  'structure', 'dialogue', 'character', 'premise', 'pacing', 'theme',
  'tension', 'humour', 'emotion', 'spectacle', 'world', 'authenticity',
  'originality', 'ending',
] as const;
export type CraftDimension = (typeof CRAFT_DIMENSIONS)[number];

export const CRAFT_LABEL: Readonly<Record<CraftDimension, string>> = {
  structure: 'Structure', dialogue: 'Dialogue', character: 'Character', premise: 'Premise',
  pacing: 'Pacing', theme: 'Theme', tension: 'Tension', humour: 'Humour', emotion: 'Emotion',
  spectacle: 'Spectacle', world: 'World Building', authenticity: 'Authenticity',
  originality: 'Originality', ending: 'Ending',
};

export const CRAFT_EXPLAIN: Readonly<Record<CraftDimension, string>> = {
  structure: 'Whether the thing is built: acts that turn, a spine that holds, scenes that earn their place.',
  dialogue: 'Whether people talk like people, and whether the talk does work beyond saying what happened.',
  character: 'Whether anyone in it wants something badly enough to be worth watching, and changes for it.',
  premise: 'The idea itself, and whether one sentence of it makes somebody lean forward.',
  pacing: 'Whether it moves. Where the air is, where the pressure is, and whether the middle sags.',
  theme: 'What it is about underneath what it is about, and whether that survives contact with the plot.',
  tension: 'Dread, suspense, the sense that something is about to go wrong. What horror and thrillers live on.',
  humour: 'Whether it is funny on the page, which is the only place a comedy can be funny first.',
  emotion: 'Whether it lands in the chest. The reason people cry at films they can see coming.',
  spectacle: 'Scale on the page: the sequences somebody will build, shoot and sell the picture on.',
  world: 'Whether the place holds together — rules, texture, history — enough to believe people live there.',
  authenticity: 'Whether it rings true to the world it claims: the job, the era, the room, the record.',
  originality: 'Whether anyone has seen this before, and whether the familiar parts are put together new.',
  ending: 'Whether it pays. The last ten minutes are what an audience takes home and tells people about.',
};

export type GenreCategory =
  | 'narrative' | 'comedy' | 'genre_film' | 'speculative' | 'factual'
  | 'unscripted' | 'form' | 'audience';

export const GENRE_CATEGORY_LABEL: Readonly<Record<GenreCategory, string>> = {
  narrative: 'Drama And Story', comedy: 'Comedy', genre_film: 'Genre Pictures',
  speculative: 'Speculative', factual: 'Factual', unscripted: 'Unscripted',
  form: 'Form And Style', audience: 'Audience',
};

export interface GenreDef {
  id: string;
  name: string;
  category: GenreCategory;
  /** What it is, in one or two sentences. */
  description: string;
  /** How it usually works: the conventions a writer is either using or breaking. */
  convention: string;
  /** 0-100 base audience appetite. SLATE's calibration. */
  appetite: number;
  /** Multiplier on a baseline budget. SLATE's calibration. */
  budgetIndex: number;
  /** Usual feature runtime band in minutes. */
  runtime: [number, number];
  /** The certificates it usually carries, lightest first. Ids from content/ratings. */
  ratings: string[];
  /** Which craft matters most here, 0-1. Absent means the baseline of 0.5. */
  craft: Partial<Record<CraftDimension, number>>;
  /** Genres it commonly shares a picture with. */
  pairsWith: string[];
  /** Formats it is usually made in. */
  formats: ('feature' | 'series' | 'limited_series' | 'documentary' | 'tv_movie' | 'short')[];
  /** True when the genre is a television staple more than a film one. */
  television?: boolean;
}

const F = ['feature'] as GenreDef['formats'];
const FS = ['feature', 'series', 'limited_series'] as GenreDef['formats'];
const S = ['series', 'limited_series'] as GenreDef['formats'];
const ALL = ['feature', 'series', 'limited_series', 'tv_movie', 'short'] as GenreDef['formats'];

/**
 * Every genre, alphabetically. This is the list a project may be built from.
 */
export const GENRES_FULL: readonly GenreDef[] = [
  { id: 'action', name: 'Action', category: 'genre_film', description: 'Physical conflict is the engine: chases, fights, escapes, and a body moving through danger.', convention: 'A set piece roughly every fifteen minutes, a clear physical goal, and a villain who can beat the hero in a room.', appetite: 78, budgetIndex: 2.6, runtime: [100, 140], ratings: ['pg-13', 'r'], craft: { spectacle: 0.95, pacing: 0.9, tension: 0.8, structure: 0.7, premise: 0.6, dialogue: 0.35, theme: 0.3 }, pairsWith: ['adventure', 'thriller', 'crime', 'science-fiction'], formats: FS },
  { id: 'adventure', name: 'Adventure', category: 'genre_film', description: 'A journey out and back: unfamiliar places, mounting obstacles, and someone changed by the going.', convention: 'A departure, a threshold, escalating terrain, and a return that costs something.', appetite: 76, budgetIndex: 2.4, runtime: [105, 145], ratings: ['pg', 'pg-13'], craft: { spectacle: 0.9, world: 0.85, pacing: 0.75, character: 0.65, premise: 0.6 }, pairsWith: ['action', 'fantasy', 'family'], formats: FS },
  { id: 'animation', name: 'Animation', category: 'form', description: 'Made frame by frame rather than photographed: drawn, painted, modelled, or built in a computer.', convention: 'Design carries what a camera cannot. Every frame is a decision, so nothing is accidental.', appetite: 72, budgetIndex: 2.2, runtime: [85, 110], ratings: ['g', 'pg'], craft: { world: 0.9, spectacle: 0.85, emotion: 0.8, character: 0.75, humour: 0.6 }, pairsWith: ['family', 'comedy', 'fantasy', 'adventure'], formats: ALL },
  { id: 'anthology', name: 'Anthology', category: 'form', description: 'Separate stories under one roof, sharing a theme, a place or a frame rather than a cast.', convention: 'Each part stands alone and the whole says something none of the parts do.', appetite: 44, budgetIndex: 0.7, runtime: [95, 130], ratings: ['pg-13', 'r'], craft: { theme: 0.9, premise: 0.8, originality: 0.75, structure: 0.7, ending: 0.6 }, pairsWith: ['horror', 'drama', 'science-fiction'], formats: ['feature', 'series', 'limited_series'] },
  { id: 'biography', name: 'Biography', category: 'factual', description: 'One real life, dramatised: what they did, what it cost, and who they were when nobody was looking.', convention: 'A defining stretch rather than the whole life, and a thesis about the person the film can argue.', appetite: 48, budgetIndex: 0.7, runtime: [110, 150], ratings: ['pg-13', 'r'], craft: { character: 0.95, authenticity: 0.9, emotion: 0.8, theme: 0.75, dialogue: 0.7, originality: 0.35 }, pairsWith: ['drama', 'historical', 'musical', 'sport'], formats: FS },
  { id: 'children', name: "Children's", category: 'audience', description: 'Made for the youngest audience: simple stakes, clear feeling, and nothing that follows a child to bed.', convention: 'Short scenes, plain want, a lesson that is felt rather than stated, and an adult in the room who is safe.', appetite: 66, budgetIndex: 0.9, runtime: [70, 90], ratings: ['tv-y', 'g'], craft: { emotion: 0.8, character: 0.7, humour: 0.7, world: 0.6, theme: 0.55, tension: 0.2 }, pairsWith: ['animation', 'family', 'educational'], formats: ALL, television: true },
  { id: 'comedy', name: 'Comedy', category: 'comedy', description: 'Built to be funny: character, situation and language arranged so the audience laughs on purpose.', convention: 'A comic engine that generates jokes from the premise rather than jokes bolted onto a plot.', appetite: 68, budgetIndex: 0.6, runtime: [90, 110], ratings: ['pg-13', 'r'], craft: { humour: 1, dialogue: 0.9, character: 0.75, pacing: 0.75, premise: 0.7, spectacle: 0.15 }, pairsWith: ['romance', 'crime', 'family', 'satire'], formats: ALL },
  { id: 'coming-of-age', name: 'Coming Of Age', category: 'narrative', description: 'The summer, the year or the night a young person stops being who they were.', convention: 'A small world, a first time, and an adult failure that has to be survived rather than fixed.', appetite: 54, budgetIndex: 0.45, runtime: [95, 120], ratings: ['pg-13', 'r'], craft: { character: 0.95, emotion: 0.9, authenticity: 0.85, dialogue: 0.8, theme: 0.75, spectacle: 0.1 }, pairsWith: ['drama', 'teen', 'romance', 'comedy'], formats: FS },
  { id: 'concert', name: 'Concert', category: 'unscripted', description: 'A performance filmed as a performance: the show, the room, and the people watching it.', convention: 'Coverage that serves the music, and a shape across the set list rather than a plot.', appetite: 40, budgetIndex: 0.3, runtime: [80, 120], ratings: ['pg-13', 'tv-14'], craft: { spectacle: 0.85, pacing: 0.7, authenticity: 0.8, emotion: 0.6, structure: 0.4 }, pairsWith: ['documentary', 'musical'], formats: ['feature', 'documentary'] },
  { id: 'cooking', name: 'Cooking', category: 'unscripted', description: 'Food made on camera: the craft, the pressure, and whoever is making it.', convention: 'A clock, a constraint, a plate, and a judgement.', appetite: 42, budgetIndex: 0.18, runtime: [42, 60], ratings: ['tv-g', 'tv-pg'], craft: { authenticity: 0.85, character: 0.7, pacing: 0.7, tension: 0.55 }, pairsWith: ['reality', 'documentary'], formats: S, television: true },
  { id: 'crime', name: 'Crime', category: 'genre_film', description: 'The doing of it, the living with it, or the undoing of it. The law is a pressure, not always a presence.', convention: 'A plan, a complication, and a moral floor that gives way at exactly the wrong moment.', appetite: 62, budgetIndex: 0.8, runtime: [105, 140], ratings: ['r', 'tv-ma'], craft: { structure: 0.85, tension: 0.85, character: 0.8, dialogue: 0.75, authenticity: 0.7, pacing: 0.7 }, pairsWith: ['thriller', 'drama', 'gangster', 'heist'], formats: ALL },
  { id: 'dance', name: 'Dance', category: 'form', description: 'Bodies moving as the story: rehearsal, performance, and what the discipline takes.', convention: 'Numbers shot to be legible, a company as an ensemble, and a final performance that pays the training.', appetite: 40, budgetIndex: 0.6, runtime: [95, 120], ratings: ['pg-13'], craft: { spectacle: 0.85, emotion: 0.75, character: 0.7, pacing: 0.65, authenticity: 0.7 }, pairsWith: ['musical', 'drama', 'romance'], formats: FS },
  { id: 'dark-comedy', name: 'Dark Comedy', category: 'comedy', description: 'Funny about the things that are not funny: death, cruelty, failure, and the machinery that produces them.', convention: 'Play it straight. The laugh comes from the gap between how bad it is and how calmly it is treated.', appetite: 52, budgetIndex: 0.6, runtime: [95, 120], ratings: ['r', 'tv-ma'], craft: { humour: 0.9, dialogue: 0.9, theme: 0.85, character: 0.8, originality: 0.8, emotion: 0.6 }, pairsWith: ['crime', 'satire', 'drama'], formats: ALL },
  { id: 'disaster', name: 'Disaster', category: 'genre_film', description: 'Something enormous goes wrong and a cross-section of people has to get out of it.', convention: 'An ensemble introduced fast, an inevitability, and set pieces that escalate in scale rather than kind.', appetite: 64, budgetIndex: 2.4, runtime: [110, 135], ratings: ['pg-13'], craft: { spectacle: 0.95, tension: 0.85, pacing: 0.8, emotion: 0.6, character: 0.5, originality: 0.3 }, pairsWith: ['action', 'thriller', 'survival'], formats: F },
  { id: 'docudrama', name: 'Docudrama', category: 'factual', description: 'A real event staged with actors, close enough to the record to be argued with.', convention: 'The known facts as the spine, invention only where the record is silent, and a note saying which is which.', appetite: 46, budgetIndex: 0.7, runtime: [100, 135], ratings: ['pg-13', 'r'], craft: { authenticity: 0.95, structure: 0.8, character: 0.75, theme: 0.75, tension: 0.7, originality: 0.3 }, pairsWith: ['drama', 'historical', 'true-crime'], formats: FS },
  { id: 'documentary', name: 'Documentary', category: 'factual', description: 'Real people and real events, filmed and shaped rather than staged.', convention: 'Access first, argument second. What the camera was allowed to see decides what the film can be.', appetite: 32, budgetIndex: 0.15, runtime: [85, 115], ratings: ['pg-13', 'r'], craft: { authenticity: 1, theme: 0.9, structure: 0.8, character: 0.7, emotion: 0.7, spectacle: 0.2 }, pairsWith: ['biography', 'nature', 'true-crime', 'political'], formats: ['documentary', 'feature', 'series', 'limited_series'] },
  { id: 'drama', name: 'Drama', category: 'narrative', description: 'People under pressure, changed by it. The oldest and widest of them, and the hardest to do plainly.', convention: 'Want, obstacle, cost. No engine but character, which is why weak ones are so obviously weak.', appetite: 54, budgetIndex: 0.6, runtime: [100, 135], ratings: ['pg-13', 'r'], craft: { character: 1, emotion: 0.9, dialogue: 0.85, theme: 0.85, structure: 0.8, spectacle: 0.15 }, pairsWith: ['romance', 'crime', 'historical', 'family'], formats: ALL },
  { id: 'dystopian', name: 'Dystopian', category: 'speculative', description: 'A society organised badly on purpose, and someone who can finally see it.', convention: 'The rules explained by living under them, and a system that is worse than any single villain in it.', appetite: 58, budgetIndex: 1.8, runtime: [105, 135], ratings: ['pg-13', 'r'], craft: { world: 0.95, theme: 0.9, premise: 0.85, tension: 0.75, character: 0.7 }, pairsWith: ['science-fiction', 'thriller', 'teen'], formats: FS },
  { id: 'educational', name: 'Educational', category: 'factual', description: 'Made to teach: a subject broken down so somebody comes away knowing it.', convention: 'One idea per segment, demonstrated before it is explained.', appetite: 26, budgetIndex: 0.2, runtime: [25, 50], ratings: ['tv-y', 'tv-g'], craft: { authenticity: 0.9, structure: 0.8, pacing: 0.6, humour: 0.4 }, pairsWith: ['children', 'documentary', 'nature'], formats: S, television: true },
  { id: 'epic', name: 'Epic', category: 'form', description: 'Scale in every direction: years, armies, geography, and a life measured against history.', convention: 'A long runtime earned by consequence, not incident, and a canvas the camera has to travel.', appetite: 60, budgetIndex: 3.2, runtime: [150, 210], ratings: ['pg-13', 'r'], craft: { spectacle: 0.95, world: 0.9, structure: 0.85, theme: 0.85, character: 0.8, pacing: 0.6 }, pairsWith: ['historical', 'war', 'fantasy', 'drama'], formats: FS },
  { id: 'erotic', name: 'Erotic', category: 'genre_film', description: 'Desire as the subject rather than the decoration: what people want and what wanting it does to them.', convention: 'Restraint and suggestion carry further than explicitness, and consequence is the whole point.', appetite: 34, budgetIndex: 0.5, runtime: [95, 120], ratings: ['r', 'nc-17', 'tv-ma'], craft: { character: 0.85, tension: 0.8, emotion: 0.75, dialogue: 0.7, theme: 0.7 }, pairsWith: ['thriller', 'drama', 'romance'], formats: FS },
  { id: 'espionage', name: 'Espionage', category: 'genre_film', description: 'Intelligence work: assets, tradecraft, betrayal, and nobody being who they said.', convention: 'Information as currency, a loyalty that has to break, and competence made legible.', appetite: 62, budgetIndex: 1.8, runtime: [110, 140], ratings: ['pg-13', 'r'], craft: { structure: 0.9, tension: 0.9, authenticity: 0.8, dialogue: 0.75, character: 0.7, pacing: 0.75 }, pairsWith: ['thriller', 'action', 'political'], formats: FS },
  { id: 'experimental', name: 'Experimental', category: 'form', description: 'Made against the conventions on purpose: form as the argument, not the delivery.', convention: 'There is no convention. What it refuses is the statement.', appetite: 14, budgetIndex: 0.2, runtime: [60, 100], ratings: ['r', 'nc-17'], craft: { originality: 1, theme: 0.9, world: 0.6, structure: 0.35, dialogue: 0.3, pacing: 0.3 }, pairsWith: ['drama', 'anthology'], formats: ['feature', 'short'] },
  { id: 'fairy-tale', name: 'Fairy Tale', category: 'speculative', description: 'The old shapes: a bargain, a transformation, three of something, and a moral underneath.', convention: 'Archetype over psychology, and a world where the rules are moral rather than physical.', appetite: 58, budgetIndex: 1.9, runtime: [95, 120], ratings: ['pg', 'pg-13'], craft: { world: 0.9, emotion: 0.8, theme: 0.8, spectacle: 0.8, character: 0.65, originality: 0.4 }, pairsWith: ['fantasy', 'family', 'animation'], formats: FS },
  { id: 'family', name: 'Family', category: 'audience', description: 'Built for everyone in the room at once: children held, adults not condescended to.', convention: 'Two registers running together — the story a child follows and the one a parent hears.', appetite: 74, budgetIndex: 1.4, runtime: [90, 115], ratings: ['g', 'pg'], craft: { emotion: 0.9, humour: 0.8, character: 0.75, world: 0.7, theme: 0.7, tension: 0.4 }, pairsWith: ['animation', 'adventure', 'comedy', 'fantasy'], formats: ALL },
  { id: 'fantasy', name: 'Fantasy', category: 'speculative', description: 'A world with rules ours does not have, taken seriously enough to be lived in.', convention: 'The magic has a price and a limit, or nothing that happens can matter.', appetite: 66, budgetIndex: 2.2, runtime: [110, 150], ratings: ['pg-13'], craft: { world: 1, spectacle: 0.9, premise: 0.8, character: 0.7, theme: 0.7 }, pairsWith: ['adventure', 'epic', 'family', 'sword-and-sorcery'], formats: FS },
  { id: 'film-noir', name: 'Film Noir', category: 'form', description: 'Fatalism in low light: a compromised man, a city that corrupts, and a way out that closes.', convention: 'Voice-over, venetian blinds, a woman with her own plan, and an ending that was always going to happen.', appetite: 40, budgetIndex: 0.7, runtime: [95, 120], ratings: ['pg-13', 'r'], craft: { dialogue: 0.9, theme: 0.85, character: 0.8, tension: 0.8, structure: 0.75, originality: 0.5 }, pairsWith: ['crime', 'mystery', 'thriller'], formats: F },
  { id: 'folk-horror', name: 'Folk Horror', category: 'genre_film', description: 'Old belief in an isolated place, and an outsider who arrives too late to leave.', convention: 'Daylight rather than dark, a community rather than a monster, and ritual as the reveal.', appetite: 44, budgetIndex: 0.35, runtime: [95, 125], ratings: ['r'], craft: { tension: 0.9, world: 0.85, theme: 0.8, authenticity: 0.75, pacing: 0.6, originality: 0.7 }, pairsWith: ['horror', 'mystery', 'supernatural'], formats: FS },
  { id: 'found-footage', name: 'Found Footage', category: 'form', description: 'Presented as recovered recordings: the camera is in the story and someone in it is holding it.', convention: 'The reason the camera is running has to hold, and the limits of it are the whole craft.', appetite: 42, budgetIndex: 0.12, runtime: [80, 100], ratings: ['r'], craft: { tension: 0.9, authenticity: 0.85, premise: 0.7, pacing: 0.7, originality: 0.6, spectacle: 0.25 }, pairsWith: ['horror', 'thriller', 'science-fiction'], formats: F },
  { id: 'game-show', name: 'Game Show', category: 'unscripted', description: 'A format with rules, contestants and a prize, run the same way every week.', convention: 'The format is the star. A host, a clock, and a structure an audience can play along with.', appetite: 44, budgetIndex: 0.15, runtime: [30, 60], ratings: ['tv-g', 'tv-pg'], craft: { pacing: 0.85, tension: 0.7, premise: 0.7, humour: 0.5 }, pairsWith: ['reality', 'variety'], formats: S, television: true },
  { id: 'gangster', name: 'Gangster', category: 'genre_film', description: 'Organised crime as a business and a family: rise, rule, and the arithmetic of the fall.', convention: 'Loyalty as currency, promotion by violence, and an ending nobody in it can see coming.', appetite: 58, budgetIndex: 1.1, runtime: [125, 170], ratings: ['r', 'tv-ma'], craft: { character: 0.9, dialogue: 0.85, structure: 0.8, authenticity: 0.8, theme: 0.75, tension: 0.75 }, pairsWith: ['crime', 'drama', 'epic'], formats: FS },
  { id: 'heist', name: 'Heist', category: 'genre_film', description: 'A crew, a plan, a job, and everything that the plan did not account for.', convention: 'Show the plan, break the plan, and let the audience be one step behind on purpose.', appetite: 66, budgetIndex: 1.2, runtime: [105, 130], ratings: ['pg-13', 'r'], craft: { structure: 0.95, pacing: 0.9, premise: 0.8, dialogue: 0.75, tension: 0.8, character: 0.65 }, pairsWith: ['crime', 'thriller', 'comedy'], formats: FS },
  { id: 'historical', name: 'Historical', category: 'narrative', description: 'Set in a real past and answerable to it: the clothes, the money, the politics and the manners.', convention: 'The period is a pressure on the characters, not a backdrop behind them.', appetite: 50, budgetIndex: 1.6, runtime: [120, 160], ratings: ['pg-13', 'r'], craft: { authenticity: 0.95, world: 0.85, character: 0.8, theme: 0.8, dialogue: 0.75 }, pairsWith: ['drama', 'war', 'epic', 'biography'], formats: FS },
  { id: 'holiday', name: 'Holiday', category: 'audience', description: 'Built around a season and everything an audience already feels about it.', convention: 'Reunion, return, and a reconciliation the audience is waiting for rather than surprised by.', appetite: 56, budgetIndex: 0.3, runtime: [85, 100], ratings: ['pg', 'tv-g'], craft: { emotion: 0.85, character: 0.65, humour: 0.6, originality: 0.25 }, pairsWith: ['romance', 'family', 'comedy'], formats: ['feature', 'tv_movie', 'series'] },
  { id: 'horror', name: 'Horror', category: 'genre_film', description: 'Built to frighten. What is wrong is often withheld longer than what is happening.', convention: 'Rules established then broken, safety established then removed, and a threat with a logic.', appetite: 70, budgetIndex: 0.25, runtime: [90, 110], ratings: ['r'], craft: { tension: 1, pacing: 0.9, premise: 0.8, world: 0.7, originality: 0.7, dialogue: 0.4, humour: 0.25 }, pairsWith: ['thriller', 'supernatural', 'slasher', 'mystery'], formats: ALL },
  { id: 'kaiju', name: 'Kaiju', category: 'speculative', description: 'Enormous creatures and the cities under them, in the tradition the form was invented in.', convention: 'Scale conveyed from the ground, destruction with weight, and humans who can only respond.', appetite: 58, budgetIndex: 2.6, runtime: [110, 135], ratings: ['pg-13'], craft: { spectacle: 1, world: 0.8, pacing: 0.7, tension: 0.7, character: 0.45 }, pairsWith: ['science-fiction', 'action', 'monster'], formats: FS },
  { id: 'legal', name: 'Legal', category: 'narrative', description: 'The law as the arena: cases, procedure, and what the system does to the people inside it.', convention: 'A case that argues the theme, and a rule of law that binds even the protagonist.', appetite: 44, budgetIndex: 0.6, runtime: [110, 135], ratings: ['pg-13', 'r', 'tv-14'], craft: { dialogue: 0.95, structure: 0.85, authenticity: 0.85, character: 0.8, theme: 0.75, tension: 0.7 }, pairsWith: ['drama', 'crime', 'procedural'], formats: ALL, television: true },
  { id: 'martial-arts', name: 'Martial Arts', category: 'genre_film', description: 'Fighting as discipline and as language: training, lineage, and combat that means something.', convention: 'Choreography shot wide and held, a teacher, and a final fight that is about more than winning.', appetite: 58, budgetIndex: 1.1, runtime: [95, 125], ratings: ['pg-13', 'r'], craft: { spectacle: 0.95, pacing: 0.8, character: 0.7, authenticity: 0.75, theme: 0.6 }, pairsWith: ['action', 'drama', 'historical'], formats: FS },
  { id: 'medical', name: 'Medical', category: 'narrative', description: 'Hospitals and the people who work in them: bodies, decisions, and the hours.', convention: 'A case of the week against a running staff story, and a cost to being the one who decides.', appetite: 42, budgetIndex: 0.6, runtime: [42, 60], ratings: ['tv-14', 'r'], craft: { authenticity: 0.9, character: 0.85, emotion: 0.85, dialogue: 0.8, tension: 0.7 }, pairsWith: ['drama', 'procedural', 'romance'], formats: ALL, television: true },
  { id: 'melodrama', name: 'Melodrama', category: 'narrative', description: 'Emotion at full volume: fate, sacrifice, and feeling that the film refuses to be embarrassed by.', convention: 'Coincidence allowed, restraint suspended, and a heightened register held without irony.', appetite: 46, budgetIndex: 0.7, runtime: [110, 140], ratings: ['pg-13', 'r'], craft: { emotion: 1, character: 0.8, theme: 0.75, dialogue: 0.7, originality: 0.4 }, pairsWith: ['romance', 'drama', 'historical'], formats: ALL },
  { id: 'military', name: 'Military', category: 'narrative', description: 'Service itself: the unit, the chain of command, and life inside an institution built for violence.', convention: 'Procedure as character, and a hierarchy that decides what a person is allowed to want.', appetite: 50, budgetIndex: 1.7, runtime: [110, 145], ratings: ['r', 'tv-ma'], craft: { authenticity: 0.9, character: 0.8, tension: 0.8, structure: 0.75, theme: 0.75 }, pairsWith: ['war', 'drama', 'action', 'espionage'], formats: FS },
  { id: 'mockumentary', name: 'Mockumentary', category: 'comedy', description: 'Fiction shot as documentary, with the form itself as part of the joke.', convention: 'Talking heads, a crew the characters can see, and comedy from people performing themselves.', appetite: 48, budgetIndex: 0.3, runtime: [90, 110], ratings: ['pg-13', 'r', 'tv-14'], craft: { humour: 0.95, character: 0.85, dialogue: 0.85, authenticity: 0.7, originality: 0.65 }, pairsWith: ['comedy', 'satire', 'workplace'], formats: ALL, television: true },
  { id: 'monster', name: 'Monster', category: 'genre_film', description: 'A creature with rules, and people learning them the hard way.', convention: 'Withhold the full look, establish what it can and cannot do, and honour those limits.', appetite: 62, budgetIndex: 1.1, runtime: [95, 120], ratings: ['pg-13', 'r'], craft: { tension: 0.9, world: 0.8, spectacle: 0.8, pacing: 0.75, premise: 0.7 }, pairsWith: ['horror', 'science-fiction', 'kaiju'], formats: FS },
  { id: 'musical', name: 'Musical', category: 'form', description: 'Songs carry the story: people sing when speech will no longer do the job.', convention: 'Every number advances something, and the first one teaches the audience the rules.', appetite: 46, budgetIndex: 1.2, runtime: [110, 145], ratings: ['pg', 'pg-13'], craft: { emotion: 0.9, spectacle: 0.85, structure: 0.8, character: 0.75, pacing: 0.75 }, pairsWith: ['drama', 'romance', 'family', 'dance'], formats: ALL },
  { id: 'mystery', name: 'Mystery', category: 'genre_film', description: 'Something has happened and the film is the finding out. The audience is the detective.', convention: 'Every clue on screen and fairly placed, and a solution that re-reads everything before it.', appetite: 56, budgetIndex: 0.7, runtime: [100, 130], ratings: ['pg-13', 'r'], craft: { structure: 0.95, premise: 0.85, dialogue: 0.8, tension: 0.8, ending: 0.9, character: 0.7 }, pairsWith: ['crime', 'thriller', 'whodunit'], formats: ALL },
  { id: 'mythology', name: 'Mythology', category: 'speculative', description: 'Gods, heroes and the old stories, told at the scale they were meant to be.', convention: 'Fate as a real force, and a hero whose flaw is the mechanism of the story.', appetite: 54, budgetIndex: 2.6, runtime: [120, 160], ratings: ['pg-13', 'r'], craft: { world: 0.9, spectacle: 0.9, theme: 0.85, character: 0.7, originality: 0.4 }, pairsWith: ['fantasy', 'epic', 'adventure'], formats: FS },
  { id: 'nature', name: 'Nature', category: 'factual', description: 'The living world filmed at length: behaviour, habitat, and the patience it takes to catch either.', convention: 'Years of shooting for minutes of film, and narration that stays out of the way.', appetite: 38, budgetIndex: 0.9, runtime: [50, 90], ratings: ['g', 'tv-g'], craft: { spectacle: 0.9, authenticity: 0.95, structure: 0.7, emotion: 0.65 }, pairsWith: ['documentary', 'educational'], formats: ['documentary', 'series', 'feature'] },
  { id: 'neo-noir', name: 'Neo-Noir', category: 'form', description: 'Noir moved forward in time and colour, keeping the fatalism and losing the hats.', convention: 'Modern rot in place of period rot, and a protagonist whose competence cannot save them.', appetite: 46, budgetIndex: 0.9, runtime: [105, 135], ratings: ['r'], craft: { theme: 0.9, character: 0.85, dialogue: 0.85, tension: 0.8, originality: 0.7 }, pairsWith: ['crime', 'thriller', 'mystery'], formats: FS },
  { id: 'news', name: 'News', category: 'unscripted', description: 'Reporting on the day, on air, to a deadline that never moves.', convention: 'Accuracy over speed, sourcing that survives being wrong, and a running order that changes to the minute.', appetite: 34, budgetIndex: 0.25, runtime: [30, 60], ratings: ['tv-g', 'tv-pg'], craft: { authenticity: 1, pacing: 0.8, structure: 0.7 }, pairsWith: ['documentary', 'political'], formats: S, television: true },
  { id: 'parody', name: 'Parody', category: 'comedy', description: 'A specific target imitated closely enough to be recognised and mercilessly enough to land.', convention: 'The parody must be good at the thing it is mocking, or there is no joke.', appetite: 44, budgetIndex: 0.4, runtime: [85, 100], ratings: ['pg-13', 'r'], craft: { humour: 0.95, premise: 0.8, dialogue: 0.8, originality: 0.6, structure: 0.55 }, pairsWith: ['comedy', 'satire'], formats: FS },
  { id: 'period-drama', name: 'Period Drama', category: 'narrative', description: 'A past interior world: houses, households, and the rules people live and suffer under.', convention: 'Manners as the battlefield, and everything important said in a sentence that appears to be about something else.', appetite: 48, budgetIndex: 1.5, runtime: [115, 150], ratings: ['pg-13', 'tv-14'], craft: { authenticity: 0.95, dialogue: 0.9, character: 0.85, world: 0.85, emotion: 0.8 }, pairsWith: ['historical', 'romance', 'drama'], formats: ALL, television: true },
  { id: 'political', name: 'Political', category: 'narrative', description: 'Power: who has it, how it is taken, and what holding it does to the person holding it.', convention: 'Process made dramatic, and a compromise that is the real climax.', appetite: 44, budgetIndex: 0.8, runtime: [110, 140], ratings: ['r', 'tv-ma'], craft: { dialogue: 0.9, structure: 0.85, theme: 0.9, authenticity: 0.85, character: 0.8 }, pairsWith: ['drama', 'thriller', 'espionage'], formats: ALL, television: true },
  { id: 'post-apocalyptic', name: 'Post-Apocalyptic', category: 'speculative', description: 'After the collapse: what is left, what it costs to keep, and who people become without the old rules.', convention: 'Scarcity as the engine, and a world whose history is legible in its wreckage.', appetite: 60, budgetIndex: 1.8, runtime: [105, 140], ratings: ['r', 'tv-ma'], craft: { world: 0.95, tension: 0.85, character: 0.8, theme: 0.8, spectacle: 0.75 }, pairsWith: ['science-fiction', 'survival', 'dystopian', 'zombie'], formats: FS },
  { id: 'procedural', name: 'Procedural', category: 'narrative', description: 'The job done properly, week after week: the method is the pleasure.', convention: 'A case closed each episode over a staff story that does not, and a competence the audience trusts.', appetite: 52, budgetIndex: 0.55, runtime: [42, 60], ratings: ['tv-14', 'tv-ma'], craft: { structure: 0.9, authenticity: 0.85, character: 0.75, dialogue: 0.75, pacing: 0.75, originality: 0.35 }, pairsWith: ['crime', 'legal', 'medical'], formats: S, television: true },
  { id: 'psychological-thriller', name: 'Psychological Thriller', category: 'genre_film', description: 'The threat is a mind: an unreliable one, a cruel one, or one coming apart.', convention: 'The audience made to doubt what they are shown, and a reveal that reframes rather than explains.', appetite: 62, budgetIndex: 0.7, runtime: [105, 130], ratings: ['r'], craft: { tension: 0.95, character: 0.9, structure: 0.85, theme: 0.8, ending: 0.85, spectacle: 0.2 }, pairsWith: ['thriller', 'mystery', 'horror', 'drama'], formats: FS },
  { id: 'reality', name: 'Reality', category: 'unscripted', description: 'Real people in a built situation, cast and cut for story.', convention: 'Casting is the writing. The format supplies the pressure and the edit supplies the arc.', appetite: 50, budgetIndex: 0.2, runtime: [42, 60], ratings: ['tv-14', 'tv-ma'], craft: { character: 0.9, pacing: 0.8, tension: 0.75, structure: 0.6, authenticity: 0.5 }, pairsWith: ['game-show', 'cooking', 'variety'], formats: S, television: true },
  { id: 'religious', name: 'Religious', category: 'narrative', description: 'Faith taken seriously as subject: belief, doubt, and what either asks of a life.', convention: 'The question honoured rather than settled in the first act.', appetite: 40, budgetIndex: 0.6, runtime: [105, 140], ratings: ['pg', 'pg-13'], craft: { theme: 0.95, emotion: 0.85, character: 0.8, authenticity: 0.8 }, pairsWith: ['drama', 'historical', 'family'], formats: FS },
  { id: 'road-movie', name: 'Road Movie', category: 'form', description: 'Structure by geography: the journey supplies the acts and the strangers supply the turns.', convention: 'A vehicle, a reason to keep moving, and a destination that turns out not to be the point.', appetite: 48, budgetIndex: 0.5, runtime: [95, 125], ratings: ['r'], craft: { character: 0.9, dialogue: 0.85, theme: 0.8, emotion: 0.8, pacing: 0.65 }, pairsWith: ['drama', 'comedy', 'crime'], formats: F },
  { id: 'romance', name: 'Romance', category: 'narrative', description: 'Two people and the distance between them: whether it closes, and what closing it costs.', convention: 'An obstacle that is real, chemistry that is written rather than cast, and a choice at the end.', appetite: 58, budgetIndex: 0.5, runtime: [100, 125], ratings: ['pg-13', 'r'], craft: { character: 0.95, emotion: 0.95, dialogue: 0.9, theme: 0.7, ending: 0.8, spectacle: 0.15 }, pairsWith: ['comedy', 'drama', 'period-drama'], formats: ALL },
  { id: 'romantic-comedy', name: 'Romantic Comedy', category: 'comedy', description: 'The romance and the jokes doing the same work: two people, badly matched, obviously matched.', convention: 'Meet, complicate, misunderstand, and a run to somewhere in the third act.', appetite: 64, budgetIndex: 0.55, runtime: [95, 115], ratings: ['pg-13', 'r'], craft: { humour: 0.9, character: 0.9, dialogue: 0.95, emotion: 0.85, originality: 0.5 }, pairsWith: ['romance', 'comedy'], formats: ALL },
  { id: 'satire', name: 'Satire', category: 'comedy', description: 'An institution or a habit of mind held up and taken apart, using comedy as the knife.', convention: 'The target must be powerful, and the film must be right about it.', appetite: 46, budgetIndex: 0.6, runtime: [100, 125], ratings: ['r', 'tv-ma'], craft: { theme: 1, humour: 0.9, dialogue: 0.9, originality: 0.85, character: 0.7 }, pairsWith: ['comedy', 'political', 'dark-comedy'], formats: ALL },
  { id: 'school', name: 'School', category: 'audience', description: 'Institutions of the young: classrooms, corridors, and hierarchies with real stakes to the people in them.', convention: 'The adult world visible but powerless, and a social order enforced without rules being stated.', appetite: 52, budgetIndex: 0.4, runtime: [95, 115], ratings: ['pg-13', 'tv-14'], craft: { character: 0.85, dialogue: 0.85, authenticity: 0.8, emotion: 0.8, humour: 0.6 }, pairsWith: ['teen', 'coming-of-age', 'comedy', 'drama'], formats: ALL, television: true },
  { id: 'science-fiction', name: 'Science Fiction', category: 'speculative', description: 'One thing changed about how the world works, and everything that follows honestly from it.', convention: 'The idea has consequences the story is obliged to follow, however inconvenient.', appetite: 74, budgetIndex: 2.0, runtime: [105, 145], ratings: ['pg-13', 'r'], craft: { premise: 0.95, world: 0.95, theme: 0.85, spectacle: 0.8, structure: 0.75, originality: 0.8 }, pairsWith: ['action', 'thriller', 'dystopian', 'space-opera'], formats: ALL },
  { id: 'slasher', name: 'Slasher', category: 'genre_film', description: 'A killer, a group, and an order of deaths. The oldest machine in horror and still the most reliable.', convention: 'Rules the audience knows, a final confrontation, and set pieces designed backwards from the kill.', appetite: 60, budgetIndex: 0.2, runtime: [85, 105], ratings: ['r'], craft: { tension: 0.9, pacing: 0.85, premise: 0.7, spectacle: 0.6, originality: 0.6, dialogue: 0.35 }, pairsWith: ['horror', 'thriller', 'teen'], formats: FS },
  { id: 'slice-of-life', name: 'Slice Of Life', category: 'narrative', description: 'Ordinary time, closely observed. Nothing enormous happens and everything is at stake anyway.', convention: 'Incident instead of plot, and an accumulation that only reads as a shape at the end.', appetite: 34, budgetIndex: 0.3, runtime: [90, 120], ratings: ['pg-13', 'r'], craft: { character: 0.95, authenticity: 0.9, dialogue: 0.85, theme: 0.8, emotion: 0.8, pacing: 0.45 }, pairsWith: ['drama', 'comedy', 'coming-of-age'], formats: ALL },
  { id: 'soap-opera', name: 'Soap Opera', category: 'narrative', description: 'Continuing serial drama at volume: families, secrets, and a story that never ends.', convention: 'Cliffhangers as punctuation, returns from the dead permitted, and an audience that watches for years.', appetite: 44, budgetIndex: 0.2, runtime: [30, 60], ratings: ['tv-14', 'tv-pg'], craft: { emotion: 0.9, character: 0.8, pacing: 0.8, dialogue: 0.7, originality: 0.25 }, pairsWith: ['melodrama', 'romance', 'drama'], formats: S, television: true },
  { id: 'space-opera', name: 'Space Opera', category: 'speculative', description: 'Adventure at the scale of star systems: fleets, empires, and personal stories against enormous distance.', convention: 'Romance and myth over hard physics, and a galaxy that feels inhabited rather than explained.', appetite: 70, budgetIndex: 3.0, runtime: [120, 155], ratings: ['pg-13'], craft: { world: 1, spectacle: 0.95, character: 0.75, premise: 0.75, theme: 0.7 }, pairsWith: ['science-fiction', 'adventure', 'epic'], formats: FS },
  { id: 'sport', name: 'Sport', category: 'narrative', description: 'The game as the arena: training, teams, and a result that stands in for everything else.', convention: 'The final match is never really about the match, and the audience must understand the rules by then.', appetite: 48, budgetIndex: 0.8, runtime: [105, 130], ratings: ['pg-13', 'r'], craft: { emotion: 0.9, character: 0.85, pacing: 0.8, authenticity: 0.8, spectacle: 0.7, ending: 0.8 }, pairsWith: ['drama', 'biography', 'comedy'], formats: ALL },
  { id: 'superhero', name: 'Superhero', category: 'speculative', description: 'Extraordinary ability and the obligation that comes with it, in a world that keeps needing saving.', convention: 'Powers with a cost, an origin that supplies the theme, and a villain who is the hero solved differently.', appetite: 76, budgetIndex: 3.0, runtime: [120, 150], ratings: ['pg-13'], craft: { spectacle: 0.95, world: 0.85, character: 0.75, pacing: 0.8, theme: 0.7, originality: 0.5 }, pairsWith: ['action', 'science-fiction', 'adventure'], formats: FS },
  { id: 'supernatural', name: 'Supernatural', category: 'speculative', description: 'The dead, the possessed and the unexplained, in a world otherwise like ours.', convention: 'Escalation from the deniable to the undeniable, and a rule system revealed by suffering it.', appetite: 62, budgetIndex: 0.6, runtime: [95, 120], ratings: ['pg-13', 'r'], craft: { tension: 0.9, world: 0.8, premise: 0.75, emotion: 0.7, pacing: 0.75 }, pairsWith: ['horror', 'mystery', 'drama'], formats: ALL },
  { id: 'survival', name: 'Survival', category: 'genre_film', description: 'One person or a few against an environment that does not care, and time running out.', convention: 'Competence and resource as plot, and a body that keeps getting worse.', appetite: 58, budgetIndex: 0.8, runtime: [95, 120], ratings: ['r'], craft: { tension: 0.95, character: 0.85, authenticity: 0.85, pacing: 0.8, spectacle: 0.6, dialogue: 0.3 }, pairsWith: ['thriller', 'adventure', 'post-apocalyptic'], formats: FS },
  { id: 'suspense', name: 'Suspense', category: 'genre_film', description: 'The audience knows more than the character, and has to watch them walk into it.', convention: 'Information given early on purpose, then withheld action for as long as it can be borne.', appetite: 60, budgetIndex: 0.8, runtime: [100, 125], ratings: ['pg-13', 'r'], craft: { tension: 1, pacing: 0.9, structure: 0.85, character: 0.7, ending: 0.8 }, pairsWith: ['thriller', 'mystery', 'horror'], formats: ALL },
  { id: 'sword-and-sorcery', name: 'Sword And Sorcery', category: 'speculative', description: 'Blades and magic at close range: mercenaries, ruins, and personal stakes rather than world-ending ones.', convention: 'Grit over grandeur, magic that is dangerous to use, and a hero motivated by something small.', appetite: 52, budgetIndex: 1.9, runtime: [105, 135], ratings: ['r'], craft: { world: 0.9, spectacle: 0.85, character: 0.7, pacing: 0.75, theme: 0.6 }, pairsWith: ['fantasy', 'adventure', 'action'], formats: FS },
  { id: 'talk-show', name: 'Talk Show', category: 'unscripted', description: 'A host, a desk or a couch, and conversation as the whole product.', convention: 'The host is the format. Booking is the writing, and the monologue sets the terms.', appetite: 40, budgetIndex: 0.15, runtime: [30, 60], ratings: ['tv-14', 'tv-pg'], craft: { humour: 0.85, dialogue: 0.9, character: 0.8, pacing: 0.75 }, pairsWith: ['variety', 'news', 'comedy'], formats: S, television: true },
  { id: 'teen', name: 'Teen', category: 'audience', description: 'Made for and about adolescence, at the volume adolescence actually happens at.', convention: 'Stakes that are enormous from inside and small from outside, treated as enormous.', appetite: 56, budgetIndex: 0.5, runtime: [95, 115], ratings: ['pg-13', 'tv-14'], craft: { character: 0.85, dialogue: 0.9, emotion: 0.85, authenticity: 0.8, humour: 0.65 }, pairsWith: ['school', 'romance', 'coming-of-age', 'comedy'], formats: ALL, television: true },
  { id: 'thriller', name: 'Thriller', category: 'genre_film', description: 'Forward pressure: a threat, a clock, and a protagonist who cannot stop moving.', convention: 'Escalation without relief, a reversal at each act break, and an antagonist with a plan of their own.', appetite: 68, budgetIndex: 0.8, runtime: [100, 130], ratings: ['pg-13', 'r'], craft: { tension: 0.95, pacing: 0.95, structure: 0.85, premise: 0.75, ending: 0.8, character: 0.7 }, pairsWith: ['crime', 'mystery', 'action', 'psychological-thriller'], formats: ALL },
  { id: 'time-travel', name: 'Time Travel', category: 'speculative', description: 'Movement through time with rules, and the consequences of breaking them.', convention: 'Pick a model of causality and never cheat it. The audience will hold the film to it.', appetite: 62, budgetIndex: 1.6, runtime: [105, 130], ratings: ['pg-13'], craft: { premise: 0.95, structure: 0.95, world: 0.85, ending: 0.85, theme: 0.75, originality: 0.8 }, pairsWith: ['science-fiction', 'romance', 'thriller'], formats: FS },
  { id: 'tokusatsu', name: 'Tokusatsu', category: 'speculative', description: 'Japanese live-action effects storytelling: suited heroes, practical monsters, and serialised transformation.', convention: 'Weekly monster, a transformation sequence that is never skipped, and merchandising built into the format.', appetite: 44, budgetIndex: 0.6, runtime: [25, 100], ratings: ['tv-y7', 'pg'], craft: { spectacle: 0.85, world: 0.8, character: 0.65, pacing: 0.75, originality: 0.5 }, pairsWith: ['kaiju', 'action', 'children'], formats: ALL, television: true },
  { id: 'tragedy', name: 'Tragedy', category: 'narrative', description: 'A person destroyed by exactly what makes them who they are, and the audience able to see it coming.', convention: 'The flaw stated early, the fall earned, and no rescue offered.', appetite: 40, budgetIndex: 0.8, runtime: [115, 150], ratings: ['r'], craft: { character: 1, theme: 0.95, emotion: 0.9, structure: 0.85, ending: 0.9, dialogue: 0.8 }, pairsWith: ['drama', 'historical', 'crime'], formats: FS },
  { id: 'true-crime', name: 'True Crime', category: 'factual', description: 'A real crime examined: what happened, who it happened to, and what the system did about it.', convention: 'The victim kept a person rather than a plot point, and sourcing that can withstand a lawyer.', appetite: 58, budgetIndex: 0.3, runtime: [45, 60], ratings: ['tv-ma', 'r'], craft: { authenticity: 1, structure: 0.85, tension: 0.8, theme: 0.75, character: 0.7 }, pairsWith: ['documentary', 'crime', 'mystery'], formats: ['documentary', 'series', 'limited_series', 'feature'] },
  { id: 'variety', name: 'Variety', category: 'unscripted', description: 'Sketches, music and guests in one show, live or as good as.', convention: 'A week to build it, one night to do it, and a running order that can change in the last hour.', appetite: 42, budgetIndex: 0.35, runtime: [60, 90], ratings: ['tv-14'], craft: { humour: 0.9, pacing: 0.85, spectacle: 0.6, dialogue: 0.75, originality: 0.6 }, pairsWith: ['comedy', 'talk-show', 'musical'], formats: S, television: true },
  { id: 'war', name: 'War', category: 'narrative', description: 'Armed conflict and the people inside it: what is asked of them, and what is left afterwards.', convention: 'Geography made legible, a unit as the unit of feeling, and violence with consequence.', appetite: 44, budgetIndex: 1.8, runtime: [120, 165], ratings: ['r'], craft: { spectacle: 0.85, authenticity: 0.9, character: 0.85, theme: 0.9, tension: 0.85, emotion: 0.8 }, pairsWith: ['drama', 'historical', 'military', 'epic'], formats: FS },
  { id: 'western', name: 'Western', category: 'genre_film', description: 'The frontier and its law: land, violence, and a civilisation arriving whether anyone wants it or not.', convention: 'Landscape as a character, a code that costs something to keep, and a reckoning in the open.', appetite: 34, budgetIndex: 1.1, runtime: [110, 145], ratings: ['r'], craft: { world: 0.9, theme: 0.9, character: 0.85, spectacle: 0.75, dialogue: 0.75, pacing: 0.6 }, pairsWith: ['drama', 'action', 'historical'], formats: FS },
  { id: 'whodunit', name: 'Whodunit', category: 'genre_film', description: 'A closed circle, a body, and a detective who names the killer in the last reel.', convention: 'Every suspect has motive and opportunity, every clue is shown, and the solution is fair.', appetite: 56, budgetIndex: 0.8, runtime: [105, 130], ratings: ['pg-13'], craft: { structure: 1, dialogue: 0.9, premise: 0.8, character: 0.75, ending: 0.95 }, pairsWith: ['mystery', 'crime', 'comedy'], formats: ALL },
  { id: 'workplace', name: 'Workplace', category: 'narrative', description: 'A job and the people stuck doing it together, where the office is the family you did not pick.', convention: 'The work is real and the comedy or drama comes from the people who have to do it.', appetite: 52, budgetIndex: 0.4, runtime: [22, 45], ratings: ['tv-14', 'tv-ma'], craft: { character: 0.9, dialogue: 0.9, humour: 0.75, authenticity: 0.85, emotion: 0.7 }, pairsWith: ['comedy', 'drama', 'mockumentary'], formats: ALL, television: true },
  { id: 'zombie', name: 'Zombie', category: 'genre_film', description: 'The dead walking and the living deciding what they are willing to do about it.', convention: 'The rules of the infection fixed early, and the other survivors as the real threat.', appetite: 56, budgetIndex: 0.7, runtime: [95, 120], ratings: ['r', 'tv-ma'], craft: { tension: 0.9, world: 0.8, character: 0.8, theme: 0.8, pacing: 0.8, spectacle: 0.7 }, pairsWith: ['horror', 'post-apocalyptic', 'survival'], formats: ALL },
];

/** Every genre id, alphabetically, which is the order the list is written in. */
export const GENRE_IDS: readonly string[] = GENRES_FULL.map((g) => g.id);

const BY_ID = new Map(GENRES_FULL.map((g) => [g.id, g]));
const BY_NAME = new Map(GENRES_FULL.map((g) => [g.name.toLowerCase(), g]));

/**
 * What earlier saves, the catalogue and ordinary speech call these. A save
 * written before the full list existed says 'science fiction', and the record
 * says 'sci-fi'; both are this genre.
 */
export const GENRE_ALIASES: Readonly<Record<string, string>> = {
  'science fiction': 'science-fiction', 'sci-fi': 'science-fiction', scifi: 'science-fiction',
  'rom-com': 'romantic-comedy', 'romantic comedy': 'romantic-comedy', romcom: 'romantic-comedy',
  'coming of age': 'coming-of-age', 'dark comedy': 'dark-comedy', 'black comedy': 'dark-comedy',
  'film noir': 'film-noir', noir: 'film-noir', 'neo noir': 'neo-noir', 'neo-noir': 'neo-noir',
  'folk horror': 'folk-horror', 'found footage': 'found-footage', 'game show': 'game-show',
  'fairy tale': 'fairy-tale', 'period drama': 'period-drama', period: 'period-drama',
  'post apocalyptic': 'post-apocalyptic', 'post-apocalypse': 'post-apocalyptic',
  'psychological thriller': 'psychological-thriller', psychological: 'psychological-thriller',
  'road movie': 'road-movie', 'slice of life': 'slice-of-life', 'soap opera': 'soap-opera', soap: 'soap-opera',
  'space opera': 'space-opera', 'sword and sorcery': 'sword-and-sorcery', 'talk show': 'talk-show',
  'time travel': 'time-travel', 'true crime': 'true-crime', 'super hero': 'superhero', 'comic book': 'superhero',
  sports: 'sport', 'sports film': 'sport', kids: 'children', childrens: 'children', "children's": 'children',
  'stand-up': 'comedy', standup: 'comedy', spy: 'espionage', 'spy thriller': 'espionage',
  scifi_action: 'science-fiction', suspense_thriller: 'suspense',
};

export function genre(id: string): GenreDef | undefined {
  const key = id.toLowerCase();
  return BY_ID.get(id) ?? BY_NAME.get(key) ?? BY_ID.get(GENRE_ALIASES[key] ?? '');
}

/** The canonical id for whatever a save, the record or a person called it. */
export function canonicalGenre(id: string): string {
  return genre(id)?.id ?? id;
}

export function genreName(id: string): string {
  return genre(id)?.name ?? id;
}

/** Genres grouped for a picker, category by category. */
export function genresByCategory(): { category: GenreCategory; label: string; genres: GenreDef[] }[] {
  const order: GenreCategory[] = ['narrative', 'comedy', 'genre_film', 'speculative', 'factual', 'unscripted', 'form', 'audience'];
  return order.map((category) => ({
    category, label: GENRE_CATEGORY_LABEL[category],
    genres: GENRES_FULL.filter((g) => g.category === category),
  })).filter((group) => group.genres.length > 0);
}

/** The genres a format is usually made in. */
export function genresForFormat(format: string): GenreDef[] {
  return GENRES_FULL.filter((g) => (g.formats as readonly string[]).includes(format));
}

/**
 * What the craft is worth on a picture in these genres: the weights blended,
 * then normalised so every genre mix is judged out of the same total.
 */
export function craftWeights(genreIds: readonly string[]): Record<CraftDimension, number> {
  const defs = genreIds.map((id) => genre(id)).filter((g): g is GenreDef => Boolean(g));
  const out = {} as Record<CraftDimension, number>;
  for (const dimension of CRAFT_DIMENSIONS) {
    const values = defs.map((d) => d.craft[dimension] ?? 0.5);
    out[dimension] = values.length === 0 ? 0.5 : values.reduce((a, b) => a + b, 0) / values.length;
  }
  const total = Object.values(out).reduce((a, b) => a + b, 0) || 1;
  for (const dimension of CRAFT_DIMENSIONS) out[dimension] = out[dimension] / total;
  return out;
}

/** The three craft dimensions that matter most to a genre mix, biggest first. */
export function craftFocus(genreIds: readonly string[], count = 3): CraftDimension[] {
  const weights = craftWeights(genreIds);
  return [...CRAFT_DIMENSIONS].sort((a, b) => weights[b] - weights[a]).slice(0, count);
}

/** Audience appetite for a genre mix, 0-100. The strongest genre leads and the rest pull toward the mean. */
export function appetiteOf(genreIds: readonly string[]): number {
  const defs = genreIds.map((id) => genre(id)).filter((g): g is GenreDef => Boolean(g));
  if (defs.length === 0) return 45;
  const sorted = defs.map((d) => d.appetite).sort((a, b) => b - a);
  const lead = sorted[0]!;
  const rest = sorted.slice(1);
  if (rest.length === 0) return lead;
  return Math.round(lead * 0.6 + (rest.reduce((a, b) => a + b, 0) / rest.length) * 0.4);
}

/** Budget index for a genre mix: the most expensive genre sets the scale. */
export function budgetIndexOf(genreIds: readonly string[]): number {
  const defs = genreIds.map((id) => genre(id)).filter((g): g is GenreDef => Boolean(g));
  if (defs.length === 0) return 0.8;
  return Math.max(...defs.map((d) => d.budgetIndex));
}

/** The usual runtime band for a genre mix, in minutes. */
export function runtimeBandOf(genreIds: readonly string[]): [number, number] {
  const defs = genreIds.map((id) => genre(id)).filter((g): g is GenreDef => Boolean(g));
  if (defs.length === 0) return [90, 120];
  return [
    Math.round(defs.reduce((a, d) => a + d.runtime[0], 0) / defs.length),
    Math.round(defs.reduce((a, d) => a + d.runtime[1], 0) / defs.length),
  ];
}

/** Genres that commonly sit beside these ones, for a picker's suggestions. */
export function suggestedPairings(genreIds: readonly string[]): GenreDef[] {
  const chosen = new Set(genreIds);
  const counts = new Map<string, number>();
  for (const id of genreIds) {
    for (const pair of genre(id)?.pairsWith ?? []) {
      if (chosen.has(pair)) continue;
      counts.set(pair, (counts.get(pair) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => genre(id))
    .filter((g): g is GenreDef => Boolean(g));
}
