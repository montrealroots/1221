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
 *   is military-only: no airline here flies an ordinary passenger's 20 kg dog
 *   out of America now.
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
 */

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
}

export const PET_FLIGHT: Readonly<Record<string, PetFlightRule>> = {
  us: {
    carrier: 'Delta',
    cabin: { domestic: 150, abroad: 150, currency: 'USD', status: 'verified' },
    hold: { refused: 'No airline flies a pet in the hold out of America for an ordinary passenger now: Delta checks no pets and its cargo carries them only for military and State Department moves, United’s PetSafe has been closed since 2018, and American’s is military-only.' },
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
  },
  ca: {
    carrier: 'Air Canada',
    cabin: { domestic: 50, abroad: 100, currency: 'CAD', status: 'verified' },
    hold: { via: 'checked', domestic: 105, abroad: 270, currency: 'CAD', status: 'verified', closed: { from: [12, 18], to: [1, 4] } },
    domesticTo: ['ca', 'us'],
  },
  mx: {
    carrier: 'Aeromexico',
    cabin: { domestic: 1_520, abroad: 182, currency: 'MXN', abroadCurrency: 'USD', status: 'verified' },
    hold: { via: 'checked', domestic: 1_800, abroad: 5_570, currency: 'MXN', status: 'secondhand' },
  },
};
