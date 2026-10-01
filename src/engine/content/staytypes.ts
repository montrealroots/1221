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

export type StayClass = 'hotel' | 'budget' | 'motel' | 'extended' | 'hostel' | 'campground' | 'street';

export interface StayOption {
  cls: Exclude<StayClass, 'hotel' | 'campground' | 'street'>;
  perNight: number;
  currency: string;
  /** By the room, or a bed by the person. */
  per: 'room' | 'bed';
  basis: string;
  confirmed: boolean;
}

export const STAY_CLASS_LABEL: Readonly<Record<StayClass, string>> = {
  street: 'The Street, In Your Motorhome',
  hostel: 'A Hostel Bed',
  motel: 'A Motel',
  budget: 'A Budget Hotel',
  hotel: 'A Hotel',
  extended: 'An Extended-Stay Suite',
  campground: 'A Campground, In Your Motorhome',
};

/**
 * A night at a campground's hookup site, for a journey made in one's own
 * motorhome or campervan (from 2026-09-30), from
 * `docs/research/world/research-kind-effects.json`, by where the town is. Each
 * is a named park's published fee, taxes in it, and says which; a
 * non-resident's surcharge where the park publishes one. The campground is
 * the region's, not the town's own: New York City has no state park to camp
 * in, and SLATE takes the state's fee. Britain's clubs publish no site's
 * price, and Connecticut's wasn't read: none is kept there.
 *
 * By the night's date, from later on 2026-09-30 (`research-sweep3.json`);
 * until then every night was the peak's:
 * - Rathtrevor Beach: $51 from 15 June to 7 September, $35 in the shoulder
 *   and $13 in winter, open all year. Its winter, mid-October to mid-March,
 *   was read only from an excerpt, as were its shoulder dates ("remaining
 *   months").
 * - New York State Parks: $4 more a Friday or Saturday night. The night
 *   before a holiday isn't kept.
 * - Carrowkeel, at Ballyvary in County Mayo: a pitch €15 outside July and
 *   August, and closed from 2 October to 31 March.
 * - Ontario Parks' and Lake Perris's fees don't vary by season.
 * The non-resident's surcharge applies all year where one is published.
 */
export const CAMPGROUNDS: Readonly<Record<string, { perNight: number; visitorExtra?: number; currency: string; basis: string; confirmed: boolean; /** A night's fee by its date, or null where the park is closed. */ night?: (month: number, day: number, weekday: number) => number | null; closed?: string }>> = {
  'US-NY': { perNight: 17 + 7, visitorExtra: 5, currency: 'USD', basis: 'New York State Parks’ $17 campsite and $7 for electric, $4 more on a Friday or Saturday night, $5 more for someone from out of state', confirmed: true, night: (_m, _d, weekday) => 17 + 7 + (weekday === 5 || weekday === 6 ? 4 : 0) },
  'US-CA': { perNight: 45, currency: 'USD', basis: 'Lake Perris State Recreation Area’s RV hookup site', confirmed: true },
  'CA-ON': { perNight: (59.33 + 53.68 + 49.44 + 43.79) / 4, currency: 'CAD', basis: 'The middle of Ontario Parks’ four fee levels for an electrical site, HST in it', confirmed: true },
  'CA-BC': { perNight: 51, visitorExtra: 20, currency: 'CAD', basis: 'Rathtrevor Beach Provincial Park’s $51 from 15 June to 7 September, $35 in the shoulder and $13 in winter, $20 more for a non-resident', confirmed: true, night: (m, d) => ((m === 6 && d >= 15) || m === 7 || m === 8 || (m === 9 && d <= 7) ? 51 : (m === 10 && d >= 15) || m === 11 || m === 12 || m === 1 || m === 2 || (m === 3 && d < 15) ? 13 : 35) },
  IE: { perNight: 20 + 6 + 5, currency: 'EUR', basis: 'Carrowkeel’s pitch, €20 in July and August and €15 otherwise, with one adult’s €6 and €5 for electricity', confirmed: true, night: (m, d) => (m < 4 || m > 10 || (m === 10 && d > 1) ? null : (m === 7 || m === 8 ? 20 : 15) + 6 + 5), closed: 'Carrowkeel is open from 1 April to 1 October.' },
  'MX-CMX': { perNight: 300, currency: 'MXN', basis: 'About MXN 300 at an RV park near Mexico City, from travelers’ reports', confirmed: false },
};

/**
 * A night in one's own motorhome or campervan parked on the street, from
 * 2026-09-30 (`docs/research/world/research-vehicles5.json`), free where a
 * city's rules let it stand overnight, for as many nights as a vehicle may
 * stand in one spot. SLATE doesn't move it during a stay. New York City has
 * no rule against an RV overnight on NYC311, and no vehicle stays in one spot
 * more than seven days. The 24-hour limit that search results quote from 34
 * RCNY 4-08 for a "mobile home" wasn't read, as its page refused, and isn't
 * kept.
 */
export const STREET_NIGHTS: Readonly<Record<string, { nights: number; basis: string }>> = {
  'us-ny-newyork': { nights: 7, basis: 'No New York City rule bars an RV overnight (NYC311), and no vehicle stays in one spot more than seven days' },
};

/** Where a city's rules keep it off the street overnight, or SLATE couldn't read them: why, said where it's asked. */
export const STREET_REFUSED: Readonly<Record<string, string>> = {
  'ca-on-toronto': 'Toronto’s Municipal Code (950-400D(5)) lets no vehicle stand on a road more than three hours unless signs say otherwise.',
  'ca-bc-vancouver': 'Vancouver keeps a large vehicle, taller than 2.2 m or longer than 6.4 m, off its residential streets from 10 p.m. to 6 a.m. (from search excerpts of the city’s page).',
  'us-ca-losangeles': 'Los Angeles bars an oversize vehicle from 2 to 6 a.m. where posted, and whether its ban on living in a vehicle overnight (LAMC 85.02) still stands couldn’t be read, so SLATE doesn’t offer it.',
  'uk-eng-london': 'London’s boroughs each set their own rules, and SLATE couldn’t read one, so it doesn’t offer it.',
};

export const STAY_OPTIONS: Readonly<Record<string, readonly StayOption[]>> = {
  'ca-02-victoria': [
    { cls: 'hostel', perNight: 36.42, currency: 'USD', per: 'bed', basis: 'Ocean Island Inn’s dormitory bed on Hostelworld, 2026-09-30', confirmed: true },
  ],
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
