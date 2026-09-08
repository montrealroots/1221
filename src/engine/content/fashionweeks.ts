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
  'The weeks are real and the houses are real houses that show at them. Most of these run to a window '
  + 'that is public record and sits where it is marked; the ones SLATE has placed itself say so on the '
  + 'row. The exact days inside the window, the venues, the running order, the invitation and where you '
  + 'are sat are SLATE’s own. A season schedule is published a few weeks out and moves every year, so '
  + 'nothing here is a date to act on outside the game and no house here is announced as showing.';

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
export type Season =
  | 'autumn_winter' | 'spring_summer'
  | 'couture_spring' | 'couture_autumn' | 'bridal'
  | 'resort' | 'summer_resort' | 'winter_festive' | 'annual';

export const SEASON_LABEL: Readonly<Record<Season, string>> = {
  autumn_winter: 'Autumn Winter',
  spring_summer: 'Spring Summer',
  couture_spring: 'Spring Couture',
  couture_autumn: 'Autumn Couture',
  bridal: 'Bridal Couture',
  resort: 'Resort',
  summer_resort: 'Summer Resort',
  winter_festive: 'Winter Festive',
  annual: 'The Year’s Collections',
};

/**
 * Which of these are named for a season that has not arrived yet.
 *
 * A collection shown in the back half of the year for a season that lands in
 * the next one is named for that next year — a September spring/summer show
 * is next year's spring, and a November show of the southern winter is next
 * year's winter. A festive collection shown in October is for the festive
 * season two months later, so it keeps the year it was shown in.
 */
export const AHEAD_OF_THE_YEAR: Readonly<Record<Season, boolean>> = {
  autumn_winter: false,
  spring_summer: true,
  couture_spring: false,
  couture_autumn: false,
  bridal: false,
  resort: true,
  summer_resort: false,
  winter_festive: false,
  annual: false,
};

/** What a week is: the four, a national week, or something smaller. */
export type WeekTier = 'big_four' | 'established' | 'emerging';

export const WEEK_TIER_LABEL: Readonly<Record<WeekTier, string>> = {
  big_four: 'One Of The Four',
  established: 'Established',
  emerging: 'Emerging',
};

/**
 * When a week runs, and what it is showing when it does.
 *
 * The month and the days are the window the week really falls in, which is
 * why Paris starts in the last days of February rather than in March: the
 * four run back to back and Paris is the one that spills over into the next
 * month rather than the one that begins in it.
 */
export interface Edition {
  /** The month the week opens in, 1-12. */
  month: number;
  /** The days of that month it opens between, inclusive. */
  days: readonly [number, number];
  season: Season;
}

/**
 * How much of a week's dates is public record.
 *
 * `record` means the months and the rough window are documented and stable
 * year to year. `slate` means the week is real and really runs, and SLATE has
 * placed it in a month rather than knowing which one it will pick this year —
 * a lot of the smaller weeks move, skip a season or change organiser, and
 * saying otherwise would be inventing a fact.
 */
export type Placement = 'record' | 'slate';

export interface FashionWeek {
  id: string;
  name: string;
  cityId: string;
  /** Every edition it runs in a calendar year, in the order it runs them. */
  editions: readonly Edition[];
  /** Whether those dates are public record or SLATE's own placement. */
  placement: Placement;
  tier: WeekTier;
  /** How hard it is to get a seat at all, 0-100. SLATE's calibration. */
  selectivity: number;
  about: string;
}

const fw = (
  id: string, name: string, cityId: string, editions: readonly Edition[], placement: Placement,
  tier: WeekTier, selectivity: number, about: string,
): FashionWeek => ({ id, name, cityId, editions, placement, tier, selectivity, about });

const on = (month: number, from: number, to: number, season: Season): Edition =>
  ({ month, days: [from, to], season });

/**
 * The weeks.
 *
 * Public record: the week exists, it is in that city, and it runs in those
 * months. SLATE's own: which day of the month, how hard it is to get in, and
 * everything that happens once you are through the door.
 */
export const FASHION_WEEKS: readonly FashionWeek[] = [
  // --- The four -------------------------------------------------------------
  // They run back to back in the same order every season, which is why New
  // York opens in the first week of February and Paris is still going in
  // March.
  fw('fw-nyfw', 'New York Fashion Week', 'us-ny-newyork',
    [on(2, 6, 11, 'autumn_winter'), on(9, 5, 10, 'spring_summer')], 'record', 'big_four', 84,
    'The week that opens the month, in February and September. American houses, and a lot of people who came to be photographed outside.'),
  fw('fw-lfw', 'London Fashion Week', 'uk-eng-london',
    [on(2, 14, 18, 'autumn_winter'), on(9, 12, 16, 'spring_summer')], 'record', 'big_four', 82,
    'The second of the four, and the one where the newest names show. British Fashion Council.'),
  fw('fw-mfw', 'Milan Fashion Week', 'it-09-milan',
    [on(2, 19, 24, 'autumn_winter'), on(9, 17, 22, 'spring_summer')], 'record', 'big_four', 88,
    'The Italian houses, in February and September. Camera Nazionale della Moda Italiana.'),
  fw('fw-pfw', 'Paris Fashion Week', 'fr-idf-paris',
    [on(2, 24, 28, 'autumn_winter'), on(9, 22, 29, 'spring_summer')], 'record', 'big_four', 94,
    'The last and the largest of the four, opening in the final days of February and running into March. The Fédération de la Haute Couture et de la Mode runs it.'),
  fw('fw-pfw-men', 'Paris Men’s Fashion Week', 'fr-idf-paris',
    [on(1, 14, 19, 'autumn_winter'), on(6, 17, 22, 'spring_summer')], 'record', 'big_four', 88,
    'The menswear shows, in January and June, a few days before the couture.'),
  fw('fw-pfw-couture', 'Paris Haute Couture Week', 'fr-idf-paris',
    [on(1, 20, 25, 'couture_spring'), on(7, 1, 6, 'couture_autumn')], 'record', 'big_four', 97,
    'Couture, in late January and early July. A handful of houses, a few hundred seats, and almost nobody gets one.'),
  fw('fw-mfw-men', 'Milan Men’s Fashion Week', 'it-09-milan',
    [on(1, 10, 15, 'autumn_winter'), on(6, 13, 18, 'spring_summer')], 'record', 'big_four', 82,
    'The Italian menswear shows, in January and June.'),

  // --- Europe, north of the four -------------------------------------------
  fw('fw-cph', 'Copenhagen Fashion Week', 'dk-17-copenhagen',
    [on(1, 27, 31, 'autumn_winter'), on(8, 4, 9, 'spring_summer')], 'record', 'established', 70,
    'The Scandinavian week, at the end of January and the start of August, and the one with sustainability requirements to show at all.'),
  fw('fw-berlin', 'Berlin Fashion Week', 'de-be-berlin',
    [on(2, 2, 6, 'autumn_winter'), on(7, 1, 5, 'spring_summer')], 'record', 'established', 62,
    'The German week, in February and July.'),
  fw('fw-stockholm', 'Stockholm Fashion Week', 'se-26-stockholm',
    [on(1, 26, 30, 'autumn_winter'), on(8, 25, 29, 'spring_summer')], 'slate', 'established', 58,
    'The Swedish week, which has stopped and restarted more than once and does not keep to a fixed slot.'),
  fw('fw-madrid', 'Madrid Fashion Week', 'es-md-madrid',
    [on(2, 12, 17, 'autumn_winter'), on(9, 11, 15, 'spring_summer')], 'record', 'established', 60,
    'The Spanish week, in February and September.'),
  fw('fw-amsterdam', 'Amsterdam Fashion Week', 'nl-07-amsterdam',
    [on(3, 8, 13, 'autumn_winter'), on(9, 8, 13, 'spring_summer')], 'slate', 'emerging', 48,
    'The Dutch week, which has changed shape and organiser several times and does not keep to a fixed slot.'),
  fw('fw-lisbon', 'ModaLisboa', 'pt-14-lisbon',
    [on(3, 6, 9, 'autumn_winter'), on(10, 9, 12, 'spring_summer')], 'record', 'emerging', 44,
    'The Lisbon week, in March and October.'),
  fw('fw-istanbul', 'Istanbul Fashion Week', 'tr-34-istanbul',
    [on(3, 10, 14, 'autumn_winter'), on(10, 8, 12, 'spring_summer')], 'slate', 'emerging', 46,
    'The Turkish week, which has run under more than one name and does not keep to a fixed slot.'),
  fw('fw-tbilisi', 'Tbilisi Fashion Week', 'ge-51-tbilisi',
    [on(5, 3, 7, 'spring_summer'), on(11, 1, 5, 'autumn_winter')], 'slate', 'emerging', 52,
    'The Georgian week, which the rest of the schedule started watching a decade ago. Its dates move from year to year.'),

  // --- The Americas ---------------------------------------------------------
  fw('fw-toronto', 'Toronto Fashion Week', 'ca-on-toronto',
    [on(3, 3, 7, 'autumn_winter'), on(9, 3, 7, 'spring_summer')], 'slate', 'emerging', 46,
    'The Canadian week, which has been suspended and revived and does not keep to a fixed slot.'),
  fw('fw-vancouver', 'Vancouver Fashion Week', 'ca-bc-vancouver',
    [on(3, 24, 29, 'autumn_winter'), on(9, 15, 20, 'spring_summer')], 'record', 'emerging', 40,
    'A week that has always taken designers nobody has heard of, in March and September.'),
  fw('fw-miami', 'Miami Swim Week', 'us-fl-miami',
    [on(6, 1, 6, 'resort')], 'record', 'emerging', 50,
    'The swimwear week, at the start of June, showing the following year. Its own trade and its own crowd.'),
  fw('fw-mbfwmx', 'Mercedes-Benz Fashion Week México', 'mx-cmx-mexicocity',
    [on(4, 8, 12, 'autumn_winter'), on(10, 7, 11, 'spring_summer')], 'record', 'established', 58,
    'The Mexican week, in April and October.'),
  // Brazil is south of the equator, so its calendar is the other way round: the
  // April edition shows the summer that arrives in December and the November
  // one shows the winter that arrives in June.
  fw('fw-spfw', 'São Paulo Fashion Week', 'br-27-saopaulo',
    [on(4, 20, 25, 'spring_summer'), on(11, 3, 8, 'autumn_winter')], 'record', 'established', 66,
    'The largest week in Latin America. South of the equator, so April shows the coming summer and November the coming winter.'),

  // --- Asia -----------------------------------------------------------------
  fw('fw-tokyo', 'Rakuten Fashion Week Tokyo', 'jp-13-tokyo',
    [on(3, 15, 20, 'autumn_winter'), on(9, 1, 6, 'spring_summer')], 'record', 'established', 72,
    'The Japanese week, in March and at the very start of September.'),
  fw('fw-seoul', 'Seoul Fashion Week', 'kr-11-seoul',
    [on(3, 16, 21, 'autumn_winter'), on(9, 1, 6, 'spring_summer')], 'record', 'established', 70,
    'The Korean week, and one of the most photographed streets in the world while it is on.'),
  fw('fw-shanghai', 'Shanghai Fashion Week', 'cn-23-shanghai',
    [on(3, 25, 30, 'autumn_winter'), on(10, 9, 14, 'spring_summer')], 'record', 'established', 74,
    'The Chinese week, in late March and October, and the largest in Asia by number of shows.'),
  // India names its collections for what people actually buy them for rather
  // than for the northern autumn and spring.
  fw('fw-lakme', 'Lakmé Fashion Week', 'in-16-mumbai',
    [on(3, 11, 15, 'summer_resort'), on(10, 8, 12, 'winter_festive')], 'record', 'established', 62,
    'The Indian week, in Mumbai. Its two editions are Summer Resort in March and Winter Festive in October, which is what the year is actually divided into there.'),
  fw('fw-icw', 'India Couture Week', 'in-07-delhi',
    [on(7, 23, 28, 'bridal')], 'record', 'established', 70,
    'The Delhi couture week, in July, and a bridal week as much as a couture one.'),

  // --- The southern hemisphere and Africa -----------------------------------
  fw('fw-afw', 'Australian Fashion Week', 'au-nsw-sydney',
    [on(5, 12, 17, 'resort')], 'record', 'established', 62,
    'The Sydney week, in May, showing resort while the northern hemisphere shows nothing.'),
  fw('fw-melbourne', 'Melbourne Fashion Festival', 'au-vic-melbourne',
    [on(3, 3, 8, 'autumn_winter')], 'record', 'emerging', 44,
    'The Melbourne festival, in March, showing the autumn and winter that are arriving there as it runs. It sells tickets to the public as well as seats to the trade.'),
  // South of the equator again: April shows the coming summer, October the
  // coming winter.
  fw('fw-safw', 'South African Fashion Week', 'za-06-johannesburg',
    [on(4, 24, 28, 'spring_summer'), on(10, 22, 26, 'autumn_winter')], 'record', 'emerging', 48,
    'The Johannesburg week. South of the equator, so April shows the coming summer and October the coming winter.'),
  fw('fw-capetown', 'Cape Town Fashion Week', 'za-11-capetown',
    [on(8, 12, 16, 'spring_summer')], 'slate', 'emerging', 42,
    'The Cape Town week, at the end of the southern winter, showing the summer that follows it. Its dates move from year to year.'),
  fw('fw-lagos', 'Lagos Fashion Week', 'ng-05-lagos',
    [on(10, 22, 26, 'annual')], 'record', 'established', 64,
    'The West African week, in October, and the one that took African design to the rest of the schedule. It shows one collection a year rather than a northern season.'),
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
