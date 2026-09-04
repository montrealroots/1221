/**
 * SLATE — the real award bodies the simulation contests, and their rules.
 *
 * Every body here is one from the events data, so its name, date, city and
 * category list are the real ones. What this file adds is the eligibility
 * each body actually applies and the kind of electorate that decides it.
 * A body that is on the calendar but not in this table (the NAACP Image
 * Awards, the Grammys, the Peabodys, the guild dinners whose criteria SLATE
 * cannot model) is shown but never contested, and the interface says why.
 */

import type { BodyRules } from './award-rules';

const EUROPE = ['uk', 'ie', 'fr', 'de', 'es', 'it', 'pt', 'nl', 'be', 'lu', 'ch', 'at', 'dk', 'se', 'no', 'fi', 'is', 'pl', 'cz', 'sk', 'hu', 'ro', 'bg', 'gr', 'hr', 'si', 'rs', 'ba', 'me', 'mk', 'al', 'ee', 'lv', 'lt', 'ua', 'md', 'ge', 'am', 'tr', 'cy', 'mt', 'il'];
const ASIA = ['cn', 'hk', 'tw', 'jp', 'kr', 'in', 'th', 'vn', 'ph', 'id', 'my', 'sg', 'ir', 'kz', 'lk', 'bd', 'pk', 'np', 'mn', 'kh', 'mm', 'la', 'ae', 'sa', 'qa', 'lb', 'jo', 'iq', 'uz'];

const FILM_FORMATS: BodyRules['formats'] = ['feature', 'documentary', 'short'];
const TV_FORMATS: BodyRules['formats'] = ['series', 'limited_series', 'tv_movie', 'special'];

export const AWARD_RULES: Record<string, BodyRules> = {
  oscars: {
    voters: 'academy', window: 'calendar', release: 'theatrical', prestige: 100, slots: 5, pictureSlots: 10, campaignable: true, formats: FILM_FORMATS,
    eligibility: 'Feature films of forty minutes or more that opened for a paid, advertised run of at least seven days in one of six US metro areas during the calendar year, with a theatrical release before or alongside any streaming release; International Feature is one film submitted by each country, in a predominantly non-English dialogue track; shorts qualify through festivals or a qualifying run.',
    approximation: 'SLATE checks the calendar year, the format, a theatrical release ahead of streaming, and the language. It does not check the six metro areas, the inclusion standards, or a country\'s submission choice.',
  },
  'golden-globes': {
    voters: 'journalists', window: 'calendar', release: 'any', prestige: 84, slots: 6, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS],
    eligibility: 'Films released in the calendar year in theatres or on a streaming service, and television that aired in the calendar year; drama and musical or comedy are separate categories, and a non-English-language film competes in its own picture category.',
    approximation: 'SLATE reads drama against comedy from the genres, and the language from the production.',
  },
  'primetime-emmys': {
    voters: 'television_academy', window: 'emmy', release: 'television', prestige: 92, slots: 6, pictureSlots: 8, campaignable: true, formats: TV_FORMATS,
    eligibility: 'Programmes that aired between June 1 and May 31, on a US platform, with at least six episodes for a series and, for a limited series, at least two episodes and 150 minutes telling a complete story; a television movie is a single film of 75 minutes or more.',
    approximation: 'SLATE checks the window, the format and the episode count; it does not model the US platform requirement, treating anything released as available.',
  },
  'creative-arts-emmys': {
    voters: 'television_academy', window: 'emmy', release: 'television', prestige: 74, slots: 6, campaignable: true, formats: TV_FORMATS,
    eligibility: 'The same June-to-May window and programme rules as the Primetime Emmys; the crafts, guest performances and animation are given here.',
    approximation: 'Crafts are judged at the programme level; SLATE has no per-craft crew credits to name a winner.',
  },
  'bafta-film': {
    voters: 'academy', window: 'bafta', release: 'theatrical', prestige: 90, slots: 6, pictureSlots: 5, campaignable: true, formats: FILM_FORMATS,
    eligibility: 'Feature films released in UK cinemas between the start of the previous year and mid-February of the ceremony year, for a run of at least seven days; Outstanding British Film requires the film to be British under the BFI cultural test.',
    approximation: 'SLATE treats a release with international territories as a UK release on the same date, and reads Britishness from the production country.',
  },
  'actor-awards': {
    voters: 'actors', window: 'calendar', release: 'any', prestige: 82, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS],
    eligibility: 'Performances in films released in the calendar year and in television that aired in the calendar year, voted by SAG-AFTRA members; the cast award goes to the whole ensemble.',
  },
  'critics-choice': {
    voters: 'critics', window: 'calendar', release: 'any', prestige: 70, slots: 6, pictureSlots: 10, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS],
    eligibility: 'Films released in the calendar year and television that aired in the calendar year, voted by the members of the Critics Choice Association.',
  },
  'spirit-awards': {
    voters: 'academy', window: 'calendar', release: 'festival_or_release', prestige: 72, slots: 5, campaignable: true, formats: FILM_FORMATS, maxBudget: 30_000_000_00, notStudio: true,
    eligibility: 'American independent films with a budget under thirty million dollars that were released or premiered at a qualifying festival in the calendar year; performance categories are gender-neutral with ten nominees; the Cassavetes award is for films made for under one million.',
    approximation: 'SLATE reads independence from the budget and from the owner not being a studio; it does not weigh the "American sensibility" criterion.',
  },
  'gotham-awards': {
    voters: 'jury', window: 'calendar', release: 'festival_or_release', prestige: 66, slots: 5, campaignable: false, formats: FILM_FORMATS, maxBudget: 35_000_000_00, notStudio: true,
    eligibility: 'Independent films with a budget under thirty-five million dollars released or premiered in the calendar year, chosen by nominating committees and decided by juries; performance categories are gender-neutral.',
  },
  'gotham-tv-awards': {
    voters: 'jury', window: 'same_year', release: 'television', prestige: 56, slots: 5, campaignable: false, formats: TV_FORMATS,
    eligibility: 'Series that premiered in the twelve months before the ceremony, judged by juries; the breakthrough categories are for a series\' first season.',
  },
  'pga-awards': {
    voters: 'producers', window: 'calendar', release: 'any', prestige: 76, slots: 5, pictureSlots: 10, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS],
    eligibility: 'Films released in the calendar year and television that aired in it, with the producers of the work as the nominees, decided on a preferential ballot.',
  },
  'dga-awards': {
    voters: 'directors', window: 'calendar', release: 'any', prestige: 80, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS],
    eligibility: 'Directing in films released in the calendar year and television that aired in it, under a DGA agreement; a first-time feature director has a category of their own.',
    approximation: 'SLATE does not model guild jurisdiction; every production is treated as signatory.',
  },
  'wga-awards': {
    voters: 'writers', window: 'calendar', release: 'any', prestige: 70, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS],
    eligibility: 'Scripts written under a WGA agreement for films released in the calendar year and television that aired in it.',
    approximation: 'SLATE does not model guild jurisdiction; every script is treated as covered.',
  },
  'ace-eddies': { voters: 'craft_guild', window: 'calendar', release: 'any', prestige: 56, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], eligibility: 'Editing in films released in the calendar year and television that aired in it.', approximation: 'Judged at the film level; SLATE has no editor credits.' },
  'adg-awards': { voters: 'craft_guild', window: 'calendar', release: 'any', prestige: 54, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], eligibility: 'Production design in films released in the calendar year and television that aired in it, in period, fantasy and contemporary categories.', approximation: 'Judged at the film level; SLATE reads period and fantasy from the genres.' },
  'asc-awards': { voters: 'craft_guild', window: 'calendar', release: 'any', prestige: 58, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], eligibility: 'Cinematography in films released in the calendar year and television that aired in it.', approximation: 'Judged at the film level; SLATE has no cinematographer credits.' },
  'ves-awards': { voters: 'craft_guild', window: 'calendar', release: 'any', prestige: 56, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], eligibility: 'Visual effects in films released in the calendar year and television that aired in it.', approximation: 'Judged at the film level.' },
  'cas-awards': { voters: 'craft_guild', window: 'calendar', release: 'any', prestige: 52, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], eligibility: 'Sound mixing in films released in the calendar year and television that aired in it.', approximation: 'Judged at the film level.' },
  'golden-reels': { voters: 'craft_guild', window: 'calendar', release: 'any', prestige: 52, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], eligibility: 'Sound editing in films released in the calendar year and television that aired in it.', approximation: 'Judged at the film level.' },
  artios: { voters: 'craft_guild', window: 'calendar', release: 'any', prestige: 54, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], eligibility: 'Casting in films released in the calendar year and television that aired in it, by budget band.', approximation: 'Judged at the film level; SLATE reads the budget band from the budget.' },
  'cdg-awards': { voters: 'craft_guild', window: 'calendar', release: 'any', prestige: 54, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], eligibility: 'Costume design in films released in the calendar year and television that aired in it, in contemporary, period and fantasy categories.', approximation: 'Judged at the film level.' },
  'muahs-awards': { voters: 'craft_guild', window: 'calendar', release: 'any', prestige: 50, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], eligibility: 'Make-up and hair styling in films released in the calendar year and television that aired in it.', approximation: 'Judged at the film level.' },
  'annie-awards': {
    voters: 'animators', window: 'calendar', release: 'any', prestige: 66, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], animatedOnly: true,
    eligibility: 'Animated films released in the calendar year and animated television that aired in it; the independent feature category is for films without a major studio.',
  },
  'saturn-awards': {
    voters: 'genre_fans', window: 'calendar', release: 'any', prestige: 48, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], genres: ['science fiction', 'fantasy', 'horror', 'action', 'adventure', 'thriller', 'animation', 'superhero'],
    eligibility: 'Science fiction, fantasy, horror, action, adventure and thriller films and television released in the calendar year.',
  },
  razzies: {
    voters: 'razzie_voters', window: 'calendar', release: 'theatrical', prestige: 0, slots: 5, campaignable: false, formats: ['feature'],
    eligibility: 'Films that opened wide in the calendar year and were badly reviewed; the worst-reviewed and most-seen are the ones that get named.',
  },
  'kids-choice-awards': { voters: 'audience', window: 'calendar', release: 'any', prestige: 40, slots: 6, campaignable: false, formats: [...FILM_FORMATS, ...TV_FORMATS], eligibility: 'Films and television released in the year before the show, voted by kids online.' },
  'peoples-choice-awards': { voters: 'audience', window: 'calendar', release: 'any', prestige: 44, slots: 8, campaignable: false, formats: [...FILM_FORMATS, ...TV_FORMATS], eligibility: 'Films and television released in the calendar year, voted by the public online.' },
  nbr: { voters: 'critics', window: 'calendar', release: 'any', prestige: 58, slots: 1, campaignable: false, announcesWinnersDirectly: true, formats: FILM_FORMATS, eligibility: 'Films released in the calendar year, decided by the Board\'s members and announced in early December.' },
  nyfcc: { voters: 'critics', window: 'calendar', release: 'any', prestige: 62, slots: 1, campaignable: false, announcesWinnersDirectly: true, formats: FILM_FORMATS, eligibility: 'Films released in the calendar year, voted in one sitting by the Circle\'s members in early December.' },
  lafca: { voters: 'critics', window: 'calendar', release: 'any', prestige: 60, slots: 1, campaignable: false, announcesWinnersDirectly: true, formats: FILM_FORMATS, eligibility: 'Films released in the calendar year in Los Angeles, voted in one sitting by the Association\'s members in early December.' },
  'tca-awards': { voters: 'critics', window: 'same_year', release: 'television', prestige: 58, slots: 6, campaignable: false, formats: TV_FORMATS, eligibility: 'Television that aired in the twelve months to the end of May, voted by the members of the Television Critics Association.' },
  'bafta-tv': { voters: 'academy', window: 'calendar', release: 'television', prestige: 78, slots: 4, campaignable: true, formats: TV_FORMATS, countries: ['uk'], eligibility: 'Programmes first broadcast in the UK in the calendar year; the international category is for non-UK series.', approximation: 'SLATE reads a UK broadcast from the production country, and admits other countries\' series only to the international category.' },
  'international-emmys': { voters: 'jury', window: 'calendar', release: 'television', prestige: 66, slots: 4, campaignable: true, formats: TV_FORMATS, eligibility: 'Television produced and first aired outside the United States in the calendar year, judged by international juries.' },
  'cesar-awards': { voters: 'academy', window: 'calendar', release: 'theatrical', prestige: 84, slots: 5, pictureSlots: 5, campaignable: true, formats: FILM_FORMATS, countries: ['fr'], eligibility: 'French films released in French cinemas in the calendar year, voted by the members of the Académie; the foreign film category is for everyone else.', approximation: 'SLATE reads French from the production country.' },
  'goya-awards': { voters: 'academy', window: 'calendar', release: 'theatrical', prestige: 80, slots: 5, pictureSlots: 5, campaignable: true, formats: FILM_FORMATS, countries: ['es'], eligibility: 'Spanish films released in Spanish cinemas in the calendar year; Ibero-American and European films have categories of their own.' },
  'european-film-awards': { voters: 'academy', window: 'calendar', release: 'any', prestige: 74, slots: 5, campaignable: true, formats: FILM_FORMATS, countries: EUROPE, eligibility: 'European films released in the calendar year, voted by the members of the European Film Academy.' },
  'aacta-awards': { voters: 'academy', window: 'calendar', release: 'any', prestige: 70, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], countries: ['au'], eligibility: 'Australian films and television released in the calendar year; the international awards are for the rest of the world.' },
  'canadian-screen-awards': { voters: 'academy', window: 'calendar', release: 'any', prestige: 66, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], countries: ['ca'], eligibility: 'Canadian films and television released in the calendar year.' },
  'japan-academy-prize': { voters: 'academy', window: 'calendar', release: 'theatrical', prestige: 78, slots: 5, campaignable: true, formats: FILM_FORMATS, countries: ['jp'], eligibility: 'Japanese films released in Japanese cinemas in the calendar year; the foreign film category is for everyone else.' },
  'golden-horse-awards': { voters: 'jury', window: 'calendar', release: 'any', prestige: 80, slots: 5, campaignable: true, formats: FILM_FORMATS, languages: ['zh'], eligibility: 'Chinese-language films released in the year before the awards, judged by a jury.' },
  'hong-kong-film-awards': { voters: 'academy', window: 'calendar', release: 'theatrical', prestige: 74, slots: 5, campaignable: true, formats: FILM_FORMATS, countries: ['hk'], eligibility: 'Hong Kong films released in Hong Kong cinemas in the calendar year.' },
  'blue-dragon-awards': { voters: 'critics', window: 'calendar', release: 'theatrical', prestige: 76, slots: 5, campaignable: true, formats: FILM_FORMATS, countries: ['kr'], eligibility: 'Korean films released in the year, voted by critics and film professionals.' },
  'baeksang-arts-awards': { voters: 'critics', window: 'same_year', release: 'any', prestige: 76, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], countries: ['kr'], eligibility: 'Korean films and television from the twelve months to the end of March.' },
  'filmfare-awards': { voters: 'journalists', window: 'calendar', release: 'theatrical', prestige: 70, slots: 5, campaignable: true, formats: FILM_FORMATS, languages: ['hi'], eligibility: 'Hindi-language films released in the calendar year.' },
  'david-di-donatello': { voters: 'academy', window: 'same_year', release: 'theatrical', prestige: 76, slots: 5, campaignable: true, formats: FILM_FORMATS, countries: ['it'], eligibility: 'Italian films released in Italian cinemas in the twelve months to the end of February.' },
  bifa: { voters: 'jury', window: 'calendar', release: 'festival_or_release', prestige: 64, slots: 5, campaignable: true, formats: FILM_FORMATS, countries: ['uk'], maxBudget: 20_000_000_00, notStudio: true, eligibility: 'British independent films released or premiered in the twelve months to the end of November, chosen by juries.' },
  'german-film-awards': { voters: 'academy', window: 'same_year', release: 'theatrical', prestige: 70, slots: 6, campaignable: true, formats: FILM_FORMATS, countries: ['de'], eligibility: 'German films released in German cinemas in the twelve months before the awards.' },
  'ariel-awards': { voters: 'academy', window: 'calendar', release: 'any', prestige: 66, slots: 5, campaignable: true, formats: FILM_FORMATS, countries: ['mx'], eligibility: 'Mexican films released in the calendar year; the Ibero-American category is for the rest of the region.' },
  'asian-film-awards': { voters: 'academy', window: 'calendar', release: 'any', prestige: 66, slots: 5, campaignable: true, formats: FILM_FORMATS, countries: ASIA, eligibility: 'Asian films released in the calendar year.' },
  'irish-film-tv-awards': { voters: 'academy', window: 'calendar', release: 'any', prestige: 58, slots: 5, campaignable: true, formats: [...FILM_FORMATS, ...TV_FORMATS], countries: ['ie'], eligibility: 'Irish films and television released in the calendar year.' },
  'magritte-awards': { voters: 'academy', window: 'calendar', release: 'theatrical', prestige: 58, slots: 5, campaignable: true, formats: FILM_FORMATS, countries: ['be'], eligibility: 'Belgian French-language films released in the calendar year; Flemish films have one category.' },
  'golden-rooster-awards': { voters: 'jury', window: 'calendar', release: 'theatrical', prestige: 68, slots: 5, campaignable: true, formats: FILM_FORMATS, countries: ['cn'], eligibility: 'Mainland Chinese films released in the year, judged by a jury of the China Film Association.' },
  'astra-film-awards': { voters: 'critics', window: 'calendar', release: 'any', prestige: 44, slots: 6, campaignable: false, formats: FILM_FORMATS, eligibility: 'Films released in the calendar year, voted by the members of the Hollywood Creative Alliance.' },
  'astra-tv-awards': { voters: 'critics', window: 'same_year', release: 'television', prestige: 40, slots: 6, campaignable: false, formats: TV_FORMATS, eligibility: 'Television that aired in the twelve months to the end of May.' },
  'cinema-eye-honors': { voters: 'jury', window: 'calendar', release: 'any', prestige: 52, slots: 5, campaignable: false, formats: ['documentary', 'short'], documentaryOnly: true, eligibility: 'Nonfiction films released or premiered in the calendar year, chosen by nominating committees of documentary makers.' },
  'ida-awards': { voters: 'jury', window: 'calendar', release: 'any', prestige: 54, slots: 5, campaignable: true, formats: ['documentary', 'short'], documentaryOnly: true, eligibility: 'Documentaries released or premiered in the twelve months to the end of September.' },
  'critics-choice-documentary': { voters: 'critics', window: 'calendar', release: 'any', prestige: 50, slots: 6, campaignable: false, formats: ['documentary', 'short'], documentaryOnly: true, eligibility: 'Documentaries released in the twelve months to the end of September, voted by the Critics Choice Association.' },
};

/** The bodies on the calendar SLATE does not contest, and why. */
export const NOT_CONTESTED: Record<string, string> = {
  'naacp-image-awards': 'The Image Awards honour work by and about people of colour. SLATE does not record ethnicity, so it cannot judge eligibility honestly and does not pretend to.',
  grammys: 'SLATE does not model music, so it cannot judge a score or a song against the year\'s records.',
  'peabody-awards': 'The Peabodys are given for stories that matter, by unanimous vote of a board. SLATE does not model journalism or public service and does not contest them.',
  'news-doc-emmys': 'News and current affairs are outside the simulation.',
  'sports-emmys': 'Sports coverage is outside the simulation.',
  'hmma': 'SLATE does not model music.',
  'scl-awards': 'SLATE does not model music.',
  'lmgi-awards': 'SLATE does not model location work in enough detail to judge it.',
  'sdsa-awards': 'SLATE does not model set decoration separately from production design.',
  'critics-choice-black-cinema': 'A tribute evening rather than a competition, for work by Black creators, which SLATE does not record.',
  'childrens-family-emmys': 'SLATE does not model children\'s programming as a category of its own, so it cannot judge these honestly.',
  'daytime-emmys': 'SLATE does not model daytime programming.',
  'afi-awards': 'The AFI names ten films and ten programmes rather than voting a competition. SLATE lists it and does not simulate it.',
};

/** What the older, fictional bodies were called, so a save\'s history still reads. */
export const LEGACY_BODY_NAMES: Record<string, string> = {
  vanguard: 'The Vanguard Awards',
  continental: 'The Continental Awards',
  beacon: 'The Beacon Awards',
  performers_guild: 'The Performers Guild Awards',
  writers_guild: 'The Writers Guild Prize',
  directors_guild: 'The Directors Guild Medal',
  critics_circle: 'The National Critics Circle Awards',
};
