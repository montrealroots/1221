/**
 * SLATE — the land the family holds, and what stands on it.
 *
 * The premise the rest of the game hangs off. You do not arrive with nothing
 * and work your way in: you are born onto two thousand acres in Mosfellsbær,
 * fifteen minutes outside Reykjavík, and the family has just built a studio
 * lot on it and started a production company that makes Television and Film
 * and carries the family name.
 *
 * Two thousand acres sounds enormous and, in Iceland, is not. It is eight
 * hundred and nine hectares against a mean Icelandic farm of about seven
 * hundred and fifteen, so an Icelander reads it as one ordinary jörð. What is
 * remarkable is not the size but the address: eight square kilometers held
 * whole, inside the Capital Region, where the land is worth something.
 *
 * The family name, not yours. It comes off the surname because that is where
 * a surname comes from, but nothing on that gate was put there for the
 * player. It was there first.
 *
 * Which means the usual sources of pressure are not there. No rent, no
 * landlord, no day job, nobody to audition for to get in the door. What is
 * there instead: a company nobody has heard of, in a country with no film
 * business to speak of, and a name on the gate that everybody will assume is
 * the only reason you are standing on the lot.
 */

import { CITIES, COUNTRIES, REGIONS, type City } from '@/engine/content/geography';
import { instantFromZoned } from '@/engine/core/time';

/**
 * Home base. Not a choice — it is where the family land is.
 *
 * Mosfellsbær rather than Reykjavík, and the difference is the whole point of
 * the sentence "outside Reykjavík". It is its own municipality: 185 square
 * kilometers, thirteen thousand people, a town at one end and Mosfellsdalur
 * and the uplands behind it open. Eight square kilometers held whole is 4.4%
 * of it, which is a lot of one small place and nothing at all of Iceland.
 *
 * Kjósarhreppur next door would have been the truer farm country — three
 * hundred residents, no town at all — and it is not in the gazetteer, because
 * the gazetteer is public reference data and three hundred people do not
 * clear its threshold. Adding a municipality to it to suit the fiction is the
 * one thing that is not allowed. Mosfellsbær is also the better answer for a
 * working lot: fifteen minutes to the city rather than forty-five, which is
 * what crew, deliveries and a call time actually turn on.
 */
export const ESTATE_CITY_ID = 'is-39-mosfellsbr';

/** The country the land is in. Everybody in the family holds its passport. */
export const ESTATE_COUNTRY_ID = 'is';

export const ESTATE_ACRES = 2_000;

/**
 * The same land in the unit Iceland actually uses, and what it measures
 * against. Both figures are public record.
 *
 * Iceland has 7,828 registered jarðir covering about 56,000 square kilometers,
 * a mean of roughly 715 hectares each (HMS, reported in Bændablaðið, February
 * 2025). The median runs 200–300 ha in the South, 400–500 across most of the
 * country and over 800 in the East and the Westfjords. So this is one average
 * farm, and the game should never call it vast: Grímsstaðir á Fjöllum is
 * thirty-seven times the size, and one British owner holds about a hundred
 * times it.
 */
export const ESTATE_HECTARES = 809;
export const MEAN_ICELANDIC_FARM_HECTARES = 715;

/**
 * What the land is called.
 *
 * It has a name because everybody who lives on it uses one. "The Land" was a
 * description standing in for a name, and it read like the game had not
 * decided yet.
 */
export const ESTATE_NAME = 'Sugar Land';

/** The lot on it. A place, not the company that works out of it. */
export const LOT_NAME = 'Sugar Land Studios';

/** The day the family moved onto the land, in the land's own zone. */
export const MOVED_IN = { year: 2025, month: 1, day: 1 } as const;

export function movedInAt(): number {
  return instantFromZoned({ ...MOVED_IN, hour: 0, minute: 0 }, estateCity().timeZone);
}

export function estateCity(): City {
  const city = CITIES.get(ESTATE_CITY_ID);
  if (!city) throw new Error(`the estate sits in a city the gazetteer doesn’t have: ${ESTATE_CITY_ID}`);
  return city;
}

/** "Reykjavík, Capital Region · Iceland", from the gazetteer rather than typed out. */
export function estatePlaceLine(): string {
  const city = estateCity();
  const region = REGIONS.get(city.parentId)?.name;
  const country = COUNTRIES.get(city.countryId)?.name;
  return [[city.name, region].filter(Boolean).join(', '), country].filter(Boolean).join(' · ');
}

/**
 * The company, which carries the family name.
 *
 * Built from the surname because the surname is the family name — the same
 * fact read from the only field that already holds it — so the company names
 * itself and there is nothing extra to fill in.
 */
export function studioName(lastName: string): string {
  const surname = lastName.trim();
  return surname ? `${surname} Pictures` : 'The Family Company';
}

/**
 * The house on the land.
 *
 * Not bought and not rented — the family built it. There is no tenure, no
 * mortgage, no landlord and no monthly figure, because none of those is true
 * of it, and the housing ladder the game used to model was a ladder for
 * somebody climbing one.
 *
 * New, and it shows. Put up in 2024 and lived in since the first day of 2025,
 * so on the morning a save opens it is barely a year old and nothing in it has
 * had time to go wrong. That is why condition starts full rather than at the
 * eighty-eight a lived-in house would carry: there is nothing yet to have
 * worn.
 */
export const HOUSE = {
  name: 'The Big House',
  bedrooms: 6,
  interiorSqft: 5_400,
  yearBuilt: 2024,
  /**
   * Full, because it is new. Keeping it there is now somebody's decision.
   *
   * This said "because the family keeps it that way" and for a long time the
   * engine did nothing of the kind: `systems/life.ts` took it down
   * `WEAR_A_DAY` every day and nothing anywhere put a point back, so a house
   * that starts here reached nought in a little under twenty-three years —
   * inside one career — and took the back half of it down too. The comment was
   * the only place the family's upkeep existed. There is a command for it now,
   * and the family is not the one who pays.
   */
  condition: 100,
} as const;

/**
 * What a day takes off a standing property.
 *
 * Here rather than in `systems/life.ts`, which is where it is spent, because
 * `A_POINT_OF_IT_CENTS` below is priced off it and a rate read from two places
 * is a second answer waiting to disagree with the first.
 */
export const WEAR_A_DAY = 0.012;

/** Days in the year the wear rate is quoted against. */
const A_YEAR_OF_DAYS = 365.2425;

/**
 * What a point of condition costs to put back.
 *
 * Derived, not chosen, because a number somebody liked the look of is the
 * thing this project is least able to defend. The trade's own rule of thumb
 * for keeping a house standing still is about a currency unit per square foot
 * per year; this house is `HOUSE.interiorSqft` of it, so a year of keeping it
 * costs that many. A year of wear is `WEAR_A_DAY` x `A_YEAR_OF_DAYS` = 4.38
 * points. One divided by the other is the figure below, and the only judgement
 * in it is the rule of thumb itself.
 *
 * Priced by the point rather than by the visit, so a player who lets it slide
 * for a decade and pays the lump pays exactly what paying every year would
 * have cost. Deferred maintenance really does cost more than that in life, and
 * charging for it here would be a second decision wearing the first one's
 * clothes: the reason to keep the house up is that a worn house sleeps badly
 * for the whole time it is worn, and that is already the entire mechanism.
 */
export const A_POINT_OF_IT_CENTS = Math.round(
  (HOUSE.interiorSqft * 1_00) / (WEAR_A_DAY * A_YEAR_OF_DAYS),
);

export interface Holding {
  id: string;
  label: (lastName: string) => string;
  detail: string;
}

/** What stands on the land. Three things, and the third is the whole game. */
export const HOLDINGS: readonly Holding[] = [
  {
    id: 'house',
    label: () => HOUSE.name,
    detail: 'Where you live. No rent, no lease, and nobody to answer to about it.',
  },
  {
    id: 'lot',
    label: () => LOT_NAME,
    detail: 'Newly built, on the same land, and close enough to walk to from the house. Stages for Television and Film both.',
  },
  {
    id: 'company',
    label: () => 'Company Headquarters',
    // Named in its own card below rather than here, so the name is not printed
    // twice on one page under two different headings.
    detail: 'Television and Film, out of the lot. It carries the family name and it has no record yet.',
  },
];

/**
 * Why Iceland is not an odd choice but the point of it.
 *
 * The gazetteer scores Reykjavík at nothing for film industry presence, which
 * is correct and is exactly the situation: there is no business here to join.
 */
export const ESTATE_NOTE =
  'There’s no Television or Film industry in Iceland to walk into. That’s the point of it: the family '
  + 'isn’t '
  + 'buying a way into anybody else’s business, it’s building one where there was none, and you '
  + 'are standing on it before anybody outside the country knows it exists.';

// ---------------------------------------------------------------------------
// What it takes to get onto the land
// ---------------------------------------------------------------------------

/**
 * Iceland's standing on the Global Peace Index.
 *
 * Real, published, and the reason the security on this land is remarkable
 * rather than sensible: the country has been ranked the most peaceful in the
 * world every year the index has run since 2008. Nobody in Iceland needs a
 * perimeter. This family built one anyway.
 */
export const PEACE_RANK = 1;
export const PEACE_RANKED_SINCE = 2008;

/** What the family put in, and what it is for. */
export interface Safeguard {
  id: string;
  /** The world's word for it, Title Case. */
  label: string;
  /** What kind of thing it is, for the level that opens onto it. */
  kind: string;
  /** One sentence, second person, true right now. */
  summary: string;
  /** The paragraphs behind it. */
  detail: readonly string[];
  /** Figures worth printing under it. */
  figures: readonly { label: string; value: string; note: string }[];
  /** Which of the three things on the land it stands around. */
  covers: 'land' | 'house' | 'lot';
}

export const SAFEGUARDS: readonly Safeguard[] = [
  {
    id: 'perimeter',
    label: 'The Perimeter',
    kind: 'The Line Around All Of It',
    covers: 'land',
    summary: 'The whole two thousand acres is fenced, and it isn’t the kind of fence you climb.',
    detail: [
      'A continuous barrier runs the entire boundary — anti-climb steel to head height, set into a '
      + 'concrete foot so it can’t be lifted or dug under, and carrying a tension line that reports '
      + 'the moment anything leans on it. It follows the lava field instead of cutting through it. '
      + 'That’s why it cost what it cost.',
      'Ground sensors sit inside the line, not on it. Anybody over the fence walks into a second '
      + 'detection layer they can’t see, and the control room had them on camera before they reached '
      + 'the first one.',
    ],
    figures: [
      { label: 'What It Encloses', value: '2,000 acres', note: 'Every foot of the boundary' },
      { label: 'Detection Layers', value: '2', note: 'The line itself, and the ground inside it' },
      { label: 'Gaps In It', value: 'None', note: 'One way in, and it’s the gate' },
    ],
  },
  {
    id: 'gate',
    label: 'The Gate',
    kind: 'The Only Way In',
    covers: 'land',
    summary: 'One road runs onto the land. There’s a gatehouse on it, staffed around the clock, and either they’re expecting you or they aren’t.',
    detail: [
      'Staffed every hour of every day, with vehicle barriers rated to stop a truck at speed — not to '
      + 'discourage a car. A story doesn’t get you through. Arrivals are on a list, and a name that '
      + 'isn’t on it waits at the barrier while the house is called.',
      'Deliveries stop at the gate and are carried on from there. Nobody outside the household drives '
      + 'to the door. That one measure does more of the work than all the steel.',
    ],
    figures: [
      { label: 'Roads In', value: '1', note: 'Watched around the clock' },
      { label: 'Manned', value: '24 hours', note: 'Every day of the year' },
      { label: 'Unannounced Arrivals', value: 'Wait', note: 'Nobody is waved through' },
    ],
  },
  {
    id: 'watch',
    label: 'The Control Room',
    kind: 'Who Is Watching',
    covers: 'land',
    summary: 'Everything the cameras and sensors see lands in one room, and that room is staffed.',
    detail: [
      'Overlapping camera coverage with no blind corner, thermal after dark so the weather stops '
      + 'mattering, and every feed on the land — the boundary, the gate, the yard, the stages — '
      + 'terminating in one staffed room — not on a hard drive nobody watches.',
      'It runs on the land’s own power. Iceland’s grid is geothermal and among the most reliable in '
      + 'the world, and the family put in a generator and a battery wall anyway, because a security '
      + 'system that stops when the power does only works on good days.',
    ],
    figures: [
      { label: 'Blind Corners', value: 'None', note: 'Coverage overlaps everywhere' },
      { label: 'After Dark', value: 'Thermal', note: 'Weather stops mattering' },
      { label: 'If The Power Goes', value: 'It stays up', note: 'Generator and battery on site' },
    ],
  },
  {
    id: 'house',
    label: 'The House Itself',
    kind: 'The Last Layer',
    covers: 'house',
    summary: 'Anybody who got past all of it would still be standing outside a hardened building.',
    detail: [
      'Reinforced doors, laminated glass and a monitored alarm on every opening, which for a house '
      + 'this new was designed in, not added afterwards. There’s a room inside with its own '
      + 'door, its own line out and its own air, and in the ordinary run of things nobody in the '
      + 'family thinks about it from one year to the next.',
      'It’s the layer that should never be reached, and the family built it on the principle that '
      + 'the layer you never need is the one worth paying for.',
    ],
    figures: [
      { label: 'Designed In', value: '2024', note: 'Not added to an older house' },
      { label: 'Monitored Openings', value: 'All of them', note: 'Every door and every window' },
      { label: 'Times It Has Mattered', value: 'None', note: 'Which is the point of it' },
    ],
  },
  {
    id: 'lot',
    label: 'The Lot',
    kind: 'The Working Half',
    covers: 'lot',
    summary: 'The stages sit inside the same line the house does, so nothing shooting here can be photographed from outside it.',
    detail: [
      'A production on this lot is behind the same perimeter the family sleeps behind. There’s no '
      + 'long lens on a public road, no drone that gets near, and no crew car parked where anybody '
      + 'can read a call sheet through a windscreen.',
      'Every person who works a day here is vetted before they arrive and badged while they’re on it. '
      + 'For a business whose whole currency is what nobody has seen yet, that’s worth more than any '
      + 'of the fence.',
    ],
    figures: [
      { label: 'Sight Lines In', value: 'None', note: 'Nothing overlooks the stages' },
      { label: 'Crew Vetting', value: 'Before arrival', note: 'Nobody is badged at the door' },
      { label: 'Leaks So Far', value: 'None', note: 'And nothing made yet to leak' },
    ],
  },
];

export const SAFEGUARD_BY_ID: Readonly<Record<string, Safeguard>> =
  Object.fromEntries(SAFEGUARDS.map((one) => [one.id, one]));

/**
 * Why any of this is worth saying.
 *
 * Not that the place is dangerous. The opposite: the family built the safest
 * address in the safest country there is, which is either the most sensible
 * thing money can do or the clearest sign of how much of it there is.
 */
export const SAFETY_NOTE =
  'None of it is here because Iceland is dangerous. Iceland has been ranked the most peaceful country '
  + 'in the world every year the Global Peace Index has run since 2008, and the family built a '
  + 'perimeter anyway. What it buys isn’t safety — safety was free. It buys never being reached by '
  + 'anybody who wasn’t invited, and in this business that’s a different thing and it costs.';
