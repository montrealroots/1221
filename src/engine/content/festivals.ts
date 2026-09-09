/**
 * SLATE — the festivals you can send a picture to.
 *
 * The last step of making something yourself is putting it somewhere, and for
 * a picture that nobody commissioned that means a submission: a form, a fee
 * and a long wait, usually ending in a no. These are real festivals that take
 * work from people nobody has heard of, in cities this world has.
 *
 * Public record: the festival exists, it is in that city, and it takes the
 * kind of work it is listed as taking. SLATE's own arithmetic: the month it
 * is placed in, every fee, every deadline, how selective it is and what it
 * does for you. Festivals move their dates and change their fees every year
 * and there is no feed for either here, so nothing on this list is a deadline
 * you should act on outside the game.
 */

import type { Money } from '../core/money';

/** What a festival will look at. */
export type FilmFormat = 'short' | 'feature' | 'documentary' | 'animation';

export const FORMAT_LABEL: Readonly<Record<FilmFormat, string>> = {
  short: 'Short',
  feature: 'Feature',
  documentary: 'Documentary',
  animation: 'Animation',
};

export const FESTIVAL_NOTE =
  'The festivals here are real and take work from people nobody has heard of. The month, the fee, the '
  + 'deadline and how hard it is to get in are SLATE’s own calibration: festivals move and change their '
  + 'terms every year, so nothing here is a date or a price to act on outside the game.';

export interface Festival {
  id: string;
  name: string;
  cityId: string;
  /** The month it runs, 1-12. SLATE's placement of a thing that moves. */
  month: number;
  takes: readonly FilmFormat[];
  /**
   * How hard it is to get into, 0-100. The great ones take a fraction of a
   * percent of what is sent to them; a small one takes a good deal more.
   */
  selectivity: number;
  /** What the entry costs. SLATE's calibration. */
  fee: Money;
  /** What getting in is worth to somebody nobody has heard of, 0-100. */
  standing: number;
  about: string;
}

const fe = (
  id: string, name: string, cityId: string, month: number, takes: readonly FilmFormat[],
  selectivity: number, fee: Money, standing: number, about: string,
): Festival => ({ id, name, cityId, month, takes, selectivity, fee, standing, about });

const ALL: readonly FilmFormat[] = ['short', 'feature', 'documentary', 'animation'];
const SHORTS_AND_FEATURES: readonly FilmFormat[] = ['short', 'feature'];

/**
 * The list.
 *
 * Kept to festivals that really take open submissions and really happen in a
 * city this world carries. Park City and the Lido are not on it because those
 * towns are not in the geography, and moving a festival to a city it is not in
 * would be a claim about the world that is not true.
 */
export const FESTIVALS: readonly Festival[] = [
  fe('fest-sxsw', 'SXSW', 'us-tx-austin', 3, SHORTS_AND_FEATURES, 92, 65_00, 88,
    'The film half of the Austin festival, which takes shorts and features from people nobody has heard of. The month, the fee and the odds are SLATE’s calibration.'),
  fe('fest-tribeca', 'Tribeca Festival', 'us-ny-newyork', 6, ALL, 90, 75_00, 86,
    'The New York festival founded after 2001, which takes shorts, features and documentaries by open submission. Fee and odds are SLATE’s calibration.'),
  fe('fest-tiff', 'Toronto International Film Festival', 'ca-on-toronto', 9, ['feature', 'documentary'], 95, 95_00, 94,
    'One of the largest public festivals in the world, and a place a first feature can be seen by everybody at once. Fee and odds are SLATE’s calibration.'),
  fe('fest-hotdocs', 'Hot Docs', 'ca-on-toronto', 4, ['documentary'], 84, 60_00, 80,
    'The Toronto documentary festival, which takes documentaries and nothing else. Fee and odds are SLATE’s calibration.'),
  fe('fest-berlinale', 'Berlinale', 'de-be-berlin', 2, ALL, 94, 55_00, 92,
    'The Berlin International Film Festival, which runs in February and takes work in every length. Fee and odds are SLATE’s calibration.'),
  fe('fest-cannes', 'Festival de Cannes', 'fr-paca-cannes', 5, SHORTS_AND_FEATURES, 98, 110_00, 98,
    'The one everybody has heard of. It takes a vanishingly small share of what is sent to it. Fee and odds are SLATE’s calibration.'),
  fe('fest-iffr', 'International Film Festival Rotterdam', 'nl-11-rotterdam', 1, ALL, 86, 40_00, 82,
    'The Rotterdam festival, which has always looked at first films and difficult ones. Fee and odds are SLATE’s calibration.'),
  fe('fest-lff', 'BFI London Film Festival', 'uk-eng-london', 10, ALL, 90, 55_00, 87,
    'The British Film Institute’s London festival, in October. Fee and odds are SLATE’s calibration.'),
  fe('fest-idfa', 'IDFA', 'nl-07-amsterdam', 11, ['documentary'], 88, 45_00, 85,
    'The Amsterdam documentary festival, the largest of its kind. Fee and odds are SLATE’s calibration.'),
  fe('fest-afi', 'AFI Fest', 'us-ca-losangeles', 10, ALL, 85, 60_00, 80,
    'The American Film Institute’s Los Angeles festival. Fee and odds are SLATE’s calibration.'),
  fe('fest-biff', 'Busan International Film Festival', 'kr-10-busan', 10, ['feature', 'documentary'], 89, 35_00, 84,
    'The largest festival in Asia, in Busan every autumn. Fee and odds are SLATE’s calibration.'),
  fe('fest-sff', 'Sydney Film Festival', 'au-nsw-sydney', 6, ALL, 80, 45_00, 74,
    'The Sydney festival, which runs in June and takes open submissions. Fee and odds are SLATE’s calibration.'),
  fe('fest-miff', 'Melbourne International Film Festival', 'au-vic-melbourne', 8, ALL, 82, 45_00, 76,
    'The Melbourne festival, in August. Fee and odds are SLATE’s calibration.'),
  fe('fest-tokyo', 'Tokyo International Film Festival', 'jp-13-tokyo', 10, ['feature', 'animation'], 87, 40_00, 80,
    'The Tokyo festival, which takes features and has a long relationship with animation. Fee and odds are SLATE’s calibration.'),
  fe('fest-mami', 'Mumbai Film Festival', 'in-16-mumbai', 11, ALL, 80, 25_00, 74,
    'The Mumbai festival, which has long shown first films from across South Asia. Fee and odds are SLATE’s calibration.'),
  fe('fest-durban', 'Durban International Film Festival', 'za-02-durban', 7, ALL, 72, 20_00, 66,
    'The oldest festival in South Africa, in Durban in July. Fee and odds are SLATE’s calibration.'),
  fe('fest-cairo', 'Cairo International Film Festival', 'eg-11-cairo', 11, ['feature', 'documentary'], 78, 25_00, 72,
    'The Cairo festival, the oldest in the Arab world. Fee and odds are SLATE’s calibration.'),
  fe('fest-marrakech', 'Marrakech International Film Festival', 'ma-07-marrakesh', 12, ['feature'], 84, 30_00, 76,
    'The Marrakech festival, at the end of the year. Fee and odds are SLATE’s calibration.'),
  fe('fest-ficg', 'Guadalajara International Film Festival', 'mx-14-guadalajara', 6, ALL, 74, 20_00, 68,
    'The Guadalajara festival, the largest in Latin America. Fee and odds are SLATE’s calibration.'),
  fe('fest-bafici', 'BAFICI', 'ar-07-buenosaires', 4, ALL, 76, 20_00, 70,
    'The Buenos Aires independent festival, which exists for exactly this kind of picture. Fee and odds are SLATE’s calibration.'),
  fe('fest-cphdox', 'CPH:DOX', 'dk-17-copenhagen', 3, ['documentary'], 82, 40_00, 78,
    'The Copenhagen documentary festival, in March. Fee and odds are SLATE’s calibration.'),
  fe('fest-poff', 'Tallinn Black Nights Film Festival', 'ee-01-tallinn', 11, ALL, 74, 30_00, 70,
    'The Tallinn festival, in the dark end of the year. Fee and odds are SLATE’s calibration.'),
  fe('fest-goteborg', 'Göteborg Film Festival', 'se-28-gothenburg', 1, ALL, 76, 30_00, 71,
    'The largest festival in the Nordic countries, in January. Fee and odds are SLATE’s calibration.'),
  fe('fest-gff', 'Glasgow Film Festival', 'uk-sct-glasgow', 3, SHORTS_AND_FEATURES, 68, 25_00, 62,
    'The Glasgow festival, which takes shorts and features by open submission. Fee and odds are SLATE’s calibration.'),
  fe('fest-diff', 'Dublin International Film Festival', 'ie-lei-dublin', 2, ALL, 66, 25_00, 60,
    'The Dublin festival, in the spring. Fee and odds are SLATE’s calibration.'),
  fe('fest-oiaf', 'Ottawa International Animation Festival', 'ca-08-ottawa', 9, ['animation', 'short'], 80, 35_00, 74,
    'The Ottawa animation festival, which takes animation and animated shorts. Fee and odds are SLATE’s calibration.'),
  fe('fest-fantasia', 'Fantasia International Film Festival', 'ca-qc-montreal', 7, SHORTS_AND_FEATURES, 72, 35_00, 68,
    'The Montreal genre festival, in July, which has always taken first films. Fee and odds are SLATE’s calibration.'),
  fe('fest-viff', 'Vancouver International Film Festival', 'ca-bc-vancouver', 9, ALL, 74, 35_00, 70,
    'The Vancouver festival, at the end of the summer. Fee and odds are SLATE’s calibration.'),
];

export const FESTIVAL_BY_ID: Readonly<Record<string, Festival>> = Object.fromEntries(
  FESTIVALS.map((festival) => [festival.id, festival]),
);

/** Which festivals would even look at a picture of this kind. */
export function festivalsFor(format: FilmFormat): Festival[] {
  return FESTIVALS.filter((festival) => festival.takes.includes(format))
    .sort((a, b) => b.standing - a.standing);
}

/** How long a festival takes to answer, in days. Long, because they are. */
export const ANSWER_DAYS: readonly [number, number] = [45, 120];
