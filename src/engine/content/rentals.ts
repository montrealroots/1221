/**
 * SLATE — a car rented on a journey (docs/WORLD.md, stage 8a), from
 * 2026-09-29, researched in docs/research/world/research-rentals.json.
 *
 * No company publishes an airport's rate card, so a day's rent is Kayak's
 * average for a small car at the town's airport, a compiler's figure, said
 * so, and read as before the taxes in America and Canada and with VAT in
 * Europe and Mexico's IVA added as Mexico's rates are quoted without it.
 * Everything else is one company's own published terms for the town, the
 * company whose terms the town's airport publishes most fully: Avis at JFK;
 * Enterprise at Tweed-New Haven, LAX, Pearson and Vancouver; Hertz at
 * Heathrow, Edinburgh, Belfast, Dublin and Mexico City. The minimum age and
 * its young driver's surcharge, how long a license must have been held, the
 * deposit held on the card, the excess charged for damage where one is
 * published, and the place's own rental taxes by statute.
 *
 * Not kept, and said so: a one-way drop fee, which no rental SLATE keeps
 * incurs, as each goes back where it was picked up; Tweed's concession
 * charge, which no company prints; a damage waiver's daily price where none
 * is published (it's taken as included where a deposit assumes it); and
 * damage in Connecticut and Canada, where no waiver's price or excess is
 * published, and a renter's own insurance or card usually covers it.
 *
 * From 2026-10-01 (`docs/research/world/research-rentals-lets-charters-2.json`):
 * - JFK's concession recovery, 11.11% (a 10% concession passed on, 0.10 of
 *   0.90), and its $4.50 a day facility charge, read from renters' receipts
 *   (secondary), as the Port Authority's schedule has no rental line.
 * - The damage waiver, where its price is known, taken or declined. New
 *   York's General Business Law §396-z caps it by the car's sticker price,
 *   $9 a day to $20,000, which is a small car's and Avis's own "as low as
 *   $9". California's Civil Code §1939.09 caps it at $25 a day for the five
 *   smallest classes (from 2022; its yearly CPI rise isn't published, so the
 *   2026 cap is somewhat higher). Declined, a crash that hurts leaves the
 *   renter owing the repair, at the $882 average a rental-excess insurer
 *   reports for a major collision among 1,710 of its customers' claims
 *   (CarInsuRent, 2026, secondary); in California with Enterprise's $100
 *   administrative fee for a repair of $500 to $1,499, which §1939.03 allows,
 *   and in New York with none, as §396-z bars it. Enterprise's loss of use
 *   and diminished value aren't recoverable under either statute.
 */

export interface RentalTerms {
  /** The airport, the company, and the money. */
  airport: string;
  company: string;
  currency: string;
  /** Kayak's average day, small car, whole units. */
  daily: number;
  /** Tax on the rent, and from a day a new rate; and a charge a day (with its cap in days). */
  taxRate: number;
  taxFrom?: { at: string; rate: number };
  perDay?: { amount: number; capDays?: number; label: string };
  minAge: number;
  /** The young driver's surcharge a day, by age, and its cap a rental. */
  young?: readonly { from: number; to: number; perDay: number }[];
  youngCap?: number;
  /** Years a license must have been held. */
  licenseYears: number;
  /** Held on the card at pickup, and released on return; none with a return ticket, where so. */
  deposit?: number;
  depositWaivedWithReturn?: boolean;
  /** A damage waiver bought a day, where the terms assume one. */
  waiverPerDay?: number;
  /** The excess charged when the car is damaged. */
  excess?: number;
  /** A damage waiver offered a day, taken or declined, where its price is known. */
  waiverOffered?: number;
  /** What's owed for a damaged car with the offered waiver declined: the repair and any fee the law allows. */
  unwaived?: { repair: number; admin: number };
  /** The money the surcharge, deposit, waiver and excess are quoted in, where not the rent's. */
  termsCurrency?: string;
  basis: string;
}

export const RENTALS: Readonly<Record<string, RentalTerms>> = {
  'us-ny-newyork': {
    airport: 'JFK', company: 'Avis', currency: 'USD', daily: 57,
    taxRate: 0.08875 + 0.06 + 0.06 + 0.1111, perDay: { amount: 4.5, label: 'Customer Facility Charge' }, minAge: 18,
    young: [{ from: 18, to: 20, perDay: 84 }, { from: 21, to: 24, perDay: 35 }], licenseYears: 1, deposit: 200,
    waiverOffered: 9, unwaived: { repair: 882, admin: 0 },
    basis: 'Avis’s JFK terms; New York’s 8.875% sales tax, its 6% special tax on car rentals and the 6% supplemental in the transit district, and JFK’s 11.11% concession recovery and $4.50 a day facility charge, read secondhand',
  },
  'us-ct-newhaven': {
    airport: 'HVN', company: 'Enterprise', currency: 'USD', daily: 54,
    taxRate: 0.0935, perDay: { amount: 1, label: 'Tourism Surcharge' }, minAge: 21,
    young: [{ from: 21, to: 24, perDay: 25 }], licenseYears: 1,
    basis: 'Enterprise’s terms; Connecticut’s 9.35% on a rental of 30 days or less and its $1 a day tourism surcharge',
  },
  'us-ca-losangeles': {
    airport: 'LAX', company: 'Enterprise', currency: 'USD', daily: 40,
    taxRate: 0.0975 + 0.1111 + 0.035, taxFrom: { at: '2026-10-01', rate: 0.1025 + 0.1111 + 0.035 }, perDay: { amount: 12, capDays: 5, label: 'Customer Facility Charge' }, minAge: 21,
    young: [{ from: 21, to: 24, perDay: 25 }], licenseYears: 1, deposit: 400,
    waiverOffered: 25, unwaived: { repair: 882, admin: 100 },
    basis: 'Enterprise’s LAX terms; Los Angeles County’s 10.25% from 1 October 2026, and LAX’s 11.11% concession recovery, 3.5% tourism assessment and $12 a day facility charge, read secondhand',
  },
  'uk-eng-london': {
    airport: 'LHR', company: 'Hertz', currency: 'GBP', daily: 22, taxRate: 0, minAge: 21,
    young: [{ from: 21, to: 24, perDay: 61.43 }], youngCap: 1_719.98, licenseYears: 1, deposit: 200, excess: 1_700,
    basis: 'Hertz’s Heathrow terms, VAT in the price',
  },
  'uk-sct-edinburgh': {
    airport: 'EDI', company: 'Hertz', currency: 'GBP', daily: 25, taxRate: 0, minAge: 21,
    young: [{ from: 21, to: 24, perDay: 61.43 }], youngCap: 1_719.98, licenseYears: 1, deposit: 200, excess: 1_700,
    basis: 'Hertz’s Edinburgh terms, VAT in the price',
  },
  'uk-nir-belfast': {
    airport: 'BFS', company: 'Hertz', currency: 'GBP', daily: 22, taxRate: 0, minAge: 24,
    young: [{ from: 24, to: 24, perDay: 30.84 }], youngCap: 308.4, licenseYears: 1, deposit: 200, excess: 1_700,
    basis: 'Hertz’s Northern Ireland terms, VAT in the price',
  },
  'ie-lei-dublin': {
    airport: 'DUB', company: 'Hertz', currency: 'EUR', daily: 27, taxRate: 0, minAge: 21,
    licenseYears: 2, excess: 2_000,
    basis: 'Hertz’s Dublin terms: a full license held two years, and the collision damage waiver taken, its €2,000 excess; VAT at 13.5% in the price',
  },
  'ca-on-toronto': {
    airport: 'YYZ', company: 'Enterprise', currency: 'CAD', daily: 35, taxRate: 0.13, minAge: 21,
    young: [{ from: 21, to: 24, perDay: 20 }], licenseYears: 1, deposit: 400, depositWaivedWithReturn: true,
    basis: 'Enterprise’s Pearson terms: its C$400 deposit for a renter without a ticket home; Ontario’s 13% HST',
  },
  'ca-bc-vancouver': {
    airport: 'YVR', company: 'Enterprise', currency: 'CAD', daily: 49, taxRate: 0.05 + 0.07,
    perDay: { amount: 1.5 * 1.05, label: 'Passenger Vehicle Rental Tax' }, minAge: 21,
    young: [{ from: 21, to: 24, perDay: 20 }], licenseYears: 1, deposit: 400, depositWaivedWithReturn: true,
    basis: 'Enterprise’s Vancouver terms; the 5% GST, British Columbia’s 7% PST on a car under $55,000, and its $1.50 a day rental tax, with GST on it',
  },
  'mx-cmx-mexicocity': {
    airport: 'MEX', company: 'Hertz', currency: 'MXN', daily: 167, taxRate: 0.16, minAge: 18,
    young: [{ from: 18, to: 24, perDay: 7.5 }], licenseYears: 1, deposit: 160, waiverPerDay: 45, excess: 800, termsCurrency: 'USD',
    basis: 'Hertz’s Mexico City terms, quoted in dollars: US$7.50 a day under 25, the US$45 a day damage waiver its US$160 deposit assumes, the US$800 excess; IVA at 16%',
  },
};

export const RENTAL_SOURCE = 'docs/research/world/research-rentals.json: Kayak’s airport averages (a compiler’s); Avis, Enterprise and Hertz terms for each airport; New York Tax Law 1160 and 1166-a; Connecticut DRS; CDTFA; HMRC; Revenue; CRA and British Columbia PST 116; Ley del IVA';
