/**
 * SLATE — the fashion weeks.
 *
 * The weeks are real, they run in the cities and the months they really run
 * in, and the houses are real houses that show at them. Everything else is
 * SLATE's own: the exact days, the venues, the running order, who is invited
 * and where they are sat.
 *
 * The season schedule is published a few weeks out and moves every year —
 * dates shift, a house skips a season, a house shows off schedule or in
 * another city entirely. Nothing on this list is a date to act on outside the
 * game, and no house here is announced as showing anywhere.
 */

import type { Money } from '../core/money';

export const FASHION_NOTE =
  'The weeks are real and run in the cities and months they really run in, and the houses are real '
  + 'houses that show at them. The exact days, the venues, the running order, the invitation and where '
  + 'you are sat are SLATE’s own. A season schedule is published a few weeks out and moves every year, '
  + 'so nothing here is a date to act on outside the game and no house here is announced as showing.';

// ---------------------------------------------------------------------------
// The weeks
// ---------------------------------------------------------------------------

/**
 * Which collection a week is showing.
 *
 * The naming is the industry's own and it is a season ahead of the calendar: a
 * February show is the autumn and winter of that year, and a September show is
 * the spring and summer of the next one.
 */
export type Season = 'autumn_winter' | 'spring_summer' | 'couture_spring' | 'couture_autumn' | 'resort';

export const SEASON_LABEL: Readonly<Record<Season, string>> = {
  autumn_winter: 'Autumn Winter',
  spring_summer: 'Spring Summer',
  couture_spring: 'Spring Couture',
  couture_autumn: 'Autumn Couture',
  resort: 'Resort',
};

/** What a week is: the four, a national week, or something smaller. */
export type WeekTier = 'big_four' | 'established' | 'emerging';

export const WEEK_TIER_LABEL: Readonly<Record<WeekTier, string>> = {
  big_four: 'One Of The Four',
  established: 'Established',
  emerging: 'Emerging',
};

export interface FashionWeek {
  id: string;
  name: string;
  cityId: string;
  /** The months it really runs in, 1-12, one entry per edition in a year. */
  months: readonly number[];
  /** Which collection each of those months shows, in the same order. */
  seasons: readonly Season[];
  tier: WeekTier;
  /** How hard it is to get a seat at all, 0-100. SLATE's calibration. */
  selectivity: number;
  about: string;
}

const fw = (
  id: string, name: string, cityId: string, months: readonly number[], seasons: readonly Season[],
  tier: WeekTier, selectivity: number, about: string,
): FashionWeek => ({ id, name, cityId, months, seasons, tier, selectivity, about });

const AW_SS: readonly Season[] = ['autumn_winter', 'spring_summer'];

/**
 * The weeks.
 *
 * Public record: the week exists, it is in that city, and it runs in those
 * months. SLATE's own: which day of the month, how hard it is to get in, and
 * everything that happens once you are through the door.
 */
export const FASHION_WEEKS: readonly FashionWeek[] = [
  // The four.
  fw('fw-nyfw', 'New York Fashion Week', 'us-ny-newyork', [2, 9], AW_SS, 'big_four', 84,
    'The week that opens the month, in February and September. American houses, and a lot of people who came to be photographed outside.'),
  fw('fw-lfw', 'London Fashion Week', 'uk-eng-london', [2, 9], AW_SS, 'big_four', 82,
    'The second of the four, and the one where the newest names show. British Fashion Council.'),
  fw('fw-mfw', 'Milan Fashion Week', 'it-09-milan', [2, 9], AW_SS, 'big_four', 88,
    'The Italian houses, in February and September. Camera Nazionale della Moda Italiana.'),
  fw('fw-pfw', 'Paris Fashion Week', 'fr-idf-paris', [3, 10], AW_SS, 'big_four', 94,
    'The last and the largest of the four. The Fédération de la Haute Couture et de la Mode runs it, and everybody wants to be there.'),

  // Paris and Milan also do menswear and couture, and those are their own weeks.
  fw('fw-pfw-men', 'Paris Men’s Fashion Week', 'fr-idf-paris', [1, 6], AW_SS, 'big_four', 88,
    'The menswear shows, in January and June, a fortnight before the couture.'),
  fw('fw-pfw-couture', 'Paris Haute Couture Week', 'fr-idf-paris', [1, 7], ['couture_spring', 'couture_autumn'], 'big_four', 97,
    'Couture, in January and July. A handful of houses, a few hundred seats, and almost nobody gets one.'),
  fw('fw-mfw-men', 'Milan Men’s Fashion Week', 'it-09-milan', [1, 6], AW_SS, 'big_four', 82,
    'The Italian menswear shows, in January and June.'),

  // Established weeks with their own following.
  fw('fw-cph', 'Copenhagen Fashion Week', 'dk-17-copenhagen', [1, 8], AW_SS, 'established', 70,
    'The Scandinavian week, in January and August, and the one with sustainability requirements to show at all.'),
  fw('fw-berlin', 'Berlin Fashion Week', 'de-be-berlin', [2, 7], AW_SS, 'established', 62,
    'The German week, in February and July.'),
  fw('fw-stockholm', 'Stockholm Fashion Week', 'se-26-stockholm', [1, 8], AW_SS, 'established', 58,
    'The Swedish week, run alongside the Copenhagen one.'),
  fw('fw-madrid', 'Madrid Fashion Week', 'es-md-madrid', [2, 9], AW_SS, 'established', 60,
    'The Spanish week, in February and September.'),
  fw('fw-tokyo', 'Rakuten Fashion Week Tokyo', 'jp-13-tokyo', [3, 9], AW_SS, 'established', 72,
    'The Japanese week, in March and September, a fortnight after Paris.'),
  fw('fw-seoul', 'Seoul Fashion Week', 'kr-11-seoul', [3, 10], AW_SS, 'established', 70,
    'The Korean week, in March and October, and one of the most photographed streets in the world during it.'),
  fw('fw-shanghai', 'Shanghai Fashion Week', 'cn-23-shanghai', [3, 10], AW_SS, 'established', 74,
    'The Chinese week, in March and October, and the largest in Asia by number of shows.'),
  fw('fw-spfw', 'São Paulo Fashion Week', 'br-27-saopaulo', [4, 11], AW_SS, 'established', 66,
    'The largest week in Latin America, in April and November.'),
  fw('fw-mbfwmx', 'Mercedes-Benz Fashion Week México', 'mx-cmx-mexicocity', [4, 10], AW_SS, 'established', 58,
    'The Mexican week, in April and October.'),
  fw('fw-afw', 'Australian Fashion Week', 'au-nsw-sydney', [5], ['resort'], 'established', 62,
    'The Sydney week, in May, showing resort while the northern hemisphere shows nothing.'),
  fw('fw-lagos', 'Lagos Fashion Week', 'ng-05-lagos', [10], ['spring_summer'], 'established', 64,
    'The West African week, in October, and the one that took African design to the rest of the schedule.'),
  fw('fw-lakme', 'Lakmé Fashion Week', 'in-16-mumbai', [3, 10], AW_SS, 'established', 62,
    'The Indian week, in Mumbai, in March and October.'),
  fw('fw-icw', 'India Couture Week', 'in-07-delhi', [7], ['couture_autumn'], 'established', 70,
    'The Delhi couture week, in July.'),

  // Smaller weeks, where a new name can still get a seat.
  fw('fw-toronto', 'Toronto Fashion Week', 'ca-on-toronto', [3, 9], AW_SS, 'emerging', 46,
    'The Canadian week, in March and September.'),
  fw('fw-vancouver', 'Vancouver Fashion Week', 'ca-bc-vancouver', [3, 9], AW_SS, 'emerging', 40,
    'A week that has always taken designers nobody has heard of, in March and September.'),
  fw('fw-amsterdam', 'Amsterdam Fashion Week', 'nl-07-amsterdam', [3, 9], AW_SS, 'emerging', 48,
    'The Dutch week, in March and September.'),
  fw('fw-tbilisi', 'Tbilisi Fashion Week', 'ge-51-tbilisi', [5, 11], AW_SS, 'emerging', 52,
    'The Georgian week, which the rest of the schedule started watching a decade ago.'),
  fw('fw-melbourne', 'Melbourne Fashion Festival', 'au-vic-melbourne', [3], ['autumn_winter'], 'emerging', 44,
    'The Melbourne festival, in March, which sells tickets to the public as well as seats to the trade.'),
  fw('fw-safw', 'South African Fashion Week', 'za-06-johannesburg', [4, 10], AW_SS, 'emerging', 48,
    'The Johannesburg week, in April and October.'),
  fw('fw-capetown', 'Cape Town Fashion Week', 'za-11-capetown', [8], ['spring_summer'], 'emerging', 42,
    'The Cape Town week, in August.'),
  fw('fw-miami', 'Miami Swim Week', 'us-fl-miami', [6], ['resort'], 'emerging', 50,
    'The swimwear week, in June, which is its own trade and its own crowd.'),
  fw('fw-lisbon', 'ModaLisboa', 'pt-14-lisbon', [3, 10], AW_SS, 'emerging', 44,
    'The Lisbon week, in March and October.'),
  fw('fw-istanbul', 'Istanbul Fashion Week', 'tr-34-istanbul', [3, 10], AW_SS, 'emerging', 46,
    'The Turkish week, in March and October.'),
];

export const WEEK_BY_ID: Readonly<Record<string, FashionWeek>> = Object.fromEntries(
  FASHION_WEEKS.map((week) => [week.id, week]),
);

// ---------------------------------------------------------------------------
// The houses
// ---------------------------------------------------------------------------

/**
 * A house that shows, and the week it belongs to.
 *
 * Public record: the house exists, it is that kind of house, and that is the
 * city its collections are shown in. Which day of which edition, and whether
 * it shows at all in a given season, is SLATE's own — a house really can skip
 * a season, show off schedule, or show somewhere else entirely, and this list
 * makes no claim about any particular one.
 *
 * Every brand here is one the catalog already sells, so a wardrobe and a front
 * row are talking about the same thing.
 */
export interface ShowingHouse {
  /** The brand exactly as the catalog spells it. */
  brand: string;
  weekId: string;
  /** How big a name it is on the schedule, 0-100. SLATE's calibration. */
  standing: number;
  about: string;
}

const sh = (brand: string, weekId: string, standing: number, about: string): ShowingHouse =>
  ({ brand, weekId, standing, about });

export const SHOWING_HOUSES: readonly ShowingHouse[] = [
  // Paris.
  sh('Chanel', 'fw-pfw', 99, 'The house on the rue Cambon, and the show everybody wants a seat at.'),
  sh('Dior', 'fw-pfw', 98, 'The house on the avenue Montaigne.'),
  sh('Louis Vuitton', 'fw-pfw', 98, 'The largest luxury house in the world, showing in Paris.'),
  sh('Saint Laurent', 'fw-pfw', 96, 'The house Yves Saint Laurent founded, still showing in Paris.'),
  sh('Hermès', 'fw-pfw', 95, 'The saddler that became a house, and the quietest show of the week.'),
  sh('Balenciaga', 'fw-pfw', 93, 'A Spanish house with a Paris address and a talent for a spectacle.'),
  sh('Givenchy', 'fw-pfw', 90, 'The house on the avenue George V.'),
  sh('Loewe', 'fw-pfw', 91, 'A Madrid house that shows its collections in Paris.'),
  sh('Celine', 'fw-pfw', 92, 'A Paris house, and one of the harder rooms to get into.'),
  sh('Valentino', 'fw-pfw', 92, 'A Roman house that shows its ready to wear in Paris.'),
  sh('The Row', 'fw-pfw', 88, 'A quiet American house that shows in Paris and asks for no photographs.'),
  sh('Acne Studios', 'fw-pfw', 82, 'A Stockholm house that shows in Paris.'),
  sh('Chanel', 'fw-pfw-couture', 100, 'Couture, in the Grand Palais, twice a year.'),
  sh('Dior', 'fw-pfw-couture', 99, 'Couture, and the hardest ticket of the year after Chanel.'),
  sh('Givenchy', 'fw-pfw-couture', 93, 'Couture, at the house that has made it since 1952.'),
  sh('Valentino', 'fw-pfw-couture', 95, 'Couture, shown in Paris by a Roman house.'),
  sh('Dior', 'fw-pfw-men', 92, 'The menswear collection, in January and June.'),
  sh('Louis Vuitton', 'fw-pfw-men', 94, 'The menswear show, and the loudest ticket of the men’s week.'),
  sh('Hermès', 'fw-pfw-men', 88, 'Menswear, shown the way the house does everything.'),
  sh('Saint Laurent', 'fw-pfw-men', 89, 'Menswear in Paris.'),

  // Milan.
  sh('Gucci', 'fw-mfw', 97, 'The Florentine house, showing in Milan.'),
  sh('Prada', 'fw-mfw', 96, 'The Milanese house, and the show the critics write about first.'),
  sh('Versace', 'fw-mfw', 93, 'The house on the via Gesù.'),
  sh('Fendi', 'fw-mfw', 92, 'A Roman house that shows its ready to wear in Milan.'),
  sh('Bottega Veneta', 'fw-mfw', 91, 'The Vicenza house, showing in Milan.'),
  sh('Loro Piana', 'fw-mfw', 84, 'The Piedmontese mill, and the quietest luxury in the room.'),
  sh('Brunello Cucinelli', 'fw-mfw', 82, 'The Solomeo house, showing in Milan.'),
  sh('Zegna', 'fw-mfw-men', 87, 'The Trivero house, and one of the anchors of the men’s week.'),
  sh('Prada', 'fw-mfw-men', 93, 'Menswear in Milan.'),
  sh('Gucci', 'fw-mfw-men', 92, 'Menswear in Milan.'),

  // London.
  sh('Burberry', 'fw-lfw', 92, 'The British house, and the biggest show of the London week.'),
  sh('Tom Ford', 'fw-lfw', 86, 'A house that has shown in London and in New York.'),

  // New York.
  sh('Ralph Lauren', 'fw-nyfw', 92, 'The American house, showing in New York.'),
  sh('Tom Ford', 'fw-nyfw', 87, 'An American designer’s house, showing in New York.'),
  sh('Calvin Klein', 'fw-nyfw', 84, 'A New York house.'),
  sh('SKIMS', 'fw-nyfw', 78, 'A newer American label with an audience that arrived before the clothes did.'),

  // Elsewhere on the schedule.
  sh('Moncler', 'fw-mfw', 86, 'The Aosta house, showing in Milan.'),
  sh('Stone Island', 'fw-mfw-men', 78, 'A Ravarino house, on the Milan men’s schedule.'),
  sh('Christian Louboutin', 'fw-pfw', 84, 'Shoes, shown in Paris.'),
  sh('Jimmy Choo', 'fw-lfw', 78, 'A London shoemaker on the London schedule.'),
  sh('Manolo Blahnik', 'fw-lfw', 79, 'A London house, on the London schedule.'),
];

/** Every house on a week's schedule, biggest name first. */
export function housesAt(weekId: string): ShowingHouse[] {
  return SHOWING_HOUSES.filter((house) => house.weekId === weekId)
    .sort((a, b) => b.standing - a.standing);
}

/** Every week a house shows at. */
export function weeksFor(brand: string): ShowingHouse[] {
  return SHOWING_HOUSES.filter((house) => house.brand === brand);
}

// ---------------------------------------------------------------------------
// Where you are sat
// ---------------------------------------------------------------------------

export type Seat = 'front_row' | 'second_row' | 'back' | 'standing';

export const SEAT_LABEL: Readonly<Record<Seat, string>> = {
  front_row: 'Front Row',
  second_row: 'Second Row',
  back: 'Back Of The Room',
  standing: 'Standing',
};

/** How much of the room's attention a seat carries, 0-1. */
export const SEAT_WEIGHT: Readonly<Record<Seat, number>> = {
  front_row: 1,
  second_row: 0.6,
  back: 0.28,
  standing: 0.12,
};

/** What standing a seat wants, out of a hundred, before the house is weighed. */
export const SEAT_THRESHOLD: Readonly<Record<Seat, number>> = {
  front_row: 78,
  second_row: 58,
  back: 34,
  standing: 16,
};

/**
 * How much a big name on the schedule raises the bar for each row.
 *
 * A house guards its front row absolutely and its standing room barely at all,
 * because the back of the room is where it puts the people it merely likes —
 * which is how a good client nobody has heard of still gets through the door.
 */
export const SEAT_BAR_SHARE: Readonly<Record<Seat, number>> = {
  front_row: 1,
  second_row: 0.8,
  back: 0.5,
  standing: 0.28,
};

/** How the shows are spread across the days of a week. */
export const SHOW_DAYS = 6;

/** The hours a house will put a show on at. */
export const SHOW_HOURS: readonly number[] = [10, 11, 12, 14, 15, 16, 17, 18, 19, 20];

/** How long a show and the standing about afterwards actually takes. */
export const SHOW_MINUTES = 95;

/** How long a house takes to answer a request for a seat, in days. */
export const ANSWER_DAYS: readonly [number, number] = [4, 18];

/**
 * What getting there and being dressed for it costs.
 *
 * Nobody is charged for a seat: a show is not ticketed. This is the car, the
 * hair and the rest of turning up to something photographed.
 */
export const TURNING_UP_COST: Money = 240_00;
