/**
 * SLATE — the kinds of stay a town has besides its average hotel room, from
 * 2026-10-01, researched in `docs/research/world/research-stays-rentals.json`.
 *
 * A town's hotel is its published average (`content/stays.ts`). Beside it,
 * where a figure was read: a motel, a budget chain's room, an extended-stay
 * or serviced apartment, and a hostel's bed in a dormitory. Each is a price a
 * night before the town's taxes, which apply as they do to a hotel. A chain's
 * "from" price is its cheapest night, not an average, and says so. A hostel's
 * bed is sold by the person; the rest by the room. Where no figure was read,
 * the kind isn't offered in that town, rather than guessed. Resort towns and
 * rural ones had too few published figures to keep (the research's own list).
 */

export type StayClass = 'hotel' | 'budget' | 'motel' | 'extended' | 'hostel';

export interface StayOption {
  cls: Exclude<StayClass, 'hotel'>;
  perNight: number;
  currency: string;
  /** By the room, or a bed by the person. */
  per: 'room' | 'bed';
  basis: string;
  confirmed: boolean;
}

export const STAY_CLASS_LABEL: Readonly<Record<StayClass, string>> = {
  hostel: 'A Hostel Bed',
  motel: 'A Motel',
  budget: 'A Budget Hotel',
  hotel: 'A Hotel',
  extended: 'An Extended-Stay Suite',
};

export const STAY_OPTIONS: Readonly<Record<string, readonly StayOption[]>> = {
  'us-ny-newyork': [
    { cls: 'hostel', perNight: 53.1, currency: 'USD', per: 'bed', basis: 'HI New York City Hostel’s dormitory bed on Hostelworld, 2026-09-30', confirmed: true },
    { cls: 'extended', perNight: 521, currency: 'USD', per: 'room', basis: 'Residence Inn Times Square’s “from” rate, read from an excerpt of Marriott’s page', confirmed: false },
  ],
  'us-ct-newhaven': [
    { cls: 'motel', perNight: 87, currency: 'USD', per: 'room', basis: 'Super 8 Milford/New Haven, read from an excerpt', confirmed: false },
  ],
  'us-ca-losangeles': [
    { cls: 'hostel', perNight: 29, currency: 'USD', per: 'bed', basis: 'A Los Angeles hostel dormitory bed on Hostelworld, 2026-09-30', confirmed: true },
    { cls: 'motel', perNight: 84, currency: 'USD', per: 'room', basis: 'A Los Angeles motel, read from an excerpt', confirmed: false },
  ],
  'uk-eng-london': [
    { cls: 'hostel', perNight: 18.93, currency: 'USD', per: 'bed', basis: 'A London hostel dormitory bed on Hostelworld, shown in dollars, 2026-09-30', confirmed: true },
    { cls: 'budget', perNight: 45, currency: 'GBP', per: 'room', basis: 'Premier Inn London’s “from” price, its cheapest night, read from an excerpt', confirmed: false },
  ],
  'uk-sct-edinburgh': [
    { cls: 'extended', perNight: 248, currency: 'USD', per: 'room', basis: 'An Edinburgh serviced apartment’s average, in dollars, read from an excerpt', confirmed: false },
  ],
  'ie-lei-dublin': [
    { cls: 'budget', perNight: 68, currency: 'EUR', per: 'room', basis: 'Maldron Hotel Dublin’s “from” price, its cheapest night, read from an excerpt', confirmed: false },
    { cls: 'extended', perNight: 160, currency: 'EUR', per: 'room', basis: 'A Dublin serviced apartment (Staycity), read from an excerpt', confirmed: false },
  ],
  'ca-on-toronto': [
    { cls: 'hostel', perNight: 42.22, currency: 'USD', per: 'bed', basis: 'Toronto hostels’ average on Hostelworld, shown in dollars, 2026-09-30', confirmed: true },
  ],
  'ca-bc-vancouver': [
    { cls: 'hostel', perNight: 30.07, currency: 'USD', per: 'bed', basis: 'Vancouver hostels’ average on Hostelworld, shown in dollars, 2026-09-30', confirmed: true },
  ],
  'mx-cmx-mexicocity': [
    { cls: 'hostel', perNight: 15.76, currency: 'USD', per: 'bed', basis: 'Mexico City hostels’ dormitory bed on Hostelworld, shown in dollars, 2026-09-30', confirmed: true },
  ],
};

/**
 * A rate plan: flexible, refunded to a day before arrival and then less its
 * first night, or paid ahead and not refunded, for the middle of the 8% to
 * 15% off hotels commonly give for it (Hilton's advance purchase, read from an
 * excerpt; SLATE's middle). A no-show on a flexible rate forfeits the first
 * night and has the rest released; on a prepaid one, all of it.
 */
export type RatePlan = 'flexible' | 'prepaid';
export const PREPAID_OFF = (0.08 + 0.15) / 2;

/** Valet parking a night at a New York City hotel, the middle of the $75 to $95 its hotels list; elsewhere none was read. */
export const HOTEL_PARKING: Readonly<Record<string, { perNight: number; currency: string; basis: string }>> = {
  'us-ny-newyork': { perNight: 85, currency: 'USD', basis: 'the middle of the $75 to $95 a night New York City hotels list for valet parking' },
};
