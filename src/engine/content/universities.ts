/**
 * SLATE — universities.
 *
 * Unlike schools, these are real. There are a few thousand universities in
 * the world rather than a few million schools, they are a matter of public
 * record, and which town each one stands in is not in dispute. So the name,
 * the town and the year it was founded are real here.
 *
 * What is not real is everything about you and it: whether it would take you,
 * what it charges, what a term is like and what you come out with. Those are
 * SLATE's own, and the page says so.
 *
 * One thing to know about the towns. SLATE's gazetteer carries the world's
 * larger cities rather than every town, so a university in a smaller place —
 * Oxford, New Haven, Heidelberg — carries its real town on its own row and is
 * reached from the nearest carried city. The row never claims the university
 * is in that city.
 */

export const UNIVERSITY_NOTE =
  'The universities are real, and so are the towns they stand in and the years they were founded. '
  + 'Everything about you and them is SLATE’s own: how hard one is to get into, what it charges, what '
  + 'a term does to you and what you leave with. Where a university stands in a town smaller than '
  + 'SLATE’s gazetteer carries, its real town is named on its own row and it’s reached from the '
  + 'nearest city the gazetteer has — it’s never claimed to be in that city.';

/** Fields a university is known for. Used to say what it is good at, not to rank it. */
export type Field =
  | 'film' | 'drama' | 'humanities' | 'law' | 'medicine' | 'engineering' | 'science'
  | 'business' | 'economics' | 'art' | 'music' | 'architecture' | 'education' | 'sport';

export const FIELD_LABEL: Readonly<Record<Field, string>> = {
  film: 'Film And Television', drama: 'Drama', humanities: 'Humanities', law: 'Law',
  medicine: 'Medicine', engineering: 'Engineering', science: 'Science', business: 'Business',
  economics: 'Economics', art: 'Art And Design', music: 'Music', architecture: 'Architecture',
  education: 'Education', sport: 'Sport Science',
};

export interface University {
  id: string;
  /** Its real name. */
  name: string;
  /** The town it really stands in. */
  town: string;
  /** The city in SLATE's gazetteer it is reached from. */
  cityId: string;
  countryId: string;
  /** The year it was founded. Public record. */
  founded: number;
  /**
   * How hard it is to get in, out of a hundred. SLATE's own reading of a
   * public reputation, not a ranking and not an admissions statistic.
   */
  selectivity: number;
  strengths: readonly Field[];
  about: string;
}

const u = (
  id: string, name: string, town: string, cityId: string, countryId: string, founded: number,
  selectivity: number, strengths: readonly Field[], about: string,
): University => ({ id, name, town, cityId, countryId, founded, selectivity, strengths, about });

export const UNIVERSITIES: readonly University[] = [
  // --- United Kingdom and Ireland -----------------------------------------
  u('oxford', 'University of Oxford', 'Oxford', 'uk-eng-london', 'uk', 1096, 97, ['humanities', 'law', 'medicine', 'science'], 'The oldest university in the English-speaking world, and it teaches one to one.'),
  u('cambridge', 'University of Cambridge', 'Cambridge', 'uk-eng-london', 'uk', 1209, 97, ['science', 'engineering', 'humanities', 'medicine'], 'Founded by scholars who left Oxford after a quarrel, and never conceded the point.'),
  u('imperial', 'Imperial College London', 'London', 'uk-eng-london', 'uk', 1907, 93, ['engineering', 'science', 'medicine'], 'Science and engineering, and almost nothing else.'),
  u('lse', 'London School of Economics and Political Science', 'London', 'uk-eng-london', 'uk', 1895, 93, ['economics', 'law', 'business'], 'A social science school on Houghton Street with an outsized influence on how countries are run.'),
  u('ucl', 'University College London', 'London', 'uk-eng-london', 'uk', 1826, 89, ['humanities', 'medicine', 'architecture', 'science', 'law'], 'The first English university to admit students of any religion, and the first to admit women on equal terms.'),
  u('kcl', 'King’s College London', 'London', 'uk-eng-london', 'uk', 1829, 85, ['law', 'medicine', 'humanities'], 'On the Strand, and it has been arguing with University College since both were founded.'),
  u('rada', 'Royal Academy of Dramatic Art', 'London', 'uk-eng-london', 'uk', 1904, 96, ['drama'], 'A drama school in Bloomsbury that takes about thirty people a year onto its acting course.'),
  u('lamda', 'London Academy of Music and Dramatic Art', 'London', 'uk-eng-london', 'uk', 1861, 94, ['drama', 'music'], 'The oldest drama school in Britain, and it’s as hard to get into as it sounds.'),
  u('nfts', 'National Film and Television School', 'Beaconsfield', 'uk-eng-london', 'uk', 1971, 92, ['film'], 'A film school on a studio lot, and the graduate courses are what people come for.'),
  u('rcm', 'Royal College of Music', 'London', 'uk-eng-london', 'uk', 1882, 91, ['music'], 'A conservatoire opposite the Albert Hall.'),
  u('csm', 'Central Saint Martins', 'London', 'uk-eng-london', 'uk', 1989, 88, ['art'], 'Part of the University of the Arts London, and the fashion course is the one people mean.'),
  u('manchester', 'University of Manchester', 'Manchester', 'uk-eng-manchester', 'uk', 1824, 78, ['science', 'engineering', 'business', 'humanities'], 'Where the atom was first split, and one of the largest single-site universities in Britain.'),
  u('edinburgh', 'University of Edinburgh', 'Edinburgh', 'uk-sct-glasgow', 'uk', 1583, 87, ['humanities', 'medicine', 'science', 'law'], 'On the hill in the old town, and it has been there since the sixteenth century.'),
  u('glasgow', 'University of Glasgow', 'Glasgow', 'uk-sct-glasgow', 'uk', 1451, 79, ['medicine', 'humanities', 'law', 'engineering'], 'The fourth oldest university in the English-speaking world, in a building that looks the part.'),
  u('standrews', 'University of St Andrews', 'St Andrews', 'uk-sct-glasgow', 'uk', 1413, 88, ['humanities', 'science', 'sport'], 'The oldest in Scotland, in a small town on the North Sea, and the golf is next door.'),
  u('birmingham', 'University of Birmingham', 'Birmingham', 'uk-eng-birmingham', 'uk', 1900, 76, ['engineering', 'medicine', 'business', 'sport'], 'The first of the English civic universities to get a charter of its own.'),
  u('warwick', 'University of Warwick', 'Coventry', 'uk-eng-birmingham', 'uk', 1965, 82, ['economics', 'business', 'engineering', 'drama'], 'Sixties, and the economics and the theater studies are both taken very seriously.'),
  u('tcd', 'Trinity College Dublin', 'Dublin', 'ie-lei-dublin', 'ie', 1592, 84, ['humanities', 'law', 'medicine', 'science'], 'Behind the railings on College Green, with the Book of Kells in the library.'),
  u('ucd', 'University College Dublin', 'Dublin', 'ie-lei-dublin', 'ie', 1854, 76, ['business', 'medicine', 'engineering', 'humanities'], 'The largest university in Ireland, out at Belfield.'),
  u('ucc', 'University College Cork', 'Cork', 'ie-m-cork', 'ie', 1845, 70, ['humanities', 'science', 'medicine'], 'On the River Lee, and the quadrangle is the picture on the prospectus.'),

  // --- United States --------------------------------------------------------
  u('harvard', 'Harvard University', 'Cambridge, Massachusetts', 'us-ma-boston', 'us', 1636, 98, ['law', 'business', 'medicine', 'humanities'], 'The oldest university in the United States, across the river from Boston.'),
  u('mit', 'Massachusetts Institute of Technology', 'Cambridge, Massachusetts', 'us-ma-boston', 'us', 1861, 97, ['engineering', 'science', 'economics'], 'Across the Charles, and it’s engineering all the way down.'),
  u('yale', 'Yale University', 'New Haven', 'us-ny-newyork', 'us', 1701, 97, ['law', 'drama', 'humanities'], 'Its drama school has produced an implausible number of the people you have heard of.'),
  u('princeton', 'Princeton University', 'Princeton', 'us-ny-newyork', 'us', 1746, 97, ['humanities', 'science', 'economics'], 'Small, rich, and almost entirely undergraduate.'),
  u('columbia', 'Columbia University', 'New York', 'us-ny-manhattan', 'us', 1754, 94, ['law', 'business', 'film', 'humanities'], 'In Morningside Heights, and the film school is in the city that shoots.'),
  u('nyu', 'New York University', 'New York', 'us-ny-manhattan', 'us', 1831, 89, ['film', 'drama', 'business', 'law'], 'The Tisch School of the Arts is here, and so is half of what came out of American independent film.'),
  u('juilliard', 'The Juilliard School', 'New York', 'us-ny-manhattan', 'us', 1905, 96, ['music', 'drama'], 'At Lincoln Center, and the drama division takes about eighteen people a year.'),
  u('usc', 'University of Southern California', 'Los Angeles', 'us-ca-losangeles', 'us', 1880, 88, ['film', 'business', 'engineering', 'sport'], 'The School of Cinematic Arts is the oldest film school in the country and sits half an hour from every studio.'),
  u('ucla', 'University of California, Los Angeles', 'Los Angeles', 'us-ca-losangeles', 'us', 1919, 89, ['film', 'drama', 'medicine', 'sport'], 'In Westwood, with a film school of its own and a great deal of sport.'),
  u('caltech', 'California Institute of Technology', 'Pasadena', 'us-ca-losangeles', 'us', 1891, 97, ['science', 'engineering'], 'Under a thousand undergraduates, and it runs the Jet Propulsion Laboratory.'),
  u('afi', 'American Film Institute Conservatory', 'Los Angeles', 'us-ca-losangeles', 'us', 1969, 93, ['film'], 'A graduate conservatory in the hills above Los Feliz, and only film.'),
  u('calarts', 'California Institute of the Arts', 'Valencia, California', 'us-ca-losangeles', 'us', 1961, 87, ['film', 'art', 'drama', 'music'], 'Founded by Walt Disney, and the animation program is why most people apply.'),
  u('stanford', 'Stanford University', 'Stanford', 'us-ca-sanfrancisco', 'us', 1885, 97, ['engineering', 'business', 'science', 'law'], 'On the peninsula, and the road out of it runs through most of the technology industry.'),
  u('berkeley', 'University of California, Berkeley', 'Berkeley', 'us-ca-sanfrancisco', 'us', 1868, 92, ['engineering', 'science', 'economics', 'law'], 'The oldest campus of the University of California, and the loudest.'),
  u('ucsd', 'University of California, San Diego', 'La Jolla', 'us-ca-sandiego', 'us', 1960, 84, ['science', 'medicine', 'drama'], 'On the cliffs at La Jolla, and its theater department is far better known than the setting suggests.'),
  u('chicago', 'University of Chicago', 'Chicago', 'us-il-chicago', 'us', 1890, 95, ['economics', 'law', 'humanities'], 'Where fun goes to die, according to the students, and where a great deal of economics was decided.'),
  u('northwestern', 'Northwestern University', 'Evanston', 'us-il-chicago', 'us', 1851, 91, ['drama', 'film', 'business', 'law'], 'On Lake Michigan, and the theater program has an alumni list that reads like a call sheet.'),
  u('emory', 'Emory University', 'Atlanta', 'us-ga-atlanta', 'us', 1836, 85, ['medicine', 'law', 'business'], 'In Druid Hills, and closely tied to the Centers for Disease Control next door.'),
  u('georgiatech', 'Georgia Institute of Technology', 'Atlanta', 'us-ga-atlanta', 'us', 1885, 86, ['engineering', 'science', 'sport'], 'Engineering in midtown, and the football is taken seriously.'),
  u('utaustin', 'University of Texas at Austin', 'Austin', 'us-tx-austin', 'us', 1883, 80, ['film', 'engineering', 'business', 'sport'], 'Enormous, and its film program sits in a city that shoots a great deal.'),
  u('rice', 'Rice University', 'Houston', 'us-tx-houston', 'us', 1912, 90, ['engineering', 'science', 'architecture'], 'Small and well endowed, in a park in the middle of Houston.'),
  u('miami', 'University of Miami', 'Coral Gables', 'us-fl-miami', 'us', 1925, 76, ['music', 'medicine', 'sport', 'business'], 'Its music school is one of the better ones, and so is the football team.'),
  u('washington', 'University of Washington', 'Seattle', 'us-wa-seattle', 'us', 1861, 80, ['medicine', 'engineering', 'science'], 'On Lake Washington, with a medical school that draws from five states.'),
  u('vanderbilt', 'Vanderbilt University', 'Nashville', 'us-tn-nashville', 'us', 1873, 90, ['medicine', 'law', 'education', 'music'], 'In the middle of Nashville, and the campus is an arboretum.'),
  u('tulane', 'Tulane University', 'New Orleans', 'us-la-neworleans', 'us', 1834, 82, ['medicine', 'law', 'architecture'], 'Uptown on St Charles Avenue, and the streetcar goes past it.'),
  u('georgetown', 'Georgetown University', 'Washington', 'us-dc-washington', 'us', 1789, 89, ['law', 'economics', 'humanities'], 'The oldest Catholic university in the country, and the foreign service school is the draw.'),
  u('penn', 'University of Pennsylvania', 'Philadelphia', 'us-pa-philadelphia', 'us', 1740, 94, ['business', 'medicine', 'law'], 'Wharton is here, and so is a great deal of medicine.'),
  u('asu', 'Arizona State University', 'Tempe', 'us-az-phoenix', 'us', 1885, 62, ['business', 'engineering', 'film', 'sport'], 'One of the largest universities in America by enrolment, and it takes most people who apply.'),
  u('colorado', 'University of Colorado Boulder', 'Boulder', 'us-co-denver', 'us', 1876, 70, ['science', 'engineering', 'sport'], 'At the foot of the Flatirons, and a great deal of atmospheric science happens here.'),
  u('unlv', 'University of Nevada, Las Vegas', 'Las Vegas', 'us-nv-lasvegas', 'us', 1957, 58, ['business', 'sport', 'film'], 'A city university with a hospitality school built for the city it’s in.'),
  u('hawaii', 'University of Hawaii at Manoa', 'Honolulu', 'us-hi-honolulu', 'us', 1907, 62, ['science', 'humanities', 'sport'], 'In the Manoa valley, and the oceanography is world class for obvious reasons.'),
  u('unc', 'University of North Carolina at Chapel Hill', 'Chapel Hill', 'us-nc-charlotte', 'us', 1789, 82, ['medicine', 'law', 'sport', 'education'], 'The oldest public university in the country, depending on who you ask, and the basketball is a religion.'),
  u('ohiostate', 'Ohio State University', 'Columbus', 'us-oh-columbus', 'us', 1870, 70, ['engineering', 'business', 'sport', 'medicine'], 'Vast, and the stadium holds a hundred thousand people.'),
  u('indiana', 'Indiana University Bloomington', 'Bloomington', 'us-in-indianapolis', 'us', 1820, 71, ['music', 'business', 'sport'], 'The Jacobs School of Music is one of the largest in the world.'),
  u('smu', 'Southern Methodist University', 'Dallas', 'us-tx-dallas', 'us', 1911, 76, ['business', 'law', 'film', 'drama'], 'In University Park, and its theater program punches well above the school’s size.'),
  u('portlandstate', 'Portland State University', 'Portland', 'us-or-portland', 'us', 1946, 55, ['education', 'business', 'art'], 'Downtown, and most of the students work while they study.'),
  u('unm', 'University of New Mexico', 'Albuquerque', 'us-nm-santafe', 'us', 1889, 56, ['science', 'art', 'medicine'], 'Adobe buildings, and a great deal of southwestern art history.'),
  u('sanjosestate', 'San José State University', 'San Jose', 'us-ca-sanjose', 'us', 1857, 55, ['engineering', 'business', 'education'], 'The oldest public university in California, and it feeds the valley around it.'),

  // --- Canada ---------------------------------------------------------------
  u('toronto', 'University of Toronto', 'Toronto', 'ca-on-toronto', 'ca', 1827, 88, ['medicine', 'law', 'engineering', 'humanities'], 'The largest university in Canada, and insulin was worked out here.'),
  u('ubc', 'University of British Columbia', 'Vancouver', 'ca-bc-vancouver', 'ca', 1908, 84, ['film', 'science', 'business', 'sport'], 'On Point Grey, and the city around it shoots more film than almost anywhere.'),
  u('mcgill', 'McGill University', 'Montreal', 'ca-qc-montreal', 'ca', 1821, 86, ['medicine', 'law', 'music', 'science'], 'On the slope of Mount Royal, and it teaches in English in a French city.'),
  u('ryerson', 'Toronto Metropolitan University', 'Toronto', 'ca-on-toronto', 'ca', 1948, 68, ['film', 'business', 'engineering'], 'Downtown, with a media school that sits inside the Canadian industry.'),
  u('calgary', 'University of Calgary', 'Calgary', 'ca-01-calgary', 'ca', 1966, 68, ['engineering', 'business', 'medicine'], 'Built for the energy industry, and it still is.'),
  u('ottawa', 'University of Ottawa', 'Ottawa', 'ca-08-ottawa', 'ca', 1848, 70, ['law', 'medicine', 'humanities'], 'The largest bilingual university in the world, a short walk from Parliament.'),

  // --- Australia and New Zealand -------------------------------------------
  u('melbourne', 'University of Melbourne', 'Melbourne', 'au-vic-melbourne', 'au', 1853, 87, ['law', 'medicine', 'drama', 'humanities'], 'Its drama school, the VCA, is where most Australian actors of note started.'),
  u('sydney', 'University of Sydney', 'Sydney', 'au-nsw-sydney', 'au', 1850, 86, ['law', 'medicine', 'humanities', 'architecture'], 'The oldest university in Australia, in a sandstone quadrangle.'),
  u('nida', 'National Institute of Dramatic Art', 'Sydney', 'au-nsw-sydney', 'au', 1958, 95, ['drama', 'film'], 'A conservatoire in Kensington that takes about two dozen actors a year out of thousands.'),
  u('unsw', 'University of New South Wales', 'Sydney', 'au-nsw-sydney', 'au', 1949, 83, ['engineering', 'business', 'law', 'art'], 'Engineering and business, and the art school is separate and good.'),
  u('anu', 'Australian National University', 'Canberra', 'au-nsw-sydney', 'au', 1946, 85, ['science', 'economics', 'humanities'], 'Founded as a research university and it still behaves like one.'),
  u('queensland', 'University of Queensland', 'Brisbane', 'au-04-brisbane', 'au', 1909, 81, ['medicine', 'science', 'sport'], 'At St Lucia, in a bend of the Brisbane River.'),
  u('uwa', 'University of Western Australia', 'Perth', 'au-08-perth', 'au', 1911, 78, ['medicine', 'engineering', 'humanities'], 'Limestone and jacarandas on the Swan River.'),
  u('adelaide', 'University of Adelaide', 'Adelaide', 'au-05-adelaide', 'au', 1874, 74, ['medicine', 'science', 'music'], 'The Elder Conservatorium here is the oldest music school in Australia.'),
  u('auckland', 'University of Auckland', 'Auckland', 'nz-akl-auckland', 'nz', 1883, 76, ['engineering', 'business', 'medicine'], 'The largest university in New Zealand, in the middle of the city.'),
  u('otago', 'University of Otago', 'Dunedin', 'nz-e9-christchurch', 'nz', 1869, 74, ['medicine', 'science', 'humanities'], 'The oldest in New Zealand, and the medical school is the country’s main one.'),
  u('victoriawellington', 'Victoria University of Wellington', 'Wellington', 'nz-wgn-wellington', 'nz', 1897, 70, ['film', 'law', 'humanities'], 'In the hills above the harbor, in the city where the film industry actually is.'),

  // --- Continental Europe ---------------------------------------------------
  u('sorbonne', 'Sorbonne University', 'Paris', 'fr-idf-paris', 'fr', 1257, 84, ['humanities', 'science', 'medicine'], 'The name carries eight centuries and the institution has been reorganised more than once.'),
  u('psl', 'Université PSL', 'Paris', 'fr-idf-paris', 'fr', 2010, 88, ['science', 'humanities', 'art', 'economics'], 'A grouping of the grandes écoles, including the École Normale Supérieure.'),
  u('femis', 'La Fémis', 'Paris', 'fr-idf-paris', 'fr', 1986, 94, ['film'], 'The French national film school, and it takes about sixty people a year.'),
  u('sciencespo', 'Sciences Po', 'Paris', 'fr-idf-paris', 'fr', 1872, 88, ['economics', 'law', 'humanities'], 'Politics and public affairs, and most of the French establishment went through it.'),
  u('polytechnique', 'École Polytechnique', 'Palaiseau', 'fr-idf-paris', 'fr', 1794, 93, ['engineering', 'science'], 'Founded in the Revolution and still formally under the Ministry of the Armed Forces.'),
  u('lyon2', 'Université Lumière Lyon 2', 'Lyon', 'fr-84-lyon', 'fr', 1973, 62, ['humanities', 'film', 'economics'], 'In the city where the Lumière brothers made the first films, and it teaches cinema.'),
  u('aixmarseille', 'Aix-Marseille University', 'Marseille', 'fr-93-marseille', 'fr', 1409, 64, ['humanities', 'science', 'law'], 'The largest French-speaking university in the world by enrolment.'),
  u('lmu', 'Ludwig Maximilian University of Munich', 'Munich', 'de-02-munich', 'de', 1472, 84, ['humanities', 'medicine', 'science', 'law'], 'In the middle of Munich, and it has been there since before Bavaria was a kingdom.'),
  u('tum', 'Technical University of Munich', 'Munich', 'de-02-munich', 'de', 1868, 86, ['engineering', 'science', 'medicine'], 'The engineering university of southern Germany, and it charges almost nothing.'),
  u('hff', 'University of Television and Film Munich', 'Munich', 'de-02-munich', 'de', 1966, 88, ['film'], 'A state film school, tuition free, and very hard to get into.'),
  u('humboldt', 'Humboldt University of Berlin', 'Berlin', 'de-be-berlin', 'de', 1810, 82, ['humanities', 'science', 'law'], 'The model most research universities in the world were built on.'),
  u('fuberlin', 'Free University of Berlin', 'Berlin', 'de-be-berlin', 'de', 1948, 79, ['humanities', 'science', 'economics'], 'Founded in the western sectors when the old university ended up in the east.'),
  u('dffb', 'German Film and Television Academy Berlin', 'Berlin', 'de-be-berlin', 'de', 1966, 87, ['film'], 'A small film academy on Potsdamer Platz.'),
  u('hamburg', 'University of Hamburg', 'Hamburg', 'de-04-hamburg', 'de', 1919, 72, ['humanities', 'law', 'science'], 'The largest research and education institution in northern Germany.'),
  u('cologne', 'University of Cologne', 'Cologne', 'de-07-koln', 'de', 1388, 74, ['economics', 'law', 'medicine'], 'One of the oldest in Europe, refounded in 1919 after Napoleon closed it.'),
  u('eth', 'ETH Zurich', 'Zurich', 'ch-zh-zurich', 'ch', 1855, 93, ['engineering', 'science', 'architecture'], 'Einstein studied and later taught here, and it charges Swiss residents very little.'),
  u('unige', 'University of Geneva', 'Geneva', 'ch-ge-geneva', 'ch', 1559, 78, ['law', 'science', 'humanities'], 'Founded by Calvin as a seminary, and it stopped being one.'),
  u('basel', 'University of Basel', 'Basel', 'ch-bs-basel', 'ch', 1460, 76, ['medicine', 'science', 'humanities'], 'The oldest university in Switzerland.'),
  u('bocconi', 'Bocconi University', 'Milan', 'it-09-milan', 'it', 1902, 85, ['economics', 'business', 'law'], 'A private economics university, and the Italian business establishment came through it.'),
  u('politomilano', 'Polytechnic University of Milan', 'Milan', 'it-09-milan', 'it', 1863, 80, ['engineering', 'architecture', 'art'], 'Engineering and design, and the design school is why Milan is Milan.'),
  u('sapienza', 'Sapienza University of Rome', 'Rome', 'it-laz-rome', 'it', 1303, 72, ['humanities', 'medicine', 'engineering'], 'One of the largest universities in Europe by enrolment.'),
  u('csc', 'Centro Sperimentale di Cinematografia', 'Rome', 'it-laz-rome', 'it', 1935, 88, ['film', 'drama'], 'The Italian national film school, on the road out to Cinecittà.'),
  u('bologna', 'University of Bologna', 'Bologna', 'it-09-milan', 'it', 1088, 78, ['law', 'humanities', 'medicine'], 'Generally reckoned the oldest university in continuous operation anywhere.'),
  u('naples', 'University of Naples Federico II', 'Naples', 'it-04-naples', 'it', 1224, 68, ['law', 'engineering', 'humanities'], 'Founded by an emperor to train his own administrators, which was new at the time.'),
  u('complutense', 'Complutense University of Madrid', 'Madrid', 'es-md-madrid', 'es', 1293, 70, ['humanities', 'law', 'medicine', 'film'], 'The largest university in Spain, with a well known audiovisual communication faculty.'),
  u('ie', 'IE University', 'Segovia', 'es-md-madrid', 'es', 1973, 80, ['business', 'law', 'architecture'], 'A private business university, taught largely in English.'),
  u('ub', 'University of Barcelona', 'Barcelona', 'es-cat-barcelona', 'es', 1450, 74, ['medicine', 'humanities', 'science'], 'In the Eixample, and the main building is a landmark in its own right.'),
  u('esade', 'ESADE', 'Barcelona', 'es-cat-barcelona', 'es', 1958, 82, ['business', 'law'], 'A business and law school with a long international list.'),
  u('lisbon', 'University of Lisbon', 'Lisbon', 'pt-14-lisbon', 'pt', 1911, 70, ['humanities', 'engineering', 'medicine'], 'The largest in Portugal, tracing a line back to a studium founded in 1290.'),
  u('porto', 'University of Porto', 'Porto', 'pt-17-porto', 'pt', 1911, 70, ['engineering', 'medicine', 'architecture'], 'And its architecture school produced two Pritzker winners.'),
  u('amsterdam', 'University of Amsterdam', 'Amsterdam', 'nl-07-amsterdam', 'nl', 1632, 80, ['humanities', 'economics', 'law', 'film'], 'Spread through the canal houses of the old city.'),
  u('delft', 'Delft University of Technology', 'Delft', 'nl-11-thehague', 'nl', 1842, 85, ['engineering', 'architecture', 'science'], 'The largest technical university in the Netherlands.'),
  u('erasmus', 'Erasmus University Rotterdam', 'Rotterdam', 'nl-11-rotterdam', 'nl', 1913, 78, ['economics', 'business', 'medicine'], 'Named for Erasmus, and known for economics and medicine.'),
  u('leuven', 'KU Leuven', 'Leuven', 'be-bru-brussels', 'be', 1425, 83, ['medicine', 'engineering', 'humanities'], 'The oldest Catholic university still operating anywhere.'),
  u('ghent', 'Ghent University', 'Ghent', 'be-vlg-gent', 'be', 1817, 76, ['science', 'medicine', 'humanities'], 'Founded by William I when this was still the United Kingdom of the Netherlands.'),
  u('vienna', 'University of Vienna', 'Vienna', 'at-09-vienna', 'at', 1365, 76, ['humanities', 'law', 'medicine'], 'The oldest university in the German-speaking world.'),
  u('mdw', 'University of Music and Performing Arts Vienna', 'Vienna', 'at-09-vienna', 'at', 1817, 89, ['music', 'drama', 'film'], 'One of the largest music universities in the world, and the Max Reinhardt Seminar teaches acting.'),
  u('ku', 'University of Copenhagen', 'Copenhagen', 'dk-17-copenhagen', 'dk', 1479, 82, ['medicine', 'humanities', 'science'], 'The oldest and largest in Denmark, and tuition free for Europeans.'),
  u('danishfilm', 'National Film School of Denmark', 'Copenhagen', 'dk-17-copenhagen', 'dk', 1966, 90, ['film'], 'A very small state film school, and Dogme came out of the people who went through it.'),
  u('lund', 'Lund University', 'Lund', 'se-27-malmo', 'se', 1666, 78, ['humanities', 'engineering', 'law'], 'One of the oldest in Scandinavia, in a small town with a cathedral.'),
  u('kth', 'KTH Royal Institute of Technology', 'Stockholm', 'se-26-stockholm', 'se', 1827, 80, ['engineering', 'architecture', 'science'], 'The largest technical university in Sweden.'),
  u('stockholmarts', 'Stockholm University of the Arts', 'Stockholm', 'se-26-stockholm', 'se', 2014, 84, ['drama', 'film', 'art'], 'A merger of the old acting, dance, circus and film schools of Sweden.'),
  u('oslo', 'University of Oslo', 'Oslo', 'no-12-oslo', 'no', 1811, 78, ['humanities', 'law', 'medicine'], 'The oldest in Norway, and the Nobel Peace Prize committee meets in its old library.'),
  u('helsinki', 'University of Helsinki', 'Helsinki', 'fi-01-helsinki', 'fi', 1640, 80, ['humanities', 'science', 'medicine'], 'The oldest and largest in Finland, and tuition free for Europeans.'),
  u('aalto', 'Aalto University', 'Espoo', 'fi-01-espoo', 'fi', 2010, 79, ['art', 'engineering', 'business', 'film'], 'A merger of the technology, business and art schools, and the film department is well regarded.'),
  u('uw', 'University of Warsaw', 'Warsaw', 'pl-78-warsaw', 'pl', 1816, 74, ['humanities', 'law', 'science'], 'The largest in Poland, on the Royal Route.'),
  u('lodzfilm', 'National Film School in Lodz', 'Lodz', 'pl-78-warsaw', 'pl', 1948, 88, ['film'], 'Polanski, Kieslowski and Wajda all came through it.'),
  u('jagiellonian', 'Jagiellonian University', 'Krakow', 'pl-77-krakow', 'pl', 1364, 76, ['humanities', 'medicine', 'law'], 'The oldest in Poland, and Copernicus was a student.'),
  u('charles', 'Charles University', 'Prague', 'cz-52-prague', 'cz', 1348, 76, ['medicine', 'humanities', 'law'], 'The oldest university in central Europe.'),
  u('famu', 'Film and TV School of the Academy of Performing Arts in Prague', 'Prague', 'cz-52-prague', 'cz', 1946, 85, ['film'], 'One of the oldest film schools in the world, and Forman went through it.'),
  u('elte', 'Eötvös Loránd University', 'Budapest', 'hu-05-budapest', 'hu', 1635, 72, ['humanities', 'science', 'law'], 'The largest in Hungary, on the Pest side of the river.'),
  u('nka', 'National Kapodistrian University of Athens', 'Athens', 'gr-esye31-athens', 'gr', 1837, 70, ['humanities', 'law', 'medicine'], 'The first university of the modern Greek state.'),
  u('bucharest', 'University of Bucharest', 'Bucharest', 'ro-10-bucharest', 'ro', 1864, 66, ['humanities', 'law', 'science'], 'The largest in Romania.'),
  u('msu', 'Lomonosov Moscow State University', 'Moscow', 'ru-48-moscow', 'ru', 1755, 84, ['science', 'humanities', 'engineering'], 'In the Stalin tower on the Sparrow Hills.'),
  u('vgik', 'Gerasimov Institute of Cinematography', 'Moscow', 'ru-48-moscow', 'ru', 1919, 86, ['film', 'drama'], 'The oldest film school in the world, founded two years after the revolution.'),
  u('spbu', 'Saint Petersburg State University', 'Saint Petersburg', 'ru-66-saintpetersburg', 'ru', 1724, 80, ['humanities', 'science', 'law'], 'Founded by Peter the Great, and it produced a long line of Nobel laureates.'),
  u('knu', 'Taras Shevchenko National University of Kyiv', 'Kyiv', 'ua-12-kyiv', 'ua', 1834, 70, ['humanities', 'law', 'science'], 'The largest in Ukraine, in the red building on Volodymyrska Street.'),

  // --- Asia -----------------------------------------------------------------
  u('todai', 'University of Tokyo', 'Tokyo', 'jp-13-tokyo', 'jp', 1877, 95, ['law', 'engineering', 'science', 'humanities'], 'The hardest university in Japan to get into, and most of the civil service went through it.'),
  u('waseda', 'Waseda University', 'Tokyo', 'jp-13-tokyo', 'jp', 1882, 87, ['humanities', 'law', 'business', 'film'], 'Private, enormous, and it has a theater museum modeled on the Fortune.'),
  u('keio', 'Keio University', 'Tokyo', 'jp-13-tokyo', 'jp', 1858, 87, ['economics', 'law', 'medicine'], 'The oldest private university in Japan.'),
  u('geidai', 'Tokyo University of the Arts', 'Tokyo', 'jp-13-tokyo', 'jp', 1887, 91, ['art', 'music', 'film'], 'The only national arts university in Japan, and its graduate film school is in Yokohama.'),
  u('kyotoU', 'Kyoto University', 'Kyoto', 'jp-22-kyoto', 'jp', 1897, 93, ['science', 'humanities', 'medicine'], 'Second only to Tokyo, and it has produced most of Japan’s science Nobel laureates.'),
  u('osakaU', 'Osaka University', 'Osaka', 'jp-32-osaka', 'jp', 1931, 87, ['engineering', 'medicine', 'science'], 'Traces its line to a merchant academy founded in 1724.'),
  u('snu', 'Seoul National University', 'Seoul', 'kr-11-seoul', 'kr', 1946, 94, ['law', 'engineering', 'medicine', 'humanities'], 'The top of the Korean system, and the competition to get in shapes the whole school system beneath it.'),
  u('korea', 'Korea University', 'Seoul', 'kr-11-seoul', 'kr', 1905, 88, ['law', 'business', 'humanities'], 'One of the three that Korean students mean when they say the top three.'),
  u('yonsei', 'Yonsei University', 'Seoul', 'kr-11-seoul', 'kr', 1885, 88, ['medicine', 'business', 'humanities'], 'Founded by missionaries, and the other of the three.'),
  u('kafa', 'Korean Academy of Film Arts', 'Seoul', 'kr-11-seoul', 'kr', 1984, 89, ['film'], 'A tiny state film academy, and a great deal of Korean cinema came out of it.'),
  u('tsinghua', 'Tsinghua University', 'Beijing', 'cn-22-beijing', 'cn', 1911, 95, ['engineering', 'science', 'architecture', 'business'], 'The engineering university of China, and a great many of its leaders studied here.'),
  u('peking', 'Peking University', 'Beijing', 'cn-22-beijing', 'cn', 1898, 95, ['humanities', 'science', 'law', 'economics'], 'On a former imperial garden, and the other half of the pair everybody names.'),
  u('bfa', 'Beijing Film Academy', 'Beijing', 'cn-22-beijing', 'cn', 1950, 90, ['film', 'drama'], 'The largest film school in Asia, and the fifth generation of Chinese directors came out of one class of it.'),
  u('fudan', 'Fudan University', 'Shanghai', 'cn-23-shanghai', 'cn', 1905, 92, ['medicine', 'economics', 'humanities'], 'In Yangpu, and the name means heaven and earth renewing themselves.'),
  u('sjtu', 'Shanghai Jiao Tong University', 'Shanghai', 'cn-23-shanghai', 'cn', 1896, 92, ['engineering', 'medicine', 'business'], 'Engineering, and it runs one of the better medical schools in China.'),
  u('hku', 'University of Hong Kong', 'Hong Kong', 'hk-hongkongisland', 'hk', 1911, 89, ['medicine', 'law', 'humanities'], 'On Bonham Road, and the oldest in Hong Kong.'),
  u('cuhk', 'Chinese University of Hong Kong', 'Hong Kong', 'hk-newterritories', 'hk', 1963, 86, ['business', 'medicine', 'humanities'], 'On a hillside in Sha Tin with its own railway station.'),
  u('ntu', 'National Taiwan University', 'Taipei', 'tw-04-taipei', 'tw', 1928, 88, ['engineering', 'medicine', 'law'], 'The top of the Taiwanese system, on Roosevelt Road.'),
  u('nus', 'National University of Singapore', 'Singapore', 'sg-singapore', 'sg', 1905, 92, ['engineering', 'business', 'law', 'medicine'], 'The oldest and largest in Singapore, at Kent Ridge.'),
  u('ntusg', 'Nanyang Technological University', 'Singapore', 'sg-singapore', 'sg', 1981, 90, ['engineering', 'business', 'art', 'film'], 'And its art, design and media school teaches film.'),
  u('iitb', 'Indian Institute of Technology Bombay', 'Mumbai', 'in-16-mumbai', 'in', 1958, 96, ['engineering', 'science'], 'One place for every hundred and more who sit the entrance examination.'),
  u('iitd', 'Indian Institute of Technology Delhi', 'Delhi', 'in-07-delhi', 'in', 1961, 96, ['engineering', 'science'], 'At Hauz Khas, and just as hard to get into.'),
  u('ftii', 'Film and Television Institute of India', 'Pune', 'in-16-pune', 'in', 1960, 90, ['film', 'drama'], 'On the old Prabhat studio lot, and much of Indian art cinema came through it.'),
  u('nsd', 'National School of Drama', 'Delhi', 'in-07-delhi', 'in', 1959, 89, ['drama'], 'A repertory company attached to a school, and it takes about twenty people a year.'),
  u('du', 'University of Delhi', 'Delhi', 'in-07-delhi', 'in', 1922, 78, ['humanities', 'economics', 'law'], 'A federation of colleges, and the cut-off marks for the good ones are famously brutal.'),
  u('iisc', 'Indian Institute of Science', 'Bengaluru', 'in-19-bengaluru', 'in', 1909, 93, ['science', 'engineering'], 'Founded with Tata money, and it’s a research institute more than a university.'),
  u('jnu', 'Jawaharlal Nehru University', 'Delhi', 'in-07-delhi', 'in', 1969, 82, ['humanities', 'economics', 'education'], 'Largely postgraduate, and famous for its politics.'),
  u('cu', 'University of Calcutta', 'Kolkata', 'in-28-kolkata', 'in', 1857, 72, ['humanities', 'science', 'law'], 'One of the first three modern universities in India.'),
  u('lums', 'Lahore University of Management Sciences', 'Lahore', 'pk-04-lahore', 'pk', 1984, 84, ['business', 'economics', 'law'], 'A private university in Lahore with a hard entrance examination.'),
  u('du_dhaka', 'University of Dhaka', 'Dhaka', 'bd-81-dhaka', 'bd', 1921, 74, ['humanities', 'law', 'science'], 'The oldest in Bangladesh, and central to the country’s political history.'),
  u('chula', 'Chulalongkorn University', 'Bangkok', 'th-40-bangkok', 'th', 1917, 82, ['engineering', 'medicine', 'humanities'], 'The oldest in Thailand, named for the king who founded it.'),
  u('um', 'University of Malaya', 'Kuala Lumpur', 'my-14-kualalumpur', 'my', 1949, 76, ['medicine', 'engineering', 'law'], 'The oldest in Malaysia.'),
  u('ui', 'University of Indonesia', 'Depok', 'id-30-depok', 'id', 1849, 76, ['medicine', 'law', 'economics'], 'The oldest in Indonesia, on a wooded campus south of Jakarta.'),
  u('up', 'University of the Philippines Diliman', 'Quezon City', 'ph-ncr-quezoncity', 'ph', 1908, 80, ['humanities', 'engineering', 'film'], 'And its film institute is where most Filipino directors trained.'),
  u('vnu', 'Vietnam National University, Hanoi', 'Hanoi', 'vn-01-hanoi', 'vn', 1906, 74, ['science', 'humanities', 'engineering'], 'The oldest modern university in Vietnam.'),
  u('technion', 'Technion Israel Institute of Technology', 'Haifa', 'il-05-telaviv', 'il', 1912, 87, ['engineering', 'science', 'medicine'], 'Older than the state it’s in.'),
  u('tau', 'Tel Aviv University', 'Tel Aviv', 'il-05-telaviv', 'il', 1956, 84, ['film', 'law', 'medicine', 'humanities'], 'And its film and television school is the main one in the country.'),
  u('huji', 'Hebrew University of Jerusalem', 'Jerusalem', 'il-06-jerusalem', 'il', 1918, 85, ['science', 'law', 'humanities'], 'On Mount Scopus, and Einstein was on its first board of governors.'),
  u('boun', 'Boğaziçi University', 'Istanbul', 'tr-34-istanbul', 'tr', 1863, 86, ['engineering', 'economics', 'humanities'], 'On the Bosphorus, taught in English, and the hardest in Turkey to get into.'),
  u('itu', 'Istanbul Technical University', 'Istanbul', 'tr-34-istanbul', 'tr', 1773, 80, ['engineering', 'architecture'], 'One of the oldest technical universities anywhere.'),
  u('ku_kuwait', 'Kuwait University', 'Kuwait City', 'qa-01-doha', 'qa', 1966, 62, ['engineering', 'law', 'medicine'], 'The national university of Kuwait, reached from the Gulf cities SLATE carries.'),
  u('aud', 'American University in Dubai', 'Dubai', 'ae-du-dubai', 'ae', 1995, 62, ['business', 'engineering', 'art'], 'An American curriculum university in Media City.'),
  u('kau', 'King Abdulaziz University', 'Jeddah', 'sa-14-jeddah', 'sa', 1967, 66, ['engineering', 'medicine', 'business'], 'One of the largest universities in the Gulf.'),
  u('ksu', 'King Saud University', 'Riyadh', 'sa-10-riyadh', 'sa', 1957, 68, ['medicine', 'engineering', 'law'], 'The first university in Saudi Arabia.'),

  // --- Africa ---------------------------------------------------------------
  u('cairo', 'Cairo University', 'Giza', 'eg-08-giza', 'eg', 1908, 72, ['law', 'medicine', 'humanities'], 'The largest in Egypt, and a great deal of the Arab world’s public life came through it.'),
  u('auc', 'American University in Cairo', 'Cairo', 'eg-11-cairo', 'eg', 1919, 78, ['humanities', 'business', 'film'], 'Taught in English, out in New Cairo, with a film program of its own.'),
  u('uct', 'University of Cape Town', 'Cape Town', 'za-11-capetown', 'za', 1829, 84, ['medicine', 'law', 'film', 'humanities'], 'Under Devil’s Peak, and its film and media studies school is the best known in Africa.'),
  u('wits', 'University of the Witwatersrand', 'Johannesburg', 'za-06-johannesburg', 'za', 1922, 82, ['engineering', 'medicine', 'law', 'drama'], 'And its drama school has a long list behind it.'),
  u('pretoria', 'University of Pretoria', 'Pretoria', 'za-06-pretoria', 'za', 1908, 74, ['engineering', 'law', 'medicine', 'sport'], 'The largest residential university in South Africa.'),
  u('ukzn', 'University of KwaZulu-Natal', 'Durban', 'za-02-durban', 'za', 2004, 68, ['medicine', 'science', 'humanities'], 'A merger of two older universities, spread over five campuses.'),
  u('ui_ibadan', 'University of Ibadan', 'Ibadan', 'ng-32-ibadan', 'ng', 1948, 74, ['medicine', 'humanities', 'law'], 'The oldest university in Nigeria, and Soyinka and Achebe both passed through it.'),
  u('unilag', 'University of Lagos', 'Lagos', 'ng-05-lagos', 'ng', 1962, 72, ['law', 'business', 'engineering', 'film'], 'On the Lagos lagoon, in the city Nollywood works out of.'),
  u('nairobi', 'University of Nairobi', 'Nairobi', 'ke-05-nairobi', 'ke', 1970, 70, ['medicine', 'engineering', 'law'], 'The oldest and largest in Kenya.'),
  u('legon', 'University of Ghana', 'Accra', 'gh-01-accra', 'gh', 1948, 70, ['humanities', 'law', 'medicine'], 'At Legon, and the oldest in Ghana.'),
  u('knust', 'Kwame Nkrumah University of Science and Technology', 'Kumasi', 'gh-02-kumasi', 'gh', 1952, 68, ['engineering', 'science', 'art'], 'The main science and technology university in Ghana.'),

  // --- Latin America ---------------------------------------------------------
  u('usp', 'University of São Paulo', 'São Paulo', 'br-27-saopaulo', 'br', 1934, 88, ['medicine', 'engineering', 'law', 'film'], 'The largest in Brazil, free to attend, and getting in is the hard part.'),
  u('unicamp', 'State University of Campinas', 'Campinas', 'br-27-campinas', 'br', 1966, 85, ['engineering', 'science', 'medicine'], 'A research university built from scratch in the sixties.'),
  u('ufrj', 'Federal University of Rio de Janeiro', 'Rio de Janeiro', 'br-21-riodejaneiro', 'br', 1920, 80, ['medicine', 'engineering', 'humanities'], 'The oldest federal university in Brazil.'),
  u('unam', 'National Autonomous University of Mexico', 'Mexico City', 'mx-cmx-mexicocity', 'mx', 1551, 82, ['humanities', 'law', 'medicine', 'film'], 'Its campus is a World Heritage site and the murals are part of the buildings.'),
  u('itesm', 'Monterrey Institute of Technology', 'Monterrey', 'mx-19-monterrey', 'mx', 1943, 78, ['engineering', 'business'], 'Private, and the main engineering school of northern Mexico.'),
  u('uba', 'University of Buenos Aires', 'Buenos Aires', 'ar-07-buenosaires', 'ar', 1821, 80, ['medicine', 'law', 'humanities', 'film'], 'Free and open entry, with five Nobel laureates among its alumni.'),
  u('uchile', 'University of Chile', 'Santiago', 'cl-12-santiago', 'cl', 1842, 80, ['medicine', 'law', 'humanities'], 'The oldest in Chile, and its film school is the country’s main one.'),
  u('uc_chile', 'Pontifical Catholic University of Chile', 'Santiago', 'cl-12-santiago', 'cl', 1888, 82, ['engineering', 'medicine', 'business'], 'The other half of the pair Chilean students name.'),
  u('unal', 'National University of Colombia', 'Bogotá', 'co-34-bogota', 'co', 1867, 76, ['engineering', 'medicine', 'humanities'], 'The largest in Colombia, and the entrance examination is the whole story.'),
  u('pucp', 'Pontifical Catholic University of Peru', 'Lima', 'pe-lma-lima', 'pe', 1917, 76, ['humanities', 'law', 'engineering'], 'The oldest private university in Peru.'),
];

export const UNIVERSITY_BY_ID: Readonly<Record<string, University>> = Object.fromEntries(
  UNIVERSITIES.map((one) => [one.id, one]),
);

// ---------------------------------------------------------------------------
// What it costs
// ---------------------------------------------------------------------------

/**
 * How a country charges for a degree.
 *
 * The regime is real: some countries charge nothing, some cap what a home
 * student can be charged, some let each university set its own price, and
 * some charge nothing up front and collect it later out of earnings. The
 * amount attached to each is SLATE's own calibration in the local cost of
 * living, not anybody's published fee schedule for this year.
 */
export const FEES_NOTE =
  'Whether a country charges for a degree, and how, is real: some charge nothing, some cap what a '
  + 'home student can be charged, some let each university price its own place, and some charge '
  + 'nothing up front and collect it later out of what you earn. What SLATE puts on the invoice is '
  + 'its own calibration rather than anybody’s published fee schedule.';

export type FeeRegime = 'free' | 'nominal' | 'capped' | 'deferred' | 'market';

export const REGIME_LABEL: Readonly<Record<FeeRegime, string>> = {
  free: 'No Tuition',
  nominal: 'An Administrative Fee Only',
  capped: 'A Capped Home Fee',
  deferred: 'Nothing Now, Repaid Out Of Earnings',
  market: 'Whatever The University Charges',
};

export const REGIME_ABOUT: Readonly<Record<FeeRegime, string>> = {
  free: 'The state pays for it and you don’t.',
  nominal: 'A registration charge and a transport pass, and that’s the lot.',
  capped: 'The university may not charge a home student more than the cap.',
  deferred: 'You aren’t billed now. It comes out of your pay once you’re earning enough.',
  market: 'Each university sets its own price, and they differ by a very long way.',
};

/** Which regime a country runs, and roughly what a year of it costs there. */
export interface Fees {
  regime: FeeRegime;
  /** A year of tuition, before the local cost of living is applied. */
  perYear: number;
}

export const FEES_BY_COUNTRY: Readonly<Record<string, Fees>> = {
  de: { regime: 'nominal', perYear: 350_00 },
  at: { regime: 'nominal', perYear: 400_00 },
  cz: { regime: 'free', perYear: 0 },
  pl: { regime: 'free', perYear: 0 },
  hu: { regime: 'free', perYear: 0 },
  gr: { regime: 'free', perYear: 0 },
  no: { regime: 'free', perYear: 0 },
  fi: { regime: 'free', perYear: 0 },
  dk: { regime: 'free', perYear: 0 },
  se: { regime: 'free', perYear: 0 },
  is: { regime: 'nominal', perYear: 550_00 },
  ar: { regime: 'free', perYear: 0 },
  br: { regime: 'free', perYear: 0 },
  mx: { regime: 'nominal', perYear: 300_00 },
  fr: { regime: 'nominal', perYear: 200_00 },
  be: { regime: 'nominal', perYear: 1_000_00 },
  es: { regime: 'capped', perYear: 1_500_00 },
  pt: { regime: 'capped', perYear: 700_00 },
  it: { regime: 'capped', perYear: 2_000_00 },
  nl: { regime: 'capped', perYear: 2_600_00 },
  ch: { regime: 'nominal', perYear: 1_600_00 },
  uk: { regime: 'capped', perYear: 9_500_00 },
  ie: { regime: 'capped', perYear: 3_000_00 },
  au: { regime: 'deferred', perYear: 9_000_00 },
  nz: { regime: 'deferred', perYear: 7_000_00 },
  ca: { regime: 'capped', perYear: 7_000_00 },
  us: { regime: 'market', perYear: 26_000_00 },
  jp: { regime: 'capped', perYear: 5_400_00 },
  kr: { regime: 'market', perYear: 6_500_00 },
  cn: { regime: 'capped', perYear: 1_200_00 },
  tw: { regime: 'capped', perYear: 1_800_00 },
  hk: { regime: 'capped', perYear: 5_500_00 },
  sg: { regime: 'capped', perYear: 8_000_00 },
  in: { regime: 'capped', perYear: 900_00 },
  pk: { regime: 'market', perYear: 2_500_00 },
  bd: { regime: 'capped', perYear: 500_00 },
  th: { regime: 'capped', perYear: 1_200_00 },
  my: { regime: 'capped', perYear: 2_000_00 },
  id: { regime: 'capped', perYear: 900_00 },
  ph: { regime: 'free', perYear: 0 },
  vn: { regime: 'capped', perYear: 700_00 },
  il: { regime: 'capped', perYear: 3_000_00 },
  tr: { regime: 'free', perYear: 0 },
  ru: { regime: 'free', perYear: 0 },
  ua: { regime: 'free', perYear: 0 },
  ro: { regime: 'free', perYear: 0 },
  za: { regime: 'market', perYear: 3_500_00 },
  ng: { regime: 'capped', perYear: 400_00 },
  ke: { regime: 'capped', perYear: 900_00 },
  gh: { regime: 'capped', perYear: 800_00 },
  eg: { regime: 'capped', perYear: 400_00 },
  sa: { regime: 'free', perYear: 0 },
  ae: { regime: 'market', perYear: 15_000_00 },
  qa: { regime: 'free', perYear: 0 },
  cl: { regime: 'market', perYear: 5_500_00 },
  co: { regime: 'capped', perYear: 1_800_00 },
  pe: { regime: 'market', perYear: 4_000_00 },
};

export const WORLD_FEES: Fees = { regime: 'capped', perYear: 2_000_00 };

/** How a degree is paid for where this university is. */
export function feesIn(countryId: string): Fees {
  return FEES_BY_COUNTRY[countryId] ?? WORLD_FEES;
}

/** Whether SLATE carries this country's own regime, or the world default. */
export function feesAreCountrys(countryId: string): boolean {
  return FEES_BY_COUNTRY[countryId] !== undefined;
}

// ---------------------------------------------------------------------------
// Where you live while you are there
// ---------------------------------------------------------------------------

/**
 * Room and board, which is the other half of what a degree costs.
 *
 * Tuition is the number everybody quotes and it is often not the biggest one.
 * Somewhere to sleep and something to eat are charged separately nearly
 * everywhere, they are frequently more than the fees, and in the countries
 * that charge no tuition at all they are the whole bill.
 *
 * The amounts are SLATE's own calibration in the local cost of living. That
 * room and board is charged apart from tuition, and that a full ride covers
 * both while a fees-only award does not, is how it really works.
 */
export const ROOM_AND_BOARD_NOTE =
  'Tuition is the number everybody quotes and it’s often not the biggest one. Somewhere to sleep and '
  + 'something to eat are charged separately nearly everywhere, are frequently more than the fees, and '
  + 'in the countries that charge no tuition are the whole bill. A full ride covers them; an award '
  + 'against the fees doesn’t. The amounts are SLATE’s own calibration.';

export type Housing = 'at_home' | 'hall' | 'shared' | 'own_place';

export interface HousingOption {
  id: Housing;
  label: string;
  /** A year of it, before the local cost of living. */
  perYear: number;
  /** What it does to how the year goes, out of a hundred. */
  belonging: number;
  about: string;
}

export const HOUSING: readonly HousingOption[] = [
  { id: 'at_home', label: 'Living At Home', perYear: 0, belonging: 25, about: 'Free, and you commute, and you miss most of it.' },
  { id: 'hall', label: 'A Room In Hall', perYear: 11_000_00, belonging: 90, about: 'On campus, catered, and it’s where the whole first year happens.' },
  { id: 'shared', label: 'A Shared House', perYear: 7_500_00, belonging: 70, about: 'Off campus with four other people, and you cook for yourself.' },
  { id: 'own_place', label: 'A Place Of Your Own', perYear: 14_000_00, belonging: 45, about: 'Quiet, expensive, and you’ll know fewer people.' },
];

export const HOUSING_BY_ID: Readonly<Record<string, HousingOption>> = Object.fromEntries(
  HOUSING.map((one) => [one.id, one]),
);

/** A year of eating, where the hall does not already do it. */
export const MEAL_PLAN_A_YEAR = 5_200_00;

// ---------------------------------------------------------------------------
// Scholarships
// ---------------------------------------------------------------------------

/**
 * Where a place can be won on sport.
 *
 * This is a real and unevenly distributed thing. American and Canadian
 * universities award athletic scholarships and organize around them; most of
 * Europe does not, because sport there sits in clubs rather than in
 * universities. Japan has its own version through the sports recommendation
 * route. SLATE carries that rather than pretending every country works like
 * the United States.
 */
export const ATHLETIC_SCHOLARSHIP_COUNTRIES = new Set(['us', 'ca', 'jp', 'kr', 'za', 'ph']);

export const ATHLETIC_NOTE =
  'A place won on sport is an American and Canadian arrangement more than a universal one: most of '
  + 'Europe has no such thing, because sport there sits in clubs rather than in universities. SLATE '
  + 'carries where it really happens rather than assuming every country works the same way.';

/**
 * What a scholarship actually covers.
 *
 * An academic award is against the fees and nothing else, which is what most
 * of them are. A place won on sport in America is very often a full ride —
 * tuition, the room and the food — and that difference is the whole reason
 * people take one.
 */
export const SCHOLARSHIP_SHARE = { academic: 0.6, athletic: 1, none: 0 } as const;

/** Whether an award pays for somewhere to live as well as for the teaching. */
export const COVERS_ROOM_AND_BOARD: Readonly<Record<string, boolean>> = {
  academic: false, athletic: true,
};

/** A year of somewhere to live and something to eat, here. */
export function roomAndBoardIn(housingId: Housing, mealPlan: boolean): number {
  const housing = HOUSING_BY_ID[housingId] ?? HOUSING_BY_ID.hall!;
  // A room in hall is catered, so a meal plan on top of it is not a thing.
  const food = housingId === 'hall' || !mealPlan ? 0 : MEAL_PLAN_A_YEAR;
  return housing.perYear + food;
}

// ---------------------------------------------------------------------------
// What you read
// ---------------------------------------------------------------------------

export interface Major {
  id: string;
  label: string;
  field: Field;
  /** How many years it takes, where the country does not say otherwise. */
  years: number;
  /** What doing well in it feeds. */
  feeds: readonly { key: string; kind: 'attribute' | 'skill' }[];
  about: string;
}

const m = (
  id: string, label: string, field: Field, years: number,
  feeds: readonly { key: string; kind: 'attribute' | 'skill' }[], about: string,
): Major => ({ id, label, field, years, feeds, about });

export const MAJORS: readonly Major[] = [
  m('film_production', 'Film Production', 'film', 3, [
    { key: 'visual_language', kind: 'skill' }, { key: 'coverage_planning', kind: 'skill' },
    { key: 'editing', kind: 'skill' },
  ], 'Three years of making short films that are mostly bad, and one that isn’t.'),
  m('screenwriting', 'Screenwriting', 'film', 3, [
    { key: 'story_structure', kind: 'skill' }, { key: 'dialogue', kind: 'skill' },
    { key: 'rewriting', kind: 'skill' },
  ], 'Structure, then dialogue, then being told to cut it.'),
  m('acting', 'Acting', 'drama', 3, [
    { key: 'emotional_truth', kind: 'attribute' }, { key: 'projection', kind: 'attribute' },
    { key: 'improvisation', kind: 'attribute' }, { key: 'script_analysis', kind: 'attribute' },
  ], 'Voice, movement and text, all day, for three years.'),
  m('theatre', 'Theater And Performance', 'drama', 3, [
    { key: 'stage_combat', kind: 'attribute' }, { key: 'ensemble_blending', kind: 'attribute' },
    { key: 'public_speaking', kind: 'skill' },
  ], 'The play as a made thing rather than a text, and a lot of it is practical.'),
  m('english', 'English Literature', 'humanities', 3, [
    { key: 'script_analysis', kind: 'attribute' }, { key: 'character_writing', kind: 'skill' },
  ], 'Reading, and then arguing about what you read.'),
  m('history', 'History', 'humanities', 3, [
    { key: 'world_building', kind: 'skill' }, { key: 'script_analysis', kind: 'attribute' },
  ], 'Sources, and what people did with them.'),
  m('philosophy', 'Philosophy', 'humanities', 3, [
    { key: 'script_analysis', kind: 'attribute' }, { key: 'negotiation', kind: 'skill' },
  ], 'Arguments, taken apart slowly.'),
  m('law', 'Law', 'law', 3, [
    { key: 'negotiation', kind: 'skill' }, { key: 'deal_structuring', kind: 'skill' },
    { key: 'rights_management', kind: 'skill' },
  ], 'Cases, statutes and a great deal of reading, and it’s useful in this business.'),
  m('economics', 'Economics', 'economics', 3, [
    { key: 'market_reading', kind: 'skill' }, { key: 'corporate_finance', kind: 'skill' },
  ], 'Models, and the argument about whether they describe anything.'),
  m('business', 'Business And Management', 'business', 3, [
    { key: 'leadership', kind: 'skill' }, { key: 'operations', kind: 'skill' },
    { key: 'accounting', kind: 'skill' },
  ], 'Broad, and it’s what most people do who want to run something.'),
  m('engineering', 'Engineering', 'engineering', 4, [
    { key: 'grip_electric', kind: 'skill' }, { key: 'vfx_craft', kind: 'skill' },
  ], 'Four years, and the workload isn’t a rumor.'),
  m('computer_science', 'Computer Science', 'engineering', 3, [
    { key: 'vfx_craft', kind: 'skill' }, { key: 'editing_software', kind: 'skill' },
  ], 'Theory first, and the useful part arrives late.'),
  m('medicine', 'Medicine', 'medicine', 6, [
    { key: 'pressure_tolerance', kind: 'attribute' }, { key: 'long_day_endurance', kind: 'attribute' },
  ], 'Six years, and the hours after that are worse.'),
  m('physics', 'Physics', 'science', 3, [
    { key: 'script_analysis', kind: 'attribute' },
  ], 'Mathematics with a reason attached.'),
  m('psychology', 'Psychology', 'science', 3, [
    { key: 'active_listening', kind: 'attribute' }, { key: 'character_construction', kind: 'attribute' },
  ], 'More statistics than anybody expects, and useful for building a character.'),
  m('art', 'Fine Art', 'art', 3, [
    { key: 'production_design', kind: 'skill' }, { key: 'cinematography', kind: 'skill' },
  ], 'A studio, a crit, and very little told to you.'),
  m('design', 'Design', 'art', 3, [
    { key: 'production_design', kind: 'skill' }, { key: 'costume_design', kind: 'skill' },
  ], 'Making things people use, and defending why.'),
  m('music', 'Music', 'music', 3, [
    { key: 'singing', kind: 'attribute' }, { key: 'scoring', kind: 'skill' },
  ], 'Practice, and then more practice.'),
  m('architecture', 'Architecture', 'architecture', 5, [
    { key: 'production_design', kind: 'skill' }, { key: 'visual_language', kind: 'skill' },
  ], 'Five years and the studio culture is famously punishing.'),
  m('journalism', 'Journalism', 'humanities', 3, [
    { key: 'interview_poise', kind: 'attribute' }, { key: 'content_strategy', kind: 'skill' },
  ], 'Shorthand, law, and finding somebody who will talk.'),
  m('education', 'Education', 'education', 3, [
    { key: 'public_speaking', kind: 'skill' }, { key: 'collaboration', kind: 'attribute' },
  ], 'A classroom from the other side of it.'),
  m('sport_science', 'Sport Science', 'sport', 3, [
    { key: 'stamina', kind: 'attribute' }, { key: 'fitness', kind: 'skill' },
  ], 'Physiology, biomechanics, and a great deal of time in a lab.'),
];

export const MAJOR_BY_ID: Readonly<Record<string, Major>> = Object.fromEntries(
  MAJORS.map((one) => [one.id, one]),
);

/** The fields a school can be a conservatoire in. */
const SPECIALIST_FIELDS = new Set<Field>(['film', 'drama', 'music', 'art']);

/** What a university will actually let you read, given what it is known for. */
export function majorsAt(university: University): Major[] {
  const strengths = new Set(university.strengths);
  const offered = MAJORS.filter((one) => strengths.has(one.field));
  // A conservatoire teaches the thing it is a conservatoire in and nothing
  // else — Juilliard has two strengths, music and drama, and neither of them
  // means it also runs an economics department.
  const conservatoire = university.strengths.every((one) => SPECIALIST_FIELDS.has(one));
  if (conservatoire) return offered;
  // A broad university teaches the broad subjects somebody would expect of it
  // whether or not it is famous for them.
  const broad = MAJORS.filter((one) => ['humanities', 'business', 'science'].includes(one.field));
  return [...new Set([...offered, ...broad])];
}

// ---------------------------------------------------------------------------
// What you leave with
// ---------------------------------------------------------------------------

/** The class of degree, by the average you finish on. */
export const DEGREE_CLASSES: readonly { from: number; label: string; about: string }[] = [
  { from: 82, label: 'First Class', about: 'The top of the year, and doors open on it.' },
  { from: 70, label: 'Upper Second', about: 'What most employers ask for, and most people who work get.' },
  { from: 58, label: 'Lower Second', about: 'A degree, and nobody will ask about it in five years.' },
  { from: 45, label: 'Third Class', about: 'Through, and only just.' },
  { from: 0, label: 'No Award', about: 'Not enough of the course was passed.' },
];

export function degreeClass(average: number): string {
  return DEGREE_CLASSES.find((one) => average >= one.from)?.label ?? 'No Award';
}

/** How many weeks of term there are in a year. */
export const TERM_WEEKS = 30;
