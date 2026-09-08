/**
 * SLATE — the cinema.
 *
 * Real chains, in the countries they really trade in, with the real
 * classification system of the country deciding who is allowed in. The
 * building is real and the certificate is real.
 *
 * What is on the screen is not. There is no listings feed here, and SLATE's
 * knowledge of what is playing anywhere this weekend would be out of date the
 * day it was written, so the program is SLATE's own: its own pictures, on
 * the release rhythm the business really runs to — a wide opening on a Friday,
 * tentpoles in the summer, horror at the end of October, the serious ones in
 * December. A title here is not a real film, and any collision with one is a
 * coincidence rather than a claim.
 */

import type { Money } from '../core/money';
import type { Rng } from '../core/rng';

export const CINEMA_NOTE =
  'The chains are real and trade in the countries they are listed in, and the certificate is the real '
  + 'one for the country you are standing in. What is showing is SLATE’s own: there is no listings feed '
  + 'here, so the program, every title, every runtime and every ticket price is SLATE’s own calibration '
  + 'and not what is on at that cinema this weekend.';

// ---------------------------------------------------------------------------
// The chains
// ---------------------------------------------------------------------------

/** What kind of house it is, which decides the price and the room. */
export type ChainTier = 'multiplex' | 'premium' | 'arthouse';

export const CHAIN_TIER_LABEL: Readonly<Record<ChainTier, string>> = {
  multiplex: 'Multiplex',
  premium: 'Premium',
  arthouse: 'Arthouse',
};

/** A presentation format. Real formats, licensed by the people who own them. */
export type Screen = 'standard' | 'large' | 'premium_large' | 'recliner' | 'screening_room';

export const SCREEN_LABEL: Readonly<Record<Screen, string>> = {
  standard: 'Standard',
  large: 'Large Format',
  premium_large: 'Premium Large Format',
  recliner: 'Recliner Seating',
  screening_room: 'Screening Room',
};

/** What each format does to the price, as a multiplier of the base. */
export const SCREEN_PREMIUM: Readonly<Record<Screen, number>> = {
  standard: 1,
  large: 1.35,
  premium_large: 1.75,
  recliner: 1.25,
  screening_room: 1.5,
};

export interface CinemaChain {
  id: string;
  name: string;
  /** Countries it really trades in, by the geography's country ids. */
  countryIds: readonly string[];
  tier: ChainTier;
  screens: readonly Screen[];
  about: string;
}

const ch = (
  id: string, name: string, countryIds: readonly string[], tier: ChainTier,
  screens: readonly Screen[], about: string,
): CinemaChain => ({ id, name, countryIds, tier, screens, about });

const BIG: readonly Screen[] = ['standard', 'large', 'premium_large', 'recliner'];
const PLAIN: readonly Screen[] = ['standard', 'large'];
const SMALL: readonly Screen[] = ['standard', 'screening_room'];

/**
 * The chains.
 *
 * Public record: the company exists and operates cinemas in those countries.
 * SLATE's own: which of its formats a given branch has, what a seat costs, and
 * everything on the screen.
 */
export const CINEMA_CHAINS: readonly CinemaChain[] = [
  // North America
  ch('amc', 'AMC Theatres', ['us'], 'multiplex', BIG, 'The largest chain in the United States, and the one with the recliners.'),
  ch('regal', 'Regal', ['us'], 'multiplex', BIG, 'Cineworld’s American chain, in malls and out by the interstate.'),
  ch('cinemark', 'Cinemark', ['us', 'br'], 'multiplex', BIG, 'A big American circuit with a long presence in Brazil.'),
  ch('marcus', 'Marcus Theatres', ['us'], 'multiplex', PLAIN, 'A Midwestern chain that has been family run since the thirties.'),
  ch('harkins', 'Harkins Theatres', ['us'], 'multiplex', BIG, 'An Arizona chain, independent, and particular about its projection.'),
  ch('alamo', 'Alamo Drafthouse Cinema', ['us'], 'premium', SMALL, 'Food at your seat and a no-talking policy they actually enforce.'),
  ch('landmark', 'Landmark Theatres', ['us'], 'arthouse', SMALL, 'The American art house circuit, where the subtitled ones play.'),
  ch('cineplex', 'Cineplex', ['ca'], 'multiplex', BIG, 'The dominant Canadian chain.'),
  ch('cinepolis', 'Cinépolis', ['mx', 'in', 'br', 'es', 'ar', 'cl', 'co', 'pe', 'us'], 'multiplex', BIG, 'The Mexican chain that became one of the largest in the world.'),
  ch('cinemex', 'Cinemex', ['mx'], 'multiplex', PLAIN, 'The other Mexican circuit, and the one in the middle of the cities.'),

  // The British Isles
  ch('cineworld', 'Cineworld', ['uk', 'ie', 'pl', 'cz', 'sk', 'hu', 'bg', 'ro', 'il'], 'multiplex', BIG, 'A British group with cinemas across central Europe and Israel.'),
  ch('odeon', 'Odeon', ['uk', 'ie', 'it', 'es', 'pt', 'no', 'se', 'fi'], 'multiplex', BIG, 'The old British circuit, now part of a European group.'),
  ch('vue', 'Vue', ['uk', 'ie', 'nl', 'de', 'dk', 'pl', 'it'], 'multiplex', PLAIN, 'A British chain with a lot of screens and reclining seats in most of them.'),
  ch('picturehouse', 'Picturehouse', ['uk'], 'arthouse', SMALL, 'The art house end of the British market, with a bar in the foyer.'),
  ch('everyman', 'Everyman', ['uk'], 'premium', SMALL, 'Sofas, a waiter and a glass of something, at a price.'),
  ch('curzon', 'Curzon', ['uk'], 'arthouse', SMALL, 'The Mayfair cinema and the chain that grew out of it. Subtitles as a matter of course.'),
  ch('showcase', 'Showcase Cinemas', ['uk', 'us', 'ar'], 'multiplex', PLAIN, 'An American company’s cinemas, mostly out of town.'),

  // Western Europe
  ch('pathe', 'Pathé', ['fr', 'nl', 'ch', 'be'], 'multiplex', BIG, 'The French company that has been in this business since it began.'),
  ch('ugc', 'UGC', ['fr', 'be'], 'multiplex', PLAIN, 'The French circuit with the monthly card everybody in Paris seems to have.'),
  ch('cgr', 'CGR Cinémas', ['fr'], 'multiplex', PLAIN, 'A French chain outside the big cities, and the largest by number of sites.'),
  ch('kinepolis', 'Kinepolis', ['be', 'nl', 'fr', 'es', 'lu', 'ch', 'ca'], 'multiplex', BIG, 'A Belgian group that built the very large multiplex and then exported it.'),
  ch('cinestar', 'CineStar', ['de', 'hr', 'rs'], 'multiplex', PLAIN, 'A German circuit, and one of the larger ones in the Balkans.'),
  ch('uci', 'UCI Kinowelt', ['de', 'it'], 'multiplex', PLAIN, 'The German and Italian arm of the Odeon group.'),
  ch('yorck', 'Yorck Kinogruppe', ['de'], 'arthouse', SMALL, 'Berlin’s art house group, with cinemas that have been there a long time.'),
  ch('thespace', 'The Space Cinema', ['it'], 'multiplex', PLAIN, 'One of the two large Italian circuits.'),
  ch('cinesa', 'Cinesa', ['es'], 'multiplex', PLAIN, 'The Spanish arm of the Odeon group.'),
  ch('yelmo', 'Yelmo Cines', ['es'], 'multiplex', PLAIN, 'A Spanish chain, and the one with the original-language screenings.'),
  ch('nos', 'NOS Cinemas', ['pt'], 'multiplex', PLAIN, 'The largest Portuguese circuit.'),

  // The Nordics and the east
  ch('nordisk', 'Nordisk Film Biografer', ['dk', 'no', 'se'], 'multiplex', PLAIN, 'The Danish company’s cinemas across Scandinavia.'),
  ch('filmstaden', 'Filmstaden', ['se'], 'multiplex', PLAIN, 'The Swedish chain, formerly SF Bio.'),
  ch('finnkino', 'Finnkino', ['fi', 'ee', 'lt', 'lv'], 'multiplex', PLAIN, 'The Finnish chain, and the largest in the Baltic states.'),
  ch('multikino', 'Multikino', ['pl'], 'multiplex', PLAIN, 'A Polish circuit with cinemas in most of the larger cities.'),
  ch('cinemacity', 'Cinema City', ['pl', 'hu', 'cz', 'ro', 'bg', 'sk', 'il'], 'multiplex', BIG, 'Cineworld’s central European chain.'),
  ch('karofilm', 'Karo', ['ru'], 'multiplex', PLAIN, 'A Russian chain, with the big Moscow houses in it.'),

  // Asia
  ch('pvrinox', 'PVR INOX', ['in'], 'multiplex', BIG, 'The largest Indian circuit, made of the two that merged.'),
  ch('cgv', 'CGV', ['kr', 'cn', 'vn', 'id', 'tr'], 'multiplex', BIG, 'The CJ group’s cinemas, and the largest chain in Korea.'),
  ch('lotte', 'Lotte Cinema', ['kr', 'vn'], 'multiplex', PLAIN, 'The Lotte group’s circuit.'),
  ch('megabox', 'Megabox', ['kr'], 'multiplex', PLAIN, 'The third of the Korean chains.'),
  ch('toho', 'TOHO Cinemas', ['jp'], 'multiplex', BIG, 'The Toho company’s cinemas, and where most of Japan sees a new film.'),
  ch('aeon', 'AEON Cinema', ['jp'], 'multiplex', PLAIN, 'The cinemas inside the AEON malls.'),
  ch('unitedjp', 'United Cinemas', ['jp'], 'multiplex', PLAIN, 'A Japanese circuit, mostly in the suburbs.'),
  ch('wanda', 'Wanda Cinemas', ['cn'], 'multiplex', BIG, 'The largest Chinese circuit.'),
  ch('uahk', 'UA Cinemas', ['hk'], 'multiplex', PLAIN, 'A Hong Kong chain with a long history in the territory.'),
  ch('broadway', 'Broadway Circuit', ['hk'], 'arthouse', SMALL, 'Hong Kong’s art house cinemas, including the one in Yau Ma Tei.'),
  ch('goldenvillage', 'Golden Village', ['sg'], 'multiplex', BIG, 'The largest Singaporean chain.'),
  ch('shaw', 'Shaw Theatres', ['sg'], 'multiplex', PLAIN, 'The Shaw family’s cinemas, in Singapore since the twenties.'),
  ch('gsc', 'Golden Screen Cinemas', ['my'], 'multiplex', PLAIN, 'The largest Malaysian circuit.'),
  ch('tgv', 'TGV Cinemas', ['my'], 'multiplex', PLAIN, 'The other Malaysian chain.'),
  ch('majorcineplex', 'Major Cineplex', ['th'], 'multiplex', BIG, 'The dominant Thai circuit.'),
  ch('sfcinema', 'SF Cinema', ['th'], 'multiplex', PLAIN, 'The other Thai chain.'),
  ch('smcinema', 'SM Cinema', ['ph'], 'multiplex', PLAIN, 'The cinemas inside the SM malls, which is most of them.'),

  // The southern hemisphere, the Gulf and Africa
  ch('event', 'Event Cinemas', ['au', 'nz'], 'multiplex', BIG, 'The largest Australian chain.'),
  ch('hoyts', 'Hoyts', ['au', 'nz', 'cl', 'ar'], 'multiplex', BIG, 'An Australian circuit that has been trading since 1909.'),
  ch('village', 'Village Cinemas', ['au', 'gr'], 'multiplex', PLAIN, 'An Australian chain, and a Greek one.'),
  ch('sterkinekor', 'Ster-Kinekor', ['za'], 'multiplex', PLAIN, 'The larger of the two South African circuits.'),
  ch('numetro', 'Nu Metro Cinemas', ['za'], 'multiplex', PLAIN, 'The other South African chain.'),
  ch('silverbird', 'Silverbird Cinemas', ['ng', 'gh'], 'multiplex', PLAIN, 'A West African chain, with the Lagos cinema at the middle of it.'),
  ch('vox', 'VOX Cinemas', ['ae', 'sa', 'om', 'bh', 'qa', 'kw', 'eg', 'lb'], 'multiplex', BIG, 'The Majid Al Futtaim group’s cinemas across the Gulf.'),
  ch('muvi', 'Muvi Cinemas', ['sa'], 'multiplex', BIG, 'A Saudi chain, built after the cinemas were allowed back in 2018.'),
  ch('novo', 'Novo Cinemas', ['ae', 'qa', 'bh'], 'multiplex', PLAIN, 'A Gulf circuit, with the Doha houses in it.'),
  ch('cinemaximum', 'Cinemaximum', ['tr'], 'multiplex', PLAIN, 'The largest Turkish chain.'),
];

export const CHAIN_BY_ID: Readonly<Record<string, CinemaChain>> = Object.fromEntries(
  CINEMA_CHAINS.map((chain) => [chain.id, chain]),
);

/** Every chain that really trades in a country. */
export function chainsInCountry(countryId: string): CinemaChain[] {
  return CINEMA_CHAINS.filter((chain) => chain.countryIds.includes(countryId));
}

// ---------------------------------------------------------------------------
// Who is allowed in
// ---------------------------------------------------------------------------

export interface Certificate {
  /** What the certificate is called where it is issued. */
  label: string;
  /**
   * The age the certificate is aimed at, which is not the same thing as the
   * age it enforces. A PG-13 keeps nobody out and is still not for a child of
   * six, and a program is weighted by this rather than by the law.
   */
  advisoryAge: number;
  /** The youngest person who may buy a ticket unaccompanied. */
  minimumAge: number;
  /** True when a younger viewer may go in with an adult. */
  accompanied: boolean;
  about: string;
}

export interface RatingSystem {
  id: string;
  /** The body that really classifies films there. */
  body: string;
  countryIds: readonly string[];
  certificates: readonly Certificate[];
}

const cert = (
  label: string, minimumAge: number, accompanied: boolean, about: string, advisoryAge = minimumAge,
): Certificate => ({ label, advisoryAge, minimumAge, accompanied, about });

/**
 * Real classification systems, with their real certificates.
 *
 * Public record: the body, the certificate names and roughly what each one
 * means. Which certificate a given SLATE picture carries is SLATE's own.
 */
export const RATING_SYSTEMS: readonly RatingSystem[] = [
  {
    id: 'mpa', body: 'Motion Picture Association', countryIds: ['us'],
    certificates: [
      cert('G', 0, false, 'General audiences.'),
      cert('PG', 0, false, 'Parental guidance suggested.', 8),
      cert('PG-13', 0, false, 'Some material may be inappropriate for children under thirteen.', 13),
      cert('R', 17, true, 'Under seventeen requires an accompanying adult.'),
      cert('NC-17', 18, false, 'Nobody seventeen and under admitted.'),
    ],
  },
  {
    id: 'bbfc', body: 'British Board of Film Classification', countryIds: ['uk'],
    certificates: [
      cert('U', 0, false, 'Suitable for all.'),
      cert('PG', 0, false, 'General viewing, but some scenes may be unsuitable for young children.', 8),
      cert('12A', 12, true, 'Under twelve only with an adult.'),
      cert('15', 15, false, 'Nobody under fifteen admitted.'),
      cert('18', 18, false, 'Adults only.'),
    ],
  },
  {
    id: 'ifco', body: 'Irish Film Classification Office', countryIds: ['ie'],
    certificates: [
      cert('G', 0, false, 'Suitable for all.'),
      cert('PG', 0, false, 'Parental guidance.', 8),
      cert('12A', 12, true, 'Under twelve only with an adult.'),
      cert('15A', 15, true, 'Under fifteen only with an adult.'),
      cert('16', 16, false, 'Nobody under sixteen admitted.'),
      cert('18', 18, false, 'Adults only.'),
    ],
  },
  {
    id: 'cnc', body: 'Centre National du Cinéma', countryIds: ['fr'],
    certificates: [
      cert('Tous Publics', 0, false, 'All audiences.'),
      cert('-12', 12, false, 'Nobody under twelve admitted.'),
      cert('-16', 16, false, 'Nobody under sixteen admitted.'),
      cert('-18', 18, false, 'Adults only.'),
    ],
  },
  {
    id: 'fsk', body: 'Freiwillige Selbstkontrolle der Filmwirtschaft', countryIds: ['de'],
    certificates: [
      cert('FSK 0', 0, false, 'Released without age restriction.'),
      cert('FSK 6', 6, false, 'Six and over.'),
      cert('FSK 12', 12, true, 'Twelve and over, or six and over with a parent.'),
      cert('FSK 16', 16, false, 'Sixteen and over.'),
      cert('FSK 18', 18, false, 'Adults only.'),
    ],
  },
  {
    id: 'icaa', body: 'Instituto de la Cinematografía y de las Artes Audiovisuales', countryIds: ['es'],
    certificates: [
      cert('APTA', 0, false, 'Suitable for all.'),
      cert('7', 7, false, 'Not recommended under seven.'),
      cert('12', 12, false, 'Not recommended under twelve.'),
      cert('16', 16, false, 'Not recommended under sixteen.'),
      cert('18', 18, false, 'Adults only.'),
    ],
  },
  {
    id: 'italy', body: 'Commissione per la Classificazione delle Opere Cinematografiche', countryIds: ['it'],
    certificates: [
      cert('T', 0, false, 'For everybody.'),
      cert('VM14', 14, false, 'Nobody under fourteen admitted.'),
      cert('VM18', 18, false, 'Adults only.'),
    ],
  },
  {
    id: 'kijkwijzer', body: 'Nederlands Instituut voor de Classificatie van Audiovisuele Media', countryIds: ['nl'],
    certificates: [
      cert('AL', 0, false, 'All ages.'),
      cert('6', 6, true, 'Six and over.'),
      cert('9', 9, true, 'Nine and over.'),
      cert('12', 12, true, 'Twelve and over.'),
      cert('14', 14, false, 'Fourteen and over.'),
      cert('16', 16, false, 'Sixteen and over.'),
      cert('18', 18, false, 'Adults only.'),
    ],
  },
  {
    id: 'acb', body: 'Australian Classification Board', countryIds: ['au'],
    certificates: [
      cert('G', 0, false, 'General.'),
      cert('PG', 0, false, 'Parental guidance recommended.', 8),
      cert('M', 0, false, 'Recommended for mature audiences.', 15),
      cert('MA 15+', 15, true, 'Under fifteen only with a parent or guardian.'),
      cert('R 18+', 18, false, 'Restricted to adults.'),
    ],
  },
  {
    id: 'nzoflc', body: 'Office of Film and Literature Classification', countryIds: ['nz'],
    certificates: [
      cert('G', 0, false, 'Suitable for general audiences.'),
      cert('PG', 0, false, 'Parental guidance.', 8),
      cert('M', 0, false, 'Suitable for mature audiences sixteen and over, though nobody is barred.', 12),
      cert('R13', 13, false, 'Restricted to thirteen and over.'),
      cert('R16', 16, false, 'Restricted to sixteen and over.'),
      cert('R18', 18, false, 'Restricted to eighteen and over.'),
    ],
  },
  {
    id: 'canada', body: 'The provincial film classification boards', countryIds: ['ca'],
    certificates: [
      cert('G', 0, false, 'General.'),
      cert('PG', 0, false, 'Parental guidance.', 8),
      cert('14A', 14, true, 'Under fourteen only with an adult.'),
      cert('18A', 18, true, 'Under eighteen only with an adult.'),
      cert('R', 18, false, 'Restricted to eighteen and over.'),
    ],
  },
  {
    id: 'eirin', body: 'Eirin', countryIds: ['jp'],
    certificates: [
      cert('G', 0, false, 'For all ages.'),
      cert('PG12', 0, true, 'Parental guidance for under twelves.', 12),
      cert('R15+', 15, false, 'Fifteen and over.'),
      cert('R18+', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'kmrb', body: 'Korea Media Rating Board', countryIds: ['kr'],
    certificates: [
      cert('All', 0, false, 'Suitable for all.'),
      cert('12', 12, true, 'Twelve and over.'),
      cert('15', 15, true, 'Fifteen and over.'),
      cert('19', 19, false, 'Adults only.'),
    ],
  },
  {
    id: 'cbfc', body: 'Central Board of Film Certification', countryIds: ['in'],
    certificates: [
      cert('U', 0, false, 'Unrestricted public exhibition.'),
      cert('UA', 0, true, 'Unrestricted, with parental guidance for under twelves.', 12),
      cert('A', 18, false, 'Restricted to adults.'),
    ],
  },
  {
    id: 'djctq', body: 'Departamento de Justiça, Classificação, Títulos e Qualificação', countryIds: ['br'],
    certificates: [
      cert('L', 0, false, 'Free for all audiences.'),
      cert('10', 10, true, 'Not recommended under ten.'),
      cert('12', 12, true, 'Not recommended under twelve.'),
      cert('14', 14, true, 'Not recommended under fourteen.'),
      cert('16', 16, true, 'Not recommended under sixteen.'),
      cert('18', 18, false, 'Not recommended under eighteen.'),
    ],
  },
  {
    id: 'fpb', body: 'Film and Publication Board', countryIds: ['za'],
    certificates: [
      cert('A', 0, false, 'Suitable for all.'),
      cert('PG', 0, false, 'Parental guidance.', 8),
      cert('10', 10, true, 'Ten and over.'),
      cert('13', 13, true, 'Thirteen and over.'),
      cert('16', 16, false, 'Sixteen and over.'),
      cert('18', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'medietilsynet', body: 'Medietilsynet', countryIds: ['no'],
    certificates: [
      cert('A', 0, false, 'Permitted for all.'),
      cert('6', 6, true, 'Six and over.'),
      cert('9', 9, true, 'Nine and over.'),
      cert('12', 12, true, 'Twelve and over.'),
      cert('15', 15, true, 'Fifteen and over.'),
      cert('18', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'smr', body: 'Statens medieråd', countryIds: ['se'],
    certificates: [
      cert('Btl', 0, false, 'Permitted for all.'),
      cert('7', 7, true, 'Seven and over.'),
      cert('11', 11, true, 'Eleven and over.'),
      cert('15', 15, false, 'Fifteen and over.'),
    ],
  },
  {
    id: 'medieraadet', body: 'Medierådet for Børn og Unge', countryIds: ['dk'],
    certificates: [
      cert('A', 0, false, 'Permitted for all.'),
      cert('7', 7, true, 'Not recommended under seven.'),
      cert('11', 11, true, 'Eleven and over.'),
      cert('15', 15, true, 'Fifteen and over.'),
    ],
  },
  {
    id: 'kavi', body: 'Kansallinen audiovisuaalinen instituutti', countryIds: ['fi'],
    certificates: [
      cert('S', 0, false, 'Permitted for all.'),
      cert('7', 7, true, 'Seven and over.'),
      cert('12', 12, true, 'Twelve and over.'),
      cert('16', 16, true, 'Sixteen and over.'),
      cert('18', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'russia', body: 'The Ministry of Culture of the Russian Federation', countryIds: ['ru'],
    certificates: [
      cert('0+', 0, false, 'For any age.'),
      cert('6+', 6, false, 'Six and over.'),
      cert('12+', 12, false, 'Twelve and over.'),
      cert('16+', 16, false, 'Sixteen and over.'),
      cert('18+', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'rtc', body: 'Dirección General de Radio, Televisión y Cinematografía', countryIds: ['mx'],
    certificates: [
      cert('AA', 0, false, 'For children under seven.'),
      cert('A', 0, false, 'For all audiences.'),
      cert('B', 0, false, 'For adolescents twelve and over.', 12),
      cert('B-15', 15, true, 'For fifteen and over.'),
      cert('C', 18, false, 'For adults eighteen and over.'),
    ],
  },
  {
    id: 'gulf', body: 'The national media regulators of the Gulf states', countryIds: ['ae', 'sa', 'qa', 'kw', 'bh', 'om'],
    certificates: [
      cert('G', 0, false, 'General.'),
      cert('PG', 0, false, 'Parental guidance.', 8),
      cert('PG-13', 13, true, 'Thirteen and over.'),
      cert('PG-15', 15, true, 'Fifteen and over.'),
      cert('18+', 18, false, 'Adults only.'),
    ],
  },
  {
    id: 'nfvcb', body: 'National Film and Video Censors Board', countryIds: ['ng'],
    certificates: [
      cert('G', 0, false, 'General exhibition.'),
      cert('PG', 0, false, 'Parental guidance.', 8),
      cert('12A', 12, true, 'Under twelve only with an adult.'),
      cert('15', 15, false, 'Fifteen and over.'),
      cert('18', 18, false, 'Adults only.'),
    ],
  },
  {
    id: 'nfa', body: 'The National Film Administration, which classifies no film by age', countryIds: ['cn'],
    certificates: [
      cert('Passed For Release', 0, false, 'China has no age classification: a film cleared for release is released for everybody.'),
    ],
  },
  {
    id: 'lsf', body: 'Lembaga Sensor Film', countryIds: ['id'],
    certificates: [
      cert('SU', 0, false, 'For all audiences.'),
      cert('13+', 13, true, 'Thirteen and over.'),
      cert('17+', 17, false, 'Seventeen and over.'),
      cert('21+', 21, false, 'Twenty one and over.'),
    ],
  },
  {
    id: 'mtrcb', body: 'Movie and Television Review and Classification Board', countryIds: ['ph'],
    certificates: [
      cert('G', 0, false, 'General patronage.'),
      cert('PG', 0, false, 'Parental guidance.', 8),
      cert('R-13', 13, false, 'Thirteen and over.'),
      cert('R-16', 16, false, 'Sixteen and over.'),
      cert('R-18', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'lpf', body: 'Lembaga Penapisan Filem', countryIds: ['my'],
    certificates: [
      cert('U', 0, false, 'For all.'),
      cert('P13', 13, true, 'Under thirteen only with a parent.'),
      cert('18', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'imda', body: 'Infocomm Media Development Authority', countryIds: ['sg'],
    certificates: [
      cert('G', 0, false, 'Suitable for all ages.'),
      cert('PG', 0, false, 'Parental guidance.', 8),
      cert('PG13', 13, true, 'Thirteen and over.'),
      cert('NC16', 16, false, 'Sixteen and over.'),
      cert('M18', 18, false, 'Eighteen and over.'),
      cert('R21', 21, false, 'Twenty one and over.'),
    ],
  },
  {
    id: 'ofnaa', body: 'Office for Film, Newspaper and Article Administration', countryIds: ['hk'],
    certificates: [
      cert('I', 0, false, 'Suitable for all ages.'),
      cert('IIA', 0, false, 'Not suitable for children.', 8),
      cert('IIB', 0, false, 'Not suitable for young persons and children.', 13),
      cert('III', 18, false, 'Persons aged eighteen and above only.'),
    ],
  },
  {
    id: 'thailand', body: 'The Ministry of Culture film board', countryIds: ['th'],
    certificates: [
      cert('P', 0, false, 'Promoted: films that should be encouraged.'),
      cert('G', 0, false, 'General audiences.'),
      cert('13+', 13, true, 'Thirteen and over.'),
      cert('15+', 15, true, 'Fifteen and over.'),
      cert('18+', 18, true, 'Eighteen and over.'),
      cert('20+', 20, false, 'Twenty and over, and identification is checked.'),
    ],
  },
  {
    id: 'incaa', body: 'Instituto Nacional de Cine y Artes Audiovisuales', countryIds: ['ar'],
    certificates: [
      cert('ATP', 0, false, 'Suitable for all audiences.'),
      cert('+13', 13, true, 'Thirteen and over.'),
      cert('+16', 16, true, 'Sixteen and over.'),
      cert('+18', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'ccc', body: 'Consejo de Calificación Cinematográfica', countryIds: ['cl'],
    certificates: [
      cert('TE', 0, false, 'For all audiences.'),
      cert('TE+7', 7, true, 'For all, and recommended over seven.'),
      cert('14', 14, true, 'Fourteen and over.'),
      cert('18', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'igac', body: 'Inspeção-Geral das Atividades Culturais', countryIds: ['pt'],
    certificates: [
      cert('M/3', 0, false, 'For three and over.', 3),
      cert('M/6', 6, false, 'For six and over.'),
      cert('M/12', 12, true, 'For twelve and over.'),
      cert('M/14', 14, true, 'For fourteen and over.'),
      cert('M/16', 16, false, 'For sixteen and over.'),
      cert('M/18', 18, false, 'For eighteen and over.'),
    ],
  },
  {
    id: 'greece', body: 'The Greek film classification committee', countryIds: ['gr'],
    certificates: [
      cert('K', 0, false, 'Suitable for all.'),
      cert('K-12', 12, true, 'Twelve and over.'),
      cert('K-16', 16, false, 'Sixteen and over.'),
      cert('K-18', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'ukraine', body: 'The State Film Agency of Ukraine', countryIds: ['ua'],
    certificates: [
      cert('General', 0, false, 'Without restriction.'),
      cert('12+', 12, true, 'Twelve and over.'),
      cert('16+', 16, false, 'Sixteen and over.'),
      cert('18+', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'israel', body: 'The Israeli Film Ratings Board', countryIds: ['il'],
    certificates: [
      cert('All Ages', 0, false, 'Permitted for all.'),
      cert('12+', 12, true, 'Twelve and over.'),
      cert('14+', 14, true, 'Fourteen and over.'),
      cert('16+', 16, false, 'Sixteen and over.'),
      cert('18+', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'turkey', body: 'The Evaluation and Classification Board of the Ministry of Culture and Tourism', countryIds: ['tr'],
    certificates: [
      cert('Genel İzleyici', 0, false, 'General audience.'),
      cert('7A', 0, true, 'Under seven with an adult.', 7),
      cert('13A', 0, true, 'Under thirteen with an adult.', 13),
      cert('15A', 0, true, 'Under fifteen with an adult.', 15),
      cert('18+', 18, false, 'Eighteen and over.'),
    ],
  },
  {
    id: 'austria', body: 'The Jugendmedienkommission and the provincial youth boards', countryIds: ['at'],
    certificates: [
      cert('0', 0, false, 'Released for all ages.'),
      cert('6', 6, false, 'Six and over.'),
      cert('10', 10, false, 'Ten and over.'),
      cert('12', 12, true, 'Twelve and over.'),
      cert('14', 14, false, 'Fourteen and over.'),
      cert('16', 16, false, 'Sixteen and over.'),
    ],
  },
  {
    id: 'swiss', body: 'The Swiss Film Age Rating Commission', countryIds: ['ch'],
    certificates: [
      cert('0', 0, false, 'For all ages.'),
      cert('6', 6, true, 'Six and over.'),
      cert('10', 10, true, 'Ten and over.'),
      cert('12', 12, true, 'Twelve and over.'),
      cert('14', 14, true, 'Fourteen and over.'),
      cert('16', 16, false, 'Sixteen and over.'),
      cert('18', 18, false, 'Eighteen and over.'),
    ],
  },
];

export const RATING_BY_COUNTRY: ReadonlyMap<string, RatingSystem> = new Map(
  RATING_SYSTEMS.flatMap((system) => system.countryIds.map((countryId) => [countryId, system] as const)),
);

/**
 * Where SLATE does not carry the country's own system.
 *
 * Most countries classify films and SLATE does not have all of them written
 * down. Rather than putting somebody else's certificate on a screen in a
 * country that does not use it, this is plainly SLATE's own advisory and says
 * so wherever it is shown.
 */
export const SLATE_ADVISORY: RatingSystem = {
  id: 'slate-advisory',
  body: 'SLATE’s own advisory, because the local certificate is not carried here',
  countryIds: [],
  certificates: [
    cert('All Ages', 0, false, 'Nothing in it that anybody need worry about.'),
    cert('Guidance', 0, false, 'A parent might want to know what is in it.', 8),
    cert('Fifteen And Over', 15, true, 'Not for children.'),
    cert('Adults Only', 18, false, 'Adults only.'),
  ],
};

/** The system a country really uses, or SLATE's own advisory, said plainly. */
export function ratingSystemFor(countryId: string): RatingSystem {
  return RATING_BY_COUNTRY.get(countryId) ?? SLATE_ADVISORY;
}

// ---------------------------------------------------------------------------
// What is on
// ---------------------------------------------------------------------------

export type FilmGenre =
  | 'action' | 'comedy' | 'drama' | 'horror' | 'animation' | 'thriller'
  | 'romance' | 'documentary' | 'science_fiction' | 'musical';

export const GENRE_LABEL: Readonly<Record<FilmGenre, string>> = {
  action: 'Action',
  comedy: 'Comedy',
  drama: 'Drama',
  horror: 'Horror',
  animation: 'Animation',
  thriller: 'Thriller',
  romance: 'Romance',
  documentary: 'Documentary',
  science_fiction: 'Science Fiction',
  musical: 'Musical',
};

export const GENRES: readonly FilmGenre[] = [
  'action', 'comedy', 'drama', 'horror', 'animation', 'thriller',
  'romance', 'documentary', 'science_fiction', 'musical',
];

/**
 * The release rhythm, which is real even though the films are not.
 *
 * The business really does put its biggest pictures out between May and
 * August, its horror at the end of October, its family films in the school
 * holidays and its serious ones in December so they are fresh in January.
 */
export interface Season {
  id: string;
  label: string;
  months: readonly number[];
  favours: readonly FilmGenre[];
  /** How much bigger the week's opening tends to be. */
  weight: number;
  about: string;
}

export const SEASONS: readonly Season[] = [
  { id: 'summer', label: 'Summer', months: [5, 6, 7, 8], favours: ['action', 'science_fiction', 'animation', 'comedy'], weight: 1.35, about: 'Tentpole season. The big ones open on the first Friday they can.' },
  { id: 'halloween', label: 'Halloween', months: [10], favours: ['horror', 'thriller'], weight: 1.15, about: 'The end of October, when the horror pictures go out.' },
  { id: 'awards', label: 'Awards Season', months: [11, 12], favours: ['drama', 'documentary', 'musical'], weight: 1.2, about: 'The serious ones, dated late so they are fresh when the votes go out.' },
  { id: 'newyear', label: 'The New Year', months: [1, 2], favours: ['drama', 'romance', 'thriller'], weight: 0.8, about: 'The quiet months, when what is on has usually been on a while.' },
  { id: 'spring', label: 'Spring', months: [3, 4], favours: ['comedy', 'animation', 'action'], weight: 0.95, about: 'The school holidays, and the run up to summer.' },
  { id: 'autumn', label: 'Autumn', months: [9], favours: ['drama', 'thriller', 'horror'], weight: 0.85, about: 'After the summer and before the awards run.' },
];

export function seasonFor(month: number): Season {
  return SEASONS.find((season) => season.months.includes(month)) ?? SEASONS[4]!;
}

// ---------------------------------------------------------------------------
// Titles, which are SLATE's own
// ---------------------------------------------------------------------------

const ARTICLE_NOUNS = [
  'Hollow', 'Reckoning', 'Undertow', 'Quiet Part', 'Long Way Down', 'Salt Road', 'Cold Open',
  'Last Ferry', 'Second Wife', 'Paper Wall', 'Glass Season', 'Winter Count', 'Narrow Sea',
  'Bright Hours', 'Fault Line', 'Night Porter’s Daughter', 'Weight Of Water', 'Borrowed Coat',
  'Sound Of Traffic', 'Other Half', 'Wrong Kitchen', 'Fifth Floor', 'Great Silence', 'Lending Library',
  'Nine Bells', 'Fox And The Field', 'Broken Hour', 'Middle Distance', 'Empty Quarter', 'Tenant',
];

const BARE_NOUNS = [
  'Ironwood', 'Saltmarsh', 'Cold Harbor', 'Nightjar', 'Ravenglass', 'Undercurrent', 'Blacklight',
  'Overwinter', 'Fathom', 'Kestrel Down', 'Shoreline', 'Groundwork', 'Halfmoon', 'Lantern Hill',
  'Sundown County', 'Riverkeep', 'Slipstream', 'Deadfall', 'Milemarker', 'Tidewater',
  'Ashgrove', 'Windrow', 'Bellwether', 'Longshore', 'Northing', 'Quarrytown', 'Stonecrop',
];

const PREPOSITIONAL = [
  'A Year In The Wire', 'Everything We Kept', 'Somebody Else’s Weather', 'What The River Took',
  'Nobody Comes Here Twice', 'Before The Thaw', 'After The Fair', 'How To Leave A House',
  'The Part Where You Run', 'Where The Light Gets In Late', 'All The Doors At Once',
  'Nothing Happened On Tuesday', 'Seventeen Miles Of Nothing', 'We Were Only Passing',
  'Come Back For The Dog', 'Tell Them It Was Quick', 'One More Winter Here',
];

const SEQUEL_TAILS = ['II', 'III', 'Part Two', 'Part Three', 'Reckoning', 'Homecoming', 'The Long Fall'];

const COLONS = [
  'The Turning', 'Cold Front', 'Last Light', 'The Undertow', 'Deep Water', 'The Quiet Hour',
  'Fault Lines', 'The Reckoning', 'Homefront', 'The Narrows',
];

/**
 * A title for a picture that does not exist.
 *
 * Composed rather than listed, so a save never runs out and two cities never
 * quietly show the same made up film in the same week by accident.
 */
export function titleFor(rng: Rng, genre: FilmGenre, franchise: boolean): string {
  if (franchise) {
    const base = rng.pick(BARE_NOUNS);
    return rng.chance(0.5) ? `${base} ${rng.pick(SEQUEL_TAILS)}` : `${base}: ${rng.pick(COLONS)}`;
  }
  const roll = rng.next();
  if (genre === 'documentary') return `${rng.pick(PREPOSITIONAL)}`;
  if (roll < 0.4) return `The ${rng.pick(ARTICLE_NOUNS)}`;
  if (roll < 0.72) return rng.pick(BARE_NOUNS);
  return rng.pick(PREPOSITIONAL);
}

/** How many distinct titles the parts can make, for the checker to hold. */
export const TITLE_COMBINATIONS =
  ARTICLE_NOUNS.length + BARE_NOUNS.length + PREPOSITIONAL.length
  + BARE_NOUNS.length * (SEQUEL_TAILS.length + COLONS.length);

// ---------------------------------------------------------------------------
// What a seat costs
// ---------------------------------------------------------------------------

/** The base price of a standard evening seat, before the city and the format. */
export const BASE_TICKET: Money = 13_50;

/** What a house charges over the base, by what kind of house it is. */
export const TIER_PREMIUM: Readonly<Record<ChainTier, number>> = {
  multiplex: 1,
  premium: 1.85,
  arthouse: 1.1,
};

/** A matinee is cheaper, everywhere, always. */
export const MATINEE_DISCOUNT = 0.72;
export const MATINEE_BEFORE_HOUR = 17;

/** What the concession stand asks, before the city. */
export const SNACK_PRICES: Readonly<Record<'nothing' | 'small' | 'large' | 'works', Money>> = {
  nothing: 0,
  small: 7_50,
  large: 13_00,
  works: 24_00,
};

export const SNACK_LABEL: Readonly<Record<'nothing' | 'small' | 'large' | 'works', string>> = {
  nothing: 'Nothing',
  small: 'A Drink',
  large: 'Popcorn And A Drink',
  works: 'The Works',
};

/** Seats in a screen, by format. SLATE's own calibration. */
export const SCREEN_SEATS: Readonly<Record<Screen, number>> = {
  standard: 180,
  large: 320,
  premium_large: 400,
  recliner: 120,
  screening_room: 45,
};

/** How long the adverts and trailers run before the picture starts. */
export const TRAILERS_MINUTES = 20;
