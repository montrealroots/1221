/**
 * SLATE — a pet on a flight, by the departure country's flag carrier, the same
 * carrier that weighs the bags (`content/baggage.ts`), from 2026-10-04. From
 * `docs/research/world/research-pet-care.json`'s airlines (read 2026-10-03)
 * and `research-pet-cargo.json` (read 2026-10-04).
 *
 * A pet is SLATE's reference animal: the 20 kg dog and the 4 kg cat Royal
 * Canin's daily rations were read for (`content/petcare.ts`). No carrier here
 * takes more than 10 kg, pet and carrier together, in the cabin (Volaris 10,
 * Aeromexico 9, American and JetBlue 20 lb), so the dog flies in the hold or
 * not at all, and the cat in the cabin wherever the carrier takes one there.
 * Every hold here takes 45 kg with the kennel (Air Canada, WestJet,
 * Aeromexico, Volaris), so the dog is never over it, and no limit is kept.
 *
 * - **Delta**, from America: a pet in the cabin $150 each way. That's its
 *   domestic fee for tickets from 2025-04-08; its fee abroad wasn't read, so
 *   the domestic one stands for it too, a SLATE assumption. Delta checks no
 *   pets. Delta Cargo takes them only for military and State Department moves,
 *   United's PetSafe has been closed to the public since 2018, and American's
 *   is military-only: none of the three flies an ordinary passenger's 20 kg
 *   dog out of America now. Until 2026-10-06 no airline in SLATE did; Alaska
 *   Airlines, read that day, checks one within America (below).
 * - **British Airways**, from Britain, and **Aer Lingus**, from Ireland: no
 *   pet in the cabin. In the hold only as IAG Cargo's cargo, priced on request
 *   through an approved pet agent. So that a dog can still fly, SLATE charges
 *   the best published stand-in, both secondhand: from Britain, Fetchapet's
 *   lowest quote for a dog, £2,600 (its range runs to £8,000, a full agent's
 *   service); from Ireland, one traveler's reported €1,500 each way.
 * - **Air Canada**, from Canada: the cabin 50 CAD within Canada and to
 *   America, 100 abroad; the hold, checked, 105 and 270 CAD (verified, the
 *   bottom of each published range); no pets in the hold from 18 December
 *   to 4 January.
 * - **Aeromexico**, from Mexico: the cabin MXN 1,520 within Mexico, US$182
 *   abroad (low season); the hold, checked, MXN 1,800 within Mexico and 5,570
 *   abroad, its low season's, read from volapata.com citing its site, which
 *   was down (secondhand).
 *
 * **The heat and the cold on the day** (from 2026-10-06,
 * `research-pet-embargo.json`): a pet in the hold flies only inside its
 * carrier's temperatures, read on the day of the flight against the weather
 * SLATE already draws (`systems/weather.ts`), the hour it leaves and the
 * hour it lands.
 * - **Air Canada** (verified): "it may not always be possible to accommodate
 *   your pet when summer temperatures exceed 29.5°C", by destination and
 *   season: America from 1 May to 31 October, Mexico 1 July to 31 August.
 *   SLATE reads it as the destination's temperature on landing over 29.5°C in
 *   those windows. Its cold rule, 0°C and under from November to March, is for
 *   pets under 4.5 kg, and SLATE's 4 kg cat flies in its cabin, so no pet here
 *   meets it.
 * - **Aer Lingus** (secondhand, pettravel.com; its own page behind a bot
 *   check): no animal "when temperatures at any point of the itinerary exceed
 *   80°F (27°C) ... or drop below 20°F (-7°C)": both ends, SLATE's reading of
 *   any point, a direct flight having no other.
 * - **Alaska Airlines** (verified, its own newsroom, 26 August 2026): not
 *   "hotter than 85 degrees or cooler than 45 degrees in departure or
 *   destination cities", Fahrenheit.
 * - **British Airways'** IAG Cargo publishes no figure, and Aeromexico's
 *   wasn't read: no embargo is held for either (`docs/DATA-GAPS.md`).
 *
 * **A carrier other than the flag carrier** (from 2026-10-06, verified on
 * each airline's own pages): **Alaska Airlines** checks a pet, $200 a kennel
 * each way, pet and kennel to 68 kg, and takes one in the cabin for $100; so a
 * 20 kg dog flies in America after all, on Alaska. **WestJet** takes one in
 * the cabin for CAD 50 within Canada and America (100 outside them) and
 * checks one for CAD 100 (200 outside), the bottom of each published range,
 * as Air Canada's, pet and kennel to 45 kg; none from 18 December to 4 January,
 * and none checked to or from sixteen American cities from 15 May to 31
 * October, seven of them SLATE's. Each is offered only between the countries
 * named in `flies`: Alaska within America and WestJet within Canada and
 * America, as their routes abroad weren't read (WestJet takes no pets to or
 * from Britain or Ireland at all, and none checked to some Mexican airports).
 */

/** Degrees Fahrenheit in Celsius, for a carrier that publishes its limits in them. */
const fahrenheit = (f: number): number => ((f - 32) * 5) / 9;

/** What a carrier's hold flies in, read on the day: the hottest and coldest, °C. */
export interface PetEmbargo {
  maxC?: number;
  minC?: number;
  /** Where it's read: both ends, or the destination alone (Air Canada's, by destination). */
  where: 'both' | 'arrival';
  /** Only into these countries in these stretches of the year, month and day; absent, all year everywhere. */
  windows?: readonly { to: readonly string[]; from: [number, number]; until: [number, number] }[];
  status: 'verified' | 'secondhand';
}

/** The reference animals' weights, kilograms: what Royal Canin's ration was read for. */
export const PET_KG = { dog: 20, cat: 4 } as const;
/** The most any carrier here takes in the cabin, pet and carrier together (Volaris). */
export const CABIN_MAX_KG = 10;

export interface PetFare { domestic: number; abroad: number; currency: string; /** Where abroad is priced in another currency (Aeromexico's in dollars). */ abroadCurrency?: string; status: 'verified' | 'secondhand' }

export interface PetFlightRule {
  carrier: string;
  /** A pet in the cabin, each way; null where the carrier takes none there. */
  cabin: PetFare | null;
  /** A pet in the hold, checked or as cargo, each way; or why it can't fly there. */
  hold: (PetFare & { via: 'checked' | 'cargo'; closed?: { from: [number, number]; to: [number, number] } }) | { refused: string };
  /** Which countries count as domestic from here: Air Canada prices America as it does Canada. */
  domesticTo?: readonly string[];
  /** The hold's temperatures on the day (from 2026-10-06). */
  embargo?: PetEmbargo;
  /** No pet checked to or from these towns in a stretch of the year (WestJet's summer). */
  summer?: { cities: readonly string[]; from: [number, number]; until: [number, number] };
}

/** A carrier chosen in place of the flag carrier, between the countries it's offered among. */
export interface OtherPetCarrier extends PetFlightRule { flies: readonly string[] }

export const PET_FLIGHT: Readonly<Record<string, PetFlightRule>> = {
  us: {
    carrier: 'Delta',
    cabin: { domestic: 150, abroad: 150, currency: 'USD', status: 'verified' },
    hold: { refused: 'Delta checks no pets and its cargo carries them only for military and State Department moves, United’s PetSafe has been closed since 2018, and American’s is military-only. Within America, Alaska Airlines checks one: choose it to fly with.' },
  },
  uk: {
    carrier: 'British Airways',
    cabin: null,
    hold: { via: 'cargo', domestic: 2_600, abroad: 2_600, currency: 'GBP', status: 'secondhand' },
  },
  ie: {
    carrier: 'Aer Lingus',
    cabin: null,
    hold: { via: 'cargo', domestic: 1_500, abroad: 1_500, currency: 'EUR', status: 'secondhand' },
    embargo: { maxC: 27, minC: -7, where: 'both', status: 'secondhand' },
  },
  ca: {
    carrier: 'Air Canada',
    cabin: { domestic: 50, abroad: 100, currency: 'CAD', status: 'verified' },
    hold: { via: 'checked', domestic: 105, abroad: 270, currency: 'CAD', status: 'verified', closed: { from: [12, 18], to: [1, 4] } },
    domesticTo: ['ca', 'us'],
    embargo: { maxC: 29.5, where: 'arrival', windows: [{ to: ['us'], from: [5, 1], until: [10, 31] }, { to: ['mx'], from: [7, 1], until: [8, 31] }], status: 'verified' },
  },
  mx: {
    carrier: 'Aeromexico',
    cabin: { domestic: 1_520, abroad: 182, currency: 'MXN', abroadCurrency: 'USD', status: 'verified' },
    hold: { via: 'checked', domestic: 1_800, abroad: 5_570, currency: 'MXN', status: 'secondhand' },
  },
};

/** The carriers chosen in place of the flag carrier (from 2026-10-06), by id. */
export const OTHER_PET_CARRIERS: Readonly<Record<string, OtherPetCarrier>> = {
  alaska: {
    carrier: 'Alaska Airlines',
    cabin: { domestic: 100, abroad: 100, currency: 'USD', status: 'verified' },
    hold: { via: 'checked', domestic: 200, abroad: 200, currency: 'USD', status: 'verified' },
    embargo: { maxC: fahrenheit(85), minC: fahrenheit(45), where: 'both', status: 'verified' },
    flies: ['us'],
  },
  westjet: {
    carrier: 'WestJet',
    cabin: { domestic: 50, abroad: 100, currency: 'CAD', status: 'verified' },
    hold: { via: 'checked', domestic: 100, abroad: 200, currency: 'CAD', status: 'verified', closed: { from: [12, 18], to: [1, 4] } },
    domesticTo: ['ca', 'us'],
    // Atlanta, Austin, Dallas-Fort Worth, Las Vegas, Miami, Nashville and Phoenix: the seven of its sixteen SLATE keeps.
    summer: { cities: ['us-ga-atlanta', 'us-tx-austin', 'us-tx-dallas', 'us-nv-lasvegas', 'us-fl-miami', 'us-tn-nashville', 'us-az-phoenix'], from: [5, 15], until: [10, 31] },
    flies: ['ca', 'us'],
  },
};
