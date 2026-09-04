/**
 * SLATE — the post-production industry, by name.
 *
 * Visual effects houses, picture and sound post houses, scoring stages,
 * and the companies that own recorded music. What is here is public record:
 * names, where they are, roughly when they were founded, who owns them, and
 * what they are known for. Where a fact is not certain it is left out
 * rather than guessed. Every number the game uses to price work against them
 * — a shot rate, a day rate, a scale — is SLATE's calibration and is labelled
 * as such wherever the player sees it. Nothing here is a real quote.
 */

export type PostHouseKind = 'vfx' | 'picture' | 'sound' | 'scoring_stage' | 'animation';

/** How big and how expensive a house is, on SLATE's scale, not theirs. */
export type Tier = 'boutique' | 'mid' | 'major' | 'flagship';

export interface PostHouse {
  id: string;
  name: string;
  kind: PostHouseKind;
  /** The nearest city on SLATE's map, for distance and cost. `where` is the truth. */
  cityId: string;
  where: string;
  /** Other places it has a facility, in plain words. */
  alsoIn?: string[];
  founded?: number;
  /** Owner or parent, where it is public and current to SLATE's knowledge. */
  parent?: string;
  /** What they are known for, in plain words. */
  knownFor: string;
  tier: Tier;
  /** Disciplines SLATE will send them. */
  services: PostService[];
  /** A note on the record where the fact needs one. */
  note?: string;
}

export type PostService =
  | 'vfx' | 'creature' | 'environments' | 'simulation' | 'virtual_production' | 'previs'
  | 'editorial' | 'color' | 'conform' | 'mastering' | 'qc' | 'dailies'
  | 'sound_design' | 'mix' | 'adr' | 'foley'
  | 'scoring' | 'animation' | 'titles';

/** The houses. A city that is not on the map falls back to the base at runtime. */
export const POST_HOUSES: readonly PostHouse[] = [
  // --- Visual effects --------------------------------------------------------
  { id: 'ilm', name: 'Industrial Light & Magic', kind: 'vfx', cityId: 'us-ca-sanfrancisco', where: 'San Francisco', alsoIn: ['London', 'Vancouver', 'Singapore', 'Sydney'], founded: 1975, parent: 'Lucasfilm (The Walt Disney Company)', knownFor: 'Founded to make Star Wars. Creatures, spectacle and StageCraft virtual production.', tier: 'flagship', services: ['vfx', 'creature', 'environments', 'simulation', 'virtual_production', 'previs'] },
  { id: 'weta', name: 'Wētā FX', kind: 'vfx', cityId: 'nz-wgn-wellington', where: 'Wellington', founded: 1993, knownFor: 'Performance capture and digital characters; the Middle-earth and Pandora pictures.', tier: 'flagship', services: ['vfx', 'creature', 'environments', 'simulation', 'previs'], note: 'Formerly Weta Digital. Its engineering and tools division was sold to Unity in 2021 and later returned.' },
  { id: 'framestore', name: 'Framestore', kind: 'vfx', cityId: 'uk-eng-london', where: 'London', alsoIn: ['Montreal', 'Los Angeles', 'Mumbai', 'Melbourne'], founded: 1986, knownFor: 'Character animation and photoreal creatures; Gravity, Paddington, and Marvel work.', tier: 'flagship', services: ['vfx', 'creature', 'environments', 'previs', 'animation'], note: 'Absorbed Method Studios and Company 3’s VFX operations in 2021.' },
  { id: 'dneg', name: 'DNEG', kind: 'vfx', cityId: 'uk-eng-london', where: 'London', alsoIn: ['Vancouver', 'Montreal', 'Mumbai', 'Los Angeles', 'Sydney'], founded: 1998, parent: 'Prime Focus', knownFor: 'Large-scale environments and simulation; Interstellar, Dune, Tenet.', tier: 'flagship', services: ['vfx', 'environments', 'simulation', 'creature', 'animation'], note: 'Formerly Double Negative.' },
  { id: 'digital-domain', name: 'Digital Domain', kind: 'vfx', cityId: 'us-ca-losangeles', where: 'Playa Vista, Los Angeles', alsoIn: ['Vancouver', 'Montreal', 'Hyderabad'], founded: 1993, knownFor: 'Digital humans and simulation; Titanic, Benjamin Button, Thanos.', tier: 'major', services: ['vfx', 'creature', 'simulation', 'environments'], note: 'Co-founded by James Cameron, Stan Winston and Scott Ross.' },
  { id: 'rodeo', name: 'Rodeo FX', kind: 'vfx', cityId: 'ca-qc-montreal', where: 'Montreal', alsoIn: ['Quebec City', 'Vancouver', 'Los Angeles', 'Munich'], founded: 2006, knownFor: 'Environments and creatures across features and streaming series.', tier: 'major', services: ['vfx', 'environments', 'creature', 'animation'] },
  { id: 'scanline', name: 'Scanline VFX', kind: 'vfx', cityId: 'de-02-munich', where: 'Munich', alsoIn: ['Vancouver', 'Los Angeles', 'London', 'Seoul'], founded: 1989, parent: 'Netflix', knownFor: 'Water and destruction simulation on its Flowline software.', tier: 'major', services: ['vfx', 'simulation', 'environments', 'virtual_production'], note: 'Acquired by Netflix in 2021.' },
  { id: 'image-engine', name: 'Image Engine', kind: 'vfx', cityId: 'ca-bc-vancouver', where: 'Vancouver', founded: 1995, knownFor: 'Creatures and characters; District 9, Jurassic World, The Mandalorian.', tier: 'major', services: ['vfx', 'creature', 'environments'] },
  { id: 'cinesite', name: 'Cinesite', kind: 'vfx', cityId: 'uk-eng-london', where: 'London', alsoIn: ['Montreal', 'Vancouver'], founded: 1991, knownFor: 'Feature VFX and, since 2016, animated features of its own.', tier: 'major', services: ['vfx', 'environments', 'creature', 'animation'] },
  { id: 'imageworks', name: 'Sony Pictures Imageworks', kind: 'vfx', cityId: 'ca-bc-vancouver', where: 'Vancouver', alsoIn: ['Los Angeles'], founded: 1992, parent: 'Sony Pictures Entertainment', knownFor: 'Effects and animation together; the Spider-Verse look.', tier: 'flagship', services: ['vfx', 'animation', 'creature', 'environments'] },
  { id: 'rising-sun', name: 'Rising Sun Pictures', kind: 'vfx', cityId: 'au-05-adelaide', where: 'Adelaide', alsoIn: ['Brisbane'], founded: 1995, knownFor: 'Character and environment work for studio pictures from Adelaide.', tier: 'mid', services: ['vfx', 'creature', 'environments'] },
  { id: 'pixomondo', name: 'Pixomondo', kind: 'vfx', cityId: 'ca-on-toronto', where: 'Toronto', alsoIn: ['Vancouver', 'Montreal', 'Los Angeles', 'Frankfurt'], founded: 2001, parent: 'Sony Pictures Entertainment', knownFor: 'Hugo, Game of Thrones dragons, and LED-volume virtual production.', tier: 'major', services: ['vfx', 'creature', 'virtual_production', 'environments'], note: 'Acquired by Sony in 2022.' },
  { id: 'ilp', name: 'Important Looking Pirates', kind: 'vfx', cityId: 'se-26-stockholm', where: 'Stockholm', founded: 2007, knownFor: 'Premium series work: Westworld, The Mandalorian, Lost in Space.', tier: 'mid', services: ['vfx', 'creature', 'environments'] },
  { id: 'crafty-apes', name: 'Crafty Apes', kind: 'vfx', cityId: 'us-ga-atlanta', where: 'Atlanta', alsoIn: ['Los Angeles', 'New York', 'Albuquerque', 'Vancouver'], founded: 2011, knownFor: 'Invisible effects and high-volume series work.', tier: 'mid', services: ['vfx', 'environments'] },
  { id: 'zoic', name: 'Zoic Studios', kind: 'vfx', cityId: 'us-ca-losangeles', where: 'Culver City', alsoIn: ['Vancouver', 'New York'], founded: 2002, knownFor: 'Television effects at scale; Battlestar Galactica, Once Upon a Time.', tier: 'mid', services: ['vfx', 'environments', 'previs'] },
  { id: 'luma', name: 'Luma Pictures', kind: 'vfx', cityId: 'au-vic-melbourne', where: 'Melbourne', alsoIn: ['Los Angeles'], founded: 2002, knownFor: 'Creature and character work for Marvel and studio features.', tier: 'mid', services: ['vfx', 'creature'] },
  { id: 'untold', name: 'Untold Studios', kind: 'vfx', cityId: 'uk-eng-london', where: 'London', founded: 2018, knownFor: 'A newer London house across features, series and commercials.', tier: 'mid', services: ['vfx', 'environments', 'animation'] },
  { id: 'outpost', name: 'Outpost VFX', kind: 'vfx', cityId: 'uk-eng-london', where: 'Bournemouth', alsoIn: ['Montreal', 'Mumbai'], founded: 2012, knownFor: 'Mid-scale feature and series work out of the south coast.', tier: 'mid', services: ['vfx', 'environments'] },
  { id: 'territory', name: 'Territory Studio', kind: 'vfx', cityId: 'uk-eng-london', where: 'London', alsoIn: ['Los Angeles'], founded: 2010, knownFor: 'Screen graphics and interfaces: Blade Runner 2049, The Martian.', tier: 'boutique', services: ['vfx', 'titles'] },
  { id: 'blur', name: 'Blur Studio', kind: 'animation', cityId: 'us-ca-losangeles', where: 'Culver City', founded: 1995, knownFor: 'Cinematics and animation; Love, Death & Robots.', tier: 'mid', services: ['animation', 'previs', 'titles'] },
  { id: 'ghost', name: 'Ghost VFX', kind: 'vfx', cityId: 'dk-17-copenhagen', where: 'Copenhagen', alsoIn: ['Los Angeles'], founded: 1999, parent: 'Streamland Media', knownFor: 'Series and feature work from Copenhagen.', tier: 'mid', services: ['vfx', 'environments'] },
  { id: 'barnstorm', name: 'Barnstorm VFX', kind: 'vfx', cityId: 'us-ca-losangeles', where: 'Los Angeles', alsoIn: ['Vancouver'], founded: 2011, knownFor: 'Environments for premium series.', tier: 'boutique', services: ['vfx', 'environments'] },

  // --- Picture post ------------------------------------------------------------
  { id: 'company3', name: 'Company 3', kind: 'picture', cityId: 'us-ca-losangeles', where: 'Santa Monica', alsoIn: ['New York', 'London', 'Toronto', 'Vancouver', 'Atlanta'], founded: 1997, knownFor: 'Colour. A large share of studio features are graded here.', tier: 'flagship', services: ['color', 'conform', 'dailies', 'mastering', 'qc', 'editorial'] },
  { id: 'harbor', name: 'Harbor', kind: 'picture', cityId: 'us-ny-newyork', where: 'New York', alsoIn: ['Los Angeles', 'London', 'Atlanta'], founded: 2012, knownFor: 'Picture and sound under one roof, from dailies to the mix.', tier: 'major', services: ['color', 'conform', 'dailies', 'mastering', 'sound_design', 'mix', 'adr', 'editorial'] },
  { id: 'light-iron', name: 'Light Iron', kind: 'picture', cityId: 'us-ca-losangeles', where: 'Hollywood', alsoIn: ['New York', 'Atlanta', 'Albuquerque', 'Toronto'], founded: 2009, parent: 'Panavision', knownFor: 'Digital dailies and finishing, paired with Panavision cameras.', tier: 'major', services: ['color', 'conform', 'dailies', 'mastering', 'editorial'] },
  { id: 'fotokem', name: 'FotoKem', kind: 'picture', cityId: 'us-ca-burbank', where: 'Burbank', founded: 1963, knownFor: 'One of the last full film labs, with digital finishing alongside it.', tier: 'major', services: ['color', 'conform', 'dailies', 'mastering', 'qc'] },
  { id: 'goldcrest', name: 'Goldcrest Post', kind: 'picture', cityId: 'uk-eng-london', where: 'Soho, London', alsoIn: ['New York'], knownFor: 'Picture and sound finishing in Soho and Manhattan.', tier: 'mid', services: ['color', 'conform', 'mastering', 'sound_design', 'mix', 'adr', 'editorial'] },
  { id: 'molinare', name: 'Molinare', kind: 'picture', cityId: 'uk-eng-london', where: 'Soho, London', founded: 1973, knownFor: 'Soho post for British features and drama.', tier: 'mid', services: ['color', 'conform', 'mastering', 'sound_design', 'mix', 'adr', 'qc', 'editorial', 'titles'] },
  { id: 'picture-shop', name: 'Picture Shop', kind: 'picture', cityId: 'us-ca-burbank', where: 'Burbank', alsoIn: ['Vancouver', 'Toronto', 'London'], parent: 'Streamland Media', knownFor: 'Colour and finishing for series and features.', tier: 'mid', services: ['color', 'conform', 'mastering', 'qc', 'titles'] },
  { id: 'wb-post', name: 'Warner Bros. Post Production Services', kind: 'picture', cityId: 'us-ca-burbank', where: 'Burbank', parent: 'Warner Bros. Discovery', knownFor: 'The studio’s own colour, sound and mastering on the Burbank lot.', tier: 'major', services: ['color', 'conform', 'mastering', 'sound_design', 'mix', 'adr', 'foley', 'qc', 'editorial', 'titles'] },
  { id: 'deluxe', name: 'Deluxe', kind: 'picture', cityId: 'us-ca-burbank', where: 'Burbank', alsoIn: ['London', 'Toronto', 'Sydney'], founded: 1915, knownFor: 'Localisation, distribution services and finishing at scale.', tier: 'major', services: ['mastering', 'qc', 'conform'] },

  // --- Sound -----------------------------------------------------------------
  { id: 'skywalker', name: 'Skywalker Sound', kind: 'sound', cityId: 'us-ca-sanfrancisco', where: 'Skywalker Ranch, Marin County', founded: 1975, parent: 'Lucasfilm (The Walt Disney Company)', knownFor: 'Design and mixing at Skywalker Ranch in Marin County.', tier: 'flagship', services: ['sound_design', 'mix', 'adr', 'foley'] },
  { id: 'formosa', name: 'Formosa Group', kind: 'sound', cityId: 'us-ca-losangeles', where: 'Hollywood', alsoIn: ['New York', 'London', 'Toronto'], founded: 2013, knownFor: 'Feature and series sound, with stages across Hollywood.', tier: 'major', services: ['sound_design', 'mix', 'adr', 'foley'] },
  { id: 'sony-sound', name: 'Sony Pictures Post Production Services', kind: 'sound', cityId: 'us-ca-losangeles', where: 'Culver City', parent: 'Sony Pictures Entertainment', knownFor: 'Mixing on the Culver City lot, including the Cary Grant Theatre.', tier: 'major', services: ['sound_design', 'mix', 'adr', 'foley', 'color', 'mastering', 'editorial'] },
  { id: 'twickenham', name: 'Twickenham Studios', kind: 'sound', cityId: 'uk-eng-london', where: 'Twickenham', founded: 1913, knownFor: 'Stages and sound post on the Thames since the silent era.', tier: 'mid', services: ['sound_design', 'mix', 'adr', 'foley', 'editorial'] },
  { id: 'pinewood-post', name: 'Pinewood Post Production', kind: 'sound', cityId: 'uk-eng-london', where: 'Iver Heath', parent: 'Pinewood Group', knownFor: 'Mixing theatres on the Pinewood lot.', tier: 'major', services: ['sound_design', 'mix', 'adr', 'foley', 'editorial'] },

  // --- Scoring stages ------------------------------------------------------------
  { id: 'abbey-road', name: 'Abbey Road Studios', kind: 'scoring_stage', cityId: 'uk-eng-london', where: 'St John’s Wood, London', founded: 1931, parent: 'Universal Music Group', knownFor: 'Studio One, the orchestral room where much of British film music is recorded.', tier: 'flagship', services: ['scoring'] },
  { id: 'air', name: 'AIR Studios', kind: 'scoring_stage', cityId: 'uk-eng-london', where: 'Hampstead, London', founded: 1969, knownFor: 'Lyndhurst Hall in Hampstead; founded by George Martin.', tier: 'flagship', services: ['scoring'] },
  { id: 'newman', name: 'Newman Scoring Stage', kind: 'scoring_stage', cityId: 'us-ca-losangeles', where: 'Century City', parent: 'Fox Studio Lot (The Walt Disney Company)', knownFor: 'The Fox lot’s stage, named for Alfred Newman.', tier: 'flagship', services: ['scoring'] },
  { id: 'sony-scoring', name: 'Sony Pictures Scoring Stage', kind: 'scoring_stage', cityId: 'us-ca-losangeles', where: 'Culver City', parent: 'Sony Pictures Entertainment', knownFor: 'The old MGM scoring stage in Culver City; one of the largest anywhere.', tier: 'flagship', services: ['scoring'] },
  { id: 'eastwood', name: 'Eastwood Scoring Stage', kind: 'scoring_stage', cityId: 'us-ca-burbank', where: 'Burbank', parent: 'Warner Bros. Discovery', knownFor: 'The Warner lot’s stage, renamed for Clint Eastwood.', tier: 'major', services: ['scoring'] },
  { id: 'synchron', name: 'Synchron Stage Vienna', kind: 'scoring_stage', cityId: 'at-09-vienna', where: 'Vienna', founded: 2016, parent: 'Vienna Symphonic Library', knownFor: 'A large orchestral stage rebuilt from a 1940s film studio hall.', tier: 'major', services: ['scoring'] },
  { id: 'budapest', name: 'Budapest Scoring', kind: 'scoring_stage', cityId: 'hu-05-budapest', where: 'Budapest', knownFor: 'Orchestral sessions at a fraction of the London or Los Angeles rate.', tier: 'mid', services: ['scoring'] },
];

export const POST_HOUSE_BY_ID: Readonly<Record<string, PostHouse>> = Object.fromEntries(POST_HOUSES.map((h) => [h.id, h]));

export function housesFor(service: PostService): PostHouse[] {
  return POST_HOUSES.filter((h) => h.services.includes(service));
}

// ---------------------------------------------------------------------------
// Music: who owns what
// ---------------------------------------------------------------------------

/**
 * A licence to put recorded music in a picture is two licences: the
 * composition (sync, from the publisher) and the recording (master, from the
 * label). SLATE never names a real song. It names the companies you would be
 * talking to, which are real.
 */
export interface RightsHolder {
  id: string;
  name: string;
  side: 'label' | 'publisher';
  parent?: string;
  founded?: number;
  /** The nearest city on SLATE's map. */
  cityId: string;
  where?: string;
  /** How hard they bargain, on SLATE's scale. */
  posture: 'major' | 'independent';
  knownFor: string;
}

export const RIGHTS_HOLDERS: readonly RightsHolder[] = [
  { id: 'umg', name: 'Universal Music Group', side: 'label', cityId: 'us-ca-santamonica', posture: 'major', knownFor: 'The largest music company; Interscope, Capitol, Republic, Def Jam among its labels.' },
  { id: 'sony-music', name: 'Sony Music Entertainment', side: 'label', parent: 'Sony Group', cityId: 'us-ny-newyork', posture: 'major', knownFor: 'Columbia, RCA, Epic, Arista.' },
  { id: 'wmg', name: 'Warner Music Group', side: 'label', cityId: 'us-ny-newyork', posture: 'major', knownFor: 'Atlantic, Warner Records, Elektra, Parlophone.' },
  { id: 'umpg', name: 'Universal Music Publishing Group', side: 'publisher', parent: 'Universal Music Group', cityId: 'us-ca-santamonica', posture: 'major', knownFor: 'One of the three major publishers.' },
  { id: 'sony-publishing', name: 'Sony Music Publishing', side: 'publisher', parent: 'Sony Group', cityId: 'us-ny-newyork', posture: 'major', knownFor: 'The largest music publisher by catalogue; formerly Sony/ATV.' },
  { id: 'warner-chappell', name: 'Warner Chappell Music', side: 'publisher', parent: 'Warner Music Group', cityId: 'us-ca-losangeles', posture: 'major', knownFor: 'The publishing arm of Warner Music; Chappell & Co. dates to 1811.' },
  { id: 'kobalt', name: 'Kobalt Music Group', side: 'publisher', founded: 2000, cityId: 'uk-eng-london', posture: 'independent', knownFor: 'Independent publishing and administration on a transparent-royalty model.' },
  { id: 'bmg', name: 'BMG Rights Management', side: 'publisher', founded: 2008, parent: 'Bertelsmann', cityId: 'de-be-berlin', posture: 'independent', knownFor: 'Publishing and recordings under one company, built from 2008.' },
  { id: 'concord', name: 'Concord', side: 'publisher', cityId: 'us-tn-nashville', posture: 'independent', knownFor: 'Publishing, recordings and theatricals; Fantasy, Rounder, Stax among its labels.' },
  { id: 'recognition', name: 'Recognition Music Group', side: 'publisher', cityId: 'uk-eng-london', posture: 'independent', knownFor: 'The catalogue built as Hipgnosis Songs Fund, renamed after its 2024 sale to Blackstone.' },
  { id: 'beggars', name: 'Beggars Group', side: 'label', founded: 1977, cityId: 'uk-eng-london', posture: 'independent', knownFor: '4AD, XL, Matador, Rough Trade.' },
  { id: 'secretly', name: 'Secretly Group', side: 'label', cityId: 'us-ny-newyork', where: 'Bloomington, Indiana, and New York', posture: 'independent', knownFor: 'Dead Oceans, Jagjaguwar, Secretly Canadian.' },
  { id: 'merlin', name: 'Merlin', side: 'label', founded: 2008, cityId: 'us-ny-newyork', posture: 'independent', knownFor: 'The digital rights agency for independent labels; not a label itself, a door to many.' },
];

export const RIGHTS_HOLDER_BY_ID: Readonly<Record<string, RightsHolder>> = Object.fromEntries(RIGHTS_HOLDERS.map((h) => [h.id, h]));

// ---------------------------------------------------------------------------
// Studio lots: the plant
// ---------------------------------------------------------------------------

export interface StudioLot {
  id: string;
  name: string;
  /** The nearest city on SLATE's map. `where` is the place itself. */
  cityId: string;
  where: string;
  founded?: number;
  owner?: string;
  knownFor: string;
  /**
   * Working stages, where SLATE is confident of the order of magnitude. This
   * is an approximate count for pricing and availability, not a claim about
   * today's exact number.
   */
  stagesApprox: number;
  /** The largest stage, in square feet, where it is on the record. */
  largestStageSqft?: number;
  /** Backlot, water tank, LED volume: what the lot has beyond stages. */
  facilities: LotFacility[];
  tier: Tier;
  note?: string;
}

export type LotFacility = 'backlot' | 'water_tank' | 'led_volume' | 'post' | 'scoring_stage' | 'workshops' | 'offices' | 'tours';

export const STUDIO_LOTS: readonly StudioLot[] = [
  { id: 'pinewood', name: 'Pinewood Studios', cityId: 'uk-eng-london', where: 'Iver Heath, Buckinghamshire', founded: 1936, owner: 'Pinewood Group', knownFor: 'The Bond pictures and the Albert R. Broccoli 007 Stage; underwater stage; a permanent home for large productions.', stagesApprox: 25, largestStageSqft: 59000, facilities: ['backlot', 'water_tank', 'post', 'workshops', 'offices'], tier: 'flagship' },
  { id: 'shepperton', name: 'Shepperton Studios', cityId: 'uk-eng-london', where: 'Shepperton, Surrey', founded: 1931, owner: 'Pinewood Group', knownFor: 'Expanded in the 2020s with Netflix and Amazon taking long-term space.', stagesApprox: 25, facilities: ['backlot', 'water_tank', 'workshops', 'offices'], tier: 'flagship' },
  { id: 'leavesden', name: 'Warner Bros. Studios Leavesden', cityId: 'uk-eng-london', where: 'Leavesden, Hertfordshire', founded: 1994, owner: 'Warner Bros. Discovery', knownFor: 'A former Rolls-Royce aircraft works; the Harry Potter pictures were shot here, and the tour runs beside the working lot.', stagesApprox: 14, facilities: ['backlot', 'water_tank', 'workshops', 'offices', 'tours'], tier: 'flagship' },
  { id: 'elstree', name: 'Elstree Studios', cityId: 'uk-eng-london', where: 'Borehamwood, Hertfordshire', founded: 1926, owner: 'Hertsmere Borough Council', knownFor: 'Star Wars, The Shining, and the original Indiana Jones pictures.', stagesApprox: 10, facilities: ['backlot', 'workshops', 'offices'], tier: 'major' },
  { id: 'ealing', name: 'Ealing Studios', cityId: 'uk-eng-london', where: 'Ealing, west London', founded: 1902, knownFor: 'The oldest continuously working film studio in the world.', stagesApprox: 5, facilities: ['workshops', 'offices', 'post'], tier: 'mid' },
  { id: 'longcross', name: 'Longcross Studios', cityId: 'uk-eng-london', where: 'Chertsey, Surrey', owner: 'Aviva', knownFor: 'A former military vehicle test site with a large backlot and its own test track.', stagesApprox: 8, facilities: ['backlot', 'workshops', 'offices'], tier: 'major' },
  { id: 'wb-burbank', name: 'Warner Bros. Studios Burbank', cityId: 'us-ca-burbank', where: 'Burbank, California', founded: 1926, owner: 'Warner Bros. Discovery', knownFor: 'The studio’s home lot: stages, backlot streets, post services and the Eastwood scoring stage.', stagesApprox: 30, facilities: ['backlot', 'post', 'scoring_stage', 'workshops', 'offices', 'tours'], tier: 'flagship' },
  { id: 'universal', name: 'Universal Studios Lot', cityId: 'us-ca-losangeles', where: 'Universal City, California', founded: 1915, owner: 'NBCUniversal (Comcast)', knownFor: 'The largest working backlot in Hollywood, with the theme park next door.', stagesApprox: 30, facilities: ['backlot', 'post', 'workshops', 'offices', 'tours'], tier: 'flagship' },
  { id: 'paramount', name: 'Paramount Pictures Studios', cityId: 'us-ca-losangeles', where: 'Melrose Avenue, Hollywood', founded: 1926, owner: 'Paramount Skydance', knownFor: 'The last major studio still headquartered in Hollywood proper; the Bronson Gate.', stagesApprox: 30, facilities: ['backlot', 'water_tank', 'post', 'workshops', 'offices', 'tours'], tier: 'flagship', note: 'The lot on Melrose has been Paramount’s since 1926; the company itself is older.' },
  { id: 'sony-culver', name: 'Sony Pictures Studios', cityId: 'us-ca-losangeles', where: 'Culver City, California', founded: 1924, owner: 'Sony Pictures Entertainment', knownFor: 'The old MGM lot. Stage 15 is one of the largest in North America; the scoring stage is on the lot.', stagesApprox: 18, facilities: ['post', 'scoring_stage', 'workshops', 'offices', 'tours'], tier: 'flagship' },
  { id: 'fox-lot', name: 'Fox Studio Lot', cityId: 'us-ca-losangeles', where: 'Century City, Los Angeles', founded: 1928, owner: 'The Walt Disney Company', knownFor: 'Retained by Disney after the 2019 Fox purchase; the Newman scoring stage is here.', stagesApprox: 15, facilities: ['backlot', 'post', 'scoring_stage', 'offices'], tier: 'flagship' },
  { id: 'disney-burbank', name: 'Walt Disney Studios', cityId: 'us-ca-burbank', where: 'Burbank, California', founded: 1940, owner: 'The Walt Disney Company', knownFor: 'The company’s headquarters lot.', stagesApprox: 7, facilities: ['post', 'offices'], tier: 'major' },
  { id: 'radford', name: 'Radford Studio Center', cityId: 'us-ca-losangeles', where: 'Studio City, California', founded: 1928, owner: 'Hackman Capital Partners', knownFor: 'The old Republic and CBS lot; decades of television made here.', stagesApprox: 18, facilities: ['backlot', 'offices', 'workshops'], tier: 'major' },
  { id: 'sunset-gower', name: 'Sunset Gower Studios', cityId: 'us-ca-losangeles', where: 'Hollywood', founded: 1912, owner: 'Hudson Pacific Properties', knownFor: 'The original Columbia lot; independent stages in the middle of Hollywood.', stagesApprox: 12, facilities: ['offices'], tier: 'major' },
  { id: 'raleigh', name: 'Raleigh Studios', cityId: 'us-ca-losangeles', where: 'Hollywood', founded: 1915, knownFor: 'An independent lot across from Paramount; among the oldest in continuous use.', stagesApprox: 14, facilities: ['offices', 'workshops'], tier: 'mid' },
  { id: 'culver-studios', name: 'The Culver Studios', cityId: 'us-ca-losangeles', where: 'Culver City, California', founded: 1918, owner: 'Hackman Capital Partners', knownFor: 'Gone with the Wind and Citizen Kane; Amazon took the lot as a long-term tenant.', stagesApprox: 8, facilities: ['offices'], tier: 'major' },
  { id: 'trilith', name: 'Trilith Studios', cityId: 'us-ga-atlanta', where: 'Fayetteville, Georgia', founded: 2014, knownFor: 'Opened as Pinewood Atlanta; a large share of Marvel’s output was shot here.', stagesApprox: 30, facilities: ['backlot', 'led_volume', 'workshops', 'offices'], tier: 'flagship', note: 'Renamed Trilith in 2020 when Pinewood Group left the partnership.' },
  { id: 'tyler-perry', name: 'Tyler Perry Studios', cityId: 'us-ga-atlanta', where: 'Fort McPherson, Atlanta', founded: 2019, owner: 'Tyler Perry', knownFor: 'A former army post turned into one of the largest lots in the country.', stagesApprox: 12, facilities: ['backlot', 'workshops', 'offices'], tier: 'flagship', note: 'The company dates to 2006; the Fort McPherson lot opened in 2019.' },
  { id: 'kaufman-astoria', name: 'Kaufman Astoria Studios', cityId: 'us-ny-newyork', where: 'Astoria, Queens', founded: 1920, knownFor: 'Built by Paramount; Sesame Street and decades of New York production.', stagesApprox: 12, facilities: ['backlot', 'offices'], tier: 'major' },
  { id: 'steiner', name: 'Steiner Studios', cityId: 'us-ny-newyork', where: 'Brooklyn Navy Yard', founded: 2004, knownFor: 'The largest lot in New York, in the Navy Yard.', stagesApprox: 30, facilities: ['offices', 'workshops'], tier: 'flagship' },
  { id: 'silvercup', name: 'Silvercup Studios', cityId: 'us-ny-newyork', where: 'Long Island City, Queens', founded: 1983, owner: 'Hackman Capital Partners', knownFor: 'A former bakery; The Sopranos, 30 Rock and Sex and the City were made here.', stagesApprox: 20, facilities: ['offices'], tier: 'major' },
  { id: 'cinespace-chicago', name: 'Cinespace Chicago', cityId: 'us-il-chicago', where: 'North Lawndale, Chicago', founded: 2011, knownFor: 'The Dick Wolf Chicago series and a growing Midwest base.', stagesApprox: 30, facilities: ['offices', 'workshops'], tier: 'major' },
  { id: 'abq', name: 'ABQ Studios', cityId: 'us-ca-losangeles', where: 'Albuquerque, New Mexico', founded: 2007, owner: 'Netflix', knownFor: 'Bought by Netflix in 2018 as its US production hub, with an expansion after.', stagesApprox: 8, facilities: ['backlot', 'offices'], tier: 'major' },
  { id: 'pinewood-toronto', name: 'Pinewood Toronto Studios', cityId: 'ca-on-toronto', where: 'Port Lands, Toronto', founded: 2008, knownFor: 'The Mega Stage, among the largest purpose-built stages in North America.', stagesApprox: 12, largestStageSqft: 45900, facilities: ['offices', 'workshops'], tier: 'major' },
  { id: 'cinespace-toronto', name: 'Cinespace Toronto', cityId: 'ca-on-toronto', where: 'Toronto', founded: 1988, knownFor: 'Multiple campuses across the city; a mainstay of Ontario production.', stagesApprox: 30, facilities: ['offices', 'workshops'], tier: 'major' },
  { id: 'bridge', name: 'The Bridge Studios', cityId: 'ca-bc-vancouver', where: 'Burnaby, British Columbia', founded: 1987, knownFor: 'A former bridge works; long-running series base for Vancouver.', stagesApprox: 8, facilities: ['offices'], tier: 'mid' },
  { id: 'vfs', name: 'Vancouver Film Studios', cityId: 'ca-bc-vancouver', where: 'Vancouver, British Columbia', founded: 1999, owner: 'McLean Group', knownFor: 'A purpose-built lot on the east side, among the largest in Canada.', stagesApprox: 13, facilities: ['offices', 'workshops'], tier: 'major' },
  { id: 'mels', name: 'MELS Studios', cityId: 'ca-qc-montreal', where: 'Montreal, Quebec', founded: 1988, owner: 'Québecor', knownFor: 'Montreal’s largest stages and post under one owner.', stagesApprox: 12, facilities: ['post', 'offices', 'workshops'], tier: 'major' },
  { id: 'cinecitta', name: 'Cinecittà', cityId: 'it-laz-rome', where: 'Rome', founded: 1937, owner: 'Italian state (Cinecittà S.p.A.)', knownFor: 'Fellini, Ben-Hur, Gangs of New York; Teatro 5 and the water tank.', stagesApprox: 19, facilities: ['backlot', 'water_tank', 'led_volume', 'post', 'workshops', 'offices', 'tours'], tier: 'flagship' },
  { id: 'babelsberg', name: 'Studio Babelsberg', cityId: 'de-be-berlin', where: 'Potsdam, near Berlin', founded: 1912, owner: 'Cinespace Studios', knownFor: 'The oldest large-scale film studio in the world; Metropolis, The Grand Budapest Hotel.', stagesApprox: 20, facilities: ['backlot', 'workshops', 'offices'], tier: 'flagship', note: 'Cinespace Studios (TPG) became the majority owner in 2022.' },
  { id: 'bavaria', name: 'Bavaria Film Studios', cityId: 'de-02-munich', where: 'Geiselgasteig, Munich', founded: 1919, knownFor: 'Das Boot and The Neverending Story were made here.', stagesApprox: 12, facilities: ['backlot', 'post', 'offices', 'tours'], tier: 'major' },
  { id: 'barrandov', name: 'Barrandov Studios', cityId: 'cz-52-prague', where: 'Prague', founded: 1931, knownFor: 'Central Europe’s largest lot; a base for American productions in the 2000s.', stagesApprox: 13, facilities: ['backlot', 'workshops', 'offices'], tier: 'major' },
  { id: 'origo', name: 'Origo Studios', cityId: 'hu-05-budapest', where: 'Budapest', founded: 2010, knownFor: 'Blade Runner 2049 and Dune shot here on Hungary’s rebate.', stagesApprox: 9, facilities: ['backlot', 'workshops', 'offices'], tier: 'major' },
  { id: 'korda', name: 'Korda Studios', cityId: 'hu-05-budapest', where: 'Etyek, near Budapest', founded: 2007, knownFor: 'Named for Alexander Korda; one of Europe’s largest single stages.', stagesApprox: 6, largestStageSqft: 63000, facilities: ['backlot', 'workshops', 'offices'], tier: 'major' },
  { id: 'ardmore', name: 'Ardmore Studios', cityId: 'ie-lei-dublin', where: 'Bray, County Wicklow', founded: 1958, knownFor: 'Ireland’s oldest studio; Braveheart and Vikings country.', stagesApprox: 5, facilities: ['workshops', 'offices'], tier: 'mid' },
  { id: 'belfast-harbour', name: 'Belfast Harbour Studios', cityId: 'ie-lei-dublin', where: 'Belfast', founded: 2017, owner: 'Belfast Harbour', knownFor: 'Built beside the Titanic Studios where Game of Thrones was made.', stagesApprox: 6, facilities: ['workshops', 'offices'], tier: 'mid' },
  { id: 'studios-paris', name: 'Studios de Paris', cityId: 'fr-idf-paris', where: 'Saint-Denis', founded: 2012, knownFor: 'The Cité du Cinéma, built by Luc Besson.', stagesApprox: 9, facilities: ['workshops', 'offices'], tier: 'major' },
  { id: 'ciudad-luz', name: 'Ciudad de la Luz', cityId: 'es-60-valencia', where: 'Alicante', founded: 2005, knownFor: 'Large stages and a water tank on the Spanish coast; reopened in 2022.', stagesApprox: 6, facilities: ['water_tank', 'backlot', 'offices'], tier: 'mid' },
  { id: 'disney-sydney', name: 'Disney Studios Australia', cityId: 'au-nsw-sydney', where: 'Moore Park, Sydney', founded: 1998, owner: 'The Walt Disney Company', knownFor: 'Opened as Fox Studios Australia; The Matrix and the Star Wars prequels.', stagesApprox: 9, facilities: ['backlot', 'post', 'workshops', 'offices'], tier: 'flagship' },
  { id: 'village-roadshow', name: 'Village Roadshow Studios', cityId: 'au-qld-goldcoast', where: 'Oxenford, Gold Coast', founded: 1988, owner: 'Village Roadshow', knownFor: 'Aquaman and Elvis; the largest water tank in the southern hemisphere.', stagesApprox: 9, facilities: ['water_tank', 'backlot', 'workshops', 'offices'], tier: 'major' },
  { id: 'docklands', name: 'Docklands Studios Melbourne', cityId: 'au-vic-melbourne', where: 'Docklands, Melbourne', founded: 2004, owner: 'Victorian Government', knownFor: 'A sound stage of over 40,000 square feet added in 2022.', stagesApprox: 6, largestStageSqft: 40000, facilities: ['workshops', 'offices'], tier: 'major' },
  { id: 'stone-street', name: 'Stone Street Studios', cityId: 'nz-wgn-wellington', where: 'Miramar, Wellington', founded: 1998, knownFor: 'Peter Jackson’s stages beside Wētā.', stagesApprox: 6, facilities: ['workshops', 'offices'], tier: 'major' },
  { id: 'film-city', name: 'Film City', cityId: 'in-16-mumbai', where: 'Goregaon, Mumbai', founded: 1977, owner: 'Government of Maharashtra', knownFor: 'The Hindi industry’s public lot, with outdoor sets across the hillside.', stagesApprox: 16, facilities: ['backlot', 'offices'], tier: 'major' },
  { id: 'ramoji', name: 'Ramoji Film City', cityId: 'in-40-hyderabad', where: 'Hyderabad', founded: 1996, owner: 'Ramoji Group', knownFor: 'Recorded by Guinness as the world’s largest film studio complex; Baahubali.', stagesApprox: 40, facilities: ['backlot', 'post', 'workshops', 'offices', 'tours'], tier: 'flagship' },
];

export const STUDIO_LOT_BY_ID: Readonly<Record<string, StudioLot>> = Object.fromEntries(STUDIO_LOTS.map((l) => [l.id, l]));

export function lotsIn(cityId: string): StudioLot[] {
  return STUDIO_LOTS.filter((l) => l.cityId === cityId);
}

/**
 * SLATE's calibration for a stage day, in cents, before the city's cost of
 * living. This is the game's number for a working stage with power, grid and
 * an office; it is not a rate card and is labelled that way in the UI.
 */
export const STAGE_DAY_CALIBRATION: Readonly<Record<Tier, number>> = {
  boutique: 3_200_00,
  mid: 5_500_00,
  major: 9_000_00,
  flagship: 14_000_00,
};

/** The same, for what a house bills for a shot or a day of finishing. */
export const HOUSE_RATE_CALIBRATION: Readonly<Record<Tier, { vfxShot: number; finishingDay: number; mixDay: number; scoringDay: number }>> = {
  boutique: { vfxShot: 5_500_00, finishingDay: 3_800_00, mixDay: 4_500_00, scoringDay: 18_000_00 },
  mid: { vfxShot: 9_500_00, finishingDay: 6_500_00, mixDay: 7_500_00, scoringDay: 32_000_00 },
  major: { vfxShot: 16_000_00, finishingDay: 10_000_00, mixDay: 12_000_00, scoringDay: 55_000_00 },
  flagship: { vfxShot: 26_000_00, finishingDay: 16_000_00, mixDay: 18_000_00, scoringDay: 85_000_00 },
};
