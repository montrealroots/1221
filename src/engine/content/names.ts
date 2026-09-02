/**
 * SLATE — Name pools for deterministic world generation.
 *
 * All generation draws from a seeded stream, so the same save always produces
 * the same people, the same street addresses and the same project titles.
 */

import type { Rng } from '../core/rng';

export const GIVEN_NAMES: readonly string[] = [
  'Adrian', 'Alina', 'Amara', 'Anders', 'Anika', 'Arjun', 'Asha', 'Aurelio', 'Ayodele', 'Beatriz',
  'Benedict', 'Bianca', 'Caleb', 'Camille', 'Cassian', 'Cecilia', 'Chidi', 'Clara', 'Cormac', 'Dahlia',
  'Damian', 'Daniela', 'Darius', 'Delphine', 'Desmond', 'Dmitri', 'Eamon', 'Edith', 'Elena', 'Elias',
  'Eloise', 'Emeka', 'Esme', 'Ezra', 'Fatima', 'Felix', 'Fiona', 'Florence', 'Gabriel', 'Genevieve',
  'Gideon', 'Greta', 'Hana', 'Harper', 'Hassan', 'Helena', 'Hugo', 'Idris', 'Imani', 'Ines',
  'Isaac', 'Isla', 'Ivan', 'Jasmine', 'Javier', 'Jonah', 'Josephine', 'Julian', 'Kai', 'Kalinda',
  'Keiko', 'Kenji', 'Kira', 'Lachlan', 'Laila', 'Lars', 'Leandro', 'Leona', 'Linnea', 'Lorenzo',
  'Lucia', 'Magnus', 'Maeve', 'Malik', 'Margot', 'Mariam', 'Mateo', 'Maya', 'Micah', 'Mira',
  'Nadia', 'Nikolai', 'Nina', 'Noor', 'Nyla', 'Octavia', 'Olive', 'Omar', 'Oscar', 'Priya',
  'Quentin', 'Rafael', 'Rania', 'Reuben', 'Rhea', 'Rosalind', 'Rowan', 'Sabine', 'Samira', 'Santiago',
  'Saoirse', 'Sebastian', 'Selma', 'Silas', 'Simone', 'Sofia', 'Soren', 'Sylvie', 'Tamsin', 'Tariq',
  'Thea', 'Theo', 'Tobias', 'Uma', 'Valentina', 'Vera', 'Viktor', 'Wren', 'Xavier', 'Yara',
  'Yusuf', 'Zara', 'Zoe', 'Ada', 'Aurora', 'Blaise', 'Corin', 'Dara', 'Elio', 'Fenna',
];

export const FAMILY_NAMES: readonly string[] = [
  'Abara', 'Adeyemi', 'Albright', 'Alvarez', 'Ashford', 'Baptiste', 'Barlow', 'Beaumont', 'Bellweather', 'Bergstrom',
  'Blackwood', 'Bonnet', 'Braddock', 'Cabrera', 'Calloway', 'Carbone', 'Castellanos', 'Chatterjee', 'Chaudhry', 'Colvin',
  'Crane', 'Dalgleish', 'Danforth', 'Delacroix', 'Devereux', 'Dimitriou', 'Donnelly', 'Eastwick', 'Egwuatu', 'Elmore',
  'Fairbanks', 'Falconer', 'Ferreira', 'Fitzgerald', 'Fontaine', 'Gallagher', 'Garrison', 'Ghosh', 'Grimaldi', 'Hallowell',
  'Hargreave', 'Hasegawa', 'Hollingsworth', 'Ibarra', 'Ingram', 'Iwuchukwu', 'Jansen', 'Kaminski', 'Karlsson', 'Kavanagh',
  'Khoury', 'Kingsley', 'Kowalczyk', 'Laurent', 'Leclerc', 'Lindqvist', 'Lockhart', 'Maguire', 'Mancini', 'Marchetti',
  'Mbeki', 'Mendoza', 'Merriweather', 'Nakamura', 'Navarro', 'Nkemdirim', 'Nordstrom', 'Okafor', 'Oyelaran', 'Pemberton',
  'Petrova', 'Pinheiro', 'Quintero', 'Rasmussen', 'Ravenscroft', 'Reyes', 'Ricci', 'Rosenthal', 'Sandoval', 'Sasaki',
  'Sinclair', 'Sorensen', 'Stavros', 'Sterling', 'Sullivan', 'Tanaka', 'Thackeray', 'Torrance', 'Underhill', 'Vandermeer',
  'Varga', 'Vasquez', 'Villanueva', 'Wainwright', 'Whitaker', 'Winterbourne', 'Yamada', 'Yildirim', 'Zabala', 'Zielinski',
];

export const STREET_NAMES: readonly string[] = [
  'Alder', 'Ashgrove', 'Bayview', 'Beechwood', 'Bramblewood', 'Bridgeport', 'Cedar Hollow', 'Chapel',
  'Clearwater', 'Cliffside', 'Coldwater', 'Crescent', 'Dunmore', 'Eastvale', 'Elmhurst', 'Fairhaven',
  'Foxglove', 'Glenmere', 'Granite', 'Harbour', 'Hawthorne', 'Highfield', 'Hollyoak', 'Ivywood',
  'Kingsbridge', 'Larkspur', 'Laurel Canyon', 'Linden', 'Marlowe', 'Meadowbrook', 'Millbank', 'Northcliff',
  'Oakmont', 'Orchard', 'Pemberley', 'Pinehurst', 'Quarry', 'Ravenswood', 'Redbourne', 'Rosemont',
  'Silverbirch', 'Stonegate', 'Sunfield', 'Thornbury', 'Vista Ridge', 'Wainscott', 'Westbourne', 'Willowmere',
  'Windermere', 'Wynnewood',
];

export const STREET_SUFFIXES: readonly string[] = [
  'Avenue', 'Boulevard', 'Court', 'Drive', 'Lane', 'Place', 'Road', 'Street', 'Terrace', 'Way',
];

export const COMPANY_FIRST: readonly string[] = [
  'Amber', 'Anvil', 'Arcadia', 'Ardent', 'Beacon', 'Bellhouse', 'Bright', 'Cardinal', 'Cascade', 'Cobalt',
  'Compass', 'Crown', 'Ember', 'Fathom', 'Ferrous', 'Foundry', 'Glasshouse', 'Granite', 'Harbour', 'Hollow',
  'Ironbark', 'Keystone', 'Lantern', 'Longshore', 'Marrow', 'Midnight', 'Northstar', 'Oakhill', 'Overcast', 'Paperbird',
  'Quarry', 'Redwood', 'Saltbox', 'Sable', 'Sixpence', 'Slate', 'Stonecrop', 'Tallgrass', 'Thistle', 'Undertow',
  'Vantage', 'Wayfarer', 'Westerly', 'Wildfire', 'Yellowfield',
];

export const COMPANY_SECOND: readonly string[] = [
  'Pictures', 'Films', 'Productions', 'Entertainment', 'Media', 'Studios', 'Content', 'Works', 'House', 'Company',
  'Collective', 'Group', 'Partners', 'Projects', 'Stories',
];

export const TITLE_ADJECTIVES: readonly string[] = [
  'Bitter', 'Blind', 'Bright', 'Broken', 'Burning', 'Cold', 'Crooked', 'Dark', 'Distant', 'Empty',
  'Endless', 'Fading', 'False', 'Final', 'Forgotten', 'Golden', 'Hollow', 'Hungry', 'Last', 'Long',
  'Lost', 'Loud', 'Missing', 'Northern', 'Patient', 'Quiet', 'Restless', 'Sacred', 'Silent', 'Slow',
  'Small', 'Stolen', 'Sudden', 'Sweet', 'Terrible', 'Untitled', 'Violent', 'Wild', 'Wrong',
];

export const TITLE_NOUNS: readonly string[] = [
  'Alibi', 'Anchor', 'Appetite', 'Ascent', 'Bargain', 'Blueprint', 'Border', 'Cartographer', 'Ceremony', 'Circuit',
  'Confession', 'Continent', 'Counterweight', 'Current', 'Deposition', 'Detour', 'Dictionary', 'Distance', 'Elegy', 'Ensemble',
  'Equinox', 'Exhibit', 'Fault Line', 'Filament', 'Firebreak', 'Forecast', 'Foundling', 'Gallery', 'Harvest', 'Hinterland',
  'Homecoming', 'Hourglass', 'Inheritance', 'Interval', 'Junction', 'Latitude', 'Lighthouse', 'Machinist', 'Meridian', 'Migration',
  'Nightshift', 'Obituary', 'Orbit', 'Overture', 'Passenger', 'Pendulum', 'Perimeter', 'Provenance', 'Quarantine', 'Reckoning',
  'Remainder', 'Residue', 'Reservoir', 'Retrograde', 'Sentinel', 'Shoreline', 'Signal', 'Skyline', 'Sleepwalker', 'Solstice',
  'Sparrow', 'Statement', 'Sundown', 'Testament', 'Threshold', 'Tributary', 'Undertow', 'Vanishing', 'Vault', 'Waterline',
];

export const TITLE_PATTERNS: readonly ((rng: Rng) => string)[] = [
  (r) => `The ${r.pick(TITLE_NOUNS)}`,
  (r) => `${r.pick(TITLE_ADJECTIVES)} ${r.pick(TITLE_NOUNS)}`,
  (r) => `The ${r.pick(TITLE_ADJECTIVES)} ${r.pick(TITLE_NOUNS)}`,
  (r) => `${r.pick(TITLE_NOUNS)}`,
  (r) => `${r.pick(TITLE_NOUNS)} & ${r.pick(TITLE_NOUNS)}`,
  (r) => `A ${r.pick(TITLE_ADJECTIVES)} ${r.pick(TITLE_NOUNS)}`,
  (r) => `${r.pick(GIVEN_NAMES)}`,
  (r) => `The ${r.pick(TITLE_NOUNS)} of ${r.pick(STREET_NAMES)}`,
];

export function generatePersonName(rng: Rng): { first: string; last: string } {
  return { first: rng.pick(GIVEN_NAMES), last: rng.pick(FAMILY_NAMES) };
}

export function generateAddress(rng: Rng): string {
  const number = rng.int(1, 9) * 1000 + rng.int(0, 999);
  return `${number} ${rng.pick(STREET_NAMES)} ${rng.pick(STREET_SUFFIXES)}`;
}

export function generateCompanyName(rng: Rng): string {
  return `${rng.pick(COMPANY_FIRST)} ${rng.pick(COMPANY_SECOND)}`;
}

export function generateProjectTitle(rng: Rng): string {
  return rng.pick(TITLE_PATTERNS)(rng);
}

export function generateCharacterName(rng: Rng): string {
  return rng.chance(0.4)
    ? rng.pick(GIVEN_NAMES)
    : `${rng.pick(GIVEN_NAMES)} ${rng.pick(FAMILY_NAMES)}`;
}

export const PRONOUN_OPTIONS: readonly string[] = ['she/her', 'he/him', 'they/them'];
