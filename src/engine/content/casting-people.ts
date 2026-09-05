/**
 * SLATE — the casting directors, from the record.
 *
 * Everybody here is a real casting director, confirmed against Wikidata as
 * holding that occupation, and everything stated about them was read off the
 * public record rather than recalled: their dates, their nationality, the
 * awards they have won and the work they are known for all come from their
 * own entries and the encyclopaedia articles attached to them.
 *
 * Where the record disagrees with itself — two birth years for the same
 * person, a date that cannot be right — the field is left empty rather than
 * guessed at. Where it is silent, the field is absent. Nothing about a real
 * person is invented here, and nothing that happens to them inside a save is
 * a claim about them: an office's slate, its taste and its opinion of the
 * player are simulation, and are labelled as simulation wherever they show.
 *
 * The offices themselves are named the way the business names them — a
 * casting director's own name over the door — except where the record gives
 * the real company, which it does for Telsey + Company.
 */

export interface CastingDirectorRecord {
  id: string;
  /** Wikidata item, so anything here can be checked. */
  qid: string;
  name: string;
  /** As the record has it. Absent when the record is silent or contradicts itself. */
  born?: number;
  died?: number;
  gender: 'man' | 'woman';
  /** Citizenship as the record states it. */
  country?: string;
  /** Where they work from, in the record's own words. */
  where: string;
  /**
   * The same places as city ids, for the ones the map resolves. A city the
   * registry does not carry synchronously is left out of this and stays in
   * `where`, rather than being moved somewhere it is not.
   */
  cityIds: readonly string[];
  /** What the record says they are known for. */
  knownFor: string;
  /** Awards the record attaches to them. */
  awards: readonly string[];
  /** The office they run, from the record where it names one. */
  office: string;
  /** True when the office name is the record's, rather than the convention of a name over the door. */
  officeNamed?: boolean;
}

export const CASTING_DIRECTORS: readonly CastingDirectorRecord[] = [
  { id: 'nina-gold', qid: 'Q26704294', name: 'Nina Gold', born: 1967, gender: 'woman', country: 'United Kingdom', where: 'London', cityIds: ['uk-eng-london'], knownFor: 'Rome and Game of Thrones for HBO, The Crown for Netflix, The Day of the Jackal, and features including Les Misérables, The Martian, The Two Popes, Conclave and five Star Wars pictures.', awards: [], office: 'Nina Gold Casting' },
  { id: 'francine-maisler', qid: 'Q119930103', name: 'Francine Maisler', gender: 'woman', country: 'United States', where: 'Los Angeles', cityIds: ['us-ca-losangeles'], knownFor: 'Nominated for the first Academy Award for Achievement in Casting, at the 98th Academy Awards, for Sinners. Two Primetime Emmys and five further nominations for casting.', awards: ['Academy Award nomination (Casting)', 'Primetime Emmy Award'], office: 'Francine Maisler Casting' },
  { id: 'john-papsidera', qid: 'Q6251863', name: 'John Papsidera', gender: 'man', where: 'Los Angeles', cityIds: ['us-ca-losangeles'], knownFor: 'Film and television across a long association with Christopher Nolan, and work with Ruben Fleischer, Jason Reitman, Roland Emmerich and James Gunn.', awards: [], office: 'John Papsidera Casting' },
  { id: 'ellen-lewis', qid: 'Q24257011', name: 'Ellen Lewis', gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'The Queen’s Gambit, The Devil Wears Prada, A League of Their Own, Forrest Gump, and a long association with Martin Scorsese from Goodfellas and Casino through The Departed, The Wolf of Wall Street and The Irishman.', awards: [], office: 'Ellen Lewis Casting' },
  { id: 'debra-zane', qid: 'Q5248532', name: 'Debra Zane', gender: 'woman', where: 'Los Angeles', cityIds: ['us-ca-losangeles'], knownFor: 'Film and television with Steven Spielberg, Ridley Scott and Steven Soderbergh. Fourteen Artios nominations and three wins.', awards: ['Artios Award'], office: 'Debra Zane Casting' },
  { id: 'avy-kaufman', qid: 'Q4829580', name: 'Avy Kaufman', born: 1954, gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'Film and television casting.', awards: ['Primetime Emmy Award'], office: 'Avy Kaufman Casting' },
  { id: 'juliet-taylor', qid: 'Q3811138', name: 'Juliet Taylor', gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'More than a hundred pictures, including forty-three of Woody Allen’s. Six-time Casting Society of America award winner.', awards: ['Academy Honorary Award', 'Casting Society of America Award'], office: 'Juliet Taylor Casting' },
  { id: 'allison-jones', qid: 'Q4732769', name: 'Allison Jones', born: 1955, gender: 'woman', country: 'United States', where: 'Los Angeles', cityIds: ['us-ca-losangeles'], knownFor: 'Ensemble comedy: The Fresh Prince of Bel-Air, Freaks and Geeks, Curb Your Enthusiasm, Undeclared, Arrested Development and the American version of The Office.', awards: ['Primetime Emmy Award'], office: 'Allison Jones Casting' },
  { id: 'ellen-chenoweth', qid: 'Q5364783', name: 'Ellen Chenoweth', gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'Diner, where she cast a room of then-unknowns, and Terms of Endearment a year later.', awards: [], office: 'Ellen Chenoweth Casting' },
  { id: 'april-webster', qid: 'Q4782091', name: 'April Webster', gender: 'woman', where: 'Los Angeles', cityIds: ['us-ca-losangeles'], knownFor: 'Film and television, including several projects with J. J. Abrams. Thirteen Artios nominations, three wins, four Emmy nominations.', awards: ['Artios Award'], office: 'April Webster Casting' },
  { id: 'jeanne-mccarthy', qid: 'Q95733977', name: 'Jeanne McCarthy', gender: 'woman', where: 'Los Angeles', cityIds: ['us-ca-losangeles'], knownFor: 'Six Primetime Emmy nominations for casting, winning for The People v. O. J. Simpson: American Crime Story.', awards: ['Primetime Emmy Award'], office: 'Jeanne McCarthy Casting' },
  { id: 'jennifer-euston', qid: 'Q17541219', name: 'Jennifer Euston', born: 1974, gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'Orange Is the New Black, for which she won the Primetime Emmy for casting in 2014.', awards: ['Primetime Emmy Award'], office: 'Jennifer Euston Casting' },
  { id: 'cindy-tolan', qid: 'Q115930459', name: 'Cindy Tolan', gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'Theatre first, then film and television. BAFTA for casting West Side Story, for which the office saw thirty thousand people to build a cast of performers of Latin descent.', awards: ['BAFTA Award for Best Casting'], office: 'Cindy Tolan Casting' },
  { id: 'susan-shopmaker', qid: 'Q124823276', name: 'Susan Shopmaker', gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'Independent film. BAFTA for Best Casting for The Holdovers in 2024.', awards: ['BAFTA Award for Best Casting'], office: 'Susan Shopmaker Casting' },
  { id: 'jennifer-venditti', qid: 'Q130305800', name: 'Jennifer Venditti', born: 1971, gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'Nominated for the first Academy Award for Achievement in Casting, at the 98th Academy Awards, for Marty Supreme.', awards: ['Academy Award nomination (Casting)'], office: 'Jennifer Venditti Casting' },
  { id: 'bonnie-timmermann', qid: 'Q113859949', name: 'Bonnie Timmermann', born: 1947, gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'Miami Vice, and a continuing association with Michael Mann across film and television.', awards: [], office: 'Bonnie Timmermann Casting' },
  { id: 'marci-liroff', qid: 'Q6757070', name: 'Marci Liroff', born: 1958, gender: 'woman', country: 'United States', where: 'Los Angeles', cityIds: ['us-ca-losangeles'], knownFor: 'Film and television casting; also works as an intimacy coordinator and acting coach.', awards: [], office: 'Marci Liroff Casting' },
  { id: 'mindy-marin', qid: 'Q3314796', name: 'Mindy Marin', born: 1960, gender: 'woman', country: 'United States', where: 'Santa Monica, California', cityIds: ['us-ca-santamonica'], knownFor: 'Casting, producing and writing, out of Santa Monica.', awards: [], office: 'Mindy Marin Casting' },
  { id: 'georgianne-walken', qid: 'Q5548129', name: 'Georgianne Walken', born: 1944, gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'A long casting career in film and television, now retired from it.', awards: [], office: 'Walken Casting' },
  { id: 'bernard-telsey', qid: 'Q16193891', name: 'Bernard Telsey', born: 1960, gender: 'man', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'Broadway and film out of the same office: Rent, Wicked, In the Heights, South Pacific and Hairspray among the stage work. Co-founder of MCC Theater.', awards: [], office: 'Telsey + Company', officeNamed: true },
  { id: 'pat-moran', qid: 'Q123995549', name: 'Pat Moran', gender: 'woman', country: 'United States', where: 'Baltimore, Maryland', cityIds: [], knownFor: 'Baltimore casting, three Emmy Awards, and a place among John Waters’s Dreamlanders since early in her career.', awards: ['Primetime Emmy Award'], office: 'Pat Moran Casting' },
  { id: 'fiona-weir', qid: 'Q5451130', name: 'Fiona Weir', gender: 'woman', country: 'United Kingdom', where: 'London', cityIds: ['uk-eng-london'], knownFor: 'The Harry Potter pictures with David Yates, and Love Actually, Boy A and The Golden Compass. Emmy-nominated for The Girl in the Café.', awards: [], office: 'Fiona Weir Casting' },
  { id: 'susie-figgis', qid: 'Q95711822', name: 'Susie Figgis', born: 1948, died: 2025, gender: 'woman', country: 'United Kingdom', where: 'London', cityIds: ['uk-eng-london'], knownFor: 'Harry Potter and the Philosopher’s Stone, The Full Monty and The Killing Fields.', awards: [], office: 'Susie Figgis Casting' },
  { id: 'des-hamilton', qid: 'Q104843728', name: 'Des Hamilton', gender: 'man', country: 'United Kingdom', where: 'London', cityIds: ['uk-eng-london'], knownFor: 'Street casting since Morvern Callar for Lynne Ramsay, where the non-actress he found went on to win a BAFTA.', awards: [], office: 'Des Hamilton Casting' },
  { id: 'nancy-bishop', qid: 'Q16727527', name: 'Nancy Bishop', born: 1966, gender: 'woman', country: 'United States', where: 'London and Prague', cityIds: ['uk-eng-london', 'cz-52-prague'], knownFor: 'International casting run from two offices, in London and in Prague.', awards: [], office: 'Nancy Bishop Casting' },
  { id: 'nikki-barrett', qid: 'Q125230778', name: 'Nikki Barrett', gender: 'woman', country: 'Australia', where: 'Sydney', cityIds: ['au-nsw-sydney'], knownFor: 'Australian casting; won the British Academy Film Award for Best Casting for Elvis.', awards: ['BAFTA Award for Best Casting'], office: 'Nikki Barrett Casting' },
  { id: 'mukesh-chhabra', qid: 'Q17180547', name: 'Mukesh Chhabra', gender: 'man', country: 'India', where: 'Mumbai', cityIds: ['in-16-mumbai'], knownFor: 'Bajrangi Bhaijaan, Bombay Velvet, Dangal, Dil Bechara, Scam 1992, Laal Singh Chaddha, Jawan and Dunki.', awards: [], office: 'Mukesh Chhabra Casting Company' },
  { id: 'lynn-stalmaster', qid: 'Q3269565', name: 'Lynn Stalmaster', born: 1927, died: 2021, gender: 'man', country: 'United States', where: 'Los Angeles', cityIds: ['us-ca-losangeles'], knownFor: 'The first casting director to receive an Academy Award, an Honorary Oscar in 2016.', awards: ['Academy Honorary Award'], office: 'Lynn Stalmaster & Associates' },
  { id: 'marion-dougherty', qid: 'Q6765176', name: 'Marion Dougherty', born: 1923, died: 2011, gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'The World of Henry Orient, Midnight Cowboy, The Panic in Needle Park, Grease, Urban Cowboy, The World According to Garp and Batman. The subject of the documentary Casting By.', awards: [], office: 'Marion Dougherty Associates' },
  { id: 'mali-finn', qid: 'Q529470', name: 'Mali Finn', born: 1938, died: 2007, gender: 'woman', country: 'United States', where: 'Los Angeles', cityIds: ['us-ca-losangeles'], knownFor: 'Cast Edward Furlong, Brad Renfro, Leonardo DiCaprio and Russell Crowe into the films that made them.', awards: [], office: 'Mali Finn Casting' },
  { id: 'joanna-merlin', qid: 'Q1690817', name: 'Joanna Merlin', born: 1931, died: 2023, gender: 'woman', country: 'United States', where: 'New York', cityIds: ['us-ny-newyork'], knownFor: 'Actress and casting director; worked with Stephen Sondheim, was in the original Broadway Fiddler on the Roof, and taught graduate acting at New York University.', awards: [], office: 'Joanna Merlin Casting' },
];

export const CASTING_DIRECTOR_BY_ID: Readonly<Record<string, CastingDirectorRecord>> =
  Object.fromEntries(CASTING_DIRECTORS.map((c) => [c.id, c]));

/** The offices working in a city, for a production casting there. */
export function castingDirectorsIn(cityId: string, at?: { year: number }): CastingDirectorRecord[] {
  return CASTING_DIRECTORS.filter((c) => {
    if (!c.cityIds.includes(cityId)) return false;
    // Somebody who has died is not casting your picture.
    if (at && c.died !== undefined && c.died < at.year) return false;
    return true;
  });
}

/** Everybody the record says is still working, for a save set in a given year. */
export function workingCastingDirectors(year: number): CastingDirectorRecord[] {
  return CASTING_DIRECTORS.filter((c) => c.died === undefined || c.died >= year);
}

/**
 * What the player is told about where any of this came from.
 *
 * Shown wherever a real casting director appears, for the same reason the
 * rest of the real-people screens carry it: the record is the record, and the
 * save is the save.
 */
export const CASTING_RECORD_NOTE =
  'Casting directors are real people, confirmed against the public record. Their dates, nationality, awards and known work come from it. Everything that happens with them inside your save is simulation.';
